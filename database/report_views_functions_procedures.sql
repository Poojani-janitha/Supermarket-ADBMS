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
DELIMITER ;