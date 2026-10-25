"use strict";

const API_BASE = "http://localhost:8080/crm";

let lines = [];
let currentId = null;
let currentOpportunityId = null;
let currentCustomerId = null;
let currentQuote = null;
let availableProducts = [];
let availableCustomers = [];

const lineBody = document.getElementById("quoteLineBody");
const lineEmpty = document.getElementById("lineEmpty");

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
const params = new URLSearchParams(window.location.search);
currentId = params.get("id");
currentOpportunityId = params.get("opportunityId");

document.addEventListener("DOMContentLoaded", () => {
    initQuoteEditor();
});

async function initQuoteEditor() {
    await Promise.all([loadProducts(), loadCustomers()]);

    // Set default validUntil date (30 days from now)
    const validUntilInput = document.getElementById("quoteValidUntil");
    if (validUntilInput && !validUntilInput.value) {
        const d = new Date();
        d.setDate(d.getDate() + 30);
        validUntilInput.value = d.toISOString().split("T")[0];
    }

    // Default terms
    if (!document.getElementById("paymentTerms").value) {
        document.getElementById("paymentTerms").value = "Đợt 1: Tạm ứng 40% ngay khi ký hợp đồng.\nĐợt 2: Thanh toán 60% còn lại sau khi nghiệm thu bàn giao.";
    }
    if (!document.getElementById("deliveryTerms").value) {
        document.getElementById("deliveryTerms").value = "Bàn giao giải pháp và triển khai đào tạo trong vòng 15 ngày làm việc.";
    }
    if (!document.getElementById("termsAndConditions").value) {
        document.getElementById("termsAndConditions").value = "Bảo hành tiêu chuẩn 12 tháng. Hỗ trợ kỹ thuật 24/7 theo cam kết SLA.";
    }

    if (currentId) {
        // Load existing quote
        await loadExistingQuote(currentId);
    } else if (currentOpportunityId) {
        // Inherit from opportunity (Story 1)
        await loadFromOpportunity(currentOpportunityId);
    } else {
        // Empty quote with 1 default line
        if (!lines.length && availableProducts.length) {
            lines.push(createEmptyLine(availableProducts[0]));
            renderLines();
        }
    }

    bindEvents();
}

function createEmptyLine(p) {
    return {
        productId: p?.id || null,
        productName: p?.name || "",
        quantity: 1,
        unitPrice: Number(p?.listPrice || 0),
        floorPrice: Number(p?.floorPrice || 0),
        discountType: "PERCENT",
        discountPercent: 0,
        discountAmount: 0,
        notes: ""
    };
}

async function loadProducts() {
    try {
        const data = await api("/api/products");
        if (Array.isArray(data)) {
            availableProducts = data.filter(p => p.active !== false && p.isActive !== false);
            buildProductDatalist();
        }
    } catch (err) {
        console.warn("Could not load products from API:", err);
    }
}

function buildProductDatalist() {
    let dl = document.getElementById("quoteProductDatalist");
    if (!dl) {
        dl = document.createElement("datalist");
        dl.id = "quoteProductDatalist";
        document.body.appendChild(dl);
    }
    dl.innerHTML = "";
    availableProducts.forEach(p => {
        const opt = document.createElement("option");
        opt.value = p.name;
        opt.dataset.id = p.id;
        opt.dataset.price = p.listPrice || 0;
        opt.dataset.floor = p.floorPrice || 0;
        dl.appendChild(opt);
    });
}

async function loadCustomers() {
    try {
        const data = await api("/api/customers");
        if (Array.isArray(data)) {
            availableCustomers = data;
            buildCustomerDatalist();
        }
    } catch (err) {
        console.warn("Could not load customers:", err);
    }
}

function buildCustomerDatalist() {
    let dl = document.getElementById("quoteCustomerDatalist");
    if (!dl) {
        dl = document.createElement("datalist");
        dl.id = "quoteCustomerDatalist";
        document.body.appendChild(dl);
    }
    dl.innerHTML = "";
    availableCustomers.forEach(c => {
        const opt = document.createElement("option");
        opt.value = c.name;
        opt.dataset.id = c.id;
        dl.appendChild(opt);
    });
    const custInput = document.getElementById("quoteCustomer");
    if (custInput) custInput.setAttribute("list", "quoteCustomerDatalist");
}

/* =========================================================
   STORY 1: KẾ THỪA TỪ CƠ HỘI
========================================================= */
async function loadFromOpportunity(oppId) {
    try {
        const data = await api(`/api/quotes/from-opportunity/${oppId}`);
        if (!data) return;

        document.getElementById("editorPageTitle").textContent = "Soạn Báo Giá Từ Cơ Hội";
        document.getElementById("oppInheritAlert").style.display = "flex";
        document.getElementById("inheritedOppName").textContent = data.opportunityName || `#${oppId}`;

        document.getElementById("quoteTitle").value = `Báo giá - ${data.opportunityName || "Cơ hội #" + oppId}`;
        document.getElementById("quoteCustomer").value = data.customerName || "";
        currentCustomerId = data.customerId;
        document.getElementById("quoteOpportunity").value = data.opportunityName || `Cơ hội #${oppId}`;

        // Populate lines from opportunity items
        if (Array.isArray(data.items) && data.items.length) {
            lines = data.items.map(it => ({
                productId: it.productId,
                productName: it.productName,
                quantity: it.quantity || 1,
                unitPrice: Number(it.unitPrice || it.listPrice || 0),
                floorPrice: Number(it.floorPrice || 0),
                discountType: it.discountType || "PERCENT",
                discountPercent: Number(it.discountPercent || 0),
                discountAmount: Number(it.discountAmount || 0),
                notes: it.notes || ""
            }));
        } else if (availableProducts.length) {
            lines = [createEmptyLine(availableProducts[0])];
        }

        renderLines();
    } catch (err) {
        alert("Lỗi khi tải dữ liệu từ cơ hội: " + err.message);
    }
}

/* =========================================================
   LOAD EXISTING QUOTE
========================================================= */
async function loadExistingQuote(id) {
    try {
        const q = await api(`/api/quotes/${id}`);
        if (!q) return;

        currentQuote = q;
        currentCustomerId = q.customerId;
        currentOpportunityId = q.opportunityId;

        document.getElementById("editorPageTitle").textContent = `Chỉnh sửa Báo giá ${q.quoteNumber || ""}`;
        document.getElementById("quoteCode").value = q.quoteNumber || "";
        document.getElementById("quoteTitle").value = q.title || "";
        document.getElementById("quoteCustomer").value = q.customerName || "";
        document.getElementById("quoteOpportunity").value = q.opportunityName || (q.opportunityId ? `Cơ hội #${q.opportunityId}` : "");
        if (q.validUntil) document.getElementById("quoteValidUntil").value = q.validUntil;
        if (q.paymentTerms) document.getElementById("paymentTerms").value = q.paymentTerms;
        if (q.deliveryTerms) document.getElementById("deliveryTerms").value = q.deliveryTerms;
        if (q.termsAndConditions) document.getElementById("termsAndConditions").value = q.termsAndConditions;
        if (q.discountPercent) document.getElementById("headerDiscountInput").value = q.discountPercent;

        // Version badge (Story 3)
        const verBadge = document.getElementById("quoteVersionBadge");
        if (verBadge) {
            verBadge.style.display = "inline-flex";
            const ver = q.version || 1;
            verBadge.textContent = `v${ver}${q.isActiveVersion ? " (Hiệu lực)" : " (Lịch sử)"}`;
            verBadge.className = `version-badge ${q.isActiveVersion ? "badge-active" : "badge-inactive"}`;
        }

        // Status badge
        const stBadge = document.getElementById("quoteStatusBadge");
        if (stBadge) {
            stBadge.style.display = "inline-flex";
            stBadge.textContent = statusLabel(q.status);
            stBadge.className = `quote-status ${String(q.status).toLowerCase()}`;
        }

        // If SENT quote, display notice banner & button to clone (Story 3)
        if ("SENT".equalsIgnoreCase(q.status)) {
            document.getElementById("sentNoticeBanner").style.display = "flex";
            document.getElementById("btnCreateNewVersion").style.display = "inline-flex";
        }

        // Load items
        if (Array.isArray(q.items) && q.items.length) {
            lines = q.items.map(it => ({
                productId: it.productId,
                productName: it.productName,
                quantity: it.quantity || 1,
                unitPrice: Number(it.unitPrice || 0),
                floorPrice: Number(it.floorPrice || 0),
                discountType: it.discountType || "PERCENT",
                discountPercent: Number(it.discountPercent || 0),
                discountAmount: Number(it.discountAmount || 0),
                notes: it.notes || ""
            }));
        }

        renderLines();
    } catch (err) {
        alert("Lỗi khi tải thông tin báo giá: " + err.message);
    }
}

/* =========================================================
   LINE ITEMS RENDERING & CALCULATION (STORY 1 & 2)
========================================================= */
function renderLines() {
    if (!lineBody) return;
    lineBody.innerHTML = "";
    if (lineEmpty) lineEmpty.style.display = lines.length ? "none" : "flex";

    lines.forEach((line, index) => {
        const tr = document.createElement("tr");

        const qty = Math.max(1, Number(line.quantity || 1));
        const price = Math.max(0, Number(line.unitPrice || 0));
        const lineGross = qty * price;

        let discAmt = 0;
        let discPct = 0;

        if (line.discountType === "AMOUNT") {
            discAmt = Math.min(lineGross, Math.max(0, Number(line.discountAmount || 0)));
            discPct = lineGross > 0 ? (discAmt / lineGross) * 100 : 0;
        } else {
            discPct = Math.min(100, Math.max(0, Number(line.discountPercent || 0)));
            discAmt = lineGross * (discPct / 100);
        }

        const lineNet = lineGross - discAmt;
        const netUnitPrice = qty > 0 ? lineNet / qty : price;

        const isBelowFloor = line.floorPrice > 0 && (price < line.floorPrice || netUnitPrice < line.floorPrice);

        tr.innerHTML = `
            <td class="line-product">
                <input
                    type="text"
                    list="quoteProductDatalist"
                    value="${escapeHtml(line.productName)}"
                    placeholder="Chọn sản phẩm..."
                    data-line-field="productName"
                    data-index="${index}"
                    style="font-weight: 600;"
                >
                ${isBelowFloor
                    ? `<div style="color:#ef4444;font-size:11px;font-weight:600;margin-top:2px;">
                        ⚠️ Dưới giá sàn (${money(line.floorPrice)}) ➔ Giám đốc duyệt
                       </div>`
                    : (line.floorPrice > 0 ? `<div style="color:#64748b;font-size:10.5px;margin-top:1px;">Giá sàn: ${money(line.floorPrice)}</div>` : '')}
            </td>
            <td class="line-qty">
                <input
                    type="number"
                    min="1"
                    value="${qty}"
                    data-line-field="quantity"
                    data-index="${index}"
                    style="text-align: center;"
                >
            </td>
            <td class="line-price">
                <input
                    type="number"
                    min="0"
                    step="1000"
                    value="${price}"
                    data-line-field="unitPrice"
                    data-index="${index}"
                    style="${isBelowFloor ? 'border-color:#ef4444;color:#ef4444;background:#fff5f5;' : ''} text-align: right;"
                >
            </td>
            <td style="width: 75px;">
                <select class="disc-type-select" data-line-field="discountType" data-index="${index}">
                    <option value="PERCENT" ${line.discountType === 'PERCENT' ? 'selected' : ''}>%</option>
                    <option value="AMOUNT" ${line.discountType === 'AMOUNT' ? 'selected' : ''}>₫</option>
                </select>
            </td>
            <td style="width: 110px;">
                <input
                    type="number"
                    min="0"
                    ${line.discountType === 'PERCENT' ? 'max="100" step="0.5"' : 'step="1000"'}
                    value="${line.discountType === 'AMOUNT' ? Number(line.discountAmount || 0) : Number(line.discountPercent || 0)}"
                    data-line-field="discountValue"
                    data-index="${index}"
                    style="text-align: right;"
                >
            </td>
            <td style="width: 120px; font-size: 12px; color: #dc2626; text-align: right;" id="lineDiscAmt${index}">
                -${money(discAmt)}
            </td>
            <td class="line-total" style="text-align: right;" id="lineTotal${index}">
                ${money(lineNet)}
            </td>
            <td>
                <button type="button" class="remove-line" data-remove-line="${index}" title="Xóa dòng">×</button>
            </td>
        `;
        lineBody.appendChild(tr);
    });

    updateSummary();
}

/* =========================================================
   SUMMARY & REAL-TIME APPROVAL TIERS (STORY 1 & 2)
========================================================= */
function updateSummary() {
    let grossTotal = 0;
    let lineSubtotal = 0;
    let floorPriceViolated = false;

    lines.forEach(line => {
        const qty = Math.max(1, Number(line.quantity || 1));
        const price = Math.max(0, Number(line.unitPrice || 0));
        const lineGross = qty * price;
        grossTotal += lineGross;

        let discAmt = 0;
        if (line.discountType === "AMOUNT") {
            discAmt = Math.min(lineGross, Math.max(0, Number(line.discountAmount || 0)));
        } else {
            const discPct = Math.min(100, Math.max(0, Number(line.discountPercent || 0)));
            discAmt = lineGross * (discPct / 100);
        }

        const lineNet = lineGross - discAmt;
        lineSubtotal += lineNet;

        const netUnitPrice = qty > 0 ? lineNet / qty : price;
        if (line.floorPrice > 0 && (price < line.floorPrice || netUnitPrice < line.floorPrice)) {
            floorPriceViolated = true;
        }
    });

    const headerDiscPct = Math.min(100, Math.max(0, Number(document.getElementById("headerDiscountInput")?.value || 0)));
    const headerDiscAmt = lineSubtotal * (headerDiscPct / 100);
    const finalTotal = lineSubtotal - headerDiscAmt;

    const lineDiscountTotal = grossTotal - lineSubtotal;
    const totalDiscountValue = grossTotal - finalTotal;
    const overallDiscountPct = grossTotal > 0 ? (totalDiscountValue / grossTotal) * 100 : 0;

    // Display numbers
    document.getElementById("grossTotalText").textContent = money(grossTotal);
    document.getElementById("lineDiscountText").textContent = money(lineDiscountTotal);
    document.getElementById("totalDiscountText").innerHTML = `${money(totalDiscountValue)} (<span id="totalDiscountPctText">${overallDiscountPct.toFixed(1)}%</span>)`;
    document.getElementById("totalText").textContent = money(finalTotal);

    // Dynamic Approval Tier Box (Story 2)
    const tierBox = document.getElementById("approvalTierBox");
    const tierTitle = document.getElementById("tierTitle");
    const tierDesc = document.getElementById("tierDesc");

    if (floorPriceViolated) {
        tierBox.className = "tier-card tier-director";
        tierTitle.innerHTML = "⛔ Bắt buộc Giám đốc kinh doanh duyệt (Dưới giá sàn)";
        tierDesc.textContent = "Phát hiện có sản phẩm được bán dưới Giá sàn niêm yết. Theo chính sách, báo giá bắt buộc phải do Giám đốc kinh doanh phê duyệt.";
    } else if (overallDiscountPct > 20) {
        tierBox.className = "tier-card tier-director";
        tierTitle.innerHTML = `⛔ Bắt buộc Giám đốc kinh doanh duyệt (CK ${overallDiscountPct.toFixed(1)}% > 20%)`;
        tierDesc.textContent = `Tổng mức chiết khấu toàn đơn đạt ${overallDiscountPct.toFixed(1)}% (vượt ngưỡng 20%). Bắt buộc Giám đốc kinh doanh phê duyệt.`;
    } else if (overallDiscountPct > 10) {
        tierBox.className = "tier-card tier-team-lead";
        tierTitle.innerHTML = `⚠️ Cần Trưởng nhóm kinh doanh duyệt (CK ${overallDiscountPct.toFixed(1)}%)`;
        tierDesc.textContent = `Mức chiết khấu nằm trong khoảng 10% - 20%. Báo giá sẽ được chuyển đến Trưởng nhóm kinh doanh để phê duyệt.`;
    } else {
        tierBox.className = "tier-card tier-none";
        tierTitle.innerHTML = `✅ Tự động phê duyệt (CK ${overallDiscountPct.toFixed(1)}% ≤ 10%)`;
        tierDesc.textContent = `Mức chiết khấu nằm trong hạn mức tiêu chuẩn (≤ 10%) và trên giá sàn. Báo giá sẽ tự động duyệt ngay khi gửi.`;
    }
}

/* =========================================================
   EVENT HANDLERS
========================================================= */
function bindEvents() {
    document.getElementById("addQuoteLine")?.addEventListener("click", () => {
        lines.push(createEmptyLine(availableProducts[0]));
        renderLines();
    });

    document.getElementById("headerDiscountInput")?.addEventListener("input", () => {
        updateSummary();
    });

    lineBody?.addEventListener("input", event => {
        const input = event.target.closest("[data-line-field]");
        if (!input) return;

        const index = Number(input.dataset.index);
        const field = input.dataset.lineField;
        if (!lines[index]) return;

        if (field === "productName") {
            lines[index].productName = input.value;
            const matched = availableProducts.find(p => p.name.toLowerCase() === input.value.trim().toLowerCase());
            if (matched) {
                lines[index].productId = matched.id;
                lines[index].unitPrice = Number(matched.listPrice || 0);
                lines[index].floorPrice = Number(matched.floorPrice || 0);
                renderLines();
                return;
            }
        } else if (field === "quantity") {
            lines[index].quantity = Math.max(1, Number(input.value) || 1);
        } else if (field === "unitPrice") {
            lines[index].unitPrice = Math.max(0, Number(input.value) || 0);
        } else if (field === "discountValue") {
            const val = Math.max(0, Number(input.value) || 0);
            if (lines[index].discountType === "AMOUNT") {
                lines[index].discountAmount = val;
            } else {
                lines[index].discountPercent = Math.min(100, val);
            }
        }

        renderLines();
    });

    lineBody?.addEventListener("change", event => {
        const sel = event.target.closest("select[data-line-field='discountType']");
        if (sel) {
            const index = Number(sel.dataset.index);
            if (lines[index]) {
                lines[index].discountType = sel.value;
                renderLines();
            }
        }
    });

    lineBody?.addEventListener("click", event => {
        const remove = event.target.closest("[data-remove-line]");
        if (!remove) return;
        lines.splice(Number(remove.dataset.removeLine), 1);
        renderLines();
    });

    // Save Draft
    document.getElementById("saveDraftButton")?.addEventListener("click", () => {
        saveQuote("DRAFT");
    });

    // Submit for approval
    document.getElementById("submitApprovalButton")?.addEventListener("click", () => {
        saveQuote("SUBMIT");
    });

    // Create new version explicitly (Story 3)
    document.getElementById("btnCreateNewVersion")?.addEventListener("click", async () => {
        if (!currentId) return;
        if (confirm("Tạo phiên bản mới (vN+1) từ báo giá này để điều chỉnh và giữ nguyên phiên bản cũ?")) {
            try {
                const res = await api(`/api/quotes/${currentId}/create-version`, { method: "POST" });
                alert(`Đã tạo phiên bản mới v${res.version} (${res.quoteNumber}) thành công!`);
                window.location.href = `quote-editor?id=${res.id}`;
            } catch (err) {
                alert("Lỗi tạo phiên bản mới: " + err.message);
            }
        }
    });
}

/* =========================================================
   SAVE QUOTE (DRAFT OR SUBMIT)
========================================================= */
async function saveQuote(action) {
    const title = document.getElementById("quoteTitle")?.value?.trim();
    const custName = document.getElementById("quoteCustomer")?.value?.trim();
    const validUntil = document.getElementById("quoteValidUntil")?.value;

    if (!title) {
        alert("Vui lòng nhập Tiêu đề báo giá.");
        document.getElementById("quoteTitle")?.focus();
        return;
    }

    if (!custName) {
        alert("Vui lòng chọn hoặc nhập Khách hàng.");
        document.getElementById("quoteCustomer")?.focus();
        return;
    }

    if (!validUntil) {
        alert("Vui lòng chọn ngày Hiệu lực báo giá đến.");
        document.getElementById("quoteValidUntil")?.focus();
        return;
    }

    if (!lines.length) {
        alert("Vui lòng thêm ít nhất một dòng sản phẩm.");
        return;
    }

    // Match or resolve customer
    let customerId = currentCustomerId;
    if (!customerId) {
        const matched = availableCustomers.find(c => c.name.toLowerCase() === custName.toLowerCase());
        customerId = matched ? matched.id : 1;
    }

    const headerDisc = Number(document.getElementById("headerDiscountInput")?.value || 0);

    const itemsPayload = lines.map(l => {
        let pId = l.productId;
        if (!pId) {
            const matched = availableProducts.find(p => p.name.toLowerCase() === (l.productName || "").trim().toLowerCase());
            pId = matched ? matched.id : (availableProducts[0]?.id || 1);
        }
        return {
            productId: pId,
            quantity: Number(l.quantity || 1),
            unitPrice: Number(l.unitPrice || 0),
            discountType: l.discountType || "PERCENT",
            discountPercent: Number(l.discountPercent || 0),
            discountAmount: Number(l.discountAmount || 0),
            notes: l.notes || ""
        };
    });

    const payload = {
        title,
        customerId,
        opportunityId: currentOpportunityId ? Number(currentOpportunityId) : null,
        discountPercent: headerDisc,
        validUntil,
        paymentTerms: document.getElementById("paymentTerms")?.value?.trim() || "",
        deliveryTerms: document.getElementById("deliveryTerms")?.value?.trim() || "",
        termsAndConditions: document.getElementById("termsAndConditions")?.value?.trim() || "",
        action: action,
        items: itemsPayload
    };

    const isUpdate = currentId && !isNaN(Number(currentId));
    const url = isUpdate ? `/api/quotes/${currentId}` : "/api/quotes";
    const method = isUpdate ? "PUT" : "POST";

    try {
        const res = await api(url, {
            method: method,
            body: JSON.stringify(payload)
        });

        if (action === "DRAFT") {
            alert(`Đã lưu nháp báo giá ${res.quoteNumber || ""} thành công!`);
        } else {
            if (res.status === "APPROVED") {
                alert(`Báo giá ${res.quoteNumber || ""} đã được TỰ ĐỘNG PHÊ DUYỆT thành công (chiết khấu ≤ 10%)! Bạn có thể gửi cho khách hàng.`);
            } else if (res.approvalLevel === "DIRECTOR") {
                alert(`Báo giá ${res.quoteNumber || ""} đã được gửi duyệt! Bắt buộc Giám đốc kinh doanh phê duyệt do chiết khấu > 20% hoặc có sản phẩm dưới giá sàn.`);
            } else {
                alert(`Báo giá ${res.quoteNumber || ""} đã được gửi duyệt thành công! Báo giá đang chờ Trưởng nhóm kinh doanh phê duyệt.`);
            }
        }

        window.location.href = "quotations";
    } catch (err) {
        alert("Lỗi khi lưu báo giá: " + err.message);
    }
}

/* =========================================================
   UTILS
========================================================= */
function money(val) {
    return new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
        maximumFractionDigits: 0
    }).format(Number(val) || 0);
}

function escapeHtml(str) {
    return String(str ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function statusLabel(st) {
    switch (String(st || "").toUpperCase()) {
        case "APPROVED": return "Đã duyệt";
        case "PENDING_APPROVAL": return "Chờ duyệt";
        case "REJECTED": return "Từ chối";
        case "CHANGES_REQUESTED": return "Yêu cầu sửa";
        case "SENT": return "Đã gửi khách";
        default: return "Nháp";
    }
}
String.prototype.equalsIgnoreCase = function(other) {
    return String(this).toLowerCase() === String(other).toLowerCase();
};
