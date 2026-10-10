USE crm_db;
SET NAMES utf8mb4;

-- 1. Bổ sung cột region_id vào bảng customers nếu chưa có
SET @has_region_col = (
    SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'customers' AND COLUMN_NAME = 'region_id'
);
SET @sql = IF(@has_region_col = 0,
    'ALTER TABLE customers ADD COLUMN region_id BIGINT NULL AFTER company_size_id',
    'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 2. Thêm Foreign Key fk_customers_region nếu chưa có
SET @has_region_fk = (
    SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
    WHERE CONSTRAINT_SCHEMA = DATABASE() AND TABLE_NAME = 'customers'
      AND CONSTRAINT_NAME = 'fk_customers_region'
);
SET @sql = IF(@has_region_fk = 0,
    'ALTER TABLE customers ADD CONSTRAINT fk_customers_region FOREIGN KEY (region_id) REFERENCES master_data(id) ON DELETE SET NULL',
    'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 3. Tạo index cho các cột tìm kiếm và lọc
SET @has_idx_region = (
    SELECT COUNT(*) FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'customers' AND INDEX_NAME = 'idx_customers_region'
);
SET @sql = IF(@has_idx_region = 0, 'CREATE INDEX idx_customers_region ON customers(region_id)', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @has_idx_ind_size = (
    SELECT COUNT(*) FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'customers' AND INDEX_NAME = 'idx_customers_industry_size'
);
SET @sql = IF(@has_idx_ind_size = 0, 'CREATE INDEX idx_customers_industry_size ON customers(industry_id, company_size_id)', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Index tìm kiếm số điện thoại trong contacts
SET @has_idx_ct_phone = (
    SELECT COUNT(*) FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'contacts' AND INDEX_NAME = 'idx_contacts_phone'
);
SET @sql = IF(@has_idx_ct_phone = 0, 'CREATE INDEX idx_contacts_phone ON contacts(phone)', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 4. Cập nhật dữ liệu region_id mẫu theo địa chỉ cho các khách hàng hiện tại
-- 22: Hà Nội (MIEN_BAC: 21, HA_NOI: 22)
-- 26: TP. Hồ Chí Minh (MIEN_NAM: 25, TP_HCM: 26)
-- 24: Đà Nẵng (MIEN_TRUNG: 23, DA_NANG: 24)
UPDATE customers SET region_id = 22 WHERE address LIKE '%Hà Nội%' OR address LIKE '%Hanoi%';
UPDATE customers SET region_id = 26 WHERE address LIKE '%Hồ Chí Minh%' OR address LIKE '%TP.HCM%' OR address LIKE '%Sài Gòn%';
UPDATE customers SET region_id = 24 WHERE address LIKE '%Đà Nẵng%' OR address LIKE '%Da Nang%';

-- 5. Tạo bảng saved_filters để lưu lại bộ lọc hay dùng
CREATE TABLE IF NOT EXISTS saved_filters (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    module VARCHAR(50) NOT NULL DEFAULT 'CUSTOMER',
    name VARCHAR(255) NOT NULL,
    filter_criteria JSON NOT NULL,
    is_preset TINYINT(1) NOT NULL DEFAULT 0,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_saved_filters_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_saved_filters_user_mod (user_id, module)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Khởi tạo một số bộ lọc hay dùng mặc định cho admin và sales
INSERT INTO saved_filters (user_id, module, name, filter_criteria, is_preset)
SELECT id, 'CUSTOMER', 'Khách cần gọi trong tuần', '{"status":"TIEM_NANG"}', 1
FROM users
WHERE status = 'ACTIVE'
  AND NOT EXISTS (
      SELECT 1 FROM saved_filters sf WHERE sf.user_id = users.id AND sf.name = 'Khách cần gọi trong tuần'
  );

INSERT INTO saved_filters (user_id, module, name, filter_criteria, is_preset)
SELECT id, 'CUSTOMER', 'Khách hàng lớn (> 200 NS)', '{"companySizeId":13}', 1
FROM users
WHERE status = 'ACTIVE'
  AND NOT EXISTS (
      SELECT 1 FROM saved_filters sf WHERE sf.user_id = users.id AND sf.name = 'Khách hàng lớn (> 200 NS)'
  );

INSERT INTO saved_filters (user_id, module, name, filter_criteria, is_preset)
SELECT id, 'CUSTOMER', 'Tiềm năng Hà Nội & Miền Bắc', '{"status":"TIEM_NANG","regionId":22}', 1
FROM users
WHERE status = 'ACTIVE'
  AND NOT EXISTS (
      SELECT 1 FROM saved_filters sf WHERE sf.user_id = users.id AND sf.name = 'Tiềm năng Hà Nội & Miền Bắc'
  );

INSERT INTO saved_filters (user_id, module, name, filter_criteria, is_preset)
SELECT id, 'CUSTOMER', 'Khách hàng do tôi phụ trách', '{"ownerFilter":"MINE"}', 1
FROM users
WHERE status = 'ACTIVE'
  AND NOT EXISTS (
      SELECT 1 FROM saved_filters sf WHERE sf.user_id = users.id AND sf.name = 'Khách hàng do tôi phụ trách'
  );
