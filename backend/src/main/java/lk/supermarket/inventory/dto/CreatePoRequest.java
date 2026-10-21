package lk.supermarket.inventory.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import java.math.BigDecimal;

/**
 * Request payload for creating a Purchase Order.
 * Handled by stored procedure: sp_create_purchase_order
 */
public class CreatePoRequest {

    @NotNull(message = "Supplier ID is required")
    private Integer supplierId;

    @NotNull(message = "Branch ID is required")
    private Integer branchId;

    @NotNull(message = "Requesting employee ID is required")
    private Integer employeeId;

    @NotNull(message = "Product ID is required")
    private Integer productId;

    @NotNull(message = "Quantity is required")
    @Positive(message = "Quantity must be greater than zero")
    private BigDecimal qty;

    public CreatePoRequest() {
    }

    public CreatePoRequest(Integer supplierId, Integer branchId, Integer employeeId, Integer productId, BigDecimal qty) {
        this.supplierId = supplierId;
        this.branchId = branchId;
        this.employeeId = employeeId;
        this.productId = productId;
        this.qty = qty;
    }

    public Integer getSupplierId() {
        return supplierId;
    }

    public void setSupplierId(Integer supplierId) {
        this.supplierId = supplierId;
    }

    public Integer getBranchId() {
        return branchId;
    }

    public void setBranchId(Integer branchId) {
        this.branchId = branchId;
    }

    public Integer getEmployeeId() {
        return employeeId;
    }

    public void setEmployeeId(Integer employeeId) {
        this.employeeId = employeeId;
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
