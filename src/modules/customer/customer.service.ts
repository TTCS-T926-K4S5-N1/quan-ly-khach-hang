import { customerRepository, CustomerRepository } from './customer.repository';
import { systemConfigRepository, SystemConfigRepository } from '../config/systemConfig.repository';
import { GetCustomerCareFilterDto } from './dto/getCustomerCareQuery.dto';
import { MarkCareContactInputDto } from './dto/markCareContact.dto';
import { NotFoundError } from '../../errors/appError';
import { CareStatus } from '../../constants/careStatus.constant';

export class CustomerService {
  constructor(
    private readonly custRepo: CustomerRepository = customerRepository,
    private readonly sysConfigRepo: SystemConfigRepository = systemConfigRepository
  ) {}

  /**
   * Lấy danh sách khách hàng cần chăm sóc định kỳ
   */
  async getCustomersNeedingCare(query: GetCustomerCareFilterDto) {
    // 1. Xác định số ngày N (ưu tiên query param, fallback về cấu hình hệ thống)
    let configuredDays = query.days;
    if (configuredDays === undefined || configuredDays === null) {
      configuredDays = await this.sysConfigRepo.getDefaultCareDays();
    }

    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    // 2. Tính toán mốc thời gian thresholdDate: currentTime - N ngày
    const now = new Date();
    const thresholdDate = new Date(now.getTime() - configuredDays * 24 * 60 * 60 * 1000);

    // 3. Truy vấn danh sách khách hàng từ Repository
    const { items, total } = await this.custRepo.findCustomersNeedingCare({
      thresholdDate,
      search: query.search,
      skip,
      take: limit,
    });

    // 4. Transform data cho frontend hiển thị
    const formattedItems = items.map((customer) => {
      const isNeverContacted = !customer.lastContactAt;
      const needsCare = isNeverContacted || new Date(customer.lastContactAt!) <= thresholdDate;

      let daysSinceLastContact: number | null = null;
      if (customer.lastContactAt) {
        const diffMs = now.getTime() - new Date(customer.lastContactAt).getTime();
        daysSinceLastContact = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      }

      return {
        customerId: customer.id,
        customerCode: customer.customerCode,
        customerName: customer.customerName,
        phone: customer.phone,
        email: customer.email,
        address: customer.address,
        contracts: customer.contracts || [],
        lastContactAt: customer.lastContactAt,
        lastContactNote: customer.lastContactNote,
        syncedAt: customer.syncedAt,
        careStatus: customer.careStatus || (needsCare ? CareStatus.NEEDS_CARE : CareStatus.CONTACTED),
        needsCare,
        daysSinceLastContact,
      };
    });

    const totalPages = Math.ceil(total / limit) || (total === 0 ? 0 : 1);

    return {
      items: formattedItems,
      pagination: {
        total,
        page,
        limit,
        totalPages,
        hasPrevPage: page > 1 && totalPages > 0,
        hasNextPage: page < totalPages,
      },
      careConfig: {
        appliedDays: configuredDays,
        thresholdDate: thresholdDate.toISOString(),
      },
    };
  }

  /**
   * Đánh dấu khách hàng đã liên hệ
   */
  async markCustomerContacted(
    customerId: string,
    body: MarkCareContactInputDto,
    userId?: string
  ) {
    // 1. Kiểm tra khách hàng có tồn tại không
    const customer = await this.custRepo.findById(customerId);
    if (!customer) {
      throw new NotFoundError(`Không tìm thấy khách hàng với ID: ${customerId}`);
    }

    // 2. Sử dụng thời gian server để đảm bảo tính chính xác và an toàn
    const contactTimestamp = new Date();

    // 3. Thực hiện lưu lịch sử chăm sóc và cập nhật thông tin khách hàng
    const { updatedCustomer, history } = await this.custRepo.recordContact(
      customerId,
      contactTimestamp,
      body.note,
      body.channel || 'PHONE',
      userId
    );

    // 4. Trả về kết quả thông tin khách hàng đã cập nhật
    return {
      customerId: updatedCustomer.id,
      customerCode: updatedCustomer.customerCode,
      customerName: updatedCustomer.customerName,
      phone: updatedCustomer.phone,
      email: updatedCustomer.email,
      lastContactAt: updatedCustomer.lastContactAt,
      lastContactNote: updatedCustomer.lastContactNote,
      careStatus: updatedCustomer.careStatus,
      needsCare: false,
      syncedAt: updatedCustomer.syncedAt,
      contracts: updatedCustomer.contracts,
      careHistory: {
        id: history.id,
        contactedAt: history.contactedAt,
        note: history.note,
        channel: history.channel,
      },
    };
  }
}

export const customerService = new CustomerService();
