USE supermarket_db2;

-- 1. Robust First Purchase Qualification Function
DROP FUNCTION IF EXISTS fn_is_first_purchase;
DELIMITER $$
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
DELIMITER ;

-- 2. Fixed Discount Engine Procedure (No longer unconditionally awards Welcome 10 to Bronze)
DROP PROCEDURE IF EXISTS sp_apply_discounts;
DELIMITER $$
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
  SET v_first_purchase = (v_customer_id IS NOT NULL) AND fn_is_first_purchase(v_customer_id, p_order_id);

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
DELIMITER ;

-- 3. Customer Directory View with is_first_purchase indicator
CREATE OR REPLACE VIEW v_customer_directory AS
SELECT
  c.customer_id,
  c.full_name,
  c.phone,
  c.email,
  c.loyalty_points,
  fn_customer_tier(c.customer_id) AS tier,
  c.registered_date,
  fn_is_first_purchase(c.customer_id, NULL) AS is_first_purchase
FROM customer c;
