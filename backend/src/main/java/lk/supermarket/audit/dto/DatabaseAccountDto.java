package lk.supermarket.audit.dto;

/**
 * DTO representing a database engine account for the dynamic security grid.
 * Primary Owner: Member 5 (Security & RBAC)
 */
public record DatabaseAccountDto(
    String id,
    String username,
    String role,
    String host,
    String status,
    int privilegeCount,
    String createdAt,
    String lastUsedAt
) {}
