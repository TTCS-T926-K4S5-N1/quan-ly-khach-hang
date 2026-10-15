package com.crm.dao.leads;

import com.crm.config.DatabaseConfig;
import com.crm.dto.leads.LeadFormWriteRequest;

import java.sql.*;
import java.util.*;

public class WebLeadFormDAO {

    public List<Map<String, Object>> listAll(Boolean activeOnly) throws SQLException {
        StringBuilder sql = new StringBuilder("""
                SELECT
                    f.id,
                    f.form_key,
                    f.name,
                    f.title,
                    f.description,
                    f.lead_source_name,
                    f.lead_source_id,
                    f.submit_button_text,
                    f.success_message,
                    f.redirect_url,
                    f.default_owner_id,
                    f.is_active,
                    f.submissions_count,
                    f.created_by,
                    f.created_at,
                    f.updated_at,
                    u.full_name AS default_owner_name
                FROM web_lead_forms f
                LEFT JOIN users u ON u.id = f.default_owner_id
                """);

        if (Boolean.TRUE.equals(activeOnly)) {
            sql.append(" WHERE f.is_active = 1");
        }
        sql.append(" ORDER BY f.id DESC");

        List<Map<String, Object>> list = new ArrayList<>();
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql.toString());
             ResultSet rs = stmt.executeQuery()) {
            while (rs.next()) {
                list.add(mapForm(rs));
            }
        }
        return list;
    }

    public Map<String, Object> findById(long id) throws SQLException {
        String sql = """
                SELECT
                    f.id,
                    f.form_key,
                    f.name,
                    f.title,
                    f.description,
                    f.lead_source_name,
                    f.lead_source_id,
                    f.submit_button_text,
                    f.success_message,
                    f.redirect_url,
                    f.default_owner_id,
                    f.is_active,
                    f.submissions_count,
                    f.created_by,
                    f.created_at,
                    f.updated_at,
                    u.full_name AS default_owner_name
                FROM web_lead_forms f
                LEFT JOIN users u ON u.id = f.default_owner_id
                WHERE f.id = ?
                """;

        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setLong(1, id);
            try (ResultSet rs = stmt.executeQuery()) {
                if (rs.next()) {
                    return mapForm(rs);
                }
            }
        }
        return null;
    }

    public Map<String, Object> findByKey(String formKey) throws SQLException {
        String sql = """
                SELECT
                    f.id,
                    f.form_key,
                    f.name,
                    f.title,
                    f.description,
                    f.lead_source_name,
                    f.lead_source_id,
                    f.submit_button_text,
                    f.success_message,
                    f.redirect_url,
                    f.default_owner_id,
                    f.is_active,
                    f.submissions_count,
                    f.created_by,
                    f.created_at,
                    f.updated_at,
                    u.full_name AS default_owner_name
                FROM web_lead_forms f
                LEFT JOIN users u ON u.id = f.default_owner_id
                WHERE f.form_key = ?
                """;

        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setString(1, formKey);
            try (ResultSet rs = stmt.executeQuery()) {
                if (rs.next()) {
                    return mapForm(rs);
                }
            }
        }
        return null;
    }

    public long create(LeadFormWriteRequest req, Long createdBy) throws SQLException {
        String sql = """
                INSERT INTO web_lead_forms (
                    form_key, name, title, description, lead_source_name, lead_source_id,
                    submit_button_text, success_message, redirect_url, default_owner_id,
                    is_active, created_by
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """;

        String formKey = "wf_" + UUID.randomUUID().toString().replace("-", "").substring(0, 16);

        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS)) {
            stmt.setString(1, formKey);
            stmt.setString(2, req.getName());
            stmt.setString(3, req.getTitle() != null && !req.getTitle().isBlank() ? req.getTitle() : "Đăng ký tư vấn giải pháp");
            stmt.setString(4, req.getDescription());
            stmt.setString(5, req.getLeadSourceName());
            stmt.setObject(6, req.getLeadSourceId(), Types.BIGINT);
            stmt.setString(7, req.getSubmitButtonText());
            stmt.setString(8, req.getSuccessMessage());
            stmt.setString(9, req.getRedirectUrl());
            stmt.setObject(10, req.getDefaultOwnerId(), Types.BIGINT);
            stmt.setInt(11, Boolean.TRUE.equals(req.getActive()) ? 1 : 0);
            stmt.setObject(12, createdBy, Types.BIGINT);

            stmt.executeUpdate();
            try (ResultSet rs = stmt.getGeneratedKeys()) {
                if (rs.next()) {
                    return rs.getLong(1);
                }
            }
        }
        return 0;
    }

    public boolean update(long id, LeadFormWriteRequest req) throws SQLException {
        String sql = """
                UPDATE web_lead_forms SET
                    name = ?,
                    title = ?,
                    description = ?,
                    lead_source_name = ?,
                    lead_source_id = ?,
                    submit_button_text = ?,
                    success_message = ?,
                    redirect_url = ?,
                    default_owner_id = ?,
                    is_active = ?
                WHERE id = ?
                """;

        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setString(1, req.getName());
            stmt.setString(2, req.getTitle());
            stmt.setString(3, req.getDescription());
            stmt.setString(4, req.getLeadSourceName());
            stmt.setObject(5, req.getLeadSourceId(), Types.BIGINT);
            stmt.setString(6, req.getSubmitButtonText());
            stmt.setString(7, req.getSuccessMessage());
            stmt.setString(8, req.getRedirectUrl());
            stmt.setObject(9, req.getDefaultOwnerId(), Types.BIGINT);
            stmt.setInt(10, Boolean.TRUE.equals(req.getActive()) ? 1 : 0);
            stmt.setLong(11, id);

            return stmt.executeUpdate() > 0;
        }
    }

    public boolean delete(long id) throws SQLException {
        String sql = "DELETE FROM web_lead_forms WHERE id = ?";
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setLong(1, id);
            return stmt.executeUpdate() > 0;
        }
    }

    public void incrementSubmissionsCount(long formId) throws SQLException {
        String sql = "UPDATE web_lead_forms SET submissions_count = submissions_count + 1 WHERE id = ?";
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setLong(1, formId);
            stmt.executeUpdate();
        }
    }

    public long recordSubmission(
            long formId,
            Long customerId,
            Long contactId,
            String fullName,
            String email,
            String phone,
            String company,
            String interest,
            String ipAddress,
            String userAgent,
            boolean isSpam,
            String spamReason,
            String status
    ) throws SQLException {
        String sql = """
                INSERT INTO web_lead_submissions (
                    form_id, customer_id, contact_id, full_name, email, phone, company,
                    interest, ip_address, user_agent, is_spam, spam_reason, status
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """;

        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS)) {
            stmt.setLong(1, formId);
            stmt.setObject(2, customerId, Types.BIGINT);
            stmt.setObject(3, contactId, Types.BIGINT);
            stmt.setString(4, fullName);
            stmt.setString(5, email);
            stmt.setString(6, phone);
            stmt.setString(7, company);
            stmt.setString(8, interest);
            stmt.setString(9, ipAddress);
            stmt.setString(10, userAgent);
            stmt.setInt(11, isSpam ? 1 : 0);
            stmt.setString(12, spamReason);
            stmt.setString(13, status);

            stmt.executeUpdate();
            try (ResultSet rs = stmt.getGeneratedKeys()) {
                if (rs.next()) {
                    return rs.getLong(1);
                }
            }
        }
        return 0;
    }

    public List<Map<String, Object>> listSubmissions(Long formId, int limit) throws SQLException {
        StringBuilder sql = new StringBuilder("""
                SELECT
                    s.id,
                    s.form_id,
                    f.name AS form_name,
                    f.form_key,
                    s.customer_id,
                    s.contact_id,
                    s.full_name,
                    s.email,
                    s.phone,
                    s.company,
                    s.interest,
                    s.ip_address,
                    s.user_agent,
                    s.is_spam,
                    s.spam_reason,
                    s.status,
                    s.created_at
                FROM web_lead_submissions s
                JOIN web_lead_forms f ON f.id = s.form_id
                """);

        List<Object> params = new ArrayList<>();
        if (formId != null && formId > 0) {
            sql.append(" WHERE s.form_id = ?");
            params.add(formId);
        }
        sql.append(" ORDER BY s.id DESC LIMIT ?");
        params.add(limit > 0 ? limit : 50);

        List<Map<String, Object>> list = new ArrayList<>();
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql.toString())) {
            for (int i = 0; i < params.size(); i++) {
                stmt.setObject(i + 1, params.get(i));
            }
            try (ResultSet rs = stmt.executeQuery()) {
                while (rs.next()) {
                    Map<String, Object> map = new LinkedHashMap<>();
                    map.put("id", rs.getLong("id"));
                    map.put("formId", rs.getLong("form_id"));
                    map.put("formName", rs.getString("form_name"));
                    map.put("formKey", rs.getString("form_key"));
                    map.put("customerId", rs.getObject("customer_id"));
                    map.put("contactId", rs.getObject("contact_id"));
                    map.put("fullName", rs.getString("full_name"));
                    map.put("email", rs.getString("email"));
                    map.put("phone", rs.getString("phone"));
                    map.put("company", rs.getString("company"));
                    map.put("interest", rs.getString("interest"));
                    map.put("ipAddress", rs.getString("ip_address"));
                    map.put("userAgent", rs.getString("user_agent"));
                    map.put("isSpam", rs.getInt("is_spam") == 1);
                    map.put("spamReason", rs.getString("spam_reason"));
                    map.put("status", rs.getString("status"));
                    map.put("createdAt", rs.getTimestamp("created_at") != null
                            ? rs.getTimestamp("created_at").toInstant().toString() : null);
                    list.add(map);
                }
            }
        }
        return list;
    }

    public int countRecentSubmissionsByIp(String ipAddress, int windowMinutes) throws SQLException {
        String sql = """
                SELECT COUNT(*) FROM web_lead_submissions
                WHERE ip_address = ?
                  AND created_at >= DATE_SUB(NOW(), INTERVAL ? MINUTE)
                """;

        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setString(1, ipAddress);
            stmt.setInt(2, windowMinutes);
            try (ResultSet rs = stmt.executeQuery()) {
                if (rs.next()) {
                    return rs.getInt(1);
                }
            }
        }
        return 0;
    }

    private Map<String, Object> mapForm(ResultSet rs) throws SQLException {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("id", rs.getLong("id"));
        map.put("formKey", rs.getString("form_key"));
        map.put("name", rs.getString("name"));
        map.put("title", rs.getString("title"));
        map.put("description", rs.getString("description"));
        map.put("leadSourceName", rs.getString("lead_source_name"));
        map.put("leadSourceId", rs.getObject("lead_source_id"));
        map.put("submitButtonText", rs.getString("submit_button_text"));
        map.put("successMessage", rs.getString("success_message"));
        map.put("redirectUrl", rs.getString("redirect_url"));
        map.put("defaultOwnerId", rs.getObject("default_owner_id"));
        map.put("defaultOwnerName", rs.getString("default_owner_name"));
        map.put("isActive", rs.getInt("is_active") == 1);
        map.put("submissionsCount", rs.getInt("submissions_count"));
        map.put("createdBy", rs.getObject("created_by"));
        map.put("createdAt", rs.getTimestamp("created_at") != null
                ? rs.getTimestamp("created_at").toInstant().toString() : null);
        map.put("updatedAt", rs.getTimestamp("updated_at") != null
                ? rs.getTimestamp("updated_at").toInstant().toString() : null);
        return map;
    }
}
