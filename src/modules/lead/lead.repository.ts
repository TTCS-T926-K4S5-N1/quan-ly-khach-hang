import { Prisma, Lead } from '@prisma/client';
import { prisma } from '../../config/prisma';
import { BadRequestError } from '../../errors/appError';

export interface FindLeadsFilter {
  skip: number;
  take: number;
  search?: string;
  source?: string;
  status?: string;
}

export class LeadRepository {
  /**
   * Create a single lead
   */
  async create(data: Prisma.LeadCreateInput): Promise<Lead> {
    return prisma.lead.create({ data });
  }

  /**
   * Find a lead by ID
   */
  async findById(id: string): Promise<Lead | null> {
    return prisma.lead.findUnique({ where: { id } });
  }

  /**
   * Find a lead by phone number
   */
  async findByPhone(phone: string): Promise<Lead | null> {
    if (!phone) return null;
    return prisma.lead.findFirst({ where: { phone } });
  }

  /**
   * Find a lead by email
   */
  async findByEmail(email: string): Promise<Lead | null> {
    if (!email) return null;
    return prisma.lead.findFirst({ where: { email } });
  }

  /**
   * Find all existing phones from a given list
   */
  async findExistingPhones(phones: string[]): Promise<string[]> {
    const validPhones = phones.filter(Boolean);
    if (validPhones.length === 0) return [];

    const existing = await prisma.lead.findMany({
      where: {
        phone: { in: validPhones },
      },
      select: { phone: true },
    });

    return existing.map((l) => l.phone).filter(Boolean) as string[];
  }

  /**
   * Find all existing emails from a given list
   */
  async findExistingEmails(emails: string[]): Promise<string[]> {
    const validEmails = emails.filter(Boolean);
    if (validEmails.length === 0) return [];

    const existing = await prisma.lead.findMany({
      where: {
        email: { in: validEmails },
      },
      select: { email: true },
    });

    return existing.map((l) => l.email).filter(Boolean) as string[];
  }

  /**
   * Batch create leads inside a transaction for atomic and safe execution
   */
  async batchCreate(leads: Prisma.LeadCreateInput[]): Promise<Lead[]> {
    if (leads.length === 0) return [];

    return prisma.$transaction(async (tx) => {
      const created: Lead[] = [];
      for (const leadData of leads) {
        const item = await tx.lead.create({ data: leadData });
        created.push(item);
      }
      return created;
    });
  }

  /**
   * Find leads with pagination, search and filtering
   */
  async findLeads(filter: FindLeadsFilter): Promise<{ items: Lead[]; total: number }> {
    const { skip, take, search, source, status } = filter;

    const where: Prisma.LeadWhereInput = {};

    if (source && source.trim() !== '') {
      where.source = source.trim();
    }

    if (status && status.trim() !== '') {
      where.status = status.trim();
    }

    if (search && search.trim() !== '') {
      const searchTerm = search.trim();
      where.OR = [
        { fullName: { contains: searchTerm } },
        { phone: { contains: searchTerm } },
        { email: { contains: searchTerm } },
        { company: { contains: searchTerm } },
        { leadCode: { contains: searchTerm } },
      ];
    }

    const [items, total] = await Promise.all([
      prisma.lead.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      prisma.lead.count({ where }),
    ]);

    return { items, total };
  }

  /**
   * Find a lead with converted entities and activity history
   */
  async findByIdWithDetails(id: string) {
    return prisma.lead.findUnique({
      where: { id },
      include: {
        customer: true,
        contact: true,
        opportunity: true,
        activities: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });
  }

  /**
   * Execute Lead conversion inside database transaction
   */
  async convertLead(
    leadId: string,
    params: {
      userId?: string;
      customerName?: string;
      customerCode?: string;
      contactName?: string;
      opportunityName?: string;
      opportunityAmount?: number;
      opportunityStage?: string;
      opportunityCloseDate?: string;
      notes?: string;
    }
  ) {
    return prisma.$transaction(async (tx) => {
      // 1. Fetch current lead state inside transaction
      const currentLead = await tx.lead.findUnique({
        where: { id: leadId },
      });

      if (!currentLead) {
        throw new BadRequestError('Không tìm thấy Lead để chuyển đổi');
      }

      if (currentLead.status === 'CONVERTED') {
        throw new BadRequestError('Lead này đã được chuyển đổi trước đó, không thể chuyển đổi lần thứ hai');
      }

      const uniqueSuffix = `${Date.now().toString().slice(-6)}${Math.floor(100 + Math.random() * 900)}`;

      // 2. Identify or create Customer
      const targetCustomerName =
        params.customerName?.trim() ||
        currentLead.company?.trim() ||
        currentLead.fullName.trim();

      const orCustomerConditions: Prisma.CustomerWhereInput[] = [];
      if (currentLead.phone) orCustomerConditions.push({ phone: currentLead.phone });
      if (currentLead.email) orCustomerConditions.push({ email: currentLead.email });
      if (targetCustomerName) orCustomerConditions.push({ customerName: targetCustomerName });

      let customer = orCustomerConditions.length > 0
        ? await tx.customer.findFirst({
            where: { OR: orCustomerConditions },
          })
        : null;

      if (!customer) {
        const customerCode =
          params.customerCode?.trim() ||
          `CUST-${new Date().getFullYear()}-${uniqueSuffix}`;

        customer = await tx.customer.create({
          data: {
            customerCode,
            customerName: targetCustomerName,
            phone: currentLead.phone,
            email: currentLead.email,
            address: currentLead.address,
            careStatus: 'NEEDS_CARE',
            syncedAt: new Date(),
          },
        });
      }

      // 3. Identify or create Contact
      const targetContactName = params.contactName?.trim() || currentLead.fullName.trim();
      const orContactConditions: Prisma.ContactWhereInput[] = [];
      if (currentLead.phone) orContactConditions.push({ phone: currentLead.phone });
      if (currentLead.email) orContactConditions.push({ email: currentLead.email });
      orContactConditions.push({ name: targetContactName });

      let contact = await tx.contact.findFirst({
        where: {
          customerId: customer.id,
          OR: orContactConditions,
        },
      });

      if (!contact) {
        const contactCode = `CONT-${new Date().getFullYear()}-${uniqueSuffix}`;
        contact = await tx.contact.create({
          data: {
            contactCode,
            customerId: customer.id,
            name: targetContactName,
            email: currentLead.email,
            phone: currentLead.phone,
            jobTitle: currentLead.jobTitle,
            address: currentLead.address,
            isPrimary: true,
          },
        });
      }

      // 4. Create Opportunity
      const oppSuffix = `${Date.now().toString().slice(-6)}${Math.floor(100 + Math.random() * 900)}`;
      const oppCode = `OPP-${new Date().getFullYear()}-${oppSuffix}`;
      const targetOppName =
        params.opportunityName?.trim() ||
        `Cơ hội bán hàng - ${customer.customerName}`;
      const stage = params.opportunityStage?.trim() || 'QUALIFICATION';
      const amount = typeof params.opportunityAmount === 'number' ? params.opportunityAmount : null;
      const closeDate = params.opportunityCloseDate ? new Date(params.opportunityCloseDate) : null;
      const description = params.notes?.trim() || currentLead.notes || null;

      const opportunity = await tx.opportunity.create({
        data: {
          opportunityCode: oppCode,
          name: targetOppName,
          customerId: customer.id,
          contactId: contact.id,
          stage,
          amount,
          closeDate,
          source: currentLead.source,
          description,
          ownerId: params.userId || currentLead.createdById || null,
        },
      });

      // 5. Update Lead atomically (ensure no concurrent duplicate conversion)
      const updateResult = await tx.lead.updateMany({
        where: {
          id: currentLead.id,
          status: { not: 'CONVERTED' },
        },
        data: {
          status: 'CONVERTED',
          convertedAt: new Date(),
          convertedCustomerId: customer.id,
          convertedContactId: contact.id,
          convertedOpportunityId: opportunity.id,
        },
      });

      if (updateResult.count === 0) {
        throw new BadRequestError('Lead này đã được chuyển đổi trước đó, không thể chuyển đổi lần thứ hai');
      }

      // 6. Record Customer Care history and Lead activity
      await tx.customerCareHistory.create({
        data: {
          customerId: customer.id,
          contactedById: params.userId || null,
          contactedAt: new Date(),
          note: `Chuyển đổi từ Lead (${currentLead.leadCode || currentLead.fullName}). Nguồn: ${currentLead.source}.${
            currentLead.notes ? ' Ghi chú: ' + currentLead.notes : ''
          }`,
          channel: 'LEAD_CONVERSION',
        },
      });

      await tx.leadActivity.create({
        data: {
          leadId: currentLead.id,
          action: 'CONVERTED',
          description: `Chuyển đổi thành công: Khách hàng '${customer.customerName}', Liên hệ '${contact.name}', Cơ hội '${opportunity.name}'`,
          performedById: params.userId || null,
        },
      });

      return {
        leadId: currentLead.id,
        status: 'CONVERTED',
        customer: {
          id: customer.id,
          customerCode: customer.customerCode,
          name: customer.customerName,
          customerName: customer.customerName,
          phone: customer.phone,
          email: customer.email,
        },
        contact: {
          id: contact.id,
          name: contact.name,
          email: contact.email,
          phone: contact.phone,
          jobTitle: contact.jobTitle,
        },
        opportunity: {
          id: opportunity.id,
          name: opportunity.name,
          status: opportunity.stage,
          stage: opportunity.stage,
          amount: opportunity.amount,
          closeDate: opportunity.closeDate,
        },
      };
    });
  }
}

export const leadRepository = new LeadRepository();
