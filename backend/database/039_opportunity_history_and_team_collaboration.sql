-- ==============================================================================
-- 039_opportunity_history_and_team_collaboration.sql
-- 1. Lịch sử thay đổi cơ hội (Field Change Audit History): Giai đoạn, Giá trị, Ngày chốt, Người sở hữu
-- 2. Chia sẻ cơ hội cho nhiều người cùng theo (Opportunity Team / Collaborators)
-- 3. Bộ lọc cơ hội đã lưu (Saved Filters Preset for Opportunities)
-- ==============================================================================

USE crm_db;
SET NAMES utf8mb4;

-- ------------------------------------------------------------------------------
-- 1. BẢNG LỊCH SỬ THAY ĐỔI CƠ HỘI (opportunity_field_history)
-- Ghi lại mọi thay đổi giai đoạn, giá trị, ngày chốt và người sở hữu
-- Mỗi dòng có giá trị trước, giá trị sau, người thực hiện và thời điểm
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS opportunity_field_history (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    opportunity_id BIGINT NOT NULL,
    field_name VARCHAR(50) NOT NULL, -- 'STAGE', 'AMOUNT', 'EXPECTED_CLOSE_DATE', 'OWNER', 'STATUS'
    field_label VARCHAR(100) NOT NULL, -- 'Giai đoạn', 'Giá trị cơ hội', 'Ngày dự kiến chốt', 'Người sở hữu', 'Trạng thái'
    old_value VARCHAR(500) NULL,
    new_value VARCHAR(500) NULL,
    changed_by_user_id BIGINT NOT NULL,
    reason VARCHAR(500) NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_opp_fh_opp (opportunity_id),
    INDEX idx_opp_fh_user (changed_by_user_id),
    INDEX idx_opp_fh_field (field_name),
    CONSTRAINT fk_opp_fh_opp FOREIGN KEY (opportunity_id) REFERENCES opportunities(id) ON DELETE CASCADE,
    CONSTRAINT fk_opp_fh_user FOREIGN KEY (changed_by_user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 2. BẢNG THÀNH VIÊN CÙNG THAM GIA CƠ HỘI (opportunity_members)
-- Ngoài người sở hữu chính, thêm thành viên cùng tham gia cơ hội
-- Thành viên được chia sẻ có quyền ghi hoạt động nhưng không đổi được người sở hữu
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS opportunity_members (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    opportunity_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    role_in_opportunity VARCHAR(100) NOT NULL DEFAULT 'Thành viên tham gia',
    can_log_activity TINYINT(1) NOT NULL DEFAULT 1,
    can_change_owner TINYINT(1) NOT NULL DEFAULT 0,
    added_by_user_id BIGINT NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_opp_member (opportunity_id, user_id),
    INDEX idx_opp_mem_opp (opportunity_id),
    INDEX idx_opp_mem_user (user_id),
    CONSTRAINT fk_opp_mem_opp FOREIGN KEY (opportunity_id) REFERENCES opportunities(id) ON DELETE CASCADE,
    CONSTRAINT fk_opp_mem_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_opp_mem_by FOREIGN KEY (added_by_user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 3. KHỞI TẠO CÁC BỘ LỌC CƠ HỘI HAY DÙNG (SAVED FILTERS PRESETS CHO OPPORTUNITY)
-- Dành cho Nhân viên kinh doanh & Trưởng nhóm dựng nhanh danh sách thương vụ
-- ------------------------------------------------------------------------------
INSERT INTO saved_filters (user_id, module, name, filter_criteria, is_preset)
SELECT id, 'OPPORTUNITY', '🎯 Thương vụ cần đẩy trong tuần này', '{"stageId":4,"closeDatePreset":"THIS_MONTH"}', 1
FROM users
WHERE status = 'ACTIVE'
  AND NOT EXISTS (
      SELECT 1 FROM saved_filters sf WHERE sf.user_id = users.id AND sf.module = 'OPPORTUNITY' AND sf.name = '🎯 Thương vụ cần đẩy trong tuần này'
  );

INSERT INTO saved_filters (user_id, module, name, filter_criteria, is_preset)
SELECT id, 'OPPORTUNITY', '💎 Cơ hội giá trị cao (> 100M)', '{"minAmount":100000000}', 1
FROM users
WHERE status = 'ACTIVE'
  AND NOT EXISTS (
      SELECT 1 FROM saved_filters sf WHERE sf.user_id = users.id AND sf.module = 'OPPORTUNITY' AND sf.name = '💎 Cơ hội giá trị cao (> 100M)'
  );

INSERT INTO saved_filters (user_id, module, name, filter_criteria, is_preset)
SELECT id, 'OPPORTUNITY', '⭐ Cơ hội của tôi', '{"ownerFilter":"MINE"}', 1
FROM users
WHERE status = 'ACTIVE'
  AND NOT EXISTS (
      SELECT 1 FROM saved_filters sf WHERE sf.user_id = users.id AND sf.module = 'OPPORTUNITY' AND sf.name = '⭐ Cơ hội của tôi'
  );

INSERT INTO saved_filters (user_id, module, name, filter_criteria, is_preset)
SELECT id, 'OPPORTUNITY', '⚡ Giai đoạn Báo giá & Đàm phán', '{"stageId":3}', 1
FROM users
WHERE status = 'ACTIVE'
  AND NOT EXISTS (
      SELECT 1 FROM saved_filters sf WHERE sf.user_id = users.id AND sf.module = 'OPPORTUNITY' AND sf.name = '⚡ Giai đoạn Báo giá & Đàm phán'
  );

INSERT INTO saved_filters (user_id, module, name, filter_criteria, is_preset)
SELECT id, 'OPPORTUNITY', '📦 Cơ hội triển khai CRM Cloud', '{"productKeyword":"CRM Cloud"}', 1
FROM users
WHERE status = 'ACTIVE'
  AND NOT EXISTS (
      SELECT 1 FROM saved_filters sf WHERE sf.user_id = users.id AND sf.module = 'OPPORTUNITY' AND sf.name = '📦 Cơ hội triển khai CRM Cloud'
  );

-- ------------------------------------------------------------------------------
-- 4. SEED DỮ LIỆU MẪU LỊCH SỬ THAY ĐỔI & THÀNH VIÊN CHIA SẺ CHO CÁC CƠ HỘI
-- ------------------------------------------------------------------------------

-- Seed lịch sử cho Cơ hội #1 (VPBank Thăng Long)
INSERT INTO opportunity_field_history (opportunity_id, field_name, field_label, old_value, new_value, changed_by_user_id, reason, created_at)
VALUES 
(1, 'AMOUNT', 'Giá trị cơ hội', '180,000,000 ₫', '214,000,000 ₫', 4, 'Khách hàng mở rộng quy mô thêm 10 User Pro và bổ sung module bảo mật SSO', DATE_SUB(NOW(), INTERVAL 3 DAY)),
(1, 'EXPECTED_CLOSE_DATE', 'Ngày dự kiến chốt', '30/09/2026', '05/10/2026', 5, 'VPBank kéo dài quy trình kiểm tra an ninh thông tin và phê duyệt mẫu HĐ', DATE_SUB(NOW(), INTERVAL 5 DAY)),
(1, 'STAGE', 'Giai đoạn', 'Gửi báo giá', 'Thương lượng', 3, 'Khách hàng đã chốt phương án kỹ thuật và chuyển sang bước đàm phán điều khoản', DATE_SUB(NOW(), INTERVAL 7 DAY)),
(1, 'OWNER', 'Người sở hữu', 'Nguyễn Văn Hùng', 'Phạm Mai Phương', 1, 'Bàn giao cho Trưởng nhóm chuyên trách mảng Tài chính - Ngân hàng', DATE_SUB(NOW(), INTERVAL 10 DAY));

-- Seed lịch sử cho Cơ hội #2 (NEM Fashion)
INSERT INTO opportunity_field_history (opportunity_id, field_name, field_label, old_value, new_value, changed_by_user_id, reason, created_at)
VALUES 
(2, 'AMOUNT', 'Giá trị cơ hội', '150,000,000 ₫', '181,000,000 ₫', 3, 'Khách hàng quyết định đăng ký thêm gói Onsite Training cho toàn bộ quản lý cửa hàng', DATE_SUB(NOW(), INTERVAL 2 DAY)),
(2, 'EXPECTED_CLOSE_DATE', 'Ngày dự kiến chốt', '20/10/2026', '02/11/2026', 3, 'NEM dời cuộc họp HĐQT xét duyệt ngân sách sang đầu tháng 11', DATE_SUB(NOW(), INTERVAL 4 DAY)),
(2, 'STAGE', 'Giai đoạn', 'Đủ điều kiện', 'Gửi báo giá', 3, 'Hoàn thành bản khảo sát chi tiết và gửi báo giá chính thức kèm giải pháp', DATE_SUB(NOW(), INTERVAL 8 DAY));

-- Seed lịch sử cho Cơ hội #5 (Dược phẩm An Sinh)
INSERT INTO opportunity_field_history (opportunity_id, field_name, field_label, old_value, new_value, changed_by_user_id, reason, created_at)
VALUES 
(5, 'EXPECTED_CLOSE_DATE', 'Ngày dự kiến chốt', '10/10/2026', '18/10/2026', 7, 'Khách hàng yêu cầu chỉnh sửa điều khoản thanh toán theo đợt nghiệm thu', DATE_SUB(NOW(), INTERVAL 1 DAY)),
(5, 'STAGE', 'Giai đoạn', 'Gửi báo giá', 'Thương lượng', 6, 'Khách hàng phản hồi tích cực và thống nhất cuộc họp thương thảo cuối cùng', DATE_SUB(NOW(), INTERVAL 6 DAY));

-- Seed lịch sử cho Cơ hội #9 (Cung cấp Phần mềm CRM Enterprise & Tích hợp Tổng đài CTI)
INSERT INTO opportunity_field_history (opportunity_id, field_name, field_label, old_value, new_value, changed_by_user_id, reason, created_at)
VALUES 
(9, 'AMOUNT', 'Giá trị cơ hội', '120,000,000 ₫', '145,000,000 ₫', 1, 'Bổ sung cổng kết nối SIP Trunk và 50 máy nhánh tổng đài', DATE_SUB(NOW(), INTERVAL 2 DAY)),
(9, 'STAGE', 'Giai đoạn', 'Gửi báo giá', 'Thương lượng', 1, 'Hai bên đang rà soát hợp đồng kinh tế và cam kết SLA hỗ trợ 24/7', DATE_SUB(NOW(), INTERVAL 4 DAY));

-- Seed thành viên cùng tham gia cơ hội (Opportunity Team Collaborators)
-- Cơ hội #1 (VPBank Thăng Long): Chủ sở hữu là Phạm Mai Phương (5). Chia sẻ thêm: Lê Hoàng Nam (4 - Kỹ thuật Pre-sales), CRM Admin (1 - Giám sát điều hành), Trần Thị Thu Hà (3 - Trưởng nhóm hỗ trợ)
INSERT IGNORE INTO opportunity_members (opportunity_id, user_id, role_in_opportunity, can_log_activity, can_change_owner, added_by_user_id, created_at)
VALUES 
(1, 4, 'Chuyên gia Kỹ thuật & Pre-sales', 1, 0, 1, DATE_SUB(NOW(), INTERVAL 9 DAY)),
(1, 1, 'Giám sát điều hành', 1, 1, 1, DATE_SUB(NOW(), INTERVAL 9 DAY)),
(1, 3, 'Trưởng nhóm hỗ trợ đàm phán', 1, 0, 1, DATE_SUB(NOW(), INTERVAL 5 DAY));

-- Cơ hội #2 (NEM Fashion): Chủ sở hữu là Trần Thị Thu Hà (3). Chia sẻ thêm: Phạm Mai Phương (5 - Hỗ trợ kinh doanh), Lê Hoàng Nam (4 - Tư vấn giải pháp)
INSERT IGNORE INTO opportunity_members (opportunity_id, user_id, role_in_opportunity, can_log_activity, can_change_owner, added_by_user_id, created_at)
VALUES 
(2, 5, 'Hỗ trợ kinh doanh & Hợp đồng', 1, 0, 3, DATE_SUB(NOW(), INTERVAL 7 DAY)),
(2, 4, 'Tư vấn giải pháp kỹ thuật', 1, 0, 3, DATE_SUB(NOW(), INTERVAL 6 DAY));

-- Cơ hội #5 (Dược phẩm An Sinh): Chủ sở hữu là Đỗ Thị Tuyết (7). Chia sẻ thêm: Phan Văn Trung (6 - Trưởng nhóm giám sát)
INSERT IGNORE INTO opportunity_members (opportunity_id, user_id, role_in_opportunity, can_log_activity, can_change_owner, added_by_user_id, created_at)
VALUES 
(5, 6, 'Trưởng nhóm giám sát & Cố vấn', 1, 0, 7, DATE_SUB(NOW(), INTERVAL 4 DAY));

-- Cơ hội #9: Chủ sở hữu là CRM Administrator (1). Chia sẻ thêm: Lê Hoàng Nam (4 - Kỹ sư triển khai)
INSERT IGNORE INTO opportunity_members (opportunity_id, user_id, role_in_opportunity, can_log_activity, can_change_owner, added_by_user_id, created_at)
VALUES 
(9, 4, 'Kỹ sư triển khai CTI & Tổng đài', 1, 0, 1, DATE_SUB(NOW(), INTERVAL 3 DAY));
