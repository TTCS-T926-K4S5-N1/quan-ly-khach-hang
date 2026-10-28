import { prisma } from '../../config/prisma';
import { SalesRepository, salesRepository } from './sales.repository';
import { GetForecastQueryDto } from './dto/getForecastQuery.dto';
import { SetSalesTargetDto, GetSalesTargetsQueryDto } from './dto/salesTarget.dto';
import {
  ForecastPeriodType,
  calculatePeriodDateRange,
  roundMoney,
  calculateAchievementRate,
  evaluateComparisonStatus,
  ComparisonStatus,
  DateRange,
} from './sales.constant';
import { OpportunityStage, STAGE_DEFAULT_PROBABILITY } from '../../constants/opportunity.constant';
import { AuthUser } from '../../middlewares/auth.middleware';
import { UserRole } from '../../constants/permissions.constant';
import { ForbiddenError, NotFoundError } from '../../errors/appError';

export interface CalculatedOpportunity {
  id: string;
  opportunityCode: string | null;
  name: string;
  stage: string;
  value: number;
  probability: number;
  weightedValue: number;
  isWon: boolean;
  expectedCloseDate: Date | null;
  ownerId: string | null;
  customer: {
    id: string;
    customerCode: string;
    customerName: string;
  } | null;
}

export interface ForecastSummary {
  totalOpportunities: number;
  totalOpportunityValue: number;
  weightedForecast: number;
  salesTarget: number;
  actualRevenue: number;
  targetAchievementRate: number;
  projectedRevenue: number;
  wonOpportunitiesCount: number;
  pipelineOpportunitiesCount: number;
  actualAchievementRate?: number;
  totalProjectedAchievementRate?: number;
}

export const STAGE_DISPLAY_NAMES: Record<string, string> = {
  [OpportunityStage.QUALIFICATION]: 'Đánh giá & Thẩm định',
  [OpportunityStage.NEEDS_ANALYSIS]: 'Phân tích nhu cầu',
  [OpportunityStage.PROPOSAL]: 'Đề xuất giải pháp',
  [OpportunityStage.NEGOTIATION]: 'Thương lượng & Đàm phán',
  [OpportunityStage.WON]: 'Thành công (Won)',
  [OpportunityStage.LOST]: 'Thất bại (Lost)',
};

export class SalesService {
  constructor(private readonly repo: SalesRepository = salesRepository) {}

  /**
   * Tính toán các thông số dự báo cho một danh sách cơ hội
   */
  private processOpportunities(rawOpps: any[]): {
    calculatedOpps: CalculatedOpportunity[];
    pipelineOpps: CalculatedOpportunity[];
    wonOpps: CalculatedOpportunity[];
    totalOpportunityValue: number;
    weightedForecast: number;
    actualRevenue: number;
  } {
    const calculatedOpps: CalculatedOpportunity[] = [];
    const pipelineOpps: CalculatedOpportunity[] = [];
    const wonOpps: CalculatedOpportunity[] = [];

    let totalOpportunityValue = 0;
    let weightedForecast = 0;
    let actualRevenue = 0;

    for (const opp of rawOpps) {
      const stage = (opp.stage || '').toUpperCase();
      // Loại bỏ các cơ hội LOST
      if (stage === OpportunityStage.LOST) {
        continue;
      }

      const value = roundMoney(opp.expectedValue ?? opp.amount ?? 0);
      let probability = opp.probability;
      if (probability === undefined || probability === null || isNaN(probability)) {
        probability = STAGE_DEFAULT_PROBABILITY[stage as OpportunityStage] ?? 10;
      }
      probability = Math.max(0, Math.min(100, probability));

      const isWon = stage === OpportunityStage.WON;
      // Quy tắc SCRUM-77:
      // Xử lý riêng cơ hội WON để tránh cộng trùng vào dự báo doanh số
      let weightedValue = 0;
      if (isWon) {
        actualRevenue = roundMoney(actualRevenue + value);
      } else {
        // Cơ hội đang trong quy trình bán hàng (Pipeline)
        weightedValue = roundMoney(value * (probability / 100));
        totalOpportunityValue = roundMoney(totalOpportunityValue + value);
        weightedForecast = roundMoney(weightedForecast + weightedValue);
      }

      const calculated: CalculatedOpportunity = {
        id: opp.id,
        opportunityCode: opp.opportunityCode,
        name: opp.name,
        stage,
        value,
        probability,
        weightedValue,
        isWon,
        expectedCloseDate: opp.expectedCloseDate || opp.closeDate || null,
        ownerId: opp.ownerId,
        customer: opp.customer,
      };

      calculatedOpps.push(calculated);
      if (isWon) {
        wonOpps.push(calculated);
      } else {
        pipelineOpps.push(calculated);
      }
    }

    return {
      calculatedOpps,
      pipelineOpps,
      wonOpps,
      totalOpportunityValue,
      weightedForecast,
      actualRevenue,
    };
  }

  /**
   * Kiểm tra và áp dụng bộ lọc phân quyền Data Scope
   */
  private async applyDataScope(user?: AuthUser, requestedOwnerId?: string, requestedGroupId?: string) {
    if (!user) {
      return {
        effectiveOwnerId: requestedOwnerId,
        effectiveGroupId: requestedGroupId,
        allowedOwnerIds: undefined as string[] | undefined,
      };
    }

    const isGlobalManager =
      user.role === UserRole.ADMIN ||
      user.role === UserRole.SALES_DIRECTOR ||
      user.role === UserRole.CARE_MANAGER ||
      user.dataScope === 'ALL';

    if (isGlobalManager) {
      return {
        effectiveOwnerId: requestedOwnerId,
        effectiveGroupId: requestedGroupId,
        allowedOwnerIds: undefined,
      };
    }

    // Tra cứu thông tin User và Nhóm trong database
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      include: { group: { include: { members: true } } },
    });

    if (user.dataScope === 'GROUP') {
      const userGroupId = dbUser?.groupId;
      if (!userGroupId) {
        // Nếu user chưa thuộc nhóm nào, fallback về OWN
        return {
          effectiveOwnerId: user.id,
          effectiveGroupId: undefined,
          allowedOwnerIds: [user.id],
        };
      }

      if (requestedGroupId && requestedGroupId !== userGroupId) {
        throw new ForbiddenError('Bạn không có quyền xem dữ liệu của nhóm kinh doanh khác');
      }

      const groupMemberIds = dbUser?.group?.members.map((m) => m.id) || [user.id];

      if (requestedOwnerId && !groupMemberIds.includes(requestedOwnerId)) {
        throw new ForbiddenError('Nhân viên được yêu cầu không thuộc nhóm kinh doanh của bạn');
      }

      return {
        effectiveOwnerId: requestedOwnerId,
        effectiveGroupId: userGroupId,
        allowedOwnerIds: groupMemberIds,
      };
    }

    // Mặc định dataScope === 'OWN'
    if (requestedOwnerId && requestedOwnerId !== user.id) {
      throw new ForbiddenError('Bạn chỉ có quyền xem dữ liệu dự báo bán hàng của chính mình (Data Scope: OWN)');
    }

    return {
      effectiveOwnerId: user.id,
      effectiveGroupId: undefined,
      allowedOwnerIds: [user.id],
    };
  }

  /**
   * 1. GET /api/sales/forecast - Lấy dữ liệu dự báo doanh số tổng hợp
   */
  async getSalesForecast(query: GetForecastQueryDto, user?: AuthUser) {
    const range = calculatePeriodDateRange({
      period: query.period,
      year: query.year,
      month: query.month,
      quarter: query.quarter,
    });

    const { effectiveOwnerId, effectiveGroupId, allowedOwnerIds } = await this.applyDataScope(
      user,
      query.employeeId,
      query.groupId
    );

    // Xác định danh sách ownerIds cần lọc nếu lọc theo nhóm
    let targetOwnerIds = allowedOwnerIds;
    if (effectiveGroupId && !targetOwnerIds) {
      const groupUsers = await prisma.user.findMany({
        where: { groupId: effectiveGroupId },
        select: { id: true },
      });
      targetOwnerIds = groupUsers.map((u) => u.id);
    }

    // Lấy các cơ hội bán hàng trong kỳ
    const rawOpps = await this.repo.findOpportunitiesInPeriod({
      startDate: range.startDate,
      endDate: range.endDate,
      ownerId: effectiveOwnerId,
      ownerIds: targetOwnerIds,
    });

    const {
      calculatedOpps,
      pipelineOpps,
      wonOpps,
      totalOpportunityValue,
      weightedForecast,
      actualRevenue,
    } = this.processOpportunities(rawOpps);

    // Lấy chỉ tiêu doanh số (Sales Target) trong kỳ
    let salesTargetValue = 0;
    const targetQuery: any = {
      year: range.year,
      periodType: range.type,
      month: range.type === ForecastPeriodType.MONTH ? range.month : undefined,
      quarter: range.type === ForecastPeriodType.QUARTER ? range.quarter : undefined,
    };

    if (effectiveOwnerId) {
      targetQuery.userId = effectiveOwnerId;
    } else if (targetOwnerIds && targetOwnerIds.length > 0) {
      targetQuery.userIds = targetOwnerIds;
    } else if (effectiveGroupId) {
      targetQuery.groupId = effectiveGroupId;
    }

    const targets = await this.repo.findSalesTargets(targetQuery);
    salesTargetValue = targets.reduce((sum, t) => roundMoney(sum + t.targetValue), 0);

    const projectedRevenue = roundMoney(actualRevenue + weightedForecast);
    const targetAchievementRate = calculateAchievementRate(weightedForecast, salesTargetValue);
    const actualAchievementRate = calculateAchievementRate(actualRevenue, salesTargetValue);
    const totalProjectedAchievementRate = calculateAchievementRate(projectedRevenue, salesTargetValue);

    // Phân tích chi tiết theo giai đoạn (Stage Breakdown)
    const stageBreakdownMap: Record<string, { count: number; totalValue: number; weightedValue: number }> = {};
    for (const s of Object.values(OpportunityStage)) {
      if (s !== OpportunityStage.LOST) {
        stageBreakdownMap[s] = { count: 0, totalValue: 0, weightedValue: 0 };
      }
    }

    for (const opp of calculatedOpps) {
      if (!stageBreakdownMap[opp.stage]) {
        stageBreakdownMap[opp.stage] = { count: 0, totalValue: 0, weightedValue: 0 };
      }
      stageBreakdownMap[opp.stage].count += 1;
      stageBreakdownMap[opp.stage].totalValue = roundMoney(stageBreakdownMap[opp.stage].totalValue + opp.value);
      stageBreakdownMap[opp.stage].weightedValue = roundMoney(
        stageBreakdownMap[opp.stage].weightedValue + opp.weightedValue
      );
    }

    const stageBreakdown = Object.entries(stageBreakdownMap).map(([stage, stats]) => ({
      stage,
      stageName: STAGE_DISPLAY_NAMES[stage] || stage,
      defaultProbability: STAGE_DEFAULT_PROBABILITY[stage as OpportunityStage] ?? 0,
      count: stats.count,
      totalValue: stats.totalValue,
      weightedValue: stats.weightedValue,
    }));

    return {
      period: {
        type: range.type,
        year: range.year,
        month: range.month,
        quarter: range.quarter,
        startDate: range.startDate.toISOString(),
        endDate: range.endDate.toISOString(),
      },
      summary: {
        totalOpportunities: calculatedOpps.length,
        totalOpportunityValue,
        weightedForecast,
        salesTarget: salesTargetValue,
        actualRevenue,
        targetAchievementRate,
        projectedRevenue,
        wonOpportunitiesCount: wonOpps.length,
        pipelineOpportunitiesCount: pipelineOpps.length,
        actualAchievementRate,
        totalProjectedAchievementRate,
      },
      stageBreakdown,
      pipelineOpportunities: pipelineOpps,
    };
  }

  /**
   * 2. GET /api/sales/forecast/by-employee - Tổng hợp dự báo theo từng nhân viên kinh doanh
   */
  async getForecastByEmployee(query: GetForecastQueryDto, user?: AuthUser) {
    const range = calculatePeriodDateRange({
      period: query.period,
      year: query.year,
      month: query.month,
      quarter: query.quarter,
    });

    const { effectiveOwnerId, effectiveGroupId, allowedOwnerIds } = await this.applyDataScope(
      user,
      query.employeeId,
      query.groupId
    );

    // Lấy danh sách nhân viên cần hiển thị
    const employees = await this.repo.findSalesEmployees({
      employeeId: effectiveOwnerId,
      groupId: effectiveGroupId,
      userIds: allowedOwnerIds,
    });

    const employeeIds = employees.map((e) => e.id);

    // Lấy tất cả cơ hội trong kỳ thuộc danh sách nhân viên
    const rawOpps = await this.repo.findOpportunitiesInPeriod({
      startDate: range.startDate,
      endDate: range.endDate,
      ownerIds: employeeIds.length > 0 ? employeeIds : ['non_existent'],
    });

    // Lấy tất cả chỉ tiêu của các nhân viên này trong kỳ
    const targets = await this.repo.findSalesTargets({
      year: range.year,
      periodType: range.type,
      month: range.type === ForecastPeriodType.MONTH ? range.month : undefined,
      quarter: range.type === ForecastPeriodType.QUARTER ? range.quarter : undefined,
      userIds: employeeIds.length > 0 ? employeeIds : ['non_existent'],
    });

    const targetsByUserId = new Map<string, number>();
    for (const t of targets) {
      if (t.userId) {
        targetsByUserId.set(t.userId, (targetsByUserId.get(t.userId) || 0) + t.targetValue);
      }
    }

    // Nhóm cơ hội theo ownerId
    const oppsByOwnerId = new Map<string, any[]>();
    for (const opp of rawOpps) {
      const owner = opp.ownerId || 'unassigned';
      if (!oppsByOwnerId.has(owner)) {
        oppsByOwnerId.set(owner, []);
      }
      oppsByOwnerId.get(owner)!.push(opp);
    }

    const items = employees.map((emp) => {
      const empOpps = oppsByOwnerId.get(emp.id) || [];
      const {
        calculatedOpps,
        pipelineOpps,
        wonOpps,
        totalOpportunityValue,
        weightedForecast,
        actualRevenue,
      } = this.processOpportunities(empOpps);

      const salesTarget = roundMoney(targetsByUserId.get(emp.id) || 0);
      const projectedRevenue = roundMoney(actualRevenue + weightedForecast);
      const targetAchievementRate = calculateAchievementRate(weightedForecast, salesTarget);
      const actualAchievementRate = calculateAchievementRate(actualRevenue, salesTarget);

      return {
        employeeId: emp.id,
        employeeName: emp.name,
        username: emp.username,
        role: emp.role,
        groupId: emp.groupId || null,
        groupName: emp.group?.name || null,
        totalOpportunities: calculatedOpps.length,
        totalOpportunityValue,
        weightedForecast,
        actualRevenue,
        salesTarget,
        targetAchievementRate,
        actualAchievementRate,
        projectedRevenue,
        wonCount: wonOpps.length,
        pipelineCount: pipelineOpps.length,
      };
    });

    return {
      period: {
        type: range.type,
        year: range.year,
        month: range.month,
        quarter: range.quarter,
        startDate: range.startDate.toISOString(),
        endDate: range.endDate.toISOString(),
      },
      totalEmployees: items.length,
      items,
    };
  }

  /**
   * 3. GET /api/sales/forecast/by-group - Tổng hợp dự báo theo từng nhóm kinh doanh
   */
  async getForecastByGroup(query: GetForecastQueryDto, user?: AuthUser) {
    const range = calculatePeriodDateRange({
      period: query.period,
      year: query.year,
      month: query.month,
      quarter: query.quarter,
    });

    if (user?.dataScope === 'OWN' && user.role !== UserRole.ADMIN && user.role !== UserRole.SALES_DIRECTOR) {
      throw new ForbiddenError('Người dùng có phạm vi dữ liệu OWN không có quyền xem tổng hợp theo nhóm kinh doanh');
    }

    const { effectiveGroupId } = await this.applyDataScope(user, undefined, query.groupId);

    // Lấy danh sách nhóm
    const groups = await this.repo.findSalesGroups({
      groupId: effectiveGroupId,
    });

    // Lấy chỉ tiêu doanh số cấp nhóm và cấp thành viên
    const allGroupIds = groups.map((g) => g.id);
    const groupTargets = await this.repo.findSalesTargets({
      year: range.year,
      periodType: range.type,
      month: range.type === ForecastPeriodType.MONTH ? range.month : undefined,
      quarter: range.type === ForecastPeriodType.QUARTER ? range.quarter : undefined,
      groupIds: allGroupIds.length > 0 ? allGroupIds : ['non_existent'],
    });

    const targetsByGroupId = new Map<string, number>();
    for (const t of groupTargets) {
      if (t.groupId) {
        targetsByGroupId.set(t.groupId, (targetsByGroupId.get(t.groupId) || 0) + t.targetValue);
      }
    }

    // Duyệt qua từng nhóm để tổng hợp dữ liệu
    const items = await Promise.all(
      groups.map(async (grp) => {
        const memberIds = grp.members.map((m) => m.id);

        const rawOpps = await this.repo.findOpportunitiesInPeriod({
          startDate: range.startDate,
          endDate: range.endDate,
          ownerIds: memberIds.length > 0 ? memberIds : ['non_existent'],
        });

        const {
          calculatedOpps,
          pipelineOpps,
          wonOpps,
          totalOpportunityValue,
          weightedForecast,
          actualRevenue,
        } = this.processOpportunities(rawOpps);

        // Chỉ tiêu của nhóm: ưu tiên chỉ tiêu gán trực tiếp cho nhóm; nếu chưa có thì tổng hợp từ các thành viên
        let groupTarget = targetsByGroupId.get(grp.id) || 0;
        if (!groupTarget && memberIds.length > 0) {
          const memberTargets = await this.repo.findSalesTargets({
            year: range.year,
            periodType: range.type,
            month: range.type === ForecastPeriodType.MONTH ? range.month : undefined,
            quarter: range.type === ForecastPeriodType.QUARTER ? range.quarter : undefined,
            userIds: memberIds,
          });
          groupTarget = memberTargets.reduce((sum, t) => sum + t.targetValue, 0);
        }

        groupTarget = roundMoney(groupTarget);
        const projectedRevenue = roundMoney(actualRevenue + weightedForecast);
        const targetAchievementRate = calculateAchievementRate(weightedForecast, groupTarget);
        const actualAchievementRate = calculateAchievementRate(actualRevenue, groupTarget);

        return {
          groupId: grp.id,
          groupCode: grp.groupCode,
          groupName: grp.name,
          managerId: grp.managerId || null,
          memberCount: grp.members.length,
          totalOpportunities: calculatedOpps.length,
          totalOpportunityValue,
          weightedForecast,
          actualRevenue,
          salesTarget: groupTarget,
          targetAchievementRate,
          actualAchievementRate,
          projectedRevenue,
          wonCount: wonOpps.length,
          pipelineCount: pipelineOpps.length,
          members: grp.members.map((m) => ({
            id: m.id,
            name: m.name,
            username: m.username,
            role: m.role,
          })),
        };
      })
    );

    return {
      period: {
        type: range.type,
        year: range.year,
        month: range.month,
        quarter: range.quarter,
        startDate: range.startDate.toISOString(),
        endDate: range.endDate.toISOString(),
      },
      totalGroups: items.length,
      items,
    };
  }

  /**
   * 4. GET /api/sales/forecast/comparison - So sánh dự báo, chỉ tiêu và doanh số thực tế
   */
  async getForecastComparison(query: GetForecastQueryDto, user?: AuthUser) {
    const range = calculatePeriodDateRange({
      period: query.period,
      year: query.year,
      month: query.month,
      quarter: query.quarter,
    });

    const { effectiveOwnerId, effectiveGroupId, allowedOwnerIds } = await this.applyDataScope(
      user,
      query.employeeId,
      query.groupId
    );

    let targetOwnerIds = allowedOwnerIds;
    if (effectiveGroupId && !targetOwnerIds) {
      const groupUsers = await prisma.user.findMany({
        where: { groupId: effectiveGroupId },
        select: { id: true },
      });
      targetOwnerIds = groupUsers.map((u) => u.id);
    }

    // 1. Dữ liệu tổng thể cho toàn kỳ
    const rawOpps = await this.repo.findOpportunitiesInPeriod({
      startDate: range.startDate,
      endDate: range.endDate,
      ownerId: effectiveOwnerId,
      ownerIds: targetOwnerIds,
    });

    const {
      calculatedOpps,
      pipelineOpps,
      wonOpps,
      totalOpportunityValue,
      weightedForecast,
      actualRevenue,
    } = this.processOpportunities(rawOpps);

    let salesTarget = 0;
    const targetQuery: any = {
      year: range.year,
      periodType: range.type,
      month: range.type === ForecastPeriodType.MONTH ? range.month : undefined,
      quarter: range.type === ForecastPeriodType.QUARTER ? range.quarter : undefined,
    };

    if (effectiveOwnerId) {
      targetQuery.userId = effectiveOwnerId;
    } else if (targetOwnerIds && targetOwnerIds.length > 0) {
      targetQuery.userIds = targetOwnerIds;
    } else if (effectiveGroupId) {
      targetQuery.groupId = effectiveGroupId;
    }

    const targets = await this.repo.findSalesTargets(targetQuery);
    salesTarget = targets.reduce((sum, t) => roundMoney(sum + t.targetValue), 0);

    const projectedRevenue = roundMoney(actualRevenue + weightedForecast);
    const forecastAchievementRate = calculateAchievementRate(weightedForecast, salesTarget);
    const actualAchievementRate = calculateAchievementRate(actualRevenue, salesTarget);
    const totalProjectedAchievementRate = calculateAchievementRate(projectedRevenue, salesTarget);

    const gap = roundMoney(salesTarget - projectedRevenue);
    const status = evaluateComparisonStatus(forecastAchievementRate);

    // 2. Tạo sub-period breakdown (phân bổ theo các mốc thời gian con)
    const breakdown: any[] = [];

    if (range.type === ForecastPeriodType.YEAR) {
      // 12 tháng trong năm
      for (let m = 1; m <= 12; m++) {
        const subRange = calculatePeriodDateRange({
          period: 'month',
          year: range.year,
          month: m,
        });

        const subOpps = await this.repo.findOpportunitiesInPeriod({
          startDate: subRange.startDate,
          endDate: subRange.endDate,
          ownerId: effectiveOwnerId,
          ownerIds: targetOwnerIds,
        });

        const subProcessed = this.processOpportunities(subOpps);

        const subTargets = await this.repo.findSalesTargets({
          year: range.year,
          periodType: 'MONTH',
          month: m,
          userId: effectiveOwnerId,
          userIds: targetOwnerIds,
          groupId: effectiveGroupId,
        });
        const subTargetVal = subTargets.reduce((s, t) => roundMoney(s + t.targetValue), 0);
        const subProjected = roundMoney(subProcessed.actualRevenue + subProcessed.weightedForecast);
        const subRate = calculateAchievementRate(subProcessed.weightedForecast, subTargetVal);

        breakdown.push({
          subPeriod: `Tháng ${m}`,
          month: m,
          salesTarget: subTargetVal,
          actualRevenue: subProcessed.actualRevenue,
          weightedForecast: subProcessed.weightedForecast,
          projectedRevenue: subProjected,
          targetAchievementRate: subRate,
          status: evaluateComparisonStatus(subRate),
        });
      }
    } else if (range.type === ForecastPeriodType.QUARTER) {
      // 3 tháng trong quý
      const quarter = range.quarter || 1;
      const startMonth = (quarter - 1) * 3 + 1;
      for (let m = startMonth; m < startMonth + 3; m++) {
        const subRange = calculatePeriodDateRange({
          period: 'month',
          year: range.year,
          month: m,
        });

        const subOpps = await this.repo.findOpportunitiesInPeriod({
          startDate: subRange.startDate,
          endDate: subRange.endDate,
          ownerId: effectiveOwnerId,
          ownerIds: targetOwnerIds,
        });

        const subProcessed = this.processOpportunities(subOpps);

        const subTargets = await this.repo.findSalesTargets({
          year: range.year,
          periodType: 'MONTH',
          month: m,
          userId: effectiveOwnerId,
          userIds: targetOwnerIds,
          groupId: effectiveGroupId,
        });
        const subTargetVal = subTargets.reduce((s, t) => roundMoney(s + t.targetValue), 0);
        const subProjected = roundMoney(subProcessed.actualRevenue + subProcessed.weightedForecast);
        const subRate = calculateAchievementRate(subProcessed.weightedForecast, subTargetVal);

        breakdown.push({
          subPeriod: `Tháng ${m}`,
          month: m,
          salesTarget: subTargetVal,
          actualRevenue: subProcessed.actualRevenue,
          weightedForecast: subProcessed.weightedForecast,
          projectedRevenue: subProjected,
          targetAchievementRate: subRate,
          status: evaluateComparisonStatus(subRate),
        });
      }
    } else {
      // Phân tích theo tuần hoặc theo giai đoạn bán hàng
      for (const [stg, stgName] of Object.entries(STAGE_DISPLAY_NAMES)) {
        if (stg === OpportunityStage.LOST) continue;
        const matchingOpps = calculatedOpps.filter((o) => o.stage === stg);
        const val = matchingOpps.reduce((s, o) => roundMoney(s + o.value), 0);
        const wVal = matchingOpps.reduce((s, o) => roundMoney(s + o.weightedValue), 0);

        breakdown.push({
          subPeriod: stgName,
          stage: stg,
          count: matchingOpps.length,
          totalValue: val,
          weightedValue: stg === OpportunityStage.WON ? val : wVal,
        });
      }
    }

    return {
      period: {
        type: range.type,
        year: range.year,
        month: range.month,
        quarter: range.quarter,
        startDate: range.startDate.toISOString(),
        endDate: range.endDate.toISOString(),
      },
      metrics: {
        salesTarget,
        actualRevenue,
        weightedForecast,
        projectedRevenue,
        totalOpportunityValue,
        actualAchievementRate,
        forecastAchievementRate,
        totalProjectedAchievementRate,
        targetAchievementRate: forecastAchievementRate,
        gap,
        status,
        totalOpportunities: calculatedOpps.length,
        wonOpportunitiesCount: wonOpps.length,
        pipelineOpportunitiesCount: pipelineOpps.length,
      },
      breakdown,
    };
  }

  /**
   * 5. Quản lý chỉ tiêu doanh số: Thiết lập chỉ tiêu
   */
  async setSalesTarget(dto: SetSalesTargetDto, user?: AuthUser) {
    if (
      user?.role !== UserRole.ADMIN &&
      user?.role !== UserRole.SALES_DIRECTOR &&
      user?.role !== UserRole.SALES_MANAGER
    ) {
      throw new ForbiddenError('Chỉ Giám đốc kinh doanh hoặc Quản trị viên mới có quyền thiết lập chỉ tiêu doanh số');
    }

    if (dto.userId) {
      const targetUser = await prisma.user.findUnique({ where: { id: dto.userId } });
      if (!targetUser) {
        throw new NotFoundError(`Nhân viên với ID '${dto.userId}' không tồn tại`);
      }
    }

    if (dto.groupId) {
      const targetGroup = await prisma.salesGroup.findUnique({ where: { id: dto.groupId } });
      if (!targetGroup) {
        throw new NotFoundError(`Nhóm kinh doanh với ID '${dto.groupId}' không tồn tại`);
      }
    }

    const result = await this.repo.setSalesTarget(dto);
    return result;
  }

  /**
   * 6. Lấy danh sách chỉ tiêu doanh số
   */
  async listSalesTargets(query: GetSalesTargetsQueryDto, user?: AuthUser) {
    return this.repo.listSalesTargets(query);
  }
}

export const salesService = new SalesService();
