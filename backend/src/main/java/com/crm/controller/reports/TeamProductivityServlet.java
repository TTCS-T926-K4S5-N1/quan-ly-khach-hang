package com.crm.controller.reports;

import com.crm.dto.common.ApiResponse;
import com.crm.service.reports.TeamProductivityService;
import com.crm.util.ResponseUtil;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;

import java.io.IOException;

@WebServlet({
        "/api/reports/team-productivity",
        "/api/reports/team-productivity/*"
})
public class TeamProductivityServlet extends HttpServlet {

    private final TeamProductivityService productivityService = new TeamProductivityService();

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        resp.setHeader("Cache-Control", "no-store");
        try {
            long currentUserId = requireUser(req);
            String pathInfo = req.getPathInfo();
            String period = req.getParameter("period");
            String teamIdStr = req.getParameter("teamId");
            Long teamId = (teamIdStr != null && !teamIdStr.isBlank() && !teamIdStr.equals("0")) ? Long.parseLong(teamIdStr) : null;

            Integer year = parseInteger(req.getParameter("year"));
            Integer month = parseInteger(req.getParameter("month"));

            // 1. Xuất Excel báo cáo năng suất nhóm
            if (pathInfo != null && (pathInfo.equals("/export") || pathInfo.equals("/excel"))) {
                productivityService.exportToExcel(resp, currentUserId, teamId, period, year, month);
                return;
            }

            // 2. Lấy dữ liệu báo cáo JSON
            var data = productivityService.getProductivityReport(currentUserId, teamId, period, year, month);
            ResponseUtil.json(resp, 200, ApiResponse.success("Lấy báo cáo hoạt động và năng suất nhóm thành công", data));
        } catch (SecurityException e) {
            ResponseUtil.json(resp, 401, ApiResponse.error(e.getMessage(), null));
        } catch (Exception e) {
            e.printStackTrace();
            ResponseUtil.json(resp, 500, ApiResponse.error("Lỗi khi tải báo cáo năng suất: " + e.getMessage(), null));
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

    private static long requireUser(HttpServletRequest req) {
        HttpSession session = req.getSession(false);
        if (session == null || session.getAttribute("userId") == null) {
            throw new SecurityException("Phiên làm việc đã hết hạn hoặc chưa đăng nhập.");
        }
        return (Long) session.getAttribute("userId");
    }
}
