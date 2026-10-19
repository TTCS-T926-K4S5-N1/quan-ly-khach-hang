package com.crm.dao.activities;

import com.crm.config.DatabaseConfig;
import com.crm.service.permissions.DataScopeContext;

import java.sql.*;
import java.text.SimpleDateFormat;
import java.util.*;

public class ActivityDAO {

    public List<Map<String, Object>> search(
            DataScopeContext scope,
            Long customerId,
            Long opportunityId,
            String type,
            String status
    ) throws SQLException {
        return search(scope, customerId, null, opportunityId, type, status);
    }

    public List<Map<String, Object>> search(
            DataScopeContext scope,
            Long customerId,
            Long contactId,
            Long opportunityId,
            String type,
            String status
    ) throws SQLException {
        return search(scope, customerId, contactId, opportunityId, type, status, null, null, null, null, null);
    }

    public List<Map<String, Object>> search(
            DataScopeContext scope,
            Long customerId,
            Long contactId,
            Long opportunityId,
            String type,
            String status,
            String priority,
            Long ownerUserId,
            Timestamp fromDate,
            Timestamp toDate,
            Long teamId
    ) throws SQLException {
        StringBuilder sql = new StringBuilder("""
                SELECT
                    a.id,
                    a.subject,
                    a.type,
                    a.description,
                    a.outcome,
                    a.status,
                    a.priority,
                    a.postpone_reason,
                    a.due_date,
                    a.duration_minutes,
                    a.customer_id,
                    a.contact_id,
                    a.opportunity_id,
                    a.owner_user_id,
                    a.assigned_by_user_id,
                    a.created_at,
                    u.full_name AS owner_name,
                    u.team_id AS owner_team_id,
                    u_assigner.full_name AS assigned_by_name,
                    c.name AS customer_name,
                    ct.name AS contact_name,
                    ct.phone AS contact_phone,
                    o.name AS opportunity_name
                FROM activities a
                LEFT JOIN users u ON u.id = a.owner_user_id
                LEFT JOIN users u_assigner ON u_assigner.id = a.assigned_by_user_id
                LEFT JOIN customers c ON c.id = a.customer_id
                LEFT JOIN contacts ct ON ct.id = a.contact_id
                LEFT JOIN opportunities o ON o.id = a.opportunity_id
                WHERE a.is_deleted = 0
                """);

        List<Object> params = new ArrayList<>();
        if (ownerUserId != null) {
            sql.append(" AND a.owner_user_id = ?");
            params.add(ownerUserId);
        } else if (teamId != null) {
            sql.append(" AND u.team_id = ?");
            params.add(teamId);
        } else if (scope != null) {
            scope.appendOwnerPredicate("a.owner_user_id", sql, params);
        }

        if (customerId != null) {
            sql.append(" AND a.customer_id = ?");
            params.add(customerId);
        }

        if (contactId != null) {
            sql.append(" AND a.contact_id = ?");
            params.add(contactId);
        }

        if (opportunityId != null) {
            sql.append(" AND a.opportunity_id = ?");
            params.add(opportunityId);
        }

        if (type != null && !type.isBlank()) {
            sql.append(" AND a.type = ?");
            params.add(type.trim().toUpperCase());
        }

        if (status != null && !status.isBlank()) {
            sql.append(" AND a.status = ?");
            params.add(status.trim().toUpperCase());
        }

        if (priority != null && !priority.isBlank()) {
            sql.append(" AND a.priority = ?");
            params.add(priority.trim().toUpperCase());
        }

        if (fromDate != null) {
            sql.append(" AND a.due_date >= ?");
            params.add(fromDate);
        }

        if (toDate != null) {
            sql.append(" AND a.due_date <= ?");
            params.add(toDate);
        }

        sql.append(" ORDER BY a.due_date ASC, a.id DESC");

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

    public Map<String, Object> findById(long id) throws SQLException {
        String sql = """
                SELECT
                    a.id,
                    a.subject,
                    a.type,
                    a.description,
                    a.outcome,
                    a.status,
                    a.priority,
                    a.postpone_reason,
                    a.due_date,
                    a.duration_minutes,
                    a.customer_id,
                    a.contact_id,
                    a.opportunity_id,
                    a.owner_user_id,
                    a.assigned_by_user_id,
                    a.created_at,
                    u.full_name AS owner_name,
                    u.team_id AS owner_team_id,
                    u_assigner.full_name AS assigned_by_name,
                    c.name AS customer_name,
                    ct.name AS contact_name,
                    ct.phone AS contact_phone,
                    o.name AS opportunity_name
                FROM activities a
                LEFT JOIN users u ON u.id = a.owner_user_id
                LEFT JOIN users u_assigner ON u_assigner.id = a.assigned_by_user_id
                LEFT JOIN customers c ON c.id = a.customer_id
                LEFT JOIN contacts ct ON ct.id = a.contact_id
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
        return create(subject, type, description, null, status, "MEDIUM", dueDate, 0, customerId, null, opportunityId, ownerId, null);
    }

    public long create(
            String subject,
            String type,
            String description,
            String outcome,
            String status,
            Timestamp dueDate,
            int durationMinutes,
            Long customerId,
            Long contactId,
            Long opportunityId,
            long ownerId
    ) throws SQLException {
        return create(subject, type, description, outcome, status, "MEDIUM", dueDate, durationMinutes, customerId, contactId, opportunityId, ownerId, null);
    }

    public long create(
            String subject,
            String type,
            String description,
            String outcome,
            String status,
            String priority,
            Timestamp dueDate,
            int durationMinutes,
            Long customerId,
            Long contactId,
            Long opportunityId,
            long ownerId,
            Long assignedByUserId
    ) throws SQLException {
        String sql = """
                INSERT INTO activities (
                    subject, type, description, outcome, status, priority, due_date, duration_minutes, customer_id, contact_id, opportunity_id, owner_user_id, assigned_by_user_id
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """;

        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS)) {
            stmt.setString(1, subject);
            stmt.setString(2, type != null ? type.toUpperCase() : "TASK");
            stmt.setString(3, description);
            stmt.setString(4, outcome);
            stmt.setString(5, status != null ? status.toUpperCase() : "OPEN");
            stmt.setString(6, priority != null ? priority.toUpperCase() : "MEDIUM");
            stmt.setTimestamp(7, dueDate != null ? dueDate : new Timestamp(System.currentTimeMillis()));
            stmt.setInt(8, durationMinutes > 0 ? durationMinutes : 15);
            stmt.setObject(9, customerId, Types.BIGINT);
            stmt.setObject(10, contactId, Types.BIGINT);
            stmt.setObject(11, opportunityId, Types.BIGINT);
            stmt.setLong(12, ownerId);
            stmt.setObject(13, assignedByUserId, Types.BIGINT);

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
            String outcome,
            String status,
            String priority,
            Timestamp dueDate,
            int durationMinutes,
            Long contactId,
            Long ownerUserId,
            String postponeReason
    ) throws SQLException {
        String sql = """
                UPDATE activities SET
                    subject = ?, type = ?, description = ?, outcome = ?, status = ?, priority = ?, due_date = ?, duration_minutes = ?, contact_id = ?, owner_user_id = COALESCE(?, owner_user_id), postpone_reason = COALESCE(?, postpone_reason)
                WHERE id = ? AND is_deleted = 0
                """;
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setString(1, subject);
            stmt.setString(2, type != null ? type.toUpperCase() : "TASK");
            stmt.setString(3, description);
            stmt.setString(4, outcome);
            stmt.setString(5, status != null ? status.toUpperCase() : "OPEN");
            stmt.setString(6, priority != null ? priority.toUpperCase() : "MEDIUM");
            stmt.setTimestamp(7, dueDate);
            stmt.setInt(8, durationMinutes);
            stmt.setObject(9, contactId, Types.BIGINT);
            stmt.setObject(10, ownerUserId, Types.BIGINT);
            stmt.setString(11, postponeReason);
            stmt.setLong(12, id);
            stmt.executeUpdate();
        }
    }

    public void update(
            long id,
            String subject,
            String type,
            String description,
            String outcome,
            String status,
            Timestamp dueDate,
            int durationMinutes,
            Long contactId
    ) throws SQLException {
        update(id, subject, type, description, outcome, status, "MEDIUM", dueDate, durationMinutes, contactId, null, null);
    }

    public void complete(long id) throws SQLException {
        String sql = "UPDATE activities SET status = 'COMPLETED', outcome = COALESCE(outcome, 'Đã hoàn thành') WHERE id = ? AND is_deleted = 0";
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setLong(1, id);
            stmt.executeUpdate();
        }
    }

    public void postpone(long id, String reason, Timestamp newDueDate) throws SQLException {
        String sql = "UPDATE activities SET status = 'POSTPONED', postpone_reason = ?, due_date = COALESCE(?, due_date) WHERE id = ? AND is_deleted = 0";
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setString(1, reason);
            stmt.setTimestamp(2, newDueDate);
            stmt.setLong(3, id);
            stmt.executeUpdate();
        }
    }

    public List<Map<String, Object>> getAssignableUsers(long currentUserId, Long teamId, boolean canAssignAll) throws SQLException {
        String sql;
        if (canAssignAll || teamId == null) {
            sql = "SELECT u.id, u.full_name, u.email, u.team_id, t.name AS team_name FROM users u LEFT JOIN teams t ON t.id = u.team_id WHERE u.status = 'ACTIVE' ORDER BY u.full_name";
        } else {
            sql = "SELECT u.id, u.full_name, u.email, u.team_id, t.name AS team_name FROM users u LEFT JOIN teams t ON t.id = u.team_id WHERE u.status = 'ACTIVE' AND (u.team_id = ? OR u.id = ?) ORDER BY u.full_name";
        }

        List<Map<String, Object>> list = new ArrayList<>();
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            if (!canAssignAll && teamId != null) {
                stmt.setLong(1, teamId);
                stmt.setLong(2, currentUserId);
            }
            try (ResultSet rs = stmt.executeQuery()) {
                while (rs.next()) {
                    Map<String, Object> map = new LinkedHashMap<>();
                    map.put("id", rs.getLong("id"));
                    map.put("fullName", rs.getString("full_name"));
                    map.put("email", rs.getString("email"));
                    map.put("teamId", rs.getObject("team_id"));
                    map.put("teamName", rs.getString("team_name") != null ? rs.getString("team_name") : "Chưa phân nhóm");
                    list.add(map);
                }
            }
        }
        return list;
    }

    public void softDelete(long id) throws SQLException {
        String sql = "UPDATE activities SET is_deleted = 1 WHERE id = ?";
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setLong(1, id);
            stmt.executeUpdate();
        }
    }

    public List<Map<String, Object>> getOverdueTasks(DataScopeContext scope, Long userId, Long teamId, int limit) throws SQLException {
        StringBuilder sql = new StringBuilder("""
                SELECT
                    a.id, a.subject, a.type, a.description, a.outcome, a.status, a.priority,
                    a.postpone_reason, a.due_date, a.duration_minutes, a.customer_id, a.contact_id,
                    a.opportunity_id, a.owner_user_id, a.assigned_by_user_id, a.created_at,
                    u.full_name AS owner_name, u.team_id AS owner_team_id,
                    u_assigner.full_name AS assigned_by_name,
                    c.name AS customer_name, ct.name AS contact_name, ct.phone AS contact_phone,
                    o.name AS opportunity_name,
                    TIMESTAMPDIFF(HOUR, a.due_date, NOW()) AS overdue_hours,
                    TIMESTAMPDIFF(DAY, a.due_date, NOW()) AS overdue_days
                FROM activities a
                LEFT JOIN users u ON u.id = a.owner_user_id
                LEFT JOIN users u_assigner ON u_assigner.id = a.assigned_by_user_id
                LEFT JOIN customers c ON c.id = a.customer_id
                LEFT JOIN contacts ct ON ct.id = a.contact_id
                LEFT JOIN opportunities o ON o.id = a.opportunity_id
                WHERE a.is_deleted = 0
                  AND a.type = 'TASK'
                  AND a.status IN ('OPEN', 'POSTPONED')
                  AND a.due_date < NOW()
                """);
        List<Object> params = new ArrayList<>();
        if (userId != null) {
            sql.append(" AND a.owner_user_id = ?");
            params.add(userId);
        } else if (teamId != null) {
            sql.append(" AND u.team_id = ?");
            params.add(teamId);
        } else if (scope != null) {
            scope.appendOwnerPredicate("a.owner_user_id", sql, params);
        }
        sql.append(" ORDER BY a.due_date ASC LIMIT ?");
        params.add(limit > 0 ? limit : 20);

        List<Map<String, Object>> list = new ArrayList<>();
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql.toString())) {
            for (int i = 0; i < params.size(); i++) {
                stmt.setObject(i + 1, params.get(i));
            }
            try (ResultSet rs = stmt.executeQuery()) {
                while (rs.next()) {
                    Map<String, Object> map = mapActivity(rs);
                    map.put("overdueHours", rs.getLong("overdue_hours"));
                    map.put("overdueDays", rs.getLong("overdue_days"));
                    list.add(map);
                }
            }
        }
        return list;
    }

    public List<Map<String, Object>> getUpcomingTasks(DataScopeContext scope, Long userId, int windowMinutes, int limit) throws SQLException {
        StringBuilder sql = new StringBuilder("""
                SELECT
                    a.id, a.subject, a.type, a.description, a.outcome, a.status, a.priority,
                    a.postpone_reason, a.due_date, a.duration_minutes, a.customer_id, a.contact_id,
                    a.opportunity_id, a.owner_user_id, a.assigned_by_user_id, a.created_at,
                    u.full_name AS owner_name, u.team_id AS owner_team_id,
                    u_assigner.full_name AS assigned_by_name,
                    c.name AS customer_name, ct.name AS contact_name, ct.phone AS contact_phone,
                    o.name AS opportunity_name,
                    TIMESTAMPDIFF(MINUTE, NOW(), a.due_date) AS minutes_until_due
                FROM activities a
                LEFT JOIN users u ON u.id = a.owner_user_id
                LEFT JOIN users u_assigner ON u_assigner.id = a.assigned_by_user_id
                LEFT JOIN customers c ON c.id = a.customer_id
                LEFT JOIN contacts ct ON ct.id = a.contact_id
                LEFT JOIN opportunities o ON o.id = a.opportunity_id
                WHERE a.is_deleted = 0
                  AND a.type = 'TASK'
                  AND a.status IN ('OPEN', 'POSTPONED')
                  AND a.due_date >= NOW()
                  AND a.due_date <= DATE_ADD(NOW(), INTERVAL ? MINUTE)
                """);
        List<Object> params = new ArrayList<>();
        params.add(windowMinutes > 0 ? windowMinutes : 60);

        if (userId != null) {
            sql.append(" AND a.owner_user_id = ?");
            params.add(userId);
        } else if (scope != null) {
            scope.appendOwnerPredicate("a.owner_user_id", sql, params);
        }
        sql.append(" ORDER BY a.due_date ASC LIMIT ?");
        params.add(limit > 0 ? limit : 20);

        List<Map<String, Object>> list = new ArrayList<>();
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql.toString())) {
            for (int i = 0; i < params.size(); i++) {
                stmt.setObject(i + 1, params.get(i));
            }
            try (ResultSet rs = stmt.executeQuery()) {
                while (rs.next()) {
                    Map<String, Object> map = mapActivity(rs);
                    map.put("minutesUntilDue", rs.getLong("minutes_until_due"));
                    list.add(map);
                }
            }
        }
        return list;
    }

    public List<Map<String, Object>> getTeamOverdueSummary(DataScopeContext scope, Long teamId) throws SQLException {
        StringBuilder sql = new StringBuilder("""
                SELECT
                    u.id AS user_id,
                    u.full_name,
                    u.email,
                    u.team_id,
                    COALESCE(t.name, 'Chưa phân nhóm') AS team_name,
                    COUNT(CASE WHEN a.id IS NOT NULL AND a.status IN ('OPEN', 'POSTPONED') AND a.due_date < NOW() THEN 1 END) AS overdue_count,
                    COUNT(CASE WHEN a.id IS NOT NULL AND a.status IN ('OPEN', 'POSTPONED') AND a.due_date >= NOW() AND a.due_date <= DATE_ADD(NOW(), INTERVAL 1 DAY) THEN 1 END) AS upcoming_count,
                    COUNT(CASE WHEN a.id IS NOT NULL AND a.status IN ('OPEN', 'POSTPONED') THEN 1 END) AS total_open_count,
                    COUNT(CASE WHEN a.id IS NOT NULL AND a.status = 'COMPLETED' THEN 1 END) AS completed_count
                FROM users u
                LEFT JOIN teams t ON t.id = u.team_id
                LEFT JOIN activities a ON a.owner_user_id = u.id AND a.is_deleted = 0 AND a.type = 'TASK'
                WHERE u.status = 'ACTIVE'
                """);
        List<Object> params = new ArrayList<>();
        if (teamId != null) {
            sql.append(" AND u.team_id = ?");
            params.add(teamId);
        } else if (scope != null) {
            scope.appendOwnerPredicate("u.id", sql, params);
        }
        sql.append("\n GROUP BY u.id, u.full_name, u.email, u.team_id, t.name\n ORDER BY overdue_count DESC, upcoming_count DESC, u.full_name ASC\n");

        List<Map<String, Object>> list = new ArrayList<>();
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql.toString())) {
            for (int i = 0; i < params.size(); i++) {
                stmt.setObject(i + 1, params.get(i));
            }
            try (ResultSet rs = stmt.executeQuery()) {
                while (rs.next()) {
                    Map<String, Object> map = new LinkedHashMap<>();
                    map.put("userId", rs.getLong("user_id"));
                    map.put("fullName", rs.getString("full_name"));
                    map.put("userName", rs.getString("full_name"));
                    map.put("email", rs.getString("email"));
                    map.put("teamId", rs.getObject("team_id"));
                    map.put("teamName", rs.getString("team_name"));
                    map.put("overdueCount", rs.getInt("overdue_count"));
                    map.put("overdueTasksCount", rs.getInt("overdue_count"));
                    map.put("upcomingCount", rs.getInt("upcoming_count"));
                    map.put("upcomingTasksCount", rs.getInt("upcoming_count"));
                    map.put("totalOpenCount", rs.getInt("total_open_count"));
                    map.put("openTasksCount", rs.getInt("total_open_count"));
                    map.put("completedCount", rs.getInt("completed_count"));
                    list.add(map);
                }
            }
        }
        return list;
    }

    public Map<String, Object> getLatestOpenOpportunity(long customerId) throws SQLException {
        String sql = """
                SELECT o.id, o.name, o.amount, ps.name AS stage_name
                FROM opportunities o
                JOIN pipeline_stages ps ON ps.id = o.stage_id
                WHERE o.customer_id = ?
                  AND o.is_deleted = 0
                  AND ps.is_won = 0
                  AND ps.is_lost = 0
                ORDER BY o.updated_at DESC, o.id DESC
                LIMIT 1
                """;
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setLong(1, customerId);
            try (ResultSet rs = stmt.executeQuery()) {
                if (rs.next()) {
                    Map<String, Object> map = new LinkedHashMap<>();
                    map.put("id", rs.getLong("id"));
                    map.put("name", rs.getString("name"));
                    map.put("amount", rs.getBigDecimal("amount"));
                    map.put("stageName", rs.getString("stage_name"));
                    return map;
                }
            }
        }
        return null;
    }

    public Map<String, Object> quickLogCall(
            long currentUserId,
            long customerId,
            Long contactId,
            String outcome,
            String notes,
            Timestamp callbackAt
    ) throws SQLException {
        Map<String, Object> latestOpp = getLatestOpenOpportunity(customerId);
        Long linkedOppId = latestOpp != null ? (Long) latestOpp.get("id") : null;

        String customerName = "Khách hàng #" + customerId;
        String custSql = "SELECT name FROM customers WHERE id = ?";
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement stmt = conn.prepareStatement(custSql)) {
            stmt.setLong(1, customerId);
            try (ResultSet rs = stmt.executeQuery()) {
                if (rs.next()) {
                    customerName = rs.getString("name");
                }
            }
        }

        String callSubject = "Cuộc gọi với " + customerName + (outcome != null ? " (" + outcome + ")" : "");
        String callDescription = (notes != null && !notes.isBlank()) ? notes : "Ghi nhận nhanh kết quả cuộc gọi: " + outcome;

        long callActivityId = create(
                callSubject,
                "CALL",
                callDescription,
                outcome,
                "COMPLETED",
                "MEDIUM",
                new Timestamp(System.currentTimeMillis()),
                2,
                customerId,
                contactId,
                linkedOppId,
                currentUserId,
                currentUserId
        );

        Long followUpTaskId = null;
        if (callbackAt != null) {
            String taskSubject = "Gọi lại cho " + customerName + (outcome != null ? " (Theo hẹn: " + outcome + ")" : "");
            String taskDesc = "Lịch gọi lại tự động tạo từ cuộc gọi nhanh lúc " + new SimpleDateFormat("HH:mm dd/MM/yyyy").format(new java.util.Date()) + ". Ghi chú trước đó: " + callDescription;
            followUpTaskId = create(
                    taskSubject,
                    "TASK",
                    taskDesc,
                    null,
                    "OPEN",
                    "HIGH",
                    callbackAt,
                    15,
                    customerId,
                    contactId,
                    linkedOppId,
                    currentUserId,
                    currentUserId
            );
        }

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("callActivityId", callActivityId);
        result.put("callActivity", findById(callActivityId));
        result.put("linkedOpportunity", latestOpp);
        result.put("followUpTaskId", followUpTaskId);
        if (followUpTaskId != null) {
            result.put("followUpTask", findById(followUpTaskId));
        }
        return result;
    }

    public Map<String, Object> getTeamActivityStats(
            DataScopeContext scope,
            Timestamp fromDate,
            Timestamp toDate,
            Long teamId,
            String type,
            Long memberUserId
    ) throws SQLException {
        StringBuilder sql = new StringBuilder("""
                SELECT
                    u.id AS user_id,
                    u.full_name,
                    u.email,
                    u.team_id,
                    COALESCE(t.name, 'Chưa phân nhóm') AS team_name,
                    COUNT(a.id) AS total_activities,
                    COUNT(CASE WHEN a.type = 'CALL' THEN 1 END) AS call_count,
                    COUNT(CASE WHEN a.type = 'MEETING' THEN 1 END) AS meeting_count,
                    COUNT(CASE WHEN a.type = 'EMAIL' THEN 1 END) AS email_count,
                    COUNT(CASE WHEN a.type = 'TASK' THEN 1 END) AS task_count,
                    COUNT(CASE WHEN a.type = 'NOTE' THEN 1 END) AS note_count,
                    COUNT(CASE WHEN a.type = 'TASK' AND a.status = 'COMPLETED' THEN 1 END) AS completed_tasks,
                    COUNT(CASE WHEN a.type = 'TASK' AND a.status IN ('OPEN', 'POSTPONED') AND a.due_date < NOW() THEN 1 END) AS overdue_tasks,
                    MAX(a.created_at) AS last_active_at
                FROM users u
                LEFT JOIN teams t ON t.id = u.team_id
                LEFT JOIN activities a ON a.owner_user_id = u.id AND a.is_deleted = 0
                """);

        List<Object> params = new ArrayList<>();

        if (fromDate != null) {
            sql.append(" AND a.created_at >= ?");
            params.add(fromDate);
        }
        if (toDate != null) {
            sql.append(" AND a.created_at <= ?");
            params.add(toDate);
        }
        if (type != null && !type.isBlank()) {
            sql.append(" AND a.type = ?");
            params.add(type.toUpperCase());
        }

        sql.append(" WHERE u.status = 'ACTIVE'");

        if (memberUserId != null) {
            sql.append(" AND u.id = ?");
            params.add(memberUserId);
        } else if (teamId != null) {
            sql.append(" AND u.team_id = ?");
            params.add(teamId);
        } else if (scope != null) {
            scope.appendOwnerPredicate("u.id", sql, params);
        }

        sql.append("\n GROUP BY u.id, u.full_name, u.email, u.team_id, t.name\n ORDER BY total_activities DESC, u.full_name ASC\n");

        List<Map<String, Object>> memberStats = new ArrayList<>();
        int teamTotal = 0;
        int teamCalls = 0;
        int teamMeetings = 0;
        int teamEmails = 0;
        int teamTasks = 0;
        int teamNotes = 0;
        int teamOverdue = 0;

        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql.toString())) {
            for (int i = 0; i < params.size(); i++) {
                stmt.setObject(i + 1, params.get(i));
            }
            try (ResultSet rs = stmt.executeQuery()) {
                while (rs.next()) {
                    Map<String, Object> map = new LinkedHashMap<>();
                    map.put("userId", rs.getLong("user_id"));
                    map.put("fullName", rs.getString("full_name"));
                    map.put("email", rs.getString("email"));
                    map.put("teamId", rs.getObject("team_id"));
                    map.put("teamName", rs.getString("team_name"));
                    int acts = rs.getInt("total_activities");
                    int calls = rs.getInt("call_count");
                    int meetings = rs.getInt("meeting_count");
                    int emails = rs.getInt("email_count");
                    int tasks = rs.getInt("task_count");
                    int notes = rs.getInt("note_count");
                    int overdue = rs.getInt("overdue_tasks");

                    map.put("totalActivities", acts);
                    map.put("callCount", calls);
                    map.put("meetingCount", meetings);
                    map.put("emailCount", emails);
                    map.put("taskCount", tasks);
                    map.put("noteCount", notes);
                    map.put("completedTasks", rs.getInt("completed_tasks"));
                    map.put("overdueTasks", overdue);
                    map.put("overdueTaskCount", overdue);
                    map.put("lastActiveAt", rs.getTimestamp("last_active_at"));

                    String rating;
                    if (acts >= 10) rating = "Rất tích cực 🔥";
                    else if (acts >= 4) rating = "Tích cực 👍";
                    else if (acts > 0) rating = "Trung bình ⏳";
                    else rating = "Chưa có hoạt động ⚠️";
                    map.put("rating", rating);
                    map.put("activityRating", rating);
                    map.put("userName", rs.getString("full_name"));

                    memberStats.add(map);

                    teamTotal += acts;
                    teamCalls += calls;
                    teamMeetings += meetings;
                    teamEmails += emails;
                    teamTasks += tasks;
                    teamNotes += notes;
                    teamOverdue += overdue;
                }
            }
        }

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("stats", memberStats);
        result.put("memberStats", memberStats);
        result.put("totalMembers", memberStats.size());
        result.put("totalActivities", teamTotal);
        result.put("teamTotalActivities", teamTotal);
        result.put("teamTotalCalls", teamCalls);
        result.put("teamTotalMeetings", teamMeetings);
        result.put("teamTotalEmails", teamEmails);
        result.put("teamTotalTasks", teamTasks);
        result.put("teamTotalNotes", teamNotes);
        result.put("teamTotalOverdueTasks", teamOverdue);
        return result;
    }

    private Map<String, Object> mapActivity(ResultSet rs) throws SQLException {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("id", rs.getLong("id"));
        map.put("subject", rs.getString("subject"));
        map.put("type", rs.getString("type"));
        map.put("description", rs.getString("description"));
        map.put("outcome", rs.getString("outcome"));
        map.put("status", rs.getString("status"));
        map.put("priority", rs.getString("priority") != null ? rs.getString("priority") : "MEDIUM");
        map.put("postponeReason", rs.getString("postpone_reason"));
        map.put("dueDate", rs.getTimestamp("due_date"));
        map.put("durationMinutes", rs.getInt("duration_minutes"));
        map.put("customerId", rs.getObject("customer_id"));
        map.put("customerName", rs.getString("customer_name"));
        map.put("contactId", rs.getObject("contact_id"));
        map.put("contactName", rs.getString("contact_name"));
        map.put("contactPhone", rs.getString("contact_phone"));
        map.put("opportunityId", rs.getObject("opportunity_id"));
        map.put("opportunityName", rs.getString("opportunity_name"));
        map.put("ownerUserId", rs.getLong("owner_user_id"));
        map.put("ownerName", rs.getString("owner_name"));
        map.put("ownerTeamId", rs.getObject("owner_team_id"));
        map.put("assignedByUserId", rs.getObject("assigned_by_user_id"));
        map.put("assignedByName", rs.getString("assigned_by_name"));
        map.put("createdAt", rs.getTimestamp("created_at"));
        return map;
    }
}
