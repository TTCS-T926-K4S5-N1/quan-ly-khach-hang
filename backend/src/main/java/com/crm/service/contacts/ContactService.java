package com.crm.service.contacts;

import com.crm.dao.contacts.ContactDAO;
import com.crm.dto.contacts.ContactWriteRequest;
import com.crm.service.permissions.PermissionService;

import java.util.*;

public class ContactService {

    private final ContactDAO contactDAO = new ContactDAO();
    private final PermissionService permissions = new PermissionService();

    public List<Map<String, Object>> getByCustomerId(long currentUserId, long customerId) throws Exception {
        requirePermission(currentUserId, "contact.read");
        return contactDAO.findByCustomerId(customerId);
    }

    public Map<String, Object> getById(long currentUserId, long id) throws Exception {
        requirePermission(currentUserId, "contact.read");
        Map<String, Object> contact = contactDAO.findById(id);
        if (contact == null) {
            return null;
        }
        return contact;
    }

    public List<Map<String, Object>> getHistory(long currentUserId, long id) throws Exception {
        requirePermission(currentUserId, "contact.read");
        return contactDAO.getCompanyHistory(id);
    }

    public Map<String, Object> create(long currentUserId, ContactWriteRequest req) throws Exception {
        requirePermission(currentUserId, "contact.create");
        validateRequest(req);
        long newId = contactDAO.create(req, currentUserId);
        return contactDAO.findById(newId);
    }

    public Map<String, Object> update(long currentUserId, long id, ContactWriteRequest req) throws Exception {
        requirePermission(currentUserId, "contact.update");
        validateRequest(req);
        contactDAO.update(id, req);
        return contactDAO.findById(id);
    }

    public void delete(long currentUserId, long id) throws Exception {
        requirePermission(currentUserId, "contact.delete");
        Map<String, Object> existing = contactDAO.findById(id);
        if (existing == null) {
            throw new NoSuchElementException("Người liên hệ không tồn tại.");
        }
        contactDAO.softDelete(id);
    }

    private void validateRequest(ContactWriteRequest req) {
        if (req == null) {
            throw new IllegalArgumentException("Dữ liệu người liên hệ không được để trống.");
        }
        if (req.getName() == null || req.getName().trim().isBlank()) {
            throw new IllegalArgumentException("Họ và tên người liên hệ là bắt buộc.");
        }
        if (req.getCustomerId() == null || req.getCustomerId() <= 0) {
            throw new IllegalArgumentException("Khách hàng / Doanh nghiệp liên kết là bắt buộc.");
        }
        String role = req.getBuyingRole();
        if (!Set.of("DECISION_MAKER", "INFLUENCER", "END_USER", "BLOCKER").contains(role)) {
            throw new IllegalArgumentException("Vai trò trong quyết định mua không hợp lệ.");
        }
    }

    private void requirePermission(long userId, String permission) throws Exception {
        if (!permissions.hasPermission(userId, permission)) {
            // Nếu là admin hoặc có quyền contact.* tương ứng
            if (!permissions.hasPermission(userId, "customer.read") && permission.equals("contact.read")) {
                throw new SecurityException("Bạn không có quyền thực hiện chức năng: " + permission);
            }
        }
    }
}
