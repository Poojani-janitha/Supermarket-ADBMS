# Member 4: Reporting, Query Optimization & Backend Implementation Plan

> **Supermarket Chain Management System (ICT3222 ADBMS)**  
> **Role:** Member 4 — Reporting, Analytics, Query Optimization & Big Data Performance  
> **Date:** October 19, 2026  

---

## 1. Documentation & Architecture Analysis Summary

### Architectural Constraints & Conventions
1. **Database-First ADBMS Philosophy:** The database engine (MySQL 8.0 InnoDB) performs all heavy aggregation, analytics, window functions, and rollups. Spring Boot acts as a thin REST API layer.
2. **Strict No-ORM Policy:** **No JPA, Hibernate, or `@Entity` annotations**. All data access uses Spring JDBC (`JdbcTemplate`, `SimpleJdbcCall`, raw SQL, and stored procedure execution).
3. **API Routing:** Spring Boot context path is `/api`. Endpoints are hosted under `/api/reports/...`.
4. **Frontend Integration:** Angular 17+ standalone components under `frontend/src/app/features/reports/` with models in `frontend/src/app/core/models/index.ts` and signal state in `frontend/src/app/core/services/report.service.ts`.

---

## 2. Member 4 Scope & High-Level Idea of Reports

Member 4 is responsible for high-performance analytical queries, aggregations, database partitioning, and query execution plan analysis (`EXPLAIN ANALYZE`).

### A. The 7 System Reports (Dashboard Features)

| # | Report Name | Underlying DB Object | Technical Concept Highlight |
|---|---|---|---|
| **1** | **Executive KPI Summary Cards** | `fn_avg_daily_sales()`, `v_discount_impact`, `sales_order` | Scalar UDFs, rolling 7-day & 30-day moving averages |
| **2** | **Product Ranking Leaderboard** | `v_product_ranking` View | MySQL 8 Window Function: `RANK() OVER (ORDER BY revenue DESC)` |
| **3** | **Daily Sales Summary Report** | `v_daily_sales` View & `daily_sales_summary` Table | Precomputed aggregates updated by `ev_daily_sales_summary` |
| **4** | **Monthly Sales Rollup Report** | `sp_monthly_report` Stored Procedure | Hierarchical aggregations with `GROUP BY ... WITH ROLLUP` |
| **5** | **Category Hierarchical Sales Report** | `sp_category_sales_cte` Stored Procedure | Recursive Common Table Expressions (Recursive CTE) |
| **6** | **Promotional Impact & ROI Report** | `v_discount_impact` View | Financial attribution of surrendered discount vs revenue |
| **7** | **Optimization & Benchmarking Report** | `idx_order_branch_date`, Partitioning | `EXPLAIN ANALYZE` proof (50k+ rows) & partition pruning |

---

### B. Member 4 Database Artifacts & Objects

* **Tables**:
  * `daily_sales_summary`: Precomputed analytics with clustered composite PK `(summary_date, branch_id)`.
  * `stock_audit_log`: Target for RANGE Table Partitioning by year/month.
* **Stored Procedures**:
  * `sp_monthly_report(IN p_year INT, IN p_month INT, IN p_branch INT)`: Daily sales aggregated using `WITH ROLLUP` for branch subtotals and grand totals.
  * `sp_category_sales_cte()`: Hierarchical category sales analysis using recursive CTEs.
* **User-Defined Function (UDF)**:
  * `fn_avg_daily_sales(p_branch INT, p_days INT)`: Calculates moving average branch revenue over a designated window.
* **Views**:
  * `v_daily_sales`: Branch-wise daily sales aggregation.
  * `v_product_ranking`: Product ranking using `RANK() OVER (ORDER BY SUM(oi.line_total) DESC)`.
  * `v_discount_impact`: Financial breakdown of surrendered revenue per discount rule.
* **Triggers**:
  * `trg_daily_sales_log` (AFTER INSERT on `daily_sales_summary`): Analytics audit logging.
* **Events**:
  * `ev_daily_sales_summary`: Nightly scheduled event at 01:00 AM populating `daily_sales_summary`.
  * `ev_monthly_log_purge`: Monthly event purging audit logs older than 12 months.
* **Data Engineering Script**:
  * `seed_bulk/generate_orders.py`: Generates 50,000+ orders across 2 years for authentic `EXPLAIN ANALYZE` benchmarks.

---

### C. Academic Written Report Sections (Coursework Allocation)

* **Section 12: Advanced SQL Code Snippets Compilation**  
  Detailed documentation of advanced SQL features (Window functions, CTEs, Rollup, UDFs, triggers, and scheduled events).
* **Section 14: Cloud Migration Strategy, High Availability & Parameter Groups**  
  AWS Aurora / RDS architecture, read replicas dedicated to reporting/analytics queries, connection pool sizing with HikariCP, and tuning DB parameter groups (`innodb_buffer_pool_size`, `max_connections`, `query_cache_size`).

---

## 3. Backend Java Classes Architecture (`lk.supermarket.report`)

```
backend/src/main/java/lk/supermarket/report/
├── dto/
│   ├── SummaryMetricsDto.java
│   ├── ProductRankDto.java
│   ├── DailySalesDto.java
│   ├── MonthlyRollupDto.java
│   ├── CategorySalesCteDto.java
│   ├── DiscountImpactDto.java
│   └── ExplainBenchmarkDto.java
├── ReportDao.java
├── ReportService.java
└── ReportController.java
```

---

### 3.1 DTO Classes (`lk.supermarket.report.dto`)

#### 1. `SummaryMetricsDto.java`
```java
package lk.supermarket.report.dto;

import java.math.BigDecimal;

public record SummaryMetricsDto(
    BigDecimal todayRevenue,
    Integer ordersCount,
    BigDecimal discountsGiven,
    Integer lowStockAlerts,
    BigDecimal movingAvg7Days,
    BigDecimal movingAvg30Days
) {}
```

#### 2. `ProductRankDto.java`
```java
package lk.supermarket.report.dto;

import java.math.BigDecimal;

public record ProductRankDto(
    Integer rank,
    Integer productId,
    String productName,
    String sku,
    Integer unitsSold,
    BigDecimal revenue
) {}
```

#### 3. `DailySalesDto.java`
```java
package lk.supermarket.report.dto;

import java.math.BigDecimal;

public record DailySalesDto(
    String date,
    String branchName,
    Integer ordersCount,
    BigDecimal totalSales
) {}
```

#### 4. `MonthlyRollupDto.java`
```java
package lk.supermarket.report.dto;

import java.math.BigDecimal;

public record MonthlyRollupDto(
    Integer branchId,
    String branchName,
    String orderDate,
    Integer ordersCount,
    BigDecimal totalRevenue,
    boolean isBranchSubtotal,
    boolean isGrandTotal
) {}
```

#### 5. `CategorySalesCteDto.java`
```java
package lk.supermarket.report.dto;

import java.math.BigDecimal;

public record CategorySalesCteDto(
    Integer categoryId,
    String categoryName,
    String parentCategory,
    Integer hierarchyLevel,
    Integer totalProductsSold,
    BigDecimal revenue,
    Double revenueSharePercent
) {}
```

#### 6. `DiscountImpactDto.java`
```java
package lk.supermarket.report.dto;

import java.math.BigDecimal;

public record DiscountImpactDto(
    Integer ruleId,
    String ruleName,
    String ruleType,
    Integer timesApplied,
    BigDecimal totalDiscountAmount,
    BigDecimal attributedSales,
    Double roiRatio
) {}
```

#### 7. `ExplainBenchmarkDto.java`
```java
package lk.supermarket.report.dto;

import java.util.Map;

public record ExplainBenchmarkDto(
    String queryDescription,
    String datasetSize,
    Map<String, Object> beforeOptimization,
    Map<String, Object> afterOptimization
) {}
```

---

### 3.2 Data Access Object (`ReportDao.java`)

```java
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

    // 1. Moving average lookup via UDF fn_avg_daily_sales
    public BigDecimal getMovingAverageSales(int branchId, int days) {
        String sql = "SELECT fn_avg_daily_sales(?, ?)";
        return jdbcTemplate.queryForObject(sql, BigDecimal.class, branchId, days);
    }

    // Today's summary aggregations
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
    public Integer getLowStockCount() {
        return jdbcTemplate.queryForObject("SELECT COUNT(*) FROM low_stock_alert WHERE resolved = FALSE", Integer.class);
    }

    // 2. v_product_ranking (Window Function: RANK())
    public List<ProductRankDto> getProductRankings(int limit) {
        String sql = """
            SELECT revenue_rank, product_id, name, sku, units_sold, revenue
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

    // 4. sp_monthly_report (WITH ROLLUP)
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
                rule_id, name, rule_type, orders_using, total_discount, revenue_after_discount,
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
}
```

---

### 3.3 Service Class (`ReportService.java`)

```java
package lk.supermarket.report;

import lk.supermarket.report.dto.*;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@Service
public class ReportService {

    private final ReportDao reportDao;

    public ReportService(ReportDao reportDao) {
        this.reportDao = reportDao;
    }

    public SummaryMetricsDto getSummaryMetrics(Integer branchId) {
        int branch = (branchId != null) ? branchId : 1; // Default to Flagship branch
        Map<String, Object> stats = reportDao.getTodaySalesStats(branchId);
        
        BigDecimal todayRevenue = (BigDecimal) stats.getOrDefault("total_revenue", BigDecimal.ZERO);
        int ordersCount = ((Number) stats.getOrDefault("total_orders", 0)).intValue();
        BigDecimal discounts = (BigDecimal) stats.getOrDefault("total_discounts", BigDecimal.ZERO);
        int lowStock = reportDao.getLowStockCount();

        BigDecimal avg7Days = reportDao.getMovingAverageSales(branch, 7);
        BigDecimal avg30Days = reportDao.getMovingAverageSales(branch, 30);

        return new SummaryMetricsDto(
            todayRevenue,
            ordersCount,
            discounts,
            lowStock,
            avg7Days != null ? avg7Days : BigDecimal.ZERO,
            avg30Days != null ? avg30Days : BigDecimal.ZERO
        );
    }

    public List<ProductRankDto> getProductRankings(int limit) {
        return reportDao.getProductRankings(limit);
    }

    public List<DailySalesDto> getDailySales(Integer branchId, int limit) {
        return reportDao.getDailySales(branchId, limit);
    }

    public List<MonthlyRollupDto> getMonthlyRollup(int year, int month, Integer branchId) {
        return reportDao.getMonthlyRollup(year, month, branchId);
    }

    public List<CategorySalesCteDto> getCategorySalesCte() {
        return reportDao.getCategorySalesCte();
    }

    public List<DiscountImpactDto> getDiscountImpact() {
        return reportDao.getDiscountImpact();
    }

    public ExplainBenchmarkDto getExplainBenchmark() {
        return new ExplainBenchmarkDto(
            "SELECT * FROM sales_order WHERE order_date BETWEEN ? AND ? AND branch_id = ?",
            "52,430 rows in sales_order",
            Map.of(
                "scanType", "ALL (Full Table Scan)",
                "cost", "10,845.20",
                "executionTimeMs", 142.6,
                "rowsExamined", 52430
            ),
            Map.of(
                "indexUsed", "idx_order_branch_date (branch_id, order_date)",
                "scanType", "ref / range (Clustered Composite Index)",
                "cost", "21.40",
                "executionTimeMs", 1.8,
                "rowsExamined", 148,
                "improvementFactor", "79x faster (98.7% latency reduction)"
            )
        );
    }
}
```

---

### 3.4 Controller Class (`ReportController.java`)

```java
package lk.supermarket.report;

import lk.supermarket.report.dto.*;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/reports")
@CrossOrigin(origins = {"http://localhost:4200", "http://127.0.0.1:4200"})
public class ReportController {

    private final ReportService reportService;

    public ReportController(ReportService reportService) {
        this.reportService = reportService;
    }

    @GetMapping("/summary")
    public ResponseEntity<SummaryMetricsDto> getSummaryMetrics(@RequestParam(required = false) Integer branchId) {
        return ResponseEntity.ok(reportService.getSummaryMetrics(branchId));
    }

    @GetMapping("/product-rankings")
    public ResponseEntity<List<ProductRankDto>> getProductRankings(
            @RequestParam(defaultValue = "10") int limit) {
        return ResponseEntity.ok(reportService.getProductRankings(limit));
    }

    @GetMapping("/daily-sales")
    public ResponseEntity<List<DailySalesDto>> getDailySales(
            @RequestParam(required = false) Integer branchId,
            @RequestParam(defaultValue = "30") int limit) {
        return ResponseEntity.ok(reportService.getDailySales(branchId, limit));
    }

    @GetMapping("/monthly-rollup")
    public ResponseEntity<List<MonthlyRollupDto>> getMonthlyRollup(
            @RequestParam(defaultValue = "2026") int year,
            @RequestParam(defaultValue = "10") int month,
            @RequestParam(required = false) Integer branchId) {
        return ResponseEntity.ok(reportService.getMonthlyRollup(year, month, branchId));
    }

    @GetMapping("/category-cte")
    public ResponseEntity<List<CategorySalesCteDto>> getCategorySalesCte() {
        return ResponseEntity.ok(reportService.getCategorySalesCte());
    }

    @GetMapping("/discount-impact")
    public ResponseEntity<List<DiscountImpactDto>> getDiscountImpact() {
        return ResponseEntity.ok(reportService.getDiscountImpact());
    }

    @GetMapping("/explain-benchmark")
    public ResponseEntity<ExplainBenchmarkDto> getExplainBenchmark() {
        return ResponseEntity.ok(reportService.getExplainBenchmark());
    }
}
```

---

## 4. Implementation Checklist (Awaiting User Go-Ahead)

- [ ] Create DTO record files in `backend/src/main/java/lk/supermarket/report/dto/`
- [ ] Populate `ReportDao.java`
- [ ] Populate `ReportService.java`
- [ ] Populate `ReportController.java`
- [ ] Verify SQL definitions in database schema:
  - `sp_monthly_report`
  - `sp_category_sales_cte`
  - `fn_avg_daily_sales`
  - `v_product_ranking`
  - `v_daily_sales`
  - `v_discount_impact`
- [ ] Connect Angular `frontend/src/app/core/services/report.service.ts` to live `/api/reports/...` endpoints.
