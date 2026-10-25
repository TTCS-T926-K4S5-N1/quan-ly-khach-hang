package com.crm.service.automation;

import com.crm.config.DatabaseConfig;
import com.crm.dao.automation.AutomationDAO;
import com.crm.dto.automation.AutomationLogDTO;
import com.crm.dto.automation.AutomationRuleDTO;
import com.crm.service.notifications.NotificationService;
import com.crm.util.JsonUtil;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

public class AutomationEngine {

    private static final AutomationEngine INSTANCE = new AutomationEngine();

    private final AutomationDAO automationDAO = new AutomationDAO();
    private final NotificationService notificationService = NotificationService.getInstance();
    private final ExecutorService executor = Executors.newFixedThreadPool(3, r -> {
        Thread t = new Thread(r, "crm-automation-worker");
        t.setDaemon(true);
        return t;
    });

    private AutomationEngine() {}

    public static AutomationEngine getInstance() {
        return INSTANCE;
    }

    /**
     * Kích hoạt kiểm tra và thực thi các quy tắc tự động hoá bất đồng bộ (When - Then)
     */
    public void triggerAsync(String triggerEvent, String triggerEntity, long entityId, Map<String, Object> entityData) {
        executor.submit(() -> {
            try {
                executeRules(triggerEvent, triggerEntity, entityId, entityData);
            } catch (Exception e) {
                System.err.println("[AutomationEngine] Lỗi thực thi quy tắc tự động: " + e.getMessage());
            }
        });
    }

    private void executeRules(String triggerEvent, String triggerEntity, long entityId, Map<String, Object> entityData) {
        try {
            List<AutomationRuleDTO> rules = automationDAO.findActiveRules(triggerEvent, triggerEntity);
            if (rules.isEmpty()) return;

            String entityName = extractEntityName(entityData, triggerEntity, entityId);

            for (AutomationRuleDTO rule : rules) {
                boolean matches = evaluateCondition(rule, entityData);
                if (!matches) continue;

                executeRuleAction(rule, triggerEntity, entityId, entityName, entityData);
            }
        } catch (Exception e) {
            System.err.println("[AutomationEngine] Lỗi xử lý quy tắc: " + e.getMessage());
        }
    }

    private boolean evaluateCondition(AutomationRuleDTO rule, Map<String, Object> entityData) {
        if (rule.getConditionField() == null || rule.getConditionField().isBlank()) {
            return true;
        }

        String field = rule.getConditionField().trim();
        String expectedVal = rule.getConditionValue() != null ? rule.getConditionValue().trim() : "";
        String operator = rule.getConditionOperator() != null ? rule.getConditionOperator().trim() : "EQUALS";

        Object actualObj = entityData.get(field);
        if (actualObj == null) {
            // Thử alias khác (ví dụ: stage_id vs stageId)
            String camelField = toCamelCase(field);
            actualObj = entityData.get(camelField);
        }

        if (actualObj == null) {
            return false;
        }

        String actualVal = String.valueOf(actualObj).trim();

        if ("EQUALS".equalsIgnoreCase(operator)) {
            return actualVal.equalsIgnoreCase(expectedVal);
        } else if ("GREATER_THAN".equalsIgnoreCase(operator)) {
            try {
                double a = Double.parseDouble(actualVal);
                double b = Double.parseDouble(expectedVal);
                return a > b;
            } catch (NumberFormatException e) {
                return false;
            }
        }

        return actualVal.equalsIgnoreCase(expectedVal);
    }

    @SuppressWarnings("unchecked")
    private void executeRuleAction(AutomationRuleDTO rule, String triggerEntity, long entityId, String entityName, Map<String, Object> entityData) {
        String actionType = rule.getActionType();
        String actionSummary = "";
        String status = "SUCCESS";
        String errorMessage = null;

        try {
            Map<String, Object> params = null;
            if (rule.getActionParams() != null && !rule.getActionParams().isBlank()) {
                params = JsonUtil.getGson().fromJson(rule.getActionParams(), com.crm.util.JsonUtil.OBJECT_MAP_TYPE);
            }

            if ("CREATE_TASK".equalsIgnoreCase(actionType)) {
                actionSummary = handleCreateTask(rule, triggerEntity, entityId, entityData, params);
            } else if ("SEND_NOTIFICATION".equalsIgnoreCase(actionType)) {
                actionSummary = handleSendNotification(rule, triggerEntity, entityId, entityData, params);
            } else if ("CHANGE_OWNER".equalsIgnoreCase(actionType)) {
                actionSummary = handleChangeOwner(rule, triggerEntity, entityId, entityData, params);
            } else {
                actionSummary = "Hành động không xác định: " + actionType;
            }
        } catch (Exception e) {
            status = "FAILED";
            errorMessage = e.getMessage();
            actionSummary = "Thất bại: " + e.getMessage();
        }

        // Ghi lại nhật ký thực thi (Automation Logs)
        try {
            AutomationLogDTO log = new AutomationLogDTO(
                    rule.getId(),
                    rule.getName(),
                    rule.getTriggerEvent(),
                    triggerEntity,
                    entityId,
                    entityName,
                    actionType,
                    actionSummary,
                    status,
                    errorMessage
            );
            automationDAO.logExecution(log);
        } catch (SQLException ex) {
            System.err.println("[AutomationEngine] Không thể lưu nhật ký thực thi: " + ex.getMessage());
        }
    }

    private String handleCreateTask(AutomationRuleDTO rule, String triggerEntity, long entityId, Map<String, Object> entityData, Map<String, Object> params) throws SQLException {
        String subject = (params != null && params.get("subject") != null) ? (String) params.get("subject") : "Công việc tự động";
        String type = (params != null && params.get("type") != null) ? ((String) params.get("type")).toUpperCase() : "CALL";
        int dueDays = (params != null && params.get("dueDays") != null) ? ((Number) params.get("dueDays")).intValue() : 3;
        String desc = (params != null && params.get("description") != null) ? (String) params.get("description") : ("Tự động tạo bởi quy tắc: " + rule.getName());

        LocalDateTime dueDateTime = LocalDateTime.now().plusDays(dueDays);
        Timestamp dueDate = Timestamp.valueOf(dueDateTime);

        Long ownerId = parseLongSafe(entityData.get("ownerUserId"));
        if (ownerId == null) ownerId = parseLongSafe(entityData.get("owner_user_id"));
        if (ownerId == null) ownerId = 1L; // Fallback admin

        Long custId = parseLongSafe(entityData.get("customerId"));
        if (custId == null) custId = parseLongSafe(entityData.get("customer_id"));
        Long oppId = "OPPORTUNITY".equalsIgnoreCase(triggerEntity) ? entityId : parseLongSafe(entityData.get("opportunityId"));

        String sql = """
                INSERT INTO activities (subject, type, description, status, priority, due_date, customer_id, opportunity_id, owner_user_id, assigned_by_user_id, is_deleted, created_at)
                VALUES (?, ?, ?, 'OPEN', 'MEDIUM', ?, ?, ?, ?, 1, 0, NOW())
                """;
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, subject);
            ps.setString(2, type);
            ps.setString(3, desc);
            ps.setTimestamp(4, dueDate);
            if (custId != null) ps.setLong(5, custId); else ps.setNull(5, java.sql.Types.BIGINT);
            if (oppId != null) ps.setLong(6, oppId); else ps.setNull(6, java.sql.Types.BIGINT);
            ps.setLong(7, ownerId);
            ps.executeUpdate();
        }

        // Bắn thông báo giao việc cho nhân viên
        notificationService.notifyTaskAssigned(ownerId, 0L, subject, "sau " + dueDays + " ngày (" + dueDateTime.toLocalDate() + ")");

        return "Đã tự động tạo công việc '" + subject + "' (hạn sau " + dueDays + " ngày) giao cho nhân sự phụ trách";
    }

    private String handleSendNotification(AutomationRuleDTO rule, String triggerEntity, long entityId, Map<String, Object> entityData, Map<String, Object> params) {
        String title = (params != null && params.get("title") != null) ? (String) params.get("title") : ("Thông báo: " + rule.getName());
        String content = (params != null && params.get("content") != null) ? (String) params.get("content") : "Có sự kiện cập nhật trong quy trình bán hàng.";

        Long ownerId = parseLongSafe(entityData.get("ownerUserId"));
        if (ownerId == null) ownerId = parseLongSafe(entityData.get("owner_user_id"));
        if (ownerId == null) ownerId = 1L;

        String link = "OPPORTUNITY".equalsIgnoreCase(triggerEntity) ? "pipeline" : "customers";
        notificationService.sendAsync(ownerId, "AUTOMATION_ACTION", title, content, link, triggerEntity, entityId);

        return "Đã gửi thông báo trong ứng dụng cho người phụ trách: " + title;
    }

    private String handleChangeOwner(AutomationRuleDTO rule, String triggerEntity, long entityId, Map<String, Object> entityData, Map<String, Object> params) throws SQLException {
        Long newOwnerId = (params != null && params.get("newOwnerId") != null) ? parseLongSafe(params.get("newOwnerId")) : null;
        if (newOwnerId == null || newOwnerId <= 0) {
            throw new IllegalArgumentException("Chưa cấu hình người sở hữu mới trong action_params");
        }

        if ("OPPORTUNITY".equalsIgnoreCase(triggerEntity)) {
            String sql = "UPDATE opportunities SET owner_user_id = ?, updated_at = NOW() WHERE id = ?";
            try (Connection conn = DatabaseConfig.getConnection();
                 PreparedStatement ps = conn.prepareStatement(sql)) {
                ps.setLong(1, newOwnerId);
                ps.setLong(2, entityId);
                ps.executeUpdate();
            }
        }

        notificationService.sendAsync(newOwnerId, "AUTOMATION_ACTION", "Bạn được chuyển giao quyền sở hữu cơ hội mới", "Cơ hội #" + entityId + " vừa được tự động gán cho bạn theo quy tắc " + rule.getName(), "pipeline", triggerEntity, entityId);
        return "Đã đổi người sở hữu cơ hội sang nhân sự ID " + newOwnerId;
    }

    private String extractEntityName(Map<String, Object> entityData, String triggerEntity, long entityId) {
        if (entityData != null) {
            if (entityData.containsKey("name")) return String.valueOf(entityData.get("name"));
            if (entityData.containsKey("title")) return String.valueOf(entityData.get("title"));
            if (entityData.containsKey("leadName")) return String.valueOf(entityData.get("leadName"));
        }
        return triggerEntity + " #" + entityId;
    }

    private Long parseLongSafe(Object obj) {
        if (obj == null) return null;
        if (obj instanceof Number) return ((Number) obj).longValue();
        try {
            return Long.parseLong(String.valueOf(obj).trim());
        } catch (NumberFormatException e) {
            return null;
        }
    }

    private String toCamelCase(String s) {
        StringBuilder sb = new StringBuilder();
        boolean nextUpper = false;
        for (char c : s.toCharArray()) {
            if (c == '_') {
                nextUpper = true;
            } else if (nextUpper) {
                sb.append(Character.toUpperCase(c));
                nextUpper = false;
            } else {
                sb.append(c);
            }
        }
        return sb.toString();
    }
}
