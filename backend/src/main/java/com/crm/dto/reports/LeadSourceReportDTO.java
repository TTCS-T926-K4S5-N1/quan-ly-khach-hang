package com.crm.dto.reports;

import java.math.BigDecimal;

public class LeadSourceReportDTO {
    private String sourceCode;
    private String sourceName;
    private long totalLeads;
    private long acceptedLeads;
    private double acceptanceRate;
    private long convertedLeads;
    private double conversionRate;
    private long totalOpportunities;
    private BigDecimal totalOpportunityValue = BigDecimal.ZERO;
    private long wonOpportunities;
    private BigDecimal wonRevenue = BigDecimal.ZERO;
    private double winRate;
    private String qualityGrade; // TOP_TIER, GOOD, OPTIMIZE_NEEDED

    public LeadSourceReportDTO() {}

    public String getSourceCode() {
        return sourceCode;
    }

    public void setSourceCode(String sourceCode) {
        this.sourceCode = sourceCode;
    }

    public String getSourceName() {
        return sourceName;
    }

    public void setSourceName(String sourceName) {
        this.sourceName = sourceName;
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

    public double getWinRate() {
        return winRate;
    }

    public void setWinRate(double winRate) {
        this.winRate = winRate;
    }

    public String getQualityGrade() {
        return qualityGrade;
    }

    public void setQualityGrade(String qualityGrade) {
        this.qualityGrade = qualityGrade;
    }
}
