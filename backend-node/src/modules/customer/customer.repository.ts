import { Prisma } from '@prisma/client';
import { prisma } from '../../config/prisma';
import { CareStatus } from '../../constants/careStatus.constant';

export interface FindCustomersCareFilter {
  thresholdDate: Date;
  search?: string;
  skip: number;
  take: number;
}

export class CustomerRepository {
  /**
   * Find customers needing care based on lastContactAt threshold and search query
   */
  async findCustomersNeedingCare(filter: FindCustomersCareFilter) {
    const { thresholdDate, search, skip, take } = filter;

    const whereCondition: Prisma.CustomerWhereInput = {
      OR: [
        { lastContactAt: null },
        { lastContactAt: { lte: thresholdDate } },
      ],
    };

    if (search && search.trim() !== '') {
      const searchTerm = search.trim();
      whereCondition.AND = [
        {
          OR: [
            { customerName: { contains: searchTerm } },
            { customerCode: { contains: searchTerm } },
            { phone: { contains: searchTerm } },
            { email: { contains: searchTerm } },
          ],
        },
      ];
    }

    const [items, total] = await Promise.all([
      prisma.customer.findMany({
        where: whereCondition,
        include: {
          contracts: {
            select: {
              id: true,
              contractNumber: true,
              status: true,
              startDate: true,
              endDate: true,
              value: true,
            },
            orderBy: {
              endDate: 'desc',
            },
          },
        },
        orderBy: [
          { syncedAt: 'desc' },
          { createdAt: 'desc' },
        ],
        skip,
        take,
      }),
      prisma.customer.count({
        where: whereCondition,
      }),
    ]);

    return { items, total };
  }

  /**
   * Find customer by ID with contracts and recent care histories
   */
  async findById(customerId: string) {
    return prisma.customer.findUnique({
      where: { id: customerId },
      include: {
        contracts: true,
        careHistories: {
          orderBy: { contactedAt: 'desc' },
          take: 5,
        },
      },
    });
  }

  /**
   * Record contact interaction and update customer's last contact info in a transaction
   */
  async recordContact(
    customerId: string,
    contactedAt: Date,
    note?: string,
    channel: string = 'PHONE',
    userId?: string
  ) {
    return prisma.$transaction(async (tx) => {
      // 1. Create care history entry
      const history = await tx.customerCareHistory.create({
        data: {
          customerId,
          contactedById: userId || null,
          contactedAt,
          note: note || null,
          channel,
        },
      });

      // 2. Update customer record
      const updatedCustomer = await tx.customer.update({
        where: { id: customerId },
        data: {
          lastContactAt: contactedAt,
          lastContactNote: note || null,
          careStatus: CareStatus.CONTACTED,
        },
        include: {
          contracts: true,
        },
      });

      return { updatedCustomer, history };
    });
  }
}

export const customerRepository = new CustomerRepository();
