package lk.supermarket.report.dto;
import java.math.BigDecimal;
public record DiscountImpactDto(
    Integer ruleId,
    String ruleName,
    String ruleType,
    Integer timesApplied,
    BigDecimal totalDiscountAmount,
    BigDecimal attributedSales,
    Double roiRatio

){}