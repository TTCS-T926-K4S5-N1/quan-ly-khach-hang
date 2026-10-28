import { prisma } from '../../config/prisma';
import { OpportunityStage } from '../../constants/opportunity.constant';
import { Prisma } from '@prisma/client';
import { SetSalesTargetDto, GetSalesTargetsQueryDto } from './dto/salesTarget.dto';

export class SalesRepository {
  /**
   * Lấy danh sách các cơ hội bán hàng hợp lệ trong khoảng thời gian được chỉ định
   */
  async findOpportunitiesInPeriod(params: {
    startDate: Date;
    endDate: Date;
    ownerId?: string;
    ownerIds?: string[];
  }) {
    const { startDate, endDate, ownerId, ownerIds } = params;

    const where: Prisma.OpportunityWhereInput = {
      AND: [
        {
          stage: { not: OpportunityStage.LOST },
        },
        {
          OR: [
            {
              expectedCloseDate: {
                gte: startDate,
                lte: endDate,
              },
            },
            {
              expectedCloseDate: null,
              closeDate: {
                gte: startDate,
                lte: endDate,
              },
            },
            {
              expectedCloseDate: null,
              closeDate: null,
              createdAt: {
                gte: startDate,
                lte: endDate,
              },
            },
          ],
        },
      ],
    };

    if (ownerId) {
      where.ownerId = ownerId;
    } else if (ownerIds && ownerIds.length > 0) {
      where.ownerId = { in: ownerIds };
    }

    return prisma.opportunity.findMany({
      where,
      include: {
        customer: {
          select: {
            id: true,
            customerCode: true,
            customerName: true,
          },
        },
        contact: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
      },
      orderBy: [
        { expectedCloseDate: 'asc' },
        { createdAt: 'desc' },
      ],
    });
  }

  /**
   * Lấy danh sách nhân viên kinh doanh kèm thông tin nhóm
   */
  async findSalesEmployees(filter?: { employeeId?: string; groupId?: string; userIds?: string[] }) {
    const where: Prisma.UserWhereInput = {};

    if (filter?.employeeId) {
      where.id = filter.employeeId;
    } else if (filter?.userIds && filter.userIds.length > 0) {
      where.id = { in: filter.userIds };
    }

    if (filter?.groupId) {
      where.groupId = filter.groupId;
    }

    return prisma.user.findMany({
      where,
      include: {
        group: true,
      },
      orderBy: { name: 'asc' },
    });
  }

  /**
   * Lấy danh sách các nhóm kinh doanh
   */
  async findSalesGroups(filter?: { groupId?: string; groupIds?: string[] }) {
    const where: Prisma.SalesGroupWhereInput = {};

    if (filter?.groupId) {
      where.id = filter.groupId;
    } else if (filter?.groupIds && filter.groupIds.length > 0) {
      where.id = { in: filter.groupIds };
    }

    return prisma.salesGroup.findMany({
      where,
      include: {
        members: true,
      },
      orderBy: { name: 'asc' },
    });
  }

  /**
   * Lấy chỉ tiêu doanh số theo kỳ
   */
  async findSalesTargets(params: {
    year: number;
    periodType: string;
    month?: number;
    quarter?: number;
    userId?: string;
    userIds?: string[];
    groupId?: string;
    groupIds?: string[];
  }) {
    const where: Prisma.SalesTargetWhereInput = {
      year: params.year,
      periodType: params.periodType.toUpperCase(),
    };

    if (params.month !== undefined) {
      where.month = params.month;
    }
    if (params.quarter !== undefined) {
      where.quarter = params.quarter;
    }

    if (params.userId) {
      where.userId = params.userId;
    } else if (params.userIds && params.userIds.length > 0) {
      where.userId = { in: params.userIds };
    }

    if (params.groupId) {
      where.groupId = params.groupId;
    } else if (params.groupIds && params.groupIds.length > 0) {
      where.groupId = { in: params.groupIds };
    }

    return prisma.salesTarget.findMany({
      where,
      include: {
        user: true,
        group: true,
      },
    });
  }

  /**
   * Tạo hoặc cập nhật chỉ tiêu doanh số
   */
  async setSalesTarget(dto: SetSalesTargetDto) {
    const periodType = dto.periodType.toUpperCase();
    const existing = await prisma.salesTarget.findFirst({
      where: {
        year: dto.year,
        periodType,
        month: dto.month ?? null,
        quarter: dto.quarter ?? null,
        userId: dto.userId ?? null,
        groupId: dto.groupId ?? null,
      },
    });

    if (existing) {
      return prisma.salesTarget.update({
        where: { id: existing.id },
        data: {
          targetValue: dto.targetValue,
        },
        include: {
          user: true,
          group: true,
        },
      });
    }

    return prisma.salesTarget.create({
      data: {
        targetValue: dto.targetValue,
        periodType,
        year: dto.year,
        month: dto.month ?? null,
        quarter: dto.quarter ?? null,
        userId: dto.userId ?? null,
        groupId: dto.groupId ?? null,
      },
      include: {
        user: true,
        group: true,
      },
    });
  }

  /**
   * Lấy danh sách chỉ tiêu theo query filter
   */
  async listSalesTargets(query: GetSalesTargetsQueryDto) {
    const where: Prisma.SalesTargetWhereInput = {};
    if (query.year) where.year = query.year;
    if (query.periodType) where.periodType = query.periodType.toUpperCase();
    if (query.month) where.month = query.month;
    if (query.quarter) where.quarter = query.quarter;
    if (query.userId) where.userId = query.userId;
    if (query.groupId) where.groupId = query.groupId;

    return prisma.salesTarget.findMany({
      where,
      include: {
        user: true,
        group: true,
      },
      orderBy: [{ year: 'desc' }, { createdAt: 'desc' }],
    });
  }
}

export const salesRepository = new SalesRepository();
