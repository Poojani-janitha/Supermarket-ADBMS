package lk.supermarket.inventory.service;

import lk.supermarket.inventory.dao.InventoryDao;
import lk.supermarket.inventory.dto.InventoryItemDto;
import lk.supermarket.inventory.dto.LowStockAlertDto;
import lk.supermarket.inventory.dto.StockTransferRequest;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.List;

/**
 * Service orchestrating Inventory business workflows.
 * Pure coordinator: delegates SQL execution entirely to InventoryDao.
 */
@Service
public class InventoryService {

    private final InventoryDao inventoryDao;

    public InventoryService(InventoryDao inventoryDao) {
        this.inventoryDao = inventoryDao;
    }

    public List<InventoryItemDto> getInventoryByBranch(Integer branchId) {
        return inventoryDao.getInventory(branchId);
    }

    public List<LowStockAlertDto> getLowStockAlerts(Integer branchId) {
        return inventoryDao.getLowStockAlerts(branchId);
    }

    public BigDecimal getStockLevel(int branchId, int productId) {
        return inventoryDao.getStockLevel(branchId, productId);
    }

    public void transferStock(StockTransferRequest request) {
        inventoryDao.transferStock(
            request.getFromBranchId(),
            request.getToBranchId(),
            request.getProductId(),
            request.getQty()
        );
    }

    public void updateStockOptimistic(int branchId, int productId, BigDecimal newQty, int expectedVersion) {
        inventoryDao.updateStockOptimistic(branchId, productId, newQty, expectedVersion);
    }
}
