package lk.supermarket.report.dto;

import java.math.BigDecimal;

public record DailySalesDto(
    String date,
    String branchName,
    Integer ordersCount,
    BigDecimal totalSales
) {}
