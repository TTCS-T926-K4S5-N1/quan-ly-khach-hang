package com.crm.dao.contracts;

import com.crm.config.DatabaseConfig;
import com.crm.service.permissions.DataScopeContext;

import java.math.BigDecimal;
import java.sql.*;
import java.util.*;

public class ContractDAO {

    public boolean isContractNumberExists(String contractNumber) throws SQLException {
        String sql = "SELECT 1 FROM contracts WHERE contract_number = ? AND is_deleted = 0 LIMIT 1";
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setString(1, contractNumber);
            try (ResultSet rs = stmt.executeQuery()) {
                return rs.next();
            }
        }
    }

    public long create(
            String contractNumber,
            String title,
            long customerId,
            Long opportunityId,
            Long quoteId,
            BigDecimal subtotal,
            BigDecimal discountPercent,
            BigDecimal totalAmount,
            java.sql.Date signedDate,
            java.sql.Date effectiveDate,
            java.sql.Date expiryDate,
            String paymentTerms,
            String status,
            long ownerUserId,
            List<Map<String, Object>> items
    ) throws SQLException {
        if (isContractNumberExists(contractNumber)) {
            throw new IllegalArgumentException("Số hợp đồng '" + contractNumber + "' đã tồn tại trong hệ thống. Vui lòng nhập số khác.");
        }

        String insertContractSql = """
                INSERT INTO contracts (
                    contract_number, title, customer_id, opportunity_id, quote_id,
                    subtotal, discount_percent, total_amount, signed_date,
                    effective_date, expiry_date, payment_terms, status, owner_user_id
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """;

        try (Connection conn = DatabaseConfig.getConnection()) {
            conn.setAutoCommit(false);
            long contractId;

            try {
                try (PreparedStatement stmt = conn.prepareStatement(insertContractSql, Statement.RETURN_GENERATED_KEYS)) {
                    stmt.setString(1, contractNumber);
                    stmt.setString(2, title);
                    stmt.setLong(3, customerId);
                    stmt.setObject(4, opportunityId, Types.BIGINT);
                    stmt.setObject(5, quoteId, Types.BIGINT);
                    stmt.setBigDecimal(6, subtotal != null ? subtotal : BigDecimal.ZERO);
                    stmt.setBigDecimal(7, discountPercent != null ? discountPercent : BigDecimal.ZERO);
                    stmt.setBigDecimal(8, totalAmount != null ? totalAmount : BigDecimal.ZERO);
                    stmt.setDate(9, signedDate);
                    stmt.setDate(10, effectiveDate);
                    stmt.setDate(11, expiryDate);
                    stmt.setString(12, paymentTerms);
                    stmt.setString(13, status != null ? status : "ACTIVE");
                    stmt.setLong(14, ownerUserId);
                    stmt.executeUpdate();

                    try (ResultSet rs = stmt.getGeneratedKeys()) {
                        if (rs.next()) {
                            contractId = rs.getLong(1);
                        } else {
                            throw new SQLException("Không lấy được ID hợp đồng vừa tạo");
                        }
                    }
                }

                // Insert contract items
                if (items != null && !items.isEmpty()) {
                    String itemSql = """
                            INSERT INTO contract_items (
                                contract_id, product_id, quantity, unit_price,
                                discount_type, discount_percent, discount_amount, amount, notes
                            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                            """;
                    try (PreparedStatement itemStmt = conn.prepareStatement(itemSql)) {
                        for (Map<String, Object> it : items) {
                            itemStmt.setLong(1, contractId);
                            itemStmt.setLong(2, ((Number) it.get("productId")).longValue());
                            itemStmt.setInt(3, it.get("quantity") != null ? ((Number) it.get("quantity")).intValue() : 1);
                            itemStmt.setBigDecimal(4, it.get("unitPrice") != null ? new BigDecimal(String.valueOf(it.get("unitPrice"))) : BigDecimal.ZERO);
                            itemStmt.setString(5, it.get("discountType") != null ? String.valueOf(it.get("discountType")).toUpperCase() : "PERCENT");
                            itemStmt.setBigDecimal(6, it.get("discountPercent") != null ? new BigDecimal(String.valueOf(it.get("discountPercent"))) : BigDecimal.ZERO);
                            itemStmt.setBigDecimal(7, it.get("discountAmount") != null ? new BigDecimal(String.valueOf(it.get("discountAmount"))) : BigDecimal.ZERO);
                            itemStmt.setBigDecimal(8, it.get("amount") != null ? new BigDecimal(String.valueOf(it.get("amount"))) : BigDecimal.ZERO);
                            itemStmt.setString(9, it.get("notes") != null ? String.valueOf(it.get("notes")) : null);
                            itemStmt.addBatch();
                        }
                        itemStmt.executeBatch();
                    }
                }

                // Story 1 AC: Cơ hội tương ứng tự động chuyển sang Đóng thắng (WON) với giá trị đúng bằng giá trị hợp đồng
                if (opportunityId != null && opportunityId > 0) {
                    // Find WON stage ID
                    long wonStageId = 5;
                    String findWonStageSql = "SELECT id FROM pipeline_stages WHERE is_won = 1 ORDER BY id ASC LIMIT 1";
                    try (PreparedStatement ps = conn.prepareStatement(findWonStageSql);
                         ResultSet rs = ps.executeQuery()) {
                        if (rs.next()) {
                            wonStageId = rs.getLong("id");
                        }
                    }

                    String updateOppSql = """
                            UPDATE opportunities SET
                                status = 'WON',
                                stage_id = ?,
                                probability = 100,
                                amount = ?,
                                actual_close_date = ?,
                                stage_updated_at = NOW(),
                                updated_at = NOW()
                            WHERE id = ?
                            """;
                    try (PreparedStatement oppStmt = conn.prepareStatement(updateOppSql)) {
                        oppStmt.setLong(1, wonStageId);
                        oppStmt.setBigDecimal(2, totalAmount != null ? totalAmount : BigDecimal.ZERO);
                        oppStmt.setDate(3, signedDate);
                        oppStmt.setLong(4, opportunityId);
                        oppStmt.executeUpdate();
                    }

                    // Ghi nhận hoạt động vào dòng thời gian cơ hội
                    String activitySql = """
                            INSERT INTO activities (
                                type, subject, description, due_date, status,
                                customer_id, opportunity_id, owner_user_id, created_at
                            ) VALUES ('CONTRACT', ?, ?, NOW(), 'COMPLETED', ?, ?, ?, NOW())
                            """;
                    try (PreparedStatement actStmt = conn.prepareStatement(activitySql)) {
                        actStmt.setString(1, "Ký kết hợp đồng: " + contractNumber);
                        actStmt.setString(2, "Hợp đồng kinh tế " + contractNumber + " đã được xác lập thành công với giá trị " + totalAmount + " ₫. Cơ hội tự động chuyển sang Đóng Thắng (WON).");
                        actStmt.setLong(3, customerId);
                        actStmt.setLong(4, opportunityId);
                        actStmt.setLong(5, ownerUserId);
                        actStmt.executeUpdate();
                    }
                }

                // Cập nhật trạng thái báo giá sang CONVERTED và gắn contract_id
                if (quoteId != null && quoteId > 0) {
                    String updateQuoteSql = "UPDATE quotes SET status = 'CONVERTED', contract_id = ? WHERE id = ?";
                    try (PreparedStatement qStmt = conn.prepareStatement(updateQuoteSql)) {
                        qStmt.setLong(1, contractId);
                        qStmt.setLong(2, quoteId);
                        qStmt.executeUpdate();
                    }
                }

                conn.commit();
                return contractId;
            } catch (SQLException e) {
                conn.rollback();
                throw e;
            } finally {
                conn.setAutoCommit(true);
            }
        }
    }

    public Map<String, Object> findById(long id) throws SQLException {
        String sql = """
                SELECT
                    ct.id,
                    ct.contract_number,
                    ct.title,
                    ct.customer_id,
                    ct.opportunity_id,
                    ct.quote_id,
                    ct.subtotal,
                    ct.discount_percent,
                    ct.total_amount,
                    ct.signed_date,
                    ct.effective_date,
                    ct.expiry_date,
                    ct.payment_terms,
                    ct.status,
                    ct.owner_user_id,
                    ct.created_at,
                    c.name AS customer_name,
                    c.email AS customer_email,
                    c.phone AS customer_phone,
                    c.address AS customer_address,
                    c.tax_code AS customer_tax_code,
                    o.name AS opportunity_name,
                    q.quote_number,
                    u.full_name AS owner_name
                FROM contracts ct
                LEFT JOIN customers c ON c.id = ct.customer_id
                LEFT JOIN opportunities o ON o.id = ct.opportunity_id
                LEFT JOIN quotes q ON q.id = ct.quote_id
                LEFT JOIN users u ON u.id = ct.owner_user_id
                WHERE ct.id = ? AND ct.is_deleted = 0
                """;

        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setLong(1, id);
            try (ResultSet rs = stmt.executeQuery()) {
                if (rs.next()) {
                    Map<String, Object> map = mapContract(rs);
                    map.put("items", findItemsByContractId(conn, id));
                    return map;
                }
            }
        }
        return null;
    }

    public List<Map<String, Object>> findItemsByContractId(Connection conn, long contractId) throws SQLException {
        String sql = """
                SELECT
                    ci.id,
                    ci.contract_id,
                    ci.product_id,
                    ci.quantity,
                    ci.unit_price,
                    ci.discount_type,
                    ci.discount_percent,
                    ci.discount_amount,
                    ci.amount,
                    ci.notes,
                    p.code AS product_code,
                    p.name AS product_name,
                    p.unit AS product_unit
                FROM contract_items ci
                JOIN products p ON p.id = ci.product_id
                WHERE ci.contract_id = ?
                ORDER BY ci.id ASC
                """;
        List<Map<String, Object>> items = new ArrayList<>();
        try (PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setLong(1, contractId);
            try (ResultSet rs = stmt.executeQuery()) {
                while (rs.next()) {
                    Map<String, Object> item = new LinkedHashMap<>();
                    item.put("id", rs.getLong("id"));
                    item.put("contractId", rs.getLong("contract_id"));
                    item.put("productId", rs.getLong("product_id"));
                    item.put("productCode", rs.getString("product_code"));
                    item.put("productName", rs.getString("product_name"));
                    item.put("productUnit", rs.getString("product_unit"));
                    item.put("quantity", rs.getInt("quantity"));
                    item.put("unitPrice", rs.getBigDecimal("unit_price"));
                    item.put("discountType", rs.getString("discount_type"));
                    item.put("discountPercent", rs.getBigDecimal("discount_percent"));
                    item.put("discountAmount", rs.getBigDecimal("discount_amount"));
                    item.put("amount", rs.getBigDecimal("amount"));
                    item.put("notes", rs.getString("notes"));
                    items.add(item);
                }
            }
        }
        return items;
    }

    public List<Map<String, Object>> search(DataScopeContext scope, String keyword, String status) throws SQLException {
        StringBuilder sql = new StringBuilder("""
                SELECT
                    ct.id,
                    ct.contract_number,
                    ct.title,
                    ct.customer_id,
                    ct.opportunity_id,
                    ct.quote_id,
                    ct.subtotal,
                    ct.discount_percent,
                    ct.total_amount,
                    ct.signed_date,
                    ct.effective_date,
                    ct.expiry_date,
                    ct.payment_terms,
                    ct.status,
                    ct.owner_user_id,
                    ct.created_at,
                    c.name AS customer_name,
                    o.name AS opportunity_name,
                    q.quote_number,
                    u.full_name AS owner_name
                FROM contracts ct
                LEFT JOIN customers c ON c.id = ct.customer_id
                LEFT JOIN opportunities o ON o.id = ct.opportunity_id
                LEFT JOIN quotes q ON q.id = ct.quote_id
                LEFT JOIN users u ON u.id = ct.owner_user_id
                WHERE ct.is_deleted = 0
                """);

        List<Object> params = new ArrayList<>();

        if (scope != null) {
            scope.appendOwnerPredicate("ct.owner_user_id", sql, params);
        }

        if (keyword != null && !keyword.trim().isEmpty()) {
            sql.append(" AND (ct.contract_number LIKE ? OR ct.title LIKE ? OR c.name LIKE ?)");
            String pat = "%" + keyword.trim() + "%";
            params.add(pat);
            params.add(pat);
            params.add(pat);
        }

        if (status != null && !status.trim().isEmpty()) {
            sql.append(" AND ct.status = ?");
            params.add(status.trim().toUpperCase());
        }

        sql.append(" ORDER BY ct.id DESC");

        List<Map<String, Object>> list = new ArrayList<>();
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql.toString())) {
            for (int i = 0; i < params.size(); i++) {
                stmt.setObject(i + 1, params.get(i));
            }
            try (ResultSet rs = stmt.executeQuery()) {
                while (rs.next()) {
                    list.add(mapContract(rs));
                }
            }
        }
        return list;
    }

    private Map<String, Object> mapContract(ResultSet rs) throws SQLException {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("id", rs.getLong("id"));
        map.put("contractNumber", rs.getString("contract_number"));
        map.put("title", rs.getString("title"));
        map.put("customerId", rs.getLong("customer_id"));
        map.put("customerName", rs.getString("customer_name"));
        map.put("opportunityId", rs.getObject("opportunity_id"));
        map.put("opportunityName", rs.getString("opportunity_name"));
        map.put("quoteId", rs.getObject("quote_id"));
        map.put("quoteNumber", rs.getString("quote_number"));
        map.put("subtotal", rs.getBigDecimal("subtotal"));
        map.put("discountPercent", rs.getBigDecimal("discount_percent"));
        map.put("totalAmount", rs.getBigDecimal("total_amount"));
        map.put("signedDate", rs.getDate("signed_date"));
        map.put("effectiveDate", rs.getDate("effective_date"));
        map.put("expiryDate", rs.getDate("expiry_date"));
        map.put("paymentTerms", rs.getString("payment_terms"));
        map.put("status", rs.getString("status"));
        map.put("ownerUserId", rs.getLong("owner_user_id"));
        map.put("ownerName", rs.getString("owner_name"));
        map.put("createdAt", rs.getTimestamp("created_at"));

        try {
            map.put("customerEmail", rs.getString("customer_email"));
            map.put("customerPhone", rs.getString("customer_phone"));
            map.put("customerAddress", rs.getString("customer_address"));
            map.put("customerTaxCode", rs.getString("customer_tax_code"));
        } catch (SQLException ignored) {}

        return map;
    }
}
