package com.crm.service.pipeline;

import com.crm.dao.customfields.CustomFieldValueDAO;
import com.crm.dao.pipeline.OpportunityDAO;
import com.crm.dao.pipeline.OpportunityItemDAO;
import com.crm.dao.pipeline.PipelineStageDAO;
import com.crm.dto.pipeline.OpportunityWriteRequest;
import com.crm.service.permissions.DataScopeContext;
import com.crm.service.permissions.DataScopeService;
import com.crm.service.permissions.ScopeType;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.Types;
import java.util.*;

public class OpportunityService {

    private final OpportunityDAO opportunityDAO = new OpportunityDAO();
    private final PipelineStageDAO stageDAO = new PipelineStageDAO();
    private final OpportunityItemDAO itemDAO = new OpportunityItemDAO();
    private final CustomFieldValueDAO customFieldValueDAO = new CustomFieldValueDAO();
    private final DataScopeService dataScopeService = new DataScopeService();
    private final com.crm.dao.permissions.PermissionDAO permissionDAO = new com.crm.dao.permissions.PermissionDAO();
    private final com.crm.service.audit.AuditLogService auditLogService = new com.crm.service.audit.AuditLogService();

    public List<Map<String, Object>> search(
            long currentUserId,
            Long stageId,
            String status,
            String keyword,
            int page,
            int size
    ) throws Exception {
        return search(currentUserId, stageId, status, keyword, null, null, page, size);
    }

    public List<Map<String, Object>> search(
            long currentUserId,
            Long stageId,
            String status,
            String keyword,
            String customFieldKey,
            String customFieldValue,
            int page,
            int size
    ) throws Exception {
        return search(currentUserId, stageId, status, keyword, null, null, null, null, null, customFieldKey, customFieldValue, page, size);
    }

    public List<Map<String, Object>> search(
            long currentUserId,
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
    ) throws Exception {
        return search(currentUserId, stageId, status, keyword, ownerUserId, teamId, closeDateFrom, closeDateTo, leadSource, customFieldKey, customFieldValue, null, page, size);
    }

    public List<Map<String, Object>> search(
            long currentUserId,
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
    ) throws Exception {
        return search(currentUserId, stageId, status, keyword, ownerUserId, teamId, closeDateFrom, closeDateTo, leadSource, null, null, null, null, customFieldKey, customFieldValue, stagnantOnly, page, size);
    }

    public List<Map<String, Object>> search(
            long currentUserId,
            Long stageId,
            String status,
            String keyword,
            Long ownerUserId,
            Long teamId,
            String closeDateFrom,
            String closeDateTo,
            String leadSource,
            java.math.BigDecimal minAmount,
            java.math.BigDecimal maxAmount,
            Long productId,
            String productKeyword,
            String customFieldKey,
            String customFieldValue,
            Boolean stagnantOnly,
            int page,
            int size
    ) throws Exception {
        DataScopeContext scope = dataScopeService.resolve(currentUserId, "opportunity", "read");
        return opportunityDAO.search(scope, stageId, status, keyword, ownerUserId, teamId, closeDateFrom, closeDateTo, leadSource, minAmount, maxAmount, productId, productKeyword, customFieldKey, customFieldValue, stagnantOnly, page, size);
    }

    public Map<String, Object> getById(long currentUserId, long id) throws Exception {
        DataScopeContext scope = dataScopeService.resolve(currentUserId, "opportunity", "read");
        Map<String, Object> opp = opportunityDAO.findById(id);
        if (opp == null) {
            return null;
        }

        long ownerId = (Long) opp.get("ownerUserId");
        boolean isCollaborator = opportunityDAO.isMember(id, currentUserId);
        if (!scope.canAccessOwner(ownerId) && !isCollaborator) {
            throw new SecurityException("Bạn không có quyền truy cập dữ liệu này do giới hạn phạm vi sở hữu.");
        }

        Map<String, Object> customFields = customFieldValueDAO.getValues("OPPORTUNITY", id);
        opp.put("customFields", customFields);

        // Nạp danh sách sản phẩm / dịch vụ của cơ hội & tổng ACV
        List<com.crm.dto.pipeline.OpportunityItemDTO> items = itemDAO.findByOpportunityId(id);
        Map<String, Object> totals = itemDAO.calculateOpportunityTotals(id);
        opp.put("items", items);
        opp.put("itemCount", totals.get("itemCount"));
        opp.put("totalAcv", totals.get("totalAcv"));

        return opp;
    }

    public Map<String, Object> create(long currentUserId, OpportunityWriteRequest req) throws Exception {
        if (req == null || req.getName() == null || req.getName().isBlank()) {
            throw new IllegalArgumentException("Tên cơ hội bán hàng là bắt buộc.");
        }

        if (req.getCustomerId() == null) {
            throw new IllegalArgumentException("Vui lòng chọn khách hàng cho cơ hội bán hàng.");
        }

        // SCRUM-72 Criteria 4: Ngày dự kiến chốt không được ở quá khứ khi tạo mới
        if (req.getExpectedCloseDate() != null && !req.getExpectedCloseDate().isBlank()) {
            try {
                java.time.LocalDate closeDate = java.time.LocalDate.parse(req.getExpectedCloseDate().trim());
                if (closeDate.isBefore(java.time.LocalDate.now())) {
                    throw new IllegalArgumentException("Ngày dự kiến chốt không được ở trong quá khứ khi tạo mới cơ hội.");
                }
            } catch (java.time.format.DateTimeParseException e) {
                throw new IllegalArgumentException("Định dạng ngày dự kiến chốt không hợp lệ (YYYY-MM-DD).");
            }
        }

        customFieldValueDAO.validateRequiredFields("OPPORTUNITY", req.getCustomFields());

        dataScopeService.resolve(currentUserId, "opportunity", "create");

        // If stage is provided, get default probability
        if (req.getStageId() != null) {
            var stage = stageDAO.findById(req.getStageId());
            if (stage != null && stage.get("winProbability") != null) {
                int defaultProb = ((Number) stage.get("winProbability")).intValue();
                if (req.getProbability() == null) {
                    req.setProbability(defaultProb);
                }
            }
        }

        // Nếu có danh sách sản phẩm, tự động tính tổng tiền từ các dòng sản phẩm
        if (req.getItems() != null && !req.getItems().isEmpty()) {
            java.math.BigDecimal total = java.math.BigDecimal.ZERO;
            for (var item : req.getItems()) {
                OpportunityItemDAO.calculateItemAmounts(item);
                total = total.add(item.getAmount());
            }
            req.setAmount(total);
        }

        long id = opportunityDAO.create(req, currentUserId);

        // Lưu các dòng sản phẩm nếu có
        if (req.getItems() != null && !req.getItems().isEmpty()) {
            itemDAO.saveItems(id, req.getItems());
        }

        if (req.getCustomFields() != null && !req.getCustomFields().isEmpty()) {
            customFieldValueDAO.saveValues("OPPORTUNITY", id, req.getCustomFields());
        }

        return getById(currentUserId, id);
    }

    public Map<String, Object> update(long currentUserId, long id, OpportunityWriteRequest req) throws Exception {
        if (req == null || req.getName() == null || req.getName().isBlank()) {
            throw new IllegalArgumentException("Tên cơ hội bán hàng là bắt buộc.");
        }

        if (req.getCustomFields() != null) {
            customFieldValueDAO.validateRequiredFields("OPPORTUNITY", req.getCustomFields());
        }

        DataScopeContext scope = dataScopeService.resolve(currentUserId, "opportunity", "update");
        Map<String, Object> existing = opportunityDAO.findById(id);
        if (existing == null) {
            return null;
        }

        long ownerId = (Long) existing.get("ownerUserId");
        boolean isCollaborator = opportunityDAO.isMember(id, currentUserId);
        boolean canManage = permissionDAO.hasRole(currentUserId, "ADMIN")
                || permissionDAO.hasRole(currentUserId, "DIRECTOR")
                || permissionDAO.hasRole(currentUserId, "TEAM_LEAD")
                || ownerId == currentUserId;

        if (!scope.canAccessOwner(ownerId) && !isCollaborator) {
            throw new SecurityException("Bạn không có quyền truy cập dữ liệu này do giới hạn phạm vi sở hữu.");
        }

        // Story 3: Thành viên được chia sẻ không thể đổi được người sở hữu
        if (req.getOwnerUserId() != null && req.getOwnerUserId() != ownerId && !canManage) {
            throw new SecurityException("Thành viên được chia sẻ không có quyền chuyển quyền sở hữu cơ hội.");
        }

        // Story 1: Cơ hội đã đóng (Thắng/Thua) thì khóa chỉnh sửa, chỉ Trưởng nhóm trở lên mới có quyền mở lại
        String existingStatus = (String) existing.get("status");
        if ("WON".equalsIgnoreCase(existingStatus) || "LOST".equalsIgnoreCase(existingStatus)) {
            throw new IllegalStateException("Cơ hội đã đóng (" + existingStatus + ") không thể chỉnh sửa. Chỉ Trưởng nhóm trở lên mới có quyền Mở lại cơ hội để tiếp tục cập nhật.");
        }

        // Nếu có dòng sản phẩm truyền lên, tự động cập nhật và tính lại tổng tiền
        if (req.getItems() != null) {
            itemDAO.saveItems(id, req.getItems());
            Map<String, Object> totals = itemDAO.calculateOpportunityTotals(id);
            req.setAmount((java.math.BigDecimal) totals.get("totalAmount"));
        }

        opportunityDAO.update(id, req, currentUserId);

        if (req.getCustomFields() != null && !req.getCustomFields().isEmpty()) {
            customFieldValueDAO.saveValues("OPPORTUNITY", id, req.getCustomFields());
        }

        return getById(currentUserId, id);
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

        // Story 1: Cơ hội đã đóng (Thắng/Thua) không thể chuyển giai đoạn nếu chưa mở lại
        String existingStatus = (String) opp.get("status");
        if ("WON".equalsIgnoreCase(existingStatus) || "LOST".equalsIgnoreCase(existingStatus)) {
            throw new IllegalStateException("Cơ hội đã đóng (" + existingStatus + ") không thể chuyển giai đoạn. Vui lòng mở lại cơ hội trước khi thao tác.");
        }

        long ownerId = (Long) opp.get("ownerUserId");
        if (!scope.canAccessOwner(ownerId)) {
            throw new SecurityException("Bạn không có quyền truy cập dữ liệu này do giới hạn phạm vi sở hữu.");
        }

        // Validate target stage
        var targetStage = stageDAO.findById(targetStageId);
        if (targetStage == null) {
            throw new IllegalArgumentException("Giai đoạn đích không tồn tại.");
        }

        // USER STORY 2: Kiểm tra điều kiện bắt buộc rời giai đoạn hiện tại
        Long currentStageId = (Long) opp.get("stageId");
        if (currentStageId != null && currentStageId != targetStageId) {
            var currentStage = stageDAO.findById(currentStageId);
            if (currentStage != null) {
                boolean conditionRequired = Boolean.TRUE.equals(currentStage.get("conditionRequired"));
                String conditionType = (String) currentStage.get("conditionType");
                String exitCondition = (String) currentStage.get("exitCondition");
                if (exitCondition == null || exitCondition.isBlank()) {
                    exitCondition = (String) currentStage.get("requirements");
                }

                boolean isWonOrLost = Boolean.TRUE.equals(targetStage.get("isWon")) || Boolean.TRUE.equals(targetStage.get("isLost"));

                if (conditionRequired && !isWonOrLost) {
                    String missingReason = checkMissingExitCondition(id, opp, conditionType, exitCondition);
                    if (missingReason != null) {
                        // Điều kiện chưa thỏa! Kiểm tra quyền Trưởng nhóm trở lên
                        boolean canOverride = permissionDAO.hasRole(currentUserId, "ADMIN")
                                || permissionDAO.hasRole(currentUserId, "DIRECTOR")
                                || permissionDAO.hasRole(currentUserId, "TEAM_LEAD");

                        if (overrideReason != null && !overrideReason.isBlank()) {
                            if (!canOverride) {
                                throw new SecurityException("Chỉ Trưởng nhóm trở lên mới có quyền ghi đè điều kiện chuyển giai đoạn.");
                            }
                            // Ghi đè hợp lệ -> Ghi log kiểm toán
                            auditLogService.log(
                                    currentUserId,
                                    "OPPORTUNITY",
                                    String.valueOf(id),
                                    "STAGE_OVERRIDE",
                                    "Ghi đè điều kiện rời giai đoạn '" + currentStage.get("name") + "'. Lý do: " + overrideReason.trim()
                            );
                            int prob = targetStage.get("winProbability") != null ? ((Number) targetStage.get("winProbability")).intValue() : 0;
                            opportunityDAO.updateStage(id, targetStageId, prob, overrideReason.trim(), currentUserId);
                            return getById(currentUserId, id);
                        } else {
                            // Chưa nhập lý do ghi đè -> ném ngoại lệ cấu trúc để Frontend hiển thị modal
                            throw new com.crm.exception.StageConditionException(
                                    (String) currentStage.get("name"),
                                    conditionType,
                                    exitCondition,
                                    missingReason,
                                    canOverride
                            );
                        }
                    }
                }
            }
        }

        int prob = targetStage.get("winProbability") != null ? ((Number) targetStage.get("winProbability")).intValue() : 0;
        opportunityDAO.updateStage(id, targetStageId, prob);

        return getById(currentUserId, id);
    }

    private String checkMissingExitCondition(long oppId, Map<String, Object> opp, String conditionType, String exitCondition) throws Exception {
        String cond = (conditionType != null ? conditionType : "").toUpperCase();
        String text = (exitCondition != null ? exitCondition : "").toLowerCase();
        Long custId = (Long) opp.get("customerId");

        // 1. Kiểm tra cuộc gặp (Meeting)
        if ("HAS_MEETING".equals(cond) || text.contains("gặp") || text.contains("meeting")) {
            if (!hasMeeting(oppId, custId)) {
                return "Chưa có cuộc gặp (Meeting) nào được ghi nhận cho cơ hội này trong mục Hoạt động.";
            }
        }

        // 2. Kiểm tra cuộc gọi (Call)
        if ("HAS_CALL".equals(cond) || text.contains("gọi") || text.contains("call")) {
            if (!hasCall(oppId, custId)) {
                return "Chưa có cuộc gọi (Call) nào được ghi nhận cho cơ hội này trong mục Hoạt động.";
            }
        }

        // 3. Kiểm tra sản phẩm / dịch vụ
        if ("HAS_PRODUCTS".equals(cond) || text.contains("sản phẩm") || text.contains("dịch vụ")) {
            List<com.crm.dto.pipeline.OpportunityItemDTO> items = itemDAO.findByOpportunityId(oppId);
            if (items == null || items.isEmpty()) {
                return "Chưa có sản phẩm hoặc dịch vụ nào được thêm vào cơ hội để xác định giá trị hợp đồng có căn cứ.";
            }
        }

        // 4. Kiểm tra người liên hệ
        if ("HAS_CONTACT".equals(cond) || text.contains("người liên hệ") || text.contains("liên hệ")) {
            if (opp.get("contactId") == null && opp.get("contactName") == null) {
                return "Chưa gắn thông tin người liên hệ (Contact) cho cơ hội này.";
            }
        }

        // 5. Kiểm tra giá trị cơ hội > 0
        if ("MIN_AMOUNT".equals(cond) || text.contains("giá trị") || text.contains("hợp đồng")) {
            java.math.BigDecimal amt = (java.math.BigDecimal) opp.get("amount");
            if (amt == null || amt.compareTo(java.math.BigDecimal.ZERO) <= 0) {
                return "Giá trị hợp đồng của cơ hội phải lớn hơn 0 đ.";
            }
        }

        return null;
    }

    private boolean hasMeeting(long opportunityId, Long customerId) throws Exception {
        String sql = """
            SELECT COUNT(*) FROM activities 
            WHERE (opportunity_id = ? OR (opportunity_id IS NULL AND customer_id = ?))
              AND type = 'MEETING' AND is_deleted = 0
        """;
        try (Connection conn = com.crm.config.DatabaseConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setLong(1, opportunityId);
            ps.setObject(2, customerId, Types.BIGINT);
            try (ResultSet rs = ps.executeQuery()) {
                return rs.next() && rs.getInt(1) > 0;
            }
        }
    }

    private boolean hasCall(long opportunityId, Long customerId) throws Exception {
        String sql = """
            SELECT COUNT(*) FROM activities 
            WHERE (opportunity_id = ? OR (opportunity_id IS NULL AND customer_id = ?))
              AND type = 'CALL' AND is_deleted = 0
        """;
        try (Connection conn = com.crm.config.DatabaseConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setLong(1, opportunityId);
            ps.setObject(2, customerId, Types.BIGINT);
            try (ResultSet rs = ps.executeQuery()) {
                return rs.next() && rs.getInt(1) > 0;
            }
        }
    }

    public List<com.crm.dto.pipeline.OpportunityItemDTO> getItems(long currentUserId, long oppId) throws Exception {
        getById(currentUserId, oppId); // check permissions
        return itemDAO.findByOpportunityId(oppId);
    }

    public List<com.crm.dto.pipeline.OpportunityItemDTO> saveItems(long currentUserId, long oppId, List<com.crm.dto.pipeline.OpportunityItemDTO> items) throws Exception {
        DataScopeContext scope = dataScopeService.resolve(currentUserId, "opportunity", "update");
        Map<String, Object> opp = opportunityDAO.findById(oppId);
        if (opp == null) throw new NoSuchElementException("Cơ hội không tồn tại.");
        long ownerId = (Long) opp.get("ownerUserId");
        if (!scope.canAccessOwner(ownerId)) {
            throw new SecurityException("Bạn không có quyền cập nhật cơ hội này.");
        }

        String existingStatus = (String) opp.get("status");
        if ("WON".equalsIgnoreCase(existingStatus) || "LOST".equalsIgnoreCase(existingStatus)) {
            throw new IllegalStateException("Cơ hội đã đóng (" + existingStatus + ") không thể chỉnh sửa sản phẩm dịch vụ.");
        }

        itemDAO.saveItems(oppId, items);
        return itemDAO.findByOpportunityId(oppId);
    }

    public void deleteItem(long currentUserId, long oppId, long itemId) throws Exception {
        DataScopeContext scope = dataScopeService.resolve(currentUserId, "opportunity", "update");
        Map<String, Object> opp = opportunityDAO.findById(oppId);
        if (opp == null) throw new NoSuchElementException("Cơ hội không tồn tại.");
        long ownerId = (Long) opp.get("ownerUserId");
        if (!scope.canAccessOwner(ownerId)) {
            throw new SecurityException("Bạn không có quyền cập nhật cơ hội này.");
        }

        String existingStatus = (String) opp.get("status");
        if ("WON".equalsIgnoreCase(existingStatus) || "LOST".equalsIgnoreCase(existingStatus)) {
            throw new IllegalStateException("Cơ hội đã đóng (" + existingStatus + ") không thể xóa sản phẩm dịch vụ.");
        }

        itemDAO.deleteItem(itemId, oppId);
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
        return closeDeal(currentUserId, id, status, winReasonId, lossReasonId, competitorId, lostReason, null, null);
    }

    public Map<String, Object> closeDeal(
            long currentUserId,
            long id,
            String status,
            Long winReasonId,
            Long lossReasonId,
            Long competitorId,
            String lostReason,
            java.math.BigDecimal actualAmount,
            String actualCloseDate
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

        java.sql.Date sqlCloseDate = null;
        if ("WON".equalsIgnoreCase(status)) {
            if (actualAmount == null || actualAmount.compareTo(java.math.BigDecimal.ZERO) <= 0) {
                Object existingAmt = opp.get("amount");
                if (existingAmt instanceof java.math.BigDecimal && ((java.math.BigDecimal) existingAmt).compareTo(java.math.BigDecimal.ZERO) > 0) {
                    actualAmount = (java.math.BigDecimal) existingAmt;
                } else {
                    throw new IllegalArgumentException("Bắt buộc phải nhập Giá trị chốt thực tế lớn hơn 0 đ khi chốt Thắng.");
                }
            }
            if (actualCloseDate == null || actualCloseDate.isBlank()) {
                throw new IllegalArgumentException("Bắt buộc phải nhập Ngày ký hợp đồng khi chốt Thắng.");
            }
            try {
                sqlCloseDate = java.sql.Date.valueOf(actualCloseDate.trim());
            } catch (Exception e) {
                throw new IllegalArgumentException("Định dạng Ngày ký không hợp lệ (YYYY-MM-DD).");
            }
            if (winReasonId == null) {
                throw new IllegalArgumentException("Bắt buộc phải chọn Lý do Thắng khi chốt thành công cơ hội bán hàng.");
            }
        } else if ("LOST".equalsIgnoreCase(status)) {
            if (lossReasonId == null) {
                throw new IllegalArgumentException("Bắt buộc phải chọn Lý do Thua khi đóng thất bại cơ hội bán hàng.");
            }
        } else {
            throw new IllegalArgumentException("Trạng thái đóng cơ hội phải là WON hoặc LOST.");
        }

        opportunityDAO.closeDeal(id, status.toUpperCase(), winReasonId, lossReasonId, competitorId, lostReason, actualAmount, sqlCloseDate);

        auditLogService.log(
                currentUserId,
                "OPPORTUNITY",
                String.valueOf(id),
                "CLOSE_" + status.toUpperCase(),
                "Đóng cơ hội với kết quả " + status.toUpperCase()
                        + ("WON".equalsIgnoreCase(status) ? (", giá trị chốt: " + actualAmount + " đ, ngày ký: " + actualCloseDate) : "")
        );

        return getById(currentUserId, id);
    }

    public Map<String, Object> reopen(long currentUserId, long id, String reopenReason) throws Exception {
        boolean canReopen = permissionDAO.hasRole(currentUserId, "ADMIN")
                || permissionDAO.hasRole(currentUserId, "DIRECTOR")
                || permissionDAO.hasRole(currentUserId, "TEAM_LEAD");

        if (!canReopen) {
            throw new SecurityException("Chỉ Trưởng nhóm trở lên mới có quyền Mở lại cơ hội đã đóng.");
        }

        if (reopenReason == null || reopenReason.trim().isBlank()) {
            throw new IllegalArgumentException("Bắt buộc phải nhập lý do khi mở lại cơ hội.");
        }

        Map<String, Object> opp = opportunityDAO.findById(id);
        if (opp == null) {
            throw new NoSuchElementException("Cơ hội không tồn tại.");
        }

        String currentStatus = (String) opp.get("status");
        if ("OPEN".equalsIgnoreCase(currentStatus)) {
            throw new IllegalArgumentException("Cơ hội đang ở trạng thái Mở (OPEN), không cần mở lại.");
        }

        opportunityDAO.reopenDeal(id, reopenReason.trim(), currentUserId);

        auditLogService.log(
                currentUserId,
                "OPPORTUNITY",
                String.valueOf(id),
                "REOPEN",
                "Mở lại cơ hội đã đóng (" + currentStatus + "). Lý do: " + reopenReason.trim()
        );

        return getById(currentUserId, id);
    }

    public int scanAndFlagStagnantOpportunities() throws Exception {
        return opportunityDAO.scanAndFlagStagnantOpportunities();
    }

    public List<Map<String, Object>> getAssignableUsers(long currentUserId) throws Exception {
        boolean canManage = permissionDAO.hasRole(currentUserId, "ADMIN")
                || permissionDAO.hasRole(currentUserId, "DIRECTOR")
                || permissionDAO.hasRole(currentUserId, "TEAM_LEAD");
        if (!canManage) {
            throw new SecurityException("Chỉ Trưởng nhóm trở lên mới có quyền truy cập danh sách phân bổ.");
        }

        boolean allUsers = permissionDAO.hasRole(currentUserId, "ADMIN")
                || permissionDAO.hasRole(currentUserId, "DIRECTOR");

        DataScopeContext scope = dataScopeService.resolve(currentUserId, "opportunity", "update");
        Long teamId = scope.teamId();

        return opportunityDAO.getAssignableUsers(teamId, allUsers || scope.scopeType() == ScopeType.ALL);
    }

    public int reassign(long currentUserId, List<Long> oppIds, long toUserId, String reason, String notes) throws Exception {
        boolean canManage = permissionDAO.hasRole(currentUserId, "ADMIN")
                || permissionDAO.hasRole(currentUserId, "DIRECTOR")
                || permissionDAO.hasRole(currentUserId, "TEAM_LEAD");
        if (!canManage) {
            throw new SecurityException("Chỉ Trưởng nhóm trở lên mới có quyền phân bổ lại cơ hội.");
        }

        if (oppIds == null || oppIds.isEmpty()) {
            throw new IllegalArgumentException("Vui lòng chọn ít nhất một cơ hội để chuyển giao.");
        }
        if (toUserId <= 0) {
            throw new IllegalArgumentException("Vui lòng chọn nhân sự tiếp nhận cơ hội.");
        }
        if (reason == null || reason.trim().isBlank()) {
            throw new IllegalArgumentException("Bắt buộc phải nhập lý do chuyển giao cơ hội.");
        }

        DataScopeContext scope = dataScopeService.resolve(currentUserId, "opportunity", "update");
        boolean isFullAdmin = permissionDAO.hasRole(currentUserId, "ADMIN") || permissionDAO.hasRole(currentUserId, "DIRECTOR");

        if (!isFullAdmin && scope.scopeType() != ScopeType.ALL) {
            // Verify that the target user is within the manager's team hierarchy
            List<Map<String, Object>> assignable = opportunityDAO.getAssignableUsers(scope.teamId(), false);
            boolean validTarget = assignable.stream().anyMatch(u -> ((Number) u.get("id")).longValue() == toUserId);
            if (!validTarget) {
                throw new SecurityException("Nhân sự tiếp nhận không thuộc phạm vi quản lý của bạn.");
            }
        }

        // Validate each opportunity exists and is within current user's manageable scope
        for (Long oppId : oppIds) {
            Map<String, Object> opp = opportunityDAO.findById(oppId);
            if (opp == null) {
                throw new NoSuchElementException("Không tìm thấy cơ hội ID: " + oppId);
            }
            Long ownerId = (Long) opp.get("ownerUserId");
            if (ownerId != null && !scope.canAccessOwner(ownerId)) {
                throw new SecurityException("Bạn không có quyền chuyển giao cơ hội ID: " + oppId + " do giới hạn phạm vi quản lý.");
            }
        }

        return opportunityDAO.bulkReassign(oppIds, toUserId, currentUserId, reason.trim(), notes != null ? notes.trim() : null);
    }

    public List<Map<String, Object>> getAssignmentHistory(long currentUserId, long oppId) throws Exception {
        DataScopeContext scope = dataScopeService.resolve(currentUserId, "opportunity", "read");
        Map<String, Object> opp = opportunityDAO.findById(oppId);
        if (opp == null) {
            throw new NoSuchElementException("Cơ hội không tồn tại.");
        }
        Long ownerId = (Long) opp.get("ownerUserId");
        if (ownerId != null && !scope.canAccessOwner(ownerId)) {
            throw new SecurityException("Bạn không có quyền xem thông tin cơ hội này.");
        }
        return opportunityDAO.getAssignmentHistory(oppId);
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

    public List<Map<String, Object>> getFieldHistory(long currentUserId, long oppId) throws Exception {
        getById(currentUserId, oppId); // check permissions
        return opportunityDAO.getFieldHistory(oppId);
    }

    public List<Map<String, Object>> getMembers(long currentUserId, long oppId) throws Exception {
        getById(currentUserId, oppId); // check permissions
        return opportunityDAO.getMembers(oppId);
    }

    public void addMember(long currentUserId, long oppId, long targetUserId, String roleInOpportunity) throws Exception {
        Map<String, Object> opp = opportunityDAO.findById(oppId);
        if (opp == null) throw new NoSuchElementException("Không tìm thấy cơ hội ID: " + oppId);

        long ownerId = (Long) opp.get("ownerUserId");
        boolean canManage = permissionDAO.hasRole(currentUserId, "ADMIN")
                || permissionDAO.hasRole(currentUserId, "DIRECTOR")
                || permissionDAO.hasRole(currentUserId, "TEAM_LEAD")
                || ownerId == currentUserId;

        if (!canManage) {
            throw new SecurityException("Chỉ người sở hữu chính hoặc Trưởng nhóm mới có quyền thêm thành viên cùng tham gia.");
        }

        if (targetUserId == ownerId) {
            throw new IllegalArgumentException("Người này đã là người sở hữu chính của cơ hội.");
        }

        opportunityDAO.addMember(oppId, targetUserId, roleInOpportunity, currentUserId);

        auditLogService.log(currentUserId, "OPPORTUNITY", String.valueOf(oppId), "ADD_MEMBER",
                "Thêm thành viên ID " + targetUserId + " vào cơ hội với vai trò: " + roleInOpportunity);
    }

    public void removeMember(long currentUserId, long oppId, long targetUserId) throws Exception {
        Map<String, Object> opp = opportunityDAO.findById(oppId);
        if (opp == null) throw new NoSuchElementException("Không tìm thấy cơ hội ID: " + oppId);

        long ownerId = (Long) opp.get("ownerUserId");
        boolean canManage = permissionDAO.hasRole(currentUserId, "ADMIN")
                || permissionDAO.hasRole(currentUserId, "DIRECTOR")
                || permissionDAO.hasRole(currentUserId, "TEAM_LEAD")
                || ownerId == currentUserId
                || targetUserId == currentUserId; // Cho phép tự rời khỏi cơ hội

        if (!canManage) {
            throw new SecurityException("Bạn không có quyền xóa thành viên này khỏi cơ hội.");
        }

        opportunityDAO.removeMember(oppId, targetUserId);

        auditLogService.log(currentUserId, "OPPORTUNITY", String.valueOf(oppId), "REMOVE_MEMBER",
                "Xóa thành viên ID " + targetUserId + " khỏi đội ngũ cơ hội");
    }

    public Map<String, Object> logActivity(long currentUserId, long oppId, String subject, String type, String description, java.sql.Timestamp dueDate) throws Exception {
        Map<String, Object> opp = opportunityDAO.findById(oppId);
        if (opp == null) throw new NoSuchElementException("Không tìm thấy cơ hội ID: " + oppId);

        long ownerId = (Long) opp.get("ownerUserId");
        boolean isMember = opportunityDAO.isMember(oppId, currentUserId);
        boolean canManage = permissionDAO.hasRole(currentUserId, "ADMIN")
                || permissionDAO.hasRole(currentUserId, "DIRECTOR")
                || permissionDAO.hasRole(currentUserId, "TEAM_LEAD")
                || ownerId == currentUserId
                || isMember;

        if (!canManage) {
            throw new SecurityException("Bạn không có quyền ghi hoạt động cho cơ hội này.");
        }

        Long customerId = opp.get("customerId") != null ? ((Number) opp.get("customerId")).longValue() : null;
        com.crm.service.activities.ActivityService actService = new com.crm.service.activities.ActivityService();
        return actService.create(currentUserId, subject, type != null ? type : "NOTE", description, "COMPLETED",
                dueDate != null ? dueDate : new java.sql.Timestamp(System.currentTimeMillis()), customerId, oppId);
    }
}
