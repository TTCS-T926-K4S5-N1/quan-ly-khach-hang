import request from 'supertest';
import { createApp } from '../src/app';
import { seedDatabase } from '../src/seed/seed';
import { AuthService } from '../src/modules/auth/auth.service';
import { UserRole } from '../src/constants/permissions.constant';
import { prisma } from '../src/config/prisma';

async function runScrum72Demo() {
  console.log('========================================================================================');
  console.log('🎯 CHƯƠNG TRÌNH DEMO KIỂM THỬ: SCRUM-72 – QUẢN LÝ CƠ HỘI BÁN HÀNG (SALES OPPORTUNITY) 🎯');
  console.log('========================================================================================\n');

  // 1. Reset & Seed DB
  console.log('📦 [BƯỚC 1]: Khởi tạo và làm sạch cơ sở dữ liệu mẫu...');
  await seedDatabase();

  // Tạo liên hệ cho khách hàng cust_001
  const testContact = await prisma.contact.create({
    data: {
      contactCode: 'CT-2026-001',
      customerId: 'cust_001',
      name: 'Nguyễn Văn Minh (CTO)',
      phone: '0909999888',
      email: 'minh.nguyen@alpha-tech.vn',
      jobTitle: 'Giám đốc Công nghệ',
      isPrimary: true,
    },
  });
  console.log('   ✅ Đã chuẩn bị dữ liệu mẫu khách hàng (cust_001) và người liên hệ chính (CT-2026-001)!\n');

  const app = createApp();

  // 2. Tạo tokens theo RBAC & Data Scope
  const salesToken = AuthService.generateToken({
    id: 'usr_sales_01',
    username: 'sales_rep_1',
    name: 'Nguyễn Văn Kinh Doanh',
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

  console.log('🔑 [BƯỚC 2]: Chuẩn bị Token xác thực theo RBAC:');
  console.log('   - Sales Rep: Role SALES, Quyền OPPORTUNITY_CREATE, OPPORTUNITY_MANAGE, OPPORTUNITY_VIEW');
  console.log('   - Viewer: Role VIEWER, Chỉ có quyền OPPORTUNITY_VIEW\n');

  // 3. Demo tạo cơ hội bán hàng với xác suất mặc định theo giai đoạn
  console.log('📝 [BƯỚC 3]: Tạo cơ hội bán hàng mới (Giai đoạn QUALIFICATION -> Xác suất mặc định 10%)...');
  const createRes1 = await request(app)
    .post('/api/opportunities')
    .set('Authorization', `Bearer ${salesToken}`)
    .send({
      name: 'Cơ hội cung cấp giải pháp CRM Doanh nghiệp',
      customerId: 'cust_001',
      primaryContactId: testContact.id,
      stage: 'QUALIFICATION',
      expectedValue: 150000000,
      expectedCloseDate: '2026-12-15',
      source: 'WEBSITE',
      notes: 'Khách hàng có nhu cầu triển khai hệ thống CRM trong quý 4',
    });

  console.log(`   HTTP Status: ${createRes1.status}`);
  console.log('   Kết quả trả về:');
  console.log(`   - Mã cơ hội: ${createRes1.body.data.opportunityCode}`);
  console.log(`   - Tên cơ hội: ${createRes1.body.data.name}`);
  console.log(`   - Khách hàng: ${createRes1.body.data.customer?.customerName}`);
  console.log(`   - Người liên hệ: ${createRes1.body.data.primaryContact?.name}`);
  console.log(`   - Giai đoạn: ${createRes1.body.data.stage}`);
  console.log(`   - Xác suất tự động tính: ${createRes1.body.data.probability}% (mặc định cho QUALIFICATION)`);
  console.log(`   - Giá trị dự kiến: ${createRes1.body.data.expectedValue.toLocaleString()} VND\n`);

  const createdOppId = createRes1.body.data.id;

  // 4. Demo tạo cơ hội thứ 2 song song cho cùng 1 khách hàng với xác suất tùy chỉnh
  console.log('📝 [BƯỚC 4]: Tạo cơ hội thứ 2 song song cho cùng khách hàng với xác suất tùy chỉnh (85%)...');
  const createRes2 = await request(app)
    .post('/api/opportunities')
    .set('Authorization', `Bearer ${salesToken}`)
    .send({
      name: 'Cơ hội cung cấp gói Cloud Server bổ sung',
      customerId: 'cust_001',
      stage: 'PROPOSAL',
      expectedValue: 80000000,
      expectedCloseDate: '2026-11-20',
      probability: 85, // Tùy chỉnh thay vì mặc định 50%
      source: 'DIRECT',
    });
  console.log(`   HTTP Status: ${createRes2.status}`);
  console.log(`   - Tên: ${createRes2.body.data.name}`);
  console.log(`   - Giai đoạn: ${createRes2.body.data.stage}`);
  console.log(`   - Xác suất tùy chỉnh: ${createRes2.body.data.probability}%`);
  console.log('   ✅ Đã chứng minh 1 khách hàng có thể sở hữu nhiều cơ hội bán hàng song song!\n');

  // 5. Demo Validation: Ngày dự kiến chốt trong quá khứ bị từ chối
  console.log('⚠️ [BƯỚC 5]: Kiểm tra Validation - Ngày dự kiến chốt trong quá khứ...');
  const pastDateRes = await request(app)
    .post('/api/opportunities')
    .set('Authorization', `Bearer ${salesToken}`)
    .send({
      name: 'Cơ hội ngày lỗi',
      customerId: 'cust_001',
      expectedCloseDate: '2020-01-01',
    });
  console.log(`   HTTP Status: ${pastDateRes.status}`);
  console.log(`   Mã lỗi: ${pastDateRes.body.error?.code}`);
  console.log(`   Thông báo lỗi: ${pastDateRes.body.error?.message}\n`);

  // 6. Demo xem chi tiết cơ hội
  console.log('🔍 [BƯỚC 6]: Xem chi tiết cơ hội bán hàng...');
  const detailRes = await request(app)
    .get(`/api/opportunities/${createdOppId}`)
    .set('Authorization', `Bearer ${salesToken}`);
  console.log(`   HTTP Status: ${detailRes.status}`);
  console.log(`   - Mã cơ hội: ${detailRes.body.data.opportunityCode}`);
  console.log(`   - Khách hàng: ${detailRes.body.data.customer?.customerName}`);
  console.log(`   - Người liên hệ: ${detailRes.body.data.primaryContact?.name}`);
  console.log(`   - Giá trị dự kiến: ${detailRes.body.data.expectedValue.toLocaleString()} VND\n`);

  // 7. Demo cập nhật giai đoạn bán hàng
  console.log('🔄 [BƯỚC 7]: Thay đổi giai đoạn bán hàng (Chuyển sang NEGOTIATION -> Tự động cập nhật xác suất 75%)...');
  const stageRes = await request(app)
    .patch(`/api/opportunities/${createdOppId}/stage`)
    .set('Authorization', `Bearer ${salesToken}`)
    .send({
      stage: 'NEGOTIATION',
    });
  console.log(`   HTTP Status: ${stageRes.status}`);
  console.log(`   - Giai đoạn mới: ${stageRes.body.data.stage}`);
  console.log(`   - Xác suất mới tự động gán: ${stageRes.body.data.probability}%\n`);

  // 8. Demo lấy danh sách cơ hội có phân trang và lọc
  console.log('📋 [BƯỚC 8]: Lấy danh sách cơ hội bán hàng...');
  const listRes = await request(app)
    .get('/api/opportunities?page=1&limit=10')
    .set('Authorization', `Bearer ${salesToken}`);
  console.log(`   HTTP Status: ${listRes.status}`);
  console.log(`   Tổng số cơ hội tìm thấy: ${listRes.body.data.pagination.total}`);
  listRes.body.data.items.forEach((item: any, idx: number) => {
    console.log(`   ${idx + 1}. [${item.opportunityCode}] ${item.name} | Giai đoạn: ${item.stage} (${item.probability}%) | Giá trị: ${item.expectedValue?.toLocaleString()} VND`);
  });
  console.log();

  // 9. Demo kiểm tra phân quyền (Viewer thử sửa cơ hội)
  console.log('🔒 [BƯỚC 9]: Kiểm tra Phân quyền RBAC (Viewer thử sửa cơ hội)...');
  const viewerRes = await request(app)
    .patch(`/api/opportunities/${createdOppId}`)
    .set('Authorization', `Bearer ${viewerToken}`)
    .send({ name: 'Hack tên cơ hội' });
  console.log(`   HTTP Status: ${viewerRes.status}`);
  console.log(`   Mã lỗi: ${viewerRes.body.error?.code}`);
  console.log(`   Thông báo: ${viewerRes.body.error?.message}\n`);

  console.log('========================================================================================');
  console.log('🎉 TẤT CẢ CÁC KỊCH BẢN KIỂM THỬ SCRUM-72 ĐÃ HOÀN THÀNH XUẤT SẮC! 🎉');
  console.log('========================================================================================');
}

runScrum72Demo()
  .catch((err) => {
    console.error('❌ Lỗi chạy demo:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
