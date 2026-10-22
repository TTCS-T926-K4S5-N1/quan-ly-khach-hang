-- 016_seed_contacts_and_roles.sql
-- Quản lý người liên hệ, vai trò quyết định mua (Buying Role) và lịch sử chuyển công ty
USE crm_db;

SET NAMES utf8mb4;

-- 1. Bảng contacts (Người liên hệ)
CREATE TABLE IF NOT EXISTS contacts (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    customer_id BIGINT NOT NULL,
    name VARCHAR(150) NOT NULL,
    title VARCHAR(100) NULL,
    email VARCHAR(255) NULL,
    phone VARCHAR(50) NULL,
    buying_role VARCHAR(50) NOT NULL DEFAULT 'INFLUENCER',
    is_primary TINYINT(1) NOT NULL DEFAULT 0,
    notes TEXT NULL,
    owner_user_id BIGINT NULL DEFAULT 1,
    is_deleted TINYINT(1) NOT NULL DEFAULT 0,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_contacts_customer
        FOREIGN KEY (customer_id)
        REFERENCES customers(id)
        ON DELETE CASCADE,

    CONSTRAINT chk_contacts_buying_role
        CHECK (buying_role IN ('DECISION_MAKER', 'INFLUENCER', 'END_USER', 'BLOCKER'))
);

-- 2. Bảng contact_company_history (Lịch sử công ty khi chuyển việc)
CREATE TABLE IF NOT EXISTS contact_company_history (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    contact_id BIGINT NOT NULL,
    customer_id BIGINT NOT NULL,
    job_title VARCHAR(100) NULL,
    start_date DATE NULL,
    end_date DATE NULL,
    notes VARCHAR(500) NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_cch_contact
        FOREIGN KEY (contact_id)
        REFERENCES contacts(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_cch_customer
        FOREIGN KEY (customer_id)
        REFERENCES customers(id)
        ON DELETE CASCADE
);

-- 3. Cập nhật quyền hạn cho tính năng Quản lý người liên hệ
INSERT IGNORE INTO permissions (code, name) VALUES
('contact.read', 'Xem liên hệ'),
('contact.create', 'Tạo liên hệ'),
('contact.update', 'Sửa liên hệ'),
('contact.delete', 'Xóa liên hệ');

INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE p.code IN ('contact.read', 'contact.create', 'contact.update', 'contact.delete')
  AND r.code IN ('ADMIN', 'DIRECTOR', 'MANAGER', 'TEAM_LEAD', 'SALES_REP');

-- 4. Seed dữ liệu Người liên hệ & vai trò quyết định mua
-- Khách hàng ID 12: Tập đoàn Bán buôn & Phân phối Điện tử Đại Phát
INSERT INTO contacts (customer_id, name, title, email, phone, buying_role, is_primary, notes, owner_user_id)
SELECT 12, 'Nguyễn Văn Phát', 'Tổng Giám Đốc', 'phat.nv@daiphat-elec.vn', '0944556677', 'DECISION_MAKER', 1, 'Người ký hợp đồng và duyệt ngân sách cuối cùng, quan tâm ROI và tiến độ triển khai.', 1
WHERE NOT EXISTS (SELECT 1 FROM contacts WHERE email = 'phat.nv@daiphat-elec.vn');

INSERT INTO contacts (customer_id, name, title, email, phone, buying_role, is_primary, notes, owner_user_id)
SELECT 12, 'Trần Thị Thu Hương', 'Giám đốc CNTT & Chuyển đổi số', 'huong.tt@daiphat-elec.vn', '0912334455', 'INFLUENCER', 0, 'Đánh giá kỹ thuật, kiến trúc tích hợp hệ thống ERP và bảo mật dữ liệu.', 1
WHERE NOT EXISTS (SELECT 1 FROM contacts WHERE email = 'huong.tt@daiphat-elec.vn');

INSERT INTO contacts (customer_id, name, title, email, phone, buying_role, is_primary, notes, owner_user_id)
SELECT 12, 'Lê Hoàng Long', 'Trưởng phòng Kinh doanh B2B', 'long.lh@daiphat-elec.vn', '0933221100', 'END_USER', 0, 'Đội ngũ trực tiếp sử dụng CRM hàng ngày, cần giao diện dễ dùng và app mobile mượt mà.', 1
WHERE NOT EXISTS (SELECT 1 FROM contacts WHERE email = 'long.lh@daiphat-elec.vn');

INSERT INTO contacts (customer_id, name, title, email, phone, buying_role, is_primary, notes, owner_user_id)
SELECT 12, 'Phạm Quốc Cường', 'Kế toán trưởng / Giám đốc Tài chính', 'cuong.pq@daiphat-elec.vn', '0908776655', 'BLOCKER', 0, 'Lo ngại vượt định mức ngân sách quý 4, yêu cầu đàm phán chính sách chiết khấu và thanh toán linh hoạt.', 1
WHERE NOT EXISTS (SELECT 1 FROM contacts WHERE email = 'cuong.pq@daiphat-elec.vn');

-- Khách hàng ID 1: Công ty Cổ phần Công nghệ ABC
INSERT INTO contacts (customer_id, name, title, email, phone, buying_role, is_primary, notes, owner_user_id)
SELECT 1, 'Đỗ Minh Tuấn', 'Giám đốc Điều hành (CEO)', 'tuan.dm@abc-tech.vn', '0912345678', 'DECISION_MAKER', 1, 'Quyết định chốt giải pháp tổng thể.', 1
WHERE NOT EXISTS (SELECT 1 FROM contacts WHERE email = 'tuan.dm@abc-tech.vn');

INSERT INTO contacts (customer_id, name, title, email, phone, buying_role, is_primary, notes, owner_user_id)
SELECT 1, 'Nguyễn Hải Yến', 'Trưởng phòng Mua hàng', 'yen.nh@abc-tech.vn', '0987654321', 'INFLUENCER', 0, 'Phụ trách đấu thầu và hồ sơ năng lực nhà cung cấp.', 1
WHERE NOT EXISTS (SELECT 1 FROM contacts WHERE email = 'yen.nh@abc-tech.vn');

INSERT INTO contacts (customer_id, name, title, email, phone, buying_role, is_primary, notes, owner_user_id)
SELECT 1, 'Vũ Đức Thắng', 'Trưởng nhóm Kỹ thuật', 'thang.vd@abc-tech.vn', '0909112233', 'END_USER', 0, 'Đánh giá API và kết nối hệ thống.', 1
WHERE NOT EXISTS (SELECT 1 FROM contacts WHERE email = 'thang.vd@abc-tech.vn');

-- Khách hàng ID 2: Tập đoàn Bất động sản Hoàng Gia
INSERT INTO contacts (customer_id, name, title, email, phone, buying_role, is_primary, notes, owner_user_id)
SELECT 2, 'Hoàng Đình Trọng', 'Phó Chủ tịch HĐQT', 'trong.hd@hoanggia-group.vn', '0988776655', 'DECISION_MAKER', 1, 'Người phê duyệt chủ trương đầu tư CRM toàn tập đoàn.', 1
WHERE NOT EXISTS (SELECT 1 FROM contacts WHERE email = 'trong.hd@hoanggia-group.vn');

INSERT INTO contacts (customer_id, name, title, email, phone, buying_role, is_primary, notes, owner_user_id)
SELECT 2, 'Bùi Phương Lan', 'Giám đốc Vận hành', 'lan.bp@hoanggia-group.vn', '0977665544', 'INFLUENCER', 0, 'Thúc đẩy chuẩn hóa quy trình chăm sóc khách hàng VIP.', 1
WHERE NOT EXISTS (SELECT 1 FROM contacts WHERE email = 'lan.bp@hoanggia-group.vn');

-- Khách hàng ID 3: Công ty TNHH Dịch vụ & Du lịch Viettravel Sun
INSERT INTO contacts (customer_id, name, title, email, phone, buying_role, is_primary, notes, owner_user_id)
SELECT 3, 'Trịnh Anh Quân', 'Giám đốc Dịch vụ Khách hàng', 'quan.ta@viettravelsun.vn', '0903124578', 'DECISION_MAKER', 1, 'Đầu mối chính quản lý dự án CRM ngành du lịch.', 1
WHERE NOT EXISTS (SELECT 1 FROM contacts WHERE email = 'quan.ta@viettravelsun.vn');

-- Khách hàng ID 4: Ngân hàng TMCP Việt Nam Thịnh Vượng (VPBank Thăng Long)
INSERT INTO contacts (customer_id, name, title, email, phone, buying_role, is_primary, notes, owner_user_id)
SELECT 4, 'Lương Thế Vinh', 'Trưởng khối Công nghệ Bán lẻ', 'vinh.lt@vpbankthanglong.vn', '02439288888', 'INFLUENCER', 1, 'Đánh giá tiêu chuẩn an toàn bảo mật và tích hợp ngân hàng số.', 1
WHERE NOT EXISTS (SELECT 1 FROM contacts WHERE email = 'vinh.lt@vpbankthanglong.vn');

-- 5. Seed lịch sử chuyển công ty cho nhân sự mẫu (Vũ Đức Thắng từng làm việc ở GreenTech ID 11 trước khi sang ABC Tech ID 1)
INSERT INTO contact_company_history (contact_id, customer_id, job_title, start_date, end_date, notes)
SELECT c.id, 11, 'Kỹ sư Giải pháp IT', '2023-01-15', '2025-12-31', 'Đã chuyển công tác sang Công ty CP Công nghệ ABC từ đầu năm 2026. Lịch sử tương tác và ghi chú cũ được lưu giữ nguyên vẹn.'
FROM contacts c
WHERE c.email = 'thang.vd@abc-tech.vn'
  AND NOT EXISTS (
      SELECT 1 FROM contact_company_history h WHERE h.contact_id = c.id AND h.customer_id = 11
  );
