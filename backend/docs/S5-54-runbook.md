# S5-54 build and verification

## Database setup

Use a separate local MySQL instance/database named exactly `crm_sprint1_test`.
Configure an authenticated MySQL login path `crm-s554-test` for that instance.
Do not point this workflow at the business database. The validated run used
MySQL 8.0.46 on port 33354; the existing server on port 3306 was untouched.

For a **fresh, disposable** database, run from `backend`:

```powershell
$scripts = Get-ChildItem database -Filter '*.sql' |
    Where-Object Name -Match '^00[1-7]_' | Sort-Object Name
foreach ($script in $scripts) {
    (Get-Content -LiteralPath $script.FullName -Raw).Replace('crm_db', 'crm_sprint1_test') |
        mysql --login-path=crm-s554-test --default-character-set=utf8mb4
    if ($LASTEXITCODE -ne 0) { throw "Schema setup failed: $($script.Name)" }
}
Get-Content database/020_customer_360_schema.sql -Raw |
    mysql --login-path=crm-s554-test --default-character-set=utf8mb4 --database=crm_sprint1_test
if ($LASTEXITCODE -ne 0) { throw 'S5-54 schema setup failed' }
```

This is the tested fresh-schema path. Historical scripts 008–019 mix assumptions
about legacy schemas with business demo seeds; do not replay them blindly.
In particular, 008 assumes legacy audit columns absent from the fresh 005 schema.
The new 020 script supplies the schema needed by this feature without demo data.
It has no `USE crm_db`, destructive table operations, or business-data updates.
Running it twice was verified on the isolated database.

Before applying 020 to an existing deployment, inspect its actual schema.
`CREATE TABLE IF NOT EXISTS` deliberately does not overwrite existing table
definitions. Apply only needed additions to the explicitly selected database.
The signed KPI reads `customer_360_contracts.status = 'SIGNED'`. Populate this
table only from actual contract records; never derive signed contracts from WON
opportunities. Existing local contract records using this table remain compatible.

## Build

Set `CRM_DB_URL`, `CRM_DB_USERNAME`, and `CRM_DB_PASSWORD` in the process environment
for the isolated database, using your local secret-management mechanism.
Never commit or print their credential values. Both Maven and the test Tomcat
must receive the same database configuration.

```powershell
mvn clean verify
```

The tests require the exact test database name and intentionally fail if it is
missing. They are not skipped. The build keeps `-Werror` and checks unchecked/raw
types. Unit tests exercise JSON conversion, servlet behavior and Excel errors;
integration tests use real MySQL rows and clean up their own fixtures.

## Tomcat and HTTP

Check the listener on 8080 before starting Tomcat. Use one Tomcat 10.1 instance
with Java 21. Inspect its real CATALINA_HOME, CATALINA_BASE, startup log, and
webapps directory; separate home/base paths are valid when intentionally configured.

Deploy `target/crm.war` to that instance's actual `webapps/crm.war`. Confirm its
hash and the deployed class hash match the build after deployment completes.
The validated test deployment was bound to 127.0.0.1 and used a separate workspace
CATALINA_BASE. No production Tomcat was replaced.

With that Tomcat connected to the isolated database, run from `backend`:

```powershell
java -cp "target/classes;target/crm/WEB-INF/lib/*" dev/Customer360HttpCheck.java
```

The runner refuses to overwrite an existing customer 12. It creates disposable
users and a customer-12 fixture with 505 activities, performs 11 sequential HTTP
measurements, validates KPIs/order/authentication/scope/statuses, exercises quote
creation/status changes/malformed item input, and removes its fixtures in finally.
It temporarily renames the test contract table to verify a real safe HTTP 500,
then restores the table in finally. Run it exclusively on the disposable test
instance, without concurrent tests or application users.

Results are written to `target/customer-360-http-results.json` only after all
checks pass. API `performance.executionTimeMs` measures aggregate DAO work, while
the runner measures HTTP end-to-end. The API does not declare benchmark success.
The documented latency applies to this local fixture, not concurrent production load.

## Java warnings

Reimport the Maven project in VS Code, run **Java: Clean Java Language Server
Workspace**, restart when prompted, and inspect Problems for both main and test
sources. Maven's strict compiler and Eclipse JDT batch checks verified the raw,
unchecked and unused-import fixes. Extended JDT potential-resource diagnostics
also flag servlet container-owned readers/writers/output streams; do not close
shared response streams merely to hide those diagnostics. The workbook warning
was removed through direct try-with-resources ownership.

See `S5-54-validation.md` for measured results, acceptance criteria and all changed
files. Original local work remains in the named S5-54 preservation stash; inspect
it rather than applying it wholesale over the synchronized implementation.
