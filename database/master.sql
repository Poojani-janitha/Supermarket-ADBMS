-- ==============================================================================
-- SUPERMARKET CHAIN MANAGEMENT SYSTEM (ICT3222 ADBMS)
-- MASTER PROGRAMMABLE DATABASE OBJECTS SCRIPT
-- ==============================================================================
-- Consolidated deployment script containing all Functions, Views, Stored
-- Procedures, Triggers, and Scheduled Events across all database modules.
-- Excludes test files and bulk seed scripts.
--
-- Target Database : supermarket_db (MySQL 8.0+ InnoDB)
--
-- Object Summary:
--   1. Functions (UDFs)        : 7
--   2. Database Views          : 11
--   3. Stored Procedures       : 13
--   4. Triggers                : 6
--   5. Scheduled Events        : 4
-- ==============================================================================

USE supermarket_db;

-- Enable MySQL Event Scheduler for automated recurring background maintenance
SET GLOBAL event_scheduler = ON;

-- ------------------------------------------------------------------------------
-- PRE-REQUISITE LOG TABLES (Required by Triggers / Advanced Features)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS daily_sales_log (
    log_id INT AUTO_INCREMENT PRIMARY KEY,
    summary_date DATE NOT NULL,
    branch_id INT NOT NULL,
    total_orders INT NOT NULL,
    total_sales DECIMAL(14,2) NOT NULL,
    logged_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

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

-- ==============================================================================
-- SECTION 1: USER-DEFINED FUNCTIONS (UDFs)
-- ==============================================================================

DELIMITER $$

-- 1.1 Customer Loyalty Tier Function (Calculates tier based on historical spend)
DROP FUNCTION IF EXISTS fn_customer_tier$$
CREATE FUNCTION fn_customer_tier(p_customer_id INT)
RETURNS VARCHAR(10)
READS SQL DATA
DETERMINISTIC
BEGIN
  DECLARE v_spent DECIMAL(14,2) DEFAULT 0.00;

  IF p_customer_id IS NULL THEN
    RETURN 'BRONZE';
  END IF;

  SELECT COALESCE(SUM(total_amount), 0.00)
    INTO v_spent
  FROM sales_order
  WHERE customer_id = p_customer_id
    AND status = 'COMPLETED';

  RETURN CASE
    WHEN v_spent >= 100000.00 THEN 'GOLD'
    WHEN v_spent >= 50000.00 THEN 'SILVER'
    ELSE 'BRONZE'
  END;
END$$

-- 1.2 Holiday Verification Function (Checks if date exists in holiday calendar)
DROP FUNCTION IF EXISTS fn_is_holiday$$
CREATE FUNCTION fn_is_holiday(p_date DATE)
RETURNS BOOLEAN
READS SQL DATA
DETERMINISTIC
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM holiday
    WHERE holiday_date = p_date
  );
END$$

-- 1.3 First-Purchase Identification Function (Checks if customer has completed previous orders)
DROP FUNCTION IF EXISTS fn_is_first_purchase$$
CREATE FUNCTION fn_is_first_purchase(p_customer_id INT, p_order_id INT)
RETURNS BOOLEAN
READS SQL DATA
DETERMINISTIC
BEGIN
  RETURN p_customer_id IS NOT NULL
    AND NOT EXISTS (
      SELECT 1
      FROM sales_order
      WHERE customer_id = p_customer_id
        AND order_id <> COALESCE(p_order_id, -1)
        AND status = 'COMPLETED'
    );
END$$

-- 1.4 Coupon Validity Verification Function (Validates code, expiration, limits and rules)
DROP FUNCTION IF EXISTS fn_coupon_valid$$
CREATE FUNCTION fn_coupon_valid(p_code VARCHAR(20), p_rule_id INT)
RETURNS BOOLEAN
READS SQL DATA
DETERMINISTIC
BEGIN
  RETURN p_code IS NOT NULL
    AND EXISTS (
      SELECT 1
      FROM coupon c
      JOIN discount_rule r ON r.rule_id = c.rule_id
      WHERE c.code = UPPER(TRIM(p_code))
        AND (p_rule_id IS NULL OR c.rule_id = p_rule_id)
        AND c.expires_on >= CURDATE()
        AND c.used_count < c.max_uses
        AND r.is_active = TRUE
        AND CURDATE() BETWEEN r.start_date AND r.end_date
    );
END$$

-- 1.5 Branch Stock Level Lookup Function
DROP FUNCTION IF EXISTS fn_stock_level$$
CREATE FUNCTION fn_stock_level(p_branch INT, p_product INT)
RETURNS DECIMAL(10,2)
READS SQL DATA
DETERMINISTIC
BEGIN
  DECLARE v_qty DECIMAL(10,2);
  SELECT quantity INTO v_qty FROM inventory
  WHERE branch_id = p_branch AND product_id = p_product;
  RETURN COALESCE(v_qty, 0.00);
END$$

-- 1.6 Rolling Average Daily Sales Function (Summary table with live fallback)
DROP FUNCTION IF EXISTS fn_avg_daily_sales$$
CREATE FUNCTION fn_avg_daily_sales(p_branch INT, p_days INT)
RETURNS DECIMAL(12,2)
READS SQL DATA
DETERMINISTIC
BEGIN
    DECLARE v_avg DECIMAL(12,2);
    -- Priority 1: Query precomputed daily_sales_summary table
    SELECT AVG(total_sales) INTO v_avg
    FROM daily_sales_summary
    WHERE (p_branch IS NULL OR branch_id = p_branch)
      AND summary_date >= CURDATE() - INTERVAL p_days DAY;

    -- Priority 2: Fallback to live sales_order if daily_sales_summary is pending
    IF v_avg IS NULL THEN
        SELECT COALESCE(AVG(daily_total), 0.00) INTO v_avg
        FROM (
            SELECT DATE(order_date) AS sale_date, SUM(total_amount) AS daily_total
            FROM sales_order
            WHERE status = 'COMPLETED'
              AND (p_branch IS NULL OR branch_id = p_branch)
              AND order_date >= CURDATE() - INTERVAL p_days DAY
            GROUP BY DATE(order_date)
        ) AS daily_agg;
    END IF;
    RETURN COALESCE(v_avg, 0.00);
END$$

-- 1.7 Supplier Fulfillment Rate Score Function (Percentage confirmed vs requested)
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

-- ==============================================================================
-- SECTION 2: DATABASE VIEWS
-- ==============================================================================

-- 2.1 Product Catalog View (Enriched with category and supplier info)
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

-- 2.2 Category Summary View (Active product count per category)
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

-- 2.3 Customer Directory View (Includes calculated loyalty tier)
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

-- 2.4 Masked Customer Directory View (Data privacy: phone masking)
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

-- 2.5 Customer Orders History View
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

-- 2.6 Active Promotions View (Currently active within calendar date range)
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

-- 2.7 Low Stock Alerts View (Items at or below reorder threshold)
CREATE OR REPLACE VIEW v_low_stock AS
SELECT i.branch_id, b.name AS branch, p.product_id, p.name AS product,
       p.unit_of_measure, i.quantity, i.reorder_level, i.version
FROM inventory i
JOIN product p ON p.product_id = i.product_id
JOIN branch b ON b.branch_id = i.branch_id
WHERE i.quantity <= i.reorder_level;

-- 2.8 Daily Branch Sales View
CREATE OR REPLACE VIEW v_daily_sales AS
SELECT 
    branch_id,
    DATE(order_date) AS sale_date,
    COUNT(*) AS orders,
    COALESCE(SUM(total_amount), 0.00) AS total_sales
FROM sales_order
WHERE status = 'COMPLETED'
GROUP BY branch_id, DATE(order_date);

-- 2.9 Product Sales Ranking View (Window Function: RANK() OVER Revenue)
CREATE OR REPLACE VIEW v_product_ranking AS
SELECT
    p.product_id,
    p.name AS name,
    p.sku,
    COALESCE(SUM(oi.quantity), 0) AS units_sold,
    COALESCE(SUM(oi.line_total), 0.00) AS revenue,
    RANK() OVER (ORDER BY COALESCE(SUM(oi.line_total), 0.00) DESC) AS revenue_rank
FROM product p
JOIN order_item oi ON oi.product_id = p.product_id
JOIN sales_order o ON o.order_id = oi.order_id AND o.status = 'COMPLETED'
GROUP BY p.product_id, p.name, p.sku;

-- 2.10 Promotional Discount Impact & ROI Analytical View
CREATE OR REPLACE VIEW v_discount_impact AS
SELECT 
    r.rule_id,
    r.name,
    r.rule_type,
    COUNT(DISTINCT od.order_id) AS orders_using,
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

-- 2.11 Supplier Performance & Reliability View
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

-- ==============================================================================
-- SECTION 3: STORED PROCEDURES
-- ==============================================================================

DELIMITER $$

-- 3.1 Procedure: sp_create_purchase_order
DROP PROCEDURE IF EXISTS sp_create_purchase_order$$
CREATE PROCEDURE sp_create_purchase_order(
  IN p_supplier_id INT, 
  IN p_branch_id INT, 
  IN p_employee_id INT,
  IN p_product_id INT, 
  IN p_qty DECIMAL(10,2), 
  OUT p_po_id INT
)
BEGIN
  DECLARE v_unit_cost DECIMAL(10,2);
  DECLARE EXIT HANDLER FOR SQLEXCEPTION 
  BEGIN 
    ROLLBACK; 
    RESIGNAL; 
  END;

  SELECT cost_price INTO v_unit_cost FROM product WHERE product_id = p_product_id;

  START TRANSACTION;
  INSERT INTO purchase_order (supplier_id, branch_id, requested_by, status, total_cost)
  VALUES (p_supplier_id, p_branch_id, p_employee_id, 'REQUESTED', (v_unit_cost * p_qty));
  SET p_po_id = LAST_INSERT_ID();

  INSERT INTO purchase_order_item (po_id, product_id, requested_qty, confirmed_qty, unit_cost)
  VALUES (p_po_id, p_product_id, p_qty, p_qty, v_unit_cost);
  COMMIT;
END$$

-- 3.2 Procedure: sp_supplier_confirm_order (Vendor Portal Confirmation)
DROP PROCEDURE IF EXISTS sp_supplier_confirm_order$$
CREATE PROCEDURE sp_supplier_confirm_order(
  IN p_po_id INT, 
  IN p_supplier_id INT, 
  IN p_confirmed_qty DECIMAL(10,2), 
  IN p_notes TEXT
)
BEGIN
  DECLARE v_unit_cost DECIMAL(10,2);
  DECLARE EXIT HANDLER FOR SQLEXCEPTION 
  BEGIN 
    ROLLBACK; 
    RESIGNAL; 
  END;

  START TRANSACTION;
  UPDATE purchase_order_item 
  SET confirmed_qty = p_confirmed_qty 
  WHERE po_id = p_po_id;

  SELECT unit_cost INTO v_unit_cost FROM purchase_order_item WHERE po_id = p_po_id LIMIT 1;

  UPDATE purchase_order 
  SET status = 'CONFIRMED', 
      supplier_notes = p_notes, 
      total_cost = (v_unit_cost * p_confirmed_qty), 
      confirmed_at = CURRENT_TIMESTAMP
  WHERE po_id = p_po_id AND supplier_id = p_supplier_id;
  COMMIT;
END$$

-- 3.3 Procedure: sp_receive_purchase (Physical GRN Intake with Optimistic Version Increment)
DROP PROCEDURE IF EXISTS sp_receive_purchase$$
CREATE PROCEDURE sp_receive_purchase(
  IN p_po_id INT, 
  IN p_employee_id INT, 
  IN p_received_qty DECIMAL(10,2), 
  IN p_notes TEXT
)
BEGIN
  DECLARE v_branch INT; 
  DECLARE v_prod INT;
  DECLARE EXIT HANDLER FOR SQLEXCEPTION 
  BEGIN 
    ROLLBACK; 
    RESIGNAL; 
  END;

  SELECT branch_id INTO v_branch FROM purchase_order WHERE po_id = p_po_id FOR UPDATE;
  SELECT product_id INTO v_prod FROM purchase_order_item WHERE po_id = p_po_id LIMIT 1;

  START TRANSACTION;
  UPDATE purchase_order_item 
  SET received_qty = p_received_qty 
  WHERE po_id = p_po_id;

  -- Atomic restock with optimistic version bumping
  INSERT INTO inventory (branch_id, product_id, quantity, version)
  VALUES (v_branch, v_prod, p_received_qty, 0)
  ON DUPLICATE KEY UPDATE 
    quantity = quantity + p_received_qty, 
    version = version + 1;

  -- Resolve low-stock alert if applicable
  UPDATE low_stock_alert 
  SET resolved = TRUE 
  WHERE branch_id = v_branch AND product_id = v_prod;

  -- Audit log entry
  INSERT INTO stock_audit_log (branch_id, product_id, change_qty, reason, ref_order_id)
  VALUES (v_branch, v_prod, p_received_qty, 'RESTOCK', p_po_id);

  UPDATE purchase_order 
  SET status = 'RECEIVED', 
      received_by = p_employee_id, 
      receiving_notes = p_notes, 
      received_at = CURRENT_TIMESTAMP
  WHERE po_id = p_po_id;
  COMMIT;
END$$

-- 3.4 Procedure: sp_transfer_stock (ACID Branch Transfer with Pessimistic Locking)
DROP PROCEDURE IF EXISTS sp_transfer_stock$$
CREATE PROCEDURE sp_transfer_stock(
  IN p_from_branch INT, 
  IN p_to_branch INT, 
  IN p_product INT, 
  IN p_qty DECIMAL(10,2)
)
BEGIN
  DECLARE v_current DECIMAL(10,2);
  DECLARE EXIT HANDLER FOR SQLEXCEPTION 
  BEGIN 
    ROLLBACK; 
    RESIGNAL; 
  END;

  START TRANSACTION;
  -- Lock source inventory row with pessimistic lock
  SELECT quantity INTO v_current FROM inventory
  WHERE branch_id = p_from_branch AND product_id = p_product FOR UPDATE;

  -- Verify sufficient stock availability
  IF v_current IS NULL OR v_current < p_qty THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Insufficient stock at source branch';
  END IF;

  -- Deduct from origin branch and bump optimistic version
  UPDATE inventory 
  SET quantity = quantity - p_qty, 
      version = version + 1
  WHERE branch_id = p_from_branch AND product_id = p_product;

  -- Increment target branch and bump optimistic version
  INSERT INTO inventory (branch_id, product_id, quantity, version)
  VALUES (p_to_branch, p_product, p_qty, 0)
  ON DUPLICATE KEY UPDATE 
    quantity = quantity + p_qty, 
    version = version + 1;

  -- Dual audit log entries for transfer traceability
  INSERT INTO stock_audit_log (branch_id, product_id, change_qty, reason)
  VALUES (p_from_branch, p_product, -p_qty, 'TRANSFER_OUT'),
         (p_to_branch, p_product, p_qty, 'TRANSFER_IN');
  COMMIT;
END$$

-- 3.5 Procedure: sp_save_product (Atomic Product Insert/Update with Validation)
DROP PROCEDURE IF EXISTS sp_save_product$$
CREATE PROCEDURE sp_save_product(
  IN p_product_id INT,
  IN p_category_id INT,
  IN p_supplier_id INT,
  IN p_sku VARCHAR(30),
  IN p_name VARCHAR(150),
  IN p_unit_price DECIMAL(10,2),
  IN p_cost_price DECIMAL(10,2),
  IN p_image_url VARCHAR(255),
  IN p_diet_type VARCHAR(20),
  IN p_unit_of_measure VARCHAR(20),
  IN p_min_order_qty DECIMAL(10,2),
  IN p_is_active BOOLEAN,
  OUT p_saved_product_id INT
)
BEGIN
  DECLARE v_category_exists INT DEFAULT 0;
  DECLARE v_supplier_exists INT DEFAULT 0;
  DECLARE v_duplicate_sku INT DEFAULT 0;
  DECLARE EXIT HANDLER FOR SQLEXCEPTION
  BEGIN
    ROLLBACK;
    RESIGNAL;
  END;

  IF NULLIF(TRIM(p_sku), '') IS NULL OR NULLIF(TRIM(p_name), '') IS NULL THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Product SKU and name are required';
  END IF;
  IF p_unit_price < 0 OR p_cost_price < 0 OR p_min_order_qty <= 0 THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Product prices and minimum quantity are invalid';
  END IF;

  SELECT COUNT(*) INTO v_category_exists FROM category WHERE category_id = p_category_id;
  SELECT COUNT(*) INTO v_supplier_exists FROM supplier WHERE supplier_id = p_supplier_id;
  IF v_category_exists = 0 THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Product category does not exist';
  END IF;
  IF v_supplier_exists = 0 THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Product supplier does not exist';
  END IF;

  SELECT COUNT(*) INTO v_duplicate_sku
  FROM product
  WHERE sku = TRIM(p_sku)
    AND (p_product_id IS NULL OR product_id <> p_product_id);
  IF v_duplicate_sku > 0 THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Product SKU already exists';
  END IF;

  START TRANSACTION;
  IF p_product_id IS NULL THEN
    INSERT INTO product (
      category_id, supplier_id, sku, name, unit_price, cost_price,
      image_url, diet_type, unit_of_measure, min_order_qty, is_active
    )
    VALUES (
      p_category_id, p_supplier_id, TRIM(p_sku), TRIM(p_name), p_unit_price, p_cost_price,
      p_image_url, p_diet_type, p_unit_of_measure, p_min_order_qty, COALESCE(p_is_active, TRUE)
    );
    SET p_saved_product_id = LAST_INSERT_ID();
  ELSE
    UPDATE product
    SET category_id = p_category_id,
        supplier_id = p_supplier_id,
        sku = TRIM(p_sku),
        name = TRIM(p_name),
        unit_price = p_unit_price,
        cost_price = p_cost_price,
        image_url = p_image_url,
        diet_type = p_diet_type,
        unit_of_measure = p_unit_of_measure,
        min_order_qty = p_min_order_qty,
        is_active = COALESCE(p_is_active, is_active)
    WHERE product_id = p_product_id;
    IF ROW_COUNT() = 0 THEN
      SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Product does not exist';
    END IF;
    SET p_saved_product_id = p_product_id;
  END IF;
  COMMIT;
END$$

-- 3.6 Procedure: sp_register_customer (Customer Registration with Duplicate Phone Protection)
DROP PROCEDURE IF EXISTS sp_register_customer$$
CREATE PROCEDURE sp_register_customer(
  IN p_full_name VARCHAR(120),
  IN p_phone VARCHAR(20),
  IN p_email VARCHAR(100),
  OUT p_customer_id INT
)
BEGIN
  DECLARE v_existing_id INT DEFAULT NULL;
  DECLARE EXIT HANDLER FOR SQLEXCEPTION
  BEGIN
    ROLLBACK;
    RESIGNAL;
  END;

  IF NULLIF(TRIM(p_full_name), '') IS NULL OR NULLIF(TRIM(p_phone), '') IS NULL THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Customer name and phone are required';
  END IF;

  SELECT customer_id INTO v_existing_id
  FROM customer
  WHERE phone = TRIM(p_phone)
  LIMIT 1;
  IF v_existing_id IS NOT NULL THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Customer phone number already exists';
  END IF;

  START TRANSACTION;
  INSERT INTO customer (full_name, phone, email)
  VALUES (TRIM(p_full_name), TRIM(p_phone), NULLIF(TRIM(p_email), ''));
  SET p_customer_id = LAST_INSERT_ID();
  COMMIT;
END$$

-- 3.7 Procedure: sp_save_discount_rule (Promotion Rule Management & Validation)
DROP PROCEDURE IF EXISTS sp_save_discount_rule$$
CREATE PROCEDURE sp_save_discount_rule(
  IN p_rule_id INT,
  IN p_name VARCHAR(100),
  IN p_rule_type VARCHAR(20),
  IN p_kind VARCHAR(10),
  IN p_value DECIMAL(10,2),
  IN p_min_order_amount DECIMAL(12,2),
  IN p_max_discount DECIMAL(12,2),
  IN p_tier VARCHAR(10),
  IN p_start_date DATE,
  IN p_end_date DATE,
  IN p_priority INT,
  IN p_stackable BOOLEAN,
  IN p_is_active BOOLEAN,
  OUT p_saved_rule_id INT
)
BEGIN
  DECLARE EXIT HANDLER FOR SQLEXCEPTION
  BEGIN
    ROLLBACK;
    RESIGNAL;
  END;

  IF NULLIF(TRIM(p_name), '') IS NULL OR p_value <= 0 OR p_min_order_amount < 0
     OR p_priority < 0 OR p_end_date < p_start_date THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Invalid discount rule values';
  END IF;
  IF p_kind = 'PERCENT' AND p_value > 100 THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Percentage discount cannot exceed 100';
  END IF;
  IF p_rule_type = 'LOYALTY'
     AND COALESCE(p_tier, '') NOT IN ('BRONZE', 'SILVER', 'GOLD') THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Loyalty rule requires a valid tier';
  END IF;

  START TRANSACTION;
  IF p_rule_id IS NULL THEN
    INSERT INTO discount_rule (
      name, rule_type, kind, value, min_order_amount, max_discount, tier,
      start_date, end_date, priority, stackable, is_active
    )
    VALUES (
      TRIM(p_name), p_rule_type, p_kind, p_value, p_min_order_amount, p_max_discount,
      NULLIF(TRIM(p_tier), ''), p_start_date, p_end_date, p_priority,
      COALESCE(p_stackable, TRUE), COALESCE(p_is_active, TRUE)
    );
    SET p_saved_rule_id = LAST_INSERT_ID();
  ELSE
    UPDATE discount_rule
    SET name = TRIM(p_name), rule_type = p_rule_type, kind = p_kind,
        value = p_value, min_order_amount = p_min_order_amount,
        max_discount = p_max_discount, tier = NULLIF(TRIM(p_tier), ''),
        start_date = p_start_date, end_date = p_end_date, priority = p_priority,
        stackable = COALESCE(p_stackable, stackable),
        is_active = COALESCE(p_is_active, is_active)
    WHERE rule_id = p_rule_id;
    IF ROW_COUNT() = 0 THEN
      SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Discount rule does not exist';
    END IF;
    SET p_saved_rule_id = p_rule_id;
  END IF;
  COMMIT;
END$$

-- 3.8 Procedure: sp_save_coupon (Coupon Registration linked to Promotion Rule)
DROP PROCEDURE IF EXISTS sp_save_coupon$$
CREATE PROCEDURE sp_save_coupon(
  IN p_code VARCHAR(20),
  IN p_rule_id INT,
  IN p_max_uses INT,
  IN p_expires_on DATE
)
BEGIN
  DECLARE v_rule_exists INT DEFAULT 0;
  DECLARE EXIT HANDLER FOR SQLEXCEPTION
  BEGIN
    ROLLBACK;
    RESIGNAL;
  END;

  SELECT COUNT(*) INTO v_rule_exists FROM discount_rule WHERE rule_id = p_rule_id;
  IF NULLIF(TRIM(p_code), '') IS NULL OR p_max_uses <= 0 OR p_expires_on IS NULL
     OR v_rule_exists = 0 THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Invalid coupon details';
  END IF;

  START TRANSACTION;
  INSERT INTO coupon (code, rule_id, max_uses, expires_on)
  VALUES (UPPER(TRIM(p_code)), p_rule_id, p_max_uses, p_expires_on);
  COMMIT;
END$$

-- 3.9 Procedure: sp_save_holiday (Upserts Holiday in Calendar)
DROP PROCEDURE IF EXISTS sp_save_holiday$$
CREATE PROCEDURE sp_save_holiday(
  IN p_holiday_date DATE,
  IN p_name VARCHAR(100)
)
BEGIN
  DECLARE EXIT HANDLER FOR SQLEXCEPTION
  BEGIN
    ROLLBACK;
    RESIGNAL;
  END;

  IF p_holiday_date IS NULL OR NULLIF(TRIM(p_name), '') IS NULL THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Holiday date and name are required';
  END IF;

  START TRANSACTION;
  INSERT INTO holiday (holiday_date, name)
  VALUES (p_holiday_date, TRIM(p_name))
  ON DUPLICATE KEY UPDATE name = VALUES(name);
  COMMIT;
END$$

-- 3.10 Procedure: sp_save_holiday_discount (Atomic Holiday and Matching Promotion Upsert)
DROP PROCEDURE IF EXISTS sp_save_holiday_discount$$
CREATE PROCEDURE sp_save_holiday_discount(
  IN p_holiday_date DATE,
  IN p_name VARCHAR(100),
  IN p_discount_percent DECIMAL(10,2),
  OUT p_saved_rule_id INT
)
BEGIN
  DECLARE v_rule_name VARCHAR(100);
  DECLARE v_existing_rule_id INT DEFAULT NULL;
  DECLARE EXIT HANDLER FOR SQLEXCEPTION
  BEGIN
    ROLLBACK;
    RESIGNAL;
  END;

  IF p_holiday_date IS NULL
     OR NULLIF(TRIM(p_name), '') IS NULL
     OR p_discount_percent <= 0
     OR p_discount_percent > 100 THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'Holiday date, name and discount percentage are required; percentage must be between 0 and 100';
  END IF;

  SET v_rule_name = LEFT(CONCAT(TRIM(p_name), ' Promotion'), 100);

  START TRANSACTION;

  INSERT INTO holiday (holiday_date, name)
  VALUES (p_holiday_date, TRIM(p_name))
  ON DUPLICATE KEY UPDATE name = VALUES(name);

  SELECT rule_id
    INTO v_existing_rule_id
  FROM discount_rule
  WHERE rule_type = 'HOLIDAY'
    AND start_date = p_holiday_date
  ORDER BY rule_id
  LIMIT 1;

  UPDATE discount_rule
  SET name = v_rule_name,
      value = p_discount_percent,
      end_date = p_holiday_date,
      is_active = TRUE
  WHERE rule_id = v_existing_rule_id;

  IF v_existing_rule_id IS NULL THEN
    INSERT INTO discount_rule (
      name, rule_type, kind, value, min_order_amount, max_discount, tier,
      start_date, end_date, priority, stackable, is_active
    )
    VALUES (
      v_rule_name, 'HOLIDAY', 'PERCENT', p_discount_percent, 0.00, NULL, NULL,
      p_holiday_date, p_holiday_date, 50, TRUE, TRUE
    );
    SET p_saved_rule_id = LAST_INSERT_ID();
  ELSE
    SET p_saved_rule_id = v_existing_rule_id;
  END IF;

  UPDATE discount_rule
  SET is_active = FALSE
  WHERE rule_type = 'HOLIDAY'
    AND start_date = p_holiday_date
    AND rule_id <> p_saved_rule_id;

  COMMIT;
END$$

-- 3.11 Procedure: sp_apply_discounts (Priority Cursor Discount Engine with 50% Safety Cap)
DROP PROCEDURE IF EXISTS sp_apply_discounts$$
CREATE PROCEDURE sp_apply_discounts(
  IN p_order_id INT,
  IN p_coupon_code VARCHAR(20)
)
BEGIN
  DECLARE v_customer_id INT DEFAULT NULL;
  DECLARE v_order_date DATE;
  DECLARE v_subtotal DECIMAL(12,2) DEFAULT 0.00;
  DECLARE v_running_discount DECIMAL(12,2) DEFAULT 0.00;
  DECLARE v_discount DECIMAL(12,2) DEFAULT 0.00;
  DECLARE v_allowed DECIMAL(12,2) DEFAULT 0.00;
  DECLARE v_tier VARCHAR(10);
  DECLARE v_first_purchase BOOLEAN DEFAULT FALSE;
  DECLARE v_rule_id INT;
  DECLARE v_rule_type VARCHAR(20);
  DECLARE v_kind VARCHAR(10);
  DECLARE v_value DECIMAL(10,2);
  DECLARE v_min_order DECIMAL(12,2);
  DECLARE v_max_discount DECIMAL(12,2);
  DECLARE v_rule_tier VARCHAR(10);
  DECLARE v_stackable BOOLEAN;
  DECLARE v_coupon_rule_id INT DEFAULT NULL;
  DECLARE v_done BOOLEAN DEFAULT FALSE;
  DECLARE v_non_stackable_applied BOOLEAN DEFAULT FALSE;

  DECLARE rule_cursor CURSOR FOR
    SELECT rule_id, rule_type, kind, value, min_order_amount,
           max_discount, tier, stackable
    FROM discount_rule
    WHERE is_active = TRUE
      AND v_order_date BETWEEN start_date AND end_date
    ORDER BY priority ASC, rule_id ASC;
  DECLARE CONTINUE HANDLER FOR NOT FOUND SET v_done = TRUE;
  DECLARE EXIT HANDLER FOR SQLEXCEPTION
  BEGIN
    ROLLBACK;
    RESIGNAL;
  END;

  IF p_order_id IS NULL THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Order ID is required';
  END IF;

  START TRANSACTION;

  SELECT customer_id, DATE(order_date), subtotal
    INTO v_customer_id, v_order_date, v_subtotal
  FROM sales_order
  WHERE order_id = p_order_id
  FOR UPDATE;

  IF v_subtotal IS NULL THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Order does not exist';
  END IF;

  SET v_tier = fn_customer_tier(v_customer_id);
  SET v_first_purchase = fn_is_first_purchase(v_customer_id, p_order_id);

  DELETE FROM order_discount WHERE order_id = p_order_id;

  IF NULLIF(TRIM(p_coupon_code), '') IS NOT NULL THEN
    SELECT c.rule_id
      INTO v_coupon_rule_id
    FROM coupon c
    JOIN discount_rule r ON r.rule_id = c.rule_id
    WHERE c.code = UPPER(TRIM(p_coupon_code))
    FOR UPDATE;

    IF v_coupon_rule_id IS NULL
       OR NOT EXISTS (
         SELECT 1
         FROM coupon c
         JOIN discount_rule r ON r.rule_id = c.rule_id
         WHERE c.code = UPPER(TRIM(p_coupon_code))
           AND c.rule_id = v_coupon_rule_id
           AND c.expires_on >= v_order_date
           AND c.used_count < c.max_uses
           AND r.is_active = TRUE
           AND v_order_date BETWEEN r.start_date AND r.end_date
       ) THEN
      SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Coupon is invalid or expired';
    END IF;
  END IF;

  OPEN rule_cursor;
  rule_loop: LOOP
    FETCH rule_cursor INTO
      v_rule_id, v_rule_type, v_kind, v_value, v_min_order,
      v_max_discount, v_rule_tier, v_stackable;
    IF v_done THEN
      LEAVE rule_loop;
    END IF;

    IF v_subtotal < v_min_order THEN
      ITERATE rule_loop;
    END IF;
    IF v_rule_type = 'FIRST_PURCHASE' AND NOT v_first_purchase THEN
      ITERATE rule_loop;
    END IF;
    IF v_rule_type = 'HOLIDAY' AND NOT fn_is_holiday(v_order_date) THEN
      ITERATE rule_loop;
    END IF;
    IF v_rule_type = 'LOYALTY' AND (v_customer_id IS NULL OR v_rule_tier <> v_tier) THEN
      ITERATE rule_loop;
    END IF;
    IF v_rule_type = 'COUPON' AND v_rule_id <> v_coupon_rule_id THEN
      ITERATE rule_loop;
    END IF;
    IF NOT v_stackable AND v_non_stackable_applied THEN
      ITERATE rule_loop;
    END IF;

    IF v_kind = 'PERCENT' THEN
      SET v_discount = ROUND(v_subtotal * v_value / 100, 2);
    ELSE
      SET v_discount = v_value;
    END IF;
    IF v_max_discount IS NOT NULL THEN
      SET v_discount = LEAST(v_discount, v_max_discount);
    END IF;

    SET v_allowed = ROUND((v_subtotal * 0.50) - v_running_discount, 2);
    SET v_discount = LEAST(v_discount, GREATEST(v_allowed, 0.00));
    IF v_discount > 0 THEN
      INSERT INTO order_discount (order_id, rule_id, amount)
      VALUES (p_order_id, v_rule_id, v_discount);
      SET v_running_discount = v_running_discount + v_discount;
      IF NOT v_stackable THEN
        SET v_non_stackable_applied = TRUE;
      END IF;
      IF v_rule_type = 'COUPON' THEN
        UPDATE coupon
        SET used_count = used_count + 1
        WHERE code = UPPER(TRIM(p_coupon_code))
          AND used_count < max_uses;
      END IF;
    END IF;
  END LOOP;
  CLOSE rule_cursor;

  UPDATE sales_order
  SET discount_total = v_running_discount,
      total_amount = GREATEST(v_subtotal - v_running_discount, 0.00)
  WHERE order_id = p_order_id;

  COMMIT;

  SELECT od.rule_id, r.name AS rule_name, od.amount
  FROM order_discount od
  JOIN discount_rule r ON r.rule_id = od.rule_id
  WHERE od.order_id = p_order_id
  ORDER BY r.priority ASC, od.rule_id ASC;
END$$

-- 3.12 Procedure: sp_monthly_report (Hierarchical Sales Rollup with GROUP BY ... WITH ROLLUP)
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

-- 3.13 Procedure: sp_category_sales_cte (Recursive Category Tree CTE + Chain Revenue Share)
DROP PROCEDURE IF EXISTS sp_category_sales_cte$$
CREATE PROCEDURE sp_category_sales_cte()
BEGIN
    WITH RECURSIVE CategoryHierarchy AS (
        -- Anchor Member: Root categories
        SELECT 
            category_id,
            name AS category_name,
            CAST('Root' AS CHAR(100)) AS parent_category,
            1 AS hierarchy_level
        FROM category
        WHERE parent_id IS NULL
        UNION ALL
        -- Recursive Member: Subcategories
        SELECT 
            c.category_id,
            c.name AS category_name,
            ch.category_name AS parent_category,
            ch.hierarchy_level + 1 AS hierarchy_level
        FROM category c
        JOIN CategoryHierarchy ch ON c.parent_id = ch.category_id
    ),
    CategorySalesAgg AS (
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

-- ==============================================================================
-- SECTION 4: DATABASE TRIGGERS
-- ==============================================================================

DELIMITER $$

-- 4.1 Trigger: trg_inventory_low_stock (Fires on inventory quantity reduction)
DROP TRIGGER IF EXISTS trg_inventory_low_stock$$
CREATE TRIGGER trg_inventory_low_stock AFTER UPDATE ON inventory
FOR EACH ROW
BEGIN
  IF NEW.quantity <= NEW.reorder_level AND OLD.quantity > OLD.reorder_level THEN
    INSERT INTO low_stock_alert (branch_id, product_id, quantity)
    VALUES (NEW.branch_id, NEW.product_id, NEW.quantity);
  END IF;
END$$

-- 4.2 Trigger: trg_product_price_audit (Fires on product unit_price change)
DROP TRIGGER IF EXISTS trg_product_price_audit$$
CREATE TRIGGER trg_product_price_audit
AFTER UPDATE ON product
FOR EACH ROW
BEGIN
  IF OLD.unit_price <> NEW.unit_price THEN
    INSERT INTO price_audit_log (
      product_id, old_price, new_price, changed_by
    )
    VALUES (
      NEW.product_id, OLD.unit_price, NEW.unit_price, USER()
    );
  END IF;
END$$

-- 4.3 Trigger: trg_rule_check_insert (Validates promotion parameters before insertion)
DROP TRIGGER IF EXISTS trg_rule_check_insert$$
CREATE TRIGGER trg_rule_check_insert
BEFORE INSERT ON discount_rule
FOR EACH ROW
BEGIN
  IF NEW.kind = 'PERCENT' AND (NEW.value <= 0 OR NEW.value > 100) THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'Percentage discount must be between 0 and 100';
  END IF;
  IF NEW.end_date < NEW.start_date THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'Discount end date cannot precede start date';
  END IF;
  IF NEW.rule_type = 'LOYALTY'
     AND COALESCE(NEW.tier, '') NOT IN ('BRONZE', 'SILVER', 'GOLD') THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'Loyalty rule requires a valid tier';
  END IF;
END$$

-- 4.4 Trigger: trg_rule_check_update (Validates promotion parameters before update)
DROP TRIGGER IF EXISTS trg_rule_check_update$$
CREATE TRIGGER trg_rule_check_update
BEFORE UPDATE ON discount_rule
FOR EACH ROW
BEGIN
  IF NEW.kind = 'PERCENT' AND (NEW.value <= 0 OR NEW.value > 100) THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'Percentage discount must be between 0 and 100';
  END IF;
  IF NEW.end_date < NEW.start_date THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'Discount end date cannot precede start date';
  END IF;
  IF NEW.rule_type = 'LOYALTY'
     AND COALESCE(NEW.tier, '') NOT IN ('BRONZE', 'SILVER', 'GOLD') THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'Loyalty rule requires a valid tier';
  END IF;
END$$

-- 4.5 Trigger: trg_rule_audit (Audits modifications to discount values)
DROP TRIGGER IF EXISTS trg_rule_audit$$
CREATE TRIGGER trg_rule_audit
AFTER UPDATE ON discount_rule
FOR EACH ROW
BEGIN
  IF NOT (OLD.value <=> NEW.value) THEN
    INSERT INTO discount_rule_audit (
      rule_id, old_value, new_value, changed_by
    )
    VALUES (NEW.rule_id, OLD.value, NEW.value, USER());
  END IF;
END$$

-- 4.6 Trigger: trg_daily_sales_log (Audits daily sales aggregated entries)
DROP TRIGGER IF EXISTS trg_daily_sales_log$$
CREATE TRIGGER trg_daily_sales_log
AFTER INSERT ON daily_sales_summary
FOR EACH ROW
BEGIN
    INSERT INTO daily_sales_log (summary_date, branch_id, total_orders, total_sales, logged_at)
    VALUES (NEW.summary_date, NEW.branch_id, NEW.total_orders, NEW.total_sales, NOW());
END$$

DELIMITER ;

-- ==============================================================================
-- SECTION 5: SCHEDULED EVENTS
-- ==============================================================================

DELIMITER $$

-- 5.1 Event: ev_expire_discount_rules (Nightly deactivation of expired promotions)
DROP EVENT IF EXISTS ev_expire_discount_rules$$
CREATE EVENT ev_expire_discount_rules
ON SCHEDULE EVERY 1 DAY
STARTS (CURRENT_DATE + INTERVAL 1 DAY)
DO
BEGIN
  UPDATE discount_rule
  SET is_active = FALSE
  WHERE is_active = TRUE
    AND end_date < CURDATE();
END$$

-- 5.2 Event: ev_weekly_low_stock_scan (Weekly sweep creating unresolved alerts)
DROP EVENT IF EXISTS ev_weekly_low_stock_scan$$
CREATE EVENT ev_weekly_low_stock_scan
ON SCHEDULE EVERY 1 WEEK
DO
BEGIN
  INSERT INTO low_stock_alert (branch_id, product_id, quantity)
  SELECT i.branch_id, i.product_id, i.quantity FROM inventory i
  WHERE i.quantity <= i.reorder_level
    AND NOT EXISTS (
      SELECT 1 FROM low_stock_alert a
      WHERE a.branch_id = i.branch_id AND a.product_id = i.product_id AND a.resolved = FALSE
    );
END$$

-- 5.3 Event: ev_daily_sales_summary (Nightly aggregation at 01:00 AM)
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

-- 5.4 Event: ev_monthly_log_purge (Monthly maintenance purging audit entries older than 12 months)
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
