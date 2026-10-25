package com.crm.controller.quotes;

import com.crm.dto.common.ApiResponse;
import com.crm.service.quotes.QuoteService;
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
import java.util.List;
import java.util.Map;
import java.util.NoSuchElementException;

@WebServlet({
        "/api/quotes",
        "/api/quotes/*"
})
public class QuoteServlet extends HttpServlet {

    private final QuoteService quoteService = new QuoteService();
    private final com.crm.service.documents.DocumentExportService exportService = new com.crm.service.documents.DocumentExportService();

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        try {
            long currentUserId = requireUser(req);
            String path = req.getPathInfo();

            if (path == null || path.equals("/")) {
                String keyword = req.getParameter("keyword");
                String status = req.getParameter("status");

                var items = quoteService.search(currentUserId, keyword, status);
                ResponseUtil.json(resp, 200, ApiResponse.success("Lấy danh sách báo giá thành công", items));
                return;
            }

            if (path.endsWith("/pdf")) {
                long id = parseId(path);
                boolean inline = "1".equals(req.getParameter("inline")) || "true".equalsIgnoreCase(req.getParameter("inline"));
                var result = exportService.exportQuotePdf(currentUserId, id);
                resp.setContentType("application/pdf");
                resp.setHeader("Content-Disposition", (inline ? "inline" : "attachment") + "; filename=\"" + result.fileName() + "\"");
                resp.setContentLength(result.bytes().length);
                resp.getOutputStream().write(result.bytes());
                resp.getOutputStream().flush();
                return;
            }

            // Route: /api/quotes/from-opportunity/{opportunityId}
            if (path.startsWith("/from-opportunity/")) {
                long oppId = Long.parseLong(path.replace("/from-opportunity/", "").replaceAll("^/+", ""));
                var data = quoteService.getFromOpportunity(currentUserId, oppId);
                ResponseUtil.json(resp, 200, ApiResponse.success("Kế thừa thông tin từ cơ hội thành công", data));
                return;
            }

            // Route: /api/quotes/compare?v1={id1}&v2={id2}
            if (path.equals("/compare")) {
                String v1Str = req.getParameter("v1");
                String v2Str = req.getParameter("v2");
                if (v1Str == null || v2Str == null) {
                    throw new IllegalArgumentException("Thiếu tham số v1 hoặc v2 để so sánh phiên bản.");
                }
                long v1Id = Long.parseLong(v1Str);
                long v2Id = Long.parseLong(v2Str);
                var diff = quoteService.compareVersions(currentUserId, v1Id, v2Id);
                ResponseUtil.json(resp, 200, ApiResponse.success("So sánh hai phiên bản báo giá thành công", diff));
                return;
            }

            // Check sub-routes like /api/quotes/{id}/approvals, /api/quotes/{id}/versions
            String[] parts = path.split("/");
            if (parts.length >= 2) {
                long id = Long.parseLong(parts[1]);

                if (parts.length >= 3 && "approvals".equalsIgnoreCase(parts[2])) {
                    var approvals = quoteService.getApprovalHistory(id);
                    ResponseUtil.json(resp, 200, ApiResponse.success("Lấy lịch sử duyệt thành công", approvals));
                    return;
                }

                if (parts.length >= 3 && "versions".equalsIgnoreCase(parts[2])) {
                    var versions = quoteService.getVersions(id);
                    ResponseUtil.json(resp, 200, ApiResponse.success("Lấy danh sách phiên bản thành công", versions));
                    return;
                }

                if (parts.length >= 3 && "print".equalsIgnoreCase(parts[2])) {
                    var printData = quoteService.getPrintData(currentUserId, id);
                    ResponseUtil.json(resp, 200, ApiResponse.success("Lấy dữ liệu in báo giá thành công", printData));
                    return;
                }

                // Default: get quote by id
                var item = quoteService.getById(currentUserId, id);
                if (item == null) {
                    ResponseUtil.json(resp, 404, ApiResponse.error("Không tìm thấy báo giá", null));
                    return;
                }

                ResponseUtil.json(resp, 200, ApiResponse.success("Lấy thông tin báo giá thành công", item));
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
                body = Map.of();
            }

            if (path != null && path.contains("/contract-pdf")) {
                long quoteId = parseId(path);
                var contractInfo = com.crm.service.documents.ContractInfo.fromRequest(body);
                boolean inline = "1".equals(req.getParameter("inline")) || "true".equalsIgnoreCase(req.getParameter("inline"));
                var result = exportService.exportContractPdf(currentUserId, quoteId, contractInfo);
                resp.setContentType("application/pdf");
                resp.setHeader("Content-Disposition", (inline ? "inline" : "attachment") + "; filename=\"" + result.fileName() + "\"");
                resp.setContentLength(result.bytes().length);
                resp.getOutputStream().write(result.bytes());
                resp.getOutputStream().flush();
                return;
            }

            // Check actions on specific quote: /api/quotes/{id}/{action}
            if (path != null && !path.equals("/")) {
                String[] parts = path.split("/");
                if (parts.length >= 3) {
                    long quoteId = Long.parseLong(parts[1]);
                    String action = parts[2].toLowerCase();

                    switch (action) {
                        case "approve" -> {
                            String comment = (String) body.get("comment");
                            var res = quoteService.approve(currentUserId, quoteId, comment);
                            ResponseUtil.json(resp, 200, ApiResponse.success("Duyệt báo giá thành công", res));
                            return;
                        }
                        case "reject" -> {
                            String comment = (String) body.get("comment");
                            var res = quoteService.reject(currentUserId, quoteId, comment);
                            ResponseUtil.json(resp, 200, ApiResponse.success("Đã từ chối báo giá", res));
                            return;
                        }
                        case "request-changes" -> {
                            String comment = (String) body.get("comment");
                            var res = quoteService.requestChanges(currentUserId, quoteId, comment);
                            ResponseUtil.json(resp, 200, ApiResponse.success("Đã gửi yêu cầu chỉnh sửa báo giá", res));
                            return;
                        }
                        case "send" -> {
                            var res = quoteService.sendToCustomer(currentUserId, quoteId);
                            ResponseUtil.json(resp, 200, ApiResponse.success("Gửi báo giá cho khách hàng thành công", res));
                            return;
                        }
                        case "send-email" -> {
                            String recipientEmail = (String) body.get("recipientEmail");
                            String message = (String) body.get("message");
                            var res = quoteService.sendQuoteEmail(currentUserId, quoteId, recipientEmail, message);
                            ResponseUtil.json(resp, 200, ApiResponse.success("Gửi email báo giá kèm liên kết trực tuyến thành công", res));
                            return;
                        }
                        case "create-version" -> {
                            var res = quoteService.createNewVersion(currentUserId, quoteId);
                            ResponseUtil.json(resp, 201, ApiResponse.success("Tạo phiên bản báo giá mới thành công", res));
                            return;
                        }
                        case "set-active" -> {
                            var res = quoteService.setActiveVersion(currentUserId, quoteId);
                            ResponseUtil.json(resp, 200, ApiResponse.success("Đã kích hoạt phiên bản báo giá có hiệu lực", res));
                            return;
                        }
                        case "status" -> {
                            String status = (String) body.get("status");
                            var updated = quoteService.updateStatus(currentUserId, quoteId, status);
                            ResponseUtil.json(resp, 200, ApiResponse.success("Cập nhật trạng thái báo giá thành công", updated));
                            return;
                        }
                    }
                }
            }

            // Create new quote (DRAFT or SUBMIT)
            var res = parseAndSaveQuote(currentUserId, null, body);
            ResponseUtil.json(resp, 201, ApiResponse.success("Tạo báo giá thành công", res));
        } catch (IllegalStateException | IllegalArgumentException e) {
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
            long id = parseId(req.getPathInfo());

            Map<String, Object> body = JsonUtil.getGson().fromJson(req.getReader(), com.crm.util.JsonUtil.OBJECT_MAP_TYPE);
            if (body == null) {
                throw new IllegalArgumentException("Thiếu dữ liệu cập nhật");
            }

            var res = parseAndSaveQuote(currentUserId, id, body);
            ResponseUtil.json(resp, 200, ApiResponse.success("Cập nhật báo giá thành công", res));
        } catch (IllegalStateException | IllegalArgumentException e) {
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
    protected void doDelete(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        try {
            long currentUserId = requireUser(req);
            long id = parseId(req.getPathInfo());

            quoteService.delete(currentUserId, id);
            ResponseUtil.json(resp, 200, ApiResponse.success("Xóa báo giá thành công", null));
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

    private Map<String, Object> parseAndSaveQuote(long currentUserId, Long quoteId, Map<String, Object> body) throws Exception {
        String title = (String) body.get("title");
        Long customerId = body.get("customerId") != null ? ((Number) body.get("customerId")).longValue() : null;
        Long opportunityId = body.get("opportunityId") != null ? ((Number) body.get("opportunityId")).longValue() : null;
        BigDecimal discountPercent = body.get("discountPercent") != null ? new BigDecimal(String.valueOf(body.get("discountPercent"))) : BigDecimal.ZERO;

        Date validUntil = null;
        if (body.get("validUntil") != null) {
            String vDateStr = String.valueOf(body.get("validUntil")).trim();
            if (!vDateStr.isEmpty()) {
                validUntil = Date.valueOf(vDateStr);
            }
        }

        String paymentTerms = (String) body.get("paymentTerms");
        String deliveryTerms = (String) body.get("deliveryTerms");
        String termsAndConditions = (String) body.get("termsAndConditions");
        String submitAction = body.get("action") != null ? String.valueOf(body.get("action")) : "DRAFT";

        List<Map<String, Object>> items = JsonUtil.objectList(body.get("items"));

        return quoteService.saveQuote(
                currentUserId,
                quoteId,
                title,
                customerId,
                opportunityId,
                discountPercent,
                validUntil,
                paymentTerms,
                deliveryTerms,
                termsAndConditions,
                submitAction,
                items
        );
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
            throw new IllegalArgumentException("Thiếu quote id");
        }
        String clean = pathInfo.startsWith("/") ? pathInfo.substring(1) : pathInfo;
        int slash = clean.indexOf('/');
        String idStr = slash >= 0 ? clean.substring(0, slash) : clean;
        return Long.parseLong(idStr);
    }
}
