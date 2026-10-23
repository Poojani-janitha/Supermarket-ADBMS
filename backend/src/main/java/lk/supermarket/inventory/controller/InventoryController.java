package lk.supermarket.inventory.controller;

import jakarta.validation.Valid;
import lk.supermarket.inventory.dto.ApiResponse;
import lk.supermarket.inventory.dto.InventoryItemDto;
import lk.supermarket.inventory.dto.LowStockAlertDto;
import lk.supermarket.inventory.dto.StockTransferRequest;
import lk.supermarket.inventory.service.InventoryService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;

/**
 * REST Controller for Inventory operations.
 * Handles HTTP requests and delegates to InventoryService.
 */
@RestController
@RequestMapping({"/inventory", "/api/inventory"})
@CrossOrigin(origins = {"http://localhost:4200", "http://127.0.0.1:4200"})
public class InventoryController {

    private final InventoryService inventoryService;

    public InventoryController(InventoryService inventoryService) {
        this.inventoryService = inventoryService;
    }

    /**
     * Get inventory items, optionally filtered by branch.
     * GET /api/inventory?branchId=1
     */
    @GetMapping
    public ResponseEntity<List<InventoryItemDto>> getInventory(
            @RequestParam(required = false) Integer branchId) {
        List<InventoryItemDto> items = inventoryService.getInventoryByBranch(branchId);
        return ResponseEntity.ok(items);
    }

    /**
     * Query low stock items via view v_low_stock.
     * GET /api/inventory/low-stock?branchId=1
     */
    @GetMapping("/low-stock")
    public ResponseEntity<List<LowStockAlertDto>> getLowStock(
            @RequestParam(required = false) Integer branchId) {
        List<LowStockAlertDto> alerts = inventoryService.getLowStockAlerts(branchId);
        return ResponseEntity.ok(alerts);
    }

    /**
     * Scalar UDF lookup: fn_stock_level
     * GET /api/inventory/level?branchId=1&productId=3
     */
    @GetMapping("/level")
    public ResponseEntity<BigDecimal> getStockLevel(
            @RequestParam int branchId,
            @RequestParam int productId) {
        BigDecimal level = inventoryService.getStockLevel(branchId, productId);
        return ResponseEntity.ok(level);
    }

    /**
     * Inter-branch stock transfer via sp_transfer_stock.
     * POST /api/inventory/transfer
     */
    @PostMapping("/transfer")
    public ResponseEntity<ApiResponse<Void>> transferStock(
            @Valid @RequestBody StockTransferRequest request) {
        inventoryService.transferStock(request);
        return ResponseEntity.ok(ApiResponse.ok(
            String.format("Successfully transferred %s units from branch %d to branch %d.",
                request.getQty().toPlainString(), request.getFromBranchId(), request.getToBranchId())
        ));
    }
}
