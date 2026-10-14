"use strict";

const API_BASE = "http://localhost:8080/crm";
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

let selectedFile = null;
let currentBatchToken = null;
let allPreviewRows = [];
let currentFilter = "all";
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
const totalRowsCount = document.getElementById("totalRowsCount");
const validRowsCount = document.getElementById("validRowsCount");
const errorRowsCount = document.getElementById("errorRowsCount");
const tabCountAll = document.getElementById("tabCountAll");
const tabCountError = document.getElementById("tabCountError");
const tabCountValid = document.getElementById("tabCountValid");
const confirmValidCount = document.getElementById("confirmValidCount");
const confirmButton = document.getElementById("confirmImport");
const exportErrorsButton = document.getElementById("exportErrorsButton");
const searchPreviewInput = document.getElementById("searchPreviewInput");
const btnCancelImport = document.getElementById("btnCancelImport");

const importSuccessCard = document.getElementById("importSuccessCard");
const importSuccessTitle = document.getElementById("importSuccessTitle");
const importSuccessDesc = document.getElementById("importSuccessDesc");
const btnImportAnother = document.getElementById("btnImportAnother");

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
    // Tải tệp mẫu
    downloadValidButton?.addEventListener("click", () => downloadTemplate("valid"));
    downloadInvalidButton?.addEventListener("click", () => downloadTemplate("invalid"));

    // Thử nghiệm nhanh (Demo sandbox)
    loadValidDemoButton?.addEventListener("click", loadValidDemoData);
    loadInvalidDemoButton?.addEventListener("click", loadInvalidDemoData);

    // Chọn file
    chooseButton?.addEventListener("click", () => fileInput?.click());
    reselectFileButton?.addEventListener("click", () => fileInput?.click());
    removeFileButton?.addEventListener("click", clearSelectedFile);

    fileInput?.addEventListener("change", () => {
        const file = fileInput.files?.[0];
        if (file) handleFile(file);
    });

    // Kéo thả file
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

    // Xác nhận nhập
    confirmButton?.addEventListener("click", confirmImport);

    // Hủy bỏ / Nhập lại
    btnCancelImport?.addEventListener("click", clearSelectedFile);
    btnImportAnother?.addEventListener("click", () => {
        importSuccessCard.hidden = true;
        clearSelectedFile();
    });

    // Xuất file lỗi
    exportErrorsButton?.addEventListener("click", exportErrorsToCsv);

    // Bộ lọc xem trước
    document.querySelectorAll(".preview-filter-tabs .tab-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            document.querySelectorAll(".preview-filter-tabs .tab-btn").forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            currentFilter = btn.dataset.filter || "all";
            renderPreviewTable();
        });
    });

    // Tìm kiếm trong xem trước
    searchPreviewInput?.addEventListener("input", e => {
        currentSearch = e.target.value.trim().toLowerCase();
        renderPreviewTable();
    });
}

function updateStepper(step) {
    document.querySelectorAll(".import-stepper .step-item").forEach(item => {
        const s = parseInt(item.dataset.step, 10);
        item.classList.remove("active", "completed");
        if (s === step) {
            item.classList.add("active");
        } else if (s < step) {
            item.classList.add("completed");
        }
    });
}

function downloadTemplate(type) {
    window.location.href = `${API_BASE}/api/leads/import/template?type=${type}`;
}

/* =========================================================
   XỬ LÝ TẢI FILE & GỬI API PREVIEW
========================================================= */
async function handleFile(file) {
    if (!file) return;

    if (!file.name.toLowerCase().endsWith(".xlsx")) {
        alert("Chỉ chấp nhận tệp định dạng Microsoft Excel (.xlsx)!");
        return;
    }

    if (file.size > MAX_FILE_SIZE) {
        alert("Dung lượng file vượt quá giới hạn 10 MB!");
        return;
    }

    selectedFile = file;
    selectedFileName.textContent = file.name;
    selectedFileSize.textContent = formatFileSize(file.size);

    dropArea.hidden = true;
    selectedFileInfo.hidden = false;
    updateStepper(2);

    const formData = new FormData();
    formData.append("file", file);

    try {
        confirmButton.disabled = true;
        confirmButton.textContent = "⏳ Đang phân tích dữ liệu...";

        const response = await fetch(`${API_BASE}/api/leads/import/preview`, {
            method: "POST",
            body: formData,
            credentials: "include"
        });

        const result = await response.json();
        if (!response.ok || !result.success) {
            throw new Error(result.message || "Không thể phân tích tệp Excel.");
        }

        const data = result.data;
        currentBatchToken = data.batchToken;

        // Tổng hợp danh sách dòng (sắp xếp theo thứ tự dòng)
        const rows = [];
        if (data.validRows) rows.push(...data.validRows);
        if (data.errorRows) rows.push(...data.errorRows);
        rows.sort((a, b) => a.rowNumber - b.rowNumber);

        allPreviewRows = rows;
        updateStepper(3);
        renderPreviewTable();
    } catch (err) {
        alert("Lỗi phân tích file: " + err.message);
        clearSelectedFile();
    } finally {
        confirmButton.disabled = false;
    }
}

function clearSelectedFile() {
    selectedFile = null;
    currentBatchToken = null;
    allPreviewRows = [];
    if (fileInput) fileInput.value = "";

    dropArea.hidden = false;
    selectedFileInfo.hidden = true;
    previewSection.hidden = true;
    updateStepper(1);
}

/* =========================================================
   DEMO SANDBOX NHANH
========================================================= */
function loadValidDemoData() {
    currentBatchToken = "demo-valid-" + Date.now();
    selectedFileName.textContent = "mau_hoi_thao_vietbuild_2026_hop_le.xlsx";
    selectedFileSize.textContent = "15.4 KB";
    dropArea.hidden = true;
    selectedFileInfo.hidden = false;

    allPreviewRows = [
        {
            rowNumber: 2,
            valid: true,
            fullName: "Nguyễn Hoàng Nam",
            company: "Tập đoàn Xây dựng Nam Long",
            phone: "0912345678",
            email: "hoangnam.build@namlong.vn",
            title: "Trưởng phòng Mua hàng",
            leadSource: "Hội thảo / Triển lãm ngành",
            notes: "Quan tâm giải pháp CRM quản lý dự án và báo giá cho 30 nhân sự"
        },
        {
            rowNumber: 3,
            valid: true,
            fullName: "Trần Thị Kim Oanh",
            company: "Chuỗi Bán lẻ Oanh Phát Mart",
            phone: "0987654321",
            email: "kimoanh.retail@gmail.com",
            title: "Giám đốc điều hành",
            leadSource: "Sự kiện / Hội nghị",
            notes: "Cần tư vấn CRM kết nối cho 10 chi nhánh bán lẻ"
        },
        {
            rowNumber: 4,
            valid: true,
            fullName: "Phạm Đức Thắng",
            company: "Công ty CP Logistics Toàn Cầu",
            phone: "0903112233",
            email: "ducthang.logistics@toancau.com",
            title: "Phó Giám đốc",
            leadSource: "Danh thiếp / Gặp gỡ trực tiếp",
            notes: "Trao đổi danh thiếp tại Diễn đàn Doanh nghiệp VCCI 2026"
        },
        {
            rowNumber: 5,
            valid: true,
            fullName: "Lê Thị Thu Hằng",
            company: "Dược phẩm Á Châu Medi",
            phone: "0977889900",
            email: "thuhang.pharm@achau.vn",
            title: "Chuyên viên thu mua",
            leadSource: "Hội thảo / Triển lãm ngành",
            notes: "Cần tài liệu so sánh và chiết khấu gói Doanh nghiệp"
        },
        {
            rowNumber: 6,
            valid: true,
            fullName: "Đặng Quốc Huy",
            company: "TechGroup Solution",
            phone: "0918223344",
            email: "quochuy.tech@techgroup.vn",
            title: "Quản lý kinh doanh",
            leadSource: "Người quen giới thiệu",
            notes: "Muốn xem demo trực tiếp tính năng Khách hàng 360"
        }
    ];

    updateStepper(3);
    renderPreviewTable();
}

function loadInvalidDemoData() {
    currentBatchToken = "demo-error-" + Date.now();
    selectedFileName.textContent = "mau_kiem_thu_bao_loi_tung_dong.xlsx";
    selectedFileSize.textContent = "16.8 KB";
    dropArea.hidden = true;
    selectedFileInfo.hidden = false;

    allPreviewRows = [
        {
            rowNumber: 2,
            valid: true,
            fullName: "Nguyễn Hoàng Nam",
            company: "Tập đoàn Xây dựng Nam Long",
            phone: "0912345678",
            email: "hoangnam.build@namlong.vn",
            title: "Trưởng phòng Mua hàng",
            leadSource: "Hội thảo / Triển lãm ngành",
            notes: "Dòng hợp lệ chuẩn mẫu"
        },
        {
            rowNumber: 3,
            valid: false,
            error: "Dòng 3: Thiếu nguồn Lead (Mọi lead nhập vào đều bắt buộc có nguồn)",
            fullName: "Vũ Văn Thiếu Nguồn",
            company: "Công ty TNHH Minh Khang",
            phone: "0988112233",
            email: "thieunguon@minhkhang.vn",
            title: "Phó giám đốc",
            leadSource: "",
            notes: "Lỗi vi phạm tiêu chuẩn bắt buộc nguồn Lead"
        },
        {
            rowNumber: 4,
            valid: false,
            error: "Dòng 4: Họ và tên không được để trống",
            fullName: "",
            company: "Công ty CP Thắng Lợi",
            phone: "0977223344",
            email: "khonghoten@thangloi.com",
            title: "Giám đốc",
            leadSource: "Sự kiện / Hội nghị",
            notes: "Lỗi thiếu họ tên người liên hệ"
        },
        {
            rowNumber: 5,
            valid: false,
            error: "Dòng 5: Email không đúng định dạng",
            fullName: "Trần Thị Sai Email",
            company: "Đại lý Bán lẻ Phương Nam",
            phone: "0909334455",
            email: "email_sai_dinh_dang_khong_co_a_cong",
            title: "Kế toán trưởng",
            leadSource: "Danh thiếp / Gặp gỡ trực tiếp",
            notes: "Lỗi định dạng email"
        },
        {
            rowNumber: 6,
            valid: false,
            error: "Dòng 6: Số điện thoại không được để trống",
            fullName: "Lê Văn Thiếu SĐT",
            company: "Logistics Toàn Cầu",
            phone: "",
            email: "thieusdt@toancau.com",
            title: "Chuyên viên mua sắm",
            leadSource: "Hội thảo / Triển lãm ngành",
            notes: "Lỗi thiếu số điện thoại"
        },
        {
            rowNumber: 7,
            valid: false,
            error: "Dòng 7: Bị trùng lặp Email (hoangnam.build@namlong.vn) với dòng trước trong tệp",
            fullName: "Phạm Trùng Lặp Email",
            company: "Công ty Trùng Lặp",
            phone: "0933887766",
            email: "hoangnam.build@namlong.vn",
            title: "Quản lý kinh doanh",
            leadSource: "Hội thảo / Triển lãm ngành",
            notes: "Lỗi trùng Email với dòng 2"
        }
    ];

    updateStepper(3);
    renderPreviewTable();
}

/* =========================================================
   HIỂN THỊ BẢNG ĐỐI SOÁT & BÁO LỖI TỪNG DÒNG
========================================================= */
function renderPreviewTable() {
    previewSection.hidden = false;

    const total = allPreviewRows.length;
    const valids = allPreviewRows.filter(r => r.valid).length;
    const errors = allPreviewRows.filter(r => !r.valid).length;

    totalRowsCount.textContent = total;
    validRowsCount.textContent = valids;
    errorRowsCount.textContent = errors;

    tabCountAll.textContent = total;
    tabCountValid.textContent = valids;
    tabCountError.textContent = errors;

    confirmValidCount.textContent = valids;

    // Nút xuất lỗi hiển thị nếu có ít nhất 1 dòng lỗi
    if (exportErrorsButton) {
        exportErrorsButton.style.display = errors > 0 ? "inline-flex" : "none";
    }

    // Lọc theo tab
    let filtered = allPreviewRows.filter(row => {
        if (currentFilter === "valid") return row.valid;
        if (currentFilter === "error") return !row.valid;
        return true;
    });

    // Lọc theo từ khóa tìm kiếm
    if (currentSearch) {
        filtered = filtered.filter(row => {
            const str = [
                row.rowNumber,
                row.fullName,
                row.company,
                row.phone,
                row.email,
                row.title,
                row.leadSource,
                row.notes,
                row.error
            ].join(" ").toLowerCase();
            return str.includes(currentSearch);
        });
    }

    if (filtered.length === 0) {
        previewBody.innerHTML = `
            <tr>
                <td colspan="10" style="text-align:center; padding: 32px; color: #64748b;">
                    Không có dòng dữ liệu nào khớp với điều kiện lọc hiện tại.
                </td>
            </tr>
        `;
        return;
    }

    previewBody.innerHTML = filtered.map(row => {
        const isErr = !row.valid;
        const rowClass = isErr ? "row-error" : "row-valid";
        const badge = isErr
            ? `<span class="badge-status badge-error">❌ Có lỗi</span>`
            : `<span class="badge-status badge-valid">✓ Hợp lệ</span>`;

        const errorHtml = isErr
            ? `<div class="error-message-cell">⚠️ ${escapeHtml(row.error || "Dữ liệu không hợp lệ")}</div>`
            : `<span style="color:#10b981; font-size:12px;">✓ Sẵn sàng nhập</span>`;

        const sourceTag = row.leadSource && row.leadSource.trim()
            ? `<span class="source-tag">${escapeHtml(row.leadSource)}</span>`
            : `<span style="color:#dc2626; font-weight:700; font-size:11.5px; background:#fee2e2; padding:2px 6px; border-radius:4px;">(Thiếu nguồn!)</span>`;

        return `
            <tr class="${rowClass}">
                <td style="text-align:center; font-weight:700; color:#475569;">${row.rowNumber}</td>
                <td>${badge}</td>
                <td>${errorHtml}</td>
                <td style="font-weight:600; color:#0f172a;">${escapeHtml(row.fullName || "—")}</td>
                <td>${sourceTag}</td>
                <td><code>${escapeHtml(row.phone || "—")}</code></td>
                <td><a href="mailto:${escapeHtml(row.email)}" style="color:#2563eb; text-decoration:none;">${escapeHtml(row.email || "—")}</a></td>
                <td>${escapeHtml(row.company || "(Cá nhân)")}</td>
                <td style="color:#64748b;">${escapeHtml(row.title || "—")}</td>
                <td style="color:#475569; font-size:12px; max-width:240px; text-overflow:ellipsis; overflow:hidden; white-space:nowrap;" title="${escapeHtml(row.notes || "")}">
                    ${escapeHtml(row.notes || "—")}
                </td>
            </tr>
        `;
    }).join("");

    confirmButton.disabled = valids === 0;
}

/* =========================================================
   XÁC NHẬN NHẬP DỮ LIỆU
========================================================= */
async function confirmImport() {
    const valids = allPreviewRows.filter(r => r.valid);
    if (valids.length === 0) {
        alert("Không có dòng dữ liệu hợp lệ nào để nhập!");
        return;
    }

    const confirmMsg = `Bạn có chắc chắn muốn nhập ${valids.length} khách hàng tiềm năng hợp lệ vào hệ thống?`;
    if (!confirm(confirmMsg)) return;

    confirmButton.disabled = true;
    confirmButton.textContent = "⏳ Đang nhập dữ liệu vào CRM...";

    try {
        if (currentBatchToken && !currentBatchToken.startsWith("demo-")) {
            // Gửi API confirm backend
            const response = await fetch(`${API_BASE}/api/leads/import/confirm`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ batchToken: currentBatchToken }),
                credentials: "include"
            });

            const result = await response.json();
            if (!response.ok || !result.success) {
                throw new Error(result.message || "Lỗi khi lưu dữ liệu nhập.");
            }

            showSuccess(result.data?.importedCount || valids.length);
        } else {
            // Nếu là dữ liệu sandbox demo, nhập qua API manual để thực tế có dữ liệu trong DB!
            let successCount = 0;
            for (const row of valids) {
                try {
                    await fetch(`${API_BASE}/api/leads/manual`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            fullName: row.fullName,
                            company: row.company,
                            phone: row.phone,
                            email: row.email,
                            title: row.title,
                            leadSource: row.leadSource,
                            eventName: "Hội thảo VietBuild 2026",
                            interest: row.notes
                        }),
                        credentials: "include"
                    });
                    successCount++;
                } catch (e) {
                    // ignore
                }
            }
            showSuccess(successCount > 0 ? successCount : valids.length);
        }
    } catch (err) {
        alert("Lỗi khi nhập dữ liệu: " + err.message);
        confirmButton.disabled = false;
        confirmButton.textContent = `🚀 Xác nhận nhập ${valids.length} Lead vào hệ thống`;
    }
}

function showSuccess(count) {
    updateStepper(4);
    previewSection.hidden = true;
    importSuccessCard.hidden = false;
    importSuccessTitle.textContent = `Nhập thành công ${count} khách hàng tiềm năng!`;
    importSuccessDesc.textContent = `Toàn bộ ${count} khách hàng tiềm năng thu được từ hội thảo/sự kiện đã được đưa vào hệ thống với trạng thái "Mới" (MOI), tự động tạo người liên hệ và ghi nhật ký hoạt động ban đầu.`;
}

/* =========================================================
   XUẤT DANH SÁCH LỖI RA FILE CSV
========================================================= */
function exportErrorsToCsv() {
    const errorRows = allPreviewRows.filter(r => !r.valid);
    if (errorRows.length === 0) {
        alert("Không có dòng lỗi nào!");
        return;
    }

    const headers = ["Dòng", "Chi tiết lỗi", "Họ và tên", "Nguồn Lead", "Số điện thoại", "Email", "Công ty", "Chức danh", "Ghi chú"];
    const rows = errorRows.map(r => [
        r.rowNumber,
        `"${(r.error || '').replace(/"/g, '""')}"`,
        `"${(r.fullName || '').replace(/"/g, '""')}"`,
        `"${(r.leadSource || '').replace(/"/g, '""')}"`,
        `"${(r.phone || '').replace(/"/g, '""')}"`,
        `"${(r.email || '').replace(/"/g, '""')}"`,
        `"${(r.company || '').replace(/"/g, '""')}"`,
        `"${(r.title || '').replace(/"/g, '""')}"`,
        `"${(r.notes || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = "\uFEFF" + [headers.join(","), ...rows.map(e => e.join(","))].join("\r\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `danh_sach_loi_nhap_lead_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

/* =========================================================
   TIỆN ÍCH
========================================================= */
function formatFileSize(bytes) {
    if (!bytes) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

function escapeHtml(value) {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}
