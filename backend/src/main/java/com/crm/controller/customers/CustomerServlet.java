package com.crm.controller.customers;

import com.crm.dto.common.ApiResponse;
import com.crm.dto.customers.CustomerWriteRequest;
import com.crm.service.customers.CustomerService;
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
        "/api/customers",
        "/api/customers/*"
})
public class CustomerServlet extends HttpServlet {

    private final CustomerService customerService = new CustomerService();

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        try {
            long currentUserId = requireUser(req);
            String path = req.getPathInfo();

            if (path == null || path.equals("/")) {
                String keyword = req.getParameter("keyword");
                String status = req.getParameter("status");
                int page = intParam(req, "page", 1);
                int size = intParam(req, "size", 20);

                var result = customerService.search(currentUserId, keyword, status, page, size);
                ResponseUtil.json(resp, 200, ApiResponse.success("Lấy danh sách khách hàng thành công", result));
                return;
            }

            // 1. Kiểm tra trùng lặp thời gian thực
            if (path.equals("/check-duplicate")) {
                String name = req.getParameter("name");
                String taxCode = req.getParameter("taxCode");
                String website = req.getParameter("website");
                String exclStr = req.getParameter("excludeId");
                Long excludeId = (exclStr != null && !exclStr.isBlank()) ? Long.parseLong(exclStr.trim()) : null;

                var dupes = customerService.checkDuplicates(currentUserId, name, taxCode, website, excludeId);
                ResponseUtil.json(resp, 200, ApiResponse.success("Kiểm tra trùng lặp thành công", dupes));
                return;
            }

            // 2. Lấy danh sách tất cả các cặp trùng lặp trong hệ thống
            if (path.equals("/duplicates")) {
                var pairs = customerService.findAllDuplicatePairs(currentUserId);
                ResponseUtil.json(resp, 200, ApiResponse.success("Lấy danh sách cặp trùng lặp thành công", pairs));
                return;
            }

            // 3. So sánh 2 khách hàng cạnh nhau
            if (path.equals("/compare")) {
                String id1Str = req.getParameter("id1");
                if (id1Str == null) id1Str = req.getParameter("masterId");
                String id2Str = req.getParameter("id2");
                if (id2Str == null) id2Str = req.getParameter("duplicateId");

                if (id1Str == null || id2Str == null) {
                    throw new IllegalArgumentException("Cần cung cấp id1 và id2 để so sánh.");
                }

                long id1 = Long.parseLong(id1Str.trim());
                long id2 = Long.parseLong(id2Str.trim());
                var comparison = customerService.getComparison(currentUserId, id1, id2);
                ResponseUtil.json(resp, 200, ApiResponse.success("Lấy dữ liệu so sánh thành công", comparison));
                return;
            }

            // 4. Khách hàng 360
            if (path.endsWith("/360")) {
                long id = parseId(path);
                var data = customerService.getCustomer360(currentUserId, id);
                if (data == null) {
                    ResponseUtil.json(resp, 404, ApiResponse.error("Không tìm thấy khách hàng", null));
                    return;
                }
                ResponseUtil.json(resp, 200, ApiResponse.success("Lấy thông tin khách hàng 360 thành công", data));
                return;
            }

            // 5. Kiểm tra trùng lặp cho 1 khách hàng cụ thể
            if (path.endsWith("/duplicates")) {
                long id = parseId(path);
                var current = customerService.getById(currentUserId, id);
                if (current == null) {
                    ResponseUtil.json(resp, 404, ApiResponse.error("Không tìm thấy khách hàng", null));
                    return;
                }
                String name = (String) current.get("name");
                String taxCode = (String) current.get("taxCode");
                String website = (String) current.get("website");
                var dupes = customerService.checkDuplicates(currentUserId, name, taxCode, website, id);
                ResponseUtil.json(resp, 200, ApiResponse.success("Tìm thấy danh sách trùng lặp", dupes));
                return;
            }

            long id = parseId(path);
            var customer = customerService.getById(currentUserId, id);
            if (customer == null) {
                ResponseUtil.json(resp, 404, ApiResponse.error("Không tìm thấy khách hàng", null));
                return;
            }

            ResponseUtil.json(resp, 200, ApiResponse.success("Lấy thông tin khách hàng thành công", customer));
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
        req.setCharacterEncoding("UTF-8");
        try {
            long currentUserId = requireUser(req);
            String path = req.getPathInfo();

            // Gộp khách hàng (Yêu cầu Trưởng nhóm trở lên)
            if (path != null && path.equals("/merge")) {
                com.crm.dto.customers.CustomerMergeRequest mergeReq =
                        JsonUtil.getGson().fromJson(req.getReader(), com.crm.dto.customers.CustomerMergeRequest.class);
                var mergeResult = customerService.mergeCustomers(currentUserId, mergeReq);
                ResponseUtil.json(resp, 200, ApiResponse.success("Gộp khách hàng thành công", mergeResult));
                return;
            }

            CustomerWriteRequest body = JsonUtil.getGson().fromJson(req.getReader(), CustomerWriteRequest.class);

            var created = customerService.create(currentUserId, body);
            ResponseUtil.json(resp, 201, ApiResponse.success("Tạo khách hàng thành công", created));
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
            long currentUserId = requireUser(req);
            long id = parseId(req.getPathInfo());
            CustomerWriteRequest body = JsonUtil.getGson().fromJson(req.getReader(), CustomerWriteRequest.class);

            var updated = customerService.update(currentUserId, id, body);
            if (updated == null) {
                ResponseUtil.json(resp, 404, ApiResponse.error("Không tìm thấy khách hàng", null));
                return;
            }

            ResponseUtil.json(resp, 200, ApiResponse.success("Cập nhật khách hàng thành công", updated));
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
            long id = parseId(req.getPathInfo());

            customerService.delete(currentUserId, id);
            ResponseUtil.json(resp, 200, ApiResponse.success("Xóa khách hàng thành công", null));
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
            throw new IllegalArgumentException("Thiếu customer id");
        }
        String clean = pathInfo.startsWith("/") ? pathInfo.substring(1) : pathInfo;
        int slash = clean.indexOf('/');
        String idStr = slash >= 0 ? clean.substring(0, slash) : clean;
        return Long.parseLong(idStr);
    }

    private int intParam(HttpServletRequest req, String name, int fallback) {
        String val = req.getParameter(name);
        if (val == null || val.isBlank()) return fallback;
        try {
            return Integer.parseInt(val.trim());
        } catch (NumberFormatException e) {
            return fallback;
        }
    }
}
