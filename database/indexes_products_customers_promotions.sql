USE supermarket_db;

-- Indexes speed up the Member 3 lookup paths without changing table data.
-- The shared schema already creates idx_product_ft on product(name), so this
-- file deliberately adds no duplicate FULLTEXT index.

-- Supports customer name searches and alphabetical customer directory reads.
CREATE INDEX idx_customer_name ON customer (full_name);
-- Supports date-range reporting and sorting for newly registered customers.
CREATE INDEX idx_customer_registered_date ON customer (registered_date);
-- Supports active promotion filtering and priority-order rule evaluation.
CREATE INDEX idx_discount_rule_active_dates
  ON discount_rule (is_active, start_date, end_date, priority);
-- Supports coupon lookup by rule, expiry date and remaining usage.
CREATE INDEX idx_coupon_rule_expiry
  ON coupon (rule_id, expires_on, used_count);
