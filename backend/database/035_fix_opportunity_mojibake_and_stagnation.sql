-- 035_fix_opportunity_mojibake_and_stagnation.sql
-- Sửa triệt để lỗi font chữ (Mojibake) và cờ đình trệ trong bảng opportunities
USE crm_db;

SET NAMES utf8mb4;

-- 1. Sửa lỗi font chữ Mojibake tên cơ hội và nguồn lead
UPDATE opportunities SET
    name = 'Cơ hội Thử Nghiệm Sản Phẩm & Dịch Vụ Thuê Bao',
    lead_source = 'Website / Tìm kiếm'
WHERE id IN (181, 182, 183, 184, 185)
   OR name LIKE '%CÆ¡ há»™i Thá»%'
   OR lead_source LIKE '%TÃ¬m kiáº¿m%';

-- 2. Sửa lỗi font chữ Mojibake ghi chú xác suất
UPDATE opportunities SET
    probability_note = 'Khách hàng có ngân sách lớn nên xác suất chốt cao hơn mặc định'
WHERE probability_note LIKE '%KhÃ¡ch hÃ ng cÃ³ ngÃ¢n sÃ¡ch%';

-- 3. Sửa lỗi font chữ Mojibake lý do mở lại cơ hội
UPDATE opportunities SET
    reopened_reason = 'Khách hàng yêu cầu thương thảo bổ sung thêm 2 module nâng cao'
WHERE reopened_reason LIKE '%KhÃ¡ch hÃ ng yÃªu cáº§u%';

-- 4. Đặt lại cờ đình trệ chuẩn: cơ hội không đình trệ thì stagnant_flag = NULL, stagnant_reason = NULL
UPDATE opportunities SET
    is_stagnant = 0,
    stagnant_flag = NULL,
    stagnant_reason = NULL
WHERE stagnant_flag = 'NONE' OR is_stagnant = 0;
