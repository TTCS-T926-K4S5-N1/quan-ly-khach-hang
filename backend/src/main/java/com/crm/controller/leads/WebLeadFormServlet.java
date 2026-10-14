package com.crm.controller.leads;

import com.crm.dto.common.ApiResponse;
import com.crm.dto.leads.LeadFormWriteRequest;
import com.crm.service.leads.WebLeadFormService;
import com.crm.util.JsonUtil;
import com.crm.util.ResponseUtil;

import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;

import java.io.IOException;

@WebServlet({
        "/api/lead-forms",
        "/api/lead-forms/*"
})
public class WebLeadFormServlet extends HttpServlet {

    private final WebLeadFormService webLeadFormService = new WebLeadFormService();

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        resp.setHeader("Cache-Control", "no-store");
        try {
            requireUser(req);
            String pathInfo = req.getPathInfo();

            if (pathInfo == null || pathInfo.equals("/")) {
                var forms = webLeadFormService.getAllForms(null);
                ResponseUtil.json(resp, 200, ApiResponse.success("Lấy danh sách biểu mẫu thành công", forms));
                return;
            }

            if (pathInfo.equals("/submissions")) {
                var subs = webLeadFormService.getSubmissions(null, 100);
                ResponseUtil.json(resp, 200, ApiResponse.success("Lấy lịch sử gửi biểu mẫu thành công", subs));
                return;
            }

            String[] parts = pathInfo.split("/");
            if (parts.length >= 2) {
                long formId = Long.parseLong(parts[1]);
                if (parts.length >= 3 && "submissions".equalsIgnoreCase(parts[2])) {
                    var subs = webLeadFormService.getSubmissions(formId, 100);
                    ResponseUtil.json(resp, 200, ApiResponse.success("Lấy lịch sử gửi biểu mẫu thành công", subs));
                    return;
                }
                var form = webLeadFormService.getFormById(formId);
                if (form == null) {
                    ResponseUtil.json(resp, 404, ApiResponse.error("Không tìm thấy biểu mẫu", null));
                    return;
                }
                ResponseUtil.json(resp, 200, ApiResponse.success("Lấy thông tin biểu mẫu thành công", form));
                return;
            }

            ResponseUtil.json(resp, 404, ApiResponse.error("Đường dẫn không hợp lệ", null));
        } catch (NumberFormatException e) {
            ResponseUtil.json(resp, 400, ApiResponse.error("ID biểu mẫu không hợp lệ", null));
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
            LeadFormWriteRequest formReq = JsonUtil.getGson().fromJson(req.getReader(), LeadFormWriteRequest.class);
            if (formReq == null) {
                ResponseUtil.json(resp, 400, ApiResponse.error("Dữ liệu gửi lên không hợp lệ", null));
                return;
            }

            long id = webLeadFormService.createForm(formReq, currentUserId);
            var created = webLeadFormService.getFormById(id);
            ResponseUtil.json(resp, 201, ApiResponse.success("Tạo biểu mẫu thu thập lead thành công", created));
        } catch (IllegalArgumentException e) {
            ResponseUtil.json(resp, 400, ApiResponse.error(e.getMessage(), null));
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
            requireUser(req);
            String pathInfo = req.getPathInfo();
            if (pathInfo == null || pathInfo.equals("/")) {
                ResponseUtil.json(resp, 400, ApiResponse.error("Cần truyền ID biểu mẫu", null));
                return;
            }

            long formId = Long.parseLong(pathInfo.substring(1).split("/")[0]);
            LeadFormWriteRequest formReq = JsonUtil.getGson().fromJson(req.getReader(), LeadFormWriteRequest.class);
            if (formReq == null) {
                ResponseUtil.json(resp, 400, ApiResponse.error("Dữ liệu gửi lên không hợp lệ", null));
                return;
            }

            boolean updated = webLeadFormService.updateForm(formId, formReq);
            if (!updated) {
                ResponseUtil.json(resp, 404, ApiResponse.error("Không tìm thấy biểu mẫu để cập nhật", null));
                return;
            }

            var form = webLeadFormService.getFormById(formId);
            ResponseUtil.json(resp, 200, ApiResponse.success("Cập nhật biểu mẫu thành công", form));
        } catch (NumberFormatException e) {
            ResponseUtil.json(resp, 400, ApiResponse.error("ID biểu mẫu không hợp lệ", null));
        } catch (IllegalArgumentException e) {
            ResponseUtil.json(resp, 400, ApiResponse.error(e.getMessage(), null));
        } catch (SecurityException e) {
            ResponseUtil.json(resp, 403, ApiResponse.error(e.getMessage(), null));
        } catch (Exception e) {
            ResponseUtil.json(resp, 500, ApiResponse.error("Lỗi máy chủ: " + e.getMessage(), null));
        }
    }

    @Override
    protected void doDelete(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        try {
            requireUser(req);
            String pathInfo = req.getPathInfo();
            if (pathInfo == null || pathInfo.equals("/")) {
                ResponseUtil.json(resp, 400, ApiResponse.error("Cần truyền ID biểu mẫu", null));
                return;
            }

            long formId = Long.parseLong(pathInfo.substring(1).split("/")[0]);
            boolean deleted = webLeadFormService.deleteForm(formId);
            if (!deleted) {
                ResponseUtil.json(resp, 404, ApiResponse.error("Không tìm thấy biểu mẫu để xóa", null));
                return;
            }

            ResponseUtil.json(resp, 200, ApiResponse.success("Xóa biểu mẫu thành công", null));
        } catch (NumberFormatException e) {
            ResponseUtil.json(resp, 400, ApiResponse.error("ID biểu mẫu không hợp lệ", null));
        } catch (SecurityException e) {
            ResponseUtil.json(resp, 403, ApiResponse.error(e.getMessage(), null));
        } catch (Exception e) {
            ResponseUtil.json(resp, 500, ApiResponse.error("Lỗi máy chủ: " + e.getMessage(), null));
        }
    }

    private long requireUser(HttpServletRequest req) {
        HttpSession session = req.getSession(false);
        if (session == null || session.getAttribute("userId") == null) {
            throw new SecurityException("Chưa đăng nhập");
        }
        return ((Number) session.getAttribute("userId")).longValue();
    }
}
