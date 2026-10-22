USE supermarket_db;

-- Recreate Member 3 scalar functions safely when this script is rerun.
DROP FUNCTION IF EXISTS fn_customer_tier;
DROP FUNCTION IF EXISTS fn_is_holiday;
DROP FUNCTION IF EXISTS fn_is_first_purchase;
DROP FUNCTION IF EXISTS fn_coupon_valid;

DELIMITER $$

-- Calculates a customer's tier from completed-order spending only.
CREATE FUNCTION fn_customer_tier(p_customer_id INT)
RETURNS VARCHAR(10)
READS SQL DATA
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

-- Returns TRUE when the supplied date exists in the holiday calendar.
CREATE FUNCTION fn_is_holiday(p_date DATE)
RETURNS BOOLEAN
READS SQL DATA
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM holiday
    WHERE holiday_date = p_date
  );
END$$

-- Identifies customers with no other completed order before this order.
CREATE FUNCTION fn_is_first_purchase(p_customer_id INT, p_order_id INT)
RETURNS BOOLEAN
READS SQL DATA
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

-- Validates coupon ownership, dates, active rule status and usage remaining.
CREATE FUNCTION fn_coupon_valid(p_code VARCHAR(20), p_rule_id INT)
RETURNS BOOLEAN
READS SQL DATA
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

DELIMITER ;
