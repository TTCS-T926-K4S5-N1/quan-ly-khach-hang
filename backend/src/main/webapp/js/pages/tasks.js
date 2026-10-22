"use strict";

let activities =
    loadActivities();


const modal =
    document.getElementById(
        "taskModal"
    );

const overlay =
    document.getElementById(
        "taskOverlay"
    );


document
    .getElementById(
        "newTask"
    )
    .addEventListener(
        "click",
        () => openModal()
    );


document
    .getElementById(
        "closeTaskModal"
    )
    .addEventListener(
        "click",
        closeModal
    );


document
    .getElementById(
        "cancelTask"
    )
    .addEventListener(
        "click",
        closeModal
    );


overlay.addEventListener(
    "click",
    closeModal
);


[
    "taskSearch",
    "taskState",
    "taskPriorityFilter"
]
.forEach(
    id => {

        document
            .getElementById(id)
            .addEventListener(
                id === "taskSearch"
                    ?
                    "input"
                    :
                    "change",
                render
            );

    }
);


document
    .getElementById(
        "taskForm"
    )
    .addEventListener(
        "submit",
        event => {

            event.preventDefault();

            saveTask();

        }
    );


document.addEventListener(
    "click",
    event => {

        const complete =
            event.target.closest(
                "[data-toggle-task]"
            );


        if (complete) {

            const task =
                activities.find(
                    item =>
                        item.id
                        ===
                        complete.dataset.toggleTask
                );


            if (task) {

                task.status =
                    task.status === "done"
                    ?
                    "open"
                    :
                    "done";


                saveActivities();

                render();
            }


            return;
        }


        const edit =
            event.target.closest(
                "[data-edit-task]"
            );


        if (edit) {

            openModal(
                edit.dataset.editTask
            );

        }

    }
);


function saveTask() {

    const title =
        value(
            "taskTitle"
        );


    const error =
        document.getElementById(
            "taskError"
        );


    error.textContent = "";


    if (!title) {

        error.textContent =
            "Vui lòng nhập tiêu đề công việc.";

        return;
    }


    const editingId =
        value(
            "editingTaskId"
        );


    const old =
        activities.find(
            item =>
                item.id
                === editingId
        );


    const record = {

        id:
            editingId
            ||
            "act_"
            +
            Date.now(),

        type: "task",

        title,

        relation:
            value(
                "taskRelation"
            ),

        date:
            value(
                "taskDate"
            ),

        time: "",

        owner:
            value(
                "taskOwner"
            ),

        description:
            value(
                "taskDescription"
            ),

        priority:
            value(
                "taskPriority"
            ),

        reminder: true,

        status:
            old
            ?
            old.status
            :
            "open",

        createdAt:
            old
            ?
            old.createdAt
            :
            new Date()
                .toISOString()
    };


    if (editingId) {

        const index =
            activities.findIndex(
                item =>
                    item.id
                    === editingId
            );


        if (
            index >= 0
        ) {

            activities[index] =
                {
                    ...activities[index],
                    ...record
                };
        }

    } else {

        activities.unshift(
            record
        );
    }


    saveActivities();

    closeModal();

    render();

}


function render() {

    activities =
        loadActivities();


    const query =
        value(
            "taskSearch"
        )
        .toLowerCase();


    const state =
        value(
            "taskState"
        );


    const priority =
        value(
            "taskPriorityFilter"
        );


    const tasks =
        activities
            .filter(
                item =>
                    item.type
                    === "task"
            )
            .filter(
                item => {

                    const text =
                        (
                            item.title
                            +
                            " "
                            +
                            item.relation
                            +
                            " "
                            +
                            item.owner
                        )
                        .toLowerCase();


                    let stateMatch =
                        true;


                    if (
                        state === "open"
                    ) {

                        stateMatch =
                            item.status
                            === "open"
                            &&
                            !isLate(item);

                    }


                    if (
                        state === "done"
                    ) {

                        stateMatch =
                            item.status
                            === "done";

                    }


                    if (
                        state === "late"
                    ) {

                        stateMatch =
                            isLate(item);

                    }


                    return (
                        (
                            !query
                            ||
                            text.includes(
                                query
                            )
                        )
                        &&
                        stateMatch
                        &&
                        (
                            !priority
                            ||
                            (
                                item.priority
                                ||
                                "medium"
                            )
                            === priority
                        )
                    );

                }
            );


    const list =
        document.getElementById(
            "tasksList"
        );


    list.innerHTML = "";


    document
        .getElementById(
            "tasksEmpty"
        )
        .style
        .display =
            tasks.length
            ?
            "none"
            :
            "flex";


    for (
        const task
        of tasks
    ) {

        const priorityValue =
            task.priority
            ||
            "medium";


        const row =
            document.createElement(
                "article"
            );


        row.className =
            "task-row"
            +
            (
                task.status
                === "done"
                ?
                " done"
                :
                ""
            );


        row.innerHTML = `
            <button
                class="task-check"
                type="button"
                data-toggle-task="${task.id}"
                title="Hoàn thành"
            >
                ${
                    task.status === "done"
                    ?
                    "✓"
                    :
                    ""
                }
            </button>

            <div class="task-main">

                <strong>
                    ${escapeHtml(task.title)}
                </strong>

                <span>
                    ${escapeHtml(task.relation || "Không liên kết")}
                </span>

            </div>

            <span class="priority ${priorityValue}">
                ${priorityLabel(priorityValue)}
            </span>

            <span class="
                task-date
                ${isLate(task) ? "late" : ""}
            ">
                ${escapeHtml(task.date || "Chưa có hạn")}
            </span>

            <span class="task-owner">
                ${escapeHtml(task.owner || "Chưa phân công")}
            </span>

            <div class="task-actions">

                <button
                    type="button"
                    data-edit-task="${task.id}"
                >
                    Sửa
                </button>

            </div>
        `;


        list.appendChild(
            row
        );

    }

}


function openModal(
    id = null
) {

    document
        .getElementById(
            "taskForm"
        )
        .reset();


    setValue(
        "editingTaskId",
        ""
    );


    setValue(
        "taskPriority",
        "medium"
    );


    document
        .getElementById(
            "taskError"
        )
        .textContent = "";


    document
        .getElementById(
            "taskModalTitle"
        )
        .textContent =
            "Tạo công việc";


    if (id) {

        const task =
            activities.find(
                item =>
                    item.id
                    === id
            );


        if (task) {

            setValue(
                "editingTaskId",
                task.id
            );

            setValue(
                "taskTitle",
                task.title
            );

            setValue(
                "taskRelation",
                task.relation
            );

            setValue(
                "taskDate",
                task.date
            );

            setValue(
                "taskPriority",
                task.priority
                ||
                "medium"
            );

            setValue(
                "taskOwner",
                task.owner
            );

            setValue(
                "taskDescription",
                task.description
            );


            document
                .getElementById(
                    "taskModalTitle"
                )
                .textContent =
                    "Sửa công việc";

        }

    }


    modal.classList.add(
        "open"
    );

    overlay.classList.add(
        "open"
    );

}


function closeModal() {

    modal.classList.remove(
        "open"
    );

    overlay.classList.remove(
        "open"
    );

}


function isLate(task) {

    return (
        task.status
        !== "done"
        &&
        task.date
        &&
        task.date
        <
        todayString()
    );

}


function priorityLabel(value) {

    switch (value) {

        case "high":
            return "Cao";

        case "low":
            return "Thấp";

        default:
            return "Trung bình";
    }

}


function loadActivities() {
    try {
        const stored = JSON.parse(localStorage.getItem("crm_ui_activities"));
        if (Array.isArray(stored) && stored.length > 0) {
            return stored;
        }
    } catch (_) {}

    const defaultTasks = [
        {
            id: "act-104",
            type: "task",
            title: "Dự toán chi phí triển khai hệ thống Foxconn",
            relation: "Tập đoàn Công nghiệp Foxconn VN",
            date: "2026-10-20",
            time: "16:00",
            owner: "Bùi Đức Thành",
            priority: "high",
            status: "done",
            description: "Tính toán số lượng server và license database cho 3 nhà máy tại KCN Đình Trám và Quế Võ."
        },
        {
            id: "act-108",
            type: "task",
            title: "Hoàn thiện bản dự thảo hợp đồng VPBank",
            relation: "Ngân hàng TMCP VPBank - CN Thăng Long",
            date: "2026-10-21",
            time: "17:00",
            owner: "Võ Minh Thư",
            priority: "high",
            status: "open",
            description: "Kiểm tra các điều khoản bảo mật SLA và trách nhiệm bảo hành nâng cấp định kỳ 3 năm."
        },
        {
            id: "act-112",
            type: "task",
            title: "Gửi tài liệu giải pháp bảo mật cho khách hàng Foxconn",
            relation: "Tập đoàn Công nghiệp Foxconn VN",
            date: "2026-10-22",
            time: "16:30",
            owner: "Bùi Đức Thành",
            priority: "medium",
            status: "open",
            description: "Đóng gói bộ slide Security Whitepaper và chứng chỉ ISO/IEC 27001 gửi qua email."
        },
        {
            id: "act-114",
            type: "task",
            title: "Tổng hợp báo cáo tuần của Khối Kinh doanh",
            relation: "Nội bộ Khối Kinh doanh",
            date: "2026-10-23",
            time: "11:00",
            owner: "Trần Thị Thu Hà",
            priority: "medium",
            status: "open",
            description: "Tổng kết doanh số đạt được trong tuần, các cơ hội mới vào phễu và tỷ lệ Win/Loss."
        },
        {
            id: "act-117",
            type: "task",
            title: "Đánh giá Win/Loss các cơ hội đóng trong tuần",
            relation: "Nội bộ CRM",
            date: "2026-10-24",
            time: "15:00",
            owner: "Trần Thị Thu Hà",
            priority: "medium",
            status: "open",
            description: "Phân tích nguyên nhân thua thầu tại dự án Logistics Hải Phòng để cải tiến quy trình báo giá."
        },
        {
            id: "act-120",
            type: "task",
            title: "Hạn nộp mục tiêu doanh số tháng 11/2026",
            relation: "Toàn bộ thành viên Khối Kinh doanh",
            date: "2026-10-30",
            time: "17:00",
            owner: "Trần Thị Thu Hà",
            priority: "high",
            status: "open",
            description: "Mỗi chuyên viên kinh doanh nộp bản kế hoạch hành động và mục tiêu số lượng cuộc gặp tháng 11."
        }
    ];

    try {
        localStorage.setItem("crm_ui_activities", JSON.stringify(defaultTasks));
    } catch (_) {}

    return defaultTasks;
}


function saveActivities() {

    localStorage.setItem(
        "crm_ui_activities",
        JSON.stringify(
            activities
        )
    );

}


function todayString() {

    const d =
        new Date();


    return (
        d.getFullYear()
        +
        "-"
        +
        String(
            d.getMonth() + 1
        ).padStart(2,"0")
        +
        "-"
        +
        String(
            d.getDate()
        ).padStart(2,"0")
    );

}


function value(id) {

    return document
        .getElementById(id)
        .value
        .trim();

}


function setValue(
    id,
    value
) {

    document
        .getElementById(id)
        .value =
            value ?? "";

}


function escapeHtml(value) {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
}

render();

(async function syncBackendActivities() {
    try {
        const API_ROOT = window.location.pathname.startsWith("/crm") ? "/crm" : "http://localhost:8080/crm";
        const res = await fetch(API_ROOT + "/api/activities", { credentials: "include" });
        const json = await res.json();
        if (json?.success && Array.isArray(json.data)) {
            activities = json.data.map(item => {
                let d = "";
                let t = "";
                if (item.dueDate) {
                    const dt = new Date(item.dueDate);
                    if (!isNaN(dt.getTime())) {
                        d = dt.toISOString().split("T")[0];
                        t = dt.toTimeString().slice(0, 5);
                    }
                }
                return {
                    id: item.id,
                    type: (item.type || "task").toLowerCase(),
                    title: item.subject || item.title || "Công việc",
                    relation: item.customerName || item.opportunityName || item.relation || "",
                    date: d,
                    time: t,
                    owner: item.ownerName || "Tôi",
                    description: item.description || "",
                    status: (item.status || "OPEN").toUpperCase() === "COMPLETED" ? "done" : "open"
                };
            });
            saveActivities();
            render();
        }
    } catch (_) {}
})();