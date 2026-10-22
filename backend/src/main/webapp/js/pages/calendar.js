"use strict";

/* =========================================================
   TEAM CALENDAR CONTROLLER (SCRUM-86 / SCRUM-221)
   Supports Month, Week, Day (Timeline & Team Swimlanes),
   Schedule Overlap Conflict Detection, Real-time Validation
========================================================= */

const STORAGE_KEY_ACTIVITIES = "crm_ui_activities";
const API_BASE = window.location.pathname.startsWith("/crm") ? "/crm" : "http://localhost:8080/crm";

// Team Directory for Shared Calendar
const TEAM_MEMBERS = [
    { id: 1, name: "Trần Thị Thu Hà", role: "Trưởng nhóm Kinh doanh Miền Bắc", avatar: "H", color: "#2563eb", email: "lead.mienbac@crm.local" },
    { id: 2, name: "Lê Hoàng Nam", role: "Chuyên viên KD B2B Senior", avatar: "N", color: "#059669", email: "sale.hn1@crm.local" },
    { id: 3, name: "Phạm Mai Phương", role: "Chuyên viên Kinh doanh", avatar: "P", color: "#d97706", email: "sale.hn2@crm.local" },
    { id: 4, name: "Bùi Đức Thành", role: "Kỹ sư Giải pháp (Solution Architect)", avatar: "T", color: "#7c3aed", email: "thanh.bd@crm.local" },
    { id: 5, name: "Võ Minh Thư", role: "Chuyên viên Hợp đồng & Pháp chế", avatar: "T", color: "#0891b2", email: "thu.vm@crm.local" },
    { id: 6, name: "Phan Văn Trung", role: "Trưởng nhóm Kinh doanh Miền Trung", avatar: "T", color: "#dc2626", email: "lead.mientrung@crm.local" }
];

// Current State
let currentDate = new Date(); // Focus date (default today)
let currentViewMode = "month"; // "month" | "week" | "day"
let currentDaySubMode = "timeline"; // "timeline" | "swimlanes"
let currentMemberFilter = "ALL"; // "ALL" | "MY" | memberId string
let currentTypeFilter = ""; // "" | "meeting" | "task" | "call" | "email"
let selectedEventForDetail = null;

/* =========================================================
   RICH MOCK DATA GENERATOR
========================================================= */
function getRichSeedActivities() {
    // Current week anchored around Oct 2026
    return [
        {
            id: "act-101",
            type: "meeting",
            title: "Họp giao ban đầu tuần Khối Kinh doanh",
            relation: "Nội bộ Khối Kinh doanh",
            date: "2026-10-19",
            time: "09:00",
            endTime: "10:30",
            owner: "Trần Thị Thu Hà",
            ownerId: 1,
            location: "Phòng họp Lotus - Trụ sở chính",
            status: "done",
            priority: "high",
            description: "Đánh giá tiến độ hoàn thành KPI tháng 10 và kế hoạch tiếp cận chuỗi khách hàng Foxconn & VPBank."
        },
        {
            id: "act-102",
            type: "meeting",
            title: "Gặp rà soát hợp đồng Viettravel Sun",
            relation: "Công ty TNHH Dịch vụ & Du lịch Viettravel Sun",
            date: "2026-10-19",
            time: "14:00",
            endTime: "15:30",
            owner: "Phạm Mai Phương",
            ownerId: 3,
            location: "Văn phòng Viettravel Sun, Q.1",
            status: "done",
            priority: "medium",
            description: "Thống nhất các điều khoản thanh toán theo tiến độ và thời gian bàn giao giải pháp tổng đài CRM."
        },
        {
            id: "act-103",
            type: "meeting",
            title: "Khảo sát nhu cầu mở rộng chuỗi NEM Fashion",
            relation: "Chuỗi Bán lẻ Thời trang NEM Fashion",
            date: "2026-10-20",
            time: "09:30",
            endTime: "11:00",
            owner: "Lê Hoàng Nam",
            ownerId: 2,
            location: "Trụ sở NEM Fashion, Hoàn Kiếm, HN",
            status: "done",
            priority: "high",
            description: "Khảo sát quy trình bán hàng tại 50 showroom để lên bài toán tích hợp phần mềm khách hàng thân thiết."
        },
        {
            id: "act-104",
            type: "task",
            title: "Dự toán chi phí triển khai hệ thống Foxconn",
            relation: "Tập đoàn Công nghiệp Foxconn VN",
            date: "2026-10-20",
            time: "16:00",
            endTime: "17:00",
            owner: "Bùi Đức Thành",
            ownerId: 4,
            location: "Online",
            status: "done",
            priority: "high",
            description: "Tính toán số lượng server và license database cho 3 nhà máy tại KCN Đình Trám và Quế Võ."
        },
        // --- HÔM NAY (21/10/2026) ---
        {
            id: "act-105",
            type: "call",
            title: "Tư vấn cấu hình giải pháp LogiTech Global",
            relation: "Công ty CP Logistics LogiTech Việt Nam",
            date: "2026-10-21",
            time: "08:30",
            endTime: "09:30",
            owner: "Lê Hoàng Nam",
            ownerId: 2,
            location: "Tổng đài Cloud PBX",
            status: "open",
            priority: "medium",
            description: "Trao đổi kỹ thuật với Trưởng phòng IT LogiTech về kết nối API tự động cập nhật đơn hàng vận chuyển."
        },
        {
            id: "act-106",
            type: "meeting",
            title: "Họp chiến lược chốt deal Q4 với Giám đốc",
            relation: "Ban Giám đốc & Phòng Kinh doanh",
            date: "2026-10-21",
            time: "10:00",
            endTime: "11:30",
            owner: "Trần Thị Thu Hà",
            ownerId: 1,
            location: "Phòng họp Hội đồng Quản trị",
            status: "open",
            priority: "high",
            description: "Báo cáo tiến độ 5 deal trọng điểm trên Pipeline có giá trị trên 500 triệu VND."
        },
        {
            id: "act-107",
            type: "meeting",
            title: "Demo phần mềm ERP Cloud cho Foxconn VN",
            relation: "Tập đoàn Công nghiệp Foxconn VN",
            date: "2026-10-21",
            time: "14:00",
            endTime: "16:00",
            owner: "Lê Hoàng Nam",
            ownerId: 2,
            attendees: "Bùi Đức Thành, Trần Quốc Bảo (Foxconn)",
            location: "Google Meet / Trực tiếp VP Foxconn",
            status: "open",
            priority: "high",
            description: "Trình diễn trực tiếp tính năng quản trị quy trình sản xuất đa chi nhánh và kiểm soát chi phí thời gian thực."
        },
        {
            id: "act-108",
            type: "task",
            title: "Hoàn thiện bản dự thảo hợp đồng VPBank",
            relation: "Ngân hàng TMCP VPBank - CN Thăng Long",
            date: "2026-10-21",
            time: "17:00",
            endTime: "18:00",
            owner: "Võ Minh Thư",
            ownerId: 5,
            location: "Nội bộ",
            status: "open",
            priority: "high",
            description: "Kiểm tra các điều khoản bảo mật SLA và trách nhiệm bảo hành nâng cấp định kỳ 3 năm."
        },
        // --- NGÀY MAI (22/10/2026) - CÓ LỊCH CHỒNG CHÉO (OVERLAPPING SCHEDULE) ---
        {
            id: "act-109",
            type: "meeting",
            title: "Đàm phán bảng giá cuối cùng tại VPBank Thăng Long",
            relation: "Ngân hàng TMCP VPBank - CN Thăng Long",
            date: "2026-10-22",
            time: "14:00",
            endTime: "15:30",
            owner: "Lê Hoàng Nam",
            ownerId: 2,
            attendees: "Bùi Đức Thành, Ban Giám đốc VPBank",
            location: "Phòng VIP 2, Tòa nhà VPBank, 89 Láng Hạ",
            status: "open",
            priority: "high",
            description: "Chốt mức chiết khấu gói bảo trì năm đầu và cam kết thời gian hoàn thành triển khai."
        },
        {
            id: "act-110",
            type: "meeting",
            title: "Họp kỹ thuật Pre-sales giải pháp Cloud đa nhà máy",
            relation: "Tập đoàn Công nghiệp Foxconn VN",
            date: "2026-10-22",
            time: "14:30",
            endTime: "16:00",
            owner: "Bùi Đức Thành",
            ownerId: 4,
            attendees: "Phạm Mai Phương, Đội IT Foxconn",
            location: "Phòng họp Lotus - Trực tiếp",
            status: "open",
            priority: "high",
            description: "Trả lời bài toán an ninh mạng và giải pháp sao lưu dự phòng DR của khối nhà máy linh kiện."
        },
        {
            id: "act-111",
            type: "meeting",
            title: "Demo trực tuyến CRM cho Ban giám đốc Á Châu School",
            relation: "Hệ thống Trường Quốc tế Á Châu (Asian School)",
            date: "2026-10-22",
            time: "10:00",
            endTime: "11:00",
            owner: "Phạm Mai Phương",
            ownerId: 3,
            location: "Zoom Meeting ID: 889-234-112",
            status: "open",
            priority: "medium",
            description: "Giới thiệu module quản lý hồ sơ tuyển sinh học sinh và cổng phụ huynh trực tuyến."
        },
        {
            id: "act-112",
            type: "task",
            title: "Gửi tài liệu giải pháp bảo mật cho khách hàng Foxconn",
            relation: "Tập đoàn Công nghiệp Foxconn VN",
            date: "2026-10-22",
            time: "16:30",
            endTime: "17:30",
            owner: "Bùi Đức Thành",
            ownerId: 4,
            location: "Email",
            status: "open",
            priority: "medium",
            description: "Đóng gói bộ slide Security Whitepaper và chứng chỉ ISO/IEC 27001 gửi qua email."
        },
        // --- THỨ 6 (23/10/2026) ---
        {
            id: "act-113",
            type: "meeting",
            title: "Ký kết biên bản ghi nhớ hợp tác (MOU) Viettravel Sun",
            relation: "Công ty TNHH Dịch vụ & Du lịch Viettravel Sun",
            date: "2026-10-23",
            time: "09:00",
            endTime: "10:30",
            owner: "Trần Thị Thu Hà",
            ownerId: 1,
            attendees: "Lê Hoàng Nam, Tổng Giám đốc Viettravel",
            location: "Khách sạn Rex Sài Gòn",
            status: "open",
            priority: "high",
            description: "Ký kết MOU chuyển đổi số toàn diện hệ thống phân phối tour và quản lý khách hàng VIP du lịch."
        },
        {
            id: "act-114",
            type: "task",
            title: "Tổng hợp báo cáo tuần của Khối Kinh doanh",
            relation: "Nội bộ Khối Kinh doanh",
            date: "2026-10-23",
            time: "11:00",
            endTime: "12:00",
            owner: "Trần Thị Thu Hà",
            ownerId: 1,
            location: "Nội bộ",
            status: "open",
            priority: "medium",
            description: "Tổng kết doanh số đạt được trong tuần, các cơ hội mới vào phễu và tỷ lệ Win/Loss."
        },
        {
            id: "act-115",
            type: "meeting",
            title: "Họp đánh giá nhà cung cấp phần mềm Đà Nẵng",
            relation: "Công ty CP Đầu tư Công nghệ Xanh GreenTech",
            date: "2026-10-23",
            time: "15:00",
            endTime: "16:00",
            owner: "Phan Văn Trung",
            ownerId: 6,
            location: "VP GreenTech, Hòa Vang, Đà Nẵng",
            status: "open",
            priority: "medium",
            description: "Khảo sát yêu cầu tích hợp phần mềm trạm sạc xe điện thông minh vào hệ sinh thái CRM."
        },
        // --- THỨ 7 (24/10/2026) ---
        {
            id: "act-116",
            type: "call",
            title: "Gọi điện chăm sóc định kỳ khách hàng VIP Masan",
            relation: "Tập đoàn Tiêu dùng Masan Consumer",
            date: "2026-10-24",
            time: "09:00",
            endTime: "10:00",
            owner: "Lê Hoàng Nam",
            ownerId: 2,
            location: "Điện thoại",
            status: "open",
            priority: "low",
            description: "Thăm hỏi tình hình sử dụng sau 6 tháng vận hành và lắng nghe đề xuất tính năng mới."
        },
        {
            id: "act-117",
            type: "task",
            title: "Đánh giá Win/Loss các cơ hội đóng trong tuần",
            relation: "Nội bộ CRM",
            date: "2026-10-24",
            time: "15:00",
            endTime: "16:00",
            owner: "Trần Thị Thu Hà",
            ownerId: 1,
            location: "Nội bộ",
            status: "open",
            priority: "medium",
            description: "Phân tích nguyên nhân thua thầu tại dự án Logistics Hải Phòng để cải tiến quy trình báo giá."
        },
        // --- TUẦN SAU (26/10 -> 30/10) ---
        {
            id: "act-118",
            type: "meeting",
            title: "Họp Kick-off dự án triển khai ERP Foxconn giai đoạn 1",
            relation: "Tập đoàn Công nghiệp Foxconn VN",
            date: "2026-10-26",
            time: "09:00",
            endTime: "11:00",
            owner: "Lê Hoàng Nam",
            ownerId: 2,
            location: "KCN Đình Trám, Bắc Giang",
            status: "open",
            priority: "high",
            description: "Công bố sơ đồ ban dự án, kế hoạch khảo sát chi tiết và mốc bàn giao sprint 1."
        },
        {
            id: "act-119",
            type: "meeting",
            title: "Báo giá module CRM Loyalty cho TocoToco",
            relation: "Chuỗi Cửa hàng Trà sữa TocoToco (Công ty CP Taco)",
            date: "2026-10-28",
            time: "14:00",
            endTime: "15:00",
            owner: "Phạm Mai Phương",
            ownerId: 3,
            location: "VP Taco, Mễ Trì, Hà Nội",
            status: "open",
            priority: "medium",
            description: "Trình bày bảng giá gói tích hợp mini-app Zalo và hệ thống tích điểm thành viên."
        },
        {
            id: "act-120",
            type: "task",
            title: "Hạn nộp mục tiêu doanh số tháng 11/2026",
            relation: "Toàn bộ thành viên Khối Kinh doanh",
            date: "2026-10-30",
            time: "17:00",
            endTime: "18:00",
            owner: "Trần Thị Thu Hà",
            ownerId: 1,
            location: "Nội bộ",
            status: "open",
            priority: "high",
            description: "Mỗi chuyên viên kinh doanh nộp bản kế hoạch hành động và mục tiêu số lượng cuộc gặp tháng 11."
        }
    ];
}

/* =========================================================
   STORAGE HELPERS
========================================================= */
function loadActivities() {
    try {
        const stored = localStorage.getItem(STORAGE_KEY_ACTIVITIES);
        if (stored) {
            const parsed = JSON.parse(stored);
            if (Array.isArray(parsed) && parsed.length > 0) {
                return parsed;
            }
        }
    } catch (_) {}

    // Fallback seed data
    const seed = getRichSeedActivities();
    try {
        localStorage.setItem(STORAGE_KEY_ACTIVITIES, JSON.stringify(seed));
    } catch (_) {}
    return seed;
}

function saveActivities(list) {
    try {
        localStorage.setItem(STORAGE_KEY_ACTIVITIES, JSON.stringify(list));
    } catch (e) {
        console.warn("Could not save activities:", e);
    }
}

/* =========================================================
   CONFLICT DETECTION ALGORITHM (SCRUM-86)
   Detects overlapping time schedules within the same day
========================================================= */
function parseTimeToMinutes(timeStr) {
    if (!timeStr) return 0;
    const [h, m] = timeStr.split(":").map(Number);
    return (h || 0) * 60 + (m || 0);
}

function detectConflicts(activities) {
    const conflicts = [];
    const eventsByDate = {};

    // Group timed events by date
    activities.forEach(act => {
        if (!act.date || !act.time || act.status === "cancelled") return;
        if (!eventsByDate[act.date]) eventsByDate[act.date] = [];
        eventsByDate[act.date].push(act);
    });

    Object.keys(eventsByDate).forEach(date => {
        const dayEvents = eventsByDate[date];
        if (dayEvents.length < 2) return;

        for (let i = 0; i < dayEvents.length; i++) {
            const ev1 = dayEvents[i];
            const start1 = parseTimeToMinutes(ev1.time);
            const end1 = ev1.endTime ? parseTimeToMinutes(ev1.endTime) : (start1 + 60);

            for (let j = i + 1; j < dayEvents.length; j++) {
                const ev2 = dayEvents[j];
                const start2 = parseTimeToMinutes(ev2.time);
                const end2 = ev2.endTime ? parseTimeToMinutes(ev2.endTime) : (start2 + 60);

                // Overlap condition: start1 < end2 && start2 < end1
                if (start1 < end2 && start2 < end1) {
                    // Check if they share the same owner, or if attendees mention each other
                    const sameOwner = (ev1.owner && ev2.owner && ev1.owner === ev2.owner) || (ev1.ownerId && ev2.ownerId && ev1.ownerId === ev2.ownerId);
                    const crossAttendee = (ev1.attendees && ev1.attendees.includes(ev2.owner)) || (ev2.attendees && ev2.attendees.includes(ev1.owner));

                    if (sameOwner || crossAttendee) {
                        const overlapStart = Math.max(start1, start2);
                        const overlapEnd = Math.min(end1, end2);
                        const fmtTime = min => `${String(Math.floor(min/60)).padStart(2,"0")}:${String(min%60).padStart(2,"0")}`;

                        conflicts.push({
                            id: `conf-${ev1.id}-${ev2.id}`,
                            date: date,
                            eventA: ev1,
                            eventB: ev2,
                            overlapStartStr: fmtTime(overlapStart),
                            overlapEndStr: fmtTime(overlapEnd),
                            affectedMember: sameOwner ? ev1.owner : `${ev1.owner} & ${ev2.owner}`
                        });

                        ev1.hasConflict = true;
                        ev2.hasConflict = true;
                    }
                }
            }
        }
    });

    return conflicts;
}

/* =========================================================
   DATE UTILITIES
========================================================= */
function toDateKey(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
}

function parseDateKey(str) {
    if (!str) return new Date();
    const [y, m, d] = str.split("-").map(Number);
    return new Date(y, m - 1, d);
}

function getStartOfWeek(date) {
    const d = new Date(date);
    const day = d.getDay();
    const diff = (day === 0 ? -6 : 1) - day; // Monday as first day
    d.setDate(d.getDate() + diff);
    d.setHours(0, 0, 0, 0);
    return d;
}

function formatDisplayDate(date) {
    const dayNames = ["Chủ nhật", "Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7"];
    return `${dayNames[date.getDay()]}, ${String(date.getDate()).padStart(2,"0")}/${String(date.getMonth()+1).padStart(2,"0")}/${date.getFullYear()}`;
}

/* =========================================================
   MAIN RENDER DISPATCHER
========================================================= */
function render() {
    const activities = loadActivities();

    // Reset conflict flags
    activities.forEach(a => delete a.hasConflict);
    const conflicts = detectConflicts(activities);

    // Update Conflict Alert Banner & Header Button
    updateConflictUI(conflicts);

    // Filter activities by Member and Type
    const filteredActivities = activities.filter(item => {
        // Member filter
        if (currentMemberFilter === "MY") {
            if (item.owner !== "Trần Thị Thu Hà" && item.ownerId !== 1) return false;
        } else if (currentMemberFilter !== "ALL") {
            const memberId = Number(currentMemberFilter);
            const targetMember = TEAM_MEMBERS.find(m => m.id === memberId);
            if (targetMember && item.owner !== targetMember.name && item.ownerId !== memberId) return false;
        }

        // Type filter
        if (currentTypeFilter && item.type !== currentTypeFilter) {
            return false;
        }

        return true;
    });

    // Update Titles and Controls based on active View Mode
    updateNavigationTitle();

    // Toggle View Containers
    const monthViewEl = document.getElementById("calendarViewMonth");
    const weekViewEl = document.getElementById("calendarViewWeek");
    const dayViewEl = document.getElementById("calendarViewDay");

    if (monthViewEl) monthViewEl.style.display = currentViewMode === "month" ? "block" : "none";
    if (weekViewEl) weekViewEl.style.display = currentViewMode === "week" ? "block" : "none";
    if (dayViewEl) dayViewEl.style.display = currentViewMode === "day" ? "flex" : "none";

    // Render corresponding view
    if (currentViewMode === "month") {
        renderMonthView(filteredActivities);
    } else if (currentViewMode === "week") {
        renderWeekView(filteredActivities);
    } else if (currentViewMode === "day") {
        renderDayView(filteredActivities);
    }
}

function updateConflictUI(conflicts) {
    const bannerEl = document.getElementById("calendarConflictBanner");
    const headerBtn = document.getElementById("btnHeaderConflicts");
    const headerText = document.getElementById("headerConflictText");

    if (conflicts.length > 0) {
        if (bannerEl) bannerEl.classList.add("active");
        if (headerBtn) {
            headerBtn.style.display = "inline-flex";
            if (headerText) headerText.textContent = `${conflicts.length} Xung đột lịch`;
        }

        const bannerTitle = document.getElementById("bannerConflictTitle");
        const bannerDesc = document.getElementById("bannerConflictDesc");
        if (bannerTitle) bannerTitle.textContent = `Phát hiện ${conflicts.length} khung giờ bị trùng lịch trong nhóm!`;
        if (bannerDesc && conflicts[0]) {
            bannerDesc.textContent = `Ngày ${conflicts[0].date}: ${conflicts[0].affectedMember} bị trùng lịch giữa "${conflicts[0].eventA.title}" và "${conflicts[0].eventB.title}" (${conflicts[0].overlapStartStr} - ${conflicts[0].overlapEndStr}).`;
        }
    } else {
        if (bannerEl) bannerEl.classList.remove("active");
        if (headerBtn) headerBtn.style.display = "none";
    }
}

function updateNavigationTitle() {
    const titleEl = document.getElementById("calendarTitleHeading");
    if (!titleEl) return;

    const y = currentDate.getFullYear();
    const m = currentDate.getMonth() + 1;

    if (currentViewMode === "month") {
        titleEl.textContent = `Tháng ${m} / ${y}`;
    } else if (currentViewMode === "week") {
        const start = getStartOfWeek(currentDate);
        const end = new Date(start);
        end.setDate(start.getDate() + 6);
        titleEl.textContent = `Tuần: ${start.getDate()}/${start.getMonth()+1} - ${end.getDate()}/${end.getMonth()+1}/${end.getFullYear()}`;
    } else if (currentViewMode === "day") {
        titleEl.textContent = formatDisplayDate(currentDate);
        const dayBadge = document.getElementById("dayCurrentDateBadge");
        if (dayBadge) dayBadge.textContent = formatDisplayDate(currentDate);
    }
}

/* =========================================================
   1. RENDER MONTH VIEW
========================================================= */
function renderMonthView(activities) {
    const grid = document.getElementById("calendarMonthGrid");
    if (!grid) return;
    grid.innerHTML = "";

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDayOfMonth = new Date(year, month, 1);
    const offset = (firstDayOfMonth.getDay() + 6) % 7; // Monday = 0
    const startCalendarDate = new Date(year, month, 1 - offset);

    const todayStr = toDateKey(new Date());

    for (let i = 0; i < 42; i++) {
        const cellDate = new Date(startCalendarDate);
        cellDate.setDate(startCalendarDate.getDate() + i);
        const dateKey = toDateKey(cellDate);

        const dayItems = activities.filter(a => a.date === dateKey);
        const hasDayConflict = dayItems.some(a => a.hasConflict);

        const cell = document.createElement("article");
        cell.className = "calendar-day";

        if (cellDate.getMonth() !== month) {
            cell.classList.add("other-month");
        }
        if (dateKey === todayStr) {
            cell.classList.add("today");
        }

        cell.innerHTML = `
            <div class="day-header">
                <div class="day-number">${cellDate.getDate()}</div>
                ${hasDayConflict ? `<span class="day-conflict-indicator" title="Có lịch trùng giờ">⚠️ Trùng</span>` : ""}
            </div>
            <div class="day-events"></div>
        `;

        const eventsContainer = cell.querySelector(".day-events");

        dayItems.slice(0, 3).forEach(item => {
            const evBtn = document.createElement("button");
            evBtn.type = "button";
            evBtn.className = `calendar-event ${item.type} ${item.hasConflict ? "has-conflict" : ""}`;
            evBtn.dataset.eventId = item.id;

            const timeStr = item.time ? `<span class="event-time-badge">${item.time}</span>` : "";
            const memberObj = TEAM_MEMBERS.find(m => m.name === item.owner || m.id === item.ownerId);
            const dotBg = memberObj ? memberObj.color : "#64748b";

            evBtn.innerHTML = `
                <span class="event-owner-dot" style="background:${dotBg};"></span>
                ${timeStr}
                <span class="event-title-text">${escapeHtml(item.title)}</span>
            `;

            evBtn.addEventListener("click", () => openEventDetail(item));
            eventsContainer.appendChild(evBtn);
        });

        if (dayItems.length > 3) {
            const moreBtn = document.createElement("span");
            moreBtn.className = "day-more-events";
            moreBtn.textContent = `+${dayItems.length - 3} lịch khác...`;
            moreBtn.addEventListener("click", () => {
                currentDate = new Date(cellDate);
                switchViewMode("day");
            });
            eventsContainer.appendChild(moreBtn);
        }

        grid.appendChild(cell);
    }
}

/* =========================================================
   2. RENDER WEEK VIEW (TIME GRID 07:00 -> 19:00)
========================================================= */
function renderWeekView(activities) {
    const weekStart = getStartOfWeek(currentDate);
    const weekHeaderRow = document.getElementById("weekHeaderRow");
    const weekAllDayRow = document.getElementById("weekAllDayRow");
    const weekDayColsContainer = document.getElementById("weekDayColsContainer");

    if (!weekHeaderRow || !weekAllDayRow || !weekDayColsContainer) return;

    // Reset headers (keep first col)
    weekHeaderRow.innerHTML = `<div class="week-header-col-time">Giờ</div>`;
    weekAllDayRow.innerHTML = `<div class="week-all-day-label">Hạn chót</div>`;
    weekDayColsContainer.innerHTML = "";

    const todayStr = toDateKey(new Date());
    const dayNames = ["Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7", "Chủ nhật"];

    for (let d = 0; d < 7; d++) {
        const loopDate = new Date(weekStart);
        loopDate.setDate(weekStart.getDate() + d);
        const dateKey = toDateKey(loopDate);
        const isToday = (dateKey === todayStr);

        // 1. Header Col
        const headerCol = document.createElement("div");
        headerCol.className = `week-header-day ${isToday ? "today" : ""}`;
        headerCol.innerHTML = `
            <div class="day-title">${dayNames[d]}</div>
            <div class="day-date-number">${loopDate.getDate()}</div>
        `;
        weekHeaderRow.appendChild(headerCol);

        // 2. All-day tasks row cell
        const allDayCell = document.createElement("div");
        allDayCell.className = "week-all-day-cell";
        const allDayTasks = activities.filter(a => a.date === dateKey && a.type === "task" && !a.time);
        allDayTasks.forEach(task => {
            const pill = document.createElement("button");
            pill.type = "button";
            pill.className = `calendar-event task`;
            pill.style.cssText = "font-size:10px; padding:2px 4px; min-height:20px;";
            pill.innerHTML = `<span>📋 ${escapeHtml(task.title)}</span>`;
            pill.addEventListener("click", () => openEventDetail(task));
            allDayCell.appendChild(pill);
        });
        weekAllDayRow.appendChild(allDayCell);

        // 3. Time Grid Column
        const dayCol = document.createElement("div");
        dayCol.className = `week-day-column ${isToday ? "today" : ""}`;
        dayCol.dataset.dateKey = dateKey;

        // Current time line if today
        if (isToday) {
            const now = new Date();
            const nowMinutes = now.getHours() * 60 + now.getMinutes();
            if (nowMinutes >= 7 * 60 && nowMinutes <= 19 * 60) {
                const lineTop = ((nowMinutes - 7 * 60) / 60) * 54;
                const timeLine = document.createElement("div");
                timeLine.className = "current-time-line";
                timeLine.style.top = `${lineTop}px`;
                dayCol.appendChild(timeLine);
            }
        }

        // Render timed events
        const timedEvents = activities.filter(a => a.date === dateKey && a.time);
        timedEvents.forEach((ev, idx) => {
            const startMins = parseTimeToMinutes(ev.time);
            const endMins = ev.endTime ? parseTimeToMinutes(ev.endTime) : (startMins + 60);

            // Bounded to 07:00 -> 19:00
            const clampedStart = Math.max(7 * 60, startMins);
            const clampedEnd = Math.min(19 * 60, Math.max(clampedStart + 30, endMins));

            const topPx = ((clampedStart - 7 * 60) / 60) * 54;
            const heightPx = Math.max(28, ((clampedEnd - clampedStart) / 60) * 54);

            const card = document.createElement("div");
            card.className = `week-event-card ${ev.type} ${ev.hasConflict ? "has-conflict" : ""}`;
            card.style.top = `${topPx}px`;
            card.style.height = `${heightPx}px`;

            // If has conflict, shift slightly to side so both are readable
            if (ev.hasConflict) {
                card.style.width = "calc(100% - 10px)";
                if (idx % 2 === 1) card.style.left = "8px";
            }

            const memberObj = TEAM_MEMBERS.find(m => m.name === ev.owner || m.id === ev.ownerId);
            const dotBg = memberObj ? memberObj.color : "#64748b";

            card.innerHTML = `
                <div class="week-event-header">
                    <span class="week-event-time">${ev.time} - ${ev.endTime || ""}</span>
                    ${ev.hasConflict ? `<span style="font-size:9px; font-weight:700; color:#dc2626; background:#fee2e2; padding:1px 3px; border-radius:3px;">⚠️ Trùng</span>` : ""}
                </div>
                <div class="week-event-title">${escapeHtml(ev.title)}</div>
                <div class="week-event-meta">
                    <span style="width:6px; height:6px; border-radius:50%; background:${dotBg}; display:inline-block;"></span>
                    <span>${escapeHtml(ev.owner || "Tôi")}</span>
                    ${ev.relation ? `<span>• ${escapeHtml(ev.relation.split(" ")[0])}</span>` : ""}
                </div>
            `;

            card.addEventListener("click", () => openEventDetail(ev));
            dayCol.appendChild(card);
        });

        weekDayColsContainer.appendChild(dayCol);
    }
}

/* =========================================================
   3. RENDER DAY VIEW (TIMELINE & TEAM SWIMLANES)
========================================================= */
function renderDayView(activities) {
    const dateKey = toDateKey(currentDate);
    const dayActivities = activities.filter(a => a.date === dateKey);

    // Sort by time
    dayActivities.sort((a, b) => parseTimeToMinutes(a.time || "00:00") - parseTimeToMinutes(b.time || "00:00"));

    const timelineContainer = document.getElementById("dayTimelineView");
    const swimlanesContainer = document.getElementById("daySwimlanesView");

    if (currentDaySubMode === "timeline") {
        if (timelineContainer) timelineContainer.style.display = "flex";
        if (swimlanesContainer) swimlanesContainer.style.display = "none";
        renderDayTimeline(dayActivities);
    } else {
        if (timelineContainer) timelineContainer.style.display = "none";
        if (swimlanesContainer) swimlanesContainer.style.display = "block";
        renderDaySwimlanes(dayActivities);
    }
}

function renderDayTimeline(dayActivities) {
    const container = document.getElementById("dayTimelineView");
    if (!container) return;
    container.innerHTML = "";

    if (dayActivities.length === 0) {
        container.innerHTML = `
            <div class="day-timeline-empty">
                <div style="font-size:36px; margin-bottom:8px;">☕</div>
                <strong style="font-size:15px; color:var(--crm-text);">Không có hoạt động nào trong ngày này.</strong>
                <p style="font-size:12.5px; color:var(--crm-muted); margin-top:4px;">Bạn có thể nhấn "+ Đặt lịch mới" để thêm cuộc gặp hoặc công việc.</p>
            </div>
        `;
        return;
    }

    dayActivities.forEach(item => {
        const card = document.createElement("div");
        card.className = `timeline-event-card ${item.hasConflict ? "has-conflict" : ""}`;

        const memberObj = TEAM_MEMBERS.find(m => m.name === item.owner || m.id === item.ownerId);
        const avatarBg = memberObj ? memberObj.color : "#2563eb";
        const avatarLetter = memberObj ? memberObj.avatar : "U";

        card.innerHTML = `
            <div class="timeline-time-box">
                <span class="timeline-start-time">${item.time || "Cả ngày"}</span>
                <span class="timeline-end-time">${item.endTime ? `đến ${item.endTime}` : ""}</span>
            </div>

            <div class="timeline-body">
                <div class="timeline-title-row">
                    <h4 class="timeline-event-title">${escapeHtml(item.title)}</h4>
                    <div class="timeline-badges">
                        ${item.hasConflict ? `<span class="timeline-conflict-badge">⚠️ Trùng lịch</span>` : ""}
                        <span class="calendar-event ${item.type}" style="display:inline-block; padding:2px 8px; border-radius:4px; font-weight:700;">
                            ${typeLabel(item.type)}
                        </span>
                        <span style="font-size:11px; padding:2px 6px; border-radius:4px; background:var(--crm-surface-soft); color:var(--crm-muted);">
                            Ưu tiên: ${item.priority === 'high' ? 'Cao' : (item.priority === 'low' ? 'Thấp' : 'Trung bình')}
                        </span>
                    </div>
                </div>

                ${item.relation ? `
                    <div class="timeline-relation-text">
                        🏢 ${escapeHtml(item.relation)}
                    </div>
                ` : ""}

                ${item.description ? `
                    <div class="timeline-desc-text">
                        ${escapeHtml(item.description)}
                    </div>
                ` : ""}

                <div class="timeline-footer-row">
                    <div class="timeline-owner-info">
                        <div class="timeline-avatar-sm" style="background:${avatarBg};">${avatarLetter}</div>
                        <span><strong>${escapeHtml(item.owner || "Tôi")}</strong> ${memberObj ? `• ${memberObj.role}` : ""}</span>
                    </div>
                    ${item.location ? `<span>📍 ${escapeHtml(item.location)}</span>` : ""}
                </div>
            </div>
        `;

        card.addEventListener("click", () => openEventDetail(item));
        container.appendChild(card);
    });
}

function renderDaySwimlanes(dayActivities) {
    const headerRow = document.getElementById("swimlanesHeaderRow");
    const bodyGrid = document.getElementById("swimlanesBodyGrid");
    if (!headerRow || !bodyGrid) return;

    // Filter members according to member filter
    let members = TEAM_MEMBERS;
    if (currentMemberFilter === "MY") {
        members = TEAM_MEMBERS.filter(m => m.id === 1);
    } else if (currentMemberFilter !== "ALL") {
        members = TEAM_MEMBERS.filter(m => String(m.id) === String(currentMemberFilter));
    }

    const colCount = members.length;
    headerRow.style.gridTemplateColumns = `60px repeat(${colCount}, 1fr)`;
    bodyGrid.style.gridTemplateColumns = `60px repeat(${colCount}, 1fr)`;

    // Header
    headerRow.innerHTML = `<div class="swimlane-col-header" style="font-size:11px; font-weight:700; color:var(--crm-muted);">Giờ</div>`;
    members.forEach(m => {
        const col = document.createElement("div");
        col.className = "swimlane-col-header";
        col.innerHTML = `
            <div class="swimlane-user-badge">
                <div class="swimlane-avatar" style="background:${m.color};">${m.avatar}</div>
                <div style="text-align:left;">
                    <span class="swimlane-user-name">${escapeHtml(m.name)}</span>
                    <span class="swimlane-user-role">${escapeHtml(m.role)}</span>
                </div>
            </div>
        `;
        headerRow.appendChild(col);
    });

    // Body
    bodyGrid.innerHTML = `
        <div class="week-time-labels">
            <div class="time-slot-label" style="height:52px;">07:00</div>
            <div class="time-slot-label" style="height:52px;">08:00</div>
            <div class="time-slot-label" style="height:52px;">09:00</div>
            <div class="time-slot-label" style="height:52px;">10:00</div>
            <div class="time-slot-label" style="height:52px;">11:00</div>
            <div class="time-slot-label" style="height:52px;">12:00</div>
            <div class="time-slot-label" style="height:52px;">13:00</div>
            <div class="time-slot-label" style="height:52px;">14:00</div>
            <div class="time-slot-label" style="height:52px;">15:00</div>
            <div class="time-slot-label" style="height:52px;">16:00</div>
            <div class="time-slot-label" style="height:52px;">17:00</div>
            <div class="time-slot-label" style="height:52px;">18:00</div>
        </div>
    `;

    members.forEach(member => {
        const col = document.createElement("div");
        col.className = "swimlane-member-column";

        const memberActs = dayActivities.filter(a => a.owner === member.name || a.ownerId === member.id || (a.attendees && a.attendees.includes(member.name)));

        memberActs.forEach(ev => {
            const startMins = parseTimeToMinutes(ev.time || "08:00");
            const endMins = ev.endTime ? parseTimeToMinutes(ev.endTime) : (startMins + 60);

            const clampedStart = Math.max(7 * 60, startMins);
            const clampedEnd = Math.min(19 * 60, Math.max(clampedStart + 30, endMins));

            const topPx = ((clampedStart - 7 * 60) / 60) * 52;
            const heightPx = Math.max(28, ((clampedEnd - clampedStart) / 60) * 52);

            const card = document.createElement("div");
            card.className = `week-event-card ${ev.type} ${ev.hasConflict ? "has-conflict" : ""}`;
            card.style.top = `${topPx}px`;
            card.style.height = `${heightPx}px`;

            card.innerHTML = `
                <div class="week-event-header">
                    <span class="week-event-time">${ev.time} - ${ev.endTime || ""}</span>
                    ${ev.hasConflict ? `<span style="font-size:9px; font-weight:700; color:#dc2626; background:#fee2e2; padding:1px 3px; border-radius:3px;">⚠️ Trùng</span>` : ""}
                </div>
                <div class="week-event-title">${escapeHtml(ev.title)}</div>
                ${ev.relation ? `<div style="font-size:10px; opacity:0.85;">🏢 ${escapeHtml(ev.relation)}</div>` : ""}
            `;

            card.addEventListener("click", () => openEventDetail(ev));
            col.appendChild(card);
        });

        bodyGrid.appendChild(col);
    });
}

/* =========================================================
   VIEW SWITCHER CONTROLS
========================================================= */
function switchViewMode(mode) {
    currentViewMode = mode;

    document.querySelectorAll(".calendar-view-pill").forEach(pill => {
        pill.classList.toggle("active", pill.dataset.view === mode);
    });

    render();
}

/* =========================================================
   EVENT DETAIL MODAL
========================================================= */
function openEventDetail(item) {
    selectedEventForDetail = item;
    const modal = document.getElementById("calendarModal");
    const overlay = document.getElementById("calendarOverlay");
    if (!modal || !overlay) return;

    // Type Badge
    const typeBadge = document.getElementById("detailTypeBadge");
    if (typeBadge) {
        typeBadge.textContent = typeLabel(item.type);
        typeBadge.className = `calendar-event ${item.type}`;
        typeBadge.style.display = "inline-block";
    }

    // Modal Title
    setText("calendarModalTitle", item.title);

    // Conflict Alert in Detail
    const conflictBox = document.getElementById("detailConflictAlertBox");
    if (conflictBox) {
        conflictBox.style.display = item.hasConflict ? "block" : "none";
    }

    // Relation
    setText("detailActivityRelation", item.relation || "Không liên kết");

    // Date & Time
    const timeStr = item.time ? ` từ ${item.time}${item.endTime ? ` đến ${item.endTime}` : ""}` : "";
    setText("detailActivityDate", `${item.date || "Chưa đặt lịch"}${timeStr}`);

    // Location
    setText("detailActivityLocation", item.location || "Chưa xác định");

    // Owner
    const memberObj = TEAM_MEMBERS.find(m => m.name === item.owner || m.id === item.ownerId);
    setText("detailActivityOwner", item.owner ? `${item.owner} (${memberObj ? memberObj.role : "Thành viên"})` : "Chưa phân công");

    // Status
    const statusText = item.status === "done" ? "✅ Đã hoàn thành" : "⏳ Đang mở / Chờ thực hiện";
    const priorityText = item.priority === "high" ? "Cao" : (item.priority === "low" ? "Thấp" : "Trung bình");
    setText("detailActivityStatus", `${statusText} • Ưu tiên ${priorityText}`);

    // Attendees
    const attendeesRow = document.getElementById("detailAttendeesRow");
    if (attendeesRow) {
        if (item.attendees) {
            attendeesRow.style.display = "block";
            setText("detailActivityAttendees", item.attendees);
        } else {
            attendeesRow.style.display = "none";
        }
    }

    // Description
    setText("detailActivityDescription", item.description || "Không có ghi chú thêm.");

    // Toggle Done Button Label
    const toggleDoneBtn = document.getElementById("btnToggleDoneEvent");
    if (toggleDoneBtn) {
        toggleDoneBtn.textContent = item.status === "done" ? "Mở lại hoạt động" : "Đánh dấu Hoàn thành";
    }

    modal.classList.add("open");
    overlay.classList.add("open");
}

function closeEventDetail() {
    const modal = document.getElementById("calendarModal");
    const overlay = document.getElementById("calendarOverlay");
    if (modal) modal.classList.remove("open");
    if (overlay) overlay.classList.remove("open");
    selectedEventForDetail = null;
}

/* =========================================================
   NEW / EDIT EVENT FORM MODAL
========================================================= */
function openEventForm(editItem = null) {
    const modal = document.getElementById("eventFormModal");
    const overlay = document.getElementById("eventFormOverlay");
    const titleEl = document.getElementById("eventFormModalTitle");
    const warningEl = document.getElementById("formConflictWarning");
    if (warningEl) warningEl.classList.remove("active");

    const form = document.getElementById("formCreateOrEditEvent");
    if (form) form.reset();

    if (editItem) {
        if (titleEl) titleEl.textContent = "✏️ Sửa thông tin hoạt động";
        setValue("eventFormId", editItem.id);
        setValue("eventFormType", editItem.type || "meeting");
        setValue("eventFormTitle", editItem.title);
        setValue("eventFormCustomer", editItem.relation || "");
        setValue("eventFormDate", editItem.date || toDateKey(new Date()));
        setValue("eventFormStartTime", editItem.time || "09:00");
        setValue("eventFormEndTime", editItem.endTime || "10:30");
        setValue("eventFormOwner", editItem.owner || "Trần Thị Thu Hà");
        setValue("eventFormLocation", editItem.location || "");
        setValue("eventFormPriority", editItem.priority || "medium");
        setValue("eventFormDesc", editItem.description || "");
    } else {
        if (titleEl) titleEl.textContent = "📅 Đặt lịch làm việc mới";
        setValue("eventFormId", "");
        setValue("eventFormDate", toDateKey(currentDate));
        setValue("eventFormStartTime", "09:00");
        setValue("eventFormEndTime", "10:30");
        setValue("eventFormOwner", "Trần Thị Thu Hà");
    }

    checkRealtimeFormConflict();

    if (modal) modal.classList.add("open");
    if (overlay) overlay.classList.add("open");
}

function closeEventForm() {
    const modal = document.getElementById("eventFormModal");
    const overlay = document.getElementById("eventFormOverlay");
    if (modal) modal.classList.remove("open");
    if (overlay) overlay.classList.remove("open");
}

function checkRealtimeFormConflict() {
    const formId = document.getElementById("eventFormId")?.value;
    const date = document.getElementById("eventFormDate")?.value;
    const startTime = document.getElementById("eventFormStartTime")?.value;
    const endTime = document.getElementById("eventFormEndTime")?.value;
    const owner = document.getElementById("eventFormOwner")?.value;

    const warningEl = document.getElementById("formConflictWarning");
    const msgEl = document.getElementById("formConflictMsg");
    if (!warningEl || !msgEl || !date || !startTime || !owner) return;

    const activities = loadActivities();
    const startMins = parseTimeToMinutes(startTime);
    const endMins = endTime ? parseTimeToMinutes(endTime) : (startMins + 60);

    const conflictingEvent = activities.find(a => {
        if (a.id === formId) return false;
        if (a.date !== date || !a.time || a.status === "cancelled") return false;
        if (a.owner !== owner && !(a.attendees && a.attendees.includes(owner))) return false;

        const aStart = parseTimeToMinutes(a.time);
        const aEnd = a.endTime ? parseTimeToMinutes(a.endTime) : (aStart + 60);

        return (startMins < aEnd && aStart < endMins);
    });

    if (conflictingEvent) {
        warningEl.classList.add("active");
        msgEl.textContent = `Nhân sự "${owner}" đã có lịch "${conflictingEvent.title}" từ ${conflictingEvent.time} đến ${conflictingEvent.endTime || 'sau đó'} cùng ngày! Bạn có thể dời khung giờ để tránh chồng chéo.`;
    } else {
        warningEl.classList.remove("active");
    }
}

function handleSaveEvent(e) {
    e.preventDefault();
    const formId = document.getElementById("eventFormId")?.value;
    const type = document.getElementById("eventFormType")?.value;
    const title = document.getElementById("eventFormTitle")?.value.trim();
    const customer = document.getElementById("eventFormCustomer")?.value;
    const date = document.getElementById("eventFormDate")?.value;
    const startTime = document.getElementById("eventFormStartTime")?.value;
    const endTime = document.getElementById("eventFormEndTime")?.value;
    const owner = document.getElementById("eventFormOwner")?.value;
    const location = document.getElementById("eventFormLocation")?.value.trim();
    const priority = document.getElementById("eventFormPriority")?.value;
    const desc = document.getElementById("eventFormDesc")?.value.trim();

    if (!title || !date) {
        alert("Vui lòng điền tiêu đề và ngày diễn ra.");
        return;
    }

    const memberObj = TEAM_MEMBERS.find(m => m.name === owner);
    const activities = loadActivities();

    if (formId) {
        // Edit existing
        const idx = activities.findIndex(a => a.id === formId);
        if (idx !== -1) {
            activities[idx] = {
                ...activities[idx],
                type,
                title,
                relation: customer,
                date,
                time: startTime,
                endTime,
                owner,
                ownerId: memberObj ? memberObj.id : 1,
                location,
                priority,
                description: desc
            };
        }
    } else {
        // Create new
        const newEvent = {
            id: `act-${Date.now()}`,
            type,
            title,
            relation: customer,
            date,
            time: startTime,
            endTime,
            owner,
            ownerId: memberObj ? memberObj.id : 1,
            location,
            priority,
            status: "open",
            description: desc
        };
        activities.unshift(newEvent);
    }

    saveActivities(activities);
    closeEventForm();
    closeEventDetail();
    render();
}

/* =========================================================
   CONFLICT RESOLUTION MODAL
========================================================= */
function openConflictModal() {
    const modal = document.getElementById("conflictListModal");
    const overlay = document.getElementById("conflictListOverlay");
    const listContainer = document.getElementById("conflictCardsList");
    if (!modal || !overlay || !listContainer) return;

    const activities = loadActivities();
    const conflicts = detectConflicts(activities);
    listContainer.innerHTML = "";

    if (conflicts.length === 0) {
        listContainer.innerHTML = `
            <div style="text-align:center; padding:30px; color:var(--crm-muted);">
                🎉 Tuyệt vời! Hiện tại không có lịch nào bị trùng giờ trong nhóm.
            </div>
        `;
    } else {
        conflicts.forEach(conf => {
            const item = document.createElement("div");
            item.className = "conflict-card-item";

            item.innerHTML = `
                <div class="conflict-card-meta">
                    <span>⚠️ Trùng giờ ngày ${conf.date} (Khoảng ${conf.overlapStartStr} - ${conf.overlapEndStr})</span>
                    <span>Thành viên: ${conf.affectedMember}</span>
                </div>

                <div class="conflict-pair-grid">
                    <div class="conflict-sub-event">
                        <strong>Lịch 1: ${escapeHtml(conf.eventA.title)}</strong>
                        <span>⏰ ${conf.eventA.time} - ${conf.eventA.endTime || ""}</span>
                        <span>👤 ${escapeHtml(conf.eventA.owner)}</span>
                        ${conf.eventA.relation ? `<span>🏢 ${escapeHtml(conf.eventA.relation)}</span>` : ""}
                    </div>

                    <div class="conflict-sub-event">
                        <strong>Lịch 2: ${escapeHtml(conf.eventB.title)}</strong>
                        <span>⏰ ${conf.eventB.time} - ${conf.eventB.endTime || ""}</span>
                        <span>👤 ${escapeHtml(conf.eventB.owner)}</span>
                        ${conf.eventB.relation ? `<span>🏢 ${escapeHtml(conf.eventB.relation)}</span>` : ""}
                    </div>
                </div>

                <div class="conflict-resolution-hint">
                    <span>💡 <strong>Gợi ý sắp xếp:</strong> Dời "${escapeHtml(conf.eventB.title)}" sang khung giờ trống 10:30 - 12:00 hoặc 16:30 - 17:30</span>
                    <button type="button" class="crm-btn crm-btn-primary" style="font-size:12px; padding:4px 10px;" data-reschedule-id="${conf.eventB.id}">
                        Dời lịch tự động
                    </button>
                </div>
            `;

            // Auto-reschedule button
            const btnReschedule = item.querySelector("[data-reschedule-id]");
            if (btnReschedule) {
                btnReschedule.addEventListener("click", () => {
                    rescheduleConflictEvent(conf.eventB.id);
                });
            }

            listContainer.appendChild(item);
        });
    }

    modal.classList.add("open");
    overlay.classList.add("open");
}

function closeConflictModal() {
    const modal = document.getElementById("conflictListModal");
    const overlay = document.getElementById("conflictListOverlay");
    if (modal) modal.classList.remove("open");
    if (overlay) overlay.classList.remove("open");
}

function rescheduleConflictEvent(eventId) {
    const activities = loadActivities();
    const ev = activities.find(a => a.id === eventId);
    if (!ev) return;

    // Shift to 16:30 - 17:30
    ev.time = "16:30";
    ev.endTime = "17:30";
    saveActivities(activities);

    closeConflictModal();
    render();
    alert(`Đã dời lịch "${ev.title}" sang khung giờ 16:30 - 17:30 ngày ${ev.date} thành công! Lịch không còn bị chồng chéo.`);
}

/* =========================================================
   HELPER FUNCTIONS
========================================================= */
function typeLabel(type) {
    switch (type) {
        case "meeting": return "Cuộc họp / Gặp";
        case "task": return "Công việc";
        case "call": return "Cuộc gọi";
        case "email": return "Email";
        default: return "Hoạt động";
    }
}

function setText(id, val) {
    const el = document.getElementById(id);
    if (el) el.textContent = val ?? "";
}

function setValue(id, val) {
    const el = document.getElementById(id);
    if (el) el.value = val ?? "";
}

function escapeHtml(val) {
    return String(val ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
}

/* =========================================================
   EVENT LISTENERS INITIALIZATION
========================================================= */
document.addEventListener("DOMContentLoaded", () => {
    // 1. Navigation buttons
    document.getElementById("btnPrevDate")?.addEventListener("click", () => {
        if (currentViewMode === "month") {
            currentDate.setMonth(currentDate.getMonth() - 1);
        } else if (currentViewMode === "week") {
            currentDate.setDate(currentDate.getDate() - 7);
        } else if (currentViewMode === "day") {
            currentDate.setDate(currentDate.getDate() - 1);
        }
        render();
    });

    document.getElementById("btnNextDate")?.addEventListener("click", () => {
        if (currentViewMode === "month") {
            currentDate.setMonth(currentDate.getMonth() + 1);
        } else if (currentViewMode === "week") {
            currentDate.setDate(currentDate.getDate() + 7);
        } else if (currentViewMode === "day") {
            currentDate.setDate(currentDate.getDate() + 1);
        }
        render();
    });

    document.getElementById("btnToday")?.addEventListener("click", () => {
        currentDate = new Date();
        render();
    });

    // 2. View Mode Pills
    document.querySelectorAll(".calendar-view-pill").forEach(pill => {
        pill.addEventListener("click", () => {
            switchViewMode(pill.dataset.view);
        });
    });

    // 3. Day Sub-mode buttons
    document.getElementById("btnDaySubTimeline")?.addEventListener("click", () => {
        currentDaySubMode = "timeline";
        document.getElementById("btnDaySubTimeline")?.classList.add("active");
        document.getElementById("btnDaySubSwimlanes")?.classList.remove("active");
        render();
    });

    document.getElementById("btnDaySubSwimlanes")?.addEventListener("click", () => {
        currentDaySubMode = "swimlanes";
        document.getElementById("btnDaySubSwimlanes")?.classList.add("active");
        document.getElementById("btnDaySubTimeline")?.classList.remove("active");
        render();
    });

    // 4. Filters
    document.getElementById("calendarMemberFilter")?.addEventListener("change", e => {
        currentMemberFilter = e.target.value;
        render();
    });

    document.getElementById("calendarTypeFilter")?.addEventListener("change", e => {
        currentTypeFilter = e.target.value;
        render();
    });

    // 5. Conflict Modal Handlers
    document.getElementById("btnBannerViewConflicts")?.addEventListener("click", openConflictModal);
    document.getElementById("btnHeaderConflicts")?.addEventListener("click", openConflictModal);
    document.getElementById("btnCloseConflictModal")?.addEventListener("click", closeConflictModal);
    document.getElementById("conflictListOverlay")?.addEventListener("click", closeConflictModal);

    // 6. Detail Modal Handlers
    document.getElementById("closeCalendarModal")?.addEventListener("click", closeEventDetail);
    document.getElementById("calendarOverlay")?.addEventListener("click", closeEventDetail);

    document.getElementById("btnToggleDoneEvent")?.addEventListener("click", () => {
        if (!selectedEventForDetail) return;
        const activities = loadActivities();
        const ev = activities.find(a => a.id === selectedEventForDetail.id);
        if (ev) {
            ev.status = (ev.status === "done") ? "open" : "done";
            saveActivities(activities);
            closeEventDetail();
            render();
        }
    });

    document.getElementById("btnDeleteEvent")?.addEventListener("click", () => {
        if (!selectedEventForDetail) return;
        if (!confirm(`Bạn có chắc chắn muốn xóa "${selectedEventForDetail.title}"?`)) return;

        let activities = loadActivities();
        activities = activities.filter(a => a.id !== selectedEventForDetail.id);
        saveActivities(activities);
        closeEventDetail();
        render();
    });

    document.getElementById("btnEditEventFromDetail")?.addEventListener("click", () => {
        if (!selectedEventForDetail) return;
        const target = selectedEventForDetail;
        closeEventDetail();
        openEventForm(target);
    });

    // 7. Event Creation Modal Handlers
    document.getElementById("btnOpenNewEventModal")?.addEventListener("click", () => openEventForm());
    document.getElementById("btnCloseEventForm")?.addEventListener("click", closeEventForm);
    document.getElementById("btnCancelEventForm")?.addEventListener("click", closeEventForm);
    document.getElementById("eventFormOverlay")?.addEventListener("click", closeEventForm);
    document.getElementById("formCreateOrEditEvent")?.addEventListener("submit", handleSaveEvent);

    // Real-time conflict checking on form inputs
    ["eventFormDate", "eventFormStartTime", "eventFormEndTime", "eventFormOwner"].forEach(id => {
        document.getElementById(id)?.addEventListener("change", checkRealtimeFormConflict);
        document.getElementById(id)?.addEventListener("input", checkRealtimeFormConflict);
    });

    // Initial render
    render();
});