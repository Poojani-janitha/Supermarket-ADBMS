package lk.supermarket.audit.service;

import lk.supermarket.audit.dao.AuditDao;
import lk.supermarket.audit.dto.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.io.BufferedReader;
import java.io.File;
import java.io.FileReader;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import java.util.concurrent.TimeUnit;

/**
 * Administrative & Audit Business Service
 * Primary Owner: Member 5 (Security, RBAC & Audit Service)
 */
@Service
public class AuditService {

    private static final Logger log = LoggerFactory.getLogger(AuditService.class);

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

    /**
     * Executes non-blocking consistent database snapshot with binary log coordinates.
     * Complies with Member 5 Point-in-Time Recovery (PITR) ADBMS requirements.
     */
    public BackupInfoDto createDatabaseBackup(String performedBy) {
        File backupDir = resolveBackupDirectory();
        String timestamp = new SimpleDateFormat("yyyyMMdd_HHmmss").format(new Date());
        String fileName = "supermarket_db_backup_" + timestamp + ".sql";
        File outputFile = new File(backupDir, fileName);

        String mysqldumpPath = resolveMysqldumpExecutable();
        log.info("Initiating database backup using binary: {} to {}", mysqldumpPath, outputFile.getAbsolutePath());

        List<String> command = List.of(
                mysqldumpPath,
                "--host=localhost",
                "--port=3306",
                "--user=root",
                "--password=1234",
                "--single-transaction",
                "--flush-logs",
                "--source-data=2",
                "--routines",
                "--triggers",
                "--events",
                "--set-gtid-purged=OFF",
                "--result-file=" + outputFile.getAbsolutePath(),
                "supermarket_db"
        );

        try {
            ProcessBuilder pb = new ProcessBuilder(command);
            pb.redirectErrorStream(true);
            Process process = pb.start();
            boolean finished = process.waitFor(60, TimeUnit.SECONDS);

            if (!finished) {
                process.destroyForcibly();
                throw new RuntimeException("mysqldump timed out after 60 seconds");
            }

            int exitCode = process.exitValue();
            if (exitCode != 0) {
                throw new RuntimeException("mysqldump exited with error code " + exitCode);
            }

            if (!outputFile.exists() || outputFile.length() == 0) {
                throw new RuntimeException("Backup file was not created or is empty");
            }

            double fileSizeKb = Math.round((outputFile.length() / 1024.0) * 100.0) / 100.0;
            String binlogCoordinate = extractBinlogCoordinate(outputFile);
            String createdAt = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss").format(new Date());

            // Log security event in audit trail
            auditDao.logSecurityEvent(
                    "DATABASE_BACKUP_CREATED",
                    "Consistent snapshot generated: " + fileName + " (" + fileSizeKb + " KB). PITR Coordinate: " + binlogCoordinate,
                    performedBy != null ? performedBy : "Admin (Member 5)"
            );

            log.info("Backup successfully generated: {} ({} KB)", fileName, fileSizeKb);
            return new BackupInfoDto(
                    fileName,
                    outputFile.getAbsolutePath(),
                    fileSizeKb,
                    createdAt,
                    binlogCoordinate,
                    "SUCCESS",
                    "Database snapshot generated successfully with MVCC single-transaction & PITR coordinate"
            );
        } catch (Exception e) {
            log.error("Database backup generation failed: {}", e.getMessage(), e);
            throw new RuntimeException("Database backup failed: " + e.getMessage(), e);
        }
    }

    /**
     * Lists existing backup snapshots available on disk.
     */
    public List<BackupInfoDto> getBackupList() {
        File backupDir = resolveBackupDirectory();
        List<BackupInfoDto> backups = new ArrayList<>();

        File[] files = backupDir.listFiles((dir, name) -> name.endsWith(".sql"));
        if (files != null) {
            for (File file : files) {
                double fileSizeKb = Math.round((file.length() / 1024.0) * 100.0) / 100.0;
                String createdAt = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss").format(new Date(file.lastModified()));
                String binlogCoordinate = extractBinlogCoordinate(file);

                backups.add(new BackupInfoDto(
                        file.getName(),
                        file.getAbsolutePath(),
                        fileSizeKb,
                        createdAt,
                        binlogCoordinate,
                        "SUCCESS",
                        "Available for Point-in-Time Recovery (PITR)"
                ));
            }
        }

        backups.sort((a, b) -> b.getCreatedAt().compareTo(a.getCreatedAt()));
        return backups;
    }

    private File resolveBackupDirectory() {
        Path projectRoot = Paths.get("").toAbsolutePath();
        Path backupPath = projectRoot.endsWith("backend")
                ? projectRoot.getParent().resolve("backups")
                : projectRoot.resolve("backups");
        File dir = backupPath.toFile();
        if (!dir.exists()) {
            dir.mkdirs();
        }
        return dir;
    }

    private String resolveMysqldumpExecutable() {
        String[] candidates = new String[]{
                "C:\\Program Files\\MySQL\\MySQL Server 8.0\\bin\\mysqldump.exe",
                "C:\\Program Files\\MySQL\\MySQL Server 8.4\\bin\\mysqldump.exe",
                "C:\\Program Files\\MySQL\\MySQL Server 9.0\\bin\\mysqldump.exe",
                "C:\\Program Files (x86)\\MySQL\\MySQL Server 8.0\\bin\\mysqldump.exe",
                "mysqldump"
        };
        for (String candidate : candidates) {
            if (new File(candidate).exists()) {
                return candidate;
            }
        }
        return "mysqldump";
    }

    private String extractBinlogCoordinate(File file) {
        if (!file.exists()) {
            return "Unavailable";
        }
        try (BufferedReader reader = new BufferedReader(new FileReader(file))) {
            String line;
            int linesRead = 0;
            while ((line = reader.readLine()) != null && linesRead < 50) {
                linesRead++;
                if (line.contains("CHANGE MASTER TO") || line.contains("CHANGE REPLICATION SOURCE TO")) {
                    return line.replace("--", "").trim();
                }
            }
        } catch (Exception ignored) {
        }
        return "Not specified in header";
    }
}

