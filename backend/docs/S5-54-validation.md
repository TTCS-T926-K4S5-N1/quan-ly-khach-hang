# S5-54 validation — 2026-10-09 (Asia/Saigon)

## Outcome and scope

Validated on Java 21, Maven 3.9.16, isolated MySQL 8.0.46 at loopback port 33354 (`crm_sprint1_test`), and Apache Tomcat 10.1.20 on loopback port 8080. No changes or seeds were applied to the existing `crm_db` server on port 3306.

Used `origin/develop` at `4b8a653` as the base. Its CustomerServlet → CustomerService → Customer360DAO implementation is canonical. The alternate local Customer360Servlet/Customer360Service and all original local edits/untracked files remain preserved in the stash named `S5-54 preserved original local work before develop sync`. They were not blindly reapplied over develop's implementation. The existing contract-table design was retained; duplicate contact/attachment tables and alternate endpoints were not introduced.

## Acceptance criteria

| Criterion | Result | Evidence |
|---|---|---|
| Complete customer profile, contacts, grouped opportunities, activities, attachments, KPIs | PASS | MySQL integration test and HTTP fixture for customer 12; existing frontend keys preserved |
| Missing customer | PASS | HTTP 404 |
| No login | PASS | HTTP 401 through Tomcat filters; servlet unit test |
| No permission / outside data scope | PASS | Both HTTP 403 cases and real role/scope integration tests |
| Invalid id | PASS | HTTP 400 and malformed/overflow id unit cases |
| Empty related collections | PASS | Integration test checks all four empty arrays plus empty opportunities and zero KPIs |
| OPEN pipeline | PASS | 125.25 fixture amount; deleted opportunity excluded in integration test |
| SIGNED contracts | PASS | 50.75 signed value, draft 800 excluded |
| WON without signed contract | PASS | Separate WON value 999.99; zero signed KPI tested with only a WON opportunity |
| Exactly 500 activities | PASS | Integration test |
| More than 500 activities | PASS | 505 persisted, 500 returned, stable descending created_at/id order |
| Vietnamese Unicode | PASS | HTTP profile/timeline, contact and real Excel import tests |
| SQL failure is safe | PASS | HTTP 500 while test contract table temporarily unavailable, restored in finally; no table name/SQLException in response |
| HTTP response under 1500 ms | PASS in measured fixture | 11 sequential requests, including first aggregate request; no concurrent load |
| Customer merge retains signed amounts | PASS | Database integration test |
| Existing APIs / quote JSON behavior | PASS for listed checks | GET customer/list/activities/opportunities/quotes; POST quote items, exact total 200, update status, malformed items → 400 |
| Production schema/deployment | NOT TESTED | Existing DB config rejected authentication; production credentials were not changed |
| VS Code Problems UI | NOT TESTED directly | Compiler checks below; no live VS Code Problems snapshot available |

## Test results

Final `mvn clean verify`: BUILD SUCCESS; 19 tests, 0 failures, 0 errors, 0 skipped; 20.510 seconds. `-Werror` and `-Xlint:unchecked,rawtypes` remain enabled. No `-DskipTests` was used.

- Unit tests: 9 passed (CustomerServletTest 3, UserImportServiceTest 3, JsonUtilTest 3).
- Database integration tests: 10 passed (Customer360IntegrationTest 6, DataScopeIntegrationTest 3, UserImportIntegrationTest 1).
- Import tests cover valid preview/confirm, actual database insertion, Vietnamese name persistence, duplicate email, invalid row, corrupt workbook, missing header, simulated DAO failure, and consumed-token replay.
- The HTTP runner is `dev/Customer360HttpCheck.java`. It creates only disposable test fixtures, uses random credentials without printing them, and deletes its fixtures in finally. It refuses databases other than local `crm_sprint1_test`, and refuses to overwrite an existing customer 12.
- WAR SHA256 matched the copy deployed into the isolated Tomcat base. The deployed Customer360DAO.class hash also matched target/classes after redeployment.
- Initially port 8080 was free; the single test Tomcat instance used CATALINA_HOME in Downloads and a separate explicit CATALINA_BASE under the workspace. This separation is intentional, not a second Tomcat deployment.

Final HTTP samples (ms): [59.6443, 38.8898, 35.1139, 35.981, 35.2088, 29.8105, 28.3849, 25.9311, 25.2045, 22.8362, 26.2715]. Maximum: **59.6443 ms**.

Aggregate DAO timings from payload (ms): [31, 18, 17, 19, 18, 14, 14, 12, 12, 10, 11]. These include DAO-side connection/mapping work; they are not individual SQL execution timings or full HTTP timings.

The final in-process service + JSON serialization measurement was 37 ms for 505 activities. EXPLAIN of the full activity query with owner join reported: `a`: possible key `idx_activities_customer_timeline`, chosen key NULL, estimated 505 rows, `Using where; Using temporary; Using filesort`; `u`: hash join over 3 fixture users. MySQL chose a scan on the small fixture. A preliminary covering id-only query used the timeline index; that is not claimed as the plan for the full production query. No forced-index hint or optimizer-plan assertion was added. Larger datasets/concurrent load remain unbenchmarked.

The API's performance metadata now says `NOT_MEASURED_HTTP`. Only the external HTTP runner emits PASSED after verifying row count, order, payload, statuses and timing.

## Warnings and real defects fixed

- Replaced raw Gson Map.class deserialization in ActivityServlet, AuditLogServlet, OpportunityServlet and QuoteServlet with a parameterized TypeToken.
- Quote items are validated as List<?> → Map<?,?> → String keys, copying values without changing numeric representation or JSON structure. No unchecked suppression was added.
- Removed the unchecked integration-test list cast using runtime assertions.
- Removed verified unused imports in OrganizationServlet, OpportunityDAO, CustomerService, OpportunityService and QuoteService.
- XSSFWorkbook is initialized inside try-with-resources. Input stream ownership remains with UserImportServlet, which already uses try-with-resources.
- Eclipse JDT batch compiler shipped with the installed VS Code Java extension completed with no unused-import, raw-type or unchecked warnings on main/test sources. Extended resource analysis found no workbook warning, but emitted 41 potential-leak diagnostics for container-owned servlet readers/writers/output streams; these were not hidden or indiscriminately closed. This is not a claim that the live Problems tab is empty. Recheck after Java: Clean Java Language Server Workspace → restart/reimport Maven and inspect Problems.
- Added the matching Log4j-to-JUL runtime provider; the observed POI logging-provider error disappeared from the final import tests.
- Fixed confirmed schema mismatches: pipeline DAO queries now use canonical order_no/probability/exit_condition/active with legacy response aliases; user creation no longer inserts the nonexistent username column.
- Missing tables/columns have an additive, seed-free migration. Repeated application to the isolated database succeeded. Historical migration 008 fails on a fresh 001–007 schema because it assumes legacy audit columns; the documented fresh-test path uses 020 instead of blindly replaying historical seed/compatibility scripts.

## Remaining limitations

Existing crm_db schema and its deployed environment were not authenticated or migrated. The stored db.properties keys and CRM_DB_* precedence were inspected without exposing values. The observed failure is an SQL authentication rejection, not evidence of which credential/configuration is wrong. Production-specific legacy constraints (including a possible required username column) must be checked before deployment. No financial contract data is backfilled from opportunities. No concurrent-load benchmark or live VS Code UI verification was performed.

## Files changed

| File | Reason |
|---|---|
| `backend/pom.xml` | Keep strict compilation; add POI logging provider. |
| `backend/src/main/java/com/crm/controller/activities/ActivityServlet.java` | Typed JSON maps; safe server error response. |
| `backend/src/main/java/com/crm/controller/audit/AuditLogServlet.java` | Typed JSON map. |
| `backend/src/main/java/com/crm/controller/customers/CustomerServlet.java` | 401 handling, strict 360 IDs, safe 500, injectable service for tests. |
| `backend/src/main/java/com/crm/controller/organization/OrganizationServlet.java` | Remove unused import. |
| `backend/src/main/java/com/crm/controller/pipeline/OpportunityServlet.java` | Typed JSON maps; safe server errors. |
| `backend/src/main/java/com/crm/controller/quotes/QuoteServlet.java` | Checked quote item conversion, typed map, safe server errors. |
| `backend/src/main/java/com/crm/dao/contacts/ContactDAO.java` | Reuse connection and batch company histories instead of per-contact queries. |
| `backend/src/main/java/com/crm/dao/customers/Customer360DAO.java` | Scope before related reads, signed contracts, complete profile keys, stable activity order, honest performance metadata. |
| `backend/src/main/java/com/crm/dao/customers/CustomerMergeDAO.java` | Move contract records in the existing merge transaction. |
| `backend/src/main/java/com/crm/dao/pipeline/OpportunityDAO.java` | Canonical stage column alias and unused import removal. |
| `backend/src/main/java/com/crm/dao/pipeline/PipelineStageDAO.java` | Use current schema while preserving response names. |
| `backend/src/main/java/com/crm/dao/users/UserManagementDAO.java` | Fix user creation against repository schema without username. |
| `backend/src/main/java/com/crm/service/customers/CustomerService.java` | Remove duplicate profile read; resolve permission and pass scope into aggregate DAO. |
| `backend/src/main/java/com/crm/service/importer/UserImportService.java` | Workbook ownership and injectable DAO for failure tests. |
| `backend/src/main/java/com/crm/service/pipeline/OpportunityService.java` | Remove unused import. |
| `backend/src/main/java/com/crm/service/quotes/QuoteService.java` | Remove unused import. |
| `backend/src/main/java/com/crm/util/JsonUtil.java` | Parameterized map type and checked object-list conversion. |
| `backend/src/main/webapp/js/pages/customer-360.js` | Signed-contract KPI and correct count keys. |
| `frontend/js/pages/customer-360.js` | Matching frontend source changes. |
| `backend/src/test/java/com/crm/service/permissions/DataScopeIntegrationTest.java` | Checked collection types, exact test-database guard, safe failed-setup cleanup. |
| `backend/database/020_customer_360_schema.sql` | Additive missing schema, signed-contract table, composite timeline index; no seed or business updates. |
| `backend/dev/Customer360HttpCheck.java` | Reproducible HTTP benchmark, auth/error and quote regression checks with cleanup. |
| `backend/src/test/java/com/crm/controller/customers/Customer360IntegrationTest.java` | Real MySQL aggregate, scope, KPI, merge, row-limit/order and EXPLAIN checks. |
| `backend/src/test/java/com/crm/controller/customers/CustomerServletTest.java` | HTTP status mapping, invalid IDs, basic route compatibility and safe errors. |
| `backend/src/test/java/com/crm/service/importer/UserImportIntegrationTest.java` | Actual Excel preview/confirm/database persistence and duplicate checks. |
| `backend/src/test/java/com/crm/service/importer/UserImportServiceTest.java` | Valid/error/corrupt Excel and DAO-failure/replay tests. |
| `backend/src/test/java/com/crm/util/JsonUtilTest.java` | Quote JSON compatibility and malformed shape/key validation. |
| `backend/docs/S5-54-validation.md` | This evidence and file inventory. |
| `backend/docs/S5-54-runbook.md` | Safe test schema setup, build, HTTP verification and deployment requirements. |
