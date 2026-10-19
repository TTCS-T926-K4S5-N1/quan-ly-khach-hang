/**
 * email-marketing.js
 * Quản lý Mẫu Email, Hàng đợi Gửi Thư Bất đồng bộ, Gửi lại Thư Thất bại
 */

let emailState = {
    templates: [],
    customers: [],
    queue: [],
    stats: { total: 0, sent: 0, failed: 0, queued: 0 },
    activeTab: "templatesTab",
    currentQueueFilter: "ALL"
};

document.addEventListener("DOMContentLoaded", () => {
    initTabs();
    initModals();
    initVariableChips();
    loadStats();
    loadTemplates();
    loadCustomers();
    loadQueue();

    // Auto-refresh queue every 15s to observe async queue progress
    setInterval(loadQueue, 15000);
});

/* =====================================================
   TABS SWITCHING
===================================================== */
function initTabs() {
    const tabs = document.querySelectorAll(".email-tab-btn");
    tabs.forEach(btn => {
        btn.addEventListener("click", () => {
            tabs.forEach(t => t.classList.remove("active"));
            document.querySelectorAll(".email-tab-content").forEach(c => c.classList.remove("active"));

            btn.classList.add("active");
            const targetId = btn.getAttribute("data-tab");
            const content = document.getElementById(targetId);
            if (content) content.classList.add("active");
            emailState.activeTab = targetId;

            if (targetId === "queueTab") {
                loadQueue();
            }
        });
    });

    // Queue status filter
    document.getElementById("filterQueueStatus")?.addEventListener("change", (e) => {
        emailState.currentQueueFilter = e.target.value;
        loadQueue();
    });

    document.getElementById("btnRefreshQueue")?.addEventListener("click", () => {
        loadQueue();
        loadStats();
    });
}

/* =====================================================
   STATS & KPI
===================================================== */
async function loadStats() {
    try {
        const res = await fetch("/crm/api/emails/stats", { credentials: "same-origin" });
        const json = await res.json();
        if (json.success && json.data) {
            emailState.stats = json.data;
            document.getElementById("statSentEmails").textContent = json.data.sent || 0;
            document.getElementById("statQueuedEmails").textContent = json.data.queued || 0;
            document.getElementById("statFailedEmails").textContent = json.data.failed || 0;
        }
    } catch (e) {
        console.error("Lỗi tải thống kê email:", e);
    }
}

/* =====================================================
   TEMPLATES MANAGEMENT
===================================================== */
async function loadTemplates() {
    const container = document.getElementById("templatesContainer");
    try {
        const res = await fetch("/crm/api/emails/templates", { credentials: "same-origin" });
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
            emailState.templates = json.data;
            document.getElementById("statTotalTemplates").textContent = json.data.length;
            document.getElementById("tabCountTemplates").textContent = json.data.length;
            renderTemplatesList(json.data);
            populateTemplateSelect(json.data);
        } else {
            container.innerHTML = `<div style="grid-column:1/-1; text-align:center; color:#ef4444; padding:30px;">Không thể tải danh sách mẫu email.</div>`;
        }
    } catch (e) {
        console.error("Lỗi tải mẫu email:", e);
        container.innerHTML = `<div style="grid-column:1/-1; text-align:center; color:#ef4444; padding:30px;">Lỗi kết nối khi tải mẫu email.</div>`;
    }
}

function renderTemplatesList(templates) {
    const container = document.getElementById("templatesContainer");
    if (!container) return;

    if (templates.length === 0) {
        container.innerHTML = `
            <div style="grid-column:1/-1; text-align:center; padding:60px 20px; background:var(--crm-surface); border-radius:12px; border:1px dashed var(--crm-border);">
                <div style="font-size:32px; margin-bottom:10px;">📑</div>
                <h3 style="margin:0 0 6px 0; color:var(--crm-text);">Chưa có mẫu email nào</h3>
                <p style="margin:0 0 16px 0; font-size:13px; color:var(--crm-muted);">Hãy bấm 'Tạo mẫu thư mới' để soạn các bức thư chăm sóc khách hàng chuẩn hóa.</p>
                <button type="button" class="crm-btn crm-btn-primary" onclick="openTemplateModal()">+ Tạo Mẫu Đầu Tiên</button>
            </div>
        `;
        return;
    }

    let html = "";
    templates.forEach(t => {
        let catClass = (t.category || "MARKETING").toLowerCase();
        let catLabel = t.category === "SALES" ? "Bán hàng" : t.category === "ONBOARDING" ? "Khách mới" : t.category === "NURTURING" ? "Nuôi dưỡng" : "Marketing";
        
        // Strip HTML tags for clean snippet
        let snippet = (t.bodyHtml || "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();

        html += `
            <div class="template-card" data-id="${t.id}">
                <div>
                    <div class="tpl-header">
                        <span class="tpl-category-badge ${catClass}">${catLabel}</span>
                        <span style="font-size:11.5px; color:var(--crm-muted);">${new Date(t.createdAt).toLocaleDateString('vi-VN')}</span>
                    </div>
                    <h3 class="tpl-title">${escapeHtml(t.name)}</h3>
                    <div class="tpl-subject" title="${escapeHtml(t.subject)}">
                        <span>📌</span> ${escapeHtml(t.subject)}
                    </div>
                    <div class="tpl-snippet">${escapeHtml(snippet)}</div>
                </div>
                <div class="tpl-footer">
                    <button type="button" class="crm-btn crm-btn-primary btn-use-template" data-id="${t.id}" style="font-size:12.5px; padding:6px 12px;">
                        ✉️ Sử dụng gửi
                    </button>
                    <div class="tpl-actions">
                        <button type="button" class="crm-btn crm-btn-secondary btn-edit-template" data-id="${t.id}" style="font-size:12px; padding:6px 10px;">Sửa</button>
                        <button type="button" class="crm-btn crm-btn-secondary btn-delete-template" data-id="${t.id}" style="font-size:12px; padding:6px 8px; color:#ef4444;">🗑️</button>
                    </div>
                </div>
            </div>
        `;
    });
    container.innerHTML = html;
}

function populateTemplateSelect(templates) {
    const sel = document.getElementById("sendTemplateSelect");
    if (!sel) return;
    let html = '<option value="">-- Tự soạn hoặc chọn mẫu sẵn --</option>';
    templates.forEach(t => {
        html += `<option value="${t.id}">${escapeHtml(t.name)}</option>`;
    });
    sel.innerHTML = html;
}

/* =====================================================
   CUSTOMERS DROPDOWN
===================================================== */
async function loadCustomers() {
    const sel = document.getElementById("sendCustomerSelect");
    if (!sel) return;

    try {
        const res = await fetch("/crm/api/customers?limit=100", { credentials: "same-origin" });
        const json = await res.json();
        const list = json.data?.items || json.data || [];
        if (Array.isArray(list)) {
            emailState.customers = list;
            let html = '<option value="">-- Chọn khách hàng nhận thư --</option>';
            list.forEach(c => {
                html += `<option value="${c.id}" data-email="${escapeHtml(c.email || '')}" data-name="${escapeHtml(c.name || '')}">${escapeHtml(c.name)} ${c.email ? `(${c.email})` : ''}</option>`;
            });
            sel.innerHTML = html;
        }
    } catch (e) {
        console.error("Lỗi tải danh sách khách hàng:", e);
    }
}

// When customer selection changes in Send modal
document.getElementById("sendCustomerSelect")?.addEventListener("change", (e) => {
    const custId = e.target.value;
    const opt = e.target.selectedOptions[0];
    if (custId && opt) {
        const email = opt.getAttribute("data-email");
        const name = opt.getAttribute("data-name");
        if (email) document.getElementById("sendRecipientEmail").value = email;
        if (name) document.getElementById("sendRecipientName").value = name;
    }
});

// When template selection changes in Send modal
document.getElementById("sendTemplateSelect")?.addEventListener("change", (e) => {
    const tplId = e.target.value;
    if (!tplId) return;
    const tpl = emailState.templates.find(t => String(t.id) === String(tplId));
    if (tpl) {
        document.getElementById("sendSubject").value = tpl.subject || "";
        document.getElementById("sendBodyHtml").value = tpl.bodyHtml || "";
    }
});

/* =====================================================
   EMAIL QUEUE & OUTBOX
===================================================== */
async function loadQueue() {
    const tbody = document.getElementById("queueTableBody");
    const status = emailState.currentQueueFilter;

    try {
        let url = `/crm/api/emails/queue?limit=50&status=${status}`;
        const res = await fetch(url, { credentials: "same-origin" });
        const json = await res.json();
        if (json.success && json.data) {
            emailState.queue = json.data.items || [];
            document.getElementById("tabCountQueue").textContent = json.data.total || 0;
            renderQueueTable(emailState.queue);
        }
    } catch (e) {
        console.error("Lỗi tải hàng đợi email:", e);
    }
}

function renderQueueTable(items) {
    const tbody = document.getElementById("queueTableBody");
    if (!tbody) return;

    if (items.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align:center; padding:40px; color:var(--crm-muted);">
                    Không có email nào trong hàng đợi với trạng thái này.
                </td>
            </tr>
        `;
        return;
    }

    let html = "";
    items.forEach(q => {
        let st = (q.status || "QUEUED").toUpperCase();
        let badgeClass = st === "SENT" ? "sent" : st === "FAILED" ? "failed" : "queued";
        let badgeIcon = st === "SENT" ? "✔" : st === "FAILED" ? "✖" : "⏳";
        let badgeText = st === "SENT" ? "ĐÃ GỬI" : st === "FAILED" ? "THẤT BẠI" : "ĐANG CHỜ";

        html += `
            <tr data-id="${q.id}">
                <td style="font-size:12px; color:var(--crm-muted);">
                    <div>${new Date(q.createdAt).toLocaleDateString('vi-VN')}</div>
                    <div style="font-size:11px; color:#94a3b8;">${new Date(q.createdAt).toLocaleTimeString('vi-VN', {hour:'2-digit', minute:'2-digit'})} (${escapeHtml(q.timeAgo || '')})</div>
                </td>
                <td>
                    <div style="font-weight:600; color:var(--crm-text);">${escapeHtml(q.recipientName || 'Khách hàng')}</div>
                    <div style="font-size:12px; color:var(--crm-muted);">${escapeHtml(q.recipientEmail)}</div>
                </td>
                <td>
                    ${q.customerId ? `<a href="customer-360?id=${q.customerId}" style="color:var(--crm-primary); text-decoration:none; font-weight:600; font-size:12.5px;">🏢 ${escapeHtml(q.customerName || 'Khách hàng #' + q.customerId)}</a>` : '<span style="color:#94a3b8;">—</span>'}
                </td>
                <td>
                    <div style="font-weight:600; font-size:13px; color:var(--crm-text);">${escapeHtml(q.subject)}</div>
                    ${q.errorMessage ? `<div style="font-size:11.5px; color:#b91c1c; margin-top:3px; background:#fee2e2; padding:2px 6px; border-radius:4px; display:inline-block;">⚠️ ${escapeHtml(q.errorMessage)}</div>` : ''}
                </td>
                <td style="text-align:center;">
                    <span class="status-badge ${badgeClass}">${badgeIcon} ${badgeText}</span>
                    ${q.attempts > 1 ? `<div style="font-size:10.5px; color:#94a3b8; margin-top:2px;">(Lần thử: ${q.attempts})</div>` : ''}
                </td>
                <td style="text-align:right;">
                    <div style="display:flex; justify-content:flex-end; gap:6px; align-items:center;">
                        ${st === "FAILED" ? `
                            <button type="button" class="retry-btn btn-retry-email" data-id="${q.id}" title="Gửi lại thư thất bại ngay">
                                🔄 Gửi lại
                            </button>
                        ` : ''}
                        <button type="button" class="crm-btn crm-btn-secondary btn-view-email" data-id="${q.id}" style="font-size:12px; padding:4px 8px;">
                            👁️ Xem
                        </button>
                    </div>
                </td>
            </tr>
        `;
    });
    tbody.innerHTML = html;
}

/* =====================================================
   VARIABLE CHIPS INSERTION
===================================================== */
function initVariableChips() {
    let lastActiveSendField = document.getElementById("sendBodyHtml");

    document.getElementById("sendSubject")?.addEventListener("focus", (e) => lastActiveSendField = e.target);
    document.getElementById("sendBodyHtml")?.addEventListener("focus", (e) => lastActiveSendField = e.target);

    document.querySelectorAll(".var-chip").forEach(chip => {
        chip.addEventListener("click", () => {
            const token = chip.getAttribute("data-var");
            if (!lastActiveSendField) lastActiveSendField = document.getElementById("sendBodyHtml");
            insertAtCursor(lastActiveSendField, token);
        });
    });

    let lastActiveTplField = document.getElementById("tplBodyHtml");
    document.getElementById("tplSubject")?.addEventListener("focus", (e) => lastActiveTplField = e.target);
    document.getElementById("tplBodyHtml")?.addEventListener("focus", (e) => lastActiveTplField = e.target);

    document.querySelectorAll(".var-chip-tpl").forEach(chip => {
        chip.addEventListener("click", () => {
            const token = chip.getAttribute("data-var");
            if (!lastActiveTplField) lastActiveTplField = document.getElementById("tplBodyHtml");
            insertAtCursor(lastActiveTplField, token);
        });
    });
}

function insertAtCursor(field, text) {
    if (!field) return;
    const start = field.selectionStart || 0;
    const end = field.selectionEnd || 0;
    const val = field.value || "";
    field.value = val.substring(0, start) + text + val.substring(end);
    field.focus();
    field.selectionStart = field.selectionEnd = start + text.length;
}

/* =====================================================
   MODALS & ACTIONS
===================================================== */
function initModals() {
    // Open Send Email Modal
    document.getElementById("btnOpenSendEmailModal")?.addEventListener("click", () => {
        openSendEmailModal();
    });

    // Open Template Modal
    document.getElementById("btnOpenNewTemplateModal")?.addEventListener("click", () => {
        openTemplateModal();
    });

    // Close modals
    document.querySelectorAll(".btn-close-modal").forEach(btn => {
        btn.addEventListener("click", () => {
            const modalId = btn.getAttribute("data-modal");
            if (modalId) {
                document.getElementById(modalId).style.display = "none";
            }
        });
    });

    // Live preview
    document.getElementById("btnPreviewSend")?.addEventListener("click", async () => {
        const custId = document.getElementById("sendCustomerSelect")?.value;
        const tplId = document.getElementById("sendTemplateSelect")?.value;

        try {
            const res = await fetch("/crm/api/emails/preview", {
                method: "POST",
                headers: { "Content-Type": "application/json; charset=utf-8" },
                body: JSON.stringify({
                    customerId: custId || 1,
                    templateId: tplId || null
                }),
                credentials: "same-origin"
            });
            const json = await res.json();
            if (json.success && json.data) {
                const box = document.getElementById("sendPreviewBox");
                document.getElementById("previewSubjectText").textContent = json.data.subject || "";
                document.getElementById("previewBodyContent").innerHTML = json.data.bodyHtml || "";
                box.style.display = "block";
            }
        } catch (e) {
            console.error("Lỗi tạo bản xem trước:", e);
        }
    });

    document.getElementById("btnClosePreview")?.addEventListener("click", () => {
        document.getElementById("sendPreviewBox").style.display = "none";
    });

    // Submit Send Email
    document.getElementById("formSendEmail")?.addEventListener("submit", async (e) => {
        e.preventDefault();
        const btnSubmit = document.getElementById("btnSubmitSendEmail");
        btnSubmit.disabled = true;
        btnSubmit.innerHTML = `<span>⏳</span> Đang lên hàng đợi...`;

        const payload = {
            customerId: document.getElementById("sendCustomerSelect").value || null,
            templateId: document.getElementById("sendTemplateSelect").value || null,
            recipientEmail: document.getElementById("sendRecipientEmail").value.trim(),
            recipientName: document.getElementById("sendRecipientName").value.trim(),
            subject: document.getElementById("sendSubject").value.trim(),
            bodyHtml: document.getElementById("sendBodyHtml").value.trim()
        };

        try {
            const res = await fetch("/crm/api/emails/send", {
                method: "POST",
                headers: { "Content-Type": "application/json; charset=utf-8" },
                body: JSON.stringify(payload),
                credentials: "same-origin"
            });
            const json = await res.json();
            if (json.success) {
                alert("Đã đưa thư vào hàng đợi gửi bất đồng bộ!\nThư sẽ được hệ thống truyền phát và ghi nhận tự động vào Dòng thời gian của khách hàng.");
                document.getElementById("modalSendEmail").style.display = "none";
                document.getElementById("formSendEmail").reset();
                document.getElementById("sendPreviewBox").style.display = "none";
                
                // Switch to Queue tab to see real-time status
                document.querySelector('[data-tab="queueTab"]')?.click();
                loadStats();
                loadQueue();
            } else {
                alert("Lỗi khi gửi email: " + (json.message || "Không xác định"));
            }
        } catch (err) {
            console.error("Lỗi khi gửi email:", err);
            alert("Lỗi kết nối khi gửi email.");
        } finally {
            btnSubmit.disabled = false;
            btnSubmit.innerHTML = `🚀 Gửi ngay (Bất đồng bộ)`;
        }
    });

    // Submit Template Create / Edit
    document.getElementById("formEmailTemplate")?.addEventListener("submit", async (e) => {
        e.preventDefault();
        const id = document.getElementById("tplId").value;
        const isEdit = id && id.length > 0;

        const payload = {
            name: document.getElementById("tplName").value.trim(),
            category: document.getElementById("tplCategory").value,
            subject: document.getElementById("tplSubject").value.trim(),
            bodyHtml: document.getElementById("tplBodyHtml").value.trim(),
            active: true
        };

        try {
            const url = isEdit ? `/crm/api/emails/templates/${id}` : "/crm/api/emails/templates";
            const method = isEdit ? "PUT" : "POST";

            const res = await fetch(url, {
                method: method,
                headers: { "Content-Type": "application/json; charset=utf-8" },
                body: JSON.stringify(payload),
                credentials: "same-origin"
            });
            const json = await res.json();
            if (json.success) {
                alert(isEdit ? "Cập nhật mẫu email thành công!" : "Tạo mẫu email mới thành công!");
                document.getElementById("modalEmailTemplate").style.display = "none";
                loadTemplates();
            } else {
                alert("Lỗi lưu mẫu email: " + (json.message || "Không xác định"));
            }
        } catch (err) {
            console.error("Lỗi khi lưu mẫu email:", err);
            alert("Lỗi kết nối khi lưu mẫu email.");
        }
    });

    // Delegate table clicks (Retry & View)
    document.getElementById("queueTableBody")?.addEventListener("click", async (e) => {
        const retryBtn = e.target.closest(".btn-retry-email");
        if (retryBtn) {
            const queueId = retryBtn.getAttribute("data-id");
            if (confirm(`Bạn có chắc chắn muốn gửi lại email #${queueId} ngay bây giờ?`)) {
                await retryEmail(queueId);
            }
            return;
        }

        const viewBtn = e.target.closest(".btn-view-email");
        if (viewBtn) {
            const queueId = viewBtn.getAttribute("data-id");
            openViewMailModal(queueId);
            return;
        }
    });

    // Delegate template card clicks (Use, Edit, Delete)
    document.getElementById("templatesContainer")?.addEventListener("click", async (e) => {
        const useBtn = e.target.closest(".btn-use-template");
        if (useBtn) {
            const tplId = useBtn.getAttribute("data-id");
            openSendEmailModal(tplId);
            return;
        }

        const editBtn = e.target.closest(".btn-edit-template");
        if (editBtn) {
            const tplId = editBtn.getAttribute("data-id");
            openTemplateModal(tplId);
            return;
        }

        const delBtn = e.target.closest(".btn-delete-template");
        if (delBtn) {
            const tplId = delBtn.getAttribute("data-id");
            if (confirm("Bạn có chắc chắn muốn xóa mẫu email này?")) {
                await deleteTemplate(tplId);
            }
            return;
        }
    });
}

function openSendEmailModal(preselectedTplId = null) {
    document.getElementById("formSendEmail").reset();
    document.getElementById("sendPreviewBox").style.display = "none";

    if (preselectedTplId) {
        document.getElementById("sendTemplateSelect").value = preselectedTplId;
        const tpl = emailState.templates.find(t => String(t.id) === String(preselectedTplId));
        if (tpl) {
            document.getElementById("sendSubject").value = tpl.subject || "";
            document.getElementById("sendBodyHtml").value = tpl.bodyHtml || "";
        }
    }

    document.getElementById("modalSendEmail").style.display = "flex";
}

function openTemplateModal(editTplId = null) {
    document.getElementById("formEmailTemplate").reset();
    document.getElementById("tplId").value = "";

    if (editTplId) {
        const tpl = emailState.templates.find(t => String(t.id) === String(editTplId));
        if (tpl) {
            document.getElementById("tplModalTitle").textContent = "Chỉnh sửa Mẫu Email";
            document.getElementById("tplId").value = tpl.id;
            document.getElementById("tplName").value = tpl.name || "";
            document.getElementById("tplCategory").value = tpl.category || "MARKETING";
            document.getElementById("tplSubject").value = tpl.subject || "";
            document.getElementById("tplBodyHtml").value = tpl.bodyHtml || "";
        }
    } else {
        document.getElementById("tplModalTitle").textContent = "Tạo Mẫu Email Mới";
    }

    document.getElementById("modalEmailTemplate").style.display = "flex";
}

async function deleteTemplate(tplId) {
    try {
        const res = await fetch(`/crm/api/emails/templates/${tplId}`, { method: "DELETE", credentials: "same-origin" });
        const json = await res.json();
        if (json.success) {
            alert("Đã xóa mẫu email thành công!");
            loadTemplates();
        } else {
            alert("Lỗi khi xóa: " + (json.message || ""));
        }
    } catch (e) {
        console.error("Lỗi khi xóa mẫu email:", e);
    }
}

async function retryEmail(queueId) {
    try {
        const res = await fetch(`/crm/api/emails/queue/${queueId}/retry`, { method: "POST", credentials: "same-origin" });
        const json = await res.json();
        if (json.success) {
            alert(`Đã đưa email #${queueId} vào hàng đợi để gửi lại thành công!`);
            loadStats();
            loadQueue();
        } else {
            alert("Không thể gửi lại email: " + (json.message || ""));
        }
    } catch (e) {
        console.error("Lỗi khi gửi lại email:", e);
        alert("Lỗi kết nối khi gửi lại email.");
    }
}

function openViewMailModal(queueId) {
    const item = emailState.queue.find(q => String(q.id) === String(queueId));
    if (!item) return;

    document.getElementById("viewMailSubject").textContent = item.subject || "Thư gửi khách";
    document.getElementById("viewMailMeta").textContent = `Người nhận: ${item.recipientName || 'Khách'} (${item.recipientEmail}) · Người gửi: ${item.sentByName || 'Hệ thống'} · Thời gian: ${new Date(item.createdAt).toLocaleString('vi-VN')}`;
    document.getElementById("viewMailContent").innerHTML = item.bodyHtml || "<p>Không có nội dung</p>";

    const errBox = document.getElementById("viewMailErrorAlert");
    if (item.status === "FAILED" && item.errorMessage) {
        errBox.textContent = "Lý do thất bại: " + item.errorMessage;
        errBox.style.display = "block";
    } else {
        errBox.style.display = "none";
    }

    const retryBox = document.getElementById("viewMailRetryBtnBox");
    if (item.status === "FAILED") {
        retryBox.innerHTML = `
            <button type="button" class="retry-btn" onclick="retryEmail(${item.id}); document.getElementById('modalViewEmail').style.display='none';">
                🔄 Gửi lại thư này ngay
            </button>
        `;
    } else {
        retryBox.innerHTML = "";
    }

    document.getElementById("modalViewEmail").style.display = "flex";
}

function escapeHtml(str) {
    if (!str) return "";
    return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}
