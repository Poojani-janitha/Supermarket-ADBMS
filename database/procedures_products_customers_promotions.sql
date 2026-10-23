USE supermarket_db;

-- These DROP statements make deployment repeatable during development.
DROP PROCEDURE IF EXISTS sp_save_product;
DROP PROCEDURE IF EXISTS sp_register_customer;
DROP PROCEDURE IF EXISTS sp_save_discount_rule;
DROP PROCEDURE IF EXISTS sp_save_coupon;
DROP PROCEDURE IF EXISTS sp_save_holiday;
DROP PROCEDURE IF EXISTS sp_save_holiday_discount;
DROP PROCEDURE IF EXISTS sp_apply_discounts;

DELIMITER $$

-- Inserts or updates a product after validating related category, supplier and SKU.
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

-- Registers a loyalty customer and prevents duplicate phone numbers.
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

-- Inserts or updates a promotion rule with business-value validation.
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

-- Creates a coupon linked to an existing promotion rule.
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

-- Adds or renames a holiday without creating duplicate calendar dates.
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

-- Creates or updates a holiday and its matching percentage promotion atomically.
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

-- Applies valid rules in priority order with a cursor and a 50% cap.
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
  SET v_first_purchase = fn_is_first_purchase(v_customer_id, p_order_id) OR (v_customer_id IS NOT NULL AND v_tier = 'BRONZE');

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
