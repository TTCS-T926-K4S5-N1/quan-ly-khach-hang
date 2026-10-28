import request from 'supertest';
import * as xlsx from 'xlsx';
import { createApp } from '../../src/app';
import { prisma } from '../../src/config/prisma';
import { AuthService } from '../../src/modules/auth/auth.service';
import { UserRole } from '../../src/constants/permissions.constant';

function createExcelBuffer(data: any[][]): Buffer {
  const ws = xlsx.utils.aoa_to_sheet(data);
  const wb = xlsx.utils.book_new();
  xlsx.utils.book_append_sheet(wb, ws, 'Leads');
  return xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });
}

describe('Lead Management API - SCRUM-64 (Integration Tests)', () => {
  const app = createApp();

  let marketingToken: string;
  let adminToken: string;
  let viewerToken: string;

  beforeAll(async () => {
    marketingToken = AuthService.generateToken({
      id: 'usr_mkt_01',
      username: 'marketing_user',
      name: 'Marketing Staff',
      role: UserRole.MARKETING,
    });

    adminToken = AuthService.generateToken({
      id: 'usr_admin_01',
      username: 'admin_user',
      name: 'System Admin',
      role: UserRole.ADMIN,
    });

    viewerToken = AuthService.generateToken({
      id: 'usr_viewer_01',
      username: 'viewer_user',
      name: 'Viewer Staff',
      role: UserRole.VIEWER,
    });
  });

  beforeEach(async () => {
    // Clean leads table before each test
    await prisma.lead.deleteMany();
  });

  afterAll(async () => {
    await prisma.lead.deleteMany();
    await prisma.$disconnect();
  });

  describe('POST /api/leads & POST /leads (Manual Lead Creation)', () => {
    it('1. should create a lead successfully with valid data and mandatory source', async () => {
      const res = await request(app)
        .post('/api/leads')
        .set('Authorization', `Bearer ${marketingToken}`)
        .send({
          fullName: 'Nguyễn Văn Nam',
          source: 'CONFERENCE',
          phone: '0901234567',
          email: 'nam.nguyen@alpha.com',
          company: 'Alpha Corp',
          jobTitle: 'Sales Director',
          address: 'Quận 1, TP. HCM',
          notes: 'Gặp gỡ tại Hội thảo Kinh tế 2026',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.fullName).toBe('Nguyễn Văn Nam');
      expect(res.body.data.source).toBe('CONFERENCE');
      expect(res.body.data.phone).toBe('0901234567');
      expect(res.body.data.createdById).toBe('usr_mkt_01');
      expect(res.body.data.leadCode).toMatch(/^LEAD-/);

      // Verify in DB
      const dbLead = await prisma.lead.findUnique({
        where: { id: res.body.data.id },
      });
      expect(dbLead).not.toBeNull();
      expect(dbLead?.fullName).toBe('Nguyễn Văn Nam');
    });

    it('2. should also work via alias route POST /leads', async () => {
      const res = await request(app)
        .post('/leads')
        .set('Authorization', `Bearer ${marketingToken}`)
        .send({
          fullName: 'Trần Thị Mai',
          source: 'EVENT',
          phone: '0909999888',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.fullName).toBe('Trần Thị Mai');
    });

    it('3. should return 400 when mandatory source is missing or empty', async () => {
      const res = await request(app)
        .post('/api/leads')
        .set('Authorization', `Bearer ${marketingToken}`)
        .send({
          fullName: 'Lê Văn Thiếu Nguồn',
          source: '',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('4. should return 400 when fullName is missing or empty', async () => {
      const res = await request(app)
        .post('/api/leads')
        .set('Authorization', `Bearer ${marketingToken}`)
        .send({
          fullName: '',
          source: 'NAME_CARD',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('5. should return 409 Conflict when phone already exists', async () => {
      // First lead
      await prisma.lead.create({
        data: {
          fullName: 'Khách Đã Có',
          source: 'CONFERENCE',
          phone: '0912345678',
        },
      });

      // Try creating duplicate phone
      const res = await request(app)
        .post('/api/leads')
        .set('Authorization', `Bearer ${marketingToken}`)
        .send({
          fullName: 'Khách Trùng SĐT',
          source: 'EVENT',
          phone: '0912345678',
        });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('CONFLICT');
      expect(res.body.error.message).toContain("0912345678");
    });

    it('6. should return 409 Conflict when email already exists', async () => {
      // First lead
      await prisma.lead.create({
        data: {
          fullName: 'Khách Đã Có Email',
          source: 'CONFERENCE',
          email: 'duplicate@test.com',
        },
      });

      const res = await request(app)
        .post('/api/leads')
        .set('Authorization', `Bearer ${marketingToken}`)
        .send({
          fullName: 'Khách Trùng Email',
          source: 'EVENT',
          email: 'duplicate@test.com',
        });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('CONFLICT');
      expect(res.body.error.message).toContain('duplicate@test.com');
    });

    it('7. should return 401 Unauthorized if request has no auth token', async () => {
      const res = await request(app)
        .post('/api/leads')
        .send({
          fullName: 'Khách Ẩn Danh',
          source: 'EVENT',
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('8. should return 403 Forbidden if user lacks LEAD_CREATE permission (e.g. Viewer)', async () => {
      const res = await request(app)
        .post('/api/leads')
        .set('Authorization', `Bearer ${viewerToken}`)
        .send({
          fullName: 'Khách Không Quyền',
          source: 'EVENT',
        });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });
  });

  describe('POST /api/leads/import/preview (Excel Preview)', () => {
    it('1. should return 200 with preview statistics and row data for valid Excel file without inserting into DB', async () => {
      const excelBuffer = createExcelBuffer([
        ['Họ và tên', 'Nguồn', 'Số điện thoại', 'Email', 'Công ty', 'Chức vụ'],
        ['Hoàng Minh Tuấn', 'CONFERENCE', '0981112233', 'tuan@tech.vn', 'Tech Innovate', 'CTO'],
        ['Đỗ Thu Hà', 'EVENT', '0982223344', 'ha@event.vn', 'Ha Agency', 'CEO'],
      ]);

      const res = await request(app)
        .post('/api/leads/import/preview')
        .set('Authorization', `Bearer ${marketingToken}`)
        .attach('file', excelBuffer, 'conference_leads.xlsx');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.totalRows).toBe(2);
      expect(res.body.data.validRows).toBe(2);
      expect(res.body.data.invalidRows).toBe(0);
      expect(res.body.data.errors).toHaveLength(0);

      // Verify no records were saved in DB
      const count = await prisma.lead.count();
      expect(count).toBe(0);
    });

    it('2. should return row-by-row error details for rows missing required source or with invalid format', async () => {
      const excelBuffer = createExcelBuffer([
        ['Họ và tên', 'Nguồn', 'Số điện thoại', 'Email'],
        ['Nguyễn Hợp Lệ', 'WORKSHOP', '0981112233', 'hop@test.com'], // row 2: valid
        ['Trần Thiếu Nguồn', '', '0982223344', 'thieu@test.com'], // row 3: missing source
        ['', 'EVENT', '0983334455', 'thieuten@test.com'], // row 4: missing name
      ]);

      const res = await request(app)
        .post('/api/leads/import/preview')
        .set('Authorization', `Bearer ${marketingToken}`)
        .attach('file', excelBuffer, 'invalid_preview.xlsx');

      expect(res.status).toBe(200);
      expect(res.body.data.totalRows).toBe(3);
      expect(res.body.data.validRows).toBe(1);
      expect(res.body.data.invalidRows).toBe(2);

      const errRow3 = res.body.data.errors.find((e: any) => e.row === 3);
      expect(errRow3.errors).toContain('Thiếu trường bắt buộc: Nguồn lead (source)');

      const errRow4 = res.body.data.errors.find((e: any) => e.row === 4);
      expect(errRow4.errors).toContain('Thiếu trường bắt buộc: Họ và tên');
    });

    it('3. should return 400 when file is missing in request', async () => {
      const res = await request(app)
        .post('/api/leads/import/preview')
        .set('Authorization', `Bearer ${marketingToken}`);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('4. should return 400 when uploaded file is not .xlsx or .xls', async () => {
      const textBuffer = Buffer.from('Họ và tên, Nguồn\nNguyễn Văn A, EVENT');

      const res = await request(app)
        .post('/api/leads/import/preview')
        .set('Authorization', `Bearer ${marketingToken}`)
        .attach('file', textBuffer, 'leads.txt');

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('INVALID_FILE_TYPE');
    });

    it('5. should return 400 when Excel file has invalid column structure', async () => {
      const wrongColumnsBuffer = createExcelBuffer([
        ['Mã hàng', 'Tên hàng', 'Đơn giá'],
        ['SP01', 'Bàn phím', '500000'],
      ]);

      const res = await request(app)
        .post('/api/leads/import/preview')
        .set('Authorization', `Bearer ${marketingToken}`)
        .attach('file', wrongColumnsBuffer, 'wrong_cols.xlsx');

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toContain('Cấu trúc cột trong file Excel không hợp lệ');
    });

    it('6. should return 403 Forbidden when Viewer calls preview endpoint', async () => {
      const excelBuffer = createExcelBuffer([
        ['Họ và tên', 'Nguồn'],
        ['Test', 'EVENT'],
      ]);

      const res = await request(app)
        .post('/api/leads/import/preview')
        .set('Authorization', `Bearer ${viewerToken}`)
        .attach('file', excelBuffer, 'test.xlsx');

      expect(res.status).toBe(403);
    });
  });

  describe('POST /api/leads/import (Bulk Import into DB)', () => {
    it('1. should import valid leads into database and report statistics and failed rows', async () => {
      // Pre-seed an existing lead to test DB duplicate check during import
      await prisma.lead.create({
        data: {
          fullName: 'Khách Đã Tồn Tại',
          source: 'EVENT',
          phone: '0911000111',
          email: 'da_ton_tai@test.com',
        },
      });

      const excelBuffer = createExcelBuffer([
        ['Họ và tên', 'Nguồn', 'Số điện thoại', 'Email', 'Công ty'],
        ['Lead Import 1', 'CONFERENCE', '0922000111', 'imp1@test.com', 'FPT'], // row 2: valid
        ['Lead Trùng SĐT Cũ', 'CONFERENCE', '0911000111', 'imp2@test.com', 'Viettel'], // row 3: DB duplicate phone
        ['Lead Thiếu Nguồn', '', '0922000222', 'imp3@test.com', 'VNPT'], // row 4: missing source
        ['Lead Import 2', 'NAME_CARD', '0922000333', 'imp4@test.com', 'VNG'], // row 5: valid
      ]);

      const res = await request(app)
        .post('/api/leads/import')
        .set('Authorization', `Bearer ${marketingToken}`)
        .attach('file', excelBuffer, 'import_leads.xlsx');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.totalRows).toBe(4);
      expect(res.body.data.successCount).toBe(2);
      expect(res.body.data.failureCount).toBe(2);
      expect(res.body.data.importedLeads).toHaveLength(2);

      // Check failed rows report
      const failedRowNumbers = res.body.data.failedRows.map((r: any) => r.row);
      expect(failedRowNumbers).toContain(3);
      expect(failedRowNumbers).toContain(4);

      // Verify records in DB
      const dbLeads = await prisma.lead.findMany({
        where: {
          phone: { in: ['0922000111', '0922000333'] },
        },
      });
      expect(dbLeads).toHaveLength(2);
      expect(dbLeads[0].createdById).toBe('usr_mkt_01');
    });

    it('2. should return 401 Unauthorized if unauthenticated', async () => {
      const excelBuffer = createExcelBuffer([
        ['Họ và tên', 'Nguồn'],
        ['Test', 'EVENT'],
      ]);

      const res = await request(app)
        .post('/api/leads/import')
        .attach('file', excelBuffer, 'import.xlsx');

      expect(res.status).toBe(401);
    });

    it('3. should return 403 Forbidden if user lacks LEAD_CREATE permission', async () => {
      const excelBuffer = createExcelBuffer([
        ['Họ và tên', 'Nguồn'],
        ['Test', 'EVENT'],
      ]);

      const res = await request(app)
        .post('/api/leads/import')
        .set('Authorization', `Bearer ${viewerToken}`)
        .attach('file', excelBuffer, 'import.xlsx');

      expect(res.status).toBe(403);
    });
  });

  describe('GET /api/leads (List Leads)', () => {
    it('1. should list leads with pagination and filtering', async () => {
      await prisma.lead.createMany({
        data: [
          { fullName: 'Lead A', source: 'CONFERENCE', phone: '0901000001' },
          { fullName: 'Lead B', source: 'EVENT', phone: '0901000002' },
          { fullName: 'Lead C', source: 'CONFERENCE', phone: '0901000003' },
        ],
      });

      const res = await request(app)
        .get('/api/leads?source=CONFERENCE')
        .set('Authorization', `Bearer ${marketingToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.items).toHaveLength(2);
      expect(res.body.data.pagination.total).toBe(2);
    });
  });
});
