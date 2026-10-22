package com.crm.dto.support;

import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.time.LocalDateTime;
import java.util.Set;

/** Full replacement on PUT; customerId is immutable after creation. */
public record SupportRequestWrite(Long customerId, String subject, String description,
                                  String priority, String status, String dueAt, String resolution) {
    public static final Set<String> STATUSES = Set.of("OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED");
    public static final Set<String> PRIORITIES = Set.of("LOW", "NORMAL", "HIGH", "URGENT");

    public SupportRequestWrite validated() {
        if (customerId == null || customerId <= 0) throw new IllegalArgumentException("customerId phải là số nguyên dương");
        if (subject == null || subject.isBlank() || subject.trim().length() > 255)
            throw new IllegalArgumentException("Tiêu đề phải có từ 1 đến 255 ký tự");
        if (description != null && description.length() > 10000 || resolution != null && resolution.length() > 10000)
            throw new IllegalArgumentException("Mô tả và kết quả xử lý tối đa 10000 ký tự");
        String p = priority == null ? "NORMAL" : priority;
        String s = status == null ? "OPEN" : status;
        if (!PRIORITIES.contains(p) || !STATUSES.contains(s))
            throw new IllegalArgumentException("Mức ưu tiên hoặc trạng thái không hợp lệ");
        if (Set.of("RESOLVED", "CLOSED").contains(s) && (resolution == null || resolution.isBlank()))
            throw new IllegalArgumentException("Cần ghi kết quả xử lý khi hoàn tất yêu cầu");
        dueAtUtc();
        return new SupportRequestWrite(customerId, subject.trim(), description, p, s, dueAt, resolution);
    }

    public LocalDateTime dueAtUtc() {
        if (dueAt == null) return null;
        try {
            LocalDateTime utc = OffsetDateTime.parse(dueAt).withOffsetSameInstant(ZoneOffset.UTC).toLocalDateTime();
            if (utc.getYear() < 1000 || utc.getYear() > 9999) throw new IllegalArgumentException();
            return utc;
        } catch (RuntimeException e) {
            throw new IllegalArgumentException("dueAt phải là thời gian ISO-8601 có múi giờ, ví dụ 2026-10-13T10:00:00+07:00");
        }
    }
}
