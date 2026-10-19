package com.crm.dto.routing;

import java.time.LocalDateTime;

public class LeadAssignmentLogDTO {
    private Long id;
    private Long leadId;
    private String leadName;
    private Long ruleId;
    private String ruleName;
    private Long assignedToUserId;
    private String assignedToUserName;
    private Long assignedByUserId;
    private String assignedByUserName;
    private String method;        // AUTO_RULE_ROUND_ROBIN, AUTO_RULE_DIRECT, MANUAL_DISPATCH
    private String notes;
    private LocalDateTime createdAt;

    public LeadAssignmentLogDTO() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getLeadId() { return leadId; }
    public void setLeadId(Long leadId) { this.leadId = leadId; }

    public String getLeadName() { return leadName; }
    public void setLeadName(String leadName) { this.leadName = leadName; }

    public Long getRuleId() { return ruleId; }
    public void setRuleId(Long ruleId) { this.ruleId = ruleId; }

    public String getRuleName() { return ruleName; }
    public void setRuleName(String ruleName) { this.ruleName = ruleName; }

    public Long getAssignedToUserId() { return assignedToUserId; }
    public void setAssignedToUserId(Long assignedToUserId) { this.assignedToUserId = assignedToUserId; }

    public String getAssignedToUserName() { return assignedToUserName; }
    public void setAssignedToUserName(String assignedToUserName) { this.assignedToUserName = assignedToUserName; }

    public Long getAssignedByUserId() { return assignedByUserId; }
    public void setAssignedByUserId(Long assignedByUserId) { this.assignedByUserId = assignedByUserId; }

    public String getAssignedByUserName() { return assignedByUserName; }
    public void setAssignedByUserName(String assignedByUserName) { this.assignedByUserName = assignedByUserName; }

    public String getMethod() { return method; }
    public void setMethod(String method) { this.method = method; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
