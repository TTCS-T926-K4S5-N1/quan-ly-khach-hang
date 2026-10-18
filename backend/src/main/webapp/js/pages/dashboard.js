"use strict";

function fixMojibake(str) {
    if (!str || typeof str !== "string") return str;
    if (!str.includes("Æ") && !str.includes("Ã") && !str.includes("áº") && !str.includes("á»") && !str.includes("Ä")) {
        return str;
    }
    try {
        const bytes = [];
        for (let i = 0; i < str.length; i++) {
            const code = str.charCodeAt(i);
            if (code === 0xC3 && i + 1 < str.length && str.charCodeAt(i + 1) === 0x20) {
                bytes.push(0xC3, 0xA0);
                i++;
                continue;
            }
            if (code <= 0xFF) {
                bytes.push(code);
            } else {
                return str;
            }
        }
        return new TextDecoder("utf-8", { fatal: true }).decode(new Uint8Array(bytes));
    } catch (_) {
        return str;
    }
}


document
    .getElementById(
        "refreshDashboard"
    )
    ?.addEventListener(
        "click",
        () => {
            syncBackendData();
        }
    );


window.addEventListener(
    "storage",
    renderDashboard
);


function renderDashboard() {

    const opportunities =
        loadArray(
            "crm_ui_opportunities"
        );


    const quotes =
        loadArray(
            "crm_ui_quotes"
        );


    const activities =
        loadArray(
            "crm_ui_activities"
        );


    const users =
        loadArray(
            "crm_ui_users"
        );


    const products =
        loadArray(
            "crm_ui_products"
        );


    renderKpis(
        opportunities,
        quotes,
        activities
    );


    renderFunnel(
        opportunities
    );


    renderForecast(
        opportunities
    );


    renderRecentActivities(
        activities
    );


    renderTasks(
        activities
    );


    text(
        "systemUsers",
        users.length
    );


    text(
        "systemProducts",
        products.length
    );


    text(
        "systemQuotes",
        quotes.length
    );


    text(
        "systemScheduled",
        activities.filter(
            item =>
                Boolean(
                    item.date
                )
        ).length
    );

}


/* =========================================================
   KPI
========================================================= */

function renderKpis(
    opportunities,
    quotes,
    activities
) {

    const openOpps =
        opportunities.filter(
            item =>
                !item.status
                ||
                String(item.status).toUpperCase() === "OPEN"
        );

    const targetOpps =
        openOpps.length > 0
        ? openOpps
        : opportunities;

    const opportunityValue =
        targetOpps.reduce(
            (
                sum,
                item
            ) =>
                sum
                +
                Number(
                    item.value
                    ||
                    0
                ),
            0
        );


    const approvedQuotes =
        quotes.filter(
            quote =>
                String(quote.status || "").toLowerCase()
                ===
                "approved"
        );


    const approvedValue =
        approvedQuotes.reduce(
            (
                sum,
                quote
            ) =>
                sum
                +
                Number(
                    quote.total
                    ||
                    0
                ),
            0
        );


    const tasks =
        activities.filter(
            item =>
                item.type
                === "task"
                &&
                item.status
                !== "done"
        );


    const lateTasks =
        tasks.filter(
            task =>
                isLate(
                    task
                )
        );


    text(
        "kpiRevenue",
        money(
            opportunityValue
        )
    );


    text(
        "kpiOpportunities",
        targetOpps.length
    );


    text(
        "kpiApprovedQuotes",
        approvedQuotes.length
    );


    text(
        "kpiApprovedValue",
        "Tổng giá trị "
        +
        money(
            approvedValue
        )
    );


    text(
        "kpiTasks",
        tasks.length
    );


    text(
        "kpiLateTasks",
        `${lateTasks.length} công việc quá hạn`
    );

}


/* =========================================================
   FUNNEL
========================================================= */

function renderFunnel(
    opportunities
) {

    const container =
        document.getElementById(
            "funnelContainer"
        );


    const empty =
        document.getElementById(
            "funnelEmpty"
        );


    container.innerHTML = "";


    if (
        !opportunities.length
    ) {

        container.style.display =
            "none";

        empty.style.display =
            "flex";

        return;
    }


    container.style.display =
        "flex";

    empty.style.display =
        "none";


    const configuration =
        loadArray(
            "crm_ui_pipeline_stages"
        );


    let stages;


    if (
        configuration.length
    ) {

        stages =
            configuration.map(
                (
                    stage,
                    index
                ) => ({
                    key:
                        normalizeStageKey(
                            stage.name,
                            index
                        ),

                    label:
                        stage.name
                })
            );

    } else {

        stages = [
            {
                key: "approach",
                label: "Tiếp cận"
            },
            {
                key: "quote",
                label: "Báo giá"
            },
            {
                key: "negotiation",
                label: "Đàm phán"
            },
            {
                key: "closing",
                label: "Chốt"
            }
        ];
    }


    /*
     * Pipeline hiện dùng stage key cố định.
     * Nếu có config custom nhưng không khớp,
     * vẫn hiển thị stage mặc định bên dưới.
     */
    const existingKeys =
        new Set(
            opportunities.map(
                item =>
                    item.stage
            )
        );


    const defaults = [
        {
            key: "approach",
            label: "Tiếp cận"
        },
        {
            key: "quote",
            label: "Báo giá"
        },
        {
            key: "negotiation",
            label: "Đàm phán"
        },
        {
            key: "closing",
            label: "Chốt"
        }
    ];


    for (
        const stage
        of defaults
    ) {

        if (
            existingKeys.has(
                stage.key
            )
            &&
            !stages.some(
                item =>
                    item.key
                    === stage.key
            )
        ) {

            stages.push(
                stage
            );

        }

    }


    const counts =
        stages.map(
            stage => ({

                ...stage,

                count:
                    opportunities.filter(
                        item =>
                            item.stage
                            === stage.key
                    ).length,

                value:
                    opportunities
                        .filter(
                            item =>
                                item.stage
                                === stage.key
                        )
                        .reduce(
                            (
                                sum,
                                item
                            ) =>
                                sum
                                +
                                Number(
                                    item.value
                                    ||
                                    0
                                ),
                            0
                        )

            })
        )
        .filter(
            item =>
                item.count
                >
                0
        );


    if (
        !counts.length
    ) {

        container.style.display =
            "none";

        empty.style.display =
            "flex";

        return;
    }


    const max =
        Math.max(
            ...counts.map(
                item =>
                    item.count
            ),
            1
        );


    for (
        const item
        of counts
    ) {

        const width =
            Math.max(
                18,
                item.count
                /
                max
                *
                100
            );


        const row =
            document.createElement(
                "div"
            );


        row.className =
            "funnel-row";


        row.innerHTML = `
            <span class="funnel-stage">
                ${escapeHtml(item.label)}
            </span>

            <div class="funnel-track">

                <div
                    class="funnel-bar"
                    style="width:${width}%"
                >
                    ${item.count}
                </div>

            </div>

            <span class="funnel-value">
                ${shortMoney(item.value)}
            </span>
        `;


        container.appendChild(
            row
        );

    }

}


/* =========================================================
   FORECAST
========================================================= */

function renderForecast(
    opportunities
) {

    const container =
        document.getElementById(
            "forecastBars"
        );


    const empty =
        document.getElementById(
            "forecastEmpty"
        );


    container.innerHTML = "";


    if (
        !opportunities.length
    ) {

        container.style.display =
            "none";

        empty.style.display =
            "flex";


        text(
            "forecastTotal",
            money(0)
        );


        return;
    }


    container.style.display =
        "grid";

    empty.style.display =
        "none";


    const forecastTotal =
        opportunities.reduce(
            (
                sum,
                item
            ) =>
                sum
                +
                (
                    Number(
                        item.value
                        ||
                        0
                    )
                    *
                    Number(
                        item.probability
                        ||
                        0
                    )
                    /
                    100
                ),
            0
        );


    text(
        "forecastTotal",
        money(
            forecastTotal
        )
    );


    const groups =
        new Map();


    for (
        const item
        of opportunities
    ) {

        const key =
            item.stage
            ||
            "unknown";


        const value =
            Number(
                item.value
                ||
                0
            )
            *
            Number(
                item.probability
                ||
                0
            )
            /
            100;


        groups.set(
            key,
            (
                groups.get(key)
                ||
                0
            )
            +
            value
        );

    }


    const max =
        Math.max(
            ...groups.values(),
            1
        );


    for (
        const [
            key,
            value
        ]
        of groups
    ) {

        const row =
            document.createElement(
                "div"
            );


        row.className =
            "forecast-row";


        row.innerHTML = `
            <span class="forecast-label">
                ${stageLabel(key)}
            </span>

            <div class="forecast-track">

                <div
                    class="forecast-progress"
                    style="width:${value / max * 100}%"
                ></div>

            </div>

            <span class="forecast-value">
                ${shortMoney(value)}
            </span>
        `;


        container.appendChild(
            row
        );

    }

}


/* =========================================================
   ACTIVITY
========================================================= */

function renderRecentActivities(
    activities
) {

    const container =
        document.getElementById(
            "recentActivities"
        );


    container.innerHTML = "";


    const latest =
        [...activities]
            .sort(
                (
                    a,
                    b
                ) =>
                    String(
                        b.createdAt
                        ||
                        ""
                    )
                    .localeCompare(
                        String(
                            a.createdAt
                            ||
                            ""
                        )
                    )
            )
            .slice(
                0,
                5
            );


    document
        .getElementById(
            "recentActivitiesEmpty"
        )
        .style
        .display =
            latest.length
            ?
            "none"
            :
            "flex";


    for (
        const item
        of latest
    ) {

        const row =
            document.createElement(
                "div"
            );


        row.className =
            "recent-item";


        row.innerHTML = `
            <div class="recent-icon">
                ${activityIcon(item.type)}
            </div>

            <div class="recent-copy">

                <strong>
                    ${escapeHtml(fixMojibake(item.title || "Hoạt động"))}
                </strong>

                <span>
                    ${
                        escapeHtml(
                            fixMojibake(
                                item.relation
                                ||
                                typeLabel(
                                    item.type
                                )
                            )
                        )
                    }
                </span>

            </div>

            <small>
                ${escapeHtml(item.date || "—")}
            </small>
        `;


        container.appendChild(
            row
        );

    }

}


/* =========================================================
   TASKS
========================================================= */

function renderTasks(
    activities
) {

    const container =
        document.getElementById(
            "dashboardTasks"
        );


    container.innerHTML = "";


    const tasks =
        activities
            .filter(
                item =>
                    item.type
                    === "task"
                    &&
                    item.status
                    !== "done"
            )
            .sort(
                (
                    a,
                    b
                ) =>
                    String(
                        a.date
                        ||
                        "9999-99-99"
                    )
                    .localeCompare(
                        String(
                            b.date
                            ||
                            "9999-99-99"
                        )
                    )
            )
            .slice(
                0,
                5
            );


    document
        .getElementById(
            "dashboardTasksEmpty"
        )
        .style
        .display =
            tasks.length
            ?
            "none"
            :
            "flex";


    for (
        const task
        of tasks
    ) {

        const row =
            document.createElement(
                "div"
            );


        row.className =
            "dashboard-task";


        row.innerHTML = `
            <div class="recent-icon">
                ✓
            </div>

            <div class="dashboard-task-copy">

                <strong>
                    ${escapeHtml(fixMojibake(task.title))}
                </strong>

                <span>
                    ${
                        escapeHtml(
                            task.date
                            ||
                            "Chưa có hạn"
                        )
                    }
                    ${
                        task.owner
                        ?
                        " · "
                        +
                        escapeHtml(
                            fixMojibake(task.owner)
                        )
                        :
                        ""
                    }
                </span>

            </div>

            ${
                isLate(task)
                ?
                `
                <span class="task-warning">
                    Quá hạn
                </span>
                `
                :
                ""
            }
        `;


        container.appendChild(
            row
        );

    }

}


/* =========================================================
   HELPERS
========================================================= */

function loadArray(
    key
) {

    try {

        const value =
            JSON.parse(
                localStorage.getItem(
                    key
                )
            );

        if (!Array.isArray(value)) {
            return [];
        }

        if (key === "crm_ui_activities") {
            let hasCorrupted = false;
            const cleaned = value.map(item => {
                const rawTitle = item.title || item.subject || "";
                const rawRelation = item.relation || item.customerName || "";
                const fixedTitle = fixMojibake(rawTitle);
                const fixedRelation = fixMojibake(rawRelation);
                if (fixedTitle !== rawTitle || fixedRelation !== rawRelation) {
                    hasCorrupted = true;
                }
                return {
                    ...item,
                    title: fixedTitle || "Hoạt động",
                    relation: fixedRelation,
                    description: fixMojibake(item.description || "")
                };
            });
            if (hasCorrupted) {
                try {
                    localStorage.setItem("crm_ui_activities", JSON.stringify(cleaned));
                } catch (_) {}
            }
            return cleaned;
        }

        return value;

    } catch {

        return [];

    }

}


function money(value) {

    return new Intl.NumberFormat(
        "vi-VN",
        {
            style: "currency",
            currency: "VND",
            maximumFractionDigits: 0
        }
    )
    .format(
        Number(value)
        ||
        0
    );

}


function shortMoney(value) {

    const number =
        Number(value)
        ||
        0;


    if (
        number >=
        1000000000
    ) {

        return (
            number
            /
            1000000000
        )
        .toFixed(1)
        +
        "B ₫";

    }


    if (
        number >=
        1000000
    ) {

        return (
            number
            /
            1000000
        )
        .toFixed(1)
        +
        "M ₫";

    }


    return money(
        number
    );

}


function stageLabel(key) {

    switch (key) {

        case "approach":
            return "Tiếp cận & Khảo sát";

        case "quote":
            return "Báo giá & Đề xuất";

        case "negotiation":
            return "Thương lượng & Đàm phán";

        case "closing":
            return "Chốt thành công (Won)";

        default:
            return key;
    }

}


function normalizeStageKey(
    name,
    index
) {

    const normalized =
        String(name || "")
            .trim()
            .toLowerCase();


    if (
        normalized.includes("tiếp cận") ||
        normalized.includes("điều kiện") ||
        normalized.includes("khảo sát")
    ) {
        return "approach";
    }


    if (
        normalized.includes("báo giá") ||
        normalized.includes("đề xuất")
    ) {
        return "quote";
    }


    if (
        normalized.includes("đàm phán") ||
        normalized.includes("thương lượng")
    ) {
        return "negotiation";
    }


    if (
        normalized.includes("chốt") ||
        normalized.includes("thành công") ||
        normalized.includes("won")
    ) {
        return "closing";
    }


    return (
        "custom_"
        +
        index
    );

}


function isLate(
    task
) {

    if (
        !task.date
        ||
        task.status
        === "done"
    ) {
        return false;
    }


    return task.date
        <
        todayString();

}


function todayString() {

    const date =
        new Date();


    return (
        date.getFullYear()
        +
        "-"
        +
        String(
            date.getMonth()
            +
            1
        )
        .padStart(
            2,
            "0"
        )
        +
        "-"
        +
        String(
            date.getDate()
        )
        .padStart(
            2,
            "0"
        )
    );

}


function activityIcon(type) {

    switch (type) {

        case "call":
            return "☎";

        case "email":
            return "✉";

        case "meeting":
            return "♙";

        case "task":
            return "✓";

        default:
            return "✎";
    }

}


function typeLabel(type) {

    switch (type) {

        case "call":
            return "Cuộc gọi";

        case "email":
            return "Email";

        case "meeting":
            return "Cuộc họp";

        case "task":
            return "Công việc";

        default:
            return "Ghi chú";
    }

}


function text(
    id,
    value
) {

    const element =
        document.getElementById(
            id
        );


    if (
        element
    ) {

        element.textContent =
            value;

    }

}


function escapeHtml(value) {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
}

async function syncBackendData() {
    try {
        const API_ROOT = window.location.pathname.startsWith("/crm") ? "/crm" : "http://localhost:8080/crm";
        const [oppRes, quoteRes, actRes, userRes, prodRes, stageRes] = await Promise.all([
            fetch(API_ROOT + "/api/opportunities", { credentials: "include" }),
            fetch(API_ROOT + "/api/quotes", { credentials: "include" }),
            fetch(API_ROOT + "/api/activities", { credentials: "include" }),
            fetch(API_ROOT + "/api/users", { credentials: "include" }),
            fetch(API_ROOT + "/api/products", { credentials: "include" }),
            fetch(API_ROOT + "/api/pipeline-stages", { credentials: "include" })
        ]);

        const [oppJson, quoteJson, actJson, userJson, prodJson, stageJson] = await Promise.all([
            oppRes.json().catch(() => null),
            quoteRes.json().catch(() => null),
            actRes.json().catch(() => null),
            userRes.json().catch(() => null),
            prodRes.json().catch(() => null),
            stageRes.json().catch(() => null)
        ]);

        let changed = false;

        if (oppJson?.success && Array.isArray(oppJson.data)) {
            const opps = oppJson.data.map(o => {
                let stageKey = "approach";
                const sName = (o.stageName || "").toLowerCase();
                if (sName.includes("tiếp cận") || sName.includes("điều kiện") || sName.includes("khảo sát")) stageKey = "approach";
                else if (sName.includes("báo giá") || sName.includes("đề xuất")) stageKey = "quote";
                else if (sName.includes("đàm phán") || sName.includes("thương lượng")) stageKey = "negotiation";
                else if (sName.includes("chốt") || sName.includes("thành công") || sName.includes("won")) stageKey = "closing";
                else if (o.stageId) stageKey = String(o.stageId);

                return {
                    id: o.id,
                    name: o.name,
                    customer: o.customerName || "",
                    value: Number(o.amount || 0),
                    stage: stageKey,
                    stageId: o.stageId,
                    stageName: o.stageName,
                    probability: o.probability || 0,
                    closeDate: o.expectedCloseDate || "",
                    owner: o.ownerName || "Tôi",
                    status: o.status
                };
            });
            localStorage.setItem("crm_ui_opportunities", JSON.stringify(opps));
            changed = true;
        }

        if (quoteJson?.success && Array.isArray(quoteJson.data)) {
            const qs = quoteJson.data.map(q => ({
                id: q.id,
                code: q.quoteNumber || `BG-${q.id}`,
                customer: q.customerName || "",
                total: Number(q.totalAmount || 0),
                subtotal: Number(q.subtotal || 0),
                discountPercent: Number(q.discountPercent || 0),
                status: (q.status || "").toLowerCase()
            }));
            localStorage.setItem("crm_ui_quotes", JSON.stringify(qs));
            changed = true;
        }

        if (actJson?.success && Array.isArray(actJson.data)) {
            const acts = actJson.data.map(a => {
                let dateStr = "";
                if (a.dueDate) {
                    const dt = new Date(a.dueDate);
                    if (!isNaN(dt.getTime())) {
                        dateStr = dt.toISOString().split("T")[0];
                    }
                }
                return {
                    id: a.id,
                    type: (a.type || "task").toLowerCase(),
                    title: fixMojibake(a.subject || "Hoạt động"),
                    relation: fixMojibake(a.customerName || a.opportunityName || ""),
                    description: fixMojibake(a.description || ""),
                    date: dateStr,
                    createdAt: a.createdAt || "",
                    status: (a.status || "OPEN").toUpperCase() === "COMPLETED" ? "done" : "open"
                };
            });
            localStorage.setItem("crm_ui_activities", JSON.stringify(acts));
            changed = true;
        }

        if (userJson?.success) {
            const list = Array.isArray(userJson.data) ? userJson.data : (userJson.data?.items || []);
            localStorage.setItem("crm_ui_users", JSON.stringify(list));
            changed = true;
        }

        if (prodJson?.success) {
            const list = Array.isArray(prodJson.data) ? prodJson.data : (prodJson.data?.items || []);
            localStorage.setItem("crm_ui_products", JSON.stringify(list));
            changed = true;
        }

        if (stageJson?.success && Array.isArray(stageJson.data)) {
            const stages = stageJson.data.map(s => ({
                id: s.id,
                name: s.name,
                probability: s.probability || 0
            }));
            localStorage.setItem("crm_ui_pipeline_stages", JSON.stringify(stages));
            changed = true;
        }

        if (changed) {
            renderDashboard();
        }
    } catch (e) {
        console.warn("Could not sync backend data for dashboard:", e);
    }
}

renderDashboard();
syncBackendData();

/* =========================================================
   STORY 1: OVERDUE ALERTS & IN-APP REMINDERS (DASHBOARD)
========================================================= */
const API_ROOT_URL = (function() {
    if (window.location.pathname.startsWith("/crm")) return "/crm";
    return "http://localhost:8080/crm";
})();

async function fetchApi(path, options = {}) {
    const config = {
        credentials: "include",
        headers: {
            "Accept": "application/json",
            ...(options.body ? { "Content-Type": "application/json" } : {}),
            ...(options.headers || {})
        },
        ...options
    };
    const res = await fetch(API_ROOT_URL + path, config);
    let json = null;
    try { json = await res.json(); } catch (_) {}
    if (!res.ok || !json?.success) {
        throw new Error(json?.message || `HTTP ${res.status}`);
    }
    return json.data;
}

async function loadOverdueTasks() {
    try {
        const tasks = await fetchApi("/api/activities/overdue?limit=15");
        const banner = document.getElementById("overdueAlertBanner");
        const list = document.getElementById("overdueTasksList");
        const title = document.getElementById("overdueBannerTitle");

        if (!Array.isArray(tasks) || tasks.length === 0) {
            if (banner) banner.style.display = "none";
            return [];
        }

        if (banner) banner.style.display = "block";
        if (title) title.textContent = `⚠️ Bạn có ${tasks.length} công việc quá hạn cần xử lý ngay!`;

        if (list) {
            list.innerHTML = tasks.map(t => {
                let timeText = "Đã quá hạn";
                if (t.overdueDays > 0) timeText = `Quá hạn ${t.overdueDays} ngày`;
                else if (t.overdueHours > 0) timeText = `Quá hạn ${t.overdueHours} giờ`;

                const prioColor = t.priority === "URGENT" ? "#ef4444" : (t.priority === "HIGH" ? "#f59e0b" : "#3b82f6");
                return `
                    <div class="overdue-card">
                        <div>
                            <div class="overdue-card-title">${escapeHtml(t.subject || t.title)}</div>
                            <div class="overdue-card-meta">
                                <span class="overdue-time-tag">⏱️ ${timeText}</span>
                                <span style="font-size:10.5px; font-weight:700; color:#fff; background:${prioColor}; padding:1px 6px; border-radius:4px;">${escapeHtml(t.priority || "MEDIUM")}</span>
                                ${t.customerName ? `<span>🏢 ${escapeHtml(t.customerName)}</span>` : ""}
                                ${t.opportunityName ? `<span>💼 ${escapeHtml(t.opportunityName)}</span>` : ""}
                            </div>
                        </div>
                        <div class="overdue-card-actions">
                            <button type="button" class="crm-btn crm-btn-secondary btn-complete-task" data-id="${t.id}" style="font-size:11.5px; padding:3px 8px; color:#15803d; border-color:#86efac; background:#f0fdf4;">
                                ✓ Hoàn thành
                            </button>
                            <button type="button" class="crm-btn crm-btn-secondary btn-postpone-task" data-id="${t.id}" data-title="${escapeHtml(t.subject || t.title)}" style="font-size:11.5px; padding:3px 8px; color:#b91c1c; border-color:#fca5a5; background:#fef2f2;">
                                ⏰ Hoãn lại
                            </button>
                        </div>
                    </div>
                `;
            }).join("");

            // Wire quick buttons
            list.querySelectorAll(".btn-complete-task").forEach(btn => {
                btn.addEventListener("click", async () => {
                    const id = btn.dataset.id;
                    try {
                        await fetchApi(`/api/activities/${id}/complete`, { method: "POST" });
                        alert("✓ Đã hoàn thành công việc!");
                        loadOverdueTasks();
                        loadUpcomingReminders();
                        syncBackendData();
                    } catch (e) {
                        alert("Lỗi: " + e.message);
                    }
                });
            });

            list.querySelectorAll(".btn-postpone-task").forEach(btn => {
                btn.addEventListener("click", () => {
                    openPostponeModal(btn.dataset.id, btn.dataset.title);
                });
            });
        }
        return tasks;
    } catch (e) {
        console.warn("Could not load overdue tasks:", e);
        return [];
    }
}

async function loadUpcomingReminders() {
    try {
        const thresholdSelect = document.getElementById("reminderThresholdSelect");
        const savedThreshold = localStorage.getItem("crm_reminder_lead_minutes") || "60";
        if (thresholdSelect) thresholdSelect.value = savedThreshold;

        const minutes = parseInt(thresholdSelect?.value || savedThreshold, 10);
        const tasks = await fetchApi(`/api/activities/reminders?windowMinutes=${minutes}&limit=10`);

        const banner = document.getElementById("upcomingAlertBanner");
        const list = document.getElementById("upcomingTasksList");
        const title = document.getElementById("upcomingBannerTitle");
        const subtitle = document.getElementById("upcomingBannerSubtitle");

        if (subtitle) {
            let label = `${minutes} phút tới`;
            if (minutes >= 1440) label = `${Math.round(minutes / 1440)} ngày tới`;
            else if (minutes >= 60) label = `${Math.round(minutes / 60)} giờ tới`;
            subtitle.textContent = `Mốc cấu hình nhắc việc: Trong ${label}.`;
        }

        if (!Array.isArray(tasks) || tasks.length === 0) {
            if (banner) banner.style.display = "none";
            return tasks || [];
        }

        if (banner) banner.style.display = "block";
        if (title) title.textContent = `🔔 Nhắc việc sắp đến hạn: Có ${tasks.length} công việc cần làm sớm!`;

        if (list) {
            list.innerHTML = tasks.map(t => {
                const mins = t.minutesUntilDue != null ? t.minutesUntilDue : 30;
                let dueText = `Còn ${mins} phút`;
                if (mins >= 60) dueText = `Còn ${Math.round(mins / 60)} giờ`;

                return `
                    <div class="upcoming-chip">
                        <span style="font-weight:700; color:#854d0e;">⚡ ${dueText}:</span>
                        <strong style="color:#1e293b;">${escapeHtml(t.subject || t.title)}</strong>
                        ${t.customerName ? `<span style="color:#64748b;">(${escapeHtml(t.customerName)})</span>` : ""}
                    </div>
                `;
            }).join("");
        }

        return tasks;
    } catch (e) {
        console.warn("Could not load upcoming reminders:", e);
        return [];
    }
}

async function loadTeamOverdueSummary() {
    try {
        const summary = await fetchApi("/api/activities/team-overdue-summary");
        const section = document.getElementById("teamOverdueSection");
        const list = document.getElementById("teamOverdueList");
        const badge = document.getElementById("badgeTeamOverdueTotal");

        if (!Array.isArray(summary) || summary.length === 0) {
            if (section) section.style.display = "none";
            return;
        }

        let totalOverdue = 0;
        summary.forEach(s => totalOverdue += (s.overdueCount || 0));

        if (section) section.style.display = "block";
        if (badge) badge.textContent = `${totalOverdue} việc quá hạn toàn nhóm`;

        if (list) {
            list.innerHTML = summary.map(m => {
                const initials = (m.fullName || "U").trim().split(" ").slice(-2).map(w => w[0]).join("").toUpperCase();
                return `
                    <div class="team-member-overdue-card">
                        <div class="team-member-info">
                            <div class="team-member-avatar">${initials}</div>
                            <div>
                                <strong style="font-size:13.5px; color:#1e293b; display:block;">${escapeHtml(m.fullName)}</strong>
                                <span style="font-size:11.5px; color:#64748b;">${escapeHtml(m.teamName || "Nhóm KD")}</span>
                            </div>
                        </div>
                        <div class="team-member-counts">
                            ${m.overdueCount > 0 ? `<span class="count-badge-overdue">⚠️ ${m.overdueCount} quá hạn</span>` : `<span style="font-size:11px; color:#16a34a; background:#dcfce7; padding:2px 7px; border-radius:10px; font-weight:600;">✓ Không trễ hạn</span>`}
                            ${m.upcomingCount > 0 ? `<span class="count-badge-upcoming">🔔 ${m.upcomingCount} sắp đến hạn</span>` : ""}
                            <span style="font-size:11px; color:#94a3b8;">Tổng mở: ${m.totalOpenCount || 0} việc</span>
                        </div>
                    </div>
                `;
            }).join("");
        }
    } catch (e) {
        console.warn("User is not manager or team-overdue-summary not accessible:", e);
    }
}

async function updateNotificationBell() {
    try {
        const [overdue, upcoming] = await Promise.all([
            fetchApi("/api/activities/overdue?limit=10").catch(() => []),
            fetchApi("/api/activities/reminders?windowMinutes=1440&limit=10").catch(() => [])
        ]);

        const totalAlerts = (overdue?.length || 0) + (upcoming?.length || 0);
        const dot = document.getElementById("bellBadge");
        const countBadge = document.getElementById("remindersCountBadge");
        const dropdownList = document.getElementById("remindersDropdownList");

        if (dot) {
            dot.style.display = totalAlerts > 0 ? "block" : "none";
        }
        if (countBadge) {
            countBadge.textContent = `${totalAlerts} việc cần chú ý`;
        }

        if (dropdownList) {
            if (totalAlerts === 0) {
                dropdownList.innerHTML = `<div style="font-size:12px; color:var(--crm-muted); text-align:center; padding:12px 0;">✓ Tuyệt vời! Không có việc quá hạn hay sắp đến hạn.</div>`;
                return;
            }

            let html = "";
            if (overdue && overdue.length > 0) {
                html += `<div style="font-size:11px; font-weight:700; color:#dc2626; text-transform:uppercase; margin-top:4px;">⚠️ Việc quá hạn (${overdue.length}):</div>`;
                overdue.slice(0, 4).forEach(t => {
                    html += `
                        <div style="padding:6px 8px; border-radius:6px; background:#fef2f2; border:1px solid #fee2e2; font-size:12px;">
                            <strong style="color:#991b1b; display:block;">${escapeHtml(t.subject || t.title)}</strong>
                            <span style="font-size:11px; color:#b91c1c;">Hạn: ${t.dueDate ? new Date(t.dueDate).toLocaleDateString("vi-VN") : "—"}</span>
                        </div>
                    `;
                });
            }

            if (upcoming && upcoming.length > 0) {
                html += `<div style="font-size:11px; font-weight:700; color:#d97706; text-transform:uppercase; margin-top:8px;">🔔 Việc sắp đến hạn (${upcoming.length}):</div>`;
                upcoming.slice(0, 4).forEach(t => {
                    html += `
                        <div style="padding:6px 8px; border-radius:6px; background:#fefce8; border:1px solid #fef08a; font-size:12px;">
                            <strong style="color:#854d0e; display:block;">${escapeHtml(t.subject || t.title)}</strong>
                            <span style="font-size:11px; color:#a16207;">Còn ${t.minutesUntilDue || 0} phút</span>
                        </div>
                    `;
                });
            }
            dropdownList.innerHTML = html;
        }
    } catch (e) {
        console.warn("Could not update notification bell:", e);
    }
}

/* =========================================================
   STORY 2: QUICK CALL MODAL (3-TOUCH LOGGING & AUTO-LINK OPP)
========================================================= */
let cachedCustomersForQuickCall = [];

async function initQuickCallFeature() {
    const fab = document.getElementById("fabQuickCall");
    const modal = document.getElementById("quickCallModal");
    const overlay = document.getElementById("quickCallOverlay");
    const closeBtn = document.getElementById("closeQuickCallModal");
    const custSelect = document.getElementById("quickCallCustomerSelect");
    const form = document.getElementById("quickCallForm");

    function openModal() {
        if (modal) modal.style.display = "block";
        if (overlay) overlay.style.display = "block";
    }

    function closeModal() {
        if (modal) modal.style.display = "none";
        if (overlay) overlay.style.display = "none";
        if (form) form.reset();
        const notice = document.getElementById("quickCallLinkedOppNotice");
        if (notice) notice.style.display = "none";
    }

    fab?.addEventListener("click", openModal);
    closeBtn?.addEventListener("click", closeModal);
    overlay?.addEventListener("click", closeModal);

    // Load customers for selection
    try {
        const custs = await fetchApi("/api/customers?limit=100");
        cachedCustomersForQuickCall = Array.isArray(custs) ? custs : (custs?.items || []);
        if (custSelect) {
            custSelect.innerHTML = '<option value="">-- Chọn khách hàng vừa gọi --</option>' +
                cachedCustomersForQuickCall.map(c => `<option value="${c.id}">${escapeHtml(c.name)} (${c.phone || "Không SĐT"})</option>`).join("");
        }
    } catch (e) {
        console.warn("Could not load customers for quick call:", e);
    }

    // When customer changes, preview linked open opportunity
    custSelect?.addEventListener("change", async () => {
        const cId = custSelect.value;
        const notice = document.getElementById("quickCallLinkedOppNotice");
        const oppNameEl = document.getElementById("quickCallOppName");
        if (!cId) {
            if (notice) notice.style.display = "none";
            return;
        }

        try {
            const opps = await fetchApi(`/api/opportunities?customerId=${cId}&status=OPEN`);
            const openOpp = Array.isArray(opps) && opps.length > 0 ? opps[0] : null;
            if (openOpp) {
                if (notice) notice.style.display = "block";
                if (oppNameEl) oppNameEl.textContent = `${openOpp.name} (${new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(openOpp.amount || 0)})`;
            } else {
                if (notice) notice.style.display = "none";
            }
        } catch (_) {
            if (notice) notice.style.display = "none";
        }
    });

    // Touch buttons for outcome (1 touch)
    document.querySelectorAll(".quick-call-touch-grid .touch-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            document.querySelectorAll(".quick-call-touch-grid .touch-btn").forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            const outcomeInput = document.getElementById("quickCallOutcome");
            if (outcomeInput) outcomeInput.value = btn.dataset.outcome;
        });
    });

    // Quick tag chips
    document.querySelectorAll(".quick-tag-chip[data-tag]").forEach(chip => {
        chip.addEventListener("click", () => {
            const notesInput = document.getElementById("quickCallNotes");
            if (notesInput) {
                const current = notesInput.value.trim();
                const tag = chip.dataset.tag;
                if (!current) notesInput.value = tag;
                else if (!current.includes(tag)) notesInput.value = current + ", " + tag;
            }
        });
    });

    // Callback chips (1 touch)
    document.querySelectorAll(".callback-chip").forEach(chip => {
        chip.addEventListener("click", () => {
            document.querySelectorAll(".callback-chip").forEach(c => c.classList.remove("active"));
            chip.classList.add("active");
            const cbInput = document.getElementById("quickCallCallback");
            if (cbInput) cbInput.value = chip.dataset.cb;
        });
    });

    // Form submit
    form?.addEventListener("submit", async (e) => {
        e.preventDefault();
        const customerId = custSelect.value;
        if (!customerId) {
            alert("Vui lòng chọn khách hàng vừa gọi.");
            custSelect.focus();
            return;
        }

        const outcome = document.getElementById("quickCallOutcome")?.value || "Nghe máy - Quan tâm";
        const notes = document.getElementById("quickCallNotes")?.value || "";
        const cbPreset = document.getElementById("quickCallCallback")?.value || "tomorrow";

        // Compute callback date
        let callbackAt = null;
        if (cbPreset !== "none") {
            const d = new Date();
            if (cbPreset === "2h") {
                d.setHours(d.getHours() + 2);
            } else if (cbPreset === "tomorrow") {
                d.setDate(d.getDate() + 1);
                d.setHours(9, 0, 0, 0);
            } else if (cbPreset === "next_monday") {
                d.setDate(d.getDate() + ((1 - d.getDay() + 7) % 7 || 7));
                d.setHours(9, 0, 0, 0);
            }
            callbackAt = d.toISOString().replace("T", " ").substring(0, 19);
        }

        const submitBtn = document.getElementById("btnSubmitQuickCall");
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = "<span>⏳ Đang ghi nhận...</span>";
        }

        try {
            const res = await fetchApi("/api/activities/quick-call", {
                method: "POST",
                body: {
                    customerId: parseInt(customerId, 10),
                    outcome,
                    notes,
                    callbackAt
                }
            });

            closeModal();
            let msg = `✓ Đã ghi nhanh kết quả cuộc gọi thành công!`;
            if (res.linkedOpportunity) {
                msg += `\n🔗 Đã tự động gắn vào cơ hội mở gần nhất: "${res.linkedOpportunity.name}".`;
            }
            if (res.followUpTask) {
                msg += `\n⏰ Đã tự động lên lịch nhắc gọi lại vào: ${new Date(res.followUpTask.dueDate).toLocaleString("vi-VN")}.`;
            }
            alert(msg);

            // Re-sync dashboard
            syncBackendData();
            loadOverdueTasks();
            loadUpcomingReminders();
        } catch (err) {
            alert("Lỗi khi ghi cuộc gọi: " + err.message);
        } finally {
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.innerHTML = "<span>⚡ LƯU NHANH CUỘC GỌI</span>";
            }
        }
    });
}

/* =========================================================
   POSTPONE MODAL (QUICK POSTPONE ON DASHBOARD)
========================================================= */
function openPostponeModal(id, title) {
    const modal = document.getElementById("postponeModal");
    const overlay = document.getElementById("postponeOverlay");
    const idInput = document.getElementById("postponeTaskId");
    const titleEl = document.getElementById("postponeTaskTitle");
    const reasonInput = document.getElementById("postponeReasonInput");
    const dueInput = document.getElementById("postponeNewDueDate");

    if (idInput) idInput.value = id;
    if (titleEl) titleEl.textContent = title || "Công việc #" + id;
    if (reasonInput) reasonInput.value = "";

    // Default new due date: 3 days later
    const d = new Date();
    d.setDate(d.getDate() + 3);
    d.setHours(17, 0, 0, 0);
    if (dueInput) dueInput.value = d.toISOString().substring(0, 16);

    if (modal) modal.style.display = "block";
    if (overlay) overlay.style.display = "block";
}

function closePostponeModal() {
    const modal = document.getElementById("postponeModal");
    const overlay = document.getElementById("postponeOverlay");
    if (modal) modal.style.display = "none";
    if (overlay) overlay.style.display = "none";
}

document.getElementById("closePostponeModal")?.addEventListener("click", closePostponeModal);
document.getElementById("cancelPostponeBtn")?.addEventListener("click", closePostponeModal);
document.getElementById("postponeOverlay")?.addEventListener("click", closePostponeModal);

document.querySelectorAll(".postpone-chip").forEach(chip => {
    chip.addEventListener("click", () => {
        const input = document.getElementById("postponeReasonInput");
        if (input) input.value = chip.dataset.reason;
    });
});

document.getElementById("postponeForm")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const id = document.getElementById("postponeTaskId")?.value;
    const reason = document.getElementById("postponeReasonInput")?.value;
    const newDue = document.getElementById("postponeNewDueDate")?.value;

    if (!reason || !reason.trim()) {
        alert("Vui lòng nhập lý do hoãn công việc.");
        return;
    }

    try {
        await fetchApi(`/api/activities/${id}/postpone`, {
            method: "POST",
            body: {
                postponeReason: reason.trim(),
                newDueDate: newDue ? newDue.replace("T", " ") + ":00" : null
            }
        });

        alert("✓ Đã hoãn công việc và cập nhật hạn chót mới!");
        closePostponeModal();
        loadOverdueTasks();
        loadUpcomingReminders();
        syncBackendData();
    } catch (err) {
        alert("Lỗi khi hoãn công việc: " + err.message);
    }
});

/* =========================================================
   TOPBAR BELL TOGGLE & THRESHOLD SELECTOR
========================================================= */
const bellBtn = document.getElementById("btnRemindersBell");
const bellDropdown = document.getElementById("remindersDropdown");

bellBtn?.addEventListener("click", (e) => {
    e.stopPropagation();
    if (!bellDropdown) return;
    const isOpen = bellDropdown.style.display === "block";
    bellDropdown.style.display = isOpen ? "none" : "block";
});

document.addEventListener("click", (e) => {
    if (bellDropdown && !bellDropdown.contains(e.target) && e.target !== bellBtn) {
        bellDropdown.style.display = "none";
    }
});

document.getElementById("reminderThresholdSelect")?.addEventListener("change", (e) => {
    localStorage.setItem("crm_reminder_lead_minutes", e.target.value);
    loadUpcomingReminders();
});

// Run initial loading for Dashboard
loadOverdueTasks();
loadUpcomingReminders();
loadTeamOverdueSummary();
updateNotificationBell();
initQuickCallFeature();