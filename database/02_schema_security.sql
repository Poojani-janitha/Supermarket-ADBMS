-- ============================================================================
-- SUPERMARKET CHAIN MANAGEMENT SYSTEM
-- ICT3222 Advanced Database Management Systems (ADBMS)
-- Script: 02_schema_security.sql
-- Primary Owner: Member 5 (Security, RBAC, Data Masking & Administration)
-- ============================================================================

USE supermarket_db;

-- ----------------------------------------------------------------------------
-- 1. EMPLOYEE AUDIT LOG (Member 5)
-- Captures full history of employee role alterations, branch reassignments,
-- and deactivations. Populated automatically by trg_employee_audit.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS employee_audit_log (
  log_id INT AUTO_INCREMENT PRIMARY KEY,
  employee_id INT NOT NULL,
  old_role VARCHAR(20) NULL,
  new_role VARCHAR(20) NULL,
  old_branch_id INT NULL,
  new_branch_id INT NULL,
  is_active_changed BOOLEAN NOT NULL DEFAULT FALSE,
  changed_by VARCHAR(100) NOT NULL,
  changed_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_emp_audit_emp_id (employee_id),
  INDEX idx_emp_audit_changed_at (changed_at)
) ENGINE=InnoDB;

-- ----------------------------------------------------------------------------
-- 2. SECURITY EVENT LOG (Member 5)
-- Audit trail for privileged administrative operations, role escalations,
-- and access control modifications.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS security_event_log (
  log_id INT AUTO_INCREMENT PRIMARY KEY,
  event_type VARCHAR(50) NOT NULL,
  details TEXT NULL,
  performed_by VARCHAR(100) NOT NULL,
  logged_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_sec_event_type (event_type),
  INDEX idx_sec_logged_at (logged_at)
) ENGINE=InnoDB;
