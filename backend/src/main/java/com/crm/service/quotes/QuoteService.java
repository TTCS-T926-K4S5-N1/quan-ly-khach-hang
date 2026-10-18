package com.crm.service.quotes;

import com.crm.dao.products.ProductDAO;
import com.crm.dao.quotes.QuoteDAO;
import com.crm.service.audit.AuditLogService;
import com.crm.service.permissions.DataScopeContext;
import com.crm.service.permissions.DataScopeService;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.sql.Date;
import java.util.*;

public class QuoteService {

    private final QuoteDAO quoteDAO = new QuoteDAO();
    private final ProductDAO productDAO = new ProductDAO();
    private final DataScopeService dataScopeService = new DataScopeService();
    private final AuditLogService auditLogService = new AuditLogService();

    public List<Map<String, Object>> search(
            long currentUserId,
            String keyword,
            String status
    ) throws Exception {
        DataScopeContext scope = dataScopeService.resolve(currentUserId, "quote", "read");
        return quoteDAO.search(scope, keyword, status);
    }

    public Map<String, Object> getById(long currentUserId, long id) throws Exception {
        DataScopeContext scope = dataScopeService.resolve(currentUserId, "quote", "read");
        Map<String, Object> quote = quoteDAO.findById(id);
        if (quote == null) return null;

        long ownerId = (Long) quote.get("ownerUserId");
        if (!scope.canAccessOwner(ownerId)) {
            throw new SecurityException("Bạn không có quyền truy cập dữ liệu này do giới hạn phạm vi sở hữu.");
        }
        return quote;
    }

    public Map<String, Object> getFromOpportunity(long currentUserId, long opportunityId) throws Exception {
        dataScopeService.resolve(currentUserId, "quote", "create");
        Map<String, Object> data = quoteDAO.fromOpportunity(opportunityId);
        if (data == null) {
            throw new NoSuchElementException("Không tìm thấy cơ hội ID #" + opportunityId);
        }
        return data;
    }

    /**
     * Unified create or update quote supporting:
     * - Line-item discount (% or Amount)
     * - Automatic tier calculation (NONE <=10%, TEAM_LEAD 10-20%, DIRECTOR >20% or unitPrice < floorPrice)
     * - Save Draft (DRAFT) vs Submit (PENDING_APPROVAL or auto-approved APPROVED)
     * - Auto-clone new version if modifying an already-sent quote
     */
    public Map<String, Object> saveQuote(
            long currentUserId,
            Long quoteId,
            String title,
            Long customerId,
            Long opportunityId,
            BigDecimal headerDiscountPercent,
            Date validUntil,
            String paymentTerms,
            String deliveryTerms,
            String termsAndConditions,
            String submitAction, // "DRAFT" or "SUBMIT"
            List<Map<String, Object>> rawItems
    ) throws Exception {
        if (headerDiscountPercent == null) headerDiscountPercent = BigDecimal.ZERO;
        if (submitAction == null || submitAction.trim().isEmpty()) submitAction = "DRAFT";

        // Calculate financials and floor price violation
        BigDecimal grossTotal = BigDecimal.ZERO;
        BigDecimal subtotal = BigDecimal.ZERO;
        boolean floorPriceViolated = false;

        List<Map<String, Object>> processedItems = new ArrayList<>();
        if (rawItems != null) {
            for (Map<String, Object> raw : rawItems) {
                if (raw == null || raw.get("productId") == null) continue;
                long prodId = ((Number) raw.get("productId")).longValue();
                int qty = raw.get("quantity") != null ? Math.max(1, ((Number) raw.get("quantity")).intValue()) : 1;
                BigDecimal unitPrice = raw.get("unitPrice") != null ? new BigDecimal(String.valueOf(raw.get("unitPrice"))) : BigDecimal.ZERO;

                // Lookup product for list price & floor price
                Map<String, Object> prod = productDAO.findById(prodId);
                BigDecimal floorPrice = BigDecimal.ZERO;
                if (prod != null && prod.get("floorPrice") != null) {
                    floorPrice = (BigDecimal) prod.get("floorPrice");
                }

                String discType = raw.get("discountType") != null ? String.valueOf(raw.get("discountType")).toUpperCase() : "PERCENT";
                BigDecimal discPercent = raw.get("discountPercent") != null ? new BigDecimal(String.valueOf(raw.get("discountPercent"))) : BigDecimal.ZERO;
                BigDecimal discAmount = raw.get("discountAmount") != null ? new BigDecimal(String.valueOf(raw.get("discountAmount"))) : BigDecimal.ZERO;

                BigDecimal lineGross = unitPrice.multiply(BigDecimal.valueOf(qty));
                grossTotal = grossTotal.add(lineGross);

                if ("AMOUNT".equalsIgnoreCase(discType)) {
                    if (discAmount.compareTo(lineGross) > 0) discAmount = lineGross;
                    if (discAmount.compareTo(BigDecimal.ZERO) < 0) discAmount = BigDecimal.ZERO;
                    if (lineGross.compareTo(BigDecimal.ZERO) > 0) {
                        discPercent = discAmount.multiply(BigDecimal.valueOf(100)).divide(lineGross, 2, RoundingMode.HALF_UP);
                    } else {
                        discPercent = BigDecimal.ZERO;
                    }
                } else {
                    discType = "PERCENT";
                    if (discPercent.compareTo(new BigDecimal("100")) > 0) discPercent = new BigDecimal("100");
                    if (discPercent.compareTo(BigDecimal.ZERO) < 0) discPercent = BigDecimal.ZERO;
                    discAmount = lineGross.multiply(discPercent).divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
                }

                BigDecimal lineNet = lineGross.subtract(discAmount);
                subtotal = subtotal.add(lineNet);

                // Floor price check: check unit price and net unit price
                if (floorPrice != null && floorPrice.compareTo(BigDecimal.ZERO) > 0) {
                    BigDecimal netUnitPrice = qty > 0 ? lineNet.divide(BigDecimal.valueOf(qty), 2, RoundingMode.HALF_UP) : unitPrice;
                    if (unitPrice.compareTo(floorPrice) < 0 || netUnitPrice.compareTo(floorPrice) < 0) {
                        floorPriceViolated = true;
                    }
                }

                Map<String, Object> item = new HashMap<>();
                item.put("productId", prodId);
                item.put("quantity", qty);
                item.put("unitPrice", unitPrice);
                item.put("discountType", discType);
                item.put("discountPercent", discPercent);
                item.put("discountAmount", discAmount);
                item.put("amount", lineNet);
                item.put("notes", raw.get("notes") != null ? String.valueOf(raw.get("notes")) : null);
                processedItems.add(item);
            }
        }

        // Header level discount calculation
        if (headerDiscountPercent.compareTo(BigDecimal.ZERO) < 0) headerDiscountPercent = BigDecimal.ZERO;
        if (headerDiscountPercent.compareTo(new BigDecimal("100")) > 0) headerDiscountPercent = new BigDecimal("100");

        BigDecimal headerDiscountAmount = subtotal.multiply(headerDiscountPercent).divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
        BigDecimal totalAmount = subtotal.subtract(headerDiscountAmount);

        // Effective overall discount across entire quote
        BigDecimal totalDiscountValue = grossTotal.subtract(totalAmount);
        BigDecimal effectiveDiscountPercent = BigDecimal.ZERO;
        if (grossTotal.compareTo(BigDecimal.ZERO) > 0) {
            effectiveDiscountPercent = totalDiscountValue.multiply(BigDecimal.valueOf(100)).divide(grossTotal, 2, RoundingMode.HALF_UP);
        }

        // Story 2 Approval tiers:
        // <= 10% and not below floor price -> NONE (Auto-approved if submitted)
        // 10% < discount <= 20% and not below floor price -> TEAM_LEAD
        // > 20% OR unit price < floor price -> DIRECTOR
        String approvalLevel = "NONE";
        boolean requiresApproval = false;

        if (floorPriceViolated || effectiveDiscountPercent.compareTo(new BigDecimal("20")) > 0) {
            approvalLevel = "DIRECTOR";
            requiresApproval = true;
        } else if (effectiveDiscountPercent.compareTo(new BigDecimal("10")) > 0) {
            approvalLevel = "TEAM_LEAD";
            requiresApproval = true;
        } else {
            approvalLevel = "NONE";
            requiresApproval = false;
        }

        // Determine final status based on submit action
        String status = "DRAFT";
        if ("SUBMIT".equalsIgnoreCase(submitAction)) {
            if (requiresApproval) {
                status = "PENDING_APPROVAL";
            } else {
                status = "APPROVED"; // Auto-approved
            }
        } else {
            status = "DRAFT";
        }

        long targetQuoteId;
        boolean createdNewVersion = false;

        if (quoteId == null || quoteId <= 0) {
            // Create brand new quote
            dataScopeService.resolve(currentUserId, "quote", "create");
            String quoteNumber = "BG-" + System.currentTimeMillis() % 1000000;
            targetQuoteId = quoteDAO.create(
                    quoteNumber,
                    title,
                    customerId,
                    opportunityId,
                    headerDiscountPercent,
                    subtotal,
                    totalAmount,
                    status,
                    requiresApproval,
                    approvalLevel,
                    validUntil,
                    paymentTerms,
                    deliveryTerms,
                    termsAndConditions,
                    1, // version 1
                    null, // parentQuoteId
                    true, // isActiveVersion
                    currentUserId,
                    processedItems
            );
        } else {
            // Update existing quote
            dataScopeService.resolve(currentUserId, "quote", "update");
            Map<String, Object> existing = quoteDAO.findById(quoteId);
            if (existing == null) {
                throw new NoSuchElementException("Không tìm thấy báo giá ID #" + quoteId);
            }

            long ownerId = (Long) existing.get("ownerUserId");
            DataScopeContext scope = dataScopeService.resolve(currentUserId, "quote", "update");
            if (!scope.canAccessOwner(ownerId)) {
                throw new SecurityException("Bạn không có quyền sửa báo giá này.");
            }

            String currentStatus = (String) existing.get("status");
            // Story 3: "Mỗi lần sửa sau khi đã gửi sẽ tạo phiên bản mới, phiên bản cũ được giữ nguyên"
            if ("SENT".equalsIgnoreCase(currentStatus)) {
                // Clone new version
                long newVerId = quoteDAO.cloneVersion(quoteId);
                quoteDAO.update(
                        newVerId,
                        title,
                        customerId,
                        opportunityId,
                        headerDiscountPercent,
                        subtotal,
                        totalAmount,
                        status,
                        requiresApproval,
                        approvalLevel,
                        validUntil,
                        paymentTerms,
                        deliveryTerms,
                        termsAndConditions,
                        processedItems
                );
                targetQuoteId = newVerId;
                createdNewVersion = true;
            } else {
                // Regular update in place
                quoteDAO.update(
                        quoteId,
                        title,
                        customerId,
                        opportunityId,
                        headerDiscountPercent,
                        subtotal,
                        totalAmount,
                        status,
                        requiresApproval,
                        approvalLevel,
                        validUntil,
                        paymentTerms,
                        deliveryTerms,
                        termsAndConditions,
                        processedItems
                );
                targetQuoteId = quoteId;
            }
        }

        // Audit log if discount applied or approval required
        try {
            auditLogService.log(
                    currentUserId,
                    "QUOTE",
                    "QUOTE-" + targetQuoteId,
                    quoteId == null ? "CREATE_QUOTE" : (createdNewVersion ? "CREATE_QUOTE_VERSION" : "UPDATE_QUOTE"),
                    "Lưu báo giá: tổng tiền " + totalAmount + ", chiết khấu tổng " + effectiveDiscountPercent + "% [Cấp duyệt: " + approvalLevel + "]",
                    null,
                    status
            );
        } catch (Exception ignored) {}

        Map<String, Object> result = getById(currentUserId, targetQuoteId);
        if (result != null) {
            result.put("createdNewVersion", createdNewVersion);
            result.put("effectiveDiscountPercent", effectiveDiscountPercent);
            result.put("floorPriceViolated", floorPriceViolated);
        }
        return result;
    }

    // Story 2: Duyệt báo giá
    public Map<String, Object> approve(long currentUserId, long quoteId, String comment) throws Exception {
        Map<String, Object> quote = quoteDAO.findById(quoteId);
        if (quote == null) {
            throw new NoSuchElementException("Báo giá không tồn tại.");
        }

        Map<String, String> approver = quoteDAO.getUserInfoForApproval(currentUserId);
        quoteDAO.updateApprovalStatus(quoteId, "APPROVED", null);
        quoteDAO.createApprovalRecord(
                quoteId,
                currentUserId,
                approver.get("fullName"),
                approver.get("roleCode"),
                "APPROVE",
                comment != null ? comment : "Đã duyệt báo giá",
                (BigDecimal) quote.get("discountPercent"),
                (BigDecimal) quote.get("totalAmount")
        );

        try {
            auditLogService.log(
                    currentUserId,
                    "QUOTE_APPROVAL",
                    String.valueOf(quote.get("quoteNumber")),
                    "APPROVE_QUOTE",
                    "Duyệt báo giá " + quote.get("quoteNumber") + (comment != null ? ": " + comment : ""),
                    String.valueOf(quote.get("status")),
                    "APPROVED"
            );
        } catch (Exception ignored) {}

        return getById(currentUserId, quoteId);
    }

    // Story 2: Từ chối báo giá (Bắt buộc nhập ý kiến)
    public Map<String, Object> reject(long currentUserId, long quoteId, String comment) throws Exception {
        if (comment == null || comment.trim().isEmpty()) {
            throw new IllegalArgumentException("Ý kiến/lý do là bắt buộc khi từ chối báo giá.");
        }

        Map<String, Object> quote = quoteDAO.findById(quoteId);
        if (quote == null) {
            throw new NoSuchElementException("Báo giá không tồn tại.");
        }

        Map<String, String> approver = quoteDAO.getUserInfoForApproval(currentUserId);
        quoteDAO.updateApprovalStatus(quoteId, "REJECTED", comment);
        quoteDAO.createApprovalRecord(
                quoteId,
                currentUserId,
                approver.get("fullName"),
                approver.get("roleCode"),
                "REJECT",
                comment,
                (BigDecimal) quote.get("discountPercent"),
                (BigDecimal) quote.get("totalAmount")
        );

        try {
            auditLogService.log(
                    currentUserId,
                    "QUOTE_APPROVAL",
                    String.valueOf(quote.get("quoteNumber")),
                    "REJECT_QUOTE",
                    "Từ chối báo giá " + quote.get("quoteNumber") + ". Lý do: " + comment,
                    String.valueOf(quote.get("status")),
                    "REJECTED"
            );
        } catch (Exception ignored) {}

        return getById(currentUserId, quoteId);
    }

    // Story 2: Trả lại sửa (Bắt buộc nhập ý kiến)
    public Map<String, Object> requestChanges(long currentUserId, long quoteId, String comment) throws Exception {
        if (comment == null || comment.trim().isEmpty()) {
            throw new IllegalArgumentException("Ý kiến/lý do là bắt buộc khi yêu cầu trả lại sửa báo giá.");
        }

        Map<String, Object> quote = quoteDAO.findById(quoteId);
        if (quote == null) {
            throw new NoSuchElementException("Báo giá không tồn tại.");
        }

        Map<String, String> approver = quoteDAO.getUserInfoForApproval(currentUserId);
        quoteDAO.updateApprovalStatus(quoteId, "CHANGES_REQUESTED", comment);
        quoteDAO.createApprovalRecord(
                quoteId,
                currentUserId,
                approver.get("fullName"),
                approver.get("roleCode"),
                "REQUEST_CHANGES",
                comment,
                (BigDecimal) quote.get("discountPercent"),
                (BigDecimal) quote.get("totalAmount")
        );

        try {
            auditLogService.log(
                    currentUserId,
                    "QUOTE_APPROVAL",
                    String.valueOf(quote.get("quoteNumber")),
                    "REQUEST_CHANGES_QUOTE",
                    "Yêu cầu sửa lại báo giá " + quote.get("quoteNumber") + ". Ý kiến: " + comment,
                    String.valueOf(quote.get("status")),
                    "CHANGES_REQUESTED"
            );
        } catch (Exception ignored) {}

        return getById(currentUserId, quoteId);
    }

    // Story 2: Gửi cho khách - Chỉ báo giá đã duyệt mới gửi được cho khách
    public Map<String, Object> sendToCustomer(long currentUserId, long quoteId) throws Exception {
        Map<String, Object> quote = quoteDAO.findById(quoteId);
        if (quote == null) {
            throw new NoSuchElementException("Báo giá không tồn tại.");
        }

        String currentStatus = (String) quote.get("status");
        if (!"APPROVED".equalsIgnoreCase(currentStatus)) {
            throw new IllegalStateException("Chỉ báo giá đã duyệt (APPROVED) mới được phép gửi cho khách hàng.");
        }

        quoteDAO.markSent(quoteId);

        try {
            auditLogService.log(
                    currentUserId,
                    "QUOTE",
                    String.valueOf(quote.get("quoteNumber")),
                    "SEND_QUOTE_CUSTOMER",
                    "Gửi báo giá " + quote.get("quoteNumber") + " cho khách hàng.",
                    currentStatus,
                    "SENT"
            );
        } catch (Exception ignored) {}

        return getById(currentUserId, quoteId);
    }

    // Story 3: Chủ động tạo phiên bản mới
    public Map<String, Object> createNewVersion(long currentUserId, long quoteId) throws Exception {
        dataScopeService.resolve(currentUserId, "quote", "create");
        Map<String, Object> quote = quoteDAO.findById(quoteId);
        if (quote == null) {
            throw new NoSuchElementException("Báo giá không tồn tại.");
        }

        long newVerId = quoteDAO.cloneVersion(quoteId);

        try {
            auditLogService.log(
                    currentUserId,
                    "QUOTE_VERSION",
                    String.valueOf(quote.get("quoteNumber")),
                    "CLONE_VERSION",
                    "Tạo phiên bản mới từ báo giá " + quote.get("quoteNumber"),
                    null,
                    "DRAFT"
            );
        } catch (Exception ignored) {}

        return getById(currentUserId, newVerId);
    }

    // Story 3: Đặt phiên bản làm phiên bản hiệu lực duy nhất
    public Map<String, Object> setActiveVersion(long currentUserId, long quoteId) throws Exception {
        dataScopeService.resolve(currentUserId, "quote", "update");
        Map<String, Object> quote = quoteDAO.findById(quoteId);
        if (quote == null) {
            throw new NoSuchElementException("Báo giá không tồn tại.");
        }

        quoteDAO.setActiveVersion(quoteId);

        try {
            auditLogService.log(
                    currentUserId,
                    "QUOTE_VERSION",
                    String.valueOf(quote.get("quoteNumber")),
                    "SET_ACTIVE_VERSION",
                    "Kích hoạt phiên bản " + quote.get("version") + " làm hiệu lực duy nhất.",
                    null,
                    "ACTIVE"
            );
        } catch (Exception ignored) {}

        return getById(currentUserId, quoteId);
    }

    // Story 3: Lấy danh sách phiên bản
    public List<Map<String, Object>> getVersions(long quoteId) throws Exception {
        return quoteDAO.getVersions(quoteId);
    }

    // Lịch sử duyệt bất biến
    public List<Map<String, Object>> getApprovalHistory(long quoteId) throws Exception {
        return quoteDAO.getApprovalHistory(quoteId);
    }

    // Story 3: So sánh chi tiết 2 phiên bản cạnh nhau
    public Map<String, Object> compareVersions(long currentUserId, long quoteId1, long quoteId2) throws Exception {
        Map<String, Object> v1 = getById(currentUserId, quoteId1);
        Map<String, Object> v2 = getById(currentUserId, quoteId2);

        if (v1 == null) throw new NoSuchElementException("Không tìm thấy phiên bản 1 (ID #" + quoteId1 + ")");
        if (v2 == null) throw new NoSuchElementException("Không tìm thấy phiên bản 2 (ID #" + quoteId2 + ")");

        Map<String, Object> comparison = new LinkedHashMap<>();
        comparison.put("quote1", v1);
        comparison.put("quote2", v2);

        // Header differences
        Map<String, Object> headerDiff = new LinkedHashMap<>();
        checkDiff(headerDiff, "title", "Tiêu đề", v1.get("title"), v2.get("title"));
        checkDiff(headerDiff, "status", "Trạng thái", v1.get("status"), v2.get("status"));
        checkDiff(headerDiff, "discountPercent", "Chiết khấu (%)", v1.get("discountPercent"), v2.get("discountPercent"));
        checkDiff(headerDiff, "subtotal", "Tổng tiền hàng", v1.get("subtotal"), v2.get("subtotal"));
        checkDiff(headerDiff, "totalAmount", "Tổng thanh toán", v1.get("totalAmount"), v2.get("totalAmount"));
        checkDiff(headerDiff, "approvalLevel", "Cấp duyệt", v1.get("approvalLevel"), v2.get("approvalLevel"));
        checkDiff(headerDiff, "validUntil", "Hiệu lực đến", v1.get("validUntil"), v2.get("validUntil"));
        checkDiff(headerDiff, "paymentTerms", "ĐK thanh toán", v1.get("paymentTerms"), v2.get("paymentTerms"));
        checkDiff(headerDiff, "deliveryTerms", "ĐK giao hàng", v1.get("deliveryTerms"), v2.get("deliveryTerms"));
        checkDiff(headerDiff, "termsAndConditions", "Điều khoản chung", v1.get("termsAndConditions"), v2.get("termsAndConditions"));
        comparison.put("headerDiff", headerDiff);

        // Items differences
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> items1 = (List<Map<String, Object>>) v1.get("items");
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> items2 = (List<Map<String, Object>>) v2.get("items");

        Map<Long, Map<String, Object>> map1 = new HashMap<>();
        if (items1 != null) {
            for (Map<String, Object> it : items1) {
                map1.put(((Number) it.get("productId")).longValue(), it);
            }
        }
        Map<Long, Map<String, Object>> map2 = new HashMap<>();
        if (items2 != null) {
            for (Map<String, Object> it : items2) {
                map2.put(((Number) it.get("productId")).longValue(), it);
            }
        }

        Set<Long> allProdIds = new LinkedHashSet<>();
        allProdIds.addAll(map1.keySet());
        allProdIds.addAll(map2.keySet());

        List<Map<String, Object>> itemDiffs = new ArrayList<>();
        for (Long pId : allProdIds) {
            Map<String, Object> i1 = map1.get(pId);
            Map<String, Object> i2 = map2.get(pId);

            Map<String, Object> row = new LinkedHashMap<>();
            row.put("productId", pId);
            row.put("item1", i1);
            row.put("item2", i2);

            if (i1 == null) {
                row.put("diffType", "ADDED"); // Only in v2
                row.put("productName", i2.get("productName"));
            } else if (i2 == null) {
                row.put("diffType", "REMOVED"); // Only in v1
                row.put("productName", i1.get("productName"));
            } else {
                row.put("productName", i2.get("productName"));
                boolean changed = !Objects.equals(i1.get("quantity"), i2.get("quantity"))
                        || !equalsPrice(i1.get("unitPrice"), i2.get("unitPrice"))
                        || !equalsPrice(i1.get("discountPercent"), i2.get("discountPercent"))
                        || !equalsPrice(i1.get("discountAmount"), i2.get("discountAmount"))
                        || !equalsPrice(i1.get("amount"), i2.get("amount"))
                        || !Objects.equals(i1.get("discountType"), i2.get("discountType"));
                row.put("diffType", changed ? "MODIFIED" : "UNCHANGED");
            }
            itemDiffs.add(row);
        }
        comparison.put("itemDiffs", itemDiffs);

        // Summary numbers
        BigDecimal tot1 = (BigDecimal) v1.get("totalAmount");
        BigDecimal tot2 = (BigDecimal) v2.get("totalAmount");
        BigDecimal amountDiff = (tot1 != null && tot2 != null) ? tot2.subtract(tot1) : BigDecimal.ZERO;
        comparison.put("amountDiff", amountDiff);

        return comparison;
    }

    private void checkDiff(Map<String, Object> container, String key, String label, Object v1, Object v2) {
        Map<String, Object> field = new LinkedHashMap<>();
        field.put("label", label);
        field.put("v1", v1);
        field.put("v2", v2);
        boolean changed;
        if (v1 instanceof BigDecimal && v2 instanceof BigDecimal) {
            changed = ((BigDecimal) v1).compareTo((BigDecimal) v2) != 0;
        } else {
            changed = !Objects.equals(v1, v2);
        }
        field.put("changed", changed);
        container.put(key, field);
    }

    private boolean equalsPrice(Object o1, Object o2) {
        if (o1 == null && o2 == null) return true;
        if (o1 == null || o2 == null) return false;
        try {
            BigDecimal b1 = new BigDecimal(String.valueOf(o1));
            BigDecimal b2 = new BigDecimal(String.valueOf(o2));
            return b1.compareTo(b2) == 0;
        } catch (Exception e) {
            return Objects.equals(o1, o2);
        }
    }

    public void delete(long currentUserId, long id) throws Exception {
        dataScopeService.resolve(currentUserId, "quote", "update");
        Map<String, Object> existing = quoteDAO.findById(id);
        if (existing == null) {
            throw new NoSuchElementException("Báo giá không tồn tại.");
        }

        long ownerId = (Long) existing.get("ownerUserId");
        DataScopeContext scope = dataScopeService.resolve(currentUserId, "quote", "update");
        if (!scope.canAccessOwner(ownerId)) {
            throw new SecurityException("Bạn không có quyền truy cập dữ liệu này do giới hạn phạm vi sở hữu.");
        }

        quoteDAO.softDelete(id);
    }

    public Map<String, Object> updateStatus(long currentUserId, long id, String status) throws Exception {
        dataScopeService.resolve(currentUserId, "quote", "update");
        Map<String, Object> existing = quoteDAO.findById(id);
        if (existing == null) {
            throw new NoSuchElementException("Báo giá không tồn tại.");
        }

        long ownerId = (Long) existing.get("ownerUserId");
        DataScopeContext scope = dataScopeService.resolve(currentUserId, "quote", "update");
        if (!scope.canAccessOwner(ownerId)) {
            throw new SecurityException("Bạn không có quyền truy cập dữ liệu này do giới hạn phạm vi sở hữu.");
        }

        quoteDAO.updateStatus(id, status);

        try {
            auditLogService.log(
                    currentUserId,
                    "QUOTE",
                    String.valueOf(existing.get("quoteNumber")),
                    "UPDATE_QUOTE_STATUS",
                    "Cập nhật trạng thái báo giá sang " + status,
                    String.valueOf(existing.get("status")),
                    status
            );
        } catch (Exception ignored) {}

        return getById(currentUserId, id);
    }
}
