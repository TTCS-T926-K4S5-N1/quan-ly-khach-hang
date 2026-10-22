package com.crm.service.activities;

import com.crm.dao.activities.ActivityDAO;
import com.crm.service.permissions.DataScopeContext;
import com.crm.service.permissions.DataScopeService;

import java.sql.Timestamp;
import java.util.*;

public class ActivityService {

    private final ActivityDAO activityDAO = new ActivityDAO();
    private final DataScopeService dataScopeService = new DataScopeService();

    public List<Map<String, Object>> search(
            long currentUserId,
            Long customerId,
            Long opportunityId,
            String type,
            String status
    ) throws Exception {
        return search(currentUserId, customerId, opportunityId, type, status, null, null, null, null);
    }

    public List<Map<String, Object>> search(
            long currentUserId,
            Long customerId,
            Long opportunityId,
            String type,
            String status,
            Long ownerId,
            Timestamp fromDate,
            Timestamp toDate,
            String keyword
    ) throws Exception {
        DataScopeContext scope = dataScopeService.resolve(currentUserId, "activity", "read");
        if (ownerId != null && !scope.canAccessOwner(ownerId)) {
            throw new SecurityException("Bạn không có quyền truy cập hoạt động của thành viên này.");
        }
        return activityDAO.search(scope, customerId, opportunityId, type, status, ownerId, fromDate, toDate, keyword);
    }

    public List<Map<String, Object>> getAccessibleMembers(long currentUserId) throws Exception {
        DataScopeContext scope = dataScopeService.resolve(currentUserId, "activity", "read");
        return activityDAO.findAccessibleMembers(scope);
    }

    public List<Map<String, Object>> getMemberSummary(
            long currentUserId,
            Long ownerId,
            String type,
            String status,
            Timestamp fromDate,
            Timestamp toDate,
            Long customerId,
            Long opportunityId
    ) throws Exception {
        DataScopeContext scope = dataScopeService.resolve(currentUserId, "activity", "read");
        if (ownerId != null && !scope.canAccessOwner(ownerId)) {
            throw new SecurityException("Bạn không có quyền truy cập hoạt động của thành viên này.");
        }
        return activityDAO.getMemberActivitySummary(scope, ownerId, type, status, fromDate, toDate, customerId, opportunityId);
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
            String status,
            Timestamp dueDate,
            Long customerId,
            Long opportunityId
    ) throws Exception {
        return create(currentUserId, subject, type, description, status, dueDate, customerId, opportunityId, null);
    }

    public Map<String, Object> create(
            long currentUserId,
            String subject,
            String type,
            String description,
            String status,
            Timestamp dueDate,
            Long customerId,
            Long opportunityId,
            Long assignedOwnerId
    ) throws Exception {
        if (subject == null || subject.isBlank()) {
            throw new IllegalArgumentException("Tiêu đề hoạt động là bắt buộc.");
        }
        DataScopeContext scope = dataScopeService.resolve(currentUserId, "activity", "create");
        long ownerId = currentUserId;
        if (assignedOwnerId != null) {
            if (!scope.canAccessOwner(assignedOwnerId)) {
                throw new SecurityException("Bạn không có quyền gán hoạt động cho thành viên này.");
            }
            ownerId = assignedOwnerId;
        }
        long id = activityDAO.create(subject, type, description, status, dueDate, customerId, opportunityId, ownerId);
        return getById(currentUserId, id);
    }

    public Map<String, Object> update(
            long currentUserId,
            long id,
            String subject,
            String type,
            String description,
            String status,
            Timestamp dueDate
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

        activityDAO.update(id, subject, type, description, status, dueDate);
        return getById(currentUserId, id);
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
