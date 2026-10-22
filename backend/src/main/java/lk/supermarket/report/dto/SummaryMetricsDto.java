package lk.supermarket.report.dto;

import java.math.BigDecimal;

public record SummaryMetricsDto(
    BigDecimal todayRevenue,
    Integer ordersCount,
    BigDecimal discountsGiven,
    Integer lowStockAlerts,
    BigDecimal movingAvg7Days,
    BigDecimal movingAvg30Days
) {}
