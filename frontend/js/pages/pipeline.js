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
const filterStagnantOnly = document.getElementById("filterStagnantOnly");
const pipelineStagnantCountBadge = document.getElementById("pipelineStagnantCountBadge");

const dealModal = document.getElementById("closeDealModal");
const dealOverlay = document.getElementById("closeDealOverlay");

/* =========================================================
   STAGNANCY THRESHOLDS & EVALUATION (SCRUM-78 / SCRUM-203)
========================================================= */
function getStagnancyThresholds() {
    try {
        const raw = localStorage.getItem("crm_stagnancy_thresholds");
        if (raw) {
            const parsed = JSON.parse(raw);
            return {
                1: 5, 2: 7, 3: 10, 4: 14,
                ...(parsed.stageThresholds || {}),
                alertOverdueClose: parsed.alertOverdueClose !== false,
                criticalDoubleThreshold: parsed.criticalDoubleThreshold !== false
            };
        }
    } catch (_) {}
    return { 1: 5, 2: 7, 3: 10, 4: 14, alertOverdueClose: true, criticalDoubleThreshold: true };
}

function evaluateDealStagnancy(deal) {
    const isClosed = deal.status === "WON" || deal.status === "LOST" || deal.stageId === 5 || deal.stageId === 6;
    if (isClosed) {
        return { isStagnant: false, severity: "CLOSED", daysInactive: 0, daysOverdue: 0, reasons: [] };
    }

    const thresholds = getStagnancyThresholds();
    const now = new Date();
    const todayZero = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

    let daysInactive = 0;
    let isInactive = false;
    const stageThreshold = thresholds[deal.stageId] || 7;

    if (deal.lastActivityDate) {
        const actDate = new Date(deal.lastActivityDate);
        const actZero = new Date(actDate.getFullYear(), actDate.getMonth(), actDate.getDate()).getTime();
        daysInactive = Math.max(0, Math.floor((todayZero - actZero) / (1000 * 60 * 60 * 24)));
        if (daysInactive > stageThreshold) {
            isInactive = true;
        }
    }

    let daysOverdue = 0;
    let isOverdue = false;
    if (thresholds.alertOverdueClose && deal.expectedCloseDate) {
        const closeDate = new Date(deal.expectedCloseDate);
        const closeZero = new Date(closeDate.getFullYear(), closeDate.getMonth(), closeDate.getDate()).getTime();
        if (closeZero < todayZero) {
            daysOverdue = Math.floor((todayZero - closeZero) / (1000 * 60 * 60 * 24));
            isOverdue = daysOverdue > 0;
        }
    }

    const isStagnant = isInactive || isOverdue;
    let severity = "NORMAL";
    if (isStagnant) {
        const isDouble = thresholds.criticalDoubleThreshold && (daysInactive >= stageThreshold * 2);
        if ((isInactive && isOverdue) || isDouble || daysOverdue >= 7) {
            severity = "CRITICAL";
        } else {
            severity = "WARNING";
        }
    }

    return {
        isStagnant,
        isInactive,
        isOverdue,
        severity,
        daysInactive,
        stageThreshold,
        daysOverdue
    };
}

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

const DEFAULT_CUSTOMERS = [
    { id: 1, name: "Tập đoàn Công nghiệp Foxconn VN", code: "KH-FOXCONN", phone: "024-3888-9999", email: "contact@foxconn.vn" },
    { id: 2, name: "Ngân hàng TMCP VPBank - CN Thăng Long", code: "KH-VPBANK", phone: "024-7300-8888", email: "crm@vpbank.com.vn" },
    { id: 3, name: "Công ty Du lịch Viettravel Sun", code: "KH-VIETTRAVEL", phone: "028-3822-8899", email: "booking@viettravel.com" },
    { id: 4, name: "Thời trang NEM Fashion Toàn quốc", code: "KH-NEM", phone: "024-3942-8888", email: "info@nemfashion.vn" },
    { id: 5, name: "Công ty CP Logistics LogiTech Global", code: "KH-LOGITECH", phone: "028-3999-7777", email: "support@logitech-global.vn" },
    { id: 6, name: "Tập đoàn Viễn thông FPT Telecom", code: "KH-FPT", phone: "024-7300-2222", email: "b2b@fpt.net" },
    { id: 7, name: "Chuỗi Bitis Miền Bắc", code: "KH-BITIS", phone: "024-3788-6666", email: "sales@bitis.vn" },
    { id: 8, name: "Tập đoàn Tiêu dùng Masan Consumer", code: "KH-MASAN", phone: "028-6255-5660", email: "procurement@masangroup.com" },
    { id: 9, name: "Tập đoàn Vingroup - VinFast", code: "KH-VINFAST", phone: "1900-232389", email: "b2b@vinfastauto.com" },
    { id: 10, name: "Công ty CP Sữa Việt Nam (Vinamilk)", code: "KH-VINAMILK", phone: "028-5415-5555", email: "vinamilk@vinamilk.com.vn" }
];

async function loadCustomers() {
    try {
        const list = await api("/api/customers");
        if (Array.isArray(list) && list.length > 0) {
            customers = list;
            try {
                localStorage.setItem("crm_ui_customers", JSON.stringify(customers));
            } catch (_) {}
        }
    } catch (err) {
        console.warn("Could not load customers from backend, checking cache:", err);
    }

    if (!customers || customers.length === 0) {
        try {
            const cached = JSON.parse(localStorage.getItem("crm_ui_customers"));
            if (Array.isArray(cached) && cached.length > 0) {
                customers = cached;
            }
        } catch (_) {}
    }

    // Fallback to default sample customers if empty
    if (!customers || customers.length === 0) {
        customers = [...DEFAULT_CUSTOMERS];
        try {
            localStorage.setItem("crm_ui_customers", JSON.stringify(customers));
        } catch (_) {}
    }

    populateCustomerSelect();
}

async function loadOpportunities() {
    try {
        const list = await api("/api/opportunities");
        if (Array.isArray(list) && list.length > 0) {
            opportunities = list;
            // Sync with localStorage
            try {
                localStorage.setItem("crm_ui_opportunities", JSON.stringify(opportunities.map(o => ({
                    id: o.id,
                    name: o.name,
                    customer: o.customerName || "",
                    customerName: o.customerName || "",
                    value: o.amount || 0,
                    amount: o.amount || 0,
                    stageId: o.stageId,
                    stage: String(o.stageId),
                    probability: o.probability || 0,
                    expectedCloseDate: o.expectedCloseDate || "",
                    lastActivityDate: o.lastActivityDate || todayString(),
                    lastActivityType: o.lastActivityType || "Tương tác",
                    ownerName: o.ownerName || "Tôi",
                    owner: o.ownerName || "Tôi",
                    status: o.status
                }))));
            } catch (_) {}
        }
    } catch (err) {
        console.warn("Could not load opportunities from backend, checking cache:", err);
    }

    if (!opportunities || opportunities.length === 0) {
        try {
            const cached = JSON.parse(localStorage.getItem("crm_ui_opportunities"));
            if (Array.isArray(cached) && cached.length > 0) {
                opportunities = cached.map(o => ({
                    ...o,
                    customerName: o.customerName || o.customer || "",
                    amount: o.amount ?? o.value ?? 0,
                    stageId: Number(o.stageId || o.stage || 1),
                    ownerName: o.ownerName || o.owner || "Tôi"
                }));
            }
        } catch (_) {}
    }

    // If still empty or missing lastActivityDate, seed with rich mock data
    const hasActivities = opportunities.some(o => o.lastActivityDate);
    if (!opportunities.length || !hasActivities) {
        const now = new Date();
        const subD = d => new Date(now.getTime() - d * 86400000).toISOString().split("T")[0];
        const addD = d => new Date(now.getTime() + d * 86400000).toISOString().split("T")[0];

        opportunities = [
            {
                id: 101,
                name: "Triển khai phần mềm ERP đa chi nhánh",
                customerId: 1,
                customerName: "Tập đoàn Công nghiệp Foxconn VN",
                stageId: 3,
                stageName: "Gửi đề xuất & Báo giá",
                amount: 850000000,
                probability: 50,
                expectedCloseDate: subD(4), // Quá hạn chốt 4 ngày
                lastActivityDate: subD(16),  // Im ắng 16 ngày (ngưỡng 10) -> CRITICAL
                lastActivityType: "Gửi email",
                ownerName: "Nguyễn Văn Hùng",
                status: "OPEN"
            },
            {
                id: 102,
                name: "Hệ thống CRM Doanh nghiệp Omnichannel",
                customerId: 2,
                customerName: "Ngân hàng TMCP VPBank - CN Thăng Long",
                stageId: 4,
                stageName: "Thương lượng & Đàm phán",
                amount: 1450000000,
                probability: 75,
                expectedCloseDate: addD(5),
                lastActivityDate: subD(18),  // Im ắng 18 ngày (ngưỡng 14) -> WARNING
                lastActivityType: "Họp trực tuyến",
                ownerName: "Trần Thị Mai",
                status: "OPEN"
            },
            {
                id: 103,
                name: "Gói hạ tầng Cloud & Bảo mật dữ liệu",
                customerId: 3,
                customerName: "Công ty Du lịch Viettravel Sun",
                stageId: 2,
                stageName: "Đánh giá & Xác định nhu cầu",
                amount: 320000000,
                probability: 25,
                expectedCloseDate: addD(12),
                lastActivityDate: subD(11),  // Im ắng 11 ngày (ngưỡng 7) -> WARNING
                lastActivityType: "Cuộc gọi",
                ownerName: "Lê Hoàng Long",
                status: "OPEN"
            },
            {
                id: 104,
                name: "Phần mềm HRM & Chấm công chuỗi bán lẻ",
                customerId: 4,
                customerName: "Thời trang NEM Fashion Toàn quốc",
                stageId: 1,
                stageName: "Khảo sát nhu cầu",
                amount: 480000000,
                probability: 10,
                expectedCloseDate: addD(20),
                lastActivityDate: subD(9),   // Im ắng 9 ngày (ngưỡng 5) -> WARNING
                lastActivityType: "Gặp trực tiếp",
                ownerName: "Phạm Quốc Dũng",
                status: "OPEN"
            },
            {
                id: 105,
                name: "Nâng cấp bảo mật & Tường lửa thế hệ mới",
                customerId: 5,
                customerName: "Công ty CP Logistics LogiTech Global",
                stageId: 3,
                stageName: "Gửi đề xuất & Báo giá",
                amount: 620000000,
                probability: 50,
                expectedCloseDate: subD(8), // Quá hạn chốt 8 ngày
                lastActivityDate: subD(6),  // Không vi phạm im ắng (6 < 10) nhưng QUÁ HẠN CHỐT
                lastActivityType: "Cuộc gọi",
                ownerName: "Nguyễn Văn Hùng",
                status: "OPEN"
            },
            {
                id: 106,
                name: "Giải pháp AI Voicebot Chăm sóc Khách hàng",
                customerId: 6,
                customerName: "Tập đoàn Viễn thông FPT Telecom",
                stageId: 4,
                stageName: "Thương lượng & Đàm phán",
                amount: 980000000,
                probability: 75,
                expectedCloseDate: addD(10),
                lastActivityDate: subD(2),  // Mới tương tác 2 ngày trước -> NORMAL
                lastActivityType: "Họp trực tuyến",
                ownerName: "Trần Thị Mai",
                status: "OPEN"
            },
            {
                id: 107,
                name: "Gói phần mềm kế toán doanh nghiệp vừa và nhỏ",
                customerId: 7,
                customerName: "Chuỗi Bitis Miền Bắc",
                stageId: 2,
                stageName: "Đánh giá & Xác định nhu cầu",
                amount: 190000000,
                probability: 25,
                expectedCloseDate: addD(15),
                lastActivityDate: subD(1),  // Mới tương tác 1 ngày trước -> NORMAL
                lastActivityType: "Gửi email",
                ownerName: "Lê Hoàng Long",
                status: "OPEN"
            }
        ];
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

function populateCustomerSelect() {
    const custSelects = [
        document.getElementById("opportunityCustomer"),
        document.getElementById("customerSelect"),
        document.querySelector('select[name="customerId"]'),
        document.querySelector('select[name="customer"]')
    ].filter(Boolean);

    if (custSelects.length === 0) return;

    custSelects.forEach(custSelect => {
        const currentVal = custSelect.value;
        custSelect.innerHTML = '<option value="">-- Chọn khách hàng --</option>';
        customers.forEach(c => {
            const opt = document.createElement("option");
            opt.value = c.id;
            opt.textContent = `${c.name} (${c.code || c.phone || "KH-" + c.id})`;
            custSelect.appendChild(opt);
        });
        if (currentVal) {
            custSelect.value = currentVal;
        }
    });
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
filterStagnantOnly?.addEventListener("change", render);

// Check if navigated with ?filter=stagnant
if (new URLSearchParams(window.location.search).get("filter") === "stagnant" && filterStagnantOnly) {
    filterStagnantOnly.checked = true;
}

document.getElementById("resetPipelineFilter")?.addEventListener("click", () => {
    if (searchInput) searchInput.value = "";
    if (ownerFilter) ownerFilter.value = "";
    if (filterStagnantOnly) filterStagnantOnly.checked = false;
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

    const customerIdVal = document.getElementById("opportunityCustomer")?.value || document.getElementById("customerSelect")?.value;
    const custError = document.getElementById("opportunityCustomerError");
    if (!customerIdVal) {
        if (custError) custError.textContent = "Vui lòng chọn khách hàng.";
        return;
    }
    if (custError) custError.textContent = "";

    const customerId = Number(customerIdVal);
    const matchedCustomer = customers.find(c => c.id === customerId);
    const stageId = Number(document.getElementById("opportunityStage").value) || stages[0]?.id;
    const matchedStage = stages.find(s => s.id === stageId);
    const probability = clamp(Number(document.getElementById("opportunityProbability").value) || 0, 0, 100);
    const amount = Math.max(0, Number(document.getElementById("opportunityValue").value) || 0);
    const expectedCloseDate = fieldValue("opportunityCloseDate") || null;

    const payload = {
        name,
        customerId,
        customerName: matchedCustomer ? matchedCustomer.name : "Khách hàng",
        stageId,
        stageName: matchedStage ? matchedStage.name : "Giai đoạn",
        probability,
        amount,
        expectedCloseDate,
        lastActivityDate: todayString(),
        lastActivityType: "Tương tác",
        ownerName: "Tôi",
        status: "OPEN"
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
        console.warn("Backend API not reachable or failed, saving to local state:", err);
        if (editingOppId) {
            const idx = opportunities.findIndex(o => o.id === editingOppId);
            if (idx >= 0) {
                opportunities[idx] = {
                    ...opportunities[idx],
                    ...payload
                };
            }
        } else {
            const newOpp = {
                id: Date.now(),
                ...payload
            };
            opportunities.unshift(newOpp);
        }
        try {
            localStorage.setItem("crm_ui_opportunities", JSON.stringify(opportunities));
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

    const logActBtn = event.target.closest("[data-quick-log-act]");
    if (logActBtn) {
        const id = Number(logActBtn.dataset.quickLogAct);
        const opp = opportunities.find(o => o.id === id);
        if (opp) {
            const note = prompt(`Ghi nhận tương tác mới cho "${opp.name}":\nNhập ghi chú cuộc gọi/họp để hâm nóng cơ hội và gỡ cờ cảnh báo:`, "Đã gọi điện trao đổi lại với khách hàng");
            if (note) {
                opp.lastActivityDate = todayString();
                opp.lastActivityType = "Cuộc gọi";
                opp.lastActivityNote = note;
                try {
                    localStorage.setItem("crm_ui_opportunities", JSON.stringify(opportunities));
                } catch (_) {}
                render();
                alert(`Đã ghi nhận tương tác hôm nay và gỡ cờ đình trệ thành công cho "${opp.name}"!`);
            }
        }
        return;
    }

    if (!event.target.closest(".opportunity-card")) {
        document.querySelectorAll(".card-menu").forEach(menu => menu.classList.remove("open"));
    }
});

// Cross-tab and module sync
window.addEventListener("storage", event => {
    if (event.key === "crm_ui_opportunities" || event.key === "crm_stagnancy_thresholds") {
        loadOpportunities();
    }
});

document.addEventListener("crm:stagnant-deals-updated", () => {
    loadOpportunities();
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
    const onlyStagnant = !!filterStagnantOnly?.checked;

    // Update stagnant badge count in header
    const openOpportunities = opportunities.filter(o => o.status !== "WON" && o.status !== "LOST");
    const stagnantCount = openOpportunities.filter(o => evaluateDealStagnancy(o).isStagnant).length;
    if (pipelineStagnantCountBadge) {
        if (stagnantCount > 0) {
            pipelineStagnantCountBadge.style.display = "inline-block";
            pipelineStagnantCountBadge.textContent = stagnantCount;
        } else {
            pipelineStagnantCountBadge.style.display = "none";
        }
    }

    const filtered = opportunities.filter(opp => {
        const text = `${opp.name || ""} ${opp.customerName || ""}`.toLowerCase();
        const searchOk = !query || text.includes(query);
        const ownerOk = !owner || (opp.ownerName || "").includes(owner) || (owner === "Tôi");
        const stagnantOk = !onlyStagnant || evaluateDealStagnancy(opp).isStagnant;
        return searchOk && ownerOk && stagnantOk;
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

    // Stagnancy Evaluation
    const stg = evaluateDealStagnancy(record);
    if (stg.isStagnant) {
        card.classList.add(stg.severity === "CRITICAL" ? "card-stagnant-critical" : "card-stagnant-warning");
    }

    let warningBadgesHtml = "";
    if (stg.isStagnant) {
        warningBadgesHtml = '<div class="card-warning-pill-group">';
        if (stg.severity === "CRITICAL") {
            warningBadgesHtml += `<span class="card-warning-pill pill-critical">🚨 Đình trệ nghiêm trọng (${stg.daysInactive}d im ắng${stg.isOverdue ? ' & Quá hạn ' + stg.daysOverdue + 'd' : ''})</span>`;
        } else {
            if (stg.isOverdue) {
                warningBadgesHtml += `<span class="card-warning-pill pill-overdue">🚨 Quá hạn chốt ${stg.daysOverdue} ngày</span>`;
            }
            if (stg.isInactive) {
                warningBadgesHtml += `<span class="card-warning-pill pill-inactive">⏳ Đình trệ ${stg.daysInactive} ngày</span>`;
            }
        }
        warningBadgesHtml += '</div>';
    }

    let lastActLine = "";
    if (record.lastActivityDate) {
        lastActLine = `<div class="card-last-activity-line">🕒 Tương tác: ${stg.daysInactive > 0 ? stg.daysInactive + ' ngày trước' : 'Hôm nay'} (${escapeHtml(record.lastActivityType || "Tương tác")})</div>`;
    }

    const currentStageIndex = stages.findIndex(s => s.id === record.stageId);
    const canPrev = currentStageIndex > 0;
    const canNext = currentStageIndex < stages.length - 1;

    card.innerHTML = `
        <button class="card-menu-btn" type="button" data-card-menu="${record.id}">⋮</button>

        <div class="card-menu" data-menu="${record.id}">
            <button type="button" data-edit-opportunity="${record.id}">Sửa</button>
            <button type="button" data-quick-log-act="${record.id}">📞 Ghi nhận tương tác mới</button>
            ${canPrev ? `<button type="button" data-prev-stage="${record.id}">← Giai đoạn trước</button>` : ""}
            ${canNext ? `<button type="button" data-next-stage="${record.id}">Giai đoạn tiếp →</button>` : ""}
            <button type="button" class="won" data-close-won="${record.id}">✓ Đóng Thắng</button>
            <button type="button" class="lost" data-close-lost="${record.id}">✕ Đóng Thua</button>
            <a href="stagnant-deals" style="display:block; padding:8px 12px; font-size:12px; color:var(--crm-primary); text-decoration:none;">⚠️ Xem cảnh báo đình trệ</a>
            <button type="button" style="color:#ef4444;" data-delete-opportunity="${record.id}">🗑 Xóa</button>
        </div>

        ${warningBadgesHtml}

        <h3>${escapeHtml(record.name)}</h3>

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

        ${lastActLine}

        <div style="display:flex;align-items:center;justify-content:space-between;margin-top:10px;">
            <small style="color:#64748b;font-size:10px;">
                ${escapeHtml(record.stageName || "")}
            </small>
            <div class="card-avatar" title="${escapeHtml(record.ownerName || 'Chưa phân công')}">
                ${initials(record.ownerName || "U")}
            </div>
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

    // Always ensure customers list is loaded and select element is populated
    if (!customers || customers.length === 0) {
        loadCustomers();
    } else {
        populateCustomerSelect();
    }

    if (id !== null) {
        const opp = opportunities.find(o => o.id === id);
        if (opp) {
            if (titleEl) titleEl.textContent = "Sửa cơ hội";
            setField("opportunityName", opp.name);
            setField("opportunityCustomer", opp.customerId);
            setField("customerSelect", opp.customerId);
            setField("opportunityValue", opp.amount);
            setField("opportunityCloseDate", opp.expectedCloseDate);
            setField("opportunityStage", opp.stageId);
            setField("opportunityProbability", opp.probability);
            setField("opportunityOwner", opp.ownerName);
        }
    } else {
        if (titleEl) titleEl.textContent = "Thêm cơ hội";
        opportunityForm.reset();
        populateCustomerSelect();
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
