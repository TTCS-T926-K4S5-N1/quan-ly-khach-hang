"use strict";

const API_BASE = "http://localhost:8080/crm";
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

let selectedFile = null;
let batchToken = null;
let previewRows = [];
let currentFilter = "all";
let currentStatusFilter = "all";
let currentSearch = "";

// DOM Elements
const fileInput = document.getElementById("importFile");
const dropArea = document.getElementById("dropArea");
const chooseButton = document.getElementById("chooseImportFile");
const selectedFileInfo = document.getElementById("selectedFileInfo");
const selectedFileName = document.getElementById("selectedFileName");
const selectedFileSize = document.getElementById("selectedFileSize");
const reselectFileButton = document.getElementById("reselectFile");
const removeFileButton = document.getElementById("removeSelectedFile");

const previewSection = document.getElementById("previewSection");
const previewBody = document.getElementById("previewBody");
const previewSummary = document.getElementById("previewSummary");
const importResult = document.getElementById("importResult");
const confirmButton = document.getElementById("confirmImport");
const exportErrorsButton = document.getElementById("exportErrorsButton");

const downloadValidButton = document.getElementById("downloadValidTemplate");
const downloadInvalidButton = document.getElementById("downloadInvalidTemplate");
const loadValidDemoButton = document.getElementById("loadValidDemo");
const loadInvalidDemoButton = document.getElementById("loadInvalidDemo");

/* =========================================================
   INITIALIZATION
========================================================= */
function safeInit() {
    bindEvents();
    updateStepper(1);
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", safeInit);
} else {
    safeInit();
}

function bindEvents() {
    // Template downloads
    downloadValidButton?.addEventListener("click", () => downloadTemplate("valid"));
    downloadInvalidButton?.addEventListener("click", () => downloadTemplate("invalid"));

    // Quick sandbox demo buttons
    loadValidDemoButton?.addEventListener("click", loadValidDemoData);
    loadInvalidDemoButton?.addEventListener("click", loadInvalidDemoData);

    // File selection
    chooseButton?.addEventListener("click", () => fileInput?.click());
    reselectFileButton?.addEventListener("click", () => fileInput?.click());
    removeFileButton?.addEventListener("click", clearSelectedFile);

    fileInput?.addEventListener("change", () => {
        const file = fileInput.files?.[0];
        if (file) handleFile(file);
    });

    // Drag and drop
    ["dragenter", "dragover"].forEach(type => {
        dropArea?.addEventListener(type, event => {
            event.preventDefault();
            dropArea.classList.add("drag");
        });
    });

    ["dragleave", "drop"].forEach(type => {
        dropArea?.addEventListener(type, event => {
            event.preventDefault();
            dropArea.classList.remove("drag");
        });
    });

    dropArea?.addEventListener("drop", event => {
        const file = event.dataTransfer?.files?.[0];
        if (file) handleFile(file);
    });

    // Commit import
    confirmButton?.addEventListener("click", confirmImport);

    // Export errors
    exportErrorsButton?.addEventListener("click", exportErrorsToCsv);

    // Filter tabs
    document.querySelectorAll(".preview-filter-tabs .tab-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            document.querySelectorAll(".preview-filter-tabs .tab-btn").forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            currentFilter = btn.dataset.filter || "all";
            renderPreviewTable();
        });
    });

    // Status filter dropdown
    const statusSelect = document.getElementById("previewStatusFilter");
    statusSelect?.addEventListener("change", event => {
        currentStatusFilter = event.target.value || "all";
        renderPreviewTable();
    });

    // Table search - handle input, search (browser clear 'x'), and keyup
    const searchInput = document.getElementById("previewSearchInput");
    const onSearchChange = event => {
        currentSearch = (event.target.value || "").trim();
        renderPreviewTable();
    };
    searchInput?.addEventListener("input", onSearchChange);
    searchInput?.addEventListener("search", onSearchChange);
    searchInput?.addEventListener("keyup", onSearchChange);

    // Clear search button
    const clearSearchBtn = document.getElementById("clearSearchBtn");
    clearSearchBtn?.addEventListener("click", () => {
        if (searchInput) {
            searchInput.value = "";
            searchInput.focus();
        }
        currentSearch = "";
        renderPreviewTable();
    });

    // Reset all filters button
    const resetFilterBtn = document.getElementById("resetFilterBtn");
    resetFilterBtn?.addEventListener("click", () => resetAllFilters());
}

/* =========================================================
   STEPPER WIZARD UPDATE
========================================================= */
function updateStepper(activeStep) {
    document.querySelectorAll(".import-stepper .step-item").forEach(item => {
        const step = Number(item.dataset.step);
        item.classList.remove("active", "completed");
        if (step === activeStep) {
            item.classList.add("active");
        } else if (step < activeStep) {
            item.classList.add("completed");
        }
    });
}

/* =========================================================
   DOWNLOAD TEMPLATES
========================================================= */
async function downloadTemplate(type = "valid") {
    const isInvalid = type === "invalid";
    const filename = isInvalid ? "mau_kiem_thu_nguoi_dung_co_loi.xlsx" : "mau_nguoi_dung_hop_le.xlsx";

    showBanner(`Đang khởi tạo file mẫu ${isInvalid ? "kiểm thử có lỗi" : "chuẩn hợp lệ"}...`, "info");

    try {
        const response = await fetch(`${API_BASE}/api/users/import/template?type=${type}`, {
            method: "GET",
            credentials: "include"
        });

        if (response.status === 401) {
            window.location.href = "login";
            return;
        }

        if (!response.ok) {
            throw new Error("Không thể tải file mẫu từ máy chủ.");
        }

        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(url);

        showBanner(`✓ Đã tải xuống thành công file: ${filename}`, "success");
        updateStepper(1);
    } catch (error) {
        console.error("Download template error:", error);
        showBanner(`Lỗi khi tải file mẫu: ${error.message}`, "error");
    }
}

/* =========================================================
   HANDLE FILE SELECTION
========================================================= */
async function handleFile(file) {
    const extension = file.name.split(".").pop()?.toLowerCase();
    if (extension !== "xlsx") {
        showBanner("Chỉ chấp nhận file định dạng Microsoft Excel (.xlsx)", "error");
        clearFileInput();
        return;
    }

    if (file.size <= 0) {
        showBanner("File không có dữ liệu (kích thước 0 bytes)", "error");
        clearFileInput();
        return;
    }

    if (file.size > MAX_FILE_SIZE) {
        showBanner("Kích thước file vượt quá dung lượng tối đa cho phép (5 MB)", "error");
        clearFileInput();
        return;
    }

    selectedFile = file;

    // Show selected file card
    if (selectedFileInfo) {
        selectedFileInfo.hidden = false;
        if (selectedFileName) selectedFileName.textContent = file.name;
        if (selectedFileSize) selectedFileSize.textContent = `${(file.size / 1024).toFixed(1)} KB · Sẵn sàng đối soát`;
    }

    updateStepper(2);
    await uploadAndPreview();
}

function clearSelectedFile() {
    selectedFile = null;
    batchToken = null;
    previewRows = [];
    resetAllFilters(false);
    clearFileInput();

    if (selectedFileInfo) selectedFileInfo.hidden = true;
    if (previewSection) previewSection.hidden = true;
    if (importResult) importResult.hidden = true;

    updateStepper(1);
}

function clearFileInput() {
    if (fileInput) fileInput.value = "";
}

/* =========================================================
   UPLOAD & PREVIEW API CALL
========================================================= */
async function uploadAndPreview() {
    if (!selectedFile) return;

    showBanner("Đang phân tích cấu trúc và kiểm tra tính hợp lệ của từng dòng...", "info");
    updateStepper(3);

    try {
        const formData = new FormData();
        formData.append("file", selectedFile);

        const response = await fetch(`${API_BASE}/api/users/import/preview`, {
            method: "POST",
            credentials: "include",
            body: formData
        });

        const result = await response.json();
        if (!response.ok || !result?.success) {
            throw new Error(result?.message || `HTTP ${response.status}`);
        }

        const data = result.data || {};
        batchToken = data.batchToken || null;

        const validRows = (data.validRows || []).map(r => ({ ...r, valid: true, error: "" }));
        const errorRows = (data.errorRows || []).map(r => ({ ...r, valid: false, error: r.error || "Dữ liệu không hợp lệ" }));

        previewRows = [...validRows, ...errorRows].sort((a, b) => Number(a.row) - Number(b.row));

        resetAllFilters(false);
        setupPreviewDashboard(validRows.length, errorRows.length);
        renderPreviewTable();

        showBanner(`✓ Hoàn tất đối soát: ${previewRows.length} dòng dữ liệu (${validRows.length} hợp lệ, ${errorRows.length} có lỗi).`, "success");
    } catch (error) {
        console.error("Preview error:", error);
        batchToken = null;
        previewRows = [];
        if (previewSection) previewSection.hidden = true;
        showBanner(`Lỗi kiểm tra file: ${error.message}`, "error");
    }
}

/* =========================================================
   INTERACTIVE SANDBOX DEMO LOADERS
========================================================= */
function loadValidDemoData() {
    selectedFile = null;
    clearFileInput();
    if (selectedFileInfo) {
        selectedFileInfo.hidden = false;
        if (selectedFileName) selectedFileName.textContent = "mau_nguoi_dung_hop_le_demo.xlsx";
        if (selectedFileSize) selectedFileSize.textContent = "3.8 KB (Dữ liệu thử nghiệm hợp lệ)";
    }

    batchToken = "demo-valid-token-" + Date.now();
    previewRows = [
        { row: 2, fullName: "Nguyễn Văn An", email: "nguyenvanan.sales@company.com", status: "ACTIVE", valid: true, error: "" },
        { row: 3, fullName: "Trần Thị Bích", email: "tranthibich.sales@company.com", status: "ACTIVE", valid: true, error: "" },
        { row: 4, fullName: "Lê Hoàng Cường", email: "lehoangcuong.tech@company.com", status: "ACTIVE", valid: true, error: "" },
        { row: 5, fullName: "Phạm Thu Dung", email: "phamthudung.crm@company.com", status: "ACTIVE", valid: true, error: "" },
        { row: 6, fullName: "Vũ Minh Đức", email: "vuminhduc.leads@company.com", status: "INACTIVE", valid: true, error: "" }
    ];

    resetAllFilters(false);
    setupPreviewDashboard(5, 0);
    renderPreviewTable();
    updateStepper(3);
    showBanner("✨ Đã nạp thành công 5 dòng dữ liệu mẫu HỢP LỆ chuẩn để kiểm thử giao diện.", "success");
}

function loadInvalidDemoData() {
    selectedFile = null;
    clearFileInput();
    if (selectedFileInfo) {
        selectedFileInfo.hidden = false;
        if (selectedFileName) selectedFileName.textContent = "mau_kiem_thu_co_loi_demo.xlsx";
        if (selectedFileSize) selectedFileSize.textContent = "4.0 KB (Dữ liệu kiểm thử lỗi mẫu)";
    }

    batchToken = "demo-invalid-token-" + Date.now();
    previewRows = [
        { row: 2, fullName: "Nguyễn Văn Hợp Lệ", email: "user.hople@company.com", status: "ACTIVE", valid: true, error: "" },
        { row: 3, fullName: "", email: "thieuten@company.com", status: "ACTIVE", valid: false, error: "Thiếu họ và tên (fullName)" },
        { row: 4, fullName: "Trần Văn Sai Email", email: "email_khong_hop_le", status: "ACTIVE", valid: false, error: "Email sai định dạng (thiếu @ và domain)" },
        { row: 5, fullName: "Lê Trùng Lặp 1", email: "duplicate.email@company.com", status: "ACTIVE", valid: true, error: "" },
        { row: 6, fullName: "Lê Trùng Lặp 2", email: "duplicate.email@company.com", status: "ACTIVE", valid: false, error: "Email bị trùng lặp trong file" },
        { row: 7, fullName: "Tài Khoản Đã Tồn Tại", email: "admin@company.com", status: "ACTIVE", valid: false, error: "Email đã tồn tại trong hệ thống" },
        { row: 8, fullName: "Hoàng Mật Khẩu Yếu", email: "matkhauyeu@company.com", status: "ACTIVE", valid: false, error: "Mật khẩu không đạt chính sách bảo mật (quá ngắn hoặc thiếu ký tự)" },
        { row: 9, fullName: "Vũ Trạng Thái Sai", email: "trangthaisai@company.com", status: "PENDING", valid: false, error: "Trạng thái không hợp lệ (chỉ nhận ACTIVE / INACTIVE)" }
    ];

    resetAllFilters(false);
    setupPreviewDashboard(2, 6);
    renderPreviewTable();
    updateStepper(3);
    showBanner("⚡ Đã nạp thành công dữ liệu mẫu KIỂM THỬ LỖI với đầy đủ các trường hợp vi phạm quy chuẩn.", "error");
}

/* =========================================================
   PREVIEW DASHBOARD SETUP
========================================================= */
function setupPreviewDashboard(validCount, errorCount) {
    if (!previewSection) return;
    previewSection.hidden = false;

    const total = validCount + errorCount;
    const rate = total > 0 ? Math.round((validCount / total) * 100) : 0;

    // KPI Counters
    setText("kpiTotal", total);
    setText("kpiValid", validCount);
    setText("kpiError", errorCount);
    setText("kpiRate", `${rate}%`);

    // Tab counts
    setText("tabCountAll", total);
    setText("tabCountValid", validCount);
    setText("tabCountError", errorCount);

    if (previewSummary) {
        previewSummary.textContent = `Tổng cộng ${total} dòng · ${validCount} dòng hợp lệ (${rate}%) · ${errorCount} dòng có lỗi cần đối soát.`;
    }

    if (confirmButton) {
        confirmButton.disabled = validCount === 0;
        confirmButton.textContent = validCount > 0 ? `✓ Xác nhận nhập ${validCount} dòng hợp lệ` : "Không có dòng hợp lệ để nhập";
    }

    if (exportErrorsButton) {
        exportErrorsButton.hidden = errorCount === 0;
    }
}

/* =========================================================
   VIETNAMESE ACCENT REMOVAL & SEARCH NORMALIZATION
========================================================= */
function removeVietnameseTones(str) {
    if (!str) return "";
    str = String(str);
    str = str.replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g, "a");
    str = str.replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g, "e");
    str = str.replace(/ì|í|ị|ỉ|ĩ/g, "i");
    str = str.replace(/ò|ó|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g, "o");
    str = str.replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g, "u");
    str = str.replace(/ỳ|ý|ỵ|ỷ|ỹ/g, "y");
    str = str.replace(/đ/g, "d");
    str = str.replace(/À|Á|Ạ|Ả|Ã|Â|Ầ|Ấ|Ậ|Ẩ|Ẫ|Ă|Ằ|Ắ|Ặ|Ẳ|Ẵ/g, "a");
    str = str.replace(/È|É|Ẹ|Ẻ|Ẽ|Ê|Ề|Ế|Ệ|Ể|Ễ/g, "e");
    str = str.replace(/Ì|Í|Ị|Ỉ|Ĩ/g, "i");
    str = str.replace(/Ò|Ó|Ọ|Ỏ|Õ|Ô|Ồ|Ố|Ộ|Ổ|Ỗ|Ơ|Ờ|Ớ|Ợ|Ở|Ỡ/g, "o");
    str = str.replace(/Ù|Ú|Ụ|Ủ|Ũ|Ư|Ừ|Ứ|Ự|Ử|Ữ/g, "u");
    str = str.replace(/Ỳ|Ý|Ỵ|Ỷ|Ỹ/g, "y");
    str = str.replace(/Đ/g, "d");
    return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

function updateFilterUiState(filteredCount, totalCount) {
    const badge = document.getElementById("filterResultBadge");
    if (badge) {
        badge.textContent = `Hiển thị ${filteredCount} / ${totalCount} dòng`;
        if (totalCount > 0 && filteredCount < totalCount) {
            badge.style.background = "#dbeafe";
            badge.style.color = "#1d4ed8";
            badge.style.border = "1px solid #93c5fd";
        } else {
            badge.style.background = "#e2e8f0";
            badge.style.color = "#475569";
            badge.style.border = "1px solid transparent";
        }
    }

    const clearSearchBtn = document.getElementById("clearSearchBtn");
    if (clearSearchBtn) {
        clearSearchBtn.hidden = !currentSearch;
    }

    const isFiltered = currentFilter !== "all" || currentStatusFilter !== "all" || Boolean(currentSearch);
    const resetBtn = document.getElementById("resetFilterBtn");
    if (resetBtn) {
        resetBtn.hidden = !isFiltered;
    }
}

function resetAllFilters(shouldRender = true) {
    currentFilter = "all";
    currentStatusFilter = "all";
    currentSearch = "";

    const searchInput = document.getElementById("previewSearchInput");
    if (searchInput) searchInput.value = "";

    const statusSelect = document.getElementById("previewStatusFilter");
    if (statusSelect) statusSelect.value = "all";

    document.querySelectorAll(".preview-filter-tabs .tab-btn").forEach(btn => {
        if (btn.dataset.filter === "all") {
            btn.classList.add("active");
        } else {
            btn.classList.remove("active");
        }
    });

    if (shouldRender) {
        renderPreviewTable();
    }
}

/* =========================================================
   RENDER PREVIEW TABLE
========================================================= */
function renderPreviewTable() {
    if (!previewBody) return;
    previewBody.innerHTML = "";

    const query = currentSearch.trim();
    const queryLower = query.toLowerCase();
    const queryNoTone = removeVietnameseTones(query);

    const filtered = previewRows.filter(row => {
        // 1. Tab filter (valid / error / all)
        if (currentFilter === "valid" && !row.valid) return false;
        if (currentFilter === "error" && row.valid) return false;

        // 2. Status filter
        if (currentStatusFilter !== "all") {
            const rowStatus = String(row.status || "").toUpperCase();
            if (rowStatus !== currentStatusFilter) return false;
        }

        // 3. Search query filter
        if (query) {
            const nameRaw = String(row.fullName || "");
            const nameLower = nameRaw.toLowerCase();
            const nameNoTone = removeVietnameseTones(nameRaw);
            const nameWords = nameNoTone.split(/\s+/).filter(Boolean);

            // Name matching:
            // - If query has space: substring of full name
            // - If single word: any word in name starts with query or equals query
            // - Also check raw name with accents
            const matchName =
                nameLower.includes(queryLower) ||
                (queryNoTone.includes(" ")
                    ? nameNoTone.includes(queryNoTone)
                    : nameWords.some(w => w.startsWith(queryNoTone) || w === queryNoTone));

            // Email matching:
            // Match username part before '@' (don't match common @company.com unless query has '@')
            const fullEmail = String(row.email || "").toLowerCase();
            const emailUser = fullEmail.split("@")[0] || "";
            const emailParts = emailUser.split(/[._\-]/).filter(Boolean);

            const matchEmail = query.includes("@")
                ? fullEmail.includes(queryLower)
                : (query.length <= 2
                    ? (emailUser.startsWith(queryLower) || emailParts.some(p => p.startsWith(queryLower)))
                    : emailUser.includes(queryLower));

            // Status matching: exact for active/inactive or vietnamese equivalent
            const status = String(row.status || "").toLowerCase();
            const matchStatus =
                (queryLower === "active" && status === "active") ||
                (queryLower === "inactive" && status === "inactive") ||
                (queryNoTone === "hoat dong" && status === "active") ||
                (queryNoTone === "ngung hoat dong" && status === "inactive");

            // Row number matching:
            const matchRow =
                query === String(row.row) ||
                query === `#${row.row}` ||
                queryNoTone === `dong ${row.row}` ||
                queryLower === `dòng ${row.row}`;

            // Error matching:
            const errorText = String(row.error || "").toLowerCase();
            const errorNoTone = removeVietnameseTones(row.error || "");
            const matchError = errorText.includes(queryLower) || errorNoTone.includes(queryNoTone);

            // Validation status keyword:
            const matchValid =
                (queryNoTone === "hop le" || queryNoTone === "hople") ? row.valid :
                ((queryNoTone === "loi" || queryNoTone === "co loi") ? !row.valid : false);

            if (!matchName && !matchEmail && !matchStatus && !matchRow && !matchError && !matchValid) {
                return false;
            }
        }

        return true;
    });

    updateFilterUiState(filtered.length, previewRows.length);

    if (filtered.length === 0) {
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td colspan="6" style="text-align:center;padding:36px 20px;color:#64748b;">
                <div style="font-size:26px;margin-bottom:8px;">🔍</div>
                <strong style="display:block;font-size:14px;color:#0f172a;margin-bottom:4px;">Không có dòng dữ liệu nào khớp với bộ lọc</strong>
                <span style="font-size:12px;color:#64748b;">
                    Thử đổi từ khóa tìm kiếm hoặc bấm <button type="button" id="inlineResetFilter" style="background:none;border:none;color:#2563eb;text-decoration:underline;cursor:pointer;font-size:12px;font-weight:600;padding:0;">Bỏ lọc</button> để xem lại toàn bộ danh sách.
                </span>
            </td>
        `;
        previewBody.appendChild(tr);
        document.getElementById("inlineResetFilter")?.addEventListener("click", () => resetAllFilters());
        return;
    }

    filtered.forEach(row => {
        const tr = document.createElement("tr");
        tr.className = row.valid ? "row-valid" : "row-error";

        const hasNameError = !row.valid && String(row.error || "").toLowerCase().includes("fullname");
        const hasEmailError = !row.valid && (String(row.error || "").toLowerCase().includes("email") || String(row.error || "").toLowerCase().includes("trùng"));
        const hasPassError = !row.valid && String(row.error || "").toLowerCase().includes("password");
        const hasStatusError = !row.valid && String(row.error || "").toLowerCase().includes("status");

        tr.innerHTML = `
            <td style="font-weight:700;color:#64748b;">#${row.row}</td>
            <td>
                ${row.fullName ? escapeHtml(row.fullName) : '<span class="cell-missing-tag">Thiếu họ tên</span>'}
            </td>
            <td class="${hasEmailError ? 'cell-error-highlight' : ''}">
                ${escapeHtml(row.email || "—")}
            </td>
            <td>
                <span class="cell-password-masked ${hasPassError ? 'cell-error-highlight' : ''}">••••••••</span>
            </td>
            <td>
                <span style="font-weight:600;color:${row.status === 'ACTIVE' ? '#059669' : (row.status === 'INACTIVE' ? '#64748b' : '#dc2626')};">
                    ${escapeHtml(row.status || "—")}
                </span>
            </td>
            <td>
                ${
                    row.valid
                    ? '<span class="badge-valid">✓ Hợp lệ</span>'
                    : `<span class="badge-error">⚠️ ${escapeHtml(row.error)}</span>`
                }
            </td>
        `;

        previewBody.appendChild(tr);
    });
}

/* =========================================================
   COMMIT IMPORT
========================================================= */
async function confirmImport() {
    if (!batchToken) {
        showBanner("Không tìm thấy phiên nhập dữ liệu hợp lệ.", "error");
        return;
    }

    // If demo mode
    if (batchToken.startsWith("demo-")) {
        updateStepper(4);
        const validCount = previewRows.filter(r => r.valid).length;
        showBanner(`🎉 [MÔ PHỎNG THỬ NGHIỆM THÀNH CÔNG] Đã nhập thành công ${validCount} người dùng vào hệ thống!`, "success");
        if (confirmButton) confirmButton.disabled = true;
        return;
    }

    confirmButton.disabled = true;
    confirmButton.textContent = "Đang tiến hành nhập dữ liệu...";
    showBanner("Đang lưu người dùng vào cơ sở dữ liệu...", "info");

    try {
        const response = await fetch(`${API_BASE}/api/users/import/confirm`, {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ batchToken })
        });

        const result = await response.json();
        if (!response.ok || !result?.success) {
            throw new Error(result?.message || `HTTP ${response.status}`);
        }

        const data = result.data || {};
        updateStepper(4);

        const successMessage = `🎉 Hoàn tất nhập dữ liệu! Đã tạo mới thành công ${data.created || 0} tài khoản người dùng.${data.skipped ? ` Bỏ qua ${data.skipped} tài khoản bị trùng lặp.` : ""}`;
        showBanner(successMessage, "success");

        confirmButton.textContent = "✓ Đã hoàn tất nhập";
    } catch (error) {
        console.error("Confirm import error:", error);
        confirmButton.disabled = false;
        confirmButton.textContent = "✓ Thử nhập lại";
        showBanner(`Lỗi khi nhập dữ liệu: ${error.message}`, "error");
    }
}

/* =========================================================
   EXPORT ERRORS TO CSV
========================================================= */
function exportErrorsToCsv() {
    const errorRows = previewRows.filter(r => !r.valid);
    if (!errorRows.length) return;

    let csv = "\uFEFFDòng,Họ và tên,Email,Trạng thái,Mô tả lỗi\n";
    errorRows.forEach(r => {
        csv += `"${r.row}","${escapeCsv(r.fullName)}","${escapeCsv(r.email)}","${escapeCsv(r.status)}","${escapeCsv(r.error)}"\n`;
    });

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `danh_sach_dong_loi_import_${Date.now()}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
}

/* =========================================================
   UI HELPERS
========================================================= */
function showBanner(message, type = "info") {
    if (!importResult) return;
    importResult.hidden = false;
    importResult.className = `import-result-banner ${type}`;
    importResult.innerHTML = `
        <span>${escapeHtml(message)}</span>
        ${type === 'success' ? '<a href="users" class="crm-btn crm-btn-secondary crm-btn-sm" style="text-decoration:none;margin-left:12px;">Xem danh sách người dùng →</a>' : ''}
    `;
}

function setText(id, text) {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
}

function escapeHtml(val) {
    return String(val ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function escapeCsv(val) {
    return String(val ?? "").replace(/"/g, '""');
}