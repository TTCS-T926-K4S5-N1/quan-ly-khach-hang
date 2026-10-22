-- 017_customer_360_complete.sql
-- Hoàn thiện dữ liệu và cấu trúc cho trang Khách hàng 360
USE crm_db;

SET NAMES utf8mb4;

-- 1. Bảng attachments (Tệp đính kèm của khách hàng)
CREATE TABLE IF NOT EXISTS attachments (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    customer_id BIGINT NOT NULL,
    name VARCHAR(255) NOT NULL,
    file_type VARCHAR(50) NOT NULL DEFAULT 'PDF',
    file_size BIGINT NOT NULL DEFAULT 0,
    file_url VARCHAR(500) NULL,
    uploaded_by_user_id BIGINT NULL DEFAULT 1,
    notes VARCHAR(255) NULL,
    is_deleted TINYINT(1) NOT NULL DEFAULT 0,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_attachments_customer
        FOREIGN KEY (customer_id)
        REFERENCES customers(id)
        ON DELETE CASCADE
);

-- 2. Đánh Index để tối ưu truy vấn dưới 1.5 giây kể cả với 500+ hoạt động
DELIMITER $$
DROP PROCEDURE IF EXISTS CreateIndexIfNotExists$$
CREATE PROCEDURE CreateIndexIfNotExists(
    IN p_table_name VARCHAR(64),
    IN p_index_name VARCHAR(64),
    IN p_columns VARCHAR(255)
)
BEGIN
    DECLARE idx_count INT DEFAULT 0;
    SELECT COUNT(*) INTO idx_count
    FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = p_table_name
      AND INDEX_NAME = p_index_name;

    IF idx_count = 0 THEN
        SET @sql = CONCAT('CREATE INDEX `', p_index_name, '` ON `', p_table_name, '` (', p_columns, ')');
        PREPARE stmt FROM @sql;
        EXECUTE stmt;
        DEALLOCATE PREPARE stmt;
    END IF;
END$$
DELIMITER ;

CALL CreateIndexIfNotExists('activities', 'idx_activities_customer_date', 'customer_id, created_at DESC');
CALL CreateIndexIfNotExists('opportunities', 'idx_opportunities_customer_status', 'customer_id, status');
CALL CreateIndexIfNotExists('attachments', 'idx_attachments_customer_date', 'customer_id, created_at DESC');

DROP PROCEDURE IF EXISTS CreateIndexIfNotExists;

-- 3. Seed Cơ hội (Opportunities) cho Khách hàng 12 (Tập đoàn Điện tử Đại Phát)
-- Cơ hội đang mở (OPEN)
INSERT INTO opportunities (customer_id, name, contact_name, amount, stage_id, probability, expected_close_date, status, owner_user_id)
SELECT 12, 'Cung cấp Phần mềm CRM Enterprise & Tích hợp Tổng đài CTI', 'Nguyễn Văn Phát', 145000000.00, 4, 80, DATE_ADD(CURRENT_DATE(), INTERVAL 15 DAY), 'OPEN', 1
WHERE NOT EXISTS (SELECT 1 FROM opportunities WHERE customer_id = 12 AND name = 'Cung cấp Phần mềm CRM Enterprise & Tích hợp Tổng đài CTI');

INSERT INTO opportunities (customer_id, name, contact_name, amount, stage_id, probability, expected_close_date, status, owner_user_id)
SELECT 12, 'Gói Đào tạo Chuyển giao & Tùy biến Quy trình Bán sỉ B2B', 'Lê Hoàng Long', 35000000.00, 3, 60, DATE_ADD(CURRENT_DATE(), INTERVAL 30 DAY), 'OPEN', 1
WHERE NOT EXISTS (SELECT 1 FROM opportunities WHERE customer_id = 12 AND name = 'Gói Đào tạo Chuyển giao & Tùy biến Quy trình Bán sỉ B2B');

-- Cơ hội đã đóng (CLOSED - WON và LOST)
INSERT INTO opportunities (customer_id, name, contact_name, amount, stage_id, probability, expected_close_date, status, owner_user_id)
SELECT 12, 'Hợp đồng Khảo sát & Triển khai Thử nghiệm CRM (Pilot)', 'Nguyễn Văn Phát', 25000000.00, 5, 100, DATE_SUB(CURRENT_DATE(), INTERVAL 45 DAY), 'WON', 1
WHERE NOT EXISTS (SELECT 1 FROM opportunities WHERE customer_id = 12 AND name = 'Hợp đồng Khảo sát & Triển khai Thử nghiệm CRM (Pilot)');

INSERT INTO opportunities (customer_id, name, contact_name, amount, stage_id, probability, expected_close_date, status, owner_user_id)
SELECT 12, 'Module SMS Brandname & Zalo OA Thông báo đơn hàng đợt 1', 'Trần Thị Thu Hương', 12000000.00, 5, 100, DATE_SUB(CURRENT_DATE(), INTERVAL 20 DAY), 'WON', 1
WHERE NOT EXISTS (SELECT 1 FROM opportunities WHERE customer_id = 12 AND name = 'Module SMS Brandname & Zalo OA Thông báo đơn hàng đợt 1');

INSERT INTO opportunities (customer_id, name, contact_name, amount, stage_id, probability, expected_close_date, status, lost_reason, owner_user_id)
SELECT 12, 'Gói Máy chủ On-Premise chuyên dụng đặt tại Datacenter', 'Phạm Quốc Cường', 80000000.00, 6, 0, DATE_SUB(CURRENT_DATE(), INTERVAL 60 DAY), 'LOST', 'Khách hàng quyết định dùng nền tảng Cloud SaaS thay vì đầu tư phần cứng vật lý tốn kém', 1
WHERE NOT EXISTS (SELECT 1 FROM opportunities WHERE customer_id = 12 AND name = 'Gói Máy chủ On-Premise chuyên dụng đặt tại Datacenter');

-- 4. Seed Tệp đính kèm (Attachments) cho Khách hàng 12
INSERT INTO attachments (customer_id, name, file_type, file_size, file_url, notes, uploaded_by_user_id, created_at)
SELECT 12, 'Hop_dong_trien_khai_pilot_so_01.pdf', 'PDF', 2541000, '#', 'Hợp đồng thử nghiệm đã ký kết 2 bên', 1, DATE_SUB(NOW(), INTERVAL 40 DAY)
WHERE NOT EXISTS (SELECT 1 FROM attachments WHERE customer_id = 12 AND name = 'Hop_dong_trien_khai_pilot_so_01.pdf');

INSERT INTO attachments (customer_id, name, file_type, file_size, file_url, notes, uploaded_by_user_id, created_at)
SELECT 12, 'Bang_chao_gia_CRM_Enterprise_DaiPhat_v2.xlsx', 'XLSX', 485000, '#', 'Bảng bóc tách chi phí bản quyền và dịch vụ tùy biến', 1, DATE_SUB(NOW(), INTERVAL 5 DAY)
WHERE NOT EXISTS (SELECT 1 FROM attachments WHERE customer_id = 12 AND name = 'Bang_chao_gia_CRM_Enterprise_DaiPhat_v2.xlsx');

INSERT INTO attachments (customer_id, name, file_type, file_size, file_url, notes, uploaded_by_user_id, created_at)
SELECT 12, 'Kien_truc_tich_hop_Tong_dai_CTI_va_ERP.png', 'PNG', 1250000, '#', 'Sơ đồ luồng dữ liệu kết nối tổng đài ảo', 1, DATE_SUB(NOW(), INTERVAL 12 DAY)
WHERE NOT EXISTS (SELECT 1 FROM attachments WHERE customer_id = 12 AND name = 'Kien_truc_tich_hop_Tong_dai_CTI_va_ERP.png');

INSERT INTO attachments (customer_id, name, file_type, file_size, file_url, notes, uploaded_by_user_id, created_at)
SELECT 12, 'Bien_ban_khao_sat_quy_trinh_ban_si.docx', 'DOCX', 760000, '#', 'Ghi nhận 12 luồng nghiệp vụ phê duyệt đơn hàng', 1, DATE_SUB(NOW(), INTERVAL 18 DAY)
WHERE NOT EXISTS (SELECT 1 FROM attachments WHERE customer_id = 12 AND name = 'Bien_ban_khao_sat_quy_trinh_ban_si.docx');

-- 5. Seed hoạt động mẫu thực tế cho Khách hàng 12
INSERT INTO activities (customer_id, type, subject, description, status, owner_user_id, created_at)
SELECT 12, 'CALL', 'Trao đổi với Tổng Giám Đốc Nguyễn Văn Phát', 'Thảo luận về tiến độ triển khai chính thức gói Enterprise và chính sách bảo hành 24/7.', 'COMPLETED', 1, DATE_SUB(NOW(), INTERVAL 2 HOUR)
WHERE NOT EXISTS (SELECT 1 FROM activities WHERE customer_id = 12 AND subject = 'Trao đổi với Tổng Giám Đốc Nguyễn Văn Phát');

INSERT INTO activities (customer_id, type, subject, description, status, owner_user_id, created_at)
SELECT 12, 'MEETING', 'Họp demo trực tiếp tính năng quản lý đơn hàng B2B', 'Demo thực tế tính năng chiết khấu nhiều cấp độ với Trưởng phòng Kinh doanh Lê Hoàng Long và đội ngũ sales.', 'COMPLETED', 1, DATE_SUB(NOW(), INTERVAL 1 DAY)
WHERE NOT EXISTS (SELECT 1 FROM activities WHERE customer_id = 12 AND subject = 'Họp demo trực tiếp tính năng quản lý đơn hàng B2B');

INSERT INTO activities (customer_id, type, subject, description, status, owner_user_id, created_at)
SELECT 12, 'EMAIL', 'Gửi tài liệu kiến trúc API & bảo mật', 'Gửi tài liệu mã hóa dữ liệu khách hàng và tài liệu kết nối API tổng đài cho Giám đốc CNTT Trần Thị Thu Hương.', 'COMPLETED', 1, DATE_SUB(NOW(), INTERVAL 3 DAY)
WHERE NOT EXISTS (SELECT 1 FROM activities WHERE customer_id = 12 AND subject = 'Gửi tài liệu kiến trúc API & bảo mật');

INSERT INTO activities (customer_id, type, subject, description, status, owner_user_id, created_at)
SELECT 12, 'NOTE', 'Ghi chú tài chính từ Kế toán trưởng', 'Kế toán trưởng Phạm Quốc Cường đề xuất chia thanh toán làm 3 đợt (40% - 40% - 20%). Đã chuyển thông tin cho ban giám đốc duyệt.', 'COMPLETED', 1, DATE_SUB(NOW(), INTERVAL 4 DAY)
WHERE NOT EXISTS (SELECT 1 FROM activities WHERE customer_id = 12 AND subject = 'Ghi chú tài chính từ Kế toán trưởng');
