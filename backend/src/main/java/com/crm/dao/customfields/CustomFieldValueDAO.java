package com.crm.dao.customfields;

import com.crm.config.DatabaseConfig;
import com.google.gson.Gson;
import com.google.gson.reflect.TypeToken;

import java.lang.reflect.Type;
import java.sql.*;
import java.util.*;

public class CustomFieldValueDAO {

    private static final Gson GSON = com.crm.util.JsonUtil.getGson();
    private static final Type STRING_LIST_TYPE = new TypeToken<List<String>>() {}.getType();

    /**
     * Lấy danh sách các trường tùy chỉnh đang hoạt động theo loại thực thể (CUSTOMER, OPPORTUNITY).
     */
    public List<Map<String, Object>> getActiveFields(String entityType) throws SQLException {
        List<Map<String, Object>> fields = new ArrayList<>();
        String sql = """
                SELECT id, entity_type, field_key, label, field_type, options_json, required_field, active
                FROM custom_fields
                WHERE entity_type = ? AND active = TRUE
                ORDER BY id ASC
                """;

        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setString(1, entityType.toUpperCase());
            try (ResultSet rs = stmt.executeQuery()) {
                while (rs.next()) {
                    Map<String, Object> field = new LinkedHashMap<>();
                    field.put("id", rs.getLong("id"));
                    field.put("entityType", rs.getString("entity_type"));
                    field.put("key", rs.getString("field_key"));
                    field.put("label", rs.getString("label"));
                    field.put("fieldType", rs.getString("field_type"));
                    field.put("required", rs.getBoolean("required_field"));
                    field.put("active", rs.getBoolean("active"));

                    String optionsJson = rs.getString("options_json");
                    List<String> options = Collections.emptyList();
                    if (optionsJson != null && !optionsJson.isBlank()) {
                        try {
                            options = GSON.fromJson(optionsJson, STRING_LIST_TYPE);
                        } catch (Exception ignored) {
                            options = Collections.emptyList();
                        }
                    }
                    field.put("options", options);
                    fields.add(field);
                }
            }
        }
        return fields;
    }

    /**
     * Lấy giá trị các trường tùy chỉnh của một bản ghi.
     */
    public Map<String, Object> getValues(String entityType, long recordId) throws SQLException {
        Map<String, Object> values = new LinkedHashMap<>();
        String sql = """
                SELECT cf.field_key, cf.field_type, cfv.field_value
                FROM custom_field_values cfv
                JOIN custom_fields cf ON cf.id = cfv.custom_field_id
                WHERE cf.entity_type = ? AND cfv.record_id = ? AND cf.active = TRUE
                """;

        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setString(1, entityType.toUpperCase());
            stmt.setLong(2, recordId);
            try (ResultSet rs = stmt.executeQuery()) {
                while (rs.next()) {
                    values.put(rs.getString("field_key"), rs.getString("field_value"));
                }
            }
        }
        return values;
    }

    /**
     * Lấy giá trị các trường tùy chỉnh cho hàng loạt bản ghi (batch load cho danh sách và export).
     */
    public Map<Long, Map<String, Object>> getValuesForRecords(String entityType, Collection<Long> recordIds) throws SQLException {
        Map<Long, Map<String, Object>> result = new LinkedHashMap<>();
        if (recordIds == null || recordIds.isEmpty()) return result;

        List<Long> idList = new ArrayList<>(recordIds);
        StringBuilder sql = new StringBuilder("""
                SELECT cfv.record_id, cf.field_key, cf.field_type, cfv.field_value
                FROM custom_field_values cfv
                JOIN custom_fields cf ON cf.id = cfv.custom_field_id
                WHERE cf.entity_type = ? AND cf.active = TRUE AND cfv.record_id IN (
                """);

        for (int i = 0; i < idList.size(); i++) {
            if (i > 0) sql.append(", ");
            sql.append("?");
        }
        sql.append(")");

        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql.toString())) {
            stmt.setString(1, entityType.toUpperCase());
            for (int i = 0; i < idList.size(); i++) {
                stmt.setLong(i + 2, idList.get(i));
            }
            try (ResultSet rs = stmt.executeQuery()) {
                while (rs.next()) {
                    long recId = rs.getLong("record_id");
                    String key = rs.getString("field_key");
                    String val = rs.getString("field_value");
                    result.computeIfAbsent(recId, k -> new LinkedHashMap<>()).put(key, val);
                }
            }
        }
        return result;
    }

    /**
     * Xác thực các trường tùy chỉnh bắt buộc (required_field = true).
     * Ném ngoại lệ IllegalArgumentException nếu trường bắt buộc bị thiếu hoặc để trống.
     */
    public void validateRequiredFields(String entityType, Map<String, Object> values) throws SQLException {
        List<Map<String, Object>> activeFields = getActiveFields(entityType);
        for (Map<String, Object> field : activeFields) {
            Boolean isRequired = (Boolean) field.get("required");
            if (Boolean.TRUE.equals(isRequired)) {
                String key = (String) field.get("key");
                String label = (String) field.get("label");
                Object val = values != null ? values.get(key) : null;
                if (val == null || String.valueOf(val).trim().isEmpty()) {
                    throw new IllegalArgumentException("Trường tùy chỉnh '" + label + "' là bắt buộc nhập.");
                }
            }
        }
    }

    /**
     * Lưu (upsert) giá trị các trường tùy chỉnh cho một bản ghi.
     */
    public void saveValues(String entityType, long recordId, Map<String, Object> values) throws SQLException {
        if (values == null || values.isEmpty()) return;

        try (Connection conn = DatabaseConfig.getConnection()) {
            conn.setAutoCommit(false);
            try {
                // Find all active custom fields for entity
                Map<String, Long> fieldIds = new HashMap<>();
                try (PreparedStatement stmt = conn.prepareStatement(
                        "SELECT id, field_key FROM custom_fields WHERE entity_type = ? AND active = TRUE")) {
                    stmt.setString(1, entityType.toUpperCase());
                    try (ResultSet rs = stmt.executeQuery()) {
                        while (rs.next()) {
                            fieldIds.put(rs.getString("field_key"), rs.getLong("id"));
                        }
                    }
                }

                String upsertSql = """
                        INSERT INTO custom_field_values (custom_field_id, record_id, field_value)
                        VALUES (?, ?, ?)
                        ON DUPLICATE KEY UPDATE field_value = VALUES(field_value)
                        """;
                try (PreparedStatement stmt = conn.prepareStatement(upsertSql)) {
                    for (Map.Entry<String, Object> entry : values.entrySet()) {
                        Long fieldId = fieldIds.get(entry.getKey());
                        if (fieldId != null && entry.getValue() != null) {
                            stmt.setLong(1, fieldId);
                            stmt.setLong(2, recordId);
                            stmt.setString(3, String.valueOf(entry.getValue()));
                            stmt.addBatch();
                        }
                    }
                    stmt.executeBatch();
                }
                conn.commit();
            } catch (SQLException e) {
                conn.rollback();
                throw e;
            } finally {
                conn.setAutoCommit(true);
            }
        }
    }
}
