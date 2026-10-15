package com.crm.dao.pipeline;

import com.crm.config.DatabaseConfig;
import com.crm.dto.pipeline.OpportunityWriteRequest;
import com.crm.service.permissions.DataScopeContext;

import java.sql.*;
import java.util.*;

public class OpportunityDAO {

    public List<Map<String, Object>> search(
            DataScopeContext scope,
            Long stageId,
            String status,
            String keyword,
            int page,
            int size
    ) throws SQLException {
        return search(scope, stageId, status, keyword, null, null, null, null, null, null, null, page, size);
    }

    public List<Map<String, Object>> search(
            DataScopeContext scope,
            Long stageId,
            String status,
            String keyword,
            String customFieldKey,
            String customFieldValue,
            int page,
            int size
    ) throws SQLException {
        return search(scope, stageId, status, keyword, null, null, null, null, null, customFieldKey, customFieldValue, page, size);
    }

    public List<Map<String, Object>> search(
            DataScopeContext scope,
            Long stageId,
            String status,
            String keyword,
            Long ownerUserId,
            Long teamId,
            String closeDateFrom,
            String closeDateTo,
            String leadSource,
            String customFieldKey,
            String customFieldValue,
            int page,
            int size
    ) throws SQLException {
        return search(scope, stageId, status, keyword, ownerUserId, teamId, closeDateFrom, closeDateTo, leadSource, customFieldKey, customFieldValue, null, page, size);
    }

    public List<Map<String, Object>> search(
            DataScopeContext scope,
            Long stageId,
            String status,
            String keyword,
            Long ownerUserId,
            Long teamId,
            String closeDateFrom,
            String closeDateTo,
            String leadSource,
            String customFieldKey,
            String customFieldValue,
            Boolean stagnantOnly,
            int page,
            int size
    ) throws SQLException {
        StringBuilder sql = new StringBuilder("""
                SELECT
                    o.id,
                    o.name,
                    o.customer_id,
                    o.contact_id,
                    o.contact_name,
                    o.amount,
                    o.stage_id,
                    o.stage_updated_at,
                    o.probability,
                    o.probability_note,
                    o.expected_close_date,
                    o.actual_close_date,
                    o.lead_source,
                    o.status,
                    o.is_stagnant,
                    o.stagnant_flag,
                    o.stagnant_reason,
                    o.last_stagnant_checked_at,
                    o.win_reason_id,
                    o.loss_reason_id,
                    o.competitor_id,
                    o.lost_reason,
                    o.last_override_reason,
                    o.last_overridden_by,
                    o.last_overridden_at,
                    o.reopened_reason,
                    o.reopened_by,
                    o.reopened_at,
                    o.owner_user_id,
                    o.created_at,
                    c.name AS customer_name,
                    ps.name AS stage_name,
                    ps.order_no AS stage_order,
                    ps.stagnant_days,
                    u.full_name AS owner_name,
                    u.team_id,
                    t.name AS team_name,
                    comp.name AS competitor_name,
                    ct.name AS contact_person_name,
                    ct.phone AS contact_phone,
                    ct.email AS contact_email,
                    DATEDIFF(NOW(), o.stage_updated_at) AS days_in_stage,
                    DATEDIFF(NOW(), o.expected_close_date) AS days_overdue
                FROM opportunities o
                LEFT JOIN customers c ON c.id = o.customer_id
                LEFT JOIN contacts ct ON ct.id = o.contact_id
                LEFT JOIN pipeline_stages ps ON ps.id = o.stage_id
                LEFT JOIN users u ON u.id = o.owner_user_id
                LEFT JOIN teams t ON t.id = u.team_id
                LEFT JOIN competitors comp ON comp.id = o.competitor_id
                WHERE o.is_deleted = 0
                """);

        List<Object> params = new ArrayList<>();
        if (scope != null) {
            scope.appendOwnerPredicate("o.owner_user_id", sql, params);
        }

        if (ownerUserId != null && ownerUserId > 0) {
            sql.append(" AND o.owner_user_id = ?");
            params.add(ownerUserId);
        }

        if (teamId != null && teamId > 0) {
            sql.append(" AND u.team_id = ?");
            params.add(teamId);
        }

        if (Boolean.TRUE.equals(stagnantOnly)) {
            sql.append(" AND o.is_stagnant = 1");
        }

        if (closeDateFrom != null && !closeDateFrom.isBlank()) {
            sql.append(" AND o.expected_close_date >= ?");
            params.add(java.sql.Date.valueOf(closeDateFrom.trim()));
        }

        if (closeDateTo != null && !closeDateTo.isBlank()) {
            sql.append(" AND o.expected_close_date <= ?");
            params.add(java.sql.Date.valueOf(closeDateTo.trim()));
        }

        if (leadSource != null && !leadSource.isBlank()) {
            sql.append(" AND (o.lead_source = ? OR LOWER(o.lead_source) LIKE ?)");
            params.add(leadSource.trim());
            params.add("%" + leadSource.trim().toLowerCase() + "%");
        }

        if (stageId != null) {
            sql.append(" AND o.stage_id = ?");
            params.add(stageId);
        }

        if (status != null && !status.isBlank()) {
            sql.append(" AND o.status = ?");
            params.add(status.trim());
        }

        if (keyword != null && !keyword.isBlank()) {
            sql.append(" AND (LOWER(o.name) LIKE ? OR LOWER(o.contact_name) LIKE ? OR LOWER(c.name) LIKE ? OR LOWER(ct.name) LIKE ?)");
            String kw = "%" + keyword.trim().toLowerCase() + "%";
            params.add(kw);
            params.add(kw);
            params.add(kw);
            params.add(kw);
        }

        if (customFieldKey != null && !customFieldKey.isBlank()) {
            sql.append("""
                 AND EXISTS (
                    SELECT 1 FROM custom_field_values cfv
                    JOIN custom_fields cf ON cf.id = cfv.custom_field_id
                    WHERE cfv.record_id = o.id
                      AND cf.entity_type = 'OPPORTUNITY'
                      AND cf.field_key = ?
                """);
            params.add(customFieldKey.trim());
            if (customFieldValue != null && !customFieldValue.isBlank()) {
                sql.append(" AND LOWER(cfv.field_value) LIKE ?");
                params.add("%" + customFieldValue.trim().toLowerCase() + "%");
            }
            sql.append(")");
        }

        sql.append(" ORDER BY o.id DESC");
        if (size > 0) {
            sql.append(" LIMIT ? OFFSET ?");
            params.add(size);
            params.add((page - 1) * size);
        }

        List<Map<String, Object>> list = new ArrayList<>();
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql.toString())) {
            for (int i = 0; i < params.size(); i++) {
                stmt.setObject(i + 1, params.get(i));
            }
            try (ResultSet rs = stmt.executeQuery()) {
                while (rs.next()) {
                    list.add(mapOpportunity(rs));
                }
            }
        }
        return list;
    }

    public Map<String, Object> findById(long id) throws SQLException {
        String sql = """
                SELECT
                    o.id,
                    o.name,
                    o.customer_id,
                    o.contact_id,
                    o.contact_name,
                    o.amount,
                    o.stage_id,
                    o.stage_updated_at,
                    o.probability,
                    o.probability_note,
                    o.expected_close_date,
                    o.actual_close_date,
                    o.lead_source,
                    o.status,
                    o.is_stagnant,
                    o.stagnant_flag,
                    o.stagnant_reason,
                    o.last_stagnant_checked_at,
                    o.win_reason_id,
                    o.loss_reason_id,
                    o.competitor_id,
                    o.lost_reason,
                    o.last_override_reason,
                    o.last_overridden_by,
                    o.last_overridden_at,
                    o.reopened_reason,
                    o.reopened_by,
                    o.reopened_at,
                    o.owner_user_id,
                    o.created_at,
                    c.name AS customer_name,
                    ps.name AS stage_name,
                    ps.order_no AS stage_order,
                    ps.stagnant_days,
                    u.full_name AS owner_name,
                    u.team_id,
                    t.name AS team_name,
                    comp.name AS competitor_name,
                    ct.name AS contact_person_name,
                    ct.phone AS contact_phone,
                    ct.email AS contact_email,
                    DATEDIFF(NOW(), o.stage_updated_at) AS days_in_stage,
                    DATEDIFF(NOW(), o.expected_close_date) AS days_overdue
                FROM opportunities o
                LEFT JOIN customers c ON c.id = o.customer_id
                LEFT JOIN contacts ct ON ct.id = o.contact_id
                LEFT JOIN pipeline_stages ps ON ps.id = o.stage_id
                LEFT JOIN users u ON u.id = o.owner_user_id
                LEFT JOIN teams t ON t.id = u.team_id
                LEFT JOIN competitors comp ON comp.id = o.competitor_id
                WHERE o.id = ? AND o.is_deleted = 0
                """;

        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setLong(1, id);
            try (ResultSet rs = stmt.executeQuery()) {
                if (rs.next()) {
                    return mapOpportunity(rs);
                }
            }
        }
        return null;
    }

    public void closeDeal(long id, String status, Long winReasonId, Long lossReasonId, Long competitorId, String lostReason) throws SQLException {
        closeDeal(id, status, winReasonId, lossReasonId, competitorId, lostReason, null, null);
    }

    public void closeDeal(long id, String status, Long winReasonId, Long lossReasonId, Long competitorId, String lostReason, java.math.BigDecimal actualAmount, java.sql.Date actualCloseDate) throws SQLException {
        String sql = """
                UPDATE opportunities SET
                    status = ?,
                    win_reason_id = ?,
                    loss_reason_id = ?,
                    competitor_id = ?,
                    lost_reason = ?,
                    amount = COALESCE(?, amount),
                    actual_close_date = COALESCE(?, actual_close_date, CURDATE()),
                    is_stagnant = 0,
                    stagnant_flag = NULL,
                    stagnant_reason = NULL,
                    stage_updated_at = NOW()
                WHERE id = ? AND is_deleted = 0
                """;
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setString(1, status);
            stmt.setObject(2, winReasonId, Types.BIGINT);
            stmt.setObject(3, lossReasonId, Types.BIGINT);
            stmt.setObject(4, competitorId, Types.BIGINT);
            stmt.setString(5, lostReason);
            stmt.setBigDecimal(6, actualAmount);
            stmt.setDate(7, actualCloseDate);
            stmt.setLong(8, id);
            stmt.executeUpdate();
        }
    }

    public void reopenDeal(long id, String reopenReason, long reopenedBy) throws SQLException {
        String sql = """
                UPDATE opportunities SET
                    status = 'OPEN',
                    reopened_reason = ?,
                    reopened_by = ?,
                    reopened_at = NOW(),
                    stage_updated_at = NOW()
                WHERE id = ? AND is_deleted = 0
                """;
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setString(1, reopenReason);
            stmt.setLong(2, reopenedBy);
            stmt.setLong(3, id);
            stmt.executeUpdate();
        }
    }

    public int scanAndFlagStagnantOpportunities() throws SQLException {
        String query = """
                SELECT 
                    o.id,
                    o.expected_close_date,
                    o.stage_updated_at,
                    o.created_at,
                    COALESCE(ps.stagnant_days, 7) AS stagnant_days,
                    DATEDIFF(CURDATE(), o.expected_close_date) AS overdue_days,
                    DATEDIFF(CURDATE(), COALESCE(
                        (SELECT MAX(COALESCE(a.due_date, a.created_at)) 
                         FROM activities a 
                         WHERE (a.opportunity_id = o.id OR (a.opportunity_id IS NULL AND a.customer_id = o.customer_id))
                           AND a.is_deleted = 0),
                        o.stage_updated_at,
                        o.created_at
                    )) AS inactive_days
                FROM opportunities o
                LEFT JOIN pipeline_stages ps ON ps.id = o.stage_id
                WHERE o.status = 'OPEN' AND o.is_deleted = 0
                """;

        String updateSql = """
                UPDATE opportunities SET
                    is_stagnant = ?,
                    stagnant_flag = ?,
                    stagnant_reason = ?,
                    last_stagnant_checked_at = NOW()
                WHERE id = ?
                """;

        int flaggedCount = 0;
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement qStmt = conn.prepareStatement(query);
             ResultSet rs = qStmt.executeQuery();
             PreparedStatement uStmt = conn.prepareStatement(updateSql)) {

            while (rs.next()) {
                long oppId = rs.getLong("id");
                java.sql.Date expectedClose = rs.getDate("expected_close_date");
                int stagnantDaysThreshold = rs.getInt("stagnant_days");
                if (stagnantDaysThreshold <= 0) stagnantDaysThreshold = 7;

                int overdueDays = rs.getInt("overdue_days");
                boolean isOverdue = expectedClose != null && overdueDays > 0;

                int inactiveDays = rs.getInt("inactive_days");
                boolean isInactive = inactiveDays > stagnantDaysThreshold;

                boolean isStagnant = false;
                String flag = null;
                String reason = null;

                if (isOverdue && isInactive) {
                    isStagnant = true;
                    flag = "BOTH";
                    reason = "Không có hoạt động trong " + inactiveDays + " ngày (mốc: " + stagnantDaysThreshold + " ngày) & Quá hạn chốt " + overdueDays + " ngày";
                } else if (isInactive) {
                    isStagnant = true;
                    flag = "INACTIVE";
                    reason = "Không có hoạt động nào trong " + inactiveDays + " ngày (vượt mốc cho phép " + stagnantDaysThreshold + " ngày)";
                } else if (isOverdue) {
                    isStagnant = true;
                    flag = "OVERDUE";
                    reason = "Đã quá ngày dự kiến chốt " + overdueDays + " ngày (dự kiến: " + expectedClose + ")";
                }

                uStmt.setBoolean(1, isStagnant);
                uStmt.setString(2, flag);
                uStmt.setString(3, reason);
                uStmt.setLong(4, oppId);
                uStmt.addBatch();

                if (isStagnant) {
                    flaggedCount++;
                }
            }
            uStmt.executeBatch();
        }
        return flaggedCount;
    }

    public void softDelete(long id) throws SQLException {
        String sql = "UPDATE opportunities SET is_deleted = 1 WHERE id = ?";
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setLong(1, id);
            stmt.executeUpdate();
        }
    }

    private Map<String, Object> mapOpportunity(ResultSet rs) throws SQLException {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("id", rs.getLong("id"));
        map.put("name", rs.getString("name"));
        map.put("customerId", rs.getObject("customer_id"));
        map.put("customerName", rs.getString("customer_name"));
        map.put("contactId", rs.getObject("contact_id"));
        String contactName = rs.getString("contact_name");
        if ((contactName == null || contactName.isBlank()) && rs.getString("contact_person_name") != null) {
            contactName = rs.getString("contact_person_name");
        }
        map.put("contactName", contactName);
        map.put("contactPersonName", rs.getString("contact_person_name"));
        map.put("contactPhone", rs.getString("contact_phone"));
        map.put("contactEmail", rs.getString("contact_email"));
        map.put("amount", rs.getBigDecimal("amount"));
        map.put("stageId", rs.getObject("stage_id"));
        map.put("stageName", rs.getString("stage_name"));
        map.put("stageOrder", rs.getObject("stage_order"));
        map.put("stageStagnantDays", rs.getObject("stagnant_days") != null ? rs.getInt("stagnant_days") : 7);
        map.put("stageUpdatedAt", rs.getTimestamp("stage_updated_at"));
        map.put("daysInStage", rs.getObject("days_in_stage") != null ? rs.getInt("days_in_stage") : 0);
        map.put("daysOverdue", rs.getObject("days_overdue") != null ? rs.getInt("days_overdue") : 0);
        map.put("probability", rs.getObject("probability"));
        map.put("probabilityNote", rs.getString("probability_note"));
        map.put("expectedCloseDate", rs.getDate("expected_close_date"));
        map.put("actualCloseDate", rs.getDate("actual_close_date"));
        map.put("leadSource", rs.getString("lead_source"));
        map.put("status", rs.getString("status"));
        map.put("isStagnant", rs.getBoolean("is_stagnant"));
        map.put("stagnantFlag", rs.getString("stagnant_flag"));
        map.put("stagnantReason", rs.getString("stagnant_reason"));
        map.put("lastStagnantCheckedAt", rs.getTimestamp("last_stagnant_checked_at"));
        map.put("winReasonId", rs.getObject("win_reason_id"));
        map.put("lossReasonId", rs.getObject("loss_reason_id"));
        map.put("competitorId", rs.getObject("competitor_id"));
        map.put("competitorName", rs.getString("competitor_name"));
        map.put("lostReason", rs.getString("lost_reason"));
        map.put("lastOverrideReason", rs.getString("last_override_reason"));
        map.put("lastOverriddenBy", rs.getObject("last_overridden_by"));
        map.put("lastOverriddenAt", rs.getTimestamp("last_overridden_at"));
        map.put("reopenedReason", rs.getString("reopened_reason"));
        map.put("reopenedBy", rs.getObject("reopened_by"));
        map.put("reopenedAt", rs.getTimestamp("reopened_at"));
        map.put("ownerUserId", rs.getLong("owner_user_id"));
        map.put("ownerName", rs.getString("owner_name"));
        map.put("teamId", rs.getObject("team_id"));
        map.put("teamName", rs.getString("team_name"));
        map.put("createdAt", rs.getTimestamp("created_at"));
        return map;
    }

    public long create(OpportunityWriteRequest req, long defaultOwnerId) throws SQLException {
        String sql = """
                INSERT INTO opportunities (
                    name, customer_id, contact_id, contact_name, amount, stage_id,
                    stage_updated_at, probability, probability_note, expected_close_date,
                    lead_source, status, win_reason_id, loss_reason_id, competitor_id,
                    lost_reason, owner_user_id
                ) VALUES (?, ?, ?, ?, ?, ?, NOW(), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """;

        long ownerId = req.getOwnerUserId() != null ? req.getOwnerUserId() : defaultOwnerId;
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS)) {
            stmt.setString(1, req.getName());
            stmt.setObject(2, req.getCustomerId(), Types.BIGINT);
            stmt.setObject(3, req.getContactId(), Types.BIGINT);
            stmt.setString(4, req.getContactName());
            stmt.setBigDecimal(5, req.getAmount());
            stmt.setObject(6, req.getStageId(), Types.BIGINT);
            stmt.setObject(7, req.getProbability(), Types.INTEGER);
            stmt.setString(8, req.getProbabilityNote());
            stmt.setObject(9, req.getExpectedCloseDate() != null && !req.getExpectedCloseDate().isBlank() ? java.sql.Date.valueOf(req.getExpectedCloseDate()) : null, Types.DATE);
            stmt.setString(10, req.getLeadSource());
            String status = req.getStatus() != null && !req.getStatus().isBlank() ? req.getStatus() : "OPEN";
            stmt.setString(11, status);
            stmt.setObject(12, req.getWinReasonId(), Types.BIGINT);
            stmt.setObject(13, req.getLossReasonId(), Types.BIGINT);
            stmt.setObject(14, req.getCompetitorId(), Types.BIGINT);
            stmt.setString(15, req.getLostReason());
            stmt.setLong(16, ownerId);

            stmt.executeUpdate();
            try (ResultSet rs = stmt.getGeneratedKeys()) {
                if (rs.next()) {
                    return rs.getLong(1);
                }
            }
        }
        throw new SQLException("Không thể tạo cơ hội bán hàng");
    }

    public void update(long id, OpportunityWriteRequest req) throws SQLException {
        String sql = """
                UPDATE opportunities SET
                    name = ?, customer_id = ?, contact_id = ?, contact_name = ?, amount = ?, stage_id = ?,
                    probability = ?, probability_note = ?, expected_close_date = ?, lead_source = ?,
                    status = ?, win_reason_id = ?, loss_reason_id = ?, competitor_id = ?, lost_reason = ?
                WHERE id = ? AND is_deleted = 0
                """;

        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setString(1, req.getName());
            stmt.setObject(2, req.getCustomerId(), Types.BIGINT);
            stmt.setObject(3, req.getContactId(), Types.BIGINT);
            stmt.setString(4, req.getContactName());
            stmt.setBigDecimal(5, req.getAmount());
            stmt.setObject(6, req.getStageId(), Types.BIGINT);
            stmt.setObject(7, req.getProbability(), Types.INTEGER);
            stmt.setString(8, req.getProbabilityNote());
            stmt.setObject(9, req.getExpectedCloseDate() != null && !req.getExpectedCloseDate().isBlank() ? java.sql.Date.valueOf(req.getExpectedCloseDate()) : null, Types.DATE);
            stmt.setString(10, req.getLeadSource());
            String status = req.getStatus() != null && !req.getStatus().isBlank() ? req.getStatus() : "OPEN";
            stmt.setString(11, status);
            stmt.setObject(12, req.getWinReasonId(), Types.BIGINT);
            stmt.setObject(13, req.getLossReasonId(), Types.BIGINT);
            stmt.setObject(14, req.getCompetitorId(), Types.BIGINT);
            stmt.setString(15, req.getLostReason());
            stmt.setLong(16, id);

            stmt.executeUpdate();
        }
    }

    public void updateStage(long id, long targetStageId, int probability) throws SQLException {
        updateStage(id, targetStageId, probability, null, null);
    }

    public void updateStage(long id, long targetStageId, int probability, String overrideReason, Long overriddenBy) throws SQLException {
        String sql = """
                UPDATE opportunities 
                SET stage_id = ?, probability = ?, stage_updated_at = NOW(),
                    last_override_reason = COALESCE(?, last_override_reason),
                    last_overridden_by = COALESCE(?, last_overridden_by),
                    last_overridden_at = CASE WHEN ? IS NOT NULL THEN NOW() ELSE last_overridden_at END
                WHERE id = ? AND is_deleted = 0
                """;
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setLong(1, targetStageId);
            stmt.setInt(2, probability);
            stmt.setString(3, overrideReason);
            stmt.setObject(4, overriddenBy, Types.BIGINT);
            stmt.setString(5, overrideReason);
            stmt.setLong(6, id);
            stmt.executeUpdate();
        }
    }
}

