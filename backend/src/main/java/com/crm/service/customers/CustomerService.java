package com.crm.service.customers;

import com.crm.dao.customers.CustomerDAO;
import com.crm.dao.customers.Customer360DAO;
import com.crm.dao.customfields.CustomFieldValueDAO;
import com.crm.dto.customers.CustomerWriteRequest;
import com.crm.service.permissions.DataScopeContext;
import com.crm.service.permissions.DataScopeService;

import java.util.*;

public class CustomerService {

    private final CustomerDAO customerDAO = new CustomerDAO();
    private final CustomFieldValueDAO customFieldValueDAO = new CustomFieldValueDAO();
    private final DataScopeService dataScopeService = new DataScopeService();

    public Map<String, Object> search(
            long currentUserId,
            String keyword,
            String status,
            int page,
            int size
    ) throws Exception {
        com.crm.dto.customers.CustomerFilterCriteria criteria = new com.crm.dto.customers.CustomerFilterCriteria();
        criteria.setKeyword(keyword);
        criteria.setStatus(status);
        criteria.setPage(page);
        criteria.setSize(size);
        return search(currentUserId, criteria);
    }

    public Map<String, Object> search(
            long currentUserId,
            com.crm.dto.customers.CustomerFilterCriteria criteria
    ) throws Exception {
        DataScopeContext scope = dataScopeService.resolve(currentUserId, "customer", "read");
        if (criteria == null) {
            criteria = new com.crm.dto.customers.CustomerFilterCriteria();
        }

        if ("MINE".equalsIgnoreCase(criteria.getOwnerFilter())) {
            criteria.setOwnerUserId(currentUserId);
        }

        long total = customerDAO.count(scope, criteria);
        int size = criteria.getSize();
        int page = criteria.getPage();
        int totalPages = (int) Math.ceil((double) total / size);

        List<Map<String, Object>> items = customerDAO.search(scope, criteria);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("items", items);
        result.put("page", page);
        result.put("size", size);
        result.put("totalItems", total);
        result.put("totalPages", totalPages);
        result.put("scope", scope.scopeType().name());
        return result;
    }

    public Map<String, Object> getById(long currentUserId, long id) throws Exception {
        DataScopeContext scope = dataScopeService.resolve(currentUserId, "customer", "read");
        Map<String, Object> customer = customerDAO.findById(id);
        if (customer == null) {
            return null;
        }

        long ownerId = (Long) customer.get("ownerUserId");
        if (!scope.canAccessOwner(ownerId)) {
            throw new SecurityException("Bạn không có quyền truy cập dữ liệu này do giới hạn phạm vi sở hữu.");
        }

        Map<String, Object> customFields = customFieldValueDAO.getValues("CUSTOMER", id);
        customer.put("customFields", customFields);

        try {
            com.crm.dao.contacts.ContactDAO contactDAO = new com.crm.dao.contacts.ContactDAO();
            List<Map<String, Object>> contacts = contactDAO.findByCustomerId(id);
            customer.put("contacts", contacts);
        } catch (Exception ignored) {
            customer.put("contacts", Collections.emptyList());
        }

        return customer;
    }

    public Map<String, Object> getCustomer360(long currentUserId, long id) throws Exception {
        if (id <= 0) throw new IllegalArgumentException("ID không hợp lệ");
        DataScopeContext scope = dataScopeService.resolve(currentUserId, "customer", "read");
        Customer360DAO customer360DAO = new Customer360DAO();
        return customer360DAO.getCustomer360(id, scope);
    }

    public Map<String, Object> create(long currentUserId, CustomerWriteRequest req) throws Exception {
        if (req == null || req.getName() == null || req.getName().isBlank()) {
            throw new IllegalArgumentException("Tên khách hàng/công ty là bắt buộc.");
        }

        dataScopeService.resolve(currentUserId, "customer", "create");
        long customerId = customerDAO.create(req, currentUserId);

        if (req.getCustomFields() != null && !req.getCustomFields().isEmpty()) {
            customFieldValueDAO.saveValues("CUSTOMER", customerId, req.getCustomFields());
        }

        return getById(currentUserId, customerId);
    }

    public Map<String, Object> update(long currentUserId, long id, CustomerWriteRequest req) throws Exception {
        if (req == null || req.getName() == null || req.getName().isBlank()) {
            throw new IllegalArgumentException("Tên khách hàng/công ty là bắt buộc.");
        }

        DataScopeContext scope = dataScopeService.resolve(currentUserId, "customer", "update");
        Map<String, Object> existing = customerDAO.findById(id);
        if (existing == null) {
            return null;
        }

        long ownerId = (Long) existing.get("ownerUserId");
        if (!scope.canAccessOwner(ownerId)) {
            throw new SecurityException("Bạn không có quyền truy cập dữ liệu này do giới hạn phạm vi sở hữu.");
        }

        customerDAO.update(id, req);

        if (req.getCustomFields() != null && !req.getCustomFields().isEmpty()) {
            customFieldValueDAO.saveValues("CUSTOMER", id, req.getCustomFields());
        }

        return getById(currentUserId, id);
    }

    public void delete(long currentUserId, long id) throws Exception {
        DataScopeContext scope = dataScopeService.resolve(currentUserId, "customer", "delete");
        Map<String, Object> existing = customerDAO.findById(id);
        if (existing == null) {
            throw new NoSuchElementException("Khách hàng không tồn tại.");
        }

        long ownerId = (Long) existing.get("ownerUserId");
        if (!scope.canAccessOwner(ownerId)) {
            throw new SecurityException("Bạn không có quyền truy cập dữ liệu này do giới hạn phạm vi sở hữu.");
        }

        customerDAO.softDelete(id);
    }

    /* =========================================================
       DUPLICATE DETECTION & MERGE (CHỈ TRƯỞNG NHÓM TRỞ LÊN GỘP)
    ========================================================= */
    private final com.crm.dao.customers.CustomerMergeDAO customerMergeDAO = new com.crm.dao.customers.CustomerMergeDAO();
    private final com.crm.dao.users.UserDAO userDAO = new com.crm.dao.users.UserDAO();

    public List<Map<String, Object>> checkDuplicates(
            long currentUserId,
            String name,
            String taxCode,
            String website,
            Long excludeId
    ) throws Exception {
        return customerMergeDAO.checkDuplicates(name, taxCode, website, excludeId);
    }

    public List<Map<String, Object>> findAllDuplicatePairs(long currentUserId) throws Exception {
        return customerMergeDAO.findAllDuplicatePairs();
    }

    public Map<String, Object> getComparison(long currentUserId, long id1, long id2) throws Exception {
        return customerMergeDAO.getSideBySideComparison(id1, id2);
    }

    public Map<String, Object> mergeCustomers(long currentUserId, com.crm.dto.customers.CustomerMergeRequest req) throws Exception {
        if (req == null || req.getMasterId() == null || req.getDuplicateId() == null) {
            throw new IllegalArgumentException("Thiếu ID khách hàng chính hoặc khách hàng trùng.");
        }

        // BẢO MẬT: Chỉ Trưởng nhóm trở lên được thực hiện gộp
        boolean isLead = customerMergeDAO.isTeamLeadOrAbove(currentUserId);
        if (!isLead) {
            throw new SecurityException("Chỉ Trưởng nhóm kinh doanh trở lên mới có quyền thực hiện gộp khách hàng.");
        }

        com.crm.model.users.User operator = userDAO.findById(currentUserId);
        String operatorName = (operator != null && operator.getFullName() != null)
                ? operator.getFullName()
                : "Người dùng #" + currentUserId;

        return customerMergeDAO.mergeCustomers(
                req.getMasterId(),
                req.getDuplicateId(),
                req.toFieldOverrides(),
                currentUserId,
                operatorName
        );
    }
}
