package lk.supermarket.inventory.controller;

import jakarta.validation.Valid;
import lk.supermarket.inventory.dto.ApiResponse;
import lk.supermarket.inventory.dto.ConfirmPoRequest;
import lk.supermarket.inventory.dto.CreatePoRequest;
import lk.supermarket.inventory.dto.PurchaseOrderDto;
import lk.supermarket.inventory.dto.ReceivePoRequest;
import lk.supermarket.inventory.service.PurchaseOrderService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST Controller for Purchase Orders & 3-Way Reconciliation.
 * Handles HTTP requests and delegates to PurchaseOrderService.
 */
@RestController
@RequestMapping({"/purchase-orders", "/api/purchase-orders"})
@CrossOrigin(origins = {"http://localhost:4200", "http://127.0.0.1:4200"})
public class PurchaseOrderController {

    private final PurchaseOrderService purchaseOrderService;

    public PurchaseOrderController(PurchaseOrderService purchaseOrderService) {
        this.purchaseOrderService = purchaseOrderService;
    }

    /**
     * Get purchase orders, optionally filtered by branch or supplier.
     * GET /api/purchase-orders?branchId=1&supplierId=2
     */
    @GetMapping
    public ResponseEntity<List<PurchaseOrderDto>> getOrders(
            @RequestParam(required = false) Integer branchId,
            @RequestParam(required = false) Integer supplierId) {
        List<PurchaseOrderDto> orders = purchaseOrderService.getOrders(branchId, supplierId);
        return ResponseEntity.ok(orders);
    }

    /**
     * Get purchase order by ID.
     * GET /api/purchase-orders/{id}
     */
    @GetMapping("/{id}")
    public ResponseEntity<PurchaseOrderDto> getOrderById(@PathVariable int id) {
        PurchaseOrderDto order = purchaseOrderService.getOrderById(id);
        if (order == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(order);
    }

    /**
     * Create a new purchase order requisition (Status: REQUESTED).
     * POST /api/purchase-orders
     */
    @PostMapping
    public ResponseEntity<ApiResponse<Integer>> createOrder(
            @Valid @RequestBody CreatePoRequest request) {
        Integer poId = purchaseOrderService.createOrder(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(
            ApiResponse.ok("Purchase Order #PO-" + poId + " created successfully.", poId)
        );
    }

    /**
     * B2B Supplier Portal: Confirm order and amend quantity (Status: CONFIRMED).
     * POST /api/purchase-orders/confirm
     */
    @PostMapping("/confirm")
    public ResponseEntity<ApiResponse<Void>> confirmOrder(
            @Valid @RequestBody ConfirmPoRequest request) {
        purchaseOrderService.confirmOrder(request);
        return ResponseEntity.ok(
            ApiResponse.ok("Purchase Order #PO-" + request.getPoId() + " confirmed by supplier.")
        );
    }

    /**
     * Goods Receipt Note (GRN): Physical receiving & inventory restock (Status: RECEIVED).
     * POST /api/purchase-orders/receive
     */
    @PostMapping("/receive")
    public ResponseEntity<ApiResponse<Void>> receiveOrder(
            @Valid @RequestBody ReceivePoRequest request) {
        purchaseOrderService.receiveOrder(request);
        return ResponseEntity.ok(
            ApiResponse.ok("Shipment for Purchase Order #PO-" + request.getPoId() + 
                           " received and restocked into branch inventory successfully.")
        );
    }
}
