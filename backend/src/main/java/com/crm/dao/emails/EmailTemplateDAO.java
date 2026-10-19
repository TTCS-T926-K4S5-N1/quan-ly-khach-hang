package com.crm.dao.emails;

import com.crm.config.DatabaseConfig;
import com.crm.dto.emails.EmailTemplateDTO;

import java.sql.*;
import java.util.ArrayList;
import java.util.List;

public class EmailTemplateDAO {

    public List<EmailTemplateDTO> findAll(Boolean activeOnly) throws SQLException {
        List<EmailTemplateDTO> list = new ArrayList<>();
        String sql = """
            SELECT t.id, t.name, t.subject, t.body_html, t.category, t.is_active,
                   t.created_by, t.created_at, u.full_name AS created_by_name
            FROM email_templates t
            LEFT JOIN users u ON u.id = t.created_by
            WHERE (? IS NULL OR t.is_active = ?)
            ORDER BY t.id ASC
        """;

        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            if (activeOnly == null) {
                stmt.setNull(1, Types.BOOLEAN);
                stmt.setNull(2, Types.BOOLEAN);
            } else {
                stmt.setBoolean(1, activeOnly);
                stmt.setBoolean(2, activeOnly);
            }
            try (ResultSet rs = stmt.executeQuery()) {
                while (rs.next()) {
                    list.add(mapRow(rs));
                }
            }
        }
        return list;
    }

    public EmailTemplateDTO findById(long id) throws SQLException {
        String sql = """
            SELECT t.id, t.name, t.subject, t.body_html, t.category, t.is_active,
                   t.created_by, t.created_at, u.full_name AS created_by_name
            FROM email_templates t
            LEFT JOIN users u ON u.id = t.created_by
            WHERE t.id = ?
        """;

        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setLong(1, id);
            try (ResultSet rs = stmt.executeQuery()) {
                if (rs.next()) {
                    return mapRow(rs);
                }
            }
        }
        return null;
    }

    public long create(EmailTemplateDTO dto) throws SQLException {
        String sql = """
            INSERT INTO email_templates (name, subject, body_html, category, is_active, created_by)
            VALUES (?, ?, ?, ?, ?, ?)
        """;

        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS)) {
            stmt.setString(1, dto.getName());
            stmt.setString(2, dto.getSubject());
            stmt.setString(3, dto.getBodyHtml());
            stmt.setString(4, dto.getCategory() != null ? dto.getCategory() : "MARKETING");
            stmt.setBoolean(5, dto.isActive());
            if (dto.getCreatedBy() != null) {
                stmt.setLong(6, dto.getCreatedBy());
            } else {
                stmt.setNull(6, Types.BIGINT);
            }

            stmt.executeUpdate();
            try (ResultSet keys = stmt.getGeneratedKeys()) {
                if (keys.next()) {
                    long id = keys.getLong(1);
                    dto.setId(id);
                    return id;
                }
            }
        }
        return 0;
    }

    public boolean update(EmailTemplateDTO dto) throws SQLException {
        String sql = """
            UPDATE email_templates
            SET name = ?, subject = ?, body_html = ?, category = ?, is_active = ?, updated_at = NOW()
            WHERE id = ?
        """;

        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setString(1, dto.getName());
            stmt.setString(2, dto.getSubject());
            stmt.setString(3, dto.getBodyHtml());
            stmt.setString(4, dto.getCategory());
            stmt.setBoolean(5, dto.isActive());
            stmt.setLong(6, dto.getId());
            return stmt.executeUpdate() > 0;
        }
    }

    public boolean delete(long id) throws SQLException {
        String sql = "DELETE FROM email_templates WHERE id = ?";
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setLong(1, id);
            return stmt.executeUpdate() > 0;
        }
    }

    private EmailTemplateDTO mapRow(ResultSet rs) throws SQLException {
        EmailTemplateDTO dto = new EmailTemplateDTO();
        dto.setId(rs.getLong("id"));
        dto.setName(rs.getString("name"));
        dto.setSubject(rs.getString("subject"));
        dto.setBodyHtml(rs.getString("body_html"));
        dto.setCategory(rs.getString("category"));
        dto.setActive(rs.getBoolean("is_active"));
        dto.setCreatedBy(rs.getObject("created_by") != null ? rs.getLong("created_by") : null);
        dto.setCreatedByName(rs.getString("created_by_name"));
        dto.setCreatedAt(rs.getTimestamp("created_at"));
        return dto;
    }
}
