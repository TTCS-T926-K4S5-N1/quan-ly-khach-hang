-- 043_quotes_approval_versions.sql
-- Thêm các trường hỗ trợ:
-- 1. Kế thừa từ cơ hội, chiết khấu dòng theo % hoặc tiền, điều khoản thanh toán & giao hàng
-- 2. Duyệt báo giá theo 2 tầng ngưỡng (Trưởng nhóm / Giám đốc) & lịch sử duyệt bất biến
-- 3. Quản lý nhiều phiên bản báo giá (v1, v2...) & so sánh phiên bản (Side-by-side diff)

SET NAMES utf8mb4;

DROP PROCEDURE IF EXISTS AddQuoteColSafe;
DELIMITER $$
CREATE PROCEDURE AddQuoteColSafe(
    IN tblName VARCHAR(64),
    IN colName VARCHAR(64),
    IN colDef TEXT
)
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.COLUMNS 
        WHERE TABLE_SCHEMA = DATABASE() 
          AND TABLE_NAME = tblName 
          AND COLUMN_NAME = colName
    ) THEN
        SET @s = CONCAT('ALTER TABLE `', tblName, '` ADD COLUMN `', colName, '` ', colDef);
        PREPARE stmt FROM @s;
        EXECUTE stmt;
        DEALLOCATE PREPARE stmt;
    END IF;
END $$
DELIMITER ;

-- Thêm cột cho bảng quotes
CALL AddQuoteColSafe('quotes', 'valid_until', 'DATE NULL');
CALL AddQuoteColSafe('quotes', 'payment_terms', 'TEXT NULL');
CALL AddQuoteColSafe('quotes', 'delivery_terms', 'TEXT NULL');
CALL AddQuoteColSafe('quotes', 'terms_and_conditions', 'TEXT NULL');
CALL AddQuoteColSafe('quotes', 'approval_level', "VARCHAR(50) NOT NULL DEFAULT 'NONE'");
CALL AddQuoteColSafe('quotes', 'rejection_reason', 'TEXT NULL');
CALL AddQuoteColSafe('quotes', 'sent_to_customer_at', 'DATETIME NULL');
CALL AddQuoteColSafe('quotes', 'version', 'INT NOT NULL DEFAULT 1');
CALL AddQuoteColSafe('quotes', 'parent_quote_id', 'BIGINT NULL');
CALL AddQuoteColSafe('quotes', 'is_active_version', 'TINYINT(1) NOT NULL DEFAULT 1');

-- Thêm cột cho bảng quote_items
CALL AddQuoteColSafe('quote_items', 'discount_type', "VARCHAR(20) NOT NULL DEFAULT 'PERCENT'");
CALL AddQuoteColSafe('quote_items', 'discount_amount', 'DECIMAL(18,2) NOT NULL DEFAULT 0.00');
CALL AddQuoteColSafe('quote_items', 'notes', 'VARCHAR(500) NULL');

DROP PROCEDURE IF EXISTS AddQuoteColSafe;

-- Tạo bảng quote_approvals (Lịch sử duyệt báo giá - không sửa không xóa)
CREATE TABLE IF NOT EXISTS quote_approvals (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    quote_id BIGINT NOT NULL,
    approver_user_id BIGINT NOT NULL,
    approver_name VARCHAR(150) NOT NULL,
    approver_role VARCHAR(100) NOT NULL,
    action VARCHAR(50) NOT NULL, -- APPROVE, REJECT, REQUEST_CHANGES
    comment TEXT NULL,
    discount_percent DECIMAL(5,2) NULL,
    total_amount DECIMAL(18,2) NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_quote_approvals_quote (quote_id),
    INDEX idx_quote_approvals_created (created_at),
    CONSTRAINT fk_quote_approvals_quote FOREIGN KEY (quote_id) REFERENCES quotes(id) ON DELETE CASCADE,
    CONSTRAINT fk_quote_approvals_user FOREIGN KEY (approver_user_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Cập nhật dữ liệu mẫu cho các báo giá hiện có
UPDATE quotes 
SET 
    valid_until = DATE_ADD(created_at, INTERVAL 30 DAY),
    payment_terms = 'Thanh toán đợt 1: 50% ngay sau khi ký hợp đồng; đợt 2: 50% trong vòng 7 ngày sau khi nghiệm thu bàn giao.',
    delivery_terms = 'Triển khai cài đặt và cấu hình hệ thống trong vòng 10 ngày làm việc kể từ ngày nhận tạm ứng.',
    approval_level = CASE 
        WHEN discount_percent > 20 THEN 'DIRECTOR'
        WHEN discount_percent > 10 THEN 'TEAM_LEAD'
        ELSE 'NONE'
    END
WHERE valid_until IS NULL;

-- Đảm bảo có ít nhất 1 cơ hội mẫu có dòng sản phẩm trong opportunity_items để test kế thừa báo giá
INSERT INTO opportunity_items (opportunity_id, product_id, product_code, product_name, product_type, quantity, unit, unit_price, discount_percent, amount)
SELECT 1, p.id, p.code, p.name, 'ONE_TIME', 2, p.unit, p.list_price, 0.00, p.list_price * 2
FROM products p
WHERE p.active = 1
ORDER BY p.id ASC
LIMIT 2
ON DUPLICATE KEY UPDATE quantity = VALUES(quantity);
