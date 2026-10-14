-- 032_clean_customer_lead_sources_and_names.sql
-- Sửa triệt để lỗi mã hóa UTF-8 kép (Mojibake) cho nguồn Lead và tên khách hàng
USE crm_db;

SET NAMES utf8mb4;
SET CHARACTER SET utf8mb4;

-- 1. Sửa lỗi Mojibake trong cột lead_source và tên khách hàng bảng customers
UPDATE customers SET 
    name = 'Công ty Xây dựng và Đầu tư Nam Việt',
    lead_source = 'Hội thảo / Sự kiện',
    address = 'Hà Nội'
WHERE id IN (24, 25);

UPDATE customers SET 
    name = 'Tập đoàn Công nghệ Alpha Tech',
    lead_source = 'Hội thảo / Sự kiện'
WHERE id IN (26, 29, 32);

UPDATE customers SET 
    name = 'Công ty TNHH Dịch vụ Vận tải Bắc Việt',
    lead_source = 'Website / Tìm kiếm'
WHERE id IN (27, 30, 33);

UPDATE customers SET 
    name = 'Công ty TNHH Năng lượng Mặt trời Xanh',
    lead_source = 'Người quen giới thiệu',
    address = 'TP. Hồ Chí Minh'
WHERE id IN (28, 31, 34);

-- Chuẩn hóa tên có dấu cho khách hàng 35-46
UPDATE customers SET name = 'Công ty CP Giải pháp Công nghệ Hoàng Long' WHERE id IN (35, 36, 38, 41, 44);
UPDATE customers SET name = 'Công ty TNHH Thời Trang Mai Vy' WHERE id IN (37, 39, 42, 45);
UPDATE customers SET name = 'Công ty CP Công nghệ Hoàng Long Global' WHERE id IN (40, 43, 46);

-- Chuẩn hóa bất kỳ bản ghi nào còn sót ký tự mã hóa kép của lead_source
UPDATE customers SET lead_source = 'Hội thảo / Sự kiện' 
WHERE lead_source LIKE '%Há»™i tháº£o%' OR HEX(lead_source) LIKE '48C3A1C2BB%';

UPDATE customers SET lead_source = 'Website / Tìm kiếm' 
WHERE lead_source LIKE '%TÃ¬m kiáº¿m%' OR HEX(lead_source) LIKE '57656273697465202F2054C383%';

UPDATE customers SET lead_source = 'Người quen giới thiệu' 
WHERE lead_source LIKE '%NgÆ°á»%' OR HEX(lead_source) LIKE '4E67C386%';

-- 2. Sửa lỗi Mojibake trong bảng cơ hội bán hàng (opportunities)
UPDATE opportunities SET
    name = 'Cơ hội nâng cấp hệ thống ERP 2026',
    lead_source = 'Website / Tìm kiếm'
WHERE id IN (175, 177, 179) 
   OR name LIKE '%CÆ¡ há»™i nÃ¢ng cáº¥p%' 
   OR lead_source LIKE '%TÃ¬m kiáº¿m%'
   OR HEX(lead_source) LIKE '57656273697465202F2054C383%';

UPDATE opportunities SET
    name = 'Cơ hội mua thêm gói bảo trì & đào tạo',
    lead_source = 'Hội thảo / Sự kiện'
WHERE id IN (176, 178, 180) 
   OR name LIKE '%CÆ¡ há»™i mua thÃªm%' 
   OR lead_source LIKE '%Há»™i tháº£o%'
   OR HEX(lead_source) LIKE '48C3A1C2BB%';
