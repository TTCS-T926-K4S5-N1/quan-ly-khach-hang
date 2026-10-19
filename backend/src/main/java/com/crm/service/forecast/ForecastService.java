package com.crm.service.forecast;

import com.crm.dao.forecast.ForecastDAO;
import com.crm.dao.permissions.PermissionDAO;
import com.crm.service.export.ExcelExportService;
import jakarta.servlet.http.HttpServletResponse;

import java.io.IOException;
import java.util.Map;

public class ForecastService {

    private final ForecastDAO forecastDAO = new ForecastDAO();
    private final PermissionDAO permissionDAO = new PermissionDAO();
    private final ExcelExportService excelExportService = new ExcelExportService();

    public Map<String, Object> getForecast(long currentUserId, String period, String groupBy) throws Exception {
        return getForecast(currentUserId, period, groupBy, null, null, null, null);
    }

    public Map<String, Object> getForecast(
            long currentUserId,
            String period,
            String groupBy,
            Long teamFilterId,
            Integer year,
            Integer month,
            Integer quarter
    ) throws Exception {
        ForecastDAO.PeriodRange periodRange = forecastDAO.resolvePeriod(period, year, month, quarter);
        return forecastDAO.getForecastReport(periodRange, groupBy, teamFilterId);
    }

    public void exportForecastToExcel(
            HttpServletResponse response,
            long currentUserId,
            String period,
            String groupBy,
            Long teamFilterId,
            Integer year,
            Integer month,
            Integer quarter
    ) throws Exception {
        Map<String, Object> forecastData = getForecast(currentUserId, period, groupBy, teamFilterId, year, month, quarter);
        excelExportService.exportSalesForecast(response, forecastData);
    }
}
