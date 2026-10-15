"use strict";

const API_BASE = (function () {
    if (window.location.port === "8080" || window.location.pathname.startsWith("/crm")) {
        return "/crm";
    }
    return "http://localhost:8080/crm";
})();

let products = [];
let searchTimer = null;

// Pagination state
let currentPage = 1;
let pageSize = 10;
let totalItems = 0;
let totalPages = 1;

const productPagination = document.getElementById("productPagination");
const prodPaginationRange = document.getElementById("prodPaginationRange");
const prodPageSizeSelect = document.getElementById("prodPageSizeSelect");
const prodPaginationControls = document.getElementById("prodPaginationControls");


/* =========================================================
   DOM
========================================================= */

const body =
    document.getElementById(
        "productBody"
    );

const empty =
    document.getElementById(
        "productEmpty"
    );

const drawer =
    document.getElementById(
        "productDrawer"
    );

const overlay =
    document.getElementById(
        "productOverlay"
    );


/* =========================================================
   INIT
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        bindEvents();

        loadProducts();
    }
);


/* =========================================================
   API
========================================================= */

async function api(
    path,
    options = {}
) {

    const config = {
        credentials:
            "include",

        headers: {
            "Accept":
                "application/json",

            ...(options.body
                ? {
                    "Content-Type":
                        "application/json"
                }
                : {})
        },

        ...options
    };


    const response =
        await fetch(
            API_BASE + path,
            config
        );


    let result;

    try {

        result =
            await response.json();

    } catch {

        throw new Error(
            `HTTP ${response.status}`
        );
    }


    if (
        response.status === 401
    ) {

        window.location.href =
            "login";

        throw new Error(
            "Phiên đăng nhập đã hết hạn"
        );
    }


    if (
        !response.ok ||
        !result.success
    ) {

        throw new Error(
            result.message ||
            `HTTP ${response.status}`
        );
    }


    return result.data;
}


/* =========================================================
   LOAD
========================================================= */

async function loadProducts(targetPage = currentPage) {
    try {
        currentPage = targetPage;
        const params = new URLSearchParams();
        params.set("page", String(currentPage));
        params.set("size", String(pageSize));

        const keyword = value("productSearch");
        const status = value("productStatusFilter");

        if (keyword) {
            params.set("keyword", keyword);
        }

        if (status === "active") {
            params.set("active", "true");
        }

        if (status === "inactive" || status === "discontinued") {
            params.set("active", "false");
        }

        const query = params.toString();
        const data = await api("/api/products" + (query ? "?" + query : ""));

        products = Array.isArray(data?.items) ? data.items : [];
        totalItems = data?.totalItems !== undefined ? Number(data.totalItems) : products.length;
        totalPages = data?.totalPages !== undefined ? Math.max(1, Number(data.totalPages)) : 1;
        currentPage = data?.page !== undefined ? Number(data.page) : currentPage;

        render();
        renderPagination();

    } catch (error) {
        console.error("Load products error:", error);
        products = [];
        render();
        if (productPagination) productPagination.style.display = "none";
        if (empty) {
            empty.style.display = "flex";
            empty.textContent = error.message || "Không thể tải sản phẩm.";
        }
    }
}

function renderPagination() {
    if (!productPagination) return;
    if (totalItems === 0 || products.length === 0) {
        productPagination.style.display = "none";
        return;
    }

    productPagination.style.display = "flex";

    const start = (currentPage - 1) * pageSize + 1;
    const end = Math.min(currentPage * pageSize, totalItems);
    if (prodPaginationRange) {
        prodPaginationRange.textContent = `Hiển thị ${start} - ${end} / ${totalItems} sản phẩm (Trang ${currentPage}/${totalPages})`;
    }

    if (prodPageSizeSelect && prodPageSizeSelect.value !== String(pageSize)) {
        prodPageSizeSelect.value = String(pageSize);
    }

    if (!prodPaginationControls) return;
    prodPaginationControls.innerHTML = "";

    // 1. Nút Đầu «
    prodPaginationControls.appendChild(createPageBtn("«", 1, currentPage <= 1, false, "Trang đầu"));
    // 2. Nút Trước ‹
    prodPaginationControls.appendChild(createPageBtn("‹", currentPage - 1, currentPage <= 1, false, "Trang trước"));

    // 3. Số trang
    const pageNumbers = getPageRange(currentPage, totalPages);
    pageNumbers.forEach(p => {
        if (p === "...") {
            const ellipsis = document.createElement("span");
            ellipsis.className = "crm-pagination-ellipsis";
            ellipsis.textContent = "…";
            prodPaginationControls.appendChild(ellipsis);
        } else {
            prodPaginationControls.appendChild(createPageBtn(String(p), p, false, p === currentPage));
        }
    });

    // 4. Nút Sau ›
    prodPaginationControls.appendChild(createPageBtn("›", currentPage + 1, currentPage >= totalPages, false, "Trang sau"));
    // 5. Nút Cuối »
    prodPaginationControls.appendChild(createPageBtn("»", totalPages, currentPage >= totalPages, false, "Trang cuối"));
}

function createPageBtn(label, targetPage, disabled, isActive = false, title = "") {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = `crm-pagination-btn ${isActive ? "active" : ""}`;
    btn.textContent = label;
    if (title) btn.title = title;
    if (disabled) {
        btn.disabled = true;
    } else if (!isActive) {
        btn.addEventListener("click", () => {
            loadProducts(targetPage);
        });
    }
    return btn;
}

function getPageRange(current, total) {
    if (total <= 7) {
        return Array.from({ length: total }, (_, i) => i + 1);
    }
    const pages = [];
    pages.push(1);
    if (current > 3) pages.push("...");
    const start = Math.max(2, current - 1);
    const end = Math.min(total - 1, current + 1);
    for (let i = start; i <= end; i++) pages.push(i);
    if (current < total - 2) pages.push("...");
    pages.push(total);
    return pages;
}


/* =========================================================
   EVENTS
========================================================= */

function bindEvents() {

    document
        .getElementById(
            "addProduct"
        )
        ?.addEventListener(
            "click",
            () => openDrawer()
        );


    document
        .getElementById(
            "closeProductDrawer"
        )
        ?.addEventListener(
            "click",
            closeDrawer
        );


    document
        .getElementById(
            "cancelProduct"
        )
        ?.addEventListener(
            "click",
            closeDrawer
        );


    overlay
        ?.addEventListener(
            "click",
            closeDrawer
        );


    document
        .getElementById(
            "productSearch"
        )
        ?.addEventListener(
            "input",
            () => {

                clearTimeout(
                    searchTimer
                );

                searchTimer =
                    setTimeout(
                        () => {
                            currentPage = 1;
                            loadProducts(1);
                        },
                        300
                    );
            }
        );

    document
        .getElementById(
            "productStatusFilter"
        )
        ?.addEventListener(
            "change",
            () => {
                currentPage = 1;
                loadProducts(1);
            }
        );

    prodPageSizeSelect?.addEventListener(
        "change",
        (e) => {
            pageSize = Number(e.target.value) || 10;
            currentPage = 1;
            loadProducts(1);
        }
    );


    document
        .getElementById(
            "productTypeFilter"
        )
        ?.addEventListener(
            "change",
            render
        );


    document
        .getElementById(
            "productForm"
        )
        ?.addEventListener(
            "submit",
            async event => {

                event.preventDefault();

                await saveProductForm();
            }
        );


    document.addEventListener(
        "click",
        async event => {

            const edit =
                event.target.closest(
                    "[data-edit-product]"
                );


            if (edit) {

                openDrawer(
                    Number(
                        edit.dataset
                            .editProduct
                    )
                );

                return;
            }


            const discontinue =
                event.target.closest(
                    "[data-discontinue-product]"
                );


            if (discontinue) {

                const id =
                    Number(
                        discontinue.dataset
                            .discontinueProduct
                    );


                await discontinueProduct(
                    id
                );
            }
        }
    );
}


/* =========================================================
   SAVE
========================================================= */

async function saveProductForm() {

    const error =
        document.getElementById(
            "productError"
        );


    if (error) {

        error.textContent =
            "";
    }


    const code =
        value(
            "productCode"
        );

    const name =
        value(
            "productName"
        );


    if (
        !code ||
        !name
    ) {

        showError(
            "Mã sản phẩm và tên sản phẩm là bắt buộc."
        );

        return;
    }


    const listPrice =
        numberValue(
            "listPrice"
        );

    const floorPrice =
        numberValue(
            "floorPrice"
        );

    const costPrice =
        numberValue(
            "costPrice"
        );


    if (
        listPrice < 0 ||
        floorPrice < 0 ||
        costPrice < 0
    ) {

        showError(
            "Giá không được âm."
        );

        return;
    }


    if (
        floorPrice >
        listPrice
    ) {

        showError(
            "Giá sàn không được lớn hơn giá niêm yết."
        );

        return;
    }


    const status =
        value(
            "productStatus"
        );


    const payload = {

        code,

        name,

        type:
            value(
                "productType"
            ) || null,

        unit:
            value(
                "productUnit"
            ) || null,

        listPrice,

        floorPrice,

        costPrice,

        active:
            status !==
            "inactive" &&
            status !==
            "discontinued"
    };


    const editing =
        value(
            "editingProduct"
        );


    try {

        if (editing) {

            await api(
                `/api/products/${editing}`,
                {
                    method:
                        "PUT",

                    body:
                        JSON.stringify(
                            payload
                        )
                }
            );

        } else {

            await api(
                "/api/products",
                {
                    method:
                        "POST",

                    body:
                        JSON.stringify(
                            payload
                        )
                }
            );
        }


        closeDrawer();

        await loadProducts();

        if (editing) {
            if (typeof window.crmToast === "function") {
                window.crmToast("Cập nhật sản phẩm thành công!", "success");
            }
            alert("Cập nhật sản phẩm thành công!");
        } else {
            if (typeof window.crmToast === "function") {
                window.crmToast("Thêm sản phẩm thành công!", "success");
            }
            alert("Thêm sản phẩm thành công!");
        }


    } catch (error) {

        console.error(
            "Save product error:",
            error
        );


        showError(
            error.message
        );
    }
}


/* =========================================================
   DISCONTINUE
========================================================= */

async function discontinueProduct(
    id
) {

    const product =
        products.find(
            item =>
                Number(item.id)
                ===
                Number(id)
        );


    if (!product) {

        return;
    }


    const ok =
        window.confirm(
            `Ngừng kinh doanh sản phẩm "${product.name}"?`
        );


    if (!ok) {

        return;
    }


    try {

        await api(
            `/api/products/${id}`,
            {
                method:
                    "DELETE"
            }
        );


        await loadProducts();

        if (typeof window.crmToast === "function") {
            window.crmToast("Ngừng kinh doanh sản phẩm thành công!", "success");
        }
        alert("Ngừng kinh doanh sản phẩm thành công!");


    } catch (error) {

        console.error(
            "Discontinue product error:",
            error
        );


        alert(
            error.message ||
            "Không thể ngừng kinh doanh sản phẩm."
        );
    }
}


/* =========================================================
   DRAWER
========================================================= */

function openDrawer(
    id = null
) {

    document
        .getElementById(
            "productForm"
        )
        ?.reset();


    setValue(
        "editingProduct",
        ""
    );


    if (
        document.getElementById(
            "productError"
        )
    ) {

        document.getElementById(
            "productError"
        ).textContent =
            "";
    }


    if (id !== null) {

        const product =
            products.find(
                item =>
                    Number(item.id)
                    ===
                    Number(id)
            );


        if (product) {

            setValue(
                "editingProduct",
                product.id
            );

            setValue(
                "productCode",
                product.code
            );

            setValue(
                "productName",
                product.name
            );

            setValue(
                "productType",
                product.type || ""
            );

            setValue(
                "productUnit",
                product.unit || ""
            );

            setValue(
                "listPrice",
                product.listPrice ?? 0
            );

            setValue(
                "floorPrice",
                product.floorPrice ?? 0
            );

            setValue(
                "costPrice",
                product.costPrice ?? 0
            );

            setValue(
                "productStatus",
                product.active
                    ? "active"
                    : "inactive"
            );
        }

    } else {

        setValue(
            "productStatus",
            "active"
        );
    }


    drawer
        ?.classList
        .add(
            "open"
        );

    overlay
        ?.classList
        .add(
            "show"
        );

    document.body
        .classList
        .add(
            "drawer-open"
        );
}


function closeDrawer() {

    drawer
        ?.classList
        .remove(
            "open"
        );

    overlay
        ?.classList
        .remove(
            "show"
        );

    document.body
        .classList
        .remove(
            "drawer-open"
        );
}


/* =========================================================
   RENDER
========================================================= */

function render() {

    if (!body) {

        return;
    }


    const type =
        value(
            "productTypeFilter"
        );


    const filtered =
        products.filter(
            product => {

                if (
                    type &&
                    product.type !==
                    type
                ) {

                    return false;
                }


                return true;
            }
        );


    body.innerHTML =
        "";


    if (empty) {

        empty.style.display =
            filtered.length
                ? "none"
                : "flex";
    }


    for (
        const product
        of filtered
    ) {

        const tr =
            document.createElement(
                "tr"
            );


        const status =
            product.active
                ? "active"
                : "inactive";


        tr.innerHTML = `

            <td class="product-code">
                ${escapeHtml(product.code)}
            </td>

            <td>
                ${escapeHtml(product.name)}
            </td>

            <td>
                ${
                    product.type ===
                    "subscription"

                    ? "Dịch vụ thuê bao"

                    : "Sản phẩm một lần"
                }
            </td>

            <td>
                ${escapeHtml(
                    product.unit ||
                    "—"
                )}
            </td>

            <td>
                ${money(
                    product.listPrice
                )}
            </td>

            <td>
                ${money(
                    product.floorPrice
                )}
            </td>

            <td>
                ${
                    product.costPrice ===
                    undefined

                    ? "Không có quyền xem"

                    : money(
                        product.costPrice
                    )
                }
            </td>

            <td>

                <span
                    class="product-status ${status}"
                >
                    ${
                        product.active
                            ? "Đang bán"
                            : "Ngừng kinh doanh"
                    }
                </span>

            </td>

            <td>

                <button
                    type="button"
                    class="product-action"
                    data-edit-product="${product.id}"
                >
                    Sửa
                </button>

                ${
                    product.active

                    ? `
                    <button
                        type="button"
                        class="product-action"
                        data-discontinue-product="${product.id}"
                    >
                        Ngừng bán
                    </button>
                    `

                    : ""
                }

            </td>
        `;


        body.appendChild(
            tr
        );
    }
}


/* =========================================================
   HELPERS
========================================================= */

function showError(
    message
) {

    const error =
        document.getElementById(
            "productError"
        );


    if (error) {

        error.textContent =
            message || "";
    }
}


function value(
    id
) {

    const element =
        document.getElementById(
            id
        );


    return (
        element?.value ??
        ""
    )
        .toString()
        .trim();
}


function setValue(
    id,
    newValue
) {

    const element =
        document.getElementById(
            id
        );


    if (element) {

        element.value =
            newValue ?? "";
    }
}


function numberValue(
    id
) {

    const raw =
        value(id);


    if (!raw) {

        return 0;
    }


    const number =
        Number(raw);


    return Number.isFinite(
        number
    )
        ? number
        : 0;
}


function money(
    value
) {

    const number =
        Number(
            value ?? 0
        );


    return new Intl.NumberFormat(
        "vi-VN",
        {
            style:
                "currency",

            currency:
                "VND",

            maximumFractionDigits:
                0
        }
    )
        .format(number);
}


function escapeHtml(
    value
) {

    return String(
        value ?? ""
    )
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /'/g,
            "&#039;"
        );
}