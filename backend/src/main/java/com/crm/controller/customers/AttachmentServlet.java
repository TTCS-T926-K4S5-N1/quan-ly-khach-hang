package com.crm.controller.customers;

import com.crm.config.DatabaseConfig;
import com.crm.dao.customers.Customer360DAO;
import com.crm.dao.permissions.PermissionDAO;
import com.crm.dao.pipeline.OpportunityDAO;
import com.crm.dto.common.ApiResponse;
import com.crm.util.JsonUtil;
import com.crm.util.ResponseUtil;
import com.google.gson.JsonObject;

import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.MultipartConfig;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import jakarta.servlet.http.Part;

import java.io.*;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.sql.Connection;
import java.util.*;

@WebServlet({
        "/api/attachments",
        "/api/attachments/*"
})
@MultipartConfig(
        maxFileSize = 20 * 1024 * 1024,      // 20MB per file
        maxRequestSize = 100 * 1024 * 1024,   // 100MB per request
        fileSizeThreshold = 1024 * 1024       // 1MB buffer
)
public class AttachmentServlet extends HttpServlet {

    private final Customer360DAO dao = new Customer360DAO();
    private final OpportunityDAO opportunityDAO = new OpportunityDAO();
    private final PermissionDAO permissionDAO = new PermissionDAO();

    private static final long MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        try {
            long currentUserId = requireUser(req);
            String path = req.getPathInfo();

            // 1. Check download request: /api/attachments/{id}/download or /api/attachments/download?id=...
            if (path != null && (path.endsWith("/download") || path.startsWith("/download/"))) {
                handleDownload(req, resp, currentUserId, path);
                return;
            }

            if ("download".equalsIgnoreCase(req.getParameter("action"))) {
                handleDownload(req, resp, currentUserId, path);
                return;
            }

            // 2. Query attachments list: by opportunityId or customerId
            String oppIdStr = req.getParameter("opportunityId");
            if (oppIdStr != null && !oppIdStr.isBlank()) {
                long oppId = Long.parseLong(oppIdStr.trim());
                List<Map<String, Object>> list = dao.getOpportunityAttachments(oppId);

                // Add permission indicator for UI display
                Map<String, Object> opp = opportunityDAO.findById(oppId);
                boolean isManager = permissionDAO.hasRole(currentUserId, "ADMIN")
                        || permissionDAO.hasRole(currentUserId, "DIRECTOR")
                        || permissionDAO.hasRole(currentUserId, "TEAM_LEAD");
                boolean isOwner = opp != null && opp.get("ownerUserId") != null && ((Number) opp.get("ownerUserId")).longValue() == currentUserId;
                boolean isSharedMember = opportunityDAO.isMember(oppId, currentUserId);

                for (Map<String, Object> att : list) {
                    long uploaderId = att.get("uploadedByUserId") instanceof Number ? ((Number) att.get("uploadedByUserId")).longValue() : 0;
                    boolean canDownload = isManager || isOwner || isSharedMember || (uploaderId == currentUserId);
                    att.put("canDownload", canDownload);
                }

                ResponseUtil.json(resp, 200, ApiResponse.success("Lấy danh sách tài liệu cơ hội thành công", list));
                return;
            }

            String custIdStr = req.getParameter("customerId");
            if (custIdStr != null && !custIdStr.isBlank()) {
                long custId = Long.parseLong(custIdStr.trim());
                try (Connection conn = DatabaseConfig.getConnection()) {
                    List<Map<String, Object>> list = dao.getAttachments(conn, custId);
                    ResponseUtil.json(resp, 200, ApiResponse.success("Lấy danh sách tài liệu khách hàng thành công", list));
                    return;
                }
            }

            // If an ID is passed directly: /api/attachments/{id}
            if (path != null && !path.equals("/")) {
                String clean = path.startsWith("/") ? path.substring(1) : path;
                long id = Long.parseLong(clean);
                Map<String, Object> att = dao.getAttachmentById(id);
                if (att == null) {
                    ResponseUtil.json(resp, 404, ApiResponse.error("Không tìm thấy tài liệu", null));
                    return;
                }
                ResponseUtil.json(resp, 200, ApiResponse.success("Lấy thông tin tài liệu thành công", att));
                return;
            }

            ResponseUtil.json(resp, 200, ApiResponse.success("Danh sách tài liệu", Collections.emptyList()));
        } catch (SecurityException e) {
            ResponseUtil.json(resp, 403, ApiResponse.error(e.getMessage(), null));
        } catch (IllegalArgumentException e) {
            ResponseUtil.json(resp, 400, ApiResponse.error(e.getMessage(), null));
        } catch (Exception e) {
            ResponseUtil.json(resp, 500, ApiResponse.error("Lỗi máy chủ: " + e.getMessage(), null));
        }
    }

    private void handleDownload(HttpServletRequest req, HttpServletResponse resp, long currentUserId, String path) throws Exception {
        long attId = 0;
        String idParam = req.getParameter("id");
        if (idParam != null && !idParam.isBlank()) {
            attId = Long.parseLong(idParam.trim());
        } else if (path != null) {
            String[] parts = path.split("/");
            for (String p : parts) {
                if (!p.isBlank() && !p.equalsIgnoreCase("download")) {
                    try {
                        attId = Long.parseLong(p);
                        break;
                    } catch (NumberFormatException ignored) {}
                }
            }
        }

        if (attId <= 0) {
            ResponseUtil.json(resp, 400, ApiResponse.error("Thiếu ID tài liệu cần tải xuống", null));
            return;
        }

        Map<String, Object> att = dao.getAttachmentById(attId);
        if (att == null) {
            ResponseUtil.json(resp, 404, ApiResponse.error("Không tìm thấy tệp tài liệu trong hệ thống.", null));
            return;
        }

        // Check permission: "Chỉ người sở hữu và người được chia sẻ mới tải xuống được"
        Object oppIdObj = att.get("opportunityId");
        if (oppIdObj instanceof Number) {
            long oppId = ((Number) oppIdObj).longValue();
            Map<String, Object> opp = opportunityDAO.findById(oppId);

            boolean isManager = permissionDAO.hasRole(currentUserId, "ADMIN")
                    || permissionDAO.hasRole(currentUserId, "DIRECTOR")
                    || permissionDAO.hasRole(currentUserId, "TEAM_LEAD");
            boolean isOwner = opp != null && opp.get("ownerUserId") != null && ((Number) opp.get("ownerUserId")).longValue() == currentUserId;
            boolean isSharedMember = opportunityDAO.isMember(oppId, currentUserId);
            long uploaderId = att.get("uploadedByUserId") instanceof Number ? ((Number) att.get("uploadedByUserId")).longValue() : 0;
            boolean isUploader = uploaderId == currentUserId;

            if (!isManager && !isOwner && !isSharedMember && !isUploader) {
                resp.setStatus(HttpServletResponse.SC_FORBIDDEN);
                resp.setContentType("application/json;charset=UTF-8");
                resp.getWriter().write("""
                    {"success":false,"message":"Bạn không có quyền tải xuống tài liệu này. Chỉ người sở hữu cơ hội và các thành viên được chia sẻ mới được tải xuống."}
                """);
                return;
            }
        }

        // Authorized: Stream file
        String fileName = (String) att.get("name");
        if (fileName == null || fileName.isBlank()) fileName = "tai_lieu_" + attId;
        String fileType = (String) att.get("fileType");
        String fileUrl = (String) att.get("fileUrl");

        String mimeType = getServletContext().getMimeType(fileName);
        if (mimeType == null) {
            mimeType = "application/octet-stream";
        }

        resp.setContentType(mimeType);
        String encodedFilename = URLEncoder.encode(fileName, StandardCharsets.UTF_8).replaceAll("\\+", "%20");
        resp.setHeader("Content-Disposition", "attachment; filename=\"" + fileName + "\"; filename*=UTF-8''" + encodedFilename);

        // Try reading physical file from upload directory
        File physicalFile = resolvePhysicalFile(fileUrl, fileName);
        if (physicalFile != null && physicalFile.exists()) {
            resp.setContentLengthLong(physicalFile.length());
            try (InputStream in = new FileInputStream(physicalFile);
                 OutputStream out = resp.getOutputStream()) {
                in.transferTo(out);
                out.flush();
            }
        } else {
            // Generate dummy content for demo / seed files
            byte[] demoContent = ("--- TÀI LIỆU CƠ HỘI CRM ---\n"
                    + "Tên tệp: " + fileName + "\n"
                    + "Định dạng: " + fileType + "\n"
                    + "Thời điểm tải lên: " + att.get("createdAt") + "\n"
                    + "Người tải: " + att.get("uploadedBy") + "\n"
                    + "Nội dung ghi chú: " + att.get("notes") + "\n"
                    + "Được cấp phép tải xuống cho người sở hữu và thành viên chia sẻ.\n").getBytes(StandardCharsets.UTF_8);
            resp.setContentLength(demoContent.length);
            try (OutputStream out = resp.getOutputStream()) {
                out.write(demoContent);
                out.flush();
            }
        }
    }

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        try {
            long currentUserId = requireUser(req);
            String contentType = req.getContentType();

            // Check if multipart upload (Multiple files, max 20MB per file)
            if (contentType != null && contentType.toLowerCase().startsWith("multipart/")) {
                handleMultipartUpload(req, resp, currentUserId);
                return;
            }

            // JSON Upload (Backward compatibility)
            JsonObject body = JsonUtil.getGson().fromJson(
                    new InputStreamReader(req.getInputStream(), StandardCharsets.UTF_8),
                    JsonObject.class
            );

            if (body == null || !body.has("name")) {
                throw new IllegalArgumentException("Dữ liệu tệp đính kèm không hợp lệ.");
            }

            Long customerId = body.has("customerId") && !body.get("customerId").isJsonNull() ? body.get("customerId").getAsLong() : null;
            Long opportunityId = body.has("opportunityId") && !body.get("opportunityId").isJsonNull() ? body.get("opportunityId").getAsLong() : null;
            String name = body.get("name").getAsString();
            String fileType = body.has("fileType") ? body.get("fileType").getAsString() : "PDF";
            long fileSize = body.has("fileSize") ? body.get("fileSize").getAsLong() : 102400L;

            if (fileSize > MAX_FILE_SIZE) {
                throw new IllegalArgumentException("Kích thước mỗi tệp tối đa 20MB.");
            }

            String fileUrl = body.has("fileUrl") ? body.get("fileUrl").getAsString() : "#";
            String notes = body.has("notes") && !body.get("notes").isJsonNull() ? body.get("notes").getAsString() : null;

            long id = dao.addOpportunityAttachment(customerId, opportunityId, name, fileType, fileSize, fileUrl, notes, currentUserId);
            ResponseUtil.json(resp, 201, ApiResponse.success("Thêm tệp đính kèm thành công", id));
        } catch (SecurityException e) {
            ResponseUtil.json(resp, 403, ApiResponse.error(e.getMessage(), null));
        } catch (IllegalArgumentException e) {
            ResponseUtil.json(resp, 400, ApiResponse.error(e.getMessage(), null));
        } catch (Exception e) {
            ResponseUtil.json(resp, 500, ApiResponse.error("Lỗi máy chủ: " + e.getMessage(), null));
        }
    }

    private void handleMultipartUpload(HttpServletRequest req, HttpServletResponse resp, long currentUserId) throws Exception {
        Long customerId = null;
        Long opportunityId = null;
        String notes = null;

        Part oppPart = req.getPart("opportunityId");
        if (oppPart != null) {
            String val = new String(oppPart.getInputStream().readAllBytes(), StandardCharsets.UTF_8).trim();
            if (!val.isBlank()) opportunityId = Long.parseLong(val);
        }

        Part custPart = req.getPart("customerId");
        if (custPart != null) {
            String val = new String(custPart.getInputStream().readAllBytes(), StandardCharsets.UTF_8).trim();
            if (!val.isBlank()) customerId = Long.parseLong(val);
        }

        Part notesPart = req.getPart("notes");
        if (notesPart != null) {
            notes = new String(notesPart.getInputStream().readAllBytes(), StandardCharsets.UTF_8).trim();
        }

        // Storage directory
        String uploadDirStr = getServletContext().getRealPath("/uploads/attachments");
        if (uploadDirStr == null) {
            uploadDirStr = System.getProperty("catalina.base", ".") + "/webapps/crm/uploads/attachments";
        }
        Path uploadDirPath = Paths.get(uploadDirStr);
        Files.createDirectories(uploadDirPath);

        List<Map<String, Object>> createdAttachments = new ArrayList<>();

        for (Part part : req.getParts()) {
            String submittedFileName = part.getSubmittedFileName();
            if (submittedFileName == null || submittedFileName.isBlank()) {
                continue;
            }

            // Check max 20MB limit
            long size = part.getSize();
            if (size > MAX_FILE_SIZE) {
                throw new IllegalArgumentException("Tệp '" + submittedFileName + "' có dung lượng (" + (size / (1024 * 1024)) + "MB) vượt quá giới hạn tối đa 20MB.");
            }

            // Detect extension & file type
            String ext = "";
            int dotIdx = submittedFileName.lastIndexOf('.');
            if (dotIdx >= 0) {
                ext = submittedFileName.substring(dotIdx + 1).toUpperCase();
            }
            if (ext.isBlank()) ext = "FILE";

            // Unique filename on disk
            String storedFileName = System.currentTimeMillis() + "_" + UUID.randomUUID().toString().substring(0, 8) + "_" + submittedFileName;
            Path targetPath = uploadDirPath.resolve(storedFileName);
            try (InputStream in = part.getInputStream()) {
                Files.copy(in, targetPath, StandardCopyOption.REPLACE_EXISTING);
            }

            String fileUrl = "uploads/attachments/" + storedFileName;
            long id = dao.addOpportunityAttachment(customerId, opportunityId, submittedFileName, ext, size, fileUrl, notes, currentUserId);

            Map<String, Object> map = new LinkedHashMap<>();
            map.put("id", id);
            map.put("name", submittedFileName);
            map.put("fileType", ext);
            map.put("fileSize", size);
            map.put("fileUrl", fileUrl);
            map.put("opportunityId", opportunityId);
            map.put("customerId", customerId);
            createdAttachments.add(map);
        }

        if (createdAttachments.isEmpty()) {
            throw new IllegalArgumentException("Không tìm thấy tệp tin nào được tải lên.");
        }

        ResponseUtil.json(resp, 201, ApiResponse.success("Đã tải lên thành công " + createdAttachments.size() + " tệp đính kèm.", createdAttachments));
    }

    private File resolvePhysicalFile(String fileUrl, String fileName) {
        if (fileUrl != null && !fileUrl.equals("#")) {
            String appPath = getServletContext().getRealPath("/" + fileUrl);
            if (appPath != null) {
                File f = new File(appPath);
                if (f.exists()) return f;
            }
            File f2 = new File(System.getProperty("catalina.base", ".") + "/webapps/crm/" + fileUrl);
            if (f2.exists()) return f2;
        }
        return null;
    }

    @Override
    protected void doDelete(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        try {
            long currentUserId = requireUser(req);
            String path = req.getPathInfo();
            if (path == null || path.equals("/")) {
                throw new IllegalArgumentException("Thiếu attachment id");
            }

            String clean = path.startsWith("/") ? path.substring(1) : path;
            long id = Long.parseLong(clean);

            Map<String, Object> att = dao.getAttachmentById(id);
            if (att == null) {
                ResponseUtil.json(resp, 404, ApiResponse.error("Không tìm thấy tệp đính kèm", null));
                return;
            }

            // Check permission to delete
            boolean isManager = permissionDAO.hasRole(currentUserId, "ADMIN")
                    || permissionDAO.hasRole(currentUserId, "DIRECTOR")
                    || permissionDAO.hasRole(currentUserId, "TEAM_LEAD");
            long uploaderId = att.get("uploadedByUserId") instanceof Number ? ((Number) att.get("uploadedByUserId")).longValue() : 0;
            boolean isUploader = uploaderId == currentUserId;

            boolean isOppOwner = false;
            Object oppIdObj = att.get("opportunityId");
            if (oppIdObj instanceof Number) {
                Map<String, Object> opp = opportunityDAO.findById(((Number) oppIdObj).longValue());
                if (opp != null && opp.get("ownerUserId") != null && ((Number) opp.get("ownerUserId")).longValue() == currentUserId) {
                    isOppOwner = true;
                }
            }

            if (!isManager && !isUploader && !isOppOwner) {
                throw new SecurityException("Bạn không có quyền xóa tệp đính kèm này.");
            }

            dao.deleteAttachment(id);
            ResponseUtil.json(resp, 200, ApiResponse.success("Xóa tệp đính kèm thành công", null));
        } catch (SecurityException e) {
            ResponseUtil.json(resp, 403, ApiResponse.error(e.getMessage(), null));
        } catch (IllegalArgumentException e) {
            ResponseUtil.json(resp, 400, ApiResponse.error(e.getMessage(), null));
        } catch (Exception e) {
            ResponseUtil.json(resp, 500, ApiResponse.error("Lỗi máy chủ: " + e.getMessage(), null));
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
