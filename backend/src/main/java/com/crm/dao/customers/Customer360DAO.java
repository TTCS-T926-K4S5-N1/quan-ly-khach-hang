package com.crm.dao.customers;

import com.crm.config.DatabaseConfig;
import com.crm.dao.contacts.ContactDAO;

import java.math.BigDecimal;
import java.sql.*;
import java.util.*;

public class Customer360DAO {

    private final ContactDAO contactDAO = new ContactDAO();

    public Map<String, Object> getCustomer360(long customerId) throws SQLException {
        long startTime = System.currentTimeMillis();
        Map<String, Object> result = new LinkedHashMap<>();

        try (Connection conn = DatabaseConfig.getConnection()) {
            // 1. Thông tin công ty
            Map<String, Object> customer = getCustomerDetails(conn, customerId);
            if (customer == null) {
                return null;
            }
            result.put("customer", customer);

            // 2. Tổng giá trị đã ký và giá trị cơ hội đang mở (KPIs)
            Map<String, Object> kpis = getKpiSummary(conn, customerId);
            result.put("kpis", kpis);

            // 3. Danh sách người liên hệ & vai trò
            List<Map<String, Object>> contacts = contactDAO.findByCustomerId(customerId);
            result.put("contacts", contacts);

            // 4. Cơ hội đang mở và đã đóng
            Map<String, Object> opportunities = getOpportunitiesGrouped(conn, customerId);
            result.put("opportunities", opportunities);

            // 5. Dòng thời gian hoạt động (500 hoạt động tối ưu index)
            List<Map<String, Object>> activities = getActivities(conn, customerId, 500);
            result.put("activities", activities);

            // 6. Tệp đính kèm
            List<Map<String, Object>> attachments = getAttachments(conn, customerId);
            result.put("attachments", attachments);

            long duration = System.currentTimeMillis() - startTime;
            Map<String, Object> performance = new LinkedHashMap<>();
            performance.put("executionTimeMs", duration);
            performance.put("activitiesLoaded", activities.size());
            performance.put("benchmarkStatus", duration < 1500 ? "PASSED (< 1.5s)" : "WARNING");
            result.put("performance", performance);
        }

        return result;
    }

    private Map<String, Object> getCustomerDetails(Connection conn, long customerId) throws SQLException {
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
                    c.created_at,
                    u.full_name AS owner_name,
                    m_ind.name AS industry_name,
                    m_size.name AS company_size_name
                FROM customers c
                LEFT JOIN users u ON u.id = c.owner_user_id
                LEFT JOIN master_data m_ind ON m_ind.id = c.industry_id
                LEFT JOIN master_data m_size ON m_size.id = c.company_size_id
                WHERE c.id = ? AND c.is_deleted = 0
                """;

        try (PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setLong(1, customerId);
            try (ResultSet rs = stmt.executeQuery()) {
                if (rs.next()) {
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
                    map.put("industry", rs.getString("industry_name") != null ? rs.getString("industry_name") : "—");
                    map.put("companySize", rs.getString("company_size_name") != null ? rs.getString("company_size_name") : "—");
                    map.put("ownerUserId", rs.getLong("owner_user_id"));
                    map.put("ownerName", rs.getString("owner_name") != null ? rs.getString("owner_name") : "CRM Administrator");
                    map.put("createdAt", rs.getTimestamp("created_at"));
                    return map;
                }
            }
        }
        return null;
    }

    private Map<String, Object> getKpiSummary(Connection conn, long customerId) throws SQLException {
        String sql = """
                SELECT
                    COALESCE(SUM(CASE WHEN status = 'WON' THEN amount ELSE 0 END), 0) AS total_won_amount,
                    COALESCE(SUM(CASE WHEN status = 'OPEN' THEN amount ELSE 0 END), 0) AS open_pipeline_amount,
                    COUNT(CASE WHEN status = 'WON' THEN 1 END) AS won_count,
                    COUNT(CASE WHEN status = 'OPEN' THEN 1 END) AS open_count,
                    COUNT(CASE WHEN status = 'LOST' THEN 1 END) AS lost_count,
                    COUNT(*) AS total_count
                FROM opportunities
                WHERE customer_id = ? AND is_deleted = 0
                """;

        Map<String, Object> kpi = new LinkedHashMap<>();
        try (PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setLong(1, customerId);
            try (ResultSet rs = stmt.executeQuery()) {
                if (rs.next()) {
                    BigDecimal totalWon = rs.getBigDecimal("total_won_amount");
                    BigDecimal openPipeline = rs.getBigDecimal("open_pipeline_amount");
                    int wonCount = rs.getInt("won_count");
                    int openCount = rs.getInt("open_count");
                    int lostCount = rs.getInt("lost_count");
                    int totalCount = rs.getInt("total_count");

                    int closedTotal = wonCount + lostCount;
                    int winRate = closedTotal > 0 ? (int) Math.round((double) wonCount * 100 / closedTotal) : 0;

                    kpi.put("totalWonAmount", totalWon);
                    kpi.put("openPipelineAmount", openPipeline);
                    kpi.put("wonCount", wonCount);
                    kpi.put("openCount", openCount);
                    kpi.put("lostCount", lostCount);
                    kpi.put("totalOpportunities", totalCount);
                    kpi.put("winRate", winRate);
                }
            }
        }
        return kpi;
    }

    private Map<String, Object> getOpportunitiesGrouped(Connection conn, long customerId) throws SQLException {
        String sql = """
                SELECT
                    o.id,
                    o.name,
                    o.contact_name,
                    o.amount,
                    o.stage_id,
                    COALESCE(s.name, 'Tiếp cận') AS stage_name,
                    o.probability,
                    o.expected_close_date,
                    o.status,
                    o.lost_reason,
                    o.created_at
                FROM opportunities o
                LEFT JOIN pipeline_stages s ON s.id = o.stage_id
                WHERE o.customer_id = ? AND o.is_deleted = 0
                ORDER BY o.id DESC
                """;

        List<Map<String, Object>> openList = new ArrayList<>();
        List<Map<String, Object>> closedList = new ArrayList<>();
        List<Map<String, Object>> allList = new ArrayList<>();

        try (PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setLong(1, customerId);
            try (ResultSet rs = stmt.executeQuery()) {
                while (rs.next()) {
                    Map<String, Object> item = new LinkedHashMap<>();
                    item.put("id", rs.getLong("id"));
                    item.put("name", rs.getString("name"));
                    item.put("contactName", rs.getString("contact_name"));
                    item.put("amount", rs.getBigDecimal("amount"));
                    item.put("stageId", rs.getObject("stage_id"));
                    item.put("stageName", rs.getString("stage_name"));
                    item.put("probability", rs.getInt("probability"));
                    item.put("expectedCloseDate", rs.getDate("expected_close_date"));
                    item.put("status", rs.getString("status"));
                    item.put("lostReason", rs.getString("lost_reason"));
                    item.put("createdAt", rs.getTimestamp("created_at"));

                    allList.add(item);
                    if ("OPEN".equalsIgnoreCase(item.get("status").toString())) {
                        openList.add(item);
                    } else {
                        closedList.add(item);
                    }
                }
            }
        }

        Map<String, Object> res = new LinkedHashMap<>();
        res.put("all", allList);
        res.put("open", openList);
        res.put("closed", closedList);
        return res;
    }

    private List<Map<String, Object>> getActivities(Connection conn, long customerId, int limit) throws SQLException {
        String sql = """
                SELECT
                    a.id,
                    a.type,
                    a.subject,
                    a.description,
                    a.status,
                    a.due_date,
                    a.created_at,
                    u.full_name AS owner_name
                FROM activities a
                LEFT JOIN users u ON u.id = a.owner_user_id
                WHERE a.customer_id = ? AND a.is_deleted = 0
                ORDER BY a.created_at DESC
                LIMIT ?
                """;

        List<Map<String, Object>> list = new ArrayList<>();
        try (PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setLong(1, customerId);
            stmt.setInt(2, limit);
            try (ResultSet rs = stmt.executeQuery()) {
                while (rs.next()) {
                    Map<String, Object> map = new LinkedHashMap<>();
                    map.put("id", rs.getLong("id"));
                    map.put("type", rs.getString("type"));
                    map.put("subject", rs.getString("subject"));
                    map.put("description", rs.getString("description"));
                    map.put("status", rs.getString("status"));
                    map.put("dueDate", rs.getTimestamp("due_date"));
                    map.put("createdAt", rs.getTimestamp("created_at"));
                    map.put("ownerName", rs.getString("owner_name"));
                    list.add(map);
                }
            }
        }
        return list;
    }

    public List<Map<String, Object>> getAttachments(Connection conn, long customerId) throws SQLException {
        String sql = """
                SELECT
                    att.id,
                    att.customer_id,
                    att.name,
                    att.file_type,
                    att.file_size,
                    att.file_url,
                    att.notes,
                    att.created_at,
                    u.full_name AS uploaded_by
                FROM attachments att
                LEFT JOIN users u ON u.id = att.uploaded_by_user_id
                WHERE att.customer_id = ? AND att.is_deleted = 0
                ORDER BY att.id DESC
                """;

        List<Map<String, Object>> list = new ArrayList<>();
        try (PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setLong(1, customerId);
            try (ResultSet rs = stmt.executeQuery()) {
                while (rs.next()) {
                    Map<String, Object> map = new LinkedHashMap<>();
                    map.put("id", rs.getLong("id"));
                    map.put("customerId", rs.getLong("customer_id"));
                    map.put("name", rs.getString("name"));
                    map.put("fileType", rs.getString("file_type"));
                    map.put("fileSize", rs.getLong("file_size"));
                    map.put("fileUrl", rs.getString("file_url"));
                    map.put("notes", rs.getString("notes"));
                    map.put("createdAt", rs.getTimestamp("created_at"));
                    map.put("uploadedBy", rs.getString("uploaded_by") != null ? rs.getString("uploaded_by") : "CRM User");
                    list.add(map);
                }
            }
        }
        return list;
    }

    public long addAttachment(long customerId, String name, String fileType, long fileSize, String fileUrl, String notes, long userId) throws SQLException {
        String sql = """
                INSERT INTO attachments (customer_id, name, file_type, file_size, file_url, notes, uploaded_by_user_id)
                VALUES (?, ?, ?, ?, ?, ?, ?)
                """;

        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS)) {
            stmt.setLong(1, customerId);
            stmt.setString(2, name);
            stmt.setString(3, fileType != null ? fileType.toUpperCase() : "FILE");
            stmt.setLong(4, fileSize > 0 ? fileSize : 102400);
            stmt.setString(5, fileUrl != null ? fileUrl : "#");
            stmt.setString(6, notes);
            stmt.setLong(7, userId);

            stmt.executeUpdate();
            try (ResultSet rs = stmt.getGeneratedKeys()) {
                if (rs.next()) {
                    return rs.getLong(1);
                }
            }
        }
        throw new SQLException("Không thể thêm tệp đính kèm");
    }

    public void deleteAttachment(long id) throws SQLException {
        String sql = "UPDATE attachments SET is_deleted = 1 WHERE id = ?";
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setLong(1, id);
            stmt.executeUpdate();
        }
    }
}
