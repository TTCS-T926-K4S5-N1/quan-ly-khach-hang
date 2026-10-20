package com.crm.service.pipeline;

import com.crm.dao.customfields.CustomFieldValueDAO;
import com.crm.dao.permissions.PermissionDAO;
import com.crm.dao.pipeline.OpportunityDAO;
import com.crm.dao.pipeline.PipelineStageDAO;
import com.crm.dto.pipeline.OpportunityWriteRequest;
import com.crm.service.audit.AuditLogService;
import com.crm.service.permissions.DataScopeContext;
import com.crm.service.permissions.DataScopeService;
import com.crm.service.permissions.PermissionService;

import java.util.*;

public class OpportunityService {

    private final OpportunityDAO opportunityDAO = new OpportunityDAO();
    private final PipelineStageDAO stageDAO = new PipelineStageDAO();
    private final CustomFieldValueDAO customFieldValueDAO = new CustomFieldValueDAO();
    private final DataScopeService dataScopeService = new DataScopeService();
    private final PermissionService permissionService = new PermissionService();
    private final PermissionDAO permissionDAO = new PermissionDAO();
    private final AuditLogService auditLogService = new AuditLogService();
    private final StageConditionValidator conditionValidator = new StageConditionValidator();

    public List<Map<String, Object>> search(
            long currentUserId,
            Long stageId,
            String status,
            String keyword,
            int page,
            int size
    ) throws Exception {
        DataScopeContext scope = dataScopeService.resolve(currentUserId, "opportunity", "read");
        return opportunityDAO.search(scope, stageId, status, keyword, page, size);
    }

    public Map<String, Object> getById(long currentUserId, long id) throws Exception {
        DataScopeContext scope = dataScopeService.resolve(currentUserId, "opportunity", "read");
        Map<String, Object> opp = opportunityDAO.findById(id);
        if (opp == null) {
            return null;
        }

        long ownerId = (Long) opp.get("ownerUserId");
        if (!scope.canAccessOwner(ownerId)) {
            throw new SecurityException("Bạn không có quyền truy cập dữ liệu này do giới hạn phạm vi sở hữu.");
        }

        Map<String, Object> customFields = customFieldValueDAO.getValues("OPPORTUNITY", id);
        opp.put("customFields", customFields);
        return opp;
    }

    public Map<String, Object> create(long currentUserId, OpportunityWriteRequest req) throws Exception {
        if (req == null || req.getName() == null || req.getName().isBlank()) {
            throw new IllegalArgumentException("Tên cơ hội bán hàng là bắt buộc.");
        }

        dataScopeService.resolve(currentUserId, "opportunity", "create");

        // If stage is provided, get default probability
        if (req.getStageId() != null && req.getProbability() == null) {
            var stage = stageDAO.findById(req.getStageId());
            if (stage != null && stage.get("winProbability") != null) {
                req.setProbability(((Number) stage.get("winProbability")).intValue());
            }
        }

        long id = opportunityDAO.create(req, currentUserId);

        if (req.getCustomFields() != null && !req.getCustomFields().isEmpty()) {
            customFieldValueDAO.saveValues("OPPORTUNITY", id, req.getCustomFields());
        }

        return getById(currentUserId, id);
    }

    public Map<String, Object> update(long currentUserId, long id, OpportunityWriteRequest req) throws Exception {
        if (req == null || req.getName() == null || req.getName().isBlank()) {
            throw new IllegalArgumentException("Tên cơ hội bán hàng là bắt buộc.");
        }

        DataScopeContext scope = dataScopeService.resolve(currentUserId, "opportunity", "update");
        Map<String, Object> existing = opportunityDAO.findById(id);
        if (existing == null) {
            return null;
        }

        long ownerId = (Long) existing.get("ownerUserId");
        if (!scope.canAccessOwner(ownerId)) {
            throw new SecurityException("Bạn không có quyền truy cập dữ liệu này do giới hạn phạm vi sở hữu.");
        }

        opportunityDAO.update(id, req);

        if (req.getCustomFields() != null && !req.getCustomFields().isEmpty()) {
            customFieldValueDAO.saveValues("OPPORTUNITY", id, req.getCustomFields());
        }

        return getById(currentUserId, id);
    }

    public boolean isTeamLeadOrAbove(long userId) {
        try {
            if (permissionService.hasPermission(userId, "opportunity.stage.override")) {
                return true;
            }
            List<Map<String, Object>> roles = permissionDAO.findRolesByUserId(userId);
            for (Map<String, Object> r : roles) {
                String code = (String) r.get("code");
                if (code != null) {
                    String uc = code.trim().toUpperCase();
                    if (uc.equals("ADMIN") || uc.equals("DIRECTOR") || uc.equals("TEAM_LEAD") || uc.equals("MANAGER")) {
                        return true;
                    }
                }
            }
        } catch (Exception ignored) {
        }
        return false;
    }

    public Map<String, Object> changeStage(long currentUserId, long id, long targetStageId) throws Exception {
        return changeStage(currentUserId, id, targetStageId, null);
    }

    public Map<String, Object> changeStage(long currentUserId, long id, long targetStageId, String overrideReason) throws Exception {
        DataScopeContext scope = dataScopeService.resolve(currentUserId, "opportunity", "update");
        Map<String, Object> opp = opportunityDAO.findById(id);
        if (opp == null) {
            throw new NoSuchElementException("Cơ hội không tồn tại.");
        }

        long ownerId = (Long) opp.get("ownerUserId");
        if (!scope.canAccessOwner(ownerId)) {
            throw new SecurityException("Bạn không có quyền truy cập dữ liệu này do giới hạn phạm vi sở hữu.");
        }

        // Thẩm định giai đoạn đích
        var targetStage = stageDAO.findById(targetStageId);
        if (targetStage == null) {
            throw new IllegalArgumentException("Giai đoạn đích không tồn tại.");
        }

        Long currentStageId = opp.get("stageId") != null ? ((Number) opp.get("stageId")).longValue() : null;
        boolean isOverridden = false;
        String cleanOverrideReason = overrideReason != null ? overrideReason.trim() : null;
        boolean isLead = isTeamLeadOrAbove(currentUserId);

        // SCRUM-75: Kiểm tra điều kiện bắt buộc rời giai đoạn hiện tại (nếu có cấu hình)
        if (currentStageId != null && currentStageId != targetStageId) {
            var currentStage = stageDAO.findById(currentStageId);
            if (currentStage != null) {
                boolean isWonOrLost = Boolean.TRUE.equals(targetStage.get("isWon")) || Boolean.TRUE.equals(targetStage.get("isLost"));
                if (!isWonOrLost) {
                    StageConditionValidator.ValidationResult valResult = conditionValidator.validateExitConditions(currentStage, opp);
                    if (!valResult.isValid()) {
                        // Người dùng cố ý gửi overrideReason nhưng không phải Trưởng nhóm
                        if (cleanOverrideReason != null && !cleanOverrideReason.isBlank() && !isLead) {
                            throw new SecurityException("Chỉ Trưởng nhóm trở lên mới có quyền ghi đè điều kiện rời giai đoạn.");
                        }

                        // Nếu không phải là Trưởng nhóm trở lên -> Từ chối chuyển giai đoạn
                        if (!isLead) {
                            String missingStr = String.join(", ", valResult.missingConditions());
                            throw new StageConditionViolationException(
                                    "Không thể chuyển giai đoạn. Còn thiếu điều kiện bắt buộc: " + missingStr,
                                    false,
                                    valResult.missingConditions(),
                                    valResult.stageName(),
                                    (String) targetStage.get("name"),
                                    valResult.exitCondition()
                            );
                        }

                        // Là Trưởng nhóm trở lên -> Phải có lý do ghi đè
                        if (cleanOverrideReason == null || cleanOverrideReason.isBlank()) {
                            String missingStr = String.join(", ", valResult.missingConditions());
                            throw new StageConditionViolationException(
                                    "Chưa thỏa điều kiện rời giai đoạn (" + missingStr + "). Là Trưởng nhóm trở lên, vui lòng nhập lý do ghi đè để chuyển giai đoạn.",
                                    true,
                                    valResult.missingConditions(),
                                    valResult.stageName(),
                                    (String) targetStage.get("name"),
                                    valResult.exitCondition()
                            );
                        }

                        if (cleanOverrideReason.length() < 5) {
                            throw new IllegalArgumentException("Lý do ghi đè chuyển giai đoạn phải có ít nhất 5 ký tự.");
                        }

                        isOverridden = true;
                    }
                }
            }
        }

        int prob = targetStage.get("winProbability") != null ? ((Number) targetStage.get("winProbability")).intValue() : 0;
        opportunityDAO.updateStage(id, targetStageId, prob, currentStageId, currentUserId, isOverridden, cleanOverrideReason);

        if (isOverridden) {
            auditLogService.log(
                    currentUserId,
                    "OPPORTUNITY",
                    String.valueOf(id),
                    "STAGE_OVERRIDE",
                    "Ghi đè điều kiện rời giai đoạn sang '" + targetStage.get("name") + "'. Lý do: " + cleanOverrideReason
            );
        }

        return getById(currentUserId, id);
    }

    public Map<String, Object> closeDeal(
            long currentUserId,
            long id,
            String status,
            Long winReasonId,
            Long lossReasonId,
            Long competitorId,
            String lostReason
    ) throws Exception {
        dataScopeService.resolve(currentUserId, "opportunity", "close");
        Map<String, Object> opp = opportunityDAO.findById(id);
        if (opp == null) {
            throw new NoSuchElementException("Cơ hội không tồn tại.");
        }

        DataScopeContext scope = dataScopeService.resolve(currentUserId, "opportunity", "update");
        long ownerId = (Long) opp.get("ownerUserId");
        if (!scope.canAccessOwner(ownerId)) {
            throw new SecurityException("Bạn không có quyền truy cập dữ liệu này do giới hạn phạm vi sở hữu.");
        }

        // CRM-42 Tiêu chí 3: Ràng buộc bắt buộc khi đóng cơ hội bán hàng
        if ("WON".equalsIgnoreCase(status)) {
            if (winReasonId == null) {
                throw new IllegalArgumentException("Bắt buộc phải chọn Lý do Thắng khi chốt thành công cơ hội bán hàng.");
            }
        } else if ("LOST".equalsIgnoreCase(status)) {
            if (lossReasonId == null) {
                throw new IllegalArgumentException("Bắt buộc phải chọn Lý do Thua khi đóng thất bại cơ hội bán hàng.");
            }
            if (competitorId == null) {
                throw new IllegalArgumentException("Bắt buộc phải chọn Đối thủ cạnh tranh khi đóng thất bại cơ hội bán hàng.");
            }
        } else {
            throw new IllegalArgumentException("Trạng thái đóng cơ hội phải là WON hoặc LOST.");
        }

        opportunityDAO.closeDeal(id, status.toUpperCase(), winReasonId, lossReasonId, competitorId, lostReason);
        return getById(currentUserId, id);
    }

    public void delete(long currentUserId, long id) throws Exception {
        dataScopeService.resolve(currentUserId, "opportunity", "update");
        Map<String, Object> opp = opportunityDAO.findById(id);
        if (opp == null) {
            throw new NoSuchElementException("Cơ hội không tồn tại.");
        }

        DataScopeContext scope = dataScopeService.resolve(currentUserId, "opportunity", "update");
        long ownerId = (Long) opp.get("ownerUserId");
        if (!scope.canAccessOwner(ownerId)) {
            throw new SecurityException("Bạn không có quyền truy cập dữ liệu này do giới hạn phạm vi sở hữu.");
        }

        opportunityDAO.softDelete(id);
    }
}
