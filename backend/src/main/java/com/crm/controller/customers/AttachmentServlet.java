package com.crm.controller.customers;

import com.crm.dao.customers.Customer360DAO;
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
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;

@WebServlet({
        "/api/attachments",
        "/api/attachments/*"
})
public class AttachmentServlet extends HttpServlet {

    private final Customer360DAO dao = new Customer360DAO();

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        try {
            long currentUserId = requireUser(req);
            JsonObject body = JsonUtil.getGson().fromJson(
                    new InputStreamReader(req.getInputStream(), StandardCharsets.UTF_8),
                    JsonObject.class
            );

            if (body == null || !body.has("customerId") || !body.has("name")) {
                throw new IllegalArgumentException("Dữ liệu tệp đính kèm không hợp lệ.");
            }

            long customerId = body.get("customerId").getAsLong();
            String name = body.get("name").getAsString();
            String fileType = body.has("fileType") ? body.get("fileType").getAsString() : "PDF";
            long fileSize = body.has("fileSize") ? body.get("fileSize").getAsLong() : 102400L;
            String fileUrl = body.has("fileUrl") ? body.get("fileUrl").getAsString() : "#";
            String notes = body.has("notes") && !body.get("notes").isJsonNull() ? body.get("notes").getAsString() : null;

            long id = dao.addAttachment(customerId, name, fileType, fileSize, fileUrl, notes, currentUserId);
            ResponseUtil.json(resp, 201, ApiResponse.success("Thêm tệp đính kèm thành công", id));
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
            requireUser(req);
            String path = req.getPathInfo();
            if (path == null || path.equals("/")) {
                throw new IllegalArgumentException("Thiếu attachment id");
            }

            String clean = path.startsWith("/") ? path.substring(1) : path;
            long id = Long.parseLong(clean);

            dao.deleteAttachment(id);
            ResponseUtil.json(resp, 200, ApiResponse.success("Xóa tệp đính kèm thành công", null));
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
