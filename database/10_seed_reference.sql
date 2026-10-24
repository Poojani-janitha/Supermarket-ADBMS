-- ============================================================================
-- SUPERMARKET CHAIN MANAGEMENT SYSTEM
-- ICT3222 Advanced Database Management Systems (ADBMS)
-- Script 10: Reference Seed Data
-- Master Reference Seed Data for Multi-Branch System
-- Engine: MySQL 8.0 (InnoDB)
-- ============================================================================

USE supermarket_db;

-- 1. Branches
INSERT INTO branch (branch_id, name, city, province, address, phone) VALUES
(1, 'Colombo Central Flagship', 'Colombo', 'Western', '100 Galle Road, Colombo 03', '0112345678'),
(2, 'Kandy City Centre Outlet', 'Kandy', 'Central', '45 Dalada Veediya, Kandy', '0812345678'),
(3, 'Galle Fort Coastal Branch', 'Galle', 'Southern', '12 Lighthouse Street, Galle', '0912345678')
ON DUPLICATE KEY UPDATE name=VALUES(name);

-- 2. Categories
INSERT INTO category (category_id, name, description, icon) VALUES
(1, 'Fresh Produce', 'Organic vegetables and fresh fruits', 'nutrition'),
(2, 'Grains & Rice', 'Premium quality rice varieties and pulses', 'grain'),
(3, 'Dairy & Eggs', 'Fresh farm milk, cheese, and farm eggs', 'egg_alt'),
(4, 'Beverages', 'Ceylon tea, coffee, and fresh juices', 'local_cafe'),
(5, 'Bakery & Snacks', 'Fresh bread, artisanal pastries, and biscuits', 'bakery_dining')
ON DUPLICATE KEY UPDATE name=VALUES(name);

-- 3. Suppliers
INSERT INTO supplier (supplier_id, name, contact_person, phone, email, city) VALUES
(1, 'Lanka Agro Farms PLC', 'Sunil Perera', '0779988111', 'sunil@lankaagro.lk', 'Colombo'),
(2, 'CIC Dairies & Foods', 'Kamal Fernando', '0778877222', 'kamal@cicfoods.lk', 'Kurunegala'),
(3, 'Ceylon Tea Exports Ltd', 'Nimal Silva', '0776655333', 'nimal@ceylontea.lk', 'Kandy')
ON DUPLICATE KEY UPDATE name=VALUES(name);

-- 3b. Roles
INSERT INTO roles (role_id, role_name, description) VALUES
(1, 'ADMIN', 'Full system and database administrative access'),
(2, 'MANAGER', 'Branch management, inventory, reports, and staff supervision'),
(3, 'CASHIER', 'POS billing, customer checkout, and sales transactions'),
(4, 'DB_MANAGER', 'Database schema, backups, indexes, and performance management'),
(5, 'HR', 'Human resources, staff records, and organizational administration')
ON DUPLICATE KEY UPDATE role_name=VALUES(role_name);

-- 4. Employees (BCrypt hashes for 'Password123!')
-- BCrypt: 
INSERT INTO employee (employee_id, branch_id, role_id, full_name, username, password_hash) VALUES
(1,   1, 1, 'System Administrator', 'admin',           ''),
(2,   1, 2, 'Arlene McCoy (Manager)', 'manager1',      ''),
(3,   1, 3, 'Floyd Miles (Cashier)', 'cashier1',       ''),
(100, 1, 1, 'Kavindu Perera (Admin)', 'admin_kavindu',  ''),
(101, 1, 3, 'Floyd Miles',            'cashier_floyd',  ''),
(102, 1, 2, 'Arlene McCoy',           'manager_arlene', ''),
(103, 2, 3, 'Kamal Gunaratne',        'cashier_kamal',  ''),
(104, 3, 2, 'Nimal Silva',            'manager_nimal',  '')
ON DUPLICATE KEY UPDATE full_name=VALUES(full_name), password_hash=VALUES(password_hash);

-- 5. Customers
INSERT INTO customer (customer_id, full_name, phone, email, loyalty_points, registered_date) VALUES
(1, 'Jacob Jones',    '0771234567', 'jacob@example.com',    420, '2023-01-15 10:00:00'),
(2, 'Bessie Coleman', '0772345678', 'bessie@example.com',   180, '2023-04-20 11:30:00'),
(3, 'Ralph Edwards',  '0773456789', 'ralph@example.com',    60,  '2024-01-10 14:15:00'),
(4, 'Devon Lane',     '0774567890', 'devon@example.com',    0,   '2024-03-01 09:00:00')
ON DUPLICATE KEY UPDATE full_name=VALUES(full_name);

-- 6. Products
INSERT INTO product (product_id, category_id, supplier_id, sku, name, unit_price, cost_price, diet_type, is_active) VALUES
(1, 1, 1, 'PRD-AVO-001', 'Fresh Hass Avocados (1kg)',  5.99,  3.50, 'VEG',     TRUE),
(2, 2, 1, 'PRD-RIC-002', 'Keeri Samba Rice (5kg)',    14.50, 10.00, 'VEG',     TRUE),
(3, 3, 2, 'PRD-MLK-003', 'Fresh Pasturised Milk 1L',   5.60,  3.80, 'VEG',     TRUE),
(4, 4, 3, 'PRD-TEA-004', 'Ceylon Orange Pekoe Tea',    4.80,  2.80, 'VEG',     TRUE),
(5, 5, 1, 'PRD-BRD-005', 'Whole Wheat Sourdough Bread', 3.40,  1.90, 'VEG',     TRUE),
(6, 1, 1, 'PRD-BAN-006', 'Organic Cavendish Bananas',  2.50,  1.20, 'VEG',     TRUE)
ON DUPLICATE KEY UPDATE name=VALUES(name);

-- 7. Inventory (Initial Stock per Branch)
INSERT INTO inventory (branch_id, product_id, quantity, reorder_level) VALUES
(1, 1, 45, 10),
(1, 2, 80, 20),
(1, 3, 60, 15),
(1, 4, 90, 20),
(1, 5, 30, 10),
(1, 6, 75, 15),
(2, 1, 20, 10),
(2, 2, 40, 15),
(2, 3, 35, 10)
ON DUPLICATE KEY UPDATE quantity=VALUES(quantity);

-- 8. Discount Rules
INSERT INTO discount_rule (rule_id, name, rule_type, kind, value, min_order_amount, max_discount, tier, start_date, end_date, priority, stackable, is_active) VALUES
(1,  'WELCOME 10',                      'FIRST_PURCHASE', 'PERCENT', 10.00, 0.00,    NULL,  NULL,     '2020-01-01', '2030-12-31', 10, TRUE,  TRUE),
(2,  'Special Holiday Promotion',       'HOLIDAY',        'PERCENT', 10.00, 0.00,    NULL,  NULL,     '2020-01-01', '2030-12-31', 30, TRUE,  TRUE),
(4,  'New Year Festive Coupon Voucher', 'COUPON',         'FIXED',   10.00, 30.00,   10.00, NULL,     '2020-01-01', '2030-12-31',  5, FALSE, TRUE),
(20, 'Silver Tier 5% Loyalty Discount', 'LOYALTY',        'PERCENT',  5.00, 500.00,  NULL,  'SILVER', '2020-01-01', '2030-12-31', 20, TRUE,  TRUE),
(21, 'Gold Tier 7% Loyalty Discount',   'LOYALTY',        'PERCENT',  7.00, 1000.00, NULL,  'GOLD',   '2020-01-01', '2030-12-31', 21, TRUE,  TRUE)
ON DUPLICATE KEY UPDATE name=VALUES(name), value=VALUES(value), min_order_amount=VALUES(min_order_amount), tier=VALUES(tier);

-- 9. Coupons
INSERT INTO coupon (code, rule_id, max_uses, used_count, expires_on) VALUES
('NEWYEAR50', 4, 500, 12, '2028-12-31'),
('WELCOME10', 1, 1000, 45, '2028-12-31')
ON DUPLICATE KEY UPDATE max_uses=VALUES(max_uses);

-- 10. Holidays
INSERT INTO holiday (holiday_date, name) VALUES
('2026-01-01', 'New Year Day'),
('2026-04-14', 'Sinhala and Tamil New Year'),
('2026-05-01', 'May Day'),
('2026-12-25', 'Christmas Day'),
(CURRENT_DATE, 'Today Special Supermarket Promotion')
ON DUPLICATE KEY UPDATE name=VALUES(name);
