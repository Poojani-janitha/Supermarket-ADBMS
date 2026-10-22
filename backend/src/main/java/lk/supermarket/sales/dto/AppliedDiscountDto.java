package lk.supermarket.sales.dto;

import java.math.BigDecimal;

public class AppliedDiscountDto {
    private Integer ruleId;
    private String ruleName;
    private BigDecimal amount;

    public AppliedDiscountDto() {}

    public AppliedDiscountDto(Integer ruleId, String ruleName, BigDecimal amount) {
        this.ruleId = ruleId;
        this.ruleName = ruleName;
        this.amount = amount;
    }

    public Integer getRuleId() {
        return ruleId;
    }

    public void setRuleId(Integer ruleId) {
        this.ruleId = ruleId;
    }

    public String getRuleName() {
        return ruleName;
    }

    public void setRuleName(String ruleName) {
        this.ruleName = ruleName;
    }

    public BigDecimal getAmount() {
        return amount;
    }

    public void setAmount(BigDecimal amount) {
        this.amount = amount;
    }
}
