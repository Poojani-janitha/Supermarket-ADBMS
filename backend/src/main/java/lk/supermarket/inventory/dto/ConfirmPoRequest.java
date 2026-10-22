package lk.supermarket.inventory.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import java.math.BigDecimal;

/**
 * Request payload for supplier confirming/amending a Purchase Order.
 * Handled by stored procedure: sp_supplier_confirm_order
 */
public class ConfirmPoRequest {

    @NotNull(message = "Purchase order ID is required")
    private Integer poId;

    @NotNull(message = "Supplier ID is required")
    private Integer supplierId;

    @NotNull(message = "Confirmed quantity is required")
    @PositiveOrZero(message = "Confirmed quantity must be zero or positive")
    private BigDecimal confirmedQty;

    private String notes;

    public ConfirmPoRequest() {
    }

    public ConfirmPoRequest(Integer poId, Integer supplierId, BigDecimal confirmedQty, String notes) {
        this.poId = poId;
        this.supplierId = supplierId;
        this.confirmedQty = confirmedQty;
        this.notes = notes;
    }

    public Integer getPoId() {
        return poId;
    }

    public void setPoId(Integer poId) {
        this.poId = poId;
    }

    public Integer getSupplierId() {
        return supplierId;
    }

    public void setSupplierId(Integer supplierId) {
        this.supplierId = supplierId;
    }

    public BigDecimal getConfirmedQty() {
        return confirmedQty;
    }

    public void setConfirmedQty(BigDecimal confirmedQty) {
        this.confirmedQty = confirmedQty;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }
}
