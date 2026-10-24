-- ==============================================================================
-- SUPERMARKET CHAIN MANAGEMENT SYSTEM (ICT3222 ADBMS)
-- MASTER DATABASE INITIALIZATION & DEPLOYMENT SCRIPT
-- ==============================================================================
-- Consolidated deployment containing:
--   1. Full Database Schema (All 29 Tables, Constraints, Partitions, FKs)
--   2. User-Defined Functions (11 UDFs)
--   3. Analytical & Security Views (13 Views)
--   4. Stored Procedures (19 ACID Procedures)
--   5. Database Triggers (10 Triggers)
--   6. Scheduled Events (6 Events)
--   7. Role-Based Access Control (RBAC Roles & Grants)
--
-- Target Database : supermarket_db2 (MySQL 8.0+ InnoDB)
-- Character Set   : utf8mb4 / utf8mb4_unicode_ci
-- ==============================================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;
SET SQL_MODE = 'NO_AUTO_VALUE_ON_ZERO';

CREATE DATABASE IF NOT EXISTS supermarket_db2
  DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE supermarket_db2;

-- Enable MySQL Event Scheduler for automated background tasks
SET GLOBAL event_scheduler = ON;

-- ==============================================================================
-- SECTION 1: DATABASE TABLES & DDL
-- ==============================================================================

-- 1.1 Branch Table
CREATE TABLE IF NOT EXISTS `branch` (
  `branch_id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `city` varchar(50) NOT NULL,
  `province` varchar(50) NOT NULL,
  `address` varchar(255) NOT NULL,
  `phone` varchar(20) NOT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`branch_id`),
  UNIQUE KEY `phone` (`phone`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 1.2 Category Table (Hierarchical category tree with parent_id FK)
CREATE TABLE IF NOT EXISTS `category` (
  `category_id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(80) NOT NULL,
  `description` varchar(255) DEFAULT NULL,
  `icon` varchar(50) DEFAULT 'category',
  `parent_id` int DEFAULT NULL,
  PRIMARY KEY (`category_id`),
  UNIQUE KEY `name` (`name`),
  KEY `parent_id` (`parent_id`),
  CONSTRAINT `category_ibfk_1` FOREIGN KEY (`parent_id`) REFERENCES `category` (`category_id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 1.3 Supplier Table
CREATE TABLE IF NOT EXISTS `supplier` (
  `supplier_id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(120) NOT NULL,
  `contact_person` varchar(100) DEFAULT NULL,
  `phone` varchar(20) NOT NULL,
  `email` varchar(100) DEFAULT NULL,
  `username` varchar(50) DEFAULT NULL,
  `password_hash` varchar(255) DEFAULT NULL,
  `city` varchar(50) NOT NULL,
  `tax_number` varchar(50) DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `status` enum('PENDING_APPROVAL','ACTIVE','SUSPENDED') NOT NULL DEFAULT 'ACTIVE',
  PRIMARY KEY (`supplier_id`),
  UNIQUE KEY `username` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 1.4 Unit of Measure Table
CREATE TABLE IF NOT EXISTS `unit_of_measure` (
  `unit_id` int NOT NULL AUTO_INCREMENT,
  `code` varchar(30) NOT NULL,
  `display_name` varchar(80) NOT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`unit_id`),
  UNIQUE KEY `code` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 1.5 Product Table
CREATE TABLE IF NOT EXISTS `product` (
  `product_id` int NOT NULL AUTO_INCREMENT,
  `category_id` int NOT NULL,
  `supplier_id` int DEFAULT NULL,
  `sku` varchar(30) NOT NULL,
  `name` varchar(150) NOT NULL,
  `unit_price` decimal(10,2) NOT NULL,
  `cost_price` decimal(10,2) NOT NULL,
  `image_url` varchar(255) DEFAULT NULL,
  `diet_type` enum('VEG','NON_VEG') DEFAULT 'VEG',
  `unit_of_measure` varchar(30) NOT NULL DEFAULT 'PIECE',
  `min_order_qty` decimal(10,2) NOT NULL DEFAULT '1.00',
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`product_id`),
  UNIQUE KEY `sku` (`sku`),
  KEY `category_id` (`category_id`),
  KEY `supplier_id` (`supplier_id`),
  KEY `idx_product_name` (`name`),
  FULLTEXT KEY `idx_product_ft` (`name`),
  CONSTRAINT `product_ibfk_1` FOREIGN KEY (`category_id`) REFERENCES `category` (`category_id`),
  CONSTRAINT `product_ibfk_2` FOREIGN KEY (`supplier_id`) REFERENCES `supplier` (`supplier_id`),
  CONSTRAINT `product_chk_1` CHECK ((`unit_price` >= 0)),
  CONSTRAINT `product_chk_2` CHECK ((`cost_price` >= 0)),
  CONSTRAINT `product_chk_3` CHECK ((`min_order_qty` > 0))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 1.6 Price Audit Log Table
CREATE TABLE IF NOT EXISTS `price_audit_log` (
  `log_id` int NOT NULL AUTO_INCREMENT,
  `product_id` int NOT NULL,
  `old_price` decimal(10,2) NOT NULL,
  `new_price` decimal(10,2) NOT NULL,
  `changed_by` varchar(100) NOT NULL,
  `changed_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`log_id`),
  KEY `product_id` (`product_id`),
  CONSTRAINT `price_audit_log_ibfk_1` FOREIGN KEY (`product_id`) REFERENCES `product` (`product_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 1.7 Discount Rule Table
CREATE TABLE IF NOT EXISTS `discount_rule` (
  `rule_id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `rule_type` enum('FIRST_PURCHASE','HOLIDAY','LOYALTY','COUPON') NOT NULL,
  `kind` enum('PERCENT','FIXED') NOT NULL,
  `value` decimal(10,2) NOT NULL,
  `min_order_amount` decimal(12,2) NOT NULL DEFAULT '0.00',
  `max_discount` decimal(12,2) DEFAULT NULL,
  `tier` varchar(10) DEFAULT NULL,
  `start_date` date NOT NULL,
  `end_date` date NOT NULL,
  `priority` int NOT NULL DEFAULT '100',
  `stackable` tinyint(1) NOT NULL DEFAULT '1',
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`rule_id`),
  KEY `idx_discount_rule_active_dates` (`is_active`,`start_date`,`end_date`,`priority`),
  CONSTRAINT `discount_rule_chk_1` CHECK ((`value` > 0)),
  CONSTRAINT `discount_rule_chk_2` CHECK ((`min_order_amount` >= 0)),
  CONSTRAINT `discount_rule_chk_3` CHECK (((`max_discount` is null) or (`max_discount` > 0))),
  CONSTRAINT `discount_rule_chk_4` CHECK ((`end_date` >= `start_date`))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 1.8 Discount Rule Audit Table
CREATE TABLE IF NOT EXISTS `discount_rule_audit` (
  `log_id` int NOT NULL AUTO_INCREMENT,
  `rule_id` int NOT NULL,
  `old_value` decimal(10,2) DEFAULT NULL,
  `new_value` decimal(10,2) DEFAULT NULL,
  `changed_by` varchar(100) NOT NULL,
  `changed_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`log_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 1.9 Coupon Table
CREATE TABLE IF NOT EXISTS `coupon` (
  `code` varchar(20) NOT NULL,
  `rule_id` int NOT NULL,
  `max_uses` int NOT NULL DEFAULT '1',
  `used_count` int NOT NULL DEFAULT '0',
  `expires_on` date NOT NULL,
  PRIMARY KEY (`code`),
  KEY `idx_coupon_rule_expiry` (`rule_id`,`expires_on`,`used_count`),
  CONSTRAINT `coupon_ibfk_1` FOREIGN KEY (`rule_id`) REFERENCES `discount_rule` (`rule_id`),
  CONSTRAINT `coupon_chk_1` CHECK ((`max_uses` > 0)),
  CONSTRAINT `coupon_chk_2` CHECK ((`used_count` >= 0))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 1.10 Holiday Calendar Table
CREATE TABLE IF NOT EXISTS `holiday` (
  `holiday_date` date NOT NULL,
  `name` varchar(100) NOT NULL,
  PRIMARY KEY (`holiday_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 1.11 Customer Table
CREATE TABLE IF NOT EXISTS `customer` (
  `customer_id` int NOT NULL AUTO_INCREMENT,
  `full_name` varchar(120) NOT NULL,
  `phone` varchar(20) NOT NULL,
  `email` varchar(100) DEFAULT NULL,
  `loyalty_points` int NOT NULL DEFAULT '0',
  `registered_date` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`customer_id`),
  UNIQUE KEY `phone` (`phone`),
  KEY `idx_customer_name` (`full_name`),
  KEY `idx_customer_registered_date` (`registered_date`),
  CONSTRAINT `customer_chk_1` CHECK ((`loyalty_points` >= 0))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 1.12 RBAC Roles Table
CREATE TABLE IF NOT EXISTS `roles` (
  `role_id` int NOT NULL AUTO_INCREMENT,
  `role_name` varchar(50) NOT NULL,
  `description` varchar(255) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`role_id`),
  UNIQUE KEY `role_name` (`role_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO `roles` (`role_id`, `role_name`, `description`) VALUES
  (1, 'ADMIN', 'Full system and database administrative access'),
  (2, 'MANAGER', 'Branch management, inventory, reports, and staff supervision'),
  (3, 'CASHIER', 'POS billing, customer checkout, and sales transactions'),
  (4, 'DB_MANAGER', 'Database schema, backups, indexes, and performance management'),
  (5, 'HR', 'Human resources, staff records, and organizational administration');

-- 1.13 RBAC Role Privilege Rule Table
CREATE TABLE IF NOT EXISTS `role_privilege_rule` (
  `id` int NOT NULL AUTO_INCREMENT,
  `role_name` varchar(50) NOT NULL,
  `object_name` varchar(100) NOT NULL,
  `object_type` varchar(30) NOT NULL,
  `privileges` varchar(255) NOT NULL,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_role_obj` (`role_name`,`object_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 1.14 Employee Table (role_id FK referencing roles table)
CREATE TABLE IF NOT EXISTS `employee` (
  `employee_id` int NOT NULL AUTO_INCREMENT,
  `branch_id` int NOT NULL,
  `role_id` int NOT NULL,
  `full_name` varchar(120) NOT NULL,
  `username` varchar(50) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `hire_date` date NOT NULL DEFAULT (curdate()),
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`employee_id`),
  UNIQUE KEY `username` (`username`),
  KEY `branch_id` (`branch_id`),
  KEY `fk_employee_role` (`role_id`),
  CONSTRAINT `employee_ibfk_1` FOREIGN KEY (`branch_id`) REFERENCES `branch` (`branch_id`),
  CONSTRAINT `fk_employee_role` FOREIGN KEY (`role_id`) REFERENCES `roles` (`role_id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 1.15 Employee Audit Log Table
CREATE TABLE IF NOT EXISTS `employee_audit_log` (
  `log_id` int NOT NULL AUTO_INCREMENT,
  `employee_id` int NOT NULL,
  `old_role` varchar(20) DEFAULT NULL,
  `new_role` varchar(20) DEFAULT NULL,
  `old_branch_id` int DEFAULT NULL,
  `new_branch_id` int DEFAULT NULL,
  `is_active_changed` tinyint(1) NOT NULL DEFAULT '0',
  `changed_by` varchar(100) NOT NULL,
  `changed_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`log_id`),
  KEY `idx_emp_audit_emp_id` (`employee_id`),
  KEY `idx_emp_audit_changed_at` (`changed_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 1.16 Security Event Log Table
CREATE TABLE IF NOT EXISTS `security_event_log` (
  `log_id` int NOT NULL AUTO_INCREMENT,
  `event_type` varchar(50) NOT NULL,
  `details` text,
  `performed_by` varchar(100) NOT NULL,
  `logged_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`log_id`),
  KEY `idx_sec_event_type` (`event_type`),
  KEY `idx_sec_logged_at` (`logged_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 1.17 Sales Order Table
CREATE TABLE IF NOT EXISTS `sales_order` (
  `order_id` int NOT NULL AUTO_INCREMENT,
  `branch_id` int NOT NULL,
  `customer_id` int DEFAULT NULL,
  `employee_id` int NOT NULL,
  `order_date` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `status` enum('COMPLETED','CANCELLED') NOT NULL DEFAULT 'COMPLETED',
  `subtotal` decimal(12,2) NOT NULL DEFAULT '0.00',
  `discount_total` decimal(12,2) NOT NULL DEFAULT '0.00',
  `total_amount` decimal(12,2) NOT NULL DEFAULT '0.00',
  PRIMARY KEY (`order_id`),
  KEY `employee_id` (`employee_id`),
  KEY `idx_order_date` (`order_date`),
  KEY `idx_order_branch_date` (`branch_id`,`order_date`),
  KEY `idx_order_customer` (`customer_id`),
  CONSTRAINT `sales_order_ibfk_1` FOREIGN KEY (`branch_id`) REFERENCES `branch` (`branch_id`),
  CONSTRAINT `sales_order_ibfk_2` FOREIGN KEY (`customer_id`) REFERENCES `customer` (`customer_id`),
  CONSTRAINT `sales_order_ibfk_3` FOREIGN KEY (`employee_id`) REFERENCES `employee` (`employee_id`),
  CONSTRAINT `sales_order_chk_1` CHECK ((`subtotal` >= 0)),
  CONSTRAINT `sales_order_chk_2` CHECK ((`discount_total` >= 0)),
  CONSTRAINT `sales_order_chk_3` CHECK ((`total_amount` >= 0))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 1.18 Order Item Table
CREATE TABLE IF NOT EXISTS `order_item` (
  `order_id` int NOT NULL,
  `product_id` int NOT NULL,
  `quantity` int NOT NULL,
  `unit_price` decimal(10,2) NOT NULL,
  `line_total` decimal(12,2) GENERATED ALWAYS AS ((`quantity` * `unit_price`)) STORED,
  PRIMARY KEY (`order_id`,`product_id`),
  KEY `idx_order_item_prod` (`product_id`),
  CONSTRAINT `order_item_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `sales_order` (`order_id`) ON DELETE CASCADE,
  CONSTRAINT `order_item_ibfk_2` FOREIGN KEY (`product_id`) REFERENCES `product` (`product_id`),
  CONSTRAINT `order_item_chk_1` CHECK ((`quantity` > 0)),
  CONSTRAINT `order_item_chk_2` CHECK ((`unit_price` >= 0))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 1.19 Order Discount Table
CREATE TABLE IF NOT EXISTS `order_discount` (
  `order_id` int NOT NULL,
  `rule_id` int NOT NULL,
  `amount` decimal(12,2) NOT NULL,
  PRIMARY KEY (`order_id`,`rule_id`),
  KEY `rule_id` (`rule_id`),
  CONSTRAINT `order_discount_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `sales_order` (`order_id`) ON DELETE CASCADE,
  CONSTRAINT `order_discount_ibfk_2` FOREIGN KEY (`rule_id`) REFERENCES `discount_rule` (`rule_id`),
  CONSTRAINT `order_discount_chk_1` CHECK ((`amount` > 0))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 1.20 Payment Table
CREATE TABLE IF NOT EXISTS `payment` (
  `payment_id` int NOT NULL AUTO_INCREMENT,
  `order_id` int NOT NULL,
  `method` enum('CASH','CARD','QR','ONLINE') NOT NULL,
  `amount` decimal(12,2) NOT NULL,
  `paid_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`payment_id`),
  KEY `order_id` (`order_id`),
  CONSTRAINT `payment_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `sales_order` (`order_id`) ON DELETE CASCADE,
  CONSTRAINT `payment_chk_1` CHECK ((`amount` >= 0))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 1.21 Daily Sales Summary Table
CREATE TABLE IF NOT EXISTS `daily_sales_summary` (
  `summary_date` date NOT NULL,
  `branch_id` int NOT NULL,
  `total_orders` int NOT NULL DEFAULT '0',
  `total_sales` decimal(14,2) NOT NULL DEFAULT '0.00',
  PRIMARY KEY (`summary_date`,`branch_id`),
  KEY `branch_id` (`branch_id`),
  CONSTRAINT `daily_sales_summary_ibfk_1` FOREIGN KEY (`branch_id`) REFERENCES `branch` (`branch_id`),
  CONSTRAINT `daily_sales_summary_chk_1` CHECK ((`total_orders` >= 0)),
  CONSTRAINT `daily_sales_summary_chk_2` CHECK ((`total_sales` >= 0))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 1.22 Daily Sales Log Table
CREATE TABLE IF NOT EXISTS `daily_sales_log` (
  `log_id` int NOT NULL AUTO_INCREMENT,
  `summary_date` date NOT NULL,
  `branch_id` int NOT NULL,
  `total_orders` int NOT NULL,
  `total_sales` decimal(14,2) NOT NULL,
  `logged_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`log_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 1.23 Inventory Table (Optimistic locking via version column)
CREATE TABLE IF NOT EXISTS `inventory` (
  `branch_id` int NOT NULL,
  `product_id` int NOT NULL,
  `quantity` decimal(10,2) NOT NULL DEFAULT '0.00',
  `reorder_level` decimal(10,2) NOT NULL DEFAULT '10.00',
  `version` int NOT NULL DEFAULT '0',
  PRIMARY KEY (`branch_id`,`product_id`),
  KEY `product_id` (`product_id`),
  CONSTRAINT `inventory_ibfk_1` FOREIGN KEY (`branch_id`) REFERENCES `branch` (`branch_id`),
  CONSTRAINT `inventory_ibfk_2` FOREIGN KEY (`product_id`) REFERENCES `product` (`product_id`),
  CONSTRAINT `inventory_chk_1` CHECK ((`quantity` >= 0)),
  CONSTRAINT `inventory_chk_2` CHECK ((`reorder_level` >= 0))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 1.24 Low Stock Alert Table
CREATE TABLE IF NOT EXISTS `low_stock_alert` (
  `alert_id` int NOT NULL AUTO_INCREMENT,
  `branch_id` int NOT NULL,
  `product_id` int NOT NULL,
  `quantity` int NOT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `resolved` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`alert_id`),
  KEY `branch_id` (`branch_id`),
  KEY `product_id` (`product_id`),
  CONSTRAINT `low_stock_alert_ibfk_1` FOREIGN KEY (`branch_id`) REFERENCES `branch` (`branch_id`),
  CONSTRAINT `low_stock_alert_ibfk_2` FOREIGN KEY (`product_id`) REFERENCES `product` (`product_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 1.25 Stock Audit Log Table
CREATE TABLE IF NOT EXISTS `stock_audit_log` (
  `log_id` int NOT NULL AUTO_INCREMENT,
  `branch_id` int NOT NULL,
  `product_id` int NOT NULL,
  `change_qty` int NOT NULL,
  `reason` enum('SALE','RESTOCK','CANCEL','TRANSFER_IN','TRANSFER_OUT','ADJUSTMENT') NOT NULL,
  `ref_order_id` int DEFAULT NULL,
  `logged_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`log_id`),
  KEY `branch_id` (`branch_id`),
  KEY `product_id` (`product_id`),
  KEY `idx_stock_audit_logged` (`logged_at`),
  CONSTRAINT `stock_audit_log_ibfk_1` FOREIGN KEY (`branch_id`) REFERENCES `branch` (`branch_id`),
  CONSTRAINT `stock_audit_log_ibfk_2` FOREIGN KEY (`product_id`) REFERENCES `product` (`product_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 1.26 Stock Audit Log Partitioned (Range Partitioning by YEAR(logged_at))
CREATE TABLE IF NOT EXISTS `stock_audit_log_partitioned` (
  `log_id` int NOT NULL AUTO_INCREMENT,
  `branch_id` int NOT NULL,
  `product_id` int NOT NULL,
  `change_qty` int NOT NULL,
  `reason` enum('SALE','RESTOCK','CANCEL','TRANSFER_IN','TRANSFER_OUT','ADJUSTMENT') NOT NULL,
  `ref_order_id` int DEFAULT NULL,
  `logged_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`log_id`,`logged_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
PARTITION BY RANGE (YEAR(`logged_at`))
(PARTITION p2024 VALUES LESS THAN (2025),
 PARTITION p2025 VALUES LESS THAN (2026),
 PARTITION p2026 VALUES LESS THAN (2027),
 PARTITION p_future VALUES LESS THAN MAXVALUE);

-- 1.27 Purchase Order Table
CREATE TABLE IF NOT EXISTS `purchase_order` (
  `po_id` int NOT NULL AUTO_INCREMENT,
  `supplier_id` int NOT NULL,
  `branch_id` int NOT NULL,
  `requested_by` int DEFAULT NULL,
  `received_by` int DEFAULT NULL,
  `order_date` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `confirmed_at` datetime DEFAULT NULL,
  `received_at` datetime DEFAULT NULL,
  `status` enum('REQUESTED','CONFIRMED','RECEIVED','CANCELLED') NOT NULL DEFAULT 'REQUESTED',
  `total_cost` decimal(12,2) NOT NULL DEFAULT '0.00',
  `supplier_notes` text,
  `receiving_notes` text,
  PRIMARY KEY (`po_id`),
  KEY `supplier_id` (`supplier_id`),
  KEY `branch_id` (`branch_id`),
  KEY `requested_by` (`requested_by`),
  KEY `received_by` (`received_by`),
  CONSTRAINT `purchase_order_ibfk_1` FOREIGN KEY (`supplier_id`) REFERENCES `supplier` (`supplier_id`),
  CONSTRAINT `purchase_order_ibfk_2` FOREIGN KEY (`branch_id`) REFERENCES `branch` (`branch_id`),
  CONSTRAINT `purchase_order_ibfk_3` FOREIGN KEY (`requested_by`) REFERENCES `employee` (`employee_id`),
  CONSTRAINT `purchase_order_ibfk_4` FOREIGN KEY (`received_by`) REFERENCES `employee` (`employee_id`),
  CONSTRAINT `purchase_order_chk_1` CHECK ((`total_cost` >= 0))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 1.28 Purchase Order Item Table
CREATE TABLE IF NOT EXISTS `purchase_order_item` (
  `po_id` int NOT NULL,
  `product_id` int NOT NULL,
  `requested_qty` decimal(10,2) NOT NULL,
  `confirmed_qty` decimal(10,2) DEFAULT NULL,
  `received_qty` decimal(10,2) DEFAULT NULL,
  `unit_cost` decimal(10,2) NOT NULL,
  `line_cost` decimal(12,2) GENERATED ALWAYS AS ((coalesce(`received_qty`,`confirmed_qty`,`requested_qty`) * `unit_cost`)) STORED,
  PRIMARY KEY (`po_id`,`product_id`),
  KEY `product_id` (`product_id`),
  CONSTRAINT `purchase_order_item_ibfk_1` FOREIGN KEY (`po_id`) REFERENCES `purchase_order` (`po_id`) ON DELETE CASCADE,
  CONSTRAINT `purchase_order_item_ibfk_2` FOREIGN KEY (`product_id`) REFERENCES `product` (`product_id`),
  CONSTRAINT `purchase_order_item_chk_1` CHECK ((`requested_qty` > 0)),
  CONSTRAINT `purchase_order_item_chk_2` CHECK (((`confirmed_qty` is null) or (`confirmed_qty` >= 0))),
  CONSTRAINT `purchase_order_item_chk_3` CHECK (((`received_qty` is null) or (`received_qty` >= 0))),
  CONSTRAINT `purchase_order_item_chk_4` CHECK ((`unit_cost` >= 0))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 1.29 Flyway Schema History Table
CREATE TABLE IF NOT EXISTS `flyway_schema_history` (
  `installed_rank` int NOT NULL,
  `version` varchar(50) DEFAULT NULL,
  `description` varchar(200) NOT NULL,
  `type` varchar(20) NOT NULL,
  `script` varchar(1000) NOT NULL,
  `checksum` int DEFAULT NULL,
  `installed_by` varchar(100) NOT NULL,
  `installed_on` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `execution_time` int NOT NULL,
  `success` tinyint(1) NOT NULL,
  PRIMARY KEY (`installed_rank`),
  KEY `flyway_schema_history_s_idx` (`success`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;

-- ==============================================================================
-- SECTION 2: USER-DEFINED FUNCTIONS (UDFs)
-- ==============================================================================

DELIMITER $$

-- 2.1 Order Line Item Subtotal Calculation
DROP FUNCTION IF EXISTS fn_order_total$$
CREATE FUNCTION fn_order_total(p_order_id INT) 
RETURNS DECIMAL(12,2)
READS SQL DATA
DETERMINISTIC
BEGIN
  DECLARE v_total DECIMAL(12,2);
  SELECT COALESCE(SUM(line_total), 0.00) INTO v_total
  FROM order_item
  WHERE order_id = p_order_id;
  RETURN v_total;
END$$

-- 2.2 Order Total Items Quantity Count
DROP FUNCTION IF EXISTS fn_order_item_count$$
CREATE FUNCTION fn_order_item_count(p_order_id INT) 
RETURNS INT
READS SQL DATA
DETERMINISTIC
BEGIN
  DECLARE v_count INT;
  SELECT COALESCE(SUM(quantity), 0) INTO v_count
  FROM order_item
  WHERE order_id = p_order_id;
  RETURN v_count;
END$$

-- 2.3 Customer Loyalty Tier Classification
DROP FUNCTION IF EXISTS fn_customer_tier$$
CREATE FUNCTION fn_customer_tier(p_customer_id INT)
RETURNS VARCHAR(10)
READS SQL DATA
DETERMINISTIC
BEGIN
  DECLARE v_points INT DEFAULT 0;

  IF p_customer_id IS NULL THEN
    RETURN 'BRONZE';
  END IF;

  SELECT COALESCE(loyalty_points, 0)
    INTO v_points
  FROM customer
  WHERE customer_id = p_customer_id;

  RETURN CASE
    WHEN v_points >= 1000 THEN 'GOLD'
    WHEN v_points >= 500  THEN 'SILVER'
    ELSE 'BRONZE'
  END;
END$$

-- 2.4 Holiday Verification Function
DROP FUNCTION IF EXISTS fn_is_holiday$$
CREATE FUNCTION fn_is_holiday(p_date DATE)
RETURNS BOOLEAN
READS SQL DATA
DETERMINISTIC
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM holiday
    WHERE holiday_date = p_date
  );
END$$

-- 2.5 First Purchase Qualification Check
DROP FUNCTION IF EXISTS fn_is_first_purchase$$
CREATE FUNCTION fn_is_first_purchase(p_customer_id INT, p_order_id INT)
RETURNS BOOLEAN
READS SQL DATA
DETERMINISTIC
BEGIN
  IF p_customer_id IS NULL THEN
    RETURN FALSE;
  END IF;

  -- 1. Check if customer has any other COMPLETED sales orders
  IF EXISTS (
    SELECT 1
    FROM sales_order
    WHERE customer_id = p_customer_id
      AND order_id <> COALESCE(p_order_id, -1)
      AND status = 'COMPLETED'
  ) THEN
    RETURN FALSE;
  END IF;

  -- 2. Check if customer has EVER already received the FIRST_PURCHASE discount on any order other than p_order_id
  IF EXISTS (
    SELECT 1
    FROM order_discount od
    JOIN sales_order so ON so.order_id = od.order_id
    JOIN discount_rule dr ON dr.rule_id = od.rule_id
    WHERE so.customer_id = p_customer_id
      AND dr.rule_type = 'FIRST_PURCHASE'
      AND so.order_id <> COALESCE(p_order_id, -1)
  ) THEN
    RETURN FALSE;
  END IF;

  RETURN TRUE;
END$$

-- 2.6 Coupon Validity Verification Function
DROP FUNCTION IF EXISTS fn_coupon_valid$$
CREATE FUNCTION fn_coupon_valid(p_code VARCHAR(20), p_rule_id INT)
RETURNS BOOLEAN
READS SQL DATA
DETERMINISTIC
BEGIN
  RETURN p_code IS NOT NULL
    AND EXISTS (
      SELECT 1
      FROM coupon c
      JOIN discount_rule r ON r.rule_id = c.rule_id
      WHERE c.code = UPPER(TRIM(p_code))
        AND (p_rule_id IS NULL OR c.rule_id = p_rule_id)
        AND c.expires_on >= CURDATE()
        AND c.used_count < c.max_uses
        AND r.is_active = TRUE
        AND CURDATE() BETWEEN r.start_date AND r.end_date
    );
END$$

-- 2.7 Branch Stock Level Lookup Function
DROP FUNCTION IF EXISTS fn_stock_level$$
CREATE FUNCTION fn_stock_level(p_branch INT, p_product INT)
RETURNS DECIMAL(10,2)
READS SQL DATA
DETERMINISTIC
BEGIN
  DECLARE v_qty DECIMAL(10,2);
  SELECT quantity INTO v_qty FROM inventory
  WHERE branch_id = p_branch AND product_id = p_product;
  RETURN COALESCE(v_qty, 0.00);
END$$

-- 2.8 Rolling Average Daily Sales Function
DROP FUNCTION IF EXISTS fn_avg_daily_sales$$
CREATE FUNCTION fn_avg_daily_sales(p_branch INT, p_days INT)
RETURNS DECIMAL(12,2)
READS SQL DATA
DETERMINISTIC
BEGIN
  DECLARE v_avg DECIMAL(12,2);
  -- Priority 1: Query precomputed daily_sales_summary table
  SELECT AVG(total_sales) INTO v_avg
  FROM daily_sales_summary
  WHERE (p_branch IS NULL OR branch_id = p_branch)
    AND summary_date >= CURDATE() - INTERVAL p_days DAY;

  -- Priority 2: Fallback to live sales_order if daily_sales_summary is pending
  IF v_avg IS NULL THEN
    SELECT COALESCE(AVG(daily_total), 0.00) INTO v_avg
    FROM (
      SELECT DATE(order_date) AS sale_date, SUM(total_amount) AS daily_total
      FROM sales_order
      WHERE status = 'COMPLETED'
        AND (p_branch IS NULL OR branch_id = p_branch)
        AND order_date >= CURDATE() - INTERVAL p_days DAY
      GROUP BY DATE(order_date)
    ) AS daily_agg;
  END IF;
  RETURN COALESCE(v_avg, 0.00);
END$$

-- 2.9 Supplier Fulfillment Rate Score Function
DROP FUNCTION IF EXISTS fn_supplier_fulfillment_rate$$
CREATE FUNCTION fn_supplier_fulfillment_rate(p_supplier_id INT)
RETURNS DECIMAL(5,2)
READS SQL DATA
DETERMINISTIC
BEGIN
  DECLARE v_requested DECIMAL(12,2);
  DECLARE v_confirmed DECIMAL(12,2);
  DECLARE v_rate DECIMAL(5,2);

  SELECT 
    COALESCE(SUM(poi.requested_qty), 0),
    COALESCE(SUM(poi.confirmed_qty), 0)
  INTO v_requested, v_confirmed
  FROM purchase_order po
  JOIN purchase_order_item poi ON poi.po_id = po.po_id
  WHERE po.supplier_id = p_supplier_id
    AND po.status IN ('CONFIRMED', 'RECEIVED');

  IF v_requested = 0 THEN
    RETURN 100.00;
  END IF;

  SET v_rate = ROUND((v_confirmed / v_requested) * 100.0, 2);
  RETURN LEAST(v_rate, 100.00);
END$$

-- 2.10 Dynamic Phone Masking UDF for Customer PII Compliance
DROP FUNCTION IF EXISTS fn_mask_phone$$
CREATE FUNCTION fn_mask_phone(p_phone VARCHAR(20)) 
RETURNS VARCHAR(20)
DETERMINISTIC
BEGIN
  IF p_phone IS NULL OR LENGTH(p_phone) < 7 THEN
    RETURN p_phone;
  END IF;

  RETURN CONCAT(LEFT(p_phone, 3), '****', RIGHT(p_phone, 3));
END$$

-- 2.11 Password Strength Complexity Evaluator
DROP FUNCTION IF EXISTS fn_check_password_strength$$
CREATE FUNCTION fn_check_password_strength(p_password VARCHAR(100)) 
RETURNS VARCHAR(20)
DETERMINISTIC
BEGIN
  DECLARE v_score INT DEFAULT 0;

  IF p_password IS NULL OR LENGTH(p_password) < 8 THEN
    RETURN 'WEAK';
  END IF;

  SET v_score = v_score + 1;

  IF REGEXP_LIKE(p_password, '[A-Z]', 'c') THEN
    SET v_score = v_score + 1;
  END IF;

  IF REGEXP_LIKE(p_password, '[a-z]', 'c') THEN
    SET v_score = v_score + 1;
  END IF;

  IF p_password REGEXP '[0-9]' THEN
    SET v_score = v_score + 1;
  END IF;

  IF p_password REGEXP '[-!@#$%^&*()_+|~=`{}\\[\\]:";\'<>?,./]' THEN
    SET v_score = v_score + 1;
  END IF;

  IF v_score >= 5 THEN
    RETURN 'STRONG';
  ELSEIF v_score >= 4 THEN
    RETURN 'MEDIUM';
  ELSE
    RETURN 'WEAK';
  END IF;
END$$

DELIMITER ;

-- ==============================================================================
-- SECTION 3: DATABASE VIEWS
-- ==============================================================================

-- 3.1 Product Catalog View (Enriched with Category and Supplier info)
CREATE OR REPLACE VIEW v_product_catalog AS
SELECT
  p.product_id,
  p.sku,
  p.name AS product_name,
  p.category_id,
  c.name AS category_name,
  p.supplier_id,
  s.name AS supplier_name,
  p.unit_price,
  p.cost_price,
  p.image_url,
  p.diet_type,
  p.unit_of_measure,
  p.min_order_qty,
  p.is_active
FROM product p
JOIN category c ON c.category_id = p.category_id
LEFT JOIN supplier s ON s.supplier_id = p.supplier_id;

-- 3.2 Category Summary View (Active product count per category)
CREATE OR REPLACE VIEW v_category_summary AS
SELECT
  c.category_id,
  c.name,
  c.description,
  c.icon,
  c.parent_id,
  COUNT(CASE WHEN p.is_active = TRUE THEN 1 END) AS active_product_count
FROM category c
LEFT JOIN product p ON p.category_id = c.category_id
GROUP BY c.category_id, c.name, c.description, c.icon, c.parent_id;

-- 3.3 Customer Directory View (Includes calculated loyalty tier and first purchase eligibility)
CREATE OR REPLACE VIEW v_customer_directory AS
SELECT
  c.customer_id,
  c.full_name,
  c.phone,
  c.email,
  c.loyalty_points,
  fn_customer_tier(c.customer_id) AS tier,
  c.registered_date,
  fn_is_first_purchase(c.customer_id, NULL) AS is_first_purchase
FROM customer c;

-- 3.4 Masked Customer Directory View (PII Data Masking using fn_mask_phone)
CREATE OR REPLACE VIEW v_masked_customer_directory AS
SELECT
  customer_id,
  full_name,
  fn_mask_phone(phone) AS masked_phone,
  email,
  loyalty_points,
  fn_customer_tier(customer_id) AS tier,
  registered_date,
  fn_is_first_purchase(customer_id, NULL) AS is_first_purchase
FROM customer;

-- 3.5 Customer Orders History View
CREATE OR REPLACE VIEW v_customer_orders AS
SELECT
  o.order_id,
  o.customer_id,
  o.order_date,
  o.status,
  o.subtotal,
  o.discount_total,
  o.total_amount,
  COUNT(oi.product_id) AS item_count
FROM sales_order o
LEFT JOIN order_item oi ON oi.order_id = o.order_id
GROUP BY
  o.order_id, o.customer_id, o.order_date, o.status,
  o.subtotal, o.discount_total, o.total_amount;

-- 3.6 Active Promotions View (Currently active within calendar date range)
CREATE OR REPLACE VIEW v_active_discounts AS
SELECT
  rule_id,
  name,
  rule_type,
  kind,
  value,
  min_order_amount,
  max_discount,
  tier,
  start_date,
  end_date,
  priority,
  stackable,
  is_active
FROM discount_rule
WHERE is_active = TRUE
  AND CURDATE() BETWEEN start_date AND end_date;

-- 3.7 Low Stock Alerts View (Items at or below reorder threshold)
CREATE OR REPLACE VIEW v_low_stock AS
SELECT i.branch_id, b.name AS branch, p.product_id, p.name AS product,
       p.unit_of_measure, i.quantity, i.reorder_level, i.version
FROM inventory i
JOIN product p ON p.product_id = i.product_id
JOIN branch b ON b.branch_id = i.branch_id
WHERE i.quantity <= i.reorder_level;

-- 3.8 Daily Branch Sales View
CREATE OR REPLACE VIEW v_daily_sales AS
SELECT 
  branch_id,
  DATE(order_date) AS sale_date,
  COUNT(*) AS orders,
  COALESCE(SUM(total_amount), 0.00) AS total_sales
FROM sales_order
WHERE status = 'COMPLETED'
GROUP BY branch_id, DATE(order_date);

-- 3.9 Product Sales Ranking View (Window Function: RANK() OVER Revenue)
CREATE OR REPLACE VIEW v_product_ranking AS
SELECT
  p.product_id,
  p.name AS name,
  p.sku,
  COALESCE(SUM(oi.quantity), 0) AS units_sold,
  COALESCE(SUM(oi.line_total), 0.00) AS revenue,
  RANK() OVER (ORDER BY COALESCE(SUM(oi.line_total), 0.00) DESC) AS revenue_rank
FROM product p
JOIN order_item oi ON oi.product_id = p.product_id
JOIN sales_order o ON o.order_id = oi.order_id AND o.status = 'COMPLETED'
GROUP BY p.product_id, p.name, p.sku;

-- 3.10 Promotional Discount Impact & ROI Analytical View
CREATE OR REPLACE VIEW v_discount_impact AS
SELECT 
  r.rule_id,
  r.name,
  r.rule_type,
  COUNT(DISTINCT od.order_id) AS orders_using,
  COALESCE(SUM(od.amount), 0.00) AS total_discount,
  COALESCE(SUM(o.total_amount), 0.00) AS revenue_after_discount,
  ROUND(
    COALESCE(SUM(o.total_amount), 0.00) / NULLIF(SUM(od.amount), 0), 
    1
  ) AS roi_ratio
FROM order_discount od
JOIN discount_rule r ON r.rule_id = od.rule_id
JOIN sales_order o ON o.order_id = od.order_id AND o.status = 'COMPLETED'
GROUP BY r.rule_id, r.name, r.rule_type;

-- 3.11 Supplier Performance & Reliability View
CREATE OR REPLACE VIEW v_supplier_performance AS
SELECT 
  s.supplier_id,
  s.name AS supplier_name,
  s.contact_person,
  s.phone,
  s.city,
  COUNT(DISTINCT po.po_id) AS total_orders,
  COALESCE(SUM(poi.requested_qty), 0.00) AS total_requested_qty,
  COALESCE(SUM(poi.confirmed_qty), 0.00) AS total_confirmed_qty,
  COALESCE(SUM(poi.received_qty), 0.00) AS total_received_qty,
  COALESCE(SUM(po.total_cost), 0.00) AS total_spend,
  fn_supplier_fulfillment_rate(s.supplier_id) AS fulfillment_rate,
  CASE 
    WHEN fn_supplier_fulfillment_rate(s.supplier_id) >= 95.00 THEN 'PREFERRED'
    WHEN fn_supplier_fulfillment_rate(s.supplier_id) >= 85.00 THEN 'RELIABLE'
    ELSE 'UNDER_REVIEW'
  END AS rating_tier
FROM supplier s
LEFT JOIN purchase_order po ON po.supplier_id = s.supplier_id
LEFT JOIN purchase_order_item poi ON poi.po_id = po.po_id
WHERE s.is_active = TRUE
GROUP BY s.supplier_id, s.name, s.contact_person, s.phone, s.city;

-- 3.12 Security Audit Log View (Member 5)
CREATE OR REPLACE VIEW v_security_audit_log AS
SELECT 
  log_id,
  event_type,
  details,
  performed_by,
  logged_at
FROM security_event_log;

-- 3.13 Employee Audit History View (Member 5)
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

-- 3.14 Complete Sales Order Summary View (Member 1 / Sales Management)
CREATE OR REPLACE VIEW v_sales_order_summary AS
SELECT 
  o.order_id,
  o.branch_id,
  b.name AS branch_name,
  o.customer_id,
  COALESCE(c.full_name, 'Guest Customer') AS customer_name,
  c.phone AS customer_phone,
  o.employee_id,
  e.full_name AS cashier_name,
  o.order_date,
  o.status,
  fn_order_item_count(o.order_id) AS total_items_count,
  o.subtotal,
  o.discount_total,
  o.total_amount,
  p.payment_id,
  p.method AS payment_method,
  p.paid_at
FROM sales_order o
JOIN branch b ON b.branch_id = o.branch_id
JOIN employee e ON e.employee_id = o.employee_id
LEFT JOIN customer c ON c.customer_id = o.customer_id
LEFT JOIN payment p ON p.order_id = o.order_id;

-- 3.15 Detailed Order Line Items View (Member 1)
CREATE OR REPLACE VIEW v_order_items_detailed AS
SELECT 
  oi.order_id,
  oi.product_id,
  p.sku,
  p.name AS product_name,
  cat.name AS category_name,
  oi.quantity,
  oi.unit_price,
  oi.line_total
FROM order_item oi
JOIN product p ON p.product_id = oi.product_id
JOIN category cat ON cat.category_id = p.category_id;

-- ==============================================================================
-- SECTION 4: STORED PROCEDURES
-- ==============================================================================

DELIMITER $$

-- 4.1 Procedure: sp_create_purchase_order
DROP PROCEDURE IF EXISTS sp_create_purchase_order$$
CREATE PROCEDURE sp_create_purchase_order(
  IN p_supplier_id INT, 
  IN p_branch_id INT, 
  IN p_employee_id INT,
  IN p_product_id INT, 
  IN p_qty DECIMAL(10,2), 
  OUT p_po_id INT
)
BEGIN
  DECLARE v_unit_cost DECIMAL(10,2);
  DECLARE EXIT HANDLER FOR SQLEXCEPTION 
  BEGIN 
    ROLLBACK; 
    RESIGNAL; 
  END;

  SELECT cost_price INTO v_unit_cost FROM product WHERE product_id = p_product_id;

  START TRANSACTION;
  INSERT INTO purchase_order (supplier_id, branch_id, requested_by, status, total_cost)
  VALUES (p_supplier_id, p_branch_id, p_employee_id, 'REQUESTED', (v_unit_cost * p_qty));
  SET p_po_id = LAST_INSERT_ID();

  INSERT INTO purchase_order_item (po_id, product_id, requested_qty, confirmed_qty, unit_cost)
  VALUES (p_po_id, p_product_id, p_qty, p_qty, v_unit_cost);
  COMMIT;
END$$

-- 4.2 Procedure: sp_supplier_confirm_order (Vendor Portal Confirmation)
DROP PROCEDURE IF EXISTS sp_supplier_confirm_order$$
CREATE PROCEDURE sp_supplier_confirm_order(
  IN p_po_id INT, 
  IN p_supplier_id INT, 
  IN p_confirmed_qty DECIMAL(10,2), 
  IN p_notes TEXT
)
BEGIN
  DECLARE v_unit_cost DECIMAL(10,2);
  DECLARE EXIT HANDLER FOR SQLEXCEPTION 
  BEGIN 
    ROLLBACK; 
    RESIGNAL; 
  END;

  START TRANSACTION;
  UPDATE purchase_order_item 
  SET confirmed_qty = p_confirmed_qty 
  WHERE po_id = p_po_id;

  SELECT unit_cost INTO v_unit_cost FROM purchase_order_item WHERE po_id = p_po_id LIMIT 1;

  UPDATE purchase_order 
  SET status = 'CONFIRMED', 
      supplier_notes = p_notes, 
      total_cost = (v_unit_cost * p_confirmed_qty), 
      confirmed_at = CURRENT_TIMESTAMP
  WHERE po_id = p_po_id AND supplier_id = p_supplier_id;
  COMMIT;
END$$

-- 4.3 Procedure: sp_receive_purchase (Physical Delivery with Optimistic Version Increment)
DROP PROCEDURE IF EXISTS sp_receive_purchase$$
CREATE PROCEDURE sp_receive_purchase(
  IN p_po_id INT, 
  IN p_employee_id INT, 
  IN p_received_qty DECIMAL(10,2), 
  IN p_notes TEXT
)
BEGIN
  DECLARE v_branch INT; 
  DECLARE v_prod INT;
  DECLARE EXIT HANDLER FOR SQLEXCEPTION 
  BEGIN 
    ROLLBACK; 
    RESIGNAL; 
  END;

  SELECT branch_id INTO v_branch FROM purchase_order WHERE po_id = p_po_id FOR UPDATE;
  SELECT product_id INTO v_prod FROM purchase_order_item WHERE po_id = p_po_id LIMIT 1;

  START TRANSACTION;
  UPDATE purchase_order_item 
  SET received_qty = p_received_qty 
  WHERE po_id = p_po_id;

  -- Atomic restock with optimistic version bumping
  INSERT INTO inventory (branch_id, product_id, quantity, version)
  VALUES (v_branch, v_prod, p_received_qty, 0)
  ON DUPLICATE KEY UPDATE 
    quantity = quantity + p_received_qty, 
    version = version + 1;

  -- Resolve low-stock alert if applicable
  UPDATE low_stock_alert 
  SET resolved = TRUE 
  WHERE branch_id = v_branch AND product_id = v_prod;

  -- Audit log entry
  INSERT INTO stock_audit_log (branch_id, product_id, change_qty, reason, ref_order_id)
  VALUES (v_branch, v_prod, p_received_qty, 'RESTOCK', p_po_id);

  UPDATE purchase_order 
  SET status = 'RECEIVED', 
      received_by = p_employee_id, 
      receiving_notes = p_notes, 
      received_at = CURRENT_TIMESTAMP
  WHERE po_id = p_po_id;
  COMMIT;
END$$

-- 4.4 Procedure: sp_transfer_stock (ACID Branch Transfer with Pessimistic Locking)
DROP PROCEDURE IF EXISTS sp_transfer_stock$$
CREATE PROCEDURE sp_transfer_stock(
  IN p_from_branch INT, 
  IN p_to_branch INT, 
  IN p_product INT, 
  IN p_qty DECIMAL(10,2)
)
BEGIN
  DECLARE v_current DECIMAL(10,2);
  DECLARE EXIT HANDLER FOR SQLEXCEPTION 
  BEGIN 
    ROLLBACK; 
    RESIGNAL; 
  END;

  START TRANSACTION;
  -- Lock source inventory row with pessimistic lock
  SELECT quantity INTO v_current FROM inventory
  WHERE branch_id = p_from_branch AND product_id = p_product FOR UPDATE;

  -- Verify sufficient stock availability
  IF v_current IS NULL OR v_current < p_qty THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Insufficient stock at source branch';
  END IF;

  -- Deduct from origin branch and bump optimistic version
  UPDATE inventory 
  SET quantity = quantity - p_qty, 
      version = version + 1
  WHERE branch_id = p_from_branch AND product_id = p_product;

  -- Increment target branch and bump optimistic version
  INSERT INTO inventory (branch_id, product_id, quantity, version)
  VALUES (p_to_branch, p_product, p_qty, 0)
  ON DUPLICATE KEY UPDATE 
    quantity = quantity + p_qty, 
    version = version + 1;

  -- Dual audit log entries for transfer traceability
  INSERT INTO stock_audit_log (branch_id, product_id, change_qty, reason)
  VALUES (p_from_branch, p_product, -p_qty, 'TRANSFER_OUT'),
         (p_to_branch, p_product, p_qty, 'TRANSFER_IN');
  COMMIT;
END$$

-- 4.5 Procedure: sp_save_product (Atomic Product Insert/Update with Validation)
DROP PROCEDURE IF EXISTS sp_save_product$$
CREATE PROCEDURE sp_save_product(
  IN p_product_id INT,
  IN p_category_id INT,
  IN p_supplier_id INT,
  IN p_sku VARCHAR(30),
  IN p_name VARCHAR(150),
  IN p_unit_price DECIMAL(10,2),
  IN p_cost_price DECIMAL(10,2),
  IN p_image_url VARCHAR(255),
  IN p_diet_type VARCHAR(20),
  IN p_unit_of_measure VARCHAR(30),
  IN p_min_order_qty DECIMAL(10,2),
  IN p_is_active BOOLEAN,
  OUT p_saved_product_id INT
)
BEGIN
  DECLARE v_category_exists INT DEFAULT 0;
  DECLARE v_supplier_exists INT DEFAULT 0;
  DECLARE v_duplicate_sku INT DEFAULT 0;
  DECLARE EXIT HANDLER FOR SQLEXCEPTION
  BEGIN
    ROLLBACK;
    RESIGNAL;
  END;

  IF NULLIF(TRIM(p_sku), '') IS NULL OR NULLIF(TRIM(p_name), '') IS NULL THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Product SKU and name are required';
  END IF;
  IF p_unit_price < 0 OR p_cost_price < 0 OR p_min_order_qty <= 0 THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Product prices and minimum quantity are invalid';
  END IF;

  SELECT COUNT(*) INTO v_category_exists FROM category WHERE category_id = p_category_id;
  IF v_category_exists = 0 THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Product category does not exist';
  END IF;

  IF p_supplier_id IS NOT NULL AND p_supplier_id > 0 THEN
    SELECT COUNT(*) INTO v_supplier_exists FROM supplier WHERE supplier_id = p_supplier_id;
    IF v_supplier_exists = 0 THEN
      SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Product supplier does not exist';
    END IF;
  ELSE
    SET p_supplier_id = NULL;
  END IF;

  SELECT COUNT(*) INTO v_duplicate_sku
  FROM product
  WHERE sku = TRIM(p_sku)
    AND (p_product_id IS NULL OR product_id <> p_product_id);
  IF v_duplicate_sku > 0 THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Product SKU already exists';
  END IF;

  START TRANSACTION;
  IF p_product_id IS NULL THEN
    INSERT INTO product (
      category_id, supplier_id, sku, name, unit_price, cost_price,
      image_url, diet_type, unit_of_measure, min_order_qty, is_active
    )
    VALUES (
      p_category_id, p_supplier_id, TRIM(p_sku), TRIM(p_name), p_unit_price, p_cost_price,
      p_image_url, p_diet_type, p_unit_of_measure, p_min_order_qty, COALESCE(p_is_active, TRUE)
    );
    SET p_saved_product_id = LAST_INSERT_ID();
  ELSE
    UPDATE product
    SET category_id = p_category_id,
        supplier_id = p_supplier_id,
        sku = TRIM(p_sku),
        name = TRIM(p_name),
        unit_price = p_unit_price,
        cost_price = p_cost_price,
        image_url = p_image_url,
        diet_type = p_diet_type,
        unit_of_measure = p_unit_of_measure,
        min_order_qty = p_min_order_qty,
        is_active = COALESCE(p_is_active, is_active)
    WHERE product_id = p_product_id;
    IF ROW_COUNT() = 0 THEN
      SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Product does not exist';
    END IF;
    SET p_saved_product_id = p_product_id;
  END IF;
  COMMIT;
END$$

-- 4.6 Procedure: sp_register_customer (Customer Registration with Duplicate Phone Protection)
DROP PROCEDURE IF EXISTS sp_register_customer$$
CREATE PROCEDURE sp_register_customer(
  IN p_full_name VARCHAR(120),
  IN p_phone VARCHAR(20),
  IN p_email VARCHAR(100),
  OUT p_customer_id INT
)
BEGIN
  DECLARE v_existing_id INT DEFAULT NULL;
  DECLARE EXIT HANDLER FOR SQLEXCEPTION
  BEGIN
    ROLLBACK;
    RESIGNAL;
  END;

  IF NULLIF(TRIM(p_full_name), '') IS NULL OR NULLIF(TRIM(p_phone), '') IS NULL THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Customer name and phone are required';
  END IF;

  SELECT customer_id INTO v_existing_id
  FROM customer
  WHERE phone = TRIM(p_phone)
  LIMIT 1;
  IF v_existing_id IS NOT NULL THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Customer phone number already exists';
  END IF;

  START TRANSACTION;
  INSERT INTO customer (full_name, phone, email)
  VALUES (TRIM(p_full_name), TRIM(p_phone), NULLIF(TRIM(p_email), ''));
  SET p_customer_id = LAST_INSERT_ID();
  COMMIT;
END$$

-- 4.7 Procedure: sp_save_discount_rule (Promotion Rule Management & Validation)
DROP PROCEDURE IF EXISTS sp_save_discount_rule$$
CREATE PROCEDURE sp_save_discount_rule(
  IN p_rule_id INT,
  IN p_name VARCHAR(100),
  IN p_rule_type VARCHAR(20),
  IN p_kind VARCHAR(10),
  IN p_value DECIMAL(10,2),
  IN p_min_order_amount DECIMAL(12,2),
  IN p_max_discount DECIMAL(12,2),
  IN p_tier VARCHAR(10),
  IN p_start_date DATE,
  IN p_end_date DATE,
  IN p_priority INT,
  IN p_stackable BOOLEAN,
  IN p_is_active BOOLEAN,
  OUT p_saved_rule_id INT
)
BEGIN
  DECLARE EXIT HANDLER FOR SQLEXCEPTION
  BEGIN
    ROLLBACK;
    RESIGNAL;
  END;

  IF NULLIF(TRIM(p_name), '') IS NULL OR p_value <= 0 OR p_min_order_amount < 0
     OR p_priority < 0 OR p_end_date < p_start_date THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Invalid discount rule values';
  END IF;
  IF p_kind = 'PERCENT' AND p_value > 100 THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Percentage discount cannot exceed 100';
  END IF;
  IF p_rule_type = 'LOYALTY'
     AND COALESCE(p_tier, '') NOT IN ('BRONZE', 'SILVER', 'GOLD') THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Loyalty rule requires a valid tier';
  END IF;

  START TRANSACTION;
  IF p_rule_id IS NULL THEN
    INSERT INTO discount_rule (
      name, rule_type, kind, value, min_order_amount, max_discount, tier,
      start_date, end_date, priority, stackable, is_active
    )
    VALUES (
      TRIM(p_name), p_rule_type, p_kind, p_value, p_min_order_amount, p_max_discount,
      NULLIF(TRIM(p_tier), ''), p_start_date, p_end_date, p_priority,
      COALESCE(p_stackable, TRUE), COALESCE(p_is_active, TRUE)
    );
    SET p_saved_rule_id = LAST_INSERT_ID();
  ELSE
    UPDATE discount_rule
    SET name = TRIM(p_name), rule_type = p_rule_type, kind = p_kind,
        value = p_value, min_order_amount = p_min_order_amount,
        max_discount = p_max_discount, tier = NULLIF(TRIM(p_tier), ''),
        start_date = p_start_date, end_date = p_end_date, priority = p_priority,
        stackable = COALESCE(p_stackable, stackable),
        is_active = COALESCE(p_is_active, is_active)
    WHERE rule_id = p_rule_id;
    IF ROW_COUNT() = 0 THEN
      SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Discount rule does not exist';
    END IF;
    SET p_saved_rule_id = p_rule_id;
  END IF;
  COMMIT;
END$$

-- 4.8 Procedure: sp_save_coupon (Coupon Registration linked to Promotion Rule)
DROP PROCEDURE IF EXISTS sp_save_coupon$$
CREATE PROCEDURE sp_save_coupon(
  IN p_code VARCHAR(20),
  IN p_rule_id INT,
  IN p_max_uses INT,
  IN p_expires_on DATE
)
BEGIN
  DECLARE v_rule_exists INT DEFAULT 0;
  DECLARE EXIT HANDLER FOR SQLEXCEPTION
  BEGIN
    ROLLBACK;
    RESIGNAL;
  END;

  SELECT COUNT(*) INTO v_rule_exists FROM discount_rule WHERE rule_id = p_rule_id;
  IF NULLIF(TRIM(p_code), '') IS NULL OR p_max_uses <= 0 OR p_expires_on IS NULL
     OR v_rule_exists = 0 THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Invalid coupon details';
  END IF;

  START TRANSACTION;
  INSERT INTO coupon (code, rule_id, max_uses, expires_on)
  VALUES (UPPER(TRIM(p_code)), p_rule_id, p_max_uses, p_expires_on)
  ON DUPLICATE KEY UPDATE
    rule_id = VALUES(rule_id),
    max_uses = VALUES(max_uses),
    expires_on = VALUES(expires_on);
  COMMIT;
END$$

-- 4.9 Procedure: sp_save_holiday (Upserts Holiday in Calendar)
DROP PROCEDURE IF EXISTS sp_save_holiday$$
CREATE PROCEDURE sp_save_holiday(
  IN p_holiday_date DATE,
  IN p_name VARCHAR(100)
)
BEGIN
  DECLARE EXIT HANDLER FOR SQLEXCEPTION
  BEGIN
    ROLLBACK;
    RESIGNAL;
  END;

  IF p_holiday_date IS NULL OR NULLIF(TRIM(p_name), '') IS NULL THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Holiday date and name are required';
  END IF;

  START TRANSACTION;
  INSERT INTO holiday (holiday_date, name)
  VALUES (p_holiday_date, TRIM(p_name))
  ON DUPLICATE KEY UPDATE name = VALUES(name);
  COMMIT;
END$$

-- 4.10 Procedure: sp_save_holiday_discount (Atomic Holiday and Matching Promotion Upsert)
DROP PROCEDURE IF EXISTS sp_save_holiday_discount$$
CREATE PROCEDURE sp_save_holiday_discount(
  IN p_holiday_date DATE,
  IN p_name VARCHAR(100),
  IN p_discount_percent DECIMAL(10,2),
  OUT p_saved_rule_id INT
)
BEGIN
  DECLARE v_rule_name VARCHAR(100);
  DECLARE v_existing_rule_id INT DEFAULT NULL;
  DECLARE EXIT HANDLER FOR SQLEXCEPTION
  BEGIN
    ROLLBACK;
    RESIGNAL;
  END;

  IF p_holiday_date IS NULL
     OR NULLIF(TRIM(p_name), '') IS NULL
     OR p_discount_percent <= 0
     OR p_discount_percent > 100 THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'Holiday date, name and discount percentage are required; percentage must be between 0 and 100';
  END IF;

  SET v_rule_name = LEFT(CONCAT(TRIM(p_name), ' Promotion'), 100);

  START TRANSACTION;

  INSERT INTO holiday (holiday_date, name)
  VALUES (p_holiday_date, TRIM(p_name))
  ON DUPLICATE KEY UPDATE name = VALUES(name);

  SELECT rule_id
    INTO v_existing_rule_id
  FROM discount_rule
  WHERE rule_type = 'HOLIDAY'
    AND start_date = p_holiday_date
  ORDER BY rule_id
  LIMIT 1;

  UPDATE discount_rule
  SET name = v_rule_name,
      value = p_discount_percent,
      end_date = p_holiday_date,
      is_active = TRUE
  WHERE rule_id = v_existing_rule_id;

  IF v_existing_rule_id IS NULL THEN
    INSERT INTO discount_rule (
      name, rule_type, kind, value, min_order_amount, max_discount, tier,
      start_date, end_date, priority, stackable, is_active
    )
    VALUES (
      v_rule_name, 'HOLIDAY', 'PERCENT', p_discount_percent, 0.00, NULL, NULL,
      p_holiday_date, p_holiday_date, 50, TRUE, TRUE
    );
    SET p_saved_rule_id = LAST_INSERT_ID();
  ELSE
    SET p_saved_rule_id = v_existing_rule_id;
  END IF;

  UPDATE discount_rule
  SET is_active = FALSE
  WHERE rule_type = 'HOLIDAY'
    AND start_date = p_holiday_date
    AND rule_id <> p_saved_rule_id;

  COMMIT;
END$$

-- 4.11 Procedure: sp_apply_discounts (Priority Cursor Discount Engine with 50% Safety Cap)
DROP PROCEDURE IF EXISTS sp_apply_discounts$$
CREATE PROCEDURE sp_apply_discounts(
  IN p_order_id INT,
  IN p_coupon_code VARCHAR(20)
)
BEGIN
  DECLARE v_customer_id INT DEFAULT NULL;
  DECLARE v_order_date DATE;
  DECLARE v_subtotal DECIMAL(12,2) DEFAULT 0.00;
  DECLARE v_running_discount DECIMAL(12,2) DEFAULT 0.00;
  DECLARE v_discount DECIMAL(12,2) DEFAULT 0.00;
  DECLARE v_allowed DECIMAL(12,2) DEFAULT 0.00;
  DECLARE v_tier VARCHAR(10);
  DECLARE v_first_purchase BOOLEAN DEFAULT FALSE;
  DECLARE v_rule_id INT;
  DECLARE v_rule_type VARCHAR(20);
  DECLARE v_kind VARCHAR(10);
  DECLARE v_value DECIMAL(10,2);
  DECLARE v_min_order DECIMAL(12,2);
  DECLARE v_max_discount DECIMAL(12,2);
  DECLARE v_rule_tier VARCHAR(10);
  DECLARE v_stackable BOOLEAN;
  DECLARE v_coupon_rule_id INT DEFAULT NULL;
  DECLARE v_done BOOLEAN DEFAULT FALSE;
  DECLARE v_non_stackable_applied BOOLEAN DEFAULT FALSE;

  DECLARE rule_cursor CURSOR FOR
    SELECT rule_id, rule_type, kind, value, min_order_amount,
           max_discount, tier, stackable
    FROM discount_rule
    WHERE is_active = TRUE
      AND v_order_date BETWEEN start_date AND end_date
    ORDER BY priority ASC, rule_id ASC;
  DECLARE CONTINUE HANDLER FOR NOT FOUND SET v_done = TRUE;
  DECLARE EXIT HANDLER FOR SQLEXCEPTION
  BEGIN
    ROLLBACK;
    RESIGNAL;
  END;

  IF p_order_id IS NULL THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Order ID is required';
  END IF;

  START TRANSACTION;

  SELECT customer_id, DATE(order_date), subtotal
    INTO v_customer_id, v_order_date, v_subtotal
  FROM sales_order
  WHERE order_id = p_order_id
  FOR UPDATE;

  IF v_subtotal IS NULL THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Order does not exist';
  END IF;

  SET v_tier = fn_customer_tier(v_customer_id);
  SET v_first_purchase = (v_customer_id IS NOT NULL) AND fn_is_first_purchase(v_customer_id, p_order_id);

  DELETE FROM order_discount WHERE order_id = p_order_id;

  IF NULLIF(TRIM(p_coupon_code), '') IS NOT NULL THEN
    SELECT c.rule_id
      INTO v_coupon_rule_id
    FROM coupon c
    JOIN discount_rule r ON r.rule_id = c.rule_id
    WHERE c.code = UPPER(TRIM(p_coupon_code))
    FOR UPDATE;

    IF v_coupon_rule_id IS NULL
       OR NOT EXISTS (
         SELECT 1
         FROM coupon c
         JOIN discount_rule r ON r.rule_id = c.rule_id
         WHERE c.code = UPPER(TRIM(p_coupon_code))
           AND c.rule_id = v_coupon_rule_id
           AND c.expires_on >= v_order_date
           AND c.used_count < c.max_uses
           AND r.is_active = TRUE
           AND v_order_date BETWEEN r.start_date AND r.end_date
       ) THEN
      SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Coupon is invalid or expired';
    END IF;
  END IF;

  OPEN rule_cursor;
  rule_loop: LOOP
    FETCH rule_cursor INTO
      v_rule_id, v_rule_type, v_kind, v_value, v_min_order,
      v_max_discount, v_rule_tier, v_stackable;
    IF v_done THEN
      LEAVE rule_loop;
    END IF;

    IF v_subtotal < v_min_order THEN
      ITERATE rule_loop;
    END IF;
    IF v_rule_type = 'FIRST_PURCHASE' AND NOT v_first_purchase THEN
      ITERATE rule_loop;
    END IF;
    IF v_rule_type = 'HOLIDAY' AND NOT fn_is_holiday(v_order_date) THEN
      ITERATE rule_loop;
    END IF;
    IF v_rule_type = 'LOYALTY' AND (v_customer_id IS NULL OR v_rule_tier <> v_tier) THEN
      ITERATE rule_loop;
    END IF;
    IF v_rule_type = 'COUPON' AND v_rule_id <> v_coupon_rule_id THEN
      ITERATE rule_loop;
    END IF;
    IF NOT v_stackable AND v_non_stackable_applied THEN
      ITERATE rule_loop;
    END IF;

    IF v_kind = 'PERCENT' THEN
      SET v_discount = ROUND(v_subtotal * v_value / 100, 2);
    ELSE
      SET v_discount = v_value;
    END IF;
    IF v_max_discount IS NOT NULL THEN
      SET v_discount = LEAST(v_discount, v_max_discount);
    END IF;

    SET v_allowed = ROUND((v_subtotal * 0.50) - v_running_discount, 2);
    SET v_discount = LEAST(v_discount, GREATEST(v_allowed, 0.00));
    IF v_discount > 0 THEN
      INSERT INTO order_discount (order_id, rule_id, amount)
      VALUES (p_order_id, v_rule_id, v_discount);
      SET v_running_discount = v_running_discount + v_discount;
      IF NOT v_stackable THEN
        SET v_non_stackable_applied = TRUE;
      END IF;
      IF v_rule_type = 'COUPON' THEN
        UPDATE coupon
        SET used_count = used_count + 1
        WHERE code = UPPER(TRIM(p_coupon_code))
          AND used_count < max_uses;
      END IF;
    END IF;
  END LOOP;
  CLOSE rule_cursor;

  UPDATE sales_order
  SET discount_total = v_running_discount,
      total_amount = GREATEST(v_subtotal - v_running_discount, 0.00)
  WHERE order_id = p_order_id;

  COMMIT;

  SELECT od.rule_id, r.name AS rule_name, od.amount
  FROM order_discount od
  JOIN discount_rule r ON r.rule_id = od.rule_id
  WHERE od.order_id = p_order_id
  ORDER BY r.priority ASC, od.rule_id ASC;
END$$

-- 4.12 Procedure: sp_place_order (Atomic POS Checkout with Deadlock Prevention)
DROP PROCEDURE IF EXISTS sp_place_order$$
CREATE PROCEDURE sp_place_order(
  IN  p_branch     INT,
  IN  p_customer   INT,
  IN  p_employee   INT,
  IN  p_method     VARCHAR(10),
  IN  p_coupon     VARCHAR(20),
  IN  p_items      JSON,
  OUT p_order_id   INT
)
proc_label: BEGIN
  DECLARE v_lock INT;

  -- Atomic ACID rollback upon any SQL exception
  DECLARE EXIT HANDLER FOR SQLEXCEPTION
  BEGIN
    ROLLBACK;
    RESIGNAL;
  END;

  START TRANSACTION;

  -- 1. Concurrency control: Lock customer row with FOR UPDATE
  IF p_customer IS NOT NULL THEN
    SELECT customer_id INTO v_lock 
    FROM customer 
    WHERE customer_id = p_customer 
    FOR UPDATE;
  END IF;

  -- 2. Insert master sales order header
  INSERT INTO sales_order (branch_id, customer_id, employee_id, status)
  VALUES (p_branch, p_customer, p_employee, 'COMPLETED');

  SET p_order_id = LAST_INSERT_ID();

  -- 3. Unpack JSON cart items using MySQL 8 JSON_TABLE.
  -- ORDER BY j.product_id ASC ensures all parallel sessions acquire row locks in exact same order (deadlock avoidance)
  INSERT INTO order_item (order_id, product_id, quantity, unit_price)
  SELECT p_order_id, j.product_id, j.qty, p.unit_price
  FROM JSON_TABLE(p_items, '$[*]' COLUMNS (
    product_id INT PATH '$.productId',
    qty        INT PATH '$.qty'
  )) j
  JOIN product p ON p.product_id = j.product_id
  ORDER BY j.product_id ASC;

  -- Calculate and update order subtotal
  UPDATE sales_order 
  SET subtotal = fn_order_total(p_order_id),
      total_amount = fn_order_total(p_order_id)
  WHERE order_id = p_order_id;

  -- 4. Apply dynamic promotional rules via cursor procedure
  CALL sp_apply_discounts(p_order_id, p_coupon);

  -- 5. Record final payment transaction with net total
  INSERT INTO payment (order_id, method, amount)
  SELECT p_order_id, p_method, total_amount 
  FROM sales_order 
  WHERE order_id = p_order_id;

  -- 6. Credit Loyalty Points: Rs. 100 spent = 1 Point
  IF p_customer IS NOT NULL THEN
    UPDATE customer
    SET loyalty_points = loyalty_points + FLOOR((SELECT total_amount FROM sales_order WHERE order_id = p_order_id) / 100.00)
    WHERE customer_id = p_customer;
  END IF;

  COMMIT;
END$$

-- 4.13 Procedure: sp_cancel_order (Order Cancellation & Inventory Restoration)
DROP PROCEDURE IF EXISTS sp_cancel_order$$
CREATE PROCEDURE sp_cancel_order(
  IN p_order_id INT,
  IN p_employee INT
)
BEGIN
  DECLARE v_status VARCHAR(20);

  DECLARE EXIT HANDLER FOR SQLEXCEPTION
  BEGIN
    ROLLBACK;
    RESIGNAL;
  END;

  START TRANSACTION;

  -- Lock and verify existing order status
  SELECT status INTO v_status 
  FROM sales_order 
  WHERE order_id = p_order_id 
  FOR UPDATE;

  IF v_status IS NULL THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Order not found';
  END IF;

  IF v_status = 'CANCELLED' THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Order is already cancelled';
  END IF;

  -- 1. Restore branch stock back to inventory
  UPDATE inventory i
  JOIN order_item oi ON oi.product_id = i.product_id AND oi.order_id = p_order_id
  JOIN sales_order o ON o.order_id = p_order_id AND o.branch_id = i.branch_id
  SET i.quantity = i.quantity + oi.quantity,
      i.version = i.version + 1;

  -- 2. Audit log entry for stock replenishment due to order cancellation
  INSERT INTO stock_audit_log (branch_id, product_id, change_qty, reason, ref_order_id)
  SELECT o.branch_id, oi.product_id, oi.quantity, 'CANCEL', p_order_id
  FROM order_item oi
  JOIN sales_order o ON o.order_id = oi.order_id
  WHERE o.order_id = p_order_id;

  -- 3. Revert loyalty points earned if this order was for a registered customer
  UPDATE customer c
  JOIN sales_order o ON o.customer_id = c.customer_id AND o.order_id = p_order_id
  SET c.loyalty_points = GREATEST(0, c.loyalty_points - FLOOR(o.total_amount / 100.00));

  -- 4. Mark sales order header as CANCELLED
  UPDATE sales_order 
  SET status = 'CANCELLED' 
  WHERE order_id = p_order_id;

  COMMIT;
END$$

-- 4.14 Procedure: sp_monthly_report (Hierarchical Sales Rollup with GROUP BY ... WITH ROLLUP)
DROP PROCEDURE IF EXISTS sp_monthly_report$$
CREATE PROCEDURE sp_monthly_report(
  IN p_year INT,
  IN p_month INT,
  IN p_branch INT
)
BEGIN
  SELECT 
    o.branch_id,
    MAX(b.name) AS branch_name,
    DATE(o.order_date) AS day,
    COUNT(o.order_id) AS orders,
    SUM(o.total_amount) AS sales
  FROM sales_order o
  JOIN branch b ON b.branch_id = o.branch_id
  WHERE o.status = 'COMPLETED'
    AND YEAR(o.order_date) = p_year
    AND MONTH(o.order_date) = p_month
    AND (p_branch IS NULL OR o.branch_id = p_branch)
  GROUP BY o.branch_id, DATE(o.order_date) WITH ROLLUP;
END$$

-- 4.15 Procedure: sp_category_sales_cte (Recursive Category Tree CTE + Chain Revenue Share)
DROP PROCEDURE IF EXISTS sp_category_sales_cte$$
CREATE PROCEDURE sp_category_sales_cte()
BEGIN
  WITH RECURSIVE CategoryHierarchy AS (
    -- Anchor Member: Root categories
    SELECT 
      category_id,
      name AS category_name,
      CAST('Root' AS CHAR(100)) AS parent_category,
      1 AS hierarchy_level
    FROM category
    WHERE parent_id IS NULL
    UNION ALL
    -- Recursive Member: Subcategories
    SELECT 
      c.category_id,
      c.name AS category_name,
      ch.category_name AS parent_category,
      ch.hierarchy_level + 1 AS hierarchy_level
    FROM category c
    JOIN CategoryHierarchy ch ON c.parent_id = ch.category_id
  ),
  CategorySalesAgg AS (
    SELECT 
      ch.category_id,
      ch.category_name,
      ch.parent_category,
      ch.hierarchy_level,
      COALESCE(SUM(oi.quantity), 0) AS total_products_sold,
      COALESCE(SUM(oi.line_total), 0.00) AS revenue
    FROM CategoryHierarchy ch
    LEFT JOIN product p ON p.category_id = ch.category_id
    LEFT JOIN order_item oi ON oi.product_id = p.product_id
    LEFT JOIN sales_order o ON o.order_id = oi.order_id AND o.status = 'COMPLETED'
    GROUP BY 
      ch.category_id,
      ch.category_name,
      ch.parent_category,
      ch.hierarchy_level
  )
  SELECT 
    category_id,
    category_name,
    parent_category,
    hierarchy_level,
    total_products_sold,
    revenue,
    ROUND(
      COALESCE(revenue * 100.0 / NULLIF(SUM(revenue) OVER (), 0), 0.0), 
      1
    ) AS revenue_share_percent
  FROM CategorySalesAgg
  ORDER BY hierarchy_level ASC, revenue DESC;
END$$

-- 4.16 Procedure: sp_financial_reconciliation_report (REPEATABLE READ Consistent Snapshot)
DROP PROCEDURE IF EXISTS sp_financial_reconciliation_report$$
CREATE PROCEDURE sp_financial_reconciliation_report(
  IN p_branch_id INT,
  IN p_start_date DATE,
  IN p_end_date DATE
)
BEGIN
  SET TRANSACTION ISOLATION LEVEL REPEATABLE READ;
  START TRANSACTION WITH CONSISTENT SNAPSHOT, READ ONLY;

  -- 1. Summary Totals (Point-in-Time T0 snapshot)
  SELECT 
    COUNT(order_id) AS total_completed_orders,
    COALESCE(SUM(subtotal), 0.00) AS gross_sales,
    COALESCE(SUM(discount_total), 0.00) AS total_discounts,
    COALESCE(SUM(total_amount), 0.00) AS net_revenue
  FROM sales_order
  WHERE status = 'COMPLETED'
    AND (p_branch_id IS NULL OR branch_id = p_branch_id)
    AND DATE(order_date) BETWEEN p_start_date AND p_end_date;

  -- 2. Tender Payment Breakdown (Reconciles 100% mathematically with net_revenue)
  SELECT 
    p.method AS payment_method,
    COUNT(p.payment_id) AS transaction_count,
    COALESCE(SUM(p.amount), 0.00) AS total_collected
  FROM payment p
  JOIN sales_order o ON o.order_id = p.order_id
  WHERE o.status = 'COMPLETED'
    AND (p_branch_id IS NULL OR o.branch_id = p_branch_id)
    AND DATE(o.order_date) BETWEEN p_start_date AND p_end_date
  GROUP BY p.method;

  COMMIT;
END$$

-- 4.17 Procedure: sp_get_login (Authentication credential lookup from joined roles table)
DROP PROCEDURE IF EXISTS sp_get_login$$
CREATE PROCEDURE sp_get_login(IN p_username VARCHAR(50))
BEGIN
  SELECT e.employee_id, e.branch_id, e.full_name, r.role_name AS role, e.password_hash, e.is_active
  FROM employee e
  JOIN roles r ON e.role_id = r.role_id
  WHERE e.username = p_username AND e.is_active = TRUE;
END$$

-- 4.18 Procedure: sp_deactivate_employee (Employee deactivation with Self-Lockout constraint guard)
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

-- 4.19 Procedure: sp_change_user_role (Modify employee role_id and record security event)
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

  -- Look up or dynamically register role in roles table
  SELECT role_id INTO v_role_id FROM roles WHERE UPPER(role_name) = UPPER(p_new_role) LIMIT 1;
  IF v_role_id IS NULL THEN
    INSERT INTO roles (role_name, description) VALUES (UPPER(p_new_role), CONCAT('Custom role: ', UPPER(p_new_role)));
    SET v_role_id = LAST_INSERT_ID();
  END IF;

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

-- ==============================================================================
-- SECTION 5: DATABASE TRIGGERS
-- ==============================================================================

DELIMITER $$

-- 5.1 Trigger: trg_orderitem_check_stock (BEFORE INSERT ON order_item with Pessimistic Lock)
DROP TRIGGER IF EXISTS trg_orderitem_check_stock$$
CREATE TRIGGER trg_orderitem_check_stock 
BEFORE INSERT ON order_item
FOR EACH ROW
BEGIN
  DECLARE v_branch INT;
  DECLARE v_qty DECIMAL(10,2);

  SELECT branch_id INTO v_branch 
  FROM sales_order 
  WHERE order_id = NEW.order_id;

  -- Lock specific branch inventory row with SELECT ... FOR UPDATE
  SELECT quantity INTO v_qty 
  FROM inventory
  WHERE branch_id = v_branch AND product_id = NEW.product_id
  FOR UPDATE;

  IF v_qty IS NULL OR v_qty < NEW.quantity THEN
    SIGNAL SQLSTATE '45000' 
      SET MESSAGE_TEXT = 'Insufficient stock';
  END IF;
END$$

-- 5.2 Trigger: trg_orderitem_reduce_stock (AFTER INSERT ON order_item)
DROP TRIGGER IF EXISTS trg_orderitem_reduce_stock$$
CREATE TRIGGER trg_orderitem_reduce_stock 
AFTER INSERT ON order_item
FOR EACH ROW
BEGIN
  DECLARE v_branch INT;

  SELECT branch_id INTO v_branch 
  FROM sales_order 
  WHERE order_id = NEW.order_id;

  -- Atomic inventory deduction and version increment
  UPDATE inventory 
  SET quantity = quantity - NEW.quantity,
      version = version + 1
  WHERE branch_id = v_branch AND product_id = NEW.product_id;

  -- Immutable stock movement audit log entry
  INSERT INTO stock_audit_log (branch_id, product_id, change_qty, reason, ref_order_id)
  VALUES (v_branch, NEW.product_id, -NEW.quantity, 'SALE', NEW.order_id);
END$$

-- 5.3 Trigger: trg_inventory_low_stock (AFTER UPDATE ON inventory)
DROP TRIGGER IF EXISTS trg_inventory_low_stock$$
CREATE TRIGGER trg_inventory_low_stock 
AFTER UPDATE ON inventory
FOR EACH ROW
BEGIN
  IF NEW.quantity <= NEW.reorder_level AND OLD.quantity > OLD.reorder_level THEN
    INSERT INTO low_stock_alert (branch_id, product_id, quantity)
    VALUES (NEW.branch_id, NEW.product_id, NEW.quantity);
  END IF;
END$$

-- 5.4 Trigger: trg_product_price_audit (AFTER UPDATE ON product)
DROP TRIGGER IF EXISTS trg_product_price_audit$$
CREATE TRIGGER trg_product_price_audit
AFTER UPDATE ON product
FOR EACH ROW
BEGIN
  IF OLD.unit_price <> NEW.unit_price THEN
    INSERT INTO price_audit_log (
      product_id, old_price, new_price, changed_by
    )
    VALUES (
      NEW.product_id, OLD.unit_price, NEW.unit_price, USER()
    );
  END IF;
END$$

-- 5.5 Trigger: trg_rule_check_insert (BEFORE INSERT ON discount_rule)
DROP TRIGGER IF EXISTS trg_rule_check_insert$$
CREATE TRIGGER trg_rule_check_insert
BEFORE INSERT ON discount_rule
FOR EACH ROW
BEGIN
  IF NEW.kind = 'PERCENT' AND (NEW.value <= 0 OR NEW.value > 100) THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'Percentage discount must be between 0 and 100';
  END IF;
  IF NEW.end_date < NEW.start_date THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'Discount end date cannot precede start date';
  END IF;
  IF NEW.rule_type = 'LOYALTY'
     AND COALESCE(NEW.tier, '') NOT IN ('BRONZE', 'SILVER', 'GOLD') THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'Loyalty rule requires a valid tier';
  END IF;
END$$

-- 5.6 Trigger: trg_rule_check_update (BEFORE UPDATE ON discount_rule)
DROP TRIGGER IF EXISTS trg_rule_check_update$$
CREATE TRIGGER trg_rule_check_update
BEFORE UPDATE ON discount_rule
FOR EACH ROW
BEGIN
  IF NEW.kind = 'PERCENT' AND (NEW.value <= 0 OR NEW.value > 100) THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'Percentage discount must be between 0 and 100';
  END IF;
  IF NEW.end_date < NEW.start_date THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'Discount end date cannot precede start date';
  END IF;
  IF NEW.rule_type = 'LOYALTY'
     AND COALESCE(NEW.tier, '') NOT IN ('BRONZE', 'SILVER', 'GOLD') THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'Loyalty rule requires a valid tier';
  END IF;
END$$

-- 5.7 Trigger: trg_rule_audit (AFTER UPDATE ON discount_rule)
DROP TRIGGER IF EXISTS trg_rule_audit$$
CREATE TRIGGER trg_rule_audit
AFTER UPDATE ON discount_rule
FOR EACH ROW
BEGIN
  IF NOT (OLD.value <=> NEW.value) THEN
    INSERT INTO discount_rule_audit (
      rule_id, old_value, new_value, changed_by
    )
    VALUES (NEW.rule_id, OLD.value, NEW.value, USER());
  END IF;
END$$

-- 5.8 Trigger: trg_daily_sales_log (AFTER INSERT ON daily_sales_summary)
DROP TRIGGER IF EXISTS trg_daily_sales_log$$
CREATE TRIGGER trg_daily_sales_log
AFTER INSERT ON daily_sales_summary
FOR EACH ROW
BEGIN
  INSERT INTO daily_sales_log (summary_date, branch_id, total_orders, total_sales, logged_at)
  VALUES (NEW.summary_date, NEW.branch_id, NEW.total_orders, NEW.total_sales, NOW());
END$$

-- 5.9 Trigger: trg_employee_audit (AFTER UPDATE ON employee)
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

-- 5.10 Trigger: trg_security_alert (BEFORE UPDATE ON employee)
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

-- ==============================================================================
-- SECTION 6: SCHEDULED EVENTS
-- ==============================================================================

DELIMITER $$

-- 6.1 Event: ev_expire_discount_rules (Nightly deactivation of expired promotions)
DROP EVENT IF EXISTS ev_expire_discount_rules$$
CREATE EVENT ev_expire_discount_rules
ON SCHEDULE EVERY 1 DAY
STARTS (CURRENT_DATE + INTERVAL 1 DAY)
DO
BEGIN
  UPDATE discount_rule
  SET is_active = FALSE
  WHERE is_active = TRUE
    AND end_date < CURDATE();
END$$

-- 6.2 Event: ev_weekly_low_stock_scan (Weekly sweep creating unresolved alerts)
DROP EVENT IF EXISTS ev_weekly_low_stock_scan$$
CREATE EVENT ev_weekly_low_stock_scan
ON SCHEDULE EVERY 1 WEEK
DO
BEGIN
  INSERT INTO low_stock_alert (branch_id, product_id, quantity)
  SELECT i.branch_id, i.product_id, i.quantity FROM inventory i
  WHERE i.quantity <= i.reorder_level
    AND NOT EXISTS (
      SELECT 1 FROM low_stock_alert a
      WHERE a.branch_id = i.branch_id AND a.product_id = i.product_id AND a.resolved = FALSE
    );
END$$

-- 6.3 Event: ev_daily_sales_summary (Nightly aggregation at 01:00 AM)
DROP EVENT IF EXISTS ev_daily_sales_summary$$
CREATE EVENT ev_daily_sales_summary
ON SCHEDULE EVERY 1 DAY
STARTS (TIMESTAMP(CURDATE()) + INTERVAL 1 DAY + INTERVAL 1 HOUR)
DO
BEGIN
  INSERT INTO daily_sales_summary (summary_date, branch_id, total_orders, total_sales)
  SELECT 
    DATE(order_date),
    branch_id,
    COUNT(*),
    COALESCE(SUM(total_amount), 0.00)
  FROM sales_order
  WHERE status = 'COMPLETED'
    AND order_date >= CURDATE() - INTERVAL 1 DAY
    AND order_date < CURDATE()
  GROUP BY DATE(order_date), branch_id
  ON DUPLICATE KEY UPDATE 
    total_orders = VALUES(total_orders),
    total_sales  = VALUES(total_sales);
END$$

-- 6.4 Event: ev_monthly_log_purge (Monthly maintenance purging audit entries older than 12 months)
DROP EVENT IF EXISTS ev_monthly_log_purge$$
CREATE EVENT ev_monthly_log_purge
ON SCHEDULE EVERY 1 MONTH
STARTS (TIMESTAMP(CURDATE()) + INTERVAL 1 DAY + INTERVAL 2 HOUR)
DO
BEGIN
  DELETE FROM stock_audit_log 
  WHERE logged_at < NOW() - INTERVAL 12 MONTH;
END$$

-- 6.5 Event: ev_sales_daily_reconciliation (Nightly reconciliation at 23:59:00)
DROP EVENT IF EXISTS ev_sales_daily_reconciliation$$
CREATE EVENT ev_sales_daily_reconciliation
ON SCHEDULE EVERY 1 DAY 
STARTS (TIMESTAMP(CURDATE()) + INTERVAL 23 HOUR + INTERVAL 59 MINUTE)
DO
BEGIN
  INSERT INTO daily_sales_summary (summary_date, branch_id, total_orders, total_sales)
  SELECT 
    DATE(order_date) AS summary_date,
    branch_id,
    COUNT(order_id) AS total_orders,
    COALESCE(SUM(total_amount), 0.00) AS total_sales
  FROM sales_order
  WHERE status = 'COMPLETED'
    AND DATE(order_date) = CURDATE()
  GROUP BY DATE(order_date), branch_id
  ON DUPLICATE KEY UPDATE
    total_orders = VALUES(total_orders),
    total_sales  = VALUES(total_sales);
END$$

-- 6.6 Event: ev_sales_audit_cleanup (Monthly purge of sales audit records older than 24 months)
DROP EVENT IF EXISTS ev_sales_audit_cleanup$$
CREATE EVENT ev_sales_audit_cleanup
ON SCHEDULE EVERY 1 MONTH
STARTS (TIMESTAMP(CURDATE()) + INTERVAL 1 DAY + INTERVAL 2 HOUR)
DO
BEGIN
  DELETE FROM stock_audit_log 
  WHERE logged_at < NOW() - INTERVAL 24 MONTH 
    AND reason IN ('SALE', 'CANCEL');
END$$

DELIMITER ;

-- ==============================================================================
-- SECTION 7: RBAC ROLES & PERMISSIONS
-- ==============================================================================

CREATE ROLE IF NOT EXISTS 'cashier_role', 'manager_role', 'admin_role';

-- Cashier Grants (Least Privilege: Stored procedures and read-only views)
GRANT EXECUTE ON PROCEDURE sp_place_order TO 'cashier_role';
GRANT EXECUTE ON PROCEDURE sp_register_customer TO 'cashier_role';
GRANT EXECUTE ON PROCEDURE sp_get_login TO 'cashier_role';
GRANT SELECT ON v_masked_customer_directory TO 'cashier_role';
GRANT SELECT ON v_active_discounts TO 'cashier_role';

-- Manager Grants (Inherits Cashier permissions + Inventory & Reporting procedures/views)
GRANT 'cashier_role' TO 'manager_role';
GRANT EXECUTE ON PROCEDURE sp_transfer_stock TO 'manager_role';
GRANT EXECUTE ON PROCEDURE sp_receive_purchase TO 'manager_role';
GRANT SELECT ON v_low_stock TO 'manager_role';
GRANT SELECT ON v_daily_sales TO 'manager_role';
GRANT SELECT ON v_discount_impact TO 'manager_role';
GRANT SELECT ON v_supplier_performance TO 'manager_role';

-- Admin Grants (Full Database Administration)
GRANT ALL PRIVILEGES ON supermarket_db2.* TO 'admin_role' WITH GRANT OPTION;

FLUSH PRIVILEGES;

-- ==============================================================================
-- SECTION 8: ESSENTIAL REFERENCE & BASELINE SEED DATA
-- ==============================================================================

-- 8.1 Branches
INSERT IGNORE INTO `branch` (`branch_id`, `name`, `city`, `province`, `address`, `phone`, `is_active`) VALUES
  (1, 'Colombo Central Flagship', 'Colombo', 'Western', '100 Galle Road, Colombo 03', '0112345678', 1),
  (2, 'Kandy City Centre Outlet', 'Kandy', 'Central', '45 Dalada Veediya, Kandy', '0812345678', 1),
  (3, 'Galle Fort Coastal Branch', 'Galle', 'Southern', '12 Lighthouse Street, Galle', '0912345678', 1);

-- 8.2 Unit of Measure
INSERT IGNORE INTO `unit_of_measure` (`unit_id`, `code`, `display_name`, `is_active`) VALUES
  (1, 'PIECE', 'Piece / Unit', 1),
  (2, 'KG', 'Kilogram (kg)', 1),
  (3, 'LITER', 'Liter (L)', 1),
  (4, 'BOX', 'Box Pack', 1);

-- 8.3 Product Categories
INSERT IGNORE INTO `category` (`category_id`, `name`, `description`, `icon`, `parent_id`) VALUES
  (1, 'Fresh Produce', 'Organic vegetables and fresh fruits', 'nutrition', NULL),
  (2, 'Grains & Rice', 'Premium quality rice varieties and pulses', 'grain', NULL),
  (3, 'Dairy & Eggs', 'Fresh farm milk, cheese, and farm eggs', 'egg_alt', NULL),
  (4, 'Beverages', 'Ceylon tea, coffee, and fresh juices', 'local_cafe', NULL),
  (5, 'Bakery & Snacks', 'Fresh bread, artisanal pastries, and biscuits', 'bakery_dining', NULL);

-- 8.4 Suppliers
INSERT IGNORE INTO `supplier` (`supplier_id`, `name`, `contact_person`, `phone`, `email`, `city`, `status`, `is_active`) VALUES
  (1, 'Lanka Fresh Organics Ltd', 'Sunil Bandara', '077-1234567', 'orders@lankafresh.lk', 'Colombo', 'ACTIVE', 1),
  (2, 'Ceylon Agro Grain Mills', 'Anura Jayasuriya', '071-2345678', 'sales@ceylonagro.lk', 'Kurunegala', 'ACTIVE', 1),
  (3, 'Highland Dairy Farms', 'Priya Fernando', '072-3456789', 'supplies@highlanddairy.lk', 'Nuwara Eliya', 'ACTIVE', 1);

-- 8.5 Standard Product Catalog
INSERT IGNORE INTO `product` (`product_id`, `category_id`, `supplier_id`, `sku`, `name`, `unit_price`, `cost_price`, `diet_type`, `unit_of_measure`, `min_order_qty`, `is_active`) VALUES
  (1, 1, 1, 'PRD-AVO-001', 'Fresh Hass Avocados (1kg)',  5.99,  3.50, 'VEG', 'KG',    1.00, 1),
  (2, 2, 1, 'PRD-RIC-002', 'Keeri Samba Rice (5kg)',    14.50, 10.00, 'VEG', 'KG',    1.00, 1),
  (3, 3, 2, 'PRD-MLK-003', 'Fresh Pasturised Milk 1L',   5.60,  3.80, 'VEG', 'LITER', 1.00, 1),
  (4, 4, 3, 'PRD-TEA-004', 'Ceylon Orange Pekoe Tea',    4000.00, 2800.00, 'VEG', 'BOX',   1.00, 1),
  (5, 5, 1, 'PRD-BRD-005', 'Whole Wheat Sourdough Bread', 3.40,  1.90, 'VEG', 'PIECE', 1.00, 1),
  (6, 1, 1, 'PRD-BAN-006', 'Organic Cavendish Bananas',  2.50,  1.20, 'VEG', 'KG',    1.00, 1);

-- 8.6 Initial Inventory Levels
INSERT IGNORE INTO `inventory` (`branch_id`, `product_id`, `quantity`, `reorder_level`) VALUES
  (1, 1, 45, 10),
  (1, 2, 80, 20),
  (1, 3, 60, 15),
  (1, 4, 90, 20),
  (1, 5, 30, 10),
  (1, 6, 75, 15);

-- 8.7 System Staff & Administration (BCrypt hash for 'Password123!')
INSERT IGNORE INTO `employee` (`employee_id`, `branch_id`, `role_id`, `full_name`, `username`, `password_hash`, `is_active`) VALUES
  (1, 1, 1, 'System Administrator', 'admin', '$2a$10$vI8aWBnW3fID.ZQ4/zo1G.q1lR5.J5F1qT7wX4q6vHhQ9EaYmZc6S', 1),
  (2, 1, 2, 'Arlene McCoy', 'manager1', '$2a$10$vI8aWBnW3fID.ZQ4/zo1G.q1lR5.J5F1qT7wX4q6vHhQ9EaYmZc6S', 1),
  (3, 1, 3, 'Nimal Perera', 'nimal_cashier', '$2a$10$vI8aWBnW3fID.ZQ4/zo1G.q1lR5.J5F1qT7wX4q6vHhQ9EaYmZc6S', 1);

-- 8.8 Promotional & Loyalty Discount Rules
INSERT INTO `discount_rule` (`rule_id`, `name`, `rule_type`, `kind`, `value`, `min_order_amount`, `max_discount`, `tier`, `start_date`, `end_date`, `priority`, `stackable`, `is_active`) VALUES
  (1,  'WELCOME 10',                      'FIRST_PURCHASE', 'PERCENT', 10.00, 0.00,    NULL,   NULL,     '2020-01-01', '2030-12-31', 10, 1, 1),
  (2,  'Special Holiday Promotion',       'HOLIDAY',        'PERCENT', 10.00, 0.00,    NULL,   NULL,     '2020-01-01', '2030-12-31', 30, 1, 1),
  (4,  'New Year Festive Coupon Voucher', 'COUPON',         'FIXED',   10.00, 30.00,   10.00,  NULL,     '2020-01-01', '2030-12-31',  5, 0, 1),
  (20, 'Silver Tier 5% Loyalty Discount', 'LOYALTY',        'PERCENT',  5.00, 500.00,  50.00,  'SILVER', '2020-01-01', '2030-12-31', 20, 1, 1),
  (21, 'Gold Tier 7% Loyalty Discount',   'LOYALTY',        'PERCENT',  7.00, 1000.00, 100.00, 'GOLD',   '2020-01-01', '2030-12-31', 21, 1, 1)
ON DUPLICATE KEY UPDATE
  `name` = VALUES(`name`),
  `value` = VALUES(`value`),
  `min_order_amount` = VALUES(`min_order_amount`),
  `max_discount` = VALUES(`max_discount`),
  `tier` = VALUES(`tier`),
  `is_active` = VALUES(`is_active`);

-- 8.9 Standard Promotional Coupons
INSERT IGNORE INTO `coupon` (`code`, `rule_id`, `max_uses`, `used_count`, `expires_on`) VALUES
  ('WEL10', 1, 1000, 0, '2030-12-31'),
  ('NEWYEAR50', 4, 500, 0, '2030-12-31');

-- 8.10 Calendar Holidays
INSERT IGNORE INTO `holiday` (`holiday_date`, `name`) VALUES
  ('2026-01-01', 'New Year Day'),
  ('2026-04-14', 'Sinhala and Tamil New Year'),
  ('2026-05-01', 'May Day'),
  ('2026-12-25', 'Christmas Day'),
  (CURRENT_DATE, 'Today Special Supermarket Promotion');

-- ==============================================================================
-- COMPLETION VERIFICATION
-- ==============================================================================
SELECT 'supermarket_db2 master database objects and reference seed data deployed successfully!' AS status;
