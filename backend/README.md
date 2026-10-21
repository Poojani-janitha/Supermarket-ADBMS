# Backend database configuration

The Products, Customers and Promotions API uses Spring JDBC and calls MySQL
views and stored procedures. It expects the shared schema and the numbered
database scripts `03_indexes_products_customers_promotions.sql` through
`08_events_products_customers_promotions.sql` to have been executed first.

Default local connection:

```text
URL:      jdbc:mysql://localhost:3306/supermarket_db
Username: root
Password: empty
```

Override the connection with environment variables when required:

```text
DB_URL=jdbc:mysql://localhost:3306/supermarket_db
DB_USERNAME=your_user
DB_PASSWORD=your_password
```

The module is separated into `product`, `customer`, and `discount` packages.
Each package follows the Controller -> Service -> JDBC DAO pattern:

```text
src/main/java/lk/supermarket/
├── product/
│   ├── ProductController.java
│   ├── CategoryController.java
│   ├── ProductService.java
│   └── ProductDao.java
├── customer/
│   ├── CustomerController.java
│   ├── CustomerService.java
│   └── CustomerDao.java
└── discount/
    ├── DiscountController.java
├── CouponController.java
├── HolidayController.java
├── DiscountService.java
    └── DiscountDao.java
```

Member 3 endpoints remain available under `/api/products`, `/api/categories`,
`/api/customers` and `/api/discounts`.
