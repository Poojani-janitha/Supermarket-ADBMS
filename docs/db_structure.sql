-- ============================================================================
-- SUPERMARKET CHAIN MANAGEMENT SYSTEM
-- Coursework: ICT3222 Advanced Database Management Systems (ADBMS)
-- Database Engine: MySQL 8.0 (InnoDB)
-- Character Set: utf8mb4, Collation: utf8mb4_unicode_ci
-- ============================================================================
-- NOTE ON DESIGN & ADBMS TOPICS:
-- 1. All tables use InnoDB for ACID transactions, row-level locks, and FKs.
-- 2. Clustered Primary Keys (PK) physically group contiguous records on disk:
--    - order_item(order_id, product_id): All lines of a sale are clustered together.
--    - inventory(branch_id, product_id): Stock per branch is clustered together.
--    - daily_sales_summary(summary_date, branch_id): Analytical date ranges are contiguous.
-- 3. Deliberate denormalization (documented for 3NF):
--    - order_item.unit_price captures the historical price at the moment of sale.
-- ============================================================================

DROP DATABASE IF EXISTS supermarket_db;
CREATE DATABASE supermarket_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE supermarket_db;

-- ----------------------------------------------------------------------------
-- 1. BRANCH
-- Represents physical supermarket branch outlets in the chain.
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
-- Product categorization tree (supports sub-categories via recursive parent_id).
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
-- Wholesale vendors supplying merchandise to the supermarket chain.
-- ----------------------------------------------------------------------------
CREATE TABLE supplier (
  supplier_id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  contact_person VARCHAR(100) NULL,
  phone VARCHAR(20) NOT NULL,
  email VARCHAR(100) NULL,
  username VARCHAR(50) NULL UNIQUE,
  password_hash VARCHAR(255) NULL,
  city VARCHAR(50) NOT NULL,
  tax_number VARCHAR(50) NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  status ENUM('PENDING_APPROVAL', 'ACTIVE', 'SUSPENDED') NOT NULL DEFAULT 'ACTIVE'
) ENGINE=InnoDB;

-- ----------------------------------------------------------------------------
-- 4. EMPLOYEE
-- System users with role-based access control (ADMIN, MANAGER, CASHIER).
-- ----------------------------------------------------------------------------
CREATE TABLE employee (
  employee_id INT AUTO_INCREMENT PRIMARY KEY,
  branch_id INT NOT NULL,
  full_name VARCHAR(120) NOT NULL,
  role ENUM('ADMIN', 'MANAGER', 'CASHIER') NOT NULL,
  username VARCHAR(50) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  hire_date DATE NOT NULL DEFAULT (CURRENT_DATE),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  FOREIGN KEY (branch_id) REFERENCES branch(branch_id)
) ENGINE=InnoDB;

-- ----------------------------------------------------------------------------
-- 5. CUSTOMER
-- Registered loyalty program shoppers.
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
-- Product catalog items. SKU has a UNIQUE secondary index.
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
  unit_of_measure VARCHAR(30) NOT NULL DEFAULT 'PIECE',
  min_order_qty DECIMAL(10,2) NOT NULL DEFAULT 1.00 CHECK (min_order_qty > 0),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  FOREIGN KEY (category_id) REFERENCES category(category_id),
  FOREIGN KEY (supplier_id) REFERENCES supplier(supplier_id)
) ENGINE=InnoDB;

-- ----------------------------------------------------------------------------
-- 7. INVENTORY
-- Per-branch physical stock levels.
-- Clustered composite PK (branch_id, product_id) stores branch items contiguously.
-- Version column supports optimistic locking. Quantity supports UoM decimals.
-- ----------------------------------------------------------------------------
CREATE TABLE inventory (
  branch_id INT NOT NULL,
  product_id INT NOT NULL,
  quantity DECIMAL(10,2) NOT NULL DEFAULT 0.00 CHECK (quantity >= 0),
  reorder_level DECIMAL(10,2) NOT NULL DEFAULT 10.00 CHECK (reorder_level >= 0),
  version INT NOT NULL DEFAULT 0,
  PRIMARY KEY (branch_id, product_id),
  FOREIGN KEY (branch_id) REFERENCES branch(branch_id),
  FOREIGN KEY (product_id) REFERENCES product(product_id)
) ENGINE=InnoDB;

-- ----------------------------------------------------------------------------
-- 8. SALES_ORDER
-- Customer checkout transactions.
-- total_amount = subtotal - discount_total (calculated inside sp_place_order).
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
-- 9. ORDER_ITEM
-- Individual items purchased in an order.
-- Clustered composite PK (order_id, product_id) enables single range reads for receipts.
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
-- 10. PAYMENT
-- Payment records associated with sales orders.
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
-- 11. PURCHASE_ORDER
-- Restock orders placed to suppliers.
-- ----------------------------------------------------------------------------
CREATE TABLE purchase_order (
  po_id INT AUTO_INCREMENT PRIMARY KEY,
  supplier_id INT NOT NULL,
  branch_id INT NOT NULL,
  requested_by INT NULL,
  received_by INT NULL,
  order_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  confirmed_at DATETIME NULL,
  received_at DATETIME NULL,
  status ENUM('REQUESTED', 'CONFIRMED', 'RECEIVED', 'CANCELLED') NOT NULL DEFAULT 'REQUESTED',
  total_cost DECIMAL(12,2) NOT NULL DEFAULT 0.00 CHECK (total_cost >= 0),
  supplier_notes TEXT NULL,
  receiving_notes TEXT NULL,
  FOREIGN KEY (supplier_id) REFERENCES supplier(supplier_id),
  FOREIGN KEY (branch_id) REFERENCES branch(branch_id),
  FOREIGN KEY (requested_by) REFERENCES employee(employee_id),
  FOREIGN KEY (received_by) REFERENCES employee(employee_id)
) ENGINE=InnoDB;

-- ----------------------------------------------------------------------------
-- 12. PURCHASE_ORDER_ITEM
-- Items requested in a purchase order with 3-way quantity matching.
-- ----------------------------------------------------------------------------
CREATE TABLE purchase_order_item (
  po_id INT NOT NULL,
  product_id INT NOT NULL,
  requested_qty DECIMAL(10,2) NOT NULL CHECK (requested_qty > 0),
  confirmed_qty DECIMAL(10,2) NULL CHECK (confirmed_qty IS NULL OR confirmed_qty >= 0),
  received_qty DECIMAL(10,2) NULL CHECK (received_qty IS NULL OR received_qty >= 0),
  unit_cost DECIMAL(10,2) NOT NULL CHECK (unit_cost >= 0),
  line_cost DECIMAL(12,2) AS (COALESCE(received_qty, confirmed_qty, requested_qty) * unit_cost) STORED,
  PRIMARY KEY (po_id, product_id),
  FOREIGN KEY (po_id) REFERENCES purchase_order(po_id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES product(product_id)
) ENGINE=InnoDB;

-- ----------------------------------------------------------------------------
-- 13. HOLIDAY
-- National and public holidays used by the discount engine (Member 3).
-- ----------------------------------------------------------------------------
CREATE TABLE holiday (
  holiday_date DATE PRIMARY KEY,
  name VARCHAR(100) NOT NULL
) ENGINE=InnoDB;

-- ----------------------------------------------------------------------------
-- 14. DISCOUNT_RULE
-- Promotional rules evaluated by Cursor in sp_apply_discounts.
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
-- 15. COUPON
-- Voucher codes tied to discount rules with expiration and usage limits.
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
-- 16. ORDER_DISCOUNT
-- Junction table recording which discounts applied to an order.
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
-- 17. PRICE_AUDIT_LOG
-- Immutable audit log populated exclusively by trg_product_price_audit.
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
-- Complete history of stock movements (SALE, RESTOCK, CANCEL, TRANSFER).
-- Target for RANGE Table Partitioning (Member 4 extra feature).
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
-- 19. LOW_STOCK_ALERT
-- Reorder alerts created by trg_inventory_low_stock and ev_weekly_low_stock_scan.
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
-- 20. DAILY_SALES_SUMMARY
-- Precomputed analytics aggregated nightly by ev_daily_sales_summary.
-- Clustered composite PK (summary_date, branch_id) for rapid date scans.
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
-- 21. DISCOUNT_RULE_AUDIT
-- Tracks changes to promotional discount rules (trg_rule_audit).
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
-- Immutable audit log populated by trg_employee_audit on role/branch changes.
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
-- Logs privileged actions like account deactivations and role reassignments.
-- ----------------------------------------------------------------------------
CREATE TABLE security_event_log (
  log_id INT AUTO_INCREMENT PRIMARY KEY,
  event_type VARCHAR(50) NOT NULL,
  details TEXT NULL,
  performed_by VARCHAR(100) NOT NULL,
  logged_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ============================================================================
-- SECONDARY & COVERING INDEXES
-- Designed for query execution optimization (EXPLAIN evidence with 50k rows)
-- ============================================================================

-- Fast lookup for orders by date
CREATE INDEX idx_order_date ON sales_order (order_date);

-- Composite covering index for branch monthly and date-range queries
CREATE INDEX idx_order_branch_date ON sales_order (branch_id, order_date);

-- Fast lookup of customer order history
CREATE INDEX idx_order_customer ON sales_order (customer_id);

-- Standard product name index for catalog browsing
CREATE INDEX idx_product_name ON product (name);

-- MySQL 8 FULLTEXT index for high-speed keyword search (Member 3 extra feature)
CREATE FULLTEXT INDEX idx_product_ft ON product (name);

-- Reverse lookup index for order lines by product
CREATE INDEX idx_order_item_prod ON order_item (product_id);

-- Rapid lookup for audit log date scans
CREATE INDEX idx_stock_audit_logged ON stock_audit_log (logged_at);
