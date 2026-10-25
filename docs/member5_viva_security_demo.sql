-- ============================================================================
-- SUPERMARKET CHAIN MANAGEMENT SYSTEM (ICT3222 ADBMS)
-- MEMBER 5 VIVA DEMONSTRATION SCRIPT (3 Minutes)
-- Primary Author: Member 5 (Kavindu Perera - Admin & Security Specialist)
-- Topic: MySQL 8 RBAC Enforcement, Dynamic Data Masking, Self-Lockout Guard & Trigger Audit Log
-- ============================================================================

USE supermarket_db;

-- ----------------------------------------------------------------------------
-- STEP 0: PRE-VIVA ENVIRONMENT VERIFICATION (Run once before the examiner watches)
-- ----------------------------------------------------------------------------
-- Ensure roles, users, and procedures are active
SELECT '===================================================' AS viva_banner;
SELECT 'SUPERMARKET ADBMS - MEMBER 5 VIVA LIVE DEMO' AS viva_banner;
SELECT '===================================================' AS viva_banner;

-- Verify root admin account exists
SELECT employee_id, full_name, role, username, is_active 
FROM employee 
WHERE employee_id = 100;


-- ============================================================================
-- PART 1: LEAST PRIVILEGE & RBAC ENFORCEMENT (1 Minute)
-- Examiner Question: "How do you prove that unauthorized users cannot alter or drop tables?"
-- ============================================================================

/*
-------------------------------------------------------------------------------
ACTION 1A: Connect as 'demo_cashier' (Simulating Cashier Terminal Session)
Command in Terminal:
mysql -u demo_cashier -pCashierDemo2026! supermarket_db
-------------------------------------------------------------------------------
*/

-- 1. Attempt authorized operation: Reading the customer directory for checkout
-- Expected: SUCCESSFUL execution through the authorized view
SELECT customer_id, full_name, masked_phone, loyalty_points 
FROM v_masked_customer_directory 
LIMIT 3;

-- 2. Attempt unauthorized operation: Malicious cashier attempts to delete a product or tamper with prices
-- Run this query as 'demo_cashier':
-- DELETE FROM product WHERE product_id = 1;

-- EXAMINER OBSERVATION POINT #1:
-- Point directly to the MySQL error response:
-- "ERROR 1142 (42000): DELETE command denied to user 'demo_cashier'@'localhost' for table 'product'"
-- EXPLANATION FOR EXAMINER:
-- "We enforce MySQL 8 Principle of Least Privilege. Cashiers only possess cashier_role,
-- which grants EXECUTE on checkout procedures and SELECT on masked views. Direct DML
-- (INSERT, UPDATE, DELETE) and DDL on base tables are completely revoked at the database engine tier."


-- ============================================================================
-- PART 2: DYNAMIC DATA MASKING (PII COMPLIANCE) (45 Seconds)
-- Examiner Question: "How does the system prevent cashiers from harvesting customer phone numbers?"
-- ============================================================================

-- SESSION A (Cashier Perspective via View):
-- The cashier searches for customer Jacob Jones:
SELECT customer_id, full_name, masked_phone, loyalty_points 
FROM v_masked_customer_directory 
WHERE customer_id = 1;

-- Output:
-- customer_id: 1 | full_name: Jacob Jones | masked_phone: 077****567 | loyalty_points: 420

-- SESSION B (System Administrator Perspective via Base Table):
-- The administrator inspects customer record with authorized privileges:
SELECT customer_id, full_name, phone, email 
FROM customer 
WHERE customer_id = 1;

-- Output:
-- customer_id: 1 | full_name: Jacob Jones | phone: 0771234567 | email: jacob@example.com

-- EXAMINER OBSERVATION POINT #2:
-- Point out the difference:
-- "The base table stores raw PII '0771234567'. Cashiers only have access to v_masked_customer_directory,
-- which calls our DETERMINISTIC UDF fn_mask_phone(). The phone is masked as '077****567',
-- fulfilling GDPR and Sri Lanka PDPA compliance directly at the database engine level."


-- ============================================================================
-- PART 3: PROGRAMMATIC SELF-LOCKOUT EXCEPTION GUARD (45 Seconds)
-- Examiner Question: "What stops an admin from accidentally deactivating their own account?"
-- ============================================================================

-- Attempt 3A: Admin 100 tries to deactivate Admin 100 (Self-Deactivation)
-- Run the call below:
-- CALL sp_deactivate_employee(100, 100);

-- EXAMINER OBSERVATION POINT #3:
-- The procedure instantly aborts and raises:
-- "Error Code: 1644. Security Violation: Administrator cannot deactivate own account (SQLSTATE 45000)"
-- EXPLANATION FOR EXAMINER:
-- "Our stored procedure sp_deactivate_employee incorporates a defensive self-lockout check:
-- IF p_admin_id = p_target_emp_id THEN SIGNAL SQLSTATE '45000'.
-- This guarantees that the system can never enter a headless state without an administrator."


-- Attempt 3B: Admin 100 deactivates a regular employee (Employee 103: Kamal Gunaratne)
CALL sp_deactivate_employee(100, 103);

-- Verify status changed to inactive (soft delete)
SELECT employee_id, full_name, role, is_active 
FROM employee 
WHERE employee_id = 103;


-- ============================================================================
-- PART 4: AUTOMATED AUDIT TRAIL TRIGGER & ROLLUP (30 Seconds)
-- Examiner Question: "How do you ensure audit logs cannot be bypassed by direct SQL updates?"
-- ============================================================================

-- Step 4A: Change employee 101's role from CASHIER to MANAGER
CALL sp_change_user_role(101, 'MANAGER');

-- Step 4B: Query the immutable employee audit log populated automatically by trg_employee_audit
SELECT 
  log_id,
  employee_id,
  old_role,
  new_role,
  is_active_changed,
  changed_by,
  changed_at
FROM employee_audit_log 
WHERE employee_id = 101 
ORDER BY log_id DESC 
LIMIT 1;

-- EXAMINER OBSERVATION POINT #4:
-- "Notice that the change was captured automatically by database engine trigger trg_employee_audit.
-- Even if an update is executed from the terminal without going through the web backend,
-- the trigger writes an unforgeable record into employee_audit_log capturing USER() and NOW()."

-- Step 4C: Inspect the Security Event Log
SELECT log_id, event_type, details, performed_by, logged_at 
FROM security_event_log 
ORDER BY log_id DESC 
LIMIT 2;


-- ----------------------------------------------------------------------------
-- STEP 5: CLEANUP & RESTORATION (Leave DB in clean state after Viva)
-- ----------------------------------------------------------------------------
-- Reactivate employee 103
UPDATE employee SET is_active = TRUE WHERE employee_id = 103;

-- Reset employee 101 to CASHIER
UPDATE employee SET role = 'CASHIER' WHERE employee_id = 101;

SELECT '===================================================' AS viva_summary;
SELECT 'MEMBER 5 VIVA DEMONSTRATION SUCCESSFULLY CONCLUDED' AS viva_summary;
SELECT '===================================================' AS viva_summary;
