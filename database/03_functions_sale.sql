-- ============================================================================
-- SUPERMARKET CHAIN MANAGEMENT SYSTEM
-- ICT3222 Advanced Database Management Systems (ADBMS)
-- Script 03: Member 1 User-Defined Functions (Sales & Order Calculation)
-- Engine: MySQL 8.0 (InnoDB)
-- ============================================================================

USE supermarket_db;

DELIMITER $$

-- ============================================================================
-- MEMBER 1 UDF 1: Order Line Item Subtotal Calculation
-- Computes the un-discounted subtotal directly from clustered order_item rows
-- ============================================================================
DROP FUNCTION IF EXISTS fn_order_total$$
CREATE FUNCTION fn_order_total(p_order_id INT) RETURNS DECIMAL(12,2)
READS SQL DATA
DETERMINISTIC
BEGIN
  DECLARE v_total DECIMAL(12,2);
  SELECT COALESCE(SUM(line_total), 0.00) INTO v_total
  FROM order_item
  WHERE order_id = p_order_id;
  RETURN v_total;
END$$

-- ============================================================================
-- MEMBER 1 UDF 2: Order Total Items Count
-- Returns total quantity of units sold across all lines of an order
-- ============================================================================
DROP FUNCTION IF EXISTS fn_order_item_count$$
CREATE FUNCTION fn_order_item_count(p_order_id INT) RETURNS INT
READS SQL DATA
DETERMINISTIC
BEGIN
  DECLARE v_count INT;
  SELECT COALESCE(SUM(quantity), 0) INTO v_count
  FROM order_item
  WHERE order_id = p_order_id;
  RETURN v_count;
END$$

-- ============================================================================
-- SUPPORTING UDF: Customer Loyalty Tier Classification (Used by Checkout Discount Engine)
-- ============================================================================
DROP FUNCTION IF EXISTS fn_customer_tier$$
CREATE FUNCTION fn_customer_tier(p_customer_id INT) RETURNS VARCHAR(10)
READS SQL DATA
BEGIN
  DECLARE v_points INT DEFAULT 0;
  IF p_customer_id IS NULL THEN
    RETURN 'BRONZE';
  END IF;

  SELECT COALESCE(loyalty_points, 0) INTO v_points
  FROM customer
  WHERE customer_id = p_customer_id;

  RETURN CASE 
    WHEN v_points >= 1000 THEN 'GOLD'
    WHEN v_points >= 500  THEN 'SILVER'
    ELSE 'BRONZE' 
  END;
END$$

-- ============================================================================
-- SUPPORTING UDF: Holiday Verification (Used by Checkout Discount Engine)
-- ============================================================================
DROP FUNCTION IF EXISTS fn_is_holiday$$
CREATE FUNCTION fn_is_holiday(p_date DATE) RETURNS BOOLEAN
READS SQL DATA
BEGIN
  RETURN EXISTS (SELECT 1 FROM holiday WHERE holiday_date = p_date);
END$$

-- ============================================================================
-- SUPPORTING UDF: First Purchase Qualification Check
-- ============================================================================
DROP FUNCTION IF EXISTS fn_is_first_purchase$$
CREATE FUNCTION fn_is_first_purchase(p_customer INT, p_order INT) RETURNS BOOLEAN
READS SQL DATA
DETERMINISTIC
BEGIN
  IF p_customer IS NULL THEN
    RETURN FALSE;
  END IF;

  IF EXISTS (
    SELECT 1 FROM sales_order
    WHERE customer_id = p_customer AND order_id <> COALESCE(p_order, -1) AND status = 'COMPLETED'
  ) THEN
    RETURN FALSE;
  END IF;

  IF EXISTS (
    SELECT 1 FROM order_discount od
    JOIN sales_order so ON so.order_id = od.order_id
    JOIN discount_rule dr ON dr.rule_id = od.rule_id
    WHERE so.customer_id = p_customer AND dr.rule_type = 'FIRST_PURCHASE' AND so.order_id <> COALESCE(p_order, -1)
  ) THEN
    RETURN FALSE;
  END IF;

  RETURN TRUE;
END$$

-- ============================================================================
-- SUPPORTING UDF: Coupon Validity Verification
-- ============================================================================
DROP FUNCTION IF EXISTS fn_coupon_valid$$
CREATE FUNCTION fn_coupon_valid(p_code VARCHAR(20), p_rule INT) RETURNS BOOLEAN
READS SQL DATA
BEGIN
  RETURN p_code IS NOT NULL AND EXISTS (
    SELECT 1 FROM coupon 
    WHERE code = p_code 
      AND rule_id = p_rule
      AND expires_on >= CURDATE() 
      AND used_count < max_uses
  );
END$$

-- ============================================================================
-- SUPPORTING UDF: Stock Level Check (Member 2 Utility)
-- ============================================================================
DROP FUNCTION IF EXISTS fn_stock_level$$
CREATE FUNCTION fn_stock_level(p_branch INT, p_product INT) RETURNS INT
READS SQL DATA
BEGIN
  DECLARE v_qty INT;
  SELECT quantity INTO v_qty FROM inventory
  WHERE branch_id = p_branch AND product_id = p_product;
  RETURN COALESCE(v_qty, 0);
END$$

-- ============================================================================
-- SUPPORTING UDF: Moving Average Sales Metric (Member 4)
-- ============================================================================
DROP FUNCTION IF EXISTS fn_avg_daily_sales$$
CREATE FUNCTION fn_avg_daily_sales(p_branch INT, p_days INT) RETURNS DECIMAL(12,2)
READS SQL DATA
BEGIN
  DECLARE v_avg DECIMAL(12,2);
  SELECT COALESCE(AVG(total_sales), 0.00) INTO v_avg
  FROM daily_sales_summary
  WHERE branch_id = p_branch 
    AND summary_date >= CURDATE() - INTERVAL p_days DAY;
  RETURN v_avg;
END$$

-- ============================================================================
-- SUPPORTING UDF: Dynamic Data Masking Function for Customer PII (Member 5)
-- ============================================================================
DROP FUNCTION IF EXISTS fn_mask_phone$$
CREATE FUNCTION fn_mask_phone(p_phone VARCHAR(20)) RETURNS VARCHAR(20)
DETERMINISTIC
BEGIN
  IF p_phone IS NULL OR LENGTH(p_phone) < 7 THEN
    RETURN p_phone;
  END IF;
  RETURN CONCAT(LEFT(p_phone, 3), '****', RIGHT(p_phone, 3));
END$$

DELIMITER ;

