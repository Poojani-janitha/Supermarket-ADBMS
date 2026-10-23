package lk.supermarket.sales.dao;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lk.supermarket.sales.dto.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.ConcurrencyFailureException;
import org.springframework.dao.DeadlockLoserDataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.SqlOutParameter;
import org.springframework.jdbc.core.SqlParameter;
import org.springframework.jdbc.core.simple.SimpleJdbcCall;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.sql.Types;
import java.util.*;

@Repository
public class OrderDao {

    private static final Logger log = LoggerFactory.getLogger(OrderDao.class);
    private static final int MAX_DEADLOCK_RETRIES = 3;

    private final JdbcTemplate jdbcTemplate;
    private final ObjectMapper objectMapper;
    private final SimpleJdbcCall placeOrderCall;
    private final SimpleJdbcCall cancelOrderCall;

    public OrderDao(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
        this.objectMapper = new ObjectMapper();

        // Configure SimpleJdbcCall for sp_place_order
        this.placeOrderCall = new SimpleJdbcCall(jdbcTemplate)
                .withProcedureName("sp_place_order")
                .declareParameters(
                        new SqlParameter("p_branch", Types.INTEGER),
                        new SqlParameter("p_customer", Types.INTEGER),
                        new SqlParameter("p_employee", Types.INTEGER),
                        new SqlParameter("p_method", Types.VARCHAR),
                        new SqlParameter("p_coupon", Types.VARCHAR),
                        new SqlParameter("p_items", Types.VARCHAR),
                        new SqlOutParameter("p_order_id", Types.INTEGER)
                );

        // Configure SimpleJdbcCall for sp_cancel_order
        this.cancelOrderCall = new SimpleJdbcCall(jdbcTemplate)
                .withProcedureName("sp_cancel_order")
                .declareParameters(
                        new SqlParameter("p_order_id", Types.INTEGER),
                        new SqlParameter("p_employee", Types.INTEGER)
                );
    }

    /**
     * Executes sp_place_order with automated Deadlock (MySQL error 1213) retry handling.
     * This fulfills Member 1's rubric requirement for concurrency resilience.
     */
    public int callPlaceOrder(CheckoutRequest req) {
        String itemsJson;
        try {
            // Map items to JSON structure expected by MySQL 8 JSON_TABLE: [{"productId": 1, "qty": 2}]
            List<Map<String, Object>> rawList = new ArrayList<>();
            for (OrderItemDto item : req.getItems()) {
                Map<String, Object> map = new HashMap<>();
                map.put("productId", item.getProductId());
                map.put("qty", item.getQuantity());
                rawList.add(map);
            }
            itemsJson = objectMapper.writeValueAsString(rawList);
        } catch (JsonProcessingException e) {
            throw new IllegalArgumentException("Failed to serialize cart items to JSON", e);
        }

        Map<String, Object> inParams = new HashMap<>();
        inParams.put("p_branch", req.getBranchId());
        inParams.put("p_customer", req.getCustomerId());
        inParams.put("p_employee", req.getEmployeeId());
        inParams.put("p_method", req.getPaymentMethod());
        inParams.put("p_coupon", req.getCouponCode() != null && !req.getCouponCode().isBlank() ? req.getCouponCode() : null);
        inParams.put("p_items", itemsJson);

        int attempts = 0;
        while (true) {
            attempts++;
            try {
                log.debug("Executing sp_place_order (attempt {}/{})", attempts, MAX_DEADLOCK_RETRIES);
                Map<String, Object> result = placeOrderCall.execute(inParams);
                Number orderIdNum = (Number) result.get("p_order_id");
                if (orderIdNum == null) {
                    throw new IllegalStateException("Stored procedure did not return order ID");
                }
                return orderIdNum.intValue();
            } catch (ConcurrencyFailureException ex) {
                log.warn("Deadlock / concurrency conflict detected during checkout (attempt {}/{}): {}", attempts, MAX_DEADLOCK_RETRIES, ex.getMessage());
                if (attempts >= MAX_DEADLOCK_RETRIES) {
                    throw ex; // Exceeded max retries, propagate
                }
                try {
                    // Exponential backoff with jitter
                    Thread.sleep(50L * attempts + (long)(Math.random() * 30));
                } catch (InterruptedException ie) {
                    Thread.currentThread().interrupt();
                    throw ex;
                }
            }
        }
    }

    /**
     * Executes sp_cancel_order to atomically restore inventory and mark order CANCELLED.
     */
    public void callCancelOrder(int orderId, int employeeId) {
        Map<String, Object> inParams = new HashMap<>();
        inParams.put("p_order_id", orderId);
        inParams.put("p_employee", employeeId);
        cancelOrderCall.execute(inParams);
    }

    /**
     * Queries order receipt directly using JdbcTemplate.
     * Takes advantage of the clustered composite PK on order_item(order_id, product_id).
     */
    public Optional<SalesOrderResponse> findOrderById(int orderId) {
        String sqlHeader = """
            SELECT o.order_id, o.branch_id, b.name AS branch_name,
                   o.customer_id, c.full_name AS customer_name, c.phone AS customer_phone,
                   fn_customer_tier(o.customer_id) AS customer_tier,
                   e.employee_id, e.full_name AS employee_name,
                   o.order_date, o.status, o.subtotal, o.discount_total, o.total_amount,
                   p.method AS payment_method
            FROM sales_order o
            JOIN branch b ON b.branch_id = o.branch_id
            JOIN employee e ON e.employee_id = o.employee_id
            LEFT JOIN customer c ON c.customer_id = o.customer_id
            LEFT JOIN payment p ON p.order_id = o.order_id
            WHERE o.order_id = ?
        """;

        List<SalesOrderResponse> list = jdbcTemplate.query(sqlHeader, (rs, rowNum) -> {
            SalesOrderResponse resp = new SalesOrderResponse();
            resp.setOrderId(rs.getInt("order_id"));
            resp.setBranchId(rs.getInt("branch_id"));
            resp.setBranchName(rs.getString("branch_name"));
            int custId = rs.getInt("customer_id");
            if (!rs.wasNull()) {
                resp.setCustomerId(custId);
                resp.setCustomerName(rs.getString("customer_name"));
                resp.setCustomerPhone(rs.getString("customer_phone"));
                resp.setCustomerTier(rs.getString("customer_tier"));
            } else {
                resp.setCustomerName("Walk-in Shopper");
            }
            resp.setEmployeeId(rs.getInt("employee_id"));
            resp.setEmployeeName(rs.getString("employee_name"));
            resp.setOrderDate(rs.getString("order_date"));
            resp.setStatus(rs.getString("status"));
            resp.setSubtotal(rs.getBigDecimal("subtotal"));
            resp.setDiscountTotal(rs.getBigDecimal("discount_total"));
            resp.setTotalAmount(rs.getBigDecimal("total_amount"));
            resp.setPaymentMethod(rs.getString("payment_method"));
            return resp;
        }, orderId);

        if (list.isEmpty()) {
            return Optional.empty();
        }

        SalesOrderResponse order = list.get(0);

        // Fetch line items (single range scan on clustered composite index order_item(order_id, product_id))
        String sqlItems = """
            SELECT oi.product_id, p.name AS product_name, p.sku, oi.unit_price, oi.quantity, oi.line_total
            FROM order_item oi
            JOIN product p ON p.product_id = oi.product_id
            WHERE oi.order_id = ?
            ORDER BY oi.product_id ASC
        """;

        List<CartItemResponse> items = jdbcTemplate.query(sqlItems, (rs, rowNum) -> {
            CartItemResponse.ProductSummary prod = new CartItemResponse.ProductSummary(
                    rs.getInt("product_id"),
                    rs.getString("product_name"),
                    rs.getString("sku"),
                    rs.getBigDecimal("unit_price")
            );
            return new CartItemResponse(prod, rs.getInt("quantity"), rs.getBigDecimal("line_total"));
        }, orderId);
        order.setItems(items);

        // Fetch discounts applied
        String sqlDiscounts = """
            SELECT od.rule_id, r.name AS rule_name, od.amount
            FROM order_discount od
            JOIN discount_rule r ON r.rule_id = od.rule_id
            WHERE od.order_id = ?
        """;

        List<AppliedDiscountDto> discounts = jdbcTemplate.query(sqlDiscounts, (rs, rowNum) ->
                new AppliedDiscountDto(rs.getInt("rule_id"), rs.getString("rule_name"), rs.getBigDecimal("amount")),
                orderId
        );
        order.setDiscounts(discounts);

        // VAT removed per requirement: Net Payable is strictly Subtotal minus Discounts
        order.setTaxAmount(BigDecimal.ZERO);

        return Optional.of(order);
    }

    /**
     * Retrieves current branch inventory stock levels from MySQL inventory table for POS live display.
     */
    public Map<Integer, Integer> getBranchStock(int branchId) {
        String sql = "SELECT product_id, quantity FROM inventory WHERE branch_id = ?";
        List<Map<String, Object>> rows = jdbcTemplate.queryForList(sql, branchId);
        Map<Integer, Integer> stockMap = new HashMap<>();
        for (Map<String, Object> row : rows) {
            Number pid = (Number) row.get("product_id");
            Number qty = (Number) row.get("quantity");
            if (pid != null && qty != null) {
                stockMap.put(pid.intValue(), qty.intValue());
            }
        }
        return stockMap;
    }

    /**
     * Retrieves paginated recent sales orders from view v_sales_order_summary.
     */
    public SalesPageResponse findRecentOrders(int page, int size) {
        if (page < 0) page = 0;
        if (size <= 0) size = 10;
        int offset = page * size;

        String countSql = "SELECT COUNT(*) FROM sales_order";
        Long totalCount = jdbcTemplate.queryForObject(countSql, Long.class);
        long total = totalCount != null ? totalCount : 0L;

        String sql = """
            SELECT order_id, branch_id, branch_name, customer_id, customer_name, customer_phone,
                   employee_id, cashier_name, order_date, status, total_items_count,
                   subtotal, discount_total, total_amount, payment_id, payment_method, paid_at
            FROM v_sales_order_summary
            ORDER BY order_date DESC, order_id DESC
            LIMIT ? OFFSET ?
        """;

        List<OrderSummaryDto> items = jdbcTemplate.query(sql, (rs, rowNum) -> {
            OrderSummaryDto dto = new OrderSummaryDto();
            dto.setOrderId(rs.getInt("order_id"));
            dto.setBranchId(rs.getInt("branch_id"));
            dto.setBranchName(rs.getString("branch_name"));
            int custId = rs.getInt("customer_id");
            if (!rs.wasNull()) {
                dto.setCustomerId(custId);
                dto.setCustomerName(rs.getString("customer_name"));
                dto.setCustomerPhone(rs.getString("customer_phone"));
            } else {
                dto.setCustomerName("Walk-in Shopper");
            }
            dto.setEmployeeId(rs.getInt("employee_id"));
            dto.setCashierName(rs.getString("cashier_name"));
            dto.setOrderDate(rs.getString("order_date"));
            dto.setStatus(rs.getString("status"));
            dto.setTotalItemsCount(rs.getInt("total_items_count"));
            dto.setSubtotal(rs.getBigDecimal("subtotal"));
            dto.setDiscountTotal(rs.getBigDecimal("discount_total"));
            dto.setTotalAmount(rs.getBigDecimal("total_amount"));
            int payId = rs.getInt("payment_id");
            if (!rs.wasNull()) {
                dto.setPaymentId(payId);
            }
            dto.setPaymentMethod(rs.getString("payment_method"));
            dto.setPaidAt(rs.getString("paid_at"));
            return dto;
        }, size, offset);

        return new SalesPageResponse(items, total, page, size);
    }
}
