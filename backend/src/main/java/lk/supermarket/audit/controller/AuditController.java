package lk.supermarket.audit.controller;

import jakarta.validation.Valid;
import lk.supermarket.audit.dto.*;
import lk.supermarket.audit.service.AuditService;
import lk.supermarket.common.JwtUtil;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
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

    @GetMapping("/backup/download/{fileName}")
    public ResponseEntity<Resource> downloadBackup(@PathVariable String fileName) {
        if (fileName.contains("..") || fileName.contains("/") || fileName.contains("\\")) {
            return ResponseEntity.badRequest().build();
        }
        Resource resource = auditService.getBackupResource(fileName);
        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_OCTET_STREAM)
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + fileName + "\"")
                .body(resource);
    }

    @PostMapping("/backup/restore/{fileName}")
    public ResponseEntity<Map<String, Object>> restoreBackup(
            @PathVariable String fileName,
            @RequestHeader(value = "Authorization", required = false) String authHeader
    ) {
        if (fileName.contains("..") || fileName.contains("/") || fileName.contains("\\")) {
            return ResponseEntity.badRequest().body(Map.of("error", "Invalid file name"));
        }
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
        Map<String, Object> result = auditService.restoreDatabase(fileName, performer);
        return ResponseEntity.ok(result);
    }

    @GetMapping("/roles")
    public ResponseEntity<List<String>> getRoles() {
        return ResponseEntity.ok(auditService.getAvailableRoles());
    }

    @GetMapping("/objects")
    public ResponseEntity<List<Map<String, Object>>> getDatabaseObjects() {
        return ResponseEntity.ok(auditService.getDatabaseObjects());
    }

    @GetMapping("/privileges")
    public ResponseEntity<List<Map<String, Object>>> getRolePrivileges(@RequestParam(required = false) String role) {
        return ResponseEntity.ok(auditService.getRolePrivileges(role));
    }

    @PostMapping("/privileges")
    public ResponseEntity<Map<String, String>> savePrivileges(
            @RequestBody Map<String, Object> body,
            @RequestHeader(value = "Authorization", required = false) String authHeader
    ) {
        String role = (String) body.get("role");
        @SuppressWarnings("unchecked")
        List<Map<String, String>> rules = (List<Map<String, String>>) body.get("rules");
        String performer = "Admin";
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            try {
                String username = jwtUtil.extractUsername(authHeader.substring(7));
                if (username != null && !username.isBlank()) {
                    performer = username;
                }
            } catch (Exception ignored) {}
        }
        if (role != null && rules != null) {
            auditService.saveRolePrivileges(role, rules, performer);
        }
        return ResponseEntity.ok(Map.of("message", "Role privileges saved successfully in database"));
    }

    @GetMapping("/database-users")
    public ResponseEntity<List<DatabaseUserDto>> getDatabaseUsers() {
        return ResponseEntity.ok(auditService.getDatabaseUsers());
    }

    @GetMapping("/database-accounts")
    public ResponseEntity<List<DatabaseAccountDto>> getDatabaseAccounts() {
        return ResponseEntity.ok(auditService.getDatabaseAccounts());
    }

    @PostMapping("/database-accounts")
    public ResponseEntity<DatabaseAccountDto> provisionDatabaseAccount(
            @RequestBody Map<String, String> body,
            @RequestHeader(value = "Authorization", required = false) String authHeader
    ) {
        String username = body.get("username");
        String host = body.getOrDefault("host", "%");
        String role = body.getOrDefault("role", "cashier_role");
        String password = body.getOrDefault("password", "Pass!2026");
        String performer = "Admin";
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            try {
                String u = jwtUtil.extractUsername(authHeader.substring(7));
                if (u != null && !u.isBlank()) performer = u;
            } catch (Exception ignored) {}
        }
        return ResponseEntity.ok(auditService.provisionDatabaseAccount(username, host, role, password, performer));
    }

    @GetMapping("/dr-status")
    public ResponseEntity<Map<String, Object>> getDrStatus() {
        return ResponseEntity.ok(auditService.getDrStatus());
    }
}
