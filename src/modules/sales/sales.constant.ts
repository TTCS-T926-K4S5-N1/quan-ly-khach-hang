export enum ForecastPeriodType {
  MONTH = 'month',
  QUARTER = 'quarter',
  YEAR = 'year',
}

export enum ComparisonStatus {
  EXCEEDED = 'EXCEEDED',
  ON_TRACK = 'ON_TRACK',
  AT_RISK = 'AT_RISK',
  BEHIND = 'BEHIND',
}

export interface DateRange {
  startDate: Date;
  endDate: Date;
  year: number;
  month?: number;
  quarter?: number;
  type: ForecastPeriodType;
}

/**
 * Làm tròn số tiền với độ chính xác an toàn (2 chữ số thập phân)
 */
export function roundMoney(amount: number): number {
  if (isNaN(amount) || !isFinite(amount)) return 0;
  return Math.round((amount + Number.EPSILON) * 100) / 100;
}

/**
 * Tính tỷ lệ hoàn thành chỉ tiêu (%)
 */
export function calculateAchievementRate(value: number, target: number): number {
  if (!target || target <= 0) return 0;
  return roundMoney((value / target) * 100);
}

/**
 * Đánh giá trạng thái tiến độ dựa trên tỷ lệ đạt chỉ tiêu
 */
export function evaluateComparisonStatus(achievementRate: number): ComparisonStatus {
  if (achievementRate >= 100) return ComparisonStatus.EXCEEDED;
  if (achievementRate >= 80) return ComparisonStatus.ON_TRACK;
  if (achievementRate >= 50) return ComparisonStatus.AT_RISK;
  return ComparisonStatus.BEHIND;
}

/**
 * Tính toán khoảng thời gian (startDate, endDate) theo period (tháng, quý, năm)
 */
export function calculatePeriodDateRange(params: {
  period?: string;
  year?: number;
  month?: number;
  quarter?: number;
  now?: Date;
}): DateRange {
  const currentDate = params.now || new Date();
  const rawType = (params.period || ForecastPeriodType.MONTH).toLowerCase();
  const type = Object.values(ForecastPeriodType).includes(rawType as ForecastPeriodType)
    ? (rawType as ForecastPeriodType)
    : ForecastPeriodType.MONTH;

  const year = params.year !== undefined && !isNaN(params.year) ? params.year : currentDate.getFullYear();

  if (type === ForecastPeriodType.YEAR) {
    const startDate = new Date(Date.UTC(year, 0, 1, 0, 0, 0, 0));
    const endDate = new Date(Date.UTC(year, 11, 31, 23, 59, 59, 999));
    return { startDate, endDate, year, type };
  }

  if (type === ForecastPeriodType.QUARTER) {
    let quarter = params.quarter;
    if (quarter === undefined || isNaN(quarter) || quarter < 1 || quarter > 4) {
      quarter = Math.floor(currentDate.getMonth() / 3) + 1;
    }
    const startMonth = (quarter - 1) * 3;
    const endMonth = quarter * 3 - 1;
    const startDate = new Date(Date.UTC(year, startMonth, 1, 0, 0, 0, 0));
    const endDate = new Date(Date.UTC(year, endMonth + 1, 0, 23, 59, 59, 999));
    return { startDate, endDate, year, quarter, type };
  }

  // Mặc định type === ForecastPeriodType.MONTH
  let month = params.month;
  if (month === undefined || isNaN(month) || month < 1 || month > 12) {
    month = currentDate.getMonth() + 1;
  }
  const quarter = Math.floor((month - 1) / 3) + 1;
  const startDate = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0, 0));
  const endDate = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));
  return { startDate, endDate, year, month, quarter, type };
}
