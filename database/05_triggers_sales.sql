-- ============================================================================
-- SUPERMARKET CHAIN MANAGEMENT SYSTEM
-- ICT3222 Advanced Database Management Systems (ADBMS)
-- Script 05: Member 1 Database Triggers (Sales & Concurrency Ownership)
-- Engine: MySQL 8.0 (InnoDB)
-- ============================================================================

USE supermarket_db;

DELIMITER $$

-- ============================================================================
-- MEMBER 1 TRIGGER 1: Stock Validation with Row-Level Pessimistic Lock
-- Timing: BEFORE INSERT ON order_item
-- Viva Highlight: Holds row-level lock (FOR UPDATE) until transaction completes
-- ============================================================================
DROP TRIGGER IF EXISTS trg_orderitem_check_stock$$
CREATE TRIGGER trg_orderitem_check_stock 
BEFORE INSERT ON order_item
FOR EACH ROW
BEGIN
  DECLARE v_branch INT;
  DECLARE v_qty    INT;

  -- Determine the branch outlet for the active order
  SELECT branch_id INTO v_branch 
  FROM sales_order 
  WHERE order_id = NEW.order_id;

  -- PESSIMISTIC LOCKING:
  -- Locks the specific inventory record (SELECT ... FOR UPDATE).
  -- Any concurrent checkout session attempting to touch this product row
  -- must wait until this transaction either commits or rolls back.
  SELECT quantity INTO v_qty 
  FROM inventory
  WHERE branch_id = v_branch AND product_id = NEW.product_id
  FOR UPDATE;

  -- Enforce stock availability constraint
  IF v_qty IS NULL OR v_qty < NEW.quantity THEN
    SIGNAL SQLSTATE '45000' 
      SET MESSAGE_TEXT = 'Insufficient stock';
  END IF;
END$$

-- ============================================================================
-- MEMBER 1 TRIGGER 2: Stock Deduction & Automated Audit Logging
-- Timing: AFTER INSERT ON order_item
-- Rubric Focus: Automatic consistency enforcement & immutable movement logging
-- ============================================================================
DROP TRIGGER IF EXISTS trg_orderitem_reduce_stock$$
CREATE TRIGGER trg_orderitem_reduce_stock 
AFTER INSERT ON order_item
FOR EACH ROW
BEGIN
  DECLARE v_branch INT;

  SELECT branch_id INTO v_branch 
  FROM sales_order 
  WHERE order_id = NEW.order_id;

  -- Deduct branch stock
  UPDATE inventory 
  SET quantity = quantity - NEW.quantity
  WHERE branch_id = v_branch AND product_id = NEW.product_id;

  -- Insert immutable stock audit trail entry
  INSERT INTO stock_audit_log (branch_id, product_id, change_qty, reason, ref_order_id)
  VALUES (v_branch, NEW.product_id, -NEW.quantity, 'SALE', NEW.order_id);
END$$

-- ============================================================================
-- SUPPORTING TRIGGER: Low-Stock Reorder Alert (Member 2)
-- Timing: AFTER UPDATE ON inventory
-- ============================================================================
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

-- ============================================================================
-- SUPPORTING TRIGGER: Promotional Discount Bounds Check (Member 3)
-- Timing: BEFORE INSERT ON discount_rule
-- ============================================================================
DROP TRIGGER IF EXISTS trg_rule_check$$
CREATE TRIGGER trg_rule_check 
BEFORE INSERT ON discount_rule
FOR EACH ROW
BEGIN
  IF NEW.kind = 'PERCENT' AND NEW.value > 100.00 THEN
    SIGNAL SQLSTATE '45000' 
      SET MESSAGE_TEXT = 'Percent discount cannot exceed 100';
  END IF;
END$$

DELIMITER ;
