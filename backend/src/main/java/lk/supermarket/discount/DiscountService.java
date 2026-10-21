package lk.supermarket.discount;

import java.util.List;
import java.util.Map;
import org.springframework.stereotype.Service;

@Service
public class DiscountService {
    private final DiscountDao discountDao;

    public DiscountService(DiscountDao discountDao) {
        this.discountDao = discountDao;
    }

    public List<Map<String, Object>> findActiveRules() {
        return discountDao.findActiveRules();
    }

    public List<Map<String, Object>> findCoupons() {
        return discountDao.findCoupons();
    }

    public List<Map<String, Object>> findHolidays() {
        return discountDao.findHolidays();
    }

    public void saveCoupon(Map<String, ?> request) {
        discountDao.saveCoupon(request);
    }

    public int saveRule(Map<String, ?> parameters) {
        return discountDao.saveRule(parameters);
    }

    public void saveHoliday(Map<String, ?> request) {
        discountDao.saveHoliday(request);
    }

    public int saveHolidayDiscount(Map<String, ?> request) {
        return discountDao.saveHolidayDiscount(request);
    }
}
