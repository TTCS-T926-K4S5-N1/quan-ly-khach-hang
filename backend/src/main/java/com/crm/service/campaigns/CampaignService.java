package com.crm.service.campaigns;

import com.crm.dao.campaigns.CampaignDAO;
import com.crm.dto.campaigns.CampaignDTO;
import com.crm.dto.campaigns.CampaignWriteRequest;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.sql.SQLException;
import java.util.*;

public class CampaignService {

    private final CampaignDAO campaignDAO;

    public CampaignService() {
        this.campaignDAO = new CampaignDAO();
    }

    public List<CampaignDTO> getCampaigns(String search, String channel, String status) throws SQLException {
        return campaignDAO.findAll(search, channel, status);
    }

    public CampaignDTO getCampaignById(Long id) throws SQLException {
        if (id == null || id <= 0) throw new IllegalArgumentException("ID chiến dịch không hợp lệ");
        CampaignDTO campaign = campaignDAO.findById(id);
        if (campaign == null) throw new NoSuchElementException("Không tìm thấy chiến dịch ID: " + id);
        return campaign;
    }

    public Map<String, Object> getCampaignOverviewStats() throws SQLException {
        List<CampaignDTO> all = campaignDAO.findAll(null, null, null);
        int totalCampaigns = all.size();
        int activeCampaigns = 0;
        BigDecimal totalBudget = BigDecimal.ZERO;
        BigDecimal totalWonRevenue = BigDecimal.ZERO;
        int totalLeads = 0;
        int totalOpps = 0;
        int totalWonOpps = 0;

        for (CampaignDTO c : all) {
            if ("ACTIVE".equalsIgnoreCase(c.getStatus())) activeCampaigns++;
            if (c.getBudget() != null) totalBudget = totalBudget.add(c.getBudget());
            if (c.getWonRevenue() != null) totalWonRevenue = totalWonRevenue.add(c.getWonRevenue());
            totalLeads += c.getTotalLeads();
            totalOpps += c.getTotalOpportunities();
            totalWonOpps += c.getWonOpportunities();
        }

        BigDecimal overallRoi = BigDecimal.ZERO;
        if (totalBudget.compareTo(BigDecimal.ZERO) > 0) {
            BigDecimal net = totalWonRevenue.subtract(totalBudget);
            overallRoi = net.multiply(BigDecimal.valueOf(100)).divide(totalBudget, 2, RoundingMode.HALF_UP);
        }

        Map<String, Object> stats = new LinkedHashMap<>();
        stats.put("totalCampaigns", totalCampaigns);
        stats.put("activeCampaigns", activeCampaigns);
        stats.put("totalBudget", totalBudget);
        stats.put("totalWonRevenue", totalWonRevenue);
        stats.put("totalLeads", totalLeads);
        stats.put("totalOpps", totalOpps);
        stats.put("totalWonOpps", totalWonOpps);
        stats.put("overallRoi", overallRoi);
        return stats;
    }

    public long createCampaign(CampaignWriteRequest req, Long userId) throws SQLException {
        validateRequest(req);
        return campaignDAO.create(req, userId);
    }

    public void updateCampaign(Long id, CampaignWriteRequest req) throws SQLException {
        if (id == null || id <= 0) throw new IllegalArgumentException("ID chiến dịch không hợp lệ");
        validateRequest(req);
        boolean ok = campaignDAO.update(id, req);
        if (!ok) throw new NoSuchElementException("Không tìm thấy chiến dịch cần cập nhật (ID: " + id + ")");
    }

    public void deleteCampaign(Long id) throws SQLException {
        if (id == null || id <= 0) throw new IllegalArgumentException("ID chiến dịch không hợp lệ");
        boolean ok = campaignDAO.delete(id);
        if (!ok) throw new NoSuchElementException("Không tìm thấy chiến dịch cần xóa (ID: " + id + ")");
    }

    public List<Map<String, Object>> getActiveOptions() throws SQLException {
        return campaignDAO.getActiveOptions();
    }

    public List<Map<String, Object>> getLeads(Long campaignId) throws SQLException {
        return campaignDAO.getLeadsByCampaign(campaignId);
    }

    public List<Map<String, Object>> getOpportunities(Long campaignId) throws SQLException {
        return campaignDAO.getOpportunitiesByCampaign(campaignId);
    }

    private void validateRequest(CampaignWriteRequest req) {
        if (req == null) throw new IllegalArgumentException("Dữ liệu chiến dịch không được để trống");
        if (req.getName() == null || req.getName().trim().isBlank()) {
            throw new IllegalArgumentException("Tên chiến dịch không được để trống");
        }
        if (req.getCode() == null || req.getCode().trim().isBlank()) {
            throw new IllegalArgumentException("Mã chiến dịch không được để trống");
        }
        if (req.getBudget() != null && req.getBudget().compareTo(BigDecimal.ZERO) < 0) {
            throw new IllegalArgumentException("Ngân sách chiến dịch không thể là số âm");
        }
        if (req.getStartDate() != null && req.getEndDate() != null) {
            if (req.getEndDate().isBefore(req.getStartDate())) {
                throw new IllegalArgumentException("Ngày kết thúc chiến dịch không được trước ngày bắt đầu");
            }
        }
    }
}
