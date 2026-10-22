package com.crm.service.support;

import com.crm.dao.support.SupportRequestDAO;
import com.crm.dto.support.SupportRequestWrite;
import com.crm.service.permissions.DataScopeService;
import java.sql.SQLException;
import java.util.*;

public class SupportRequestService {
    private final SupportRequestDAO dao = new SupportRequestDAO();
    private final DataScopeService scopes = new DataScopeService();

    public List<Map<String, Object>> search(long actor, Long customerId, String status, String priority, int page, int size) throws SQLException {
        pagination(page, size);
        if (customerId != null) positiveId(customerId);
        if (status != null && !SupportRequestWrite.STATUSES.contains(status)
                || priority != null && !SupportRequestWrite.PRIORITIES.contains(priority))
            throw new IllegalArgumentException("Bộ lọc trạng thái hoặc ưu tiên không hợp lệ");
        return dao.search(scopes.resolve(actor, "support", "read"), scopes.resolve(actor, "customer", "read"),
                customerId, status, priority, page, size);
    }

    public Map<String, Object> get(long actor, long id) throws SQLException {
        positiveId(id);
        return dao.find(id, scopes.resolve(actor, "support", "read"), scopes.resolve(actor, "customer", "read"));
    }

    public Map<String, Object> save(long actor, Long id, SupportRequestWrite input) throws SQLException {
        if (id != null) positiveId(id);
        if (input == null) throw new IllegalArgumentException("Thiếu dữ liệu yêu cầu hỗ trợ");
        var valid = input.validated();
        return dao.save(id, valid, actor, scopes.resolve(actor, "support", id == null ? "create" : "update"),
                scopes.resolve(actor, "customer", "read"));
    }

    public void delete(long actor, long id) throws SQLException {
        positiveId(id);
        dao.delete(id, actor, scopes.resolve(actor, "support", "delete"), scopes.resolve(actor, "customer", "read"));
    }

    public List<Map<String, Object>> risks(long actor, Long customerId, boolean onlyAtRisk, int page, int size) throws SQLException {
        pagination(page, size);
        if (customerId != null) positiveId(customerId);
        var items = dao.risks(scopes.resolve(actor, "support", "read"), scopes.resolve(actor, "customer", "read"),
                customerId, onlyAtRisk, page, size);
        if (customerId != null && items.isEmpty()) throw new NoSuchElementException("Không tìm thấy khách hàng trong phạm vi được phép");
        return items;
    }

    public static void positiveId(long id) {
        if (id <= 0) throw new IllegalArgumentException("ID phải là số nguyên dương");
    }

    public static void pagination(int page, int size) {
        if (page < 1 || size < 1 || size > 100) throw new IllegalArgumentException("page >= 1 và size từ 1 đến 100");
    }
}
