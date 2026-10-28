import { prisma } from '../../config/prisma';
import {
  OpportunityRepository,
  opportunityRepository,
  CreateOpportunityData,
  UpdateOpportunityData,
} from './opportunity.repository';
import { CreateOpportunityDto, isDateInPast } from './dto/createOpportunity.dto';
import { UpdateOpportunityDto } from './dto/updateOpportunity.dto';
import { UpdateOpportunityStageDto } from './dto/updateOpportunityStage.dto';
import { GetOpportunitiesQueryDto } from './dto/getOpportunitiesQuery.dto';
import {
  OpportunityStage,
  getDefaultProbabilityForStage,
} from '../../constants/opportunity.constant';
import {
  NotFoundError,
  BadRequestError,
  ForbiddenError,
  ValidationError,
} from '../../errors/appError';
import { AuthUser } from '../../middlewares/auth.middleware';
import { UserRole } from '../../constants/permissions.constant';
import { Prisma } from '@prisma/client';

export interface FormattedOpportunity {
  id: string;
  opportunityCode: string | null;
  name: string;
  customerId: string;
  customer: {
    id: string;
    customerCode: string;
    customerName: string;
    phone: string | null;
    email: string | null;
    address: string | null;
  } | null;
  primaryContactId: string | null;
  contactId: string | null;
  primaryContact: {
    id: string;
    contactCode: string | null;
    name: string;
    phone: string | null;
    email: string | null;
    jobTitle: string | null;
    isPrimary: boolean;
  } | null;
  contact: any;
  stage: string;
  expectedValue: number | null;
  amount: number | null;
  expectedCloseDate: Date | null;
  closeDate: Date | null;
  source: string | null;
  probability: number;
  notes: string | null;
  description: string | null;
  ownerId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export function formatOpportunityResponse(opp: any): FormattedOpportunity {
  const primaryContact = opp.contact || null;
  return {
    id: opp.id,
    opportunityCode: opp.opportunityCode || null,
    name: opp.name,
    customerId: opp.customerId,
    customer: opp.customer
      ? {
          id: opp.customer.id,
          customerCode: opp.customer.customerCode,
          customerName: opp.customer.customerName,
          phone: opp.customer.phone,
          email: opp.customer.email,
          address: opp.customer.address,
        }
      : null,
    primaryContactId: opp.contactId || null,
    contactId: opp.contactId || null,
    primaryContact: primaryContact
      ? {
          id: primaryContact.id,
          contactCode: primaryContact.contactCode,
          name: primaryContact.name,
          phone: primaryContact.phone,
          email: primaryContact.email,
          jobTitle: primaryContact.jobTitle,
          isPrimary: primaryContact.isPrimary,
        }
      : null,
    contact: primaryContact,
    stage: opp.stage,
    expectedValue: opp.expectedValue !== null && opp.expectedValue !== undefined ? opp.expectedValue : opp.amount,
    amount: opp.amount !== null && opp.amount !== undefined ? opp.amount : opp.expectedValue,
    expectedCloseDate: opp.expectedCloseDate || opp.closeDate || null,
    closeDate: opp.closeDate || opp.expectedCloseDate || null,
    source: opp.source || null,
    probability: opp.probability !== null && opp.probability !== undefined ? opp.probability : 10,
    notes: opp.notes || opp.description || null,
    description: opp.description || opp.notes || null,
    ownerId: opp.ownerId || null,
    createdAt: opp.createdAt,
    updatedAt: opp.updatedAt,
  };
}

export class OpportunityService {
  constructor(private readonly repo: OpportunityRepository = opportunityRepository) {}

  /**
   * Tạo cơ hội bán hàng mới (SCRUM-72)
   */
  async createOpportunity(dto: CreateOpportunityDto, user?: AuthUser) {
    // 1. Kiểm tra khách hàng có tồn tại không
    const customer = await prisma.customer.findUnique({
      where: { id: dto.customerId },
    });
    if (!customer) {
      throw new NotFoundError(`Khách hàng với ID '${dto.customerId}' không tồn tại`);
    }

    // 2. Kiểm tra người liên hệ chính (nếu có)
    const contactId = dto.primaryContactId || dto.contactId;
    if (contactId) {
      const contact = await prisma.contact.findUnique({
        where: { id: contactId },
      });
      if (!contact) {
        throw new NotFoundError(`Người liên hệ với ID '${contactId}' không tồn tại`);
      }

      // Kiểm tra người liên hệ có thuộc khách hàng đã chọn không
      if (contact.customerId && contact.customerId !== customer.id) {
        throw new BadRequestError(
          `Người liên hệ '${contact.name}' không thuộc khách hàng '${customer.customerName}'`
        );
      }
    }

    // 3. Kiểm tra ngày dự kiến chốt không được nằm trong quá khứ khi tạo mới
    const rawCloseDate = dto.expectedCloseDate || dto.closeDate;
    if (rawCloseDate) {
      if (isDateInPast(rawCloseDate)) {
        throw new ValidationError('Ngày dự kiến chốt không được nằm trong quá khứ khi tạo mới cơ hội');
      }
    }

    // 4. Xác định giai đoạn và xác suất thành công mặc định hoặc tùy chỉnh
    const stage = (dto.stage || OpportunityStage.QUALIFICATION).toUpperCase();
    let probability = dto.probability;
    if (probability === undefined || probability === null) {
      probability = getDefaultProbabilityForStage(stage);
    }

    const value = dto.expectedValue !== undefined && dto.expectedValue !== null ? dto.expectedValue : (dto.amount ?? null);
    const closeDate = rawCloseDate ? new Date(rawCloseDate) : null;
    const noteText = dto.notes !== undefined && dto.notes !== null ? dto.notes : (dto.description ?? null);

    const oppData: CreateOpportunityData = {
      name: dto.name.trim(),
      customerId: customer.id,
      contactId: contactId || null,
      stage,
      expectedValue: value,
      amount: value,
      expectedCloseDate: closeDate,
      closeDate,
      probability,
      source: dto.source?.trim() || null,
      notes: noteText?.trim() || null,
      description: noteText?.trim() || null,
      ownerId: user?.id || null,
    };

    const created = await this.repo.create(oppData);
    return formatOpportunityResponse(created);
  }

  /**
   * Lấy danh sách cơ hội bán hàng, hỗ trợ phân trang, lọc và tìm kiếm (SCRUM-72)
   */
  async getOpportunities(query: GetOpportunitiesQueryDto, user?: AuthUser) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;
    const skip = (page - 1) * limit;

    const where: Prisma.OpportunityWhereInput = {};

    if (query.customerId) {
      where.customerId = query.customerId;
    }

    if (query.stage) {
      where.stage = query.stage.toUpperCase();
    }

    if (query.source) {
      where.source = { contains: query.source };
    }

    if (query.search) {
      const s = query.search.trim();
      where.OR = [
        { name: { contains: s } },
        { opportunityCode: { contains: s } },
        { customer: { customerName: { contains: s } } },
      ];
    }

    // Kiểm tra Data Scope: nếu là OWN và không phải ADMIN / CARE_MANAGER -> chỉ xem cơ hội do mình phụ trách
    if (
      user?.dataScope === 'OWN' &&
      user.role !== UserRole.ADMIN &&
      user.role !== UserRole.CARE_MANAGER
    ) {
      where.ownerId = user.id;
    }

    const sortBy = query.sortBy || 'createdAt';
    const sortOrder = query.sortOrder || 'desc';
    const orderBy: Prisma.OpportunityOrderByWithRelationInput = {
      [sortBy]: sortOrder,
    };

    const [items, total] = await Promise.all([
      this.repo.findMany({
        skip,
        take: limit,
        where,
        orderBy,
      }),
      this.repo.count(where),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      items: items.map(formatOpportunityResponse),
      pagination: {
        total,
        page,
        limit,
        totalPages,
      },
    };
  }

  /**
   * Xem chi tiết một cơ hội bán hàng (SCRUM-72)
   */
  async getOpportunityById(id: string, user?: AuthUser) {
    const opp = await this.repo.findById(id);
    if (!opp) {
      throw new NotFoundError(`Không tìm thấy cơ hội bán hàng với ID '${id}'`);
    }

    // Phân quyền Data Scope
    if (
      user?.dataScope === 'OWN' &&
      user.role !== UserRole.ADMIN &&
      user.role !== UserRole.CARE_MANAGER &&
      opp.ownerId &&
      opp.ownerId !== user.id
    ) {
      throw new ForbiddenError('Bạn không có quyền truy cập cơ hội bán hàng này (data scope: OWN)');
    }

    return formatOpportunityResponse(opp);
  }

  /**
   * Cập nhật thông tin cơ hội bán hàng (SCRUM-72)
   */
  async updateOpportunity(id: string, dto: UpdateOpportunityDto, user?: AuthUser) {
    const opp = await this.repo.findById(id);
    if (!opp) {
      throw new NotFoundError(`Không tìm thấy cơ hội bán hàng với ID '${id}'`);
    }

    // Phân quyền Data Scope
    if (
      user?.dataScope === 'OWN' &&
      user.role !== UserRole.ADMIN &&
      user.role !== UserRole.CARE_MANAGER &&
      opp.ownerId &&
      opp.ownerId !== user.id
    ) {
      throw new ForbiddenError('Bạn không có quyền cập nhật cơ hội bán hàng này (data scope: OWN)');
    }

    // Kiểm tra khách hàng mới nếu có cập nhật
    const targetCustomerId = dto.customerId || opp.customerId;
    if (dto.customerId && dto.customerId !== opp.customerId) {
      const customer = await prisma.customer.findUnique({
        where: { id: dto.customerId },
      });
      if (!customer) {
        throw new NotFoundError(`Khách hàng với ID '${dto.customerId}' không tồn tại`);
      }
    }

    // Kiểm tra người liên hệ mới nếu có cập nhật
    const contactId = dto.primaryContactId !== undefined ? dto.primaryContactId : dto.contactId;
    if (contactId !== undefined && contactId !== null) {
      const contact = await prisma.contact.findUnique({
        where: { id: contactId },
      });
      if (!contact) {
        throw new NotFoundError(`Người liên hệ với ID '${contactId}' không tồn tại`);
      }
      if (contact.customerId && contact.customerId !== targetCustomerId) {
        throw new BadRequestError(`Người liên hệ '${contact.name}' không thuộc khách hàng đã chọn`);
      }
    }

    const updateData: UpdateOpportunityData = {};

    if (dto.name !== undefined) updateData.name = dto.name.trim();
    if (dto.customerId !== undefined) updateData.customerId = dto.customerId;
    if (contactId !== undefined) updateData.contactId = contactId;

    if (dto.stage !== undefined) {
      updateData.stage = dto.stage.toUpperCase();
      // Nếu đổi giai đoạn mà người dùng không cung cấp xác suất tùy chỉnh, tự cập nhật xác suất mặc định theo giai đoạn mới
      if (dto.probability === undefined) {
        updateData.probability = getDefaultProbabilityForStage(dto.stage);
      }
    }

    if (dto.probability !== undefined) {
      updateData.probability = dto.probability;
    }

    if (dto.expectedValue !== undefined) {
      updateData.expectedValue = dto.expectedValue;
      updateData.amount = dto.expectedValue;
    } else if (dto.amount !== undefined) {
      updateData.expectedValue = dto.amount;
      updateData.amount = dto.amount;
    }

    const rawCloseDate = dto.expectedCloseDate !== undefined ? dto.expectedCloseDate : dto.closeDate;
    if (rawCloseDate !== undefined) {
      updateData.expectedCloseDate = rawCloseDate ? new Date(rawCloseDate) : null;
      updateData.closeDate = rawCloseDate ? new Date(rawCloseDate) : null;
    }

    if (dto.source !== undefined) updateData.source = dto.source?.trim() || null;

    if (dto.notes !== undefined) {
      updateData.notes = dto.notes?.trim() || null;
      updateData.description = dto.notes?.trim() || null;
    } else if (dto.description !== undefined) {
      updateData.notes = dto.description?.trim() || null;
      updateData.description = dto.description?.trim() || null;
    }

    const updated = await this.repo.update(id, updateData);
    return formatOpportunityResponse(updated);
  }

  /**
   * Cập nhật riêng giai đoạn bán hàng (SCRUM-72)
   */
  async updateOpportunityStage(id: string, dto: UpdateOpportunityStageDto, user?: AuthUser) {
    const opp = await this.repo.findById(id);
    if (!opp) {
      throw new NotFoundError(`Không tìm thấy cơ hội bán hàng với ID '${id}'`);
    }

    // Phân quyền Data Scope
    if (
      user?.dataScope === 'OWN' &&
      user.role !== UserRole.ADMIN &&
      user.role !== UserRole.CARE_MANAGER &&
      opp.ownerId &&
      opp.ownerId !== user.id
    ) {
      throw new ForbiddenError('Bạn không có quyền cập nhật giai đoạn cơ hội bán hàng này (data scope: OWN)');
    }

    const stage = dto.stage.toUpperCase();
    let probability = dto.probability;
    if (probability === undefined || probability === null) {
      probability = getDefaultProbabilityForStage(stage);
    }

    const updated = await this.repo.update(id, {
      stage,
      probability,
    });

    return formatOpportunityResponse(updated);
  }
}

export const opportunityService = new OpportunityService();
