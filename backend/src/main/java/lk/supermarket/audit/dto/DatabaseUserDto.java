package lk.supermarket.audit.dto;

/**
 * DTO representing an authenticated/provisioned MySQL database account.
 * Primary Owner: Member 5 (Security, RBAC & Database Accounts)
 */
public record DatabaseUserDto(
    String username,
    String host,
    String assignedRole,
    String status,
    String purpose,
    String authPlugin,
    String privilegesSummary
) {}
