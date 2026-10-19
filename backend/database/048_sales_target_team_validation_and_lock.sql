-- Migration 048: Sales Targets Team Validation and Lock Reason
-- Story 2: Chỉ tiêu của nhóm bằng tổng thành viên (cảnh báo lệch) & Khóa kỳ đã qua (sửa phải có lý do)

SET NAMES utf8mb4;

-- Thêm cột change_reason vào sales_targets nếu chưa có
SET @col_change_reason = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'sales_targets' AND COLUMN_NAME = 'change_reason');
SET @sql_cr = IF(@col_change_reason = 0, 'ALTER TABLE sales_targets ADD COLUMN change_reason VARCHAR(500) NULL AFTER notes', 'SELECT 1');
PREPARE stmt_cr FROM @sql_cr;
EXECUTE stmt_cr;
DEALLOCATE PREPARE stmt_cr;
