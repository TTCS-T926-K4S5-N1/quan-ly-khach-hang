package com.crm.service.documents;

import com.crm.dao.documents.DocumentTemplateDAO;
import com.crm.model.documents.DocumentTemplate;
import com.crm.service.audit.AuditLogService;
import com.crm.service.permissions.PermissionService;

import java.sql.SQLException;
import java.util.List;
import java.util.regex.Pattern;

public class DocumentTemplateService {

    private static final Pattern HEX_COLOR = Pattern.compile("^#[0-9A-Fa-f]{6}$");
    private static final int MAX_LOGO_BYTES = 500 * 1024; // 500 KB limit (BR-9)

    private final DocumentTemplateDAO dao = new DocumentTemplateDAO();
    private final PermissionService permissionService = new PermissionService();
    private final AuditLogService auditLogService = new AuditLogService();

    public DocumentTemplate getByType(long currentUserId, String type) throws Exception {
        if (!DocumentTemplate.isSupportedType(type)) {
            throw new IllegalArgumentException("Loại mẫu tài liệu không hợp lệ (hỗ trợ QUOTE hoặc CONTRACT).");
        }
        // Cho phép người dùng có quyền quản lý mẫu, xuất báo giá hoặc xem hợp đồng/báo giá được đọc mẫu
        boolean hasPerm = permissionService.hasPermission(currentUserId, "document_template.manage")
                || permissionService.hasPermission(currentUserId, "quote.export")
                || permissionService.hasPermission(currentUserId, "quote.read")
                || permissionService.hasPermission(currentUserId, "contract.read");
        if (!hasPerm) {
            throw new SecurityException("Bạn không có quyền xem cấu hình mẫu tài liệu.");
        }

        DocumentTemplate t = dao.findByType(type);
        if (t == null) {
            throw new IllegalStateException("Chưa cấu hình mẫu tài liệu cho loại: " + type);
        }
        return t;
    }

    public List<DocumentTemplate> getAll(long currentUserId) throws Exception {
        requireManagePermission(currentUserId);
        return dao.findAll();
    }

    public DocumentTemplate update(long currentUserId, DocumentTemplate template) throws Exception {
        requireManagePermission(currentUserId);
        validate(template);

        template.setUpdatedBy(currentUserId);
        dao.upsert(template);

        try {
            auditLogService.log(
                    currentUserId,
                    "DOCUMENT_TEMPLATE",
                    template.getDocumentType(),
                    "UPDATE_DOCUMENT_TEMPLATE",
                    "Cập nhật cấu hình mẫu tài liệu PDF " + template.getDocumentType()
            );
        } catch (Exception ignored) {}

        return dao.findByType(template.getDocumentType());
    }

    public void validate(DocumentTemplate t) {
        if (t == null) {
            throw new IllegalArgumentException("Dữ liệu mẫu tài liệu không được để trống.");
        }
        if (!DocumentTemplate.isSupportedType(t.getDocumentType())) {
            throw new IllegalArgumentException("Loại tài liệu phải là QUOTE hoặc CONTRACT.");
        }
        if (t.getName() == null || t.getName().isBlank()) {
            throw new IllegalArgumentException("Tên mẫu tài liệu không được để trống.");
        }
        if (t.getTitle() == null || t.getTitle().isBlank()) {
            throw new IllegalArgumentException("Tiêu đề tài liệu không được để trống.");
        }
        if (t.getCompanyName() == null || t.getCompanyName().isBlank()) {
            throw new IllegalArgumentException("Tên công ty không được để trống.");
        }
        if (t.getPrimaryColor() != null && !t.getPrimaryColor().isBlank()) {
            if (!HEX_COLOR.matcher(t.getPrimaryColor().trim()).matches()) {
                throw new IllegalArgumentException("Màu chủ đạo phải theo định dạng mã HEX (#RRGGBB).");
            }
        }
        if (t.getValidityDays() <= 0 || t.getValidityDays() > 365) {
            throw new IllegalArgumentException("Số ngày hiệu lực phải từ 1 đến 365 ngày.");
        }

        // Kiểm tra logo base64
        if (t.getLogoData() != null && !t.getLogoData().isBlank()) {
            String logo = t.getLogoData().trim();
            if (!logo.startsWith("data:image/png;base64,") && !logo.startsWith("data:image/jpeg;base64,")) {
                throw new IllegalArgumentException("Logo phải ở định dạng ảnh PNG hoặc JPEG (Data URL base64).");
            }
            int comma = logo.indexOf(',');
            String base64Content = comma >= 0 ? logo.substring(comma + 1) : logo;
            // Kích thước ước tính file nhị phân = length * 3 / 4
            long approxBytes = (long) (base64Content.length() * 0.75);
            if (approxBytes > MAX_LOGO_BYTES) {
                throw new IllegalArgumentException("Dung lượng logo không được vượt quá 500 KB.");
            }
        }
    }

    private void requireManagePermission(long currentUserId) throws Exception {
        if (!permissionService.hasPermission(currentUserId, "document_template.manage")) {
            throw new SecurityException("Bạn không có quyền quản lý cấu hình mẫu tài liệu.");
        }
    }
}
