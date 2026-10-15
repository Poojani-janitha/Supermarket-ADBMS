-- ============================================================================
-- SUPERMARKET CHAIN MANAGEMENT SYSTEM
-- ICT3222 Advanced Database Management Systems (ADBMS)
-- Script: 04_procedures_security.sql
-- Primary Owner: Member 5 (Security, RBAC, Data Masking & Administration)
-- ============================================================================

USE supermarket_db;

DELIMITER $$

-- ----------------------------------------------------------------------------
-- 1. sp_get_login
-- Fetches active employee authentication credentials and BCrypt password hash.
-- ----------------------------------------------------------------------------
DROP PROCEDURE IF EXISTS sp_get_login$$
CREATE PROCEDURE sp_get_login(IN p_username VARCHAR(50))
BEGIN
  SELECT employee_id, branch_id, full_name, role, password_hash, is_active
  FROM employee 
  WHERE username = p_username AND is_active = TRUE;
END$$

-- ----------------------------------------------------------------------------
-- 2. sp_deactivate_employee
-- Transactionally deactivates an employee with Self-Lockout constraint guard.
-- Prevents administrators from accidentally revoking their own active access.
-- Logs event to security_event_log and triggers trg_employee_audit.
-- ----------------------------------------------------------------------------
DROP PROCEDURE IF EXISTS sp_deactivate_employee$$
CREATE PROCEDURE sp_deactivate_employee(
  IN p_admin_id INT, 
  IN p_target_emp_id INT
)
BEGIN
  DECLARE EXIT HANDLER FOR SQLEXCEPTION 
  BEGIN 
    ROLLBACK; 
    RESIGNAL; 
  END;

  -- Security Guard: Admin cannot deactivate their own session
  IF p_admin_id = p_target_emp_id THEN
    SIGNAL SQLSTATE '45000' 
      SET MESSAGE_TEXT = 'Security Violation: Administrator cannot deactivate own account';
  END IF;

  -- Check if employee exists
  IF (SELECT COUNT(*) FROM employee WHERE employee_id = p_target_emp_id) = 0 THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'Employee not found';
  END IF;

  START TRANSACTION;

  UPDATE employee 
  SET is_active = FALSE 
  WHERE employee_id = p_target_emp_id;

  INSERT INTO security_event_log (event_type, details, performed_by)
  VALUES ('EMPLOYEE_DEACTIVATED', CONCAT('Target Employee ID: ', p_target_emp_id), USER());

  COMMIT;
END$$

-- ----------------------------------------------------------------------------
-- 3. sp_change_user_role
-- Transactionally modifies employee role and captures privileged audit log.
-- ----------------------------------------------------------------------------
DROP PROCEDURE IF EXISTS sp_change_user_role$$
CREATE PROCEDURE sp_change_user_role(
  IN p_emp_id INT, 
  IN p_new_role VARCHAR(20)
)
BEGIN
  DECLARE EXIT HANDLER FOR SQLEXCEPTION 
  BEGIN 
    ROLLBACK; 
    RESIGNAL; 
  END;

  -- Validate role
  IF p_new_role NOT IN ('ADMIN', 'MANAGER', 'CASHIER') THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'Invalid role: must be ADMIN, MANAGER, or CASHIER';
  END IF;

  -- Check if employee exists
  IF (SELECT COUNT(*) FROM employee WHERE employee_id = p_emp_id) = 0 THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'Employee not found';
  END IF;

  START TRANSACTION;

  UPDATE employee 
  SET role = p_new_role 
  WHERE employee_id = p_emp_id;

  INSERT INTO security_event_log (event_type, details, performed_by)
  VALUES ('ROLE_CHANGE', CONCAT('Emp ID: ', p_emp_id, ' New Role: ', p_new_role), USER());

  COMMIT;
END$$

DELIMITER ;
