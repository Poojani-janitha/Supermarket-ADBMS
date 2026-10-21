USE supermarket_db;

-- Run after the shared schema and Member 3 files 03 through 08.
-- Replace these IDs with valid seeded category, supplier and employee data.

-- Query 1: confirms that all required Member 3 functions and procedures exist.
SELECT ROUTINE_NAME, ROUTINE_TYPE
FROM information_schema.ROUTINES
WHERE ROUTINE_SCHEMA = DATABASE()
  AND ROUTINE_NAME IN (
    'fn_customer_tier',
    'fn_is_holiday',
    'fn_is_first_purchase',
    'fn_coupon_valid',
    'sp_save_product',
    'sp_register_customer',
    'sp_save_discount_rule',
    'sp_save_coupon',
    'sp_save_holiday',
    'sp_apply_discounts'
  )
ORDER BY ROUTINE_TYPE, ROUTINE_NAME;

-- Query 2: confirms that all Member 3 views exist.
SELECT TABLE_NAME
FROM information_schema.VIEWS
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME IN (
    'v_product_catalog',
    'v_category_summary',
    'v_customer_directory',
    'v_masked_customer_directory',
    'v_customer_orders',
    'v_active_discounts',
    'v_discount_impact'
  )
ORDER BY TABLE_NAME;

-- Query 3: confirms that product and promotion triggers are installed.
SHOW TRIGGERS
WHERE `Trigger` IN (
  'trg_product_price_audit',
  'trg_rule_check_insert',
  'trg_rule_check_update',
  'trg_rule_audit'
);

-- Query 4: confirms that the daily promotion expiry event is installed.
SHOW EVENTS
WHERE Name = 'ev_expire_discount_rules';

-- Queries 5-7: smoke-test holiday, tier and invalid-coupon function behavior.
SELECT fn_is_holiday(CURDATE()) AS today_is_holiday;
SELECT fn_customer_tier(NULL) AS null_customer_tier;
SELECT fn_coupon_valid('NOT_A_REAL_COUPON', NULL) AS invalid_coupon_is_false;

-- Queries 8-10: verify that the backend read views can be queried.
SELECT COUNT(*) AS product_catalog_rows FROM v_product_catalog;
SELECT COUNT(*) AS active_discount_rows FROM v_active_discounts;
SELECT COUNT(*) AS customer_directory_rows FROM v_customer_directory;

-- Queries 11-12: provide EXPLAIN evidence for the indexing section of the report.
EXPLAIN SELECT *
FROM product
WHERE MATCH(name) AGAINST ('rice*' IN BOOLEAN MODE);

EXPLAIN SELECT *
FROM customer
WHERE phone = '0770000000';
