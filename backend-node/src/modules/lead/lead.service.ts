import { leadRepository, LeadRepository } from './lead.repository';
import { CreateLeadInputDto } from './dto/createLead.dto';
import { GetLeadsQueryDto } from './dto/getLeadsQuery.dto';
import { ExcelLeadParser, ParsedLeadRow } from './lead.excel';
import { ConflictError, BadRequestError, NotFoundError, ForbiddenError } from '../../errors/appError';
import { Lead } from '@prisma/client';
import { ConvertLeadBodyDto, ConvertedLeadResponse } from './dto/convertLead.dto';
import { AuthUser } from '../../middlewares/auth.middleware';
import { UserRole } from '../../constants/permissions.constant';

export interface RowErrorDetail {
  row: number;
  errors: string[];
}

export interface ImportPreviewResult {
  fileName?: string;
  totalRows: number;
  validRows: number;
  invalidRows: number;
  skippedRows: number;
  preview: Array<{
    rowNumber: number;
    isValid: boolean;
    data: ParsedLeadRow['data'];
    errors: string[];
  }>;
  errors: RowErrorDetail[];
}

export interface ImportExecutionResult {
  fileName?: string;
  totalRows: number;
  successCount: number;
  failureCount: number;
  skippedCount: number;
  importedLeads: Array<{
    id: string;
    leadCode?: string | null;
    fullName: string;
    phone?: string | null;
    email?: string | null;
    source: string;
    status: string;
    createdAt: Date;
  }>;
  failedRows: RowErrorDetail[];
}

export class LeadService {
  constructor(private readonly leadRepo: LeadRepository = leadRepository) {}

  /**
   * Tạo lead thủ công
   */
  async createLead(input: CreateLeadInputDto, userId?: string): Promise<Lead> {
    const fullName = input.fullName.trim();
    const source = input.source.trim();
    const phone = input.phone?.trim() || null;
    const email = input.email?.trim().toLowerCase() || null;

    if (!source) {
      throw new BadRequestError('Nguồn lead (source) là bắt buộc');
    }

    // 1. Kiểm tra trùng lặp theo số điện thoại
    if (phone) {
      const existingByPhone = await this.leadRepo.findByPhone(phone);
      if (existingByPhone) {
        throw new ConflictError(
          `Lead với số điện thoại '${phone}' đã tồn tại trong hệ thống (Mã: ${existingByPhone.leadCode || existingByPhone.id})`
        );
      }
    }

    // 2. Kiểm tra trùng lặp theo email
    if (email) {
      const existingByEmail = await this.leadRepo.findByEmail(email);
      if (existingByEmail) {
        throw new ConflictError(
          `Lead với email '${email}' đã tồn tại trong hệ thống (Mã: ${existingByEmail.leadCode || existingByEmail.id})`
        );
      }
    }

    // 3. Tự động sinh mã lead nếu chưa có
    const leadCode =
      input.leadCode?.trim() ||
      `LEAD-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;

    // 4. Lưu vào cơ sở dữ liệu
    return this.leadRepo.create({
      leadCode,
      fullName,
      source,
      phone,
      email,
      company: input.company?.trim() || null,
      jobTitle: input.jobTitle?.trim() || null,
      address: input.address?.trim() || null,
      status: input.status?.trim() || 'NEW',
      notes: input.notes?.trim() || null,
      createdById: userId || null,
    });
  }

  /**
   * Xem trước và kiểm tra file Excel import (chưa lưu database)
   */
  async previewExcelImport(buffer: Buffer, fileName?: string): Promise<ImportPreviewResult> {
    const parsed = ExcelLeadParser.parse(buffer);
    const validatedRows = await this.validateRowsAgainstDatabase(parsed.parsedRows);

    const validRows = validatedRows.filter((r) => r.isValid);
    const invalidRows = validatedRows.filter((r) => !r.isValid);

    const errorDetails: RowErrorDetail[] = invalidRows.map((r) => ({
      row: r.rowNumber,
      errors: r.errors,
    }));

    return {
      fileName,
      totalRows: parsed.totalRows,
      validRows: validRows.length,
      invalidRows: invalidRows.length,
      skippedRows: parsed.skippedRows,
      preview: validatedRows.map((r) => ({
        rowNumber: r.rowNumber,
        isValid: r.isValid,
        data: r.data,
        errors: r.errors,
      })),
      errors: errorDetails,
    };
  }

  /**
   * Thực hiện import các lead hợp lệ từ file Excel vào database
   */
  async importExcelLeads(
    buffer: Buffer,
    userId?: string,
    fileName?: string
  ): Promise<ImportExecutionResult> {
    const parsed = ExcelLeadParser.parse(buffer);
    const validatedRows = await this.validateRowsAgainstDatabase(parsed.parsedRows);

    const validRows = validatedRows.filter((r) => r.isValid);
    const invalidRows = validatedRows.filter((r) => !r.isValid);

    const failedRows: RowErrorDetail[] = invalidRows.map((r) => ({
      row: r.rowNumber,
      errors: r.errors,
    }));

    // Chuẩn bị dữ liệu để insert cho các dòng hợp lệ
    const leadsToInsert = validRows.map((row, index) => {
      const uniqueSuffix = `${Date.now().toString().slice(-4)}${index + 1}`;
      const leadCode = `LEAD-${new Date().getFullYear()}-${uniqueSuffix}`;

      return {
        leadCode,
        fullName: row.data.fullName.trim(),
        source: row.data.source.trim(),
        phone: row.data.phone?.trim() || null,
        email: row.data.email?.trim().toLowerCase() || null,
        company: row.data.company?.trim() || null,
        jobTitle: row.data.jobTitle?.trim() || null,
        address: row.data.address?.trim() || null,
        status: row.data.status?.trim() || 'NEW',
        notes: row.data.notes?.trim() || null,
        createdById: userId || null,
      };
    });

    const importedLeads = await this.leadRepo.batchCreate(leadsToInsert);

    return {
      fileName,
      totalRows: parsed.totalRows,
      successCount: importedLeads.length,
      failureCount: failedRows.length,
      skippedCount: parsed.skippedRows,
      importedLeads: importedLeads.map((l) => ({
        id: l.id,
        leadCode: l.leadCode,
        fullName: l.fullName,
        phone: l.phone,
        email: l.email,
        source: l.source,
        status: l.status,
        createdAt: l.createdAt,
      })),
      failedRows,
    };
  }

  /**
   * Lấy danh sách lead có phân trang và tìm kiếm
   */
  async getLeads(query: GetLeadsQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const { items, total } = await this.leadRepo.findLeads({
      skip,
      take: limit,
      search: query.search,
      source: query.source,
      status: query.status,
    });

    const totalPages = Math.ceil(total / limit) || (total === 0 ? 0 : 1);

    return {
      items,
      pagination: {
        total,
        page,
        limit,
        totalPages,
        hasPrevPage: page > 1 && totalPages > 0,
        hasNextPage: page < totalPages,
      },
    };
  }

  /**
   * Kiểm tra trùng lặp các dòng với dữ liệu trong database
   */
  private async validateRowsAgainstDatabase(rows: ParsedLeadRow[]): Promise<ParsedLeadRow[]> {
    // Thu thập tất cả số điện thoại và email từ các dòng hợp lệ ban đầu
    const candidatePhones: string[] = [];
    const candidateEmails: string[] = [];

    for (const r of rows) {
      if (r.data.phone) candidatePhones.push(r.data.phone.trim());
      if (r.data.email) candidateEmails.push(r.data.email.trim().toLowerCase());
    }

    const [existingPhones, existingEmails] = await Promise.all([
      this.leadRepo.findExistingPhones(candidatePhones),
      this.leadRepo.findExistingEmails(candidateEmails),
    ]);

    const existingPhoneSet = new Set(existingPhones);
    const existingEmailSet = new Set(existingEmails);

    return rows.map((r) => {
      const errors = [...r.errors];

      if (r.data.phone && existingPhoneSet.has(r.data.phone.trim())) {
        errors.push(`Số điện thoại '${r.data.phone}' đã tồn tại trong hệ thống`);
      }

      if (r.data.email && existingEmailSet.has(r.data.email.trim().toLowerCase())) {
        errors.push(`Email '${r.data.email}' đã tồn tại trong hệ thống`);
      }

      return {
        ...r,
        errors,
        isValid: errors.length === 0,
      };
    });
  }

  /**
   * Chuyển đổi Lead thành Customer, Contact và Opportunity (SCRUM-70)
   */
  async convertLead(
    leadId: string,
    body: ConvertLeadBodyDto = {},
    user?: AuthUser
  ): Promise<ConvertedLeadResponse> {
    const lead = await this.leadRepo.findById(leadId);
    if (!lead) {
      throw new NotFoundError(`Lead với ID '${leadId}' không tồn tại trong hệ thống`);
    }

    // 1. Kiểm tra data scope
    if (
      user &&
      user.dataScope === 'OWN' &&
      user.role !== UserRole.ADMIN &&
      user.role !== UserRole.CARE_MANAGER
    ) {
      if (lead.createdById && lead.createdById !== user.id) {
        throw new ForbiddenError(
          'Bạn không có quyền chuyển đổi Lead ngoài phạm vi phụ trách (Data Scope restricted)'
        );
      }
    }

    // 2. Kiểm tra Lead chưa được chuyển đổi trước đó
    if (lead.status === 'CONVERTED' || (lead as any).convertedAt) {
      throw new BadRequestError('Lead này đã được chuyển đổi trước đó, không thể chuyển đổi lần thứ hai');
    }

    // 3. Kiểm tra tính hợp lệ về trạng thái nghiệp vụ của Lead
    const unqualifiedStatuses = ['DISQUALIFIED', 'REJECTED', 'LOST', 'UNQUALIFIED'];
    if (unqualifiedStatuses.includes(lead.status.toUpperCase())) {
      throw new BadRequestError(`Lead ở trạng thái '${lead.status}' không đủ điều kiện để chuyển đổi`);
    }

    // 4. Thực hiện transaction chuyển đổi
    return this.leadRepo.convertLead(leadId, {
      userId: user?.id,
      ...body,
    });
  }
}

export const leadService = new LeadService();
