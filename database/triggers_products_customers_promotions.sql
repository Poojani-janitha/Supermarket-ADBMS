USE supermarket_db;

-- Recreate only Member 3 triggers when this script is redeployed.
DROP TRIGGER IF EXISTS trg_product_price_audit;
DROP TRIGGER IF EXISTS trg_rule_check_insert;
DROP TRIGGER IF EXISTS trg_rule_check_update;
DROP TRIGGER IF EXISTS trg_rule_audit;

DELIMITER $$

-- Records old and new prices whenever a product price changes.
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

-- Rejects invalid promotion rules before they enter the table.
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

-- Applies the same promotion validation to rule updates.
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

-- Audits changes to a promotion's discount value.
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

DELIMITER ;
