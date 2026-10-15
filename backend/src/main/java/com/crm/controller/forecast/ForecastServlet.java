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
        try {
            long currentUserId = requireUser(req);
            String period = req.getParameter("period");
            String groupBy = req.getParameter("groupBy");

            var result = forecastService.getForecast(currentUserId, period, groupBy);
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

    private long requireUser(HttpServletRequest req) {
        HttpSession session = req.getSession(false);
        if (session == null || session.getAttribute("userId") == null) {
            throw new SecurityException("Phiên đăng nhập không hợp lệ hoặc đã hết hạn.");
        }
        return (Long) session.getAttribute("userId");
    }
}
