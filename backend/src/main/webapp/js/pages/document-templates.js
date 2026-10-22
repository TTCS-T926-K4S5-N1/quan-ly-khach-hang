"use strict";

const API_BASE = "http://localhost:8080/crm";

let currentType = "QUOTE";
let currentLogoData = null;
let templateData = null;

const tabButtons = document.querySelectorAll(".tmpl-tab");
const form = document.getElementById("templateForm");
const saveBtn = document.getElementById("saveTemplateBtn");
const previewBtn = document.getElementById("previewPdfBtn");
const logoFileInput = document.getElementById("logoFileInput");
const logoPreview = document.getElementById("logoPreview");
const removeLogoBtn = document.getElementById("removeLogoBtn");
const colorPicker = document.getElementById("primaryColorPicker");
const colorInput = document.getElementById("primaryColor");

// Color sync
if (colorPicker && colorInput) {
    colorPicker.addEventListener("input", () => {
        colorInput.value = colorPicker.value.toUpperCase();
    });
    colorInput.addEventListener("input", () => {
        if (/^#[0-9A-Fa-f]{6}$/.test(colorInput.value)) {
            colorPicker.value = colorInput.value;
        }
    });
}

// Logo upload
if (logoFileInput) {
    logoFileInput.addEventListener("change", (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.type !== "image/png" && file.type !== "image/jpeg") {
            alert("Vui lòng chọn ảnh định dạng PNG hoặc JPEG.");
            logoFileInput.value = "";
            return;
        }

        if (file.size > 500 * 1024) {
            alert("Dung lượng logo không được vượt quá 500 KB.");
            logoFileInput.value = "";
            return;
        }

        const reader = new FileReader();
        reader.onload = (ev) => {
            currentLogoData = ev.target?.result;
            showLogo(currentLogoData);
        };
        reader.readAsDataURL(file);
    });
}

if (removeLogoBtn) {
    removeLogoBtn.addEventListener("click", () => {
        currentLogoData = null;
        logoFileInput.value = "";
        showLogo(null);
    });
}

function showLogo(dataUrl) {
    if (dataUrl) {
        logoPreview.src = dataUrl;
        logoPreview.style.display = "block";
        removeLogoBtn.style.display = "inline-block";
    } else {
        logoPreview.src = "";
        logoPreview.style.display = "none";
        removeLogoBtn.style.display = "none";
    }
}

// Tab click
tabButtons.forEach(btn => {
    btn.addEventListener("click", () => {
        const target = btn.dataset.tab;
        if (target === currentType) return;
        tabButtons.forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        currentType = target;
        loadTemplate(currentType);
    });
});

async function loadTemplate(type) {
    try {
        const res = await fetch(`${API_BASE}/api/document-templates/${type}`, { credentials: "include" });
        if (res.status === 401) {
            window.location.href = "login";
            return;
        }
        const json = await res.json();
        if (!res.ok || !json?.success) {
            throw new Error(json?.message || "Không thể tải cấu hình mẫu");
        }
        templateData = json.data;
        populateForm(templateData);
    } catch (err) {
        alert("Lỗi tải mẫu: " + err.message);
    }
}

function populateForm(data) {
    if (!data) return;
    setValue("templateName", data.name || "");
    setValue("templateTitle", data.title || "");
    setValue("companyName", data.companyName || "");
    setValue("companyAddress", data.companyAddress || "");
    setValue("companyTaxCode", data.companyTaxCode || "");
    setValue("companyPhone", data.companyPhone || "");
    setValue("companyEmail", data.companyEmail || "");
    setValue("companyWebsite", data.companyWebsite || "");
    setValue("companyBankAccount", data.companyBankAccount || "");
    setValue("representativeName", data.representativeName || "");
    setValue("representativeTitle", data.representativeTitle || "");
    setValue("introText", data.introText || "");
    setValue("termsText", data.termsText || "");
    setValue("footerText", data.footerText || "");
    setValue("currencyUnit", data.currencyUnit || "đồng");
    setValue("validityDays", data.validityDays || 30);

    const color = data.primaryColor || "#1E3A8A";
    setValue("primaryColor", color);
    if (colorPicker) colorPicker.value = color;

    currentLogoData = data.logoData || null;
    showLogo(currentLogoData);
}

function setValue(id, val) {
    const el = document.getElementById(id);
    if (el) el.value = val;
}

function getValue(id) {
    const el = document.getElementById(id);
    return el ? el.value.trim() : "";
}

// Form submit
if (form) {
    form.addEventListener("submit", async (e) => {
        e.preventDefault();
        saveBtn.disabled = true;
        saveBtn.textContent = "Đang lưu...";

        const payload = {
            documentType: currentType,
            name: getValue("templateName"),
            title: getValue("templateTitle"),
            companyName: getValue("companyName"),
            companyAddress: getValue("companyAddress"),
            companyTaxCode: getValue("companyTaxCode"),
            companyPhone: getValue("companyPhone"),
            companyEmail: getValue("companyEmail"),
            companyWebsite: getValue("companyWebsite"),
            companyBankAccount: getValue("companyBankAccount"),
            representativeName: getValue("representativeName"),
            representativeTitle: getValue("representativeTitle"),
            introText: getValue("introText"),
            termsText: getValue("termsText"),
            footerText: getValue("footerText"),
            currencyUnit: getValue("currencyUnit"),
            validityDays: parseInt(getValue("validityDays") || "30", 10),
            primaryColor: getValue("primaryColor"),
            logoData: currentLogoData
        };

        try {
            const res = await fetch(`${API_BASE}/api/document-templates/${currentType}`, {
                method: "PUT",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });
            const json = await res.json();
            if (!res.ok || !json?.success) {
                throw new Error(json?.message || "Lưu thất bại");
            }
            alert("Lưu cấu hình mẫu tài liệu thành công!");
            templateData = json.data;
            populateForm(templateData);
        } catch (err) {
            alert("Lỗi khi lưu cấu hình: " + err.message);
        } finally {
            saveBtn.disabled = false;
            saveBtn.textContent = "Lưu cấu hình";
        }
    });
}

// Preview PDF
if (previewBtn) {
    previewBtn.addEventListener("click", () => {
        window.open(`${API_BASE}/api/document-templates/${currentType}/preview`, "_blank");
    });
}

// Init
loadTemplate(currentType);
