-- ============================================================================
-- SUPERMARKET CHAIN MANAGEMENT SYSTEM
-- ICT3222 Advanced Database Management Systems (ADBMS)
-- Script 05: Sales Stored Procedures (Member 1 Primary Ownership)
-- Engine: MySQL 8.0 (InnoDB)
-- ============================================================================

USE supermarket_db;

DELIMITER $$

-- ============================================================================
-- MEMBER 1 STORED PROCEDURE 1: Atomic POS Order Placement with Locking
-- Rubric Focus: ACID transaction, JSON_TABLE, FOR UPDATE, Deadlock Avoidance
-- ============================================================================
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
  -- Prevents race conditions on first-purchase discount rules between parallel checkouts
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
  -- CRITICAL CONCURRENCY RULE: ORDER BY j.product_id ASC ensures all parallel sessions
  -- acquire row locks in the exact same order, completely eliminating cross-order deadlocks.
  -- Triggers trg_orderitem_check_stock and trg_orderitem_reduce_stock fire during this INSERT.
  INSERT INTO order_item (order_id, product_id, quantity, unit_price)
  SELECT p_order_id, j.product_id, j.qty, p.unit_price
  FROM JSON_TABLE(p_items, '$[*]' COLUMNS (
    product_id INT PATH '$.productId',
    qty        INT PATH '$.qty'
  )) j
  JOIN product p ON p.product_id = j.product_id
  ORDER BY j.product_id ASC;

  -- 4. Apply dynamic promotional rules (invokes Member 3's cursor procedure)
  CALL sp_apply_discounts(p_order_id, p_coupon);

  -- 5. Record final payment transaction with net total
  INSERT INTO payment (order_id, method, amount)
  SELECT p_order_id, p_method, total_amount 
  FROM sales_order 
  WHERE order_id = p_order_id;

  COMMIT;
END$$

-- ============================================================================
-- MEMBER 1 STORED PROCEDURE 2: Order Cancellation & Inventory Restoration
-- Rubric Focus: Multi-table transactional rollback & stock integrity restoration
-- ============================================================================
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
  SET i.quantity = i.quantity + oi.quantity;

  -- 2. Audit log entry for stock replenishment due to order cancellation
  INSERT INTO stock_audit_log (branch_id, product_id, change_qty, reason, ref_order_id)
  SELECT o.branch_id, oi.product_id, oi.quantity, 'CANCEL', p_order_id
  FROM order_item oi
  JOIN sales_order o ON o.order_id = oi.order_id
  WHERE o.order_id = p_order_id;

  -- 3. Mark sales order header as CANCELLED
  UPDATE sales_order 
  SET status = 'CANCELLED' 
  WHERE order_id = p_order_id;

  COMMIT;
END$$

DELIMITER ;
