package com.crm.dao.customers;

import com.crm.config.DatabaseConfig;
import com.crm.dto.customers.CustomerWriteRequest;
import com.crm.service.permissions.DataScopeContext;

import com.crm.dto.customers.CustomerFilterCriteria;

import java.sql.*;
import java.util.*;

public class CustomerDAO {

    public List<Map<String, Object>> search(
            DataScopeContext scope,
            String keyword,
            String status,
            int page,
            int size
    ) throws SQLException {
        CustomerFilterCriteria criteria = new CustomerFilterCriteria();
        criteria.setKeyword(keyword);
        criteria.setStatus(status);
        criteria.setPage(page);
        criteria.setSize(size);
        return search(scope, criteria);
    }

    public List<Map<String, Object>> search(
            DataScopeContext scope,
            CustomerFilterCriteria criteria
    ) throws SQLException {
        StringBuilder sql = new StringBuilder("""
                SELECT
                    c.id,
                    c.name,
                    c.tax_code,
                    c.status,
                    c.email,
                    c.phone,
                    c.website,
                    c.address,
                    c.industry_id,
                    c.company_size_id,
                    c.region_id,
                    c.owner_user_id,
                    c.parent_id,
                    p.name AS parent_name,
                    (SELECT COUNT(*) FROM customers sub WHERE sub.parent_id = c.id AND sub.is_deleted = 0) AS subsidiary_count,
                    m_ind.name AS industry_name,
                    m_size.name AS company_size_name,
                    m_reg.name AS region_name,
                    (SELECT ct.name FROM contacts ct WHERE ct.customer_id = c.id AND ct.is_deleted = 0 ORDER BY ct.is_primary DESC, ct.id ASC LIMIT 1) AS primary_contact_name,
                    (SELECT ct.phone FROM contacts ct WHERE ct.customer_id = c.id AND ct.is_deleted = 0 ORDER BY ct.is_primary DESC, ct.id ASC LIMIT 1) AS primary_contact_phone,
                    (SELECT ct.title FROM contacts ct WHERE ct.customer_id = c.id AND ct.is_deleted = 0 ORDER BY ct.is_primary DESC, ct.id ASC LIMIT 1) AS primary_contact_role,
                    c.created_at,
                    u.full_name AS owner_name
                FROM customers c
                LEFT JOIN users u ON u.id = c.owner_user_id
                LEFT JOIN customers p ON p.id = c.parent_id
                LEFT JOIN master_data m_ind ON m_ind.id = c.industry_id
                LEFT JOIN master_data m_size ON m_size.id = c.company_size_id
                LEFT JOIN master_data m_reg ON m_reg.id = c.region_id
                WHERE c.is_deleted = 0
                """);

        List<Object> params = new ArrayList<>();
        if (scope != null) {
            scope.appendOwnerPredicate("c.owner_user_id", sql, params);
        }

        buildFilterPredicates(criteria, sql, params);

        int page = criteria != null ? criteria.getPage() : 1;
        int size = criteria != null ? criteria.getSize() : 20;
        sql.append(" ORDER BY c.id DESC LIMIT ? OFFSET ?");
        params.add(size);
        params.add((page - 1) * size);

        List<Map<String, Object>> list = new ArrayList<>();
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql.toString())) {
            for (int i = 0; i < params.size(); i++) {
                stmt.setObject(i + 1, params.get(i));
            }
            try (ResultSet rs = stmt.executeQuery()) {
                while (rs.next()) {
                    list.add(mapCustomer(rs));
                }
            }
        }
        return list;
    }

    public long count(
            DataScopeContext scope,
            String keyword,
            String status
    ) throws SQLException {
        CustomerFilterCriteria criteria = new CustomerFilterCriteria();
        criteria.setKeyword(keyword);
        criteria.setStatus(status);
        return count(scope, criteria);
    }

    public long count(
            DataScopeContext scope,
            CustomerFilterCriteria criteria
    ) throws SQLException {
        StringBuilder sql = new StringBuilder("""
                SELECT COUNT(*)
                FROM customers c
                LEFT JOIN master_data m_reg ON m_reg.id = c.region_id
                WHERE c.is_deleted = 0
                """);

        List<Object> params = new ArrayList<>();
        if (scope != null) {
            scope.appendOwnerPredicate("c.owner_user_id", sql, params);
        }

        buildFilterPredicates(criteria, sql, params);

        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql.toString())) {
            for (int i = 0; i < params.size(); i++) {
                stmt.setObject(i + 1, params.get(i));
            }
            try (ResultSet rs = stmt.executeQuery()) {
                if (rs.next()) {
                    return rs.getLong(1);
                }
            }
        }
        return 0;
    }

    private void buildFilterPredicates(CustomerFilterCriteria criteria, StringBuilder sql, List<Object> params) {
        if (criteria == null) return;

        // 1. Tìm kiếm từ khóa tổng hợp (tên, email, SĐT khách, MST, SĐT người liên hệ)
        if (criteria.getKeyword() != null && !criteria.getKeyword().isBlank()) {
            sql.append("""
                 AND (
                    LOWER(c.name) LIKE ?
                    OR LOWER(c.email) LIKE ?
                    OR LOWER(c.phone) LIKE ?
                    OR LOWER(c.tax_code) LIKE ?
                    OR EXISTS (
                        SELECT 1 FROM contacts ct
                        WHERE ct.customer_id = c.id
                          AND ct.is_deleted = 0
                          AND (ct.phone LIKE ? OR LOWER(ct.name) LIKE ?)
                    )
                 )
                """);
            String kw = "%" + criteria.getKeyword().trim().toLowerCase() + "%";
            String rawKw = "%" + criteria.getKeyword().trim() + "%";
            params.add(kw);
            params.add(kw);
            params.add(kw);
            params.add(kw);
            params.add(rawKw);
            params.add(kw);
        }

        // 2. Tìm theo tên khách hàng cụ thể
        if (criteria.getName() != null && !criteria.getName().isBlank()) {
            sql.append(" AND LOWER(c.name) LIKE ?");
            params.add("%" + criteria.getName().trim().toLowerCase() + "%");
        }

        // 3. Tìm theo mã số thuế
        if (criteria.getTaxCode() != null && !criteria.getTaxCode().isBlank()) {
            sql.append(" AND LOWER(c.tax_code) LIKE ?");
            params.add("%" + criteria.getTaxCode().trim().toLowerCase() + "%");
        }

        // 4. Tìm theo số điện thoại người liên hệ
        if (criteria.getContactPhone() != null && !criteria.getContactPhone().isBlank()) {
            sql.append(" AND EXISTS (SELECT 1 FROM contacts ct WHERE ct.customer_id = c.id AND ct.is_deleted = 0 AND ct.phone LIKE ?)");
            params.add("%" + criteria.getContactPhone().trim() + "%");
        }

        // 5. Lọc theo trạng thái
        if (criteria.getStatus() != null && !criteria.getStatus().isBlank()) {
            sql.append(" AND c.status = ?");
            params.add(criteria.getStatus().trim());
        }

        // 6. Lọc theo ngành nghề
        if (criteria.getIndustryId() != null && criteria.getIndustryId() > 0) {
            sql.append(" AND c.industry_id = ?");
            params.add(criteria.getIndustryId());
        }

        // 7. Lọc theo quy mô công ty
        if (criteria.getCompanySizeId() != null && criteria.getCompanySizeId() > 0) {
            sql.append(" AND c.company_size_id = ?");
            params.add(criteria.getCompanySizeId());
        }

        // 8. Lọc theo khu vực (ID)
        if (criteria.getRegionId() != null && criteria.getRegionId() > 0) {
            sql.append(" AND c.region_id = ?");
            params.add(criteria.getRegionId());
        }

        // 9. Lọc theo khu vực (tên khu vực / từ khóa địa chỉ)
        if (criteria.getRegion() != null && !criteria.getRegion().isBlank()) {
            sql.append(" AND (LOWER(c.address) LIKE ? OR LOWER(m_reg.name) LIKE ?)");
            String rKw = "%" + criteria.getRegion().trim().toLowerCase() + "%";
            params.add(rKw);
            params.add(rKw);
        }

        // 10. Lọc theo người sở hữu
        if (criteria.getOwnerUserId() != null && criteria.getOwnerUserId() > 0) {
            sql.append(" AND c.owner_user_id = ?");
            params.add(criteria.getOwnerUserId());
        }
    }

    public Map<String, Object> findById(long id) throws SQLException {
        String sql = """
                SELECT
                    c.id,
                    c.name,
                    c.tax_code,
                    c.status,
                    c.email,
                    c.phone,
                    c.website,
                    c.address,
                    c.industry_id,
                    c.company_size_id,
                    c.owner_user_id,
                    c.parent_id,
                    p.name AS parent_name,
                    (SELECT COUNT(*) FROM customers sub WHERE sub.parent_id = c.id AND sub.is_deleted = 0) AS subsidiary_count,
                    c.created_at,
                    u.full_name AS owner_name
                FROM customers c
                LEFT JOIN users u ON u.id = c.owner_user_id
                LEFT JOIN customers p ON p.id = c.parent_id
                WHERE c.id = ? AND c.is_deleted = 0
                """;

        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setLong(1, id);
            try (ResultSet rs = stmt.executeQuery()) {
                if (rs.next()) {
                    return mapCustomer(rs);
                }
            }
        }
        return null;
    }

    public long create(CustomerWriteRequest req, long defaultOwnerId) throws SQLException {
        String sql = """
                INSERT INTO customers (
                    name, tax_code, status, email, phone, website, address,
                    industry_id, company_size_id, region_id, owner_user_id, parent_id
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """;

        long ownerId = req.getOwnerUserId() != null ? req.getOwnerUserId() : defaultOwnerId;
        Long parentId = (req.getParentId() != null && req.getParentId() > 0) ? req.getParentId() : null;

        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS)) {
            stmt.setString(1, req.getName());
            stmt.setString(2, req.getTaxCode());
            stmt.setString(3, req.getStatus());
            stmt.setString(4, req.getEmail());
            stmt.setString(5, req.getPhone());
            stmt.setString(6, req.getWebsite());
            stmt.setString(7, req.getAddress());
            stmt.setObject(8, req.getIndustryId(), Types.BIGINT);
            stmt.setObject(9, req.getCompanySizeId(), Types.BIGINT);
            stmt.setObject(10, req.getRegionId(), Types.BIGINT);
            stmt.setLong(11, ownerId);
            stmt.setObject(12, parentId, Types.BIGINT);

            stmt.executeUpdate();
            try (ResultSet rs = stmt.getGeneratedKeys()) {
                if (rs.next()) {
                    return rs.getLong(1);
                }
            }
        }
        throw new SQLException("Không thể tạo bản ghi khách hàng");
    }

    public void update(long id, CustomerWriteRequest req) throws SQLException {
        String sql = """
                UPDATE customers SET
                    name = ?, tax_code = ?, status = ?, email = ?, phone = ?,
                    website = ?, address = ?, industry_id = ?, company_size_id = ?, region_id = ?,
                    owner_user_id = COALESCE(?, owner_user_id),
                    parent_id = ?
                WHERE id = ? AND is_deleted = 0
                """;

        Long parentId = null;
        if (req.getParentId() != null && req.getParentId() > 0 && req.getParentId() != id) {
            parentId = req.getParentId();
        }

        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setString(1, req.getName());
            stmt.setString(2, req.getTaxCode());
            stmt.setString(3, req.getStatus());
            stmt.setString(4, req.getEmail());
            stmt.setString(5, req.getPhone());
            stmt.setString(6, req.getWebsite());
            stmt.setString(7, req.getAddress());
            stmt.setObject(8, req.getIndustryId(), Types.BIGINT);
            stmt.setObject(9, req.getCompanySizeId(), Types.BIGINT);
            stmt.setObject(10, req.getRegionId(), Types.BIGINT);
            stmt.setObject(11, req.getOwnerUserId(), Types.BIGINT);
            stmt.setObject(12, parentId, Types.BIGINT);
            stmt.setLong(13, id);

            stmt.executeUpdate();
        }
    }

    public void assignParent(long customerId, Long parentId) throws SQLException {
        if (parentId != null && parentId > 0) {
            if (parentId == customerId) {
                throw new IllegalArgumentException("Khách hàng không thể tự làm công ty con của chính mình.");
            }
            // Kiểm tra cyclic: nếu parentId đang trỏ tới customerId
            try (Connection conn = DatabaseConfig.getConnection()) {
                String checkSql = "SELECT parent_id FROM customers WHERE id = ? AND is_deleted = 0";
                try (PreparedStatement checkStmt = conn.prepareStatement(checkSql)) {
                    checkStmt.setLong(1, parentId);
                    try (ResultSet rs = checkStmt.executeQuery()) {
                        if (rs.next()) {
                            Long pParentId = (Long) rs.getObject("parent_id");
                            if (pParentId != null && pParentId == customerId) {
                                throw new IllegalArgumentException("Không thể gán vì công ty đối tác đang trực thuộc khách hàng này.");
                            }
                        } else {
                            throw new IllegalArgumentException("Công ty mẹ không tồn tại.");
                        }
                    }
                }
                String updateSql = "UPDATE customers SET parent_id = ? WHERE id = ? AND is_deleted = 0";
                try (PreparedStatement updateStmt = conn.prepareStatement(updateSql)) {
                    updateStmt.setLong(1, parentId);
                    updateStmt.setLong(2, customerId);
                    updateStmt.executeUpdate();
                }
            }
        } else {
            // Gỡ bỏ công ty mẹ
            try (Connection conn = DatabaseConfig.getConnection()) {
                String updateSql = "UPDATE customers SET parent_id = NULL WHERE id = ? AND is_deleted = 0";
                try (PreparedStatement updateStmt = conn.prepareStatement(updateSql)) {
                    updateStmt.setLong(1, customerId);
                    updateStmt.executeUpdate();
                }
            }
        }
    }

    public List<Map<String, Object>> getSubsidiaries(long parentId) throws SQLException {
        String sql = """
                SELECT
                    c.id,
                    c.name,
                    c.tax_code,
                    c.status,
                    c.email,
                    c.phone,
                    c.website,
                    c.address,
                    c.owner_user_id,
                    u.full_name AS owner_name,
                    c.created_at,
                    COALESCE(SUM(CASE WHEN o.status = 'WON' THEN o.amount ELSE 0 END), 0) AS won_amount,
                    COALESCE(SUM(CASE WHEN o.status = 'OPEN' THEN o.amount ELSE 0 END), 0) AS open_amount,
                    COUNT(DISTINCT o.id) AS opportunities_count,
                    (SELECT COUNT(*) FROM contacts ct WHERE ct.customer_id = c.id AND ct.is_deleted = 0) AS contacts_count
                FROM customers c
                LEFT JOIN users u ON u.id = c.owner_user_id
                LEFT JOIN opportunities o ON o.customer_id = c.id AND o.is_deleted = 0
                WHERE c.parent_id = ? AND c.is_deleted = 0
                GROUP BY c.id, c.name, c.tax_code, c.status, c.email, c.phone, c.website, c.address, c.owner_user_id, u.full_name, c.created_at
                ORDER BY won_amount DESC, c.id ASC
                """;

        List<Map<String, Object>> list = new ArrayList<>();
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setLong(1, parentId);
            try (ResultSet rs = stmt.executeQuery()) {
                while (rs.next()) {
                    Map<String, Object> map = new LinkedHashMap<>();
                    map.put("id", rs.getLong("id"));
                    map.put("name", rs.getString("name"));
                    map.put("companyName", rs.getString("name"));
                    map.put("taxCode", rs.getString("tax_code"));
                    map.put("status", rs.getString("status"));
                    map.put("email", rs.getString("email"));
                    map.put("phone", rs.getString("phone"));
                    map.put("website", rs.getString("website"));
                    map.put("address", rs.getString("address"));
                    map.put("ownerUserId", rs.getLong("owner_user_id"));
                    map.put("ownerName", rs.getString("owner_name") != null ? rs.getString("owner_name") : "CRM User");
                    map.put("createdAt", rs.getTimestamp("created_at"));
                    map.put("wonAmount", rs.getBigDecimal("won_amount"));
                    map.put("openAmount", rs.getBigDecimal("open_amount"));
                    map.put("opportunitiesCount", rs.getInt("opportunities_count"));
                    map.put("contactsCount", rs.getInt("contacts_count"));
                    list.add(map);
                }
            }
        }
        return list;
    }

    public List<Map<String, Object>> getParentCandidates(long excludeCustomerId) throws SQLException {
        String sql = """
                SELECT id, name, tax_code
                FROM customers
                WHERE is_deleted = 0
                  AND id != ?
                  AND (parent_id IS NULL OR parent_id != ?)
                ORDER BY name ASC
                """;

        List<Map<String, Object>> list = new ArrayList<>();
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setLong(1, excludeCustomerId);
            stmt.setLong(2, excludeCustomerId);
            try (ResultSet rs = stmt.executeQuery()) {
                while (rs.next()) {
                    Map<String, Object> map = new LinkedHashMap<>();
                    map.put("id", rs.getLong("id"));
                    map.put("name", rs.getString("name"));
                    map.put("taxCode", rs.getString("tax_code"));
                    list.add(map);
                }
            }
        }
        return list;
    }

    public void softDelete(long id) throws SQLException {
        String sql = "UPDATE customers SET is_deleted = 1 WHERE id = ?";
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setLong(1, id);
            stmt.executeUpdate();
        }
    }

    private Map<String, Object> mapCustomer(ResultSet rs) throws SQLException {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("id", rs.getLong("id"));
        map.put("name", rs.getString("name"));
        map.put("companyName", rs.getString("name"));
        map.put("taxCode", rs.getString("tax_code"));
        map.put("status", rs.getString("status"));
        map.put("email", rs.getString("email"));
        map.put("phone", rs.getString("phone"));
        map.put("website", rs.getString("website"));
        map.put("address", rs.getString("address"));
        map.put("industryId", rs.getObject("industry_id"));
        map.put("companySizeId", rs.getObject("company_size_id"));
        map.put("ownerUserId", rs.getLong("owner_user_id"));
        map.put("ownerName", rs.getString("owner_name"));
        map.put("owner", rs.getString("owner_name"));
        map.put("parentId", rs.getObject("parent_id"));
        map.put("parentName", rs.getString("parent_name"));
        map.put("subsidiaryCount", rs.getInt("subsidiary_count"));
        map.put("createdAt", rs.getTimestamp("created_at"));

        // Thông tin phân loại & khu vực mở rộng
        try {
            map.put("regionId", rs.getObject("region_id"));
            map.put("regionName", rs.getString("region_name") != null ? rs.getString("region_name") : "—");
            map.put("industryName", rs.getString("industry_name") != null ? rs.getString("industry_name") : "—");
            map.put("companySizeName", rs.getString("company_size_name") != null ? rs.getString("company_size_name") : "—");
        } catch (SQLException ignored) {
            map.put("regionId", null);
            map.put("regionName", "—");
            map.put("industryName", "—");
            map.put("companySizeName", "—");
        }

        // Người liên hệ chính & SĐT gọi ngay phục vụ dựng danh sách gọi trong tuần
        try {
            map.put("primaryContactName", rs.getString("primary_contact_name"));
            map.put("primaryContactPhone", rs.getString("primary_contact_phone"));
            map.put("primaryContactRole", rs.getString("primary_contact_role"));
        } catch (SQLException ignored) {
            map.put("primaryContactName", null);
            map.put("primaryContactPhone", null);
            map.put("primaryContactRole", null);
        }

        return map;
    }
}
