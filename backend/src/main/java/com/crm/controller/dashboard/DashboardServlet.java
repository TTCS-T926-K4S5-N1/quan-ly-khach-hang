package com.crm.controller.dashboard;

import com.crm.dto.common.ApiResponse;
import com.crm.service.dashboard.DashboardService;
import com.crm.util.ResponseUtil;

import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;

import java.io.IOException;

@WebServlet({
        "/api/dashboard",
        "/api/dashboard/*"
})
public class DashboardServlet extends HttpServlet {

    private final DashboardService dashboardService = new DashboardService();

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        try {
            long currentUserId = requireUser(req);
            String path = req.getPathInfo();

            if (path == null || path.equals("/") || "/overview".equalsIgnoreCase(path)) {
                String roleView = req.getParameter("role");
                if (roleView == null || roleView.isBlank()) {
                    roleView = req.getParameter("roleView");
                }
                Integer year = parseInteger(req.getParameter("year"));
                Integer month = parseInteger(req.getParameter("month"));
                Integer quarter = parseInteger(req.getParameter("quarter"));
                Long teamId = parseLong(req.getParameter("teamId"));

                var data = dashboardService.getDashboard(currentUserId, roleView, teamId, year, month, quarter);
                ResponseUtil.json(resp, 200, ApiResponse.success("Tải dữ liệu dashboard thành công", data));
                return;
            }

            ResponseUtil.json(resp, 404, ApiResponse.error("Không tìm thấy đường dẫn: " + path, null));
        } catch (SecurityException e) {
            ResponseUtil.json(resp, 403, ApiResponse.error(e.getMessage(), null));
        } catch (IllegalArgumentException e) {
            ResponseUtil.json(resp, 400, ApiResponse.error(e.getMessage(), null));
        } catch (Exception e) {
            ResponseUtil.json(resp, 500, ApiResponse.error("Lỗi máy chủ: " + e.getMessage(), null));
        }
    }

    private Long parseLong(String str) {
        if (str == null || str.trim().isEmpty()) return null;
        try {
            return Long.parseLong(str.trim());
        } catch (NumberFormatException e) {
            return null;
        }
    }

    private Integer parseInteger(String str) {
        if (str == null || str.trim().isEmpty()) return null;
        try {
            return Integer.parseInt(str.trim());
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
