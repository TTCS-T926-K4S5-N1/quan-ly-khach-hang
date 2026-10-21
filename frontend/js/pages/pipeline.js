"use strict";

const API_BASE = "http://localhost:8080/crm";

let stages = [];
let opportunities = [];
let customers = [];
let winReasons = [];
let lossReasons = [];
let competitors = [];

let draggedOppId = null;
let closingOppId = null;
let editingOppId = null;

const pipelineBoard = document.getElementById("pipelineBoard");
const opportunityDrawer = document.getElementById("opportunityDrawer");
const opportunityOverlay = document.getElementById("opportunityOverlay");
const opportunityForm = document.getElementById("opportunityForm");
const searchInput = document.getElementById("pipelineSearch");
const ownerFilter = document.getElementById("ownerFilter");

const dealModal = document.getElementById("closeDealModal");
const dealOverlay = document.getElementById("closeDealOverlay");

/* =========================================================
   API HELPER
========================================================= */
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

    const response = await fetch(API_BASE + path, config);
    let result = null;
    try {
        result = await response.json();
    } catch (_) {
        result = null;
    }

    if (response.status === 401) {
        localStorage.removeItem("crm_ui_session");
        window.location.href = "login";
        throw new Error("Phiên đăng nhập đã hết hạn.");
    }

    if (!response.ok || !result?.success) {
        const error = new Error(result?.message || `HTTP ${response.status}`);
        error.status = response.status;
        error.data = result?.data;
        throw error;
    }

    return result.data;
}

/* =========================================================
   INITIALIZATION
========================================================= */
async function initPipeline() {
    try {
        await Promise.all([
            loadStages(),
            loadWinLossAndCompetitors(),
            loadCustomers(),
            loadOpportunities()
        ]);
    } catch (err) {
        console.error("Initialization error:", err);
    }
}

async function loadStages() {
    try {
        const data = await api("/api/pipeline-stages?pipelineId=1");
        if (Array.isArray(data) && data.length > 0) {
            stages = data.map(s => ({
                id: s.id,
                name: s.name,
                orderNo: s.orderNo || s.stageOrder || 0,
                probability: s.probability !== undefined ? s.probability : (s.winProbability || 0),
                isWon: !!s.isWon,
                isLost: !!s.isLost
            })).sort((a, b) => a.orderNo - b.orderNo);
        }
    } catch (err) {
        console.warn("Could not load stages from API, using default stages:", err);
    }

    if (!stages || stages.length === 0) {
        stages = [
            { id: 1, name: "Khảo sát nhu cầu", orderNo: 1, probability: 10 },
            { id: 2, name: "Đánh giá & Xác định nhu cầu", orderNo: 2, probability: 25 },
            { id: 3, name: "Gửi đề xuất & Báo giá", orderNo: 3, probability: 50 },
            { id: 4, name: "Thương lượng & Đàm phán", orderNo: 4, probability: 75 },
            { id: 5, name: "Chốt thành công (Won)", orderNo: 5, probability: 100, isWon: true },
            { id: 6, name: "Đóng Thua (Lost)", orderNo: 6, probability: 0, isLost: true }
        ];
    }

    populateStageSelect();
}

async function loadWinLossAndCompetitors() {
    try {
        const reasons = await api("/api/win-loss-reasons");
        if (Array.isArray(reasons)) {
            winReasons = reasons.filter(r => (r.type || r.reasonType || "").toUpperCase() === "WIN" && (r.active !== false));
            lossReasons = reasons.filter(r => (r.type || r.reasonType || "").toUpperCase() === "LOSS" && (r.active !== false));
        }
    } catch (err) {
        console.warn("Could not load win/loss reasons:", err);
    }

    try {
        const comps = await api("/api/competitors");
        if (Array.isArray(comps)) {
            competitors = comps.filter(c => c.active !== false);
        }
    } catch (err) {
        console.warn("Could not load competitors:", err);
    }

    populateWinLossSelects();
}

const DEFAULT_CUSTOMERS_LIST = [
    { id: 1, name: "Tập đoàn Công nghiệp Foxconn VN", code: "KH-FOXCONN", phone: "024-3888-9999", email: "contact@foxconn.vn", taxCode: "0109988776" },
    { id: 2, name: "Ngân hàng TMCP VPBank - CN Thăng Long", code: "KH-VPBANK", phone: "024-3928-8888", email: "contact@vpbankthanglong.vn", taxCode: "0100233583" },
    { id: 3, name: "Công ty TNHH Dịch vụ & Du lịch Viettravel Sun", code: "KH-VIETTRAVEL", phone: "0903-124-578", email: "booking@viettravelsun.vn", taxCode: "0108923412" },
    { id: 4, name: "Chuỗi Bán lẻ Thời trang NEM Fashion", code: "KH-NEM", phone: "0936-112-233", email: "sales@nemfashion.vn", taxCode: "0103765432" },
    { id: 5, name: "Công ty Cổ phần Giải pháp Logistics LogiTech Việt Nam", code: "KH-LOGITECH", phone: "0918-776-655", email: "dispatch@logitech-vn.com", taxCode: "0201889922" },
    { id: 6, name: "Công ty Cổ phần Dược phẩm An Sinh Medicare", code: "KH-ANSINH", phone: "0977-889-900", email: "info@ansinhpharma.vn", taxCode: "0314567890" },
    { id: 7, name: "Tập đoàn Sản xuất & Chế tạo Cơ khí Nam Á", code: "KH-NAMA", phone: "0274-3899-222", email: "lienhe@nama-machinery.com.vn", taxCode: "3701239876" },
    { id: 8, name: "Hệ thống Trường Quốc tế Á Châu (Asian School)", code: "KH-ASIAN", phone: "028-3848-0740", email: "admissions@asianschool.edu.vn", taxCode: "0302456781" },
    { id: 9, name: "Chuỗi Cửa hàng Trà sữa TocoToco (Công ty CP Taco)", code: "KH-TOCO", phone: "1900-636-936", email: "marketing@tocotocotea.com", taxCode: "0106489012" },
    { id: 10, name: "Công ty Cổ phần Đầu tư Công nghệ Xanh GreenTech", code: "KH-GREENTECH", phone: "0905-667-788", email: "support@greentech-group.vn", taxCode: "0401998877" }
];

async function loadCustomers() {
    let apiSuccess = false;
    try {
        const list = await api("/api/customers");
        if (Array.isArray(list) && list.length > 0) {
            customers = list;
            apiSuccess = true;
            try {
                localStorage.setItem("crm_ui_customers", JSON.stringify(customers));
            } catch (_) {}
        }
    } catch (err) {
        console.warn("Could not load customers from API, checking localStorage:", err);
    }

    if (!apiSuccess || !customers || customers.length === 0) {
        try {
            const cached = JSON.parse(localStorage.getItem("crm_ui_customers"));
            if (Array.isArray(cached) && cached.length > 0) {
                customers = cached;
            }
        } catch (_) {}
    }

    if (!customers || customers.length === 0) {
        customers = [...DEFAULT_CUSTOMERS_LIST];
        try {
            localStorage.setItem("crm_ui_customers", JSON.stringify(customers));
        } catch (_) {}
    }

    populateCustomerSelect();
}

const DEFAULT_EMPLOYEES_LIST = [
    { id: 1, name: "Trần Thị Thu Hà", email: "lead.mienbac@crm.local", role: "Trưởng nhóm Kinh doanh Miền Bắc", department: "Khối Kinh doanh", avatarBg: "#2563eb" },
    { id: 2, name: "Lê Hoàng Nam", email: "sale.hn1@crm.local", role: "Chuyên viên Kinh doanh B2B (Senior)", department: "Khối Kinh doanh", avatarBg: "#059669" },
    { id: 3, name: "Phạm Mai Phương", email: "sale.hn2@crm.local", role: "Chuyên viên Kinh doanh", department: "Khối Kinh doanh", avatarBg: "#d97706" },
    { id: 4, name: "Bùi Đức Thành", email: "thanh.bd@crm.local", role: "Kỹ sư Giải pháp (Solution Architect)", department: "Kỹ thuật & Pre-Sales", avatarBg: "#7c3aed" },
    { id: 5, name: "Võ Minh Thư", email: "thu.vm@crm.local", role: "Chuyên viên Hợp đồng & Pháp chế", department: "Pháp chế & Tuân thủ", avatarBg: "#0891b2" },
    { id: 6, name: "Phan Văn Trung", email: "lead.mientrung@crm.local", role: "Trưởng nhóm Kinh doanh Miền Trung", department: "Khối Kinh doanh", avatarBg: "#dc2626" },
    { id: 7, name: "Đỗ Thị Tuyết", email: "sale.dn@crm.local", role: "Chuyên viên Kinh doanh Đà Nẵng", department: "Khối Kinh doanh", avatarBg: "#4f46e5" },
    { id: 8, name: "Vũ Minh Trí", email: "lead.miennam@crm.local", role: "Trưởng nhóm Kinh doanh Miền Nam", department: "Khối Kinh doanh", avatarBg: "#ea580c" },
    { id: 9, name: "Hoàng Kim Yến", email: "sale.hcm1@crm.local", role: "Chuyên viên Kinh doanh TP.HCM", department: "Khối Kinh doanh", avatarBg: "#db2777" },
    { id: 10, name: "Trương Tuấn Kiệt", email: "sale.hcm2@crm.local", role: "Chuyên viên Chăm sóc Khách hàng lớn (KAM)", department: "Dịch vụ Khách hàng", avatarBg: "#0284c7" },
    { id: 11, name: "Nguyễn Văn Hùng", email: "giamdoc@crm.local", role: "Giám đốc Kinh doanh Toàn quốc", department: "Ban Giám đốc", avatarBg: "#1e293b" }
];

function getRichMockOpportunities() {
    return [
        {
            id: 101,
            name: "Triển khai phần mềm ERP đa chi nhánh",
            customerId: 1,
            customerName: "Tập đoàn Công nghiệp Foxconn VN",
            contactPerson: "Ông Trần Quốc Bảo (Giám đốc CNTT) - 0988.123.456",
            productInterest: "Hệ thống ERP Doanh nghiệp Cloud Edition đa nhà máy",
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
            collaborators: [
                { id: 2, name: "Lê Hoàng Nam", roleInDeal: "Chuyên viên Kinh doanh Phối hợp", department: "Khối Kinh doanh", avatarBg: "#059669", addedAt: "2026-10-15 09:30" },
                { id: 4, name: "Bùi Đức Thành", roleInDeal: "Kỹ sư Giải pháp (Solution Architect)", department: "Kỹ thuật & Pre-Sales", avatarBg: "#7c3aed", addedAt: "2026-10-16 14:15" },
                { id: 5, name: "Võ Minh Thư", roleInDeal: "Chuyên viên Pháp chế & Hợp đồng", department: "Pháp chế & Tuân thủ", avatarBg: "#0891b2", addedAt: "2026-10-18 10:00" }
            ],
            activityLog: [
                { id: 1, timestamp: "2026-10-14 09:00", actor: "Trần Thị Thu Hà", type: "CREATE_DEAL", title: "Khởi tạo cơ hội", details: "Tiếp nhận nhu cầu nâng cấp hệ thống ERP từ buổi hội thảo Chuyển đổi số công nghiệp." },
                { id: 2, timestamp: "2026-10-15 09:30", actor: "Trần Thị Thu Hà", type: "SHARE_DEAL", title: "Chia sẻ cho thành viên mới", details: "Trần Thị Thu Hà đã thêm Lê Hoàng Nam vào cơ hội với vai trò 'Chuyên viên Kinh doanh Phối hợp'." }
            ]
        },
        {
            id: 102,
            name: "Gói bảo trì và nâng cấp hạ tầng Cloud",
            customerId: 2,
            customerName: "Ngân hàng TMCP VPBank - CN Thăng Long",
            contactPerson: "Bà Nguyễn Mai Lan (Trưởng ban Mua sắm)",
            productInterest: "Dịch vụ Quản trị Hạ tầng Cloud 24/7",
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
            collaborators: [
                { id: 4, name: "Bùi Đức Thành", roleInDeal: "Kỹ sư Giải pháp (Solution Architect)", department: "Kỹ thuật & Pre-Sales", avatarBg: "#7c3aed", addedAt: "2026-10-10 11:00" }
            ],
            activityLog: [
                { id: 1, timestamp: "2026-10-10 11:00", actor: "Lê Hoàng Nam", type: "SHARE_DEAL", title: "Chia sẻ cho thành viên mới", details: "Lê Hoàng Nam đã thêm Bùi Đức Thành vào cơ hội để phối hợp tính toán tài nguyên server." }
            ]
        },
        {
            id: 103,
            name: "Cung cấp giải pháp CRM bán lẻ đa kênh",
            customerId: 4,
            customerName: "Thời trang NEM Fashion Toàn quốc",
            contactPerson: "Ông Hoàng Văn Tùng (Giám đốc Vận hành)",
            stageId: 2,
            stageName: "Đánh giá & Xác định",
            amount: 450000000,
            probability: 40,
            expectedCloseDate: "2026-11-20",
            status: "OPEN",
            ownerId: 3,
            ownerName: "Phạm Mai Phương",
            ownerRole: "Chuyên viên Kinh doanh",
            ownerEmail: "sale.hn2@crm.local",
            collaborators: [
                { id: 2, name: "Lê Hoàng Nam", roleInDeal: "Tư vấn viên Cấp cao", department: "Khối Kinh doanh", avatarBg: "#059669", addedAt: "2026-10-12 10:00" }
            ],
            activityLog: []
        },
        {
            id: 104,
            name: "Hệ thống quản lý chuỗi cung ứng SCM",
            customerId: 5,
            customerName: "Công ty CP Logistics LogiTech Global",
            contactPerson: "Bà Đặng Thùy Dung (Phó Tổng Giám đốc)",
            stageId: 1,
            stageName: "Khảo sát nhu cầu",
            amount: 550000000,
            probability: 20,
            expectedCloseDate: "2026-12-05",
            status: "OPEN",
            ownerId: 1,
            ownerName: "Trần Thị Thu Hà",
            ownerRole: "Trưởng nhóm Kinh doanh Miền Bắc",
            ownerEmail: "lead.mienbac@crm.local",
            collaborators: [],
            activityLog: []
        }
    ];
}

async function loadOpportunities() {
    try {
        const list = await api("/api/opportunities");
        if (Array.isArray(list) && list.length > 0) {
            opportunities = list;
        }
    } catch (err) {
        console.warn("Could not load opportunities from backend, checking cache:", err);
    }

    if (!opportunities || opportunities.length === 0) {
        try {
            const cached = JSON.parse(localStorage.getItem("crm_ui_opportunities"));
            if (Array.isArray(cached) && cached.length > 0) {
                opportunities = cached;
            }
        } catch (_) {}
    }

    const hasRichTeam = opportunities && opportunities.some(o => Array.isArray(o.collaborators));
    if (!opportunities || opportunities.length === 0 || !hasRichTeam) {
        opportunities = getRichMockOpportunities();
        try {
            localStorage.setItem("crm_ui_opportunities", JSON.stringify(opportunities));
        } catch (_) {}
    }

    render();
}

/* =========================================================
   POPULATE DROPDOWNS
========================================================= */
function populateStageSelect() {
    const stageSelect = document.getElementById("opportunityStage");
    if (!stageSelect) return;
    stageSelect.innerHTML = "";
    stages.forEach(st => {
        const opt = document.createElement("option");
        opt.value = st.id;
        opt.textContent = `${st.name} (${st.probability}%)`;
        stageSelect.appendChild(opt);
    });
}

function populateCustomerSelect(selectedId = null) {
    const custSelect = document.getElementById("opportunityCustomer");
    if (!custSelect) return;

    // Đảm bảo customers luôn có dữ liệu từ bộ nhớ, localStorage hoặc DEFAULT_CUSTOMERS_LIST
    if (!Array.isArray(customers) || customers.length === 0) {
        try {
            const cached = JSON.parse(localStorage.getItem("crm_ui_customers"));
            if (Array.isArray(cached) && cached.length > 0) {
                customers = cached;
            } else {
                customers = [...DEFAULT_CUSTOMERS_LIST];
                localStorage.setItem("crm_ui_customers", JSON.stringify(customers));
            }
        } catch (_) {
            customers = [...DEFAULT_CUSTOMERS_LIST];
        }
    }

    const currentVal = selectedId !== null && selectedId !== undefined ? String(selectedId) : custSelect.value;
    custSelect.innerHTML = '<option value="">-- Chọn khách hàng --</option>';

    customers.forEach(c => {
        const opt = document.createElement("option");
        opt.value = c.id;
        const codeText = c.code || (c.taxCode ? `MST: ${c.taxCode}` : (c.phone ? `SĐT: ${c.phone}` : ""));
        opt.textContent = codeText ? `${c.name} (${codeText})` : c.name;
        if (String(c.id) === currentVal) {
            opt.selected = true;
        }
        custSelect.appendChild(opt);
    });

    if (currentVal) {
        custSelect.value = currentVal;
    }
}

function populateWinLossSelects() {
    const winSelect = document.getElementById("winReason");
    if (winSelect) {
        winSelect.innerHTML = '<option value="">-- Chọn lý do Thắng --</option>';
        winReasons.forEach(r => {
            const opt = document.createElement("option");
            opt.value = r.id;
            opt.textContent = r.name || r.reasonText;
            winSelect.appendChild(opt);
        });
    }

    const lossSelect = document.getElementById("lossReason");
    if (lossSelect) {
        lossSelect.innerHTML = '<option value="">-- Chọn lý do Thua --</option>';
        lossReasons.forEach(r => {
            const opt = document.createElement("option");
            opt.value = r.id;
            opt.textContent = r.name || r.reasonText;
            lossSelect.appendChild(opt);
        });
    }

    const compSelect = document.getElementById("lossCompetitor");
    if (compSelect) {
        compSelect.innerHTML = '<option value="">-- Chọn đối thủ thắng thầu --</option>';
        competitors.forEach(c => {
            const opt = document.createElement("option");
            opt.value = c.id;
            opt.textContent = c.name;
            compSelect.appendChild(opt);
        });
    }
}

/* =========================================================
   EVENT LISTENERS
========================================================= */
document.getElementById("addOpportunityButton")?.addEventListener("click", () => {
    openOpportunityDrawer();
});

document.getElementById("closeOpportunityDrawer")?.addEventListener("click", closeOpportunityDrawer);
document.getElementById("cancelOpportunity")?.addEventListener("click", closeOpportunityDrawer);
opportunityOverlay?.addEventListener("click", closeOpportunityDrawer);

document.getElementById("opportunityStage")?.addEventListener("change", event => {
    const stageId = Number(event.target.value);
    const selected = stages.find(s => s.id === stageId);
    if (selected) {
        document.getElementById("opportunityProbability").value = selected.probability;
    }
});

searchInput?.addEventListener("input", render);
ownerFilter?.addEventListener("change", render);

document.getElementById("resetPipelineFilter")?.addEventListener("click", () => {
    if (searchInput) searchInput.value = "";
    if (ownerFilter) ownerFilter.value = "";
    render();
});

/* Drawer form submit */
opportunityForm?.addEventListener("submit", async event => {
    event.preventDefault();

    const name = fieldValue("opportunityName");
    const nameError = document.getElementById("opportunityNameError");
    if (!name) {
        if (nameError) nameError.textContent = "Vui lòng nhập tên cơ hội.";
        return;
    }
    if (nameError) nameError.textContent = "";

    const customerIdVal = document.getElementById("opportunityCustomer")?.value;
    const custError = document.getElementById("opportunityCustomerError");
    if (!customerIdVal) {
        if (custError) custError.textContent = "Vui lòng chọn khách hàng.";
        return;
    }
    if (custError) custError.textContent = "";

    const customerId = Number(customerIdVal);
    const stageId = Number(document.getElementById("opportunityStage").value) || stages[0]?.id;
    const probability = clamp(Number(document.getElementById("opportunityProbability").value) || 0, 0, 100);
    const amount = Math.max(0, Number(document.getElementById("opportunityValue").value) || 0);
    const expectedCloseDate = fieldValue("opportunityCloseDate") || null;

    const payload = {
        name,
        customerId,
        stageId,
        probability,
        amount,
        expectedCloseDate
    };

    try {
        if (editingOppId) {
            await api(`/api/opportunities/${editingOppId}`, {
                method: "PUT",
                body: JSON.stringify(payload)
            });
        } else {
            await api("/api/opportunities", {
                method: "POST",
                body: JSON.stringify(payload)
            });
        }

        closeOpportunityDrawer();
        await loadOpportunities();
    } catch (err) {
        console.warn("Backend API unavailable, saving opportunity locally:", err);
        const custObj = customers.find(c => Number(c.id) === customerId);
        const stgObj = stages.find(s => Number(s.id) === stageId);
        const customerName = custObj ? custObj.name : ("Khách hàng #" + customerId);
        const stageName = stgObj ? stgObj.name : ("Giai đoạn #" + stageId);

        if (editingOppId) {
            const oppIdx = opportunities.findIndex(o => o.id === editingOppId);
            if (oppIdx !== -1) {
                opportunities[oppIdx] = {
                    ...opportunities[oppIdx],
                    ...payload,
                    customerName,
                    stageName
                };
            }
        } else {
            const newOpp = {
                id: Date.now(),
                name,
                customerId,
                customerName,
                stageId,
                stageName,
                amount,
                probability,
                expectedCloseDate,
                status: "OPEN",
                ownerId: 1,
                ownerName: "Trần Thị Thu Hà",
                ownerRole: "Trưởng nhóm Kinh doanh Miền Bắc",
                ownerEmail: "lead.mienbac@crm.local",
                collaborators: [],
                activityLog: [
                    {
                        id: Date.now(),
                        timestamp: new Date().toISOString().slice(0, 19).replace("T", " "),
                        actor: "Trần Thị Thu Hà",
                        type: "CREATE",
                        title: "Tạo cơ hội",
                        details: `Tạo mới cơ hội cho khách hàng "${customerName}"`
                    }
                ]
            };
            opportunities.unshift(newOpp);
        }

        try {
            localStorage.setItem("crm_ui_opportunities", JSON.stringify(opportunities));
            document.dispatchEvent(new CustomEvent("crm:deal-team-updated", { detail: { deal: opportunities[0] } }));
        } catch (_) {}

        closeOpportunityDrawer();
        render();
    }
});

/* =========================================================
   WIN / LOSS MODAL HANDLERS
========================================================= */
document.querySelectorAll(".deal-mode").forEach(button => {
    button.addEventListener("click", () => {
        setDealMode(button.dataset.dealMode);
    });
});

document.querySelectorAll("[data-close-deal]").forEach(button => {
    button.addEventListener("click", closeDeal);
});

document.getElementById("closeDealX")?.addEventListener("click", closeDeal);
dealOverlay?.addEventListener("click", closeDeal);

document.getElementById("wonForm")?.addEventListener("submit", async event => {
    event.preventDefault();

    const value = Number(document.getElementById("wonValue").value);
    const date = document.getElementById("wonDate").value;
    const winReasonIdVal = document.getElementById("winReason")?.value;
    const error = document.getElementById("wonError");

    if (!value || value <= 0 || !date) {
        if (error) error.textContent = "Vui lòng nhập giá trị chốt và ngày ký.";
        return;
    }
    if (!winReasonIdVal) {
        if (error) error.textContent = "Vui lòng chọn Lý do Thắng.";
        return;
    }
    if (error) error.textContent = "";

    try {
        await api(`/api/opportunities/${closingOppId}/close`, {
            method: "POST",
            body: JSON.stringify({
                status: "WON",
                winReasonId: Number(winReasonIdVal),
                amount: value
            })
        });

        closeDeal();
        await loadOpportunities();
    } catch (err) {
        if (error) error.textContent = err.message;
        else alert("Lỗi đóng cơ hội Thắng: " + err.message);
    }
});

document.getElementById("lostForm")?.addEventListener("submit", async event => {
    event.preventDefault();

    const reasonIdVal = document.getElementById("lossReason").value;
    const compIdVal = document.getElementById("lossCompetitor")?.value;
    const error = document.getElementById("lostError");

    if (!reasonIdVal) {
        if (error) error.textContent = "Vui lòng chọn lý do thua.";
        return;
    }
    if (!compIdVal) {
        if (error) error.textContent = "Vui lòng chọn đối thủ cạnh tranh thắng thầu.";
        return;
    }
    if (error) error.textContent = "";

    try {
        await api(`/api/opportunities/${closingOppId}/close`, {
            method: "POST",
            body: JSON.stringify({
                status: "LOST",
                lossReasonId: Number(reasonIdVal),
                competitorId: Number(compIdVal)
            })
        });

        closeDeal();
        await loadOpportunities();
    } catch (err) {
        if (error) error.textContent = err.message;
        else alert("Lỗi đóng cơ hội Thua: " + err.message);
    }
});

/* =========================================================
   CARD MENU AND ACTION DISPATCHER
========================================================= */
document.addEventListener("click", async event => {
    const menuButton = event.target.closest("[data-card-menu]");
    if (menuButton) {
        event.stopPropagation();
        const id = menuButton.dataset.cardMenu;
        document.querySelectorAll(".card-menu").forEach(menu => {
            if (menu.dataset.menu !== id) menu.classList.remove("open");
        });
        document.querySelector(`[data-menu="${id}"]`)?.classList.toggle("open");
        return;
    }

    const manageTeamBtn = event.target.closest("[data-manage-team]");
    if (manageTeamBtn) {
        event.stopPropagation();
        const id = Number(manageTeamBtn.dataset.manageTeam);
        document.querySelectorAll(".card-menu").forEach(menu => menu.classList.remove("open"));
        openQuickDealTeamModal(id);
        return;
    }

    const editBtn = event.target.closest("[data-edit-opportunity]");
    if (editBtn) {
        openOpportunityDrawer(Number(editBtn.dataset.editOpportunity));
        return;
    }

    const deleteBtn = event.target.closest("[data-delete-opportunity]");
    if (deleteBtn) {
        const id = Number(deleteBtn.dataset.deleteOpportunity);
        if (confirm("Bạn có chắc chắn muốn xóa cơ hội bán hàng này không?")) {
            try {
                await api(`/api/opportunities/${id}`, { method: "DELETE" });
                await loadOpportunities();
            } catch (err) {
                alert("Lỗi khi xóa cơ hội: " + err.message);
            }
        }
        return;
    }

    const nextBtn = event.target.closest("[data-next-stage]");
    if (nextBtn) {
        const id = Number(nextBtn.dataset.nextStage);
        await moveStageRelatively(id, 1);
        return;
    }

    const prevBtn = event.target.closest("[data-prev-stage]");
    if (prevBtn) {
        const id = Number(prevBtn.dataset.prevStage);
        await moveStageRelatively(id, -1);
        return;
    }

    const wonBtn = event.target.closest("[data-close-won]");
    if (wonBtn) {
        openCloseDeal(Number(wonBtn.dataset.closeWon), "won");
        return;
    }

    const lostBtn = event.target.closest("[data-close-lost]");
    if (lostBtn) {
        openCloseDeal(Number(lostBtn.dataset.closeLost), "lost");
        return;
    }

    if (!event.target.closest(".opportunity-card")) {
        document.querySelectorAll(".card-menu").forEach(menu => menu.classList.remove("open"));
    }
});

/* =========================================================
   STAGE ADVANCEMENT & TRANSITION
========================================================= */
async function moveStageRelatively(oppId, direction) {
    const opp = opportunities.find(o => o.id === oppId);
    if (!opp) return;

    const currentStageIndex = stages.findIndex(s => s.id === opp.stageId);
    if (currentStageIndex < 0) return;

    const nextStageIndex = currentStageIndex + direction;
    if (nextStageIndex < 0 || nextStageIndex >= stages.length) return;

    const targetStage = stages[nextStageIndex];

    if (targetStage.isWon) {
        openCloseDeal(oppId, "won");
        return;
    }
    if (targetStage.isLost) {
        openCloseDeal(oppId, "lost");
        return;
    }

    try {
        await api(`/api/opportunities/${oppId}/stage`, {
            method: "POST",
            body: JSON.stringify({ stageId: targetStage.id })
        });
        await loadOpportunities();
    } catch (err) {
        alert("Không thể chuyển giai đoạn: " + err.message);
    }
}

async function moveStageTo(oppId, targetStageId) {
    const opp = opportunities.find(o => o.id === oppId);
    if (!opp || opp.stageId === targetStageId) return;

    const targetStage = stages.find(s => s.id === targetStageId);
    if (!targetStage) return;

    if (targetStage.isWon) {
        openCloseDeal(oppId, "won");
        return;
    }
    if (targetStage.isLost) {
        openCloseDeal(oppId, "lost");
        return;
    }

    try {
        await api(`/api/opportunities/${oppId}/stage`, {
            method: "POST",
            body: JSON.stringify({ stageId: targetStageId })
        });
        await loadOpportunities();
    } catch (err) {
        alert("Không thể chuyển giai đoạn: " + err.message);
        render(); // Rollback UI
    }
}

/* =========================================================
   RENDER BOARD & CARDS
========================================================= */
const STAGE_THEME_COLORS = ["#14b8a6", "#3b82f6", "#f59e0b", "#8b5cf6", "#10b981", "#ef4444"];

function render() {
    if (!pipelineBoard) return;
    pipelineBoard.innerHTML = "";

    const query = (searchInput?.value || "").trim().toLowerCase();
    const owner = (ownerFilter?.value || "").trim();

    const filtered = opportunities.filter(opp => {
        const text = `${opp.name || ""} ${opp.customerName || ""}`.toLowerCase();
        const searchOk = !query || text.includes(query);
        const ownerOk = !owner || (opp.ownerName || "").includes(owner) || (owner === "Tôi");
        return searchOk && ownerOk;
    });

    stages.forEach((st, idx) => {
        const themeColor = STAGE_THEME_COLORS[idx % STAGE_THEME_COLORS.length];

        const col = document.createElement("article");
        col.className = "pipeline-column";
        col.dataset.stage = String(st.id);

        const stageOpps = filtered.filter(o => o.stageId === st.id);
        const stageTotal = stageOpps.reduce((sum, o) => sum + Number(o.amount || 0), 0);

        col.innerHTML = `
            <header class="column-head" style="border-top-color: ${themeColor}">
                <div>
                    <strong>${escapeHtml(st.name)}</strong>
                    <span class="column-count">${stageOpps.length} cơ hội</span>
                </div>
                <b class="column-total">${formatMoney(stageTotal)}</b>
            </header>
            <div class="column-body" data-drop-zone="${st.id}"></div>
        `;

        const body = col.querySelector(".column-body");
        stageOpps.forEach(opp => {
            body.appendChild(createCard(opp));
        });

        setupDropZone(body, st.id);
        pipelineBoard.appendChild(col);
    });
}

function createCard(record) {
    const card = document.createElement("article");
    card.className = "opportunity-card";
    card.draggable = window.innerWidth > 768;
    card.dataset.id = String(record.id);

    const currentStageIndex = stages.findIndex(s => s.id === record.stageId);
    const canPrev = currentStageIndex > 0;
    const canNext = currentStageIndex < stages.length - 1;

    // Team Avatar Stack
    const collabs = Array.isArray(record.collaborators) ? record.collaborators : [];
    let teamStackHtml = `<div class="deal-team-stack" title="👑 Người sở hữu: ${escapeHtml(record.ownerName || 'Chưa phân công')}${collabs.length ? ' • Cùng tham gia: ' + collabs.map(c => c.name).join(', ') : ''}">`;
    teamStackHtml += `<div class="deal-team-avatar deal-team-owner-avatar" title="👑 Người sở hữu: ${escapeHtml(record.ownerName || 'Chưa phân công')}">${initials(record.ownerName || 'O')}</div>`;
    collabs.slice(0, 2).forEach(c => {
        teamStackHtml += `<div class="deal-team-avatar" style="background:${c.avatarBg || '#2563eb'}" title="👥 ${escapeHtml(c.name)} (${escapeHtml(c.roleInDeal || 'Phối hợp')})">${initials(c.name)}</div>`;
    });
    if (collabs.length > 2) {
        teamStackHtml += `<div class="deal-team-more-badge">+${collabs.length - 2}</div>`;
    }
    teamStackHtml += `</div>`;

    card.innerHTML = `
        <button class="card-menu-btn" type="button" data-card-menu="${record.id}">⋮</button>

        <div class="card-menu" data-menu="${record.id}">
            <button type="button" data-manage-team="${record.id}">👥 Quản lý đội ngũ & Chia sẻ</button>
            <a href="deal-detail.html?id=${record.id}" style="display:block; padding:8px 12px; font-size:12px; color:var(--crm-primary); text-decoration:none; font-weight:600;">👁️ Xem chi tiết & Nhật ký</a>
            <button type="button" data-edit-opportunity="${record.id}">Sửa thông tin</button>
            ${canPrev ? `<button type="button" data-prev-stage="${record.id}">← Giai đoạn trước</button>` : ""}
            ${canNext ? `<button type="button" data-next-stage="${record.id}">Giai đoạn tiếp →</button>` : ""}
            <button type="button" class="won" data-close-won="${record.id}">✓ Đóng Thắng</button>
            <button type="button" class="lost" data-close-lost="${record.id}">✕ Đóng Thua</button>
            <button type="button" style="color:#ef4444;" data-delete-opportunity="${record.id}">🗑 Xóa</button>
        </div>

        <a href="deal-detail.html?id=${record.id}" class="card-title-link">
            <h3>${escapeHtml(record.name)}</h3>
        </a>

        <div class="opportunity-customer">
            ${escapeHtml(record.customerName || "Chưa chọn khách hàng")}
        </div>

        <strong class="opportunity-value">
            ${formatMoney(record.amount || 0)}
        </strong>

        <div class="opportunity-meta">
            <span>${record.probability ?? 0}% xác suất</span>
            <span>${escapeHtml(record.expectedCloseDate || "—")}</span>
        </div>

        <div style="display:flex;align-items:center;justify-content:space-between;margin-top:10px;">
            <small style="color:#64748b;font-size:10px;">
                ${escapeHtml(record.stageName || "")}
            </small>
            ${teamStackHtml}
        </div>
    `;

    card.addEventListener("dragstart", event => {
        draggedOppId = record.id;
        event.dataTransfer.effectAllowed = "move";
        event.dataTransfer.setData("text/plain", String(record.id));
        requestAnimationFrame(() => card.classList.add("dragging"));
    });

    card.addEventListener("dragend", () => {
        draggedOppId = null;
        card.classList.remove("dragging");
        document.querySelectorAll(".column-body").forEach(zone => zone.classList.remove("drag-over"));
    });

    return card;
}

function setupDropZone(zone, stageId) {
    zone.addEventListener("dragover", event => {
        event.preventDefault();
        zone.classList.add("drag-over");
    });
    zone.addEventListener("dragenter", event => {
        event.preventDefault();
        zone.classList.add("drag-over");
    });
    zone.addEventListener("dragleave", event => {
        if (!zone.contains(event.relatedTarget)) {
            zone.classList.remove("drag-over");
        }
    });
    zone.addEventListener("drop", async event => {
        event.preventDefault();
        zone.classList.remove("drag-over");
        const idVal = draggedOppId || Number(event.dataTransfer.getData("text/plain"));
        if (!idVal) return;
        draggedOppId = null;
        await moveStageTo(Number(idVal), stageId);
    });
}

/* =========================================================
   DRAWER OPEN / CLOSE
========================================================= */
function openOpportunityDrawer(id = null) {
    editingOppId = id;
    const titleEl = document.getElementById("opportunityDrawerTitle");
    const nameErr = document.getElementById("opportunityNameError");
    const custErr = document.getElementById("opportunityCustomerError");
    if (nameErr) nameErr.textContent = "";
    if (custErr) custErr.textContent = "";

    // Tự động nạp danh sách khách hàng ngay khi mở modal "+ Thêm cơ hội"
    const targetOpp = id !== null ? opportunities.find(o => o.id === id) : null;
    populateCustomerSelect(targetOpp ? targetOpp.customerId : null);

    if (id !== null) {
        const opp = targetOpp;
        if (opp) {
            if (titleEl) titleEl.textContent = "Sửa cơ hội";
            setField("opportunityName", opp.name);
            setField("opportunityCustomer", opp.customerId);
            setField("opportunityValue", opp.amount);
            setField("opportunityCloseDate", opp.expectedCloseDate);
            setField("opportunityStage", opp.stageId);
            setField("opportunityProbability", opp.probability);
            setField("opportunityOwner", opp.ownerName);
        }
    } else {
        if (titleEl) titleEl.textContent = "Thêm cơ hội";
        opportunityForm.reset();
        const custSelect = document.getElementById("opportunityCustomer");
        if (custSelect) custSelect.value = "";
        if (stages.length > 0) {
            setField("opportunityStage", stages[0].id);
            setField("opportunityProbability", stages[0].probability);
        }
    }

    opportunityDrawer?.classList.add("open");
    opportunityOverlay?.classList.add("open");
}

function closeOpportunityDrawer() {
    opportunityDrawer?.classList.remove("open");
    opportunityOverlay?.classList.remove("open");
    editingOppId = null;
}

/* =========================================================
   CLOSE DEAL MODAL
========================================================= */
function openCloseDeal(oppId, mode) {
    closingOppId = oppId;
    const opp = opportunities.find(o => o.id === oppId);

    document.getElementById("wonForm")?.reset();
    document.getElementById("lostForm")?.reset();

    if (opp && mode === "won") {
        setField("wonValue", opp.amount || 0);
        setField("wonDate", todayString());
    }

    const wonErr = document.getElementById("wonError");
    const lostErr = document.getElementById("lostError");
    if (wonErr) wonErr.textContent = "";
    if (lostErr) lostErr.textContent = "";

    setDealMode(mode);
    dealModal?.classList.add("open");
    dealOverlay?.classList.add("open");
}

function closeDeal() {
    dealModal?.classList.remove("open");
    dealOverlay?.classList.remove("open");
    closingOppId = null;
}

function setDealMode(mode) {
    const won = mode === "won";
    document.querySelectorAll(".deal-mode").forEach(button => {
        button.classList.toggle("active", button.dataset.dealMode === mode);
    });

    const wonForm = document.getElementById("wonForm");
    const lostForm = document.getElementById("lostForm");
    if (wonForm) wonForm.hidden = !won;
    if (lostForm) lostForm.hidden = won;

    const emojiEl = document.getElementById("closeDealEmoji");
    const titleEl = document.getElementById("closeDealTitle");
    if (emojiEl) emojiEl.textContent = won ? "🎉" : "☹️";
    if (titleEl) titleEl.textContent = won ? "Đóng Thắng Cơ Hội" : "Đóng Thua Cơ Hội";
}

/* =========================================================
   UTILITIES
========================================================= */
function fieldValue(id) {
    return (document.getElementById(id)?.value || "").trim();
}

function setField(id, val) {
    const el = document.getElementById(id);
    if (el) el.value = val ?? "";
}

function formatMoney(val) {
    return new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
        maximumFractionDigits: 0
    }).format(Number(val) || 0);
}

function initials(name) {
    const parts = String(name || "").trim().split(/\s+/).filter(Boolean);
    if (!parts.length) return "U";
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function clamp(val, min, max) {
    if (!Number.isFinite(val)) return min;
    return Math.min(max, Math.max(min, val));
}

function escapeHtml(val) {
    return String(val ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function todayString() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

// Start
initPipeline();

/* =========================================================
   QUICK DEAL TEAM MODAL LOGIC (SCRUM-82 / SCRUM-211)
========================================================= */
let currentTeamModalDealId = null;

function openQuickDealTeamModal(dealId) {
    const opp = opportunities.find(o => Number(o.id) === dealId);
    if (!opp) return;
    currentTeamModalDealId = dealId;

    const modal = document.getElementById("quickDealTeamModal");
    const overlay = document.getElementById("quickDealTeamOverlay");
    const title = document.getElementById("quickTeamDealTitle");
    const ownerName = document.getElementById("quickTeamOwnerName");
    const ownerAvatar = document.getElementById("quickTeamOwnerAvatar");
    const ownerRole = document.getElementById("quickTeamOwnerRole");
    const detailLink = document.getElementById("linkQuickGoToDetail");

    if (title) title.textContent = `${opp.name} • ${opp.customerName || ''}`;
    if (ownerName) ownerName.textContent = opp.ownerName || "Tôi";
    if (ownerAvatar) ownerAvatar.textContent = initials(opp.ownerName || "O");
    if (ownerRole) ownerRole.textContent = opp.ownerRole || "Chịu trách nhiệm doanh số cao nhất";
    if (detailLink) detailLink.href = `deal-detail.html?id=${opp.id}`;

    renderQuickTeamCollaborators(opp);
    populateQuickAddEmpSelect(opp);

    modal?.classList.add("open");
    overlay?.classList.add("open");
}

function closeQuickDealTeamModal() {
    document.getElementById("quickDealTeamModal")?.classList.remove("open");
    document.getElementById("quickDealTeamOverlay")?.classList.remove("open");
    currentTeamModalDealId = null;
}

function renderQuickTeamCollaborators(opp) {
    const listEl = document.getElementById("quickTeamCollabList");
    const countEl = document.getElementById("quickTeamCollabCount");
    if (!listEl) return;
    listEl.innerHTML = "";

    const collabs = Array.isArray(opp.collaborators) ? opp.collaborators : [];
    if (countEl) countEl.textContent = `${collabs.length} người`;

    if (collabs.length === 0) {
        listEl.innerHTML = `<div style="text-align:center; padding:12px; color:var(--crm-muted); font-size:12px; background:var(--crm-surface-soft); border-radius:6px;">Chưa có thành viên phối hợp nào được chia sẻ.</div>`;
        return;
    }

    collabs.forEach(c => {
        const item = document.createElement("div");
        item.style.cssText = "display:flex; justify-content:space-between; align-items:center; padding:8px 10px; background:var(--crm-surface-soft); border:1px solid var(--crm-border); border-radius:6px;";

        item.innerHTML = `
            <div style="display:flex; align-items:center; gap:8px;">
                <div style="width:28px; height:28px; border-radius:50%; background:${c.avatarBg || '#2563eb'}; color:#fff; font-weight:700; font-size:11px; display:flex; align-items:center; justify-content:center;">
                    ${initials(c.name)}
                </div>
                <div>
                    <div style="font-size:12.5px; font-weight:600; color:var(--crm-text);">${escapeHtml(c.name)}</div>
                    <div style="font-size:11px; color:var(--crm-muted);">${escapeHtml(c.roleInDeal || 'Phối hợp')}</div>
                </div>
            </div>
            <button type="button" data-quick-remove-collab="${c.id}" style="border:none; background:transparent; color:#ef4444; font-size:12px; cursor:pointer;" title="Xóa khỏi cơ hội">
                🗑️
            </button>
        `;

        item.querySelector("[data-quick-remove-collab]")?.addEventListener("click", () => {
            removeQuickTeamCollaborator(c.id);
        });

        listEl.appendChild(item);
    });
}

function populateQuickAddEmpSelect(opp) {
    const select = document.getElementById("quickAddEmpSelect");
    if (!select) return;
    select.innerHTML = `<option value="">-- Chọn nhân sự công ty --</option>`;

    const currentCollabIds = (opp.collaborators || []).map(c => Number(c.id));
    const ownerId = Number(opp.ownerId);

    DEFAULT_EMPLOYEES_LIST.forEach(emp => {
        if (emp.id !== ownerId && !currentCollabIds.includes(emp.id)) {
            const opt = document.createElement("option");
            opt.value = String(emp.id);
            opt.textContent = `${emp.name} - ${emp.role} (${emp.department})`;
            select.appendChild(opt);
        }
    });
}

function handleQuickAddCollabSubmit(e) {
    e.preventDefault();
    if (!currentTeamModalDealId) return;

    const opp = opportunities.find(o => Number(o.id) === currentTeamModalDealId);
    if (!opp) return;

    const empSelect = document.getElementById("quickAddEmpSelect");
    const roleSelect = document.getElementById("quickAddRoleSelect");
    const empId = Number(empSelect?.value);
    if (!empId) return;

    const emp = DEFAULT_EMPLOYEES_LIST.find(e => e.id === empId);
    if (!emp) return;

    if (!Array.isArray(opp.collaborators)) opp.collaborators = [];
    const now = new Date();
    const timeStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")} ${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

    opp.collaborators.push({
        id: emp.id,
        name: emp.name,
        email: emp.email,
        roleInDeal: roleSelect?.value || "Phối hợp",
        department: emp.department,
        addedAt: timeStr,
        permission: "VIEW_AND_LOG",
        avatarBg: emp.avatarBg
    });

    if (!Array.isArray(opp.activityLog)) opp.activityLog = [];
    opp.activityLog.push({
        id: Date.now(),
        timestamp: timeStr,
        actor: "Trần Thị Thu Hà",
        type: "SHARE_DEAL",
        title: "Chia sẻ cơ hội",
        details: `Đã thêm ${emp.name} vào đội ngũ phối hợp với vai trò "${roleSelect?.value || 'Phối hợp'}".`
    });

    try {
        localStorage.setItem("crm_ui_opportunities", JSON.stringify(opportunities));
        document.dispatchEvent(new CustomEvent("crm:deal-team-updated", { detail: { deal: opp } }));
    } catch (_) {}

    renderQuickTeamCollaborators(opp);
    populateQuickAddEmpSelect(opp);
    render();
}

function removeQuickTeamCollaborator(collabId) {
    if (!currentTeamModalDealId) return;
    const opp = opportunities.find(o => Number(o.id) === currentTeamModalDealId);
    if (!opp) return;

    const collab = (opp.collaborators || []).find(c => c.id === collabId);
    if (!collab) return;

    if (!confirm(`Bạn có chắc chắn muốn xóa "${collab.name}" khỏi cơ hội này?`)) return;

    opp.collaborators = opp.collaborators.filter(c => c.id !== collabId);

    const now = new Date();
    const timeStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")} ${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

    if (!Array.isArray(opp.activityLog)) opp.activityLog = [];
    opp.activityLog.push({
        id: Date.now(),
        timestamp: timeStr,
        actor: "Trần Thị Thu Hà",
        type: "REMOVE_COLLABORATOR",
        title: "Xóa thành viên",
        details: `Đã xóa ${collab.name} khỏi đội ngũ phối hợp.`
    });

    try {
        localStorage.setItem("crm_ui_opportunities", JSON.stringify(opportunities));
        document.dispatchEvent(new CustomEvent("crm:deal-team-updated", { detail: { deal: opp } }));
    } catch (_) {}

    renderQuickTeamCollaborators(opp);
    populateQuickAddEmpSelect(opp);
    render();
}

// Quick Modal Listeners
document.getElementById("btnCloseQuickTeamModal")?.addEventListener("click", closeQuickDealTeamModal);
document.getElementById("btnDoneQuickTeamModal")?.addEventListener("click", closeQuickDealTeamModal);
document.getElementById("quickDealTeamOverlay")?.addEventListener("click", closeQuickDealTeamModal);
document.getElementById("formQuickAddCollab")?.addEventListener("submit", handleQuickAddCollabSubmit);

// Cross-tab and module sync
window.addEventListener("storage", event => {
    if (event.key === "crm_ui_opportunities") {
        loadOpportunities();
    }
});

document.addEventListener("crm:deal-team-updated", () => {
    loadOpportunities();
});

// Đảm bảo nạp danh sách khách hàng ngay khi DOM sẵn sàng
if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
        populateCustomerSelect();
    });
} else {
    populateCustomerSelect();
}


