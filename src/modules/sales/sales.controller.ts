import { Request, Response, NextFunction } from 'express';
import { salesService } from './sales.service';

export class SalesController {
  /**
   * GET /api/sales/forecast
   * Lấy dữ liệu dự báo doanh số theo xác suất
   */
  async getSalesForecast(req: Request, res: Response, next: NextFunction) {
    try {
      const query = req.validatedQuery || req.query;
      const data = await salesService.getSalesForecast(query, req.user);
      return res.status(200).json({
        success: true,
        data,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/sales/forecast/by-employee
   * Lấy dự báo doanh số tổng hợp theo nhân viên kinh doanh
   */
  async getForecastByEmployee(req: Request, res: Response, next: NextFunction) {
    try {
      const query = req.validatedQuery || req.query;
      const data = await salesService.getForecastByEmployee(query, req.user);
      return res.status(200).json({
        success: true,
        data,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/sales/forecast/by-group
   * Lấy dự báo doanh số tổng hợp theo nhóm kinh doanh
   */
  async getForecastByGroup(req: Request, res: Response, next: NextFunction) {
    try {
      const query = req.validatedQuery || req.query;
      const data = await salesService.getForecastByGroup(query, req.user);
      return res.status(200).json({
        success: true,
        data,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/sales/forecast/comparison
   * So sánh dự báo, chỉ tiêu và doanh số thực tế
   */
  async getForecastComparison(req: Request, res: Response, next: NextFunction) {
    try {
      const query = req.validatedQuery || req.query;
      const data = await salesService.getForecastComparison(query, req.user);
      return res.status(200).json({
        success: true,
        data,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/sales/targets
   * Thiết lập chỉ tiêu doanh số cho nhân viên hoặc nhóm
   */
  async setSalesTarget(req: Request, res: Response, next: NextFunction) {
    try {
      const body = req.validatedBody || req.body;
      const data = await salesService.setSalesTarget(body, req.user);
      return res.status(201).json({
        success: true,
        message: 'Thiết lập chỉ tiêu doanh số thành công',
        data,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/sales/targets
   * Lấy danh sách chỉ tiêu doanh số
   */
  async listSalesTargets(req: Request, res: Response, next: NextFunction) {
    try {
      const query = req.validatedQuery || req.query;
      const data = await salesService.listSalesTargets(query, req.user);
      return res.status(200).json({
        success: true,
        data,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const salesController = new SalesController();
