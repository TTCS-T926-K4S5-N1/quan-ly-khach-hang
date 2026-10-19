package com.crm.dto.pipeline;

import java.math.BigDecimal;

public class OpportunityItemDTO {
    private Long id;
    private Long opportunityId;
    private Long productId;
    private String productCode;
    private String productName;
    private String productType; // ONE_TIME, RECURRING, SUBSCRIPTION
    private int quantity = 1;
    private String unit;
    private BigDecimal unitPrice = BigDecimal.ZERO;
    private BigDecimal discountPercent = BigDecimal.ZERO;
    private String billingCycle = "MONTHLY"; // MONTHLY, QUARTERLY, YEARLY, ONE_TIME
    private int billingDuration = 1;         // Số kỳ thuê bao
    private BigDecimal annualContractValue = BigDecimal.ZERO; // ACV
    private BigDecimal amount = BigDecimal.ZERO;              // Thành tiền
    private String notes;

    public OpportunityItemDTO() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getOpportunityId() { return opportunityId; }
    public void setOpportunityId(Long opportunityId) { this.opportunityId = opportunityId; }

    public Long getProductId() { return productId; }
    public void setProductId(Long productId) { this.productId = productId; }

    public String getProductCode() { return productCode; }
    public void setProductCode(String productCode) { this.productCode = productCode; }

    public String getProductName() { return productName; }
    public void setProductName(String productName) { this.productName = productName; }

    public String getProductType() { return productType; }
    public void setProductType(String productType) { this.productType = productType; }

    public int getQuantity() { return quantity; }
    public void setQuantity(int quantity) { this.quantity = quantity; }

    public String getUnit() { return unit; }
    public void setUnit(String unit) { this.unit = unit; }

    public BigDecimal getUnitPrice() { return unitPrice; }
    public void setUnitPrice(BigDecimal unitPrice) { this.unitPrice = unitPrice; }

    public BigDecimal getDiscountPercent() { return discountPercent; }
    public void setDiscountPercent(BigDecimal discountPercent) { this.discountPercent = discountPercent; }

    public String getBillingCycle() { return billingCycle; }
    public void setBillingCycle(String billingCycle) { this.billingCycle = billingCycle; }

    public int getBillingDuration() { return billingDuration; }
    public void setBillingDuration(int billingDuration) { this.billingDuration = billingDuration; }

    public BigDecimal getAnnualContractValue() { return annualContractValue; }
    public void setAnnualContractValue(BigDecimal annualContractValue) { this.annualContractValue = annualContractValue; }

    public BigDecimal getAmount() { return amount; }
    public void setAmount(BigDecimal amount) { this.amount = amount; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
}
