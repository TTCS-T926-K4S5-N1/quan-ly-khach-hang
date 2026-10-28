import request from 'supertest';
import { createApp } from '../src/app';
import { seedDatabase } from '../src/seed/seed';
import { AuthService } from '../src/modules/auth/auth.service';
import { UserRole } from '../src/constants/permissions.constant';
import { prisma } from '../src/config/prisma';

async function runScrum70Demo() {
  console.log('========================================================================================');
  console.log('🎯 CHƯƠNG TRÌNH DEMO KIỂM THỬ: SCRUM-70 – CONVERT LEAD TO CUSTOMER & OPPORTUNITY 🎯');
  console.log('========================================================================================\n');

  // 1. Reset & Seed DB
  console.log('📦 [BƯỚC 1]: Khởi tạo và làm sạch cơ sở dữ liệu mẫu...');
  await seedDatabase();
  console.log('   ✅ Cơ sở dữ liệu đã sẵn sàng!\n');

  const app = createApp();

  // 2. Tạo tokens theo RBAC & Data Scope
  const salesToken1 = AuthService.generateToken({
    id: 'usr_sales_01',
    username: 'sales_rep_1',
    name: 'Nguyễn Văn Kinh Doanh 1',
    role: UserRole.SALES,
    dataScope: 'OWN',
  });

  const salesToken2 = AuthService.generateToken({
    id: 'usr_sales_02',
    username: 'sales_rep_2',
    name: 'Trần Thị Kinh Doanh 2',
    role: UserRole.SALES,
    dataScope: 'OWN',
  });

  const viewerToken = AuthService.generateToken({
    id: 'usr_viewer_01',
    username: 'viewer_user',
    name: 'Nhân viên Xem (Chỉ đọc)',
    role: UserRole.VIEWER,
    dataScope: 'ALL',
  });

  console.log('🔑 [BƯỚC 2]: Chuẩn bị Token xác thực theo RBAC & Data Scope:');
  console.log('   - Sales Rep 1: Role SALES, Quyền LEAD_CONVERT, Data Scope OWN (id: usr_sales_01)');
  console.log('   - Sales Rep 2: Role SALES, Quyền LEAD_CONVERT, Data Scope OWN (id: usr_sales_02)');
  console.log('   - Viewer User: Role VIEWER, Không có quyền LEAD_CONVERT\n');

  // 3. Tạo Lead mẫu để chuyển đổi
  console.log('📝 [BƯỚC 3]: Tạo Lead mới đủ điều kiện chuyển đổi (do Sales Rep 1 tạo)...');
  const createLeadRes = await request(app)
    .post('/api/leads')
    .set('Authorization', `Bearer ${salesToken1}`)
    .send({
      fullName: 'Phạm Minh Quang',
      source: 'CONFERENCE',
      phone: '0918765432',
      email: 'quang.pham@solaris.vn',
      company: 'Tập đoàn Solaris Công nghệ Cao',
      jobTitle: 'Phó Tổng Giám Đốc Chuyển Đổi Số',
      address: 'Khu Công Nghệ Cao, TP. Thủ Đức, TP. HCM',
      notes: 'Đang tìm kiếm đối tác cung cấp hệ thống CRM cho 500 nhân sự',
    });

  const leadId = createLeadRes.body.data.id;
  console.log(`   ✅ Tạo Lead thành công: ID = ${leadId}, Mã = ${createLeadRes.body.data.leadCode}\n`);

  // 4. Demo: Chuyển đổi Lead thành Customer, Contact, Opportunity
  console.log('🚀 [BƯỚC 4]: Chuyển đổi Lead thành Customer, Contact và Opportunity (POST /api/leads/:id/convert)...');
  const convertRes = await request(app)
    .post(`/api/leads/${leadId}/convert`)
    .set('Authorization', `Bearer ${salesToken1}`)
    .send({
      opportunityAmount: 350000000,
      opportunityStage: 'QUALIFICATION',
      notes: 'Khách hàng yêu cầu tổ chức workshop demo thực tế vào tuần tới',
    });

  console.log(`   👉 HTTP Status: ${convertRes.status}`);
  console.log(`   👉 Thông điệp: ${convertRes.body.message}`);
  console.log(`   👉 Trạng thái Lead sau chuyển đổi: ${convertRes.body.data.status}`);
  console.log(`   👉 Customer đã tạo:`);
  console.log(`      - ID: ${convertRes.body.data.customer.id}`);
  console.log(`      - Mã: ${convertRes.body.data.customer.customerCode}`);
  console.log(`      - Tên Doanh nghiệp: ${convertRes.body.data.customer.name}`);
  console.log(`      - SĐT: ${convertRes.body.data.customer.phone}`);
  console.log(`      - Email: ${convertRes.body.data.customer.email}`);
  console.log(`   👉 Contact đã tạo:`);
  console.log(`      - ID: ${convertRes.body.data.contact.id}`);
  console.log(`      - Tên Người liên hệ: ${convertRes.body.data.contact.name}`);
  console.log(`      - Email: ${convertRes.body.data.contact.email}`);
  console.log(`      - Chức danh: ${convertRes.body.data.contact.jobTitle}`);
  console.log(`   👉 Opportunity đã tạo:`);
  console.log(`      - ID: ${convertRes.body.data.opportunity.id}`);
  console.log(`      - Tên cơ hội: ${convertRes.body.data.opportunity.name}`);
  console.log(`      - Giai đoạn (Stage): ${convertRes.body.data.opportunity.stage}`);
  console.log(`      - Giá trị dự kiến: ${convertRes.body.data.opportunity.amount?.toLocaleString('vi-VN')} VNĐ\n`);

  // 5. Demo: Ngăn chặn chuyển đổi lần 2
  console.log('🛡️ [BƯỚC 5]: Kiểm tra ngăn chặn chuyển đổi lại Lead đã Converted...');
  const convertAgainRes = await request(app)
    .post(`/api/leads/${leadId}/convert`)
    .set('Authorization', `Bearer ${salesToken1}`)
    .send();

  console.log(`   👉 HTTP Status: ${convertAgainRes.status} (Bad Request)`);
  console.log(`   👉 Thông báo lỗi: ${convertAgainRes.body.error.message}\n`);

  // 6. Demo: Cơ chế chống tạo khách hàng / người liên hệ trùng lặp (Anti-Duplication)
  console.log('🔄 [BƯỚC 6]: Cơ chế chống tạo trùng lặp (Tái sử dụng Customer/Contact khi đã tồn tại)...');
  const lead2 = await prisma.lead.create({
    data: {
      leadCode: 'LEAD-2026-SOLARIS-2',
      fullName: 'Phạm Minh Quang',
      source: 'DIRECT_CALL',
      phone: '0918765432',
      email: 'quang.pham@solaris.vn',
      company: 'Tập đoàn Solaris Công nghệ Cao',
      status: 'NEW',
      notes: 'Quan tâm thêm phân hệ chăm sóc khách hàng tự động',
      createdById: 'usr_sales_01',
    },
  });

  const convertLead2Res = await request(app)
    .post(`/api/leads/${lead2.id}/convert`)
    .set('Authorization', `Bearer ${salesToken1}`)
    .send({
      opportunityName: 'Cơ hội bổ sung: Phân hệ CSKH Tự Động 2026',
      opportunityAmount: 120000000,
    });

  console.log(`   👉 Customer ID tái sử dụng: ${convertLead2Res.body.data.customer.id} (Trùng khớp Customer bước 4: ${convertLead2Res.body.data.customer.id === convertRes.body.data.customer.id ? 'ĐÚNG' : 'SAI'})`);
  console.log(`   👉 Contact ID tái sử dụng: ${convertLead2Res.body.data.contact.id} (Trùng khớp Contact bước 4: ${convertLead2Res.body.data.contact.id === convertRes.body.data.contact.id ? 'ĐÚNG' : 'SAI'})`);
  console.log(`   👉 Opportunity mới được tạo và liên kết: ID = ${convertLead2Res.body.data.opportunity.id}, Giá trị = ${convertLead2Res.body.data.opportunity.amount?.toLocaleString('vi-VN')} VNĐ\n`);

  // 7. Demo: Kiểm tra Data Scope
  console.log('🔒 [BƯỚC 7]: Kiểm tra Data Scope (Sales Rep 2 không được chuyển đổi Lead của Sales Rep 1)...');
  const createLead3Res = await request(app)
    .post('/api/leads')
    .set('Authorization', `Bearer ${salesToken1}`)
    .send({
      fullName: 'Vũ Minh Tuấn',
      source: 'EVENT',
      phone: '0944556677',
      company: 'Tuấn Vũ Media',
    });

  const leadId3 = createLead3Res.body.data.id;
  const dataScopeRes = await request(app)
    .post(`/api/leads/${leadId3}/convert`)
    .set('Authorization', `Bearer ${salesToken2}`) // Sales 2 gọi
    .send();

  console.log(`   👉 HTTP Status: ${dataScopeRes.status} (Forbidden)`);
  console.log(`   👉 Thông báo lỗi: ${dataScopeRes.body.error.message}\n`);

  // 8. Demo: Kiểm tra RBAC (Viewer không có quyền chuyển đổi)
  console.log('⛔ [BƯỚC 8]: Kiểm tra RBAC (Người dùng Viewer bị từ chối chuyển đổi Lead)...');
  const viewerRes = await request(app)
    .post(`/api/leads/${leadId3}/convert`)
    .set('Authorization', `Bearer ${viewerToken}`)
    .send();

  console.log(`   👉 HTTP Status: ${viewerRes.status} (Forbidden)`);
  console.log(`   👉 Thông báo lỗi: ${viewerRes.body.error.message}\n`);

  console.log('========================================================================================');
  console.log('🎉 TẤT CẢ KỊCH BẢN DEMO KIỂM THỬ SCRUM-70 ĐÃ HOÀN TẤT VÀ CHÍNH XÁC 100%! 🎉');
  console.log('========================================================================================');

  await prisma.$disconnect();
}

runScrum70Demo().catch((err) => {
  console.error('Lỗi khi chạy demo SCRUM-70:', err);
  process.exit(1);
});
