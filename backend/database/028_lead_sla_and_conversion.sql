-- ==============================================================================
-- 028_lead_sla_and_conversion.sql
-- Triển khai tính năng:
-- 1. Nhận / Từ chối Lead với Ràng buộc SLA Phản hồi (Accept / Reject / SLA Tracking)
-- 2. Chuyển đổi Lead đủ điều kiện thành Khách hàng, Người liên hệ, Cơ hội (Convert Lead)
-- ==============================================================================

SET NAMES utf8mb4;

-- 1. Thêm các trường hỗ trợ Quản lý SLA và Chuyển đổi vào bảng customers
SET @sla_col = (
    SELECT COUNT(*) FROM information_schema.COLUMNS 
    WHERE TABLE_SCHEMA = 'crm_db' AND TABLE_NAME = 'customers' AND COLUMN_NAME = 'accepted_at'
);

SET @sql_sla = IF(@sla_col = 0, 
    'ALTER TABLE customers 
        ADD COLUMN accepted_at DATETIME NULL COMMENT ''Thời điểm sales bấm nhận lead'',
        ADD COLUMN rejected_at DATETIME NULL COMMENT ''Thời điểm sales từ chối lead'',
        ADD COLUMN rejected_by_user_id BIGINT NULL COMMENT ''ID nhân viên từ chối lead'',
        ADD COLUMN rejection_reason VARCHAR(500) NULL COMMENT ''Lý do từ chối lead bắt buộc'',
        ADD COLUMN sla_deadline DATETIME NULL COMMENT ''Hạn chót phản hồi theo SLA'',
        ADD COLUMN sla_breached TINYINT(1) NOT NULL DEFAULT 0 COMMENT ''Cờ vi phạm SLA: 1=quá hạn'',
        ADD COLUMN sla_breached_at DATETIME NULL COMMENT ''Thời điểm phát hiện vi phạm SLA'',
        ADD COLUMN first_contacted_at DATETIME NULL COMMENT ''Thời điểm có tương tác đầu tiên'',
        ADD COLUMN converted_at DATETIME NULL COMMENT ''Thời điểm chuyển đổi lead'',
        ADD COLUMN converted_by_user_id BIGINT NULL COMMENT ''ID người thực hiện chuyển đổi'',
        ADD COLUMN converted_customer_id BIGINT NULL COMMENT ''ID khách hàng doanh nghiệp sau chuyển đổi'',
        ADD COLUMN converted_contact_id BIGINT NULL COMMENT ''ID người liên hệ sau chuyển đổi'',
        ADD COLUMN converted_opportunity_id BIGINT NULL COMMENT ''ID cơ hội bán hàng sau chuyển đổi''',
    'SELECT 1'
);

PREPARE stmt_sla FROM @sql_sla;
EXECUTE stmt_sla;
DEALLOCATE PREPARE stmt_sla;

-- 2. Bảng cấu hình SLA và thông số phân bổ lead
CREATE TABLE IF NOT EXISTS lead_routing_settings (
    setting_key VARCHAR(50) NOT NULL PRIMARY KEY,
    setting_value VARCHAR(255) NOT NULL,
    description VARCHAR(255) NULL,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO lead_routing_settings (setting_key, setting_value, description)
VALUES 
    ('sla_response_hours', '4', 'Thời hạn SLA phản hồi tối đa của nhân viên (giờ)'),
    ('sla_auto_reassign_hours', '24', 'Thời gian tự động thu hồi lead về hàng chờ nếu không phản hồi (giờ)')
ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value);

-- 3. Bảng cảnh báo vi phạm SLA cho Trưởng nhóm / Quản lý
CREATE TABLE IF NOT EXISTS lead_sla_alerts (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    lead_id BIGINT NOT NULL,
    assigned_user_id BIGINT NOT NULL,
    manager_user_id BIGINT NULL,
    alert_type VARCHAR(50) NOT NULL DEFAULT 'SLA_BREACH',
    message VARCHAR(500) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'UNREAD',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    resolved_at DATETIME NULL,
    CONSTRAINT fk_sla_lead FOREIGN KEY (lead_id) REFERENCES customers(id) ON DELETE CASCADE,
    CONSTRAINT fk_sla_assigned_user FOREIGN KEY (assigned_user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Bổ sung quyền thao tác nếu chưa có
INSERT INTO permissions (code, name)
VALUES 
    ('lead.convert', 'Chuyển đổi Lead thành Khách hàng & Cơ hội'),
    ('lead.sla.manage', 'Quản lý cảnh báo SLA và Thu hồi Lead')
ON DUPLICATE KEY UPDATE name = VALUES(name);

-- Gán quyền cho các role
INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.code IN ('ADMIN', 'DIRECTOR', 'MANAGER', 'SALES') AND p.code = 'lead.convert';

INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.code IN ('ADMIN', 'DIRECTOR', 'MANAGER') AND p.code = 'lead.sla.manage';
