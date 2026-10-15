-- 034_stagnation_forecast_and_close_reopen.sql
-- Triển khai 3 User Stories:
-- 1. Đóng cơ hội Thắng/Thua (bắt buộc giá trị chốt, ngày ký, lý do), chặn sửa khi đã đóng, Trưởng nhóm mở lại kèm lý do, tính vào chỉ tiêu.
-- 2. Cảnh báo cơ hội đình trệ (không có hoạt động trong N ngày cấu hình theo giai đoạn, quá hạn chốt), danh sách riêng cho trưởng nhóm, tác vụ đánh giá mỗi ngày.
-- 3. Dự báo doanh số theo trọng số xác suất (Tổng giá trị x xác suất), nhóm theo tháng này/tháng sau/quý này, so sánh dự báo vs chỉ tiêu vs số đã chốt thực tế, xem theo nhân viên & nhóm.

USE crm_db;
SET NAMES utf8mb4;
SET CHARACTER SET utf8mb4;

-- ========================================================
-- 1. PROCEDURE THÊM CỘT AN TOÀN
-- ========================================================
DROP PROCEDURE IF EXISTS AddCol034;
DELIMITER $$
CREATE PROCEDURE AddCol034(
    IN tbl VARCHAR(100),
    IN col VARCHAR(100),
    IN colType VARCHAR(255)
)
BEGIN
    SET @db = DATABASE();
    SET @cnt = (
        SELECT COUNT(*)
        FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = @db
          AND TABLE_NAME = tbl
          AND COLUMN_NAME = col
    );
    IF @cnt = 0 THEN
        SET @sql = CONCAT('ALTER TABLE ', tbl, ' ADD COLUMN ', col, ' ', colType);
        PREPARE s FROM @sql;
        EXECUTE s;
        DEALLOCATE PREPARE s;
    END IF;
END$$
DELIMITER ;

-- ========================================================
-- 2. BỔ SUNG CỘT BẢNG OPPORTUNITIES
-- ========================================================
CALL AddCol034('opportunities', 'actual_close_date', 'DATE NULL AFTER expected_close_date');
CALL AddCol034('opportunities', 'is_stagnant', 'TINYINT(1) NOT NULL DEFAULT 0 AFTER status');
CALL AddCol034('opportunities', 'stagnant_flag', 'VARCHAR(50) NULL DEFAULT "NONE" AFTER is_stagnant');
CALL AddCol034('opportunities', 'stagnant_reason', 'VARCHAR(255) NULL AFTER stagnant_flag');
CALL AddCol034('opportunities', 'last_stagnant_checked_at', 'DATETIME NULL AFTER stagnant_reason');
CALL AddCol034('opportunities', 'reopened_reason', 'VARCHAR(500) NULL AFTER last_override_reason');
CALL AddCol034('opportunities', 'reopened_by', 'BIGINT NULL AFTER reopened_reason');
CALL AddCol034('opportunities', 'reopened_at', 'DATETIME NULL AFTER reopened_by');

-- Khởi tạo actual_close_date cho các cơ hội WON hiện có nếu chưa có
UPDATE opportunities 
SET actual_close_date = COALESCE(DATE(updated_at), expected_close_date, CURDATE())
WHERE status = 'WON' AND actual_close_date IS NULL;

-- ========================================================
-- 3. BỔ SUNG CỘT BẢNG PIPELINE_STAGES (N ngày đình trệ)
-- ========================================================
CALL AddCol034('pipeline_stages', 'stagnant_days', 'INT NOT NULL DEFAULT 7 AFTER condition_required');

-- Cấu hình N ngày theo từng giai đoạn
UPDATE pipeline_stages SET stagnant_days = 5 WHERE id = 1;  -- Mới tiếp cận: 5 ngày
UPDATE pipeline_stages SET stagnant_days = 7 WHERE id = 2;  -- Đủ điều kiện: 7 ngày
UPDATE pipeline_stages SET stagnant_days = 10 WHERE id = 3; -- Gửi báo giá: 10 ngày
UPDATE pipeline_stages SET stagnant_days = 14 WHERE id = 4; -- Thương lượng: 14 ngày
UPDATE pipeline_stages SET stagnant_days = 999 WHERE id IN (5, 6); -- Won / Lost: không áp dụng

-- ========================================================
-- 4. BẢNG CHỈ TIÊU DOANH SỐ (sales_targets)
-- ========================================================
CREATE TABLE IF NOT EXISTS sales_targets (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NULL,
    team_id BIGINT NULL,
    period_year INT NOT NULL,
    period_month INT NULL,           -- 1..12
    period_quarter INT NULL,         -- 1..4
    target_amount DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    notes VARCHAR(255) NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_target_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_target_team FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_sales_targets_period ON sales_targets(period_year, period_month, period_quarter);
CREATE INDEX idx_sales_targets_user ON sales_targets(user_id);
CREATE INDEX idx_sales_targets_team ON sales_targets(team_id);

-- Seed chỉ tiêu mẫu năm 2026 cho Nhân viên và Nhóm
DELETE FROM sales_targets WHERE period_year = 2026;

-- Chỉ tiêu Tháng 10/2026 (Tháng này) theo nhân viên
INSERT INTO sales_targets (user_id, team_id, period_year, period_month, period_quarter, target_amount, notes) VALUES
(4, 3, 2026, 10, 4, 250000000.00, 'Chỉ tiêu Tháng 10 - Lê Hoàng Nam'),
(5, 4, 2026, 10, 4, 200000000.00, 'Chỉ tiêu Tháng 10 - Phạm Mai Phương'),
(7, 6, 2026, 10, 4, 180000000.00, 'Chỉ tiêu Tháng 10 - Đỗ Thị Tuyết'),
(9, 8, 2026, 10, 4, 220000000.00, 'Chỉ tiêu Tháng 10 - Hoàng Kim Yến'),
(10, 9, 2026, 10, 4, 150000000.00, 'Chỉ tiêu Tháng 10 - Trương Tuấn Anh'),
(1, NULL, 2026, 10, 4, 300000000.00, 'Chỉ tiêu Tháng 10 - Quản trị viên');

-- Chỉ tiêu Tháng 11/2026 (Tháng sau) theo nhân viên
INSERT INTO sales_targets (user_id, team_id, period_year, period_month, period_quarter, target_amount, notes) VALUES
(4, 3, 2026, 11, 4, 300000000.00, 'Chỉ tiêu Tháng 11 - Lê Hoàng Nam'),
(5, 4, 2026, 11, 4, 220000000.00, 'Chỉ tiêu Tháng 11 - Phạm Mai Phương'),
(7, 6, 2026, 11, 4, 200000000.00, 'Chỉ tiêu Tháng 11 - Đỗ Thị Tuyết'),
(9, 8, 2026, 11, 4, 250000000.00, 'Chỉ tiêu Tháng 11 - Hoàng Kim Yến'),
(10, 9, 2026, 11, 4, 180000000.00, 'Chỉ tiêu Tháng 11 - Trương Tuấn Anh'),
(1, NULL, 2026, 11, 4, 350000000.00, 'Chỉ tiêu Tháng 11 - Quản trị viên');

-- Chỉ tiêu Quý 4/2026 theo nhân viên
INSERT INTO sales_targets (user_id, team_id, period_year, period_month, period_quarter, target_amount, notes) VALUES
(4, 3, 2026, NULL, 4, 800000000.00, 'Chỉ tiêu Quý 4 - Lê Hoàng Nam'),
(5, 4, 2026, NULL, 4, 650000000.00, 'Chỉ tiêu Quý 4 - Phạm Mai Phương'),
(7, 6, 2026, NULL, 4, 600000000.00, 'Chỉ tiêu Quý 4 - Đỗ Thị Tuyết'),
(9, 8, 2026, NULL, 4, 700000000.00, 'Chỉ tiêu Quý 4 - Hoàng Kim Yến'),
(10, 9, 2026, NULL, 4, 500000000.00, 'Chỉ tiêu Quý 4 - Trương Tuấn Anh'),
(1, NULL, 2026, NULL, 4, 900000000.00, 'Chỉ tiêu Quý 4 - Quản trị viên');

-- Chỉ tiêu Tháng 10/2026 theo Nhóm (Teams)
INSERT INTO sales_targets (user_id, team_id, period_year, period_month, period_quarter, target_amount, notes) VALUES
(NULL, 3, 2026, 10, 4, 500000000.00, 'Chỉ tiêu Tháng 10 - Nhóm KD B2B Hà Nội'),
(NULL, 4, 2026, 10, 4, 400000000.00, 'Chỉ tiêu Tháng 10 - Nhóm KD B2C & Đại lý Miền Bắc'),
(NULL, 6, 2026, 10, 4, 350000000.00, 'Chỉ tiêu Tháng 10 - Nhóm KD Đà Nẵng & Duyên Hải'),
(NULL, 8, 2026, 10, 4, 450000000.00, 'Chỉ tiêu Tháng 10 - Nhóm KD Doanh nghiệp TP.HCM'),
(NULL, 9, 2026, 10, 4, 300000000.00, 'Chỉ tiêu Tháng 10 - Nhóm KD SME & Bán lẻ Phía Nam');

-- Chỉ tiêu Tháng 11/2026 theo Nhóm (Teams)
INSERT INTO sales_targets (user_id, team_id, period_year, period_month, period_quarter, target_amount, notes) VALUES
(NULL, 3, 2026, 11, 4, 600000000.00, 'Chỉ tiêu Tháng 11 - Nhóm KD B2B Hà Nội'),
(NULL, 4, 2026, 11, 4, 450000000.00, 'Chỉ tiêu Tháng 11 - Nhóm KD B2C & Đại lý Miền Bắc'),
(NULL, 6, 2026, 11, 4, 400000000.00, 'Chỉ tiêu Tháng 11 - Nhóm KD Đà Nẵng & Duyên Hải'),
(NULL, 8, 2026, 11, 4, 500000000.00, 'Chỉ tiêu Tháng 11 - Nhóm KD Doanh nghiệp TP.HCM'),
(NULL, 9, 2026, 11, 4, 350000000.00, 'Chỉ tiêu Tháng 11 - Nhóm KD SME & Bán lẻ Phía Nam');

-- Chỉ tiêu Quý 4/2026 theo Nhóm (Teams)
INSERT INTO sales_targets (user_id, team_id, period_year, period_month, period_quarter, target_amount, notes) VALUES
(NULL, 3, 2026, NULL, 4, 1600000000.00, 'Chỉ tiêu Quý 4 - Nhóm KD B2B Hà Nội'),
(NULL, 4, 2026, NULL, 4, 1300000000.00, 'Chỉ tiêu Quý 4 - Nhóm KD B2C & Đại lý Miền Bắc'),
(NULL, 6, 2026, NULL, 4, 1100000000.00, 'Chỉ tiêu Quý 4 - Nhóm KD Đà Nẵng & Duyên Hải'),
(NULL, 8, 2026, NULL, 4, 1400000000.00, 'Chỉ tiêu Quý 4 - Nhóm KD Doanh nghiệp TP.HCM'),
(NULL, 9, 2026, NULL, 4, 950000000.00, 'Chỉ tiêu Quý 4 - Nhóm KD SME & Bán lẻ Phía Nam');

DROP PROCEDURE IF EXISTS AddCol034;
