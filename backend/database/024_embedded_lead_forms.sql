USE crm_db;
SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS lead_forms (
    id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    source VARCHAR(150) NOT NULL,
    owner_user_id BIGINT NOT NULL,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_lead_forms_owner
        FOREIGN KEY (owner_user_id) REFERENCES users(id),

    INDEX idx_form_owner (owner_user_id, created_at)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS leads (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    full_name VARCHAR(150) NOT NULL,
    email VARCHAR(254) NOT NULL,
    phone VARCHAR(32) NOT NULL,
    company VARCHAR(150) NOT NULL,
    interest TEXT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'NEW',
    source VARCHAR(150) NOT NULL,
    form_id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
    owner_user_id BIGINT NOT NULL,
    submission_hash CHAR(64) CHARACTER SET ascii COLLATE ascii_bin
        NOT NULL UNIQUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_leads_form
        FOREIGN KEY (form_id) REFERENCES lead_forms(id),

    CONSTRAINT fk_leads_owner
        FOREIGN KEY (owner_user_id) REFERENCES users(id),

    CONSTRAINT chk_lead_status
        CHECK (status IN ('NEW', 'CONTACTED', 'QUALIFIED', 'LOST')),

    INDEX idx_lead_owner_created (owner_user_id, created_at),
    INDEX idx_lead_form (form_id)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO roles (code, name)
VALUES ('MARKETING', 'Nhân viên Marketing');

INSERT IGNORE INTO permissions (code, name)
VALUES
    ('marketing.forms.manage', 'Tạo và quản lý biểu mẫu lead'),
    ('marketing.leads.read', 'Xem lead từ biểu mẫu của mình');

INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p
    ON p.code IN (
        'marketing.forms.manage',
        'marketing.leads.read'
    )
WHERE r.code IN ('ADMIN', 'MARKETING');

SHOW TABLES LIKE 'lead%';