-- Migration 045: Contract Renewal Tracking and Sales Quotas / Targets
-- Story 1: Theo dõi hiệu lực và gia hạn hợp đồng (Accountant)
-- Story 2: Khai báo chỉ tiêu doanh số theo nhân viên, nhóm, kỳ và đo lường thực tế (Sales Director)

SET NAMES utf8mb4;

-- 1. Thêm cột renewal_opportunity_id vào contracts nếu chưa có
SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'contracts' AND COLUMN_NAME = 'renewal_opportunity_id');
SET @sql_col = IF(@col_exists = 0, 'ALTER TABLE contracts ADD COLUMN renewal_opportunity_id BIGINT NULL AFTER quote_id', 'SELECT 1');
PREPARE stmt_col FROM @sql_col;
EXECUTE stmt_col;
DEALLOCATE PREPARE stmt_col;

-- Thêm khóa ngoại an toàn
SET @fk_exists = (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS WHERE CONSTRAINT_SCHEMA = DATABASE() AND CONSTRAINT_NAME = 'fk_contract_renewal_opp');
SET @sql_fk = IF(@fk_exists = 0, 'ALTER TABLE contracts ADD CONSTRAINT fk_contract_renewal_opp FOREIGN KEY (renewal_opportunity_id) REFERENCES opportunities(id) ON DELETE SET NULL', 'SELECT 1');
PREPARE stmt_fk FROM @sql_fk;
EXECUTE stmt_fk;
DEALLOCATE PREPARE stmt_fk;

-- 2. Bảng cấu hình cảnh báo hợp đồng (contract_settings)
CREATE TABLE IF NOT EXISTS contract_settings (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    setting_key VARCHAR(100) NOT NULL UNIQUE,
    setting_value VARCHAR(255) NOT NULL,
    description VARCHAR(255),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Cấu hình mặc định ngưỡng cảnh báo hợp đồng sắp hết hạn là 30 ngày
INSERT INTO contract_settings (setting_key, setting_value, description)
VALUES ('expiring_threshold_days', '30', 'Số ngày trước khi hết hạn để cảnh báo hợp đồng sắp hết hạn')
ON DUPLICATE KEY UPDATE description = VALUES(description);

-- 3. Bổ sung các cột mở rộng cho bảng sales_targets
SET @col_target_deals = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'sales_targets' AND COLUMN_NAME = 'target_deals');
SET @sql_td = IF(@col_target_deals = 0, 'ALTER TABLE sales_targets ADD COLUMN target_deals INT DEFAULT 0 AFTER target_amount', 'SELECT 1');
PREPARE stmt_td FROM @sql_td;
EXECUTE stmt_td;
DEALLOCATE PREPARE stmt_td;

SET @col_created_by = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'sales_targets' AND COLUMN_NAME = 'created_by');
SET @sql_cb = IF(@col_created_by = 0, 'ALTER TABLE sales_targets ADD COLUMN created_by BIGINT NULL AFTER notes', 'SELECT 1');
PREPARE stmt_cb FROM @sql_cb;
EXECUTE stmt_cb;
DEALLOCATE PREPARE stmt_cb;

SET @fk_creator_exists = (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS WHERE CONSTRAINT_SCHEMA = DATABASE() AND CONSTRAINT_NAME = 'fk_sales_targets_creator');
SET @sql_creator = IF(@fk_creator_exists = 0, 'ALTER TABLE sales_targets ADD CONSTRAINT fk_sales_targets_creator FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL', 'SELECT 1');
PREPARE stmt_creator FROM @sql_creator;
EXECUTE stmt_creator;
DEALLOCATE PREPARE stmt_creator;

-- 4. Seed dữ liệu mẫu cho Hợp đồng sắp hết hạn và Hợp đồng đã hết hạn để Kế toán theo dõi & test tính năng
INSERT INTO contracts (
    contract_number, title, customer_id, opportunity_id, quote_id,
    subtotal, discount_percent, total_amount, signed_date, effective_date, expiry_date,
    payment_terms, status, owner_user_id
)
SELECT 'HD-SAMPLE-EXP-7D', 'Hợp đồng bảo trì phần mềm CRM - VPBank Thăng Long', 4, NULL, NULL,
       150000000.00, 0.00, 150000000.00, DATE_SUB(CURDATE(), INTERVAL 358 DAY), DATE_SUB(CURDATE(), INTERVAL 358 DAY), DATE_ADD(CURDATE(), INTERVAL 7 DAY),
       'Thanh toán 100% khi nghiệm thu dịch vụ năm', 'ACTIVE', 2
WHERE NOT EXISTS (SELECT 1 FROM contracts WHERE contract_number = 'HD-SAMPLE-EXP-7D');

INSERT INTO contracts (
    contract_number, title, customer_id, opportunity_id, quote_id,
    subtotal, discount_percent, total_amount, signed_date, effective_date, expiry_date,
    payment_terms, status, owner_user_id
)
SELECT 'HD-SAMPLE-EXP-15D', 'Hợp đồng thuê bao Cloud Enterprise - Nem Fashion', 5, NULL, NULL,
       84000000.00, 5.00, 79800000.00, DATE_SUB(CURDATE(), INTERVAL 350 DAY), DATE_SUB(CURDATE(), INTERVAL 350 DAY), DATE_ADD(CURDATE(), INTERVAL 15 DAY),
       'Thanh toán định kỳ hàng năm', 'ACTIVE', 3
WHERE NOT EXISTS (SELECT 1 FROM contracts WHERE contract_number = 'HD-SAMPLE-EXP-15D');

INSERT INTO contracts (
    contract_number, title, customer_id, opportunity_id, quote_id,
    subtotal, discount_percent, total_amount, signed_date, effective_date, expiry_date,
    payment_terms, status, owner_user_id
)
SELECT 'HD-SAMPLE-EXPIRED-5D', 'Hợp đồng dịch vụ bảo mật & SSL - Tập đoàn Hoàng Gia', 2, NULL, NULL,
       45000000.00, 0.00, 45000000.00, DATE_SUB(CURDATE(), INTERVAL 370 DAY), DATE_SUB(CURDATE(), INTERVAL 370 DAY), DATE_SUB(CURDATE(), INTERVAL 5 DAY),
       'Thanh toán đợt 1 50%, đợt 2 50%', 'EXPIRED', 2
WHERE NOT EXISTS (SELECT 1 FROM contracts WHERE contract_number = 'HD-SAMPLE-EXPIRED-5D');

-- Thêm items mẫu cho các hợp đồng trên để khi gia hạn sẽ kế thừa sản phẩm
INSERT INTO contract_items (contract_id, product_id, quantity, unit_price, discount_type, discount_percent, discount_amount, amount, notes)
SELECT c.id, 1, 1, 150000000.00, 'PERCENT', 0, 0, 150000000.00, 'Gói bảo trì hệ thống hàng năm'
FROM contracts c WHERE c.contract_number = 'HD-SAMPLE-EXP-7D'
AND NOT EXISTS (SELECT 1 FROM contract_items WHERE contract_id = c.id);

INSERT INTO contract_items (contract_id, product_id, quantity, unit_price, discount_type, discount_percent, discount_amount, amount, notes)
SELECT c.id, 2, 12, 7000000.00, 'PERCENT', 5, 4200000.00, 79800000.00, 'Thuê bao dịch vụ Cloud 12 tháng'
FROM contracts c WHERE c.contract_number = 'HD-SAMPLE-EXP-15D'
AND NOT EXISTS (SELECT 1 FROM contract_items WHERE contract_id = c.id);

INSERT INTO contract_items (contract_id, product_id, quantity, unit_price, discount_type, discount_percent, discount_amount, amount, notes)
SELECT c.id, 3, 1, 45000000.00, 'PERCENT', 0, 0, 45000000.00, 'Chứng chỉ SSL doanh nghiệp EV và hạ tầng VPN'
FROM contracts c WHERE c.contract_number = 'HD-SAMPLE-EXPIRED-5D'
AND NOT EXISTS (SELECT 1 FROM contract_items WHERE contract_id = c.id);
