package lk.supermarket.inventory.dao;

import lk.supermarket.inventory.dto.InventoryItemDto;
import lk.supermarket.inventory.dto.LowStockAlertDto;
import org.springframework.dao.OptimisticLockingFailureException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;

/**
 * Data Access Object for Inventory operations.
 * Strictly uses Spring JDBC (JdbcTemplate). NO ORM / Hibernate / JPA.
 */
@Repository
public class InventoryDao {

    private final JdbcTemplate jdbcTemplate;

    public InventoryDao(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    private final RowMapper<InventoryItemDto> inventoryRowMapper = (rs, rowNum) -> {
        InventoryItemDto item = new InventoryItemDto();
        item.setBranchId(rs.getInt("branch_id"));
        item.setBranchName(rs.getString("branch_name"));
        item.setProductId(rs.getInt("product_id"));
        item.setProductName(rs.getString("product_name"));
        item.setSku(rs.getString("sku"));
        item.setQuantity(rs.getBigDecimal("quantity"));
        item.setReorderLevel(rs.getBigDecimal("reorder_level"));
        item.setUnitOfMeasure(rs.getString("unit_of_measure"));
        item.setVersion(rs.getInt("version"));
        BigDecimal qty = item.getQuantity() != null ? item.getQuantity() : BigDecimal.ZERO;
        BigDecimal reorder = item.getReorderLevel() != null ? item.getReorderLevel() : BigDecimal.ZERO;
        item.setLowStock(qty.compareTo(reorder) <= 0);
        return item;
    };

    private final RowMapper<LowStockAlertDto> lowStockAlertRowMapper = (rs, rowNum) -> {
        LowStockAlertDto alert = new LowStockAlertDto();
        alert.setBranchId(rs.getInt("branch_id"));
        alert.setBranchName(rs.getString("branch"));
        alert.setProductId(rs.getInt("product_id"));
        alert.setProductName(rs.getString("product"));
        alert.setUnitOfMeasure(rs.getString("unit_of_measure"));
        alert.setQuantity(rs.getBigDecimal("quantity"));
        alert.setReorderLevel(rs.getBigDecimal("reorder_level"));
        alert.setVersion(rs.getInt("version"));
        alert.setResolved(false);
        return alert;
    };

    /**
     * Retrieve all inventory items for a specific branch or all branches.
     */
    public List<InventoryItemDto> getInventory(Integer branchId) {
        if (branchId != null) {
            String sql = """
                SELECT i.branch_id, b.name AS branch_name, 
                       i.product_id, p.name AS product_name, p.sku, 
                       i.quantity, i.reorder_level, p.unit_of_measure, i.version
                FROM inventory i
                JOIN product p ON p.product_id = i.product_id
                JOIN branch b ON b.branch_id = i.branch_id
                WHERE i.branch_id = ?
                ORDER BY p.name ASC
                """;
            return jdbcTemplate.query(sql, inventoryRowMapper, branchId);
        } else {
            String sql = """
                SELECT i.branch_id, b.name AS branch_name, 
                       i.product_id, p.name AS product_name, p.sku, 
                       i.quantity, i.reorder_level, p.unit_of_measure, i.version
                FROM inventory i
                JOIN product p ON p.product_id = i.product_id
                JOIN branch b ON b.branch_id = i.branch_id
                ORDER BY b.name ASC, p.name ASC
                """;
            return jdbcTemplate.query(sql, inventoryRowMapper);
        }
    }

    /**
     * Query analytical view: v_low_stock
     */
    public List<LowStockAlertDto> getLowStockAlerts(Integer branchId) {
        if (branchId != null) {
            String sql = "SELECT * FROM v_low_stock WHERE branch_id = ?";
            return jdbcTemplate.query(sql, lowStockAlertRowMapper, branchId);
        } else {
            String sql = "SELECT * FROM v_low_stock";
            return jdbcTemplate.query(sql, lowStockAlertRowMapper);
        }
    }

    /**
     * Call User Defined Function (UDF): fn_stock_level(p_branch, p_product)
     */
    public BigDecimal getStockLevel(int branchId, int productId) {
        String sql = "SELECT fn_stock_level(?, ?)";
        BigDecimal stock = jdbcTemplate.queryForObject(sql, BigDecimal.class, branchId, productId);
        return stock != null ? stock : BigDecimal.ZERO;
    }

    /**
     * Call Stored Procedure: sp_transfer_stock(fromBranch, toBranch, productId, qty)
     * Executes atomic inter-branch stock transfer with pessimistic row lock.
     */
    public void transferStock(int fromBranchId, int toBranchId, int productId, BigDecimal qty) {
        String sql = "CALL sp_transfer_stock(?, ?, ?, ?)";
        jdbcTemplate.update(sql, fromBranchId, toBranchId, productId, qty);
    }

    /**
     * Optimistic locking direct stock adjustment.
     * Prevents lost updates by validating the version column.
     */
    public void updateStockOptimistic(int branchId, int productId, BigDecimal newQty, int expectedVersion) {
        String sql = """
            UPDATE inventory 
            SET quantity = ?, version = version + 1 
            WHERE branch_id = ? AND product_id = ? AND version = ?
            """;
        int rowsAffected = jdbcTemplate.update(sql, newQty, branchId, productId, expectedVersion);
        if (rowsAffected == 0) {
            throw new OptimisticLockingFailureException(
                "Concurrent update conflict: Inventory record (branch: " + branchId + 
                ", product: " + productId + ") was modified by another transaction. Version mismatch."
            );
        }
    }
}
