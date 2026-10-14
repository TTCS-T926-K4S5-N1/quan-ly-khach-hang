package com.crm.controller.leads;

import com.crm.config.DatabaseConfig;
import com.crm.dao.customers.CustomerMergeDAO;
import com.crm.dto.common.ApiResponse;
import com.crm.dto.leads.LeadManualWriteRequest;
import com.crm.service.leads.LeadImportService;
import com.crm.util.JsonUtil;
import com.crm.util.ResponseUtil;

import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.MultipartConfig;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import jakarta.servlet.http.Part;

import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.Charset;
import java.nio.charset.StandardCharsets;
import java.sql.*;
import java.util.*;

@WebServlet({
        "/api/leads",
        "/api/leads/*"
})
@MultipartConfig(
        fileSizeThreshold = 1024 * 1024 * 2, // 2MB
        maxFileSize = 1024 * 1024 * 10,      // 10MB
        maxRequestSize = 1024 * 1024 * 20    // 20MB
)
public class LeadServlet extends HttpServlet {

    private final LeadImportService importService = new LeadImportService();
    private final CustomerMergeDAO customerMergeDAO = new CustomerMergeDAO();

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        resp.setHeader("Cache-Control", "no-store");
        try {
            long userId = requireUser(req);
            String pathInfo = req.getPathInfo();

            // 1. Tải file template Excel mẫu
            if ("/import/template".equals(pathInfo)) {
                String type = req.getParameter("type");
                resp.setContentType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
                String fileName = "invalid".equalsIgnoreCase(type)
                        ? "mau_import_lead_kiem_thu_loi.xlsx"
                        : "mau_import_lead_chuan.xlsx";
                resp.setHeader("Content-Disposition", "attachment; filename=\"" + fileName + "\"");
                importService.writeTemplate(resp.getOutputStream(), type);
                return;
            }

            // 2. Danh mục nguồn Lead
            if ("/sources".equals(pathInfo)) {
                List<Map<String, String>> sources = List.of(
                        Map.of("code", "HOI_THAO", "name", "Hội thảo / Sự kiện"),
                        Map.of("code", "DANH_THIEP", "name", "Danh thiếp đối tác"),
                        Map.of("code", "FORM_WEB", "name", "Website / Landing Page"),
                        Map.of("code", "FACEBOOK", "name", "Mạng xã hội"),
                        Map.of("code", "GOOGLE", "name", "Google Search"),
                        Map.of("code", "GIOI_THIEU", "name", "Giới thiệu từ đối tác"),
                        Map.of("code", "COLD_CALL", "name", "Cold Call / Danh bạ"),
                        Map.of("code", "KHAC", "name", "Khác")
                );
                ResponseUtil.json(resp, 200, ApiResponse.success("Lấy danh mục nguồn lead thành công", sources));
                return;
            }

            // 3. Kiểm tra trùng lặp realtime cho form tạo lead thủ công
            if ("/check-duplicate".equals(pathInfo)) {
                String name = req.getParameter("name");
                String phone = req.getParameter("phone");
                String email = req.getParameter("email");
                var dupes = customerMergeDAO.checkDuplicates(name, null, null, email, phone, null);
                ResponseUtil.json(resp, 200, ApiResponse.success("Kiểm tra trùng lặp thành công", dupes));
                return;
            }

            // 4. Gợi ý gắn vào khách hàng đã có
            if ("/suggest-existing".equals(pathInfo)) {
                String name = req.getParameter("name");
                String phone = req.getParameter("phone");
                String email = req.getParameter("email");
                var suggestion = customerMergeDAO.suggestExistingCustomer(email, phone, name);
                ResponseUtil.json(resp, 200, ApiResponse.success("Gợi ý gắn vào khách hàng thành công", suggestion));
                return;
            }

            ResponseUtil.json(resp, 404, ApiResponse.error("Đường dẫn không tồn tại", null));
        } catch (SecurityException e) {
            ResponseUtil.json(resp, 401, ApiResponse.error(e.getMessage(), null));
        } catch (Exception e) {
            ResponseUtil.json(resp, 500, ApiResponse.error("Lỗi: " + e.getMessage(), null));
        }
    }

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        req.setCharacterEncoding("UTF-8");
        resp.setHeader("Cache-Control", "no-store");
        try {
            long userId = requireUser(req);
            String pathInfo = req.getPathInfo();

            // 1. Tạo Lead thủ công (SCRUM-64: Validation + Bắt buộc có nguồn + Gắn chiến dịch)
            if ("/manual".equals(pathInfo)) {
                handleManualLeadCreate(req, resp, userId);
                return;
            }

            // 2. Upload file Excel và Xem trước (Preview) báo lỗi từng dòng
            if ("/import/preview".equals(pathInfo)) {
                Part filePart = req.getPart("file");
                if (filePart == null || filePart.getSize() == 0) {
                    ResponseUtil.json(resp, 400, ApiResponse.error("Vui lòng tải lên tệp Excel (.xlsx)", null));
                    return;
                }

                String submittedFileName = filePart.getSubmittedFileName();
                if (submittedFileName == null || !submittedFileName.toLowerCase().endsWith(".xlsx")) {
                    ResponseUtil.json(resp, 400, ApiResponse.error("Chỉ chấp nhận tệp Microsoft Excel định dạng .xlsx", null));
                    return;
                }

                try (InputStream is = filePart.getInputStream()) {
                    var batch = importService.parseAndValidate(is, submittedFileName, userId);
                    ResponseUtil.json(resp, 200, ApiResponse.success("Phân tích dữ liệu xem trước thành công", batch));
                }
                return;
            }

            // 3. Xác nhận nhập dữ liệu (Commit batch)
            if ("/import/commit".equals(pathInfo) || "/import/confirm".equals(pathInfo)) {
                Map<String, Object> body = JsonUtil.getGson().fromJson(readRequestBody(req), JsonUtil.OBJECT_MAP_TYPE);
                if (body == null || !body.containsKey("batchToken")) {
                    ResponseUtil.json(resp, 400, ApiResponse.error("Thiếu mã phiên batchToken", null));
                    return;
                }

                String batchToken = (String) body.get("batchToken");
                boolean skipErrors = Boolean.TRUE.equals(body.get("skipErrors"));
                Long campaignId = null;
                if (body.get("campaignId") != null) {
                    campaignId = Long.valueOf(body.get("campaignId").toString());
                }

                var commitResult = importService.commitImport(batchToken, skipErrors, campaignId, userId);
                ResponseUtil.json(resp, 200, ApiResponse.success("Nhập danh sách lead thành công", commitResult));
                return;
            }

            ResponseUtil.json(resp, 404, ApiResponse.error("Đường dẫn không tồn tại", null));
        } catch (IllegalArgumentException | NoSuchElementException e) {
            ResponseUtil.json(resp, 400, ApiResponse.error(e.getMessage(), null));
        } catch (SecurityException e) {
            ResponseUtil.json(resp, 401, ApiResponse.error(e.getMessage(), null));
        } catch (Exception e) {
            ResponseUtil.json(resp, 500, ApiResponse.error("Lỗi khi xử lý: " + e.getMessage(), null));
        }
    }

    private static String readRequestBody(HttpServletRequest req) throws IOException {
        byte[] bytes = req.getInputStream().readAllBytes();
        if (bytes == null || bytes.length == 0) return "";
        String encoding = req.getCharacterEncoding();
        if (encoding != null && !encoding.isBlank()) {
            try {
                return new String(bytes, Charset.forName(encoding));
            } catch (Exception ignored) {
            }
        }
        return new String(bytes, StandardCharsets.UTF_8);
    }

    private void handleManualLeadCreate(HttpServletRequest req, HttpServletResponse resp, long userId) throws Exception {
        LeadManualWriteRequest body = JsonUtil.getGson().fromJson(readRequestBody(req), LeadManualWriteRequest.class);
        if (body == null) {
            ResponseUtil.json(resp, 400, ApiResponse.error("Dữ liệu gửi lên không hợp lệ", null));
            return;
        }

        // VALIDATION THEO YÊU CẦU SCRUM-64
        if (body.getFullName() == null || body.getFullName().trim().isBlank()) {
            ResponseUtil.json(resp, 400, ApiResponse.error("Họ và tên lead không được để trống", null));
            return;
        }

        // BẮT BUỘC CÓ NGUỒN LEAD
        if (body.getLeadSource() == null || body.getLeadSource().trim().isBlank()) {
            ResponseUtil.json(resp, 400, ApiResponse.error("Mọi lead nhập vào đều bắt buộc có nguồn", null));
            return;
        }

        if (body.getPhone() == null || body.getPhone().trim().isBlank()) {
            ResponseUtil.json(resp, 400, ApiResponse.error("Số điện thoại không được để trống", null));
            return;
        }

        String normPhone = CustomerMergeDAO.normalizePhone(body.getPhone());
        if (normPhone.length() < 8 || normPhone.length() > 12) {
            ResponseUtil.json(resp, 400, ApiResponse.error("Số điện thoại không hợp lệ (tối thiểu 8 chữ số)", null));
            return;
        }

        if (body.getEmail() != null && !body.getEmail().trim().isBlank()) {
            String normEmail = CustomerMergeDAO.normalizeEmail(body.getEmail());
            if (!normEmail.matches("^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$")) {
                ResponseUtil.json(resp, 400, ApiResponse.error("Địa chỉ email không đúng định dạng", null));
                return;
            }
        }

        // Tạo khách hàng / lead trong Database
        String customerName = (body.getCompany() != null && !body.getCompany().trim().isBlank())
                ? body.getCompany().trim()
                : body.getFullName().trim();

        try (Connection conn = DatabaseConfig.getConnection()) {
            conn.setAutoCommit(false);
            try {
                String insertCustSql = """
                    INSERT INTO customers (
                        name, status, email, phone, address, owner_user_id,
                        lead_source, campaign_id, is_deleted, created_at, updated_at
                    ) VALUES (?, 'TIEM_NANG', ?, ?, ?, ?, ?, ?, 0, NOW(), NOW())
                """;

                long customerId;
                try (PreparedStatement ps = conn.prepareStatement(insertCustSql, Statement.RETURN_GENERATED_KEYS)) {
                    ps.setString(1, customerName);
                    ps.setString(2, body.getEmail() != null ? body.getEmail().trim() : null);
                    ps.setString(3, body.getPhone().trim());
                    ps.setString(4, body.getCompany());
                    ps.setLong(5, userId);
                    ps.setString(6, body.getLeadSource().trim());
                    ps.setObject(7, body.getCampaignId());
                    ps.executeUpdate();

                    try (ResultSet rs = ps.getGeneratedKeys()) {
                        if (!rs.next()) throw new SQLException("Không thể tạo khách hàng tiềm năng");
                        customerId = rs.getLong(1);
                    }
                }

                // Tạo contact chính
                String insertContactSql = """
                    INSERT INTO contacts (
                        customer_id, name, title, phone, email, is_primary, notes, is_deleted
                    ) VALUES (?, ?, ?, ?, ?, 1, ?, 0)
                """;
                try (PreparedStatement ps = conn.prepareStatement(insertContactSql)) {
                    ps.setLong(1, customerId);
                    ps.setString(2, body.getFullName().trim());
                    ps.setString(3, body.getTitle());
                    ps.setString(4, body.getPhone().trim());
                    ps.setString(5, body.getEmail() != null ? body.getEmail().trim() : null);
                    ps.setString(6, body.getInterest());
                    ps.executeUpdate();
                }

                // Ghi nhận hoạt động ban đầu
                StringBuilder desc = new StringBuilder("Tạo lead thủ công từ nguồn: " + body.getLeadSource());
                if (body.getEventName() != null && !body.getEventName().isBlank()) {
                    desc.append(" | Sự kiện: ").append(body.getEventName().trim());
                }
                if (body.getInterest() != null && !body.getInterest().isBlank()) {
                    desc.append(" | Trao đổi/Nhu cầu: ").append(body.getInterest().trim());
                }

                String insertActSql = """
                    INSERT INTO activities (
                        customer_id, owner_user_id, type, subject, description, status, created_at
                    ) VALUES (?, ?, 'NOTE', 'Thu thập lead thủ công', ?, 'COMPLETED', NOW())
                """;
                try (PreparedStatement ps = conn.prepareStatement(insertActSql)) {
                    ps.setLong(1, customerId);
                    ps.setLong(2, userId);
                    ps.setString(3, desc.toString());
                    ps.executeUpdate();
                }

                conn.commit();

                Map<String, Object> respData = new LinkedHashMap<>();
                respData.put("id", customerId);
                respData.put("name", customerName);
                respData.put("fullName", body.getFullName());
                respData.put("leadSource", body.getLeadSource());
                respData.put("campaignId", body.getCampaignId());

                ResponseUtil.json(resp, 201, ApiResponse.success("Tạo lead thủ công thành công", respData));
            } catch (Exception e) {
                conn.rollback();
                throw e;
            } finally {
                conn.setAutoCommit(true);
            }
        }
    }

    private long requireUser(HttpServletRequest req) {
        HttpSession session = req.getSession(false);
        if (session == null || session.getAttribute("userId") == null) {
            throw new SecurityException("Phiên làm việc đã hết hạn. Vui lòng đăng nhập lại.");
        }
        return (Long) session.getAttribute("userId");
    }
}
