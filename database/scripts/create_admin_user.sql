-- ============================================================================
-- SUPERMARKET CHAIN MANAGEMENT SYSTEM
-- Script: create_admin_user.sql
-- Purpose: Create/Update 'admin' Employee & MySQL User with full DB permissions
-- Schema: Compatible with MySQL 8.0+ / RBAC (roles table + employee.role_id)
-- Database: supermarket_db2
-- Credentials:
--   Username: admin
--   Password: admin123
-- ============================================================================

USE supermarket_db2;

-- ----------------------------------------------------------------------------
-- 1. PREREQUISITE REFERENCE DATA (Branch & Roles)
-- Ensure at least one active branch and the RBAC roles exist so FK constraints succeed.
-- ----------------------------------------------------------------------------
INSERT INTO branch (branch_id, name, city, province, address, phone, is_active)
VALUES (1, 'Colombo Central Flagship', 'Colombo', 'Western', '100 Galle Road, Colombo 03', '0112345678', 1)
ON DUPLICATE KEY UPDATE name = VALUES(name);

INSERT INTO roles (role_id, role_name, description) VALUES
(1, 'ADMIN', 'Full system and database administrative access'),
(2, 'MANAGER', 'Branch management, inventory, reports, and staff supervision'),
(3, 'CASHIER', 'POS billing, customer checkout, and sales transactions'),
(4, 'DB_MANAGER', 'Database schema, backups, indexes, and performance management'),
(5, 'HR', 'Human resources, staff records, and organizational administration')
ON DUPLICATE KEY UPDATE description = VALUES(description);

-- ----------------------------------------------------------------------------
-- 2. APPLICATION-LEVEL ADMIN EMPLOYEE (For Web App / Spring Boot Login)
-- Role: ADMIN (references roles.role_id) | Access: All Angular UI modules & API endpoints
-- BCrypt Hash below is generated for 'admin123'
-- ----------------------------------------------------------------------------
SET @admin_role_id = (SELECT role_id FROM roles WHERE role_name = 'ADMIN' LIMIT 1);

INSERT INTO employee (employee_id, branch_id, role_id, full_name, username, password_hash, hire_date, is_active)
VALUES (
    1, 
    1, 
    @admin_role_id, 
    'System Administrator', 
    'admin', 
    '$2a$10$muUacFIJ6Wek5bWJP5NhAu464.NToq3FpK721zqfEQ07Gl9.KJBdm', 
    CURRENT_DATE, 
    1
)
ON DUPLICATE KEY UPDATE 
    branch_id = 1,
    role_id = @admin_role_id,
    password_hash = '$2a$10$muUacFIJ6Wek5bWJP5NhAu464.NToq3FpK721zqfEQ07Gl9.KJBdm',
    is_active = 1;

-- ----------------------------------------------------------------------------
-- 3. MYSQL DATABASE ENGINE USERS & PRIVILEGES (For Direct DB Access)
-- Creates 'admin' user with full Read, Edit, and Execute permissions on all DB objects
-- ----------------------------------------------------------------------------
-- Create or ensure role exists
CREATE ROLE IF NOT EXISTS 'admin_role';
GRANT ALL PRIVILEGES ON supermarket_db2.* TO 'admin_role' WITH GRANT OPTION;
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

GRANT ALL PRIVILEGES ON supermarket_db2.* TO 'admin'@'localhost' WITH GRANT OPTION;
GRANT ALL PRIVILEGES ON supermarket_db2.* TO 'admin'@'%' WITH GRANT OPTION;
GRANT ALL PRIVILEGES ON supermarket_db.* TO 'admin'@'localhost' WITH GRANT OPTION;
GRANT ALL PRIVILEGES ON supermarket_db.* TO 'admin'@'%' WITH GRANT OPTION;

-- Reload privilege tables
FLUSH PRIVILEGES;

-- ----------------------------------------------------------------------------
-- 4. VERIFICATION QUERIES
-- ----------------------------------------------------------------------------
SELECT 
    e.employee_id, 
    e.branch_id, 
    b.name AS branch_name, 
    e.full_name, 
    r.role_name AS role, 
    e.username, 
    e.is_active 
FROM employee e
JOIN roles r ON e.role_id = r.role_id
LEFT JOIN branch b ON e.branch_id = b.branch_id
WHERE e.username = 'admin';

SHOW GRANTS FOR 'admin'@'localhost';

