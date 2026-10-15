package com.crm.dao.campaigns;

import com.crm.config.DatabaseConfig;
import com.crm.dto.campaigns.CampaignDTO;
import com.crm.dto.campaigns.CampaignWriteRequest;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.sql.*;
import java.util.*;

public class CampaignDAO {

    public List<CampaignDTO> findAll(String search, String channel, String status) throws SQLException {
        StringBuilder sql = new StringBuilder("""
            SELECT 
                c.id, c.code, c.name, c.channel, c.budget, c.expected_revenue, c.actual_cost,
                c.start_date, c.end_date, c.status, c.description, c.owner_user_id,
                u.full_name AS owner_name, c.created_at, c.updated_at,
                (SELECT COUNT(*) FROM customers WHERE campaign_id = c.id AND is_deleted = 0) AS total_leads,
                (SELECT COUNT(*) FROM opportunities WHERE campaign_id = c.id AND is_deleted = 0) AS total_opps,
                (SELECT COUNT(*) FROM opportunities WHERE campaign_id = c.id AND stage_id = 5 AND is_deleted = 0) AS won_opps,
                (SELECT COALESCE(SUM(amount), 0) FROM opportunities WHERE campaign_id = c.id AND stage_id = 5 AND is_deleted = 0) AS won_revenue
            FROM campaigns c
            LEFT JOIN users u ON u.id = c.owner_user_id
            WHERE 1=1
        """);

        List<Object> params = new ArrayList<>();

        if (search != null && !search.isBlank()) {
            sql.append(" AND (c.name LIKE ? OR c.code LIKE ? OR c.description LIKE ?)");
            String term = "%" + search.trim() + "%";
            params.add(term);
            params.add(term);
            params.add(term);
        }

        if (channel != null && !channel.isBlank() && !"ALL".equalsIgnoreCase(channel)) {
            sql.append(" AND c.channel = ?");
            params.add(channel.trim());
        }

        if (status != null && !status.isBlank() && !"ALL".equalsIgnoreCase(status)) {
            sql.append(" AND c.status = ?");
            params.add(status.trim());
        }

        sql.append(" ORDER BY c.id DESC");

        List<CampaignDTO> list = new ArrayList<>();
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql.toString())) {
            for (int i = 0; i < params.size(); i++) {
                ps.setObject(i + 1, params.get(i));
            }
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    list.add(mapRow(rs));
                }
            }
        }
        return list;
    }

    public CampaignDTO findById(Long id) throws SQLException {
        String sql = """
            SELECT 
                c.id, c.code, c.name, c.channel, c.budget, c.expected_revenue, c.actual_cost,
                c.start_date, c.end_date, c.status, c.description, c.owner_user_id,
                u.full_name AS owner_name, c.created_at, c.updated_at,
                (SELECT COUNT(*) FROM customers WHERE campaign_id = c.id AND is_deleted = 0) AS total_leads,
                (SELECT COUNT(*) FROM opportunities WHERE campaign_id = c.id AND is_deleted = 0) AS total_opps,
                (SELECT COUNT(*) FROM opportunities WHERE campaign_id = c.id AND stage_id = 5 AND is_deleted = 0) AS won_opps,
                (SELECT COALESCE(SUM(amount), 0) FROM opportunities WHERE campaign_id = c.id AND stage_id = 5 AND is_deleted = 0) AS won_revenue
            FROM campaigns c
            LEFT JOIN users u ON u.id = c.owner_user_id
            WHERE c.id = ?
        """;
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setLong(1, id);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    return mapRow(rs);
                }
            }
        }
        return null;
    }

    public long create(CampaignWriteRequest req, Long userId) throws SQLException {
        String sql = """
            INSERT INTO campaigns (
                code, name, channel, budget, expected_revenue, actual_cost,
                start_date, end_date, status, description, owner_user_id
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """;
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS)) {
            ps.setString(1, req.getCode());
            ps.setString(2, req.getName());
            ps.setString(3, req.getChannel() != null ? req.getChannel() : "HOI_THAO");
            ps.setBigDecimal(4, req.getBudget() != null ? req.getBudget() : BigDecimal.ZERO);
            ps.setBigDecimal(5, req.getExpectedRevenue() != null ? req.getExpectedRevenue() : BigDecimal.ZERO);
            ps.setBigDecimal(6, req.getActualCost() != null ? req.getActualCost() : BigDecimal.ZERO);
            ps.setDate(7, req.getStartDate() != null ? java.sql.Date.valueOf(req.getStartDate()) : null);
            ps.setDate(8, req.getEndDate() != null ? java.sql.Date.valueOf(req.getEndDate()) : null);
            ps.setString(9, req.getStatus() != null ? req.getStatus() : "ACTIVE");
            ps.setString(10, req.getDescription());
            ps.setObject(11, req.getOwnerUserId() != null ? req.getOwnerUserId() : userId);

            ps.executeUpdate();
            try (ResultSet rs = ps.getGeneratedKeys()) {
                if (rs.next()) return rs.getLong(1);
            }
        }
        throw new SQLException("Không thể tạo chiến dịch marketing");
    }

    public boolean update(Long id, CampaignWriteRequest req) throws SQLException {
        String sql = """
            UPDATE campaigns SET
                code = ?, name = ?, channel = ?, budget = ?, expected_revenue = ?, actual_cost = ?,
                start_date = ?, end_date = ?, status = ?, description = ?, owner_user_id = ?
            WHERE id = ?
        """;
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, req.getCode());
            ps.setString(2, req.getName());
            ps.setString(3, req.getChannel());
            ps.setBigDecimal(4, req.getBudget());
            ps.setBigDecimal(5, req.getExpectedRevenue());
            ps.setBigDecimal(6, req.getActualCost());
            ps.setDate(7, req.getStartDate() != null ? java.sql.Date.valueOf(req.getStartDate()) : null);
            ps.setDate(8, req.getEndDate() != null ? java.sql.Date.valueOf(req.getEndDate()) : null);
            ps.setString(9, req.getStatus());
            ps.setString(10, req.getDescription());
            ps.setObject(11, req.getOwnerUserId());
            ps.setLong(12, id);
            return ps.executeUpdate() > 0;
        }
    }

    public boolean delete(Long id) throws SQLException {
        String sql = "DELETE FROM campaigns WHERE id = ?";
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setLong(1, id);
            return ps.executeUpdate() > 0;
        }
    }

    public List<Map<String, Object>> getActiveOptions() throws SQLException {
        String sql = "SELECT id, code, name, channel FROM campaigns WHERE status = 'ACTIVE' ORDER BY name ASC";
        List<Map<String, Object>> list = new ArrayList<>();
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql);
             ResultSet rs = ps.executeQuery()) {
            while (rs.next()) {
                Map<String, Object> map = new LinkedHashMap<>();
                map.put("id", rs.getLong("id"));
                map.put("code", rs.getString("code"));
                map.put("name", rs.getString("name"));
                map.put("channel", rs.getString("channel"));
                list.add(map);
            }
        }
        return list;
    }

    public List<Map<String, Object>> getLeadsByCampaign(Long campaignId) throws SQLException {
        String sql = """
            SELECT 
                c.id, c.name, c.status, c.email, c.phone, c.lead_source, c.created_at,
                u.full_name AS owner_name,
                (SELECT COUNT(*) FROM opportunities WHERE customer_id = c.id AND is_deleted = 0) AS opps_count,
                (SELECT COALESCE(SUM(amount), 0) FROM opportunities WHERE customer_id = c.id AND stage_id = 5 AND is_deleted = 0) AS won_value
            FROM customers c
            LEFT JOIN users u ON u.id = c.owner_user_id
            WHERE c.campaign_id = ? AND c.is_deleted = 0
            ORDER BY c.id DESC
        """;
        List<Map<String, Object>> list = new ArrayList<>();
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setLong(1, campaignId);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    Map<String, Object> map = new LinkedHashMap<>();
                    map.put("id", rs.getLong("id"));
                    map.put("name", rs.getString("name"));
                    map.put("status", rs.getString("status"));
                    map.put("email", rs.getString("email"));
                    map.put("phone", rs.getString("phone"));
                    map.put("leadSource", rs.getString("lead_source"));
                    map.put("ownerName", rs.getString("owner_name"));
                    map.put("createdAt", rs.getTimestamp("created_at"));
                    map.put("oppsCount", rs.getInt("opps_count"));
                    map.put("wonValue", rs.getBigDecimal("won_value"));
                    list.add(map);
                }
            }
        }
        return list;
    }

    public List<Map<String, Object>> getOpportunitiesByCampaign(Long campaignId) throws SQLException {
        String sql = """
            SELECT 
                o.id, o.name, o.amount, o.stage_id, o.status, o.expected_close_date,
                c.id AS customer_id, c.name AS customer_name,
                u.full_name AS owner_name
            FROM opportunities o
            LEFT JOIN customers c ON c.id = o.customer_id
            LEFT JOIN users u ON u.id = o.owner_user_id
            WHERE o.campaign_id = ? AND o.is_deleted = 0
            ORDER BY o.id DESC
        """;
        List<Map<String, Object>> list = new ArrayList<>();
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setLong(1, campaignId);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    Map<String, Object> map = new LinkedHashMap<>();
                    map.put("id", rs.getLong("id"));
                    map.put("name", rs.getString("name"));
                    map.put("amount", rs.getBigDecimal("amount"));
                    map.put("stageId", rs.getObject("stage_id"));
                    map.put("status", rs.getString("status"));
                    map.put("expectedCloseDate", rs.getDate("expected_close_date"));
                    map.put("customerId", rs.getLong("customer_id"));
                    map.put("customerName", rs.getString("customer_name"));
                    map.put("ownerName", rs.getString("owner_name"));
                    list.add(map);
                }
            }
        }
        return list;
    }

    private CampaignDTO mapRow(ResultSet rs) throws SQLException {
        CampaignDTO dto = new CampaignDTO();
        dto.setId(rs.getLong("id"));
        dto.setCode(rs.getString("code"));
        dto.setName(rs.getString("name"));
        dto.setChannel(rs.getString("channel"));
        dto.setBudget(rs.getBigDecimal("budget"));
        dto.setExpectedRevenue(rs.getBigDecimal("expected_revenue"));
        dto.setActualCost(rs.getBigDecimal("actual_cost"));
        
        java.sql.Date startDate = rs.getDate("start_date");
        if (startDate != null) dto.setStartDate(startDate.toLocalDate());
        
        java.sql.Date endDate = rs.getDate("end_date");
        if (endDate != null) dto.setEndDate(endDate.toLocalDate());
        
        dto.setStatus(rs.getString("status"));
        dto.setDescription(rs.getString("description"));
        dto.setOwnerUserId(rs.getObject("owner_user_id", Long.class));
        dto.setOwnerName(rs.getString("owner_name"));
        
        Timestamp cat = rs.getTimestamp("created_at");
        if (cat != null) dto.setCreatedAt(cat.toLocalDateTime());
        Timestamp uat = rs.getTimestamp("updated_at");
        if (uat != null) dto.setUpdatedAt(uat.toLocalDateTime());

        int totalLeads = rs.getInt("total_leads");
        int totalOpps = rs.getInt("total_opps");
        int wonOpps = rs.getInt("won_opps");
        BigDecimal wonRev = rs.getBigDecimal("won_revenue");
        if (wonRev == null) wonRev = BigDecimal.ZERO;

        dto.setTotalLeads(totalLeads);
        dto.setTotalOpportunities(totalOpps);
        dto.setWonOpportunities(wonOpps);
        dto.setWonRevenue(wonRev);

        // Tính ROI: ((Won Revenue - Budget) / Budget) * 100%
        BigDecimal budget = dto.getBudget() != null ? dto.getBudget() : BigDecimal.ZERO;
        if (budget.compareTo(BigDecimal.ZERO) > 0) {
            BigDecimal netProfit = wonRev.subtract(budget);
            BigDecimal roi = netProfit.multiply(BigDecimal.valueOf(100)).divide(budget, 2, RoundingMode.HALF_UP);
            dto.setRoiPercent(roi);
        } else {
            dto.setRoiPercent(BigDecimal.ZERO);
        }

        // Tính Tỷ lệ chuyển đổi (Conversion Rate): (wonOpps / totalLeads) * 100%
        if (totalLeads > 0) {
            BigDecimal conv = BigDecimal.valueOf(wonOpps).multiply(BigDecimal.valueOf(100))
                    .divide(BigDecimal.valueOf(totalLeads), 2, RoundingMode.HALF_UP);
            dto.setConversionRate(conv);

            // Chi phí trên mỗi lead (Cost per Lead): Budget / totalLeads
            BigDecimal cpl = budget.divide(BigDecimal.valueOf(totalLeads), 0, RoundingMode.HALF_UP);
            dto.setCostPerLead(cpl);
        } else {
            dto.setConversionRate(BigDecimal.ZERO);
            dto.setCostPerLead(BigDecimal.ZERO);
        }

        return dto;
    }
}
