# Database Disaster Recovery: Point-in-Time Recovery (PITR) Guide
**Coursework:** ICT3222 Advanced Database Management Systems (ADBMS)  
**System:** Supermarket Chain Management System  
**Primary Author:** Member 5 (Security, RBAC, Data Masking & Administration)

---

## 1. Overview and Objectives
In a 24/7 multi-branch retail supermarket environment, database loss from hardware failure, catastrophic storage degradation, or human operator error requires a deterministic recovery procedure that guarantees minimal Recovery Point Objective (RPO) and Recovery Time Objective (RTO).

This document demonstrates **Point-in-Time Recovery (PITR)** using MySQL 8.0:
* **Base Layer**: Consistent full snapshot using `mysqldump` with transactional snapshot isolation (`--single-transaction`).
* **Differential Stream**: MySQL Binary Logs (`binlog`) capturing all state modifications post-snapshot.
* **Point Recovery**: Replaying binary log events up to an exact recovery coordinate (timestamp or binlog position) immediately preceding a simulated disaster.

---

## 2. Prerequisites & Server Configuration

To support binary logging and PITR, ensure the following parameters are enabled in `my.cnf` / `my.ini` (or configured inside container orchestration):

```ini
[mysqld]
# Enable binary logging
log_bin = /var/log/mysql/mysql-bin.log
server_id = 1
binlog_format = ROW
binlog_expire_logs_seconds = 604800  # 7 days retention
sync_binlog = 1                      # ACID durability for transactions
```

---

## 3. Step-by-Step PITR Execution Procedure

### Step 1: Execute Consistent Full Backup with Log Flush
At scheduled intervals (e.g., daily at 02:00), execute `mysqldump` with `--single-transaction` and `--flush-logs`. This creates a consistent snapshot without blocking read/write traffic on InnoDB tables:

```bash
# Execute full database backup
mysqldump -u admin_user -p \
  --single-transaction \
  --flush-logs \
  --master-data=2 \
  --routines \
  --triggers \
  --events \
  supermarket_db > /backups/supermarket_db_full_snapshot.sql
```

> **Why `--master-data=2` matters:**
> This parameter automatically writes the exact binary log file name and position corresponding to the start of the snapshot as a comment inside the dump file (e.g., `CHANGE MASTER TO MASTER_LOG_FILE='mysql-bin.000003', MASTER_LOG_POS=450;`).

---

### Step 2: Normal Transactions Take Place
After the backup, standard supermarket retail activity occurs (orders placed, inventory deducted, customers registered):

```sql
USE supermarket_db;
-- Order #1001 placed
CALL sp_place_order(1, 1, 101, 'CASH', NULL, '[{"productId":1,"qty":2}]', @order_id);
```

---

### Step 3: Simulated Disaster Scenario (14:32:15)
An unauthorized operator or rogue query mistakenly drops or corrupts data:

```sql
-- Disaster occurs at 2026-10-15 14:32:15:
DROP TABLE sales_order;  -- ACCIDENTAL DESTRUCTION
```

---

### Step 4: Locate the Destruction Coordinate in Binary Log
Use `mysqlbinlog` to inspect the latest binary log file and identify the timestamp or position of the destructive event:

```bash
mysqlbinlog --base64-output=DECODE-ROWS -v /var/log/mysql/mysql-bin.000004 \
  | grep -B 5 -A 5 "DROP TABLE"
```

*Output reveals:*
```text
# at 154820
#261015 14:32:15 server id 1  end_log_pos 154920 CRC32 0x7a8b9c1d  Query   thread_id=14    exec_time=0 error_code=0
SET TIMESTAMP=1792055535/*!*/;
DROP TABLE sales_order
```

The recovery objective is **`--stop-datetime="2026-10-15 14:32:14"`** (one second prior to the disaster) or **`--stop-position=154820`**.

---

### Step 5: Restore Database to Point-in-Time

#### A. Re-create Clean Database & Restore Full Base Snapshot:
```bash
# 1. Recreate clean database
mysql -u admin_user -p -e "DROP DATABASE IF EXISTS supermarket_db; CREATE DATABASE supermarket_db;"

# 2. Restore full snapshot
mysql -u admin_user -p supermarket_db < /backups/supermarket_db_full_snapshot.sql
```

#### B. Replay Binary Log Events up to the Disaster Coordinate:
```bash
mysqlbinlog \
  --start-position=450 \
  --stop-datetime="2026-10-15 14:32:14" \
  /var/log/mysql/mysql-bin.000003 /var/log/mysql/mysql-bin.000004 \
  | mysql -u admin_user -p supermarket_db
```

---

## 4. Verification and Proof of Consistency
Verify that the database state is completely intact with zero data loss prior to the disaster:

```sql
USE supermarket_db;

-- 1. Verify sales_order table was restored
SELECT COUNT(*) AS total_orders FROM sales_order;

-- 2. Verify order #1001 placed after backup was successfully recovered
SELECT * FROM sales_order ORDER BY order_id DESC LIMIT 5;

-- 3. Verify stock audit consistency
SELECT * FROM stock_audit_log ORDER BY log_id DESC LIMIT 5;
```

---

## 5. Viva Defense Demonstration Script
1. **Show Backup File**: Open `supermarket_db_full_snapshot.sql` and highlight the `-- CHANGE MASTER TO` comment showing the exact binlog coordinate.
2. **Execute Write & Disaster**:
   * Insert a test record.
   * Note current timestamp (`SELECT NOW();`).
   * Perform an accidental `UPDATE` or `DROP`.
3. **Execute Recovery**: Run the `mysqlbinlog --stop-datetime` pipeline and prove the dropped data has returned while subsequent errant actions were excluded.
