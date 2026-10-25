package com.crm.service.documents;

import com.crm.dao.customers.CustomerDAO;
import com.crm.dao.pipeline.OpportunityDAO;
import com.crm.dao.quotes.QuoteDAO;
import com.crm.model.documents.DocumentTemplate;
import com.crm.service.audit.AuditLogService;
import com.crm.service.permissions.DataScopeContext;
import com.crm.service.permissions.DataScopeService;
import com.crm.service.permissions.PermissionService;

import java.math.BigDecimal;
import java.sql.Timestamp;
import java.time.LocalDate;
import java.util.*;

public class DocumentExportService {

    private final QuoteDAO quoteDAO = new QuoteDAO();
    private final CustomerDAO customerDAO = new CustomerDAO();
    private final OpportunityDAO opportunityDAO = new OpportunityDAO();
    private final DocumentTemplateService templateService = new DocumentTemplateService();
    private final PdfDocumentRenderer pdfRenderer = new PdfDocumentRenderer();
    private final PermissionService permissionService = new PermissionService();
    private final DataScopeService dataScopeService = new DataScopeService();
    private final AuditLogService auditLogService = new AuditLogService();

    public record ExportResult(String fileName, byte[] bytes) {}

    public ExportResult exportQuotePdf(long currentUserId, long quoteId) throws Exception {
        if (!permissionService.hasPermission(currentUserId, "quote.export")
                && !permissionService.hasPermission(currentUserId, "quote.read")) {
            throw new SecurityException("Bạn không có quyền xuất báo giá.");
        }

        DataScopeContext scope = dataScopeService.resolve(currentUserId, "quote", "read");
        Map<String, Object> quote = quoteDAO.findById(quoteId);
        if (quote == null) {
            throw new NoSuchElementException("Không tìm thấy báo giá ID: " + quoteId);
        }

        long ownerId = (Long) quote.get("ownerUserId");
        if (!scope.canAccessOwner(ownerId)) {
            throw new SecurityException("Bạn không có quyền truy cập dữ liệu này do giới hạn phạm vi sở hữu.");
        }

        QuoteDocumentData quoteData = buildQuoteData(quote);
        DocumentTemplate template = templateService.getByType(currentUserId, DocumentTemplate.TYPE_QUOTE);

        byte[] pdfBytes = pdfRenderer.renderQuote(template, quoteData);

        String safeNumber = sanitizeFileName(quoteData.quoteNumber != null ? quoteData.quoteNumber : String.valueOf(quoteId));
        String fileName = "BaoGia_" + safeNumber + ".pdf";

        try {
            auditLogService.log(
                    currentUserId,
                    "QUOTE",
                    String.valueOf(quote.get("quoteNumber")),
                    "EXPORT_QUOTE_PDF",
                    "Xuất file PDF báo giá " + quote.get("quoteNumber")
            );
        } catch (Exception ignored) {}

        return new ExportResult(fileName, pdfBytes);
    }

    public ExportResult exportContractPdf(long currentUserId, long quoteId, ContractInfo contractInfo) throws Exception {
        if (!permissionService.hasPermission(currentUserId, "contract.read")) {
            throw new SecurityException("Bạn không có quyền xem hoặc xuất hợp đồng.");
        }
        if (contractInfo == null) {
            throw new IllegalArgumentException("Thiếu thông tin hợp đồng.");
        }
        contractInfo.validate();

        DataScopeContext scope = dataScopeService.resolve(currentUserId, "quote", "read");
        Map<String, Object> quote = quoteDAO.findById(quoteId);
        if (quote == null) {
            throw new NoSuchElementException("Không tìm thấy báo giá ID: " + quoteId);
        }

        long ownerId = (Long) quote.get("ownerUserId");
        if (!scope.canAccessOwner(ownerId)) {
            throw new SecurityException("Bạn không có quyền truy cập dữ liệu này do giới hạn phạm vi sở hữu.");
        }

        String status = (String) quote.get("status");
        if (!QuoteDocumentData.FINAL_STATUSES.contains(status != null ? status.trim().toUpperCase(Locale.ROOT) : "")) {
            throw new IllegalArgumentException("Chỉ có thể xuất hợp đồng từ báo giá đã được phê duyệt hoặc chấp nhận (trạng thái hiện tại: " + status + ").");
        }

        QuoteDocumentData quoteData = buildQuoteData(quote);
        DocumentTemplate template = templateService.getByType(currentUserId, DocumentTemplate.TYPE_CONTRACT);

        byte[] pdfBytes = pdfRenderer.renderContract(template, quoteData, contractInfo);

        String safeNumber = sanitizeFileName(contractInfo.contractNumber);
        String fileName = "HopDong_" + safeNumber + ".pdf";

        try {
            auditLogService.log(
                    currentUserId,
                    "CONTRACT",
                    contractInfo.contractNumber,
                    "EXPORT_CONTRACT_PDF",
                    "Xuất file PDF hợp đồng " + contractInfo.contractNumber + " từ báo giá " + quote.get("quoteNumber")
            );
        } catch (Exception ignored) {}

        return new ExportResult(fileName, pdfBytes);
    }

    public ExportResult previewTemplatePdf(long currentUserId, String type) throws Exception {
        DocumentTemplate template = templateService.getByType(currentUserId, type);
        QuoteDocumentData demo = createDemoQuoteData();

        if (DocumentTemplate.TYPE_CONTRACT.equalsIgnoreCase(type)) {
            ContractInfo info = new ContractInfo();
            info.contractNumber = "HD-DEMO-" + LocalDate.now().getYear();
            info.signedDate = LocalDate.now();
            info.effectiveDate = LocalDate.now();
            info.expiryDate = LocalDate.now().plusYears(1);
            info.paymentTerms = "Thanh toán đợt 1: 50% ngay sau khi ký hợp đồng.\nThanh toán đợt 2: 50% trong vòng 15 ngày kể từ ngày nghiệm thu bàn giao.";
            byte[] bytes = pdfRenderer.renderContract(template, demo, info);
            return new ExportResult("Preview_HopDong.pdf", bytes);
        } else {
            byte[] bytes = pdfRenderer.renderQuote(template, demo);
            return new ExportResult("Preview_BaoGia.pdf", bytes);
        }
    }

    @SuppressWarnings("unchecked")
    private QuoteDocumentData buildQuoteData(Map<String, Object> quote) {
        QuoteDocumentData d = new QuoteDocumentData();
        d.quoteNumber = (String) quote.get("quoteNumber");
        d.title = (String) quote.get("title");
        d.status = (String) quote.get("status");
        d.customerName = (String) quote.get("customerName");
        d.ownerName = (String) quote.get("ownerName");

        Timestamp ts = (Timestamp) quote.get("createdAt");
        d.createdDate = ts != null ? ts.toLocalDateTime().toLocalDate() : LocalDate.now();

        d.subtotal = quote.get("subtotal") != null ? (BigDecimal) quote.get("subtotal") : BigDecimal.ZERO;
        d.discountPercent = quote.get("discountPercent") != null ? (BigDecimal) quote.get("discountPercent") : BigDecimal.ZERO;
        d.totalAmount = quote.get("totalAmount") != null ? (BigDecimal) quote.get("totalAmount") : BigDecimal.ZERO;

        Long customerId = (Long) quote.get("customerId");
        if (customerId != null) {
            try {
                Map<String, Object> cust = customerDAO.findById(customerId);
                if (cust != null) {
                    d.customerTaxCode = (String) cust.get("tax_code");
                    d.customerAddress = (String) cust.get("address");
                    d.customerPhone = (String) cust.get("phone");
                    d.customerEmail = (String) cust.get("email");
                    if (d.customerName == null || d.customerName.isBlank()) {
                        d.customerName = (String) cust.get("name");
                    }
                }
            } catch (Exception ignored) {}
        }

        Long oppId = (Long) quote.get("opportunityId");
        if (oppId != null) {
            try {
                // Opportunity name lookup if needed
                d.opportunityName = "Cơ hội #" + oppId;
            } catch (Exception ignored) {}
        }

        List<Map<String, Object>> items = (List<Map<String, Object>>) quote.get("items");
        if (items != null) {
            for (Map<String, Object> it : items) {
                QuoteDocumentData.LineItem line = new QuoteDocumentData.LineItem();
                line.productCode = (String) it.get("productCode");
                line.productName = (String) it.get("productName");
                line.unit = (String) it.get("unit");
                line.quantity = it.get("quantity") != null ? ((Number) it.get("quantity")).intValue() : 1;
                line.unitPrice = it.get("unitPrice") != null ? (BigDecimal) it.get("unitPrice") : BigDecimal.ZERO;
                line.discountPercent = it.get("discountPercent") != null ? (BigDecimal) it.get("discountPercent") : BigDecimal.ZERO;
                line.amount = it.get("amount") != null ? (BigDecimal) it.get("amount") : BigDecimal.ZERO;
                d.items.add(line);
            }
        }

        return d;
    }

    private QuoteDocumentData createDemoQuoteData() {
        QuoteDocumentData d = new QuoteDocumentData();
        d.quoteNumber = "BG-DEMO-001";
        d.title = "Báo giá phần mềm Quản lý quan hệ khách hàng CRM";
        d.status = "APPROVED";
        d.createdDate = LocalDate.now();
        d.customerName = "CÔNG TY TNHH PHÁT TRIỂN CÔNG NGHỆ VÀ TRUYỀN THÔNG Á CHÂU";
        d.customerTaxCode = "0102345678";
        d.customerAddress = "Tòa nhà Keangnam Landmark 72, Mễ Trì, Nam Từ Liêm, Hà Nội";
        d.customerPhone = "024 6688 9900";
        d.customerEmail = "contact@achaucorp.vn";
        d.ownerName = "Nguyễn Văn An";
        d.opportunityName = "Dự án chuyển đổi số CRM 2026";

        d.items.add(new QuoteDocumentData.LineItem(
                "CRM-ENT", "Gói giải pháp phần mềm CRM Doanh nghiệp Enterprise (Bản quyền 1 năm)",
                "Gói", 1, new BigDecimal("120000000"), BigDecimal.ZERO, new BigDecimal("120000000")
        ));
        d.items.add(new QuoteDocumentData.LineItem(
                "SRV-SETUP", "Dịch vụ chuẩn hóa dữ liệu, tích hợp hệ thống và đào tạo chuyển giao",
                "Dịch vụ", 1, new BigDecimal("35000000"), BigDecimal.ZERO, new BigDecimal("35000000")
        ));
        d.items.add(new QuoteDocumentData.LineItem(
                "USER-ADD", "Bản quyền người dùng bổ sung (Gói 10 người dùng kinh doanh)",
                "Gói", 2, new BigDecimal("15000000"), new BigDecimal("10.0"), new BigDecimal("27000000")
        ));

        d.subtotal = new BigDecimal("182000000");
        d.discountPercent = new BigDecimal("5.0");
        // 182,000,000 * 0.95 = 172,900,000
        d.totalAmount = new BigDecimal("172900000");
        return d;
    }

    private String sanitizeFileName(String input) {
        if (input == null || input.isBlank()) return "document";
        return input.replaceAll("[^a-zA-Z0-9._-]", "_");
    }
}
