package com.crm.controller.forecast;

import com.crm.dto.common.ApiResponse;
import com.crm.service.forecast.ForecastService;
import com.crm.util.ResponseUtil;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;

import java.io.IOException;

@WebServlet({
        "/api/forecasts",
        "/api/forecasts/*"
})
public class ForecastServlet extends HttpServlet {

    private final ForecastService forecastService = new ForecastService();

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        resp.setHeader("Cache-Control", "no-store");
        try {
            long currentUserId = requireUser(req);
            String pathInfo = req.getPathInfo();
            String period = req.getParameter("period");
            String groupBy = req.getParameter("groupBy");
            String teamIdStr = req.getParameter("teamId");
            Long teamId = (teamIdStr != null && !teamIdStr.isBlank() && !teamIdStr.equals("0")) ? Long.parseLong(teamIdStr) : null;

            Integer year = parseInteger(req.getParameter("year"));
            Integer month = parseInteger(req.getParameter("month"));
            Integer quarter = parseInteger(req.getParameter("quarter"));

            // 1. Xuất file Excel báo cáo dự báo doanh số & lý do thua
            if (pathInfo != null && (pathInfo.equals("/export") || pathInfo.equals("/excel"))) {
                forecastService.exportForecastToExcel(resp, currentUserId, period, groupBy, teamId, year, month, quarter);
                return;
            }

            // 2. Lấy dữ liệu báo cáo JSON
            var result = forecastService.getForecast(currentUserId, period, groupBy, teamId, year, month, quarter);
            ResponseUtil.json(resp, 200, ApiResponse.success("Lấy báo cáo dự báo doanh số thành công", result));
        } catch (SecurityException e) {
            ResponseUtil.json(resp, 403, ApiResponse.error(e.getMessage(), null));
        } catch (IllegalArgumentException e) {
            ResponseUtil.json(resp, 400, ApiResponse.error(e.getMessage(), null));
        } catch (Exception e) {
            e.printStackTrace();
            ResponseUtil.json(resp, 500, ApiResponse.error("Lỗi máy chủ khi tính dự báo doanh số: " + e.getMessage(), null));
        }
    }

    private static Integer parseInteger(String val) {
        if (val == null || val.isBlank()) return null;
        try {
            return Integer.parseInt(val.trim());
        } catch (NumberFormatException e) {
            return null;
        }
    }

    private long requireUser(HttpServletRequest req) {
        HttpSession session = req.getSession(false);
        if (session == null || session.getAttribute("userId") == null) {
            throw new SecurityException("Phiên đăng nhập không hợp lệ hoặc đã hết hạn.");
        }
        return (Long) session.getAttribute("userId");
    }
}
