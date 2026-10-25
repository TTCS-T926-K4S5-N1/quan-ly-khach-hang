package com.crm.controller.support;

import com.crm.dto.common.ApiResponse;
import com.crm.dto.support.SupportRequestWrite;
import com.crm.service.support.SupportRequestService;
import com.crm.util.ResponseUtil;
import com.google.gson.*;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.*;
import java.io.IOException;
import java.util.Set;
import java.util.NoSuchElementException;

@WebServlet({"/api/support-requests", "/api/support-requests/*"})
public class SupportRequestServlet extends HttpServlet {
    private final SupportRequestService service = new SupportRequestService();

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws IOException { handle(req, resp, "GET"); }
    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws IOException { handle(req, resp, "POST"); }
    @Override
    protected void doPut(HttpServletRequest req, HttpServletResponse resp) throws IOException { handle(req, resp, "PUT"); }
    @Override
    protected void doDelete(HttpServletRequest req, HttpServletResponse resp) throws IOException { handle(req, resp, "DELETE"); }

    private void handle(HttpServletRequest req, HttpServletResponse resp, String method) throws IOException {
        try {
            HttpSession session = req.getSession(false);
            if (session == null || !(session.getAttribute("userId") instanceof Number user)) {
                ResponseUtil.json(resp, 401, ApiResponse.error("Chưa đăng nhập", null));
                return;
            }
            long actor = user.longValue();
            String path = req.getPathInfo();
            boolean collection = path == null || path.equals("/");
            Object data;
            int status = 200;
            if ("GET".equals(method) && "/risks".equals(path)) {
                String filter = req.getParameter("atRiskOnly");
                if (filter != null && !Set.of("true", "false").contains(filter))
                    throw new IllegalArgumentException("atRiskOnly chỉ nhận true hoặc false");
                data = service.risks(actor, null, filter == null || Boolean.parseBoolean(filter),
                        number(req, "page", 1), number(req, "size", 20));
            } else if ("GET".equals(method) && path != null && path.startsWith("/risks/")) {
                data = service.risks(actor, id(path.substring("/risks".length())), false, 1, 1).getFirst();
            } else if ("GET".equals(method) && collection) {
                String customer = req.getParameter("customerId");
                data = service.search(actor, customer == null ? null : id("/" + customer),
                        req.getParameter("status"), req.getParameter("priority"),
                        number(req, "page", 1), number(req, "size", 20));
            } else if ("GET".equals(method)) {
                data = service.get(actor, id(path));
            } else if ("POST".equals(method) && collection) {
                data = service.save(actor, null, body(req)); status = 201;
            } else if ("PUT".equals(method) && !collection) {
                data = service.save(actor, id(path), body(req));
            } else if ("DELETE".equals(method) && !collection) {
                service.delete(actor, id(path)); data = null;
            } else {
                throw new IllegalArgumentException("Đường dẫn không hợp lệ cho thao tác này");
            }
            ResponseUtil.json(resp, status, ApiResponse.success("Thao tác yêu cầu hỗ trợ thành công", data));
        } catch (JsonParseException | IllegalArgumentException | ArithmeticException e) {
            ResponseUtil.json(resp, 400, ApiResponse.error("Dữ liệu không hợp lệ: " + safeMessage(e), null));
        } catch (SecurityException e) {
            ResponseUtil.json(resp, 403, ApiResponse.error(e.getMessage(), null));
        } catch (NoSuchElementException e) {
            ResponseUtil.json(resp, 404, ApiResponse.error(e.getMessage(), null));
        } catch (Exception e) {
            log("Support request API failed", e);
            ResponseUtil.json(resp, 500, ApiResponse.error("Không thể xử lý yêu cầu hỗ trợ", null));
        }
    }

    private static String safeMessage(Exception e) {
        return e instanceof JsonParseException || e instanceof ArithmeticException ? "JSON hoặc kiểu dữ liệu không hợp lệ" : e.getMessage();
    }

    static long id(String path) {
        if (path == null || !path.matches("/[0-9]+")) throw new IllegalArgumentException("Đường dẫn phải chứa một ID hợp lệ");
        long id = Long.parseLong(path.substring(1));
        SupportRequestService.positiveId(id);
        return id;
    }

    private static int number(HttpServletRequest req, String key, int fallback) {
        String value = req.getParameter(key);
        return value == null ? fallback : Integer.parseInt(value);
    }

    private static SupportRequestWrite body(HttpServletRequest req) throws IOException {
        JsonElement element = JsonParser.parseReader(req.getReader());
        if (!element.isJsonObject()) throw new IllegalArgumentException("Body phải là JSON object");
        return parseBody(element.getAsJsonObject());
    }

    static SupportRequestWrite parseBody(JsonObject json) {
        Set<String> fields = Set.of("customerId", "subject", "description", "priority", "status", "dueAt", "resolution");
        for (String key : json.keySet()) {
            if (!fields.contains(key)) throw new IllegalArgumentException("Trường không được hỗ trợ: " + key);
            JsonElement value = json.get(key);
            if (value.isJsonNull()) continue;
            if (!value.isJsonPrimitive() || (key.equals("customerId")
                    ? !value.getAsJsonPrimitive().isNumber() : !value.getAsJsonPrimitive().isString()))
                throw new IllegalArgumentException("Sai kiểu dữ liệu của trường " + key);
        }
        Long customerId = json.has("customerId") && !json.get("customerId").isJsonNull()
                ? json.get("customerId").getAsBigDecimal().longValueExact() : null;
        return new SupportRequestWrite(customerId, string(json, "subject"), string(json, "description"),
                string(json, "priority"), string(json, "status"), string(json, "dueAt"), string(json, "resolution"));
    }

    private static String string(JsonObject json, String field) {
        return json.has(field) && !json.get(field).isJsonNull() ? json.get(field).getAsString() : null;
    }
}
