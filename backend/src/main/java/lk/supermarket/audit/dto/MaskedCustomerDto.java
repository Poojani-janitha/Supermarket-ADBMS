package lk.supermarket.audit.dto;

public class MaskedCustomerDto {
    private Long customerId;
    private String fullName;
    private String maskedPhone;
    private String registeredDate;
    private Integer loyaltyPoints;

    public MaskedCustomerDto() {
    }

    public MaskedCustomerDto(Long customerId, String fullName, String maskedPhone, String registeredDate, Integer loyaltyPoints) {
        this.customerId = customerId;
        this.fullName = fullName;
        this.maskedPhone = maskedPhone;
        this.registeredDate = registeredDate;
        this.loyaltyPoints = loyaltyPoints;
    }

    public Long getCustomerId() {
        return customerId;
    }

    public void setCustomerId(Long customerId) {
        this.customerId = customerId;
    }

    public String getFullName() {
        return fullName;
    }

    public void setFullName(String fullName) {
        this.fullName = fullName;
    }

    public String getMaskedPhone() {
        return maskedPhone;
    }

    public void setMaskedPhone(String maskedPhone) {
        this.maskedPhone = maskedPhone;
    }

    public String getRegisteredDate() {
        return registeredDate;
    }

    public void setRegisteredDate(String registeredDate) {
        this.registeredDate = registeredDate;
    }

    public Integer getLoyaltyPoints() {
        return loyaltyPoints;
    }

    public void setLoyaltyPoints(Integer loyaltyPoints) {
        this.loyaltyPoints = loyaltyPoints;
    }
}
