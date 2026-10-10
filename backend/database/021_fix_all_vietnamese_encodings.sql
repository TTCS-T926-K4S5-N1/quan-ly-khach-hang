USE crm_db;
SET NAMES utf8mb4;

-- 1. Sửa toàn bộ tên và địa chỉ tiếng Việt cho bảng customers
UPDATE customers SET
    name = 'Công ty Cổ phần Điện tử Đại Phát',
    address = 'Tầng 5, Tòa nhà Charmvit, 117 Trần Duy Hưng, Cầu Giấy, Hà Nội'
WHERE id = 13;

UPDATE customers SET
    name = 'Tập đoàn Bất động sản Hoàng Gia Group',
    address = 'Tòa nhà Hoàng Gia, Quận 1, TP. Hồ Chí Minh'
WHERE id = 14;

UPDATE customers SET
    name = 'Công ty TNHH Viễn thông & Thiết bị Mạng Đại Phát (DaiPhat Telecom)',
    address = 'Lô B2, Khu Công nghệ cao Hòa Lạc, Thạch Thất, Hà Nội'
WHERE id = 15;

UPDATE customers SET
    name = 'Công ty Cổ phần Giải pháp Phần mềm & Số hóa Đại Phát (DaiPhat Digital)',
    address = 'Tầng 8, Tòa nhà Đại Phát, 88 Dịch Vọng Hậu, Cầu Giấy, Hà Nội'
WHERE id = 16;

UPDATE customers SET
    name = 'Công ty Cổ phần Xây dựng & Phát triển Đô thị Hoàng Gia (HoangGia Urban)',
    address = 'Khu Đô thị Mới Nam Sài Gòn, Quận 7, TP. Hồ Chí Minh'
WHERE id = 17;

-- 2. Sửa toàn bộ tên, chức danh và ghi chú trong contacts
UPDATE contacts SET
    name = 'Ngô Quang Huy',
    title = 'Phó Giám đốc Kỹ thuật',
    notes = 'Quan tâm công nghệ hạ tầng'
WHERE id = 101;

UPDATE contacts SET
    name = 'Vũ Đình Toàn',
    title = 'Giám đốc Khối Viễn thông',
    notes = 'Người quyết định duyệt giải pháp viễn thông'
WHERE id = 151;

UPDATE contacts SET
    name = 'Đặng Thùy Dung',
    title = 'Phó Giám đốc Trung tâm Số hóa',
    notes = 'Phụ trách kiến trúc phần mềm số hóa'
WHERE id = 161;

-- 3. Sửa tên các cơ hội trong opportunities
UPDATE opportunities SET
    name = 'Gói Mở rộng Máy chủ DataCenter Chi nhánh 2'
WHERE id = 101;

UPDATE opportunities SET
    name = 'Hợp đồng Nâng cấp Băng thông Quốc tế & VPN'
WHERE id = 151;

UPDATE opportunities SET
    name = 'Dự án Tổng đài Cloud CallCenter 50 Agents'
WHERE id = 152;

UPDATE opportunities SET
    name = 'Hợp đồng Nền tảng Quản trị Số Enterprise 2026'
WHERE id = 161;

UPDATE opportunities SET
    name = 'Hệ thống Phân tích Dữ liệu BI & AI Dashboard'
WHERE id = 162;

UPDATE opportunities SET
    name = 'Hợp đồng Phần mềm Giám sát Thi công Dự án KĐT'
WHERE id = 171;

-- 4. Sửa chủ đề và mô tả trong activities
UPDATE activities SET
    subject = 'Gọi điện chào giải pháp Server',
    description = 'Đã gọi cho anh Huy, anh hẹn tuần tới gửi báo giá chi tiết'
WHERE subject LIKE 'G?i ?i?n ch?o%';

UPDATE activities SET
    subject = 'Gửi hồ sơ năng lực và catalog giải pháp',
    description = 'Đã gửi catalog giải pháp CRM & Server cho anh Huy'
WHERE subject LIKE 'G?i h? s? n?ng l?c%';

UPDATE activities SET
    description = REPLACE(description, 'C?ng ty C? ph?n ?i?n t? ??i Ph?t', 'Công ty Cổ phần Điện tử Đại Phát')
WHERE description LIKE '%C?ng ty C? ph?n ?i?n t? ??i Ph?t%';
