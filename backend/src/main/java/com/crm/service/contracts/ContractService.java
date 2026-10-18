package com.crm.service.contracts;

import com.crm.dao.contracts.ContractDAO;
import com.crm.dao.quotes.QuoteDAO;
import com.crm.dao.templates.DocumentTemplateDAO;
import com.crm.service.audit.AuditLogService;
import com.crm.service.permissions.DataScopeContext;
import com.crm.service.permissions.DataScopeService;
import com.crm.util.VietnameseNumberToWords;

import java.math.BigDecimal;
import java.sql.Date;
import java.util.*;

public class ContractService {

    private final ContractDAO contractDAO = new ContractDAO();
    private final QuoteDAO quoteDAO = new QuoteDAO();
    private final DocumentTemplateDAO templateDAO = new DocumentTemplateDAO();
    private final DataScopeService dataScopeService = new DataScopeService();
    private final AuditLogService auditLogService = new AuditLogService();

    public List<Map<String, Object>> search(long currentUserId, String keyword, String status, Integer customThreshold) throws Exception {
        DataScopeContext scope = dataScopeService.resolve(currentUserId, "quote", "read");
        return contractDAO.search(scope, keyword, status, customThreshold);
    }

    public Map<String, Object> getSummary(long currentUserId, Integer customThreshold) throws Exception {
        DataScopeContext scope = dataScopeService.resolve(currentUserId, "quote", "read");
        return contractDAO.getSummary(scope, customThreshold);
    }

    public Map<String, Object> getThresholdSettings(long currentUserId) throws Exception {
        dataScopeService.resolve(currentUserId, "quote", "read");
        int threshold = contractDAO.getExpiringThresholdDays();
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("expiringThresholdDays", threshold);
        return result;
    }

    public Map<String, Object> updateThresholdSettings(long currentUserId, int days) throws Exception {
        dataScopeService.resolve(currentUserId, "quote", "update");
        if (days < 1 || days > 365) {
            throw new IllegalArgumentException("Ngưỡng cảnh báo phải nằm trong khoảng từ 1 đến 365 ngày.");
        }
        contractDAO.updateExpiringThresholdDays(days);

        try {
            auditLogService.log(
                    currentUserId,
                    "CONTRACT_SETTINGS",
                    "expiring_threshold_days",
                    "UPDATE_SETTINGS",
                    "Cập nhật ngưỡng cảnh báo hợp đồng sắp hết hạn thành " + days + " ngày.",
                    null,
                    String.valueOf(days)
            );
        } catch (Exception ignored) {}

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("expiringThresholdDays", days);
        return result;
    }

    public Map<String, Object> createRenewalOpportunity(long currentUserId, long contractId, String title, BigDecimal amount, String notes) throws Exception {
        dataScopeService.resolve(currentUserId, "quote", "create");
        Map<String, Object> renewalResult = contractDAO.createRenewalOpportunity(contractId, currentUserId, title, amount, notes);

        try {
            auditLogService.log(
                    currentUserId,
                    "CONTRACT",
                    String.valueOf(renewalResult.get("contractNumber")),
                    "RENEWAL_OPPORTUNITY_CREATED",
                    "Đã tạo cơ hội gia hạn #" + renewalResult.get("opportunityId") + " (" + renewalResult.get("opportunityName") + ") từ hợp đồng #" + renewalResult.get("contractNumber"),
                    null,
                    "RENEWED"
            );
        } catch (Exception ignored) {}

        return renewalResult;
    }

    public Map<String, Object> getById(long currentUserId, long id) throws Exception {
        dataScopeService.resolve(currentUserId, "quote", "read");
        Map<String, Object> contract = contractDAO.findById(id);
        if (contract == null) return null;

        BigDecimal total = (BigDecimal) contract.get("totalAmount");
        contract.put("totalAmountInWords", VietnameseNumberToWords.convert(total));
        return contract;
    }

    public Map<String, Object> getPrintData(long currentUserId, long id) throws Exception {
        Map<String, Object> contract = getById(currentUserId, id);
        if (contract == null) {
            throw new NoSuchElementException("Không tìm thấy hợp đồng #" + id);
        }

        Map<String, Object> template = templateDAO.findByType("CONTRACT");
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("contract", contract);
        result.put("template", template);
        return result;
    }

    public Map<String, Object> createFromQuote(
            long currentUserId,
            long quoteId,
            String contractNumber,
            String title,
            Date signedDate,
            Date effectiveDate,
            Date expiryDate,
            String paymentTerms
    ) throws Exception {
        dataScopeService.resolve(currentUserId, "quote", "create");

        if (contractNumber == null || contractNumber.trim().isEmpty()) {
            throw new IllegalArgumentException("Số hợp đồng không được để trống.");
        }
        contractNumber = contractNumber.trim();

        if (signedDate == null) {
            throw new IllegalArgumentException("Ngày ký hợp đồng không được để trống.");
        }
        if (effectiveDate == null) {
            throw new IllegalArgumentException("Ngày hiệu lực hợp đồng không được để trống.");
        }

        Map<String, Object> quote = quoteDAO.findById(quoteId);
        if (quote == null) {
            throw new NoSuchElementException("Không tìm thấy báo giá ID #" + quoteId);
        }

        String quoteStatus = (String) quote.get("status");
        if ("REJECTED".equalsIgnoreCase(quoteStatus) || "DRAFT".equalsIgnoreCase(quoteStatus)) {
            throw new IllegalStateException("Chỉ báo giá đã được duyệt hoặc khách hàng chấp nhận mới được chuyển thành hợp đồng.");
        }

        if (contractDAO.isContractNumberExists(contractNumber)) {
            throw new IllegalArgumentException("Số hợp đồng '" + contractNumber + "' đã tồn tại trên hệ thống. Vui lòng nhập số hợp đồng duy nhất khác.");
        }

        if (title == null || title.trim().isEmpty()) {
            title = "Hợp đồng kinh tế - " + quote.get("customerName") + " (" + contractNumber + ")";
        }

        long customerId = ((Number) quote.get("customerId")).longValue();
        Long opportunityId = quote.get("opportunityId") != null ? ((Number) quote.get("opportunityId")).longValue() : null;
        BigDecimal subtotal = (BigDecimal) quote.get("subtotal");
        BigDecimal discountPercent = (BigDecimal) quote.get("discountPercent");
        BigDecimal totalAmount = (BigDecimal) quote.get("totalAmount");

        if (paymentTerms == null || paymentTerms.trim().isEmpty()) {
            paymentTerms = (String) quote.get("paymentTerms");
        }

        @SuppressWarnings("unchecked")
        List<Map<String, Object>> items = (List<Map<String, Object>>) quote.get("items");

        long contractId = contractDAO.create(
                contractNumber,
                title,
                customerId,
                opportunityId,
                quoteId,
                subtotal,
                discountPercent,
                totalAmount,
                signedDate,
                effectiveDate,
                expiryDate,
                paymentTerms,
                "ACTIVE",
                currentUserId,
                items
        );

        try {
            auditLogService.log(
                    currentUserId,
                    "CONTRACT",
                    contractNumber,
                    "CREATE_CONTRACT_FROM_QUOTE",
                    "Chuyển báo giá " + quote.get("quoteNumber") + " thành hợp đồng " + contractNumber + ". Giá trị: " + totalAmount + " ₫. Cơ hội chuyển sang Đóng thắng (WON).",
                    null,
                    "ACTIVE"
            );
        } catch (Exception ignored) {}

        return getById(currentUserId, contractId);
    }
}
