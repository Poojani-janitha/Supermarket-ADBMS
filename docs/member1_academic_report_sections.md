# Academic Report Contributions: Member 1 (Sales, Transactions & POS)
**Coursework:** ICT3222 Advanced Database Management Systems (ADBMS)  
**System:** Supermarket Chain Management System  
**Primary Author:** Member 1

---

## Section 2: Backend Solution & Architecture Overview

### 2.1 Architectural Philosophy: Database-Centric Thin Application Layer
In modern high-throughput retail environments, transactional integrity and concurrency control cannot depend on application-tier abstractions that operate across distributed JVM clusters. In accordance with the ICT3222 ADBMS coursework requirements, our supermarket backend deliberately avoids heavy Object-Relational Mapping (ORM) frameworks like Hibernate and Spring Data JPA.

Instead, our architecture adopts a **Database-First Thin Layer pattern**:
1. **Application Layer (Spring Boot 3 + Java 17):** Functions exclusively as a lightweight HTTP orchestrator and protocol converter. It parses incoming REST requests, enforces syntactic input constraints, serializes JSON payloads, and invokes database routines.
2. **Persistence Abstraction (Spring JDBC):** Data access is implemented exclusively using Spring JDBC (`JdbcTemplate` and `SimpleJdbcCall`). Hand-crafted SQL and parameter-bound procedure invocations eliminate ORM reflection overhead, N+1 query pitfalls, and hidden dirty-checking transactions.
3. **Database Engine (MySQL 8.0 InnoDB):** Acts as the authoritative transactional execution engine. All business logic—including row-level concurrency locking (`FOR UPDATE`), inventory validation triggers, dynamic promotional calculations via SQL cursors, and immutable audit logs—runs natively within the database process space.

```
+-----------------------------------------------------------------------------------+
|                            ANGULAR 17+ FRONTEND (PORT 4200)                      |
|           Role-Based POS Screen, Live Cart Signal, Printable Receipt Modal        |
+-----------------------------------------------------------------------------------+
                                        |  HTTP REST / JSON (Port 8080)
                                        v
+-----------------------------------------------------------------------------------+
|                          SPRING BOOT 3 (THIN JDBC BACKEND)                        |
|   OrderController  -->  OrderService  -->  OrderDao (SimpleJdbcCall, Retry Loop)  |
+-----------------------------------------------------------------------------------+
                                        |  HikariCP Connection Pool / JDBC
                                        v
+-----------------------------------------------------------------------------------+
|                                 MYSQL 8.0 (INNODB)                                |
|  sp_place_order (JSON_TABLE, Deadlock Avoidance Ordering, ACID Rollback Handlers)  |
|  trg_orderitem_check_stock (Pessimistic FOR UPDATE Lock)                          |
|  trg_orderitem_reduce_stock (Stock Deduction & stock_audit_log Capture)           |
|  fn_order_total (Clustered Composite PK Sequential Range Scan)                    |
+-----------------------------------------------------------------------------------+
```

### 2.2 Why Spring JDBC over JPA/Hibernate
- **Deterministic Transaction Boundaries:** JPA flushes entities at indeterminate flush times, obscuring exact lock acquisition points. With `SimpleJdbcCall`, `START TRANSACTION` and procedure calls execute atomically.
- **MySQL 8 `JSON_TABLE` Exploitation:** Unpacking shopping carts sent as JSON arrays directly in the database is trivial via raw JDBC, but notoriously difficult to map cleanly to JPA entity graphs without heavy memory overhead.
- **Granular Error Inspection:** Specific database error codes (e.g., MySQL error `1213` for Deadlock, `SQLSTATE 45000` for custom business rule violations) map directly to Spring `DataAccessException` subclasses without Hibernate wrapping layers.

---

## Section 6: Backend Architecture & Stored Procedure Flow

### 6.1 Physical Disk Layout & Clustered Composite Indexing
In InnoDB, data rows are physically organized according to the table's primary key (Clustered Index). For line items, we deliberately defined a composite clustered primary key:
```sql
CREATE TABLE order_item (
  order_id INT NOT NULL,
  product_id INT NOT NULL,
  quantity INT NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  line_total DECIMAL(12,2) AS (quantity * unit_price) STORED,
  PRIMARY KEY (order_id, product_id)
);
```
**Physical Benefit:** When printing a receipt or looking up an order, fetching all line items for an order requires a single contiguous index range scan on disk (`order_id = ?`). The database engine avoids scattered B-Tree point lookups across different disk blocks.

### 6.2 Stored Procedure Flow: `sp_place_order`
`sp_place_order` encapsulates the entire checkout lifecycle inside an ACID-compliant transaction:

```
[Client Request: Checkout JSON]
              |
              v
[START TRANSACTION]
              |
              +--> [Lock Customer Row (SELECT ... FOR UPDATE)]
              |    (Prevents first-purchase discount race conditions)
              |
              +--> [INSERT INTO sales_order (Master Header)]
              |
              +--> [Unpack Cart via JSON_TABLE with ORDER BY product_id ASC]
              |    |
              |    +--> [Trigger: trg_orderitem_check_stock]
              |    |    (Locks branch inventory row FOR UPDATE; signals 45000 if insufficient)
              |    |
              |    +--> [Trigger: trg_orderitem_reduce_stock]
              |         (Deducts stock & writes audit row to stock_audit_log)
              |
              +--> [CALL sp_apply_discounts (Cursor-based evaluation)]
              |
              +--> [INSERT INTO payment]
              |
              v
          [COMMIT]  ----(On Any SQL Exception)---->  [ROLLBACK & RESIGNAL 45000]
```

### 6.3 Stored Procedure Flow: `sp_cancel_order`
When a supervisor or cashier initiates an order cancellation, `sp_cancel_order` executes:
1. `SELECT status FROM sales_order WHERE order_id = p_order_id FOR UPDATE;` (prevents double cancellation).
2. Verifies current status is not already `'CANCELLED'`.
3. Joins `inventory`, `order_item`, and `sales_order` to atomically increment `inventory.quantity` by the sold quantities.
4. Records compensatory `'CANCEL'` entries into `stock_audit_log`.
5. Updates `sales_order SET status = 'CANCELLED'`.
6. Commits transaction atomically.

---

## Section 13: Problems Encountered & Practical Solutions Log

| Problem # | Root Cause & Context | Practical Engineering Solution Implemented |
| :--- | :--- | :--- |
| **P1: Concurrency Race Condition (Overselling)** | When two cashiers concurrently checked out the final unit of a fast-moving item, both read positive stock before either updated it, resulting in negative stock. | Implemented pessimistic row-level locking via `SELECT ... FOR UPDATE` inside `trg_orderitem_check_stock`. The second cashier's transaction is blocked until the first completes. If stock reaches zero, MySQL throws `SQLSTATE 45000: Insufficient stock` and rolls back. |
| **P2: Cross-Transaction Deadlocks (MySQL 1213)** | Cashier A cart: `[Item 1, Item 2]`. Cashier B cart: `[Item 2, Item 1]`. Simultaneous row locking in opposite orders caused MySQL engine deadlocks (Error 1213). | **Two-Tier Defense:**<br>1. **SQL-Tier:** Enforced `ORDER BY j.product_id ASC` in `sp_place_order` during `JSON_TABLE` unpacking so locks are always requested in identical ascending order.<br>2. **Java-Tier:** Built an automatic retry loop in `OrderDao` with exponential backoff and jitter catching Spring `ConcurrencyFailureException` (up to 3 attempts). |
| **P3: First-Purchase Discount Exploitation** | A new customer could open two concurrent browser checkouts simultaneously; both would query "0 past orders" and claim the welcome discount twice. | Added pessimistic locking on the customer record: `SELECT customer_id INTO v_lock FROM customer WHERE customer_id = p_customer FOR UPDATE;` at the beginning of `sp_place_order`. The second checkout must wait until the first order is committed, causing the second order to evaluate `fn_is_first_purchase() = FALSE`. |
| **P4: Exception Mapping to HTTP REST** | Raw database exceptions exposed internal SQLSTATE codes and stack traces to clients rather than user-friendly HTTP statuses. | Implemented `GlobalExceptionHandler` intercepting Spring `DataAccessException`. It parses the root cause message: `Insufficient stock` maps cleanly to **HTTP 409 Conflict**, `Order already cancelled` to **HTTP 400 Bad Request**, and missing records to **HTTP 404 Not Found**. |
