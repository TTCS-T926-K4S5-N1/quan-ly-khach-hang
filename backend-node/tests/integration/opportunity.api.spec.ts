import request from 'supertest';
import { createApp } from '../../src/app';
import { prisma } from '../../src/config/prisma';
import { AuthService } from '../../src/modules/auth/auth.service';
import { UserRole } from '../../src/constants/permissions.constant';
import { OpportunityStage } from '../../src/constants/opportunity.constant';

describe('Sales Opportunity API - SCRUM-72 (Integration Tests)', () => {
  const app = createApp();

  let adminToken: string;
  let salesToken1: string;
  let salesToken2: string;
  let viewerToken: string;

  let testCustomer1: any;
  let testCustomer2: any;
  let testContact1: any;
  let testContact2: any;

  beforeAll(async () => {
    adminToken = AuthService.generateToken({
      id: 'usr_admin_01',
      username: 'admin_user',
      name: 'System Admin',
      role: UserRole.ADMIN,
      dataScope: 'ALL',
    });

    salesToken1 = AuthService.generateToken({
      id: 'usr_sales_01',
      username: 'sales_rep_1',
      name: 'Sales Rep 1',
      role: UserRole.SALES,
      dataScope: 'OWN',
    });

    salesToken2 = AuthService.generateToken({
      id: 'usr_sales_02',
      username: 'sales_rep_2',
      name: 'Sales Rep 2',
      role: UserRole.SALES,
      dataScope: 'OWN',
    });

    viewerToken = AuthService.generateToken({
      id: 'usr_viewer_01',
      username: 'viewer_user',
      name: 'Viewer User',
      role: UserRole.VIEWER,
      dataScope: 'ALL',
    });
  });

  beforeEach(async () => {
    // Clean tables before each test
    await prisma.leadActivity.deleteMany();
    await prisma.lead.deleteMany();
    await prisma.opportunity.deleteMany();
    await prisma.contact.deleteMany();
    await prisma.customerCareHistory.deleteMany();
    await prisma.contract.deleteMany();
    await prisma.customer.deleteMany();

    // Create test customer 1
    testCustomer1 = await prisma.customer.create({
      data: {
        customerCode: 'KH-TEST-001',
        customerName: 'Tập đoàn Công nghệ SunTech',
        phone: '0901111222',
        email: 'contact@suntech.vn',
        address: 'Quận 1, TP. Hồ Chí Minh',
      },
    });

    // Create test customer 2
    testCustomer2 = await prisma.customer.create({
      data: {
        customerCode: 'KH-TEST-002',
        customerName: 'Công ty Cổ phần Alpha Global',
        phone: '0903333444',
        email: 'info@alphaglobal.com',
        address: 'Cầu Giấy, Hà Nội',
      },
    });

    // Create contact for customer 1
    testContact1 = await prisma.contact.create({
      data: {
        contactCode: 'CT-TEST-001',
        customerId: testCustomer1.id,
        name: 'Trần Văn Nam',
        phone: '0988111222',
        email: 'nam.tran@suntech.vn',
        jobTitle: 'Giám đốc Công nghệ (CTO)',
        isPrimary: true,
      },
    });

    // Create contact for customer 2
    testContact2 = await prisma.contact.create({
      data: {
        contactCode: 'CT-TEST-002',
        customerId: testCustomer2.id,
        name: 'Lê Thị Thu',
        phone: '0977222333',
        email: 'thu.le@alphaglobal.com',
        jobTitle: 'Trưởng phòng Mua sắm',
        isPrimary: true,
      },
    });
  });

  afterAll(async () => {
    await prisma.leadActivity.deleteMany();
    await prisma.lead.deleteMany();
    await prisma.opportunity.deleteMany();
    await prisma.contact.deleteMany();
    await prisma.customerCareHistory.deleteMany();
    await prisma.contract.deleteMany();
    await prisma.customer.deleteMany();
    await prisma.$disconnect();
  });

  describe('POST /api/opportunities & POST /opportunities', () => {
    it('1. should create an opportunity successfully with valid data and default probability (QUALIFICATION -> 10%)', async () => {
      const res = await request(app)
        .post('/api/opportunities')
        .set('Authorization', `Bearer ${salesToken1}`)
        .send({
          name: 'Cơ hội cung cấp phần mềm CRM',
          customerId: testCustomer1.id,
          primaryContactId: testContact1.id,
          stage: 'QUALIFICATION',
          expectedValue: 50000000,
          expectedCloseDate: '2026-12-15',
          source: 'WEBSITE',
          notes: 'Khách hàng đang tìm hiểu giải pháp',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeDefined();
      expect(res.body.data.name).toBe('Cơ hội cung cấp phần mềm CRM');
      expect(res.body.data.customerId).toBe(testCustomer1.id);
      expect(res.body.data.primaryContactId).toBe(testContact1.id);
      expect(res.body.data.stage).toBe('QUALIFICATION');
      expect(res.body.data.probability).toBe(10); // Default for QUALIFICATION
      expect(res.body.data.expectedValue).toBe(50000000);
      expect(res.body.data.source).toBe('WEBSITE');
      expect(res.body.data.customer).toBeDefined();
      expect(res.body.data.customer.customerName).toBe('Tập đoàn Công nghệ SunTech');
      expect(res.body.data.primaryContact).toBeDefined();
      expect(res.body.data.primaryContact.name).toBe('Trần Văn Nam');
      expect(res.body.data.opportunityCode).toMatch(/^OPP-\d{4}-\d+/);
    });

    it('2. should also work via alias route POST /opportunities', async () => {
      const res = await request(app)
        .post('/opportunities')
        .set('Authorization', `Bearer ${salesToken1}`)
        .send({
          name: 'Triển khai hạ tầng Cloud',
          customerId: testCustomer1.id,
          expectedCloseDate: '2026-11-30',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('Triển khai hạ tầng Cloud');
    });

    it('3. should create opportunity with custom probability override (e.g. 85%)', async () => {
      const res = await request(app)
        .post('/api/opportunities')
        .set('Authorization', `Bearer ${salesToken1}`)
        .send({
          name: 'Hợp đồng ERP Doanh nghiệp',
          customerId: testCustomer1.id,
          stage: 'PROPOSAL',
          expectedValue: 200000000,
          expectedCloseDate: '2026-12-31',
          probability: 85, // Custom probability instead of default 50
        });

      expect(res.status).toBe(201);
      expect(res.body.data.stage).toBe('PROPOSAL');
      expect(res.body.data.probability).toBe(85);
    });

    it('4. should return 400 when mandatory name is missing or empty', async () => {
      const res = await request(app)
        .post('/api/opportunities')
        .set('Authorization', `Bearer ${salesToken1}`)
        .send({
          name: '   ',
          customerId: testCustomer1.id,
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('5. should return 400 when mandatory customerId is missing or empty', async () => {
      const res = await request(app)
        .post('/api/opportunities')
        .set('Authorization', `Bearer ${salesToken1}`)
        .send({
          name: 'Hợp đồng bảo trì',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('6. should return 404 when customerId does not exist in database', async () => {
      const res = await request(app)
        .post('/api/opportunities')
        .set('Authorization', `Bearer ${salesToken1}`)
        .send({
          name: 'Cơ hội phần mềm',
          customerId: 'non_existent_customer_id',
        });

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('NOT_FOUND');
    });

    it('7. should return 404 when primaryContactId does not exist in database', async () => {
      const res = await request(app)
        .post('/api/opportunities')
        .set('Authorization', `Bearer ${salesToken1}`)
        .send({
          name: 'Cơ hội phần mềm',
          customerId: testCustomer1.id,
          primaryContactId: 'non_existent_contact_id',
        });

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('NOT_FOUND');
    });

    it('8. should return 400 when primaryContact does not belong to the chosen customer', async () => {
      // testContact2 belongs to testCustomer2, but we assign to testCustomer1!
      const res = await request(app)
        .post('/api/opportunities')
        .set('Authorization', `Bearer ${salesToken1}`)
        .send({
          name: 'Cơ hội kiểm thử sai liên hệ',
          customerId: testCustomer1.id,
          primaryContactId: testContact2.id, // Belonging to Customer 2!
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toContain('không thuộc khách hàng');
    });

    it('9. should return 400 when expectedCloseDate is in the past', async () => {
      const res = await request(app)
        .post('/api/opportunities')
        .set('Authorization', `Bearer ${salesToken1}`)
        .send({
          name: 'Cơ hội ngày quá khứ',
          customerId: testCustomer1.id,
          expectedCloseDate: '2020-01-01', // In the past!
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
      expect(res.body.error.message).toContain('không được nằm trong quá khứ');
    });

    it('10. should allow expectedCloseDate for today or in the future', async () => {
      const today = new Date().toISOString().split('T')[0];
      const res = await request(app)
        .post('/api/opportunities')
        .set('Authorization', `Bearer ${salesToken1}`)
        .send({
          name: 'Cơ hội chốt ngay hôm nay',
          customerId: testCustomer1.id,
          expectedCloseDate: today,
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
    });

    it('11. should return 400 when probability is negative or greater than 100', async () => {
      const resNegative = await request(app)
        .post('/api/opportunities')
        .set('Authorization', `Bearer ${salesToken1}`)
        .send({
          name: 'Cơ hội âm',
          customerId: testCustomer1.id,
          probability: -5,
        });

      expect(resNegative.status).toBe(400);

      const resOver100 = await request(app)
        .post('/api/opportunities')
        .set('Authorization', `Bearer ${salesToken1}`)
        .send({
          name: 'Cơ hội hơn 100',
          customerId: testCustomer1.id,
          probability: 105,
        });

      expect(resOver100.status).toBe(400);
    });

    it('12. should allow one customer to have multiple parallel opportunities', async () => {
      const res1 = await request(app)
        .post('/api/opportunities')
        .set('Authorization', `Bearer ${salesToken1}`)
        .send({
          name: 'Cơ hội số 1 của SunTech - CRM',
          customerId: testCustomer1.id,
          expectedValue: 30000000,
        });

      const res2 = await request(app)
        .post('/api/opportunities')
        .set('Authorization', `Bearer ${salesToken1}`)
        .send({
          name: 'Cơ hội số 2 của SunTech - ERP',
          customerId: testCustomer1.id,
          expectedValue: 80000000,
        });

      expect(res1.status).toBe(201);
      expect(res2.status).toBe(201);
      expect(res1.body.data.id).not.toBe(res2.body.data.id);
      expect(res1.body.data.customerId).toBe(testCustomer1.id);
      expect(res2.body.data.customerId).toBe(testCustomer1.id);

      // Verify in DB
      const count = await prisma.opportunity.count({
        where: { customerId: testCustomer1.id },
      });
      expect(count).toBe(2);
    });

    it('13. should return 401 when request is unauthenticated', async () => {
      const res = await request(app)
        .post('/api/opportunities')
        .send({
          name: 'Không có token',
          customerId: testCustomer1.id,
        });

      expect(res.status).toBe(401);
    });

    it('14. should return 403 Forbidden when user lacks OPPORTUNITY_CREATE permission (e.g. VIEWER)', async () => {
      const res = await request(app)
        .post('/api/opportunities')
        .set('Authorization', `Bearer ${viewerToken}`)
        .send({
          name: 'Viewer tạo cơ hội',
          customerId: testCustomer1.id,
        });

      expect(res.status).toBe(403);
    });
  });

  describe('GET /api/opportunities', () => {
    beforeEach(async () => {
      // Seed 3 opportunities
      await prisma.opportunity.create({
        data: {
          opportunityCode: 'OPP-2026-000101',
          name: 'Dự án Core Banking',
          customerId: testCustomer1.id,
          contactId: testContact1.id,
          stage: 'QUALIFICATION',
          amount: 500000000,
          expectedValue: 500000000,
          probability: 10,
          source: 'CONFERENCE',
          ownerId: 'usr_sales_01',
        },
      });

      await prisma.opportunity.create({
        data: {
          opportunityCode: 'OPP-2026-000102',
          name: 'Dự án Triển khai AI Chatbot',
          customerId: testCustomer1.id,
          contactId: testContact1.id,
          stage: 'NEGOTIATION',
          amount: 80000000,
          expectedValue: 80000000,
          probability: 75,
          source: 'WEBSITE',
          ownerId: 'usr_sales_01',
        },
      });

      await prisma.opportunity.create({
        data: {
          opportunityCode: 'OPP-2026-000103',
          name: 'Dự án Cung cấp Server Alpha',
          customerId: testCustomer2.id,
          contactId: testContact2.id,
          stage: 'PROPOSAL',
          amount: 120000000,
          expectedValue: 120000000,
          probability: 50,
          source: 'REFERRAL',
          ownerId: 'usr_sales_02',
        },
      });
    });

    it('1. should list opportunities with pagination', async () => {
      const res = await request(app)
        .get('/api/opportunities?page=1&limit=2')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.items.length).toBe(2);
      expect(res.body.data.pagination.total).toBe(3);
      expect(res.body.data.pagination.totalPages).toBe(2);
    });

    it('2. should search opportunities by name keyword', async () => {
      const res = await request(app)
        .get('/api/opportunities?search=Banking')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.items.length).toBe(1);
      expect(res.body.data.items[0].name).toContain('Core Banking');
    });

    it('3. should filter opportunities by stage', async () => {
      const res = await request(app)
        .get('/api/opportunities?stage=NEGOTIATION')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.items.length).toBe(1);
      expect(res.body.data.items[0].stage).toBe('NEGOTIATION');
    });

    it('4. should filter opportunities by customerId', async () => {
      const res = await request(app)
        .get(`/api/opportunities?customerId=${testCustomer2.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.items.length).toBe(1);
      expect(res.body.data.items[0].customerId).toBe(testCustomer2.id);
    });

    it('5. should respect OWN dataScope and only return records owned by user', async () => {
      // Sales Rep 1 has dataScope: OWN
      const res = await request(app)
        .get('/api/opportunities')
        .set('Authorization', `Bearer ${salesToken1}`);

      expect(res.status).toBe(200);
      expect(res.body.data.items.length).toBe(2); // Owns 2 out of 3
      res.body.data.items.forEach((item: any) => {
        expect(item.ownerId).toBe('usr_sales_01');
      });
    });
  });

  describe('GET /api/opportunities/:id', () => {
    let sampleOpp: any;

    beforeEach(async () => {
      sampleOpp = await prisma.opportunity.create({
        data: {
          opportunityCode: 'OPP-2026-DETAIL',
          name: 'Cơ hội xem chi tiết',
          customerId: testCustomer1.id,
          contactId: testContact1.id,
          stage: 'PROPOSAL',
          amount: 60000000,
          expectedValue: 60000000,
          probability: 50,
          source: 'DIRECT',
          ownerId: 'usr_sales_01',
        },
      });
    });

    it('1. should return full opportunity details including customer and primaryContact', async () => {
      const res = await request(app)
        .get(`/api/opportunities/${sampleOpp.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(sampleOpp.id);
      expect(res.body.data.name).toBe('Cơ hội xem chi tiết');
      expect(res.body.data.customer.id).toBe(testCustomer1.id);
      expect(res.body.data.primaryContact.id).toBe(testContact1.id);
      expect(res.body.data.probability).toBe(50);
    });

    it('2. should return 404 when opportunity ID does not exist', async () => {
      const res = await request(app)
        .get('/api/opportunities/non_existent_id')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });

    it('3. should return 403 when user with OWN dataScope tries to access another user opportunity', async () => {
      const res = await request(app)
        .get(`/api/opportunities/${sampleOpp.id}`)
        .set('Authorization', `Bearer ${salesToken2}`); // Owned by sales 1!

      expect(res.status).toBe(403);
    });
  });

  describe('PATCH /api/opportunities/:id', () => {
    let sampleOpp: any;

    beforeEach(async () => {
      sampleOpp = await prisma.opportunity.create({
        data: {
          opportunityCode: 'OPP-2026-UPDATE',
          name: 'Cơ hội cần cập nhật',
          customerId: testCustomer1.id,
          stage: 'QUALIFICATION',
          amount: 40000000,
          expectedValue: 40000000,
          probability: 10,
          ownerId: 'usr_sales_01',
        },
      });
    });

    it('1. should update opportunity fields successfully', async () => {
      const res = await request(app)
        .patch(`/api/opportunities/${sampleOpp.id}`)
        .set('Authorization', `Bearer ${salesToken1}`)
        .send({
          name: 'Cơ hội đã cập nhật thành công',
          expectedValue: 95000000,
          notes: 'Đã đàm phán lại mức giá mới',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('Cơ hội đã cập nhật thành công');
      expect(res.body.data.expectedValue).toBe(95000000);
      expect(res.body.data.notes).toBe('Đã đàm phán lại mức giá mới');
    });

    it('2. should automatically update probability to stage default when stage changes without explicit probability', async () => {
      const res = await request(app)
        .patch(`/api/opportunities/${sampleOpp.id}`)
        .set('Authorization', `Bearer ${salesToken1}`)
        .send({
          stage: 'NEGOTIATION', // Default for NEGOTIATION is 75
        });

      expect(res.status).toBe(200);
      expect(res.body.data.stage).toBe('NEGOTIATION');
      expect(res.body.data.probability).toBe(75);
    });

    it('3. should preserve custom probability when explicitly provided along with stage', async () => {
      const res = await request(app)
        .patch(`/api/opportunities/${sampleOpp.id}`)
        .set('Authorization', `Bearer ${salesToken1}`)
        .send({
          stage: 'NEGOTIATION',
          probability: 90, // Custom probability
        });

      expect(res.status).toBe(200);
      expect(res.body.data.stage).toBe('NEGOTIATION');
      expect(res.body.data.probability).toBe(90);
    });

    it('4. should return 404 when updating non-existent opportunity', async () => {
      const res = await request(app)
        .patch('/api/opportunities/non_existent_id')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Thử cập nhật' });

      expect(res.status).toBe(404);
    });

    it('5. should return 403 when user lacks OPPORTUNITY_MANAGE permission (e.g. VIEWER)', async () => {
      const res = await request(app)
        .patch(`/api/opportunities/${sampleOpp.id}`)
        .set('Authorization', `Bearer ${viewerToken}`)
        .send({ name: 'Viewer sửa' });

      expect(res.status).toBe(403);
    });
  });

  describe('PATCH /api/opportunities/:id/stage', () => {
    let sampleOpp: any;

    beforeEach(async () => {
      sampleOpp = await prisma.opportunity.create({
        data: {
          opportunityCode: 'OPP-2026-STAGE',
          name: 'Cơ hội chuyển đổi giai đoạn',
          customerId: testCustomer1.id,
          stage: 'QUALIFICATION',
          probability: 10,
          ownerId: 'usr_sales_01',
        },
      });
    });

    it('1. should update stage and automatically set probability to stage default (e.g. WON -> 100%)', async () => {
      const res = await request(app)
        .patch(`/api/opportunities/${sampleOpp.id}/stage`)
        .set('Authorization', `Bearer ${salesToken1}`)
        .send({
          stage: 'WON',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.stage).toBe('WON');
      expect(res.body.data.probability).toBe(100);
    });

    it('2. should update stage to LOST and set probability to 0%', async () => {
      const res = await request(app)
        .patch(`/api/opportunities/${sampleOpp.id}/stage`)
        .set('Authorization', `Bearer ${salesToken1}`)
        .send({
          stage: 'LOST',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.stage).toBe('LOST');
      expect(res.body.data.probability).toBe(0);
    });

    it('3. should update stage with custom probability override', async () => {
      const res = await request(app)
        .patch(`/api/opportunities/${sampleOpp.id}/stage`)
        .set('Authorization', `Bearer ${salesToken1}`)
        .send({
          stage: 'PROPOSAL',
          probability: 65, // Custom instead of 50
        });

      expect(res.status).toBe(200);
      expect(res.body.data.stage).toBe('PROPOSAL');
      expect(res.body.data.probability).toBe(65);
    });

    it('4. should return 400 when stage is invalid', async () => {
      const res = await request(app)
        .patch(`/api/opportunities/${sampleOpp.id}/stage`)
        .set('Authorization', `Bearer ${salesToken1}`)
        .send({
          stage: 'UNKNOWN_STAGE',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('5. should return 404 when opportunity ID does not exist', async () => {
      const res = await request(app)
        .patch('/api/opportunities/non_existent_id/stage')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          stage: 'WON',
        });

      expect(res.status).toBe(404);
    });
  });
});
