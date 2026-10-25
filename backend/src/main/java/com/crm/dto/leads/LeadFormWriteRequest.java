package com.crm.dto.leads;

public class LeadFormWriteRequest {
    private String name;
    private String title;
    private String description;
    private String leadSourceName;
    private Long leadSourceId;
    private String submitButtonText;
    private String successMessage;
    private String redirectUrl;
    private Long defaultOwnerId;
    private Boolean active;

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

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getLeadSourceName() {
        return leadSourceName != null && !leadSourceName.isBlank() ? leadSourceName : "Website / Biểu mẫu";
    }

    public void setLeadSourceName(String leadSourceName) {
        this.leadSourceName = leadSourceName;
    }

    public Long getLeadSourceId() {
        return leadSourceId;
    }

    public void setLeadSourceId(Long leadSourceId) {
        this.leadSourceId = leadSourceId;
    }

    public String getSubmitButtonText() {
        return submitButtonText != null && !submitButtonText.isBlank() ? submitButtonText : "Gửi yêu cầu tư vấn";
    }

    public void setSubmitButtonText(String submitButtonText) {
        this.submitButtonText = submitButtonText;
    }

    public String getSuccessMessage() {
        return successMessage != null && !successMessage.isBlank()
                ? successMessage
                : "Cảm ơn quý khách! Chúng tôi đã nhận được thông tin và sẽ liên hệ lại sớm nhất.";
    }

    public void setSuccessMessage(String successMessage) {
        this.successMessage = successMessage;
    }

    public String getRedirectUrl() {
        return redirectUrl;
    }

    public void setRedirectUrl(String redirectUrl) {
        this.redirectUrl = redirectUrl;
    }

    public Long getDefaultOwnerId() {
        return defaultOwnerId;
    }

    public void setDefaultOwnerId(Long defaultOwnerId) {
        this.defaultOwnerId = defaultOwnerId;
    }

    public Boolean getActive() {
        return active != null ? active : true;
    }

    public void setActive(Boolean active) {
        this.active = active;
    }
}
