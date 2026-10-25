package com.crm.dao.notifications;

import com.crm.config.DatabaseConfig;
import com.crm.dto.notifications.NotificationDTO;

import java.sql.*;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

public class NotificationDAO {

    public Long insert(NotificationDTO n) throws SQLException {
        String sql = """
                INSERT INTO notifications (user_id, type, title, content, link, entity_type, entity_id, is_read, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, 0, NOW())
                """;
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS)) {
            ps.setLong(1, n.getUserId());
            ps.setString(2, n.getType());
            ps.setString(3, n.getTitle());
            ps.setString(4, n.getContent());
            ps.setString(5, n.getLink());
            ps.setString(6, n.getEntityType());
            if (n.getEntityId() != null) {
                ps.setLong(7, n.getEntityId());
            } else {
                ps.setNull(7, Types.BIGINT);
            }
            ps.executeUpdate();
            try (ResultSet rs = ps.getGeneratedKeys()) {
                if (rs.next()) {
                    long id = rs.getLong(1);
                    n.setId(id);
                    return id;
                }
            }
        }
        return null;
    }

    public List<NotificationDTO> findByUserId(long userId, int limit, Boolean unreadOnly) throws SQLException {
        List<NotificationDTO> list = new ArrayList<>();
        StringBuilder sql = new StringBuilder("""
                SELECT id, user_id, type, title, content, link, entity_type, entity_id, is_read, created_at
                FROM notifications
                WHERE user_id = ?
                """);
        if (Boolean.TRUE.equals(unreadOnly)) {
            sql.append(" AND is_read = 0");
        }
        sql.append(" ORDER BY created_at DESC LIMIT ?");

        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql.toString())) {
            ps.setLong(1, userId);
            ps.setInt(2, limit > 0 ? limit : 20);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    NotificationDTO n = new NotificationDTO();
                    n.setId(rs.getLong("id"));
                    n.setUserId(rs.getLong("user_id"));
                    n.setType(rs.getString("type"));
                    n.setTitle(rs.getString("title"));
                    n.setContent(rs.getString("content"));
                    n.setLink(rs.getString("link"));
                    n.setEntityType(rs.getString("entity_type"));
                    n.setEntityId((Long) rs.getObject("entity_id"));
                    n.setRead(rs.getBoolean("is_read"));
                    Timestamp cat = rs.getTimestamp("created_at");
                    n.setCreatedAt(cat);
                    n.setTimeAgo(formatTimeAgo(cat));
                    list.add(n);
                }
            }
        }
        return list;
    }

    public int countUnread(long userId) throws SQLException {
        String sql = "SELECT COUNT(*) FROM notifications WHERE user_id = ? AND is_read = 0";
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setLong(1, userId);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    return rs.getInt(1);
                }
            }
        }
        return 0;
    }

    public boolean markAsRead(long id, long userId) throws SQLException {
        String sql = "UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?";
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setLong(1, id);
            ps.setLong(2, userId);
            return ps.executeUpdate() > 0;
        }
    }

    public int markAllAsRead(long userId) throws SQLException {
        String sql = "UPDATE notifications SET is_read = 1 WHERE user_id = ? AND is_read = 0";
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setLong(1, userId);
            return ps.executeUpdate();
        }
    }

    public boolean delete(long id, long userId) throws SQLException {
        String sql = "DELETE FROM notifications WHERE id = ? AND user_id = ?";
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setLong(1, id);
            ps.setLong(2, userId);
            return ps.executeUpdate() > 0;
        }
    }

    private String formatTimeAgo(Timestamp ts) {
        if (ts == null) return "";
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime time = ts.toLocalDateTime();
        Duration d = Duration.between(time, now);
        long seconds = d.getSeconds();
        if (seconds < 60) return "Vừa xong";
        long minutes = seconds / 60;
        if (minutes < 60) return minutes + " phút trước";
        long hours = minutes / 60;
        if (hours < 24) return hours + " giờ trước";
        long days = hours / 24;
        if (days < 30) return days + " ngày trước";
        return (days / 30) + " tháng trước";
    }
}
