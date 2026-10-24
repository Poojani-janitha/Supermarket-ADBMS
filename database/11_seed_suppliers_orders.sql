-- ==============================================================================
-- SUPERMARKET CHAIN MANAGEMENT SYSTEM (ICT3222 ADBMS)
-- Script 11: Seed Suppliers and Purchase Orders
-- Engine: MySQL 8.0 (InnoDB)
-- ==============================================================================

USE supermarket_db;

-- 1. Insert/Update Suppliers
INSERT INTO supplier (supplier_id, name, contact_person, phone, email, username, city, tax_number, is_active, status) VALUES
(1, 'Lanka Fresh Organics Ltd', 'Sunil Bandara', '077-1234567', 'orders@lankafresh.lk', 'supplier_organics', 'Colombo', 'V-10293847', TRUE, 'ACTIVE'),
(2, 'Ceylon Agro Grain Mills', 'Anura Jayasuriya', '071-2345678', 'sales@ceylonagro.lk', 'supplier_agro', 'Kurunegala', 'V-55667788', TRUE, 'ACTIVE'),
(3, 'Highland Dairy Farms', 'Priya Fernando', '072-3456789', 'supplies@highlanddairy.lk', 'supplier_dairy', 'Nuwara Eliya', 'V-99887766', TRUE, 'ACTIVE'),
(4, 'Ocean Harvest Seafoods', 'Jude Cooray', '076-4567890', 'info@oceanharvest.lk', 'supplier_ocean', 'Negombo', 'V-33445566', TRUE, 'ACTIVE'),
(5, 'Dilmah Ceylon Tea Estates', 'Rohan Dilmah', '077-5678901', 'trade@dilmahtea.lk', 'supplier_dilmah', 'Kandy', 'V-11223344', TRUE, 'ACTIVE'),
(6, 'Colombo Artisan Bakehouse', 'Malik Wickramasinghe', '075-6789012', 'orders@colombobake.lk', 'supplier_bakehouse', 'Colombo', 'V-77889900', TRUE, 'ACTIVE'),
(7, 'Mediterranean Olive Orchards', 'Tariq Mansoor', '071-7890123', 'imports@medolive.lk', 'supplier_olive', 'Colombo', 'V-44332211', TRUE, 'ACTIVE')
ON DUPLICATE KEY UPDATE 
  name=VALUES(name), contact_person=VALUES(contact_person), phone=VALUES(phone), email=VALUES(email),
  username=VALUES(username), city=VALUES(city), tax_number=VALUES(tax_number), is_active=VALUES(is_active), status=VALUES(status);

-- 2. Insert/Update Purchase Orders
INSERT INTO purchase_order (po_id, supplier_id, branch_id, requested_by, received_by, order_date, confirmed_at, received_at, status, total_cost, supplier_notes, receiving_notes) VALUES
(101, 1, 1, 2, 3, '2026-10-10 09:00:00', '2026-10-10 11:30:00', '2026-10-11 08:45:00', 'RECEIVED', 350.00, 'Direct from Nuwara Eliya organic orchards.', 'Inspected upon delivery: 100 units intact, cold-chain verified.'),
(102, 2, 1, 2, NULL, '2026-10-12 10:00:00', '2026-10-12 14:00:00', NULL, 'CONFIRMED', 980.00, 'Standard 25kg moisture-proof sacks ready for transit.', NULL),
(103, 3, 2, 2, 3, '2026-10-08 08:30:00', '2026-10-08 10:15:00', '2026-10-09 09:00:00', 'RECEIVED', 456.00, 'Chilled milk cartons loaded in refrigerated carrier.', 'Temperature recorded at 4 deg C upon intake. Restocked in dairy aisle.'),
(104, 4, 1, 2, NULL, '2026-10-14 11:00:00', '2026-10-14 13:00:00', NULL, 'CONFIRMED', 312.00, 'Iced transport container. 36 of 40 KG verified premium catch.', NULL),
(105, 5, 3, 2, 3, '2026-10-05 14:00:00', '2026-10-05 16:30:00', '2026-10-07 10:00:00', 'RECEIVED', 560.00, 'Single-origin highland leaf tea caddies.', 'Passed QC moisture check.'),
(106, 6, 1, 2, NULL, '2026-10-15 07:00:00', NULL, NULL, 'REQUESTED', 190.00, NULL, NULL),
(107, 7, 1, 2, NULL, '2026-10-11 15:00:00', '2026-10-12 09:00:00', NULL, 'CONFIRMED', 320.00, 'Import consignment partial allotment: 38 of 50 units ready.', NULL)
ON DUPLICATE KEY UPDATE 
  supplier_id=VALUES(supplier_id), branch_id=VALUES(branch_id), requested_by=VALUES(requested_by),
  received_by=VALUES(received_by), order_date=VALUES(order_date), confirmed_at=VALUES(confirmed_at),
  received_at=VALUES(received_at), status=VALUES(status), total_cost=VALUES(total_cost),
  supplier_notes=VALUES(supplier_notes), receiving_notes=VALUES(receiving_notes);

-- 3. Insert/Update Purchase Order Items
INSERT INTO purchase_order_item (po_id, product_id, requested_qty, confirmed_qty, received_qty, unit_cost) VALUES
(101, 1, 100.00, 100.00, 100.00, 3.50),
(102, 2, 100.00, 98.00, NULL, 10.00),
(103, 3, 120.00, 120.00, 120.00, 3.80),
(104, 4, 40.00, 36.00, NULL, 8.66),
(105, 4, 200.00, 200.00, 200.00, 2.80),
(106, 5, 100.00, NULL, NULL, 1.90),
(107, 6, 50.00, 38.00, NULL, 8.42)
ON DUPLICATE KEY UPDATE 
  requested_qty=VALUES(requested_qty), confirmed_qty=VALUES(confirmed_qty),
  received_qty=VALUES(received_qty), unit_cost=VALUES(unit_cost);
