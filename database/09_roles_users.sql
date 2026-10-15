-- ============================================================================
-- SUPERMARKET CHAIN MANAGEMENT SYSTEM
-- ICT3222 Advanced Database Management Systems (ADBMS)
-- Script: 09_roles_users.sql
-- Primary Owner: Member 5 (Security, RBAC, Data Masking & Administration)
-- ============================================================================

USE supermarket_db;

-- ----------------------------------------------------------------------------
-- 1. MySQL 8 ROLES CREATION & HIERARCHY
-- Implements Role-Based Access Control (RBAC) with role inheritance.
-- ----------------------------------------------------------------------------
CREATE ROLE IF NOT EXISTS 'cashier_role', 'manager_role', 'admin_role';

-- ----------------------------------------------------------------------------
-- Stubs for procedures and views owned by other team members
-- Ensures GRANT statements execute cleanly before other members run their scripts.
-- ----------------------------------------------------------------------------
DELIMITER $$
CREATE PROCEDURE IF NOT EXISTS supermarket_db.sp_place_order(IN p_dummy JSON) BEGIN END$$
CREATE PROCEDURE IF NOT EXISTS supermarket_db.sp_register_customer(IN p_dummy VARCHAR(50)) BEGIN END$$
CREATE PROCEDURE IF NOT EXISTS supermarket_db.sp_add_stock(IN p_dummy INT) BEGIN END$$
CREATE PROCEDURE IF NOT EXISTS supermarket_db.sp_transfer_stock(IN p_dummy INT) BEGIN END$$
CREATE PROCEDURE IF NOT EXISTS supermarket_db.sp_receive_purchase(IN p_dummy INT) BEGIN END$$
DELIMITER ;

CREATE TABLE IF NOT EXISTS supermarket_db.product (product_id INT PRIMARY KEY) ENGINE=InnoDB;
CREATE OR REPLACE VIEW supermarket_db.v_active_discounts AS SELECT 1 AS rule_id;
CREATE OR REPLACE VIEW supermarket_db.v_low_stock AS SELECT 1 AS branch_id;
CREATE OR REPLACE VIEW supermarket_db.v_daily_sales AS SELECT 1 AS branch_id;
CREATE OR REPLACE VIEW supermarket_db.v_discount_impact AS SELECT 1 AS rule_id;
CREATE OR REPLACE VIEW supermarket_db.v_product_ranking AS SELECT 1 AS product_id;

-- Cashier Grants (Least Privilege: Procedures & Views only, no table DML/DDL)
GRANT EXECUTE ON PROCEDURE supermarket_db.sp_place_order TO 'cashier_role';
GRANT EXECUTE ON PROCEDURE supermarket_db.sp_register_customer TO 'cashier_role';
GRANT EXECUTE ON PROCEDURE supermarket_db.sp_get_login TO 'cashier_role';
GRANT SELECT ON supermarket_db.v_masked_customer_directory TO 'cashier_role';
GRANT SELECT ON supermarket_db.v_active_discounts TO 'cashier_role';

-- Manager Grants (Inherits all Cashier permissions + Inventory & Reporting)
GRANT 'cashier_role' TO 'manager_role';
GRANT EXECUTE ON PROCEDURE supermarket_db.sp_add_stock TO 'manager_role';
GRANT EXECUTE ON PROCEDURE supermarket_db.sp_transfer_stock TO 'manager_role';
GRANT EXECUTE ON PROCEDURE supermarket_db.sp_receive_purchase TO 'manager_role';
GRANT SELECT ON supermarket_db.v_low_stock TO 'manager_role';
GRANT SELECT ON supermarket_db.v_daily_sales TO 'manager_role';
GRANT SELECT ON supermarket_db.v_discount_impact TO 'manager_role';

-- Admin Grants (Full Database Administration)
GRANT ALL ON supermarket_db.* TO 'admin_role';

-- ----------------------------------------------------------------------------
-- 2. DEDICATED LEAST-PRIVILEGE APPLICATION & SERVICE ACCOUNTS
-- Application connections never connect as root.
-- ----------------------------------------------------------------------------
CREATE USER IF NOT EXISTS 'app_user'@'%'           IDENTIFIED BY 'App_Secret_Pass!2026';
CREATE USER IF NOT EXISTS 'report_user'@'%'        IDENTIFIED BY 'Report_Secret_Pass!2026';
CREATE USER IF NOT EXISTS 'etl_user'@'%'           IDENTIFIED BY 'Etl_Secret_Pass!2026';
CREATE USER IF NOT EXISTS 'admin_user'@'localhost' IDENTIFIED BY 'Admin_Secret_Pass!2026';

-- Demo accounts for Examiner Viva Presentation
CREATE USER IF NOT EXISTS 'demo_cashier'@'%'       IDENTIFIED BY 'CashierDemo2026!';
CREATE USER IF NOT EXISTS 'demo_manager'@'%'       IDENTIFIED BY 'ManagerDemo2026!';

GRANT 'cashier_role' TO 'demo_cashier'@'%';
SET DEFAULT ROLE 'cashier_role' TO 'demo_cashier'@'%';

GRANT 'manager_role' TO 'demo_manager'@'%';
SET DEFAULT ROLE 'manager_role' TO 'demo_manager'@'%';

-- Application user privileges (Executes procedures and queries views/lookups)
GRANT EXECUTE ON supermarket_db.* TO 'app_user'@'%';
GRANT SELECT ON supermarket_db.v_daily_sales TO 'app_user'@'%', 'report_user'@'%';
GRANT SELECT ON supermarket_db.v_low_stock   TO 'app_user'@'%', 'report_user'@'%';
GRANT SELECT ON supermarket_db.v_product_ranking TO 'app_user'@'%', 'report_user'@'%';
GRANT SELECT ON supermarket_db.v_masked_customer_directory TO 'app_user'@'%';
GRANT SELECT ON supermarket_db.v_security_audit_log TO 'app_user'@'%';
GRANT SELECT ON supermarket_db.v_employee_audit_history TO 'app_user'@'%';
GRANT SELECT, INSERT, UPDATE ON supermarket_db.employee TO 'app_user'@'%';
GRANT SELECT ON supermarket_db.branch TO 'app_user'@'%';
GRANT SELECT, INSERT ON supermarket_db.security_event_log TO 'app_user'@'%';
GRANT SELECT, INSERT ON supermarket_db.employee_audit_log TO 'app_user'@'%';

FLUSH PRIVILEGES;
