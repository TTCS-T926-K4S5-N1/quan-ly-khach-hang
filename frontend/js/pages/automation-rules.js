"use strict";

(function () {
    const API_BASE = "/crm";

    const state = {
        rules: [],
        stats: {},
        logs: [],
        currentTab: "rules",
        editingId: null
    };

    document.addEventListener("DOMContentLoaded", () => {
        initTabs();
        initModals();
        initFormHandlers();
        loadRules();
    });

    function initTabs() {
        const tabRulesBtn = document.getElementById("tabRulesBtn");
        const tabLogsBtn = document.getElementById("tabLogsBtn");
        const tabRulesContent = document.getElementById("tabRulesContent");
        const tabLogsContent = document.getElementById("tabLogsContent");

        tabRulesBtn?.addEventListener("click", () => {
            tabRulesBtn.classList.add("active");
            tabLogsBtn.classList.remove("active");
            tabRulesContent.style.display = "block";
            tabLogsContent.style.display = "none";
            state.currentTab = "rules";
        });

        tabLogsBtn?.addEventListener("click", () => {
            tabLogsBtn.classList.add("active");
            tabRulesBtn.classList.remove("active");
            tabLogsContent.style.display = "block";
            tabRulesContent.style.display = "none";
            state.currentTab = "logs";
            loadLogs();
        });

        document.getElementById("btnRefreshLogs")?.addEventListener("click", loadLogs);
    }

    function initModals() {
        const ruleModal = document.getElementById("ruleModal");
        const testModal = document.getElementById("testModal");

        // Rule Modal
        document.getElementById("btnOpenCreateRuleModal")?.addEventListener("click", () => {
            openRuleModal(null);
        });

        document.getElementById("btnCloseRuleModal")?.addEventListener("click", () => {
            ruleModal.classList.remove("active");
        });

        document.getElementById("btnCancelRuleModal")?.addEventListener("click", () => {
            ruleModal.classList.remove("active");
        });

        // Test Modal
        document.getElementById("btnOpenTestModal")?.addEventListener("click", () => {
            testModal.classList.add("active");
            document.getElementById("testResultBox").style.display = "none";
        });

        document.getElementById("btnCloseTestModal")?.addEventListener("click", () => {
            testModal.classList.remove("active");
        });

        document.getElementById("btnCancelTestModal")?.addEventListener("click", () => {
            testModal.classList.remove("active");
        });

        document.getElementById("btnExecuteTestTrigger")?.addEventListener("click", executeTestTrigger);

        // Dynamic form inputs
        document.getElementById("actionType")?.addEventListener("change", (e) => {
            const val = e.target.value;
            document.getElementById("fieldsCreateTask").style.display = (val === "CREATE_TASK") ? "flex" : "none";
            document.getElementById("fieldsSendNotification").style.display = (val === "SEND_NOTIFICATION") ? "flex" : "none";
            document.getElementById("fieldsChangeOwner").style.display = (val === "CHANGE_OWNER") ? "flex" : "none";
        });

        document.getElementById("triggerEvent")?.addEventListener("change", (e) => {
            const val = e.target.value;
            const stageGroup = document.getElementById("groupConditionStage");
            if (stageGroup) {
                stageGroup.style.display = (val === "STAGE_CHANGED") ? "flex" : "none";
            }
        });
    }

    function initFormHandlers() {
        const form = document.getElementById("ruleForm");
        form?.addEventListener("submit", async (e) => {
            e.preventDefault();

            const name = document.getElementById("ruleName").value.trim();
            const description = document.getElementById("ruleDescription").value.trim();
            const triggerEvent = document.getElementById("triggerEvent").value;
            const triggerEntity = document.getElementById("triggerEntity").value;
            const actionType = document.getElementById("actionType").value;
            const active = document.getElementById("ruleActiveCheckbox").checked;

            let conditionField = "stage_id";
            let conditionOperator = "EQUALS";
            let conditionValue = document.getElementById("conditionStageValue").value;

            if (triggerEvent === "STAGNANT_FLAGGED") {
                conditionField = "is_stagnant";
                conditionValue = "1";
            } else if (triggerEvent === "STATUS_CHANGED") {
                conditionField = "status";
                conditionValue = "WON";
            }

            let actionParamsObj = {};
            if (actionType === "CREATE_TASK") {
                actionParamsObj = {
                    subject: document.getElementById("taskSubject").value.trim(),
                    type: document.getElementById("taskType").value,
                    dueDays: parseInt(document.getElementById("taskDueDays").value, 10),
                    description: "Tự động tạo bởi quy tắc: " + name
                };
            } else if (actionType === "SEND_NOTIFICATION") {
                actionParamsObj = {
                    title: document.getElementById("notifTitleInput").value.trim() || name,
                    content: document.getElementById("notifContentInput").value.trim()
                };
            } else if (actionType === "CHANGE_OWNER") {
                actionParamsObj = {
                    newOwnerId: parseInt(document.getElementById("newOwnerSelect").value, 10)
                };
            }

            const payload = {
                name,
                description,
                triggerEvent,
                triggerEntity,
                conditionField,
                conditionOperator,
                conditionValue,
                actionType,
                actionParams: JSON.stringify(actionParamsObj),
                active
            };

            try {
                let url = `${API_BASE}/api/automations/rules`;
                let method = "POST";
                if (state.editingId) {
                    url += `/${state.editingId}`;
                    method = "PUT";
                }

                const res = await fetch(url, {
                    method,
                    headers: { "Content-Type": "application/json; charset=utf-8" },
                    body: JSON.stringify(payload),
                    credentials: "same-origin"
                });

                const json = await res.json();
                if (json.success) {
                    document.getElementById("ruleModal").classList.remove("active");
                    await loadRules();
                } else {
                    alert("Lỗi: " + json.message);
                }
            } catch (err) {
                alert("Lỗi máy chủ khi lưu quy tắc: " + err.message);
            }
        });
    }

    async function loadRules() {
        const container = document.getElementById("rulesListContainer");
        try {
            const res = await fetch(`${API_BASE}/api/automations/rules`, { credentials: "same-origin" });
            const json = await res.json();
            if (json.success && json.data) {
                state.rules = json.data.rules || [];
                state.stats = json.data.stats || {};
                renderStats();
                renderRulesList();
            }
        } catch (err) {
            if (container) {
                container.innerHTML = `<div style="text-align:center; padding:30px; color:#dc2626;">Lỗi tải danh sách quy tắc: ${err.message}</div>`;
            }
        }
    }

    function renderStats() {
        const s = state.stats;
        document.getElementById("statTotalRules").textContent = s.totalRules || 0;
        document.getElementById("statActiveRules").textContent = s.activeRules || 0;
        document.getElementById("statInactiveRules").textContent = s.inactiveRules || 0;
        document.getElementById("statTotalRuns").textContent = s.totalRuns || 0;
    }

    function renderRulesList() {
        const container = document.getElementById("rulesListContainer");
        if (!container) return;

        if (state.rules.length === 0) {
            container.innerHTML = `
                <div class="crm-card" style="text-align:center; padding:40px; color:var(--crm-muted);">
                    <div style="font-size:32px; margin-bottom:8px;">⚡</div>
                    <div style="font-size:15px; font-weight:700; color:var(--crm-text);">Chưa có quy tắc tự động nào</div>
                    <p style="font-size:13px; margin:4px 0 16px;">Hãy tạo quy tắc theo mẫu Khi – Thì để tự động hóa quy trình bán hàng của đội ngũ.</p>
                    <button type="button" class="crm-btn crm-btn-primary" onclick="document.getElementById('btnOpenCreateRuleModal').click()">+ Tạo quy tắc đầu tiên</button>
                </div>
            `;
            return;
        }

        let html = "";
        state.rules.forEach(r => {
            const whenText = formatWhenCondition(r);
            const thenText = formatThenAction(r);

            html += `
                <div class="auto-rule-card">
                    <div class="auto-rule-top">
                        <div class="auto-rule-title-box">
                            <div class="auto-rule-title">
                                <span>${escapeHtml(r.name)}</span>
                                <span class="dash-tag ${r.active ? 'dash-tag-green' : 'dash-tag-gray'}" style="font-size:11px;">
                                    ${r.active ? '✔ Đang chạy' : '⏸ Đang tạm dừng'}
                                </span>
                            </div>
                            <div class="auto-rule-desc">${escapeHtml(r.description || 'Không có mô tả chi tiết')}</div>
                        </div>

                        <div style="display:flex; align-items:center; gap:12px;">
                            <label class="crm-switch" title="${r.active ? 'Bấm để tạm dừng' : 'Bấm để kích hoạt'}">
                                <input type="checkbox" class="rule-toggle-switch" data-id="${r.id}" ${r.active ? 'checked' : ''}>
                                <span class="crm-slider"></span>
                            </label>
                            <button type="button" class="crm-btn crm-btn-secondary btn-edit-rule" data-id="${r.id}" style="font-size:12px; padding:6px 10px;">
                                ✏️ Sửa
                            </button>
                            <button type="button" class="crm-btn crm-btn-secondary btn-delete-rule" data-id="${r.id}" style="font-size:12px; padding:6px 10px; color:#dc2626;">
                                🗑️ Xóa
                            </button>
                        </div>
                    </div>

                    <div class="auto-when-then-box">
                        <span class="auto-badge-when">KHI (TRIGGER)</span>
                        <strong style="color:#1e3a8a; font-size:13px;">${whenText}</strong>
                        <span class="auto-arrow">➔</span>
                        <span class="auto-badge-then">THÌ (ACTION)</span>
                        <strong style="color:#065f46; font-size:13px;">${thenText}</strong>
                    </div>

                    <div class="auto-rule-foot">
                        <div>Đối tượng: <strong>${escapeHtml(r.triggerEntity)}</strong> | Mã quy tắc: #${r.id}</div>
                        <div>Cập nhật: ${escapeHtml(r.updatedAt || r.createdAt || 'Mới tạo')}</div>
                    </div>
                </div>
            `;
        });

        container.innerHTML = html;

        // Attach event listeners for switches and buttons
        container.querySelectorAll(".rule-toggle-switch").forEach(sw => {
            sw.addEventListener("change", async (e) => {
                const id = e.target.dataset.id;
                await toggleRule(id);
            });
        });

        container.querySelectorAll(".btn-edit-rule").forEach(btn => {
            btn.addEventListener("click", () => {
                const id = btn.dataset.id;
                openRuleModal(id);
            });
        });

        container.querySelectorAll(".btn-delete-rule").forEach(btn => {
            btn.addEventListener("click", () => {
                const id = btn.dataset.id;
                deleteRule(id);
            });
        });
    }

    function formatWhenCondition(r) {
        if (r.triggerEvent === "STAGE_CHANGED") {
            const stageMap = { "1": "Mới tiếp cận", "2": "Đủ điều kiện", "3": "Gửi báo giá (Proposal)", "4": "Thương lượng (Negotiation)", "5": "Thành công (Won)", "6": "Thất bại (Lost)" };
            const stageName = stageMap[r.conditionValue] || ("Giai đoạn #" + r.conditionValue);
            return `Cơ hội chuyển sang giai đoạn [${stageName}]`;
        } else if (r.triggerEvent === "STAGNANT_FLAGGED") {
            return `Cơ hội bị gắn cờ [Đình trệ (Stagnant)]`;
        } else if (r.triggerEvent === "STATUS_CHANGED") {
            return `Trạng thái chuyển sang [${r.conditionValue}]`;
        }
        return `${r.triggerEvent} (${r.conditionField} = ${r.conditionValue})`;
    }

    function formatThenAction(r) {
        let p = {};
        try {
            if (r.actionParams) p = JSON.parse(r.actionParams);
        } catch (_) {}

        if (r.actionType === "CREATE_TASK") {
            const days = p.dueDays || 3;
            const sub = p.subject || "Công việc";
            return `Tự tạo việc [${sub}] (hạn sau ${days} ngày) giao cho người phụ trách deal`;
        } else if (r.actionType === "SEND_NOTIFICATION") {
            const title = p.title || "Thông báo";
            return `Gửi thông báo trong ứng dụng: "${title}"`;
        } else if (r.actionType === "CHANGE_OWNER") {
            return `Chuyển quyền sở hữu cho nhân sự ID ${p.newOwnerId || 'quản lý'}`;
        }
        return r.actionType;
    }

    async function toggleRule(id) {
        try {
            const res = await fetch(`${API_BASE}/api/automations/rules/${id}/toggle`, {
                method: "POST",
                credentials: "same-origin"
            });
            const json = await res.json();
            if (json.success) {
                await loadRules();
            } else {
                alert("Lỗi chuyển đổi trạng thái: " + json.message);
            }
        } catch (e) {
            alert("Lỗi máy chủ: " + e.message);
        }
    }

    async function deleteRule(id) {
        if (!confirm("Bạn có chắc chắn muốn xóa quy tắc tự động này?")) return;
        try {
            const res = await fetch(`${API_BASE}/api/automations/rules/${id}`, {
                method: "DELETE",
                credentials: "same-origin"
            });
            const json = await res.json();
            if (json.success) {
                await loadRules();
            } else {
                alert("Lỗi xóa quy tắc: " + json.message);
            }
        } catch (e) {
            alert("Lỗi máy chủ: " + e.message);
        }
    }

    function openRuleModal(id) {
        state.editingId = id;
        const modal = document.getElementById("ruleModal");
        const title = document.getElementById("modalTitle");

        if (!id) {
            title.textContent = "Khai báo Quy tắc Tự động hoá (Khi – Thì)";
            document.getElementById("ruleForm").reset();
            document.getElementById("ruleId").value = "";
            document.getElementById("triggerEvent").value = "STAGE_CHANGED";
            document.getElementById("triggerEntity").value = "OPPORTUNITY";
            document.getElementById("conditionStageValue").value = "3";
            document.getElementById("actionType").value = "CREATE_TASK";
            document.getElementById("taskSubject").value = "Gọi lại kiểm tra phản hồi sau báo giá";
            document.getElementById("taskType").value = "CALL";
            document.getElementById("taskDueDays").value = "3";
            document.getElementById("ruleActiveCheckbox").checked = true;
            document.getElementById("fieldsCreateTask").style.display = "flex";
            document.getElementById("fieldsSendNotification").style.display = "none";
            document.getElementById("fieldsChangeOwner").style.display = "none";
            document.getElementById("groupConditionStage").style.display = "flex";
        } else {
            title.textContent = "Chỉnh sửa Quy tắc Tự động hoá";
            const r = state.rules.find(x => String(x.id) === String(id));
            if (!r) return;

            document.getElementById("ruleName").value = r.name || "";
            document.getElementById("ruleDescription").value = r.description || "";
            document.getElementById("triggerEvent").value = r.triggerEvent || "STAGE_CHANGED";
            document.getElementById("triggerEntity").value = r.triggerEntity || "OPPORTUNITY";
            if (r.conditionValue) document.getElementById("conditionStageValue").value = r.conditionValue;
            document.getElementById("actionType").value = r.actionType || "CREATE_TASK";
            document.getElementById("ruleActiveCheckbox").checked = !!r.active;

            let p = {};
            try { if (r.actionParams) p = JSON.parse(r.actionParams); } catch (_) {}

            if (r.actionType === "CREATE_TASK") {
                document.getElementById("taskSubject").value = p.subject || "";
                document.getElementById("taskType").value = p.type || "CALL";
                document.getElementById("taskDueDays").value = p.dueDays || 3;
            } else if (r.actionType === "SEND_NOTIFICATION") {
                document.getElementById("notifTitleInput").value = p.title || "";
                document.getElementById("notifContentInput").value = p.content || "";
            } else if (r.actionType === "CHANGE_OWNER") {
                if (p.newOwnerId) document.getElementById("newOwnerSelect").value = p.newOwnerId;
            }

            document.getElementById("fieldsCreateTask").style.display = (r.actionType === "CREATE_TASK") ? "flex" : "none";
            document.getElementById("fieldsSendNotification").style.display = (r.actionType === "SEND_NOTIFICATION") ? "flex" : "none";
            document.getElementById("fieldsChangeOwner").style.display = (r.actionType === "CHANGE_OWNER") ? "flex" : "none";
            document.getElementById("groupConditionStage").style.display = (r.triggerEvent === "STAGE_CHANGED") ? "flex" : "none";
        }

        modal.classList.add("active");
    }

    async function loadLogs() {
        const tbody = document.getElementById("logsTbody");
        if (!tbody) return;
        tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding:25px; color:var(--crm-muted);">Đang tải nhật ký thực thi...</td></tr>`;

        try {
            const res = await fetch(`${API_BASE}/api/automations/logs?limit=50`, { credentials: "same-origin" });
            const json = await res.json();
            if (json.success && json.data) {
                state.logs = json.data;
                renderLogsTable();
            }
        } catch (e) {
            tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding:25px; color:#dc2626;">Lỗi tải nhật ký: ${e.message}</td></tr>`;
        }
    }

    function renderLogsTable() {
        const tbody = document.getElementById("logsTbody");
        if (!tbody) return;

        if (state.logs.length === 0) {
            tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding:35px; color:var(--crm-muted);">Chưa có lượt thực thi quy tắc tự động nào được ghi nhận.</td></tr>`;
            return;
        }

        tbody.innerHTML = state.logs.map(l => {
            const isSuccess = l.status === "SUCCESS";
            return `
                <tr>
                    <td style="font-size:12px; color:var(--crm-muted); white-space:nowrap;">
                        ${escapeHtml(l.executedAt || '')}
                    </td>
                    <td>
                        <strong style="color:var(--crm-text); font-size:13px;">${escapeHtml(l.ruleName)}</strong>
                        <div style="font-size:11.5px; color:#2563eb;">Sự kiện: ${escapeHtml(l.triggerEvent)}</div>
                    </td>
                    <td style="font-size:12.5px; font-weight:600; color:#334155;">
                        ${escapeHtml(l.entityName || (l.entityType + ' #' + l.entityId))}
                    </td>
                    <td style="font-size:12.5px; color:var(--crm-text);">
                        ${escapeHtml(l.actionSummary || l.actionType)}
                    </td>
                    <td style="text-align:center;">
                        <span class="dash-tag ${isSuccess ? 'dash-tag-green' : 'dash-tag-red'}" style="font-size:11px;">
                            ${isSuccess ? '✔ Thành công' : '✖ Thất bại'}
                        </span>
                    </td>
                </tr>
            `;
        }).join("");
    }

    async function executeTestTrigger() {
        const scenario = document.getElementById("testScenarioSelect").value;
        const resultBox = document.getElementById("testResultBox");
        resultBox.style.display = "block";
        resultBox.style.background = "#eff6ff";
        resultBox.style.color = "#1e40af";
        resultBox.innerHTML = "⏳ Đang gửi tín hiệu kích hoạt tự động hoá...";

        let payload = {};
        if (scenario === "1") {
            payload = {
                triggerEvent: "STAGE_CHANGED",
                triggerEntity: "OPPORTUNITY",
                entityId: 1,
                name: "Cơ hội nâng cấp hệ thống ERP Vingroup",
                stage_id: "3",
                ownerUserId: 4,
                customerId: 1
            };
        } else if (scenario === "2") {
            payload = {
                triggerEvent: "STAGE_CHANGED",
                triggerEntity: "OPPORTUNITY",
                entityId: 2,
                name: "Hợp đồng phần mềm CRM Masan Group",
                stage_id: "4",
                ownerUserId: 4,
                customerId: 2
            };
        } else {
            payload = {
                triggerEvent: "STAGNANT_FLAGGED",
                triggerEntity: "OPPORTUNITY",
                entityId: 3,
                name: "Gói chuyển đổi số Techcombank",
                is_stagnant: "1",
                ownerUserId: 4,
                customerId: 3
            };
        }

        try {
            const res = await fetch(`${API_BASE}/api/automations/test-trigger`, {
                method: "POST",
                headers: { "Content-Type": "application/json; charset=utf-8" },
                body: JSON.stringify(payload),
                credentials: "same-origin"
            });
            const json = await res.json();
            if (json.success) {
                resultBox.style.background = "#f0fdf4";
                resultBox.style.color = "#166534";
                resultBox.innerHTML = `
                    🎉 <strong>Kích hoạt thành công!</strong><br>
                    Hệ thống đã nhận sự kiện và thực thi bất đồng bộ.<br>
                    Kiểm tra ngay mục <strong>Nhật ký thực thi</strong> và biểu tượng <strong>Chuông thông báo</strong> trên thanh tiêu đề!
                `;
                setTimeout(loadRules, 1500);
            } else {
                resultBox.style.background = "#fef2f2";
                resultBox.style.color = "#dc2626";
                resultBox.innerHTML = "❌ Lỗi: " + json.message;
            }
        } catch (err) {
            resultBox.style.background = "#fef2f2";
            resultBox.style.color = "#dc2626";
            resultBox.innerHTML = "❌ Lỗi: " + err.message;
        }
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

})();
