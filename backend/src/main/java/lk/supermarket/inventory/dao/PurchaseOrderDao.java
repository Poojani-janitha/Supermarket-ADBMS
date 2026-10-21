package lk.supermarket.inventory.dao;

import lk.supermarket.inventory.dto.ConfirmPoRequest;
import lk.supermarket.inventory.dto.CreatePoRequest;
import lk.supermarket.inventory.dto.PurchaseOrderDto;
import lk.supermarket.inventory.dto.ReceivePoRequest;
import org.springframework.jdbc.core.CallableStatementCreator;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.jdbc.core.SqlOutParameter;
import org.springframework.jdbc.core.SqlParameter;
import org.springframework.stereotype.Repository;

import java.sql.CallableStatement;
import java.sql.Types;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Map;

/**
 * Data Access Object for Purchase Orders & Supply Chain reconciliation.
 * Strictly uses Spring JDBC (JdbcTemplate). NO ORM / Hibernate / JPA.
 */
@Repository
public class PurchaseOrderDao {

    private final JdbcTemplate jdbcTemplate;

    public PurchaseOrderDao(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    private final RowMapper<PurchaseOrderDto> poRowMapper = (rs, rowNum) -> {
        PurchaseOrderDto dto = new PurchaseOrderDto();
        dto.setPoId(rs.getInt("po_id"));
        dto.setSupplierId(rs.getInt("supplier_id"));
        dto.setSupplierName(rs.getString("supplier_name"));
        dto.setBranchId(rs.getInt("branch_id"));
        dto.setBranchName(rs.getString("branch_name"));
        dto.setProductId(rs.getInt("product_id"));
        dto.setProductName(rs.getString("product_name"));
        dto.setSku(rs.getString("sku"));
        dto.setUnitOfMeasure(rs.getString("unit_of_measure"));
        dto.setRequestedQty(rs.getBigDecimal("requested_qty"));
        dto.setConfirmedQty(rs.getBigDecimal("confirmed_qty"));
        dto.setReceivedQty(rs.getBigDecimal("received_qty"));
        dto.setUnitCost(rs.getBigDecimal("unit_cost"));
        dto.setTotalCost(rs.getBigDecimal("total_cost"));
        dto.setStatus(rs.getString("status"));
        dto.setOrderDate(rs.getString("order_date"));
        dto.setConfirmedAt(rs.getString("confirmed_at"));
        dto.setReceivedAt(rs.getString("received_at"));
        dto.setSupplierNotes(rs.getString("supplier_notes"));
        dto.setReceivingNotes(rs.getString("receiving_notes"));
        dto.setRequestedBy(rs.getString("requested_by_name"));
        dto.setReceivedBy(rs.getString("received_by_name"));
        return dto;
    };

    /**
     * Retrieve purchase orders filtered by branch or supplier.
     * Demonstrates 3-way quantity matching (Requested, Confirmed, Received).
     */
    public List<PurchaseOrderDto> getPurchaseOrders(Integer branchId, Integer supplierId) {
        StringBuilder sql = new StringBuilder("""
            SELECT po.po_id, po.supplier_id, s.name AS supplier_name,
                   po.branch_id, b.name AS branch_name,
                   poi.product_id, p.name AS product_name, p.sku, p.unit_of_measure,
                   poi.requested_qty, poi.confirmed_qty, poi.received_qty, poi.unit_cost,
                   po.total_cost, po.status, 
                   DATE_FORMAT(po.order_date, '%Y-%m-%d %H:%i') AS order_date,
                   DATE_FORMAT(po.confirmed_at, '%Y-%m-%d %H:%i') AS confirmed_at,
                   DATE_FORMAT(po.received_at, '%Y-%m-%d %H:%i') AS received_at,
                   po.supplier_notes, po.receiving_notes,
                   req_emp.full_name AS requested_by_name,
                   rec_emp.full_name AS received_by_name
            FROM purchase_order po
            JOIN purchase_order_item poi ON poi.po_id = po.po_id
            JOIN supplier s ON s.supplier_id = po.supplier_id
            JOIN branch b ON b.branch_id = po.branch_id
            JOIN product p ON p.product_id = poi.product_id
            LEFT JOIN employee req_emp ON req_emp.employee_id = po.requested_by
            LEFT JOIN employee rec_emp ON rec_emp.employee_id = po.received_by
            WHERE 1=1
            """);

        List<Object> params = new ArrayList<>();
        if (branchId != null) {
            sql.append(" AND po.branch_id = ?");
            params.add(branchId);
        }
        if (supplierId != null) {
            sql.append(" AND po.supplier_id = ?");
            params.add(supplierId);
        }
        sql.append(" ORDER BY po.po_id DESC");

        return jdbcTemplate.query(sql.toString(), poRowMapper, params.toArray());
    }

    /**
     * Retrieve single purchase order by ID.
     */
    public PurchaseOrderDto getPurchaseOrderById(int poId) {
        String sql = """
            SELECT po.po_id, po.supplier_id, s.name AS supplier_name,
                   po.branch_id, b.name AS branch_name,
                   poi.product_id, p.name AS product_name, p.sku, p.unit_of_measure,
                   poi.requested_qty, poi.confirmed_qty, poi.received_qty, poi.unit_cost,
                   po.total_cost, po.status, 
                   DATE_FORMAT(po.order_date, '%Y-%m-%d %H:%i') AS order_date,
                   DATE_FORMAT(po.confirmed_at, '%Y-%m-%d %H:%i') AS confirmed_at,
                   DATE_FORMAT(po.received_at, '%Y-%m-%d %H:%i') AS received_at,
                   po.supplier_notes, po.receiving_notes,
                   req_emp.full_name AS requested_by_name,
                   rec_emp.full_name AS received_by_name
            FROM purchase_order po
            JOIN purchase_order_item poi ON poi.po_id = po.po_id
            JOIN supplier s ON s.supplier_id = po.supplier_id
            JOIN branch b ON b.branch_id = po.branch_id
            JOIN product p ON p.product_id = poi.product_id
            LEFT JOIN employee req_emp ON req_emp.employee_id = po.requested_by
            LEFT JOIN employee rec_emp ON rec_emp.employee_id = po.received_by
            WHERE po.po_id = ?
            """;
        List<PurchaseOrderDto> results = jdbcTemplate.query(sql, poRowMapper, poId);
        return results.isEmpty() ? null : results.get(0);
    }

    /**
     * Call Stored Procedure: sp_create_purchase_order
     * Returns generated purchase order ID (OUT parameter).
     */
    public Integer createPurchaseOrder(CreatePoRequest req) {
        CallableStatementCreator csc = con -> {
            CallableStatement cs = con.prepareCall("{CALL sp_create_purchase_order(?, ?, ?, ?, ?, ?)}");
            cs.setInt(1, req.getSupplierId());
            cs.setInt(2, req.getBranchId());
            cs.setInt(3, req.getEmployeeId());
            cs.setInt(4, req.getProductId());
            cs.setBigDecimal(5, req.getQty());
            cs.registerOutParameter(6, Types.INTEGER);
            return cs;
        };

        List<SqlParameter> declaredParams = Arrays.asList(
            new SqlParameter(Types.INTEGER),
            new SqlParameter(Types.INTEGER),
            new SqlParameter(Types.INTEGER),
            new SqlParameter(Types.INTEGER),
            new SqlParameter(Types.DECIMAL),
            new SqlOutParameter("p_po_id", Types.INTEGER)
        );

        Map<String, Object> results = jdbcTemplate.call(csc, declaredParams);
        Number poId = (Number) results.get("p_po_id");
        return poId != null ? poId.intValue() : null;
    }

    /**
     * Call Stored Procedure: sp_supplier_confirm_order
     * Used by B2B Supplier Portal to amend quantities and confirm dispatch.
     */
    public void confirmOrder(ConfirmPoRequest req) {
        String sql = "CALL sp_supplier_confirm_order(?, ?, ?, ?)";
        jdbcTemplate.update(sql, req.getPoId(), req.getSupplierId(), req.getConfirmedQty(), req.getNotes());
    }

    /**
     * Call Stored Procedure: sp_receive_purchase
     * GRN physical delivery receipt: increments inventory, bumps version, resolves low stock.
     */
    public void receiveOrder(ReceivePoRequest req) {
        String sql = "CALL sp_receive_purchase(?, ?, ?, ?)";
        jdbcTemplate.update(sql, req.getPoId(), req.getEmployeeId(), req.getReceivedQty(), req.getNotes());
    }
}
