package com.crm.dto.routing;

import java.time.LocalDateTime;

public class UnassignedLeadDTO {
    private Long id;
    private String name;
    private String phone;
    private String email;
    private String company;
    private Long industryId;
    private String industryName;
    private Long regionId;
    private String regionName;
    private Long companySizeId;
    private String companySizeName;
    private String leadSource;
    private int leadScore;
    private String scoreGrade;
    private String scoreGradeLabel;
    private String scoreGradeColor;
    private String scoreGradeIcon;
    private String assignmentStatus;
    private LocalDateTime createdAt;

    public UnassignedLeadDTO() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getCompany() { return company; }
    public void setCompany(String company) { this.company = company; }

    public Long getIndustryId() { return industryId; }
    public void setIndustryId(Long industryId) { this.industryId = industryId; }

    public String getIndustryName() { return industryName; }
    public void setIndustryName(String industryName) { this.industryName = industryName; }

    public Long getRegionId() { return regionId; }
    public void setRegionId(Long regionId) { this.regionId = regionId; }

    public String getRegionName() { return regionName; }
    public void setRegionName(String regionName) { this.regionName = regionName; }

    public Long getCompanySizeId() { return companySizeId; }
    public void setCompanySizeId(Long companySizeId) { this.companySizeId = companySizeId; }

    public String getCompanySizeName() { return companySizeName; }
    public void setCompanySizeName(String companySizeName) { this.companySizeName = companySizeName; }

    public String getLeadSource() { return leadSource; }
    public void setLeadSource(String leadSource) { this.leadSource = leadSource; }

    public int getLeadScore() { return leadScore; }
    public void setLeadScore(int leadScore) { this.leadScore = leadScore; }

    public String getScoreGrade() { return scoreGrade; }
    public void setScoreGrade(String scoreGrade) { this.scoreGrade = scoreGrade; }

    public String getScoreGradeLabel() { return scoreGradeLabel; }
    public void setScoreGradeLabel(String scoreGradeLabel) { this.scoreGradeLabel = scoreGradeLabel; }

    public String getScoreGradeColor() { return scoreGradeColor; }
    public void setScoreGradeColor(String scoreGradeColor) { this.scoreGradeColor = scoreGradeColor; }

    public String getScoreGradeIcon() { return scoreGradeIcon; }
    public void setScoreGradeIcon(String scoreGradeIcon) { this.scoreGradeIcon = scoreGradeIcon; }

    public String getAssignmentStatus() { return assignmentStatus; }
    public void setAssignmentStatus(String assignmentStatus) { this.assignmentStatus = assignmentStatus; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
