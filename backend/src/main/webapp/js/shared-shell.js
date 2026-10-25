"use strict";

(function () {

    const API_BASE =
        "http://localhost:8080/crm";


    const currentPage =
        window.location.pathname
            .split("/")
            .pop()
            .replace(/\.html$/, "")
        ||
        "dashboard";


    let currentSession = null;
    let currentMenu = [];


    /* =====================================================
       ICON
    ===================================================== */

    function icon(name) {

        const icons = {

            dashboard:
                `<svg viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>`,

            customer:
                `<svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 3.6-7 8-7s8 3 8 7"/></svg>`,

            form:
                `<svg viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><line x1="10" y1="9" x2="8" y2="9"/></svg>`,

            campaign:
                `<svg viewBox="0 0 24 24"><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07M3 11v2a2 2 0 0 0 2 2h2l5 4V5L7 9H5a2 2 0 0 0-2 2Z"/></svg>`,

            routing:
                `<svg viewBox="0 0 24 24"><circle cx="6" cy="19" r="3"/><path d="M9 19h8.5a3.5 3.5 0 0 0 0-7h-11a3.5 3.5 0 0 1 0-7H15"/><circle cx="18" cy="5" r="3"/></svg>`,

            opportunity:
                `<svg viewBox="0 0 24 24"><path d="m12 3 7 7-7 7-7-7 7-7Z"/><path d="M12 17v4"/></svg>`,

            activity:
                `<svg viewBox="0 0 24 24"><path d="m4 12 4 4L20 4"/><path d="M4 20h16"/></svg>`,

            task:
                `<svg viewBox="0 0 24 24"><path d="m5 12 4 4L19 6"/></svg>`,

            calendar:
                `<svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18"/></svg>`,

            quote:
                `<svg viewBox="0 0 24 24"><path d="M5 3h14v18H5z"/><path d="M8 8h8M8 12h8M8 16h5"/></svg>`,

            product:
                `<svg viewBox="0 0 24 24"><path d="m12 3 8 4-8 4-8-4 8-4Z"/><path d="m4 7 8 4 8-4v10l-8 4-8-4V7Z"/></svg>`,

            users:
                `<svg viewBox="0 0 24 24"><circle cx="9" cy="8" r="3"/><circle cx="17" cy="9" r="2"/><path d="M3 20c0-4 2.7-7 6-7s6 3 6 7"/><path d="M15 14c3 0 5 2 5 5"/></svg>`,

            organization:
                `<svg viewBox="0 0 24 24"><rect x="9" y="3" width="6" height="5"/><rect x="3" y="16" width="6" height="5"/><rect x="15" y="16" width="6" height="5"/><path d="M12 8v4M6 16v-4h12v4"/></svg>`,

            import:
                `<svg viewBox="0 0 24 24"><path d="M12 3v12m-4-4 4 4 4-4M4 17v4h16v-4"/><path d="M4 7V3h16v4"/></svg>`,

            audit:
                `<svg viewBox="0 0 24 24"><rect x="5" y="3" width="14" height="18" rx="2"/><path d="M8 8h8M8 12h8M8 16h5"/></svg>`,

            master:
                `<svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="6" rx="1"/><rect x="3" y="14" width="18" height="6" rx="1"/><path d="M7 7h1M7 17h1"/></svg>`,

            custom:
                `<svg viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M12 7v10M7 12h10"/></svg>`,

            winLoss:
                `<svg viewBox="0 0 24 24"><path d="M4 4h16v5c0 4-3 7-8 7S4 13 4 9V4ZM8 20h8M12 16v4M4 7H2v2c0 2 1 3 3 3m15-5h2v2c0 2-1 3-3 3"/></svg>`,

            leadScoring:
                `<svg viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`,

            settings:
                `<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19 12a7 7 0 0 0-.1-1l2-1.5-2-3.4-2.5 1A7 7 0 0 0 15 6l-.4-2.7h-4L10 6a7 7 0 0 0-1.4.8l-2.5-1-2 3.4L6 11a7 7 0 0 0 0 2l-2 1.5 2 3.4 2.5-1A7 7 0 0 0 10 18l.5 2.7h4L15 18a7 7 0 0 0 1.4-.8l2.5 1 2-3.4L19 13a7 7 0 0 0 0-1Z"/></svg>`,

            mail:
                `<svg viewBox="0 0 24 24"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>`,

            bell:
                `<svg viewBox="0 0 24 24"><path d="M18 8a6 6 0 1 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"/><path d="M10 21h4"/></svg>`,

            moon:
                `<svg viewBox="0 0 24 24"><path d="M20 15a8 8 0 1 1-11-11 7 7 0 0 0 11 11Z"/></svg>`,

            report:
                `<svg viewBox="0 0 24 24"><path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/><circle cx="19" cy="9" r="1.5"/></svg>`,

            "pie-chart":
                `<svg viewBox="0 0 24 24"><path d="M21.21 15.89A10 10 0 1 1 8 2.83"/><path d="M22 12A10 10 0 0 0 12 2v10z"/></svg>`,

            sun:
                `<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>`
        };

        return icons[name] || "";
    }


    function escapeHtml(value) {

        return String(
            value ?? ""
        )
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }


    /* =====================================================
       STATIC SHELL
    ===================================================== */

    const sidebar =
        document.querySelector(
            ".crm-sidebar"
        );


    if (sidebar) {

        sidebar.innerHTML = `
            <div class="crm-brand">

                <div class="crm-brand-mark">
                    C
                </div>

                <span class="crm-brand-name">
                    Corporate CRM
                </span>

            </div>

            <nav
                id="desktopNavigation"
                class="crm-nav"
            ></nav>
        `;
    }


    const topbar =
        document.querySelector(
            ".crm-topbar"
        );


    if (topbar) {

        topbar.innerHTML = `
            <div class="crm-search">

                <svg viewBox="0 0 24 24">
                    <circle cx="11" cy="11" r="7"/>
                    <path d="m20 20-4-4"/>
                </svg>

                <input
                    id="globalSearch"
                    type="search"
                    placeholder="Tìm kiếm... (Ctrl + K)"
                >

                <kbd>
                    Ctrl K
                </kbd>

            </div>


            <div class="crm-top-actions">

                <button
                    id="themeToggle"
                    class="crm-shell-icon-button"
                    type="button"
                    title="Đổi giao diện"
                >
                    ${icon("moon")}
                </button>


                <div class="crm-notification-wrapper" style="position: relative;">
                    <button
                        id="notificationButton"
                        class="crm-shell-icon-button crm-notification-button"
                        type="button"
                        title="Thông báo"
                    >
                        ${icon("bell")}
                        <span id="shellNotificationBadge" class="crm-notification-badge" style="display:none;">0</span>
                    </button>

                    <div id="crmNotificationPanel" class="crm-notification-dropdown" style="display:none;">
                        <div class="notif-dropdown-header">
                            <div style="display:flex; align-items:center; gap:8px;">
                                <span style="font-weight:700; font-size:14px; color:var(--crm-text);">Thông báo</span>
                                <span id="notifUnreadBadgePill" class="notif-unread-pill" style="display:none;">0 mới</span>
                            </div>
                            <div style="display:flex; align-items:center; gap:6px;">
                                <button id="btnNotifPreferences" class="notif-settings-btn" type="button" title="Cài đặt thông báo cá nhân">⚙️</button>
                                <button id="btnMarkAllNotifsRead" class="notif-read-all-btn" type="button">Đánh dấu tất cả đã đọc</button>
                            </div>
                        </div>
                        <div id="notifListContainer" class="notif-list-container">
                            <div class="notif-empty-state">Đang tải thông báo...</div>
                        </div>
                        <div class="notif-dropdown-footer">
                            <a href="activities" style="text-decoration:none; color:var(--crm-primary); font-size:12px; font-weight:600;">Xem tất cả công việc & hoạt động →</a>
                        </div>
                    </div>
                </div>


                <div class="crm-user">

                    <button
                        id="userButton"
                        class="crm-user-button"
                        type="button"
                    >

                        <div class="crm-avatar">
                            U
                        </div>

                        <div class="crm-user-copy">

                            <span
                                id="shellUserName"
                                class="crm-user-name"
                            >
                                Đang tải...
                            </span>

                            <span
                                id="shellUserRole"
                                class="crm-user-role"
                            >
                                ...
                            </span>

                        </div>

                        <span class="crm-user-arrow">
                            ⌄
                        </span>

                    </button>


                    <div
                        id="userDropdown"
                        class="crm-user-dropdown"
                    >

                        <div
                            id="shellUserTeam"
                            style="
                                padding: 10px 14px;
                                font-size: 12px;
                                opacity: .7;
                            "
                        >
                            Nhóm: ...
                        </div>

                        <a href="profile">
                            Hồ sơ cá nhân
                        </a>

                        <a href="javascript:void(0)" id="shellOpenNotifSettings">
                            ⚙️ Cài đặt thông báo
                        </a>

                        <a href="change-password">
                            Đổi mật khẩu
                        </a>

                        <button
                            id="logoutButton"
                            type="button"
                        >
                            Đăng xuất
                        </button>

                    </div>

                </div>

            </div>
        `;
    }


    const mobileHeader =
        document.querySelector(
            ".crm-mobile-header"
        );


    if (mobileHeader) {

        mobileHeader.innerHTML = `
            <button
                id="mobileMenuButton"
                class="crm-mobile-menu"
                type="button"
                aria-label="Mở menu"
            >
                ☰
            </button>

            <strong>
                Corporate CRM
            </strong>

            <div class="crm-avatar">
                U
            </div>
        `;
    }


    const mobileDrawer =
        document.querySelector(
            ".crm-mobile-drawer"
        );


    if (mobileDrawer) {

        mobileDrawer.innerHTML = `
            <div class="crm-drawer-header">

                <div class="crm-avatar">
                    U
                </div>

                <div class="crm-drawer-user">

                    <strong id="mobileUserName">
                        Đang tải...
                    </strong>

                    <span id="mobileUserRole">
                        ...
                    </span>

                    <span id="mobileUserTeam">
                        ...
                    </span>

                </div>

            </div>

            <nav
                id="mobileNavigation"
                class="crm-nav"
            ></nav>
        `;
    }


    /* =====================================================
       API
    ===================================================== */

    async function api(path) {

        const response =
            await fetch(
                API_BASE + path,
                {
                    credentials:
                        "include",

                    headers: {
                        "Accept":
                            "application/json"
                    }
                }
            );


        const result =
            await response
                .json()
                .catch(
                    () => ({
                        success: false,
                        message:
                            "Phản hồi API không hợp lệ"
                    })
                );


        if (
            response.status === 401
        ) {

            window.location.href =
                "login";

            throw new Error(
                "Chưa đăng nhập"
            );
        }


        if (!response.ok) {

            throw new Error(
                result.message
                ||
                "Không thể tải dữ liệu"
            );
        }


        return result;
    }


    /* =====================================================
       NAVIGATION
    ===================================================== */

    function renderNavigation(
        target
    ) {

        if (!target) {
            return;
        }


        const workspace =
            currentMenu.filter(
                item =>
                    item.section ===
                    "workspace"
            );


        const admin =
            currentMenu.filter(
                item =>
                    item.section ===
                    "admin"
            );


        let html = "";


        if (workspace.length) {

            html += `
                <div class="crm-nav-section">
                    KHÔNG GIAN LÀM VIỆC
                </div>
            `;


            html +=
                workspace
                    .map(
                        navigationItemHtml
                    )
                    .join("");
        }


        if (admin.length) {

            html += `
                <div class="crm-nav-section">
                    QUẢN TRỊ
                </div>
            `;


            html +=
                admin
                    .map(
                        navigationItemHtml
                    )
                    .join("");
        }


        target.innerHTML =
            html;
    }


    function navigationItemHtml(item) {

        const itemClean = (item.path || "").replace(/\.html$/, "");
        const currentClean = (currentPage || "").replace(/\.html$/, "");
        const active =
            currentClean === itemClean
            ?
            " active"
            :
            "";


        return `
            <a
                href="${escapeHtml(itemClean)}"
                class="crm-nav-item${active}"
                title="${escapeHtml(item.label)}"
            >

                <span class="crm-nav-icon">
                    ${icon(item.icon)}
                </span>

                <span class="crm-nav-label">
                    ${escapeHtml(item.label)}
                </span>

            </a>
        `;
    }


    /* =====================================================
       USER
    ===================================================== */

    function roleText() {

        const roles =
            Array.isArray(
                currentSession?.roles
            )
            ?
            currentSession.roles
            :
            [];


        if (!roles.length) {

            return "Chưa có vai trò";
        }


        return roles
            .map(
                role =>
                    role.name
                    ||
                    role.code
            )
            .filter(Boolean)
            .join(", ");
    }


    function userInitial() {

        const name =
            currentSession?.fullName
            ||
            currentSession?.email
            ||
            "U";


        return name
            .trim()
            .charAt(0)
            .toUpperCase()
            ||
            "U";
    }


    function renderUser() {

        if (!currentSession) {
            return;
        }


        const fullName =
            currentSession.fullName
            ||
            currentSession.email
            ||
            "Người dùng";


        const role =
            roleText();


        const team =
            currentSession.teamName
            ||
            "Chưa thuộc nhóm";


        document
            .querySelectorAll(
                "#shellUserName, #mobileUserName"
            )
            .forEach(
                element => {

                    element.textContent =
                        fullName;
                }
            );


        document
            .querySelectorAll(
                "#shellUserRole, #mobileUserRole"
            )
            .forEach(
                element => {

                    element.textContent =
                        role;
                }
            );


        document
            .querySelectorAll(
                "#mobileUserTeam"
            )
            .forEach(
                element => {

                    element.textContent =
                        `Nhóm: ${team}`;
                }
            );


        const teamElement =
            document.getElementById(
                "shellUserTeam"
            );


        if (teamElement) {

            teamElement.textContent =
                `Nhóm: ${team}`;
        }


        document
            .querySelectorAll(
                ".crm-avatar"
            )
            .forEach(
                element => {

                    if (
                        !element.style.backgroundImage
                    ) {

                        element.textContent =
                            userInitial();
                    }
                }
            );
    }


    async function hydrateShell() {

        try {

            const [
                sessionResult,
                menuResult
            ] =
                await Promise.all([
                    api(
                        "/api/auth/session"
                    ),
                    api(
                        "/api/navigation/menu"
                    )
                ]);


            currentSession =
                sessionResult.data;


            currentMenu =
                Array.isArray(
                    menuResult.data?.menuItems
                )
                ?
                menuResult.data.menuItems
                :
                [];


            renderUser();


            renderNavigation(
                document.getElementById(
                    "desktopNavigation"
                )
            );


            renderNavigation(
                document.getElementById(
                    "mobileNavigation"
                )
            );


            document.dispatchEvent(
                new CustomEvent(
                    "crm:shell-ready",
                    {
                        detail: {
                            session:
                                currentSession,

                            menu:
                                currentMenu
                        }
                    }
                )
            );

        } catch (error) {

            console.error(
                "CRM shell load error:",
                error
            );

            // Fallback khi chạy không có backend Java (ví dụ Live Server port 5500)
            currentSession = currentSession || {
                fullName: "Giám đốc Kinh doanh",
                email: "sales.director@crm.vn",
                roles: [{ name: "Giám đốc kinh doanh", code: "SALES_DIRECTOR" }],
                teamName: "Khối Kinh doanh Toàn quốc"
            };

            currentMenu = [
                { section: "workspace", path: "dashboard", label: "Tổng quan", icon: "dashboard" },
                { section: "workspace", path: "customers", label: "Khách hàng", icon: "customer" },
                { section: "workspace", path: "pipeline", label: "Cơ hội", icon: "opportunity" },
                { section: "workspace", path: "calendar", label: "Lịch", icon: "calendar" },
                { section: "workspace", path: "tasks", label: "Công việc", icon: "task" },
                { section: "workspace", path: "quotations", label: "Báo giá", icon: "quote" },
                { section: "workspace", path: "products", label: "Sản phẩm", icon: "product" },
                { section: "admin", path: "lead-scoring", label: "Chấm điểm Lead", icon: "leadScoring" },
                { section: "admin", path: "organization", label: "Cơ cấu tổ chức", icon: "organization" },
                { section: "admin", path: "master-data", label: "Danh mục dùng chung", icon: "master" },
                { section: "admin", path: "custom-fields", label: "Trường tùy chỉnh", icon: "custom" },
                { section: "admin", path: "win-loss-settings", label: "Win / Loss", icon: "winLoss" },
                { section: "admin", path: "pipeline-settings", label: "Cấu hình Pipeline", icon: "settings" },
                { section: "admin", path: "document-templates", label: "Mẫu tài liệu PDF", icon: "settings" }
            ];

            renderUser();

            renderNavigation(
                document.getElementById(
                    "desktopNavigation"
                )
            );

            renderNavigation(
                document.getElementById(
                    "mobileNavigation"
                )
            );
        }
    }


    /* =====================================================
       THEME
    ===================================================== */

    const themeKey =
        "crm_ui_theme";


    function applyTheme(theme) {

        document
            .documentElement
            .setAttribute(
                "data-crm-theme",
                theme
            );


        localStorage.setItem(
            themeKey,
            theme
        );


        const button =
            document.getElementById(
                "themeToggle"
            );


        if (button) {

            button.innerHTML =
                theme === "dark"
                ?
                icon("sun")
                :
                icon("moon");
        }
    }


    applyTheme(
        localStorage.getItem(
            themeKey
        )
        ||
        "light"
    );


    document
        .getElementById(
            "themeToggle"
        )
        ?.addEventListener(
            "click",
            () => {

                const current =
                    document
                        .documentElement
                        .getAttribute(
                            "data-crm-theme"
                        );


                applyTheme(
                    current === "dark"
                    ?
                    "light"
                    :
                    "dark"
                );
            }
        );


    /* =====================================================
       DROPDOWN
    ===================================================== */

    const userButton =
        document.getElementById(
            "userButton"
        );


    const userDropdown =
        document.getElementById(
            "userDropdown"
        );


    userButton
        ?.addEventListener(
            "click",
            event => {

                event.stopPropagation();

                userDropdown
                    ?.classList
                    .toggle(
                        "open"
                    );
            }
        );


    document.addEventListener(
        "click",
        event => {

            if (
                userDropdown
                &&
                !userDropdown.contains(
                    event.target
                )
                &&
                !userButton?.contains(
                    event.target
                )
            ) {

                userDropdown
                    .classList
                    .remove(
                        "open"
                    );
            }
        }
    );


    /* =====================================================
       LOGOUT
    ===================================================== */

    document
        .getElementById(
            "logoutButton"
        )
        ?.addEventListener(
            "click",
            async () => {

                try {

                    await fetch(
                        API_BASE +
                        "/api/auth/logout",
                        {
                            method:
                                "POST",

                            credentials:
                                "include"
                        }
                    );

                } catch (error) {

                    console.error(
                        "Logout error:",
                        error
                    );

                } finally {

                    sessionStorage.clear();

                    window.location.href =
                        "login";
                }
            }
        );


    /* =====================================================
       MOBILE DRAWER
    ===================================================== */

    const mobileMenuButton =
        document.getElementById(
            "mobileMenuButton"
        );


    const drawerOverlay =
        document.getElementById(
            "drawerOverlay"
        );


    function closeMobileDrawer() {

        mobileDrawer
            ?.classList
            .remove(
                "open"
            );


        drawerOverlay
            ?.classList
            .remove(
                "open"
            );


        document.body
            .classList
            .remove(
                "mobile-menu-open"
            );
    }


    mobileMenuButton
        ?.addEventListener(
            "click",
            event => {

                if (
                    window.innerWidth > 768
                ) {
                    return;
                }


                event.stopPropagation();


                mobileDrawer
                    ?.classList
                    .add(
                        "open"
                    );


                drawerOverlay
                    ?.classList
                    .add(
                        "open"
                    );


                document.body
                    .classList
                    .add(
                        "mobile-menu-open"
                    );
            }
        );


    drawerOverlay
        ?.addEventListener(
            "click",
            closeMobileDrawer
        );


    /* =====================================================
       AVATAR
    ===================================================== */

    function updateAvatar() {

        const avatar =
            localStorage.getItem(
                "crm_ui_profile_avatar"
            );


        if (!avatar) {

            renderUser();

            return;
        }


        document
            .querySelectorAll(
                ".crm-avatar"
            )
            .forEach(
                element => {

                    element.textContent =
                        "";

                    element.style.backgroundImage =
                        `url("${avatar}")`;

                    element.style.backgroundSize =
                        "cover";

                    element.style.backgroundPosition =
                        "center";
                }
            );
    }


    window.crmUpdateGlobalAvatar =
        updateAvatar;


    /* =====================================================
       SEARCH SHORTCUT
    ===================================================== */

    document.addEventListener(
        "keydown",
        event => {

            if (
                (
                    event.ctrlKey
                    ||
                    event.metaKey
                )
                &&
                event.key.toLowerCase()
                ===
                "k"
            ) {

                event.preventDefault();

                document
                    .getElementById(
                        "globalSearch"
                    )
                    ?.focus();
            }
        }
    );



    /* =====================================================
       MOBILE BOTTOM NAV
       Render dùng chung cho mọi trang.
    ===================================================== */

    function ensureMobileBottomNav() {

        let bottomNav =
            document.querySelector(
                ".crm-bottom-nav"
            );


        if (!bottomNav) {

            bottomNav =
                document.createElement(
                    "nav"
                );

            bottomNav.className =
                "crm-bottom-nav";

            document.body.appendChild(
                bottomNav
            );
        }


        const items = [
            {
                label:
                    "Tổng quan",

                path:
                    "dashboard",

                icon:
                    "dashboard"
            },

            {
                label:
                    "Khách hàng",

                path:
                    "customers.html",

                icon:
                    "customer"
            },

            {
                label:
                    "Cơ hội",

                path:
                    "pipeline.html",

                icon:
                    "opportunity"
            },

            {
                label:
                    "Lịch",

                path:
                    "calendar.html",

                icon:
                    "calendar"
            }
        ];


        bottomNav.innerHTML =
            items
                .map(
                    item => {

                        const active =
                            currentPage ===
                            item.path
                            ?
                            " active"
                            :
                            "";


                        return `
                            <a
                                href="${item.path}"
                                class="crm-bottom-item${active}"
                            >

                                <span class="crm-bottom-icon">
                                    ${icon(item.icon)}
                                </span>

                                <span>
                                    ${escapeHtml(item.label)}
                                </span>

                            </a>
                        `;
                    }
                )
                .join("");
    }

    /* =====================================================
       START
    ===================================================== */

    ensureMobileBottomNav();

    hydrateShell()
        .then(
            () => {
                updateAvatar();
                ensureMobileBottomNav();
            }
        );

})();
/* =========================================================
   MOBILE MENU CLICK - HARD FIX
========================================================= */

(function () {

    document.addEventListener(
        "click",
        function (event) {

            const button =
                event.target.closest(
                    "#mobileMenuButton"
                );

            if (!button) {
                return;
            }

            event.preventDefault();
            event.stopPropagation();

            const drawer =
                document.getElementById(
                    "mobileDrawer"
                );

            const overlay =
                document.getElementById(
                    "drawerOverlay"
                );


            if (!drawer) {

                console.error(
                    "mobileDrawer not found"
                );

                return;
            }


            drawer
                .classList
                .add(
                    "open"
                );


            overlay
                ?.classList
                .add(
                    "open"
                );


            document.body
                .classList
                .add(
                    "mobile-menu-open"
                );

        },
        true
    );


    document.addEventListener(
        "click",
        function (event) {

            const overlay =
                event.target.closest(
                    "#drawerOverlay"
                );

            if (!overlay) {
                return;
            }

            const drawer =
                document.getElementById(
                    "mobileDrawer"
                );


            drawer
                ?.classList
                .remove(
                    "open"
                );


            overlay
                .classList
                .remove(
                    "open"
                );


            document.body
                .classList
                .remove(
                    "mobile-menu-open"
                );
        },
        true
    );

})();
/* =========================================================
   SHELL INTERACTIONS - STABLE FIX
   Search / Theme / Notification / User dropdown
========================================================= */

(function () {

    function byId(id) {
        return document.getElementById(id);
    }


    function closeShellPanels() {

        byId("userDropdown")
            ?.classList
            .remove("open");

        byId("crmNotificationPanel")
            ?.classList
            .remove("open");

        byId("crmSearchPanel")
            ?.classList
            .remove("open");
    }


    /* =====================================================
       THEME
    ===================================================== */

    function shellToggleTheme() {

        /*
         * Project hiện tại đã có theme.js.
         * Ưu tiên dùng hàm chung của theme.js để không tạo
         * hai chuẩn data-theme / data-crm-theme khác nhau.
         */
        if (
            typeof window.crmToggleTheme
            ===
            "function"
        ) {

            window.crmToggleTheme();

            return;
        }


        const root =
            document.documentElement;

        const current =
            root.getAttribute(
                "data-theme"
            )
            ||
            "light";

        const next =
            current === "dark"
            ?
            "light"
            :
            "dark";


        root.setAttribute(
            "data-theme",
            next
        );

        localStorage.setItem(
            "crm_ui_theme",
            next
        );
    }


    /* =====================================================
       USER DROPDOWN
    ===================================================== */

    function toggleUserDropdown() {

        const dropdown =
            byId(
                "userDropdown"
            );

        if (!dropdown) {
            return;
        }


        byId("crmNotificationPanel")
            ?.classList
            .remove("open");

        byId("crmSearchPanel")
            ?.classList
            .remove("open");


        dropdown
            .classList
            .toggle(
                "open"
            );
    }


    /* =====================================================
       NOTIFICATIONS
    ===================================================== */

    function ensureNotificationPanel() {

        let panel =
            byId(
                "crmNotificationPanel"
            );

        if (panel) {

            return panel;
        }


        panel =
            document.createElement(
                "div"
            );

        panel.id =
            "crmNotificationPanel";

        panel.className =
            "crm-notification-panel";


        /*
         * Hiện project chưa có API notification.
         * Không tạo notification giả.
         */
        panel.innerHTML = `
            <div class="crm-shell-panel-header">
                <strong>Thông báo</strong>
            </div>

            <div class="crm-shell-panel-empty">
                Chưa có thông báo.
            </div>
        `;


        document.body
            .appendChild(
                panel
            );


        return panel;
    }


    function toggleNotifications() {

        const panel =
            ensureNotificationPanel();


        byId("userDropdown")
            ?.classList
            .remove("open");

        byId("crmSearchPanel")
            ?.classList
            .remove("open");


        panel.classList.toggle(
            "open"
        );
    }


    /* =====================================================
       GLOBAL SEARCH
       Hiện chưa có API global-search backend.
       Search này tìm chức năng/menu mà account có quyền.
    ===================================================== */

    function ensureSearchPanel() {

        let panel =
            byId(
                "crmSearchPanel"
            );

        if (panel) {

            return panel;
        }


        panel =
            document.createElement(
                "div"
            );

        panel.id =
            "crmSearchPanel";

        panel.className =
            "crm-search-panel";


        document.body
            .appendChild(
                panel
            );


        return panel;
    }


    function normalizeText(value) {

        return String(
            value ?? ""
        )
            .normalize("NFD")
            .replace(
                /[\u0300-\u036f]/g,
                ""
            )
            .toLowerCase()
            .trim();
    }


    function getSearchableMenu() {

        /*
         * Dùng menu thật đã render từ backend permission,
         * không hard-code lại quyền.
         */
        return Array
            .from(
                document.querySelectorAll(
                    "#desktopNavigation a.crm-nav-item"
                )
            )
            .map(
                link => ({
                    label:
                        link.textContent
                            .replace(
                                /\s+/g,
                                " "
                            )
                            .trim(),

                    href:
                        link.getAttribute(
                            "href"
                        )
                })
            )
            .filter(
                item =>
                    item.label
                    &&
                    item.href
            );
    }


    function renderSearchResults(
        keyword
    ) {

        const panel =
            ensureSearchPanel();

        const query =
            normalizeText(
                keyword
            );


        if (!query) {

            panel.classList.remove(
                "open"
            );

            panel.innerHTML =
                "";

            return;
        }


        const results =
            getSearchableMenu()
                .filter(
                    item =>
                        normalizeText(
                            item.label
                        )
                        .includes(
                            query
                        )
                )
                .slice(
                    0,
                    8
                );


        if (
            results.length === 0
        ) {

            panel.innerHTML = `
                <div class="crm-shell-panel-empty">
                    Không tìm thấy chức năng phù hợp.
                </div>
            `;

        } else {

            panel.innerHTML =
                results
                    .map(
                        item => `
                            <button
                                type="button"
                                class="crm-search-result"
                                data-search-href="${escapeAttribute(item.href)}"
                            >
                                ${escapeHtmlShell(item.label)}
                            </button>
                        `
                    )
                    .join("");
        }


        panel.classList.add(
            "open"
        );
    }


    function escapeHtmlShell(value) {

        return String(
            value ?? ""
        )
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }


    function escapeAttribute(value) {

        return escapeHtmlShell(
            value
        );
    }


    /* =====================================================
       ONE EVENT DELEGATION FOR DYNAMIC SHELL
    ===================================================== */

    document.addEventListener(
        "click",
        function (event) {

            const themeButton =
                event.target.closest(
                    "#themeToggle"
                );

            if (themeButton) {

                event.preventDefault();

                /*
                 * Chặn listener cũ trong shared-shell/ui-core
                 * toggle lần thứ hai.
                 */
                event.stopImmediatePropagation();

                shellToggleTheme();

                return;
            }


            const notificationButton =
                event.target.closest(
                    "#notificationButton"
                );

            if (notificationButton) {
                event.preventDefault();
                event.stopImmediatePropagation();
                toggleNotifications();
                return;
            }

            const notifItem = event.target.closest(".notif-item");
            if (notifItem) {
                event.preventDefault();
                event.stopImmediatePropagation();
                const id = notifItem.dataset.id;
                const link = notifItem.dataset.link;
                markNotificationAsReadAndNavigate(id, link);
                return;
            }

            const btnMarkAll = event.target.closest("#btnMarkAllNotifsRead");
            if (btnMarkAll) {
                event.preventDefault();
                event.stopImmediatePropagation();
                markAllNotificationsRead();
                return;
            }

            const btnNotifPref = event.target.closest("#btnNotifPreferences") || event.target.closest("#shellOpenNotifSettings");
            if (btnNotifPref) {
                event.preventDefault();
                event.stopImmediatePropagation();
                const panel = document.getElementById("crmNotificationPanel");
                if (panel) panel.style.display = "none";
                const uDrop = document.getElementById("userDropdown");
                if (uDrop) uDrop.style.display = "none";
                openNotifPreferencesModal();
                return;
            }

            const btnClosePref = event.target.closest(".btn-close-notif-pref");
            if (btnClosePref) {
                event.preventDefault();
                event.stopImmediatePropagation();
                closeNotifPreferencesModal();
                return;
            }

            const btnSavePref = event.target.closest("#btnSaveNotifPreferences");
            if (btnSavePref) {
                event.preventDefault();
                event.stopImmediatePropagation();
                saveNotifPreferences();
                return;
            }

            const userButton =
                event.target.closest(
                    "#userButton"
                );

            if (userButton) {
                event.preventDefault();
                event.stopImmediatePropagation();
                toggleUserDropdown();
                return;
            }

            const searchResult =
                event.target.closest(
                    "[data-search-href]"
                );

            if (searchResult) {
                const href =
                    searchResult.dataset
                        .searchHref;
                if (href) {
                    window.location.href = href;
                }
                return;
            }

            if (
                !event.target.closest(".crm-user")
                && !event.target.closest("#crmNotificationPanel")
                && !event.target.closest(".crm-notification-wrapper")
                && !event.target.closest(".crm-search")
                && !event.target.closest("#crmSearchPanel")
            ) {
                closeShellPanels();
                const notifPanel = document.getElementById("crmNotificationPanel");
                if (notifPanel) notifPanel.style.display = "none";
            }
        },
        true
    );

    /* =====================================================
       IN-APP NOTIFICATIONS ENGINE
    ===================================================== */
    let notificationState = {
        notifications: [],
        unreadCount: 0,
        isOpen: false,
        loaded: false
    };

    async function fetchNotificationCount() {
        try {
            const res = await fetch("/crm/api/notifications/unread-count", { credentials: "same-origin" });
            if (res.ok) {
                const data = await res.json();
                if (data.success && data.data) {
                    updateNotificationBadge(data.data.unreadCount || 0);
                }
            }
        } catch (e) {}
    }

    async function loadNotifications() {
        try {
            const res = await fetch("/crm/api/notifications?limit=25", { credentials: "same-origin" });
            if (res.ok) {
                const json = await res.json();
                if (json.success && json.data) {
                    notificationState.notifications = json.data.notifications || [];
                    notificationState.unreadCount = json.data.unreadCount || 0;
                    notificationState.loaded = true;
                    updateNotificationBadge(notificationState.unreadCount);
                    renderNotificationList();
                }
            }
        } catch (e) {
            console.error("Lỗi tải thông báo:", e);
        }
    }

    function updateNotificationBadge(count) {
        notificationState.unreadCount = count;
        const badge = document.getElementById("shellNotificationBadge");
        const pill = document.getElementById("notifUnreadBadgePill");
        if (badge) {
            if (count > 0) {
                badge.textContent = count > 99 ? "99+" : count;
                badge.style.display = "inline-block";
            } else {
                badge.style.display = "none";
            }
        }
        if (pill) {
            if (count > 0) {
                pill.textContent = count + " mới";
                pill.style.display = "inline-block";
            } else {
                pill.style.display = "none";
            }
        }
    }

    function renderNotificationList() {
        const container = document.getElementById("notifListContainer");
        if (!container) return;

        const list = notificationState.notifications;
        if (!list || list.length === 0) {
            container.innerHTML = `
                <div class="notif-empty-state">
                    <div style="font-size:24px; margin-bottom:6px;">🔔</div>
                    <div style="font-weight:600;">Không có thông báo mới</div>
                    <div style="font-size:12px; color:var(--crm-muted); margin-top:2px;">Bạn đã xem hết các thông báo quan trọng.</div>
                </div>
            `;
            return;
        }

        let html = "";
        list.forEach(n => {
            let iconType = "task";
            let iconChar = "📋";
            if (n.type === "LEAD_ASSIGNED") {
                iconType = "lead";
                iconChar = "👤";
            } else if (n.type === "QUOTE_APPROVAL_REQUEST" || n.type === "QUOTE_RESPONSE") {
                iconType = "quote";
                iconChar = "📄";
            } else if (n.type === "OPPORTUNITY_STAGNANT") {
                iconType = "stagnant";
                iconChar = "⚠️";
            } else if (n.type === "AUTOMATION_ACTION") {
                iconType = "automation";
                iconChar = "⚡";
            }

            const isUnread = !n.read;
            html += `
                <div class="notif-item ${isUnread ? 'unread' : ''}" data-id="${n.id}" data-link="${n.link || 'dashboard'}">
                    <div class="notif-icon ${iconType}">${iconChar}</div>
                    <div class="notif-content-box">
                        <div class="notif-title">
                            <span>${escapeHtml(n.title)}</span>
                            ${isUnread ? '<span class="notif-dot"></span>' : ''}
                        </div>
                        <div class="notif-snippet">${escapeHtml(n.content || '')}</div>
                        <div class="notif-time">${escapeHtml(n.timeAgo || '')}</div>
                    </div>
                </div>
            `;
        });
        container.innerHTML = html;
    }

    function toggleNotifications() {
        const panel = document.getElementById("crmNotificationPanel");
        if (!panel) return;

        if (panel.style.display === "none" || !panel.style.display) {
            const userDropdown = document.getElementById("userDropdown");
            if (userDropdown) userDropdown.style.display = "none";
            panel.style.display = "flex";
            notificationState.isOpen = true;
            loadNotifications();
        } else {
            panel.style.display = "none";
            notificationState.isOpen = false;
        }
    }

    async function markNotificationAsReadAndNavigate(id, link) {
        try {
            await fetch(`/crm/api/notifications/${id}/read`, { method: "POST", credentials: "same-origin" });
        } catch (e) {}
        window.location.href = link;
    }

    async function markAllNotificationsRead() {
        try {
            const res = await fetch("/crm/api/notifications/read-all", { method: "POST", credentials: "same-origin" });
            if (res.ok) {
                notificationState.notifications.forEach(n => n.read = true);
                updateNotificationBadge(0);
                renderNotificationList();
            }
        } catch (e) {
            console.error("Lỗi đánh dấu đã đọc:", e);
        }
    }

    /* =====================================================
       PERSONAL NOTIFICATION PREFERENCES MODAL
    ===================================================== */
    let userNotifPreferences = [];

    function ensureNotifPrefModal() {
        let modal = document.getElementById("crmNotifPrefModal");
        if (modal) return modal;

        modal = document.createElement("div");
        modal.id = "crmNotifPrefModal";
        modal.className = "crm-modal-backdrop";
        modal.style.cssText = "display:none; position:fixed; inset:0; background:rgba(15,23,42,0.6); z-index:99999; align-items:center; justify-content:center; padding:16px; backdrop-filter:blur(3px);";
        modal.innerHTML = `
            <div class="crm-modal-card" style="background:var(--crm-surface,#ffffff); border-radius:14px; width:100%; max-width:660px; box-shadow:0 25px 50px -12px rgba(0,0,0,0.25); overflow:hidden; border:1px solid var(--crm-border,#e2e8f0); animation:modalSlideUp 0.2s ease-out;">
                <div style="display:flex; justify-content:space-between; align-items:center; padding:18px 24px; border-bottom:1px solid var(--crm-border,#e2e8f0); background:var(--crm-bg,#f8fafc);">
                    <div style="display:flex; align-items:center; gap:12px;">
                        <div style="width:38px; height:38px; border-radius:10px; background:#eff6ff; display:flex; align-items:center; justify-content:center; font-size:18px;">⚙️</div>
                        <div>
                            <h3 style="margin:0; font-size:16px; font-weight:700; color:var(--crm-text,#0f172a);">Cài đặt thông báo cá nhân</h3>
                            <p style="margin:2px 0 0; font-size:12.5px; color:var(--crm-muted,#64748b);">Tùy chỉnh nhận thông báo cho riêng bạn theo kênh trong ứng dụng và email</p>
                        </div>
                    </div>
                    <button type="button" class="btn-close-notif-pref" style="background:none; border:none; font-size:20px; cursor:pointer; color:#64748b; padding:4px 8px; border-radius:6px;">✕</button>
                </div>
                <div style="padding:20px 24px; max-height:460px; overflow-y:auto;" id="notifPrefTableContainer">
                    <div style="text-align:center; padding:30px; color:#64748b;">Đang tải cài đặt thông báo...</div>
                </div>
                <div style="display:flex; justify-content:space-between; align-items:center; padding:16px 24px; border-top:1px solid var(--crm-border,#e2e8f0); background:var(--crm-bg,#f8fafc);">
                    <div style="font-size:12px; color:#64748b; display:flex; align-items:center; gap:6px;">
                        <span>🔒</span> <em>Thông báo bắt buộc không thể tắt trong ứng dụng</em>
                    </div>
                    <div style="display:flex; gap:10px;">
                        <button type="button" class="btn-close-notif-pref" style="padding:9px 16px; border-radius:8px; border:1px solid #cbd5e1; background:#ffffff; color:#334155; font-size:13px; font-weight:600; cursor:pointer;">Đóng</button>
                        <button type="button" id="btnSaveNotifPreferences" style="padding:9px 20px; border-radius:8px; border:none; background:#2563eb; color:#ffffff; font-size:13px; font-weight:600; cursor:pointer; display:flex; align-items:center; gap:6px;">
                            <span>💾</span> Lưu cài đặt
                        </button>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        return modal;
    }

    async function openNotifPreferencesModal() {
        const modal = ensureNotifPrefModal();
        modal.style.display = "flex";
        await loadNotifPreferences();
    }

    function closeNotifPreferencesModal() {
        const modal = document.getElementById("crmNotifPrefModal");
        if (modal) modal.style.display = "none";
    }

    async function loadNotifPreferences() {
        const container = document.getElementById("notifPrefTableContainer");
        if (!container) return;

        try {
            const res = await fetch("/crm/api/notifications/preferences", { credentials: "same-origin" });
            const json = await res.json();
            if (json.success && Array.isArray(json.data)) {
                userNotifPreferences = json.data;
                renderNotifPreferencesTable(userNotifPreferences);
            } else {
                container.innerHTML = `<div style="color:#ef4444; padding:20px; text-align:center;">Không thể tải cấu hình thông báo.</div>`;
            }
        } catch (e) {
            console.error("Lỗi tải cài đặt thông báo:", e);
            container.innerHTML = `<div style="color:#ef4444; padding:20px; text-align:center;">Lỗi kết nối khi tải cài đặt.</div>`;
        }
    }

    function renderNotifPreferencesTable(items) {
        const container = document.getElementById("notifPrefTableContainer");
        if (!container) return;

        let html = `
            <table class="notif-pref-table">
                <thead>
                    <tr>
                        <th style="width:58%;">Loại sự kiện</th>
                        <th style="width:21%; text-align:center;">Trong ứng dụng</th>
                        <th style="width:21%; text-align:center;">Email</th>
                    </tr>
                </thead>
                <tbody>
        `;

        items.forEach(item => {
            const isMandatory = item.mandatory || item.notificationType === "QUOTE_APPROVAL_REQUEST";
            html += `
                <tr data-type="${escapeHtml(item.notificationType)}">
                    <td>
                        <div style="display:flex; align-items:center; gap:6px;">
                            <strong style="color:var(--crm-text,#0f172a); font-size:13.5px;">${escapeHtml(item.typeLabel || item.notificationType)}</strong>
                            ${isMandatory ? `<span style="font-size:10.5px; padding:2px 7px; border-radius:4px; background:#fee2e2; color:#b91c1c; font-weight:700;">🔒 BẮT BUỘC</span>` : ''}
                        </div>
                        <div style="font-size:12px; color:var(--crm-muted,#64748b); margin-top:3px; line-height:1.4;">${escapeHtml(item.description || '')}</div>
                    </td>
                    <td style="text-align:center;">
                        <label class="notif-pref-switch">
                            <input type="checkbox" class="pref-in-app" data-type="${escapeHtml(item.notificationType)}"
                                ${item.inAppEnabled ? 'checked' : ''}
                                ${isMandatory ? 'disabled title="Thông báo bắt buộc không thể tắt"' : ''}>
                            <span class="notif-pref-slider"></span>
                        </label>
                    </td>
                    <td style="text-align:center;">
                        <label class="notif-pref-switch">
                            <input type="checkbox" class="pref-email" data-type="${escapeHtml(item.notificationType)}"
                                ${item.emailEnabled ? 'checked' : ''}>
                            <span class="notif-pref-slider"></span>
                        </label>
                    </td>
                </tr>
            `;
        });

        html += `
                </tbody>
            </table>
        `;
        container.innerHTML = html;
    }

    async function saveNotifPreferences() {
        const btnSave = document.getElementById("btnSaveNotifPreferences");
        if (btnSave) {
            btnSave.disabled = true;
            btnSave.innerHTML = `<span>⏳</span> Đang lưu...`;
        }

        const rows = document.querySelectorAll("#notifPrefTableContainer tr[data-type]");
        const payload = [];

        rows.forEach(row => {
            const type = row.getAttribute("data-type");
            const inAppInput = row.querySelector(".pref-in-app");
            const emailInput = row.querySelector(".pref-email");

            const isMandatory = type === "QUOTE_APPROVAL_REQUEST";
            payload.push({
                notificationType: type,
                inAppEnabled: isMandatory ? true : (inAppInput ? inAppInput.checked : true),
                emailEnabled: emailInput ? emailInput.checked : true
            });
        });

        try {
            const res = await fetch("/crm/api/notifications/preferences", {
                method: "POST",
                headers: { "Content-Type": "application/json; charset=utf-8" },
                body: JSON.stringify(payload),
                credentials: "same-origin"
            });
            const json = await res.json();
            if (json.success) {
                userNotifPreferences = json.data;
                alert("Đã lưu cài đặt thông báo cá nhân thành công!");
                closeNotifPreferencesModal();
            } else {
                alert("Lỗi khi lưu cài đặt: " + (json.message || "Không xác định"));
            }
        } catch (e) {
            console.error("Lỗi khi lưu cài đặt thông báo:", e);
            alert("Lỗi kết nối khi lưu cài đặt thông báo.");
        } finally {
            if (btnSave) {
                btnSave.disabled = false;
                btnSave.innerHTML = `<span>💾</span> Lưu cài đặt`;
            }
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

    // Tự động kiểm tra thông báo định kỳ mỗi 30 giây
    setTimeout(fetchNotificationCount, 500);
    setInterval(fetchNotificationCount, 30000);


    /* =====================================================
       SEARCH INPUT
    ===================================================== */

    document.addEventListener(
        "input",
        function (event) {

            if (
                event.target?.id
                !==
                "globalSearch"
            ) {
                return;
            }


            renderSearchResults(
                event.target.value
            );

        },
        true
    );


    document.addEventListener(
        "keydown",
        function (event) {

            const search =
                byId(
                    "globalSearch"
                );


            if (
                (
                    event.ctrlKey
                    ||
                    event.metaKey
                )
                &&
                event.key
                    .toLowerCase()
                ===
                "k"
            ) {

                event.preventDefault();

                search?.focus();

                return;
            }


            if (
                event.key
                ===
                "Escape"
            ) {

                closeShellPanels();

                return;
            }


            if (
                event.key
                ===
                "Enter"
                &&
                event.target?.id
                ===
                "globalSearch"
            ) {

                const first =
                    document.querySelector(
                        "#crmSearchPanel [data-search-href]"
                    );

                if (first) {

                    event.preventDefault();

                    window.location.href =
                        first.dataset
                            .searchHref;
                }
            }

        },
        true
    );

})();
/* =========================================================
   MOBILE TOP SHORTCUTS - FORCE TOP
========================================================= */

(function () {

    function currentPageName() {

        return window.location.pathname
            .split("/")
            .pop()
            ||
            "dashboard";
    }


    function createIcon(type) {

        const icons = {

            dashboard:
                `<svg viewBox="0 0 24 24">
                    <rect x="3" y="3" width="7" height="7"/>
                    <rect x="14" y="3" width="7" height="7"/>
                    <rect x="3" y="14" width="7" height="7"/>
                    <rect x="14" y="14" width="7" height="7"/>
                </svg>`,

            customer:
                `<svg viewBox="0 0 24 24">
                    <circle cx="12" cy="8" r="4"/>
                    <path d="M4 21c0-4 3.6-7 8-7s8 3 8 7"/>
                </svg>`,

            opportunity:
                `<svg viewBox="0 0 24 24">
                    <path d="m12 3 8 9-8 9-8-9 8-9Z"/>
                </svg>`,

            calendar:
                `<svg viewBox="0 0 24 24">
                    <rect x="3" y="5" width="18" height="16" rx="2"/>
                    <path d="M8 3v4m8-4v4M3 10h18"/>
                </svg>`
        };

        return icons[type] || "";
    }


    function buildTopNavigation() {

        /*
         * Xóa bottom nav cũ nếu JS cũ đã tạo.
         */
        document
            .querySelectorAll(
                ".crm-bottom-nav"
            )
            .forEach(
                element =>
                    element.remove()
            );


        let nav =
            document.querySelector(
                ".crm-mobile-shortcuts"
            );


        if (!nav) {

            nav =
                document.createElement(
                    "nav"
                );

            nav.className =
                "crm-mobile-shortcuts";


            const header =
                document.querySelector(
                    ".crm-mobile-header"
                );


            if (header) {

                header.insertAdjacentElement(
                    "afterend",
                    nav
                );

            } else {

                document.body.prepend(
                    nav
                );
            }
        }


        const page =
            currentPageName();


        const items = [
            {
                path:
                    "dashboard",
                label:
                    "Tổng quan",
                icon:
                    "dashboard"
            },

            {
                path:
                    "customers.html",
                label:
                    "Khách hàng",
                icon:
                    "customer"
            },

            {
                path:
                    "pipeline.html",
                label:
                    "Cơ hội",
                icon:
                    "opportunity"
            },

            {
                path:
                    "calendar.html",
                label:
                    "Lịch",
                icon:
                    "calendar"
            }
        ];


        nav.innerHTML =
            items
                .map(
                    item => `
                        <a
                            href="${item.path}"
                            class="
                                crm-mobile-shortcut
                                ${
                                    page === item.path
                                    ?
                                    "active"
                                    :
                                    ""
                                }
                            "
                        >
                            ${createIcon(item.icon)}

                            <span>
                                ${item.label}
                            </span>
                        </a>
                    `
                )
                .join("");
    }


    if (
        document.readyState ===
        "loading"
    ) {

        document.addEventListener(
            "DOMContentLoaded",
            buildTopNavigation
        );

    } else {

        buildTopNavigation();
    }


    /*
     * Shell có thể render lại header sau đó,
     * chạy lại một lần để đảm bảo vị trí đúng.
     */
    setTimeout(
        buildTopNavigation,
        100
    );

})();