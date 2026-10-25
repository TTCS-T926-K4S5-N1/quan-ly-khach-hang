package com.crm.dao.pipeline;

import com.crm.config.DatabaseConfig;
import com.crm.dto.pipeline.OpportunityWriteRequest;
import com.crm.service.permissions.DataScopeContext;
import com.crm.service.permissions.ScopeType;

import java.math.BigDecimal;
import java.sql.*;
import java.text.DecimalFormat;
import java.text.DecimalFormatSymbols;
import java.text.SimpleDateFormat;
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
        return search(scope, stageId, status, keyword, null, null, null, null, null, null, null, null, null, null, null, null, page, size);
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
        return search(scope, stageId, status, keyword, null, null, null, null, null, null, null, null, null, customFieldKey, customFieldValue, null, page, size);
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
        return search(scope, stageId, status, keyword, ownerUserId, teamId, closeDateFrom, closeDateTo, leadSource, null, null, null, null, customFieldKey, customFieldValue, null, page, size);
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
        return search(scope, stageId, status, keyword, ownerUserId, teamId, closeDateFrom, closeDateTo, leadSource, null, null, null, null, customFieldKey, customFieldValue, stagnantOnly, page, size);
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
            BigDecimal minAmount,
            BigDecimal maxAmount,
            Long productId,
            String productKeyword,
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
                    DATEDIFF(NOW(), o.expected_close_date) AS days_overdue,
                    (SELECT COALESCE(SUM(oi.quantity * COALESCE(p.cost_price, 0)), 0) FROM opportunity_items oi LEFT JOIN products p ON p.id = oi.product_id WHERE oi.opportunity_id = o.id) AS total_cost
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
            if (scope.scopeType() == ScopeType.ALL) {
                // Toàn quyền xem
            } else if (scope.allowedOwnerIds().isEmpty()) {
                sql.append(" AND EXISTS (SELECT 1 FROM opportunity_members om WHERE om.opportunity_id = o.id AND om.user_id = ?)");
                params.add(scope.currentUserId());
            } else {
                sql.append(" AND (o.owner_user_id IN (");
                int sIdx = 0;
                for (Long id : scope.allowedOwnerIds()) {
                    if (sIdx++ > 0) sql.append(',');
                    sql.append('?');
                    params.add(id);
                }
                sql.append(") OR EXISTS (SELECT 1 FROM opportunity_members om WHERE om.opportunity_id = o.id AND om.user_id = ?))");
                params.add(scope.currentUserId());
            }
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

        if (minAmount != null) {
            sql.append(" AND o.amount >= ?");
            params.add(minAmount);
        }

        if (maxAmount != null) {
            sql.append(" AND o.amount <= ?");
            params.add(maxAmount);
        }

        if (productId != null && productId > 0) {
            sql.append(" AND EXISTS (SELECT 1 FROM opportunity_items oi WHERE oi.opportunity_id = o.id AND oi.product_id = ?)");
            params.add(productId);
        }

        if (productKeyword != null && !productKeyword.isBlank()) {
            sql.append(" AND EXISTS (SELECT 1 FROM opportunity_items oi WHERE oi.opportunity_id = o.id AND LOWER(oi.product_name) LIKE ?)");
            params.add("%" + productKeyword.trim().toLowerCase() + "%");
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
                    DATEDIFF(NOW(), o.expected_close_date) AS days_overdue,
                    (SELECT COALESCE(SUM(oi.quantity * COALESCE(p.cost_price, 0)), 0) FROM opportunity_items oi LEFT JOIN products p ON p.id = oi.product_id WHERE oi.opportunity_id = o.id) AS total_cost
                FROM opportunities o
                LEFT JOIN customers c ON c.id = o.customer_id
                LEFT JOIN contacts ct ON ct.id = o.contact_id
                LEFT JOIN pipeline_stages ps ON ps.id = o.stage_id
                LEFT JOIN users u ON u.id = o.owner_user_id
                LEFT JOIN teams t ON t.id = u.team_id
                LEFT JOIN competitors comp ON comp.id = o.competitor_id
                WHERE o.id = ? AND o.is_deleted = 0
                """;

        Map<String, Object> opp = null;
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setLong(1, id);
            try (ResultSet rs = stmt.executeQuery()) {
                if (rs.next()) {
                    opp = mapOpportunity(rs);
                }
            }
        }
        if (opp != null) {
            List<Map<String, Object>> members = getMembers(id);
            opp.put("members", members);
            opp.put("memberCount", members.size());
        }
        return opp;
    }

    public long create(OpportunityWriteRequest req, long defaultOwnerId) throws SQLException {
        String sql = """
                INSERT INTO opportunities (
                    name, customer_id, contact_name, amount, stage_id, probability,
                    expected_close_date, status, win_reason_id, loss_reason_id, competitor_id,
                    lost_reason, owner_user_id
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """;

        long ownerId = req.getOwnerUserId() != null ? req.getOwnerUserId() : defaultOwnerId;
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS)) {
            stmt.setString(1, req.getName());
            stmt.setObject(2, req.getCustomerId(), Types.BIGINT);
            stmt.setString(3, req.getContactName());
            stmt.setBigDecimal(4, req.getAmount());
            stmt.setObject(5, req.getStageId(), Types.BIGINT);
            stmt.setObject(6, req.getProbability(), Types.INTEGER);
            stmt.setObject(7, req.getExpectedCloseDate() != null && !req.getExpectedCloseDate().isBlank() ? java.sql.Date.valueOf(req.getExpectedCloseDate()) : null, Types.DATE);
            stmt.setString(8, req.getStatus());
            stmt.setObject(9, req.getWinReasonId(), Types.BIGINT);
            stmt.setObject(10, req.getLossReasonId(), Types.BIGINT);
            stmt.setObject(11, req.getCompetitorId(), Types.BIGINT);
            stmt.setString(12, req.getLostReason());
            stmt.setLong(13, ownerId);

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
                    name = ?, customer_id = ?, contact_name = ?, amount = ?, stage_id = ?,
                    probability = ?, expected_close_date = ?, status = ?, win_reason_id = ?,
                    loss_reason_id = ?, competitor_id = ?, lost_reason = ?
                WHERE id = ? AND is_deleted = 0
                """;

        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setString(1, req.getName());
            stmt.setObject(2, req.getCustomerId(), Types.BIGINT);
            stmt.setString(3, req.getContactName());
            stmt.setBigDecimal(4, req.getAmount());
            stmt.setObject(5, req.getStageId(), Types.BIGINT);
            stmt.setObject(6, req.getProbability(), Types.INTEGER);
            stmt.setObject(7, req.getExpectedCloseDate() != null && !req.getExpectedCloseDate().isBlank() ? java.sql.Date.valueOf(req.getExpectedCloseDate()) : null, Types.DATE);
            stmt.setString(8, req.getStatus());
            stmt.setObject(9, req.getWinReasonId(), Types.BIGINT);
            stmt.setObject(10, req.getLossReasonId(), Types.BIGINT);
            stmt.setObject(11, req.getCompetitorId(), Types.BIGINT);
            stmt.setString(12, req.getLostReason());
            stmt.setLong(13, id);

            stmt.executeUpdate();
        }
    }

    public void updateStage(long id, long targetStageId, int probability) throws SQLException {
        updateStage(id, targetStageId, probability, null, null, false, null);
    }

    public void updateStage(
            long id,
            long targetStageId,
            int probability,
            Long fromStageId,
            Long currentUserId,
            boolean isOverridden,
            String overrideReason
    ) throws SQLException {
        boolean updatedWithOverride = false;
        if (isOverridden) {
            String sqlWithOverride = """
                    UPDATE opportunities SET
                        stage_id = ?, probability = ?,
                        last_stage_override_reason = ?,
                        last_stage_overridden_by = ?,
                        last_stage_overridden_at = CURRENT_TIMESTAMP
                    WHERE id = ? AND is_deleted = 0
                    """;
            try (Connection conn = DatabaseConfig.getConnection();
                 PreparedStatement stmt = conn.prepareStatement(sqlWithOverride)) {
                stmt.setLong(1, targetStageId);
                stmt.setInt(2, probability);
                stmt.setString(3, overrideReason);
                stmt.setObject(4, currentUserId, Types.BIGINT);
                stmt.setLong(5, id);
                stmt.executeUpdate();
                updatedWithOverride = true;
            } catch (SQLException ignored) {
                // Nếu cột chưa có trên DB, fallback xuống cập nhật chuẩn
            }
        }

        if (!updatedWithOverride) {
            String sql = "UPDATE opportunities SET stage_id = ?, probability = ? WHERE id = ? AND is_deleted = 0";
            try (Connection conn = DatabaseConfig.getConnection();
                 PreparedStatement stmt = conn.prepareStatement(sql)) {
                stmt.setLong(1, targetStageId);
                stmt.setInt(2, probability);
                stmt.setLong(3, id);
                stmt.executeUpdate();
            }
        }

        // Lưu vết lịch sử nếu bảng opportunity_stage_history tồn tại
        if (currentUserId != null) {
            String historySql = """
                    INSERT INTO opportunity_stage_history (
                        opportunity_id, from_stage_id, to_stage_id, is_overridden, override_reason, changed_by_user_id
                    ) VALUES (?, ?, ?, ?, ?, ?)
                    """;
            try (Connection conn = DatabaseConfig.getConnection();
                 PreparedStatement stmt = conn.prepareStatement(historySql)) {
                stmt.setLong(1, id);
                stmt.setObject(2, fromStageId, Types.BIGINT);
                stmt.setLong(3, targetStageId);
                stmt.setBoolean(4, isOverridden);
                stmt.setString(5, overrideReason);
                stmt.setLong(6, currentUserId);
                stmt.executeUpdate();
            } catch (SQLException ignored) {
                // Table might not exist yet in test env
            }
        }
    }

    public int countActivities(long opportunityId, Long customerId, String type) throws SQLException {
        StringBuilder sql = new StringBuilder("SELECT COUNT(*) FROM activities WHERE is_deleted = 0");
        List<Object> params = new ArrayList<>();

        if (opportunityId > 0 && customerId != null && customerId > 0) {
            sql.append(" AND (opportunity_id = ? OR customer_id = ?)");
            params.add(opportunityId);
            params.add(customerId);
        } else if (opportunityId > 0) {
            sql.append(" AND opportunity_id = ?");
            params.add(opportunityId);
        } else if (customerId != null && customerId > 0) {
            sql.append(" AND customer_id = ?");
            params.add(customerId);
        } else {
            return 0;
        }

        if (type != null && !type.isBlank()) {
            sql.append(" AND UPPER(type) = UPPER(?)");
            params.add(type.trim());
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

    public int countQuotes(long opportunityId) throws SQLException {
        String sql = "SELECT COUNT(*) FROM quotes WHERE opportunity_id = ?";
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setLong(1, opportunityId);
            try (ResultSet rs = stmt.executeQuery()) {
                if (rs.next()) {
                    return rs.getInt(1);
                }
            }
        } catch (SQLException ignored) {
            return 0;
        }
        return 0;
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

        try {
            recordFieldHistory(id, "STATUS", "Trạng thái", "Đang mở (OPEN)", "WON".equalsIgnoreCase(status) ? "Thành công (WON)" : "Thất bại (LOST)", 1L,
                    "WON".equalsIgnoreCase(status) ? ("Ký hợp đồng: " + formatMoney(actualAmount) + ", ngày chốt: " + actualCloseDate) : ("Lý do thua: " + (lostReason != null ? lostReason : "")));
        } catch (Exception ignored) {}
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

        try {
            recordFieldHistory(id, "STATUS", "Trạng thái", "Đã đóng", "Mở lại (OPEN)", reopenedBy, reopenReason);
        } catch (Exception ignored) {}
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
        java.math.BigDecimal amount = rs.getBigDecimal("amount");
        map.put("amount", amount);
        java.math.BigDecimal totalCost = java.math.BigDecimal.ZERO;
        try {
            java.math.BigDecimal tc = rs.getBigDecimal("total_cost");
            if (tc != null) totalCost = tc;
        } catch (Exception ignored) {}
        map.put("totalCost", totalCost);
        java.math.BigDecimal profitMargin = java.math.BigDecimal.ZERO;
        if (amount != null && amount.compareTo(java.math.BigDecimal.ZERO) > 0 && totalCost != null) {
            java.math.BigDecimal profit = amount.subtract(totalCost);
            profitMargin = profit.multiply(java.math.BigDecimal.valueOf(100)).divide(amount, 2, java.math.RoundingMode.HALF_UP);
        }
        map.put("profitMargin", profitMargin);
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
        update(id, req, null);
    }

    public void update(long id, OpportunityWriteRequest req, Long changedByUserId) throws SQLException {
        Map<String, Object> oldOpp = findById(id);

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

        if (oldOpp != null && changedByUserId != null) {
            try {
                // 1. Amount
                BigDecimal oldAmt = (BigDecimal) oldOpp.get("amount");
                BigDecimal newAmt = req.getAmount();
                if (newAmt != null && (oldAmt == null || oldAmt.compareTo(newAmt) != 0)) {
                    recordFieldHistory(id, "AMOUNT", "Giá trị cơ hội", formatMoney(oldAmt), formatMoney(newAmt), changedByUserId, "Cập nhật thông tin cơ hội");
                }

                // 2. Expected close date
                Object oldDateObj = oldOpp.get("expectedCloseDate");
                String oldDateStr = oldDateObj != null ? oldDateObj.toString() : null;
                String newDateStr = req.getExpectedCloseDate() != null && !req.getExpectedCloseDate().isBlank() ? req.getExpectedCloseDate().trim() : null;
                if (newDateStr != null && !Objects.equals(oldDateStr, newDateStr)) {
                    recordFieldHistory(id, "EXPECTED_CLOSE_DATE", "Ngày dự kiến chốt", formatDate(oldDateObj), formatDate(newDateStr), changedByUserId, "Điều chỉnh thời hạn chốt");
                }

                // 3. Stage
                Long oldStageId = oldOpp.get("stageId") != null ? ((Number) oldOpp.get("stageId")).longValue() : null;
                Long newStageId = req.getStageId();
                if (newStageId != null && !Objects.equals(oldStageId, newStageId)) {
                    String oldStageName = (String) oldOpp.get("stageName");
                    String newStageName = getStageName(newStageId);
                    recordFieldHistory(id, "STAGE", "Giai đoạn", oldStageName, newStageName, changedByUserId, "Chuyển giai đoạn cơ hội");
                }
            } catch (Exception ignored) {}
        }
    }

    public void updateStage(long id, long targetStageId, int probability) throws SQLException {
        updateStage(id, targetStageId, probability, null, null);
    }

    public void updateStage(long id, long targetStageId, int probability, String overrideReason, Long overriddenBy) throws SQLException {
        Map<String, Object> oldOpp = findById(id);
        String oldStageName = oldOpp != null ? (String) oldOpp.get("stageName") : "Giai đoạn trước";
        String newStageName = getStageName(targetStageId);

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

        Long actorId = overriddenBy != null ? overriddenBy : 1L;
        try {
            recordFieldHistory(id, "STAGE", "Giai đoạn", oldStageName, newStageName, actorId, overrideReason != null && !overrideReason.isBlank() ? "Ghi đè: " + overrideReason : "Chuyển giai đoạn quy trình");
        } catch (Exception ignored) {}
    }

    public int reassign(long oppId, long toUserId, long assignedByUserId, String reason, String notes) throws SQLException {
        String oppQuery = "SELECT id, name, customer_id, owner_user_id FROM opportunities WHERE id = ? AND is_deleted = 0";
        String userQuery = "SELECT id, full_name, email FROM users WHERE id = ?";
        String updateOppSql = "UPDATE opportunities SET owner_user_id = ?, updated_at = NOW() WHERE id = ?";
        String insertLogSql = "INSERT INTO opportunity_assignment_logs (opportunity_id, from_user_id, to_user_id, assigned_by_user_id, reason, notes, created_at) VALUES (?, ?, ?, ?, ?, ?, NOW())";
        String insertActivitySql = "INSERT INTO activities (subject, type, description, status, due_date, customer_id, opportunity_id, owner_user_id, created_at, updated_at) VALUES (?, 'NOTE', ?, 'COMPLETED', NOW(), ?, ?, ?, NOW(), NOW())";

        try (Connection conn = DatabaseConfig.getConnection()) {
            conn.setAutoCommit(false);
            try {
                // 1. Lấy thông tin cơ hội
                long customerId = 0;
                Long fromUserId = null;
                String oppName = "Cơ hội #" + oppId;
                try (PreparedStatement stmt = conn.prepareStatement(oppQuery)) {
                    stmt.setLong(1, oppId);
                    try (ResultSet rs = stmt.executeQuery()) {
                        if (!rs.next()) {
                            throw new IllegalArgumentException("Không tìm thấy cơ hội #" + oppId);
                        }
                        oppName = rs.getString("name");
                        customerId = rs.getLong("customer_id");
                        fromUserId = rs.getObject("owner_user_id") != null ? rs.getLong("owner_user_id") : null;
                    }
                }

                // 2. Lấy thông tin người nhận
                String toUserName = "Nhân viên #" + toUserId;
                try (PreparedStatement stmt = conn.prepareStatement(userQuery)) {
                    stmt.setLong(1, toUserId);
                    try (ResultSet rs = stmt.executeQuery()) {
                        if (rs.next()) {
                            toUserName = rs.getString("full_name");
                        }
                    }
                }

                // 3. Lấy thông tin người cũ & người thực hiện
                String fromUserName = "Chưa gán";
                if (fromUserId != null) {
                    try (PreparedStatement stmt = conn.prepareStatement(userQuery)) {
                        stmt.setLong(1, fromUserId);
                        try (ResultSet rs = stmt.executeQuery()) {
                            if (rs.next()) fromUserName = rs.getString("full_name");
                        }
                    }
                }

                String assignedByName = "Quản lý";
                try (PreparedStatement stmt = conn.prepareStatement(userQuery)) {
                    stmt.setLong(1, assignedByUserId);
                    try (ResultSet rs = stmt.executeQuery()) {
                        if (rs.next()) assignedByName = rs.getString("full_name");
                    }
                }

                // 4. Cập nhật chủ sở hữu mới trong bảng opportunities
                try (PreparedStatement stmt = conn.prepareStatement(updateOppSql)) {
                    stmt.setLong(1, toUserId);
                    stmt.setLong(2, oppId);
                    stmt.executeUpdate();
                }

                // 5. Ghi nhật ký phân bổ vào opportunity_assignment_logs
                try (PreparedStatement stmt = conn.prepareStatement(insertLogSql)) {
                    stmt.setLong(1, oppId);
                    stmt.setObject(2, fromUserId, Types.BIGINT);
                    stmt.setLong(3, toUserId);
                    stmt.setLong(4, assignedByUserId);
                    stmt.setString(5, reason);
                    stmt.setString(6, notes);
                    stmt.executeUpdate();
                }

                // 5b. Ghi nhật ký vào opportunity_field_history
                try {
                    recordFieldHistory(conn, oppId, "OWNER", "Người sở hữu", fromUserName, toUserName, assignedByUserId, reason);
                } catch (Exception ignored) {}

                // 6. Ghi hoạt động vào bảng activities để hiển thị dòng thời gian cơ hội
                try (PreparedStatement stmt = conn.prepareStatement(insertActivitySql)) {
                    stmt.setString(1, "🔄 Bàn giao cơ hội: " + oppName);
                    String desc = "Chuyển quyền sở hữu từ [" + fromUserName + "] sang [" + toUserName + "].\n"
                            + "Lý do: " + reason + (notes != null && !notes.isBlank() ? "\nGhi chú: " + notes : "")
                            + "\nNgười thực hiện: " + assignedByName;
                    stmt.setString(2, desc);
                    stmt.setObject(3, customerId > 0 ? customerId : null, Types.BIGINT);
                    stmt.setLong(4, oppId);
                    stmt.setLong(5, toUserId);
                    stmt.executeUpdate();
                }

                // 7. Ghi audit log
                try {
                    com.crm.dao.audit.AuditLogDAO auditLogDAO = new com.crm.dao.audit.AuditLogDAO();
                    auditLogDAO.insert(assignedByUserId, "OPPORTUNITY", String.valueOf(oppId), "REASSIGN",
                            "Chuyển cơ hội '" + oppName + "' từ " + fromUserName + " sang " + toUserName + ". Lý do: " + reason,
                            String.valueOf(fromUserId), String.valueOf(toUserId));
                } catch (Exception ignored) {}

                conn.commit();
                return 1;
            } catch (Exception e) {
                conn.rollback();
                if (e instanceof SQLException) throw (SQLException) e;
                if (e instanceof RuntimeException) throw (RuntimeException) e;
                throw new SQLException(e);
            } finally {
                conn.setAutoCommit(true);
            }
        }
    }

    public int bulkReassign(List<Long> oppIds, long toUserId, long assignedByUserId, String reason, String notes) throws SQLException {
        int count = 0;
        for (Long oppId : oppIds) {
            count += reassign(oppId, toUserId, assignedByUserId, reason, notes);
        }
        return count;
    }

    public List<Map<String, Object>> getAssignmentHistory(long oppId) throws SQLException {
        String sql = """
                SELECT 
                    l.id,
                    l.opportunity_id,
                    l.from_user_id,
                    COALESCE(u_from.full_name, 'Chưa gán') AS from_user_name,
                    l.to_user_id,
                    u_to.full_name AS to_user_name,
                    l.assigned_by_user_id,
                    u_by.full_name AS assigned_by_name,
                    l.reason,
                    l.notes,
                    l.created_at
                FROM opportunity_assignment_logs l
                LEFT JOIN users u_from ON u_from.id = l.from_user_id
                JOIN users u_to ON u_to.id = l.to_user_id
                JOIN users u_by ON u_by.id = l.assigned_by_user_id
                WHERE l.opportunity_id = ?
                ORDER BY l.created_at DESC, l.id DESC
                """;
        List<Map<String, Object>> list = new ArrayList<>();
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setLong(1, oppId);
            try (ResultSet rs = stmt.executeQuery()) {
                while (rs.next()) {
                    Map<String, Object> map = new LinkedHashMap<>();
                    map.put("id", rs.getLong("id"));
                    map.put("opportunityId", rs.getLong("opportunity_id"));
                    map.put("fromUserId", rs.getObject("from_user_id"));
                    map.put("fromUserName", rs.getString("from_user_name"));
                    map.put("toUserId", rs.getLong("to_user_id"));
                    map.put("toUserName", rs.getString("to_user_name"));
                    map.put("assignedByUserId", rs.getLong("assigned_by_user_id"));
                    map.put("assignedByName", rs.getString("assigned_by_name"));
                    map.put("reason", rs.getString("reason"));
                    map.put("notes", rs.getString("notes"));
                    map.put("createdAt", rs.getTimestamp("created_at"));
                    list.add(map);
                }
            }
        }
        return list;
    }

    public List<Map<String, Object>> getAssignableUsers(Long teamId, boolean allUsers) throws SQLException {
        String sql;
        if (allUsers || teamId == null) {
            sql = """
                    SELECT u.id, u.full_name, u.email, u.team_id, t.name AS team_name, r.code AS role_code, r.name AS role_name
                    FROM users u
                    LEFT JOIN teams t ON t.id = u.team_id
                    LEFT JOIN user_roles ur ON ur.user_id = u.id
                    LEFT JOIN roles r ON r.id = ur.role_id
                    WHERE u.status = 'ACTIVE'
                    ORDER BY t.name, u.full_name
                    """;
        } else {
            sql = """
                    WITH RECURSIVE descendant_teams(id) AS (
                        SELECT id FROM teams WHERE id = ? AND active = TRUE
                        UNION DISTINCT
                        SELECT child.id FROM teams child
                        JOIN descendant_teams parent ON child.parent_id = parent.id
                        WHERE child.active = TRUE
                    )
                    SELECT u.id, u.full_name, u.email, u.team_id, t.name AS team_name, r.code AS role_code, r.name AS role_name
                    FROM users u
                    JOIN descendant_teams dt ON dt.id = u.team_id
                    LEFT JOIN teams t ON t.id = u.team_id
                    LEFT JOIN user_roles ur ON ur.user_id = u.id
                    LEFT JOIN roles r ON r.id = ur.role_id
                    WHERE u.status = 'ACTIVE'
                    ORDER BY t.name, u.full_name
                    """;
        }

        List<Map<String, Object>> list = new ArrayList<>();
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            if (!allUsers && teamId != null) {
                stmt.setLong(1, teamId);
            }
            try (ResultSet rs = stmt.executeQuery()) {
                while (rs.next()) {
                    Map<String, Object> map = new LinkedHashMap<>();
                    map.put("id", rs.getLong("id"));
                    map.put("fullName", rs.getString("full_name"));
                    map.put("email", rs.getString("email"));
                    map.put("teamId", rs.getObject("team_id"));
                    map.put("teamName", rs.getString("team_name"));
                    map.put("roleCode", rs.getString("role_code"));
                    map.put("roleName", rs.getString("role_name"));
                    list.add(map);
                }
            }
        }
        return list;
    }

    public String getStageName(long stageId) {
        String sql = "SELECT name FROM pipeline_stages WHERE id = ?";
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setLong(1, stageId);
            try (ResultSet rs = stmt.executeQuery()) {
                if (rs.next()) return rs.getString("name");
            }
        } catch (Exception ignored) {}
        return "Giai đoạn #" + stageId;
    }

    public String formatMoney(BigDecimal amount) {
        if (amount == null) return "0 ₫";
        DecimalFormatSymbols symbols = new DecimalFormatSymbols(new Locale("vi", "VN"));
        symbols.setGroupingSeparator(',');
        DecimalFormat df = new DecimalFormat("#,##0 ₫", symbols);
        return df.format(amount);
    }

    public String formatDate(Object dateObj) {
        if (dateObj == null) return "Chưa đặt";
        if (dateObj instanceof java.sql.Date d) {
            return new SimpleDateFormat("dd/MM/yyyy").format(d);
        }
        return String.valueOf(dateObj);
    }

    public void recordFieldHistory(long oppId, String fieldName, String fieldLabel, String oldValue, String newValue, long changedByUserId, String reason) throws SQLException {
        try (Connection conn = DatabaseConfig.getConnection()) {
            recordFieldHistory(conn, oppId, fieldName, fieldLabel, oldValue, newValue, changedByUserId, reason);
        }
    }

    public void recordFieldHistory(Connection conn, long oppId, String fieldName, String fieldLabel, String oldValue, String newValue, long changedByUserId, String reason) throws SQLException {
        if (Objects.equals(oldValue, newValue)) return;
        String sql = """
                INSERT INTO opportunity_field_history (opportunity_id, field_name, field_label, old_value, new_value, changed_by_user_id, reason, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
                """;
        try (PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setLong(1, oppId);
            stmt.setString(2, fieldName);
            stmt.setString(3, fieldLabel);
            stmt.setString(4, oldValue);
            stmt.setString(5, newValue);
            stmt.setLong(6, changedByUserId);
            stmt.setString(7, reason);
            stmt.executeUpdate();
        }
    }

    public List<Map<String, Object>> getFieldHistory(long oppId) throws SQLException {
        String sql = """
                SELECT 
                    h.id,
                    h.opportunity_id,
                    h.field_name,
                    h.field_label,
                    h.old_value,
                    h.new_value,
                    h.changed_by_user_id,
                    COALESCE(u.full_name, 'Hệ thống') AS changed_by_name,
                    h.reason,
                    h.created_at
                FROM opportunity_field_history h
                LEFT JOIN users u ON u.id = h.changed_by_user_id
                WHERE h.opportunity_id = ?
                ORDER BY h.created_at DESC, h.id DESC
                """;
        List<Map<String, Object>> list = new ArrayList<>();
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setLong(1, oppId);
            try (ResultSet rs = stmt.executeQuery()) {
                while (rs.next()) {
                    Map<String, Object> map = new LinkedHashMap<>();
                    map.put("id", rs.getLong("id"));
                    map.put("opportunityId", rs.getLong("opportunity_id"));
                    map.put("fieldName", rs.getString("field_name"));
                    map.put("fieldLabel", rs.getString("field_label"));
                    map.put("oldValue", rs.getString("old_value"));
                    map.put("newValue", rs.getString("new_value"));
                    map.put("changedByUserId", rs.getLong("changed_by_user_id"));
                    map.put("changedByName", rs.getString("changed_by_name"));
                    map.put("reason", rs.getString("reason"));
                    map.put("createdAt", rs.getTimestamp("created_at"));
                    list.add(map);
                }
            }
        }
        return list;
    }

    public List<Map<String, Object>> getMembers(long oppId) throws SQLException {
        String sql = """
                SELECT 
                    m.id,
                    m.opportunity_id,
                    m.user_id,
                    u.full_name AS user_name,
                    u.email AS user_email,
                    t.name AS team_name,
                    m.role_in_opportunity,
                    m.can_log_activity,
                    m.can_change_owner,
                    m.added_by_user_id,
                    COALESCE(u_by.full_name, 'Quản trị viên') AS added_by_name,
                    m.created_at
                FROM opportunity_members m
                JOIN users u ON u.id = m.user_id
                LEFT JOIN teams t ON t.id = u.team_id
                LEFT JOIN users u_by ON u_by.id = m.added_by_user_id
                WHERE m.opportunity_id = ?
                ORDER BY m.created_at ASC, m.id ASC
                """;
        List<Map<String, Object>> list = new ArrayList<>();
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setLong(1, oppId);
            try (ResultSet rs = stmt.executeQuery()) {
                while (rs.next()) {
                    Map<String, Object> map = new LinkedHashMap<>();
                    map.put("id", rs.getLong("id"));
                    map.put("opportunityId", rs.getLong("opportunity_id"));
                    map.put("userId", rs.getLong("user_id"));
                    map.put("userName", rs.getString("user_name"));
                    map.put("userEmail", rs.getString("user_email"));
                    map.put("teamName", rs.getString("team_name"));
                    map.put("roleInOpportunity", rs.getString("role_in_opportunity"));
                    map.put("canLogActivity", rs.getInt("can_log_activity") == 1);
                    map.put("canChangeOwner", rs.getInt("can_change_owner") == 1);
                    map.put("addedByUserId", rs.getLong("added_by_user_id"));
                    map.put("addedByName", rs.getString("added_by_name"));
                    map.put("createdAt", rs.getTimestamp("created_at"));
                    list.add(map);
                }
            }
        }
        return list;
    }

    public boolean isMember(long oppId, long userId) throws SQLException {
        String sql = "SELECT 1 FROM opportunity_members WHERE opportunity_id = ? AND user_id = ?";
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setLong(1, oppId);
            stmt.setLong(2, userId);
            try (ResultSet rs = stmt.executeQuery()) {
                return rs.next();
            }
        }
    }

    public void addMember(long oppId, long userId, String roleInOpportunity, long addedByUserId) throws SQLException {
        String sql = """
                INSERT INTO opportunity_members (opportunity_id, user_id, role_in_opportunity, can_log_activity, can_change_owner, added_by_user_id, created_at)
                VALUES (?, ?, ?, 1, 0, ?, NOW())
                ON DUPLICATE KEY UPDATE role_in_opportunity = VALUES(role_in_opportunity)
                """;
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setLong(1, oppId);
            stmt.setLong(2, userId);
            stmt.setString(3, roleInOpportunity != null && !roleInOpportunity.isBlank() ? roleInOpportunity.trim() : "Thành viên tham gia");
            stmt.setLong(4, addedByUserId);
            stmt.executeUpdate();
        }
    }

    public boolean removeMember(long oppId, long userId) throws SQLException {
        String sql = "DELETE FROM opportunity_members WHERE opportunity_id = ? AND user_id = ?";
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setLong(1, oppId);
            stmt.setLong(2, userId);
            return stmt.executeUpdate() > 0;
        }
    }
}

