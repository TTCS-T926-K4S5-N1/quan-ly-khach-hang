/**
 * ====================================================================
 * LEAD SCORING CONFIGURATION & LIVE SIMULATION
 * SCRUM-179 / SCRUM-67
 * Giám đốc kinh doanh cấu hình tiêu chí chấm điểm & ngưỡng nhiệt độ
 * ====================================================================
 */

"use strict";

(function () {
    /* ====================================================================
       1. DEFAULT SEED DATA & CONSTANTS
    ==================================================================== */
    const STORAGE_RULES_KEY = "crm_lead_scoring_rules_v1";
    const STORAGE_THRESHOLDS_KEY = "crm_lead_scoring_thresholds_v1";
    const STORAGE_LEADS_KEY = "crm_lead_scoring_sim_leads_v1";

    const CATEGORIES = {
        INDUSTRY: { label: "Ngành nghề", icon: "🏢" },
        COMPANY_SIZE: { label: "Quy mô", icon: "👥" },
        LEAD_SOURCE: { label: "Nguồn Lead", icon: "🌐" },
        ENGAGEMENT: { label: "Mức độ quan tâm", icon: "🎯" }
    };

    const DEFAULT_THRESHOLDS = {
        hot: 80,
        warm: 50
    };

    const DEFAULT_RULES = [
        // 🏢 Ngành nghề phù hợp (Industry Fit)
        { id: "rule-ind-1", category: "INDUSTRY", criterion: "CNTT & Viễn thông / Phần mềm", points: 25, desc: "Ngành mục tiêu chiến lược có ngân sách lớn cho chuyển đổi số", isActive: true },
        { id: "rule-ind-2", category: "INDUSTRY", criterion: "Tài chính - Ngân hàng - Bảo hiểm", points: 25, desc: "Khả năng chi trả rất cao, chu kỳ thanh toán nhanh", isActive: true },
        { id: "rule-ind-3", category: "INDUSTRY", criterion: "Bán lẻ & Thương mại điện tử", points: 20, desc: "Nhu cầu quản lý khách hàng đa kênh cao", isActive: true },
        { id: "rule-ind-4", category: "INDUSTRY", criterion: "Bất động sản & Xây dựng", points: 15, desc: "Quy mô giao dịch lớn nhưng chu kỳ mua dài", isActive: true },
        { id: "rule-ind-5", category: "INDUSTRY", criterion: "Sản xuất & Công nghiệp nặng", points: 10, desc: "Cần tích hợp phức tạp với hệ thống ERP hiện có", isActive: true },
        { id: "rule-ind-6", category: "INDUSTRY", criterion: "Y tế & Giáo dục", points: 10, desc: "Quy trình xét duyệt ngân sách nhiều bước", isActive: true },
        { id: "rule-ind-7", category: "INDUSTRY", criterion: "Ngành nghề khác", points: 5, desc: "Các ngành chưa thuộc danh mục trọng điểm", isActive: true },

        // 👥 Quy mô doanh nghiệp (Company Size)
        { id: "rule-size-1", category: "COMPANY_SIZE", criterion: "Trên 500 nhân sự (Enterprise)", points: 25, desc: "Doanh nghiệp quy mô lớn, tiềm năng hợp đồng Enterprise", isActive: true },
        { id: "rule-size-2", category: "COMPANY_SIZE", criterion: "200 - 500 nhân sự", points: 20, desc: "Doanh nghiệp lớn đang mở rộng chi nhánh", isActive: true },
        { id: "rule-size-3", category: "COMPANY_SIZE", criterion: "50 - 200 nhân sự", points: 15, desc: "Doanh nghiệp vừa, quyết định mua hàng linh hoạt", isActive: true },
        { id: "rule-size-4", category: "COMPANY_SIZE", criterion: "20 - 50 nhân sự", points: 10, desc: "Doanh nghiệp nhỏ, ngân sách giới hạn", isActive: true },
        { id: "rule-size-5", category: "COMPANY_SIZE", criterion: "Dưới 20 nhân sự (Startup / Siêu nhỏ)", points: 5, desc: "Cần gói giải pháp cơ bản hoặc dùng thử", isActive: true },

        // 🌐 Nguồn Lead (Lead Source)
        { id: "rule-src-1", category: "LEAD_SOURCE", criterion: "Giới thiệu / Đối tác (Referral)", points: 25, desc: "Tỷ lệ tin tưởng cao nhất, khả năng chốt sale trên 70%", isActive: true },
        { id: "rule-src-2", category: "LEAD_SOURCE", criterion: "Đăng ký Website / Inbound Form", points: 20, desc: "Khách hàng chủ động tìm kiếm và có nhu cầu rõ ràng", isActive: true },
        { id: "rule-src-3", category: "LEAD_SOURCE", criterion: "Sự kiện / Hội thảo Offline", points: 15, desc: "Đã tiếp xúc trực tiếp tại gian hàng hội thảo", isActive: true },
        { id: "rule-src-4", category: "LEAD_SOURCE", criterion: "Quảng cáo Google / Facebook Ads", points: 10, desc: "Thu hút qua chiến dịch Digital Marketing", isActive: true },
        { id: "rule-src-5", category: "LEAD_SOURCE", criterion: "Outbound / Cold Call / Email", points: 5, desc: "Đội ngũ SDR tự tìm kiếm và tiếp cận ban đầu", isActive: true },

        // 🎯 Mức độ quan tâm / tương tác (Engagement Level)
        { id: "rule-eng-1", category: "ENGAGEMENT", criterion: "Yêu cầu Demo & Báo giá ngay", points: 25, desc: "Tín hiệu mua hàng mạnh nhất, sẵn sàng triển khai", isActive: true },
        { id: "rule-eng-2", category: "ENGAGEMENT", criterion: "Tham gia đầy đủ Webinar chuyên sâu", points: 20, desc: "Đã nghe thuyết trình giải pháp trên 45 phút", isActive: true },
        { id: "rule-eng-3", category: "ENGAGEMENT", criterion: "Mở email > 3 lần & Tải Catalog", points: 15, desc: "Quan tâm nghiên cứu tính năng sản phẩm", isActive: true },
        { id: "rule-eng-4", category: "ENGAGEMENT", criterion: "Xem bảng giá trên Website", points: 10, desc: "Đang cân nhắc chi phí và so sánh giải pháp", isActive: true },
        { id: "rule-eng-5", category: "ENGAGEMENT", criterion: "Chỉ ghé thăm trang chủ", points: 5, desc: "Mới biết đến thương hiệu, chưa có hành vi cụ thể", isActive: true },
        { id: "rule-eng-6", category: "ENGAGEMENT", criterion: "Không phản hồi > 30 ngày / Bỏ qua email", points: -15, desc: "Trừ điểm: Lead nguội dần, giảm mức độ ưu tiên gọi", isActive: true }
    ];

    const DEFAULT_SIM_LEADS = [
        {
            id: "lead-1",
            company: "Tập đoàn Công nghệ Viettel Solution",
            contact: "Nguyễn Văn Tuấn (CTO)",
            email: "tuan.nv@viettel.vn",
            industry: "CNTT & Viễn thông / Phần mềm",
            size: "Trên 500 nhân sự (Enterprise)",
            source: "Giới thiệu / Đối tác (Referral)",
            engagement: "Yêu cầu Demo & Báo giá ngay"
        },
        {
            id: "lead-2",
            company: "Ngân hàng TMCP Phương Đông (OCB)",
            contact: "Trần Thị Mai Anh (GĐ Mua sắm)",
            email: "maianh.tt@ocb.com.vn",
            industry: "Tài chính - Ngân hàng - Bảo hiểm",
            size: "Trên 500 nhân sự (Enterprise)",
            source: "Đăng ký Website / Inbound Form",
            engagement: "Yêu cầu Demo & Báo giá ngay"
        },
        {
            id: "lead-3",
            company: "Công ty Cổ phần Phần mềm FAST",
            contact: "Lê Hoàng Long (Trưởng phòng CNTT)",
            email: "long.lh@fast.com.vn",
            industry: "CNTT & Viễn thông / Phần mềm",
            size: "50 - 200 nhân sự",
            source: "Giới thiệu / Đối tác (Referral)",
            engagement: "Yêu cầu Demo & Báo giá ngay"
        },
        {
            id: "lead-4",
            company: "Công ty Cổ phần Bán Lẻ Con Cưng",
            contact: "Đặng Minh Tâm (GĐ Vận hành)",
            email: "tam.dm@concung.com.vn",
            industry: "Bán lẻ & Thương mại điện tử",
            size: "200 - 500 nhân sự",
            source: "Sự kiện / Hội thảo Offline",
            engagement: "Tham gia đầy đủ Webinar chuyên sâu"
        },
        {
            id: "lead-5",
            company: "Tập đoàn Bảo hiểm FWD Việt Nam",
            contact: "Phạm Hải Yến (Trưởng bộ phận CSKH)",
            email: "yen.ph@fwd.vn",
            industry: "Tài chính - Ngân hàng - Bảo hiểm",
            size: "200 - 500 nhân sự",
            source: "Đăng ký Website / Inbound Form",
            engagement: "Xem bảng giá trên Website"
        },
        {
            id: "lead-6",
            company: "Tập đoàn Xây dựng Coteccons",
            contact: "Bùi Quốc Cường (Phó phòng Dự án)",
            email: "cuong.bq@coteccons.vn",
            industry: "Bất động sản & Xây dựng",
            size: "Trên 500 nhân sự (Enterprise)",
            source: "Quảng cáo Google / Facebook Ads",
            engagement: "Mở email > 3 lần & Tải Catalog"
        },
        {
            id: "lead-7",
            company: "Chuỗi Nhà thuốc An Khang",
            contact: "Hoàng Đức Thịnh (Phụ trách Hệ thống)",
            email: "thinh.hd@ankhang.com",
            industry: "Y tế & Giáo dục",
            size: "50 - 200 nhân sự",
            source: "Đăng ký Website / Inbound Form",
            engagement: "Mở email > 3 lần & Tải Catalog"
        },
        {
            id: "lead-8",
            company: "Công ty Logistics Cảng Sài Gòn",
            contact: "Vũ Thanh Hằng (Phó GĐ Kinh doanh)",
            email: "hang.vt@saigonport.vn",
            industry: "Sản xuất & Công nghiệp nặng",
            size: "50 - 200 nhân sự",
            source: "Outbound / Cold Call / Email",
            engagement: "Mở email > 3 lần & Tải Catalog"
        },
        {
            id: "lead-9",
            company: "Công ty TNHH Cơ Khí Hồng Phát",
            contact: "Trịnh Bá Hùng (Giám đốc)",
            email: "hung.tb@hongphatmech.vn",
            industry: "Sản xuất & Công nghiệp nặng",
            size: "200 - 500 nhân sự",
            source: "Sự kiện / Hội thảo Offline",
            engagement: "Không phản hồi > 30 ngày / Bỏ qua email"
        },
        {
            id: "lead-10",
            company: "Shop Hoa Tươi Sunny Flower",
            contact: "Nguyễn Thị Hoa (Chủ hộ kinh doanh)",
            email: "hoa.sunny@gmail.com",
            industry: "Ngành nghề khác",
            size: "Dưới 20 nhân sự (Startup / Siêu nhỏ)",
            source: "Quảng cáo Google / Facebook Ads",
            engagement: "Chỉ ghé thăm trang chủ"
        }
    ];

    /* ====================================================================
       2. STATE MANAGEMENT
    ==================================================================== */
    let rules = [];
    let thresholds = { ...DEFAULT_THRESHOLDS };
    let simLeads = [];

    let currentCategoryFilter = "ALL";
    let currentRuleSearchKeyword = "";

    let currentSimTempFilter = "ALL";
    let currentSimSearchKeyword = "";
    let autoSortByScore = true;

    /* ====================================================================
       3. STORAGE HELPERS
    ==================================================================== */
    function loadState() {
        try {
            const rawRules = localStorage.getItem(STORAGE_RULES_KEY);
            rules = rawRules ? JSON.parse(rawRules) : JSON.parse(JSON.stringify(DEFAULT_RULES));

            const rawThresholds = localStorage.getItem(STORAGE_THRESHOLDS_KEY);
            thresholds = rawThresholds ? JSON.parse(rawThresholds) : { ...DEFAULT_THRESHOLDS };

            const rawLeads = localStorage.getItem(STORAGE_LEADS_KEY);
            simLeads = rawLeads ? JSON.parse(rawLeads) : JSON.parse(JSON.stringify(DEFAULT_SIM_LEADS));
        } catch (e) {
            console.error("Lỗi khi nạp dữ liệu Lead Scoring từ localStorage:", e);
            rules = JSON.parse(JSON.stringify(DEFAULT_RULES));
            thresholds = { ...DEFAULT_THRESHOLDS };
            simLeads = JSON.parse(JSON.stringify(DEFAULT_SIM_LEADS));
        }
    }

    function saveState() {
        try {
            localStorage.setItem(STORAGE_RULES_KEY, JSON.stringify(rules));
            localStorage.setItem(STORAGE_THRESHOLDS_KEY, JSON.stringify(thresholds));
            localStorage.setItem(STORAGE_LEADS_KEY, JSON.stringify(simLeads));
        } catch (e) {
            console.error("Lỗi khi lưu dữ liệu Lead Scoring:", e);
        }
    }

    /* ====================================================================
       4. SCORING & CLASSIFICATION LOGIC (CORE ENGINE)
    ==================================================================== */
    /**
     * Tính tổng điểm của một lead dựa trên các thuộc tính và bộ quy tắc đang kích hoạt
     */
    function calculateLeadScore(lead) {
        let score = 0;
        const breakdown = {
            industry: 0,
            size: 0,
            source: 0,
            engagement: 0
        };

        rules.forEach(rule => {
            if (!rule.isActive) return;

            if (rule.category === "INDUSTRY" && rule.criterion === lead.industry) {
                score += rule.points;
                breakdown.industry += rule.points;
            } else if (rule.category === "COMPANY_SIZE" && rule.criterion === lead.size) {
                score += rule.points;
                breakdown.size += rule.points;
            } else if (rule.category === "LEAD_SOURCE" && rule.criterion === lead.source) {
                score += rule.points;
                breakdown.source += rule.points;
            } else if (rule.category === "ENGAGEMENT" && rule.criterion === lead.engagement) {
                score += rule.points;
                breakdown.engagement += rule.points;
            }
        });

        // Điểm không âm dưới 0
        score = Math.max(0, score);

        return { score, breakdown };
    }

    /**
     * Phân loại nhiệt độ: Nóng (Hot), Ấm (Warm), Lạnh (Cold) theo ngưỡng
     * AC 3: Phân loại Nóng, Ấm, Lạnh theo ngưỡng điểm khai báo được
     */
    function getLeadTemperature(score) {
        if (score >= thresholds.hot) {
            return {
                type: "HOT",
                label: "🔥 NÓNG",
                subLabel: "Hot Lead",
                colorClass: "hot",
                action: "⚡ Gọi ngay trong vòng 2 giờ",
                actionClass: "action-hot"
            };
        } else if (score >= thresholds.warm) {
            return {
                type: "WARM",
                label: "☀️ ẤM",
                subLabel: "Warm Lead",
                colorClass: "warm",
                action: "📞 Liên hệ trong 24 - 48 giờ",
                actionClass: "action-warm"
            };
        } else {
            return {
                type: "COLD",
                label: "❄️ LẠNH",
                subLabel: "Cold Lead",
                colorClass: "cold",
                action: "✉️ Đưa vào Email Drip tự động",
                actionClass: "action-cold"
            };
        }
    }

    /* ====================================================================
       5. RENDER FUNCTIONS
    ==================================================================== */
    function renderAll() {
        renderThresholdsUI();
        renderRulesUI();
        renderSimulationUI();
        renderKPIMetrics();
    }

    /**
     * Render Khu vực 2: Cấu hình ngưỡng nhiệt độ & Thanh đo dải màu trực quan
     */
    function renderThresholdsUI() {
        const inputHot = document.getElementById("inputHotThreshold");
        const inputWarm = document.getElementById("inputWarmThreshold");

        if (inputHot && inputHot.value !== String(thresholds.hot)) {
            inputHot.value = thresholds.hot;
        }
        if (inputWarm && inputWarm.value !== String(thresholds.warm)) {
            inputWarm.value = thresholds.warm;
        }

        const hotBadge = document.getElementById("hotRangeBadge");
        if (hotBadge) hotBadge.textContent = `≥ ${thresholds.hot} điểm`;

        const warmBadge = document.getElementById("warmRangeBadge");
        if (warmBadge) warmBadge.textContent = `${thresholds.warm} - ${thresholds.hot - 1} điểm`;

        const coldBadge = document.getElementById("coldRangeBadge");
        if (coldBadge) coldBadge.textContent = `< ${thresholds.warm} điểm`;

        const coldText = document.getElementById("coldRangeText");
        if (coldText) coldText.textContent = `0 đến ${Math.max(0, thresholds.warm - 1)} điểm`;

        // Update visual spectrum bar
        const segmentCold = document.getElementById("segmentCold");
        const segmentWarm = document.getElementById("segmentWarm");
        const segmentHot = document.getElementById("segmentHot");

        const coldWidth = Math.min(100, Math.max(10, thresholds.warm));
        const warmWidth = Math.min(100 - coldWidth, Math.max(10, thresholds.hot - thresholds.warm));
        const hotWidth = Math.max(10, 100 - coldWidth - warmWidth);

        if (segmentCold) segmentCold.style.width = `${coldWidth}%`;
        if (segmentWarm) segmentWarm.style.width = `${warmWidth}%`;
        if (segmentHot) segmentHot.style.width = `${hotWidth}%`;

        const labelColdMax = document.getElementById("labelColdMax");
        if (labelColdMax) labelColdMax.textContent = thresholds.warm;

        const labelWarmMin = document.getElementById("labelWarmMin");
        if (labelWarmMin) labelWarmMin.textContent = thresholds.warm;

        const labelWarmMax = document.getElementById("labelWarmMax");
        if (labelWarmMax) labelWarmMax.textContent = thresholds.hot - 1;

        const labelHotMin = document.getElementById("labelHotMin");
        if (labelHotMin) labelHotMin.textContent = thresholds.hot;

        const markerWarm = document.getElementById("markerWarm");
        if (markerWarm) markerWarm.textContent = `${thresholds.warm} điểm (Ấm)`;

        const markerHot = document.getElementById("markerHot");
        if (markerHot) markerHot.textContent = `${thresholds.hot} điểm (Nóng)`;
    }

    /**
     * Render Khu vực 1: Danh sách quy tắc chấm điểm (Scoring Rules)
     */
    function renderRulesUI() {
        const container = document.getElementById("rulesListContainer");
        if (!container) return;

        // Update tabs badges
        const countAll = rules.length;
        const countInd = rules.filter(r => r.category === "INDUSTRY").length;
        const countSize = rules.filter(r => r.category === "COMPANY_SIZE").length;
        const countSrc = rules.filter(r => r.category === "LEAD_SOURCE").length;
        const countEng = rules.filter(r => r.category === "ENGAGEMENT").length;

        setText("badgeCountAll", countAll);
        setText("badgeCountIndustry", countInd);
        setText("badgeCountSize", countSize);
        setText("badgeCountSource", countSrc);
        setText("badgeCountEngagement", countEng);

        // Filter list
        const keyword = currentRuleSearchKeyword.toLowerCase().trim();
        const filtered = rules.filter(rule => {
            const matchCategory = currentCategoryFilter === "ALL" || rule.category === currentCategoryFilter;
            const matchKeyword = !keyword || 
                rule.criterion.toLowerCase().includes(keyword) || 
                (rule.desc && rule.desc.toLowerCase().includes(keyword));
            return matchCategory && matchKeyword;
        });

        setText("rulesFilterSummary", `Hiển thị ${filtered.length} / ${rules.length} quy tắc`);

        if (filtered.length === 0) {
            container.innerHTML = `
                <div style="grid-column: 1 / -1; padding: 36px 20px; text-align: center; color: var(--crm-muted);">
                    <div style="font-size: 32px; margin-bottom: 8px;">🔍</div>
                    <p style="font-weight: 600; margin: 0;">Không tìm thấy quy tắc chấm điểm nào</p>
                    <span style="font-size: 12.5px;">Thử thay đổi từ khóa hoặc bộ lọc nhóm tiêu chí.</span>
                </div>
            `;
            return;
        }

        container.innerHTML = filtered.map(rule => {
            const cat = CATEGORIES[rule.category] || { label: rule.category, icon: "📌" };
            const isPos = rule.points >= 0;
            const ptsBadgeClass = isPos ? "badge-pts-pos" : "badge-pts-neg";
            const ptsSign = isPos ? `+${rule.points}` : `${rule.points}`;

            return `
                <div class="rule-item-card ${rule.isActive ? "" : "inactive"}" data-rule-id="${escapeHtml(rule.id)}">
                    <div class="rule-item-left">
                        <div class="rule-category-icon" title="${cat.label}">${cat.icon}</div>
                        <div class="rule-details">
                            <h4 class="rule-criterion-name" title="${escapeHtml(rule.criterion)}">${escapeHtml(rule.criterion)}</h4>
                            <div class="rule-meta">
                                <span class="rule-category-tag">${cat.label}</span>
                                <span>•</span>
                                <span style="font-size: 11.5px; opacity: 0.85;">${escapeHtml(rule.desc || "Không có ghi chú")}</span>
                            </div>
                        </div>
                    </div>

                    <div class="rule-item-right">
                        <span class="rule-points-badge ${ptsBadgeClass}" title="Số điểm được cộng/trừ">${ptsSign} đ</span>

                        <label class="crm-switch" title="${rule.isActive ? "Đang bật quy tắc" : "Đang tắt quy tắc"}">
                            <input type="checkbox" class="rule-toggle-active" data-id="${escapeHtml(rule.id)}" ${rule.isActive ? "checked" : ""}>
                            <span class="switch-slider"></span>
                        </label>

                        <div class="rule-item-actions">
                            <button type="button" class="btn-icon-ghost btn-edit-rule" data-id="${escapeHtml(rule.id)}" title="Chỉnh sửa quy tắc">
                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                            </button>
                            <button type="button" class="btn-icon-ghost delete btn-delete-rule" data-id="${escapeHtml(rule.id)}" title="Xóa quy tắc">
                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }).join("");
    }

    /**
     * Render Khu vực 3: Bảng danh sách Lead mô phỏng (Live Simulation Sandbox)
     * AC 2: Điểm được tính lại tự động khi thông tin lead thay đổi.
     * AC 4: Điểm chỉ để sắp xếp ưu tiên, không tự động loại lead.
     */
    function renderSimulationUI() {
        const tbody = document.getElementById("simTableBody");
        if (!tbody) return;

        // 1. Tính toán điểm và nhiệt độ cho tất cả lead mô phỏng
        const processedLeads = simLeads.map(lead => {
            const { score, breakdown } = calculateLeadScore(lead);
            const temp = getLeadTemperature(score);
            return {
                ...lead,
                score,
                breakdown,
                temp
            };
        });

        // 2. Cập nhật số lượng các mức nhiệt độ
        const countAll = processedLeads.length;
        const countHot = processedLeads.filter(l => l.temp.type === "HOT").length;
        const countWarm = processedLeads.filter(l => l.temp.type === "WARM").length;
        const countCold = processedLeads.filter(l => l.temp.type === "COLD").length;

        setText("simCountAll", countAll);
        setText("simCountHot", countHot);
        setText("simCountWarm", countWarm);
        setText("simCountCold", countCold);

        // 3. Sắp xếp ưu tiên (AC 4: Điểm chỉ để sắp xếp ưu tiên, không loại lead)
        let displayLeads = [...processedLeads];
        if (autoSortByScore) {
            displayLeads.sort((a, b) => b.score - a.score);
        }

        // 4. Lọc hiển thị view (nếu người dùng bấm nút lọc nhanh)
        const searchKw = currentSimSearchKeyword.toLowerCase().trim();
        displayLeads = displayLeads.filter(item => {
            const matchTemp = currentSimTempFilter === "ALL" || item.temp.type === currentSimTempFilter;
            const matchSearch = !searchKw || 
                item.company.toLowerCase().includes(searchKw) || 
                item.contact.toLowerCase().includes(searchKw) || 
                (item.email && item.email.toLowerCase().includes(searchKw));
            return matchTemp && matchSearch;
        });

        if (displayLeads.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="10" style="text-align: center; padding: 40px 20px; color: var(--crm-muted);">
                        <div style="font-size: 32px; margin-bottom: 8px;">👥</div>
                        <strong>Không có khách hàng tiềm năng nào phù hợp bộ lọc</strong>
                    </td>
                </tr>
            `;
            return;
        }

        // 5. Render từng hàng trong bảng kèm inline select cho phép test trực tiếp
        tbody.innerHTML = displayLeads.map((item, index) => {
            const rank = index + 1;
            const rankClass = rank === 1 ? "rank-1" : rank === 2 ? "rank-2" : rank === 3 ? "rank-3" : "";
            const initial = (item.company || "L").trim().charAt(0).toUpperCase();

            // Progress bar width (max 100)
            const progressPct = Math.min(100, item.score);

            return `
                <tr data-lead-id="${escapeHtml(item.id)}">
                    <!-- Rank ưu tiên gọi (AC 4) -->
                    <td style="text-align: center;">
                        <div class="priority-rank ${rankClass}" title="Ưu tiên gọi thứ #${rank}">#${rank}</div>
                    </td>

                    <!-- Thông tin Doanh nghiệp -->
                    <td>
                        <div class="lead-identity">
                            <div class="lead-avatar">${initial}</div>
                            <div>
                                <h5 class="lead-company-name">${escapeHtml(item.company)}</h5>
                                <div class="lead-contact-name">${escapeHtml(item.contact)}</div>
                            </div>
                        </div>
                    </td>

                    <!-- Ngành nghề (Inline Select) -->
                    <td>
                        <select class="sim-inline-select sim-select-industry" data-id="${escapeHtml(item.id)}" title="Thay đổi để xem điểm tính lại tự động">
                            ${buildOptionsHtml("INDUSTRY", item.industry)}
                        </select>
                    </td>

                    <!-- Quy mô (Inline Select) -->
                    <td>
                        <select class="sim-inline-select sim-select-size" data-id="${escapeHtml(item.id)}" title="Thay đổi để xem điểm tính lại tự động">
                            ${buildOptionsHtml("COMPANY_SIZE", item.size)}
                        </select>
                    </td>

                    <!-- Nguồn Lead (Inline Select) -->
                    <td>
                        <select class="sim-inline-select sim-select-source" data-id="${escapeHtml(item.id)}" title="Thay đổi để xem điểm tính lại tự động">
                            ${buildOptionsHtml("LEAD_SOURCE", item.source)}
                        </select>
                    </td>

                    <!-- Mức độ quan tâm (Inline Select) -->
                    <td>
                        <select class="sim-inline-select sim-select-engagement" data-id="${escapeHtml(item.id)}" title="Thay đổi để xem điểm tính lại tự động">
                            ${buildOptionsHtml("ENGAGEMENT", item.engagement)}
                        </select>
                    </td>

                    <!-- Tổng điểm & Progress Mini -->
                    <td>
                        <div class="score-cell-wrap" title="Chi tiết: Ngành (${item.breakdown.industry}đ) + Quy mô (${item.breakdown.size}đ) + Nguồn (${item.breakdown.source}đ) + Tương tác (${item.breakdown.engagement}đ)">
                            <div class="score-number-row">
                                <span class="score-main-value">${item.score}</span>
                                <span class="score-max-value">/ 100đ</span>
                            </div>
                            <div class="score-progress-bar">
                                <div class="score-progress-fill ${item.temp.colorClass}" style="width: ${progressPct}%;"></div>
                            </div>
                        </div>
                    </td>

                    <!-- Nhiệt độ (Nóng / Ấm / Lạnh) -->
                    <td>
                        <span class="temp-status-badge ${item.temp.colorClass}" title="${item.temp.subLabel}">
                            ${item.temp.label}
                        </span>
                    </td>

                    <!-- Hành động gợi ý cho nhân viên -->
                    <td>
                        <div class="suggested-action-badge ${item.temp.actionClass}">
                            ${item.temp.action}
                        </div>
                    </td>

                    <!-- Xóa lead mô phỏng -->
                    <td style="text-align: center;">
                        <button type="button" class="btn-icon-ghost delete btn-delete-lead" data-id="${escapeHtml(item.id)}" title="Xóa lead khỏi mô phỏng">
                            &times;
                        </button>
                    </td>
                </tr>
            `;
        }).join("");
    }

    /**
     * Render các chỉ số KPI Metrics ribbon ở đầu trang
     */
    function renderKPIMetrics() {
        const activeRulesCount = rules.filter(r => r.isActive).length;
        setText("metricActiveRules", `${activeRulesCount} / ${rules.length}`);

        // Điểm tối đa lý thuyết: lấy quy tắc có điểm cao nhất của mỗi nhóm
        const maxByCat = {};
        rules.forEach(r => {
            if (!r.isActive) return;
            if (!maxByCat[r.category] || r.points > maxByCat[r.category]) {
                maxByCat[r.category] = r.points;
            }
        });
        const maxScore = Object.values(maxByCat).reduce((a, b) => a + Math.max(0, b), 0);
        setText("metricMaxScore", `${maxScore || 100} điểm`);

        setText("metricThresholdSummary", `🔥 ≥${thresholds.hot} | ☀️ ${thresholds.warm}-${thresholds.hot - 1}`);

        // Thống kê phân loại leads
        let hotCount = 0, warmCount = 0, coldCount = 0;
        simLeads.forEach(l => {
            const { score } = calculateLeadScore(l);
            const temp = getLeadTemperature(score);
            if (temp.type === "HOT") hotCount++;
            else if (temp.type === "WARM") warmCount++;
            else coldCount++;
        });

        setText("metricLeadSimCount", `${simLeads.length} Leads`);
        setText("metricLeadDist", `${hotCount} Nóng • ${warmCount} Ấm • ${coldCount} Lạnh`);
    }

    /**
     * Tạo danh sách options HTML từ các rules của nhóm
     */
    function buildOptionsHtml(category, selectedVal) {
        // Lấy tất cả tiêu chí của nhóm từ rules
        const categoryRules = rules.filter(r => r.category === category);
        let options = categoryRules.map(r => r.criterion);

        // Đảm bảo có selectedVal nếu chưa có
        if (selectedVal && !options.includes(selectedVal)) {
            options.unshift(selectedVal);
        }

        // Loại bỏ trùng lặp
        options = Array.from(new Set(options));

        return options.map(opt => {
            const rule = categoryRules.find(r => r.criterion === opt);
            const ptsText = rule ? ` (${rule.points >= 0 ? "+" : ""}${rule.points}đ)` : "";
            const isSel = opt === selectedVal ? "selected" : "";
            return `<option value="${escapeHtml(opt)}" ${isSel}>${escapeHtml(opt)}${ptsText}</option>`;
        }).join("");
    }

    /* ====================================================================
       6. EVENT LISTENERS & INTERACTIONS
    ==================================================================== */
    function initEventListeners() {
        // --- 1. NGƯỠNG NHIỆT ĐỘ (KHU VỰC 2) ---
        const inputHot = document.getElementById("inputHotThreshold");
        const inputWarm = document.getElementById("inputWarmThreshold");

        if (inputHot) {
            inputHot.addEventListener("input", function () {
                const val = parseInt(this.value, 10);
                if (!isNaN(val) && val > thresholds.warm && val <= 100) {
                    thresholds.hot = val;
                    saveState();
                    renderThresholdsUI();
                    renderSimulationUI();
                    renderKPIMetrics();
                }
            });
        }

        if (inputWarm) {
            inputWarm.addEventListener("input", function () {
                const val = parseInt(this.value, 10);
                if (!isNaN(val) && val >= 0 && val < thresholds.hot) {
                    thresholds.warm = val;
                    saveState();
                    renderThresholdsUI();
                    renderSimulationUI();
                    renderKPIMetrics();
                }
            });
        }

        const btnResetThresholds = document.getElementById("btnResetThresholds");
        if (btnResetThresholds) {
            btnResetThresholds.addEventListener("click", function () {
                thresholds = { ...DEFAULT_THRESHOLDS };
                saveState();
                renderAll();
                showToast("Đã khôi phục ngưỡng nhiệt độ chuẩn (Nóng ≥ 80, Ấm 50-79, Lạnh < 50)", "info");
            });
        }

        // --- 2. QUY TẮC CHẤM ĐIỂM (KHU VỰC 1) ---
        // Tab chuyển nhóm tiêu chí
        const tabsNav = document.getElementById("rulesCategoryTabs");
        if (tabsNav) {
            tabsNav.addEventListener("click", function (e) {
                const btn = e.target.closest(".rule-tab-btn");
                if (!btn) return;

                tabsNav.querySelectorAll(".rule-tab-btn").forEach(b => b.classList.remove("active"));
                btn.classList.add("active");
                currentCategoryFilter = btn.dataset.category || "ALL";
                renderRulesUI();
            });
        }

        // Ô tìm kiếm quy tắc
        const ruleSearchInput = document.getElementById("ruleSearchInput");
        if (ruleSearchInput) {
            ruleSearchInput.addEventListener("input", function () {
                currentRuleSearchKeyword = this.value;
                renderRulesUI();
            });
        }

        // Bật / Tắt quy tắc (Toggle Active Switch)
        const rulesList = document.getElementById("rulesListContainer");
        if (rulesList) {
            rulesList.addEventListener("change", function (e) {
                if (!e.target.classList.contains("rule-toggle-active")) return;
                const ruleId = e.target.dataset.id;
                const rule = rules.find(r => r.id === ruleId);
                if (rule) {
                    rule.isActive = e.target.checked;
                    saveState();
                    renderAll();
                    showToast(`Đã ${rule.isActive ? "kích hoạt" : "tạm dừng"} quy tắc: "${rule.criterion}"`, "info");
                }
            });

            // Nút sửa và xóa quy tắc
            rulesList.addEventListener("click", function (e) {
                const btnEdit = e.target.closest(".btn-edit-rule");
                if (btnEdit) {
                    const ruleId = btnEdit.dataset.id;
                    openEditRuleModal(ruleId);
                    return;
                }

                const btnDelete = e.target.closest(".btn-delete-rule");
                if (btnDelete) {
                    const ruleId = btnDelete.dataset.id;
                    deleteRule(ruleId);
                    return;
                }
            });
        }

        // Nút mở modal thêm quy tắc
        const btnOpenAddRule = document.getElementById("btnOpenAddRuleModal");
        const btnQuickAdd = document.getElementById("btnQuickAddRule");
        if (btnOpenAddRule) btnOpenAddRule.addEventListener("click", () => openAddRuleModal());
        if (btnQuickAdd) btnQuickAdd.addEventListener("click", () => openAddRuleModal());

        // Đóng modal quy tắc
        const btnCloseRuleModal = document.getElementById("btnCloseRuleModal");
        const btnCancelRuleModal = document.getElementById("btnCancelRuleModal");
        const ruleOverlay = document.getElementById("ruleModalOverlay");
        if (btnCloseRuleModal) btnCloseRuleModal.addEventListener("click", closeRuleModal);
        if (btnCancelRuleModal) btnCancelRuleModal.addEventListener("click", closeRuleModal);
        if (ruleOverlay) ruleOverlay.addEventListener("click", closeRuleModal);

        // Submit form quy tắc
        const ruleForm = document.getElementById("ruleForm");
        if (ruleForm) {
            ruleForm.addEventListener("submit", function (e) {
                e.preventDefault();
                saveRuleForm();
            });
        }

        // --- 3. BẢNG MÔ PHỎNG LEAD (KHU VỰC 3) ---
        // Sắp xếp tự động toggle
        const checkSort = document.getElementById("checkSortByScore");
        if (checkSort) {
            checkSort.addEventListener("change", function () {
                autoSortByScore = this.checked;
                renderSimulationUI();
            });
        }

        // Nút lọc nhanh theo nhiệt độ (Tất cả, Nóng, Ấm, Lạnh)
        document.querySelectorAll(".sim-filter-btn").forEach(btn => {
            btn.addEventListener("click", function () {
                document.querySelectorAll(".sim-filter-btn").forEach(b => b.classList.remove("active"));
                this.classList.add("active");
                currentSimTempFilter = this.dataset.filter || "ALL";
                renderSimulationUI();
            });
        });

        // Tìm kiếm trong bảng mô phỏng
        const simSearch = document.getElementById("simSearchInput");
        if (simSearch) {
            simSearch.addEventListener("input", function () {
                currentSimSearchKeyword = this.value;
                renderSimulationUI();
            });
        }

        // Thay đổi inline các thuộc tính của Lead -> Tự động tính lại điểm tức thì! (AC 2)
        const simTableBody = document.getElementById("simTableBody");
        if (simTableBody) {
            simTableBody.addEventListener("change", function (e) {
                const target = e.target;
                if (!target.classList.contains("sim-inline-select")) return;

                const leadId = target.dataset.id;
                const lead = simLeads.find(l => l.id === leadId);
                if (!lead) return;

                if (target.classList.contains("sim-select-industry")) {
                    lead.industry = target.value;
                } else if (target.classList.contains("sim-select-size")) {
                    lead.size = target.value;
                } else if (target.classList.contains("sim-select-source")) {
                    lead.source = target.value;
                } else if (target.classList.contains("sim-select-engagement")) {
                    lead.engagement = target.value;
                }

                saveState();
                renderSimulationUI();
                renderKPIMetrics();

                const { score } = calculateLeadScore(lead);
                const temp = getLeadTemperature(score);
                showToast(`Lead "${lead.company}" đã được tính lại: ${score} điểm (${temp.label})`, "success");
            });

            // Nút xóa lead khỏi bảng mô phỏng
            simTableBody.addEventListener("click", function (e) {
                const btnDel = e.target.closest(".btn-delete-lead");
                if (!btnDel) return;

                const leadId = btnDel.dataset.id;
                if (confirm("Bạn có chắc chắn muốn xóa lead này khỏi danh sách mô phỏng?")) {
                    simLeads = simLeads.filter(l => l.id !== leadId);
                    saveState();
                    renderSimulationUI();
                    renderKPIMetrics();
                    showToast("Đã xóa lead khỏi mô phỏng", "info");
                }
            });
        }

        // Nút đặt lại lead mẫu
        const btnResetSim = document.getElementById("btnResetSimulationLeads");
        if (btnResetSim) {
            btnResetSim.addEventListener("click", function () {
                if (confirm("Khôi phục danh sách 10 Lead mô phỏng chuẩn ban đầu?")) {
                    simLeads = JSON.parse(JSON.stringify(DEFAULT_SIM_LEADS));
                    saveState();
                    renderSimulationUI();
                    renderKPIMetrics();
                    showToast("Đã khôi phục dữ liệu Lead mô phỏng ban đầu", "info");
                }
            });
        }

        // Nút mở modal thêm lead thử nghiệm
        const btnOpenAddLead = document.getElementById("btnOpenAddLeadModal");
        if (btnOpenAddLead) btnOpenAddLead.addEventListener("click", openAddLeadModal);

        const btnCloseLeadModal = document.getElementById("btnCloseLeadModal");
        const btnCancelLeadModal = document.getElementById("btnCancelLeadModal");
        const leadOverlay = document.getElementById("leadModalOverlay");
        if (btnCloseLeadModal) btnCloseLeadModal.addEventListener("click", closeLeadModal);
        if (btnCancelLeadModal) btnCancelLeadModal.addEventListener("click", closeLeadModal);
        if (leadOverlay) leadOverlay.addEventListener("click", closeLeadModal);

        const leadForm = document.getElementById("leadForm");
        if (leadForm) {
            leadForm.addEventListener("submit", function (e) {
                e.preventDefault();
                saveLeadForm();
            });
        }

        // Live preview score in lead modal
        ["leadIndustrySelect", "leadSizeSelect", "leadSourceSelect", "leadEngagementSelect"].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.addEventListener("change", updateModalLeadPreview);
        });

        // --- 4. TOP ACTIONS: LƯU & RESET TOÀN BỘ CẤU HÌNH ---
        const btnSaveAll = document.getElementById("btnSaveAllConfig");
        if (btnSaveAll) {
            btnSaveAll.addEventListener("click", function () {
                saveState();
                showToast("✅ Đã lưu toàn bộ cấu hình Chấm điểm Lead vào hệ thống thành công!", "success");
            });
        }

        const btnResetAll = document.getElementById("btnResetAllConfig");
        if (btnResetAll) {
            btnResetAll.addEventListener("click", function () {
                if (confirm("Khôi phục toàn bộ quy tắc chấm điểm và ngưỡng nhiệt độ về cài đặt mặc định?")) {
                    rules = JSON.parse(JSON.stringify(DEFAULT_RULES));
                    thresholds = { ...DEFAULT_THRESHOLDS };
                    simLeads = JSON.parse(JSON.stringify(DEFAULT_SIM_LEADS));
                    saveState();
                    renderAll();
                    showToast("Đã khôi phục toàn bộ cấu hình về mặc định", "info");
                }
            });
        }
    }

    /* ====================================================================
       7. MODAL ACTIONS (ADD/EDIT RULES & TEST LEADS)
    ==================================================================== */
    function openAddRuleModal() {
        document.getElementById("ruleModalTitle").textContent = "Thêm quy tắc chấm điểm mới";
        document.getElementById("editingRuleId").value = "";
        document.getElementById("ruleCategorySelect").value = currentCategoryFilter !== "ALL" ? currentCategoryFilter : "INDUSTRY";
        document.getElementById("ruleCriterionInput").value = "";
        document.getElementById("rulePointsInput").value = "20";
        document.getElementById("ruleDescInput").value = "";
        document.getElementById("ruleIsActiveInput").checked = true;

        document.getElementById("ruleModal").classList.add("open");
        document.getElementById("ruleModalOverlay").classList.add("open");
        document.getElementById("ruleCriterionInput").focus();
    }

    function openEditRuleModal(ruleId) {
        const rule = rules.find(r => r.id === ruleId);
        if (!rule) return;

        document.getElementById("ruleModalTitle").textContent = "Chỉnh sửa quy tắc chấm điểm";
        document.getElementById("editingRuleId").value = rule.id;
        document.getElementById("ruleCategorySelect").value = rule.category;
        document.getElementById("ruleCriterionInput").value = rule.criterion;
        document.getElementById("rulePointsInput").value = rule.points;
        document.getElementById("ruleDescInput").value = rule.desc || "";
        document.getElementById("ruleIsActiveInput").checked = rule.isActive;

        document.getElementById("ruleModal").classList.add("open");
        document.getElementById("ruleModalOverlay").classList.add("open");
        document.getElementById("ruleCriterionInput").focus();
    }

    function closeRuleModal() {
        document.getElementById("ruleModal")?.classList.remove("open");
        document.getElementById("ruleModalOverlay")?.classList.remove("open");
    }

    function saveRuleForm() {
        const editingId = document.getElementById("editingRuleId").value;
        const category = document.getElementById("ruleCategorySelect").value;
        const criterion = document.getElementById("ruleCriterionInput").value.trim();
        const points = parseInt(document.getElementById("rulePointsInput").value, 10);
        const desc = document.getElementById("ruleDescInput").value.trim();
        const isActive = document.getElementById("ruleIsActiveInput").checked;

        if (!criterion) {
            alert("Vui lòng nhập tên tiêu chí!");
            return;
        }

        if (isNaN(points)) {
            alert("Vui lòng nhập số điểm hợp lệ!");
            return;
        }

        if (editingId) {
            const rule = rules.find(r => r.id === editingId);
            if (rule) {
                rule.category = category;
                rule.criterion = criterion;
                rule.points = points;
                rule.desc = desc;
                rule.isActive = isActive;
                showToast(`Đã cập nhật quy tắc: "${criterion}" (${points >= 0 ? "+" : ""}${points}đ)`, "success");
            }
        } else {
            const newRule = {
                id: `rule-${Date.now()}`,
                category,
                criterion,
                points,
                desc,
                isActive
            };
            rules.push(newRule);
            showToast(`Đã thêm quy tắc mới: "${criterion}" (${points >= 0 ? "+" : ""}${points}đ)`, "success");
        }

        closeRuleModal();
        saveState();
        renderAll();
    }

    function deleteRule(ruleId) {
        const rule = rules.find(r => r.id === ruleId);
        if (!rule) return;

        if (confirm(`Bạn có chắc muốn xóa quy tắc "${rule.criterion}"?`)) {
            rules = rules.filter(r => r.id !== ruleId);
            saveState();
            renderAll();
            showToast(`Đã xóa quy tắc: "${rule.criterion}"`, "info");
        }
    }

    // --- Modal Thêm Lead thử nghiệm ---
    function openAddLeadModal() {
        // Populate select options
        populateSelectFromRules("leadIndustrySelect", "INDUSTRY");
        populateSelectFromRules("leadSizeSelect", "COMPANY_SIZE");
        populateSelectFromRules("leadSourceSelect", "LEAD_SOURCE");
        populateSelectFromRules("leadEngagementSelect", "ENGAGEMENT");

        document.getElementById("leadCompanyName").value = "";
        document.getElementById("leadContactName").value = "";

        updateModalLeadPreview();

        document.getElementById("leadModal").classList.add("open");
        document.getElementById("leadModalOverlay").classList.add("open");
        document.getElementById("leadCompanyName").focus();
    }

    function populateSelectFromRules(selectId, category) {
        const select = document.getElementById(selectId);
        if (!select) return;

        const catRules = rules.filter(r => r.category === category);
        select.innerHTML = catRules.map(r => {
            const sign = r.points >= 0 ? "+" : "";
            return `<option value="${escapeHtml(r.criterion)}">${escapeHtml(r.criterion)} (${sign}${r.points}đ)</option>`;
        }).join("");
    }

    function updateModalLeadPreview() {
        const tempLead = {
            industry: document.getElementById("leadIndustrySelect")?.value,
            size: document.getElementById("leadSizeSelect")?.value,
            source: document.getElementById("leadSourceSelect")?.value,
            engagement: document.getElementById("leadEngagementSelect")?.value
        };

        const { score } = calculateLeadScore(tempLead);
        const temp = getLeadTemperature(score);

        setText("modalLeadScorePreview", `${score} điểm`);

        const badge = document.getElementById("modalLeadTempPreview");
        if (badge) {
            badge.className = `temp-status-badge ${temp.colorClass}`;
            badge.textContent = temp.label;
        }
    }

    function closeLeadModal() {
        document.getElementById("leadModal")?.classList.remove("open");
        document.getElementById("leadModalOverlay")?.classList.remove("open");
    }

    function saveLeadForm() {
        const company = document.getElementById("leadCompanyName").value.trim();
        const contact = document.getElementById("leadContactName").value.trim();
        const industry = document.getElementById("leadIndustrySelect").value;
        const size = document.getElementById("leadSizeSelect").value;
        const source = document.getElementById("leadSourceSelect").value;
        const engagement = document.getElementById("leadEngagementSelect").value;

        if (!company || !contact) {
            alert("Vui lòng nhập tên công ty và người liên hệ!");
            return;
        }

        const newLead = {
            id: `lead-${Date.now()}`,
            company,
            contact,
            email: "contact@" + company.toLowerCase().replace(/[^a-z0-9]/g, "") + ".vn",
            industry,
            size,
            source,
            engagement
        };

        simLeads.unshift(newLead);
        closeLeadModal();
        saveState();
        renderSimulationUI();
        renderKPIMetrics();

        const { score } = calculateLeadScore(newLead);
        const temp = getLeadTemperature(score);
        showToast(`Đã thêm lead thử nghiệm "${company}" thành công! Điểm: ${score} (${temp.label})`, "success");
    }

    /* ====================================================================
       8. UTILITY HELPERS
    ==================================================================== */
    function setText(id, text) {
        const el = document.getElementById(id);
        if (el) el.textContent = text;
    }

    function escapeHtml(str) {
        return String(str ?? "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    function showToast(message, type = "info") {
        const container = document.getElementById("toastContainer");
        if (!container) return;

        const toast = document.createElement("div");
        toast.className = `crm-toast ${type}`;

        const icon = type === "success" ? "✅" : type === "error" ? "❌" : "ℹ️";
        toast.innerHTML = `<span>${icon}</span> <span>${escapeHtml(message)}</span>`;

        container.appendChild(toast);

        setTimeout(() => {
            toast.style.opacity = "0";
            toast.style.transform = "translateY(10px)";
            toast.style.transition = "all 250ms ease";
            setTimeout(() => toast.remove(), 250);
        }, 3200);
    }

    /* ====================================================================
       9. INITIALIZATION
    ==================================================================== */
    function init() {
        loadState();
        renderAll();
        initEventListeners();
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }
})();
