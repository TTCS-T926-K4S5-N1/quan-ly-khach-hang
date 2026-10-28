import { Request, Response, NextFunction } from 'express';
import { OpportunityService, opportunityService } from './opportunity.service';
import { CreateOpportunityDto } from './dto/createOpportunity.dto';
import { UpdateOpportunityDto, OpportunityIdParamDto } from './dto/updateOpportunity.dto';
import { UpdateOpportunityStageDto } from './dto/updateOpportunityStage.dto';
import { GetOpportunitiesQueryDto } from './dto/getOpportunitiesQuery.dto';

export class OpportunityController {
  constructor(private readonly service: OpportunityService = opportunityService) {}

  /**
   * POST /api/opportunities (hoặc POST /opportunities)
   * Tạo cơ hội bán hàng mới
   */
  createOpportunity = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const body = (req.validatedBody || req.body) as CreateOpportunityDto;
      const user = req.user;

      const created = await this.service.createOpportunity(body, user);

      return res.status(201).json({
        success: true,
        message: 'Tạo cơ hội bán hàng thành công',
        data: created,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/opportunities (hoặc GET /opportunities)
   * Lấy danh sách cơ hội bán hàng (phân trang, lọc, tìm kiếm)
   */
  getOpportunities = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const query = (req.validatedQuery || req.query) as unknown as GetOpportunitiesQueryDto;
      const user = req.user;

      const result = await this.service.getOpportunities(query, user);

      return res.status(200).json({
        success: true,
        message: 'Lấy danh sách cơ hội bán hàng thành công',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/opportunities/:id (hoặc GET /opportunities/:id)
   * Xem chi tiết một cơ hội bán hàng
   */
  getOpportunityById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = (req.validatedParams || req.params) as OpportunityIdParamDto;
      const user = req.user;

      const opp = await this.service.getOpportunityById(id, user);

      return res.status(200).json({
        success: true,
        message: 'Lấy thông tin chi tiết cơ hội bán hàng thành công',
        data: opp,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * PATCH /api/opportunities/:id (hoặc PATCH /opportunities/:id)
   * Cập nhật thông tin cơ hội bán hàng
   */
  updateOpportunity = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = (req.validatedParams || req.params) as OpportunityIdParamDto;
      const body = (req.validatedBody || req.body) as UpdateOpportunityDto;
      const user = req.user;

      const updated = await this.service.updateOpportunity(id, body, user);

      return res.status(200).json({
        success: true,
        message: 'Cập nhật cơ hội bán hàng thành công',
        data: updated,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * PATCH /api/opportunities/:id/stage (hoặc PATCH /opportunities/:id/stage)
   * Cập nhật giai đoạn cơ hội bán hàng
   */
  updateOpportunityStage = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = (req.validatedParams || req.params) as OpportunityIdParamDto;
      const body = (req.validatedBody || req.body) as UpdateOpportunityStageDto;
      const user = req.user;

      const updated = await this.service.updateOpportunityStage(id, body, user);

      return res.status(200).json({
        success: true,
        message: 'Cập nhật giai đoạn cơ hội bán hàng thành công',
        data: updated,
      });
    } catch (error) {
      next(error);
    }
  };
}

export const opportunityController = new OpportunityController();
