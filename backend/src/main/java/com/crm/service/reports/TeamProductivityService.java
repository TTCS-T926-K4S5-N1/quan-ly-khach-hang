package com.crm.service.reports;

import com.crm.dao.reports.TeamProductivityDAO;
import com.crm.service.export.ExcelExportService;
import jakarta.servlet.http.HttpServletResponse;

import java.io.IOException;
import java.sql.SQLException;
import java.util.List;
import java.util.Map;

public class TeamProductivityService {

    private final TeamProductivityDAO productivityDAO = new TeamProductivityDAO();
    private final ExcelExportService excelExportService = new ExcelExportService();

    public Map<String, Object> getProductivityReport(
            long currentUserId,
            Long teamId,
            String periodCode,
            Integer year,
            Integer month
    ) throws SQLException {
        Map<String, Object> report = productivityDAO.getTeamProductivityReport(currentUserId, teamId, periodCode, year, month);
        List<Map<String, Object>> availableTeams = productivityDAO.getAvailableTeams(currentUserId);
        report.put("availableTeams", availableTeams);
        return report;
    }

    public void exportToExcel(
            HttpServletResponse response,
            long currentUserId,
            Long teamId,
            String periodCode,
            Integer year,
            Integer month
    ) throws SQLException, IOException {
        Map<String, Object> report = productivityDAO.getTeamProductivityReport(currentUserId, teamId, periodCode, year, month);
        excelExportService.exportTeamProductivity(response, report);
    }
}
