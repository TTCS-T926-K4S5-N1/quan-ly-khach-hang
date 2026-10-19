package com.crm.controller.targets;

import com.crm.dto.common.ApiResponse;
import com.crm.service.targets.SalesTargetService;
import com.crm.util.JsonUtil;
import com.crm.util.ResponseUtil;

import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;

import java.io.IOException;
import java.math.BigDecimal;
import java.util.Map;
import java.util.NoSuchElementException;

@WebServlet({
        "/api/sales-targets",
        "/api/sales-targets/*"
})
public class SalesTargetServlet extends HttpServlet {

    private final SalesTargetService targetService = new SalesTargetService();

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        try {
            long currentUserId = requireUser(req);
            String path = req.getPathInfo();

            if (path == null || path.equals("/")) {
                Integer year = parseInteger(req.getParameter("year"));
                Integer month = parseInteger(req.getParameter("month"));
                Integer quarter = parseInteger(req.getParameter("quarter"));
                String type = req.getParameter("type");

                var list = targetService.search(currentUserId, year, month, quarter, type);
                ResponseUtil.json(resp, 200, ApiResponse.success("Lấy danh sách chỉ tiêu doanh số thành công", list));
                return;
            }

            if ("/summary".equalsIgnoreCase(path)) {
                Integer year = parseInteger(req.getParameter("year"));
                Integer month = parseInteger(req.getParameter("month"));
                Integer quarter = parseInteger(req.getParameter("quarter"));

                var summary = targetService.getSummary(currentUserId, year, month, quarter);
                ResponseUtil.json(resp, 200, ApiResponse.success("Lấy thống kê chỉ tiêu thành công", summary));
                return;
            }

            if ("/meta".equalsIgnoreCase(path)) {
                var meta = targetService.getFormMetadata(currentUserId);
                ResponseUtil.json(resp, 200, ApiResponse.success("Lấy thông tin biểu mẫu thành công", meta));
                return;
            }

            if ("/team-validation".equalsIgnoreCase(path)) {
                Long teamId = parseLong(req.getParameter("teamId"));
                int year = parseInteger(req.getParameter("year")) != null ? parseInteger(req.getParameter("year")) : 2026;
                Integer month = parseInteger(req.getParameter("month"));
                Integer quarter = parseInteger(req.getParameter("quarter"));

                var val = targetService.getTeamValidation(currentUserId, teamId, year, month, quarter);
                ResponseUtil.json(resp, 200, ApiResponse.success("Kiểm tra chỉ tiêu nhóm thành công", val));
                return;
            }

            String[] parts = path.split("/");
            if (parts.length >= 2) {
                if ("summary".equalsIgnoreCase(parts[1])) {
                    Integer year = parseInteger(req.getParameter("year"));
                    Integer month = parseInteger(req.getParameter("month"));
                    Integer quarter = parseInteger(req.getParameter("quarter"));
                    var summary = targetService.getSummary(currentUserId, year, month, quarter);
                    ResponseUtil.json(resp, 200, ApiResponse.success("Lấy thống kê chỉ tiêu thành công", summary));
                    return;
                }
                if ("meta".equalsIgnoreCase(parts[1])) {
                    var meta = targetService.getFormMetadata(currentUserId);
                    ResponseUtil.json(resp, 200, ApiResponse.success("Lấy thông tin biểu mẫu thành công", meta));
                    return;
                }
                if ("team-validation".equalsIgnoreCase(parts[1])) {
                    Long teamId = parseLong(req.getParameter("teamId"));
                    int year = parseInteger(req.getParameter("year")) != null ? parseInteger(req.getParameter("year")) : 2026;
                    Integer month = parseInteger(req.getParameter("month"));
                    Integer quarter = parseInteger(req.getParameter("quarter"));

                    var val = targetService.getTeamValidation(currentUserId, teamId, year, month, quarter);
                    ResponseUtil.json(resp, 200, ApiResponse.success("Kiểm tra chỉ tiêu nhóm thành công", val));
                    return;
                }

                long id = Long.parseLong(parts[1]);
                var item = targetService.getById(currentUserId, id);
                if (item == null) {
                    ResponseUtil.json(resp, 404, ApiResponse.error("Không tìm thấy chỉ tiêu #" + id, null));
                    return;
                }
                ResponseUtil.json(resp, 200, ApiResponse.success("Lấy chi tiết chỉ tiêu thành công", item));
                return;
            }

            throw new IllegalArgumentException("Đường dẫn không hợp lệ: " + path);
        } catch (SecurityException e) {
            ResponseUtil.json(resp, 403, ApiResponse.error(e.getMessage(), null));
        } catch (NoSuchElementException e) {
            ResponseUtil.json(resp, 404, ApiResponse.error(e.getMessage(), null));
        } catch (IllegalArgumentException e) {
            ResponseUtil.json(resp, 400, ApiResponse.error(e.getMessage(), null));
        } catch (Exception e) {
            ResponseUtil.json(resp, 500, ApiResponse.error("Lỗi máy chủ: " + e.getMessage(), null));
        }
    }

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        try {
            long currentUserId = requireUser(req);

            Map<String, Object> body = JsonUtil.getGson().fromJson(req.getReader(), com.crm.util.JsonUtil.OBJECT_MAP_TYPE);
            if (body == null) {
                throw new IllegalArgumentException("Thiếu dữ liệu khai báo chỉ tiêu.");
            }

            Long id = body.get("id") != null ? ((Number) body.get("id")).longValue() : null;
            Long userId = body.get("userId") != null ? ((Number) body.get("userId")).longValue() : null;
            Long teamId = body.get("teamId") != null ? ((Number) body.get("teamId")).longValue() : null;

            int year = body.get("periodYear") != null ? ((Number) body.get("periodYear")).intValue() : 2026;
            Integer month = body.get("periodMonth") != null ? ((Number) body.get("periodMonth")).intValue() : null;
            Integer quarter = body.get("periodQuarter") != null ? ((Number) body.get("periodQuarter")).intValue() : null;

            BigDecimal targetAmount = body.get("targetAmount") != null
                    ? new BigDecimal(String.valueOf(body.get("targetAmount")))
                    : BigDecimal.ZERO;

            int targetDeals = body.get("targetDeals") != null ? ((Number) body.get("targetDeals")).intValue() : 0;
            String notes = (String) body.get("notes");
            String changeReason = (String) body.get("changeReason");

            var saved = targetService.upsert(
                    currentUserId,
                    id,
                    userId,
                    teamId,
                    year,
                    month,
                    quarter,
                    targetAmount,
                    targetDeals,
                    notes,
                    changeReason
            );

            ResponseUtil.json(resp, id != null ? 200 : 201, ApiResponse.success(id != null ? "Cập nhật chỉ tiêu thành công" : "Khai báo chỉ tiêu thành công", saved));
        } catch (IllegalArgumentException | IllegalStateException e) {
            ResponseUtil.json(resp, 400, ApiResponse.error(e.getMessage(), null));
        } catch (SecurityException e) {
            ResponseUtil.json(resp, 403, ApiResponse.error(e.getMessage(), null));
        } catch (Exception e) {
            ResponseUtil.json(resp, 500, ApiResponse.error("Lỗi máy chủ: " + e.getMessage(), null));
        }
    }

    @Override
    protected void doDelete(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        try {
            long currentUserId = requireUser(req);
            String path = req.getPathInfo();

            if (path == null || path.equals("/")) {
                throw new IllegalArgumentException("Thiếu ID chỉ tiêu cần xóa.");
            }

            String[] parts = path.split("/");
            if (parts.length >= 2) {
                long id = Long.parseLong(parts[1]);
                boolean deleted = targetService.delete(currentUserId, id);
                if (deleted) {
                    ResponseUtil.json(resp, 200, ApiResponse.success("Xóa chỉ tiêu doanh số thành công", null));
                } else {
                    ResponseUtil.json(resp, 404, ApiResponse.error("Không tìm thấy chỉ tiêu để xóa", null));
                }
                return;
            }

            throw new IllegalArgumentException("Đường dẫn không hợp lệ: " + path);
        } catch (SecurityException e) {
            ResponseUtil.json(resp, 403, ApiResponse.error(e.getMessage(), null));
        } catch (NoSuchElementException e) {
            ResponseUtil.json(resp, 404, ApiResponse.error(e.getMessage(), null));
        } catch (IllegalArgumentException e) {
            ResponseUtil.json(resp, 400, ApiResponse.error(e.getMessage(), null));
        } catch (Exception e) {
            ResponseUtil.json(resp, 500, ApiResponse.error("Lỗi máy chủ: " + e.getMessage(), null));
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

    private Long parseLong(String str) {
        if (str == null || str.trim().isEmpty()) return null;
        try {
            return Long.parseLong(str.trim());
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
