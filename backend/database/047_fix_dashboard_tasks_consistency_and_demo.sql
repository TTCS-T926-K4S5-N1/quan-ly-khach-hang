-- ==============================================================================
-- 047_fix_dashboard_tasks_consistency_and_demo.sql
-- 1. Chuẩn hóa dữ liệu công việc (subject, customer_id, opportunity_id) để không
--    bị tình trạng tên việc một đằng, công ty một nẻo (FPT Software đi với VPBank,
--    Techcombank đi với NEM Fashion...).
-- 2. Đưa các công việc cũ sang COMPLETED, chỉ để lại 2 công việc quá hạn tiêu biểu
--    (1 URGENT của VPBank, 1 HIGH của NEM Fashion) để demo tính năng cảnh báo mà
--    không làm ngập tràn Bảng điều khiển.
-- ==============================================================================

USE crm_db;
SET NAMES utf8mb4;
SET CHARACTER SET utf8mb4;

-- Chuẩn hóa liên kết khách hàng & cơ hội cho các công việc
-- Khách 4 = VPBank Thăng Long, Cơ hội 1 = Triển khai CRM Enterprise cho VPBank Thăng Long
-- Khách 5 = Nem Fashion, Cơ hội 2 = Gói CRM Cloud & Đào tạo cho NEM Fashion
-- Khách 3 = Viettravel Sun, Cơ hội 3 = Tích hợp VoIP & Tổng đài Viettravel Sun

UPDATE activities 
SET subject = 'Gửi hợp đồng nguyên tắc triển khai CRM cho VPBank Thăng Long',
    customer_id = 4,
    opportunity_id = 1,
    status = 'OPEN',
    priority = 'URGENT',
    due_date = DATE_SUB(NOW(), INTERVAL 1 DAY)
WHERE id = 612;

UPDATE activities 
SET subject = 'Phê duyệt đề xuất chiết khấu dự án NEM Fashion',
    customer_id = 5,
    opportunity_id = 2,
    status = 'OPEN',
    priority = 'HIGH',
    due_date = DATE_SUB(NOW(), INTERVAL 12 HOUR)
WHERE id = 613;

UPDATE activities 
SET subject = 'Gọi điện xác nhận lịch triển khai với VPBank Thăng Long',
    customer_id = 4,
    opportunity_id = 1,
    status = 'COMPLETED',
    outcome = 'Đã chốt lịch họp kỹ thuật'
WHERE id = 614;

UPDATE activities 
SET subject = 'Hoàn thiện hồ sơ năng lực gói CRM Cloud cho NEM Fashion',
    customer_id = 5,
    opportunity_id = 2,
    status = 'COMPLETED',
    outcome = 'Đã gửi bộ hồ sơ năng lực cho khách'
WHERE id = 615;

UPDATE activities 
SET subject = 'Bổ sung chứng nhận an toàn thông tin ISO 27001 cho VPBank Thăng Long',
    customer_id = 4,
    opportunity_id = 1,
    status = 'COMPLETED',
    outcome = 'Đã bổ sung chứng chỉ kiểm định'
WHERE id = 616;

UPDATE activities 
SET subject = 'Chuẩn bị tài liệu buổi họp demo giải pháp VPBank Thăng Long',
    customer_id = 4,
    opportunity_id = 1,
    status = 'COMPLETED',
    outcome = 'Đã chuẩn bị xong kịch bản demo'
WHERE id = 617;

UPDATE activities 
SET subject = 'Gửi email nhắc khách hàng Nem Fashion về buổi webinar',
    customer_id = 5,
    opportunity_id = 2,
    status = 'COMPLETED',
    outcome = 'Đã gửi email tự động'
WHERE id = 618;

UPDATE activities 
SET subject = 'Gọi điện chăm sóc định kỳ cho Viettravel Sun',
    customer_id = 3,
    opportunity_id = 3,
    status = 'COMPLETED',
    outcome = 'Khách phản hồi hệ thống ổn định'
WHERE id = 619;

-- Đánh dấu hoàn thành các công việc tồn đọng cũ (id 4, 5, 6, 8)
UPDATE activities 
SET status = 'COMPLETED', outcome = 'Đã hoàn thành trong kỳ khảo sát'
WHERE id IN (4, 5, 6, 8);
