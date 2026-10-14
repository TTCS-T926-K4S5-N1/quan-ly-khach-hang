package com.crm.controller.routing;

import com.crm.dto.common.ApiResponse;
import com.crm.dto.routing.LeadAssignmentRuleDTO;
import com.crm.dto.routing.LeadScoringRuleDTO;
import com.crm.dto.routing.ScoreThresholdDTO;
import com.crm.service.routing.LeadAssignmentService;
import com.crm.service.routing.LeadScoringService;
import com.crm.util.JsonUtil;
import com.crm.util.ResponseUtil;
import com.google.gson.reflect.TypeToken;

import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;

import java.io.IOException;
import java.lang.reflect.Type;
import java.nio.charset.Charset;
import java.nio.charset.StandardCharsets;
import java.util.*;

@WebServlet({
        "/api/lead-routing",
        "/api/lead-routing/*"
})
public class LeadRoutingServlet extends HttpServlet {

    private final LeadScoringService scoringService = new LeadScoringService();
    private final LeadAssignmentService assignmentService = new LeadAssignmentService();

    private static String readRequestBody(HttpServletRequest req) throws IOException {
        byte[] bytes = req.getInputStream().readAllBytes();
        if (bytes == null || bytes.length == 0) return "";
        String encoding = req.getCharacterEncoding();
        if (encoding != null && !encoding.isBlank()) {
            try {
                return new String(bytes, Charset.forName(encoding));
            } catch (Exception ignored) {}
        }
        return new String(bytes, StandardCharsets.UTF_8);
    }

    private long requireUser(HttpServletRequest req) {
        HttpSession session = req.getSession(false);
        if (session == null || session.getAttribute("userId") == null) {
            throw new SecurityException("Chưa đăng nhập");
        }
        Object id = session.getAttribute("userId");
        if (id instanceof Number num) return num.longValue();
        return Long.parseLong(String.valueOf(id));
    }

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        resp.setHeader("Cache-Control", "no-store");
        try {
            requireUser(req);
            String path = req.getPathInfo();
            if (path == null) path = "";

            // 1. Thống kê tổng quan Phân bổ & Chấm điểm
            if (path.equals("/overview")) {
                var rules = assignmentService.getAllRules();
                var unassigned = assignmentService.getUnassignedLeads();
                var thresholds = scoringService.getThresholds();
                var criteria = scoringService.getAllRules();

                long hotCount = unassigned.stream().filter(u -> "HOT".equalsIgnoreCase(u.getScoreGrade())).count();
                long warmCount = unassigned.stream().filter(u -> "WARM".equalsIgnoreCase(u.getScoreGrade())).count();
                long coldCount = unassigned.stream().filter(u -> "COLD".equalsIgnoreCase(u.getScoreGrade())).count();

                Map<String, Object> stats = new LinkedHashMap<>();
                stats.put("totalRules", rules.size());
                stats.put("activeRules", rules.stream().filter(LeadAssignmentRuleDTO::isActive).count());
                stats.put("unassignedCount", unassigned.size());
                stats.put("hotUnassigned", hotCount);
                stats.put("warmUnassigned", warmCount);
                stats.put("coldUnassigned", coldCount);
                stats.put("totalCriteria", criteria.size());

                ResponseUtil.json(resp, 200, ApiResponse.success("Lấy thống kê thành công", stats));
                return;
            }

            // 2. Tiêu chí chấm điểm (Scoring Rules)
            if (path.equals("/scoring/rules")) {
                var list = scoringService.getAllRules();
                ResponseUtil.json(resp, 200, ApiResponse.success("Lấy danh sách tiêu chí chấm điểm thành công", list));
                return;
            }

            // 3. Ngưỡng phân hạng Nóng, Ấm, Lạnh (Thresholds)
            if (path.equals("/scoring/thresholds")) {
                var list = scoringService.getThresholds();
                ResponseUtil.json(resp, 200, ApiResponse.success("Lấy danh sách ngưỡng điểm thành công", list));
                return;
            }

            // 4. Quy tắc phân bổ tự động (Assignment Rules)
            if (path.equals("/assignment/rules")) {
                var list = assignmentService.getAllRules();
                ResponseUtil.json(resp, 200, ApiResponse.success("Lấy danh sách quy tắc phân bổ thành công", list));
                return;
            }

            // 5. Hàng chờ Lead chưa phân bổ (Unassigned Leads Queue)
            if (path.equals("/assignment/unassigned")) {
                var list = assignmentService.getUnassignedLeads();
                ResponseUtil.json(resp, 200, ApiResponse.success("Lấy danh sách hàng chờ phân bổ thành công", list));
                return;
            }

            // 6. Nhật ký phân bổ Lead (Audit Logs)
            if (path.equals("/assignment/logs")) {
                int limit = 50;
                String limitParam = req.getParameter("limit");
                if (limitParam != null && !limitParam.isBlank()) {
                    try { limit = Integer.parseInt(limitParam); } catch (Exception ignored) {}
                }
                var list = assignmentService.getAssignmentLogs(limit);
                ResponseUtil.json(resp, 200, ApiResponse.success("Lấy nhật ký phân bổ thành công", list));
                return;
            }

            ResponseUtil.json(resp, 404, ApiResponse.error("Đường dẫn không tồn tại", null));
        } catch (SecurityException e) {
            ResponseUtil.json(resp, 401, ApiResponse.error(e.getMessage(), null));
        } catch (Exception e) {
            ResponseUtil.json(resp, 500, ApiResponse.error("Lỗi: " + e.getMessage(), null));
        }
    }

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        req.setCharacterEncoding("UTF-8");
        resp.setHeader("Cache-Control", "no-store");
        try {
            long userId = requireUser(req);
            String path = req.getPathInfo();
            if (path == null) path = "";

            // 1. Thêm mới tiêu chí chấm điểm
            if (path.equals("/scoring/rules")) {
                LeadScoringRuleDTO body = JsonUtil.getGson().fromJson(readRequestBody(req), LeadScoringRuleDTO.class);
                if (body == null) {
                    ResponseUtil.json(resp, 400, ApiResponse.error("Dữ liệu không hợp lệ", null));
                    return;
                }
                long id = scoringService.saveRule(body);
                body.setId(id);
                ResponseUtil.json(resp, 201, ApiResponse.success("Tạo tiêu chí chấm điểm thành công", body));
                return;
            }

            // 2. Chạy lại tính điểm toàn bộ Lead trong hệ thống
            if (path.equals("/scoring/recalculate")) {
                int count = scoringService.recalculateAllLeads();
                ResponseUtil.json(resp, 200, ApiResponse.success("Đã tính lại điểm số thành công cho " + count + " lead/khách hàng", count));
                return;
            }

            // 3. Thêm mới quy tắc phân bổ tự động
            if (path.equals("/assignment/rules")) {
                LeadAssignmentRuleDTO body = JsonUtil.getGson().fromJson(readRequestBody(req), LeadAssignmentRuleDTO.class);
                if (body == null) {
                    ResponseUtil.json(resp, 400, ApiResponse.error("Dữ liệu không hợp lệ", null));
                    return;
                }
                long id = assignmentService.saveRule(body, userId);
                body.setId(id);
                ResponseUtil.json(resp, 201, ApiResponse.success("Tạo quy tắc phân bổ thành công", body));
                return;
            }

            // 4. Phân bổ thủ công Lead từ Hàng chờ
            if (path.equals("/assignment/manual")) {
                Map<String, Object> body = JsonUtil.getGson().fromJson(readRequestBody(req), JsonUtil.OBJECT_MAP_TYPE);
                if (body == null || !body.containsKey("leadId") || !body.containsKey("targetUserId")) {
                    ResponseUtil.json(resp, 400, ApiResponse.error("Thiếu mã leadId hoặc targetUserId", null));
                    return;
                }

                long leadId = ((Number) body.get("leadId")).longValue();
                long targetUserId = ((Number) body.get("targetUserId")).longValue();
                String notes = body.get("notes") != null ? body.get("notes").toString() : "";

                assignmentService.manualAssignLead(leadId, targetUserId, userId, notes);
                ResponseUtil.json(resp, 200, ApiResponse.success("Phân bổ lead cho nhân viên thành công", null));
                return;
            }

            // 5. Kích hoạt chạy phân bổ tự động ngay lập tức
            if (path.equals("/assignment/run-now")) {
                int count = assignmentService.runBatchAutoAssignment();
                ResponseUtil.json(resp, 200, ApiResponse.success("Đã phân bổ tự động thành công " + count + " lead theo quy tắc", count));
                return;
            }

            ResponseUtil.json(resp, 404, ApiResponse.error("Đường dẫn không tồn tại", null));
        } catch (IllegalArgumentException e) {
            ResponseUtil.json(resp, 400, ApiResponse.error(e.getMessage(), null));
        } catch (SecurityException e) {
            ResponseUtil.json(resp, 401, ApiResponse.error(e.getMessage(), null));
        } catch (Exception e) {
            ResponseUtil.json(resp, 500, ApiResponse.error("Lỗi khi xử lý: " + e.getMessage(), null));
        }
    }

    @Override
    protected void doPut(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        req.setCharacterEncoding("UTF-8");
        resp.setHeader("Cache-Control", "no-store");
        try {
            requireUser(req);
            String path = req.getPathInfo();
            if (path == null) path = "";

            // 1. Cập nhật tiêu chí chấm điểm
            if (path.startsWith("/scoring/rules/")) {
                long id = Long.parseLong(path.substring("/scoring/rules/".length()));
                LeadScoringRuleDTO body = JsonUtil.getGson().fromJson(readRequestBody(req), LeadScoringRuleDTO.class);
                if (body == null) {
                    ResponseUtil.json(resp, 400, ApiResponse.error("Dữ liệu không hợp lệ", null));
                    return;
                }
                body.setId(id);
                scoringService.updateRule(body);
                ResponseUtil.json(resp, 200, ApiResponse.success("Cập nhật tiêu chí chấm điểm thành công", body));
                return;
            }

            // 2. Cập nhật ngưỡng phân hạng Nóng, Ấm, Lạnh
            if (path.equals("/scoring/thresholds")) {
                ScoreThresholdDTO body = JsonUtil.getGson().fromJson(readRequestBody(req), ScoreThresholdDTO.class);
                if (body == null || body.getGrade() == null) {
                    ResponseUtil.json(resp, 400, ApiResponse.error("Dữ liệu không hợp lệ", null));
                    return;
                }
                scoringService.updateThreshold(body.getGrade(), body.getMinScore(), body.getLabel(), body.getColor(), body.getIcon(), body.getDescription());
                ResponseUtil.json(resp, 200, ApiResponse.success("Cập nhật ngưỡng điểm thành công", body));
                return;
            }

            // 3. Cập nhật thứ tự ưu tiên của các quy tắc phân bổ
            if (path.equals("/assignment/priorities")) {
                Type listType = new TypeToken<List<Long>>(){}.getType();
                List<Long> orderedIds = JsonUtil.getGson().fromJson(readRequestBody(req), listType);
                if (orderedIds == null || orderedIds.isEmpty()) {
                    ResponseUtil.json(resp, 400, ApiResponse.error("Danh sách ID thứ tự rỗng", null));
                    return;
                }
                assignmentService.updatePriorities(orderedIds);
                ResponseUtil.json(resp, 200, ApiResponse.success("Cập nhật thứ tự ưu tiên quy tắc thành công", orderedIds));
                return;
            }

            // 4. Cập nhật quy tắc phân bổ
            if (path.startsWith("/assignment/rules/")) {
                long id = Long.parseLong(path.substring("/assignment/rules/".length()));
                LeadAssignmentRuleDTO body = JsonUtil.getGson().fromJson(readRequestBody(req), LeadAssignmentRuleDTO.class);
                if (body == null) {
                    ResponseUtil.json(resp, 400, ApiResponse.error("Dữ liệu không hợp lệ", null));
                    return;
                }
                body.setId(id);
                assignmentService.updateRule(body);
                ResponseUtil.json(resp, 200, ApiResponse.success("Cập nhật quy tắc phân bổ thành công", body));
                return;
            }

            ResponseUtil.json(resp, 404, ApiResponse.error("Đường dẫn không tồn tại", null));
        } catch (NumberFormatException e) {
            ResponseUtil.json(resp, 400, ApiResponse.error("ID không hợp lệ", null));
        } catch (IllegalArgumentException e) {
            ResponseUtil.json(resp, 400, ApiResponse.error(e.getMessage(), null));
        } catch (SecurityException e) {
            ResponseUtil.json(resp, 401, ApiResponse.error(e.getMessage(), null));
        } catch (Exception e) {
            ResponseUtil.json(resp, 500, ApiResponse.error("Lỗi khi cập nhật: " + e.getMessage(), null));
        }
    }

    @Override
    protected void doDelete(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        resp.setHeader("Cache-Control", "no-store");
        try {
            requireUser(req);
            String path = req.getPathInfo();
            if (path == null) path = "";

            // 1. Xóa tiêu chí chấm điểm
            if (path.startsWith("/scoring/rules/")) {
                long id = Long.parseLong(path.substring("/scoring/rules/".length()));
                scoringService.deleteRule(id);
                ResponseUtil.json(resp, 200, ApiResponse.success("Xóa tiêu chí chấm điểm thành công", id));
                return;
            }

            // 2. Xóa quy tắc phân bổ
            if (path.startsWith("/assignment/rules/")) {
                long id = Long.parseLong(path.substring("/assignment/rules/".length()));
                assignmentService.deleteRule(id);
                ResponseUtil.json(resp, 200, ApiResponse.success("Xóa quy tắc phân bổ thành công", id));
                return;
            }

            ResponseUtil.json(resp, 404, ApiResponse.error("Đường dẫn không tồn tại", null));
        } catch (NumberFormatException e) {
            ResponseUtil.json(resp, 400, ApiResponse.error("ID không hợp lệ", null));
        } catch (SecurityException e) {
            ResponseUtil.json(resp, 401, ApiResponse.error(e.getMessage(), null));
        } catch (Exception e) {
            ResponseUtil.json(resp, 500, ApiResponse.error("Lỗi khi xóa: " + e.getMessage(), null));
        }
    }
}
