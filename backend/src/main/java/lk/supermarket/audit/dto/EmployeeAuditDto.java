package lk.supermarket.audit.dto;

import java.time.LocalDateTime;

public class EmployeeAuditDto {
    private int logId;
    private int employeeId;
    private String employeeName;
    private String oldRole;
    private String newRole;
    private String oldBranchName;
    private String newBranchName;
    private boolean activeChanged;
    private String changedBy;
    private LocalDateTime changedAt;

    public EmployeeAuditDto() {}

    public EmployeeAuditDto(int logId, int employeeId, String employeeName, String oldRole, String newRole,
                            String oldBranchName, String newBranchName, boolean activeChanged, String changedBy, LocalDateTime changedAt) {
        this.logId = logId;
        this.employeeId = employeeId;
        this.employeeName = employeeName;
        this.oldRole = oldRole;
        this.newRole = newRole;
        this.oldBranchName = oldBranchName;
        this.newBranchName = newBranchName;
        this.activeChanged = activeChanged;
        this.changedBy = changedBy;
        this.changedAt = changedAt;
    }

    public int getLogId() {
        return logId;
    }

    public void setLogId(int logId) {
        this.logId = logId;
    }

    public int getEmployeeId() {
        return employeeId;
    }

    public void setEmployeeId(int employeeId) {
        this.employeeId = employeeId;
    }

    public String getEmployeeName() {
        return employeeName;
    }

    public void setEmployeeName(String employeeName) {
        this.employeeName = employeeName;
    }

    public String getOldRole() {
        return oldRole;
    }

    public void setOldRole(String oldRole) {
        this.oldRole = oldRole;
    }

    public String getNewRole() {
        return newRole;
    }

    public void setNewRole(String newRole) {
        this.newRole = newRole;
    }

    public String getOldBranchName() {
        return oldBranchName;
    }

    public void setOldBranchName(String oldBranchName) {
        this.oldBranchName = oldBranchName;
    }

    public String getNewBranchName() {
        return newBranchName;
    }

    public void setNewBranchName(String newBranchName) {
        this.newBranchName = newBranchName;
    }

    public boolean isActiveChanged() {
        return activeChanged;
    }

    public void setActiveChanged(boolean activeChanged) {
        this.activeChanged = activeChanged;
    }

    public String getChangedBy() {
        return changedBy;
    }

    public void setChangedBy(String changedBy) {
        this.changedBy = changedBy;
    }

    public LocalDateTime getChangedAt() {
        return changedAt;
    }

    public void setChangedAt(LocalDateTime changedAt) {
        this.changedAt = changedAt;
    }
}
