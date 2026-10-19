package com.crm.controller.leads;

import com.crm.dto.common.ApiResponse;
import com.crm.dto.leads.PublicLeadSubmissionRequest;
import com.crm.service.leads.WebLeadFormService;
import com.crm.util.JsonUtil;
import com.crm.util.ResponseUtil;

import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.BufferedReader;
import java.io.IOException;
import java.util.LinkedHashMap;
import java.util.Map;

@WebServlet({
        "/api/public/lead-forms/submit",
        "/api/public/lead-forms/config"
})
public class PublicWebLeadServlet extends HttpServlet {

    private final WebLeadFormService webLeadFormService = new WebLeadFormService();

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        resp.setHeader("Cache-Control", "no-store");
        String uri = req.getRequestURI();

        if (uri.endsWith("/config")) {
            String formKey = req.getParameter("key");
            if (formKey == null || formKey.isBlank()) {
                ResponseUtil.json(resp, 400, ApiResponse.error("Thiếu mã biểu mẫu (key)", null));
                return;
            }

            try {
                var form = webLeadFormService.getFormByKey(formKey.trim());
                if (form == null || !Boolean.TRUE.equals(form.get("isActive"))) {
                    ResponseUtil.json(resp, 404, ApiResponse.error("Biểu mẫu không tồn tại hoặc đã ngừng nhận thông tin", null));
                    return;
                }

                // Chỉ trả về các trường công khai cần thiết cho form ngoài
                Map<String, Object> publicConfig = new LinkedHashMap<>();
                publicConfig.put("formKey", form.get("formKey"));
                publicConfig.put("title", form.get("title"));
                publicConfig.put("description", form.get("description"));
                publicConfig.put("submitButtonText", form.get("submitButtonText"));
                publicConfig.put("successMessage", form.get("successMessage"));

                ResponseUtil.json(resp, 200, ApiResponse.success("Lấy cấu hình biểu mẫu thành công", publicConfig));
            } catch (Exception e) {
                ResponseUtil.json(resp, 500, ApiResponse.error("Lỗi máy chủ: " + e.getMessage(), null));
            }
            return;
        }

        ResponseUtil.json(resp, 404, ApiResponse.error("Đường dẫn không hợp lệ", null));
    }

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        req.setCharacterEncoding("UTF-8");
        resp.setHeader("Cache-Control", "no-store");

        String clientIp = resolveClientIp(req);
        String userAgent = req.getHeader("User-Agent");

        PublicLeadSubmissionRequest subReq;
        String contentType = req.getContentType();

        try {
            if (contentType != null && contentType.contains("application/json")) {
                subReq = JsonUtil.getGson().fromJson(req.getReader(), PublicLeadSubmissionRequest.class);
            } else {
                // Hỗ trợ submit form thuần (application/x-www-form-urlencoded)
                subReq = new PublicLeadSubmissionRequest();
                subReq.setFormKey(req.getParameter("formKey"));
                subReq.setFullName(req.getParameter("fullName"));
                subReq.setEmail(req.getParameter("email"));
                subReq.setPhone(req.getParameter("phone"));
                subReq.setCompany(req.getParameter("company"));
                subReq.setInterest(req.getParameter("interest"));
                subReq.set_hp_website(req.getParameter("_hp_website"));
                String ts = req.getParameter("loadTimestamp");
                if (ts != null && !ts.isBlank()) {
                    try {
                        subReq.setLoadTimestamp(Long.parseLong(ts));
                    } catch (NumberFormatException ignored) {}
                }
            }

            if (subReq == null) {
                ResponseUtil.json(resp, 400, ApiResponse.error("Dữ liệu gửi lên không hợp lệ", null));
                return;
            }

            var result = webLeadFormService.processPublicSubmission(subReq, clientIp, userAgent);
            ResponseUtil.json(resp, 200, ApiResponse.success((String) result.get("message"), result));

        } catch (IllegalStateException e) {
            // Lỗi Rate Limiting (Quá nhiều request) -> 429 Too Many Requests
            ResponseUtil.json(resp, 429, ApiResponse.error(e.getMessage(), null));
        } catch (IllegalArgumentException e) {
            // Lỗi validation hoặc spam trap -> 400 Bad Request
            ResponseUtil.json(resp, 400, ApiResponse.error(e.getMessage(), null));
        } catch (Exception e) {
            ResponseUtil.json(resp, 500, ApiResponse.error("Lỗi xử lý gửi form: " + e.getMessage(), null));
        }
    }

    private String resolveClientIp(HttpServletRequest req) {
        String xff = req.getHeader("X-Forwarded-For");
        if (xff != null && !xff.isBlank()) {
            return xff.split(",")[0].trim();
        }
        String realIp = req.getHeader("X-Real-IP");
        if (realIp != null && !realIp.isBlank()) {
            return realIp.trim();
        }
        return req.getRemoteAddr();
    }
}
