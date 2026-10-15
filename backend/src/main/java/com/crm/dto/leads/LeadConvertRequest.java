package com.crm.dto.leads;

import com.google.gson.annotations.SerializedName;
import java.math.BigDecimal;

public class LeadConvertRequest {
    private Long leadId;

    private boolean createNewCustomer = true;
    private String customerMode;

    private Long existingCustomerId;

    @SerializedName(value = "customerName", alternate = {"companyName", "name"})
    private String customerName;

    @SerializedName(value = "customerTaxCode", alternate = {"taxCode"})
    private String customerTaxCode;

    @SerializedName(value = "customerPhone", alternate = {"companyPhone", "phone"})
    private String customerPhone;

    @SerializedName(value = "customerEmail", alternate = {"companyEmail", "email"})
    private String customerEmail;

    @SerializedName(value = "customerWebsite", alternate = {"companyWebsite", "website"})
    private String customerWebsite;

    private String customerAddress;
    private Long industryId;
    private Long companySizeId;
    private Long regionId;

    // 2. Người liên hệ
    private String contactName;
    private String contactTitle;
    private String contactPhone;
    private String contactEmail;

    @SerializedName(value = "contactBuyingRole", alternate = {"buyingRole"})
    private String contactBuyingRole = "INFLUENCER";

    // 3. Cơ hội bán hàng
    private boolean createOpportunity = true;
    private String opportunityName;
    private BigDecimal opportunityAmount = BigDecimal.ZERO;
    private Long pipelineStageId = 1L; // Mặc định giai đoạn 1: Mới tiếp cận
    private String expectedCloseDate;

    // Getters and Setters
    public Long getLeadId() {
        return leadId;
    }

    public void setLeadId(Long leadId) {
        this.leadId = leadId;
    }

    public boolean isCreateNewCustomer() {
        if ("EXISTING".equalsIgnoreCase(customerMode)) {
            return false;
        }
        if ("NEW".equalsIgnoreCase(customerMode)) {
            return true;
        }
        return createNewCustomer;
    }

    public void setCustomerMode(String customerMode) {
        this.customerMode = customerMode;
        if ("EXISTING".equalsIgnoreCase(customerMode)) {
            this.createNewCustomer = false;
        } else if ("NEW".equalsIgnoreCase(customerMode)) {
            this.createNewCustomer = true;
        }
    }

    public String getCustomerMode() {
        return customerMode;
    }

    public void setCreateNewCustomer(boolean createNewCustomer) {
        this.createNewCustomer = createNewCustomer;
    }

    public Long getExistingCustomerId() {
        return existingCustomerId;
    }

    public void setExistingCustomerId(Long existingCustomerId) {
        this.existingCustomerId = existingCustomerId;
    }

    public String getCustomerName() {
        return customerName;
    }

    public void setCustomerName(String customerName) {
        this.customerName = customerName;
    }

    public void setCompanyName(String companyName) {
        this.customerName = companyName;
    }

    public void setTaxCode(String taxCode) {
        this.customerTaxCode = taxCode;
    }

    public void setCompanyPhone(String phone) {
        this.customerPhone = phone;
    }

    public void setCompanyEmail(String email) {
        this.customerEmail = email;
    }

    public void setCompanyWebsite(String website) {
        this.customerWebsite = website;
    }

    public void setBuyingRole(String role) {
        this.contactBuyingRole = role;
    }

    public String getCustomerTaxCode() {
        return customerTaxCode;
    }

    public void setCustomerTaxCode(String customerTaxCode) {
        this.customerTaxCode = customerTaxCode;
    }

    public String getCustomerPhone() {
        return customerPhone;
    }

    public void setCustomerPhone(String customerPhone) {
        this.customerPhone = customerPhone;
    }

    public String getCustomerEmail() {
        return customerEmail;
    }

    public void setCustomerEmail(String customerEmail) {
        this.customerEmail = customerEmail;
    }

    public String getCustomerWebsite() {
        return customerWebsite;
    }

    public void setCustomerWebsite(String customerWebsite) {
        this.customerWebsite = customerWebsite;
    }

    public String getCustomerAddress() {
        return customerAddress;
    }

    public void setCustomerAddress(String customerAddress) {
        this.customerAddress = customerAddress;
    }

    public Long getIndustryId() {
        return industryId;
    }

    public void setIndustryId(Long industryId) {
        this.industryId = industryId;
    }

    public Long getCompanySizeId() {
        return companySizeId;
    }

    public void setCompanySizeId(Long companySizeId) {
        this.companySizeId = companySizeId;
    }

    public Long getRegionId() {
        return regionId;
    }

    public void setRegionId(Long regionId) {
        this.regionId = regionId;
    }

    public String getContactName() {
        return contactName;
    }

    public void setContactName(String contactName) {
        this.contactName = contactName;
    }

    public String getContactTitle() {
        return contactTitle;
    }

    public void setContactTitle(String contactTitle) {
        this.contactTitle = contactTitle;
    }

    public String getContactPhone() {
        return contactPhone;
    }

    public void setContactPhone(String contactPhone) {
        this.contactPhone = contactPhone;
    }

    public String getContactEmail() {
        return contactEmail;
    }

    public void setContactEmail(String contactEmail) {
        this.contactEmail = contactEmail;
    }

    public String getContactBuyingRole() {
        if (contactBuyingRole == null || contactBuyingRole.trim().isBlank()) {
            return "INFLUENCER";
        }
        String r = contactBuyingRole.trim().toUpperCase();
        return switch (r) {
            case "DECISION_MAKER" -> "DECISION_MAKER";
            case "BLOCKER" -> "BLOCKER";
            case "END_USER", "USER" -> "END_USER";
            default -> "INFLUENCER"; // Map BUYER, CHAMPION, INFLUENCER to INFLUENCER
        };
    }

    public void setContactBuyingRole(String contactBuyingRole) {
        this.contactBuyingRole = contactBuyingRole;
    }

    public boolean isCreateOpportunity() {
        return createOpportunity;
    }

    public void setCreateOpportunity(boolean createOpportunity) {
        this.createOpportunity = createOpportunity;
    }

    public String getOpportunityName() {
        return opportunityName;
    }

    public void setOpportunityName(String opportunityName) {
        this.opportunityName = opportunityName;
    }

    public BigDecimal getOpportunityAmount() {
        return opportunityAmount;
    }

    public void setOpportunityAmount(BigDecimal opportunityAmount) {
        this.opportunityAmount = opportunityAmount;
    }

    public Long getPipelineStageId() {
        return pipelineStageId;
    }

    public void setPipelineStageId(Long pipelineStageId) {
        this.pipelineStageId = pipelineStageId;
    }

    public String getExpectedCloseDate() {
        return expectedCloseDate;
    }

    public void setExpectedCloseDate(String expectedCloseDate) {
        this.expectedCloseDate = expectedCloseDate;
    }
}
