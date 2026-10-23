package lk.supermarket.report.dto;

import java.math.BigDecimal;

public record ProductRankDto(
    Integer rank,
    Integer productId,
    String productName,
    String sku,
    Integer unitsSold,
    BigDecimal revenue
) {}