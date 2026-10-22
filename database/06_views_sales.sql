-- ============================================================================
-- SUPERMARKET CHAIN MANAGEMENT SYSTEM
-- ICT3222 Advanced Database Management Systems (ADBMS)
-- Script 06: Member 1 Sales Views
-- Engine: MySQL 8.0 (InnoDB)
-- ============================================================================

USE supermarket_db;

-- ----------------------------------------------------------------------------
-- MEMBER 1 VIEW 1: Daily Sales Aggregations
-- Used for branch-level revenue reporting and daily performance monitoring
-- ----------------------------------------------------------------------------
CREATE OR REPLACE VIEW v_daily_sales AS
SELECT 
  s.branch_id,
  b.name AS branch_name,
  DATE(s.order_date) AS sale_date,
  COUNT(s.order_id) AS total_orders,
  COALESCE(SUM(s.subtotal), 0.00) AS total_subtotal,
  COALESCE(SUM(s.discount_total), 0.00) AS total_discounts,
  COALESCE(SUM(s.total_amount), 0.00) AS net_revenue
FROM sales_order s
JOIN branch b ON b.branch_id = s.branch_id
WHERE s.status = 'COMPLETED'
GROUP BY s.branch_id, b.name, DATE(s.order_date);

-- ----------------------------------------------------------------------------
-- MEMBER 1 VIEW 2: Complete Sales Order Summary
-- Integrates order headers with customer, cashier, and payment details
-- ----------------------------------------------------------------------------
CREATE OR REPLACE VIEW v_sales_order_summary AS
SELECT 
  o.order_id,
  o.branch_id,
  b.name AS branch_name,
  o.customer_id,
  COALESCE(c.full_name, 'Guest Customer') AS customer_name,
  c.phone AS customer_phone,
  o.employee_id,
  e.full_name AS cashier_name,
  o.order_date,
  o.status,
  fn_order_item_count(o.order_id) AS total_items_count,
  o.subtotal,
  o.discount_total,
  o.total_amount,
  p.payment_id,
  p.method AS payment_method,
  p.paid_at
FROM sales_order o
JOIN branch b ON b.branch_id = o.branch_id
JOIN employee e ON e.employee_id = o.employee_id
LEFT JOIN customer c ON c.customer_id = o.customer_id
LEFT JOIN payment p ON p.order_id = o.order_id;

-- ----------------------------------------------------------------------------
-- MEMBER 1 VIEW 3: Detailed Order Line Items
-- Detailed breakdown of receipt items with category and SKU
-- ----------------------------------------------------------------------------
CREATE OR REPLACE VIEW v_order_items_detailed AS
SELECT 
  oi.order_id,
  oi.product_id,
  p.sku,
  p.name AS product_name,
  cat.name AS category_name,
  oi.quantity,
  oi.unit_price,
  oi.line_total
FROM order_item oi
JOIN product p ON p.product_id = oi.product_id
JOIN category cat ON cat.category_id = p.category_id;

-- ----------------------------------------------------------------------------
-- SUPPORTING VIEW: Customer Order History & Lifetime Value
-- ----------------------------------------------------------------------------
CREATE OR REPLACE VIEW v_customer_orders AS
SELECT 
  c.customer_id,
  c.full_name,
  c.phone,
  c.loyalty_points,
  COUNT(o.order_id) AS orders_count,
  COALESCE(SUM(o.total_amount), 0.00) AS total_spent
FROM customer c 
LEFT JOIN sales_order o ON o.customer_id = c.customer_id AND o.status = 'COMPLETED'
GROUP BY c.customer_id, c.full_name, c.phone, c.loyalty_points;

-- ----------------------------------------------------------------------------
-- SUPPORTING VIEW: Low Stock Supply Chain Reorder View (Member 2)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE VIEW v_low_stock AS
SELECT i.branch_id, b.name AS branch, p.product_id, p.name AS product,
       i.quantity, i.reorder_level
FROM inventory i
JOIN product p ON p.product_id = i.product_id
JOIN branch b ON b.branch_id = i.branch_id
WHERE i.quantity <= i.reorder_level;

-- ----------------------------------------------------------------------------
-- SUPPORTING VIEW: Product Ranking with Window Function (Member 4)
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
-- SUPPORTING VIEW: Active Promotional Rules (Member 3)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE VIEW v_active_discounts AS
SELECT rule_id, name, rule_type, kind, value, min_order_amount, end_date
FROM discount_rule 
WHERE is_active = TRUE AND CURDATE() BETWEEN start_date AND end_date;

-- ----------------------------------------------------------------------------
-- SUPPORTING VIEW: Discount Impact & Subsidies (Member 4)
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
-- SUPPORTING VIEW: Dynamic Data Masking View (Member 5)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE VIEW v_masked_customer_directory AS
SELECT customer_id, full_name,
       fn_mask_phone(phone) AS masked_phone,
       registered_date, loyalty_points
FROM customer;

