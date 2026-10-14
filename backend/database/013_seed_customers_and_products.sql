-- 013_seed_customers_and_products.sql
-- Thêm dữ liệu danh mục dùng chung (Master Data), Khách hàng (Customers) và Sản phẩm (Products)
USE crm_db;

SET NAMES utf8mb4;

-- 1. Sửa lỗi font cột unit của 2 sản phẩm cũ
UPDATE products SET unit = 'Gói' WHERE id = 1;
UPDATE products SET unit = 'Năm' WHERE id = 2;

-- 2. Dữ liệu Danh mục dùng chung (Master Data)
INSERT IGNORE INTO master_data (type, code, name, active, display_order) VALUES
-- Ngành nghề kinh doanh
('industry', 'CNTT', 'Công nghệ thông tin & Viễn thông', 1, 1),
('industry', 'BDS', 'Bất động sản & Xây dựng', 1, 2),
('industry', 'BAN_LE', 'Bán lẻ & Thương mại điện tử', 1, 3),
('industry', 'TAI_CHINH', 'Tài chính - Ngân hàng - Bảo hiểm', 1, 4),
('industry', 'Y_TE', 'Y tế & Dược phẩm', 1, 5),
('industry', 'SAN_XUAT', 'Sản xuất & Chế tạo', 1, 6),
('industry', 'GIAO_DUC', 'Giáo dục & Đào tạo', 1, 7),
('industry', 'DU_LICH', 'Du lịch & Khách sạn', 1, 8),
('industry', 'LOGISTICS', 'Vận tải & Logistics', 1, 9),

-- Quy mô doanh nghiệp
('company-size', 'DUOI_20', 'Dưới 20 nhân sự', 1, 1),
('company-size', '20_50', '20 - 50 nhân sự', 1, 2),
('company-size', '50_200', '50 - 200 nhân sự', 1, 3),
('company-size', '200_500', '200 - 500 nhân sự', 1, 4),
('company-size', 'TREN_500', 'Trên 500 nhân sự', 1, 5),

-- Nguồn khách hàng (lead-source)
('lead-source', 'WEBSITE', 'Website / Google Tìm kiếm', 1, 1),
('lead-source', 'FACEBOOK', 'Mạng xã hội / Facebook Ads', 1, 2),
('lead-source', 'GIOI_THIEU', 'Người quen giới thiệu', 1, 3),
('lead-source', 'HOI_THAO', 'Hội thảo / Triển lãm ngành', 1, 4),
('lead-source', 'COLD_CALL', 'Telesales / Tiếp cận trực tiếp', 1, 5);

-- 3. Cập nhật industry_id và company_size_id cho 2 khách hàng ban đầu
UPDATE customers SET 
    industry_id = (SELECT id FROM master_data WHERE type = 'industry' AND code = 'CNTT' LIMIT 1),
    company_size_id = (SELECT id FROM master_data WHERE type = 'company-size' AND code = '50_200' LIMIT 1)
WHERE id = 1;

UPDATE customers SET 
    industry_id = (SELECT id FROM master_data WHERE type = 'industry' AND code = 'BDS' LIMIT 1),
    company_size_id = (SELECT id FROM master_data WHERE type = 'company-size' AND code = '200_500' LIMIT 1)
WHERE id = 2;

-- 4. Thêm danh sách Khách hàng mới
INSERT INTO customers (name, tax_code, status, email, phone, website, address, industry_id, company_size_id, owner_user_id, is_deleted)
SELECT 'Công ty TNHH Dịch vụ & Du lịch Viettravel Sun', '0108923412', 'KHACH_HANG', 'booking@viettravelsun.vn', '0903124578', 'https://viettravelsun.vn', '45 Lê Duẩn, Phường Bến Nghé, Quận 1, TP.HCM',
       (SELECT id FROM master_data WHERE type = 'industry' AND code = 'DU_LICH' LIMIT 1),
       (SELECT id FROM master_data WHERE type = 'company-size' AND code = '50_200' LIMIT 1),
       1, 0
WHERE NOT EXISTS (SELECT 1 FROM customers WHERE tax_code = '0108923412');

INSERT INTO customers (name, tax_code, status, email, phone, website, address, industry_id, company_size_id, owner_user_id, is_deleted)
SELECT 'Ngân hàng TMCP Việt Nam Thịnh Vượng (VPBank Thăng Long)', '0100233583', 'KHACH_HANG', 'contact@vpbankthanglong.vn', '02439288888', 'https://vpbank.com.vn', '89 Láng Hạ, Đống Đa, Hà Nội',
       (SELECT id FROM master_data WHERE type = 'industry' AND code = 'TAI_CHINH' LIMIT 1),
       (SELECT id FROM master_data WHERE type = 'company-size' AND code = 'TREN_500' LIMIT 1),
       1, 0
WHERE NOT EXISTS (SELECT 1 FROM customers WHERE tax_code = '0100233583');

INSERT INTO customers (name, tax_code, status, email, phone, website, address, industry_id, company_size_id, owner_user_id, is_deleted)
SELECT 'Chuỗi Bán lẻ Thời trang Nem Fashion', '0103765432', 'KHACH_HANG', 'sales@nemfashion.vn', '0936112233', 'https://nemfashion.vn', '54 Tràng Tiền, Hoàn Kiếm, Hà Nội',
       (SELECT id FROM master_data WHERE type = 'industry' AND code = 'BAN_LE' LIMIT 1),
       (SELECT id FROM master_data WHERE type = 'company-size' AND code = '200_500' LIMIT 1),
       1, 0
WHERE NOT EXISTS (SELECT 1 FROM customers WHERE tax_code = '0103765432');

INSERT INTO customers (name, tax_code, status, email, phone, website, address, industry_id, company_size_id, owner_user_id, is_deleted)
SELECT 'Công ty Cổ phần Dược phẩm An Sinh Medicare', '0314567890', 'TIEM_NANG', 'info@ansinhpharma.vn', '0977889900', 'https://ansinhmedicare.com', '120 Sư Vạn Hạnh, Phường 12, Quận 10, TP.HCM',
       (SELECT id FROM master_data WHERE type = 'industry' AND code = 'Y_TE' LIMIT 1),
       (SELECT id FROM master_data WHERE type = 'company-size' AND code = '50_200' LIMIT 1),
       1, 0
WHERE NOT EXISTS (SELECT 1 FROM customers WHERE tax_code = '0314567890');

INSERT INTO customers (name, tax_code, status, email, phone, website, address, industry_id, company_size_id, owner_user_id, is_deleted)
SELECT 'Tập đoàn Sản xuất & Chế tạo Cơ khí Nam Á', '3701239876', 'KHACH_HANG', 'lienhe@nama-machinery.com.vn', '02743899222', 'https://nama-machinery.com.vn', 'KCN VSIP 1, TP. Thuận An, Bình Dương',
       (SELECT id FROM master_data WHERE type = 'industry' AND code = 'SAN_XUAT' LIMIT 1),
       (SELECT id FROM master_data WHERE type = 'company-size' AND code = 'TREN_500' LIMIT 1),
       1, 0
WHERE NOT EXISTS (SELECT 1 FROM customers WHERE tax_code = '3701239876');

INSERT INTO customers (name, tax_code, status, email, phone, website, address, industry_id, company_size_id, owner_user_id, is_deleted)
SELECT 'Hệ thống Trường Quốc tế Á Châu (Asian School)', '0302456781', 'TIEM_NANG', 'admissions@asianschool.edu.vn', '02838480740', 'https://asianschool.edu.vn', '226 Pasteur, Phường Võ Thị Sáu, Quận 3, TP.HCM',
       (SELECT id FROM master_data WHERE type = 'industry' AND code = 'GIAO_DUC' LIMIT 1),
       (SELECT id FROM master_data WHERE type = 'company-size' AND code = '200_500' LIMIT 1),
       1, 0
WHERE NOT EXISTS (SELECT 1 FROM customers WHERE tax_code = '0302456781');

INSERT INTO customers (name, tax_code, status, email, phone, website, address, industry_id, company_size_id, owner_user_id, is_deleted)
SELECT 'Công ty Cổ phần Giải pháp Logistics LogiTech Việt Nam', '0201889922', 'TIEM_NANG', 'dispatch@logitech-vn.com', '0918776655', 'https://logitech-vn.com', 'Khu kinh tế Đình Vũ, Hải An, Hải Phòng',
       (SELECT id FROM master_data WHERE type = 'industry' AND code = 'LOGISTICS' LIMIT 1),
       (SELECT id FROM master_data WHERE type = 'company-size' AND code = '50_200' LIMIT 1),
       1, 0
WHERE NOT EXISTS (SELECT 1 FROM customers WHERE tax_code = '0201889922');

INSERT INTO customers (name, tax_code, status, email, phone, website, address, industry_id, company_size_id, owner_user_id, is_deleted)
SELECT 'Chuỗi Cửa hàng Trà sữa TocoToco (Công ty CP Taco)', '0106489012', 'KHACH_HANG', 'marketing@tocotocotea.com', '1900636936', 'https://tocotocotea.com', 'Tầng 3, Golden Palace, Mễ Trì, Nam Từ Liêm, Hà Nội',
       (SELECT id FROM master_data WHERE type = 'industry' AND code = 'BAN_LE' LIMIT 1),
       (SELECT id FROM master_data WHERE type = 'company-size' AND code = '200_500' LIMIT 1),
       1, 0
WHERE NOT EXISTS (SELECT 1 FROM customers WHERE tax_code = '0106489012');

INSERT INTO customers (name, tax_code, status, email, phone, website, address, industry_id, company_size_id, owner_user_id, is_deleted)
SELECT 'Công ty Cổ phần Đầu tư Công nghệ Xanh GreenTech', '0401998877', 'TIEM_NANG', 'support@greentech-group.vn', '0905667788', 'https://greentech-group.vn', 'Khu Công nghệ cao Đà Nẵng, Hòa Vang, Đà Nẵng',
       (SELECT id FROM master_data WHERE type = 'industry' AND code = 'CNTT' LIMIT 1),
       (SELECT id FROM master_data WHERE type = 'company-size' AND code = '20_50' LIMIT 1),
       1, 0
WHERE NOT EXISTS (SELECT 1 FROM customers WHERE tax_code = '0401998877');

INSERT INTO customers (name, tax_code, status, email, phone, website, address, industry_id, company_size_id, owner_user_id, is_deleted)
SELECT 'Tập đoàn Bán buôn & Phân phối Điện tử Đại Phát', '0105123999', 'KHACH_HANG', 'contact@daiphat-elec.vn', '0944556677', 'https://daiphat-elec.vn', '36 Hoàng Cầu, Ô Chợ Dừa, Đống Đa, Hà Nội',
       (SELECT id FROM master_data WHERE type = 'industry' AND code = 'BAN_LE' LIMIT 1),
       (SELECT id FROM master_data WHERE type = 'company-size' AND code = '50_200' LIMIT 1),
       1, 0
WHERE NOT EXISTS (SELECT 1 FROM customers WHERE tax_code = '0105123999');


-- 5. Thêm danh sách Sản phẩm & Dịch vụ mới
INSERT INTO products (code, name, unit, active, type, list_price, floor_price, cost_price)
SELECT 'CRM-SEAT-STD', 'Gói người dùng CRM Standard (User/tháng)', 'Người dùng', 1, 'RECURRING', 150000.00, 120000.00, 60000.00
WHERE NOT EXISTS (SELECT 1 FROM products WHERE code = 'CRM-SEAT-STD');

INSERT INTO products (code, name, unit, active, type, list_price, floor_price, cost_price)
SELECT 'CRM-SEAT-PRO', 'Gói người dùng CRM Professional (User/tháng)', 'Người dùng', 1, 'RECURRING', 350000.00, 280000.00, 140000.00
WHERE NOT EXISTS (SELECT 1 FROM products WHERE code = 'CRM-SEAT-PRO');

INSERT INTO products (code, name, unit, active, type, list_price, floor_price, cost_price)
SELECT 'CRM-SEAT-ENT', 'Gói người dùng CRM Enterprise (User/tháng)', 'Người dùng', 1, 'RECURRING', 650000.00, 500000.00, 250000.00
WHERE NOT EXISTS (SELECT 1 FROM products WHERE code = 'CRM-SEAT-ENT');

INSERT INTO products (code, name, unit, active, type, list_price, floor_price, cost_price)
SELECT 'SRV-IMPL-BASIC', 'Dịch vụ Triển khai & Cấu hình CRM Cơ bản', 'Gói dự án', 1, 'ONE_TIME', 25000000.00, 20000000.00, 10000000.00
WHERE NOT EXISTS (SELECT 1 FROM products WHERE code = 'SRV-IMPL-BASIC');

INSERT INTO products (code, name, unit, active, type, list_price, floor_price, cost_price)
SELECT 'SRV-IMPL-ADV', 'Dịch vụ Tùy chỉnh Quy trình & Tích hợp ERP / Tổng đài VoIP', 'Gói dự án', 1, 'ONE_TIME', 60000000.00, 48000000.00, 25000000.00
WHERE NOT EXISTS (SELECT 1 FROM products WHERE code = 'SRV-IMPL-ADV');

INSERT INTO products (code, name, unit, active, type, list_price, floor_price, cost_price)
SELECT 'SRV-TRAIN-ON', 'Khóa Đào tạo Chuyển giao Sử dụng CRM (Onsite)', 'Buổi đào tạo', 1, 'ONE_TIME', 5000000.00, 4000000.00, 2000000.00
WHERE NOT EXISTS (SELECT 1 FROM products WHERE code = 'SRV-TRAIN-ON');

INSERT INTO products (code, name, unit, active, type, list_price, floor_price, cost_price)
SELECT 'MOD-VOIP-CALL', 'Module Tích hợp Tổng đài ảo & Ghi âm cuộc gọi (VoIP CTI)', 'Tháng', 1, 'RECURRING', 1200000.00, 950000.00, 500000.00
WHERE NOT EXISTS (SELECT 1 FROM products WHERE code = 'MOD-VOIP-CALL');

INSERT INTO products (code, name, unit, active, type, list_price, floor_price, cost_price)
SELECT 'MOD-ZALO-OA', 'Module Gửi tin Zalo ZNS / Zalo OA & SMS Brandname Tự động', 'Tháng', 1, 'RECURRING', 800000.00, 600000.00, 300000.00
WHERE NOT EXISTS (SELECT 1 FROM products WHERE code = 'MOD-ZALO-OA');

INSERT INTO products (code, name, unit, active, type, list_price, floor_price, cost_price)
SELECT 'SRV-MAINT-VIP', 'Gói Bảo trì & Hỗ trợ Kỹ thuật VIP 24/7 (Hợp đồng năm)', 'Năm', 1, 'RECURRING', 18000000.00, 15000000.00, 7000000.00
WHERE NOT EXISTS (SELECT 1 FROM products WHERE code = 'SRV-MAINT-VIP');

INSERT INTO products (code, name, unit, active, type, list_price, floor_price, cost_price)
SELECT 'MOD-BI-REPORT', 'Module Báo cáo Phân tích Chuyên sâu (Advanced BI & Analytics)', 'Gói vĩnh viễn', 1, 'ONE_TIME', 35000000.00, 28000000.00, 12000000.00
WHERE NOT EXISTS (SELECT 1 FROM products WHERE code = 'MOD-BI-REPORT');
