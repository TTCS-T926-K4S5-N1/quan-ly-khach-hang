import { prisma } from '../../config/prisma';
import { Prisma, Opportunity } from '@prisma/client';

export interface CreateOpportunityData {
  opportunityCode?: string;
  name: string;
  customerId: string;
  contactId?: string | null;
  stage: string;
  expectedValue?: number | null;
  amount?: number | null;
  expectedCloseDate?: Date | null;
  closeDate?: Date | null;
  probability?: number | null;
  source?: string | null;
  notes?: string | null;
  description?: string | null;
  ownerId?: string | null;
}

export interface UpdateOpportunityData {
  name?: string;
  customerId?: string;
  contactId?: string | null;
  stage?: string;
  expectedValue?: number | null;
  amount?: number | null;
  expectedCloseDate?: Date | null;
  closeDate?: Date | null;
  probability?: number | null;
  source?: string | null;
  notes?: string | null;
  description?: string | null;
  ownerId?: string | null;
}

export class OpportunityRepository {
  /**
   * Sinh mã cơ hội bán hàng tự động theo định dạng OPP-YYYY-XXXXXX
   */
  generateOpportunityCode(): string {
    const year = new Date().getFullYear();
    const suffix = `${Date.now().toString().slice(-6)}${Math.floor(100 + Math.random() * 900)}`;
    return `OPP-${year}-${suffix}`;
  }

  /**
   * Tạo cơ hội bán hàng mới
   */
  async create(data: CreateOpportunityData): Promise<any> {
    const oppCode = data.opportunityCode || this.generateOpportunityCode();
    const value = data.expectedValue !== undefined ? data.expectedValue : (data.amount ?? null);
    const date = data.expectedCloseDate !== undefined ? data.expectedCloseDate : (data.closeDate ?? null);
    const noteText = data.notes !== undefined ? data.notes : (data.description ?? null);

    return prisma.opportunity.create({
      data: {
        opportunityCode: oppCode,
        name: data.name,
        customerId: data.customerId,
        contactId: data.contactId ?? null,
        stage: data.stage,
        expectedValue: value,
        amount: value,
        expectedCloseDate: date,
        closeDate: date,
        probability: data.probability ?? 10,
        source: data.source ?? null,
        notes: noteText,
        description: noteText,
        ownerId: data.ownerId ?? null,
      },
      include: {
        customer: true,
        contact: true,
      },
    });
  }

  /**
   * Tìm cơ hội theo ID bao gồm thông tin khách hàng và người liên hệ
   */
  async findById(id: string): Promise<any | null> {
    return prisma.opportunity.findUnique({
      where: { id },
      include: {
        customer: true,
        contact: true,
      },
    });
  }

  /**
   * Tìm cơ hội theo Opportunity Code
   */
  async findByCode(opportunityCode: string): Promise<any | null> {
    return prisma.opportunity.findUnique({
      where: { opportunityCode },
      include: {
        customer: true,
        contact: true,
      },
    });
  }

  /**
   * Lấy danh sách cơ hội bán hàng kèm quan hệ
   */
  async findMany(params: {
    skip?: number;
    take?: number;
    where?: Prisma.OpportunityWhereInput;
    orderBy?: Prisma.OpportunityOrderByWithRelationInput;
  }): Promise<any[]> {
    return prisma.opportunity.findMany({
      skip: params.skip,
      take: params.take,
      where: params.where,
      orderBy: params.orderBy,
      include: {
        customer: true,
        contact: true,
      },
    });
  }

  /**
   * Đếm số lượng cơ hội thỏa mãn điều kiện
   */
  async count(where?: Prisma.OpportunityWhereInput): Promise<number> {
    return prisma.opportunity.count({ where });
  }

  /**
   * Cập nhật thông tin cơ hội bán hàng
   */
  async update(id: string, data: UpdateOpportunityData): Promise<any> {
    const updatePayload: Prisma.OpportunityUpdateInput = {};

    if (data.name !== undefined) updatePayload.name = data.name;
    if (data.customerId !== undefined) {
      updatePayload.customer = { connect: { id: data.customerId } };
    }
    if (data.contactId !== undefined) {
      if (data.contactId === null) {
        updatePayload.contact = { disconnect: true };
      } else {
        updatePayload.contact = { connect: { id: data.contactId } };
      }
    }
    if (data.stage !== undefined) updatePayload.stage = data.stage;
    if (data.expectedValue !== undefined) {
      updatePayload.expectedValue = data.expectedValue;
      updatePayload.amount = data.expectedValue;
    } else if (data.amount !== undefined) {
      updatePayload.expectedValue = data.amount;
      updatePayload.amount = data.amount;
    }
    if (data.expectedCloseDate !== undefined) {
      updatePayload.expectedCloseDate = data.expectedCloseDate;
      updatePayload.closeDate = data.expectedCloseDate;
    } else if (data.closeDate !== undefined) {
      updatePayload.expectedCloseDate = data.closeDate;
      updatePayload.closeDate = data.closeDate;
    }
    if (data.probability !== undefined) updatePayload.probability = data.probability;
    if (data.source !== undefined) updatePayload.source = data.source;
    if (data.notes !== undefined) {
      updatePayload.notes = data.notes;
      updatePayload.description = data.notes;
    } else if (data.description !== undefined) {
      updatePayload.notes = data.description;
      updatePayload.description = data.description;
    }
    if (data.ownerId !== undefined) updatePayload.ownerId = data.ownerId;

    return prisma.opportunity.update({
      where: { id },
      data: updatePayload,
      include: {
        customer: true,
        contact: true,
      },
    });
  }

  /**
   * Lấy danh sách các cơ hội bán hàng của một khách hàng
   */
  async findByCustomerId(customerId: string): Promise<any[]> {
    return prisma.opportunity.findMany({
      where: { customerId },
      include: {
        customer: true,
        contact: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Xóa cơ hội bán hàng (nếu cần dọn dẹp hoặc test)
   */
  async delete(id: string): Promise<any> {
    return prisma.opportunity.delete({
      where: { id },
    });
  }
}

export const opportunityRepository = new OpportunityRepository();
