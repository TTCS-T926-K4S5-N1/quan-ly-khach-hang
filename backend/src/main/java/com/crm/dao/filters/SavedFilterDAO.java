package com.crm.dao.filters;

import com.crm.config.DatabaseConfig;

import java.sql.*;
import java.util.*;

public class SavedFilterDAO {

    public List<Map<String, Object>> findByUserIdAndModule(long userId, String module) throws SQLException {
        String sql = """
                SELECT id, user_id, module, name, filter_criteria, is_preset, created_at
                FROM saved_filters
                WHERE (user_id = ? OR is_preset = 1) AND module = ?
                ORDER BY is_preset DESC, id DESC
                """;

        List<Map<String, Object>> list = new ArrayList<>();
        Set<String> seenNames = new HashSet<>();

        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setLong(1, userId);
            stmt.setString(2, module != null && !module.isBlank() ? module : "CUSTOMER");

            try (ResultSet rs = stmt.executeQuery()) {
                while (rs.next()) {
                    String name = rs.getString("name");
                    // Tránh trùng lặp tên filter giữa preset và user-specific
                    if (!seenNames.add(name)) {
                        continue;
                    }
                    Map<String, Object> map = new LinkedHashMap<>();
                    map.put("id", rs.getLong("id"));
                    map.put("userId", rs.getLong("user_id"));
                    map.put("module", rs.getString("module"));
                    map.put("name", name);
                    map.put("filterCriteria", rs.getString("filter_criteria"));
                    map.put("isPreset", rs.getInt("is_preset") == 1);
                    map.put("createdAt", rs.getTimestamp("created_at"));
                    map.put("canDelete", rs.getLong("user_id") == userId);
                    list.add(map);
                }
            }
        }
        return list;
    }

    public Map<String, Object> create(long userId, String module, String name, String filterCriteriaJson) throws SQLException {
        String sql = """
                INSERT INTO saved_filters (user_id, module, name, filter_criteria, is_preset)
                VALUES (?, ?, ?, ?, 0)
                """;

        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS)) {
            stmt.setLong(1, userId);
            stmt.setString(2, module != null && !module.isBlank() ? module : "CUSTOMER");
            stmt.setString(3, name);
            stmt.setString(4, filterCriteriaJson != null ? filterCriteriaJson : "{}");

            stmt.executeUpdate();
            try (ResultSet rs = stmt.getGeneratedKeys()) {
                if (rs.next()) {
                    long id = rs.getLong(1);
                    Map<String, Object> map = new LinkedHashMap<>();
                    map.put("id", id);
                    map.put("userId", userId);
                    map.put("module", module);
                    map.put("name", name);
                    map.put("filterCriteria", filterCriteriaJson);
                    map.put("isPreset", false);
                    map.put("canDelete", true);
                    return map;
                }
            }
        }
        throw new SQLException("Không thể tạo bộ lọc đã lưu");
    }

    public boolean delete(long userId, long filterId) throws SQLException {
        String sql = "DELETE FROM saved_filters WHERE id = ? AND (user_id = ? OR is_preset = 1)";
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setLong(1, filterId);
            stmt.setLong(2, userId);
            int rows = stmt.executeUpdate();
            return rows > 0;
        }
    }
}
