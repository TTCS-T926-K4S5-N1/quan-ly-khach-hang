package com.crm.dto.routing;

import java.time.LocalDateTime;
import java.util.List;

public class LeadAssignmentRuleDTO {
    private Long id;
    private String name;
    private int priority;
    private boolean active;
    private String targetType;           // ROUND_ROBIN, DIRECT_USER
    private Long assigneeUserId;         // Nếu DIRECT_USER
    private String assigneeUserName;
    private Long assigneeTeamId;         // Nếu gán theo Team
    private String assigneeTeamName;
    private List<Long> assigneeUserIds;  // Nếu ROUND_ROBIN
    private List<String> assigneeUserNames;
    private Long lastAssignedUserId;
    
    // Điều kiện khớp (Criteria)
    private Long conditionRegionId;
    private String conditionRegionName;
    private Long conditionIndustryId;
    private String conditionIndustryName;
    private String conditionLeadSource;
    private Long conditionCompanySizeId;
    private String conditionCompanySizeName;
    private Integer conditionMinScore;
    
    private String description;
    private Long createdBy;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public LeadAssignmentRuleDTO() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public int getPriority() { return priority; }
    public void setPriority(int priority) { this.priority = priority; }

    public boolean isActive() { return active; }
    public void setActive(boolean active) { this.active = active; }

    public String getTargetType() { return targetType; }
    public void setTargetType(String targetType) { this.targetType = targetType; }

    public Long getAssigneeUserId() { return assigneeUserId; }
    public void setAssigneeUserId(Long assigneeUserId) { this.assigneeUserId = assigneeUserId; }

    public String getAssigneeUserName() { return assigneeUserName; }
    public void setAssigneeUserName(String assigneeUserName) { this.assigneeUserName = assigneeUserName; }

    public Long getAssigneeTeamId() { return assigneeTeamId; }
    public void setAssigneeTeamId(Long assigneeTeamId) { this.assigneeTeamId = assigneeTeamId; }

    public String getAssigneeTeamName() { return assigneeTeamName; }
    public void setAssigneeTeamName(String assigneeTeamName) { this.assigneeTeamName = assigneeTeamName; }

    public List<Long> getAssigneeUserIds() { return assigneeUserIds; }
    public void setAssigneeUserIds(List<Long> assigneeUserIds) { this.assigneeUserIds = assigneeUserIds; }

    public List<String> getAssigneeUserNames() { return assigneeUserNames; }
    public void setAssigneeUserNames(List<String> assigneeUserNames) { this.assigneeUserNames = assigneeUserNames; }

    public Long getLastAssignedUserId() { return lastAssignedUserId; }
    public void setLastAssignedUserId(Long lastAssignedUserId) { this.lastAssignedUserId = lastAssignedUserId; }

    public Long getConditionRegionId() { return conditionRegionId; }
    public void setConditionRegionId(Long conditionRegionId) { this.conditionRegionId = conditionRegionId; }

    public String getConditionRegionName() { return conditionRegionName; }
    public void setConditionRegionName(String conditionRegionName) { this.conditionRegionName = conditionRegionName; }

    public Long getConditionIndustryId() { return conditionIndustryId; }
    public void setConditionIndustryId(Long conditionIndustryId) { this.conditionIndustryId = conditionIndustryId; }

    public String getConditionIndustryName() { return conditionIndustryName; }
    public void setConditionIndustryName(String conditionIndustryName) { this.conditionIndustryName = conditionIndustryName; }

    public String getConditionLeadSource() { return conditionLeadSource; }
    public void setConditionLeadSource(String conditionLeadSource) { this.conditionLeadSource = conditionLeadSource; }

    public Long getConditionCompanySizeId() { return conditionCompanySizeId; }
    public void setConditionCompanySizeId(Long conditionCompanySizeId) { this.conditionCompanySizeId = conditionCompanySizeId; }

    public String getConditionCompanySizeName() { return conditionCompanySizeName; }
    public void setConditionCompanySizeName(String conditionCompanySizeName) { this.conditionCompanySizeName = conditionCompanySizeName; }

    public Integer getConditionMinScore() { return conditionMinScore; }
    public void setConditionMinScore(Integer conditionMinScore) { this.conditionMinScore = conditionMinScore; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public Long getCreatedBy() { return createdBy; }
    public void setCreatedBy(Long createdBy) { this.createdBy = createdBy; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
