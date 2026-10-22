package lk.supermarket.discount;

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
@RequestMapping("/api/discounts/coupons")
@CrossOrigin(origins = "http://localhost:4200")
public class CouponController {
    private final DiscountService discountService;

    public CouponController(DiscountService discountService) {
        this.discountService = discountService;
    }

    @GetMapping
    public List<Map<String, Object>> coupons() {
        return discountService.findCoupons();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Map<String, String> saveCoupon(@RequestBody Map<String, Object> request) {
        discountService.saveCoupon(request);
        return Map.of("code", String.valueOf(request.get("code")).toUpperCase());
    }
}
