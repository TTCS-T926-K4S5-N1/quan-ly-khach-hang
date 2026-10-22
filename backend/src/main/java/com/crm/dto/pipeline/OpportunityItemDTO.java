package com.crm.dto.pipeline;

import java.math.BigDecimal;

public class OpportunityItemDTO {
    private Long id;
    private Long opportunityId;
    private Long productId;
    private String productCode;
    private String productName;
    private String productUnit;
    private String productType; // ONE_TIME, RECURRING
    private BigDecimal quantity;
    private BigDecimal unitPrice;
    private BigDecimal listPrice;
    private BigDecimal discountPercent;
    private String billingCycle; // ONE_TIME, MONTHLY, QUARTERLY, SEMI_ANNUAL, ANNUAL
    private Integer termCount; // Số kỳ thuê bao
    private BigDecimal annualAmount; // Giá trị hợp đồng theo năm (ACV)
    private BigDecimal totalAmount; // Tổng giá trị dòng hợp đồng (TCV)
    private String notes;

    public OpportunityItemDTO() {
    }

    public OpportunityItemDTO(Long productId, BigDecimal quantity, BigDecimal unitPrice) {
        this.productId = productId;
        this.quantity = quantity;
        this.unitPrice = unitPrice;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getOpportunityId() {
        return opportunityId;
    }

    public void setOpportunityId(Long opportunityId) {
        this.opportunityId = opportunityId;
    }

    public Long getProductId() {
        return productId;
    }

    public void setProductId(Long productId) {
        this.productId = productId;
    }

    public String getProductCode() {
        return productCode;
    }

    public void setProductCode(String productCode) {
        this.productCode = productCode;
    }

    public String getProductName() {
        return productName;
    }

    public void setProductName(String productName) {
        this.productName = productName;
    }

    public String getProductUnit() {
        return productUnit;
    }

    public void setProductUnit(String productUnit) {
        this.productUnit = productUnit;
    }

    public String getProductType() {
        return productType != null && !productType.isBlank() ? productType : "ONE_TIME";
    }

    public void setProductType(String productType) {
        this.productType = productType;
    }

    public BigDecimal getQuantity() {
        return quantity != null ? quantity : BigDecimal.ONE;
    }

    public void setQuantity(BigDecimal quantity) {
        this.quantity = quantity;
    }

    public BigDecimal getUnitPrice() {
        return unitPrice != null ? unitPrice : BigDecimal.ZERO;
    }

    public void setUnitPrice(BigDecimal unitPrice) {
        this.unitPrice = unitPrice;
    }

    public BigDecimal getListPrice() {
        return listPrice != null ? listPrice : BigDecimal.ZERO;
    }

    public void setListPrice(BigDecimal listPrice) {
        this.listPrice = listPrice;
    }

    public BigDecimal getDiscountPercent() {
        return discountPercent != null ? discountPercent : BigDecimal.ZERO;
    }

    public void setDiscountPercent(BigDecimal discountPercent) {
        this.discountPercent = discountPercent;
    }

    public String getBillingCycle() {
        return billingCycle != null && !billingCycle.isBlank() ? billingCycle : ("RECURRING".equalsIgnoreCase(productType) ? "MONTHLY" : "ONE_TIME");
    }

    public void setBillingCycle(String billingCycle) {
        this.billingCycle = billingCycle;
    }

    public Integer getTermCount() {
        if (termCount != null && termCount > 0) {
            return termCount;
        }
        return "RECURRING".equalsIgnoreCase(getProductType()) ? 12 : 1;
    }

    public void setTermCount(Integer termCount) {
        this.termCount = termCount;
    }

    public BigDecimal getAnnualAmount() {
        return annualAmount != null ? annualAmount : BigDecimal.ZERO;
    }

    public void setAnnualAmount(BigDecimal annualAmount) {
        this.annualAmount = annualAmount;
    }

    public BigDecimal getTotalAmount() {
        return totalAmount != null ? totalAmount : BigDecimal.ZERO;
    }

    public void setTotalAmount(BigDecimal totalAmount) {
        this.totalAmount = totalAmount;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }
}
