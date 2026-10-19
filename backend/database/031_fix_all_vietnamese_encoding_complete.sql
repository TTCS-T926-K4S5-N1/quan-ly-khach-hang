-- 031_fix_all_vietnamese_encoding_complete.sql
-- Khắc phục triệt để toàn bộ lỗi font, mã hóa tiếng Việt và Mojibake trong hệ thống
USE crm_db;

SET NAMES utf8mb4;

-- 1. Bảng Quy tắc Phân bổ Lead (lead_assignment_rules)
UPDATE lead_assignment_rules SET
    name = 'Phân bổ Khách hàng Miền Bắc & Hà Nội (Round Robin)',
    description = 'Tự động chia đều cho các chuyên viên kinh doanh thuộc Đội Miền Bắc'
WHERE id = 1;

UPDATE lead_assignment_rules SET
    name = 'Phân bổ Khách hàng Miền Nam & TP.HCM (Round Robin)',
    description = 'Tự động chia đều cho các chuyên viên kinh doanh thuộc Đội Miền Nam'
WHERE id = 2;

UPDATE lead_assignment_rules SET
    name = 'Phân bổ Khách hàng Đà Nẵng & Miền Trung (Direct)',
    description = 'Chuyển trực tiếp cho Đỗ Thị Tuyết phụ trách thị trường miền Trung'
WHERE id = 3;

UPDATE lead_assignment_rules SET
    name = 'Phân bổ Lead Ngành Công nghệ thông tin B2B (Round Robin)',
    description = 'Chuyên viên phụ trách khách hàng ngành phần mềm công nghệ'
WHERE id = 4;

-- 2. Bảng Ngưỡng Phân Hạng Điểm Lead (lead_score_thresholds)
UPDATE lead_score_thresholds SET
    label = 'Nóng (Hot Lead)',
    icon = '🔥',
    description = 'Khả năng chốt cực cao, cần liên hệ ngay trong 15 phút'
WHERE grade = 'HOT';

UPDATE lead_score_thresholds SET
    label = 'Ấm (Warm Lead)',
    icon = '☀️',
    description = 'Có nhu cầu rõ ràng, cần liên hệ trong 4 giờ'
WHERE grade = 'WARM';

UPDATE lead_score_thresholds SET
    label = 'Lạnh (Cold Lead)',
    icon = '❄️',
    description = 'Tiềm năng thấp/mới tìm hiểu, ưu tiên nuôi dưỡng tự động'
WHERE grade = 'COLD';

-- 3. Bảng Tiêu chí Chấm điểm Lead (lead_scoring_rules)
UPDATE lead_scoring_rules SET criterion_name = 'Công nghệ thông tin & Viễn thông' WHERE criterion_key = '1' AND category = 'INDUSTRY';
UPDATE lead_scoring_rules SET criterion_name = 'Bất động sản & Xây dựng' WHERE criterion_key = '2' AND category = 'INDUSTRY';
UPDATE lead_scoring_rules SET criterion_name = 'Sản xuất & Chế tạo' WHERE criterion_key = '6' AND category = 'INDUSTRY';
UPDATE lead_scoring_rules SET criterion_name = 'Bán lẻ & Thương mại điện tử' WHERE criterion_key = '3' AND category = 'INDUSTRY';
UPDATE lead_scoring_rules SET criterion_name = 'Tài chính - Ngân hàng - Bảo hiểm' WHERE criterion_key = '4' AND category = 'INDUSTRY';

UPDATE lead_scoring_rules SET criterion_name = 'Trên 500 nhân sự (Doanh nghiệp lớn)' WHERE criterion_key = '14' AND category = 'COMPANY_SIZE';
UPDATE lead_scoring_rules SET criterion_name = '200 - 500 nhân sự' WHERE criterion_key = '13' AND category = 'COMPANY_SIZE';
UPDATE lead_scoring_rules SET criterion_name = '50 - 200 nhân sự' WHERE criterion_key = '12' AND category = 'COMPANY_SIZE';
UPDATE lead_scoring_rules SET criterion_name = '20 - 50 nhân sự' WHERE criterion_key = '11' AND category = 'COMPANY_SIZE';
UPDATE lead_scoring_rules SET criterion_name = 'Dưới 20 nhân sự' WHERE criterion_key = '10' AND category = 'COMPANY_SIZE';

UPDATE lead_scoring_rules SET criterion_name = 'Người quen giới thiệu (Độ tin cậy cao)' WHERE criterion_key = 'GIOI_THIEU' AND category = 'LEAD_SOURCE';
UPDATE lead_scoring_rules SET criterion_name = 'Hội thảo / Triển lãm ngành (VietBuild, TechFest)' WHERE criterion_key = 'HOI_THAO' AND category = 'LEAD_SOURCE';
UPDATE lead_scoring_rules SET criterion_name = 'Website / Google Tìm kiếm tự nhiên' WHERE criterion_key = 'WEBSITE' AND category = 'LEAD_SOURCE';
UPDATE lead_scoring_rules SET criterion_name = 'Quảng cáo Facebook Lead Ads' WHERE criterion_key = 'FACEBOOK' AND category = 'LEAD_SOURCE';
UPDATE lead_scoring_rules SET criterion_name = 'Telesales / Tiếp cận trực tiếp' WHERE criterion_key = 'COLD_CALL' AND category = 'LEAD_SOURCE';

UPDATE lead_scoring_rules SET criterion_name = 'Có dự toán rõ ràng & Cần triển khai gấp' WHERE criterion_key = 'HIGH' AND category = 'INTEREST_LEVEL';
UPDATE lead_scoring_rules SET criterion_name = 'Đang so sánh giải pháp với đối thủ' WHERE criterion_key = 'MEDIUM' AND category = 'INTEREST_LEVEL';
UPDATE lead_scoring_rules SET criterion_name = 'Chỉ xin bảng giá tham khảo' WHERE criterion_key = 'LOW' AND category = 'INTEREST_LEVEL';

-- 4. Bảng Giai đoạn Pipeline (pipeline_stages)
UPDATE pipeline_stages SET name = 'Mới tiếp cận' WHERE id = 1;
UPDATE pipeline_stages SET name = 'Đủ điều kiện' WHERE id = 2;
UPDATE pipeline_stages SET name = 'Gửi báo giá' WHERE id = 3;
UPDATE pipeline_stages SET name = 'Thương lượng' WHERE id = 4;
UPDATE pipeline_stages SET name = 'Thành công (Won)' WHERE id = 5;
UPDATE pipeline_stages SET name = 'Thất bại (Lost)' WHERE id = 6;

-- 5. Bảng Người dùng (users)
UPDATE users SET full_name = 'CRM Administrator', display_name = 'Quản trị hệ thống' WHERE id = 1;
UPDATE users SET full_name = 'Nguyễn Văn Hùng', display_name = 'Nguyễn Văn Hùng' WHERE id = 2;
UPDATE users SET full_name = 'Trần Thị Thu Hà', display_name = 'Trần Thị Thu Hà' WHERE id = 3;
UPDATE users SET full_name = 'Lê Hoàng Nam', display_name = 'Lê Hoàng Nam' WHERE id = 4;
UPDATE users SET full_name = 'Phạm Mai Phương', display_name = 'Phạm Mai Phương' WHERE id = 5;
UPDATE users SET full_name = 'Phan Văn Trung', display_name = 'Phan Văn Trung' WHERE id = 6;
UPDATE users SET full_name = 'Đỗ Thị Tuyết', display_name = 'Đỗ Thị Tuyết' WHERE id = 7;
UPDATE users SET full_name = 'Vũ Minh Trí', display_name = 'Vũ Minh Trí' WHERE id = 8;
UPDATE users SET full_name = 'Hoàng Kim Yến', display_name = 'Hoàng Kim Yến' WHERE id = 9;
UPDATE users SET full_name = 'Trương Tuấn Anh', display_name = 'Trương Tuấn Anh' WHERE id = 10;

-- 6. Bảng Nhóm / Cơ cấu kinh doanh (teams)
UPDATE teams SET name = 'Khối Kinh doanh Toàn quốc', description = 'Bộ phận quản lý hoạt động kinh doanh toàn quốc' WHERE id = 1;
UPDATE teams SET name = 'Phòng Kinh doanh Miền Bắc', description = 'Phụ trách thị trường từ Hà Tĩnh trở ra Bắc' WHERE id = 2;
UPDATE teams SET name = 'Nhóm Kinh doanh B2B Hà Nội', description = 'Tập trung khách hàng doanh nghiệp khối B2B tại Hà Nội' WHERE id = 3;
UPDATE teams SET name = 'Nhóm Kinh doanh B2C & Đại lý Miền Bắc', description = 'Phát triển mạng lưới đại lý và khách hàng bán lẻ' WHERE id = 4;
UPDATE teams SET name = 'Phòng Kinh doanh Miền Trung', description = 'Phụ trách khu vực miền Trung và Tây Nguyên' WHERE id = 5;
UPDATE teams SET name = 'Nhóm Kinh doanh Đà Nẵng & Duyên Hải', description = 'Địa bàn Đà Nẵng, Quảng Nam, Quảng Ngãi' WHERE id = 6;
UPDATE teams SET name = 'Phòng Kinh doanh Miền Nam', description = 'Phụ trách thị trường Đông Nam Bộ và Tây Nam Bộ' WHERE id = 7;
UPDATE teams SET name = 'Nhóm Kinh doanh Doanh nghiệp TP.HCM', description = 'Khách hàng Enterprise tại TP. Hồ Chí Minh' WHERE id = 8;
UPDATE teams SET name = 'Nhóm Kinh doanh SME & Bán lẻ Phía Nam', description = 'Doanh nghiệp vừa và nhỏ khu vực phía Nam' WHERE id = 9;

-- 7. Bảng Danh mục dùng chung (master_data)
UPDATE master_data SET name = 'Công nghệ thông tin & Viễn thông' WHERE type = 'industry' AND code = 'CNTT';
UPDATE master_data SET name = 'Bất động sản & Xây dựng' WHERE type = 'industry' AND code = 'BDS';
UPDATE master_data SET name = 'Bán lẻ & Thương mại điện tử' WHERE type = 'industry' AND code = 'BAN_LE';
UPDATE master_data SET name = 'Tài chính - Ngân hàng - Bảo hiểm' WHERE type = 'industry' AND code = 'TAI_CHINH';
UPDATE master_data SET name = 'Y tế & Dược phẩm' WHERE type = 'industry' AND code = 'Y_TE';
UPDATE master_data SET name = 'Sản xuất & Chế tạo' WHERE type = 'industry' AND code = 'SAN_XUAT';
UPDATE master_data SET name = 'Giáo dục & Đào tạo' WHERE type = 'industry' AND code = 'GIAO_DUC';
UPDATE master_data SET name = 'Du lịch & Khách sạn' WHERE type = 'industry' AND code = 'DU_LICH';
UPDATE master_data SET name = 'Vận tải & Logistics' WHERE type = 'industry' AND code = 'LOGISTICS';

UPDATE master_data SET name = 'Dưới 20 nhân sự' WHERE type = 'company-size' AND code = 'DUOI_20';
UPDATE master_data SET name = '20 - 50 nhân sự' WHERE type = 'company-size' AND code = '20_50';
UPDATE master_data SET name = '50 - 200 nhân sự' WHERE type = 'company-size' AND code = '50_200';
UPDATE master_data SET name = '200 - 500 nhân sự' WHERE type = 'company-size' AND code = '200_500';
UPDATE master_data SET name = 'Trên 500 nhân sự' WHERE type = 'company-size' AND code = 'TREN_500';

UPDATE master_data SET name = 'Toàn quốc' WHERE type = 'region' AND code = 'TOAN_QUOC';
UPDATE master_data SET name = 'Khu vực Miền Bắc' WHERE type = 'region' AND code = 'MIEN_BAC';
UPDATE master_data SET name = 'Khu vực Hà Nội' WHERE type = 'region' AND code = 'HA_NOI';
UPDATE master_data SET name = 'Khu vực Miền Trung' WHERE type = 'region' AND code = 'MIEN_TRUNG';
UPDATE master_data SET name = 'Khu vực Đà Nẵng & Duyên Hải' WHERE type = 'region' AND code = 'DA_NANG';
UPDATE master_data SET name = 'Khu vực Miền Nam' WHERE type = 'region' AND code = 'MIEN_NAM';
UPDATE master_data SET name = 'Khu vực TP. Hồ Chí Minh' WHERE type = 'region' AND code = 'TP_HCM';
UPDATE master_data SET name = 'Khu vực Đông Nam Bộ' WHERE type = 'region' AND code = 'DONG_NAM_BO';
UPDATE master_data SET name = 'Khu vực Đồng bằng Sông Cửu Long' WHERE type = 'region' AND code = 'MEKONG';
UPDATE master_data SET name = 'Khu vực Tây Nguyên' WHERE type = 'region' AND code = 'TAY_NGUYEN';

-- 8. Bảng Chiến dịch Marketing (campaigns)
UPDATE campaigns SET
    name = 'Hội thảo & Triển lãm Ngành Xây dựng VietBuild 2026',
    description = 'Thu thập thông tin khách hàng B2B ngành xây dựng và thiết bị tại triển lãm'
WHERE id = 1;

UPDATE campaigns SET
    name = 'Chiến dịch Quảng cáo Facebook Lead Ads B2B Quý 4',
    description = 'Quảng cáo form lead trên Facebook nhắm đối tượng chủ doanh nghiệp SME'
WHERE id = 2;

UPDATE campaigns SET
    name = 'Google Search Ads - Giải pháp Phần mềm Quản trị CRM Doanh nghiệp',
    description = 'Chạy từ khóa tìm kiếm Google nhu cầu mua phần mềm CRM'
WHERE id = 3;

UPDATE campaigns SET
    name = 'Email Marketing Nuôi dưỡng & Kích hoạt lại Khách hàng Cũ',
    description = 'Gửi chuỗi email chăm sóc và ưu đãi nâng cấp bản quyền phần mềm'
WHERE id = 4;

-- 9. Bảng Bộ lọc đã lưu (saved_filters)
DELETE FROM saved_filters WHERE is_preset = 1;

INSERT INTO saved_filters (user_id, module, name, filter_criteria, is_preset, created_at, updated_at)
VALUES 
(1, 'CUSTOMER', '🔥 Cần gọi sáng nay (Lead Nóng)', '{"scoreGrade":"HOT","status":"TIEM_NANG","ownerFilter":"MINE"}', 1, NOW(), NOW()),
(1, 'CUSTOMER', '🚨 Quá hạn SLA (Cần xử lý gấp)', '{"slaBreached":true}', 1, NOW(), NOW()),
(1, 'CUSTOMER', '📥 Lead mới phân bổ (Chờ nhận)', '{"assignmentStatus":"ASSIGNED","ownerFilter":"MINE","status":"TIEM_NANG"}', 1, NOW(), NOW()),
(1, 'CUSTOMER', '📞 Đang chăm sóc tuần này', '{"status":"DANG_CHAM_SOC","ownerFilter":"MINE"}', 1, NOW(), NOW()),
(1, 'CUSTOMER', '🎪 Nguồn Sự kiện & Hội thảo', '{"leadSource":"HOI_THAO"}', 1, NOW(), NOW()),
(1, 'CUSTOMER', '📱 Nguồn Facebook Lead Ads', '{"leadSource":"FACEBOOK"}', 1, NOW(), NOW());

-- 10. Bảng Vai trò (roles)
UPDATE roles SET name = 'Quản trị hệ thống' WHERE code = 'ADMIN';
UPDATE roles SET name = 'Giám đốc kinh doanh' WHERE code = 'DIRECTOR';
UPDATE roles SET name = 'Trưởng nhóm kinh doanh' WHERE code = 'TEAM_LEAD';
UPDATE roles SET name = 'Nhân viên kinh doanh' WHERE code = 'SALES_REP';
UPDATE roles SET name = 'Nhân viên Marketing' WHERE code = 'MARKETING';
UPDATE roles SET name = 'Chăm sóc khách hàng' WHERE code = 'CUSTOMER_SUCCESS';
UPDATE roles SET name = 'Kế toán' WHERE code = 'ACCOUNTANT';
