package com.crm.dto.pipeline;

import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.regex.Pattern;

/**
 * SCRUM-108: Bộ lọc dùng khi xuất danh sách cơ hội ra Excel.
 * Mirror các bộ lọc đang áp dụng trên màn hình Pipeline, kèm bộ lọc trường tuỳ chỉnh (cf_&lt;field_key&gt;).
 */
public final class OpportunityExportFilter {

    public static final String CUSTOM_FIELD_PREFIX = "cf_";
    private static final Pattern FIELD_KEY = Pattern.compile("[A-Za-z0-9_\\-]{1,100}");
    private static final java.util.Set<String> STATUSES = java.util.Set.of("OPEN", "WON", "LOST");

    private final String keyword;
    private final boolean onlyMine;
    private final Long stageId;
    private final String status;
    private final Map<String, String> customFieldFilters;

    public OpportunityExportFilter(
            String keyword,
            boolean onlyMine,
            Long stageId,
            String status,
            Map<String, String> customFieldFilters
    ) {
        this.keyword = blankToNull(keyword);
        this.onlyMine = onlyMine;
        this.stageId = stageId;
        String normalizedStatus = blankToNull(status);
        if (normalizedStatus != null) {
            normalizedStatus = normalizedStatus.toUpperCase();
            if (!STATUSES.contains(normalizedStatus)) {
                throw new IllegalArgumentException("Trạng thái lọc không hợp lệ: " + status);
            }
        }
        this.status = normalizedStatus;
        Map<String, String> cf = new LinkedHashMap<>();
        if (customFieldFilters != null) {
            customFieldFilters.forEach((key, value) -> {
                String v = blankToNull(value);
                if (key != null && v != null) {
                    if (!FIELD_KEY.matcher(key).matches()) {
                        throw new IllegalArgumentException("Mã trường tuỳ chỉnh không hợp lệ: " + key);
                    }
                    cf.put(key, v);
                }
            });
        }
        this.customFieldFilters = Collections.unmodifiableMap(cf);
    }

    /** Parse từ query string của servlet (request.getParameterMap()). */
    public static OpportunityExportFilter fromParameters(Map<String, String[]> params) {
        Map<String, String> cf = new LinkedHashMap<>();
        for (Map.Entry<String, String[]> entry : params.entrySet()) {
            String name = entry.getKey();
            if (name != null && name.startsWith(CUSTOM_FIELD_PREFIX) && name.length() > CUSTOM_FIELD_PREFIX.length()) {
                cf.put(name.substring(CUSTOM_FIELD_PREFIX.length()), first(entry.getValue()));
            }
        }

        String owner = blankToNull(first(params.get("owner")));
        boolean onlyMine = owner != null && (owner.equalsIgnoreCase("me") || owner.equals("Tôi"));

        Long stageId = null;
        String stageRaw = blankToNull(first(params.get("stageId")));
        if (stageRaw != null) {
            try {
                stageId = Long.parseLong(stageRaw);
            } catch (NumberFormatException e) {
                throw new IllegalArgumentException("stageId không hợp lệ");
            }
        }

        return new OpportunityExportFilter(
                first(params.get("keyword")),
                onlyMine,
                stageId,
                first(params.get("status")),
                cf
        );
    }

    /** Mô tả bộ lọc (tiếng Việt) để ghi vào sheet "Thông tin xuất". */
    public Map<String, String> describe() {
        Map<String, String> d = new LinkedHashMap<>();
        d.put("Từ khoá", keyword == null ? "(không)" : keyword);
        d.put("Người sở hữu", onlyMine ? "Chỉ của tôi" : "Tất cả trong phạm vi được phép");
        d.put("Giai đoạn", stageId == null ? "Tất cả" : String.valueOf(stageId));
        d.put("Trạng thái", status == null ? "Tất cả" : status);
        if (customFieldFilters.isEmpty()) {
            d.put("Trường tuỳ chỉnh", "(không)");
        } else {
            customFieldFilters.forEach((k, v) -> d.put("Trường tuỳ chỉnh: " + k, v));
        }
        return d;
    }

    public String getKeyword() { return keyword; }
    public boolean isOnlyMine() { return onlyMine; }
    public Long getStageId() { return stageId; }
    public String getStatus() { return status; }
    public Map<String, String> getCustomFieldFilters() { return customFieldFilters; }

    private static String first(String[] values) {
        return values == null || values.length == 0 ? null : values[0];
    }

    private static String blankToNull(String value) {
        if (value == null) return null;
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
