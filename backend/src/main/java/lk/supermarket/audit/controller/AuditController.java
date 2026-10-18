package lk.supermarket.audit.controller;

import jakarta.validation.Valid;
import lk.supermarket.audit.dto.*;
import lk.supermarket.audit.service.AuditService;
import lk.supermarket.common.JwtUtil;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * Enterprise Administration & Audit REST Controller
 * Primary Owner: Member 5 (Security, RBAC & Audit Controller)
 */
@RestController
@RequestMapping("/api/admin")
public class AuditController {

    private final AuditService auditService;
    private final JwtUtil jwtUtil;

    public AuditController(AuditService auditService, JwtUtil jwtUtil) {
        this.auditService = auditService;
        this.jwtUtil = jwtUtil;
    }

    @GetMapping("/employees")
    public ResponseEntity<List<EmployeeDto>> getEmployees() {
        return ResponseEntity.ok(auditService.getAllEmployees());
    }

    @PostMapping("/employees")
    public ResponseEntity<Map<String, String>> registerEmployee(@Valid @RequestBody RegisterEmployeeRequest request) {
        auditService.registerEmployee(request);
        return ResponseEntity.ok(Map.of("message", "Employee registered successfully"));
    }

    @PutMapping("/employees/{id}/role")
    public ResponseEntity<Map<String, String>> changeRole(
            @PathVariable Long id,
            @Valid @RequestBody ChangeRoleRequest request
    ) {
        auditService.changeRole(id, request.getRole());
        return ResponseEntity.ok(Map.of("message", "Role updated successfully via sp_change_user_role"));
    }

    @DeleteMapping("/employees/{id}")
    public ResponseEntity<Map<String, String>> deactivateEmployee(
            @PathVariable Long id,
            @RequestHeader(value = "Authorization", required = false) String authHeader
    ) {
        Long adminId = 100L; // Default root admin ID fallback
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            try {
                Long extracted = jwtUtil.extractEmployeeId(authHeader.substring(7));
                if (extracted != null) {
                    adminId = extracted;
                }
            } catch (Exception ignored) {
            }
        }

        auditService.deactivateEmployee(adminId, id);
        return ResponseEntity.ok(Map.of("message", "Employee deactivated successfully via sp_deactivate_employee"));
    }

    @PutMapping("/employees/{id}/reactivate")
    public ResponseEntity<Map<String, String>> reactivateEmployee(@PathVariable Long id) {
        auditService.reactivateEmployee(id);
        return ResponseEntity.ok(Map.of("message", "Employee reactivated successfully"));
    }

    @GetMapping("/audit-logs")
    public ResponseEntity<List<AuditLogDto>> getAuditLogs() {
        return ResponseEntity.ok(auditService.getEmployeeAuditLogs());
    }

    @GetMapping("/security-logs")
    public ResponseEntity<List<SecurityEventDto>> getSecurityLogs() {
        return ResponseEntity.ok(auditService.getSecurityLogs());
    }

    @GetMapping("/masked-customers")
    public ResponseEntity<List<MaskedCustomerDto>> getMaskedCustomers() {
        return ResponseEntity.ok(auditService.getMaskedCustomers());
    }

    @PostMapping("/backup")
    public ResponseEntity<BackupInfoDto> createBackup(
            @RequestHeader(value = "Authorization", required = false) String authHeader
    ) {
        String performer = "Admin (Member 5)";
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            try {
                String username = jwtUtil.extractUsername(authHeader.substring(7));
                if (username != null && !username.isBlank()) {
                    performer = username + " (Admin)";
                }
            } catch (Exception ignored) {
            }
        }
        BackupInfoDto result = auditService.createDatabaseBackup(performer);
        return ResponseEntity.ok(result);
    }

    @GetMapping("/backups")
    public ResponseEntity<List<BackupInfoDto>> getBackups() {
        return ResponseEntity.ok(auditService.getBackupList());
    }
}
