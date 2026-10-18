package com.crm.dao.quotes;

import com.crm.config.DatabaseConfig;
import com.crm.service.permissions.DataScopeContext;

import java.math.BigDecimal;
import java.sql.*;
import java.util.*;

public class QuoteDAO {

    public List<Map<String, Object>> search(
            DataScopeContext scope,
            String keyword,
            String status
    ) throws SQLException {
        StringBuilder sql = new StringBuilder("""
                SELECT
                    q.id,
                    q.quote_number,
                    q.title,
                    q.customer_id,
                    q.opportunity_id,
                    q.discount_percent,
                    q.subtotal,
                    q.total_amount,
                    q.status,
                    q.requires_approval,
                    q.owner_user_id,
                    q.created_at,
                    q.valid_until,
                    q.payment_terms,
                    q.delivery_terms,
                    q.terms_and_conditions,
                    q.approval_level,
                    q.rejection_reason,
                    q.sent_to_customer_at,
                    q.version,
                    q.parent_quote_id,
                    q.is_active_version,
                    c.name AS customer_name,
                    u.full_name AS owner_name,
                    o.name AS opportunity_name
                FROM quotes q
                LEFT JOIN customers c ON c.id = q.customer_id
                LEFT JOIN users u ON u.id = q.owner_user_id
                LEFT JOIN opportunities o ON o.id = q.opportunity_id
                WHERE q.is_deleted = 0
                """);

        List<Object> params = new ArrayList<>();
        if (scope != null) {
            scope.appendOwnerPredicate("q.owner_user_id", sql, params);
        }

        if (status != null && !status.isBlank()) {
            sql.append(" AND q.status = ?");
            params.add(status.trim());
        }

        if (keyword != null && !keyword.isBlank()) {
            sql.append(" AND (LOWER(q.quote_number) LIKE ? OR LOWER(q.title) LIKE ? OR LOWER(c.name) LIKE ?)");
            String kw = "%" + keyword.trim().toLowerCase() + "%";
            params.add(kw);
            params.add(kw);
            params.add(kw);
        }

        sql.append(" ORDER BY q.id DESC");

        List<Map<String, Object>> list = new ArrayList<>();
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql.toString())) {
            for (int i = 0; i < params.size(); i++) {
                stmt.setObject(i + 1, params.get(i));
            }
            try (ResultSet rs = stmt.executeQuery()) {
                while (rs.next()) {
                    list.add(mapQuote(rs));
                }
            }
        }
        return list;
    }

    public Map<String, Object> findById(long id) throws SQLException {
        String sql = """
                SELECT
                    q.id,
                    q.quote_number,
                    q.title,
                    q.customer_id,
                    q.opportunity_id,
                    q.discount_percent,
                    q.subtotal,
                    q.total_amount,
                    q.status,
                    q.requires_approval,
                    q.owner_user_id,
                    q.created_at,
                    q.valid_until,
                    q.payment_terms,
                    q.delivery_terms,
                    q.terms_and_conditions,
                    q.approval_level,
                    q.rejection_reason,
                    q.sent_to_customer_at,
                    q.version,
                    q.parent_quote_id,
                    q.is_active_version,
                    c.name AS customer_name,
                    u.full_name AS owner_name,
                    o.name AS opportunity_name
                FROM quotes q
                LEFT JOIN customers c ON c.id = q.customer_id
                LEFT JOIN users u ON u.id = q.owner_user_id
                LEFT JOIN opportunities o ON o.id = q.opportunity_id
                WHERE q.id = ? AND q.is_deleted = 0
                """;

        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setLong(1, id);
            try (ResultSet rs = stmt.executeQuery()) {
                if (rs.next()) {
                    Map<String, Object> quote = mapQuote(rs);
                    quote.put("items", findItemsByQuoteId(conn, id));
                    quote.put("approvals", getApprovalHistory(id));
                    quote.put("versions", getVersions(id));
                    return quote;
                }
            }
        }
        return null;
    }

    public List<Map<String, Object>> findItemsByQuoteId(Connection conn, long quoteId) throws SQLException {
        String sql = """
                SELECT
                    qi.id,
                    qi.quote_id,
                    qi.product_id,
                    qi.quantity,
                    qi.unit_price,
                    qi.discount_type,
                    qi.discount_percent,
                    qi.discount_amount,
                    qi.amount,
                    qi.notes,
                    p.code AS product_code,
                    p.name AS product_name,
                    p.unit AS product_unit,
                    p.floor_price,
                    p.list_price
                FROM quote_items qi
                JOIN products p ON p.id = qi.product_id
                WHERE qi.quote_id = ?
                ORDER BY qi.id ASC
                """;

        List<Map<String, Object>> items = new ArrayList<>();
        try (PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setLong(1, quoteId);
            try (ResultSet rs = stmt.executeQuery()) {
                while (rs.next()) {
                    Map<String, Object> item = new LinkedHashMap<>();
                    item.put("id", rs.getLong("id"));
                    item.put("productId", rs.getLong("product_id"));
                    item.put("productCode", rs.getString("product_code"));
                    item.put("productName", rs.getString("product_name"));
                    item.put("unit", rs.getString("product_unit"));
                    item.put("quantity", rs.getInt("quantity"));
                    item.put("unitPrice", rs.getBigDecimal("unit_price"));
                    item.put("discountType", rs.getString("discount_type") != null ? rs.getString("discount_type") : "PERCENT");
                    item.put("discountPercent", rs.getBigDecimal("discount_percent"));
                    item.put("discountAmount", rs.getBigDecimal("discount_amount"));
                    item.put("amount", rs.getBigDecimal("amount"));
                    item.put("notes", rs.getString("notes"));
                    item.put("floorPrice", rs.getBigDecimal("floor_price"));
                    item.put("listPrice", rs.getBigDecimal("list_price"));
                    items.add(item);
                }
            }
        }
        return items;
    }

    public Map<String, Object> fromOpportunity(long opportunityId) throws SQLException {
        String oppSql = """
                SELECT
                    o.id,
                    o.name,
                    o.customer_id,
                    o.contact_id,
                    o.amount,
                    c.name AS customer_name,
                    c.email AS customer_email,
                    c.phone AS customer_phone,
                    ct.name AS contact_name
                FROM opportunities o
                LEFT JOIN customers c ON c.id = o.customer_id
                LEFT JOIN contacts ct ON ct.id = o.contact_id
                WHERE o.id = ? AND o.is_deleted = 0
                """;

        Map<String, Object> opp = null;
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement stmt = conn.prepareStatement(oppSql)) {
            stmt.setLong(1, opportunityId);
            try (ResultSet rs = stmt.executeQuery()) {
                if (rs.next()) {
                    opp = new LinkedHashMap<>();
                    opp.put("opportunityId", rs.getLong("id"));
                    opp.put("opportunityName", rs.getString("name"));
                    opp.put("customerId", rs.getObject("customer_id"));
                    opp.put("customerName", rs.getString("customer_name"));
                    opp.put("customerEmail", rs.getString("customer_email"));
                    opp.put("customerPhone", rs.getString("customer_phone"));
                    opp.put("contactId", rs.getObject("contact_id"));
                    opp.put("contactName", rs.getString("contact_name"));
                    opp.put("amount", rs.getBigDecimal("amount"));
                }
            }
        }

        if (opp == null) return null;

        String itemSql = """
                SELECT
                    oi.id,
                    oi.product_id,
                    oi.product_code,
                    oi.product_name,
                    oi.quantity,
                    oi.unit,
                    oi.unit_price,
                    oi.discount_percent,
                    oi.amount,
                    oi.notes,
                    p.floor_price,
                    p.list_price
                FROM opportunity_items oi
                JOIN products p ON p.id = oi.product_id
                WHERE oi.opportunity_id = ?
                ORDER BY oi.id ASC
                """;

        List<Map<String, Object>> inheritedItems = new ArrayList<>();
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement stmt = conn.prepareStatement(itemSql)) {
            stmt.setLong(1, opportunityId);
            try (ResultSet rs = stmt.executeQuery()) {
                while (rs.next()) {
                    Map<String, Object> item = new LinkedHashMap<>();
                    item.put("productId", rs.getLong("product_id"));
                    item.put("productCode", rs.getString("product_code"));
                    item.put("productName", rs.getString("product_name"));
                    item.put("unit", rs.getString("unit"));
                    item.put("quantity", rs.getInt("quantity"));
                    item.put("unitPrice", rs.getBigDecimal("unit_price"));
                    item.put("discountType", "PERCENT");
                    item.put("discountPercent", rs.getBigDecimal("discount_percent"));
                    item.put("discountAmount", BigDecimal.ZERO);
                    item.put("amount", rs.getBigDecimal("amount"));
                    item.put("notes", rs.getString("notes"));
                    item.put("floorPrice", rs.getBigDecimal("floor_price"));
                    item.put("listPrice", rs.getBigDecimal("list_price"));
                    inheritedItems.add(item);
                }
            }
        }

        opp.put("items", inheritedItems);
        return opp;
    }

    public long create(
            String quoteNumber,
            String title,
            Long customerId,
            Long opportunityId,
            BigDecimal discountPercent,
            BigDecimal subtotal,
            BigDecimal totalAmount,
            String status,
            boolean requiresApproval,
            String approvalLevel,
            java.sql.Date validUntil,
            String paymentTerms,
            String deliveryTerms,
            String termsAndConditions,
            int version,
            Long parentQuoteId,
            boolean isActiveVersion,
            long ownerId,
            List<Map<String, Object>> items
    ) throws SQLException {
        String sql = """
                INSERT INTO quotes (
                    quote_number, title, customer_id, opportunity_id, discount_percent,
                    subtotal, total_amount, status, requires_approval, approval_level,
                    valid_until, payment_terms, delivery_terms, terms_and_conditions,
                    version, parent_quote_id, is_active_version, owner_user_id
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """;

        try (Connection conn = DatabaseConfig.getConnection()) {
            conn.setAutoCommit(false);
            long quoteId;
            try {
                try (PreparedStatement stmt = conn.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS)) {
                    stmt.setString(1, quoteNumber);
                    stmt.setString(2, title);
                    stmt.setObject(3, customerId, Types.BIGINT);
                    stmt.setObject(4, opportunityId, Types.BIGINT);
                    stmt.setBigDecimal(5, discountPercent != null ? discountPercent : BigDecimal.ZERO);
                    stmt.setBigDecimal(6, subtotal != null ? subtotal : BigDecimal.ZERO);
                    stmt.setBigDecimal(7, totalAmount != null ? totalAmount : BigDecimal.ZERO);
                    stmt.setString(8, status);
                    stmt.setBoolean(9, requiresApproval);
                    stmt.setString(10, approvalLevel != null ? approvalLevel : "NONE");
                    stmt.setDate(11, validUntil);
                    stmt.setString(12, paymentTerms);
                    stmt.setString(13, deliveryTerms);
                    stmt.setString(14, termsAndConditions);
                    stmt.setInt(15, version > 0 ? version : 1);
                    stmt.setObject(16, parentQuoteId, Types.BIGINT);
                    stmt.setBoolean(17, isActiveVersion);
                    stmt.setLong(18, ownerId);
                    stmt.executeUpdate();
                    try (ResultSet rs = stmt.getGeneratedKeys()) {
                        if (rs.next()) {
                            quoteId = rs.getLong(1);
                        } else {
                            throw new SQLException("Không lấy được id báo giá vừa tạo");
                        }
                    }
                }

                if (items != null && !items.isEmpty()) {
                    insertQuoteItems(conn, quoteId, items);
                }

                conn.commit();
                return quoteId;
            } catch (SQLException e) {
                conn.rollback();
                throw e;
            } finally {
                conn.setAutoCommit(true);
            }
        }
    }

    public void update(
            long quoteId,
            String title,
            Long customerId,
            Long opportunityId,
            BigDecimal discountPercent,
            BigDecimal subtotal,
            BigDecimal totalAmount,
            String status,
            boolean requiresApproval,
            String approvalLevel,
            java.sql.Date validUntil,
            String paymentTerms,
            String deliveryTerms,
            String termsAndConditions,
            List<Map<String, Object>> items
    ) throws SQLException {
        String sql = """
                UPDATE quotes SET
                    title = ?, customer_id = ?, opportunity_id = ?, discount_percent = ?,
                    subtotal = ?, total_amount = ?, status = ?, requires_approval = ?,
                    approval_level = ?, valid_until = ?, payment_terms = ?, delivery_terms = ?,
                    terms_and_conditions = ?
                WHERE id = ? AND is_deleted = 0
                """;

        try (Connection conn = DatabaseConfig.getConnection()) {
            conn.setAutoCommit(false);
            try {
                try (PreparedStatement stmt = conn.prepareStatement(sql)) {
                    stmt.setString(1, title);
                    stmt.setObject(2, customerId, Types.BIGINT);
                    stmt.setObject(3, opportunityId, Types.BIGINT);
                    stmt.setBigDecimal(4, discountPercent != null ? discountPercent : BigDecimal.ZERO);
                    stmt.setBigDecimal(5, subtotal != null ? subtotal : BigDecimal.ZERO);
                    stmt.setBigDecimal(6, totalAmount != null ? totalAmount : BigDecimal.ZERO);
                    stmt.setString(7, status);
                    stmt.setBoolean(8, requiresApproval);
                    stmt.setString(9, approvalLevel != null ? approvalLevel : "NONE");
                    stmt.setDate(10, validUntil);
                    stmt.setString(11, paymentTerms);
                    stmt.setString(12, deliveryTerms);
                    stmt.setString(13, termsAndConditions);
                    stmt.setLong(14, quoteId);
                    stmt.executeUpdate();
                }

                // Replace items
                String delSql = "DELETE FROM quote_items WHERE quote_id = ?";
                try (PreparedStatement delStmt = conn.prepareStatement(delSql)) {
                    delStmt.setLong(1, quoteId);
                    delStmt.executeUpdate();
                }

                if (items != null && !items.isEmpty()) {
                    insertQuoteItems(conn, quoteId, items);
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

    private void insertQuoteItems(Connection conn, long quoteId, List<Map<String, Object>> items) throws SQLException {
        String itemSql = """
                INSERT INTO quote_items (
                    quote_id, product_id, quantity, unit_price,
                    discount_type, discount_percent, discount_amount, amount, notes
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                """;
        try (PreparedStatement stmt = conn.prepareStatement(itemSql)) {
            for (Map<String, Object> it : items) {
                stmt.setLong(1, quoteId);
                stmt.setLong(2, ((Number) it.get("productId")).longValue());
                stmt.setInt(3, it.get("quantity") != null ? ((Number) it.get("quantity")).intValue() : 1);
                BigDecimal up = it.get("unitPrice") != null ? new BigDecimal(String.valueOf(it.get("unitPrice"))) : BigDecimal.ZERO;
                String discType = it.get("discountType") != null ? String.valueOf(it.get("discountType")).toUpperCase() : "PERCENT";
                BigDecimal dp = it.get("discountPercent") != null ? new BigDecimal(String.valueOf(it.get("discountPercent"))) : BigDecimal.ZERO;
                BigDecimal da = it.get("discountAmount") != null ? new BigDecimal(String.valueOf(it.get("discountAmount"))) : BigDecimal.ZERO;
                BigDecimal amt = it.get("amount") != null ? new BigDecimal(String.valueOf(it.get("amount"))) : up;
                String notes = it.get("notes") != null ? String.valueOf(it.get("notes")) : null;

                stmt.setBigDecimal(4, up);
                stmt.setString(5, discType);
                stmt.setBigDecimal(6, dp);
                stmt.setBigDecimal(7, da);
                stmt.setBigDecimal(8, amt);
                stmt.setString(9, notes);
                stmt.addBatch();
            }
            stmt.executeBatch();
        }
    }

    public void createApprovalRecord(
            long quoteId,
            long approverUserId,
            String approverName,
            String approverRole,
            String action,
            String comment,
            BigDecimal discountPercent,
            BigDecimal totalAmount
    ) throws SQLException {
        String sql = """
                INSERT INTO quote_approvals (
                    quote_id, approver_user_id, approver_name, approver_role,
                    action, comment, discount_percent, total_amount, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())
                """;
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setLong(1, quoteId);
            stmt.setLong(2, approverUserId);
            stmt.setString(3, approverName);
            stmt.setString(4, approverRole);
            stmt.setString(5, action);
            stmt.setString(6, comment);
            stmt.setBigDecimal(7, discountPercent);
            stmt.setBigDecimal(8, totalAmount);
            stmt.executeUpdate();
        }
    }

    public List<Map<String, Object>> getApprovalHistory(long quoteId) throws SQLException {
        String sql = """
                SELECT id, quote_id, approver_user_id, approver_name, approver_role,
                       action, comment, discount_percent, total_amount, created_at
                FROM quote_approvals
                WHERE quote_id = ?
                ORDER BY id ASC
                """;
        List<Map<String, Object>> list = new ArrayList<>();
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setLong(1, quoteId);
            try (ResultSet rs = stmt.executeQuery()) {
                while (rs.next()) {
                    Map<String, Object> map = new LinkedHashMap<>();
                    map.put("id", rs.getLong("id"));
                    map.put("quoteId", rs.getLong("quote_id"));
                    map.put("approverUserId", rs.getLong("approver_user_id"));
                    map.put("approverName", rs.getString("approver_name"));
                    map.put("approverRole", rs.getString("approver_role"));
                    map.put("action", rs.getString("action"));
                    map.put("comment", rs.getString("comment"));
                    map.put("discountPercent", rs.getBigDecimal("discount_percent"));
                    map.put("totalAmount", rs.getBigDecimal("total_amount"));
                    map.put("createdAt", rs.getTimestamp("created_at"));
                    list.add(map);
                }
            }
        }
        return list;
    }

    public long cloneVersion(long sourceQuoteId) throws SQLException {
        Map<String, Object> src = findById(sourceQuoteId);
        if (src == null) {
            throw new SQLException("Không tìm thấy báo giá nguồn để nhân bản phiên bản.");
        }

        Long parentId = src.get("parentQuoteId") != null ? ((Number) src.get("parentQuoteId")).longValue() : sourceQuoteId;
        int currentVersion = src.get("version") != null ? ((Number) src.get("version")).intValue() : 1;
        int nextVersion = currentVersion + 1;

        // Query max version for this quote chain to be sure
        String maxVerSql = "SELECT COALESCE(MAX(version), 1) FROM quotes WHERE id = ? OR parent_quote_id = ?";
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement stmt = conn.prepareStatement(maxVerSql)) {
            stmt.setLong(1, parentId);
            stmt.setLong(2, parentId);
            try (ResultSet rs = stmt.executeQuery()) {
                if (rs.next()) {
                    nextVersion = rs.getInt(1) + 1;
                }
            }
        }

        String baseCode = (String) src.get("quoteNumber");
        if (baseCode != null && baseCode.contains("-V")) {
            baseCode = baseCode.substring(0, baseCode.lastIndexOf("-V"));
        }
        String newQuoteNumber = baseCode + "-V" + nextVersion;
        String newTitle = (String) src.get("title") + " (v" + nextVersion + ")";

        @SuppressWarnings("unchecked")
        List<Map<String, Object>> items = (List<Map<String, Object>>) src.get("items");

        return create(
                newQuoteNumber,
                newTitle,
                (Long) src.get("customerId"),
                (Long) src.get("opportunityId"),
                (BigDecimal) src.get("discountPercent"),
                (BigDecimal) src.get("subtotal"),
                (BigDecimal) src.get("totalAmount"),
                "DRAFT", // New version starts as DRAFT
                (Boolean) src.get("requiresApproval"),
                (String) src.get("approvalLevel"),
                src.get("validUntil") != null ? (java.sql.Date) src.get("validUntil") : null,
                (String) src.get("paymentTerms"),
                (String) src.get("deliveryTerms"),
                (String) src.get("termsAndConditions"),
                nextVersion,
                parentId,
                false, // New version is not active until approved/set active
                (Long) src.get("ownerUserId"),
                items
        );
    }

    public List<Map<String, Object>> getVersions(long quoteId) throws SQLException {
        String findParentSql = "SELECT id, parent_quote_id FROM quotes WHERE id = ?";
        long parentId = quoteId;
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement stmt = conn.prepareStatement(findParentSql)) {
            stmt.setLong(1, quoteId);
            try (ResultSet rs = stmt.executeQuery()) {
                if (rs.next()) {
                    Long p = (Long) rs.getObject("parent_quote_id");
                    if (p != null) parentId = p;
                }
            }
        }

        String sql = """
                SELECT q.id, q.quote_number, q.title, q.version, q.is_active_version,
                       q.status, q.total_amount, q.discount_percent, q.created_at, q.valid_until
                FROM quotes q
                WHERE (q.id = ? OR q.parent_quote_id = ?) AND q.is_deleted = 0
                ORDER BY q.version DESC
                """;

        List<Map<String, Object>> list = new ArrayList<>();
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setLong(1, parentId);
            stmt.setLong(2, parentId);
            try (ResultSet rs = stmt.executeQuery()) {
                while (rs.next()) {
                    Map<String, Object> map = new LinkedHashMap<>();
                    map.put("id", rs.getLong("id"));
                    map.put("quoteNumber", rs.getString("quote_number"));
                    map.put("title", rs.getString("title"));
                    map.put("version", rs.getInt("version"));
                    map.put("isActiveVersion", rs.getBoolean("is_active_version"));
                    map.put("status", rs.getString("status"));
                    map.put("totalAmount", rs.getBigDecimal("total_amount"));
                    map.put("discountPercent", rs.getBigDecimal("discount_percent"));
                    map.put("createdAt", rs.getTimestamp("created_at"));
                    map.put("validUntil", rs.getDate("valid_until"));
                    list.add(map);
                }
            }
        }
        return list;
    }

    public void setActiveVersion(long quoteId) throws SQLException {
        String findParentSql = "SELECT id, parent_quote_id FROM quotes WHERE id = ?";
        long parentId = quoteId;
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement stmt = conn.prepareStatement(findParentSql)) {
            stmt.setLong(1, quoteId);
            try (ResultSet rs = stmt.executeQuery()) {
                if (rs.next()) {
                    Long p = (Long) rs.getObject("parent_quote_id");
                    if (p != null) parentId = p;
                }
            }
        }

        String resetSql = "UPDATE quotes SET is_active_version = 0 WHERE (id = ? OR parent_quote_id = ?)";
        String setSql = "UPDATE quotes SET is_active_version = 1 WHERE id = ?";

        try (Connection conn = DatabaseConfig.getConnection()) {
            conn.setAutoCommit(false);
            try {
                try (PreparedStatement stmt = conn.prepareStatement(resetSql)) {
                    stmt.setLong(1, parentId);
                    stmt.setLong(2, parentId);
                    stmt.executeUpdate();
                }
                try (PreparedStatement stmt = conn.prepareStatement(setSql)) {
                    stmt.setLong(1, quoteId);
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

    public void markSent(long quoteId) throws SQLException {
        String sql = "UPDATE quotes SET status = 'SENT', sent_to_customer_at = NOW() WHERE id = ?";
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setLong(1, quoteId);
            stmt.executeUpdate();
        }
    }

    public void updateApprovalStatus(long quoteId, String status, String rejectionReason) throws SQLException {
        String sql = """
                UPDATE quotes SET
                    status = ?,
                    rejection_reason = ?,
                    requires_approval = CASE WHEN ? = 'APPROVED' THEN 0 ELSE requires_approval END
                WHERE id = ?
                """;
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setString(1, status);
            stmt.setString(2, rejectionReason);
            stmt.setString(3, status);
            stmt.setLong(4, quoteId);
            stmt.executeUpdate();
        }
    }

    public void softDelete(long id) throws SQLException {
        String sql = "UPDATE quotes SET is_deleted = 1 WHERE id = ?";
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setLong(1, id);
            stmt.executeUpdate();
        }
    }

    public void updateStatus(long id, String status) throws SQLException {
        String sql = "UPDATE quotes SET status = ?, requires_approval = CASE WHEN ? = 'APPROVED' THEN 0 ELSE requires_approval END WHERE id = ?";
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setString(1, status);
            stmt.setString(2, status);
            stmt.setLong(3, id);
            stmt.executeUpdate();
        }
    }

    public Map<String, String> getUserInfoForApproval(long userId) throws SQLException {
        String sql = """
                SELECT u.full_name,
                       COALESCE(
                           (SELECT GROUP_CONCAT(r.code SEPARATOR ', ')
                            FROM user_roles ur
                            JOIN roles r ON r.id = ur.role_id
                            WHERE ur.user_id = u.id),
                           'USER'
                       ) AS role_code
                FROM users u
                WHERE u.id = ?
                """;
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setLong(1, userId);
            try (ResultSet rs = stmt.executeQuery()) {
                if (rs.next()) {
                    Map<String, String> res = new HashMap<>();
                    res.put("fullName", rs.getString("full_name"));
                    res.put("roleCode", rs.getString("role_code"));
                    return res;
                }
            }
        }
        Map<String, String> fallback = new HashMap<>();
        fallback.put("fullName", "User #" + userId);
        fallback.put("roleCode", "USER");
        return fallback;
    }

    private Map<String, Object> mapQuote(ResultSet rs) throws SQLException {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("id", rs.getLong("id"));
        map.put("quoteNumber", rs.getString("quote_number"));
        map.put("title", rs.getString("title"));
        map.put("customerId", rs.getObject("customer_id"));
        map.put("customerName", rs.getString("customer_name"));
        map.put("opportunityId", rs.getObject("opportunity_id"));
        map.put("opportunityName", rs.getString("opportunity_name"));
        map.put("discountPercent", rs.getBigDecimal("discount_percent"));
        map.put("subtotal", rs.getBigDecimal("subtotal"));
        map.put("totalAmount", rs.getBigDecimal("total_amount"));
        map.put("status", rs.getString("status"));
        map.put("requiresApproval", rs.getBoolean("requires_approval"));
        map.put("approvalLevel", rs.getString("approval_level"));
        map.put("validUntil", rs.getDate("valid_until"));
        map.put("paymentTerms", rs.getString("payment_terms"));
        map.put("deliveryTerms", rs.getString("delivery_terms"));
        map.put("termsAndConditions", rs.getString("terms_and_conditions"));
        map.put("rejectionReason", rs.getString("rejection_reason"));
        map.put("sentToCustomerAt", rs.getTimestamp("sent_to_customer_at"));
        map.put("version", rs.getInt("version"));
        map.put("parentQuoteId", rs.getObject("parent_quote_id"));
        map.put("isActiveVersion", rs.getBoolean("is_active_version"));
        map.put("ownerUserId", rs.getLong("owner_user_id"));
        map.put("ownerName", rs.getString("owner_name"));
        map.put("createdAt", rs.getTimestamp("created_at"));
        return map;
    }
}
