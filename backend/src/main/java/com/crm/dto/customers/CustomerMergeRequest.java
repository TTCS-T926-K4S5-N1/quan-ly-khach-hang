package com.crm.dto.customers;

import java.util.LinkedHashMap;
import java.util.Map;

public class CustomerMergeRequest {

    private Long masterId;
    private Long duplicateId;
    private String targetName;
    private String targetTaxCode;
    private String targetPhone;
    private String targetEmail;
    private String targetWebsite;
    private String targetAddress;
    private Long targetOwnerUserId;

    public Long getMasterId() {
        return masterId;
    }

    public void setMasterId(Long masterId) {
        this.masterId = masterId;
    }

    public Long getDuplicateId() {
        return duplicateId;
    }

    public void setDuplicateId(Long duplicateId) {
        this.duplicateId = duplicateId;
    }

    public String getTargetName() {
        return targetName;
    }

    public void setTargetName(String targetName) {
        this.targetName = targetName;
    }

    public String getTargetTaxCode() {
        return targetTaxCode;
    }

    public void setTargetTaxCode(String targetTaxCode) {
        this.targetTaxCode = targetTaxCode;
    }

    public String getTargetPhone() {
        return targetPhone;
    }

    public void setTargetPhone(String targetPhone) {
        this.targetPhone = targetPhone;
    }

    public String getTargetEmail() {
        return targetEmail;
    }

    public void setTargetEmail(String targetEmail) {
        this.targetEmail = targetEmail;
    }

    public String getTargetWebsite() {
        return targetWebsite;
    }

    public void setTargetWebsite(String targetWebsite) {
        this.targetWebsite = targetWebsite;
    }

    public String getTargetAddress() {
        return targetAddress;
    }

    public void setTargetAddress(String targetAddress) {
        this.targetAddress = targetAddress;
    }

    public Long getTargetOwnerUserId() {
        return targetOwnerUserId;
    }

    public void setTargetOwnerUserId(Long targetOwnerUserId) {
        this.targetOwnerUserId = targetOwnerUserId;
    }

    public Map<String, Object> toFieldOverrides() {
        Map<String, Object> map = new LinkedHashMap<>();
        if (targetName != null && !targetName.isBlank()) map.put("name", targetName);
        if (targetTaxCode != null) map.put("taxCode", targetTaxCode);
        if (targetPhone != null) map.put("phone", targetPhone);
        if (targetEmail != null) map.put("email", targetEmail);
        if (targetWebsite != null) map.put("website", targetWebsite);
        if (targetAddress != null) map.put("address", targetAddress);
        if (targetOwnerUserId != null) map.put("ownerUserId", targetOwnerUserId);
        return map;
    }
}
