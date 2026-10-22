-- 024_opportunity_items_scrum_74.sql
-- SCRUM-74: Thêm sản phẩm dịch vụ vào cơ hội để tính giá trị hợp đồng
-- Hỗ trợ dịch vụ một lần (ONE_TIME) và dịch vụ thuê bao (RECURRING - số kỳ và giá trị hợp đồng theo năm ACV)

USE crm_db;

DELIMITER $$

DROP PROCEDURE IF EXISTS AddColumnIfNotExists$$
CREATE PROCEDURE AddColumnIfNotExists(
    IN p_table_name VARCHAR(64),
    IN p_column_name VARCHAR(64),
    IN p_column_definition VARCHAR(255)
)
BEGIN
    DECLARE col_exists INT DEFAULT 0;
    SELECT COUNT(*) INTO col_exists
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = p_table_name
      AND COLUMN_NAME = p_column_name;

    IF col_exists = 0 THEN
        SET @sql = CONCAT('ALTER TABLE `', p_table_name, '` ADD COLUMN `', p_column_name, '` ', p_column_definition);
        PREPARE stmt FROM @sql;
        EXECUTE stmt;
        DEALLOCATE PREPARE stmt;
    END IF;
END$$

DELIMITER ;

-- 1. Thêm cột annual_amount vào bảng opportunities (Giá trị hợp đồng theo năm / Annual Contract Value)
CALL AddColumnIfNotExists('opportunities', 'annual_amount', 'DECIMAL(18,2) NOT NULL DEFAULT 0.00');

-- 2. Tạo bảng opportunity_items (Dòng sản phẩm dịch vụ trong cơ hội)
CREATE TABLE IF NOT EXISTS opportunity_items (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    opportunity_id BIGINT NOT NULL,
    product_id BIGINT NOT NULL,
    quantity DECIMAL(12,2) NOT NULL DEFAULT 1.00,
    unit_price DECIMAL(18,2) NOT NULL DEFAULT 0.00,
    list_price DECIMAL(18,2) NOT NULL DEFAULT 0.00,
    discount_percent DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    product_type VARCHAR(50) NOT NULL DEFAULT 'ONE_TIME',
    billing_cycle VARCHAR(50) NULL DEFAULT 'ONE_TIME',
    term_count INT NOT NULL DEFAULT 1,
    annual_amount DECIMAL(18,2) NOT NULL DEFAULT 0.00,
    total_amount DECIMAL(18,2) NOT NULL DEFAULT 0.00,
    notes TEXT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    KEY idx_opportunity_items_opp (opportunity_id),
    KEY idx_opportunity_items_prod (product_id),
    CONSTRAINT fk_opportunity_items_opportunity FOREIGN KEY (opportunity_id) REFERENCES opportunities(id) ON DELETE CASCADE,
    CONSTRAINT fk_opportunity_items_product FOREIGN KEY (product_id) REFERENCES products(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3. Seed dữ liệu mẫu cho cơ hội nếu có
INSERT INTO opportunity_items (
    opportunity_id, product_id, quantity, unit_price, list_price, discount_percent,
    product_type, billing_cycle, term_count, annual_amount, total_amount, notes
)
SELECT
    1, p.id, 10.00, 350000.00, 350000.00, 0.00,
    'RECURRING', 'MONTHLY', 12, 42000000.00, 42000000.00, 'Gói người dùng CRM Professional 10 users x 12 tháng'
FROM products p
WHERE p.code = 'CRM-SEAT-PRO'
  AND EXISTS (SELECT 1 FROM opportunities WHERE id = 1)
  AND NOT EXISTS (SELECT 1 FROM opportunity_items WHERE opportunity_id = 1 AND product_id = p.id)
LIMIT 1;

INSERT INTO opportunity_items (
    opportunity_id, product_id, quantity, unit_price, list_price, discount_percent,
    product_type, billing_cycle, term_count, annual_amount, total_amount, notes
)
SELECT
    1, p.id, 1.00, 25000000.00, 25000000.00, 0.00,
    'ONE_TIME', 'ONE_TIME', 1, 0.00, 25000000.00, 'Dịch vụ triển khai & cấu hình ban đầu'
FROM products p
WHERE p.code = 'SRV-IMPL-BASIC'
  AND EXISTS (SELECT 1 FROM opportunities WHERE id = 1)
  AND NOT EXISTS (SELECT 1 FROM opportunity_items WHERE opportunity_id = 1 AND product_id = p.id)
LIMIT 1;
