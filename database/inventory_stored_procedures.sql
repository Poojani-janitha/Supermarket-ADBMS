-- ============================================================================
-- SUPERMARKET CHAIN MANAGEMENT SYSTEM (ICT3222 ADBMS)
-- MEMBER 2: INVENTORY & SUPPLY CHAIN MODULE
-- Objects: 4 Stored Procedures, 1 Trigger, 1 Function, 1 View, 1 Event
-- ============================================================================

USE supermarket_db;

DELIMITER $$

-- ----------------------------------------------------------------------------
-- 1. PROCEDURE: sp_create_purchase_order
-- Staff initiates a supplier purchase order (Status: REQUESTED)
-- ----------------------------------------------------------------------------
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

-- ----------------------------------------------------------------------------
-- 2. PROCEDURE: sp_supplier_confirm_order
-- Vendor B2B Portal: Supplier confirms order, adjusts quantity, and adds notes
-- ----------------------------------------------------------------------------
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

-- ----------------------------------------------------------------------------
-- 3. PROCEDURE: sp_receive_purchase
-- Physical GRN Delivery: Inspect goods, atomically restock inventory, bump version
-- ----------------------------------------------------------------------------
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

  -- Atomic stock increment with optimistic locking version update
  INSERT INTO inventory (branch_id, product_id, quantity, version)
  VALUES (v_branch, v_prod, p_received_qty, 0)
  ON DUPLICATE KEY UPDATE 
    quantity = quantity + p_received_qty, 
    version = version + 1;

  -- Resolve low stock alert if any
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

-- ----------------------------------------------------------------------------
-- 4. PROCEDURE: sp_transfer_stock
-- ACID Inter-branch transfer with pessimistic locking and rollback check
-- ----------------------------------------------------------------------------
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
  -- Lock source row
  SELECT quantity INTO v_current FROM inventory
  WHERE branch_id = p_from_branch AND product_id = p_product FOR UPDATE;

  -- Check sufficient stock
  IF v_current IS NULL OR v_current < p_qty THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Insufficient stock at source branch';
  END IF;

  -- Deduct from source and bump version
  UPDATE inventory 
  SET quantity = quantity - p_qty, 
      version = version + 1
  WHERE branch_id = p_from_branch AND product_id = p_product;

  -- Increment target and bump version
  INSERT INTO inventory (branch_id, product_id, quantity, version)
  VALUES (p_to_branch, p_product, p_qty, 0)
  ON DUPLICATE KEY UPDATE 
    quantity = quantity + p_qty, 
    version = version + 1;

  -- Audit log double entries
  INSERT INTO stock_audit_log (branch_id, product_id, change_qty, reason)
  VALUES (p_from_branch, p_product, -p_qty, 'TRANSFER_OUT'),
         (p_to_branch, p_product, p_qty, 'TRANSFER_IN');
  COMMIT;
END$$



