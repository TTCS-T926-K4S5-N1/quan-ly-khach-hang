package com.crm.controller.customers;

import com.crm.service.customers.CustomerService;
import com.crm.util.JsonUtil;
import jakarta.servlet.http.*;
import org.junit.jupiter.api.Test;
import java.io.PrintWriter;
import java.io.StringWriter;
import java.lang.reflect.Proxy;
import java.sql.SQLException;
import java.util.Map;
import static org.junit.jupiter.api.Assertions.*;

class CustomerServletTest {
    record Result(int status, String body) {}

    static Result request(CustomerService service, String path, Long user) throws Exception {
        StringWriter body = new StringWriter();
        int[] status = {200};
        HttpSession session = (HttpSession) Proxy.newProxyInstance(CustomerServletTest.class.getClassLoader(),
                new Class<?>[]{HttpSession.class}, (p, m, a) -> m.getName().equals("getAttribute") ? user : null);
        HttpServletRequest request = (HttpServletRequest) Proxy.newProxyInstance(CustomerServletTest.class.getClassLoader(),
                new Class<?>[]{HttpServletRequest.class}, (p, m, a) -> switch (m.getName()) {
                    case "getPathInfo" -> path;
                    case "getSession" -> user == null ? null : session;
                    default -> null;
                });
        HttpServletResponse response = (HttpServletResponse) Proxy.newProxyInstance(CustomerServletTest.class.getClassLoader(),
                new Class<?>[]{HttpServletResponse.class}, (p, m, a) -> {
                    if (m.getName().equals("setStatus")) status[0] = (Integer) a[0];
                    if (m.getName().equals("getWriter")) return new PrintWriter(body);
                    return null;
                });
        new CustomerServlet(service).doGet(request, response);
        return new Result(status[0], body.toString());
    }

    @Test void unauthorizedAndInvalidPathsNeverReadData() throws Exception {
        var service = new CustomerService() {
            @Override public Map<String, Object> getCustomer360(long user, long id) { fail("Unexpected read"); return null; }
        };
        assertEquals(401, request(service, "/12/360", null).status());
        for (String path : new String[]{"/0/360", "/-1/360", "/x/360", "/12/extra/360", "/999999999999999999999/360"}) {
            assertEquals(400, request(service, path, 1L).status(), path);
        }
    }

    @Test void mapsMissingForbiddenAndSqlErrors() throws Exception {
        var service = new CustomerService() {
            @Override public Map<String, Object> getCustomer360(long user, long id) throws Exception {
                if (id == 2) throw new SecurityException("Forbidden");
                if (id == 3) throw new SQLException("private SQL diagnostic");
                return null;
            }
        };
        assertEquals(404, request(service, "/1/360", 1L).status());
        assertEquals(403, request(service, "/2/360", 1L).status());
        Result error = request(service, "/3/360", 1L);
        assertEquals(500, error.status());
        assertFalse(error.body().contains("private SQL"));
    }

    @Test void returnsAggregateAndPreservesBasicCustomerRoute() throws Exception {
        var service = new CustomerService() {
            @Override public Map<String, Object> getCustomer360(long user, long id) { return Map.of("customer", Map.of("name", "Tiếng Việt")); }
            @Override public Map<String, Object> getById(long user, long id) { return Map.of("id", id); }
        };
        assertEquals(200, request(service, "/12/360", 1L).status());
        assertTrue(request(service, "/12/360", 1L).body().contains("Tiếng Việt"));
        assertEquals(12, JsonUtil.getGson().fromJson(request(service, "/12", 1L).body(),
                com.google.gson.JsonObject.class).getAsJsonObject("data").get("id").getAsInt());
    }
}
