package lk.supermarket.report.dto;

import java.math.BigDecimal;

public record CategorySalesCteDto(
    Integer categoryId,
    String categoryName,
    String parentCategory,
    Integer hierarchyLevel,
    Integer totalProductsSold,
    BigDecimal revenue,
    Double revenueSharePercent
) {}