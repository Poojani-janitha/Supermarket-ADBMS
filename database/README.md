# Database execution structure

The shared schema and each team member's database objects are separated into
numbered scripts. Run the shared schema first, then run the Member 3 files in
the order below. Other members can add their own numbered files without
changing these Member 3 scripts.

| File | Purpose |
|---|---|
| `01_schema.sql` | Creates the shared database tables and foreign keys. |
| `02_schema_discount.sql` | Creates shared discount-related tables, if maintained separately by the team. |
| `03_indexes_products_customers_promotions.sql` | Adds Member 3 indexes for customer, promotion and coupon lookups. |
| `04_functions_products_customers_promotions.sql` | Defines reusable customer-tier, holiday, first-purchase and coupon-validation functions. |
| `05_procedures_products_customers_promotions.sql` | Defines product, customer, promotion, coupon, holiday and cursor-based discount procedures. |
| `06_triggers_products_customers_promotions.sql` | Validates promotion rules and records product-price and rule audits. |
| `07_views_products_customers_promotions.sql` | Defines backend read views for products, customers, orders and promotions. |
| `08_events_products_customers_promotions.sql` | Defines the daily event that deactivates expired promotion rules. |
| `tests/tests_products_customers_promotions.sql` | Verifies object installation, function behavior, views and index evidence. |
| `tests/transactions_products_customers_promotions.sql` | Verifies Member 3 commit, rollback and row-locking behavior. |

## Member 3 execution order

```text
shared schema
  -> 03_indexes_products_customers_promotions.sql
  -> 04_functions_products_customers_promotions.sql
  -> 05_procedures_products_customers_promotions.sql
  -> 06_triggers_products_customers_promotions.sql
  -> 07_views_products_customers_promotions.sql
  -> 08_events_products_customers_promotions.sql
  -> tests/tests_products_customers_promotions.sql
```

The scripts use `USE supermarket_db`, so the database must already exist. The
event scheduler must be enabled in MySQL for
`08_events_products_customers_promotions.sql` to run:

```sql
SET GLOBAL event_scheduler = ON;
```
