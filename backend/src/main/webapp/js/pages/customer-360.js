"use strict";

const API_BASE = "http://localhost:8080/crm";

const timeline = [];
let currentCustomer = null;
let customerContacts = [];
let allCustomersCache = [];

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

const params = new URLSearchParams(window.location.search);
const customerId = params.get("id");

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
   INITIALIZATION
========================================================= */
async function initCustomer360() {
    if (!customerId) return;

    try {
        const data = await api(`/api/customers/${customerId}`);
        if (data) {
            currentCustomer = data;
            writeDisplay("company360Name", data.name);
            writeDisplay("company360Tax", data.taxCode);
            writeDisplay("company360Industry", data.industry);
            writeDisplay("company360Phone", data.phone);
            writeDisplay("company360Website", data.website);
        }
    } catch (err) {
        console.warn("Could not load customer info:", err);
    }

    // Load contacts
    await loadContacts();

    // Load activities for timeline
    try {
        const acts = await api(`/api/activities?customerId=${customerId}`);
        if (Array.isArray(acts)) {
            acts.forEach(a => {
                timeline.push({
                    type: (a.type || "note").toLowerCase(),
                    text: a.description || a.subject || "",
                    time: a.createdAt ? new Date(a.createdAt) : new Date()
                });
            });
            renderTimeline();
        }
    } catch (err) {
        console.warn("Could not load activities:", err);
    }

    // Load opportunities
    try {
        const opps = await api(`/api/opportunities?customerId=${customerId}`);
        const panel = document.getElementById("opportunitiesPanel");
        if (panel && Array.isArray(opps)) {
            panel.innerHTML = opps.length ? "" : '<p style="color:#64748b;padding:12px;">Chưa có cơ hội bán hàng nào.</p>';
            opps.forEach(o => {
                const item = document.createElement("div");
                item.style.padding = "10px";
                item.style.borderBottom = "1px solid var(--crm-border)";
                item.innerHTML = `
                    <strong>${escapeHtml(o.name)}</strong>
                    <div style="font-size:12px;color:#64748b;margin-top:4px;">
                        ${formatMoney(o.amount || 0)} · ${escapeHtml(o.stageName || "Giai đoạn")} · ${o.probability || 0}%
                    </div>
                `;
                panel.appendChild(item);
            });
        }
    } catch (err) {
        console.warn("Could not load opportunities:", err);
    }
}

/* =========================================================
   CONTACTS MANAGEMENT & BUYING ROLES
========================================================= */
async function loadContacts() {
    if (!customerId) return;
    try {
        const data = await api(`/api/contacts?customerId=${customerId}`);
        customerContacts = Array.isArray(data) ? data : [];
        renderContacts();
    } catch (err) {
        console.warn("Could not load contacts:", err);
        customerContacts = [];
        renderContacts();
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

            // Nạp danh sách khách hàng để hỗ trợ chuyển công ty
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

// Bắt sự kiện form liên hệ
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

// Event delegation cho Sửa / Xóa người liên hệ
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
   TABS & ACTIVITIES
========================================================= */
document.querySelectorAll(".right-tab").forEach(tab => {
    tab.addEventListener("click", () => {
        document.querySelectorAll(".right-tab").forEach(item => item.classList.remove("active"));
        tab.classList.add("active");

        const target = tab.dataset.tab;
        const cPanel = document.getElementById("contactsPanel");
        const oPanel = document.getElementById("opportunitiesPanel");
        if (cPanel) cPanel.hidden = target !== "contacts";
        if (oPanel) oPanel.hidden = target !== "opportunities";
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
        time: new Date()
    });

    noteInput.value = "";
    renderTimeline();
});

document.querySelectorAll("[data-quick]").forEach(button => {
    button.addEventListener("click", () => {
        const type = button.dataset.quick;
        typeInput.value = type === "call" ? "call" : type === "email" ? "email" : "note";
        noteInput.focus();
    });
});

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
    }
});

function renderTimeline() {
    timelineList.querySelectorAll(".timeline-item").forEach(item => item.remove());
    timelineEmpty.style.display = timeline.length ? "none" : "block";

    for (const item of timeline) {
        const article = document.createElement("article");
        article.className = "timeline-item";
        article.innerHTML = `
            <div class="timeline-item-head">
                <span class="timeline-type">${typeLabel(item.type)}</span>
                <time class="timeline-time">
                    ${item.time.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}
                </time>
            </div>
            <div class="timeline-text">${escapeHtml(item.text)}</div>
        `;
        timelineList.appendChild(article);
    }
}

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

// Start
initCustomer360();