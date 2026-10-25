package lk.supermarket.report.dto;

import java.math.BigDecimal;
import java.util.List;

public record FinancialReconciliationDto(
    int totalCompletedOrders,
    BigDecimal grossSales,
    BigDecimal totalDiscounts,
    BigDecimal netRevenue,
    BigDecimal totalCollected,
    BigDecimal variance,
    boolean isBalanced,
    List<PaymentTenderSummaryDto> tenders
) {
    public record PaymentTenderSummaryDto(
        String paymentMethod,
        int transactionCount,
        BigDecimal totalCollected,
        double sharePercentage
    ) {}
}
