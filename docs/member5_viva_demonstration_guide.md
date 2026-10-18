# Member 5 Viva Demonstration Guide & Oral Defense Strategy
**Project Title**: Supermarket Chain Management System  
**Course Code**: ICT3222 Advanced Database Management Systems (ADBMS)  
**Primary Author**: Member 5 (Kavindu Perera - Administrator & Security Specialist)  
**Assigned Demonstration Duration**: Exactly 3 Minutes  

---

## 1. Pre-Viva Setup Checklist (Do This 5 Minutes Before Entering)

1. **MySQL 8 Server**:
   - Verify service is active: `Get-Service MySQL80`
   - Verify `supermarket_db` has reference data and accounts populated.
2. **Backend**:
   - Spring Boot running on `http://localhost:8080`.
   - Terminal shows: `Started BackendApplication in 1.551 seconds`.
3. **Frontend**:
   - Angular dev server running on `http://localhost:4200`.
   - Open browser tab on `http://localhost:4200/admin`.
4. **MySQL Client**:
   - Open two query tabs in MySQL Workbench (or two PowerShell windows):
     - **Window A**: Root Admin session (`root@localhost`)
     - **Window B**: Cashier session (`demo_cashier@localhost` / password `CashierDemo2026!`)

---

## 2. 3-Minute Minute-by-Minute Oral Delivery Script

```
+-----------------------------------------------------------------------------------------+
|                                3-MINUTE VIVA TIMELINE                                   |
+--------------------+-------------------------------------------+------------------------+
| Time Window        | Demonstration Focus                       | Target Artifact        |
+--------------------+-------------------------------------------+------------------------+
| 0:00 - 0:45 (45s)  | MySQL 8 RBAC & Least Privilege Denial     | demo_cashier terminal  |
| 0:45 - 1:30 (45s)  | Dynamic Data Masking (PII Protection)     | v_masked_customer_dir  |
| 1:30 - 2:15 (45s)  | Self-Lockout Guard & SQLSTATE 45000       | sp_deactivate_employee |
| 2:15 - 3:00 (45s)  | Automated Trigger Auditing & HikariCP/SSL | trg_employee_audit     |
+--------------------+-------------------------------------------+------------------------+
```

---

### Minute 0:00 – 0:45: Role-Based Access Control (RBAC) & Least Privilege
**What to Say to the Examiner:**
> *"Good morning, sir/madam. As Member 5, I am responsible for Enterprise Database Security, Role-Based Access Control (RBAC), Dynamic Data Masking, Database Connection Management, and DevOps.  
> 
> In traditional applications, security is often left to web-layer boolean checks. In our system, security is enforced natively at the MySQL database engine tier using MySQL 8.0 roles (`cashier_role`, `manager_role`, `admin_role`).  
> 
> Let me demonstrate Least Privilege. Here in Window B, I am connected as `demo_cashier`. When a cashier needs to look up a customer for checkout, they can query the authorized view without issues:  
> `SELECT customer_id, full_name, masked_phone FROM v_masked_customer_directory;`  
> 
> However, if a malicious cashier attempts direct data modification on base tables—such as deleting a product or altering prices:  
> `DELETE FROM product WHERE product_id = 1;`  
> 
> Notice the immediate database rejection: **`ERROR 1142: DELETE command denied to user 'demo_cashier'`**. Direct table DML is completely revoked from non-admin accounts. All mutations must pass through validated stored procedures."*

---

### Minute 0:45 – 1:30: Dynamic Data Masking (PII Compliance)
**What to Say to the Examiner:**
> *"Next, I will demonstrate Dynamic Data Masking for PII protection under GDPR and Sri Lanka Personal Data Protection Act No. 9 of 2022.  
> 
> Supermarkets collect customer mobile numbers for loyalty points, but cashiers should never have access to unmasked contact lists for data harvesting.  
> 
> Look at the difference between the two user sessions:  
> 1. In Window B (Cashier perspective), querying `v_masked_customer_directory` yields:  
>    **`Jacob Jones | 077****567`**  
> 2. In Window A (Administrator perspective), querying the base table `customer` yields:  
>    **`Jacob Jones | 0771234567`**  
> 
> This is powered by our deterministic User-Defined Function `fn_mask_phone()`. By declaring it `DETERMINISTIC`, MySQL caches the masked results during sequential range scans, achieving zero performance overhead while keeping sensitive PII cryptographically protected on the wire."*

---

### Minute 1:30 – 2:15: Defensive Programming & Self-Lockout Exception Guard
**What to Say to the Examiner:**
> *"Now, let's examine Administrative Safety and Defensive Stored Procedures.  
> 
> A critical failure in administrative tools is accidental self-deactivation, where the sole active administrator deactivates their own user account, leaving the system in an unrecoverable headless state.  
> 
> To prevent this, our stored procedure `sp_deactivate_employee` implements a programmatic Self-Lockout Exception Guard:  
> `IF p_admin_id = p_target_emp_id THEN SIGNAL SQLSTATE '45000' ...`  
> 
> Watch what happens when Admin ID 100 attempts to deactivate Admin ID 100:  
> `CALL sp_deactivate_employee(100, 100);`  
> 
> The database engine immediately aborts with:  
> **`Error Code: 1644 (SQLSTATE 45000): Security Violation: Administrator cannot deactivate own account`**  
> 
> In our Spring Boot backend, the `GlobalExceptionHandler` intercepts this `DataAccessException` and translates it into a clean **HTTP 403 Forbidden** status with a user-friendly JSON notification, preventing system downtime."*

---

### Minute 2:15 – 3:00: Immutable Trigger Auditing & Connection Architecture
**What to Say to the Examiner:**
> *"Finally, let's examine Database Engine Auditing and Connection Pooling.  
> 
> When an employee's role or status changes, we cannot rely on application logs, because a developer or DBA could alter a row directly in MySQL Workbench.  
> 
> Watch: when I update employee 101's role:  
> `CALL sp_change_user_role(101, 'MANAGER');`  
> 
> Our database engine trigger `trg_employee_audit` automatically fires on `AFTER UPDATE ON employee` and writes an immutable record into `employee_audit_log`:  
> - Old Role: `CASHIER`  
> - New Role: `MANAGER`  
> - Changed By: `root@localhost` (captured via `USER()`)  
> - Timestamp: Exact execution time  
> 
> On the backend, we connect via **HikariCP** using pure Spring JDBC—with strictly zero JPA or Hibernate overhead. We mathematically sized the connection pool to 10 connections based on PostgreSQL empirical theorem $((4\text{ vCPUs} \times 2) + 1)$, combined with mandatory TLS 1.3 wire encryption and Docker internal bridge network isolation.  
> 
> Thank you. I am ready for your questions."*

---

## 3. High-Scoring Viva Defense Q&A Cheat Sheet

### Question 1: "Why implement RBAC and Data Masking at the database layer instead of in Angular or Spring Boot?"
**Examiner's Intent**: Testing whether you understand the difference between presentation-layer security and true data-tier security.  
**Your Answer**:
> *"Application-layer checks are vulnerable to bypass. If an attacker discovers an API vulnerability, uses curl to hit backend endpoints, or accesses MySQL directly via Workbench or a reporting tool, frontend guards are completely bypassed. By implementing `CREATE ROLE` and `fn_mask_phone` inside MySQL, security is enforced at the storage engine. Even a compromised application connection lacks the permissions to read unmasked PII or execute unauthorized `DELETE` statements."*

---

### Question 2: "Why did you use pure Spring JDBC (`SimpleJdbcCall` / `JdbcTemplate`) instead of Spring Data JPA / Hibernate?"
**Examiner's Intent**: Checking if you actually understand the project's architectural guidelines.  
**Your Answer**:
> *"We chose pure Spring JDBC for three reasons:  
> 1. **Deterministic Transaction Control**: JPA flushes entities at non-deterministic times, making pessimistic row locking (`SELECT ... FOR UPDATE`) unpredictable. With Spring JDBC, lock acquisition and release points are exact.  
> 2. **Native MySQL 8 Features**: We unpack multi-item shopping carts directly in the database using MySQL 8's `JSON_TABLE()`, which is awkward and inefficient to map using JPA entity graphs.  
> 3. **Zero Overhead & Exact Error Mapping**: Spring JDBC passes raw database error codes (like `SQLSTATE 45000` and Error `1213` Deadlock) directly to our exception handler without Hibernate wrapping layers."*

---

### Question 3: "Explain how you arrived at a HikariCP pool size of 10. Why not set it to 100 for high traffic?"
**Examiner's Intent**: Testing systems engineering and concurrency performance knowledge.  
**Your Answer**:
> *"Setting connection pools too large degrades performance because it causes operating system CPU context switching, memory contention, and disk I/O thrashing inside InnoDB.  
> We applied the standard empirical sizing theorem:  
> $$\text{Connections} = (\text{CPU Cores} \times 2) + \text{Effective Spindles}$$  
> On a 4-vCPU server with SSD storage: $(4 \times 2) + 1 = 9 \text{ to } 10\text{ connections}$. A small pool of warm, fast connections allows the CPU to service queries to completion sequentially rather than juggling dozens of contending threads."*

---

### Question 4: "What is the difference between static data masking and dynamic data masking?"
**Examiner's Intent**: Assessing database security fundamentals.  
**Your Answer**:
> *"In **Static Data Masking (SDM)**, the underlying data stored on disk is permanently altered, typically when creating sanitized database copies for QA or testing environments. The original data is lost in that copy.  
> In **Dynamic Data Masking (DDM)**, the data stored on disk remains 100% authentic and unmasked, but it is masked on-the-fly during query projection based on the user's role and authorization. In our system, `customer.phone` is stored as `0771234567`, but cashiers querying `v_masked_customer_directory` see `077****567` dynamically."*

---

### Question 5: "How does your system prevent SQL Injection attacks?"
**Examiner's Intent**: Security standard assessment.  
**Your Answer**:
> *"We employ a three-tier defense against SQL Injection:  
> 1. **Zero String Concatenation**: All database queries and procedure calls in `AuthDao` and `AuditDao` use parameter binding (`?` placeholders in `JdbcTemplate` and typed `SqlParameter` in `SimpleJdbcCall`).  
> 2. **Stored Routine Abstraction**: Business operations are executed via precompiled stored procedures where input values are strictly parsed as data values, never as executable SQL tokens.  
> 3. **Principle of Least Privilege**: Even if an attacker found a way to inject a token, the runtime database user `app_user` has zero direct DDL or table DML privileges on base tables."*

---

### Question 6: "What is Point-in-Time Recovery (PITR) and how does your backup strategy work?"
**Examiner's Intent**: Disaster recovery and DevOps knowledge.  
**Your Answer**:
> *"Point-in-Time Recovery allows us to restore the database to any specific second before a catastrophic event (such as an accidental table drop at 2:15 PM).  
> Our strategy uses two components:  
> 1. **Consistent Snapshot**: Nightly `mysqldump` executed with `--single-transaction --flush-logs --master-data=2`, capturing all InnoDB tables without locking active cashier checkouts, and recording the exact binary log coordinate.  
> 2. **Binary Logs Replay**: Incremental changes after the backup are stored in MySQL binary logs (`mysql-bin`). To recover to 2:14 PM, we restore the snapshot and then use `mysqlbinlog --stop-datetime='2026-10-18 14:14:00'` to replay all transactions up to the exact minute of failure."*

---

### Question 7: "What happens if MySQL restarts or a network glitch occurs? How does the application handle it?"
**Examiner's Intent**: High Availability and Connection Resiliency.  
**Your Answer**:
> *"HikariCP manages connection validation automatically through lightweight ping tests. We configured `connectionTimeout=20000ms`, `maxLifetime=600000ms`, and `idleTimeout=300000ms`. In our Docker Compose architecture, the backend container uses `depends_on: db: condition: service_healthy` with a periodic `mysqladmin ping` probe, guaranteeing the web application only begins accepting checkout traffic once MySQL has fully recovered and loaded its schemas."*
