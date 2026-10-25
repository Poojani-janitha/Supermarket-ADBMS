-- 6. FUNCTION: fn_stock_level
-- Lookup current branch stock for product
-- ----------------------------------------------------------------------------
DROP FUNCTION IF EXISTS fn_stock_level$$
CREATE FUNCTION fn_stock_level(p_branch INT, p_product INT) RETURNS DECIMAL(10,2)
READS SQL DATA
BEGIN
  DECLARE v_qty DECIMAL(10,2);
  SELECT quantity INTO v_qty FROM inventory
  WHERE branch_id = p_branch AND product_id = p_product;
  RETURN COALESCE(v_qty, 0.00);
END$$

DELIMITER ;