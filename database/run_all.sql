-- ============================================================================
-- SUPERMARKET CHAIN MANAGEMENT SYSTEM
-- Master Database Initialization Script: run_all.sql
-- Usage: mysql -u root -p < database/run_all.sql
-- ============================================================================

SOURCE 01_schema.sql;
SOURCE 02_indexes.sql;
SOURCE 03_functions_sale.sql;
SOURCE 04_procedures_sales.sql;
SOURCE 05_procedures_products.sql;
SOURCE 05_triggers_sales.sql;
SOURCE 06_views_sales.sql;
SOURCE 07_events_sales.sql;
SOURCE 10_seed_reference.sql;

SELECT 'Database supermarket_db initialized and seeded successfully!' AS status;
