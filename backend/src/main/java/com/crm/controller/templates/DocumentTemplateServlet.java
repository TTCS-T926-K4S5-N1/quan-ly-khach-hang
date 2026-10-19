package com.crm.controller.templates;

import com.crm.dao.templates.DocumentTemplateDAO;
import com.crm.dto.common.ApiResponse;
import com.crm.util.JsonUtil;
import com.crm.util.ResponseUtil;

import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;

import java.io.IOException;
import java.util.Map;

@WebServlet({
        "/api/document-templates",
        "/api/document-templates/*"
})
public class DocumentTemplateServlet extends HttpServlet {

    private final DocumentTemplateDAO templateDAO = new DocumentTemplateDAO();

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        try {
            String path = req.getPathInfo();
            String type = req.getParameter("type");
            if (path != null && !path.equals("/")) {
                type = path.replaceAll("^/+", "").toUpperCase();
            }
            if (type == null || type.trim().isEmpty()) {
                type = "QUOTE";
            } else {
                type = type.toUpperCase();
            }

            var tpl = templateDAO.findByType(type);
            if (tpl == null) {
                ResponseUtil.json(resp, 404, ApiResponse.error("Không tìm thấy mẫu tài liệu: " + type, null));
                return;
            }

            ResponseUtil.json(resp, 200, ApiResponse.success("Lấy mẫu tài liệu thành công", tpl));
        } catch (Exception e) {
            ResponseUtil.json(resp, 500, ApiResponse.error("Lỗi máy chủ: " + e.getMessage(), null));
        }
    }

    @Override
    protected void doPut(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        try {
            long currentUserId = requireUser(req);
            String path = req.getPathInfo();
            String type = "QUOTE";
            if (path != null && !path.equals("/")) {
                type = path.replaceAll("^/+", "").toUpperCase();
            }

            Map<String, Object> body = JsonUtil.getGson().fromJson(req.getReader(), com.crm.util.JsonUtil.OBJECT_MAP_TYPE);
            if (body == null) {
                throw new IllegalArgumentException("Thiếu dữ liệu cập nhật mẫu.");
            }

            templateDAO.update(type, body, currentUserId);
            var updated = templateDAO.findByType(type);
            ResponseUtil.json(resp, 200, ApiResponse.success("Cập nhật mẫu tài liệu thành công", updated));
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
