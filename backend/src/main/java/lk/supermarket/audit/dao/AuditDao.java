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
}
