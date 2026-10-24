-- ============================================================================
-- SUPERMARKET CHAIN MANAGEMENT SYSTEM
-- ICT3222 Advanced Database Management Systems (ADBMS)
-- Script 01: Core Database Schema & Tables
-- Engine: MySQL 8.0 (InnoDB)
-- ============================================================================

DROP DATABASE IF EXISTS supermarket_db;
CREATE DATABASE supermarket_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE supermarket_db;

-- ----------------------------------------------------------------------------
-- 1. BRANCH
-- Supermarket branch outlets.
-- ----------------------------------------------------------------------------
CREATE TABLE branch (
  branch_id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  city VARCHAR(50) NOT NULL,
  province VARCHAR(50) NOT NULL,
  address VARCHAR(255) NOT NULL,
  phone VARCHAR(20) NOT NULL UNIQUE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE
) ENGINE=InnoDB;

-- ----------------------------------------------------------------------------
-- 2. CATEGORY
-- Product categories hierarchy.
-- ----------------------------------------------------------------------------
CREATE TABLE category (
  category_id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(80) NOT NULL UNIQUE,
  description VARCHAR(255) NULL,
  icon VARCHAR(50) NULL DEFAULT 'category',
  parent_id INT NULL,
  FOREIGN KEY (parent_id) REFERENCES category(category_id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ----------------------------------------------------------------------------
-- 3. SUPPLIER
-- Wholesale vendors supplying stock.
-- ----------------------------------------------------------------------------
CREATE TABLE supplier (
  supplier_id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  contact_person VARCHAR(100) NULL,
  phone VARCHAR(20) NOT NULL,
  email VARCHAR(100) NULL,
  city VARCHAR(50) NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE
) ENGINE=InnoDB;

-- ----------------------------------------------------------------------------
-- 4. EMPLOYEE
-- Staff users with role-based access (ADMIN, MANAGER, CASHIER).
-- ----------------------------------------------------------------------------
-- ----------------------------------------------------------------------------
-- 3b. ROLES
-- Role-based access control table for administrative and staff permission assignments.
-- ----------------------------------------------------------------------------
CREATE TABLE roles (
  role_id INT AUTO_INCREMENT PRIMARY KEY,
  role_name VARCHAR(50) NOT NULL UNIQUE,
  description VARCHAR(255) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE employee (
  employee_id INT AUTO_INCREMENT PRIMARY KEY,
  branch_id INT NOT NULL,
  full_name VARCHAR(120) NOT NULL,
  role_id INT NOT NULL,
  username VARCHAR(50) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  hire_date DATE NOT NULL DEFAULT (CURRENT_DATE),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  FOREIGN KEY (branch_id) REFERENCES branch(branch_id),
  FOREIGN KEY (role_id) REFERENCES roles(role_id)
) ENGINE=InnoDB;

-- ----------------------------------------------------------------------------
-- 5. CUSTOMER
-- Shoppers participating in loyalty discounts.
-- ----------------------------------------------------------------------------
CREATE TABLE customer (
  customer_id INT AUTO_INCREMENT PRIMARY KEY,
  full_name VARCHAR(120) NOT NULL,
  phone VARCHAR(20) NOT NULL UNIQUE,
  email VARCHAR(100) NULL,
  loyalty_points INT NOT NULL DEFAULT 0 CHECK (loyalty_points >= 0),
  registered_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ----------------------------------------------------------------------------
-- 6. PRODUCT
-- Product catalog items.
-- ----------------------------------------------------------------------------
CREATE TABLE product (
  product_id INT AUTO_INCREMENT PRIMARY KEY,
  category_id INT NOT NULL,
  supplier_id INT NOT NULL,
  sku VARCHAR(30) NOT NULL UNIQUE,
  name VARCHAR(150) NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL CHECK (unit_price >= 0),
  cost_price DECIMAL(10,2) NOT NULL CHECK (cost_price >= 0),
  image_url VARCHAR(255) NULL,
  diet_type ENUM('VEG', 'NON_VEG') NULL DEFAULT 'VEG',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  FOREIGN KEY (category_id) REFERENCES category(category_id),
  FOREIGN KEY (supplier_id) REFERENCES supplier(supplier_id)
) ENGINE=InnoDB;

-- ----------------------------------------------------------------------------
-- 7. INVENTORY (Member 2)
-- Branch stock levels. Clustered composite PK (branch_id, product_id).
-- Version column supports optimistic locking.
-- ----------------------------------------------------------------------------
CREATE TABLE inventory (
  branch_id INT NOT NULL,
  product_id INT NOT NULL,
  quantity INT NOT NULL DEFAULT 0 CHECK (quantity >= 0),
  reorder_level INT NOT NULL DEFAULT 10 CHECK (reorder_level >= 0),
  version INT NOT NULL DEFAULT 0,
  PRIMARY KEY (branch_id, product_id),
  FOREIGN KEY (branch_id) REFERENCES branch(branch_id),
  FOREIGN KEY (product_id) REFERENCES product(product_id)
) ENGINE=InnoDB;

-- ----------------------------------------------------------------------------
-- 8. SALES_ORDER (Member 1)
-- Checkout transactions.
-- ----------------------------------------------------------------------------
CREATE TABLE sales_order (
  order_id INT AUTO_INCREMENT PRIMARY KEY,
  branch_id INT NOT NULL,
  customer_id INT NULL,
  employee_id INT NOT NULL,
  order_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  status ENUM('COMPLETED', 'CANCELLED') NOT NULL DEFAULT 'COMPLETED',
  subtotal DECIMAL(12,2) NOT NULL DEFAULT 0.00 CHECK (subtotal >= 0),
  discount_total DECIMAL(12,2) NOT NULL DEFAULT 0.00 CHECK (discount_total >= 0),
  total_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00 CHECK (total_amount >= 0),
  FOREIGN KEY (branch_id) REFERENCES branch(branch_id),
  FOREIGN KEY (customer_id) REFERENCES customer(customer_id),
  FOREIGN KEY (employee_id) REFERENCES employee(employee_id)
) ENGINE=InnoDB;

-- ----------------------------------------------------------------------------
-- 9. ORDER_ITEM (Member 1)
-- Clustered composite PK (order_id, product_id) enables single sequential range scans.
-- line_total is a STORED generated column.
-- ----------------------------------------------------------------------------
CREATE TABLE order_item (
  order_id INT NOT NULL,
  product_id INT NOT NULL,
  quantity INT NOT NULL CHECK (quantity > 0),
  unit_price DECIMAL(10,2) NOT NULL CHECK (unit_price >= 0),
  line_total DECIMAL(12,2) AS (quantity * unit_price) STORED,
  PRIMARY KEY (order_id, product_id),
  FOREIGN KEY (order_id) REFERENCES sales_order(order_id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES product(product_id)
) ENGINE=InnoDB;

-- ----------------------------------------------------------------------------
-- 10. PAYMENT (Member 1)
-- Payment records for orders.
-- ----------------------------------------------------------------------------
CREATE TABLE payment (
  payment_id INT AUTO_INCREMENT PRIMARY KEY,
  order_id INT NOT NULL,
  method ENUM('CASH', 'CARD', 'QR', 'ONLINE') NOT NULL,
  amount DECIMAL(12,2) NOT NULL CHECK (amount >= 0),
  paid_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES sales_order(order_id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ----------------------------------------------------------------------------
-- 11. PURCHASE_ORDER (Member 2)
-- ----------------------------------------------------------------------------
CREATE TABLE purchase_order (
  po_id INT AUTO_INCREMENT PRIMARY KEY,
  supplier_id INT NOT NULL,
  branch_id INT NOT NULL,
  order_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  status ENUM('PENDING', 'RECEIVED', 'CANCELLED') NOT NULL DEFAULT 'PENDING',
  total_cost DECIMAL(12,2) NOT NULL DEFAULT 0.00 CHECK (total_cost >= 0),
  FOREIGN KEY (supplier_id) REFERENCES supplier(supplier_id),
  FOREIGN KEY (branch_id) REFERENCES branch(branch_id)
) ENGINE=InnoDB;

-- ----------------------------------------------------------------------------
-- 12. PURCHASE_ORDER_ITEM (Member 2)
-- ----------------------------------------------------------------------------
CREATE TABLE purchase_order_item (
  po_id INT NOT NULL,
  product_id INT NOT NULL,
  quantity INT NOT NULL CHECK (quantity > 0),
  unit_cost DECIMAL(10,2) NOT NULL CHECK (unit_cost >= 0),
  line_cost DECIMAL(12,2) AS (quantity * unit_cost) STORED,
  PRIMARY KEY (po_id, product_id),
  FOREIGN KEY (po_id) REFERENCES purchase_order(po_id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES product(product_id)
) ENGINE=InnoDB;

-- ----------------------------------------------------------------------------
-- 13. HOLIDAY (Member 3)
-- ----------------------------------------------------------------------------
CREATE TABLE holiday (
  holiday_date DATE PRIMARY KEY,
  name VARCHAR(100) NOT NULL
) ENGINE=InnoDB;

-- ----------------------------------------------------------------------------
-- 14. DISCOUNT_RULE (Member 3)
-- ----------------------------------------------------------------------------
CREATE TABLE discount_rule (
  rule_id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  rule_type ENUM('FIRST_PURCHASE', 'HOLIDAY', 'LOYALTY', 'COUPON') NOT NULL,
  kind ENUM('PERCENT', 'FIXED') NOT NULL,
  value DECIMAL(10,2) NOT NULL CHECK (value > 0),
  min_order_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00 CHECK (min_order_amount >= 0),
  max_discount DECIMAL(12,2) NULL CHECK (max_discount IS NULL OR max_discount > 0),
  tier VARCHAR(10) NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  priority INT NOT NULL DEFAULT 100,
  stackable BOOLEAN NOT NULL DEFAULT TRUE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  CHECK (end_date >= start_date)
) ENGINE=InnoDB;

-- ----------------------------------------------------------------------------
-- 15. COUPON (Member 3)
-- ----------------------------------------------------------------------------
CREATE TABLE coupon (
  code VARCHAR(20) PRIMARY KEY,
  rule_id INT NOT NULL,
  max_uses INT NOT NULL DEFAULT 1 CHECK (max_uses > 0),
  used_count INT NOT NULL DEFAULT 0 CHECK (used_count >= 0),
  expires_on DATE NOT NULL,
  FOREIGN KEY (rule_id) REFERENCES discount_rule(rule_id)
) ENGINE=InnoDB;

-- ----------------------------------------------------------------------------
-- 16. ORDER_DISCOUNT (Member 3)
-- ----------------------------------------------------------------------------
CREATE TABLE order_discount (
  order_id INT NOT NULL,
  rule_id INT NOT NULL,
  amount DECIMAL(12,2) NOT NULL CHECK (amount > 0),
  PRIMARY KEY (order_id, rule_id),
  FOREIGN KEY (order_id) REFERENCES sales_order(order_id) ON DELETE CASCADE,
  FOREIGN KEY (rule_id) REFERENCES discount_rule(rule_id)
) ENGINE=InnoDB;

-- ----------------------------------------------------------------------------
-- 17. PRICE_AUDIT_LOG (Member 3)
-- ----------------------------------------------------------------------------
CREATE TABLE price_audit_log (
  log_id INT AUTO_INCREMENT PRIMARY KEY,
  product_id INT NOT NULL,
  old_price DECIMAL(10,2) NOT NULL,
  new_price DECIMAL(10,2) NOT NULL,
  changed_by VARCHAR(100) NOT NULL,
  changed_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES product(product_id)
) ENGINE=InnoDB;

-- ----------------------------------------------------------------------------
-- 18. STOCK_AUDIT_LOG
-- Partitionable audit trail for inventory movements.
-- ----------------------------------------------------------------------------
CREATE TABLE stock_audit_log (
  log_id INT AUTO_INCREMENT PRIMARY KEY,
  branch_id INT NOT NULL,
  product_id INT NOT NULL,
  change_qty INT NOT NULL,
  reason ENUM('SALE', 'RESTOCK', 'CANCEL', 'TRANSFER_IN', 'TRANSFER_OUT', 'ADJUSTMENT') NOT NULL,
  ref_order_id INT NULL,
  logged_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (branch_id) REFERENCES branch(branch_id),
  FOREIGN KEY (product_id) REFERENCES product(product_id)
) ENGINE=InnoDB;

-- ----------------------------------------------------------------------------
-- 19. LOW_STOCK_ALERT (Member 2)
-- ----------------------------------------------------------------------------
CREATE TABLE low_stock_alert (
  alert_id INT AUTO_INCREMENT PRIMARY KEY,
  branch_id INT NOT NULL,
  product_id INT NOT NULL,
  quantity INT NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  resolved BOOLEAN NOT NULL DEFAULT FALSE,
  FOREIGN KEY (branch_id) REFERENCES branch(branch_id),
  FOREIGN KEY (product_id) REFERENCES product(product_id)
) ENGINE=InnoDB;

-- ----------------------------------------------------------------------------
-- 20. DAILY_SALES_SUMMARY (Member 4)
-- ----------------------------------------------------------------------------
CREATE TABLE daily_sales_summary (
  summary_date DATE NOT NULL,
  branch_id INT NOT NULL,
  total_orders INT NOT NULL DEFAULT 0 CHECK (total_orders >= 0),
  total_sales DECIMAL(14,2) NOT NULL DEFAULT 0.00 CHECK (total_sales >= 0),
  PRIMARY KEY (summary_date, branch_id),
  FOREIGN KEY (branch_id) REFERENCES branch(branch_id)
) ENGINE=InnoDB;

-- ----------------------------------------------------------------------------
-- 21. DISCOUNT_RULE_AUDIT (Member 3)
-- ----------------------------------------------------------------------------
CREATE TABLE discount_rule_audit (
  log_id INT AUTO_INCREMENT PRIMARY KEY,
  rule_id INT NOT NULL,
  old_value DECIMAL(10,2) NULL,
  new_value DECIMAL(10,2) NULL,
  changed_by VARCHAR(100) NOT NULL,
  changed_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ----------------------------------------------------------------------------
-- 22. EMPLOYEE_AUDIT_LOG (Member 5)
-- ----------------------------------------------------------------------------
CREATE TABLE employee_audit_log (
  log_id INT AUTO_INCREMENT PRIMARY KEY,
  employee_id INT NOT NULL,
  old_role VARCHAR(20) NULL,
  new_role VARCHAR(20) NULL,
  old_branch_id INT NULL,
  new_branch_id INT NULL,
  is_active_changed BOOLEAN NOT NULL DEFAULT FALSE,
  changed_by VARCHAR(100) NOT NULL,
  changed_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ----------------------------------------------------------------------------
-- 23. SECURITY_EVENT_LOG (Member 5)
-- ----------------------------------------------------------------------------
CREATE TABLE security_event_log (
  log_id INT AUTO_INCREMENT PRIMARY KEY,
  event_type VARCHAR(50) NOT NULL,
  details TEXT NULL,
  performed_by VARCHAR(100) NOT NULL,
  logged_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;
