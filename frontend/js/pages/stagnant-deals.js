"use strict";

(function () {
    const API_BASE = "http://localhost:8080/crm";

    // Storage Keys
    const STORAGE_KEY_THRESHOLDS = "crm_stagnancy_thresholds";
    const STORAGE_KEY_OPPORTUNITIES = "crm_ui_opportunities";
    const STORAGE_KEY_CUSTOMERS = "crm_ui_customers";

    // Default Stagnancy Thresholds Configuration (N days per stage)
    const DEFAULT_CONFIG = {
        stageThresholds: {
            1: 5,   // Khảo sát nhu cầu: max 5 ngày
            2: 7,   // Đánh giá & Xác định nhu cầu: max 7 ngày
            3: 10,  // Gửi đề xuất & Báo giá: max 10 ngày
            4: 14   // Thương lượng & Đàm phán: max 14 ngày
        },
        alertOverdueClose: true,
        criticalDoubleThreshold: true,
        autoScanIntervalSeconds: 60,
        lastEvaluatedAt: new Date().toISOString()
    };

    // Stage Definitions
    const STAGE_NAMES = {
        1: "Khảo sát nhu cầu",
        2: "Đánh giá & Xác định",
        3: "Gửi đề xuất & Báo giá",
        4: "Thương lượng & Đàm phán",
        5: "Chốt thành công (Won)",
        6: "Đóng Thua (Lost)"
    };

    let config = { ...DEFAULT_CONFIG };
    let opportunities = [];
    let evaluatedDeals = [];
    let scanTimer = null;
    let countdownTimer = null;
    let secondsUntilNextScan = 60;

    // DOM Elements
    const btnRunManualScan = document.getElementById("btnRunManualScan");
    const btnToggleConfigPanel = document.getElementById("btnToggleConfigPanel");
    const btnCloseConfigPanel = document.getElementById("btnCloseConfigPanel");
    const btnResetThresholdDefaults = document.getElementById("btnResetThresholdDefaults");
    const thresholdConfigPanel = document.getElementById("thresholdConfigPanel");
    const thresholdConfigForm = document.getElementById("thresholdConfigForm");

    const scanStatusText = document.getElementById("scanStatusText");
    const scanNextCountdown = document.getElementById("scanNextCountdown");

    // KPI Elements
    const metricStagnantCount = document.getElementById("metricStagnantCount");
    const metricStagnantRate = document.getElementById("metricStagnantRate");
    const metricRiskValue = document.getElementById("metricRiskValue");
    const metricOverdueCount = document.getElementById("metricOverdueCount");
    const metricOverdueValue = document.getElementById("metricOverdueValue");
    const metricInactiveCount = document.getElementById("metricInactiveCount");
    const metricInactiveValue = document.getElementById("metricInactiveValue");

    // Filter Elements
    const filterSearch = document.getElementById("filterSearch");
    const filterSeverity = document.getElementById("filterSeverity");
    const filterStage = document.getElementById("filterStage");
    const filterOwner = document.getElementById("filterOwner");
    const btnResetFilters = document.getElementById("btnResetFilters");

    // Table Elements
    const stagnantTableBody = document.getElementById("stagnantTableBody");
    const emptyState = document.getElementById("emptyState");
    const displayingCountBadge = document.getElementById("displayingCountBadge");

    // Modals
    const logActivityOverlay = document.getElementById("logActivityOverlay");
    const logActivityModal = document.getElementById("logActivityModal");
    const formLogActivity = document.getElementById("formLogActivity");
    const btnCloseLogActivity = document.getElementById("btnCloseLogActivity");
    const btnCancelLogActivity = document.getElementById("btnCancelLogActivity");

    const remindSalesOverlay = document.getElementById("remindSalesOverlay");
    const remindSalesModal = document.getElementById("remindSalesModal");
    const formRemindSales = document.getElementById("formRemindSales");
    const btnCloseRemindSales = document.getElementById("btnCloseRemindSales");
    const btnCancelRemindSales = document.getElementById("btnCancelRemindSales");

    const extendCloseOverlay = document.getElementById("extendCloseOverlay");
    const extendCloseModal = document.getElementById("extendCloseModal");
    const formExtendClose = document.getElementById("formExtendClose");
    const btnCloseExtendClose = document.getElementById("btnCloseExtendClose");
    const btnCancelExtendClose = document.getElementById("btnCancelExtendClose");

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

    function initCustomersData() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY_CUSTOMERS);
            if (!raw || !Array.isArray(JSON.parse(raw)) || JSON.parse(raw).length === 0) {
                localStorage.setItem(STORAGE_KEY_CUSTOMERS, JSON.stringify(DEFAULT_CUSTOMERS));
            }
        } catch (_) {
            localStorage.setItem(STORAGE_KEY_CUSTOMERS, JSON.stringify(DEFAULT_CUSTOMERS));
        }

        // Auto populate any customer dropdowns on the page
        const custSelects = [
            document.getElementById("opportunityCustomer"),
            document.getElementById("customerSelect"),
            document.querySelector('select[name="customerId"]'),
            document.querySelector('select[name="customer"]')
        ].filter(Boolean);

        if (custSelects.length > 0) {
            let list = DEFAULT_CUSTOMERS;
            try {
                list = JSON.parse(localStorage.getItem(STORAGE_KEY_CUSTOMERS)) || DEFAULT_CUSTOMERS;
            } catch (_) {}

            custSelects.forEach(sel => {
                const cur = sel.value;
                sel.innerHTML = '<option value="">-- Chọn khách hàng --</option>';
                list.forEach(c => {
                    const opt = document.createElement("option");
                    opt.value = c.id;
                    opt.textContent = `${c.name} (${c.code || c.phone || "KH-" + c.id})`;
                    sel.appendChild(opt);
                });
                if (cur) sel.value = cur;
            });
        }
    }

    /* =========================================================
       INITIALIZATION
    ========================================================= */
    async function init() {
        initCustomersData();
        loadConfiguration();
        await loadOpportunities();
        populateOwnerFilter();
        runEvaluationScan();
        setupAutoScanTask();
        bindEvents();
    }

    /* =========================================================
       CONFIGURATION MANAGEMENT
    ========================================================= */
    function loadConfiguration() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY_THRESHOLDS);
            if (raw) {
                const parsed = JSON.parse(raw);
                config = {
                    ...DEFAULT_CONFIG,
                    ...parsed,
                    stageThresholds: {
                        ...DEFAULT_CONFIG.stageThresholds,
                        ...(parsed.stageThresholds || {})
                    }
                };
            } else {
                config = { ...DEFAULT_CONFIG };
                saveConfiguration();
            }
        } catch (e) {
            console.warn("Error loading stagnancy thresholds:", e);
            config = { ...DEFAULT_CONFIG };
        }
        applyConfigToForm();
    }

    function saveConfiguration() {
        try {
            config.lastEvaluatedAt = new Date().toISOString();
            localStorage.setItem(STORAGE_KEY_THRESHOLDS, JSON.stringify(config));
        } catch (e) {
            console.error("Error saving thresholds config:", e);
        }
    }

    function applyConfigToForm() {
        if (!thresholdConfigForm) return;
        const s = config.stageThresholds || DEFAULT_CONFIG.stageThresholds;
        const setVal = (id, val) => {
            const el = document.getElementById(id);
            if (el) el.value = val;
        };

        setVal("threshStage1", s[1] ?? 5);
        setVal("threshStage2", s[2] ?? 7);
        setVal("threshStage3", s[3] ?? 10);
        setVal("threshStage4", s[4] ?? 14);

        const chkOverdue = document.getElementById("checkAlertOverdueClose");
        if (chkOverdue) chkOverdue.checked = config.alertOverdueClose !== false;

        const chkCritical = document.getElementById("checkCriticalDoubleThreshold");
        if (chkCritical) chkCritical.checked = config.criticalDoubleThreshold !== false;
    }

    function readConfigFromForm() {
        const getNum = (id, def) => {
            const val = parseInt(document.getElementById(id)?.value, 10);
            return Number.isFinite(val) && val > 0 ? val : def;
        };

        config.stageThresholds = {
            1: getNum("threshStage1", 5),
            2: getNum("threshStage2", 7),
            3: getNum("threshStage3", 10),
            4: getNum("threshStage4", 14)
        };

        const chkOverdue = document.getElementById("checkAlertOverdueClose");
        config.alertOverdueClose = chkOverdue ? chkOverdue.checked : true;

        const chkCritical = document.getElementById("checkCriticalDoubleThreshold");
        config.criticalDoubleThreshold = chkCritical ? chkCritical.checked : true;

        saveConfiguration();
    }

    /* =========================================================
       DATA LOADING & MOCK OPPORTUNITIES
    ========================================================= */
    async function loadOpportunities() {
        try {
            const res = await fetch(API_BASE + "/api/opportunities", {
                credentials: "include",
                headers: { "Accept": "application/json" }
            });
            if (res.ok) {
                const json = await res.json();
                if (json.success && Array.isArray(json.data) && json.data.length > 0) {
                    opportunities = json.data;
                }
            }
        } catch (_) {
            // Backend offline or running in mock mode
        }

        if (!opportunities || opportunities.length === 0) {
            try {
                const cached = JSON.parse(localStorage.getItem(STORAGE_KEY_OPPORTUNITIES));
                if (Array.isArray(cached) && cached.length > 0) {
                    opportunities = cached;
                }
            } catch (_) {}
        }

        // Check if opportunities have activity dates. If not, generate rich mock dataset.
        const hasValidActivityDates = opportunities.some(o => o.lastActivityDate);
        if (!opportunities.length || !hasValidActivityDates) {
            opportunities = getInitialMockOpportunities();
            saveOpportunitiesToStorage();
        }
    }

    function saveOpportunitiesToStorage() {
        try {
            localStorage.setItem(STORAGE_KEY_OPPORTUNITIES, JSON.stringify(opportunities));
        } catch (e) {
            console.warn("Could not save opportunities to localStorage:", e);
        }
    }

    function getInitialMockOpportunities() {
        const now = new Date();
        const subDays = (d) => {
            const target = new Date(now.getTime() - d * 24 * 60 * 60 * 1000);
            return target.toISOString().split("T")[0];
        };
        const addDays = (d) => {
            const target = new Date(now.getTime() + d * 24 * 60 * 60 * 1000);
            return target.toISOString().split("T")[0];
        };

        return [
            {
                id: 101,
                name: "Triển khai phần mềm ERP đa chi nhánh",
                customerId: 1,
                customerName: "Tập đoàn Công nghiệp Foxconn VN",
                stageId: 3,
                stageName: "Gửi đề xuất & Báo giá",
                amount: 850000000,
                probability: 50,
                expectedCloseDate: subDays(4), // Quá hạn chốt 4 ngày
                lastActivityDate: subDays(16),  // Im ắng 16 ngày (ngưỡng 10) -> CRITICAL
                lastActivityType: "Gửi email",
                lastActivityNote: "Đã gửi bảng báo giá phiên bản 2 qua email cho Ban Giám đốc nhưng chưa thấy phản hồi.",
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
                expectedCloseDate: addDays(5),
                lastActivityDate: subDays(18),  // Im ắng 18 ngày (ngưỡng 14) -> WARNING
                lastActivityType: "Họp trực tuyến",
                lastActivityNote: "Đã trao đổi về các điều khoản SLA hỗ trợ 24/7.",
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
                expectedCloseDate: addDays(12),
                lastActivityDate: subDays(11),  // Im ắng 11 ngày (ngưỡng 7) -> WARNING
                lastActivityType: "Cuộc gọi",
                lastActivityNote: "Khách đang cử IT thẩm định năng lực bảo mật.",
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
                expectedCloseDate: addDays(20),
                lastActivityDate: subDays(9),   // Im ắng 9 ngày (ngưỡng 5) -> WARNING
                lastActivityType: "Gặp trực tiếp",
                lastActivityNote: "Khảo sát thực tế tại trụ sở chính.",
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
                expectedCloseDate: subDays(8), // Quá hạn chốt 8 ngày
                lastActivityDate: subDays(6),  // Không vi phạm im ắng (6 < 10) nhưng QUÁ HẠN CHỐT
                lastActivityType: "Cuộc gọi",
                lastActivityNote: "Khách hẹn chốt trước ngày 15 nhưng chưa ký.",
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
                expectedCloseDate: addDays(10),
                lastActivityDate: subDays(2),  // Mới tương tác 2 ngày trước -> NORMAL
                lastActivityType: "Họp trực tuyến",
                lastActivityNote: "Thống nhất phạm vi triển khai giai đoạn 1.",
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
                expectedCloseDate: addDays(15),
                lastActivityDate: subDays(1),  // Mới tương tác 1 ngày trước -> NORMAL
                lastActivityType: "Gửi email",
                lastActivityNote: "Gửi tài liệu giới thiệu hệ thống module.",
                ownerName: "Lê Hoàng Long",
                status: "OPEN"
            },
            {
                id: 108,
                name: "Dự án chuyển đổi số toàn diện Masan Consumer",
                customerId: 8,
                customerName: "Tập đoàn Tiêu dùng Masan",
                stageId: 5,
                stageName: "Chốt thành công (Won)",
                amount: 2100000000,
                probability: 100,
                expectedCloseDate: subDays(20),
                lastActivityDate: subDays(20),
                ownerName: "Phạm Quốc Dũng",
                status: "WON"
            }
        ];
    }

    /* =========================================================
       STAGNANCY EVALUATION ENGINE (SCRUM-78 / SCRUM-203)
    ========================================================= */
    function evaluateOpportunity(opp, currentConfig) {
        // Closed deals are never stagnant
        const isClosed = opp.status === "WON" || opp.status === "LOST" || opp.stageId === 5 || opp.stageId === 6;
        if (isClosed) {
            return {
                ...opp,
                isStagnant: false,
                isInactive: false,
                isOverdue: false,
                severity: "CLOSED",
                daysInactive: 0,
                daysOverdue: 0,
                reasons: []
            };
        }

        const now = new Date();
        const todayZero = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

        // 1. Evaluate Inactivity (days without activity)
        let daysInactive = 0;
        let isInactive = false;
        const stageThreshold = currentConfig.stageThresholds[opp.stageId] || 7;

        if (opp.lastActivityDate) {
            const actDate = new Date(opp.lastActivityDate);
            const actZero = new Date(actDate.getFullYear(), actDate.getMonth(), actDate.getDate()).getTime();
            daysInactive = Math.max(0, Math.floor((todayZero - actZero) / (1000 * 60 * 60 * 24)));
            if (daysInactive > stageThreshold) {
                isInactive = true;
            }
        }

        // 2. Evaluate Overdue Close Date
        let daysOverdue = 0;
        let isOverdue = false;
        if (currentConfig.alertOverdueClose && opp.expectedCloseDate) {
            const closeDate = new Date(opp.expectedCloseDate);
            const closeZero = new Date(closeDate.getFullYear(), closeDate.getMonth(), closeDate.getDate()).getTime();
            if (closeZero < todayZero) {
                daysOverdue = Math.floor((todayZero - closeZero) / (1000 * 60 * 60 * 24));
                isOverdue = daysOverdue > 0;
            }
        }

        // 3. Determine Reasons & Severity
        const reasons = [];
        if (isInactive) {
            reasons.push({
                type: "INACTIVE",
                text: `Không có hoạt động ${daysInactive} ngày (Ngưỡng giai đoạn: ${stageThreshold} ngày)`
            });
        }
        if (isOverdue) {
            reasons.push({
                type: "OVERDUE",
                text: `Quá hạn dự kiến chốt ${daysOverdue} ngày (Hạn: ${formatDate(opp.expectedCloseDate)})`
            });
        }

        const isStagnant = isInactive || isOverdue;
        let severity = "NORMAL";

        if (isStagnant) {
            const isDoubleThreshold = currentConfig.criticalDoubleThreshold && (daysInactive >= stageThreshold * 2);
            if ((isInactive && isOverdue) || isDoubleThreshold || daysOverdue >= 7) {
                severity = "CRITICAL";
            } else {
                severity = "WARNING";
            }
        }

        return {
            ...opp,
            isStagnant,
            isInactive,
            isOverdue,
            severity,
            daysInactive,
            stageThreshold,
            daysOverdue,
            reasons
        };
    }

    function runEvaluationScan() {
        evaluatedDeals = opportunities.map(opp => evaluateOpportunity(opp, config));
        config.lastEvaluatedAt = new Date().toISOString();
        saveConfiguration();

        // Update UI
        updateKpiMetrics();
        renderTable();
        updateScanStatusBanner();

        // Dispatch Custom Event for other modules (like pipeline Kanban)
        document.dispatchEvent(new CustomEvent("crm:stagnant-deals-updated", {
            detail: {
                evaluatedDeals,
                config
            }
        }));
    }

    /* =========================================================
       PERIODIC SCAN SIMULATION (FE TASK)
    ========================================================= */
    function setupAutoScanTask() {
        if (scanTimer) clearInterval(scanTimer);
        if (countdownTimer) clearInterval(countdownTimer);

        secondsUntilNextScan = config.autoScanIntervalSeconds || 60;
        updateCountdownDisplay();

        countdownTimer = setInterval(() => {
            secondsUntilNextScan--;
            if (secondsUntilNextScan <= 0) {
                secondsUntilNextScan = config.autoScanIntervalSeconds || 60;
                runEvaluationScan();
                showToast("Tác vụ định kỳ vừa hoàn thành quét và đánh giá cơ hội!", "success");
            }
            updateCountdownDisplay();
        }, 1000);
    }

    function updateCountdownDisplay() {
        if (scanNextCountdown) {
            scanNextCountdown.textContent = `Lần quét kế tiếp sau: ${secondsUntilNextScan}s`;
        }
    }

    function updateScanStatusBanner() {
        if (scanStatusText) {
            const openCount = evaluatedDeals.filter(d => d.status !== "WON" && d.status !== "LOST").length;
            const stagnantCount = evaluatedDeals.filter(d => d.isStagnant).length;
            const timeStr = new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
            scanStatusText.textContent = `Lần quét gần nhất: ${timeStr} • Đã phân tích ${openCount} cơ hội mở • Phát hiện ${stagnantCount} cơ hội cần can thiệp.`;
        }
    }

    /* =========================================================
       KPI METRICS UPDATE
    ========================================================= */
    function updateKpiMetrics() {
        const openDeals = evaluatedDeals.filter(d => d.status !== "WON" && d.status !== "LOST");
        const stagnantDeals = openDeals.filter(d => d.isStagnant);
        const overdueDeals = openDeals.filter(d => d.isOverdue);
        const inactiveDeals = openDeals.filter(d => d.isInactive);

        const totalRiskValue = stagnantDeals.reduce((sum, d) => sum + Number(d.amount || 0), 0);
        const overdueValue = overdueDeals.reduce((sum, d) => sum + Number(d.amount || 0), 0);
        const inactiveValue = inactiveDeals.reduce((sum, d) => sum + Number(d.amount || 0), 0);

        const stagnantRate = openDeals.length > 0
            ? Math.round((stagnantDeals.length / openDeals.length) * 100)
            : 0;

        if (metricStagnantCount) metricStagnantCount.textContent = stagnantDeals.length;
        if (metricStagnantRate) metricStagnantRate.textContent = `Chiếm ${stagnantRate}% trên tổng ${openDeals.length} cơ hội mở`;
        if (metricRiskValue) metricRiskValue.textContent = formatMoney(totalRiskValue);
        if (metricOverdueCount) metricOverdueCount.textContent = overdueDeals.length;
        if (metricOverdueValue) metricOverdueValue.textContent = `${formatMoney(overdueValue)} giá trị hợp đồng`;
        if (metricInactiveCount) metricInactiveCount.textContent = inactiveDeals.length;
        if (metricInactiveValue) metricInactiveValue.textContent = `${formatMoney(inactiveValue)} cần hâm nóng`;
    }

    /* =========================================================
       FILTER & RENDER TABLE
    ========================================================= */
    function populateOwnerFilter() {
        if (!filterOwner) return;
        const owners = Array.from(new Set(opportunities.map(o => o.ownerName).filter(Boolean)));
        filterOwner.innerHTML = '<option value="">Tất cả nhân viên phụ trách</option>';
        owners.forEach(owner => {
            const opt = document.createElement("option");
            opt.value = owner;
            opt.textContent = owner;
            filterOwner.appendChild(opt);
        });
    }

    function getFilteredDeals() {
        const search = (filterSearch?.value || "").trim().toLowerCase();
        const severity = filterSeverity?.value || "";
        const stage = filterStage?.value || "";
        const owner = filterOwner?.value || "";

        return evaluatedDeals.filter(deal => {
            // Check closed status
            if (deal.status === "WON" || deal.status === "LOST") {
                if (severity !== "ALL_OPEN") return false;
            }

            // Search query
            if (search) {
                const combined = `${deal.name || ""} ${deal.customerName || ""}`.toLowerCase();
                if (!combined.includes(search)) return false;
            }

            // Severity Filter
            if (severity === "CRITICAL") {
                if (deal.severity !== "CRITICAL") return false;
            } else if (severity === "WARNING") {
                if (deal.severity !== "WARNING" && deal.severity !== "CRITICAL") return false;
            } else if (severity === "OVERDUE") {
                if (!deal.isOverdue) return false;
            } else if (severity === "INACTIVE") {
                if (!deal.isInactive) return false;
            } else if (severity !== "ALL_OPEN") {
                // Default view: only show stagnant deals
                if (!deal.isStagnant) return false;
            }

            // Stage Filter
            if (stage && String(deal.stageId) !== String(stage)) return false;

            // Owner Filter
            if (owner && deal.ownerName !== owner) return false;

            return true;
        });
    }

    function renderTable() {
        if (!stagnantTableBody) return;
        const filtered = getFilteredDeals();

        if (displayingCountBadge) {
            displayingCountBadge.textContent = `${filtered.length} cơ hội`;
        }

        if (filtered.length === 0) {
            stagnantTableBody.innerHTML = "";
            if (emptyState) emptyState.style.display = "block";
            return;
        }

        if (emptyState) emptyState.style.display = "none";

        let html = "";
        filtered.forEach(deal => {
            const rowClass = deal.severity === "CRITICAL"
                ? "row-critical"
                : (deal.severity === "WARNING" ? "row-warning" : "");

            let severityBadge = "";
            if (deal.severity === "CRITICAL") {
                severityBadge = `<span class="badge-severity critical">🚨 Nguy kịch</span>`;
            } else if (deal.severity === "WARNING") {
                severityBadge = `<span class="badge-severity warning">⚠️ Cảnh báo</span>`;
            } else {
                severityBadge = `<span class="badge-severity normal">🟢 Bình thường</span>`;
            }

            // Last Activity column
            let lastActHtml = "—";
            if (deal.lastActivityDate) {
                const tagColorClass = deal.isInactive
                    ? (deal.daysInactive >= deal.stageThreshold * 2 ? "alert-red" : "alert-amber")
                    : "alert-green";
                lastActHtml = `
                    <div class="activity-date-wrap">
                        <strong>${formatDate(deal.lastActivityDate)}</strong>
                        <span class="days-ago-tag ${tagColorClass}">
                            (${deal.daysInactive} ngày trước)
                        </span>
                        <small style="color:var(--crm-muted);">${escapeHtml(deal.lastActivityType || "Tương tác")}</small>
                    </div>
                `;
            }

            // Close Date column
            let closeDateHtml = "—";
            if (deal.expectedCloseDate) {
                closeDateHtml = `
                    <div class="close-date-wrap">
                        <span>${formatDate(deal.expectedCloseDate)}</span>
                        ${deal.isOverdue ? `<span class="overdue-tag">Quá hạn ${deal.daysOverdue} ngày</span>` : ""}
                    </div>
                `;
            }

            // Reasons
            let reasonsHtml = "";
            if (deal.reasons && deal.reasons.length > 0) {
                reasonsHtml = `
                    <div class="reason-box">
                        ${deal.reasons.map(r => `
                            <span class="reason-pill ${r.type === 'OVERDUE' ? 'pill-overdue' : 'pill-inactive'}">
                                ${r.type === 'OVERDUE' ? '🚨' : '⏳'} ${escapeHtml(r.text)}
                            </span>
                        `).join("")}
                    </div>
                `;
            } else {
                reasonsHtml = `<span style="color:#10b981; font-size:12px;">Đang theo tiến độ tốt</span>`;
            }

            html += `
                <tr class="${rowClass}" data-deal-id="${deal.id}">
                    <td>${severityBadge}</td>
                    <td>
                        <div class="deal-name-cell">
                            <a href="pipeline" class="deal-name-link" title="Xem trên Kanban">${escapeHtml(deal.name)}</a>
                            <span class="deal-customer-text">${escapeHtml(deal.customerName || "Khách hàng")}</span>
                        </div>
                    </td>
                    <td>
                        <span class="deal-stage-badge">
                            ${escapeHtml(STAGE_NAMES[deal.stageId] || deal.stageName || "Giai đoạn")}
                        </span>
                    </td>
                    <td style="text-align:right;">
                        <span class="deal-value-text">${formatMoney(deal.amount || 0)}</span>
                    </td>
                    <td>${lastActHtml}</td>
                    <td>${closeDateHtml}</td>
                    <td>${reasonsHtml}</td>
                    <td>
                        <div class="owner-cell">
                            <div class="owner-avatar">${initials(deal.ownerName || "U")}</div>
                            <span style="font-size:13px; font-weight:500;">${escapeHtml(deal.ownerName || "Chưa phân công")}</span>
                        </div>
                    </td>
                    <td>
                        <div class="action-btns-group">
                            <button class="btn-quick-act" type="button" data-action="log-act" data-id="${deal.id}" title="Ghi nhận hoạt động tương tác mới (Gỡ cờ)">
                                📞
                            </button>
                            <button class="btn-quick-act" type="button" data-action="remind-sales" data-id="${deal.id}" title="Gửi nhắc nhở chỉ đạo cho Sales Rep">
                                🔔
                            </button>
                            <button class="btn-quick-act" type="button" data-action="extend-close" data-id="${deal.id}" title="Gia hạn ngày chốt">
                                📅
                            </button>
                            <a href="pipeline" class="btn-quick-act" title="Mở bảng Kanban">
                                ➡️
                            </a>
                        </div>
                    </td>
                </tr>
            `;
        });

        stagnantTableBody.innerHTML = html;
    }

    /* =========================================================
       MODAL ACTIONS & QUICK INTERVENTIONS
    ========================================================= */
    function openLogActivityModal(dealId) {
        const deal = evaluatedDeals.find(d => d.id === dealId);
        if (!deal) return;

        document.getElementById("logActivityOppId").value = deal.id;
        document.getElementById("logActivityDealName").textContent = `Cơ hội: ${deal.name} • Khách hàng: ${deal.customerName || ""}`;
        document.getElementById("activityDate").value = todayString();
        document.getElementById("activitySummary").value = "";
        document.getElementById("activityNextStep").value = "";

        logActivityOverlay?.classList.add("active");
        logActivityModal?.classList.add("active");
    }

    function closeLogActivityModal() {
        logActivityOverlay?.classList.remove("active");
        logActivityModal?.classList.remove("active");
    }

    function openRemindSalesModal(dealId) {
        const deal = evaluatedDeals.find(d => d.id === dealId);
        if (!deal) return;

        document.getElementById("remindOppId").value = deal.id;
        document.getElementById("remindOwnerName").value = deal.ownerName || "Nhân viên kinh doanh";

        const reasonSummary = deal.reasons.map(r => r.text).join("; ") || "Cơ hội có dấu hiệu đình trệ.";
        document.getElementById("remindDealSummary").textContent = `[${deal.name}] - Cảnh báo: ${reasonSummary}`;

        document.getElementById("remindMessage").value = `Chào bạn, cơ hội "${deal.name}" đang bị gắn cờ cảnh báo do ${reasonSummary}. Vui lòng liên hệ lại khách hàng trong ngày hôm nay và cập nhật phản hồi mới nhất lên hệ thống CRM.`;

        remindSalesOverlay?.classList.add("active");
        remindSalesModal?.classList.add("active");
    }

    function closeRemindSalesModal() {
        remindSalesOverlay?.classList.remove("active");
        remindSalesModal?.classList.remove("active");
    }

    function openExtendCloseModal(dealId) {
        const deal = evaluatedDeals.find(d => d.id === dealId);
        if (!deal) return;

        document.getElementById("extendOppId").value = deal.id;
        document.getElementById("extendCloseDealName").textContent = `Cơ hội: ${deal.name}`;
        document.getElementById("currentCloseDate").value = formatDate(deal.expectedCloseDate) || "Chưa thiết lập";

        // Suggest new date + 14 days
        const target = new Date();
        target.setDate(target.getDate() + 14);
        document.getElementById("newCloseDate").value = target.toISOString().split("T")[0];

        extendCloseOverlay?.classList.add("active");
        extendCloseModal?.classList.add("active");
    }

    function closeExtendCloseModal() {
        extendCloseOverlay?.classList.remove("active");
        extendCloseModal?.classList.remove("active");
    }

    /* =========================================================
       EVENT BINDINGS
    ========================================================= */
    function bindEvents() {
        // Run manual scan
        btnRunManualScan?.addEventListener("click", () => {
            btnRunManualScan.disabled = true;
            btnRunManualScan.innerHTML = "⏳ Đang quét...";
            setTimeout(() => {
                runEvaluationScan();
                btnRunManualScan.disabled = false;
                btnRunManualScan.innerHTML = `<svg class="crm-inline-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z"/></svg> Quét & Đánh giá lại`;
                showToast("Đã quét và đánh giá lại toàn bộ cơ hội bán hàng!", "success");
            }, 400);
        });

        // Toggle threshold config panel
        btnToggleConfigPanel?.addEventListener("click", () => {
            thresholdConfigPanel?.classList.toggle("collapsed");
        });

        btnCloseConfigPanel?.addEventListener("click", () => {
            thresholdConfigPanel?.classList.add("collapsed");
        });

        // Reset threshold defaults
        btnResetThresholdDefaults?.addEventListener("click", () => {
            if (confirm("Khôi phục cấu hình ngưỡng số ngày đình trệ về mặc định ban đầu?")) {
                config = { ...DEFAULT_CONFIG };
                saveConfiguration();
                applyConfigToForm();
                runEvaluationScan();
                showToast("Đã khôi phục cấu hình ngưỡng mặc định!", "success");
            }
        });

        // Save threshold config form
        thresholdConfigForm?.addEventListener("submit", (e) => {
            e.preventDefault();
            readConfigFromForm();
            runEvaluationScan();
            showToast("Đã lưu cấu hình ngưỡng đình trệ và áp dụng ngay!", "success");
        });

        // Filter events
        filterSearch?.addEventListener("input", renderTable);
        filterSeverity?.addEventListener("change", renderTable);
        filterStage?.addEventListener("change", renderTable);
        filterOwner?.addEventListener("change", renderTable);

        btnResetFilters?.addEventListener("click", () => {
            if (filterSearch) filterSearch.value = "";
            if (filterSeverity) filterSeverity.value = "";
            if (filterStage) filterStage.value = "";
            if (filterOwner) filterOwner.value = "";
            renderTable();
        });

        // Table Action Buttons Delegate
        stagnantTableBody?.addEventListener("click", (e) => {
            const btn = e.target.closest(".btn-quick-act");
            if (!btn) return;
            const action = btn.dataset.action;
            const dealId = Number(btn.dataset.id);
            if (!dealId) return;

            if (action === "log-act") {
                openLogActivityModal(dealId);
            } else if (action === "remind-sales") {
                openRemindSalesModal(dealId);
            } else if (action === "extend-close") {
                openExtendCloseModal(dealId);
            }
        });

        // Modal Log Activity Submit
        formLogActivity?.addEventListener("submit", (e) => {
            e.preventDefault();
            const dealId = Number(document.getElementById("logActivityOppId").value);
            const type = document.getElementById("activityType").value;
            const date = document.getElementById("activityDate").value;
            const summary = document.getElementById("activitySummary").value;

            const deal = opportunities.find(d => d.id === dealId);
            if (deal) {
                deal.lastActivityDate = date;
                deal.lastActivityType = type;
                deal.lastActivityNote = summary;
                saveOpportunitiesToStorage();
                runEvaluationScan();
                closeLogActivityModal();
                showToast(`Đã ghi nhận ${type} và gỡ cờ đình trệ cho "${deal.name}"!`, "success");
            }
        });

        btnCloseLogActivity?.addEventListener("click", closeLogActivityModal);
        btnCancelLogActivity?.addEventListener("click", closeLogActivityModal);
        logActivityOverlay?.addEventListener("click", closeLogActivityModal);

        // Modal Remind Sales Submit
        formRemindSales?.addEventListener("submit", (e) => {
            e.preventDefault();
            const dealId = Number(document.getElementById("remindOppId").value);
            const ownerName = document.getElementById("remindOwnerName").value;
            closeRemindSalesModal();
            showToast(`Đã gửi thông báo chỉ đạo thành công tới Sales Rep ${ownerName}!`, "success");
        });

        btnCloseRemindSales?.addEventListener("click", closeRemindSalesModal);
        btnCancelRemindSales?.addEventListener("click", closeRemindSalesModal);
        remindSalesOverlay?.addEventListener("click", closeRemindSalesModal);

        // Modal Extend Close Date Submit
        formExtendClose?.addEventListener("submit", (e) => {
            e.preventDefault();
            const dealId = Number(document.getElementById("extendOppId").value);
            const newDate = document.getElementById("newCloseDate").value;
            const deal = opportunities.find(d => d.id === dealId);
            if (deal) {
                deal.expectedCloseDate = newDate;
                saveOpportunitiesToStorage();
                runEvaluationScan();
                closeExtendCloseModal();
                showToast(`Đã gia hạn ngày dự kiến chốt của "${deal.name}" sang ${formatDate(newDate)}!`, "success");
            }
        });

        btnCloseExtendClose?.addEventListener("click", closeExtendCloseModal);
        btnCancelExtendClose?.addEventListener("click", closeExtendCloseModal);
        extendCloseOverlay?.addEventListener("click", closeExtendCloseModal);
    }

    /* =========================================================
       HELPER UTILITIES
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
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return dateStr;
        return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
    }

    function todayString() {
        const d = new Date();
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    }

    function initials(name) {
        const parts = String(name || "").trim().split(/\s+/).filter(Boolean);
        if (!parts.length) return "U";
        if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
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
        const existing = document.querySelector(".crm-toast");
        if (existing) existing.remove();

        const toast = document.createElement("div");
        toast.className = `crm-toast toast-${type}`;
        toast.innerHTML = `<span>${message}</span>`;
        document.body.appendChild(toast);

        requestAnimationFrame(() => toast.classList.add("show"));
        setTimeout(() => {
            toast.classList.remove("show");
            setTimeout(() => toast.remove(), 250);
        }, 3500);
    }

    // Expose evaluation API for other pages (like pipeline.js)
    window.crmStagnancy = {
        evaluateOpportunity,
        loadConfiguration: () => config,
        runEvaluationScan
    };

    // Initialize when DOM ready
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }
})();
