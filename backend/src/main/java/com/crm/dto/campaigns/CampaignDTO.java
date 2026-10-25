package com.crm.dto.campaigns;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

public class CampaignDTO {
    private Long id;
    private String code;
    private String name;
    private String channel;
    private BigDecimal budget;
    private BigDecimal expectedRevenue;
    private BigDecimal actualCost;
    private LocalDate startDate;
    private LocalDate endDate;
    private String status;
    private String description;
    private Long ownerUserId;
    private String ownerName;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    // Computed Performance Metrics
    private int totalLeads;
    private int totalOpportunities;
    private int wonOpportunities;
    private BigDecimal wonRevenue;
    private BigDecimal roiPercent;
    private BigDecimal conversionRate;
    private BigDecimal costPerLead;

    public CampaignDTO() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getChannel() { return channel; }
    public void setChannel(String channel) { this.channel = channel; }

    public BigDecimal getBudget() { return budget; }
    public void setBudget(BigDecimal budget) { this.budget = budget; }

    public BigDecimal getExpectedRevenue() { return expectedRevenue; }
    public void setExpectedRevenue(BigDecimal expectedRevenue) { this.expectedRevenue = expectedRevenue; }

    public BigDecimal getActualCost() { return actualCost; }
    public void setActualCost(BigDecimal actualCost) { this.actualCost = actualCost; }

    public LocalDate getStartDate() { return startDate; }
    public void setStartDate(LocalDate startDate) { this.startDate = startDate; }

    public LocalDate getEndDate() { return endDate; }
    public void setEndDate(LocalDate endDate) { this.endDate = endDate; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public Long getOwnerUserId() { return ownerUserId; }
    public void setOwnerUserId(Long ownerUserId) { this.ownerUserId = ownerUserId; }

    public String getOwnerName() { return ownerName; }
    public void setOwnerName(String ownerName) { this.ownerName = ownerName; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }

    public int getTotalLeads() { return totalLeads; }
    public void setTotalLeads(int totalLeads) { this.totalLeads = totalLeads; }

    public int getTotalOpportunities() { return totalOpportunities; }
    public void setTotalOpportunities(int totalOpportunities) { this.totalOpportunities = totalOpportunities; }

    public int getWonOpportunities() { return wonOpportunities; }
    public void setWonOpportunities(int wonOpportunities) { this.wonOpportunities = wonOpportunities; }

    public BigDecimal getWonRevenue() { return wonRevenue; }
    public void setWonRevenue(BigDecimal wonRevenue) { this.wonRevenue = wonRevenue; }

    public BigDecimal getRoiPercent() { return roiPercent; }
    public void setRoiPercent(BigDecimal roiPercent) { this.roiPercent = roiPercent; }

    public BigDecimal getConversionRate() { return conversionRate; }
    public void setConversionRate(BigDecimal conversionRate) { this.conversionRate = conversionRate; }

    public BigDecimal getCostPerLead() { return costPerLead; }
    public void setCostPerLead(BigDecimal costPerLead) { this.costPerLead = costPerLead; }
}
