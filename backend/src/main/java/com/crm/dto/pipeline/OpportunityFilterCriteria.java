package com.crm.dto.pipeline;

import java.math.BigDecimal;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.temporal.TemporalAdjusters;

/**
 * DTO chứa các tiêu chí tìm kiếm và lọc đa điều kiện cho Cơ hội bán hàng (SCRUM-81).
 * Hỗ trợ lọc theo: giai đoạn, khoảng giá trị, khoảng ngày chốt, sản phẩm, người sở hữu,
 * và các phím tắt thời gian nhanh (tuần này, tháng này).
 */
public class OpportunityFilterCriteria {

    private String keyword;
    private Long stageId;
    private String status;
    private BigDecimal minAmount;
    private BigDecimal maxAmount;
    private String closeDateFrom;
    private String closeDateTo;
    private Long productId;
    private Long ownerId;
    private String ownerFilter; // "MINE", "ALL", hoặc null
    private String quickDate;   // "THIS_WEEK", "THIS_MONTH", "NEXT_WEEK"
    private int page = 1;
    private int size = 100;

    public OpportunityFilterCriteria() {
    }

    /**
     * Tự động giải quyết khoảng ngày chốt dựa trên phím tắt quickDate nếu chưa nhập ngày cụ thể.
     */
    public void resolveDateRange() {
        if (quickDate == null || quickDate.isBlank()) {
            return;
        }

        LocalDate now = LocalDate.now();
        switch (quickDate.trim().toUpperCase()) {
            case "THIS_WEEK":
                if (closeDateFrom == null || closeDateFrom.isBlank()) {
                    closeDateFrom = now.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY)).toString();
                }
                if (closeDateTo == null || closeDateTo.isBlank()) {
                    closeDateTo = now.with(TemporalAdjusters.nextOrSame(DayOfWeek.SUNDAY)).toString();
                }
                break;
            case "THIS_MONTH":
                if (closeDateFrom == null || closeDateFrom.isBlank()) {
                    closeDateFrom = now.with(TemporalAdjusters.firstDayOfMonth()).toString();
                }
                if (closeDateTo == null || closeDateTo.isBlank()) {
                    closeDateTo = now.with(TemporalAdjusters.lastDayOfMonth()).toString();
                }
                break;
            case "NEXT_WEEK":
                LocalDate nextMon = now.plusWeeks(1).with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
                if (closeDateFrom == null || closeDateFrom.isBlank()) {
                    closeDateFrom = nextMon.toString();
                }
                if (closeDateTo == null || closeDateTo.isBlank()) {
                    closeDateTo = nextMon.with(TemporalAdjusters.nextOrSame(DayOfWeek.SUNDAY)).toString();
                }
                break;
            default:
                break;
        }
    }

    public String getKeyword() {
        return keyword;
    }

    public void setKeyword(String keyword) {
        this.keyword = keyword;
    }

    public Long getStageId() {
        return stageId;
    }

    public void setStageId(Long stageId) {
        this.stageId = stageId;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public BigDecimal getMinAmount() {
        return minAmount;
    }

    public void setMinAmount(BigDecimal minAmount) {
        this.minAmount = minAmount;
    }

    public BigDecimal getMaxAmount() {
        return maxAmount;
    }

    public void setMaxAmount(BigDecimal maxAmount) {
        this.maxAmount = maxAmount;
    }

    public String getCloseDateFrom() {
        return closeDateFrom;
    }

    public void setCloseDateFrom(String closeDateFrom) {
        this.closeDateFrom = closeDateFrom;
    }

    public String getCloseDateTo() {
        return closeDateTo;
    }

    public void setCloseDateTo(String closeDateTo) {
        this.closeDateTo = closeDateTo;
    }

    public Long getProductId() {
        return productId;
    }

    public void setProductId(Long productId) {
        this.productId = productId;
    }

    public Long getOwnerId() {
        return ownerId;
    }

    public void setOwnerId(Long ownerId) {
        this.ownerId = ownerId;
    }

    public String getOwnerFilter() {
        return ownerFilter;
    }

    public void setOwnerFilter(String ownerFilter) {
        this.ownerFilter = ownerFilter;
    }

    public String getQuickDate() {
        return quickDate;
    }

    public void setQuickDate(String quickDate) {
        this.quickDate = quickDate;
    }

    public int getPage() {
        return page;
    }

    public void setPage(int page) {
        this.page = page <= 0 ? 1 : page;
    }

    public int getSize() {
        return size;
    }

    public void setSize(int size) {
        this.size = size <= 0 ? 100 : size;
    }
}
