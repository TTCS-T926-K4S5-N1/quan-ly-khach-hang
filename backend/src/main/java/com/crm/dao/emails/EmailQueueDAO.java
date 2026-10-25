package com.crm.dao.emails;

import com.crm.config.DatabaseConfig;
import com.crm.dto.emails.EmailQueueDTO;

import java.sql.*;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.*;

public class EmailQueueDAO {

    public long enqueue(EmailQueueDTO dto) throws SQLException {
        String sql = """
            INSERT INTO email_queue (
                template_id, customer_id, contact_id, recipient_email, recipient_name,
                subject, body_html, status, attempts, error_message, sent_by_user_id,
                scheduled_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
        """;

        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS)) {
            if (dto.getTemplateId() != null) stmt.setLong(1, dto.getTemplateId()); else stmt.setNull(1, Types.BIGINT);
            if (dto.getCustomerId() != null) stmt.setLong(2, dto.getCustomerId()); else stmt.setNull(2, Types.BIGINT);
            if (dto.getContactId() != null) stmt.setLong(3, dto.getContactId()); else stmt.setNull(3, Types.BIGINT);
            stmt.setString(4, dto.getRecipientEmail());
            stmt.setString(5, dto.getRecipientName());
            stmt.setString(6, dto.getSubject());
            stmt.setString(7, dto.getBodyHtml());
            stmt.setString(8, dto.getStatus() != null ? dto.getStatus() : "QUEUED");
            stmt.setInt(9, dto.getAttempts());
            stmt.setString(10, dto.getErrorMessage());
            stmt.setLong(11, dto.getSentByUserId());

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

    public List<EmailQueueDTO> findQueue(String status, Long customerId, int limit, int offset) throws SQLException {
        List<EmailQueueDTO> list = new ArrayList<>();
        StringBuilder sql = new StringBuilder("""
            SELECT q.id, q.template_id, q.customer_id, q.contact_id,
                   q.recipient_email, q.recipient_name, q.subject, q.body_html,
                   q.status, q.attempts, q.error_message, q.sent_by_user_id,
                   q.scheduled_at, q.sent_at, q.created_at,
                   t.name AS template_name,
                   c.name AS customer_name,
                   ct.name AS contact_name,
                   u.full_name AS sent_by_name
            FROM email_queue q
            LEFT JOIN email_templates t ON t.id = q.template_id
            LEFT JOIN customers c ON c.id = q.customer_id
            LEFT JOIN contacts ct ON ct.id = q.contact_id
            LEFT JOIN users u ON u.id = q.sent_by_user_id
            WHERE 1=1
        """);

        List<Object> params = new ArrayList<>();
        if (status != null && !status.isBlank() && !"ALL".equalsIgnoreCase(status)) {
            sql.append(" AND q.status = ?");
            params.add(status.toUpperCase());
        }
        if (customerId != null && customerId > 0) {
            sql.append(" AND q.customer_id = ?");
            params.add(customerId);
        }

        sql.append(" ORDER BY q.id DESC LIMIT ? OFFSET ?");
        params.add(limit > 0 ? limit : 20);
        params.add(Math.max(offset, 0));

        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql.toString())) {
            for (int i = 0; i < params.size(); i++) {
                stmt.setObject(i + 1, params.get(i));
            }
            try (ResultSet rs = stmt.executeQuery()) {
                while (rs.next()) {
                    list.add(mapRow(rs));
                }
            }
        }
        return list;
    }

    public int countQueue(String status, Long customerId) throws SQLException {
        StringBuilder sql = new StringBuilder("SELECT COUNT(*) FROM email_queue WHERE 1=1");
        List<Object> params = new ArrayList<>();
        if (status != null && !status.isBlank() && !"ALL".equalsIgnoreCase(status)) {
            sql.append(" AND status = ?");
            params.add(status.toUpperCase());
        }
        if (customerId != null && customerId > 0) {
            sql.append(" AND customer_id = ?");
            params.add(customerId);
        }

        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql.toString())) {
            for (int i = 0; i < params.size(); i++) {
                stmt.setObject(i + 1, params.get(i));
            }
            try (ResultSet rs = stmt.executeQuery()) {
                if (rs.next()) {
                    return rs.getInt(1);
                }
            }
        }
        return 0;
    }

    public EmailQueueDTO findById(long id) throws SQLException {
        String sql = """
            SELECT q.id, q.template_id, q.customer_id, q.contact_id,
                   q.recipient_email, q.recipient_name, q.subject, q.body_html,
                   q.status, q.attempts, q.error_message, q.sent_by_user_id,
                   q.scheduled_at, q.sent_at, q.created_at,
                   t.name AS template_name,
                   c.name AS customer_name,
                   ct.name AS contact_name,
                   u.full_name AS sent_by_name
            FROM email_queue q
            LEFT JOIN email_templates t ON t.id = q.template_id
            LEFT JOIN customers c ON c.id = q.customer_id
            LEFT JOIN contacts ct ON ct.id = q.contact_id
            LEFT JOIN users u ON u.id = q.sent_by_user_id
            WHERE q.id = ?
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

    public void markSent(long id) throws SQLException {
        String sql = "UPDATE email_queue SET status = 'SENT', sent_at = NOW(), error_message = NULL, updated_at = NOW() WHERE id = ?";
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setLong(1, id);
            stmt.executeUpdate();
        }
    }

    public void markFailed(long id, String errorMessage) throws SQLException {
        String sql = "UPDATE email_queue SET status = 'FAILED', error_message = ?, updated_at = NOW() WHERE id = ?";
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setString(1, errorMessage);
            stmt.setLong(2, id);
            stmt.executeUpdate();
        }
    }

    public boolean resetForRetry(long id) throws SQLException {
        String sql = "UPDATE email_queue SET status = 'QUEUED', attempts = attempts + 1, error_message = NULL, updated_at = NOW() WHERE id = ?";
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setLong(1, id);
            return stmt.executeUpdate() > 0;
        }
    }

    public Map<String, Object> getStats() throws SQLException {
        String sql = """
            SELECT 
                COUNT(*) AS total,
                SUM(CASE WHEN status = 'SENT' THEN 1 ELSE 0 END) AS sent,
                SUM(CASE WHEN status = 'FAILED' THEN 1 ELSE 0 END) AS failed,
                SUM(CASE WHEN status = 'QUEUED' OR status = 'SENDING' THEN 1 ELSE 0 END) AS queued
            FROM email_queue
        """;

        Map<String, Object> stats = new HashMap<>();
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql);
             ResultSet rs = stmt.executeQuery()) {
            if (rs.next()) {
                stats.put("total", rs.getInt("total"));
                stats.put("sent", rs.getInt("sent"));
                stats.put("failed", rs.getInt("failed"));
                stats.put("queued", rs.getInt("queued"));
            }
        }
        return stats;
    }

    private EmailQueueDTO mapRow(ResultSet rs) throws SQLException {
        EmailQueueDTO dto = new EmailQueueDTO();
        dto.setId(rs.getLong("id"));
        dto.setTemplateId(rs.getObject("template_id") != null ? rs.getLong("template_id") : null);
        dto.setTemplateName(rs.getString("template_name"));
        dto.setCustomerId(rs.getObject("customer_id") != null ? rs.getLong("customer_id") : null);
        dto.setCustomerName(rs.getString("customer_name"));
        dto.setContactId(rs.getObject("contact_id") != null ? rs.getLong("contact_id") : null);
        dto.setContactName(rs.getString("contact_name"));
        dto.setRecipientEmail(rs.getString("recipient_email"));
        dto.setRecipientName(rs.getString("recipient_name"));
        dto.setSubject(rs.getString("subject"));
        dto.setBodyHtml(rs.getString("body_html"));
        dto.setStatus(rs.getString("status"));
        dto.setAttempts(rs.getInt("attempts"));
        dto.setErrorMessage(rs.getString("error_message"));
        dto.setSentByUserId(rs.getLong("sent_by_user_id"));
        dto.setSentByName(rs.getString("sent_by_name"));
        dto.setScheduledAt(rs.getTimestamp("scheduled_at"));
        dto.setSentAt(rs.getTimestamp("sent_at"));
        dto.setCreatedAt(rs.getTimestamp("created_at"));
        dto.setTimeAgo(formatTimeAgo(dto.getCreatedAt()));
        return dto;
    }

    private String formatTimeAgo(Timestamp timestamp) {
        if (timestamp == null) return "";
        LocalDateTime then = timestamp.toLocalDateTime();
        LocalDateTime now = LocalDateTime.now();
        Duration d = Duration.between(then, now);
        long minutes = d.toMinutes();
        if (minutes < 1) return "Vừa xong";
        if (minutes < 60) return minutes + " phút trước";
        long hours = d.toHours();
        if (hours < 24) return hours + " giờ trước";
        long days = d.toDays();
        if (days < 30) return days + " ngày trước";
        return timestamp.toString().substring(0, 10);
    }
}
