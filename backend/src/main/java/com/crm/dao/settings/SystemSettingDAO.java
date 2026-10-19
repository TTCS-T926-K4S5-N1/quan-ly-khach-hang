package com.crm.dao.settings;

import com.crm.config.DatabaseConfig;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.LinkedHashMap;
import java.util.Map;

public class SystemSettingDAO {

    public String getSetting(String key, String defaultValue) {
        String sql = "SELECT setting_value FROM system_settings WHERE setting_key = ?";
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, key);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    String val = rs.getString("setting_value");
                    return val != null ? val : defaultValue;
                }
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return defaultValue;
    }

    public boolean isBooleanEnabled(String key, boolean defaultValue) {
        String val = getSetting(key, String.valueOf(defaultValue));
        return "true".equalsIgnoreCase(val) || "1".equals(val);
    }

    public void setSetting(String key, String value, String description) throws SQLException {
        String sql = """
                INSERT INTO system_settings (setting_key, setting_value, description)
                VALUES (?, ?, ?)
                ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value), updated_at = NOW()
                """;
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, key);
            ps.setString(2, value);
            ps.setString(3, description);
            ps.executeUpdate();
        }
    }

    public Map<String, String> getAllSettings() throws SQLException {
        Map<String, String> map = new LinkedHashMap<>();
        String sql = "SELECT setting_key, setting_value FROM system_settings";
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql);
             ResultSet rs = ps.executeQuery()) {
            while (rs.next()) {
                map.put(rs.getString("setting_key"), rs.getString("setting_value"));
            }
        }
        return map;
    }
}
