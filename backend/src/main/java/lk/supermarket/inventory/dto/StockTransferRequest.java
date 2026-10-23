package lk.supermarket.inventory.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import java.math.BigDecimal;

/**
 * Request payload for inter-branch stock transfers.
 * Handled by stored procedure: sp_transfer_stock
 */
public class StockTransferRequest {

    @NotNull(message = "Source branch ID is required")
    private Integer fromBranchId;

    @NotNull(message = "Destination branch ID is required")
    private Integer toBranchId;

    @NotNull(message = "Product ID is required")
    private Integer productId;

    @NotNull(message = "Transfer quantity is required")
    @Positive(message = "Transfer quantity must be greater than zero")
    private BigDecimal qty;

    public StockTransferRequest() {
    }

    public StockTransferRequest(Integer fromBranchId, Integer toBranchId, Integer productId, BigDecimal qty) {
        this.fromBranchId = fromBranchId;
        this.toBranchId = toBranchId;
        this.productId = productId;
        this.qty = qty;
    }

    public Integer getFromBranchId() {
        return fromBranchId;
    }

    public void setFromBranchId(Integer fromBranchId) {
        this.fromBranchId = fromBranchId;
    }

    public Integer getToBranchId() {
        return toBranchId;
    }

    public void setToBranchId(Integer toBranchId) {
        this.toBranchId = toBranchId;
    }

    public Integer getProductId() {
        return productId;
    }

    public void setProductId(Integer productId) {
        this.productId = productId;
    }

    public BigDecimal getQty() {
        return qty;
    }

    public void setQty(BigDecimal qty) {
        this.qty = qty;
    }
}
