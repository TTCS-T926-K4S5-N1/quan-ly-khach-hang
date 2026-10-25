package com.crm.dto.routing;

public class LeadSlaAlertDTO {
    private Long id;
    private Long leadId;
    private String leadName;
    private String leadPhone;
    private int leadScore;
    private Long assignedUserId;
    private String assignedUserName;
    private Long managerUserId;
    private String alertType;
    private String message;
    private String status;
    private String createdAt;
    private String slaDeadline;
    private double hoursOverdue;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getLeadId() {
        return leadId;
    }

    public void setLeadId(Long leadId) {
        this.leadId = leadId;
    }

    public String getLeadName() {
        return leadName;
    }

    public void setLeadName(String leadName) {
        this.leadName = leadName;
    }

    public String getLeadPhone() {
        return leadPhone;
    }

    public void setLeadPhone(String leadPhone) {
        this.leadPhone = leadPhone;
    }

    public int getLeadScore() {
        return leadScore;
    }

    public void setLeadScore(int leadScore) {
        this.leadScore = leadScore;
    }

    public Long getAssignedUserId() {
        return assignedUserId;
    }

    public void setAssignedUserId(Long assignedUserId) {
        this.assignedUserId = assignedUserId;
    }

    public String getAssignedUserName() {
        return assignedUserName;
    }

    public void setAssignedUserName(String assignedUserName) {
        this.assignedUserName = assignedUserName;
    }

    public Long getManagerUserId() {
        return managerUserId;
    }

    public void setManagerUserId(Long managerUserId) {
        this.managerUserId = managerUserId;
    }

    public String getAlertType() {
        return alertType;
    }

    public void setAlertType(String alertType) {
        this.alertType = alertType;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(String createdAt) {
        this.createdAt = createdAt;
    }

    public String getSlaDeadline() {
        return slaDeadline;
    }

    public void setSlaDeadline(String slaDeadline) {
        this.slaDeadline = slaDeadline;
    }

    public double getHoursOverdue() {
        return hoursOverdue;
    }

    public void setHoursOverdue(double hoursOverdue) {
        this.hoursOverdue = hoursOverdue;
    }
}
