import { Router } from 'express';
import { leadController } from './lead.controller';
import { validateRequest } from '../../middlewares/validate.middleware';
import { authenticate, requirePermissions } from '../../middlewares/auth.middleware';
import { Permission } from '../../constants/permissions.constant';
import { CreateLeadBodySchema } from './dto/createLead.dto';
import { GetLeadsQuerySchema } from './dto/getLeadsQuery.dto';
import { ConvertLeadParamsSchema, ConvertLeadBodySchema } from './dto/convertLead.dto';
import { uploadExcelSingle } from '../../middlewares/upload.middleware';

const router = Router();

/**
 * @openapi
 * /api/leads:
 *   post:
 *     summary: Tạo lead thủ công (SCRUM-64)
 *     description: Cho phép nhân viên Marketing tạo mới một lead thủ công với nguồn (source) bắt buộc. Kiểm tra dữ liệu đầu vào và trùng lặp theo số điện thoại hoặc email.
 *     tags:
 *       - Leads Management
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - fullName
 *               - source
 *             properties:
 *               fullName:
 *                 type: string
 *                 example: "Nguyễn Văn An"
 *                 description: Họ và tên của lead
 *               source:
 *                 type: string
 *                 example: "CONFERENCE"
 *                 description: Nguồn thu thập lead (hội thảo, sự kiện, danh thiếp, v.v.)
 *               phone:
 *                 type: string
 *                 example: "0901234567"
 *                 description: Số điện thoại liên hệ
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "nguyenvanan@company.vn"
 *                 description: Email liên hệ
 *               company:
 *                 type: string
 *                 example: "Công ty Cổ phần Alpha"
 *                 description: Công ty hoặc tổ chức
 *               jobTitle:
 *                 type: string
 *                 example: "Trưởng phòng Kinh doanh"
 *                 description: Chức danh công việc
 *               address:
 *                 type: string
 *                 example: "Quận 1, TP. Hồ Chí Minh"
 *               status:
 *                 type: string
 *                 default: "NEW"
 *                 example: "NEW"
 *               notes:
 *                 type: string
 *                 example: "Gặp gỡ và trao đổi tại hội thảo Tech Expo 2026"
 *     responses:
 *       201:
 *         description: Tạo lead thành công
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
 *                   example: "Tạo lead thành công"
 *                 data:
 *                   type: object
 *       400:
 *         description: Dữ liệu đầu vào không hợp lệ hoặc thiếu nguồn lead
 *       401:
 *         description: Chưa xác thực
 *       403:
 *         description: Không có quyền LEAD_CREATE
 *       409:
 *         description: Lead với số điện thoại hoặc email đã tồn tại
 */
router.post(
  '/',
  authenticate,
  requirePermissions(Permission.LEAD_CREATE),
  validateRequest({ body: CreateLeadBodySchema }),
  leadController.createLead
);

/**
 * @openapi
 * /api/leads/import/preview:
 *   post:
 *     summary: Xem trước và kiểm tra file Excel import lead (SCRUM-64)
 *     description: Tải lên file Excel (.xlsx, .xls) để kiểm tra cấu trúc cột, trường bắt buộc, dữ liệu hợp lệ và dữ liệu trùng lặp theo từng dòng trước khi import. Không ghi dữ liệu vào database.
 *     tags:
 *       - Leads Management
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - file
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: File Excel (.xlsx, .xls)
 *     responses:
 *       200:
 *         description: Xem trước dữ liệu thành công
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
 *                   example: "Xem trước dữ liệu import thành công"
 *                 data:
 *                   type: object
 *                   properties:
 *                     fileName:
 *                       type: string
 *                     totalRows:
 *                       type: integer
 *                     validRows:
 *                       type: integer
 *                     invalidRows:
 *                       type: integer
 *                     skippedRows:
 *                       type: integer
 *                     preview:
 *                       type: array
 *                       items:
 *                         type: object
 *                     errors:
 *                       type: array
 *                       items:
 *                         type: object
 *       400:
 *         description: File không đúng định dạng, vượt quá kích thước hoặc thiếu cột bắt buộc
 *       401:
 *         description: Chưa xác thực
 *       403:
 *         description: Không có quyền LEAD_CREATE
 */
router.post(
  '/import/preview',
  authenticate,
  requirePermissions(Permission.LEAD_CREATE),
  uploadExcelSingle('file'),
  leadController.previewImport
);

/**
 * @openapi
 * /api/leads/import:
 *   post:
 *     summary: Import danh sách lead từ file Excel vào database (SCRUM-64)
 *     description: Tải lên file Excel và lưu các bản ghi hợp lệ vào database. Các bản ghi lỗi sẽ được thống kê và trả về chi tiết theo số dòng.
 *     tags:
 *       - Leads Management
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - file
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: File Excel (.xlsx, .xls)
 *     responses:
 *       200:
 *         description: Import dữ liệu hoàn tất
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
 *                   example: "Import danh sách lead hoàn tất"
 *                 data:
 *                   type: object
 *                   properties:
 *                     totalRows:
 *                       type: integer
 *                     successCount:
 *                       type: integer
 *                     failureCount:
 *                       type: integer
 *                     skippedCount:
 *                       type: integer
 *                     importedLeads:
 *                       type: array
 *                       items:
 *                         type: object
 *                     failedRows:
 *                       type: array
 *                       items:
 *                         type: object
 *       400:
 *         description: File không hợp lệ
 *       401:
 *         description: Chưa xác thực
 *       403:
 *         description: Không có quyền LEAD_CREATE
 */
router.post(
  '/import',
  authenticate,
  requirePermissions(Permission.LEAD_CREATE),
  uploadExcelSingle('file'),
  leadController.importLeads
);

/**
 * @openapi
 * /api/leads:
 *   get:
 *     summary: Lấy danh sách lead
 *     description: Lấy danh sách lead có phân trang, tìm kiếm theo tên, email, điện thoại, công ty, nguồn.
 *     tags:
 *       - Leads Management
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: source
 *         schema:
 *           type: string
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Lấy danh sách lead thành công
 */
router.get(
  '/',
  authenticate,
  requirePermissions(Permission.LEAD_VIEW),
  validateRequest({ query: GetLeadsQuerySchema }),
  leadController.getLeads
);

/**
 * @openapi
 * /api/leads/{id}/convert:
 *   post:
 *     summary: Chuyển đổi Lead thành Customer, Contact và Opportunity (SCRUM-70)
 *     description: Chuyển một Lead đủ điều kiện thành khách hàng doanh nghiệp (Customer), người liên hệ (Contact) và cơ hội bán hàng (Opportunity) trong một transaction duy nhất. Tự động tái sử dụng dữ liệu Lead, áp dụng quy tắc chống trùng lặp Customer/Contact và ngăn chặn chuyển đổi lần 2.
 *     tags:
 *       - Leads Management
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID của Lead cần chuyển đổi
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               customerName:
 *                 type: string
 *                 description: Ghi đè tên khách hàng (nếu bỏ trống, hệ thống lấy từ company hoặc fullName của Lead)
 *                 example: "Công ty Cổ phần Alpha"
 *               customerCode:
 *                 type: string
 *                 description: Tùy chọn mã khách hàng (nếu bỏ trống, tự động sinh mã CUST-YYYY-XXXXXX)
 *                 example: "CUST-2026-00123"
 *               contactName:
 *                 type: string
 *                 description: Ghi đè tên người liên hệ (nếu bỏ trống, lấy fullName của Lead)
 *                 example: "Nguyễn Văn Nam"
 *               opportunityName:
 *                 type: string
 *                 description: Tên cơ hội bán hàng (nếu bỏ trống, tự động đặt "Cơ hội bán hàng - [Tên KH]")
 *                 example: "Cơ hội hợp tác giải pháp CRM 2026"
 *               opportunityAmount:
 *                 type: number
 *                 description: Giá trị dự kiến của cơ hội bán hàng (VNĐ)
 *                 example: 50000000
 *               opportunityStage:
 *                 type: string
 *                 default: "QUALIFICATION"
 *                 example: "QUALIFICATION"
 *                 description: Giai đoạn cơ hội bán hàng
 *               opportunityCloseDate:
 *                 type: string
 *                 format: date-time
 *                 example: "2026-12-31T00:00:00Z"
 *                 description: Ngày kỳ vọng đóng deal
 *               notes:
 *                 type: string
 *                 example: "Khách hàng muốn triển khai trước quý 1 năm sau"
 *     responses:
 *       200:
 *         description: Chuyển đổi Lead thành công
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
 *                   example: "Lead converted successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     leadId:
 *                       type: string
 *                       example: "lead_123"
 *                     status:
 *                       type: string
 *                       example: "CONVERTED"
 *                     customer:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                         customerCode:
 *                           type: string
 *                         name:
 *                           type: string
 *                     contact:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                         name:
 *                           type: string
 *                         email:
 *                           type: string
 *                     opportunity:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                         name:
 *                           type: string
 *                         status:
 *                           type: string
 *       400:
 *         description: Dữ liệu không hợp lệ, Lead đã được chuyển đổi trước đó hoặc trạng thái không đủ điều kiện
 *       401:
 *         description: Chưa đăng nhập hoặc token không hợp lệ
 *       403:
 *         description: Không có quyền chuyển đổi hoặc ngoài phạm vi phụ trách (Data Scope restricted)
 *       404:
 *         description: Không tìm thấy Lead với ID tương ứng
 */
router.post(
  '/:id/convert',
  authenticate,
  requirePermissions(Permission.LEAD_CONVERT),
  validateRequest({
    params: ConvertLeadParamsSchema,
    body: ConvertLeadBodySchema,
  }),
  leadController.convertLead
);

export const leadRoutes = router;
