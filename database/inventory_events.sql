-- ----------------------------------------------------------------------------
-- 8. SCHEDULED EVENT: ev_weekly_low_stock_scan
-- ----------------------------------------------------------------------------
SET GLOBAL event_scheduler = ON;

CREATE EVENT IF NOT EXISTS ev_weekly_low_stock_scan
ON SCHEDULE EVERY 1 WEEK
DO
  INSERT INTO low_stock_alert (branch_id, product_id, quantity)
  SELECT i.branch_id, i.product_id, i.quantity FROM inventory i
  WHERE i.quantity <= i.reorder_level
    AND NOT EXISTS (
      SELECT 1 FROM low_stock_alert a
      WHERE a.branch_id = i.branch_id AND a.product_id = i.product_id AND a.resolved = FALSE
    );
