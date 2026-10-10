-- Migration 023: Cập nhật phân bổ quyền sở hữu khách hàng cho các cấp Sales & Bổ sung thông tin liên hệ chính
-- Giúp các vai trò kinh doanh (Miền Bắc, Miền Trung, Miền Nam, Sales Rep, Team Lead, Giám đốc, Admin) đều có dữ liệu khách hàng theo Data Scope

-- 1. Phân bổ người sở hữu khách hàng
UPDATE customers SET owner_user_id = 4 WHERE id = 1;  -- sale.hn1
UPDATE customers SET owner_user_id = 8 WHERE id = 2;  -- lead.miennam
UPDATE customers SET owner_user_id = 9 WHERE id = 3;  -- sale.hcm1
UPDATE customers SET owner_user_id = 3 WHERE id = 4;  -- lead.mienbac
UPDATE customers SET owner_user_id = 5 WHERE id = 5;  -- sale.hn2
UPDATE customers SET owner_user_id = 10 WHERE id = 6; -- sale.hcm2
UPDATE customers SET owner_user_id = 6 WHERE id = 7;  -- lead.mientrung
UPDATE customers SET owner_user_id = 9 WHERE id = 8;  -- sale.hcm1
UPDATE customers SET owner_user_id = 7 WHERE id = 9;  -- sale.dn
UPDATE customers SET owner_user_id = 4 WHERE id = 10; -- sale.hn1
UPDATE customers SET owner_user_id = 7 WHERE id = 11; -- sale.dn
UPDATE customers SET owner_user_id = 3 WHERE id = 12; -- lead.mienbac
UPDATE customers SET owner_user_id = 4 WHERE id = 13; -- sale.hn1
UPDATE customers SET owner_user_id = 10 WHERE id = 14;-- sale.hcm2
UPDATE customers SET owner_user_id = 4 WHERE id = 15; -- sale.hn1
UPDATE customers SET owner_user_id = 5 WHERE id = 16; -- sale.hn2
UPDATE customers SET owner_user_id = 8 WHERE id = 17; -- lead.miennam

-- 2. Bổ sung thông tin liên hệ chính (nếu chưa có)
INSERT INTO contacts (customer_id, name, title, email, phone, is_primary, buying_role, is_deleted, created_at)
SELECT 5, 'Nguyễn Thu Trang', 'Giám đốc Chuỗi Bán lẻ', 'trang.nt@nemfashion.vn', '0904567890', 1, 'DECISION_MAKER', 0, NOW()
WHERE NOT EXISTS (SELECT 1 FROM contacts WHERE customer_id = 5 AND is_deleted = 0);

INSERT INTO contacts (customer_id, name, title, email, phone, is_primary, buying_role, is_deleted, created_at)
SELECT 6, 'BS. Phan Thanh Tùng', 'Giám đốc Y khoa & Mua sắm', 'tung.pt@ansinhmed.vn', '0913456789', 1, 'DECISION_MAKER', 0, NOW())
WHERE NOT EXISTS (SELECT 1 FROM contacts WHERE customer_id = 6 AND is_deleted = 0);

INSERT INTO contacts (customer_id, name, title, email, phone, is_primary, buying_role, is_deleted, created_at)
SELECT 7, 'KTS. Lê Văn Đức', 'Phó Tổng Giám đốc Kỹ thuật', 'duc.lv@nama-corp.vn', '0903987654', 1, 'DECISION_MAKER', 0, NOW()
WHERE NOT EXISTS (SELECT 1 FROM contacts WHERE customer_id = 7 AND is_deleted = 0);

INSERT INTO contacts (customer_id, name, title, email, phone, is_primary, buying_role, is_deleted, created_at)
SELECT 8, 'ThS. Đào Mai Chi', 'Trưởng phòng Tuyển sinh & Hợp tác', 'chi.dm@asianschool.edu.vn', '0989123456', 1, 'INFLUENCER', 0, NOW()
WHERE NOT EXISTS (SELECT 1 FROM contacts WHERE customer_id = 8 AND is_deleted = 0);

INSERT INTO contacts (customer_id, name, title, email, phone, is_primary, buying_role, is_deleted, created_at)
SELECT 9, 'Trần Văn Bách', 'Trưởng phòng Khai thác & Điều vận', 'bach.tv@logitechvn.com', '0908889922', 1, 'DECISION_MAKER', 0, NOW()
WHERE NOT EXISTS (SELECT 1 FROM contacts WHERE customer_id = 9 AND is_deleted = 0);

INSERT INTO contacts (customer_id, name, title, email, phone, is_primary, buying_role, is_deleted, created_at)
SELECT 10, 'Nguyễn Phương Thảo', 'Giám đốc Chuỗi Nhượng quyền', 'thao.np@tacotoco.vn', '0918776622', 1, 'DECISION_MAKER', 0, NOW()
WHERE NOT EXISTS (SELECT 1 FROM contacts WHERE customer_id = 10 AND is_deleted = 0);

INSERT INTO contacts (customer_id, name, title, email, phone, is_primary, buying_role, is_deleted, created_at)
SELECT 11, 'Vũ Minh Quân', 'Giám đốc R&D Công nghệ Xanh', 'quan.vm@greentech.vn', '0905123888', 1, 'DECISION_MAKER', 0, NOW()
WHERE NOT EXISTS (SELECT 1 FROM contacts WHERE customer_id = 11 AND is_deleted = 0);

INSERT INTO contacts (customer_id, name, title, email, phone, is_primary, buying_role, is_deleted, created_at)
SELECT 14, 'Hoàng Minh Trí', 'Trưởng ban Pháp chế & Dự án', 'tri.hm@hoanggia-group.vn', '0988776650', 1, 'INFLUENCER', 0, NOW()
WHERE NOT EXISTS (SELECT 1 FROM contacts WHERE customer_id = 14 AND is_deleted = 0);

INSERT INTO contacts (customer_id, name, title, email, phone, is_primary, buying_role, is_deleted, created_at)
SELECT 17, 'Phạm Quốc Hưng', 'Giám đốc Ban Quản lý Dự án', 'hung.pq@hoanggia-urban.vn', '0977889900', 1, 'DECISION_MAKER', 0, NOW()
WHERE NOT EXISTS (SELECT 1 FROM contacts WHERE customer_id = 17 AND is_deleted = 0);
