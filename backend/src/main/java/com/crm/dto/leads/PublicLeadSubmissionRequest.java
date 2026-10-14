package com.crm.dto.leads;

public class PublicLeadSubmissionRequest {
    private String formKey;
    private String fullName;
    private String email;
    private String phone;
    private String company;
    private String interest;
    private String _hp_website; // Honeypot trap for bots
    private Long loadTimestamp; // Form load timestamp for speed limit check

    public String getFormKey() {
        return formKey;
    }

    public void setFormKey(String formKey) {
        this.formKey = formKey;
    }

    public String getFullName() {
        return fullName;
    }

    public void setFullName(String fullName) {
        this.fullName = fullName;
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

    public String getCompany() {
        return company;
    }

    public void setCompany(String company) {
        this.company = company;
    }

    public String getInterest() {
        return interest;
    }

    public void setInterest(String interest) {
        this.interest = interest;
    }

    public String get_hp_website() {
        return _hp_website;
    }

    public void set_hp_website(String _hp_website) {
        this._hp_website = _hp_website;
    }

    public Long getLoadTimestamp() {
        return loadTimestamp;
    }

    public void setLoadTimestamp(Long loadTimestamp) {
        this.loadTimestamp = loadTimestamp;
    }
}
