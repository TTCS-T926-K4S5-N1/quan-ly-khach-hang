"use strict";

(function () {
    const API_BASE = "http://localhost:8080/crm/api/lead-routing";
    const USERS_API = "http://localhost:8080/crm/api/users";
    const MASTER_DATA_API = "http://localhost:8080/crm/api/masterdata";

    let state = {
        rules: [],
        unassigned: [],
        criteria: [],
        thresholds: [],
        logs: [],
        users: [],
        regions: [],
        industries: [],
        leadSources: []
    };

    // DOM Elements
    const elements = {
        kpiActiveRules: document.getElementById("kpiActiveRules"),
        kpiUnassignedCount: document.getElementById("kpiUnassignedCount"),
        kpiHotUnassigned: document.getElementById("kpiHotUnassigned"),
        kpiTotalCriteria: document.getElementById("kpiTotalCriteria"),
        badgeUnassigned: document.getElementById("badgeUnassigned"),
        rulesTableBody: document.getElementById("rulesTableBody"),
        unassignedTableBody: document.getElementById("unassignedTableBody"),
        thresholdsContainer: document.getElementById("thresholdsContainer"),
        scoringTableBody: document.getElementById("scoringTableBody"),
        auditTableBody: document.getElementById("auditTableBody"),
        // Modals
        modalRuleBackdrop: document.getElementById("modalRuleBackdrop"),
        modalManualAssignBackdrop: document.getElementById("modalManualAssignBackdrop"),
        modalCriterionBackdrop: document.getElementById("modalCriterionBackdrop"),
        formAssignmentRule: document.getElementById("formAssignmentRule"),
        formManualAssign: document.getElementById("formManualAssign"),
        formCriterion: document.getElementById("formCriterion"),
        roundRobinUsersContainer: document.getElementById("roundRobinUsersContainer"),
        groupDirectUser: document.getElementById("groupDirectUser"),
        groupRoundRobin: document.getElementById("groupRoundRobin"),
        ruleAssigneeUserId: document.getElementById("ruleAssigneeUserId"),
        manualTargetUserId: document.getElementById("manualTargetUserId")
    };

    document.addEventListener("DOMContentLoaded", init);

    async function init() {
        initTabs();
        initEventHandlers();
        await loadStaticOptions();
        await refreshAllData();
    }

    function initTabs() {
        const tabBtns = document.querySelectorAll(".routing-tabs-bar .tab-btn");
        const tabPanes = document.querySelectorAll(".tab-pane");

        tabBtns.forEach(btn => {
            btn.addEventListener("click", () => {
                const targetId = btn.getAttribute("data-tab");
                tabBtns.forEach(b => b.classList.remove("active"));
                tabPanes.forEach(p => p.classList.remove("active"));

                btn.classList.add("active");
                const targetPane = document.getElementById(targetId);
                if (targetPane) targetPane.classList.add("active");

                if (targetId === "tabAudit") loadAuditLogs();
            });
        });
    }

    function initEventHandlers() {
        // Run assignment now
        document.getElementById("btnRunAssignmentNow")?.addEventListener("click", async () => {
            try {
                const btn = document.getElementById("btnRunAssignmentNow");
                btn.disabled = true;
                btn.innerHTML = `<span class="btn-icon">⏳</span> Đang phân bổ...`;
                const res = await fetch(`${API_BASE}/assignment/run-now`, { method: "POST", credentials: "include" });
                const json = await res.json();
                if (json.success) {
                    alert(`✅ Hoàn tất: Đã tự động phân bổ ${json.data} lead cho chuyên viên phụ trách!`);
                    await refreshAllData();
                } else {
                    alert("Lỗi: " + json.message);
                }
            } catch (err) {
                alert("Lỗi kết nối máy chủ: " + err.message);
            } finally {
                const btn = document.getElementById("btnRunAssignmentNow");
                btn.disabled = false;
                btn.innerHTML = `<span class="btn-icon">🔄</span> Chạy phân bổ ngay`;
            }
        });

        // Recalculate scores
        document.getElementById("btnRecalculateScores")?.addEventListener("click", async () => {
            if (!confirm("Hệ thống sẽ duyệt toàn bộ khách hàng và tính lại điểm số theo các tiêu chí mới nhất. Bạn có chắc chắn?")) return;
            try {
                const btn = document.getElementById("btnRecalculateScores");
                btn.disabled = true;
                btn.innerHTML = `<span class="btn-icon">⏳</span> Đang tính toán...`;
                const res = await fetch(`${API_BASE}/scoring/recalculate`, { method: "POST", credentials: "include" });
                const json = await res.json();
                if (json.success) {
                    alert(`✅ Thành công: Đã tính toán lại điểm số cho ${json.data} lead/khách hàng!`);
                    await refreshAllData();
                } else {
                    alert("Lỗi: " + json.message);
                }
            } catch (err) {
                alert("Lỗi kết nối máy chủ: " + err.message);
            } finally {
                const btn = document.getElementById("btnRecalculateScores");
                btn.disabled = false;
                btn.innerHTML = `<span class="btn-icon">⚡</span> Tính lại điểm toàn bộ Lead`;
            }
        });

        // Open Rule Modal
        document.getElementById("btnCreateRule")?.addEventListener("click", () => openRuleModal());
        document.getElementById("btnCloseRuleModal")?.addEventListener("click", closeRuleModal);
        document.getElementById("btnCancelRuleModal")?.addEventListener("click", closeRuleModal);

        // Radio change for Rule Target Type
        document.querySelectorAll('input[name="ruleTargetType"]').forEach(radio => {
            radio.addEventListener("change", (e) => {
                if (e.target.value === "DIRECT_USER") {
                    elements.groupDirectUser.style.display = "block";
                    elements.groupRoundRobin.style.display = "none";
                } else {
                    elements.groupDirectUser.style.display = "none";
                    elements.groupRoundRobin.style.display = "block";
                }
            });
        });

        // Form Assignment Rule Submit
        elements.formAssignmentRule?.addEventListener("submit", handleRuleSubmit);

        // Manual Assign Modal
        document.getElementById("btnCloseManualModal")?.addEventListener("click", closeManualModal);
        document.getElementById("btnCancelManualModal")?.addEventListener("click", closeManualModal);
        elements.formManualAssign?.addEventListener("submit", handleManualAssignSubmit);

        // Criterion Modal
        document.getElementById("btnOpenAddCriterionModal")?.addEventListener("click", () => openCriterionModal());
        document.getElementById("btnCloseCriterionModal")?.addEventListener("click", closeCriterionModal);
        document.getElementById("btnCancelCriterionModal")?.addEventListener("click", closeCriterionModal);
        elements.formCriterion?.addEventListener("submit", handleCriterionSubmit);
    }

    async function loadStaticOptions() {
        try {
            // Load Users
            const usersRes = await fetch(`${USERS_API}?page=1&size=100`, { credentials: "include" });
            const usersJson = await usersRes.json();
            if (usersJson.success && usersJson.data && usersJson.data.items) {
                state.users = usersJson.data.items;
            } else if (usersJson.data && Array.isArray(usersJson.data)) {
                state.users = usersJson.data;
            }

            // Populate user options in dropdowns
            populateUserDropdowns();

            // Load Master Data: Region, Industry, Lead Source
            const [regRes, indRes, srcRes] = await Promise.all([
                fetch(`${MASTER_DATA_API}?type=region`, { credentials: "include" }).then(r => r.json()).catch(() => ({ data: [] })),
                fetch(`${MASTER_DATA_API}?type=industry`, { credentials: "include" }).then(r => r.json()).catch(() => ({ data: [] })),
                fetch(`${MASTER_DATA_API}?type=lead-source`, { credentials: "include" }).then(r => r.json()).catch(() => ({ data: [] }))
            ]);

            state.regions = regRes.data || [];
            state.industries = indRes.data || [];
            state.leadSources = srcRes.data || [];

            populateFilterDropdowns();

        } catch (e) {
            console.error("Lỗi tải danh mục:", e);
        }
    }

    function populateUserDropdowns() {
        // Direct assignee select
        const ruleAssignee = elements.ruleAssigneeUserId;
        const manualTarget = elements.manualTargetUserId;

        ruleAssignee.innerHTML = `<option value="">-- Chọn nhân viên kinh doanh --</option>`;
        manualTarget.innerHTML = `<option value="">-- Chọn chuyên viên kinh doanh --</option>`;

        state.users.forEach(u => {
            const opt = `<option value="${u.id}">${escapeHtml(u.fullName || u.name)} (${escapeHtml(u.email || "")})</option>`;
            ruleAssignee.insertAdjacentHTML("beforeend", opt);
            manualTarget.insertAdjacentHTML("beforeend", opt);
        });

        // Round robin pool checkboxes
        const poolContainer = elements.roundRobinUsersContainer;
        poolContainer.innerHTML = "";
        state.users.forEach(u => {
            const item = `
                <label class="pool-checkbox-item">
                    <input type="checkbox" name="poolUserId" value="${u.id}">
                    <span>${escapeHtml(u.fullName || u.name)}</span>
                </label>
            `;
            poolContainer.insertAdjacentHTML("beforeend", item);
        });
    }

    function populateFilterDropdowns() {
        const regSelect = document.getElementById("ruleRegionId");
        const indSelect = document.getElementById("ruleIndustryId");
        const srcSelect = document.getElementById("ruleLeadSource");

        if (regSelect) {
            regSelect.innerHTML = `<option value="">-- Tất cả khu vực --</option>`;
            state.regions.forEach(r => {
                regSelect.insertAdjacentHTML("beforeend", `<option value="${r.id}">${escapeHtml(r.name)}</option>`);
            });
        }

        if (indSelect) {
            indSelect.innerHTML = `<option value="">-- Tất cả ngành nghề --</option>`;
            state.industries.forEach(i => {
                indSelect.insertAdjacentHTML("beforeend", `<option value="${i.id}">${escapeHtml(i.name)}</option>`);
            });
        }

        if (srcSelect) {
            srcSelect.innerHTML = `<option value="">-- Tất cả nguồn lead --</option>`;
            state.leadSources.forEach(s => {
                srcSelect.insertAdjacentHTML("beforeend", `<option value="${escapeHtml(s.name)}">${escapeHtml(s.name)}</option>`);
            });
        }
    }

    async function refreshAllData() {
        await Promise.all([
            loadOverviewStats(),
            loadAssignmentRules(),
            loadUnassignedLeads(),
            loadScoringSettings()
        ]);
    }

    async function loadOverviewStats() {
        try {
            const res = await fetch(`${API_BASE}/overview`, { credentials: "include" });
            const json = await res.json();
            if (json.success && json.data) {
                const d = json.data;
                elements.kpiActiveRules.textContent = `${d.activeRules} / ${d.totalRules}`;
                elements.kpiUnassignedCount.textContent = d.unassignedCount;
                elements.kpiHotUnassigned.textContent = d.hotUnassigned;
                elements.kpiTotalCriteria.textContent = d.totalCriteria;
                elements.badgeUnassigned.textContent = d.unassignedCount;
            }
        } catch (e) {
            console.error("Lỗi lấy overview stats:", e);
        }
    }

    // =====================================================
    // TAB 1: ASSIGNMENT RULES
    // =====================================================
    async function loadAssignmentRules() {
        try {
            const res = await fetch(`${API_BASE}/assignment/rules`, { credentials: "include" });
            const json = await res.json();
            if (json.success) {
                state.rules = json.data || [];
                renderRulesTable();
            }
        } catch (e) {
            elements.rulesTableBody.innerHTML = `<tr><td colspan="6" class="text-center text-red py-4">Lỗi: ${e.message}</td></tr>`;
        }
    }

    function renderRulesTable() {
        if (!state.rules || state.rules.length === 0) {
            elements.rulesTableBody.innerHTML = `<tr><td colspan="6" class="text-center py-4">Chưa có quy tắc phân bổ nào. Hãy tạo quy tắc mới!</td></tr>`;
            return;
        }

        let html = "";
        state.rules.forEach((r, idx) => {
            // Filters
            const tags = [];
            if (r.conditionRegionName) tags.push(`<span class="filter-tag">📍 Khu vực: <strong>${escapeHtml(r.conditionRegionName)}</strong></span>`);
            if (r.conditionIndustryName) tags.push(`<span class="filter-tag">🏢 Ngành: <strong>${escapeHtml(r.conditionIndustryName)}</strong></span>`);
            if (r.conditionLeadSource) tags.push(`<span class="filter-tag">🔗 Nguồn: <strong>${escapeHtml(r.conditionLeadSource)}</strong></span>`);
            if (r.conditionMinScore) tags.push(`<span class="filter-tag">🔥 Điểm $\\ge$: <strong>${r.conditionMinScore}</strong></span>`);
            if (tags.length === 0) tags.push(`<span class="filter-tag">Toàn bộ Lead</span>`);

            // Target Info
            let targetHtml = "";
            if (r.targetType === "DIRECT_USER") {
                targetHtml = `<div><strong>Chỉ định trực tiếp:</strong> <span class="user-chip">👤 ${escapeHtml(r.assigneeUserName || 'Chưa chọn')}</span></div>`;
            } else {
                let chips = "";
                if (r.assigneeUserIds && r.assigneeUserIds.length > 0) {
                    r.assigneeUserIds.forEach(uid => {
                        const u = state.users.find(x => x.id === uid);
                        const name = u ? (u.fullName || u.name) : `User #${uid}`;
                        const isLast = (uid === r.lastAssignedUserId);
                        chips += `<span class="user-chip ${isLast ? 'last-assigned' : ''}" title="${isLast ? 'Vừa nhận lead lượt trước' : ''}">👤 ${escapeHtml(name)}${isLast ? ' ⭐' : ''}</span>`;
                    });
                }
                targetHtml = `
                    <div><strong>Xoay vòng đều (${(r.assigneeUserIds || []).length} người):</strong></div>
                    <div class="pool-chips">${chips || '<em>Chưa chọn nhân viên</em>'}</div>
                `;
            }

            const priorityClass = r.priority <= 4 ? `p-${r.priority}` : '';

            html += `
                <tr>
                    <td>
                        <span class="priority-badge ${priorityClass}">#${r.priority}</span>
                    </td>
                    <td>
                        <strong>${escapeHtml(r.name)}</strong>
                        ${r.description ? `<div class="card-desc">${escapeHtml(r.description)}</div>` : ''}
                    </td>
                    <td>
                        <div class="filter-tag-group">${tags.join("")}</div>
                    </td>
                    <td>${targetHtml}</td>
                    <td>
                        <span class="status-badge ${r.active ? 'active' : 'inactive'}">
                            ${r.active ? 'Đang chạy' : 'Đã tắt'}
                        </span>
                    </td>
                    <td style="text-align: right; white-space: nowrap;">
                        <button class="btn-icon-order" onclick="window.LeadRouting.movePriority(${idx}, -1)" title="Tăng ưu tiên (Lên)" ${idx === 0 ? 'disabled' : ''}>▲</button>
                        <button class="btn-icon-order" onclick="window.LeadRouting.movePriority(${idx}, 1)" title="Giảm ưu tiên (Xuống)" ${idx === state.rules.length - 1 ? 'disabled' : ''}>▼</button>
                        <button class="btn btn-sm btn-secondary" onclick="window.LeadRouting.editRule(${r.id})">Sửa</button>
                        <button class="btn btn-sm btn-danger" onclick="window.LeadRouting.deleteRule(${r.id})">Xóa</button>
                    </td>
                </tr>
            `;
        });

        elements.rulesTableBody.innerHTML = html;
    }

    async function movePriority(index, direction) {
        const newIndex = index + direction;
        if (newIndex < 0 || newIndex >= state.rules.length) return;

        // Swap in local array
        const temp = state.rules[index];
        state.rules[index] = state.rules[newIndex];
        state.rules[newIndex] = temp;

        const orderedIds = state.rules.map(r => r.id);
        try {
            const res = await fetch(`${API_BASE}/assignment/priorities`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(orderedIds),
                credentials: "include"
            });
            const json = await res.json();
            if (json.success) {
                await loadAssignmentRules();
            } else {
                alert("Lỗi: " + json.message);
            }
        } catch (e) {
            alert("Lỗi kết nối: " + e.message);
        }
    }

    function openRuleModal(rule = null) {
        elements.formAssignmentRule.reset();
        document.getElementById("ruleId").value = rule ? rule.id : "";
        document.getElementById("ruleModalTitle").textContent = rule ? "Chỉnh sửa quy tắc phân bổ" : "Thêm quy tắc phân bổ lead tự động";

        if (rule) {
            document.getElementById("ruleName").value = rule.name;
            document.getElementById("rulePriority").value = rule.priority;
            document.getElementById("ruleRegionId").value = rule.conditionRegionId || "";
            document.getElementById("ruleIndustryId").value = rule.conditionIndustryId || "";
            document.getElementById("ruleLeadSource").value = rule.conditionLeadSource || "";
            document.getElementById("ruleMinScore").value = rule.conditionMinScore || "";
            document.getElementById("ruleDescription").value = rule.description || "";
            document.getElementById("ruleActive").checked = rule.active;

            const radio = document.querySelector(`input[name="ruleTargetType"][value="${rule.targetType}"]`);
            if (radio) radio.checked = true;

            if (rule.targetType === "DIRECT_USER") {
                elements.groupDirectUser.style.display = "block";
                elements.groupRoundRobin.style.display = "none";
                elements.ruleAssigneeUserId.value = rule.assigneeUserId || "";
            } else {
                elements.groupDirectUser.style.display = "none";
                elements.groupRoundRobin.style.display = "block";
                const poolIds = rule.assigneeUserIds || [];
                document.querySelectorAll('input[name="poolUserId"]').forEach(cb => {
                    cb.checked = poolIds.includes(parseInt(cb.value));
                });
            }
        } else {
            document.getElementById("rulePriority").value = state.rules.length + 1;
            elements.groupDirectUser.style.display = "none";
            elements.groupRoundRobin.style.display = "block";
        }

        elements.modalRuleBackdrop.style.display = "flex";
    }

    function closeRuleModal() {
        elements.modalRuleBackdrop.style.display = "none";
    }

    async function handleRuleSubmit(e) {
        e.preventDefault();
        const id = document.getElementById("ruleId").value;
        const targetType = document.querySelector('input[name="ruleTargetType"]:checked').value;

        const payload = {
            name: document.getElementById("ruleName").value.trim(),
            priority: parseInt(document.getElementById("rulePriority").value) || 1,
            targetType: targetType,
            conditionRegionId: document.getElementById("ruleRegionId").value ? parseInt(document.getElementById("ruleRegionId").value) : null,
            conditionIndustryId: document.getElementById("ruleIndustryId").value ? parseInt(document.getElementById("ruleIndustryId").value) : null,
            conditionLeadSource: document.getElementById("ruleLeadSource").value ? document.getElementById("ruleLeadSource").value.trim() : null,
            conditionMinScore: document.getElementById("ruleMinScore").value ? parseInt(document.getElementById("ruleMinScore").value) : null,
            description: document.getElementById("ruleDescription").value.trim(),
            active: document.getElementById("ruleActive").checked
        };

        if (targetType === "DIRECT_USER") {
            const uid = document.getElementById("ruleAssigneeUserId").value;
            if (!uid) {
                alert("Vui lòng chọn nhân viên kinh doanh nhận lead!");
                return;
            }
            payload.assigneeUserId = parseInt(uid);
        } else {
            const selectedPool = [];
            document.querySelectorAll('input[name="poolUserId"]:checked').forEach(cb => {
                selectedPool.push(parseInt(cb.value));
            });
            if (selectedPool.length === 0) {
                alert("Vui lòng chọn ít nhất 1 nhân viên tham gia vòng xoay Round Robin!");
                return;
            }
            payload.assigneeUserIds = selectedPool;
        }

        try {
            const url = id ? `${API_BASE}/assignment/rules/${id}` : `${API_BASE}/assignment/rules`;
            const method = id ? "PUT" : "POST";
            const res = await fetch(url, {
                method: method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
                credentials: "include"
            });
            const json = await res.json();
            if (json.success) {
                closeRuleModal();
                await refreshAllData();
            } else {
                alert("Lỗi: " + json.message);
            }
        } catch (err) {
            alert("Lỗi: " + err.message);
        }
    }

    function editRule(id) {
        const rule = state.rules.find(r => r.id === id);
        if (rule) openRuleModal(rule);
    }

    async function deleteRule(id) {
        if (!confirm("Bạn có chắc chắn muốn xóa quy tắc phân bổ này?")) return;
        try {
            const res = await fetch(`${API_BASE}/assignment/rules/${id}`, { method: "DELETE", credentials: "include" });
            const json = await res.json();
            if (json.success) {
                await refreshAllData();
            } else {
                alert("Lỗi: " + json.message);
            }
        } catch (e) {
            alert("Lỗi: " + e.message);
        }
    }

    // =====================================================
    // TAB 2: UNASSIGNED LEADS QUEUE
    // =====================================================
    async function loadUnassignedLeads() {
        try {
            const res = await fetch(`${API_BASE}/assignment/unassigned`, { credentials: "include" });
            const json = await res.json();
            if (json.success) {
                state.unassigned = json.data || [];
                renderUnassignedTable();
            }
        } catch (e) {
            elements.unassignedTableBody.innerHTML = `<tr><td colspan="7" class="text-center text-red py-4">Lỗi: ${e.message}</td></tr>`;
        }
    }

    function renderUnassignedTable() {
        if (!state.unassigned || state.unassigned.length === 0) {
            elements.unassignedTableBody.innerHTML = `<tr><td colspan="7" class="text-center py-4">🎉 Tuyệt vời! Hiện không có lead nào bị tồn đọng trong hàng chờ.</td></tr>`;
            return;
        }

        let html = "";
        state.unassigned.forEach(lead => {
            const gradeClass = lead.scoreGrade || "COLD";
            html += `
                <tr>
                    <td>
                        <strong>${escapeHtml(lead.name)}</strong>
                        ${lead.company && lead.company !== lead.name ? `<div class="card-desc">${escapeHtml(lead.company)}</div>` : ''}
                    </td>
                    <td>
                        <div>📞 ${escapeHtml(lead.phone || '—')}</div>
                        ${lead.email ? `<div class="card-desc">✉️ ${escapeHtml(lead.email)}</div>` : ''}
                    </td>
                    <td>
                        <div>🏢 ${escapeHtml(lead.industryName || '—')}</div>
                        <div class="card-desc">📍 ${escapeHtml(lead.regionName || '—')}</div>
                    </td>
                    <td>
                        <span class="filter-tag">${escapeHtml(lead.leadSource || 'Chưa rõ')}</span>
                    </td>
                    <td>
                        <span class="grade-badge ${gradeClass}">
                            <span>${lead.scoreGradeIcon || '📋'}</span>
                            <span class="score-num">${lead.leadScore} đ</span>
                            <span>${escapeHtml(lead.scoreGradeLabel || gradeClass)}</span>
                        </span>
                    </td>
                    <td>${lead.createdAt ? formatDateTime(lead.createdAt) : '—'}</td>
                    <td style="text-align: right;">
                        <button class="btn btn-sm btn-primary" onclick="window.LeadRouting.openManualAssignModal(${lead.id})">
                            👉 Phân bổ ngay
                        </button>
                    </td>
                </tr>
            `;
        });

        elements.unassignedTableBody.innerHTML = html;
    }

    function openManualAssignModal(leadId) {
        const lead = state.unassigned.find(l => l.id === leadId);
        if (!lead) return;

        document.getElementById("manualLeadId").value = lead.id;
        document.getElementById("manualLeadPreview").innerHTML = `
            <strong>Khách hàng:</strong> ${escapeHtml(lead.name)}<br>
            <strong>Điện thoại:</strong> ${escapeHtml(lead.phone || '—')} | <strong>Email:</strong> ${escapeHtml(lead.email || '—')}<br>
            <strong>Điểm số:</strong> <span class="grade-badge ${lead.scoreGrade}">${lead.scoreGradeIcon} ${lead.leadScore} điểm (${lead.scoreGradeLabel})</span>
        `;
        document.getElementById("manualNotes").value = "";
        elements.manualTargetUserId.value = "";
        elements.modalManualAssignBackdrop.style.display = "flex";
    }

    function closeManualModal() {
        elements.modalManualAssignBackdrop.style.display = "none";
    }

    async function handleManualAssignSubmit(e) {
        e.preventDefault();
        const leadId = parseInt(document.getElementById("manualLeadId").value);
        const targetUserId = parseInt(elements.manualTargetUserId.value);
        const notes = document.getElementById("manualNotes").value.trim();

        if (!targetUserId) {
            alert("Vui lòng chọn chuyên viên kinh doanh tiếp nhận lead!");
            return;
        }

        try {
            const res = await fetch(`${API_BASE}/assignment/manual`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ leadId, targetUserId, notes }),
                credentials: "include"
            });
            const json = await res.json();
            if (json.success) {
                closeManualModal();
                alert("✅ Đã giao lead cho chuyên viên thành công!");
                await refreshAllData();
            } else {
                alert("Lỗi: " + json.message);
            }
        } catch (err) {
            alert("Lỗi: " + err.message);
        }
    }

    // =====================================================
    // TAB 3: SCORING SETTINGS & CRITERIA
    // =====================================================
    async function loadScoringSettings() {
        try {
            const [thRes, scRes] = await Promise.all([
                fetch(`${API_BASE}/scoring/thresholds`, { credentials: "include" }).then(r => r.json()),
                fetch(`${API_BASE}/scoring/rules`, { credentials: "include" }).then(r => r.json())
            ]);

            if (thRes.success) {
                state.thresholds = thRes.data || [];
                renderThresholds();
            }

            if (scRes.success) {
                state.criteria = scRes.data || [];
                renderScoringCriteria();
            }
        } catch (e) {
            console.error("Lỗi tải cấu hình chấm điểm:", e);
        }
    }

    function renderThresholds() {
        let html = "";
        state.thresholds.forEach(th => {
            html += `
                <div class="threshold-card" style="border-top: 4px solid ${th.color};">
                    <div class="threshold-header">
                        <span class="threshold-title">
                            <span>${th.icon}</span> ${escapeHtml(th.label)}
                        </span>
                        <span class="grade-badge ${th.grade}">${th.grade}</span>
                    </div>
                    <div class="threshold-range">
                        ${th.grade === 'HOT' ? `Điểm $\\ge$ ${th.minScore}` : th.grade === 'WARM' ? `Điểm ${th.minScore} - 69` : `Điểm < 40`}
                    </div>
                    <p class="threshold-desc">${escapeHtml(th.description || '')}</p>
                </div>
            `;
        });
        elements.thresholdsContainer.innerHTML = html;
    }

    function renderScoringCriteria() {
        if (!state.criteria || state.criteria.length === 0) {
            elements.scoringTableBody.innerHTML = `<tr><td colspan="6" class="text-center py-4">Chưa có tiêu chí nào.</td></tr>`;
            return;
        }

        const categoryNames = {
            "INDUSTRY": "Ngành nghề phù hợp",
            "COMPANY_SIZE": "Quy mô doanh nghiệp",
            "LEAD_SOURCE": "Nguồn Lead",
            "INTEREST_LEVEL": "Mức độ quan tâm",
            "REGION": "Khu vực địa lý"
        };

        let html = "";
        state.criteria.forEach(c => {
            const scoreColor = c.score > 0 ? '#16a34a' : '#dc2626';
            const scorePrefix = c.score > 0 ? `+${c.score}` : `${c.score}`;

            html += `
                <tr>
                    <td><strong>${categoryNames[c.category] || c.category}</strong></td>
                    <td><code>${escapeHtml(c.criterionKey)}</code></td>
                    <td>${escapeHtml(c.criterionName)}</td>
                    <td>
                        <strong style="color: ${scoreColor}; font-size: 1rem;">${scorePrefix} điểm</strong>
                    </td>
                    <td>
                        <span class="status-badge ${c.active ? 'active' : 'inactive'}">
                            ${c.active ? 'Đang áp dụng' : 'Tạm dừng'}
                        </span>
                    </td>
                    <td style="text-align: right;">
                        <button class="btn btn-sm btn-danger" onclick="window.LeadRouting.deleteCriterion(${c.id})">Xóa</button>
                    </td>
                </tr>
            `;
        });

        elements.scoringTableBody.innerHTML = html;
    }

    function openCriterionModal() {
        elements.formCriterion.reset();
        document.getElementById("criterionId").value = "";
        elements.modalCriterionBackdrop.style.display = "flex";
    }

    function closeCriterionModal() {
        elements.modalCriterionBackdrop.style.display = "none";
    }

    async function handleCriterionSubmit(e) {
        e.preventDefault();
        const payload = {
            category: document.getElementById("critCategory").value,
            criterionKey: document.getElementById("critKey").value.trim(),
            criterionName: document.getElementById("critName").value.trim(),
            score: parseInt(document.getElementById("critScore").value) || 0,
            active: document.getElementById("critActive").checked
        };

        try {
            const res = await fetch(`${API_BASE}/scoring/rules`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
                credentials: "include"
            });
            const json = await res.json();
            if (json.success) {
                closeCriterionModal();
                await loadScoringSettings();
                await loadOverviewStats();
            } else {
                alert("Lỗi: " + json.message);
            }
        } catch (err) {
            alert("Lỗi: " + err.message);
        }
    }

    async function deleteCriterion(id) {
        if (!confirm("Bạn có chắc chắn muốn xóa tiêu chí này?")) return;
        try {
            const res = await fetch(`${API_BASE}/scoring/rules/${id}`, { method: "DELETE", credentials: "include" });
            const json = await res.json();
            if (json.success) {
                await loadScoringSettings();
                await loadOverviewStats();
            } else {
                alert("Lỗi: " + json.message);
            }
        } catch (e) {
            alert("Lỗi: " + e.message);
        }
    }

    // =====================================================
    // TAB 4: AUDIT LOGS
    // =====================================================
    async function loadAuditLogs() {
        try {
            const res = await fetch(`${API_BASE}/assignment/logs?limit=50`, { credentials: "include" });
            const json = await res.json();
            if (json.success) {
                state.logs = json.data || [];
                renderAuditTable();
            }
        } catch (e) {
            elements.auditTableBody.innerHTML = `<tr><td colspan="6" class="text-center text-red py-4">Lỗi: ${e.message}</td></tr>`;
        }
    }

    function renderAuditTable() {
        if (!state.logs || state.logs.length === 0) {
            elements.auditTableBody.innerHTML = `<tr><td colspan="6" class="text-center py-4">Chưa có lịch sử phân bổ nào.</td></tr>`;
            return;
        }

        let html = "";
        state.logs.forEach(l => {
            let methodLabel = "Tự động (Round Robin)";
            if (l.method === "AUTO_RULE_DIRECT") methodLabel = "Tự động (Chỉ định)";
            if (l.method === "MANUAL_DISPATCH") methodLabel = "Trưởng nhóm phân tay";

            html += `
                <tr>
                    <td>${l.createdAt ? formatDateTime(l.createdAt) : '—'}</td>
                    <td><strong>${escapeHtml(l.leadName || 'Lead #' + l.leadId)}</strong></td>
                    <td><span class="user-chip">👤 ${escapeHtml(l.assignedToUserName || 'User #' + l.assignedToUserId)}</span></td>
                    <td><span class="filter-tag">${methodLabel}</span></td>
                    <td>${escapeHtml(l.ruleName || l.assignedByUserName || 'Hệ thống')}</td>
                    <td>${escapeHtml(l.notes || '—')}</td>
                </tr>
            `;
        });

        elements.auditTableBody.innerHTML = html;
    }

    // Helper functions
    function escapeHtml(str) {
        if (!str) return "";
        return String(str)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    function formatDateTime(dt) {
        if (!dt) return "";
        try {
            if (typeof dt === "object" && dt.year) {
                return `${dt.day}/${dt.month}/${dt.year} ${String(dt.hour || 0).padStart(2, '0')}:${String(dt.minute || 0).padStart(2, '0')}`;
            }
            const d = new Date(dt);
            return d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
        } catch (e) {
            return String(dt);
        }
    }

    // Expose global methods
    window.LeadRouting = {
        movePriority,
        editRule,
        deleteRule,
        openManualAssignModal,
        deleteCriterion
    };

})();
