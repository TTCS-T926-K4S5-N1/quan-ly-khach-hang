-- SCRUM-94: Mẫu tài liệu PDF (báo giá / hợp đồng) khai báo trong cấu hình, không hard-code.
-- Idempotent: chạy lại nhiều lần không lỗi, không ghi đè mẫu đã chỉnh sửa.
SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS document_templates (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    document_type VARCHAR(20) NOT NULL COMMENT 'QUOTE | CONTRACT',
    name VARCHAR(150) NOT NULL,
    title VARCHAR(200) NOT NULL,
    company_name VARCHAR(255) NOT NULL,
    company_address VARCHAR(500) NULL,
    company_tax_code VARCHAR(50) NULL,
    company_phone VARCHAR(50) NULL,
    company_email VARCHAR(255) NULL,
    company_website VARCHAR(255) NULL,
    company_bank_account VARCHAR(255) NULL,
    representative_name VARCHAR(150) NULL,
    representative_title VARCHAR(150) NULL,
    logo_data MEDIUMTEXT NULL COMMENT 'data:image/png|jpeg;base64,...',
    primary_color VARCHAR(7) NOT NULL DEFAULT '#1E3A8A',
    intro_text TEXT NULL,
    terms_text TEXT NULL,
    footer_text TEXT NULL,
    currency_unit VARCHAR(30) NOT NULL DEFAULT 'đồng',
    validity_days INT NOT NULL DEFAULT 30,
    updated_by BIGINT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_document_templates_type (document_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO document_templates (
    document_type, name, title, company_name, company_address, company_tax_code,
    company_phone, company_email, company_website, company_bank_account,
    representative_name, representative_title, primary_color,
    intro_text, terms_text, footer_text, currency_unit, validity_days
) VALUES (
    'QUOTE', 'Mẫu báo giá mặc định', 'BÁO GIÁ',
    'CÔNG TY CỔ PHẦN GIẢI PHÁP CORPORATE CRM',
    'Tầng 8, Tòa nhà Techno, 123 Nguyễn Trãi, Thanh Xuân, Hà Nội',
    '0109876543', '024 3999 8888', 'sales@corporatecrm.vn', 'www.corporatecrm.vn',
    'STK 0123456789 - Ngân hàng TMCP Ngoại thương Việt Nam (Vietcombank) - CN Thanh Xuân',
    'Nguyễn Văn An', 'Giám đốc Kinh doanh', '#1E3A8A',
    'Kính gửi Quý khách hàng {customerName},\n{companyName} trân trọng gửi tới Quý khách bảng báo giá {quoteNumber} như sau:',
    '1. Báo giá có hiệu lực trong vòng {validityDays} ngày kể từ ngày lập.\n2. Giá trên đã bao gồm thuế GTGT (nếu có) theo quy định hiện hành.\n3. Thời gian giao hàng / triển khai: theo thỏa thuận cụ thể trong hợp đồng.\n4. Phương thức thanh toán: chuyển khoản vào tài khoản của công ty.',
    '{companyName} - Hotline 024 3999 8888 - sales@corporatecrm.vn',
    'đồng', 30
), (
    'CONTRACT', 'Mẫu hợp đồng mặc định', 'HỢP ĐỒNG MUA BÁN',
    'CÔNG TY CỔ PHẦN GIẢI PHÁP CORPORATE CRM',
    'Tầng 8, Tòa nhà Techno, 123 Nguyễn Trãi, Thanh Xuân, Hà Nội',
    '0109876543', '024 3999 8888', 'sales@corporatecrm.vn', 'www.corporatecrm.vn',
    'STK 0123456789 - Ngân hàng TMCP Ngoại thương Việt Nam (Vietcombank) - CN Thanh Xuân',
    'Nguyễn Văn An', 'Giám đốc Kinh doanh', '#1E3A8A',
    '- Căn cứ Bộ luật Dân sự số 91/2015/QH13 ngày 24/11/2015;\n- Căn cứ Luật Thương mại số 36/2005/QH11 ngày 14/06/2005;\n- Căn cứ báo giá số {quoteNumber} và nhu cầu, khả năng của hai bên.\nHôm nay, ngày {signedDate}, chúng tôi gồm:',
    'Điều 4. Trách nhiệm của các bên\n- Bên A cung cấp hàng hóa / dịch vụ đúng chủng loại, số lượng, chất lượng như Điều 1.\n- Bên B thanh toán đầy đủ, đúng hạn theo Điều 3.\nĐiều 5. Điều khoản chung\n- Hai bên cam kết thực hiện đúng các điều khoản đã ký. Mọi tranh chấp được giải quyết bằng thương lượng; nếu không thành sẽ đưa ra Tòa án có thẩm quyền.\n- Hợp đồng được lập thành 02 bản có giá trị pháp lý như nhau, mỗi bên giữ 01 bản.',
    '{companyName} - Hợp đồng số {contractNumber}',
    'đồng', 30
);

-- Quyền cấu hình mẫu tài liệu
INSERT IGNORE INTO permissions (code, name)
VALUES ('document_template.manage', 'Cấu hình mẫu tài liệu PDF');

INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.code IN ('ADMIN', 'DIRECTOR')
  AND p.code = 'document_template.manage';
