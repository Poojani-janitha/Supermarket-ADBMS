package lk.supermarket.discount;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/discounts")
@CrossOrigin(origins = "http://localhost:4200")
public class DiscountController {
    private final DiscountService discountService;

    public DiscountController(DiscountService discountService) {
        this.discountService = discountService;
    }

    @GetMapping("/active")
    public List<Map<String, Object>> activeRules() {
        return discountService.findActiveRules();
    }

    @PostMapping("/rules")
    @ResponseStatus(HttpStatus.CREATED)
    public Map<String, Object> saveRule(@RequestBody Map<String, Object> request) {
        Map<String, Object> parameters = new HashMap<>();
        parameters.put("p_rule_id", request.get("ruleId"));
        parameters.put("p_name", request.get("name"));
        parameters.put("p_rule_type", request.get("ruleType"));
        parameters.put("p_kind", request.get("kind"));
        parameters.put("p_value", request.get("value"));
        parameters.put("p_min_order_amount", request.get("minOrderAmount"));
        parameters.put("p_max_discount", request.get("maxDiscount"));
        parameters.put("p_tier", request.get("tier"));
        parameters.put("p_start_date", request.get("startDate"));
        parameters.put("p_end_date", request.get("endDate"));
        parameters.put("p_priority", request.get("priority"));
        parameters.put("p_stackable", request.getOrDefault("stackable", true));
        parameters.put("p_is_active", request.getOrDefault("isActive", true));
        return Map.of("ruleId", discountService.saveRule(parameters));
    }

    @org.springframework.web.bind.annotation.PutMapping("/rules/{ruleId}")
    public Map<String, Object> updateRule(
            @org.springframework.web.bind.annotation.PathVariable int ruleId,
            @RequestBody Map<String, Object> request) {
        Map<String, Object> parameters = new HashMap<>(request);
        parameters.put("p_rule_id", ruleId);
        parameters.put("p_name", request.get("name"));
        parameters.put("p_rule_type", request.get("ruleType"));
        parameters.put("p_kind", request.get("kind"));
        parameters.put("p_value", request.get("value"));
        parameters.put("p_min_order_amount", request.get("minOrderAmount"));
        parameters.put("p_max_discount", request.get("maxDiscount"));
        parameters.put("p_tier", request.get("tier"));
        parameters.put("p_start_date", request.get("startDate"));
        parameters.put("p_end_date", request.get("endDate"));
        parameters.put("p_priority", request.get("priority"));
        parameters.put("p_stackable", request.getOrDefault("stackable", true));
        parameters.put("p_is_active", request.getOrDefault("isActive", true));
        return Map.of("ruleId", discountService.saveRule(parameters));
    }
}
