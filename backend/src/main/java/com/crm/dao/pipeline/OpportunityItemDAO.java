package com.crm.dao.pipeline;

import com.crm.config.DatabaseConfig;
import com.crm.dto.pipeline.OpportunityItemDTO;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.sql.*;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

public class OpportunityItemDAO {

    public List<OpportunityItemDTO> findByOpportunityId(long opportunityId) throws SQLException {
        String sql = """
            SELECT 
                i.id, i.opportunity_id, i.product_id, i.product_code, i.product_name,
                i.product_type, i.quantity, i.unit, i.unit_price, i.discount_percent,
                i.billing_cycle, i.billing_duration, i.annual_contract_value, i.amount, i.notes
            FROM opportunity_items i
            WHERE i.opportunity_id = ?
            ORDER BY i.id ASC
        """;

        List<OpportunityItemDTO> list = new ArrayList<>();
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setLong(1, opportunityId);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    OpportunityItemDTO dto = mapResultSet(rs);
                    list.add(dto);
                }
            }
        }
        return list;
    }

    public OpportunityItemDTO findById(long itemId) throws SQLException {
        String sql = """
            SELECT 
                i.id, i.opportunity_id, i.product_id, i.product_code, i.product_name,
                i.product_type, i.quantity, i.unit, i.unit_price, i.discount_percent,
                i.billing_cycle, i.billing_duration, i.annual_contract_value, i.amount, i.notes
            FROM opportunity_items i
            WHERE i.id = ?
        """;
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setLong(1, itemId);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    return mapResultSet(rs);
                }
            }
        }
        return null;
    }

    public void saveItems(long opportunityId, List<OpportunityItemDTO> items) throws SQLException {
        try (Connection conn = DatabaseConfig.getConnection()) {
            conn.setAutoCommit(false);
            try {
                // Delete existing items
                try (PreparedStatement psDel = conn.prepareStatement("DELETE FROM opportunity_items WHERE opportunity_id = ?")) {
                    psDel.setLong(1, opportunityId);
                    psDel.executeUpdate();
                }

                if (items != null && !items.isEmpty()) {
                    String insertSql = """
                        INSERT INTO opportunity_items (
                            opportunity_id, product_id, product_code, product_name, product_type,
                            quantity, unit, unit_price, discount_percent, billing_cycle,
                            billing_duration, annual_contract_value, amount, notes
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """;
                    try (PreparedStatement psIns = conn.prepareStatement(insertSql, Statement.RETURN_GENERATED_KEYS)) {
                        for (OpportunityItemDTO item : items) {
                            calculateItemAmounts(item);

                            psIns.setLong(1, opportunityId);
                            psIns.setLong(2, item.getProductId());
                            psIns.setString(3, item.getProductCode());
                            psIns.setString(4, item.getProductName());
                            psIns.setString(5, item.getProductType() != null ? item.getProductType() : "ONE_TIME");
                            psIns.setInt(6, item.getQuantity() > 0 ? item.getQuantity() : 1);
                            psIns.setString(7, item.getUnit());
                            psIns.setBigDecimal(8, item.getUnitPrice() != null ? item.getUnitPrice() : BigDecimal.ZERO);
                            psIns.setBigDecimal(9, item.getDiscountPercent() != null ? item.getDiscountPercent() : BigDecimal.ZERO);
                            psIns.setString(10, item.getBillingCycle() != null ? item.getBillingCycle() : "MONTHLY");
                            psIns.setInt(11, item.getBillingDuration() > 0 ? item.getBillingDuration() : 1);
                            psIns.setBigDecimal(12, item.getAnnualContractValue());
                            psIns.setBigDecimal(13, item.getAmount());
                            psIns.setString(14, item.getNotes());
                            psIns.addBatch();
                        }
                        psIns.executeBatch();
                    }
                }

                // Update opportunity total amount
                updateOpportunityTotalInternal(conn, opportunityId);

                conn.commit();
            } catch (Exception e) {
                conn.rollback();
                throw e;
            } finally {
                conn.setAutoCommit(true);
            }
        }
    }

    public void deleteItem(long itemId, long opportunityId) throws SQLException {
        try (Connection conn = DatabaseConfig.getConnection()) {
            conn.setAutoCommit(false);
            try {
                try (PreparedStatement ps = conn.prepareStatement("DELETE FROM opportunity_items WHERE id = ? AND opportunity_id = ?")) {
                    ps.setLong(1, itemId);
                    ps.setLong(2, opportunityId);
                    ps.executeUpdate();
                }

                updateOpportunityTotalInternal(conn, opportunityId);
                conn.commit();
            } catch (Exception e) {
                conn.rollback();
                throw e;
            } finally {
                conn.setAutoCommit(true);
            }
        }
    }

    public Map<String, Object> calculateOpportunityTotals(long opportunityId) throws SQLException {
        String sql = """
            SELECT 
                COALESCE(SUM(amount), 0) AS total_amount,
                COALESCE(SUM(annual_contract_value), 0) AS total_acv,
                COUNT(id) AS item_count
            FROM opportunity_items
            WHERE opportunity_id = ?
        """;
        Map<String, Object> totals = new LinkedHashMap<>();
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setLong(1, opportunityId);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    totals.put("totalAmount", rs.getBigDecimal("total_amount"));
                    totals.put("totalAcv", rs.getBigDecimal("total_acv"));
                    totals.put("itemCount", rs.getInt("item_count"));
                }
            }
        }
        return totals;
    }

    private void updateOpportunityTotalInternal(Connection conn, long opportunityId) throws SQLException {
        String sql = """
            UPDATE opportunities 
            SET amount = (
                SELECT COALESCE(SUM(amount), 0) 
                FROM opportunity_items 
                WHERE opportunity_id = ?
            )
            WHERE id = ?
        """;
        try (PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setLong(1, opportunityId);
            ps.setLong(2, opportunityId);
            ps.executeUpdate();
        }
    }

    public static void calculateItemAmounts(OpportunityItemDTO item) {
        BigDecimal unitPrice = item.getUnitPrice() != null ? item.getUnitPrice() : BigDecimal.ZERO;
        BigDecimal discount = item.getDiscountPercent() != null ? item.getDiscountPercent() : BigDecimal.ZERO;
        int qty = item.getQuantity() > 0 ? item.getQuantity() : 1;
        String type = item.getProductType() != null ? item.getProductType().toUpperCase() : "ONE_TIME";
        String cycle = item.getBillingCycle() != null ? item.getBillingCycle().toUpperCase() : "MONTHLY";
        int duration = item.getBillingDuration() > 0 ? item.getBillingDuration() : 1;

        // Discount factor
        BigDecimal factor = BigDecimal.ONE.subtract(discount.divide(new BigDecimal("100"), 4, RoundingMode.HALF_UP));
        if (factor.compareTo(BigDecimal.ZERO) < 0) factor = BigDecimal.ZERO;

        BigDecimal netUnitPrice = unitPrice.multiply(factor);

        if (type.contains("RECURRING") || type.contains("SUBSCRIPTION")) {
            // Subscription: amount = netUnitPrice * qty * duration
            BigDecimal lineTotal = netUnitPrice.multiply(new BigDecimal(qty)).multiply(new BigDecimal(duration));
            item.setAmount(lineTotal.setScale(2, RoundingMode.HALF_UP));

            // ACV calculation based on billing cycle
            BigDecimal acv;
            if ("YEARLY".equals(cycle)) {
                acv = netUnitPrice.multiply(new BigDecimal(qty)); // 1 year
            } else if ("QUARTERLY".equals(cycle)) {
                acv = netUnitPrice.multiply(new BigDecimal(qty)).multiply(new BigDecimal("4")); // 4 quarters/year
            } else { // MONTHLY default
                acv = netUnitPrice.multiply(new BigDecimal(qty)).multiply(new BigDecimal("12")); // 12 months/year
            }
            item.setAnnualContractValue(acv.setScale(2, RoundingMode.HALF_UP));
        } else {
            // One-time product / service
            BigDecimal lineTotal = netUnitPrice.multiply(new BigDecimal(qty));
            item.setAmount(lineTotal.setScale(2, RoundingMode.HALF_UP));
            item.setAnnualContractValue(lineTotal.setScale(2, RoundingMode.HALF_UP));
        }
    }

    private OpportunityItemDTO mapResultSet(ResultSet rs) throws SQLException {
        OpportunityItemDTO dto = new OpportunityItemDTO();
        dto.setId(rs.getLong("id"));
        dto.setOpportunityId(rs.getLong("opportunity_id"));
        dto.setProductId(rs.getLong("product_id"));
        dto.setProductCode(rs.getString("product_code"));
        dto.setProductName(rs.getString("product_name"));
        dto.setProductType(rs.getString("product_type"));
        dto.setQuantity(rs.getInt("quantity"));
        dto.setUnit(rs.getString("unit"));
        dto.setUnitPrice(rs.getBigDecimal("unit_price"));
        dto.setDiscountPercent(rs.getBigDecimal("discount_percent"));
        dto.setBillingCycle(rs.getString("billing_cycle"));
        dto.setBillingDuration(rs.getInt("billing_duration"));
        dto.setAnnualContractValue(rs.getBigDecimal("annual_contract_value"));
        dto.setAmount(rs.getBigDecimal("amount"));
        dto.setNotes(rs.getString("notes"));
        return dto;
    }
}
