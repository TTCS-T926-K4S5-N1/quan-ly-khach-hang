import { Router } from 'express';
import { customerController } from './customer.controller';
import { validateRequest } from '../../middlewares/validate.middleware';
import { authenticate, requirePermissions } from '../../middlewares/auth.middleware';
import { Permission } from '../../constants/permissions.constant';
import { GetCustomerCareQuerySchema } from './dto/getCustomerCareQuery.dto';
import { MarkCareContactBodySchema, MarkCareContactParamsSchema } from './dto/markCareContact.dto';

const router = Router();

/**
 * @openapi
 * /api/customers/care:
 *   get:
 *     summary: Lấy danh sách khách hàng cần chăm sóc định kỳ
 *     description: Lấy danh sách khách hàng chưa được tương tác/chăm sóc trong N ngày gần nhất (hoặc chưa từng được chăm sóc), sắp xếp theo thời gian đồng bộ syncedAt giảm dần.
 *     tags:
 *       - Customer Care
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: days
 *         schema:
 *           type: integer
 *           minimum: 1
 *           example: 30
 *         description: Số ngày không tương tác cần chăm sóc (mặc định lấy theo cấu hình hệ thống, ví dụ 30 ngày)
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *           example: 1
 *         description: Số trang hiện tại
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *           example: 20
 *         description: Số lượng bản ghi mỗi trang
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Từ khóa tìm kiếm theo tên, mã khách hàng, số điện thoại, email
 *     responses:
 *       200:
 *         description: Lấy danh sách thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Lấy danh sách khách hàng cần chăm sóc thành công
 *                 data:
 *                   type: object
 *                   properties:
 *                     items:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           customerId:
 *                             type: string
 *                           customerCode:
 *                             type: string
 *                           customerName:
 *                             type: string
 *                           phone:
 *                             type: string
 *                           email:
 *                             type: string
 *                           contracts:
 *                             type: array
 *                             items:
 *                               type: object
 *                           lastContactAt:
 *                             type: string
 *                             nullable: true
 *                           syncedAt:
 *                             type: string
 *                             nullable: true
 *                           careStatus:
 *                             type: string
 *                           needsCare:
 *                             type: boolean
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         total:
 *                           type: integer
 *                         page:
 *                           type: integer
 *                         limit:
 *                           type: integer
 *                         totalPages:
 *                           type: integer
 *       400:
 *         description: Dữ liệu query không hợp lệ (days, page, limit lỗi)
 *       401:
 *         description: Chưa xác thực (thiếu token)
 *       403:
 *         description: Không có quyền truy cập
 */
router.get(
  '/care',
  authenticate,
  requirePermissions(Permission.CUSTOMER_CARE_VIEW),
  validateRequest({ query: GetCustomerCareQuerySchema }),
  customerController.getCustomersNeedingCare
);

/**
 * @openapi
 * /api/customers/{customerId}/care/contact:
 *   patch:
 *     summary: Đánh dấu khách hàng đã được liên hệ / chăm sóc
 *     description: Cập nhật thời gian liên hệ mới nhất và ghi nhận lịch sử chăm sóc vào hệ thống. Khách hàng sẽ không còn xuất hiện trong danh sách cần chăm sóc cho đến chu kỳ tiếp theo.
 *     tags:
 *       - Customer Care
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: customerId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID của khách hàng
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               contactedAt:
 *                 type: string
 *                 format: date-time
 *                 example: "2026-10-08T08:00:00Z"
 *                 description: Thời gian liên hệ (tùy chọn, hệ thống ưu tiên timestamp của máy chủ)
 *               note:
 *                 type: string
 *                 example: "Đã liên hệ tư vấn gia hạn gói dịch vụ năm 2027"
 *                 description: Ghi chú nội dung chăm sóc
 *               channel:
 *                 type: string
 *                 enum: [PHONE, EMAIL, MEETING, ZALO, OTHER]
 *                 default: PHONE
 *                 description: Kênh liên hệ
 *     responses:
 *       200:
 *         description: Đánh dấu liên hệ thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Đánh dấu liên hệ khách hàng thành công
 *                 data:
 *                   type: object
 *                   properties:
 *                     customerId:
 *                       type: string
 *                     customerCode:
 *                       type: string
 *                     customerName:
 *                       type: string
 *                     lastContactAt:
 *                       type: string
 *                     careStatus:
 *                       type: string
 *                       example: CONTACTED
 *                     needsCare:
 *                       type: boolean
 *                       example: false
 *       400:
 *         description: Request body hoặc params không hợp lệ
 *       401:
 *         description: Chưa xác thực
 *       403:
 *         description: Không có quyền thực hiện thao tác
 *       404:
 *         description: Không tìm thấy khách hàng
 */
router.patch(
  '/:customerId/care/contact',
  authenticate,
  requirePermissions(Permission.CUSTOMER_CARE_MANAGE),
  validateRequest({
    params: MarkCareContactParamsSchema,
    body: MarkCareContactBodySchema,
  }),
  customerController.markCustomerContacted
);

export const customerRoutes = router;
