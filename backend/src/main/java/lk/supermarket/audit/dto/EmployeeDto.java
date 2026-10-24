package lk.supermarket.audit.dto;

public class EmployeeDto {
    private Long employeeId;
    private Long branchId;
    private String branchName;
    private String fullName;
    private String role;
    private String username;
    private String hireDate;
    private Boolean isActive;

    public EmployeeDto() {
    }

    public EmployeeDto(Long employeeId, Long branchId, String branchName, String fullName, String role, String username, String hireDate, Boolean isActive) {
        this.employeeId = employeeId;
        this.branchId = branchId;
        this.branchName = branchName;
        this.fullName = fullName;
        this.role = role;
        this.username = username;
        this.hireDate = hireDate;
        this.isActive = isActive;
    }

    public Long getEmployeeId() {
        return employeeId;
    }

    public void setEmployeeId(Long employeeId) {
        this.employeeId = employeeId;
    }

    public Long getBranchId() {
        return branchId;
    }

    public void setBranchId(Long branchId) {
        this.branchId = branchId;
    }

    public String getBranchName() {
        return branchName;
    }

    public void setBranchName(String branchName) {
        this.branchName = branchName;
    }

    public String getFullName() {
        return fullName;
    }

    public void setFullName(String fullName) {
        this.fullName = fullName;
    }

    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getHireDate() {
        return hireDate;
    }

    public void setHireDate(String hireDate) {
        this.hireDate = hireDate;
    }

    public Boolean getIsActive() {
        return isActive;
    }

    public void setIsActive(Boolean active) {
        isActive = active;
    }
}
