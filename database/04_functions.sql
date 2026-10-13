-- ============================================================================
-- SUPERMARKET CHAIN MANAGEMENT SYSTEM
-- ICT3222 Advanced Database Management Systems (ADBMS)
-- Script 04: User-Defined Functions (UDFs)
-- Engine: MySQL 8.0 (InnoDB)
-- ============================================================================

USE supermarket_db;

DELIMITER $$

-- ============================================================================
-- MEMBER 1 UDF: Order Line Item Subtotal Calculation
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
-- MEMBER 2 UDF: Current Inventory Quantity Lookup
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
-- MEMBER 3 UDF: Customer Loyalty Tier Classification
-- ============================================================================
DROP FUNCTION IF EXISTS fn_customer_tier$$
CREATE FUNCTION fn_customer_tier(p_customer_id INT) RETURNS VARCHAR(10)
READS SQL DATA
BEGIN
  DECLARE v_spent DECIMAL(14,2);
  SELECT COALESCE(SUM(total_amount), 0) INTO v_spent
  FROM sales_order
  WHERE customer_id = p_customer_id AND status = 'COMPLETED';

  RETURN CASE 
    WHEN v_spent >= 100000 THEN 'GOLD'
    WHEN v_spent >= 50000  THEN 'SILVER'
    ELSE 'BRONZE' 
  END;
END$$

-- ============================================================================
-- MEMBER 3 UDF: Holiday Verification
-- ============================================================================
DROP FUNCTION IF EXISTS fn_is_holiday$$
CREATE FUNCTION fn_is_holiday(p_date DATE) RETURNS BOOLEAN
READS SQL DATA
BEGIN
  RETURN EXISTS (SELECT 1 FROM holiday WHERE holiday_date = p_date);
END$$

-- ============================================================================
-- MEMBER 3 UDF: First Purchase Eligibility
-- ============================================================================
DROP FUNCTION IF EXISTS fn_is_first_purchase$$
CREATE FUNCTION fn_is_first_purchase(p_customer INT, p_order INT) RETURNS BOOLEAN
READS SQL DATA
BEGIN
  RETURN p_customer IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM sales_order
    WHERE customer_id = p_customer AND order_id <> p_order AND status = 'COMPLETED'
  );
END$$

-- ============================================================================
-- MEMBER 3 UDF: Coupon Validity Validation
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
-- MEMBER 4 UDF: Moving Average Sales Metric
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
-- MEMBER 5 UDF: Dynamic Data Masking Function for Customer PII
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
