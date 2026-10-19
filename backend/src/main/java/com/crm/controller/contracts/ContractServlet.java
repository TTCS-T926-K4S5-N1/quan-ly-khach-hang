package com.crm.controller.contracts;

import com.crm.dto.common.ApiResponse;
import com.crm.service.contracts.ContractService;
import com.crm.util.JsonUtil;
import com.crm.util.ResponseUtil;

import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;

import java.io.IOException;
import java.math.BigDecimal;
import java.sql.Date;
import java.util.Map;
import java.util.NoSuchElementException;

@WebServlet({
        "/api/contracts",
        "/api/contracts/*"
})
public class ContractServlet extends HttpServlet {

    private final ContractService contractService = new ContractService();

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        try {
            long currentUserId = requireUser(req);
            String path = req.getPathInfo();

            if (path == null || path.equals("/")) {
                String keyword = req.getParameter("keyword");
                String status = req.getParameter("status");
                Integer threshold = parseInteger(req.getParameter("threshold"));

                var items = contractService.search(currentUserId, keyword, status, threshold);
                ResponseUtil.json(resp, 200, ApiResponse.success("Lấy danh sách hợp đồng thành công", items));
                return;
            }

            if ("/summary".equalsIgnoreCase(path)) {
                Integer threshold = parseInteger(req.getParameter("threshold"));
                var summary = contractService.getSummary(currentUserId, threshold);
                ResponseUtil.json(resp, 200, ApiResponse.success("Lấy thống kê hợp đồng thành công", summary));
                return;
            }

            if ("/settings".equalsIgnoreCase(path)) {
                var settings = contractService.getThresholdSettings(currentUserId);
                ResponseUtil.json(resp, 200, ApiResponse.success("Lấy cấu hình hợp đồng thành công", settings));
                return;
            }

            String[] parts = path.split("/");
            if (parts.length >= 2) {
                if ("summary".equalsIgnoreCase(parts[1])) {
                    Integer threshold = parseInteger(req.getParameter("threshold"));
                    var summary = contractService.getSummary(currentUserId, threshold);
                    ResponseUtil.json(resp, 200, ApiResponse.success("Lấy thống kê hợp đồng thành công", summary));
                    return;
                }
                if ("settings".equalsIgnoreCase(parts[1])) {
                    var settings = contractService.getThresholdSettings(currentUserId);
                    ResponseUtil.json(resp, 200, ApiResponse.success("Lấy cấu hình hợp đồng thành công", settings));
                    return;
                }

                long id = Long.parseLong(parts[1]);

                if (parts.length >= 3 && "print".equalsIgnoreCase(parts[2])) {
                    var printData = contractService.getPrintData(currentUserId, id);
                    ResponseUtil.json(resp, 200, ApiResponse.success("Lấy dữ liệu in hợp đồng thành công", printData));
                    return;
                }

                var item = contractService.getById(currentUserId, id);
                if (item == null) {
                    ResponseUtil.json(resp, 404, ApiResponse.error("Không tìm thấy hợp đồng", null));
                    return;
                }

                ResponseUtil.json(resp, 200, ApiResponse.success("Lấy thông tin hợp đồng thành công", item));
                return;
            }

            throw new IllegalArgumentException("Đường dẫn không hợp lệ: " + path);
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
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        try {
            long currentUserId = requireUser(req);
            String path = req.getPathInfo();

            Map<String, Object> body = JsonUtil.getGson().fromJson(req.getReader(), com.crm.util.JsonUtil.OBJECT_MAP_TYPE);
            if (body == null) {
                throw new IllegalArgumentException("Thiếu dữ liệu gửi lên.");
            }

            // Route 1: Cập nhật settings qua POST /settings
            if ("/settings".equalsIgnoreCase(path)) {
                int days = 30;
                if (body.get("expiringThresholdDays") != null) {
                    days = ((Number) body.get("expiringThresholdDays")).intValue();
                }
                var updated = contractService.updateThresholdSettings(currentUserId, days);
                ResponseUtil.json(resp, 200, ApiResponse.success("Cập nhật cấu hình cảnh báo thành công", updated));
                return;
            }

            // Route 2: Tạo cơ hội gia hạn qua POST /{id}/renew
            if (path != null) {
                String[] parts = path.split("/");
                if (parts.length >= 3 && "renew".equalsIgnoreCase(parts[2])) {
                    long contractId = Long.parseLong(parts[1]);
                    String title = (String) body.get("title");
                    BigDecimal amount = body.get("amount") != null ? new BigDecimal(String.valueOf(body.get("amount"))) : null;
                    String notes = (String) body.get("notes");

                    var renewal = contractService.createRenewalOpportunity(currentUserId, contractId, title, amount, notes);
                    ResponseUtil.json(resp, 201, ApiResponse.success("Tạo cơ hội gia hạn hợp đồng thành công", renewal));
                    return;
                }
            }

            // Route 3: Tạo hợp đồng từ báo giá (POST /api/contracts)
            Long quoteId = body.get("quoteId") != null ? ((Number) body.get("quoteId")).longValue() : null;
            if (quoteId == null || quoteId <= 0) {
                throw new IllegalArgumentException("Bắt buộc phải có quoteId để chuyển đổi thành hợp đồng.");
            }

            String contractNumber = (String) body.get("contractNumber");
            String title = (String) body.get("title");

            Date signedDate = null;
            if (body.get("signedDate") != null) {
                String s = String.valueOf(body.get("signedDate")).trim();
                if (!s.isEmpty()) signedDate = Date.valueOf(s);
            }

            Date effectiveDate = null;
            if (body.get("effectiveDate") != null) {
                String s = String.valueOf(body.get("effectiveDate")).trim();
                if (!s.isEmpty()) effectiveDate = Date.valueOf(s);
            }

            Date expiryDate = null;
            if (body.get("expiryDate") != null) {
                String s = String.valueOf(body.get("expiryDate")).trim();
                if (!s.isEmpty()) expiryDate = Date.valueOf(s);
            }

            String paymentTerms = (String) body.get("paymentTerms");

            var created = contractService.createFromQuote(
                    currentUserId,
                    quoteId,
                    contractNumber,
                    title,
                    signedDate,
                    effectiveDate,
                    expiryDate,
                    paymentTerms
            );

            ResponseUtil.json(resp, 201, ApiResponse.success("Tạo hợp đồng từ báo giá thành công", created));
        } catch (IllegalArgumentException | IllegalStateException e) {
            ResponseUtil.json(resp, 400, ApiResponse.error(e.getMessage(), null));
        } catch (SecurityException e) {
            ResponseUtil.json(resp, 403, ApiResponse.error(e.getMessage(), null));
        } catch (NoSuchElementException e) {
            ResponseUtil.json(resp, 404, ApiResponse.error(e.getMessage(), null));
        } catch (Exception e) {
            ResponseUtil.json(resp, 500, ApiResponse.error("Lỗi máy chủ: " + e.getMessage(), null));
        }
    }

    @Override
    protected void doPut(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        try {
            long currentUserId = requireUser(req);
            String path = req.getPathInfo();

            if (path != null && (path.equals("/settings") || path.endsWith("/settings"))) {
                Map<String, Object> body = JsonUtil.getGson().fromJson(req.getReader(), com.crm.util.JsonUtil.OBJECT_MAP_TYPE);
                if (body == null || body.get("expiringThresholdDays") == null) {
                    throw new IllegalArgumentException("Thiếu giá trị expiringThresholdDays.");
                }
                int days = ((Number) body.get("expiringThresholdDays")).intValue();
                var updated = contractService.updateThresholdSettings(currentUserId, days);
                ResponseUtil.json(resp, 200, ApiResponse.success("Cập nhật cấu hình cảnh báo thành công", updated));
                return;
            }

            throw new IllegalArgumentException("Phương thức PUT không hỗ trợ cho đường dẫn: " + path);
        } catch (IllegalArgumentException | IllegalStateException e) {
            ResponseUtil.json(resp, 400, ApiResponse.error(e.getMessage(), null));
        } catch (SecurityException e) {
            ResponseUtil.json(resp, 403, ApiResponse.error(e.getMessage(), null));
        } catch (Exception e) {
            ResponseUtil.json(resp, 500, ApiResponse.error("Lỗi máy chủ: " + e.getMessage(), null));
        }
    }

    private Integer parseInteger(String str) {
        if (str == null || str.trim().isEmpty()) return null;
        try {
            return Integer.parseInt(str.trim());
        } catch (NumberFormatException e) {
            return null;
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
