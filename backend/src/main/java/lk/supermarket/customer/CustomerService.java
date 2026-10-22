package lk.supermarket.customer;

import java.util.List;
import java.util.Map;
import org.springframework.stereotype.Service;

@Service
public class CustomerService {
    private final CustomerDao customerDao;

    public CustomerService(CustomerDao customerDao) {
        this.customerDao = customerDao;
    }

    public List<Map<String, Object>> findCustomers() {
        return customerDao.findCustomers();
    }

    public List<Map<String, Object>> findOrders(int customerId) {
        return customerDao.findOrders(customerId);
    }

    public Map<String, Object> findOrderDetails(int customerId, int orderId) {
        return customerDao.findOrderDetails(customerId, orderId);
    }

    public Map<String, Object> updateOrderStatus(int customerId, int orderId, String status) {
        return customerDao.updateOrderStatus(customerId, orderId, status);
    }

    public int registerCustomer(Map<String, ?> parameters) {
        return customerDao.registerCustomer(parameters);
    }

    public Map<String, Object> updateCustomer(int customerId, Map<String, ?> request) {
        return customerDao.updateCustomer(customerId, request);
    }
}
