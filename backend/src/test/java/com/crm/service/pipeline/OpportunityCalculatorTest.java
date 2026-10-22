package com.crm.service.pipeline;

import com.crm.dto.pipeline.OpportunityItemDTO;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

class OpportunityCalculatorTest {

    @Test
    @DisplayName("Giá niêm yết được lấy mặc định từ danh mục sản phẩm nếu không nhập đơn giá")
    void defaultUnitPriceFromCatalogListPrice() {
        OpportunityItemDTO item = new OpportunityItemDTO();
        item.setProductId(1L);
        item.setQuantity(new BigDecimal("3"));
        // unitPrice is null

        Map<String, Object> catalog = Map.of(
                "id", 1L,
                "code", "CRM-SEAT-STD",
                "name", "CRM Standard",
                "unit", "User/tháng",
                "type", "RECURRING",
                "listPrice", new BigDecimal("150000.00")
        );

        OpportunityCalculator.computeItemAmounts(item, catalog);

        assertEquals(new BigDecimal("150000.00"), item.getUnitPrice());
        assertEquals(new BigDecimal("150000.00"), item.getListPrice());
        assertEquals("RECURRING", item.getProductType());
        assertEquals("MONTHLY", item.getBillingCycle());
        assertEquals(12, item.getTermCount());
        // 3 users * 150,000 * 12 months = 5,400,000
        assertEquals(new BigDecimal("5400000.00"), item.getTotalAmount());
        // ACV = 5,400,000
        assertEquals(new BigDecimal("5400000.00"), item.getAnnualAmount());
    }

    @Test
    @DisplayName("Nhân viên kinh doanh có thể ghi đè đơn giá khác giá niêm yết")
    void customUnitPriceOverridesListPrice() {
        OpportunityItemDTO item = new OpportunityItemDTO();
        item.setProductId(1L);
        item.setQuantity(new BigDecimal("2"));
        item.setUnitPrice(new BigDecimal("125000.00")); // Thấp hơn hoặc khác giá niêm yết

        Map<String, Object> catalog = Map.of(
                "listPrice", new BigDecimal("150000.00"),
                "type", "RECURRING"
        );

        OpportunityCalculator.computeItemAmounts(item, catalog);

        assertEquals(new BigDecimal("125000.00"), item.getUnitPrice());
        assertEquals(new BigDecimal("150000.00"), item.getListPrice());
        // 2 users * 125,000 * 12 months = 3,000,000
        assertEquals(new BigDecimal("3000000.00"), item.getTotalAmount());
        assertEquals(new BigDecimal("3000000.00"), item.getAnnualAmount());
    }

    @Test
    @DisplayName("Dịch vụ một lần (ONE_TIME) tính đúng số lượng và chiết khấu, ACV = 0")
    void oneTimeProductCalculationWithDiscount() {
        OpportunityItemDTO item = new OpportunityItemDTO();
        item.setProductId(2L);
        item.setProductType("ONE_TIME");
        item.setQuantity(new BigDecimal("2"));
        item.setUnitPrice(new BigDecimal("20000000.00"));
        item.setDiscountPercent(new BigDecimal("10")); // 10%

        OpportunityCalculator.computeItemAmounts(item, null);

        assertEquals("ONE_TIME", item.getProductType());
        assertEquals("ONE_TIME", item.getBillingCycle());
        assertEquals(1, item.getTermCount());
        // 2 * 20,000,000 * 0.9 = 36,000,000
        assertEquals(new BigDecimal("36000000.00"), item.getTotalAmount());
        assertEquals(BigDecimal.ZERO, item.getAnnualAmount());
    }

    @Test
    @DisplayName("Dịch vụ thuê bao 24 kỳ (2 năm): tổng giá trị hợp đồng và giá trị theo năm (ACV) được tính chuẩn xác")
    void subscriptionTwoYearsCalculation() {
        OpportunityItemDTO item = new OpportunityItemDTO();
        item.setProductId(3L);
        item.setProductType("RECURRING");
        item.setBillingCycle("MONTHLY");
        item.setTermCount(24); // 24 tháng
        item.setQuantity(new BigDecimal("10"));
        item.setUnitPrice(new BigDecimal("350000.00"));
        item.setDiscountPercent(new BigDecimal("5.00")); // 5%

        OpportunityCalculator.computeItemAmounts(item, null);

        // 10 users * 350,000 * 24 months = 84,000,000
        // Chiết khấu 5% = 4,200,000 -> Tổng HĐ = 79,800,000
        assertEquals(new BigDecimal("79800000.00"), item.getTotalAmount());
        // Giá trị hợp đồng theo năm (ACV = 1 năm = 12 tháng)
        // 10 users * 350,000 * 12 * 0.95 = 39,900,000
        assertEquals(new BigDecimal("39900000.00"), item.getAnnualAmount());
    }

    @Test
    @DisplayName("Dịch vụ thuê bao cho phép khai báo trực tiếp số kỳ và giá trị hợp đồng theo năm")
    void subscriptionWithExplicitAnnualAmount() {
        OpportunityItemDTO item = new OpportunityItemDTO();
        item.setProductId(4L);
        item.setProductType("RECURRING");
        item.setBillingCycle("MONTHLY");
        item.setTermCount(36); // 36 kỳ
        item.setQuantity(new BigDecimal("1"));
        item.setUnitPrice(new BigDecimal("1000000.00"));
        item.setAnnualAmount(new BigDecimal("15000000.00")); // Khai báo giá trị hợp đồng theo năm riêng

        OpportunityCalculator.computeItemAmounts(item, null);

        assertEquals(36, item.getTermCount());
        assertEquals(new BigDecimal("36000000.00"), item.getTotalAmount());
        // Giá trị hợp đồng theo năm được bảo toàn đúng như nhân viên kinh doanh khai báo
        assertEquals(new BigDecimal("15000000.00"), item.getAnnualAmount());
    }

    @Test
    @DisplayName("Dịch vụ thuê bao theo quý (QUARTERLY)")
    void subscriptionQuarterlyCalculation() {
        OpportunityItemDTO item = new OpportunityItemDTO();
        item.setProductId(5L);
        item.setProductType("RECURRING");
        item.setBillingCycle("QUARTERLY");
        item.setTermCount(4); // 4 quý = 1 năm
        item.setQuantity(new BigDecimal("2"));
        item.setUnitPrice(new BigDecimal("5000000.00"));

        OpportunityCalculator.computeItemAmounts(item, null);

        // 2 * 5,000,000 * 4 = 40,000,000
        assertEquals(new BigDecimal("40000000.00"), item.getTotalAmount());
        // ACV (4 quý/năm) = 40,000,000
        assertEquals(new BigDecimal("40000000.00"), item.getAnnualAmount());
    }

    @Test
    @DisplayName("Giá trị cơ hội tự động tính lại tổng từ tất cả các dòng sản phẩm")
    void sumTotalAndAnnualOpportunityAmounts() {
        OpportunityItemDTO line1 = new OpportunityItemDTO();
        line1.setTotalAmount(new BigDecimal("42000000.00"));
        line1.setAnnualAmount(new BigDecimal("42000000.00"));

        OpportunityItemDTO line2 = new OpportunityItemDTO();
        line2.setTotalAmount(new BigDecimal("25000000.00"));
        line2.setAnnualAmount(BigDecimal.ZERO);

        OpportunityItemDTO line3 = new OpportunityItemDTO();
        line3.setTotalAmount(new BigDecimal("18000000.00"));
        line3.setAnnualAmount(new BigDecimal("18000000.00"));

        List<OpportunityItemDTO> items = List.of(line1, line2, line3);

        BigDecimal total = OpportunityCalculator.sumTotalAmount(items);
        BigDecimal annualTotal = OpportunityCalculator.sumAnnualAmount(items);

        assertEquals(new BigDecimal("85000000.00"), total);
        assertEquals(new BigDecimal("60000000.00"), annualTotal);
    }
}
