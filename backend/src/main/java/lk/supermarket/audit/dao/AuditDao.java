package lk.supermarket.audit.dao;

import lk.supermarket.audit.dto.*;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.SqlParameter;
import org.springframework.jdbc.core.simple.SimpleJdbcCall;
import org.springframework.stereotype.Repository;

import java.sql.Types;
import java.util.List;
import java.util.Map;

/**
 * Pure JDBC Administrative & Audit Data Access Object
 * Primary Owner: Member 5 (Security, RBAC & Audit DAO)
 * 
 * Fulfills Member 5 requirements:
 * - Invokes sp_deactivate_employee with Self-Lockout constraint
 * - Invokes sp_change_user_role with security logging
 * - Queries v_masked_customer_directory for PII compliance
 * - Queries v_employee_audit_history for trigger auditing
 */
@Repository
public class AuditDao {

    private final JdbcTemplate jdbcTemplate;
    private final SimpleJdbcCall deactivateEmployeeCall;
    private final SimpleJdbcCall changeUserRoleCall;

    public AuditDao(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;

        this.deactivateEmployeeCall = new SimpleJdbcCall(jdbcTemplate)
                .withProcedureName("sp_deactivate_employee")
                .declareParameters(
                        new SqlParameter("p_admin_id", Types.INTEGER),
                        new SqlParameter("p_target_emp_id", Types.INTEGER)
                );

        this.changeUserRoleCall = new SimpleJdbcCall(jdbcTemplate)
                .withProcedureName("sp_change_user_role")
                .declareParameters(
                        new SqlParameter("p_emp_id", Types.INTEGER),
                        new SqlParameter("p_new_role", Types.VARCHAR)
                );
    }

    public List<EmployeeDto> getAllEmployees() {
        String sql = "SELECT e.employee_id, e.branch_id, b.name AS branch_name, e.full_name, " +
                "e.role, e.username, DATE_FORMAT(e.hire_date, '%Y-%m-%d') AS hire_date, e.is_active " +
                "FROM employee e " +
                "LEFT JOIN branch b ON b.branch_id = e.branch_id " +
                "ORDER BY e.employee_id ASC";

        return jdbcTemplate.query(sql, (rs, rowNum) -> new EmployeeDto(
                rs.getLong("employee_id"),
                rs.getObject("branch_id") != null ? rs.getLong("branch_id") : null,
                rs.getString("branch_name"),
                rs.getString("full_name"),
                rs.getString("role"),
                rs.getString("username"),
                rs.getString("hire_date"),
                rs.getBoolean("is_active")
        ));
    }

    public int registerEmployee(RegisterEmployeeRequest req, String passwordHash) {
        String sql = "INSERT INTO employee (branch_id, full_name, role, username, password_hash, hire_date, is_active) " +
                "VALUES (?, ?, ?, ?, ?, CURDATE(), TRUE)";
        return jdbcTemplate.update(sql, req.getBranchId(), req.getFullName(), req.getRole(), req.getUsername(), passwordHash);
    }

    public void changeUserRole(Long employeeId, String newRole) {
        changeUserRoleCall.execute(Map.of(
                "p_emp_id", employeeId,
                "p_new_role", newRole
        ));
    }

    public void deactivateEmployee(Long adminId, Long targetEmployeeId) {
        deactivateEmployeeCall.execute(Map.of(
                "p_admin_id", adminId,
                "p_target_emp_id", targetEmployeeId
        ));
    }

    public int reactivateEmployee(Long employeeId) {
        String sql = "UPDATE employee SET is_active = TRUE WHERE employee_id = ?";
        return jdbcTemplate.update(sql, employeeId);
    }

    public List<AuditLogDto> getEmployeeAuditLogs() {
        String sql = "SELECT log_id, employee_id, employee_name, old_role, new_role, " +
                "old_branch_name, new_branch_name, is_active_changed, changed_by, " +
                "DATE_FORMAT(changed_at, '%Y-%m-%d %H:%i:%s') AS changed_at " +
                "FROM v_employee_audit_history " +
                "ORDER BY log_id DESC LIMIT 50";

        return jdbcTemplate.query(sql, (rs, rowNum) -> new AuditLogDto(
                rs.getLong("log_id"),
                rs.getLong("employee_id"),
                rs.getString("employee_name"),
                rs.getString("old_role"),
                rs.getString("new_role"),
                rs.getString("old_branch_name"),
                rs.getString("new_branch_name"),
                rs.getBoolean("is_active_changed"),
                rs.getString("changed_by"),
                rs.getString("changed_at")
        ));
    }

    public List<SecurityEventDto> getSecurityLogs() {
        String sql = "SELECT log_id, event_type, details, performed_by, " +
                "DATE_FORMAT(logged_at, '%Y-%m-%d %H:%i:%s') AS logged_at " +
                "FROM v_security_audit_log " +
                "ORDER BY log_id DESC LIMIT 50";

        return jdbcTemplate.query(sql, (rs, rowNum) -> new SecurityEventDto(
                rs.getLong("log_id"),
                rs.getString("event_type"),
                rs.getString("details"),
                rs.getString("performed_by"),
                rs.getString("logged_at")
        ));
    }

    public List<MaskedCustomerDto> getMaskedCustomers() {
        String sql = "SELECT customer_id, full_name, masked_phone, " +
                "DATE_FORMAT(registered_date, '%Y-%m-%d') AS registered_date, loyalty_points " +
                "FROM v_masked_customer_directory LIMIT 50";

        return jdbcTemplate.query(sql, (rs, rowNum) -> new MaskedCustomerDto(
                rs.getLong("customer_id"),
                rs.getString("full_name"),
                rs.getString("masked_phone"),
                rs.getString("registered_date"),
                rs.getInt("loyalty_points")
        ));
    }

    public int logSecurityEvent(String eventType, String details, String performedBy) {
        String sql = "INSERT INTO security_event_log (event_type, details, performed_by, logged_at) VALUES (?, ?, ?, NOW())";
        return jdbcTemplate.update(sql, eventType, details, performedBy);
    }

    public List<String> getAvailableRoles() {
        try {
            List<String> roles = jdbcTemplate.queryForList(
                    "SELECT DISTINCT role FROM employee WHERE role IS NOT NULL " +
                    "UNION SELECT 'ADMIN' UNION SELECT 'MANAGER' UNION SELECT 'CASHIER' " +
                    "ORDER BY 1 ASC",
                    String.class
            );
            if (roles != null && !roles.isEmpty()) {
                return roles;
            }
        } catch (Exception ex) {
            // fallback
        }
        return List.of("ADMIN", "MANAGER", "CASHIER");
    }

    public List<Map<String, Object>> getDatabaseObjects() {
        return List.of(
            Map.of("name", "sales_order", "type", "TABLE", "description", "Order transaction records"),
            Map.of("name", "order_item", "type", "TABLE", "description", "Individual line items per order"),
            Map.of("name", "customer", "type", "TABLE", "description", "Shopper directory & loyalty points"),
            Map.of("name", "product", "type", "TABLE", "description", "Merchandise catalog & pricing"),
            Map.of("name", "inventory", "type", "TABLE", "description", "Branch stock quantities & reorder levels"),
            Map.of("name", "discount_rule", "type", "TABLE", "description", "Promotional and loyalty discount rules"),
            Map.of("name", "purchase_order", "type", "TABLE", "description", "Supplier restock purchase orders"),
            Map.of("name", "employee", "type", "TABLE", "description", "Staff credentials and role assignments"),
            Map.of("name", "employee_audit_log", "type", "TABLE", "description", "Trigger-based role & branch audit log"),
            Map.of("name", "security_event_log", "type", "TABLE", "description", "Administrative access audit trail"),
            Map.of("name", "v_masked_customer_directory", "type", "VIEW", "description", "PII-masked customer view"),
            Map.of("name", "v_active_discounts", "type", "VIEW", "description", "Active promotional discount rules"),
            Map.of("name", "v_low_stock", "type", "VIEW", "description", "Products below reorder threshold"),
            Map.of("name", "v_daily_sales", "type", "VIEW", "description", "Daily aggregated revenue metrics"),
            Map.of("name", "v_product_ranking", "type", "VIEW", "description", "Top selling products by revenue"),
            Map.of("name", "sp_place_order", "type", "PROCEDURE", "description", "Transactional sales order execution"),
            Map.of("name", "sp_cancel_order", "type", "PROCEDURE", "description", "Order rollback and stock replenishment"),
            Map.of("name", "sp_get_login", "type", "PROCEDURE", "description", "Authentication credential verification"),
            Map.of("name", "sp_add_stock", "type", "PROCEDURE", "description", "Inventory restock procedure"),
            Map.of("name", "sp_transfer_stock", "type", "PROCEDURE", "description", "Inter-branch stock transfer"),
            Map.of("name", "sp_receive_purchase", "type", "PROCEDURE", "description", "3-way PO receipt verification"),
            Map.of("name", "sp_deactivate_employee", "type", "PROCEDURE", "description", "Employee deactivation with self-lockout check"),
            Map.of("name", "sp_change_user_role", "type", "PROCEDURE", "description", "Dynamic role escalation and audit")
        );
    }

    public List<Map<String, Object>> getRolePrivileges(String role) {
        ensurePrivilegeTable();
        try {
            String sql = "SELECT role_name, object_name, object_type, privileges FROM role_privilege_rule";
            if (role != null && !role.isBlank()) {
                sql += " WHERE role_name = ?";
                return jdbcTemplate.queryForList(sql, role.toUpperCase());
            }
            return jdbcTemplate.queryForList(sql);
        } catch (Exception ex) {
            return List.of();
        }
    }

    public void saveRolePrivilegeRules(String role, List<Map<String, String>> rules, String adminUser) {
        ensurePrivilegeTable();
        for (Map<String, String> rule : rules) {
            String obj = rule.get("objectName");
            String type = rule.getOrDefault("objectType", "TABLE");
            String privs = rule.getOrDefault("privileges", "DENIED");

            jdbcTemplate.update(
                "INSERT INTO role_privilege_rule (role_name, object_name, object_type, privileges) " +
                "VALUES (?, ?, ?, ?) " +
                "ON DUPLICATE KEY UPDATE privileges = VALUES(privileges), updated_at = NOW()",
                role.toUpperCase(), obj, type, privs
            );
        }
        logSecurityEvent("PRIVILEGE_RULES_SAVED", "Updated privilege rules for role: " + role + " (" + rules.size() + " objects)", adminUser);
    }

    private void ensurePrivilegeTable() {
        try {
            jdbcTemplate.execute(
                "CREATE TABLE IF NOT EXISTS role_privilege_rule (" +
                "id INT AUTO_INCREMENT PRIMARY KEY, " +
                "role_name VARCHAR(50) NOT NULL, " +
                "object_name VARCHAR(100) NOT NULL, " +
                "object_type VARCHAR(30) NOT NULL, " +
                "privileges VARCHAR(255) NOT NULL, " +
                "updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, " +
                "UNIQUE KEY uq_role_obj (role_name, object_name)" +
                ") ENGINE=InnoDB"
            );
        } catch (Exception ignored) {}
    }

    public Map<String, Integer> verifyTableCounts() {
        Map<String, Integer> counts = new java.util.LinkedHashMap<>();
        List<String> tables = List.of("employee", "branch", "customer", "product", "inventory", "sales_order", "security_event_log");
        for (String table : tables) {
            try {
                Integer count = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM " + table, Integer.class);
                counts.put(table, count != null ? count : 0);
            } catch (Exception ex) {
                counts.put(table, 0);
            }
        }
        return counts;
    }
}
