package com.crm.controller.contacts;

import com.crm.dto.common.ApiResponse;
import com.crm.dto.contacts.ContactWriteRequest;
import com.crm.service.contacts.ContactService;
import com.crm.util.JsonUtil;
import com.crm.util.ResponseUtil;

import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;

import java.io.IOException;
import java.util.NoSuchElementException;

@WebServlet({
        "/api/contacts",
        "/api/contacts/*"
})
public class ContactServlet extends HttpServlet {

    private final ContactService contactService = new ContactService();

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        try {
            long currentUserId = requireUser(req);
            String path = req.getPathInfo();

            if (path == null || path.equals("/")) {
                String customerIdParam = req.getParameter("customerId");
                if (customerIdParam == null || customerIdParam.isBlank()) {
                    throw new IllegalArgumentException("Vui lòng cung cấp customerId.");
                }

                long customerId = Long.parseLong(customerIdParam.trim());
                var contacts = contactService.getByCustomerId(currentUserId, customerId);
                ResponseUtil.json(resp, 200, ApiResponse.success("Lấy danh sách người liên hệ thành công", contacts));
                return;
            }

            String clean = path.startsWith("/") ? path.substring(1) : path;
            if (clean.contains("/history")) {
                long id = Long.parseLong(clean.substring(0, clean.indexOf("/history")));
                var history = contactService.getHistory(currentUserId, id);
                ResponseUtil.json(resp, 200, ApiResponse.success("Lấy lịch sử công ty thành công", history));
                return;
            }

            long id = Long.parseLong(clean);
            var contact = contactService.getById(currentUserId, id);
            if (contact == null) {
                ResponseUtil.json(resp, 404, ApiResponse.error("Không tìm thấy người liên hệ", null));
                return;
            }

            ResponseUtil.json(resp, 200, ApiResponse.success("Lấy thông tin người liên hệ thành công", contact));
        } catch (SecurityException e) {
            ResponseUtil.json(resp, 403, ApiResponse.error(e.getMessage(), null));
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
            ContactWriteRequest body = JsonUtil.getGson().fromJson(
                    new java.io.InputStreamReader(req.getInputStream(), java.nio.charset.StandardCharsets.UTF_8),
                    ContactWriteRequest.class
            );

            var created = contactService.create(currentUserId, body);
            ResponseUtil.json(resp, 201, ApiResponse.success("Tạo người liên hệ thành công", created));
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
        try {
            long currentUserId = requireUser(req);
            long id = parseId(req.getPathInfo());
            ContactWriteRequest body = JsonUtil.getGson().fromJson(
                    new java.io.InputStreamReader(req.getInputStream(), java.nio.charset.StandardCharsets.UTF_8),
                    ContactWriteRequest.class
            );

            var updated = contactService.update(currentUserId, id, body);
            ResponseUtil.json(resp, 200, ApiResponse.success("Cập nhật người liên hệ thành công", updated));
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
    protected void doDelete(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        try {
            long currentUserId = requireUser(req);
            long id = parseId(req.getPathInfo());

            contactService.delete(currentUserId, id);
            ResponseUtil.json(resp, 200, ApiResponse.success("Xóa người liên hệ thành công", null));
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

    private long requireUser(HttpServletRequest req) {
        HttpSession session = req.getSession(false);
        if (session == null || session.getAttribute("userId") == null) {
            throw new SecurityException("Phiên đăng nhập không hợp lệ hoặc đã hết hạn.");
        }
        return (Long) session.getAttribute("userId");
    }

    private long parseId(String pathInfo) {
        if (pathInfo == null || pathInfo.equals("/")) {
            throw new IllegalArgumentException("Thiếu contact id");
        }
        String clean = pathInfo.startsWith("/") ? pathInfo.substring(1) : pathInfo;
        int slash = clean.indexOf('/');
        String idStr = slash >= 0 ? clean.substring(0, slash) : clean;
        return Long.parseLong(idStr);
    }
}
