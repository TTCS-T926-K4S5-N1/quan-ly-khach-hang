-- 033_opportunity_products_and_stage_exit_conditions.sql
-- Triển khai 2 User Stories:
-- 1. Thêm sản phẩm dịch vụ vào cơ hội để tính giá trị hợp đồng (có căn cứ, hỗ trợ thuê bao & ACV)
-- 2. Điều kiện bắt buộc khi rời giai đoạn & Trưởng nhóm ghi đè kèm lý do
USE crm_db;

SET NAMES utf8mb4;
SET CHARACTER SET utf8mb4;

-- ========================================================
-- 1. BẢNG DÒNG SẢN PHẨM CỦA CƠ HỘI (opportunity_items)
-- ========================================================
CREATE TABLE IF NOT EXISTS opportunity_items (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    opportunity_id BIGINT NOT NULL,
    product_id BIGINT NOT NULL,
    product_code VARCHAR(50) NULL,
    product_name VARCHAR(255) NOT NULL,
    product_type VARCHAR(50) NOT NULL DEFAULT 'ONE_TIME', -- ONE_TIME, RECURRING, SUBSCRIPTION
    quantity INT NOT NULL DEFAULT 1,
    unit VARCHAR(50) NULL,
    unit_price DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    discount_percent DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    billing_cycle VARCHAR(50) NOT NULL DEFAULT 'MONTHLY', -- MONTHLY, QUARTERLY, YEARLY, ONE_TIME
    billing_duration INT NOT NULL DEFAULT 1,               -- Số kỳ thuê bao (ví dụ: 12 tháng, 2 năm...)
    annual_contract_value DECIMAL(15,2) NOT NULL DEFAULT 0.00, -- Giá trị hợp đồng theo năm (ACV)
    amount DECIMAL(15,2) NOT NULL DEFAULT 0.00,           -- Thành tiền dòng sản phẩm
    notes VARCHAR(500) NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_opp_items_opportunity FOREIGN KEY (opportunity_id) REFERENCES opportunities(id) ON DELETE CASCADE,
    CONSTRAINT fk_opp_items_product FOREIGN KEY (product_id) REFERENCES products(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_opp_items_opportunity_id ON opportunity_items(opportunity_id);

-- ========================================================
-- 2. BỔ SUNG CỘT CẤU HÌNH ĐIỀU KIỆN RỜI GIAI ĐOẠN (pipeline_stages)
-- ========================================================
DROP PROCEDURE IF EXISTS AddColumnIfNotExists;
DELIMITER $$
CREATE PROCEDURE AddColumnIfNotExists(
    IN tableName VARCHAR(100),
    IN colName VARCHAR(100),
    IN colDef VARCHAR(255)
)
BEGIN
    SET @db = DATABASE();
    SET @count = (
        SELECT COUNT(*)
        FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = @db
          AND TABLE_NAME = tableName
          AND COLUMN_NAME = colName
    );
    IF @count = 0 THEN
        SET @sql = CONCAT('ALTER TABLE ', tableName, ' ADD COLUMN ', colName, ' ', colDef);
        PREPARE stmt FROM @sql;
        EXECUTE stmt;
        DEALLOCATE PREPARE stmt;
    END IF;
END$$
DELIMITER ;

CALL AddColumnIfNotExists('pipeline_stages', 'condition_type', 'VARCHAR(50) NULL DEFAULT "NONE" AFTER exit_condition');
CALL AddColumnIfNotExists('opportunities', 'last_override_reason', 'VARCHAR(500) NULL AFTER lost_reason');
CALL AddColumnIfNotExists('opportunities', 'last_overridden_by', 'BIGINT NULL AFTER last_override_reason');
CALL AddColumnIfNotExists('opportunities', 'last_overridden_at', 'DATETIME NULL AFTER last_overridden_by');

-- ========================================================
-- 3. CẤU HÌNH ĐIỀU KIỆN RỜI GIAI ĐOẠN CHUẨN (User Story 2)
-- ========================================================
-- Giai đoạn 1: "Mới tiếp cận" (NEW) -> Bắt buộc có ít nhất 1 cuộc gặp (Meeting)
UPDATE pipeline_stages SET 
    condition_type = 'HAS_MEETING',
    exit_condition = 'Phải có ít nhất một cuộc gặp (Meeting) được ghi nhận trong Hoạt động',
    condition_required = 1
WHERE id = 1;

-- Giai đoạn 2: "Đủ điều kiện" (QUALIFIED) -> Bắt buộc phải thêm sản phẩm/dịch vụ vào cơ hội
UPDATE pipeline_stages SET 
    condition_type = 'HAS_PRODUCTS',
    exit_condition = 'Phải thêm sản phẩm / dịch vụ vào cơ hội để xác định giá trị hợp đồng có căn cứ',
    condition_required = 1
WHERE id = 2;

-- Giai đoạn 3: "Gửi báo giá" (PROPOSAL) -> Bắt buộc giá trị hợp đồng > 0 và có người liên hệ
UPDATE pipeline_stages SET 
    condition_type = 'MIN_AMOUNT',
    exit_condition = 'Giá trị hợp đồng cơ hội phải lớn hơn 0 và đã gắn thông tin người liên hệ',
    condition_required = 1
WHERE id = 3;

-- Giai đoạn 4: "Thương lượng" (NEGOTIATION) -> Điều kiện tùy chọn
UPDATE pipeline_stages SET 
    condition_type = 'NONE',
    exit_condition = NULL,
    condition_required = 0
WHERE id = 4;

-- ========================================================
-- 4. SEED DỮ LIỆU MẪU SẢN PHẨM CƠ HỘI (User Story 1 demo)
-- ========================================================
-- Cơ hội 1: VPBank Thăng Long - Mua Gói CRM Enterprise (Một lần: 25M) + 50 Users (Thuê bao: 350K/tháng * 50 * 12 tháng = 210M)
DELETE FROM opportunity_items WHERE opportunity_id = 1;
INSERT INTO opportunity_items (
    opportunity_id, product_id, product_code, product_name, product_type,
    quantity, unit, unit_price, discount_percent, billing_cycle, billing_duration,
    annual_contract_value, amount, notes
) VALUES 
(
    1, 6, 'SRV-IMPL-BASIC', 'Dịch vụ Triển khai & Cấu hình CRM Cơ bản', 'ONE_TIME',
    1, 'Gói dự án', 25000000.00, 0.00, 'ONE_TIME', 1,
    25000000.00, 25000000.00, 'Triển khai chuẩn Onsite 5 ngày'
),
(
    1, 4, 'CRM-SEAT-PRO', 'Gói người dùng CRM Professional (User/tháng)', 'RECURRING',
    50, 'Người dùng', 350000.00, 10.00, 'MONTHLY', 12,
    189000000.00, 189000000.00, 'Chiết khấu 10% gói hợp đồng 12 tháng (50 users)'
);

-- Cập nhật lại giá trị cơ hội 1 theo tổng sản phẩm = 25M + 189M = 214.000.000 đ
UPDATE opportunities SET amount = 214000000.00 WHERE id = 1;

-- Cơ hội 2: Nem Fashion - Gói Cloud 100 users (Thuê bao: 150K/user/tháng * 100 * 12 tháng = 180M) + Đào tạo (5M)
DELETE FROM opportunity_items WHERE opportunity_id = 2;
INSERT INTO opportunity_items (
    opportunity_id, product_id, product_code, product_name, product_type,
    quantity, unit, unit_price, discount_percent, billing_cycle, billing_duration,
    annual_contract_value, amount, notes
) VALUES 
(
    2, 3, 'CRM-SEAT-STD', 'Gói người dùng CRM Standard (User/tháng)', 'RECURRING',
    100, 'Người dùng', 150000.00, 5.00, 'MONTHLY', 12,
    171000000.00, 171000000.00, 'Thuê bao CRM 1 năm cho chuỗi 20 cửa hàng'
),
(
    2, 8, 'SRV-TRAIN-ON', 'Khóa Đào tạo Chuyển giao Sử dụng CRM (Onsite)', 'ONE_TIME',
    2, 'Buổi đào tạo', 5000000.00, 0.00, 'ONE_TIME', 1,
    10000000.00, 10000000.00, 'Đào tạo 2 đợt cho Quản lý cửa hàng'
);

-- Cập nhật lại giá trị cơ hội 2 = 181.000.000 đ
UPDATE opportunities SET amount = 181000000.00 WHERE id = 2;

-- Cơ hội 3: Viettravel Sun - Tích hợp Tổng đài CTI (Thuê bao: 1.2M/tháng * 12 tháng = 14.4M) + Zalo OA (Thuê bao: 800K/tháng * 12 = 9.6M)
DELETE FROM opportunity_items WHERE opportunity_id = 3;
INSERT INTO opportunity_items (
    opportunity_id, product_id, product_code, product_name, product_type,
    quantity, unit, unit_price, discount_percent, billing_cycle, billing_duration,
    annual_contract_value, amount, notes
) VALUES 
(
    3, 9, 'MOD-VOIP-CALL', 'Module Tích hợp Tổng đài ảo & Ghi âm cuộc gọi (VoIP CTI)', 'RECURRING',
    1, 'Tháng', 1200000.00, 0.00, 'MONTHLY', 12,
    14400000.00, 14400000.00, 'Gói tích hợp tổng đài Cloud PBX 12 tháng'
),
(
    3, 10, 'MOD-ZALO-OA', 'Module Gửi tin Zalo ZNS / Zalo OA & SMS Brandname Tự động', 'RECURRING',
    1, 'Tháng', 800000.00, 0.00, 'MONTHLY', 12,
    9600000.00, 9600000.00, 'Tự động gửi thông báo lịch tour du lịch qua Zalo'
);

-- Cập nhật lại giá trị cơ hội 3 = 24.000.000 đ
UPDATE opportunities SET amount = 24000000.00 WHERE id = 3;

DROP PROCEDURE IF EXISTS AddColumnIfNotExists;
