-- ==============================================================================
-- 046_fix_mojibake_sprint4_sprint5.sql
-- Khắc phục triệt để lỗi font chữ tiếng Việt (Mojibake, dấu hỏi ?) do nạp script
-- từ các sprint 4 và 5:
-- 1. Bảng activities (công việc quá hạn, sắp đến hạn, cuộc họp, gọi điện)
-- 2. Bảng attachments (ghi chú tài liệu đính kèm)
-- 3. Bảng contracts (tiêu đề và điều khoản hợp đồng)
-- 4. Bảng contract_settings (mô tả cấu hình cảnh báo hợp đồng)
-- 5. Bảng document_templates (mẫu in hợp đồng, thông tin công ty, điều khoản mẫu)
-- 6. Bảng quotes (tiêu đề báo giá)
-- 7. Bảng opportunity_members (vai trò cộng tác viên trong cơ hội)
-- 8. Bảng opportunity_field_history (nhãn trường, giá trị cũ/mới, lý do thay đổi)
-- 9. Bảng saved_filters (tên bộ lọc cơ hội cài sẵn)
-- ==============================================================================

USE crm_db;
SET NAMES utf8mb4;
SET CHARACTER SET utf8mb4;

-- 1. Sửa lỗi bảng activities
UPDATE activities 
SET subject = 'Họp trao đổi trực tiếp tại trụ sở VPBank',
    description = 'Gặp Giám đốc CNTT VPBank trao đổi phương án tích hợp Core Banking và bảo mật SSO',
    outcome = 'Khách hàng đánh giá cao giải pháp, yêu cầu gửi lại bản đặc tả API trước thứ 6'
WHERE id = 596;

UPDATE activities 
SET subject = 'Gọi điện thoại xác nhận lịch demo phòng ban',
    description = 'Gọi cho Trưởng phòng CSKH xác nhận tham dự buổi demo tính năng Omnichannel',
    outcome = 'Đã chốt lịch demo sáng thứ Ba tuần tới lúc 9h30'
WHERE id = 597;

UPDATE activities 
SET subject = 'Gửi email tài liệu kiến trúc bảo mật & SLA',
    description = 'Gửi bộ tài liệu bảo mật SOC2, ISO27001 và cam kết thời gian phản hồi SLA',
    outcome = 'Đã chuyển tiếp cho đội IT Security xem xét'
WHERE id = 598;

UPDATE activities 
SET subject = 'Ghi chú nhanh sau khi rời văn phòng NEM Fashion',
    description = 'Gặp chị Hương tại showroom Bà Triệu. Khách muốn bổ sung thêm 3 chi nhánh mới vào gói CRM',
    outcome = 'Cần cập nhật báo giá bổ sung thêm 3 chi nhánh trong hôm nay'
WHERE id = 599;

UPDATE activities 
SET subject = 'Gửi bảng báo giá CRM Enterprise cho khách vào thứ Sáu',
    description = 'Rà soát biểu phí tích hợp Core Banking và gửi file báo giá chính thức cho anh Phát trước 17h thứ Sáu.'
WHERE id = 604;

UPDATE activities 
SET subject = 'Kiểm tra lại phụ lục hợp đồng mẫu',
    description = 'Đã rà soát xong các điều khoản bảo mật với phòng pháp chế.',
    outcome = 'Đã hoàn thành và gửi duyệt'
WHERE id = 605;

UPDATE activities 
SET subject = 'Gọi điện chốt lịch ký hợp đồng ba bên',
    description = 'Hẹn ban giám đốc và đối tác công nghệ chốt ngày ký hợp đồng.',
    outcome = 'Đã liên hệ nhưng khách hoãn lịch',
    postpone_reason = 'Khách hàng bận họp Hội đồng quản trị đột xuất, yêu cầu dời lịch sang thứ Ba tuần sau.'
WHERE id = 606;

UPDATE activities 
SET subject = 'Họp demo giải pháp tích hợp CTI Tổng đài',
    description = 'Demo trực tiếp tính năng click-to-call và ghi âm cuộc gọi cho đội CSKH VPBank'
WHERE id = 607;

UPDATE activities 
SET subject = 'Cuộc gặp trao đổi yêu cầu với NEM Fashion',
    description = 'Gặp chị Hương tại showroom Bà Triệu để khảo sát quy trình bán lẻ'
WHERE id = 608;

UPDATE activities 
SET subject = 'Gửi hợp đồng nguyên tắc cho FPT Software',
    description = 'Hợp đồng NDA và thỏa thuận dịch vụ cung ứng giải pháp CRM.'
WHERE id = 612;

UPDATE activities 
SET subject = 'Phê duyệt đề xuất chiết khấu dự án Viettel Post',
    description = 'Yêu cầu phê duyệt chiết khấu 8% từ chuyên viên kinh doanh.'
WHERE id = 613;

UPDATE activities 
SET subject = 'Gọi điện xác nhận lịch triển khai với VPBank',
    description = 'Liên hệ anh Phát để chốt phòng họp kỹ thuật.'
WHERE id = 614;

UPDATE activities 
SET subject = 'Hoàn thiện hồ sơ năng lực gửi Techcombank',
    description = 'Hồ sơ dự thầu phần mềm quản lý quan hệ khách hàng.'
WHERE id = 615;

UPDATE activities 
SET subject = 'Bổ sung chứng nhận an toàn thông tin ISO 27001',
    description = 'Khách hàng yêu cầu gửi kèm phụ lục an ninh mạng.'
WHERE id = 616;

UPDATE activities 
SET subject = 'Chuẩn bị tài liệu buổi họp demo giải pháp lúc 15h',
    description = 'Kiểm tra tài khoản demo và kịch bản CSKH đa kênh.'
WHERE id = 617;

UPDATE activities 
SET subject = 'Gửi email nhắc khách hàng về buổi webinar thứ Sáu',
    description = 'Email thông báo kèm link Zoom và tài liệu hướng dẫn.'
WHERE id = 618;

UPDATE activities 
SET subject = 'Gọi điện chăm sóc định kỳ cho Vinamilk',
    description = 'Hỏi thăm phản hồi sau 1 tuần dùng thử bản Enterprise.'
WHERE id = 619;

UPDATE activities 
SET subject = 'Gọi tư vấn gói CRM Pro cho NEM Fashion',
    description = 'Tư vấn tích hợp POS và SMS Marketing.',
    outcome = 'Khách hẹn tuần sau họp chốt phương án'
WHERE id = 620;

UPDATE activities 
SET subject = 'Gặp mặt trao đổi tiến độ với Tập đoàn Sunhouse',
    description = 'Họp với Giám đốc IT về kết nối API ERP.',
    outcome = 'Đã thống nhất tài liệu đặc tả kỹ thuật'
WHERE id = 621;

UPDATE activities 
SET subject = 'Gửi báo giá tùy biến tính năng thẻ VIP',
    description = 'Gửi bảng chiết tính chi phí phát triển module riêng.',
    outcome = 'Đã gửi, đang chờ khách hàng phản hồi'
WHERE id = 622;

UPDATE activities 
SET subject = 'Gọi điện xác minh thông tin doanh nghiệp mới',
    description = 'Kiểm tra quy mô và nhu cầu phần mềm.',
    outcome = 'Số điện thoại đúng, đã gửi profile công ty'
WHERE id = 623;

UPDATE activities 
SET subject = 'Tư vấn chuyển đổi số cho Chuỗi nhà thuốc Pharma',
    description = 'Giới thiệu giải pháp CRM quản lý điểm bán lẻ.',
    outcome = 'Khách hàng quan tâm và xin dùng thử 14 ngày'
WHERE id = 624;


-- 2. Sửa lỗi bảng attachments
UPDATE attachments SET notes = 'Hồ sơ kỹ thuật và năng lực đấu thầu' WHERE id = 8;
UPDATE attachments SET notes = 'Biên bản thống nhất phạm vi triển khai giai đoạn 1' WHERE id = 9;
UPDATE attachments SET notes = 'Báo giá chính thức đã ký duyệt' WHERE id = 10;


-- 3. Sửa lỗi bảng contracts
UPDATE contracts 
SET title = 'Hợp đồng bảo trì phần mềm CRM - VPBank Thăng Long',
    payment_terms = 'Thanh toán 100% khi nghiệm thu dịch vụ năm'
WHERE contract_number = 'HD-SAMPLE-EXP-7D';

UPDATE contracts 
SET title = 'Hợp đồng thuê bao Cloud Enterprise - Nem Fashion',
    payment_terms = 'Thanh toán định kỳ hàng năm'
WHERE contract_number = 'HD-SAMPLE-EXP-15D';

UPDATE contracts 
SET title = 'Hợp đồng dịch vụ bảo mật & SSL - Tập đoàn Hoàng Gia',
    payment_terms = 'Thanh toán đợt 1 50%, đợt 2 50%'
WHERE contract_number = 'HD-SAMPLE-EXPIRED-5D';


-- 4. Sửa lỗi bảng contract_settings
UPDATE contract_settings 
SET description = 'Số ngày trước khi hết hạn để cảnh báo hợp đồng sắp hết hạn'
WHERE setting_key = 'expiring_threshold_days';


-- 5. Sửa lỗi bảng document_templates
UPDATE document_templates 
SET template_name = 'Mẫu Hợp đồng Kinh tế & Triển khai Phần mềm',
    company_name = 'TẬP ĐOÀN CÔNG NGHỆ & GIẢI PHÁP CRM ENTERPRISE VIỆT NAM',
    header_content = 'HỢP ĐỒNG CUNG CẤP GIẢI PHÁP VÀ BẢN QUYỀN PHẦN MỀM QUẢN TRỊ KHÁCH HÀNG CRM',
    footer_content = 'Hợp đồng được lập thành 02 (hai) bản có giá trị pháp lý như nhau, mỗi bên giữ 01 (một) bản để thực hiện.',
    default_terms = '• Bên A cam kết bàn giao phần mềm đúng thời hạn và đào tạo chuyển giao công nghệ đầy đủ.\n• Bên B có trách nhiệm thanh toán đúng tiến độ đã thỏa thuận.\n• Hai bên cam kết thực hiện đúng các điều khoản hợp đồng đã ký kết.'
WHERE id = 2;


-- 6. Sửa lỗi bảng quotes
UPDATE quotes 
SET title = 'Báo giá Triển khai Phần mềm CRM Enterprise VPBank (Gói chuẩn)'
WHERE id = 7;


-- 7. Sửa lỗi bảng opportunity_members
UPDATE opportunity_members SET role_in_opportunity = 'Chuyên gia Kỹ thuật & Pre-sales' WHERE opportunity_id = 1 AND user_id = 4;
UPDATE opportunity_members SET role_in_opportunity = 'Giám sát điều hành' WHERE opportunity_id = 1 AND user_id = 1;
UPDATE opportunity_members SET role_in_opportunity = 'Trưởng nhóm hỗ trợ đàm phán' WHERE opportunity_id = 1 AND user_id = 3;
UPDATE opportunity_members SET role_in_opportunity = 'Hỗ trợ kinh doanh & Hợp đồng' WHERE opportunity_id = 2 AND user_id = 5;
UPDATE opportunity_members SET role_in_opportunity = 'Tư vấn giải pháp kỹ thuật' WHERE opportunity_id = 2 AND user_id = 4;
UPDATE opportunity_members SET role_in_opportunity = 'Trưởng nhóm giám sát & Cố vấn' WHERE opportunity_id = 5 AND user_id = 6;
UPDATE opportunity_members SET role_in_opportunity = 'Kỹ sư triển khai CTI & Tổng đài' WHERE opportunity_id = 9 AND user_id = 4;


-- 8. Sửa lỗi bảng opportunity_field_history
UPDATE opportunity_field_history 
SET field_label = 'Giá trị cơ hội', old_value = '180,000,000 ₫', new_value = '214,000,000 ₫', reason = 'Khách hàng mở rộng quy mô thêm 10 User Pro và bổ sung module bảo mật SSO'
WHERE id = 1;

UPDATE opportunity_field_history 
SET field_label = 'Ngày dự kiến chốt', old_value = '30/09/2026', new_value = '05/10/2026', reason = 'VPBank kéo dài quy trình kiểm tra an ninh thông tin và phê duyệt mẫu HĐ'
WHERE id = 2;

UPDATE opportunity_field_history 
SET field_label = 'Giai đoạn', old_value = 'Gửi báo giá', new_value = 'Thương lượng', reason = 'Khách hàng đã chốt phương án kỹ thuật và chuyển sang bước đàm phán điều khoản'
WHERE id = 3;

UPDATE opportunity_field_history 
SET field_label = 'Người sở hữu', old_value = 'Nguyễn Văn Hùng', new_value = 'Phạm Mai Phương', reason = 'Bàn giao cho Trưởng nhóm chuyên trách mảng Tài chính - Ngân hàng'
WHERE id = 4;

UPDATE opportunity_field_history 
SET field_label = 'Giá trị cơ hội', old_value = '150,000,000 ₫', new_value = '181,000,000 ₫', reason = 'Khách hàng quyết định đăng ký thêm gói Onsite Training cho toàn bộ quản lý cửa hàng'
WHERE id = 5;

UPDATE opportunity_field_history 
SET field_label = 'Ngày dự kiến chốt', old_value = '20/10/2026', new_value = '02/11/2026', reason = 'NEM dời cuộc họp HĐQT xét duyệt ngân sách sang đầu tháng 11'
WHERE id = 6;

UPDATE opportunity_field_history 
SET field_label = 'Giai đoạn', old_value = 'Đủ điều kiện', new_value = 'Gửi báo giá', reason = 'Hoàn thành bản khảo sát chi tiết và gửi báo giá chính thức kèm giải pháp'
WHERE id = 7;

UPDATE opportunity_field_history 
SET field_label = 'Ngày dự kiến chốt', old_value = '10/10/2026', new_value = '18/10/2026', reason = 'Khách hàng yêu cầu chỉnh sửa điều khoản thanh toán theo đợt nghiệm thu'
WHERE id = 8;

UPDATE opportunity_field_history 
SET field_label = 'Giai đoạn', old_value = 'Gửi báo giá', new_value = 'Thương lượng', reason = 'Khách hàng phản hồi tích cực và thống nhất cuộc họp thương thảo cuối cùng'
WHERE id = 9;

UPDATE opportunity_field_history 
SET field_label = 'Giá trị cơ hội', old_value = '120,000,000 ₫', new_value = '145,000,000 ₫', reason = 'Bổ sung cổng kết nối SIP Trunk và 50 máy nhánh tổng đài'
WHERE id = 10;

UPDATE opportunity_field_history 
SET field_label = 'Giai đoạn', old_value = 'Gửi báo giá', new_value = 'Thương lượng', reason = 'Hai bên đang rà soát hợp đồng kinh tế và cam kết SLA hỗ trợ 24/7'
WHERE id = 11;

UPDATE opportunity_field_history 
SET field_label = 'Giai đoạn bán hàng', old_value = 'Đề xuất giải pháp', new_value = 'Thương lượng & Đàm phán', reason = 'Khách hàng đã đồng ý về mặt kỹ thuật, chuyển sang đàm phán hợp đồng thương mại'
WHERE id = 14;

UPDATE opportunity_field_history 
SET field_label = 'Giá trị cơ hội', old_value = '200,000,000 ₫', new_value = '225,000,000 ₫', reason = 'Bổ sung thêm 50 user license và gói hỗ trợ 24/7'
WHERE id = 15;


-- 9. Sửa lỗi bảng saved_filters
UPDATE saved_filters 
SET name = '🎯 Thương vụ cần đẩy trong tuần này' 
WHERE module = 'OPPORTUNITY' AND name LIKE '%Th%ng v%c%n %y trong tu%n n%y%';

UPDATE saved_filters 
SET name = '💎 Cơ hội giá trị cao (> 100M)' 
WHERE module = 'OPPORTUNITY' AND name LIKE '%C%h%i gi% tr% cao (> 100M)%';

UPDATE saved_filters 
SET name = '⭐ Cơ hội của tôi' 
WHERE module = 'OPPORTUNITY' AND name LIKE '%C%h%i c%a t%i%';

UPDATE saved_filters 
SET name = '⚡ Giai đoạn Báo giá & Đàm phán' 
WHERE module = 'OPPORTUNITY' AND name LIKE '%Giai %o%n B%o gi% & %m ph%n%';

UPDATE saved_filters 
SET name = '📦 Cơ hội triển khai CRM Cloud' 
WHERE module = 'OPPORTUNITY' AND name LIKE '%C%h%i tri%n khai CRM Cloud%';
