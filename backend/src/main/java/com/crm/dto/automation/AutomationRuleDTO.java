package com.crm.dto.automation;

import java.sql.Timestamp;

public class AutomationRuleDTO {
    private Long id;
    private String name;
    private String description;
    private String triggerEvent;     // STAGE_CHANGED, STATUS_CHANGED, TIME_ELAPSED, STAGNANT_FLAGGED
    private String triggerEntity;    // OPPORTUNITY, LEAD, QUOTE
    private String conditionField;   // stage_id, status, days_in_stage
    private String conditionOperator;// EQUALS, GREATER_THAN
    private String conditionValue;   // e.g. "3" or "PROPOSAL"
    private String actionType;       // CREATE_TASK, SEND_NOTIFICATION, CHANGE_OWNER
    private String actionParams;     // JSON string
    private boolean active;
    private Long createdBy;
    private Timestamp createdAt;
    private Timestamp updatedAt;

    public AutomationRuleDTO() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getTriggerEvent() { return triggerEvent; }
    public void setTriggerEvent(String triggerEvent) { this.triggerEvent = triggerEvent; }

    public String getTriggerEntity() { return triggerEntity; }
    public void setTriggerEntity(String triggerEntity) { this.triggerEntity = triggerEntity; }

    public String getConditionField() { return conditionField; }
    public void setConditionField(String conditionField) { this.conditionField = conditionField; }

    public String getConditionOperator() { return conditionOperator; }
    public void setConditionOperator(String conditionOperator) { this.conditionOperator = conditionOperator; }

    public String getConditionValue() { return conditionValue; }
    public void setConditionValue(String conditionValue) { this.conditionValue = conditionValue; }

    public String getActionType() { return actionType; }
    public void setActionType(String actionType) { this.actionType = actionType; }

    public String getActionParams() { return actionParams; }
    public void setActionParams(String actionParams) { this.actionParams = actionParams; }

    public boolean isActive() { return active; }
    public void setActive(boolean active) { this.active = active; }

    public Long getCreatedBy() { return createdBy; }
    public void setCreatedBy(Long createdBy) { this.createdBy = createdBy; }

    public Timestamp getCreatedAt() { return createdAt; }
    public void setCreatedAt(Timestamp createdAt) { this.createdAt = createdAt; }

    public Timestamp getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Timestamp updatedAt) { this.updatedAt = updatedAt; }
}
