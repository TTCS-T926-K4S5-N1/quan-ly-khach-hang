package com.crm.service.activities;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class ActivityServiceTest {

    private final ActivityService service = new ActivityService();

    @Test
    void createRequiresNonBlankSubject() {
        IllegalArgumentException ex1 = assertThrows(IllegalArgumentException.class, () ->
                service.create(1L, null, "CALL", "Desc", "OPEN", null, null, null));
        assertEquals("Tiêu đề hoạt động là bắt buộc.", ex1.getMessage());

        IllegalArgumentException ex2 = assertThrows(IllegalArgumentException.class, () ->
                service.create(1L, "   ", "CALL", "Desc", "OPEN", null, null, null));
        assertEquals("Tiêu đề hoạt động là bắt buộc.", ex2.getMessage());
    }

    @Test
    void updateRequiresNonBlankSubject() {
        IllegalArgumentException ex1 = assertThrows(IllegalArgumentException.class, () ->
                service.update(1L, 10L, null, "CALL", "Desc", "OPEN", null));
        assertEquals("Tiêu đề hoạt động là bắt buộc.", ex1.getMessage());

        IllegalArgumentException ex2 = assertThrows(IllegalArgumentException.class, () ->
                service.update(1L, 10L, "", "CALL", "Desc", "OPEN", null));
        assertEquals("Tiêu đề hoạt động là bắt buộc.", ex2.getMessage());
    }
}
