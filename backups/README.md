# Database Snapshots & Point-in-Time Recovery (PITR) Repository
**Supermarket Chain Management System (ICT3222 ADBMS)**  
**Author:** Member 5 (Security, RBAC, Data Masking & Database Administration)

---

## 1. Directory Structure
This directory stores production database snapshots generated via `mysqldump` with transactional snapshot isolation (`--single-transaction`) and binary log coordinates (`--source-data=2` / `--master-data=2`).

```text
backups/
├── supermarket_db_backup_*.sql     # Full database snapshot with routines, triggers, & binlog coordinates
└── README.md                       # PITR execution and recovery guide
```

---

## 2. Automated Scripts (in `database/scripts/`)
- `backup_database.ps1`:
  Performs automated consistent snapshot generation without blocking POS cashier checkouts:
  ```powershell
  powershell -ExecutionPolicy Bypass -File database/scripts/backup_database.ps1
  ```
- `restore_database.ps1`:
  Restores database schema, tables, views, stored procedures, triggers, and seed data, followed by automated row-count consistency verification:
  ```powershell
  powershell -ExecutionPolicy Bypass -File database/scripts/restore_database.ps1 -Force
  ```
- `replay_binlog_pitr.ps1`:
  Replays binary log events up to an exact recovery cut-off timestamp or position immediately prior to a simulated disaster.

---

## 3. Guarantees & SLA
* **Recovery Point Objective (RPO):** $\approx 0$ Seconds (Continuous binary logging via `sync_binlog = 1`).
* **Recovery Time Objective (RTO):** $< 5$ Minutes (Snapshot restore in $< 15$s + binlog replay).
* **Concurrency:** MVCC non-blocking snapshot (0 lock contention on cashiers or managers during live supermarket sales).
