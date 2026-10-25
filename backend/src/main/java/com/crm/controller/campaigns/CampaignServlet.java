package com.crm.controller.campaigns;

import com.crm.dto.campaigns.CampaignWriteRequest;
import com.crm.dto.common.ApiResponse;
import com.crm.service.campaigns.CampaignService;
import com.crm.util.JsonUtil;
import com.crm.util.ResponseUtil;

import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;

import java.io.IOException;
import java.nio.charset.Charset;
import java.nio.charset.StandardCharsets;
import java.util.NoSuchElementException;

@WebServlet({
        "/api/campaigns",
        "/api/campaigns/*"
})
public class CampaignServlet extends HttpServlet {

    private final CampaignService campaignService = new CampaignService();

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        resp.setHeader("Cache-Control", "no-store");
        try {
            requireUser(req);
            String pathInfo = req.getPathInfo();

            // 1. Danh sách chiến dịch
            if (pathInfo == null || pathInfo.equals("/")) {
                String search = req.getParameter("search");
                String channel = req.getParameter("channel");
                String status = req.getParameter("status");
                var list = campaignService.getCampaigns(search, channel, status);
                ResponseUtil.json(resp, 200, ApiResponse.success("Lấy danh sách chiến dịch thành công", list));
                return;
            }

            // 2. Thống kê tổng quan ROI & Performance toàn hệ thống
            if (pathInfo.equals("/overview")) {
                var stats = campaignService.getCampaignOverviewStats();
                ResponseUtil.json(resp, 200, ApiResponse.success("Lấy số liệu tổng quan thành công", stats));
                return;
            }

            // 3. Dropdown options cho form tạo Lead / Opportunity
            if (pathInfo.equals("/options")) {
                var options = campaignService.getActiveOptions();
                ResponseUtil.json(resp, 200, ApiResponse.success("Lấy danh sách chiến dịch khả dụng thành công", options));
                return;
            }

            String[] parts = pathInfo.split("/");
            if (parts.length >= 2) {
                long campaignId = Long.parseLong(parts[1]);

                // 4. Lấy danh sách Leads thuộc chiến dịch
                if (parts.length >= 3 && "leads".equalsIgnoreCase(parts[2])) {
                    var leads = campaignService.getLeads(campaignId);
                    ResponseUtil.json(resp, 200, ApiResponse.success("Lấy danh sách lead theo chiến dịch thành công", leads));
                    return;
                }

                // 5. Lấy danh sách Cơ hội / Deal bán hàng thuộc chiến dịch
                if (parts.length >= 3 && "opportunities".equalsIgnoreCase(parts[2])) {
                    var opps = campaignService.getOpportunities(campaignId);
                    ResponseUtil.json(resp, 200, ApiResponse.success("Lấy danh sách cơ hội theo chiến dịch thành công", opps));
                    return;
                }

                // 6. Chi tiết 1 chiến dịch
                var campaign = campaignService.getCampaignById(campaignId);
                ResponseUtil.json(resp, 200, ApiResponse.success("Lấy thông tin chi tiết chiến dịch thành công", campaign));
                return;
            }

            ResponseUtil.json(resp, 404, ApiResponse.error("Đường dẫn không tồn tại", null));
        } catch (IllegalArgumentException | NoSuchElementException e) {
            ResponseUtil.json(resp, 400, ApiResponse.error(e.getMessage(), null));
        } catch (SecurityException e) {
            ResponseUtil.json(resp, 401, ApiResponse.error(e.getMessage(), null));
        } catch (Exception e) {
            ResponseUtil.json(resp, 500, ApiResponse.error("Lỗi hệ thống: " + e.getMessage(), null));
        }
    }

    private static String readRequestBody(HttpServletRequest req) throws IOException {
        byte[] bytes = req.getInputStream().readAllBytes();
        if (bytes == null || bytes.length == 0) return "";
        String encoding = req.getCharacterEncoding();
        if (encoding != null && !encoding.isBlank()) {
            try {
                return new String(bytes, Charset.forName(encoding));
            } catch (Exception ignored) {
            }
        }
        return new String(bytes, StandardCharsets.UTF_8);
    }

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        req.setCharacterEncoding("UTF-8");
        resp.setHeader("Cache-Control", "no-store");
        try {
            long userId = requireUser(req);
            CampaignWriteRequest body = JsonUtil.getGson().fromJson(readRequestBody(req), CampaignWriteRequest.class);
            if (body == null) {
                ResponseUtil.json(resp, 400, ApiResponse.error("Dữ liệu gửi lên không hợp lệ", null));
                return;
            }

            long id = campaignService.createCampaign(body, userId);
            var created = campaignService.getCampaignById(id);
            ResponseUtil.json(resp, 201, ApiResponse.success("Tạo chiến dịch marketing thành công", created));
        } catch (IllegalArgumentException e) {
            ResponseUtil.json(resp, 400, ApiResponse.error(e.getMessage(), null));
        } catch (SecurityException e) {
            ResponseUtil.json(resp, 401, ApiResponse.error(e.getMessage(), null));
        } catch (Exception e) {
            ResponseUtil.json(resp, 500, ApiResponse.error("Lỗi khi tạo chiến dịch: " + e.getMessage(), null));
        }
    }

    @Override
    protected void doPut(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        req.setCharacterEncoding("UTF-8");
        resp.setHeader("Cache-Control", "no-store");
        try {
            requireUser(req);
            String pathInfo = req.getPathInfo();
            if (pathInfo == null || pathInfo.equals("/")) {
                ResponseUtil.json(resp, 400, ApiResponse.error("Cần cung cấp ID chiến dịch", null));
                return;
            }

            long id = Long.parseLong(pathInfo.substring(1).split("/")[0]);
            CampaignWriteRequest body = JsonUtil.getGson().fromJson(readRequestBody(req), CampaignWriteRequest.class);
            if (body == null) {
                ResponseUtil.json(resp, 400, ApiResponse.error("Dữ liệu gửi lên không hợp lệ", null));
                return;
            }

            campaignService.updateCampaign(id, body);
            var updated = campaignService.getCampaignById(id);
            ResponseUtil.json(resp, 200, ApiResponse.success("Cập nhật chiến dịch marketing thành công", updated));
        } catch (NumberFormatException e) {
            ResponseUtil.json(resp, 400, ApiResponse.error("ID chiến dịch không hợp lệ", null));
        } catch (IllegalArgumentException | NoSuchElementException e) {
            ResponseUtil.json(resp, 400, ApiResponse.error(e.getMessage(), null));
        } catch (SecurityException e) {
            ResponseUtil.json(resp, 401, ApiResponse.error(e.getMessage(), null));
        } catch (Exception e) {
            ResponseUtil.json(resp, 500, ApiResponse.error("Lỗi khi cập nhật chiến dịch: " + e.getMessage(), null));
        }
    }

    @Override
    protected void doDelete(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        resp.setHeader("Cache-Control", "no-store");
        try {
            requireUser(req);
            String pathInfo = req.getPathInfo();
            if (pathInfo == null || pathInfo.equals("/")) {
                ResponseUtil.json(resp, 400, ApiResponse.error("Cần cung cấp ID chiến dịch cần xóa", null));
                return;
            }

            long id = Long.parseLong(pathInfo.substring(1).split("/")[0]);
            campaignService.deleteCampaign(id);
            ResponseUtil.json(resp, 200, ApiResponse.success("Đã xóa chiến dịch thành công", null));
        } catch (NumberFormatException e) {
            ResponseUtil.json(resp, 400, ApiResponse.error("ID chiến dịch không hợp lệ", null));
        } catch (IllegalArgumentException | NoSuchElementException e) {
            ResponseUtil.json(resp, 400, ApiResponse.error(e.getMessage(), null));
        } catch (SecurityException e) {
            ResponseUtil.json(resp, 401, ApiResponse.error(e.getMessage(), null));
        } catch (Exception e) {
            ResponseUtil.json(resp, 500, ApiResponse.error("Lỗi khi xóa chiến dịch: " + e.getMessage(), null));
        }
    }

    private long requireUser(HttpServletRequest req) {
        HttpSession session = req.getSession(false);
        if (session == null || session.getAttribute("userId") == null) {
            throw new SecurityException("Phiên làm việc đã hết hạn. Vui lòng đăng nhập lại.");
        }
        return (Long) session.getAttribute("userId");
    }
}
