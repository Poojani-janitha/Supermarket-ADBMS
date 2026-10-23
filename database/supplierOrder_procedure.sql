-- ==============================================================================
-- STORED PROCEDURE: sp_supplier_confirm_order
-- Component: B2B Supplier / Vendor Order Confirmation
-- Endpoint:  POST /api/purchase-orders/confirm
-- ==============================================================================

USE supermarket_db;

DELIMITER $$

DROP PROCEDURE IF EXISTS sp_supplier_confirm_order$$

CREATE PROCEDURE sp_supplier_confirm_order(
    IN p_po_id INT,
    IN p_supplier_id INT,
    IN p_confirmed_qty DECIMAL(10,2),
    IN p_notes TEXT
)
BEGIN
    DECLARE v_unit_cost DECIMAL(10,2);

    -- Automatic transaction rollback on exception
    DECLARE EXIT HANDLER FOR SQLEXCEPTION 
    BEGIN 
        ROLLBACK; 
        RESIGNAL; 
    END;

    START TRANSACTION;

    -- 1. Amend fulfillable quantity for the requested purchase order item
    UPDATE purchase_order_item 
    SET confirmed_qty = p_confirmed_qty 
    WHERE po_id = p_po_id;

    -- 2. Fetch the negotiated unit cost to recalculate total order invoice
    SELECT unit_cost INTO v_unit_cost 
    FROM purchase_order_item 
    WHERE po_id = p_po_id 
    LIMIT 1;

    -- 3. Update purchase order status to CONFIRMED, record supplier dispatch note,
    --    recalculate total cost, and timestamp vendor confirmation
    UPDATE purchase_order 
    SET status = 'CONFIRMED', 
        supplier_notes = p_notes, 
        total_cost = (v_unit_cost * p_confirmed_qty), 
        confirmed_at = CURRENT_TIMESTAMP
    WHERE po_id = p_po_id AND supplier_id = p_supplier_id;

    COMMIT;
END$$

DELIMITER ;

-- ==============================================================================
-- VERIFICATION QUERY / CALL EXAMPLE:
-- ==============================================================================
-- CALL sp_supplier_confirm_order(
--     102,                                           -- p_po_id
--     3,                                             -- p_supplier_id (Highland Dairy Farms)
--     45.00,                                         -- p_confirmed_qty
--     '45 L dispatched in refrigerated containers'   -- p_notes
-- );
--
-- SELECT po_id, supplier_id, status, total_cost, supplier_notes, confirmed_at 
-- FROM purchase_order WHERE po_id = 102;



