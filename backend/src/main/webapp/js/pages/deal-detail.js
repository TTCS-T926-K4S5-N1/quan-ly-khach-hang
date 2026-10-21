"use strict";

(function () {
    const API_BASE = "http://localhost:8080/crm";
    const STORAGE_KEY_OPPORTUNITIES = "crm_ui_opportunities";
    const STORAGE_KEY_EMPLOYEES = "crm_ui_employees";
    const STORAGE_KEY_CUSTOMERS = "crm_ui_customers";

    // 1. Company Employees Directory (Seed data for team sharing)
    const DEFAULT_EMPLOYEES = [
        { id: 1, name: "Trần Thị Thu Hà", email: "lead.mienbac@crm.local", phone: "0912.000.002", role: "Trưởng nhóm Kinh doanh Miền Bắc", department: "Khối Kinh doanh", avatarBg: "#2563eb" },
        { id: 2, name: "Lê Hoàng Nam", email: "sale.hn1@crm.local", phone: "0912.000.003", role: "Chuyên viên Kinh doanh B2B (Senior)", department: "Khối Kinh doanh", avatarBg: "#059669" },
        { id: 3, name: "Phạm Mai Phương", email: "sale.hn2@crm.local", phone: "0912.000.004", role: "Chuyên viên Kinh doanh", department: "Khối Kinh doanh", avatarBg: "#d97706" },
        { id: 4, name: "Bùi Đức Thành", email: "thanh.bd@crm.local", phone: "0912.000.011", role: "Kỹ sư Giải pháp (Solution Architect)", department: "Kỹ thuật & Pre-Sales", avatarBg: "#7c3aed" },
        { id: 5, name: "Võ Minh Thư", email: "thu.vm@crm.local", phone: "0912.000.012", role: "Chuyên viên Hợp đồng & Pháp chế", department: "Pháp chế & Tuân thủ", avatarBg: "#0891b2" },
        { id: 6, name: "Phan Văn Trung", email: "lead.mientrung@crm.local", phone: "0912.000.005", role: "Trưởng nhóm Kinh doanh Miền Trung", department: "Khối Kinh doanh", avatarBg: "#dc2626" },
        { id: 7, name: "Đỗ Thị Tuyết", email: "sale.dn@crm.local", phone: "0912.000.006", role: "Chuyên viên Kinh doanh Đà Nẵng", department: "Khối Kinh doanh", avatarBg: "#4f46e5" },
        { id: 8, name: "Vũ Minh Trí", email: "lead.miennam@crm.local", phone: "0912.000.007", role: "Trưởng nhóm Kinh doanh Miền Nam", department: "Khối Kinh doanh", avatarBg: "#ea580c" },
        { id: 9, name: "Hoàng Kim Yến", email: "sale.hcm1@crm.local", phone: "0912.000.008", role: "Chuyên viên Kinh doanh TP.HCM", department: "Khối Kinh doanh", avatarBg: "#db2777" },
        { id: 10, name: "Trương Tuấn Kiệt", email: "sale.hcm2@crm.local", phone: "0912.000.009", role: "Chuyên viên Chăm sóc Khách hàng lớn (KAM)", department: "Dịch vụ Khách hàng", avatarBg: "#0284c7" },
        { id: 11, name: "Nguyễn Văn Hùng", email: "giamdoc@crm.local", phone: "0912.000.001", role: "Giám đốc Kinh doanh Toàn quốc", department: "Ban Giám đốc", avatarBg: "#1e293b" }
    ];

    // 2. Stages Definition
    const STAGES = [
        { id: 1, name: "Khảo sát nhu cầu", orderNo: 1, probability: 20 },
        { id: 2, name: "Đánh giá & Xác định", orderNo: 2, probability: 40 },
        { id: 3, name: "Gửi đề xuất & Báo giá", orderNo: 3, probability: 60 },
        { id: 4, name: "Thương lượng & Đàm phán", orderNo: 4, probability: 80 },
        { id: 5, name: "Chốt thành công (Won)", orderNo: 5, probability: 100, isWon: true },
        { id: 6, name: "Đóng Thua (Lost)", orderNo: 6, probability: 0, isLost: true }
    ];

    // State
    let currentDeal = null;
    let allOpportunities = [];
    let currentSimulatedUser = DEFAULT_EMPLOYEES[0]; // Default: Tran Thi Thu Ha (Owner)
    let activeLogFilter = "ALL";

    // DOM Elements
    const breadcrumbCustomerName = document.getElementById("breadcrumbCustomerName");
    const breadcrumbDealName = document.getElementById("breadcrumbDealName");
    const userRoleSimulator = document.getElementById("userRoleSimulator");
    const rolePermissionNote = document.getElementById("rolePermissionNote");

    // Hero Elements
    const dealCodeDisplay = document.getElementById("dealCodeDisplay");
    const dealHeroTitle = document.getElementById("dealHeroTitle");
    const dealCustomerLink = document.getElementById("dealCustomerLink");
    const dealCustomerName = document.getElementById("dealCustomerName");
    const statDealAmount = document.getElementById("statDealAmount");
    const statDealStage = document.getElementById("statDealStage");
    const statDealProb = document.getElementById("statDealProb");
    const statDealCloseDate = document.getElementById("statDealCloseDate");
    const statDealStatus = document.getElementById("statDealStatus");
    const dealStageStepper = document.getElementById("dealStageStepper");

    // Action Buttons
    const btnOpenShareModal = document.getElementById("btnOpenShareModal");
    const btnTransferOwnerTop = document.getElementById("btnTransferOwnerTop");
    const btnTransferOwnerCard = document.getElementById("btnTransferOwnerCard");
    const btnCardAddCollaborator = document.getElementById("btnCardAddCollaborator");
    const btnQuickLogActivityTop = document.getElementById("btnQuickLogActivityTop");

    // Team Container
    const ownerAvatar = document.getElementById("ownerAvatar");
    const ownerFullName = document.getElementById("ownerFullName");
    const ownerDepartment = document.getElementById("ownerDepartment");
    const collaboratorsListContainer = document.getElementById("collaboratorsListContainer");
    const teamMemberCountBadge = document.getElementById("teamMemberCountBadge");

    // Detail Info Elements
    const detailCustomerCompany = document.getElementById("detailCustomerCompany");
    const detailContactPerson = document.getElementById("detailContactPerson");
    const detailProductInterest = document.getElementById("detailProductInterest");
    const detailDealNotes = document.getElementById("detailDealNotes");

    // Activity Log & Timeline Elements
    const activityTimelineContainer = document.getElementById("activityTimelineContainer");
    const quickLogForm = document.getElementById("quickLogForm");
    const quickLogActorLabel = document.getElementById("quickLogActorLabel");
    const quickLogDate = document.getElementById("quickLogDate");
    const quickLogType = document.getElementById("quickLogType");
    const quickLogNote = document.getElementById("quickLogNote");

    // Share Modal Elements
    const shareModalOverlay = document.getElementById("shareModalOverlay");
    const shareModalDialog = document.getElementById("shareModalDialog");
    const btnCloseShareModal = document.getElementById("btnCloseShareModal");
    const btnCancelShareModal = document.getElementById("btnCancelShareModal");
    const formShareDeal = document.getElementById("formShareDeal");
    const searchEmployeeInput = document.getElementById("searchEmployeeInput");
    const employeePickerList = document.getElementById("employeePickerList");
    const selectedEmployeeId = document.getElementById("selectedEmployeeId");
    const collaboratorRoleSelect = document.getElementById("collaboratorRoleSelect");
    const collaboratorAssignNote = document.getElementById("collaboratorAssignNote");

    // Transfer Owner Modal Elements
    const transferModalOverlay = document.getElementById("transferModalOverlay");
    const transferModalDialog = document.getElementById("transferModalDialog");
    const btnCloseTransferModal = document.getElementById("btnCloseTransferModal");
    const btnCancelTransferModal = document.getElementById("btnCancelTransferModal");
    const formTransferOwner = document.getElementById("formTransferOwner");
    const currentOwnerNameInput = document.getElementById("currentOwnerNameInput");
    const newOwnerSelect = document.getElementById("newOwnerSelect");
    const keepCurrentOwnerAsCollab = document.getElementById("keepCurrentOwnerAsCollab");
    const transferReason = document.getElementById("transferReason");

    // Log Activity Modal Elements
    const logActModalOverlay = document.getElementById("logActModalOverlay");
    const logActModalDialog = document.getElementById("logActModalDialog");
    const btnCloseLogActModal = document.getElementById("btnCloseLogActModal");
    const btnCancelLogActModal = document.getElementById("btnCancelLogActModal");
    const formLogActivityModal = document.getElementById("formLogActivityModal");
    const modalLogType = document.getElementById("modalLogType");
    const modalLogDate = document.getElementById("modalLogDate");
    const modalLogActorSelect = document.getElementById("modalLogActorSelect");
    const modalLogContent = document.getElementById("modalLogContent");

    /* =========================================================
       INITIALIZATION
    ========================================================= */
    document.addEventListener("DOMContentLoaded", async () => {
        initEmployees();
        await loadOpportunitiesData();
        setupRoleSimulator();
        setupEventListeners();
        renderDealDetails();
    });

    function initEmployees() {
        try {
            const cached = localStorage.getItem(STORAGE_KEY_EMPLOYEES);
            if (!cached) {
                localStorage.setItem(STORAGE_KEY_EMPLOYEES, JSON.stringify(DEFAULT_EMPLOYEES));
            }
        } catch (_) {}
    }

    function getEmployees() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY_EMPLOYEES);
            if (raw) return JSON.parse(raw);
        } catch (_) {}
        return DEFAULT_EMPLOYEES;
    }

    async function loadOpportunitiesData() {
        try {
            const res = await fetch(API_BASE + "/api/opportunities", {
                credentials: "include",
                headers: { "Accept": "application/json" }
            });
            if (res.ok) {
                const json = await res.json();
                if (json.success && Array.isArray(json.data) && json.data.length > 0) {
                    allOpportunities = json.data;
                }
            }
        } catch (_) {}

        if (!allOpportunities || allOpportunities.length === 0) {
            try {
                const cached = JSON.parse(localStorage.getItem(STORAGE_KEY_OPPORTUNITIES));
                if (Array.isArray(cached) && cached.length > 0) {
                    allOpportunities = cached;
                }
            } catch (_) {}
        }

        // Check if opportunities have deal team structure. If not, populate rich mock deals.
        const hasTeamStructure = allOpportunities.some(o => Array.isArray(o.collaborators));
        if (!allOpportunities.length || !hasTeamStructure) {
            allOpportunities = getInitialMockOpportunities();
            saveOpportunitiesToStorage();
        }

        // Get target deal from query param ?id=...
        const urlParams = new URLSearchParams(window.location.search);
        const dealId = Number(urlParams.get("id"));

        if (dealId) {
            currentDeal = allOpportunities.find(o => Number(o.id) === dealId);
        }
        if (!currentDeal && allOpportunities.length > 0) {
            currentDeal = allOpportunities[0];
        }

        // Ensure deal has required collaborators and activityLog arrays
        if (currentDeal) {
            if (!Array.isArray(currentDeal.collaborators)) currentDeal.collaborators = [];
            if (!Array.isArray(currentDeal.activityLog)) currentDeal.activityLog = [];
            if (!currentDeal.ownerId) {
                currentDeal.ownerId = 1;
                currentDeal.ownerName = "Trần Thị Thu Hà";
                currentDeal.ownerRole = "Trưởng nhóm Kinh doanh Miền Bắc";
                currentDeal.ownerEmail = "lead.mienbac@crm.local";
            }
        }
    }

    function saveOpportunitiesToStorage() {
        try {
            localStorage.setItem(STORAGE_KEY_OPPORTUNITIES, JSON.stringify(allOpportunities));
            document.dispatchEvent(new CustomEvent("crm:deal-team-updated", { detail: { deal: currentDeal } }));
        } catch (e) {
            console.warn("Could not save to localStorage:", e);
        }
    }

    /* =========================================================
       RICH MOCK OPPORTUNITIES DATASET
    ========================================================= */
    function getInitialMockOpportunities() {
        return [
            {
                id: 101,
                name: "Triển khai phần mềm ERP đa chi nhánh",
                customerId: 1,
                customerName: "Tập đoàn Công nghiệp Foxconn VN",
                contactPerson: "Ông Trần Quốc Bảo (Giám đốc CNTT) - 0988.123.456",
                productInterest: "Hệ thống ERP Doanh nghiệp Cloud Edition đa nhà máy",
                notes: "Khách hàng có 3 nhà máy tại Bắc Giang và Bắc Ninh. Cần giải pháp kết nối dữ liệu sản xuất và tài chính thời gian thực. Đội ngũ kỹ thuật (Pre-sales) cần phối hợp chặt chẽ để trả lời bài toán bảo mật hệ thống.",
                stageId: 3,
                stageName: "Gửi đề xuất & Báo giá",
                amount: 850000000,
                probability: 60,
                expectedCloseDate: "2026-11-15",
                status: "OPEN",
                ownerId: 1,
                ownerName: "Trần Thị Thu Hà",
                ownerRole: "Trưởng nhóm Kinh doanh Miền Bắc",
                ownerEmail: "lead.mienbac@crm.local",
                ownerPhone: "0912.000.002",
                collaborators: [
                    {
                        id: 2,
                        name: "Lê Hoàng Nam",
                        email: "sale.hn1@crm.local",
                        phone: "0912.000.003",
                        roleInDeal: "Chuyên viên Kinh doanh Phối hợp",
                        department: "Khối Kinh doanh",
                        addedAt: "2026-10-15 09:30",
                        permission: "VIEW_AND_LOG",
                        avatarBg: "#059669"
                    },
                    {
                        id: 4,
                        name: "Bùi Đức Thành",
                        email: "thanh.bd@crm.local",
                        phone: "0912.000.011",
                        roleInDeal: "Kỹ sư Giải pháp (Solution Architect)",
                        department: "Kỹ thuật & Pre-Sales",
                        addedAt: "2026-10-16 14:15",
                        permission: "VIEW_AND_LOG",
                        avatarBg: "#7c3aed"
                    },
                    {
                        id: 5,
                        name: "Võ Minh Thư",
                        email: "thu.vm@crm.local",
                        phone: "0912.000.012",
                        roleInDeal: "Chuyên viên Pháp chế & Hợp đồng",
                        department: "Pháp lý & Tuân thủ",
                        addedAt: "2026-10-18 10:00",
                        permission: "VIEW_AND_LOG",
                        avatarBg: "#0891b2"
                    }
                ],
                activityLog: [
                    {
                        id: 1,
                        timestamp: "2026-10-14 09:00",
                        actor: "Trần Thị Thu Hà",
                        type: "CREATE_DEAL",
                        title: "Khởi tạo cơ hội",
                        details: "Tiếp nhận nhu cầu nâng cấp hệ thống ERP từ buổi hội thảo Chuyển đổi số công nghiệp."
                    },
                    {
                        id: 2,
                        timestamp: "2026-10-15 09:30",
                        actor: "Trần Thị Thu Hà",
                        type: "SHARE_DEAL",
                        title: "Chia sẻ cho thành viên mới",
                        details: "Trần Thị Thu Hà đã thêm Lê Hoàng Nam vào cơ hội với vai trò 'Chuyên viên Kinh doanh Phối hợp'."
                    },
                    {
                        id: 3,
                        timestamp: "2026-10-16 14:15",
                        actor: "Trần Thị Thu Hà",
                        type: "SHARE_DEAL",
                        title: "Chia sẻ cho thành viên mới",
                        details: "Trần Thị Thu Hà đã thêm Bùi Đức Thành vào cơ hội với vai trò 'Kỹ sư Giải pháp (Solution Architect)' để phụ trách demo kỹ thuật."
                    },
                    {
                        id: 4,
                        timestamp: "2026-10-17 15:30",
                        actor: "Bùi Đức Thành",
                        type: "LOG_ACTIVITY",
                        title: "Họp demo giải pháp kỹ thuật",
                        details: "Đã hoàn thành buổi demo online 2 tiếng với Ban CNTT Foxconn. Khách hàng đánh giá cao tốc độ phản hồi và khả năng mở rộng API."
                    },
                    {
                        id: 5,
                        timestamp: "2026-10-18 10:00",
                        actor: "Trần Thị Thu Hà",
                        type: "SHARE_DEAL",
                        title: "Chia sẻ cho thành viên mới",
                        details: "Trần Thị Thu Hà đã thêm Võ Minh Thư vào cơ hội với vai trò 'Chuyên viên Pháp chế & Hợp đồng' để chuẩn bị điều khoản NDA và dự thảo hợp đồng."
                    },
                    {
                        id: 6,
                        timestamp: "2026-10-19 11:20",
                        actor: "Lê Hoàng Nam",
                        type: "LOG_ACTIVITY",
                        title: "Cuộc gọi trao đổi thương mại",
                        details: "Đã gọi cho Phó phòng Mua hàng của Foxconn để làm rõ cấu trúc thanh toán theo giai đoạn bàn giao."
                    }
                ]
            },
            {
                id: 102,
                name: "Gói bảo trì và nâng cấp hạ tầng Cloud",
                customerId: 2,
                customerName: "Ngân hàng TMCP VPBank - CN Thăng Long",
                contactPerson: "Bà Nguyễn Mai Lan (Trưởng ban Mua sắm)",
                productInterest: "Dịch vụ Quản trị Hạ tầng Cloud 24/7",
                notes: "Hợp đồng SLA 99.99%. Cần đội ngũ kỹ sư trực sẵn sàng đáp ứng yêu cầu an toàn thông tin ngành ngân hàng.",
                stageId: 4,
                stageName: "Thương lượng & Đàm phán",
                amount: 320000000,
                probability: 80,
                expectedCloseDate: "2026-10-30",
                status: "OPEN",
                ownerId: 2,
                ownerName: "Lê Hoàng Nam",
                ownerRole: "Chuyên viên Kinh doanh B2B (Senior)",
                ownerEmail: "sale.hn1@crm.local",
                ownerPhone: "0912.000.003",
                collaborators: [
                    {
                        id: 4,
                        name: "Bùi Đức Thành",
                        email: "thanh.bd@crm.local",
                        phone: "0912.000.011",
                        roleInDeal: "Kỹ sư Giải pháp (Solution Architect)",
                        department: "Kỹ thuật & Pre-Sales",
                        addedAt: "2026-10-10 11:00",
                        permission: "VIEW_AND_LOG",
                        avatarBg: "#7c3aed"
                    }
                ],
                activityLog: [
                    {
                        id: 1,
                        timestamp: "2026-10-10 11:00",
                        actor: "Lê Hoàng Nam",
                        type: "SHARE_DEAL",
                        title: "Chia sẻ cho thành viên mới",
                        details: "Lê Hoàng Nam đã thêm Bùi Đức Thành vào cơ hội để phối hợp tính toán tài nguyên server."
                    }
                ]
            }
        ];
    }

    /* =========================================================
       ROLE SIMULATION SETUP (AC2 TESTING)
    ========================================================= */
    function setupRoleSimulator() {
        if (!userRoleSimulator) return;
        userRoleSimulator.innerHTML = "";

        const employees = getEmployees();
        employees.forEach(emp => {
            const opt = document.createElement("option");
            opt.value = String(emp.id);
            const isOwner = currentDeal && Number(currentDeal.ownerId) === emp.id;
            const isCollab = currentDeal && currentDeal.collaborators?.some(c => Number(c.id) === emp.id);

            let roleSuffix = "";
            if (isOwner) roleSuffix = " (👑 Owner chính)";
            else if (isCollab) roleSuffix = " (👥 Collaborator - Thành viên tham gia)";
            else roleSuffix = " (Nhân viên khác)";

            opt.textContent = `${emp.name} - ${emp.role}${roleSuffix}`;
            userRoleSimulator.appendChild(opt);
        });

        // Set default selection to current simulated user
        userRoleSimulator.value = String(currentSimulatedUser.id);

        userRoleSimulator.addEventListener("change", () => {
            const selectedId = Number(userRoleSimulator.value);
            const found = employees.find(e => e.id === selectedId);
            if (found) {
                currentSimulatedUser = found;
                updateUIPermissionsByRole();
                renderQuickLogActor();
            }
        });

        updateUIPermissionsByRole();
    }

    function updateUIPermissionsByRole() {
        if (!currentDeal) return;
        const isOwner = Number(currentDeal.ownerId) === currentSimulatedUser.id;
        const isLeadOrDirector = currentSimulatedUser.role.includes("Trưởng nhóm") || currentSimulatedUser.role.includes("Giám đốc");
        const isCollab = currentDeal.collaborators?.some(c => Number(c.id) === currentSimulatedUser.id);

        // AC2 Rule: Collaborators can VIEW and LOG activity, but CANNOT transfer owner or delete deal
        const canTransferOwner = isOwner || isLeadOrDirector;

        if (btnTransferOwnerTop) {
            btnTransferOwnerTop.disabled = !canTransferOwner;
            btnTransferOwnerTop.style.opacity = canTransferOwner ? "1" : "0.5";
            btnTransferOwnerTop.style.cursor = canTransferOwner ? "pointer" : "not-allowed";
            btnTransferOwnerTop.title = canTransferOwner
                ? "Chuyển giao người sở hữu chính"
                : "Thành viên được chia sẻ không thể đổi người sở hữu chính (theo tiêu chí SCRUM-82)";
        }

        if (btnTransferOwnerCard) {
            btnTransferOwnerCard.disabled = !canTransferOwner;
            btnTransferOwnerCard.style.opacity = canTransferOwner ? "1" : "0.5";
            btnTransferOwnerCard.style.cursor = canTransferOwner ? "pointer" : "not-allowed";
            btnTransferOwnerCard.title = canTransferOwner
                ? "Chuyển giao người sở hữu chính"
                : "Chỉ Người sở hữu chính mới có quyền chuyển giao thương vụ";
        }

        // Update note in simulation banner
        if (rolePermissionNote) {
            if (isOwner) {
                rolePermissionNote.innerHTML = `<span style="color:#16a34a; font-weight:600;">👑 Bạn là Người sở hữu chính:</span> Có toàn quyền quản lý, thêm/bớt thành viên và chuyển giao cơ hội.`;
            } else if (isCollab) {
                rolePermissionNote.innerHTML = `<span style="color:#2563eb; font-weight:600;">👥 Bạn là Thành viên cùng tham gia (AC2):</span> Có quyền xem & ghi lịch sử tương tác, <strong style="color:#dc2626;">không thể đổi người sở hữu chính</strong>.`;
            } else if (isLeadOrDirector) {
                rolePermissionNote.innerHTML = `<span style="color:#7c3aed; font-weight:600;">⭐ Quyền Trưởng nhóm / Quản lý:</span> Có quyền giám sát, chia sẻ và can thiệp toàn bộ thương vụ.`;
            } else {
                rolePermissionNote.innerHTML = `<span style="color:#64748b;">Chưa thuộc đội ngũ thương vụ này.</span>`;
            }
        }
    }

    /* =========================================================
       RENDER DEAL DETAILS
    ========================================================= */
    function renderDealDetails() {
        if (!currentDeal) return;

        // Breadcrumb
        if (breadcrumbCustomerName) breadcrumbCustomerName.textContent = currentDeal.customerName || "Khách hàng";
        if (breadcrumbDealName) breadcrumbDealName.textContent = currentDeal.name || "Chi tiết cơ hội";

        // Hero Card
        if (dealCodeDisplay) dealCodeDisplay.textContent = `#DEAL-${currentDeal.id}`;
        if (dealHeroTitle) dealHeroTitle.textContent = currentDeal.name || "Cơ hội không tên";
        if (dealCustomerName) dealCustomerName.textContent = currentDeal.customerName || "Chưa có tên khách hàng";
        if (dealCustomerLink) dealCustomerLink.href = `customers.html?search=${encodeURIComponent(currentDeal.customerName || "")}`;

        // Ribbon Stats
        if (statDealAmount) statDealAmount.textContent = formatMoney(currentDeal.amount || 0);
        if (statDealStage) statDealStage.textContent = currentDeal.stageName || "Giai đoạn";
        if (statDealProb) statDealProb.textContent = `${currentDeal.probability || 0}%`;
        if (statDealCloseDate) statDealCloseDate.textContent = formatDate(currentDeal.expectedCloseDate);

        // Status Badge
        if (statDealStatus) {
            if (currentDeal.status === "WON") {
                statDealStatus.innerHTML = `<span class="status-badge status-won">✓ Đã Chốt Thắng</span>`;
            } else if (currentDeal.status === "LOST") {
                statDealStatus.innerHTML = `<span class="status-badge status-lost">✕ Đã Đóng Thua</span>`;
            } else {
                statDealStatus.innerHTML = `<span class="status-badge status-open">● Đang theo đuổi</span>`;
            }
        }

        // Render Stage Stepper
        renderStageStepper();

        // Render Deal Team Section (Owner + Collaborators)
        renderDealTeam();

        // Render Detail Info
        if (detailCustomerCompany) detailCustomerCompany.textContent = currentDeal.customerName || "—";
        if (detailContactPerson) detailContactPerson.textContent = currentDeal.contactPerson || "Chưa cập nhật người liên hệ";
        if (detailProductInterest) detailProductInterest.textContent = currentDeal.productInterest || "Giải pháp CRM Doanh nghiệp";
        if (detailDealNotes) detailDealNotes.textContent = currentDeal.notes || "Chưa có ghi chú đặc biệt cho thương vụ này.";

        // Render Activity Log
        renderActivityTimeline();
        renderQuickLogActor();
        updateUIPermissionsByRole();
    }

    /* Stage Stepper */
    function renderStageStepper() {
        if (!dealStageStepper) return;
        dealStageStepper.innerHTML = "";

        const currentStageIdx = STAGES.findIndex(s => s.id === currentDeal.stageId);

        STAGES.forEach((st, idx) => {
            const stepItem = document.createElement("div");
            stepItem.className = "step-item";

            if (idx === currentStageIdx) stepItem.classList.add("active");
            else if (idx < currentStageIdx) stepItem.classList.add("completed");

            stepItem.innerHTML = `
                <div class="step-num">${idx + 1}</div>
                <div class="step-name" title="${escapeHtml(st.name)}">${escapeHtml(st.name)}</div>
                <div class="step-prob">${st.probability}%</div>
            `;

            stepItem.addEventListener("click", () => {
                if (currentDeal.stageId === st.id) return;
                const oldStage = currentDeal.stageName;
                currentDeal.stageId = st.id;
                currentDeal.stageName = st.name;
                currentDeal.probability = st.probability;

                // Log activity
                logEvent("STAGE_CHANGE", "Chuyển giai đoạn thương vụ", `${currentSimulatedUser.name} đã chuyển giai đoạn từ "${oldStage}" sang "${st.name}" (${st.probability}% xác suất thắng).`);
                saveOpportunitiesToStorage();
                renderDealDetails();
            });

            dealStageStepper.appendChild(stepItem);
        });
    }

    /* Render Deal Team (Owner & Collaborators - AC1) */
    function renderDealTeam() {
        // Owner Details
        if (ownerAvatar) ownerAvatar.textContent = initials(currentDeal.ownerName || "O");
        if (ownerFullName) ownerFullName.textContent = currentDeal.ownerName || "Chưa phân công";
        if (ownerDepartment) {
            ownerDepartment.textContent = `${currentDeal.ownerRole || "Chuyên viên"} • ${currentDeal.ownerEmail || ""}`;
        }

        // Collaborators
        const collabs = currentDeal.collaborators || [];
        if (teamMemberCountBadge) {
            teamMemberCountBadge.textContent = `${collabs.length + 1} thành viên`;
        }

        if (!collaboratorsListContainer) return;
        collaboratorsListContainer.innerHTML = "";

        if (collabs.length === 0) {
            collaboratorsListContainer.innerHTML = `
                <div class="collab-empty">
                    <p style="margin:0 0 6px; font-weight:600;">Chưa có thành viên nào được chia sẻ cùng thương vụ.</p>
                    <span>Bấm <strong>"+ Thêm thành viên phối hợp"</strong> để mời Pre-sales, Kỹ thuật hoặc Pháp chế cùng hỗ trợ.</span>
                </div>
            `;
            return;
        }

        collabs.forEach(collab => {
            const card = document.createElement("div");
            card.className = "collaborator-card";

            card.innerHTML = `
                <div class="collab-left">
                    <div class="collab-avatar" style="background:${collab.avatarBg || '#2563eb'}">
                        ${initials(collab.name)}
                    </div>
                    <div class="collab-info">
                        <div class="collab-name">
                            <span>${escapeHtml(collab.name)}</span>
                            <span class="collab-role-badge">${escapeHtml(collab.roleInDeal || "Cùng tham gia")}</span>
                        </div>
                        <div class="collab-meta">
                            <span>${escapeHtml(collab.department || "Khối Kinh doanh")}</span>
                            <span>•</span>
                            <span>${escapeHtml(collab.email || "")}</span>
                            <span class="collab-perm-badge" title="Có quyền xem chi tiết và ghi nhật ký hoạt động">👁️ Xem & Ghi hoạt động</span>
                        </div>
                    </div>
                </div>

                <div class="collab-actions">
                    <button type="button" class="btn-remove-collab" data-remove-id="${collab.id}" title="Xóa thành viên khỏi đội ngũ">
                        🗑️ Xóa
                    </button>
                </div>
            `;

            collaboratorsListContainer.appendChild(card);
        });

        // Attach remove collaborator events
        collaboratorsListContainer.querySelectorAll("[data-remove-id]").forEach(btn => {
            btn.addEventListener("click", () => {
                const idToRemove = Number(btn.dataset.removeId);
                removeCollaborator(idToRemove);
            });
        });
    }

    /* Render Activity Log Timeline (AC3) */
    function renderActivityTimeline() {
        if (!activityTimelineContainer) return;
        activityTimelineContainer.innerHTML = "";

        let logs = (currentDeal.activityLog || []).slice().reverse();

        if (activeLogFilter === "TEAM") {
            logs = logs.filter(l => l.type === "SHARE_DEAL" || l.type === "TRANSFER_OWNER" || l.type === "REMOVE_COLLABORATOR");
        } else if (activeLogFilter === "ACTIVITY") {
            logs = logs.filter(l => l.type === "LOG_ACTIVITY" || l.type === "CREATE_DEAL" || l.type === "STAGE_CHANGE");
        }

        if (logs.length === 0) {
            activityTimelineContainer.innerHTML = `
                <div style="text-align:center; padding:24px 10px; color:var(--crm-muted); font-size:12.5px;">
                    Chưa có nhật ký nào thuộc danh mục này.
                </div>
            `;
            return;
        }

        logs.forEach(log => {
            const item = document.createElement("div");
            item.className = "timeline-item";

            let dotClass = "dot-activity";
            let dotIcon = "📞";

            if (log.type === "SHARE_DEAL") {
                dotClass = "dot-share";
                dotIcon = "👥";
            } else if (log.type === "TRANSFER_OWNER") {
                dotClass = "dot-transfer";
                dotIcon = "🔄";
            } else if (log.type === "REMOVE_COLLABORATOR") {
                dotClass = "dot-remove";
                dotIcon = "✕";
            } else if (log.type === "CREATE_DEAL") {
                dotClass = "dot-share";
                dotIcon = "✨";
            } else if (log.type === "STAGE_CHANGE") {
                dotClass = "dot-activity";
                dotIcon = "📈";
            }

            item.innerHTML = `
                <div class="timeline-dot ${dotClass}">${dotIcon}</div>
                <div class="timeline-content">
                    <div class="timeline-top">
                        <span class="timeline-actor">${escapeHtml(log.title || "Nhật ký")}</span>
                        <span class="timeline-time">${escapeHtml(log.timestamp || "")}</span>
                    </div>
                    <div class="timeline-body">${escapeHtml(log.details || "")}</div>
                    <small style="display:block; margin-top:4px; font-size:11px; color:var(--crm-muted);">
                        Thực hiện bởi: <strong>${escapeHtml(log.actor || "Hệ thống")}</strong>
                    </small>
                </div>
            `;

            activityTimelineContainer.appendChild(item);
        });
    }

    function renderQuickLogActor() {
        if (quickLogActorLabel) {
            quickLogActorLabel.textContent = `Người ghi: ${currentSimulatedUser.name}`;
        }
        if (quickLogDate && !quickLogDate.value) {
            quickLogDate.value = new Date().toISOString().split("T")[0];
        }
    }

    /* Helper: Log Event into Activity Log (AC3) */
    function logEvent(type, title, details) {
        if (!currentDeal.activityLog) currentDeal.activityLog = [];
        const now = new Date();
        const timeStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}`;

        currentDeal.activityLog.push({
            id: Date.now(),
            timestamp: timeStr,
            actor: currentSimulatedUser.name,
            type,
            title,
            details
        });
    }

    /* =========================================================
       COLLABORATOR MANAGEMENT (AC1 & AC3)
    ========================================================= */
    function openShareModal() {
        if (!shareModalDialog || !shareModalOverlay) return;
        renderEmployeePickerList();
        shareModalOverlay.classList.add("open");
        shareModalDialog.classList.add("open");
    }

    function closeShareModal() {
        if (shareModalDialog) shareModalDialog.classList.remove("open");
        if (shareModalOverlay) shareModalOverlay.classList.remove("open");
        if (formShareDeal) formShareDeal.reset();
        if (selectedEmployeeId) selectedEmployeeId.value = "";
    }

    function renderEmployeePickerList(keyword = "") {
        if (!employeePickerList) return;
        employeePickerList.innerHTML = "";

        const allEmps = getEmployees();
        const currentCollabIds = (currentDeal.collaborators || []).map(c => Number(c.id));
        const ownerId = Number(currentDeal.ownerId);

        // Filter out employees already in the deal
        const available = allEmps.filter(e => {
            if (e.id === ownerId || currentCollabIds.includes(e.id)) return false;
            if (!keyword) return true;
            const text = `${e.name} ${e.email} ${e.role} ${e.department}`.toLowerCase();
            return text.includes(keyword.toLowerCase());
        });

        if (available.length === 0) {
            employeePickerList.innerHTML = `
                <div style="padding:16px; text-align:center; color:var(--crm-muted); font-size:12.5px;">
                    Không tìm thấy nhân sự phù hợp hoặc tất cả đã được thêm vào cơ hội.
                </div>
            `;
            return;
        }

        available.forEach(emp => {
            const item = document.createElement("div");
            item.className = "user-picker-item";
            item.dataset.empId = String(emp.id);

            item.innerHTML = `
                <div class="user-picker-avatar" style="background:${emp.avatarBg || '#2563eb'}">
                    ${initials(emp.name)}
                </div>
                <div style="flex:1; min-width:0;">
                    <div style="font-weight:600; font-size:13px; color:var(--crm-text);">${escapeHtml(emp.name)}</div>
                    <div style="font-size:11.5px; color:var(--crm-muted);">${escapeHtml(emp.role)} • ${escapeHtml(emp.department)}</div>
                </div>
                <span style="font-size:11px; color:var(--crm-primary); font-weight:600;">+ Chọn</span>
            `;

            item.addEventListener("click", () => {
                employeePickerList.querySelectorAll(".user-picker-item").forEach(el => el.classList.remove("selected"));
                item.classList.add("selected");
                if (selectedEmployeeId) selectedEmployeeId.value = String(emp.id);
            });

            employeePickerList.appendChild(item);
        });
    }

    /* Add Collaborator Submit */
    function handleShareDealSubmit(event) {
        event.preventDefault();
        const empId = Number(selectedEmployeeId.value);
        if (!empId) {
            alert("Vui lòng chọn một nhân sự từ danh sách.");
            return;
        }

        const employees = getEmployees();
        const targetEmp = employees.find(e => e.id === empId);
        if (!targetEmp) return;

        const roleInDeal = collaboratorRoleSelect.value;
        const note = collaboratorAssignNote.value.trim();

        const now = new Date();
        const timeStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}`;

        // Add collaborator to deal
        if (!currentDeal.collaborators) currentDeal.collaborators = [];
        currentDeal.collaborators.push({
            id: targetEmp.id,
            name: targetEmp.name,
            email: targetEmp.email,
            phone: targetEmp.phone,
            roleInDeal,
            department: targetEmp.department,
            addedAt: timeStr,
            permission: "VIEW_AND_LOG",
            avatarBg: targetEmp.avatarBg
        });

        // AC3: Automatically log activity event
        let detailText = `${currentSimulatedUser.name} đã chia sẻ cơ hội cho ${targetEmp.name} với vai trò "${roleInDeal}".`;
        if (note) detailText += ` Ghi chú phân công: "${note}".`;

        logEvent("SHARE_DEAL", "Thêm thành viên vào cơ hội", detailText);

        saveOpportunitiesToStorage();
        closeShareModal();
        renderDealDetails();
        setupRoleSimulator();

        showToast(`Đã thêm thành công ${targetEmp.name} vào đội ngũ phối hợp!`);
    }

    /* Remove Collaborator (AC1 & AC3) */
    function removeCollaborator(collabId) {
        const collab = (currentDeal.collaborators || []).find(c => c.id === collabId);
        if (!collab) return;

        if (!confirm(`Bạn có chắc chắn muốn xóa "${collab.name}" khỏi danh sách phối hợp của cơ hội này không?`)) {
            return;
        }

        currentDeal.collaborators = currentDeal.collaborators.filter(c => c.id !== collabId);

        // AC3: Automatically log activity event
        logEvent("REMOVE_COLLABORATOR", "Xóa thành viên khỏi cơ hội", `${currentSimulatedUser.name} đã xóa ${collab.name} khỏi đội ngũ phối hợp.`);

        saveOpportunitiesToStorage();
        renderDealDetails();
        setupRoleSimulator();

        showToast(`Đã xóa ${collab.name} khỏi đội ngũ cơ hội.`);
    }

    /* =========================================================
       TRANSFER DEAL OWNERSHIP (AC2 & AC3)
    ========================================================= */
    function openTransferModal() {
        if (!transferModalDialog || !transferModalOverlay) return;

        if (currentOwnerNameInput) {
            currentOwnerNameInput.value = `${currentDeal.ownerName} (${currentDeal.ownerRole || "Deal Owner"})`;
        }

        if (newOwnerSelect) {
            newOwnerSelect.innerHTML = `<option value="">-- Chọn Người sở hữu mới --</option>`;
            const employees = getEmployees();
            employees.forEach(emp => {
                if (emp.id !== Number(currentDeal.ownerId)) {
                    const opt = document.createElement("option");
                    opt.value = String(emp.id);
                    opt.textContent = `${emp.name} - ${emp.role} (${emp.department})`;
                    newOwnerSelect.appendChild(opt);
                }
            });
        }

        if (transferReason) transferReason.value = "";
        transferModalOverlay.classList.add("open");
        transferModalDialog.classList.add("open");
    }

    function closeTransferModal() {
        if (transferModalDialog) transferModalDialog.classList.remove("open");
        if (transferModalOverlay) transferModalOverlay.classList.remove("open");
    }

    function handleTransferOwnerSubmit(event) {
        event.preventDefault();
        const newOwnerId = Number(newOwnerSelect.value);
        if (!newOwnerId) {
            alert("Vui lòng chọn Người sở hữu mới.");
            return;
        }

        const reason = transferReason.value.trim();
        if (!reason) {
            alert("Vui lòng nhập lý do chuyển giao quyền sở hữu.");
            return;
        }

        const employees = getEmployees();
        const newOwner = employees.find(e => e.id === newOwnerId);
        if (!newOwner) return;

        const oldOwnerName = currentDeal.ownerName;
        const oldOwnerId = currentDeal.ownerId;
        const oldOwnerEmail = currentDeal.ownerEmail;
        const oldOwnerRole = currentDeal.ownerRole;

        // Update Deal Owner
        currentDeal.ownerId = newOwner.id;
        currentDeal.ownerName = newOwner.name;
        currentDeal.ownerRole = newOwner.role;
        currentDeal.ownerEmail = newOwner.email;
        currentDeal.ownerPhone = newOwner.phone;

        // If new owner was in collaborators list, remove them from collaborators
        currentDeal.collaborators = (currentDeal.collaborators || []).filter(c => c.id !== newOwner.id);

        // If checkbox is checked, retain old owner as collaborator
        if (keepCurrentOwnerAsCollab?.checked) {
            const now = new Date();
            const timeStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}`;
            currentDeal.collaborators.push({
                id: oldOwnerId,
                name: oldOwnerName,
                email: oldOwnerEmail,
                roleInDeal: "Cố vấn / Cựu Owner",
                department: "Khối Kinh doanh",
                addedAt: timeStr,
                permission: "VIEW_AND_LOG",
                avatarBg: "#d97706"
            });
        }

        // AC3: Automatically log activity event
        logEvent(
            "TRANSFER_OWNER",
            "Chuyển giao quyền sở hữu chính",
            `${currentSimulatedUser.name} đã chuyển quyền sở hữu thương vụ từ "${oldOwnerName}" sang "${newOwner.name}". Lý do: "${reason}".`
        );

        saveOpportunitiesToStorage();
        closeTransferModal();
        renderDealDetails();
        setupRoleSimulator();

        showToast(`Đã chuyển thành công quyền sở hữu chính cho ${newOwner.name}!`);
    }

    /* =========================================================
       LOG ACTIVITY (AC2 & AC3)
    ========================================================= */
    function handleQuickLogSubmit(event) {
        event.preventDefault();
        const note = quickLogNote.value.trim();
        if (!note) return;

        const type = quickLogType.value;
        const dateVal = quickLogDate.value || new Date().toISOString().split("T")[0];

        logEvent("LOG_ACTIVITY", type, `[${dateVal}] ${note}`);

        quickLogNote.value = "";
        saveOpportunitiesToStorage();
        renderActivityTimeline();
        showToast("Đã lưu hoạt động thành công vào nhật ký!");
    }

    function openLogActivityModal() {
        if (!logActModalDialog || !logActModalOverlay) return;

        if (modalLogDate) {
            modalLogDate.value = new Date().toISOString().split("T")[0];
        }

        if (modalLogActorSelect) {
            modalLogActorSelect.innerHTML = "";
            // Add Owner
            const optOwner = document.createElement("option");
            optOwner.value = currentDeal.ownerName;
            optOwner.textContent = `${currentDeal.ownerName} (👑 Owner)`;
            modalLogActorSelect.appendChild(optOwner);

            // Add Collaborators
            (currentDeal.collaborators || []).forEach(c => {
                const opt = document.createElement("option");
                opt.value = c.name;
                opt.textContent = `${c.name} (${c.roleInDeal})`;
                modalLogActorSelect.appendChild(opt);
            });

            modalLogActorSelect.value = currentSimulatedUser.name;
        }

        if (modalLogContent) modalLogContent.value = "";
        logActModalOverlay.classList.add("open");
        logActModalDialog.classList.add("open");
    }

    function closeLogActivityModal() {
        if (logActModalDialog) logActModalDialog.classList.remove("open");
        if (logActModalOverlay) logActModalOverlay.classList.remove("open");
    }

    function handleModalLogActivitySubmit(event) {
        event.preventDefault();
        const content = modalLogContent.value.trim();
        if (!content) return;

        const type = modalLogType.value;
        const dateVal = modalLogDate.value || new Date().toISOString().split("T")[0];
        const actor = modalLogActorSelect.value || currentSimulatedUser.name;

        if (!currentDeal.activityLog) currentDeal.activityLog = [];
        const now = new Date();
        const timeStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}`;

        currentDeal.activityLog.push({
            id: Date.now(),
            timestamp: timeStr,
            actor,
            type: "LOG_ACTIVITY",
            title: type,
            details: `[${dateVal}] ${content}`
        });

        saveOpportunitiesToStorage();
        closeLogActivityModal();
        renderActivityTimeline();
        showToast("Đã lưu hoạt động tương tác thành công!");
    }

    /* =========================================================
       EVENT LISTENERS
    ========================================================= */
    function setupEventListeners() {
        // Modal Open / Close
        btnOpenShareModal?.addEventListener("click", openShareModal);
        btnCardAddCollaborator?.addEventListener("click", openShareModal);
        btnCloseShareModal?.addEventListener("click", closeShareModal);
        btnCancelShareModal?.addEventListener("click", closeShareModal);
        shareModalOverlay?.addEventListener("click", closeShareModal);
        formShareDeal?.addEventListener("submit", handleShareDealSubmit);

        searchEmployeeInput?.addEventListener("input", (e) => {
            renderEmployeePickerList(e.target.value.trim());
        });

        // Transfer Owner Modal
        btnTransferOwnerTop?.addEventListener("click", openTransferModal);
        btnTransferOwnerCard?.addEventListener("click", openTransferModal);
        btnCloseTransferModal?.addEventListener("click", closeTransferModal);
        btnCancelTransferModal?.addEventListener("click", closeTransferModal);
        transferModalOverlay?.addEventListener("click", closeTransferModal);
        formTransferOwner?.addEventListener("submit", handleTransferOwnerSubmit);

        // Quick Log Form
        quickLogForm?.addEventListener("submit", handleQuickLogSubmit);

        // Log Activity Modal
        btnQuickLogActivityTop?.addEventListener("click", openLogActivityModal);
        btnCloseLogActModal?.addEventListener("click", closeLogActivityModal);
        btnCancelLogActModal?.addEventListener("click", closeLogActivityModal);
        logActModalOverlay?.addEventListener("click", closeLogActivityModal);
        formLogActivityModal?.addEventListener("submit", handleModalLogActivitySubmit);

        // Activity Tabs Filter
        document.querySelectorAll(".act-tab-btn").forEach(btn => {
            btn.addEventListener("click", () => {
                document.querySelectorAll(".act-tab-btn").forEach(b => b.classList.remove("active"));
                btn.classList.add("active");
                activeLogFilter = btn.dataset.filterType || "ALL";
                renderActivityTimeline();
            });
        });

        // Cross-tab sync
        window.addEventListener("storage", (e) => {
            if (e.key === STORAGE_KEY_OPPORTUNITIES) {
                loadOpportunitiesData().then(() => renderDealDetails());
            }
        });
    }

    /* =========================================================
       UTILITIES & FORMATTERS
    ========================================================= */
    function formatMoney(amount) {
        return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount);
    }

    function formatDate(dateStr) {
        if (!dateStr) return "—";
        try {
            const d = new Date(dateStr);
            if (isNaN(d.getTime())) return dateStr;
            return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
        } catch (_) {
            return dateStr;
        }
    }

    function initials(name) {
        if (!name) return "U";
        const parts = name.trim().split(/\s+/);
        if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
        return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
    }

    function pad(n) {
        return n < 10 ? "0" + n : String(n);
    }

    function escapeHtml(value) {
        return String(value ?? "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    function showToast(message) {
        let toast = document.getElementById("crmGlobalToast");
        if (!toast) {
            toast = document.createElement("div");
            toast.id = "crmGlobalToast";
            toast.style.cssText = `
                position: fixed;
                bottom: 24px;
                right: 24px;
                background: #1e293b;
                color: #fff;
                padding: 12px 20px;
                border-radius: 8px;
                font-size: 13.5px;
                font-weight: 500;
                box-shadow: 0 10px 25px rgba(0,0,0,0.2);
                z-index: 9999;
                display: flex;
                align-items: center;
                gap: 8px;
                transition: opacity 300ms ease, transform 300ms ease;
                opacity: 0;
                transform: translateY(15px);
            `;
            document.body.appendChild(toast);
        }

        toast.innerHTML = `<span>✓</span> <span>${escapeHtml(message)}</span>`;
        toast.style.opacity = "1";
        toast.style.transform = "translateY(0)";

        setTimeout(() => {
            toast.style.opacity = "0";
            toast.style.transform = "translateY(15px)";
        }, 3200);
    }
})();
