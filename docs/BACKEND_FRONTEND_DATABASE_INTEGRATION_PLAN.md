# 🔄 FRONTEND ⟷ BACKEND ⟷ DATABASE INTEGRATION PLAN
**Module:** Member 2 — Inventory, Supply Chain, Restock, Transfers & Supplier B2B Portal  
**System:** Supermarket Chain Management System (ICT3222 ADBMS)  
**Architecture:** Angular 17+ (Signals) ⟷ Spring Boot 3 (Pure JDBC, No ORM) ⟷ MySQL 8.0 (InnoDB)  

---

## 📑 TABLE OF CONTENTS
1. [Architecture Golden Rule & Flow](#1-architecture-golden-rule--flow)
2. [End-to-End System Alignment Matrix](#2-end-to-end-system-alignment-matrix)
3. [Deep-Dive Feature Mappings & API Contracts](#3-deep-dive-feature-mappings--api-contracts)
   - [Feature 1: Branch Stock Inventory & Optimistic Locking](#feature-1-branch-stock-inventory--optimistic-locking)
   - [Feature 2: Inter-Branch Stock Transfer (ACID Transaction)](#feature-2-inter-branch-stock-transfer-acid-transaction)
   - [Feature 3: Low-Stock Alerts (View & Trigger)](#feature-3-low-stock-alerts-view--trigger)
   - [Feature 4: 3-Way Purchase Order Reconciliation (Requisition)](#feature-4-3-way-purchase-order-reconciliation-requisition)
   - [Feature 5: B2B Supplier Portal (Vendor Order Confirmation)](#feature-5-b2b-supplier-portal-vendor-order-confirmation)
   - [Feature 6: Goods Receipt Note (GRN) Delivery & Restock](#feature-6-goods-receipt-note-grn-delivery--restock)
4. [Database Objects Specification Summary](#4-database-objects-specification-summary)
5. [Step-by-Step Implementation & Verification Guide](#5-step-by-step-implementation--verification-guide)
6. [Troubleshooting & Error Mapping Matrix](#6-troubleshooting--error-mapping-matrix)

---

## 1. ARCHITECTURE GOLDEN RULE & FLOW

```
┌────────────────────────────────────────────────────────────────────────┐
│ 1. ANGULAR 17+ FRONTEND (localhost:4200)                               │
│ - Standalone components, Angular Material, Signal-based state         │
│ - Sends JSON requests via HttpClient to Spring Boot API                │
└─────────────────────────────────┬──────────────────────────────────────┘
                                  │ HTTP / JSON
                                  ▼
┌────────────────────────────────────────────────────────────────────────┐
│ 2. SPRING BOOT 3 REST API (localhost:8080/api)                         │
│ - Controller : Validates HTTP request payloads (@Valid, @RequestBody)  │
│ - Service    : Orchestrates workflow (ZERO domain math in Java)       │
│ - DAO        : Only place SQL lives (Pure JdbcTemplate / SimpleCall)   │
│ - STRICT RULE: NO Hibernate, NO JPA, NO @Entity                       │
└─────────────────────────────────┬──────────────────────────────────────┘
                                  │ JDBC Driver (HikariCP Pool)
                                  ▼
┌────────────────────────────────────────────────────────────────────────┐
│ 3. MySQL 8.0 InnoDB DATABASE (supermarket_db:3306)                     │
│ - Database does the real work!                                         │
│ - Stored Procedures enforce atomic transactions (START TRANSACTION)    │
│ - Triggers enforce data constraints and automatic alerts              │
│ - Views provide pre-joined analytical data                             │
│ - Optimistic Locking via `version` column prevents lost updates        │
│ - Row-level locking via `SELECT ... FOR UPDATE` prevents race conditions│
└────────────────────────────────────────────────────────────────────────┘
```

---

## 2. END-TO-END SYSTEM ALIGNMENT MATRIX

| # | Business Operation | Angular UI Screen & Action | Spring Boot REST Endpoint | Spring Boot DAO Method | MySQL 8 Database Object |
|---|---|---|---|---|---|
| **1** | View Branch Stock | `/inventory`<br>Branch Dropdown | `GET /api/inventory?branchId={id}` | `InventoryDao.getInventory()` | `SELECT ... FROM inventory i JOIN product p JOIN branch b` |
| **2** | Check Live Stock Level | `/pos` or `/inventory`<br>Stock Badge | `GET /api/inventory/level?branchId={b}&productId={p}` | `InventoryDao.getStockLevel()` | `fn_stock_level(branch, product)` (UDF) |
| **3** | Transfer Stock Between Branches | `/inventory`<br>Transfer Stock Modal | `POST /api/inventory/transfer` | `InventoryDao.transferStock()` | `sp_transfer_stock` (ACID Stored Procedure) |
| **4** | View Low Stock Warnings | `/inventory` & `/purchase-orders`<br>Alerts Banner | `GET /api/inventory/low-stock?branchId={id}` | `InventoryDao.getLowStockAlerts()` | `v_low_stock` (View) & `trg_inventory_low_stock` |
| **5** | Create Purchase Order Requisition | `/purchase-orders`<br>+ Create PO Modal | `POST /api/purchase-orders` | `PurchaseOrderDao.createPurchaseOrder()` | `sp_create_purchase_order` (Stored Procedure) |
| **6** | Vendor Reviews & Confirms Order | `/supplier-portal`<br>Review & Confirm Modal | `POST /api/purchase-orders/confirm` | `PurchaseOrderDao.confirmOrder()` | `sp_supplier_confirm_order` (Stored Procedure) |
| **7** | Physical GRN Receiving & Restock | `/purchase-orders`<br>Receive Delivery Modal | `POST /api/purchase-orders/receive` | `PurchaseOrderDao.receiveOrder()` | `sp_receive_purchase` (Stored Procedure) |

---

## 3. DEEP-DIVE FEATURE MAPPINGS & API CONTRACTS

### Feature 1: Branch Stock Inventory & Optimistic Locking

* **User Action:** User navigates to `http://localhost:4200/inventory` and selects a branch from the dropdown.
* **HTTP Endpoint:** `GET /api/inventory?branchId=1`
* **Response Payload (JSON):**
  ```json
  [
    {
      "branchId": 1,
      "branchName": "Colombo Central Flagship",
      "productId": 2,
      "productName": "Sri Lankan Keeri Samba Rice Premium",
      "sku": "PAN-RIC-002",
      "quantity": 18.00,
      "reorderLevel": 25.00,
      "unitOfMeasure": "KG",
      "version": 1,
      "lowStock": true
    }
  ]
  ```
* **Database Object:**
  Direct parameterized query in `InventoryDao`:
  ```sql
  SELECT i.branch_id, b.name AS branch_name, 
         i.product_id, p.name AS product_name, p.sku, 
         i.quantity, i.reorder_level, p.unit_of_measure, i.version
  FROM inventory i
  JOIN product p ON p.product_id = i.product_id
  JOIN branch b ON b.branch_id = i.branch_id
  WHERE i.branch_id = ?
  ORDER BY p.name ASC;
  ```
* **Optimistic Locking Guard:**
  The `version` field is sent to the client. Whenever a direct inventory edit occurs:
  ```sql
  UPDATE inventory 
  SET quantity = ?, version = version + 1 
  WHERE branch_id = ? AND product_id = ? AND version = ?;
  ```
  If affected rows == 0, `OptimisticLockingFailureException` is thrown, returning **HTTP 409 Conflict**.

---

### Feature 2: Inter-Branch Stock Transfer (ACID Transaction)

* **User Action:** In `/inventory`, click **Transfer Stock**, choose Source Branch: Colombo (1), Target Branch: Kandy (2), Product: Milk (3), Quantity: 5.00 L, and click **Transfer**.
* **HTTP Endpoint:** `POST /api/inventory/transfer`
* **Request Payload (JSON):**
  ```json
  {
    "fromBranchId": 1,
    "toBranchId": 2,
    "productId": 3,
    "qty": 5.00
  }
  ```
* **Backend Execution:** `InventoryController` $\rightarrow$ `InventoryService` $\rightarrow$ `InventoryDao.transferStock()`:
  ```java
  jdbcTemplate.update("CALL sp_transfer_stock(?, ?, ?, ?)", 
      req.getFromBranchId(), req.getToBranchId(), req.getProductId(), req.getQty());
  ```
* **Database Stored Procedure (`sp_transfer_stock`):**
  1. `START TRANSACTION;`
  2. `SELECT quantity INTO v_current FROM inventory WHERE branch_id = p_from_branch AND product_id = p_product FOR UPDATE;` *(Pessimistic Row Lock)*
  3. If `v_current < p_qty`, executes `SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Insufficient stock at source branch';` *(Automatic ROLLBACK via EXIT HANDLER)*.
  4. Decrements source branch stock and increments `version = version + 1`.
  5. Increments target branch stock (or inserts if first time) and increments `version = version + 1`.
  6. Inserts matching double-entry audit records into `stock_audit_log` (`TRANSFER_OUT` and `TRANSFER_IN`).
  7. `COMMIT;`
* **Response (Success):** `HTTP 200 OK`
  ```json
  {
    "success": true,
    "message": "Successfully transferred 5.00 units from branch 1 to branch 2."
  }
  ```
* **Response (Insufficient Stock):** `HTTP 409 Conflict`
  ```json
  {
    "success": false,
    "error": "Insufficient stock at source branch",
    "details": "Insufficient stock at source branch"
  }
  ```

---

### Feature 3: Low-Stock Alerts (View & Trigger)

* **User Action:** Staff checks the Low Stock warning cards on `/inventory` or `/purchase-orders`.
* **HTTP Endpoint:** `GET /api/inventory/low-stock?branchId=1`
* **Database Objects:**
  1. **View `v_low_stock`**:
     ```sql
     SELECT i.branch_id, b.name AS branch, p.product_id, p.name AS product,
            p.unit_of_measure, i.quantity, i.reorder_level, i.version
     FROM inventory i
     JOIN product p ON p.product_id = i.product_id
     JOIN branch b ON b.branch_id = i.branch_id
     WHERE i.quantity <= i.reorder_level;
     ```
  2. **Trigger `trg_inventory_low_stock`**:
     Fires automatically whenever `inventory.quantity` is updated:
     ```sql
     IF NEW.quantity <= NEW.reorder_level AND OLD.quantity > OLD.reorder_level THEN
       INSERT INTO low_stock_alert (branch_id, product_id, quantity)
       VALUES (NEW.branch_id, NEW.product_id, NEW.quantity);
     END IF;
     ```
  3. **Event `ev_weekly_low_stock_scan`**:
     Runs weekly in the background to catch any missed threshold breaches.

---

### Feature 4: 3-Way Purchase Order Reconciliation (Requisition)

* **User Action:** In `/purchase-orders`, click **+ Create Purchase Order**, select Supplier: Lanka Fresh Organics (1), Branch: Colombo (1), Product: Keeri Samba Rice (2), Quantity: 50.00 KG.
* **HTTP Endpoint:** `POST /api/purchase-orders`
* **Request Payload (JSON):**
  ```json
  {
    "supplierId": 1,
    "branchId": 1,
    "employeeId": 2,
    "productId": 2,
    "qty": 50.00
  }
  ```
* **Backend Execution:** `PurchaseOrderController` $\rightarrow$ `PurchaseOrderService` $\rightarrow;` `PurchaseOrderDao.createPurchaseOrder()`:
  Calls `sp_create_purchase_order` and retrieves generated `OUT p_po_id`.
* **Database Stored Procedure (`sp_create_purchase_order`):**
  1. Retrieves current product cost price: `SELECT cost_price INTO v_unit_cost FROM product WHERE product_id = p_product_id;`
  2. Inserts parent order with status `'REQUESTED'`:
     ```sql
     INSERT INTO purchase_order (supplier_id, branch_id, requested_by, status, total_cost)
     VALUES (p_supplier_id, p_branch_id, p_employee_id, 'REQUESTED', (v_unit_cost * p_qty));
     ```
  3. Inserts order item with `requested_qty = 50.00` and `confirmed_qty = 50.00`.
* **Response:** `HTTP 201 Created`
  ```json
  {
    "success": true,
    "message": "Purchase Order #PO-101 created successfully.",
    "data": 101
  }
  ```

---

### Feature 5: B2B Supplier Portal (Vendor Order Confirmation)

* **User Action:** Wholesale vendor logs in to `http://localhost:4200/supplier-portal`, views PO #101, clicks **Review & Confirm**, amends quantity to 45.00 KG (partial fulfillment), types notes: *"Batch #B42 dispatched in 45x 1KG bags"*, and clicks **Confirm**.
* **HTTP Endpoint:** `POST /api/purchase-orders/confirm`
* **Request Payload (JSON):**
  ```json
  {
    "poId": 101,
    "supplierId": 1,
    "confirmedQty": 45.00,
    "notes": "Batch #B42 dispatched in 45x 1KG bags"
  }
  ```
* **Database Stored Procedure (`sp_supplier_confirm_order`):**
  1. Updates line item: `UPDATE purchase_order_item SET confirmed_qty = 45.00 WHERE po_id = 101;`
  2. Updates header status: `status = 'CONFIRMED'`, `confirmed_at = CURRENT_TIMESTAMP`, recalculates `total_cost = unit_cost * confirmed_qty`.
* **Response:** `HTTP 200 OK`
  ```json
  {
    "success": true,
    "message": "Purchase Order #PO-101 confirmed by supplier."
  }
  ```

---

### Feature 6: Goods Receipt Note (GRN) Delivery & Restock

* **User Action:** Delivery arrives at Colombo branch warehouse. Staff opens `/purchase-orders`, clicks **Receive Delivery (GRN)** on PO #101, confirms delivered quantity `45.00 KG`, enters notes *"Inspected and approved"*, and clicks **Receive & Restock**.
* **HTTP Endpoint:** `POST /api/purchase-orders/receive`
* **Request Payload (JSON):**
  ```json
  {
    "poId": 101,
    "employeeId": 2,
    "receivedQty": 45.00,
    "notes": "Inspected and approved"
  }
  ```
* **Database Stored Procedure (`sp_receive_purchase`):**
  1. Locks purchase order row: `SELECT branch_id FROM purchase_order WHERE po_id = 101 FOR UPDATE;`
  2. Sets `purchase_order_item.received_qty = 45.00`.
  3. **Atomic Stock Restock with Optimistic Version Bump**:
     ```sql
     INSERT INTO inventory (branch_id, product_id, quantity, version)
     VALUES (v_branch, v_prod, 45.00, 0)
     ON DUPLICATE KEY UPDATE 
       quantity = quantity + 45.00, 
       version = version + 1;
     ```
  4. Automatically resolves low-stock alert:
     ```sql
     UPDATE low_stock_alert SET resolved = TRUE 
     WHERE branch_id = v_branch AND product_id = v_prod;
     ```
  5. Inserts audit trail into `stock_audit_log` (`reason = 'RESTOCK'`, `ref_order_id = 101`).
  6. Sets `purchase_order.status = 'RECEIVED'`.
* **Response:** `HTTP 200 OK`
  ```json
  {
    "success": true,
    "message": "Shipment for Purchase Order #PO-101 received and restocked into branch inventory successfully."
  }
  ```

---

## 4. DATABASE OBJECTS SPECIFICATION SUMMARY

| Object Name | Type | Key SQL Feature Demonstrated |
| :--- | :--- | :--- |
| `inventory` | Table | Clustered composite PK `(branch_id, product_id)`, `version INT` for optimistic locking |
| `purchase_order` | Table | Status enum lifecycle (`REQUESTED` $\rightarrow$ `CONFIRMED` $\rightarrow$ `RECEIVED`) |
| `purchase_order_item`| Table | 3-way matching fields (`requested_qty`, `confirmed_qty`, `received_qty`), STORED generated column `line_cost` |
| `sp_transfer_stock` | Stored Procedure | `START TRANSACTION`, `SELECT ... FOR UPDATE`, `SIGNAL SQLSTATE '45000'`, double audit logging |
| `sp_create_purchase_order` | Stored Procedure | Requisition creation with `OUT p_po_id` parameter |
| `sp_supplier_confirm_order` | Stored Procedure | B2B supplier confirmation and quantity adjustment |
| `sp_receive_purchase` | Stored Procedure | GRN receiving, atomic stock increment, optimistic locking `version = version + 1`, alert resolution |
| `trg_inventory_low_stock` | Trigger | `AFTER UPDATE ON inventory`, automated alert row creation |
| `fn_stock_level` | Function (UDF) | Scalar quantity lookup with UoM decimals |
| `v_low_stock` | View | Multi-table join (`inventory` + `product` + `branch`) for low-stock queries |
| `ev_weekly_low_stock_scan` | Scheduled Event | Background batch sweep using MySQL 8 Event Scheduler |

---

## 5. STEP-BY-STEP IMPLEMENTATION & VERIFICATION GUIDE

### Step 1: Initialize Database in MySQL Workbench
Execute your SQL files located in `database/`:
1. [database/inventory_stored_procedures.sql](file:///c:/Users/VISION/Desktop/ADBMS/Supermarket-ADBMS/database/inventory_stored_procedures.sql)
2. [database/inventory_triggers.sql](file:///c:/Users/VISION/Desktop/ADBMS/Supermarket-ADBMS/database/inventory_triggers.sql)
3. [database/inventory_functions.sql](file:///c:/Users/VISION/Desktop/ADBMS/Supermarket-ADBMS/database/inventory_functions.sql)
4. [database/inventory_view.sql](file:///c:/Users/VISION/Desktop/ADBMS/Supermarket-ADBMS/database/inventory_view.sql)
5. [database/inventory_events.sql](file:///c:/Users/VISION/Desktop/ADBMS/Supermarket-ADBMS/database/inventory_events.sql)

### Step 2: Start Spring Boot Backend
Open a terminal in `backend/` and run:
```powershell
.\mvnw.cmd spring-boot:run
```
Verify console displays:
* `HikariPool-1 - Added connection`
* `Tomcat started on port 8080 (http) with context path '/api'`

### Step 3: Test Endpoints via cURL or Postman
Test GET inventory:
```bash
curl http://localhost:8080/api/inventory?branchId=1
```
Test stock transfer:
```bash
curl -X POST http://localhost:8080/api/inventory/transfer \
  -H "Content-Type: application/json" \
  -d '{"fromBranchId":1, "toBranchId":2, "productId":3, "qty":2.00}'
```

### Step 4: Verify Angular Frontend
1. Open **`http://localhost:4200/inventory`**: Confirm live stock and test stock transfer.
2. Open **`http://localhost:4200/purchase-orders`**: Create a restock PO.
3. Open **`http://localhost:4200/supplier-portal`**: Review and confirm PO.
4. Return to **`http://localhost:4200/purchase-orders`**: Click Receive GRN Delivery and watch inventory increase.

---

## 6. TROUBLESHOOTING & ERROR MAPPING MATRIX

| Scenario | MySQL Error / Condition | Spring Boot Exception | HTTP Status Code | Frontend User Message |
| :--- | :--- | :--- | :--- | :--- |
| Transfer quantity exceeds branch stock | `SQLSTATE 45000: Insufficient stock at source branch` | `DataAccessException` | **409 Conflict** | "Transfer failed: Insufficient stock at source branch." |
| Two users update same inventory row simultaneously | `version` does not match DB row | `OptimisticLockingFailureException` | **409 Conflict** | "Concurrent update conflict: Data was modified by another user. Please refresh." |
| Invalid transfer quantity (e.g. `<= 0`) | Jakarta validation `@Positive` | `MethodArgumentNotValidException` | **400 Bad Request** | "Validation failed: Transfer quantity must be greater than zero." |
| PO ID does not exist | `po_id` not found | `EmptyResultDataAccessException` | **404 Not Found** | "Purchase Order not found." |
