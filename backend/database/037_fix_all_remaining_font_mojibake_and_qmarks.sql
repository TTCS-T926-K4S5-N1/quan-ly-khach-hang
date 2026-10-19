-- ==============================================================================
-- 037_fix_all_remaining_font_mojibake_and_qmarks.sql
-- Sửa triệt để tất cả các chuỗi tiếng Việt bị lỗi font, dấu hỏi (?) hoặc mojibake
-- trong cơ sở dữ liệu crm_db:
-- 1. Bảng permissions (các quyền về Lead, Web-to-lead, SLA, Báo cáo)
-- 2. Bảng lead_routing_settings (mô tả cài đặt SLA và thu hồi tự động)
-- 3. Bảng web_lead_submissions (dữ liệu demo lead thu thập từ form)
-- 4. Bảng sales_targets (ghi chú chỉ tiêu doanh số nhân viên và nhóm)
-- 5. Bảng activities (sửa các chuỗi Bi???u m???u thành Biểu mẫu)
-- ==============================================================================

USE crm_db;
SET NAMES utf8mb4;
SET CHARACTER SET utf8mb4;

-- 1. Sửa lỗi bảng permissions
UPDATE permissions SET name = 'Quản lý biểu mẫu thu thập Lead' WHERE code = 'lead.form.manage';
UPDATE permissions SET name = 'Nhập khách hàng tiềm năng từ Excel' WHERE code = 'lead.import';
UPDATE permissions SET name = 'Xem cấu hình phân bổ và chấm điểm lead' WHERE code = 'lead.routing.read';
UPDATE permissions SET name = 'Quản lý quy tắc phân bổ và tiêu chí chấm điểm lead' WHERE code = 'lead.routing.manage';
UPDATE permissions SET name = 'Chuyển đổi Lead thành Khách hàng & Cơ hội' WHERE code = 'lead.convert';
UPDATE permissions SET name = 'Quản lý cảnh báo SLA và Thu hồi Lead' WHERE code = 'lead.sla.manage';
UPDATE permissions SET name = 'Xem báo cáo hiệu quả nguồn lead & chiến dịch' WHERE code = 'report.lead_source';

-- 2. Sửa lỗi bảng lead_routing_settings
UPDATE lead_routing_settings 
SET description = 'Thời hạn SLA phản hồi tối đa của nhân viên (giờ)' 
WHERE setting_key = 'sla_response_hours';

UPDATE lead_routing_settings 
SET description = 'Thời gian tự động thu hồi lead về hàng chờ nếu không phản hồi (giờ)' 
WHERE setting_key = 'sla_auto_reassign_hours';

-- 3. Sửa lỗi bảng web_lead_submissions
UPDATE web_lead_submissions 
SET full_name = 'Nguyễn Hoàng Long',
    company = 'Công ty TNHH Giải Pháp Công Nghệ Long Phát',
    interest = 'Cần tư vấn triển khai phân hệ Báo giá và Cơ hội bán hàng cho 20 nhân sự'
WHERE id = 1;

UPDATE web_lead_submissions 
SET full_name = 'Trần Thị Mai Phương',
    company = 'Chuỗi cửa hàng Bán lẻ Gia Dụng Việt',
    interest = 'Muốn dùng thử tính năng lưu trữ hồ sơ khách hàng 360 độ và chống trùng lặp dữ liệu'
WHERE id = 2;

-- 4. Sửa lỗi bảng sales_targets
UPDATE sales_targets SET notes = 'Chỉ tiêu Tháng 10 - Lê Hoàng Nam' WHERE id = 1;
UPDATE sales_targets SET notes = 'Chỉ tiêu Tháng 10 - Phạm Mai Phương' WHERE id = 2;
UPDATE sales_targets SET notes = 'Chỉ tiêu Tháng 10 - Đỗ Thị Tuyết' WHERE id = 3;
UPDATE sales_targets SET notes = 'Chỉ tiêu Tháng 10 - Hoàng Kim Yến' WHERE id = 4;
UPDATE sales_targets SET notes = 'Chỉ tiêu Tháng 10 - Trương Tuấn Anh' WHERE id = 5;
UPDATE sales_targets SET notes = 'Chỉ tiêu Tháng 10 - Quản trị viên' WHERE id = 6;
UPDATE sales_targets SET notes = 'Chỉ tiêu Tháng 11 - Lê Hoàng Nam' WHERE id = 7;
UPDATE sales_targets SET notes = 'Chỉ tiêu Tháng 11 - Phạm Mai Phương' WHERE id = 8;
UPDATE sales_targets SET notes = 'Chỉ tiêu Tháng 11 - Đỗ Thị Tuyết' WHERE id = 9;
UPDATE sales_targets SET notes = 'Chỉ tiêu Tháng 11 - Hoàng Kim Yến' WHERE id = 10;
UPDATE sales_targets SET notes = 'Chỉ tiêu Tháng 11 - Trương Tuấn Anh' WHERE id = 11;
UPDATE sales_targets SET notes = 'Chỉ tiêu Tháng 11 - Quản trị viên' WHERE id = 12;
UPDATE sales_targets SET notes = 'Chỉ tiêu Quý 4 - Lê Hoàng Nam' WHERE id = 13;
UPDATE sales_targets SET notes = 'Chỉ tiêu Quý 4 - Phạm Mai Phương' WHERE id = 14;
UPDATE sales_targets SET notes = 'Chỉ tiêu Quý 4 - Đỗ Thị Tuyết' WHERE id = 15;
UPDATE sales_targets SET notes = 'Chỉ tiêu Quý 4 - Hoàng Kim Yến' WHERE id = 16;
UPDATE sales_targets SET notes = 'Chỉ tiêu Quý 4 - Trương Tuấn Anh' WHERE id = 17;
UPDATE sales_targets SET notes = 'Chỉ tiêu Quý 4 - Quản trị viên' WHERE id = 18;
UPDATE sales_targets SET notes = 'Chỉ tiêu Tháng 10 - Nhóm KD B2B Hà Nội' WHERE id = 19;
UPDATE sales_targets SET notes = 'Chỉ tiêu Tháng 10 - Nhóm KD B2C & Đại lý Miền Bắc' WHERE id = 20;
UPDATE sales_targets SET notes = 'Chỉ tiêu Tháng 10 - Nhóm KD Đà Nẵng & Duyên Hải' WHERE id = 21;
UPDATE sales_targets SET notes = 'Chỉ tiêu Tháng 10 - Nhóm KD Doanh nghiệp TP.HCM' WHERE id = 22;
UPDATE sales_targets SET notes = 'Chỉ tiêu Tháng 10 - Nhóm KD SME & Bán lẻ Phía Nam' WHERE id = 23;
UPDATE sales_targets SET notes = 'Chỉ tiêu Tháng 11 - Nhóm KD B2B Hà Nội' WHERE id = 24;
UPDATE sales_targets SET notes = 'Chỉ tiêu Tháng 11 - Nhóm KD B2C & Đại lý Miền Bắc' WHERE id = 25;
UPDATE sales_targets SET notes = 'Chỉ tiêu Tháng 11 - Nhóm KD Đà Nẵng & Duyên Hải' WHERE id = 26;
UPDATE sales_targets SET notes = 'Chỉ tiêu Tháng 11 - Nhóm KD Doanh nghiệp TP.HCM' WHERE id = 27;
UPDATE sales_targets SET notes = 'Chỉ tiêu Tháng 11 - Nhóm KD SME & Bán lẻ Phía Nam' WHERE id = 28;
UPDATE sales_targets SET notes = 'Chỉ tiêu Quý 4 - Nhóm KD B2B Hà Nội' WHERE id = 29;
UPDATE sales_targets SET notes = 'Chỉ tiêu Quý 4 - Nhóm KD B2C & Đại lý Miền Bắc' WHERE id = 30;
UPDATE sales_targets SET notes = 'Chỉ tiêu Quý 4 - Nhóm KD Đà Nẵng & Duyên Hải' WHERE id = 31;
UPDATE sales_targets SET notes = 'Chỉ tiêu Quý 4 - Nhóm KD Doanh nghiệp TP.HCM' WHERE id = 32;
UPDATE sales_targets SET notes = 'Chỉ tiêu Quý 4 - Nhóm KD SME & Bán lẻ Phía Nam' WHERE id = 33;

-- 5. Sửa lỗi bảng activities
UPDATE activities 
SET description = REPLACE(description, 'Bi???u m???u', 'Biểu mẫu')
WHERE description LIKE '%Bi???u m???u%';

UPDATE activities 
SET subject = REPLACE(subject, 'Bi???u m???u', 'Biểu mẫu')
WHERE subject LIKE '%Bi???u m???u%';
