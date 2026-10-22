package lk.supermarket.sales.controller;

import jakarta.validation.Valid;
import lk.supermarket.sales.dto.AppliedDiscountDto;
import lk.supermarket.sales.dto.CheckoutRequest;
import lk.supermarket.sales.dto.SalesOrderResponse;
import lk.supermarket.sales.service.OrderService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/orders")
public class OrderController {

    private final OrderService orderService;

    public OrderController(OrderService orderService) {
        this.orderService = orderService;
    }

    /**
     * Checkout Endpoint: Atomic order creation.
     * Invoked by Angular CartService.placeOrder().
     */
    @PostMapping
    public ResponseEntity<SalesOrderResponse> checkout(@Valid @RequestBody CheckoutRequest request) {
        SalesOrderResponse response = orderService.checkout(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * Get Order Receipt Endpoint:
     * Invoked by ReceiptModalComponent and Order Lookup.
     */
    @GetMapping("/{id}")
    public ResponseEntity<SalesOrderResponse> getOrder(@PathVariable("id") int id) {
        return orderService.getOrder(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * Cancel Order Endpoint:
     * Invoked by PosComponent "Cancel Order" button in Lookup Modal.
     */
    @PostMapping("/{id}/cancel")
    public ResponseEntity<SalesOrderResponse> cancelOrder(
            @PathVariable("id") int id,
            @RequestBody(required = false) Map<String, Integer> payload) {
        int employeeId = (payload != null && payload.containsKey("employeeId")) ? payload.get("employeeId") : 2;
        SalesOrderResponse response = orderService.cancelOrder(id, employeeId);
        return ResponseEntity.ok(response);
    }

    /**
     * Get Applied Discounts Endpoint.
     */
    @GetMapping("/{id}/discounts")
    public ResponseEntity<List<AppliedDiscountDto>> getOrderDiscounts(@PathVariable("id") int id) {
        return orderService.getOrder(id)
                .map(order -> ResponseEntity.ok(order.getDiscounts()))
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * Get Branch Inventory Stock Levels Endpoint for POS screen.
     */
    @GetMapping("/stock")
    public ResponseEntity<Map<Integer, Integer>> getBranchStock(
            @RequestParam(value = "branchId", defaultValue = "1") int branchId) {
        return ResponseEntity.ok(orderService.getBranchStock(branchId));
    }
}
