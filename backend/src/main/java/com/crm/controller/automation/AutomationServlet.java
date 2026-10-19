package com.crm.controller.automation;

import com.crm.dao.automation.AutomationDAO;
import com.crm.dao.permissions.PermissionDAO;
import com.crm.dto.automation.AutomationLogDTO;
import com.crm.dto.automation.AutomationRuleDTO;
import com.crm.dto.common.ApiResponse;
import com.crm.service.automation.AutomationEngine;
import com.crm.util.JsonUtil;
import com.crm.util.ResponseUtil;

import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;

import java.io.IOException;
import java.sql.SQLException;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@WebServlet({
        "/api/automations/rules",
        "/api/automations/rules/*",
        "/api/automations/logs",
        "/api/automations/test-trigger"
})
public class AutomationServlet extends HttpServlet {

    private final AutomationDAO automationDAO = new AutomationDAO();
    private final PermissionDAO permissionDAO = new PermissionDAO();
    private final AutomationEngine automationEngine = AutomationEngine.getInstance();

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        try {
            long userId = requireUser(req);
            String servletPath = req.getServletPath();
            String pathInfo = req.getPathInfo();

            if ("/api/automations/logs".equals(servletPath)) {
                int limit = 50;
                String limParam = req.getParameter("limit");
                if (limParam != null) {
                    try { limit = Integer.parseInt(limParam.trim()); } catch (Exception ignored) {}
                }
                List<AutomationLogDTO> logs = automationDAO.findLogs(limit);
                ResponseUtil.json(resp, 200, ApiResponse.success("Lấy nhật ký thực thi thành công", logs));
                return;
            }

            if ("/api/automations/rules".equals(servletPath)) {
                if (pathInfo != null && pathInfo.length() > 1 && !pathInfo.endsWith("/toggle")) {
                    long id = Long.parseLong(pathInfo.substring(1).trim());
                    AutomationRuleDTO rule = automationDAO.findById(id);
                    if (rule == null) {
                        ResponseUtil.json(resp, 404, ApiResponse.error("Không tìm thấy quy tắc", null));
                        return;
                    }
                    ResponseUtil.json(resp, 200, ApiResponse.success("Lấy chi tiết quy tắc thành công", rule));
                    return;
                }

                List<AutomationRuleDTO> list = automationDAO.findAll();
                Map<String, Object> stats = automationDAO.getStats();

                Map<String, Object> data = new LinkedHashMap<>();
                data.put("rules", list);
                data.put("stats", stats);

                ResponseUtil.json(resp, 200, ApiResponse.success("Lấy danh sách quy tắc tự động hoá thành công", data));
                return;
            }

            ResponseUtil.json(resp, 404, ApiResponse.error("Không tìm thấy đường dẫn: " + servletPath, null));
        } catch (SecurityException e) {
            ResponseUtil.json(resp, 403, ApiResponse.error(e.getMessage(), null));
        } catch (Exception e) {
            ResponseUtil.json(resp, 500, ApiResponse.error("Lỗi máy chủ: " + e.getMessage(), null));
        }
    }

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        req.setCharacterEncoding("UTF-8");
        try {
            long userId = requireUser(req);
            requireAdminOrDirector(userId);

            String servletPath = req.getServletPath();
            String pathInfo = req.getPathInfo();

            // Test trigger manually
            if ("/api/automations/test-trigger".equals(servletPath)) {
                Map<String, Object> body = JsonUtil.getGson().fromJson(req.getReader(), com.crm.util.JsonUtil.OBJECT_MAP_TYPE);
                String triggerEvent = (String) body.get("triggerEvent");
                String triggerEntity = (String) body.get("triggerEntity");
                long entityId = body.get("entityId") != null ? ((Number) body.get("entityId")).longValue() : 1L;
                automationEngine.triggerAsync(triggerEvent != null ? triggerEvent : "STAGE_CHANGED",
                        triggerEntity != null ? triggerEntity : "OPPORTUNITY",
                        entityId, body);

                ResponseUtil.json(resp, 200, ApiResponse.success("Đã kích hoạt chạy thử nghiệm quy tắc tự động hoá", Map.of("triggered", true)));
                return;
            }

            // POST /api/automations/rules/{id}/toggle
            if (pathInfo != null && pathInfo.endsWith("/toggle")) {
                String idPart = pathInfo.substring(1, pathInfo.indexOf("/toggle"));
                long ruleId = Long.parseLong(idPart.trim());
                boolean ok = automationDAO.toggleRule(ruleId);
                AutomationRuleDTO updated = automationDAO.findById(ruleId);
                ResponseUtil.json(resp, 200, ApiResponse.success(
                        (updated != null && updated.isActive()) ? "Đã bật quy tắc tự động hoá" : "Đã tạm dừng quy tắc tự động hoá",
                        updated
                ));
                return;
            }

            // Create new rule
            AutomationRuleDTO rule = JsonUtil.getGson().fromJson(req.getReader(), AutomationRuleDTO.class);
            if (rule == null || rule.getName() == null || rule.getName().isBlank()) {
                throw new IllegalArgumentException("Tên quy tắc tự động hoá là bắt buộc.");
            }
            if (rule.getTriggerEvent() == null || rule.getTriggerEvent().isBlank()) {
                throw new IllegalArgumentException("Sự kiện kích hoạt (KHI) là bắt buộc.");
            }
            if (rule.getActionType() == null || rule.getActionType().isBlank()) {
                throw new IllegalArgumentException("Hành động thực thi (THÌ) là bắt buộc.");
            }

            rule.setCreatedBy(userId);
            Long newId = automationDAO.insertRule(rule);
            rule.setId(newId);

            ResponseUtil.json(resp, 201, ApiResponse.success("Tạo quy tắc tự động hoá thành công", rule));
        } catch (SecurityException e) {
            ResponseUtil.json(resp, 403, ApiResponse.error(e.getMessage(), null));
        } catch (IllegalArgumentException e) {
            ResponseUtil.json(resp, 400, ApiResponse.error(e.getMessage(), null));
        } catch (Exception e) {
            ResponseUtil.json(resp, 500, ApiResponse.error("Lỗi máy chủ: " + e.getMessage(), null));
        }
    }

    @Override
    protected void doPut(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        req.setCharacterEncoding("UTF-8");
        try {
            long userId = requireUser(req);
            requireAdminOrDirector(userId);

            String pathInfo = req.getPathInfo();
            if (pathInfo == null || pathInfo.length() <= 1) {
                throw new IllegalArgumentException("Mã quy tắc là bắt buộc.");
            }
            long id = Long.parseLong(pathInfo.substring(1).trim());

            AutomationRuleDTO rule = JsonUtil.getGson().fromJson(req.getReader(), AutomationRuleDTO.class);
            if (rule == null) {
                throw new IllegalArgumentException("Thiếu dữ liệu quy tắc cập nhật");
            }
            rule.setId(id);

            boolean ok = automationDAO.updateRule(rule);
            if (!ok) {
                ResponseUtil.json(resp, 404, ApiResponse.error("Không tìm thấy quy tắc cần cập nhật", null));
                return;
            }

            ResponseUtil.json(resp, 200, ApiResponse.success("Cập nhật quy tắc tự động hoá thành công", rule));
        } catch (SecurityException e) {
            ResponseUtil.json(resp, 403, ApiResponse.error(e.getMessage(), null));
        } catch (IllegalArgumentException e) {
            ResponseUtil.json(resp, 400, ApiResponse.error(e.getMessage(), null));
        } catch (Exception e) {
            ResponseUtil.json(resp, 500, ApiResponse.error("Lỗi máy chủ: " + e.getMessage(), null));
        }
    }

    @Override
    protected void doDelete(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        try {
            long userId = requireUser(req);
            requireAdminOrDirector(userId);

            String pathInfo = req.getPathInfo();
            if (pathInfo == null || pathInfo.length() <= 1) {
                throw new IllegalArgumentException("Mã quy tắc là bắt buộc.");
            }
            long id = Long.parseLong(pathInfo.substring(1).trim());

            boolean ok = automationDAO.deleteRule(id);
            ResponseUtil.json(resp, 200, ApiResponse.success("Xóa quy tắc tự động hoá thành công", Map.of("success", ok)));
        } catch (SecurityException e) {
            ResponseUtil.json(resp, 403, ApiResponse.error(e.getMessage(), null));
        } catch (Exception e) {
            ResponseUtil.json(resp, 500, ApiResponse.error("Lỗi máy chủ: " + e.getMessage(), null));
        }
    }

    private void requireAdminOrDirector(long userId) throws SQLException {
        boolean ok = permissionDAO.hasRole(userId, "ADMIN") || permissionDAO.hasRole(userId, "DIRECTOR");
        if (!ok) {
            throw new SecurityException("Chỉ Giám đốc kinh doanh hoặc Quản trị viên mới có quyền quản lý quy tắc tự động hoá.");
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
