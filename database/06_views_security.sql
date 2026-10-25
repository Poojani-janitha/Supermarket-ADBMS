-- ============================================================================
-- SUPERMARKET CHAIN MANAGEMENT SYSTEM
-- ICT3222 Advanced Database Management Systems (ADBMS)
-- Script: 06_views_security.sql
-- Primary Owner: Member 5 (Security, RBAC, Data Masking & Administration)
-- ============================================================================

USE supermarket_db;

-- ----------------------------------------------------------------------------
-- 1. v_masked_customer_directory
-- Dynamic Data Masking View. Protects sensitive customer phone numbers (PII)
-- for Cashier role access using the fn_mask_phone deterministic UDF.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE VIEW v_masked_customer_directory AS
SELECT 
  customer_id, 
  full_name, 
  fn_mask_phone(phone) AS masked_phone, 
  registered_date, 
  loyalty_points 
FROM customer;

-- ----------------------------------------------------------------------------
-- 2. v_security_audit_log
-- Administrative overview of privileged security events, role alterations,
-- and account deactivations.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE VIEW v_security_audit_log AS
SELECT 
  log_id,
  event_type,
  details,
  performed_by,
  logged_at
FROM security_event_log;

-- ----------------------------------------------------------------------------
-- 3. v_employee_audit_history
-- Enriched audit view combining employee details and branch names for the
-- admin management dashboard.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE VIEW v_employee_audit_history AS
SELECT 
  eal.log_id,
  eal.employee_id,
  e.full_name AS employee_name,
  eal.old_role,
  eal.new_role,
  b_old.name AS old_branch_name,
  b_new.name AS new_branch_name,
  eal.is_active_changed,
  eal.changed_by,
  eal.changed_at
FROM employee_audit_log eal
JOIN employee e ON e.employee_id = eal.employee_id
LEFT JOIN branch b_old ON b_old.branch_id = eal.old_branch_id
LEFT JOIN branch b_new ON b_new.branch_id = eal.new_branch_id;
