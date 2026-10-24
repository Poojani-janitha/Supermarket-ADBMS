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
  DECLARE v_points INT DEFAULT 0;

  IF p_customer_id IS NULL THEN
    RETURN 'BRONZE';
  END IF;

  SELECT COALESCE(loyalty_points, 0)
    INTO v_points
  FROM customer
  WHERE customer_id = p_customer_id;

  RETURN CASE
    WHEN v_points >= 1000 THEN 'GOLD'
    WHEN v_points >= 500  THEN 'SILVER'
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

-- Identifies customers with no other completed order before this order and no prior welcome discount.
CREATE FUNCTION fn_is_first_purchase(p_customer_id INT, p_order_id INT)
RETURNS BOOLEAN
READS SQL DATA
DETERMINISTIC
BEGIN
  IF p_customer_id IS NULL THEN
    RETURN FALSE;
  END IF;

  -- 1. Check if customer has any other COMPLETED sales orders
  IF EXISTS (
    SELECT 1
    FROM sales_order
    WHERE customer_id = p_customer_id
      AND order_id <> COALESCE(p_order_id, -1)
      AND status = 'COMPLETED'
  ) THEN
    RETURN FALSE;
  END IF;

  -- 2. Check if customer has EVER already received the FIRST_PURCHASE discount on any order other than p_order_id
  IF EXISTS (
    SELECT 1
    FROM order_discount od
    JOIN sales_order so ON so.order_id = od.order_id
    JOIN discount_rule dr ON dr.rule_id = od.rule_id
    WHERE so.customer_id = p_customer_id
      AND dr.rule_type = 'FIRST_PURCHASE'
      AND so.order_id <> COALESCE(p_order_id, -1)
  ) THEN
    RETURN FALSE;
  END IF;

  RETURN TRUE;
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
