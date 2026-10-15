# Backend CRM Point 76: Đóng Cơ Hội Kinh Doanh Thắng / Thua

Hệ thống Backend REST API chuyên nghiệp được xây dựng bằng **Python**, **FastAPI**, **SQLAlchemy ORM**, **Pydantic V2**, **MySQL 8.x** và **Alembic**, phục vụ đầy đủ các nghiệp vụ đóng cơ hội kinh doanh (Thắng/Thua), mở lại cơ hội theo phân quyền RBAC, kiểm toán thay đổi trạng thái (Audit Timeline) và quản lý chỉ tiêu doanh số bán hàng (Sales Target Quota Ledger).

---

## 1. Yêu cầu hệ thống
- Python 3.11 trở lên (Đã kiểm thử hoạt động tốt trên Python 3.11 - 3.14)
- MySQL Server 8.x (hoặc tự động fallback sang SQLite nhúng khi chạy thử nghiệm offline)
- Frontend React + TypeScript (chạy trên cổng `3000`)

---

## 2. Hướng dẫn cài đặt và khởi động

### Bước 1: Tạo môi trường ảo và cài đặt thư viện
Tại thư mục `backend/`:
```bash
# Tạo môi trường ảo venv
py -m venv venv

# Kích hoạt môi trường ảo (Windows PowerShell):
.\venv\Scripts\Activate.ps1

# Cài đặt toàn bộ thư viện cần thiết:
py -m pip install -r requirements.txt
```

### Bước 2: Cấu hình biến môi trường
Sao chép file `.env.example` thành `.env`:
```bash
cp .env.example .env
```
Nội dung file `.env`:
```ini
APP_NAME="CRM Opportunity Management API"
APP_ENV="development"
PORT=8000
HOST="0.0.0.0"

# Cấu hình kết nối MySQL (Mặc định):
DATABASE_URL="mysql+pymysql://root:123456@localhost:3306/crm_db?charset=utf8mb4"

# JWT Secret
SECRET_KEY="crm_super_secret_jwt_key_point_76_change_in_production"
ALGORITHM="HS256"
ACCESS_TOKEN_EXPIRE_MINUTES=1440
```
> **Lưu ý:** Nếu MySQL chưa được cài đặt hoặc chưa khởi động, hệ thống sẽ tự động chuyển sang cơ sở dữ liệu dự phòng SQLite (`sqlite:///./crm_local.db`) để đảm bảo API luôn khởi chạy ổn định mà không bị crash.

### Bước 3: Chạy Migration cơ sở dữ liệu (Alembic)
```bash
# Áp dụng migration lên database
py -m alembic upgrade head
```

### Bước 4: Khởi động FastAPI Server
```bash
py -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
Khi server chạy thành công:
- **API Server**: [http://localhost:8000](http://localhost:8000)
- **Tài liệu Swagger UI tương tác**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **Tài liệu ReDoc**: [http://localhost:8000/redoc](http://localhost:8000/redoc)

---

## 3. Chạy kiểm thử tự động (Pytest)
Bộ kiểm thử bao gồm đầy đủ 14 test cases kiểm tra validation, RBAC, locking và chỉ tiêu doanh số:
```bash
py -m pytest app/tests -v
```

Kết quả kiểm thử:
```
app/tests/test_close_lost.py::test_close_lost_success PASSED
app/tests/test_close_lost.py::test_close_lost_missing_reason PASSED
app/tests/test_close_lost.py::test_close_lost_allow_empty_competitor PASSED
app/tests/test_close_lost.py::test_close_lost_other_reason_requires_detail PASSED
app/tests/test_close_won.py::test_close_won_success PASSED
app/tests/test_close_won.py::test_close_won_missing_actual_amount PASSED
app/tests/test_close_won.py::test_close_won_missing_signed_date PASSED
app/tests/test_close_won.py::test_close_won_invalid_zero_or_negative_amount PASSED
app/tests/test_permissions.py::test_cannot_edit_or_reclose_closed_opportunity PASSED
app/tests/test_permissions.py::test_user_cannot_access_unowned_opportunity PASSED
app/tests/test_reopen.py::test_sales_rep_cannot_reopen PASSED
app/tests/test_reopen.py::test_team_lead_can_reopen PASSED
app/tests/test_reopen.py::test_reopen_missing_reason_rejected PASSED
app/tests/test_sales_target.py::test_sales_target_credited_only_once_and_reversed_on_reopen PASSED

======================= 14 passed in 1.03s =======================
```

---

## 4. Danh sách REST API & Quy chuẩn kết nối Frontend

| STT | Phương thức | Đường dẫn API | Chức năng & Nghiệp vụ | Mã phản hồi |
|:---:|:---:|:---|:---|:---:|
| 1 | `GET` | `/api/opportunities` | Lấy danh sách cơ hội (tìm kiếm, lọc trạng thái, phân quyền người sở hữu, phân trang) | `200` |
| 2 | `GET` | `/api/opportunities/{id}` | Lấy chi tiết thông tin cơ hội | `200`, `404` |
| 3 | `POST` | `/api/opportunities/{id}/close-won` | Đóng Thắng: kiểm tra giá trị chốt > 0, ngày ký hợp lệ, cộng chỉ tiêu người sở hữu, ghi lịch sử | `200`, `409`, `422` |
| 4 | `POST` | `/api/opportunities/{id}/close-lost` | Đóng Thua: kiểm tra lý do thua (yêu cầu chi tiết nếu chọn lý do khác), đối thủ, ghi lịch sử | `200`, `409`, `422` |
| 5 | `POST` | `/api/opportunities/{id}/close` | Endpoint hợp nhất cho frontend (hỗ trợ cả đóng Thắng và Thua) | `200`, `409`, `422` |
| 6 | `POST` | `/api/opportunities/{id}/reopen` | Mở lại cơ hội: chỉ Trưởng nhóm (`TEAM_LEAD`), Quản lý (`MANAGER`), Admin. Hoàn tác chỉ tiêu nếu mở lại cơ hội Thắng | `200`, `403`, `409`, `422` |
| 7 | `GET` | `/api/opportunities/{id}/history` | Lấy lịch sử dòng thời gian (Timeline) hoạt động và kiểm toán | `200` |
| 8 | `GET` | `/api/users/{user_id}/sales-target-summary` | Lấy tổng hợp chỉ tiêu doanh số của người sở hữu | `200` |
| 9 | `GET` | `/api/win-loss-reasons` | Lấy danh mục lý do Thắng / Thua (`?type=WON` hoặc `?type=LOST`) | `200` |
| 10 | `GET` | `/api/competitors` | Lấy danh mục đối thủ cạnh tranh | `200` |

---

## 5. Quy tắc phân quyền & Header kiểm thử nhanh (RBAC)
Hệ thống hỗ trợ xác thực qua **JWT Token** (`Authorization: Bearer <token>`) hoặc qua Header tiện ích cho quá trình phát triển/kiểm thử:
- Header `X-User-Id: 1` hoặc `X-User-Role: SALES_REP` (Nhân viên kinh doanh)
- Header `X-User-Id: 3` hoặc `X-User-Role: TEAM_LEAD` (Trưởng nhóm kinh doanh — có quyền mở lại)
- Header `X-User-Id: 4` hoặc `X-User-Role: ADMIN` (Quản trị viên)
