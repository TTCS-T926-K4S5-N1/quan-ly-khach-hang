"use strict";

const API_BASE = "http://localhost:8080/crm";

let timeline = [];
let currentCustomer = null;
let customerContacts = [];
let customerOpportunities = { all: [], open: [], closed: [] };
let customerAttachments = [];
let allCustomersCache = [];
let currentOppFilter = "all";
let currentActFilter = "all";

const timelineList = document.getElementById("timelineList");
const timelineEmpty = document.getElementById("timelineEmpty");
const composer = document.getElementById("activityComposer");
const noteInput = document.getElementById("activityNote");
const typeInput = document.getElementById("activityType");
const modal = document.getElementById("companyModal");
const modalOverlay = document.getElementById("companyModalOverlay");

// Contact Modal elements
const contactModal = document.getElementById("contactModal");
const contactModalOverlay = document.getElementById("contactModalOverlay");
const contactForm = document.getElementById("contactForm");

// Attachment Modal elements
const attachmentModal = document.getElementById("attachmentModal");
const attachmentModalOverlay = document.getElementById("attachmentModalOverlay");
const attachmentForm = document.getElementById("attachmentForm");

const params = new URLSearchParams(window.location.search);
const customerId = params.get("id") || "3";

/* =========================================================
   API CLIENT
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
   INITIALIZATION (CUSTOMER 360 COMPLETE)
========================================================= */
async function initCustomer360() {
    if (!customerId) return;

    const startTime = performance.now();

    try {
        const data = await api(`/api/customers/${customerId}/360`);
        const totalElapsedMs = Math.round(performance.now() - startTime);

        if (data) {
            // 1. COMPANY INFORMATION
            if (data.customer) {
                currentCustomer = data.customer;
                writeDisplay("company360Name", data.customer.name);
                writeDisplay("company360Tax", data.customer.taxCode);
                writeDisplay("company360Industry", data.customer.industry);
                writeDisplay("company360Size", data.customer.companySize || data.customer.type || "Doanh nghiệp lớn");
                writeDisplay("company360Phone", data.customer.phone);
                writeDisplay("company360Website", data.customer.website);
                writeDisplay("company360Owner", data.customer.ownerName || "Chưa phân công");
            }

            // 2. KPIS SUMMARY
            if (data.kpis) {
                const kpis = data.kpis;
                const wonEl = document.getElementById("kpiWonAmount");
                if (wonEl) wonEl.textContent = formatMoney(kpis.totalWonAmount || 0);

                const wonCountEl = document.getElementById("kpiWonCount");
                if (wonCountEl) wonCountEl.textContent = `${kpis.wonOpportunitiesCount || 0} hợp đồng thành công`;

                const openEl = document.getElementById("kpiOpenAmount");
                if (openEl) openEl.textContent = formatMoney(kpis.openPipelineAmount || 0);

                const openCountEl = document.getElementById("kpiOpenCount");
                if (openCountEl) openCountEl.textContent = `${kpis.openOpportunitiesCount || 0} cơ hội tiềm năng`;

                const winRateEl = document.getElementById("kpiWinRate");
                if (winRateEl) winRateEl.textContent = `${kpis.winRate || 0}%`;

                const totalOppsEl = document.getElementById("kpiTotalOpps");
                if (totalOppsEl) totalOppsEl.textContent = `${kpis.totalOpportunitiesCount || 0} tổng cơ hội`;

                const speedEl = document.getElementById("kpiLoadSpeed");
                if (speedEl) speedEl.textContent = `${totalElapsedMs} ms`;

                const speedHintEl = document.getElementById("kpiLoadHint");
                if (speedHintEl) {
                    speedHintEl.textContent = `DB: ${data.performance?.executionTimeMs || 0} ms (${kpis.activitiesCount || 0} hoạt động)`;
                }
            }

            // 3. CONTACTS
            customerContacts = Array.isArray(data.contacts) ? data.contacts : [];
            const tabCont = document.getElementById("tabCountContacts");
            if (tabCont) tabCont.textContent = customerContacts.length;
            renderContacts();

            // 4. OPPORTUNITIES
            if (data.opportunities) {
                customerOpportunities = {
                    all: data.opportunities.all || [],
                    open: data.opportunities.open || [],
                    closed: data.opportunities.closed || []
                };
            }
            const tabOpp = document.getElementById("tabCountOpportunities");
            if (tabOpp) tabOpp.textContent = customerOpportunities.all.length;
            renderOpportunities();

            // 5. ATTACHMENTS
            customerAttachments = Array.isArray(data.attachments) ? data.attachments : [];
            const tabAtt = document.getElementById("tabCountAttachments");
            if (tabAtt) tabAtt.textContent = customerAttachments.length;
            renderAttachments();

            // 6. 500 ACTIVITIES TIMELINE
            timeline = [];
            if (Array.isArray(data.activities)) {
                data.activities.forEach(a => {
                    timeline.push({
                        id: a.id,
                        type: (a.type || "note").toLowerCase(),
                        text: a.description || a.subject || "",
                        time: a.createdAt ? new Date(a.createdAt) : new Date(),
                        user: a.userName || ""
                    });
                });
            }
            updateTimelineCounters();
            renderTimeline();
        }
    } catch (err) {
        console.warn("Could not load customer 360 data:", err);
        // Fallback mock data khi mở file tĩnh trực tiếp hoặc offline
        loadCustomer360Fallback(customerId);
    }

    // Kiểm tra xem khách hàng này có trùng lặp với công ty nào không
    checkCustomerDuplicates();

    // Tự động kiểm tra cờ rủi ro rời bỏ (Churn Risk) và hiển thị cảnh báo
    checkCustomerChurnRisk();
}

/* =========================================================
   DUPLICATE DETECTION WARNING ON 360 PAGE
========================================================= */
async function checkCustomerDuplicates() {
    if (!currentCustomer) return;
    try {
        const dupes = await api(`/api/customers/check-duplicate?excludeId=${currentCustomer.id}&name=${encodeURIComponent(currentCustomer.name || "")}&taxCode=${encodeURIComponent(currentCustomer.taxCode || "")}&website=${encodeURIComponent(currentCustomer.website || "")}`);
        const warnBox = document.getElementById("duplicateWarning360");
        const titleEl = document.getElementById("dupWarningTitle");
        const descEl = document.getElementById("dupWarningDesc");
        const btnMerge = document.getElementById("btnOpenMergeFrom360");

        if (Array.isArray(dupes) && dupes.length > 0) {
            const first = dupes[0];
            if (warnBox) warnBox.style.display = "block";
            if (titleEl) {
                titleEl.textContent = `⚠️ Cảnh báo trùng lặp: Phát hiện công ty '${first.name}' (Mã: #${first.id}) có thông tin trùng!`;
            }
            if (descEl) {
                descEl.textContent = `Lý do nghi ngờ: ${first.matchReasons?.join(", ") || "Trùng thông tin"}. Người phụ trách: ${first.ownerName || "Chưa rõ"}. Tránh tình trạng hai nhân viên cùng chào một công ty!`;
            }
            if (btnMerge) {
                btnMerge.onclick = () => {
                    window.location.href = `customers?mergeMaster=${currentCustomer.id}&mergeDuplicate=${first.id}`;
                };
            }
        } else {
            if (warnBox) warnBox.style.display = "none";
        }
    } catch (e) {
        console.warn("Could not check duplicate for 360 page:", e);
    }
}

/* =========================================================
   CHURN RISK DETECTION & TICKETS INTEGRATION (SCRUM-167)
========================================================= */
const DEFAULT_FALLBACK_CUSTOMERS = {
    "1": { id: 1, name: "Công ty TNHH Dịch vụ & Du lịch Viettravel Sun", taxCode: "0108923412", industry: "Du lịch & Khách sạn", companySize: "50-200 nhân viên", phone: "0903124578", website: "https://viettravelsun.vn", ownerName: "Nguyễn Văn Dũng" },
    "2": { id: 2, name: "Ngân hàng TMCP Việt Nam Thịnh Vượng (VPBank Thăng Long)", taxCode: "0100233583", industry: "Tài chính - Ngân hàng", companySize: "Trên 500 nhân viên", phone: "02439288888", website: "https://vpbank.com.vn", ownerName: "Hoàng Đức Hải" },
    "3": { id: 3, name: "Chuỗi Bán lẻ Thời trang Nem Fashion", taxCode: "0103765432", industry: "Bán lẻ & Chuỗi cửa hàng", companySize: "200-500 nhân viên", phone: "0936112233", website: "https://nemfashion.vn", ownerName: "Lê Thu Hà" },
    "4": { id: 4, name: "Công ty Cổ phần Dược phẩm An Sinh Medicare", taxCode: "0314567890", industry: "Y tế & Dược phẩm", companySize: "50-200 nhân viên", phone: "0977889900", website: "https://ansinhmedicare.com", ownerName: "Trần Minh Quang" },
    "5": { id: 5, name: "Tập đoàn Sản xuất & Chế tạo Cơ khí Nam Á", taxCode: "3701239876", industry: "Sản xuất & Cơ khí", companySize: "Trên 500 nhân viên", phone: "02743899222", website: "https://nama-machinery.com.vn", ownerName: "Nguyễn Văn Dũng" },
    "7": { id: 7, name: "Công ty Cổ phần Giải pháp Logistics LogiTech Việt Nam", taxCode: "0201889922", industry: "Logistics & Vận tải", companySize: "50-200 nhân viên", phone: "0918776655", website: "https://logitech-vn.com", ownerName: "Hoàng Đức Hải" }
};

function loadCustomer360Fallback(id) {
    const cust = DEFAULT_FALLBACK_CUSTOMERS[String(id)] || DEFAULT_FALLBACK_CUSTOMERS["3"];
    currentCustomer = cust;

    writeDisplay("company360Name", cust.name);
    writeDisplay("company360Tax", cust.taxCode);
    writeDisplay("company360Industry", cust.industry);
    writeDisplay("company360Size", cust.companySize || "Doanh nghiệp lớn");
    writeDisplay("company360Phone", cust.phone);
    writeDisplay("company360Website", cust.website);
    writeDisplay("company360Owner", cust.ownerName);

    // Mock KPIs
    const wonEl = document.getElementById("kpiWonAmount");
    if (wonEl) wonEl.textContent = "1.250.000.000 ₫";
    const wonCountEl = document.getElementById("kpiWonCount");
    if (wonCountEl) wonCountEl.textContent = "2 hợp đồng thành công";
    const openEl = document.getElementById("kpiOpenAmount");
    if (openEl) openEl.textContent = "450.000.000 ₫";
    const openCountEl = document.getElementById("kpiOpenCount");
    if (openCountEl) openCountEl.textContent = "1 cơ hội tiềm năng";
    const winRateEl = document.getElementById("kpiWinRate");
    if (winRateEl) winRateEl.textContent = "67%";
    const totalOppsEl = document.getElementById("kpiTotalOpps");
    if (totalOppsEl) totalOppsEl.textContent = "3 tổng cơ hội";
    const speedEl = document.getElementById("kpiLoadSpeed");
    if (speedEl) speedEl.textContent = "45 ms";

    // Mock Contacts
    customerContacts = [
        { id: 1, name: "Nguyễn Hoàng Nam", title: "Giám đốc Vận hành", phone: cust.phone, email: "nam.nh@nemfashion.vn", buyingRole: "DECISION_MAKER", isPrimary: true },
        { id: 2, name: "Trần Thu Trang", title: "Trưởng phòng CNTT", phone: "0912345678", email: "trang.tt@nemfashion.vn", buyingRole: "INFLUENCER", isPrimary: false }
    ];
    const tabCont = document.getElementById("tabCountContacts");
    if (tabCont) tabCont.textContent = customerContacts.length;
    renderContacts();
}

function checkCustomerChurnRisk() {
    if (!currentCustomer) return;
    const cId = Number(currentCustomer.id || customerId);

    // Đọc danh sách tickets từ localStorage
    let allTickets = [];
    try {
        const raw = localStorage.getItem("crm_ui_tickets");
        if (raw) allTickets = JSON.parse(raw);
    } catch (_) {}

    // Lọc tickets của khách hàng này
    const custTickets = allTickets.filter(t => 
        Number(t.customerId) === cId || 
        (currentCustomer.name && t.customerName && t.customerName.toLowerCase().includes(currentCustomer.name.toLowerCase()))
    );

    const unresolvedTickets = custTickets.filter(t => t.status === "NEW" || t.status === "IN_PROGRESS" || t.status === "PENDING");
    const urgentUnresolved = unresolvedTickets.filter(t => t.priority === "URGENT");

    const warnBox = document.getElementById("churnRiskWarning360");
    const titleEl = document.getElementById("churn360Title");
    const badgeEl = document.getElementById("churn360LevelBadge");
    const countEl = document.getElementById("churn360TicketCount");
    const ownerEl = document.getElementById("churn360Owner");
    const statusPill = document.getElementById("company360ChurnStatus");
    const tabCountTickets = document.getElementById("tabCountTickets");
    const btnNotify = document.getElementById("btnNotifySalesFrom360");
    const btnViewTickets = document.getElementById("btnViewTicketsFrom360");
    const btnAddTicket = document.getElementById("btnAddTicketFrom360");

    const isFile = window.location.protocol === "file:" || window.location.pathname.endsWith(".html");
    const ticketsPageUrl = isFile ? `support-tickets.html?customerId=${cId}` : `support-tickets?customerId=${cId}`;
    const newTicketUrl = isFile ? `support-tickets.html?newTicket=1&customerId=${cId}` : `support-tickets?newTicket=1&customerId=${cId}`;

    if (btnViewTickets) btnViewTickets.href = ticketsPageUrl;
    if (btnAddTicket) btnAddTicket.href = newTicketUrl;

    if (tabCountTickets) tabCountTickets.textContent = custTickets.length;

    // Render danh sách tickets vào panel
    renderCustomerTickets(custTickets, unresolvedTickets);

    const isRisk = unresolvedTickets.length >= 2 || (unresolvedTickets.length >= 1 && urgentUnresolved.length > 0);

    if (isRisk) {
        const isCritical = unresolvedTickets.length >= 3 || (unresolvedTickets.length >= 2 && urgentUnresolved.length > 0);
        if (warnBox) warnBox.style.display = "block";
        if (badgeEl) {
            badgeEl.textContent = isCritical ? "RỦI RO: RẤT CAO" : "RỦI RO: CAO";
            badgeEl.style.background = isCritical ? "#fee2e2" : "#ffedd5";
            badgeEl.style.color = isCritical ? "#b91c1c" : "#c2410c";
            badgeEl.style.borderColor = isCritical ? "#fca5a5" : "#fed7aa";
        }
        if (countEl) countEl.textContent = unresolvedTickets.length;
        if (ownerEl) ownerEl.textContent = currentCustomer.ownerName || currentCustomer.owner || "Lê Thu Hà";

        if (statusPill) {
            statusPill.innerHTML = `
                <span class="churn-status-pill danger" style="display:inline-flex; align-items:center; gap:4px; font-size:12px; font-weight:700; padding:3px 8px; border-radius:6px; background:#fee2e2; color:#b91c1c; border:1px solid #fca5a5;">
                    🚨 Nguy cơ rời bỏ (${unresolvedTickets.length} ticket tồn đọng)
                </span>
            `;
        }

        if (btnNotify) {
            btnNotify.onclick = () => {
                showToast360(`🔔 ĐÃ GỬI BÁO ĐỘNG KHẨN CẤP tới NVKD: ${currentCustomer.ownerName || "phụ trách"}! Yêu cầu chủ động liên hệ khách hàng ngay để giữ chân khách.`);
            };
        }
    } else {
        if (warnBox) warnBox.style.display = "none";
        if (statusPill) {
            statusPill.innerHTML = `
                <span class="churn-status-pill normal" style="display:inline-flex; align-items:center; gap:4px; font-size:12px; font-weight:700; padding:2px 8px; border-radius:6px; background:#dcfce7; color:#15803d;">
                    ✅ An toàn / Bình thường
                </span>
            `;
        }
    }
}

function renderCustomerTickets(allCustTickets, unresolved) {
    const listEl = document.getElementById("customerTicketsList");
    const emptyEl = document.getElementById("ticketsEmpty360");
    const summaryEl = document.getElementById("ticketsSummaryText");
    if (!listEl) return;

    if (summaryEl) {
        summaryEl.textContent = `${unresolved.length} ticket chưa xử lý / ${allCustTickets.length} tổng số`;
    }

    listEl.innerHTML = "";
    if (allCustTickets.length === 0) {
        if (emptyEl) emptyEl.style.display = "block";
        return;
    }
    if (emptyEl) emptyEl.style.display = "none";

    allCustTickets.forEach(t => {
        const item = document.createElement("div");
        item.style.cssText = "background:#fff; border:1px solid var(--crm-border); border-radius:8px; padding:10px 12px; box-shadow:0 1px 3px rgba(0,0,0,0.04);";

        const isUrgent = t.priority === "URGENT";
        const priorityColor = isUrgent ? "#dc2626" : (t.priority === "HIGH" ? "#ea580c" : "#2563eb");
        const priorityBg = isUrgent ? "#fee2e2" : (t.priority === "HIGH" ? "#ffedd5" : "#eff6ff");
        const isFile = window.location.protocol === "file:" || window.location.pathname.endsWith(".html");
        const ticketUrl = isFile ? `support-tickets.html?customerId=${t.customerId}` : `support-tickets?customerId=${t.customerId}`;

        item.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:8px;">
                <span style="font-family:monospace; font-weight:700; color:var(--crm-primary); font-size:12px;">#${escapeHtml(t.code || t.id)}</span>
                <span style="font-size:11px; font-weight:700; color:${priorityColor}; background:${priorityBg}; padding:2px 6px; border-radius:4px;">${escapeHtml(t.priority)}</span>
            </div>
            <a href="${ticketUrl}" style="font-weight:600; font-size:13px; color:var(--crm-text); text-decoration:none; margin:4px 0 6px; display:block;">
                ${escapeHtml(t.subject)}
            </a>
            <div style="display:flex; justify-content:space-between; align-items:center; font-size:11.5px; color:var(--crm-muted);">
                <span>Xử lý: <strong>${escapeHtml(t.assignee || "—")}</strong></span>
                <span style="font-weight:600; color:var(--crm-text);">${escapeHtml(t.status)}</span>
            </div>
        `;
        listEl.appendChild(item);
    });
}

function showToast360(msg) {
    let region = document.querySelector(".crm-toast-region");
    if (!region) {
        region = document.createElement("div");
        region.className = "crm-toast-region";
        document.body.appendChild(region);
    }
    const toast = document.createElement("div");
    toast.className = "crm-toast crm-toast-warning";
    toast.innerHTML = `
        <span class="crm-toast-icon">⚠️</span>
        <div class="crm-toast-copy">${escapeHtml(msg)}</div>
        <button class="crm-toast-close" type="button">✕</button>
    `;
    region.appendChild(toast);
    toast.querySelector(".crm-toast-close")?.addEventListener("click", () => toast.remove());
    setTimeout(() => toast.remove(), 4500);
}

/* =========================================================
   CONTACTS MANAGEMENT & BUYING ROLES
========================================================= */
async function loadContacts() {
    if (!customerId) return;
    try {
        const data = await api(`/api/contacts?customerId=${customerId}`);
        customerContacts = Array.isArray(data) ? data : [];
        const tabCont = document.getElementById("tabCountContacts");
        if (tabCont) tabCont.textContent = customerContacts.length;
        renderContacts();
    } catch (err) {
        console.warn("Could not load contacts:", err);
    }
}

function renderContacts() {
    const listEl = document.getElementById("contactsList");
    const emptyEl = document.getElementById("contactsEmpty");
    if (!listEl) return;

    listEl.innerHTML = "";
    if (!customerContacts || customerContacts.length === 0) {
        if (emptyEl) emptyEl.style.display = "flex";
        return;
    }

    if (emptyEl) emptyEl.style.display = "none";

    const roleBadges = {
        "DECISION_MAKER": {
            label: "👑 Người quyết định",
            cls: "role-decision-maker",
            desc: "Duyệt ngân sách & ký hợp đồng"
        },
        "INFLUENCER": {
            label: "💡 Người ảnh hưởng",
            cls: "role-influencer",
            desc: "Đánh giá chuyên môn & giải pháp kỹ thuật"
        },
        "END_USER": {
            label: "👤 Người dùng cuối",
            cls: "role-end-user",
            desc: "Trực tiếp vận hành & sử dụng hệ thống"
        },
        "BLOCKER": {
            label: "⚠️ Người cản trở",
            cls: "role-blocker",
            desc: "Lo ngại rủi ro, cần tháo gỡ rào cản"
        }
    };

    customerContacts.forEach(c => {
        const card = document.createElement("div");
        card.className = `contact-card ${c.isPrimary ? "is-primary" : ""}`;

        const role = roleBadges[c.buyingRole] || {
            label: c.buyingRoleLabel || c.buyingRole || "Người liên hệ",
            cls: "role-influencer",
            desc: ""
        };

        let historyHtml = "";
        if (Array.isArray(c.companyHistory) && c.companyHistory.length > 0) {
            const hItems = c.companyHistory.map(h => 
                `<span>🏢 Từng làm tại <strong>${escapeHtml(h.customerName)}</strong>${h.jobTitle ? ` (${escapeHtml(h.jobTitle)})` : ""}</span>`
            ).join("<br>");
            historyHtml = `<div class="contact-history-badge">${hItems}</div>`;
        }

        card.innerHTML = `
            <div class="contact-card-head">
                <div class="contact-card-title">
                    <span>${escapeHtml(c.name)}</span>
                    ${c.isPrimary ? '<span class="primary-badge">★ Đầu mối chính</span>' : ""}
                </div>
            </div>

            <div class="contact-job-title">${escapeHtml(c.title || "Chưa cập nhật chức danh")}</div>

            <div>
                <span class="contact-role-badge ${role.cls}" title="${escapeHtml(role.desc)}">
                    ${role.label}
                </span>
            </div>

            <div class="contact-details">
                ${c.phone ? `
                    <div class="contact-details-row">
                        <span>📞</span>
                        <a href="tel:${escapeHtml(c.phone)}">${escapeHtml(c.phone)}</a>
                    </div>
                ` : ""}
                ${c.email ? `
                    <div class="contact-details-row">
                        <span>✉️</span>
                        <a href="mailto:${escapeHtml(c.email)}">${escapeHtml(c.email)}</a>
                    </div>
                ` : ""}
                ${c.notes ? `
                    <div class="contact-notes-text">
                        📝 ${escapeHtml(c.notes)}
                    </div>
                ` : ""}
                ${historyHtml}
            </div>

            <div class="contact-card-actions">
                <button type="button" class="contact-action-btn" data-edit-contact="${c.id}">
                    ✏️ Sửa / Chuyển cty
                </button>
                <button type="button" class="contact-action-btn btn-delete" data-delete-contact="${c.id}">
                    🗑 Xóa
                </button>
            </div>
        `;

        listEl.appendChild(card);
    });
}

async function openContactModal(contactId = null) {
    if (!contactModal) return;
    contactForm?.reset();

    const editIdInput = document.getElementById("editContactId");
    const modalTitle = document.getElementById("contactModalTitle");
    const transferSec = document.getElementById("transferCompanySection");
    const historyBox = document.getElementById("contactHistoryBox");

    if (contactId) {
        const contact = customerContacts.find(x => Number(x.id) === Number(contactId));
        if (contact) {
            modalTitle.textContent = "Chỉnh sửa người liên hệ";
            setValue("editContactId", contact.id);
            setValue("contactName", contact.name);
            setValue("contactTitle", contact.title);
            setValue("contactPhone", contact.phone);
            setValue("contactEmail", contact.email);
            setValue("contactBuyingRole", contact.buyingRole || "INFLUENCER");
            setValue("contactNotes", contact.notes);

            const isPrimaryCb = document.getElementById("contactIsPrimary");
            if (isPrimaryCb) isPrimaryCb.checked = Boolean(contact.isPrimary);

            if (transferSec) {
                transferSec.style.display = "block";
                await loadCustomersDropdown(contact.customerId);
                setValue("contactTransferReason", "");
            }

            if (historyBox) {
                if (Array.isArray(contact.companyHistory) && contact.companyHistory.length > 0) {
                    historyBox.style.display = "block";
                    historyBox.innerHTML = `<strong>Lịch sử các công ty từng công tác:</strong><ul style="margin:4px 0 0 16px; padding:0;">` +
                        contact.companyHistory.map(h => 
                            `<li>${escapeHtml(h.customerName)} (${escapeHtml(h.jobTitle || "Nhân sự")})${h.notes ? ` - <em>${escapeHtml(h.notes)}</em>` : ""}</li>`
                        ).join("") + `</ul>`;
                } else {
                    historyBox.style.display = "none";
                    historyBox.innerHTML = "";
                }
            }
        }
    } else {
        modalTitle.textContent = "Thêm người liên hệ";
        setValue("editContactId", "");
        setValue("contactBuyingRole", "INFLUENCER");
        const isPrimaryCb = document.getElementById("contactIsPrimary");
        if (isPrimaryCb) isPrimaryCb.checked = (customerContacts.length === 0);
        if (transferSec) transferSec.style.display = "none";
        if (historyBox) historyBox.style.display = "none";
    }

    contactModal.classList.add("open");
    contactModalOverlay?.classList.add("open");
}

function closeContactModal() {
    contactModal?.classList.remove("open");
    contactModalOverlay?.classList.remove("open");
}

async function loadCustomersDropdown(selectedId) {
    const select = document.getElementById("contactCustomerSelect");
    if (!select) return;

    if (allCustomersCache.length === 0) {
        try {
            const res = await api("/api/customers?size=100");
            allCustomersCache = Array.isArray(res?.items) ? res.items : [];
        } catch (e) {
            console.warn("Could not load customer list for transfer:", e);
        }
    }

    select.innerHTML = "";
    allCustomersCache.forEach(cust => {
        const opt = document.createElement("option");
        opt.value = cust.id;
        opt.textContent = cust.name;
        if (Number(cust.id) === Number(selectedId)) {
            opt.selected = true;
        }
        select.appendChild(opt);
    });
}

contactForm?.addEventListener("submit", async event => {
    event.preventDefault();

    const editId = value("editContactId");
    const name = value("contactName");
    const title = value("contactTitle");
    const phone = value("contactPhone");
    const email = value("contactEmail");
    const buyingRole = value("contactBuyingRole");
    const isPrimary = document.getElementById("contactIsPrimary")?.checked || false;
    const notes = value("contactNotes");

    let targetCustomerId = Number(customerId);
    const selectCustomer = document.getElementById("contactCustomerSelect");
    if (editId && selectCustomer && selectCustomer.value) {
        targetCustomerId = Number(selectCustomer.value);
    }
    const transferReason = value("contactTransferReason");

    if (!name) {
        alert("Vui lòng nhập họ và tên người liên hệ.");
        return;
    }

    const payload = {
        customerId: targetCustomerId,
        name,
        title,
        phone,
        email,
        buyingRole,
        isPrimary,
        notes,
        transferReason
    };

    try {
        if (editId) {
            await api(`/api/contacts/${editId}`, {
                method: "PUT",
                body: JSON.stringify(payload)
            });

            if (targetCustomerId !== Number(customerId)) {
                alert("Đã chuyển người liên hệ sang công ty mới và lưu giữ lịch sử công tác thành công!");
            }
        } else {
            await api("/api/contacts", {
                method: "POST",
                body: JSON.stringify(payload)
            });
        }

        closeContactModal();
        await loadContacts();
    } catch (err) {
        alert("Lỗi khi lưu người liên hệ: " + err.message);
    }
});

document.getElementById("contactsList")?.addEventListener("click", async event => {
    const editBtn = event.target.closest("[data-edit-contact]");
    if (editBtn) {
        const id = editBtn.dataset.editContact;
        await openContactModal(id);
        return;
    }

    const deleteBtn = event.target.closest("[data-delete-contact]");
    if (deleteBtn) {
        const id = deleteBtn.dataset.deleteContact;
        const contact = customerContacts.find(x => Number(x.id) === Number(id));
        const ok = window.confirm(`Bạn có chắc chắn muốn xóa người liên hệ "${contact?.name || ""}"?`);
        if (!ok) return;

        try {
            await api(`/api/contacts/${id}`, { method: "DELETE" });
            await loadContacts();
        } catch (err) {
            alert("Lỗi khi xóa người liên hệ: " + err.message);
        }
    }
});

document.getElementById("addContact")?.addEventListener("click", () => openContactModal());
document.getElementById("closeContactModal")?.addEventListener("click", closeContactModal);
document.getElementById("cancelContactEdit")?.addEventListener("click", closeContactModal);
contactModalOverlay?.addEventListener("click", closeContactModal);

/* =========================================================
   OPPORTUNITIES MANAGEMENT (OPEN & CLOSED)
========================================================= */
function renderOpportunities() {
    const listEl = document.getElementById("opportunitiesList");
    const emptyEl = document.getElementById("opportunitiesEmpty");
    if (!listEl) return;

    listEl.innerHTML = "";
    let items = [];
    if (currentOppFilter === "open") {
        items = customerOpportunities.open;
    } else if (currentOppFilter === "closed") {
        items = customerOpportunities.closed;
    } else {
        items = customerOpportunities.all;
    }

    // Cập nhật số đếm trên nút lọc
    const cAll = document.getElementById("countOppAll");
    const cOpen = document.getElementById("countOppOpen");
    const cClosed = document.getElementById("countOppClosed");
    if (cAll) cAll.textContent = customerOpportunities.all.length;
    if (cOpen) cOpen.textContent = customerOpportunities.open.length;
    if (cClosed) cClosed.textContent = customerOpportunities.closed.length;

    if (!items || items.length === 0) {
        if (emptyEl) emptyEl.style.display = "block";
        return;
    }

    if (emptyEl) emptyEl.style.display = "none";

    items.forEach(opp => {
        const card = document.createElement("div");
        const category = (opp.stageCategory || "").toUpperCase();
        let statusCls = "opp-open";
        let badgeCls = "stage-open";
        if (category === "WON") {
            statusCls = "opp-won";
            badgeCls = "stage-won";
        } else if (category === "LOST") {
            statusCls = "opp-lost";
            badgeCls = "stage-lost";
        }

        card.className = `opp-card ${statusCls}`;
        card.innerHTML = `
            <div class="opp-card-head">
                <span class="opp-title">${escapeHtml(opp.name)}</span>
                <span class="opp-amount">${formatMoney(opp.amount || 0)}</span>
            </div>
            <div class="opp-meta">
                <span class="opp-stage-badge ${badgeCls}">${escapeHtml(opp.stageName || "Giai đoạn")}</span>
                <span>· Xác suất: <strong>${opp.probability || 0}%</strong></span>
                ${opp.expectedCloseDate ? `<span>· Dự kiến chốt: ${opp.expectedCloseDate}</span>` : ""}
                ${opp.actualCloseDate ? `<span>· Đã đóng: ${opp.actualCloseDate}</span>` : ""}
            </div>
            ${opp.lostReason ? `
                <div class="opp-lost-reason">
                    <strong>Lý do thất bại:</strong> ${escapeHtml(opp.lostReason)}
                </div>
            ` : ""}
        `;
        listEl.appendChild(card);
    });
}

document.querySelectorAll("[data-opp-filter]").forEach(btn => {
    btn.addEventListener("click", () => {
        document.querySelectorAll("[data-opp-filter]").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        currentOppFilter = btn.dataset.oppFilter;
        renderOpportunities();
    });
});

/* =========================================================
   ATTACHMENTS MANAGEMENT
========================================================= */
function renderAttachments() {
    const listEl = document.getElementById("attachmentsList");
    const emptyEl = document.getElementById("attachmentsEmpty");
    if (!listEl) return;

    listEl.innerHTML = "";
    if (!customerAttachments || customerAttachments.length === 0) {
        if (emptyEl) emptyEl.style.display = "block";
        return;
    }

    if (emptyEl) emptyEl.style.display = "none";

    customerAttachments.forEach(att => {
        const card = document.createElement("div");
        card.className = "attachment-card";

        const type = (att.fileType || "file").toLowerCase();
        let iconClass = "file";
        let iconText = "FILE";
        if (type.includes("pdf")) { iconClass = "pdf"; iconText = "PDF"; }
        else if (type.includes("xls") || type.includes("csv")) { iconClass = "xlsx"; iconText = "XLS"; }
        else if (type.includes("doc")) { iconClass = "docx"; iconText = "DOC"; }
        else if (type.includes("png") || type.includes("jpg") || type.includes("image")) { iconClass = "png"; iconText = "IMG"; }

        card.innerHTML = `
            <div class="attachment-info">
                <div class="file-icon ${iconClass}">${iconText}</div>
                <div style="min-width:0;">
                    <div class="file-name" title="${escapeHtml(att.fileName)}">${escapeHtml(att.fileName)}</div>
                    <div class="file-meta">
                        ${att.fileSize ? `<span>${escapeHtml(att.fileSize)}</span> · ` : ""}
                        ${att.createdAt ? `<span>${escapeHtml(att.createdAt)}</span>` : ""}
                        ${att.uploadedByName ? ` · <span>Bởi: ${escapeHtml(att.uploadedByName)}</span>` : ""}
                    </div>
                </div>
            </div>
            <div style="display:flex; align-items:center; gap:6px;">
                ${att.filePath ? `
                    <a href="${API_BASE}${escapeHtml(att.filePath)}" target="_blank" class="contact-action-btn" style="text-decoration:none;">
                        Tải
                    </a>
                ` : ""}
                <button type="button" class="contact-action-btn btn-delete" data-delete-attachment="${att.id}">
                    🗑
                </button>
            </div>
        `;
        listEl.appendChild(card);
    });
}

function openAttachmentModal() {
    attachmentForm?.reset();
    attachmentModal?.classList.add("open");
    attachmentModalOverlay?.classList.add("open");
}

function closeAttachmentModal() {
    attachmentModal?.classList.remove("open");
    attachmentModalOverlay?.classList.remove("open");
}

document.getElementById("addAttachmentBtn")?.addEventListener("click", openAttachmentModal);
document.getElementById("closeAttachmentModal")?.addEventListener("click", closeAttachmentModal);
document.getElementById("cancelAttachment")?.addEventListener("click", closeAttachmentModal);
attachmentModalOverlay?.addEventListener("click", closeAttachmentModal);

attachmentForm?.addEventListener("submit", async event => {
    event.preventDefault();
    const fileName = value("attFileName");
    const filePath = value("attFilePath");
    const fileType = value("attFileType");
    const fileSize = value("attFileSize") || "1.2 MB";

    if (!fileName) {
        alert("Vui lòng nhập tên tệp đính kèm.");
        return;
    }

    try {
        const created = await api("/api/attachments", {
            method: "POST",
            body: JSON.stringify({
                customerId: Number(customerId),
                fileName,
                filePath: filePath || `/uploads/${fileName}`,
                fileType,
                fileSize
            })
        });

        customerAttachments.unshift(created);
        const tabAtt = document.getElementById("tabCountAttachments");
        if (tabAtt) tabAtt.textContent = customerAttachments.length;
        renderAttachments();
        closeAttachmentModal();
    } catch (err) {
        alert("Lỗi khi thêm tệp đính kèm: " + err.message);
    }
});

document.getElementById("attachmentsList")?.addEventListener("click", async event => {
    const delBtn = event.target.closest("[data-delete-attachment]");
    if (delBtn) {
        const attId = delBtn.dataset.deleteAttachment;
        if (!confirm("Bạn có chắc chắn muốn xóa tệp đính kèm này?")) return;
        try {
            await api(`/api/attachments/${attId}`, { method: "DELETE" });
            customerAttachments = customerAttachments.filter(x => Number(x.id) !== Number(attId));
            const tabAtt = document.getElementById("tabCountAttachments");
            if (tabAtt) tabAtt.textContent = customerAttachments.length;
            renderAttachments();
        } catch (err) {
            alert("Lỗi khi xóa tệp: " + err.message);
        }
    }
});

/* =========================================================
   RIGHT COLUMN TABS (CONTACTS, OPPORTUNITIES, ATTACHMENTS)
========================================================= */
document.querySelectorAll(".right-tab").forEach(tab => {
    tab.addEventListener("click", () => {
        document.querySelectorAll(".right-tab").forEach(item => item.classList.remove("active"));
        tab.classList.add("active");

        const target = tab.dataset.tab;
        const cPanel = document.getElementById("contactsPanel");
        const oPanel = document.getElementById("opportunitiesPanel");
        const aPanel = document.getElementById("attachmentsPanel");
        const tPanel = document.getElementById("ticketsPanel");

        if (cPanel) cPanel.hidden = target !== "contacts";
        if (oPanel) oPanel.hidden = target !== "opportunities";
        if (aPanel) aPanel.hidden = target !== "attachments";
        if (tPanel) tPanel.hidden = target !== "tickets";
    });
});

/* =========================================================
   TIMELINE & ACTIVITY FILTERING
========================================================= */
function updateTimelineCounters() {
    const cAll = document.getElementById("countActAll");
    const cCall = document.getElementById("countActCall");
    const cEmail = document.getElementById("countActEmail");
    const cMeeting = document.getElementById("countActMeeting");
    const cNote = document.getElementById("countActNote");
    const badge = document.getElementById("timelineCounterBadge");

    const total = timeline.length;
    const calls = timeline.filter(a => a.type === "call").length;
    const emails = timeline.filter(a => a.type === "email").length;
    const meetings = timeline.filter(a => a.type === "meeting").length;
    const notes = timeline.filter(a => a.type === "note").length;

    if (cAll) cAll.textContent = total;
    if (cCall) cCall.textContent = calls;
    if (cEmail) cEmail.textContent = emails;
    if (cMeeting) cMeeting.textContent = meetings;
    if (cNote) cNote.textContent = notes;
    if (badge) badge.textContent = `${total} hoạt động`;
}

function renderTimeline() {
    timelineList.querySelectorAll(".timeline-item").forEach(item => item.remove());

    const filtered = currentActFilter === "all"
        ? timeline
        : timeline.filter(a => a.type === currentActFilter);

    timelineEmpty.style.display = filtered.length ? "none" : "block";

    for (const item of filtered) {
        const article = document.createElement("article");
        article.className = "timeline-item";
        article.innerHTML = `
            <div class="timeline-item-head">
                <span class="timeline-type">${typeLabel(item.type)}</span>
                <time class="timeline-time">
                    ${item.time.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })} - ${item.time.toLocaleDateString("vi-VN")}
                </time>
            </div>
            <div class="timeline-text">${escapeHtml(item.text)}</div>
            ${item.user ? `<div style="font-size:11px;color:#94a3b8;margin-top:3px;">Người thực hiện: ${escapeHtml(item.user)}</div>` : ""}
        `;
        timelineList.appendChild(article);
    }
}

document.querySelectorAll("[data-act-filter]").forEach(btn => {
    btn.addEventListener("click", () => {
        document.querySelectorAll("[data-act-filter]").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        currentActFilter = btn.dataset.actFilter;
        renderTimeline();
    });
});

composer?.addEventListener("submit", async event => {
    event.preventDefault();
    const text = noteInput.value.trim();
    if (!text) {
        noteInput.focus();
        return;
    }

    const type = typeInput.value;
    try {
        if (customerId) {
            await api("/api/activities", {
                method: "POST",
                body: JSON.stringify({
                    subject: text.slice(0, 50),
                    type: type.toUpperCase(),
                    description: text,
                    customerId: Number(customerId),
                    status: "COMPLETED"
                })
            });
        }
    } catch (err) {
        console.warn("Could not save activity to backend:", err);
    }

    timeline.unshift({
        type: type,
        text,
        time: new Date(),
        user: "Tôi"
    });

    noteInput.value = "";
    updateTimelineCounters();
    renderTimeline();
});

document.querySelectorAll("[data-quick]").forEach(button => {
    button.addEventListener("click", () => {
        const type = button.dataset.quick;
        typeInput.value = type === "call" ? "call" : type === "email" ? "email" : "note";
        noteInput.focus();
    });
});

/* =========================================================
   COMPANY MODAL EDIT
========================================================= */
document.getElementById("editCompanyButton")?.addEventListener("click", openCompanyModal);
document.getElementById("closeCompanyModal")?.addEventListener("click", closeCompanyModal);
document.getElementById("cancelCompanyEdit")?.addEventListener("click", closeCompanyModal);
modalOverlay?.addEventListener("click", closeCompanyModal);

document.getElementById("company360Form")?.addEventListener("submit", async event => {
    event.preventDefault();

    const name = value("edit360Name");
    const tax = value("edit360Tax");
    const ind = value("edit360Industry");
    const ph = value("edit360Phone");
    const web = value("edit360Website");

    if (customerId) {
        try {
            await api(`/api/customers/${customerId}`, {
                method: "PUT",
                body: JSON.stringify({
                    name,
                    taxCode: tax,
                    industry: ind,
                    phone: ph,
                    website: web,
                    email: currentCustomer?.email || "",
                    address: currentCustomer?.address || "",
                    type: currentCustomer?.type || "ENTERPRISE",
                    status: currentCustomer?.status || "ACTIVE"
                })
            });
        } catch (err) {
            alert("Lỗi khi cập nhật thông tin công ty: " + err.message);
            return;
        }
    }

    writeDisplay("company360Name", name);
    writeDisplay("company360Tax", tax);
    writeDisplay("company360Industry", ind);
    writeDisplay("company360Phone", ph);
    writeDisplay("company360Website", web);

    closeCompanyModal();
});

document.addEventListener("keydown", event => {
    if (event.key === "Escape") {
        closeCompanyModal();
        closeContactModal();
        closeAttachmentModal();
    }
});

function openCompanyModal() {
    setValue("edit360Name", displayValue("company360Name"));
    setValue("edit360Tax", displayValue("company360Tax"));
    setValue("edit360Industry", displayValue("company360Industry"));
    setValue("edit360Phone", displayValue("company360Phone"));
    setValue("edit360Website", displayValue("company360Website"));

    modal.classList.add("open");
    modalOverlay.classList.add("open");
}

function closeCompanyModal() {
    modal.classList.remove("open");
    modalOverlay.classList.remove("open");
}

function typeLabel(type) {
    switch (type) {
        case "call": return "☎ Cuộc gọi";
        case "email": return "✉ Email";
        case "meeting": return "▣ Cuộc gặp";
        default: return "✎ Ghi chú";
    }
}

function value(id) {
    return (document.getElementById(id)?.value || "").trim();
}

function displayValue(id) {
    const val = (document.getElementById(id)?.textContent || "").trim();
    return val === "—" ? "" : val;
}

function setValue(id, val) {
    const el = document.getElementById(id);
    if (el) el.value = val || "";
}

function writeDisplay(id, val) {
    const el = document.getElementById(id);
    if (el) el.textContent = val || "—";
}

function escapeHtml(val) {
    return String(val ?? "")
        .replace(/&/g,"&amp;")
        .replace(/</g,"&lt;")
        .replace(/>/g,"&gt;")
        .replace(/"/g,"&quot;")
        .replace(/'/g,"&#039;");
}

function formatMoney(val) {
    return new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
        maximumFractionDigits: 0
    }).format(Number(val) || 0);
}

// Khởi chạy nạp dữ liệu 360
initCustomer360();