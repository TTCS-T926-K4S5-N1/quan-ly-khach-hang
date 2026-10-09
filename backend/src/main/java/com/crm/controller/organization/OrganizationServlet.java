package com.crm.controller.organization;

import com.crm.dto.common.ApiResponse;
import com.crm.dto.organization.OrganizationUnitRequest;
import com.crm.service.organization.OrganizationService;
import com.crm.service.permissions.PermissionService;
import com.crm.util.JsonUtil;
import com.crm.util.ResponseUtil;
import com.google.gson.JsonObject;

import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.*;

import java.io.IOException;

@WebServlet({
        "/api/organization/units",
        "/api/organization/units/*",
        "/api/organization/regions"
})
public class OrganizationServlet extends HttpServlet {

    private final OrganizationService service = new OrganizationService();
    private final PermissionService permissions = new PermissionService();

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse res) throws IOException {
        try {
            require(req, "organization.read");
            String path = req.getPathInfo();

            // 1. Lấy danh sách khu vực địa lý
            if (req.getServletPath().endsWith("/regions") || (path != null && path.equals("/regions"))) {
                ResponseUtil.json(res, 200, ApiResponse.success("Lấy danh sách khu vực thành công", service.getRegions()));
                return;
            }

            // 2. Lấy danh sách thành viên của một đơn vị / nhóm
            if (path != null && path.endsWith("/members")) {
                long unitId = parseUnitIdFromMembersPath(path);
                ResponseUtil.json(res, 200, ApiResponse.success("Lấy thành viên đơn vị thành công", service.getMembers(unitId)));
                return;
            }

            // 3. Lấy chi tiết một đơn vị
            if (path != null && !path.equals("/")) {
                long id = parseId(path);
                ResponseUtil.json(res, 200, ApiResponse.success("Lấy thông tin đơn vị thành công", service.getUnit(id)));
                return;
            }

            // 4. Lấy toàn bộ cây cơ cấu tổ chức
            Long parentId = parseLongNullable(req.getParameter("parentId"));
            Boolean active = parseBooleanNullable(req.getParameter("active"));

            ResponseUtil.json(res, 200, ApiResponse.success("Lấy cơ cấu tổ chức thành công", service.getUnits(parentId, active)));

        } catch (SecurityException e) {
            forbidden(res);
        } catch (IllegalArgumentException e) {
            badRequest(res, e.getMessage());
        } catch (Exception e) {
            serverError(res, e);
        }
    }

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse res) throws IOException {
        try {
            require(req, "organization.manage");
            String path = req.getPathInfo();

            // 1. Thêm khu vực địa lý mới
            if (req.getServletPath().endsWith("/regions") || (path != null && path.equals("/regions"))) {
                JsonObject json = JsonUtil.getGson().fromJson(req.getReader(), JsonObject.class);
                String code = json != null && json.has("code") ? json.get("code").getAsString() : null;
                String name = json != null && json.has("name") ? json.get("name").getAsString() : null;
                service.addRegion(code, name);
                ResponseUtil.json(res, 201, ApiResponse.success("Thêm khu vực địa lý thành công", null));
                return;
            }

            // 2. Gán nhân viên vào đơn vị / nhóm
            if (path != null && path.endsWith("/members")) {
                long unitId = parseUnitIdFromMembersPath(path);
                JsonObject json = JsonUtil.getGson().fromJson(req.getReader(), JsonObject.class);
                if (json == null || !json.has("userId")) {
                    throw new IllegalArgumentException("Vui lòng chọn nhân viên cần gán");
                }
                long userId = json.get("userId").getAsLong();
                service.assignMember(unitId, userId);
                ResponseUtil.json(res, 200, ApiResponse.success("Gán nhân viên vào nhóm thành công", service.getMembers(unitId)));
                return;
            }

            // 3. Tạo mới một đơn vị tổ chức / nhóm kinh doanh
            OrganizationUnitRequest body = JsonUtil.getGson().fromJson(req.getReader(), OrganizationUnitRequest.class);
            ResponseUtil.json(res, 201, ApiResponse.success("Tạo đơn vị thành công", service.create(body)));

        } catch (SecurityException e) {
            forbidden(res);
        } catch (IllegalArgumentException e) {
            badRequest(res, e.getMessage());
        } catch (Exception e) {
            serverError(res, e);
        }
    }

    @Override
    protected void doPut(HttpServletRequest req, HttpServletResponse res) throws IOException {
        try {
            require(req, "organization.manage");
            long id = pathId(req);
            OrganizationUnitRequest body = JsonUtil.getGson().fromJson(req.getReader(), OrganizationUnitRequest.class);

            ResponseUtil.json(res, 200, ApiResponse.success("Cập nhật đơn vị thành công", service.update(id, body)));

        } catch (SecurityException e) {
            forbidden(res);
        } catch (IllegalArgumentException e) {
            badRequest(res, e.getMessage());
        } catch (Exception e) {
            serverError(res, e);
        }
    }

    @Override
    protected void doDelete(HttpServletRequest req, HttpServletResponse res) throws IOException {
        try {
            require(req, "organization.manage");
            String path = req.getPathInfo();

            // Xóa / gỡ nhân viên khỏi nhóm
            if (path != null && path.contains("/members/")) {
                String[] parts = path.split("/");
                long userId = Long.parseLong(parts[parts.length - 1]);
                service.removeMember(userId);
                ResponseUtil.json(res, 200, ApiResponse.success("Đã gỡ nhân viên khỏi nhóm", null));
                return;
            }

            // Xóa đơn vị tổ chức
            long id = pathId(req);
            service.delete(id);
            ResponseUtil.json(res, 200, ApiResponse.success("Xóa đơn vị thành công", null));

        } catch (SecurityException e) {
            forbidden(res);
        } catch (IllegalArgumentException e) {
            badRequest(res, e.getMessage());
        } catch (Exception e) {
            serverError(res, e);
        }
    }

    private long parseUnitIdFromMembersPath(String path) {
        String clean = path.replace("/members", "");
        if (clean.startsWith("/")) {
            clean = clean.substring(1);
        }
        return Long.parseLong(clean);
    }

    private long parseId(String path) {
        String clean = path.startsWith("/") ? path.substring(1) : path;
        return Long.parseLong(clean);
    }

    private long pathId(HttpServletRequest req) {
        String path = req.getPathInfo();
        if (path == null || path.equals("/")) {
            throw new IllegalArgumentException("ID không hợp lệ");
        }
        try {
            return Long.parseLong(path.substring(1));
        } catch (NumberFormatException e) {
            throw new IllegalArgumentException("ID không hợp lệ");
        }
    }

    private Long parseLongNullable(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        try {
            return Long.valueOf(value);
        } catch (NumberFormatException e) {
            throw new IllegalArgumentException("parentId không hợp lệ");
        }
    }

    private Boolean parseBooleanNullable(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        if (value.equalsIgnoreCase("true")) {
            return true;
        }
        if (value.equalsIgnoreCase("false")) {
            return false;
        }
        throw new IllegalArgumentException("active không hợp lệ");
    }

    private void require(HttpServletRequest req, String permission) throws Exception {
        HttpSession session = req.getSession(false);
        if (session == null || session.getAttribute("userId") == null) {
            throw new SecurityException("Chưa đăng nhập");
        }
        long userId = (Long) session.getAttribute("userId");
        if (!permissions.hasPermission(userId, permission)) {
            throw new SecurityException("Không có quyền: " + permission);
        }
    }

    private void forbidden(HttpServletResponse res) throws IOException {
        ResponseUtil.json(res, 403, ApiResponse.error("Không có quyền", null));
    }

    private void badRequest(HttpServletResponse res, String message) throws IOException {
        ResponseUtil.json(res, 400, ApiResponse.error(message, null));
    }

    private void serverError(HttpServletResponse res, Exception e) throws IOException {
        ResponseUtil.json(res, 500, ApiResponse.error("Lỗi hệ thống: " + e.getMessage(), null));
    }
}