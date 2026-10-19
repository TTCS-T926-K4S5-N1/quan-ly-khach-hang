package com.crm.controller.pipeline;

import com.crm.dto.pipeline.OpportunityItemDTO;
import com.crm.service.pipeline.OpportunityItemService;
import com.crm.service.pipeline.OpportunityService;
import com.crm.util.JsonUtil;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.io.BufferedReader;
import java.io.PrintWriter;
import java.io.StringReader;
import java.io.StringWriter;
import java.lang.reflect.Proxy;
import java.math.BigDecimal;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;

class OpportunityServletTest {

    record Result(int status, String body) {}

    static Result execute(
            OpportunityService oppService,
            OpportunityItemService itemService,
            String method,
            String path,
            String payload,
            Long userId
    ) throws Exception {
        StringWriter body = new StringWriter();
        int[] status = {200};

        HttpSession session = (HttpSession) Proxy.newProxyInstance(
                OpportunityServletTest.class.getClassLoader(),
                new Class<?>[]{HttpSession.class},
                (p, m, a) -> m.getName().equals("getAttribute") ? userId : null
        );

        HttpServletRequest request = (HttpServletRequest) Proxy.newProxyInstance(
                OpportunityServletTest.class.getClassLoader(),
                new Class<?>[]{HttpServletRequest.class},
                (p, m, a) -> switch (m.getName()) {
                    case "getMethod" -> method;
                    case "getPathInfo" -> path;
                    case "getSession" -> userId == null ? null : session;
                    case "getReader" -> new BufferedReader(new StringReader(payload != null ? payload : ""));
                    case "getParameter" -> null;
                    default -> null;
                }
        );

        HttpServletResponse response = (HttpServletResponse) Proxy.newProxyInstance(
                OpportunityServletTest.class.getClassLoader(),
                new Class<?>[]{HttpServletResponse.class},
                (p, m, a) -> {
                    if (m.getName().equals("setStatus")) status[0] = (Integer) a[0];
                    if (m.getName().equals("getWriter")) return new PrintWriter(body);
                    return null;
                }
        );

        OpportunityServlet servlet = new OpportunityServlet(oppService, itemService);
        switch (method.toUpperCase()) {
            case "GET" -> servlet.doGet(request, response);
            case "POST" -> servlet.doPost(request, response);
            case "PUT" -> servlet.doPut(request, response);
            case "DELETE" -> servlet.doDelete(request, response);
            default -> throw new UnsupportedOperationException(method);
        }

        return new Result(status[0], body.toString());
    }

    @Test
    @DisplayName("Yêu cầu không có session đăng nhập sẽ bị từ chối 403")
    void requireAuthentication() throws Exception {
        Result result = execute(new OpportunityService(), new OpportunityItemService(), "GET", "/1/items", null, null);
        assertEquals(403, result.status());
    }

    @Test
    @DisplayName("GET /api/opportunities/{id}/items trả về danh sách sản phẩm thành công")
    void getOpportunityItemsSuccessfully() throws Exception {
        OpportunityItemService mockItemService = new OpportunityItemService(null, null, null, null) {
            @Override
            public List<Map<String, Object>> getItems(long userId, long oppId) {
                Map<String, Object> item1 = new LinkedHashMap<>();
                item1.put("id", 101L);
                item1.put("productId", 1L);
                item1.put("productCode", "CRM-SEAT-STD");
                item1.put("productName", "Gói Standard");
                item1.put("totalAmount", new BigDecimal("5400000.00"));
                item1.put("annualAmount", new BigDecimal("5400000.00"));
                return List.of(item1);
            }
        };

        Result result = execute(new OpportunityService(), mockItemService, "GET", "/1/items", null, 1L);
        assertEquals(200, result.status());
        assertTrue(result.body().contains("CRM-SEAT-STD"));
        assertTrue(result.body().contains("5400000"));
    }

    @Test
    @DisplayName("POST /api/opportunities/{id}/items thêm sản phẩm và cập nhật lại giá trị cơ hội")
    void addOpportunityItemSuccessfully() throws Exception {
        OpportunityItemService mockItemService = new OpportunityItemService(null, null, null, null) {
            @Override
            public Map<String, Object> addItem(long userId, long oppId, OpportunityItemDTO item) {
                Map<String, Object> res = new LinkedHashMap<>();
                res.put("id", 201L);
                res.put("opportunityId", oppId);
                res.put("productId", item.getProductId());
                res.put("totalAmount", new BigDecimal("21000000.00"));
                res.put("annualAmount", new BigDecimal("21000000.00"));
                res.put("opportunityAmount", new BigDecimal("46000000.00")); // Giá trị cơ hội tự động tính lại
                res.put("opportunityAnnualAmount", new BigDecimal("21000000.00"));
                return res;
            }
        };

        OpportunityItemDTO payload = new OpportunityItemDTO();
        payload.setProductId(1L);
        payload.setQuantity(new BigDecimal("5"));
        payload.setUnitPrice(new BigDecimal("350000.00"));
        payload.setProductType("RECURRING");
        payload.setBillingCycle("MONTHLY");
        payload.setTermCount(12);

        Result result = execute(
                new OpportunityService(),
                mockItemService,
                "POST",
                "/1/items",
                JsonUtil.getGson().toJson(payload),
                1L
        );

        assertEquals(201, result.status());
        assertTrue(result.body().contains("46000000"));
        assertTrue(result.body().contains("Thêm sản phẩm vào cơ hội thành công"));
    }

    @Test
    @DisplayName("PUT /api/opportunities/{id}/items/{itemId} sửa dòng sản phẩm thành công")
    void updateOpportunityItemSuccessfully() throws Exception {
        OpportunityItemService mockItemService = new OpportunityItemService(null, null, null, null) {
            @Override
            public Map<String, Object> updateItem(long userId, long oppId, long itemId, OpportunityItemDTO item) {
                Map<String, Object> res = new LinkedHashMap<>();
                res.put("id", itemId);
                res.put("opportunityId", oppId);
                res.put("totalAmount", new BigDecimal("30000000.00"));
                res.put("opportunityAmount", new BigDecimal("55000000.00"));
                return res;
            }
        };

        OpportunityItemDTO payload = new OpportunityItemDTO();
        payload.setQuantity(new BigDecimal("8"));

        Result result = execute(
                new OpportunityService(),
                mockItemService,
                "PUT",
                "/1/items/101",
                JsonUtil.getGson().toJson(payload),
                1L
        );

        assertEquals(200, result.status());
        assertTrue(result.body().contains("55000000"));
    }

    @Test
    @DisplayName("DELETE /api/opportunities/{id}/items/{itemId} xóa dòng sản phẩm và tính lại giá trị cơ hội")
    void deleteOpportunityItemSuccessfully() throws Exception {
        OpportunityItemService mockItemService = new OpportunityItemService(null, null, null, null) {
            @Override
            public Map<String, BigDecimal> deleteItem(long userId, long oppId, long itemId) {
                return Map.of(
                        "amount", new BigDecimal("25000000.00"),
                        "annualAmount", BigDecimal.ZERO
                );
            }
        };

        Result result = execute(
                new OpportunityService(),
                mockItemService,
                "DELETE",
                "/1/items/101",
                null,
                1L
        );

        assertEquals(200, result.status());
        assertTrue(result.body().contains("25000000"));
        assertTrue(result.body().contains("Xóa dòng sản phẩm thành công"));
    }

    @Test
    @DisplayName("Xử lý lỗi 404 khi không tìm thấy dòng sản phẩm hoặc cơ hội")
    void notFoundHandling() throws Exception {
        OpportunityItemService mockItemService = new OpportunityItemService(null, null, null, null) {
            @Override
            public List<Map<String, Object>> getItems(long userId, long oppId) {
                throw new NoSuchElementException("Không tìm thấy cơ hội");
            }
        };

        Result result = execute(new OpportunityService(), mockItemService, "GET", "/999/items", null, 1L);
        assertEquals(404, result.status());
    }

    @Test
    @DisplayName("Xử lý lỗi 403 khi bị hạn chế quyền hoặc phạm vi dữ liệu sở hữu")
    void securityExceptionHandling() throws Exception {
        OpportunityItemService mockItemService = new OpportunityItemService(null, null, null, null) {
            @Override
            public List<Map<String, Object>> getItems(long userId, long oppId) {
                throw new SecurityException("Bạn không có quyền truy cập cơ hội này");
            }
        };

        Result result = execute(new OpportunityService(), mockItemService, "GET", "/2/items", null, 1L);
        assertEquals(403, result.status());
    }
}
