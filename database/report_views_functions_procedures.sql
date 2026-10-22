USE supermarket_db;

-- ============================================================================
-- 1. VIEW: v_daily_sales
-- Aggregates completed sales per branch per day.
-- Leverages composite index: idx_order_branch_date (branch_id, order_date).
-- ============================================================================

create or replace view v_daily_sales AS
    select 
    branch_id,
    Date(order_date)as sale_date,
    count(*) AS orders,
     COALESCE(SUM(total_amount), 0.00) AS total_sales
from sales_order
where status ='COMPLETED'
group by branch_id,Date(order_date);



-- ============================================================================
-- 2. VIEW: v_product_ranking
-- Uses MySQL 8.0 Window Function: RANK() OVER (ORDER BY revenue DESC).
-- Matches ProductRankDto: includes product_id, name, sku, units_sold, revenue.
-- ============================================================================

create or replace view v_product_ranking as
select
    p.product_id,
    p.name as name,
    p.sku,
    COALESCE(SUM(oi.quantity), 0) AS units_sold,
    COALESCE(SUM(oi.line_total), 0.00) AS revenue,
    rank() over (order by COALESCE(SUM(oi.line_total), 0.00) DESC) AS revenue_rank -- windows function to rank the products by revenue

FROM product p
JOIN order_item oi ON oi.product_id = p.product_id
JOIN sales_order o ON o.order_id = oi.order_id AND o.status = 'COMPLETED'
GROUP BY p.product_id, p.name, p.sku;




-- ============================================================================
-- 3. VIEW: v_discount_impact
-- Analyzes promotional ROI and revenue attribution per discount rule.
-- ============================================================================

create or replace view v_discount_impact AS
select 
    r.rule_id,
    r.name,
    r.rule_type,
    count(distinct od.order_id) AS orders_using,
    COALESCE(SUM(od.amount), 0.00) AS total_discount,
    COALESCE(SUM(o.total_amount), 0.00) AS revenue_after_discount,
     ROUND(
        COALESCE(SUM(o.total_amount), 0.00) / NULLIF(SUM(od.amount), 0), 
        1
    ) AS roi_ratio
FROM order_discount od
JOIN discount_rule r ON r.rule_id = od.rule_id
JOIN sales_order o ON o.order_id = od.order_id AND o.status = 'COMPLETED'
GROUP BY r.rule_id, r.name, r.rule_type;

DELIMITER $$

-- ============================================================================
-- 4. FUNCTION: fn_avg_daily_sales
-- Calculates the rolling moving average sales over p_days.
-- Fast primary path: scans clustered PK on daily_sales_summary.
-- Fallback path: computes live from sales_order if summary table is pending.
-- ============================================================================

DROP FUNCTION IF EXISTS fn_avg_daily_sales$$

create function fn_avg_daily_sales(p_branch int, p_days int)
returns decimal(12,2)
READS SQL DATA
deterministic

begin
        DECLARE v_avg DECIMAL(12,2);
        -- Priority 1: Query precomputed daily_sales_summary table
    SELECT AVG(total_sales) INTO v_avg
    FROM daily_sales_summary
    WHERE (p_branch IS NULL OR branch_id = p_branch)
      AND summary_date >= CURDATE() - INTERVAL p_days DAY;


    -- Priority 2: Fallback to live sales_order if daily_sales_summary is not yet seeded
    IF v_avg IS NULL THEN
        SELECT COALESCE(AVG(daily_total), 0.00) INTO v_avg
        FROM (
            SELECT DATE(order_date) AS sale_date, SUM(total_amount) AS daily_total
            FROM sales_order
            WHERE status = 'COMPLETED'
              AND (p_branch IS NULL OR branch_id = p_branch)
              AND order_date >= CURDATE() - INTERVAL p_days DAY -- get sales for last p_days
            GROUP BY DATE(order_date) -- group by day to get daily totals
        ) AS daily_agg;
    END IF;
    RETURN COALESCE(v_avg, 0.00);
END$$

-- ============================================================================
-- 4B. SCALAR FUNCTION: fn_supplier_fulfillment_rate
-- Computes supplier reliability score: (Confirmed Qty / Requested Qty) * 100%
-- Demonstrates user-defined scalar functions, NULL safety, and arithmetic rounding.
-- ============================================================================
DROP FUNCTION IF EXISTS fn_supplier_fulfillment_rate$$
CREATE FUNCTION fn_supplier_fulfillment_rate(p_supplier_id INT)
RETURNS DECIMAL(5,2)
READS SQL DATA
DETERMINISTIC
BEGIN
    DECLARE v_requested DECIMAL(12,2);
    DECLARE v_confirmed DECIMAL(12,2);
    DECLARE v_rate DECIMAL(5,2);

    SELECT 
        COALESCE(SUM(poi.requested_qty), 0),
        COALESCE(SUM(poi.confirmed_qty), 0)
    INTO v_requested, v_confirmed
    FROM purchase_order po
    JOIN purchase_order_item poi ON poi.po_id = po.po_id
    WHERE po.supplier_id = p_supplier_id
      AND po.status IN ('CONFIRMED', 'RECEIVED');

    IF v_requested = 0 THEN
        RETURN 100.00;
    END IF;

    SET v_rate = ROUND((v_confirmed / v_requested) * 100.0, 2);
    RETURN LEAST(v_rate, 100.00);
END$$

DELIMITER ;

-- ============================================================================
-- 4C. ANALYTICAL VIEW: v_supplier_performance
-- Joins supplier, purchase_order, and purchase_order_item to track vendor reliability,
-- order fulfillment accuracy, order volume, and procurement expenditure.
-- Integrates scalar UDF: fn_supplier_fulfillment_rate(s.supplier_id).
-- ============================================================================
CREATE OR REPLACE VIEW v_supplier_performance AS
SELECT 
    s.supplier_id,
    s.name AS supplier_name,
    s.contact_person,
    s.phone,
    s.city,
    COUNT(DISTINCT po.po_id) AS total_orders,
    COALESCE(SUM(poi.requested_qty), 0.00) AS total_requested_qty,
    COALESCE(SUM(poi.confirmed_qty), 0.00) AS total_confirmed_qty,
    COALESCE(SUM(poi.received_qty), 0.00) AS total_received_qty,
    COALESCE(SUM(po.total_cost), 0.00) AS total_spend,
    fn_supplier_fulfillment_rate(s.supplier_id) AS fulfillment_rate,
    CASE 
        WHEN fn_supplier_fulfillment_rate(s.supplier_id) >= 95.00 THEN 'PREFERRED'
        WHEN fn_supplier_fulfillment_rate(s.supplier_id) >= 85.00 THEN 'RELIABLE'
        ELSE 'UNDER_REVIEW'
    END AS rating_tier
FROM supplier s
LEFT JOIN purchase_order po ON po.supplier_id = s.supplier_id
LEFT JOIN purchase_order_item poi ON poi.po_id = po.po_id
WHERE s.is_active = TRUE
GROUP BY s.supplier_id, s.name, s.contact_person, s.phone, s.city;

DELIMITER $$

-- ============================================================================
-- 5. STORED PROCEDURE: sp_monthly_report
-- Hierarchical sales rollup report using GROUP BY ... WITH ROLLUP.
-- Generates daily branch sales, branch subtotals, and chain-wide grand total.
-- ============================================================================
DROP PROCEDURE IF EXISTS sp_monthly_report$$
CREATE PROCEDURE sp_monthly_report(
    IN p_year INT,
    IN p_month INT,
    IN p_branch INT
)
BEGIN
    SELECT 
        o.branch_id,
        MAX(b.name) AS branch_name,
        DATE(o.order_date) AS day,
        COUNT(o.order_id) AS orders,
        SUM(o.total_amount) AS sales
    FROM sales_order o
    JOIN branch b ON b.branch_id = o.branch_id
    WHERE o.status = 'COMPLETED'
      AND YEAR(o.order_date) = p_year
      AND MONTH(o.order_date) = p_month
      AND (p_branch IS NULL OR o.branch_id = p_branch)
    GROUP BY o.branch_id, DATE(o.order_date) WITH ROLLUP;
END$$
-- ============================================================================
-- 6. STORED PROCEDURE: sp_category_sales_cte
-- Recursive Common Table Expression (CTE) for hierarchical category sales.
-- Computes category tree depth and revenue share percentage across chain.
-- ============================================================================
DROP PROCEDURE IF EXISTS sp_category_sales_cte$$
CREATE PROCEDURE sp_category_sales_cte()
BEGIN
    WITH RECURSIVE CategoryHierarchy AS (
        -- Anchor Member: Root categories (parent_id IS NULL)
        SELECT 
            category_id,
            name AS category_name,
            CAST('Root' AS CHAR(100)) AS parent_category,
            1 AS hierarchy_level
        FROM category
        WHERE parent_id IS NULL
        UNION ALL
        -- Recursive Member: Subcategories referencing parent_id
        SELECT 
            c.category_id,
            c.name AS category_name,
            ch.category_name AS parent_category,
            ch.hierarchy_level + 1 AS hierarchy_level
        FROM category c
        JOIN CategoryHierarchy ch ON c.parent_id = ch.category_id
    ),
    CategorySalesAgg AS (
        -- Aggregate sales volume and revenue per category
        SELECT 
            ch.category_id,
            ch.category_name,
            ch.parent_category,
            ch.hierarchy_level,
            COALESCE(SUM(oi.quantity), 0) AS total_products_sold,
            COALESCE(SUM(oi.line_total), 0.00) AS revenue
        FROM CategoryHierarchy ch
        LEFT JOIN product p ON p.category_id = ch.category_id
        LEFT JOIN order_item oi ON oi.product_id = p.product_id
        LEFT JOIN sales_order o ON o.order_id = oi.order_id AND o.status = 'COMPLETED'
        GROUP BY 
            ch.category_id,
            ch.category_name,
            ch.parent_category,
            ch.hierarchy_level
    )
    -- Calculate Chain Revenue Share using Window Function OVER ()
    SELECT 
        category_id,
        category_name,
        parent_category,
        hierarchy_level,
        total_products_sold,
        revenue,
        ROUND(
            COALESCE(revenue * 100.0 / NULLIF(SUM(revenue) OVER (), 0), 0.0), 
            1
        ) AS revenue_share_percent
    FROM CategorySalesAgg
    ORDER BY hierarchy_level ASC, revenue DESC;
END$$

-- ============================================================================
-- 6B. STORED PROCEDURE: sp_financial_reconciliation_report
-- Demonstrates Transaction Isolation Level REPEATABLE READ with
-- START TRANSACTION WITH CONSISTENT SNAPSHOT, READ ONLY
-- Prevents cross-query skew and phantom anomalies across multiple analytical queries
-- ============================================================================
DROP PROCEDURE IF EXISTS sp_financial_reconciliation_report$$
CREATE PROCEDURE sp_financial_reconciliation_report(
    IN p_branch_id INT,
    IN p_start_date DATE,
    IN p_end_date DATE
)
BEGIN
    -- Explicitly set transaction isolation level to REPEATABLE READ
    SET TRANSACTION ISOLATION LEVEL REPEATABLE READ;

    -- Start consistent read-only snapshot: zero shared locks, no blocking OLTP cashiers
    START TRANSACTION WITH CONSISTENT SNAPSHOT, READ ONLY;

    -- 1. Summary Totals (Point-in-Time T0 snapshot)
    SELECT 
        COUNT(order_id) AS total_completed_orders,
        COALESCE(SUM(subtotal), 0.00) AS gross_sales,
        COALESCE(SUM(discount_total), 0.00) AS total_discounts,
        COALESCE(SUM(total_amount), 0.00) AS net_revenue
    FROM sales_order
    WHERE status = 'COMPLETED'
      AND (p_branch_id IS NULL OR branch_id = p_branch_id)
      AND DATE(order_date) BETWEEN p_start_date AND p_end_date;

    -- 2. Tender Payment Breakdown (Reconciles 100% mathematically with net_revenue)
    SELECT 
        p.method AS payment_method,
        COUNT(p.payment_id) AS transaction_count,
        COALESCE(SUM(p.amount), 0.00) AS total_collected
    FROM payment p
    JOIN sales_order o ON o.order_id = p.order_id
    WHERE o.status = 'COMPLETED'
      AND (p_branch_id IS NULL OR o.branch_id = p_branch_id)
      AND DATE(o.order_date) BETWEEN p_start_date AND p_end_date
    GROUP BY p.method;

    -- Release read view snapshot
    COMMIT;
END$$

-- ============================================================================
-- 7. TRIGGER: trg_daily_sales_log
-- Audit logging for daily sales analytics integrity.
-- Fires AFTER INSERT on daily_sales_summary.
-- ============================================================================

CREATE TABLE IF NOT EXISTS daily_sales_log (
    log_id INT AUTO_INCREMENT PRIMARY KEY,
    summary_date DATE NOT NULL,
    branch_id INT NOT NULL,
    total_orders INT NOT NULL,
    total_sales DECIMAL(14,2) NOT NULL,
    logged_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

DROP TRIGGER IF EXISTS trg_daily_sales_log$$

CREATE TRIGGER trg_daily_sales_log
AFTER INSERT ON daily_sales_summary
FOR EACH ROW
BEGIN
    INSERT INTO daily_sales_log (summary_date, branch_id, total_orders, total_sales, logged_at)
    VALUES (NEW.summary_date, NEW.branch_id, NEW.total_orders, NEW.total_sales, NOW());
END$$

-- ============================================================================
-- 8. SCHEDULED EVENT: ev_daily_sales_summary
-- Nightly event aggregating sales into daily_sales_summary at 01:00 AM.
-- ============================================================================

DROP EVENT IF EXISTS ev_daily_sales_summary$$

CREATE EVENT ev_daily_sales_summary
ON SCHEDULE EVERY 1 DAY
STARTS (TIMESTAMP(CURDATE()) + INTERVAL 1 DAY + INTERVAL 1 HOUR)
DO
BEGIN
    INSERT INTO daily_sales_summary (summary_date, branch_id, total_orders, total_sales)
    SELECT 
        DATE(order_date),
        branch_id,
        COUNT(*),
        COALESCE(SUM(total_amount), 0.00)
    FROM sales_order
    WHERE status = 'COMPLETED'
      AND order_date >= CURDATE() - INTERVAL 1 DAY
      AND order_date < CURDATE()
    GROUP BY DATE(order_date), branch_id
    ON DUPLICATE KEY UPDATE 
        total_orders = VALUES(total_orders),
        total_sales  = VALUES(total_sales);
END$$

-- ============================================================================
-- 9. SCHEDULED EVENT: ev_monthly_log_purge
-- Monthly maintenance event purging audit log records older than 12 months.
-- ============================================================================

DROP EVENT IF EXISTS ev_monthly_log_purge$$

CREATE EVENT ev_monthly_log_purge
ON SCHEDULE EVERY 1 MONTH
STARTS (TIMESTAMP(CURDATE()) + INTERVAL 1 DAY + INTERVAL 2 HOUR)
DO
BEGIN
    DELETE FROM stock_audit_log 
    WHERE logged_at < NOW() - INTERVAL 12 MONTH;
END$$

DELIMITER ;

-- ============================================================================
-- 10. ADVANCED TOPIC: RANGE Table Partitioning on stock_audit_log
-- Demonstrates partition pruning, horizontal data distribution by Year,
-- and query optimization on large audit movement datasets.
-- ============================================================================

CREATE TABLE IF NOT EXISTS stock_audit_log_partitioned (
    log_id INT AUTO_INCREMENT,
    branch_id INT NOT NULL,
    product_id INT NOT NULL,
    change_qty INT NOT NULL,
    reason ENUM('SALE', 'RESTOCK', 'CANCEL', 'TRANSFER_IN', 'TRANSFER_OUT', 'ADJUSTMENT') NOT NULL,
    ref_order_id INT NULL,
    logged_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (log_id, logged_at)
) ENGINE=InnoDB
PARTITION BY RANGE (YEAR(logged_at)) (
    PARTITION p2024 VALUES LESS THAN (2025),
    PARTITION p2025 VALUES LESS THAN (2026),
    PARTITION p2026 VALUES LESS THAN (2027),
    PARTITION p_future VALUES LESS THAN MAXVALUE
);

-- Proof query demonstrating Partition Pruning (EXPLAIN PARTITIONS):
-- EXPLAIN SELECT * FROM stock_audit_log_partitioned 
-- WHERE logged_at BETWEEN '2026-01-01' AND '2026-12-31';