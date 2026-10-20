# SCRUM-109: Lọc và xem hoạt động theo loại, thành viên và thống kê mức độ chăm sóc khách

## 1. Thông tin chung
- **Mã công việc (Jira/Scrum)**: SCRUM-109
- **Nhánh phát triển (Feature branch)**: `feature/SCRUM-109-activity-filters-by-member`
- **Nhánh đích (Target branch)**: `develop`
- **Đối tượng người dùng**: Trưởng nhóm kinh doanh (Sales Lead / Manager)

---

## 2. Bối cảnh & Yêu cầu người dùng (User Story)

### User Story:
> **Là Trưởng nhóm kinh doanh**, tôi muốn lọc và xem hoạt động theo loại và theo người thực hiện, để kiểm tra được mức độ chăm sóc khách của từng thành viên trong nhóm.

### Mô tả nghiệp vụ:
1. **Lọc đa tiêu chí**:
   - Khoảng thời gian: Lựa chọn nhanh (Hôm nay, 7 ngày qua, Tháng này, Quý này) hoặc khoảng ngày tùy chỉnh (*Từ ngày* đến *Đến ngày*).
   - Loại hoạt động: Cuộc gọi (CALL), Email (EMAIL), Cuộc họp (MEETING), Công việc (TASK), Ghi chú (NOTE).
   - Thành viên (Người thực hiện): Lọc theo từng nhân viên kinh doanh cụ thể trong nhóm hoặc xem tất cả thành viên.
   - Trạng thái: Đang mở (OPEN), Hoàn thành (COMPLETED), Quá hạn (LATE).
   - Từ khóa tìm kiếm: Tìm kiếm theo tiêu đề, nội dung ghi chú, khách hàng liên quan.
2. **Hiển thị tổng số hoạt động theo từng thành viên**:
   - Thống kê tổng số lượng hoạt động của mỗi thành viên trong khoảng thời gian đã lọc.
   - Phân loại chi tiết số cuộc gọi, email, cuộc họp, công việc, ghi chú của từng thành viên.
   - Thống kê tiến độ thực hiện: Tỷ lệ hoạt động đã hoàn thành, đang mở và quá hạn.
   - Hỗ trợ nhấp chuột trực tiếp vào card thành viên để lọc nhanh danh sách hoạt động bên dưới theo thành viên đó.
3. **Phân quyền và bảo mật phạm vi dữ liệu (Data Scope)**:
   - Trưởng nhóm kinh doanh chỉ được xem và lọc hoạt động của chính mình và các thành viên thuộc nhóm kinh doanh của mình (`ScopeType.TEAM`). Không thể xem hoạt động của các nhóm khác.
   - Giám đốc kinh doanh (`DIRECTOR`) và Quản trị viên (`ADMIN`) có thể xem toàn bộ hệ thống (`ScopeType.ALL`).
   - Nhân viên kinh doanh (`SALES_REP`) chỉ xem được hoạt động của chính mình (`ScopeType.SELF`).

---

## 3. Kiến trúc kỹ thuật & Thay đổi chi tiết

### A. Backend

#### 1. `ActivityDAO.java`
- Thêm phương thức `search(DataScopeContext scope, Long customerId, Long opportunityId, String type, String status, Long ownerId, Timestamp fromDate, Timestamp toDate, String keyword)`:
  - Lọc động theo điều kiện `owner_user_id`, `type`, `status`, khoảng ngày `COALESCE(due_date, created_at)` và `keyword`.
  - Giữ lại hàm nạp chồng `search(...)` ban đầu để tương thích ngược.
- Thêm phương thức `findAccessibleMembers(DataScopeContext scope)`:
  - Truy vấn danh sách người dùng trong bảng `users` kết hợp bảng `teams` áp dụng vị từ sở hữu `scope.appendOwnerPredicate("u.id", ...)`.
- Thêm phương thức `getMemberActivitySummary(...)`:
  - Truy vấn tổng hợp tổng số hoạt động, phân loại cuộc gọi/email/họp/công việc/ghi chú và tiến độ hoàn thành cho từng thành viên có trong phạm vi dữ liệu.

#### 2. `ActivityService.java`
- Áp dụng kiểm tra phân quyền dữ liệu qua `DataScopeService`:
  ```java
  DataScopeContext scope = dataScopeService.resolve(currentUserId, "activity", "read");
  if (ownerId != null && !scope.canAccessOwner(ownerId)) {
      throw new SecurityException("Bạn không có quyền truy cập hoạt động của thành viên này.");
  }
  ```
- Cung cấp các phương thức dịch vụ `getAccessibleMembers` và `getMemberSummary`.
- Cho phép chỉ định người phụ trách khi tạo hoạt động nếu có quyền trong scope.

#### 3. `ActivityServlet.java`
- Bổ sung định tuyến cho các endpoint mới:
  - `GET /api/activities`: Lấy danh sách hoạt động đã lọc theo tham số query string (`ownerId`, `type`, `status`, `fromDate`, `toDate`, `keyword`). Hỗ trợ `?summary=true` để lấy thống kê.
  - `GET /api/activities/members`: Lấy danh sách thành viên trong nhóm phục vụ dropdown bộ lọc.
  - `GET /api/activities/summary-by-member`: Lấy dữ liệu thống kê tổng số hoạt động theo từng thành viên.
- Thêm constructor Dependency Injection hỗ trợ unit testing thuận tiện.

### B. Frontend

#### 1. `activities.html` (và `frontend/activities.html`)
- Section **"Mức độ chăm sóc khách theo thành viên"** (`#memberCareSection`):
  - Card thành viên hiển thị avatar, tên, nhóm, tổng số hoạt động, chip phân loại số lượng cuộc gọi/email/cuộc họp/công việc/ghi chú, thanh tiến độ chăm sóc (Hoàn thành / Đang mở / Quá hạn) và ngày hoạt động gần nhất.
  - Nút thu gọn / mở rộng section để tối ưu diện tích làm việc.
- Section **"Bộ lọc hoạt động"** (`.activity-filter`):
  - Ô tìm kiếm từ khóa.
  - Dropdown lọc loại hoạt động.
  - Dropdown lọc thành viên phụ trách (nạp dữ liệu tự động từ API `/api/activities/members`).
  - Dropdown lọc trạng thái (Đang mở, Hoàn thành, Quá hạn).
  - Nút preset thời gian: *Tất cả*, *Hôm nay*, *7 ngày qua*, *Tháng này*, *Quý này*.
  - Ô chọn ngày tùy chỉnh: *Từ ngày* - *Đến ngày* kèm nút *Lọc* và nút *Đặt lại*.
  - Thanh hiển thị các chip điều kiện lọc đang bật kèm nút xóa nhanh từng điều kiện hoặc xóa tất cả.
- Form tạo/sửa hoạt động trong Drawer:
  - Đổi ô nhập chữ người phụ trách thành dropdown chọn nhân viên trong nhóm.

#### 2. `activities.css` (và `frontend/css/pages/activities.css`)
- Thiết kế giao diện hiện đại với grid layout tự co giãn (`repeat(auto-fill, minmax(280px, 1fr))`).
- Hiệu ứng hover nổi bật, trạng thái kích hoạt `active-selected` khi nhấp chọn lọc theo thành viên.
- Thêm hiển thị người thực hiện (avatar + tên) trên mỗi dòng hoạt động trong danh sách.
- Tối ưu hóa giao diện responsive trên tablet (1000px) và điện thoại (768px).

#### 3. `activities.js` (và `frontend/js/pages/activities.js`)
- Quản lý trạng thái bộ lọc thống nhất (`filterState`).
- Tự động đồng bộ các điều kiện lọc khi người dùng tương tác.
- Tải song song danh sách hoạt động và dữ liệu thống kê thành viên qua `Promise.all`.
- Tương tác nhấp vào card thành viên để lọc nhanh danh sách hoạt động bên dưới.

---

## 4. Kiểm thử tự động (Unit Tests)

1. [ActivityServletTest.java](file:///c:/Users/Juaans/Desktop/adg/backend/src/test/java/com/crm/controller/activities/ActivityServletTest.java):
   - `unauthenticatedRequestReturns403`: Kiểm tra chặn người dùng chưa đăng nhập.
   - `filterActivitiesByTypeAndOwnerAndDate`: Kiểm tra truyền tham số lọc và nhận kết quả chính xác.
   - `getMembersReturnsAccessibleMembers`: Kiểm tra nạp danh sách thành viên có quyền truy cập.
   - `getMemberSummaryReturnsAggregateData`: Kiểm tra tính toán và trả về tổng số hoạt động theo từng thành viên.
   - `forbiddenAccessThrows403`: Kiểm tra chặn truy cập trái phép khi lọc thành viên ngoài nhóm.
2. [ActivityServiceTest.java](file:///c:/Users/Juaans/Desktop/adg/backend/src/test/java/com/crm/service/activities/ActivityServiceTest.java):
   - `createRequiresNonBlankSubject`: Kiểm tra bắt buộc tiêu đề hoạt động khi tạo.
   - `updateRequiresNonBlankSubject`: Kiểm tra bắt buộc tiêu đề hoạt động khi cập nhật.

Kết quả kiểm thử: Toàn bộ 16 tests pass 100% với `mvn clean test`.
