/**
 * deals.js - Xử lý Logic Quản lý Sản phẩm Cơ hội & Tính toán ARR Thời gian thực
 * Subtask: SCRUM-195 (User Story: SCRUM-74)
 * Tuân thủ CRM Design System, hỗ trợ Offline / Live Server (port 5500) và API backend.
 */

"use strict";

const API_BASE = "http://localhost:8080/crm";

/* =========================================================
   1. BẢNG GIÁ NIÊM YẾT (PRICE BOOKS) & DANH MỤC SẢN PHẨM (CATALOG)
========================================================= */

const PRICE_BOOKS = [
    {
        id: "PB-STD-2026",
        name: "Bảng giá niêm yết chuẩn 2026 (Mặc định)",
        multiplier: 1.0,
        badge: "Chuẩn niêm yết 100%",
        effectiveFrom: "2026-01-01"
    },
    {
        id: "PB-ENT-2026",
        name: "Bảng giá Doanh nghiệp VIP (Chiết khấu niêm yết 10%)",
        multiplier: 0.90,
        badge: "Ưu đãi VIP -10%",
        effectiveFrom: "2026-01-01"
    },
    {
        id: "PB-PARTNER-2026",
        name: "Bảng giá Đối tác & Đại lý cấp 1 (-15%)",
        multiplier: 0.85,
        badge: "Đại lý -15%",
        effectiveFrom: "2026-01-01"
    },
    {
        id: "PB-SME-2026",
        name: "Bảng giá Ưu đãi Doanh nghiệp vừa & nhỏ SME (-20%)",
        multiplier: 0.80,
        badge: "Gói SME -20%",
        effectiveFrom: "2026-02-01"
    }
];

const PRODUCT_CATALOG = [
    {
        id: 1,
        code: "CRM-SEAT-STD",
        name: "Gói người dùng CRM Standard (User/tháng)",
        category: "saas",
        categoryName: "SaaS / Thuê bao Cloud",
        type: "RECURRING",
        unit: "Người dùng / tháng",
        defaultCycle: "MONTHLY",
        defaultMonths: 12,
        baseListPrice: 150000,
        floorPrice: 120000,
        costPrice: 60000,
        description: "Quản lý liên hệ, khách hàng, lịch sử cuộc gọi và dashboard cơ bản."
    },
    {
        id: 2,
        code: "CRM-SEAT-PRO",
        name: "Gói người dùng CRM Professional (User/tháng)",
        category: "saas",
        categoryName: "SaaS / Thuê bao Cloud",
        type: "RECURRING",
        unit: "Người dùng / tháng",
        defaultCycle: "MONTHLY",
        defaultMonths: 12,
        baseListPrice: 350000,
        floorPrice: 280000,
        costPrice: 140000,
        description: "Bao gồm Pipeline Kanban, báo giá nâng cao, chấm điểm Lead, phân quyền theo nhóm."
    },
    {
        id: 3,
        code: "CRM-SEAT-ENT",
        name: "Gói người dùng CRM Enterprise (User/tháng)",
        category: "saas",
        categoryName: "SaaS / Thuê bao Cloud",
        type: "RECURRING",
        unit: "Người dùng / tháng",
        defaultCycle: "MONTHLY",
        defaultMonths: 12,
        baseListPrice: 650000,
        floorPrice: 500000,
        costPrice: 250000,
        description: "Full module: API webhook, tự động hóa quy trình, đa chi nhánh, SLA hỗ trợ 24/7."
    },
    {
        id: 4,
        code: "SRV-IMPL-BASIC",
        name: "Dịch vụ Triển khai & Cấu hình CRM Cơ bản",
        category: "services",
        categoryName: "Dịch vụ triển khai",
        type: "ONE_TIME",
        unit: "Gói dự án",
        baseListPrice: 25000000,
        floorPrice: 20000000,
        costPrice: 10000000,
        description: "Khởi tạo dữ liệu khách hàng mẫu, cấu hình trường tùy chỉnh và phân quyền vai trò ban đầu."
    },
    {
        id: 5,
        code: "SRV-IMPL-ADV",
        name: "Dịch vụ Tùy chỉnh Quy trình & Tích hợp ERP / VoIP",
        category: "services",
        categoryName: "Dịch vụ triển khai",
        type: "ONE_TIME",
        unit: "Gói dự án",
        baseListPrice: 60000000,
        floorPrice: 48000000,
        costPrice: 25000000,
        description: "Tích hợp đồng bộ 2 chiều phần mềm kế toán/ERP, tổng đài thoại VoIP và webform."
    },
    {
        id: 6,
        code: "SRV-TRAIN-ON",
        name: "Khóa Đào tạo Chuyển giao Sử dụng CRM (Onsite)",
        category: "training",
        categoryName: "Đào tạo & Hướng dẫn",
        type: "ONE_TIME",
        unit: "Buổi đào tạo",
        baseListPrice: 5000000,
        floorPrice: 4000000,
        costPrice: 2000000,
        description: "Giảng viên hướng dẫn trực tiếp tại văn phòng khách hàng (kèm tài liệu & video)."
    },
    {
        id: 7,
        code: "MOD-VOIP-CALL",
        name: "Module Tích hợp Tổng đài ảo & Ghi âm cuộc gọi (VoIP CTI)",
        category: "modules",
        categoryName: "Module mở rộng",
        type: "RECURRING",
        unit: "Gói / tháng",
        defaultCycle: "MONTHLY",
        defaultMonths: 12,
        baseListPrice: 1200000,
        floorPrice: 950000,
        costPrice: 500000,
        description: "Click-to-call, popup thông tin người gọi, ghi âm và nghe lại file ghi âm cuộc gọi."
    },
    {
        id: 8,
        code: "MOD-ZALO-OA",
        name: "Module Gửi tin Zalo ZNS / Zalo OA & SMS Brandname",
        category: "modules",
        categoryName: "Module mở rộng",
        type: "RECURRING",
        unit: "Gói / tháng",
        defaultCycle: "MONTHLY",
        defaultMonths: 12,
        baseListPrice: 800000,
        floorPrice: 600000,
        costPrice: 300000,
        description: "Tự động gửi thông báo CSKH qua tin ZNS, chăm sóc sinh nhật và chiến dịch marketing."
    },
    {
        id: 9,
        code: "SRV-MAINT-VIP",
        name: "Gói Bảo trì & Hỗ trợ Kỹ thuật VIP 24/7 (Hợp đồng năm)",
        category: "services",
        categoryName: "Dịch vụ bảo trì",
        type: "RECURRING",
        unit: "Gói / năm",
        defaultCycle: "ANNUAL",
        defaultMonths: 12,
        baseListPrice: 18000000,
        floorPrice: 15000000,
        costPrice: 7000000,
        description: "Cam kết phản hồi dưới 15 phút, sao lưu dữ liệu tự động hàng ngày, hotline riêng."
    },
    {
        id: 10,
        code: "MOD-BI-REPORT",
        name: "Module Báo cáo Phân tích Chuyên sâu (Advanced BI & Analytics)",
        category: "modules",
        categoryName: "Bản quyền phần mềm",
        type: "ONE_TIME",
        unit: "Gói vĩnh viễn",
        baseListPrice: 35000000,
        floorPrice: 28000000,
        costPrice: 12000000,
        description: "Dashboard dự báo doanh số, báo cáo tỷ lệ chuyển đổi Lead-to-Deal, đo lường năng suất Sales."
    },
    {
        id: 11,
        code: "HW-IPPHONE-YEALINK",
        name: "Điện thoại IP Phone Yealink T31P chuẩn HD Voice",
        category: "hardware",
        categoryName: "Phần cứng & Thiết bị",
        type: "ONE_TIME",
        unit: "Chiếc",
        baseListPrice: 1150000,
        floorPrice: 950000,
        costPrice: 750000,
        description: "Điện thoại để bàn IP 2 tài khoản SIP, cổng PoE, âm thanh lọc tạp âm thông minh."
    }
];

/* =========================================================
   2. DỮ LIỆU CƠ HỘI MẪU (OPPORTUNITIES SEED) & KHÁCH HÀNG
========================================================= */

const DEFAULT_CUSTOMERS = [
    { id: 4, name: "Ngân hàng TMCP Việt Nam Thịnh Vượng (VPBank Thăng Long)", code: "KH-004", phone: "02439288888", taxCode: "0100233583" },
    { id: 5, name: "Chuỗi Bán lẻ Thời trang Nem Fashion", code: "KH-005", phone: "0936112233", taxCode: "0103765432" },
    { id: 3, name: "Công ty TNHH Dịch vụ & Du lịch Viettravel Sun", code: "KH-003", phone: "0903124578", taxCode: "0108923412" },
    { id: 6, name: "Công ty Cổ phần Dược phẩm An Sinh Medicare", code: "KH-006", phone: "0977889900", taxCode: "0314567890" },
    { id: 7, name: "Tập đoàn Sản xuất & Chế tạo Cơ khí Nam Á", code: "KH-007", phone: "02743899222", taxCode: "3701239876" },
    { id: 8, name: "Hệ thống Trường Quốc tế Á Châu (Asian School)", code: "KH-008", phone: "02838480740", taxCode: "0302456781" },
    { id: 9, name: "Công ty Cổ phần Giải pháp Logistics LogiTech Việt Nam", code: "KH-009", phone: "0918776655", taxCode: "0201889922" },
    { id: 10, name: "Chuỗi Cửa hàng Trà sữa TocoToco (Công ty CP Taco)", code: "KH-010", phone: "1900636936", taxCode: "0106489012" },
    { id: 11, name: "Công ty Cổ phần Đầu tư Công nghệ Xanh GreenTech", code: "KH-011", phone: "0905667788", taxCode: "0401998877" },
    { id: 12, name: "Tập đoàn Bán buôn & Phân phối Điện tử Đại Phát", code: "KH-012", phone: "0944556677", taxCode: "0105123999" }
];

const PIPELINE_STAGES = [
    { id: 1, name: "Khảo sát & Tiếp cận", probability: 10 },
    { id: 2, name: "Đánh giá & Xác định nhu cầu", probability: 30 },
    { id: 3, name: "Gửi đề xuất & Báo giá", probability: 60 },
    { id: 4, name: "Thương lượng & Đàm phán", probability: 80 },
    { id: 5, name: "Chốt thành công (Won)", probability: 100, isWon: true },
    { id: 6, name: "Đóng Thua (Lost)", probability: 0, isLost: true }
];

const DEFAULT_DEALS = [
    {
        id: 1,
        code: "OPP-2026-001",
        name: "Triển khai CRM Enterprise cho VPBank Thăng Long",
        customerId: 4,
        customerName: "VPBank Thăng Long",
        contactName: "Nguyễn Thu Trang",
        stageId: 4,
        probability: 80,
        expectedCloseDate: "2026-11-15",
        ownerName: "Nguyễn Văn An",
        status: "OPEN",
        priceBookId: "PB-STD-2026",
        vatPercent: 10,
        notes: "Khách hàng yêu cầu triển khai đồng bộ VoIP và tích hợp luồng phê duyệt tín dụng nội bộ."
    },
    {
        id: 2,
        code: "OPP-2026-002",
        name: "Gói CRM Cloud & Đào tạo cho NEM Fashion",
        customerId: 5,
        customerName: "NEM Fashion",
        contactName: "Phạm Quốc Hùng",
        stageId: 3,
        probability: 60,
        expectedCloseDate: "2026-11-25",
        ownerName: "Phạm Quốc Hùng",
        status: "OPEN",
        priceBookId: "PB-ENT-2026",
        vatPercent: 10,
        notes: "Áp dụng bảng giá Doanh nghiệp VIP cho chuỗi 50 showroom."
    },
    {
        id: 3,
        code: "OPP-2026-003",
        name: "Tích hợp VoIP & Tổng đài Viettravel Sun",
        customerId: 3,
        customerName: "Viettravel Sun",
        contactName: "Trần Minh Tuấn",
        stageId: 2,
        probability: 30,
        expectedCloseDate: "2026-12-10",
        ownerName: "Trần Minh Tuấn",
        status: "OPEN",
        priceBookId: "PB-STD-2026",
        vatPercent: 10,
        notes: "Giai đoạn khảo sát kỹ thuật hạ tầng mạng."
    },
    {
        id: 4,
        code: "OPP-2026-004",
        name: "Nâng cấp hệ thống BI & Báo cáo LogiTech",
        customerId: 9,
        customerName: "LogiTech Logistics",
        contactName: "Đặng Hoàng Yến",
        stageId: 5,
        probability: 100,
        expectedCloseDate: "2026-10-15",
        ownerName: "Đặng Hoàng Yến",
        status: "WON",
        priceBookId: "PB-STD-2026",
        vatPercent: 10,
        notes: "Hợp đồng đã ký thành công, đang bàn giao tài liệu kỹ thuật."
    },
    {
        id: 5,
        code: "OPP-2026-005",
        name: "Triển khai CRM cho Dược phẩm An Sinh",
        customerId: 6,
        customerName: "Dược phẩm An Sinh",
        contactName: "Lê Thị Mai",
        stageId: 4,
        probability: 80,
        expectedCloseDate: "2026-11-10",
        ownerName: "Lê Thị Mai",
        status: "OPEN",
        priceBookId: "PB-ENT-2026",
        vatPercent: 10,
        notes: "Đang đàm phán phụ lục điều khoản bảo trì VIP năm thứ 2."
    }
];

// Khởi tạo dòng sản phẩm mặc định cho từng Deal (Line items)
const DEFAULT_DEAL_LINE_ITEMS = {
    1: [
        {
            id: 101,
            productId: 2,
            code: "CRM-SEAT-PRO",
            name: "Gói người dùng CRM Professional (User/tháng)",
            type: "RECURRING",
            unit: "Người dùng / tháng",
            billingCycle: "MONTHLY",
            termMonths: 12,
            quantity: 20,
            unitPrice: 350000,
            discountPercent: 0,
            floorPrice: 280000
        },
        {
            id: 102,
            productId: 5,
            code: "SRV-IMPL-ADV",
            name: "Dịch vụ Tùy chỉnh Quy trình & Tích hợp ERP / VoIP",
            type: "ONE_TIME",
            unit: "Gói dự án",
            billingCycle: "ONCE",
            termMonths: 1,
            quantity: 1,
            unitPrice: 60000000,
            discountPercent: 0,
            floorPrice: 48000000
        },
        {
            id: 103,
            productId: 7,
            code: "MOD-VOIP-CALL",
            name: "Module Tích hợp Tổng đài ảo & Ghi âm cuộc gọi (VoIP CTI)",
            type: "RECURRING",
            unit: "Gói / tháng",
            billingCycle: "MONTHLY",
            termMonths: 12,
            quantity: 1,
            unitPrice: 1200000,
            discountPercent: 0,
            floorPrice: 950000
        },
        {
            id: 104,
            productId: 9,
            code: "SRV-MAINT-VIP",
            name: "Gói Bảo trì & Hỗ trợ Kỹ thuật VIP 24/7 (Hợp đồng năm)",
            type: "RECURRING",
            unit: "Gói / năm",
            billingCycle: "ANNUAL",
            termMonths: 12,
            quantity: 1,
            unitPrice: 18000000,
            discountPercent: 0,
            floorPrice: 15000000
        },
        {
            id: 105,
            productId: 6,
            code: "SRV-TRAIN-ON",
            name: "Khóa Đào tạo Chuyển giao Sử dụng CRM (Onsite)",
            type: "ONE_TIME",
            unit: "Buổi đào tạo",
            billingCycle: "ONCE",
            termMonths: 1,
            quantity: 2,
            unitPrice: 5000000,
            discountPercent: 14,
            floorPrice: 4000000
        }
    ],
    2: [
        {
            id: 201,
            productId: 1,
            code: "CRM-SEAT-STD",
            name: "Gói người dùng CRM Standard (User/tháng)",
            type: "RECURRING",
            unit: "Người dùng / tháng",
            billingCycle: "MONTHLY",
            termMonths: 12,
            quantity: 30,
            unitPrice: 135000, // VIP price
            discountPercent: 0,
            floorPrice: 120000
        },
        {
            id: 202,
            productId: 4,
            code: "SRV-IMPL-BASIC",
            name: "Dịch vụ Triển khai & Cấu hình CRM Cơ bản",
            type: "ONE_TIME",
            unit: "Gói dự án",
            billingCycle: "ONCE",
            termMonths: 1,
            quantity: 1,
            unitPrice: 22500000,
            discountPercent: 0,
            floorPrice: 20000000
        }
    ]
};

/* =========================================================
   3. STATE & APP CONTROLLER
========================================================= */

let currentDeal = null;
let currentLineItems = [];
let allDeals = [];
let currentFilterType = "ALL"; // ALL | RECURRING | ONE_TIME
let currentTableSearch = "";
let selectedCatalogProductIds = new Set();
let catalogCategoryFilter = "all";

/* =========================================================
   4. INITIALIZATION
========================================================= */

document.addEventListener("DOMContentLoaded", async () => {
    initDealsStorage();
    loadOpportunitiesList();
    parseUrlAndSetDeal();
    renderPriceBookSelect();
    renderDealInfo();
    renderPipelineStepper();
    renderLineItemsTable();
    recalculateAllTotals();
    bindEventListeners();
});

function initDealsStorage() {
    try {
        // Khởi tạo danh sách khách hàng mẫu nếu chưa có
        let storedCust = JSON.parse(localStorage.getItem("crm_ui_customers"));
        if (!Array.isArray(storedCust) || storedCust.length === 0) {
            localStorage.setItem("crm_ui_customers", JSON.stringify(DEFAULT_CUSTOMERS));
        }

        let storedDeals = JSON.parse(localStorage.getItem("crm_ui_opportunities"));
        if (!Array.isArray(storedDeals) || storedDeals.length === 0) {
            allDeals = [...DEFAULT_DEALS];
            localStorage.setItem("crm_ui_opportunities", JSON.stringify(allDeals));
        } else {
            // Merge defaults if fields missing
            allDeals = storedDeals.map(sd => {
                const def = DEFAULT_DEALS.find(d => d.id === sd.id) || {};
                return {
                    id: sd.id,
                    code: sd.code || def.code || `OPP-2026-${String(sd.id).padStart(3, "0")}`,
                    name: sd.name,
                    customerId: sd.customerId || def.customerId || 1,
                    customerName: sd.customer || sd.customerName || def.customerName || "Khách hàng Doanh nghiệp",
                    contactName: sd.contactName || def.contactName || "Người đại diện",
                    stageId: Number(sd.stage || sd.stageId) || def.stageId || 1,
                    probability: sd.probability !== undefined ? Number(sd.probability) : (def.probability || 10),
                    expectedCloseDate: sd.closeDate || sd.expectedCloseDate || def.expectedCloseDate || "2026-11-30",
                    ownerName: sd.owner || sd.ownerName || def.ownerName || "Tôi",
                    status: sd.status || def.status || "OPEN",
                    priceBookId: sd.priceBookId || def.priceBookId || "PB-STD-2026",
                    vatPercent: sd.vatPercent !== undefined ? sd.vatPercent : 10,
                    notes: sd.notes || def.notes || ""
                };
            });
        }
    } catch (_) {
        allDeals = [...DEFAULT_DEALS];
    }
}

function loadOpportunitiesList() {
    const switcher = document.getElementById("dealSwitcherSelect");
    if (!switcher) return;
    switcher.innerHTML = "";
    allDeals.forEach(d => {
        const opt = document.createElement("option");
        opt.value = d.id;
        opt.textContent = `${d.code} - ${d.name} (${d.customerName})`;
        switcher.appendChild(opt);
    });
}

function parseUrlAndSetDeal() {
    const params = new URLSearchParams(window.location.search);
    const idParam = Number(params.get("id"));
    let target = allDeals.find(d => d.id === idParam);
    if (!target) {
        target = allDeals[0] || DEFAULT_DEALS[0];
    }
    setWorkingDeal(target);
}

function setWorkingDeal(deal) {
    currentDeal = deal;
    const switcher = document.getElementById("dealSwitcherSelect");
    if (switcher) switcher.value = deal.id;

    // Load line items from localStorage or defaults
    const cacheKey = `crm_ui_deal_products_${deal.id}`;
    try {
        const cached = JSON.parse(localStorage.getItem(cacheKey));
        if (Array.isArray(cached) && cached.length > 0) {
            currentLineItems = cached;
        } else if (DEFAULT_DEAL_LINE_ITEMS[deal.id]) {
            currentLineItems = JSON.parse(JSON.stringify(DEFAULT_DEAL_LINE_ITEMS[deal.id]));
        } else {
            currentLineItems = [];
        }
    } catch (_) {
        currentLineItems = DEFAULT_DEAL_LINE_ITEMS[deal.id] || [];
    }
}

/* =========================================================
   5. RENDERING CORE COMPONENTS
========================================================= */

function renderPriceBookSelect() {
    const select = document.getElementById("priceBookSelect");
    if (!select) return;
    select.innerHTML = "";
    PRICE_BOOKS.forEach(pb => {
        const opt = document.createElement("option");
        opt.value = pb.id;
        opt.textContent = `${pb.name} (${pb.badge})`;
        if (currentDeal && currentDeal.priceBookId === pb.id) {
            opt.selected = true;
        }
        select.appendChild(opt);
    });

    select.addEventListener("change", (e) => {
        const newPbId = e.target.value;
        const pb = PRICE_BOOKS.find(p => p.id === newPbId);
        if (!pb) return;
        currentDeal.priceBookId = newPbId;
        
        // Cập nhật giá niêm yết theo multiplier của Bảng giá mới
        if (currentLineItems.length > 0 && confirm(`Áp dụng giá niêm yết của "${pb.name}" cho các dòng sản phẩm chưa tùy chỉnh?`)) {
            currentLineItems.forEach(item => {
                const prod = PRODUCT_CATALOG.find(p => p.id === item.productId || p.code === item.code);
                if (prod) {
                    item.unitPrice = Math.round(prod.baseListPrice * pb.multiplier);
                }
            });
            renderLineItemsTable();
            recalculateAllTotals();
            showToast(`Đã áp dụng bảng giá: ${pb.name}`, "info");
        }
    });
}

function renderDealInfo() {
    if (!currentDeal) return;
    const codeEl = document.getElementById("dealCodeBadge");
    const titleEl = document.getElementById("dealTitle");
    const customerEl = document.getElementById("dealCustomerName");
    const ownerEl = document.getElementById("dealOwnerName");
    const closeDateEl = document.getElementById("dealCloseDate");
    const probEl = document.getElementById("dealProbability");
    const statusEl = document.getElementById("dealStatusBadge");
    const breadcrumbEl = document.getElementById("breadcrumbDealName");
    const notesEl = document.getElementById("dealNotesInput");

    if (codeEl) codeEl.textContent = currentDeal.code;
    if (titleEl) titleEl.textContent = currentDeal.name;
    if (customerEl) customerEl.textContent = currentDeal.customerName;
    if (ownerEl) ownerEl.textContent = currentDeal.ownerName;
    if (closeDateEl) closeDateEl.textContent = formatDate(currentDeal.expectedCloseDate);
    if (probEl) probEl.textContent = `${currentDeal.probability}%`;
    if (breadcrumbEl) breadcrumbEl.textContent = currentDeal.name;
    if (notesEl) notesEl.value = currentDeal.notes || "";

    if (statusEl) {
        statusEl.className = `badge-status ${currentDeal.status.toLowerCase()}`;
        statusEl.textContent = currentDeal.status === "WON" ? "Thành công (Won)" :
                               currentDeal.status === "LOST" ? "Thất bại (Lost)" : "Đang mở (Open)";
    }
}

function renderPipelineStepper() {
    const stepperEl = document.getElementById("pipelineStepper");
    if (!stepperEl || !currentDeal) return;
    stepperEl.innerHTML = "";

    const currentStageIndex = PIPELINE_STAGES.findIndex(s => s.id === currentDeal.stageId);

    PIPELINE_STAGES.slice(0, 5).forEach((st, idx) => {
        const step = document.createElement("div");
        const isActive = st.id === currentDeal.stageId;
        const isCompleted = idx < currentStageIndex;

        step.className = `step-item ${isActive ? "active" : ""} ${isCompleted ? "completed" : ""}`;
        step.innerHTML = `
            <div class="step-num">
                <span>GIAI ĐOẠN ${idx + 1}</span>
                <span>${isCompleted ? "✓" : `${st.probability}%`}</span>
            </div>
            <div class="step-title" title="${st.name}">${escapeHtml(st.name)}</div>
            <div class="step-prob">${isActive ? "Đang đàm phán" : `${st.probability}% xác suất`}</div>
        `;

        step.addEventListener("click", () => {
            currentDeal.stageId = st.id;
            currentDeal.probability = st.probability;
            renderPipelineStepper();
            renderDealInfo();
            showToast(`Đã chuyển giai đoạn sang: ${st.name} (${st.probability}%)`, "success");
        });

        stepperEl.appendChild(step);
    });
}

/* =========================================================
   6. LINE ITEMS TABLE & REAL-TIME CALCULATION ENGINE
========================================================= */

function renderLineItemsTable() {
    const tbody = document.getElementById("lineItemsTableBody");
    const emptyState = document.getElementById("tableEmptyState");
    const countBadge = document.getElementById("lineItemsCountBadge");
    if (!tbody) return;

    tbody.innerHTML = "";

    const query = currentTableSearch.trim().toLowerCase();
    const filtered = currentLineItems.filter(item => {
        const matchType = currentFilterType === "ALL" || item.type === currentFilterType;
        const matchText = !query || 
            (item.name || "").toLowerCase().includes(query) || 
            (item.code || "").toLowerCase().includes(query);
        return matchType && matchText;
    });

    if (countBadge) {
        countBadge.textContent = `${currentLineItems.length} sản phẩm / dịch vụ`;
    }

    if (filtered.length === 0) {
        if (emptyState) emptyState.style.display = "block";
        return;
    } else {
        if (emptyState) emptyState.style.display = "none";
    }

    filtered.forEach((item, index) => {
        const row = document.createElement("tr");
        const isRecurring = item.type === "RECURRING";
        if (isRecurring) row.classList.add("row-subscription");

        // Tính toán các thông số của dòng này
        const calc = computeLineItem(item);

        // Kiểm tra xem đơn giá có dưới giá sàn (floor price) hay không
        const isBelowFloor = item.floorPrice && item.unitPrice < item.floorPrice;

        row.innerHTML = `
            <td class="col-num">${index + 1}</td>
            <td class="col-product">
                <div class="prod-name">${escapeHtml(item.name)}</div>
                <div class="prod-meta">
                    <span class="badge-tag ${isRecurring ? "recurring" : "onetime"}">
                        ${isRecurring ? "🔄 Thuê bao" : "📦 Một lần"}
                    </span>
                    <span style="font-family:monospace; color:var(--crm-muted);">${escapeHtml(item.code)}</span>
                    <span>• ĐVT: ${escapeHtml(item.unit || "Gói")}</span>
                </div>
            </td>
            <td class="col-subscription">
                ${isRecurring ? `
                    <div class="subscription-editor">
                        <div class="subscription-row">
                            <select class="term-cycle-select" data-line-id="${item.id}" data-field="billingCycle" title="Chu kỳ thanh toán">
                                <option value="MONTHLY" ${item.billingCycle === "MONTHLY" ? "selected" : ""}>Hàng tháng</option>
                                <option value="QUARTERLY" ${item.billingCycle === "QUARTERLY" ? "selected" : ""}>Hàng quý (3T)</option>
                                <option value="ANNUAL" ${item.billingCycle === "ANNUAL" ? "selected" : ""}>Hàng năm</option>
                            </select>
                            <input class="term-months-input" type="number" min="1" max="120" value="${item.termMonths || 12}" data-line-id="${item.id}" data-field="termMonths" title="Tổng số tháng hợp đồng">
                            <span style="font-size:11.5px; color:var(--crm-muted); font-weight:600;">tháng</span>
                        </div>
                        <div>
                            <span class="arr-calc-chip" title="Doanh thu hàng năm đóng góp từ dòng này">
                                ARR: ${formatMoney(calc.lineArr)}/năm
                            </span>
                        </div>
                    </div>
                ` : `
                    <div class="onetime-badge">1 lần (Cố định)</div>
                `}
            </td>
            <td class="col-qty">
                <div class="qty-stepper">
                    <button type="button" class="qty-btn" data-qty-action="dec" data-line-id="${item.id}">−</button>
                    <input type="number" class="qty-input" min="1" max="99999" value="${item.quantity}" data-line-id="${item.id}" data-field="quantity">
                    <button type="button" class="qty-btn" data-qty-action="inc" data-line-id="${item.id}">+</button>
                </div>
            </td>
            <td class="col-price">
                <div class="price-input-wrap">
                    <input type="number" class="price-input ${isBelowFloor ? "below-floor" : ""}" 
                           min="0" step="1000" value="${item.unitPrice}" data-line-id="${item.id}" data-field="unitPrice">
                    ${isBelowFloor ? `
                        <div class="floor-price-hint" title="Cần cấp quản lý duyệt nếu dưới giá sàn">
                            ⚠️ Dưới giá sàn (${formatMoney(item.floorPrice)})
                        </div>
                    ` : ""}
                </div>
            </td>
            <td class="col-discount">
                <div class="discount-input-wrap">
                    <input type="number" class="discount-input" min="0" max="100" step="1" 
                           value="${item.discountPercent || 0}" data-line-id="${item.id}" data-field="discountPercent">
                    <span style="font-size:12px; margin-left:3px; color:var(--crm-muted); font-weight:600;">%</span>
                </div>
            </td>
            <td class="col-arr">
                ${isRecurring ? formatMoney(calc.lineArr) : "—"}
            </td>
            <td class="col-total">
                ${formatMoney(calc.lineTotal)}
            </td>
            <td class="col-actions">
                <div class="action-btn-group">
                    <button type="button" class="btn-icon-cell" title="Nhân bản dòng này" data-duplicate-line="${item.id}">📋</button>
                    <button type="button" class="btn-icon-cell delete" title="Xóa dòng sản phẩm" data-delete-line="${item.id}">🗑</button>
                </div>
            </td>
        `;

        tbody.appendChild(row);
    });
}

/**
 * Thuật toán tính toán chi tiết một dòng sản phẩm theo SCRUM-195:
 * - One-time: Quantity * UnitPrice * (1 - Discount/100)
 * - Subscription (Recurring):
 *   + Chu kỳ (Cycle Months): MONTHLY=1, QUARTERLY=3, ANNUAL=12
 *   + Số kỳ hợp đồng = TermMonths / CycleMonths
 *   + Đơn giá chu kỳ = UnitPrice * (1 - Discount/100)
 *   + Doanh thu tháng MRR = (Đơn giá chu kỳ / CycleMonths) * Quantity
 *   + Doanh thu năm ARR = MRR * 12
 *   + Thành tiền toàn hợp đồng TCV = Quantity * Đơn giá chu kỳ * Số kỳ hợp đồng
 */
function computeLineItem(item) {
    const qty = Math.max(1, Number(item.quantity) || 1);
    const price = Math.max(0, Number(item.unitPrice) || 0);
    const discount = Math.min(100, Math.max(0, Number(item.discountPercent) || 0));
    const discountedPrice = price * (1 - discount / 100);

    if (item.type === "RECURRING") {
        let cycleMonths = 1;
        if (item.billingCycle === "QUARTERLY") cycleMonths = 3;
        else if (item.billingCycle === "ANNUAL") cycleMonths = 12;

        const termMonths = Math.max(1, Number(item.termMonths) || 12);
        const numberOfCycles = termMonths / cycleMonths;

        // MRR & ARR
        const monthlyRate = (discountedPrice / cycleMonths) * qty;
        const lineArr = monthlyRate * 12;
        const lineTotal = discountedPrice * qty * numberOfCycles;
        const lineListTotal = price * qty * numberOfCycles;
        const discountAmount = lineListTotal - lineTotal;

        return {
            lineTotal,
            lineListTotal,
            discountAmount,
            lineArr,
            monthlyRate,
            isRecurring: true
        };
    } else {
        const lineTotal = discountedPrice * qty;
        const lineListTotal = price * qty;
        const discountAmount = lineListTotal - lineTotal;

        return {
            lineTotal,
            lineListTotal,
            discountAmount,
            lineArr: 0,
            monthlyRate: 0,
            isRecurring: false
        };
    }
}

/**
 * Tự động tính toán lại toàn bộ Tổng giá trị cơ hội và các chỉ số tài chính thời gian thực
 */
function recalculateAllTotals() {
    let subtotalList = 0;
    let totalDiscount = 0;
    let totalNet = 0;
    let totalArr = 0;
    let totalMrr = 0;
    let totalOneOff = 0;

    currentLineItems.forEach(item => {
        const c = computeLineItem(item);
        subtotalList += c.lineListTotal;
        totalDiscount += c.discountAmount;
        totalNet += c.lineTotal;
        totalArr += c.lineArr;
        totalMrr += c.monthlyRate;
        if (!c.isRecurring) {
            totalOneOff += c.lineTotal;
        }
    });

    const vatPercent = Number(document.getElementById("dealVatSelect")?.value || 10);
    const vatAmount = totalNet * (vatPercent / 100);
    const grandTotal = totalNet + vatAmount;

    // Cập nhật giá trị vào Opportunity đang làm việc
    if (currentDeal) {
        currentDeal.amount = totalNet; // Lưu giá trị hợp đồng trước thuế (hoặc sau thuế tùy cấu hình)
    }

    // Cập nhật lên KPI Ribbon
    const kpiTcvEl = document.getElementById("kpiTotalDealValue");
    const kpiArrEl = document.getElementById("kpiTotalArr");
    const kpiMrrEl = document.getElementById("kpiTotalMrr");
    const kpiOneOffEl = document.getElementById("kpiTotalOneOff");
    const kpiItemsCountEl = document.getElementById("kpiItemsCount");

    if (kpiTcvEl) kpiTcvEl.textContent = formatMoney(totalNet);
    if (kpiArrEl) kpiArrEl.textContent = `${formatMoney(totalArr)}/năm`;
    if (kpiMrrEl) kpiMrrEl.textContent = `${formatMoney(totalMrr)}/tháng`;
    if (kpiOneOffEl) kpiOneOffEl.textContent = formatMoney(totalOneOff);
    if (kpiItemsCountEl) kpiItemsCountEl.textContent = `${currentLineItems.length} sản phẩm`;

    // Cập nhật lên Financial Summary Card
    const sumListSubtotalEl = document.getElementById("summaryListSubtotal");
    const sumDiscountEl = document.getElementById("summaryTotalDiscount");
    const sumNetEl = document.getElementById("summaryNetAmount");
    const sumArrEl = document.getElementById("summaryArrAmount");
    const sumVatEl = document.getElementById("summaryVatAmount");
    const sumGrandTotalEl = document.getElementById("summaryGrandTotal");
    const sumWordsEl = document.getElementById("summaryAmountInWords");

    if (sumListSubtotalEl) sumListSubtotalEl.textContent = formatMoney(subtotalList);
    if (sumDiscountEl) sumDiscountEl.textContent = `-${formatMoney(totalDiscount)}`;
    if (sumNetEl) sumNetEl.textContent = formatMoney(totalNet);
    if (sumArrEl) sumArrEl.textContent = `${formatMoney(totalArr)}/năm`;
    if (sumVatEl) sumVatEl.textContent = formatMoney(vatAmount);
    if (sumGrandTotalEl) sumGrandTotalEl.textContent = formatMoney(grandTotal);
    if (sumWordsEl) sumWordsEl.textContent = `Bằng chữ: ${readVietnameseCurrency(grandTotal)}`;
}

/* =========================================================
   7. EVENT LISTENERS & IN-LINE EDITING
========================================================= */

function bindEventListeners() {
    // 1. In-line table inputs
    const tbody = document.getElementById("lineItemsTableBody");
    if (tbody) {
        tbody.addEventListener("input", handleTableInput);
        tbody.addEventListener("change", handleTableInput);
        tbody.addEventListener("click", handleTableClick);
    }

    // 2. Table search & filter pills
    const searchInput = document.getElementById("dealTableSearch");
    if (searchInput) {
        searchInput.addEventListener("input", (e) => {
            currentTableSearch = e.target.value;
            renderLineItemsTable();
        });
    }

    document.querySelectorAll(".filter-pill").forEach(pill => {
        pill.addEventListener("click", () => {
            document.querySelectorAll(".filter-pill").forEach(p => p.classList.remove("active"));
            pill.classList.add("active");
            currentFilterType = pill.dataset.filter;
            renderLineItemsTable();
        });
    });

    // 3. VAT Select
    const vatSelect = document.getElementById("dealVatSelect");
    if (vatSelect) {
        vatSelect.addEventListener("change", () => {
            recalculateAllTotals();
        });
    }

    // 4. Switcher Cơ hội
    const dealSelect = document.getElementById("dealSwitcherSelect");
    if (dealSelect) {
        dealSelect.addEventListener("change", (e) => {
            const id = Number(e.target.value);
            const found = allDeals.find(d => d.id === id);
            if (found) {
                // Auto save current deal first
                saveCurrentDealData(false);
                setWorkingDeal(found);
                renderDealInfo();
                renderPipelineStepper();
                renderLineItemsTable();
                recalculateAllTotals();
                showToast(`Đã chuyển sang cơ hội: ${found.name}`, "info");
            }
        });
    }

    // 5. Nút Lưu thay đổi
    document.getElementById("btnSaveDealProducts")?.addEventListener("click", () => {
        saveCurrentDealData(true);
    });

    // 6. Nút Tạo Báo giá
    document.getElementById("btnCreateQuoteFromDeal")?.addEventListener("click", () => {
        saveCurrentDealData(false);
        showToast("Đang chuyển sang màn hình Báo giá...", "success");
        setTimeout(() => {
            window.location.href = `quote-editor.html?oppId=${currentDeal.id}`;
        }, 600);
    });

    // 7. Modal Thêm sản phẩm từ Bảng giá
    const modal = document.getElementById("catalogModalOverlay");
    const btnOpenCatalog = document.getElementById("btnOpenCatalogModal");
    const btnCloseCatalog = document.getElementById("btnCloseCatalogModal");
    const btnAddCatalogSelected = document.getElementById("btnAddCatalogSelected");

    btnOpenCatalog?.addEventListener("click", () => {
        openCatalogModal();
    });

    btnCloseCatalog?.addEventListener("click", () => {
        closeCatalogModal();
    });

    modal?.addEventListener("click", (e) => {
        if (e.target === modal) closeCatalogModal();
    });

    btnAddCatalogSelected?.addEventListener("click", () => {
        addSelectedCatalogProductsToDeal();
    });

    // Catalog search & category filter inside modal
    document.getElementById("catalogSearchInput")?.addEventListener("input", renderCatalogModalList);
    document.querySelectorAll(".cat-chip").forEach(chip => {
        chip.addEventListener("click", () => {
            document.querySelectorAll(".cat-chip").forEach(c => c.classList.remove("active"));
            chip.classList.add("active");
            catalogCategoryFilter = chip.dataset.cat;
            renderCatalogModalList();
        });
    });

    // 8. Nút Thêm dòng tùy chỉnh
    document.getElementById("btnAddCustomLine")?.addEventListener("click", () => {
        addCustomLineItem();
    });
}

function handleTableInput(e) {
    const target = e.target;
    const lineId = Number(target.dataset.lineId);
    const field = target.dataset.field;
    if (!lineId || !field) return;

    const item = currentLineItems.find(i => i.id === lineId);
    if (!item) return;

    let val = target.value;
    if (field === "quantity") {
        item.quantity = Math.max(1, Number(val) || 1);
    } else if (field === "unitPrice") {
        item.unitPrice = Math.max(0, Number(val) || 0);
    } else if (field === "discountPercent") {
        item.discountPercent = Math.min(100, Math.max(0, Number(val) || 0));
    } else if (field === "termMonths") {
        item.termMonths = Math.max(1, Number(val) || 12);
    } else if (field === "billingCycle") {
        item.billingCycle = val;
    }

    // Recalculate row display
    const row = target.closest("tr");
    if (row) {
        const calc = computeLineItem(item);
        const colTotal = row.querySelector(".col-total");
        const colArr = row.querySelector(".col-arr");
        const chipArr = row.querySelector(".arr-calc-chip");
        const priceInput = row.querySelector(".price-input");
        const isBelowFloor = item.floorPrice && item.unitPrice < item.floorPrice;

        if (colTotal) colTotal.textContent = formatMoney(calc.lineTotal);
        if (colArr) colArr.textContent = item.type === "RECURRING" ? formatMoney(calc.lineArr) : "—";
        if (chipArr) chipArr.textContent = `ARR: ${formatMoney(calc.lineArr)}/năm`;

        if (priceInput) {
            priceInput.classList.toggle("below-floor", isBelowFloor);
            const hint = row.querySelector(".floor-price-hint");
            if (isBelowFloor && !hint) {
                const hintDiv = document.createElement("div");
                hintDiv.className = "floor-price-hint";
                hintDiv.title = "Cần cấp quản lý duyệt nếu dưới giá sàn";
                hintDiv.innerHTML = `⚠️ Dưới giá sàn (${formatMoney(item.floorPrice)})`;
                priceInput.parentElement.appendChild(hintDiv);
            } else if (!isBelowFloor && hint) {
                hint.remove();
            }
        }
    }

    recalculateAllTotals();
}

function handleTableClick(e) {
    const qtyBtn = e.target.closest("[data-qty-action]");
    if (qtyBtn) {
        const lineId = Number(qtyBtn.dataset.lineId);
        const action = qtyBtn.dataset.qtyAction;
        const item = currentLineItems.find(i => i.id === lineId);
        if (item) {
            if (action === "inc") item.quantity += 1;
            else if (action === "dec" && item.quantity > 1) item.quantity -= 1;
            renderLineItemsTable();
            recalculateAllTotals();
        }
        return;
    }

    const dupBtn = e.target.closest("[data-duplicate-line]");
    if (dupBtn) {
        const lineId = Number(dupBtn.dataset.duplicateLine);
        duplicateLineItem(lineId);
        return;
    }

    const delBtn = e.target.closest("[data-delete-line]");
    if (delBtn) {
        const lineId = Number(delBtn.dataset.deleteLine);
        deleteLineItem(lineId);
        return;
    }
}

function duplicateLineItem(lineId) {
    const source = currentLineItems.find(i => i.id === lineId);
    if (!source) return;
    const copy = JSON.parse(JSON.stringify(source));
    copy.id = Date.now() + Math.floor(Math.random() * 1000);
    copy.name = `${source.name} (Bản sao)`;
    currentLineItems.push(copy);
    renderLineItemsTable();
    recalculateAllTotals();
    showToast("Đã nhân bản dòng sản phẩm thành công", "info");
}

function deleteLineItem(lineId) {
    const index = currentLineItems.findIndex(i => i.id === lineId);
    if (index < 0) return;
    const item = currentLineItems[index];
    if (confirm(`Bạn có chắc muốn xóa "${item.name}" khỏi cơ hội này?`)) {
        currentLineItems.splice(index, 1);
        renderLineItemsTable();
        recalculateAllTotals();
        showToast("Đã xóa dòng sản phẩm", "warning");
    }
}

function addCustomLineItem() {
    const customItem = {
        id: Date.now(),
        productId: null,
        code: `CUST-${Math.floor(1000 + Math.random() * 9000)}`,
        name: "Dịch vụ / Sản phẩm tùy chỉnh",
        type: "ONE_TIME",
        unit: "Gói",
        billingCycle: "ONCE",
        termMonths: 1,
        quantity: 1,
        unitPrice: 10000000,
        discountPercent: 0,
        floorPrice: 5000000
    };
    currentLineItems.push(customItem);
    renderLineItemsTable();
    recalculateAllTotals();
    showToast("Đã thêm dòng tùy chỉnh mới vào bảng", "success");
}

/* =========================================================
   8. CATALOG SELECTION MODAL LOGIC
========================================================= */

function openCatalogModal() {
    selectedCatalogProductIds.clear();
    const modal = document.getElementById("catalogModalOverlay");
    if (!modal) return;
    modal.classList.add("open");
    renderCatalogModalList();
}

function closeCatalogModal() {
    const modal = document.getElementById("catalogModalOverlay");
    if (modal) modal.classList.remove("open");
}

function renderCatalogModalList() {
    const container = document.getElementById("catalogGrid");
    const countEl = document.getElementById("catalogSelectedCount");
    const searchInput = document.getElementById("catalogSearchInput");
    if (!container) return;

    container.innerHTML = "";
    const query = (searchInput?.value || "").trim().toLowerCase();

    // Lấy multiplier của Bảng giá đang kích hoạt
    const activePb = PRICE_BOOKS.find(pb => pb.id === (currentDeal?.priceBookId || "PB-STD-2026")) || PRICE_BOOKS[0];

    const filtered = PRODUCT_CATALOG.filter(prod => {
        const matchCat = catalogCategoryFilter === "all" || prod.category === catalogCategoryFilter;
        const matchQuery = !query || 
            prod.name.toLowerCase().includes(query) || 
            prod.code.toLowerCase().includes(query);
        return matchCat && matchQuery;
    });

    if (countEl) {
        countEl.textContent = `Đã chọn: ${selectedCatalogProductIds.size} sản phẩm`;
    }

    filtered.forEach(prod => {
        const isSelected = selectedCatalogProductIds.has(prod.id);
        const listPrice = Math.round(prod.baseListPrice * activePb.multiplier);
        const isRecurring = prod.type === "RECURRING";

        const card = document.createElement("div");
        card.className = `catalog-item-card ${isSelected ? "selected" : ""}`;
        card.innerHTML = `
            <div class="catalog-item-left">
                <input type="checkbox" class="catalog-checkbox" ${isSelected ? "checked" : ""} data-prod-id="${prod.id}">
                <div class="catalog-item-info">
                    <strong>${escapeHtml(prod.name)}</strong>
                    <span>
                        <span class="badge-tag ${isRecurring ? "recurring" : "onetime"}">
                            ${isRecurring ? "🔄 Thuê bao" : "📦 Một lần"}
                        </span>
                        ${escapeHtml(prod.code)} • ${escapeHtml(prod.categoryName)} • ĐVT: ${escapeHtml(prod.unit)}
                    </span>
                </div>
            </div>
            <div class="catalog-item-price">
                <div class="catalog-list-price">${formatMoney(listPrice)}</div>
                <div class="catalog-floor-price">Giá sàn: ${formatMoney(prod.floorPrice)}</div>
            </div>
        `;

        card.addEventListener("click", (e) => {
            if (e.target.tagName !== "INPUT") {
                const cb = card.querySelector(".catalog-checkbox");
                cb.checked = !cb.checked;
            }
            if (selectedCatalogProductIds.has(prod.id)) {
                selectedCatalogProductIds.delete(prod.id);
                card.classList.remove("selected");
            } else {
                selectedCatalogProductIds.add(prod.id);
                card.classList.add("selected");
            }
            if (countEl) countEl.textContent = `Đã chọn: ${selectedCatalogProductIds.size} sản phẩm`;
        });

        container.appendChild(card);
    });
}

function addSelectedCatalogProductsToDeal() {
    if (selectedCatalogProductIds.size === 0) {
        showToast("Vui lòng tích chọn ít nhất 1 sản phẩm", "warning");
        return;
    }

    const activePb = PRICE_BOOKS.find(pb => pb.id === (currentDeal?.priceBookId || "PB-STD-2026")) || PRICE_BOOKS[0];
    let addedCount = 0;

    selectedCatalogProductIds.forEach(prodId => {
        const prod = PRODUCT_CATALOG.find(p => p.id === prodId);
        if (!prod) return;

        // Tự động lấy đơn giá mặc định từ Bảng giá niêm yết (AC1)
        const unitPrice = Math.round(prod.baseListPrice * activePb.multiplier);

        const newLine = {
            id: Date.now() + Math.floor(Math.random() * 10000),
            productId: prod.id,
            code: prod.code,
            name: prod.name,
            type: prod.type,
            unit: prod.unit,
            billingCycle: prod.defaultCycle || "MONTHLY",
            termMonths: prod.defaultMonths || 12,
            quantity: 1,
            unitPrice: unitPrice,
            discountPercent: 0,
            floorPrice: prod.floorPrice
        };

        currentLineItems.push(newLine);
        addedCount++;
    });

    closeCatalogModal();
    renderLineItemsTable();
    recalculateAllTotals();
    showToast(`Đã thêm ${addedCount} sản phẩm từ Bảng giá vào Cơ hội!`, "success");
}

/* =========================================================
   9. PERSISTENCE & SYNC WITH PIPELINE / BACKEND
========================================================= */

async function saveCurrentDealData(showFeedback = true) {
    if (!currentDeal) return;

    // Lưu notes
    const notesEl = document.getElementById("dealNotesInput");
    if (notesEl) currentDeal.notes = notesEl.value;

    // 1. Lưu danh sách dòng sản phẩm của Deal vào localStorage
    const cacheKey = `crm_ui_deal_products_${currentDeal.id}`;
    localStorage.setItem(cacheKey, JSON.stringify(currentLineItems));

    // 2. Cập nhật giá trị Deal Value vào danh sách Opportunities để Kanban hiển thị ngay
    const dealIdx = allDeals.findIndex(d => d.id === currentDeal.id);
    if (dealIdx >= 0) {
        allDeals[dealIdx] = { ...currentDeal };
    }
    localStorage.setItem("crm_ui_opportunities", JSON.stringify(allDeals));

    // 3. Gọi API cập nhật lên backend nếu backend Java đang chạy
    try {
        await api(`/api/opportunities/${currentDeal.id}`, {
            method: "PUT",
            body: JSON.stringify({
                name: currentDeal.name,
                customerId: currentDeal.customerId,
                stageId: currentDeal.stageId,
                probability: currentDeal.probability,
                amount: currentDeal.amount,
                expectedCloseDate: currentDeal.expectedCloseDate
            })
        });
    } catch (_) {
        // Backend offline, fallback sang offline localStorage thành công
    }

    if (showFeedback) {
        showToast("Đã lưu sản phẩm và cập nhật Tổng giá trị Cơ hội thành công!", "success");
    }
}

/* =========================================================
   10. HELPER FUNCTIONS
========================================================= */

function formatMoney(val) {
    return new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
        maximumFractionDigits: 0
    }).format(Number(val) || 0);
}

function formatDate(dateStr) {
    if (!dateStr) return "—";
    try {
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return dateStr;
        return d.toLocaleDateString("vi-VN", { year: "numeric", month: "2-digit", day: "2-digit" });
    } catch (_) {
        return dateStr;
    }
}

function escapeHtml(val) {
    return String(val ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function showToast(message, type = "info") {
    let container = document.getElementById("toastContainer");
    if (!container) {
        container = document.createElement("div");
        container.id = "toastContainer";
        container.className = "crm-toast-container";
        document.body.appendChild(container);
    }

    const toast = document.createElement("div");
    toast.className = `crm-toast ${type}`;
    const icon = type === "success" ? "✓" : type === "warning" ? "⚠️" : type === "error" ? "✕" : "ℹ";
    toast.innerHTML = `<span>${icon}</span> <span>${escapeHtml(message)}</span>`;

    container.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = "0";
        toast.style.transform = "translateY(16px)";
        setTimeout(() => toast.remove(), 250);
    }, 3200);
}

/**
 * Đọc số tiền ra chữ tiếng Việt phục vụ hợp đồng & báo giá có căn cứ
 */
function readVietnameseCurrency(num) {
    num = Math.round(Number(num) || 0);
    if (num === 0) return "Không đồng";

    const digits = ["không", "một", "hai", "ba", "bốn", "năm", "sáu", "bảy", "tám", "chín"];
    const units = ["", "nghìn", "triệu", "tỷ", "nghìn tỷ", "triệu tỷ"];

    function readThreeDigits(n, full) {
        let h = Math.floor(n / 100);
        let t = Math.floor((n % 100) / 10);
        let u = n % 10;
        let res = "";

        if (h > 0 || full) {
            res += digits[h] + " trăm ";
        }
        if (t > 1) {
            res += digits[t] + " mươi ";
            if (u === 1) res += "mốt ";
            else if (u === 5) res += "lăm ";
            else if (u > 0) res += digits[u] + " ";
        } else if (t === 1) {
            res += "mười ";
            if (u === 5) res += "lăm ";
            else if (u > 0) res += digits[u] + " ";
        } else if (t === 0 && u > 0) {
            if (h > 0 || full) res += "lẻ ";
            res += digits[u] + " ";
        }
        return res;
    }

    let groups = [];
    let temp = num;
    while (temp > 0) {
        groups.push(temp % 1000);
        temp = Math.floor(temp / 1000);
    }

    let result = "";
    for (let i = groups.length - 1; i >= 0; i--) {
        if (groups[i] > 0) {
            result += readThreeDigits(groups[i], i < groups.length - 1) + units[i] + " ";
        }
    }

    result = result.trim() + " đồng";
    return result.charAt(0).toUpperCase() + result.slice(1);
}

async function api(path, options = {}) {
    const config = {
        credentials: "include",
        headers: {
            "Accept": "application/json",
            ...(options.body ? { "Content-Type": "application/json" } : {}),
            ...(options.headers || {})
        },
        ...options
    };

    const res = await fetch(API_BASE + path, config);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return data;
}
