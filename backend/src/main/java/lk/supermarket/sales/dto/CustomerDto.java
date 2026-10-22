package lk.supermarket.sales.dto;

public class CustomerDto {
    private Integer id;
    private String fullName;
    private String phone;
    private String email;
    private Integer loyaltyPoints;
    private String tier;
    private String registeredDate;

    public CustomerDto() {}

    public Integer getId() { return id; }
    public void setId(Integer id) { this.id = id; }

    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public Integer getLoyaltyPoints() { return loyaltyPoints; }
    public void setLoyaltyPoints(Integer loyaltyPoints) { this.loyaltyPoints = loyaltyPoints; }

    public String getTier() { return tier; }
    public void setTier(String tier) { this.tier = tier; }

    public String getRegisteredDate() { return registeredDate; }
    public void setRegisteredDate(String registeredDate) { this.registeredDate = registeredDate; }
}
