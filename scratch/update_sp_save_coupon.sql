USE supermarket_db2;

DROP PROCEDURE IF EXISTS sp_save_coupon;
DELIMITER $$
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
  VALUES (UPPER(TRIM(p_code)), p_rule_id, p_max_uses, p_expires_on)
  ON DUPLICATE KEY UPDATE
    rule_id = VALUES(rule_id),
    max_uses = VALUES(max_uses),
    expires_on = VALUES(expires_on);
  COMMIT;
END$$
DELIMITER ;

USE supermarket_db;

DROP PROCEDURE IF EXISTS sp_save_coupon;
DELIMITER $$
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
  VALUES (UPPER(TRIM(p_code)), p_rule_id, p_max_uses, p_expires_on)
  ON DUPLICATE KEY UPDATE
    rule_id = VALUES(rule_id),
    max_uses = VALUES(max_uses),
    expires_on = VALUES(expires_on);
  COMMIT;
END$$
DELIMITER ;
