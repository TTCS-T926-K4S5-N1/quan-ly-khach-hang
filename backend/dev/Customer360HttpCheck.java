import com.crm.config.DatabaseConfig;
import com.crm.util.JsonUtil;
import com.crm.util.PasswordUtil;
import com.google.gson.JsonObject;
import java.net.*;
import java.net.http.*;
import java.nio.file.*;
import java.sql.*;
import java.time.Duration;
import java.util.*;

/** Run only against a disposable crm_sprint1_test database and its local Tomcat. */
public class Customer360HttpCheck {
    static final List<Long> users = new ArrayList<>();
    static boolean customerCreated;
    static long product;
    static final String base = "http://127.0.0.1:8080/crm";

    public static void main(String[] args) throws Exception {
        String url = System.getenv("CRM_DB_URL");
        if (url == null) throw new IllegalStateException("CRM_DB_URL is required");
        URI db = URI.create(url.substring(5));
        if (!"/crm_sprint1_test".equals(db.getPath()) || !"127.0.0.1".equals(db.getHost()))
            throw new IllegalStateException("Only the isolated local test database is allowed");
        String password = UUID.randomUUID() + "aA!9";
        String email = UUID.randomUUID() + "@example.invalid";
        Map<String, Object> report = new LinkedHashMap<>();
        try {
            long owner = user(email, password, true);
            String outsideEmail = UUID.randomUUID() + "@example.invalid";
            user(outsideEmail, password, true);
            String deniedEmail = UUID.randomUUID() + "@example.invalid";
            user(deniedEmail, password, false);
            // A collision fails before any existing customer's data is touched.
            execute("INSERT INTO customers(id,name,owner_user_id) VALUES (12,'Công ty kiểm thử Việt Nam',?)", owner);
            customerCreated = true;
            execute("INSERT INTO opportunities(customer_id,name,amount,status,owner_user_id) VALUES (12,'Open',125.25,'OPEN',?)", owner);
            execute("INSERT INTO opportunities(customer_id,name,amount,status,owner_user_id) VALUES (12,'Unsigned WON',999.99,'WON',?)", owner);
            execute("INSERT INTO customer_360_contracts(customer_id,amount,status) VALUES (12,50.75,'SIGNED'),(12,800,'DRAFT')");
            execute("INSERT INTO contacts(customer_id,name,owner_user_id) VALUES (12,'Nguyễn Văn An',?)", owner);
            execute("INSERT INTO attachments(customer_id,name,file_url,uploaded_by_user_id) VALUES (12,'Tài liệu.pdf','/fixture.pdf',?)", owner);
            try (Connection c = DatabaseConfig.getConnection(); PreparedStatement s = c.prepareStatement(
                    "INSERT INTO activities(customer_id,owner_user_id,subject,created_at) VALUES (12,?,'Hoạt động kiểm thử','2026-01-01 00:00:00')")) {
                for (int i=0;i<505;i++) { s.setLong(1,owner); s.addBatch(); }
                s.executeBatch();
            }
            HttpClient client = client();
            check(get(client,"/api/customers/12/360").statusCode()==401,"unauthenticated status");
            login(client,email,password);
            check(get(client,"/api/customers/0/360").statusCode()==400,"invalid status");
            check(get(client,"/api/customers/9223372036854775807/360").statusCode()==404,"missing status");
            HttpClient outside = client(); login(outside,outsideEmail,password);
            check(get(outside,"/api/customers/12/360").statusCode()==403,"data scope status");
            HttpClient denied = client(); login(denied,deniedEmail,password);
            check(get(denied,"/api/customers/12/360").statusCode()==403,"permission status");
            List<Double> httpMs = new ArrayList<>();
            List<Long> dbMs = new ArrayList<>();
            for (int sample=0;sample<11;sample++) {
                long start=System.nanoTime();
                var response=get(client,"/api/customers/12/360");
                double elapsed=(System.nanoTime()-start)/1_000_000.0;
                check(response.statusCode()==200,"aggregate HTTP status");
                JsonObject data=JsonUtil.getGson().fromJson(response.body(),JsonObject.class).getAsJsonObject("data");
                check(data.getAsJsonArray("activities").size()==500,"activity cap");
                long previous=Long.MAX_VALUE;
                for (var row : data.getAsJsonArray("activities")) {
                    long id=row.getAsJsonObject().get("id").getAsLong();
                    check(id<previous,"timeline order"); previous=id;
                }
                check(data.getAsJsonObject("customer").get("name").getAsString().equals("Công ty kiểm thử Việt Nam"),"Unicode");
                var kpis=data.getAsJsonObject("kpis");
                check(kpis.get("totalSignedAmount").getAsBigDecimal().equals(new java.math.BigDecimal("50.75")),"signed KPI");
                check(kpis.get("totalWonAmount").getAsBigDecimal().equals(new java.math.BigDecimal("999.99")),"won KPI");
                check(kpis.get("openPipelineAmount").getAsBigDecimal().equals(new java.math.BigDecimal("125.25")),"pipeline KPI");
                check(data.getAsJsonArray("contacts").size()==1 && data.getAsJsonArray("attachments").size()==1,"related data");
                check(elapsed<1500,"HTTP benchmark exceeded 1500 ms");
                httpMs.add(elapsed); dbMs.add(data.getAsJsonObject("performance").get("executionTimeMs").getAsLong());
            }
            for (String path : List.of("/api/customers/12","/api/customers","/api/activities?customerId=12","/api/opportunities?customerId=12","/api/quotes?customerId=12")) {
                check(get(client,path).statusCode()==200,"regression: "+path);
            }
            product=insert("INSERT INTO products(code,name,type,list_price,floor_price,cost_price) VALUES (?,'Fixture','ONE_TIME',100,50,20)",UUID.randomUUID().toString());
            var createdQuote=post(client,"/api/quotes",Map.of("title","Báo giá kiểm thử","customerId",12,
                    "items",List.of(Map.of("productId",product,"quantity",2,"unitPrice",100))));
            check(createdQuote.statusCode()==201,"quote creation with typed JSON items");
            var quote=JsonUtil.getGson().fromJson(createdQuote.body(),JsonObject.class).getAsJsonObject("data");
            check(quote.get("totalAmount").getAsBigDecimal().compareTo(new java.math.BigDecimal("200"))==0,"quote amount unchanged");
            check(post(client,"/api/quotes/"+quote.get("id").getAsLong()+"/status",Map.of("status","SENT")).statusCode()==200,"quote status update");
            check(post(client,"/api/quotes",Map.of("items",List.of("invalid"))).statusCode()==400,"malformed quote items");
            // Fault injection is confined to the explicitly guarded disposable database.
            execute("RENAME TABLE customer_360_contracts TO s554_contracts_unavailable");
            try {
                var failed = get(client,"/api/customers/12/360");
                check(failed.statusCode()==500,"SQL error must not return an empty success");
                check(!failed.body().contains("customer_360_contracts") && !failed.body().contains("SQLException"),"safe SQL error response");
            } finally {
                execute("RENAME TABLE s554_contracts_unavailable TO customer_360_contracts");
            }
            report.put("status","PASSED"); report.put("fixtureActivities",505); report.put("returnedActivities",500);
            report.put("httpMs",httpMs); report.put("aggregateDaoMs",dbMs);
            report.put("httpMaxMs",Collections.max(httpMs));
            report.put("httpStatusesVerified",List.of(200,400,401,403,404,500));
            report.put("sql500","HTTP verified with a temporarily unavailable test table, restored in finally");
            Files.writeString(Path.of("target/customer-360-http-results.json"),JsonUtil.getGson().toJson(report));
            System.out.println(JsonUtil.getGson().toJson(report));
        } finally {
            if (customerCreated) {
                for (String table : List.of("quotes","activities","opportunities","contacts","attachments","customer_360_contracts")) execute("DELETE FROM "+table+" WHERE customer_id=12");
                execute("DELETE FROM customers WHERE id=12");
            }
            if(product!=0) execute("DELETE FROM products WHERE id=?",product);
            for (long user : users) {
                execute("DELETE FROM audit_logs WHERE user_id=?",user);
                execute("DELETE FROM users WHERE id=?",user);
            }
        }
    }

    static HttpClient client() { return HttpClient.newBuilder().cookieHandler(new CookieManager(null,CookiePolicy.ACCEPT_ALL)).connectTimeout(Duration.ofSeconds(5)).build(); }
    static HttpResponse<String> get(HttpClient client,String path) throws Exception {
        return client.send(HttpRequest.newBuilder(URI.create(base+path)).timeout(Duration.ofSeconds(10)).GET().build(),HttpResponse.BodyHandlers.ofString());
    }
    static void login(HttpClient client,String email,String password) throws Exception {
        var request=HttpRequest.newBuilder(URI.create(base+"/api/auth/login")).header("Content-Type","application/json")
                .POST(HttpRequest.BodyPublishers.ofString(JsonUtil.getGson().toJson(Map.of("email",email,"password",password)))).build();
        check(client.send(request,HttpResponse.BodyHandlers.discarding()).statusCode()==200,"login");
    }
    static HttpResponse<String> post(HttpClient client,String path,Object body) throws Exception {
        return client.send(HttpRequest.newBuilder(URI.create(base+path)).header("Content-Type","application/json")
                .POST(HttpRequest.BodyPublishers.ofString(JsonUtil.getGson().toJson(body))).build(),HttpResponse.BodyHandlers.ofString());
    }
    static long insert(String sql,Object... values) throws Exception {
        try(Connection c=DatabaseConfig.getConnection();PreparedStatement s=c.prepareStatement(sql,Statement.RETURN_GENERATED_KEYS)) {
            for(int i=0;i<values.length;i++) s.setObject(i+1,values[i]); s.executeUpdate();
            try(ResultSet rs=s.getGeneratedKeys()) { rs.next(); return rs.getLong(1); }
        }
    }
    static long user(String email,String password,boolean permission) throws Exception {
        long id;
        try (Connection c=DatabaseConfig.getConnection(); PreparedStatement s=c.prepareStatement(
                "INSERT INTO users(full_name,email,password_hash,status) VALUES ('S554 HTTP fixture',?,?,'ACTIVE')",Statement.RETURN_GENERATED_KEYS)) {
            s.setString(1,email); s.setString(2,PasswordUtil.hash(password)); s.executeUpdate();
            try(ResultSet rs=s.getGeneratedKeys()) { rs.next(); id=rs.getLong(1); users.add(id); }
        }
        if(permission) execute("INSERT INTO user_roles(user_id,role_id) SELECT ?,id FROM roles WHERE code='SALES_REP'",id);
        return id;
    }
    static void execute(String sql,Object... values) throws Exception {
        try(Connection c=DatabaseConfig.getConnection();PreparedStatement s=c.prepareStatement(sql)) {
            for(int i=0;i<values.length;i++) s.setObject(i+1,values[i]); s.executeUpdate();
        }
    }
    static void check(boolean condition,String message) { if(!condition) throw new AssertionError(message); }
}
