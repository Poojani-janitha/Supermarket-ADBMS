-- ============================================================================
-- SUPERMARKET CHAIN MANAGEMENT SYSTEM
-- Master Database Initialization Script: run_all.sql
-- Usage: mysql -u root -p < database/run_all.sql
-- ============================================================================

SOURCE 01_schema.sql;
SOURCE 02_indexes.sql;
SOURCE 02_schema_security.sql;
SOURCE 03_functions_sale.sql;
SOURCE 03_functions_security.sql;
SOURCE 04_procedures_sales.sql;
SOURCE 04_procedures_security.sql;
SOURCE 05_procedures_products.sql;
SOURCE 05_triggers_sales.sql;
SOURCE 05_triggers_security.sql;
SOURCE 06_views_sales.sql;
SOURCE 06_views_security.sql;
SOURCE 07_events_sales.sql;
SOURCE 09_roles_users.sql;
SOURCE 10_seed_reference.sql;

SELECT 'Database supermarket_db initialized, secured, and seeded successfully!' AS status;
