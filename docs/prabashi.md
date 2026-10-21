# Full Implementation Plan - Products, Customers & Promotional Rules

Your assigned scope is **Member 3: Products, Customers & Promotional Rules**. The current Angular frontend still uses in-memory dummy data, while the Spring Boot backend only contains the application bootstrap class. Therefore, implementation should proceed from the database layer upward.

The planned architecture is:

```text
Angular frontend
      |
      | HTTP/JSON
      v
Spring Boot REST API
      |
      | JdbcTemplate / CallableStatement
      v
MySQL stored procedures, functions, views, triggers and events
      |
      v
Supermarket database
```

The database must remain responsible for business rules, calculations, validation, auditing, discount application, and transactional consistency.

---

## 1. Existing Situation

### Database

The existing schema already defines the main tables required for your work:

- `product`
- `category`
- `supplier`
- `customer`
- `holiday`
- `discount_rule`
- `coupon`
- `order_discount`
- `price_audit_log`
- `discount_rule_audit`

The schema is defined in `db_structure.sql`.

### Backend

The backend currently contains only:

- Spring Boot application startup
- JDBC dependency
- Spring Security dependency
- MySQL connector
- Validation dependency

The main backend file is `BackendApplication.java`.

There are currently no:

- Controllers
- Services
- DAOs
- DTOs
- Database configuration
- Exception handlers
- REST endpoints
- Authentication integration

### Frontend

The frontend currently stores dummy data directly inside Angular services:

- `product.service.ts`
- `customer.service.ts`
- `discount.service.ts`

These services must eventually call the backend through Angular `HttpClient`.

The frontend data structures are already defined in `models/index.ts`.

---

# 2. Important Design Corrections Before Implementation

There are a few inconsistencies that should be resolved before writing the implementation.

## 2.1 Customer loyalty thresholds

The documentation currently uses:

```text
GOLD   >= 100,000
SILVER >= 50,000
```

However, the Angular UI displays:

```text
GOLD   >= 1,000
SILVER >= 500
```

Choose one consistent rule. For a student supermarket project, the following is more practical:

```text
GOLD   >= 100,000 LKR
SILVER >= 50,000 LKR
BRONZE < 50,000 LKR
```

The frontend should display the same thresholds used by `fn_customer_tier`.

## 2.2 Discount engine and POS integration

The frontend currently calculates discounts inside `cart.service.ts`.

That calculation must be removed from the frontend. The frontend should only send:

- Customer ID
- Employee ID
- Branch ID
- Coupon code
- Cart items
- Payment method

The database procedure should calculate:

- Subtotal
- Applicable discounts
- Discount total
- Tax, if included in the team design
- Final total
- Applied promotional rules

## 2.3 Payment and tax mismatch

The frontend `SalesOrder` model contains:

```typescript
taxAmount
paymentMethod
```

The database schema stores payment separately in the `payment` table and currently does not show a tax column in `sales_order`.

The team should decide whether:

1. Tax is removed from the frontend model, or
2. Tax is added to the database design and included in the order procedure.

This should be agreed with the Sales/POS member before integrating `sp_apply_discounts` with `sp_place_order`.

## 2.4 Product stock source

The frontend product model contains `stockQty`, but stock belongs to the `inventory` table by branch.

The backend product endpoint should return stock only when a `branchId` is provided. Product catalog data and inventory data should not be treated as the same table.

---

# 3. Recommended Database Script Structure

The existing project guide recommends a numbered database execution order. Create a `database` folder in the repository with scripts similar to the following:

```text
database/
â”œâ”€â”€ 01_schema.sql
â”œâ”€â”€ 02_indexes.sql
â”œâ”€â”€ 03_functions_member3.sql
â”œâ”€â”€ 04_procedures_member3.sql
â”œâ”€â”€ 05_triggers_member3.sql
â”œâ”€â”€ 06_views_member3.sql
â”œâ”€â”€ 07_events_member3.sql
â”œâ”€â”€ 08_seed_reference.sql
â””â”€â”€ tests/
    â”œâ”€â”€ products_tests.sql
    â”œâ”€â”€ customers_tests.sql
    â””â”€â”€ promotions_tests.sql
```

The master schema can initially be copied from `db_structure.sql` and then divided into maintainable scripts.

The scripts should be executed in this order:

```text
Tables
  â†“
Indexes
  â†“
Functions
  â†“
Procedures
  â†“
Triggers
  â†“
Views
  â†“
Events
  â†“
Seed data
  â†“
Test scripts
```

---

# 4. Database Implementation Plan

## Phase 1 â€” Product and Category Database Layer

### 4.1 Product read view

Create a product catalog view that joins product, category and supplier information.

Example result:

```text
product_id
sku
product_name
category_id
category_name
supplier_id
supplier_name
unit_price
cost_price
image_url
diet_type
unit_of_measure
min_order_qty
is_active
```

Recommended view:

```sql
v_product_catalog
```

This prevents the backend from repeating joins in multiple places.

### 4.2 Category view

Create a category view that includes product counts:

```sql
v_category_summary
```

It should return:

```text
category_id
category_name
description
icon
parent_id
active_product_count
```

### 4.3 Product search

Implement two search modes:

#### Normal search

Search by:

- Product name
- SKU
- Category name

#### Full-text search

Add a full-text index:

```sql
CREATE FULLTEXT INDEX idx_product_fulltext
ON product(name, sku);
```

Use:

```sql
MATCH(name, sku) AGAINST (? IN BOOLEAN MODE)
```

This directly supports the ADBMS requirement to demonstrate indexing and compare:

```sql
LIKE '%rice%'
```

against:

```sql
MATCH(name, sku) AGAINST ('rice')
```

The product search endpoint should support:

```text
GET /api/products?search=rice
GET /api/products?categoryId=5
GET /api/products?active=true
GET /api/products?branchId=1
```

---

## Phase 2 â€” Customer Database Layer

### 4.4 Customer registration procedure

Implement:

```sql
sp_register_customer
```

Responsibilities:

1. Validate full name.
2. Validate phone number.
3. Validate email if supplied.
4. Check duplicate phone number.
5. Insert the customer.
6. Initialize loyalty points to zero.
7. Return the new customer ID.
8. Return a meaningful error if the phone already exists.

Suggested parameters:

```sql
IN p_full_name VARCHAR(120),
IN p_phone VARCHAR(20),
IN p_email VARCHAR(100),
OUT p_customer_id INT
```

The database should handle duplicate phone errors rather than relying only on Angular validation.

### 4.5 Customer search view

Create:

```sql
v_customer_directory
```

This view should provide:

```text
customer_id
full_name
phone
email
loyalty_points
registered_date
customer_tier
```

The tier should be calculated using:

```sql
fn_customer_tier(customer_id)
```

For restricted users, the security member may provide a masked version:

```sql
v_masked_customer_directory
```

### 4.6 Customer order history

Create:

```sql
v_customer_orders
```

This should join:

- `customer`
- `sales_order`
- `order_item`
- `product`
- `order_discount`

The view should support the customer pageâ€™s â€œView Ordersâ€ button.

Recommended endpoint:

```text
GET /api/customers/{customerId}/orders
```

### 4.7 Customer indexes

The customer table already has a unique index through the phone constraint. Add supporting indexes:

```sql
CREATE INDEX idx_customer_name
ON customer(full_name);

CREATE INDEX idx_customer_registered_date
ON customer(registered_date);
```

Do not add unnecessary indexes. Every index increases insert and update cost.

---

# 5. Database Functions

## 5.1 `fn_customer_tier`

Purpose:

```sql
fn_customer_tier(customer_id)
```

It should calculate completed customer spending and return:

```text
BRONZE
SILVER
GOLD
```

Recommended logic:

```text
GOLD   >= 100,000 LKR
SILVER >= 50,000 LKR
BRONZE otherwise
```

Only completed orders should be included.

Cancelled orders must not contribute to the tier.

---

## 5.2 `fn_is_holiday`

Purpose:

```sql
fn_is_holiday(date)
```

It checks whether a date exists in the `holiday` table.

Used by:

- `sp_apply_discounts`
- holiday promotions
- frontend promotion display
- test cases

---

## 5.3 `fn_is_first_purchase`

Purpose:

```sql
fn_is_first_purchase(customer_id, order_id)
```

It determines whether a customer qualifies for a first-purchase promotion.

The function must:

- Ignore cancelled orders.
- Exclude the current order being processed.
- Return false for walk-in customers.
- Work safely when the customer ID is null.

---

## 5.4 `fn_coupon_valid`

Purpose:

```sql
fn_coupon_valid(coupon_code, rule_id)
```

It validates:

- Coupon exists.
- Coupon belongs to the requested rule.
- Coupon has not expired.
- Usage limit has not been reached.
- The related discount rule is active.
- The current date is within the rule validity period.

It must not increment coupon usage. Usage should be incremented atomically inside the discount procedure.

---

# 6. Stored Procedures

## 6.1 `sp_save_product`

Implement an upsert procedure for products.

Suggested parameters:

```sql
IN p_product_id INT,
IN p_category_id INT,
IN p_supplier_id INT,
IN p_sku VARCHAR(30),
IN p_name VARCHAR(150),
IN p_unit_price DECIMAL(10,2),
IN p_cost_price DECIMAL(10,2),
IN p_image_url VARCHAR(255),
IN p_diet_type VARCHAR(20),
IN p_unit_of_measure VARCHAR(20),
IN p_min_order_qty DECIMAL(10,2),
IN p_is_active BOOLEAN,
OUT p_saved_product_id INT
```

Responsibilities:

- Insert when `p_product_id` is null.
- Update when `p_product_id` is supplied.
- Validate category existence.
- Validate supplier existence.
- Validate positive prices.
- Validate `cost_price <= unit_price`, if this is a team business rule.
- Validate SKU uniqueness.
- Return the saved product ID.

Do not let the Angular application directly execute:

```sql
INSERT INTO product
```

or:

```sql
UPDATE product
```

The frontend should call the backend endpoint, and the backend should call this procedure.

## 6.2 Product deactivation

Instead of deleting products, update:

```sql
is_active = FALSE
```

This preserves historical orders and prevents foreign-key issues.

Recommended procedure extension:

```sql
sp_deactivate_product
```

or allow `sp_save_product` to update `is_active`.

---

## 6.3 `sp_register_customer`

This procedure should handle all customer registration logic.

The backend should not manually generate IDs. MySQL should generate the ID and return it through an OUT parameter or result set.

---

## 6.4 `sp_save_discount_rule`

Although the team guide lists `sp_apply_discounts` as the main procedure, an administrative application needs a controlled way to create and update promotion rules.

Recommended additional procedure:

```sql
sp_save_discount_rule
```

Responsibilities:

- Create or update a discount rule.
- Validate `PERCENT` values between 0 and 100.
- Validate fixed discount values.
- Validate dates.
- Validate loyalty tier values.
- Validate priority.
- Validate the 50% global cap compatibility.
- Return the rule ID.

---

## 6.5 `sp_save_coupon`

Recommended procedure:

```sql
sp_save_coupon
```

Responsibilities:

- Validate coupon code format.
- Ensure coupon code is unique.
- Check linked rule exists.
- Check expiration date.
- Validate positive usage limit.
- Insert coupon.

---

## 6.6 `sp_save_holiday`

Recommended procedure:

```sql
sp_save_holiday
```

Responsibilities:

- Insert a holiday.
- Update a holiday name.
- Reject duplicate dates.
- Validate the holiday name.

---

## 6.7 `sp_apply_discounts`

This is the main part of your assignment.

Suggested parameters:

```sql
IN p_order_id INT,
IN p_coupon_code VARCHAR(20)
```

Responsibilities:

1. Retrieve the order subtotal.
2. Retrieve the customer.
3. Determine the customer tier.
4. Determine whether the order is a first purchase.
5. Determine whether the order date is a holiday.
6. Select valid active rules.
7. Sort rules by priority.
8. Iterate through rules using a cursor.
9. Calculate each discount.
10. Apply `max_discount` where applicable.
11. Enforce stackable/non-stackable rules.
12. Enforce the maximum 50% discount cap.
13. Insert applied rules into `order_discount`.
14. Update `sales_order.discount_total`.
15. Update `sales_order.total_amount`.
16. Increment coupon usage only when the coupon is actually applied.
17. Return the final discount details.

### Discount calculation rules

For percentage discounts:

```text
discount = subtotal Ã— percentage / 100
```

For fixed discounts:

```text
discount = fixed value
```

Apply the maximum limit:

```text
discount = LEAST(calculated_discount, max_discount)
```

Apply the global limit:

```text
total_discount <= subtotal Ã— 0.50
```

### Cursor requirement

The cursor should read active rules ordered by:

```sql
ORDER BY priority ASC, rule_id ASC
```

This provides a clear viva demonstration of cursor-based rule processing.

### Coupon concurrency

The coupon usage update must be protected from race conditions.

The procedure should lock the coupon row before incrementing:

```sql
SELECT used_count, max_uses
FROM coupon
WHERE code = p_coupon_code
FOR UPDATE;
```

This prevents two simultaneous orders from exceeding the coupon usage limit.

### Transaction handling

The procedure must use:

```sql
START TRANSACTION;
```

and an exception handler:

```sql
DECLARE EXIT HANDLER FOR SQLEXCEPTION
BEGIN
    ROLLBACK;
    RESIGNAL;
END;
```

The Sales/POS memberâ€™s `sp_place_order` should call this procedure inside the same transaction.

---

# 7. Triggers

## 7.1 Product price audit trigger

Implement:

```sql
trg_product_price_audit
```

Timing:

```text
AFTER UPDATE ON product
```

Condition:

```text
Only execute when OLD.unit_price <> NEW.unit_price
```

Insert into:

```sql
price_audit_log
```

Record:

- Product ID
- Old price
- New price
- Database user
- Timestamp

Do not write audit rows when unrelated product fields are updated.

## 7.2 Discount rule validation trigger

Implement:

```sql
trg_rule_check
```

Timing:

```text
BEFORE INSERT
BEFORE UPDATE
```

Validate:

- Percentage rule is not above 100.
- Percentage rule is positive.
- Fixed discount is positive.
- `end_date >= start_date`.
- `min_order_amount >= 0`.
- `max_discount` is positive when supplied.
- Loyalty rules use valid tiers.
- Coupon rules do not contain invalid configurations.

Use explicit MySQL errors:

```sql
SIGNAL SQLSTATE '45000'
SET MESSAGE_TEXT = 'Percentage discount cannot exceed 100';
```

## 7.3 Discount rule audit trigger

Implement:

```sql
trg_rule_audit
```

Timing:

```text
AFTER UPDATE ON discount_rule
```

Record changes to:

- Discount value
- Rule status
- Start date
- End date
- Priority
- Stackable status

Insert changes into:

```sql
discount_rule_audit
```

---

# 8. Views

## 8.1 `v_product_catalog`

Used by:

```text
GET /api/products
```

Joins product, category and supplier.

## 8.2 `v_category_summary`

Used by:

```text
GET /api/categories
```

Includes active product counts.

## 8.3 `v_customer_directory`

Used by:

```text
GET /api/customers
```

Includes the calculated customer tier.

## 8.4 `v_customer_orders`

Used by:

```text
GET /api/customers/{customerId}/orders
```

Includes order and discount history.

## 8.5 `v_active_discounts`

The existing schema design already expects this view.

It should return only rules where:

```sql
is_active = TRUE
AND CURDATE() BETWEEN start_date AND end_date
```

Include:

- Rule ID
- Rule name
- Rule type
- Discount kind
- Value
- Minimum order amount
- Maximum discount
- Tier
- Priority
- Stackable
- End date

## 8.6 `v_discount_impact`

This view is useful for reports and proving that promotional rules affect sales.

It should show:

- Number of times a rule was applied
- Total discount amount
- Revenue after discount
- Monthly grouping

---

# 9. Events

## 9.1 Expire discount rules

Create:

```sql
ev_expire_discount_rules
```

Schedule:

```text
Every day
```

Logic:

```sql
UPDATE discount_rule
SET is_active = FALSE
WHERE end_date < CURDATE()
  AND is_active = TRUE;
```

## 9.2 Expire coupons

Recommended additional event:

```sql
ev_expire_coupons
```

This should not delete coupons because historical usage must remain available. Instead, coupon validity should naturally fail based on `expires_on`.

## 9.3 Event verification

The event must be enabled:

```sql
SET GLOBAL event_scheduler = ON;
```

For the report, record:

```sql
SHOW EVENTS;
```

and demonstrate a test rule that has already expired.

---

# 10. Spring Boot Backend Plan

Follow the projectâ€™s JDBC-only design. Do not add JPA entities or Hibernate.

The guide specifies this architecture in `ADBMS Project Full Implementation Guide (Rebalanced Distribution).md`.

Recommended package structure:

```text
backend/src/main/java/lk/supermarket/
â”œâ”€â”€ common/
â”‚   â”œâ”€â”€ ApiError.java
â”‚   â”œâ”€â”€ GlobalExceptionHandler.java
â”‚   â””â”€â”€ DatabaseExceptionTranslator.java
â”œâ”€â”€ config/
â”‚   â”œâ”€â”€ DatabaseConfig.java
â”‚   â””â”€â”€ CorsConfig.java
â”œâ”€â”€ product/
â”‚   â”œâ”€â”€ ProductController.java
â”‚   â”œâ”€â”€ ProductService.java
â”‚   â”œâ”€â”€ ProductDao.java
â”‚   â”œâ”€â”€ ProductDto.java
â”‚   â””â”€â”€ ProductRequest.java
â”œâ”€â”€ category/
â”‚   â”œâ”€â”€ CategoryController.java
â”‚   â”œâ”€â”€ CategoryService.java
â”‚   â””â”€â”€ CategoryDao.java
â”œâ”€â”€ customer/
â”‚   â”œâ”€â”€ CustomerController.java
â”‚   â”œâ”€â”€ CustomerService.java
â”‚   â”œâ”€â”€ CustomerDao.java
â”‚   â”œâ”€â”€ CustomerDto.java
â”‚   â””â”€â”€ CustomerRequest.java
â””â”€â”€ discount/
    â”œâ”€â”€ DiscountController.java
    â”œâ”€â”€ DiscountService.java
    â”œâ”€â”€ DiscountDao.java
    â”œâ”€â”€ DiscountRuleDto.java
    â”œâ”€â”€ CouponDto.java
    â””â”€â”€ HolidayDto.java
```

## 10.1 DAO responsibilities

The DAO is the only layer that contains SQL.

Examples:

```java
public List<ProductDto> findProducts(String search, Integer categoryId) {
    return jdbcTemplate.query(
        "SELECT ... FROM v_product_catalog ...",
        rowMapper
    );
}
```

For stored procedures, use:

- `JdbcTemplate`
- `CallableStatement`
- `SimpleJdbcCall`

The DAO should call:

```sql
CALL sp_save_product(...)
CALL sp_register_customer(...)
CALL sp_apply_discounts(...)
```

It should not duplicate the business rules in Java.

## 10.2 Service responsibilities

The service should:

- Coordinate DAO calls.
- Apply authorization checks.
- Validate request-level rules.
- Convert database results to response DTOs.
- Handle workflow-specific logic.

The service should not recalculate loyalty tiers or discounts.

## 10.3 Controller responsibilities

Controllers should:

- Parse HTTP requests.
- Validate DTOs.
- Call services.
- Return correct HTTP status codes.

Recommended endpoints:

### Products

```text
GET    /api/products
GET    /api/products/{id}
POST   /api/products
PUT    /api/products/{id}
PATCH  /api/products/{id}/status
GET    /api/categories
GET    /api/products/search
```

### Customers

```text
GET    /api/customers
GET    /api/customers/{id}
GET    /api/customers/{id}/orders
POST   /api/customers
```

### Discount rules

```text
GET    /api/discounts/active
GET    /api/discounts/rules
POST   /api/discounts/rules
PUT    /api/discounts/rules/{id}
PATCH  /api/discounts/rules/{id}/status
```

### Coupons

```text
GET    /api/discounts/coupons
POST   /api/discounts/coupons
```

### Holidays

```text
GET    /api/discounts/holidays
POST   /api/discounts/holidays
PUT    /api/discounts/holidays/{date}
```

### Discount preview

A useful endpoint for POS integration:

```text
POST /api/discounts/preview
```

The preview should calculate discounts without permanently creating an order.

However, the final checkout must always call `sp_apply_discounts` through the Sales/POS workflow. A preview must never be trusted as the final amount.

---

# 11. Backend Error Handling

Create a common error response:

```json
{
  "timestamp": "2026-10-17T11:30:00",
  "status": 409,
  "code": "CUSTOMER_PHONE_EXISTS",
  "message": "A customer with this phone number already exists",
  "path": "/api/customers"
}
```

Map database errors to suitable HTTP responses:

| Database condition | HTTP status |
|---|---:|
| Invalid request data | 400 |
| Duplicate SKU or phone | 409 |
| Product/customer/rule not found | 404 |
| Invalid promotion rule | 422 |
| Coupon usage exceeded | 409 |
| Database connection failure | 503 |
| Unexpected database error | 500 |

Do not return raw MySQL stack traces to Angular.

The database should use meaningful messages with `SIGNAL SQLSTATE '45000'`, and the backend should translate known messages into application error codes.

---

# 12. Angular Frontend Migration Plan

## 12.1 Add `HttpClient`

Configure Angular providers in `app.config.ts`:

```typescript
provideHttpClient(withInterceptors([...]))
```

Use an environment-based API URL:

```text
/api
```

During development, use an Angular proxy to forward requests to:

```text
http://localhost:8080
```

## 12.2 Replace `ProductService`

Remove:

- `initialProducts`
- `signal<Product[]>(...)`
- Local price updates
- Local stock decrement logic

Replace with:

```typescript
getProducts(filters): Observable<Product[]>
getProduct(id): Observable<Product>
saveProduct(request): Observable<Product>
deactivateProduct(id): Observable<void>
getCategories(): Observable<Category[]>
```

The product component should load data during initialization and refresh after updates.

## 12.3 Replace `CustomerService`

Remove:

- `initialCustomers`
- Local customer ID generation
- Local tier calculation
- Local phone masking as the primary security mechanism

Replace with:

```typescript
getCustomers(): Observable<Customer[]>
registerCustomer(request): Observable<Customer>
getCustomerOrders(customerId): Observable<SalesOrder[]>
```

Phone masking should come from the database view for restricted users.

The frontend may hide or display fields, but frontend masking alone is not a security feature.

## 12.4 Replace `DiscountService`

Remove:

- Hard-coded discount rules
- Hard-coded coupons
- Hard-coded holidays
- Local ID generation
- Browser `prompt()` and `alert()`

Replace with:

```typescript
getActiveRules(): Observable<DiscountRule[]>
getRules(): Observable<DiscountRule[]>
saveRule(request): Observable<DiscountRule>
getCoupons(): Observable<Coupon[]>
createCoupon(request): Observable<Coupon>
getHolidays(): Observable<Holiday[]>
saveHoliday(request): Observable<Holiday>
previewDiscount(request): Observable<DiscountPreview>
```

## 12.5 Update product page

The existing product page already visually references:

```text
trg_product_price_audit
FULLTEXT idx_product_ft
```

After backend integration:

- Search calls the API.
- Category filters call the API or filter API results.
- Price update calls `sp_save_product`.
- Audit confirmation is displayed only after a successful response.
- Database errors are shown through a proper notification component.

## 12.6 Update customer page

The customer page should:

- Load customers from the backend.
- Search by phone or name through the API.
- Register customers using `sp_register_customer`.
- Display the tier returned from `fn_customer_tier`.
- Load order history from `v_customer_orders`.
- Show duplicate phone errors clearly.

## 12.7 Update discount page

The discount page should:

- Load active rules from `v_active_discounts`.
- Load coupons from the backend.
- Load holidays from the backend.
- Create rules through `sp_save_discount_rule`.
- Create coupons through `sp_save_coupon`.
- Create holidays through `sp_save_holiday`.
- Display expired rules based on database data.
- Stop using browser `prompt()` and `alert()`.

---

# 13. POS Integration With the Sales Member

Your discount procedure is tightly connected to the Sales/POS memberâ€™s `sp_place_order`.

The agreed integration should be:

```text
Angular POS
    |
    | Cart, customer, coupon, payment
    v
OrderController
    |
    v
OrderService
    |
    v
OrderDao
    |
    CALL sp_place_order(...)
    |
    â”œâ”€â”€ Insert sales_order
    â”œâ”€â”€ Insert order_item
    â”œâ”€â”€ Call sp_apply_discounts
    â”œâ”€â”€ Increment coupon usage
    â”œâ”€â”€ Insert order_discount
    â”œâ”€â”€ Insert payment
    â””â”€â”€ Commit
```

The frontend must not calculate or trust the final price.

The final receipt should use the totals returned from the database.

Required coordination points with the Sales/POS member:

1. Exact JSON structure for cart items.
2. Whether `sp_apply_discounts` receives an order ID or order details.
3. Coupon locking strategy.
4. Tax handling.
5. Final order response format.
6. Handling of walk-in customers.
7. Whether customer loyalty points are updated by Sales or Customer logic.

---

# 14. Removing Dummy Data

Dummy data should be removed only after the matching API is working.

Recommended order:

1. Implement backend product API.
2. Connect product Angular service.
3. Remove product dummy arrays.
4. Implement backend customer API.
5. Connect customer Angular service.
6. Remove customer dummy arrays.
7. Implement backend promotion API.
8. Connect discount Angular service.
9. Remove discount, coupon and holiday dummy arrays.
10. Remove dummy POS cart and customer defaults.
11. Remove local discount calculations.
12. Remove browser prompts and alerts.
13. Verify the UI after refreshing the browser.

Do not delete all seed data from MySQL. Keep controlled reference seed data for demonstration, but distinguish it from frontend dummy data.

---

# 15. Testing Plan

## 15.1 Product tests

Test:

- Create a valid product.
- Update a product.
- Reject duplicate SKU.
- Reject invalid category.
- Reject invalid supplier.
- Reject negative price.
- Deactivate a product.
- Verify inactive products do not appear in active catalog results.
- Verify price audit row is created.
- Verify audit row is not created when price is unchanged.
- Search products using `LIKE`.
- Search products using `FULLTEXT`.
- Compare execution plans using `EXPLAIN`.

## 15.2 Customer tests

Test:

- Register a valid customer.
- Reject duplicate phone.
- Reject empty name.
- Reject invalid phone.
- Register customer without email.
- Verify loyalty points start at zero.
- Verify a new customer is BRONZE.
- Create completed orders and verify tier changes.
- Verify cancelled orders do not affect tier.
- Verify masked customer view.
- Verify customer order history.

## 15.3 Promotion tests

Test:

- Create a percentage rule.
- Reject percentage above 100.
- Reject invalid dates.
- Reject invalid loyalty tier.
- Create a fixed-value rule.
- Create a coupon.
- Reject duplicate coupon code.
- Reject expired coupon.
- Reject coupon with exhausted usage.
- Apply first-purchase discount.
- Apply holiday discount.
- Apply loyalty discount.
- Apply coupon discount.
- Verify rule priority.
- Verify non-stackable rules.
- Verify 50% maximum discount cap.
- Verify `order_discount` rows.
- Verify coupon usage increments only when applied.
- Verify concurrent coupon usage cannot exceed `max_uses`.
- Verify expired rules are disabled by the scheduled event.

## 15.4 Backend tests

Use:

- DAO integration tests against MySQL.
- Controller tests with MockMvc.
- Validation tests.
- Error mapping tests.
- Duplicate record tests.
- Stored procedure error tests.

## 15.5 Frontend tests

Test:

- Product list loads from API.
- Product search sends the correct query.
- Product price update refreshes the row.
- Customer registration handles duplicate phone errors.
- Customer order history loads.
- Discount rules load from the database.
- Coupon creation displays backend validation errors.
- Loading and empty states work.
- API failures are shown to the user.

---

# 16. Demonstration and Viva Evidence

Prepare screenshots or SQL output for the following:

## Stored procedures

```sql
SHOW PROCEDURE STATUS
WHERE Db = 'supermarket_db';
```

Demonstrate:

- `sp_save_product`
- `sp_register_customer`
- `sp_apply_discounts`

## Functions

```sql
SHOW FUNCTION STATUS
WHERE Db = 'supermarket_db';
```

Demonstrate:

- `fn_customer_tier`
- `fn_is_holiday`
- `fn_is_first_purchase`
- `fn_coupon_valid`

## Triggers

```sql
SHOW TRIGGERS;
```

Demonstrate:

- Price audit trigger
- Discount validation trigger
- Discount audit trigger

## Views

```sql
SHOW FULL TABLES
WHERE Table_type = 'VIEW';
```

Demonstrate:

- `v_product_catalog`
- `v_customer_directory`
- `v_customer_orders`
- `v_active_discounts`
- `v_discount_impact`

## Events

```sql
SHOW EVENTS;
```

Demonstrate:

- Expired promotional rule cleanup
- Event scheduler configuration

## Indexing

Use:

```sql
EXPLAIN SELECT ...
EXPLAIN ANALYZE SELECT ...
```

Compare:

```sql
LIKE '%rice%'
```

with:

```sql
MATCH(name, sku) AGAINST ('rice' IN BOOLEAN MODE)
```

---

# 17. Suggested Implementation Sequence

Follow this sequence to reduce rework:

### Step 1 â€” Confirm shared database contracts

Agree with the team on:

- Loyalty thresholds
- Tax handling
- Final order structure
- Customer tier ownership
- Coupon rule ownership
- Branch-specific product stock behavior

### Step 2 â€” Prepare database scripts

Create:

- Index script
- Functions script
- Procedures script
- Triggers script
- Views script
- Events script
- Seed data
- SQL tests

### Step 3 â€” Implement and test product database objects

Start with:

- Product indexes
- Product catalog view
- `sp_save_product`
- Price audit trigger
- Product search

### Step 4 â€” Implement and test customer database objects

Then implement:

- Customer indexes
- `fn_customer_tier`
- `sp_register_customer`
- Customer views
- Customer order history

### Step 5 â€” Implement and test promotional rules

Then implement:

- Holiday functions
- Coupon validation
- Rule validation trigger
- Rule audit trigger
- Rule and coupon procedures
- Active discount view
- Expiration event

### Step 6 â€” Implement Spring Boot APIs

Build the package structure:

```text
product
customer
discount
common
config
```

Connect each DAO to the corresponding view or stored procedure.

### Step 7 â€” Replace Angular dummy services

Connect:

- Product page
- Customer page
- Discount page

to the REST APIs.

### Step 8 â€” Integrate with POS

Coordinate with the Sales/POS member and remove frontend discount calculations.

### Step 9 â€” Perform full testing

Run:

- SQL tests
- Backend tests
- Frontend tests
- API tests through Postman
- End-to-end browser testing

### Step 10 â€” Prepare report and viva evidence

Document:

- Procedure screenshots
- Function screenshots
- Trigger results
- Event results
- View output
- Index execution plans
- Error handling
- Transaction behavior
- Frontend-to-backend flow

---

# 18. Recommended First Deliverable

The first actual implementation milestone should be:

```text
Products, Customers & Promotions database foundation
```

It should include:

```text
03_indexes_products_customers_promotions.sql
04_functions_products_customers_promotions.sql
05_procedures_products_customers_promotions.sql
06_triggers_products_customers_promotions.sql
07_views_products_customers_promotions.sql
08_events_products_customers_promotions.sql
tests/tests_products_customers_promotions.sql
```

Only after these scripts work directly in MySQL should the Spring Boot APIs be created. This ensures that the backend remains a thin integration layer and that your project clearly demonstrates the ADBMS concepts required by the lecture.

The existing guideâ€™s intended principle is correct: **Angular should not contain the actual discount, loyalty, validation, or audit logic. The database should perform those responsibilities.**