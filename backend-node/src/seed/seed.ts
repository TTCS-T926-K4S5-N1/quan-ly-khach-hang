import { prisma } from '../config/prisma';
import { CareStatus, SYSTEM_CONFIG_KEYS } from '../constants/careStatus.constant';
import { UserRole } from '../constants/permissions.constant';

export async function seedDatabase() {
  console.log('🌱 Bắt đầu gieo mầm dữ liệu mẫu...');

  // 1. Xóa dữ liệu cũ
  await prisma.lead.deleteMany();
  await prisma.customerCareHistory.deleteMany();
  await prisma.contract.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.systemConfig.deleteMany();
  await prisma.user.deleteMany();

  // 2. Tạo System Config mặc định
  await prisma.systemConfig.create({
    data: {
      key: SYSTEM_CONFIG_KEYS.CUSTOMER_CARE_DEFAULT_DAYS,
      value: '30',
      description: 'Số ngày định kỳ cần chăm sóc khách hàng',
    },
  });

  // 3. Tạo Users mẫu
  const marketing = await prisma.user.create({
    data: {
      id: 'usr_mkt_01',
      username: 'marketing_staff',
      name: 'Lê Marketing',
      role: UserRole.MARKETING,
      permissions: 'LEAD_VIEW,LEAD_CREATE,LEAD_MANAGE',
    },
  });

  const staff = await prisma.user.create({
    data: {
      id: 'usr_staff_01',
      username: 'care_staff',
      name: 'Nguyễn Nhân Viên',
      role: UserRole.CARE_STAFF,
      permissions: 'CUSTOMER_CARE_VIEW,CUSTOMER_CARE_MANAGE,LEAD_VIEW,LEAD_CREATE',
    },
  });

  const viewer = await prisma.user.create({
    data: {
      id: 'usr_viewer_01',
      username: 'care_viewer',
      name: 'Trần Quan Sát',
      role: UserRole.VIEWER,
      permissions: 'CUSTOMER_CARE_VIEW,LEAD_VIEW',
    },
  });

  const now = new Date();

  const dayMs = 24 * 60 * 60 * 1000;

  // 4. Tạo Customers với các kịch bản thực tế
  // KH1: Chưa từng được chăm sóc (lastContactAt: null), có syncedAt mới nhất (1 giờ trước)
  const cust1 = await prisma.customer.create({
    data: {
      id: 'cust_001',
      customerCode: 'KH-2026-001',
      customerName: 'Công ty Cổ phần Công nghệ Alpha',
      phone: '0901111111',
      email: 'contact@alpha-tech.vn',
      address: 'Tòa nhà Landmark 81, TP. Hồ Chí Minh',
      lastContactAt: null,
      careStatus: CareStatus.NEEDS_CARE,
      syncedAt: new Date(now.getTime() - 1 * 60 * 60 * 1000), // 1h ago
      contracts: {
        create: [
          {
            contractNumber: 'HD-ALPHA-2026',
            status: 'ACTIVE',
            startDate: new Date(now.getTime() - 300 * dayMs),
            endDate: new Date(now.getTime() + 65 * dayMs),
            value: 150000000,
          },
        ],
      },
    },
  });

  // KH2: Liên hệ cách đây 45 ngày (> 30 ngày -> cần chăm sóc), syncedAt 3 giờ trước
  const cust2 = await prisma.customer.create({
    data: {
      id: 'cust_002',
      customerCode: 'KH-2026-002',
      customerName: 'Tập đoàn Bất động sản Beta Land',
      phone: '0902222222',
      email: 'info@betaland.com',
      address: 'Quận Cầu Giấy, Hà Nội',
      lastContactAt: new Date(now.getTime() - 45 * dayMs),
      lastContactNote: 'Đã tư vấn gói cơ bản',
      careStatus: CareStatus.NEEDS_CARE,
      syncedAt: new Date(now.getTime() - 3 * 60 * 60 * 1000), // 3h ago
      contracts: {
        create: [
          {
            contractNumber: 'HD-BETA-2025',
            status: 'ACTIVE',
            startDate: new Date(now.getTime() - 365 * dayMs),
            endDate: new Date(now.getTime() + 15 * dayMs),
            value: 300000000,
          },
        ],
      },
    },
  });

  // KH3: Vừa liên hệ cách đây 3 ngày (< 30 ngày -> KHÔNG cần chăm sóc), syncedAt 5 giờ trước
  const cust3 = await prisma.customer.create({
    data: {
      id: 'cust_003',
      customerCode: 'KH-2026-003',
      customerName: 'Công ty TNHH Dịch vụ Gamma',
      phone: '0903333333',
      email: 'gamma@service.com',
      address: 'Hải Châu, Đà Nẵng',
      lastContactAt: new Date(now.getTime() - 3 * dayMs),
      lastContactNote: 'Khách hàng hài lòng, đồng ý gia hạn',
      careStatus: CareStatus.CONTACTED,
      syncedAt: new Date(now.getTime() - 5 * 60 * 60 * 1000), // 5h ago
      contracts: {
        create: [
          {
            contractNumber: 'HD-GAMMA-2026',
            status: 'ACTIVE',
            startDate: new Date(now.getTime() - 60 * dayMs),
            endDate: new Date(now.getTime() + 300 * dayMs),
            value: 80000000,
          },
        ],
      },
    },
  });

  // KH4: Liên hệ 35 ngày trước (> 30 ngày -> cần chăm sóc), không có syncedAt (null)
  const cust4 = await prisma.customer.create({
    data: {
      id: 'cust_004',
      customerCode: 'KH-2026-004',
      customerName: 'Doanh nghiệp Tư nhân Delta',
      phone: '0904444444',
      email: 'delta@corp.vn',
      address: 'Ninh Kiều, Cần Thơ',
      lastContactAt: new Date(now.getTime() - 35 * dayMs),
      lastContactNote: 'Gửi bảng báo giá mới',
      careStatus: CareStatus.NEEDS_CARE,
      syncedAt: null, // null syncedAt handling
      contracts: {
        create: [
          {
            contractNumber: 'HD-DELTA-2026',
            status: 'ACTIVE',
            startDate: new Date(now.getTime() - 180 * dayMs),
            endDate: new Date(now.getTime() + 30 * dayMs),
            value: 50000000,
          },
        ],
      },
    },
  });

  // KH5: Chưa từng liên hệ (lastContactAt: null), syncedAt 2 ngày trước
  const cust5 = await prisma.customer.create({
    data: {
      id: 'cust_005',
      customerCode: 'KH-2026-005',
      customerName: 'Công ty Cổ phần Epsilon Logistic',
      phone: '0905555555',
      email: 'support@epsilon.vn',
      address: 'Hồng Bàng, Hải Phòng',
      lastContactAt: null,
      careStatus: CareStatus.NEEDS_CARE,
      syncedAt: new Date(now.getTime() - 2 * dayMs),
      contracts: {
        create: [
          {
            contractNumber: 'HD-EPSILON-2026',
            status: 'PENDING_RENEWAL',
            startDate: new Date(now.getTime() - 360 * dayMs),
            endDate: new Date(now.getTime() + 5 * dayMs),
            value: 200000000,
          },
        ],
      },
    },
  });

  // 5. Tạo Leads mẫu cho Marketing
  await prisma.lead.create({
    data: {
      id: 'lead_seed_001',
      leadCode: 'LEAD-2026-000101',
      fullName: 'Phạm Minh Trí',
      phone: '0908123456',
      email: 'minhtri@techsolution.vn',
      company: 'Tech Solution Vietnam',
      jobTitle: 'Phó Giám đốc Công nghệ',
      source: 'CONFERENCE',
      status: 'NEW',
      notes: 'Quan tâm giải pháp CRM và CSKH tự động',
      createdById: 'usr_mkt_01',
    },
  });

  await prisma.lead.create({
    data: {
      id: 'lead_seed_002',
      leadCode: 'LEAD-2026-000102',
      fullName: 'Hoàng Bích Phương',
      phone: '0908654321',
      email: 'phuong.hoang@retailhub.com',
      company: 'Chuỗi bán lẻ Retail Hub',
      jobTitle: 'Trưởng phòng Marketing',
      source: 'NAME_CARD',
      status: 'CONTACTED',
      notes: 'Đã trao đổi danh thiếp tại sự kiện Retail Summit',
      createdById: 'usr_mkt_01',
    },
  });

  console.log('✅ Hoàn tất gieo mầm dữ liệu.');
}


if (require.main === module) {
  seedDatabase()
    .catch((err) => {
      console.error(err);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
