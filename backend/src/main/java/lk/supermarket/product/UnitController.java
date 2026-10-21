package lk.supermarket.product;

import java.util.List;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/units")
@CrossOrigin(origins = "http://localhost:4200")
public class UnitController {
    private final JdbcTemplate jdbcTemplate;

    public UnitController(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @GetMapping
    public List<Map<String, Object>> units() {
        return jdbcTemplate.queryForList(
                "SELECT code, display_name FROM unit_of_measure WHERE is_active = TRUE ORDER BY display_name");
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Map<String, Object> createUnit(@RequestBody Map<String, Object> request) {
        String code = request.get("code") == null ? "" : request.get("code").toString().trim().toUpperCase();
        String displayName = request.get("displayName") == null ? "" : request.get("displayName").toString().trim();
        if (code.isBlank() || displayName.isBlank()) {
            throw new IllegalArgumentException("Unit code and display name are required");
        }
        if (!code.matches("[A-Z0-9_]{1,30}")) {
            throw new IllegalArgumentException("Unit code may contain only letters, numbers, and underscores");
        }
        jdbcTemplate.update("INSERT INTO unit_of_measure (code, display_name) VALUES (?, ?)", code, displayName);
        return Map.of("code", code, "displayName", displayName);
    }
}
