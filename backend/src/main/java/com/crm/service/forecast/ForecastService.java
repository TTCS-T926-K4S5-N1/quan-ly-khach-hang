package com.crm.service.forecast;

import com.crm.dao.forecast.ForecastDAO;
import com.crm.dao.permissions.PermissionDAO;

import java.util.Map;

public class ForecastService {

    private final ForecastDAO forecastDAO = new ForecastDAO();
    private final PermissionDAO permissionDAO = new PermissionDAO();

    public Map<String, Object> getForecast(long currentUserId, String period, String groupBy) throws Exception {
        ForecastDAO.PeriodRange periodRange = forecastDAO.resolvePeriod(period);
        return forecastDAO.getForecastReport(periodRange, groupBy);
    }
}
