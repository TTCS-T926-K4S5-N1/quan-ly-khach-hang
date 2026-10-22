import { Prisma, Lead } from '@prisma/client';
import { prisma } from '../../config/prisma';

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
}

export const leadRepository = new LeadRepository();
