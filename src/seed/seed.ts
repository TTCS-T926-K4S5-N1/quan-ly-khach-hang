import { prisma } from '../config/prisma';
import { CareStatus, SYSTEM_CONFIG_KEYS } from '../constants/careStatus.constant';
import { UserRole } from '../constants/permissions.constant';

export async function seedDatabase() {
  console.log('🌱 Bắt đầu gieo mầm dữ liệu mẫu...');

  // 1. Xóa dữ liệu cũ
  await prisma.salesTarget.deleteMany();
  await prisma.leadActivity.deleteMany();
  await prisma.lead.deleteMany();
  await prisma.opportunity.deleteMany();
  await prisma.customerCareHistory.deleteMany();
  await prisma.contract.deleteMany();
  await prisma.contact.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.systemConfig.deleteMany();
  await prisma.user.deleteMany();
  await prisma.salesGroup.deleteMany();

  // 2. Tạo System Config mặc định
  await prisma.systemConfig.create({
    data: {
      key: SYSTEM_CONFIG_KEYS.CUSTOMER_CARE_DEFAULT_DAYS,
      value: '30',
      description: 'Số ngày định kỳ cần chăm sóc khách hàng',
    },
  });

  // 2.1. Tạo Nhóm kinh doanh
  const grpNorth = await prisma.salesGroup.create({
    data: {
      id: 'grp_north',
      groupCode: 'GRP-NORTH',
      name: 'Nhóm Kinh Doanh Miền Bắc',
      description: 'Phụ trách thị trường Hà Nội và các tỉnh phía Bắc',
    },
  });

  const grpSouth = await prisma.salesGroup.create({
    data: {
      id: 'grp_south',
      groupCode: 'GRP-SOUTH',
      name: 'Nhóm Kinh Doanh Miền Nam',
      description: 'Phụ trách thị trường TP.HCM và các tỉnh phía Nam',
    },
  });

  // 3. Tạo Users mẫu
  const salesDirector = await prisma.user.create({
    data: {
      id: 'usr_director_01',
      username: 'sales_director',
      name: 'Trần Văn Giám Đốc',
      role: UserRole.SALES_DIRECTOR,
      permissions: 'CUSTOMER_CARE_VIEW,CUSTOMER_CARE_MANAGE,LEAD_VIEW,LEAD_CREATE,LEAD_MANAGE,LEAD_CONVERT,OPPORTUNITY_VIEW,OPPORTUNITY_CREATE,OPPORTUNITY_MANAGE,FORECAST_VIEW,FORECAST_MANAGE',
    },
  });

  const sales1 = await prisma.user.create({
    data: {
      id: 'usr_sales_01',
      username: 'sales_rep_1',
      name: 'Nguyễn Văn Kinh Doanh 1',
      role: UserRole.SALES,
      permissions: 'CUSTOMER_CARE_VIEW,LEAD_VIEW,LEAD_CREATE,LEAD_MANAGE,LEAD_CONVERT,OPPORTUNITY_VIEW,OPPORTUNITY_CREATE,OPPORTUNITY_MANAGE,FORECAST_VIEW',
      groupId: grpNorth.id,
    },
  });

  const sales2 = await prisma.user.create({
    data: {
      id: 'usr_sales_02',
      username: 'sales_rep_2',
      name: 'Trần Thị Kinh Doanh 2',
      role: UserRole.SALES,
      permissions: 'CUSTOMER_CARE_VIEW,LEAD_VIEW,LEAD_CREATE,LEAD_MANAGE,LEAD_CONVERT,OPPORTUNITY_VIEW,OPPORTUNITY_CREATE,OPPORTUNITY_MANAGE,FORECAST_VIEW',
      groupId: grpNorth.id,
    },
  });

  const sales3 = await prisma.user.create({
    data: {
      id: 'usr_sales_03',
      username: 'sales_rep_3',
      name: 'Lê Hoàng Nam',
      role: UserRole.SALES,
      permissions: 'CUSTOMER_CARE_VIEW,LEAD_VIEW,LEAD_CREATE,LEAD_MANAGE,LEAD_CONVERT,OPPORTUNITY_VIEW,OPPORTUNITY_CREATE,OPPORTUNITY_MANAGE,FORECAST_VIEW',
      groupId: grpSouth.id,
    },
  });

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
      permissions: 'CUSTOMER_CARE_VIEW,CUSTOMER_CARE_MANAGE,LEAD_VIEW,LEAD_CREATE,FORECAST_VIEW',
    },
  });

  const viewer = await prisma.user.create({
    data: {
      id: 'usr_viewer_01',
      username: 'care_viewer',
      name: 'Trần Quan Sát',
      role: UserRole.VIEWER,
      permissions: 'CUSTOMER_CARE_VIEW,LEAD_VIEW,OPPORTUNITY_VIEW,FORECAST_VIEW',
    },
  });

  const now = new Date();
  const dayMs = 24 * 60 * 60 * 1000;

  // 3.1. Thiết lập chỉ tiêu doanh số mẫu (Sales Targets) cho Tháng 10/2026 và Năm 2026
  await prisma.salesTarget.createMany({
    data: [
      {
        targetValue: 1200000000,
        periodType: 'MONTH',
        year: 2026,
        month: 10,
        groupId: grpNorth.id,
      },
      {
        targetValue: 700000000,
        periodType: 'MONTH',
        year: 2026,
        month: 10,
        userId: sales1.id,
      },
      {
        targetValue: 500000000,
        periodType: 'MONTH',
        year: 2026,
        month: 10,
        userId: sales2.id,
      },
      {
        targetValue: 800000000,
        periodType: 'MONTH',
        year: 2026,
        month: 10,
        userId: sales3.id,
      },
      {
        targetValue: 15000000000,
        periodType: 'YEAR',
        year: 2026,
        groupId: grpNorth.id,
      },
    ],
  });

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

  // 6. Tạo người liên hệ và Cơ hội bán hàng mẫu cho dự báo doanh số (Tháng 10/2026)
  const contact1 = await prisma.contact.create({
    data: {
      contactCode: 'CT-2026-001',
      customerId: cust1.id,
      name: 'Nguyễn Văn Minh (CTO)',
      phone: '0909999888',
      email: 'minh.nguyen@alpha-tech.vn',
      jobTitle: 'Giám đốc Công nghệ',
      isPrimary: true,
    },
  });

  const contact2 = await prisma.contact.create({
    data: {
      contactCode: 'CT-2026-002',
      customerId: cust2.id,
      name: 'Phạm Thu Hương (Giám đốc Dự án)',
      phone: '0908888777',
      email: 'huong.pham@betaland.com',
      jobTitle: 'Giám đốc Dự án',
      isPrimary: true,
    },
  });

  await prisma.opportunity.createMany({
    data: [
      {
        opportunityCode: 'OPP-2026-001',
        name: 'Gói Chuyển Đổi Số Alpha Tech',
        customerId: cust1.id,
        contactId: contact1.id,
        stage: 'NEGOTIATION',
        expectedValue: 400000000,
        amount: 400000000,
        probability: 75,
        expectedCloseDate: new Date('2026-10-25T10:00:00Z'),
        ownerId: sales1.id,
        source: 'WEBSITE',
        notes: 'Khách hàng đang đàm phán hợp đồng chuyển đổi số',
      },
      {
        opportunityCode: 'OPP-2026-002',
        name: 'Triển khai CRM cho Beta Land',
        customerId: cust2.id,
        contactId: contact2.id,
        stage: 'PROPOSAL',
        expectedValue: 500000000,
        amount: 500000000,
        probability: 50,
        expectedCloseDate: new Date('2026-10-28T14:00:00Z'),
        ownerId: sales1.id,
        source: 'CONFERENCE',
        notes: 'Đã gửi báo giá gói CRM Enterprise',
      },
      {
        opportunityCode: 'OPP-2026-003',
        name: 'Bảo trì hệ thống ERP Gamma',
        customerId: cust3.id,
        stage: 'WON',
        expectedValue: 300000000,
        amount: 300000000,
        probability: 100,
        expectedCloseDate: new Date('2026-10-15T09:00:00Z'),
        closeDate: new Date('2026-10-15T09:00:00Z'),
        ownerId: sales1.id,
        source: 'EXISTING_CUSTOMER',
        notes: 'Đã ký hợp đồng thành công (WON)',
      },
      {
        opportunityCode: 'OPP-2026-004',
        name: 'Giải pháp tổng đài Cloud Delta',
        customerId: cust4.id,
        stage: 'NEEDS_ANALYSIS',
        expectedValue: 600000000,
        amount: 600000000,
        probability: 20,
        expectedCloseDate: new Date('2026-10-29T16:00:00Z'),
        ownerId: sales2.id,
        source: 'DIRECT',
        notes: 'Đang khảo sát hiện trạng hạ tầng',
      },
      {
        opportunityCode: 'OPP-2026-005',
        name: 'Nâng cấp bảo mật Epsilon',
        customerId: cust5.id,
        stage: 'WON',
        expectedValue: 500000000,
        amount: 500000000,
        probability: 100,
        expectedCloseDate: new Date('2026-10-20T11:00:00Z'),
        closeDate: new Date('2026-10-20T11:00:00Z'),
        ownerId: sales2.id,
        source: 'PARTNER',
        notes: 'Chốt thành công gói bảo mật cao cấp (WON)',
      },
      {
        opportunityCode: 'OPP-2026-006',
        name: 'Dự án thất bại do hủy ngân sách',
        customerId: cust1.id,
        stage: 'LOST',
        expectedValue: 200000000,
        amount: 200000000,
        probability: 0,
        expectedCloseDate: new Date('2026-10-10T08:00:00Z'),
        ownerId: sales1.id,
        source: 'COLD_CALL',
        notes: 'Khách hàng cắt giảm ngân sách IT',
      },
      {
        opportunityCode: 'OPP-2026-007',
        name: 'Hạ tầng máy chủ Miền Nam',
        customerId: cust2.id,
        stage: 'PROPOSAL',
        expectedValue: 760000000,
        amount: 760000000,
        probability: 50,
        expectedCloseDate: new Date('2026-10-30T17:00:00Z'),
        ownerId: sales3.id,
        source: 'NAME_CARD',
        notes: 'Cơ hội cho chi nhánh phía Nam',
      },
    ],
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
