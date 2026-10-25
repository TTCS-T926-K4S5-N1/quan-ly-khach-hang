package com.crm.controller.publicportal;

import com.crm.dto.common.ApiResponse;
import com.crm.service.quotes.QuoteService;
import com.crm.util.JsonUtil;
import com.crm.util.ResponseUtil;

import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.IOException;
import java.util.Map;
import java.util.NoSuchElementException;

@WebServlet({
        "/api/public/quotes",
        "/api/public/quotes/*"
})
public class PublicQuoteServlet extends HttpServlet {

    private final QuoteService quoteService = new QuoteService();

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        try {
            String token = req.getParameter("token");
            String path = req.getPathInfo();
            if (token == null && path != null && !path.equals("/")) {
                token = path.replaceAll("^/+", "").trim();
            }

            if (token == null || token.trim().isEmpty()) {
                throw new IllegalArgumentException("Thiếu mã token truy cập báo giá.");
            }

            var data = quoteService.getPublicQuote(token.trim());
            ResponseUtil.json(resp, 200, ApiResponse.success("Lấy thông tin báo giá trực tuyến thành công", data));
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
            String path = req.getPathInfo();
            Map<String, Object> body = JsonUtil.getGson().fromJson(req.getReader(), com.crm.util.JsonUtil.OBJECT_MAP_TYPE);
            if (body == null) {
                body = Map.of();
            }

            String token = (String) body.get("token");
            if (token == null && req.getParameter("token") != null) {
                token = req.getParameter("token");
            }

            String decision = (String) body.get("decision");
            String comment = (String) body.get("comment");

            if (token == null || token.trim().isEmpty()) {
                throw new IllegalArgumentException("Thiếu token báo giá.");
            }
            if (decision == null || decision.trim().isEmpty()) {
                throw new IllegalArgumentException("Thiếu quyết định phản hồi (ACCEPT hoặc REJECT).");
            }

            var updated = quoteService.submitCustomerFeedback(token.trim(), decision.trim().toUpperCase(), comment);
            ResponseUtil.json(resp, 200, ApiResponse.success("Gửi phản hồi báo giá thành công. Xin chân thành cảm ơn Quý khách!", updated));
        } catch (IllegalStateException e) {
            ResponseUtil.json(resp, 400, ApiResponse.error(e.getMessage(), null));
        } catch (NoSuchElementException e) {
            ResponseUtil.json(resp, 404, ApiResponse.error(e.getMessage(), null));
        } catch (IllegalArgumentException e) {
            ResponseUtil.json(resp, 400, ApiResponse.error(e.getMessage(), null));
        } catch (Exception e) {
            ResponseUtil.json(resp, 500, ApiResponse.error("Lỗi máy chủ: " + e.getMessage(), null));
        }
    }
}
