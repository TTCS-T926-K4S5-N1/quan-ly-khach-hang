USE crm_db;

-- 1. Bổ sung cột parent_id vào bảng customers nếu chưa có
SET @has_parent_col = (
    SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'customers' AND COLUMN_NAME = 'parent_id'
);
SET @sql = IF(@has_parent_col = 0,
    'ALTER TABLE customers ADD COLUMN parent_id BIGINT NULL AFTER owner_user_id',
    'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 2. Thêm Foreign Key và Index
SET @has_parent_fk = (
    SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
    WHERE CONSTRAINT_SCHEMA = DATABASE() AND TABLE_NAME = 'customers'
      AND CONSTRAINT_NAME = 'fk_customers_parent'
);
SET @sql = IF(@has_parent_fk = 0,
    'ALTER TABLE customers ADD CONSTRAINT fk_customers_parent FOREIGN KEY (parent_id) REFERENCES customers(id) ON DELETE SET NULL',
    'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 3. Tạo index phục vụ truy vấn công ty con nhanh chóng
SET @has_parent_idx = (
    SELECT COUNT(*) FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'customers'
      AND INDEX_NAME = 'idx_customers_parent'
);
SET @sql = IF(@has_parent_idx = 0,
    'CREATE INDEX idx_customers_parent ON customers(parent_id)',
    'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 4. Seed dữ liệu cấu trúc Tập đoàn & Công ty con:
-- Khách hàng 12: "Tập đoàn Bán buôn & Phân phối Điện tử Đại Phát" là Công ty Mẹ.

-- Công ty con 1 của Đại Phát: "Công ty TNHH Viễn thông & Thiết bị Mạng Đại Phát (DaiPhat Telecom)"
INSERT INTO customers (
    id, name, tax_code, status, email, phone, website, address,
    industry_id, company_size_id, owner_user_id, parent_id, is_deleted
) VALUES (
    15,
    'Công ty TNHH Viễn thông & Thiết bị Mạng Đại Phát (DaiPhat Telecom)',
    '0105123999-001',
    'KHACH_HANG',
    'telecom@daiphatgroup.vn',
    '02437651122',
    'https://telecom.daiphatgroup.vn',
    'Lô B2, Khu Công nghệ cao Hòa Lạc, Thạch Thất, Hà Nội',
    1, 2, 4, 12, 0
) ON DUPLICATE KEY UPDATE
    name = VALUES(name),
    parent_id = 12,
    tax_code = VALUES(tax_code),
    is_deleted = 0;

-- Thêm người liên hệ cho Công ty con 1
INSERT INTO contacts (
    id, customer_id, name, title, phone, email, buying_role, is_primary, notes, is_deleted
) VALUES (
    151, 15, 'Vũ Đình Toàn', 'Giám đốc Khối Viễn thông', '0913554433', 'toanvd@daiphatgroup.vn', 'DECISION_MAKER', 1, 'Người quyết định duyệt giải pháp viễn thông', 0
) ON DUPLICATE KEY UPDATE
    customer_id = 15, name = VALUES(name), is_deleted = 0;

-- Thêm cơ hội đã ký (WON) 50.000.000 ₫ và cơ hội đang mở 30.000.000 ₫ cho Công ty con 1
INSERT INTO opportunities (
    id, customer_id, name, amount, stage_id, probability, expected_close_date, status, owner_user_id, is_deleted
) VALUES
(151, 15, 'Hợp đồng Nâng cấp Băng thông Quốc tế & VPN', 50000000.00, 5, 100, '2026-09-20', 'WON', 4, 0),
(152, 15, 'Dự án Tổng đài Cloud CallCenter 50 Agents', 30000000.00, 3, 60, '2026-11-30', 'OPEN', 4, 0)
ON DUPLICATE KEY UPDATE
    customer_id = 15, name = VALUES(name), amount = VALUES(amount), status = VALUES(status), is_deleted = 0;

-- Công ty con 2 của Đại Phát: "Công ty Cổ phần Giải pháp Phần mềm & Số hóa Đại Phát (DaiPhat Digital)"
INSERT INTO customers (
    id, name, tax_code, status, email, phone, website, address,
    industry_id, company_size_id, owner_user_id, parent_id, is_deleted
) VALUES (
    16,
    'Công ty Cổ phần Giải pháp Phần mềm & Số hóa Đại Phát (DaiPhat Digital)',
    '0105123999-002',
    'KHACH_HANG',
    'digital@daiphatgroup.vn',
    '02437652233',
    'https://digital.daiphatgroup.vn',
    'Tầng 8, Tòa nhà Đại Phát, 88 Dịch Vọng Hậu, Cầu Giấy, Hà Nội',
    1, 2, 5, 12, 0
) ON DUPLICATE KEY UPDATE
    name = VALUES(name),
    parent_id = 12,
    tax_code = VALUES(tax_code),
    is_deleted = 0;

-- Thêm người liên hệ cho Công ty con 2
INSERT INTO contacts (
    id, customer_id, name, title, phone, email, buying_role, is_primary, notes, is_deleted
) VALUES (
    161, 16, 'Đặng Thùy Dung', 'Phó Giám đốc Trung tâm Số hóa', '0988112244', 'dungdt@daiphatgroup.vn', 'INFLUENCER', 1, 'Phụ trách kiến trúc phần mềm số hóa', 0
) ON DUPLICATE KEY UPDATE
    customer_id = 16, name = VALUES(name), is_deleted = 0;

-- Thêm cơ hội đã ký (WON) 80.000.000 ₫ và cơ hội đang mở 60.000.000 ₫ cho Công ty con 2
INSERT INTO opportunities (
    id, customer_id, name, amount, stage_id, probability, expected_close_date, status, owner_user_id, is_deleted
) VALUES
(161, 16, 'Hợp đồng Nền tảng Quản trị Số Enterprise 2026', 80000000.00, 5, 100, '2026-08-30', 'WON', 5, 0),
(162, 16, 'Hệ thống Phân tích Dữ liệu BI & AI Dashboard', 60000000.00, 2, 40, '2026-12-15', 'OPEN', 5, 0)
ON DUPLICATE KEY UPDATE
    customer_id = 16, name = VALUES(name), amount = VALUES(amount), status = VALUES(status), is_deleted = 0;

-- Khách hàng 2: "Tập đoàn Bất động sản Hoàng Gia" có Công ty con 17:
INSERT INTO customers (
    id, name, tax_code, status, email, phone, website, address,
    industry_id, company_size_id, owner_user_id, parent_id, is_deleted
) VALUES (
    17,
    'Công ty Cổ phần Xây dựng & Phát triển Đô thị Hoàng Gia (HoangGia Urban)',
    '0309876543-001',
    'KHACH_HANG',
    'urban@hoanggialand.vn',
    '02839998877',
    'https://urban.hoanggialand.vn',
    'Khu Đô thị Mới Nam Sài Gòn, Quận 7, TP. Hồ Chí Minh',
    2, 3, 2, 2, 0
) ON DUPLICATE KEY UPDATE
    name = VALUES(name),
    parent_id = 2,
    tax_code = VALUES(tax_code),
    is_deleted = 0;

INSERT INTO opportunities (
    id, customer_id, name, amount, stage_id, probability, expected_close_date, status, owner_user_id, is_deleted
) VALUES
(171, 17, 'Hợp đồng Phần mềm Giám sát Thi công Dự án KĐT', 120000000.00, 5, 100, '2026-07-15', 'WON', 2, 0)
ON DUPLICATE KEY UPDATE
    customer_id = 17, name = VALUES(name), amount = VALUES(amount), status = VALUES(status), is_deleted = 0;
