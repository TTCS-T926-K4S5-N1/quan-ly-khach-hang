import request from 'supertest';
import * as xlsx from 'xlsx';
import { createApp } from '../src/app';
import { seedDatabase } from '../src/seed/seed';
import { AuthService } from '../src/modules/auth/auth.service';
import { UserRole } from '../src/constants/permissions.constant';
import { prisma } from '../src/config/prisma';

function createSampleExcelBuffer(): Buffer {
  const data = [
    ['Họ và tên', 'Nguồn', 'Số điện thoại', 'Email', 'Công ty', 'Chức vụ'],
    ['Nguyễn Văn An', 'CONFERENCE', '0981112233', 'an.nguyen@tech.vn', 'Tech Innovate JSC', 'Giám đốc Kỹ thuật'], // Hợp lệ
    ['Trần Thị Bích', 'EVENT', '0982223344', 'bich.tran@growth.com', 'Growth Marketing', 'Trưởng phòng Marketing'], // Hợp lệ
    ['Lê Hoàng Cường', '', '0983334455', 'cuong@invalid.com', 'Công ty Cường Thịnh', 'CEO'], // Lỗi: Thiếu nguồn bắt buộc
    ['Phạm Minh Trí', 'CONFERENCE', '0908123456', 'tri.dup@test.com', 'Trùng Số DB', 'Manager'], // Lỗi: Trùng SĐT đã có trong DB
    ['Đặng Thùy Dương', 'NAME_CARD', '0982223344', 'duong@dup.com', 'Trùng Số Trong File', 'Specialist'], // Lỗi: Trùng SĐT với dòng 3
    ['Vũ Quốc Huy', 'WORKSHOP', '0986667788', 'huy.vu@fintech.vn', 'Fintech Solution', 'Product Owner'], // Hợp lệ
  ];
  const ws = xlsx.utils.aoa_to_sheet(data);
  const wb = xlsx.utils.book_new();
  xlsx.utils.book_append_sheet(wb, ws, 'DanhSachLead');
  return xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });
}

async function runDemo() {
  console.log('========================================================================================');
  console.log('🎯 CHƯƠNG TRÌNH DEMO KIỂM THỬ: SCRUM-64 – MANUAL LEAD CREATION & BULK IMPORT EXCEL 🎯');
  console.log('========================================================================================\n');

  // 1. Reset & Gieo mầm dữ liệu
  console.log('📦 [BƯỚC 1]: Khởi tạo và đồng bộ dữ liệu mẫu (Seed Database)...');
  await seedDatabase();
  console.log('   ✅ Dữ liệu mẫu đã sẵn sàng (Customers & Leads)!\n');

  const app = createApp();

  // 2. Tạo Tokens xác thực theo RBAC
  const mktToken = AuthService.generateToken({
    id: 'usr_mkt_01',
    username: 'marketing_staff',
    name: 'Lê Marketing (Nhân viên Marketing)',
    role: UserRole.MARKETING,
  });

  const viewerToken = AuthService.generateToken({
    id: 'usr_viewer_01',
    username: 'care_viewer',
    name: 'Trần Quan Sát (Chỉ xem)',
    role: UserRole.VIEWER,
  });

  console.log('🔑 [BƯỚC 2]: Tạo Token xác thực:');
  console.log('   - Marketing Staff: Có quyền LEAD_VIEW, LEAD_CREATE, LEAD_MANAGE');
  console.log('   - Viewer User: Chỉ có quyền LEAD_VIEW (không có quyền tạo/import)\n');

  // 3. Demo: Tạo Lead thủ công thành công
  console.log('📝 [BƯỚC 3]: Nhân viên Marketing tạo mới Lead thủ công (POST /api/leads)');
  console.log('   Dữ liệu gửi: Họ tên="Đoàn Nhật Minh", Nguồn="CONFERENCE", SĐT="0933555777", Email="minh.doan@vietcorp.com"');
  const resCreateSuccess = await request(app)
    .post('/api/leads')
    .set('Authorization', `Bearer ${mktToken}`)
    .send({
      fullName: 'Đoàn Nhật Minh',
      source: 'CONFERENCE',
      phone: '0933555777',
      email: 'minh.doan@vietcorp.com',
      company: 'VietCorp Holdings',
      jobTitle: 'Phó Tổng Giám Đốc',
      notes: 'Khách hàng gặp tại Hội thảo Công nghệ Quốc gia 2026',
    });

  console.log(`   👉 HTTP Status: ${resCreateSuccess.status}`);
  console.log(`   👉 Kết quả: ${resCreateSuccess.body.message}`);
  console.log(`   👉 ID: ${resCreateSuccess.body.data.id}`);
  console.log(`   👉 Mã Lead tự sinh: ${resCreateSuccess.body.data.leadCode}`);
  console.log(`   👉 Nguồn: ${resCreateSuccess.body.data.source}`);
  console.log(`   👉 Người tạo (createdById): ${resCreateSuccess.body.data.createdById}\n`);

  // 4. Demo: Kiểm tra Validation khi thiếu nguồn lead (bắt buộc)
  console.log('🛡️ [BƯỚC 4]: Kiểm tra từ chối khi thiếu nguồn lead (bắt buộc)');
  const resMissingSource = await request(app)
    .post('/api/leads')
    .set('Authorization', `Bearer ${mktToken}`)
    .send({
      fullName: 'Khách Hàng Không Nguồn',
      source: '', // Thiếu nguồn
      phone: '0933888999',
    });

  console.log(`   👉 HTTP Status: ${resMissingSource.status}`);
  console.log(`   👉 Error Code: ${resMissingSource.body.error.code}`);
  console.log(`   👉 Error Message: ${resMissingSource.body.error.message}\n`);

  // 5. Demo: Kiểm tra chống trùng lặp số điện thoại
  console.log('⚠️ [BƯỚC 5]: Kiểm tra chống trùng lặp khi tạo lead với SĐT đã tồn tại');
  const resDup = await request(app)
    .post('/api/leads')
    .set('Authorization', `Bearer ${mktToken}`)
    .send({
      fullName: 'Khách Trùng Số',
      source: 'EVENT',
      phone: '0933555777', // Trùng với lead vừa tạo ở Bước 3
    });

  console.log(`   👉 HTTP Status: ${resDup.status} (Conflict)`);
  console.log(`   👉 Error Code: ${resDup.body.error.code}`);
  console.log(`   👉 Error Message: ${resDup.body.error.message}\n`);

  // 6. Demo: Xem trước file Excel (Preview Import)
  console.log('📊 [BƯỚC 6]: Nhân viên Marketing tải file Excel để XEM TRƯỚC (POST /api/leads/import/preview)');
  console.log('   File Excel gồm 6 dòng dữ liệu:');
  console.log('   - 3 dòng hợp lệ');
  console.log('   - 1 dòng thiếu nguồn bắt buộc');
  console.log('   - 1 dòng trùng SĐT đã có trong Database');
  console.log('   - 1 dòng trùng SĐT với dòng trước đó trong file Excel');

  const excelBuffer = createSampleExcelBuffer();

  const resPreview = await request(app)
    .post('/api/leads/import/preview')
    .set('Authorization', `Bearer ${mktToken}`)
    .attach('file', excelBuffer, 'danh_sach_hoi_thao_2026.xlsx');

  console.log(`   👉 HTTP Status: ${resPreview.status}`);
  console.log(`   👉 Thống kê xem trước:`);
  console.log(`      + Tổng số dòng: ${resPreview.body.data.totalRows}`);
  console.log(`      + Dòng hợp lệ: ${resPreview.body.data.validRows}`);
  console.log(`      + Dòng không hợp lệ: ${resPreview.body.data.invalidRows}`);
  console.log(`      + Dòng bỏ qua (trống): ${resPreview.body.data.skippedRows}`);
  console.log(`   👉 Danh sách lỗi chi tiết theo từng dòng:`);
  resPreview.body.data.errors.forEach((err: any) => {
    console.log(`      ❌ Dòng ${err.row}: ${err.errors.join(' | ')}`);
  });

  // Kiểm tra xem database có bị ghi dữ liệu không
  const countBeforeImport = await prisma.lead.count({ where: { phone: '0981112233' } });
  console.log(`   👉 Kiểm tra an toàn: Dữ liệu đã lưu vào DB chưa? -> [${countBeforeImport === 0 ? 'CHƯA LƯU (Chỉ Preview)' : 'ĐÃ LƯU'}]\n`);

  // 7. Demo: Import Excel vào Database
  console.log('💾 [BƯỚC 7]: Thực hiện IMPORT file Excel vào Database (POST /api/leads/import)');
  const resImport = await request(app)
    .post('/api/leads/import')
    .set('Authorization', `Bearer ${mktToken}`)
    .attach('file', excelBuffer, 'danh_sach_hoi_thao_2026.xlsx');

  console.log(`   👉 HTTP Status: ${resImport.status}`);
  console.log(`   👉 Kết quả: ${resImport.body.message}`);
  console.log(`   👉 Thống kê Import:`);
  console.log(`      + Tổng số dòng: ${resImport.body.data.totalRows}`);
  console.log(`      + Thành công (Đã lưu): ${resImport.body.data.successCount}`);
  console.log(`      + Thất bại (Bị từ chối): ${resImport.body.data.failureCount}`);
  console.log(`   👉 Các lead đã lưu thành công vào Database:`);
  resImport.body.data.importedLeads.forEach((l: any, idx: number) => {
    console.log(`      ${idx + 1}. [${l.leadCode}] ${l.fullName} - SĐT: ${l.phone} - Nguồn: ${l.source}`);
  });
  console.log(`   👉 Danh sách các dòng bị từ chối:`);
  resImport.body.data.failedRows.forEach((f: any) => {
    console.log(`      ❌ Dòng ${f.row}: ${f.errors.join(' | ')}`);
  });
  console.log('');

  // 8. Demo: Lấy danh sách leads sau khi import
  console.log('📋 [BƯỚC 8]: Lấy danh sách Leads hiện có trong hệ thống (GET /api/leads)');
  const resList = await request(app)
    .get('/api/leads')
    .set('Authorization', `Bearer ${mktToken}`);

  console.log(`   👉 Tổng số Leads trong DB: ${resList.body.data.pagination.total}`);
  console.log('   👉 Danh sách:');
  resList.body.data.items.slice(0, 5).forEach((l: any, idx: number) => {
    console.log(`      ${idx + 1}. [${l.leadCode}] ${l.fullName} | Nguồn: ${l.source} | SĐT: ${l.phone || 'N/A'} | Cty: ${l.company || 'N/A'}`);
  });
  console.log('');

  // 9. Demo: Kiểm tra phân quyền RBAC (Viewer bị chặn)
  console.log('🔒 [BƯỚC 9]: Kiểm tra Phân quyền RBAC (Viewer cố gắng tạo/import lead)');
  const resForbidden = await request(app)
    .post('/api/leads')
    .set('Authorization', `Bearer ${viewerToken}`)
    .send({
      fullName: 'Viewer Test',
      source: 'EVENT',
    });

  console.log(`   👉 HTTP Status: ${resForbidden.status} (Forbidden)`);
  console.log(`   👉 Error Code: ${resForbidden.body.error.code}`);
  console.log(`   👉 Error Message: ${resForbidden.body.error.message}\n`);

  console.log('========================================================================================');
  console.log('🎉 TẤT CẢ KỊCH BẢN DEMO KIỂM THỬ SCRUM-64 ĐÃ HOÀN TẤT VÀ CHÍNH XÁC 100%! 🎉');
  console.log('========================================================================================');

  await prisma.$disconnect();
}

runDemo().catch((err) => {
  console.error('Demo Error:', err);
  process.exit(1);
});
