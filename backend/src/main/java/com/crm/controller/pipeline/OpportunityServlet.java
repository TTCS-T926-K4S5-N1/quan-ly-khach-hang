package com.crm.controller.pipeline;

import com.crm.dto.common.ApiResponse;
import com.crm.dto.pipeline.OpportunityWriteRequest;
import com.crm.service.pipeline.OpportunityService;
import com.crm.util.JsonUtil;
import com.crm.util.ResponseUtil;

import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;

import java.io.IOException;
import java.util.*;

@WebServlet({
        "/api/opportunities",
        "/api/opportunities/*"
})
public class OpportunityServlet extends HttpServlet {

    private final OpportunityService opportunityService = new OpportunityService();

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        try {
            long currentUserId = requireUser(req);
            String path = req.getPathInfo();

            if (path == null || path.equals("/")) {
                String keyword = req.getParameter("keyword");
                String status = req.getParameter("status");
                Long stageId = longParam(req, "stageId");
                Long ownerId = longParam(req, "ownerId");
                String ownerFilter = req.getParameter("ownerFilter");
                if (ownerId == null && ("MINE".equalsIgnoreCase(ownerFilter) || "Tôi".equalsIgnoreCase(ownerFilter))) {
                    ownerId = currentUserId;
                }
                Long teamId = longParam(req, "teamId");
                String closeDateFrom = req.getParameter("closeDateFrom");
                String closeDateTo = req.getParameter("closeDateTo");
                String leadSource = req.getParameter("leadSource");
                String customFieldKey = req.getParameter("customFieldKey");
                String customFieldValue = req.getParameter("customFieldValue");
                Boolean stagnantOnly = "true".equalsIgnoreCase(req.getParameter("stagnantOnly")) ? Boolean.TRUE : null;
                int page = intParam(req, "page", 1);
                int size = intParam(req, "size", 100);

                var items = opportunityService.search(currentUserId, stageId, status, keyword, ownerId, teamId, closeDateFrom, closeDateTo, leadSource, customFieldKey, customFieldValue, stagnantOnly, page, size);
                ResponseUtil.json(resp, 200, ApiResponse.success("Lấy danh sách cơ hội thành công", items));
                return;
            }

            // Xuất Excel danh sách cơ hội (bao gồm các trường tùy chỉnh)
            if (path.equals("/export")) {
                String keyword = req.getParameter("keyword");
                String status = req.getParameter("status");
                Long stageId = longParam(req, "stageId");
                Long ownerId = longParam(req, "ownerId");
                String ownerFilter = req.getParameter("ownerFilter");
                if (ownerId == null && ("MINE".equalsIgnoreCase(ownerFilter) || "Tôi".equalsIgnoreCase(ownerFilter))) {
                    ownerId = currentUserId;
                }
                Long teamId = longParam(req, "teamId");
                String closeDateFrom = req.getParameter("closeDateFrom");
                String closeDateTo = req.getParameter("closeDateTo");
                String leadSource = req.getParameter("leadSource");
                String customFieldKey = req.getParameter("customFieldKey");
                String customFieldValue = req.getParameter("customFieldValue");
                Boolean stagnantOnly = "true".equalsIgnoreCase(req.getParameter("stagnantOnly")) ? Boolean.TRUE : null;

                var items = opportunityService.search(currentUserId, stageId, status, keyword, ownerId, teamId, closeDateFrom, closeDateTo, leadSource, customFieldKey, customFieldValue, stagnantOnly, 1, 10000);

                com.crm.dao.customfields.CustomFieldValueDAO cfDao = new com.crm.dao.customfields.CustomFieldValueDAO();
                List<Map<String, Object>> activeFields = cfDao.getActiveFields("OPPORTUNITY");

                List<Long> oppIds = items.stream()
                        .map(o -> ((Number) o.get("id")).longValue())
                        .toList();
                Map<Long, Map<String, Object>> customValues = cfDao.getValuesForRecords("OPPORTUNITY", oppIds);

                com.crm.service.export.ExcelExportService exportService = new com.crm.service.export.ExcelExportService();
                exportService.exportOpportunities(resp, items, activeFields, customValues);
                return;
            }

            String[] getSegments = segments(path);
            if (getSegments.length == 2 && "items".equals(getSegments[1])) {
                long targetId = Long.parseLong(getSegments[0]);
                var items = opportunityService.getItems(currentUserId, targetId);
                ResponseUtil.json(resp, 200, ApiResponse.success("Lấy danh sách sản phẩm cơ hội thành công", items));
                return;
            }

            long id = parseId(path);
            var item = opportunityService.getById(currentUserId, id);
            if (item == null) {
                ResponseUtil.json(resp, 404, ApiResponse.error("Không tìm thấy cơ hội", null));
                return;
            }

            ResponseUtil.json(resp, 200, ApiResponse.success("Lấy thông tin cơ hội thành công", item));
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
        req.setCharacterEncoding("UTF-8");
        try {
            long currentUserId = requireUser(req);
            String path = req.getPathInfo();

            if ("/scan-stagnation".equals(path)) {
                int flagged = opportunityService.scanAndFlagStagnantOpportunities();
                Map<String, Object> resData = new HashMap<>();
                resData.put("flaggedCount", flagged);
                ResponseUtil.json(resp, 200, ApiResponse.success("Đã quét và đánh giá cơ hội đình trệ: " + flagged + " cơ hội có cờ cảnh báo", resData));
                return;
            }

            if (path == null || path.equals("/")) {
                OpportunityWriteRequest body = JsonUtil.getGson().fromJson(req.getReader(), OpportunityWriteRequest.class);
                var created = opportunityService.create(currentUserId, body);
                ResponseUtil.json(resp, 201, ApiResponse.success("Tạo cơ hội thành công", created));
                return;
            }

            String[] segments = segments(path);
            if (segments.length == 2) {
                long targetId = Long.parseLong(segments[0]);
                String action = segments[1];

                if ("items".equals(action)) {
                    java.lang.reflect.Type listType = new com.google.gson.reflect.TypeToken<List<com.crm.dto.pipeline.OpportunityItemDTO>>(){}.getType();
                    List<com.crm.dto.pipeline.OpportunityItemDTO> items = JsonUtil.getGson().fromJson(req.getReader(), listType);
                    var saved = opportunityService.saveItems(currentUserId, targetId, items != null ? items : Collections.emptyList());
                    ResponseUtil.json(resp, 200, ApiResponse.success("Lưu danh sách sản phẩm thành công", saved));
                    return;
                }

                if ("stage".equals(action)) {
                    Map<String, Object> body = JsonUtil.getGson().fromJson(req.getReader(), com.crm.util.JsonUtil.OBJECT_MAP_TYPE);
                    if (body == null || body.get("stageId") == null) {
                        throw new IllegalArgumentException("Thiếu stageId");
                    }
                    long targetStageId = ((Number) body.get("stageId")).longValue();
                    String overrideReason = body.get("overrideReason") != null ? String.valueOf(body.get("overrideReason")).trim() : null;

                    var updated = opportunityService.changeStage(currentUserId, targetId, targetStageId, overrideReason);
                    ResponseUtil.json(resp, 200, ApiResponse.success("Chuyển giai đoạn thành công", updated));
                    return;
                }

                if ("close".equals(action)) {
                    Map<String, Object> body = JsonUtil.getGson().fromJson(req.getReader(), com.crm.util.JsonUtil.OBJECT_MAP_TYPE);
                    if (body == null || body.get("status") == null) {
                        throw new IllegalArgumentException("Thiếu trạng thái đóng cơ hội (WON/LOST)");
                    }
                    String status = String.valueOf(body.get("status"));
                    Long winReasonId = body.get("winReasonId") != null ? ((Number) body.get("winReasonId")).longValue() : null;
                    Long lossReasonId = body.get("lossReasonId") != null ? ((Number) body.get("lossReasonId")).longValue() : null;
                    Long competitorId = body.get("competitorId") != null ? ((Number) body.get("competitorId")).longValue() : null;
                    String lostReason = body.get("lostReason") != null ? String.valueOf(body.get("lostReason")) : null;

                    java.math.BigDecimal actualAmount = null;
                    if (body.get("actualAmount") != null) {
                        actualAmount = new java.math.BigDecimal(String.valueOf(body.get("actualAmount")));
                    } else if (body.get("amount") != null) {
                        actualAmount = new java.math.BigDecimal(String.valueOf(body.get("amount")));
                    }

                    String actualCloseDate = null;
                    if (body.get("actualCloseDate") != null && !String.valueOf(body.get("actualCloseDate")).isBlank()) {
                        actualCloseDate = String.valueOf(body.get("actualCloseDate")).trim();
                    } else if (body.get("wonDate") != null && !String.valueOf(body.get("wonDate")).isBlank()) {
                        actualCloseDate = String.valueOf(body.get("wonDate")).trim();
                    }

                    var closed = opportunityService.closeDeal(currentUserId, targetId, status, winReasonId, lossReasonId, competitorId, lostReason, actualAmount, actualCloseDate);
                    ResponseUtil.json(resp, 200, ApiResponse.success("Đóng cơ hội thành công", closed));
                    return;
                }

                if ("reopen".equals(action)) {
                    Map<String, Object> body = JsonUtil.getGson().fromJson(req.getReader(), com.crm.util.JsonUtil.OBJECT_MAP_TYPE);
                    String reopenReason = body != null && body.get("reopenReason") != null ? String.valueOf(body.get("reopenReason")).trim() : null;
                    var reopened = opportunityService.reopen(currentUserId, targetId, reopenReason);
                    ResponseUtil.json(resp, 200, ApiResponse.success("Mở lại cơ hội thành công", reopened));
                    return;
                }
            }

            ResponseUtil.json(resp, 404, ApiResponse.error("Endpoint không tồn tại", null));
        } catch (com.crm.exception.StageConditionException e) {
            Map<String, Object> errData = new HashMap<>();
            errData.put("conditionBlocked", true);
            errData.put("canOverride", e.isCanOverride());
            errData.put("stageName", e.getStageName());
            errData.put("conditionType", e.getConditionType());
            errData.put("exitCondition", e.getExitCondition());
            errData.put("missingReason", e.getMissingReason());
            ResponseUtil.json(resp, 400, ApiResponse.error(e.getMessage(), errData));
        } catch (SecurityException e) {
            ResponseUtil.json(resp, 403, ApiResponse.error(e.getMessage(), null));
        } catch (IllegalArgumentException | IllegalStateException e) {
            ResponseUtil.json(resp, 400, ApiResponse.error(e.getMessage(), null));
        } catch (Exception e) {
            e.printStackTrace();
            ResponseUtil.json(resp, 500, ApiResponse.error("Lỗi máy chủ: " + e.getMessage(), null));
        }
    }

    @Override
    protected void doPut(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        req.setCharacterEncoding("UTF-8");
        try {
            long currentUserId = requireUser(req);
            long id = parseId(req.getPathInfo());
            OpportunityWriteRequest body = JsonUtil.getGson().fromJson(req.getReader(), OpportunityWriteRequest.class);

            var updated = opportunityService.update(currentUserId, id, body);
            if (updated == null) {
                ResponseUtil.json(resp, 404, ApiResponse.error("Không tìm thấy cơ hội", null));
                return;
            }

            ResponseUtil.json(resp, 200, ApiResponse.success("Cập nhật cơ hội thành công", updated));
        } catch (SecurityException e) {
            ResponseUtil.json(resp, 403, ApiResponse.error(e.getMessage(), null));
        } catch (IllegalArgumentException | IllegalStateException e) {
            ResponseUtil.json(resp, 400, ApiResponse.error(e.getMessage(), null));
        } catch (Exception e) {
            ResponseUtil.json(resp, 500, ApiResponse.error("Lỗi máy chủ", null));
        }
    }

    @Override
    protected void doDelete(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        try {
            long currentUserId = requireUser(req);
            String path = req.getPathInfo();
            String[] segments = segments(path);

            if (segments.length == 3 && "items".equals(segments[1])) {
                long targetId = Long.parseLong(segments[0]);
                long itemId = Long.parseLong(segments[2]);
                opportunityService.deleteItem(currentUserId, targetId, itemId);
                ResponseUtil.json(resp, 200, ApiResponse.success("Xóa sản phẩm khỏi cơ hội thành công", null));
                return;
            }

            long id = parseId(path);

            opportunityService.delete(currentUserId, id);
            ResponseUtil.json(resp, 200, ApiResponse.success("Xóa cơ hội thành công", null));
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
            throw new IllegalArgumentException("Thiếu opportunity id");
        }
        String clean = pathInfo.startsWith("/") ? pathInfo.substring(1) : pathInfo;
        int slash = clean.indexOf('/');
        String idStr = slash >= 0 ? clean.substring(0, slash) : clean;
        return Long.parseLong(idStr);
    }

    private String[] segments(String pathInfo) {
        if (pathInfo == null || pathInfo.isBlank()) return new String[0];
        String clean = pathInfo.startsWith("/") ? pathInfo.substring(1) : pathInfo;
        return clean.split("/");
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

    private int intParam(HttpServletRequest req, String name, int fallback) {
        String val = req.getParameter(name);
        if (val == null || val.isBlank()) return fallback;
        try {
            return Integer.parseInt(val.trim());
        } catch (NumberFormatException e) {
            return fallback;
        }
    }
}
