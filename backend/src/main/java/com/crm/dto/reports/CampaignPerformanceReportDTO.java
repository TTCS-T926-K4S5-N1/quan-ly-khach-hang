package com.crm.dto.reports;

import java.math.BigDecimal;

public class CampaignPerformanceReportDTO {
    private long campaignId;
    private String campaignCode;
    private String campaignName;
    private String channel;
    private String status;
    private BigDecimal budget = BigDecimal.ZERO;
    private long totalLeads;
    private long acceptedLeads;
    private double acceptanceRate;
    private long convertedLeads;
    private double conversionRate;
    private long totalOpportunities;
    private BigDecimal totalOpportunityValue = BigDecimal.ZERO;
    private long wonOpportunities;
    private BigDecimal wonRevenue = BigDecimal.ZERO;
    private BigDecimal roi = BigDecimal.ZERO;
    private String budgetStatus; // PROFITABLE, BREAK_EVEN, LOSS, RUNNING

    public CampaignPerformanceReportDTO() {}

    public long getCampaignId() {
        return campaignId;
    }

    public void setCampaignId(long campaignId) {
        this.campaignId = campaignId;
    }

    public String getCampaignCode() {
        return campaignCode;
    }

    public void setCampaignCode(String campaignCode) {
        this.campaignCode = campaignCode;
    }

    public String getCampaignName() {
        return campaignName;
    }

    public void setCampaignName(String campaignName) {
        this.campaignName = campaignName;
    }

    public String getChannel() {
        return channel;
    }

    public void setChannel(String channel) {
        this.channel = channel;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public BigDecimal getBudget() {
        return budget;
    }

    public void setBudget(BigDecimal budget) {
        this.budget = budget != null ? budget : BigDecimal.ZERO;
    }

    public long getTotalLeads() {
        return totalLeads;
    }

    public void setTotalLeads(long totalLeads) {
        this.totalLeads = totalLeads;
    }

    public long getAcceptedLeads() {
        return acceptedLeads;
    }

    public void setAcceptedLeads(long acceptedLeads) {
        this.acceptedLeads = acceptedLeads;
    }

    public double getAcceptanceRate() {
        return acceptanceRate;
    }

    public void setAcceptanceRate(double acceptanceRate) {
        this.acceptanceRate = acceptanceRate;
    }

    public long getConvertedLeads() {
        return convertedLeads;
    }

    public void setConvertedLeads(long convertedLeads) {
        this.convertedLeads = convertedLeads;
    }

    public double getConversionRate() {
        return conversionRate;
    }

    public void setConversionRate(double conversionRate) {
        this.conversionRate = conversionRate;
    }

    public long getTotalOpportunities() {
        return totalOpportunities;
    }

    public void setTotalOpportunities(long totalOpportunities) {
        this.totalOpportunities = totalOpportunities;
    }

    public BigDecimal getTotalOpportunityValue() {
        return totalOpportunityValue;
    }

    public void setTotalOpportunityValue(BigDecimal totalOpportunityValue) {
        this.totalOpportunityValue = totalOpportunityValue != null ? totalOpportunityValue : BigDecimal.ZERO;
    }

    public long getWonOpportunities() {
        return wonOpportunities;
    }

    public void setWonOpportunities(long wonOpportunities) {
        this.wonOpportunities = wonOpportunities;
    }

    public BigDecimal getWonRevenue() {
        return wonRevenue;
    }

    public void setWonRevenue(BigDecimal wonRevenue) {
        this.wonRevenue = wonRevenue != null ? wonRevenue : BigDecimal.ZERO;
    }

    public BigDecimal getRoi() {
        return roi;
    }

    public void setRoi(BigDecimal roi) {
        this.roi = roi != null ? roi : BigDecimal.ZERO;
    }

    public String getBudgetStatus() {
        return budgetStatus;
    }

    public void setBudgetStatus(String budgetStatus) {
        this.budgetStatus = budgetStatus;
    }
}
