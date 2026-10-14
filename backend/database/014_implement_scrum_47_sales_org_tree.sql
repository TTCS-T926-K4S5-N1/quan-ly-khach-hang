-- 014_implement_scrum_47_sales_org_tree.sql
-- Triển khai SCRUM-47: Khai báo cơ cấu tổ chức kinh doanh dạng cây, phân quyền dữ liệu và gán khu vực địa lý
USE crm_db;

SET NAMES utf8mb4;

-- 1. Bổ sung các cột vào organization_units
DELIMITER $$

DROP PROCEDURE IF EXISTS AddCol$$
CREATE PROCEDURE AddCol(
    IN p_table VARCHAR(64),
    IN p_col VARCHAR(64),
    IN p_def VARCHAR(255)
)
BEGIN
    IF (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = p_table AND COLUMN_NAME = p_col) = 0 THEN
        SET @sql = CONCAT('ALTER TABLE `', p_table, '` ADD COLUMN `', p_col, '` ', p_def);
        PREPARE stmt FROM @sql;
        EXECUTE stmt;
        DEALLOCATE PREPARE stmt;
    END IF;
END$$

DELIMITER ;

CALL AddCol('organization_units', 'code', 'VARCHAR(50) NULL');
CALL AddCol('organization_units', 'type', 'VARCHAR(50) NOT NULL DEFAULT \'sales-team\'');
CALL AddCol('organization_units', 'region', 'VARCHAR(100) NULL');
CALL AddCol('organization_units', 'description', 'VARCHAR(500) NULL');

CALL AddCol('teams', 'code', 'VARCHAR(50) NULL');
CALL AddCol('teams', 'manager_id', 'BIGINT NULL');
CALL AddCol('teams', 'region', 'VARCHAR(100) NULL');
CALL AddCol('teams', 'description', 'VARCHAR(500) NULL');

DROP PROCEDURE IF EXISTS AddCol;

-- 2. Thêm danh mục Khu vực địa lý (region) vào master_data
INSERT IGNORE INTO master_data (type, code, name, active, display_order) VALUES
('region', 'TOAN_QUOC', 'Toàn quốc', 1, 1),
('region', 'MIEN_BAC', 'Khu vực Miền Bắc', 1, 2),
('region', 'HA_NOI', 'Khu vực Hà Nội', 1, 3),
('region', 'MIEN_TRUNG', 'Khu vực Miền Trung', 1, 4),
('region', 'DA_NANG', 'Khu vực Đà Nẵng & Duyên Hải', 1, 5),
('region', 'MIEN_NAM', 'Khu vực Miền Nam', 1, 6),
('region', 'TP_HCM', 'Khu vực TP. Hồ Chí Minh', 1, 7),
('region', 'DONG_NAM_BO', 'Khu vực Đông Nam Bộ', 1, 8),
('region', 'MEKONG', 'Khu vực Đồng bằng Sông Cửu Long', 1, 9),
('region', 'TAY_NGUYEN', 'Khu vực Tây Nguyên', 1, 10);

-- 3. Thêm các tài khoản người dùng phục vụ phân cấp cơ cấu tổ chức
-- Mật khẩu mặc định: AdminPassword123!
SET @pwd_hash = '$2a$12$Ll/mowVCeORjAlcNhm3vTeIOymuy11KtDd9K.nGGasgiFTyOA3JLS';

INSERT INTO users (id, full_name, display_name, email, password_hash, status, data_scope, phone)
VALUES
(2, 'Nguyễn Văn Hùng', 'Nguyễn Văn Hùng', 'giamdoc@crm.local', @pwd_hash, 'ACTIVE', 'ALL', '0912000001')
ON DUPLICATE KEY UPDATE full_name = VALUES(full_name), display_name = VALUES(display_name);

INSERT INTO users (id, full_name, display_name, email, password_hash, status, data_scope, phone)
VALUES
(3, 'Trần Thị Thu Hà', 'Trần Thị Thu Hà', 'lead.mienbac@crm.local', @pwd_hash, 'ACTIVE', 'TEAM', '0912000002')
ON DUPLICATE KEY UPDATE full_name = VALUES(full_name), display_name = VALUES(display_name);

INSERT INTO users (id, full_name, display_name, email, password_hash, status, data_scope, phone)
VALUES
(4, 'Lê Hoàng Nam', 'Lê Hoàng Nam', 'sale.hn1@crm.local', @pwd_hash, 'ACTIVE', 'SELF', '0912000003')
ON DUPLICATE KEY UPDATE full_name = VALUES(full_name), display_name = VALUES(display_name);

INSERT INTO users (id, full_name, display_name, email, password_hash, status, data_scope, phone)
VALUES
(5, 'Phạm Mai Phương', 'Phạm Mai Phương', 'sale.hn2@crm.local', @pwd_hash, 'ACTIVE', 'SELF', '0912000004')
ON DUPLICATE KEY UPDATE full_name = VALUES(full_name), display_name = VALUES(display_name);

INSERT INTO users (id, full_name, display_name, email, password_hash, status, data_scope, phone)
VALUES
(6, 'Phan Văn Trung', 'Phan Văn Trung', 'lead.mientrung@crm.local', @pwd_hash, 'ACTIVE', 'TEAM', '0912000005')
ON DUPLICATE KEY UPDATE full_name = VALUES(full_name), display_name = VALUES(display_name);

INSERT INTO users (id, full_name, display_name, email, password_hash, status, data_scope, phone)
VALUES
(7, 'Đỗ Thị Tuyết', 'Đỗ Thị Tuyết', 'sale.dn@crm.local', @pwd_hash, 'ACTIVE', 'SELF', '0912000006')
ON DUPLICATE KEY UPDATE full_name = VALUES(full_name), display_name = VALUES(display_name);

INSERT INTO users (id, full_name, display_name, email, password_hash, status, data_scope, phone)
VALUES
(8, 'Vũ Minh Trí', 'Vũ Minh Trí', 'lead.miennam@crm.local', @pwd_hash, 'ACTIVE', 'TEAM', '0912000007')
ON DUPLICATE KEY UPDATE full_name = VALUES(full_name), display_name = VALUES(display_name);

INSERT INTO users (id, full_name, display_name, email, password_hash, status, data_scope, phone)
VALUES
(9, 'Hoàng Kim Yến', 'Hoàng Kim Yến', 'sale.hcm1@crm.local', @pwd_hash, 'ACTIVE', 'SELF', '0912000008')
ON DUPLICATE KEY UPDATE full_name = VALUES(full_name), display_name = VALUES(display_name);

INSERT INTO users (id, full_name, display_name, email, password_hash, status, data_scope, phone)
VALUES
(10, 'Trương Tuấn Kiệt', 'Trương Tuấn Kiệt', 'sale.hcm2@crm.local', @pwd_hash, 'ACTIVE', 'SELF', '0912000009')
ON DUPLICATE KEY UPDATE full_name = VALUES(full_name), display_name = VALUES(display_name);

-- Gán vai trò cho các tài khoản mới
INSERT IGNORE INTO user_roles (user_id, role_id)
SELECT 2, id FROM roles WHERE code = 'DIRECTOR';

INSERT IGNORE INTO user_roles (user_id, role_id)
SELECT 3, id FROM roles WHERE code = 'TEAM_LEAD';

INSERT IGNORE INTO user_roles (user_id, role_id)
SELECT 4, id FROM roles WHERE code = 'SALES_REP';

INSERT IGNORE INTO user_roles (user_id, role_id)
SELECT 5, id FROM roles WHERE code = 'SALES_REP';

INSERT IGNORE INTO user_roles (user_id, role_id)
SELECT 6, id FROM roles WHERE code = 'TEAM_LEAD';

INSERT IGNORE INTO user_roles (user_id, role_id)
SELECT 7, id FROM roles WHERE code = 'SALES_REP';

INSERT IGNORE INTO user_roles (user_id, role_id)
SELECT 8, id FROM roles WHERE code = 'TEAM_LEAD';

INSERT IGNORE INTO user_roles (user_id, role_id)
SELECT 9, id FROM roles WHERE code = 'SALES_REP';

INSERT IGNORE INTO user_roles (user_id, role_id)
SELECT 10, id FROM roles WHERE code = 'SALES_REP';

-- 4. Xây dựng Cây cơ cấu tổ chức kinh doanh mẫu
-- Xóa sạch dữ liệu cũ trong organization_units để nạp cây phân cấp mới
DELETE FROM organization_units;

-- Root: Khối Kinh doanh Toàn quốc (ID 1)
INSERT INTO organization_units (id, code, name, type, parent_id, manager_id, region, description, active)
VALUES (1, 'DIV-SALES', 'Khối Kinh doanh Toàn quốc', 'division', NULL, 2, 'Toàn quốc', 'Điều hành toàn bộ hoạt động kinh doanh toàn quốc', 1);

-- Cấp 1: 3 Phòng kinh doanh khu vực
INSERT INTO organization_units (id, code, name, type, parent_id, manager_id, region, description, active)
VALUES 
(2, 'DEPT-SALES-NORTH', 'Phòng Kinh doanh Miền Bắc', 'department', 1, 3, 'Khu vực Miền Bắc', 'Quản lý toàn bộ thị trường phía Bắc từ Hà Tĩnh trở ra', 1),
(5, 'DEPT-SALES-CENTRAL', 'Phòng Kinh doanh Miền Trung', 'department', 1, 6, 'Khu vực Miền Trung', 'Quản lý thị trường miền Trung và Tây Nguyên', 1),
(7, 'DEPT-SALES-SOUTH', 'Phòng Kinh doanh Miền Nam', 'department', 1, 8, 'Khu vực Miền Nam', 'Quản lý thị trường TP.HCM và các tỉnh phía Nam', 1);

-- Cấp 2: Các nhóm kinh doanh trực thuộc từng phòng
INSERT INTO organization_units (id, code, name, type, parent_id, manager_id, region, description, active)
VALUES
(3, 'TEAM-HN-B2B', 'Nhóm Kinh doanh B2B Hà Nội', 'sales-team', 2, 4, 'Khu vực Hà Nội', 'Phụ trách khách hàng doanh nghiệp khối B2B tại Hà Nội', 1),
(4, 'TEAM-MB-B2C', 'Nhóm Kinh doanh B2C & Đại lý Miền Bắc', 'sales-team', 2, 5, 'Khu vực Miền Bắc', 'Phụ trách hệ thống kênh phân phối và khách hàng cá nhân phía Bắc', 1),
(6, 'TEAM-DN', 'Nhóm Kinh doanh Đà Nẵng & Duyên Hải', 'sales-team', 5, 7, 'Khu vực Đà Nẵng & Duyên Hải', 'Phụ trách thị trường TP. Đà Nẵng, Quảng Nam, Quảng Ngãi', 1),
(8, 'TEAM-HCM-ENT', 'Nhóm Kinh doanh Doanh nghiệp TP.HCM', 'sales-team', 7, 9, 'Khu vực TP. Hồ Chí Minh', 'Chăm sóc và phát triển khách hàng Enterprise trọng điểm', 1),
(9, 'TEAM-HCM-SME', 'Nhóm Kinh doanh SME & Bán lẻ Phía Nam', 'sales-team', 7, 10, 'Khu vực TP. Hồ Chí Minh', 'Phát triển khách hàng vừa và nhỏ tại khu vực TP.HCM & Đông Nam Bộ', 1);

-- 5. Đồng bộ cấu trúc cây sang bảng teams
-- Cho phép đồng bộ hoàn toàn với DataScopeService
DELETE FROM teams;

INSERT INTO teams (id, code, name, parent_id, manager_id, region, description, active)
SELECT id, code, name, parent_id, manager_id, region, description, active
FROM organization_units;

-- 6. Gán mỗi nhân viên thuộc đúng một nhóm tại một thời điểm
-- (users.team_id gán vào team tương ứng)
UPDATE users SET team_id = 1 WHERE id = 2; -- Giám đốc thuộc Khối Kinh doanh
UPDATE users SET team_id = 2 WHERE id = 3; -- Trưởng phòng Bắc thuộc Phòng KD Miền Bắc
UPDATE users SET team_id = 3 WHERE id = 4; -- Chuyên viên Nam thuộc Nhóm B2B Hà Nội
UPDATE users SET team_id = 4 WHERE id = 5; -- Chuyên viên Phương thuộc Nhóm B2C Miền Bắc
UPDATE users SET team_id = 5 WHERE id = 6; -- Trưởng nhóm Trung thuộc Phòng KD Miền Trung
UPDATE users SET team_id = 6 WHERE id = 7; -- Chuyên viên Tuyết thuộc Nhóm Đà Nẵng
UPDATE users SET team_id = 7 WHERE id = 8; -- Trưởng phòng Nam thuộc Phòng KD Miền Nam
UPDATE users SET team_id = 8 WHERE id = 9; -- Chuyên viên Yến thuộc Nhóm Doanh nghiệp TP.HCM
UPDATE users SET team_id = 9 WHERE id = 10; -- Chuyên viên Kiệt thuộc Nhóm SME TP.HCM
