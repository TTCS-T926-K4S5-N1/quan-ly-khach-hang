// Mock Opportunities Initial Data
let opportunities = [
    { id: "OPP-1001", title: "Triển khai ERP cho 5 nhà máy", customer: "Công ty Cổ phần Tập đoàn FLC", owner: "Trần Văn Nam", stage: "Đàm phán Hợp đồng", amount: 450000000, probability: 80, expectedClose: "2026-11-15" },
    { id: "OPP-1002", title: "Gói bảo trì hệ thống mạng 2 năm", customer: "Ngân hàng TMCP TPBank", owner: "Lê Thị Mai", stage: "Gửi Báo giá", amount: 180000000, probability: 60, expectedClose: "2026-11-20" },
    { id: "OPP-1003", title: "Phần mềm Quản lý Nhân sự HRM", customer: "Tập đoàn Bất động sản Vinhomes", owner: "Hoàng Minh Tuấn", stage: "Chốt thành công (Won)", amount: 320000000, probability: 100, expectedClose: "2026-10-18" },
    { id: "OPP-1004", title: "Thiết kế Website & Hạ tầng Cloud", customer: "Chuỗi Cửa hàng Long Châu", owner: "Phạm Quốc Bảo", stage: "Demo / Tư vấn", amount: 95000000, probability: 40, expectedClose: "2026-12-05" },
    { id: "OPP-1005", title: "Nâng cấp máy chủ Data Center", customer: "Công ty TNHH Minh An", owner: "Trần Văn Nam", stage: "Tiếp cận (Lead)", amount: 210000000, probability: 20, expectedClose: "2026-12-20" },
    { id: "OPP-1006", title: "Bảo mật thông tin ISO 27001", customer: "Tập đoàn BKAV", owner: "Lê Thị Mai", stage: "Thất bại (Lost)", amount: 150000000, probability: 0, expectedClose: "2026-10-10" },
    { id: "OPP-1007", title: "Tích hợp Cổng thanh toán Online", customer: "Công ty Thương mại Dịch vụ Chic", owner: "Hoàng Minh Tuấn", stage: "Gửi Báo giá", amount: 130000000, probability: 50, expectedClose: "2026-11-30" }
];

let filteredData = [];

// Currency Formatter
function formatVND(amount) {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
}

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
    // Set default closing date modal to next month
    const today = new Date();
    today.setMonth(today.getMonth() + 1);
    document.getElementById('new-close-date').value = today.toISOString().split('T')[0];

    applyFilters();
});

// Auto win-rate suggestion based on stage
function autoFillWinRate() {
    const stage = document.getElementById('new-stage').value;
    const probInput = document.getElementById('new-probability');
    
    if (stage === "Tiếp cận (Lead)") probInput.value = 20;
    else if (stage === "Demo / Tư vấn") probInput.value = 40;
    else if (stage === "Gửi Báo giá") probInput.value = 60;
    else if (stage === "Đàm phán Hợp đồng") probInput.value = 80;
    else if (stage === "Chốt thành công (Won)") probInput.value = 100;
    else if (stage === "Thất bại (Lost)") probInput.value = 0;
}

// Apply Filters & Render
function applyFilters() {
    const stage = document.getElementById('filter-stage').value;
    const owner = document.getElementById('filter-owner').value;
    const keyword = document.getElementById('filter-search').value.toLowerCase();

    filteredData = opportunities.filter(opp => {
        const matchesStage = (stage === 'ALL') || (opp.stage === stage);
        const matchesOwner = (owner === 'ALL') || (opp.owner === owner);
        const matchesKeyword = opp.title.toLowerCase().includes(keyword) || 
                               opp.customer.toLowerCase().includes(keyword) ||
                               opp.id.toLowerCase().includes(keyword);
        return matchesStage && matchesOwner && matchesKeyword;
    });

    renderPreviewTable();
    updateMetrics();
}

// Render Preview Table
function renderPreviewTable() {
    const tbody = document.getElementById('opp-table-body');
    const tfoot = document.getElementById('opp-table-foot');
    tbody.innerHTML = '';

    let totalValue = 0;
    let totalWeighted = 0;

    filteredData.forEach(opp => {
        const weightedValue = opp.amount * (opp.probability / 100);
        totalValue += opp.amount;
        totalWeighted += weightedValue;

        // Stage Color Badge
        let badgeClass = "bg-slate-100 text-slate-700";
        if (opp.stage.includes("Won")) badgeClass = "bg-emerald-100 text-emerald-800";
        else if (opp.stage.includes("Lost")) badgeClass = "bg-rose-100 text-rose-800";
        else if (opp.stage.includes("Đàm phán")) badgeClass = "bg-blue-100 text-blue-800";
        else if (opp.stage.includes("Báo giá")) badgeClass = "bg-amber-100 text-amber-800";

        const tr = document.createElement('tr');
        tr.className = "hover:bg-slate-50 transition border-b border-slate-100";
        tr.innerHTML = `
            <td class="p-3 font-mono text-slate-500 font-semibold">${opp.id}</td>
            <td class="p-3">
                <div class="font-bold text-slate-900">${opp.title}</div>
                <div class="text-slate-400 text-[11px]">${opp.customer}</div>
            </td>
            <td class="p-3 font-medium text-slate-700">${opp.owner}</td>
            <td class="p-3">
                <span class="inline-block px-2.5 py-1 rounded-full text-[11px] font-bold ${badgeClass}">
                    ${opp.stage}
                </span>
            </td>
            <td class="p-3 text-right font-bold text-slate-800">${formatVND(opp.amount)}</td>
            <td class="p-3 text-center font-bold text-blue-600">${opp.probability}%</td>
            <td class="p-3 text-right font-bold text-emerald-600">${formatVND(weightedValue)}</td>
            <td class="p-3 text-center text-slate-500 font-mono">${opp.expectedClose}</td>
        `;
        tbody.appendChild(tr);
    });

    // Foot Summary Row
    tfoot.innerHTML = `
        <tr>
            <td colspan="4" class="p-3 text-right uppercase tracking-wider">TỔNG CỘNG (${filteredData.length} cơ hội):</td>
            <td class="p-3 text-right text-amber-400 text-sm">${formatVND(totalValue)}</td>
            <td class="p-3 text-center">-</td>
            <td class="p-3 text-right text-emerald-400 text-sm">${formatVND(totalWeighted)}</td>
            <td class="p-3"></td>
        </tr>
    `;

    document.getElementById('filtered-count').innerText = filteredData.length;
    document.getElementById('total-count').innerText = opportunities.length;
}

// Update Header Metric Cards
function updateMetrics() {
    document.getElementById('metric-count').innerText = filteredData.length;

    const totalVal = filteredData.reduce((sum, o) => sum + o.amount, 0);
    const totalWeighted = filteredData.reduce((sum, o) => sum + (o.amount * (o.probability / 100)), 0);
    const avgWin = filteredData.length > 0 ? (filteredData.reduce((sum, o) => sum + o.probability, 0) / filteredData.length) : 0;

    document.getElementById('metric-total-value').innerText = formatVND(totalVal);
    document.getElementById('metric-weighted-value').innerText = formatVND(totalWeighted);
    document.getElementById('metric-avg-win').innerText = `${avgWin.toFixed(1)}%`;
}

// EXPORT TO EXCEL FUNCTION (Sử dụng SheetJS)
function exportToExcel() {
    if (filteredData.length === 0) {
        alert("Không có dữ liệu cơ hội nào để xuất báo cáo!");
        return;
    }

    const template = document.getElementById('export-template').value;
    const nowStr = new Date().toLocaleDateString('vi-VN');

    // Construct Data Rows for Excel
    let excelRows = [];

    // Header Titles
    excelRows.push(["BÁO CÁO DANH SÁCH CƠ HỘI KINH DOANH (SALES PIPELINE)"]);
    excelRows.push([`Ngày xuất báo cáo: ${nowStr} | Người xuất: Nguyễn Văn Bình (Trưởng nhóm Kinh doanh)`]);
    excelRows.push([]); // Empty row

    // Table Columns Header
    excelRows.push([
        "STT",
        "Mã Cơ Hội",
        "Tên Cơ Hội / Dự Án",
        "Khách Hàng",
        "Giai Đoạn Bán Hàng",
        "Nhân Viên Phụ Trách",
        "Giá Trị Đơn Hàng (VNĐ)",
        "Tỷ Lệ Chốt (%)",
        "Doanh Thu Dự Kiến Weighted (VNĐ)",
        "Ngày Chốt Dự Kiến"
    ]);

    let sumAmount = 0;
    let sumWeighted = 0;

    // Populate Data Rows
    filteredData.forEach((opp, index) => {
        const weighted = opp.amount * (opp.probability / 100);
        sumAmount += opp.amount;
        sumWeighted += weighted;

        excelRows.push([
            index + 1,
            opp.id,
            opp.title,
            opp.customer,
            opp.stage,
            opp.owner,
            opp.amount,
            opp.probability / 100, // Format Excel %
            weighted,
            opp.expectedClose
        ]);
    });

    // Summary Footer Row
    excelRows.push([]);
    excelRows.push([
        "",
        "",
        "TỔNG CỘNG",
        "",
        "",
        "",
        sumAmount,
        "",
        sumWeighted,
        ""
    ]);

    // Create Workbook & Worksheet
    const worksheet = XLSX.utils.aoa_to_sheet(excelRows);

    // Set Professional Column Widths
    worksheet['!cols'] = [
        { wch: 6 },  // STT
        { wch: 12 }, // Mã
        { wch: 35 }, // Tên cơ hội
        { wch: 30 }, // Khách hàng
        { wch: 22 }, // Giai đoạn
        { wch: 18 }, // Nhân viên
        { wch: 22 }, // Giá trị
        { wch: 14 }, // Tỷ lệ %
        { wch: 25 }, // Doanh thu dự kiến
        { wch: 16 }  // Ngày chốt
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Bao_Cao_Pipeline");

    // File Output Name
    const fileName = `Bao_Cao_Co_Hoi_Kinh_Doanh_${new Date().toISOString().slice(0,10)}.xlsx`;

    // Download File
    XLSX.writeFile(workbook, fileName);
}

// Modal Handlers
function openAddModal() {
    document.getElementById('modal-add').classList.remove('hidden');
}

function closeAddModal() {
    document.getElementById('modal-add').classList.add('hidden');
}

function handleAddOpportunity(e) {
    e.preventDefault();
    const title = document.getElementById('new-title').value;
    const customer = document.getElementById('new-customer').value;
    const owner = document.getElementById('new-owner').value;
    const stage = document.getElementById('new-stage').value;
    const amount = parseFloat(document.getElementById('new-amount').value) || 0;
    const probability = parseFloat(document.getElementById('new-probability').value) || 0;
    const expectedClose = document.getElementById('new-close-date').value;

    const newOpp = {
        id: `OPP-100${opportunities.length + 1}`,
        title,
        customer,
        owner,
        stage,
        amount,
        probability,
        expectedClose
    };

    opportunities.unshift(newOpp);
    closeAddModal();
    applyFilters();
    alert(`Đã thêm cơ hội mới thành công: ${newOpp.id}`);
}