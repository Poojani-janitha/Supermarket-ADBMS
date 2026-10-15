package lk.supermarket.audit.dto;

public class AuditLogDto {
    private Long logId;
    private Long employeeId;
    private String employeeName;
    private String oldRole;
    private String newRole;
    private String oldBranchName;
    private String newBranchName;
    private Boolean isActiveChanged;
    private String changedBy;
    private String changedAt;

    public AuditLogDto() {
    }

    public AuditLogDto(Long logId, Long employeeId, String employeeName, String oldRole, String newRole, String oldBranchName, String newBranchName, Boolean isActiveChanged, String changedBy, String changedAt) {
        this.logId = logId;
        this.employeeId = employeeId;
        this.employeeName = employeeName;
        this.oldRole = oldRole;
        this.newRole = newRole;
        this.oldBranchName = oldBranchName;
        this.newBranchName = newBranchName;
        this.isActiveChanged = isActiveChanged;
        this.changedBy = changedBy;
        this.changedAt = changedAt;
    }

    public Long getLogId() {
        return logId;
    }

    public void setLogId(Long logId) {
        this.logId = logId;
    }

    public Long getEmployeeId() {
        return employeeId;
    }

    public void setEmployeeId(Long employeeId) {
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

    public Boolean getIsActiveChanged() {
        return isActiveChanged;
    }

    public void setIsActiveChanged(Boolean activeChanged) {
        isActiveChanged = activeChanged;
    }

    public String getChangedBy() {
        return changedBy;
    }

    public void setChangedBy(String changedBy) {
        this.changedBy = changedBy;
    }

    public String getChangedAt() {
        return changedAt;
    }

    public void setChangedAt(String changedAt) {
        this.changedAt = changedAt;
    }

    public String getAction() {
        if (Boolean.TRUE.equals(isActiveChanged)) {
            return "DEACTIVATE";
        }
        if (oldRole != null && newRole != null && !oldRole.equalsIgnoreCase(newRole)) {
            return "ROLE_CHANGE";
        }
        if (oldBranchName != null && newBranchName != null && !oldBranchName.equalsIgnoreCase(newBranchName)) {
            return "BRANCH_TRANSFER";
        }
        return "AUDIT";
    }

    public String getOldValue() {
        if (Boolean.TRUE.equals(isActiveChanged)) {
            return "ACTIVE (1)";
        }
        if (oldRole != null && newRole != null && !oldRole.equalsIgnoreCase(newRole)) {
            return oldRole;
        }
        if (oldBranchName != null) {
            return oldBranchName;
        }
        return "NONE";
    }

    public String getNewValue() {
        if (Boolean.TRUE.equals(isActiveChanged)) {
            return "DEACTIVATED (0)";
        }
        if (oldRole != null && newRole != null && !oldRole.equalsIgnoreCase(newRole)) {
            return newRole;
        }
        if (newBranchName != null) {
            return newBranchName;
        }
        return "NONE";
    }

    public String getModifiedBy() {
        return changedBy != null ? changedBy : "SYSTEM";
    }

    public String getModifiedAt() {
        return changedAt != null ? changedAt : "";
    }
}
