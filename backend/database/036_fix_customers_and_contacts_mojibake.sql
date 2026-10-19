-- Sửa triệt để lỗi font chữ tiếng Việt (Mojibake) trong phần Khách hàng, Người liên hệ và Hoạt động
SET NAMES utf8mb4;
SET CHARACTER SET utf8mb4;

-- 1. Cập nhật bảng contacts (Người liên hệ của khách hàng)
UPDATE contacts 
SET name = 'Hoàng Tuấn Anh',
    title = 'Giám đốc Mua sắm',
    notes = 'Quan tâm triển khai CRM cho 40 chuyên viên kinh doanh'
WHERE id IN (171, 172);

UPDATE contacts 
SET name = 'Đặng Vũ Hưng',
    notes = 'Cần triển khai giải pháp CRM doanh nghiệp ngay trong tháng này'
WHERE id IN (173, 176, 179);

UPDATE contacts 
SET name = 'Trần Bích Thủy'
WHERE id IN (174, 177, 180);

UPDATE contacts 
SET name = 'Nguyễn Hữu Trí'
WHERE id IN (175, 178, 181);

UPDATE contacts
SET name = 'Lê Hoàng Long',
    title = 'CTO',
    notes = 'Triển khai CRM Cloud'
WHERE id IN (182, 183, 185, 188, 191);

UPDATE contacts
SET name = 'Trần Thị Mai',
    title = 'Chủ cơ sở'
WHERE id IN (184, 186, 189, 192);

UPDATE contacts
SET name = 'Lê Hoàng Long',
    title = 'CTO & Đồng sáng lập'
WHERE id IN (187, 190, 193);

-- 2. Cập nhật bảng customers (Địa chỉ, Lý do từ chối, Nguồn lead chuẩn tiếng Việt)
UPDATE customers
SET address = 'Số 45 Lê Văn Lương, Cầu Giấy, Hà Nội',
    lead_source = 'Hội thảo / Sự kiện'
WHERE id IN (35, 36, 38, 41, 44);

UPDATE customers
SET address = 'Số 88 Nguyễn Trãi, Thanh Xuân, Hà Nội',
    lead_source = 'Sự kiện / Hội nghị',
    rejection_reason = 'Sai địa bàn phụ trách - Khách ở Miền Nam'
WHERE id IN (37, 39, 42, 45);

UPDATE customers
SET address = 'Số 102 Tôn Thất Thuyết, Cầu Giấy, Hà Nội',
    lead_source = 'Hội thảo / Sự kiện'
WHERE id IN (40, 43, 46);

-- 3. Cập nhật bảng activities (Lịch sử hoạt động của khách hàng)
UPDATE activities
SET description = 'Tạo lead thủ công từ nguồn: Hội thảo / Sự kiện | Sự kiện: Hội thảo VietBuild 2026 | Trao đổi/Nhu cầu: Quan tâm triển khai CRM cho 40 chuyên viên kinh doanh'
WHERE id IN (522, 523);

UPDATE activities
SET description = 'Tạo lead thủ công từ nguồn: Hội thảo / Sự kiện | Sự kiện: Triển lãm Công nghệ TechExpo | Trao đổi/Nhu cầu: Cần triển khai giải pháp CRM doanh nghiệp ngay trong tháng này'
WHERE id IN (524, 527, 530);

UPDATE activities
SET description = 'Tạo lead thủ công từ nguồn: Website / Tìm kiếm'
WHERE id IN (525, 528, 531);

UPDATE activities
SET description = 'Tạo lead thủ công từ nguồn: Người quen giới thiệu'
WHERE id IN (526, 529, 532);

UPDATE activities
SET subject = 'Cuộc gọi tư vấn lần 1',
    description = 'Đã gọi trao đổi nhu cầu CRM 50 users'
WHERE id IN (538, 544, 551, 558);

UPDATE activities
SET subject = 'Họp demo trực tuyến',
    description = 'Demo tính năng cơ hội và báo giá'
WHERE id IN (539, 545, 552, 559);

UPDATE activities
SET description = 'Nhân viên từ chối lead. Lý do: Sai địa bàn phụ trách - Khách ở Miền Nam'
WHERE id IN (537, 543, 550, 557);

UPDATE activities
SET description = REPLACE(REPLACE(REPLACE(REPLACE(description, 'Há»™i tháº£o', 'Hội thảo'), 'Sá»± kiá»‡n', 'Sự kiện'), 'Quan tÃ¢m', 'Quan tâm'), 'NgÆ°á» i quen giá»›i thiá»‡u', 'Người quen giới thiệu')
WHERE description LIKE '%Ã%' OR description LIKE '%Â%' OR description LIKE '%á»%' OR description LIKE '%Æ%';
