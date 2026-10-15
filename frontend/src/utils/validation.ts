import { z } from 'zod';

// Suggested lost reasons as specified in the requirement:
export const SUGGESTED_LOSS_REASONS = [
  'Giá cao',
  'Khách hàng chọn đối thủ',
  'Sản phẩm chưa đáp ứng nhu cầu',
  'Không đủ ngân sách',
  'Khách hàng hoãn quyết định',
  'Chăm sóc khách hàng chưa tốt',
  'Lý do khác',
] as const;

/**
 * 3.2. Form Validation Schema for Closing Won
 * Yêu cầu:
 * - Không cho phép xác nhận nếu chưa nhập giá trị chốt thực tế hoặc ngày ký.
 * - Giá trị chốt thực tế phải là số hợp lệ lớn hơn 0.
 * - Ngày ký phải là ngày hợp lệ.
 * - Hiển thị lỗi ngay dưới trường nhập liệu.
 */
export const closeWonSchema = z.object({
  actualAmount: z
    .preprocess(
      (val) => (val === '' || val === null || val === undefined ? NaN : Number(val)),
      z.number({ invalid_type_error: 'Vui lòng nhập giá trị chốt hợp lệ' })
    )
    .refine((val) => !isNaN(val) && val > 0, {
      message: 'Giá trị chốt thực tế bắt buộc phải là số lớn hơn 0',
    }),
  contractDate: z
    .string({ required_error: 'Vui lòng chọn ngày ký hợp đồng' })
    .min(1, 'Ngày ký hợp đồng là bắt buộc')
    .refine((val) => !isNaN(Date.parse(val)), {
      message: 'Ngày ký hợp đồng không hợp lệ',
    }),
  winReasonId: z.preprocess(
    (val) => (val === '' || val === undefined ? undefined : Number(val)),
    z.number().optional()
  ),
  notes: z.string().max(1000, 'Ghi chú không được vượt quá 1000 ký tự').optional(),
});

export type CloseWonFormValues = z.infer<typeof closeWonSchema>;

/**
 * 3.3. Form Validation Schema for Closing Lost
 * Yêu cầu:
 * - Lý do thua (bắt buộc). Không cho phép xác nhận nếu chưa chọn lý do thua.
 * - Nếu chọn "Lý do khác", hiển thị thêm trường nhập chi tiết (bắt buộc).
 * - Đối thủ thắng thầu (không bắt buộc).
 * - Ghi chú nguyên nhân thua (không bắt buộc).
 */
export const closeLostSchema = z
  .object({
    lossReasonName: z
      .string({ required_error: 'Vui lòng chọn lý do thua' })
      .min(1, 'Vui lòng chọn lý do thua'),
    lossReasonId: z.preprocess(
      (val) => (val === '' || val === undefined ? undefined : Number(val)),
      z.number().optional()
    ),
    otherReasonDetails: z.string().optional(),
    competitorId: z.preprocess(
      (val) => (val === '' || val === undefined ? undefined : Number(val)),
      z.number().optional()
    ),
    competitorName: z.string().optional(),
    notes: z.string().max(1000, 'Ghi chú không được vượt quá 1000 ký tự').optional(),
  })
  .superRefine((data, ctx) => {
    if (data.lossReasonName === 'Lý do khác') {
      if (!data.otherReasonDetails || data.otherReasonDetails.trim().length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['otherReasonDetails'],
          message: 'Vui lòng nhập chi tiết lý do khác khi chọn mục này',
        });
      }
    }
  });

export type CloseLostFormValues = z.infer<typeof closeLostSchema>;

/**
 * 3.5. Form Validation Schema for Reopening Opportunity
 * Yêu cầu:
 * - Không cho phép mở lại nếu chưa nhập lý do.
 */
export const reopenSchema = z.object({
  reason: z
    .string({ required_error: 'Vui lòng nhập lý do mở lại cơ hội' })
    .trim()
    .min(3, 'Lý do mở lại phải có ít nhất 3 ký tự')
    .max(500, 'Lý do mở lại không quá 500 ký tự'),
});

export type ReopenFormValues = z.infer<typeof reopenSchema>;

/**
 * Currency and Date formatters
 */
export function formatCurrencyVND(value: number | undefined | null): string {
  if (value === undefined || value === null || isNaN(value)) {
    return '0 ₫';
  }
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatDateVN(dateStr: string | undefined | null): string {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  } catch {
    return dateStr;
  }
}

export function formatDateTimeVN(dateStr: string | undefined | null): string {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const hours = String(d.getHours()).padStart(2, '0');
    const mins = String(d.getMinutes()).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${hours}:${mins} - ${day}/${month}/${year}`;
  } catch {
    return dateStr;
  }
}
