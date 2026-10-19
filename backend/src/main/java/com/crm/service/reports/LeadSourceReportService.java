package com.crm.service.reports;

import com.crm.dao.reports.LeadSourceReportDAO;
import com.crm.dto.reports.CampaignPerformanceReportDTO;
import com.crm.dto.reports.LeadSourceReportDTO;
import com.crm.service.export.ExcelExportService;
import jakarta.servlet.http.HttpServletResponse;

import java.io.IOException;
import java.sql.SQLException;
import java.util.*;

public class LeadSourceReportService {

    private final LeadSourceReportDAO reportDAO = new LeadSourceReportDAO();
    private final ExcelExportService excelExportService = new ExcelExportService();

    public Map<String, Object> getFullReport(String fromDate, String toDate) throws SQLException {
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("kpis", reportDAO.getOverviewKpis(fromDate, toDate));
        result.put("sources", reportDAO.getSourcePerformanceReport(fromDate, toDate));
        result.put("campaigns", reportDAO.getCampaignPerformanceReport(fromDate, toDate));
        result.put("fromDate", fromDate);
        result.put("toDate", toDate);
        return result;
    }

    public List<LeadSourceReportDTO> getSourceReport(String fromDate, String toDate) throws SQLException {
        return reportDAO.getSourcePerformanceReport(fromDate, toDate);
    }

    public List<CampaignPerformanceReportDTO> getCampaignReport(String fromDate, String toDate) throws SQLException {
        return reportDAO.getCampaignPerformanceReport(fromDate, toDate);
    }

    public void exportToExcel(HttpServletResponse response, String fromDate, String toDate) throws SQLException, IOException {
        List<LeadSourceReportDTO> sources = reportDAO.getSourcePerformanceReport(fromDate, toDate);
        List<CampaignPerformanceReportDTO> campaigns = reportDAO.getCampaignPerformanceReport(fromDate, toDate);
        Map<String, Object> kpis = reportDAO.getOverviewKpis(fromDate, toDate);

        String dateLabel = (fromDate != null && toDate != null)
                ? "Từ " + fromDate + " đến " + toDate
                : "Toàn bộ thời gian";

        excelExportService.exportLeadSourcePerformance(response, sources, campaigns, kpis, dateLabel);
    }
}
