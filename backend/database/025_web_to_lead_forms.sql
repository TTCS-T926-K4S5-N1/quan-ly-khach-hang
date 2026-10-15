-- =====================================================
-- 025_web_to_lead_forms.sql
-- Triển khai phân hệ Biểu mẫu nhúng thu thập Lead (Web-to-Lead)
-- Cho Nhân viên Marketing & Quản trị viên
-- =====================================================

USE crm_db;

-- 1. Bổ sung trường nguồn lead vào bảng customers (nếu chưa có)
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

CALL AddColumnIfNotExists('customers', 'lead_source', 'VARCHAR(100) NULL');
CALL AddColumnIfNotExists('customers', 'lead_source_id', 'BIGINT NULL');

-- 2. Bảng quản lý biểu mẫu thu thập lead (web_lead_forms)
CREATE TABLE IF NOT EXISTS web_lead_forms (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    form_key VARCHAR(64) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    title VARCHAR(255) NOT NULL DEFAULT 'Đăng ký tư vấn giải pháp',
    description TEXT NULL,
    lead_source_name VARCHAR(100) NOT NULL DEFAULT 'Website / Biểu mẫu',
    lead_source_id BIGINT NULL,
    submit_button_text VARCHAR(100) NOT NULL DEFAULT 'Gửi yêu cầu tư vấn',
    success_message VARCHAR(500) NOT NULL DEFAULT 'Cảm ơn quý khách! Chúng tôi đã nhận được thông tin và sẽ liên hệ lại trong thời gian sớm nhất.',
    redirect_url VARCHAR(500) NULL,
    default_owner_id BIGINT NULL,
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    submissions_count INT NOT NULL DEFAULT 0,
    created_by BIGINT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_form_key (form_key),
    INDEX idx_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Bảng lưu trữ lịch sử gửi biểu mẫu (web_lead_submissions)
CREATE TABLE IF NOT EXISTS web_lead_submissions (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    form_id BIGINT NOT NULL,
    customer_id BIGINT NULL,
    contact_id BIGINT NULL,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    company VARCHAR(255) NULL,
    interest TEXT NULL,
    ip_address VARCHAR(64) NOT NULL,
    user_agent VARCHAR(500) NULL,
    is_spam TINYINT(1) NOT NULL DEFAULT 0,
    spam_reason VARCHAR(255) NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'SUCCESS',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_sub_form (form_id),
    INDEX idx_sub_customer (customer_id),
    INDEX idx_sub_ip_time (ip_address, created_at),
    CONSTRAINT fk_sub_form FOREIGN KEY (form_id) REFERENCES web_lead_forms(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Tạo quyền quản lý biểu mẫu nếu chưa có
INSERT IGNORE INTO permissions (code, name)
VALUES 
    ('lead.form.manage', 'Quản lý biểu mẫu thu thập Lead');

-- Gán quyền cho ADMIN và MARKETING
INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.code IN ('ADMIN', 'MARKETING')
  AND p.code = 'lead.form.manage';

-- 5. Seed dữ liệu mẫu cho biểu mẫu
INSERT INTO web_lead_forms (form_key, name, title, description, lead_source_name, submit_button_text, success_message, default_owner_id, is_active, submissions_count)
VALUES 
    ('wf_landingpage_tuvan', 'Biểu mẫu tư vấn giải pháp Landing Page', 'Đăng ký tư vấn giải pháp Doanh nghiệp', 'Để lại thông tin, đội ngũ chuyên gia của chúng tôi sẽ gọi lại hỗ trợ trong vòng 15 phút.', 'Website / Biểu mẫu', 'Đăng ký tư vấn ngay', 'Cảm ơn quý khách! Chuyên viên tư vấn sẽ liên hệ lại trong thời gian sớm nhất.', 1, 1, 3),
    ('wf_demo_crm_q4', 'Biểu mẫu đăng ký Demo trải nghiệm CRM', 'Trải nghiệm phần mềm CRM miễn phí 14 ngày', 'Khám phá toàn diện tính năng quản lý khách hàng 360, Kanban cơ hội và báo giá.', 'Landing Page Chiến dịch Q4', 'Nhận tài khoản Demo', 'Đăng ký thành công! Vui lòng kiểm tra email để nhận thông tin đăng nhập thử nghiệm.', 1, 1, 1)
ON DUPLICATE KEY UPDATE name = VALUES(name);

-- 6. Seed một số lượt gửi mẫu
INSERT IGNORE INTO web_lead_submissions (form_id, customer_id, full_name, email, phone, company, interest, ip_address, user_agent, is_spam, status, created_at)
SELECT 
    f.id,
    1,
    'Nguyễn Hoàng Long',
    'hoanglong.tech@gmail.com',
    '0912345678',
    'Công ty TNHH Giải Pháp Công Nghệ Long Phát',
    'Cần tư vấn triển khai phân hệ Báo giá và Cơ hội bán hàng cho 20 nhân sự',
    '127.0.0.1',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0',
    0,
    'SUCCESS',
    NOW() - INTERVAL 2 HOUR
FROM web_lead_forms f WHERE f.form_key = 'wf_landingpage_tuvan' LIMIT 1;

INSERT IGNORE INTO web_lead_submissions (form_id, customer_id, full_name, email, phone, company, interest, ip_address, user_agent, is_spam, status, created_at)
SELECT 
    f.id,
    2,
    'Trần Thị Mai Phương',
    'maiphuong.tran@gmail.com',
    '0987654321',
    'Chuỗi cửa hàng Bán lẻ Gia Dụng Việt',
    'Muốn dùng thử tính năng lưu trữ hồ sơ khách hàng 360 độ và chống trùng lặp dữ liệu',
    '127.0.0.1',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0',
    0,
    'SUCCESS',
    NOW() - INTERVAL 1 DAY
FROM web_lead_forms f WHERE f.form_key = 'wf_landingpage_tuvan' LIMIT 1;
