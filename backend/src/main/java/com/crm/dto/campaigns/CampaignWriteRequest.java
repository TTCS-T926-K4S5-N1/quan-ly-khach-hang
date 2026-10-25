package com.crm.dto.campaigns;

import java.math.BigDecimal;
import java.time.LocalDate;

public class CampaignWriteRequest {
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

    public CampaignWriteRequest() {}

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
}
