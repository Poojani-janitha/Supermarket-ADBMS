-- ============================================================================
-- SUPERMARKET CHAIN MANAGEMENT SYSTEM
-- Script: create_admin_user.sql
-- Purpose: Create/Update 'admin' Employee & MySQL User with full DB permissions
-- Username: admin
-- Password: admin123
-- ============================================================================

USE supermarket_db;

-- ----------------------------------------------------------------------------
-- 1. APPLICATION-LEVEL ADMIN EMPLOYEE (For Web App / Spring Boot Login)
-- Role: ADMIN | Access: All Angular UI modules & API endpoints
-- BCrypt Hash below is generated for 'admin123'
-- ----------------------------------------------------------------------------
INSERT INTO employee (employee_id, branch_id, full_name, role, username, password_hash, hire_date, is_active)
VALUES (
    1, 
    1, 
    'System Administrator', 
    'ADMIN', 
    'admin', 
    '$2a$10$muUacFIJ6Wek5bWJP5NhAu464.NToq3FpK721zqfEQ07Gl9.KJBdm', 
    CURRENT_DATE, 
    TRUE
)
ON DUPLICATE KEY UPDATE 
    role = 'ADMIN',
    password_hash = '$2a$10$muUacFIJ6Wek5bWJP5NhAu464.NToq3FpK721zqfEQ07Gl9.KJBdm',
    is_active = TRUE;

-- ----------------------------------------------------------------------------
-- 2. MYSQL DATABASE ENGINE USERS & PRIVILEGES (For Direct DB Access)
-- Creates 'admin' user with full Read, Edit, and Execute permissions on all DB objects
-- ----------------------------------------------------------------------------
-- Create or ensure role exists
CREATE ROLE IF NOT EXISTS 'admin_role';
GRANT ALL PRIVILEGES ON supermarket_db.* TO 'admin_role' WITH GRANT OPTION;

-- Create MySQL user for both localhost and remote/wildcard connections
CREATE USER IF NOT EXISTS 'admin'@'localhost' IDENTIFIED BY 'admin123';
CREATE USER IF NOT EXISTS 'admin'@'%' IDENTIFIED BY 'admin123';

-- Update password in case user already exists
ALTER USER 'admin'@'localhost' IDENTIFIED BY 'admin123';
ALTER USER 'admin'@'%' IDENTIFIED BY 'admin123';

-- Assign admin_role and grant full privileges (SELECT, INSERT, UPDATE, DELETE, EXECUTE, DDL)
GRANT 'admin_role' TO 'admin'@'localhost', 'admin'@'%';
SET DEFAULT ROLE 'admin_role' TO 'admin'@'localhost', 'admin'@'%';

GRANT ALL PRIVILEGES ON supermarket_db.* TO 'admin'@'localhost' WITH GRANT OPTION;
GRANT ALL PRIVILEGES ON supermarket_db.* TO 'admin'@'%' WITH GRANT OPTION;

-- Reload privilege tables
FLUSH PRIVILEGES;

-- ----------------------------------------------------------------------------
-- 3. VERIFICATION QUERY
-- ----------------------------------------------------------------------------
SELECT employee_id, branch_id, full_name, role, username, is_active 
FROM employee 
WHERE username = 'admin';

SHOW GRANTS FOR 'admin'@'localhost';
