-- ============================================================================
-- SUPERMARKET CHAIN MANAGEMENT SYSTEM
-- ICT3222 Advanced Database Management Systems (ADBMS)
-- Script 07: Member 1 Scheduled Events (Sales Reconciliation & Maintenance)
-- Engine: MySQL 8.0 (InnoDB)
-- ============================================================================

USE supermarket_db;

-- Ensure MySQL Event Scheduler is globally enabled
SET GLOBAL event_scheduler = ON;

-- ============================================================================
-- MEMBER 1 EVENT 1: Nightly Sales Summary & Reconciliation
-- Schedule: Executes every night at 23:59:00
-- Purpose: Precomputes daily sales aggregates per branch into daily_sales_summary
--          using atomic ON DUPLICATE KEY UPDATE.
-- ============================================================================
DELIMITER $$

DROP EVENT IF EXISTS ev_sales_daily_reconciliation$$

CREATE EVENT ev_sales_daily_reconciliation
ON SCHEDULE EVERY 1 DAY 
STARTS (TIMESTAMP(CURDATE()) + INTERVAL 23 HOUR + INTERVAL 59 MINUTE)
COMMENT 'Nightly sales aggregation and branch reconciliation'
DO
BEGIN
  -- Aggregate completed sales transactions into daily_sales_summary
  INSERT INTO daily_sales_summary (summary_date, branch_id, total_orders, total_sales)
  SELECT 
    DATE(order_date) AS summary_date,
    branch_id,
    COUNT(order_id) AS total_orders,
    COALESCE(SUM(total_amount), 0.00) AS total_sales
  FROM sales_order
  WHERE status = 'COMPLETED'
    AND DATE(order_date) = CURDATE()
  GROUP BY DATE(order_date), branch_id
  ON DUPLICATE KEY UPDATE
    total_orders = VALUES(total_orders),
    total_sales  = VALUES(total_sales);
END$$

-- ============================================================================
-- MEMBER 1 EVENT 2: Periodic Abandoned Stock Audit Clean-up
-- Schedule: Executes on the 1st of every month
-- Purpose: Purges sales stock audit log entries older than 24 months to maintain 
--          optimal B-Tree index performance.
-- ============================================================================
DROP EVENT IF EXISTS ev_sales_audit_cleanup$$

CREATE EVENT ev_sales_audit_cleanup
ON SCHEDULE EVERY 1 MONTH
STARTS (TIMESTAMP(CURDATE()) + INTERVAL 1 DAY + INTERVAL 2 HOUR)
COMMENT 'Monthly purge of historical stock audit log records older than 2 years'
DO
BEGIN
  DELETE FROM stock_audit_log 
  WHERE logged_at < NOW() - INTERVAL 24 MONTH 
    AND reason IN ('SALE', 'CANCEL');
END$$

DELIMITER ;
