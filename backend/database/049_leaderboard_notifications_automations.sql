-- Migration 049: Team Leaderboard Config, In-App Notifications, and When-Then Automation Rules
-- Story 1: Bảng xếp hạng doanh số trong nhóm cho Nhân viên kinh doanh
-- Story 2: Hệ thống Thông báo trong ứng dụng cho các sự kiện quan trọng (bất đồng bộ)
-- Story 3: Khai báo quy tắc tự động hoá theo mẫu Khi-Thì (When-Then Automations)

SET NAMES utf8mb4;

-- 1. Bảng cấu hình hệ thống (system_settings)
CREATE TABLE IF NOT EXISTS system_settings (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    setting_key VARCHAR(100) NOT NULL UNIQUE,
    setting_value VARCHAR(255) NOT NULL,
    description VARCHAR(255),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Cấu hình mặc định bật bảng xếp hạng cho nhân viên
INSERT INTO system_settings (setting_key, setting_value, description)
VALUES ('team_leaderboard_staff_enabled', 'true', 'Cho phép nhân viên kinh doanh xem bảng xếp hạng doanh số trong nhóm')
ON DUPLICATE KEY UPDATE description = VALUES(description);

-- 2. Bảng thông báo trong ứng dụng (notifications)
CREATE TABLE IF NOT EXISTS notifications (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    type VARCHAR(50) NOT NULL, -- LEAD_ASSIGNED, QUOTE_APPROVAL_REQUEST, QUOTE_RESPONSE, TASK_ASSIGNED, OPPORTUNITY_STAGNANT, AUTOMATION_ACTION, SYSTEM
    title VARCHAR(255) NOT NULL,
    content TEXT,
    link VARCHAR(255) NOT NULL,
    entity_type VARCHAR(50),
    entity_id BIGINT,
    is_read TINYINT(1) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_notif_user_read (user_id, is_read, created_at),
    CONSTRAINT fk_notif_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Bảng quy tắc tự động hoá (automation_rules)
CREATE TABLE IF NOT EXISTS automation_rules (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    trigger_event VARCHAR(50) NOT NULL, -- STAGE_CHANGED, STATUS_CHANGED, TIME_ELAPSED, STAGNANT_FLAGGED
    trigger_entity VARCHAR(50) NOT NULL, -- OPPORTUNITY, LEAD, QUOTE
    condition_field VARCHAR(100), -- stage_id, status, days_in_stage
    condition_operator VARCHAR(20) DEFAULT 'EQUALS', -- EQUALS, GREATER_THAN
    condition_value VARCHAR(255), -- '3' or 'PROPOSAL'
    action_type VARCHAR(50) NOT NULL, -- CREATE_TASK, SEND_NOTIFICATION, CHANGE_OWNER
    action_params TEXT, -- JSON parameters
    active TINYINT(1) DEFAULT 1,
    created_by BIGINT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Bảng nhật ký thực thi quy tắc tự động hoá (automation_logs)
CREATE TABLE IF NOT EXISTS automation_logs (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    rule_id BIGINT NOT NULL,
    rule_name VARCHAR(255) NOT NULL,
    trigger_event VARCHAR(50) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id BIGINT NOT NULL,
    entity_name VARCHAR(255),
    action_type VARCHAR(50) NOT NULL,
    action_summary TEXT,
    status VARCHAR(20) DEFAULT 'SUCCESS', -- SUCCESS, FAILED
    error_message TEXT,
    executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_auto_logs_rule (rule_id),
    INDEX idx_auto_logs_date (executed_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Seed dữ liệu mẫu cho Quy tắc tự động hoá chuẩn
INSERT INTO automation_rules (id, name, description, trigger_event, trigger_entity, condition_field, condition_operator, condition_value, action_type, action_params, active, created_by)
VALUES
(1, 'Nhắc gọi lại sau 3 ngày gửi báo giá', 'Khi cơ hội chuyển sang giai đoạn Báo giá thì tự động tạo công việc nhắc nhân viên gọi lại sau 3 ngày', 'STAGE_CHANGED', 'OPPORTUNITY', 'stage_id', 'EQUALS', '3', 'CREATE_TASK', '{"subject":"Gọi lại kiểm tra phản hồi sau báo giá","type":"CALL","dueDays":3,"description":"Tự động tạo bởi quy tắc Khi-Thì khi cơ hội vào giai đoạn Báo giá"}', 1, 1),
(2, 'Thông báo khi cơ hội bước vào Thương lượng', 'Khi cơ hội chuyển sang giai đoạn Thương lượng thì gửi thông báo chúc mừng và nhắc nhở điều khoản', 'STAGE_CHANGED', 'OPPORTUNITY', 'stage_id', 'EQUALS', '4', 'SEND_NOTIFICATION', '{"title":"Cơ hội bước vào giai đoạn Thương lượng","content":"Cơ hội đã đạt 80% xác suất thắng, hãy chuẩn bị kỹ các điều khoản chốt hợp đồng"}', 1, 1),
(3, 'Tự động tạo lịch chăm sóc khi cơ hội bị đình trệ', 'Khi cơ hội bị gắn cờ đình trệ thì tự động tạo công việc rà soát và kích hoạt lại deal', 'STAGNANT_FLAGGED', 'OPPORTUNITY', 'is_stagnant', 'EQUALS', '1', 'CREATE_TASK', '{"subject":"Cơ hội bị đình trệ: Lên phương án tái tiếp cận","type":"MEETING","dueDays":2,"description":"Tự động kích hoạt khi phát hiện cơ hội không có tương tác quá thời gian quy định"}', 1, 1)
ON DUPLICATE KEY UPDATE name = VALUES(name), description = VALUES(description), action_params = VALUES(action_params);

-- 6. Seed một số thông báo mẫu quan trọng cho các tài khoản kiểm thử
-- Giám đốc kinh doanh (ID 2), Trưởng nhóm (ID 3), Nhân viên (ID 4 - Lê Hoàng Nam)
INSERT INTO notifications (user_id, type, title, content, link, entity_type, entity_id, is_read, created_at)
VALUES
(2, 'QUOTE_APPROVAL_REQUEST', 'Báo giá BG-2026-003 chờ phê duyệt', 'Báo giá cho Tập đoàn Vingroup có chiết khấu 15% vượt thẩm quyền cần bạn duyệt', 'quotations', 'QUOTE', 1, 0, NOW() - INTERVAL 15 MINUTE),
(2, 'OPPORTUNITY_STAGNANT', 'Cơ hội Tập đoàn Masan bị gắn cờ đình trệ', 'Cơ hội đã quá 10 ngày chưa có hoạt động cập nhật mới', 'pipeline', 'OPPORTUNITY', 2, 0, NOW() - INTERVAL 2 HOUR),
(3, 'LEAD_ASSIGNED', 'Bạn được phân công Khách hàng tiềm năng mới', 'Lead: Công ty CP Bất động sản Đất Xanh Miền Bắc vừa được chuyển giao', 'customers?lead=1', 'LEAD', 5, 0, NOW() - INTERVAL 30 MINUTE),
(3, 'QUOTE_RESPONSE', 'Khách hàng FPT Telecom đã phản hồi báo giá', 'Khách hàng đồng ý phương án đề xuất và yêu cầu gửi dự thảo hợp đồng', 'quotations', 'QUOTE', 3, 0, NOW() - INTERVAL 1 HOUR),
(4, 'TASK_ASSIGNED', 'Bạn được giao công việc: Họp chuẩn bị hồ sơ thầu', 'Trưởng nhóm vừa phân công công việc mới cho bạn hạn chót ngày mai', 'activities', 'TASK', 10, 0, NOW() - INTERVAL 45 MINUTE),
(4, 'LEAD_ASSIGNED', 'Lead mới từ Web-to-Lead: Nguyễn Văn An', 'Lead có nhu cầu triển khai ERP và CRM cho 50 người dùng', 'customers?lead=1', 'LEAD', 8, 0, NOW() - INTERVAL 3 HOUR);
