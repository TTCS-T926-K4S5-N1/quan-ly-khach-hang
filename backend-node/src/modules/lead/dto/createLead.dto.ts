import { z } from 'zod';

const phoneRegex = /^[+0-9() -]{8,20}$/;

export const CreateLeadBodySchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(1, { message: 'Họ và tên không được để trống' })
    .max(255, { message: 'Họ và tên không vượt quá 255 ký tự' }),
  source: z
    .string()
    .trim()
    .min(1, { message: 'Nguồn lead (source) không được để trống' })
    .max(100, { message: 'Nguồn lead không vượt quá 100 ký tự' }),
  phone: z
    .string()
    .trim()
    .regex(phoneRegex, { message: 'Định dạng số điện thoại không hợp lệ' })
    .optional()
    .nullable()
    .or(z.literal('')),
  email: z
    .string()
    .trim()
    .email({ message: 'Định dạng email không hợp lệ' })
    .max(255, { message: 'Email không vượt quá 255 ký tự' })
    .optional()
    .nullable()
    .or(z.literal('')),
  company: z
    .string()
    .trim()
    .max(255, { message: 'Tên công ty không vượt quá 255 ký tự' })
    .optional()
    .nullable()
    .or(z.literal('')),
  jobTitle: z
    .string()
    .trim()
    .max(150, { message: 'Chức danh không vượt quá 150 ký tự' })
    .optional()
    .nullable()
    .or(z.literal('')),
  address: z
    .string()
    .trim()
    .max(500, { message: 'Địa chỉ không vượt quá 500 ký tự' })
    .optional()
    .nullable()
    .or(z.literal('')),
  status: z
    .string()
    .trim()
    .max(50)
    .optional()
    .default('NEW'),
  notes: z
    .string()
    .trim()
    .max(2000, { message: 'Ghi chú không vượt quá 2000 ký tự' })
    .optional()
    .nullable()
    .or(z.literal('')),
  leadCode: z
    .string()
    .trim()
    .max(50)
    .optional()
    .nullable()
    .or(z.literal('')),
});

export type CreateLeadInputDto = z.input<typeof CreateLeadBodySchema>;
export type CreateLeadOutputDto = z.output<typeof CreateLeadBodySchema>;

