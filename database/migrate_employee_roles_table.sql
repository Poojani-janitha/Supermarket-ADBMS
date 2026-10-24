USE supermarket_db;

-- 1. Create the new roles table
CREATE TABLE IF NOT EXISTS roles (
  role_id INT AUTO_INCREMENT PRIMARY KEY,
  role_name VARCHAR(50) NOT NULL UNIQUE,
  description VARCHAR(255) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 2. Insert standard roles
INSERT IGNORE INTO roles (role_name, description) VALUES
('ADMIN', 'Full system and database administrative access'),
('MANAGER', 'Branch management, inventory, reports, and staff supervision'),
('CASHIER', 'POS billing, customer checkout, and sales transactions'),
('DB_MANAGER', 'Database schema, backups, indexes, and performance management'),
('HR', 'Human resources, staff records, and organizational administration');

-- 3. Check if role_id column already exists
SET @col_exists = (
  SELECT COUNT(*) 
  FROM information_schema.COLUMNS 
  WHERE TABLE_SCHEMA = 'supermarket_db' 
    AND TABLE_NAME = 'employee' 
    AND COLUMN_NAME = 'role_id'
);

SET @sql_add_col = IF(@col_exists = 0, 'ALTER TABLE employee ADD COLUMN role_id INT NULL AFTER branch_id;', 'SELECT 1;');
PREPARE stmt FROM @sql_add_col;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 4. Check if old role column exists to migrate data
SET @old_col_exists = (
  SELECT COUNT(*) 
  FROM information_schema.COLUMNS 
  WHERE TABLE_SCHEMA = 'supermarket_db' 
    AND TABLE_NAME = 'employee' 
    AND COLUMN_NAME = 'role'
);

SET @sql_migrate = IF(@old_col_exists > 0, 'UPDATE employee e JOIN roles r ON UPPER(e.role) = UPPER(r.role_name) SET e.role_id = r.role_id;', 'SELECT 1;');
PREPARE stmt FROM @sql_migrate;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Fallback for any unmapped role_id
UPDATE employee 
SET role_id = (SELECT role_id FROM roles WHERE role_name = 'CASHIER' LIMIT 1) 
WHERE role_id IS NULL;

-- 5. Enforce NOT NULL and Foreign Key
ALTER TABLE employee MODIFY COLUMN role_id INT NOT NULL;

SET @fk_exists = (
  SELECT COUNT(*) 
  FROM information_schema.TABLE_CONSTRAINTS 
  WHERE CONSTRAINT_SCHEMA = 'supermarket_db' 
    AND TABLE_NAME = 'employee' 
    AND CONSTRAINT_NAME = 'fk_employee_role'
);

SET @sql_add_fk = IF(@fk_exists = 0, 'ALTER TABLE employee ADD CONSTRAINT fk_employee_role FOREIGN KEY (role_id) REFERENCES roles(role_id) ON UPDATE CASCADE;', 'SELECT 1;');
PREPARE stmt FROM @sql_add_fk;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 6. Drop old triggers that reference old role column
DROP TRIGGER IF EXISTS trg_security_alert;
DROP TRIGGER IF EXISTS trg_employee_audit;

-- 7. Drop old role column from employee table if present
SET @sql_drop_col = IF(@old_col_exists > 0, 'ALTER TABLE employee DROP COLUMN role;', 'SELECT 1;');
PREPARE stmt FROM @sql_drop_col;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 8. Recreate triggers using role_id
DELIMITER $$

CREATE TRIGGER trg_security_alert 
BEFORE UPDATE ON employee 
FOR EACH ROW 
BEGIN
  DECLARE v_admin_role_id INT;
  SELECT role_id INTO v_admin_role_id FROM roles WHERE role_name = 'ADMIN' LIMIT 1;

  IF (OLD.employee_id IN (1, 100) OR OLD.username IN ('admin', 'admin_kavindu')) 
     AND (NEW.role_id <> v_admin_role_id OR NEW.is_active = FALSE) THEN
    SIGNAL SQLSTATE '45000' 
      SET MESSAGE_TEXT = 'Security Violation: Primary root administrator account cannot be deactivated or demoted';
  END IF;
END$$

CREATE TRIGGER trg_employee_audit 
AFTER UPDATE ON employee 
FOR EACH ROW 
BEGIN
  IF OLD.role_id <> NEW.role_id 
     OR OLD.branch_id <> NEW.branch_id 
     OR OLD.is_active <> NEW.is_active THEN
    INSERT INTO employee_audit_log (
      employee_id, 
      old_role, 
      new_role, 
      old_branch_id, 
      new_branch_id, 
      is_active_changed, 
      changed_by,
      changed_at
    ) VALUES (
      NEW.employee_id, 
      (SELECT role_name FROM roles WHERE role_id = OLD.role_id), 
      (SELECT role_name FROM roles WHERE role_id = NEW.role_id), 
      OLD.branch_id, 
      NEW.branch_id,
      (OLD.is_active <> NEW.is_active), 
      USER(),
      NOW()
    );
  END IF;
END$$

-- 9. Recreate stored procedures
DROP PROCEDURE IF EXISTS sp_get_login$$
CREATE PROCEDURE sp_get_login(IN p_username VARCHAR(50))
BEGIN
  SELECT e.employee_id, e.branch_id, e.full_name, r.role_name AS role, e.password_hash, e.is_active
  FROM employee e
  JOIN roles r ON e.role_id = r.role_id
  WHERE e.username = p_username AND e.is_active = TRUE;
END$$

DROP PROCEDURE IF EXISTS sp_change_user_role$$
CREATE PROCEDURE sp_change_user_role(
  IN p_emp_id INT, 
  IN p_new_role VARCHAR(50)
)
BEGIN
  DECLARE v_role_id INT;
  DECLARE EXIT HANDLER FOR SQLEXCEPTION 
  BEGIN 
    ROLLBACK; 
    RESIGNAL; 
  END;

  -- Find or insert role in roles table
  SELECT role_id INTO v_role_id FROM roles WHERE UPPER(role_name) = UPPER(p_new_role) LIMIT 1;
  IF v_role_id IS NULL THEN
    INSERT INTO roles (role_name, description) VALUES (UPPER(p_new_role), CONCAT('Custom role: ', UPPER(p_new_role)));
    SET v_role_id = LAST_INSERT_ID();
  END IF;

  -- Check if employee exists
  IF (SELECT COUNT(*) FROM employee WHERE employee_id = p_emp_id) = 0 THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'Employee not found';
  END IF;

  START TRANSACTION;

  UPDATE employee 
  SET role_id = v_role_id 
  WHERE employee_id = p_emp_id;

  INSERT INTO security_event_log (event_type, details, performed_by)
  VALUES ('ROLE_CHANGE', CONCAT('Emp ID: ', p_emp_id, ' New Role: ', p_new_role), USER());

  COMMIT;
END$$

DELIMITER ;

-- 10. Grant privileges on roles table
GRANT SELECT, INSERT, UPDATE ON supermarket_db.roles TO 'app_user'@'%';
FLUSH PRIVILEGES;
