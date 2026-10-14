package com.crm.dao.reports;

import com.crm.config.DatabaseConfig;
import com.crm.dto.reports.CampaignPerformanceReportDTO;
import com.crm.dto.reports.LeadSourceReportDTO;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.*;

public class LeadSourceReportDAO {

    public List<LeadSourceReportDTO> getSourcePerformanceReport(String fromDate, String toDate) throws SQLException {
        StringBuilder sql = new StringBuilder("""
            SELECT 
                COALESCE(NULLIF(TRIM(c.lead_source), ''), 'CHUA_XAC_DINH') AS source_code,
                COUNT(c.id) AS total_leads,
                COUNT(CASE WHEN c.accepted_at IS NOT NULL OR c.status IN ('DANG_CHAM_SOC', 'CONVERTED') OR c.assignment_status = 'ACCEPTED' THEN 1 END) AS accepted_leads,
                COUNT(CASE WHEN c.status = 'CONVERTED' OR c.converted_opportunity_id IS NOT NULL OR EXISTS (SELECT 1 FROM opportunities o WHERE o.customer_id = c.id AND o.is_deleted = 0) THEN 1 END) AS converted_leads,
                (SELECT COUNT(o.id) FROM opportunities o JOIN customers c2 ON c2.id = o.customer_id 
                 WHERE COALESCE(NULLIF(TRIM(c2.lead_source), ''), 'CHUA_XAC_DINH') = source_code AND o.is_deleted = 0) AS total_opps,
                (SELECT COALESCE(SUM(o.amount), 0) FROM opportunities o JOIN customers c2 ON c2.id = o.customer_id 
                 WHERE COALESCE(NULLIF(TRIM(c2.lead_source), ''), 'CHUA_XAC_DINH') = source_code AND o.is_deleted = 0) AS total_opp_value,
                (SELECT COUNT(o.id) FROM opportunities o JOIN customers c2 ON c2.id = o.customer_id 
                 WHERE COALESCE(NULLIF(TRIM(c2.lead_source), ''), 'CHUA_XAC_DINH') = source_code AND o.stage_id = 5 AND o.is_deleted = 0) AS won_opps,
                (SELECT COALESCE(SUM(o.amount), 0) FROM opportunities o JOIN customers c2 ON c2.id = o.customer_id 
                 WHERE COALESCE(NULLIF(TRIM(c2.lead_source), ''), 'CHUA_XAC_DINH') = source_code AND o.stage_id = 5 AND o.is_deleted = 0) AS won_revenue
            FROM customers c
            WHERE c.is_deleted = 0
        """);

        List<Object> params = new ArrayList<>();
        if (fromDate != null && !fromDate.isBlank()) {
            sql.append(" AND c.created_at >= ?");
            params.add(fromDate.trim() + " 00:00:00");
        }
        if (toDate != null && !toDate.isBlank()) {
            sql.append(" AND c.created_at <= ?");
            params.add(toDate.trim() + " 23:59:59");
        }

        sql.append(" GROUP BY source_code ORDER BY total_leads DESC");

        List<LeadSourceReportDTO> list = new ArrayList<>();
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql.toString())) {
            for (int i = 0; i < params.size(); i++) {
                ps.setObject(i + 1, params.get(i));
            }
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    LeadSourceReportDTO dto = new LeadSourceReportDTO();
                    String code = rs.getString("source_code");
                    dto.setSourceCode(code);
                    dto.setSourceName(formatSourceName(code));

                    long totalLeads = rs.getLong("total_leads");
                    long acceptedLeads = rs.getLong("accepted_leads");
                    long convertedLeads = rs.getLong("converted_leads");
                    long totalOpps = rs.getLong("total_opps");
                    BigDecimal totalOppVal = rs.getBigDecimal("total_opp_value");
                    long wonOpps = rs.getLong("won_opps");
                    BigDecimal wonRev = rs.getBigDecimal("won_revenue");

                    dto.setTotalLeads(totalLeads);
                    dto.setAcceptedLeads(acceptedLeads);
                    dto.setConvertedLeads(convertedLeads);
                    dto.setTotalOpportunities(totalOpps);
                    dto.setTotalOpportunityValue(totalOppVal != null ? totalOppVal : BigDecimal.ZERO);
                    dto.setWonOpportunities(wonOpps);
                    dto.setWonRevenue(wonRev != null ? wonRev : BigDecimal.ZERO);

                    double acceptRate = totalLeads > 0 ? ((double) acceptedLeads / totalLeads) * 100.0 : 0.0;
                    double convertRate = totalLeads > 0 ? ((double) convertedLeads / totalLeads) * 100.0 : 0.0;
                    double winRate = totalOpps > 0 ? ((double) wonOpps / totalOpps) * 100.0 : 0.0;

                    dto.setAcceptanceRate(Math.round(acceptRate * 10.0) / 10.0);
                    dto.setConversionRate(Math.round(convertRate * 10.0) / 10.0);
                    dto.setWinRate(Math.round(winRate * 10.0) / 10.0);

                    // Đánh giá chất lượng nguồn lead
                    if (convertRate >= 20.0 || (wonRev != null && wonRev.compareTo(new BigDecimal("50000000")) >= 0)) {
                        dto.setQualityGrade("TOP_TIER"); // Nguồn chất lượng cao / Doanh thu khủng
                    } else if (convertRate >= 10.0 || acceptRate >= 60.0) {
                        dto.setQualityGrade("GOOD"); // Nguồn hiệu quả khá
                    } else {
                        dto.setQualityGrade("OPTIMIZE_NEEDED"); // Cần tối ưu hoặc cắt giảm chi phí
                    }

                    list.add(dto);
                }
            }
        }
        return list;
    }

    public List<CampaignPerformanceReportDTO> getCampaignPerformanceReport(String fromDate, String toDate) throws SQLException {
        StringBuilder sql = new StringBuilder("""
            SELECT 
                camp.id, camp.code, camp.name, camp.channel, camp.status, camp.budget,
                (SELECT COUNT(*) FROM customers c WHERE c.campaign_id = camp.id AND c.is_deleted = 0
                 AND (? IS NULL OR c.created_at >= ?) AND (? IS NULL OR c.created_at <= ?)) AS total_leads,
                (SELECT COUNT(*) FROM customers c WHERE c.campaign_id = camp.id AND c.is_deleted = 0 
                 AND (c.accepted_at IS NOT NULL OR c.status IN ('DANG_CHAM_SOC', 'CONVERTED') OR c.assignment_status = 'ACCEPTED')
                 AND (? IS NULL OR c.created_at >= ?) AND (? IS NULL OR c.created_at <= ?)) AS accepted_leads,
                (SELECT COUNT(*) FROM customers c WHERE c.campaign_id = camp.id AND c.is_deleted = 0 
                 AND (c.status = 'CONVERTED' OR c.converted_opportunity_id IS NOT NULL OR EXISTS (SELECT 1 FROM opportunities o WHERE o.customer_id = c.id AND o.is_deleted = 0))
                 AND (? IS NULL OR c.created_at >= ?) AND (? IS NULL OR c.created_at <= ?)) AS converted_leads,
                (SELECT COUNT(o.id) FROM opportunities o WHERE o.campaign_id = camp.id AND o.is_deleted = 0) AS total_opps,
                (SELECT COALESCE(SUM(o.amount), 0) FROM opportunities o WHERE o.campaign_id = camp.id AND o.is_deleted = 0) AS total_opp_value,
                (SELECT COUNT(o.id) FROM opportunities o WHERE o.campaign_id = camp.id AND o.stage_id = 5 AND o.is_deleted = 0) AS won_opps,
                (SELECT COALESCE(SUM(o.amount), 0) FROM opportunities o WHERE o.campaign_id = camp.id AND o.stage_id = 5 AND o.is_deleted = 0) AS won_revenue
            FROM campaigns camp
            ORDER BY total_leads DESC, camp.id DESC
        """);

        String pFrom = (fromDate != null && !fromDate.isBlank()) ? fromDate.trim() + " 00:00:00" : null;
        String pTo = (toDate != null && !toDate.isBlank()) ? toDate.trim() + " 23:59:59" : null;

        List<CampaignPerformanceReportDTO> list = new ArrayList<>();
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql.toString())) {
            // Bind date filters for subqueries
            ps.setString(1, pFrom); ps.setString(2, pFrom); ps.setString(3, pTo); ps.setString(4, pTo);
            ps.setString(5, pFrom); ps.setString(6, pFrom); ps.setString(7, pTo); ps.setString(8, pTo);
            ps.setString(9, pFrom); ps.setString(10, pFrom); ps.setString(11, pTo); ps.setString(12, pTo);

            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    CampaignPerformanceReportDTO dto = new CampaignPerformanceReportDTO();
                    dto.setCampaignId(rs.getLong("id"));
                    dto.setCampaignCode(rs.getString("code"));
                    dto.setCampaignName(rs.getString("name"));
                    dto.setChannel(rs.getString("channel"));
                    dto.setStatus(rs.getString("status"));

                    BigDecimal budget = rs.getBigDecimal("budget");
                    dto.setBudget(budget != null ? budget : BigDecimal.ZERO);

                    long totalLeads = rs.getLong("total_leads");
                    long acceptedLeads = rs.getLong("accepted_leads");
                    long convertedLeads = rs.getLong("converted_leads");
                    long totalOpps = rs.getLong("total_opps");
                    BigDecimal totalOppVal = rs.getBigDecimal("total_opp_value");
                    long wonOpps = rs.getLong("won_opps");
                    BigDecimal wonRev = rs.getBigDecimal("won_revenue");

                    dto.setTotalLeads(totalLeads);
                    dto.setAcceptedLeads(acceptedLeads);
                    dto.setConvertedLeads(convertedLeads);
                    dto.setTotalOpportunities(totalOpps);
                    dto.setTotalOpportunityValue(totalOppVal != null ? totalOppVal : BigDecimal.ZERO);
                    dto.setWonOpportunities(wonOpps);
                    dto.setWonRevenue(wonRev != null ? wonRev : BigDecimal.ZERO);

                    double acceptRate = totalLeads > 0 ? ((double) acceptedLeads / totalLeads) * 100.0 : 0.0;
                    double convertRate = totalLeads > 0 ? ((double) convertedLeads / totalLeads) * 100.0 : 0.0;
                    dto.setAcceptanceRate(Math.round(acceptRate * 10.0) / 10.0);
                    dto.setConversionRate(Math.round(convertRate * 10.0) / 10.0);

                    // Tính ROI: (WonRevenue - Budget) / Budget * 100
                    BigDecimal roi = BigDecimal.ZERO;
                    if (budget != null && budget.compareTo(BigDecimal.ZERO) > 0) {
                        BigDecimal net = (wonRev != null ? wonRev : BigDecimal.ZERO).subtract(budget);
                        roi = net.multiply(BigDecimal.valueOf(100)).divide(budget, 1, RoundingMode.HALF_UP);
                    }
                    dto.setRoi(roi);

                    if (roi.compareTo(BigDecimal.ZERO) > 0) {
                        dto.setBudgetStatus("PROFITABLE");
                    } else if (roi.compareTo(new BigDecimal("-100")) == 0 && totalLeads == 0) {
                        dto.setBudgetStatus("RUNNING");
                    } else if (roi.compareTo(BigDecimal.ZERO) == 0) {
                        dto.setBudgetStatus("BREAK_EVEN");
                    } else {
                        dto.setBudgetStatus("LOSS");
                    }

                    list.add(dto);
                }
            }
        }
        return list;
    }

    public Map<String, Object> getOverviewKpis(String fromDate, String toDate) throws SQLException {
        List<LeadSourceReportDTO> sourceList = getSourcePerformanceReport(fromDate, toDate);

        long totalLeads = 0;
        long totalAccepted = 0;
        long totalConverted = 0;
        BigDecimal totalWonRevenue = BigDecimal.ZERO;
        String topSource = "—";
        double topConversionRate = 0.0;

        for (LeadSourceReportDTO s : sourceList) {
            totalLeads += s.getTotalLeads();
            totalAccepted += s.getAcceptedLeads();
            totalConverted += s.getConvertedLeads();
            totalWonRevenue = totalWonRevenue.add(s.getWonRevenue());

            if (s.getTotalLeads() >= 1 && s.getConversionRate() > topConversionRate) {
                topConversionRate = s.getConversionRate();
                topSource = s.getSourceName() + " (" + topConversionRate + "%)";
            }
        }

        double overallAcceptRate = totalLeads > 0 ? ((double) totalAccepted / totalLeads) * 100.0 : 0.0;
        double overallConvertRate = totalLeads > 0 ? ((double) totalConverted / totalLeads) * 100.0 : 0.0;

        Map<String, Object> kpis = new LinkedHashMap<>();
        kpis.put("totalLeads", totalLeads);
        kpis.put("totalAccepted", totalAccepted);
        kpis.put("overallAcceptanceRate", Math.round(overallAcceptRate * 10.0) / 10.0);
        kpis.put("totalConverted", totalConverted);
        kpis.put("overallConversionRate", Math.round(overallConvertRate * 10.0) / 10.0);
        kpis.put("totalWonRevenue", totalWonRevenue);
        kpis.put("topPerformingSource", topSource);
        kpis.put("sourcesCount", sourceList.size());

        return kpis;
    }

    public static String formatSourceName(String code) {
        if (code == null || code.isBlank()) return "Chưa xác định";
        return switch (code.toUpperCase().trim()) {
            case "HOI_THAO" -> "🎪 Hội thảo / Triển lãm";
            case "SU_KIEN", "SỰ KIỆN" -> "🎟️ Sự kiện / Workshop";
            case "WEBSITE" -> "🌐 Website / Form liên hệ";
            case "FACEBOOK" -> "📱 Facebook Lead Ads";
            case "GOOGLE_ADS" -> "🔍 Google Search / Ads";
            case "TIKTOK" -> "🎵 TikTok Ads";
            case "LINKEDIN" -> "💼 LinkedIn B2B";
            case "EMAIL" -> "📧 Email Marketing";
            case "GIOI_THIEU" -> "🤝 Khách hàng giới thiệu";
            case "COLD_CALL" -> "📞 Cold Calling / Outbound";
            case "CHUA_XAC_DINH" -> "❓ Chưa phân loại nguồn";
            default -> code;
        };
    }
}
