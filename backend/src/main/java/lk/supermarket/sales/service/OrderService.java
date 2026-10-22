package lk.supermarket.sales.service;

import lk.supermarket.sales.dao.OrderDao;
import lk.supermarket.sales.dto.CheckoutRequest;
import lk.supermarket.sales.dto.SalesOrderResponse;
import lk.supermarket.sales.dto.SalesPageResponse;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class OrderService {

    private final OrderDao orderDao;

    public OrderService(OrderDao orderDao) {
        this.orderDao = orderDao;
    }

    /**
     * Coordinates atomic order checkout.
     * Delegates inventory checks, row locking, and discount math entirely to MySQL stored procedures.
     */
    public SalesOrderResponse checkout(CheckoutRequest req) {
        if (req.getItems() == null || req.getItems().isEmpty()) {
            throw new IllegalArgumentException("Cart cannot be empty");
        }

        if (req.getEmployeeId() == null || req.getEmployeeId() <= 0) {
            req.setEmployeeId(101); // Default to active cashier Floyd Miles
        }

        // Invoke sp_place_order
        int newOrderId = orderDao.callPlaceOrder(req);

        // Fetch receipt representation assembled from clustered tables
        return orderDao.findOrderById(newOrderId)
                .orElseThrow(() -> new IllegalStateException("Order created but could not be retrieved"));
    }

    /**
     * Coordinates order cancellation.
     */
    public SalesOrderResponse cancelOrder(int orderId, int employeeId) {
        orderDao.callCancelOrder(orderId, employeeId);
        return orderDao.findOrderById(orderId)
                .orElseThrow(() -> new IllegalStateException("Order cancelled but could not be retrieved"));
    }

    /**
     * Retrieves completed order for receipt viewing or customer inspection.
     */
    public Optional<SalesOrderResponse> getOrder(int orderId) {
        return orderDao.findOrderById(orderId);
    }

    public java.util.Map<Integer, Integer> getBranchStock(int branchId) {
        return orderDao.getBranchStock(branchId);
    }

    /**
     * Retrieves paginated recent sales for sales management dashboard.
     */
    public SalesPageResponse getRecentOrders(int page, int size) {
        return orderDao.findRecentOrders(page, size);
    }
}
