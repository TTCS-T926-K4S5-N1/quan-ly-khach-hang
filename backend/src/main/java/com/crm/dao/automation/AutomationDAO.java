package com.crm.dao.automation;

import com.crm.config.DatabaseConfig;
import com.crm.dto.automation.AutomationLogDTO;
import com.crm.dto.automation.AutomationRuleDTO;

import java.sql.*;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

public class AutomationDAO {

    public List<AutomationRuleDTO> findAll() throws SQLException {
        List<AutomationRuleDTO> list = new ArrayList<>();
        String sql = """
                SELECT id, name, description, trigger_event, trigger_entity, condition_field,
                       condition_operator, condition_value, action_type, action_params, active,
                       created_by, created_at, updated_at
                FROM automation_rules
                ORDER BY id ASC
                """;
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql);
             ResultSet rs = ps.executeQuery()) {
            while (rs.next()) {
                list.add(mapRule(rs));
            }
        }
        return list;
    }

    public List<AutomationRuleDTO> findActiveRules(String triggerEvent, String triggerEntity) throws SQLException {
        List<AutomationRuleDTO> list = new ArrayList<>();
        String sql = """
                SELECT id, name, description, trigger_event, trigger_entity, condition_field,
                       condition_operator, condition_value, action_type, action_params, active,
                       created_by, created_at, updated_at
                FROM automation_rules
                WHERE active = 1 AND trigger_event = ? AND trigger_entity = ?
                ORDER BY id ASC
                """;
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, triggerEvent);
            ps.setString(2, triggerEntity);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    list.add(mapRule(rs));
                }
            }
        }
        return list;
    }

    public AutomationRuleDTO findById(long id) throws SQLException {
        String sql = """
                SELECT id, name, description, trigger_event, trigger_entity, condition_field,
                       condition_operator, condition_value, action_type, action_params, active,
                       created_by, created_at, updated_at
                FROM automation_rules
                WHERE id = ?
                """;
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setLong(1, id);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    return mapRule(rs);
                }
            }
        }
        return null;
    }

    public Long insertRule(AutomationRuleDTO r) throws SQLException {
        String sql = """
                INSERT INTO automation_rules (name, description, trigger_event, trigger_entity,
                                              condition_field, condition_operator, condition_value,
                                              action_type, action_params, active, created_by, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
                """;
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS)) {
            ps.setString(1, r.getName());
            ps.setString(2, r.getDescription());
            ps.setString(3, r.getTriggerEvent());
            ps.setString(4, r.getTriggerEntity());
            ps.setString(5, r.getConditionField());
            ps.setString(6, r.getConditionOperator() != null ? r.getConditionOperator() : "EQUALS");
            ps.setString(7, r.getConditionValue());
            ps.setString(8, r.getActionType());
            ps.setString(9, r.getActionParams());
            ps.setBoolean(10, r.isActive());
            if (r.getCreatedBy() != null) {
                ps.setLong(11, r.getCreatedBy());
            } else {
                ps.setNull(11, Types.BIGINT);
            }
            ps.executeUpdate();
            try (ResultSet rs = ps.getGeneratedKeys()) {
                if (rs.next()) {
                    long id = rs.getLong(1);
                    r.setId(id);
                    return id;
                }
            }
        }
        return null;
    }

    public boolean updateRule(AutomationRuleDTO r) throws SQLException {
        String sql = """
                UPDATE automation_rules SET
                    name = ?,
                    description = ?,
                    trigger_event = ?,
                    trigger_entity = ?,
                    condition_field = ?,
                    condition_operator = ?,
                    condition_value = ?,
                    action_type = ?,
                    action_params = ?,
                    active = ?,
                    updated_at = NOW()
                WHERE id = ?
                """;
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, r.getName());
            ps.setString(2, r.getDescription());
            ps.setString(3, r.getTriggerEvent());
            ps.setString(4, r.getTriggerEntity());
            ps.setString(5, r.getConditionField());
            ps.setString(6, r.getConditionOperator());
            ps.setString(7, r.getConditionValue());
            ps.setString(8, r.getActionType());
            ps.setString(9, r.getActionParams());
            ps.setBoolean(10, r.isActive());
            ps.setLong(11, r.getId());
            return ps.executeUpdate() > 0;
        }
    }

    public boolean toggleRule(long id) throws SQLException {
        String sql = "UPDATE automation_rules SET active = CASE WHEN active = 1 THEN 0 ELSE 1 END, updated_at = NOW() WHERE id = ?";
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setLong(1, id);
            return ps.executeUpdate() > 0;
        }
    }

    public boolean deleteRule(long id) throws SQLException {
        String sql = "DELETE FROM automation_rules WHERE id = ?";
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setLong(1, id);
            return ps.executeUpdate() > 0;
        }
    }

    public void logExecution(AutomationLogDTO log) throws SQLException {
        String sql = """
                INSERT INTO automation_logs (rule_id, rule_name, trigger_event, entity_type, entity_id, entity_name, action_type, action_summary, status, error_message, executed_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
                """;
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setLong(1, log.getRuleId());
            ps.setString(2, log.getRuleName());
            ps.setString(3, log.getTriggerEvent());
            ps.setString(4, log.getEntityType());
            ps.setLong(5, log.getEntityId());
            ps.setString(6, log.getEntityName());
            ps.setString(7, log.getActionType());
            ps.setString(8, log.getActionSummary());
            ps.setString(9, log.getStatus());
            ps.setString(10, log.getErrorMessage());
            ps.executeUpdate();
        }
    }

    public List<AutomationLogDTO> findLogs(int limit) throws SQLException {
        List<AutomationLogDTO> list = new ArrayList<>();
        String sql = """
                SELECT id, rule_id, rule_name, trigger_event, entity_type, entity_id, entity_name, action_type, action_summary, status, error_message, executed_at
                FROM automation_logs
                ORDER BY executed_at DESC
                LIMIT ?
                """;
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, limit > 0 ? limit : 50);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    AutomationLogDTO l = new AutomationLogDTO();
                    l.setId(rs.getLong("id"));
                    l.setRuleId(rs.getLong("rule_id"));
                    l.setRuleName(rs.getString("rule_name"));
                    l.setTriggerEvent(rs.getString("trigger_event"));
                    l.setEntityType(rs.getString("entity_type"));
                    l.setEntityId(rs.getLong("entity_id"));
                    l.setEntityName(rs.getString("entity_name"));
                    l.setActionType(rs.getString("action_type"));
                    l.setActionSummary(rs.getString("action_summary"));
                    l.setStatus(rs.getString("status"));
                    l.setErrorMessage(rs.getString("error_message"));
                    l.setExecutedAt(rs.getTimestamp("executed_at"));
                    list.add(l);
                }
            }
        }
        return list;
    }

    public Map<String, Object> getStats() throws SQLException {
        Map<String, Object> stats = new LinkedHashMap<>();
        int totalRules = 0;
        int activeRules = 0;
        int inactiveRules = 0;
        int totalRuns = 0;

        String ruleSql = "SELECT COUNT(*) AS total, SUM(CASE WHEN active = 1 THEN 1 ELSE 0 END) AS active_cnt FROM automation_rules";
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(ruleSql);
             ResultSet rs = ps.executeQuery()) {
            if (rs.next()) {
                totalRules = rs.getInt("total");
                activeRules = rs.getInt("active_cnt");
                inactiveRules = totalRules - activeRules;
            }
        }

        String logSql = "SELECT COUNT(*) AS total_runs FROM automation_logs";
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(logSql);
             ResultSet rs = ps.executeQuery()) {
            if (rs.next()) {
                totalRuns = rs.getInt("total_runs");
            }
        }

        stats.put("totalRules", totalRules);
        stats.put("activeRules", activeRules);
        stats.put("inactiveRules", inactiveRules);
        stats.put("totalRuns", totalRuns);
        return stats;
    }

    private AutomationRuleDTO mapRule(ResultSet rs) throws SQLException {
        AutomationRuleDTO r = new AutomationRuleDTO();
        r.setId(rs.getLong("id"));
        r.setName(rs.getString("name"));
        r.setDescription(rs.getString("description"));
        r.setTriggerEvent(rs.getString("trigger_event"));
        r.setTriggerEntity(rs.getString("trigger_entity"));
        r.setConditionField(rs.getString("condition_field"));
        r.setConditionOperator(rs.getString("condition_operator"));
        r.setConditionValue(rs.getString("condition_value"));
        r.setActionType(rs.getString("action_type"));
        r.setActionParams(rs.getString("action_params"));
        r.setActive(rs.getBoolean("active"));
        r.setCreatedBy((Long) rs.getObject("created_by"));
        r.setCreatedAt(rs.getTimestamp("created_at"));
        r.setUpdatedAt(rs.getTimestamp("updated_at"));
        return r;
    }
}
