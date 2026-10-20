package com.crm.dao.activities;

import com.crm.config.DatabaseConfig;
import com.crm.service.permissions.DataScopeContext;

import java.sql.*;
import java.util.*;

public class ActivityDAO {

    public List<Map<String, Object>> search(
            DataScopeContext scope,
            Long customerId,
            Long opportunityId,
            String type,
            String status
    ) throws SQLException {
        return search(scope, customerId, opportunityId, type, status, null, null, null, null);
    }

    public List<Map<String, Object>> search(
            DataScopeContext scope,
            Long customerId,
            Long opportunityId,
            String type,
            String status,
            Long ownerId,
            Timestamp fromDate,
            Timestamp toDate,
            String keyword
    ) throws SQLException {
        StringBuilder sql = new StringBuilder("""
                SELECT
                    a.id,
                    a.subject,
                    a.type,
                    a.description,
                    a.status,
                    a.due_date,
                    a.customer_id,
                    a.opportunity_id,
                    a.owner_user_id,
                    a.created_at,
                    u.full_name AS owner_name,
                    c.name AS customer_name,
                    o.name AS opportunity_name
                FROM activities a
                LEFT JOIN users u ON u.id = a.owner_user_id
                LEFT JOIN customers c ON c.id = a.customer_id
                LEFT JOIN opportunities o ON o.id = a.opportunity_id
                WHERE a.is_deleted = 0
                """);

        List<Object> params = new ArrayList<>();
        if (scope != null) {
            scope.appendOwnerPredicate("a.owner_user_id", sql, params);
        }

        if (ownerId != null) {
            sql.append(" AND a.owner_user_id = ?");
            params.add(ownerId);
        }

        if (customerId != null) {
            sql.append(" AND a.customer_id = ?");
            params.add(customerId);
        }

        if (opportunityId != null) {
            sql.append(" AND a.opportunity_id = ?");
            params.add(opportunityId);
        }

        if (type != null && !type.isBlank()) {
            sql.append(" AND UPPER(a.type) = UPPER(?)");
            params.add(type.trim());
        }

        if (status != null && !status.isBlank()) {
            String st = status.trim().toUpperCase();
            if ("DONE".equals(st)) st = "COMPLETED";
            sql.append(" AND UPPER(a.status) = ?");
            params.add(st);
        }

        if (fromDate != null) {
            sql.append(" AND COALESCE(a.due_date, a.created_at) >= ?");
            params.add(fromDate);
        }

        if (toDate != null) {
            sql.append(" AND COALESCE(a.due_date, a.created_at) <= ?");
            params.add(toDate);
        }

        if (keyword != null && !keyword.isBlank()) {
            sql.append(" AND (LOWER(a.subject) LIKE ? OR LOWER(a.description) LIKE ? OR LOWER(c.name) LIKE ? OR LOWER(u.full_name) LIKE ?)");
            String kw = "%" + keyword.trim().toLowerCase() + "%";
            params.add(kw);
            params.add(kw);
            params.add(kw);
            params.add(kw);
        }

        sql.append(" ORDER BY COALESCE(a.due_date, a.created_at) DESC, a.id DESC");

        List<Map<String, Object>> list = new ArrayList<>();
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql.toString())) {
            for (int i = 0; i < params.size(); i++) {
                stmt.setObject(i + 1, params.get(i));
            }
            try (ResultSet rs = stmt.executeQuery()) {
                while (rs.next()) {
                    list.add(mapActivity(rs));
                }
            }
        }
        return list;
    }

    public List<Map<String, Object>> findAccessibleMembers(DataScopeContext scope) throws SQLException {
        StringBuilder sql = new StringBuilder("""
                SELECT
                    u.id,
                    u.full_name,
                    u.email,
                    u.status,
                    u.team_id,
                    t.name AS team_name
                FROM users u
                LEFT JOIN teams t ON t.id = u.team_id
                WHERE u.status <> 'DELETED'
                """);

        List<Object> params = new ArrayList<>();
        if (scope != null) {
            scope.appendOwnerPredicate("u.id", sql, params);
        }

        sql.append(" ORDER BY u.full_name ASC");

        List<Map<String, Object>> list = new ArrayList<>();
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql.toString())) {
            for (int i = 0; i < params.size(); i++) {
                stmt.setObject(i + 1, params.get(i));
            }
            try (ResultSet rs = stmt.executeQuery()) {
                while (rs.next()) {
                    Map<String, Object> map = new LinkedHashMap<>();
                    map.put("id", rs.getLong("id"));
                    map.put("fullName", rs.getString("full_name"));
                    map.put("email", rs.getString("email"));
                    map.put("status", rs.getString("status"));
                    map.put("teamId", rs.getObject("team_id"));
                    map.put("teamName", rs.getString("team_name"));
                    list.add(map);
                }
            }
        }
        return list;
    }

    public List<Map<String, Object>> getMemberActivitySummary(
            DataScopeContext scope,
            Long ownerId,
            String type,
            String status,
            Timestamp fromDate,
            Timestamp toDate,
            Long customerId,
            Long opportunityId
    ) throws SQLException {
        StringBuilder sql = new StringBuilder("""
                SELECT
                    u.id AS user_id,
                    u.full_name,
                    u.email,
                    t.name AS team_name,
                    COUNT(a.id) AS total_activities,
                    SUM(CASE WHEN UPPER(a.type) = 'CALL' THEN 1 ELSE 0 END) AS call_count,
                    SUM(CASE WHEN UPPER(a.type) = 'EMAIL' THEN 1 ELSE 0 END) AS email_count,
                    SUM(CASE WHEN UPPER(a.type) = 'MEETING' THEN 1 ELSE 0 END) AS meeting_count,
                    SUM(CASE WHEN UPPER(a.type) = 'TASK' THEN 1 ELSE 0 END) AS task_count,
                    SUM(CASE WHEN UPPER(a.type) = 'NOTE' THEN 1 ELSE 0 END) AS note_count,
                    SUM(CASE WHEN UPPER(a.status) = 'COMPLETED' THEN 1 ELSE 0 END) AS completed_count,
                    SUM(CASE WHEN UPPER(a.status) = 'OPEN' THEN 1 ELSE 0 END) AS open_count,
                    SUM(CASE WHEN UPPER(a.status) = 'OPEN' AND a.due_date IS NOT NULL AND a.due_date < NOW() THEN 1 ELSE 0 END) AS late_count,
                    MAX(COALESCE(a.due_date, a.created_at)) AS latest_activity_at
                FROM users u
                LEFT JOIN teams t ON t.id = u.team_id
                LEFT JOIN activities a ON a.owner_user_id = u.id AND a.is_deleted = 0
                """);

        List<Object> joinParams = new ArrayList<>();
        if (type != null && !type.isBlank()) {
            sql.append(" AND UPPER(a.type) = UPPER(?)");
            joinParams.add(type.trim());
        }

        if (status != null && !status.isBlank()) {
            String st = status.trim().toUpperCase();
            if ("DONE".equals(st)) st = "COMPLETED";
            sql.append(" AND UPPER(a.status) = ?");
            joinParams.add(st);
        }

        if (fromDate != null) {
            sql.append(" AND COALESCE(a.due_date, a.created_at) >= ?");
            joinParams.add(fromDate);
        }

        if (toDate != null) {
            sql.append(" AND COALESCE(a.due_date, a.created_at) <= ?");
            joinParams.add(toDate);
        }

        if (customerId != null) {
            sql.append(" AND a.customer_id = ?");
            joinParams.add(customerId);
        }

        if (opportunityId != null) {
            sql.append(" AND a.opportunity_id = ?");
            joinParams.add(opportunityId);
        }

        sql.append(" WHERE u.status = 'ACTIVE'");

        List<Object> whereParams = new ArrayList<>();
        if (scope != null) {
            scope.appendOwnerPredicate("u.id", sql, whereParams);
        }

        if (ownerId != null) {
            sql.append(" AND u.id = ?");
            whereParams.add(ownerId);
        }

        sql.append(" GROUP BY u.id, u.full_name, u.email, t.name");
        sql.append(" ORDER BY total_activities DESC, u.full_name ASC");

        List<Object> allParams = new ArrayList<>(joinParams);
        allParams.addAll(whereParams);

        List<Map<String, Object>> list = new ArrayList<>();
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql.toString())) {
            for (int i = 0; i < allParams.size(); i++) {
                stmt.setObject(i + 1, allParams.get(i));
            }
            try (ResultSet rs = stmt.executeQuery()) {
                while (rs.next()) {
                    Map<String, Object> map = new LinkedHashMap<>();
                    map.put("userId", rs.getLong("user_id"));
                    map.put("fullName", rs.getString("full_name"));
                    map.put("email", rs.getString("email"));
                    map.put("teamName", rs.getString("team_name"));
                    map.put("totalActivities", rs.getLong("total_activities"));
                    map.put("callCount", rs.getLong("call_count"));
                    map.put("emailCount", rs.getLong("email_count"));
                    map.put("meetingCount", rs.getLong("meeting_count"));
                    map.put("taskCount", rs.getLong("task_count"));
                    map.put("noteCount", rs.getLong("note_count"));
                    map.put("completedCount", rs.getLong("completed_count"));
                    map.put("openCount", rs.getLong("open_count"));
                    map.put("lateCount", rs.getLong("late_count"));
                    map.put("latestActivityAt", rs.getTimestamp("latest_activity_at"));
                    list.add(map);
                }
            }
        }
        return list;
    }

    public Map<String, Object> findById(long id) throws SQLException {
        String sql = """
                SELECT
                    a.id,
                    a.subject,
                    a.type,
                    a.description,
                    a.status,
                    a.due_date,
                    a.customer_id,
                    a.opportunity_id,
                    a.owner_user_id,
                    a.created_at,
                    u.full_name AS owner_name,
                    c.name AS customer_name,
                    o.name AS opportunity_name
                FROM activities a
                LEFT JOIN users u ON u.id = a.owner_user_id
                LEFT JOIN customers c ON c.id = a.customer_id
                LEFT JOIN opportunities o ON o.id = a.opportunity_id
                WHERE a.id = ? AND a.is_deleted = 0
                """;

        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setLong(1, id);
            try (ResultSet rs = stmt.executeQuery()) {
                if (rs.next()) {
                    return mapActivity(rs);
                }
            }
        }
        return null;
    }

    public long create(
            String subject,
            String type,
            String description,
            String status,
            Timestamp dueDate,
            Long customerId,
            Long opportunityId,
            long ownerId
    ) throws SQLException {
        String sql = """
                INSERT INTO activities (
                    subject, type, description, status, due_date, customer_id, opportunity_id, owner_user_id
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                """;

        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS)) {
            stmt.setString(1, subject);
            stmt.setString(2, type != null ? type : "CALL");
            stmt.setString(3, description);
            stmt.setString(4, status != null ? status : "COMPLETED");
            stmt.setTimestamp(5, dueDate);
            stmt.setObject(6, customerId, Types.BIGINT);
            stmt.setObject(7, opportunityId, Types.BIGINT);
            stmt.setLong(8, ownerId);

            stmt.executeUpdate();
            try (ResultSet rs = stmt.getGeneratedKeys()) {
                if (rs.next()) {
                    return rs.getLong(1);
                }
            }
        }
        throw new SQLException("Không thể tạo hoạt động");
    }

    public void update(
            long id,
            String subject,
            String type,
            String description,
            String status,
            Timestamp dueDate
    ) throws SQLException {
        String sql = """
                UPDATE activities SET
                    subject = ?, type = ?, description = ?, status = ?, due_date = ?
                WHERE id = ? AND is_deleted = 0
                """;
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setString(1, subject);
            stmt.setString(2, type);
            stmt.setString(3, description);
            stmt.setString(4, status);
            stmt.setTimestamp(5, dueDate);
            stmt.setLong(6, id);
            stmt.executeUpdate();
        }
    }

    public void softDelete(long id) throws SQLException {
        String sql = "UPDATE activities SET is_deleted = 1 WHERE id = ?";
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setLong(1, id);
            stmt.executeUpdate();
        }
    }

    private Map<String, Object> mapActivity(ResultSet rs) throws SQLException {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("id", rs.getLong("id"));
        map.put("subject", rs.getString("subject"));
        map.put("type", rs.getString("type"));
        map.put("description", rs.getString("description"));
        map.put("status", rs.getString("status"));
        map.put("dueDate", rs.getTimestamp("due_date"));
        map.put("customerId", rs.getObject("customer_id"));
        map.put("customerName", rs.getString("customer_name"));
        map.put("opportunityId", rs.getObject("opportunity_id"));
        map.put("opportunityName", rs.getString("opportunity_name"));
        map.put("ownerUserId", rs.getLong("owner_user_id"));
        map.put("ownerName", rs.getString("owner_name"));
        map.put("createdAt", rs.getTimestamp("created_at"));
        return map;
    }
}
