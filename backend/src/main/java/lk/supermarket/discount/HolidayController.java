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
@RequestMapping("/api/discounts/holidays")
@CrossOrigin(origins = "http://localhost:4200")
public class HolidayController {
    private final DiscountService discountService;

    public HolidayController(DiscountService discountService) {
        this.discountService = discountService;
    }

    @GetMapping
    public List<Map<String, Object>> holidays() {
        return discountService.findHolidays();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Map<String, Object> saveHoliday(@RequestBody Map<String, Object> request) {
        int ruleId = discountService.saveHolidayDiscount(request);
        return Map.of(
                "holidayDate", String.valueOf(request.get("holidayDate")),
                "ruleId", ruleId
        );
    }

    @org.springframework.web.bind.annotation.PutMapping
    public Map<String, Object> updateHoliday(@RequestBody Map<String, Object> request) {
        discountService.updateHoliday(request);
        return Map.of("holidayDate", String.valueOf(request.get("holidayDate")));
    }
}
