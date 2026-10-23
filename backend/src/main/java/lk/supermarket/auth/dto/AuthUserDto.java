package lk.supermarket.auth.dto;

public class AuthUserDto {
    private Long employeeId;
    private Long branchId;
    private String branchName;
    private String fullName;
    private String username;
    private String role;
    private Boolean isActive;

    public AuthUserDto() {
    }

    public AuthUserDto(Long employeeId, Long branchId, String fullName, String username, String role, Boolean isActive) {
        this(employeeId, branchId, "Branch #" + branchId, fullName, username, role, isActive);
    }

    public AuthUserDto(Long employeeId, Long branchId, String branchName, String fullName, String username, String role, Boolean isActive) {
        this.employeeId = employeeId;
        this.branchId = branchId;
        this.branchName = branchName;
        this.fullName = fullName;
        this.username = username;
        this.role = role;
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

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
    }

    public Boolean getIsActive() {
        return isActive;
    }

    public void setIsActive(Boolean active) {
        isActive = active;
    }
}
