USE crm_db;

-- 1. Thêm khách hàng trùng 13 (Trùng với Khách hàng 12: Điện tử Đại Phát)
-- Khách 12: do User 1/User 3 phụ trách.
-- Khách 13: do User 4 (Lê Hoàng Nam - Sales) phụ trách -> Dẫn đến 2 nhân viên cùng chào một công ty!
INSERT INTO customers (
    id, name, tax_code, status, email, phone, website, address,
    industry_id, company_size_id, owner_user_id, is_deleted
) VALUES (
    13,
    'Công ty Cổ phần Điện tử Đại Phát',
    '010-5123-999',
    'TIEM_NANG',
    'kinhdoanh@daiphat-elec.vn',
    '0911223344',
    'http://www.daiphat-elec.vn',
    'Tầng 5, Tòa nhà Charmvit, 117 Trần Duy Hưng, Cầu Giấy, Hà Nội',
    1, 1, 4, 0
) ON DUPLICATE KEY UPDATE
    name = VALUES(name),
    tax_code = VALUES(tax_code),
    website = VALUES(website),
    owner_user_id = VALUES(owner_user_id),
    is_deleted = 0;

-- 2. Thêm người liên hệ cho Khách 13
INSERT INTO contacts (
    id, customer_id, name, title, phone, email, buying_role, is_primary, notes, is_deleted
) VALUES (
    101, 13, 'Ngô Quang Huy', 'Phó Giám đốc Kỹ thuật', '0912998877', 'huynq@daiphat-elec.vn', 'INFLUENCER', 1, 'Quan tâm công nghệ hạ tầng', 0
) ON DUPLICATE KEY UPDATE
    customer_id = 13, name = VALUES(name), is_deleted = 0;

-- 3. Thêm cơ hội bán hàng cho Khách 13
INSERT INTO opportunities (
    id, customer_id, name, amount, stage_id, probability, expected_close_date, owner_user_id, is_deleted
) VALUES (
    101, 13, 'Gói Mở rộng Máy chủ DataCenter Chi nhánh 2', 75000000.00, 2, 50, '2026-11-20', 4, 0
) ON DUPLICATE KEY UPDATE
    customer_id = 13, name = VALUES(name), amount = VALUES(amount), is_deleted = 0;

-- 4. Thêm hoạt động cho Khách 13
INSERT INTO activities (
    customer_id, owner_user_id, type, subject, description, status, created_at
) VALUES
(13, 4, 'CALL', 'Gọi điện chào giải pháp Server', 'Đã gọi cho anh Huy, anh hẹn tuần tới gửi báo giá chi tiết', 'COMPLETED', NOW() - INTERVAL 2 DAY),
(13, 4, 'EMAIL', 'Gửi hồ sơ năng lực và catalog giải pháp', 'Đã gửi catalog giải pháp CRM & Server cho anh Huy', 'COMPLETED', NOW() - INTERVAL 1 DAY);

-- 5. Thêm tệp đính kèm cho Khách 13
INSERT INTO attachments (
    customer_id, name, file_url, file_type, file_size, uploaded_by_user_id, created_at
) VALUES
(13, 'Ho_so_nang_luc_Dai_Phat_2026.pdf', '/uploads/Ho_so_nang_luc_Dai_Phat_2026.pdf', 'pdf', 3250585, 4, NOW() - INTERVAL 1 DAY);

-- 6. Thêm khách hàng trùng 14 (Trùng với Khách hàng 2: Tập đoàn Bất động sản Hoàng Gia)
INSERT INTO customers (
    id, name, tax_code, status, email, phone, website, address,
    industry_id, company_size_id, owner_user_id, is_deleted
) VALUES (
    14,
    'Tập đoàn Bất động sản Hoàng Gia Group',
    '030-9876-543',
    'TIEM_NANG',
    'info@hoanggialand.vn',
    '0988776655',
    'https://hoanggialand.vn',
    'Tòa nhà Hoàng Gia, Quận 1, TP. Hồ Chí Minh',
    2, 2, 5, 0
) ON DUPLICATE KEY UPDATE
    name = VALUES(name),
    tax_code = VALUES(tax_code),
    website = VALUES(website),
    owner_user_id = VALUES(owner_user_id),
    is_deleted = 0;
