package com.crm.controller.pipeline;

import com.crm.dto.pipeline.OpportunityFilterCriteria;
import com.crm.service.pipeline.OpportunityService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.io.PrintWriter;
import java.io.StringWriter;
import java.lang.reflect.Field;
import java.lang.reflect.Proxy;
import java.math.BigDecimal;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;

@DisplayName("Unit Tests: OpportunityServlet Multi-condition Filtering (SCRUM-81)")
public class OpportunityFilterServletTest {

    private OpportunityServlet servlet;
    private OpportunityFilterCriteria capturedCriteria;
    private Long capturedUserId;

    @BeforeEach
    void setUp() throws Exception {
        servlet = new OpportunityServlet();
        capturedCriteria = null;
        capturedUserId = null;

        OpportunityService mockService = new OpportunityService() {
            @Override
            public List<Map<String, Object>> search(long currentUserId, OpportunityFilterCriteria criteria) {
                capturedUserId = currentUserId;
                capturedCriteria = criteria;
                Map<String, Object> opp = new LinkedHashMap<>();
                opp.put("id", 101L);
                opp.put("name", "Cơ hội ERP Vinamilk");
                opp.put("amount", new BigDecimal("120000000"));
                opp.put("stageId", criteria.getStageId() != null ? criteria.getStageId() : 1L);
                return List.of(opp);
            }
        };

        Field serviceField = OpportunityServlet.class.getDeclaredField("opportunityService");
        serviceField.setAccessible(true);
        serviceField.set(servlet, mockService);
    }

    private HttpServletRequest createMockRequest(String pathInfo, Map<String, String> params, Long sessionUserId) {
        return (HttpServletRequest) Proxy.newProxyInstance(
                getClass().getClassLoader(),
                new Class<?>[]{HttpServletRequest.class},
                (proxy, method, args) -> {
                    String mName = method.getName();
                    if ("getMethod".equals(mName)) return "GET";
                    if ("getPathInfo".equals(mName)) return pathInfo;
                    if ("getParameter".equals(mName)) {
                        String key = (String) args[0];
                        return params != null ? params.get(key) : null;
                    }
                    if ("getSession".equals(mName)) {
                        if (sessionUserId == null) return null;
                        return createMockSession(sessionUserId);
                    }
                    return null;
                }
        );
    }

    private HttpSession createMockSession(Long sessionUserId) {
        return (HttpSession) Proxy.newProxyInstance(
                getClass().getClassLoader(),
                new Class<?>[]{HttpSession.class},
                (proxy, method, args) -> {
                    if ("getAttribute".equals(method.getName()) && "userId".equals(args[0])) {
                        return sessionUserId;
                    }
                    return null;
                }
        );
    }

    private HttpServletResponse createMockResponse(StringWriter stringWriter, int[] statusHolder) {
        return (HttpServletResponse) Proxy.newProxyInstance(
                getClass().getClassLoader(),
                new Class<?>[]{HttpServletResponse.class},
                (proxy, method, args) -> {
                    String mName = method.getName();
                    if ("setStatus".equals(mName)) {
                        statusHolder[0] = (int) args[0];
                        return null;
                    }
                    if ("getWriter".equals(mName)) {
                        return new PrintWriter(stringWriter);
                    }
                    if ("setContentType".equals(mName) || "setCharacterEncoding".equals(mName)) {
                        return null;
                    }
                    return null;
                }
        );
    }

    @Test
    @DisplayName("GET /api/opportunities: Lọc đầy đủ theo nhiều tiêu chí (stageId, minAmount, maxAmount, closeDate, product, owner)")
    void testFilterWithAllCriteria() throws Exception {
        Map<String, String> params = new LinkedHashMap<>();
        params.put("keyword", "Vinamilk");
        params.put("stageId", "3");
        params.put("status", "OPEN");
        params.put("minAmount", "50000000");
        params.put("maxAmount", "200000000");
        params.put("closeDateFrom", "2026-10-19");
        params.put("closeDateTo", "2026-10-25");
        params.put("productId", "7");
        params.put("ownerId", "2");
        params.put("ownerFilter", "MINE");
        params.put("quickDate", "THIS_WEEK");
        params.put("page", "1");
        params.put("size", "25");

        StringWriter sw = new StringWriter();
        int[] status = new int[]{200};
        HttpServletRequest req = createMockRequest(null, params, 99L);
        HttpServletResponse resp = createMockResponse(sw, status);

        servlet.service(req, resp);

        assertEquals(200, status[0]);
        assertEquals(99L, capturedUserId);
        assertNotNull(capturedCriteria);
        assertEquals("Vinamilk", capturedCriteria.getKeyword());
        assertEquals(3L, capturedCriteria.getStageId());
        assertEquals("OPEN", capturedCriteria.getStatus());
        assertEquals(new BigDecimal("50000000"), capturedCriteria.getMinAmount());
        assertEquals(new BigDecimal("200000000"), capturedCriteria.getMaxAmount());
        assertEquals("2026-10-19", capturedCriteria.getCloseDateFrom());
        assertEquals("2026-10-25", capturedCriteria.getCloseDateTo());
        assertEquals(7L, capturedCriteria.getProductId());
        assertEquals(2L, capturedCriteria.getOwnerId());
        assertEquals("MINE", capturedCriteria.getOwnerFilter());
        assertEquals(1, capturedCriteria.getPage());
        assertEquals(25, capturedCriteria.getSize());

        String json = sw.toString();
        assertTrue(json.contains("Cơ hội ERP Vinamilk"));
        assertTrue(json.contains("true"));
    }

    @Test
    @DisplayName("GET /api/opportunities: Lọc theo phím tắt thời gian tuần này (quickDate=THIS_WEEK)")
    void testFilterByQuickDateThisWeek() throws Exception {
        Map<String, String> params = new LinkedHashMap<>();
        params.put("quickDate", "THIS_WEEK");

        StringWriter sw = new StringWriter();
        int[] status = new int[]{200};
        HttpServletRequest req = createMockRequest(null, params, 1L);
        HttpServletResponse resp = createMockResponse(sw, status);

        servlet.service(req, resp);

        assertEquals(200, status[0]);
        assertNotNull(capturedCriteria);
        assertEquals("THIS_WEEK", capturedCriteria.getQuickDate());
        assertNotNull(capturedCriteria.getCloseDateFrom());
        assertNotNull(capturedCriteria.getCloseDateTo());
    }

    @Test
    @DisplayName("GET /api/opportunities: Từ chối nếu chưa đăng nhập")
    void testUnauthorizedRequest() throws Exception {
        StringWriter sw = new StringWriter();
        int[] status = new int[]{200};
        HttpServletRequest req = createMockRequest(null, Collections.emptyMap(), null);
        HttpServletResponse resp = createMockResponse(sw, status);

        servlet.service(req, resp);

        assertEquals(403, status[0]);
        assertTrue(sw.toString().contains("Phiên đăng nhập không hợp lệ"));
    }
}
