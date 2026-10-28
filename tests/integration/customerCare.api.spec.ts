import request from 'supertest';
import { createApp } from '../../src/app';
import { prisma } from '../../src/config/prisma';
import { AuthService } from '../../src/modules/auth/auth.service';
import { UserRole } from '../../src/constants/permissions.constant';
import { CareStatus } from '../../src/constants/careStatus.constant';

describe('Customer Care Management API (Integration Tests)', () => {
  const app = createApp();

  let staffToken: string;
  let viewerToken: string;

  const now = new Date();
  const dayMs = 24 * 60 * 60 * 1000;

  beforeAll(async () => {
    // Generate auth tokens for testing
    staffToken = AuthService.generateToken({
      id: 'usr_staff_01',
      username: 'staff_user',
      name: 'Care Staff',
      role: UserRole.CARE_STAFF,
    });

    viewerToken = AuthService.generateToken({
      id: 'usr_viewer_01',
      username: 'viewer_user',
      name: 'Viewer User',
      role: UserRole.VIEWER,
    });
  });

  beforeEach(async () => {
    // Clean and reset database before each test
    await prisma.customerCareHistory.deleteMany();
    await prisma.contract.deleteMany();
    await prisma.customer.deleteMany();
    await prisma.systemConfig.deleteMany();

    // Seed default system config: 30 days
    await prisma.systemConfig.create({
      data: {
        key: 'CUSTOMER_CARE_DEFAULT_DAYS',
        value: '30',
        description: 'Default care days',
      },
    });

    // Seed test customers:
    // 1. Never contacted (lastContactAt: null), syncedAt: 1h ago
    await prisma.customer.create({
      data: {
        id: 'cust_never',
        customerCode: 'KH_NEVER',
        customerName: 'Khách hàng chưa chăm sóc',
        phone: '0901000001',
        email: 'never@test.com',
        lastContactAt: null,
        careStatus: CareStatus.NEEDS_CARE,
        syncedAt: new Date(now.getTime() - 1 * 60 * 60 * 1000), // 1h ago
        contracts: {
          create: [
            {
              contractNumber: 'HD_NEVER_01',
              status: 'ACTIVE',
              startDate: new Date(now.getTime() - 100 * dayMs),
              endDate: new Date(now.getTime() + 100 * dayMs),
            },
          ],
        },
      },
    });

    // 2. Contacted 40 days ago (> 30 days -> needs care), syncedAt: 2h ago
    await prisma.customer.create({
      data: {
        id: 'cust_40d',
        customerCode: 'KH_40D',
        customerName: 'Khách hàng 40 ngày trước',
        phone: '0901000002',
        email: 'cust40@test.com',
        lastContactAt: new Date(now.getTime() - 40 * dayMs),
        careStatus: CareStatus.NEEDS_CARE,
        syncedAt: new Date(now.getTime() - 2 * 60 * 60 * 1000), // 2h ago
      },
    });

    // 3. Contacted 5 days ago (< 30 days -> DOES NOT need care), syncedAt: 30m ago
    await prisma.customer.create({
      data: {
        id: 'cust_recent_5d',
        customerCode: 'KH_5D',
        customerName: 'Khách hàng vừa liên hệ 5 ngày',
        phone: '0901000003',
        email: 'recent5@test.com',
        lastContactAt: new Date(now.getTime() - 5 * dayMs),
        careStatus: CareStatus.CONTACTED,
        syncedAt: new Date(now.getTime() - 30 * 60 * 1000), // 30m ago
      },
    });

    // 4. Contacted 50 days ago (> 30 days -> needs care), syncedAt is NULL
    await prisma.customer.create({
      data: {
        id: 'cust_null_synced',
        customerCode: 'KH_NULL_SYNC',
        customerName: 'Khách hàng không có syncedAt',
        phone: '0901000004',
        email: 'nullsync@test.com',
        lastContactAt: new Date(now.getTime() - 50 * dayMs),
        careStatus: CareStatus.NEEDS_CARE,
        syncedAt: null,
      },
    });
  });

  afterAll(async () => {
    await prisma.customerCareHistory.deleteMany();
    await prisma.contract.deleteMany();
    await prisma.customer.deleteMany();
    await prisma.systemConfig.deleteMany();
    await prisma.$disconnect();
  });

  describe('GET /api/customers/care', () => {
    it('1. should return 200 and list customers needing care with default days = 30', async () => {
      const res = await request(app)
        .get('/api/customers/care')
        .set('Authorization', `Bearer ${staffToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.careConfig.appliedDays).toBe(30);

      // Should include cust_never (null), cust_40d (40d ago), cust_null_synced (50d ago)
      // Should NOT include cust_recent_5d (5d ago)
      const ids = res.body.data.items.map((i: any) => i.customerId);
      expect(ids).toContain('cust_never');
      expect(ids).toContain('cust_40d');
      expect(ids).toContain('cust_null_synced');
      expect(ids).not.toContain('cust_recent_5d');

      expect(res.body.data.pagination.total).toBe(3);
    });

    it('2. should properly filter when days parameter changes to 10 days', async () => {
      // With days=10:
      // cust_never (null) -> included
      // cust_40d (40d ago > 10d) -> included
      // cust_null_synced (50d ago > 10d) -> included
      // cust_recent_5d (5d ago < 10d) -> excluded
      const res = await request(app)
        .get('/api/customers/care?days=10')
        .set('Authorization', `Bearer ${staffToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.careConfig.appliedDays).toBe(10);
      expect(res.body.data.pagination.total).toBe(3);
    });

    it('3. should properly filter when days parameter changes to 45 days', async () => {
      // With days=45:
      // cust_never (null) -> included
      // cust_40d (40d ago <= 45d -> NOT > 45d) -> excluded!
      // cust_null_synced (50d ago > 45d) -> included!
      // cust_recent_5d (5d ago) -> excluded!
      const res = await request(app)
        .get('/api/customers/care?days=45')
        .set('Authorization', `Bearer ${staffToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.careConfig.appliedDays).toBe(45);

      const ids = res.body.data.items.map((i: any) => i.customerId);
      expect(ids).toContain('cust_never');
      expect(ids).toContain('cust_null_synced');
      expect(ids).not.toContain('cust_40d');
      expect(ids).not.toContain('cust_recent_5d');
    });

    it('4. should sort customers by syncedAt descending without errors when syncedAt is null', async () => {
      const res = await request(app)
        .get('/api/customers/care?days=30')
        .set('Authorization', `Bearer ${staffToken}`);

      expect(res.status).toBe(200);
      const items = res.body.data.items;

      // Ensure that items with valid syncedAt come first and are in descending order
      const nonNullSynced = items.filter((i: any) => i.syncedAt !== null);
      for (let i = 0; i < nonNullSynced.length - 1; i++) {
        const dateA = new Date(nonNullSynced[i].syncedAt).getTime();
        const dateB = new Date(nonNullSynced[i + 1].syncedAt).getTime();
        expect(dateA).toBeGreaterThanOrEqual(dateB);
      }
    });

    it('5. should support search filtering by customer name or code', async () => {
      const res = await request(app)
        .get('/api/customers/care?search=KH_NEVER')
        .set('Authorization', `Bearer ${staffToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.pagination.total).toBe(1);
      expect(res.body.data.items[0].customerId).toBe('cust_never');
    });

    it('6. should support pagination correctly (page & limit)', async () => {
      const res = await request(app)
        .get('/api/customers/care?page=1&limit=2')
        .set('Authorization', `Bearer ${staffToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.items.length).toBe(2);
      expect(res.body.data.pagination.page).toBe(1);
      expect(res.body.data.pagination.limit).toBe(2);
      expect(res.body.data.pagination.total).toBe(3);
      expect(res.body.data.pagination.totalPages).toBe(2);
      expect(res.body.data.pagination.hasNextPage).toBe(true);
    });

    it('7. should return 400 when days is invalid (negative, 0, or string)', async () => {
      const resNegative = await request(app)
        .get('/api/customers/care?days=-5')
        .set('Authorization', `Bearer ${staffToken}`);

      expect(resNegative.status).toBe(400);
      expect(resNegative.body.success).toBe(false);
      expect(resNegative.body.error.code).toBe('VALIDATION_ERROR');

      const resZero = await request(app)
        .get('/api/customers/care?days=0')
        .set('Authorization', `Bearer ${staffToken}`);

      expect(resZero.status).toBe(400);

      const resString = await request(app)
        .get('/api/customers/care?days=abc')
        .set('Authorization', `Bearer ${staffToken}`);

      expect(resString.status).toBe(400);
    });

    it('8. should return 400 when page or limit is invalid', async () => {
      const resInvalidPage = await request(app)
        .get('/api/customers/care?page=0')
        .set('Authorization', `Bearer ${staffToken}`);

      expect(resInvalidPage.status).toBe(400);
      expect(resInvalidPage.body.error.code).toBe('VALIDATION_ERROR');

      const resExceededLimit = await request(app)
        .get('/api/customers/care?limit=999')
        .set('Authorization', `Bearer ${staffToken}`);

      expect(resExceededLimit.status).toBe(400);
      expect(resExceededLimit.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('9. should return 401 when request is unauthenticated', async () => {
      const res = await request(app).get('/api/customers/care');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });
  });

  describe('PATCH /api/customers/:customerId/care/contact', () => {
    it('1. should mark customer as contacted successfully, update lastContactAt and persist history', async () => {
      const res = await request(app)
        .patch('/api/customers/cust_never/care/contact')
        .set('Authorization', `Bearer ${staffToken}`)
        .send({
          note: 'Đã gọi điện tư vấn thành công',
          channel: 'PHONE',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.customerId).toBe('cust_never');
      expect(res.body.data.careStatus).toBe(CareStatus.CONTACTED);
      expect(res.body.data.lastContactNote).toBe('Đã gọi điện tư vấn thành công');
      expect(res.body.data.lastContactAt).toBeDefined();

      // Verify in DB that CustomerCareHistory was created
      const history = await prisma.customerCareHistory.findFirst({
        where: { customerId: 'cust_never' },
      });
      expect(history).not.toBeNull();
      expect(history?.note).toBe('Đã gọi điện tư vấn thành công');
      expect(history?.contactedById).toBe('usr_staff_01');

      // Verify that cust_never is NO LONGER in the care list
      const careListRes = await request(app)
        .get('/api/customers/care?days=30')
        .set('Authorization', `Bearer ${staffToken}`);

      const ids = careListRes.body.data.items.map((i: any) => i.customerId);
      expect(ids).not.toContain('cust_never');
    });

    it('2. should return 404 when customerId does not exist', async () => {
      const res = await request(app)
        .patch('/api/customers/non_existent_customer_id/care/contact')
        .set('Authorization', `Bearer ${staffToken}`)
        .send({
          note: 'Ghi chú thử nghiệm',
        });

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('NOT_FOUND');
    });

    it('3. should return 403 Forbidden if user lacks CUSTOMER_CARE_MANAGE permission (e.g. Viewer)', async () => {
      const res = await request(app)
        .patch('/api/customers/cust_40d/care/contact')
        .set('Authorization', `Bearer ${viewerToken}`)
        .send({
          note: 'Viewer trying to update',
        });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });

    it('4. should return 401 Unauthorized if no auth token is provided', async () => {
      const res = await request(app)
        .patch('/api/customers/cust_40d/care/contact')
        .send({
          note: 'No token',
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });
  });
});
