package lk.supermarket.product;

import java.util.List;
import java.util.Map;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/suppliers")
@CrossOrigin(origins = "http://localhost:4200")
public class SupplierLookupController {
    private final JdbcTemplate jdbcTemplate;

    public SupplierLookupController(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @GetMapping
    public List<Map<String, Object>> suppliers() {
        return jdbcTemplate.queryForList("""
                SELECT supplier_id, name
                FROM supplier
                WHERE is_active = TRUE AND status = 'ACTIVE'
                ORDER BY name
                """);
    }
}
