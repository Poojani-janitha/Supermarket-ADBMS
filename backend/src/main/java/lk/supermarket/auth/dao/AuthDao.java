package lk.supermarket.auth.dao;

import lk.supermarket.auth.dto.SupplierSignupRequest;
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
        // 1. Try employee authentication via sp_get_login
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
                    "SELECT e.employee_id, e.branch_id, b.name AS branch_name, e.full_name, r.role_name AS role, e.password_hash, e.is_active " +
                    "FROM employee e " +
                    "JOIN roles r ON r.role_id = e.role_id " +
                    "LEFT JOIN branch b ON b.branch_id = e.branch_id " +
                    "WHERE e.username = ? AND e.is_active = TRUE",
                    username
            );
            if (!list.isEmpty()) {
                return Optional.of(list.get(0));
            }
        }

        // 2. If not found in employee, check supplier table
        try {
            List<Map<String, Object>> supList = jdbcTemplate.queryForList(
                    "SELECT supplier_id, name, contact_person, phone, email, username, password_hash, city, is_active, status " +
                    "FROM supplier " +
                    "WHERE LOWER(TRIM(username)) = LOWER(TRIM(?)) AND is_active = TRUE",
                    username.trim()
            );
            if (!supList.isEmpty()) {
                Map<String, Object> sup = supList.get(0);
                Map<String, Object> row = new java.util.HashMap<>();
                Long supId = ((Number) sup.get("supplier_id")).longValue();
                row.put("employee_id", supId);
                row.put("supplier_id", supId);
                row.put("branch_id", 1L);
                row.put("branch_name", "Vendor Network (" + sup.get("city") + ")");
                String contact = (String) sup.get("contact_person");
                String compName = (String) sup.get("name");
                row.put("full_name", (contact != null && !contact.isBlank()) ? contact + " (" + compName + ")" : compName);
                row.put("username", sup.get("username"));
                row.put("role", "SUPPLIER");
                row.put("password_hash", sup.get("password_hash"));
                row.put("is_active", Boolean.TRUE.equals(sup.get("is_active")) || Integer.valueOf(1).equals(sup.get("is_active")));
                return Optional.of(row);
            }
        } catch (Exception ignored) {
        }

        return Optional.empty();
    }

    public Long registerSupplier(SupplierSignupRequest req, String passwordHash) {
        String checkSql = "SELECT COUNT(*) FROM supplier WHERE LOWER(TRIM(username)) = LOWER(TRIM(?))";
        Integer existing = jdbcTemplate.queryForObject(checkSql, Integer.class, req.getUsername().trim());
        if (existing != null && existing > 0) {
            throw new IllegalArgumentException("Username '" + req.getUsername() + "' is already registered by another vendor.");
        }

        String name = (req.getName() != null && !req.getName().trim().isEmpty())
                ? req.getName().trim()
                : req.getUsername().trim();
        String phone = (req.getPhone() != null && !req.getPhone().trim().isEmpty())
                ? req.getPhone().trim()
                : "077-0000000";
        String city = (req.getCity() != null && !req.getCity().trim().isEmpty())
                ? req.getCity().trim()
                : "Colombo";
        String contactPerson = (req.getContactPerson() != null && !req.getContactPerson().trim().isEmpty())
                ? req.getContactPerson().trim()
                : name;
        String email = (req.getEmail() != null && !req.getEmail().trim().isEmpty())
                ? req.getEmail().trim()
                : (req.getUsername().trim() + "@vendor.lk");
        String taxNumber = (req.getTaxNumber() != null) ? req.getTaxNumber().trim() : "";

        String insertSql = "INSERT INTO supplier (name, contact_person, phone, email, username, password_hash, city, tax_number, is_active, status) " +
                "VALUES (?, ?, ?, ?, ?, ?, ?, ?, TRUE, 'ACTIVE')";
        jdbcTemplate.update(insertSql,
                name,
                contactPerson,
                phone,
                email,
                req.getUsername().trim(),
                passwordHash,
                city,
                taxNumber
        );

        return jdbcTemplate.queryForObject("SELECT supplier_id FROM supplier WHERE LOWER(username) = LOWER(?)", Long.class, req.getUsername().trim());
    }
}
