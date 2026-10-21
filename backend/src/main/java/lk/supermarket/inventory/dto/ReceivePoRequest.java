package lk.supermarket.inventory.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import java.math.BigDecimal;

/**
 * Request payload for Goods Receipt Note (GRN) verification.
 * Handled by stored procedure: sp_receive_purchase
 */
public class ReceivePoRequest {

    @NotNull(message = "Purchase order ID is required")
    private Integer poId;

    @NotNull(message = "Receiving employee ID is required")
    private Integer employeeId;

    @NotNull(message = "Received quantity is required")
    @PositiveOrZero(message = "Received quantity must be zero or positive")
    private BigDecimal receivedQty;

    private String notes;

    public ReceivePoRequest() {
    }

    public ReceivePoRequest(Integer poId, Integer employeeId, BigDecimal receivedQty, String notes) {
        this.poId = poId;
        this.employeeId = employeeId;
        this.receivedQty = receivedQty;
        this.notes = notes;
    }

    public Integer getPoId() {
        return poId;
    }

    public void setPoId(Integer poId) {
        this.poId = poId;
    }

    public Integer getEmployeeId() {
        return employeeId;
    }

    public void setEmployeeId(Integer employeeId) {
        this.employeeId = employeeId;
    }

    public BigDecimal getReceivedQty() {
        return receivedQty;
    }

    public void setReceivedQty(BigDecimal receivedQty) {
        this.receivedQty = receivedQty;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }
}
