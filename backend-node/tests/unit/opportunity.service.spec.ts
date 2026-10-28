import { OpportunityService } from '../../src/modules/opportunity/opportunity.service';
import { OpportunityRepository } from '../../src/modules/opportunity/opportunity.repository';
import { prisma } from '../../src/config/prisma';
import { OpportunityStage } from '../../src/constants/opportunity.constant';
import {
  NotFoundError,
  BadRequestError,
  ForbiddenError,
  ValidationError,
} from '../../src/errors/appError';
import { UserRole } from '../../src/constants/permissions.constant';
import { AuthUser } from '../../src/middlewares/auth.middleware';

jest.mock('../../src/config/prisma', () => ({
  prisma: {
    customer: {
      findUnique: jest.fn(),
    },
    contact: {
      findUnique: jest.fn(),
    },
  },
}));

describe('OpportunityService (Unit Tests - SCRUM-72)', () => {
  let service: OpportunityService;
  let mockRepo: jest.Mocked<OpportunityRepository>;

  const mockAdminUser: AuthUser = {
    id: 'usr_admin',
    username: 'admin',
    name: 'Admin User',
    role: UserRole.ADMIN,
    permissions: ['OPPORTUNITY_VIEW', 'OPPORTUNITY_CREATE', 'OPPORTUNITY_MANAGE'],
    dataScope: 'ALL',
  };

  const mockSalesUser1: AuthUser = {
    id: 'usr_sales_1',
    username: 'sales_1',
    name: 'Sales Rep 1',
    role: UserRole.SALES,
    permissions: ['OPPORTUNITY_VIEW', 'OPPORTUNITY_CREATE', 'OPPORTUNITY_MANAGE'],
    dataScope: 'OWN',
  };

  const mockSalesUser2: AuthUser = {
    id: 'usr_sales_2',
    username: 'sales_2',
    name: 'Sales Rep 2',
    role: UserRole.SALES,
    permissions: ['OPPORTUNITY_VIEW', 'OPPORTUNITY_CREATE', 'OPPORTUNITY_MANAGE'],
    dataScope: 'OWN',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockRepo = {
      generateOpportunityCode: jest.fn().mockReturnValue('OPP-2026-999001'),
      create: jest.fn(),
      findById: jest.fn(),
      findByCode: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      update: jest.fn(),
      findByCustomerId: jest.fn(),
      delete: jest.fn(),
    } as unknown as jest.Mocked<OpportunityRepository>;

    service = new OpportunityService(mockRepo);
  });

  describe('createOpportunity', () => {
    const mockCustomer = {
      id: 'cust_01',
      customerCode: 'KH-001',
      customerName: 'Công ty Cổ phần ABC',
      phone: '0901234567',
      email: 'abc@corp.vn',
      address: 'Hà Nội',
    };

    const mockContact = {
      id: 'contact_01',
      contactCode: 'CT-001',
      customerId: 'cust_01',
      name: 'Nguyễn Văn Liên Hệ',
      phone: '0987654321',
      email: 'contact@abc.corp.vn',
      jobTitle: 'Trưởng phòng IT',
      isPrimary: true,
    };

    it('1. should create an opportunity successfully with default probability based on stage', async () => {
      (prisma.customer.findUnique as jest.Mock).mockResolvedValue(mockCustomer);
      (prisma.contact.findUnique as jest.Mock).mockResolvedValue(mockContact);

      const createdDbRecord = {
        id: 'opp_01',
        opportunityCode: 'OPP-2026-999001',
        name: 'Cung cấp hệ thống CRM',
        customerId: 'cust_01',
        contactId: 'contact_01',
        stage: 'QUALIFICATION',
        expectedValue: 50000000,
        amount: 50000000,
        expectedCloseDate: new Date('2026-12-31'),
        closeDate: new Date('2026-12-31'),
        probability: 10,
        source: 'WEBSITE',
        notes: 'Khách hàng có nhu cầu gấp',
        description: 'Khách hàng có nhu cầu gấp',
        ownerId: 'usr_sales_1',
        createdAt: new Date(),
        updatedAt: new Date(),
        customer: mockCustomer,
        contact: mockContact,
      };

      mockRepo.create.mockResolvedValue(createdDbRecord);

      const result = await service.createOpportunity(
        {
          name: 'Cung cấp hệ thống CRM',
          customerId: 'cust_01',
          primaryContactId: 'contact_01',
          stage: OpportunityStage.QUALIFICATION,
          expectedValue: 50000000,
          expectedCloseDate: '2026-12-31',
          source: 'WEBSITE',
          notes: 'Khách hàng có nhu cầu gấp',
        },
        mockSalesUser1
      );

      expect(prisma.customer.findUnique).toHaveBeenCalledWith({ where: { id: 'cust_01' } });
      expect(prisma.contact.findUnique).toHaveBeenCalledWith({ where: { id: 'contact_01' } });
      expect(mockRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Cung cấp hệ thống CRM',
          customerId: 'cust_01',
          contactId: 'contact_01',
          stage: 'QUALIFICATION',
          probability: 10, // Default for QUALIFICATION
          ownerId: 'usr_sales_1',
        })
      );
      expect(result.id).toBe('opp_01');
      expect(result.probability).toBe(10);
      expect(result.primaryContactId).toBe('contact_01');
    });

    it('2. should create an opportunity with custom probability when provided', async () => {
      (prisma.customer.findUnique as jest.Mock).mockResolvedValue(mockCustomer);

      const createdDbRecord = {
        id: 'opp_02',
        opportunityCode: 'OPP-2026-999002',
        name: 'Gia hạn hợp đồng dịch vụ',
        customerId: 'cust_01',
        contactId: null,
        stage: 'NEGOTIATION',
        expectedValue: 100000000,
        amount: 100000000,
        expectedCloseDate: null,
        closeDate: null,
        probability: 90, // Custom probability instead of default 75
        source: 'DIRECT',
        notes: null,
        description: null,
        ownerId: 'usr_sales_1',
        createdAt: new Date(),
        updatedAt: new Date(),
        customer: mockCustomer,
        contact: null,
      };

      mockRepo.create.mockResolvedValue(createdDbRecord);

      const result = await service.createOpportunity(
        {
          name: 'Gia hạn hợp đồng dịch vụ',
          customerId: 'cust_01',
          stage: OpportunityStage.NEGOTIATION,
          expectedValue: 100000000,
          probability: 90,
        },
        mockSalesUser1
      );

      expect(mockRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          stage: 'NEGOTIATION',
          probability: 90,
        })
      );
      expect(result.probability).toBe(90);
    });

    it('3. should use default probabilities for all stages (NEEDS_ANALYSIS, PROPOSAL, NEGOTIATION, WON, LOST)', async () => {
      (prisma.customer.findUnique as jest.Mock).mockResolvedValue(mockCustomer);

      const stageTests = [
        { stage: OpportunityStage.NEEDS_ANALYSIS, expectedProb: 20 },
        { stage: OpportunityStage.PROPOSAL, expectedProb: 50 },
        { stage: OpportunityStage.NEGOTIATION, expectedProb: 75 },
        { stage: OpportunityStage.WON, expectedProb: 100 },
        { stage: OpportunityStage.LOST, expectedProb: 0 },
      ];

      for (const t of stageTests) {
        mockRepo.create.mockResolvedValue({
          id: `opp_${t.stage}`,
          name: 'Test',
          customerId: 'cust_01',
          stage: t.stage,
          probability: t.expectedProb,
          customer: mockCustomer,
          createdAt: new Date(),
          updatedAt: new Date(),
        });

        await service.createOpportunity(
          {
            name: 'Test',
            customerId: 'cust_01',
            stage: t.stage,
          },
          mockSalesUser1
        );

        expect(mockRepo.create).toHaveBeenCalledWith(
          expect.objectContaining({
            stage: t.stage,
            probability: t.expectedProb,
          })
        );
      }
    });

    it('4. should throw NotFoundError when customerId does not exist', async () => {
      (prisma.customer.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(
        service.createOpportunity(
          {
            name: 'Hợp đồng mới',
            customerId: 'non_existent_customer',
          },
          mockSalesUser1
        )
      ).rejects.toThrow(NotFoundError);
    });

    it('5. should throw NotFoundError when primaryContactId does not exist', async () => {
      (prisma.customer.findUnique as jest.Mock).mockResolvedValue(mockCustomer);
      (prisma.contact.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(
        service.createOpportunity(
          {
            name: 'Hợp đồng mới',
            customerId: 'cust_01',
            primaryContactId: 'non_existent_contact',
          },
          mockSalesUser1
        )
      ).rejects.toThrow(NotFoundError);
    });

    it('6. should throw BadRequestError when contact belongs to a different customer', async () => {
      (prisma.customer.findUnique as jest.Mock).mockResolvedValue(mockCustomer);
      (prisma.contact.findUnique as jest.Mock).mockResolvedValue({
        id: 'contact_other',
        name: 'Người liên hệ cty khác',
        customerId: 'different_customer_id', // Different customer!
      });

      await expect(
        service.createOpportunity(
          {
            name: 'Hợp đồng mới',
            customerId: 'cust_01',
            primaryContactId: 'contact_other',
          },
          mockSalesUser1
        )
      ).rejects.toThrow(BadRequestError);
    });

    it('7. should throw ValidationError when expectedCloseDate is in the past', async () => {
      (prisma.customer.findUnique as jest.Mock).mockResolvedValue(mockCustomer);

      await expect(
        service.createOpportunity(
          {
            name: 'Hợp đồng mới',
            customerId: 'cust_01',
            expectedCloseDate: '2020-01-01', // definitely in the past
          },
          mockSalesUser1
        )
      ).rejects.toThrow(ValidationError);
    });

    it('8. should allow creating multiple parallel opportunities for the same customer', async () => {
      (prisma.customer.findUnique as jest.Mock).mockResolvedValue(mockCustomer);

      mockRepo.create
        .mockResolvedValueOnce({
          id: 'opp_p1',
          name: 'Cơ hội 1',
          customerId: 'cust_01',
          stage: 'QUALIFICATION',
          customer: mockCustomer,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .mockResolvedValueOnce({
          id: 'opp_p2',
          name: 'Cơ hội 2',
          customerId: 'cust_01',
          stage: 'PROPOSAL',
          customer: mockCustomer,
          createdAt: new Date(),
          updatedAt: new Date(),
        });

      const opp1 = await service.createOpportunity(
        { name: 'Cơ hội 1', customerId: 'cust_01' },
        mockSalesUser1
      );
      const opp2 = await service.createOpportunity(
        { name: 'Cơ hội 2', customerId: 'cust_01' },
        mockSalesUser1
      );

      expect(opp1.id).toBe('opp_p1');
      expect(opp2.id).toBe('opp_p2');
      expect(opp1.customerId).toBe(opp2.customerId);
    });
  });

  describe('getOpportunities', () => {
    it('1. should return list of opportunities with pagination metadata', async () => {
      mockRepo.findMany.mockResolvedValue([
        {
          id: 'opp_01',
          name: 'Deal 1',
          customerId: 'cust_01',
          stage: 'QUALIFICATION',
          probability: 10,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]);
      mockRepo.count.mockResolvedValue(1);

      const result = await service.getOpportunities(
        { page: 1, limit: 10, sortBy: 'createdAt', sortOrder: 'desc' },
        mockAdminUser
      );

      expect(result.items.length).toBe(1);
      expect(result.pagination.total).toBe(1);
      expect(result.pagination.totalPages).toBe(1);
    });

    it('2. should filter by ownerId when user dataScope is OWN', async () => {
      mockRepo.findMany.mockResolvedValue([]);
      mockRepo.count.mockResolvedValue(0);

      await service.getOpportunities(
        { page: 1, limit: 10, sortBy: 'createdAt', sortOrder: 'desc' },
        mockSalesUser1 // dataScope: OWN
      );

      expect(mockRepo.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            ownerId: 'usr_sales_1',
          }),
        })
      );
    });
  });

  describe('getOpportunityById', () => {
    it('1. should return opportunity details when exists', async () => {
      mockRepo.findById.mockResolvedValue({
        id: 'opp_01',
        name: 'Deal 1',
        customerId: 'cust_01',
        stage: 'PROPOSAL',
        probability: 50,
        ownerId: 'usr_sales_1',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const opp = await service.getOpportunityById('opp_01', mockSalesUser1);
      expect(opp.id).toBe('opp_01');
      expect(opp.stage).toBe('PROPOSAL');
    });

    it('2. should throw NotFoundError when opportunity does not exist', async () => {
      mockRepo.findById.mockResolvedValue(null);

      await expect(service.getOpportunityById('opp_999', mockAdminUser)).rejects.toThrow(
        NotFoundError
      );
    });

    it('3. should throw ForbiddenError when user has OWN dataScope and is not owner', async () => {
      mockRepo.findById.mockResolvedValue({
        id: 'opp_01',
        name: 'Deal 1',
        customerId: 'cust_01',
        stage: 'PROPOSAL',
        ownerId: 'usr_sales_1', // Owned by sales_1
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await expect(
        service.getOpportunityById('opp_01', mockSalesUser2) // Sales 2 accesses
      ).rejects.toThrow(ForbiddenError);
    });
  });

  describe('updateOpportunity', () => {
    it('1. should update opportunity fields successfully', async () => {
      mockRepo.findById.mockResolvedValue({
        id: 'opp_01',
        customerId: 'cust_01',
        ownerId: 'usr_sales_1',
      });

      mockRepo.update.mockResolvedValue({
        id: 'opp_01',
        name: 'Tên mới',
        customerId: 'cust_01',
        stage: 'PROPOSAL',
        probability: 50,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const updated = await service.updateOpportunity(
        'opp_01',
        { name: 'Tên mới', stage: OpportunityStage.PROPOSAL },
        mockSalesUser1
      );

      expect(updated.name).toBe('Tên mới');
      expect(mockRepo.update).toHaveBeenCalledWith(
        'opp_01',
        expect.objectContaining({
          name: 'Tên mới',
          stage: 'PROPOSAL',
          probability: 50, // Auto-updated default for new stage
        })
      );
    });

    it('2. should throw NotFoundError if opportunity does not exist', async () => {
      mockRepo.findById.mockResolvedValue(null);

      await expect(
        service.updateOpportunity('opp_999', { name: 'Update' }, mockAdminUser)
      ).rejects.toThrow(NotFoundError);
    });

    it('3. should throw ForbiddenError if user has OWN dataScope and is not owner', async () => {
      mockRepo.findById.mockResolvedValue({
        id: 'opp_01',
        customerId: 'cust_01',
        ownerId: 'usr_sales_1',
      });

      await expect(
        service.updateOpportunity('opp_01', { name: 'Hack' }, mockSalesUser2)
      ).rejects.toThrow(ForbiddenError);
    });
  });

  describe('updateOpportunityStage', () => {
    it('1. should update stage and set default probability when probability is omitted', async () => {
      mockRepo.findById.mockResolvedValue({
        id: 'opp_01',
        customerId: 'cust_01',
        ownerId: 'usr_sales_1',
      });

      mockRepo.update.mockResolvedValue({
        id: 'opp_01',
        stage: 'WON',
        probability: 100,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const updated = await service.updateOpportunityStage(
        'opp_01',
        { stage: OpportunityStage.WON },
        mockSalesUser1
      );

      expect(mockRepo.update).toHaveBeenCalledWith('opp_01', {
        stage: 'WON',
        probability: 100,
      });
      expect(updated.stage).toBe('WON');
      expect(updated.probability).toBe(100);
    });

    it('2. should update stage with custom probability when provided', async () => {
      mockRepo.findById.mockResolvedValue({
        id: 'opp_01',
        customerId: 'cust_01',
        ownerId: 'usr_sales_1',
      });

      mockRepo.update.mockResolvedValue({
        id: 'opp_01',
        stage: 'NEGOTIATION',
        probability: 80, // Custom probability
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const updated = await service.updateOpportunityStage(
        'opp_01',
        { stage: OpportunityStage.NEGOTIATION, probability: 80 },
        mockSalesUser1
      );

      expect(mockRepo.update).toHaveBeenCalledWith('opp_01', {
        stage: 'NEGOTIATION',
        probability: 80,
      });
      expect(updated.probability).toBe(80);
    });
  });
});
