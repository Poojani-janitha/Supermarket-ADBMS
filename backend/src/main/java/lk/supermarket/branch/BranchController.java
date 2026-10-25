package lk.supermarket.branch;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/branches")
@CrossOrigin(origins = "http://localhost:4200")
public class BranchController {
    private final JdbcTemplate jdbcTemplate;

    public BranchController(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @GetMapping
    public List<Map<String, Object>> getBranches() {
        return jdbcTemplate.queryForList("""
            SELECT branch_id AS id, branch_id, name, city, province, address, phone, is_active
            FROM branch
            WHERE is_active = 1
            ORDER BY branch_id ASC
        """);
    }
}
