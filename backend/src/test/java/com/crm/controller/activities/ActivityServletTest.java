package com.crm.controller.activities;

import com.crm.service.activities.ActivityService;
import com.crm.util.JsonUtil;
import com.google.gson.JsonArray;
import com.google.gson.JsonObject;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import org.junit.jupiter.api.Test;

import java.io.PrintWriter;
import java.io.StringWriter;
import java.lang.reflect.Proxy;
import java.sql.Timestamp;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;

class ActivityServletTest {

    record Result(int status, String body) {}

    static Result request(ActivityService service, String path, Long user, Map<String, String> params) throws Exception {
        StringWriter body = new StringWriter();
        int[] status = {200};

        HttpSession session = (HttpSession) Proxy.newProxyInstance(
                ActivityServletTest.class.getClassLoader(),
                new Class<?>[]{HttpSession.class},
                (p, m, a) -> m.getName().equals("getAttribute") && "userId".equals(a[0]) ? user : null
        );

        HttpServletRequest request = (HttpServletRequest) Proxy.newProxyInstance(
                ActivityServletTest.class.getClassLoader(),
                new Class<?>[]{HttpServletRequest.class},
                (p, m, a) -> switch (m.getName()) {
                    case "getPathInfo" -> path;
                    case "getSession" -> user == null ? null : session;
                    case "getParameter" -> params != null ? params.get(a[0]) : null;
                    default -> null;
                }
        );

        HttpServletResponse response = (HttpServletResponse) Proxy.newProxyInstance(
                ActivityServletTest.class.getClassLoader(),
                new Class<?>[]{HttpServletResponse.class},
                (p, m, a) -> {
                    if (m.getName().equals("setStatus")) status[0] = (Integer) a[0];
                    if (m.getName().equals("getWriter")) return new PrintWriter(body);
                    return null;
                }
        );

        new ActivityServlet(service).doGet(request, response);
        return new Result(status[0], body.toString());
    }

    @Test
    void unauthenticatedRequestReturns403() throws Exception {
        var service = new ActivityService();
        Result res = request(service, "/", null, Map.of());
        assertEquals(403, res.status());
        assertTrue(res.body().contains("Phiên đăng nhập không hợp lệ"));
    }

    @Test
    void filterActivitiesByTypeAndOwnerAndDate() throws Exception {
        List<Object> capturedArgs = new ArrayList<>();
        var service = new ActivityService() {
            @Override
            public List<Map<String, Object>> search(
                    long currentUserId, Long customerId, Long opportunityId, String type,
                    String status, Long ownerId, Timestamp fromDate, Timestamp toDate, String keyword
            ) {
                capturedArgs.add(currentUserId);
                capturedArgs.add(type);
                capturedArgs.add(ownerId);
                capturedArgs.add(fromDate);
                capturedArgs.add(toDate);
                return List.of(
                        Map.of("id", 101L, "subject", "Cuộc gọi định kỳ", "type", "CALL", "ownerUserId", ownerId)
                );
            }
        };

        Map<String, String> params = Map.of(
                "type", "CALL",
                "ownerId", "5",
                "fromDate", "2026-10-01",
                "toDate", "2026-10-20"
        );

        Result res = request(service, "/", 2L, params);
        assertEquals(200, res.status());
        assertEquals(2L, capturedArgs.get(0));
        assertEquals("CALL", capturedArgs.get(1));
        assertEquals(5L, capturedArgs.get(2));
        assertNotNull(capturedArgs.get(3));
        assertNotNull(capturedArgs.get(4));

        JsonObject json = JsonUtil.getGson().fromJson(res.body(), JsonObject.class);
        assertTrue(json.get("success").getAsBoolean());
        JsonArray data = json.getAsJsonArray("data");
        assertEquals(1, data.size());
        assertEquals("Cuộc gọi định kỳ", data.get(0).getAsJsonObject().get("subject").getAsString());
    }

    @Test
    void getMembersReturnsAccessibleMembers() throws Exception {
        var service = new ActivityService() {
            @Override
            public List<Map<String, Object>> getAccessibleMembers(long currentUserId) {
                return List.of(
                        Map.of("id", 4L, "fullName", "Nguyễn Thu Trang", "teamName", "Team Sales 1"),
                        Map.of("id", 5L, "fullName", "Đỗ Mạnh Cường", "teamName", "Team Sales 1")
                );
            }
        };

        Result res = request(service, "/members", 2L, Map.of());
        assertEquals(200, res.status());
        JsonObject json = JsonUtil.getGson().fromJson(res.body(), JsonObject.class);
        assertTrue(json.get("success").getAsBoolean());
        JsonArray data = json.getAsJsonArray("data");
        assertEquals(2, data.size());
        assertEquals("Nguyễn Thu Trang", data.get(0).getAsJsonObject().get("fullName").getAsString());
    }

    @Test
    void getMemberSummaryReturnsAggregateData() throws Exception {
        var service = new ActivityService() {
            @Override
            public List<Map<String, Object>> getMemberSummary(
                    long currentUserId, Long ownerId, String type, String status,
                    Timestamp fromDate, Timestamp toDate, Long customerId, Long opportunityId
            ) {
                return List.of(
                        Map.of(
                                "userId", 4L,
                                "fullName", "Nguyễn Thu Trang",
                                "totalActivities", 15L,
                                "callCount", 7L,
                                "emailCount", 4L,
                                "meetingCount", 2L,
                                "taskCount", 2L,
                                "completedCount", 12L
                        ),
                        Map.of(
                                "userId", 5L,
                                "fullName", "Đỗ Mạnh Cường",
                                "totalActivities", 8L,
                                "callCount", 3L,
                                "emailCount", 2L,
                                "meetingCount", 1L,
                                "taskCount", 2L,
                                "completedCount", 5L
                        )
                );
            }
        };

        Result res = request(service, "/summary-by-member", 2L, Map.of("type", "CALL"));
        assertEquals(200, res.status());
        JsonObject json = JsonUtil.getGson().fromJson(res.body(), JsonObject.class);
        assertTrue(json.get("success").getAsBoolean());
        JsonArray data = json.getAsJsonArray("data");
        assertEquals(2, data.size());
        assertEquals(15L, data.get(0).getAsJsonObject().get("totalActivities").getAsLong());

        // Also test ?summary=true on root route
        Result resRoot = request(service, "/", 2L, Map.of("summary", "true"));
        assertEquals(200, resRoot.status());
        JsonObject jsonRoot = JsonUtil.getGson().fromJson(resRoot.body(), JsonObject.class);
        assertTrue(jsonRoot.get("success").getAsBoolean());
        assertEquals(2, jsonRoot.getAsJsonArray("data").size());
    }

    @Test
    void forbiddenAccessThrows403() throws Exception {
        var service = new ActivityService() {
            @Override
            public List<Map<String, Object>> search(
                    long currentUserId, Long customerId, Long opportunityId, String type,
                    String status, Long ownerId, Timestamp fromDate, Timestamp toDate, String keyword
            ) {
                throw new SecurityException("Bạn không có quyền truy cập hoạt động của thành viên này.");
            }
        };

        Result res = request(service, "/", 2L, Map.of("ownerId", "999"));
        assertEquals(403, res.status());
        assertTrue(res.body().contains("Bạn không có quyền truy cập"));
    }
}
