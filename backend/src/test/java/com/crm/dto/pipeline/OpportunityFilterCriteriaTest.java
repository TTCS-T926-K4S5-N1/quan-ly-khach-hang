package com.crm.dto.pipeline;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDate;

import static org.junit.jupiter.api.Assertions.*;

@DisplayName("Unit Tests: OpportunityFilterCriteria")
public class OpportunityFilterCriteriaTest {

    @Test
    @DisplayName("resolveDateRange: Tự động tính khoảng ngày tuần này (THIS_WEEK)")
    void testResolveDateRangeThisWeek() {
        OpportunityFilterCriteria criteria = new OpportunityFilterCriteria();
        criteria.setQuickDate("THIS_WEEK");
        criteria.resolveDateRange();

        assertNotNull(criteria.getCloseDateFrom(), "closeDateFrom không được null");
        assertNotNull(criteria.getCloseDateTo(), "closeDateTo không được null");

        LocalDate from = LocalDate.parse(criteria.getCloseDateFrom());
        LocalDate to = LocalDate.parse(criteria.getCloseDateTo());

        assertTrue(from.isBefore(to) || from.isEqual(to), "closeDateFrom phải trước hoặc bằng closeDateTo");
        assertEquals(java.time.DayOfWeek.MONDAY, from.getDayOfWeek(), "Đầu tuần phải là Thứ 2");
        assertEquals(java.time.DayOfWeek.SUNDAY, to.getDayOfWeek(), "Cuối tuần phải là Chủ nhật");
    }

    @Test
    @DisplayName("resolveDateRange: Tự động tính khoảng ngày tháng này (THIS_MONTH)")
    void testResolveDateRangeThisMonth() {
        OpportunityFilterCriteria criteria = new OpportunityFilterCriteria();
        criteria.setQuickDate("THIS_MONTH");
        criteria.resolveDateRange();

        assertNotNull(criteria.getCloseDateFrom());
        assertNotNull(criteria.getCloseDateTo());

        LocalDate from = LocalDate.parse(criteria.getCloseDateFrom());
        LocalDate to = LocalDate.parse(criteria.getCloseDateTo());

        assertEquals(1, from.getDayOfMonth(), "Đầu tháng phải là ngày 1");
        assertEquals(from.lengthOfMonth(), to.getDayOfMonth(), "Cuối tháng phải là ngày cuối cùng");
    }

    @Test
    @DisplayName("resolveDateRange: Không ghi đè nếu người dùng đã chỉ định ngày cụ thể")
    void testCustomDateNotOverwritten() {
        OpportunityFilterCriteria criteria = new OpportunityFilterCriteria();
        criteria.setQuickDate("THIS_WEEK");
        criteria.setCloseDateFrom("2026-10-01");
        criteria.setCloseDateTo("2026-10-15");
        criteria.resolveDateRange();

        assertEquals("2026-10-01", criteria.getCloseDateFrom());
        assertEquals("2026-10-15", criteria.getCloseDateTo());
    }

    @Test
    @DisplayName("Criteria: Setters và Getters cho các điều kiện lọc")
    void testCriteriaFields() {
        OpportunityFilterCriteria criteria = new OpportunityFilterCriteria();
        criteria.setKeyword("Công nghệ");
        criteria.setStageId(3L);
        criteria.setStatus("OPEN");
        criteria.setMinAmount(new BigDecimal("50000000"));
        criteria.setMaxAmount(new BigDecimal("200000000"));
        criteria.setProductId(10L);
        criteria.setOwnerId(5L);
        criteria.setOwnerFilter("MINE");
        criteria.setPage(2);
        criteria.setSize(50);

        assertEquals("Công nghệ", criteria.getKeyword());
        assertEquals(3L, criteria.getStageId());
        assertEquals("OPEN", criteria.getStatus());
        assertEquals(new BigDecimal("50000000"), criteria.getMinAmount());
        assertEquals(new BigDecimal("200000000"), criteria.getMaxAmount());
        assertEquals(10L, criteria.getProductId());
        assertEquals(5L, criteria.getOwnerId());
        assertEquals("MINE", criteria.getOwnerFilter());
        assertEquals(2, criteria.getPage());
        assertEquals(50, criteria.getSize());
    }

    @Test
    @DisplayName("Criteria: Default pagination an toàn")
    void testDefaultPagination() {
        OpportunityFilterCriteria criteria = new OpportunityFilterCriteria();
        criteria.setPage(-5);
        criteria.setSize(0);

        assertEquals(1, criteria.getPage());
        assertEquals(100, criteria.getSize());
    }
}
