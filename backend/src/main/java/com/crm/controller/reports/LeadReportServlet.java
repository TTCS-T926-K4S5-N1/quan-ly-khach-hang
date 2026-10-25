package com.crm.controller.reports;

import com.crm.dto.common.ApiResponse;
import com.crm.service.reports.LeadSourceReportService;
import com.crm.util.ResponseUtil;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;

import java.io.IOException;

@WebServlet({
        "/api/reports/lead-sources",
        "/api/reports/lead-sources/*"
})
public class LeadReportServlet extends HttpServlet {

    private final LeadSourceReportService reportService = new LeadSourceReportService();

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        resp.setHeader("Cache-Control", "no-store");
        try {
            requireUser(req);
            String pathInfo = req.getPathInfo();
            String fromDate = req.getParameter("fromDate");
            String toDate = req.getParameter("toDate");

            // 1. Xuất file Excel báo cáo hiệu quả nguồn lead & chiến dịch
            if (pathInfo != null && (pathInfo.equals("/export") || pathInfo.equals("/excel"))) {
                reportService.exportToExcel(resp, fromDate, toDate);
                return;
            }

            // 2. Lấy dữ liệu báo cáo JSON (KPIs + Nguồn Lead + Chiến dịch)
            var report = reportService.getFullReport(fromDate, toDate);
            ResponseUtil.json(resp, 200, ApiResponse.success("Lấy báo cáo hiệu quả nguồn lead thành công", report));
        } catch (SecurityException e) {
            ResponseUtil.json(resp, 401, ApiResponse.error(e.getMessage(), null));
        } catch (Exception e) {
            ResponseUtil.json(resp, 500, ApiResponse.error("Lỗi khi tải báo cáo: " + e.getMessage(), null));
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
