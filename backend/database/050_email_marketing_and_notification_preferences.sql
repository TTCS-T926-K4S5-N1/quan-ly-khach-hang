-- 050_email_marketing_and_notification_preferences.sql
-- Story 1: Soạn mẫu email và gửi email cho khách từ trong hệ thống, ghi vào dòng thời gian khách hàng, gửi bất đồng bộ qua hàng đợi, gửi lại thư thất bại
-- Story 2: Bật/tắt từng loại thông báo cho riêng mình (kênh trong ứng dụng & email), thông báo bắt buộc như báo giá chờ duyệt không tắt được

SET NAMES utf8mb4;

-- 1. Bảng cấu hình thông báo cá nhân (user_notification_settings)
CREATE TABLE IF NOT EXISTS user_notification_settings (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    notification_type VARCHAR(50) NOT NULL, -- QUOTE_APPROVAL_REQUEST, LEAD_ASSIGNED, QUOTE_RESPONSE, TASK_ASSIGNED, OPPORTUNITY_STAGNANT, AUTOMATION_EVENT, CUSTOMER_EMAIL
    in_app_enabled TINYINT(1) NOT NULL DEFAULT 1,
    email_enabled TINYINT(1) NOT NULL DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_user_notif (user_id, notification_type),
    CONSTRAINT fk_user_notif_pref FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Bảng mẫu email (email_templates)
CREATE TABLE IF NOT EXISTS email_templates (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    subject VARCHAR(255) NOT NULL,
    body_html MEDIUMTEXT NOT NULL,
    category VARCHAR(100) DEFAULT 'MARKETING', -- MARKETING, SALES, ONBOARDING, NURTURING
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    created_by BIGINT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Bảng hàng đợi email & nhật ký gửi thư (email_queue)
CREATE TABLE IF NOT EXISTS email_queue (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    template_id BIGINT NULL,
    customer_id BIGINT NULL,
    contact_id BIGINT NULL,
    recipient_email VARCHAR(255) NOT NULL,
    recipient_name VARCHAR(255) NULL,
    subject VARCHAR(255) NOT NULL,
    body_html MEDIUMTEXT NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'QUEUED', -- QUEUED, SENDING, SENT, FAILED
    attempts INT NOT NULL DEFAULT 0,
    error_message TEXT NULL,
    sent_by_user_id BIGINT NOT NULL,
    scheduled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    sent_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email_status (status),
    INDEX idx_email_customer (customer_id),
    CONSTRAINT fk_email_customer FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL,
    CONSTRAINT fk_email_user FOREIGN KEY (sent_by_user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Seed dữ liệu mẫu cho Mẫu email (Email Templates)
INSERT INTO email_templates (id, name, subject, body_html, category, is_active, created_by)
VALUES
(1, 'Giới thiệu Giải pháp CRM Enterprise', 'Giới thiệu giải pháp CRM cho {{company_name}} - Kính gửi {{contact_name}}',
 '<p>Kính gửi Anh/Chị <strong>{{contact_name}}</strong>,</p>
<p>Tôi là <strong>{{staff_name}}</strong>, đại diện bộ phận tư vấn giải pháp chuyển đổi số tại CRM Platform.</p>
<p>Được biết <strong>{{company_name}}</strong> đang quan tâm đến việc nâng cao năng suất đội ngũ bán hàng và chuẩn hoá dữ liệu khách hàng tập trung, chúng tôi xin trân trọng giới thiệu bộ giải pháp CRM Doanh nghiệp toàn diện.</p>
<ul>
  <li>Quản lý phễu cơ hội và dự báo doanh số thời gian thực</li>
  <li>Chăm sóc khách hàng đa kênh với Dòng thời gian 360 độ</li>
  <li>Tự động hoá quy trình nhắc việc và phân bổ lead thông minh</li>
</ul>
<p>Nếu Anh/Chị <strong>{{contact_name}}</strong> quan tâm, em xin phép đặt lịch trao đổi nhanh 15 phút hoặc gửi tài liệu chuyên sâu hơn cho <strong>{{company_name}}</strong> ạ.</p>
<p>Kính chúc Anh/Chị và Quý công ty luôn phát triển thịnh vượng!</p>
<p>Trân trọng,<br><strong>{{staff_name}}</strong></p>', 'MARKETING', 1, 1),

(2, 'Theo dõi & Chăm sóc sau Báo giá', 'Theo dõi phản hồi báo giá dịch vụ - Kính gửi {{company_name}}',
 '<p>Kính gửi Anh/Chị <strong>{{contact_name}}</strong>,</p>
<p>Em là <strong>{{staff_name}}</strong> phụ trách hỗ trợ <strong>{{company_name}}</strong>.</p>
<p>Vừa qua bên em đã gửi tới Quý công ty hồ sơ đề xuất và bảng báo giá dịch vụ. Em viết email này nhằm kiểm tra xem Anh/Chị đã xem qua bảng chào giá chưa, và có cần bên em giải đáp hay bổ sung chính sách ưu đãi nào không ạ?</p>
<p>Nếu cần điều chỉnh phạm vi triển khai hoặc phương thức thanh toán để phù hợp nhất với kế hoạch ngân sách của <strong>{{company_name}}</strong>, em luôn sẵn sàng hỗ trợ trực tiếp.</p>
<p>Chúc Anh/Chị <strong>{{contact_name}}</strong> một tuần làm việc hiệu quả và nhiều thành công!</p>
<p>Trân trọng,<br><strong>{{staff_name}}</strong></p>', 'SALES', 1, 1),

(3, 'Thư Cảm ơn & Chào mừng Khách hàng Mới', 'Chào mừng {{company_name}} đồng hành cùng chúng tôi!',
 '<p>Kính gửi Anh/Chị <strong>{{contact_name}}</strong>,</p>
<p>Thay mặt Ban Giám đốc và toàn thể đội ngũ, <strong>{{staff_name}}</strong> xin gửi lời cảm ơn chân thành nhất tới <strong>{{company_name}}</strong> đã tin tưởng lựa chọn chúng tôi làm đối tác.</p>
<p>Tài khoản hệ thống và gói dịch vụ của Quý công ty đã được kích hoạt thành công. Đội ngũ chuyên gia CSKH sẽ chủ động liên hệ để hỗ trợ Anh/Chị và các phòng ban làm quen với phần mềm nhanh nhất.</p>
<p>Mọi thắc mắc kỹ thuật trong quá trình vận hành, Anh/Chị có thể phản hồi trực tiếp qua email này hoặc hotline kỹ thuật 24/7.</p>
<p>Kính chúc <strong>{{company_name}}</strong> gặt hái thêm nhiều bước tiến vượt bậc trong thời gian tới!</p>
<p>Thân ái,<br><strong>{{staff_name}}</strong></p>', 'ONBOARDING', 1, 1)
ON DUPLICATE KEY UPDATE name = VALUES(name), subject = VALUES(subject), body_html = VALUES(body_html);

-- 5. Seed dữ liệu mẫu cho Hàng đợi Email (Email Queue)
INSERT INTO email_queue (id, template_id, customer_id, recipient_email, recipient_name, subject, body_html, status, attempts, error_message, sent_by_user_id, scheduled_at, sent_at)
VALUES
(1, 1, 1, 'contact@vpbank.com.vn', 'Nguyễn Tấn Phát', 'Giới thiệu giải pháp CRM cho Ngân hàng TMCP Việt Nam Thịnh Vượng (VPBank) - Kính gửi Nguyễn Tấn Phát',
 '<p>Kính gửi Anh/Chị Nguyễn Tấn Phát, đã gửi thành công thư giới thiệu sản phẩm cho VPBank.</p>', 'SENT', 1, NULL, 4, NOW() - INTERVAL 2 HOUR, NOW() - INTERVAL 2 HOUR),
(2, 2, 2, 'nem.fashion.loi@invalid-smtp-test.vn', 'Đặng Mai Hương', 'Theo dõi phản hồi báo giá dịch vụ - Kính gửi NEM Fashion Group',
 '<p>Thư gửi thất bại do máy chủ nhận thư từ chối kết nối (550 Mailbox unavailable).</p>', 'FAILED', 1, 'Lỗi kết nối máy chủ gửi: 550 Mailbox unavailable or domain not found', 4, NOW() - INTERVAL 1 HOUR, NULL)
ON DUPLICATE KEY UPDATE status = VALUES(status), error_message = VALUES(error_message);

-- 6. Ghi nhận mẫu email đã gửi vào Dòng thời gian của Khách hàng 1 (Customer Timeline)
INSERT INTO activities (subject, type, description, outcome, status, priority, due_date, duration_minutes, customer_id, contact_id, opportunity_id, owner_user_id, assigned_by_user_id, is_deleted, created_at)
VALUES 
('Email gửi khách: Giới thiệu giải pháp CRM cho VPBank', 'EMAIL', 
 'Đã gửi email giới thiệu giải pháp CRM Enterprise cho anh Nguyễn Tấn Phát (VPBank). Nội dung thư bao gồm giới thiệu bộ tính năng phễu bán hàng, dòng thời gian 360 và tự động hoá thông minh.', 
 'Đã gửi qua hệ thống', 'COMPLETED', 'MEDIUM', NULL, 5, 1, 1, 1, 4, 4, 0, NOW() - INTERVAL 2 HOUR)
ON DUPLICATE KEY UPDATE subject = VALUES(subject);
