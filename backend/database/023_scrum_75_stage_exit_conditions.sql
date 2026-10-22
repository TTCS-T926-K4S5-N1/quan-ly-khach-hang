USE crm_db;
SET NAMES utf8mb4;

-- ========================================================
-- SCRUM-75: Điều kiện bắt buộc khi cơ hội rời một giai đoạn
-- ========================================================

-- 1. Đảm bảo bảng pipeline_stages có cột exit_condition và condition_required
SET @has_exit_cond = (
    SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'pipeline_stages' AND COLUMN_NAME = 'exit_condition'
);
SET @sql = IF(@has_exit_cond = 0,
    'ALTER TABLE pipeline_stages ADD COLUMN exit_condition VARCHAR(255) NULL',
    'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @has_cond_req = (
    SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'pipeline_stages' AND COLUMN_NAME = 'condition_required'
);
SET @sql = IF(@has_cond_req = 0,
    'ALTER TABLE pipeline_stages ADD COLUMN condition_required TINYINT(1) NOT NULL DEFAULT 0',
    'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 2. Thêm các cột ghi vết override vào bảng opportunities
SET @has_last_override_reason = (
    SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'opportunities' AND COLUMN_NAME = 'last_stage_override_reason'
);
SET @sql = IF(@has_last_override_reason = 0,
    'ALTER TABLE opportunities ADD COLUMN last_stage_override_reason TEXT NULL',
    'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @has_last_overridden_by = (
    SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'opportunities' AND COLUMN_NAME = 'last_stage_overridden_by'
);
SET @sql = IF(@has_last_overridden_by = 0,
    'ALTER TABLE opportunities ADD COLUMN last_stage_overridden_by BIGINT NULL',
    'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @has_last_overridden_at = (
    SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'opportunities' AND COLUMN_NAME = 'last_stage_overridden_at'
);
SET @sql = IF(@has_last_overridden_at = 0,
    'ALTER TABLE opportunities ADD COLUMN last_stage_overridden_at DATETIME NULL',
    'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 3. Tạo bảng opportunity_stage_history để lưu lịch sử chuyển giai đoạn & ghi đè
CREATE TABLE IF NOT EXISTS opportunity_stage_history (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    opportunity_id BIGINT NOT NULL,
    from_stage_id BIGINT NULL,
    to_stage_id BIGINT NOT NULL,
    is_overridden TINYINT(1) NOT NULL DEFAULT 0,
    override_reason TEXT NULL,
    changed_by_user_id BIGINT NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    KEY idx_opp_stage_hist_opp (opportunity_id),
    KEY idx_opp_stage_hist_user (changed_by_user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 4. Thêm quyền opportunity.stage.override và gán cho các vai trò quản lý
INSERT IGNORE INTO permissions (code, name) VALUES
('opportunity.stage.override', 'Ghi đè điều kiện chuyển giai đoạn cơ hội');

-- Gán quyền cho ADMIN, DIRECTOR, TEAM_LEAD (hoặc MANAGER)
INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE p.code = 'opportunity.stage.override'
  AND r.code IN ('ADMIN', 'DIRECTOR', 'TEAM_LEAD', 'MANAGER');

-- 5. Cấu hình điều kiện rời giai đoạn mẫu cho quy trình chuẩn
UPDATE pipeline_stages
SET exit_condition = 'Phải có ít nhất một cuộc gặp được ghi nhận',
    condition_required = 1
WHERE order_no = 1 OR code = 'NEW';

UPDATE pipeline_stages
SET exit_condition = 'Phải có thông tin người liên hệ',
    condition_required = 1
WHERE order_no = 2 OR code = 'QUALIFIED';
