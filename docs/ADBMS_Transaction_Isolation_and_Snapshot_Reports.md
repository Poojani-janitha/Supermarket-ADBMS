# Advanced DBMS Architecture: Transaction Isolation & Consistent Snapshot Reporting
**Coursework Component:** ICT3222 Advanced Database Management Systems (ADBMS)  
**Modules Addressed:** Member 1 (High-Concurrency OLTP Sales) & Member 4 (Analytical Reporting & Optimization)  
**Engine:** MySQL 8.0 InnoDB  

---

## 1. Executive Summary & Direct Evaluation

| Question | Evaluation | Verdict |
|---|---|---|
| **Are you correct or wrong?** | **100% Correct.** | The proposed syntax `START TRANSACTION WITH CONSISTENT SNAPSHOT, READ ONLY` leverages MySQL InnoDB's Multi-Version Concurrency Control (MVCC) and avoids both dirty reads and phantom skew. |
| **Is it appropriate for reports?** | **Highly Appropriate.** | Ideal for multi-statement financial reconciliations, rollup audits, and analytical batch exports where cross-query mathematical consistency is required. |
| **Is it necessary?** | **Context-Dependent.** | **Crucial** for multi-query reports (e.g., Summary Totals + Itemized Breakdowns). **Unnecessary** for single-statement queries/views (where autocommit provides a single-statement read view automatically). |
| **Is it good for ADBMS rubric?** | **Top Tier (Academic Distinction).** | Demonstrates the fundamental ADBMS concept of **OLTP (Writes) vs. OLAP (Reads) Concurrency Coexistence** without locking. |

---

## 2. The Core Problem: Cross-Query Report Skew (Phantom Anomaly)

In a supermarket chain, dozens of cashiers are continuously committing sales via Member 1's `sp_place_order`.

### The Failure Scenario: Default Autocommit / Separate Read Snapshots
Suppose management generates a financial report that executes two separate queries:

```sql
-- Query 1: Total Revenue
SELECT SUM(total_amount) FROM sales_order WHERE status = 'COMPLETED';
-- Result: $10,000.00 (from 50 orders)

-- [AT THIS EXACT MICROSECOND: Cashier 3 commits Order #51 for $200.00 via sp_place_order]

-- Query 2: Total Orders Count
SELECT COUNT(*) FROM sales_order WHERE status = 'COMPLETED';
-- Result: 51 orders
```

#### The Anomaly (Cross-Query Inconsistency):
- Management sees: **51 orders totaling $10,000.00** (Implied average: $196.08/order).
- In reality: Order #51 was factored into `COUNT(*)` but **omitted** from `SUM(total_amount)`.
- If an audit query subsequently lists all 51 orders, the sum of individual rows will be **$10,200.00**, which does not match the executive summary card ($10,000.00).

---

## 3. How `REPEATABLE READ` + `WITH CONSISTENT SNAPSHOT, READ ONLY` Solves This

```sql
SET TRANSACTION ISOLATION LEVEL REPEATABLE READ;
START TRANSACTION WITH CONSISTENT SNAPSHOT, READ ONLY;

-- Query 1: Computes revenue as of Snapshot T0
SELECT SUM(total_amount) AS total_revenue FROM sales_order WHERE status = 'COMPLETED';

-- Query 2: Computes order volume as of Snapshot T0 (Order #51 is invisible)
SELECT COUNT(*) AS total_orders FROM sales_order WHERE status = 'COMPLETED';

-- Query 3: Itemized breakdown as of Snapshot T0
SELECT branch_id, SUM(total_amount) FROM sales_order WHERE status = 'COMPLETED' GROUP BY branch_id;

COMMIT;
```

### What Happens Inside the InnoDB Engine:

```
      OLTP Writers (Cashiers)                       OLAP Reader (Manager)
  [sp_place_order] on Sales Desk             [Financial Reconciliation Report]
                 │                                           │
                 │                      START TRANSACTION WITH CONSISTENT SNAPSHOT, READ ONLY;
                 │                      ──► InnoDB establishes MVCC Read View at T0
                 │                          (Bypasses trx_id allocation & write locks)
                 │                                           │
      Order #51 COMMITS (T1)                                 │
  ──► Appended to clustered index                            │
  ──► Previous state kept in Undo Logs                       │
                 │                                           │
                 │                      Query 1: SELECT SUM(total_amount)...
                 │                      ──► Reads Undo Log snapshot at T0 ($10,000)
                 │                                           │
      Order #52 COMMITS (T2)                                 │
  ──► Undo logs updated                                      │
                 │                                           │
                 │                      Query 2: SELECT COUNT(*)...
                 │                      ──► Reads Undo Log snapshot at T0 (50 orders)
                 │                          (Orders #51 and #52 are completely invisible!)
                 │                                           │
                 │                      COMMIT; (Releases Read View)
```

1. **Immediate Read View Initialization (`WITH CONSISTENT SNAPSHOT`):**
   - In standard `REPEATABLE READ`, InnoDB creates the read view lazily on the *first `SELECT`*.
   - Adding `WITH CONSISTENT SNAPSHOT` forces the point-in-time snapshot to be established at the exact moment the transaction starts.
2. **Zero Locking (Pure MVCC):**
   - The reader **never acquires shared locks** (`LOCK IN SHARE MODE` is NOT used).
   - Readers never block cashiers running `sp_place_order`.
   - Cashiers inserting rows never block the manager reading the report.
3. **Engine-Level `READ ONLY` Optimizations (MySQL 8.0):**
   - InnoDB does **not allocate a Transaction ID (`trx_id`)**.
   - The transaction is **not added to the active transaction list** in memory.
   - No undo logs are created for this transaction.
   - Mutex contention on the transaction subsystem is dramatically reduced.

---

## 4. Isolation Level Comparison Matrix (InnoDB Engine)

| Isolation Level | Dirty Read? | Non-Repeatable Read? | Phantom Read? | Concurrency Performance | Suitable For |
|---|---|---|---|---|---|
| **READ UNCOMMITTED** | Yes (Severe) | Yes | Yes | Maximum (Dangerous) | Approximate counters only |
| **READ COMMITTED** | No | Yes (Row changes mid-trx) | Yes (New rows appear) | High | E-Commerce checkout locks |
| **REPEATABLE READ** *(Default)* | **No** | **No** (Consistent Read View) | **No** (Eliminated via MVCC & Gap Locks) | **Optimal** | **Financial Reports & Aggregations** |
| **SERIALIZABLE** | No | No | No | Low (Shared lock contention) | Strict financial ledger audits |

> [!IMPORTANT]
> **Key ADBMS Viva Point:** In ANSI SQL-92 standards, `REPEATABLE READ` is theoretically allowed to suffer from phantom reads. **However, in MySQL InnoDB, phantom reads are completely eliminated in `REPEATABLE READ`** through MVCC snapshot reads (for normal `SELECT`) and Next-Key Locking (for locking statements like `SELECT ... FOR UPDATE`).

---

## 5. Where to Apply This in the Project

### A. Recommended Application Areas (YES)
1. **Multi-Query Financial Reconciliation Procedures:**
   - Any stored procedure or report execution that issues two or more queries whose totals must match (e.g., Executive KPI card query + Branch breakdown query + Order count query).
2. **Batch Export Routines:**
   - Generating end-of-month CSV/PDF exports where customer counts and financial totals cannot drift during export generation.
3. **Spring Boot Backend Analytical Endpoints (`ReportDao.java`):**
   - Wrapping multiple reporting queries in a Spring `@Transactional(readOnly = true, isolation = Isolation.REPEATABLE_READ)` boundary.

### B. Not Necessary (NO / Overkill)
1. **Single-Statement SQL Views (`v_product_ranking`, `v_daily_sales`):**
   - A single `SELECT ... FROM v_product_ranking` is already executed within an atomic single-statement snapshot under default autocommit. Wrapping 1 query in an explicit transaction adds connection overhead with zero benefit.
2. **Real-time Inventory Lookups (`fn_stock_level`):**
   - Cashiers need the latest committed physical inventory, not a historical snapshot.

---

## 6. Implementation Example for Supermarket ADBMS

### Stored Procedure Implementation
```sql
USE supermarket_db;

DELIMITER $$

DROP PROCEDURE IF EXISTS sp_financial_reconciliation_report$$
CREATE PROCEDURE sp_financial_reconciliation_report(
    IN p_branch_id INT,
    IN p_start_date DATE,
    IN p_end_date DATE
)
BEGIN
    -- Set isolation level to REPEATABLE READ for this transaction
    SET TRANSACTION ISOLATION LEVEL REPEATABLE READ;

    -- Start read-only consistent snapshot (zero locking on cashiers)
    START TRANSACTION WITH CONSISTENT SNAPSHOT, READ ONLY;

    -- 1. Summary Totals (As of snapshot T0)
    SELECT 
        COUNT(order_id) AS total_completed_orders,
        COALESCE(SUM(subtotal), 0.00) AS gross_sales,
        COALESCE(SUM(discount_total), 0.00) AS total_discounts,
        COALESCE(SUM(total_amount), 0.00) AS net_revenue
    FROM sales_order
    WHERE status = 'COMPLETED'
      AND (p_branch_id IS NULL OR branch_id = p_branch_id)
      AND DATE(order_date) BETWEEN p_start_date AND p_end_date;

    -- 2. Tender Payment Breakdown (Guaranteed to reconcile with net_revenue above)
    SELECT 
        p.method AS payment_method,
        COUNT(p.payment_id) AS transaction_count,
        COALESCE(SUM(p.amount), 0.00) AS total_collected
    FROM payment p
    JOIN sales_order o ON o.order_id = p.order_id
    WHERE o.status = 'COMPLETED'
      AND (p_branch_id IS NULL OR o.branch_id = p_branch_id)
      AND DATE(o.order_date) BETWEEN p_start_date AND p_end_date
    GROUP BY p.method;

    -- 3. Top Contributing Categories (Guaranteed consistent point-in-time)
    SELECT 
        c.name AS category_name,
        COALESCE(SUM(oi.quantity), 0) AS units_sold,
        COALESCE(SUM(oi.line_total), 0.00) AS category_revenue
    FROM category c
    JOIN product pr ON pr.category_id = c.category_id
    JOIN order_item oi ON oi.product_id = pr.product_id
    JOIN sales_order o ON o.order_id = oi.order_id
    WHERE o.status = 'COMPLETED'
      AND (p_branch_id IS NULL OR o.branch_id = p_branch_id)
      AND DATE(o.order_date) BETWEEN p_start_date AND p_end_date
    GROUP BY c.category_id, c.name
    ORDER BY category_revenue DESC
    LIMIT 5;

    -- Release the consistent read view
    COMMIT;
END$$

DELIMITER ;
```

---

## 7. Viva / Defense Preparation: Examiner Q&A

**Q1: Why did you use `REPEATABLE READ` instead of `SERIALIZABLE` for your financial reports?**  
*Answer:* `SERIALIZABLE` implicitly converts all plain `SELECT` statements into `SELECT ... FOR SHARE`, acquiring shared locks on index records and gaps. In a busy supermarket, this would block cashiers from inserting orders into `sales_order`. `REPEATABLE READ` in InnoDB utilizes **MVCC undo logs**, providing snapshot consistency with **zero locks**, ensuring reports never block cashiers.

**Q2: What is the benefit of adding `WITH CONSISTENT SNAPSHOT` over just `START TRANSACTION`?**  
*Answer:* A standard `START TRANSACTION` under `REPEATABLE READ` initializes its read view on the *first read query*. `WITH CONSISTENT SNAPSHOT` forces immediate read view initialization upon transaction entry, ensuring the entire multi-query batch references the exact transaction start timestamp.

**Q3: Why add the `READ ONLY` modifier?**  
*Answer:* MySQL 8.0 optimizes read-only transactions by avoiding the allocation of internal transaction IDs (`trx_id`), bypassing registration in the engine's active write transaction pool, and avoiding undo log creation, significantly reducing memory and CPU overhead.
