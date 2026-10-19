package com.crm.controller.settings;

import com.crm.dao.permissions.PermissionDAO;
import com.crm.dao.settings.SystemSettingDAO;
import com.crm.dto.common.ApiResponse;
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
import java.util.Map;

@WebServlet({
        "/api/settings/system",
        "/api/settings/leaderboard",
        "/api/settings/leaderboard/*"
})
public class SystemSettingServlet extends HttpServlet {

    private final SystemSettingDAO settingDAO = new SystemSettingDAO();
    private final PermissionDAO permissionDAO = new PermissionDAO();

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        try {
            long userId = requireUser(req);
            String path = req.getServletPath();

            if ("/api/settings/leaderboard".equals(path)) {
                boolean enabled = settingDAO.isBooleanEnabled("team_leaderboard_staff_enabled", true);
                Map<String, Object> data = new LinkedHashMap<>();
                data.put("teamLeaderboardStaffEnabled", enabled);
                ResponseUtil.json(resp, 200, ApiResponse.success("Lấy cấu hình bảng xếp hạng thành công", data));
                return;
            }

            Map<String, String> all = settingDAO.getAllSettings();
            ResponseUtil.json(resp, 200, ApiResponse.success("Lấy toàn bộ cấu hình hệ thống", all));
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

            Map<String, Object> body = JsonUtil.getGson().fromJson(req.getReader(), com.crm.util.JsonUtil.OBJECT_MAP_TYPE);
            if (body == null) {
                throw new IllegalArgumentException("Thiếu dữ liệu cấu hình");
            }

            if (body.containsKey("enabled") || body.containsKey("teamLeaderboardStaffEnabled")) {
                Object valObj = body.containsKey("enabled") ? body.get("enabled") : body.get("teamLeaderboardStaffEnabled");
                boolean enabled = Boolean.parseBoolean(String.valueOf(valObj));
                settingDAO.setSetting(
                        "team_leaderboard_staff_enabled",
                        String.valueOf(enabled),
                        "Cho phép nhân viên kinh doanh xem bảng xếp hạng doanh số trong nhóm"
                );

                Map<String, Object> data = new LinkedHashMap<>();
                data.put("teamLeaderboardStaffEnabled", enabled);
                ResponseUtil.json(resp, 200, ApiResponse.success(
                        enabled ? "Đã bật hiển thị bảng xếp hạng cho nhân viên" : "Đã tắt hiển thị bảng xếp hạng cho nhân viên",
                        data
                ));
                return;
            }

            ResponseUtil.json(resp, 400, ApiResponse.error("Tham số cấu hình không hợp lệ", null));
        } catch (SecurityException e) {
            ResponseUtil.json(resp, 403, ApiResponse.error(e.getMessage(), null));
        } catch (IllegalArgumentException e) {
            ResponseUtil.json(resp, 400, ApiResponse.error(e.getMessage(), null));
        } catch (Exception e) {
            ResponseUtil.json(resp, 500, ApiResponse.error("Lỗi máy chủ: " + e.getMessage(), null));
        }
    }

    private void requireAdminOrDirector(long userId) throws SQLException {
        boolean isAllowed = permissionDAO.hasRole(userId, "ADMIN") || permissionDAO.hasRole(userId, "DIRECTOR");
        if (!isAllowed) {
            throw new SecurityException("Chỉ Giám đốc kinh doanh hoặc Quản trị viên mới có quyền điều chỉnh cấu hình này.");
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
