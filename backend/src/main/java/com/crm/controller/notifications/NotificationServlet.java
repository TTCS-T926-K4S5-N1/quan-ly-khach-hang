package com.crm.controller.notifications;

import com.crm.dto.common.ApiResponse;
import com.crm.dto.notifications.NotificationDTO;
import com.crm.service.notifications.NotificationService;
import com.crm.util.ResponseUtil;

import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;

import java.io.IOException;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@WebServlet({
        "/api/notifications",
        "/api/notifications/*"
})
public class NotificationServlet extends HttpServlet {

    private final NotificationService notificationService = NotificationService.getInstance();

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        try {
            long userId = requireUser(req);
            String path = req.getPathInfo();

            if (path == null || path.equals("/")) {
                int limit = 20;
                String limitParam = req.getParameter("limit");
                if (limitParam != null) {
                    try { limit = Integer.parseInt(limitParam.trim()); } catch (Exception ignored) {}
                }
                Boolean unreadOnly = "true".equalsIgnoreCase(req.getParameter("unreadOnly"));

                List<NotificationDTO> list = notificationService.getNotifications(userId, limit, unreadOnly);
                int unreadCount = notificationService.getUnreadCount(userId);

                Map<String, Object> data = new LinkedHashMap<>();
                data.put("notifications", list);
                data.put("unreadCount", unreadCount);

                ResponseUtil.json(resp, 200, ApiResponse.success("Lấy danh sách thông báo thành công", data));
                return;
            }

            if ("/unread-count".equals(path)) {
                int unreadCount = notificationService.getUnreadCount(userId);
                Map<String, Object> data = new LinkedHashMap<>();
                data.put("unreadCount", unreadCount);
                ResponseUtil.json(resp, 200, ApiResponse.success("Lấy số thông báo chưa đọc thành công", data));
                return;
            }

            if ("/preferences".equals(path)) {
                com.crm.dao.notifications.UserNotificationSettingDAO settingDAO = new com.crm.dao.notifications.UserNotificationSettingDAO();
                var settings = settingDAO.getSettingsForUser(userId);
                ResponseUtil.json(resp, 200, ApiResponse.success("Lấy cấu hình thông báo cá nhân thành công", settings));
                return;
            }

            ResponseUtil.json(resp, 404, ApiResponse.error("Không tìm thấy đường dẫn thông báo: " + path, null));
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
            String path = req.getPathInfo();

            // POST /api/notifications/preferences
            if ("/preferences".equals(path)) {
                com.crm.dto.notifications.UserNotificationSettingDTO[] arr =
                    com.crm.util.JsonUtil.getGson().fromJson(req.getReader(), com.crm.dto.notifications.UserNotificationSettingDTO[].class);
                if (arr != null) {
                    com.crm.dao.notifications.UserNotificationSettingDAO settingDAO = new com.crm.dao.notifications.UserNotificationSettingDAO();
                    settingDAO.saveSettings(userId, java.util.Arrays.asList(arr));
                    var updated = settingDAO.getSettingsForUser(userId);
                    ResponseUtil.json(resp, 200, ApiResponse.success("Cập nhật cài đặt thông báo thành công", updated));
                    return;
                }
                ResponseUtil.json(resp, 400, ApiResponse.error("Dữ liệu cấu hình không hợp lệ", null));
                return;
            }

            // POST /api/notifications/read-all
            if ("/read-all".equals(path)) {
                int updated = notificationService.markAllAsRead(userId);
                Map<String, Object> data = new LinkedHashMap<>();
                data.put("updatedCount", updated);
                data.put("unreadCount", 0);
                ResponseUtil.json(resp, 200, ApiResponse.success("Đã đánh dấu tất cả thông báo là đã đọc", data));
                return;
            }

            // POST /api/notifications/{id}/read
            if (path != null && path.endsWith("/read")) {
                String idPart = path.substring(1, path.indexOf("/read"));
                long notifId = Long.parseLong(idPart.trim());
                boolean ok = notificationService.markAsRead(notifId, userId);
                int unreadCount = notificationService.getUnreadCount(userId);
                Map<String, Object> data = new LinkedHashMap<>();
                data.put("success", ok);
                data.put("unreadCount", unreadCount);
                ResponseUtil.json(resp, 200, ApiResponse.success("Đã đánh dấu thông báo là đã đọc", data));
                return;
            }

            ResponseUtil.json(resp, 404, ApiResponse.error("Hành động không hợp lệ", null));
        } catch (SecurityException e) {
            ResponseUtil.json(resp, 403, ApiResponse.error(e.getMessage(), null));
        } catch (NumberFormatException e) {
            ResponseUtil.json(resp, 400, ApiResponse.error("Mã thông báo không hợp lệ", null));
        } catch (Exception e) {
            ResponseUtil.json(resp, 500, ApiResponse.error("Lỗi máy chủ: " + e.getMessage(), null));
        }
    }

    @Override
    protected void doDelete(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        try {
            long userId = requireUser(req);
            String path = req.getPathInfo();
            if (path != null && path.length() > 1) {
                long notifId = Long.parseLong(path.substring(1).trim());
                boolean ok = notificationService.delete(notifId, userId);
                ResponseUtil.json(resp, 200, ApiResponse.success("Đã xóa thông báo thành công", Map.of("success", ok)));
                return;
            }
            ResponseUtil.json(resp, 400, ApiResponse.error("Vui lòng cung cấp mã thông báo cần xóa", null));
        } catch (SecurityException e) {
            ResponseUtil.json(resp, 403, ApiResponse.error(e.getMessage(), null));
        } catch (Exception e) {
            ResponseUtil.json(resp, 500, ApiResponse.error("Lỗi máy chủ: " + e.getMessage(), null));
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
