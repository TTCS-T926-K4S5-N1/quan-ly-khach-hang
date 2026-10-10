package com.crm.dao.customers;

import com.crm.config.DatabaseConfig;
import com.crm.dto.customers.CustomerWriteRequest;
import com.crm.service.permissions.DataScopeContext;

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
                    c.owner_user_id,
                    c.parent_id,
                    p.name AS parent_name,
                    (SELECT COUNT(*) FROM customers sub WHERE sub.parent_id = c.id AND sub.is_deleted = 0) AS subsidiary_count,
                    c.created_at,
                    u.full_name AS owner_name
                FROM customers c
                LEFT JOIN users u ON u.id = c.owner_user_id
                LEFT JOIN customers p ON p.id = c.parent_id
                WHERE c.is_deleted = 0
                """);

        List<Object> params = new ArrayList<>();
        if (scope != null) {
            scope.appendOwnerPredicate("c.owner_user_id", sql, params);
        }

        if (keyword != null && !keyword.isBlank()) {
            sql.append(" AND (LOWER(c.name) LIKE ? OR LOWER(c.email) LIKE ? OR LOWER(c.phone) LIKE ? OR LOWER(c.tax_code) LIKE ?)");
            String kw = "%" + keyword.trim().toLowerCase() + "%";
            params.add(kw);
            params.add(kw);
            params.add(kw);
            params.add(kw);
        }

        if (status != null && !status.isBlank()) {
            sql.append(" AND c.status = ?");
            params.add(status.trim());
        }

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
        StringBuilder sql = new StringBuilder("""
                SELECT COUNT(*)
                FROM customers c
                WHERE c.is_deleted = 0
                """);

        List<Object> params = new ArrayList<>();
        if (scope != null) {
            scope.appendOwnerPredicate("c.owner_user_id", sql, params);
        }

        if (keyword != null && !keyword.isBlank()) {
            sql.append(" AND (LOWER(c.name) LIKE ? OR LOWER(c.email) LIKE ? OR LOWER(c.phone) LIKE ? OR LOWER(c.tax_code) LIKE ?)");
            String kw = "%" + keyword.trim().toLowerCase() + "%";
            params.add(kw);
            params.add(kw);
            params.add(kw);
            params.add(kw);
        }

        if (status != null && !status.isBlank()) {
            sql.append(" AND c.status = ?");
            params.add(status.trim());
        }

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
                    industry_id, company_size_id, owner_user_id, parent_id
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
            stmt.setLong(10, ownerId);
            stmt.setObject(11, parentId, Types.BIGINT);

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
                    website = ?, address = ?, industry_id = ?, company_size_id = ?,
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
            stmt.setObject(10, req.getOwnerUserId(), Types.BIGINT);
            stmt.setObject(11, parentId, Types.BIGINT);
            stmt.setLong(12, id);

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
        return map;
    }
}
