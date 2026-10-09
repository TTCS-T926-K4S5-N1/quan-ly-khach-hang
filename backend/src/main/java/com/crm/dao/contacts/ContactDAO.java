package com.crm.dao.contacts;

import com.crm.config.DatabaseConfig;
import com.crm.dto.contacts.ContactWriteRequest;

import java.sql.*;
import java.util.*;

public class ContactDAO {

    public List<Map<String, Object>> findByCustomerId(long customerId) throws SQLException {
        String sql = """
                SELECT
                    ct.id,
                    ct.customer_id,
                    c.name AS customer_name,
                    ct.name,
                    ct.title,
                    ct.email,
                    ct.phone,
                    ct.buying_role,
                    ct.is_primary,
                    ct.notes,
                    ct.owner_user_id,
                    ct.created_at,
                    ct.updated_at
                FROM contacts ct
                JOIN customers c ON c.id = ct.customer_id
                WHERE ct.customer_id = ? AND ct.is_deleted = 0
                ORDER BY ct.is_primary DESC, ct.id ASC
                """;

        List<Map<String, Object>> list = new ArrayList<>();
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setLong(1, customerId);
            try (ResultSet rs = stmt.executeQuery()) {
                while (rs.next()) {
                    Map<String, Object> item = mapContact(rs);
                    List<Map<String, Object>> history = getCompanyHistory(item.get("id") != null ? (Long) item.get("id") : 0L);
                    item.put("companyHistory", history);
                    list.add(item);
                }
            }
        }
        return list;
    }

    public Map<String, Object> findById(long id) throws SQLException {
        String sql = """
                SELECT
                    ct.id,
                    ct.customer_id,
                    c.name AS customer_name,
                    ct.name,
                    ct.title,
                    ct.email,
                    ct.phone,
                    ct.buying_role,
                    ct.is_primary,
                    ct.notes,
                    ct.owner_user_id,
                    ct.created_at,
                    ct.updated_at
                FROM contacts ct
                JOIN customers c ON c.id = ct.customer_id
                WHERE ct.id = ? AND ct.is_deleted = 0
                """;

        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setLong(1, id);
            try (ResultSet rs = stmt.executeQuery()) {
                if (rs.next()) {
                    Map<String, Object> item = mapContact(rs);
                    item.put("companyHistory", getCompanyHistory(id));
                    return item;
                }
            }
        }
        return null;
    }

    public List<Map<String, Object>> getCompanyHistory(long contactId) throws SQLException {
        String sql = """
                SELECT
                    h.id,
                    h.contact_id,
                    h.customer_id,
                    c.name AS customer_name,
                    h.job_title,
                    h.start_date,
                    h.end_date,
                    h.notes,
                    h.created_at
                FROM contact_company_history h
                JOIN customers c ON c.id = h.customer_id
                WHERE h.contact_id = ?
                ORDER BY h.id DESC
                """;

        List<Map<String, Object>> list = new ArrayList<>();
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setLong(1, contactId);
            try (ResultSet rs = stmt.executeQuery()) {
                while (rs.next()) {
                    Map<String, Object> map = new LinkedHashMap<>();
                    map.put("id", rs.getLong("id"));
                    map.put("contactId", rs.getLong("contact_id"));
                    map.put("customerId", rs.getLong("customer_id"));
                    map.put("customerName", rs.getString("customer_name"));
                    map.put("jobTitle", rs.getString("job_title"));
                    map.put("startDate", rs.getDate("start_date"));
                    map.put("endDate", rs.getDate("end_date"));
                    map.put("notes", rs.getString("notes"));
                    map.put("createdAt", rs.getTimestamp("created_at"));
                    list.add(map);
                }
            }
        }
        return list;
    }

    public long create(ContactWriteRequest req, long ownerUserId) throws SQLException {
        if (req.getCustomerId() == null) {
            throw new IllegalArgumentException("Khách hàng (customerId) là bắt buộc.");
        }

        try (Connection conn = DatabaseConfig.getConnection()) {
            conn.setAutoCommit(false);
            try {
                if (req.getIsPrimary()) {
                    try (PreparedStatement resetStmt = conn.prepareStatement(
                            "UPDATE contacts SET is_primary = 0 WHERE customer_id = ?")) {
                        resetStmt.setLong(1, req.getCustomerId());
                        resetStmt.executeUpdate();
                    }
                }

                String sql = """
                        INSERT INTO contacts (
                            customer_id, name, title, email, phone,
                            buying_role, is_primary, notes, owner_user_id
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                        """;

                long generatedId;
                try (PreparedStatement stmt = conn.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS)) {
                    stmt.setLong(1, req.getCustomerId());
                    stmt.setString(2, req.getName());
                    stmt.setString(3, req.getTitle());
                    stmt.setString(4, req.getEmail());
                    stmt.setString(5, req.getPhone());
                    stmt.setString(6, req.getBuyingRole());
                    stmt.setBoolean(7, req.getIsPrimary());
                    stmt.setString(8, req.getNotes());
                    stmt.setLong(9, ownerUserId);

                    stmt.executeUpdate();
                    try (ResultSet rs = stmt.getGeneratedKeys()) {
                        if (rs.next()) {
                            generatedId = rs.getLong(1);
                        } else {
                            throw new SQLException("Không thể lấy ID người liên hệ mới tạo");
                        }
                    }
                }

                conn.commit();
                return generatedId;
            } catch (SQLException e) {
                conn.rollback();
                throw e;
            } finally {
                conn.setAutoCommit(true);
            }
        }
    }

    public void update(long id, ContactWriteRequest req) throws SQLException {
        Map<String, Object> existing = findById(id);
        if (existing == null) {
            throw new NoSuchElementException("Không tìm thấy người liên hệ với id=" + id);
        }

        Long oldCustomerId = (Long) existing.get("customerId");
        Long newCustomerId = req.getCustomerId() != null ? req.getCustomerId() : oldCustomerId;
        boolean customerChanged = !oldCustomerId.equals(newCustomerId);

        try (Connection conn = DatabaseConfig.getConnection()) {
            conn.setAutoCommit(false);
            try {
                // Nếu chuyển công ty: ghi lại lịch sử công ty cũ
                if (customerChanged) {
                    String oldTitle = (String) existing.get("title");
                    String oldCustomerName = (String) existing.get("customerName");
                    String reason = req.getTransferReason() != null && !req.getTransferReason().isBlank()
                            ? req.getTransferReason()
                            : "Chuyển công tác từ " + oldCustomerName + " sang công ty mới.";

                    String historySql = """
                            INSERT INTO contact_company_history (
                                contact_id, customer_id, job_title, end_date, notes
                            ) VALUES (?, ?, ?, CURRENT_DATE(), ?)
                            """;
                    try (PreparedStatement hStmt = conn.prepareStatement(historySql)) {
                        hStmt.setLong(1, id);
                        hStmt.setLong(2, oldCustomerId);
                        hStmt.setString(3, oldTitle);
                        hStmt.setString(4, reason);
                        hStmt.executeUpdate();
                    }
                }

                // Nếu đánh dấu là đầu mối chính: reset các đầu mối khác của công ty mới
                if (req.getIsPrimary()) {
                    try (PreparedStatement resetStmt = conn.prepareStatement(
                            "UPDATE contacts SET is_primary = 0 WHERE customer_id = ? AND id != ?")) {
                        resetStmt.setLong(1, newCustomerId);
                        resetStmt.setLong(2, id);
                        resetStmt.executeUpdate();
                    }
                }

                String updateSql = """
                        UPDATE contacts SET
                            customer_id = ?,
                            name = ?,
                            title = ?,
                            email = ?,
                            phone = ?,
                            buying_role = ?,
                            is_primary = ?,
                            notes = ?
                        WHERE id = ? AND is_deleted = 0
                        """;

                try (PreparedStatement stmt = conn.prepareStatement(updateSql)) {
                    stmt.setLong(1, newCustomerId);
                    stmt.setString(2, req.getName());
                    stmt.setString(3, req.getTitle());
                    stmt.setString(4, req.getEmail());
                    stmt.setString(5, req.getPhone());
                    stmt.setString(6, req.getBuyingRole());
                    stmt.setBoolean(7, req.getIsPrimary());
                    stmt.setString(8, req.getNotes());
                    stmt.setLong(9, id);
                    stmt.executeUpdate();
                }

                conn.commit();
            } catch (SQLException e) {
                conn.rollback();
                throw e;
            } finally {
                conn.setAutoCommit(true);
            }
        }
    }

    public void softDelete(long id) throws SQLException {
        String sql = "UPDATE contacts SET is_deleted = 1 WHERE id = ?";
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setLong(1, id);
            stmt.executeUpdate();
        }
    }

    private Map<String, Object> mapContact(ResultSet rs) throws SQLException {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("id", rs.getLong("id"));
        map.put("customerId", rs.getLong("customer_id"));
        map.put("customerName", rs.getString("customer_name"));
        map.put("name", rs.getString("name"));
        map.put("title", rs.getString("title"));
        map.put("email", rs.getString("email"));
        map.put("phone", rs.getString("phone"));
        map.put("buyingRole", rs.getString("buying_role"));
        map.put("buyingRoleLabel", buyingRoleLabel(rs.getString("buying_role")));
        map.put("isPrimary", rs.getBoolean("is_primary"));
        map.put("notes", rs.getString("notes"));
        map.put("ownerUserId", rs.getObject("owner_user_id"));
        map.put("createdAt", rs.getTimestamp("created_at"));
        map.put("updatedAt", rs.getTimestamp("updated_at"));
        return map;
    }

    private String buyingRoleLabel(String role) {
        if (role == null) return "Người ảnh hưởng";
        return switch (role.toUpperCase()) {
            case "DECISION_MAKER" -> "Người quyết định";
            case "INFLUENCER" -> "Người ảnh hưởng";
            case "END_USER" -> "Người dùng cuối";
            case "BLOCKER" -> "Người cản trở";
            default -> role;
        };
    }
}
