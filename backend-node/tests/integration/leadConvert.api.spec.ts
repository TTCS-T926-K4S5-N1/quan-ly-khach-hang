import request from 'supertest';
import { createApp } from '../../src/app';
import { prisma } from '../../src/config/prisma';
import { AuthService } from '../../src/modules/auth/auth.service';
import { UserRole } from '../../src/constants/permissions.constant';

describe('Lead Conversion API - SCRUM-70 (Integration Tests)', () => {
  const app = createApp();

  let adminToken: string;
  let salesToken1: string;
  let salesToken2: string;
  let viewerToken: string;

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
    await prisma.opportunity.deleteMany();
    await prisma.contact.deleteMany();
    await prisma.customerCareHistory.deleteMany();
    await prisma.contract.deleteMany();
    await prisma.customer.deleteMany();
    await prisma.lead.deleteMany();
  });

  afterAll(async () => {
    await prisma.leadActivity.deleteMany();
    await prisma.opportunity.deleteMany();
    await prisma.contact.deleteMany();
    await prisma.customerCareHistory.deleteMany();
    await prisma.contract.deleteMany();
    await prisma.customer.deleteMany();
    await prisma.lead.deleteMany();
    await prisma.$disconnect();
  });

  describe('POST /api/leads/:id/convert & POST /leads/:id/convert', () => {
    it('1, 2, 3, 13. should convert a valid lead to Customer, Contact, Opportunity and return structured response', async () => {
      // Create a lead
      const lead = await prisma.lead.create({
        data: {
          leadCode: 'LEAD-2026-1001',
          fullName: 'Nguyễn Văn Minh',
          phone: '0901234567',
          email: 'minh.nguyen@vinatech.vn',
          company: 'Công ty Cổ phần VinaTech',
          jobTitle: 'Phó Tổng Giám Đốc',
          address: 'Tầng 10, Tòa nhà Landmark, Hà Nội',
          source: 'CONFERENCE',
          status: 'QUALIFIED',
          notes: 'Nhu cầu triển khai CRM trong Q4 2026',
          createdById: 'usr_sales_01',
        },
      });

      const res = await request(app)
        .post(`/api/leads/${lead.id}/convert`)
        .set('Authorization', `Bearer ${salesToken1}`)
        .send({
          opportunityAmount: 150000000,
          opportunityStage: 'QUALIFICATION',
          notes: 'Khách hàng yêu cầu gửi báo giá chi tiết trước thứ Sáu',
        });

      // Verify HTTP response
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Lead converted successfully');

      const data = res.body.data;
      expect(data.leadId).toBe(lead.id);
      expect(data.status).toBe('CONVERTED');

      // Verify Customer data
      expect(data.customer).toBeDefined();
      expect(data.customer.id).toBeDefined();
      expect(data.customer.name).toBe('Công ty Cổ phần VinaTech');
      expect(data.customer.customerCode).toMatch(/^CUST-/);
      expect(data.customer.phone).toBe('0901234567');
      expect(data.customer.email).toBe('minh.nguyen@vinatech.vn');

      // Verify Contact data
      expect(data.contact).toBeDefined();
      expect(data.contact.id).toBeDefined();
      expect(data.contact.name).toBe('Nguyễn Văn Minh');
      expect(data.contact.email).toBe('minh.nguyen@vinatech.vn');
      expect(data.contact.phone).toBe('0901234567');
      expect(data.contact.jobTitle).toBe('Phó Tổng Giám Đốc');

      // Verify Opportunity data
      expect(data.opportunity).toBeDefined();
      expect(data.opportunity.id).toBeDefined();
      expect(data.opportunity.name).toBe('Cơ hội bán hàng - Công ty Cổ phần VinaTech');
      expect(data.opportunity.status).toBe('QUALIFICATION');
      expect(data.opportunity.amount).toBe(150000000);

      // Verify database state and relationships
      const dbLead = await prisma.lead.findUnique({
        where: { id: lead.id },
      });
      expect(dbLead?.status).toBe('CONVERTED');
      expect(dbLead?.convertedAt).not.toBeNull();
      expect(dbLead?.convertedCustomerId).toBe(data.customer.id);
      expect(dbLead?.convertedContactId).toBe(data.contact.id);
      expect(dbLead?.convertedOpportunityId).toBe(data.opportunity.id);

      const dbCustomer = await prisma.customer.findUnique({
        where: { id: data.customer.id },
      });
      expect(dbCustomer).not.toBeNull();
      expect(dbCustomer?.customerName).toBe('Công ty Cổ phần VinaTech');

      const dbContact = await prisma.contact.findUnique({
        where: { id: data.contact.id },
      });
      expect(dbContact).not.toBeNull();
      expect(dbContact?.customerId).toBe(data.customer.id);
      expect(dbContact?.name).toBe('Nguyễn Văn Minh');

      const dbOpportunity = await prisma.opportunity.findUnique({
        where: { id: data.opportunity.id },
      });
      expect(dbOpportunity).not.toBeNull();
      expect(dbOpportunity?.customerId).toBe(data.customer.id);
      expect(dbOpportunity?.contactId).toBe(data.contact.id);
      expect(dbOpportunity?.amount).toBe(150000000);

      // Verify CustomerCareHistory recorded
      const careHistories = await prisma.customerCareHistory.findMany({
        where: { customerId: data.customer.id },
      });
      expect(careHistories.length).toBeGreaterThanOrEqual(1);
      expect(careHistories[0].channel).toBe('LEAD_CONVERSION');

      // Verify LeadActivity recorded
      const activities = await prisma.leadActivity.findMany({
        where: { leadId: lead.id },
      });
      expect(activities.length).toBeGreaterThanOrEqual(1);
      expect(activities[0].action).toBe('CONVERTED');
    });

    it('2. should also work via alias route POST /leads/:id/convert', async () => {
      const lead = await prisma.lead.create({
        data: {
          leadCode: 'LEAD-ALIAS-1',
          fullName: 'Trần Bảo Anh',
          source: 'WEBSITE',
          company: 'Bảo Anh Corp',
          createdById: 'usr_admin_01',
        },
      });

      const res = await request(app)
        .post(`/leads/${lead.id}/convert`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send();

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('CONVERTED');
      expect(res.body.data.customer.name).toBe('Bảo Anh Corp');
    });

    it('3. should use lead.fullName as Customer name when lead has no company', async () => {
      const lead = await prisma.lead.create({
        data: {
          fullName: 'Đặng Tuấn Kiệt',
          source: 'DIRECT_CALL',
          phone: '0988776655',
          company: null, // No company provided
          createdById: 'usr_admin_01',
        },
      });

      const res = await request(app)
        .post(`/api/leads/${lead.id}/convert`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send();

      expect(res.status).toBe(200);
      expect(res.body.data.customer.name).toBe('Đặng Tuấn Kiệt');
      expect(res.body.data.contact.name).toBe('Đặng Tuấn Kiệt');
    });

    it('4. should return 404 when lead does not exist', async () => {
      const res = await request(app)
        .post('/api/leads/non-existent-uuid/convert')
        .set('Authorization', `Bearer ${adminToken}`)
        .send();

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('NOT_FOUND');
    });

    it('5. should return 400 when lead has already been converted', async () => {
      const lead = await prisma.lead.create({
        data: {
          fullName: 'Vũ Thị Hạnh',
          source: 'EVENT',
          status: 'CONVERTED',
          convertedAt: new Date(),
          createdById: 'usr_admin_01',
        },
      });

      const res = await request(app)
        .post(`/api/leads/${lead.id}/convert`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send();

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toMatch(/đã được chuyển đổi trước đó/);
    });

    it('6. should return 400 when lead is unqualified (DISQUALIFIED / REJECTED / LOST)', async () => {
      const lead = await prisma.lead.create({
        data: {
          fullName: 'Hoàng Văn Bách',
          source: 'WEBSITE',
          status: 'DISQUALIFIED',
          createdById: 'usr_admin_01',
        },
      });

      const res = await request(app)
        .post(`/api/leads/${lead.id}/convert`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send();

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toMatch(/không đủ điều kiện để chuyển đổi/);
    });

    it('7. should return 401 when request is unauthenticated', async () => {
      const lead = await prisma.lead.create({
        data: {
          fullName: 'Khách Hàng Test',
          source: 'OTHER',
        },
      });

      const res = await request(app)
        .post(`/api/leads/${lead.id}/convert`)
        .send();

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });

    it('8. should return 403 when user lacks LEAD_CONVERT permission (e.g. VIEWER)', async () => {
      const lead = await prisma.lead.create({
        data: {
          fullName: 'Khách Hàng Viewer',
          source: 'OTHER',
          createdById: 'usr_viewer_01',
        },
      });

      const res = await request(app)
        .post(`/api/leads/${lead.id}/convert`)
        .set('Authorization', `Bearer ${viewerToken}`)
        .send();

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });

    it('9. should return 403 when user accesses lead outside data scope (OWN data scope)', async () => {
      // Lead created by sales 1
      const lead = await prisma.lead.create({
        data: {
          fullName: 'Khách Hàng Sales 1',
          source: 'EVENT',
          createdById: 'usr_sales_01',
        },
      });

      // Sales 2 attempts to convert sales 1's lead
      const res = await request(app)
        .post(`/api/leads/${lead.id}/convert`)
        .set('Authorization', `Bearer ${salesToken2}`)
        .send();

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toMatch(/ngoài phạm vi phụ trách/);
    });

    it('10. should prevent duplicate customer creation and reuse existing customer and contact', async () => {
      // Pre-create an existing customer with phone and email
      const existingCustomer = await prisma.customer.create({
        data: {
          customerCode: 'CUST-EXIST-01',
          customerName: 'Công ty Cổ phần Sao Vàng',
          phone: '0977889900',
          email: 'contact@saovang.vn',
        },
      });

      // Pre-create an existing contact under that customer
      const existingContact = await prisma.contact.create({
        data: {
          contactCode: 'CONT-EXIST-01',
          customerId: existingCustomer.id,
          name: 'Phạm Hồng Thái',
          phone: '0977889900',
          email: 'contact@saovang.vn',
        },
      });

      // Create a lead with same company and phone
      const lead = await prisma.lead.create({
        data: {
          fullName: 'Phạm Hồng Thái',
          phone: '0977889900',
          email: 'contact@saovang.vn',
          company: 'Công ty Cổ phần Sao Vàng',
          source: 'CONFERENCE',
          createdById: 'usr_admin_01',
        },
      });

      const res = await request(app)
        .post(`/api/leads/${lead.id}/convert`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          opportunityName: 'Cơ hội mở rộng hệ thống đợt 2',
          opportunityAmount: 80000000,
        });

      expect(res.status).toBe(200);

      // Verify that the existing Customer and Contact were reused
      expect(res.body.data.customer.id).toBe(existingCustomer.id);
      expect(res.body.data.customer.customerCode).toBe('CUST-EXIST-01');
      expect(res.body.data.contact.id).toBe(existingContact.id);

      // Verify that total Customers in DB is still 1
      const totalCustomers = await prisma.customer.count();
      expect(totalCustomers).toBe(1);

      // Verify that total Contacts in DB is still 1
      const totalContacts = await prisma.contact.count();
      expect(totalContacts).toBe(1);

      // Verify that Opportunity was created and linked to the existing customer and contact
      const totalOpportunities = await prisma.opportunity.count();
      expect(totalOpportunities).toBe(1);
      expect(res.body.data.opportunity.amount).toBe(80000000);
    });

    it('11. should rollback entire transaction if an error occurs during conversion', async () => {
      const lead = await prisma.lead.create({
        data: {
          fullName: 'Lê Thùy Dương',
          source: 'WORKSHOP',
          status: 'NEW',
          createdById: 'usr_admin_01',
        },
      });

      // Send invalid negative opportunityAmount (validation failure at request level)
      const res = await request(app)
        .post(`/api/leads/${lead.id}/convert`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          opportunityAmount: -50000, // Invalid negative amount
        });

      expect(res.status).toBe(400);

      // Verify lead is untouched
      const dbLead = await prisma.lead.findUnique({ where: { id: lead.id } });
      expect(dbLead?.status).toBe('NEW');
      expect(dbLead?.convertedAt).toBeNull();

      // Verify no Customer, Contact or Opportunity was created
      const customerCount = await prisma.customer.count();
      const contactCount = await prisma.contact.count();
      const oppCount = await prisma.opportunity.count();
      expect(customerCount).toBe(0);
      expect(contactCount).toBe(0);
      expect(oppCount).toBe(0);
    });

    it('12. should handle concurrent conversion requests safely and not create duplicate records', async () => {
      const lead = await prisma.lead.create({
        data: {
          fullName: 'Ngô Kiến Huy',
          company: 'Huy Ngô Media',
          source: 'TALKSHOW',
          phone: '0933221100',
          createdById: 'usr_admin_01',
        },
      });

      // Fire 2 simultaneous conversion requests
      const [res1, res2] = await Promise.all([
        request(app)
          .post(`/api/leads/${lead.id}/convert`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ opportunityName: 'Gói Truyền Thông 1' }),
        request(app)
          .post(`/api/leads/${lead.id}/convert`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ opportunityName: 'Gói Truyền Thông 2' }),
      ]);

      const statuses = [res1.status, res2.status].sort();
      // Exactly one request should succeed (200), and the other should fail (400)
      expect(statuses).toEqual([200, 400]);

      // Exactly 1 customer should exist for this lead
      const customers = await prisma.customer.findMany({
        where: { customerName: 'Huy Ngô Media' },
      });
      expect(customers.length).toBe(1);

      // Exactly 1 lead converted in DB
      const dbLead = await prisma.lead.findUnique({ where: { id: lead.id } });
      expect(dbLead?.status).toBe('CONVERTED');
    });

    it('14. should ensure existing lead creation and list APIs still work normally', async () => {
      // Create lead
      const createRes = await request(app)
        .post('/api/leads')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          fullName: 'Trịnh Thăng Bình',
          source: 'DIRECT',
          phone: '0911223344',
          email: 'binh@bpro.vn',
        });

      expect(createRes.status).toBe(201);
      expect(createRes.body.data.fullName).toBe('Trịnh Thăng Bình');

      // List leads
      const listRes = await request(app)
        .get('/api/leads?search=Bình')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(listRes.status).toBe(200);
      expect(listRes.body.data.items.length).toBeGreaterThanOrEqual(1);
    });
  });
});
