# HƯỚNG DẪN CHẠY DEMO CRM (DÀNH CHO THÀNH VIÊN NHÓM)

Tài liệu này hướng dẫn các thành viên trong nhóm sau khi `pull` code từ nhánh `develop` trên GitHub về máy cá nhân có thể khởi động và trải nghiệm đầy đủ hệ thống CRM & Dashboard [Tổng quan CRM](http://localhost:8080/crm/dashboard).

---

## 1. Lấy code mới nhất từ nhánh `develop`

Mở terminal tại thư mục dự án và thực hiện:

```bash
# 1. Chuyển sang nhánh develop
git checkout develop

# 2. Kéo mã nguồn mới nhất về
git pull origin develop
```

---

## 2. Cách khởi động hệ thống (Chọn 1 trong 2 cách)

### Cách 1: Sử dụng PowerShell Script (Khuyên dùng cho Windows)
> **Yêu cầu:** Máy đã cài **Docker Desktop** (đang bật) và **Apache Tomcat 10.1** (kèm JDK 21).

Mở PowerShell tại thư mục gốc dự án và chạy:
```powershell
.\start-crm.ps1
```

**Script `start-crm.ps1` đã được tự động hóa 100%:**
1. Tự động kiểm tra và khởi chạy MySQL container (`crm-mysql` cổng `3306`).
2. **Tự động nạp dữ liệu mẫu (Seed Data):** Nếu máy của bạn chưa có database hoặc database đang trống, script sẽ tự động nạp toàn bộ 57 bảng cùng dữ liệu mẫu (tài khoản admin, khách hàng, cơ hội kinh doanh, báo giá, hợp đồng, hoạt động...).
3. Tự động phát hiện đường dẫn `JAVA_HOME` và `CATALINA_HOME` (Tomcat) trên máy mà không cần sửa đường dẫn thủ công.
4. Tự động biên dịch mã nguồn Java và đồng bộ giao diện Frontend.
5. Khởi động Tomcat tại cổng `8080` và tự động mở trình duyệt tới trang đăng nhập.

*Để dừng hệ thống khi không dùng nữa:*
```powershell
.\stop-crm.ps1
```

---

### Cách 2: Chạy hoàn toàn bằng Docker Compose (Không cần cài Java / Tomcat)
> **Yêu cầu duy nhất:** Máy chỉ cần cài **Docker Desktop**. Thích hợp cho cả Windows, macOS, Linux hoặc máy chưa cấu hình Tomcat/Java.

Tại thư mục gốc dự án, chạy lệnh:
```bash
docker compose up -d
```
Hệ thống sẽ khởi tạo container MySQL và container Tomcat chứa sẵn ứng dụng CRM.

*Để dừng hệ thống:*
```bash
docker compose down
```

---

## 3. Thông tin đăng nhập & Trải nghiệm tính năng

Sau khi khởi động, truy cập trình duyệt:

- **Đường dẫn đăng nhập:** [http://localhost:8080/crm/login](http://localhost:8080/crm/login)
- **Tài khoản Quản trị viên (Admin):**
  - **Email:** `admin@crm.local`
  - **Mật khẩu:** `AdminPassword123!`

### Các màn hình trải nghiệm chính:
1. **[Tổng quan CRM (Dashboard)](http://localhost:8080/crm/dashboard):** Báo cáo doanh số, KPI nhóm, biểu đồ đường ống cơ hội (pipeline), hoạt động gần đây và tỷ lệ chuyển đổi.
2. **Khách hàng 360° & Danh sách khách hàng:** [http://localhost:8080/crm/customers](http://localhost:8080/crm/customers)
3. **Quản lý Đường ống cơ hội (Pipeline):** [http://localhost:8080/crm/pipeline](http://localhost:8080/crm/pipeline)
4. **Báo giá & Hợp đồng:** [http://localhost:8080/crm/quotations](http://localhost:8080/crm/quotations) & [http://localhost:8080/crm/contracts](http://localhost:8080/crm/contracts)
5. **Phân bổ & Đánh giá Lead tự động:** [http://localhost:8080/crm/lead-routing](http://localhost:8080/crm/lead-routing)

---

## 4. Xử lý sự cố thường gặp (Troubleshooting)

1. **Lỗi cổng 3306 bị chiếm dụng:**
   - Nếu máy bạn đang chạy MySQL cục bộ trên Windows hoặc container khác dùng cổng 3306, script `start-crm.ps1` sẽ cảnh báo. Bạn chỉ cần tắt MySQL cục bộ hoặc container xung đột trước khi chạy.
2. **Lỗi `ExecutionPolicy` trong PowerShell:**
   - Chạy lệnh: `Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser` hoặc chạy `powershell -ExecutionPolicy Bypass -File .\start-crm.ps1`.
3. **Cần biên dịch lại mã nguồn khi sửa code:**
   - Chỉ cần chạy: `.\build-crm.ps1`.
