-- ============================================================================
-- SUPERMARKET CHAIN MANAGEMENT SYSTEM
-- ICT3222 Advanced Database Management Systems (ADBMS)
-- Script 02: Member 1 Secondary & Covering Indexes (Sales Optimization)
-- Engine: MySQL 8.0 (InnoDB)
-- ============================================================================

USE supermarket_db;

-- ----------------------------------------------------------------------------
-- 1. MEMBER 1 INDEXES: Sales & Order Lookup Optimization
-- ----------------------------------------------------------------------------

-- Fast chronological order lookup for date-range queries
CREATE INDEX idx_order_date ON sales_order (order_date);

-- Composite covering index for branch sales and date-range reporting
-- Optimizes: WHERE branch_id = ? AND order_date BETWEEN ? AND ?
CREATE INDEX idx_order_branch_date ON sales_order (branch_id, order_date);

-- Customer order history inspection lookup
CREATE INDEX idx_order_customer ON sales_order (customer_id);

-- Reverse foreign key lookup for line items by product
CREATE INDEX idx_order_item_prod ON order_item (product_id);

-- Payment lookup optimization by sales order reference
CREATE INDEX idx_payment_order ON payment (order_id);

-- ----------------------------------------------------------------------------
-- 2. AUDIT LOG PERFORMANCE INDEX
-- ----------------------------------------------------------------------------

-- Rapid temporal lookup for stock audit history
CREATE INDEX idx_stock_audit_logged ON stock_audit_log (logged_at);

-- ----------------------------------------------------------------------------
-- 3. CATALOG & PRODUCT LOOKUP INDEXES
-- ----------------------------------------------------------------------------

-- Standard B-Tree product name index for alphabetical catalog sorting
CREATE INDEX idx_product_name ON product (name);

-- MySQL 8 FULLTEXT index for high-speed keyword search
CREATE FULLTEXT INDEX idx_product_ft ON product (name);
