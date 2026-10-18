package com.crm.controller.activities;

import com.crm.dto.common.ApiResponse;
import com.crm.service.activities.ActivityService;
import com.crm.util.JsonUtil;
import com.crm.util.ResponseUtil;

import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;

import java.io.IOException;
import java.sql.Timestamp;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Map;
import java.util.NoSuchElementException;

@WebServlet({
        "/api/activities",
        "/api/activities/*"
})
public class ActivityServlet extends HttpServlet {

    private final ActivityService activityService = new ActivityService();

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        try {
            long currentUserId = requireUser(req);
            String path = req.getPathInfo();

            if ("/assignable-users".equals(path)) {
                var users = activityService.getAssignableUsers(currentUserId);
                ResponseUtil.json(resp, 200, ApiResponse.success("Lấy danh sách nhân sự giao việc thành công", users));
                return;
            }

            if ("/reminders".equals(path)) {
                int windowMinutes = intParam(req, "windowMinutes", 60);
                int limit = intParam(req, "limit", 20);
                var upcoming = activityService.getUpcomingTasks(currentUserId, windowMinutes, limit);
                ResponseUtil.json(resp, 200, ApiResponse.success("Lấy danh sách nhắc việc sắp đến hạn thành công", upcoming));
                return;
            }

            if ("/overdue".equals(path)) {
                Long teamId = longParam(req, "teamId");
                int limit = intParam(req, "limit", 20);
                var overdue = activityService.getOverdueTasks(currentUserId, teamId, limit);
                ResponseUtil.json(resp, 200, ApiResponse.success("Lấy danh sách công việc quá hạn thành công", overdue));
                return;
            }

            if ("/team-overdue-summary".equals(path)) {
                Long teamId = longParam(req, "teamId");
                var summary = activityService.getTeamOverdueSummary(currentUserId, teamId);
                ResponseUtil.json(resp, 200, ApiResponse.success("Lấy tổng hợp công việc quá hạn theo thành viên thành công", summary));
                return;
            }

            if ("/team-stats".equals(path)) {
                Timestamp fromDate = parseTimestamp(req.getParameter("fromDate"));
                Timestamp toDate = parseTimestamp(req.getParameter("toDate"));
                Long teamId = longParam(req, "teamId");
                String type = req.getParameter("type");
                Long memberUserId = longParam(req, "memberUserId");

                var stats = activityService.getTeamActivityStats(currentUserId, fromDate, toDate, teamId, type, memberUserId);
                ResponseUtil.json(resp, 200, ApiResponse.success("Lấy thống kê hoạt động theo thành viên thành công", stats));
                return;
            }

            if (path == null || path.equals("/")) {
                Long customerId = longParam(req, "customerId");
                Long contactId = longParam(req, "contactId");
                Long opportunityId = longParam(req, "opportunityId");
                String type = req.getParameter("type");
                String status = req.getParameter("status");
                String priority = req.getParameter("priority");
                Long ownerUserId = longParam(req, "ownerUserId");
                Boolean includeTeam = "true".equalsIgnoreCase(req.getParameter("includeTeam"));

                Timestamp fromDate = parseTimestamp(req.getParameter("fromDate"));
                Timestamp toDate = parseTimestamp(req.getParameter("toDate"));

                var items = activityService.search(
                        currentUserId, customerId, contactId, opportunityId,
                        type, status, priority, ownerUserId, fromDate, toDate, includeTeam
                );
                ResponseUtil.json(resp, 200, ApiResponse.success("Lấy danh sách hoạt động thành công", items));
                return;
            }

            long id = parseId(path);
            var item = activityService.getById(currentUserId, id);
            if (item == null) {
                ResponseUtil.json(resp, 404, ApiResponse.error("Không tìm thấy hoạt động", null));
                return;
            }

            ResponseUtil.json(resp, 200, ApiResponse.success("Lấy thông tin hoạt động thành công", item));
        } catch (SecurityException e) {
            ResponseUtil.json(resp, 403, ApiResponse.error(e.getMessage(), null));
        } catch (IllegalArgumentException e) {
            ResponseUtil.json(resp, 400, ApiResponse.error(e.getMessage(), null));
        } catch (Exception e) {
            ResponseUtil.json(resp, 500, ApiResponse.error("Lỗi máy chủ: " + e.getMessage(), null));
        }
    }

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        req.setCharacterEncoding("UTF-8");
        try {
            long currentUserId = requireUser(req);
            String path = req.getPathInfo();

            // Action: /api/activities/{id}/complete
            if (path != null && path.endsWith("/complete")) {
                long id = parseId(path.replace("/complete", ""));
                var completed = activityService.complete(currentUserId, id);
                ResponseUtil.json(resp, 200, ApiResponse.success("Đã hoàn thành công việc", completed));
                return;
            }

            // Action: /api/activities/{id}/postpone
            if (path != null && path.endsWith("/postpone")) {
                long id = parseId(path.replace("/postpone", ""));
                Map<String, Object> body = JsonUtil.getGson().fromJson(req.getReader(), com.crm.util.JsonUtil.OBJECT_MAP_TYPE);
                String reason = body != null && body.get("postponeReason") != null ? String.valueOf(body.get("postponeReason")).trim() : "";
                if (reason.isBlank() && body != null && body.get("reason") != null) {
                    reason = String.valueOf(body.get("reason")).trim();
                }
                if (reason.isBlank()) {
                    throw new IllegalArgumentException("Vui lòng nhập lý do hoãn công việc.");
                }

                String newDueDateStr = body != null ? (String) body.get("newDueDate") : null;
                if (newDueDateStr == null && body != null) newDueDateStr = (String) body.get("dueDate");
                Timestamp newDue = parseTimestamp(newDueDateStr);

                var postponed = activityService.postpone(currentUserId, id, reason, newDue);
                ResponseUtil.json(resp, 200, ApiResponse.success("Đã cập nhật trạng thái hoãn công việc", postponed));
                return;
            }

            // Action: /api/activities/quick-call
            if ("/quick-call".equals(path)) {
                Map<String, Object> body = JsonUtil.getGson().fromJson(req.getReader(), com.crm.util.JsonUtil.OBJECT_MAP_TYPE);
                if (body == null) {
                    throw new IllegalArgumentException("Thiếu dữ liệu body");
                }
                Long customerId = parseLongSafe(body.get("customerId"));
                if (customerId == null || customerId <= 0) {
                    throw new IllegalArgumentException("Vui lòng chọn khách hàng để ghi nhận cuộc gọi.");
                }
                Long contactId = parseLongSafe(body.get("contactId"));
                String outcome = body.get("outcome") != null ? String.valueOf(body.get("outcome")).trim() : "Nghe máy - Quan tâm";
                String notes = body.get("notes") != null ? String.valueOf(body.get("notes")).trim() : "";

                String callbackAtStr = body.get("callbackAt") != null ? String.valueOf(body.get("callbackAt")) : null;
                Timestamp callbackAt = parseTimestamp(callbackAtStr);

                var quickResult = activityService.quickLogCall(currentUserId, customerId, contactId, outcome, notes, callbackAt);
                ResponseUtil.json(resp, 201, ApiResponse.success("Đã ghi nhanh kết quả cuộc gọi thành công", quickResult));
                return;
            }

            Map<String, Object> body = JsonUtil.getGson().fromJson(req.getReader(), com.crm.util.JsonUtil.OBJECT_MAP_TYPE);
            if (body == null) {
                throw new IllegalArgumentException("Thiếu dữ liệu body");
            }

            String subject = (String) body.get("subject");
            if (subject == null || subject.isBlank()) {
                subject = (String) body.get("title");
            }
            if (subject == null || subject.isBlank()) {
                throw new IllegalArgumentException("Tiêu đề hoạt động/công việc là bắt buộc.");
            }

            String type = body.get("type") != null ? ((String) body.get("type")).toUpperCase() : "TASK";
            String description = (String) body.get("description");
            String outcome = (String) body.get("outcome");
            String status = body.get("status") != null ? (String) body.get("status") : ("TASK".equalsIgnoreCase(type) ? "OPEN" : "COMPLETED");
            String priority = body.get("priority") != null ? (String) body.get("priority") : "MEDIUM";

            // Support past or future dueDate / activityTime
            String dueDateStr = (String) body.get("dueDate");
            if (dueDateStr == null || dueDateStr.isBlank()) {
                dueDateStr = (String) body.get("activityTime");
            }
            if (dueDateStr == null || dueDateStr.isBlank()) {
                dueDateStr = (String) body.get("date");
            }
            Timestamp dueDate = parseTimestamp(dueDateStr);
            if (dueDate == null) {
                dueDate = new Timestamp(System.currentTimeMillis());
            }

            int durationMinutes = 0;
            if (body.get("durationMinutes") instanceof Number) {
                durationMinutes = ((Number) body.get("durationMinutes")).intValue();
            } else if (body.get("duration") instanceof Number) {
                durationMinutes = ((Number) body.get("duration")).intValue();
            } else if (body.get("durationMinutes") != null) {
                try { durationMinutes = Integer.parseInt(String.valueOf(body.get("durationMinutes"))); } catch (Exception ignored) {}
            }

            Long customerId = body.get("customerId") != null ? ((Number) body.get("customerId")).longValue() : null;
            Long contactId = body.get("contactId") != null ? ((Number) body.get("contactId")).longValue() : null;
            Long opportunityId = body.get("opportunityId") != null ? ((Number) body.get("opportunityId")).longValue() : null;
            Long assigneeUserId = body.get("assigneeUserId") != null ? ((Number) body.get("assigneeUserId")).longValue() : null;
            if (assigneeUserId == null && body.get("ownerUserId") != null) {
                assigneeUserId = ((Number) body.get("ownerUserId")).longValue();
            }

            var created = activityService.create(
                    currentUserId, subject, type, description, outcome, status, priority,
                    dueDate, durationMinutes, customerId, contactId, opportunityId, assigneeUserId
            );
            ResponseUtil.json(resp, 201, ApiResponse.success("Tạo hoạt động/công việc thành công", created));
        } catch (SecurityException e) {
            ResponseUtil.json(resp, 403, ApiResponse.error(e.getMessage(), null));
        } catch (IllegalArgumentException e) {
            ResponseUtil.json(resp, 400, ApiResponse.error(e.getMessage(), null));
        } catch (Exception e) {
            ResponseUtil.json(resp, 500, ApiResponse.error("Lỗi máy chủ: " + e.getMessage(), null));
        }
    }

    @Override
    protected void doPut(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        req.setCharacterEncoding("UTF-8");
        try {
            long currentUserId = requireUser(req);
            long id = parseId(req.getPathInfo());
            Map<String, Object> body = JsonUtil.getGson().fromJson(req.getReader(), com.crm.util.JsonUtil.OBJECT_MAP_TYPE);

            String subject = (String) body.get("subject");
            if (subject == null || subject.isBlank()) {
                subject = (String) body.get("title");
            }
            String type = body.get("type") != null ? ((String) body.get("type")).toUpperCase() : "TASK";
            String description = (String) body.get("description");
            String outcome = (String) body.get("outcome");
            String status = (String) body.get("status");
            String priority = (String) body.get("priority");
            String postponeReason = (String) body.get("postponeReason");

            String dueDateStr = (String) body.get("dueDate");
            if (dueDateStr == null || dueDateStr.isBlank()) {
                dueDateStr = (String) body.get("activityTime");
            }
            if (dueDateStr == null || dueDateStr.isBlank()) {
                dueDateStr = (String) body.get("date");
            }
            Timestamp dueDate = parseTimestamp(dueDateStr);

            int durationMinutes = 0;
            if (body.get("durationMinutes") instanceof Number) {
                durationMinutes = ((Number) body.get("durationMinutes")).intValue();
            } else if (body.get("durationMinutes") != null) {
                try { durationMinutes = Integer.parseInt(String.valueOf(body.get("durationMinutes"))); } catch (Exception ignored) {}
            }

            Long contactId = body.get("contactId") != null ? ((Number) body.get("contactId")).longValue() : null;
            Long assigneeUserId = body.get("assigneeUserId") != null ? ((Number) body.get("assigneeUserId")).longValue() : null;
            if (assigneeUserId == null && body.get("ownerUserId") != null) {
                assigneeUserId = ((Number) body.get("ownerUserId")).longValue();
            }

            var updated = activityService.update(
                    currentUserId, id, subject, type, description, outcome, status, priority,
                    dueDate, durationMinutes, contactId, assigneeUserId, postponeReason
            );
            if (updated == null) {
                ResponseUtil.json(resp, 404, ApiResponse.error("Không tìm thấy hoạt động", null));
                return;
            }

            ResponseUtil.json(resp, 200, ApiResponse.success("Cập nhật hoạt động thành công", updated));
        } catch (SecurityException e) {
            ResponseUtil.json(resp, 403, ApiResponse.error(e.getMessage(), null));
        } catch (IllegalArgumentException e) {
            ResponseUtil.json(resp, 400, ApiResponse.error(e.getMessage(), null));
        } catch (Exception e) {
            ResponseUtil.json(resp, 500, ApiResponse.error("Lỗi máy chủ: " + e.getMessage(), null));
        }
    }

    @Override
    protected void doDelete(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        try {
            long currentUserId = requireUser(req);
            long id = parseId(req.getPathInfo());
            activityService.delete(currentUserId, id);
            ResponseUtil.json(resp, 200, ApiResponse.success("Xóa hoạt động thành công", null));
        } catch (SecurityException e) {
            ResponseUtil.json(resp, 403, ApiResponse.error(e.getMessage(), null));
        } catch (NoSuchElementException e) {
            ResponseUtil.json(resp, 404, ApiResponse.error(e.getMessage(), null));
        } catch (IllegalArgumentException e) {
            ResponseUtil.json(resp, 400, ApiResponse.error(e.getMessage(), null));
        } catch (Exception e) {
            ResponseUtil.json(resp, 500, ApiResponse.error("Lỗi máy chủ: " + e.getMessage(), null));
        }
    }

    private Long longParam(HttpServletRequest req, String name) {
        String val = req.getParameter(name);
        if (val == null || val.isBlank()) return null;
        try {
            return Long.parseLong(val.trim());
        } catch (NumberFormatException e) {
            return null;
        }
    }

    private int intParam(HttpServletRequest req, String name, int defaultVal) {
        String val = req.getParameter(name);
        if (val == null || val.isBlank()) return defaultVal;
        try {
            return Integer.parseInt(val.trim());
        } catch (NumberFormatException e) {
            return defaultVal;
        }
    }

    private long parseId(String path) {
        if (path == null || path.equals("/")) throw new IllegalArgumentException("Thiếu ID");
        String clean = path.startsWith("/") ? path.substring(1) : path;
        int slash = clean.indexOf('/');
        if (slash > 0) clean = clean.substring(0, slash);
        return Long.parseLong(clean);
    }

    private Timestamp parseTimestamp(String str) {
        if (str == null || str.isBlank()) return null;
        String val = str.trim();
        try {
            if (val.length() == 10) { // YYYY-MM-DD
                LocalDate ld = LocalDate.parse(val);
                return Timestamp.valueOf(ld.atStartOfDay());
            }
            if (val.length() == 16) { // YYYY-MM-DDTHH:mm or YYYY-MM-DD HH:mm
                val = val.replace("T", " ") + ":00";
            } else if (val.contains("T")) {
                val = val.replace("T", " ");
                if (val.endsWith("Z")) val = val.substring(0, val.length() - 1);
                if (val.contains(".")) val = val.substring(0, val.indexOf('.'));
            }
            return Timestamp.valueOf(val);
        } catch (Exception e) {
            try {
                return new Timestamp(java.time.Instant.parse(str).toEpochMilli());
            } catch (Exception ignored) {
                return null;
            }
        }
    }

    private Long parseLongSafe(Object val) {
        if (val == null) return null;
        if (val instanceof Number n) return n.longValue();
        String str = String.valueOf(val).trim();
        if (str.isBlank()) return null;
        try {
            return (long) Double.parseDouble(str);
        } catch (Exception e) {
            return null;
        }
    }

    private long requireUser(HttpServletRequest req) {
        HttpSession session = req.getSession(false);
        if (session == null || session.getAttribute("userId") == null) {
            throw new SecurityException("Phiên đăng nhập không hợp lệ hoặc đã hết hạn.");
        }
        return (Long) session.getAttribute("userId");
    }
}
