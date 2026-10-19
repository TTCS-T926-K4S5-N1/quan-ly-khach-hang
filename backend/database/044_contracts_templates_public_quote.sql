-- =========================================================================
-- MIGRATION 044: CONTRACTS, DOCUMENT TEMPLATES, PUBLIC QUOTE PORTAL
-- =========================================================================

USE crm_db;

-- 1. Mở rộng bảng quotes: thêm token liên kết khách hàng, phản hồi và liên kết hợp đồng
DROP PROCEDURE IF EXISTS AddColQuotes;
DELIMITER $$
CREATE PROCEDURE AddColQuotes(IN tbl VARCHAR(64), IN col VARCHAR(64), IN col_def TEXT)
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = tbl AND COLUMN_NAME = col
    ) THEN
        SET @s = CONCAT('ALTER TABLE `', tbl, '` ADD COLUMN `', col, '` ', col_def);
        PREPARE stmt FROM @s;
        EXECUTE stmt;
        DEALLOCATE PREPARE stmt;
    END IF;
END$$
DELIMITER ;

CALL AddColQuotes('quotes', 'public_token', 'VARCHAR(100) NULL UNIQUE');
CALL AddColQuotes('quotes', 'customer_feedback', 'VARCHAR(50) NULL');
CALL AddColQuotes('quotes', 'customer_feedback_comment', 'TEXT NULL');
CALL AddColQuotes('quotes', 'customer_feedback_at', 'DATETIME NULL');
CALL AddColQuotes('quotes', 'contract_id', 'BIGINT NULL');

DROP PROCEDURE IF EXISTS AddColQuotes;

-- Tự động sinh public_token cho các báo giá hiện tại nếu chưa có
UPDATE quotes 
SET public_token = MD5(CONCAT(id, '-', quote_number, '-', NOW()))
WHERE public_token IS NULL OR public_token = '';

-- 2. Bảng contracts (Hợp đồng)
CREATE TABLE IF NOT EXISTS contracts (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    contract_number VARCHAR(100) NOT NULL UNIQUE,
    title VARCHAR(255) NOT NULL,
    customer_id BIGINT NOT NULL,
    opportunity_id BIGINT NULL,
    quote_id BIGINT NULL,
    subtotal DECIMAL(15, 2) DEFAULT 0,
    discount_percent DECIMAL(5, 2) DEFAULT 0,
    total_amount DECIMAL(15, 2) DEFAULT 0,
    signed_date DATE NOT NULL,
    effective_date DATE NOT NULL,
    expiry_date DATE NULL,
    payment_terms TEXT NULL,
    status VARCHAR(50) DEFAULT 'ACTIVE', -- DRAFT, ACTIVE, EXPIRED, TERMINATED
    owner_user_id BIGINT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    is_deleted TINYINT(1) DEFAULT 0,
    INDEX idx_contracts_customer (customer_id),
    INDEX idx_contracts_opportunity (opportunity_id),
    INDEX idx_contracts_quote (quote_id),
    INDEX idx_contracts_status (status),
    CONSTRAINT fk_contracts_customer FOREIGN KEY (customer_id) REFERENCES customers(id),
    CONSTRAINT fk_contracts_owner FOREIGN KEY (owner_user_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Bảng contract_items (Dòng sản phẩm hợp đồng)
CREATE TABLE IF NOT EXISTS contract_items (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    contract_id BIGINT NOT NULL,
    product_id BIGINT NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    unit_price DECIMAL(15, 2) DEFAULT 0,
    discount_type VARCHAR(20) DEFAULT 'PERCENT',
    discount_percent DECIMAL(5, 2) DEFAULT 0,
    discount_amount DECIMAL(15, 2) DEFAULT 0,
    amount DECIMAL(15, 2) DEFAULT 0,
    notes TEXT NULL,
    INDEX idx_contract_items_contract (contract_id),
    CONSTRAINT fk_contract_items_contract FOREIGN KEY (contract_id) REFERENCES contracts(id) ON DELETE CASCADE,
    CONSTRAINT fk_contract_items_product FOREIGN KEY (product_id) REFERENCES products(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Bảng document_templates (Cấu hình mẫu in & xuất PDF không cố định trong mã nguồn)
CREATE TABLE IF NOT EXISTS document_templates (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    template_type VARCHAR(50) NOT NULL UNIQUE, -- 'QUOTE', 'CONTRACT'
    template_name VARCHAR(255) NOT NULL,
    company_name VARCHAR(255) NOT NULL DEFAULT 'TẬP ĐOÀN CÔNG NGHỆ & GIẢI PHÁP CRM ENTERPRISE VIỆT NAM',
    company_tax_code VARCHAR(50) DEFAULT '0108996688',
    company_address VARCHAR(500) DEFAULT 'Tầng 18, Tòa nhà Keangnam Landmark 72, Mễ Trì, Nam Từ Liêm, Hà Nội',
    company_phone VARCHAR(50) DEFAULT '1900 8866 - 024.3988.9999',
    company_email VARCHAR(100) DEFAULT 'sales@crmenterprise.vn',
    company_bank_info VARCHAR(500) DEFAULT 'Ngân hàng TMCP Quân Đội (MBBank) - Chi nhánh Sở Giao Dịch - STK: 888899996666',
    company_logo_url TEXT NULL,
    header_content TEXT NULL,
    footer_content TEXT NULL,
    default_terms TEXT NULL,
    updated_by BIGINT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Seed mẫu mặc định cho Báo giá và Hợp đồng
INSERT INTO document_templates (
    template_type, template_name, company_name, company_tax_code, company_address,
    company_phone, company_email, company_bank_info, company_logo_url,
    header_content, footer_content, default_terms
) VALUES 
(
    'QUOTE',
    'Mẫu Báo giá Doanh nghiệp Chuẩn Nhận diện',
    'TẬP ĐOÀN CÔNG NGHỆ & GIẢI PHÁP CRM ENTERPRISE VIỆT NAM',
    '0108996688',
    'Tầng 18, Tòa nhà Keangnam Landmark 72, Mễ Trì, Nam Từ Liêm, Hà Nội',
    '1900 8866 - 024.3988.9999',
    'sales@crmenterprise.vn',
    'Ngân hàng TMCP Quân Đội (MBBank) - Chi nhánh Sở Giao Dịch - STK: 888899996666',
    'https://images.unsplash.com/photo-1599305445671-ac291c95aaa9?w=200&auto=format&fit=crop&q=80',
    'Kính gửi Quý khách hàng báo giá giải pháp chuyển đổi số và tối ưu hóa quản lý quan hệ khách hàng.',
    'Báo giá có giá trị trong thời hạn hiệu lực. Cảm ơn Quý khách đã tin tưởng và hợp tác cùng chúng tôi.',
    '• Đơn giá chưa bao gồm thuế VAT (nếu có ghi chú riêng).\n• Thời gian giao hàng và triển khai theo thỏa thuận.\n• Thanh toán bằng chuyển khoản theo thông tin tài khoản công ty.'
),
(
    'CONTRACT',
    'Mẫu Hợp đồng Kinh tế & Triển khai Phần mềm',
    'TẬP ĐOÀN CÔNG NGHỆ & GIẢI PHÁP CRM ENTERPRISE VIỆT NAM',
    '0108996688',
    'Tầng 18, Tòa nhà Keangnam Landmark 72, Mễ Trì, Nam Từ Liêm, Hà Nội',
    '1900 8866 - 024.3988.9999',
    'sales@crmenterprise.vn',
    'Ngân hàng TMCP Quân Đội (MBBank) - Chi nhánh Sở Giao Dịch - STK: 888899996666',
    'https://images.unsplash.com/photo-1599305445671-ac291c95aaa9?w=200&auto=format&fit=crop&q=80',
    'HỢP ĐỒNG CUNG CẤP GIẢI PHÁP VÀ BẢN QUYỀN PHẦN MỀM QUẢN TRỊ KHÁCH HÀNG CRM',
    'Hợp đồng được lập thành 02 (hai) bản có giá trị pháp lý như nhau, mỗi bên giữ 01 (một) bản để thực hiện.',
    '• Bên A cam kết bàn giao phần mềm đúng thời hạn và đào tạo chuyển giao công nghệ đầy đủ.\n• Bên B có trách nhiệm thanh toán đúng tiến độ đã thỏa thuận.\n• Hai bên cam kết thực hiện đúng các điều khoản hợp đồng đã ký kết.'
)
ON DUPLICATE KEY UPDATE 
    company_name = VALUES(company_name),
    company_tax_code = VALUES(company_tax_code),
    company_address = VALUES(company_address),
    company_phone = VALUES(company_phone),
    company_email = VALUES(company_email),
    company_bank_info = VALUES(company_bank_info);
