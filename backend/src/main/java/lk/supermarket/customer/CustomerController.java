package lk.supermarket.customer;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/customers")
@CrossOrigin(origins = "http://localhost:4200")
public class CustomerController {
    private final CustomerService customerService;

    public CustomerController(CustomerService customerService) {
        this.customerService = customerService;
    }

    @GetMapping
    public List<Map<String, Object>> customers() {
        return customerService.findCustomers();
    }

    @GetMapping("/{customerId}/orders")
    public List<Map<String, Object>> orders(@PathVariable int customerId) {
        return customerService.findOrders(customerId);
    }

    @GetMapping("/{customerId}/orders/{orderId}")
    public Map<String, Object> orderDetails(
            @PathVariable int customerId,
            @PathVariable int orderId) {
        return customerService.findOrderDetails(customerId, orderId);
    }

    @PutMapping("/{customerId}/orders/{orderId}")
    public Map<String, Object> updateOrderStatus(
            @PathVariable int customerId,
            @PathVariable int orderId,
            @RequestBody Map<String, Object> request) {
        String status = request.get("status") == null ? null : request.get("status").toString();
        return customerService.updateOrderStatus(customerId, orderId, status);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Map<String, Object> register(@RequestBody Map<String, Object> request) {
        Map<String, Object> parameters = new HashMap<>();
        parameters.put("p_full_name", request.get("fullName"));
        parameters.put("p_phone", request.get("phone"));
        parameters.put("p_email", request.get("email"));
        return Map.of("customerId", customerService.registerCustomer(parameters));
    }

    @PutMapping("/{customerId}")
    public Map<String, Object> update(
            @PathVariable int customerId,
            @RequestBody Map<String, Object> request) {
        return customerService.updateCustomer(customerId, request);
    }
}
