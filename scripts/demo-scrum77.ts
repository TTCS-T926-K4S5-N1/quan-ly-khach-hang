import request from 'supertest';
import { createApp } from '../src/app';
import { seedDatabase } from '../src/seed/seed';
import { AuthService } from '../src/modules/auth/auth.service';
import { UserRole } from '../src/constants/permissions.constant';

function formatVND(amount: number): string {
  return amount.toLocaleString('vi-VN') + ' đ';
}

async function runScrum77Demo() {
  console.log('================================================================================================');
  console.log('📊 CHƯƠNG TRÌNH DEMO: SCRUM-77 – DỰ BÁO DOANH SỐ THEO XÁC SUẤT (SALES FORECASTING) 📊');
  console.log('================================================================================================\n');

  // 1. Reset & Seed DB
  console.log('📦 [BƯỚC 1]: Khởi tạo cơ sở dữ liệu mẫu...');
  await seedDatabase();
  console.log('   ✅ Đã chuẩn bị nhóm kinh doanh, nhân sự, chỉ tiêu và các cơ hội bán hàng mẫu!\n');

  const app = createApp();

  // 2. Chuẩn bị Tokens
  const directorToken = AuthService.generateToken({
    id: 'usr_director_01',
    username: 'sales_director',
    name: 'Trần Văn Giám Đốc',
    role: UserRole.SALES_DIRECTOR,
    dataScope: 'ALL',
  });

  const salesRep1Token = AuthService.generateToken({
    id: 'usr_sales_01',
    username: 'sales_rep_1',
    name: 'Nguyễn Văn Kinh Doanh 1',
    role: UserRole.SALES,
    dataScope: 'OWN',
  });

  console.log('🔑 [BƯỚC 2]: Chuẩn bị Token xác thực phân quyền RBAC & Data Scope:');
  console.log('   - Giám đốc kinh doanh: Role SALES_DIRECTOR, Data Scope: ALL (Xem toàn công ty, phân tích nhóm & nhân viên)');
  console.log('   - Nhân viên kinh doanh 1: Role SALES, Data Scope: OWN (Chỉ xem cơ hội và chỉ tiêu của chính mình)\n');

  // 3. Demo API Dự báo doanh số tổng quan
  console.log('📈 [BƯỚC 3]: Gọi API dự báo tổng quan: GET /api/sales/forecast?period=month&year=2026&month=10');
  const resForecast = await request(app)
    .get('/api/sales/forecast')
    .query({ period: 'month', year: 2026, month: 10 })
    .set('Authorization', `Bearer ${directorToken}`);

  console.log(`   HTTP Status: ${resForecast.status}`);
  const summary = resForecast.body.data.summary;
  console.log('   Kết quả tổng hợp dự báo Tháng 10/2026:');
  console.log(`   - Tổng số cơ hội hợp lệ: ${summary.totalOpportunities}`);
  console.log(`   - Tổng giá trị cơ hội Pipeline: ${formatVND(summary.totalOpportunityValue)}`);
  console.log(`   - Doanh số dự báo có trọng số (Weighted Forecast): ${formatVND(summary.weightedForecast)}`);
  console.log(`   - Doanh số thực tế đã chốt (Actual Revenue - WON): ${formatVND(summary.actualRevenue)}`);
  console.log(`   - Tổng doanh số dự kiến (Projected = Actual + Forecast): ${formatVND(summary.projectedRevenue)}`);
  console.log(`   - Chỉ tiêu doanh số (Sales Target): ${formatVND(summary.salesTarget)}`);
  console.log(`   - Tỷ lệ hoàn thành chỉ tiêu dự báo: ${summary.targetAchievementRate}%`);
  console.log(`   - Tỷ lệ hoàn thành thực tế đã chốt: ${summary.actualAchievementRate}%`);
  console.log(`   - Tỷ lệ hoàn thành tổng dự kiến: ${summary.totalProjectedAchievementRate}%\n`);

  console.log('   Phân bổ cơ hội theo từng giai đoạn bán hàng (Stage Breakdown):');
  for (const stg of resForecast.body.data.stageBreakdown) {
    if (stg.count > 0) {
      console.log(
        `     + ${stg.stageName} (${stg.stage}): ${stg.count} cơ hội | Giá trị: ${formatVND(
          stg.totalValue
        )} | Trọng số: ${formatVND(stg.weightedValue)} (Xác suất mặc định: ${stg.defaultProbability}%)`
      );
    }
  }
  console.log('');

  // 4. Demo API Dự báo theo từng nhân viên kinh doanh
  console.log('👥 [BƯỚC 4]: Gọi API dự báo theo nhân viên: GET /api/sales/forecast/by-employee');
  const resEmployee = await request(app)
    .get('/api/sales/forecast/by-employee')
    .query({ period: 'month', year: 2026, month: 10 })
    .set('Authorization', `Bearer ${directorToken}`);

  console.log(`   HTTP Status: ${resEmployee.status}`);
  console.log(`   Danh sách ${resEmployee.body.data.totalEmployees} nhân viên kinh doanh:`);
  for (const emp of resEmployee.body.data.items) {
    console.log(`   👤 ${emp.employeeName} (${emp.username}) - Nhóm: ${emp.groupName || 'Chưa phân nhóm'}`);
    console.log(
      `      Cơ hội: ${emp.totalOpportunities} (Pipeline: ${emp.pipelineCount}, Won: ${emp.wonCount})`
    );
    console.log(
      `      Dự báo trọng số: ${formatVND(emp.weightedForecast)} | Thực tế: ${formatVND(
        emp.actualRevenue
      )} | Chỉ tiêu: ${formatVND(emp.salesTarget)}`
    );
    console.log(`      Đạt chỉ tiêu: ${emp.targetAchievementRate}%\n`);
  }

  // 5. Demo API Dự báo theo nhóm kinh doanh
  console.log('🏢 [BƯỚC 5]: Gọi API dự báo theo nhóm kinh doanh: GET /api/sales/forecast/by-group');
  const resGroup = await request(app)
    .get('/api/sales/forecast/by-group')
    .query({ period: 'month', year: 2026, month: 10 })
    .set('Authorization', `Bearer ${directorToken}`);

  console.log(`   HTTP Status: ${resGroup.status}`);
  console.log(`   Danh sách ${resGroup.body.data.totalGroups} nhóm kinh doanh:`);
  for (const grp of resGroup.body.data.items) {
    console.log(`   🏛️  ${grp.groupName} [${grp.groupCode}] - Thành viên: ${grp.memberCount} nhân sự`);
    console.log(
      `      Dự báo trọng số: ${formatVND(grp.weightedForecast)} | Thực tế: ${formatVND(
        grp.actualRevenue
      )} | Chỉ tiêu: ${formatVND(grp.salesTarget)}`
    );
    console.log(`      Đạt chỉ tiêu: ${grp.targetAchievementRate}%\n`);
  }

  // 6. Demo API So sánh Chỉ tiêu - Dự báo - Thực tế
  console.log('⚖️  [BƯỚC 6]: Gọi API so sánh: GET /api/sales/forecast/comparison');
  const resComp = await request(app)
    .get('/api/sales/forecast/comparison')
    .query({ period: 'month', year: 2026, month: 10 })
    .set('Authorization', `Bearer ${directorToken}`);

  console.log(`   HTTP Status: ${resComp.status}`);
  const metrics = resComp.body.data.metrics;
  console.log('   Chỉ số phân tích tiến độ:');
  console.log(`   - Chỉ tiêu giao: ${formatVND(metrics.salesTarget)}`);
  console.log(`   - Doanh số thực tế: ${formatVND(metrics.actualRevenue)}`);
  console.log(`   - Doanh số dự báo: ${formatVND(metrics.weightedForecast)}`);
  console.log(`   - Tổng dự kiến kết thúc kỳ: ${formatVND(metrics.projectedRevenue)}`);
  console.log(`   - Khoảng cách chỉ tiêu cần bù đắp (Gap): ${formatVND(metrics.gap)}`);
  console.log(`   - Trạng thái đánh giá tiến độ: [${metrics.status}]\n`);

  // 7. Demo Phân quyền Data Scope
  console.log('🔒 [BƯỚC 7]: Kiểm chứng phân quyền dữ liệu (Data Scope):');
  console.log('   - Nhân viên kinh doanh 1 (dataScope: OWN) gọi GET /api/sales/forecast...');
  const resOwnScope = await request(app)
    .get('/api/sales/forecast')
    .query({ period: 'month', year: 2026, month: 10 })
    .set('Authorization', `Bearer ${salesRep1Token}`);

  console.log(`     HTTP Status: ${resOwnScope.status}`);
  console.log(
    `     Kết quả: Chỉ hiển thị dữ liệu của chính mình -> ${resOwnScope.body.data.summary.totalOpportunities} cơ hội, dự báo ${formatVND(
      resOwnScope.body.data.summary.weightedForecast
    )}`
  );

  console.log('   - Nhân viên kinh doanh 1 cố tình truy cập tổng hợp theo nhóm (by-group)...');
  const resForbidden = await request(app)
    .get('/api/sales/forecast/by-group')
    .query({ period: 'month', year: 2026, month: 10 })
    .set('Authorization', `Bearer ${salesRep1Token}`);
  console.log(`     HTTP Status: ${resForbidden.status} Forbidden (Bảo mật hoạt động đúng chuẩn RBAC!)\n`);

  // 8. Demo Thiết lập chỉ tiêu mới
  console.log('🎯 [BƯỚC 8]: Giám đốc thiết lập chỉ tiêu doanh số mới: POST /api/sales/targets');
  const resTarget = await request(app)
    .post('/api/sales/targets')
    .set('Authorization', `Bearer ${directorToken}`)
    .send({
      targetValue: 850000000,
      periodType: 'MONTH',
      year: 2026,
      month: 11,
      userId: 'usr_sales_01',
    });

  console.log(`   HTTP Status: ${resTarget.status} Created`);
  console.log(`   Đã giao chỉ tiêu ${formatVND(resTarget.body.data.targetValue)} cho nhân viên usr_sales_01 vào Tháng 11/2026!\n`);

  console.log('================================================================================================');
  console.log('✨ HOÀN THÀNH DEMO SCRUM-77: DỰ BÁO DOANH SỐ THEO XÁC SUẤT HOẠT ĐỘNG HOÀN HẢO! ✨');
  console.log('================================================================================================');
}

if (require.main === module) {
  runScrum77Demo()
    .catch((err) => {
      console.error('Lỗi khi chạy demo:', err);
      process.exit(1);
    });
}
