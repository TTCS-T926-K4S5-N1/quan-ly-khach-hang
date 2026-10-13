// State Management
let rules = [
  { id: 1, name: "Phân bổ Lead VIP Công nghệ Miền Bắc", region: "Miền Bắc", industry: "Công nghệ", method: "Round-Robin", assignees: "Tuấn Anh, Hoàng Nam, Thu Hà", active: true },
  { id: 2, name: "Lead Bất động sản Miền Nam", region: "Miền Nam", industry: "Bất động sản", method: "Region-Leader", assignees: "Minh Trí (Trưởng nhóm MN)", active: true },
  { id: 3, name: "Xoay vòng Lead Tài chính Toàn quốc", region: "Tất cả", industry: "Tài chính / Ngân hàng", method: "Round-Robin", assignees: "Sales Team Bank", active: true }
];

let unassignedLeads = [
  { id: 101, name: "Công ty Dược phẩm VinaPharm", region: "Miền Trung", industry: "Y tế", source: "Website Form", created: "2 phút trước" },
  { id: 102, name: "Tập đoàn Giáo dục EduWorld", region: "Miền Bắc", industry: "Giáo dục", source: "Facebook Ads", created: "4 phút trước" }
];

let logs = [
  { time: "10:14:02", name: "Công ty FPT IS", attr: "Miền Bắc | Công nghệ", rule: "Phân bổ Lead VIP Công nghệ Miền Bắc", assignee: "Tuấn Anh", sla: "0.8 phút (Đạt SLA < 5m)" },
  { time: "10:02:11", name: "Tập đoàn Novaland", attr: "Miền Nam | Bất động sản", rule: "Lead Bất động sản Miền Nam", assignee: "Minh Trí", sla: "1.5 phút (Đạt SLA < 5m)" }
];

// Initialize UI
document.addEventListener("DOMContentLoaded", () => {
  renderRules();
  renderUnassigned();
  renderLogs();
});

// Render Priority Rules List
function renderRules() {
  const container = document.getElementById("rulesList");
  container.innerHTML = "";

  rules.forEach((rule, index) => {
    const item = document.createElement("div");
    item.className = `px-6 py-4 flex items-center justify-between bg-white hover:bg-slate-50 transition ${!rule.active ? 'opacity-50' : ''}`;
    item.innerHTML = `
      <div class="w-16 flex items-center gap-2">
        <i class="fa-solid fa-grip-vertical text-slate-300 cursor-grab hover:text-slate-500"></i>
        <span class="font-bold text-slate-600 text-sm">#${index + 1}</span>
      </div>
      <div class="flex-1 pr-4">
        <div class="font-bold text-slate-900 text-sm flex items-center gap-2">
          ${rule.name}
          ${index === 0 ? '<span class="bg-amber-100 text-amber-800 text-[10px] px-2 py-0.5 rounded font-semibold"><i class="fa-solid fa-crown"></i> Thắng tuyệt đối</span>' : ''}
        </div>
        <div class="flex items-center gap-2 text-xs text-slate-500 mt-1">
          <span class="bg-slate-100 px-2 py-0.5 rounded border border-slate-200">Khu vực: <strong class="text-slate-700">${rule.region}</strong></span>
          <span class="bg-slate-100 px-2 py-0.5 rounded border border-slate-200">Ngành: <strong class="text-slate-700">${rule.industry}</strong></span>
        </div>
      </div>
      <div class="w-48 text-xs">
        <div class="font-semibold text-indigo-600">${rule.method}</div>
        <div class="text-slate-500 truncate max-w-[180px]" title="${rule.assignees}">Gán: ${rule.assignees}</div>
      </div>
      <div class="w-28 text-center">
        <label class="relative inline-flex items-center cursor-pointer">
          <input type="checkbox" ${rule.active ? 'checked' : ''} onchange="toggleRule(${rule.id})" class="sr-only peer">
          <div class="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
        </label>
      </div>
      <div class="w-28 text-right flex items-center justify-end gap-2">
        <button onclick="moveRule(${index}, -1)" ${index === 0 ? 'disabled class="text-slate-200 cursor-not-allowed"' : 'class="text-slate-400 hover:text-indigo-600"'} title="Tăng ưu tiên">
          <i class="fa-solid fa-arrow-up"></i>
        </button>
        <button onclick="moveRule(${index}, 1)" ${index === rules.length - 1 ? 'disabled class="text-slate-200 cursor-not-allowed"' : 'class="text-slate-400 hover:text-indigo-600"'} title="Giảm ưu tiên">
          <i class="fa-solid fa-arrow-down"></i>
        </button>
        <button onclick="deleteRule(${rule.id})" class="text-slate-400 hover:text-red-600 ml-2" title="Xóa quy tắc">
          <i class="fa-solid fa-trash-can"></i>
        </button>
      </div>
    `;
    container.appendChild(item);
  });

  document.getElementById("kpiActiveRules").innerText = rules.filter(r => r.active).length;
}

// Render Unassigned Queue Tab
function renderUnassigned() {
  const container = document.getElementById("unassignedList");
  const badge = document.getElementById("queueBadge");
  const kpi = document.getElementById("kpiManualQueue");

  badge.innerText = unassignedLeads.length;
  kpi.innerText = unassignedLeads.length;

  if (unassignedLeads.length === 0) {
    container.innerHTML = `<tr><td colspan="6" class="p-8 text-center text-slate-400">Không có Lead nào đang chờ phân bổ thủ công.</td></tr>`;
    return;
  }

  container.innerHTML = "";
  unassignedLeads.forEach(lead => {
    const tr = document.createElement("tr");
    tr.className = "hover:bg-slate-50 transition";
    tr.innerHTML = `
      <td class="p-4 font-bold text-slate-800">${lead.name}</td>
      <td class="p-4"><span class="bg-slate-100 text-slate-700 text-xs px-2 py-1 rounded">${lead.region}</span></td>
      <td class="p-4"><span class="bg-slate-100 text-slate-700 text-xs px-2 py-1 rounded">${lead.industry}</span></td>
      <td class="p-4 text-slate-500 text-xs">${lead.source}</td>
      <td class="p-4 text-xs font-semibold text-amber-600"><i class="fa-regular fa-clock mr-1"></i>${lead.created}</td>
      <td class="p-4 text-right">
        <button onclick="manualAssign(${lead.id})" class="bg-slate-900 hover:bg-slate-800 text-white text-xs px-3 py-1.5 rounded-lg font-medium shadow-sm transition">
          <i class="fa-solid fa-user-check mr-1"></i> Gán thủ công
        </button>
      </td>
    `;
    container.appendChild(tr);
  });
}

// Render SLA Logs
function renderLogs() {
  const container = document.getElementById("logsList");
  container.innerHTML = "";
  logs.forEach(log => {
    const tr = document.createElement("tr");
    tr.className = "hover:bg-slate-50";
    tr.innerHTML = `
      <td class="p-3 text-slate-400">${log.time}</td>
      <td class="p-3 font-semibold text-slate-800">${log.name}</td>
      <td class="p-3 text-slate-500">${log.attr}</td>
      <td class="p-3 text-indigo-600 font-medium">${log.rule}</td>
      <td class="p-3 font-semibold text-slate-700"><i class="fa-regular fa-user mr-1 text-slate-400"></i>${log.assignee}</td>
      <td class="p-3 text-emerald-600 font-semibold"><i class="fa-solid fa-check mr-1"></i>${log.sla}</td>
    `;
    container.appendChild(tr);
  });
}

// Re-order Rules Priority
function moveRule(index, direction) {
  const newIndex = index + direction;
  if (newIndex < 0 || newIndex >= rules.length) return;
  const temp = rules[index];
  rules[index] = rules[newIndex];
  rules[rules.length === 0 ? 0 : newIndex] = temp;
  renderRules();
  showToast("Đã cập nhật thứ tự ưu tiên quy tắc!");
}

// Toggle Rule Active State
function toggleRule(id) {
  const rule = rules.find(r => r.id === id);
  if (rule) {
    rule.active = !rule.active;
    renderRules();
    showToast(rule.active ? "Đã bật quy tắc" : "Đã tắt quy tắc");
  }
}

// Delete Rule
function deleteRule(id) {
  if (confirm("Bạn có chắc chắn muốn xóa quy tắc phân bổ này?")) {
    rules = rules.filter(r => r.id !== id);
    renderRules();
    showToast("Đã xóa quy tắc!");
  }
}

// Modal Handlers
function openModal(id) {
  document.getElementById(id).classList.remove("hidden");
}

function closeModal(id) {
  document.getElementById(id).classList.add("hidden");
}

// Tab Switching
function switchTab(tabId) {
  document.querySelectorAll(".tab-content").forEach(el => el.classList.add("hidden"));
  document.querySelectorAll(".tab-btn").forEach(el => {
    el.classList.remove("border-indigo-600", "text-indigo-600");
    el.classList.add("border-transparent", "text-slate-500");
  });

  document.getElementById(tabId).classList.remove("hidden");
  const activeBtn = document.getElementById(`btn-${tabId}`);
  activeBtn.classList.remove("border-transparent", "text-slate-500");
  activeBtn.classList.add("border-indigo-600", "text-indigo-600");
}

// Save New Rule
function saveRule(e) {
  e.preventDefault();
  const name = document.getElementById("ruleName").value;
  const region = document.getElementById("ruleRegion").value;
  const industry = document.getElementById("ruleIndustry").value;
  const method = document.getElementById("ruleMethod").value;
  const assignees = document.getElementById("ruleAssignees").value;

  rules.push({
    id: Date.now(),
    name,
    region,
    industry,
    method,
    assignees,
    active: true
  });

  renderRules();
  closeModal("ruleModal");
  document.getElementById("ruleForm").reset();
  showToast("Đã tạo thành công quy tắc phân bổ mới!");
}

// Run Simulation Engine
function runSimulation(e) {
  e.preventDefault();
  const name = document.getElementById("simName").value;
  const region = document.getElementById("simRegion").value;
  const industry = document.getElementById("simIndustry").value;

  // Rule Matching Engine (First Match Wins)
  const matchedRule = rules.find(r => r.active && 
    (r.region === "Tất cả" || r.region === region) && 
    (r.industry === "Tất cả" || r.industry === industry)
  );

  const now = new Date();
  const timeStr = now.toTimeString().split(' ')[0];

  if (matchedRule) {
    // Assigned Automatically
    const assigneesList = matchedRule.assignees.split(",");
    const chosenAssignee = assigneesList[Math.floor(Math.random() * assigneesList.length)].trim();

    logs.unshift({
      time: timeStr,
      name: name,
      attr: `${region} | ${industry}`,
      rule: matchedRule.name,
      assignee: chosenAssignee,
      sla: "0.1 phút (Tự động trong 5m)"
    });

    renderLogs();
    showToast(`Lead đã khớp quy tắc [${matchedRule.name}] và giao cho ${chosenAssignee}!`);
    
    // Increment Assigned Counter
    const assignedKPI = document.getElementById("kpiAutoAssigned");
    assignedKPI.innerText = parseInt(assignedKPI.innerText) + 1;
  } else {
    // Unassigned Queue Fallback
    unassignedLeads.unshift({
      id: Date.now(),
      name: name,
      region: region,
      industry: industry,
      source: "Mô phỏng Simulator",
      created: "Vừa xong"
    });

    renderUnassigned();
    showToast("Không khớp quy tắc nào! Lead đã được chuyển vào Hàng chờ Phân tay.", "warning");
  }

  closeModal("simModal");
}

// Manual Assignment Handler
function manualAssign(id) {
  const assignee = prompt("Nhập tên Nhân viên / Trưởng nhóm nhận Lead:");
  if (assignee) {
    unassignedLeads = unassignedLeads.filter(l => l.id !== id);
    renderUnassigned();
    showToast(`Đã gán Lead cho ${assignee} thành công!`);
  }
}

// Toast Helper
function showToast(message, type = "success") {
  const toast = document.getElementById("toast");
  const toastMsg = document.getElementById("toastMsg");
  const toastIcon = document.getElementById("toastIcon");

  toastMsg.innerText = message;
  if (type === "warning") {
    toastIcon.className = "fa-solid fa-triangle-exclamation text-amber-400 text-lg";
  } else {
    toastIcon.className = "fa-solid fa-circle-check text-emerald-400 text-lg";
  }

  toast.classList.remove("hidden");
  setTimeout(() => {
    toast.classList.add("hidden");
  }, 3500);
}