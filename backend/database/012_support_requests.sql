-- S5-59. Select the target database before running this migration (MySQL 8+).
CREATE TABLE IF NOT EXISTS support_requests (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    customer_id BIGINT NOT NULL,
    subject VARCHAR(255) NOT NULL,
    description TEXT NULL,
    priority VARCHAR(10) NOT NULL DEFAULT 'NORMAL',
    status VARCHAR(20) NOT NULL DEFAULT 'OPEN',
    due_at DATETIME(6) NULL COMMENT 'UTC',
    resolution TEXT NULL,
    created_by BIGINT NOT NULL,
    updated_by BIGINT NOT NULL,
    created_at DATETIME(6) NOT NULL,
    updated_at DATETIME(6) NOT NULL,
    resolved_at DATETIME(6) NULL,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    CONSTRAINT fk_support_customer FOREIGN KEY (customer_id) REFERENCES customers(id),
    CONSTRAINT fk_support_creator FOREIGN KEY (created_by) REFERENCES users(id),
    CONSTRAINT fk_support_updater FOREIGN KEY (updated_by) REFERENCES users(id),
    CONSTRAINT chk_support_priority CHECK (priority IN ('LOW','NORMAL','HIGH','URGENT')),
    CONSTRAINT chk_support_status CHECK (status IN ('OPEN','IN_PROGRESS','RESOLVED','CLOSED')),
    INDEX idx_support_customer_state (customer_id, is_deleted, status, due_at)
);

-- Derived flags cannot become stale when a deadline passes without a write.
-- Completed and soft-deleted requests never contribute to churn risk.
CREATE OR REPLACE VIEW customer_support_risk AS
SELECT c.id AS customer_id,
       COUNT(s.id) AS open_count,
       COALESCE(SUM(s.priority = 'URGENT'), 0) AS urgent_count,
       COALESCE(SUM(s.due_at < UTC_TIMESTAMP(6)), 0) AS overdue_count,
       (COUNT(s.id) >= 3 OR COALESCE(SUM(s.priority = 'URGENT'), 0) > 0
        OR COALESCE(SUM(s.due_at < UTC_TIMESTAMP(6)), 0) > 0) AS at_risk
FROM customers c
LEFT JOIN support_requests s ON s.customer_id = c.id AND s.is_deleted = FALSE
    AND s.status IN ('OPEN', 'IN_PROGRESS')
WHERE c.is_deleted = FALSE
GROUP BY c.id;

INSERT IGNORE INTO permissions(code, name) VALUES
('support.read', 'Xem yêu cầu hỗ trợ và rủi ro rời bỏ'),
('support.create', 'Tạo yêu cầu hỗ trợ'),
('support.update', 'Cập nhật yêu cầu hỗ trợ'),
('support.delete', 'Xóa yêu cầu hỗ trợ');

INSERT IGNORE INTO role_permissions(role_id, permission_id)
SELECT r.id, p.id FROM roles r CROSS JOIN permissions p
WHERE (r.code IN ('ADMIN','CUSTOMER_SUCCESS') AND p.code IN
    ('support.read','support.create','support.update','support.delete'))
   OR (r.code IN ('DIRECTOR','TEAM_LEAD','SALES_REP') AND p.code = 'support.read');

-- Keep the existing customer ownership boundary; do not widen any role.
INSERT IGNORE INTO role_module_scopes(role_id, module_code, scope_type)
SELECT rms.role_id, 'support', rms.scope_type FROM role_module_scopes rms
JOIN roles r ON r.id = rms.role_id
WHERE rms.module_code = 'customer'
  AND r.code IN ('ADMIN','DIRECTOR','TEAM_LEAD','SALES_REP','CUSTOMER_SUCCESS');
