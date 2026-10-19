package com.crm.dao.pipeline;

import com.crm.config.DatabaseConfig;
import com.crm.dto.pipeline.OpportunityItemDTO;

import java.math.BigDecimal;
import java.sql.*;
import java.util.*;

public class OpportunityItemDAO {

    public List<Map<String, Object>> findByOpportunityId(long opportunityId) throws SQLException {
        try (Connection conn = DatabaseConfig.getConnection()) {
            return findByOpportunityId(conn, opportunityId);
        }
    }

    public List<Map<String, Object>> findByOpportunityId(Connection conn, long opportunityId) throws SQLException {
        String sql = """
                SELECT
                    oi.id,
                    oi.opportunity_id,
                    oi.product_id,
                    oi.quantity,
                    oi.unit_price,
                    oi.list_price,
                    oi.discount_percent,
                    oi.product_type,
                    oi.billing_cycle,
                    oi.term_count,
                    oi.annual_amount,
                    oi.total_amount,
                    oi.notes,
                    oi.created_at,
                    p.code AS product_code,
                    p.name AS product_name,
                    p.unit AS product_unit,
                    p.type AS catalog_type,
                    p.list_price AS catalog_list_price,
                    p.floor_price AS catalog_floor_price
                FROM opportunity_items oi
                JOIN products p ON p.id = oi.product_id
                WHERE oi.opportunity_id = ?
                ORDER BY oi.id ASC
                """;

        List<Map<String, Object>> items = new ArrayList<>();
        try (PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setLong(1, opportunityId);
            try (ResultSet rs = stmt.executeQuery()) {
                while (rs.next()) {
                    items.add(mapItem(rs));
                }
            }
        }
        return items;
    }

    public Map<String, Object> findById(long id) throws SQLException {
        try (Connection conn = DatabaseConfig.getConnection()) {
            return findById(conn, id);
        }
    }

    public Map<String, Object> findById(Connection conn, long id) throws SQLException {
        String sql = """
                SELECT
                    oi.id,
                    oi.opportunity_id,
                    oi.product_id,
                    oi.quantity,
                    oi.unit_price,
                    oi.list_price,
                    oi.discount_percent,
                    oi.product_type,
                    oi.billing_cycle,
                    oi.term_count,
                    oi.annual_amount,
                    oi.total_amount,
                    oi.notes,
                    oi.created_at,
                    p.code AS product_code,
                    p.name AS product_name,
                    p.unit AS product_unit,
                    p.type AS catalog_type,
                    p.list_price AS catalog_list_price,
                    p.floor_price AS catalog_floor_price
                FROM opportunity_items oi
                JOIN products p ON p.id = oi.product_id
                WHERE oi.id = ?
                """;

        try (PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setLong(1, id);
            try (ResultSet rs = stmt.executeQuery()) {
                if (rs.next()) {
                    return mapItem(rs);
                }
            }
        }
        return null;
    }

    public long create(Connection conn, long opportunityId, OpportunityItemDTO item) throws SQLException {
        String sql = """
                INSERT INTO opportunity_items (
                    opportunity_id, product_id, quantity, unit_price, list_price,
                    discount_percent, product_type, billing_cycle, term_count,
                    annual_amount, total_amount, notes
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """;

        try (PreparedStatement stmt = conn.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS)) {
            stmt.setLong(1, opportunityId);
            stmt.setLong(2, item.getProductId());
            stmt.setBigDecimal(3, item.getQuantity());
            stmt.setBigDecimal(4, item.getUnitPrice());
            stmt.setBigDecimal(5, item.getListPrice());
            stmt.setBigDecimal(6, item.getDiscountPercent());
            stmt.setString(7, item.getProductType());
            stmt.setString(8, item.getBillingCycle());
            stmt.setInt(9, item.getTermCount());
            stmt.setBigDecimal(10, item.getAnnualAmount());
            stmt.setBigDecimal(11, item.getTotalAmount());
            stmt.setString(12, item.getNotes());

            stmt.executeUpdate();
            try (ResultSet rs = stmt.getGeneratedKeys()) {
                if (rs.next()) {
                    long newId = rs.getLong(1);
                    item.setId(newId);
                    return newId;
                }
            }
        }
        throw new SQLException("Không thể thêm sản phẩm vào cơ hội");
    }

    public void update(Connection conn, long id, OpportunityItemDTO item) throws SQLException {
        String sql = """
                UPDATE opportunity_items SET
                    product_id = ?, quantity = ?, unit_price = ?, list_price = ?,
                    discount_percent = ?, product_type = ?, billing_cycle = ?,
                    term_count = ?, annual_amount = ?, total_amount = ?, notes = ?
                WHERE id = ?
                """;

        try (PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setLong(1, item.getProductId());
            stmt.setBigDecimal(2, item.getQuantity());
            stmt.setBigDecimal(3, item.getUnitPrice());
            stmt.setBigDecimal(4, item.getListPrice());
            stmt.setBigDecimal(5, item.getDiscountPercent());
            stmt.setString(6, item.getProductType());
            stmt.setString(7, item.getBillingCycle());
            stmt.setInt(8, item.getTermCount());
            stmt.setBigDecimal(9, item.getAnnualAmount());
            stmt.setBigDecimal(10, item.getTotalAmount());
            stmt.setString(11, item.getNotes());
            stmt.setLong(12, id);

            stmt.executeUpdate();
        }
    }

    public void delete(Connection conn, long id) throws SQLException {
        String sql = "DELETE FROM opportunity_items WHERE id = ?";
        try (PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setLong(1, id);
            stmt.executeUpdate();
        }
    }

    public void deleteByOpportunityId(Connection conn, long opportunityId) throws SQLException {
        String sql = "DELETE FROM opportunity_items WHERE opportunity_id = ?";
        try (PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setLong(1, opportunityId);
            stmt.executeUpdate();
        }
    }

    public Map<String, BigDecimal> calculateOpportunityTotals(Connection conn, long opportunityId) throws SQLException {
        String sql = """
                SELECT
                    COALESCE(SUM(total_amount), 0) AS total_amount,
                    COALESCE(SUM(annual_amount), 0) AS total_annual_amount
                FROM opportunity_items
                WHERE opportunity_id = ?
                """;

        Map<String, BigDecimal> result = new LinkedHashMap<>();
        try (PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setLong(1, opportunityId);
            try (ResultSet rs = stmt.executeQuery()) {
                if (rs.next()) {
                    result.put("amount", rs.getBigDecimal("total_amount"));
                    result.put("annualAmount", rs.getBigDecimal("total_annual_amount"));
                } else {
                    result.put("amount", BigDecimal.ZERO);
                    result.put("annualAmount", BigDecimal.ZERO);
                }
            }
        }
        return result;
    }

    public Map<String, BigDecimal> recalculateOpportunityTotals(long opportunityId) throws SQLException {
        try (Connection conn = DatabaseConfig.getConnection()) {
            return recalculateOpportunityTotals(conn, opportunityId);
        }
    }

    public Map<String, BigDecimal> recalculateOpportunityTotals(Connection conn, long opportunityId) throws SQLException {
        Map<String, BigDecimal> totals = calculateOpportunityTotals(conn, opportunityId);
        BigDecimal amount = totals.getOrDefault("amount", BigDecimal.ZERO);
        BigDecimal annualAmount = totals.getOrDefault("annualAmount", BigDecimal.ZERO);

        String updateSql = "UPDATE opportunities SET amount = ?, annual_amount = ? WHERE id = ? AND is_deleted = 0";
        try (PreparedStatement stmt = conn.prepareStatement(updateSql)) {
            stmt.setBigDecimal(1, amount);
            stmt.setBigDecimal(2, annualAmount);
            stmt.setLong(3, opportunityId);
            stmt.executeUpdate();
        }
        return totals;
    }

    private Map<String, Object> mapItem(ResultSet rs) throws SQLException {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("id", rs.getLong("id"));
        map.put("opportunityId", rs.getLong("opportunity_id"));
        map.put("productId", rs.getLong("product_id"));
        map.put("productCode", rs.getString("product_code"));
        map.put("productName", rs.getString("product_name"));
        map.put("productUnit", rs.getString("product_unit"));
        map.put("productType", rs.getString("product_type"));
        map.put("quantity", rs.getBigDecimal("quantity"));
        map.put("unitPrice", rs.getBigDecimal("unit_price"));
        map.put("listPrice", rs.getBigDecimal("list_price"));
        map.put("discountPercent", rs.getBigDecimal("discount_percent"));
        map.put("billingCycle", rs.getString("billing_cycle"));
        map.put("termCount", rs.getInt("term_count"));
        map.put("annualAmount", rs.getBigDecimal("annual_amount"));
        map.put("totalAmount", rs.getBigDecimal("total_amount"));
        map.put("notes", rs.getString("notes"));
        map.put("createdAt", rs.getTimestamp("created_at"));
        map.put("catalogType", rs.getString("catalog_type"));
        map.put("catalogListPrice", rs.getBigDecimal("catalog_list_price"));
        map.put("catalogFloorPrice", rs.getBigDecimal("catalog_floor_price"));
        return map;
    }
}
