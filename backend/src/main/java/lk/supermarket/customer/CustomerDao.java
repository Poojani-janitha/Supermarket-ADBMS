package lk.supermarket.customer;

import java.util.List;
import java.util.Map;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.SqlOutParameter;
import org.springframework.jdbc.core.SqlParameter;
import org.springframework.jdbc.core.simple.SimpleJdbcCall;
import org.springframework.stereotype.Repository;

@Repository
public class CustomerDao {
    private final JdbcTemplate jdbcTemplate;

    public CustomerDao(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public List<Map<String, Object>> findCustomers() {
        return jdbcTemplate.queryForList("""
                SELECT customer_id, full_name, phone, email, loyalty_points, tier, registered_date
                FROM v_customer_directory
                ORDER BY full_name
                """);
    }

    public List<Map<String, Object>> findOrders(int customerId) {
        return jdbcTemplate.queryForList("""
                SELECT order_id, customer_id, order_date, status, subtotal,
                       discount_total, total_amount, item_count
                FROM v_customer_orders
                WHERE customer_id = ?
                ORDER BY order_date DESC
                """, customerId);
    }

    public Map<String, Object> findOrderDetails(int customerId, int orderId) {
        List<Map<String, Object>> orders = jdbcTemplate.queryForList("""
                SELECT o.order_id, o.customer_id, c.full_name AS customer_name,
                       c.phone AS customer_phone, b.name AS branch_name,
                       e.full_name AS employee_name, o.order_date, o.status,
                       o.subtotal, o.discount_total, o.total_amount,
                       COUNT(oi.product_id) AS item_count
                FROM sales_order o
                JOIN customer c ON c.customer_id = o.customer_id
                JOIN branch b ON b.branch_id = o.branch_id
                JOIN employee e ON e.employee_id = o.employee_id
                LEFT JOIN order_item oi ON oi.order_id = o.order_id
                WHERE o.customer_id = ? AND o.order_id = ?
                GROUP BY o.order_id, o.customer_id, c.full_name, c.phone,
                         b.name, e.full_name, o.order_date, o.status,
                         o.subtotal, o.discount_total, o.total_amount
                """, customerId, orderId);

        if (orders.isEmpty()) {
            throw new IllegalArgumentException("Order does not belong to this customer");
        }

        Map<String, Object> details = new java.util.LinkedHashMap<>(orders.get(0));
        details.put("items", jdbcTemplate.queryForList("""
                SELECT oi.product_id, p.name AS product_name, p.sku,
                       oi.quantity, oi.unit_price, oi.line_total
                FROM order_item oi
                JOIN product p ON p.product_id = oi.product_id
                WHERE oi.order_id = ?
                ORDER BY p.name
                """, orderId));
        details.put("payments", jdbcTemplate.queryForList("""
                SELECT payment_id, method, amount, paid_at
                FROM payment
                WHERE order_id = ?
                ORDER BY paid_at
                """, orderId));
        details.put("discounts", jdbcTemplate.queryForList("""
                SELECT od.rule_id, r.name AS rule_name, od.amount
                FROM order_discount od
                JOIN discount_rule r ON r.rule_id = od.rule_id
                WHERE od.order_id = ?
                ORDER BY od.amount DESC
                """, orderId));
        return details;
    }

    public Map<String, Object> updateOrderStatus(int customerId, int orderId, String status) {
        if (!"COMPLETED".equals(status) && !"CANCELLED".equals(status)) {
            throw new IllegalArgumentException("Order status must be COMPLETED or CANCELLED");
        }

        int updated = jdbcTemplate.update("""
                UPDATE sales_order
                SET status = ?
                WHERE order_id = ? AND customer_id = ?
                """, status, orderId, customerId);
        if (updated == 0) {
            throw new IllegalArgumentException("Order does not belong to this customer");
        }
        return jdbcTemplate.queryForMap("""
                SELECT order_id, customer_id, order_date, status, subtotal,
                       discount_total, total_amount,
                       (SELECT COUNT(*) FROM order_item WHERE order_id = o.order_id) AS item_count
                FROM sales_order o
                WHERE order_id = ?
                """, orderId);
    }

    public int registerCustomer(Map<String, ?> parameters) {
        SimpleJdbcCall call = new SimpleJdbcCall(jdbcTemplate)
                .withProcedureName("sp_register_customer")
                .declareParameters(
                        new SqlParameter("p_full_name", java.sql.Types.VARCHAR),
                        new SqlParameter("p_phone", java.sql.Types.VARCHAR),
                        new SqlParameter("p_email", java.sql.Types.VARCHAR),
                        new SqlOutParameter("p_customer_id", java.sql.Types.INTEGER));
        Number id = (Number) call.execute(parameters).get("p_customer_id");
        return id.intValue();
    }

    public Map<String, Object> updateCustomer(int customerId, Map<String, ?> request) {
        String fullName = request.get("fullName") == null ? "" : request.get("fullName").toString().trim();
        String phone = request.get("phone") == null ? "" : request.get("phone").toString().trim();
        String email = request.get("email") == null ? null : request.get("email").toString().trim();
        if (fullName.isBlank() || phone.isBlank()) {
            throw new IllegalArgumentException("Customer name and phone are required");
        }
        int updated = jdbcTemplate.update("""
                UPDATE customer
                SET full_name = ?, phone = ?, email = NULLIF(?, '')
                WHERE customer_id = ?
                """, fullName, phone, email, customerId);
        if (updated == 0) {
            throw new IllegalArgumentException("Customer does not exist");
        }
        return jdbcTemplate.queryForMap("""
                SELECT customer_id AS id, full_name AS fullName, phone, email,
                       loyalty_points AS loyaltyPoints,
                       fn_customer_tier(customer_id) AS tier,
                       registered_date AS registeredDate
                FROM customer
                WHERE customer_id = ?
                """, customerId);
    }
}
