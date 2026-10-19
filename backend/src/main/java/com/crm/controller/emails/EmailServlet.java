package com.crm.controller.emails;

import com.crm.dao.emails.EmailQueueDAO;
import com.crm.dao.emails.EmailTemplateDAO;
import com.crm.dto.common.ApiResponse;
import com.crm.dto.emails.EmailQueueDTO;
import com.crm.dto.emails.EmailTemplateDTO;
import com.crm.service.emails.EmailService;
import com.crm.util.JsonUtil;
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
        "/api/emails",
        "/api/emails/*"
})
public class EmailServlet extends HttpServlet {

    private final EmailTemplateDAO templateDAO = new EmailTemplateDAO();
    private final EmailQueueDAO queueDAO = new EmailQueueDAO();
    private final EmailService emailService = EmailService.getInstance();

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        try {
            long userId = requireUser(req);
            String path = req.getPathInfo();

            if (path == null || path.equals("/") || "/templates".equals(path)) {
                Boolean activeOnly = "true".equalsIgnoreCase(req.getParameter("activeOnly"));
                List<EmailTemplateDTO> list = templateDAO.findAll(activeOnly ? true : null);
                ResponseUtil.json(resp, 200, ApiResponse.success("Lấy danh sách mẫu email thành công", list));
                return;
            }

            if (path.startsWith("/templates/")) {
                long id = Long.parseLong(path.substring("/templates/".length()).trim());
                EmailTemplateDTO tpl = templateDAO.findById(id);
                if (tpl != null) {
                    ResponseUtil.json(resp, 200, ApiResponse.success("Lấy chi tiết mẫu email thành công", tpl));
                } else {
                    ResponseUtil.json(resp, 404, ApiResponse.error("Không tìm thấy mẫu email #" + id, null));
                }
                return;
            }

            if ("/queue".equals(path)) {
                String status = req.getParameter("status");
                Long customerId = null;
                String custParam = req.getParameter("customerId");
                if (custParam != null && !custParam.isBlank()) {
                    try { customerId = Long.parseLong(custParam.trim()); } catch (Exception ignored) {}
                }

                int limit = 20;
                int page = 1;
                String limitParam = req.getParameter("limit");
                String pageParam = req.getParameter("page");
                if (limitParam != null) {
                    try { limit = Integer.parseInt(limitParam.trim()); } catch (Exception ignored) {}
                }
                if (pageParam != null) {
                    try { page = Integer.parseInt(pageParam.trim()); } catch (Exception ignored) {}
                }
                int offset = (Math.max(page, 1) - 1) * limit;

                List<EmailQueueDTO> items = queueDAO.findQueue(status, customerId, limit, offset);
                int total = queueDAO.countQueue(status, customerId);

                Map<String, Object> data = new LinkedHashMap<>();
                data.put("items", items);
                data.put("total", total);
                data.put("page", page);
                data.put("limit", limit);

                ResponseUtil.json(resp, 200, ApiResponse.success("Lấy danh sách hàng đợi email thành công", data));
                return;
            }

            if ("/stats".equals(path)) {
                Map<String, Object> stats = queueDAO.getStats();
                ResponseUtil.json(resp, 200, ApiResponse.success("Lấy thống kê email thành công", stats));
                return;
            }

            ResponseUtil.json(resp, 404, ApiResponse.error("Đường dẫn không tồn tại: " + path, null));
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

            // POST /api/emails/templates - Tạo mẫu mới
            if (path == null || path.equals("/") || "/templates".equals(path)) {
                EmailTemplateDTO dto = JsonUtil.getGson().fromJson(req.getReader(), EmailTemplateDTO.class);
                if (dto == null || dto.getName() == null || dto.getName().isBlank() ||
                    dto.getSubject() == null || dto.getSubject().isBlank() ||
                    dto.getBodyHtml() == null || dto.getBodyHtml().isBlank()) {
                    ResponseUtil.json(resp, 400, ApiResponse.error("Vui lòng điền đầy đủ tên mẫu, tiêu đề và nội dung", null));
                    return;
                }
                dto.setCreatedBy(userId);
                long id = templateDAO.create(dto);
                EmailTemplateDTO created = templateDAO.findById(id);
                ResponseUtil.json(resp, 201, ApiResponse.success("Tạo mẫu email mới thành công", created));
                return;
            }

            // POST /api/emails/preview - Xem trước email sau khi thay thế biến
            if ("/preview".equals(path)) {
                Map<String, Object> body = JsonUtil.getGson().fromJson(req.getReader(), JsonUtil.OBJECT_MAP_TYPE);
                Long templateId = parseLongSafe(body.get("templateId"));
                Long customerId = parseLongSafe(body.get("customerId"));
                Long contactId = parseLongSafe(body.get("contactId"));

                Map<String, String> preview = emailService.previewEmail(templateId, customerId, contactId, userId);
                ResponseUtil.json(resp, 200, ApiResponse.success("Tạo bản xem trước thành công", preview));
                return;
            }

            // POST /api/emails/send - Gửi email cho khách (bất đồng bộ qua hàng đợi)
            if ("/send".equals(path)) {
                EmailQueueDTO dto = JsonUtil.getGson().fromJson(req.getReader(), EmailQueueDTO.class);
                if (dto == null || dto.getRecipientEmail() == null || dto.getRecipientEmail().isBlank() ||
                    dto.getSubject() == null || dto.getSubject().isBlank() ||
                    dto.getBodyHtml() == null || dto.getBodyHtml().isBlank()) {
                    ResponseUtil.json(resp, 400, ApiResponse.error("Vui lòng cung cấp email người nhận, tiêu đề và nội dung thư", null));
                    return;
                }

                dto.setSentByUserId(userId);
                long queueId = emailService.enqueueAndSendAsync(dto);

                Map<String, Object> data = new LinkedHashMap<>();
                data.put("queueId", queueId);
                data.put("status", "QUEUED");
                data.put("message", "Thư đã được đưa vào hàng đợi gửi bất đồng bộ và sẽ ghi nhận vào Dòng thời gian của khách hàng.");

                ResponseUtil.json(resp, 200, ApiResponse.success("Đã đưa email vào hàng đợi gửi thành công", data));
                return;
            }

            // POST /api/emails/queue/{id}/retry - Gửi lại thư thất bại
            if (path != null && path.startsWith("/queue/") && path.endsWith("/retry")) {
                String idPart = path.substring("/queue/".length(), path.indexOf("/retry"));
                long queueId = Long.parseLong(idPart.trim());
                boolean retried = emailService.retryEmailAsync(queueId);
                if (retried) {
                    ResponseUtil.json(resp, 200, ApiResponse.success("Đã kích hoạt gửi lại email #" + queueId, Map.of("success", true)));
                } else {
                    ResponseUtil.json(resp, 404, ApiResponse.error("Không tìm thấy email #" + queueId + " trong hàng đợi", null));
                }
                return;
            }

            ResponseUtil.json(resp, 404, ApiResponse.error("Hành động không hợp lệ: " + path, null));
        } catch (SecurityException e) {
            ResponseUtil.json(resp, 403, ApiResponse.error(e.getMessage(), null));
        } catch (Exception e) {
            ResponseUtil.json(resp, 500, ApiResponse.error("Lỗi máy chủ: " + e.getMessage(), null));
        }
    }

    @Override
    protected void doPut(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        req.setCharacterEncoding("UTF-8");
        try {
            long userId = requireUser(req);
            String path = req.getPathInfo();

            if (path != null && path.startsWith("/templates/")) {
                long id = Long.parseLong(path.substring("/templates/".length()).trim());
                EmailTemplateDTO dto = JsonUtil.getGson().fromJson(req.getReader(), EmailTemplateDTO.class);
                dto.setId(id);
                boolean ok = templateDAO.update(dto);
                if (ok) {
                    EmailTemplateDTO updated = templateDAO.findById(id);
                    ResponseUtil.json(resp, 200, ApiResponse.success("Cập nhật mẫu email thành công", updated));
                } else {
                    ResponseUtil.json(resp, 404, ApiResponse.error("Không tìm thấy mẫu email để cập nhật", null));
                }
                return;
            }

            ResponseUtil.json(resp, 404, ApiResponse.error("Hành động không hợp lệ: " + path, null));
        } catch (SecurityException e) {
            ResponseUtil.json(resp, 403, ApiResponse.error(e.getMessage(), null));
        } catch (Exception e) {
            ResponseUtil.json(resp, 500, ApiResponse.error("Lỗi máy chủ: " + e.getMessage(), null));
        }
    }

    @Override
    protected void doDelete(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        try {
            long userId = requireUser(req);
            String path = req.getPathInfo();

            if (path != null && path.startsWith("/templates/")) {
                long id = Long.parseLong(path.substring("/templates/".length()).trim());
                boolean ok = templateDAO.delete(id);
                ResponseUtil.json(resp, 200, ApiResponse.success("Xóa mẫu email thành công", Map.of("success", ok)));
                return;
            }

            ResponseUtil.json(resp, 404, ApiResponse.error("Hành động không hợp lệ: " + path, null));
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

    private Long parseLongSafe(Object obj) {
        if (obj == null) return null;
        if (obj instanceof Number) return ((Number) obj).longValue();
        try {
            String str = obj.toString().trim();
            if (str.contains(".")) {
                str = str.substring(0, str.indexOf("."));
            }
            return Long.parseLong(str);
        } catch (Exception e) {
            return null;
        }
    }
}
