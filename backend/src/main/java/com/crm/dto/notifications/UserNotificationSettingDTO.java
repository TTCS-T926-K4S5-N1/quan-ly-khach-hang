package com.crm.dto.notifications;

import java.io.Serializable;

public class UserNotificationSettingDTO implements Serializable {
    private static final long serialVersionUID = 1L;

    private Long id;
    private long userId;
    private String notificationType;
    private String typeLabel;
    private String description;
    private boolean inAppEnabled;
    private boolean emailEnabled;
    private boolean mandatory;

    public UserNotificationSettingDTO() {}

    public UserNotificationSettingDTO(long userId, String notificationType, String typeLabel, String description,
                                      boolean inAppEnabled, boolean emailEnabled, boolean mandatory) {
        this.userId = userId;
        this.notificationType = notificationType;
        this.typeLabel = typeLabel;
        this.description = description;
        this.inAppEnabled = inAppEnabled;
        this.emailEnabled = emailEnabled;
        this.mandatory = mandatory;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public long getUserId() {
        return userId;
    }

    public void setUserId(long userId) {
        this.userId = userId;
    }

    public String getNotificationType() {
        return notificationType;
    }

    public void setNotificationType(String notificationType) {
        this.notificationType = notificationType;
    }

    public String getTypeLabel() {
        return typeLabel;
    }

    public void setTypeLabel(String typeLabel) {
        this.typeLabel = typeLabel;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public boolean isInAppEnabled() {
        return inAppEnabled;
    }

    public void setInAppEnabled(boolean inAppEnabled) {
        this.inAppEnabled = inAppEnabled;
    }

    public boolean isEmailEnabled() {
        return emailEnabled;
    }

    public void setEmailEnabled(boolean emailEnabled) {
        this.emailEnabled = emailEnabled;
    }

    public boolean isMandatory() {
        return mandatory;
    }

    public void setMandatory(boolean mandatory) {
        this.mandatory = mandatory;
    }
}
