-- ============================================================================
-- SUPERMARKET CHAIN MANAGEMENT SYSTEM
-- ICT3222 Advanced Database Management Systems (ADBMS)
-- Script: 05_triggers_security.sql
-- Primary Owner: Member 5 (Security, RBAC, Data Masking & Administration)
-- ============================================================================

USE supermarket_db;

DELIMITER $$

-- ----------------------------------------------------------------------------
-- 1. trg_employee_audit (AFTER UPDATE)
-- Automatically captures any changes to employee roles, branch assignments,
-- or account activation statuses and writes an immutable audit record.
-- ----------------------------------------------------------------------------
DROP TRIGGER IF EXISTS trg_employee_audit$$
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

-- ----------------------------------------------------------------------------
-- 2. trg_security_alert (BEFORE UPDATE)
-- Safeguards system administrator accounts from unauthorized demotion or tampering.
-- ----------------------------------------------------------------------------
DROP TRIGGER IF EXISTS trg_security_alert$$
CREATE TRIGGER trg_security_alert
BEFORE UPDATE ON employee
FOR EACH ROW
BEGIN
  DECLARE v_admin_role_id INT;
  SELECT role_id INTO v_admin_role_id FROM roles WHERE role_name = 'ADMIN' LIMIT 1;

  -- Prevent demotion or deactivation of the primary system administrator accounts
  IF (OLD.employee_id IN (1, 100) OR OLD.username IN ('admin', 'admin_kavindu')) 
     AND (NEW.role_id <> v_admin_role_id OR NEW.is_active = FALSE) THEN
    SIGNAL SQLSTATE '45000' 
      SET MESSAGE_TEXT = 'Security Violation: Primary root administrator account cannot be deactivated or demoted';
  END IF;
END$$

DELIMITER ;
