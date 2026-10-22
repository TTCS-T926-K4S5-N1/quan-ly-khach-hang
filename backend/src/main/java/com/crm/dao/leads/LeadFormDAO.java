package com.crm.dao.leads;

import com.crm.config.DatabaseConfig;
import com.crm.dto.leads.LeadForm;
import com.crm.dto.leads.LeadSubmission;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.NoSuchElementException;
import java.util.UUID;

public class LeadFormDAO {

    // Tìm biểu mẫu đang nhận lead.
    public LeadForm findActive(String id) throws SQLException {
        String sql = """
                SELECT id, name, source, owner_user_id, active
                FROM lead_forms
                WHERE id = ? AND active = TRUE
                """;

        try (Connection connection = DatabaseConfig.getConnection();
             PreparedStatement statement =
                     connection.prepareStatement(sql)) {

            statement.setString(1, id);

            try (ResultSet result = statement.executeQuery()) {
                return result.next() ? mapForm(result) : null;
            }
        }
    }

    // Tạo biểu mẫu mới.
    public LeadForm create(
            String name,
            String source,
            long ownerUserId
    ) throws SQLException {

        String id = UUID.randomUUID().toString();

        String sql = """
                INSERT INTO lead_forms (
                    id, name, source, owner_user_id
                )
                VALUES (?, ?, ?, ?)
                """;

        try (Connection connection = DatabaseConfig.getConnection();
             PreparedStatement statement =
                     connection.prepareStatement(sql)) {

            statement.setString(1, id);
            statement.setString(2, name);
            statement.setString(3, source);
            statement.setLong(4, ownerUserId);

            statement.executeUpdate();
        }

        return new LeadForm(id, name, source, ownerUserId, true);
    }

    // Lấy 100 biểu mẫu gần nhất thuộc người đăng nhập.
    public List<LeadForm> listForms(long ownerUserId)
            throws SQLException {

        String sql = """
                SELECT id, name, source, owner_user_id, active
                FROM lead_forms
                WHERE owner_user_id = ?
                ORDER BY created_at DESC, id
                LIMIT 100
                """;

        List<LeadForm> forms = new ArrayList<>();

        try (Connection connection = DatabaseConfig.getConnection();
             PreparedStatement statement =
                     connection.prepareStatement(sql)) {

            statement.setLong(1, ownerUserId);

            try (ResultSet result = statement.executeQuery()) {
                while (result.next()) {
                    forms.add(mapForm(result));
                }
            }
        }

        return forms;
    }

    // Chỉ chủ sở hữu mới tắt được biểu mẫu của mình.
    public boolean deactivate(String id, long ownerUserId)
            throws SQLException {

        String sql = """
                UPDATE lead_forms
                SET active = FALSE
                WHERE id = ? AND owner_user_id = ?
                """;

        try (Connection connection = DatabaseConfig.getConnection();
             PreparedStatement statement =
                     connection.prepareStatement(sql)) {

            statement.setString(1, id);
            statement.setLong(2, ownerUserId);

            return statement.executeUpdate() > 0;
        }
    }

    // Lưu lead với trạng thái NEW, lấy nguồn và owner từ database.
    public void insertLead(
            String formId,
            LeadSubmission lead,
            String submissionHash
    ) throws SQLException {

        String findFormSql = """
                SELECT id, name, source, owner_user_id, active
                FROM lead_forms
                WHERE id = ? AND active = TRUE
                FOR UPDATE
                """;

        String insertLeadSql = """
                INSERT INTO leads (
                    full_name,
                    email,
                    phone,
                    company,
                    interest,
                    status,
                    source,
                    form_id,
                    owner_user_id,
                    submission_hash
                )
                VALUES (?, ?, ?, ?, ?, 'NEW', ?, ?, ?, ?)
                """;

        try (Connection connection = DatabaseConfig.getConnection()) {
            connection.setAutoCommit(false);

            try {
                LeadForm form;

                // Khóa biểu mẫu trong transaction để kiểm tra active.
                try (PreparedStatement statement =
                             connection.prepareStatement(findFormSql)) {

                    statement.setString(1, formId);

                    try (ResultSet result = statement.executeQuery()) {
                        if (!result.next()) {
                            throw new NoSuchElementException(
                                    "Biểu mẫu không tồn tại hoặc đã ngừng nhận lead."
                            );
                        }

                        form = mapForm(result);
                    }
                }

                try (PreparedStatement statement =
                             connection.prepareStatement(insertLeadSql)) {

                    statement.setString(1, lead.fullName());
                    statement.setString(2, lead.email());
                    statement.setString(3, lead.phone());
                    statement.setString(4, lead.company());
                    statement.setString(5, lead.interest());

                    statement.setString(6, form.source());
                    statement.setString(7, form.id());
                    statement.setLong(8, form.ownerUserId());
                    statement.setString(9, submissionHash);

                    statement.executeUpdate();
                }

                connection.commit();

            } catch (SQLException | RuntimeException exception) {
                try {
                    connection.rollback();
                } catch (SQLException rollbackException) {
                    exception.addSuppressed(rollbackException);
                }

                // MySQL 1062: mã gửi đã tồn tại, không tạo lead trùng.
                if (exception instanceof SQLException sqlException
                        && sqlException.getErrorCode() == 1062) {

                    throw new IllegalArgumentException(
                            "Biểu mẫu này đã được gửi. "
                                    + "Hãy tải lại nếu muốn gửi nhu cầu mới.",
                            exception
                    );
                }

                throw exception;
            }
        }
    }

    // Lấy 100 lead gần nhất thuộc người đăng nhập.
    public List<Map<String, Object>> listLeads(long ownerUserId)
            throws SQLException {

        String sql = """
                SELECT
                    l.id,
                    l.full_name,
                    l.email,
                    l.phone,
                    l.company,
                    l.interest,
                    l.status,
                    l.source,
                    l.created_at,
                    f.name AS form_name
                FROM leads l
                JOIN lead_forms f ON f.id = l.form_id
                WHERE l.owner_user_id = ?
                ORDER BY l.id DESC
                LIMIT 100
                """;

        List<Map<String, Object>> leads = new ArrayList<>();

        try (Connection connection = DatabaseConfig.getConnection();
             PreparedStatement statement =
                     connection.prepareStatement(sql)) {

            statement.setLong(1, ownerUserId);

            try (ResultSet result = statement.executeQuery()) {
                while (result.next()) {
                    Map<String, Object> row = new LinkedHashMap<>();

                    row.put("id", result.getLong("id"));
                    row.put("full_name", result.getString("full_name"));
                    row.put("email", result.getString("email"));
                    row.put("phone", result.getString("phone"));
                    row.put("company", result.getString("company"));
                    row.put("interest", result.getString("interest"));
                    row.put("status", result.getString("status"));
                    row.put("source", result.getString("source"));
                    row.put("created_at", result.getTimestamp("created_at"));
                    row.put("form_name", result.getString("form_name"));

                    leads.add(row);
                }
            }
        }

        return leads;
    }

    private LeadForm mapForm(ResultSet result) throws SQLException {
        return new LeadForm(
                result.getString("id"),
                result.getString("name"),
                result.getString("source"),
                result.getLong("owner_user_id"),
                result.getBoolean("active")
        );
    }
}