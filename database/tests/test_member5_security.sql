-- ============================================================================
-- SUPERMARKET CHAIN MANAGEMENT SYSTEM (ICT3222 ADBMS)
-- Automated Test Suite: Member 5 (Security, RBAC, Data Masking & Administration)
-- File: database/tests/test_member5_security.sql
-- ============================================================================

USE supermarket_db;

SELECT '=========================================' AS test_header;
SELECT 'STARTING MEMBER 5 DATABASE SECURITY TESTS' AS test_header;
SELECT '=========================================' AS test_header;

-- ----------------------------------------------------------------------------
-- TEST 1: Dynamic Data Masking Function (fn_mask_phone)
-- ----------------------------------------------------------------------------
SELECT 
  'TEST 1: fn_mask_phone' AS test_name,
  fn_mask_phone('0771234567') AS output_phone,
  IF(fn_mask_phone('0771234567') = '077****567', 'PASSED', 'FAILED') AS result;

-- ----------------------------------------------------------------------------
-- TEST 2: Password Complexity Validator (fn_check_password_strength)
-- ----------------------------------------------------------------------------
SELECT 
  'TEST 2: fn_check_password_strength' AS test_name,
  fn_check_password_strength('Admin$KeyPass2026!') AS strong_res,
  fn_check_password_strength('admin123') AS weak_res,
  IF(fn_check_password_strength('Admin$KeyPass2026!') = 'STRONG' 
     AND fn_check_password_strength('admin123') = 'WEAK', 'PASSED', 'FAILED') AS result;

-- ----------------------------------------------------------------------------
-- TEST 3: Masked Customer Directory View (v_masked_customer_directory)
-- ----------------------------------------------------------------------------
SELECT 
  'TEST 3: v_masked_customer_directory PII Protection' AS test_name,
  customer_id, 
  full_name, 
  masked_phone,
  IF(masked_phone LIKE '%****%', 'PASSED', 'FAILED') AS pii_masked
FROM v_masked_customer_directory 
LIMIT 3;

-- ----------------------------------------------------------------------------
-- TEST 4: Authentication Procedure (sp_get_login)
-- ----------------------------------------------------------------------------
SELECT 'TEST 4: sp_get_login for admin_kavindu' AS test_name;
CALL sp_get_login('admin_kavindu');

-- ----------------------------------------------------------------------------
-- TEST 5: Role Alteration Procedure & Trigger Audit (trg_employee_audit)
-- ----------------------------------------------------------------------------
-- Setup a temporary employee for testing
INSERT INTO branch (branch_id, name, city, province, address, phone)
VALUES (1, 'Flagship Branch Colombo', 'Colombo', 'Western', '100 Galle Rd', '0112345678')
ON DUPLICATE KEY UPDATE name=VALUES(name);

INSERT INTO employee (employee_id, branch_id, full_name, role, username, password_hash, is_active)
VALUES (999, 1, 'Audit Test Employee', 'CASHIER', 'test_audit_user', '$2a$10$dummyHash', TRUE)
ON DUPLICATE KEY UPDATE role='CASHIER', is_active=TRUE;

-- Execute role change
CALL sp_change_user_role(999, 'MANAGER');

-- Verify employee table updated
SELECT 
  'TEST 5A: sp_change_user_role updated employee' AS test_name,
  employee_id, role,
  IF(role = 'MANAGER', 'PASSED', 'FAILED') AS status
FROM employee WHERE employee_id = 999;

-- Verify trg_employee_audit fired and recorded change
SELECT 
  'TEST 5B: trg_employee_audit fired into employee_audit_log' AS test_name,
  log_id, employee_id, old_role, new_role, changed_by,
  IF(old_role = 'CASHIER' AND new_role = 'MANAGER', 'PASSED', 'FAILED') AS trigger_result
FROM employee_audit_log 
WHERE employee_id = 999 
ORDER BY log_id DESC 
LIMIT 1;

-- ----------------------------------------------------------------------------
-- TEST 6: Safe Deactivation Procedure (sp_deactivate_employee)
-- ----------------------------------------------------------------------------
-- Deactivate target employee (admin 100 deactivates employee 999)
CALL sp_deactivate_employee(100, 999);

SELECT 
  'TEST 6: sp_deactivate_employee marked inactive' AS test_name,
  employee_id, is_active,
  IF(is_active = FALSE, 'PASSED', 'FAILED') AS deactivation_status
FROM employee WHERE employee_id = 999;

-- ----------------------------------------------------------------------------
-- TEST 7: Self-Lockout Exception Guard
-- ----------------------------------------------------------------------------
SELECT 'TEST 7: sp_deactivate_employee Self-Lockout Guard' AS test_name;
SELECT 'Attempting: CALL sp_deactivate_employee(100, 100) -> Expected SQLSTATE 45000: Security Violation' AS expected_behavior;
-- Uncommenting the next line in MySQL Workbench verifies the exception:
-- CALL sp_deactivate_employee(100, 100);

-- Clean up test employee
DELETE FROM employee WHERE employee_id = 999;
DELETE FROM employee_audit_log WHERE employee_id = 999;

SELECT '=========================================' AS test_footer;
SELECT 'ALL MEMBER 5 DATABASE TESTS EXECUTED' AS test_footer;
SELECT '=========================================' AS test_footer;
