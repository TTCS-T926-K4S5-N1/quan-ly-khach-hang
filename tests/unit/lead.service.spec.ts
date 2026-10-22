import * as xlsx from 'xlsx';
import { LeadService } from '../../src/modules/lead/lead.service';
import { LeadRepository } from '../../src/modules/lead/lead.repository';
import { ConflictError, BadRequestError } from '../../src/errors/appError';

function createExcelBuffer(data: any[][]): Buffer {
  const ws = xlsx.utils.aoa_to_sheet(data);
  const wb = xlsx.utils.book_new();
  xlsx.utils.book_append_sheet(wb, ws, 'Leads');
  return xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });
}

describe('LeadService (Unit Tests)', () => {
  let leadService: LeadService;
  let mockLeadRepo: jest.Mocked<LeadRepository>;

  beforeEach(() => {
    mockLeadRepo = {
      create: jest.fn(),
      findById: jest.fn(),
      findByPhone: jest.fn(),
      findByEmail: jest.fn(),
      findExistingPhones: jest.fn().mockResolvedValue([]),
      findExistingEmails: jest.fn().mockResolvedValue([]),
      batchCreate: jest.fn(),
      findLeads: jest.fn(),
    } as unknown as jest.Mocked<LeadRepository>;

    leadService = new LeadService(mockLeadRepo);
  });

  describe('createLead (Manual Creation)', () => {
    it('1. should create a lead successfully with valid data and mandatory source', async () => {
      const now = new Date();
      mockLeadRepo.create.mockResolvedValue({
        id: 'lead_001',
        leadCode: 'LEAD-2026-000001',
        fullName: 'Nguyễn Văn A',
        source: 'CONFERENCE',
        phone: '0901234567',
        email: 'vana@example.com',
        company: 'FPT',
        jobTitle: 'Manager',
        address: 'Hà Nội',
        status: 'NEW',
        notes: 'Gặp gỡ tại sự kiện',
        createdById: 'user_mkt_1',
        createdAt: now,
        updatedAt: now,
      });

      const result = await leadService.createLead(
        {
          fullName: 'Nguyễn Văn A',
          source: 'CONFERENCE',
          phone: '0901234567',
          email: 'vana@example.com',
          company: 'FPT',
          jobTitle: 'Manager',
        },
        'user_mkt_1'
      );

      expect(mockLeadRepo.findByPhone).toHaveBeenCalledWith('0901234567');
      expect(mockLeadRepo.findByEmail).toHaveBeenCalledWith('vana@example.com');
      expect(mockLeadRepo.create).toHaveBeenCalledTimes(1);
      expect(result.fullName).toBe('Nguyễn Văn A');
      expect(result.source).toBe('CONFERENCE');
      expect(result.createdById).toBe('user_mkt_1');
    });

    it('2. should throw BadRequestError when source is empty', async () => {
      await expect(
        leadService.createLead({
          fullName: 'Nguyễn Văn A',
          source: '   ',
        })
      ).rejects.toThrow(BadRequestError);
    });

    it('3. should throw ConflictError when phone already exists in database', async () => {
      mockLeadRepo.findByPhone.mockResolvedValue({
        id: 'lead_exist_phone',
        leadCode: 'LEAD-001',
        fullName: 'Người cũ',
        phone: '0901234567',
        email: null,
        company: null,
        jobTitle: null,
        address: null,
        source: 'EVENT',
        status: 'NEW',
        notes: null,
        createdById: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await expect(
        leadService.createLead({
          fullName: 'Nguyễn Văn Mới',
          source: 'EVENT',
          phone: '0901234567',
        })
      ).rejects.toThrow(ConflictError);
    });

    it('4. should throw ConflictError when email already exists in database', async () => {
      mockLeadRepo.findByPhone.mockResolvedValue(null);
      mockLeadRepo.findByEmail.mockResolvedValue({
        id: 'lead_exist_email',
        leadCode: 'LEAD-002',
        fullName: 'Người cũ Email',
        phone: null,
        email: 'exist@example.com',
        company: null,
        jobTitle: null,
        address: null,
        source: 'WEBSITE',
        status: 'NEW',
        notes: null,
        createdById: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await expect(
        leadService.createLead({
          fullName: 'Nguyễn Văn Mới',
          source: 'WEBSITE',
          email: 'exist@example.com',
        })
      ).rejects.toThrow(ConflictError);
    });
  });

  describe('previewExcelImport (Excel Preview)', () => {
    it('1. should preview valid Excel data and return correct row status without DB writes', async () => {
      const excelBuffer = createExcelBuffer([
        ['Họ và tên', 'Nguồn', 'Số điện thoại', 'Email', 'Công ty'],
        ['Lê Văn B', 'WORKSHOP', '0912345678', 'levanb@test.com', 'Tech Corp'],
        ['Phạm Thị C', 'NAME_CARD', '0987654321', 'phamc@test.com', 'Media JSC'],
      ]);

      const result = await leadService.previewExcelImport(excelBuffer, 'test.xlsx');

      expect(result.totalRows).toBe(2);
      expect(result.validRows).toBe(2);
      expect(result.invalidRows).toBe(0);
      expect(result.errors).toHaveLength(0);
      expect(result.preview[0].data.fullName).toBe('Lê Văn B');
      expect(result.preview[0].isValid).toBe(true);
      expect(mockLeadRepo.batchCreate).not.toHaveBeenCalled();
    });

    it('2. should flag rows missing required fields (fullName, source) or invalid phone/email', async () => {
      const excelBuffer = createExcelBuffer([
        ['Họ và tên', 'Nguồn', 'Số điện thoại', 'Email'],
        ['', 'SEMINAR', '0912345678', 'valid@test.com'], // row 2: missing name
        ['Trần Văn D', '', '0922345678', 'valid2@test.com'], // row 3: missing source
        ['Hoàng Văn E', 'EVENT', '123_invalid_phone', 'invalid-email-format'], // row 4: invalid phone & email
      ]);

      const result = await leadService.previewExcelImport(excelBuffer, 'invalid_rows.xlsx');

      expect(result.totalRows).toBe(3);
      expect(result.validRows).toBe(0);
      expect(result.invalidRows).toBe(3);

      expect(result.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ row: 2, errors: expect.arrayContaining(['Thiếu trường bắt buộc: Họ và tên']) }),
          expect.objectContaining({ row: 3, errors: expect.arrayContaining(['Thiếu trường bắt buộc: Nguồn lead (source)']) }),
          expect.objectContaining({
            row: 4,
            errors: expect.arrayContaining([
              expect.stringContaining('Định dạng số điện thoại không hợp lệ'),
              expect.stringContaining('Định dạng email không hợp lệ'),
            ]),
          }),
        ])
      );
    });

    it('3. should detect intra-file duplicate phones and emails', async () => {
      const excelBuffer = createExcelBuffer([
        ['Họ và tên', 'Nguồn', 'Số điện thoại', 'Email'],
        ['Người 1', 'EVENT', '0901111222', 'lead1@test.com'], // row 2
        ['Người 2', 'EVENT', '0901111222', 'lead2@test.com'], // row 3: duplicate phone of row 2
        ['Người 3', 'EVENT', '0903333444', 'lead1@test.com'], // row 4: duplicate email of row 2
      ]);

      const result = await leadService.previewExcelImport(excelBuffer, 'dup_in_file.xlsx');

      expect(result.totalRows).toBe(3);
      expect(result.validRows).toBe(1);
      expect(result.invalidRows).toBe(2);

      const row3Error = result.errors.find((e) => e.row === 3);
      expect(row3Error?.errors[0]).toContain('bị trùng lặp với dòng 2 trong file');

      const row4Error = result.errors.find((e) => e.row === 4);
      expect(row4Error?.errors[0]).toContain('bị trùng lặp với dòng 2 trong file');
    });

    it('4. should detect duplicates against existing database records', async () => {
      mockLeadRepo.findExistingPhones.mockResolvedValue(['0909999888']);
      mockLeadRepo.findExistingEmails.mockResolvedValue(['db_exist@test.com']);

      const excelBuffer = createExcelBuffer([
        ['Họ và tên', 'Nguồn', 'Số điện thoại', 'Email'],
        ['Người DB Trùng SĐT', 'EVENT', '0909999888', 'new_email@test.com'],
        ['Người DB Trùng Mail', 'EVENT', '0908888777', 'db_exist@test.com'],
      ]);

      const result = await leadService.previewExcelImport(excelBuffer, 'db_dup.xlsx');

      expect(result.validRows).toBe(0);
      expect(result.invalidRows).toBe(2);
      expect(result.errors[0].errors[0]).toContain("Số điện thoại '0909999888' đã tồn tại trong hệ thống");
      expect(result.errors[1].errors[0]).toContain("Email 'db_exist@test.com' đã tồn tại trong hệ thống");
    });

    it('5. should throw BadRequestError when column headers are missing required columns', async () => {
      const invalidHeaderExcel = createExcelBuffer([
        ['Tên sản phẩm', 'Giá bán', 'Ghi chú'],
        ['Laptop', '20000000', 'Ghi chú'],
      ]);

      await expect(
        leadService.previewExcelImport(invalidHeaderExcel, 'wrong_headers.xlsx')
      ).rejects.toThrow(BadRequestError);
    });
  });

  describe('importExcelLeads (Bulk Import)', () => {
    it('1. should import only valid leads and return comprehensive statistics', async () => {
      const excelBuffer = createExcelBuffer([
        ['Họ và tên', 'Nguồn', 'Số điện thoại', 'Email'],
        ['Lead Hợp Lệ 1', 'CONFERENCE', '0901234001', 'valid1@test.com'], // row 2: valid
        ['Lead Thiếu Nguồn', '', '0901234002', 'invalid@test.com'], // row 3: invalid
        ['Lead Hợp Lệ 2', 'CONFERENCE', '0901234003', 'valid2@test.com'], // row 4: valid
      ]);

      const now = new Date();
      mockLeadRepo.batchCreate.mockResolvedValue([
        {
          id: 'lead_imp_1',
          leadCode: 'LEAD-2026-001',
          fullName: 'Lead Hợp Lệ 1',
          source: 'CONFERENCE',
          phone: '0901234001',
          email: 'valid1@test.com',
          company: null,
          jobTitle: null,
          address: null,
          status: 'NEW',
          notes: null,
          createdById: 'user_mkt',
          createdAt: now,
          updatedAt: now,
        },
        {
          id: 'lead_imp_2',
          leadCode: 'LEAD-2026-002',
          fullName: 'Lead Hợp Lệ 2',
          source: 'CONFERENCE',
          phone: '0901234003',
          email: 'valid2@test.com',
          company: null,
          jobTitle: null,
          address: null,
          status: 'NEW',
          notes: null,
          createdById: 'user_mkt',
          createdAt: now,
          updatedAt: now,
        },
      ]);

      const result = await leadService.importExcelLeads(excelBuffer, 'user_mkt', 'bulk.xlsx');

      expect(result.totalRows).toBe(3);
      expect(result.successCount).toBe(2);
      expect(result.failureCount).toBe(1);
      expect(result.failedRows).toHaveLength(1);
      expect(result.failedRows[0].row).toBe(3);
      expect(mockLeadRepo.batchCreate).toHaveBeenCalledTimes(1);
      expect(result.importedLeads).toHaveLength(2);
    });
  });

  describe('getLeads', () => {
    it('should return paginated leads with pagination meta', async () => {
      mockLeadRepo.findLeads.mockResolvedValue({
        items: [
          {
            id: 'l_1',
            leadCode: 'LEAD-01',
            fullName: 'Lead 1',
            source: 'EVENT',
            phone: '0901234567',
            email: 'l1@test.com',
            company: null,
            jobTitle: null,
            address: null,
            status: 'NEW',
            notes: null,
            createdById: null,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
        total: 1,
      });

      const res = await leadService.getLeads({ page: 1, limit: 10 });
      expect(res.items).toHaveLength(1);
      expect(res.pagination.total).toBe(1);
      expect(res.pagination.page).toBe(1);
    });
  });
});
