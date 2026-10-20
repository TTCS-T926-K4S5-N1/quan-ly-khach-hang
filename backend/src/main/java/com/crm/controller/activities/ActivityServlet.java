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
import java.util.Map;
import java.util.NoSuchElementException;

@WebServlet({
        "/api/activities",
        "/api/activities/*"
})
public class ActivityServlet extends HttpServlet {

    private final ActivityService activityService;

    public ActivityServlet() {
        this(new ActivityService());
    }

    public ActivityServlet(ActivityService activityService) {
        this.activityService = activityService;
    }

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        try {
            long currentUserId = requireUser(req);
            String path = req.getPathInfo();

            if (path == null || path.equals("/")) {
                String summaryParam = req.getParameter("summary");
                boolean isSummary = "true".equalsIgnoreCase(summaryParam) || "1".equals(summaryParam) || "summary".equalsIgnoreCase(req.getParameter("view"));

                Long customerId = longParam(req, "customerId");
                Long opportunityId = longParam(req, "opportunityId");
                Long ownerId = longParam(req, "ownerId");
                if (ownerId == null) ownerId = longParam(req, "userId");
                if (ownerId == null) ownerId = longParam(req, "memberId");

                String type = req.getParameter("type");
                String status = req.getParameter("status");
                String keyword = req.getParameter("keyword");
                if (keyword == null) keyword = req.getParameter("search");

                Timestamp fromDate = parseDateParam(req, "fromDate", "startDate", false);
                Timestamp toDate = parseDateParam(req, "toDate", "endDate", true);

                if (isSummary) {
                    var summary = activityService.getMemberSummary(currentUserId, ownerId, type, status, fromDate, toDate, customerId, opportunityId);
                    ResponseUtil.json(resp, 200, ApiResponse.success("Lấy tổng số hoạt động theo từng thành viên thành công", summary));
                    return;
                }

                var items = activityService.search(currentUserId, customerId, opportunityId, type, status, ownerId, fromDate, toDate, keyword);
                ResponseUtil.json(resp, 200, ApiResponse.success("Lấy danh sách hoạt động thành công", items));
                return;
            }

            if ("/members".equals(path) || "/members/".equals(path)) {
                var members = activityService.getAccessibleMembers(currentUserId);
                ResponseUtil.json(resp, 200, ApiResponse.success("Lấy danh sách thành viên thành công", members));
                return;
            }

            if ("/summary-by-member".equals(path) || "/summary-by-member/".equals(path)
                    || "/member-summary".equals(path) || "/member-summary/".equals(path)
                    || "/stats".equals(path) || "/stats/".equals(path)) {
                Long customerId = longParam(req, "customerId");
                Long opportunityId = longParam(req, "opportunityId");
                Long ownerId = longParam(req, "ownerId");
                if (ownerId == null) ownerId = longParam(req, "userId");
                if (ownerId == null) ownerId = longParam(req, "memberId");

                String type = req.getParameter("type");
                String status = req.getParameter("status");
                Timestamp fromDate = parseDateParam(req, "fromDate", "startDate", false);
                Timestamp toDate = parseDateParam(req, "toDate", "endDate", true);

                var summary = activityService.getMemberSummary(currentUserId, ownerId, type, status, fromDate, toDate, customerId, opportunityId);
                ResponseUtil.json(resp, 200, ApiResponse.success("Lấy tổng số hoạt động theo từng thành viên thành công", summary));
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
            ResponseUtil.json(resp, 500, ApiResponse.error("Lỗi máy chủ", null));
        }
    }

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        try {
            long currentUserId = requireUser(req);
            Map<String, Object> body = JsonUtil.getGson().fromJson(req.getReader(), com.crm.util.JsonUtil.OBJECT_MAP_TYPE);
            if (body == null) {
                throw new IllegalArgumentException("Thiếu dữ liệu body");
            }

            String subject = (String) body.get("subject");
            String type = (String) body.get("type");
            String description = (String) body.get("description");
            String status = (String) body.get("status");
            String dueDateStr = (String) body.get("dueDate");
            Timestamp dueDate = parseTimestamp(dueDateStr);

            Long customerId = body.get("customerId") != null ? ((Number) body.get("customerId")).longValue() : null;
            Long opportunityId = body.get("opportunityId") != null ? ((Number) body.get("opportunityId")).longValue() : null;
            Long ownerId = body.get("ownerId") != null ? ((Number) body.get("ownerId")).longValue() : null;

            var created = activityService.create(currentUserId, subject, type, description, status, dueDate, customerId, opportunityId, ownerId);
            ResponseUtil.json(resp, 201, ApiResponse.success("Tạo hoạt động thành công", created));
        } catch (SecurityException e) {
            ResponseUtil.json(resp, 403, ApiResponse.error(e.getMessage(), null));
        } catch (IllegalArgumentException e) {
            ResponseUtil.json(resp, 400, ApiResponse.error(e.getMessage(), null));
        } catch (Exception e) {
            ResponseUtil.json(resp, 500, ApiResponse.error("Lỗi máy chủ", null));
        }
    }

    @Override
    protected void doPut(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        try {
            long currentUserId = requireUser(req);
            long id = parseId(req.getPathInfo());
            Map<String, Object> body = JsonUtil.getGson().fromJson(req.getReader(), com.crm.util.JsonUtil.OBJECT_MAP_TYPE);

            String subject = (String) body.get("subject");
            String type = (String) body.get("type");
            String description = (String) body.get("description");
            String status = (String) body.get("status");
            String dueDateStr = (String) body.get("dueDate");
            Timestamp dueDate = parseTimestamp(dueDateStr);

            var updated = activityService.update(currentUserId, id, subject, type, description, status, dueDate);
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
            ResponseUtil.json(resp, 500, ApiResponse.error("Lỗi máy chủ", null));
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
            ResponseUtil.json(resp, 500, ApiResponse.error("Lỗi máy chủ", null));
        }
    }

    private long requireUser(HttpServletRequest req) {
        HttpSession session = req.getSession(false);
        if (session == null || session.getAttribute("userId") == null) {
            throw new SecurityException("Phiên đăng nhập không hợp lệ hoặc đã hết hạn.");
        }
        return (Long) session.getAttribute("userId");
    }

    private long parseId(String pathInfo) {
        if (pathInfo == null || pathInfo.equals("/")) {
            throw new IllegalArgumentException("Thiếu activity id");
        }
        String clean = pathInfo.startsWith("/") ? pathInfo.substring(1) : pathInfo;
        int slash = clean.indexOf('/');
        String idStr = slash >= 0 ? clean.substring(0, slash) : clean;
        return Long.parseLong(idStr);
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

    private Timestamp parseTimestamp(String str) {
        if (str == null || str.isBlank()) return null;
        str = str.trim().replace('T', ' ');
        if (str.length() == 10) {
            str = str + " 00:00:00";
        } else if (str.length() == 16) {
            str = str + ":00";
        }
        try {
            return Timestamp.valueOf(str);
        } catch (Exception e) {
            return null;
        }
    }

    private Timestamp parseDateParam(HttpServletRequest req, String param1, String param2, boolean endOfDay) {
        String val = req.getParameter(param1);
        if (val == null || val.isBlank()) {
            val = req.getParameter(param2);
        }
        if (val == null || val.isBlank()) return null;
        val = val.trim().replace('T', ' ');
        if (val.length() == 10) {
            val = val + (endOfDay ? " 23:59:59" : " 00:00:00");
        } else if (val.length() == 16) {
            val = val + (endOfDay ? ":59" : ":00");
        }
        try {
            return Timestamp.valueOf(val);
        } catch (Exception e) {
            return null;
        }
    }
}
