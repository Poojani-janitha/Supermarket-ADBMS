CREATE OR REPLACE VIEW v_product_catalog AS
SELECT
  p.product_id,
  p.sku,
  p.name AS product_name,
  p.category_id,
  c.name AS category_name,
  c.parent_id AS category_parent_id,
  parent.name AS category_parent_name,
  p.supplier_id,
  s.name AS supplier_name,
  p.unit_price,
  p.cost_price,
  p.image_url,
  p.diet_type,
  p.unit_of_measure,
  p.min_order_qty,
  p.is_active
FROM product p
JOIN category c ON c.category_id = p.category_id
LEFT JOIN category parent ON parent.category_id = c.parent_id
JOIN supplier s ON s.supplier_id = p.supplier_id;
