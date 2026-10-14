package com.crm.service.routing;

import com.crm.dao.routing.LeadScoringDAO;
import com.crm.dto.routing.LeadScoringRuleDTO;
import com.crm.dto.routing.ScoreThresholdDTO;

import java.sql.Connection;
import java.util.List;
import java.util.Map;

public class LeadScoringService {

    private final LeadScoringDAO scoringDAO = new LeadScoringDAO();

    public List<LeadScoringRuleDTO> getAllRules() {
        return scoringDAO.getAllRules();
    }

    public List<ScoreThresholdDTO> getThresholds() {
        return scoringDAO.getThresholds();
    }

    public void updateThreshold(String grade, int minScore, String label, String color, String icon, String description) {
        if (grade == null || grade.isBlank()) {
            throw new IllegalArgumentException("Hạng phân loại (grade) không được để trống");
        }
        scoringDAO.updateThreshold(grade, minScore, label, color, icon, description);
    }

    public long saveRule(LeadScoringRuleDTO rule) {
        if (rule.getCategory() == null || rule.getCategory().isBlank()) {
            throw new IllegalArgumentException("Nhóm tiêu chí không được để trống");
        }
        if (rule.getCriterionKey() == null || rule.getCriterionKey().isBlank()) {
            throw new IllegalArgumentException("Mã tiêu chí không được để trống");
        }
        if (rule.getCriterionName() == null || rule.getCriterionName().isBlank()) {
            throw new IllegalArgumentException("Tên tiêu chí không được để trống");
        }
        return scoringDAO.saveRule(rule);
    }

    public void updateRule(LeadScoringRuleDTO rule) {
        if (rule.getId() == null) {
            throw new IllegalArgumentException("ID tiêu chí không hợp lệ");
        }
        scoringDAO.updateRule(rule);
    }

    public void deleteRule(long id) {
        scoringDAO.deleteRule(id);
    }

    public Map<String, Object> evaluateAndSaveLeadScore(Connection conn, long leadId) {
        return scoringDAO.evaluateAndSaveLeadScore(conn, leadId);
    }

    public int recalculateAllLeads() {
        return scoringDAO.recalculateAllLeads();
    }
}
