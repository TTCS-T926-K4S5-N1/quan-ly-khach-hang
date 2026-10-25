"use strict";

let currentType = "QUOTE";
let loadedData = {};

async function loadTemplate(type) {
    currentType = type;
    try {
        const res = await fetch(`api/document-templates?type=${type}`, { credentials: "include" });
        const json = await res.json();
        if (json.success && json.data) {
            loadedData = json.data;
            populateForm(loadedData);
        } else {
            showAlert("Không thể tải cấu hình mẫu: " + (json.message || "Lỗi không xác định"), "error");
        }
    } catch (err) {
        showAlert("Lỗi kết nối máy chủ: " + err.message, "error");
    }
}

function switchTemplateTab(type) {
    currentType = type;
    document.getElementById("tabQuote").classList.toggle("active", type === "QUOTE");
    document.getElementById("tabContract").classList.toggle("active", type === "CONTRACT");
    loadTemplate(type);
}

function populateForm(data) {
    document.getElementById("templateName").value = data.templateName || "";
    document.getElementById("companyName").value = data.companyName || "";
    document.getElementById("companyTaxCode").value = data.companyTaxCode || "";
    document.getElementById("companyAddress").value = data.companyAddress || "";
    document.getElementById("companyPhone").value = data.companyPhone || "";
    document.getElementById("companyEmail").value = data.companyEmail || "";
    document.getElementById("companyBankInfo").value = data.companyBankInfo || "";
    document.getElementById("companyLogoUrl").value = data.companyLogoUrl || "";
    document.getElementById("headerContent").value = data.headerContent || "";
    document.getElementById("defaultTerms").value = data.defaultTerms || "";
    document.getElementById("footerContent").value = data.footerContent || "";

    updateLogoPreview(data.companyLogoUrl || "");
    updateSidePreview();
}

function updateLogoPreview(url) {
    const img = document.getElementById("logoPreviewImg");
    const noLogo = document.getElementById("noLogoText");
    if (url && url.trim().length > 5) {
        img.src = url.trim();
        img.style.display = "block";
        noLogo.style.display = "none";
    } else {
        img.src = "";
        img.style.display = "none";
        noLogo.style.display = "inline";
    }
}

function updateSidePreview() {
    const compName = document.getElementById("companyName").value;
    const tax = document.getElementById("companyTaxCode").value;
    const addr = document.getElementById("companyAddress").value;
    const bank = document.getElementById("companyBankInfo").value;

    if (compName) document.getElementById("prevCompName").textContent = compName;
    if (tax) document.getElementById("prevTax").textContent = tax;
    if (addr) document.getElementById("prevAddress").textContent = addr;
    if (bank) document.getElementById("prevBank").textContent = bank;
}

["companyName", "companyTaxCode", "companyAddress", "companyBankInfo"].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener("input", updateSidePreview);
});

function resetFormToLoaded() {
    populateForm(loadedData);
    showAlert("Đã hoàn tác thay đổi.", "info");
}

document.getElementById("templateForm").addEventListener("submit", async event => {
    event.preventDefault();

    const saveBtn = document.getElementById("saveBtn");
    saveBtn.disabled = true;
    saveBtn.textContent = "Đang lưu...";

    const payload = {
        templateName: document.getElementById("templateName").value.trim(),
        companyName: document.getElementById("companyName").value.trim(),
        companyTaxCode: document.getElementById("companyTaxCode").value.trim(),
        companyAddress: document.getElementById("companyAddress").value.trim(),
        companyPhone: document.getElementById("companyPhone").value.trim(),
        companyEmail: document.getElementById("companyEmail").value.trim(),
        companyBankInfo: document.getElementById("companyBankInfo").value.trim(),
        companyLogoUrl: document.getElementById("companyLogoUrl").value.trim(),
        headerContent: document.getElementById("headerContent").value.trim(),
        defaultTerms: document.getElementById("defaultTerms").value.trim(),
        footerContent: document.getElementById("footerContent").value.trim()
    };

    try {
        const res = await fetch(`api/document-templates/${currentType}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify(payload)
        });

        const json = await res.json();
        if (json.success) {
            loadedData = json.data;
            populateForm(loadedData);
            showAlert(`Lưu mẫu ${currentType === 'QUOTE' ? 'Báo giá' : 'Hợp đồng'} thành công! Thông tin thương hiệu đã được cập nhật.`, "success");
        } else {
            showAlert("Lỗi: " + (json.message || "Không thể cập nhật mẫu."), "error");
        }
    } catch (err) {
        showAlert("Lỗi máy chủ: " + err.message, "error");
    } finally {
        saveBtn.disabled = false;
        saveBtn.textContent = "💾 Lưu cấu hình mẫu";
    }
});

function showAlert(msg, type = "success") {
    const box = document.getElementById("alertMsg");
    if (!box) return;
    box.style.display = "block";
    if (type === "success") {
        box.style.background = "rgba(16, 185, 129, 0.15)";
        box.style.color = "#059669";
        box.style.border = "1px solid rgba(16, 185, 129, 0.3)";
    } else if (type === "error") {
        box.style.background = "rgba(239, 68, 68, 0.15)";
        box.style.color = "#dc2626";
        box.style.border = "1px solid rgba(239, 68, 68, 0.3)";
    } else {
        box.style.background = "rgba(59, 130, 246, 0.15)";
        box.style.color = "#2563eb";
        box.style.border = "1px solid rgba(59, 130, 246, 0.3)";
    }
    box.textContent = msg;
    setTimeout(() => {
        box.style.display = "none";
    }, 5000);
}

document.addEventListener("DOMContentLoaded", () => {
    loadTemplate("QUOTE");
});
