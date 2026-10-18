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

    public int getExpiringThresholdDays() throws SQLException {
        String sql = "SELECT setting_value FROM contract_settings WHERE setting_key = 'expiring_threshold_days' LIMIT 1";
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql);
             ResultSet rs = stmt.executeQuery()) {
            if (rs.next()) {
                try {
                    return Integer.parseInt(rs.getString("setting_value").trim());
                } catch (NumberFormatException ignored) {}
            }
        }
        return 30; // default 30 days
    }

    public void updateExpiringThresholdDays(int days) throws SQLException {
        if (days < 1) days = 30;
        String sql = """
                INSERT INTO contract_settings (setting_key, setting_value, description)
                VALUES ('expiring_threshold_days', ?, 'Số ngày trước khi hết hạn để cảnh báo hợp đồng sắp hết hạn')
                ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value), updated_at = CURRENT_TIMESTAMP
                """;
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setString(1, String.valueOf(days));
            stmt.executeUpdate();
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
                            UPDATE opportunities
                            SET status = 'WON',
                                stage_id = ?,
                                amount = ?,
                                actual_close_date = COALESCE(actual_close_date, CURDATE()),
                                probability = 100,
                                stage_updated_at = NOW(),
                                updated_at = NOW()
                            WHERE id = ?
                            """;
                    try (PreparedStatement ps = conn.prepareStatement(updateOppSql)) {
                        ps.setLong(1, wonStageId);
                        ps.setBigDecimal(2, totalAmount != null ? totalAmount : BigDecimal.ZERO);
                        ps.setLong(3, opportunityId);
                        ps.executeUpdate();
                    }

                    // Ghi nhận hoạt động timeline
                    String logActSql = """
                            INSERT INTO activities (
                                subject, type, description, customer_id, opportunity_id,
                                owner_user_id, status, created_at, updated_at
                            ) VALUES (?, 'MEETING', ?, ?, ?, ?, 'COMPLETED', NOW(), NOW())
                            """;
                    try (PreparedStatement actStmt = conn.prepareStatement(logActSql)) {
                        actStmt.setString(1, "Ký kết Hợp đồng #" + contractNumber);
                        actStmt.setString(2, "Báo giá đã được chuyển đổi thành Hợp đồng kinh tế #" + contractNumber + ". Cơ hội tự động chuyển sang trạng thái Thắng (WON).");
                        actStmt.setLong(3, customerId);
                        actStmt.setLong(4, opportunityId);
                        actStmt.setLong(5, ownerUserId);
                        actStmt.executeUpdate();
                    }
                }

                // Update quote status to CONVERTED
                if (quoteId != null && quoteId > 0) {
                    String updateQuoteSql = "UPDATE quotes SET status = 'CONVERTED', contract_id = ?, updated_at = NOW() WHERE id = ?";
                    try (PreparedStatement qStmt = conn.prepareStatement(updateQuoteSql)) {
                        qStmt.setLong(1, contractId);
                        qStmt.setLong(2, quoteId);
                        qStmt.executeUpdate();
                    }
                }

                conn.commit();
                return contractId;
            } catch (Exception e) {
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
                    ct.renewal_opportunity_id,
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
                    DATEDIFF(ct.expiry_date, CURDATE()) AS days_remaining,
                    c.name AS customer_name,
                    c.email AS customer_email,
                    c.phone AS customer_phone,
                    c.address AS customer_address,
                    c.tax_code AS customer_tax_code,
                    o.name AS opportunity_name,
                    q.quote_number,
                    u.full_name AS owner_name,
                    o_renew.name AS renewal_opportunity_name
                FROM contracts ct
                LEFT JOIN customers c ON c.id = ct.customer_id
                LEFT JOIN opportunities o ON o.id = ct.opportunity_id
                LEFT JOIN quotes q ON q.id = ct.quote_id
                LEFT JOIN users u ON u.id = ct.owner_user_id
                LEFT JOIN opportunities o_renew ON o_renew.id = ct.renewal_opportunity_id
                WHERE ct.id = ? AND ct.is_deleted = 0
                """;

        int threshold = getExpiringThresholdDays();

        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setLong(1, id);
            try (ResultSet rs = stmt.executeQuery()) {
                if (rs.next()) {
                    Map<String, Object> map = mapContract(rs, threshold);
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

    public List<Map<String, Object>> search(DataScopeContext scope, String keyword, String statusFilter, Integer customThreshold) throws SQLException {
        int threshold = (customThreshold != null && customThreshold > 0) ? customThreshold : getExpiringThresholdDays();

        StringBuilder sql = new StringBuilder("""
                SELECT
                    ct.id,
                    ct.contract_number,
                    ct.title,
                    ct.customer_id,
                    ct.opportunity_id,
                    ct.quote_id,
                    ct.renewal_opportunity_id,
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
                    DATEDIFF(ct.expiry_date, CURDATE()) AS days_remaining,
                    c.name AS customer_name,
                    o.name AS opportunity_name,
                    q.quote_number,
                    u.full_name AS owner_name,
                    o_renew.name AS renewal_opportunity_name
                FROM contracts ct
                LEFT JOIN customers c ON c.id = ct.customer_id
                LEFT JOIN opportunities o ON o.id = ct.opportunity_id
                LEFT JOIN quotes q ON q.id = ct.quote_id
                LEFT JOIN users u ON u.id = ct.owner_user_id
                LEFT JOIN opportunities o_renew ON o_renew.id = ct.renewal_opportunity_id
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

        if (statusFilter != null && !statusFilter.trim().isEmpty() && !"ALL".equalsIgnoreCase(statusFilter)) {
            String f = statusFilter.trim().toUpperCase();
            switch (f) {
                case "EXPIRING_SOON" -> {
                    sql.append(" AND ct.expiry_date IS NOT NULL")
                       .append(" AND DATEDIFF(ct.expiry_date, CURDATE()) >= 0")
                       .append(" AND DATEDIFF(ct.expiry_date, CURDATE()) <= ?")
                       .append(" AND ct.status != 'TERMINATED'")
                       .append(" AND (ct.renewal_opportunity_id IS NULL OR ct.renewal_opportunity_id = 0)");
                    params.add(threshold);
                }
                case "EXPIRED" -> {
                    sql.append(" AND (ct.status = 'EXPIRED' OR (ct.expiry_date IS NOT NULL AND DATEDIFF(ct.expiry_date, CURDATE()) < 0))");
                }
                case "ACTIVE" -> {
                    sql.append(" AND ct.status = 'ACTIVE' AND (ct.expiry_date IS NULL OR DATEDIFF(ct.expiry_date, CURDATE()) > ?)");
                    params.add(threshold);
                }
                case "RENEWED" -> {
                    sql.append(" AND (ct.status = 'RENEWED' OR ct.renewal_opportunity_id IS NOT NULL)");
                }
                case "TERMINATED" -> {
                    sql.append(" AND ct.status = 'TERMINATED'");
                }
                default -> {
                    sql.append(" AND ct.status = ?");
                    params.add(f);
                }
            }
        }

        sql.append(" ORDER BY ct.expiry_date ASC, ct.id DESC");

        List<Map<String, Object>> list = new ArrayList<>();
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql.toString())) {
            for (int i = 0; i < params.size(); i++) {
                stmt.setObject(i + 1, params.get(i));
            }
            try (ResultSet rs = stmt.executeQuery()) {
                while (rs.next()) {
                    list.add(mapContract(rs, threshold));
                }
            }
        }
        return list;
    }

    public Map<String, Object> getSummary(DataScopeContext scope, Integer customThreshold) throws SQLException {
        int threshold = (customThreshold != null && customThreshold > 0) ? customThreshold : getExpiringThresholdDays();

        StringBuilder sql = new StringBuilder("""
                SELECT
                    COUNT(*) AS total_count,
                    SUM(CASE WHEN ct.status = 'ACTIVE' AND (ct.expiry_date IS NULL OR DATEDIFF(ct.expiry_date, CURDATE()) > ?) THEN 1 ELSE 0 END) AS active_count,
                    SUM(CASE WHEN ct.expiry_date IS NOT NULL AND DATEDIFF(ct.expiry_date, CURDATE()) >= 0 AND DATEDIFF(ct.expiry_date, CURDATE()) <= ? AND ct.status != 'TERMINATED' AND (ct.renewal_opportunity_id IS NULL OR ct.renewal_opportunity_id = 0) THEN 1 ELSE 0 END) AS expiring_soon_count,
                    SUM(CASE WHEN ct.expiry_date IS NOT NULL AND DATEDIFF(ct.expiry_date, CURDATE()) >= 0 AND DATEDIFF(ct.expiry_date, CURDATE()) <= ? AND ct.status != 'TERMINATED' AND (ct.renewal_opportunity_id IS NULL OR ct.renewal_opportunity_id = 0) THEN ct.total_amount ELSE 0 END) AS expiring_soon_amount,
                    SUM(CASE WHEN ct.status = 'EXPIRED' OR (ct.expiry_date IS NOT NULL AND DATEDIFF(ct.expiry_date, CURDATE()) < 0) THEN 1 ELSE 0 END) AS expired_count,
                    SUM(CASE WHEN ct.status = 'RENEWED' OR ct.renewal_opportunity_id IS NOT NULL THEN 1 ELSE 0 END) AS renewed_count,
                    SUM(ct.total_amount) AS total_contract_value
                FROM contracts ct
                WHERE ct.is_deleted = 0
                """);

        List<Object> params = new ArrayList<>();
        params.add(threshold);
        params.add(threshold);
        params.add(threshold);

        if (scope != null) {
            scope.appendOwnerPredicate("ct.owner_user_id", sql, params);
        }

        Map<String, Object> summary = new LinkedHashMap<>();
        summary.put("thresholdDays", threshold);

        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql.toString())) {
            for (int i = 0; i < params.size(); i++) {
                stmt.setObject(i + 1, params.get(i));
            }
            try (ResultSet rs = stmt.executeQuery()) {
                if (rs.next()) {
                    summary.put("totalCount", rs.getInt("total_count"));
                    summary.put("activeCount", rs.getInt("active_count"));
                    summary.put("expiringSoonCount", rs.getInt("expiring_soon_count"));
                    summary.put("expiringSoonAmount", rs.getBigDecimal("expiring_soon_amount") != null ? rs.getBigDecimal("expiring_soon_amount") : BigDecimal.ZERO);
                    summary.put("expiredCount", rs.getInt("expired_count"));
                    summary.put("renewedCount", rs.getInt("renewed_count"));
                    summary.put("totalContractValue", rs.getBigDecimal("total_contract_value") != null ? rs.getBigDecimal("total_contract_value") : BigDecimal.ZERO);
                }
            }
        }
        return summary;
    }

    public Map<String, Object> createRenewalOpportunity(long contractId, long currentUserId, String customTitle, BigDecimal customAmount, String notes) throws SQLException {
        String findContractSql = """
                SELECT ct.*, c.name AS customer_name
                FROM contracts ct
                JOIN customers c ON c.id = ct.customer_id
                WHERE ct.id = ? AND ct.is_deleted = 0
                """;

        try (Connection conn = DatabaseConfig.getConnection()) {
            conn.setAutoCommit(false);
            try {
                long customerId;
                String contractNumber;
                String customerName;
                BigDecimal contractTotal;
                java.sql.Date expiryDate;
                Long existingRenewOppId;
                long contractOwnerId;

                try (PreparedStatement stmt = conn.prepareStatement(findContractSql)) {
                    stmt.setLong(1, contractId);
                    try (ResultSet rs = stmt.executeQuery()) {
                        if (!rs.next()) {
                            throw new NoSuchElementException("Không tìm thấy hợp đồng #" + contractId);
                        }
                        customerId = rs.getLong("customer_id");
                        contractNumber = rs.getString("contract_number");
                        customerName = rs.getString("customer_name");
                        contractTotal = rs.getBigDecimal("total_amount");
                        expiryDate = rs.getDate("expiry_date");
                        existingRenewOppId = (Long) rs.getObject("renewal_opportunity_id");
                        contractOwnerId = rs.getLong("owner_user_id");
                    }
                }

                if (existingRenewOppId != null && existingRenewOppId > 0) {
                    throw new IllegalStateException("Hợp đồng #" + contractNumber + " đã được tạo cơ hội gia hạn trước đó (Cơ hội #" + existingRenewOppId + ").");
                }

                // 1. Tên và giá trị cơ hội gia hạn
                String oppTitle = (customTitle != null && !customTitle.trim().isEmpty())
                        ? customTitle.trim()
                        : "Gia hạn HĐ " + contractNumber + " - " + customerName;
                BigDecimal oppAmount = (customAmount != null && customAmount.compareTo(BigDecimal.ZERO) > 0)
                        ? customAmount
                        : (contractTotal != null ? contractTotal : BigDecimal.ZERO);

                // Ngày dự kiến đóng: lấy ngày hết hạn hợp đồng hoặc 30 ngày tới
                java.sql.Date expectedClose = expiryDate != null ? expiryDate : new java.sql.Date(System.currentTimeMillis() + 30L * 24 * 3600 * 1000);

                // Giai đoạn đầu tiên (Mới tiếp cận - order_no 1)
                long initialStageId = 1;
                String findStageSql = "SELECT id FROM pipeline_stages WHERE is_won = 0 AND is_lost = 0 ORDER BY order_no ASC LIMIT 1";
                try (PreparedStatement ps = conn.prepareStatement(findStageSql);
                     ResultSet rs = ps.executeQuery()) {
                    if (rs.next()) initialStageId = rs.getLong("id");
                }

                // Insert new opportunity
                String insertOppSql = """
                        INSERT INTO opportunities (
                            name, customer_id, amount, stage_id, probability,
                            expected_close_date, lead_source, status, owner_user_id,
                            created_at, updated_at
                        ) VALUES (?, ?, ?, ?, 20, ?, 'EXISTING_CONTRACT_RENEWAL', 'OPEN', ?, NOW(), NOW())
                        """;

                long newOppId;
                try (PreparedStatement ps = conn.prepareStatement(insertOppSql, Statement.RETURN_GENERATED_KEYS)) {
                    ps.setString(1, oppTitle);
                    ps.setLong(2, customerId);
                    ps.setBigDecimal(3, oppAmount);
                    ps.setLong(4, initialStageId);
                    ps.setDate(5, expectedClose);
                    ps.setLong(6, contractOwnerId > 0 ? contractOwnerId : currentUserId);
                    ps.executeUpdate();
                    try (ResultSet rs = ps.getGeneratedKeys()) {
                        if (rs.next()) {
                            newOppId = rs.getLong(1);
                        } else {
                            throw new SQLException("Không tạo được cơ hội gia hạn mới");
                        }
                    }
                }

                // 2. Kế thừa sản phẩm từ contract_items sang opportunity_items
                String copyItemsSql = """
                        INSERT INTO opportunity_items (
                            opportunity_id, product_id, product_code, product_name, product_type,
                            quantity, unit, unit_price, discount_percent, billing_cycle,
                            billing_duration, annual_contract_value, amount, notes
                        )
                        SELECT
                            ?,
                            ci.product_id,
                            p.code,
                            p.name,
                            p.type,
                            ci.quantity,
                            p.unit,
                            ci.unit_price,
                            ci.discount_percent,
                            'ANNUAL',
                            1,
                            ci.amount,
                            ci.amount,
                            CONCAT('Kế thừa từ Hợp đồng ', ?)
                        FROM contract_items ci
                        JOIN products p ON p.id = ci.product_id
                        WHERE ci.contract_id = ?
                        """;
                try (PreparedStatement copyStmt = conn.prepareStatement(copyItemsSql)) {
                    copyStmt.setLong(1, newOppId);
                    copyStmt.setString(2, contractNumber);
                    copyStmt.setLong(3, contractId);
                    copyStmt.executeUpdate();
                }

                // 3. Cập nhật hợp đồng: gắn renewal_opportunity_id và đánh dấu RENEWED
                String updateContractSql = "UPDATE contracts SET renewal_opportunity_id = ?, status = 'RENEWED', updated_at = NOW() WHERE id = ?";
                try (PreparedStatement ps = conn.prepareStatement(updateContractSql)) {
                    ps.setLong(1, newOppId);
                    ps.setLong(2, contractId);
                    ps.executeUpdate();
                }

                // 4. Ghi nhận lịch sử hoạt động vào CRM Activities
                String actSql = """
                        INSERT INTO activities (
                            subject, type, description, customer_id, opportunity_id,
                            owner_user_id, status, created_at, updated_at
                        ) VALUES (?, 'NOTE', ?, ?, ?, ?, 'COMPLETED', NOW(), NOW())
                        """;
                try (PreparedStatement ps = conn.prepareStatement(actSql)) {
                    ps.setString(1, "Tạo cơ hội gia hạn từ HĐ #" + contractNumber);
                    String desc = "Đã khởi tạo cơ hội gia hạn #" + newOppId + " (" + oppTitle + ") từ Hợp đồng #" + contractNumber + " sắp hết hạn.";
                    if (notes != null && !notes.trim().isEmpty()) {
                        desc += " Ghi chú: " + notes.trim();
                    }
                    ps.setString(2, desc);
                    ps.setLong(3, customerId);
                    ps.setLong(4, newOppId);
                    ps.setLong(5, currentUserId);
                    ps.executeUpdate();
                }

                conn.commit();

                Map<String, Object> result = new LinkedHashMap<>();
                result.put("opportunityId", newOppId);
                result.put("opportunityName", oppTitle);
                result.put("amount", oppAmount);
                result.put("contractId", contractId);
                result.put("contractNumber", contractNumber);
                result.put("customerId", customerId);
                result.put("customerName", customerName);
                return result;
            } catch (Exception e) {
                conn.rollback();
                throw e;
            } finally {
                conn.setAutoCommit(true);
            }
        }
    }

    private Map<String, Object> mapContract(ResultSet rs, int threshold) throws SQLException {
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
        map.put("rawStatus", rs.getString("status"));
        map.put("ownerUserId", rs.getLong("owner_user_id"));
        map.put("ownerName", rs.getString("owner_name"));
        map.put("createdAt", rs.getTimestamp("created_at"));

        Long renewalOppId = (Long) rs.getObject("renewal_opportunity_id");
        map.put("renewalOpportunityId", renewalOppId);
        map.put("renewalOpportunityName", rs.getString("renewal_opportunity_name"));

        Integer daysRemaining = rs.getObject("days_remaining") != null ? rs.getInt("days_remaining") : null;
        map.put("daysRemaining", daysRemaining);
        map.put("thresholdDays", threshold);

        // Computed status based on expiry and renewal
        String rawStatus = rs.getString("status");
        String computedStatus = rawStatus;

        if (renewalOppId != null && renewalOppId > 0) {
            computedStatus = "RENEWED";
        } else if ("TERMINATED".equalsIgnoreCase(rawStatus)) {
            computedStatus = "TERMINATED";
        } else if (daysRemaining != null && daysRemaining < 0) {
            computedStatus = "EXPIRED";
        } else if (daysRemaining != null && daysRemaining <= threshold) {
            computedStatus = "EXPIRING_SOON";
        } else if ("ACTIVE".equalsIgnoreCase(rawStatus)) {
            computedStatus = "ACTIVE";
        }

        map.put("status", computedStatus);

        try {
            map.put("customerEmail", rs.getString("customer_email"));
            map.put("customerPhone", rs.getString("customer_phone"));
            map.put("customerAddress", rs.getString("customer_address"));
            map.put("customerTaxCode", rs.getString("customer_tax_code"));
        } catch (SQLException ignored) {}

        return map;
    }
}
