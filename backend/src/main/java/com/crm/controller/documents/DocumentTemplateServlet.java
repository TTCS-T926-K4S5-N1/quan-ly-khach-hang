package com.crm.controller.documents;

import com.crm.dto.common.ApiResponse;
import com.crm.model.documents.DocumentTemplate;
import com.crm.service.documents.DocumentExportService;
import com.crm.service.documents.DocumentTemplateService;
import com.crm.util.JsonUtil;
import com.crm.util.ResponseUtil;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;

import java.io.IOException;

@WebServlet({
        "/api/document-templates",
        "/api/document-templates/*"
})
public class DocumentTemplateServlet extends HttpServlet {

    private final DocumentTemplateService templateService = new DocumentTemplateService();
    private final DocumentExportService exportService = new DocumentExportService();

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        try {
            long currentUserId = requireUser(req);
            String path = req.getPathInfo();

            if (path == null || path.equals("/")) {
                var list = templateService.getAll(currentUserId);
                ResponseUtil.json(resp, 200, ApiResponse.success("Lấy danh sách mẫu tài liệu thành công", list));
                return;
            }

            String clean = path.replaceAll("^/+", "");
            if (clean.endsWith("/preview")) {
                String type = clean.replace("/preview", "").trim().toUpperCase();
                var result = exportService.previewTemplatePdf(currentUserId, type);
                resp.setContentType("application/pdf");
                resp.setHeader("Content-Disposition", "inline; filename=\"" + result.fileName() + "\"");
                resp.setContentLength(result.bytes().length);
                resp.getOutputStream().write(result.bytes());
                resp.getOutputStream().flush();
                return;
            }

            String type = clean.toUpperCase();
            var template = templateService.getByType(currentUserId, type);
            ResponseUtil.json(resp, 200, ApiResponse.success("Lấy thông tin mẫu tài liệu thành công", template));
        } catch (SecurityException e) {
            ResponseUtil.json(resp, 403, ApiResponse.error(e.getMessage(), null));
        } catch (IllegalArgumentException | IllegalStateException e) {
            ResponseUtil.json(resp, 400, ApiResponse.error(e.getMessage(), null));
        } catch (Exception e) {
            ResponseUtil.json(resp, 500, ApiResponse.error("Lỗi máy chủ", null));
        }
    }

    @Override
    protected void doPut(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        try {
            long currentUserId = requireUser(req);
            String path = req.getPathInfo();
            String typeFromPath = path != null ? path.replaceAll("^/+", "").toUpperCase() : null;

            DocumentTemplate body = JsonUtil.getGson().fromJson(req.getReader(), DocumentTemplate.class);
            if (body == null) {
                throw new IllegalArgumentException("Thiếu dữ liệu cấu hình mẫu.");
            }
            if (typeFromPath != null && !typeFromPath.isBlank()) {
                body.setDocumentType(typeFromPath);
            }

            var updated = templateService.update(currentUserId, body);
            ResponseUtil.json(resp, 200, ApiResponse.success("Cập nhật mẫu tài liệu thành công", updated));
        } catch (SecurityException e) {
            ResponseUtil.json(resp, 403, ApiResponse.error(e.getMessage(), null));
        } catch (IllegalArgumentException e) {
            ResponseUtil.json(resp, 400, ApiResponse.error(e.getMessage(), null));
        } catch (Exception e) {
            ResponseUtil.json(resp, 500, ApiResponse.error("Lỗi máy chủ", null));
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
