import { SalesService } from '../../src/modules/sales/sales.service';
import { SalesRepository } from '../../src/modules/sales/sales.repository';
import { ForecastPeriodType, roundMoney, calculateAchievementRate } from '../../src/modules/sales/sales.constant';
import { OpportunityStage } from '../../src/constants/opportunity.constant';
import { UserRole } from '../../src/constants/permissions.constant';
import { ForbiddenError } from '../../src/errors/appError';

describe('SalesService - Sales Forecasting by Probability Unit Tests (SCRUM-77)', () => {
  let salesService: SalesService;
  let mockRepo: jest.Mocked<SalesRepository>;

  beforeEach(() => {
    mockRepo = {
      findOpportunitiesInPeriod: jest.fn(),
      findSalesEmployees: jest.fn(),
      findSalesGroups: jest.fn(),
      findSalesTargets: jest.fn(),
      setSalesTarget: jest.fn(),
      listSalesTargets: jest.fn(),
    } as any;

    salesService = new SalesService(mockRepo);
  });

  describe('1. Weighted Forecast Calculation & Opportunity Stage Logic', () => {
    it('should correctly calculate weighted forecast using formula: Opportunity Value * Probability / 100', async () => {
      // Mock opportunities in pipeline
      const mockOpps = [
        {
          id: 'opp_1',
          name: 'Cơ hội 1',
          stage: OpportunityStage.PROPOSAL,
          expectedValue: 100000000,
          probability: 50, // 100M * 50% = 50M
          ownerId: 'usr_sales_01',
          expectedCloseDate: new Date('2026-10-15'),
        },
        {
          id: 'opp_2',
          name: 'Cơ hội 2',
          stage: OpportunityStage.NEGOTIATION,
          expectedValue: 200000000,
          probability: 75, // 200M * 75% = 150M
          ownerId: 'usr_sales_01',
          expectedCloseDate: new Date('2026-10-20'),
        },
        {
          id: 'opp_3',
          name: 'Cơ hội 3',
          stage: OpportunityStage.QUALIFICATION,
          expectedValue: 150000000,
          probability: 10, // 150M * 10% = 15M
          ownerId: 'usr_sales_02',
          expectedCloseDate: new Date('2026-10-25'),
        },
      ];

      mockRepo.findOpportunitiesInPeriod.mockResolvedValue(mockOpps as any);
      mockRepo.findSalesTargets.mockResolvedValue([
        { targetValue: 300000000 } as any,
      ]);

      const result = await salesService.getSalesForecast(
        { period: ForecastPeriodType.MONTH, year: 2026, month: 10 },
        { id: 'usr_admin', role: UserRole.ADMIN, name: 'Admin', permissions: [], username: 'admin' }
      );

      // Total pipeline value = 100M + 200M + 150M = 450M
      expect(result.summary.totalOpportunityValue).toBe(450000000);
      // Weighted Forecast = 50M + 150M + 15M = 215M
      expect(result.summary.weightedForecast).toBe(215000000);
      expect(result.summary.totalOpportunities).toBe(3);
      expect(result.summary.salesTarget).toBe(300000000);
      // Achievement Rate = 215M / 300M * 100 = 71.67%
      expect(result.summary.targetAchievementRate).toBe(71.67);
      expect(result.summary.actualRevenue).toBe(0);
    });

    it('should exclude LOST opportunities and isolate WON opportunities into actualRevenue to prevent double counting', async () => {
      const mockOpps = [
        {
          id: 'opp_open',
          name: 'Cơ hội đang mở',
          stage: OpportunityStage.PROPOSAL,
          expectedValue: 500000000,
          probability: 50, // 250M weighted
          ownerId: 'usr_sales_01',
          expectedCloseDate: new Date('2026-10-15'),
        },
        {
          id: 'opp_won',
          name: 'Cơ hội đã chốt thành công',
          stage: OpportunityStage.WON,
          expectedValue: 800000000,
          probability: 100,
          ownerId: 'usr_sales_01',
          expectedCloseDate: new Date('2026-10-10'),
        },
        {
          id: 'opp_lost',
          name: 'Cơ hội thất bại',
          stage: OpportunityStage.LOST,
          expectedValue: 300000000,
          probability: 0,
          ownerId: 'usr_sales_01',
          expectedCloseDate: new Date('2026-10-05'),
        },
      ];

      mockRepo.findOpportunitiesInPeriod.mockResolvedValue(mockOpps as any);
      mockRepo.findSalesTargets.mockResolvedValue([
        { targetValue: 1200000000 } as any,
      ]);

      const result = await salesService.getSalesForecast(
        { period: ForecastPeriodType.MONTH, year: 2026, month: 10 },
        { id: 'usr_director', role: UserRole.SALES_DIRECTOR, name: 'Director', permissions: [], username: 'director' }
      );

      // LOST deal is completely excluded from opportunities count and pipeline
      expect(result.summary.totalOpportunities).toBe(2); // opp_open + opp_won
      // WON deal is isolated into actualRevenue
      expect(result.summary.actualRevenue).toBe(800000000);
      // Pipeline only contains opp_open
      expect(result.summary.totalOpportunityValue).toBe(500000000);
      expect(result.summary.weightedForecast).toBe(250000000);
      // Total projected revenue = actualRevenue + weightedForecast = 1,050,000,000
      expect(result.summary.projectedRevenue).toBe(1050000000);
      // Weighted forecast achievement rate = 250M / 1200M * 100 = 20.83%
      expect(result.summary.targetAchievementRate).toBe(20.83);
    });

    it('should clamp probability within [0, 100] and avoid floating-point inaccuracies', async () => {
      const mockOpps = [
        {
          id: 'opp_invalid_prob',
          name: 'Cơ hội vượt xác suất',
          stage: OpportunityStage.PROPOSAL,
          expectedValue: 10000000,
          probability: 150, // Should be clamped to 100
          ownerId: 'usr_sales_01',
          expectedCloseDate: new Date('2026-10-15'),
        },
        {
          id: 'opp_fraction',
          name: 'Cơ hội giá trị lẻ',
          stage: OpportunityStage.QUALIFICATION,
          expectedValue: 3333333.33,
          probability: 33.33,
          ownerId: 'usr_sales_01',
          expectedCloseDate: new Date('2026-10-20'),
        },
      ];

      mockRepo.findOpportunitiesInPeriod.mockResolvedValue(mockOpps as any);
      mockRepo.findSalesTargets.mockResolvedValue([]);

      const result = await salesService.getSalesForecast(
        { period: ForecastPeriodType.MONTH, year: 2026, month: 10 },
        { id: 'usr_admin', role: UserRole.ADMIN, name: 'Admin', permissions: [], username: 'admin' }
      );

      expect(result.summary.weightedForecast).toBeGreaterThan(0);
      // Check that weightedForecast has at most 2 decimal digits
      const decimalPlaces = (result.summary.weightedForecast.toString().split('.')[1] || '').length;
      expect(decimalPlaces).toBeLessThanOrEqual(2);
    });
  });

  describe('2. Period Filtering Logic', () => {
    it('should support Quarter and Year period types and calculate correct date ranges', async () => {
      mockRepo.findOpportunitiesInPeriod.mockResolvedValue([]);
      mockRepo.findSalesTargets.mockResolvedValue([]);

      // Test Quarter
      const quarterRes = await salesService.getSalesForecast(
        { period: ForecastPeriodType.QUARTER, year: 2026, quarter: 4 },
        { id: 'usr_admin', role: UserRole.ADMIN, name: 'Admin', permissions: [], username: 'admin' }
      );

      expect(quarterRes.period.type).toBe('quarter');
      expect(quarterRes.period.year).toBe(2026);
      expect(quarterRes.period.quarter).toBe(4);
      expect(quarterRes.period.startDate).toBe(new Date(Date.UTC(2026, 9, 1)).toISOString()); // Oct 1
      expect(quarterRes.period.endDate).toBe(new Date(Date.UTC(2026, 12, 0, 23, 59, 59, 999)).toISOString()); // Dec 31

      // Test Year
      const yearRes = await salesService.getSalesForecast(
        { period: ForecastPeriodType.YEAR, year: 2026 },
        { id: 'usr_admin', role: UserRole.ADMIN, name: 'Admin', permissions: [], username: 'admin' }
      );

      expect(yearRes.period.type).toBe('year');
      expect(yearRes.period.year).toBe(2026);
      expect(yearRes.period.startDate).toBe(new Date(Date.UTC(2026, 0, 1)).toISOString()); // Jan 1
      expect(yearRes.period.endDate).toBe(new Date(Date.UTC(2026, 11, 31, 23, 59, 59, 999)).toISOString()); // Dec 31
    });
  });

  describe('3. Data Scope & RBAC Permissions', () => {
    it('should restrict user with OWN data scope to their own opportunities and personal target', async () => {
      mockRepo.findOpportunitiesInPeriod.mockResolvedValue([]);
      mockRepo.findSalesTargets.mockResolvedValue([]);

      const user = {
        id: 'usr_sales_01',
        name: 'Sales Rep 1',
        role: UserRole.SALES,
        permissions: [],
        username: 'sales1',
        dataScope: 'OWN',
      };

      await salesService.getSalesForecast(
        { period: ForecastPeriodType.MONTH, year: 2026, month: 10 },
        user
      );

      // Verify that findOpportunitiesInPeriod was called with ownerId: usr_sales_01
      expect(mockRepo.findOpportunitiesInPeriod).toHaveBeenCalledWith(
        expect.objectContaining({
          ownerId: 'usr_sales_01',
        })
      );
    });

    it('should throw ForbiddenError when user with OWN data scope requests another employee forecast', async () => {
      const user = {
        id: 'usr_sales_01',
        name: 'Sales Rep 1',
        role: UserRole.SALES,
        permissions: [],
        username: 'sales1',
        dataScope: 'OWN',
      };

      await expect(
        salesService.getSalesForecast(
          { period: ForecastPeriodType.MONTH, year: 2026, month: 10, employeeId: 'usr_sales_02' },
          user
        )
      ).rejects.toThrow(ForbiddenError);
    });

    it('should throw ForbiddenError when user with OWN data scope accesses by-group endpoint', async () => {
      const user = {
        id: 'usr_sales_01',
        name: 'Sales Rep 1',
        role: UserRole.SALES,
        permissions: [],
        username: 'sales1',
        dataScope: 'OWN',
      };

      await expect(
        salesService.getForecastByGroup(
          { period: ForecastPeriodType.MONTH, year: 2026, month: 10 },
          user
        )
      ).rejects.toThrow(ForbiddenError);
    });
  });

  describe('4. Aggregation by Employee and Group', () => {
    it('should aggregate opportunities and targets per employee accurately in getForecastByEmployee', async () => {
      mockRepo.findSalesEmployees.mockResolvedValue([
        {
          id: 'usr_sales_01',
          name: 'Nguyễn Văn A',
          username: 'sales_a',
          role: 'SALES',
          groupId: 'grp_north',
          group: { name: 'Nhóm Bắc' },
        } as any,
        {
          id: 'usr_sales_02',
          name: 'Trần Thị B',
          username: 'sales_b',
          role: 'SALES',
          groupId: 'grp_north',
          group: { name: 'Nhóm Bắc' },
        } as any,
      ]);

      mockRepo.findOpportunitiesInPeriod.mockResolvedValue([
        {
          id: 'opp_a',
          ownerId: 'usr_sales_01',
          stage: OpportunityStage.PROPOSAL,
          expectedValue: 200000000,
          probability: 50, // 100M weighted
        } as any,
        {
          id: 'opp_b_won',
          ownerId: 'usr_sales_02',
          stage: OpportunityStage.WON,
          expectedValue: 300000000,
          probability: 100, // 300M actual
        } as any,
      ]);

      mockRepo.findSalesTargets.mockResolvedValue([
        { userId: 'usr_sales_01', targetValue: 200000000 } as any,
        { userId: 'usr_sales_02', targetValue: 400000000 } as any,
      ]);

      const result = await salesService.getForecastByEmployee(
        { period: ForecastPeriodType.MONTH, year: 2026, month: 10 },
        { id: 'usr_admin', role: UserRole.ADMIN, name: 'Admin', permissions: [], username: 'admin' }
      );

      expect(result.totalEmployees).toBe(2);
      const emp1 = result.items.find((e) => e.employeeId === 'usr_sales_01');
      expect(emp1?.weightedForecast).toBe(100000000);
      expect(emp1?.actualRevenue).toBe(0);
      expect(emp1?.salesTarget).toBe(200000000);
      expect(emp1?.targetAchievementRate).toBe(50); // 100M / 200M * 100 = 50%

      const emp2 = result.items.find((e) => e.employeeId === 'usr_sales_02');
      expect(emp2?.weightedForecast).toBe(0);
      expect(emp2?.actualRevenue).toBe(300000000);
      expect(emp2?.salesTarget).toBe(400000000);
      expect(emp2?.actualAchievementRate).toBe(75); // 300M / 400M * 100 = 75%
    });

    it('should aggregate opportunities and targets per group accurately in getForecastByGroup', async () => {
      mockRepo.findSalesGroups.mockResolvedValue([
        {
          id: 'grp_north',
          groupCode: 'GRP-NORTH',
          name: 'Nhóm Kinh Doanh Miền Bắc',
          managerId: 'usr_mgr_01',
          members: [
            { id: 'usr_sales_01', name: 'Nhân viên 1', username: 's1', role: 'SALES' },
            { id: 'usr_sales_02', name: 'Nhân viên 2', username: 's2', role: 'SALES' },
          ],
        } as any,
      ]);

      mockRepo.findOpportunitiesInPeriod.mockResolvedValue([
        {
          id: 'opp_1',
          ownerId: 'usr_sales_01',
          stage: OpportunityStage.NEGOTIATION,
          expectedValue: 500000000,
          probability: 80, // 400M weighted
        } as any,
      ]);

      mockRepo.findSalesTargets.mockResolvedValue([
        { groupId: 'grp_north', targetValue: 1000000000 } as any,
      ]);

      const result = await salesService.getForecastByGroup(
        { period: ForecastPeriodType.MONTH, year: 2026, month: 10 },
        { id: 'usr_director', role: UserRole.SALES_DIRECTOR, name: 'Director', permissions: [], username: 'director' }
      );

      expect(result.totalGroups).toBe(1);
      const grp = result.items[0];
      expect(grp.groupCode).toBe('GRP-NORTH');
      expect(grp.weightedForecast).toBe(400000000);
      expect(grp.salesTarget).toBe(1000000000);
      expect(grp.targetAchievementRate).toBe(40); // 400M / 1000M = 40%
      expect(grp.memberCount).toBe(2);
    });
  });

  describe('5. Comparison and Gap Analysis', () => {
    it('should calculate projected revenue, gap and status in getForecastComparison', async () => {
      mockRepo.findOpportunitiesInPeriod.mockResolvedValue([
        {
          id: 'opp_open',
          stage: OpportunityStage.PROPOSAL,
          expectedValue: 600000000,
          probability: 50, // 300M weighted
        } as any,
        {
          id: 'opp_won',
          stage: OpportunityStage.WON,
          expectedValue: 500000000,
          probability: 100, // 500M actual
        } as any,
      ]);

      mockRepo.findSalesTargets.mockResolvedValue([
        { targetValue: 1000000000 } as any,
      ]);

      const result = await salesService.getForecastComparison(
        { period: ForecastPeriodType.MONTH, year: 2026, month: 10 },
        { id: 'usr_admin', role: UserRole.ADMIN, name: 'Admin', permissions: [], username: 'admin' }
      );

      expect(result.metrics.salesTarget).toBe(1000000000);
      expect(result.metrics.actualRevenue).toBe(500000000);
      expect(result.metrics.weightedForecast).toBe(300000000);
      expect(result.metrics.projectedRevenue).toBe(800000000);
      // Gap to target = 1000M - 800M = 200M
      expect(result.metrics.gap).toBe(200000000);
      expect(result.metrics.forecastAchievementRate).toBe(30); // 300M / 1000M * 100
      expect(result.metrics.totalProjectedAchievementRate).toBe(80); // 800M / 1000M * 100
      expect(result.breakdown).toBeDefined();
    });
  });
});
