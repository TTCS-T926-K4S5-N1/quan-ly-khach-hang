# PROMPT & ĐẶC TẢ CHI TIẾT: SCRUM-94 - XUẤT BÁO GIÁ & HỢP ĐỒNG RA PDF THEO MẪU CÔNG TY

## 1. Bối cảnh & Mục tiêu (User Story)
- **Actor:** Nhân viên kinh doanh (Sales Rep) – và các vai trò có quyền xem báo giá/hợp đồng.
- **User Story:** "Là Nhân viên kinh doanh, tôi muốn xuất báo giá và hợp đồng ra PDF theo mẫu công ty, để gửi khách tài liệu đúng nhận diện thương hiệu."
- **Mô tả (Jira):**
  - Mẫu có **logo**, **thông tin công ty**, **bảng dòng sản phẩm**, **tổng tiền bằng số và bằng chữ**.
  - Mẫu **khai báo được ở phần cấu hình**, **không cố định trong mã nguồn**.
- **Subtask:** `SCRUM-239 [FE]`, `[BE]`.
- **Nhánh:** `feature/SCRUM-94-export-quote-contract-pdf` (tách từ `develop`).

### Mục tiêu cốt lõi
1. Sinh file PDF phía server (Java, OpenPDF) – bảo đảm hiển thị **tiếng Việt có dấu** chuẩn (font Unicode nhúng sẵn, không phụ thuộc font hệ điều hành).
2. Toàn bộ thông tin nhận diện (tên công ty, địa chỉ, MST, điện thoại, email, website, tài khoản ngân hàng, người đại diện, logo, màu chủ đạo, tiêu đề, lời mở đầu, điều khoản, chân trang) được **đọc từ bảng cấu hình `document_templates`** – mã nguồn chỉ chứa *bố cục*, không chứa *nội dung thương hiệu*.
3. Có trang cấu hình **"Mẫu tài liệu PDF"** cho quản trị viên chỉnh mẫu (kèm upload logo, xem trước PDF).
4. Nút **"Xuất PDF"** trên danh sách báo giá, trang chỉnh sửa báo giá và trang tạo hợp đồng.

---

## 2. Quy tắc nghiệp vụ (Business Rules)

| Mã | Quy tắc |
|----|---------|
| BR-1 | Có 2 loại mẫu: `QUOTE` (Báo giá) và `CONTRACT` (Hợp đồng). Mỗi loại có đúng **1 mẫu đang dùng** (unique theo `document_type`). |
| BR-2 | Nếu chưa có cấu hình trong DB → hệ thống trả lỗi rõ ràng *"Chưa cấu hình mẫu tài liệu …"* (không tự bịa thông tin công ty). Migration seed sẵn mẫu mặc định để chạy được ngay. |
| BR-3 | **Báo giá PDF:** xuất được với mọi trạng thái báo giá **trừ** báo giá đã xóa. Báo giá chưa duyệt (`DRAFT`, `PENDING_APPROVAL`, `REJECTED`) được đóng dấu chữ chìm **"BẢN NHÁP"** để tránh gửi nhầm cho khách. |
| BR-4 | **Hợp đồng PDF:** chỉ xuất khi báo giá ở trạng thái `APPROVED` hoặc `ACCEPTED` (đồng bộ với rule tạo hợp đồng). Bắt buộc có *Số hợp đồng*, *Ngày ký*, *Ngày hiệu lực*; *Ngày hết hạn* (nếu có) phải ≥ ngày hiệu lực; ngày hiệu lực ≥ ngày ký. |
| BR-5 | **Phân quyền:** Báo giá PDF cần quyền `quote.export`; Hợp đồng PDF cần quyền `contract.read`. Ngoài ra áp dụng **phạm vi dữ liệu** module `quote` (SELF / TEAM / ALL) – Sales chỉ xuất được báo giá mình sở hữu. |
| BR-6 | Cấu hình mẫu cần quyền mới `document_template.manage` (cấp cho `ADMIN`, `DIRECTOR`). Xem mẫu (GET) cần `document_template.manage` hoặc `quote.export`. |
| BR-7 | **Số tiền:** bảng dòng sản phẩm gồm STT, Mã SP, Tên SP, ĐVT, SL, Đơn giá, CK (%), Thành tiền. Tổng hợp: Tạm tính (`subtotal`), Chiết khấu tổng (`discount_percent` → số tiền), **Tổng cộng** (`total_amount`). Định dạng số kiểu Việt Nam `1.234.567`. |
| BR-8 | **Tổng tiền bằng chữ** tiếng Việt theo đúng quy tắc đọc số: "mốt", "tư", "lăm", "linh", "mười", "nghìn/triệu/tỷ" (hỗ trợ tới hàng nghìn tỷ tỷ), viết hoa chữ cái đầu, hậu tố đơn vị tiền tệ cấu hình được (mặc định `đồng`) và kết thúc bằng "chẵn" khi không có phần lẻ. Ví dụ `175.750.000` → *"Một trăm bảy mươi lăm triệu bảy trăm năm mươi nghìn đồng chẵn."* |
| BR-9 | **Logo:** lưu dạng data URL base64 (`image/png` hoặc `image/jpeg`), tối đa **500 KB**. Logo lỗi/không đọc được → PDF vẫn xuất, bỏ qua logo (không làm hỏng tài liệu). |
| BR-10 | **Màu chủ đạo** dạng HEX `#RRGGBB`; sai định dạng → 400. |
| BR-11 | **Placeholder** trong `intro_text`, `terms_text`, `footer_text` được thay thế khi render: `{companyName}`, `{customerName}`, `{quoteNumber}`, `{contractNumber}`, `{validityDays}`, `{totalAmount}`, `{totalInWords}`, `{signedDate}`, `{effectiveDate}`, `{expiryDate}`, `{paymentTerms}`. |
| BR-12 | **Tên file tải về:** `BaoGia_<quoteNumber>.pdf`, `HopDong_<contractNumber>.pdf` (ký tự đặc biệt được thay bằng `_`). Header `Content-Disposition: attachment` (hoặc `inline` khi `?inline=1` để xem trước). |
| BR-13 | **Audit:** mỗi lần xuất ghi `audit_logs` (entity `QUOTE` action `EXPORT_QUOTE_PDF` / entity `CONTRACT` action `EXPORT_CONTRACT_PDF`); mỗi lần sửa mẫu ghi `DOCUMENT_TEMPLATE` / `UPDATE_DOCUMENT_TEMPLATE`. Lỗi ghi audit không làm hỏng việc xuất. |

---

## 3. Tiêu chí chấp nhận (Acceptance Criteria)

### AC-1: Xuất báo giá PDF
- Ở danh sách báo giá / màn hình báo giá có nút **"PDF"**. Click → tải file `BaoGia_<số>.pdf`.
- PDF có: logo + thông tin công ty (header), tiêu đề "BÁO GIÁ", số báo giá, ngày lập, hiệu lực (ngày lập + `validity_days`), thông tin khách hàng (tên, MST, địa chỉ, điện thoại, email), người phụ trách, bảng dòng sản phẩm, tạm tính, chiết khấu, tổng cộng, **tổng bằng chữ**, điều khoản, chữ ký, chân trang.

### AC-2: Xuất hợp đồng PDF
- Ở trang **Tạo hợp đồng**, sau khi nhập số HĐ, ngày ký, ngày hiệu lực → nút **"Xuất PDF hợp đồng"** tải `HopDong_<số>.pdf`.
- PDF có: header công ty, tiêu đề hợp đồng, căn cứ, **Bên A** (công ty – lấy từ cấu hình) & **Bên B** (khách hàng), các điều khoản (lấy từ cấu hình), bảng sản phẩm, tổng tiền số + chữ, điều khoản thanh toán, ngày hiệu lực/hết hạn, ô ký 2 bên.
- Báo giá chưa duyệt → 400 *"Chỉ xuất hợp đồng từ báo giá đã duyệt/được chấp nhận."*

### AC-3: Mẫu cấu hình được, không hard-code
- Trang **Cấu hình › Mẫu tài liệu PDF** (`document-templates`) có 2 tab: Báo giá / Hợp đồng.
- Sửa thông tin → Lưu → xuất lại PDF phản ánh ngay nội dung mới (không cần build lại).
- Upload logo (PNG/JPG ≤ 500 KB) có xem trước; nút **"Xem trước PDF"** mở PDF mẫu với dữ liệu demo.

### AC-4: Bảo mật & lỗi
- Chưa đăng nhập → 401/403. Không có quyền → 403. Báo giá không tồn tại / đã xóa → 404. Báo giá ngoài phạm vi → 403.
- Lỗi máy chủ → JSON `{"success":false,"message":"Lỗi máy chủ"}` (không lộ stack trace).

---

## 4. Thiết kế kỹ thuật

### 4.1 Database – `backend/database/024_scrum_94_document_templates.sql`
```sql
CREATE TABLE IF NOT EXISTS document_templates (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  document_type VARCHAR(20) NOT NULL,          -- QUOTE | CONTRACT
  name VARCHAR(150) NOT NULL,
  title VARCHAR(200) NOT NULL,                 -- "BÁO GIÁ" / "HỢP ĐỒNG MUA BÁN"
  company_name VARCHAR(255) NOT NULL,
  company_address VARCHAR(500), company_tax_code VARCHAR(50),
  company_phone VARCHAR(50), company_email VARCHAR(255), company_website VARCHAR(255),
  company_bank_account VARCHAR(255),
  representative_name VARCHAR(150), representative_title VARCHAR(150),
  logo_data MEDIUMTEXT,                         -- data:image/png;base64,...
  primary_color VARCHAR(7) NOT NULL DEFAULT '#1E3A8A',
  intro_text TEXT, terms_text TEXT, footer_text TEXT,
  currency_unit VARCHAR(30) NOT NULL DEFAULT 'đồng',
  validity_days INT NOT NULL DEFAULT 30,
  updated_by BIGINT NULL, created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_document_templates_type (document_type)
);
```
+ seed mẫu mặc định cho `QUOTE` & `CONTRACT` (`INSERT IGNORE`), + quyền `document_template.manage` cho `ADMIN`, `DIRECTOR`.

### 4.2 Backend
| Lớp | Trách nhiệm |
|-----|-------------|
| `util/VietnameseNumberToWords` | Đọc số tiền → chữ tiếng Việt (thuần, unit-test được). |
| `model/documents/DocumentTemplate` | POJO mẫu. |
| `dao/documents/DocumentTemplateDAO` | `findByType`, `findAll`, `upsert`. |
| `service/documents/DocumentTemplateService` | Validate (type, màu HEX, logo ≤ 500KB & đúng mime, độ dài), phân quyền, audit. |
| `service/documents/PdfDocumentRenderer` | Dựng PDF (OpenPDF) từ `DocumentTemplate` + dữ liệu báo giá/hợp đồng – **không truy cập DB** để test độc lập. |
| `service/documents/DocumentExportService` | Lấy báo giá (scope), khách hàng, mẫu → gọi renderer, kiểm tra rule hợp đồng, audit. |
| `controller/documents/DocumentTemplateServlet` | `GET /api/document-templates`, `GET/PUT /api/document-templates/{QUOTE|CONTRACT}`, `GET /api/document-templates/{type}/preview` |
| `controller/documents/DocumentExportServlet` | `GET /api/quotes/{id}/pdf`, `POST /api/quotes/{id}/contract-pdf` |

### 4.3 API
- `GET /api/quotes/{id}/pdf[?inline=1]` → `200 application/pdf`.
- `POST /api/quotes/{id}/contract-pdf[?inline=1]`
  ```json
  { "contractNumber": "HD-2026-001", "signedDate": "2026-10-21",
    "effectiveDate": "2026-10-22", "expiryDate": "2027-10-21",
    "paymentTerms": "Thanh toán 50% khi ký, 50% khi nghiệm thu." }
  ```
  → `200 application/pdf` | `400` (thiếu/không hợp lệ, báo giá chưa duyệt) | `403` | `404`.
- `PUT /api/document-templates/QUOTE` body = các trường mẫu (camelCase) → `200` JSON mẫu đã lưu.

### 4.4 Frontend
- `quotations.js`: thêm nút **PDF** mỗi dòng (desktop + mobile) → tải qua `fetch` (blob) + thông báo lỗi.
- `quote-editor.js`: nút **Xuất PDF** khi đang xem báo giá đã lưu.
- `contract-create.html/js`: nút **Xuất PDF hợp đồng** (validate form trước khi gọi API).
- Trang mới `document-templates.html` + `css/pages/document-templates.css` + `js/pages/document-templates.js`; thêm menu "Mẫu tài liệu PDF" (`MenuService` khi có quyền `document_template.manage`).
- Đồng bộ file giữa `frontend/` và `backend/src/main/webapp/`.

---

## 5. Kịch bản kiểm thử (Test Cases)

### Unit test
1. **TC-U1** `VietnameseNumberToWords`: 0, 1, 5, 10, 11, 15, 21, 24, 25, 101, 105, 110, 1.000, 1.001, 10.500, 1.000.000, 1.000.005, 175.750.000, 1.000.000.000, 2.000.000.015, số âm → lỗi, số lẻ thập phân (làm tròn).
2. **TC-U2** `PdfDocumentRenderer`: sinh báo giá → bytes bắt đầu `%PDF`, text trích xuất chứa tên công ty từ mẫu, số báo giá, tên sản phẩm, tổng bằng chữ (tiếng Việt có dấu).
3. **TC-U3** Renderer đổi `company_name` trong mẫu → PDF chứa tên mới (chứng minh không hard-code).
4. **TC-U4** Renderer hợp đồng: chứa "Bên A", "Bên B", số hợp đồng, ngày hiệu lực.
5. **TC-U5** Báo giá `DRAFT` có chữ "BẢN NHÁP"; báo giá `APPROVED` không có.
6. **TC-U6** Logo base64 hỏng → vẫn sinh PDF hợp lệ.
7. **TC-U7** `DocumentTemplateService.validate`: màu sai → lỗi; logo > 500KB → lỗi; mime không phải png/jpeg → lỗi; type sai → lỗi.
8. **TC-U8** Rule hợp đồng: thiếu số HĐ / ngày ký / ngày hiệu lực → lỗi; hết hạn < hiệu lực → lỗi; báo giá `DRAFT` → lỗi.

### Integration / thủ công (Tomcat + MySQL)
9. **TC-I1** Admin `GET /api/quotes/1/pdf` → 200, `application/pdf`, mở được, đúng tiếng Việt.
10. **TC-I2** Sửa mẫu QUOTE (đổi tên công ty) → xuất lại thấy tên mới.
11. **TC-I3** `POST /api/quotes/4/contract-pdf` (báo giá DRAFT) → 400.
12. **TC-I4** `POST /api/quotes/1/contract-pdf` hợp lệ → 200 PDF.
13. **TC-I5** Sales Rep sửa mẫu → 403; xuất báo giá người khác → 403.
14. **TC-I6** UI: bấm nút PDF ở danh sách báo giá, ở trang tạo hợp đồng, trang cấu hình mẫu lưu & xem trước.
