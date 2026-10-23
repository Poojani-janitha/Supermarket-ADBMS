package lk.supermarket.auth.dao;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.SqlParameter;
import org.springframework.jdbc.core.simple.SimpleJdbcCall;
import org.springframework.stereotype.Repository;

import java.sql.Types;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * Pure JDBC Authentication Data Access Object
 * Primary Owner: Member 5 (Security & Auth DAO)
 * 
 * Invokes sp_get_login via Spring JDBC SimpleJdbcCall.
 * Strictly NO JPA, Hibernate, or ORM.
 */
@Repository
public class AuthDao {

    private final JdbcTemplate jdbcTemplate;
    private final SimpleJdbcCall getLoginCall;

    public AuthDao(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
        this.getLoginCall = new SimpleJdbcCall(jdbcTemplate)
                .withProcedureName("sp_get_login")
                .declareParameters(new SqlParameter("p_username", Types.VARCHAR));
    }

    public Optional<Map<String, Object>> getLoginCredentials(String username) {
        try {
            Map<String, Object> out = getLoginCall.execute(Map.of("p_username", username));
            @SuppressWarnings("unchecked")
            List<Map<String, Object>> list = (List<Map<String, Object>>) out.get("#result-set-1");
            if (list != null && !list.isEmpty()) {
                Map<String, Object> row = list.get(0);
                // Augment with branch name if missing
                if (!row.containsKey("branch_name") && row.get("branch_id") != null) {
                    try {
                        String bName = jdbcTemplate.queryForObject(
                                "SELECT name FROM branch WHERE branch_id = ?",
                                String.class,
                                row.get("branch_id")
                        );
                        row.put("branch_name", bName);
                    } catch (Exception ignored) {
                    }
                }
                return Optional.of(row);
            }
        } catch (Exception ex) {
            // Direct query if procedure result set handling differs by driver version
            List<Map<String, Object>> list = jdbcTemplate.queryForList(
                    "SELECT e.employee_id, e.branch_id, b.name AS branch_name, e.full_name, e.role, e.password_hash, e.is_active " +
                    "FROM employee e LEFT JOIN branch b ON b.branch_id = e.branch_id " +
                    "WHERE e.username = ? AND e.is_active = TRUE",
                    username
            );
            if (!list.isEmpty()) {
                return Optional.of(list.get(0));
            }
        }
        return Optional.empty();
    }
}
