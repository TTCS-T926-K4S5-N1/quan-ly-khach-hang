package com.crm.dto.notifications;

import java.sql.Timestamp;

public class NotificationDTO {
    private Long id;
    private Long userId;
    private String type;
    private String title;
    private String content;
    private String link;
    private String entityType;
    private Long entityId;
    private boolean isRead;
    private Timestamp createdAt;
    private String timeAgo;

    public NotificationDTO() {}

    public NotificationDTO(Long userId, String type, String title, String content, String link, String entityType, Long entityId) {
        this.userId = userId;
        this.type = type;
        this.title = title;
        this.content = content;
        this.link = link;
        this.entityType = entityType;
        this.entityId = entityId;
        this.isRead = false;
        this.createdAt = new Timestamp(System.currentTimeMillis());
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }

    public String getLink() { return link; }
    public void setLink(String link) { this.link = link; }

    public String getEntityType() { return entityType; }
    public void setEntityType(String entityType) { this.entityType = entityType; }

    public Long getEntityId() { return entityId; }
    public void setEntityId(Long entityId) { this.entityId = entityId; }

    public boolean isRead() { return isRead; }
    public void setRead(boolean read) { isRead = read; }

    public Timestamp getCreatedAt() { return createdAt; }
    public void setCreatedAt(Timestamp createdAt) { this.createdAt = createdAt; }

    public String getTimeAgo() { return timeAgo; }
    public void setTimeAgo(String timeAgo) { this.timeAgo = timeAgo; }
}
