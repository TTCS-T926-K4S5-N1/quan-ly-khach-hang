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

                var items = contractService.search(currentUserId, keyword, status);
                ResponseUtil.json(resp, 200, ApiResponse.success("Lấy danh sách hợp đồng thành công", items));
                return;
            }

            String[] parts = path.split("/");
            if (parts.length >= 2) {
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

            Map<String, Object> body = JsonUtil.getGson().fromJson(req.getReader(), com.crm.util.JsonUtil.OBJECT_MAP_TYPE);
            if (body == null) {
                throw new IllegalArgumentException("Thiếu dữ liệu tạo hợp đồng.");
            }

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

    private long requireUser(HttpServletRequest req) {
        HttpSession session = req.getSession(false);
        if (session == null || session.getAttribute("userId") == null) {
            throw new SecurityException("Phiên đăng nhập không hợp lệ hoặc đã hết hạn.");
        }
        return (Long) session.getAttribute("userId");
    }
}
