package com.crm.service.pipeline;

import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

/**
 * SCRUM-75: Unit tests cho logic chuyển giai đoạn và quyền ghi đè (Override).
 */
class OpportunityStageTransitionTest {

    @Test
    void stageConditionViolationException_retainsAllMetadata() {
        List<String> missing = List.of(
                "Chưa có cuộc gặp nào được ghi nhận cho cơ hội này",
                "Chưa có thông tin người liên hệ"
        );

        StageConditionViolationException ex = new StageConditionViolationException(
                "Không thể chuyển giai đoạn. Còn thiếu điều kiện bắt buộc: Chưa có cuộc gặp nào được ghi nhận cho cơ hội này, Chưa có thông tin người liên hệ",
                true,
                missing,
                "Mới tiếp cận",
                "Đủ điều kiện",
                "Phải có ít nhất một cuộc gặp được ghi nhận"
        );

        assertTrue(ex.isCanOverride());
        assertEquals(2, ex.getMissingConditions().size());
        assertEquals("Mới tiếp cận", ex.getCurrentStageName());
        assertEquals("Đủ điều kiện", ex.getTargetStageName());
        assertEquals("Phải có ít nhất một cuộc gặp được ghi nhận", ex.getExitCondition());
        assertTrue(ex.getMessage().contains("Không thể chuyển giai đoạn"));
    }

    @Test
    void stageConditionViolationException_whenCannotOverride_flagIsFalse() {
        List<String> missing = List.of("Chưa có cuộc gặp nào được ghi nhận cho cơ hội này");

        StageConditionViolationException ex = new StageConditionViolationException(
                "Không thể chuyển giai đoạn",
                false,
                missing,
                "Mới tiếp cận",
                "Đủ điều kiện",
                "Phải có ít nhất một cuộc gặp"
        );

        assertFalse(ex.isCanOverride());
        assertEquals(1, ex.getMissingConditions().size());
    }

    @Test
    void validationResult_handlesImmutableCollections() {
        StageConditionValidator.ValidationResult valid = StageConditionValidator.ValidationResult.valid("Giai đoạn A", "Điều kiện");
        assertTrue(valid.isValid());
        assertTrue(valid.missingConditions().isEmpty());

        StageConditionValidator.ValidationResult invalid = StageConditionValidator.ValidationResult.invalid(
                List.of("Thiếu điều kiện A"),
                "Giai đoạn B",
                "Cần điều kiện A"
        );
        assertFalse(invalid.isValid());
        assertEquals(1, invalid.missingConditions().size());
        assertEquals("Thiếu điều kiện A", invalid.missingConditions().get(0));
    }
}
