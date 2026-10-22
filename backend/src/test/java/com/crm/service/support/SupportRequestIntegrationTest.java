package com.crm.service.support;

import com.crm.config.DatabaseConfig;
import com.crm.dto.support.SupportRequestWrite;
import com.crm.controller.support.SupportRequestServlet;
import com.google.gson.JsonParser;
import jakarta.servlet.ServletRequest;
import jakarta.servlet.http.*;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.condition.EnabledIfEnvironmentVariable;
import java.io.*;
import java.lang.reflect.Proxy;
import java.nio.file.*;
import java.sql.*;
import java.time.*;
import java.util.*;
import java.util.concurrent.*;
import static org.junit.jupiter.api.Assertions.*;

/** Runs only against a deliberately created, disposable MySQL 8 test database. */
@EnabledIfEnvironmentVariable(named = "CRM_DB_URL", matches = "jdbc:mysql://(?:127\\.0\\.0\\.1|localhost):[0-9]+/crm_s5_59_test(?:\\?.*)?")
class SupportRequestIntegrationTest {
    private final SupportRequestService service = new SupportRequestService();

    @BeforeAll static void schema() throws Exception {
        String url = System.getenv("CRM_DB_URL");
        assertNotNull(url, "Set CRM_DB_URL to an isolated crm_s5_59_test database");
        assertTrue(url.matches("jdbc:mysql://(?:127\\.0\\.0\\.1|localhost):[0-9]+/crm_s5_59_test(?:\\?.*)?"),
                "Refusing any database other than local crm_s5_59_test");
        sql("CREATE TABLE IF NOT EXISTS users(id BIGINT PRIMARY KEY, team_id BIGINT NULL, status VARCHAR(20), full_name VARCHAR(100))");
        sql("CREATE TABLE IF NOT EXISTS teams(id BIGINT PRIMARY KEY, parent_id BIGINT NULL, active BOOLEAN)");
        sql("""
                CREATE TABLE IF NOT EXISTS customers(id BIGINT PRIMARY KEY, name VARCHAR(100), owner_user_id BIGINT,
                    is_deleted BOOLEAN DEFAULT FALSE, tax_code VARCHAR(50), status VARCHAR(50), email VARCHAR(255),
                    phone VARCHAR(50), website VARCHAR(255), address VARCHAR(500), industry_id BIGINT,
                    company_size_id BIGINT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP)
                """);
        sql("CREATE TABLE IF NOT EXISTS roles(id BIGINT PRIMARY KEY, code VARCHAR(50) UNIQUE)");
        sql("CREATE TABLE IF NOT EXISTS permissions(id BIGINT AUTO_INCREMENT PRIMARY KEY, code VARCHAR(100) UNIQUE, name VARCHAR(150))");
        sql("CREATE TABLE IF NOT EXISTS role_permissions(role_id BIGINT, permission_id BIGINT, PRIMARY KEY(role_id,permission_id))");
        sql("CREATE TABLE IF NOT EXISTS user_roles(user_id BIGINT, role_id BIGINT, PRIMARY KEY(user_id,role_id))");
        sql("CREATE TABLE IF NOT EXISTS role_module_scopes(role_id BIGINT, module_code VARCHAR(40), scope_type VARCHAR(10), PRIMARY KEY(role_id,module_code))");
        sql("INSERT IGNORE INTO roles VALUES(1,'ADMIN'),(2,'CUSTOMER_SUCCESS'),(3,'SALES_REP'),(4,'TEAM_LEAD')");
        sql("INSERT IGNORE INTO permissions(code,name) VALUES('customer.read','Read')");
        sql("INSERT IGNORE INTO role_permissions SELECT r.id,p.id FROM roles r CROSS JOIN permissions p WHERE p.code='customer.read'");
        sql("INSERT IGNORE INTO role_module_scopes VALUES(1,'customer','ALL'),(2,'customer','SELF'),(3,'customer','SELF'),(4,'customer','TEAM')");
        migrate();
        migrate(); // Migration must be safe to reapply, including permission seeds.
    }

    private static void migrate() throws Exception {
        String migration = Files.readString(Path.of("database/012_support_requests.sql")).replaceAll("(?m)^--.*$", "");
        for (String statement : migration.split(";")) if (!statement.isBlank()) sql(statement);
    }

    @BeforeEach void fixtures() throws Exception {
        sql("DELETE FROM support_requests"); sql("DELETE FROM customers"); sql("DELETE FROM user_roles");
        sql("DELETE FROM users"); sql("DELETE FROM teams");
        sql("INSERT INTO teams VALUES(10,NULL,TRUE),(11,10,TRUE),(20,NULL,TRUE)");
        sql("INSERT INTO users VALUES(1,NULL,'ACTIVE','Admin'),(2,11,'ACTIVE','CS A'),(3,20,'ACTIVE','CS B'),(4,11,'ACTIVE','Sales'),(5,10,'ACTIVE','Lead')");
        sql("INSERT INTO user_roles VALUES(1,1),(2,2),(3,2),(4,3),(5,4)");
        sql("INSERT INTO customers(id,name,owner_user_id,is_deleted) VALUES(101,'A',2,FALSE),(102,'B',3,FALSE),(103,'Deleted',2,TRUE),(104,'Sales',4,FALSE)");
    }

    @Test void urgentFlagClearsOnResolutionAndReturnsWhenReopened() throws Exception {
        var created = service.save(2, null, input(101, "URGENT", "OPEN", null));
        long id = (Long) created.get("id");
        assertEquals(List.of("URGENT_OPEN_REQUEST"), risk(101).get("reasons"));
        assertEquals(true, risk(101).get("atRisk"));
        var resolved = service.save(2, id, input(101, "URGENT", "RESOLVED", null));
        assertNotNull(resolved.get("resolvedAt"));
        assertEquals(false, risk(101).get("atRisk"));
        var closed = service.save(2, id, input(101, "URGENT", "CLOSED", null));
        assertEquals(resolved.get("resolvedAt"), closed.get("resolvedAt"));
        assertNull(service.save(2, id, input(101, "URGENT", "IN_PROGRESS", null)).get("resolvedAt"));
        assertEquals(true, risk(101).get("atRisk"));
    }

    @Test void thirdOpenRequestTriggersAndSoftDeleteClearsFlag() throws Exception {
        service.save(2, null, input(101, "NORMAL", "OPEN", null));
        service.save(2, null, input(101, "HIGH", "IN_PROGRESS", null));
        assertEquals(false, risk(101).get("atRisk"));
        long id = (Long) service.save(2, null, input(101, "LOW", "OPEN", null)).get("id");
        assertEquals(List.of("MULTIPLE_OPEN_REQUESTS"), risk(101).get("reasons"));
        service.delete(2, id);
        assertEquals(false, risk(101).get("atRisk"));
        assertEquals(2L, risk(101).get("openCount"));
        assertThrows(NoSuchElementException.class, () -> service.get(2, id));
        assertThrows(NoSuchElementException.class, () -> service.delete(2, id));
    }

    @Test void overdueIsAutomaticWithoutEditingRequest() throws Exception {
        String deadline = Instant.now().plusMillis(1500).toString();
        service.save(2, null, input(101, "NORMAL", "OPEN", deadline));
        assertEquals(false, risk(101).get("atRisk"));
        Thread.sleep(1700);
        assertEquals(List.of("OVERDUE_REQUEST"), risk(101).get("reasons"));
        assertEquals(true, risk(101).get("atRisk"));
    }

    @Test void filtersPaginationAndRiskReasonsWorkTogether() throws Exception {
        service.save(2, null, input(101, "URGENT", "OPEN", "2020-01-01T00:00:00Z"));
        service.save(2, null, input(101, "NORMAL", "OPEN", null));
        service.save(2, null, input(101, "NORMAL", "OPEN", null));
        assertEquals(List.of("URGENT_OPEN_REQUEST", "OVERDUE_REQUEST", "MULTIPLE_OPEN_REQUESTS"), risk(101).get("reasons"));
        assertEquals(1, service.search(2, 101L, "OPEN", "URGENT", 1, 20).size());
        assertEquals(1, service.search(2, 101L, null, null, 2, 2).size());
        assertEquals(1, service.risks(1, null, true, 1, 20).size());
        assertEquals(3, service.risks(1, null, false, 1, 20).size());
    }

    @Test void scopesProtectEveryRouteAndParentReference() throws Exception {
        long id = (Long) service.save(3, null, input(102, "URGENT", "OPEN", null)).get("id");
        assertThrows(NoSuchElementException.class, () -> service.get(2, id));
        assertThrows(NoSuchElementException.class, () -> service.save(2, id, input(102, "NORMAL", "OPEN", null)));
        assertThrows(NoSuchElementException.class, () -> service.delete(2, id));
        assertTrue(service.search(2, 102L, null, null, 1, 20).isEmpty());
        assertTrue(service.risks(2, null, true, 1, 20).isEmpty());
        assertThrows(NoSuchElementException.class, () -> service.risks(2, 102L, false, 1, 1));
        for (long customer : new long[]{102, 103, 999})
            assertThrows(NoSuchElementException.class, () -> service.save(2, null, input(customer, "NORMAL", "OPEN", null)));
        assertNotNull(service.get(1, id));
    }

    @Test void teamScopeIncludesDescendantsButNotOtherTeams() throws Exception {
        long ownTeam = (Long) service.save(2, null, input(101, "URGENT", "OPEN", null)).get("id");
        long outside = (Long) service.save(3, null, input(102, "URGENT", "OPEN", null)).get("id");
        assertNotNull(service.get(5, ownTeam));
        assertThrows(NoSuchElementException.class, () -> service.get(5, outside));
        assertEquals(1, service.risks(5, null, true, 1, 20).size());
    }

    @Test void readOnlyAndInactiveUsersCannotMutate() throws Exception {
        assertThrows(SecurityException.class, () -> service.save(4, null, input(104, "NORMAL", "OPEN", null)));
        sql("UPDATE users SET status='INACTIVE' WHERE id=2");
        assertThrows(SecurityException.class, () -> service.search(2, null, null, null, 1, 20));
    }

    @Test void ownershipTransferAndDeletedCustomerTakeEffect() throws Exception {
        long id = (Long) service.save(2, null, input(101, "URGENT", "OPEN", null)).get("id");
        sql("UPDATE customers SET owner_user_id=3 WHERE id=101");
        assertThrows(NoSuchElementException.class, () -> service.get(2, id));
        assertNotNull(service.get(3, id));
        sql("UPDATE customers SET is_deleted=TRUE WHERE id=101");
        assertThrows(NoSuchElementException.class, () -> service.get(1, id));
        assertThrows(NoSuchElementException.class, () -> service.save(1, id, input(101, "NORMAL", "OPEN", null)));
        assertTrue(service.risks(1, null, true, 1, 20).isEmpty());
    }

    @Test void customerCannotBeChangedAndRejectedWriteDoesNotModifyRequest() throws Exception {
        long id = (Long) service.save(1, null, input(101, "URGENT", "OPEN", null)).get("id");
        assertThrows(IllegalArgumentException.class, () -> service.save(1, id, input(102, "NORMAL", "OPEN", null)));
        assertEquals(101L, service.get(1, id).get("customerId"));
        assertEquals("URGENT", service.get(1, id).get("priority"));
    }

    @Test void concurrentCreatesProduceCorrectAggregate() throws Exception {
        try (var executor = Executors.newFixedThreadPool(3)) {
            var calls = new ArrayList<Callable<Map<String, Object>>>();
            for (int i = 0; i < 3; i++) calls.add(() -> service.save(2, null, input(101, "NORMAL", "OPEN", null)));
            for (var future : executor.invokeAll(calls)) assertNotNull(future.get());
        }
        assertEquals(3L, risk(101).get("openCount"));
        assertEquals(true, risk(101).get("atRisk"));
    }

    @Test void existingCustomerApiReceivesSameRiskFlag() throws Exception {
        service.save(2, null, input(101, "URGENT", "OPEN", null));
        var dao = new com.crm.dao.customers.CustomerDAO();
        var detail = dao.findById(101);
        var actual = (Map<?, ?>) detail.get("supportRisk");
        assertEquals(true, actual.get("atRisk"));
        assertEquals(risk(101).get("reasons"), actual.get("reasons"));
        var scope = new com.crm.service.permissions.DataScopeService().resolve(2, "customer", "read");
        var listed = dao.search(scope, null, null, 1, 20);
        assertEquals(1, listed.size());
        assertEquals(actual, listed.getFirst().get("supportRisk"));
    }

    @Test void servletLifecycleAndHttpErrorContract() throws Exception {
        assertEquals(401, http("GET", null, null, "").status());
        assertEquals(400, http("POST", null, 2L, "{\"customerId\":1.5}").status());
        assertEquals(400, http("POST", null, 2L, "[]").status());
        assertEquals(400, http("GET", "/1/extra", 2L, "").status());
        assertEquals(400, http("PUT", "/1", 2L, "null").status());
        String body = "{\"customerId\":101,\"subject\":\"Bảo hành\",\"priority\":\"URGENT\"}";
        assertEquals(403, http("POST", null, 4L, body).status());
        var created = http("POST", null, 2L, body);
        assertEquals(201, created.status(), created.body());
        long id = JsonParser.parseString(created.body()).getAsJsonObject().getAsJsonObject("data").get("id").getAsLong();
        assertEquals(200, http("GET", "/" + id, 2L, "").status());
        assertEquals(404, http("GET", "/" + id, 3L, "").status());
        assertEquals(200, http("GET", "/risks", 2L, "").status());
        var risk = http("GET", "/risks/101", 2L, "");
        assertEquals(200, risk.status());
        assertTrue(JsonParser.parseString(risk.body()).getAsJsonObject().getAsJsonObject("data").get("atRisk").getAsBoolean());
        assertEquals(200, http("PUT", "/" + id, 2L, body).status());
        assertEquals(200, http("DELETE", "/" + id, 2L, "").status());
        assertEquals(404, http("GET", "/" + id, 2L, "").status());
    }

    private record HttpResult(int status, String body) { }
    private static HttpResult http(String method, String path, Long actor, String body) throws Exception {
        int[] status = {200};
        StringWriter out = new StringWriter();
        HttpSession session = proxy(HttpSession.class, (p, m, a) -> m.getName().equals("getAttribute") ? actor : null);
        HttpServletRequest req = proxy(HttpServletRequest.class, (p, m, a) -> switch (m.getName()) {
            case "getSession" -> actor == null ? null : session;
            case "getMethod" -> method;
            case "getPathInfo" -> path;
            case "getReader" -> new BufferedReader(new StringReader(body));
            default -> null;
        });
        HttpServletResponse res = proxy(HttpServletResponse.class, (p, m, a) -> {
            if (m.getName().equals("setStatus")) status[0] = (Integer) a[0];
            if (m.getName().equals("getWriter")) return new PrintWriter(out);
            return null;
        });
        new SupportRequestServlet().service((ServletRequest) req, res);
        return new HttpResult(status[0], out.toString());
    }
    private static <T> T proxy(Class<T> type, java.lang.reflect.InvocationHandler handler) {
        return type.cast(Proxy.newProxyInstance(type.getClassLoader(), new Class<?>[]{type}, handler));
    }

    private Map<String, Object> risk(long customer) throws SQLException { return service.risks(1, customer, false, 1, 1).getFirst(); }
    private SupportRequestWrite input(long customer, String priority, String status, String dueAt) {
        return new SupportRequestWrite(customer, "Hỗ trợ sau bán", "Chi tiết", priority, status, dueAt,
                Set.of("RESOLVED", "CLOSED").contains(status) ? "Đã xử lý" : null);
    }
    private static void sql(String sql) throws SQLException {
        try (Connection c = DatabaseConfig.getConnection(); Statement s = c.createStatement()) { s.execute(sql); }
    }
}
