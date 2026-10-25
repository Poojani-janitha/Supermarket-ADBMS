-- ============================================================================
-- SUPERMARKET CHAIN MANAGEMENT SYSTEM
-- ICT3222 Advanced Database Management Systems (ADBMS)
-- Script 05: Product & Discount Procedures (Supporting Member 1 Checkout)
-- Engine: MySQL 8.0 (InnoDB)
-- ============================================================================

USE supermarket_db;

DELIMITER $$

-- ============================================================================
-- MEMBER 3: Promotional Discount Engine (Cursor Implementation)
-- Called directly by sp_place_order (Member 1)
-- ============================================================================
DROP PROCEDURE IF EXISTS sp_apply_discounts$$
CREATE PROCEDURE sp_apply_discounts(IN p_order_id INT, IN p_coupon VARCHAR(20))
BEGIN
  DECLARE done INT DEFAULT 0;
  DECLARE v_rule INT;
  DECLARE v_type VARCHAR(20);
  DECLARE v_kind VARCHAR(10);
  DECLARE v_value DECIMAL(10,2);
  DECLARE v_min DECIMAL(12,2);
  DECLARE v_max DECIMAL(12,2);
  DECLARE v_tier VARCHAR(10);
  DECLARE v_stack BOOLEAN;
  DECLARE v_customer INT;
  DECLARE v_date DATE;
  DECLARE v_subtotal DECIMAL(12,2);
  DECLARE v_amt DECIMAL(12,2);
  DECLARE v_total DECIMAL(12,2) DEFAULT 0.00;
  DECLARE v_ok BOOLEAN;

  DECLARE cur CURSOR FOR
    SELECT rule_id, rule_type, kind, value, min_order_amount, max_discount, tier, stackable
    FROM discount_rule
    WHERE is_active AND CURDATE() BETWEEN start_date AND end_date
    ORDER BY priority ASC;

  DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = 1;

  -- Fetch order details and subtotal calculated from order_item via fn_order_total
  SELECT customer_id, DATE(order_date), fn_order_total(order_id)
    INTO v_customer, v_date, v_subtotal
  FROM sales_order WHERE order_id = p_order_id;

  SET done = 0;
  OPEN cur;

  rule_loop: LOOP
    FETCH cur INTO v_rule, v_type, v_kind, v_value, v_min, v_max, v_tier, v_stack;
    IF done THEN LEAVE rule_loop; END IF;

    -- First-purchase and loyalty rules are automatic. Other rules require an explicit coupon.
    SET v_ok = CASE
      WHEN v_type = 'FIRST_PURCHASE' THEN fn_is_first_purchase(v_customer, p_order_id)
      WHEN v_type = 'LOYALTY' THEN v_customer IS NOT NULL AND fn_customer_tier(v_customer) = v_tier
      ELSE fn_coupon_valid(p_coupon, v_rule)
    END;

    -- Apply discount if qualified and subtotal threshold met
    IF COALESCE(v_ok, 0) AND v_subtotal >= v_min AND (v_stack OR v_total = 0.00) THEN
      SET v_amt = IF(v_kind = 'PERCENT', ROUND(v_subtotal * v_value / 100.0, 2), v_value);
      IF v_max IS NOT NULL THEN 
        SET v_amt = LEAST(v_amt, v_max); 
      END IF;

      -- Capped at maximum 50% total order discount
      SET v_amt = LEAST(v_amt, ROUND(v_subtotal * 0.50, 2) - v_total);

      IF v_amt > 0 THEN
        INSERT INTO order_discount (order_id, rule_id, amount) VALUES (p_order_id, v_rule, v_amt);
        SET v_total = v_total + v_amt;

        IF v_type = 'COUPON' AND p_coupon IS NOT NULL THEN
          UPDATE coupon SET used_count = used_count + 1 WHERE code = p_coupon;
        END IF;
      END IF;
    END IF;
  END LOOP;

  CLOSE cur;

  -- Update order header with calculated totals
  UPDATE sales_order
  SET subtotal = v_subtotal,
      discount_total = v_total,
      total_amount = GREATEST(0.00, v_subtotal - v_total)
  WHERE order_id = p_order_id;
END$$

DELIMITER ;
