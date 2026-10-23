# 📦 MEMBER 2: MY COMPLETE TASKS & IMPLEMENTATION PLAN
**Project:** Supermarket Chain Management System (ICT3222 ADBMS)  
**Role:** Member 2 — Inventory, Supply Chain, Restock, Transfers & Supplier Portal  

---

## 📌 WHAT IS MY JOB IN SIMPLE WORDS?

As **Member 2**, you are responsible for everything related to **stock and supply chain**:
1. **Managing stock in each branch** (how much rice, milk, fish is in Colombo vs Kandy).
2. **Transferring stock between branches** (e.g. sending 5 KG of fish from Colombo to Kandy) and rolling back if stock is insufficient.
3. **Optimistic Locking (`version`)** so two managers don't overwrite each other's stock updates.
4. **Ordering new stock from suppliers (Purchase Orders)** with **3-way matching**:
   - Store requests stock (`requested_qty`).
   - Supplier logs in to the B2B portal and confirms what they can ship (`confirmed_qty`).
   - Store warehouse physically inspects and receives goods with a GRN (`received_qty`), which automatically increases stock and updates the `version`.
5. **Low stock warning trigger** that automatically sounds the alarm when stock drops below minimum.

---

## 🗺️ MY 5 TASKS CHECKLIST (DO IN THIS ORDER)

```
[ ] TASK 1: Run the MySQL Database Objects (Tables, Procedures, Trigger, UDF, View, Event)
[ ] TASK 2: Create the Spring Boot JDBC Backend Code (DAOs, Services, Controllers)
[ ] TASK 3: Verify the 3 Frontend Screens in Angular
[ ] TASK 4: Rehearse the 3-Minute Live Viva Defense Script
[ ] TASK 5: Write My 3 Academic Report Sections (Sections 7, 8, 15)
```

---

# 🛠️ TASK 1: DATABASE LAYER (MySQL 8)

You own **5 tables**, **4 stored procedures**, **1 trigger**, **1 UDF function**, **1 view**, and **1 event**.

### Step 1.1: Verify Your 5 Tables Exist
Open MySQL Workbench and run:
```sql
USE supermarket_db;
SHOW TABLES;
```
Check that these 5 tables exist:
1. `inventory` — has `(branch_id, product_id)` primary key, `quantity`, `reorder_level`, and `version`
2. `supplier` — has supplier contact info and login credentials
3. `purchase_order` — has PO status (`REQUESTED`, `CONFIRMED`, `RECEIVED`, `CANCELLED`)
4. `purchase_order_item` — has `requested_qty`, `confirmed_qty`, `received_qty`, and generated `line_cost`
5. `low_stock_alert` — has alert rows when products run low

*(If not already created, run `docs/db_structure.sql`).*

---

### Step 1.2: Create Your 4 Stored Procedures
Run this in MySQL Workbench:

#### 1. `sp_create_purchase_order` (Store staff creates order)
```sql
DELIMITER $$
DROP PROCEDURE IF EXISTS sp_create_purchase_order$$
CREATE PROCEDURE sp_create_purchase_order(
  IN p_supplier_id INT, IN p_branch_id INT, IN p_employee_id INT,
  IN p_product_id INT, IN p_qty DECIMAL(10,2), OUT p_po_id INT)
BEGIN
  DECLARE v_unit_cost DECIMAL(10,2);
  DECLARE EXIT HANDLER FOR SQLEXCEPTION BEGIN ROLLBACK; RESIGNAL; END;

  SELECT cost_price INTO v_unit_cost FROM product WHERE product_id = p_product_id;

  START TRANSACTION;
  INSERT INTO purchase_order (supplier_id, branch_id, requested_by, status, total_cost)
  VALUES (p_supplier_id, p_branch_id, p_employee_id, 'REQUESTED', (v_unit_cost * p_qty));
  SET p_po_id = LAST_INSERT_ID();

  INSERT INTO purchase_order_item (po_id, product_id, requested_qty, confirmed_qty, unit_cost)
  VALUES (p_po_id, p_product_id, p_qty, p_qty, v_unit_cost);
  COMMIT;
END$$
DELIMITER ;
```

#### 2. `sp_supplier_confirm_order` (Supplier confirms in B2B portal)
```sql
DELIMITER $$
DROP PROCEDURE IF EXISTS sp_supplier_confirm_order$$
CREATE PROCEDURE sp_supplier_confirm_order(
  IN p_po_id INT, IN p_supplier_id INT, IN p_confirmed_qty DECIMAL(10,2), IN p_notes TEXT)
BEGIN
  DECLARE v_unit_cost DECIMAL(10,2);
  DECLARE EXIT HANDLER FOR SQLEXCEPTION BEGIN ROLLBACK; RESIGNAL; END;

  START TRANSACTION;
  UPDATE purchase_order_item SET confirmed_qty = p_confirmed_qty WHERE po_id = p_po_id;
  SELECT unit_cost INTO v_unit_cost FROM purchase_order_item WHERE po_id = p_po_id LIMIT 1;
  UPDATE purchase_order 
  SET status = 'CONFIRMED', supplier_notes = p_notes, 
      total_cost = (v_unit_cost * p_confirmed_qty), confirmed_at = CURRENT_TIMESTAMP
  WHERE po_id = p_po_id AND supplier_id = p_supplier_id;
  COMMIT;
END$$
DELIMITER ;
```

#### 3. `sp_receive_purchase` (GRN Delivery - Stock increment + Version bump)
```sql
DELIMITER $$
DROP PROCEDURE IF EXISTS sp_receive_purchase$$
CREATE PROCEDURE sp_receive_purchase(
  IN p_po_id INT, IN p_employee_id INT, IN p_received_qty DECIMAL(10,2), IN p_notes TEXT)
BEGIN
  DECLARE v_branch INT; DECLARE v_prod INT;
  DECLARE EXIT HANDLER FOR SQLEXCEPTION BEGIN ROLLBACK; RESIGNAL; END;

  SELECT branch_id INTO v_branch FROM purchase_order WHERE po_id = p_po_id FOR UPDATE;
  SELECT product_id INTO v_prod FROM purchase_order_item WHERE po_id = p_po_id LIMIT 1;

  START TRANSACTION;
  UPDATE purchase_order_item SET received_qty = p_received_qty WHERE po_id = p_po_id;

  -- Atomically increment stock and bump version for optimistic locking
  INSERT INTO inventory (branch_id, product_id, quantity, version)
  VALUES (v_branch, v_prod, p_received_qty, 0)
  ON DUPLICATE KEY UPDATE quantity = quantity + p_received_qty, version = version + 1;

  -- Mark low-stock alert resolved
  UPDATE low_stock_alert SET resolved = TRUE WHERE branch_id = v_branch AND product_id = v_prod;

  -- Add stock audit row
  INSERT INTO stock_audit_log (branch_id, product_id, change_qty, reason, ref_order_id)
  VALUES (v_branch, v_prod, p_received_qty, 'RESTOCK', p_po_id);

  UPDATE purchase_order 
  SET status = 'RECEIVED', received_by = p_employee_id, receiving_notes = p_notes, received_at = CURRENT_TIMESTAMP
  WHERE po_id = p_po_id;
  COMMIT;
END$$
DELIMITER ;
```

#### 4. `sp_transfer_stock` (ACID Inter-Branch Transfer with Rollback)
```sql
DELIMITER $$
DROP PROCEDURE IF EXISTS sp_transfer_stock$$
CREATE PROCEDURE sp_transfer_stock(
  IN p_from_branch INT, IN p_to_branch INT, IN p_product INT, IN p_qty DECIMAL(10,2))
BEGIN
  DECLARE v_current DECIMAL(10,2);
  DECLARE EXIT HANDLER FOR SQLEXCEPTION BEGIN ROLLBACK; RESIGNAL; END;

  START TRANSACTION;
  -- Pessimistic locking: lock source row
  SELECT quantity INTO v_current FROM inventory
  WHERE branch_id = p_from_branch AND product_id = p_product FOR UPDATE;

  -- Validate sufficient stock
  IF v_current IS NULL OR v_current < p_qty THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Insufficient stock at source branch';
  END IF;

  -- Deduct from source branch and bump version
  UPDATE inventory SET quantity = quantity - p_qty, version = version + 1
  WHERE branch_id = p_from_branch AND product_id = p_product;

  -- Add to target branch and bump version
  INSERT INTO inventory (branch_id, product_id, quantity, version)
  VALUES (p_to_branch, p_product, p_qty, 0)
  ON DUPLICATE KEY UPDATE quantity = quantity + p_qty, version = version + 1;

  -- Log double entry in audit log
  INSERT INTO stock_audit_log (branch_id, product_id, change_qty, reason)
  VALUES (p_from_branch, p_product, -p_qty, 'TRANSFER_OUT'),
         (p_to_branch, p_product, p_qty, 'TRANSFER_IN');
  COMMIT;
END$$
DELIMITER ;
```

---

### Step 1.3: Create Your Trigger, UDF, View & Event

```sql
DELIMITER $$

-- 1. Trigger for low stock alert
DROP TRIGGER IF EXISTS trg_inventory_low_stock$$
CREATE TRIGGER trg_inventory_low_stock AFTER UPDATE ON inventory
FOR EACH ROW
BEGIN
  IF NEW.quantity <= NEW.reorder_level AND OLD.quantity > OLD.reorder_level THEN
    INSERT INTO low_stock_alert (branch_id, product_id, quantity)
    VALUES (NEW.branch_id, NEW.product_id, NEW.quantity);
  END IF;
END$$

-- 2. User Defined Function (UDF)
DROP FUNCTION IF EXISTS fn_stock_level$$
CREATE FUNCTION fn_stock_level(p_branch INT, p_product INT) RETURNS DECIMAL(10,2)
READS SQL DATA
BEGIN
  DECLARE v_qty DECIMAL(10,2);
  SELECT quantity INTO v_qty FROM inventory
  WHERE branch_id = p_branch AND product_id = p_product;
  RETURN COALESCE(v_qty, 0.00);
END$$

DELIMITER ;

-- 3. View for Low Stock
CREATE OR REPLACE VIEW v_low_stock AS
SELECT i.branch_id, b.name AS branch, p.product_id, p.name AS product,
       p.unit_of_measure, i.quantity, i.reorder_level, i.version
FROM inventory i
JOIN product p ON p.product_id = i.product_id
JOIN branch b ON b.branch_id = i.branch_id
WHERE i.quantity <= i.reorder_level;

-- 4. Scheduled Event (Weekly Scan)
SET GLOBAL event_scheduler = ON;

CREATE EVENT IF NOT EXISTS ev_weekly_low_stock_scan
ON SCHEDULE EVERY 1 WEEK
DO
  INSERT INTO low_stock_alert (branch_id, product_id, quantity)
  SELECT i.branch_id, i.product_id, i.quantity FROM inventory i
  WHERE i.quantity <= i.reorder_level
    AND NOT EXISTS (
      SELECT 1 FROM low_stock_alert a
      WHERE a.branch_id = i.branch_id AND a.product_id = i.product_id AND a.resolved = FALSE
    );
```

---

# 💻 TASK 2: BACKEND LAYER (Spring Boot 3 Pure JDBC)

**Golden Rule:** Strictly NO Hibernate, NO JPA, NO `@Entity`. Everything uses `JdbcTemplate` or `SimpleJdbcCall`.

### Files to Create in `backend/src/main/java/lk/supermarket/inventory/`:

```
backend/src/main/java/lk/supermarket/inventory/
├── dto/
│   ├── StockTransferRequest.java       # Fields: fromBranchId, toBranchId, productId, qty
│   ├── CreatePoRequest.java            # Fields: supplierId, branchId, employeeId, productId, qty
│   ├── ConfirmPoRequest.java           # Fields: poId, supplierId, confirmedQty, notes
│   └── ReceivePoRequest.java           # Fields: poId, employeeId, receivedQty, notes
├── dao/
│   ├── InventoryDao.java               # Calls sp_transfer_stock, queries v_low_stock, fn_stock_level
│   └── PurchaseOrderDao.java           # Calls sp_create_purchase_order, sp_supplier_confirm_order, sp_receive_purchase
├── service/
│   ├── InventoryService.java           # Orchestrates inventory workflows
│   └── PurchaseOrderService.java       # Orchestrates PO 3-way lifecycle
└── controller/
    ├── InventoryController.java        # REST endpoints: /api/inventory, /api/inventory/transfer, /api/inventory/low-stock
    └── PurchaseOrderController.java    # REST endpoints: /api/purchase-orders, /confirm, /receive
```

### Key API Endpoints You Expose:
| HTTP Method | URL | What it calls in MySQL |
| :--- | :--- | :--- |
| `GET` | `/api/inventory?branchId=1` | `SELECT ... FROM inventory WHERE branch_id = ?` |
| `GET` | `/api/inventory/low-stock` | `SELECT * FROM v_low_stock` |
| `POST` | `/api/inventory/transfer` | `CALL sp_transfer_stock(?, ?, ?, ?)` |
| `POST` | `/api/purchase-orders` | `CALL sp_create_purchase_order(?, ?, ?, ?, ?, ?)` |
| `POST` | `/api/purchase-orders/confirm`| `CALL sp_supplier_confirm_order(?, ?, ?, ?)` |
| `POST` | `/api/purchase-orders/receive`| `CALL sp_receive_purchase(?, ?, ?, ?)` |

---

# 🖥️ TASK 3: FRONTEND VERIFICATION (Angular 17+)

Your frontend is already running at **`http://localhost:4200`**! Open it in your browser and verify:

1. **Screen 1: Branch Inventory & Transfers**
   - URL: `http://localhost:4200/inventory`
   - Actions to test:
     * Switch between branches (Colombo, Kandy, Galle, Negombo).
     * Verify UoM badges: `KG`, `L`, `PACKET`, `PIECE`.
     * Click **Transfer Stock**, select source and target branch, enter quantity, and click Transfer.

2. **Screen 2: Purchase Orders & GRN Receiving**
   - URL: `http://localhost:4200/purchase-orders`
   - Actions to test:
     * Click **+ Create Purchase Order**, select supplier, branch, product, and quantity.
     * Check status shows `REQUESTED`.
     * Inspect the 3 matching columns: **Requested vs Confirmed vs Received**.
     * Click **Receive Delivery (GRN)** to record actual shipment.

3. **Screen 3: B2B Supplier Portal**
   - URL: `http://localhost:4200/supplier-portal`
   - Actions to test:
     * View pending incoming POs.
     * Click **Review & Confirm**, modify the confirmed quantity, type notes, and confirm.

---

# 🎓 TASK 4: 3-MINUTE LIVE VIVA DEMONSTRATION SCRIPT

Practice this exact sequence so you get full marks from the examiner:

### Part 1: ACID Inter-Branch Transfer & Concurrency Rollback (1 min)
1. In MySQL Workbench, show Branch 1 has quantity = 50 and Branch 2 has quantity = 10.
2. Run:
   ```sql
   CALL sp_transfer_stock(1, 2, 3, 5.00);
   ```
3. Query `inventory`: Show Branch 1 reduced to 45, Branch 2 increased to 15, and `version` bumped.
4. Query `stock_audit_log`: Show the two audit rows (`TRANSFER_OUT` and `TRANSFER_IN`).
5. **Run the failure test**:
   ```sql
   CALL sp_transfer_stock(1, 2, 3, 9999.00);
   ```
   Show MySQL throwing error: `Error 45000: Insufficient stock at source branch`, and show that **no data changed (Rollback worked)**.

### Part 2: 3-Way Purchase Order Lifecycle & Optimistic Locking (1.5 min)
1. Go to `http://localhost:4200/purchase-orders` and create a PO for 50 KG of Rice (Status: `REQUESTED`).
2. Go to `http://localhost:4200/supplier-portal` as the supplier. Amend confirmed quantity to 45 KG with note: *"Only 45 KG available"*, then click Confirm (Status: `CONFIRMED`).
3. Return to `http://localhost:4200/purchase-orders`, click **Receive GRN Delivery**, enter received quantity `45.00 KG`.
4. In MySQL, show that:
   - Status is now `RECEIVED`.
   - Stock increased by 45.00.
   - `inventory.version` increased by 1 (Optimistic Locking).
   - Any low-stock alert was resolved.

### Part 3: Low Stock Trigger (30 sec)
1. Run:
   ```sql
   UPDATE inventory SET quantity = 5.00 WHERE branch_id = 1 AND product_id = 1;
   ```
2. Run:
   ```sql
   SELECT * FROM low_stock_alert WHERE resolved = FALSE;
   ```
   Show the examiner that `trg_inventory_low_stock` automatically detected the low stock and created the warning.

---

# 📝 TASK 5: ACADEMIC REPORT (YOUR 3 SECTIONS)

You write 3 sections in the final project report:

### Section 7: Tools, Technologies & Software Framework Evaluation
* Explain why **MySQL 8.0 InnoDB** was chosen (ACID support, row-level locking, foreign keys, triggers, events).
* Explain why we used **Spring Boot 3 with pure Spring JDBC (`JdbcTemplate`)** instead of Hibernate/JPA:
  - Eliminates ORM performance overhead and dirty checking.
  - Gives 100% direct control over SQL queries and stored procedure execution.
  - Satisfies the ADBMS requirement of demonstrating raw database features.
* Mention **Angular 17+ Standalone Components & Signals** for reactive UI state.

### Section 8: Hosting & Cloud Infrastructure Justification
* Compare **Local Development (Docker Compose)** vs **Cloud Production (AWS RDS for MySQL / Azure Database for MySQL)**.
* Discuss cloud benefits: Automated automated snapshots, Multi-AZ failover, read replicas, and storage auto-scaling.
* Discuss SSD storage choices: General Purpose SSD (`gp3`) vs Provisioned IOPS (`io2`) for high-concurrency supermarket checkouts and restocks.

### Section 15: NoSQL Replacement Evaluation & Polyglot Persistence Analysis
* **Why Relational/InnoDB is mandatory for inventory**: Stock deductions and restocks must be strictly atomic and consistent (ACID). If NoSQL (eventual consistency) is used, two customers or branches can oversell the same item (lost updates / phantom inventory).
* **Where NoSQL fits in a hybrid (polyglot) architecture**:
  - **Redis (In-Memory Key-Value)**: Used as a fast caching layer and distributed lock (`Redlock`) to cache stock numbers during flash sales.
  - **MongoDB (Document Store)**: Used to store flexible supplier product catalogs, supplier profiles, and historical purchase order invoices.

---

## 🏁 SUMMARY: WHAT TO DO RIGHT NOW
1. Open this file: [MEMBER_2_MY_TASKS_PLAN.md](file:///c:/Users/VISION/Desktop/ADBMS/Supermarket-ADBMS/MEMBER_2_MY_TASKS_PLAN.md).
2. Tell me: **"Create the Spring Boot backend code for Member 2"**, and I will generate the complete Java DAOs, Services, DTOs, and Controllers for you!
