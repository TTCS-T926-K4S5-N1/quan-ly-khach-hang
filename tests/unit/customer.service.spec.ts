import { CustomerService } from '../../src/modules/customer/customer.service';
import { CustomerRepository } from '../../src/modules/customer/customer.repository';
import { SystemConfigRepository } from '../../src/modules/config/systemConfig.repository';
import { NotFoundError } from '../../src/errors/appError';
import { CareStatus } from '../../src/constants/careStatus.constant';

describe('CustomerService (Unit Tests)', () => {
  let customerService: CustomerService;
  let mockCustRepo: jest.Mocked<CustomerRepository>;
  let mockSysConfigRepo: jest.Mocked<SystemConfigRepository>;

  beforeEach(() => {
    mockCustRepo = {
      findCustomersNeedingCare: jest.fn(),
      findById: jest.fn(),
      recordContact: jest.fn(),
    } as unknown as jest.Mocked<CustomerRepository>;

    mockSysConfigRepo = {
      getConfig: jest.fn(),
      setConfig: jest.fn(),
      getDefaultCareDays: jest.fn().mockResolvedValue(30),
    } as unknown as jest.Mocked<SystemConfigRepository>;

    customerService = new CustomerService(mockCustRepo, mockSysConfigRepo);
  });

  describe('getCustomersNeedingCare', () => {
    it('should use default configured days (30) when days is not provided in query', async () => {
      const now = new Date();
      mockCustRepo.findCustomersNeedingCare.mockResolvedValue({
        items: [
          {
            id: 'cust_1',
            customerCode: 'CUST001',
            customerName: 'Khách hàng 1',
            phone: '0901234567',
            email: 'test1@example.com',
            address: 'Hà Nội',
            lastContactAt: null,
            lastContactNote: null,
            careStatus: CareStatus.NEEDS_CARE,
            syncedAt: now,
            createdAt: now,
            updatedAt: now,
            contracts: [],
          },
        ],
        total: 1,
      });

      const result = await customerService.getCustomersNeedingCare({ page: 1, limit: 20 });

      expect(mockSysConfigRepo.getDefaultCareDays).toHaveBeenCalledTimes(1);
      expect(mockCustRepo.findCustomersNeedingCare).toHaveBeenCalledTimes(1);
      expect(result.careConfig.appliedDays).toBe(30);
      expect(result.items).toHaveLength(1);
      expect(result.items[0].needsCare).toBe(true);
      expect(result.pagination.total).toBe(1);
    });

    it('should use query days parameter when provided (custom days = 15)', async () => {
      mockCustRepo.findCustomersNeedingCare.mockResolvedValue({
        items: [],
        total: 0,
      });

      const result = await customerService.getCustomersNeedingCare({ days: 15, page: 1, limit: 10 });

      expect(mockSysConfigRepo.getDefaultCareDays).not.toHaveBeenCalled();
      expect(result.careConfig.appliedDays).toBe(15);
      expect(result.pagination.limit).toBe(10);
    });

    it('should properly format customer who has never been contacted (lastContactAt is null)', async () => {
      mockCustRepo.findCustomersNeedingCare.mockResolvedValue({
        items: [
          {
            id: 'cust_never',
            customerCode: 'CUST_NEVER',
            customerName: 'Chưa từng liên hệ',
            phone: '0909999999',
            email: 'never@example.com',
            address: 'TP HCM',
            lastContactAt: null,
            lastContactNote: null,
            careStatus: CareStatus.NEEDS_CARE,
            syncedAt: new Date(),
            createdAt: new Date(),
            updatedAt: new Date(),
            contracts: [],
          },
        ],
        total: 1,
      });

      const result = await customerService.getCustomersNeedingCare({ days: 30 });
      expect(result.items[0].lastContactAt).toBeNull();
      expect(result.items[0].needsCare).toBe(true);
      expect(result.items[0].daysSinceLastContact).toBeNull();
    });

    it('should properly calculate daysSinceLastContact for customer contacted in past', async () => {
      const fortyDaysAgo = new Date(Date.now() - 40 * 24 * 60 * 60 * 1000);
      mockCustRepo.findCustomersNeedingCare.mockResolvedValue({
        items: [
          {
            id: 'cust_40d',
            customerCode: 'CUST_40D',
            customerName: 'Khách hàng 40 ngày',
            phone: '0908888888',
            email: '40d@example.com',
            address: 'Đà Nẵng',
            lastContactAt: fortyDaysAgo,
            lastContactNote: 'Tư vấn lần 1',
            careStatus: CareStatus.NEEDS_CARE,
            syncedAt: new Date(),
            createdAt: new Date(),
            updatedAt: new Date(),
            contracts: [],
          },
        ],
        total: 1,
      });

      const result = await customerService.getCustomersNeedingCare({ days: 30 });
      expect(result.items[0].needsCare).toBe(true);
      expect(result.items[0].daysSinceLastContact).toBeGreaterThanOrEqual(39);
    });
  });

  describe('markCustomerContacted', () => {
    it('should throw NotFoundError if customer does not exist', async () => {
      mockCustRepo.findById.mockResolvedValue(null);

      await expect(
        customerService.markCustomerContacted('non_existent_id', { note: 'Test note' })
      ).rejects.toThrow(NotFoundError);

      expect(mockCustRepo.recordContact).not.toHaveBeenCalled();
    });

    it('should mark customer contacted, update care status and return updated details', async () => {
      const now = new Date();
      mockCustRepo.findById.mockResolvedValue({
        id: 'cust_valid',
        customerCode: 'CUST_VALID',
        customerName: 'Công ty Test',
        phone: '0901234567',
        email: 'test@example.com',
        address: 'Hà Nội',
        lastContactAt: null,
        lastContactNote: null,
        careStatus: CareStatus.NEEDS_CARE,
        syncedAt: now,
        createdAt: now,
        updatedAt: now,
        contracts: [],
        careHistories: [],
      });

      mockCustRepo.recordContact.mockResolvedValue({
        updatedCustomer: {
          id: 'cust_valid',
          customerCode: 'CUST_VALID',
          customerName: 'Công ty Test',
          phone: '0901234567',
          email: 'test@example.com',
          address: 'Hà Nội',
          lastContactAt: now,
          lastContactNote: 'Đã gọi điện tư vấn gia hạn',
          careStatus: CareStatus.CONTACTED,
          syncedAt: now,
          createdAt: now,
          updatedAt: now,
          contracts: [],
        },
        history: {
          id: 'hist_123',
          customerId: 'cust_valid',
          contactedById: 'usr_staff_01',
          contactedAt: now,
          note: 'Đã gọi điện tư vấn gia hạn',
          channel: 'PHONE',
          createdAt: now,
        },
      });

      const result = await customerService.markCustomerContacted(
        'cust_valid',
        { note: 'Đã gọi điện tư vấn gia hạn', channel: 'PHONE' },
        'usr_staff_01'
      );

      expect(mockCustRepo.findById).toHaveBeenCalledWith('cust_valid');
      expect(mockCustRepo.recordContact).toHaveBeenCalledWith(
        'cust_valid',
        expect.any(Date),
        'Đã gọi điện tư vấn gia hạn',
        'PHONE',
        'usr_staff_01'
      );
      expect(result.careStatus).toBe(CareStatus.CONTACTED);
      expect(result.needsCare).toBe(false);
      expect(result.careHistory.id).toBe('hist_123');
    });
  });
});
