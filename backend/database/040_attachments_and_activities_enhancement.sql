-- 040_attachments_and_activities_enhancement.sql
-- Sprint: Opportunity Attachments, Cost/Margin Excel Export, and Enhanced Mobile Activity Logging

-- 1. Modify attachments table to support Opportunities and larger files
ALTER TABLE attachments 
    MODIFY COLUMN customer_id BIGINT NULL,
    ADD COLUMN opportunity_id BIGINT NULL AFTER customer_id,
    ADD INDEX idx_att_opp (opportunity_id);

-- 2. Modify activities table to support contact linking, duration, and outcome
ALTER TABLE activities 
    ADD COLUMN contact_id BIGINT NULL AFTER customer_id,
    ADD COLUMN duration_minutes INT DEFAULT 0 AFTER due_date,
    ADD COLUMN outcome VARCHAR(255) NULL AFTER description,
    ADD INDEX idx_act_contact (contact_id);

-- 3. Seed sample attachments for opportunity 1 (VPBank Thăng Long)
INSERT INTO attachments (customer_id, opportunity_id, name, file_type, file_size, file_url, uploaded_by_user_id, notes, is_deleted, created_at)
VALUES 
(1, 1, 'Ho_so_thau_CRM_VPBank_v2.pdf', 'PDF', 4521980, 'uploads/attachments/Ho_so_thau_CRM_VPBank_v2.pdf', 1, 'Hồ sơ kỹ thuật và năng lực đấu thầu', 0, DATE_SUB(NOW(), INTERVAL 2 DAY)),
(1, 1, 'Bien_ban_hop_thuong_thao_hop_dong_VPBank.docx', 'DOCX', 1845200, 'uploads/attachments/Bien_ban_hop_thuong_thao_hop_dong_VPBank.docx', 2, 'Biên bản thống nhất phạm vi triển khai giai đoạn 1', 0, DATE_SUB(NOW(), INTERVAL 1 DAY)),
(2, 2, 'Bao_gia_CRM_Cloud_NEM_Fashion.pdf', 'PDF', 1240000, 'uploads/attachments/Bao_gia_CRM_Cloud_NEM_Fashion.pdf', 3, 'Báo giá chính thức đã ký duyệt', 0, DATE_SUB(NOW(), INTERVAL 3 DAY));

-- 4. Seed sample past activities with duration and outcome
INSERT INTO activities (subject, type, description, outcome, status, due_date, duration_minutes, customer_id, contact_id, opportunity_id, owner_user_id, is_deleted, created_at)
VALUES
('Họp trao đổi trực tiếp tại trụ sở VPBank', 'MEETING', 'Gặp Giám đốc CNTT VPBank trao đổi phương án tích hợp Core Banking và bảo mật SSO', 'Khách hàng đánh giá cao giải pháp, yêu cầu gửi lại bản đặc tả API trước thứ 6', 'COMPLETED', DATE_SUB(NOW(), INTERVAL 2 DAY), 60, 1, 1, 1, 1, 0, DATE_SUB(NOW(), INTERVAL 2 DAY)),
('Gọi điện thoại xác nhận lịch demo phòng ban', 'CALL', 'Gọi cho Trưởng phòng CSKH xác nhận tham dự buổi demo tính năng Omnichannel', 'Đã chốt lịch demo sáng thứ Ba tuần tới lúc 9h30', 'COMPLETED', DATE_SUB(NOW(), INTERVAL 1 DAY), 15, 1, 1, 1, 1, 0, DATE_SUB(NOW(), INTERVAL 1 DAY)),
('Gửi email tài liệu kiến trúc bảo mật & SLA', 'EMAIL', 'Gửi bộ tài liệu bảo mật SOC2, ISO27001 và cam kết thời gian phản hồi SLA', 'Đã chuyển tiếp cho đội IT Security xem xét', 'COMPLETED', DATE_SUB(NOW(), INTERVAL 5 HOUR), 10, 1, 1, 1, 2, 0, DATE_SUB(NOW(), INTERVAL 5 HOUR)),
('Ghi chú nhanh sau khi rời văn phòng NEM Fashion', 'NOTE', 'Gặp chị Hương tại showroom Bà Triệu. Khách muốn bổ sung thêm 3 chi nhánh mới vào gói CRM', 'Cần cập nhật báo giá bổ sung thêm 3 chi nhánh trong hôm nay', 'COMPLETED', DATE_SUB(NOW(), INTERVAL 3 HOUR), 45, 2, 2, 2, 3, 0, DATE_SUB(NOW(), INTERVAL 3 HOUR));
