package com.crm.service.targets;

import com.crm.dao.targets.SalesTargetDAO;
import com.crm.service.audit.AuditLogService;
import com.crm.service.permissions.DataScopeContext;
import com.crm.service.permissions.DataScopeService;

import java.math.BigDecimal;
import java.util.*;

public class SalesTargetService {

    private final SalesTargetDAO targetDAO = new SalesTargetDAO();
    private final DataScopeService dataScopeService = new DataScopeService();
    private final AuditLogService auditLogService = new AuditLogService();

    public List<Map<String, Object>> search(
            long currentUserId,
            Integer year,
            Integer month,
            Integer quarter,
            String targetType
    ) throws Exception {
        DataScopeContext scope = dataScopeService.resolve(currentUserId, "opportunity", "read");
        return targetDAO.search(scope, year, month, quarter, targetType);
    }

    public Map<String, Object> getSummary(
            long currentUserId,
            Integer year,
            Integer month,
            Integer quarter
    ) throws Exception {
        DataScopeContext scope = dataScopeService.resolve(currentUserId, "opportunity", "read");
        return targetDAO.getSummary(scope, year, month, quarter);
    }

    public Map<String, Object> getById(long currentUserId, long id) throws Exception {
        dataScopeService.resolve(currentUserId, "opportunity", "read");
        return targetDAO.findById(id);
    }

    public Map<String, Object> getFormMetadata(long currentUserId) throws Exception {
        dataScopeService.resolve(currentUserId, "opportunity", "read");
        Map<String, Object> meta = new LinkedHashMap<>();
        meta.put("users", targetDAO.getAvailableUsers());
        meta.put("teams", targetDAO.getAvailableTeams());
        return meta;
    }

    public Map<String, Object> upsert(
            long currentUserId,
            Long id,
            Long userId,
            Long teamId,
            int year,
            Integer month,
            Integer quarter,
            BigDecimal targetAmount,
            int targetDeals,
            String notes
    ) throws Exception {
        DataScopeContext scope = dataScopeService.resolve(currentUserId, "opportunity", "create");

        // Staff without team/all scope can't set company targets
        if (scope.scopeType() == com.crm.service.permissions.ScopeType.SELF) {
            throw new SecurityException("Chỉ Giám đốc kinh doanh, Trưởng nhóm hoặc Quản trị viên mới có quyền khai báo chỉ tiêu doanh số.");
        }

        if (scope.scopeType() == com.crm.service.permissions.ScopeType.TEAM && scope.teamId() != null) {
            // Team lead can only set targets for their own team or team members
            if (teamId != null && !teamId.equals(scope.teamId())) {
                throw new SecurityException("Trưởng nhóm chỉ có quyền thiết lập chỉ tiêu cho nhóm của mình.");
            }
        }

        if (targetAmount == null || targetAmount.compareTo(BigDecimal.ZERO) < 0) {
            throw new IllegalArgumentException("Chỉ tiêu doanh số phải lớn hơn hoặc bằng 0.");
        }

        long targetId = targetDAO.upsertTarget(
                id,
                userId,
                teamId,
                year,
                month,
                quarter,
                targetAmount,
                targetDeals,
                notes,
                currentUserId
        );

        try {
            auditLogService.log(
                    currentUserId,
                    "SALES_TARGET",
                    String.valueOf(targetId),
                    id != null ? "UPDATE_SALES_TARGET" : "CREATE_SALES_TARGET",
                    "Khai báo chỉ tiêu doanh số: " + targetAmount + " ₫ cho kỳ " + (month != null ? ("Tháng " + month) : (quarter != null ? ("Quý " + quarter) : "Cả năm")) + "/" + year,
                    null,
                    String.valueOf(targetAmount)
            );
        } catch (Exception ignored) {}

        return targetDAO.findById(targetId);
    }

    public boolean delete(long currentUserId, long id) throws Exception {
        DataScopeContext scope = dataScopeService.resolve(currentUserId, "opportunity", "update");
        if (scope.scopeType() == com.crm.service.permissions.ScopeType.SELF) {
            throw new SecurityException("Bạn không có quyền xóa chỉ tiêu doanh số.");
        }

        Map<String, Object> existing = targetDAO.findById(id);
        if (existing == null) {
            throw new NoSuchElementException("Không tìm thấy chỉ tiêu ID #" + id);
        }

        boolean deleted = targetDAO.deleteTarget(id);
        if (deleted) {
            try {
                auditLogService.log(
                        currentUserId,
                        "SALES_TARGET",
                        String.valueOf(id),
                        "DELETE_SALES_TARGET",
                        "Xóa chỉ tiêu doanh số #" + id,
                        null,
                        "DELETED"
                );
            } catch (Exception ignored) {}
        }
        return deleted;
    }
}
