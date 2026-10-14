-- =====================================================================================
-- Migration 029: Seed Preset Morning Filters for Sales Reps and Indexes for Lead Source Reporting
-- Stories: SCRUM Story 5 & SCRUM Story 6
-- =====================================================================================

-- 1. Thêm chỉ mục tăng tốc lọc theo nguồn lead và ngày tạo
SET @exist := (SELECT COUNT(*) FROM information_schema.statistics WHERE table_name = 'customers' AND index_name = 'idx_customers_lead_source' AND table_schema = DATABASE());
SET @sqlstmt := IF(@exist > 0, 'SELECT ''Index idx_customers_lead_source exists''', 'CREATE INDEX idx_customers_lead_source ON customers(lead_source)');
PREPARE stmt FROM @sqlstmt; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @exist := (SELECT COUNT(*) FROM information_schema.statistics WHERE table_name = 'customers' AND index_name = 'idx_customers_created_at' AND table_schema = DATABASE());
SET @sqlstmt := IF(@exist > 0, 'SELECT ''Index idx_customers_created_at exists''', 'CREATE INDEX idx_customers_created_at ON customers(created_at)');
PREPARE stmt FROM @sqlstmt; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @exist := (SELECT COUNT(*) FROM information_schema.statistics WHERE table_name = 'customers' AND index_name = 'idx_customers_source_created' AND table_schema = DATABASE());
SET @sqlstmt := IF(@exist > 0, 'SELECT ''Index idx_customers_source_created exists''', 'CREATE INDEX idx_customers_source_created ON customers(lead_source, created_at)');
PREPARE stmt FROM @sqlstmt; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 2. Dọn dẹp các bộ lọc mẫu bị trùng lặp / lỗi encoding trước đó
DELETE FROM saved_filters WHERE is_preset = 1;

-- 3. Tạo sẵn bộ lọc mặc định dành cho Nhân viên kinh doanh mở máy buổi sáng (Story 5)
-- Bộ lọc 1: Lead Nóng cần gọi sáng nay
INSERT INTO saved_filters (user_id, module, name, filter_criteria, is_preset, created_at, updated_at)
VALUES (1, 'CUSTOMER', '🔥 Cần gọi sáng nay (Lead Nóng)', '{"scoreGrade":"HOT","status":"TIEM_NANG","ownerFilter":"MINE"}', 1, NOW(), NOW());

-- Bộ lọc 2: Lead quá hạn SLA phản hồi cần xử lý ngay
INSERT INTO saved_filters (user_id, module, name, filter_criteria, is_preset, created_at, updated_at)
VALUES (1, 'CUSTOMER', '🚨 Quá hạn SLA (Cần xử lý gấp)', '{"slaBreached":true}', 1, NOW(), NOW());

-- Bộ lọc 3: Lead mới phân bổ chờ nhận
INSERT INTO saved_filters (user_id, module, name, filter_criteria, is_preset, created_at, updated_at)
VALUES (1, 'CUSTOMER', '📥 Lead mới phân bổ (Chờ nhận)', '{"assignmentStatus":"ASSIGNED","ownerFilter":"MINE","status":"TIEM_NANG"}', 1, NOW(), NOW());

-- Bộ lọc 4: Lead đang chăm sóc của tôi
INSERT INTO saved_filters (user_id, module, name, filter_criteria, is_preset, created_at, updated_at)
VALUES (1, 'CUSTOMER', '📞 Đang chăm sóc tuần này', '{"status":"DANG_CHAM_SOC","ownerFilter":"MINE"}', 1, NOW(), NOW());

-- Bộ lọc 5: Nguồn Sự kiện & Hội thảo
INSERT INTO saved_filters (user_id, module, name, filter_criteria, is_preset, created_at, updated_at)
VALUES (1, 'CUSTOMER', '🎪 Nguồn Sự kiện & Hội thảo', '{"leadSource":"HOI_THAO"}', 1, NOW(), NOW());

-- Bộ lọc 6: Nguồn Facebook Lead Ads
INSERT INTO saved_filters (user_id, module, name, filter_criteria, is_preset, created_at, updated_at)
VALUES (1, 'CUSTOMER', '📱 Nguồn Facebook Lead Ads', '{"leadSource":"FACEBOOK"}', 1, NOW(), NOW());

-- 4. Phân quyền xem báo cáo nguồn lead cho Marketing & Ban giám đốc
INSERT IGNORE INTO permissions (code, name)
VALUES ('report.lead_source', 'Xem báo cáo hiệu quả nguồn lead & chiến dịch');

-- Gán quyền cho các role: ADMIN, DIRECTOR, MANAGER, MARKETING
INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p ON p.code = 'report.lead_source'
WHERE r.code IN ('ADMIN', 'DIRECTOR', 'MANAGER', 'MARKETING', 'SALES_LEADER', 'SALE_LEAD');
