package lk.supermarket.audit.service;

import lk.supermarket.audit.dao.AuditDao;
import lk.supermarket.audit.dto.*;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * Administrative & Audit Business Service
 * Primary Owner: Member 5 (Security, RBAC & Audit Service)
 */
@Service
public class AuditService {

    private final AuditDao auditDao;
    private final PasswordEncoder passwordEncoder;

    public AuditService(AuditDao auditDao, PasswordEncoder passwordEncoder) {
        this.auditDao = auditDao;
        this.passwordEncoder = passwordEncoder;
    }

    public List<EmployeeDto> getAllEmployees() {
        return auditDao.getAllEmployees();
    }

    public void registerEmployee(RegisterEmployeeRequest request) {
        String hashedPassword = passwordEncoder.encode(request.getPassword());
        auditDao.registerEmployee(request, hashedPassword);
    }

    public void changeRole(Long employeeId, String newRole) {
        auditDao.changeUserRole(employeeId, newRole);
    }

    public void deactivateEmployee(Long adminId, Long targetEmployeeId) {
        auditDao.deactivateEmployee(adminId, targetEmployeeId);
    }

    public void reactivateEmployee(Long employeeId) {
        auditDao.reactivateEmployee(employeeId);
    }

    public List<AuditLogDto> getEmployeeAuditLogs() {
        return auditDao.getEmployeeAuditLogs();
    }

    public List<SecurityEventDto> getSecurityLogs() {
        return auditDao.getSecurityLogs();
    }

    public List<MaskedCustomerDto> getMaskedCustomers() {
        return auditDao.getMaskedCustomers();
    }
}
