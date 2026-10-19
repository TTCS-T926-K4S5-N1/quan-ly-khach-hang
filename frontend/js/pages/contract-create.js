"use strict";

const params = new URLSearchParams(window.location.search);
const quoteId = params.get("id");

const blocked = document.getElementById("contractBlocked");
const createButton = document.getElementById("createContractButton");
const contractForm = document.getElementById("contractForm");
const validationBox = document.getElementById("contractValidation");

let currentQuote = null;

async function initContractPage() {
    if (!quoteId) {
        showBlocked("Không tìm thấy ID báo giá trong đường dẫn. Vui lòng quay lại danh sách Báo giá để chọn.");
        return;
    }

    try {
        const res = await fetch(`api/quotes/${quoteId}`, { credentials: "include" });
        const json = await res.json();

        if (!json.success || !json.data) {
            showBlocked(json.message || "Không tìm thấy thông tin báo giá.");
            return;
        }

        currentQuote = json.data;
        renderQuoteData(currentQuote);

        const status = (currentQuote.status || "").toUpperCase();
        // Story 1: Kế toán chuyển một báo giá được chấp nhận (ACCEPTED) hoặc đã duyệt (APPROVED) thành hợp đồng
        if (status !== "APPROVED" && status !== "ACCEPTED") {
            showBlocked(`Báo giá này đang ở trạng thái <strong>${statusText(status)}</strong>. Chỉ báo giá <strong>Đã duyệt</strong> hoặc <strong>Khách chấp nhận</strong> mới được chuyển thành hợp đồng.`);
            return;
        }

        // Check if already converted
        if (status === "CONVERTED" || currentQuote.contractId) {
            showBlocked(`Báo giá này đã được chuyển thành hợp đồng trước đó (HĐ #${currentQuote.contractId || ""}).`);
            return;
        }

        blocked.hidden = true;
        createButton.disabled = false;

        // Auto prefill defaults
        const todayStr = new Date().toISOString().split("T")[0];
        const signedInput = document.getElementById("signedDate");
        const effectiveInput = document.getElementById("effectiveDate");
        const numberInput = document.getElementById("contractNumber");

        if (signedInput && !signedInput.value) signedInput.value = todayStr;
        if (effectiveInput && !effectiveInput.value) effectiveInput.value = todayStr;
        if (numberInput && !numberInput.value) {
            const rawCode = currentQuote.quoteNumber || ("BG-" + currentQuote.id);
            numberInput.value = "HD-" + rawCode.replace(/^BG-?/i, "");
        }
    } catch (err) {
        showBlocked("Lỗi kết nối máy chủ: " + err.message);
    }
}

function showBlocked(msgHtml) {
    if (blocked) {
        blocked.hidden = false;
        blocked.innerHTML = msgHtml;
    }
    if (createButton) createButton.disabled = true;
}

function renderQuoteData(q) {
    text("contractQuoteCode", q.quoteNumber || `BG-${q.id}`);
    text("contractCustomer", q.customerName || "—");
    text("contractOpportunity", q.opportunityName || "—");
    text("contractTotal", formatMoney(q.totalAmount));

    const termsInput = document.getElementById("contractPaymentTerms");
    if (termsInput && !termsInput.value) {
        termsInput.value = q.paymentTerms || "• Thanh toán 50% ngay sau khi ký kết hợp đồng.\n• Thanh toán 50% còn lại sau khi hoàn thành bàn giao và nghiệm thu.";
    }

    const tbody = document.getElementById("contractLines");
    if (!tbody) return;
    tbody.innerHTML = "";

    const items = q.items || [];
    if (items.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; color: var(--text-muted); padding: 1.5rem;">Báo giá không có sản phẩm nào.</td></tr>`;
        return;
    }

    items.forEach(item => {
        const tr = document.createElement("tr");
        const unitPrice = Number(item.unitPrice || 0);
        const qty = Number(item.quantity || 1);
        const discPercent = Number(item.discountPercent || 0);
        const lineTotal = Number(item.amount || (unitPrice * qty * (1 - discPercent / 100)));

        tr.innerHTML = `
            <td>
                <div style="font-weight: 600; color: var(--text-heading);">${escapeHtml(item.productName || item.productCode || "Sản phẩm")}</div>
                <small style="color: var(--text-muted);">${escapeHtml(item.productCode || "")} ${item.unit ? `(${escapeHtml(item.unit)})` : ""}</small>
            </td>
            <td style="text-align: center;">${qty}</td>
            <td style="text-align: right;">${formatMoney(unitPrice)}</td>
            <td style="text-align: center;">${discPercent > 0 ? discPercent + "%" : "0%"}</td>
            <td style="text-align: right; font-weight: 600; color: var(--primary);">${formatMoney(lineTotal)}</td>
        `;
        tbody.appendChild(tr);
    });
}

if (contractForm) {
    contractForm.addEventListener("submit", async event => {
        event.preventDefault();

        if (!currentQuote) return;

        const number = value("contractNumber");
        const signed = value("signedDate");
        const effective = value("effectiveDate");
        const expiry = value("expiryDate");
        const paymentTerms = value("contractPaymentTerms");

        if (!number || !signed || !effective) {
            showValidation("Vui lòng nhập đầy đủ Số hợp đồng (*), Ngày ký (*) và Ngày hiệu lực (*).", "error");
            return;
        }

        clearValidation();
        createButton.disabled = true;
        createButton.innerHTML = `<span class="crm-spinner" style="display:inline-block;width:1rem;height:1rem;border:2px solid #fff;border-top-color:transparent;border-radius:50%;animation:spin 0.6s linear infinite;margin-right:0.5rem;"></span> Đang xử lý...`;

        try {
            const payload = {
                quoteId: currentQuote.id,
                contractNumber: number,
                title: `Hợp đồng kinh tế - ${currentQuote.customerName || "Khách hàng"} (${number})`,
                signedDate: signed,
                effectiveDate: effective,
                expiryDate: expiry || null,
                paymentTerms: paymentTerms
            };

            const res = await fetch("api/contracts", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify(payload)
            });

            const json = await res.json();

            if (!res.ok || !json.success) {
                showValidation(json.message || "Tạo hợp đồng không thành công.", "error");
                createButton.disabled = false;
                createButton.innerHTML = "Tạo Hợp đồng";
                return;
            }

            const createdContract = json.data;
            const successOverlay = document.getElementById("contractSuccess");
            if (successOverlay) {
                const box = successOverlay.querySelector(".contract-success-box");
                if (box) {
                    box.innerHTML = `
                        <div class="success-check" style="width:64px;height:64px;border-radius:50%;background:rgba(16,185,129,0.15);color:#10b981;display:flex;align-items:center;justify-content:center;margin:0 auto 1.5rem auto;">
                            <svg style="width:36px;height:36px;stroke:currentColor;fill:none;stroke-width:2.5" viewBox="0 0 24 24"><path d="m5 12 4 4L19 6"/></svg>
                        </div>
                        <h2 style="font-size:1.5rem;font-weight:700;margin-bottom:0.75rem;color:var(--text-heading);">Tạo Hợp đồng thành công!</h2>
                        <div style="background:var(--surface-sunken, #f8fafc);border-radius:0.75rem;padding:1rem;margin-bottom:1.5rem;text-align:left;font-size:0.925rem;">
                            <p style="margin:0.25rem 0;"><strong>Số hợp đồng:</strong> <span style="color:var(--primary);">${escapeHtml(createdContract.contractNumber)}</span></p>
                            <p style="margin:0.25rem 0;"><strong>Giá trị hợp đồng:</strong> <span style="font-weight:600;color:#10b981;">${formatMoney(createdContract.totalAmount)}</span></p>
                            <p style="margin:0.25rem 0;"><strong>Trạng thái cơ hội:</strong> <span class="badge" style="background:rgba(16,185,129,0.15);color:#10b981;padding:0.2rem 0.5rem;border-radius:4px;font-weight:600;">Đóng thắng (WON)</span></p>
                            <p style="margin:0.25rem 0;color:var(--text-muted);font-size:0.85rem;">Bằng chữ: <em>${escapeHtml(createdContract.totalAmountInWords || "")}</em></p>
                        </div>
                        <div style="display:flex;gap:0.75rem;justify-content:center;flex-wrap:wrap;">
                            <a href="contract-print.html?id=${createdContract.id}" target="_blank" class="crm-btn" style="background:var(--primary);color:#fff;text-decoration:none;display:inline-flex;align-items:center;gap:0.5rem;">
                                <span>🖨️ In / Xuất PDF Hợp đồng</span>
                            </a>
                            <a href="quotations" class="crm-btn" style="background:var(--surface-overlay, #e2e8f0);color:var(--text-body);text-decoration:none;">
                                Quay lại Báo giá
                            </a>
                        </div>
                    `;
                }
                successOverlay.classList.add("open");
            }
        } catch (err) {
            showValidation("Lỗi kết nối máy chủ: " + err.message, "error");
            createButton.disabled = false;
            createButton.innerHTML = "Tạo Hợp đồng";
        }
    });
}

function showValidation(msg, type = "error") {
    if (!validationBox) return;
    validationBox.hidden = false;
    validationBox.style.display = "block";
    validationBox.style.padding = "0.75rem 1rem";
    validationBox.style.borderRadius = "0.5rem";
    validationBox.style.marginBottom = "1rem";
    validationBox.style.fontSize = "0.9rem";
    validationBox.style.fontWeight = "500";

    if (type === "error") {
        validationBox.style.background = "rgba(239, 68, 68, 0.12)";
        validationBox.style.color = "#dc2626";
        validationBox.style.border = "1px solid rgba(239, 68, 68, 0.25)";
    } else {
        validationBox.style.background = "rgba(16, 185, 129, 0.12)";
        validationBox.style.color = "#059669";
        validationBox.style.border = "1px solid rgba(16, 185, 129, 0.25)";
    }
    validationBox.textContent = msg;
}

function clearValidation() {
    if (!validationBox) return;
    validationBox.hidden = true;
    validationBox.style.display = "none";
    validationBox.textContent = "";
}

function statusText(st) {
    switch ((st || "").toUpperCase()) {
        case "DRAFT": return "Nháp";
        case "PENDING_APPROVAL": return "Chờ duyệt";
        case "APPROVED": return "Đã duyệt";
        case "SENT": return "Đã gửi khách";
        case "ACCEPTED": return "Khách chấp nhận";
        case "REJECTED": return "Khách từ chối";
        case "CONVERTED": return "Đã tạo hợp đồng";
        case "EXPIRED": return "Hết hiệu lực";
        default: return st || "—";
    }
}

function value(id) {
    const el = document.getElementById(id);
    return el ? el.value.trim() : "";
}

function text(id, val) {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
}

function formatMoney(amount) {
    return new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
        maximumFractionDigits: 0
    }).format(Number(amount) || 0);
}

function escapeHtml(value) {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

document.addEventListener("DOMContentLoaded", initContractPage);