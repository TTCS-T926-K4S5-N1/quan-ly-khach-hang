-- 012_fix_vietnamese_encoding.sql
-- Khắc phục toàn bộ lỗi font / ký tự tiếng Việt trong cơ sở dữ liệu crm_db
USE crm_db;

SET NAMES utf8mb4;

-- 1. Bảng roles (Vai trò người dùng)
UPDATE roles SET name = 'Quản trị hệ thống' WHERE code = 'ADMIN';
UPDATE roles SET name = 'Giám đốc kinh doanh' WHERE code = 'DIRECTOR';
UPDATE roles SET name = 'Trưởng nhóm kinh doanh' WHERE code = 'TEAM_LEAD';
UPDATE roles SET name = 'Nhân viên kinh doanh' WHERE code = 'SALES_REP';
UPDATE roles SET name = 'Nhân viên Marketing' WHERE code = 'MARKETING';
UPDATE roles SET name = 'Chăm sóc khách hàng' WHERE code = 'CUSTOMER_SUCCESS';
UPDATE roles SET name = 'Kế toán' WHERE code = 'ACCOUNTANT';

-- 2. Bảng teams (Phòng ban / Nhóm kinh doanh)
UPDATE teams SET name = 'Kinh doanh miền Bắc' WHERE id = 1;
UPDATE teams SET name = 'Kinh doanh miền Trung' WHERE id = 2;
UPDATE teams SET name = 'Kinh doanh miền Nam' WHERE id = 3;

-- 3. Bảng pipeline_stages (Các giai đoạn bán hàng)
UPDATE pipeline_stages SET name = 'Mới tiếp cận' WHERE id = 1;
UPDATE pipeline_stages SET name = 'Đủ điều kiện' WHERE id = 2;
UPDATE pipeline_stages SET name = 'Gửi báo giá' WHERE id = 3;
UPDATE pipeline_stages SET name = 'Thương lượng' WHERE id = 4;
UPDATE pipeline_stages SET name = 'Thành công' WHERE id = 5;
UPDATE pipeline_stages SET name = 'Thất bại' WHERE id = 6;

-- 4. Bảng products (Sản phẩm)
UPDATE products SET name = 'Gói giải pháp CRM Doanh nghiệp' WHERE id = 1;
UPDATE products SET name = 'Bản quyền phần mềm CRM Cloud theo năm' WHERE id = 2;

-- 5. Bảng customers (Khách hàng mẫu)
UPDATE customers SET 
    name = 'Công ty Cổ phần Công nghệ ABC',
    address = 'Số 123 Phố Huế, Hai Bà Trưng, Hà Nội'
WHERE id = 1;

UPDATE customers SET 
    name = 'Tập đoàn Bất động sản Hoàng Gia',
    address = 'Tầng 15, Tòa nhà Landmark, Q.1, TP.HCM'
WHERE id = 2;

-- 6. Bảng opportunities (Cơ hội bán hàng)
UPDATE opportunities SET name = 'Dự án triển khai CRM Toàn quốc 2026' WHERE id = 1;

-- 7. Bảng permissions (Quyền hạn hệ thống)
UPDATE permissions SET name = 'Xem cơ cấu tổ chức' WHERE code = 'organization.read';
UPDATE permissions SET name = 'Quản lý cơ cấu tổ chức' WHERE code = 'organization.manage';
UPDATE permissions SET name = 'Xem lý do thắng thua' WHERE code = 'winloss.read';
UPDATE permissions SET name = 'Quản lý lý do thắng thua' WHERE code = 'winloss.manage';
UPDATE permissions SET name = 'Xem đối thủ' WHERE code = 'competitor.read';
UPDATE permissions SET name = 'Quản lý đối thủ' WHERE code = 'competitor.manage';
UPDATE permissions SET name = 'Xem phân quyền' WHERE code = 'permission.read';
UPDATE permissions SET name = 'Quản lý phân quyền' WHERE code = 'permission.manage';
UPDATE permissions SET name = 'Xem người dùng' WHERE code = 'user.read';
UPDATE permissions SET name = 'Tạo người dùng' WHERE code = 'user.create';
UPDATE permissions SET name = 'Cập nhật người dùng' WHERE code = 'user.update';
UPDATE permissions SET name = 'Xóa người dùng' WHERE code = 'user.delete';
UPDATE permissions SET name = 'Xem nhóm kinh doanh' WHERE code = 'team.read';
UPDATE permissions SET name = 'Gán nhóm kinh doanh' WHERE code = 'team.assign';
UPDATE permissions SET name = 'Khóa hoặc mở khóa người dùng' WHERE code = 'user.lock';
UPDATE permissions SET name = 'Bàn giao dữ liệu người dùng' WHERE code = 'user.transfer';
UPDATE permissions SET name = 'Xem nhật ký hệ thống' WHERE code = 'audit.read';
UPDATE permissions SET name = 'Nhập người dùng Excel' WHERE code = 'user.import';
UPDATE permissions SET name = 'Xem sản phẩm' WHERE code = 'product.read';
UPDATE permissions SET name = 'Tạo sản phẩm' WHERE code = 'product.create';
UPDATE permissions SET name = 'Cập nhật sản phẩm' WHERE code = 'product.update';
UPDATE permissions SET name = 'Xóa sản phẩm' WHERE code = 'product.delete';
UPDATE permissions SET name = 'Xem bảng giá' WHERE code = 'pricebook.read';
UPDATE permissions SET name = 'Tạo bảng giá' WHERE code = 'pricebook.create';
UPDATE permissions SET name = 'Xem danh mục dùng chung' WHERE code = 'masterdata.read';
UPDATE permissions SET name = 'Quản lý danh mục dùng chung' WHERE code = 'masterdata.manage';
UPDATE permissions SET name = 'Xem trường tùy chỉnh' WHERE code = 'customfield.read';
UPDATE permissions SET name = 'Quản lý trường tùy chỉnh' WHERE code = 'customfield.manage';
UPDATE permissions SET name = 'Xem quy trình bán hàng' WHERE code = 'pipeline.read';
UPDATE permissions SET name = 'Quản lý quy trình bán hàng' WHERE code = 'pipeline.manage';
UPDATE permissions SET name = 'Xem khách hàng' WHERE code = 'customer.read';
UPDATE permissions SET name = 'Tạo khách hàng' WHERE code = 'customer.create';
UPDATE permissions SET name = 'Sửa khách hàng' WHERE code = 'customer.update';
UPDATE permissions SET name = 'Xóa khách hàng' WHERE code = 'customer.delete';
UPDATE permissions SET name = 'Xuất khách hàng' WHERE code = 'customer.export';
UPDATE permissions SET name = 'Xem liên hệ' WHERE code = 'contact.read';
UPDATE permissions SET name = 'Tạo liên hệ' WHERE code = 'contact.create';
UPDATE permissions SET name = 'Sửa liên hệ' WHERE code = 'contact.update';
UPDATE permissions SET name = 'Xem khách hàng tiềm năng' WHERE code = 'lead.read';
UPDATE permissions SET name = 'Tạo khách hàng tiềm năng' WHERE code = 'lead.create';
UPDATE permissions SET name = 'Sửa khách hàng tiềm năng' WHERE code = 'lead.update';
UPDATE permissions SET name = 'Phân bổ khách hàng tiềm năng' WHERE code = 'lead.assign';
UPDATE permissions SET name = 'Xem cơ hội' WHERE code = 'opportunity.read';
UPDATE permissions SET name = 'Tạo cơ hội' WHERE code = 'opportunity.create';
UPDATE permissions SET name = 'Sửa cơ hội' WHERE code = 'opportunity.update';
UPDATE permissions SET name = 'Đóng cơ hội' WHERE code = 'opportunity.close';
UPDATE permissions SET name = 'Xuất cơ hội' WHERE code = 'opportunity.export';
UPDATE permissions SET name = 'Xem hoạt động' WHERE code = 'activity.read';
UPDATE permissions SET name = 'Tạo hoạt động' WHERE code = 'activity.create';
UPDATE permissions SET name = 'Sửa hoạt động' WHERE code = 'activity.update';
UPDATE permissions SET name = 'Xuất hoạt động' WHERE code = 'activity.export';
UPDATE permissions SET name = 'Xem công việc' WHERE code = 'task.read';
UPDATE permissions SET name = 'Tạo công việc' WHERE code = 'task.create';
UPDATE permissions SET name = 'Sửa công việc' WHERE code = 'task.update';
UPDATE permissions SET name = 'Xem báo giá' WHERE code = 'quote.read';
UPDATE permissions SET name = 'Tạo báo giá' WHERE code = 'quote.create';
UPDATE permissions SET name = 'Sửa báo giá' WHERE code = 'quote.update';
UPDATE permissions SET name = 'Duyệt báo giá' WHERE code = 'quote.approve';
UPDATE permissions SET name = 'Xuất báo giá' WHERE code = 'quote.export';
UPDATE permissions SET name = 'Xem hợp đồng' WHERE code = 'contract.read';
UPDATE permissions SET name = 'Tạo hợp đồng' WHERE code = 'contract.create';
UPDATE permissions SET name = 'Sửa hợp đồng' WHERE code = 'contract.update';
UPDATE permissions SET name = 'Xem KPI' WHERE code = 'kpi.read';
UPDATE permissions SET name = 'Quản lý KPI' WHERE code = 'kpi.manage';
UPDATE permissions SET name = 'Xem báo cáo' WHERE code = 'report.read';
UPDATE permissions SET name = 'Xem bảng tổng quan' WHERE code = 'dashboard.read';
UPDATE permissions SET name = 'Xem tự động hóa' WHERE code = 'automation.read';
UPDATE permissions SET name = 'Quản lý tự động hóa' WHERE code = 'automation.manage';
UPDATE permissions SET name = 'Xem thông báo' WHERE code = 'notification.read';
UPDATE permissions SET name = 'Xem vai trò' WHERE code = 'role.read';
UPDATE permissions SET name = 'Quản lý vai trò' WHERE code = 'role.manage';
UPDATE permissions SET name = 'Xem giá vốn sản phẩm' WHERE code = 'product.cost.read';
UPDATE permissions SET name = 'Cập nhật giá vốn sản phẩm' WHERE code = 'product.cost.update';
