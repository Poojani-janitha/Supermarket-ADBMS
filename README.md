# Supermarket Management System

**ICT3222 Advanced Database Management Systems: Mini Project**
A multi-branch supermarket system where the database does the real work (procedures, triggers, events, views, functions, indexes) and the application is a thin layer on top.

---

## 1. What this project does

A supermarket chain with several branches uses this system to sell products at the point of sale, track stock per branch, buy from suppliers, reward customers with discounts, and report on sales.

| # | Module | In one line |
|---|---|---|
| M1 | Authentication and users | Login with roles: Cashier, Manager, Admin |
| M2 | Product and category | Catalog management, price changes are audited |
| M3 | Supplier and purchasing | Purchase orders, receiving stock |
| M4 | Inventory | Per-branch stock and low-stock alerts |
| M5 | POS / Sales | Make a sale, view the receipt, cancel a sale |
| M6 | Customer and loyalty | Register customers, loyalty tiers |
| M7 | Reporting | Daily and monthly sales, rankings |
| M8 | Audit and admin | Read-only history of price, stock and discount changes |
| M9 | Discounts and promotions | First-purchase, holiday, loyalty and coupon discounts |

---

## 2. Technologies used

| Layer | Technology | Version | Why |
|---|---|---|---|
| Database | MySQL (InnoDB) | 8.0 | Supports events, procedures, triggers, functions, views, JSON, window functions |
| Backend | Spring Boot (Java) | 3.x / 17 | Thin REST API layer |
| DB access | Spring JDBC (`JdbcTemplate`, `SimpleJdbcCall`) | | Raw SQL and stored procedure calls only |
| Build tool (backend) | Maven (with wrapper) | | Dependency management and packaging |
| Security | Spring Security, JWT, BCrypt | | Login, role checks, password hashing |
| Frontend | Angular + Angular Material | 17+ | Screens for each role |
| Build tool (frontend) | npm / Angular CLI | | Dependencies and dev server |
| Containers | Docker Compose | | Runs MySQL, backend and frontend together |
| Tools | MySQL Workbench, Postman, draw.io, Git/GitHub | | Design, testing, collaboration |

---

## 3. What we deliberately did NOT use

| Not used | Reason |
|---|---|
| **ORM / JPA / Hibernate / Spring Data JPA** | Course rule: no ORM. All data access is hand-written SQL. |
| **Business logic in Java** | Rules live in the database: stock deduction is a trigger, the sale flow is a transactional procedure, discounts are computed by `sp_apply_discounts`. |
| **String-built SQL** | Every query uses `?` placeholders (protects against SQL injection). |
| **The root DB account in the app** | The app connects as `app_user`, which can only execute procedures and read views. |
| **Hard-coded passwords** | Credentials come from environment variables (`.env`, not committed). |
| **A NoSQL database** | Stock and payments need ACID transactions. See the report for where NoSQL could be added. |

---

## 4. Database concepts demonstrated

| Concept | Where to find it |
|---|---|
| Primary index | PK on every table (`database/01_schema.sql`) |
| Clustering index | InnoDB clusters rows by PK; composite PKs on `order_item(order_id, product_id)` and `inventory(branch_id, product_id)` |
| Secondary index | `database/03_indexes.sql`, with EXPLAIN before and after in `docs/` |
| Stored procedures | `sp_place_order`, `sp_cancel_order`, `sp_add_stock`, `sp_apply_discounts`, `sp_monthly_report` ... |
| Functions | `fn_order_total`, `fn_customer_tier`, `fn_stock_level`, `fn_is_holiday` ... |
| Triggers | stock check, stock deduction, price audit, low-stock alert, discount rule audit |
| Events | daily sales summary, weekly low-stock scan, nightly discount expiry, monthly log purge |
| Views | `v_daily_sales`, `v_low_stock`, `v_customer_orders`, `v_discount_impact` ... |
| Transactions | `START TRANSACTION / COMMIT / ROLLBACK` inside the sale and cancel procedures |
| Cursor | `sp_apply_discounts` walks the discount rules in priority order |
| Locking | `SELECT ... FOR UPDATE` stops two cashiers selling the last item |
| Roles and privileges | `cashier_role`, `manager_role`, `admin_role` in `database/09_roles_users.sql` |

---

## 5. Architecture

```
Angular (port 4200)  --HTTPS/JSON + JWT-->  Spring Boot (port 8080)
                                              Controller -> Service -> Dao (JdbcTemplate)
                                                                          |
                                                                          | JDBC (connection pool, SSL)
                                                                          v
                                                  MySQL 8: tables, indexes, procedures, functions,
                                                           triggers, views, events
```

Each Java feature package follows the same flow: the **Controller** handles HTTP, the **Service** coordinates, and the **Dao** is the only place SQL appears.

---

## 6. Repository structure

```
supermarket-adbms/
├── README.md
├── docker-compose.yml
├── .env.example
├── docs/                 ER diagram, screenshots, report drafts
├── database/             numbered SQL scripts (run in order) + tests/
├── backend/              Spring Boot (Maven)
└── frontend/             Angular
```

---

## 7. Getting started

### Prerequisites

- Docker and Docker Compose, **or** MySQL 8, JDK 17, Node.js 20+ and Angular CLI
- Git

### Option A: run everything with Docker

```bash
git clone <repo-url>
cd supermarket-adbms
cp .env.example .env          # then edit the passwords
docker compose up --build
```

- Frontend: http://localhost:4200
- Backend API: http://localhost:8080/api
- MySQL: localhost:3306

The SQL scripts in `database/` run automatically on first start, in file-name order.

### Option B: run each part manually

```bash
# 1. Database
mysql -u root -p < database/run_all.sql      # or run the numbered scripts in order

# 2. Backend
cd backend
./mvnw spring-boot:run

# 3. Frontend
cd frontend
npm install
ng serve
```

### Environment variables

| Variable | Purpose | Example |
|---|---|---|
| `DB_HOST`, `DB_PORT` | MySQL location | `localhost`, `3306` |
| `DB_NAME` | Database name | `supermarket_db` |
| `DB_USER`, `DB_PASS` | Account used by the app (`app_user`) | |
| `JWT_SECRET` | Signing key for login tokens | long random string |

> Never commit `.env`. Only `.env.example` goes in Git.

### Seed data

`database/10_seed_reference.sql` loads branches, categories, holidays and sample discount rules. `database/seed_bulk/generate_orders.py` generates 50,000+ sample orders so index and report results are meaningful.

---

## 8. Database accounts

| Account | Used by | Privileges |
|---|---|---|
| `app_user` | Spring Boot backend | EXECUTE on procedures, SELECT on views only |
| `report_user` | Reporting | SELECT on views only |
| `etl_user` | Data warehouse load | Read-only on source tables |
| `admin_user` | DBAs | All privileges |

Demo logins for the application (change before any real use):

| Role | Username | Password |
|---|---|---|
| Admin | `admin` | `<set in seed script>` |
| Manager | `manager1` | `<set in seed script>` |
| Cashier | `cashier1` | `<set in seed script>` |

---

## 9. API overview

All endpoints are under `/api` and need a JWT, except login. Full list and sample requests are in `docs/` and the Postman collection.

| Area | Examples |
|---|---|
| Auth | `POST /auth/login` |
| Sales | `POST /orders`, `GET /orders/{id}`, `POST /orders/{id}/cancel`, `GET /orders/{id}/discounts` |
| Products | `GET /products`, `POST /products`, `PUT /products/{id}` |
| Inventory | `GET /inventory`, `POST /inventory/add`, `GET /inventory/low-stock` |
| Discounts | `GET /discounts/active`, `POST /discounts`, `POST /coupons`, `GET/POST /holidays` |
| Reports | `GET /reports/daily-sales`, `GET /reports/monthly`, `GET /reports/discount-impact` |
| Audit | `GET /audit/prices`, `GET /audit/stock`, `GET /audit/discounts` |

---

## 10. Testing and demo

- `database/tests/` has one SQL test script per module (successful sale, failed sale with rollback, price audit row, low-stock alert, discount cases).
- Postman collection: `docs/postman_collection.json`.
- Suggested demo order: login, add stock, make a sale with a first-purchase discount, view the receipt, show stock and audit rows, run a report, show the two-window locking demo, show the role permission table.

---

## 11. Known limitations

- Free-tier or local hosting only; no production deployment or HA setup.
- Payments are recorded, not processed through a real gateway.
- Holiday dates must be entered manually (Poya days change every year).
- `<add anything else your team knows is incomplete>`

---

## 12. Team

| Member | Module owned | Student ID |
|---|---|---|
| 1 | Sales / POS | `<id>` |
| 2 | Inventory, purchasing, discount rules | `<id>` |
| 3 | Products, customers, coupons | `<id>` |
| 4 | Reporting and performance | `<id>` |
| 5 | Security, auth and platform | `<id>` |

---

## 13. Academic note

This is a coursework project for ICT3222. The report covers the ER diagram, relational mapping, table structure, security measures, hosting choice, cloud changes and the NoSQL replacement discussion.
