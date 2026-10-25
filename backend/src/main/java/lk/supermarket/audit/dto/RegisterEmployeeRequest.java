package lk.supermarket.audit.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public class RegisterEmployeeRequest {

    @NotNull(message = "Branch ID is required")
    private Long branchId;

    @NotBlank(message = "Full name is required")
    private String fullName;

    @NotBlank(message = "Role is required (ADMIN, MANAGER, CASHIER)")
    private String role;

    @NotBlank(message = "Username is required")
    private String username;

    @NotBlank(message = "Password is required")
    private String password;

    public RegisterEmployeeRequest() {
    }

    public RegisterEmployeeRequest(Long branchId, String fullName, String role, String username, String password) {
        this.branchId = branchId;
        this.fullName = fullName;
        this.role = role;
        this.username = username;
        this.password = password;
    }

    public Long getBranchId() {
        return branchId;
    }

    public void setBranchId(Long branchId) {
        this.branchId = branchId;
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

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }
}
