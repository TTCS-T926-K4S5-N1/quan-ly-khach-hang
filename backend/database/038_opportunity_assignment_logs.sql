-- ==============================================================================
-- 038_opportunity_assignment_logs.sql
-- Nhật ký phân bổ & bàn giao cơ hội bán hàng (Opportunity Ownership Reassignment)
-- Dành cho Trưởng nhóm kinh doanh, Giám đốc và Quản trị viên
-- ==============================================================================

USE crm_db;
SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS opportunity_assignment_logs (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    opportunity_id BIGINT NOT NULL,
    from_user_id BIGINT NULL,
    to_user_id BIGINT NOT NULL,
    assigned_by_user_id BIGINT NOT NULL,
    reason VARCHAR(500) NOT NULL,
    notes TEXT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_opp_assign_opp (opportunity_id),
    INDEX idx_opp_assign_from (from_user_id),
    INDEX idx_opp_assign_to (to_user_id),
    INDEX idx_opp_assign_by (assigned_by_user_id),
    CONSTRAINT fk_opp_assign_opp FOREIGN KEY (opportunity_id) REFERENCES opportunities(id) ON DELETE CASCADE,
    CONSTRAINT fk_opp_assign_from FOREIGN KEY (from_user_id) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT fk_opp_assign_to FOREIGN KEY (to_user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_opp_assign_by FOREIGN KEY (assigned_by_user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
