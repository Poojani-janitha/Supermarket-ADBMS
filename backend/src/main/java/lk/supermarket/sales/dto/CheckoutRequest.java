package lk.supermarket.sales.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import java.util.List;

public class CheckoutRequest {
    @NotNull(message = "Branch ID is required")
    private Integer branchId;

    private Integer customerId;

    @NotNull(message = "Employee ID is required")
    private Integer employeeId;

    @NotNull(message = "Payment method is required")
    private String paymentMethod; // CASH, CARD, QR, ONLINE

    private String couponCode;

    @NotEmpty(message = "Cart items cannot be empty")
    @Valid
    private List<OrderItemDto> items;

    public CheckoutRequest() {}

    public Integer getBranchId() {
        return branchId;
    }

    public void setBranchId(Integer branchId) {
        this.branchId = branchId;
    }

    public Integer getCustomerId() {
        return customerId;
    }

    public void setCustomerId(Integer customerId) {
        this.customerId = customerId;
    }

    public Integer getEmployeeId() {
        return employeeId;
    }

    public void setEmployeeId(Integer employeeId) {
        this.employeeId = employeeId;
    }

    public String getPaymentMethod() {
        return paymentMethod;
    }

    public void setPaymentMethod(String paymentMethod) {
        this.paymentMethod = paymentMethod;
    }

    public String getCouponCode() {
        return couponCode;
    }

    public void setCouponCode(String couponCode) {
        this.couponCode = couponCode;
    }

    public List<OrderItemDto> getItems() {
        return items;
    }

    public void setItems(List<OrderItemDto> items) {
        this.items = items;
    }
}
