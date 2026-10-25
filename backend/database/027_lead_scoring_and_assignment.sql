USE crm_db;

-- 1. Bảng quy tắc chấm điểm Lead (Lead Scoring Criteria & Rules)
CREATE TABLE IF NOT EXISTS lead_scoring_rules (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    category VARCHAR(50) NOT NULL,              -- INDUSTRY, COMPANY_SIZE, LEAD_SOURCE, INTEREST_LEVEL, REGION
    criterion_key VARCHAR(100) NOT NULL,         -- CNTT, BDS, TREN_500, WEBSITE, HOI_THAO...
    criterion_name VARCHAR(255) NOT NULL,        -- Tên hiển thị dễ đọc
    score INT NOT NULL DEFAULT 0,                -- Điểm cộng hoặc trừ (+30, +20, -10...)
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_scoring_category (category, active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Bảng ngưỡng phân loại Nóng, Ấm, Lạnh (Score Grade Thresholds)
CREATE TABLE IF NOT EXISTS lead_score_thresholds (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    grade VARCHAR(20) NOT NULL UNIQUE,           -- HOT, WARM, COLD
    min_score INT NOT NULL DEFAULT 0,            -- Điểm tối thiểu để đạt hạng này
    label VARCHAR(100) NOT NULL,                 -- Nóng (Hot Lead), Ấm (Warm Lead), Lạnh (Cold Lead)
    color VARCHAR(30) NOT NULL,                  -- Mã màu HEX
    icon VARCHAR(30) NOT NULL,                   -- Emoji hoặc Icon
    description VARCHAR(255) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Cập nhật bảng customers: Thêm điểm, phân hạng, trạng thái phân bổ
SET @lead_score_col = (
    SELECT COUNT(*) FROM information_schema.COLUMNS 
    WHERE TABLE_SCHEMA = 'crm_db' AND TABLE_NAME = 'customers' AND COLUMN_NAME = 'lead_score'
);
SET @sql_score = IF(@lead_score_col = 0, 
    'ALTER TABLE customers ADD COLUMN lead_score INT NOT NULL DEFAULT 0, ADD COLUMN score_grade VARCHAR(20) NOT NULL DEFAULT ''COLD'', ADD COLUMN score_breakdown TEXT NULL, ADD COLUMN assignment_status VARCHAR(30) NOT NULL DEFAULT ''UNASSIGNED'', ADD COLUMN assigned_rule_id BIGINT NULL, ADD COLUMN assigned_at DATETIME NULL', 
    'SELECT 1'
);
PREPARE stmt_score FROM @sql_score;
EXECUTE stmt_score;
DEALLOCATE PREPARE stmt_score;

-- 4. Bảng quy tắc phân bổ Lead tự động (Lead Assignment Rules)
CREATE TABLE IF NOT EXISTS lead_assignment_rules (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,                  -- Tên quy tắc phân bổ
    priority INT NOT NULL DEFAULT 1,             -- Độ ưu tiên (1 là cao nhất, quy tắc khớp đầu tiên sẽ thắng)
    active BOOLEAN NOT NULL DEFAULT TRUE,
    target_type VARCHAR(30) NOT NULL DEFAULT 'ROUND_ROBIN', -- ROUND_ROBIN, DIRECT_USER
    assignee_user_id BIGINT NULL,                -- Nếu DIRECT_USER
    assignee_team_id BIGINT NULL,                -- Nếu gán cho team
    assignee_user_ids TEXT NULL,                 -- JSON mảng user_id: [4, 5] cho Round Robin
    last_assigned_user_id BIGINT NULL,           -- User vừa được gán lần trước (để xoay vòng)
    -- Tiêu chí lọc
    condition_region_id BIGINT NULL,             -- Lọc theo khu vực
    condition_industry_id BIGINT NULL,           -- Lọc theo ngành nghề
    condition_lead_source VARCHAR(100) NULL,     -- Lọc theo nguồn lead
    condition_company_size_id BIGINT NULL,       -- Lọc theo quy mô doanh nghiệp
    condition_min_score INT NULL,                -- Chỉ phân bổ lead đạt số điểm tối thiểu
    description TEXT NULL,
    created_by BIGINT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_assign_priority (priority, active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Bảng nhật ký phân bổ Lead (Lead Assignment History & Audit)
CREATE TABLE IF NOT EXISTS lead_assignment_logs (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    lead_id BIGINT NOT NULL,
    rule_id BIGINT NULL,
    assigned_to_user_id BIGINT NOT NULL,
    assigned_by_user_id BIGINT NULL,             -- NULL nếu hệ thống tự phân, có ID nếu Trưởng nhóm phân tay
    method VARCHAR(40) NOT NULL,                 -- AUTO_RULE_ROUND_ROBIN, AUTO_RULE_DIRECT, MANUAL_DISPATCH
    rule_name VARCHAR(255) NULL,
    notes TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_log_lead (lead_id),
    INDEX idx_log_assignee (assigned_to_user_id),
    CONSTRAINT fk_assign_log_customer FOREIGN KEY (lead_id) REFERENCES customers(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Phân quyền Lead Routing cho Giám đốc và Quản trị viên
INSERT IGNORE INTO permissions (code, name) VALUES
('lead.routing.read', 'Xem cấu hình phân bổ và chấm điểm lead'),
('lead.routing.manage', 'Quản lý quy tắc phân bổ và tiêu chí chấm điểm lead');

INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.code IN ('ADMIN', 'DIRECTOR', 'MANAGER') 
  AND p.code IN ('lead.routing.read', 'lead.routing.manage');

-- 7. Nạp sẵn Tiêu chí chấm điểm Lead mẫu (Seed Scoring Criteria)
INSERT INTO lead_score_thresholds (grade, min_score, label, color, icon, description) VALUES
('HOT',  70, 'Nóng (Hot Lead)', '#ef4444', '🔥', 'Khả năng chốt cực cao, cần liên hệ ngay trong 15 phút'),
('WARM', 40, 'Ấm (Warm Lead)', '#f59e0b', '☀️', 'Có nhu cầu rõ ràng, cần liên hệ trong 4 giờ'),
('COLD',  0, 'Lạnh (Cold Lead)', '#3b82f6', '❄️', 'Tiềm năng thấp/mới tìm hiểu, ưu tiên nuôi dưỡng tự động')
ON DUPLICATE KEY UPDATE min_score = VALUES(min_score), label = VALUES(label), color = VALUES(color), icon = VALUES(icon);

INSERT IGNORE INTO lead_scoring_rules (category, criterion_key, criterion_name, score, active) VALUES
-- Ngành nghề
('INDUSTRY', '1', 'Công nghệ thông tin & Viễn thông', 25, TRUE),
('INDUSTRY', '2', 'Bất động sản & Xây dựng', 20, TRUE),
('INDUSTRY', '6', 'Sản xuất & Chế tạo', 20, TRUE),
('INDUSTRY', '3', 'Bán lẻ & Thương mại điện tử', 15, TRUE),
('INDUSTRY', '4', 'Tài chính - Ngân hàng - Bảo hiểm', 15, TRUE),

-- Quy mô doanh nghiệp
('COMPANY_SIZE', '14', 'Trên 500 nhân sự (Doanh nghiệp lớn)', 30, TRUE),
('COMPANY_SIZE', '13', '200 - 500 nhân sự', 25, TRUE),
('COMPANY_SIZE', '12', '50 - 200 nhân sự', 20, TRUE),
('COMPANY_SIZE', '11', '20 - 50 nhân sự', 10, TRUE),
('COMPANY_SIZE', '10', 'Dưới 20 nhân sự', 5, TRUE),

-- Nguồn Lead
('LEAD_SOURCE', 'GIOI_THIEU', 'Người quen giới thiệu (Độ tin cậy cao)', 25, TRUE),
('LEAD_SOURCE', 'HOI_THAO', 'Hội thảo / Triển lãm ngành (VietBuild, TechFest)', 20, TRUE),
('LEAD_SOURCE', 'WEBSITE', 'Website / Google Tìm kiếm tự nhiên', 15, TRUE),
('LEAD_SOURCE', 'FACEBOOK', 'Quảng cáo Facebook Lead Ads', 10, TRUE),
('LEAD_SOURCE', 'COLD_CALL', 'Telesales / Tiếp cận trực tiếp', 5, TRUE),

-- Mức độ quan tâm / Ý định mua
('INTEREST_LEVEL', 'HIGH', 'Có dự toán rõ ràng & Cần triển khai gấp', 25, TRUE),
('INTEREST_LEVEL', 'MEDIUM', 'Đang so sánh giải pháp với đối thủ', 15, TRUE),
('INTEREST_LEVEL', 'LOW', 'Chỉ xin bảng giá tham khảo', 5, TRUE);

-- 8. Nạp sẵn Quy tắc Phân bổ Lead mẫu (Seed Assignment Rules)
-- Rule 1: Khu vực Miền Bắc & Hà Nội (region_id = 21, 22) -> Round Robin giữa Lê Hoàng Nam (User 4) và Phạm Mai Phương (User 5)
INSERT INTO lead_assignment_rules 
(id, name, priority, active, target_type, assignee_team_id, assignee_user_ids, condition_region_id, description)
VALUES 
(1, 'Phân bổ Khách hàng Miền Bắc & Hà Nội (Round Robin)', 1, TRUE, 'ROUND_ROBIN', 2, '[4, 5]', 22, 'Tự động chia đều cho các chuyên viên kinh doanh thuộc Đội Miền Bắc')
ON DUPLICATE KEY UPDATE name = VALUES(name), priority = VALUES(priority), assignee_user_ids = VALUES(assignee_user_ids);

-- Rule 2: Khu vực Miền Nam & TP.HCM (region_id = 26) -> Round Robin giữa Hoàng Kim Yến (User 9) và Trương Tuấn Anh (User 10)
INSERT INTO lead_assignment_rules 
(id, name, priority, active, target_type, assignee_team_id, assignee_user_ids, condition_region_id, description)
VALUES 
(2, 'Phân bổ Khách hàng Miền Nam & TP.HCM (Round Robin)', 2, TRUE, 'ROUND_ROBIN', 7, '[9, 10]', 26, 'Tự động chia đều cho các chuyên viên kinh doanh thuộc Đội Miền Nam')
ON DUPLICATE KEY UPDATE name = VALUES(name), priority = VALUES(priority), assignee_user_ids = VALUES(assignee_user_ids);

-- Rule 3: Khu vực Miền Trung & Đà Nẵng (region_id = 24) -> Gán trực tiếp cho Đỗ Thị Tuyết (User 7)
INSERT INTO lead_assignment_rules 
(id, name, priority, active, target_type, assignee_user_id, condition_region_id, description)
VALUES 
(3, 'Phân bổ Khách hàng Đà Nẵng & Miền Trung (Direct)', 3, TRUE, 'DIRECT_USER', 7, 24, 'Chuyển trực tiếp cho Đỗ Thị Tuyết phụ trách thị trường miền Trung')
ON DUPLICATE KEY UPDATE name = VALUES(name), priority = VALUES(priority), assignee_user_id = VALUES(assignee_user_id);

-- Rule 4: Khách hàng Ngành CNTT Toàn quốc (industry_id = 1) -> Round Robin Lê Hoàng Nam (User 4) & Hoàng Kim Yến (User 9)
INSERT INTO lead_assignment_rules 
(id, name, priority, active, target_type, assignee_user_ids, condition_industry_id, description)
VALUES 
(4, 'Phân bổ Lead Ngành Công nghệ thông tin B2B (Round Robin)', 4, TRUE, 'ROUND_ROBIN', '[4, 9]', 1, 'Chuyên viên phụ trách khách hàng ngành phần mềm công nghệ')
ON DUPLICATE KEY UPDATE name = VALUES(name), priority = VALUES(priority), assignee_user_ids = VALUES(assignee_user_ids);

-- 9. Cập nhật trạng thái phân bổ và điểm số ban đầu cho dữ liệu khách hàng hiện có
UPDATE customers SET assignment_status = 'ASSIGNED' WHERE owner_user_id IS NOT NULL;
UPDATE customers SET assignment_status = 'UNASSIGNED' WHERE owner_user_id IS NULL;
