package com.crm.dao.routing;

import com.crm.config.DatabaseConfig;
import com.crm.dto.routing.LeadScoringRuleDTO;
import com.crm.dto.routing.ScoreThresholdDTO;
import com.crm.util.JsonUtil;

import java.sql.*;
import java.util.*;

public class LeadScoringDAO {

    public List<LeadScoringRuleDTO> getAllRules() {
        List<LeadScoringRuleDTO> list = new ArrayList<>();
        String sql = "SELECT id, category, criterion_key, criterion_name, score, active, created_at, updated_at " +
                     "FROM lead_scoring_rules ORDER BY category, score DESC, id ASC";

        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql);
             ResultSet rs = ps.executeQuery()) {

            while (rs.next()) {
                LeadScoringRuleDTO dto = new LeadScoringRuleDTO();
                dto.setId(rs.getLong("id"));
                dto.setCategory(rs.getString("category"));
                dto.setCriterionKey(rs.getString("criterion_key"));
                dto.setCriterionName(rs.getString("criterion_name"));
                dto.setScore(rs.getInt("score"));
                dto.setActive(rs.getBoolean("active"));
                Timestamp cat = rs.getTimestamp("created_at");
                if (cat != null) dto.setCreatedAt(cat.toLocalDateTime());
                Timestamp uat = rs.getTimestamp("updated_at");
                if (uat != null) dto.setUpdatedAt(uat.toLocalDateTime());
                list.add(dto);
            }
        } catch (SQLException e) {
            throw new RuntimeException("Lỗi lấy danh sách tiêu chí chấm điểm: " + e.getMessage(), e);
        }
        return list;
    }

    public List<ScoreThresholdDTO> getThresholds() {
        List<ScoreThresholdDTO> list = new ArrayList<>();
        String sql = "SELECT id, grade, min_score, label, color, icon, description FROM lead_score_thresholds ORDER BY min_score DESC";

        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql);
             ResultSet rs = ps.executeQuery()) {

            while (rs.next()) {
                ScoreThresholdDTO dto = new ScoreThresholdDTO();
                dto.setId(rs.getLong("id"));
                dto.setGrade(rs.getString("grade"));
                dto.setMinScore(rs.getInt("min_score"));
                dto.setLabel(rs.getString("label"));
                dto.setColor(rs.getString("color"));
                dto.setIcon(rs.getString("icon"));
                dto.setDescription(rs.getString("description"));
                list.add(dto);
            }
        } catch (SQLException e) {
            throw new RuntimeException("Lỗi lấy danh sách ngưỡng điểm: " + e.getMessage(), e);
        }
        return list;
    }

    public void updateThreshold(String grade, int minScore, String label, String color, String icon, String description) {
        String sql = "UPDATE lead_score_thresholds SET min_score = ?, label = ?, color = ?, icon = ?, description = ? WHERE grade = ?";
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, minScore);
            ps.setString(2, label);
            ps.setString(3, color);
            ps.setString(4, icon);
            ps.setString(5, description);
            ps.setString(6, grade);
            ps.executeUpdate();
        } catch (SQLException e) {
            throw new RuntimeException("Lỗi cập nhật ngưỡng điểm: " + e.getMessage(), e);
        }
    }

    public long saveRule(LeadScoringRuleDTO rule) {
        String sql = "INSERT INTO lead_scoring_rules (category, criterion_key, criterion_name, score, active) VALUES (?, ?, ?, ?, ?)";
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS)) {
            ps.setString(1, rule.getCategory());
            ps.setString(2, rule.getCriterionKey());
            ps.setString(3, rule.getCriterionName());
            ps.setInt(4, rule.getScore());
            ps.setBoolean(5, rule.isActive());
            ps.executeUpdate();

            try (ResultSet rs = ps.getGeneratedKeys()) {
                if (rs.next()) return rs.getLong(1);
            }
        } catch (SQLException e) {
            throw new RuntimeException("Lỗi thêm tiêu chí chấm điểm: " + e.getMessage(), e);
        }
        return 0;
    }

    public void updateRule(LeadScoringRuleDTO rule) {
        String sql = "UPDATE lead_scoring_rules SET category = ?, criterion_key = ?, criterion_name = ?, score = ?, active = ? WHERE id = ?";
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, rule.getCategory());
            ps.setString(2, rule.getCriterionKey());
            ps.setString(3, rule.getCriterionName());
            ps.setInt(4, rule.getScore());
            ps.setBoolean(5, rule.isActive());
            ps.setLong(6, rule.getId());
            ps.executeUpdate();
        } catch (SQLException e) {
            throw new RuntimeException("Lỗi cập nhật tiêu chí chấm điểm: " + e.getMessage(), e);
        }
    }

    public void deleteRule(long id) {
        String sql = "DELETE FROM lead_scoring_rules WHERE id = ?";
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setLong(1, id);
            ps.executeUpdate();
        } catch (SQLException e) {
            throw new RuntimeException("Lỗi xóa tiêu chí chấm điểm: " + e.getMessage(), e);
        }
    }

    /**
     * Tự động chấm điểm cho một Lead cụ thể theo các tiêu chí đã khai báo trong DB.
     */
    public Map<String, Object> evaluateAndSaveLeadScore(Connection externalConn, long leadId) {
        String queryLead = "SELECT c.id, c.name, c.industry_id, c.company_size_id, c.region_id, c.lead_source, " +
                           "c.lead_source_id, c.address, c.website " +
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
                    } else {
                        return Collections.emptyMap();
                    }
                }
            }

            // Lấy tất cả active rules
            List<LeadScoringRuleDTO> rules = new ArrayList<>();
            String sqlRules = "SELECT id, category, criterion_key, criterion_name, score FROM lead_scoring_rules WHERE active = TRUE";
            try (PreparedStatement ps = conn.prepareStatement(sqlRules);
                 ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    LeadScoringRuleDTO r = new LeadScoringRuleDTO();
                    r.setId(rs.getLong("id"));
                    r.setCategory(rs.getString("category"));
                    r.setCriterionKey(rs.getString("criterion_key"));
                    r.setCriterionName(rs.getString("criterion_name"));
                    r.setScore(rs.getInt("score"));
                    rules.add(r);
                }
            }

            int totalScore = 0;
            Map<String, Integer> breakdown = new LinkedHashMap<>();

            for (LeadScoringRuleDTO r : rules) {
                boolean matched = false;
                switch (r.getCategory()) {
                    case "INDUSTRY":
                        if (industryId != null && String.valueOf(industryId).equals(r.getCriterionKey())) {
                            matched = true;
                        }
                        break;
                    case "COMPANY_SIZE":
                        if (companySizeId != null && String.valueOf(companySizeId).equals(r.getCriterionKey())) {
                            matched = true;
                        }
                        break;
                    case "REGION":
                        if (regionId != null && String.valueOf(regionId).equals(r.getCriterionKey())) {
                            matched = true;
                        }
                        break;
                    case "LEAD_SOURCE":
                        if (leadSource != null) {
                            String ls = leadSource.toLowerCase().trim();
                            String key = r.getCriterionKey() != null ? r.getCriterionKey().toLowerCase().trim() : "";
                            String name = r.getCriterionName() != null ? r.getCriterionName().toLowerCase().trim() : "";
                            if (ls.equals(key) || ls.contains(key) || (!key.isEmpty() && key.contains(ls)) || name.contains(ls)
                                    || (ls.contains("hội thảo") && (key.contains("thao") || name.contains("hội thảo")))
                                    || (ls.contains("giới thiệu") && (key.contains("thieu") || name.contains("giới thiệu")))
                                    || (ls.contains("web") && (key.contains("web") || name.contains("website")))
                                    || (ls.contains("facebook") && (key.contains("face") || name.contains("facebook")))
                                    || (ls.contains("telesale") || ls.contains("tiếp cận") && key.contains("call"))) {
                                matched = true;
                            }
                        }
                        break;
                }

                if (matched) {
                    totalScore += r.getScore();
                    breakdown.put(r.getCriterionName(), r.getScore());
                }
            }

            // Xác định Grade (HOT, WARM, COLD)
            List<ScoreThresholdDTO> thresholds = getThresholds();
            String grade = "COLD";
            for (ScoreThresholdDTO th : thresholds) {
                if (totalScore >= th.getMinScore()) {
                    grade = th.getGrade();
                    break;
                }
            }

            String breakdownJson = JsonUtil.getGson().toJson(breakdown);

            // Cập nhật vào customers
            String updateSql = "UPDATE customers SET lead_score = ?, score_grade = ?, score_breakdown = ? WHERE id = ?";
            try (PreparedStatement ps = conn.prepareStatement(updateSql)) {
                ps.setInt(1, totalScore);
                ps.setString(2, grade);
                ps.setString(3, breakdownJson);
                ps.setLong(4, leadId);
                ps.executeUpdate();
            }

            Map<String, Object> result = new LinkedHashMap<>();
            result.put("leadId", leadId);
            result.put("totalScore", totalScore);
            result.put("grade", grade);
            result.put("breakdown", breakdown);
            return result;

        } catch (SQLException e) {
            throw new RuntimeException("Lỗi chấm điểm Lead #" + leadId + ": " + e.getMessage(), e);
        } finally {
            if (closeConn && conn != null) {
                try { conn.close(); } catch (SQLException ignored) {}
            }
        }
    }

    /**
     * Tính lại điểm số cho toàn bộ Lead/Khách hàng trong hệ thống
     */
    public int recalculateAllLeads() {
        String sql = "SELECT id FROM customers WHERE is_deleted = 0";
        int count = 0;
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql);
             ResultSet rs = ps.executeQuery()) {

            List<Long> ids = new ArrayList<>();
            while (rs.next()) {
                ids.add(rs.getLong("id"));
            }

            for (Long id : ids) {
                evaluateAndSaveLeadScore(conn, id);
                count++;
            }
        } catch (SQLException e) {
            throw new RuntimeException("Lỗi tính lại điểm toàn bộ Lead: " + e.getMessage(), e);
        }
        return count;
    }
}
