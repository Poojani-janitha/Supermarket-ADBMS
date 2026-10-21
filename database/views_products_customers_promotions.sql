USE supermarket_db;

-- Read-only query layer used by the backend; keeps joins out of controllers.
-- CREATE OR REPLACE makes view deployment repeatable.

-- Product catalog with category and supplier names for the catalog screen.
CREATE OR REPLACE VIEW v_product_catalog AS
SELECT
  p.product_id,
  p.sku,
  p.name AS product_name,
  p.category_id,
  c.name AS category_name,
  p.supplier_id,
  s.name AS supplier_name,
  p.unit_price,
  p.cost_price,
  p.image_url,
  p.diet_type,
  p.unit_of_measure,
  p.min_order_qty,
  p.is_active
FROM product p
JOIN category c ON c.category_id = p.category_id
JOIN supplier s ON s.supplier_id = p.supplier_id;

-- Category list with the number of currently active products.
CREATE OR REPLACE VIEW v_category_summary AS
SELECT
  c.category_id,
  c.name,
  c.description,
  c.icon,
  c.parent_id,
  COUNT(CASE WHEN p.is_active = TRUE THEN 1 END) AS active_product_count
FROM category c
LEFT JOIN product p ON p.category_id = c.category_id
GROUP BY c.category_id, c.name, c.description, c.icon, c.parent_id;

-- Customer directory with a database-calculated loyalty tier.
CREATE OR REPLACE VIEW v_customer_directory AS
SELECT
  c.customer_id,
  c.full_name,
  c.phone,
  c.email,
  c.loyalty_points,
  fn_customer_tier(c.customer_id) AS tier,
  c.registered_date
FROM customer c;

-- Restricted customer directory that hides most phone digits.
CREATE OR REPLACE VIEW v_masked_customer_directory AS
SELECT
  customer_id,
  full_name,
  CONCAT(LEFT(phone, 3), '****', RIGHT(phone, 3)) AS masked_phone,
  email,
  loyalty_points,
  fn_customer_tier(customer_id) AS tier,
  registered_date
FROM customer;

-- Customer order summary used by the order-history endpoint.
CREATE OR REPLACE VIEW v_customer_orders AS
SELECT
  o.order_id,
  o.customer_id,
  o.order_date,
  o.status,
  o.subtotal,
  o.discount_total,
  o.total_amount,
  COUNT(oi.product_id) AS item_count
FROM sales_order o
LEFT JOIN order_item oi ON oi.order_id = o.order_id
GROUP BY
  o.order_id, o.customer_id, o.order_date, o.status,
  o.subtotal, o.discount_total, o.total_amount;

-- Rules valid for the current date and active status.
CREATE OR REPLACE VIEW v_active_discounts AS
SELECT
  rule_id,
  name,
  rule_type,
  kind,
  value,
  min_order_amount,
  max_discount,
  tier,
  start_date,
  end_date,
  priority,
  stackable,
  is_active
FROM discount_rule
WHERE is_active = TRUE
  AND CURDATE() BETWEEN start_date AND end_date;

-- Aggregates applied-rule counts, discount cost and attributed sales.
CREATE OR REPLACE VIEW v_discount_impact AS
SELECT
  r.rule_id,
  r.name AS rule_name,
  r.rule_type,
  COUNT(*) AS times_applied,
  SUM(od.amount) AS total_discount_amount,
  SUM(o.total_amount) AS attributed_sales,
  ROUND(
    SUM(o.total_amount) / NULLIF(SUM(od.amount), 0),
    2
  ) AS roi_ratio
FROM order_discount od
JOIN discount_rule r ON r.rule_id = od.rule_id
JOIN sales_order o ON o.order_id = od.order_id
WHERE o.status = 'COMPLETED'
GROUP BY r.rule_id, r.name, r.rule_type;
