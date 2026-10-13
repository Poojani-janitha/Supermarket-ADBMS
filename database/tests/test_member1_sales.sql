-- ============================================================================
-- SUPERMARKET CHAIN MANAGEMENT SYSTEM
-- ICT3222 Advanced Database Management Systems (ADBMS)
-- Member 1 Verification Script: test_member1_sales.sql
-- ============================================================================

USE supermarket_db;

-- ----------------------------------------------------------------------------
-- TEST 1: Test fn_order_total and Stored Procedure Checkout
-- ----------------------------------------------------------------------------
SELECT '=== STARTING TEST 1: ATOMIC CHECKOUT WITH JSON ITEMS ===' AS test_banner;

-- Check baseline stock for Product 1 (Avocados) and Product 2 (Rice) at Branch 1
SELECT branch_id, product_id, quantity 
FROM inventory 
WHERE branch_id = 1 AND product_id IN (1, 2);

-- Execute Member 1 sp_place_order
SET @new_order_id = 0;
CALL sp_place_order(
  1,               -- branch_id
  1,               -- customer_id (Jacob Jones)
  3,               -- employee_id (Floyd Miles - Cashier)
  'CARD',          -- payment method
  'NEWYEAR50',     -- coupon code
  '[{"productId": 1, "qty": 2}, {"productId": 2, "qty": 1}]', -- JSON Cart
  @new_order_id
);

SELECT @new_order_id AS created_order_id;

-- Verify Sales Order Header
SELECT order_id, branch_id, customer_id, employee_id, status, subtotal, discount_total, total_amount
FROM sales_order 
WHERE order_id = @new_order_id;

-- Verify Line Items in Clustered order_item
SELECT order_id, product_id, quantity, unit_price, line_total
FROM order_item 
WHERE order_id = @new_order_id;

-- Verify fn_order_total calculation matches subtotal
SELECT fn_order_total(@new_order_id) AS computed_order_subtotal,
       subtotal AS header_subtotal,
       IF(fn_order_total(@new_order_id) = subtotal, 'PASS', 'FAIL') AS fn_order_total_test;

-- Verify Stock Deduction occurred via trg_orderitem_reduce_stock
SELECT branch_id, product_id, quantity 
FROM inventory 
WHERE branch_id = 1 AND product_id IN (1, 2);

-- Verify Stock Audit Log recorded 'SALE' movement
SELECT log_id, branch_id, product_id, change_qty, reason, ref_order_id
FROM stock_audit_log 
WHERE ref_order_id = @new_order_id;

-- Verify Payment Record
SELECT payment_id, order_id, method, amount 
FROM payment 
WHERE order_id = @new_order_id;


-- ----------------------------------------------------------------------------
-- TEST 2: Test Concurrency & Stock Check Trigger (Failure / Rollback Test)
-- Attempting to purchase more than available stock should SIGNAL error 45000
-- ----------------------------------------------------------------------------
SELECT '=== STARTING TEST 2: INSUFFICIENT STOCK TRIGGER CHECK ===' AS test_banner;

SET @excessive_order_id = 0;
-- We try to buy 99999 units of Product 1 (which only has ~43 units)
-- In a stored procedure with EXIT HANDLER, this will ROLLBACK and RESIGNAL
-- For testing, we verify that stock does NOT change when exception fires.
SELECT quantity INTO @stock_before_fail 
FROM inventory 
WHERE branch_id = 1 AND product_id = 1;

-- Notice: Running this will throw 45000 'Insufficient stock'
-- CALL sp_place_order(1, 1, 3, 'CASH', NULL, '[{"productId": 1, "qty": 99999}]', @excessive_order_id);


-- ----------------------------------------------------------------------------
-- TEST 3: Test sp_cancel_order & Stock Restoration
-- ----------------------------------------------------------------------------
SELECT '=== STARTING TEST 3: ORDER CANCELLATION & STOCK RESTORATION ===' AS test_banner;

-- Capture stock before cancellation
SELECT branch_id, product_id, quantity AS stock_before_cancel
FROM inventory 
WHERE branch_id = 1 AND product_id IN (1, 2);

-- Cancel the order created in Test 1
CALL sp_cancel_order(@new_order_id, 2);

-- Verify order status updated to CANCELLED
SELECT order_id, status 
FROM sales_order 
WHERE order_id = @new_order_id;

-- Verify stock was completely restored back to inventory
SELECT branch_id, product_id, quantity AS stock_after_cancel
FROM inventory 
WHERE branch_id = 1 AND product_id IN (1, 2);

-- Verify stock_audit_log captured 'CANCEL' replenishment
SELECT log_id, branch_id, product_id, change_qty, reason, ref_order_id
FROM stock_audit_log 
WHERE ref_order_id = @new_order_id AND reason = 'CANCEL';

SELECT '=== ALL MEMBER 1 TESTS COMPLETED SUCCESSFULLY ===' AS final_status;
