-- ==============================================================================
-- MIGRATION 026: MARKETING CAMPAIGNS & ADVANCED LEAD DEDUPLICATION (SCRUM)
-- 1. Bảng campaigns: Khai báo chiến dịch, ngân sách, thời gian, kênh
-- 2. Cột campaign_id trên customers (Lead) và opportunities (Cơ hội)
-- 3. Quyền hạn campaign.read, campaign.manage
-- 4. Dữ liệu mẫu đo lường ROI và kiểm tra trùng lặp
-- ==============================================================================

USE crm_db;

-- 1. TẠO BẢNG campaigns
CREATE TABLE IF NOT EXISTS campaigns (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    channel VARCHAR(50) NOT NULL DEFAULT 'HOI_THAO',
    budget DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    expected_revenue DECIMAL(15,2) DEFAULT 0.00,
    actual_cost DECIMAL(15,2) DEFAULT 0.00,
    start_date DATE NULL,
    end_date DATE NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
    description TEXT NULL,
    owner_user_id BIGINT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_campaign_owner FOREIGN KEY (owner_user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. BỔ SUNG CỘT campaign_id VÀO BẢNG customers NẾU CHƯA CÓ
SET @col_cust_exists = (
    SELECT COUNT(*) FROM information_schema.COLUMNS 
    WHERE TABLE_SCHEMA = 'crm_db' AND TABLE_NAME = 'customers' AND COLUMN_NAME = 'campaign_id'
);
SET @sql_cust = IF(@col_cust_exists = 0, 
    'ALTER TABLE customers ADD COLUMN campaign_id BIGINT NULL, ADD CONSTRAINT fk_customers_campaign FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE SET NULL', 
    'SELECT 1'
);
PREPARE stmt_cust FROM @sql_cust;
EXECUTE stmt_cust;
DEALLOCATE PREPARE stmt_cust;

-- 3. BỔ SUNG CỘT campaign_id VÀO BẢNG opportunities NẾU CHƯA CÓ
SET @col_opp_exists = (
    SELECT COUNT(*) FROM information_schema.COLUMNS 
    WHERE TABLE_SCHEMA = 'crm_db' AND TABLE_NAME = 'opportunities' AND COLUMN_NAME = 'campaign_id'
);
SET @sql_opp = IF(@col_opp_exists = 0, 
    'ALTER TABLE opportunities ADD COLUMN campaign_id BIGINT NULL, ADD CONSTRAINT fk_opportunities_campaign FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE SET NULL', 
    'SELECT 1'
);
PREPARE stmt_opp FROM @sql_opp;
EXECUTE stmt_opp;
DEALLOCATE PREPARE stmt_opp;

-- 4. BỔ SUNG QUYỀN HẠN CHO MODULE CHIẾN DỊCH
INSERT INTO permissions (code, name) VALUES
('campaign.read', 'Xem chiến dịch marketing'),
('campaign.create', 'Tạo chiến dịch marketing'),
('campaign.update', 'Cập nhật chiến dịch marketing'),
('campaign.delete', 'Xóa chiến dịch marketing'),
('campaign.manage', 'Quản lý toàn diện chiến dịch')
ON DUPLICATE KEY UPDATE name = VALUES(name);

-- Gán quyền cho các vai trò quản lý (ADMIN, DIRECTOR, MANAGER) và MARKETING
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.code IN ('ADMIN', 'DIRECTOR', 'MANAGER', 'MARKETING')
  AND p.code LIKE 'campaign.%'
ON DUPLICATE KEY UPDATE role_id = VALUES(role_id);

-- 5. SEED DỮ LIỆU MẪU CÁC CHIẾN DỊCH TIÊU BIỂU
INSERT INTO campaigns (id, code, name, channel, budget, expected_revenue, actual_cost, start_date, end_date, status, description, owner_user_id)
VALUES
(1, 'CAMP-VIETBUILD-2026', 'Hội thảo & Triển lãm Ngành Xây dựng VietBuild 2026', 'HOI_THAO', 50000000.00, 350000000.00, 48500000.00, '2026-10-01', '2026-10-31', 'ACTIVE', 'Thu thập danh thiếp và lead B2B trực tiếp tại gian hàng hội thảo VietBuild Hà Nội.', 1),
(2, 'CAMP-FB-B2B-Q4', 'Chiến dịch Quảng cáo Facebook Lead Ads B2B Quý 4', 'FACEBOOK', 35000000.00, 200000000.00, 31200000.00, '2026-10-05', '2026-11-20', 'ACTIVE', 'Chạy form thu thập khách hàng tiềm năng qua Facebook Lead Ads cho phân khúc SMB.', 1),
(3, 'CAMP-GOOGLE-SEARCH', 'Google Search Ads - Giải pháp Phần mềm Quản trị CRM Doanh nghiệp', 'GOOGLE_ADS', 45000000.00, 400000000.00, 42000000.00, '2026-09-15', '2026-12-31', 'ACTIVE', 'Chiến dịch từ khóa Google Search đón đầu nhu cầu chuyển đổi số cuối năm.', 1),
(4, 'CAMP-EMAIL-REACTIVATE', 'Email Marketing Nuôi dưỡng & Kích hoạt lại Khách hàng Cũ', 'EMAIL', 10000000.00, 120000000.00, 8500000.00, '2026-10-10', '2026-11-10', 'ACTIVE', 'Chuỗi email tự động gửi ưu đãi đặc biệt cho danh sách lead chưa chốt năm trước.', 1)
ON DUPLICATE KEY UPDATE
    name = VALUES(name),
    budget = VALUES(budget),
    expected_revenue = VALUES(expected_revenue),
    actual_cost = VALUES(actual_cost),
    status = VALUES(status);

-- 6. GẮN CHIẾN DỊCH CHO MỘT SỐ KHÁCH HÀNG & LEAD ĐANG CÓ ĐỂ CÓ SỐ LIỆU ĐO LƯỜNG
-- Khách 1, 12, 13 gán vào Chiến dịch 1 (VietBuild)
UPDATE customers SET campaign_id = 1, lead_source = 'Hội thảo / Sự kiện' WHERE id IN (1, 12, 13);
-- Khách 3, 7 gán vào Chiến dịch 2 (Facebook)
UPDATE customers SET campaign_id = 2, lead_source = 'Mạng xã hội' WHERE id IN (3, 7);
-- Khách 2, 4 gán vào Chiến dịch 3 (Google Ads)
UPDATE customers SET campaign_id = 3, lead_source = 'Google Search' WHERE id IN (2, 4);
-- Khách Web-to-lead (>= 15) gán vào Chiến dịch 2 (Facebook)
UPDATE customers SET campaign_id = 2, lead_source = 'Form Website' WHERE id >= 15 AND campaign_id IS NULL;

-- 7. GẮN CHIẾN DỊCH CHO CÁC CƠ HỘI BÁN HÀNG TƯƠNG ỨNG ĐỂ TÍNH TOÁN DOANH THU & ROI
UPDATE opportunities o 
JOIN customers c ON c.id = o.customer_id 
SET o.campaign_id = c.campaign_id 
WHERE c.campaign_id IS NOT NULL;

-- Đảm bảo có cơ hội WON thuộc Chiến dịch 1 để kiểm chứng doanh thu chốt và ROI
UPDATE opportunities SET status = 'WON', stage_id = 5, amount = 180000000.00 WHERE id = 1 AND campaign_id = 1;
UPDATE opportunities SET status = 'WON', stage_id = 5, amount = 95000000.00 WHERE id = 101 AND campaign_id = 1;
