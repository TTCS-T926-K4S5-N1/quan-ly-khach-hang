package com.crm.controller.customers;

import com.crm.config.DatabaseConfig;
import com.crm.service.customers.CustomerService;
import com.crm.util.JsonUtil;
import com.google.gson.JsonObject;
import org.junit.jupiter.api.*;
import java.sql.*;
import java.util.*;
import static org.junit.jupiter.api.Assertions.*;

class Customer360IntegrationTest {
    private long owner, outsider, noPermission, customer;
    private final List<Long> users = new ArrayList<>();

    @BeforeEach void setup() throws Exception {
        String url = System.getenv("CRM_DB_URL");
        assertNotNull(url, "An isolated crm_sprint1_test database is required");
        assertEquals("/crm_sprint1_test", java.net.URI.create(url.substring(5)).getPath());
        owner = user(true); outsider = user(true); noPermission = user(false);
        customer = insert("INSERT INTO customers(name,owner_user_id) VALUES (?,?)", "Công ty kiểm thử Việt Nam", owner);
    }

    @AfterEach void cleanup() throws Exception {
        if (customer != 0) {
            for (String table : List.of("activities", "opportunities", "contacts", "attachments", "customer_360_contracts")) {
                execute("DELETE FROM " + table + " WHERE customer_id=?", customer);
            }
            execute("DELETE FROM customers WHERE id=?", customer);
        }
        for (long id : users) execute("DELETE FROM users WHERE id=?", id);
    }

    @Test void emptyCollectionsUnicodeAndMissingCustomer() throws Exception {
        JsonObject data = response(customer, owner, 200);
        for (String key : List.of("customer", "contacts", "opportunities", "activities", "attachments", "kpis")) assertTrue(data.has(key));
        assertEquals("Công ty kiểm thử Việt Nam", data.getAsJsonObject("customer").get("name").getAsString());
        for (String key : List.of("contacts", "activities", "attachments")) assertEquals(0, data.getAsJsonArray(key).size());
        assertEquals(0, data.getAsJsonObject("opportunities").getAsJsonArray("all").size());
        assertEquals(0, data.getAsJsonObject("kpis").get("totalSignedAmount").getAsBigDecimal().signum());
        assertEquals(0, data.getAsJsonObject("kpis").get("openPipelineAmount").getAsBigDecimal().signum());
        response(Long.MAX_VALUE, owner, 404);
    }

    @Test void scopeAndPermissionAreEnforced() throws Exception {
        response(customer, outsider, 403);
        response(customer, noPermission, 403);
        response(customer, null, 401);
    }

    @Test void fullAggregateSeparatesSignedContractsFromWonOpportunities() throws Exception {
        insert("INSERT INTO opportunities(customer_id,name,amount,status,owner_user_id) VALUES (?, 'Open', 125.25, 'OPEN', ?)", customer, owner);
        insert("INSERT INTO opportunities(customer_id,name,amount,status,owner_user_id) VALUES (?, 'Won but unsigned', 999.99, 'WON', ?)", customer, owner);
        insert("INSERT INTO opportunities(customer_id,name,amount,status,owner_user_id,is_deleted) VALUES (?, 'Deleted', 9000, 'OPEN', ?,1)", customer, owner);
        insert("INSERT INTO customer_360_contracts(customer_id,amount,status) VALUES (?,30.50,'SIGNED')", customer);
        insert("INSERT INTO customer_360_contracts(customer_id,amount,status) VALUES (?,20.25,'SIGNED')", customer);
        insert("INSERT INTO customer_360_contracts(customer_id,amount,status) VALUES (?,800,'DRAFT')", customer);
        long contact = insert("INSERT INTO contacts(customer_id,name,owner_user_id) VALUES (?, 'Nguyễn Văn An', ?)", customer, owner);
        insert("INSERT INTO contact_company_history(contact_id,customer_id,job_title) VALUES (?,?,'Giám đốc')", contact, customer);
        insert("INSERT INTO attachments(customer_id,name,file_url,uploaded_by_user_id) VALUES (?, 'Tài liệu.pdf', '/fixture.pdf', ?)", customer, owner);
        activities(1);
        JsonObject data = response(customer, owner, 200);
        JsonObject kpis = data.getAsJsonObject("kpis");
        assertEquals(new java.math.BigDecimal("50.75"), kpis.get("totalSignedAmount").getAsBigDecimal());
        assertEquals(new java.math.BigDecimal("999.99"), kpis.get("totalWonAmount").getAsBigDecimal());
        assertEquals(new java.math.BigDecimal("125.25"), kpis.get("openPipelineAmount").getAsBigDecimal());
        assertEquals(2, kpis.get("signedContractsCount").getAsInt());
        assertEquals(1, data.getAsJsonObject("opportunities").getAsJsonArray("open").size());
        assertEquals(1, data.getAsJsonObject("opportunities").getAsJsonArray("closed").size());
        assertEquals(1, data.getAsJsonArray("contacts").get(0).getAsJsonObject().getAsJsonArray("companyHistory").size());
        assertEquals(1, data.getAsJsonArray("attachments").size());
        assertEquals(1, data.getAsJsonArray("activities").size());
    }

    @Test void wonOpportunityWithoutSignedContractDoesNotIncreaseSignedKpi() throws Exception {
        insert("INSERT INTO opportunities(customer_id,name,amount,status,owner_user_id) VALUES (?,'Unsigned win',1000,'WON',?)", customer, owner);
        assertEquals(0, response(customer, owner, 200).getAsJsonObject("kpis").get("totalSignedAmount").getAsBigDecimal().signum());
    }

    @Test void customerMergePreservesSignedContractKpi() throws Exception {
        long duplicate = insert("INSERT INTO customers(name,owner_user_id) VALUES ('Duplicate fixture',?)", owner);
        try {
            insert("INSERT INTO customer_360_contracts(customer_id,amount,status) VALUES (?,55,'SIGNED')", duplicate);
            new com.crm.dao.customers.CustomerMergeDAO().mergeCustomers(customer,duplicate,Map.of(),owner,"Fixture");
            assertEquals(new java.math.BigDecimal("55.00"),response(customer,owner,200)
                    .getAsJsonObject("kpis").get("totalSignedAmount").getAsBigDecimal());
        } finally {
            execute("DELETE FROM customer_360_contracts WHERE customer_id=?",duplicate);
            execute("DELETE FROM customers WHERE id=?",duplicate);
        }
    }

    @Test void fiveHundredActivitiesHaveDeterministicOrderAndLimit() throws Exception {
        activities(500);
        JsonObject first = response(customer, owner, 200);
        assertEquals(500, first.getAsJsonArray("activities").size());
        activities(5);
        long start = System.nanoTime();
        JsonObject data = response(customer, owner, 200);
        long serviceMs = (System.nanoTime() - start) / 1_000_000;
        var rows = data.getAsJsonArray("activities");
        assertEquals(500, rows.size());
        long previous = Long.MAX_VALUE;
        for (var row : rows) {
            long id = row.getAsJsonObject().get("id").getAsLong();
            assertTrue(id < previous, "Equal timestamps must sort by descending id");
            previous = id;
        }
        System.out.println("S5-54 service+serialization: " + serviceMs + " ms; database rows=505; returned=500");
        assertEquals("NOT_MEASURED_HTTP", data.getAsJsonObject("performance").get("benchmarkStatus").getAsString());
        try (Connection c = DatabaseConfig.getConnection(); PreparedStatement s = c.prepareStatement(
                """
                EXPLAIN SELECT a.id,a.type,a.subject,a.description,a.status,a.due_date,a.created_at,u.full_name
                FROM activities a LEFT JOIN users u ON u.id=a.owner_user_id
                WHERE a.customer_id=? AND a.is_deleted=0 ORDER BY a.created_at DESC,a.id DESC LIMIT 500
                """)) {
            s.setLong(1, customer);
            try (ResultSet rs = s.executeQuery()) {
                assertTrue(rs.next());
                // MySQL may prefer a scan when this fixture occupies the whole small table.
                // Record the real plan; correctness and HTTP latency are the acceptance gates.
                do {
                    System.out.println("S5-54 EXPLAIN: table=" + rs.getString("table")
                            + "; possible_keys=" + rs.getString("possible_keys")
                            + "; key=" + rs.getString("key") + "; rows=" + rs.getString("rows")
                            + "; extra=" + rs.getString("Extra"));
                } while (rs.next());
            }
        }
    }

    private JsonObject response(long id, Long user, int expected) throws Exception {
        var result = CustomerServletTest.request(new CustomerService(), "/" + id + "/360", user);
        assertEquals(expected, result.status(), result.body());
        var json = JsonUtil.getGson().fromJson(result.body(), JsonObject.class);
        return expected == 200 ? json.getAsJsonObject("data") : json;
    }

    private long user(boolean permission) throws Exception {
        long id = insert("INSERT INTO users(full_name,email,password_hash,status) VALUES ('S554 fixture',?,'not-a-login-hash','ACTIVE')",
                UUID.randomUUID() + "@example.invalid");
        users.add(id);
        if (permission) execute("INSERT INTO user_roles(user_id,role_id) SELECT ?,id FROM roles WHERE code='SALES_REP'", id);
        return id;
    }

    private void activities(int count) throws Exception {
        try (Connection c = DatabaseConfig.getConnection(); PreparedStatement s = c.prepareStatement(
                "INSERT INTO activities(customer_id,owner_user_id,subject,created_at) VALUES (?,?,'Hoạt động kiểm thử','2026-01-01 00:00:00')")) {
            for (int i=0; i<count; i++) { s.setLong(1,customer); s.setLong(2,owner); s.addBatch(); }
            s.executeBatch();
        }
    }

    private long insert(String sql, Object... values) throws Exception {
        try (Connection c = DatabaseConfig.getConnection(); PreparedStatement s = c.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS)) {
            for (int i=0;i<values.length;i++) s.setObject(i+1,values[i]);
            s.executeUpdate();
            try (ResultSet rs = s.getGeneratedKeys()) { assertTrue(rs.next()); return rs.getLong(1); }
        }
    }

    private void execute(String sql, Object... values) throws Exception {
        try (Connection c = DatabaseConfig.getConnection(); PreparedStatement s = c.prepareStatement(sql)) {
            for (int i=0;i<values.length;i++) s.setObject(i+1,values[i]);
            s.executeUpdate();
        }
    }
}
