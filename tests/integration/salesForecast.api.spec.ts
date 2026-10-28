import request from 'supertest';
import { createApp } from '../../src/app';
import { prisma } from '../../src/config/prisma';
import { AuthService } from '../../src/modules/auth/auth.service';
import { UserRole, Permission } from '../../src/constants/permissions.constant';

describe('Sales Forecasting API - SCRUM-77 (Integration Tests)', () => {
  const app = createApp();

  let adminToken: string;
  let directorToken: string;
  let salesToken1: string;
  let salesToken2: string;
  let viewerToken: string;
  let unauthorizedToken: string;

  let testGroupNorth: any;
  let testGroupSouth: any;
  let testUserDirector: any;
  let testUserSales1: any;
  let testUserSales2: any;
  let testUserSales3: any;
  let testCustomer1: any;
  let testCustomer2: any;

  beforeAll(async () => {
    // 1. Dọn dẹp dữ liệu cũ
    await prisma.salesTarget.deleteMany();
    await prisma.opportunity.deleteMany();
    await prisma.leadActivity.deleteMany();
    await prisma.lead.deleteMany();
    await prisma.customerCareHistory.deleteMany();
    await prisma.contract.deleteMany();
    await prisma.contact.deleteMany();
    await prisma.customer.deleteMany();
    await prisma.user.deleteMany();
    await prisma.salesGroup.deleteMany();

    // 2. Tạo nhóm kinh doanh
    testGroupNorth = await prisma.salesGroup.create({
      data: {
        id: 'grp_north_test',
        groupCode: 'GRP-NORTH-TEST',
        name: 'Nhóm Kinh Doanh Miền Bắc',
      },
    });

    testGroupSouth = await prisma.salesGroup.create({
      data: {
        id: 'grp_south_test',
        groupCode: 'GRP-SOUTH-TEST',
        name: 'Nhóm Kinh Doanh Miền Nam',
      },
    });

    // 3. Tạo nhân sự
    testUserDirector = await prisma.user.create({
      data: {
        id: 'usr_director_test',
        username: 'sales_director_test',
        name: 'Giám Đốc Kinh Doanh',
        role: UserRole.SALES_DIRECTOR,
        permissions: 'CUSTOMER_CARE_VIEW,OPPORTUNITY_VIEW,OPPORTUNITY_MANAGE,FORECAST_VIEW,FORECAST_MANAGE',
      },
    });

    testUserSales1 = await prisma.user.create({
      data: {
        id: 'usr_sales_test_1',
        username: 'sales_rep_test_1',
        name: 'Nguyễn Văn Kinh Doanh 1',
        role: UserRole.SALES,
        permissions: 'CUSTOMER_CARE_VIEW,OPPORTUNITY_VIEW,OPPORTUNITY_CREATE,OPPORTUNITY_MANAGE,FORECAST_VIEW',
        groupId: testGroupNorth.id,
      },
    });

    testUserSales2 = await prisma.user.create({
      data: {
        id: 'usr_sales_test_2',
        username: 'sales_rep_test_2',
        name: 'Trần Thị Kinh Doanh 2',
        role: UserRole.SALES,
        permissions: 'CUSTOMER_CARE_VIEW,OPPORTUNITY_VIEW,OPPORTUNITY_CREATE,OPPORTUNITY_MANAGE,FORECAST_VIEW',
        groupId: testGroupNorth.id,
      },
    });

    testUserSales3 = await prisma.user.create({
      data: {
        id: 'usr_sales_test_3',
        username: 'sales_rep_test_3',
        name: 'Lê Nam Kinh Doanh 3',
        role: UserRole.SALES,
        permissions: 'CUSTOMER_CARE_VIEW,OPPORTUNITY_VIEW,OPPORTUNITY_CREATE,OPPORTUNITY_MANAGE,FORECAST_VIEW',
        groupId: testGroupSouth.id,
      },
    });

    // 4. Tạo khách hàng
    testCustomer1 = await prisma.customer.create({
      data: {
        id: 'cust_test_01',
        customerCode: 'KH-TEST-001',
        customerName: 'Công ty Alpha Tech Test',
      },
    });

    testCustomer2 = await prisma.customer.create({
      data: {
        id: 'cust_test_02',
        customerCode: 'KH-TEST-002',
        customerName: 'Tập đoàn Beta Land Test',
      },
    });

    // 5. Tạo các cơ hội bán hàng mẫu cho Tháng 10/2026
    // Deal 1 (Sales 1): PROPOSAL, 500M, 50% => 250M weighted
    await prisma.opportunity.create({
      data: {
        opportunityCode: 'OPP-T-01',
        name: 'Cơ hội phần mềm CRM Alpha',
        customerId: testCustomer1.id,
        stage: 'PROPOSAL',
        expectedValue: 500000000,
        amount: 500000000,
        probability: 50,
        expectedCloseDate: new Date('2026-10-15T00:00:00Z'),
        ownerId: testUserSales1.id,
      },
    });

    // Deal 2 (Sales 1): NEGOTIATION, 400M, 75% => 300M weighted
    await prisma.opportunity.create({
      data: {
        opportunityCode: 'OPP-T-02',
        name: 'Cơ hội dịch vụ Cloud Alpha',
        customerId: testCustomer1.id,
        stage: 'NEGOTIATION',
        expectedValue: 400000000,
        amount: 400000000,
        probability: 75,
        expectedCloseDate: new Date('2026-10-25T00:00:00Z'),
        ownerId: testUserSales1.id,
      },
    });

    // Deal 3 (Sales 1): WON, 300M, 100% => 300M actual revenue
    await prisma.opportunity.create({
      data: {
        opportunityCode: 'OPP-T-03',
        name: 'Cơ hội đã thắng Alpha',
        customerId: testCustomer1.id,
        stage: 'WON',
        expectedValue: 300000000,
        amount: 300000000,
        probability: 100,
        expectedCloseDate: new Date('2026-10-05T00:00:00Z'),
        ownerId: testUserSales1.id,
      },
    });

    // Deal 4 (Sales 1): LOST, 200M, 0% => Bị loại trừ
    await prisma.opportunity.create({
      data: {
        opportunityCode: 'OPP-T-04',
        name: 'Cơ hội bị hủy',
        customerId: testCustomer1.id,
        stage: 'LOST',
        expectedValue: 200000000,
        amount: 200000000,
        probability: 0,
        expectedCloseDate: new Date('2026-10-08T00:00:00Z'),
        ownerId: testUserSales1.id,
      },
    });

    // Deal 5 (Sales 2): NEEDS_ANALYSIS, 600M, 20% => 120M weighted
    await prisma.opportunity.create({
      data: {
        opportunityCode: 'OPP-T-05',
        name: 'Cơ hội khảo sát Beta',
        customerId: testCustomer2.id,
        stage: 'NEEDS_ANALYSIS',
        expectedValue: 600000000,
        amount: 600000000,
        probability: 20,
        expectedCloseDate: new Date('2026-10-28T00:00:00Z'),
        ownerId: testUserSales2.id,
      },
    });

    // Deal 6 (Sales 2): WON, 500M, 100% => 500M actual revenue
    await prisma.opportunity.create({
      data: {
        opportunityCode: 'OPP-T-06',
        name: 'Cơ hội chốt thành công Beta',
        customerId: testCustomer2.id,
        stage: 'WON',
        expectedValue: 500000000,
        amount: 500000000,
        probability: 100,
        expectedCloseDate: new Date('2026-10-20T00:00:00Z'),
        ownerId: testUserSales2.id,
      },
    });

    // Deal 7 (Sales 3 - Miền Nam): PROPOSAL, 760M, 50% => 380M weighted
    await prisma.opportunity.create({
      data: {
        opportunityCode: 'OPP-T-07',
        name: 'Cơ hội chi nhánh Miền Nam',
        customerId: testCustomer2.id,
        stage: 'PROPOSAL',
        expectedValue: 760000000,
        amount: 760000000,
        probability: 50,
        expectedCloseDate: new Date('2026-10-30T00:00:00Z'),
        ownerId: testUserSales3.id,
      },
    });

    // 6. Tạo chỉ tiêu doanh số cho Tháng 10/2026
    await prisma.salesTarget.createMany({
      data: [
        {
          targetValue: 1200000000,
          periodType: 'MONTH',
          year: 2026,
          month: 10,
          groupId: testGroupNorth.id,
        },
        {
          targetValue: 700000000,
          periodType: 'MONTH',
          year: 2026,
          month: 10,
          userId: testUserSales1.id,
        },
        {
          targetValue: 500000000,
          periodType: 'MONTH',
          year: 2026,
          month: 10,
          userId: testUserSales2.id,
        },
        {
          targetValue: 800000000,
          periodType: 'MONTH',
          year: 2026,
          month: 10,
          userId: testUserSales3.id,
        },
      ],
    });

    // 7. Tạo Tokens
    adminToken = AuthService.generateToken({
      id: 'usr_admin',
      username: 'admin',
      name: 'System Admin',
      role: UserRole.ADMIN,
      dataScope: 'ALL',
    });

    directorToken = AuthService.generateToken({
      id: testUserDirector.id,
      username: testUserDirector.username,
      name: testUserDirector.name,
      role: UserRole.SALES_DIRECTOR,
      dataScope: 'ALL',
    });

    salesToken1 = AuthService.generateToken({
      id: testUserSales1.id,
      username: testUserSales1.username,
      name: testUserSales1.name,
      role: UserRole.SALES,
      dataScope: 'OWN',
    });

    salesToken2 = AuthService.generateToken({
      id: testUserSales2.id,
      username: testUserSales2.username,
      name: testUserSales2.name,
      role: UserRole.SALES,
      dataScope: 'OWN',
    });

    viewerToken = AuthService.generateToken({
      id: 'usr_viewer',
      username: 'viewer',
      name: 'Viewer',
      role: UserRole.VIEWER,
      dataScope: 'ALL',
    });

    unauthorizedToken = AuthService.generateToken({
      id: 'usr_no_perm',
      username: 'no_perm',
      name: 'No Perm User',
      role: 'CUSTOM' as any,
      permissions: ['SOME_OTHER_PERMISSION'],
    });
  });

  describe('1. GET /api/sales/forecast - Tổng quan dự báo doanh số', () => {
    it('1.1 should return sales forecast matching the SCRUM-77 sample format for Director (ALL data scope)', async () => {
      const res = await request(app)
        .get('/api/sales/forecast')
        .query({ period: 'month', year: 2026, month: 10 })
        .set('Authorization', `Bearer ${directorToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const { period, summary, stageBreakdown } = res.body.data;

      // Period structure
      expect(period.type).toBe('month');
      expect(period.year).toBe(2026);
      expect(period.month).toBe(10);

      // Summary structure
      expect(summary.totalOpportunities).toBe(6); // 7 deals minus 1 LOST deal
      // Pipeline deals: Deal 1 (500M), Deal 2 (400M), Deal 5 (600M), Deal 7 (760M) = 2,260,000,000
      expect(summary.totalOpportunityValue).toBe(2260000000);
      // Weighted forecast: 250M + 300M + 120M + 380M = 1,050,000,000
      expect(summary.weightedForecast).toBe(1050000000);
      // Actual revenue: Deal 3 (300M) + Deal 6 (500M) = 800,000,000
      expect(summary.actualRevenue).toBe(800000000);
      // Projected revenue: 1,050,000,000 + 800,000,000 = 1,850,000,000
      expect(summary.projectedRevenue).toBe(1850000000);
      expect(summary.wonOpportunitiesCount).toBe(2);
      expect(summary.pipelineOpportunitiesCount).toBe(4);

      // Stage Breakdown exists and has entries
      expect(Array.isArray(stageBreakdown)).toBe(true);
      const wonStage = stageBreakdown.find((s: any) => s.stage === 'WON');
      expect(wonStage.count).toBe(2);
      expect(wonStage.totalValue).toBe(800000000);
    });

    it('1.2 should work through alias route GET /sales/forecast', async () => {
      const res = await request(app)
        .get('/sales/forecast')
        .query({ period: 'month', year: 2026, month: 10 })
        .set('Authorization', `Bearer ${directorToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.summary.weightedForecast).toBe(1050000000);
    });

    it('1.3 should filter by employeeId when passed as query parameter', async () => {
      const res = await request(app)
        .get('/api/sales/forecast')
        .query({ period: 'month', year: 2026, month: 10, employeeId: testUserSales1.id })
        .set('Authorization', `Bearer ${directorToken}`);

      expect(res.status).toBe(200);
      const { summary } = res.body.data;
      // Sales 1 has 3 valid deals (Deal 1 500M, Deal 2 400M, Deal 3 300M WON)
      expect(summary.totalOpportunities).toBe(3);
      expect(summary.totalOpportunityValue).toBe(900000000); // 500M + 400M
      expect(summary.weightedForecast).toBe(550000000); // 250M + 300M
      expect(summary.actualRevenue).toBe(300000000); // 300M WON
      expect(summary.salesTarget).toBe(700000000);
      // Achievement rate: 550M / 700M * 100 = 78.57%
      expect(summary.targetAchievementRate).toBe(78.57);
    });

    it('1.4 should restrict Sales Rep with OWN data scope to their own opportunities only', async () => {
      const res = await request(app)
        .get('/api/sales/forecast')
        .query({ period: 'month', year: 2026, month: 10 })
        .set('Authorization', `Bearer ${salesToken1}`);

      expect(res.status).toBe(200);
      const { summary } = res.body.data;
      expect(summary.totalOpportunities).toBe(3);
      expect(summary.weightedForecast).toBe(550000000);
      expect(summary.salesTarget).toBe(700000000);
    });

    it('1.5 should return 403 Forbidden when Sales Rep with OWN data scope attempts to view another employee forecast', async () => {
      const res = await request(app)
        .get('/api/sales/forecast')
        .query({ period: 'month', year: 2026, month: 10, employeeId: testUserSales2.id })
        .set('Authorization', `Bearer ${salesToken1}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });
  });

  describe('2. GET /api/sales/forecast/by-employee - Dự báo theo nhân viên', () => {
    it('2.1 should return forecast grouped by employee for Director', async () => {
      const res = await request(app)
        .get('/api/sales/forecast/by-employee')
        .query({ period: 'month', year: 2026, month: 10 })
        .set('Authorization', `Bearer ${directorToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const items = res.body.data.items;
      expect(items.length).toBeGreaterThanOrEqual(3);

      const rep1 = items.find((i: any) => i.employeeId === testUserSales1.id);
      expect(rep1).toBeDefined();
      expect(rep1.employeeName).toBe(testUserSales1.name);
      expect(rep1.weightedForecast).toBe(550000000);
      expect(rep1.actualRevenue).toBe(300000000);
      expect(rep1.salesTarget).toBe(700000000);
      expect(rep1.targetAchievementRate).toBe(78.57);

      const rep2 = items.find((i: any) => i.employeeId === testUserSales2.id);
      expect(rep2).toBeDefined();
      expect(rep2.weightedForecast).toBe(120000000);
      expect(rep2.actualRevenue).toBe(500000000);
      expect(rep2.salesTarget).toBe(500000000);
      expect(rep2.actualAchievementRate).toBe(100);
    });

    it('2.2 should return only self for user with OWN data scope', async () => {
      const res = await request(app)
        .get('/api/sales/forecast/by-employee')
        .query({ period: 'month', year: 2026, month: 10 })
        .set('Authorization', `Bearer ${salesToken1}`);

      expect(res.status).toBe(200);
      expect(res.body.data.items.length).toBe(1);
      expect(res.body.data.items[0].employeeId).toBe(testUserSales1.id);
    });
  });

  describe('3. GET /api/sales/forecast/by-group - Dự báo theo nhóm', () => {
    it('3.1 should return forecast aggregated by group for Director', async () => {
      const res = await request(app)
        .get('/api/sales/forecast/by-group')
        .query({ period: 'month', year: 2026, month: 10 })
        .set('Authorization', `Bearer ${directorToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const items = res.body.data.items;
      expect(items.length).toBe(2);

      const northGroup = items.find((g: any) => g.groupId === testGroupNorth.id);
      expect(northGroup).toBeDefined();
      expect(northGroup.groupCode).toBe(testGroupNorth.groupCode);
      // North group contains Sales 1 (550M) + Sales 2 (120M) = 670M
      expect(northGroup.weightedForecast).toBe(670000000);
      // North group actual revenue = 300M + 500M = 800M
      expect(northGroup.actualRevenue).toBe(800000000);
      expect(northGroup.salesTarget).toBe(1200000000);
      // Achievement rate: 670M / 1200M * 100 = 55.83%
      expect(northGroup.targetAchievementRate).toBe(55.83);
      expect(northGroup.memberCount).toBe(2);
    });

    it('3.2 should return 403 Forbidden when Sales Rep with OWN data scope attempts to view group forecast', async () => {
      const res = await request(app)
        .get('/api/sales/forecast/by-group')
        .query({ period: 'month', year: 2026, month: 10 })
        .set('Authorization', `Bearer ${salesToken1}`);

      expect(res.status).toBe(403);
    });
  });

  describe('4. GET /api/sales/forecast/comparison - So sánh chỉ tiêu, dự báo và thực tế', () => {
    it('4.1 should return comparison metrics, gap, status and sub-period breakdown', async () => {
      const res = await request(app)
        .get('/api/sales/forecast/comparison')
        .query({ period: 'month', year: 2026, month: 10 })
        .set('Authorization', `Bearer ${directorToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const { metrics, breakdown } = res.body.data;
      expect(metrics.salesTarget).toBeGreaterThan(0);
      expect(metrics.actualRevenue).toBe(800000000);
      expect(metrics.weightedForecast).toBe(1050000000);
      expect(metrics.projectedRevenue).toBe(1850000000);
      expect(metrics.gap).toBeDefined();
      expect(metrics.status).toBeDefined();
      expect(Array.isArray(breakdown)).toBe(true);
    });
  });

  describe('5. Target Management (POST & GET /api/sales/targets)', () => {
    it('5.1 should create a sales target successfully as Director', async () => {
      const res = await request(app)
        .post('/api/sales/targets')
        .set('Authorization', `Bearer ${directorToken}`)
        .send({
          targetValue: 650000000,
          periodType: 'MONTH',
          year: 2026,
          month: 11,
          userId: testUserSales1.id,
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.targetValue).toBe(650000000);
    });

    it('5.2 should return 403 Forbidden when standard Sales Rep attempts to set sales target', async () => {
      const res = await request(app)
        .post('/api/sales/targets')
        .set('Authorization', `Bearer ${salesToken1}`)
        .send({
          targetValue: 650000000,
          periodType: 'MONTH',
          year: 2026,
          month: 11,
          userId: testUserSales1.id,
        });

      expect(res.status).toBe(403);
    });

    it('5.3 should list sales targets using GET /api/sales/targets', async () => {
      const res = await request(app)
        .get('/api/sales/targets')
        .query({ year: 2026, periodType: 'MONTH', month: 10 })
        .set('Authorization', `Bearer ${directorToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('6. Validation & Security Checks', () => {
    it('6.1 should return 400 Bad Request when period query is invalid', async () => {
      const res = await request(app)
        .get('/api/sales/forecast')
        .query({ period: 'decade', year: 2026 })
        .set('Authorization', `Bearer ${directorToken}`);

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('6.2 should return 400 Bad Request when month query is out of range (> 12)', async () => {
      const res = await request(app)
        .get('/api/sales/forecast')
        .query({ period: 'month', year: 2026, month: 13 })
        .set('Authorization', `Bearer ${directorToken}`);

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('6.3 should return 401 Unauthorized when no authentication token is provided', async () => {
      const res = await request(app)
        .get('/api/sales/forecast')
        .query({ period: 'month', year: 2026, month: 10 });

      expect(res.status).toBe(401);
    });

    it('6.4 should return 403 Forbidden when user lacks FORECAST_VIEW permission', async () => {
      const res = await request(app)
        .get('/api/sales/forecast')
        .query({ period: 'month', year: 2026, month: 10 })
        .set('Authorization', `Bearer ${unauthorizedToken}`);

      expect(res.status).toBe(403);
    });
  });
});
