package com.crm.dao.customers;

import com.crm.config.DatabaseConfig;
import com.crm.dao.contacts.ContactDAO;
import com.crm.service.permissions.DataScopeContext;

import java.math.BigDecimal;
import java.sql.*;
import java.util.*;

public class Customer360DAO {

    private final ContactDAO contactDAO = new ContactDAO();

    public Map<String, Object> getCustomer360(long customerId, DataScopeContext scope) throws SQLException {
        Objects.requireNonNull(scope, "Resolved customer read scope is required");
        long startTime = System.nanoTime();
        Map<String, Object> result = new LinkedHashMap<>();

        try (Connection conn = DatabaseConfig.getConnection()) {
            // 1. Thông tin công ty
            Map<String, Object> customer = getCustomerDetails(conn, customerId);
            if (customer == null) {
                return null;
            }
            if (!scope.canAccessOwner(((Number) customer.get("ownerUserId")).longValue())) {
                throw new SecurityException("Bạn không có quyền truy cập dữ liệu này do giới hạn phạm vi sở hữu.");
            }
            customer.put("customFields", new com.crm.dao.customfields.CustomFieldValueDAO().getValues("CUSTOMER", customerId));
            result.put("customer", customer);

            // 2. Tổng giá trị đã ký và giá trị cơ hội đang mở (KPIs)
            Map<String, Object> kpis = getKpiSummary(conn, customerId);
            result.put("kpis", kpis);

            // 3. Danh sách người liên hệ & vai trò
            List<Map<String, Object>> contacts = contactDAO.findByCustomerId(conn, customerId);
            result.put("contacts", contacts);

            // 4. Cơ hội đang mở và đã đóng
            Map<String, Object> opportunities = getOpportunitiesGrouped(conn, customerId);
            result.put("opportunities", opportunities);

            // 5. Dòng thời gian tương tác hợp nhất (Hoạt động, Thay đổi cơ hội, Báo giá đã gửi)
            Map<String, Object> timelineData = getUnifiedTimeline(conn, customerId, null, null, 500);
            @SuppressWarnings("unchecked")
            List<Map<String, Object>> activities = (List<Map<String, Object>>) timelineData.get("timeline");
            result.put("activities", activities);
            result.put("timeline", activities);
            result.put("timelineActors", timelineData.get("actors"));
            kpis.put("activitiesCount", activities.size());

            // 6. Tệp đính kèm
            List<Map<String, Object>> attachments = getAttachments(conn, customerId);
            result.put("attachments", attachments);

            long duration = (System.nanoTime() - startTime) / 1_000_000;
            Map<String, Object> performance = new LinkedHashMap<>();
            performance.put("executionTimeMs", duration);
            performance.put("activitiesLoaded", activities.size());
            performance.put("benchmarkStatus", "NOT_MEASURED_HTTP");
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
                    c.lead_score,
                    c.score_grade,
                    c.assignment_status,
                    c.score_breakdown,
                    c.sla_breached,
                    c.sla_deadline,
                    c.accepted_at,
                    c.rejected_at,
                    c.rejection_reason,
                    c.converted_at,
                    c.converted_customer_id,
                    c.converted_contact_id,
                    c.converted_opportunity_id,
                    th.label AS score_grade_label,
                    th.color AS score_grade_color,
                    th.icon AS score_grade_icon,
                    c.created_at,
                    u.full_name AS owner_name,
                    m_ind.name AS industry_name,
                    m_size.name AS company_size_name
                FROM customers c
                LEFT JOIN users u ON u.id = c.owner_user_id
                LEFT JOIN master_data m_ind ON m_ind.id = c.industry_id
                LEFT JOIN master_data m_size ON m_size.id = c.company_size_id
                LEFT JOIN lead_score_thresholds th ON th.grade = c.score_grade
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
                    map.put("isConverted", "CONVERTED".equalsIgnoreCase(rs.getString("status")));
                    map.put("email", rs.getString("email"));
                    map.put("phone", rs.getString("phone"));
                    map.put("website", rs.getString("website"));
                    map.put("address", rs.getString("address"));
                    map.put("industry", rs.getString("industry_name") != null ? rs.getString("industry_name") : "—");
                    map.put("companySize", rs.getString("company_size_name") != null ? rs.getString("company_size_name") : "—");
                    map.put("industryId", rs.getObject("industry_id"));
                    map.put("companySizeId", rs.getObject("company_size_id"));
                    map.put("ownerUserId", rs.getLong("owner_user_id"));
                    map.put("ownerName", rs.getString("owner_name") != null ? rs.getString("owner_name") : "CRM Administrator");
                    map.put("leadScore", rs.getInt("lead_score"));
                    map.put("scoreGrade", rs.getString("score_grade"));
                    map.put("scoreGradeLabel", rs.getString("score_grade_label"));
                    map.put("scoreGradeColor", rs.getString("score_grade_color"));
                    map.put("scoreGradeIcon", rs.getString("score_grade_icon"));
                    map.put("assignmentStatus", rs.getString("assignment_status"));
                    map.put("scoreBreakdown", rs.getString("score_breakdown"));
                    map.put("slaBreached", rs.getBoolean("sla_breached"));
                    map.put("slaDeadline", rs.getTimestamp("sla_deadline"));
                    map.put("acceptedAt", rs.getTimestamp("accepted_at"));
                    map.put("rejectedAt", rs.getTimestamp("rejected_at"));
                    map.put("rejectionReason", rs.getString("rejection_reason"));
                    map.put("convertedAt", rs.getTimestamp("converted_at"));
                    map.put("convertedCustomerId", rs.getObject("converted_customer_id"));
                    map.put("convertedContactId", rs.getObject("converted_contact_id"));
                    map.put("convertedOpportunityId", rs.getObject("converted_opportunity_id"));
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
        try (PreparedStatement stmt = conn.prepareStatement("""
                SELECT COALESCE(SUM(amount), 0), COUNT(*) FROM customer_360_contracts
                WHERE customer_id = ? AND status = 'SIGNED'
                """)) {
            stmt.setLong(1, customerId);
            try (ResultSet rs = stmt.executeQuery()) {
                rs.next();
                kpi.put("totalSignedAmount", rs.getBigDecimal(1));
                kpi.put("signedContractsCount", rs.getLong(2));
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

    @SuppressWarnings("unchecked")
    private List<Map<String, Object>> getActivities(Connection conn, long customerId, int limit) throws SQLException {
        Map<String, Object> t = getUnifiedTimeline(conn, customerId, null, null, limit);
        return (List<Map<String, Object>>) t.get("timeline");
    }

    public Map<String, Object> getUnifiedTimeline(long customerId, String typeFilter, Long actorId, int limit) throws SQLException {
        try (Connection conn = DatabaseConfig.getConnection()) {
            return getUnifiedTimeline(conn, customerId, typeFilter, actorId, limit);
        }
    }

    public Map<String, Object> getUnifiedTimeline(Connection conn, long customerId, String typeFilter, Long actorId, int limit) throws SQLException {
        List<Map<String, Object>> timeline = new ArrayList<>();
        Map<Long, String> actorsMap = new LinkedHashMap<>();

        // 1. Hoạt động (Activities: CALL, MEETING, EMAIL, NOTE, TASK)
        String actSql = """
                SELECT
                    a.id,
                    'ACTIVITY' AS event_category,
                    LOWER(a.type) AS event_type,
                    a.subject AS title,
                    a.description,
                    a.outcome,
                    a.status,
                    a.priority,
                    a.postpone_reason,
                    a.due_date,
                    a.duration_minutes,
                    a.created_at,
                    u.id AS actor_id,
                    COALESCE(u.full_name, 'Người dùng') AS actor_name,
                    ct.name AS contact_name,
                    o.name AS opportunity_name
                FROM activities a
                LEFT JOIN users u ON u.id = a.owner_user_id
                LEFT JOIN contacts ct ON ct.id = a.contact_id
                LEFT JOIN opportunities o ON o.id = a.opportunity_id
                WHERE a.customer_id = ? AND a.is_deleted = 0
                ORDER BY a.created_at DESC, a.id DESC
                LIMIT ?
                """;

        try (PreparedStatement stmt = conn.prepareStatement(actSql)) {
            stmt.setLong(1, customerId);
            stmt.setInt(2, limit);
            try (ResultSet rs = stmt.executeQuery()) {
                while (rs.next()) {
                    Map<String, Object> item = new LinkedHashMap<>();
                    item.put("id", rs.getLong("id"));
                    item.put("eventCategory", rs.getString("event_category"));
                    item.put("eventType", rs.getString("event_type"));
                    item.put("type", rs.getString("event_type"));
                    item.put("title", rs.getString("title"));
                    item.put("subject", rs.getString("title"));
                    item.put("description", rs.getString("description"));
                    item.put("outcome", rs.getString("outcome"));
                    item.put("status", rs.getString("status"));
                    item.put("priority", rs.getString("priority"));
                    item.put("postponeReason", rs.getString("postpone_reason"));
                    item.put("dueDate", rs.getTimestamp("due_date"));
                    item.put("durationMinutes", rs.getInt("duration_minutes"));
                    item.put("createdAt", rs.getTimestamp("created_at"));
                    item.put("timestamp", rs.getTimestamp("created_at"));
                    long aId = rs.getLong("actor_id");
                    String aName = rs.getString("actor_name");
                    item.put("actorId", aId > 0 ? aId : null);
                    item.put("actorName", aName);
                    item.put("ownerName", aName);
                    item.put("contactName", rs.getString("contact_name"));
                    item.put("opportunityName", rs.getString("opportunity_name"));
                    timeline.add(item);
                    if (aId > 0) actorsMap.put(aId, aName);
                }
            }
        }

        // 2. Thay đổi cơ hội (Opportunity Field History)
        String oppHistSql = """
                SELECT
                    h.id,
                    'OPPORTUNITY' AS event_category,
                    'opp_change' AS event_type,
                    CONCAT('[Cơ hội] ', o.name) AS title,
                    CONCAT('Thay đổi ', COALESCE(h.field_label, h.field_name), ': ', COALESCE(h.old_value, '(trống)'), ' ➔ ', COALESCE(h.new_value, '(trống)')) AS description,
                    h.reason AS outcome,
                    o.status,
                    'MEDIUM' AS priority,
                    h.created_at,
                    u.id AS actor_id,
                    COALESCE(u.full_name, 'Hệ thống') AS actor_name,
                    o.name AS opportunity_name,
                    o.amount
                FROM opportunity_field_history h
                JOIN opportunities o ON o.id = h.opportunity_id
                LEFT JOIN users u ON u.id = h.changed_by_user_id
                WHERE o.customer_id = ?
                ORDER BY h.created_at DESC
                LIMIT ?
                """;

        try (PreparedStatement stmt = conn.prepareStatement(oppHistSql)) {
            stmt.setLong(1, customerId);
            stmt.setInt(2, limit);
            try (ResultSet rs = stmt.executeQuery()) {
                while (rs.next()) {
                    Map<String, Object> item = new LinkedHashMap<>();
                    item.put("id", 1000000L + rs.getLong("id"));
                    item.put("eventCategory", rs.getString("event_category"));
                    item.put("eventType", rs.getString("event_type"));
                    item.put("type", "opp_change");
                    item.put("title", rs.getString("title"));
                    item.put("subject", rs.getString("title"));
                    item.put("description", rs.getString("description"));
                    item.put("outcome", rs.getString("outcome"));
                    item.put("status", rs.getString("status"));
                    item.put("priority", rs.getString("priority"));
                    item.put("dueDate", rs.getTimestamp("created_at"));
                    item.put("createdAt", rs.getTimestamp("created_at"));
                    item.put("timestamp", rs.getTimestamp("created_at"));
                    long aId = rs.getLong("actor_id");
                    String aName = rs.getString("actor_name");
                    item.put("actorId", aId > 0 ? aId : null);
                    item.put("actorName", aName);
                    item.put("ownerName", aName);
                    item.put("opportunityName", rs.getString("opportunity_name"));
                    item.put("amount", rs.getBigDecimal("amount"));
                    timeline.add(item);
                    if (aId > 0) actorsMap.put(aId, aName);
                }
            }
        }

        // 3. Báo giá đã gửi (Quotes)
        String quoteSql = """
                SELECT
                    q.id,
                    'QUOTE' AS event_category,
                    'quote' AS event_type,
                    CONCAT('[Báo giá] ', q.quote_number, ' - ', q.title) AS title,
                    CONCAT('Tổng tiền báo giá: ', FORMAT(q.total_amount, 0), ' VNĐ (Chiết khấu: ', COALESCE(q.discount_percent, 0), '%)') AS description,
                    CONCAT('Trạng thái: ', q.status) AS outcome,
                    q.status,
                    'HIGH' AS priority,
                    q.created_at,
                    u.id AS actor_id,
                    COALESCE(u.full_name, 'Hệ thống') AS actor_name,
                    o.name AS opportunity_name,
                    q.quote_number,
                    q.total_amount
                FROM quotes q
                LEFT JOIN users u ON u.id = q.owner_user_id
                LEFT JOIN opportunities o ON o.id = q.opportunity_id
                WHERE q.customer_id = ? AND q.is_deleted = 0
                ORDER BY q.created_at DESC
                LIMIT ?
                """;

        try (PreparedStatement stmt = conn.prepareStatement(quoteSql)) {
            stmt.setLong(1, customerId);
            stmt.setInt(2, limit);
            try (ResultSet rs = stmt.executeQuery()) {
                while (rs.next()) {
                    Map<String, Object> item = new LinkedHashMap<>();
                    item.put("id", 2000000L + rs.getLong("id"));
                    item.put("eventCategory", rs.getString("event_category"));
                    item.put("eventType", rs.getString("event_type"));
                    item.put("type", "quote");
                    item.put("title", rs.getString("title"));
                    item.put("subject", rs.getString("title"));
                    item.put("description", rs.getString("description"));
                    item.put("outcome", rs.getString("outcome"));
                    item.put("status", rs.getString("status"));
                    item.put("priority", rs.getString("priority"));
                    item.put("dueDate", rs.getTimestamp("created_at"));
                    item.put("createdAt", rs.getTimestamp("created_at"));
                    item.put("timestamp", rs.getTimestamp("created_at"));
                    long aId = rs.getLong("actor_id");
                    String aName = rs.getString("actor_name");
                    item.put("actorId", aId > 0 ? aId : null);
                    item.put("actorName", aName);
                    item.put("ownerName", aName);
                    item.put("opportunityName", rs.getString("opportunity_name"));
                    item.put("quoteNumber", rs.getString("quote_number"));
                    item.put("totalAmount", rs.getBigDecimal("total_amount"));
                    timeline.add(item);
                    if (aId > 0) actorsMap.put(aId, aName);
                }
            }
        }

        // Sắp xếp thống nhất theo thứ tự thời gian giảm dần (Chronological descending)
        timeline.sort((a, b) -> {
            Timestamp tA = (Timestamp) a.get("createdAt");
            Timestamp tB = (Timestamp) b.get("createdAt");
            if (tA == null && tB == null) return 0;
            if (tA == null) return 1;
            if (tB == null) return -1;
            return tB.compareTo(tA);
        });

        // Lọc theo loại hoặc theo người thực hiện nếu được chỉ định
        List<Map<String, Object>> filtered = timeline;
        if (typeFilter != null && !typeFilter.isBlank() && !typeFilter.equalsIgnoreCase("all")) {
            String tf = typeFilter.trim().toLowerCase();
            filtered = filtered.stream().filter(item -> {
                String et = String.valueOf(item.get("eventType")).toLowerCase();
                String ec = String.valueOf(item.get("eventCategory")).toLowerCase();
                if (tf.equals("call")) return et.contains("call");
                if (tf.equals("meeting")) return et.contains("meeting");
                if (tf.equals("email")) return et.contains("email");
                if (tf.equals("note")) return et.contains("note");
                if (tf.equals("task")) return et.contains("task");
                if (tf.equals("quote")) return ec.contains("quote") || et.contains("quote");
                if (tf.equals("opportunity")) return ec.contains("opportunity") || et.contains("opp");
                return et.equals(tf) || ec.equals(tf);
            }).toList();
        }

        if (actorId != null && actorId > 0) {
            filtered = filtered.stream().filter(item -> {
                Object aid = item.get("actorId");
                return aid instanceof Number && ((Number) aid).longValue() == actorId;
            }).toList();
        }

        List<Map<String, Object>> actorsList = new ArrayList<>();
        actorsMap.forEach((id, name) -> {
            Map<String, Object> a = new LinkedHashMap<>();
            a.put("id", id);
            a.put("name", name);
            actorsList.add(a);
        });

        Map<String, Object> res = new LinkedHashMap<>();
        res.put("timeline", filtered);
        res.put("actors", actorsList);
        res.put("totalCount", filtered.size());
        return res;
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

    public List<Map<String, Object>> getOpportunityAttachments(long oppId) throws SQLException {
        String sql = """
                SELECT
                    att.id,
                    att.customer_id,
                    att.opportunity_id,
                    att.name,
                    att.file_type,
                    att.file_size,
                    att.file_url,
                    att.notes,
                    att.created_at,
                    att.uploaded_by_user_id,
                    COALESCE(u.full_name, 'Hệ thống') AS uploaded_by
                FROM attachments att
                LEFT JOIN users u ON u.id = att.uploaded_by_user_id
                WHERE att.opportunity_id = ? AND att.is_deleted = 0
                ORDER BY att.id DESC
                """;

        List<Map<String, Object>> list = new ArrayList<>();
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setLong(1, oppId);
            try (ResultSet rs = stmt.executeQuery()) {
                while (rs.next()) {
                    Map<String, Object> map = new LinkedHashMap<>();
                    map.put("id", rs.getLong("id"));
                    map.put("customerId", rs.getObject("customer_id"));
                    map.put("opportunityId", rs.getObject("opportunity_id"));
                    map.put("name", rs.getString("name"));
                    map.put("fileType", rs.getString("file_type"));
                    map.put("fileSize", rs.getLong("file_size"));
                    map.put("fileUrl", rs.getString("file_url"));
                    map.put("notes", rs.getString("notes"));
                    map.put("createdAt", rs.getTimestamp("created_at"));
                    map.put("uploadedByUserId", rs.getObject("uploaded_by_user_id"));
                    map.put("uploadedBy", rs.getString("uploaded_by"));
                    list.add(map);
                }
            }
        }
        return list;
    }

    public Map<String, Object> getAttachmentById(long id) throws SQLException {
        String sql = """
                SELECT
                    att.id,
                    att.customer_id,
                    att.opportunity_id,
                    att.name,
                    att.file_type,
                    att.file_size,
                    att.file_url,
                    att.notes,
                    att.created_at,
                    att.uploaded_by_user_id,
                    COALESCE(u.full_name, 'Hệ thống') AS uploaded_by
                FROM attachments att
                LEFT JOIN users u ON u.id = att.uploaded_by_user_id
                WHERE att.id = ? AND att.is_deleted = 0
                """;

        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setLong(1, id);
            try (ResultSet rs = stmt.executeQuery()) {
                if (rs.next()) {
                    Map<String, Object> map = new LinkedHashMap<>();
                    map.put("id", rs.getLong("id"));
                    map.put("customerId", rs.getObject("customer_id"));
                    map.put("opportunityId", rs.getObject("opportunity_id"));
                    map.put("name", rs.getString("name"));
                    map.put("fileType", rs.getString("file_type"));
                    map.put("fileSize", rs.getLong("file_size"));
                    map.put("fileUrl", rs.getString("file_url"));
                    map.put("notes", rs.getString("notes"));
                    map.put("createdAt", rs.getTimestamp("created_at"));
                    map.put("uploadedByUserId", rs.getObject("uploaded_by_user_id"));
                    map.put("uploadedBy", rs.getString("uploaded_by"));
                    return map;
                }
            }
        }
        return null;
    }

    public long addAttachment(long customerId, String name, String fileType, long fileSize, String fileUrl, String notes, long userId) throws SQLException {
        return addOpportunityAttachment(customerId, null, name, fileType, fileSize, fileUrl, notes, userId);
    }

    public long addOpportunityAttachment(Long customerId, Long oppId, String name, String fileType, long fileSize, String fileUrl, String notes, long userId) throws SQLException {
        String sql = """
                INSERT INTO attachments (customer_id, opportunity_id, name, file_type, file_size, file_url, notes, uploaded_by_user_id)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                """;

        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS)) {
            stmt.setObject(1, customerId, Types.BIGINT);
            stmt.setObject(2, oppId, Types.BIGINT);
            stmt.setString(3, name);
            stmt.setString(4, fileType != null ? fileType.toUpperCase() : "FILE");
            stmt.setLong(5, fileSize > 0 ? fileSize : 102400);
            stmt.setString(6, fileUrl != null ? fileUrl : "#");
            stmt.setString(7, notes);
            stmt.setLong(8, userId);

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

