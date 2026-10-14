package com.crm.dao.routing;

import com.crm.config.DatabaseConfig;
import com.crm.dto.routing.LeadAssignmentLogDTO;
import com.crm.dto.routing.LeadAssignmentRuleDTO;
import com.crm.dto.routing.UnassignedLeadDTO;
import com.crm.util.JsonUtil;
import com.google.gson.reflect.TypeToken;

import java.lang.reflect.Type;
import java.sql.*;
import java.util.*;

public class LeadAssignmentDAO {

    private static final Type LONG_LIST_TYPE = new TypeToken<List<Long>>(){}.getType();

    public List<LeadAssignmentRuleDTO> getAllRules() {
        List<LeadAssignmentRuleDTO> list = new ArrayList<>();
        String sql = "SELECT r.id, r.name, r.priority, r.active, r.target_type, r.assignee_user_id, " +
                     "u.full_name AS assignee_user_name, r.assignee_team_id, t.name AS assignee_team_name, " +
                     "r.assignee_user_ids, r.last_assigned_user_id, " +
                     "r.condition_region_id, md_reg.name AS condition_region_name, " +
                     "r.condition_industry_id, md_ind.name AS condition_industry_name, " +
                     "r.condition_lead_source, " +
                     "r.condition_company_size_id, md_cs.name AS condition_company_size_name, " +
                     "r.condition_min_score, r.description, r.created_by, r.created_at, r.updated_at " +
                     "FROM lead_assignment_rules r " +
                     "LEFT JOIN users u ON r.assignee_user_id = u.id " +
                     "LEFT JOIN teams t ON r.assignee_team_id = t.id " +
                     "LEFT JOIN master_data md_reg ON r.condition_region_id = md_reg.id " +
                     "LEFT JOIN master_data md_ind ON r.condition_industry_id = md_ind.id " +
                     "LEFT JOIN master_data md_cs ON r.condition_company_size_id = md_cs.id " +
                     "ORDER BY r.priority ASC, r.id ASC";

        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql);
             ResultSet rs = ps.executeQuery()) {

            while (rs.next()) {
                LeadAssignmentRuleDTO dto = new LeadAssignmentRuleDTO();
                dto.setId(rs.getLong("id"));
                dto.setName(rs.getString("name"));
                dto.setPriority(rs.getInt("priority"));
                dto.setActive(rs.getBoolean("active"));
                dto.setTargetType(rs.getString("target_type"));
                dto.setAssigneeUserId((Long) rs.getObject("assignee_user_id"));
                dto.setAssigneeUserName(rs.getString("assignee_user_name"));
                dto.setAssigneeTeamId((Long) rs.getObject("assignee_team_id"));
                dto.setAssigneeTeamName(rs.getString("assignee_team_name"));

                String idsJson = rs.getString("assignee_user_ids");
                if (idsJson != null && !idsJson.isBlank()) {
                    try {
                        List<Long> userIds = JsonUtil.getGson().fromJson(idsJson, LONG_LIST_TYPE);
                        dto.setAssigneeUserIds(userIds);
                    } catch (Exception ignored) {}
                }

                dto.setLastAssignedUserId((Long) rs.getObject("last_assigned_user_id"));
                dto.setConditionRegionId((Long) rs.getObject("condition_region_id"));
                dto.setConditionRegionName(rs.getString("condition_region_name"));
                dto.setConditionIndustryId((Long) rs.getObject("condition_industry_id"));
                dto.setConditionIndustryName(rs.getString("condition_industry_name"));
                dto.setConditionLeadSource(rs.getString("condition_lead_source"));
                dto.setConditionCompanySizeId((Long) rs.getObject("condition_company_size_id"));
                dto.setConditionCompanySizeName(rs.getString("condition_company_size_name"));
                dto.setConditionMinScore((Integer) rs.getObject("condition_min_score"));
                dto.setDescription(rs.getString("description"));
                dto.setCreatedBy((Long) rs.getObject("created_by"));

                Timestamp cat = rs.getTimestamp("created_at");
                if (cat != null) dto.setCreatedAt(cat.toLocalDateTime());
                Timestamp uat = rs.getTimestamp("updated_at");
                if (uat != null) dto.setUpdatedAt(uat.toLocalDateTime());

                list.add(dto);
            }
        } catch (SQLException e) {
            throw new RuntimeException("Lỗi lấy danh sách quy tắc phân bổ: " + e.getMessage(), e);
        }
        return list;
    }

    public long saveRule(LeadAssignmentRuleDTO rule) {
        String sql = "INSERT INTO lead_assignment_rules (name, priority, active, target_type, assignee_user_id, " +
                     "assignee_team_id, assignee_user_ids, condition_region_id, condition_industry_id, " +
                     "condition_lead_source, condition_company_size_id, condition_min_score, description, created_by) " +
                     "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";

        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS)) {

            String userIdsJson = rule.getAssigneeUserIds() != null ? JsonUtil.getGson().toJson(rule.getAssigneeUserIds()) : null;

            ps.setString(1, rule.getName());
            ps.setInt(2, rule.getPriority());
            ps.setBoolean(3, rule.isActive());
            ps.setString(4, rule.getTargetType());
            ps.setObject(5, rule.getAssigneeUserId());
            ps.setObject(6, rule.getAssigneeTeamId());
            ps.setString(7, userIdsJson);
            ps.setObject(8, rule.getConditionRegionId());
            ps.setObject(9, rule.getConditionIndustryId());
            ps.setString(10, rule.getConditionLeadSource());
            ps.setObject(11, rule.getConditionCompanySizeId());
            ps.setObject(12, rule.getConditionMinScore());
            ps.setString(13, rule.getDescription());
            ps.setObject(14, rule.getCreatedBy());

            ps.executeUpdate();
            try (ResultSet rs = ps.getGeneratedKeys()) {
                if (rs.next()) return rs.getLong(1);
            }
        } catch (SQLException e) {
            throw new RuntimeException("Lỗi lưu quy tắc phân bổ: " + e.getMessage(), e);
        }
        return 0;
    }

    public void updateRule(LeadAssignmentRuleDTO rule) {
        String sql = "UPDATE lead_assignment_rules SET name = ?, priority = ?, active = ?, target_type = ?, " +
                     "assignee_user_id = ?, assignee_team_id = ?, assignee_user_ids = ?, condition_region_id = ?, " +
                     "condition_industry_id = ?, condition_lead_source = ?, condition_company_size_id = ?, " +
                     "condition_min_score = ?, description = ? WHERE id = ?";

        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {

            String userIdsJson = rule.getAssigneeUserIds() != null ? JsonUtil.getGson().toJson(rule.getAssigneeUserIds()) : null;

            ps.setString(1, rule.getName());
            ps.setInt(2, rule.getPriority());
            ps.setBoolean(3, rule.isActive());
            ps.setString(4, rule.getTargetType());
            ps.setObject(5, rule.getAssigneeUserId());
            ps.setObject(6, rule.getAssigneeTeamId());
            ps.setString(7, userIdsJson);
            ps.setObject(8, rule.getConditionRegionId());
            ps.setObject(9, rule.getConditionIndustryId());
            ps.setString(10, rule.getConditionLeadSource());
            ps.setObject(11, rule.getConditionCompanySizeId());
            ps.setObject(12, rule.getConditionMinScore());
            ps.setString(13, rule.getDescription());
            ps.setLong(14, rule.getId());

            ps.executeUpdate();
        } catch (SQLException e) {
            throw new RuntimeException("Lỗi cập nhật quy tắc phân bổ: " + e.getMessage(), e);
        }
    }

    public void updatePriorities(List<Long> ruleIdsInOrder) {
        String sql = "UPDATE lead_assignment_rules SET priority = ? WHERE id = ?";
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            for (int i = 0; i < ruleIdsInOrder.size(); i++) {
                ps.setInt(1, i + 1);
                ps.setLong(2, ruleIdsInOrder.get(i));
                ps.addBatch();
            }
            ps.executeBatch();
        } catch (SQLException e) {
            throw new RuntimeException("Lỗi cập nhật thứ tự ưu tiên quy tắc: " + e.getMessage(), e);
        }
    }

    public void deleteRule(long id) {
        String sql = "DELETE FROM lead_assignment_rules WHERE id = ?";
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setLong(1, id);
            ps.executeUpdate();
        } catch (SQLException e) {
            throw new RuntimeException("Lỗi xóa quy tắc phân bổ: " + e.getMessage(), e);
        }
    }

    /**
     * Thuật toán phân bổ Lead tự động theo các quy tắc ưu tiên (Priority-based: first match wins)
     * và xoay vòng Round-Robin công bằng trong nhóm nhân viên.
     */
    public boolean evaluateAndAssignLead(Connection externalConn, long leadId, Long manualByUserId) {
        String queryLead = "SELECT c.id, c.name, c.industry_id, c.company_size_id, c.region_id, c.lead_source, " +
                           "c.lead_score, c.owner_user_id, c.assignment_status " +
                           "FROM customers c WHERE c.id = ?";

        Connection conn = externalConn;
        boolean closeConn = false;
        try {
            if (conn == null || conn.isClosed()) {
                conn = DatabaseConfig.getConnection();
                closeConn = true;
            }

            Long industryId = null;
            Long companySizeId = null;
            Long regionId = null;
            String leadSource = null;
            int leadScore = 0;
            Long currentOwnerId = null;
            String currentStatus = null;

            try (PreparedStatement ps = conn.prepareStatement(queryLead)) {
                ps.setLong(1, leadId);
                try (ResultSet rs = ps.executeQuery()) {
                    if (rs.next()) {
                        Object indObj = rs.getObject("industry_id");
                        industryId = indObj instanceof Number n ? n.longValue() : null;

                        Object sizeObj = rs.getObject("company_size_id");
                        companySizeId = sizeObj instanceof Number n ? n.longValue() : null;

                        Object regObj = rs.getObject("region_id");
                        regionId = regObj instanceof Number n ? n.longValue() : null;

                        leadSource = rs.getString("lead_source");
                        leadScore = rs.getInt("lead_score");

                        Object ownerObj = rs.getObject("owner_user_id");
                        currentOwnerId = ownerObj instanceof Number n ? n.longValue() : null;

                        currentStatus = rs.getString("assignment_status");
                    } else {
                        return false;
                    }
                }
            }

            // Nếu lead đã có người phụ trách và không phải chạy lại bởi Trưởng nhóm, giữ nguyên
            if (currentOwnerId != null && manualByUserId == null && !"UNASSIGNED".equalsIgnoreCase(currentStatus)) {
                return false;
            }

            // Lấy các quy tắc phân bổ active xếp theo thứ tự ưu tiên (1 là cao nhất)
            List<LeadAssignmentRuleDTO> rules = getAllRules();
            LeadAssignmentRuleDTO matchedRule = null;

            for (LeadAssignmentRuleDTO r : rules) {
                if (!r.isActive()) continue;

                // 1. Kiểm tra điều kiện Khu vực
                if (r.getConditionRegionId() != null && !r.getConditionRegionId().equals(regionId)) {
                    continue;
                }

                // 2. Kiểm tra điều kiện Ngành nghề
                if (r.getConditionIndustryId() != null && !r.getConditionIndustryId().equals(industryId)) {
                    continue;
                }

                // 3. Kiểm tra điều kiện Nguồn lead
                if (r.getConditionLeadSource() != null && !r.getConditionLeadSource().isBlank()) {
                    if (leadSource == null || !leadSource.equalsIgnoreCase(r.getConditionLeadSource().trim())) {
                        continue;
                    }
                }

                // 4. Kiểm tra điều kiện Quy mô doanh nghiệp
                if (r.getConditionCompanySizeId() != null && !r.getConditionCompanySizeId().equals(companySizeId)) {
                    continue;
                }

                // 5. Kiểm tra điều kiện Điểm tối thiểu
                if (r.getConditionMinScore() != null && leadScore < r.getConditionMinScore()) {
                    continue;
                }

                // Quy tắc đầu tiên thỏa mãn tất cả điều kiện -> MATCHED!
                matchedRule = r;
                break;
            }

            // Nếu không khớp quy tắc nào: đưa vào Hàng chờ Unassigned
            if (matchedRule == null) {
                String setUnassignedSql = "UPDATE customers SET assignment_status = 'UNASSIGNED' WHERE id = ?";
                try (PreparedStatement ps = conn.prepareStatement(setUnassignedSql)) {
                    ps.setLong(1, leadId);
                    ps.executeUpdate();
                }
                return false;
            }

            // Xác định nhân viên nhận lead
            Long targetUserId = null;
            String method = "AUTO_RULE_DIRECT";

            if ("DIRECT_USER".equalsIgnoreCase(matchedRule.getTargetType())) {
                targetUserId = matchedRule.getAssigneeUserId();
                method = "AUTO_RULE_DIRECT";
            } else if ("ROUND_ROBIN".equalsIgnoreCase(matchedRule.getTargetType())) {
                List<Long> pool = matchedRule.getAssigneeUserIds();
                if (pool != null && !pool.isEmpty()) {
                    Long lastId = matchedRule.getLastAssignedUserId();
                    int nextIdx = 0;
                    if (lastId != null) {
                        int currentIdx = pool.indexOf(lastId);
                        if (currentIdx >= 0) {
                            nextIdx = (currentIdx + 1) % pool.size();
                        }
                    }
                    targetUserId = pool.get(nextIdx);
                    method = "AUTO_RULE_ROUND_ROBIN";

                    // Cập nhật last_assigned_user_id cho quy tắc để người sau nhận
                    String updateLastSql = "UPDATE lead_assignment_rules SET last_assigned_user_id = ? WHERE id = ?";
                    try (PreparedStatement ps = conn.prepareStatement(updateLastSql)) {
                        ps.setLong(1, targetUserId);
                        ps.setLong(2, matchedRule.getId());
                        ps.executeUpdate();
                    }
                }
            }

            if (targetUserId == null) {
                // Không có nhân viên hợp lệ trong pool, giữ unassigned
                String setUnassignedSql = "UPDATE customers SET assignment_status = 'UNASSIGNED' WHERE id = ?";
                try (PreparedStatement ps = conn.prepareStatement(setUnassignedSql)) {
                    ps.setLong(1, leadId);
                    ps.executeUpdate();
                }
                return false;
            }

            // Gán Lead cho Target User
            String updateLeadSql = "UPDATE customers SET owner_user_id = ?, assignment_status = 'ASSIGNED', " +
                                  "assigned_rule_id = ?, assigned_at = NOW(), sla_deadline = DATE_ADD(NOW(), INTERVAL 4 HOUR), sla_breached = 0 WHERE id = ?";
            try (PreparedStatement ps = conn.prepareStatement(updateLeadSql)) {
                ps.setLong(1, targetUserId);
                ps.setLong(2, matchedRule.getId());
                ps.setLong(3, leadId);
                ps.executeUpdate();
            }

            // Ghi Audit Log phân bổ
            String logSql = "INSERT INTO lead_assignment_logs (lead_id, rule_id, assigned_to_user_id, " +
                            "assigned_by_user_id, method, rule_name, notes) VALUES (?, ?, ?, ?, ?, ?, ?)";
            try (PreparedStatement ps = conn.prepareStatement(logSql)) {
                ps.setLong(1, leadId);
                ps.setLong(2, matchedRule.getId());
                ps.setLong(3, targetUserId);
                ps.setObject(4, manualByUserId);
                ps.setString(5, method);
                ps.setString(6, matchedRule.getName());
                ps.setString(7, "Phân bổ tự động qua quy tắc ưu tiên #" + matchedRule.getPriority());
                ps.executeUpdate();
            }

            return true;

        } catch (SQLException e) {
            throw new RuntimeException("Lỗi phân bổ Lead #" + leadId + ": " + e.getMessage(), e);
        } finally {
            if (closeConn && conn != null) {
                try { conn.close(); } catch (SQLException ignored) {}
            }
        }
    }

    /**
     * Trưởng nhóm hoặc Giám đốc phân bổ thủ công Lead từ Hàng chờ
     */
    public void manualAssignLead(long leadId, long targetUserId, long byUserId, String notes) {
        String updateSql = "UPDATE customers SET owner_user_id = ?, assignment_status = 'ASSIGNED', " +
                           "assigned_rule_id = NULL, assigned_at = NOW(), sla_deadline = DATE_ADD(NOW(), INTERVAL 4 HOUR), sla_breached = 0 WHERE id = ?";
        String logSql = "INSERT INTO lead_assignment_logs (lead_id, rule_id, assigned_to_user_id, " +
                        "assigned_by_user_id, method, rule_name, notes) VALUES (?, NULL, ?, ?, 'MANUAL_DISPATCH', 'Phân bổ thủ công từ hàng chờ', ?)";

        try (Connection conn = DatabaseConfig.getConnection()) {
            conn.setAutoCommit(false);
            try {
                try (PreparedStatement ps = conn.prepareStatement(updateSql)) {
                    ps.setLong(1, targetUserId);
                    ps.setLong(2, leadId);
                    ps.executeUpdate();
                }

                try (PreparedStatement ps = conn.prepareStatement(logSql)) {
                    ps.setLong(1, leadId);
                    ps.setLong(2, targetUserId);
                    ps.setLong(3, byUserId);
                    ps.setString(4, notes != null && !notes.isBlank() ? notes : "Trưởng nhóm phân bổ trực tiếp cho chuyên viên");
                    ps.executeUpdate();
                }

                conn.commit();
            } catch (SQLException e) {
                conn.rollback();
                throw e;
            }
        } catch (SQLException e) {
            throw new RuntimeException("Lỗi phân bổ thủ công Lead #" + leadId + ": " + e.getMessage(), e);
        }
    }

    /**
     * Danh sách Lead rơi vào hàng chờ chưa được phân bổ (Unassigned Leads)
     */
    public List<UnassignedLeadDTO> getUnassignedLeads() {
        List<UnassignedLeadDTO> list = new ArrayList<>();
        String sql = "SELECT c.id, c.name, c.phone, c.email, c.website, c.address, " +
                     "c.industry_id, md_ind.name AS industry_name, " +
                     "c.region_id, md_reg.name AS region_name, " +
                     "c.company_size_id, md_cs.name AS company_size_name, " +
                     "c.lead_source, c.lead_score, c.score_grade, c.assignment_status, c.created_at, " +
                     "th.label AS grade_label, th.color AS grade_color, th.icon AS grade_icon " +
                     "FROM customers c " +
                     "LEFT JOIN master_data md_ind ON c.industry_id = md_ind.id " +
                     "LEFT JOIN master_data md_reg ON c.region_id = md_reg.id " +
                     "LEFT JOIN master_data md_cs ON c.company_size_id = md_cs.id " +
                     "LEFT JOIN lead_score_thresholds th ON c.score_grade = th.grade " +
                     "WHERE (c.owner_user_id IS NULL OR c.assignment_status = 'UNASSIGNED') AND c.is_deleted = 0 " +
                     "ORDER BY c.lead_score DESC, c.id DESC";

        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql);
             ResultSet rs = ps.executeQuery()) {

            while (rs.next()) {
                UnassignedLeadDTO dto = new UnassignedLeadDTO();
                dto.setId(rs.getLong("id"));
                dto.setName(rs.getString("name"));
                dto.setPhone(rs.getString("phone"));
                dto.setEmail(rs.getString("email"));
                dto.setCompany(rs.getString("name"));
                dto.setIndustryId((Long) rs.getObject("industry_id"));
                dto.setIndustryName(rs.getString("industry_name"));
                dto.setRegionId((Long) rs.getObject("region_id"));
                dto.setRegionName(rs.getString("region_name"));
                dto.setCompanySizeId((Long) rs.getObject("company_size_id"));
                dto.setCompanySizeName(rs.getString("company_size_name"));
                dto.setLeadSource(rs.getString("lead_source"));
                dto.setLeadScore(rs.getInt("lead_score"));
                dto.setScoreGrade(rs.getString("score_grade"));
                dto.setScoreGradeLabel(rs.getString("grade_label") != null ? rs.getString("grade_label") : rs.getString("score_grade"));
                dto.setScoreGradeColor(rs.getString("grade_color") != null ? rs.getString("grade_color") : "#64748b");
                dto.setScoreGradeIcon(rs.getString("grade_icon") != null ? rs.getString("grade_icon") : "📋");
                dto.setAssignmentStatus(rs.getString("assignment_status"));

                Timestamp cat = rs.getTimestamp("created_at");
                if (cat != null) dto.setCreatedAt(cat.toLocalDateTime());

                list.add(dto);
            }
        } catch (SQLException e) {
            throw new RuntimeException("Lỗi lấy danh sách Lead chưa phân bổ: " + e.getMessage(), e);
        }
        return list;
    }

    /**
     * Nhật ký phân bổ Lead (Audit Logs)
     */
    public List<LeadAssignmentLogDTO> getAssignmentLogs(int limit) {
        List<LeadAssignmentLogDTO> list = new ArrayList<>();
        int safeLimit = limit > 0 ? limit : 50;
        String sql = "SELECT l.id, l.lead_id, c.name AS lead_name, l.rule_id, l.rule_name, " +
                     "l.assigned_to_user_id, u_to.full_name AS assigned_to_user_name, " +
                     "l.assigned_by_user_id, u_by.full_name AS assigned_by_user_name, " +
                     "l.method, l.notes, l.created_at " +
                     "FROM lead_assignment_logs l " +
                     "LEFT JOIN customers c ON l.lead_id = c.id " +
                     "LEFT JOIN users u_to ON l.assigned_to_user_id = u_to.id " +
                     "LEFT JOIN users u_by ON l.assigned_by_user_id = u_by.id " +
                     "ORDER BY l.id DESC LIMIT ?";

        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, safeLimit);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    LeadAssignmentLogDTO dto = new LeadAssignmentLogDTO();
                    dto.setId(rs.getLong("id"));
                    dto.setLeadId(rs.getLong("lead_id"));
                    dto.setLeadName(rs.getString("lead_name"));
                    dto.setRuleId((Long) rs.getObject("rule_id"));
                    dto.setRuleName(rs.getString("rule_name"));
                    dto.setAssignedToUserId(rs.getLong("assigned_to_user_id"));
                    dto.setAssignedToUserName(rs.getString("assigned_to_user_name"));
                    dto.setAssignedByUserId((Long) rs.getObject("assigned_by_user_id"));
                    dto.setAssignedByUserName(rs.getString("assigned_by_user_name"));
                    dto.setMethod(rs.getString("method"));
                    dto.setNotes(rs.getString("notes"));

                    Timestamp cat = rs.getTimestamp("created_at");
                    if (cat != null) dto.setCreatedAt(cat.toLocalDateTime());

                    list.add(dto);
                }
            }
        } catch (SQLException e) {
            throw new RuntimeException("Lỗi lấy nhật ký phân bổ: " + e.getMessage(), e);
        }
        return list;
    }

    /**
     * Chạy phân bổ nền tự động cho tất cả các lead đang ở hàng chờ Unassigned (SLA < 5 phút)
     */
    public int runBatchAutoAssignment() {
        String sql = "SELECT id FROM customers WHERE (owner_user_id IS NULL OR assignment_status = 'UNASSIGNED') AND is_deleted = 0";
        int assignedCount = 0;
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql);
             ResultSet rs = ps.executeQuery()) {

            List<Long> ids = new ArrayList<>();
            while (rs.next()) {
                ids.add(rs.getLong("id"));
            }

            for (Long leadId : ids) {
                boolean success = evaluateAndAssignLead(conn, leadId, null);
                if (success) {
                    assignedCount++;
                }
            }
        } catch (SQLException e) {
            throw new RuntimeException("Lỗi chạy phân bổ tự động hàng loạt: " + e.getMessage(), e);
        }
        return assignedCount;
    }
}
