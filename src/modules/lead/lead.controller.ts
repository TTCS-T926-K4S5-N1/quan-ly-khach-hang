import { Request, Response, NextFunction } from 'express';
import { leadService, LeadService } from './lead.service';
import { CreateLeadInputDto } from './dto/createLead.dto';
import { GetLeadsQueryDto } from './dto/getLeadsQuery.dto';
import { BadRequestError } from '../../errors/appError';

export class LeadController {
  constructor(private readonly service: LeadService = leadService) {}

  /**
   * POST /leads hoặc POST /api/leads
   * Tạo lead thủ công
   */
  createLead = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const body = (req.validatedBody || req.body) as CreateLeadInputDto;
      const userId = req.user?.id;

      const createdLead = await this.service.createLead(body, userId);

      return res.status(201).json({
        success: true,
        message: 'Tạo lead thành công',
        data: createdLead,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /leads/import/preview hoặc POST /api/leads/import/preview
   * Xem trước và kiểm tra file Excel, không ghi vào database
   */
  previewImport = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.file || !req.file.buffer) {
        throw new BadRequestError('Vui lòng đính kèm file Excel (.xlsx, .xls) cần xem trước (field: file)');
      }

      const previewData = await this.service.previewExcelImport(
        req.file.buffer,
        req.file.originalname
      );

      return res.status(200).json({
        success: true,
        message: 'Xem trước dữ liệu import thành công',
        data: previewData,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /leads/import hoặc POST /api/leads/import
   * Nhập lead hàng loạt từ file Excel vào database
   */
  importLeads = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.file || !req.file.buffer) {
        throw new BadRequestError('Vui lòng đính kèm file Excel (.xlsx, .xls) để import (field: file)');
      }

      const userId = req.user?.id;
      const result = await this.service.importExcelLeads(
        req.file.buffer,
        userId,
        req.file.originalname
      );

      return res.status(200).json({
        success: true,
        message: 'Import danh sách lead hoàn tất',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /leads hoặc GET /api/leads
   * Lấy danh sách lead
   */
  getLeads = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const query = (req.validatedQuery || req.query) as unknown as GetLeadsQueryDto;
      const result = await this.service.getLeads(query);

      return res.status(200).json({
        success: true,
        message: 'Lấy danh sách lead thành công',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };
}

export const leadController = new LeadController();
