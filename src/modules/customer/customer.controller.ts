import { Request, Response, NextFunction } from 'express';
import { customerService, CustomerService } from './customer.service';
import { GetCustomerCareFilterDto } from './dto/getCustomerCareQuery.dto';
import { MarkCareContactInputDto, MarkCareContactParamsDto } from './dto/markCareContact.dto';

export class CustomerController {
  constructor(private readonly custService: CustomerService = customerService) {}

  /**
   * GET /api/customers/care
   * Lấy danh sách khách hàng cần chăm sóc định kỳ
   */
  getCustomersNeedingCare = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const query = (req.validatedQuery || req.query) as unknown as GetCustomerCareFilterDto;
      const result = await this.custService.getCustomersNeedingCare(query);

      return res.status(200).json({
        success: true,
        message: 'Lấy danh sách khách hàng cần chăm sóc thành công',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * PATCH /api/customers/:customerId/care/contact
   * Đánh dấu khách hàng đã liên hệ
   */
  markCustomerContacted = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const params = (req.validatedParams || req.params) as unknown as MarkCareContactParamsDto;
      const body = (req.validatedBody || req.body) as unknown as MarkCareContactInputDto;
      const userId = req.user?.id;

      const updatedCustomer = await this.custService.markCustomerContacted(
        params.customerId,
        body,
        userId
      );

      return res.status(200).json({
        success: true,
        message: 'Đánh dấu liên hệ khách hàng thành công',
        data: updatedCustomer,
      });
    } catch (error) {
      next(error);
    }
  };
}

export const customerController = new CustomerController();
