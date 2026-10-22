package com.crm.controller.pipeline;

import com.crm.dto.common.ApiResponse;
import com.crm.dto.pipeline.OpportunityItemDTO;
import com.crm.dto.pipeline.OpportunityWriteRequest;
import com.crm.service.pipeline.OpportunityItemService;
import com.crm.service.pipeline.OpportunityService;
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
import java.util.List;
import java.util.Map;
import java.util.NoSuchElementException;

@WebServlet({
        "/api/opportunities",
        "/api/opportunities/*"
})
public class OpportunityServlet extends HttpServlet {

    private static final Type ITEM_LIST_TYPE = new TypeToken<List<OpportunityItemDTO>>() {}.getType();

    private final OpportunityService opportunityService;
    private final OpportunityItemService opportunityItemService;

    public OpportunityServlet() {
        this(new OpportunityService(), new OpportunityItemService());
    }

    public OpportunityServlet(OpportunityService opportunityService, OpportunityItemService opportunityItemService) {
        this.opportunityService = opportunityService;
        this.opportunityItemService = opportunityItemService;
    }

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        try {
            long currentUserId = requireUser(req);
            String path = req.getPathInfo();

            if (path == null || path.equals("/")) {
                String keyword = req.getParameter("keyword");
                String status = req.getParameter("status");
                Long stageId = longParam(req, "stageId");
                int page = intParam(req, "page", 1);
                int size = intParam(req, "size", 100);

                var items = opportunityService.search(currentUserId, stageId, status, keyword, page, size);
                ResponseUtil.json(resp, 200, ApiResponse.success("Lấy danh sách cơ hội thành công", items));
                return;
            }

            String[] segs = segments(path);
            if (segs.length == 1) {
                long id = Long.parseLong(segs[0]);
                var item = opportunityService.getById(currentUserId, id);
                if (item == null) {
                    ResponseUtil.json(resp, 404, ApiResponse.error("Không tìm thấy cơ hội", null));
                    return;
                }
                ResponseUtil.json(resp, 200, ApiResponse.success("Lấy thông tin cơ hội thành công", item));
                return;
            }

            if (segs.length == 2 && "items".equalsIgnoreCase(segs[1])) {
                long oppId = Long.parseLong(segs[0]);
                var items = opportunityItemService.getItems(currentUserId, oppId);
                ResponseUtil.json(resp, 200, ApiResponse.success("Lấy danh sách sản phẩm thành công", items));
                return;
            }

            if (segs.length == 3 && "items".equalsIgnoreCase(segs[1])) {
                long oppId = Long.parseLong(segs[0]);
                long itemId = Long.parseLong(segs[2]);
                var item = opportunityItemService.getItemById(currentUserId, oppId, itemId);
                if (item == null) {
                    ResponseUtil.json(resp, 404, ApiResponse.error("Không tìm thấy dòng sản phẩm", null));
                    return;
                }
                ResponseUtil.json(resp, 200, ApiResponse.success("Lấy thông tin sản phẩm thành công", item));
                return;
            }

            ResponseUtil.json(resp, 404, ApiResponse.error("Endpoint không tồn tại", null));
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

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        try {
            long currentUserId = requireUser(req);
            String path = req.getPathInfo();

            if (path == null || path.equals("/")) {
                OpportunityWriteRequest body = JsonUtil.getGson().fromJson(req.getReader(), OpportunityWriteRequest.class);
                var created = opportunityService.create(currentUserId, body);
                ResponseUtil.json(resp, 201, ApiResponse.success("Tạo cơ hội thành công", created));
                return;
            }

            String[] segs = segments(path);
            if (segs.length == 2) {
                long targetId = Long.parseLong(segs[0]);
                String action = segs[1];

                if ("stage".equalsIgnoreCase(action)) {
                    Map<String, Object> body = JsonUtil.getGson().fromJson(req.getReader(), com.crm.util.JsonUtil.OBJECT_MAP_TYPE);
                    if (body == null || body.get("stageId") == null) {
                        throw new IllegalArgumentException("Thiếu stageId");
                    }
                    long targetStageId = ((Number) body.get("stageId")).longValue();
                    var updated = opportunityService.changeStage(currentUserId, targetId, targetStageId);
                    ResponseUtil.json(resp, 200, ApiResponse.success("Chuyển giai đoạn thành công", updated));
                    return;
                }

                if ("close".equalsIgnoreCase(action)) {
                    Map<String, Object> body = JsonUtil.getGson().fromJson(req.getReader(), com.crm.util.JsonUtil.OBJECT_MAP_TYPE);
                    if (body == null || body.get("status") == null) {
                        throw new IllegalArgumentException("Thiếu trạng thái đóng cơ hội (WON/LOST)");
                    }
                    String status = String.valueOf(body.get("status"));
                    Long winReasonId = body.get("winReasonId") != null ? ((Number) body.get("winReasonId")).longValue() : null;
                    Long lossReasonId = body.get("lossReasonId") != null ? ((Number) body.get("lossReasonId")).longValue() : null;
                    Long competitorId = body.get("competitorId") != null ? ((Number) body.get("competitorId")).longValue() : null;
                    String lostReason = body.get("lostReason") != null ? String.valueOf(body.get("lostReason")) : null;

                    var closed = opportunityService.closeDeal(currentUserId, targetId, status, winReasonId, lossReasonId, competitorId, lostReason);
                    ResponseUtil.json(resp, 200, ApiResponse.success("Đóng cơ hội thành công", closed));
                    return;
                }

                if ("items".equalsIgnoreCase(action)) {
                    OpportunityItemDTO body = JsonUtil.getGson().fromJson(req.getReader(), OpportunityItemDTO.class);
                    var createdItem = opportunityItemService.addItem(currentUserId, targetId, body);
                    ResponseUtil.json(resp, 201, ApiResponse.success("Thêm sản phẩm vào cơ hội thành công", createdItem));
                    return;
                }
            }

            ResponseUtil.json(resp, 404, ApiResponse.error("Endpoint không tồn tại", null));
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

    @Override
    protected void doPut(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        try {
            long currentUserId = requireUser(req);
            String path = req.getPathInfo();
            String[] segs = segments(path);

            if (segs.length == 1) {
                long id = Long.parseLong(segs[0]);
                OpportunityWriteRequest body = JsonUtil.getGson().fromJson(req.getReader(), OpportunityWriteRequest.class);

                var updated = opportunityService.update(currentUserId, id, body);
                if (updated == null) {
                    ResponseUtil.json(resp, 404, ApiResponse.error("Không tìm thấy cơ hội", null));
                    return;
                }

                ResponseUtil.json(resp, 200, ApiResponse.success("Cập nhật cơ hội thành công", updated));
                return;
            }

            if (segs.length == 2 && "items".equalsIgnoreCase(segs[1])) {
                long oppId = Long.parseLong(segs[0]);
                List<OpportunityItemDTO> items = JsonUtil.getGson().fromJson(req.getReader(), ITEM_LIST_TYPE);
                var result = opportunityItemService.saveItems(currentUserId, oppId, items);
                ResponseUtil.json(resp, 200, ApiResponse.success("Lưu danh sách sản phẩm thành công", result));
                return;
            }

            if (segs.length == 3 && "items".equalsIgnoreCase(segs[1])) {
                long oppId = Long.parseLong(segs[0]);
                long itemId = Long.parseLong(segs[2]);
                OpportunityItemDTO body = JsonUtil.getGson().fromJson(req.getReader(), OpportunityItemDTO.class);

                var updatedItem = opportunityItemService.updateItem(currentUserId, oppId, itemId, body);
                ResponseUtil.json(resp, 200, ApiResponse.success("Cập nhật dòng sản phẩm thành công", updatedItem));
                return;
            }

            ResponseUtil.json(resp, 404, ApiResponse.error("Endpoint không tồn tại", null));
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

    @Override
    protected void doDelete(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        try {
            long currentUserId = requireUser(req);
            String path = req.getPathInfo();
            String[] segs = segments(path);

            if (segs.length == 1) {
                long id = Long.parseLong(segs[0]);
                opportunityService.delete(currentUserId, id);
                ResponseUtil.json(resp, 200, ApiResponse.success("Xóa cơ hội thành công", null));
                return;
            }

            if (segs.length == 3 && "items".equalsIgnoreCase(segs[1])) {
                long oppId = Long.parseLong(segs[0]);
                long itemId = Long.parseLong(segs[2]);
                var newTotals = opportunityItemService.deleteItem(currentUserId, oppId, itemId);
                ResponseUtil.json(resp, 200, ApiResponse.success("Xóa dòng sản phẩm thành công", newTotals));
                return;
            }

            ResponseUtil.json(resp, 404, ApiResponse.error("Endpoint không tồn tại", null));
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

    private String[] segments(String pathInfo) {
        if (pathInfo == null || pathInfo.isBlank()) return new String[0];
        String clean = pathInfo.startsWith("/") ? pathInfo.substring(1) : pathInfo;
        if (clean.endsWith("/")) clean = clean.substring(0, clean.length() - 1);
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
