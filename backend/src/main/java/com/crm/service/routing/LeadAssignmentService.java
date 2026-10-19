package com.crm.service.routing;

import com.crm.dao.routing.LeadAssignmentDAO;
import com.crm.dto.routing.LeadAssignmentLogDTO;
import com.crm.dto.routing.LeadAssignmentRuleDTO;
import com.crm.dto.routing.UnassignedLeadDTO;

import java.sql.Connection;
import java.util.List;

public class LeadAssignmentService {

    private final LeadAssignmentDAO assignmentDAO = new LeadAssignmentDAO();

    public List<LeadAssignmentRuleDTO> getAllRules() {
        return assignmentDAO.getAllRules();
    }

    public long saveRule(LeadAssignmentRuleDTO rule, long createdBy) {
        if (rule.getName() == null || rule.getName().isBlank()) {
            throw new IllegalArgumentException("Tên quy tắc phân bổ không được để trống");
        }
        rule.setCreatedBy(createdBy);
        return assignmentDAO.saveRule(rule);
    }

    public void updateRule(LeadAssignmentRuleDTO rule) {
        if (rule.getId() == null) {
            throw new IllegalArgumentException("ID quy tắc không hợp lệ");
        }
        assignmentDAO.updateRule(rule);
    }

    public void updatePriorities(List<Long> ruleIdsInOrder) {
        if (ruleIdsInOrder == null || ruleIdsInOrder.isEmpty()) {
            throw new IllegalArgumentException("Danh sách thứ tự quy tắc không được rỗng");
        }
        assignmentDAO.updatePriorities(ruleIdsInOrder);
    }

    public void deleteRule(long id) {
        assignmentDAO.deleteRule(id);
    }

    public boolean evaluateAndAssignLead(Connection conn, long leadId, Long manualByUserId) {
        return assignmentDAO.evaluateAndAssignLead(conn, leadId, manualByUserId);
    }

    public void manualAssignLead(long leadId, long targetUserId, long byUserId, String notes) {
        if (targetUserId <= 0) {
            throw new IllegalArgumentException("Vui lòng chọn nhân viên kinh doanh nhận lead");
        }
        assignmentDAO.manualAssignLead(leadId, targetUserId, byUserId, notes);

        // Bắn thông báo nhận lead bất đồng bộ cho nhân viên
        com.crm.service.notifications.NotificationService.getInstance().notifyLeadAssigned(targetUserId, leadId, "Lead #" + leadId);
    }

    public List<UnassignedLeadDTO> getUnassignedLeads() {
        return assignmentDAO.getUnassignedLeads();
    }

    public List<LeadAssignmentLogDTO> getAssignmentLogs(int limit) {
        return assignmentDAO.getAssignmentLogs(limit);
    }

    public int runBatchAutoAssignment() {
        return assignmentDAO.runBatchAutoAssignment();
    }
}
