"use strict";

(function () {
    /* =========================================================
       CONSTANTS & SEED DATA
    ========================================================= */
    const STORAGE_KEY_TICKETS = "crm_ui_tickets";
    const STORAGE_KEY_CHURN = "crm_ui_churn_risk_customers";

    // Danh sách khách hàng đồng bộ với database/CRM
    const DEFAULT_CUSTOMERS = [
        { id: 1, name: "Công ty TNHH Dịch vụ & Du lịch Viettravel Sun", taxCode: "0108923412", owner: "Nguyễn Văn Dũng", phone: "0903124578" },
        { id: 2, name: "Ngân hàng TMCP Việt Nam Thịnh Vượng (VPBank Thăng Long)", taxCode: "0100233583", owner: "Hoàng Đức Hải", phone: "02439288888" },
        { id: 3, name: "Chuỗi Bán lẻ Thời trang Nem Fashion", taxCode: "0103765432", owner: "Lê Thu Hà", phone: "0936112233" },
        { id: 4, name: "Công ty Cổ phần Dược phẩm An Sinh Medicare", taxCode: "0314567890", owner: "Trần Minh Quang", phone: "0977889900" },
        { id: 5, name: "Tập đoàn Sản xuất & Chế tạo Cơ khí Nam Á", taxCode: "3701239876", owner: "Nguyễn Văn Dũng", phone: "02743899222" },
        { id: 6, name: "Hệ thống Trường Quốc tế Á Châu (Asian School)", taxCode: "0302456781", owner: "Lê Thu Hà", phone: "02838480740" },
        { id: 7, name: "Công ty Cổ phần Giải pháp Logistics LogiTech Việt Nam", taxCode: "0201889922", owner: "Hoàng Đức Hải", phone: "0918776655" },
        { id: 8, name: "Chuỗi Cửa hàng Trà sữa TocoToco (Công ty CP Taco)", taxCode: "0106489012", owner: "Trần Minh Quang", phone: "1900636936" },
        { id: 9, name: "Công ty Cổ phần Đầu tư Công nghệ Xanh GreenTech", taxCode: "0401998877", owner: "Nguyễn Văn Dũng", phone: "0905667788" },
        { id: 10, name: "Tập đoàn Bán buôn & Phân phối Điện tử Đại Phát", taxCode: "0105123999", owner: "Hoàng Đức Hải", phone: "0944556677" }
    ];

    // Bộ dữ liệu mẫu cho Chăm sóc khách hàng & Churn Risk
    const DEFAULT_TICKETS = [
        {
            id: 1001,
            code: "TK-1001",
            customerId: 3,
            customerName: "Chuỗi Bán lẻ Thời trang Nem Fashion",
            ownerName: "Lê Thu Hà",
            subject: "Lỗi đồng bộ tồn kho giữa các chi nhánh và kênh bán hàng Online",
            category: "BUG",
            categoryLabel: "Lỗi phần mềm",
            priority: "URGENT",
            assignee: "Nguyễn Tuấn Anh (Tech)",
            status: "IN_PROGRESS",
            channel: "HOTLINE",
            deadline: "2026-10-10",
            createdAt: "2026-10-07T08:30:00",
            description: "Khách hàng thông báo dữ liệu kho chi nhánh Tràng Tiền bị lệch hơn 150 đơn đặt hàng trên Web. Ảnh hưởng nghiêm trọng đến giao dịch bán lẻ.",
            notes: [
                { time: "2026-10-07 09:15", user: "Phạm Minh Trang (CSKH)", text: "Đã tiếp nhận yêu cầu khẩn cấp, bàn giao đội kỹ thuật xử lý đồng bộ." },
                { time: "2026-10-08 14:20", user: "Nguyễn Tuấn Anh (Tech)", text: "Đang kiểm tra webhook kết nối giữa POS và cổng thương mại điện tử." }
            ]
        },
        {
            id: 1002,
            code: "TK-1002",
            customerId: 3,
            customerName: "Chuỗi Bán lẻ Thời trang Nem Fashion",
            ownerName: "Lê Thu Hà",
            subject: "Hệ thống máy tính tiền POS bị treo giờ cao điểm trưa tại 3 cửa hàng",
            category: "COMPLAINT",
            categoryLabel: "Khiếu nại dịch vụ",
            priority: "HIGH",
            assignee: "Phạm Minh Trang (CSKH)",
            status: "NEW",
            channel: "HOTLINE",
            deadline: "2026-10-11",
            createdAt: "2026-10-08T11:45:00",
            description: "Giám đốc cửa hàng phàn nàn nhân viên thu ngân không quét mã được từ 11h30 đến 12h15. Khách hàng xếp hàng đông gây phàn nàn.",
            notes: [
                { time: "2026-10-08 12:00", user: "Phạm Minh Trang (CSKH)", text: "Ghi nhận phản ánh gay gắt từ khách hàng. Cần ưu tiên khắc phục." }
            ]
        },
        {
            id: 1003,
            code: "TK-1003",
            customerId: 3,
            customerName: "Chuỗi Bán lẻ Thời trang Nem Fashion",
            ownerName: "Lê Thu Hà",
            subject: "Yêu cầu đền bù SLA hoặc gia hạn hợp đồng do gián đoạn dịch vụ",
            category: "COMPLAINT",
            categoryLabel: "Khiếu nại dịch vụ",
            priority: "URGENT",
            assignee: "Phạm Minh Trang (CSKH)",
            status: "PENDING",
            channel: "EMAIL",
            deadline: "2026-10-10",
            createdAt: "2026-10-06T16:00:00",
            description: "Bên Nem Fashion gửi email chính thức yêu cầu gặp Giám đốc kinh doanh và đe dọa chấm dứt hợp đồng nếu không xử lý dứt điểm các lỗi phát sinh.",
            notes: [
                { time: "2026-10-06 17:30", user: "Phạm Minh Trang (CSKH)", text: "Đã gửi cảnh báo khẩn cấp cho NVKD phụ trách Lê Thu Hà." }
            ]
        },
        {
            id: 1004,
            code: "TK-1004",
            customerId: 2,
            customerName: "Ngân hàng TMCP Việt Nam Thịnh Vượng (VPBank Thăng Long)",
            ownerName: "Hoàng Đức Hải",
            subject: "Hỗ trợ tích hợp API bảo mật 2 lớp qua cổng xác thực nội bộ mới",
            category: "BUG",
            categoryLabel: "Lỗi phần mềm",
            priority: "HIGH",
            assignee: "Vũ Đình Trọng (Tech)",
            status: "IN_PROGRESS",
            channel: "EMAIL",
            deadline: "2026-10-12",
            createdAt: "2026-10-08T09:00:00",
            description: "Khối CNTT VPBank yêu cầu cập nhật chữ ký số và giải thuật mã hóa HMAC-SHA256 theo tiêu chuẩn an toàn ngân hàng năm 2026.",
            notes: [
                { time: "2026-10-08 10:00", user: "Vũ Đình Trọng (Tech)", text: "Đã cung cấp tài liệu kỹ thuật API và mã mẫu kết nối." }
            ]
        },
        {
            id: 1005,
            code: "TK-1005",
            customerId: 2,
            customerName: "Ngân hàng TMCP Việt Nam Thịnh Vượng (VPBank Thăng Long)",
            ownerName: "Hoàng Đức Hải",
            subject: "Thời gian phản hồi ticket SLA tháng này chậm hơn cam kết hợp đồng",
            category: "COMPLAINT",
            categoryLabel: "Khiếu nại dịch vụ",
            priority: "HIGH",
            assignee: "Phạm Minh Trang (CSKH)",
            status: "NEW",
            channel: "EMAIL",
            deadline: "2026-10-11",
            createdAt: "2026-10-09T08:15:00",
            description: "Đại diện VPBank cảnh báo tỷ lệ đáp ứng yêu cầu hỗ trợ tháng vừa qua đạt 89% (thấp hơn 98% theo cam kết SLA hợp đồng).",
            notes: []
        },
        {
            id: 1006,
            code: "TK-1006",
            customerId: 7,
            customerName: "Công ty Cổ phần Giải pháp Logistics LogiTech Việt Nam",
            ownerName: "Hoàng Đức Hải",
            subject: "Hướng dẫn cấu hình phân quyền xem báo cáo đơn hàng cho chi nhánh Hải Phòng",
            category: "HOW_TO",
            categoryLabel: "Hướng dẫn sử dụng",
            priority: "MEDIUM",
            assignee: "Nguyễn Thị Mai (CSKH)",
            status: "IN_PROGRESS",
            channel: "HOTLINE",
            deadline: "2026-10-13",
            createdAt: "2026-10-07T14:00:00",
            description: "Quản lý chi nhánh Hải Phòng không truy cập được vào dữ liệu vận đơn nội vùng.",
            notes: []
        },
        {
            id: 1007,
            code: "TK-1007",
            customerId: 7,
            customerName: "Công ty Cổ phần Giải pháp Logistics LogiTech Việt Nam",
            ownerName: "Hoàng Đức Hải",
            subject: "Sự cố timeout khi xuất báo cáo tổng hợp hơn 100.000 dòng ra file Excel",
            category: "BUG",
            categoryLabel: "Lỗi phần mềm",
            priority: "HIGH",
            assignee: "Nguyễn Tuấn Anh (Tech)",
            status: "NEW",
            channel: "PORTAL",
            deadline: "2026-10-11",
            createdAt: "2026-10-09T10:00:00",
            description: "Người dùng thao tác xuất dữ liệu tháng thì trình duyệt báo lỗi 504 Gateway Timeout.",
            notes: []
        },
        {
            id: 1008,
            code: "TK-1008",
            customerId: 1,
            customerName: "Công ty TNHH Dịch vụ & Du lịch Viettravel Sun",
            ownerName: "Nguyễn Văn Dũng",
            subject: "Khắc phục xong lỗi không gửi được email xác nhận booking tour tự động",
            category: "BUG",
            categoryLabel: "Lỗi phần mềm",
            priority: "HIGH",
            assignee: "Nguyễn Tuấn Anh (Tech)",
            status: "RESOLVED",
            channel: "EMAIL",
            deadline: "2026-10-08",
            createdAt: "2026-10-05T09:00:00",
            description: "Cấu hình lại máy chủ SMTP và tăng quota gửi thư thành công. Khách hàng đã kiểm tra và xác nhận ổn định.",
            notes: [
                { time: "2026-10-06 11:00", user: "Nguyễn Tuấn Anh (Tech)", text: "Đã chuyển sang máy chủ dự phòng, gửi test 20 email thành công." },
                { time: "2026-10-07 08:30", user: "Phạm Minh Trang (CSKH)", text: "Khách hàng phản hồi rất hài lòng, ticket đã giải quyết." }
            ]
        },
        {
            id: 1009,
            code: "TK-1009",
            customerId: 1,
            customerName: "Công ty TNHH Dịch vụ & Du lịch Viettravel Sun",
            ownerName: "Nguyễn Văn Dũng",
            subject: "Nâng cấp gói tài khoản thêm 15 người dùng cho bộ phận chăm sóc khách",
            category: "FEATURE",
            categoryLabel: "Yêu cầu tính năng",
            priority: "LOW",
            assignee: "Phạm Minh Trang (CSKH)",
            status: "CLOSED",
            channel: "DIRECT",
            deadline: "2026-10-04",
            createdAt: "2026-10-01T10:00:00",
            description: "Bổ sung gói license thành công và bàn giao tài khoản cho Giám đốc kinh doanh.",
            notes: []
        },
        {
            id: 1010,
            code: "TK-1010",
            customerId: 5,
            customerName: "Tập đoàn Sản xuất & Chế tạo Cơ khí Nam Á",
            ownerName: "Nguyễn Văn Dũng",
            subject: "Tổ chức buổi đào tạo bổ sung quy trình quản lý hợp đồng cho nhân viên mới",
            category: "HOW_TO",
            categoryLabel: "Hướng dẫn sử dụng",
            priority: "MEDIUM",
            assignee: "Nguyễn Thị Mai (CSKH)",
            status: "IN_PROGRESS",
            channel: "HOTLINE",
            deadline: "2026-10-15",
            createdAt: "2026-10-08T15:20:00",
            description: "Hẹn lịch đào tạo online qua Google Meet vào sáng thứ Ba tuần tới.",
            notes: []
        }
    ];

    /* =========================================================
       STATE VARIABLES
    ========================================================= */
    let tickets = [];
    let customers = [];
    let churnRiskSummary = {}; // map customerId -> { count, critical, level, customer }
    let activeChurnOnly = false;
    let selectedDetailTicket = null;

    // Elements
    const tableBody = document.getElementById("ticketsTableBody");
    const emptyState = document.getElementById("ticketsEmptyState");
    const mobileList = document.getElementById("ticketsMobileList");
    const searchInput = document.getElementById("ticketSearch");
    const priorityFilter = document.getElementById("priorityFilter");
    const statusFilter = document.getElementById("statusFilter");
    const categoryFilter = document.getElementById("categoryFilter");
    const btnFilterChurnRisk = document.getElementById("btnFilterChurnRisk");
    const churnFilterBadge = document.getElementById("churnFilterBadge");
    const btnResetFilters = document.getElementById("btnResetFilters");
    const btnEmptyReset = document.getElementById("btnEmptyReset");

    // Radar elements
    const churnRadarSection = document.getElementById("churnRadarSection");
    const churnAccountsGrid = document.getElementById("churnAccountsGrid");
    const churnBadgeCount = document.getElementById("churnBadgeCount");
    const btnToggleChurnRadar = document.getElementById("btnToggleChurnRadar");

    // Drawer elements
    const drawer = document.getElementById("ticketDrawer");
    const drawerOverlay = document.getElementById("ticketDrawerOverlay");
    const btnOpenNew = document.getElementById("btnOpenNewTicketDrawer");
    const btnCloseDrawer = document.getElementById("btnCloseDrawer");
    const btnCancelDrawer = document.getElementById("btnCancelDrawer");
    const ticketForm = document.getElementById("ticketForm");
    const customerSelect = document.getElementById("ticketCustomerSelect");
    const formChurnWarning = document.getElementById("formChurnWarning");
    const formCustomerOwner = document.getElementById("formCustomerOwner");
    const selectedCustomerMeta = document.getElementById("selectedCustomerMeta");

    // Detail Modal elements
    const detailModal = document.getElementById("ticketDetailModal");
    const detailOverlay = document.getElementById("detailModalOverlay");
    const btnCloseDetail = document.getElementById("btnCloseDetailModal");
    const btnCloseDetailBottom = document.getElementById("btnCloseDetailModalBottom");
    const btnEditFromDetail = document.getElementById("btnEditFromDetail");
    const btnAddNote = document.getElementById("btnAddNote");
    const newResolutionNote = document.getElementById("newResolutionNote");
    const detailNotesList = document.getElementById("detailNotesList");

    /* =========================================================
       DATA PERSISTENCE & CHURN RISK CALCULATION ENGINE
    ========================================================= */
    function loadData() {
        // Load Tickets
        try {
            const raw = localStorage.getItem(STORAGE_KEY_TICKETS);
            if (raw) {
                tickets = JSON.parse(raw);
            } else {
                tickets = [...DEFAULT_TICKETS];
                saveTickets();
            }
        } catch (_) {
            tickets = [...DEFAULT_TICKETS];
        }

        customers = [...DEFAULT_CUSTOMERS];

        // Tính toán Churn Risk tự động
        recalculateChurnRisk();
    }

    function saveTickets() {
        try {
            localStorage.setItem(STORAGE_KEY_TICKETS, JSON.stringify(tickets));
        } catch (e) {
            console.warn("Could not save tickets to localStorage:", e);
        }
        recalculateChurnRisk();
    }

    /**
     * Thuật toán tự động phát hiện nguy cơ rời bỏ (Churn Risk Detection Engine):
     * - Tiêu chí chấp nhận 2: Khách có nhiều yêu cầu chưa xử lý được gắn cờ rủi ro tự động.
     * - Trạng thái chưa xử lý: NEW, IN_PROGRESS, PENDING.
     * - Khi khách hàng có >= 2 ticket chưa xử lý HOẶC có ticket mức độ URGENT chưa xử lý:
     *   => TỰ ĐỘNG GẮN CỜ RỦI RO RỜI BỎ!
     *   + Mức CRITICAL (Rất cao): >= 3 ticket tồn đọng HOẶC có khiếu nại URGENT chưa xử lý.
     *   + Mức HIGH (Cao): 2 ticket tồn đọng chưa xử lý.
     */
    function recalculateChurnRisk() {
        churnRiskSummary = {};

        // Nhóm các ticket chưa giải quyết theo khách hàng
        const unresolved = tickets.filter(t => t.status === "NEW" || t.status === "IN_PROGRESS" || t.status === "PENDING");

        unresolved.forEach(t => {
            const cId = Number(t.customerId);
            if (!churnRiskSummary[cId]) {
                const cust = customers.find(c => c.id === cId) || {
                    id: cId,
                    name: t.customerName,
                    owner: t.ownerName
                };
                churnRiskSummary[cId] = {
                    customerId: cId,
                    customerName: cust.name,
                    taxCode: cust.taxCode || "",
                    ownerName: cust.owner || t.ownerName || "Chưa phân công",
                    unresolvedCount: 0,
                    urgentCount: 0,
                    highCount: 0,
                    tickets: []
                };
            }

            churnRiskSummary[cId].unresolvedCount++;
            if (t.priority === "URGENT") churnRiskSummary[cId].urgentCount++;
            if (t.priority === "HIGH") churnRiskSummary[cId].highCount++;
            churnRiskSummary[cId].tickets.push(t);
        });

        // Xác định cờ rủi ro và mức độ
        const flaggedAccounts = [];
        for (const cId in churnRiskSummary) {
            const item = churnRiskSummary[cId];
            if (item.unresolvedCount >= 3 || (item.unresolvedCount >= 2 && item.urgentCount > 0)) {
                item.level = "CRITICAL";
                item.levelLabel = "Rất cao";
                item.isChurnRisk = true;
                flaggedAccounts.push(item);
            } else if (item.unresolvedCount >= 2 || item.urgentCount > 0) {
                item.level = "HIGH";
                item.levelLabel = "Cao";
                item.isChurnRisk = true;
                flaggedAccounts.push(item);
            } else {
                item.isChurnRisk = false;
                item.level = "NORMAL";
                item.levelLabel = "Bình thường";
            }
        }

        // Lưu thông tin khách hàng bị cờ vào localStorage để trang customer-360.html đồng bộ ngay lập tức
        try {
            const churnState = {};
            flaggedAccounts.forEach(acc => {
                churnState[acc.customerId] = {
                    id: acc.customerId,
                    name: acc.customerName,
                    ownerName: acc.ownerName,
                    unresolvedCount: acc.unresolvedCount,
                    urgentCount: acc.urgentCount,
                    level: acc.level,
                    levelLabel: acc.levelLabel
                };
            });
            localStorage.setItem(STORAGE_KEY_CHURN, JSON.stringify(churnState));
        } catch (_) {}
    }

    function isCustomerAtChurnRisk(customerId) {
        const item = churnRiskSummary[Number(customerId)];
        return item && item.isChurnRisk;
    }

    function getCustomerChurnInfo(customerId) {
        return churnRiskSummary[Number(customerId)] || null;
    }

    /* =========================================================
       URL HELPERS (LINKING TO CUSTOMER 360)
    ========================================================= */
    function get360Url(customerId) {
        // Hỗ trợ cả môi trường mở file tĩnh trực tiếp và server sạch URL
        const isFileProtocol = window.location.protocol === "file:" || window.location.pathname.endsWith(".html");
        return isFileProtocol ? `customer-360.html?id=${customerId}` : `customer-360?id=${customerId}`;
    }

    /* =========================================================
       RENDERERS
    ========================================================= */
    function renderAll() {
        updateKpis();
        renderChurnRadar();
        renderCustomerSelect();
        renderTableAndCards();
    }

    function updateKpis() {
        const total = tickets.length;
        const resolved = tickets.filter(t => t.status === "RESOLVED" || t.status === "CLOSED").length;
        const pending = tickets.filter(t => t.status === "NEW" || t.status === "IN_PROGRESS" || t.status === "PENDING").length;
        const urgent = tickets.filter(t => t.priority === "URGENT" && (t.status !== "RESOLVED" && t.status !== "CLOSED")).length;
        const newCount = tickets.filter(t => t.status === "NEW").length;

        // Số lượng khách hàng bị gắn cờ Churn Risk
        const churnAccounts = Object.values(churnRiskSummary).filter(c => c.isChurnRisk).length;

        const rate = total > 0 ? Math.round((resolved / total) * 100) : 0;

        safeSetText("kpiTotalTickets", total);
        safeSetText("kpiResolvedRate", `Tỷ lệ giải quyết: ${rate}% (${resolved}/${total})`);
        safeSetText("kpiPendingTickets", pending);
        safeSetText("kpiNewCount", `${newCount} yêu cầu mới tiếp nhận`);
        safeSetText("kpiUrgentTickets", urgent);
        safeSetText("kpiChurnAccounts", churnAccounts);
        safeSetText("churnBadgeCount", `${churnAccounts} doanh nghiệp`);
        safeSetText("churnFilterBadge", churnAccounts);
    }

    function renderChurnRadar() {
        if (!churnAccountsGrid) return;
        churnAccountsGrid.innerHTML = "";

        const flaggedList = Object.values(churnRiskSummary)
            .filter(c => c.isChurnRisk)
            .sort((a, b) => b.unresolvedCount - a.unresolvedCount);

        if (flaggedList.length === 0) {
            churnRadarSection.style.display = "none";
            return;
        }

        churnRadarSection.style.display = "block";

        flaggedList.forEach(acc => {
            const card = document.createElement("div");
            card.className = `churn-account-card ${acc.level.toLowerCase()}`;

            const badgeCls = acc.level === "CRITICAL" ? "critical" : "high";
            const badgeText = acc.level === "CRITICAL" ? "🚨 Rất cao (Nguy cơ rời bỏ)" : "⚠️ Cao (Cần can thiệp)";

            card.innerHTML = `
                <div>
                    <div class="churn-account-head">
                        <div>
                            <a href="${get360Url(acc.customerId)}" class="churn-account-name" title="Mở trang Customer 360 để kiểm tra chi tiết">
                                ${escapeHtml(acc.customerName)}
                            </a>
                            <div class="churn-account-tax">MST: ${escapeHtml(acc.taxCode || "—")} · Mã: #${acc.customerId}</div>
                        </div>
                        <span class="churn-level-pill ${badgeCls}">${badgeText}</span>
                    </div>

                    <div class="churn-account-stats" style="margin-top:10px;">
                        <span>Tồn đọng: <strong>${acc.unresolvedCount} ticket</strong></span>
                        <span>Khẩn cấp: <strong>${acc.urgentCount}</strong></span>
                        <span>Độ ưu tiên cao: <strong>${acc.highCount}</strong></span>
                    </div>

                    <div class="churn-account-owner" style="margin-top:10px;">
                        <span>💼 NVKD phụ trách:</span>
                        <strong>${escapeHtml(acc.ownerName)}</strong>
                    </div>
                </div>

                <div class="churn-account-actions">
                    <a href="${get360Url(acc.customerId)}" class="crm-btn crm-btn-secondary" style="font-size:12px; padding:4px 10px; flex:1;">
                        🔍 Xem trang 360
                    </a>
                    <button type="button" class="crm-btn crm-btn-secondary btn-notify-sales" data-cust-id="${acc.customerId}" style="font-size:12px; padding:4px 10px; border-color:#fca5a5; color:#991b1b;">
                        🔔 Báo NVKD
                    </button>
                    <button type="button" class="crm-btn crm-btn-primary btn-filter-cust" data-cust-name="${escapeHtml(acc.customerName)}" style="font-size:12px; padding:4px 10px; background:#b91c1c; border-color:#b91c1c;">
                        🎫 Lọc ticket
                    </button>
                </div>
            `;

            churnAccountsGrid.appendChild(card);
        });
    }

    function renderCustomerSelect() {
        if (!customerSelect) return;
        const currentVal = customerSelect.value;
        customerSelect.innerHTML = '<option value="">-- Chọn khách hàng doanh nghiệp --</option>';

        customers.forEach(c => {
            const isRisk = isCustomerAtChurnRisk(c.id);
            const opt = document.createElement("option");
            opt.value = c.id;
            opt.textContent = `${isRisk ? "⚠️ [CHURN RISK] " : ""}${c.name} (MST: ${c.taxCode || "—"})`;
            if (String(c.id) === String(currentVal)) opt.selected = true;
            customerSelect.appendChild(opt);
        });
    }

    function renderTableAndCards() {
        if (!tableBody || !mobileList) return;
        tableBody.innerHTML = "";
        mobileList.innerHTML = "";

        // Lọc dữ liệu
        const q = (searchInput?.value || "").trim().toLowerCase();
        const pVal = priorityFilter?.value || "";
        const sVal = statusFilter?.value || "";
        const cVal = categoryFilter?.value || "";

        const filtered = tickets.filter(t => {
            if (activeChurnOnly && !isCustomerAtChurnRisk(t.customerId)) {
                return false;
            }

            if (pVal && t.priority !== pVal) return false;
            if (sVal && t.status !== sVal) return false;
            if (cVal && t.category !== cVal) return false;

            if (q) {
                const matchCode = (t.code || "").toLowerCase().includes(q);
                const matchSub = (t.subject || "").toLowerCase().includes(q);
                const matchCust = (t.customerName || "").toLowerCase().includes(q);
                const matchAss = (t.assignee || "").toLowerCase().includes(q);
                const matchOwner = (t.ownerName || "").toLowerCase().includes(q);
                if (!matchCode && !matchSub && !matchCust && !matchAss && !matchOwner) return false;
            }

            return true;
        });

        if (filtered.length === 0) {
            if (emptyState) emptyState.style.display = "flex";
            return;
        }

        if (emptyState) emptyState.style.display = "none";

        filtered.forEach(ticket => {
            const isRisk = isCustomerAtChurnRisk(ticket.customerId);
            const churnInfo = getCustomerChurnInfo(ticket.customerId);

            // --- Desktop Row ---
            const tr = document.createElement("tr");
            if (isRisk) tr.classList.add("row-churn-highlight");

            const priorityBadge = getPriorityBadgeHtml(ticket.priority);
            const statusPill = getStatusPillHtml(ticket.status);

            const churnBadgeHtml = isRisk ? `
                <span class="churn-flag-badge" title="Khách hàng có ${churnInfo?.unresolvedCount || 2} ticket tồn đọng chưa xử lý. NVKD ${escapeHtml(ticket.ownerName)} cần can thiệp giữ chân khách!">
                    🚨 Nguy cơ rời bỏ (${churnInfo?.unresolvedCount || 2} tồn)
                </span>
            ` : "";

            const isOverdue = ticket.deadline && new Date(ticket.deadline) < new Date() && ticket.status !== "RESOLVED" && ticket.status !== "CLOSED";

            tr.innerHTML = `
                <td class="ticket-code-cell">
                    <a href="javascript:void(0)" class="ticket-code-link" data-view-id="${ticket.id}">
                        #${ticket.code || ticket.id}
                    </a>
                </td>
                <td>
                    <div class="ticket-title-group">
                        <a href="javascript:void(0)" class="ticket-title-link" data-view-id="${ticket.id}">
                            ${escapeHtml(ticket.subject)}
                        </a>
                        <span class="ticket-category-tag">
                            📁 ${escapeHtml(ticket.categoryLabel || ticket.category)}
                        </span>
                    </div>
                </td>
                <td>
                    <div class="customer-cell-group">
                        <a href="${get360Url(ticket.customerId)}" class="customer-name-link" title="Mở trang Customer 360">
                            ${escapeHtml(ticket.customerName)}
                        </a>
                        ${churnBadgeHtml}
                        <span class="sales-rep-sub">
                            💼 NVKD: ${escapeHtml(ticket.ownerName || "Chưa rõ")}
                        </span>
                    </div>
                </td>
                <td>${priorityBadge}</td>
                <td>
                    <div class="assignee-cell">
                        <div class="assignee-avatar">${escapeHtml((ticket.assignee || "U").charAt(0))}</div>
                        <span>${escapeHtml(ticket.assignee || "Chưa giao")}</span>
                    </div>
                </td>
                <td>${statusPill}</td>
                <td>
                    <div class="sla-cell ${isOverdue ? "overdue" : ""}">
                        ${ticket.deadline ? `📅 ${ticket.deadline}` : "—"}
                        ${isOverdue ? '<div style="color:#dc2626; font-size:11px;">⚠️ Quá hạn SLA</div>' : ""}
                    </div>
                </td>
                <td style="text-align: right;">
                    <div class="action-buttons-wrap" style="justify-content: flex-end;">
                        <button type="button" class="btn-icon-action" title="Xem chi tiết & Cập nhật tiến độ" data-view-id="${ticket.id}">
                            👁️
                        </button>
                        <button type="button" class="btn-icon-action" title="Sửa thông tin" data-edit-id="${ticket.id}">
                            ✏️
                        </button>
                        <button type="button" class="btn-icon-action danger" title="Xóa ticket" data-delete-id="${ticket.id}">
                            🗑️
                        </button>
                    </div>
                </td>
            `;

            tableBody.appendChild(tr);

            // --- Mobile Card ---
            const mCard = document.createElement("article");
            mCard.className = `ticket-mobile-card ${isRisk ? "churn-border" : ""}`;

            mCard.innerHTML = `
                <div class="mobile-card-top">
                    <span class="ticket-code-cell">#${ticket.code || ticket.id}</span>
                    <div>${statusPill}</div>
                </div>

                <div class="mobile-card-body">
                    <a href="javascript:void(0)" class="ticket-title-link" style="font-size:14.5px;" data-view-id="${ticket.id}">
                        ${escapeHtml(ticket.subject)}
                    </a>

                    <div style="margin-top:2px;">
                        <a href="${get360Url(ticket.customerId)}" class="customer-name-link" style="font-size:13px;">
                            🏢 ${escapeHtml(ticket.customerName)}
                        </a>
                        ${churnBadgeHtml ? `<div style="margin-top:4px;">${churnBadgeHtml}</div>` : ""}
                    </div>
                </div>

                <div class="mobile-card-meta">
                    <span>Ưu tiên: ${priorityBadge}</span>
                    <span>Xử lý: <strong>${escapeHtml(ticket.assignee || "—")}</strong></span>
                    <span>NVKD: <strong>${escapeHtml(ticket.ownerName || "—")}</strong></span>
                    <span>Hạn SLA: <strong class="${isOverdue ? "danger-text" : ""}">${ticket.deadline || "—"}</strong></span>
                </div>

                <div style="display:flex; gap:8px; margin-top:8px;">
                    <button type="button" class="crm-btn crm-btn-secondary" style="flex:1; font-size:12.5px;" data-view-id="${ticket.id}">
                        👁️ Chi tiết & Cập nhật
                    </button>
                    <button type="button" class="crm-btn crm-btn-secondary" style="font-size:12.5px;" data-edit-id="${ticket.id}">
                        ✏️ Sửa
                    </button>
                </div>
            `;

            mobileList.appendChild(mCard);
        });
    }

    /* =========================================================
       BADGE & PILL HELPERS
    ========================================================= */
    function getPriorityBadgeHtml(priority) {
        switch (priority) {
            case "URGENT":
                return `<span class="priority-badge urgent"><span class="priority-dot"></span>Khẩn cấp</span>`;
            case "HIGH":
                return `<span class="priority-badge high"><span class="priority-dot"></span>Cao</span>`;
            case "MEDIUM":
                return `<span class="priority-badge medium"><span class="priority-dot"></span>Trung bình</span>`;
            default:
                return `<span class="priority-badge low"><span class="priority-dot"></span>Thấp</span>`;
        }
    }

    function getStatusPillHtml(status) {
        switch (status) {
            case "NEW":
                return `<span class="status-pill status-new">🆕 Mới tiếp nhận</span>`;
            case "IN_PROGRESS":
                return `<span class="status-pill status-progress">⚙️ Đang xử lý</span>`;
            case "PENDING":
                return `<span class="status-pill status-pending">⏳ Chờ phản hồi</span>`;
            case "RESOLVED":
                return `<span class="status-pill status-resolved">✅ Đã giải quyết</span>`;
            case "CLOSED":
                return `<span class="status-pill status-closed">🔒 Đã đóng</span>`;
            default:
                return `<span class="status-pill">${escapeHtml(status)}</span>`;
        }
    }

    /* =========================================================
       DRAWER (TẠO MỚI / CHỈNH SỬA TICKET)
    ========================================================= */
    function openDrawer(ticketToEdit = null) {
        const titleEl = document.getElementById("drawerTitle");
        const editingInput = document.getElementById("editingTicketId");

        if (ticketToEdit) {
            titleEl.textContent = `✏️ Chỉnh sửa yêu cầu hỗ trợ #${ticketToEdit.code}`;
            editingInput.value = ticketToEdit.id;

            customerSelect.value = ticketToEdit.customerId;
            setValue("ticketSubject", ticketToEdit.subject);
            setValue("ticketCategory", ticketToEdit.category);
            setValue("ticketPriority", ticketToEdit.priority);
            setValue("ticketAssignee", ticketToEdit.assignee);
            setValue("ticketStatus", ticketToEdit.status);
            setValue("ticketChannel", ticketToEdit.channel || "HOTLINE");
            setValue("ticketDeadline", ticketToEdit.deadline || "");
            setValue("ticketDescription", ticketToEdit.description || "");

            checkFormCustomerChurnRealtime();
        } else {
            titleEl.textContent = "+ Ghi nhận yêu cầu hỗ trợ mới";
            editingInput.value = "";
            ticketForm.reset();

            // Default values
            setValue("ticketPriority", "HIGH");
            setValue("ticketStatus", "NEW");
            setValue("ticketCategory", "BUG");
            setValue("ticketAssignee", "Phạm Minh Trang (CSKH)");

            // Mặc định SLA hạn xử lý: ngày mai
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 2);
            setValue("ticketDeadline", tomorrow.toISOString().split("T")[0]);

            checkFormCustomerChurnRealtime();
        }

        drawer.classList.add("open");
        drawerOverlay.classList.add("open");
    }

    function closeDrawer() {
        drawer.classList.remove("open");
        drawerOverlay.classList.remove("open");
    }

    // Kiểm tra và cảnh báo Churn Risk theo thời gian thực ngay trong form khi chọn khách hàng
    function checkFormCustomerChurnRealtime() {
        const cId = Number(customerSelect.value);
        if (!cId) {
            if (formChurnWarning) formChurnWarning.style.display = "none";
            if (selectedCustomerMeta) selectedCustomerMeta.style.display = "none";
            return;
        }

        const cust = customers.find(c => c.id === cId);
        if (cust) {
            if (selectedCustomerMeta) selectedCustomerMeta.style.display = "block";
            safeSetText("formCustomerOwner", `${cust.owner} (ĐT: ${cust.phone || "—"})`);
        }

        const churnInfo = getCustomerChurnInfo(cId);
        if (churnInfo && churnInfo.unresolvedCount > 0) {
            if (formChurnWarning) {
                formChurnWarning.style.display = "flex";
                if (churnInfo.isChurnRisk) {
                    formChurnWarning.className = "form-churn-alert critical";
                    safeSetText("formChurnWarningTitle", `🚨 KHÁCH HÀNG NÀY ĐANG BỊ GẮN CỜ NGUY CƠ RỜI BỎ!`);
                    safeSetText("formChurnWarningDesc", `Hiện có ${churnInfo.unresolvedCount} yêu cầu tồn đọng (${churnInfo.urgentCount} khẩn cấp). Cần phối hợp với NVKD ${cust?.owner || "phụ trách"} giải quyết triệt để!`);
                } else {
                    formChurnWarning.className = "form-churn-alert";
                    safeSetText("formChurnWarningTitle", `⚠️ Chú ý tồn đọng`);
                    safeSetText("formChurnWarningDesc", `Khách hàng này đang có ${churnInfo.unresolvedCount} ticket chưa xong. Thêm ticket mới có thể kích hoạt Cờ Nguy cơ rời bỏ (Churn Risk)!`);
                }
            }
        } else {
            if (formChurnWarning) formChurnWarning.style.display = "none";
        }
    }

    customerSelect?.addEventListener("change", checkFormCustomerChurnRealtime);

    ticketForm?.addEventListener("submit", event => {
        event.preventDefault();

        const editingId = document.getElementById("editingTicketId").value;
        const cId = Number(customerSelect.value);
        const cust = customers.find(c => c.id === cId);

        if (!cust) {
            alert("Vui lòng chọn khách hàng doanh nghiệp hợp lệ.");
            return;
        }

        const catVal = value("ticketCategory");
        const categoryLabels = {
            "BUG": "Lỗi phần mềm",
            "COMPLAINT": "Khiếu nại dịch vụ",
            "HOW_TO": "Hướng dẫn sử dụng",
            "FEATURE": "Yêu cầu tính năng",
            "WARRANTY": "Bảo hành & Hợp đồng"
        };

        if (editingId) {
            // Cập nhật
            const idx = tickets.findIndex(t => String(t.id) === String(editingId));
            if (idx !== -1) {
                tickets[idx].customerId = cId;
                tickets[idx].customerName = cust.name;
                tickets[idx].ownerName = cust.owner;
                tickets[idx].subject = value("ticketSubject");
                tickets[idx].category = catVal;
                tickets[idx].categoryLabel = categoryLabels[catVal] || catVal;
                tickets[idx].priority = value("ticketPriority");
                tickets[idx].assignee = value("ticketAssignee");
                tickets[idx].status = value("ticketStatus");
                tickets[idx].channel = value("ticketChannel");
                tickets[idx].deadline = value("ticketDeadline");
                tickets[idx].description = value("ticketDescription");

                showToast(`Đã cập nhật yêu cầu hỗ trợ #${tickets[idx].code}`, "success");
            }
        } else {
            // Tạo mới
            const newId = Date.now();
            const code = `TK-${Math.floor(1000 + Math.random() * 9000)}`;

            const newTicket = {
                id: newId,
                code: code,
                customerId: cId,
                customerName: cust.name,
                ownerName: cust.owner,
                subject: value("ticketSubject"),
                category: catVal,
                categoryLabel: categoryLabels[catVal] || catVal,
                priority: value("ticketPriority"),
                assignee: value("ticketAssignee"),
                status: value("ticketStatus"),
                channel: value("ticketChannel"),
                deadline: value("ticketDeadline"),
                createdAt: new Date().toISOString(),
                description: value("ticketDescription"),
                notes: [
                    { time: new Date().toLocaleString("vi-VN"), user: "CSKH", text: "Tiếp nhận yêu cầu hỗ trợ mới qua hệ thống." }
                ]
            };

            tickets.unshift(newTicket);
            showToast(`Ghi nhận thành công yêu cầu #${code}`, "success");
        }

        saveTickets();
        closeDrawer();
        renderAll();

        // Kiểm tra sau khi lưu khách hàng có bị gắn cờ Churn Risk không
        if (isCustomerAtChurnRisk(cId)) {
            setTimeout(() => {
                showToast(`🚨 CẢNH BÁO: Khách hàng "${cust.name}" đã được tự động gắn cờ NGUY CƠ RỜI BỎ (CHURN RISK) do có nhiều ticket chưa xử lý!`, "error");
            }, 500);
        }
    });

    /* =========================================================
       DETAIL & STATUS UPDATE MODAL
    ========================================================= */
    function openDetailModal(ticketId) {
        const ticket = tickets.find(t => String(t.id) === String(ticketId));
        if (!ticket) return;

        selectedDetailTicket = ticket;

        safeSetText("detailTicketCode", `#${ticket.code || ticket.id}`);
        safeSetText("detailTicketSubject", ticket.subject);

        const custLink = document.getElementById("detailCustomerLink");
        if (custLink) {
            custLink.textContent = ticket.customerName;
            custLink.href = get360Url(ticket.customerId);
        }

        safeSetText("detailCustomerOwner", ticket.ownerName || "Chưa phân công");
        safeSetHtml("detailPriority", getPriorityBadgeHtml(ticket.priority));
        safeSetText("detailCategory", ticket.categoryLabel || ticket.category);
        safeSetText("detailAssignee", ticket.assignee || "Chưa giao");
        safeSetText("detailDeadline", ticket.deadline ? `📅 ${ticket.deadline}` : "—");
        safeSetText("detailDescription", ticket.description || "Chưa có mô tả chi tiết.");

        // Churn alert in modal
        const isRisk = isCustomerAtChurnRisk(ticket.customerId);
        const detailChurnAlert = document.getElementById("detailChurnAlert");
        if (detailChurnAlert) {
            if (isRisk) {
                detailChurnAlert.style.display = "flex";
                const info = getCustomerChurnInfo(ticket.customerId);
                safeSetText("detailChurnDesc", `Khách hàng này đang có ${info?.unresolvedCount} ticket tồn đọng. Nhân viên kinh doanh ${ticket.ownerName} cần can thiệp ngay để giữ chân khách!`);
            } else {
                detailChurnAlert.style.display = "none";
            }
        }

        // Active status button
        document.querySelectorAll(".quick-status-btn").forEach(btn => {
            const st = btn.dataset.setStatus;
            btn.classList.toggle("current", st === ticket.status);
        });

        renderDetailNotes();

        detailModal.classList.add("open");
        detailOverlay.classList.add("open");
    }

    function closeDetailModal() {
        detailModal.classList.remove("open");
        detailOverlay.classList.remove("open");
    }

    function renderDetailNotes() {
        if (!detailNotesList || !selectedDetailTicket) return;
        detailNotesList.innerHTML = "";

        const notes = selectedDetailTicket.notes || [];
        if (notes.length === 0) {
            detailNotesList.innerHTML = '<div style="font-size:12px; color:var(--crm-muted); font-style:italic;">Chưa có ghi chú xử lý nào.</div>';
            return;
        }

        notes.forEach(n => {
            const item = document.createElement("div");
            item.style.cssText = "background:#f8fafc; border:1px solid #e2e8f0; border-radius:6px; padding:8px 10px; font-size:12px;";
            item.innerHTML = `
                <div style="display:flex; justify-content:space-between; color:var(--crm-muted); font-size:11px; margin-bottom:3px;">
                    <strong>${escapeHtml(n.user || "CSKH")}</strong>
                    <span>${escapeHtml(n.time || "")}</span>
                </div>
                <div style="color:var(--crm-text);">${escapeHtml(n.text || "")}</div>
            `;
            detailNotesList.appendChild(item);
        });
    }

    // Thay đổi trạng thái 1 chạm
    document.querySelectorAll(".quick-status-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            if (!selectedDetailTicket) return;
            const newStatus = btn.dataset.setStatus;
            selectedDetailTicket.status = newStatus;

            // Thêm note tự động
            if (!selectedDetailTicket.notes) selectedDetailTicket.notes = [];
            selectedDetailTicket.notes.push({
                time: new Date().toLocaleString("vi-VN"),
                user: "CSKH",
                text: `Đã chuyển trạng thái ticket sang: ${newStatus}`
            });

            saveTickets();
            renderAll();
            openDetailModal(selectedDetailTicket.id);

            showToast(`Đã cập nhật trạng thái ticket sang: ${newStatus}`, "success");
        });
    });

    btnAddNote?.addEventListener("click", () => {
        if (!selectedDetailTicket || !newResolutionNote) return;
        const text = newResolutionNote.value.trim();
        if (!text) return;

        if (!selectedDetailTicket.notes) selectedDetailTicket.notes = [];
        selectedDetailTicket.notes.push({
            time: new Date().toLocaleString("vi-VN"),
            user: "CSKH",
            text: text
        });

        newResolutionNote.value = "";
        saveTickets();
        renderDetailNotes();
        showToast("Đã lưu ghi chú tiến độ", "success");
    });

    btnEditFromDetail?.addEventListener("click", () => {
        if (!selectedDetailTicket) return;
        closeDetailModal();
        openDrawer(selectedDetailTicket);
    });

    /* =========================================================
       GLOBAL EVENT LISTENERS
    ========================================================= */
    btnOpenNew?.addEventListener("click", () => openDrawer(null));
    btnCloseDrawer?.addEventListener("click", closeDrawer);
    btnCancelDrawer?.addEventListener("click", closeDrawer);
    drawerOverlay?.addEventListener("click", closeDrawer);

    btnCloseDetail?.addEventListener("click", closeDetailModal);
    btnCloseDetailBottom?.addEventListener("click", closeDetailModal);
    detailOverlay?.addEventListener("click", closeDetailModal);

    // Churn Radar Collapse Toggle
    btnToggleChurnRadar?.addEventListener("click", () => {
        const isHidden = churnAccountsGrid.style.display === "none";
        churnAccountsGrid.style.display = isHidden ? "grid" : "none";
        btnToggleChurnRadar.textContent = isHidden ? "Thu gọn radar" : "Mở rộng radar";
    });

    // Toggle Churn Risk Only Filter
    btnFilterChurnRisk?.addEventListener("click", () => {
        activeChurnOnly = !activeChurnOnly;
        btnFilterChurnRisk.classList.toggle("active", activeChurnOnly);
        renderTableAndCards();
    });

    document.getElementById("kpiChurnCard")?.addEventListener("click", () => {
        activeChurnOnly = true;
        btnFilterChurnRisk.classList.add("active");
        renderTableAndCards();
        churnRadarSection?.scrollIntoView({ behavior: "smooth" });
    });

    // Reset Filters
    function resetAllFilters() {
        if (searchInput) searchInput.value = "";
        if (priorityFilter) priorityFilter.value = "";
        if (statusFilter) statusFilter.value = "";
        if (categoryFilter) categoryFilter.value = "";
        activeChurnOnly = false;
        btnFilterChurnRisk?.classList.remove("active");
        renderTableAndCards();
    }

    btnResetFilters?.addEventListener("click", resetAllFilters);
    btnEmptyReset?.addEventListener("click", resetAllFilters);

    [searchInput, priorityFilter, statusFilter, categoryFilter].forEach(el => {
        el?.addEventListener(el === searchInput ? "input" : "change", renderTableAndCards);
    });

    // Export button
    document.getElementById("btnExportTickets")?.addEventListener("click", () => {
        showToast("Đang xuất danh sách ticket và báo cáo Churn Risk ra file...", "success");
    });

    // Delegation cho table và action buttons
    document.addEventListener("click", event => {
        // Xem chi tiết
        const viewBtn = event.target.closest("[data-view-id]");
        if (viewBtn) {
            openDetailModal(viewBtn.dataset.viewId);
            return;
        }

        // Sửa
        const editBtn = event.target.closest("[data-edit-id]");
        if (editBtn) {
            const t = tickets.find(x => String(x.id) === String(editBtn.dataset.editId));
            if (t) openDrawer(t);
            return;
        }

        // Xóa
        const delBtn = event.target.closest("[data-delete-id]");
        if (delBtn) {
            const tId = delBtn.dataset.deleteId;
            if (confirm("Bạn có chắc chắn muốn xóa ticket này không?")) {
                tickets = tickets.filter(x => String(x.id) !== String(tId));
                saveTickets();
                renderAll();
                showToast("Đã xóa ticket hỗ trợ.", "success");
            }
            return;
        }

        // Báo NVKD từ Radar
        const notifyBtn = event.target.closest(".btn-notify-sales");
        if (notifyBtn) {
            const cId = Number(notifyBtn.dataset.custId);
            const cust = customers.find(c => c.id === cId);
            showToast(`🔔 ĐÃ GỬI CẢNH BÁO NGUY CƠ RỜI BỎ tới NVKD: ${cust?.owner || "phụ trách"}! Yêu cầu liên hệ khách trong vòng 2 giờ.`, "error");
            return;
        }

        // Báo NVKD từ Detail Modal
        if (event.target.closest("#btnNotifySalesFromModal")) {
            if (selectedDetailTicket) {
                showToast(`🔔 Đã gửi cảnh báo khẩn cấp tới NVKD: ${selectedDetailTicket.ownerName} để liên hệ khách ngay!`, "error");
            }
            return;
        }

        // Lọc ticket của khách hàng từ Radar
        const filterCustBtn = event.target.closest(".btn-filter-cust");
        if (filterCustBtn) {
            const name = filterCustBtn.dataset.custName;
            if (searchInput) searchInput.value = name;
            renderTableAndCards();
            window.scrollTo({ top: document.querySelector(".support-table-container")?.offsetTop - 80 || 300, behavior: "smooth" });
            return;
        }
    });

    // Keyboard ESC to close drawers
    document.addEventListener("keydown", event => {
        if (event.key === "Escape") {
            closeDrawer();
            closeDetailModal();
        }
    });

    /* =========================================================
       QUERY PARAMETERS HANDLER (DEEP LINKING)
    ========================================================= */
    function handleQueryParams() {
        const params = new URLSearchParams(window.location.search);
        const customerId = params.get("customerId");
        const newTicket = params.get("newTicket");
        const filterChurn = params.get("filterChurn");

        if (customerId) {
            const cust = customers.find(c => String(c.id) === String(customerId));
            if (cust && searchInput) {
                searchInput.value = cust.name;
            }
        }

        if (filterChurn === "1" || filterChurn === "true") {
            activeChurnOnly = true;
            btnFilterChurnRisk?.classList.add("active");
        }

        if (newTicket === "1" || newTicket === "true") {
            openDrawer(null);
            if (customerId && customerSelect) {
                customerSelect.value = customerId;
                checkFormCustomerChurnRealtime();
            }
        }
    }

    /* =========================================================
       TOAST NOTIFICATIONS
    ========================================================= */
    function showToast(message, type = "success") {
        let region = document.querySelector(".crm-toast-region");
        if (!region) {
            region = document.createElement("div");
            region.className = "crm-toast-region";
            document.body.appendChild(region);
        }

        const toast = document.createElement("div");
        toast.className = `crm-toast crm-toast-${type}`;

        const iconSvg = type === "error" 
            ? '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>'
            : '<svg viewBox="0 0 24 24"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>';

        toast.innerHTML = `
            <span class="crm-toast-icon">${iconSvg}</span>
            <div class="crm-toast-copy">${escapeHtml(message)}</div>
            <button class="crm-toast-close" type="button" aria-label="Đóng">✕</button>
            <div class="crm-toast-progress"></div>
        `;

        region.appendChild(toast);

        toast.querySelector(".crm-toast-close")?.addEventListener("click", () => toast.remove());
        setTimeout(() => toast.remove(), 4500);
    }

    /* =========================================================
       HELPERS
    ========================================================= */
    function safeSetText(id, text) {
        const el = document.getElementById(id);
        if (el) el.textContent = text;
    }

    function safeSetHtml(id, html) {
        const el = document.getElementById(id);
        if (el) el.innerHTML = html;
    }

    function value(id) {
        return (document.getElementById(id)?.value || "").trim();
    }

    function setValue(id, val) {
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

    /* =========================================================
       INITIALIZE
    ========================================================= */
    loadData();
    renderAll();
    handleQueryParams();

})();
