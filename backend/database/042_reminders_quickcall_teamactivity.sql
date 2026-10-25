-- 042_reminders_quickcall_teamactivity.sql
-- Sprint: Overdue task alerts & in-app reminders, Mobile 3-touch quick call logger, Team Leader Activity Monitoring

-- 1. Bổ sung cấu hình nhắc nhở cá nhân cho users (mặc định nhắc trước 60 phút)
ALTER TABLE users 
    ADD COLUMN reminder_lead_minutes INT NOT NULL DEFAULT 60 AFTER status;

-- 2. Seed các công việc QUÁ HẠN (Overdue) để hiển thị nổi bật trên Bảng điều khiển (Dashboard)
-- 2.1 Công việc quá hạn của Admin (ID 1)
INSERT INTO activities (subject, type, description, status, priority, due_date, duration_minutes, customer_id, opportunity_id, owner_user_id, is_deleted, created_at)
VALUES 
('Gửi hợp đồng nguyên tắc cho FPT Software', 'TASK', 'Hợp đồng NDA và thỏa thuận dịch vụ cung ứng giải pháp CRM.', 'OPEN', 'URGENT', DATE_SUB(NOW(), INTERVAL 2 DAY), 30, 1, 1, 1, 0, DATE_SUB(NOW(), INTERVAL 4 DAY)),
('Phê duyệt đề xuất chiết khấu dự án Viettel Post', 'TASK', 'Yêu cầu phê duyệt chiết khấu 8% từ chuyên viên kinh doanh.', 'OPEN', 'HIGH', DATE_SUB(NOW(), INTERVAL 6 HOUR), 15, 2, 2, 1, 0, DATE_SUB(NOW(), INTERVAL 1 DAY)),

-- 2.2 Công việc quá hạn của Sales Rep Lê Hoàng Nam (ID 4)
('Gọi điện xác nhận lịch triển khai với VPBank', 'TASK', 'Liên hệ anh Phát để chốt phòng họp kỹ thuật.', 'OPEN', 'URGENT', DATE_SUB(NOW(), INTERVAL 1 DAY), 20, 1, 1, 4, 0, DATE_SUB(NOW(), INTERVAL 3 DAY)),
('Hoàn thiện hồ sơ năng lực gửi Techcombank', 'TASK', 'Hồ sơ dự thầu phần mềm quản lý quan hệ khách hàng.', 'OPEN', 'MEDIUM', DATE_SUB(NOW(), INTERVAL 3 DAY), 60, 2, 2, 4, 0, DATE_SUB(NOW(), INTERVAL 5 DAY)),

-- 2.3 Công việc quá hạn của Sales Rep Trần Thị Mai (ID 5)
('Bổ sung chứng nhận an toàn thông tin ISO 27001', 'TASK', 'Khách hàng yêu cầu gửi kèm phụ lục an ninh mạng.', 'OPEN', 'HIGH', DATE_SUB(NOW(), INTERVAL 12 HOUR), 30, 2, 2, 5, 0, DATE_SUB(NOW(), INTERVAL 2 DAY));

-- 3. Seed các công việc SẮP ĐẾN HẠN (Upcoming soon trong vòng 1-2 tiếng hoặc trong ngày)
INSERT INTO activities (subject, type, description, status, priority, due_date, duration_minutes, customer_id, opportunity_id, owner_user_id, is_deleted, created_at)
VALUES 
('Chuẩn bị tài liệu buổi họp demo giải pháp lúc 15h', 'TASK', 'Kiểm tra tài khoản demo và kịch bản CSKH đa kênh.', 'OPEN', 'HIGH', DATE_ADD(NOW(), INTERVAL 45 MINUTE), 30, 1, 1, 1, 0, NOW()),
('Gửi email nhắc khách hàng về buổi webinar thứ Sáu', 'TASK', 'Email thông báo kèm link Zoom và tài liệu hướng dẫn.', 'OPEN', 'MEDIUM', DATE_ADD(NOW(), INTERVAL 2 HOUR), 20, 2, 2, 1, 0, NOW()),
('Gọi điện chăm sóc định kỳ cho Vinamilk', 'TASK', 'Hỏi thăm phản hồi sau 1 tuần dùng thử bản Enterprise.', 'OPEN', 'MEDIUM', DATE_ADD(NOW(), INTERVAL 90 MINUTE), 15, 3, 3, 4, 0, NOW());

-- 4. Seed các cuộc gọi và hoạt động chăm sóc khách của các thành viên nhóm kinh doanh
INSERT INTO activities (subject, type, description, outcome, status, priority, duration_minutes, customer_id, opportunity_id, owner_user_id, is_deleted, created_at)
VALUES 
('Gọi tư vấn gói CRM Pro cho NEM Fashion', 'CALL', 'Khách hàng quan tâm phân hệ tích hợp Zalo ZNS và POS.', 'Nghe máy - Quan tâm', 'COMPLETED', 'HIGH', 15, 2, 2, 4, 0, DATE_SUB(NOW(), INTERVAL 1 DAY)),
('Gặp mặt trao đổi tiến độ với Tập đoàn Sunhouse', 'MEETING', 'Họp bàn về tiến độ import dữ liệu 50.000 khách lẻ.', 'Đã thống nhất tiến độ', 'COMPLETED', 'HIGH', 60, 3, 3, 4, 0, DATE_SUB(NOW(), INTERVAL 2 DAY)),
('Gửi báo giá tùy biến tính năng thẻ VIP', 'EMAIL', 'Gửi bảng chiết tính chi phí phát triển module Loyalty.', 'Đã gửi email', 'COMPLETED', 'MEDIUM', 10, 1, 1, 5, 0, DATE_SUB(NOW(), INTERVAL 1 DAY)),
('Gọi điện xác minh thông tin doanh nghiệp mới', 'CALL', 'Khách hẹn gọi lại vào sáng mai sau 9h.', 'Hẹn gọi lại', 'COMPLETED', 'LOW', 5, 2, 2, 5, 0, DATE_SUB(NOW(), INTERVAL 4 HOUR)),
('Tư vấn chuyển đổi số cho Chuỗi nhà thuốc Pharma', 'CALL', 'Khách không nghe máy, gửi lại tin nhắn SMS giới thiệu.', 'Không nghe máy', 'COMPLETED', 'LOW', 3, 3, 3, 5, 0, DATE_SUB(NOW(), INTERVAL 2 HOUR));
