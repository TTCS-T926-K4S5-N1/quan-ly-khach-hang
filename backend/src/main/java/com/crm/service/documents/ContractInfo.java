package com.crm.service.documents;

import java.time.LocalDate;
import java.time.format.DateTimeParseException;
import java.util.Map;

/** SCRUM-94: thông tin hợp đồng nhập từ form "Tạo hợp đồng" (BR-4). */
public class ContractInfo {

    public String contractNumber;
    public LocalDate signedDate;
    public LocalDate effectiveDate;
    public LocalDate expiryDate;
    public String paymentTerms;

    /** Đọc và kiểm tra dữ liệu hợp đồng; ném IllegalArgumentException với thông báo tiếng Việt. */
    public static ContractInfo fromRequest(Map<String, Object> body) {
        if (body == null) {
            throw new IllegalArgumentException("Thiếu dữ liệu hợp đồng.");
        }
        ContractInfo info = new ContractInfo();
        info.contractNumber = text(body.get("contractNumber"));
        info.signedDate = date(body.get("signedDate"), "Ngày ký");
        info.effectiveDate = date(body.get("effectiveDate"), "Ngày hiệu lực");
        info.expiryDate = date(body.get("expiryDate"), "Ngày hết hạn");
        info.paymentTerms = text(body.get("paymentTerms"));
        info.validate();
        return info;
    }

    public void validate() {
        if (contractNumber == null || contractNumber.isBlank()) {
            throw new IllegalArgumentException("Vui lòng nhập số hợp đồng.");
        }
        if (contractNumber.length() > 100) {
            throw new IllegalArgumentException("Số hợp đồng tối đa 100 ký tự.");
        }
        if (signedDate == null) {
            throw new IllegalArgumentException("Vui lòng nhập ngày ký.");
        }
        if (effectiveDate == null) {
            throw new IllegalArgumentException("Vui lòng nhập ngày hiệu lực.");
        }
        if (effectiveDate.isBefore(signedDate)) {
            throw new IllegalArgumentException("Ngày hiệu lực không được trước ngày ký.");
        }
        if (expiryDate != null && expiryDate.isBefore(effectiveDate)) {
            throw new IllegalArgumentException("Ngày hết hạn không được trước ngày hiệu lực.");
        }
        if (paymentTerms != null && paymentTerms.length() > 4000) {
            throw new IllegalArgumentException("Điều khoản thanh toán tối đa 4000 ký tự.");
        }
    }

    private static String text(Object value) {
        if (value == null) {
            return null;
        }
        String s = String.valueOf(value).trim();
        return s.isEmpty() ? null : s;
    }

    private static LocalDate date(Object value, String label) {
        String s = text(value);
        if (s == null) {
            return null;
        }
        try {
            return LocalDate.parse(s.length() > 10 ? s.substring(0, 10) : s);
        } catch (DateTimeParseException e) {
            throw new IllegalArgumentException(label + " không hợp lệ (định dạng yyyy-MM-dd).");
        }
    }
}
