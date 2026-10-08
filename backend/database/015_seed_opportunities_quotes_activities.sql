-- 015_seed_opportunities_quotes_activities.sql
-- Khởi tạo dữ liệu cơ hội, báo giá và hoạt động phục vụ Dashboard & Pipeline
USE crm_db;

SET NAMES utf8mb4;

-- 1. Chuẩn hóa tên giai đoạn Pipeline
UPDATE pipeline_stages SET name = 'Mới tiếp cận', code = 'NEW', win_probability = 10 WHERE id = 1;
UPDATE pipeline_stages SET name = 'Đủ điều kiện', code = 'QUALIFIED', win_probability = 30 WHERE id = 2;
UPDATE pipeline_stages SET name = 'Gửi báo giá', code = 'PROPOSAL', win_probability = 60 WHERE id = 3;
UPDATE pipeline_stages SET name = 'Thương lượng', code = 'NEGOTIATION', win_probability = 80 WHERE id = 4;
UPDATE pipeline_stages SET name = 'Thành công (Won)', code = 'WON', win_probability = 100, is_won = 1 WHERE id = 5;
UPDATE pipeline_stages SET name = 'Thất bại (Lost)', code = 'LOST', win_probability = 0, is_lost = 1 WHERE id = 6;

-- 2. Thêm dữ liệu Cơ hội bán hàng (Opportunities)
INSERT INTO opportunities (id, name, customer_id, contact_name, amount, stage_id, probability, expected_close_date, status, owner_user_id) VALUES
(1, 'Triển khai CRM Enterprise cho VPBank Thăng Long', 4, 'Nguyễn Thu Trang', 185000000.00, 4, 80, DATE_ADD(CURRENT_DATE, INTERVAL 15 DAY), 'OPEN', 4),
(2, 'Gói CRM Cloud & Đào tạo cho NEM Fashion', 5, 'Phạm Quốc Hùng', 72000000.00, 3, 60, DATE_ADD(CURRENT_DATE, INTERVAL 25 DAY), 'OPEN', 3),
(3, 'Tích hợp VoIP & Tổng đài Viettravel Sun', 3, 'Trần Minh Tuấn', 45000000.00, 2, 30, DATE_ADD(CURRENT_DATE, INTERVAL 45 DAY), 'OPEN', 6),
(4, 'Nâng cấp hệ thống BI & Báo cáo LogiTech', 9, 'Đặng Hoàng Yến', 95000000.00, 5, 100, DATE_SUB(CURRENT_DATE, INTERVAL 5 DAY), 'WON', 9),
(5, 'Triển khai CRM cho Dược phẩm An Sinh', 6, 'Lê Thị Mai', 120000000.00, 4, 80, DATE_ADD(CURRENT_DATE, INTERVAL 10 DAY), 'OPEN', 7),
(6, 'Gói CRM Chuỗi bán lẻ TocoToco Tea', 10, 'Nguyễn Hải Đăng', 65000000.00, 3, 60, DATE_ADD(CURRENT_DATE, INTERVAL 30 DAY), 'OPEN', 10),
(7, 'Bảo trì & Vận hành VIP GreenTech', 11, 'Vũ Thành Long', 36000000.00, 5, 100, DATE_SUB(CURRENT_DATE, INTERVAL 12 DAY), 'WON', 8),
(8, 'Tư vấn Chuyển đổi số Nam Á Machinery', 7, 'Đỗ Mạnh Cường', 150000000.00, 1, 10, DATE_ADD(CURRENT_DATE, INTERVAL 60 DAY), 'OPEN', 5)
ON DUPLICATE KEY UPDATE
    name = VALUES(name),
    customer_id = VALUES(customer_id),
    contact_name = VALUES(contact_name),
    amount = VALUES(amount),
    stage_id = VALUES(stage_id),
    probability = VALUES(probability),
    expected_close_date = VALUES(expected_close_date),
    status = VALUES(status),
    owner_user_id = VALUES(owner_user_id);

-- 3. Thêm dữ liệu Báo giá (Quotes)
INSERT INTO quotes (id, quote_number, title, customer_id, opportunity_id, subtotal, discount_percent, total_amount, status, requires_approval, owner_user_id) VALUES
(1, 'BG-2026-001', 'Báo giá Triển khai CRM Enterprise VPBank', 4, 1, 195000000.00, 5.13, 185000000.00, 'APPROVED', 1, 4),
(2, 'BG-2026-002', 'Báo giá Gói Cloud 100 Users NEM Fashion', 5, 2, 75000000.00, 4.00, 72000000.00, 'APPROVED', 0, 3),
(3, 'BG-2026-003', 'Báo giá Tích hợp VoIP & SMS Viettravel', 3, 3, 48000000.00, 6.25, 45000000.00, 'SENT', 0, 6),
(4, 'BG-2026-004', 'Báo giá Module Advanced BI LogiTech', 9, 4, 100000000.00, 5.00, 95000000.00, 'APPROVED', 1, 9),
(5, 'BG-2026-005', 'Báo giá Triển khai Dược phẩm An Sinh', 6, 5, 125000000.00, 4.00, 120000000.00, 'PENDING_APPROVAL', 1, 7),
(6, 'BG-2026-006', 'Báo giá CRM Chuỗi Cửa hàng TocoToco', 10, 6, 68000000.00, 4.41, 65000000.00, 'DRAFT', 0, 10)
ON DUPLICATE KEY UPDATE
    quote_number = VALUES(quote_number),
    title = VALUES(title),
    customer_id = VALUES(customer_id),
    opportunity_id = VALUES(opportunity_id),
    subtotal = VALUES(subtotal),
    discount_percent = VALUES(discount_percent),
    total_amount = VALUES(total_amount),
    status = VALUES(status),
    requires_approval = VALUES(requires_approval),
    owner_user_id = VALUES(owner_user_id);

-- 4. Thêm chi tiết dòng báo giá (Quote Items)
DELETE FROM quote_items WHERE quote_id IN (1, 2, 3, 4, 5, 6);

INSERT INTO quote_items (quote_id, product_id, quantity, unit_price, discount_percent, amount) VALUES
-- BG-1 (VPBank)
(1, 5, 100, 650000.00, 0.00, 65000000.00),
(1, 7, 1, 60000000.00, 0.00, 60000000.00),
(1, 12, 2, 35000000.00, 0.00, 70000000.00),
-- BG-2 (NEM Fashion)
(2, 4, 50, 350000.00, 0.00, 17500000.00),
(2, 6, 1, 25000000.00, 0.00, 25000000.00),
(2, 10, 1, 800000.00, 0.00, 800000.00),
(2, 11, 1, 18000000.00, 0.00, 18000000.00),
-- BG-3 (Viettravel)
(3, 3, 40, 150000.00, 0.00, 6000000.00),
(3, 9, 2, 1200000.00, 0.00, 2400000.00),
(3, 6, 1, 25000000.00, 0.00, 25000000.00),
-- BG-4 (LogiTech)
(4, 12, 1, 35000000.00, 0.00, 35000000.00),
(4, 7, 1, 60000000.00, 0.00, 60000000.00),
-- BG-5 (An Sinh)
(5, 5, 50, 650000.00, 0.00, 32500000.00),
(5, 7, 1, 60000000.00, 0.00, 60000000.00),
(5, 8, 2, 5000000.00, 0.00, 10000000.00),
-- BG-6 (TocoToco)
(6, 4, 30, 350000.00, 0.00, 10500000.00),
(6, 6, 1, 25000000.00, 0.00, 25000000.00),
(6, 10, 1, 800000.00, 0.00, 800000.00);

-- 5. Thêm dữ liệu Hoạt động (Activities)
INSERT INTO activities (id, subject, type, description, status, due_date, customer_id, opportunity_id, owner_user_id) VALUES
(1, 'Họp demo tính năng CRM Phân quyền và Bảo mật', 'MEETING', 'Trình bày giải pháp phân quyền dữ liệu cho ban dự án VPBank', 'COMPLETED', DATE_SUB(CURRENT_TIMESTAMP, INTERVAL 2 DAY), 4, 1, 4),
(2, 'Cuộc gọi xác nhận yêu cầu tích hợp Zalo OA', 'CALL', 'Xác nhận số điện thoại hotline và kịch bản gửi tin tự động cho NEM Fashion', 'COMPLETED', DATE_SUB(CURRENT_TIMESTAMP, INTERVAL 1 DAY), 5, 2, 3),
(3, 'Gửi dự thảo Hợp đồng và Báo giá chính thức', 'EMAIL', 'Đã gửi file PDF báo giá có chữ ký duyệt cho đại diện LogiTech', 'COMPLETED', CURRENT_TIMESTAMP, 9, 4, 9),
(4, 'Khảo sát hạ tầng tổng đài điện thoại Viettravel', 'TASK', 'Thu thập thông tin nhà mạng và cấu hình IP tổng đài VoIP', 'OPEN', DATE_ADD(CURRENT_TIMESTAMP, INTERVAL 2 DAY), 3, 3, 6),
(5, 'Họp đàm phán hợp đồng & tiến độ triển khai An Sinh', 'MEETING', 'Thương thảo điều khoản thanh toán 3 đợt và thời gian golive', 'OPEN', DATE_ADD(CURRENT_TIMESTAMP, INTERVAL 3 DAY), 6, 5, 7),
(6, 'Gọi điện chăm sóc định kỳ khách hàng VIP GreenTech', 'CALL', 'Kiểm tra độ hài lòng sau 1 tháng vận hành tính năng BI', 'OPEN', DATE_ADD(CURRENT_TIMESTAMP, INTERVAL 5 DAY), 11, 7, 8),
(7, 'Tư vấn giải pháp quản lý chuỗi đại lý TocoToco', 'MEETING', 'Họp online qua Google Meet cùng giám đốc vận hành TocoToco', 'COMPLETED', DATE_SUB(CURRENT_TIMESTAMP, INTERVAL 3 DAY), 10, 6, 10),
(8, 'Gửi email tài liệu kỹ thuật & API tổng đài Nam Á', 'EMAIL', 'Gửi tài liệu API Swagger và sơ đồ kết nối hệ thống', 'OPEN', DATE_ADD(CURRENT_TIMESTAMP, INTERVAL 4 DAY), 7, 8, 5)
ON DUPLICATE KEY UPDATE
    subject = VALUES(subject),
    type = VALUES(type),
    description = VALUES(description),
    status = VALUES(status),
    due_date = VALUES(due_date),
    customer_id = VALUES(customer_id),
    opportunity_id = VALUES(opportunity_id),
    owner_user_id = VALUES(owner_user_id);
