-- 041_tasks_calendar_timeline_enhancement.sql
-- Sprint: Tasks with due dates & assignment, Personal & Team Calendar, Unified Customer 360 Timeline

-- 1. Thêm các cột cho activities để hỗ trợ quản lý Công việc (Tasks)
ALTER TABLE activities 
    ADD COLUMN priority VARCHAR(20) NOT NULL DEFAULT 'MEDIUM' AFTER status,
    ADD COLUMN postpone_reason VARCHAR(255) NULL AFTER outcome,
    ADD COLUMN assigned_by_user_id BIGINT NULL AFTER owner_user_id,
    ADD INDEX idx_act_priority (priority),
    ADD INDEX idx_act_due (due_date);

-- 2. Seed dữ liệu mẫu cho Công việc (Tasks)
-- 2.1 Công việc có hạn vào thứ Sáu tuần này: "Gửi báo giá dịch vụ CRM cho VPBank Thăng Long" (Ưu tiên cao, giao cho Sale)
INSERT INTO activities (subject, type, description, outcome, status, priority, due_date, duration_minutes, customer_id, contact_id, opportunity_id, owner_user_id, assigned_by_user_id, is_deleted, created_at)
VALUES 
('Gửi bảng báo giá CRM Enterprise cho khách vào thứ Sáu', 'TASK', 'Rà soát biểu phí tích hợp Core Banking và gửi file báo giá chính thức cho anh Phát trước 17h thứ Sáu.', NULL, 'OPEN', 'HIGH', DATE_ADD(CURDATE(), INTERVAL (5 - DAYOFWEEK(CURDATE()) + 7) % 7 DAY), 30, 1, 1, 1, 4, 3, 0, NOW()),

-- 2.2 Công việc đã hoàn thành
('Kiểm tra lại phụ lục hợp đồng mẫu', 'TASK', 'Đã rà soát xong các điều khoản bảo mật với phòng pháp chế.', 'Đã hoàn thành và gửi duyệt', 'COMPLETED', 'MEDIUM', DATE_SUB(NOW(), INTERVAL 1 DAY), 45, 1, 1, 1, 4, 4, 0, DATE_SUB(NOW(), INTERVAL 2 DAY)),

-- 2.3 Công việc bị hoãn kèm lý do cụ thể
('Gọi điện chốt lịch ký hợp đồng ba bên', 'TASK', 'Hẹn ban giám đốc và đối tác công nghệ chốt ngày ký hợp đồng.', 'Đã liên hệ nhưng khách hoãn lịch', 'POSTPONED', 'URGENT', DATE_ADD(NOW(), INTERVAL 3 DAY), 20, 1, 1, 1, 4, 3, 0, DATE_SUB(NOW(), INTERVAL 1 DAY));

UPDATE activities 
SET postpone_reason = 'Khách hàng bận họp Hội đồng quản trị đột xuất, yêu cầu dời lịch sang thứ Ba tuần sau.' 
WHERE subject = 'Gọi điện chốt lịch ký hợp đồng ba bên';

-- 2.4 Thêm một số cuộc hẹn / cuộc gặp để hiển thị trên Lịch (Calendar)
INSERT INTO activities (subject, type, description, outcome, status, priority, due_date, duration_minutes, customer_id, contact_id, opportunity_id, owner_user_id, assigned_by_user_id, is_deleted, created_at)
VALUES
('Họp demo giải pháp tích hợp CTI Tổng đài', 'MEETING', 'Demo trực tiếp tính năng click-to-call và ghi âm cuộc gọi cho đội CSKH VPBank', NULL, 'OPEN', 'HIGH', DATE_ADD(NOW(), INTERVAL 1 DAY), 60, 1, 1, 1, 4, 4, 0, NOW()),
('Cuộc gặp trao đổi yêu cầu với NEM Fashion', 'MEETING', 'Gặp chị Hương tại showroom Bà Triệu để khảo sát quy trình bán lẻ', NULL, 'OPEN', 'MEDIUM', DATE_ADD(NOW(), INTERVAL 2 DAY), 90, 2, 2, 2, 5, 3, 0, NOW());

-- 3. Đảm bảo có báo giá cho khách hàng 1 để hiển thị trên Unified Timeline
INSERT INTO quotes (quote_number, title, customer_id, opportunity_id, discount_percent, subtotal, total_amount, status, requires_approval, owner_user_id, is_deleted, created_at)
VALUES 
('BG-2026-VPB-01', 'Báo giá Triển khai Phần mềm CRM Enterprise VPBank (Gói chuẩn)', 1, 1, 5.00, 236842105, 225000000, 'APPROVED', 0, 4, 0, DATE_SUB(NOW(), INTERVAL 1 DAY))
ON DUPLICATE KEY UPDATE title = VALUES(title);

-- 4. Đảm bảo có lịch sử chuyển giai đoạn cơ hội để hiển thị trên Unified Timeline
INSERT INTO opportunity_field_history (opportunity_id, field_name, field_label, old_value, new_value, reason, changed_by_user_id, created_at)
VALUES 
(1, 'stage_id', 'Giai đoạn bán hàng', 'Đề xuất giải pháp', 'Thương lượng & Đàm phán', 'Khách hàng đã đồng ý về mặt kỹ thuật, chuyển sang đàm phán hợp đồng thương mại', 4, DATE_SUB(NOW(), INTERVAL 2 DAY)),
(1, 'amount', 'Giá trị cơ hội', '200,000,000', '225,000,000', 'Bổ sung thêm 50 user license và gói hỗ trợ 24/7', 4, DATE_SUB(NOW(), INTERVAL 1 DAY));
