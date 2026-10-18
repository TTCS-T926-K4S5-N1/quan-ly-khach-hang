package com.crm.service.activities;

import com.crm.dao.activities.ActivityDAO;
import com.crm.dao.permissions.PermissionDAO;
import com.crm.service.permissions.DataScopeContext;
import com.crm.service.permissions.DataScopeService;
import com.crm.service.permissions.ScopeType;

import java.sql.Timestamp;
import java.util.*;

public class ActivityService {

    private final ActivityDAO activityDAO = new ActivityDAO();
    private final DataScopeService dataScopeService = new DataScopeService();
    private final PermissionDAO permissionDAO = new PermissionDAO();

    public List<Map<String, Object>> search(
            long currentUserId,
            Long customerId,
            Long opportunityId,
            String type,
            String status
    ) throws Exception {
        return search(currentUserId, customerId, null, opportunityId, type, status, null, null, null, null, null);
    }

    public List<Map<String, Object>> search(
            long currentUserId,
            Long customerId,
            Long contactId,
            Long opportunityId,
            String type,
            String status
    ) throws Exception {
        return search(currentUserId, customerId, contactId, opportunityId, type, status, null, null, null, null, null);
    }

    public List<Map<String, Object>> search(
            long currentUserId,
            Long customerId,
            Long contactId,
            Long opportunityId,
            String type,
            String status,
            String priority,
            Long ownerUserId,
            Timestamp fromDate,
            Timestamp toDate,
            Boolean includeTeam
    ) throws Exception {
        DataScopeContext scope = dataScopeService.resolve(currentUserId, "activity", "read");
        Long teamId = null;
        if (Boolean.TRUE.equals(includeTeam) && scope.teamId() != null) {
            teamId = scope.teamId();
        }

        // If specific owner requested, ensure within user's allowed scope
        if (ownerUserId != null && ownerUserId != currentUserId) {
            if (!scope.canAccessOwner(ownerUserId)) {
                throw new SecurityException("Bạn không có quyền xem công việc/hoạt động của nhân sự này.");
            }
        }

        return activityDAO.search(scope, customerId, contactId, opportunityId, type, status, priority, ownerUserId, fromDate, toDate, teamId);
    }

    public Map<String, Object> getById(long currentUserId, long id) throws Exception {
        DataScopeContext scope = dataScopeService.resolve(currentUserId, "activity", "read");
        Map<String, Object> item = activityDAO.findById(id);
        if (item == null) return null;

        long ownerId = (Long) item.get("ownerUserId");
        if (!scope.canAccessOwner(ownerId)) {
            throw new SecurityException("Bạn không có quyền truy cập dữ liệu này do giới hạn phạm vi sở hữu.");
        }
        return item;
    }

    public Map<String, Object> create(
            long currentUserId,
            String subject,
            String type,
            String description,
            String outcome,
            String status,
            String priority,
            Timestamp dueDate,
            int durationMinutes,
            Long customerId,
            Long contactId,
            Long opportunityId,
            Long assigneeUserId
    ) throws Exception {
        if (subject == null || subject.isBlank()) {
            throw new IllegalArgumentException("Tiêu đề công việc/hoạt động là bắt buộc.");
        }
        DataScopeContext scope = dataScopeService.resolve(currentUserId, "activity", "create");

        long targetOwnerId = currentUserId;
        Long assignedByUserId = null;

        if (assigneeUserId != null && assigneeUserId > 0 && assigneeUserId != currentUserId) {
            // Check if current user is allowed to assign tasks to other users
            boolean isManager = permissionDAO.hasRole(currentUserId, "ADMIN")
                    || permissionDAO.hasRole(currentUserId, "DIRECTOR")
                    || permissionDAO.hasRole(currentUserId, "TEAM_LEAD");

            if (!isManager && !scope.canAccessOwner(assigneeUserId)) {
                throw new SecurityException("Bạn không có quyền giao việc cho nhân sự này.");
            }
            targetOwnerId = assigneeUserId;
            assignedByUserId = currentUserId;
        }

        long id = activityDAO.create(
                subject, type, description, outcome, status, priority,
                dueDate, durationMinutes, customerId, contactId, opportunityId,
                targetOwnerId, assignedByUserId
        );
        return getById(currentUserId, id);
    }

    public Map<String, Object> create(
            long currentUserId,
            String subject,
            String type,
            String description,
            String outcome,
            String status,
            Timestamp dueDate,
            int durationMinutes,
            Long customerId,
            Long contactId,
            Long opportunityId
    ) throws Exception {
        return create(currentUserId, subject, type, description, outcome, status, "MEDIUM", dueDate, durationMinutes, customerId, contactId, opportunityId, null);
    }

    public Map<String, Object> update(
            long currentUserId,
            long id,
            String subject,
            String type,
            String description,
            String outcome,
            String status,
            String priority,
            Timestamp dueDate,
            int durationMinutes,
            Long contactId,
            Long assigneeUserId,
            String postponeReason
    ) throws Exception {
        if (subject == null || subject.isBlank()) {
            throw new IllegalArgumentException("Tiêu đề hoạt động là bắt buộc.");
        }
        DataScopeContext scope = dataScopeService.resolve(currentUserId, "activity", "update");
        Map<String, Object> existing = activityDAO.findById(id);
        if (existing == null) return null;

        long ownerId = (Long) existing.get("ownerUserId");
        if (!scope.canAccessOwner(ownerId)) {
            throw new SecurityException("Bạn không có quyền truy cập dữ liệu này do giới hạn phạm vi sở hữu.");
        }

        Long targetOwner = null;
        if (assigneeUserId != null && assigneeUserId > 0) {
            boolean isManager = permissionDAO.hasRole(currentUserId, "ADMIN")
                    || permissionDAO.hasRole(currentUserId, "DIRECTOR")
                    || permissionDAO.hasRole(currentUserId, "TEAM_LEAD");
            if (isManager || scope.canAccessOwner(assigneeUserId)) {
                targetOwner = assigneeUserId;
            }
        }

        activityDAO.update(id, subject, type, description, outcome, status, priority, dueDate, durationMinutes, contactId, targetOwner, postponeReason);
        return getById(currentUserId, id);
    }

    public Map<String, Object> update(
            long currentUserId,
            long id,
            String subject,
            String type,
            String description,
            String outcome,
            String status,
            Timestamp dueDate,
            int durationMinutes,
            Long contactId
    ) throws Exception {
        return update(currentUserId, id, subject, type, description, outcome, status, "MEDIUM", dueDate, durationMinutes, contactId, null, null);
    }

    public Map<String, Object> complete(long currentUserId, long id) throws Exception {
        DataScopeContext scope = dataScopeService.resolve(currentUserId, "activity", "update");
        Map<String, Object> existing = activityDAO.findById(id);
        if (existing == null) return null;

        long ownerId = (Long) existing.get("ownerUserId");
        if (!scope.canAccessOwner(ownerId)) {
            throw new SecurityException("Bạn không có quyền cập nhật công việc này.");
        }

        activityDAO.complete(id);
        return getById(currentUserId, id);
    }

    public Map<String, Object> postpone(long currentUserId, long id, String reason, Timestamp newDueDate) throws Exception {
        DataScopeContext scope = dataScopeService.resolve(currentUserId, "activity", "update");
        Map<String, Object> existing = activityDAO.findById(id);
        if (existing == null) return null;

        long ownerId = (Long) existing.get("ownerUserId");
        if (!scope.canAccessOwner(ownerId)) {
            throw new SecurityException("Bạn không có quyền cập nhật công việc này.");
        }

        activityDAO.postpone(id, reason, newDueDate);
        return getById(currentUserId, id);
    }

    public List<Map<String, Object>> getAssignableUsers(long currentUserId) throws Exception {
        DataScopeContext scope = dataScopeService.resolve(currentUserId, "activity", "read");
        boolean canAssignAll = permissionDAO.hasRole(currentUserId, "ADMIN")
                || permissionDAO.hasRole(currentUserId, "DIRECTOR")
                || scope.scopeType() == ScopeType.ALL;

        return activityDAO.getAssignableUsers(currentUserId, scope.teamId(), canAssignAll);
    }

    public void delete(long currentUserId, long id) throws Exception {
        DataScopeContext scope = dataScopeService.resolve(currentUserId, "activity", "delete");
        Map<String, Object> existing = activityDAO.findById(id);
        if (existing == null) {
            throw new NoSuchElementException("Hoạt động không tồn tại.");
        }

        long ownerId = (Long) existing.get("ownerUserId");
        if (!scope.canAccessOwner(ownerId)) {
            throw new SecurityException("Bạn không có quyền truy cập dữ liệu này do giới hạn phạm vi sở hữu.");
        }

        activityDAO.softDelete(id);
    }
}
