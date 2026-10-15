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
                return Optional.of(list.get(0));
            }
        } catch (Exception ex) {
            // Fallback direct query if procedure result set handling differs by driver version
            List<Map<String, Object>> list = jdbcTemplate.queryForList(
                    "SELECT employee_id, branch_id, full_name, role, password_hash, is_active " +
                    "FROM employee WHERE username = ? AND is_active = TRUE",
                    username
            );
            if (!list.isEmpty()) {
                return Optional.of(list.get(0));
            }
        }
        return Optional.empty();
    }
}
