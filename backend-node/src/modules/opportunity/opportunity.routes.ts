import { Router } from 'express';
import { opportunityController } from './opportunity.controller';
import { validateRequest } from '../../middlewares/validate.middleware';
import { authenticate, requirePermissions } from '../../middlewares/auth.middleware';
import { Permission } from '../../constants/permissions.constant';
import { CreateOpportunitySchema } from './dto/createOpportunity.dto';
import {
  UpdateOpportunitySchema,
  OpportunityIdParamSchema,
} from './dto/updateOpportunity.dto';
import { UpdateOpportunityStageSchema } from './dto/updateOpportunityStage.dto';
import { GetOpportunitiesQuerySchema } from './dto/getOpportunitiesQuery.dto';

const router = Router();

/**
 * @openapi
 * /api/opportunities:
 *   post:
 *     summary: Tạo cơ hội bán hàng mới (SCRUM-72)
 *     description: Tạo một cơ hội bán hàng cho khách hàng trong hệ thống. Tự động gán xác suất thành công mặc định theo giai đoạn nếu không cung cấp, validate ngày dự kiến chốt không được nằm trong quá khứ và kiểm tra người liên hệ phải thuộc đúng khách hàng. Một khách hàng có thể có nhiều cơ hội song song.
 *     tags:
 *       - Sales Opportunity
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - customerId
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Cơ hội cung cấp phần mềm CRM"
 *                 description: Tên cơ hội bán hàng
 *               customerId:
 *                 type: string
 *                 example: "cust_001"
 *                 description: ID của khách hàng
 *               primaryContactId:
 *                 type: string
 *                 example: "contact_001"
 *                 description: ID người liên hệ chính (phải thuộc khách hàng)
 *               stage:
 *                 type: string
 *                 enum: [QUALIFICATION, NEEDS_ANALYSIS, PROPOSAL, NEGOTIATION, WON, LOST]
 *                 default: QUALIFICATION
 *                 description: Giai đoạn bán hàng
 *               expectedValue:
 *                 type: number
 *                 example: 50000000
 *                 description: Giá trị dự kiến của cơ hội (VND)
 *               expectedCloseDate:
 *                 type: string
 *                 format: date
 *                 example: "2026-12-15"
 *                 description: Ngày dự kiến chốt (không được nằm trong quá khứ)
 *               source:
 *                 type: string
 *                 example: "WEBSITE"
 *                 description: Nguồn cơ hội
 *               probability:
 *                 type: number
 *                 minimum: 0
 *                 maximum: 100
 *                 example: 10
 *                 description: Xác suất thành công (%) (mặc định theo stage nếu không nhập)
 *               notes:
 *                 type: string
 *                 example: "Khách hàng đang tìm hiểu giải pháp"
 *                 description: Ghi chú
 *     responses:
 *       201:
 *         description: Tạo cơ hội bán hàng thành công
 *       400:
 *         description: Dữ liệu không hợp lệ (ngày quá khứ, người liên hệ không thuộc khách hàng, xác suất sai...)
 *       401:
 *         description: Chưa xác thực
 *       403:
 *         description: Không có quyền truy cập (thiếu OPPORTUNITY_CREATE)
 *       404:
 *         description: Khách hàng hoặc người liên hệ không tồn tại
 */
router.post(
  '/',
  authenticate,
  requirePermissions(Permission.OPPORTUNITY_CREATE),
  validateRequest({ body: CreateOpportunitySchema }),
  opportunityController.createOpportunity
);

/**
 * @openapi
 * /api/opportunities:
 *   get:
 *     summary: Lấy danh sách cơ hội bán hàng (SCRUM-72)
 *     description: Lấy danh sách cơ hội bán hàng, hỗ trợ tìm kiếm theo tên/mã/tên khách hàng, lọc theo stage, customerId, source và phân trang.
 *     tags:
 *       - Sales Opportunity
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Số trang
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Số lượng bản ghi mỗi trang
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Từ khóa tìm kiếm
 *       - in: query
 *         name: customerId
 *         schema:
 *           type: string
 *         description: Lọc theo ID khách hàng
 *       - in: query
 *         name: stage
 *         schema:
 *           type: string
 *         description: Lọc theo giai đoạn bán hàng
 *       - in: query
 *         name: source
 *         schema:
 *           type: string
 *         description: Lọc theo nguồn
 *     responses:
 *       200:
 *         description: Lấy danh sách thành công
 *       401:
 *         description: Chưa xác thực
 *       403:
 *         description: Không có quyền truy cập
 */
router.get(
  '/',
  authenticate,
  requirePermissions(Permission.OPPORTUNITY_VIEW),
  validateRequest({ query: GetOpportunitiesQuerySchema }),
  opportunityController.getOpportunities
);

/**
 * @openapi
 * /api/opportunities/{id}:
 *   get:
 *     summary: Xem chi tiết một cơ hội bán hàng (SCRUM-72)
 *     description: Lấy thông tin chi tiết của một cơ hội bán hàng bao gồm khách hàng và người liên hệ.
 *     tags:
 *       - Sales Opportunity
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID của cơ hội bán hàng
 *     responses:
 *       200:
 *         description: Lấy thông tin chi tiết thành công
 *       401:
 *         description: Chưa xác thực
 *       403:
 *         description: Không có quyền truy cập
 *       404:
 *         description: Không tìm thấy cơ hội bán hàng
 */
router.get(
  '/:id',
  authenticate,
  requirePermissions(Permission.OPPORTUNITY_VIEW),
  validateRequest({ params: OpportunityIdParamSchema }),
  opportunityController.getOpportunityById
);

/**
 * @openapi
 * /api/opportunities/{id}:
 *   patch:
 *     summary: Cập nhật thông tin cơ hội bán hàng (SCRUM-72)
 *     description: Cập nhật thông tin chi tiết của cơ hội bán hàng (tên, giá trị, ngày chốt, người liên hệ, xác suất, ghi chú...).
 *     tags:
 *       - Sales Opportunity
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID của cơ hội bán hàng
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               stage:
 *                 type: string
 *               expectedValue:
 *                 type: number
 *               expectedCloseDate:
 *                 type: string
 *               probability:
 *                 type: number
 *               primaryContactId:
 *                 type: string
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 *       400:
 *         description: Dữ liệu không hợp lệ
 *       401:
 *         description: Chưa xác thực
 *       403:
 *         description: Không có quyền cập nhật
 *       404:
 *         description: Không tìm thấy cơ hội bán hàng hoặc liên quan
 */
router.patch(
  '/:id',
  authenticate,
  requirePermissions(Permission.OPPORTUNITY_MANAGE),
  validateRequest({
    params: OpportunityIdParamSchema,
    body: UpdateOpportunitySchema,
  }),
  opportunityController.updateOpportunity
);

/**
 * @openapi
 * /api/opportunities/{id}/stage:
 *   patch:
 *     summary: Thay đổi giai đoạn bán hàng của cơ hội (SCRUM-72)
 *     description: Cập nhật giai đoạn bán hàng và tự động cập nhật xác suất mặc định theo giai đoạn (hoặc ghi nhận xác suất tùy chỉnh nếu cung cấp).
 *     tags:
 *       - Sales Opportunity
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID của cơ hội bán hàng
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - stage
 *             properties:
 *               stage:
 *                 type: string
 *                 enum: [QUALIFICATION, NEEDS_ANALYSIS, PROPOSAL, NEGOTIATION, WON, LOST]
 *                 example: "NEGOTIATION"
 *                 description: Giai đoạn bán hàng mới
 *               probability:
 *                 type: number
 *                 minimum: 0
 *                 maximum: 100
 *                 example: 75
 *                 description: Xác suất tùy chỉnh (nếu bỏ trống, tự động gán mặc định theo stage)
 *     responses:
 *       200:
 *         description: Cập nhật giai đoạn thành công
 *       400:
 *         description: Giai đoạn hoặc xác suất không hợp lệ
 *       401:
 *         description: Chưa xác thực
 *       403:
 *         description: Không có quyền thực hiện
 *       404:
 *         description: Không tìm thấy cơ hội bán hàng
 */
router.patch(
  '/:id/stage',
  authenticate,
  requirePermissions(Permission.OPPORTUNITY_MANAGE),
  validateRequest({
    params: OpportunityIdParamSchema,
    body: UpdateOpportunityStageSchema,
  }),
  opportunityController.updateOpportunityStage
);

export const opportunityRoutes = router;
