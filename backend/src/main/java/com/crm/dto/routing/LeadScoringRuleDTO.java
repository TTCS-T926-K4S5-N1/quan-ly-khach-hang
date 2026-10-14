package com.crm.dto.routing;

import java.time.LocalDateTime;

public class LeadScoringRuleDTO {
    private Long id;
    private String category;       // INDUSTRY, COMPANY_SIZE, LEAD_SOURCE, INTEREST_LEVEL, REGION
    private String criterionKey;   // Mã định danh tiêu chí
    private String criterionName;  // Tên hiển thị
    private int score;             // Điểm cộng hoặc trừ
    private boolean active;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public LeadScoringRuleDTO() {}

    public LeadScoringRuleDTO(Long id, String category, String criterionKey, String criterionName, int score, boolean active) {
        this.id = id;
        this.category = category;
        this.criterionKey = criterionKey;
        this.criterionName = criterionName;
        this.score = score;
        this.active = active;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }

    public String getCriterionKey() { return criterionKey; }
    public void setCriterionKey(String criterionKey) { this.criterionKey = criterionKey; }

    public String getCriterionName() { return criterionName; }
    public void setCriterionName(String criterionName) { this.criterionName = criterionName; }

    public int getScore() { return score; }
    public void setScore(int score) { this.score = score; }

    public boolean isActive() { return active; }
    public void setActive(boolean active) { this.active = active; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
