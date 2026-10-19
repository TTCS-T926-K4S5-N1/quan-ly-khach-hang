package com.crm.service.pipeline;

import com.crm.dto.pipeline.OpportunityItemDTO;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.Map;

public final class OpportunityCalculator {

    private OpportunityCalculator() {
    }

    /**
     * Calculates line amounts for an opportunity item, applying defaults from catalog if needed.
     *
     * @param item           The opportunity item DTO
     * @param catalogProduct Map of catalog product details (optional, can be null)
     */
    public static void computeItemAmounts(OpportunityItemDTO item, Map<String, Object> catalogProduct) {
        if (item == null) {
            return;
        }

        // 1. Default catalog information if product provided
        BigDecimal catalogListPrice = BigDecimal.ZERO;
        String catalogType = "ONE_TIME";
        String catalogUnit = null;
        String catalogCode = null;
        String catalogName = null;

        if (catalogProduct != null) {
            if (catalogProduct.get("listPrice") instanceof BigDecimal lp) {
                catalogListPrice = lp;
            } else if (catalogProduct.get("listPrice") instanceof Number n) {
                catalogListPrice = BigDecimal.valueOf(n.doubleValue());
            }

            if (catalogProduct.get("type") != null) {
                catalogType = String.valueOf(catalogProduct.get("type"));
            }
            if (catalogProduct.get("unit") != null) {
                catalogUnit = String.valueOf(catalogProduct.get("unit"));
            }
            if (catalogProduct.get("code") != null) {
                catalogCode = String.valueOf(catalogProduct.get("code"));
            }
            if (catalogProduct.get("name") != null) {
                catalogName = String.valueOf(catalogProduct.get("name"));
            }
        }

        if (item.getProductCode() == null && catalogCode != null) {
            item.setProductCode(catalogCode);
        }
        if (item.getProductName() == null && catalogName != null) {
            item.setProductName(catalogName);
        }
        if (item.getProductUnit() == null && catalogUnit != null) {
            item.setProductUnit(catalogUnit);
        }

        // Product type default from catalog
        if (item.getProductType() == null || item.getProductType().isBlank() || "ONE_TIME".equals(item.getProductType())) {
            if ("RECURRING".equalsIgnoreCase(catalogType)) {
                item.setProductType("RECURRING");
            }
        }

        // Store catalog list price
        item.setListPrice(catalogListPrice);

        // Unit price defaults to list price if not specified or <= 0
        if (item.getUnitPrice() == null || item.getUnitPrice().compareTo(BigDecimal.ZERO) <= 0) {
            if (catalogListPrice.compareTo(BigDecimal.ZERO) > 0) {
                item.setUnitPrice(catalogListPrice);
            } else {
                item.setUnitPrice(BigDecimal.ZERO);
            }
        }

        // Quantity defaults to 1 if <= 0
        if (item.getQuantity() == null || item.getQuantity().compareTo(BigDecimal.ZERO) <= 0) {
            item.setQuantity(BigDecimal.ONE);
        }

        // Discount validation
        BigDecimal discount = item.getDiscountPercent();
        if (discount == null || discount.compareTo(BigDecimal.ZERO) < 0) {
            discount = BigDecimal.ZERO;
        } else if (discount.compareTo(BigDecimal.valueOf(100)) > 0) {
            discount = BigDecimal.valueOf(100);
        }
        item.setDiscountPercent(discount);

        boolean isRecurring = "RECURRING".equalsIgnoreCase(item.getProductType());

        if (isRecurring) {
            // Subscription service: supports term count and annual contract value (ACV)
            String cycle = item.getBillingCycle();
            if (cycle == null || cycle.isBlank() || "ONE_TIME".equalsIgnoreCase(cycle)) {
                cycle = "MONTHLY";
                item.setBillingCycle(cycle);
            } else {
                cycle = cycle.toUpperCase();
                item.setBillingCycle(cycle);
            }

            int termCount = item.getTermCount() != null && item.getTermCount() > 0 ? item.getTermCount() : defaultTermForCycle(cycle);
            item.setTermCount(termCount);

            // Subtotal for entire contract term
            BigDecimal lineSubtotal = item.getUnitPrice()
                    .multiply(item.getQuantity())
                    .multiply(BigDecimal.valueOf(termCount));

            BigDecimal lineDiscountAmount = lineSubtotal.multiply(discount)
                    .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
            BigDecimal totalAmount = lineSubtotal.subtract(lineDiscountAmount).setScale(2, RoundingMode.HALF_UP);
            item.setTotalAmount(totalAmount);

            // Annual Contract Value (ACV / Giá trị hợp đồng theo năm)
            // If user explicitly declared a positive annual amount, keep it; otherwise calculate
            BigDecimal declaredAnnual = item.getAnnualAmount();
            if (declaredAnnual != null && declaredAnnual.compareTo(BigDecimal.ZERO) > 0) {
                item.setAnnualAmount(declaredAnnual.setScale(2, RoundingMode.HALF_UP));
            } else {
                BigDecimal autoAnnual = calculateAnnualContractValue(item.getUnitPrice(), item.getQuantity(), discount, cycle, termCount, totalAmount);
                item.setAnnualAmount(autoAnnual);
            }
        } else {
            // One-time service / product
            item.setProductType("ONE_TIME");
            item.setBillingCycle("ONE_TIME");
            item.setTermCount(1);
            item.setAnnualAmount(BigDecimal.ZERO);

            BigDecimal lineSubtotal = item.getUnitPrice().multiply(item.getQuantity());
            BigDecimal lineDiscountAmount = lineSubtotal.multiply(discount)
                    .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
            BigDecimal totalAmount = lineSubtotal.subtract(lineDiscountAmount).setScale(2, RoundingMode.HALF_UP);
            item.setTotalAmount(totalAmount);
        }
    }

    public static int defaultTermForCycle(String cycle) {
        if (cycle == null) return 12;
        return switch (cycle.toUpperCase()) {
            case "ANNUAL", "YEARLY" -> 1;
            case "SEMI_ANNUAL" -> 2;
            case "QUARTERLY" -> 4;
            default -> 12; // MONTHLY
        };
    }

    public static BigDecimal calculateAnnualContractValue(
            BigDecimal unitPrice,
            BigDecimal quantity,
            BigDecimal discountPercent,
            String cycle,
            int termCount,
            BigDecimal totalAmount
    ) {
        int periodsPerYear = switch (cycle != null ? cycle.toUpperCase() : "MONTHLY") {
            case "ANNUAL", "YEARLY" -> 1;
            case "SEMI_ANNUAL" -> 2;
            case "QUARTERLY" -> 4;
            default -> 12; // MONTHLY
        };

        BigDecimal periodSubtotal = unitPrice.multiply(quantity).multiply(BigDecimal.valueOf(periodsPerYear));
        BigDecimal discount = periodSubtotal.multiply(discountPercent)
                .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
        return periodSubtotal.subtract(discount).setScale(2, RoundingMode.HALF_UP);
    }

    /**
     * Calculates the sum of total amounts (TCV) from lines.
     */
    public static BigDecimal sumTotalAmount(List<OpportunityItemDTO> items) {
        if (items == null || items.isEmpty()) {
            return BigDecimal.ZERO;
        }
        BigDecimal sum = BigDecimal.ZERO;
        for (OpportunityItemDTO item : items) {
            if (item != null && item.getTotalAmount() != null) {
                sum = sum.add(item.getTotalAmount());
            }
        }
        return sum.setScale(2, RoundingMode.HALF_UP);
    }

    /**
     * Calculates the sum of annual amounts (ACV) from lines.
     */
    public static BigDecimal sumAnnualAmount(List<OpportunityItemDTO> items) {
        if (items == null || items.isEmpty()) {
            return BigDecimal.ZERO;
        }
        BigDecimal sum = BigDecimal.ZERO;
        for (OpportunityItemDTO item : items) {
            if (item != null && item.getAnnualAmount() != null) {
                sum = sum.add(item.getAnnualAmount());
            }
        }
        return sum.setScale(2, RoundingMode.HALF_UP);
    }
}
