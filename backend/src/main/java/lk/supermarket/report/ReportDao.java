package lk.supermarket.report;

import lk.supermarket.report.dto.*;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@Repository
public class ReportDao {

    private final JdbcTemplate jdbcTemplate;

    public ReportDao(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    // 1. UDF fn_avg_daily_sales
    public BigDecimal getMovingAverageSales(int branchId, int days) {
        String query = "SELECT fn_avg_daily_sales(?, ?)";
        return jdbcTemplate.queryForObject(query, BigDecimal.class, branchId, days);
    }

    // Retrieve Today's Summary
    public Map<String, Object> getTodaySalesStats(Integer branchId) {
        String sql = """
            SELECT 
                COUNT(*) AS total_orders,
                COALESCE(SUM(total_amount), 0) AS total_revenue,
                COALESCE(SUM(discount_total), 0) AS total_discounts
            FROM sales_order
            WHERE status = 'COMPLETED' AND DATE(order_date) = CURDATE()
            """ + (branchId != null ? " AND branch_id = ?" : "");

        return branchId != null
            ? jdbcTemplate.queryForMap(sql, branchId)
            : jdbcTemplate.queryForMap(sql);
    }

    // Low-stock alert count
    public int getLowStockCount(Integer branchId) {
        if (branchId != null) {
            String sql = "SELECT COUNT(*) FROM low_stock_alert WHERE branch_id = ? AND resolved = FALSE";
            Integer count = jdbcTemplate.queryForObject(sql, Integer.class, branchId);
            return count != null ? count : 0;
        } else {
            String sql = "SELECT COUNT(*) FROM low_stock_alert WHERE resolved = FALSE";
            Integer count = jdbcTemplate.queryForObject(sql, Integer.class);
            return count != null ? count : 0;
        }
    }

    // 2. v_product_ranking (Window Function: RANK())
    public List<ProductRankDto> getProductRankings(int limit) {
        String sql = """
            SELECT 
                revenue_rank,
                product_id,
                name,
                sku,
                units_sold,
                revenue
            FROM v_product_ranking
            ORDER BY revenue_rank ASC
            LIMIT ?
            """;

        return jdbcTemplate.query(sql, (rs, rowNum) -> new ProductRankDto(
            rs.getInt("revenue_rank"),
            rs.getInt("product_id"),
            rs.getString("name"),
            rs.getString("sku"),
            rs.getInt("units_sold"),
            rs.getBigDecimal("revenue")
        ), limit);
    }

    // 3. v_daily_sales
    public List<DailySalesDto> getDailySales(Integer branchId, int limit) {
        String sql = """
            SELECT v.sale_date, b.name AS branch_name, v.orders, v.total_sales
            FROM v_daily_sales v 
            JOIN branch b ON b.branch_id = v.branch_id
            """ + (branchId != null ? " WHERE v.branch_id = ? " : "") + """
            ORDER BY v.sale_date DESC, v.total_sales DESC
            LIMIT ?
            """;

        RowMapper<DailySalesDto> mapper = (rs, rowNum) -> new DailySalesDto(
            rs.getString("sale_date"),
            rs.getString("branch_name"),
            rs.getInt("orders"),
            rs.getBigDecimal("total_sales")
        );

        return branchId != null
            ? jdbcTemplate.query(sql, mapper, branchId, limit)
            : jdbcTemplate.query(sql, mapper, limit);
    }

    // 4. sp_monthly_report (WITH ROLLUP) year, month, and branch wise
    public List<MonthlyRollupDto> getMonthlyRollup(int year, int month, Integer branchId) {
        String sql = "CALL sp_monthly_report(?, ?, ?)";
        return jdbcTemplate.query(sql, (rs, rowNum) -> {
            Integer bId = rs.getObject("branch_id", Integer.class);
            String bName = rs.getString("branch_name");
            String orderDate = rs.getString("day");
            int orders = rs.getInt("orders");
            BigDecimal sales = rs.getBigDecimal("sales");

            boolean isGrandTotal = (bId == null && orderDate == null);
            boolean isBranchSubtotal = (bId != null && orderDate == null);

            return new MonthlyRollupDto(
                bId,
                isGrandTotal ? "ALL BRANCHES CHAIN-WIDE (GRAND TOTAL)" :
                isBranchSubtotal ? (bName + " (Subtotal)") : bName,
                orderDate,
                orders,
                sales,
                isBranchSubtotal,
                isGrandTotal
            );
        }, year, month, branchId);
    }

    // 5. sp_category_sales_cte (Recursive CTE)
    public List<CategorySalesCteDto> getCategorySalesCte() {
        String sql = "CALL sp_category_sales_cte()";
        return jdbcTemplate.query(sql, (rs, rowNum) -> new CategorySalesCteDto(
            rs.getInt("category_id"),
            rs.getString("category_name"),
            rs.getString("parent_category"),
            rs.getInt("hierarchy_level"),
            rs.getInt("total_products_sold"),
            rs.getBigDecimal("revenue"),
            rs.getDouble("revenue_share_percent")
        ));
    }

    // 6. v_discount_impact
    public List<DiscountImpactDto> getDiscountImpact() {
        String sql = """
            SELECT
                rule_id,
                name,
                rule_type,
                orders_using,
                total_discount,
                revenue_after_discount,
                ROUND(revenue_after_discount / NULLIF(total_discount, 0), 1) AS roi_ratio
            FROM v_discount_impact
            ORDER BY total_discount DESC
            """;

        return jdbcTemplate.query(sql, (rs, rowNum) -> new DiscountImpactDto(
            rs.getInt("rule_id"),
            rs.getString("name"),
            rs.getString("rule_type"),
            rs.getInt("orders_using"),
            rs.getBigDecimal("total_discount"),
            rs.getBigDecimal("revenue_after_discount"),
            rs.getDouble("roi_ratio")
        ));
    }

    // 7. v_supplier_performance (Vendor fulfillment reliability & UDF fn_supplier_fulfillment_rate)
    public List<SupplierPerformanceDto> getSupplierPerformance() {
        String sql = """
            SELECT 
                supplier_id,
                supplier_name,
                contact_person,
                phone,
                city,
                total_orders,
                total_requested_qty,
                total_confirmed_qty,
                total_received_qty,
                total_spend,
                fulfillment_rate,
                rating_tier
            FROM v_supplier_performance
            ORDER BY fulfillment_rate DESC, total_spend DESC
            """;

        return jdbcTemplate.query(sql, (rs, rowNum) -> new SupplierPerformanceDto(
            rs.getInt("supplier_id"),
            rs.getString("supplier_name"),
            rs.getString("contact_person"),
            rs.getString("phone"),
            rs.getString("city"),
            rs.getInt("total_orders"),
            rs.getBigDecimal("total_requested_qty"),
            rs.getBigDecimal("total_confirmed_qty"),
            rs.getBigDecimal("total_received_qty"),
            rs.getBigDecimal("total_spend"),
            rs.getBigDecimal("fulfillment_rate"),
            rs.getString("rating_tier")
        ));
    }
}
