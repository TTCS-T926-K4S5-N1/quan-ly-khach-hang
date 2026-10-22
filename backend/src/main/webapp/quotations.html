"use strict";

/* =========================================================
   CONVERT QUOTE TO CONTRACT CONTROLLER (SCRUM-93 / SCRUM-237 [FE])
   Đối tượng sử dụng: Kế toán (Accountant)
========================================================= */

const params = new URLSearchParams(window.location.search);
const quoteId = params.get("id");

let quote = null;
const blocked = document.getElementById("contractBlocked");
const blockedReasonTitle = document.getElementById("blockedReasonTitle");
const blockedReasonDesc = document.getElementById("blockedReasonDesc");
const createButton = document.getElementById("createContractButton");

/* =========================================================
   SEED DATA NẾU CHƯA CÓ TRONG LOCALSTORAGE
========================================================= */
function ensureSeedQuotes() {
    let quotes = [];
    try {
        quotes = JSON.parse(localStorage.getItem("crm_ui_quotes")) || [];
    } catch (_) {
        quotes = [];
    }

    if (!Array.isArray(quotes) || quotes.length === 0) {
        quotes = [
            {
                id: 101,
                code: "BG-2026-001",
                title: "Báo giá Hệ thống ERP Cloud đa nhà máy",
                customer: "Tập đoàn Công nghiệp Foxconn VN",
                customerId: 1,
                opportunity: "Triển khai ERP Foxconn Đình Trám & Quế Võ",
                opportunityId: 1001,
                total: 850000000,
                subtotal: 900000000,
                discountPercent: 5.5,
                vatPercent: 10,
                status: "approved",
                validUntil: "2026-11-15",
                paymentTerms: "Đợt 1: Tạm ứng 50% ngay sau khi ký hợp đồng. Đợt 2: Thanh toán 50% còn lại trong vòng 7 ngày sau khi nghiệm thu bàn giao.",
                lines: [
                    { product: "Gói giải pháp Quản trị Sản xuất ERP Cloud (License 100 User)", quantity: 1, price: 500000000, discount: 5, vat: 10, total: 475000000 },
                    { product: "Dịch vụ Tích hợp API Dây chuyền Tự động hóa & Barcode", quantity: 1, price: 250000000, discount: 0, vat: 10, total: 250000000 },
                    { product: "Đào tạo & Chuyển giao Vận hành hệ thống (3 tháng)", quantity: 1, price: 150000000, discount: 10, vat: 10, total: 135000000 }
                ]
            },
            {
                id: 102,
                code: "BG-2026-002",
                title: "Báo giá Nâng cấp Hạ tầng & Phần mềm Du lịch",
                customer: "Công ty TNHH Dịch vụ & Du lịch Viettravel Sun",
                customerId: 2,
                opportunity: "Số hóa quy trình Booking Tour Viettravel",
                opportunityId: 1002,
                total: 320000000,
                subtotal: 350000000,
                discountPercent: 8.5,
                vatPercent: 8,
                status: "approved",
                validUntil: "2026-11-30",
                paymentTerms: "Thanh toán 100% giá trị hợp đồng trong vòng 7 ngày làm việc kể từ ngày ký.",
                lines: [
                    { product: "Module Đặt Tour & Thanh toán Trực tuyến Đa kênh", quantity: 1, price: 200000000, discount: 10, vat: 8, total: 180000000 },
                    { product: "Tổng đài Chăm sóc Khách hàng IP Call Center Cloud", quantity: 1, price: 150000000, discount: 5, vat: 8, total: 140000000 }
                ]
            },
            {
                id: 103,
                code: "BG-2026-003",
                title: "Báo giá Triển khai Phần mềm Khách hàng Thân thiết",
                customer: "Chuỗi Bán lẻ Thời trang NEM Fashion",
                customerId: 3,
                opportunity: "Tích hợp Loyalty System 50 Showroom NEM",
                opportunityId: 1003,
                total: 185000000,
                subtotal: 185000000,
                discountPercent: 0,
                vatPercent: 8,
                status: "pending",
                validUntil: "2026-11-10",
                paymentTerms: "Đợt 1: Tạm ứng 50% khi ký. Đợt 2: 50% khi nghiệm thu.",
                lines: [
                    { product: "Phần mềm Tích điểm & Thẻ thành viên NEM Fashion App", quantity: 1, price: 185000000, discount: 0, vat: 8, total: 185000000 }
                ]
            }
        ];
        localStorage.setItem("crm_ui_quotes", JSON.stringify(quotes));
    }
}

/* =========================================================
   SEED SAMPLE OPPORTUNITIES IF NOT PRESENT
========================================================= */
function ensureSeedOpportunities() {
    let opps = [];
    try {
        opps = JSON.parse(localStorage.getItem("crm_ui_opportunities")) || [];
    } catch (_) {
        opps = [];
    }

    if (!Array.isArray(opps) || opps.length === 0) {
        opps = [
            {
                id: 1001,
                name: "Triển khai ERP Foxconn Đình Trám & Quế Võ",
                customer: "Tập đoàn Công nghiệp Foxconn VN",
                customerName: "Tập đoàn Công nghiệp Foxconn VN",
                value: 850000000,
                amount: 850000000,
                stage: "4",
                stageId: 4,
                probability: 75,
                owner: "Lê Hoàng Nam",
                status: "OPEN"
            },
            {
                id: 1002,
                name: "Số hóa quy trình Booking Tour Viettravel",
                customer: "Công ty TNHH Dịch vụ & Du lịch Viettravel Sun",
                customerName: "Công ty TNHH Dịch vụ & Du lịch Viettravel Sun",
                value: 320000000,
                amount: 320000000,
                stage: "4",
                stageId: 4,
                probability: 75,
                owner: "Phạm Mai Phương",
                status: "OPEN"
            }
        ];
        localStorage.setItem("crm_ui_opportunities", JSON.stringify(opps));
    }
}

/* =========================================================
   DATE UTILITIES
========================================================= */
function todayString() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function generateContractNumber() {
    const now = new Date();
    const datePart = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;
    const contracts = getContracts();
    
    // Count contracts created today
    const prefix = `HD-${datePart}-`;
    const todayContracts = contracts.filter(c => (c.contractNumber || "").startsWith(prefix));
    const nextSeq = String(todayContracts.length + 1).padStart(3, "0");
    return `${prefix}${nextSeq}`;
}

/* =========================================================
   PAGE INITIALIZATION
========================================================= */
async function initContractPage() {
    ensureSeedQuotes();
    ensureSeedOpportunities();

    const quotes = getQuotes();
    
    // Tìm quote theo id hoặc lấy quote approved đầu tiên nếu không có id truyền vào
    if (quoteId) {
        quote = quotes.find(item => String(item.id) === String(quoteId));
    } else {
        quote = quotes.find(item => (item.status || "").toLowerCase() === "approved") || quotes[0];
    }

    // Nếu vẫn chưa tìm thấy thì gọi API backend
    if (!quote && quoteId) {
        try {
            const res = await fetch(`http://localhost:8080/crm/api/quotes/${quoteId}`, { credentials: "include" });
            const json = await res.json();
            if (json?.success && json.data) {
                const q = json.data;
                quote = {
                    id: q.id,
                    code: q.quoteNumber || `BG-${q.id}`,
                    customer: q.customerName || "Khách hàng",
                    customerId: q.customerId,
                    opportunity: q.opportunityName || "Cơ hội kinh doanh",
                    opportunityId: q.opportunityId,
                    total: Number(q.totalAmount || 0),
                    status: (q.status || "").toLowerCase(),
                    lines: q.items || []
                };
            }
        } catch (_) {}
    }

    // Xử lý các trạng thái hợp lệ
    if (!quote) {
        showBlockedState("Không tìm thấy thông tin báo giá", "Vui lòng chọn báo giá hợp lệ từ danh sách báo giá.");
        return;
    }

    renderQuoteData(quote);

    const st = (quote.status || "").toLowerCase();
    if (st === "converted") {
        showBlockedState(
            "Báo giá này đã được chuyển thành Hợp đồng!",
            `Báo giá <strong>${escapeHtml(quote.code)}</strong> đã tạo hợp đồng kinh tế trước đó. Bạn có thể xem hợp đồng trong danh mục Quản lý Hợp đồng.`
        );
        return;
    }

    if (st !== "approved" && st !== "accepted") {
        showBlockedState(
            "Báo giá này chưa được chấp nhận / phê duyệt!",
            `Trạng thái hiện tại của báo giá là <strong>${st.toUpperCase()}</strong>. Theo quy định kế toán, chỉ các báo giá đã có phê duyệt của Ban giám đốc hoặc khách hàng chấp nhận mới được khởi tạo hợp đồng.`
        );
        return;
    }

    // Báo giá hợp lệ -> Cho phép tạo hợp đồng
    if (blocked) blocked.hidden = true;
    if (createButton) createButton.disabled = false;

    // Khởi tạo các giá trị form mặc định
    setupDefaultFormValues();
}

function showBlockedState(title, message) {
    if (blocked) {
        blocked.hidden = false;
        if (blockedReasonTitle) {
            blockedReasonTitle.textContent = title;
        } else {
            blocked.innerHTML = `<strong>${title}</strong><br>${message}`;
        }
        if (blockedReasonDesc) blockedReasonDesc.innerHTML = message;
    }
    if (createButton) createButton.disabled = true;
}

function setupDefaultFormValues() {
    // 1. Tự sinh số HĐ mặc định
    const numInput = document.getElementById("contractNumber");
    if (numInput && !numInput.value) {
        numInput.value = generateContractNumber();
    }

    // 2. Ngày ký mặc định là hôm nay
    const signedInput = document.getElementById("signedDate");
    if (signedInput && !signedInput.value) {
        signedInput.value = todayString();
    }

    // 3. Ngày hiệu lực mặc định là hôm nay
    const effInput = document.getElementById("effectiveDate");
    if (effInput && !effInput.value) {
        effInput.value = todayString();
    }

    // 4. Ngày hết hạn mặc định 1 năm sau
    const expInput = document.getElementById("expiryDate");
    if (expInput && !expInput.value) {
        const nextYear = new Date();
        nextYear.setFullYear(nextYear.getFullYear() + 1);
        expInput.value = `${nextYear.getFullYear()}-${String(nextYear.getMonth() + 1).padStart(2, "0")}-${String(nextYear.getDate()).padStart(2, "0")}`;
    }

    // 5. Điều khoản thanh toán kế thừa từ báo giá hoặc mẫu mặc định
    const ptArea = document.getElementById("contractPaymentTerms");
    if (ptArea && !ptArea.value) {
        ptArea.value = quote?.paymentTerms || "Đợt 1: Tạm ứng 50% ngay sau khi ký hợp đồng. Đợt 2: Thanh toán 50% còn lại trong vòng 7 ngày sau khi nghiệm thu bàn giao.";
    }
}

/* =========================================================
   RENDER INHERITED QUOTE DATA (LOCKED READ-ONLY)
========================================================= */
function renderQuoteData(quote) {
    text("contractQuoteCode", quote.code || `BG-${quote.id}`);
    text("contractCustomer", quote.customer || "Khách hàng");
    text("contractOpportunity", quote.opportunity || "Cơ hội kinh doanh");
    text("contractTotal", money(quote.total));

    const ptArea = document.getElementById("contractPaymentTerms");
    if (ptArea && quote.paymentTerms) {
        ptArea.value = quote.paymentTerms;
    }

    const body = document.getElementById("contractLines");
    if (!body) return;
    body.innerHTML = "";

    const lines = quote.lines || [];
    if (lines.length === 0) {
        const tr = document.createElement("tr");
        tr.innerHTML = `<td colspan="6" style="text-align:center; padding:20px; color:var(--crm-muted);">Dịch vụ trọn gói theo báo giá ${escapeHtml(quote.code)}</td>`;
        body.appendChild(tr);
        return;
    }

    lines.forEach(line => {
        const qty = Number(line.quantity || 1);
        const price = Number(line.price || 0);
        const discount = Number(line.discount || line.discountPercent || 0);
        const vat = Number(line.vat || line.vatPercent || 10);
        
        let lineTotal = line.total !== undefined ? line.total : (qty * price * (1 - discount / 100));

        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>
                <strong style="color:var(--crm-text);">${escapeHtml(line.product || line.productName || "Gói dịch vụ")}</strong>
            </td>
            <td style="text-align:center;">${qty}</td>
            <td style="text-align:right;">${money(price)}</td>
            <td style="text-align:center;">${discount > 0 ? `${discount}%` : "—"}</td>
            <td style="text-align:center;">${vat}%</td>
            <td style="text-align:right; font-weight:700; color:var(--crm-primary);">${money(lineTotal)}</td>
        `;
        body.appendChild(tr);
    });
}

/* =========================================================
   FORM SUBMISSION & VALIDATION
========================================================= */
function bindPageEvents() {
    initContractPage();

    // Nút tự sinh số HĐ
    document.getElementById("btnAutoGenerateCode")?.addEventListener("click", () => {
        const numInput = document.getElementById("contractNumber");
        if (numInput) {
            numInput.value = generateContractNumber();
            clearFieldError("contractNumberError");
        }
    });

    // Dropdown chọn mẫu điều khoản thanh toán
    document.getElementById("contractPaymentTermsSelect")?.addEventListener("change", e => {
        const val = e.target.value;
        const textarea = document.getElementById("contractPaymentTerms");
        if (textarea && val && val !== "custom") {
            textarea.value = val;
            clearFieldError("paymentTermsError");
        }
    });

    // Real-time validation khi rời ô
    document.getElementById("contractNumber")?.addEventListener("blur", validateContractNumber);
    document.getElementById("expiryDate")?.addEventListener("change", validateDates);
    document.getElementById("effectiveDate")?.addEventListener("change", validateDates);

    // Xử lý Submit Form
    const contractForm = document.getElementById("contractForm");
    contractForm?.addEventListener("submit", async event => {
        event.preventDefault();

        if (!quote || (quote.status !== "approved" && quote.status !== "accepted")) {
            alert("Báo giá chưa được phê duyệt, không thể tạo hợp đồng!");
            return;
        }

        // Validate toàn diện
        let isValid = true;
        if (!validateContractNumber()) isValid = false;
        if (!validateDates()) isValid = false;

        const signed = value("signedDate");
        if (!signed) {
            setFieldError("signedDateError", "Vui lòng chọn ngày ký hợp đồng.");
            isValid = false;
        } else {
            clearFieldError("signedDateError");
        }

        const terms = value("contractPaymentTerms");
        if (!terms) {
            setFieldError("paymentTermsError", "Vui lòng nhập điều khoản thanh toán hợp đồng.");
            isValid = false;
        } else {
            clearFieldError("paymentTermsError");
        }

        if (!isValid) {
            const validationBox = document.getElementById("contractValidation");
            if (validationBox) validationBox.textContent = "Vui lòng kiểm tra và sửa các thông tin báo đỏ ở trên.";
            return;
        }

        // Lưu Hợp đồng & Đồng bộ trạng thái
        await processContractCreation();
    });
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bindPageEvents);
} else {
    bindPageEvents();
}

/* =========================================================
   VALIDATION HELPERS
========================================================= */
function validateContractNumber() {
    const num = value("contractNumber");
    if (!num) {
        setFieldError("contractNumberError", "Số hợp đồng là trường bắt buộc.");
        return false;
    }

    // Kiểm tra tính duy nhất (Unique validation)
    const contracts = getContracts();
    const isDuplicate = contracts.some(c => (c.contractNumber || "").toLowerCase() === num.toLowerCase());
    if (isDuplicate) {
        setFieldError("contractNumberError", `Số hợp đồng "${num}" đã tồn tại. Vui lòng nhập số khác hoặc bấm [⚡ Tự sinh số HĐ].`);
        return false;
    }

    clearFieldError("contractNumberError");
    return true;
}

function validateDates() {
    const effective = value("effectiveDate");
    const expiry = value("expiryDate");

    if (!effective) {
        setFieldError("effectiveDateError", "Vui lòng chọn ngày bắt đầu hiệu lực.");
        return false;
    }
    clearFieldError("effectiveDateError");

    // Ngày hết hạn phải >= ngày hiệu lực
    if (expiry && expiry < effective) {
        setFieldError("expiryDateError", "Ngày hết hạn không được nhỏ hơn ngày bắt đầu hiệu lực.");
        return false;
    }

    clearFieldError("expiryDateError");
    return true;
}

function setFieldError(elementId, msg) {
    const el = document.getElementById(elementId);
    if (el) el.textContent = msg;
}

function clearFieldError(elementId) {
    const el = document.getElementById(elementId);
    if (el) el.textContent = "";
}

/* =========================================================
   XỬ LÝ TẠO HỢP ĐỒNG & ĐỒNG BỘ TRẠNG THÁI (CORE LOGIC)
========================================================= */
async function processContractCreation() {
    const number = value("contractNumber");
    const signed = value("signedDate");
    const effective = value("effectiveDate");
    const expiry = value("expiryDate");
    const paymentTerms = value("contractPaymentTerms");
    const notes = value("contractNotes");

    const newContractId = `contract_${Date.now()}`;

    // 1. Tạo bản ghi Hợp đồng mới
    const contractData = {
        id: newContractId,
        contractNumber: number,
        signedDate: signed,
        effectiveDate: effective,
        expiryDate: expiry,
        paymentTerms: paymentTerms,
        notes: notes,
        quoteId: quote.id,
        quoteCode: quote.code || `BG-${quote.id}`,
        customer: quote.customer,
        customerId: quote.customerId,
        opportunity: quote.opportunity || "Cơ hội kinh doanh",
        opportunityId: quote.opportunityId,
        total: Number(quote.total || 0),
        subtotal: Number(quote.subtotal || 0),
        discountPercent: Number(quote.discountPercent || 0),
        vatPercent: Number(quote.vatPercent || 10),
        lines: quote.lines || [],
        status: "ACTIVE", // Đang hiệu lực
        createdAt: new Date().toISOString()
    };

    // 2. Lưu vào danh sách Hợp đồng (crm_ui_contracts)
    const contracts = getContracts();
    contracts.unshift(contractData);
    localStorage.setItem("crm_ui_contracts", JSON.stringify(contracts));

    // 3. Đồng bộ trạng thái Báo giá sang "Đã tạo hợp đồng" (converted)
    const quotes = getQuotes();
    const qIndex = quotes.findIndex(q => String(q.id) === String(quote.id));
    if (qIndex !== -1) {
        quotes[qIndex].status = "converted";
        quotes[qIndex].contractNumber = number;
        quotes[qIndex].contractId = newContractId;
    }
    localStorage.setItem("crm_ui_quotes", JSON.stringify(quotes));

    // 4. Đồng bộ trạng thái Cơ hội (Opportunity) sang "Đóng thắng" (Closed Won)
    syncOpportunityToWon(quote.opportunityId, quote.opportunity, quote.total);

    // 5. Thử gọi API Backend nếu có
    try {
        await fetch(`http://localhost:8080/crm/api/quotes/${quote.id}/convert-to-contract`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                contractNumber: number,
                signedDate: signed,
                effectiveDate: effective,
                expiryDate: expiry,
                paymentTerms: paymentTerms
            })
        });
    } catch (_) {
        // Backend có thể chưa chạy, dữ liệu đã lưu trữ trên localStorage
    }

    // 6. Hiển thị Modal thông báo thành công
    showSuccessModal(contractData);
}

function syncOpportunityToWon(oppId, oppName, contractAmount) {
    let opps = [];
    try {
        opps = JSON.parse(localStorage.getItem("crm_ui_opportunities")) || [];
    } catch (_) {
        opps = [];
    }

    let found = false;
    opps = opps.map(opp => {
        const matchId = oppId && String(opp.id) === String(oppId);
        const matchName = oppName && opp.name && opp.name.toLowerCase().trim() === oppName.toLowerCase().trim();

        if (matchId || matchName) {
            found = true;
            return {
                ...opp,
                stage: "5",
                stageId: 5,
                stageName: "Chốt thành công (Won)",
                status: "WON",
                probability: 100,
                amount: contractAmount,
                value: contractAmount,
                isWon: true,
                isLost: false,
                wonDate: todayString()
            };
        }
        return opp;
    });

    // Nếu chưa có trong danh sách cơ hội thì thêm mới để Pipeline hiển thị
    if (!found && (oppName || oppId)) {
        opps.push({
            id: oppId || Date.now(),
            name: oppName || "Cơ hội kinh doanh",
            customer: quote.customer,
            customerName: quote.customer,
            stage: "5",
            stageId: 5,
            stageName: "Chốt thành công (Won)",
            status: "WON",
            probability: 100,
            amount: contractAmount,
            value: contractAmount,
            isWon: true,
            isLost: false,
            wonDate: todayString(),
            owner: "Tôi"
        });
    }

    localStorage.setItem("crm_ui_opportunities", JSON.stringify(opps));
}

function showSuccessModal(contract) {
    const detailsBox = document.getElementById("successDetailsBox");
    if (detailsBox) {
        detailsBox.innerHTML = `
            <div><strong>Số hợp đồng:</strong> <span style="color:var(--crm-primary); font-weight:700;">${escapeHtml(contract.contractNumber)}</span></div>
            <div><strong>Khách hàng:</strong> ${escapeHtml(contract.customer)}</div>
            <div><strong>Cơ hội:</strong> ${escapeHtml(contract.opportunity)} <span style="color:#059669; font-weight:700;">→ Đã chốt Thắng (Won)!</span></div>
            <div><strong>Tổng giá trị chốt:</strong> <span style="font-weight:700; color:#059669;">${money(contract.total)}</span></div>
            <div><strong>Ngày ký:</strong> ${contract.signedDate} | <strong>Hiệu lực:</strong> ${contract.effectiveDate}</div>
        `;
    }

    const overlay = document.getElementById("contractSuccess");
    if (overlay) overlay.classList.add("open");
}

/* =========================================================
   DATA ACCESS HELPERS
========================================================= */
function getQuotes() {
    try {
        return JSON.parse(localStorage.getItem("crm_ui_quotes")) || [];
    } catch {
        return [];
    }
}

function getContracts() {
    try {
        return JSON.parse(localStorage.getItem("crm_ui_contracts")) || [];
    } catch {
        return [];
    }
}

function value(id) {
    return (document.getElementById(id)?.value || "").trim();
}

function text(id, val) {
    const el = document.getElementById(id);
    if (el) el.textContent = val ?? "";
}

function money(val) {
    return new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
        maximumFractionDigits: 0
    }).format(Number(val) || 0);
}

function escapeHtml(val) {
    return String(val ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}