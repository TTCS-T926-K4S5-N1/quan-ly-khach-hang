package com.crm.dto.automation;

import java.sql.Timestamp;

public class AutomationLogDTO {
    private Long id;
    private Long ruleId;
    private String ruleName;
    private String triggerEvent;
    private String entityType;
    private Long entityId;
    private String entityName;
    private String actionType;
    private String actionSummary;
    private String status;        // SUCCESS, FAILED
    private String errorMessage;
    private Timestamp executedAt;

    public AutomationLogDTO() {}

    public AutomationLogDTO(Long ruleId, String ruleName, String triggerEvent, String entityType, Long entityId, String entityName, String actionType, String actionSummary, String status, String errorMessage) {
        this.ruleId = ruleId;
        this.ruleName = ruleName;
        this.triggerEvent = triggerEvent;
        this.entityType = entityType;
        this.entityId = entityId;
        this.entityName = entityName;
        this.actionType = actionType;
        this.actionSummary = actionSummary;
        this.status = status;
        this.errorMessage = errorMessage;
        this.executedAt = new Timestamp(System.currentTimeMillis());
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getRuleId() { return ruleId; }
    public void setRuleId(Long ruleId) { this.ruleId = ruleId; }

    public String getRuleName() { return ruleName; }
    public void setRuleName(String ruleName) { this.ruleName = ruleName; }

    public String getTriggerEvent() { return triggerEvent; }
    public void setTriggerEvent(String triggerEvent) { this.triggerEvent = triggerEvent; }

    public String getEntityType() { return entityType; }
    public void setEntityType(String entityType) { this.entityType = entityType; }

    public Long getEntityId() { return entityId; }
    public void setEntityId(Long entityId) { this.entityId = entityId; }

    public String getEntityName() { return entityName; }
    public void setEntityName(String entityName) { this.entityName = entityName; }

    public String getActionType() { return actionType; }
    public void setActionType(String actionType) { this.actionType = actionType; }

    public String getActionSummary() { return actionSummary; }
    public void setActionSummary(String actionSummary) { this.actionSummary = actionSummary; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getErrorMessage() { return errorMessage; }
    public void setErrorMessage(String errorMessage) { this.errorMessage = errorMessage; }

    public Timestamp getExecutedAt() { return executedAt; }
    public void setExecutedAt(Timestamp executedAt) { this.executedAt = executedAt; }
}
