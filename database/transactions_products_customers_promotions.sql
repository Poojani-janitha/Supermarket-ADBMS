USE supermarket_db;

-- Member 3 transaction and ACID evidence.
-- All writes should go through the stored procedures; this script verifies
-- their commit, rollback and locking behavior without ORM/JPA.

-- 1. Confirm the procedures expose transaction boundaries in their definition.
SELECT ROUTINE_NAME,
       ROUTINE_DEFINITION LIKE '%START TRANSACTION%' AS starts_transaction,
       ROUTINE_DEFINITION LIKE '%COMMIT%' AS commits_transaction,
       ROUTINE_DEFINITION LIKE '%ROLLBACK%' AS rolls_back_on_error
FROM information_schema.ROUTINES
WHERE ROUTINE_SCHEMA = DATABASE()
  AND ROUTINE_NAME IN (
    'sp_save_product',
    'sp_register_customer',
    'sp_save_discount_rule',
    'sp_save_coupon',
    'sp_save_holiday',
    'sp_apply_discounts'
  )
ORDER BY ROUTINE_NAME;

-- 2. Successful customer registration commits one new row.
SET @tx_phone = CONCAT('TX-', UNIX_TIMESTAMP());
CALL sp_register_customer(
  'Transaction Test Customer',
  @tx_phone,
  'transaction-test@example.com',
  @tx_customer_id
);

SELECT @tx_customer_id AS committed_customer_id;
SELECT COUNT(*) AS committed_customer_rows
FROM customer
WHERE customer_id = @tx_customer_id;

-- 3. Invalid product input must roll back and create no product row.
-- The procedure raises an error. Run this statement separately in MySQL
-- Workbench if your client stops executing after an exception.
SET @tx_product_sku = CONCAT('TX-INVALID-', UNIX_TIMESTAMP());
CALL sp_save_product(
  NULL,
  -1,
  -1,
  @tx_product_sku,
  'Should Roll Back',
  100.00,
  50.00,
  NULL,
  'VEG',
  'PIECE',
  1.00,
  TRUE,
  @tx_product_id
);

-- If the previous CALL failed as expected, this must return zero.
SELECT COUNT(*) AS rolled_back_product_rows
FROM product
WHERE sku = @tx_product_sku;

-- 4. A valid holiday call commits using an atomic upsert.
SET @tx_holiday_date = DATE_ADD(CURDATE(), INTERVAL 10 DAY);
CALL sp_save_holiday(@tx_holiday_date, 'Transaction Test Holiday');

SELECT holiday_date, name
FROM holiday
WHERE holiday_date = @tx_holiday_date;

-- 5. Demonstrate row locking used by discount application.
-- Run the SELECT in one MySQL session and keep the transaction open:
START TRANSACTION;
SELECT order_id, subtotal, discount_total, total_amount
FROM sales_order
WHERE order_id = 1
FOR UPDATE;
-- A second session attempting UPDATE sales_order for order_id = 1 must wait
-- until this transaction is completed.
ROLLBACK;

-- 6. Cleanup only the rows created by this test.
DELETE FROM holiday
WHERE holiday_date = @tx_holiday_date
  AND name = 'Transaction Test Holiday';

DELETE FROM customer
WHERE customer_id = @tx_customer_id
  AND phone = @tx_phone;
