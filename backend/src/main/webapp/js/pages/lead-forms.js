/**
 * LEAD FORMS JS - QUẢN LÝ BIỂU MẪU THU THẬP LEAD (WEB-TO-LEAD)
 */
"use strict";

(function () {
    const API_BASE = window.location.origin + (window.location.pathname.startsWith("/crm") ? "/crm" : "");

    let allForms = [];
    let allSubmissions = [];
    let currentSelectedForm = null;
    let currentEmbedMode = "script"; // 'script' | 'iframe' | 'html'

    // DOM Elements
    const formsGrid = document.getElementById("formsGrid");
    const submissionsTableBody = document.getElementById("submissionsTableBody");
    const statTotalForms = document.getElementById("statTotalForms");
    const statActiveForms = document.getElementById("statActiveForms");
    const statTotalLeads = document.getElementById("statTotalLeads");
    const statLeadSources = document.getElementById("statLeadSources");
    const badgeFormCount = document.getElementById("badgeFormCount");
    const badgeSubCount = document.getElementById("badgeSubCount");

    const tabFormsView = document.getElementById("tabFormsView");
    const tabSubmissionsView = document.getElementById("tabSubmissionsView");
    const tabButtons = document.querySelectorAll(".lead-tab-btn");

    const inputSearchForms = document.getElementById("inputSearchForms");
    const selectStatusFilter = document.getElementById("selectStatusFilter");
    const btnNewForm = document.getElementById("btnNewForm");
    const btnRefresh = document.getElementById("btnRefresh");

    // Modal Form Editor
    const modalFormBackdrop = document.getElementById("modalFormBackdrop");
    const modalFormTitle = document.getElementById("modalFormTitle");
    const btnCloseModalForm = document.getElementById("btnCloseModalForm");
    const btnCancelEdit = document.getElementById("btnCancelEdit");
    const leadFormEditor = document.getElementById("leadFormEditor");
    const editFormId = document.getElementById("editFormId");
    const formNameInput = document.getElementById("formNameInput");
    const formTitleInput = document.getElementById("formTitleInput");
    const formLeadSourceInput = document.getElementById("formLeadSourceInput");
    const formDescInput = document.getElementById("formDescInput");
    const formBtnTextInput = document.getElementById("formBtnTextInput");
    const formRedirectUrlInput = document.getElementById("formRedirectUrlInput");
    const formSuccessMsgInput = document.getElementById("formSuccessMsgInput");
    const formIsActiveInput = document.getElementById("formIsActiveInput");

    // Modal Embed Code
    const modalEmbedBackdrop = document.getElementById("modalEmbedBackdrop");
    const btnCloseModalEmbed = document.getElementById("btnCloseModalEmbed");
    const embedFormNameHeader = document.getElementById("embedFormNameHeader");
    const embedCodeDisplay = document.getElementById("embedCodeDisplay");
    const btnCopyEmbedCode = document.getElementById("btnCopyEmbedCode");
    const btnOpenDemoTest = document.getElementById("btnOpenDemoTest");
    const embedPreviewIframe = document.getElementById("embedPreviewIframe");
    const btnTogglePreview = document.getElementById("btnTogglePreview");
    const livePreviewContainer = document.getElementById("livePreviewContainer");
    const embedModeBtns = document.querySelectorAll(".embed-mode-btn");

    /* =====================================================
       INITIALIZATION
    ===================================================== */
    async function init() {
        bindEvents();
        await loadData();
    }

    function bindEvents() {
        // Tab switching
        tabButtons.forEach(btn => {
            btn.addEventListener("click", () => {
                tabButtons.forEach(b => b.classList.remove("active"));
                btn.classList.add("active");
                const tab = btn.dataset.tab;
                if (tab === "forms") {
                    tabFormsView.style.display = "block";
                    tabSubmissionsView.style.display = "none";
                } else {
                    tabFormsView.style.display = "none";
                    tabSubmissionsView.style.display = "block";
                }
            });
        });

        // Search & Filter
        if (inputSearchForms) inputSearchForms.addEventListener("input", filterAndRenderForms);
        if (selectStatusFilter) selectStatusFilter.addEventListener("change", filterAndRenderForms);

        // Buttons
        if (btnRefresh) btnRefresh.addEventListener("click", loadData);
        if (btnNewForm) btnNewForm.addEventListener("click", openCreateModal);

        // Modal Form Editor close
        if (btnCloseModalForm) btnCloseModalForm.addEventListener("click", closeFormModal);
        if (btnCancelEdit) btnCancelEdit.addEventListener("click", closeFormModal);
        if (modalFormBackdrop) {
            modalFormBackdrop.addEventListener("click", (e) => {
                if (e.target === modalFormBackdrop) closeFormModal();
            });
        }

        // Form Submit (Create / Update)
        if (leadFormEditor) leadFormEditor.addEventListener("submit", handleSaveForm);

        // Modal Embed close
        if (btnCloseModalEmbed) btnCloseModalEmbed.addEventListener("click", closeEmbedModal);
        if (modalEmbedBackdrop) {
            modalEmbedBackdrop.addEventListener("click", (e) => {
                if (e.target === modalEmbedBackdrop) closeEmbedModal();
            });
        }

        // Embed mode buttons
        embedModeBtns.forEach(btn => {
            btn.addEventListener("click", () => {
                embedModeBtns.forEach(b => {
                    b.classList.remove("crm-btn-primary");
                    b.classList.add("crm-btn-secondary");
                });
                btn.classList.remove("crm-btn-secondary");
                btn.classList.add("crm-btn-primary");
                currentEmbedMode = btn.dataset.mode;
                updateEmbedCodeBox();
            });
        });

        // Copy button
        if (btnCopyEmbedCode) {
            btnCopyEmbedCode.addEventListener("click", () => {
                const text = embedCodeDisplay.textContent;
                navigator.clipboard.writeText(text).then(() => {
                    const original = btnCopyEmbedCode.innerHTML;
                    btnCopyEmbedCode.innerHTML = "✓ Đã sao chép!";
                    btnCopyEmbedCode.style.background = "#059669";
                    setTimeout(() => {
                        btnCopyEmbedCode.innerHTML = original;
                        btnCopyEmbedCode.style.background = "";
                    }, 2000);
                    showToast("Đã sao chép mã nhúng vào bộ nhớ tạm!", "success");
                }).catch(() => {
                    showToast("Không thể tự động sao chép. Vui lòng chọn và Ctrl+C.", "warning");
                });
            });
        }

        // Toggle Live Preview
        if (btnTogglePreview) {
            btnTogglePreview.addEventListener("click", () => {
                if (livePreviewContainer.style.display === "none") {
                    livePreviewContainer.style.display = "block";
                    btnTogglePreview.textContent = "👁️ Thu nhỏ Xem trước";
                } else {
                    livePreviewContainer.style.display = "none";
                    btnTogglePreview.textContent = "👁️ Hiện Xem trước";
                }
            });
        }
    }

    /* =====================================================
       DATA LOADING
    ===================================================== */
    async function loadData() {
        try {
            const [formsRes, subsRes] = await Promise.all([
                fetch(`${API_BASE}/api/lead-forms`, { credentials: "include" }),
                fetch(`${API_BASE}/api/lead-forms/submissions`, { credentials: "include" })
            ]);

            const formsJson = await formsRes.json();
            const subsJson = await subsRes.json();

            if (formsJson.success && Array.isArray(formsJson.data)) {
                allForms = formsJson.data;
            } else {
                allForms = [];
            }

            if (subsJson.success && Array.isArray(subsJson.data)) {
                allSubmissions = subsJson.data;
            } else {
                allSubmissions = [];
            }

            updateStats();
            filterAndRenderForms();
            renderSubmissions();
        } catch (err) {
            console.error("Lỗi tải dữ liệu biểu mẫu lead:", err);
            showToast("Lỗi tải dữ liệu từ máy chủ: " + err.message, "error");
        }
    }

    /* =====================================================
       STATS UPDATE
    ===================================================== */
    function updateStats() {
        const total = allForms.length;
        const active = allForms.filter(f => f.isActive).length;
        const totalLeads = allForms.reduce((sum, f) => sum + (f.submissionsCount || 0), 0);

        const sources = new Set(allForms.map(f => f.leadSourceName).filter(Boolean));
        const sourceText = sources.size > 0 ? Array.from(sources).slice(0, 2).join(", ") : "Website";

        if (statTotalForms) statTotalForms.textContent = total;
        if (statActiveForms) statActiveForms.textContent = active;
        if (statTotalLeads) statTotalLeads.textContent = totalLeads;
        if (statLeadSources) statLeadSources.textContent = sourceText;

        if (badgeFormCount) badgeFormCount.textContent = total;
        if (badgeSubCount) badgeSubCount.textContent = allSubmissions.length;
    }

    /* =====================================================
       FORMS RENDERING
    ===================================================== */
    function filterAndRenderForms() {
        const query = (inputSearchForms ? inputSearchForms.value : "").trim().toLowerCase();
        const status = selectStatusFilter ? selectStatusFilter.value : "ALL";

        let filtered = allForms.filter(form => {
            const matchQuery = !query ||
                (form.name && form.name.toLowerCase().includes(query)) ||
                (form.formKey && form.formKey.toLowerCase().includes(query)) ||
                (form.leadSourceName && form.leadSourceName.toLowerCase().includes(query));

            let matchStatus = true;
            if (status === "ACTIVE") matchStatus = form.isActive;
            if (status === "INACTIVE") matchStatus = !form.isActive;

            return matchQuery && matchStatus;
        });

        if (filtered.length === 0) {
            formsGrid.innerHTML = `
                <div style="grid-column: 1 / -1; background: var(--crm-surface); border: 2px dashed var(--crm-border); border-radius: 14px; padding: 48px 24px; text-align: center; color: var(--crm-text-muted);">
                    <div style="font-size: 40px; margin-bottom: 12px;">📑</div>
                    <h3 style="margin: 0 0 6px 0; font-size: 17px; color: var(--crm-text);">Chưa có biểu mẫu nào phù hợp</h3>
                    <p style="margin: 0 0 16px 0; font-size: 13.5px;">Bắt đầu tạo biểu mẫu để dán vào landing page hoặc website thu thập khách hàng tiềm năng.</p>
                    <button type="button" class="crm-btn crm-btn-primary" onclick="document.getElementById('btnNewForm').click()">
                        ➕ Tạo biểu mẫu đầu tiên
                    </button>
                </div>
            `;
            return;
        }

        formsGrid.innerHTML = filtered.map(form => {
            const isActive = form.isActive;
            const statusBadge = isActive
                ? `<span class="lead-badge-status lead-badge-active">● Đang nhận lead</span>`
                : `<span class="lead-badge-status lead-badge-inactive">○ Đã tạm dừng</span>`;

            return `
                <div class="lead-form-card" data-id="${form.id}">
                    <div>
                        <div class="lead-form-card-top">
                            <div>
                                <span class="lead-form-key-badge">${escapeHtml(form.formKey)}</span>
                                <h3 class="lead-form-name">${escapeHtml(form.name)}</h3>
                            </div>
                            ${statusBadge}
                        </div>

                        <div class="lead-form-desc">
                            ${escapeHtml(form.description || form.title || "(Chưa có mô tả)")}
                        </div>

                        <div class="lead-form-meta">
                            <div class="lead-form-meta-row">
                                <span class="lead-form-meta-label">Nguồn Lead:</span>
                                <span class="lead-form-meta-value" style="color:var(--crm-primary);">${escapeHtml(form.leadSourceName || "Website")}</span>
                            </div>
                            <div class="lead-form-meta-row">
                                <span class="lead-form-meta-label">Số lead thu thập:</span>
                                <span class="lead-form-meta-value" style="font-size:14px; color:#10b981;">
                                    ${form.submissionsCount || 0} lượt gửi
                                </span>
                            </div>
                            <div class="lead-form-meta-row">
                                <span class="lead-form-meta-label">Nút bấm:</span>
                                <span class="lead-form-meta-value">${escapeHtml(form.submitButtonText || "Gửi")}</span>
                            </div>
                        </div>
                    </div>

                    <div class="lead-form-actions-bar">
                        <button type="button" class="btn-embed-code btn-action-embed" data-id="${form.id}">
                            ⚡ Lấy mã nhúng
                        </button>
                        <a href="${API_BASE}/lead-form-embed.html?key=${encodeURIComponent(form.formKey)}" target="_blank" class="crm-btn crm-btn-secondary" style="font-size:12.5px; padding:6px 10px; text-decoration:none;">
                            👁️ Xem thử
                        </a>
                        <button type="button" class="crm-btn crm-btn-secondary btn-action-edit" data-id="${form.id}" style="font-size:12.5px; padding:6px 10px;">
                            ✏️ Sửa
                        </button>
                        <button type="button" class="crm-btn crm-btn-secondary btn-action-delete" data-id="${form.id}" style="font-size:12.5px; padding:6px 8px; color:#ef4444;" title="Xóa biểu mẫu">
                            🗑️
                        </button>
                    </div>
                </div>
            `;
        }).join("");

        // Attach event listeners to card buttons
        formsGrid.querySelectorAll(".btn-action-embed").forEach(btn => {
            btn.addEventListener("click", () => {
                const id = parseInt(btn.dataset.id, 10);
                const form = allForms.find(f => f.id === id);
                if (form) openEmbedModal(form);
            });
        });

        formsGrid.querySelectorAll(".btn-action-edit").forEach(btn => {
            btn.addEventListener("click", () => {
                const id = parseInt(btn.dataset.id, 10);
                const form = allForms.find(f => f.id === id);
                if (form) openEditModal(form);
            });
        });

        formsGrid.querySelectorAll(".btn-action-delete").forEach(btn => {
            btn.addEventListener("click", () => {
                const id = parseInt(btn.dataset.id, 10);
                handleDeleteForm(id);
            });
        });
    }

    /* =====================================================
       SUBMISSIONS RENDERING
    ===================================================== */
    function renderSubmissions() {
        if (!submissionsTableBody) return;

        if (allSubmissions.length === 0) {
            submissionsTableBody.innerHTML = `
                <tr>
                    <td colspan="8" style="text-align:center; padding:36px; color:#94a3b8;">
                        Chưa có lượt gửi lead nào từ biểu mẫu nhúng.
                    </td>
                </tr>
            `;
            return;
        }

        submissionsTableBody.innerHTML = allSubmissions.map(sub => {
            const timeStr = formatDateTime(sub.createdAt);
            const statusBadge = sub.isSpam
                ? `<span class="lead-badge-spam">⚠️ Spam (${escapeHtml(sub.spamReason || "Bị từ chối")})</span>`
                : `<span class="lead-badge-success">✓ Thành công (Lead Mới)</span>`;

            const customerLink = sub.customerId
                ? `<a href="customer-360?id=${sub.customerId}" style="color:var(--crm-primary); text-decoration:none; font-weight:600;" title="Xem Khách hàng 360">#${sub.customerId} Xem hồ sơ →</a>`
                : `<span style="color:#94a3b8;">-</span>`;

            return `
                <tr>
                    <td style="white-space:nowrap; color:#64748b; font-size:12.5px;">${timeStr}</td>
                    <td>
                        <strong style="color:var(--crm-text);">${escapeHtml(sub.fullName)}</strong>
                    </td>
                    <td>
                        <div><a href="mailto:${escapeHtml(sub.email)}" style="color:var(--crm-primary); text-decoration:none;">${escapeHtml(sub.email)}</a></div>
                        <div style="font-size:12px; color:#64748b;">${escapeHtml(sub.phone)}</div>
                    </td>
                    <td>
                        <div>${escapeHtml(sub.company || "(Cá nhân)")}</div>
                        <div style="font-size:12px; color:#64748b; max-width:260px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;" title="${escapeHtml(sub.interest || "")}">
                            ${escapeHtml(sub.interest || "-")}
                        </div>
                    </td>
                    <td>
                        <div style="font-weight:600;">${escapeHtml(sub.formName)}</div>
                        <span class="lead-form-key-badge">${escapeHtml(sub.formKey)}</span>
                    </td>
                    <td style="font-family:monospace; font-size:12px; color:#475569;">
                        ${escapeHtml(sub.ipAddress || "127.0.0.1")}
                    </td>
                    <td>${statusBadge}</td>
                    <td>${customerLink}</td>
                </tr>
            `;
        }).join("");
    }

    /* =====================================================
       EMBED MODAL LOGIC
    ===================================================== */
    function openEmbedModal(form) {
        currentSelectedForm = form;
        if (embedFormNameHeader) {
            embedFormNameHeader.textContent = `Biểu mẫu: ${form.name} (Key: ${form.formKey})`;
        }
        if (btnOpenDemoTest) {
            btnOpenDemoTest.href = `${API_BASE}/lead-form-embed.html?key=${encodeURIComponent(form.formKey)}`;
        }
        if (embedPreviewIframe) {
            embedPreviewIframe.src = `${API_BASE}/lead-form-embed.html?key=${encodeURIComponent(form.formKey)}`;
        }

        updateEmbedCodeBox();
        modalEmbedBackdrop.style.display = "flex";
    }

    function closeEmbedModal() {
        modalEmbedBackdrop.style.display = "none";
        if (embedPreviewIframe) embedPreviewIframe.src = "about:blank";
    }

    function updateEmbedCodeBox() {
        if (!currentSelectedForm) return;

        const key = currentSelectedForm.formKey;
        const title = currentSelectedForm.title || "Đăng ký tư vấn giải pháp";
        const desc = currentSelectedForm.description || "";
        const btnText = currentSelectedForm.submitButtonText || "Gửi yêu cầu";
        const formActionUrl = `${API_BASE}/api/public/lead-forms/submit`;

        let code = "";

        if (currentEmbedMode === "script") {
            code = `<!-- CRM Web-to-Lead Embed Widget -->
<div id="crm-web-lead-form" data-form-key="${key}"></div>
<script src="${API_BASE}/js/embed-lead-form.js" async defer><\/script>`;
        } else if (currentEmbedMode === "iframe") {
            code = `<!-- CRM Web-to-Lead iFrame Embed -->
<iframe src="${API_BASE}/lead-form-embed.html?key=${encodeURIComponent(key)}" 
        width="100%" height="620" frameborder="0" 
        style="border:none; max-width:560px; width:100%; border-radius:14px; box-shadow:0 10px 30px rgba(0,0,0,0.08);"
        title="${escapeHtml(title)}">
</iframe>`;
        } else if (currentEmbedMode === "html") {
            code = `<!-- CRM Web-to-Lead Standalone HTML Form -->
<form action="${formActionUrl}" method="POST" class="crm-custom-form">
    <input type="hidden" name="formKey" value="${key}">
    <!-- Honeypot trap chống spam (ẩn khỏi người dùng) -->
    <input type="text" name="_hp_website" style="display:none!important;" tabindex="-1" autocomplete="off">
    <input type="hidden" name="loadTimestamp" value="" id="crm_load_ts">

    <h3>${escapeHtml(title)}</h3>
    <p>${escapeHtml(desc)}</p>

    <div class="form-group">
        <label>Họ và tên *</label>
        <input type="text" name="fullName" required placeholder="Họ và tên của bạn">
    </div>

    <div class="form-group">
        <label>Email *</label>
        <input type="email" name="email" required placeholder="name@company.com">
    </div>

    <div class="form-group">
        <label>Số điện thoại *</label>
        <input type="tel" name="phone" required placeholder="0912 345 678">
    </div>

    <div class="form-group">
        <label>Công ty / Tổ chức</label>
        <input type="text" name="company" placeholder="Tên công ty...">
    </div>

    <div class="form-group">
        <label>Nhu cầu quan tâm</label>
        <textarea name="interest" placeholder="Nhu cầu tư vấn..."></textarea>
    </div>

    <button type="submit">${escapeHtml(btnText)}</button>
</form>
<script>
    document.getElementById('crm_load_ts').value = Date.now();
<\/script>`;
        }

        embedCodeDisplay.textContent = code;
    }

    /* =====================================================
       FORM EDITOR (CREATE / EDIT)
    ===================================================== */
    function openCreateModal() {
        modalFormTitle.textContent = "Tạo biểu mẫu thu thập Lead mới";
        editFormId.value = "";
        leadFormEditor.reset();
        formIsActiveInput.checked = true;
        formLeadSourceInput.value = "Website / Biểu mẫu";
        formBtnTextInput.value = "Gửi yêu cầu tư vấn";
        formSuccessMsgInput.value = "Cảm ơn quý khách! Chúng tôi đã nhận được thông tin và sẽ liên hệ sớm nhất.";
        modalFormBackdrop.style.display = "flex";
        formNameInput.focus();
    }

    function openEditModal(form) {
        modalFormTitle.textContent = "Chỉnh sửa biểu mẫu thu thập Lead";
        editFormId.value = form.id;
        formNameInput.value = form.name || "";
        formTitleInput.value = form.title || "";
        formLeadSourceInput.value = form.leadSourceName || "Website / Biểu mẫu";
        formDescInput.value = form.description || "";
        formBtnTextInput.value = form.submitButtonText || "Gửi yêu cầu tư vấn";
        formRedirectUrlInput.value = form.redirectUrl || "";
        formSuccessMsgInput.value = form.successMessage || "";
        formIsActiveInput.checked = form.isActive;
        modalFormBackdrop.style.display = "flex";
        formNameInput.focus();
    }

    function closeFormModal() {
        modalFormBackdrop.style.display = "none";
    }

    async function handleSaveForm(e) {
        e.preventDefault();

        const name = formNameInput.value.trim();
        const title = formTitleInput.value.trim();
        const leadSourceName = formLeadSourceInput.value.trim();
        const description = formDescInput.value.trim();
        const submitButtonText = formBtnTextInput.value.trim();
        const redirectUrl = formRedirectUrlInput.value.trim();
        const successMessage = formSuccessMsgInput.value.trim();
        const active = formIsActiveInput.checked;
        const id = editFormId.value;

        if (!name) {
            showToast("Vui lòng nhập tên biểu mẫu.", "error");
            formNameInput.focus();
            return;
        }

        const payload = {
            name,
            title,
            leadSourceName,
            description,
            submitButtonText,
            redirectUrl: redirectUrl || null,
            successMessage,
            active
        };

        const isEdit = Boolean(id);
        const url = isEdit ? `${API_BASE}/api/lead-forms/${id}` : `${API_BASE}/api/lead-forms`;
        const method = isEdit ? "PUT" : "POST";

        try {
            const res = await fetch(url, {
                method,
                headers: {
                    "Content-Type": "application/json",
                    "Accept": "application/json"
                },
                credentials: "include",
                body: JSON.stringify(payload)
            });

            const json = await res.json();
            if (res.ok && json.success) {
                showToast(isEdit ? "Cập nhật biểu mẫu thành công!" : "Tạo biểu mẫu mới thành công!", "success");
                closeFormModal();
                await loadData();
            } else {
                showToast(json.message || "Lỗi lưu biểu mẫu.", "error");
            }
        } catch (err) {
            showToast("Lỗi kết nối máy chủ: " + err.message, "error");
        }
    }

    async function handleDeleteForm(id) {
        const form = allForms.find(f => f.id === id);
        if (!form) return;

        if (!confirm(`Bạn có chắc chắn muốn xóa biểu mẫu "${form.name}"?\n(Các lead đã thu thập trước đó sẽ vẫn được lưu trong hệ thống)`)) {
            return;
        }

        try {
            const res = await fetch(`${API_BASE}/api/lead-forms/${id}`, {
                method: "DELETE",
                credentials: "include"
            });
            const json = await res.json();
            if (res.ok && json.success) {
                showToast("Đã xóa biểu mẫu thành công!", "success");
                await loadData();
            } else {
                showToast(json.message || "Không thể xóa biểu mẫu.", "error");
            }
        } catch (err) {
            showToast("Lỗi khi xóa: " + err.message, "error");
        }
    }

    /* =====================================================
       UTILITIES
    ===================================================== */
    function escapeHtml(str) {
        if (!str) return "";
        return String(str)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    function formatDateTime(isoStr) {
        if (!isoStr) return "-";
        try {
            const d = new Date(isoStr);
            return d.toLocaleDateString("vi-VN", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit"
            });
        } catch (e) {
            return isoStr;
        }
    }

    function showToast(message, type = "info") {
        if (window.crmToast && typeof window.crmToast.show === "function") {
            window.crmToast.show(message, type);
            return;
        }
        // Fallback simple toast
        const toast = document.createElement("div");
        toast.style.position = "fixed";
        toast.style.bottom = "24px";
        toast.style.right = "24px";
        toast.style.background = type === "success" ? "#10b981" : type === "error" ? "#ef4444" : "#1f2937";
        toast.style.color = "#fff";
        toast.style.padding = "12px 20px";
        toast.style.borderRadius = "8px";
        toast.style.boxShadow = "0 8px 24px rgba(0,0,0,0.2)";
        toast.style.fontSize = "14px";
        toast.style.fontWeight = "600";
        toast.style.zIndex = "99999";
        toast.style.transition = "all 0.3s ease";
        toast.textContent = message;

        document.body.appendChild(toast);
        setTimeout(() => {
            toast.style.opacity = "0";
            toast.style.transform = "translateY(10px)";
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    document.addEventListener("DOMContentLoaded", init);
})();
