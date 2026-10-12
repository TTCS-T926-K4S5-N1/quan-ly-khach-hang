package com.crm.dao.support;

import com.crm.config.DatabaseConfig;
import com.crm.dto.support.SupportRequestWrite;
import com.crm.service.permissions.DataScopeContext;
import com.crm.service.support.SupportRisk;

import java.sql.*;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.*;

public class SupportRequestDAO {
    private static final String SELECT = """
            SELECT s.*, c.name AS customer_name FROM support_requests s
            JOIN customers c ON c.id = s.customer_id
            WHERE s.is_deleted = FALSE AND c.is_deleted = FALSE
            """;

    public List<Map<String, Object>> search(DataScopeContext scope, DataScopeContext customers,
            Long customerId, String status, String priority, int page, int size) throws SQLException {
        var sql = new StringBuilder(SELECT);
        var params = new ArrayList<Object>();
        restrict(sql, params, scope, customers);
        if (customerId != null) { sql.append(" AND s.customer_id = ?"); params.add(customerId); }
        if (status != null) { sql.append(" AND s.status = ?"); params.add(status); }
        if (priority != null) { sql.append(" AND s.priority = ?"); params.add(priority); }
        sql.append(" ORDER BY s.id DESC LIMIT ? OFFSET ?");
        params.add(size); params.add((long) (page - 1) * size);
        try (Connection c = DatabaseConfig.getConnection(); PreparedStatement s = prepare(c, sql.toString(), params);
             ResultSet rs = s.executeQuery()) {
            var items = new ArrayList<Map<String, Object>>();
            while (rs.next()) items.add(map(rs));
            return items;
        }
    }

    public Map<String, Object> find(long id, DataScopeContext scope, DataScopeContext customers) throws SQLException {
        try (Connection c = DatabaseConfig.getConnection()) { return find(c, id, scope, customers); }
    }

    private Map<String, Object> find(Connection c, long id, DataScopeContext scope, DataScopeContext customers) throws SQLException {
        var sql = new StringBuilder(SELECT + " AND s.id = ?");
        var params = new ArrayList<Object>(List.of(id));
        restrict(sql, params, scope, customers);
        try (PreparedStatement s = prepare(c, sql.toString(), params); ResultSet rs = s.executeQuery()) {
            if (!rs.next()) throw new NoSuchElementException("Không tìm thấy yêu cầu hỗ trợ trong phạm vi được phép");
            return map(rs);
        }
    }

    public Map<String, Object> save(Long id, SupportRequestWrite input, long actor,
            DataScopeContext scope, DataScopeContext customers) throws SQLException {
        try (Connection c = DatabaseConfig.getConnection()) {
            c.setAutoCommit(false);
            try {
                // Lock the parent so customer deletion/ownership transfers cannot race this write.
                lockCustomer(c, input.customerId(), scope, customers);
                if (id != null) {
                    Map<String, Object> existing = find(c, id, scope, customers);
                    if (!Objects.equals(existing.get("customerId"), input.customerId()))
                        throw new IllegalArgumentException("Không thể đổi khách hàng của yêu cầu hỗ trợ");
                }
                boolean completed = Set.of("RESOLVED", "CLOSED").contains(input.status());
                String sql = id == null ? """
                        INSERT INTO support_requests(customer_id,subject,description,priority,status,due_at,resolution,
                            created_by,updated_by,created_at,updated_at,resolved_at)
                        VALUES (?,?,?,?,?,?,?,?,?,UTC_TIMESTAMP(6),UTC_TIMESTAMP(6),
                            CASE WHEN ? THEN UTC_TIMESTAMP(6) ELSE NULL END)
                        """ : """
                        UPDATE support_requests SET subject=?,description=?,priority=?,status=?,due_at=?,resolution=?,
                            updated_by=?,updated_at=UTC_TIMESTAMP(6),
                            resolved_at=CASE WHEN ? THEN COALESCE(resolved_at,UTC_TIMESTAMP(6)) ELSE NULL END
                        WHERE id=? AND is_deleted=FALSE
                        """;
                try (PreparedStatement s = c.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS)) {
                    int i = 1;
                    if (id == null) s.setLong(i++, input.customerId());
                    s.setString(i++, input.subject()); s.setString(i++, input.description());
                    s.setString(i++, input.priority()); s.setString(i++, input.status());
                    s.setObject(i++, input.dueAtUtc()); s.setString(i++, input.resolution());
                    if (id == null) s.setLong(i++, actor);
                    s.setLong(i++, actor); s.setBoolean(i++, completed);
                    if (id != null) s.setLong(i, id);
                    if (s.executeUpdate() != 1) throw new SQLException("Không thể lưu yêu cầu hỗ trợ");
                    if (id == null) {
                        try (ResultSet keys = s.getGeneratedKeys()) {
                            if (!keys.next()) throw new SQLException("Không nhận được mã yêu cầu hỗ trợ");
                            id = keys.getLong(1);
                        }
                    }
                }
                Map<String, Object> result = find(c, id, scope, customers);
                c.commit();
                return result;
            } catch (SQLException | RuntimeException e) {
                c.rollback();
                throw e;
            }
        }
    }

    public void delete(long id, long actor, DataScopeContext scope, DataScopeContext customers) throws SQLException {
        try (Connection c = DatabaseConfig.getConnection()) {
            c.setAutoCommit(false);
            try {
                var existing = find(c, id, scope, customers);
                lockCustomer(c, (Long) existing.get("customerId"), scope, customers);
                try (PreparedStatement s = c.prepareStatement("""
                        UPDATE support_requests SET is_deleted=TRUE,updated_by=?,updated_at=UTC_TIMESTAMP(6)
                        WHERE id=? AND is_deleted=FALSE
                        """)) {
                    s.setLong(1, actor); s.setLong(2, id);
                    if (s.executeUpdate() != 1) throw new NoSuchElementException("Yêu cầu hỗ trợ đã bị xóa");
                }
                c.commit();
            } catch (SQLException | RuntimeException e) { c.rollback(); throw e; }
        }
    }

    public List<Map<String, Object>> risks(DataScopeContext scope, DataScopeContext customers,
            Long customerId, boolean atRiskOnly, int page, int size) throws SQLException {
        var sql = new StringBuilder("""
                SELECT r.*, c.name AS customer_name FROM customer_support_risk r
                JOIN customers c ON c.id=r.customer_id WHERE c.is_deleted=FALSE
                """);
        var params = new ArrayList<Object>();
        restrict(sql, params, scope, customers);
        if (customerId != null) { sql.append(" AND c.id=?"); params.add(customerId); }
        if (atRiskOnly) sql.append(" AND r.at_risk=TRUE");
        sql.append(" ORDER BY c.id DESC LIMIT ? OFFSET ?");
        params.add(size); params.add((long) (page - 1) * size);
        try (Connection c = DatabaseConfig.getConnection(); PreparedStatement s = prepare(c, sql.toString(), params);
             ResultSet rs = s.executeQuery()) {
            var items = new ArrayList<Map<String, Object>>();
            while (rs.next()) {
                var item = SupportRisk.from(rs);
                item.put("customerId", rs.getLong("customer_id"));
                item.put("customerName", rs.getString("customer_name"));
                items.add(item);
            }
            return items;
        }
    }

    private void lockCustomer(Connection c, long id, DataScopeContext scope, DataScopeContext customers) throws SQLException {
        var sql = new StringBuilder("SELECT c.id FROM customers c WHERE c.id=? AND c.is_deleted=FALSE");
        var params = new ArrayList<Object>(List.of(id));
        restrict(sql, params, scope, customers);
        sql.append(" FOR UPDATE");
        try (PreparedStatement s = prepare(c, sql.toString(), params); ResultSet rs = s.executeQuery()) {
            if (!rs.next()) throw new NoSuchElementException("Không tìm thấy khách hàng trong phạm vi được phép");
        }
    }

    private static void restrict(StringBuilder sql, List<Object> params, DataScopeContext scope, DataScopeContext customers) {
        scope.appendOwnerPredicate("c.owner_user_id", sql, params);
        customers.appendOwnerPredicate("c.owner_user_id", sql, params);
    }

    private static PreparedStatement prepare(Connection c, String sql, List<Object> params) throws SQLException {
        PreparedStatement s = c.prepareStatement(sql);
        try {
            for (int i = 0; i < params.size(); i++) s.setObject(i + 1, params.get(i));
            return s;
        } catch (SQLException e) { s.close(); throw e; }
    }

    private static Map<String, Object> map(ResultSet rs) throws SQLException {
        var item = new LinkedHashMap<String, Object>();
        item.put("id", rs.getLong("id")); item.put("customerId", rs.getLong("customer_id"));
        item.put("customerName", rs.getString("customer_name"));
        for (String field : List.of("subject", "description", "priority", "status", "resolution"))
            item.put(field, rs.getString(field));
        item.put("createdBy", rs.getLong("created_by")); item.put("updatedBy", rs.getLong("updated_by"));
        item.put("dueAt", utc(rs, "due_at")); item.put("createdAt", utc(rs, "created_at"));
        item.put("updatedAt", utc(rs, "updated_at")); item.put("resolvedAt", utc(rs, "resolved_at"));
        return item;
    }

    private static String utc(ResultSet rs, String column) throws SQLException {
        LocalDateTime date = rs.getObject(column, LocalDateTime.class);
        return date == null ? null : date.atOffset(ZoneOffset.UTC).toString();
    }
}
