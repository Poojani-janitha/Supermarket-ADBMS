-- ============================================================================
-- SUPERMARKET CHAIN MANAGEMENT SYSTEM (ICT3222 ADBMS)
-- MEMBER 1 VIVA DEMONSTRATION SCRIPT (3 Minutes)
-- Topic: Pessimistic Row-Level Locking (SELECT ... FOR UPDATE) & ACID Rollback
-- ============================================================================

-- ----------------------------------------------------------------------------
-- STEP 0: SETUP (Run once before the examiner watches)
-- Ensure Product 2 (Keeri Samba Rice) has exactly 1 unit left in Branch 1.
-- ----------------------------------------------------------------------------
USE supermarket_db;

UPDATE inventory 
SET quantity = 1 
WHERE branch_id = 1 AND product_id = 2;

-- Confirm starting stock is exactly 1
SELECT b.name AS branch, p.name AS product, i.quantity AS available_stock
FROM inventory i
JOIN branch b ON b.branch_id = i.branch_id
JOIN product p ON p.product_id = i.product_id
WHERE i.branch_id = 1 AND i.product_id = 2;


-- ----------------------------------------------------------------------------
-- STEP 1: OPEN TWO SEPARATE MYSQL WORKBENCH QUERY TABS (SESSION 1 & SESSION 2)
-- ----------------------------------------------------------------------------

/*
------------------------------------
SESSION 1 (Cashier 1 - Left Window):
------------------------------------
Run lines below in Session 1.
Cashier 1 starts checking out the ONLY remaining unit.
*/

START TRANSACTION;

-- Session 1 acquires exclusive row lock (FOR UPDATE) via trigger/procedure:
SELECT quantity 
FROM inventory 
WHERE branch_id = 1 AND product_id = 2 
FOR UPDATE;

-- Notice: Session 1 holds the lock! (DO NOT RUN COMMIT YET!)


/*
-------------------------------------
SESSION 2 (Cashier 2 - Right Window):
-------------------------------------
While Session 1 is still open, attempt to place an order for the same product in Session 2:
*/

-- Run this in Session 2:
CALL sp_place_order(
  1, 2, 3, 'CASH', NULL,
  '[{"productId": 2, "qty": 1}]',
  @session2_order_id
);

-- EXAMINER OBSERVATION POINT #1:
-- Point to Session 2 spinning/waiting! 
-- Explain: "Session 2 is blocked because trg_orderitem_check_stock issued
-- SELECT ... FOR UPDATE on (branch 1, product 2). InnoDB holds an exclusive
-- X-lock for Session 1, preventing race condition and overselling."


/*
------------------------------------
SESSION 1 (Back to Left Window):
------------------------------------
Now complete Cashier 1's purchase:
*/

-- Deduct the unit and commit:
UPDATE inventory SET quantity = quantity - 1 WHERE branch_id = 1 AND product_id = 2;
INSERT INTO stock_audit_log (branch_id, product_id, change_qty, reason)
VALUES (1, 2, -1, 'SALE');
COMMIT;

-- EXAMINER OBSERVATION POINT #2:
-- Immediately look back at Session 2:
-- As soon as Session 1 commits, Session 2 unblocks immediately and throws:
-- "Error Code: 1644. Insufficient stock (SQLSTATE 45000)"
-- All changes in Session 2 rolled back automatically via DECLARE EXIT HANDLER.


-- ----------------------------------------------------------------------------
-- STEP 2: VERIFICATION & PROOF
-- ----------------------------------------------------------------------------
SELECT b.name AS branch, p.name AS product, i.quantity AS final_stock
FROM inventory i
JOIN branch b ON b.branch_id = i.branch_id
JOIN product p ON p.product_id = i.product_id
WHERE i.branch_id = 1 AND i.product_id = 2;

-- Result: Stock is cleanly 0. It never went negative (-1)!
