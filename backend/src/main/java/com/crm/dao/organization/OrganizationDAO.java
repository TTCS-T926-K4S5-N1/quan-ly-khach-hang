package com.crm.dao.organization;

import com.crm.config.DatabaseConfig;
import com.crm.dto.organization.OrganizationUnitRequest;

import java.sql.*;
import java.util.*;

public class OrganizationDAO {

    public List<Map<String, Object>> findAll(
            Long parentId,
            Boolean active
    ) throws SQLException {

        StringBuilder sql = new StringBuilder("""
                SELECT
                    ou.id,
                    ou.code,
                    ou.name,
                    ou.type,
                    ou.parent_id,
                    ou.manager_id,
                    u.full_name AS manager_name,
                    ou.region,
                    ou.description,
                    ou.active,
                    (SELECT COUNT(*) FROM users m WHERE m.team_id = ou.id AND m.status <> 'DELETED') AS member_count
                FROM organization_units ou
                LEFT JOIN users u
                    ON u.id = ou.manager_id
                WHERE 1 = 1
                """);

        List<Object> params = new ArrayList<>();

        if (parentId != null) {
            sql.append(" AND ou.parent_id = ?");
            params.add(parentId);
        }

        if (active != null) {
            sql.append(" AND ou.active = ?");
            params.add(active);
        }

        sql.append(" ORDER BY ou.id");

        List<Map<String, Object>> items = new ArrayList<>();

        try (Connection connection = DatabaseConfig.getConnection();
             PreparedStatement statement = connection.prepareStatement(sql.toString())) {

            for (int i = 0; i < params.size(); i++) {
                statement.setObject(i + 1, params.get(i));
            }

            try (ResultSet rs = statement.executeQuery()) {
                while (rs.next()) {
                    items.add(map(rs));
                }
            }
        }

        return items;
    }

    public Map<String, Object> findById(long id) throws SQLException {
        String sql = """
                SELECT
                    ou.id,
                    ou.code,
                    ou.name,
                    ou.type,
                    ou.parent_id,
                    ou.manager_id,
                    u.full_name AS manager_name,
                    ou.region,
                    ou.description,
                    ou.active,
                    (SELECT COUNT(*) FROM users m WHERE m.team_id = ou.id AND m.status <> 'DELETED') AS member_count
                FROM organization_units ou
                LEFT JOIN users u
                    ON u.id = ou.manager_id
                WHERE ou.id = ?
                """;

        try (Connection connection = DatabaseConfig.getConnection();
             PreparedStatement statement = connection.prepareStatement(sql)) {

            statement.setLong(1, id);

            try (ResultSet rs = statement.executeQuery()) {
                return rs.next() ? map(rs) : null;
            }
        }
    }

    public long create(OrganizationUnitRequest request) throws SQLException {
        String sql = """
                INSERT INTO organization_units(
                    code,
                    name,
                    type,
                    parent_id,
                    manager_id,
                    region,
                    description,
                    active
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                """;

        try (Connection connection = DatabaseConfig.getConnection();
             PreparedStatement statement = connection.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS)) {

            statement.setString(1, request.getCode());
            statement.setString(2, request.getName());
            statement.setString(3, request.getType() != null ? request.getType() : "sales-team");
            setNullableLong(statement, 4, request.getParentId());
            setNullableLong(statement, 5, request.getManagerId());
            statement.setString(6, request.getRegion());
            statement.setString(7, request.getDescription());
            statement.setBoolean(8, request.getActive() == null || request.getActive());

            statement.executeUpdate();

            long generatedId;
            try (ResultSet keys = statement.getGeneratedKeys()) {
                keys.next();
                generatedId = keys.getLong(1);
            }

            // Đồng bộ sang bảng teams để phục vụ DataScopeService
            syncToTeam(connection, generatedId, request);

            return generatedId;
        }
    }

    public void update(long id, OrganizationUnitRequest request) throws SQLException {
        String sql = """
                UPDATE organization_units
                SET
                    code = ?,
                    name = ?,
                    type = ?,
                    parent_id = ?,
                    manager_id = ?,
                    region = ?,
                    description = ?,
                    active = ?
                WHERE id = ?
                """;

        try (Connection connection = DatabaseConfig.getConnection();
             PreparedStatement statement = connection.prepareStatement(sql)) {

            statement.setString(1, request.getCode());
            statement.setString(2, request.getName());
            statement.setString(3, request.getType() != null ? request.getType() : "sales-team");
            setNullableLong(statement, 4, request.getParentId());
            setNullableLong(statement, 5, request.getManagerId());
            statement.setString(6, request.getRegion());
            statement.setString(7, request.getDescription());
            statement.setBoolean(8, request.getActive() == null || request.getActive());
            statement.setLong(9, id);

            statement.executeUpdate();

            // Đồng bộ sang bảng teams
            syncToTeam(connection, id, request);
        }
    }

    public void delete(long id) throws SQLException {
        try (Connection connection = DatabaseConfig.getConnection()) {
            // Xóa ở teams trước
            try (PreparedStatement stmt = connection.prepareStatement("DELETE FROM teams WHERE id = ?")) {
                stmt.setLong(1, id);
                stmt.executeUpdate();
            }
            // Xóa ở organization_units
            try (PreparedStatement stmt = connection.prepareStatement("DELETE FROM organization_units WHERE id = ?")) {
                stmt.setLong(1, id);
                stmt.executeUpdate();
            }
        }
    }

    private void syncToTeam(Connection connection, long id, OrganizationUnitRequest req) {
        String sql = """
                INSERT INTO teams(id, code, name, parent_id, manager_id, region, description, active)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE
                    code = VALUES(code),
                    name = VALUES(name),
                    parent_id = VALUES(parent_id),
                    manager_id = VALUES(manager_id),
                    region = VALUES(region),
                    description = VALUES(description),
                    active = VALUES(active)
                """;
        try (PreparedStatement stmt = connection.prepareStatement(sql)) {
            stmt.setLong(1, id);
            stmt.setString(2, req.getCode());
            stmt.setString(3, req.getName());
            setNullableLong(stmt, 4, req.getParentId());
            setNullableLong(stmt, 5, req.getManagerId());
            stmt.setString(6, req.getRegion());
            stmt.setString(7, req.getDescription());
            stmt.setBoolean(8, req.getActive() == null || req.getActive());
            stmt.executeUpdate();
        } catch (SQLException ignored) {
            // Không ngắt luồng chính nếu sync lỗi thứ cấp
        }
    }

    public boolean hasChildren(long id) throws SQLException {
        String sql = "SELECT 1 FROM organization_units WHERE parent_id = ? LIMIT 1";
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setLong(1, id);
            try (ResultSet rs = stmt.executeQuery()) {
                return rs.next();
            }
        }
    }

    public boolean hasMembers(long id) throws SQLException {
        String sql = "SELECT 1 FROM users WHERE team_id = ? AND status <> 'DELETED' LIMIT 1";
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setLong(1, id);
            try (ResultSet rs = stmt.executeQuery()) {
                return rs.next();
            }
        }
    }

    public List<Map<String, Object>> findMembers(long unitId) throws SQLException {
        String sql = """
                SELECT u.id, u.full_name, u.email, u.phone, u.data_scope,
                       GROUP_CONCAT(r.name SEPARATOR ', ') AS role_names
                FROM users u
                LEFT JOIN user_roles ur ON ur.user_id = u.id
                LEFT JOIN roles r ON r.id = ur.role_id
                WHERE u.team_id = ? AND u.status <> 'DELETED'
                GROUP BY u.id, u.full_name, u.email, u.phone, u.data_scope
                ORDER BY u.full_name
                """;
        List<Map<String, Object>> list = new ArrayList<>();
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setLong(1, unitId);
            try (ResultSet rs = stmt.executeQuery()) {
                while (rs.next()) {
                    Map<String, Object> m = new LinkedHashMap<>();
                    m.put("id", rs.getLong("id"));
                    m.put("fullName", rs.getString("full_name"));
                    m.put("email", rs.getString("email"));
                    m.put("phone", rs.getString("phone"));
                    m.put("dataScope", rs.getString("data_scope"));
                    m.put("roles", rs.getString("role_names"));
                    list.add(m);
                }
            }
        }
        return list;
    }

    public void assignMember(long unitId, long userId) throws SQLException {
        String sql = "UPDATE users SET team_id = ? WHERE id = ?";
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setLong(1, unitId);
            stmt.setLong(2, userId);
            stmt.executeUpdate();
        }
    }

    public void removeMember(long userId) throws SQLException {
        String sql = "UPDATE users SET team_id = NULL WHERE id = ?";
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setLong(1, userId);
            stmt.executeUpdate();
        }
    }

    public List<Map<String, Object>> getRegions() throws SQLException {
        String sql = "SELECT id, code, name FROM master_data WHERE type = 'region' AND active = 1 ORDER BY display_order";
        List<Map<String, Object>> list = new ArrayList<>();
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql);
             ResultSet rs = stmt.executeQuery()) {
            while (rs.next()) {
                Map<String, Object> r = new LinkedHashMap<>();
                r.put("id", rs.getLong("id"));
                r.put("code", rs.getString("code"));
                r.put("name", rs.getString("name"));
                list.add(r);
            }
        }
        return list;
    }

    public void addRegion(String code, String name) throws SQLException {
        String sql = "INSERT INTO master_data (type, code, name, active, display_order) VALUES ('region', ?, ?, 1, 99)";
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setString(1, code);
            stmt.setString(2, name);
            stmt.executeUpdate();
        }
    }

    public boolean existsCode(String code, Long excludeId) throws SQLException {
        String sql = excludeId == null
                ? "SELECT 1 FROM organization_units WHERE LOWER(code) = LOWER(?) LIMIT 1"
                : "SELECT 1 FROM organization_units WHERE LOWER(code) = LOWER(?) AND id <> ? LIMIT 1";

        try (Connection connection = DatabaseConfig.getConnection();
             PreparedStatement statement = connection.prepareStatement(sql)) {
            statement.setString(1, code);
            if (excludeId != null) {
                statement.setLong(2, excludeId);
            }
            try (ResultSet rs = statement.executeQuery()) {
                return rs.next();
            }
        }
    }

    public boolean userExists(long userId) throws SQLException {
        String sql = "SELECT 1 FROM users WHERE id = ? AND status <> 'DELETED' LIMIT 1";
        try (Connection connection = DatabaseConfig.getConnection();
             PreparedStatement statement = connection.prepareStatement(sql)) {
            statement.setLong(1, userId);
            try (ResultSet rs = statement.executeQuery()) {
                return rs.next();
            }
        }
    }

    private void setNullableLong(PreparedStatement statement, int index, Long value) throws SQLException {
        if (value == null) {
            statement.setNull(index, Types.BIGINT);
        } else {
            statement.setLong(index, value);
        }
    }

    private Map<String, Object> map(ResultSet rs) throws SQLException {
        Map<String, Object> item = new LinkedHashMap<>();
        item.put("id", rs.getLong("id"));
        item.put("code", rs.getString("code"));
        item.put("name", rs.getString("name"));
        item.put("type", rs.getString("type"));
        item.put("parentId", rs.getObject("parent_id"));
        item.put("managerId", rs.getObject("manager_id"));
        item.put("manager", rs.getString("manager_name"));
        item.put("region", rs.getString("region"));
        item.put("description", rs.getString("description"));
        item.put("active", rs.getBoolean("active"));
        try {
            item.put("memberCount", rs.getInt("member_count"));
        } catch (SQLException ignored) {}
        return item;
    }
}