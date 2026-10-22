package com.crm.service.pipeline;

import com.crm.dao.pipeline.OpportunityDAO;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.sql.SQLException;
import java.util.HashMap;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

/**
 * SCRUM-75: Unit tests cho StageConditionValidator.
 * Kiểm tra các tiêu chí thẩm định điều kiện bắt buộc rời giai đoạn bán hàng.
 */
class StageConditionValidatorTest {

    private OpportunityDAO mockOpportunityDAO;
    private StageConditionValidator validator;

    // Giả lập OpportunityDAO cho Unit Test mà không cần kết nối DB
    static class StubOpportunityDAO extends OpportunityDAO {
        int meetingCount = 0;
        int callCount = 0;
        int quoteCount = 0;

        @Override
        public int countActivities(long opportunityId, Long customerId, String type) throws SQLException {
            if ("MEETING".equalsIgnoreCase(type)) return meetingCount;
            if ("CALL".equalsIgnoreCase(type)) return callCount;
            return 0;
        }

        @Override
        public int countQuotes(long opportunityId) throws SQLException {
            return quoteCount;
        }
    }

    private StubOpportunityDAO stubDAO;

    @BeforeEach
    void setUp() {
        stubDAO = new StubOpportunityDAO();
        validator = new StageConditionValidator(stubDAO);
    }

    @Test
    void whenConditionNotRequired_thenAlwaysValid() throws Exception {
        Map<String, Object> stage = new HashMap<>();
        stage.put("name", "Mới tiếp cận");
        stage.put("exitCondition", "Phải có ít nhất một cuộc gặp");
        stage.put("conditionRequired", false);

        Map<String, Object> opp = new HashMap<>();
        opp.put("id", 100L);

        var result = validator.validateExitConditions(stage, opp);
        assertTrue(result.isValid());
        assertTrue(result.missingConditions().isEmpty());
    }

    @Test
    void whenMeetingRequired_andNoMeeting_thenInvalid() throws Exception {
        Map<String, Object> stage = new HashMap<>();
        stage.put("name", "Mới tiếp cận");
        stage.put("exitCondition", "Phải có ít nhất một cuộc gặp được ghi nhận");
        stage.put("conditionRequired", true);

        Map<String, Object> opp = new HashMap<>();
        opp.put("id", 100L);
        opp.put("customerId", 10L);

        stubDAO.meetingCount = 0;

        var result = validator.validateExitConditions(stage, opp);
        assertFalse(result.isValid());
        assertEquals(1, result.missingConditions().size());
        assertTrue(result.missingConditions().get(0).contains("cuộc gặp"));
    }

    @Test
    void whenMeetingRequired_andMeetingRecorded_thenValid() throws Exception {
        Map<String, Object> stage = new HashMap<>();
        stage.put("name", "Mới tiếp cận");
        stage.put("exitCondition", "Phải có ít nhất một cuộc gặp được ghi nhận");
        stage.put("conditionRequired", true);

        Map<String, Object> opp = new HashMap<>();
        opp.put("id", 100L);
        opp.put("customerId", 10L);

        stubDAO.meetingCount = 1;

        var result = validator.validateExitConditions(stage, opp);
        assertTrue(result.isValid());
        assertTrue(result.missingConditions().isEmpty());
    }

    @Test
    void whenContactRequired_andMissingContact_thenInvalid() throws Exception {
        Map<String, Object> stage = new HashMap<>();
        stage.put("name", "Đủ điều kiện");
        stage.put("exitCondition", "Phải có thông tin người liên hệ");
        stage.put("conditionRequired", true);

        Map<String, Object> opp = new HashMap<>();
        opp.put("id", 101L);
        opp.put("contactName", null);

        var result = validator.validateExitConditions(stage, opp);
        assertFalse(result.isValid());
        assertTrue(result.missingConditions().get(0).contains("người liên hệ"));

        // Khi có contactName
        opp.put("contactName", "Nguyễn Văn A");
        var validResult = validator.validateExitConditions(stage, opp);
        assertTrue(validResult.isValid());
    }

    @Test
    void whenQuoteRequired_andNoQuote_thenInvalid() throws Exception {
        Map<String, Object> stage = new HashMap<>();
        stage.put("name", "Đề xuất giải pháp");
        stage.put("exitCondition", "Bắt buộc phải có báo giá");
        stage.put("conditionRequired", true);

        Map<String, Object> opp = new HashMap<>();
        opp.put("id", 102L);

        stubDAO.quoteCount = 0;
        var result = validator.validateExitConditions(stage, opp);
        assertFalse(result.isValid());
        assertTrue(result.missingConditions().get(0).contains("báo giá"));

        stubDAO.quoteCount = 1;
        var validResult = validator.validateExitConditions(stage, opp);
        assertTrue(validResult.isValid());
    }

    @Test
    void whenAmountRequired_andAmountZeroOrNull_thenInvalid() throws Exception {
        Map<String, Object> stage = new HashMap<>();
        stage.put("name", "Thương lượng");
        stage.put("exitCondition", "Phải nhập số tiền giá trị cơ hội");
        stage.put("conditionRequired", true);

        Map<String, Object> opp = new HashMap<>();
        opp.put("id", 103L);
        opp.put("amount", BigDecimal.ZERO);

        var result = validator.validateExitConditions(stage, opp);
        assertFalse(result.isValid());

        opp.put("amount", new BigDecimal("50000000"));
        var validResult = validator.validateExitConditions(stage, opp);
        assertTrue(validResult.isValid());
    }
}
