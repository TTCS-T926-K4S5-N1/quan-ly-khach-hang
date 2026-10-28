import { Router } from 'express';
import { salesController } from './sales.controller';
import { validateRequest } from '../../middlewares/validate.middleware';
import { authenticate, requirePermissions } from '../../middlewares/auth.middleware';
import { Permission } from '../../constants/permissions.constant';
import { GetForecastQuerySchema } from './dto/getForecastQuery.dto';
import { SetSalesTargetSchema, GetSalesTargetsQuerySchema } from './dto/salesTarget.dto';

const router = Router();

/**
 * @openapi
 * /api/sales/forecast:
 *   get:
 *     summary: Lấy dữ liệu dự báo doanh số theo xác suất (SCRUM-77)
 *     description: Tính toán dự báo doanh số bán hàng dựa trên giá trị cơ hội và xác suất thành công (Weighted Forecast = Value * Probability / 100). Hỗ trợ xem theo tháng, quý, năm và phân quyền Data Scope.
 *     tags:
 *       - Sales Forecast
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [month, quarter, year]
 *           default: month
 *         description: Loại chu kỳ dự báo (tháng, quý, năm)
 *       - in: query
 *         name: year
 *         schema:
 *           type: integer
 *           example: 2026
 *         description: Năm dự báo
 *       - in: query
 *         name: month
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 12
 *           example: 10
 *         description: Tháng dự báo (nếu period = month)
 *       - in: query
 *         name: quarter
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 4
 *           example: 4
 *         description: Quý dự báo (nếu period = quarter)
 *       - in: query
 *         name: employeeId
 *         schema:
 *           type: string
 *         description: Lọc theo nhân viên kinh doanh cụ thể
 *       - in: query
 *         name: groupId
 *         schema:
 *           type: string
 *         description: Lọc theo nhóm kinh doanh cụ thể
 *     responses:
 *       200:
 *         description: Lấy dự báo doanh số thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     period:
 *                       type: object
 *                       properties:
 *                         type:
 *                           type: string
 *                           example: "month"
 *                         year:
 *                           type: integer
 *                           example: 2026
 *                         month:
 *                           type: integer
 *                           example: 10
 *                     summary:
 *                       type: object
 *                       properties:
 *                         totalOpportunities:
 *                           type: integer
 *                           example: 25
 *                         totalOpportunityValue:
 *                           type: number
 *                           example: 1500000000
 *                         weightedForecast:
 *                           type: number
 *                           example: 1050000000
 *                         salesTarget:
 *                           type: number
 *                           example: 1200000000
 *                         actualRevenue:
 *                           type: number
 *                           example: 800000000
 *                         targetAchievementRate:
 *                           type: number
 *                           example: 87.5
 *       400:
 *         description: Tham số yêu cầu không hợp lệ
 *       401:
 *         description: Chưa xác thực
 *       403:
 *         description: Không có quyền truy cập hoặc vi phạm Data Scope
 */
router.get(
  '/forecast',
  authenticate,
  requirePermissions(Permission.FORECAST_VIEW),
  validateRequest({ query: GetForecastQuerySchema }),
  salesController.getSalesForecast
);

/**
 * @openapi
 * /api/sales/forecast/by-employee:
 *   get:
 *     summary: Tổng hợp dự báo doanh số theo nhân viên kinh doanh (SCRUM-77)
 *     description: Trả về dự báo doanh số, chỉ tiêu và doanh số thực tế của từng nhân viên kinh doanh trong kỳ được chọn.
 *     tags:
 *       - Sales Forecast
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [month, quarter, year]
 *           default: month
 *       - in: query
 *         name: year
 *         schema:
 *           type: integer
 *           example: 2026
 *       - in: query
 *         name: month
 *         schema:
 *           type: integer
 *           example: 10
 *       - in: query
 *         name: quarter
 *         schema:
 *           type: integer
 *           example: 4
 *       - in: query
 *         name: employeeId
 *         schema:
 *           type: string
 *       - in: query
 *         name: groupId
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Lấy danh sách dự báo theo nhân viên thành công
 *       401:
 *         description: Chưa xác thực
 *       403:
 *         description: Không có quyền truy cập
 */
router.get(
  '/forecast/by-employee',
  authenticate,
  requirePermissions(Permission.FORECAST_VIEW),
  validateRequest({ query: GetForecastQuerySchema }),
  salesController.getForecastByEmployee
);

/**
 * @openapi
 * /api/sales/forecast/by-group:
 *   get:
 *     summary: Tổng hợp dự báo doanh số theo nhóm kinh doanh (SCRUM-77)
 *     description: Trả về dự báo doanh số, chỉ tiêu và doanh số thực tế của từng nhóm kinh doanh.
 *     tags:
 *       - Sales Forecast
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [month, quarter, year]
 *           default: month
 *       - in: query
 *         name: year
 *         schema:
 *           type: integer
 *           example: 2026
 *       - in: query
 *         name: month
 *         schema:
 *           type: integer
 *           example: 10
 *       - in: query
 *         name: quarter
 *         schema:
 *           type: integer
 *           example: 4
 *       - in: query
 *         name: groupId
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Lấy danh sách dự báo theo nhóm thành công
 *       401:
 *         description: Chưa xác thực
 *       403:
 *         description: Không có quyền truy cập
 */
router.get(
  '/forecast/by-group',
  authenticate,
  requirePermissions(Permission.FORECAST_VIEW),
  validateRequest({ query: GetForecastQuerySchema }),
  salesController.getForecastByGroup
);

/**
 * @openapi
 * /api/sales/forecast/comparison:
 *   get:
 *     summary: So sánh dự báo, chỉ tiêu và doanh số thực tế (SCRUM-77)
 *     description: Phân tích so sánh chi tiết giữa doanh số dự báo, chỉ tiêu đã giao và doanh số thực tế, kèm đánh giá trạng thái hoàn thành và breakdown theo chu kỳ con.
 *     tags:
 *       - Sales Forecast
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [month, quarter, year]
 *           default: month
 *       - in: query
 *         name: year
 *         schema:
 *           type: integer
 *           example: 2026
 *       - in: query
 *         name: month
 *         schema:
 *           type: integer
 *           example: 10
 *       - in: query
 *         name: quarter
 *         schema:
 *           type: integer
 *           example: 4
 *       - in: query
 *         name: employeeId
 *         schema:
 *           type: string
 *       - in: query
 *         name: groupId
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: So sánh số liệu thành công
 *       401:
 *         description: Chưa xác thực
 *       403:
 *         description: Không có quyền truy cập
 */
router.get(
  '/forecast/comparison',
  authenticate,
  requirePermissions(Permission.FORECAST_VIEW),
  validateRequest({ query: GetForecastQuerySchema }),
  salesController.getForecastComparison
);

/**
 * @openapi
 * /api/sales/targets:
 *   post:
 *     summary: Thiết lập chỉ tiêu doanh số (SCRUM-77)
 *     description: Thiết lập hoặc cập nhật chỉ tiêu doanh số (Sales Target) cho nhân viên hoặc nhóm kinh doanh theo tháng, quý hoặc năm.
 *     tags:
 *       - Sales Target
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - targetValue
 *               - periodType
 *               - year
 *             properties:
 *               targetValue:
 *                 type: number
 *                 example: 500000000
 *                 description: Chỉ tiêu doanh số (VND)
 *               periodType:
 *                 type: string
 *                 enum: [MONTH, QUARTER, YEAR]
 *                 example: MONTH
 *               year:
 *                 type: integer
 *                 example: 2026
 *               month:
 *                 type: integer
 *                 example: 10
 *               quarter:
 *                 type: integer
 *                 example: 4
 *               userId:
 *                 type: string
 *                 example: "usr_sales_01"
 *               groupId:
 *                 type: string
 *                 example: "grp_sales_north"
 *     responses:
 *       201:
 *         description: Thiết lập chỉ tiêu thành công
 *       400:
 *         description: Dữ liệu không hợp lệ
 *       401:
 *         description: Chưa xác thực
 *       403:
 *         description: Không có quyền thiết lập chỉ tiêu
 */
router.post(
  '/targets',
  authenticate,
  requirePermissions(Permission.FORECAST_MANAGE),
  validateRequest({ body: SetSalesTargetSchema }),
  salesController.setSalesTarget
);

/**
 * @openapi
 * /api/sales/targets:
 *   get:
 *     summary: Lấy danh sách chỉ tiêu doanh số (SCRUM-77)
 *     tags:
 *       - Sales Target
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: year
 *         schema:
 *           type: integer
 *       - in: query
 *         name: periodType
 *         schema:
 *           type: string
 *           enum: [MONTH, QUARTER, YEAR]
 *       - in: query
 *         name: month
 *         schema:
 *           type: integer
 *       - in: query
 *         name: quarter
 *         schema:
 *           type: integer
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *       - in: query
 *         name: groupId
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Lấy danh sách chỉ tiêu thành công
 */
router.get(
  '/targets',
  authenticate,
  requirePermissions(Permission.FORECAST_VIEW),
  validateRequest({ query: GetSalesTargetsQuerySchema }),
  salesController.listSalesTargets
);

export const salesRoutes = router;
