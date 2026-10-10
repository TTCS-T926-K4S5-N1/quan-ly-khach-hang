package com.crm.controller.filters;

import com.crm.dao.filters.SavedFilterDAO;
import com.crm.dto.common.ApiResponse;
import com.crm.util.JsonUtil;
import com.crm.util.ResponseUtil;
import com.google.gson.JsonObject;

import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;

import java.io.IOException;

@WebServlet({
        "/api/saved-filters",
        "/api/saved-filters/*"
})
public class SavedFilterServlet extends HttpServlet {

    private final SavedFilterDAO savedFilterDAO = new SavedFilterDAO();

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        try {
            long currentUserId = requireUser(req);
            String module = req.getParameter("module");
            if (module == null || module.isBlank()) {
                module = "CUSTOMER";
            }

            var filters = savedFilterDAO.findByUserIdAndModule(currentUserId, module);
            ResponseUtil.json(resp, 200, ApiResponse.success("Lấy danh sách bộ lọc đã lưu thành công", filters));
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
            long currentUserId = requireUser(req);
            JsonObject body = JsonUtil.getGson().fromJson(req.getReader(), JsonObject.class);

            if (body == null || !body.has("name") || body.get("name").getAsString().isBlank()) {
                throw new IllegalArgumentException("Tên bộ lọc không được để trống.");
            }

            String name = body.get("name").getAsString().trim();
            String module = body.has("module") && !body.get("module").getAsString().isBlank()
                    ? body.get("module").getAsString().trim()
                    : "CUSTOMER";

            String criteriaJson = body.has("filterCriteria")
                    ? body.get("filterCriteria").toString()
                    : "{}";

            var created = savedFilterDAO.create(currentUserId, module, name, criteriaJson);
            ResponseUtil.json(resp, 201, ApiResponse.success("Lưu bộ lọc thành công", created));
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
            long currentUserId = requireUser(req);
            String path = req.getPathInfo();
            if (path == null || path.equals("/")) {
                throw new IllegalArgumentException("Thiếu ID bộ lọc cần xóa.");
            }
            String idStr = path.startsWith("/") ? path.substring(1) : path;
            long filterId = Long.parseLong(idStr.trim());

            boolean deleted = savedFilterDAO.delete(currentUserId, filterId);
            if (!deleted) {
                ResponseUtil.json(resp, 404, ApiResponse.error("Không tìm thấy bộ lọc hoặc bạn không có quyền xóa", null));
                return;
            }

            ResponseUtil.json(resp, 200, ApiResponse.success("Xóa bộ lọc thành công", null));
        } catch (SecurityException e) {
            ResponseUtil.json(resp, 403, ApiResponse.error(e.getMessage(), null));
        } catch (IllegalArgumentException e) {
            ResponseUtil.json(resp, 400, ApiResponse.error(e.getMessage(), null));
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
