# Supermarket Chain Management System (ICT3222 ADBMS)
## Equitable 5-Member Work Allocation & Rubric Mapping

---

## 1. Quick Scorecard: The 5-Member Database Matrix

| Member | Focus Domain | Stored Procedures | Triggers | Functions (UDF) | Views & Events | Viva Highlight |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Member 1** | **Sales & POS** | `sp_place_order`<br>`sp_cancel_order` | `trg_orderitem_check_stock`<br>`trg_orderitem_reduce_stock` | `fn_order_total` | Composite PK clustering on `order_item` | **Pessimistic locking** (`FOR UPDATE`) & ACID rollback |
| **Member 2** | **Inventory & Supply Chain** | `sp_add_stock`<br>`sp_receive_purchase`<br>`sp_transfer_stock` | `trg_inventory_low_stock` | `fn_stock_level` | `v_low_stock`<br>`ev_weekly_low_stock_scan` | **Optimistic locking** (`version`) & inter-branch transfer |
| **Member 3** | **Products, Customers & Promotions** | `sp_save_product`<br>`sp_register_customer`<br>`sp_apply_discounts` | `trg_product_price_audit`<br>`trg_rule_check` | `fn_customer_tier`<br>`fn_is_holiday`<br>`fn_coupon_valid` | `v_active_discounts`<br>`ev_expire_discount_rules` | **SQL Cursor** iterating rules & `FULLTEXT` index search |
| **Member 4** | **Analytics & Performance** | `sp_monthly_report`<br>`sp_category_sales_cte` | `trg_daily_sales_log` | `fn_avg_daily_sales` | `v_daily_sales`<br>`v_product_ranking`<br>`ev_daily_sales_summary`<br>`ev_monthly_log_purge` | **Window functions** (`RANK`), Table Partitioning & `EXPLAIN ANALYZE` (50k rows) |
| **Member 5** | **Security, RBAC & Administration** | `sp_get_login`<br>`sp_deactivate_employee`<br>`sp_change_user_role` | `trg_employee_audit`<br>`trg_security_alert` | `fn_mask_phone`<br>`fn_check_password_strength` | `v_masked_customer_dir`<br>`v_security_audit_log` | **MySQL 8 Roles** (`CREATE ROLE`), Data Masking & Point-in-Time Recovery |

---

## 2. Detailed Member Work Breakdown

### Member 1: Sales, Transactions & POS
* **Theme**: High-concurrency transaction processing, locking, and atomic order placement.
* **Database Tables**: `sales_order`, `order_item`, `payment`
* **Database Programming Objects**:
  * **Procedures**:
    * `sp_place_order`: Handles cart items via MySQL 8 `JSON_TABLE`, runs inside `START TRANSACTION ... COMMIT`, rolls back on `SQLEXCEPTION`.
    * `sp_cancel_order`: Restores inventory and marks order `CANCELLED` inside an atomic transaction.
  * **Triggers**:
    * `trg_orderitem_check_stock` (BEFORE INSERT): Validates stock availability and locks row with `FOR UPDATE`.
    * `trg_orderitem_reduce_stock` (AFTER INSERT): Deducts stock and logs movement to `stock_audit_log`.
  * **Function**: `fn_order_total(order_id)`: Calculates line-item totals.
  * **Index Proof**: Composite PK clustering on `order_item(order_id, product_id)`.
* **Backend (Spring Boot)**: `lk.supermarket.sales` package (`OrderController`, `OrderService`, `OrderDao`, `PaymentDao`). Deadlock retry mechanism in Java.
* **Frontend (Angular)**: `features/pos/` (Product barcode/name search, live shopping cart, discount display, printable receipt dialog).
* **Extra Features for Top Marks**:
  1. Two-session pessimistic locking demo (`SELECT ... FOR UPDATE` preventing negative inventory).
  2. Deadlock detection handling (catching MySQL error 1213 and auto-retrying in the DAO).
* **Report Sections**: Section 2 (Backend Solution), Section 6 (Backend Architecture), Section 13 (Problems & Solutions Compilation).

---

### Member 2: Inventory, Supply Chain & Stock Flow
* **Theme**: Branch inventory management, purchase orders, and stock reordering.
* **Database Tables**: `inventory`, `supplier`, `purchase_order`, `purchase_order_item`, `low_stock_alert`
* **Database Programming Objects**:
  * **Procedures**:
    * `sp_add_stock`: Upsert on inventory with `ON DUPLICATE KEY UPDATE` and audit logging.
    * `sp_receive_purchase`: Marks a PO as received and automatically increments branch inventory for every line item.
    * `sp_transfer_stock`: Atomic stock transfer from Branch A to Branch B inside a transaction.
  * **Trigger**: `trg_inventory_low_stock` (AFTER UPDATE): Automatically inserts an alert into `low_stock_alert` when quantity falls below `reorder_level`.
  * **Function**: `fn_stock_level(branch_id, product_id)`: Scalar query returning current stock.
  * **View & Event**:
    * `v_low_stock`: Multi-table join showing branch products needing reorder.
    * `ev_weekly_low_stock_scan`: Scheduled event sweeping for low-stock items missed during offline updates.
* **Backend (Spring Boot)**: `lk.supermarket.inventory` package (`InventoryController`, `PurchaseOrderController`, `InventoryDao`, `SupplierDao`).
* **Frontend (Angular)**: `features/inventory/` (Stock per branch table, Restock modal, Purchase Orders management, Low stock alert notifications).
* **Extra Features for Top Marks**:
  1. Optimistic locking with a `version` column on `inventory` to prevent lost updates.
  2. Inter-branch stock transfer procedure with rollback validation.
* **Report Sections**: Section 7 (Tools & Technologies), Section 8 (Hosting & Infrastructure Justification), Section 15 (NoSQL Replacement Analysis).

---

### Member 3: Products, Customers & Promotional Rules
* **Theme**: Catalog management, customer loyalty tiers, and dynamic discount calculations.
* **Database Tables**: `product`, `category`, `customer`, `discount_rule`, `coupon`, `holiday`, `order_discount`
* **Database Programming Objects**:
  * **Procedures**:
    * `sp_save_product`: Upsert product catalog details.
    * `sp_register_customer`: Customer registration with phone deduplication.
    * `sp_apply_discounts`: Cursor-based procedure evaluating active discount rules (Welcome 10%, Holiday 5%, Gold 7%, Coupon) in priority order with a 50% max cap.
  * **Triggers**:
    * `trg_product_price_audit` (AFTER UPDATE): Automatically writes old/new prices and `USER()` to `price_audit_log`.
    * `trg_rule_check` (BEFORE INSERT/UPDATE): Enforces rule constraints (e.g., percentage discount cannot exceed 100%).
  * **Functions**:
    * `fn_customer_tier(customer_id)`: Computes tier (`BRONZE`, `SILVER`, `GOLD`) based on cumulative spend.
    * `fn_is_holiday(date)`: Checks if today is listed in the holiday calendar.
    * `fn_coupon_valid(code, rule_id)`: Checks expiry date and remaining usages.
  * **View & Event**:
    * `v_active_discounts`: Shows valid rules for the current date.
    * `ev_expire_discount_rules`: Daily event setting `is_active = FALSE` for expired rules.
* **Backend (Spring Boot)**: `lk.supermarket.product`, `lk.supermarket.customer`, and `lk.supermarket.discount` packages.
* **Frontend (Angular)**: `features/products/`, `features/customers/`, and `features/discounts/` (CRUD catalog, price edit modal, coupon manager, holiday picker).
* **Extra Features for Top Marks**:
  1. MySQL `FULLTEXT` index (`MATCH ... AGAINST`) compared against `LIKE '%x%'` using `EXPLAIN`.
  2. Stacking discount cursor engine enforcing a business safety cap (max 50% order discount).
* **Report Sections**: Section 1 (Introduction), Section 3 (ER Diagram), Section 4 (Relational Mapping & 3NF Normalization), Section 5 (Table Structure).

---

### Member 4: Reporting, Query Optimization & Big Data
* **Theme**: Analytical aggregations, query execution plans, and large dataset handling.
* **Database Tables**: `daily_sales_summary`, `stock_audit_log`
* **Database Programming Objects**:
  * **Procedures**:
    * `sp_monthly_report`: Aggregates branch sales by day using `GROUP BY ... WITH ROLLUP`.
    * `sp_category_sales_cte`: Uses Common Table Expressions (CTE) for hierarchical product sales analysis.
  * **Trigger**: `trg_daily_sales_log` (AFTER INSERT on `daily_sales_summary`): Audit logging for analytics integrity.
  * **Function**: `fn_avg_daily_sales(branch_id, days)`: Calculates moving average branch revenue.
  * **Views & Events**:
    * `v_daily_sales`: Branch-wise daily sales.
    * `v_product_ranking`: Uses SQL Window Function `RANK() OVER (ORDER BY SUM(line_total) DESC)`.
    * `v_discount_impact`: Financial breakdown of revenue surrendered per promotion.
    * `ev_daily_sales_summary`: Nightly event aggregating sales into `daily_sales_summary`.
    * `ev_monthly_log_purge`: Monthly event archiving old logs.
* **Data Engineering**: Python bulk generator (`generate_orders.py`) generating 50,000+ orders across 2 years.
* **Backend (Spring Boot)**: `lk.supermarket.report` package (`ReportController`, `ReportService`, `ReportDao`).
* **Frontend (Angular)**: `features/reports/` (Interactive charts with Chart.js / ng2-charts, monthly summary tables, top products leaderboard).
* **Extra Features for Top Marks**:
  1. `EXPLAIN` and `EXPLAIN ANALYZE` before-and-after query optimization proofs on 50,000+ rows.
  2. RANGE Table Partitioning on `stock_audit_log` by year/month with partition pruning demo.
* **Report Sections**: Section 12 (Code Snippets Compilation), Section 14 (Cloud Architecture & DB Scaling Changes).

---

### Member 5: Security, RBAC, Data Masking & Administration
* **Theme**: Enterprise database security, access control, audit defense, and disaster recovery.
* **Database Tables**: `employee`, `branch`, `employee_audit_log`, `security_event_log`
* **Database Programming Objects**:
  * **Procedures**:
    * `sp_get_login`: Retrieves hashed credentials for authentication.
    * `sp_deactivate_employee`: Safely deactivates an employee inside a transaction with self-lockout prevention.
    * `sp_change_user_role`: Updates employee role and writes an entry into `security_event_log`.
  * **Triggers**:
    * `trg_employee_audit` (AFTER UPDATE ON `employee`): Automatically tracks role changes, branch transfers, and deactivations with `USER()` and timestamps.
    * `trg_security_alert` (BEFORE UPDATE): Blocks unauthorized modifications to admin accounts.
  * **Functions**:
    * `fn_mask_phone(phone)`: Dynamic Data Masking (`0771234567` $\rightarrow$ `077****567`) to protect customer PII for cashiers.
    * `fn_check_password_strength(password)`: Validates complexity constraints directly in SQL.
  * **Views & Privileges**:
    * `v_masked_customer_directory`: Uses `fn_mask_phone` so cashiers only see redacted customer data.
    * `v_security_audit_log`: System-wide audit history for administrators.
    * **MySQL 8 Roles**: `CREATE ROLE cashier_role, manager_role, admin_role` with explicit grant matrix.
    * **Dedicated DB Users**: `app_user`, `report_user`, `etl_user`, `admin_user`.
* **Backend & DevOps**:
  * Spring Boot security plumbing (`SecurityConfig`, JWT filters, `DataSourceConfig`).
  * Docker Compose setup (`mysql` + `backend` + `frontend`).
  * `lk.supermarket.auth` and `lk.supermarket.audit` packages.
* **Frontend (Angular)**: `core/` (JWT interceptor, Auth guards, Role guards) and `features/admin/` (Employee CRUD, role assignment, live security audit viewer).
* **Extra Features for Top Marks**:
  1. MySQL 8 Role-Based Access Control demo (connecting as `demo_cashier` vs `demo_manager` showing allowed vs denied permissions).
  2. Dynamic Data Masking view protecting sensitive customer phone numbers.
  3. `mysqldump` backup and point-in-time recovery (PITR) using MySQL binary logs.
* **Report Sections**: Section 9 (Security Measures & RBAC), Section 10 (Database Accounts & Least Privilege), Section 11 (Database Connection & Pool Tuning).

---

## 3. Academic Report Distribution (15 Sections, 3 per Member)

Each member writes exactly 3 sections relevant to their own module:

```
Section 1:  Introduction ---------------------------------------------- Member 3
Section 2:  Backend Solution ------------------------------------------ Member 1
Section 3:  ER Diagram & Cardinality ---------------------------------- Member 3
Section 4:  Relational Mapping & Normalization (3NF) ------------------ Member 3
Section 5:  Table Structure & Constraint Design ----------------------- Member 3
Section 6:  Backend Architecture & Stored Procedure Flow -------------- Member 1
Section 7:  Tools & Technologies -------------------------------------- Member 2
Section 8:  Hosting Justification (RDS / Cloud vs Local) -------------- Member 2
Section 9:  Database Security & RBAC ---------------------------------- Member 5
Section 10: Database Accounts & Least Privilege Matrix ---------------- Member 5
Section 11: DB Connection Code, HikariCP & SSL ------------------------ Member 5
Section 12: Advanced SQL Code Snippets Compilation -------------------- Member 4
Section 13: Problems Encountered & Solutions Log ---------------------- Member 1
Section 14: Cloud Migration, Scaling & Parameter Groups --------------- Member 4
Section 15: NoSQL Replacement Strategy (Redis / Mongo / Cassandra) ---- Member 2
```

---

## 4. What This Achieves

1. **Equitable SQL Footprint**: No member is left with only non-database tasks. Everyone has procedures, triggers, functions, views, and indexes.
2. **Viva Defense Readiness**: Every member has a clear 3-minute live demonstration for the examiners showing their own database objects executing in MySQL Workbench.
3. **No Redundancy**: Every piece of code written in SQL maps directly to a Spring Boot endpoint and an Angular screen.
