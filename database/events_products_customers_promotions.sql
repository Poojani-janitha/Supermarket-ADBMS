USE supermarket_db;

-- Remove the old event so repeated deployments do not create duplicates.
DROP EVENT IF EXISTS ev_expire_discount_rules;

DELIMITER $$

-- Runs daily and deactivates rules whose end date has passed.
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

DELIMITER ;
