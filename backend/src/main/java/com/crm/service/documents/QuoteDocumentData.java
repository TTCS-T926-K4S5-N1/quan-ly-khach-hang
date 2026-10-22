package com.crm.service.documents;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Set;

/** SCRUM-94: dữ liệu báo giá đã chuẩn hóa để dựng PDF (không phụ thuộc DB). */
public class QuoteDocumentData {

    /** Trạng thái báo giá được coi là "đã chốt" – không đóng dấu BẢN NHÁP, được phép tạo hợp đồng. */
    public static final Set<String> FINAL_STATUSES = Set.of("APPROVED", "ACCEPTED");

    public String quoteNumber;
    public String title;
    public String status;
    public LocalDate createdDate;
    public String customerName;
    public String customerTaxCode;
    public String customerAddress;
    public String customerPhone;
    public String customerEmail;
    public String ownerName;
    public String opportunityName;
    public BigDecimal subtotal = BigDecimal.ZERO;
    public BigDecimal discountPercent = BigDecimal.ZERO;
    public BigDecimal totalAmount = BigDecimal.ZERO;
    public final List<LineItem> items = new ArrayList<>();

    public boolean isFinalStatus() {
        return status != null && FINAL_STATUSES.contains(status.trim().toUpperCase(Locale.ROOT));
    }

    /** Số tiền chiết khấu tổng = subtotal - totalAmount (không âm). */
    public BigDecimal discountAmount() {
        BigDecimal sub = subtotal == null ? BigDecimal.ZERO : subtotal;
        BigDecimal total = totalAmount == null ? BigDecimal.ZERO : totalAmount;
        BigDecimal diff = sub.subtract(total);
        return diff.signum() < 0 ? BigDecimal.ZERO : diff;
    }

    public static class LineItem {
        public String productCode;
        public String productName;
        public String unit;
        public int quantity;
        public BigDecimal unitPrice = BigDecimal.ZERO;
        public BigDecimal discountPercent = BigDecimal.ZERO;
        public BigDecimal amount = BigDecimal.ZERO;

        public LineItem() {
        }

        public LineItem(String productCode, String productName, String unit, int quantity,
                        BigDecimal unitPrice, BigDecimal discountPercent, BigDecimal amount) {
            this.productCode = productCode;
            this.productName = productName;
            this.unit = unit;
            this.quantity = quantity;
            this.unitPrice = unitPrice;
            this.discountPercent = discountPercent;
            this.amount = amount;
        }
    }
}
