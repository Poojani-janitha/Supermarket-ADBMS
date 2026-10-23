package lk.supermarket.report.dto;

import java.math.BigDecimal;

public record MonthlyRollupDto(
    Integer branchId,
    String branchName,
    String orderDate,
    Integer ordersCount,
    BigDecimal totalRevenue,
    boolean isBranchSubtotal,
    boolean isGrandTotal
) {}