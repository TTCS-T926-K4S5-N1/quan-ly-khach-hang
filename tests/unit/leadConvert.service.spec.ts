import { LeadService } from '../../src/modules/lead/lead.service';
import { LeadRepository } from '../../src/modules/lead/lead.repository';
import { BadRequestError, NotFoundError, ForbiddenError } from '../../src/errors/appError';
import { UserRole } from '../../src/constants/permissions.constant';
import { AuthUser } from '../../src/middlewares/auth.middleware';

describe('LeadService - Convert Lead Unit Tests (SCRUM-70)', () => {
  let leadService: LeadService;
  let mockLeadRepo: jest.Mocked<LeadRepository>;

  const mockUserAdmin: AuthUser = {
    id: 'user_admin',
    username: 'admin',
    name: 'Admin User',
    role: UserRole.ADMIN,
    permissions: ['LEAD_CONVERT'],
    dataScope: 'ALL',
  };

  const mockUserSales: AuthUser = {
    id: 'user_sales_1',
    username: 'sales_1',
    name: 'Sales Rep 1',
    role: UserRole.SALES,
    permissions: ['LEAD_CONVERT'],
    dataScope: 'OWN',
  };

  beforeEach(() => {
    mockLeadRepo = {
      create: jest.fn(),
      findById: jest.fn(),
      findByPhone: jest.fn(),
      findByEmail: jest.fn(),
      findExistingPhones: jest.fn(),
      findExistingEmails: jest.fn(),
      batchCreate: jest.fn(),
      findLeads: jest.fn(),
      findByIdWithDetails: jest.fn(),
      convertLead: jest.fn(),
    } as unknown as jest.Mocked<LeadRepository>;

    leadService = new LeadService(mockLeadRepo);
  });

  const baseLead = {
    id: 'lead_123',
    leadCode: 'LEAD-2026-00123',
    fullName: 'Lê Văn Cường',
    phone: '0912345678',
    email: 'cuong.le@company.com',
    company: 'Công ty Cổ phần Toàn Cầu',
    jobTitle: 'Giám đốc Công nghệ',
    address: 'Quận 1, TP. HCM',
    source: 'CONFERENCE',
    status: 'NEW',
    notes: 'Quan tâm giải pháp chuyển đổi số',
    createdById: 'user_sales_1',
    convertedAt: null,
    convertedCustomerId: null,
    convertedContactId: null,
    convertedOpportunityId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  it('1. should convert lead successfully with default mapping', async () => {
    mockLeadRepo.findById.mockResolvedValue({ ...baseLead });
    mockLeadRepo.convertLead.mockResolvedValue({
      leadId: 'lead_123',
      status: 'CONVERTED',
      customer: {
        id: 'cust_001',
        customerCode: 'CUST-2026-0001',
        name: 'Công ty Cổ phần Toàn Cầu',
        customerName: 'Công ty Cổ phần Toàn Cầu',
        phone: '0912345678',
        email: 'cuong.le@company.com',
      },
      contact: {
        id: 'cont_001',
        name: 'Lê Văn Cường',
        email: 'cuong.le@company.com',
        phone: '0912345678',
        jobTitle: 'Giám đốc Công nghệ',
      },
      opportunity: {
        id: 'opp_001',
        name: 'Cơ hội bán hàng - Công ty Cổ phần Toàn Cầu',
        status: 'QUALIFICATION',
        stage: 'QUALIFICATION',
        amount: null,
        closeDate: null,
      },
    });

    const result = await leadService.convertLead('lead_123', {}, mockUserAdmin);

    expect(mockLeadRepo.findById).toHaveBeenCalledWith('lead_123');
    expect(mockLeadRepo.convertLead).toHaveBeenCalledWith('lead_123', {
      userId: 'user_admin',
    });
    expect(result.status).toBe('CONVERTED');
    expect(result.customer.name).toBe('Công ty Cổ phần Toàn Cầu');
    expect(result.contact.name).toBe('Lê Văn Cường');
    expect(result.opportunity.name).toBe('Cơ hội bán hàng - Công ty Cổ phần Toàn Cầu');
  });

  it('2. should convert lead successfully with custom body overrides', async () => {
    mockLeadRepo.findById.mockResolvedValue({ ...baseLead });
    mockLeadRepo.convertLead.mockResolvedValue({
      leadId: 'lead_123',
      status: 'CONVERTED',
      customer: {
        id: 'cust_001',
        customerCode: 'CUST-CUSTOM-99',
        name: 'Tập đoàn Toàn Cầu Holdings',
        customerName: 'Tập đoàn Toàn Cầu Holdings',
        phone: '0912345678',
        email: 'cuong.le@company.com',
      },
      contact: {
        id: 'cont_001',
        name: 'Lê Văn Cường (VIP)',
        email: 'cuong.le@company.com',
        phone: '0912345678',
        jobTitle: 'Giám đốc Công nghệ',
      },
      opportunity: {
        id: 'opp_001',
        name: 'Dự án ERP 2026',
        status: 'PROPOSAL',
        stage: 'PROPOSAL',
        amount: 250000000,
        closeDate: new Date('2026-11-30'),
      },
    });

    const result = await leadService.convertLead(
      'lead_123',
      {
        customerName: 'Tập đoàn Toàn Cầu Holdings',
        customerCode: 'CUST-CUSTOM-99',
        contactName: 'Lê Văn Cường (VIP)',
        opportunityName: 'Dự án ERP 2026',
        opportunityAmount: 250000000,
        opportunityStage: 'PROPOSAL',
        opportunityCloseDate: '2026-11-30T00:00:00Z',
      },
      mockUserAdmin
    );

    expect(result.customer.customerCode).toBe('CUST-CUSTOM-99');
    expect(result.opportunity.amount).toBe(250000000);
    expect(result.opportunity.stage).toBe('PROPOSAL');
  });

  it('3. should throw NotFoundError when lead ID does not exist', async () => {
    mockLeadRepo.findById.mockResolvedValue(null);

    await expect(
      leadService.convertLead('non_existent_id', {}, mockUserAdmin)
    ).rejects.toThrow(NotFoundError);
  });

  it('4. should throw BadRequestError when lead has already been converted', async () => {
    mockLeadRepo.findById.mockResolvedValue({
      ...baseLead,
      status: 'CONVERTED',
      convertedAt: new Date(),
    });

    await expect(
      leadService.convertLead('lead_123', {}, mockUserAdmin)
    ).rejects.toThrow(BadRequestError);

    await expect(
      leadService.convertLead('lead_123', {}, mockUserAdmin)
    ).rejects.toThrow(/đã được chuyển đổi trước đó/);
  });

  it('5. should throw BadRequestError when lead status is unqualified (DISQUALIFIED / REJECTED / LOST)', async () => {
    mockLeadRepo.findById.mockResolvedValue({
      ...baseLead,
      status: 'DISQUALIFIED',
    });

    await expect(
      leadService.convertLead('lead_123', {}, mockUserAdmin)
    ).rejects.toThrow(BadRequestError);

    await expect(
      leadService.convertLead('lead_123', {}, mockUserAdmin)
    ).rejects.toThrow(/không đủ điều kiện để chuyển đổi/);
  });

  it('6. should throw ForbiddenError when user has OWN data scope and tries to convert another creator lead', async () => {
    mockLeadRepo.findById.mockResolvedValue({
      ...baseLead,
      createdById: 'user_sales_2', // Created by sales 2
    });

    // Caller is sales 1 with dataScope: OWN
    await expect(
      leadService.convertLead('lead_123', {}, mockUserSales)
    ).rejects.toThrow(ForbiddenError);

    await expect(
      leadService.convertLead('lead_123', {}, mockUserSales)
    ).rejects.toThrow(/ngoài phạm vi phụ trách/);
  });

  it('7. should allow conversion when user has OWN data scope and is the lead creator', async () => {
    mockLeadRepo.findById.mockResolvedValue({
      ...baseLead,
      createdById: 'user_sales_1', // Matches mockUserSales.id
    });
    mockLeadRepo.convertLead.mockResolvedValue({
      leadId: 'lead_123',
      status: 'CONVERTED',
      customer: { id: 'c1', customerCode: 'C1', name: 'Cust', customerName: 'Cust', phone: null, email: null },
      contact: { id: 'ct1', name: 'Contact', email: null, phone: null, jobTitle: null },
      opportunity: { id: 'o1', name: 'Opp', status: 'QUALIFICATION', stage: 'QUALIFICATION', amount: null, closeDate: null },
    });

    const result = await leadService.convertLead('lead_123', {}, mockUserSales);
    expect(result.status).toBe('CONVERTED');
  });

  it('8. should allow conversion for any lead creator if user is ADMIN', async () => {
    mockLeadRepo.findById.mockResolvedValue({
      ...baseLead,
      createdById: 'other_sales_agent',
    });
    mockLeadRepo.convertLead.mockResolvedValue({
      leadId: 'lead_123',
      status: 'CONVERTED',
      customer: { id: 'c1', customerCode: 'C1', name: 'Cust', customerName: 'Cust', phone: null, email: null },
      contact: { id: 'ct1', name: 'Contact', email: null, phone: null, jobTitle: null },
      opportunity: { id: 'o1', name: 'Opp', status: 'QUALIFICATION', stage: 'QUALIFICATION', amount: null, closeDate: null },
    });

    const result = await leadService.convertLead('lead_123', {}, mockUserAdmin);
    expect(result.status).toBe('CONVERTED');
  });
});
