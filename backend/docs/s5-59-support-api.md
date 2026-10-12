# S5-59 — Yêu cầu hỗ trợ sau bán và rủi ro rời bỏ

## Triển khai

- Java 21, MySQL 8+, Servlet 6; dùng session đăng nhập và `ApiResponse` hiện có.
- Chọn đúng database rồi chạy `database/012_support_requests.sql` **trước khi triển khai WAR mới**. Migration phụ thuộc các bảng khách hàng, người dùng, quyền và `role_module_scopes` của các migration trước. Có thể chạy lại migration 012.
- Không có thay đổi dữ liệu khách hàng hoặc tự đổi trạng thái kinh doanh của khách hàng. Yêu cầu hỗ trợ lưu trong `support_requests`; `customer_support_risk` là view tính cờ tự động, không phải cột được ghi theo lịch.
- View sử dụng `UTC_TIMESTAMP(6)`, vì vậy một yêu cầu tự trở thành quá hạn khi thời gian trôi qua, không cần cron hoặc thao tác ghi. Cờ được trả theo trạng thái database lúc truy vấn.
- Không tự chạy migration lên database của nhóm. Khi rollback ứng dụng, có thể giữ bảng/view để bảo toàn lịch sử hỗ trợ.

## Quy tắc đã thống nhất

Khách hàng có `atRisk = true` nếu có ít nhất một điều kiện:

| Mã lý do | Điều kiện |
| --- | --- |
| `URGENT_OPEN_REQUEST` | Có yêu cầu `URGENT` chưa hoàn tất |
| `OVERDUE_REQUEST` | Có yêu cầu chưa hoàn tất với `dueAt < thời gian hiện tại` |
| `MULTIPLE_OPEN_REQUESTS` | Có ít nhất 3 yêu cầu chưa hoàn tất |

Chưa hoàn tất gồm `OPEN`, `IN_PROGRESS`. `RESOLVED`, `CLOSED` và bản ghi xóa mềm không được tính. Khi không còn điều kiện nào, cờ tự tắt. `HIGH` không được coi là khẩn cấp. Không có hạn xử lý thì không được coi là quá hạn. Các lý do có thể xuất hiện đồng thời.

## API

Đường dẫn bên dưới tương đối với context `/crm`. Tất cả yêu cầu cần cookie session đăng nhập.

| Method | Đường dẫn | Chức năng |
| --- | --- | --- |
| POST | `/api/support-requests` | Tạo yêu cầu |
| GET | `/api/support-requests` | Danh sách trong phạm vi cho phép |
| GET | `/api/support-requests/{id}` | Chi tiết |
| PUT | `/api/support-requests/{id}` | Thay thế nội dung, ưu tiên, trạng thái, hạn xử lý, kết quả |
| DELETE | `/api/support-requests/{id}` | Xóa mềm; lưu người và thời điểm xóa |
| GET | `/api/support-requests/risks` | Danh sách khách có rủi ro, mặc định chỉ khách có cờ |
| GET | `/api/support-requests/risks/{customerId}` | Cờ và các lý do của một khách hàng |

Danh sách yêu cầu nhận `customerId`, `status`, `priority`, `page` (mặc định 1), `size` (mặc định 20, tối đa 100). Danh sách rủi ro nhận `page`, `size`, `atRiskOnly=true|false` (mặc định true). Danh sách nằm trong `data` dạng mảng, sắp xếp ID giảm dần; trang vượt dữ liệu trả mảng rỗng. Bộ lọc không hợp lệ trả 400.

POST/PUT dùng `Content-Type: application/json`:

```json
{
  "customerId": 101,
  "subject": "Khách báo thiết bị không hoạt động",
  "description": "Cần kiểm tra bảo hành sau bán",
  "priority": "URGENT",
  "status": "OPEN",
  "dueAt": "2026-10-13T10:00:00+07:00",
  "resolution": null
}
```

- `customerId` và `subject` bắt buộc; không thể chuyển yêu cầu sang khách khác khi PUT.
- `subject` được trim, 1–255 ký tự. `description` và `resolution` tối đa 10000 ký tự mỗi trường.
- `priority`: `LOW`, `NORMAL` (mặc định), `HIGH`, `URGENT`.
- `status`: `OPEN` (mặc định), `IN_PROGRESS`, `RESOLVED`, `CLOSED`.
- PUT thay thế toàn bộ nội dung: trường tùy chọn bị bỏ qua sẽ trở về null/mặc định. Không phải PATCH.
- `dueAt` tùy chọn, null để bỏ hạn; yêu cầu ISO-8601 có offset/Z, lưu UTC và trả thời gian có hậu tố Z. Cho phép ghi nhận hạn đã qua để nhập yêu cầu tồn đọng.
- Khi `RESOLVED` hoặc `CLOSED`, bắt buộc `resolution`. Lần đầu hoàn tất đặt `resolvedAt`; chuyển giữa hai trạng thái hoàn tất giữ thời điểm này. Mở lại sẽ xóa `resolvedAt`.
- Không nhận trường client tự gán như `createdBy`, `ownerUserId` hoặc `atRisk`.

Chi tiết/danh sách khách hàng hiện có (`/api/customers`) được bổ sung `supportRisk`:

```json
{
  "atRisk": true,
  "reasons": ["URGENT_OPEN_REQUEST", "OVERDUE_REQUEST"],
  "openCount": 1,
  "urgentCount": 1,
  "overdueCount": 1
}
```

Endpoint `/risks/{customerId}` trả cùng các trường trên và thêm `customerId`, `customerName` trong `data`. Các API ghi trả yêu cầu vừa lưu; client có thể đọc lại rủi ro sau thao tác.

HTTP: 201 tạo mới; 200 đọc/cập nhật/xóa; 400 JSON, đường dẫn hoặc dữ liệu sai; 401 chưa đăng nhập; 403 thiếu quyền; 404 bản ghi không tồn tại, đã xóa hoặc nằm ngoài phạm vi. Lỗi 500 trả thông báo chung, chi tiết SQL chỉ ghi log server.

## Phân quyền

- Quyền riêng: `support.read`, `support.create`, `support.update`, `support.delete`.
- Migration cấp cả bốn quyền cho `ADMIN`, `CUSTOMER_SUCCESS`; `DIRECTOR`, `TEAM_LEAD`, `SALES_REP` chỉ được đọc.
- Phạm vi `support` được sao chép từ phạm vi `customer` hiện có của vai trò, không mở rộng quyền. Ví dụ `CUSTOMER_SUCCESS` vẫn là SELF nếu đang cấu hình SELF.
- Mọi thao tác kiểm tra đồng thời phạm vi của quyền hỗ trợ tương ứng và quyền `customer.read`, theo **chủ sở hữu hiện tại của khách hàng**, không theo người tạo yêu cầu. Đổi người sở hữu khách thì quyền truy cập yêu cầu đi theo khách.
- Cờ tóm tắt trên API khách hàng đi theo quyền đọc khách hàng; chi tiết yêu cầu cần quyền hỗ trợ.
- Tạo/cập nhật/xóa dùng transaction và khóa hàng khách hàng để tránh ghi đua với chuyển sở hữu hoặc xóa khách. Khách đã xóa không xuất hiện trong danh sách yêu cầu/rủi ro.

## Kiểm thử

Unit test không cần database:

```powershell
mvn '-Dtest=SupportRequestValidationTest' test
```

Tạo **database MySQL cục bộ riêng dùng một lần** tên `crm_s5_59_test`, rồi chạy:

```powershell
$env:CRM_DB_URL='jdbc:mysql://127.0.0.1:33369/crm_s5_59_test?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC'
$env:CRM_DB_USERNAME='root'
$env:CRM_DB_PASSWORD='<mat-khau-database-test>'
mvn '-Dtest=SupportRequestValidationTest,SupportRequestIntegrationTest' test
mvn -DskipTests package
```

Integration test chỉ bật với URL localhost/127.0.0.1 có cổng và đúng database trên. Test tạo schema nền tối thiểu, áp dụng migration thật hai lần, rồi xóa và dựng lại fixture mỗi test. **Không trỏ test vào dữ liệu dùng chung.** Các test quyền Sprint 1 hiện có dùng database `crm_sprint1_test` riêng; lệnh trên chỉ chạy bộ S5-59.

Bao phủ: validation, phân trang/lọc, ngưỡng 2→3, khẩn cấp, tự quá hạn không cần ghi, nhiều lý do đồng thời, hoàn tất/mở lại/xóa, scope SELF/TEAM/ALL, đổi sở hữu, khách đã xóa, quyền chỉ đọc, người dùng ngừng hoạt động, rollback khi đổi customerId, tạo đồng thời, cờ trên API khách hàng và HTTP lifecycle/error codes. Kiểm thử servlet gọi Servlet API với request/response giả lập và MySQL thật; không thay thế kiểm thử triển khai trên Tomcat của nhóm.
