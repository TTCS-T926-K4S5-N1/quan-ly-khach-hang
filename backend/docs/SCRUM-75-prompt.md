# PROMPT & ĐẶC TẢ CHI TIẾT: SCRUM-75 - ĐIỀU KIỆN BẮT BUỘC RỜI GIAI ĐOẠN (STAGE EXIT CRITERIA)

## 1. Bối cảnh & Mục tiêu (User Story)
- **Actor:** Giám đốc kinh doanh (Sales Director).
- **User Story:** "Là Giám đốc kinh doanh, tôi muốn có điều kiện bắt buộc khi cơ hội rời một giai đoạn, để pipeline phản ánh thực tế thay vì bị đẩy giai đoạn cho đẹp báo cáo."
- **Mục tiêu cốt lõi:**
  1. Ngăn chặn nhân viên sales tự ý kéo cơ hội qua các giai đoạn tiếp theo khi chưa đáp ứng các tiêu chuẩn nghiệp vụ thực tế (ví dụ: chưa gặp mặt khách hàng, chưa có thông tin liên hệ, chưa tạo báo giá...).
  2. Hiển thị thông báo tường minh và chi tiết nêu rõ cơ hội đang còn thiếu điều kiện bắt buộc gì.
  3. Cung cấp cơ chế ghi đè (override) có kiểm soát: Chỉ cấp quản lý từ **Trưởng nhóm trở lên** (`TEAM_LEAD`, `DIRECTOR`, `ADMIN`) mới có quyền ghi đè kèm theo lý do bắt buộc; lý do này được lưu vết lịch sử phục vụ kiểm toán và báo cáo.

---

## 2. Tiêu chí chấp nhận (Acceptance Criteria - AC)

### AC-1: Kiểm tra điều kiện bắt buộc khi rời giai đoạn (Exit Criteria Enforcement)
- Mỗi giai đoạn trong quy trình bán hàng (`pipeline_stages`) có cấu hình:
  - `exit_condition` (VARCHAR/TEXT): Mô tả/quy tắc điều kiện khi rời giai đoạn.
  - `condition_required` (BOOLEAN): Trạng thái kích hoạt bắt buộc (1: Bắt buộc, 0: Không bắt buộc).
- Khi cơ hội (`opportunity`) chuyển từ giai đoạn A sang giai đoạn B (A khác B):
  - Nếu giai đoạn A có `condition_required = 1` và `exit_condition` không rỗng:
    - Hệ thống tự động thẩm định dữ liệu cơ hội dựa trên các tiêu chí cấu hình:
      1. **Điều kiện cuộc gặp (Meeting / Cuộc hẹn):** Nếu cấu hình yêu cầu có cuộc gặp (chứa từ khóa: `cuộc gặp`, `gặp`, `meeting`, `hẹn`), cơ hội phải có ít nhất 1 hoạt động (`activities`) với `type = 'MEETING'` (không bị xóa). Nếu không có: Báo lỗi *"Chưa có cuộc gặp nào được ghi nhận cho cơ hội này."*
      2. **Điều kiện người liên hệ (Contact):** Nếu cấu hình yêu cầu người liên hệ, cơ hội phải có `contact_name` hoặc danh sách người liên hệ liên kết. Nếu không: Báo lỗi *"Chưa có thông tin người liên hệ cho cơ hội này."*
      3. **Điều kiện báo giá (Quote):** Nếu cấu hình yêu cầu báo giá, cơ hội phải có ít nhất 1 báo giá (`quotes`). Nếu không: Báo lỗi *"Chưa có báo giá nào được tạo cho cơ hội này."*
      4. **Điều kiện giá trị cơ hội (Amount):** Nếu yêu cầu số tiền/giá trị, `amount` phải > 0.
      5. **Các điều kiện tiêu chí khác:** Nếu có yêu cầu văn bản tự do, hệ thống kiểm tra và thông báo điều kiện cụ thể chưa được xác nhận.

### AC-2: Thông báo lỗi chi tiết khi vi phạm điều kiện
- Khi nhân viên vi phạm điều kiện rời giai đoạn, API và giao diện không cho phép chuyển giai đoạn, đồng thời trả về/hiển thị rõ ràng:
  - Danh sách cụ thể các điều kiện còn thiếu (`missingConditions`).
  - Giai đoạn hiện tại và giai đoạn đích muốn chuyển đến.
  - Thông báo rõ quyền hạn: Nhân viên thông thường không được phép chuyển; Trưởng nhóm trở lên có thể ghi đè kèm lý do.

### AC-3: Quyền ghi đè có kiểm soát dành cho Trưởng nhóm trở lên (Override with Reason)
- **Kiểm tra vai trò người dùng (Role Hierarchy):**
  - Người dùng có vai trò: `ADMIN`, `DIRECTOR`, hoặc `TEAM_LEAD` (Trưởng nhóm trở lên) được phép ghi đè khi điều kiện chưa thỏa.
  - Người dùng có vai trò `SALES_REP` hoặc các vai trò thông thường khác **KHÔNG** có quyền ghi đè. Cố tình gửi `overrideReason` sẽ bị từ chối với lỗi `403 Forbidden`.
- **Ràng buộc lý do ghi đè (Override Reason):**
  - Khi Trưởng nhóm thực hiện ghi đè, bắt buộc phải cung cấp lý do (`overrideReason` không được để trống, độ dài tối thiểu 5 ký tự).
  - Nếu Trưởng nhóm chuyển giai đoạn khi chưa đủ điều kiện mà không cung cấp lý do -> Hệ thống từ chối và yêu cầu nhập lý do.
- **Lưu vết kiểm toán (Audit Trail):**
  - Lưu thông tin ghi đè vào bảng lịch sử cơ hội `opportunity_stage_history` (`opportunity_id`, `from_stage_id`, `to_stage_id`, `changed_by_user_id`, `is_overridden`, `override_reason`, `created_at`).
  - Cập nhật thông tin lần ghi đè gần nhất trên `opportunities` (`last_stage_override_reason`, `last_stage_overridden_by`, `last_stage_overridden_at`).
  - Ghi bản ghi vào `audit_logs` với entity `OPPORTUNITY`, action `STAGE_OVERRIDE`.

### AC-4: Trải nghiệm người dùng trên bảng Kanban Pipeline (UI/UX)
- Khi người dùng kéo thả card cơ hội hoặc click nút chuyển giai đoạn:
  - Nếu cơ hội chưa thỏa mãn điều kiện rời giai đoạn:
    - Nếu là **Nhân viên (Sales Rep)**: Hiển thị thông báo (toast/alert) từ chối rõ ràng kèm danh sách điều kiện còn thiếu. Card cơ hội tự động quay về giai đoạn cũ.
    - Nếu là **Trưởng nhóm trở lên**: Hiển thị Modal Cảnh báo & Ghi đè (`Stage Override Modal`):
      + Cảnh báo vi phạm điều kiện kèm danh sách điều kiện còn thiếu (badge màu cam/đỏ).
      + Form nhập "Lý do ghi đè (Bắt buộc)".
      + Nút "Hủy bỏ" và "Xác nhận ghi đè & Chuyển giai đoạn".
      + Khi xác nhận, gửi kèm `overrideReason` lên server; chuyển thành công thì cập nhật Kanban và hiển thị thông báo thành công.

---

## 3. Thiết kế Kỹ thuật (Technical Design)

### 3.1. Database Schema
1. **Bảng `pipeline_stages`**:
   - `exit_condition` VARCHAR(255): Mô tả điều kiện.
   - `condition_required` TINYINT(1): Bắt buộc thỏa điều kiện (1: có, 0: không).
2. **Bảng `opportunities`**:
   - Bổ sung các cột lưu vết ghi đè:
     - `last_stage_override_reason` TEXT NULL
     - `last_stage_overridden_by` BIGINT NULL (FK to `users.id`)
     - `last_stage_overridden_at` DATETIME NULL
3. **Bảng `opportunity_stage_history`**:
   - `id` BIGINT AUTO_INCREMENT PRIMARY KEY
   - `opportunity_id` BIGINT NOT NULL
   - `from_stage_id` BIGINT NULL
   - `to_stage_id` BIGINT NOT NULL
   - `is_overridden` TINYINT(1) NOT NULL DEFAULT 0
   - `override_reason` TEXT NULL
   - `changed_by_user_id` BIGINT NOT NULL
   - `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP

### 3.2. Backend API
- **Endpoint:** `POST /api/opportunities/{id}/stage`
- **Request Body:**
  ```json
  {
    "stageId": 2,
    "overrideReason": "Khách hàng bận đi công tác đột xuất, đã trao đổi kỹ qua điện thoại và chốt meeting tuần sau."
  }
  ```
- **Response Success (200 OK):**
  ```json
  {
    "success": true,
    "message": "Chuyển giai đoạn thành công",
    "data": { ...opportunityDetails }
  }
  ```
- **Response Condition Failure (400 Bad Request):**
  ```json
  {
    "success": false,
    "message": "Chưa thỏa mãn điều kiện bắt buộc khi rời giai đoạn 'Mới tiếp cận'",
    "data": {
      "requiresOverride": true,
      "canOverride": true,
      "currentStageName": "Mới tiếp cận",
      "targetStageName": "Đủ điều kiện",
      "exitCondition": "Phải có ít nhất một cuộc gặp được ghi nhận",
      "missingConditions": [
        "Chưa có cuộc gặp nào được ghi nhận cho cơ hội này"
      ]
    }
  }
  ```
- **Response Forbidden Override (403 Forbidden):**
  ```json
  {
    "success": false,
    "message": "Chỉ Trưởng nhóm trở lên mới có quyền ghi đè điều kiện rời giai đoạn."
  }
  ```

### 3.3. Validation Engine: `StageConditionValidator`
- Đóng gói logic kiểm tra điều kiện rời giai đoạn:
  - Đọc `condition_required` và `exit_condition` của `currentStage`.
  - Kiểm tra bảng `activities` (loại `MEETING` hoặc `CALL` liên kết với cơ hội).
  - Kiểm tra bảng `contacts`, `quotes`, `amount`.
  - Trả về đối tượng `StageValidationResult` chứa: `boolean isValid`, `List<String> missingConditions`.

---

## 4. Kịch bản Kiểm thử (Test Cases)
1. **TC1 - Sales Rep chuyển giai đoạn khi chưa có cuộc gặp:** Bị từ chối với lỗi 400 kèm thông báo thiếu cuộc gặp; `canOverride = false`.
2. **TC2 - Sales Rep có cuộc gặp hợp lệ trong DB:** Chuyển giai đoạn thành công 200 OK.
3. **TC3 - Sales Rep cố ý gửi `overrideReason` khi chưa đủ điều kiện:** Bị từ chối với 403 Forbidden.
4. **TC4 - Team Lead chuyển khi chưa đủ điều kiện nhưng không gửi lý do:** Nhận thông báo 400 kèm `canOverride = true` và danh sách thiếu.
5. **TC5 - Team Lead gửi `overrideReason` hợp lệ:** Chuyển thành công 200 OK, DB ghi nhận `is_overridden = 1` và `override_reason`.
6. **TC6 - Director / Admin chuyển có ghi đè:** Thành công tương tự Team Lead.
7. **TC7 - Giai đoạn không cấu hình bắt buộc (`condition_required = 0`):** Chuyển tự do mà không cần kiểm tra.
