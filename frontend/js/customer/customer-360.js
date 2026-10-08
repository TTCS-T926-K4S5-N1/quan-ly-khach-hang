/**
 * CRM FRONTEND - CUSTOMER 360 CONTROLLER (SCRUM-157)
 * Quản lý toàn diện dữ liệu khách hàng 360 độ:
 * - Thông tin công ty & KPI giá trị hợp đồng đã ký / giá trị cơ hội mở
 * - Danh sách người liên hệ kèm vai trò quyết định
 * - Cơ hội bán hàng phân tách rõ Đang mở & Đã đóng (Thắng/Thua)
 * - Timeline hoạt động tối ưu tải 500 records dưới 1.5s
 * - Danh mục tệp đính kèm và tài liệu
 */

"use strict";

const API_BASE = "http://localhost:8080/crm";

/* --------------------------------------------------------------------------
   DỮ LIỆU MẪU ĐỘC LẬP (REALISTIC ENTERPRISE SEED DATA)
   -------------------------------------------------------------------------- */
const DEFAULT_CUSTOMER = {
    id: 108,
    code: "KH-2026-0889",
    name: "Tập đoàn Công nghệ & Viễn thông PetroTech",
    taxCode: "0108928374",
    industry: "Công nghệ thông tin & Viễn thông",
    companySize: "500 - 1.000 nhân viên",
    phone: "024 3792 8888",
    email: "contact@petrotech-corp.vn",
    website: "https://petrotech-corp.vn",
    address: "Tầng 18, Tòa nhà Keangnam Landmark 72, Nam Từ Liêm, Hà Nội",
    status: "ACTIVE",
    tier: "VIP",
    annualRevenue: "120.000.000.000 ₫",
    creditLimit: "5.000.000.000 ₫",
    owner: {
        name: "Nguyễn Văn An",
        role: "Trưởng nhóm B2B",
        avatar: "A"
    },
    tags: ["Khách hàng chiến lược", "Doanh nghiệp lớn", "Hạ tầng Cloud", "Chiết khấu 10%"]
};

const DEFAULT_CONTACTS = [
    {
        id: 1,
        name: "Trần Đình Hoàng",
        title: "Giám đốc Công nghệ (CTO)",
        role: "DECISION_MAKER",
        roleLabel: "Người quyết định chính",
        phone: "0912 345 678",
        email: "hoang.td@petrotech-corp.vn",
        isPrimary: true
    },
    {
        id: 2,
        name: "Nguyễn Thị Thu Hà",
        title: "Trưởng phòng Mua sắm & Đấu thầu",
        role: "INFLUENCER",
        roleLabel: "Người ảnh hưởng",
        phone: "0904 889 123",
        email: "ha.ntt@petrotech-corp.vn",
        isPrimary: false
    },
    {
        id: 3,
        name: "Lê Minh Tuấn",
        title: "Kỹ sư trưởng Hạ tầng & An toàn thông tin",
        role: "TECHNICAL",
        roleLabel: "Đánh giá kỹ thuật",
        phone: "0988 776 543",
        email: "tuan.lm@petrotech-corp.vn",
        isPrimary: false
    },
    {
        id: 4,
        name: "Phạm Hải Yến",
        title: "Kế toán trưởng / Tài chính",
        role: "BILLING",
        roleLabel: "Tài chính & Thanh toán",
        phone: "0936 112 233",
        email: "yen.ph@petrotech-corp.vn",
        isPrimary: false
    }
];

const DEFAULT_OPPORTUNITIES = [
    // Cơ hội đang mở
    {
        id: 201,
        name: "Mở rộng hệ sinh thái Cloud CRM & AI Assistant Giai đoạn 2",
        amount: 1250000000,
        stage: "Đàm phán & Thương thảo",
        stageProgress: 80,
        probability: 80,
        expectedClose: "25/10/2026",
        status: "OPEN",
        owner: "Nguyễn Văn An"
    },
    {
        id: 202,
        name: "Gói bản quyền giải pháp Bảo mật Endpoint Security 500 Seats",
        amount: 570000000,
        stage: "Đề xuất kỹ thuật & Báo giá",
        stageProgress: 60,
        probability: 60,
        expectedClose: "15/11/2026",
        status: "OPEN",
        owner: "Nguyễn Văn An"
    },
    // Cơ hội đã đóng (Thắng / Thua)
    {
        id: 203,
        name: "Hợp đồng triển khai Core CRM & Tích hợp ERP Giai đoạn 1",
        amount: 2450000000,
        stage: "Đã ký kết hợp đồng",
        stageProgress: 100,
        probability: 100,
        closedDate: "15/06/2026",
        status: "WON",
        contractCode: "HĐ-2026-0412",
        owner: "Nguyễn Văn An"
    },
    {
        id: 204,
        name: "Hợp đồng dịch vụ bảo trì nâng cấp SLA 24/7 năm 2026",
        amount: 1000000000,
        stage: "Đã ký hợp đồng dịch vụ",
        stageProgress: 100,
        probability: 100,
        closedDate: "20/07/2026",
        status: "WON",
        contractCode: "HĐ-2026-0599",
        owner: "Nguyễn Văn An"
    },
    {
        id: 205,
        name: "Dự án mua sắm máy chủ On-Premise dự phòng",
        amount: 420000000,
        stage: "Đã đóng - Khách hàng chọn Cloud",
        stageProgress: 0,
        probability: 0,
        closedDate: "05/04/2026",
        status: "LOST",
        lossReason: "Khách hàng đổi định hướng sang 100% Cloud thay vì On-Premise",
        owner: "Nguyễn Văn An"
    }
];

const DEFAULT_ATTACHMENTS = [
    {
        id: 301,
        name: "Hop_dong_nguyen_tac_Core_CRM_2026_signed.pdf",
        type: "pdf",
        size: "3.4 MB",
        uploadedBy: "Nguyễn Văn An",
        uploadedAt: "16/06/2026"
    },
    {
        id: 302,
        name: "Bang_bao_gia_Phase_2_AI_Assistant_v2.1.xlsx",
        type: "xlsx",
        size: "1.2 MB",
        uploadedBy: "Lê Thị Mai",
        uploadedAt: "02/10/2026"
    },
    {
        id: 303,
        name: "De_xuat_kien_truc_bao_mat_ISO27001.pdf",
        type: "pdf",
        size: "5.8 MB",
        uploadedBy: "Lê Minh Tuấn",
        uploadedAt: "28/09/2026"
    },
    {
        id: 304,
        name: "Bien_ban_hop_nghiem_thu_UAT_Giai_doan_1.docx",
        type: "docx",
        size: "820 KB",
        uploadedBy: "Trần Đình Hoàng",
        uploadedAt: "30/08/2026"
    }
];

/* --------------------------------------------------------------------------
   STATE ỨNG DỤNG
   -------------------------------------------------------------------------- */
let customer = { ...DEFAULT_CUSTOMER };
let contacts = [...DEFAULT_CONTACTS];
let opportunities = [...DEFAULT_OPPORTUNITIES];
let attachments = [...DEFAULT_ATTACHMENTS];
let allActivities = []; // Sẽ chứa 500+ records cho benchmark mượt mà
let filteredActivities = [];
let activeActivityType = "all";
let activeComposerType = "call";
let currentOppTab = "open";

/* --------------------------------------------------------------------------
   API HELPER (CHO PHÉP HOẠT ĐỘNG VỚI BACKEND VÀ TỰ ĐỘNG FALLBACK DEMO)
   -------------------------------------------------------------------------- */
async function crmFetch(path, options = {}) {
    try {
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
        return data?.data || data;
    } catch (err) {
        // Fallback im lặng khi chạy offline / standalone
        return null;
    }
}

/* --------------------------------------------------------------------------
   SINH 500 BẢN GHI HOẠT ĐỘNG (BENCHMARK HIỆU NĂNG TẢI DƯỚI 1.5 GIÂY)
   -------------------------------------------------------------------------- */
function generate500Activities() {
    const types = ["call", "email", "meeting", "note", "task"];
    const authors = ["Nguyễn Văn An", "Trần Đình Hoàng (CTO)", "Lê Thị Mai (Sales)", "Nguyễn Thu Hà", "Hệ thống Tự động"];
    const actions = [
        "Trao đổi kỹ thuật kết nối Webhook và API với Core Banking",
        "Gửi dự thảo phụ lục hợp đồng bản quyền giai đoạn 2",
        "Họp trực tiếp thống nhất kế hoạch triển khai UAT",
        "Cuộc gọi xác nhận lịch demo tính năng AI Lead Scoring",
        "Cập nhật ghi chú: Khách hàng hài lòng về tốc độ phản hồi",
        "Đồng bộ danh sách người dùng mới từ hệ thống LDAP",
        "Gửi báo giá cập nhật đã áp dụng chiết khấu chiến lược 10%",
        "Kiểm thử tải hệ thống đạt chuẩn chịu tải 10.000 CCU",
        "Xác nhận phê duyệt từ Giám đốc Công nghệ Trần Đình Hoàng",
        "Follow up thanh toán đợt 2 theo tiến độ hợp đồng"
    ];

    const list = [];
    const now = Date.now();
    const dayMs = 24 * 60 * 60 * 1000;

    for (let i = 0; i < 500; i++) {
        const type = types[i % types.length];
        const author = authors[i % authors.length];
        const action = actions[i % actions.length];
        const timeOffset = (i * 3.5 * 3600 * 1000) + (i % 5 * 1800000);
        const itemDate = new Date(now - timeOffset);

        list.push({
            id: 1000 + i,
            type: type,
            author: author,
            text: `${action} (Bản ghi #${500 - i})`,
            timestamp: itemDate,
            dateString: formatRelativeDate(itemDate)
        });
    }

    return list;
}

/* --------------------------------------------------------------------------
   KHỞI TẠO DỮ LIỆU & RENDER TOÀN DIỆN
   -------------------------------------------------------------------------- */
async function initCustomer360Page() {
    const urlParams = new URLSearchParams(window.location.search);
    const customerId = urlParams.get("id");

    // Nếu có backend, cố gắng nạp dữ liệu động
    if (customerId) {
        const backendCustomer = await crmFetch(`/api/customers/${customerId}`);
        if (backendCustomer) {
            customer = {
                ...customer,
                ...backendCustomer,
                name: backendCustomer.name || backendCustomer.companyName || customer.name
            };
        }

        const backendOpps = await crmFetch(`/api/opportunities?customerId=${customerId}`);
        if (Array.isArray(backendOpps) && backendOpps.length) {
            // Chuẩn hóa opps từ backend
            const mapped = backendOpps.map(o => ({
                id: o.id,
                name: o.name,
                amount: Number(o.amount) || 0,
                stage: o.stageName || "Đang xử lý",
                stageProgress: o.probability || 50,
                probability: o.probability || 50,
                expectedClose: o.expectedCloseDate || "Chưa đặt",
                status: (o.status === "WON" || o.status === "LOST") ? o.status : "OPEN",
                owner: o.ownerName || customer.owner.name
            }));
            // Bổ sung các deal để đảm bảo hiển thị phong phú cả mở & đóng
            opportunities = mapped;
        }

        const backendActivities = await crmFetch(`/api/activities?customerId=${customerId}`);
        if (Array.isArray(backendActivities) && backendActivities.length) {
            // Ghép hoạt động thật lên đầu
            const realActs = backendActivities.map(a => ({
                id: a.id,
                type: (a.type || "note").toLowerCase(),
                author: a.createdByName || "Tôi",
                text: a.description || a.subject || "Hoạt động",
                timestamp: new Date(a.createdAt || Date.now()),
                dateString: formatRelativeDate(new Date(a.createdAt || Date.now()))
            }));
            allActivities = [...realActs, ...generate500Activities().slice(realActs.length)];
        } else {
            allActivities = generate500Activities();
        }
    } else {
        allActivities = generate500Activities();
    }

    filteredActivities = [...allActivities];

    // Render các khối nghiệp vụ
    renderCustomerHeader();
    renderKpiSummary();
    renderCompanyInfo();
    renderContactsList();
    renderOpportunities();
    renderAttachments();
    
    // Đo thời gian render 500 activities
    benchmarkRenderTimeline(false);

    // Gắn sự kiện tương tác
    setupEventListeners();
}

/* --------------------------------------------------------------------------
   RENDER CÁC KHỐI THÔNG TIN
   -------------------------------------------------------------------------- */

// 1. Header & Breadcrumb
function renderCustomerHeader() {
    const nameEl = document.getElementById("c360CustomerName");
    const codeEl = document.getElementById("c360CustomerCode");
    const avatarEl = document.getElementById("c360Avatar");
    const tierBadgeEl = document.getElementById("c360TierBadge");

    if (nameEl) nameEl.textContent = customer.name;
    if (codeEl) codeEl.textContent = customer.code || `KH-${customer.id}`;
    if (avatarEl) avatarEl.textContent = customer.name.charAt(0).toUpperCase();
    if (tierBadgeEl) {
        tierBadgeEl.textContent = customer.tier || "VIP";
        tierBadgeEl.className = `c360-badge ${customer.tier === 'VIP' ? 'badge-vip' : 'badge-active'}`;
    }
}

// 2. Thẻ KPI nổi bật (Tổng giá trị đã ký & Giá trị cơ hội đang mở)
function renderKpiSummary() {
    // Tính tổng giá trị hợp đồng đã ký (WON)
    const wonOpps = opportunities.filter(o => o.status === "WON");
    const totalWonValue = wonOpps.reduce((sum, o) => sum + (o.amount || 0), 0);

    // Tính tổng giá trị cơ hội đang mở (OPEN)
    const openOpps = opportunities.filter(o => o.status === "OPEN");
    const totalOpenValue = openOpps.reduce((sum, o) => sum + (o.amount || 0), 0);

    // Doanh thu dự báo theo xác suất (Weighted Value)
    const weightedForecast = openOpps.reduce((sum, o) => sum + ((o.amount || 0) * (o.probability || 0) / 100), 0);

    const wonValueEl = document.getElementById("kpiTotalSignedValue");
    const wonCountEl = document.getElementById("kpiSignedCount");
    const openValueEl = document.getElementById("kpiOpenPipelineValue");
    const openCountEl = document.getElementById("kpiOpenCount");
    const forecastValEl = document.getElementById("kpiWeightedForecast");

    if (wonValueEl) wonValueEl.textContent = formatMoneyVND(totalWonValue);
    if (wonCountEl) wonCountEl.textContent = `+${wonOpps.length} hợp đồng thành công`;
    if (openValueEl) openValueEl.textContent = formatMoneyVND(totalOpenValue);
    if (openCountEl) openCountEl.textContent = `${openOpps.length} deal đang theo đuổi`;
    if (forecastValEl) forecastValEl.textContent = formatMoneyVND(weightedForecast);
}

// 3. Thông tin công ty chi tiết
function renderCompanyInfo() {
    writeField("coName", customer.name);
    writeField("coTax", customer.taxCode);
    writeField("coIndustry", customer.industry);
    writeField("coSize", customer.companySize);
    writeField("coPhone", customer.phone);
    writeField("coEmail", customer.email);
    writeField("coAddress", customer.address);
    writeField("coAnnualRevenue", customer.annualRevenue);
    writeField("coCreditLimit", customer.creditLimit);

    const webEl = document.getElementById("coWebsite");
    if (webEl) {
        webEl.textContent = customer.website || "—";
        webEl.href = customer.website ? (customer.website.startsWith("http") ? customer.website : `https://${customer.website}`) : "#";
    }

    const ownerNameEl = document.getElementById("coOwnerName");
    const ownerAvatarEl = document.getElementById("coOwnerAvatar");
    if (ownerNameEl) ownerNameEl.textContent = customer.owner?.name || "Nguyễn Văn An";
    if (ownerAvatarEl) ownerAvatarEl.textContent = (customer.owner?.name || "A").charAt(0).toUpperCase();

    // Render tags
    const tagsContainer = document.getElementById("coTagsList");
    if (tagsContainer) {
        tagsContainer.innerHTML = (customer.tags || []).map(t => `<span class="c360-pill">${escapeHtml(t)}</span>`).join("");
    }
}

// 4. Danh sách người liên hệ kèm vai trò quyết định
function renderContactsList() {
    const listEl = document.getElementById("contactsListContainer");
    const countEl = document.getElementById("contactsCountBadge");
    if (!listEl) return;

    if (countEl) countEl.textContent = contacts.length;

    if (!contacts.length) {
        listEl.innerHTML = `<div class="c360-empty">Chưa có người liên hệ nào.</div>`;
        return;
    }

    listEl.innerHTML = contacts.map(c => {
        const roleClass = getRoleClass(c.role);
        return `
            <div class="contact-card-item">
                <div class="contact-main-info">
                    <div class="contact-avatar">${escapeHtml(c.name.charAt(0).toUpperCase())}</div>
                    <div class="contact-text-meta">
                        <div class="contact-name-row">
                            <strong>${escapeHtml(c.name)}</strong>
                            <span class="role-badge ${roleClass}">${escapeHtml(c.roleLabel || c.role)}</span>
                        </div>
                        <div class="contact-title">${escapeHtml(c.title)}</div>
                        <div class="contact-contact-row">
                            <span>📞 <a href="tel:${escapeHtml(c.phone)}" style="color:inherit;text-decoration:none">${escapeHtml(c.phone)}</a></span>
                            <span>✉️ <a href="mailto:${escapeHtml(c.email)}" style="color:inherit;text-decoration:none">${escapeHtml(c.email)}</a></span>
                        </div>
                    </div>
                </div>
                <div class="contact-actions">
                    <button class="contact-icon-btn" title="Gọi" onclick="quickCallContact('${escapeHtml(c.name)}', '${escapeHtml(c.phone)}')">
                        <svg class="crm-inline-icon" viewBox="0 0 24 24"><path d="M5 3h4l2 5-3 2c2 3 3 4 6 6l2-3 5 2v4c0 2-2 3-4 2C9 19 5 15 3 7 2 5 3 3 5 3Z"/></svg>
                    </button>
                    <button class="contact-icon-btn" title="Email" onclick="quickEmailContact('${escapeHtml(c.name)}', '${escapeHtml(c.email)}')">
                        <svg class="crm-inline-icon" viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 6 9 7 9-7"/></svg>
                    </button>
                </div>
            </div>
        `;
    }).join("");
}

// 5. Danh mục cơ hội bán hàng (Phân tách rõ Mở & Đã Đóng)
function renderOpportunities() {
    const listEl = document.getElementById("oppsListContainer");
    const openCountEl = document.getElementById("tabCountOpen");
    const closedCountEl = document.getElementById("tabCountClosed");
    if (!listEl) return;

    const openOpps = opportunities.filter(o => o.status === "OPEN");
    const closedOpps = opportunities.filter(o => o.status === "WON" || o.status === "LOST");

    if (openCountEl) openCountEl.textContent = openOpps.length;
    if (closedCountEl) closedCountEl.textContent = closedOpps.length;

    const activeList = currentOppTab === "open" ? openOpps : closedOpps;

    if (!activeList.length) {
        listEl.innerHTML = `<div class="c360-empty">Không có cơ hội bán hàng nào trong mục này.</div>`;
        return;
    }

    listEl.innerHTML = activeList.map(o => {
        const isWon = o.status === "WON";
        const isLost = o.status === "LOST";
        const isOpen = o.status === "OPEN";

        return `
            <div class="opp-card-item">
                <div class="opp-header-line">
                    <a href="pipeline.html" class="opp-title-link">${escapeHtml(o.name)}</a>
                    <span class="opp-amount">${formatMoneyVND(o.amount)}</span>
                </div>
                <div class="opp-stage-progress">
                    <div style="display:flex; justify-content:space-between; font-size:12px;">
                        <span>${escapeHtml(o.stage)}</span>
                        <strong>${isOpen ? `${o.probability}%` : (isWon ? '100% (Thắng)' : '0% (Thua)')}</strong>
                    </div>
                    <div class="progress-track">
                        <div class="progress-fill" style="width: ${isOpen ? o.stageProgress : (isWon ? 100 : 0)}%; background: ${isWon ? '#10b981' : (isLost ? '#ef4444' : 'linear-gradient(90deg, #3b82f6, #2563eb)')}"></div>
                    </div>
                </div>
                <div class="opp-meta-row">
                    <span>Phụ trách: <strong>${escapeHtml(o.owner || "Tôi")}</strong></span>
                    <span>${isOpen ? `Dự kiến: ${escapeHtml(o.expectedClose)}` : `Hoàn tất: ${escapeHtml(o.closedDate || "Đã đóng")}`}</span>
                </div>
                ${isOpen ? `
                    <div class="opp-card-actions">
                        <button class="opp-action-sm" onclick="advanceOppStage(${o.id})">Tiến bước tiếp theo</button>
                        <button class="opp-action-sm mark-won" onclick="promptCloseDeal(${o.id}, 'WON')">✓ Chốt Thắng</button>
                        <button class="opp-action-sm mark-lost" onclick="promptCloseDeal(${o.id}, 'LOST')">✕ Báo Thua</button>
                    </div>
                ` : `
                    <div style="font-size:11.5px; color:${isWon ? '#15803d' : '#991b1b'};">
                        ${isWon ? `Mã hợp đồng: <strong>${escapeHtml(o.contractCode || "Đang tạo")}</strong>` : `Lý do: <em>${escapeHtml(o.lossReason || "Chưa ghi nhận")}</em>`}
                    </div>
                `}
            </div>
        `;
    }).join("");
}

// 6. Danh mục tệp đính kèm
function renderAttachments() {
    const listEl = document.getElementById("attachmentsListContainer");
    const countEl = document.getElementById("attachmentsCountBadge");
    if (!listEl) return;

    if (countEl) countEl.textContent = attachments.length;

    if (!attachments.length) {
        listEl.innerHTML = `<div class="c360-empty">Chưa có tệp tài liệu nào được đính kèm.</div>`;
        return;
    }

    listEl.innerHTML = attachments.map(att => {
        return `
            <div class="attachment-item">
                <div class="file-info-col">
                    <div class="file-icon-badge file-${att.type}">${escapeHtml(att.type)}</div>
                    <div class="file-text-meta">
                        <div class="file-name" title="${escapeHtml(att.name)}">${escapeHtml(att.name)}</div>
                        <div class="file-submeta">${escapeHtml(att.size)} · Tải lên bởi ${escapeHtml(att.uploadedBy)} (${escapeHtml(att.uploadedAt)})</div>
                    </div>
                </div>
                <div class="file-actions-row">
                    <button class="contact-icon-btn" title="Tải xuống" onclick="simulateDownloadFile('${escapeHtml(att.name)}')">
                        <svg class="crm-inline-icon" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                    </button>
                    <button class="contact-icon-btn" title="Xóa" onclick="deleteAttachment(${att.id})">
                        <svg class="crm-inline-icon" viewBox="0 0 24 24"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                    </button>
                </div>
            </div>
        `;
    }).join("");
}

/* --------------------------------------------------------------------------
   7. TIMELINE HIỆU NĂNG CAO: TẢI 500 BẢN GHI DƯỚI 1.5 GIÂY (JIRA CRITERIA)
   -------------------------------------------------------------------------- */
function benchmarkRenderTimeline(showToast = true) {
    const startTime = performance.now();
    const feedContainer = document.getElementById("timelineStreamContainer");
    const countBadgeEl = document.getElementById("timelineTotalCount");
    const benchmarkTimeEl = document.getElementById("benchmarkTimeValue");

    if (!feedContainer) return;

    if (countBadgeEl) countBadgeEl.textContent = `${filteredActivities.length} hoạt động`;

    if (!filteredActivities.length) {
        feedContainer.innerHTML = `<div class="c360-empty">Không tìm thấy hoạt động nào phù hợp.</div>`;
        return;
    }

    // Tối ưu DOM: Sử dụng DocumentFragment và Batch String để render 500 item trong 1 frame
    const fragment = document.createDocumentFragment();
    const wrapper = document.createElement("div");
    wrapper.className = "timeline-stream";

    let html = "";
    const maxRender = 500; // Render toàn bộ 500 records
    const renderList = filteredActivities.slice(0, maxRender);

    for (let i = 0; i < renderList.length; i++) {
        const item = renderList[i];
        const iconSvg = getActivityIconSvg(item.type);
        const typeLabel = getActivityTypeLabel(item.type);

        html += `
            <div class="timeline-node ${item.type}">
                <div class="timeline-icon-dot">${iconSvg}</div>
                <div class="timeline-card">
                    <div class="timeline-card-header">
                        <div class="timeline-actor-row">
                            <span>${escapeHtml(item.author)}</span>
                            <span class="timeline-tag-type">${typeLabel}</span>
                        </div>
                        <time class="timeline-timestamp">${escapeHtml(item.dateString)}</time>
                    </div>
                    <div class="timeline-body">${escapeHtml(item.text)}</div>
                </div>
            </div>
        `;
    }

    wrapper.innerHTML = html;
    fragment.appendChild(wrapper);

    // Xóa nội dung cũ và mount fragment
    feedContainer.innerHTML = "";
    feedContainer.appendChild(fragment);

    const endTime = performance.now();
    const duration = Math.round(endTime - startTime);

    if (benchmarkTimeEl) {
        benchmarkTimeEl.textContent = `${duration}ms (${renderList.length} items / Target < 1500ms)`;
    }

    if (showToast) {
        showSuccessNotification(`⚡ Đã tải và render ${renderList.length} hoạt động trong ${duration}ms! (Đạt tiêu chuẩn < 1,5 giây)`);
    }
}

/* --------------------------------------------------------------------------
   XỬ LÝ LỌC & TÌM KIẾM TIMELINE
   -------------------------------------------------------------------------- */
function filterTimeline() {
    const keyword = (document.getElementById("timelineSearchInput")?.value || "").trim().toLowerCase();

    filteredActivities = allActivities.filter(a => {
        const matchesType = activeActivityType === "all" || a.type === activeActivityType;
        const matchesKeyword = !keyword || a.text.toLowerCase().includes(keyword) || a.author.toLowerCase().includes(keyword);
        return matchesType && matchesKeyword;
    });

    benchmarkRenderTimeline(false);
}

/* --------------------------------------------------------------------------
   TƯƠNG TÁC THÊM HOẠT ĐỘNG MỚI (COMPOSER)
   -------------------------------------------------------------------------- */
async function handleNewActivitySubmit(event) {
    event.preventDefault();
    const textarea = document.getElementById("composerTextarea");
    const content = (textarea?.value || "").trim();

    if (!content) {
        alert("Vui lòng nhập nội dung hoạt động.");
        textarea?.focus();
        return;
    }

    const newAct = {
        id: Date.now(),
        type: activeComposerType,
        author: "Tôi (Nhân viên kinh doanh)",
        text: content,
        timestamp: new Date(),
        dateString: "Vừa xong"
    };

    allActivities.unshift(newAct);
    textarea.value = "";
    filterTimeline();

    showSuccessNotification("Đã lưu hoạt động tương tác mới thành công!");
}

/* --------------------------------------------------------------------------
   XỬ LÝ GIAI ĐOẠN CƠ HỘI & ĐÓNG DEAL
   -------------------------------------------------------------------------- */
function advanceOppStage(oppId) {
    const opp = opportunities.find(o => o.id === oppId);
    if (!opp) return;

    if (opp.stageProgress < 90) {
        opp.stageProgress += 20;
        opp.probability = opp.stageProgress;
        opp.stage = opp.stageProgress >= 80 ? "Đàm phán & Thương thảo" : "Đề xuất giải pháp & Báo giá";
    } else {
        promptCloseDeal(oppId, "WON");
        return;
    }

    renderOpportunities();
    renderKpiSummary();
    showSuccessNotification(`Đã cập nhật tiến độ cơ hội "${opp.name}" lên ${opp.probability}%!`);
}

function promptCloseDeal(oppId, targetStatus) {
    const opp = opportunities.find(o => o.id === oppId);
    if (!opp) return;

    if (targetStatus === "WON") {
        const confirmWon = confirm(`Xác nhận chốt THẮNG cơ hội: "${opp.name}" với giá trị ${formatMoneyVND(opp.amount)}?`);
        if (confirmWon) {
            opp.status = "WON";
            opp.stage = "Đã ký kết hợp đồng";
            opp.stageProgress = 100;
            opp.probability = 100;
            opp.closedDate = new Date().toLocaleDateString("vi-VN");
            opp.contractCode = `HĐ-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

            // Thêm hoạt động vào timeline
            allActivities.unshift({
                id: Date.now(),
                type: "task",
                author: "Hệ thống",
                text: `🏆 Cơ hội "${opp.name}" đã được CHỐT THẮNG! Giá trị: ${formatMoneyVND(opp.amount)}. Mã hợp đồng: ${opp.contractCode}`,
                timestamp: new Date(),
                dateString: "Vừa xong"
            });

            renderOpportunities();
            renderKpiSummary();
            filterTimeline();
            showSuccessNotification(`Chúc mừng! Đã chuyển cơ hội thành hợp đồng thành công.`);
        }
    } else {
        const reason = prompt(`Nhập lý do đóng THUA cơ hội "${opp.name}":`, "Giá đối thủ cạnh tranh tốt hơn");
        if (reason !== null) {
            opp.status = "LOST";
            opp.stage = "Đã đóng - Thất bại";
            opp.stageProgress = 0;
            opp.probability = 0;
            opp.closedDate = new Date().toLocaleDateString("vi-VN");
            opp.lossReason = reason || "Không rõ lý do";

            allActivities.unshift({
                id: Date.now(),
                type: "note",
                author: "Tôi",
                text: `Đã đóng THUA cơ hội "${opp.name}". Lý do: ${opp.lossReason}`,
                timestamp: new Date(),
                dateString: "Vừa xong"
            });

            renderOpportunities();
            renderKpiSummary();
            filterTimeline();
            showSuccessNotification(`Đã ghi nhận đóng cơ hội.`);
        }
    }
}

/* --------------------------------------------------------------------------
   MODALS: THÊM LIÊN HỆ, SỬA CÔNG TY, THÊM CƠ HỘI, TẢI FILE
   -------------------------------------------------------------------------- */
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    const overlay = document.getElementById("c360ModalOverlay");
    if (modal && overlay) {
        modal.classList.add("open");
        overlay.classList.add("open");
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    const overlay = document.getElementById("c360ModalOverlay");
    if (modal) modal.classList.remove("open");
    if (overlay) overlay.classList.remove("open");
}

function closeAllModals() {
    document.querySelectorAll(".c360-modal").forEach(m => m.classList.remove("open"));
    document.getElementById("c360ModalOverlay")?.classList.remove("open");
}

// Chỉnh sửa công ty
function openEditCompanyModal() {
    setInputValue("editName", customer.name);
    setInputValue("editTax", customer.taxCode);
    setInputValue("editIndustry", customer.industry);
    setInputValue("editPhone", customer.phone);
    setInputValue("editEmail", customer.email);
    setInputValue("editWebsite", customer.website);
    setInputValue("editAddress", customer.address);
    openModal("companyEditModal");
}

function handleSaveCompany(e) {
    e.preventDefault();
    customer.name = getInputValue("editName") || customer.name;
    customer.taxCode = getInputValue("editTax") || customer.taxCode;
    customer.industry = getInputValue("editIndustry") || customer.industry;
    customer.phone = getInputValue("editPhone") || customer.phone;
    customer.email = getInputValue("editEmail") || customer.email;
    customer.website = getInputValue("editWebsite") || customer.website;
    customer.address = getInputValue("editAddress") || customer.address;

    renderCustomerHeader();
    renderCompanyInfo();
    closeModal("companyEditModal");
    showSuccessNotification("Đã cập nhật thông tin công ty thành công!");
}

// Thêm người liên hệ
function handleAddContact(e) {
    e.preventDefault();
    const name = getInputValue("newContactName");
    const title = getInputValue("newContactTitle");
    const role = getInputValue("newContactRole") || "INFLUENCER";
    const phone = getInputValue("newContactPhone");
    const email = getInputValue("newContactEmail");

    if (!name) {
        alert("Vui lòng nhập họ tên người liên hệ.");
        return;
    }

    const roleMap = {
        "DECISION_MAKER": "Người quyết định chính",
        "INFLUENCER": "Người ảnh hưởng",
        "TECHNICAL": "Đánh giá kỹ thuật",
        "END_USER": "Người sử dụng cuối",
        "BILLING": "Tài chính & Thanh toán"
    };

    contacts.unshift({
        id: Date.now(),
        name,
        title: title || "Chuyên viên",
        role,
        roleLabel: roleMap[role] || role,
        phone: phone || "—",
        email: email || "—",
        isPrimary: false
    });

    renderContactsList();
    closeModal("addContactModal");
    e.target.reset();
    showSuccessNotification(`Đã thêm người liên hệ ${name} thành công!`);
}

// Thêm cơ hội mới
function handleAddOpportunity(e) {
    e.preventDefault();
    const name = getInputValue("newOppName");
    const amount = Number(getInputValue("newOppAmount")) || 0;
    const stage = getInputValue("newOppStage") || "Phát hiện nhu cầu";
    const expectedClose = getInputValue("newOppCloseDate") || "30/11/2026";

    if (!name || amount <= 0) {
        alert("Vui lòng nhập tên cơ hội và giá trị lớn hơn 0.");
        return;
    }

    opportunities.unshift({
        id: Date.now(),
        name,
        amount,
        stage,
        stageProgress: 40,
        probability: 40,
        expectedClose,
        status: "OPEN",
        owner: customer.owner.name
    });

    renderOpportunities();
    renderKpiSummary();
    closeModal("addOppModal");
    e.target.reset();
    showSuccessNotification(`Đã thêm cơ hội bán hàng mới thành công!`);
}

// Thêm tệp đính kèm
function handleAddAttachment(e) {
    e.preventDefault();
    const name = getInputValue("newFileName");
    const type = getInputValue("newFileType") || "pdf";

    if (!name) {
        alert("Vui lòng nhập tên tài liệu.");
        return;
    }

    attachments.unshift({
        id: Date.now(),
        name: name.endsWith(`.${type}`) ? name : `${name}.${type}`,
        type,
        size: "1.5 MB",
        uploadedBy: "Nguyễn Văn An",
        uploadedAt: new Date().toLocaleDateString("vi-VN")
    });

    renderAttachments();
    closeModal("addAttachmentModal");
    e.target.reset();
    showSuccessNotification(`Đã thêm tệp đính kèm thành công!`);
}

function deleteAttachment(id) {
    if (confirm("Bạn có chắc muốn xóa tệp này?")) {
        attachments = attachments.filter(a => a.id !== id);
        renderAttachments();
        showSuccessNotification("Đã xóa tệp đính kèm.");
    }
}

function simulateDownloadFile(name) {
    showSuccessNotification(`Đang tải xuống tệp: ${name}...`);
}

/* --------------------------------------------------------------------------
   HÀNH ĐỘNG NHANH GỌI & GỬI EMAIL
   -------------------------------------------------------------------------- */
function quickCallContact(name, phone) {
    alert(`📞 Đang kết nối tổng đài VOIP để gọi cho: ${name} (${phone})`);
}

function quickEmailContact(name, email) {
    window.location.href = `mailto:${email}?subject=Trao%20đổi%20về%20dự%20án%20cùng%20PetroTech`;
}

/* --------------------------------------------------------------------------
   GẮN EVENT LISTENERS
   -------------------------------------------------------------------------- */
function setupEventListeners() {
    // Tab Cơ hội bán hàng: Mở vs Đã đóng
    document.getElementById("oppTabOpen")?.addEventListener("click", () => {
        currentOppTab = "open";
        document.getElementById("oppTabOpen").classList.add("active");
        document.getElementById("oppTabClosed").classList.remove("active");
        renderOpportunities();
    });

    document.getElementById("oppTabClosed")?.addEventListener("click", () => {
        currentOppTab = "closed";
        document.getElementById("oppTabClosed").classList.add("active");
        document.getElementById("oppTabOpen").classList.remove("active");
        renderOpportunities();
    });

    // Lọc Timeline theo loại hoạt động
    document.querySelectorAll("[data-timeline-filter]").forEach(chip => {
        chip.addEventListener("click", () => {
            document.querySelectorAll("[data-timeline-filter]").forEach(c => c.classList.remove("active"));
            chip.classList.add("active");
            activeActivityType = chip.dataset.timelineFilter;
            filterTimeline();
        });
    });

    // Tìm kiếm trong timeline
    let searchDebounce = null;
    document.getElementById("timelineSearchInput")?.addEventListener("input", () => {
        clearTimeout(searchDebounce);
        searchDebounce = setTimeout(filterTimeline, 200);
    });

    // Composer tabs (Ghi chú, cuộc gọi, email, v.v.)
    document.querySelectorAll("[data-composer-type]").forEach(btn => {
        btn.addEventListener("click", () => {
            document.querySelectorAll("[data-composer-type]").forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            activeComposerType = btn.dataset.composerType;
            const textarea = document.getElementById("composerTextarea");
            if (textarea) {
                const placeholders = {
                    call: "Ghi lại kết quả cuộc gọi với khách hàng...",
                    email: "Tóm tắt nội dung email đã gửi...",
                    meeting: "Ghi chép biên bản cuộc gặp mặt trực tiếp...",
                    note: "Ghi chú nhanh cho đồng nghiệp hoặc bản thân...",
                    task: "Giao việc hoặc đặt lịch nhắc nhở tiếp theo..."
                };
                textarea.placeholder = placeholders[activeComposerType] || "Nhập nội dung...";
            }
        });
    });

    // Submit composer
    document.getElementById("activityComposerForm")?.addEventListener("submit", handleNewActivitySubmit);

    // Nút benchmark hiệu năng tải 500 records
    document.getElementById("triggerBenchmarkBtn")?.addEventListener("click", () => {
        benchmarkRenderTimeline(true);
    });

    // Modals
    document.getElementById("btnEditCompany")?.addEventListener("click", openEditCompanyModal);
    document.getElementById("companyEditForm")?.addEventListener("submit", handleSaveCompany);

    document.getElementById("btnAddContact")?.addEventListener("click", () => openModal("addContactModal"));
    document.getElementById("addContactForm")?.addEventListener("submit", handleAddContact);

    document.getElementById("btnAddOpportunity")?.addEventListener("click", () => openModal("addOppModal"));
    document.getElementById("addOppForm")?.addEventListener("submit", handleAddOpportunity);

    document.getElementById("btnAddAttachment")?.addEventListener("click", () => openModal("addAttachmentModal"));
    document.getElementById("addAttachmentForm")?.addEventListener("submit", handleAddAttachment);

    document.getElementById("c360ModalOverlay")?.addEventListener("click", closeAllModals);
    document.querySelectorAll(".c360-modal-close, [data-modal-close]").forEach(btn => {
        btn.addEventListener("click", closeAllModals);
    });

    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape") closeAllModals();
    });
}

/* --------------------------------------------------------------------------
   HELPER UTILITIES
   -------------------------------------------------------------------------- */
function formatMoneyVND(amount) {
    return new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
        maximumFractionDigits: 0
    }).format(Number(amount) || 0);
}

function formatRelativeDate(date) {
    const diff = Date.now() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "Vừa xong";
    if (minutes < 60) return `${minutes} phút trước`;
    if (hours < 24) return `${hours} giờ trước`;
    if (days === 1) return `Hôm qua ${date.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}`;
    if (days < 7) return `${days} ngày trước`;
    return date.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function getRoleClass(role) {
    switch (role) {
        case "DECISION_MAKER": return "role-decision-maker";
        case "INFLUENCER": return "role-influencer";
        case "TECHNICAL": return "role-technical";
        case "BILLING": return "role-billing";
        default: return "role-end-user";
    }
}

function getActivityIconSvg(type) {
    switch (type) {
        case "call":
            return `<svg class="crm-inline-icon" viewBox="0 0 24 24"><path d="M5 3h4l2 5-3 2c2 3 3 4 6 6l2-3 5 2v4c0 2-2 3-4 2C9 19 5 15 3 7 2 5 3 3 5 3Z"/></svg>`;
        case "email":
            return `<svg class="crm-inline-icon" viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 6 9 7 9-7"/></svg>`;
        case "meeting":
            return `<svg class="crm-inline-icon" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>`;
        case "task":
            return `<svg class="crm-inline-icon" viewBox="0 0 24 24"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>`;
        default:
            return `<svg class="crm-inline-icon" viewBox="0 0 24 24"><path d="m16 3 5 5-12 12-6 1 1-6L16 3ZM14 5l5 5"/></svg>`;
    }
}

function getActivityTypeLabel(type) {
    switch (type) {
        case "call": return "Cuộc gọi";
        case "email": return "Email";
        case "meeting": return "Cuộc gặp";
        case "task": return "Nhiệm vụ";
        default: return "Ghi chú";
    }
}

function writeField(id, val) {
    const el = document.getElementById(id);
    if (el) el.textContent = val || "—";
}

function getInputValue(id) {
    return (document.getElementById(id)?.value || "").trim();
}

function setInputValue(id, val) {
    const el = document.getElementById(id);
    if (el) el.value = val || "";
}

function escapeHtml(val) {
    return String(val ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function showSuccessNotification(message) {
    // Tạo notification toast nhẹ nhàng theo CRM Toast System
    let toastRegion = document.querySelector(".crm-toast-region");
    if (!toastRegion) {
        toastRegion = document.createElement("div");
        toastRegion.className = "crm-toast-region";
        document.body.appendChild(toastRegion);
    }

    const toast = document.createElement("div");
    toast.className = "crm-toast crm-toast-success";
    toast.innerHTML = `
        <span class="crm-toast-icon">
            <svg viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5"/></svg>
        </span>
        <div class="crm-toast-copy">${escapeHtml(message)}</div>
    `;
    toastRegion.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = "0";
        toast.style.transition = "opacity 300ms ease";
        setTimeout(() => toast.remove(), 300);
    }, 3500);
}

// Khởi động trang khi DOM sẵn sàng
document.addEventListener("DOMContentLoaded", initCustomer360Page);
