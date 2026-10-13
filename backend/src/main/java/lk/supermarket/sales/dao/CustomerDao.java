package lk.supermarket.sales.dao;

import lk.supermarket.sales.dto.CustomerDto;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public class CustomerDao {

    private final JdbcTemplate jdbcTemplate;

    public CustomerDao(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public List<CustomerDto> findAllCustomers() {
        String sql = """
            SELECT customer_id, full_name, phone, email, loyalty_points,
                   fn_customer_tier(customer_id) AS tier, registered_date
            FROM customer
            ORDER BY customer_id ASC
        """;

        return jdbcTemplate.query(sql, (rs, rowNum) -> {
            CustomerDto c = new CustomerDto();
            c.setId(rs.getInt("customer_id"));
            c.setFullName(rs.getString("full_name"));
            c.setPhone(rs.getString("phone"));
            c.setEmail(rs.getString("email"));
            c.setLoyaltyPoints(rs.getInt("loyalty_points"));
            c.setTier(rs.getString("tier"));
            c.setRegisteredDate(rs.getString("registered_date"));
            return c;
        });
    }
}
