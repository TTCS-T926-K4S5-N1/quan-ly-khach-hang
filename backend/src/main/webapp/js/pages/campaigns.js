/**
 * Marketing Campaigns & Lead Tracking (SCRUM-175 / SCRUM-65)
 * Tuân thủ chuẩn CRM Design System & Shared Shell
 */
"use strict";

(function () {
    // Keys for persistence
    const STORAGE_KEY_CAMPAIGNS = "crm_marketing_campaigns_v1";
    const STORAGE_KEY_LEADS = "crm_marketing_leads_v1";
    const STORAGE_KEY_DEALS = "crm_marketing_deals_v1";

    /* ==========================================================================
       1. INITIAL MOCK DATA (Chuẩn thực tế B2B CRM)
       ========================================================================== */
    const defaultCampaigns = [
        {
            id: "camp-001",
            code: "CAMP-2026-001",
            name: "Triển lãm Công nghệ Quốc tế TechExpo 2026",
            channel: "event",
            status: "active",
            budget: 120000000,
            spent: 115000000,
            startDate: "2026-01-10",
            endDate: "2026-04-30",
            ownerName: "Nguyễn Hoàng Nam",
            targetLeads: 80,
            targetRevenue: 500000000,
            description: "Gian hàng VIP giới thiệu nền tảng CRM Cloud và giải pháp tự động hóa vận hành cho khối doanh nghiệp SME & FDI.",
            createdAt: "2026-01-05"
        },
        {
            id: "camp-002",
            code: "CAMP-2026-002",
            name: "Google Search Ads - Phần mềm CRM Quản lý Khách hàng",
            channel: "google",
            status: "active",
            budget: 80000000,
            spent: 78500000,
            startDate: "2026-01-01",
            endDate: "2026-06-30",
            ownerName: "Lê Thu Hà",
            targetLeads: 200,
            targetRevenue: 400000000,
            description: "Chạy từ khóa chính xác: phần mềm crm doanh nghiệp, quản lý khách hàng b2b, pipeline bán hàng.",
            createdAt: "2026-01-01"
        },
        {
            id: "camp-003",
            code: "CAMP-2026-003",
            name: "Facebook Lead Gen - Ưu đãi Dùng thử CRM 30 Ngày",
            channel: "facebook",
            status: "paused",
            budget: 60000000,
            spent: 58000000,
            startDate: "2026-02-01",
            endDate: "2026-03-31",
            ownerName: "Trần Quốc Bảo",
            targetLeads: 300,
            targetRevenue: 150000000,
            description: "Lead form Facebook thu thập số lượng lớn. Đã tạm dừng do tỷ lệ lead rác cao, nhiều cá nhân không có nhu cầu B2B.",
            createdAt: "2026-01-28"
        },
        {
            id: "camp-004",
            code: "CAMP-2026-004",
            name: "Email Marketing - Nurturing & Up-sell Khách hàng Cũ",
            channel: "email",
            status: "active",
            budget: 15000000,
            spent: 14000000,
            startDate: "2026-01-15",
            endDate: "2026-12-31",
            ownerName: "Phạm Minh Trang",
            targetLeads: 60,
            targetRevenue: 250000000,
            description: "Chuỗi 5 email chăm sóc tự động gửi cho khách hàng đã từng demo nhưng chưa chốt trong năm 2025.",
            createdAt: "2026-01-12"
        },
        {
            id: "camp-005",
            code: "CAMP-2026-005",
            name: "LinkedIn B2B Ads - Tự động hóa Sales cho Doanh nghiệp FDI",
            channel: "linkedin",
            status: "active",
            budget: 90000000,
            spent: 82000000,
            startDate: "2026-02-15",
            endDate: "2026-05-15",
            ownerName: "Nguyễn Hoàng Nam",
            targetLeads: 50,
            targetRevenue: 600000000,
            description: "Target trực tiếp Head of Sales, Sales Director và CEO tại các công ty quy mô từ 50-500 nhân sự.",
            createdAt: "2026-02-10"
        },
        {
            id: "camp-006",
            code: "CAMP-2026-006",
            name: "TikTok B2B Shorts - Tình huống Xử lý Từ chối Bán hàng",
            channel: "tiktok",
            status: "completed",
            budget: 40000000,
            spent: 40000000,
            startDate: "2026-01-01",
            endDate: "2026-02-28",
            ownerName: "Lê Thu Hà",
            targetLeads: 150,
            targetRevenue: 100000000,
            description: "Chuỗi video ngắn hài hước giải quyết nỗi đau của nhân viên sales để thu hút lead quan tâm tới phần mềm.",
            createdAt: "2025-12-28"
        }
    ];

    const defaultLeads = [
        // TechExpo Leads
        { id: "lead-101", campaignId: "camp-001", fullName: "Trần Anh Dũng", company: "Tập đoàn Logistics VinaTrans", title: "Giám đốc Vận hành", phone: "0912 345 678", email: "dung.ta@vinatrans.vn", status: "converted", sourceUtm: "TechExpo Booth A12", createdAt: "2026-01-12", ownerName: "Nguyễn Hoàng Nam", notes: "Gặp tại sự kiện, rất quan tâm tính năng phân quyền đội ngũ sales đa chi nhánh." },
        { id: "lead-102", campaignId: "camp-001", fullName: "Vũ Mai Linh", company: "Công ty CP Dược Phẩm MediCare", title: "Trưởng phòng Kinh doanh", phone: "0988 776 655", email: "linh.vm@medicare.vn", status: "converted", sourceUtm: "TechExpo Seminar", createdAt: "2026-01-14", ownerName: "Trần Quốc Bảo", notes: "Cần tích hợp quản lý trình dược viên và hồ sơ nhà thuốc." },
        { id: "lead-103", campaignId: "camp-001", fullName: "Hoàng Minh Tuấn", company: "Chuỗi Cửa Hàng Bán Lẻ NovaRetail", title: "CEO", phone: "0903 112 233", email: "tuan.hoang@novaretail.vn", status: "converted", sourceUtm: "TechExpo VIP Zone", createdAt: "2026-01-18", ownerName: "Nguyễn Hoàng Nam", notes: "Muốn ký hợp đồng gói Enterprise cho 120 nhân viên." },
        { id: "lead-104", campaignId: "camp-001", fullName: "Đỗ Quốc Cường", company: "Công ty Cổ phần Thép Việt Long", title: "Phó Giám đốc", phone: "0934 556 789", email: "cuong.dq@vietlongsteel.com", status: "qualified", sourceUtm: "TechExpo Booth A12", createdAt: "2026-01-20", ownerName: "Lê Thu Hà", notes: "Đang xem xét báo giá triển khai on-premise." },
        { id: "lead-105", campaignId: "camp-001", fullName: "Nguyễn Bích Ngọc", company: "Nội Thất Cao Cấp LuxuryHome", title: "Marketing Lead", phone: "0977 123 456", email: "ngoc.nb@luxuryhome.vn", status: "contacted", sourceUtm: "TechExpo QR Scan", createdAt: "2026-02-05", ownerName: "Phạm Minh Trang", notes: "Đã gửi tài liệu giới thiệu giải pháp." },

        // Google Ads Leads
        { id: "lead-201", campaignId: "camp-002", fullName: "Nguyễn Văn Hùng", company: "Công ty TNHH Cơ Khí Chính Xác Hùng Phát", title: "Giám đốc", phone: "0904 889 900", email: "hung@hungphat-mech.vn", status: "converted", sourceUtm: "Google Search / Keyword CRM SME", createdAt: "2026-01-25", ownerName: "Lê Thu Hà", notes: "Tìm kiếm từ khóa 'phan mem crm quan ly don hang b2b'." },
        { id: "lead-202", campaignId: "camp-002", fullName: "Phan Thị Thanh", company: "Bất Động Sản Khang Điền Land", title: "Trưởng phòng Sales", phone: "0915 223 344", email: "thanh.pt@kdland.com.vn", status: "converted", sourceUtm: "Google Search / Brand Search", createdAt: "2026-02-02", ownerName: "Trần Quốc Bảo", notes: "Đang cần bảng Kanban quản lý cơ hội giao dịch bất động sản." },
        { id: "lead-203", campaignId: "camp-002", fullName: "Bùi Thế Anh", company: "Cung Ứng Vật Liệu Xây Dựng An Phát", title: "Quản lý kinh doanh", phone: "0922 445 566", email: "theanh@anphat-vlxd.vn", status: "qualified", sourceUtm: "Google Search / crm b2b", createdAt: "2026-02-12", ownerName: "Lê Thu Hà", notes: "Đã hoàn thành demo trực tuyến qua Google Meet." },
        { id: "lead-204", campaignId: "camp-002", fullName: "Lâm Hải Yến", company: "Du Lịch & Lữ Hành VietTour Express", title: "Điều hành tour", phone: "0938 998 877", email: "yen.lh@viettour.com", status: "new", sourceUtm: "Google Ads Remarketing", createdAt: "2026-03-01", ownerName: "Phạm Minh Trang", notes: "Mới đăng ký form trên landing page hôm qua." },

        // Facebook Leads (Thể hiện rõ hiện tượng nhiều lead nhưng kém chất lượng)
        { id: "lead-301", campaignId: "camp-003", fullName: "Lê Minh Trí", company: "Shop Thời Trang Trí Fashion", title: "Chủ shop", phone: "0944 112 233", email: "tri.le88@gmail.com", status: "converted", sourceUtm: "Facebook Lead Form", createdAt: "2026-02-05", ownerName: "Trần Quốc Bảo", notes: "Quy mô 5 người, mua gói Cơ bản 1 năm." },
        { id: "lead-302", campaignId: "camp-003", fullName: "Nguyễn Văn A (Ẩn danh)", company: "Cá nhân kinh doanh", title: "Tự do", phone: "0900 000 000", email: "test12345@gmail.com", status: "lost", sourceUtm: "Facebook Instant Form", createdAt: "2026-02-08", ownerName: "Trần Quốc Bảo", notes: "Số điện thoại không có thực, không liên lạc được." },
        { id: "lead-303", campaignId: "camp-003", fullName: "Trần Thị Bé", company: "Cửa hàng tạp hóa", title: "Cá nhân", phone: "0981 111 222", email: "betran@yahoo.com", status: "lost", sourceUtm: "Facebook Adset Interest", createdAt: "2026-02-10", ownerName: "Phạm Minh Trang", notes: "Bấm nhầm quảng cáo khi lướt Facebook." },
        { id: "lead-304", campaignId: "camp-003", fullName: "Hoàng Văn Nam", company: "Sinh viên Đại học Kinh Tế", title: "Nghiên cứu sinh", phone: "0933 667 788", email: "nam.hv@ueh.edu.vn", status: "lost", sourceUtm: "Facebook Lead Ads", createdAt: "2026-02-14", ownerName: "Lê Thu Hà", notes: "Muốn xin tài khoản miễn phí làm đồ án tốt nghiệp." },

        // Email Marketing Leads
        { id: "lead-401", campaignId: "camp-004", fullName: "Đặng Quang Huy", company: "Phần Mềm Kế Toán SmartAcc", title: "Giám đốc Phát triển", phone: "0918 334 455", email: "huy.dq@smartacc.vn", status: "converted", sourceUtm: "Email Nurturing Sequence #3", createdAt: "2026-01-22", ownerName: "Phạm Minh Trang", notes: "Khách hàng cũ dùng thử năm ngoái, nay công ty mở rộng nên quyết định ký hợp đồng." },
        { id: "lead-402", campaignId: "camp-004", fullName: "Trương Mỹ Lan Hương", company: "Hệ Thống Trung Tâm Tiếng Anh StarEdu", title: "CEO", phone: "0909 556 677", email: "huong.tml@staredu.edu.vn", status: "converted", sourceUtm: "Email Re-engagement Promo", createdAt: "2026-02-01", ownerName: "Nguyễn Hoàng Nam", notes: "Chuyển từ Excel sang CRM để quản lý tư vấn tuyển sinh." },

        // LinkedIn Leads
        { id: "lead-501", campaignId: "camp-005", fullName: "Phạm Thành Long", company: "Tập Đoàn Công Nghệ Phần Mềm VinaSoft", title: "Chief Commercial Officer", phone: "0919 667 788", email: "long.pt@vinasoftcorp.com", status: "converted", sourceUtm: "LinkedIn Sponsored InMail", createdAt: "2026-02-20", ownerName: "Nguyễn Hoàng Nam", notes: "Đại diện ký gói Enterprise 3 năm, hỗ trợ tích hợp ERP." },
        { id: "lead-502", campaignId: "camp-005", fullName: "Alexander Miller", company: "Công ty May Mặc Global Apparel FDI", title: "General Director", phone: "0908 990 011", email: "alex.m@globalapparel.com", status: "converted", sourceUtm: "LinkedIn Lead Gen Form", createdAt: "2026-02-26", ownerName: "Nguyễn Hoàng Nam", notes: "Doanh nghiệp FDI tại KCN VSIP 1, cần tiếng Anh và tiếng Việt song ngữ." },

        // TikTok Leads
        { id: "lead-601", campaignId: "camp-006", fullName: "Ngô Quốc Khánh", company: "Agency Truyền Thông Khánh Media", title: "Founder", phone: "0971 889 900", email: "khanh@khanhmedia.vn", status: "converted", sourceUtm: "TikTok Bio Link Form", createdAt: "2026-01-18", ownerName: "Lê Thu Hà", notes: "Đội ngũ 8 người, triển khai gói Starter." }
    ];

    const defaultDeals = [
        // TechExpo Deals
        { id: "deal-101", campaignId: "camp-001", leadId: "lead-101", leadName: "Trần Anh Dũng", dealName: "Triển khai CRM Quản lý Logistics VinaTrans", customerName: "Tập đoàn Logistics VinaTrans", stage: "won", expectedAmount: 220000000, wonAmount: 220000000, probability: 100, closeDate: "2026-02-15", ownerName: "Nguyễn Hoàng Nam" },
        { id: "deal-102", campaignId: "camp-001", leadId: "lead-102", leadName: "Vũ Mai Linh", dealName: "Hệ thống Quản lý Kênh Phân phối Dược Phẩm", customerName: "Công ty CP Dược Phẩm MediCare", stage: "won", expectedAmount: 180000000, wonAmount: 180000000, probability: 100, closeDate: "2026-02-28", ownerName: "Trần Quốc Bảo" },
        { id: "deal-103", campaignId: "camp-001", leadId: "lead-103", leadName: "Hoàng Minh Tuấn", dealName: "Gói CRM Chuỗi 30 Chi Nhánh NovaRetail", customerName: "Chuỗi Cửa Hàng Bán Lẻ NovaRetail", stage: "won", expectedAmount: 250000000, wonAmount: 250000000, probability: 100, closeDate: "2026-03-05", ownerName: "Nguyễn Hoàng Nam" },
        { id: "deal-104", campaignId: "camp-001", leadId: "lead-104", leadName: "Đỗ Quốc Cường", dealName: "Triển khai On-Premise Thép Việt Long", customerName: "Công ty Cổ phần Thép Việt Long", stage: "negotiation", expectedAmount: 320000000, wonAmount: 0, probability: 75, closeDate: "2026-04-15", ownerName: "Lê Thu Hà" },

        // Google Ads Deals
        { id: "deal-201", campaignId: "camp-002", leadId: "lead-201", leadName: "Nguyễn Văn Hùng", dealName: "Gói CRM Cloud Cơ Khí Hùng Phát", customerName: "Công ty TNHH Cơ Khí Chính Xác Hùng Phát", stage: "won", expectedAmount: 120000000, wonAmount: 120000000, probability: 100, closeDate: "2026-02-10", ownerName: "Lê Thu Hà" },
        { id: "deal-202", campaignId: "camp-002", leadId: "lead-202", leadName: "Phan Thị Thanh", dealName: "Bản quyền CRM Sàn BĐS Khang Điền", customerName: "Bất Động Sản Khang Điền Land", stage: "won", expectedAmount: 190000000, wonAmount: 190000000, probability: 100, closeDate: "2026-03-01", ownerName: "Trần Quốc Bảo" },
        { id: "deal-203", campaignId: "camp-002", leadId: "lead-203", leadName: "Bùi Thế Anh", dealName: "Phần mềm Bán hàng VLXD An Phát", customerName: "Cung Ứng Vật Liệu Xây Dựng An Phát", stage: "proposal", expectedAmount: 95000000, wonAmount: 0, probability: 50, closeDate: "2026-04-10", ownerName: "Lê Thu Hà" },

        // Facebook Deals
        { id: "deal-301", campaignId: "camp-003", leadId: "lead-301", leadName: "Lê Minh Trí", dealName: "CRM Gói Nhỏ Shop Thời Trang Trí Fashion", customerName: "Shop Thời Trang Trí Fashion", stage: "won", expectedAmount: 45000000, wonAmount: 45000000, probability: 100, closeDate: "2026-02-20", ownerName: "Trần Quốc Bảo" },

        // Email Marketing Deals
        { id: "deal-401", campaignId: "camp-004", leadId: "lead-401", leadName: "Đặng Quang Huy", dealName: "Hợp đồng Nâng cấp CRM SmartAcc", customerName: "Phần Mềm Kế Toán SmartAcc", stage: "won", expectedAmount: 130000000, wonAmount: 130000000, probability: 100, closeDate: "2026-02-05", ownerName: "Phạm Minh Trang" },
        { id: "deal-402", campaignId: "camp-004", leadId: "lead-402", leadName: "Trương Mỹ Lan Hương", dealName: "CRM Quản lý Học viên Trung tâm StarEdu", customerName: "Hệ Thống Trung Tâm Tiếng Anh StarEdu", stage: "won", expectedAmount: 150000000, wonAmount: 150000000, probability: 100, closeDate: "2026-02-18", ownerName: "Nguyễn Hoàng Nam" },

        // LinkedIn Deals
        { id: "deal-501", campaignId: "camp-005", leadId: "lead-501", leadName: "Phạm Thành Long", dealName: "Giải pháp CRM Doanh nghiệp Toàn diện VinaSoft", customerName: "Tập Đoàn Công Nghệ Phần Mềm VinaSoft", stage: "won", expectedAmount: 480000000, wonAmount: 480000000, probability: 100, closeDate: "2026-03-08", ownerName: "Nguyễn Hoàng Nam" },
        { id: "deal-502", campaignId: "camp-005", leadId: "lead-502", leadName: "Alexander Miller", dealName: "Hệ thống Quản trị Bán hàng Đa Quốc gia Global Apparel", customerName: "Công ty May Mặc Global Apparel FDI", stage: "won", expectedAmount: 370000000, wonAmount: 370000000, probability: 100, closeDate: "2026-03-12", ownerName: "Nguyễn Hoàng Nam" },

        // TikTok Deals
        { id: "deal-601", campaignId: "camp-006", leadId: "lead-601", leadName: "Ngô Quốc Khánh", dealName: "CRM Khởi nghiệp Khánh Media", customerName: "Agency Truyền Thông Khánh Media", stage: "won", expectedAmount: 20000000, wonAmount: 20000000, probability: 100, closeDate: "2026-02-15", ownerName: "Lê Thu Hà" }
    ];

    /* ==========================================================================
       2. STATE MANAGEMENT
       ========================================================================== */
    let campaigns = [];
    let leads = [];
    let deals = [];
    let currentView = "table"; // 'table' or 'grid'
    let activeDrawerCampaignId = null;

    function initData() {
        try {
            const storedCamp = localStorage.getItem(STORAGE_KEY_CAMPAIGNS);
            const storedLeads = localStorage.getItem(STORAGE_KEY_LEADS);
            const storedDeals = localStorage.getItem(STORAGE_KEY_DEALS);

            campaigns = storedCamp ? JSON.parse(storedCamp) : JSON.parse(JSON.stringify(defaultCampaigns));
            leads = storedLeads ? JSON.parse(storedLeads) : JSON.parse(JSON.stringify(defaultLeads));
            deals = storedDeals ? JSON.parse(storedDeals) : JSON.parse(JSON.stringify(defaultDeals));
        } catch (e) {
            console.warn("Lỗi đọc storage, nạp lại mock data:", e);
            campaigns = JSON.parse(JSON.stringify(defaultCampaigns));
            leads = JSON.parse(JSON.stringify(defaultLeads));
            deals = JSON.parse(JSON.stringify(defaultDeals));
        }
        saveData();
    }

    function saveData() {
        try {
            localStorage.setItem(STORAGE_KEY_CAMPAIGNS, JSON.stringify(campaigns));
            localStorage.setItem(STORAGE_KEY_LEADS, JSON.stringify(leads));
            localStorage.setItem(STORAGE_KEY_DEALS, JSON.stringify(deals));
        } catch (e) {
            console.error("Lỗi ghi storage:", e);
        }
    }

    /* ==========================================================================
       3. METRICS COMPUTATION (Cốt lõi đo lường Lead -> Deal -> Doanh thu)
       ========================================================================== */
    function getCampaignMetrics(camp) {
        const campLeads = leads.filter(l => l.campaignId === camp.id);
        const campDeals = deals.filter(d => d.campaignId === camp.id);

        const leadCount = campLeads.length;
        const dealCount = campDeals.length;

        // Doanh thu thực tế đã chốt từ các deal 'won'
        const wonDeals = campDeals.filter(d => d.stage === "won");
        const wonCount = wonDeals.length;
        const wonRevenue = wonDeals.reduce((sum, d) => sum + (Number(d.wonAmount) || 0), 0);

        // Chi phí thực tế đã giải ngân
        const spent = Number(camp.spent) || 0;
        const budget = Number(camp.budget) || 0;

        // Chi phí trên mỗi lead (Cost per Lead - CPL)
        const cpl = leadCount > 0 ? Math.round(spent / leadCount) : 0;

        // Tỷ lệ chuyển đổi từ Lead sang Deal
        const conversionRate = leadCount > 0 ? ((dealCount / leadCount) * 100).toFixed(1) : 0;

        // ROI = (Doanh thu - Chi phí) / Chi phí * 100%
        let roi = 0;
        if (spent > 0) {
            roi = (((wonRevenue - spent) / spent) * 100).toFixed(1);
        }

        return {
            leadCount,
            dealCount,
            wonCount,
            wonRevenue,
            budget,
            spent,
            cpl,
            conversionRate,
            roi: parseFloat(roi)
        };
    }

    /* ==========================================================================
       4. FORMATTING UTILITIES
       ========================================================================== */
    function formatCurrency(num) {
        return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(num || 0);
    }

    function formatDate(dateStr) {
        if (!dateStr) return "—";
        const parts = dateStr.split("-");
        if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
        return dateStr;
    }

    function getChannelMeta(channel) {
        const map = {
            google: { label: "Google Ads", icon: "🔍", badgeClass: "channel-google" },
            facebook: { label: "Facebook Ads", icon: "📱", badgeClass: "channel-facebook" },
            event: { label: "Sự kiện / Hội thảo", icon: "🎪", badgeClass: "channel-event" },
            email: { label: "Email Marketing", icon: "📧", badgeClass: "channel-email" },
            linkedin: { label: "LinkedIn B2B", icon: "💼", badgeClass: "channel-linkedin" },
            tiktok: { label: "TikTok Ads", icon: "🎬", badgeClass: "channel-tiktok" },
            other: { label: "Kênh Khác", icon: "🌐", badgeClass: "channel-other" }
        };
        return map[channel] || map.other;
    }

    function getStatusMeta(status) {
        const map = {
            active: { label: "Đang diễn ra", badgeClass: "status-active" },
            planned: { label: "Lên kế hoạch", badgeClass: "status-planned" },
            paused: { label: "Tạm dừng", badgeClass: "status-paused" },
            completed: { label: "Đã kết thúc", badgeClass: "status-completed" }
        };
        return map[status] || { label: status, badgeClass: "status-completed" };
    }

    function getLeadStatusMeta(status) {
        const map = {
            new: { label: "Mới tiếp nhận", badgeClass: "lead-new" },
            contacted: { label: "Đang liên hệ", badgeClass: "lead-contacted" },
            qualified: { label: "Tiềm năng", badgeClass: "lead-qualified" },
            converted: { label: "Đã tạo Cơ hội", badgeClass: "lead-converted" },
            lost: { label: "Không phù hợp", badgeClass: "lead-lost" }
        };
        return map[status] || { label: status, badgeClass: "lead-new" };
    }

    function getDealStageMeta(stage) {
        const map = {
            discovery: { label: "Khảo sát nhu cầu", badgeClass: "stage-discovery" },
            proposal: { label: "Báo giá & Đề xuất", badgeClass: "stage-proposal" },
            negotiation: { label: "Đàm phán hợp đồng", badgeClass: "stage-negotiation" },
            won: { label: "Thành công (Won)", badgeClass: "stage-won" },
            lost: { label: "Thất bại (Lost)", badgeClass: "stage-lost" }
        };
        return map[stage] || { label: stage, badgeClass: "stage-discovery" };
    }

    /* ==========================================================================
       5. RENDER TOP OVERVIEW KPIS
       ========================================================================== */
    function renderOverviewKPIs() {
        let totalBudget = 0;
        let totalSpent = 0;
        let totalLeads = 0;
        let totalDeals = 0;
        let totalWonRevenue = 0;
        let activeCount = 0;

        campaigns.forEach(c => {
            if (c.status === "active") activeCount++;
            const m = getCampaignMetrics(c);
            totalBudget += m.budget;
            totalSpent += m.spent;
            totalLeads += m.leadCount;
            totalDeals += m.dealCount;
            totalWonRevenue += m.wonRevenue;
        });

        const overallROI = totalSpent > 0 ? (((totalWonRevenue - totalSpent) / totalSpent) * 100).toFixed(1) : 0;
        const avgCPL = totalLeads > 0 ? Math.round(totalSpent / totalLeads) : 0;
        const convRate = totalLeads > 0 ? ((totalDeals / totalLeads) * 100).toFixed(1) : 0;

        // Render card values
        const elTotalCamp = document.getElementById("kpiTotalCampaigns");
        const elCampSub = document.getElementById("kpiCampSub");
        if (elTotalCamp) elTotalCamp.textContent = `${campaigns.length} Chiến dịch`;
        if (elCampSub) elCampSub.innerHTML = `<span class="kpi-tag-good">${activeCount} đang chạy</span>`;

        const elBudget = document.getElementById("kpiTotalBudget");
        const elBudgetSub = document.getElementById("kpiBudgetSub");
        if (elBudget) elBudget.textContent = formatCurrency(totalBudget);
        if (elBudgetSub) elBudgetSub.textContent = `Đã tiêu: ${formatCurrency(totalSpent)} (${totalBudget > 0 ? Math.round((totalSpent/totalBudget)*100) : 0}%)`;

        const elLeads = document.getElementById("kpiTotalLeads");
        const elLeadsSub = document.getElementById("kpiLeadsSub");
        if (elLeads) elLeads.textContent = `${totalLeads.toLocaleString("vi-VN")} Leads`;
        if (elLeadsSub) elLeadsSub.innerHTML = `Chi phí TB: <strong>${formatCurrency(avgCPL)}</strong>/Lead`;

        const elDeals = document.getElementById("kpiTotalDeals");
        const elDealsSub = document.getElementById("kpiDealsSub");
        if (elDeals) elDeals.textContent = `${totalDeals} Cơ hội`;
        if (elDealsSub) elDealsSub.innerHTML = `<span class="kpi-tag-good">${convRate}% chuyển đổi</span> từ lead`;

        const elRevenue = document.getElementById("kpiTotalRevenue");
        const elRevenueSub = document.getElementById("kpiRevenueSub");
        if (elRevenue) elRevenue.textContent = formatCurrency(totalWonRevenue);
        if (elRevenueSub) elRevenueSub.innerHTML = `Lợi nhuận gộp: <strong style="color:#15803d;">${formatCurrency(totalWonRevenue - totalSpent)}</strong>`;

        const elROI = document.getElementById("kpiAverageROI");
        const elROISub = document.getElementById("kpiROISub");
        if (elROI) {
            elROI.textContent = `${overallROI > 0 ? "+" : ""}${overallROI}%`;
            elROI.style.color = overallROI >= 0 ? "#15803d" : "#dc2626";
        }
        if (elROISub) {
            elROISub.innerHTML = overallROI >= 100 
                ? `<span class="kpi-tag-good">Hiệu quả xuất sắc</span>` 
                : (overallROI >= 0 ? `<span class="kpi-tag-warn">Có lãi</span>` : `<span class="kpi-tag-danger">Cần tối ưu</span>`);
        }
    }

    /* ==========================================================================
       6. FILTER & SORT CAMPAIGNS
       ========================================================================== */
    function getFilteredCampaigns() {
        const query = (document.getElementById("campaignSearch")?.value || "").trim().toLowerCase();
        const channelFilter = document.getElementById("channelFilter")?.value || "all";
        const statusFilter = document.getElementById("statusFilter")?.value || "all";
        const sortBy = document.getElementById("sortFilter")?.value || "revenue";

        return campaigns.filter(c => {
            const matchesQuery = !query || 
                c.name.toLowerCase().includes(query) || 
                c.code.toLowerCase().includes(query) || 
                (c.ownerName || "").toLowerCase().includes(query) ||
                (c.description || "").toLowerCase().includes(query);

            const matchesChannel = channelFilter === "all" || c.channel === channelFilter;
            const matchesStatus = statusFilter === "all" || c.status === statusFilter;

            return matchesQuery && matchesChannel && matchesStatus;
        }).sort((a, b) => {
            const mA = getCampaignMetrics(a);
            const mB = getCampaignMetrics(b);

            if (sortBy === "revenue") return mB.wonRevenue - mA.wonRevenue;
            if (sortBy === "roi") return mB.roi - mA.roi;
            if (sortBy === "leads") return mB.leadCount - mA.leadCount;
            if (sortBy === "deals") return mB.dealCount - mA.dealCount;
            if (sortBy === "budget") return mB.budget - mA.budget;
            if (sortBy === "newest") return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
            return 0;
        });
    }

    /* ==========================================================================
       7. RENDER CAMPAIGN TABLE & GRID
       ========================================================================== */
    function renderCampaignList() {
        renderOverviewKPIs();
        const filtered = getFilteredCampaigns();

        const tableContainer = document.getElementById("campaignTableContainer");
        const gridContainer = document.getElementById("campaignGridContainer");
        const tableBody = document.getElementById("campaignTableBody");
        const countBadge = document.getElementById("campaignCountBadge");

        if (countBadge) {
            countBadge.textContent = `${filtered.length} chiến dịch`;
        }

        if (currentView === "table") {
            if (tableContainer) tableContainer.style.display = "block";
            if (gridContainer) gridContainer.style.display = "none";

            if (!tableBody) return;

            if (filtered.length === 0) {
                tableBody.innerHTML = `
                    <tr>
                        <td colspan="8">
                            <div class="table-empty-state">
                                <div class="empty-icon">📢</div>
                                <div class="empty-title">Không tìm thấy chiến dịch nào</div>
                                <div class="empty-desc">Thử điều chỉnh lại bộ lọc kênh, trạng thái hoặc từ khóa tìm kiếm.</div>
                                <button type="button" class="crm-btn crm-btn-secondary" onclick="window.crmResetCampaignFilters()">Xóa bộ lọc</button>
                            </div>
                        </td>
                    </tr>
                `;
                return;
            }

            tableBody.innerHTML = filtered.map(c => {
                const m = getCampaignMetrics(c);
                const ch = getChannelMeta(c.channel);
                const st = getStatusMeta(c.status);
                const spentPct = m.budget > 0 ? Math.min(100, Math.round((m.spent / m.budget) * 100)) : 0;

                const roiBadgeClass = m.roi > 0 ? "roi-positive" : (m.roi < 0 ? "roi-negative" : "roi-neutral");
                const roiText = `${m.roi > 0 ? "+" : ""}${m.roi}%`;

                return `
                    <tr data-campaign-id="${c.id}">
                        <td>
                            <div class="campaign-cell-name">
                                <a href="javascript:void(0)" class="campaign-link" onclick="window.crmOpenCampaignDrawer('${c.id}')">
                                    ${escapeHtml(c.name)}
                                </a>
                                <div class="campaign-sub-info">
                                    <span class="campaign-code">${escapeHtml(c.code)}</span>
                                    <span>•</span>
                                    <span>${escapeHtml(c.ownerName || "Chưa gán")}</span>
                                </div>
                            </div>
                        </td>
                        <td>
                            <span class="channel-badge ${ch.badgeClass}">
                                <span>${ch.icon}</span>
                                <span>${ch.label}</span>
                            </span>
                        </td>
                        <td>
                            <span class="status-pill ${st.badgeClass}">
                                <span class="status-dot"></span>
                                <span>${st.label}</span>
                            </span>
                        </td>
                        <td>
                            <div class="metric-cell">
                                <div style="font-size:12.5px; font-weight:600;">${formatDate(c.startDate)} - ${formatDate(c.endDate)}</div>
                            </div>
                        </td>
                        <td>
                            <div class="metric-cell">
                                <div class="metric-highlight">${formatCurrency(m.budget)}</div>
                                <div class="metric-hint">Đã tiêu: ${formatCurrency(m.spent)} (${spentPct}%)</div>
                                <div class="mini-progress-bar">
                                    <div class="mini-progress-fill" style="width: ${spentPct}%; background: ${spentPct > 90 ? 'var(--crm-danger)' : 'var(--crm-primary)'};"></div>
                                </div>
                            </div>
                        </td>
                        <td>
                            <div class="metric-cell">
                                <div class="metric-highlight" style="color:var(--crm-primary); font-size:15px;">
                                    ${m.leadCount} Leads
                                </div>
                                <div class="metric-hint">CPL: ${formatCurrency(m.cpl)}/lead</div>
                            </div>
                        </td>
                        <td>
                            <div class="metric-cell">
                                <div class="metric-highlight">
                                    ${m.dealCount} Deals
                                </div>
                                <div class="metric-hint">${m.conversionRate}% tỷ lệ chốt</div>
                            </div>
                        </td>
                        <td>
                            <div class="metric-cell">
                                <div class="revenue-won">${formatCurrency(m.wonRevenue)}</div>
                                <div>
                                    <span class="roi-badge ${roiBadgeClass}">ROI: ${roiText}</span>
                                </div>
                            </div>
                        </td>
                        <td style="text-align: right;">
                            <div class="row-actions">
                                <button type="button" class="action-btn-icon" title="Xem chi tiết & theo dõi Lead" onclick="window.crmOpenCampaignDrawer('${c.id}')">
                                    <svg viewBox="0 0 24 24"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
                                </button>
                                <button type="button" class="action-btn-icon" title="Chỉnh sửa chiến dịch" onclick="window.crmOpenEditCampaign('${c.id}')">
                                    <svg viewBox="0 0 24 24"><path d="m16 3 5 5-12 12-6 1 1-6L16 3ZM14 5l5 5"/></svg>
                                </button>
                                <button type="button" class="action-btn-icon delete" title="Xóa chiến dịch" onclick="window.crmDeleteCampaign('${c.id}')">
                                    <svg viewBox="0 0 24 24"><path d="M3 6h18m-2 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                                </button>
                            </div>
                        </td>
                    </tr>
                `;
            }).join("");

        } else {
            // Grid Cards View
            if (tableContainer) tableContainer.style.display = "none";
            if (gridContainer) gridContainer.style.display = "grid";

            if (!gridContainer) return;

            if (filtered.length === 0) {
                gridContainer.innerHTML = `
                    <div style="grid-column: 1 / -1;">
                        <div class="table-empty-state">
                            <div class="empty-icon">📢</div>
                            <div class="empty-title">Không tìm thấy chiến dịch nào</div>
                            <button type="button" class="crm-btn crm-btn-secondary" onclick="window.crmResetCampaignFilters()">Xóa bộ lọc</button>
                        </div>
                    </div>
                `;
                return;
            }

            gridContainer.innerHTML = filtered.map(c => {
                const m = getCampaignMetrics(c);
                const ch = getChannelMeta(c.channel);
                const st = getStatusMeta(c.status);
                const roiBadgeClass = m.roi > 0 ? "roi-positive" : (m.roi < 0 ? "roi-negative" : "roi-neutral");
                const roiText = `${m.roi > 0 ? "+" : ""}${m.roi}%`;

                return `
                    <div class="campaign-card-item">
                        <div>
                            <div class="card-top">
                                <span class="channel-badge ${ch.badgeClass}">
                                    <span>${ch.icon}</span>
                                    <span>${ch.label}</span>
                                </span>
                                <span class="status-pill ${st.badgeClass}">
                                    <span class="status-dot"></span>
                                    <span>${st.label}</span>
                                </span>
                            </div>
                            <div class="card-title-wrap">
                                <h3>
                                    <a href="javascript:void(0)" onclick="window.crmOpenCampaignDrawer('${c.id}')">${escapeHtml(c.name)}</a>
                                </h3>
                                <div class="campaign-sub-info">
                                    <span class="campaign-code">${escapeHtml(c.code)}</span>
                                    <span>•</span>
                                    <span>Phụ trách: <strong>${escapeHtml(c.ownerName || "—")}</strong></span>
                                </div>
                            </div>
                            <div class="card-metrics-grid">
                                <div class="card-metric-col">
                                    <span class="label">Ngân sách / Đã tiêu</span>
                                    <span class="val">${formatCurrency(m.budget)}</span>
                                </div>
                                <div class="card-metric-col">
                                    <span class="label">Doanh thu chốt</span>
                                    <span class="val" style="color:#047857;">${formatCurrency(m.wonRevenue)}</span>
                                </div>
                                <div class="card-metric-col">
                                    <span class="label">Lead mang về</span>
                                    <span class="val">${m.leadCount} Leads</span>
                                </div>
                                <div class="card-metric-col">
                                    <span class="label">Hiệu suất ROI</span>
                                    <span class="val"><span class="roi-badge ${roiBadgeClass}">${roiText}</span></span>
                                </div>
                            </div>
                            <div class="card-funnel-bar">
                                <span>🎯 Chuyển đổi: <strong>${m.leadCount}</strong> Lead ➔ <strong>${m.dealCount}</strong> Deals ➔ <strong>${m.wonCount}</strong> Won</span>
                            </div>
                        </div>
                        <div class="card-actions-bar">
                            <button type="button" class="crm-btn crm-btn-secondary" style="font-size:12.5px; padding:0 10px;" onclick="window.crmOpenEditCampaign('${c.id}')">
                                Chỉnh sửa
                            </button>
                            <button type="button" class="crm-btn crm-btn-primary" style="font-size:12.5px; padding:0 12px;" onclick="window.crmOpenCampaignDrawer('${c.id}')">
                                Xem Lead & Doanh thu ➔
                            </button>
                        </div>
                    </div>
                `;
            }).join("");
        }
    }

    /* ==========================================================================
       8. CAMPAIGN 360 DRAWER (Chi tiết chiến dịch: Leads & Opportunities)
       ========================================================================== */
    function openCampaignDrawer(campaignId) {
        const camp = campaigns.find(c => c.id === campaignId);
        if (!camp) return;

        activeDrawerCampaignId = campaignId;
        const m = getCampaignMetrics(camp);
        const ch = getChannelMeta(camp.channel);
        const st = getStatusMeta(camp.status);

        // Header info
        document.getElementById("drawerCampaignName").textContent = camp.name;
        document.getElementById("drawerCampaignCode").textContent = camp.code;
        
        const channelBadgeEl = document.getElementById("drawerChannelBadge");
        if (channelBadgeEl) {
            channelBadgeEl.className = `channel-badge ${ch.badgeClass}`;
            channelBadgeEl.innerHTML = `<span>${ch.icon}</span><span>${ch.label}</span>`;
        }

        const statusBadgeEl = document.getElementById("drawerStatusBadge");
        if (statusBadgeEl) {
            statusBadgeEl.className = `status-pill ${st.badgeClass}`;
            statusBadgeEl.innerHTML = `<span class="status-dot"></span><span>${st.label}</span>`;
        }

        // Top metrics strip
        document.getElementById("drawerBudget").textContent = formatCurrency(m.budget);
        document.getElementById("drawerSpentSub").textContent = `Đã tiêu: ${formatCurrency(m.spent)}`;
        
        document.getElementById("drawerLeads").textContent = `${m.leadCount} Leads`;
        document.getElementById("drawerCPLSub").textContent = `Chi phí: ${formatCurrency(m.cpl)}/Lead`;

        document.getElementById("drawerDeals").textContent = `${m.dealCount} Deals`;
        document.getElementById("drawerDealsSub").textContent = `${m.conversionRate}% chuyển đổi lead`;

        document.getElementById("drawerRevenue").textContent = formatCurrency(m.wonRevenue);
        const roiSign = m.roi > 0 ? "+" : "";
        document.getElementById("drawerROISub").innerHTML = `<span class="roi-badge ${m.roi >= 0 ? 'roi-positive' : 'roi-negative'}">ROI: ${roiSign}${m.roi}%</span>`;

        // Funnel Step Ribbon
        document.getElementById("funnelBudget").textContent = formatCurrency(m.spent);
        document.getElementById("funnelLeads").textContent = `${m.leadCount} Leads`;
        document.getElementById("funnelDeals").textContent = `${m.dealCount} Deals`;
        document.getElementById("funnelRevenue").textContent = formatCurrency(m.wonRevenue);

        // Badge counts on Tabs
        document.getElementById("tabLeadCountBadge").textContent = m.leadCount;
        document.getElementById("tabDealCountBadge").textContent = m.dealCount;

        // Render contents of each tab
        renderDrawerLeadsTab(campaignId);
        renderDrawerDealsTab(campaignId);
        renderDrawerAnalyticsTab(camp, m);

        // Switch to Tab 1 (Leads) by default
        switchDrawerTab("leads");

        // Show drawer
        document.getElementById("campaignDrawer").classList.add("active");
        document.getElementById("drawerBackdrop").classList.add("active");
    }

    function closeCampaignDrawer() {
        document.getElementById("campaignDrawer")?.classList.remove("active");
        document.getElementById("drawerBackdrop")?.classList.remove("active");
        activeDrawerCampaignId = null;
    }

    function switchDrawerTab(tabName) {
        document.querySelectorAll(".drawer-tab-btn").forEach(btn => {
            btn.classList.toggle("active", btn.getAttribute("data-tab") === tabName);
        });
        document.querySelectorAll(".drawer-tab-pane").forEach(pane => {
            pane.classList.toggle("active", pane.id === `drawerTab-${tabName}`);
        });
    }

    // Render Tab 1: Leads
    function renderDrawerLeadsTab(campaignId) {
        const campLeads = leads.filter(l => l.campaignId === campaignId);
        const tableBody = document.getElementById("drawerLeadsTableBody");
        if (!tableBody) return;

        if (campLeads.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="7">
                        <div class="table-empty-state">
                            <div class="empty-icon">🎯</div>
                            <div class="empty-title">Chưa có Lead nào từ chiến dịch này</div>
                            <div class="empty-desc">Bấm nút "Thêm Lead vào chiến dịch" để ghi nhận lead mới sinh ra.</div>
                            <button type="button" class="crm-btn crm-btn-primary" onclick="window.crmOpenAddLeadModal('${campaignId}')">+ Thêm Lead ngay</button>
                        </div>
                    </td>
                </tr>
            `;
            return;
        }

        tableBody.innerHTML = campLeads.map(lead => {
            const st = getLeadStatusMeta(lead.status);
            const initial = (lead.fullName || "L").charAt(0).toUpperCase();

            return `
                <tr>
                    <td>
                        <div style="display:flex; align-items:center;">
                            <span class="lead-avatar">${initial}</span>
                            <div>
                                <strong style="font-size:13.5px; color:var(--crm-text);">${escapeHtml(lead.fullName)}</strong>
                                <div style="font-size:11.5px; color:var(--crm-muted);">${escapeHtml(lead.title || "—")}</div>
                            </div>
                        </div>
                    </td>
                    <td><strong>${escapeHtml(lead.company || "Cá nhân")}</strong></td>
                    <td>
                        <div style="font-size:12.5px;">📞 ${escapeHtml(lead.phone || "—")}</div>
                        <div style="font-size:12px; color:var(--crm-muted);">✉️ ${escapeHtml(lead.email || "—")}</div>
                    </td>
                    <td>
                        <span style="font-family:monospace; font-size:11.5px; background:#f1f5f9; padding:2px 6px; border-radius:4px;">
                            ${escapeHtml(lead.sourceUtm || "Direct")}
                        </span>
                    </td>
                    <td>${formatDate(lead.createdAt)}</td>
                    <td>
                        <span class="lead-badge ${st.badgeClass}">${st.label}</span>
                    </td>
                    <td>
                        ${lead.status !== "converted" ? `
                            <button type="button" class="crm-btn crm-btn-secondary" style="font-size:11.5px; padding:0 8px; min-height:28px;" onclick="window.crmConvertLeadToDeal('${lead.id}')">
                                ➔ Tạo Deal
                            </button>
                        ` : `<span style="color:#15803d; font-size:12px; font-weight:600;">✓ Đã thành Deal</span>`}
                    </td>
                </tr>
            `;
        }).join("");
    }

    // Render Tab 2: Deals (Cơ hội & Doanh thu chốt)
    function renderDrawerDealsTab(campaignId) {
        const campDeals = deals.filter(d => d.campaignId === campaignId);
        const tableBody = document.getElementById("drawerDealsTableBody");
        if (!tableBody) return;

        if (campDeals.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="7">
                        <div class="table-empty-state">
                            <div class="empty-icon">💼</div>
                            <div class="empty-title">Chưa có Cơ hội (Deal) nào phát sinh</div>
                            <div class="empty-desc">Khi lead có nhu cầu thực tế, tạo Cơ hội để theo dõi pipeline và doanh thu chốt.</div>
                            <button type="button" class="crm-btn crm-btn-primary" onclick="window.crmOpenAddDealModal('${campaignId}')">+ Tạo Cơ hội mới</button>
                        </div>
                    </td>
                </tr>
            `;
            return;
        }

        tableBody.innerHTML = campDeals.map(deal => {
            const st = getDealStageMeta(deal.stage);
            const isWon = deal.stage === "won";

            return `
                <tr>
                    <td>
                        <strong>${escapeHtml(deal.dealName)}</strong>
                        <div style="font-size:11.5px; color:var(--crm-muted);">Từ Lead: ${escapeHtml(deal.leadName || "Chưa gán")}</div>
                    </td>
                    <td><strong>${escapeHtml(deal.customerName)}</strong></td>
                    <td>
                        <span class="deal-stage-badge ${st.badgeClass}">${st.label}</span>
                    </td>
                    <td>${formatCurrency(deal.expectedAmount)}</td>
                    <td>
                        ${isWon ? `
                            <strong style="color:#047857; font-size:14px;">${formatCurrency(deal.wonAmount)}</strong>
                        ` : `
                            <span style="color:var(--crm-muted); font-size:12px;">Đang đàm phán</span>
                        `}
                    </td>
                    <td>${formatDate(deal.closeDate)}</td>
                    <td>
                        ${!isWon ? `
                            <button type="button" class="crm-btn crm-btn-secondary" style="font-size:11.5px; padding:0 8px; min-height:28px;" onclick="window.crmMarkDealAsWon('${deal.id}')">
                                Chốt Won 🏆
                            </button>
                        ` : `
                            <span style="color:#15803d; font-size:12px; font-weight:700;">Đã hoàn thành</span>
                        `}
                    </td>
                </tr>
            `;
        }).join("");
    }

    // Render Tab 3: Analytics (Đo lường "nhiều lead vs thực sự ra doanh thu")
    function renderDrawerAnalyticsTab(camp, m) {
        document.getElementById("analyticsBudget").textContent = formatCurrency(m.spent);
        document.getElementById("analyticsWonRevenue").textContent = formatCurrency(m.wonRevenue);
        document.getElementById("analyticsGrossProfit").textContent = formatCurrency(m.wonRevenue - m.spent);
        document.getElementById("analyticsROI").textContent = `${m.roi > 0 ? "+" : ""}${m.roi}%`;
        
        document.getElementById("analyticsTotalLeads").textContent = `${m.leadCount} Leads`;
        document.getElementById("analyticsCPL").textContent = formatCurrency(m.cpl);
        document.getElementById("analyticsTotalDeals").textContent = `${m.dealCount} Deals`;
        document.getElementById("analyticsAvgDealSize").textContent = m.wonCount > 0 ? formatCurrency(Math.round(m.wonRevenue / m.wonCount)) : "0 ₫";

        // Business Insight Notice: Giúp Marketer đánh giá hiệu quả thực chất
        const insightEl = document.getElementById("analyticsInsightNotice");
        if (insightEl) {
            if (m.roi >= 200) {
                insightEl.innerHTML = `
                    <div style="background:#ecfdf5; border:1px solid #6ee7b7; border-radius:8px; padding:12px 16px; color:#065f46;">
                        <strong>🌟 Đánh giá Chiến lược:</strong> Kênh triển khai có tỷ suất lợi nhuận xuất sắc (+${m.roi}%). Chất lượng Lead rất cao và đóng góp doanh số vượt trội. Nên đề xuất <strong>tăng ngân sách 30-50%</strong> cho chiến dịch này trong quý tới!
                    </div>
                `;
            } else if (m.roi >= 0) {
                insightEl.innerHTML = `
                    <div style="background:#eff6ff; border:1px solid #bfdbfe; border-radius:8px; padding:12px 16px; color:#1e40af;">
                        <strong>📊 Đánh giá Chiến lược:</strong> Chiến dịch hòa vốn và có lợi nhuận dương (+${m.roi}%). Cần phối hợp với Sales để tối ưu tỷ lệ chuyển đổi từ giai đoạn Báo giá sang Chốt hợp đồng.
                    </div>
                `;
            } else {
                insightEl.innerHTML = `
                    <div style="background:#fef2f2; border:1px solid #fecaca; border-radius:8px; padding:12px 16px; color:#991b1b;">
                        <strong>⚠️ Cảnh báo Thất thoát:</strong> Chiến dịch mang về ${m.leadCount} Lead nhưng chỉ thu về ${formatCurrency(m.wonRevenue)} doanh thu, dẫn đến lỗ <strong>ROI: ${m.roi}%</strong>. Đây là dấu hiệu của việc tệp khách hàng bị loãng hoặc lead không đúng chân dung B2B. Cần tối ưu lại targeting hoặc cân nhắc tạm dừng!
                    </div>
                `;
            }
        }
    }

    /* ==========================================================================
       9. MODALS MANAGEMENT (Thêm / Sửa Chiến dịch, Thêm Lead, Thêm Deal)
       ========================================================================== */
    function setVal(id, val) {
        const el = document.getElementById(id);
        if (el) el.value = (val !== undefined && val !== null) ? val : "";
    }

    function openCampaignModal(campaignId = null) {
        const modal = document.getElementById("campaignModal");
        if (!modal) {
            console.error("Không tìm thấy phần tử #campaignModal");
            return;
        }

        const titleEl = document.getElementById("campaignModalTitle");
        const form = document.getElementById("campaignForm");

        if (form) form.reset();
        setVal("campaignEditId", "");

        if (campaignId) {
            const camp = campaigns.find(c => c.id === campaignId);
            if (!camp) return;

            if (titleEl) titleEl.textContent = "Chỉnh sửa chiến dịch Marketing";
            setVal("campaignEditId", camp.id);
            setVal("campaignCode", camp.code || "");
            setVal("campaignName", camp.name || "");
            setVal("campaignChannel", camp.channel || "google");
            setVal("campaignStatus", camp.status || "active");
            setVal("campaignBudget", camp.budget || "");
            setVal("campaignSpent", camp.spent || "");
            setVal("campaignStartDate", camp.startDate || "");
            setVal("campaignEndDate", camp.endDate || "");
            setVal("campaignOwner", camp.ownerName || "");
            setVal("campaignTargetLeads", camp.targetLeads || "");
            setVal("campaignTargetRevenue", camp.targetRevenue || "");
            setVal("campaignDescription", camp.description || "");
        } else {
            if (titleEl) titleEl.textContent = "Khai báo chiến dịch Marketing mới";
            const newIndex = campaigns.length + 1;
            setVal("campaignCode", `CAMP-2026-${String(newIndex).padStart(3, "0")}`);
            setVal("campaignStartDate", new Date().toISOString().split("T")[0]);
            const defaultEndDate = new Date();
            defaultEndDate.setMonth(defaultEndDate.getMonth() + 2);
            setVal("campaignEndDate", defaultEndDate.toISOString().split("T")[0]);
            setVal("campaignChannel", "google");
            setVal("campaignStatus", "active");
            setVal("campaignBudget", "50000000");
            setVal("campaignSpent", "0");
            setVal("campaignOwner", "Chuyên viên Marketing");
            setVal("campaignTargetLeads", "100");
            setVal("campaignTargetRevenue", "250000000");
            setVal("campaignDescription", "");
        }

        modal.classList.add("active");
        modal.classList.add("open");
        modal.style.display = "flex";
        modal.style.visibility = "visible";
        modal.style.opacity = "1";
        document.body.classList.add("modal-open");
    }

    function closeCampaignModal() {
        const modal = document.getElementById("campaignModal");
        if (!modal) return;
        modal.classList.remove("active");
        modal.classList.remove("open");
        modal.style.display = "none";
        document.body.classList.remove("modal-open");
    }

    function saveCampaignFromForm(e) {
        if (e && e.preventDefault) e.preventDefault();
        const editId = (document.getElementById("campaignEditId")?.value || "").trim();
        const code = (document.getElementById("campaignCode")?.value || "").trim();
        const name = (document.getElementById("campaignName")?.value || "").trim();
        const channel = document.getElementById("campaignChannel")?.value || "google";
        const status = document.getElementById("campaignStatus")?.value || "active";
        const budget = Number(document.getElementById("campaignBudget")?.value) || 0;
        const spent = Number(document.getElementById("campaignSpent")?.value) || 0;
        const startDate = document.getElementById("campaignStartDate")?.value || new Date().toISOString().split("T")[0];
        const endDate = document.getElementById("campaignEndDate")?.value || "";
        const ownerName = (document.getElementById("campaignOwner")?.value || "").trim();
        const targetLeads = Number(document.getElementById("campaignTargetLeads")?.value) || 0;
        const targetRevenue = Number(document.getElementById("campaignTargetRevenue")?.value) || 0;
        const description = (document.getElementById("campaignDescription")?.value || "").trim();

        if (!name) {
            showToast("Vui lòng nhập tên chiến dịch", "warning");
            document.getElementById("campaignName")?.focus();
            return;
        }

        if (budget <= 0) {
            showToast("Vui lòng nhập ngân sách chiến dịch lớn hơn 0", "warning");
            document.getElementById("campaignBudget")?.focus();
            return;
        }

        if (editId) {
            // Update
            const index = campaigns.findIndex(c => c.id === editId);
            if (index !== -1) {
                campaigns[index] = {
                    ...campaigns[index],
                    code, name, channel, status, budget, spent, startDate, endDate, ownerName, targetLeads, targetRevenue, description
                };
                showToast("Đã cập nhật thông tin chiến dịch thành công!", "success");
            }
        } else {
            // Create New
            const newCampaign = {
                id: `camp-${Date.now()}`,
                code: code || `CAMP-${Date.now()}`,
                name, channel, status, budget, spent, startDate, endDate, ownerName, targetLeads, targetRevenue, description,
                createdAt: new Date().toISOString().split("T")[0]
            };
            campaigns.unshift(newCampaign);
            showToast("Đã khai báo chiến dịch mới thành công!", "success");
        }

        saveData();
        closeCampaignModal();
        renderCampaignList();

        // If drawer is open for this campaign, re-render drawer
        if (activeDrawerCampaignId && (activeDrawerCampaignId === editId)) {
            openCampaignDrawer(activeDrawerCampaignId);
        }
    }

    function deleteCampaign(campaignId) {
        const camp = campaigns.find(c => c.id === campaignId);
        if (!camp) return;

        if (confirm(`Bạn có chắc chắn muốn xóa chiến dịch "${camp.name}" không?\nToàn bộ các liên kết Lead và Cơ hội thuộc chiến dịch này cũng sẽ được giải phóng.`)) {
            campaigns = campaigns.filter(c => c.id !== campaignId);
            saveData();
            showToast(`Đã xóa chiến dịch "${camp.name}"`, "success");
            renderCampaignList();
            if (activeDrawerCampaignId === campaignId) {
                closeCampaignDrawer();
            }
        }
    }

    /* Modal Add Lead */
    function openAddLeadModal(campaignId) {
        document.getElementById("leadCampaignId").value = campaignId || activeDrawerCampaignId;
        document.getElementById("leadForm")?.reset();
        const m = document.getElementById("leadModal");
        if (m) {
            m.classList.add("active");
            m.classList.add("open");
            m.style.display = "flex";
        }
    }

    function closeLeadModal() {
        const m = document.getElementById("leadModal");
        if (m) {
            m.classList.remove("active");
            m.classList.remove("open");
            m.style.display = "none";
        }
    }

    function saveLeadFromForm(e) {
        e.preventDefault();
        const campaignId = document.getElementById("leadCampaignId").value;
        const fullName = document.getElementById("leadFullName").value.trim();
        const company = document.getElementById("leadCompany").value.trim();
        const title = document.getElementById("leadTitle").value.trim();
        const phone = document.getElementById("leadPhone").value.trim();
        const email = document.getElementById("leadEmail").value.trim();
        const sourceUtm = document.getElementById("leadUtm").value.trim();
        const status = document.getElementById("leadStatus").value;
        const notes = document.getElementById("leadNotes").value.trim();

        if (!fullName || !phone) {
            showToast("Vui lòng nhập họ tên và số điện thoại", "warning");
            return;
        }

        const newLead = {
            id: `lead-${Date.now()}`,
            campaignId,
            fullName,
            company: company || "Cá nhân",
            title,
            phone,
            email,
            sourceUtm: sourceUtm || "Direct Campaign",
            status: status || "new",
            createdAt: new Date().toISOString().split("T")[0],
            ownerName: "Lê Thu Hà",
            notes
        };

        leads.unshift(newLead);
        saveData();
        closeLeadModal();
        showToast(`Đã thêm Lead "${fullName}" vào chiến dịch thành công!`, "success");

        renderCampaignList();
        if (activeDrawerCampaignId === campaignId) {
            openCampaignDrawer(campaignId);
            switchDrawerTab("leads");
        }
    }

    /* Modal Add Deal (Cơ hội) */
    function openAddDealModal(campaignId, preselectedLeadId = null) {
        const targetCampId = campaignId || activeDrawerCampaignId;
        document.getElementById("dealCampaignId").value = targetCampId;
        document.getElementById("dealForm")?.reset();

        // Populate Lead Select Dropdown
        const leadSelect = document.getElementById("dealLeadSelect");
        const campLeads = leads.filter(l => l.campaignId === targetCampId);
        
        leadSelect.innerHTML = `<option value="">-- Chọn Lead sinh ra Cơ hội này --</option>` +
            campLeads.map(l => `<option value="${l.id}" ${l.id === preselectedLeadId ? 'selected' : ''}>${escapeHtml(l.fullName)} (${escapeHtml(l.company)})</option>`).join("");

        // Set default close date (1 month from today)
        const d = new Date();
        d.setMonth(d.getMonth() + 1);
        document.getElementById("dealCloseDate").value = d.toISOString().split("T")[0];

        const m = document.getElementById("dealModal");
        if (m) {
            m.classList.add("active");
            m.classList.add("open");
            m.style.display = "flex";
        }
    }

    function closeDealModal() {
        const m = document.getElementById("dealModal");
        if (m) {
            m.classList.remove("active");
            m.classList.remove("open");
            m.style.display = "none";
        }
    }

    function saveDealFromForm(e) {
        e.preventDefault();
        const campaignId = document.getElementById("dealCampaignId").value;
        const leadId = document.getElementById("dealLeadSelect").value;
        const dealName = document.getElementById("dealName").value.trim();
        const customerName = document.getElementById("dealCustomerName").value.trim();
        const stage = document.getElementById("dealStage").value;
        const expectedAmount = Number(document.getElementById("dealExpectedAmount").value) || 0;
        const wonAmount = Number(document.getElementById("dealWonAmount").value) || (stage === "won" ? expectedAmount : 0);
        const closeDate = document.getElementById("dealCloseDate").value;

        if (!dealName || !customerName) {
            showToast("Vui lòng nhập tên Cơ hội và tên Khách hàng", "warning");
            return;
        }

        const selectedLead = leads.find(l => l.id === leadId);
        const leadName = selectedLead ? selectedLead.fullName : "Chưa chọn";

        // If lead was selected, mark lead as converted!
        if (selectedLead) {
            selectedLead.status = "converted";
        }

        const newDeal = {
            id: `deal-${Date.now()}`,
            campaignId,
            leadId,
            leadName,
            dealName,
            customerName,
            stage,
            expectedAmount,
            wonAmount: stage === "won" ? wonAmount : 0,
            probability: stage === "won" ? 100 : 50,
            closeDate,
            ownerName: "Nguyễn Hoàng Nam"
        };

        deals.unshift(newDeal);
        saveData();
        closeDealModal();
        showToast(`Đã tạo Cơ hội "${dealName}" gắn với chiến dịch thành công!`, "success");

        renderCampaignList();
        if (activeDrawerCampaignId === campaignId) {
            openCampaignDrawer(campaignId);
            switchDrawerTab("deals");
        }
    }

    function convertLeadToDeal(leadId) {
        const lead = leads.find(l => l.id === leadId);
        if (!lead) return;

        openAddDealModal(lead.campaignId, lead.id);
        document.getElementById("dealName").value = `Hợp đồng cung cấp dịch vụ - ${lead.company || lead.fullName}`;
        document.getElementById("dealCustomerName").value = lead.company || lead.fullName;
    }

    function markDealAsWon(dealId) {
        const deal = deals.find(d => d.id === dealId);
        if (!deal) return;

        const amountStr = prompt(`Xác nhận chốt Thành công (Won) cho Cơ hội:\n"${deal.dealName}"\n\nNhập giá trị hợp đồng đã chốt thực tế (VNĐ):`, deal.expectedAmount || 100000000);
        if (amountStr === null) return;

        const actualWon = Number(amountStr) || deal.expectedAmount;
        deal.stage = "won";
        deal.wonAmount = actualWon;
        deal.probability = 100;
        deal.closeDate = new Date().toISOString().split("T")[0];

        saveData();
        showToast(`Tuyệt vời! Đã ghi nhận doanh thu ${formatCurrency(actualWon)} cho chiến dịch!`, "success");
        renderCampaignList();
        if (activeDrawerCampaignId) {
            openCampaignDrawer(activeDrawerCampaignId);
            switchDrawerTab("deals");
        }
    }

    /* ==========================================================================
       10. EXPORT DATA TO CSV (Hỗ trợ báo cáo cho Nhân viên Marketing)
       ========================================================================== */
    function exportCampaignsCSV() {
        const filtered = getFilteredCampaigns();
        if (filtered.length === 0) {
            showToast("Không có dữ liệu để xuất file", "warning");
            return;
        }

        const headers = ["Mã chiến dịch", "Tên chiến dịch", "Kênh", "Trạng thái", "Ngày bắt đầu", "Ngày kết thúc", "Ngân sách (VNĐ)", "Chi tiêu thực tế (VNĐ)", "Số Lead", "CPL (VNĐ/Lead)", "Số Deals", "Tỷ lệ chuyển đổi (%)", "Doanh thu chốt (VNĐ)", "ROI (%)", "Người phụ trách"];
        const rows = filtered.map(c => {
            const m = getCampaignMetrics(c);
            const ch = getChannelMeta(c.channel);
            const st = getStatusMeta(c.status);
            return [
                `"${c.code}"`,
                `"${c.name.replace(/"/g, '""')}"`,
                `"${ch.label}"`,
                `"${st.label}"`,
                `"${c.startDate}"`,
                `"${c.endDate}"`,
                m.budget,
                m.spent,
                m.leadCount,
                m.cpl,
                m.dealCount,
                m.conversionRate,
                m.wonRevenue,
                `${m.roi}%`,
                `"${c.ownerName || ""}"`
            ];
        });

        const csvContent = "\uFEFF" + [headers.join(","), ...rows.map(r => r.join(","))].join("\r\n");
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `Bao_cao_chien_dich_marketing_${new Date().toISOString().split("T")[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        showToast("Đã tải xuống file báo cáo chiến dịch thành công!", "success");
    }

    /* ==========================================================================
       11. TOAST NOTIFICATION UTILITY
       ========================================================================== */
    function showToast(message, type = "success") {
        let region = document.querySelector(".crm-toast-region");
        if (!region) {
            region = document.createElement("div");
            region.className = "crm-toast-region";
            document.body.appendChild(region);
        }

        const toast = document.createElement("div");
        toast.className = `crm-toast crm-toast-${type}`;
        
        let iconSvg = `<svg viewBox="0 0 24 24"><path d="m5 12 5 5L20 7"/></svg>`;
        if (type === "warning") iconSvg = `<svg viewBox="0 0 24 24"><path d="M12 9v4m0 4h.01M12 3l9 18H3L12 3z"/></svg>`;
        if (type === "error") iconSvg = `<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="m15 9-6 6m0-6 6 6"/></svg>`;

        toast.innerHTML = `
            <div class="crm-toast-icon">${iconSvg}</div>
            <div class="crm-toast-copy">${escapeHtml(message)}</div>
            <button type="button" class="crm-toast-close" aria-label="Đóng">
                <svg viewBox="0 0 24 24"><path d="M18 6 6 18M6 6l12 12"/></svg>
            </button>
            <div class="crm-toast-progress"></div>
        `;

        region.appendChild(toast);

        toast.querySelector(".crm-toast-close").addEventListener("click", () => {
            toast.remove();
        });

        setTimeout(() => {
            toast.style.opacity = "0";
            toast.style.transition = "opacity 300ms ease";
            setTimeout(() => toast.remove(), 300);
        }, 4000);
    }

    function escapeHtml(str) {
        if (!str) return "";
        return String(str)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    /* ==========================================================================
       12. GLOBAL REGISTRATIONS & EVENT LISTENERS
       ========================================================================== */
    window.crmOpenCampaignDrawer = openCampaignDrawer;
    window.crmCloseCampaignDrawer = closeCampaignDrawer;
    window.crmOpenAddCampaign = (e) => {
        if (e && e.preventDefault) e.preventDefault();
        openCampaignModal(null);
    };
    window.crmOpenEditCampaign = (id) => openCampaignModal(id);
    window.crmDeleteCampaign = deleteCampaign;
    window.crmOpenAddLeadModal = openAddLeadModal;
    window.crmOpenAddDealModal = openAddDealModal;
    window.crmConvertLeadToDeal = convertLeadToDeal;
    window.crmMarkDealAsWon = markDealAsWon;
    window.crmExportCampaignsCSV = exportCampaignsCSV;

    window.crmResetCampaignFilters = function () {
        const s = document.getElementById("campaignSearch");
        const c = document.getElementById("channelFilter");
        const st = document.getElementById("statusFilter");
        const sort = document.getElementById("sortFilter");
        if (s) s.value = "";
        if (c) c.value = "all";
        if (st) st.value = "all";
        if (sort) sort.value = "revenue";
        renderCampaignList();
    };

    function bindEvents() {
        // Direct event listener for all Add Campaign button variations
        const addButtons = document.querySelectorAll("#addCampaignButton, #btnAddCampaign, .btn-add-campaign, [data-action='add-campaign']");
        addButtons.forEach(btn => {
            btn.addEventListener("click", (e) => {
                e.preventDefault();
                openCampaignModal(null);
            });
        });

        // Search & Filters change listeners
        document.getElementById("campaignSearch")?.addEventListener("input", renderCampaignList);
        document.getElementById("channelFilter")?.addEventListener("change", renderCampaignList);
        document.getElementById("statusFilter")?.addEventListener("change", renderCampaignList);
        document.getElementById("sortFilter")?.addEventListener("change", renderCampaignList);

        // View toggle buttons
        document.getElementById("viewBtnTable")?.addEventListener("click", () => {
            currentView = "table";
            document.getElementById("viewBtnTable")?.classList.add("active");
            document.getElementById("viewBtnGrid")?.classList.remove("active");
            renderCampaignList();
        });

        document.getElementById("viewBtnGrid")?.addEventListener("click", () => {
            currentView = "grid";
            document.getElementById("viewBtnGrid")?.classList.add("active");
            document.getElementById("viewBtnTable")?.classList.remove("active");
            renderCampaignList();
        });

        // Form submits
        document.getElementById("campaignForm")?.addEventListener("submit", saveCampaignFromForm);
        document.getElementById("leadForm")?.addEventListener("submit", saveLeadFromForm);
        document.getElementById("dealForm")?.addEventListener("submit", saveDealFromForm);

        // Modal close buttons & backdrop click
        document.getElementById("campaignModalClose")?.addEventListener("click", closeCampaignModal);
        document.getElementById("btnCancelCampaign")?.addEventListener("click", closeCampaignModal);
        document.getElementById("campaignModal")?.addEventListener("click", (e) => {
            if (e.target.id === "campaignModal") closeCampaignModal();
        });

        document.getElementById("drawerCloseBtn")?.addEventListener("click", closeCampaignDrawer);
        document.getElementById("drawerBackdrop")?.addEventListener("click", closeCampaignDrawer);

        document.getElementById("leadModalClose")?.addEventListener("click", closeLeadModal);
        document.getElementById("btnCancelLead")?.addEventListener("click", closeLeadModal);
        document.getElementById("dealModalClose")?.addEventListener("click", closeDealModal);
        document.getElementById("btnCancelDeal")?.addEventListener("click", closeDealModal);

        // Drawer Tabs clicks
        document.querySelectorAll(".drawer-tab-btn").forEach(btn => {
            btn.addEventListener("click", () => {
                const tab = btn.getAttribute("data-tab");
                switchDrawerTab(tab);
            });
        });

        // ESC key close
        document.addEventListener("keydown", (e) => {
            if (e.key === "Escape") {
                closeCampaignModal();
                closeCampaignDrawer();
                closeLeadModal();
                closeDealModal();
            }
        });
    }

    document.addEventListener("DOMContentLoaded", () => {
        initData();
        bindEvents();
        renderCampaignList();
    });

    // Also run bindEvents immediately in case script is loaded after DOMContentLoaded
    if (document.readyState === "complete" || document.readyState === "interactive") {
        initData();
        bindEvents();
        renderCampaignList();
    }

})();
