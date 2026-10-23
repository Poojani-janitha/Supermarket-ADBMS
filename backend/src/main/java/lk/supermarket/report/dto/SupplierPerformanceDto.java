package lk.supermarket.report.dto;

import java.math.BigDecimal;

/**
 * DTO representing a row from the analytical view: v_supplier_performance.
 * Includes metrics computed via scalar function fn_supplier_fulfillment_rate.
 */
public class SupplierPerformanceDto {
    private Integer supplierId;
    private String supplierName;
    private String contactPerson;
    private String phone;
    private String city;
    private int totalOrders;
    private BigDecimal totalRequestedQty;
    private BigDecimal totalConfirmedQty;
    private BigDecimal totalReceivedQty;
    private BigDecimal totalSpend;
    private BigDecimal fulfillmentRate;
    private String ratingTier;

    public SupplierPerformanceDto() {
    }

    public SupplierPerformanceDto(Integer supplierId, String supplierName, String contactPerson,
                                  String phone, String city, int totalOrders,
                                  BigDecimal totalRequestedQty, BigDecimal totalConfirmedQty,
                                  BigDecimal totalReceivedQty, BigDecimal totalSpend,
                                  BigDecimal fulfillmentRate, String ratingTier) {
        this.supplierId = supplierId;
        this.supplierName = supplierName;
        this.contactPerson = contactPerson;
        this.phone = phone;
        this.city = city;
        this.totalOrders = totalOrders;
        this.totalRequestedQty = totalRequestedQty;
        this.totalConfirmedQty = totalConfirmedQty;
        this.totalReceivedQty = totalReceivedQty;
        this.totalSpend = totalSpend;
        this.fulfillmentRate = fulfillmentRate;
        this.ratingTier = ratingTier;
    }

    public Integer getSupplierId() {
        return supplierId;
    }

    public void setSupplierId(Integer supplierId) {
        this.supplierId = supplierId;
    }

    public String getSupplierName() {
        return supplierName;
    }

    public void setSupplierName(String supplierName) {
        this.supplierName = supplierName;
    }

    public String getContactPerson() {
        return contactPerson;
    }

    public void setContactPerson(String contactPerson) {
        this.contactPerson = contactPerson;
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    public String getCity() {
        return city;
    }

    public void setCity(String city) {
        this.city = city;
    }

    public int getTotalOrders() {
        return totalOrders;
    }

    public void setTotalOrders(int totalOrders) {
        this.totalOrders = totalOrders;
    }

    public BigDecimal getTotalRequestedQty() {
        return totalRequestedQty;
    }

    public void setTotalRequestedQty(BigDecimal totalRequestedQty) {
        this.totalRequestedQty = totalRequestedQty;
    }

    public BigDecimal getTotalConfirmedQty() {
        return totalConfirmedQty;
    }

    public void setTotalConfirmedQty(BigDecimal totalConfirmedQty) {
        this.totalConfirmedQty = totalConfirmedQty;
    }

    public BigDecimal getTotalReceivedQty() {
        return totalReceivedQty;
    }

    public void setTotalReceivedQty(BigDecimal totalReceivedQty) {
        this.totalReceivedQty = totalReceivedQty;
    }

    public BigDecimal getTotalSpend() {
        return totalSpend;
    }

    public void setTotalSpend(BigDecimal totalSpend) {
        this.totalSpend = totalSpend;
    }

    public BigDecimal getFulfillmentRate() {
        return fulfillmentRate;
    }

    public void setFulfillmentRate(BigDecimal fulfillmentRate) {
        this.fulfillmentRate = fulfillmentRate;
    }

    public String getRatingTier() {
        return ratingTier;
    }

    public void setRatingTier(String ratingTier) {
        this.ratingTier = ratingTier;
    }
}
