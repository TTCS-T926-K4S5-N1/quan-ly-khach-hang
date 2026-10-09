package com.crm.dto.contacts;

public class ContactWriteRequest {
    private Long customerId;
    private String name;
    private String title;
    private String email;
    private String phone;
    private String buyingRole;
    private Boolean isPrimary;
    private String notes;
    private String transferReason;

    public Long getCustomerId() {
        return customerId;
    }

    public void setCustomerId(Long customerId) {
        this.customerId = customerId;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    public String getBuyingRole() {
        if (buyingRole == null || buyingRole.isBlank()) {
            return "INFLUENCER";
        }
        return buyingRole.trim().toUpperCase();
    }

    public void setBuyingRole(String buyingRole) {
        this.buyingRole = buyingRole;
    }

    public Boolean getIsPrimary() {
        return isPrimary != null && isPrimary;
    }

    public void setIsPrimary(Boolean isPrimary) {
        this.isPrimary = isPrimary;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }

    public String getTransferReason() {
        return transferReason;
    }

    public void setTransferReason(String transferReason) {
        this.transferReason = transferReason;
    }
}
