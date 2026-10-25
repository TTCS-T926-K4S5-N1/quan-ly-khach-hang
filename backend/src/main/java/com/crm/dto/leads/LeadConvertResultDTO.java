package com.crm.dto.leads;

public class LeadConvertResultDTO {
    private Long leadId;
    private Long customerId;
    private String customerName;
    private Long contactId;
    private String contactName;
    private Long opportunityId;
    private String opportunityName;
    private String convertedAt;
    private String convertedByUserName;
    private int activitiesPreservedCount;

    public Long getLeadId() {
        return leadId;
    }

    public void setLeadId(Long leadId) {
        this.leadId = leadId;
    }

    public Long getCustomerId() {
        return customerId;
    }

    public void setCustomerId(Long customerId) {
        this.customerId = customerId;
    }

    public String getCustomerName() {
        return customerName;
    }

    public void setCustomerName(String customerName) {
        this.customerName = customerName;
    }

    public Long getContactId() {
        return contactId;
    }

    public void setContactId(Long contactId) {
        this.contactId = contactId;
    }

    public String getContactName() {
        return contactName;
    }

    public void setContactName(String contactName) {
        this.contactName = contactName;
    }

    public Long getOpportunityId() {
        return opportunityId;
    }

    public void setOpportunityId(Long opportunityId) {
        this.opportunityId = opportunityId;
    }

    public String getOpportunityName() {
        return opportunityName;
    }

    public void setOpportunityName(String opportunityName) {
        this.opportunityName = opportunityName;
    }

    public String getConvertedAt() {
        return convertedAt;
    }

    public void setConvertedAt(String convertedAt) {
        this.convertedAt = convertedAt;
    }

    public String getConvertedByUserName() {
        return convertedByUserName;
    }

    public void setConvertedByUserName(String convertedByUserName) {
        this.convertedByUserName = convertedByUserName;
    }

    public int getActivitiesPreservedCount() {
        return activitiesPreservedCount;
    }

    public void setActivitiesPreservedCount(int activitiesPreservedCount) {
        this.activitiesPreservedCount = activitiesPreservedCount;
    }
}
