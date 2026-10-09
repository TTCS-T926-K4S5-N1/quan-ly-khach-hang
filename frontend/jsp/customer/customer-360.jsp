<%@ page contentType="text/html;charset=UTF-8" language="java" %>
<%@ taglib prefix="c" uri="jakarta.tags.core" %>
<%
    String contextPath = request.getContextPath();
%>
<!DOCTYPE html>
<html lang="vi">
<head>
<script>
(function () {
    try {
        var theme = localStorage.getItem("crm_ui_theme");
        document.documentElement.setAttribute("data-theme", theme === "dark" ? "dark" : "light");
        document.documentElement.removeAttribute("data-crm-theme");
    } catch (e) {
        document.documentElement.setAttribute("data-theme", "light");
    }
})();
</script>

<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>Khách hàng 360° - Corporate CRM</title>

<link rel="stylesheet" href="<%= contextPath %>/css/design-system.css">
<link rel="stylesheet" href="<%= contextPath %>/css/app-shell.css">
<link rel="stylesheet" href="<%= contextPath %>/css/customer/customer-360.css">
<link rel="stylesheet" href="<%= contextPath %>/css/animations.css">
</head>

<body class="crm-private">

<!-- SIDEBAR NAVIGATION -->
<aside class="crm-sidebar">
    <div class="crm-brand">
        <div class="crm-brand-mark">C</div>
        <span class="crm-brand-name">Corporate CRM</span>
    </div>

    <nav class="crm-nav">
        <div class="crm-nav-section">Không gian làm việc</div>
        <a href="<%= contextPath %>/dashboard.html" class="crm-nav-item">
            <span class="crm-nav-icon"><svg class="crm-inline-icon" viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg></span>
            <span class="crm-nav-label">Tổng quan</span>
        </a>

        <a href="<%= contextPath %>/customers.html" class="crm-nav-item active">
            <span class="crm-nav-icon"><svg class="crm-inline-icon" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 3.6-7 8-7s8 3 8 7"/></svg></span>
            <span class="crm-nav-label">Khách hàng</span>
        </a>

        <a href="<%= contextPath %>/pipeline.html" class="crm-nav-item">
            <span class="crm-nav-icon"><svg class="crm-inline-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="m12 3 8 9-8 9-8-9 8-9Z"/></svg></span>
            <span class="crm-nav-label">Cơ hội</span>
        </a>

        <a href="<%= contextPath %>/calendar.html" class="crm-nav-item">
            <span class="crm-nav-icon"><svg class="crm-inline-icon" viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M8 3v4m8-4v4M3 10h18"/></svg></span>
            <span class="crm-nav-label">Lịch</span>
        </a>

        <div class="crm-nav-section">Quản lý</div>
        <a href="<%= contextPath %>/products.html" class="crm-nav-item">
            <span class="crm-nav-icon"><svg class="crm-inline-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="m12 3 8 4-8 4-8-4 8-4ZM4 7v10l8 4 8-4V7M12 11v10"/></svg></span>
            <span class="crm-nav-label">Sản phẩm</span>
        </a>
    </nav>
</aside>

<!-- TOPBAR -->
<header class="crm-topbar">
    <div class="crm-search">
        <svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></svg>
        <input id="globalSearch" type="search" placeholder="Tìm kiếm khách hàng, cơ hội...">
        <kbd>Ctrl K</kbd>
    </div>

    <div class="crm-top-actions">
        <button id="themeToggle" class="crm-shell-icon-button" type="button" title="Đổi giao diện">
            <svg class="crm-inline-icon" viewBox="0 0 24 24"><path d="M20 15a8 8 0 1 1-11-11 7 7 0 0 0 11 11Z"/></svg>
        </button>

        <button class="crm-icon-btn" type="button" title="Thông báo">
            <svg class="crm-inline-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M18 8a6 6 0 1 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4"/></svg>
            <span class="crm-notification-dot"></span>
        </button>

        <div class="crm-user">
            <button id="userButton" class="crm-user-button" type="button">
                <div class="crm-avatar">A</div>
                <div class="crm-user-copy">
                    <span id="shellUserName" class="crm-user-name">Nguyễn Văn An</span>
                    <span id="shellUserRole" class="crm-user-role">Kinh doanh B2B</span>
                </div>
                <span><svg class="crm-inline-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg></span>
            </button>
            <div id="userDropdown" class="crm-user-dropdown">
                <a href="<%= contextPath %>/profile.html">Hồ sơ cá nhân</a>
                <a href="<%= contextPath %>/change-password.html">Đổi mật khẩu</a>
                <button type="button">Đăng xuất</button>
            </div>
        </div>
    </div>
</header>

<!-- MAIN CONTENT -->
<main class="crm-main">
    <div class="customer360-container">

        <!-- 1. HEADER & THAO TÁC NHANH TRƯỚC CUỘC GẶP -->
        <header class="c360-header">
            <div class="c360-header-info">
                <div id="c360Avatar" class="c360-avatar">P</div>
                <div class="c360-titles">
                    <nav class="c360-breadcrumb">
                        <a href="<%= contextPath %>/customers.html">← Danh sách khách hàng</a>
                        <span>/</span>
                        <span>Khách hàng 360°</span>
                        <span>/</span>
                        <span id="c360CustomerCode" class="c360-badge badge-code">KH-2026-0889</span>
                    </nav>
                    <div class="c360-name-row">
                        <h1 id="c360CustomerName">Tập đoàn Công nghệ & Viễn thông PetroTech</h1>
                        <span id="c360TierBadge" class="c360-badge badge-vip">VIP</span>
                        <span class="c360-badge badge-active">Đang hoạt động</span>
                    </div>
                </div>
            </div>

            <!-- Quick Action Buttons for Sales Meetings -->
            <div class="c360-header-actions">
                <button type="button" class="quick-action-btn btn-call" onclick="quickCallContact('Tổng đài PetroTech', '024 3792 8888')">
                    <svg class="crm-inline-icon" viewBox="0 0 24 24"><path d="M5 3h4l2 5-3 2c2 3 3 4 6 6l2-3 5 2v4c0 2-2 3-4 2C9 19 5 15 3 7 2 5 3 3 5 3Z"/></svg>
                    <span>Gọi điện thoại</span>
                </button>
                <button type="button" class="quick-action-btn btn-email" onclick="quickEmailContact('Ban Thư ký PetroTech', 'contact@petrotech-corp.vn')">
                    <svg class="crm-inline-icon" viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 6 9 7 9-7"/></svg>
                    <span>Gửi Email</span>
                </button>
                <button type="button" class="quick-action-btn btn-meeting" onclick="document.getElementById('composerTabMeeting')?.click(); document.getElementById('composerTextarea')?.focus();">
                    <svg class="crm-inline-icon" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                    <span>Đặt cuộc gặp</span>
                </button>
                <button id="btnEditCompany" type="button" class="crm-btn crm-btn-secondary">
                    <svg class="crm-inline-icon" viewBox="0 0 24 24"><path d="m16 3 5 5-12 12-6 1 1-6L16 3ZM14 5l5 5"/></svg>
                    <span>Chỉnh sửa hồ sơ</span>
                </button>
            </div>
        </header>

        <!-- 2. THẺ THỐNG KÊ NỔI BẬT (HIGHLIGHT KPI CARDS) -->
        <section class="c360-kpi-grid">
            <!-- Tổng giá trị đã ký -->
            <div class="kpi-card signed">
                <div class="kpi-top">
                    <span class="kpi-label">Tổng giá trị hợp đồng đã ký</span>
                    <div class="kpi-icon-wrap">
                        <svg class="crm-inline-icon" viewBox="0 0 24 24"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                    </div>
                </div>
                <div id="kpiTotalSignedValue" class="kpi-value">3.450.000.000 ₫</div>
                <div class="kpi-subtext">
                    <span class="kpi-tag positive">✓ Hoàn tất</span>
                    <span id="kpiSignedCount">+2 hợp đồng thành công</span>
                </div>
            </div>

            <!-- Giá trị cơ hội đang mở -->
            <div class="kpi-card pipeline">
                <div class="kpi-top">
                    <span class="kpi-label">Giá trị cơ hội đang mở</span>
                    <div class="kpi-icon-wrap">
                        <svg class="crm-inline-icon" viewBox="0 0 24 24"><path d="m12 3 8 9-8 9-8-9 8-9Z"/></svg>
                    </div>
                </div>
                <div id="kpiOpenPipelineValue" class="kpi-value">1.820.000.000 ₫</div>
                <div class="kpi-subtext">
                    <span class="kpi-tag neutral">Pipeline</span>
                    <span id="kpiOpenCount">2 deal đang theo đuổi</span>
                </div>
            </div>

            <!-- Doanh thu dự báo theo xác suất -->
            <div class="kpi-card forecast">
                <div class="kpi-top">
                    <span class="kpi-label">Dự báo doanh thu (Weighted)</span>
                    <div class="kpi-icon-wrap">
                        <svg class="crm-inline-icon" viewBox="0 0 24 24"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
                    </div>
                </div>
                <div id="kpiWeightedForecast" class="kpi-value">1.342.000.000 ₫</div>
                <div class="kpi-subtext">
                    <span class="kpi-tag positive">+18% MoM</span>
                    <span>Tỷ lệ thắng kỳ vọng 74%</span>
                </div>
            </div>

            <!-- Sức khỏe tương tác khách hàng -->
            <div class="kpi-card health">
                <div class="kpi-top">
                    <span class="kpi-label">Sức khỏe quan hệ & Tương tác</span>
                    <div class="kpi-icon-wrap">
                        <svg class="crm-inline-icon" viewBox="0 0 24 24"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
                    </div>
                </div>
                <div class="kpi-value">96/100</div>
                <div class="kpi-subtext">
                    <span class="kpi-tag positive">Rất tốt</span>
                    <span>Tương tác cuối: 15 phút trước</span>
                </div>
            </div>
        </section>

        <!-- 3. KHÔNG GIAN LÀM VIỆC 3 CỘT TỔNG QUAN DUY NHẤT -->
        <div class="c360-workspace-grid">

            <!-- CỘT 1: THÔNG TIN CÔNG TY & NGƯỜI PHỤ TRÁCH -->
            <aside class="c360-panel">
                <div class="panel-title-bar">
                    <h2>
                        <svg class="crm-inline-icon" viewBox="0 0 24 24"><path d="M3 21h18M5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16M9 9h1M9 13h1M9 17h1M14 9h1M14 13h1M14 17h1"/></svg>
                        Hồ sơ doanh nghiệp
                    </h2>
                    <span class="panel-badge-count">B2B Core</span>
                </div>

                <dl class="company-details-list">
                    <div class="company-detail-item">
                        <dt>Tên công ty</dt>
                        <dd id="coName">—</dd>
                    </div>

                    <div class="company-detail-item">
                        <dt>Mã số thuế</dt>
                        <dd id="coTax">—</dd>
                    </div>

                    <div class="company-detail-item">
                        <dt>Ngành nghề / Lĩnh vực</dt>
                        <dd id="coIndustry">—</dd>
                    </div>

                    <div class="company-detail-item">
                        <dt>Quy mô doanh nghiệp</dt>
                        <dd id="coSize">—</dd>
                    </div>

                    <div class="company-detail-item">
                        <dt>Hotline / Điện thoại</dt>
                        <dd id="coPhone">—</dd>
                    </div>

                    <div class="company-detail-item">
                        <dt>Email doanh nghiệp</dt>
                        <dd id="coEmail">—</dd>
                    </div>

                    <div class="company-detail-item">
                        <dt>Website</dt>
                        <dd><a id="coWebsite" href="#" target="_blank" rel="noopener">—</a></dd>
                    </div>

                    <div class="company-detail-item">
                        <dt>Địa chỉ trụ sở chính</dt>
                        <dd id="coAddress">—</dd>
                    </div>

                    <div class="company-detail-item">
                        <dt>Doanh thu hàng năm</dt>
                        <dd id="coAnnualRevenue">—</dd>
                    </div>

                    <div class="company-detail-item">
                        <dt>Hạn mức tín dụng / Công nợ</dt>
                        <dd id="coCreditLimit">—</dd>
                    </div>

                    <div class="company-detail-item">
                        <dt>Nhân viên phụ trách (Owner)</dt>
                        <dd>
                            <div class="owner-chip">
                                <div id="coOwnerAvatar" class="owner-chip-avatar">A</div>
                                <span id="coOwnerName">Nguyễn Văn An</span>
                            </div>
                        </dd>
                    </div>

                    <div class="company-detail-item">
                        <dt>Nhãn phân loại (Tags)</dt>
                        <dd>
                            <div id="coTagsList" class="c360-tags-wrap"></div>
                        </dd>
                    </div>
                </dl>
            </aside>

            <!-- CỘT 2: TIMELINE HOẠT ĐỘNG (TỐI ƯU TẢI 500 BẢN GHI < 1.5S) -->
            <section class="c360-panel">
                <div class="panel-title-bar">
                    <h2>
                        <svg class="crm-inline-icon" viewBox="0 0 24 24"><path d="M12 8v4l3 3M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2Z"/></svg>
                        Dòng thời gian hoạt động
                    </h2>
                    <span id="timelineTotalCount" class="panel-badge-count">500 hoạt động</span>
                </div>

                <!-- Form ghi nhanh tương tác -->
                <div class="timeline-composer-wrap">
                    <div class="composer-tabs">
                        <button type="button" class="composer-tab-btn active" data-composer-type="call">
                            <svg class="crm-inline-icon" viewBox="0 0 24 24"><path d="M5 3h4l2 5-3 2c2 3 3 4 6 6l2-3 5 2v4c0 2-2 3-4 2C9 19 5 15 3 7 2 5 3 3 5 3Z"/></svg>
                            Ghi cuộc gọi
                        </button>
                        <button type="button" class="composer-tab-btn" data-composer-type="meeting" id="composerTabMeeting">
                            <svg class="crm-inline-icon" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                            Biên bản cuộc gặp
                        </button>
                        <button type="button" class="composer-tab-btn" data-composer-type="email">
                            <svg class="crm-inline-icon" viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 6 9 7 9-7"/></svg>
                            Email gửi
                        </button>
                        <button type="button" class="composer-tab-btn" data-composer-type="note">
                            <svg class="crm-inline-icon" viewBox="0 0 24 24"><path d="m16 3 5 5-12 12-6 1 1-6L16 3ZM14 5l5 5"/></svg>
                            Ghi chú nhanh
                        </button>
                    </div>

                    <form id="activityComposerForm" class="composer-form">
                        <textarea id="composerTextarea" class="composer-textarea" placeholder="Ghi lại kết quả cuộc gọi hoặc nội dung trao đổi với khách hàng..."></textarea>
                        <div class="composer-row">
                            <div class="composer-extra-inputs">
                                <span style="font-size:12px;color:var(--crm-muted)">Liên hệ liên quan:</span>
                                <select id="composerContactSelect" class="crm-input" style="height:32px;width:auto;min-width:180px;font-size:12.5px;">
                                    <option value="1">Trần Đình Hoàng (CTO)</option>
                                    <option value="2">Nguyễn Thị Thu Hà (Mua sắm)</option>
                                    <option value="3">Lê Minh Tuấn (Kỹ thuật)</option>
                                </select>
                            </div>
                            <button type="submit" class="crm-btn crm-btn-primary">
                                <svg class="crm-inline-icon" viewBox="0 0 24 24"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                                <span>Lưu hoạt động</span>
                            </button>
                        </div>
                    </form>
                </div>

                <!-- Thanh đo lường hiệu năng (Benchmark Bar) -->
                <div class="timeline-performance-bar">
                    <div class="benchmark-stats">
                        <span class="benchmark-badge">⚡ Hiệu năng tối ưu</span>
                        <span>Tải DOM: <strong id="benchmarkTimeValue">Đang đo...</strong></span>
                    </div>
                    <button id="triggerBenchmarkBtn" type="button" class="benchmark-trigger-btn" title="Chạy lại kiểm thử đo tốc độ tải 500 records">
                        🔄 Kiểm tra tải 500 hoạt động
                    </button>
                </div>

                <!-- Lọc & Tìm kiếm trong Timeline -->
                <div class="timeline-filters-bar">
                    <div class="timeline-filter-chips">
                        <button type="button" class="filter-chip active" data-timeline-filter="all">Tất cả</button>
                        <button type="button" class="filter-chip" data-timeline-filter="call">Cuộc gọi</button>
                        <button type="button" class="filter-chip" data-timeline-filter="meeting">Cuộc gặp</button>
                        <button type="button" class="filter-chip" data-timeline-filter="email">Email</button>
                        <button type="button" class="filter-chip" data-timeline-filter="note">Ghi chú</button>
                    </div>

                    <div class="timeline-search-box">
                        <svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></svg>
                        <input id="timelineSearchInput" type="search" placeholder="Tìm kiếm trong timeline...">
                    </div>
                </div>

                <!-- Feed chứa 500 hoạt động mượt mà -->
                <div id="timelineStreamContainer" class="c360-timeline-feed">
                    <!-- Dữ liệu được render linh hoạt với batch fragment -->
                </div>
            </section>

            <!-- CỘT 3: NGƯỜI LIÊN HỆ, CƠ HỘI BÁN HÀNG (MỞ/ĐÓNG), TỆP ĐÍNH KÈM -->
            <div class="right-column-stack">

                <!-- 1. DANH SÁCH NGƯỜI LIÊN HỆ KÈM VAI TRÒ QUYẾT ĐỊNH -->
                <section class="c360-panel">
                    <div class="panel-title-bar">
                        <h3>
                            <svg class="crm-inline-icon" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                            Người liên hệ & Vai trò
                        </h3>
                        <div style="display:flex;align-items:center;gap:8px;">
                            <span id="contactsCountBadge" class="panel-badge-count">4</span>
                            <button id="btnAddContact" type="button" class="crm-btn crm-btn-secondary" style="height:28px;padding:0 8px;font-size:11.5px;">+ Thêm</button>
                        </div>
                    </div>

                    <div id="contactsListContainer" class="contacts-list">
                        <!-- Render các contacts với decision badges -->
                    </div>
                </section>

                <!-- 2. DANH MỤC CƠ HỘI BÁN HÀNG (PHÂN TÁCH RÕ MỞ VÀ ĐÃ ĐÓNG) -->
                <section class="c360-panel">
                    <div class="panel-title-bar">
                        <h3>
                            <svg class="crm-inline-icon" viewBox="0 0 24 24"><path d="m12 3 8 9-8 9-8-9 8-9Z"/></svg>
                            Cơ hội bán hàng
                        </h3>
                        <button id="btnAddOpportunity" type="button" class="crm-btn crm-btn-secondary" style="height:28px;padding:0 8px;font-size:11.5px;">+ Thêm Deal</button>
                    </div>

                    <!-- Tabs phân tách Cơ hội đang mở vs Cơ hội đã đóng -->
                    <div class="opps-tab-nav">
                        <button id="oppTabOpen" type="button" class="opp-tab-btn active">
                            <span>Đang mở</span>
                            <span id="tabCountOpen" class="opp-count-badge">2</span>
                        </button>
                        <button id="oppTabClosed" type="button" class="opp-tab-btn">
                            <span>Đã đóng (Thắng / Thua)</span>
                            <span id="tabCountClosed" class="opp-count-badge">3</span>
                        </button>
                    </div>

                    <div id="oppsListContainer" class="opps-container-list">
                        <!-- Render cơ hội theo tab -->
                    </div>
                </section>

                <!-- 3. DANH MỤC TỆP ĐÍNH KÈM & TÀI LIỆU -->
                <section class="c360-panel">
                    <div class="panel-title-bar">
                        <h3>
                            <svg class="crm-inline-icon" viewBox="0 0 24 24"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>
                            Tệp đính kèm & Hợp đồng
                        </h3>
                        <div style="display:flex;align-items:center;gap:8px;">
                            <span id="attachmentsCountBadge" class="panel-badge-count">4</span>
                            <button id="btnAddAttachment" type="button" class="crm-btn crm-btn-secondary" style="height:28px;padding:0 8px;font-size:11.5px;">+ Tải lên</button>
                        </div>
                    </div>

                    <div id="attachmentsListContainer" class="attachments-list">
                        <!-- Render các files -->
                    </div>
                </section>

            </div>

        </div>

    </div>
</main>

<!-- ========================================================================
     MODALS
     ======================================================================== -->
<div id="c360ModalOverlay" class="c360-modal-overlay"></div>

<!-- Modal 1: Chỉnh sửa thông tin công ty -->
<div id="companyEditModal" class="c360-modal">
    <div class="c360-modal-header">
        <h3>Chỉnh sửa thông tin doanh nghiệp</h3>
        <button type="button" class="c360-modal-close" data-modal-close>&times;</button>
    </div>
    <form id="companyEditForm">
        <div class="c360-modal-body">
            <div class="form-group-c360">
                <label>Tên công ty / Khách hàng *</label>
                <input id="editName" type="text" class="crm-input" required>
            </div>
            <div class="form-group-c360">
                <label>Mã số thuế</label>
                <input id="editTax" type="text" class="crm-input">
            </div>
            <div class="form-group-c360">
                <label>Ngành nghề kinh doanh</label>
                <input id="editIndustry" type="text" class="crm-input">
            </div>
            <div class="form-group-c360">
                <label>Số điện thoại</label>
                <input id="editPhone" type="text" class="crm-input">
            </div>
            <div class="form-group-c360">
                <label>Email liên hệ</label>
                <input id="editEmail" type="email" class="crm-input">
            </div>
            <div class="form-group-c360">
                <label>Website</label>
                <input id="editWebsite" type="text" class="crm-input">
            </div>
            <div class="form-group-c360">
                <label>Địa chỉ trụ sở</label>
                <textarea id="editAddress" class="crm-input" style="height:60px;"></textarea>
            </div>
        </div>
        <div class="c360-modal-footer">
            <button type="button" class="crm-btn crm-btn-secondary" data-modal-close>Hủy</button>
            <button type="submit" class="crm-btn crm-btn-primary">Lưu thay đổi</button>
        </div>
    </form>
</div>

<!-- Modal 2: Thêm người liên hệ kèm vai trò quyết định -->
<div id="addContactModal" class="c360-modal">
    <div class="c360-modal-header">
        <h3>Thêm người liên hệ mới</h3>
        <button type="button" class="c360-modal-close" data-modal-close>&times;</button>
    </div>
    <form id="addContactForm">
        <div class="c360-modal-body">
            <div class="form-group-c360">
                <label>Họ và tên *</label>
                <input id="newContactName" type="text" class="crm-input" placeholder="Ví dụ: Hoàng Minh Đức" required>
            </div>
            <div class="form-group-c360">
                <label>Chức vụ / Phòng ban</label>
                <input id="newContactTitle" type="text" class="crm-input" placeholder="Ví dụ: Giám đốc Vận hành (COO)">
            </div>
            <div class="form-group-c360">
                <label>Vai trò quyết định (Decision Role) *</label>
                <select id="newContactRole" class="crm-input">
                    <option value="DECISION_MAKER">Người quyết định chính (Decision Maker)</option>
                    <option value="INFLUENCER" selected>Người ảnh hưởng (Influencer)</option>
                    <option value="TECHNICAL">Đánh giá kỹ thuật (Technical Evaluator)</option>
                    <option value="END_USER">Người sử dụng cuối (End User)</option>
                    <option value="BILLING">Tài chính & Thanh toán (Financial / Billing)</option>
                </select>
            </div>
            <div class="form-group-c360">
                <label>Số điện thoại</label>
                <input id="newContactPhone" type="text" class="crm-input" placeholder="09xx xxx xxx">
            </div>
            <div class="form-group-c360">
                <label>Email</label>
                <input id="newContactEmail" type="email" class="crm-input" placeholder="name@petrotech-corp.vn">
            </div>
        </div>
        <div class="c360-modal-footer">
            <button type="button" class="crm-btn crm-btn-secondary" data-modal-close>Hủy</button>
            <button type="submit" class="crm-btn crm-btn-primary">Thêm liên hệ</button>
        </div>
    </form>
</div>

<!-- Modal 3: Thêm cơ hội bán hàng mới -->
<div id="addOppModal" class="c360-modal">
    <div class="c360-modal-header">
        <h3>Tạo cơ hội bán hàng mới</h3>
        <button type="button" class="c360-modal-close" data-modal-close>&times;</button>
    </div>
    <form id="addOppForm">
        <div class="c360-modal-body">
            <div class="form-group-c360">
                <label>Tên cơ hội / Dự án *</label>
                <input id="newOppName" type="text" class="crm-input" placeholder="Ví dụ: Gói bản quyền giải pháp DLP năm 2026" required>
            </div>
            <div class="form-group-c360">
                <label>Giá trị kỳ vọng (VNĐ) *</label>
                <input id="newOppAmount" type="number" class="crm-input" placeholder="850000000" required>
            </div>
            <div class="form-group-c360">
                <label>Giai đoạn bán hàng ban đầu</label>
                <select id="newOppStage" class="crm-input">
                    <option value="Phát hiện nhu cầu">Phát hiện nhu cầu (20%)</option>
                    <option value="Đề xuất giải pháp & Báo giá">Đề xuất giải pháp & Báo giá (40%)</option>
                    <option value="Đàm phán & Thương thảo">Đàm phán & Thương thảo (70%)</option>
                </select>
            </div>
            <div class="form-group-c360">
                <label>Ngày dự kiến chốt hợp đồng</label>
                <input id="newOppCloseDate" type="date" class="crm-input">
            </div>
        </div>
        <div class="c360-modal-footer">
            <button type="button" class="crm-btn crm-btn-secondary" data-modal-close>Hủy</button>
            <button type="submit" class="crm-btn crm-btn-primary">Tạo cơ hội</button>
        </div>
    </form>
</div>

<!-- Modal 4: Thêm tệp đính kèm -->
<div id="addAttachmentModal" class="c360-modal">
    <div class="c360-modal-header">
        <h3>Tải lên tệp tài liệu / Hợp đồng</h3>
        <button type="button" class="c360-modal-close" data-modal-close>&times;</button>
    </div>
    <form id="addAttachmentForm">
        <div class="c360-modal-body">
            <div class="form-group-c360">
                <label>Tên tài liệu / Văn bản *</label>
                <input id="newFileName" type="text" class="crm-input" placeholder="Ví dụ: Phu_luc_hop_dong_SLA_2026" required>
            </div>
            <div class="form-group-c360">
                <label>Định dạng tệp</label>
                <select id="newFileType" class="crm-input">
                    <option value="pdf">Tệp PDF (.pdf)</option>
                    <option value="xlsx">Bảng tính Excel (.xlsx)</option>
                    <option value="docx">Tài liệu Word (.docx)</option>
                    <option value="img">Hình ảnh chứng từ (.png, .jpg)</option>
                </select>
            </div>
            <div class="form-group-c360">
                <label>Chọn tệp từ máy tính</label>
                <input type="file" class="crm-input" style="padding-top:6px;">
            </div>
        </div>
        <div class="c360-modal-footer">
            <button type="button" class="crm-btn crm-btn-secondary" data-modal-close>Hủy</button>
            <button type="submit" class="crm-btn crm-btn-primary">Tải lên</button>
        </div>
    </form>
</div>

<!-- JAVASCRIPT ASSETS -->
<script src="<%= contextPath %>/js/customer/customer-360.js"></script>
<script src="<%= contextPath %>/js/theme.js"></script>
<script src="<%= contextPath %>/js/shared-shell.js"></script>
<script src="<%= contextPath %>/js/ui-core.js"></script>
<script src="<%= contextPath %>/js/page-transition.js"></script>
<script src="<%= contextPath %>/js/ui-effects.js"></script>

</body>
</html>
