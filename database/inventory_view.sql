-- ----------------------------------------------------------------------------
-- 7. VIEW: v_low_stock
-- ----------------------------------------------------------------------------
CREATE OR REPLACE VIEW v_low_stock AS
SELECT i.branch_id, b.name AS branch, p.product_id, p.name AS product,
       p.unit_of_measure, i.quantity, i.reorder_level, i.version
FROM inventory i
JOIN product p ON p.product_id = i.product_id
JOIN branch b ON b.branch_id = i.branch_id
WHERE i.quantity <= i.reorder_level;