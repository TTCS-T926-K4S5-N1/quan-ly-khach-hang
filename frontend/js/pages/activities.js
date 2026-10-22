"use strict";

/* ==========================================================================
   ACTIVITIES CONTROLLER (SCRUM-109 / Subtask: SCRUM-228 [FE])
   Lọc và xem hoạt động chăm sóc khách hàng theo loại và người thực hiện 
   dành cho Trưởng nhóm kinh doanh (Sales Lead / Manager)
   ========================================================================== */

/**
 * =========================================================================
 * 1. TYPE DEFINITIONS (TypeScript interfaces via JSDoc)
 * =========================================================================
 * @typedef {Object} TeamMember
 * @property {number} id
 * @property {string} name
 * @property {string} role
 * @property {string} avatar
 * @property {string} color
 * @property {string} email
 * 
 * @typedef {'call' | 'meeting' | 'task' | 'email' | 'note'} ActivityType
 * @typedef {'open' | 'done' | 'late'} ActivityStatus
 * 
 * @typedef {Object} Activity
 * @property {string|number} id - Mã định danh hoạt động
 * @property {ActivityType} type - Loại hoạt động (Cuộc gọi, Họp, Task, Email, Ghi chú)
 * @property {string} title - Tiêu đề hoạt động
 * @property {string} [relation] - Khách hàng hoặc cơ hội kinh doanh liên quan
 * @property {string} date - Ngày diễn ra định dạng YYYY-MM-DD
 * @property {string} [time] - Giờ diễn ra định dạng HH:mm
 * @property {string} owner - Tên nhân sự phụ trách
 * @property {number} ownerId - ID của nhân sự phụ trách
 * @property {string} [description] - Nội dung tóm tắt hoặc kết quả tương tác
 * @property {'open' | 'done'} status - Trạng thái hoạt động
 * @property {string|number} [customerId] - ID khách hàng
 * @property {string|number} [opportunityId] - ID cơ hội
 * @property {string} [createdAt] - Thời gian tạo
 * 
 * @typedef {Object} FilterParams
 * @property {string} search - Từ khóa tìm kiếm
 * @property {string} member - Thành viên được chọn (ALL | MY | tên thành viên)
 * @property {string} type - Loại hoạt động (call | meeting | task | email | note | rỗng)
 * @property {string} status - Trạng thái lọc (open | done | late | rỗng)
 * @property {'ALL'|'TODAY'|'THIS_WEEK'|'THIS_MONTH'|'CUSTOM'} dateRange - Khoảng thời gian
 * @property {string} [startDate] - Ngày bắt đầu nếu là CUSTOM
 * @property {string} [endDate] - Ngày kết thúc nếu là CUSTOM
 * 
 * @typedef {Object} MemberCareStats
 * @property {TeamMember} member
 * @property {number} total
 * @property {number} calls
 * @property {number} meetings
 * @property {number} tasks
 * @property {number} emails
 * @property {number} notes
 * @property {number} done
 * @property {number} completionRate
 * @property {'care-level-high'|'care-level-medium'|'care-level-low'} careLevelClass
 * @property {string} careLevelText
 */

const STORAGE_KEY_ACTIVITIES = "crm_ui_activities";
const API_BASE = window.location.pathname.startsWith("/crm") ? "/crm" : "http://localhost:8080/crm";

/** @type {TeamMember[]} */
const TEAM_MEMBERS = [
    { id: 1, name: "Trần Thị Thu Hà", role: "Trưởng nhóm Kinh doanh Miền Bắc", avatar: "H", color: "#2563eb", email: "lead.mienbac@crm.local" },
    { id: 2, name: "Lê Hoàng Nam", role: "Chuyên viên KD B2B Senior", avatar: "N", color: "#059669", email: "sale.hn1@crm.local" },
    { id: 3, name: "Phạm Mai Phương", role: "Chuyên viên Kinh doanh", avatar: "P", color: "#d97706", email: "sale.hn2@crm.local" },
    { id: 4, name: "Bùi Đức Thành", role: "Kỹ sư Giải pháp (Solution Architect)", avatar: "T", color: "#7c3aed", email: "thanh.bd@crm.local" },
    { id: 5, name: "Võ Minh Thư", role: "Chuyên viên Hợp đồng & Pháp chế", avatar: "T", color: "#0891b2", email: "thu.vm@crm.local" },
    { id: 6, name: "Phan Văn Trung", role: "Trưởng nhóm Kinh doanh Miền Trung", avatar: "T", color: "#dc2626", email: "lead.mientrung@crm.local" }
];

/* ==========================================================================
   2. APPLICATION STATE
   ========================================================================== */
/** @type {Activity[]} */
let allActivities = [];

/** @type {Activity[]} */
let filteredActivities = [];

/** @type {FilterParams} */
const filterState = {
    search: "",
    member: "ALL",
    type: "",
    status: "",
    dateRange: "ALL",
    startDate: "",
    endDate: ""
};

// Pagination State
let currentPage = 1;
let pageSize = 10;
let isLoading = false;

// DOM Elements Cache
const drawer = document.getElementById("activityDrawer");
const overlay = document.getElementById("activityOverlay");
const activityForm = document.getElementById("activityForm");
const tableBody = document.getElementById("activityTableBody");
const errorBanner = document.getElementById("activityErrorBanner");
const errorMsgEl = document.getElementById("activityErrorMsg");

/* ==========================================================================
   3. RICH MOCK DATASET FOR CUSTOMER CARE TRACKING
   ========================================================================== */
function getRichMockActivities() {
    return [
        {
            id: "act-101",
            type: "meeting",
            title: "Họp giao ban đầu tuần Khối Kinh doanh",
            relation: "Nội bộ Khối Kinh doanh",
            date: "2026-10-19",
            time: "09:00",
            owner: "Trần Thị Thu Hà",
            ownerId: 1,
            description: "Đánh giá tiến độ hoàn thành KPI tháng 10 và kế hoạch tiếp cận chuỗi khách hàng Foxconn & VPBank.",
            status: "done",
            createdAt: "2026-10-19T08:30:00"
        },
        {
            id: "act-102",
            type: "meeting",
            title: "Gặp rà soát hợp đồng Viettravel Sun",
            relation: "Công ty TNHH Dịch vụ & Du lịch Viettravel Sun",
            date: "2026-10-19",
            time: "14:00",
            owner: "Phạm Mai Phương",
            ownerId: 3,
            description: "Thống nhất các điều khoản thanh toán theo tiến độ và thời gian bàn giao giải pháp tổng đài CRM.",
            status: "done",
            createdAt: "2026-10-19T11:00:00"
        },
        {
            id: "act-103",
            type: "call",
            title: "Gọi điện khảo sát nhu cầu mở rộng chuỗi NEM Fashion",
            relation: "Chuỗi Bán lẻ Thời trang NEM Fashion",
            date: "2026-10-20",
            time: "09:30",
            owner: "Lê Hoàng Nam",
            ownerId: 2,
            description: "Khảo sát quy trình bán hàng tại 50 showroom để lên bài toán tích hợp phần mềm khách hàng thân thiết.",
            status: "done",
            createdAt: "2026-10-20T09:00:00"
        },
        {
            id: "act-104",
            type: "task",
            title: "Dự toán chi phí triển khai hệ thống Foxconn",
            relation: "Tập đoàn Công nghiệp Foxconn VN",
            date: "2026-10-20",
            time: "16:00",
            owner: "Bùi Đức Thành",
            ownerId: 4,
            description: "Tính toán số lượng server và license database cho 3 nhà máy tại KCN Đình Trám và Quế Võ.",
            status: "done",
            createdAt: "2026-10-20T14:30:00"
        },
        {
            id: "act-105",
            type: "call",
            title: "Tư vấn cấu hình giải pháp LogiTech Global",
            relation: "Công ty Cổ phần Giải pháp Logistics LogiTech Việt Nam",
            date: "2026-10-21",
            time: "08:30",
            owner: "Lê Hoàng Nam",
            ownerId: 2,
            description: "Trao đổi kỹ thuật với Trưởng phòng IT LogiTech về kết nối API tự động cập nhật đơn hàng vận chuyển.",
            status: "done",
            createdAt: "2026-10-21T08:00:00"
        },
        {
            id: "act-106",
            type: "meeting",
            title: "Họp chiến lược chốt deal Q4 với Ban Giám đốc",
            relation: "Ban Giám đốc & Khối Kinh doanh",
            date: "2026-10-21",
            time: "10:00",
            owner: "Trần Thị Thu Hà",
            ownerId: 1,
            description: "Báo cáo tiến độ 5 deal trọng điểm trên Pipeline có giá trị trên 500 triệu VND.",
            status: "done",
            createdAt: "2026-10-21T09:30:00"
        },
        {
            id: "act-107",
            type: "meeting",
            title: "Demo phần mềm ERP Cloud cho Foxconn VN",
            relation: "Tập đoàn Công nghiệp Foxconn VN",
            date: "2026-10-21",
            time: "14:00",
            owner: "Lê Hoàng Nam",
            ownerId: 2,
            description: "Trình diễn trực tiếp tính năng quản trị quy trình sản xuất đa chi nhánh và kiểm soát chi phí thời gian thực.",
            status: "open",
            createdAt: "2026-10-21T11:00:00"
        },
        {
            id: "act-108",
            type: "task",
            title: "Hoàn thiện bản dự thảo hợp đồng VPBank",
            relation: "Ngân hàng TMCP VPBank - CN Thăng Long",
            date: "2026-10-21",
            time: "17:00",
            owner: "Võ Minh Thư",
            ownerId: 5,
            description: "Kiểm tra các điều khoản bảo mật SLA và trách nhiệm bảo hành nâng cấp định kỳ 3 năm.",
            status: "open",
            createdAt: "2026-10-21T13:00:00"
        },
        {
            id: "act-109",
            type: "meeting",
            title: "Đàm phán bảng giá cuối cùng tại VPBank Thăng Long",
            relation: "Ngân hàng TMCP VPBank - CN Thăng Long",
            date: "2026-10-22",
            time: "14:00",
            owner: "Lê Hoàng Nam",
            ownerId: 2,
            description: "Chốt mức chiết khấu gói bảo trì năm đầu và cam kết thời gian hoàn thành triển khai.",
            status: "open",
            createdAt: "2026-10-21T15:00:00"
        },
        {
            id: "act-110",
            type: "meeting",
            title: "Họp kỹ thuật Pre-sales giải pháp Cloud đa nhà máy",
            relation: "Tập đoàn Công nghiệp Foxconn VN",
            date: "2026-10-22",
            time: "14:30",
            owner: "Bùi Đức Thành",
            ownerId: 4,
            description: "Trả lời bài toán an ninh mạng và giải pháp sao lưu dự phòng DR của khối nhà máy linh kiện.",
            status: "open",
            createdAt: "2026-10-21T15:15:00"
        },
        {
            id: "act-111",
            type: "meeting",
            title: "Demo trực tuyến CRM cho Ban giám đốc Á Châu School",
            relation: "Hệ thống Trường Quốc tế Á Châu (Asian School)",
            date: "2026-10-22",
            time: "10:00",
            owner: "Phạm Mai Phương",
            ownerId: 3,
            description: "Giới thiệu module quản lý hồ sơ tuyển sinh học sinh và cổng phụ huynh trực tuyến.",
            status: "open",
            createdAt: "2026-10-21T16:00:00"
        },
        {
            id: "act-112",
            type: "task",
            title: "Gửi tài liệu giải pháp bảo mật cho khách hàng Foxconn",
            relation: "Tập đoàn Công nghiệp Foxconn VN",
            date: "2026-10-22",
            time: "16:30",
            owner: "Bùi Đức Thành",
            ownerId: 4,
            description: "Đóng gói bộ slide Security Whitepaper và chứng chỉ ISO/IEC 27001 gửi qua email.",
            status: "open",
            createdAt: "2026-10-21T16:30:00"
        },
        {
            id: "act-113",
            type: "meeting",
            title: "Gặp ký kết thỏa thuận hợp tác Viettravel Sun",
            relation: "Công ty TNHH Dịch vụ & Du lịch Viettravel Sun",
            date: "2026-10-23",
            time: "09:30",
            owner: "Phạm Mai Phương",
            ownerId: 3,
            description: "Lễ ký kết hợp đồng triển khai phần mềm quản lý booking tour tại trụ sở Viettravel.",
            status: "open",
            createdAt: "2026-10-21T17:00:00"
        },
        {
            id: "act-114",
            type: "call",
            title: "Gọi điện chốt lịch khảo sát hạ tầng NEM Fashion",
            relation: "Chuỗi Bán lẻ Thời trang NEM Fashion",
            date: "2026-10-23",
            time: "11:00",
            owner: "Lê Hoàng Nam",
            ownerId: 2,
            description: "Xác nhận thời gian đội kỹ thuật đến 3 showroom mẫu tại Hà Nội để kiểm tra mạng LAN và máy POS.",
            status: "open",
            createdAt: "2026-10-21T17:15:00"
        },
        {
            id: "act-115",
            type: "meeting",
            title: "Tổng kết tuần Khối Kinh doanh & Giao việc tuần mới",
            relation: "Nội bộ Khối Kinh doanh",
            date: "2026-10-23",
            time: "16:30",
            owner: "Trần Thị Thu Hà",
            ownerId: 1,
            description: "Đánh giá các hoạt động chăm sóc khách hàng trong tuần và rà soát tiến độ chỉ tiêu doanh số.",
            status: "open",
            createdAt: "2026-10-21T17:30:00"
        },
        {
            id: "act-116",
            type: "call",
            title: "Khảo sát mức độ hài lòng khách hàng TocoToco",
            relation: "Chuỗi Cửa hàng Trà sữa TocoToco (Công ty CP Taco)",
            date: "2026-10-18",
            time: "10:30",
            owner: "Phạm Mai Phương",
            ownerId: 3,
            description: "Thu thập phản hồi về hiệu năng module loyalty sau 1 tháng vận hành tại các cửa hàng miền Bắc.",
            status: "done",
            createdAt: "2026-10-18T10:00:00"
        },
        {
            id: "act-117",
            type: "email",
            title: "Gửi báo giá nâng cấp server cho Masan Consumer",
            relation: "Tập đoàn Tiêu dùng Masan Consumer",
            date: "2026-10-20",
            time: "15:00",
            owner: "Bùi Đức Thành",
            ownerId: 4,
            description: "Đính kèm bảng so sánh chi phí giữa Private Cloud và Hybrid Cloud kèm lộ trình chuyển đổi 2 tuần.",
            status: "done",
            createdAt: "2026-10-20T14:45:00"
        },
        {
            id: "act-118",
            type: "note",
            title: "Ghi chú pháp lý về điều khoản bồi thường vi phạm hợp đồng",
            relation: "Ngân hàng TMCP VPBank - CN Thăng Long",
            date: "2026-10-19",
            time: "16:00",
            owner: "Võ Minh Thư",
            ownerId: 5,
            description: "Lưu ý mức phạt tối đa 8% giá trị phần nghĩa vụ bị vi phạm theo Luật Thương mại 2005.",
            status: "done",
            createdAt: "2026-10-19T15:30:00"
        },
        {
            id: "act-119",
            type: "call",
            title: "Liên hệ Giám đốc Chi nhánh Đà Nẵng mở rộng đại lý",
            relation: "Khách hàng khu vực Đà Nẵng",
            date: "2026-10-20",
            time: "11:15",
            owner: "Phan Văn Trung",
            ownerId: 6,
            description: "Thuyết phục đối tác tham gia chương trình chứng chỉ đại lý phân phối CRM khu vực Miền Trung.",
            status: "done",
            createdAt: "2026-10-20T10:30:00"
        },
        {
            id: "act-120",
            type: "meeting",
            title: "Gặp khách hàng khách sạn & resort tại Hội An",
            relation: "Tập đoàn Khách sạn SunRiver Hội An",
            date: "2026-10-22",
            time: "09:00",
            owner: "Phan Văn Trung",
            ownerId: 6,
            description: "Tư vấn gói giải pháp chăm sóc khách du lịch đa kênh: Zalo OA, Website chat và Tổng đài IP.",
            status: "open",
            createdAt: "2026-10-21T16:45:00"
        },
        {
            id: "act-121",
            type: "email",
            title: "Gửi thư cảm ơn và tài liệu đào tạo sau bàn giao",
            relation: "Công ty Cổ phần Giải pháp Logistics LogiTech Việt Nam",
            date: "2026-10-21",
            time: "16:15",
            owner: "Lê Hoàng Nam",
            ownerId: 2,
            description: "Gửi video hướng dẫn sử dụng cho nhân viên điều phối và tài liệu API integration cho IT.",
            status: "open",
            createdAt: "2026-10-21T16:00:00"
        }
    ];
}

/* ==========================================================================
   4. DATA SERVICE LAYER
   ========================================================================== */
const ActivityService = {
    /**
     * Tải danh sách hoạt động từ API hoặc local/mock
     * @returns {Promise<Activity[]>}
     */
    async fetchActivities() {
        isLoading = true;
        renderLoadingSkeleton();
        hideError();

        try {
            const cached = localStorage.getItem(STORAGE_KEY_ACTIVITIES);
            let localList = null;
            if (cached) {
                try {
                    const parsed = JSON.parse(cached);
                    if (Array.isArray(parsed) && parsed.length > 0) localList = parsed;
                } catch (_) {}
            }

            const token = localStorage.getItem("crm_token");
            const headers = { "Content-Type": "application/json" };
            if (token) headers["Authorization"] = `Bearer ${token}`;

            const response = await fetch(`${API_BASE}/api/activities`, {
                headers,
                signal: AbortSignal.timeout(2000)
            });

            // Xử lý hết hạn phiên đăng nhập (SCRUM-75)
            if (response.status === 401) {
                localStorage.removeItem("crm_ui_session");
                localStorage.removeItem("crm_token");
                window.location.href = "login";
                throw new Error("Phiên đăng nhập đã hết hạn.");
            }

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const payload = await response.json();
            const list = Array.isArray(payload) ? payload : (payload.data || payload.items || []);

            if (list.length > 0) {
                const normalized = list.map(normalizeBackendActivity);
                localStorage.setItem(STORAGE_KEY_ACTIVITIES, JSON.stringify(normalized));
                return normalized;
            }

            return localList || getRichMockActivities();
        } catch (err) {
            console.warn("[ActivityService] API không khả dụng, dùng dữ liệu ngoại tuyến:", err.message);
            showError("Không thể kết nối đến máy chủ backend. Đang sử dụng dữ liệu hoạt động ngoại tuyến.");

            const cached = localStorage.getItem(STORAGE_KEY_ACTIVITIES);
            if (cached) {
                try {
                    const parsed = JSON.parse(cached);
                    if (Array.isArray(parsed) && parsed.length > 0) return parsed;
                } catch (_) {}
            }

            const mock = getRichMockActivities();
            localStorage.setItem(STORAGE_KEY_ACTIVITIES, JSON.stringify(mock));
            return mock;
        } finally {
            isLoading = false;
        }
    },

    saveToStorage(list) {
        try {
            localStorage.setItem(STORAGE_KEY_ACTIVITIES, JSON.stringify(list));
        } catch (e) {
            console.error("Lỗi khi lưu localStorage:", e);
        }
    }
};

function normalizeBackendActivity(item) {
    let dateStr = "";
    let timeStr = "";

    const rawDate = item.dueDate || item.date || item.startTime || item.createdAt;
    if (rawDate) {
        const parts = String(rawDate).split("T");
        if (parts.length >= 2) {
            dateStr = parts[0];
            timeStr = parts[1].substring(0, 5);
        } else {
            const spaceParts = String(rawDate).split(" ");
            dateStr = spaceParts[0];
            if (spaceParts.length > 1) timeStr = spaceParts[1].substring(0, 5);
        }
    }

    const rel = item.customerName || item.opportunityName || item.relation || "";
    const st = (item.status || "OPEN").toUpperCase() === "COMPLETED" ? "done" : "open";
    const memberObj = TEAM_MEMBERS.find(m => m.name === item.ownerName || m.name === item.owner);

    return {
        id: item.id,
        type: (item.type || "task").toLowerCase(),
        title: item.subject || item.title || "Hoạt động chăm sóc",
        relation: rel,
        date: dateStr || todayString(),
        time: timeStr || "09:00",
        owner: item.ownerName || item.owner || (memberObj ? memberObj.name : "Tôi"),
        ownerId: memberObj ? memberObj.id : 1,
        description: item.description || "",
        status: st,
        customerId: item.customerId,
        opportunityId: item.opportunityId,
        createdAt: item.createdAt || new Date().toISOString()
    };
}

/* ==========================================================================
   5. DATE HELPERS
   ========================================================================== */
function todayString() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function getStartOfWeek(date) {
    const d = new Date(date);
    const day = d.getDay();
    const diff = (day === 0 ? -6 : 1) - day;
    d.setDate(d.getDate() + diff);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function getEndOfWeek(date) {
    const d = new Date(date);
    const day = d.getDay();
    const diff = (day === 0 ? 0 : 7) - day;
    d.setDate(d.getDate() + diff);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function getStartOfMonth(date) {
    const d = new Date(date);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
}

function getEndOfMonth(date) {
    const d = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function isDateInRange(itemDate) {
    if (!itemDate) return true;
    const start = filterState.startDate;
    const end = filterState.endDate;

    if (start && itemDate < start) return false;
    if (end && itemDate > end) return false;

    return true;
}

/* ==========================================================================
   6. COMPONENT: ACTIVITY STATS
   ========================================================================== */
const ActivityStatsComponent = {
    updateKpis(list) {
        const now = todayString();
        const total = list.length;
        const openCount = list.filter(a => a.status === "open").length;
        const doneCount = list.filter(a => a.status === "done").length;
        const lateCount = list.filter(a => a.status === "open" && a.date && a.date < now).length;

        setText("totalActivity", total);
        setText("openActivity", openCount);
        setText("doneActivity", doneCount);
        setText("lateActivity", lateCount);
    },

    updateTypeBreakdown(list) {
        const total = list.length;
        const callCount = list.filter(a => a.type === "call").length;
        const meetingCount = list.filter(a => a.type === "meeting").length;
        const taskCount = list.filter(a => a.type === "task").length;
        const emailCount = list.filter(a => a.type === "email").length;
        const noteCount = list.filter(a => a.type === "note").length;

        setText("countTypeAll", total);
        setText("countTypeCall", callCount);
        setText("countTypeMeeting", meetingCount);
        setText("countTypeTask", taskCount);
        setText("countTypeEmail", emailCount);
        setText("countTypeNote", noteCount);

        document.querySelectorAll("[data-type-pill]").forEach(pill => {
            const pillType = pill.getAttribute("data-type-pill");
            if (pillType === filterState.type) {
                pill.classList.add("active");
            } else {
                pill.classList.remove("active");
            }
        });
    },

    renderMemberCareGrid(list) {
        const container = document.getElementById("teamCareCardsGrid");
        if (!container) return;
        container.innerHTML = "";

        const subtitleEl = document.getElementById("teamCareSubtitle");
        if (subtitleEl) {
            subtitleEl.textContent = filterState.member === "ALL" 
                ? `— Đang hiển thị tổng hợp mức độ chăm sóc của ${TEAM_MEMBERS.length} thành viên`
                : `— Đang tập trung lọc hoạt động của: ${filterState.member === "MY" ? "Trần Thị Thu Hà (Tôi)" : filterState.member}`;
        }

        TEAM_MEMBERS.forEach(member => {
            const memberActs = list.filter(a => a.owner === member.name || a.ownerId === member.id);
            const total = memberActs.length;
            const calls = memberActs.filter(a => a.type === "call").length;
            const meetings = memberActs.filter(a => a.type === "meeting").length;
            const tasks = memberActs.filter(a => a.type === "task").length;
            const emails = memberActs.filter(a => a.type === "email").length;
            const done = memberActs.filter(a => a.status === "done").length;
            const rate = total > 0 ? Math.round((done / total) * 100) : 0;

            let careLevelText = "⭐ Rất tích cực";
            let careLevelClass = "care-level-high";
            if (total < 2) {
                careLevelText = "⚠️ Cần tăng cường";
                careLevelClass = "care-level-low";
            } else if (total < 4) {
                careLevelText = "👍 Đạt chuẩn";
                careLevelClass = "care-level-medium";
            }

            const isSelected = (filterState.member === member.name) || (filterState.member === "MY" && member.id === 1);

            const card = document.createElement("div");
            card.className = `member-care-card ${isSelected ? "selected" : ""}`;
            card.title = `Nhấn để lọc xem danh sách hoạt động của ${member.name}`;

            card.innerHTML = `
                <div class="member-card-top">
                    <div class="member-avatar" style="background:${member.color};">${member.avatar}</div>
                    <div class="member-info">
                        <div class="member-name">${escapeHtml(member.name)}</div>
                        <div class="member-role">${escapeHtml(member.role)}</div>
                    </div>
                    <div class="member-total-badge">${total} h/động</div>
                </div>

                <div class="member-metrics-row">
                    <div class="metric-item" title="Cuộc gọi tư vấn">
                        <span class="metric-count" style="color:#059669;">📞 ${calls}</span>
                        <span class="metric-label">Gọi điện</span>
                    </div>
                    <div class="metric-item" title="Cuộc họp / Gặp mặt">
                        <span class="metric-count" style="color:#7c3aed;">📅 ${meetings}</span>
                        <span class="metric-label">Họp/Gặp</span>
                    </div>
                    <div class="metric-item" title="Công việc hoàn thành">
                        <span class="metric-count" style="color:#2563eb;">📋 ${tasks}</span>
                        <span class="metric-label">Task</span>
                    </div>
                    <div class="metric-item" title="Email trao đổi">
                        <span class="metric-count" style="color:#d97706;">📧 ${emails}</span>
                        <span class="metric-label">Email</span>
                    </div>
                </div>

                <div class="member-footer-stats">
                    <span class="care-level-badge ${careLevelClass}">${careLevelText}</span>
                    <span class="completion-rate-text">Hoàn thành: <strong>${rate}%</strong> (${done}/${total})</span>
                </div>
            `;

            card.addEventListener("click", () => {
                if (filterState.member === member.name) {
                    filterState.member = "ALL";
                } else {
                    filterState.member = member.name;
                }

                setValue("activityMemberFilter", filterState.member);

                currentPage = 1;
                applyFilterAndRender();
            });

            container.appendChild(card);
        });
    }
};

/* ==========================================================================
   7. COMPONENT: FILTER BAR (DATE RANGE PICKER & MEMBER SELECT)
   ========================================================================== */
const ActivityFilterComponent = {
    init() {
        document.getElementById("btnApplyFilter")?.addEventListener("click", () => {
            this.readFiltersFromUI();
            currentPage = 1;
            applyFilterAndRender();
        });

        document.getElementById("activitySearch")?.addEventListener("keydown", e => {
            if (e.key === "Enter") {
                this.readFiltersFromUI();
                currentPage = 1;
                applyFilterAndRender();
            }
        });

        document.getElementById("activityMemberFilter")?.addEventListener("change", e => {
            filterState.member = e.target.value;
            currentPage = 1;
            applyFilterAndRender();
        });

        document.getElementById("activityTypeFilter")?.addEventListener("change", e => {
            filterState.type = e.target.value;
            currentPage = 1;
            applyFilterAndRender();
        });

        document.getElementById("activityStatusFilter")?.addEventListener("change", e => {
            filterState.status = e.target.value;
            currentPage = 1;
            applyFilterAndRender();
        });

        document.querySelectorAll(".date-pill").forEach(pill => {
            pill.addEventListener("click", () => {
                document.querySelectorAll(".date-pill").forEach(p => p.classList.remove("active"));
                pill.classList.add("active");

                filterState.dateRange = pill.dataset.dateRange;
                const now = new Date();

                switch (filterState.dateRange) {
                    case "TODAY": {
                        const t = todayString();
                        filterState.startDate = t;
                        filterState.endDate = t;
                        setValue("startDateFilter", t);
                        setValue("endDateFilter", t);
                        break;
                    }
                    case "THIS_WEEK": {
                        const sw = getStartOfWeek(now);
                        const ew = getEndOfWeek(now);
                        filterState.startDate = sw;
                        filterState.endDate = ew;
                        setValue("startDateFilter", sw);
                        setValue("endDateFilter", ew);
                        break;
                    }
                    case "THIS_MONTH": {
                        const sm = getStartOfMonth(now);
                        const em = getEndOfMonth(now);
                        filterState.startDate = sm;
                        filterState.endDate = em;
                        setValue("startDateFilter", sm);
                        setValue("endDateFilter", em);
                        break;
                    }
                    case "ALL":
                    default: {
                        filterState.startDate = "";
                        filterState.endDate = "";
                        setValue("startDateFilter", "");
                        setValue("endDateFilter", "");
                        break;
                    }
                }

                currentPage = 1;
                applyFilterAndRender();
            });
        });

        ["startDateFilter", "endDateFilter"].forEach(id => {
            document.getElementById(id)?.addEventListener("change", () => {
                filterState.startDate = value("startDateFilter");
                filterState.endDate = value("endDateFilter");

                document.querySelectorAll(".date-pill").forEach(p => p.classList.remove("active"));
                filterState.dateRange = "CUSTOM";

                currentPage = 1;
                applyFilterAndRender();
            });
        });

        document.querySelectorAll("[data-type-pill]").forEach(pill => {
            pill.addEventListener("click", () => {
                const selected = pill.getAttribute("data-type-pill") || "";
                filterState.type = selected;
                setValue("activityTypeFilter", selected);

                currentPage = 1;
                applyFilterAndRender();
            });
        });

        document.getElementById("btnResetAllFilters")?.addEventListener("click", () => {
            this.resetFilters();
        });

        document.getElementById("btnResetMemberFilter")?.addEventListener("click", () => {
            filterState.member = "ALL";
            setValue("activityMemberFilter", "ALL");
            currentPage = 1;
            applyFilterAndRender();
        });
    },

    readFiltersFromUI() {
        filterState.search = value("activitySearch");
        filterState.member = value("activityMemberFilter") || "ALL";
        filterState.type = value("activityTypeFilter");
        filterState.status = value("activityStatusFilter");
        filterState.startDate = value("startDateFilter");
        filterState.endDate = value("endDateFilter");
    },

    resetFilters() {
        filterState.search = "";
        filterState.member = "ALL";
        filterState.type = "";
        filterState.status = "";
        filterState.dateRange = "ALL";
        filterState.startDate = "";
        filterState.endDate = "";

        setValue("activitySearch", "");
        setValue("activityTypeFilter", "");
        setValue("activityStatusFilter", "");
        setValue("activityMemberFilter", "ALL");
        setValue("startDateFilter", "");
        setValue("endDateFilter", "");

        document.querySelectorAll(".date-pill").forEach(p => {
            p.classList.toggle("active", p.dataset.dateRange === "ALL");
        });

        currentPage = 1;
        applyFilterAndRender();
    }
};

/* ==========================================================================
   8. COMPONENT: ACTIVITY TABLE (HTML TABLE)
   ========================================================================== */
const ActivityTableComponent = {
    /**
     * Render bảng hoạt động chi tiết
     * @param {Activity[]} pagedItems 
     * @param {number} totalFiltered 
     */
    render(pagedItems, totalFiltered) {
        if (!tableBody) return;
        tableBody.innerHTML = "";

        if (totalFiltered === 0) {
            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td colspan="7" class="activity-empty-cell">
                    <div class="activity-empty-content">
                        <div class="activity-empty-icon">📋</div>
                        <strong>Chưa có hoạt động phù hợp bộ lọc</strong>
                        <span>Hãy thử thay đổi khoảng thời gian, thành viên hoặc loại hoạt động để xem kết quả.</span>
                    </div>
                </td>
            `;
            tableBody.appendChild(tr);
            return;
        }

        pagedItems.forEach(item => {
            const tr = document.createElement("tr");

            const memberObj = TEAM_MEMBERS.find(m => m.name === item.owner || m.id === item.ownerId);
            const avatarBg = memberObj ? memberObj.color : "#64748b";
            const avatarLetter = memberObj ? memberObj.avatar : (item.owner ? item.owner.charAt(0).toUpperCase() : "U");
            const memberRole = memberObj ? memberObj.role : "Nhân viên kinh doanh";

            tr.innerHTML = `
                <td>
                    <div class="member-badge-cell">
                        <div class="member-avatar-round" style="background:${avatarBg};">${avatarLetter}</div>
                        <div class="member-details">
                            <strong class="member-name-text">${escapeHtml(item.owner || "Tôi")}</strong>
                            <span class="member-role-sub">${escapeHtml(memberRole)}</span>
                        </div>
                    </div>
                </td>
                <td>
                    <div class="customer-cell" title="Khách hàng liên quan">
                        <span class="customer-icon">🏢</span>
                        <span class="customer-name">${escapeHtml(item.relation || "Nội bộ CRM")}</span>
                    </div>
                </td>
                <td>
                    <span class="type-badge ${item.type}">
                        ${typeIcon(item.type)} ${typeLabel(item.type)}
                    </span>
                </td>
                <td>
                    <div class="content-cell">
                        <strong class="activity-title-text">${escapeHtml(item.title)}</strong>
                        <p class="activity-desc-text">${escapeHtml(item.description || "Chưa có ghi chú tóm tắt nội dung trao đổi.")}</p>
                    </div>
                </td>
                <td>
                    <div class="time-cell">
                        <span class="time-date">📅 ${item.date || "Chưa đặt lịch"}</span>
                        ${item.time ? `<span class="time-hour">⏰ ${item.time}</span>` : ""}
                    </div>
                </td>
                <td>
                    <span class="status-badge ${statusClass(item)}">
                        ${statusLabel(item)}
                    </span>
                </td>
                <td>
                    <div class="row-actions">
                        <button type="button" data-edit-activity="${item.id}" title="Chỉnh sửa thông tin">Sửa</button>
                        <button type="button" data-complete-activity="${item.id}" title="Đổi trạng thái hoàn thành">
                            ${item.status === "done" ? "Mở lại" : "Xong"}
                        </button>
                        <button type="button" class="btn-delete" data-delete-activity="${item.id}" title="Xóa">Xóa</button>
                    </div>
                </td>
            `;

            tableBody.appendChild(tr);
        });
    }
};

function renderLoadingSkeleton() {
    if (!tableBody) return;
    tableBody.innerHTML = `
        <tr>
            <td colspan="7">
                <div class="activity-skeleton-row"></div>
                <div class="activity-skeleton-row"></div>
                <div class="activity-skeleton-row"></div>
                <div class="activity-skeleton-row"></div>
            </td>
        </tr>
    `;
}

/* ==========================================================================
   9. COMPONENT: PAGINATION
   ========================================================================== */
const ActivityPaginationComponent = {
    init() {
        document.getElementById("btnPrevPage")?.addEventListener("click", () => {
            if (currentPage > 1) {
                currentPage--;
                applyFilterAndRender();
            }
        });

        document.getElementById("btnNextPage")?.addEventListener("click", () => {
            const totalPages = Math.ceil(filteredActivities.length / pageSize) || 1;
            if (currentPage < totalPages) {
                currentPage++;
                applyFilterAndRender();
            }
        });

        document.getElementById("pageSizeSelect")?.addEventListener("change", e => {
            pageSize = parseInt(e.target.value, 10) || 10;
            currentPage = 1;
            applyFilterAndRender();
        });
    },

    update(totalCount) {
        const totalPages = Math.ceil(totalCount / pageSize) || 1;
        if (currentPage > totalPages) currentPage = totalPages;

        const startIdx = totalCount === 0 ? 0 : (currentPage - 1) * pageSize + 1;
        const endIdx = Math.min(currentPage * pageSize, totalCount);

        setText("pageStartIdx", startIdx);
        setText("pageEndIdx", endIdx);
        setText("pageTotalCount", totalCount);

        const btnPrev = document.getElementById("btnPrevPage");
        const btnNext = document.getElementById("btnNextPage");

        if (btnPrev) btnPrev.disabled = currentPage <= 1;
        if (btnNext) btnNext.disabled = currentPage >= totalPages;

        const pageNumbersGroup = document.getElementById("pageNumbersGroup");
        if (pageNumbersGroup) {
            pageNumbersGroup.innerHTML = "";
            for (let i = 1; i <= totalPages; i++) {
                const btn = document.createElement("button");
                btn.type = "button";
                btn.className = `btn-page-number ${i === currentPage ? "active" : ""}`;
                btn.textContent = i;
                btn.addEventListener("click", () => {
                    currentPage = i;
                    applyFilterAndRender();
                });
                pageNumbersGroup.appendChild(btn);
            }
        }
    }
};

/* ==========================================================================
   10. MAIN PIPELINE (FILTER & RENDER)
   ========================================================================== */
function applyFilterAndRender() {
    const now = todayString();
    const query = filterState.search.toLowerCase().trim();

    // 1. Thống kê KPI & Chăm sóc khách hàng
    ActivityStatsComponent.updateKpis(allActivities);
    ActivityStatsComponent.updateTypeBreakdown(allActivities);
    ActivityStatsComponent.renderMemberCareGrid(allActivities);

    // 2. Lọc danh sách hoạt động
    filteredActivities = allActivities.filter(item => {
        if (query) {
            const text = `${item.title} ${item.relation} ${item.description} ${item.owner}`.toLowerCase();
            if (!text.includes(query)) return false;
        }

        if (filterState.type && item.type !== filterState.type) {
            return false;
        }

        if (filterState.status) {
            if (filterState.status === "late") {
                if (item.status === "done" || !item.date || item.date >= now) return false;
            } else if (item.status !== filterState.status) {
                return false;
            }
        }

        if (filterState.member === "MY") {
            if (item.owner !== "Trần Thị Thu Hà" && item.ownerId !== 1) return false;
        } else if (filterState.member !== "ALL") {
            if (item.owner !== filterState.member) return false;
        }

        if (!isDateInRange(item.date)) {
            return false;
        }

        return true;
    });

    // 3. Cập nhật số lượng
    const filterCountEl = document.getElementById("filterResultCount");
    if (filterCountEl) {
        filterCountEl.innerHTML = `Hiển thị: <strong>${filteredActivities.length}</strong> hoạt động`;
    }

    // 4. Phân trang
    const totalFiltered = filteredActivities.length;
    const startIndex = (currentPage - 1) * pageSize;
    const pagedItems = filteredActivities.slice(startIndex, startIndex + pageSize);

    // 5. Render Table & Pagination
    ActivityTableComponent.render(pagedItems, totalFiltered);
    ActivityPaginationComponent.update(totalFiltered);
}

/* ==========================================================================
   11. DRAWER (CREATE / EDIT ACTIVITY)
   ========================================================================== */
function openDrawer(item = null) {
    const err = document.getElementById("activityError");
    if (err) err.textContent = "";

    if (item) {
        setText("activityDrawerTitle", "Sửa hoạt động chăm sóc khách");
        setValue("editingActivityId", item.id);
        setValue("activityType", item.type || "task");
        setValue("activityTitle", item.title);
        setValue("activityRelation", item.relation || "");
        setValue("activityDate", item.date || todayString());
        setValue("activityTime", item.time || "09:00");
        setValue("activityOwner", item.owner || "Trần Thị Thu Hà");
        setValue("activityDescription", item.description || "");
    } else {
        setText("activityDrawerTitle", "Tạo hoạt động mới");
        activityForm?.reset();
        setValue("editingActivityId", "");
        setValue("activityType", "call");
        setValue("activityDate", todayString());
        setValue("activityTime", "09:00");
        const defaultOwner = (filterState.member !== "ALL" && filterState.member !== "MY") 
            ? filterState.member 
            : "Lê Hoàng Nam";
        setValue("activityOwner", defaultOwner);
    }

    drawer?.classList.add("open");
    overlay?.classList.add("open");
}

function closeDrawer() {
    drawer?.classList.remove("open");
    overlay?.classList.remove("open");
}

async function saveActivityFromDrawer() {
    const title = value("activityTitle");
    const errorEl = document.getElementById("activityError");
    if (errorEl) errorEl.textContent = "";

    if (!title) {
        if (errorEl) errorEl.textContent = "Vui lòng nhập tiêu đề hoạt động.";
        return;
    }

    const editingId = value("editingActivityId");
    const type = value("activityType") || "task";
    const relation = value("activityRelation");
    const date = value("activityDate");
    const time = value("activityTime");
    const owner = value("activityOwner");
    const description = value("activityDescription");

    const memberObj = TEAM_MEMBERS.find(m => m.name === owner);
    const dueDateStr = date ? `${date} ${time || "09:00"}:00` : null;

    try {
        if (editingId) {
            if (!isNaN(Number(editingId))) {
                try {
                    await fetch(`${API_BASE}/api/activities/${editingId}`, {
                        method: "PUT",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            subject: title,
                            type: type.toUpperCase(),
                            description: description,
                            status: "OPEN",
                            dueDate: dueDateStr
                        })
                    });
                } catch (e) {
                    console.warn("API PUT failed, saving locally:", e);
                }
            }

            const idx = allActivities.findIndex(a => String(a.id) === String(editingId));
            if (idx !== -1) {
                allActivities[idx] = {
                    ...allActivities[idx],
                    type,
                    title,
                    relation,
                    date,
                    time,
                    owner,
                    ownerId: memberObj ? memberObj.id : 1,
                    description
                };
            }
        } else {
            const newId = `act-${Date.now()}`;
            try {
                await fetch(`${API_BASE}/api/activities`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        subject: title,
                        type: type.toUpperCase(),
                        description: description,
                        status: "OPEN",
                        dueDate: dueDateStr
                    })
                });
            } catch (e) {
                console.warn("API POST failed, saving locally:", e);
            }

            const newAct = {
                id: newId,
                type,
                title,
                relation,
                date,
                time,
                owner,
                ownerId: memberObj ? memberObj.id : 1,
                description,
                status: "open",
                createdAt: new Date().toISOString()
            };
            allActivities.unshift(newAct);
        }

        ActivityService.saveToStorage(allActivities);
        closeDrawer();
        applyFilterAndRender();
    } catch (err) {
        if (errorEl) errorEl.textContent = "Lỗi khi lưu: " + err.message;
        else alert("Lỗi khi lưu: " + err.message);
    }
}

/* ==========================================================================
   12. SKELETON & ERROR CONTROLS
   ========================================================================== */
function showError(message) {
    if (errorBanner) {
        if (errorMsgEl) errorMsgEl.textContent = message;
        errorBanner.classList.add("active");
    }
}