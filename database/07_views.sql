-- ============================================================================
-- SUPERMARKET CHAIN MANAGEMENT SYSTEM
-- ICT3222 Advanced Database Management Systems (ADBMS)
-- Script 07: Database Views
-- Engine: MySQL 8.0 (InnoDB)
-- ============================================================================

USE supermarket_db;

-- ----------------------------------------------------------------------------
-- MEMBER 4 VIEW: Daily Sales Aggregations
-- ----------------------------------------------------------------------------
CREATE OR REPLACE VIEW v_daily_sales AS
SELECT branch_id, DATE(order_date) AS sale_date,
       COUNT(*) AS orders, SUM(total_amount) AS total_sales
FROM sales_order 
WHERE status = 'COMPLETED'
GROUP BY branch_id, DATE(order_date);

-- ----------------------------------------------------------------------------
-- MEMBER 2 VIEW: Low Stock Supply Chain Reorder View
-- ----------------------------------------------------------------------------
CREATE OR REPLACE VIEW v_low_stock AS
SELECT i.branch_id, b.name AS branch, p.product_id, p.name AS product,
       i.quantity, i.reorder_level
FROM inventory i
JOIN product p ON p.product_id = i.product_id
JOIN branch b ON b.branch_id = i.branch_id
WHERE i.quantity <= i.reorder_level;

-- ----------------------------------------------------------------------------
-- MEMBER 3 VIEW: Customer Order History & Lifetime Value
-- ----------------------------------------------------------------------------
CREATE OR REPLACE VIEW v_customer_orders AS
SELECT c.customer_id, c.full_name, COUNT(o.order_id) AS orders,
       COALESCE(SUM(o.total_amount), 0.00) AS total_spent
FROM customer c 
LEFT JOIN sales_order o ON o.customer_id = c.customer_id AND o.status = 'COMPLETED'
GROUP BY c.customer_id, c.full_name;

-- ----------------------------------------------------------------------------
-- MEMBER 4 VIEW: Product Ranking with Window Function (RANK() OVER)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE VIEW v_product_ranking AS
SELECT p.product_id, p.name, 
       SUM(oi.quantity) AS units_sold,
       SUM(oi.line_total) AS revenue,
       RANK() OVER (ORDER BY SUM(oi.line_total) DESC) AS revenue_rank
FROM order_item oi 
JOIN product p ON p.product_id = oi.product_id
JOIN sales_order o ON o.order_id = oi.order_id AND o.status = 'COMPLETED'
GROUP BY p.product_id, p.name;

-- ----------------------------------------------------------------------------
-- MEMBER 3 VIEW: Active Promotional Rules
-- ----------------------------------------------------------------------------
CREATE OR REPLACE VIEW v_active_discounts AS
SELECT rule_id, name, rule_type, kind, value, min_order_amount, end_date
FROM discount_rule 
WHERE is_active = TRUE AND CURDATE() BETWEEN start_date AND end_date;

-- ----------------------------------------------------------------------------
-- MEMBER 4 VIEW: Discount Impact & Subsidies
-- ----------------------------------------------------------------------------
CREATE OR REPLACE VIEW v_discount_impact AS
SELECT r.rule_id, r.name, r.rule_type, 
       DATE_FORMAT(o.order_date, '%Y-%m') AS month,
       COUNT(*) AS orders_using, 
       SUM(od.amount) AS total_discount,
       SUM(o.total_amount) AS revenue_after_discount
FROM order_discount od
JOIN discount_rule r ON r.rule_id = od.rule_id
JOIN sales_order o ON o.order_id = od.order_id AND o.status = 'COMPLETED'
GROUP BY r.rule_id, r.name, r.rule_type, DATE_FORMAT(o.order_date, '%Y-%m');

-- ----------------------------------------------------------------------------
-- MEMBER 5 VIEW: Dynamic Data Masking View (Customer PII Protection)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE VIEW v_masked_customer_directory AS
SELECT customer_id, full_name,
       fn_mask_phone(phone) AS masked_phone,
       registered_date, loyalty_points
FROM customer;
