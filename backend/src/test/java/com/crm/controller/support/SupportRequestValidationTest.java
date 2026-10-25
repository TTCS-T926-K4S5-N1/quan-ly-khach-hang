package com.crm.controller.support;

import com.crm.dto.support.SupportRequestWrite;
import com.crm.service.support.SupportRequestService;
import com.google.gson.JsonParser;
import org.junit.jupiter.api.Test;
import java.time.LocalDateTime;
import static org.junit.jupiter.api.Assertions.*;

class SupportRequestValidationTest {
    private SupportRequestWrite input(String subject, String status, String priority, String dueAt, String resolution) {
        return new SupportRequestWrite(1L, subject, null, priority, status, dueAt, resolution);
    }

    @Test void defaultsAndTimezoneAreNormalized() {
        var r = input("  Bảo hành  ", null, null, "2026-10-13T10:00:00+07:00", null).validated();
        assertEquals("Bảo hành", r.subject());
        assertEquals("NORMAL", r.priority());
        assertEquals("OPEN", r.status());
        assertEquals(LocalDateTime.of(2026, 10, 13, 3, 0), r.dueAtUtc());
    }

    @Test void invalidDatesStatusesAndLengthsAreRejected() {
        for (String date : new String[]{"", "2026-02-30T12:00:00Z", "2026-10-13T10:00:00", "not a date"})
            assertThrows(IllegalArgumentException.class, () -> input("Help", "OPEN", "NORMAL", date, null).validated());
        assertThrows(IllegalArgumentException.class, () -> input("Help", "BOGUS", "NORMAL", null, null).validated());
        assertThrows(IllegalArgumentException.class, () -> input("Help", "OPEN", "BOGUS", null, null).validated());
        assertThrows(IllegalArgumentException.class, () -> input(" ", "OPEN", "NORMAL", null, null).validated());
        assertThrows(IllegalArgumentException.class, () -> input("x".repeat(256), "OPEN", "NORMAL", null, null).validated());
        assertThrows(IllegalArgumentException.class, () -> input("Help", "OPEN", "NORMAL", null, "x".repeat(10001)).validated());
    }

    @Test void completedRequestsRequireResolution() {
        for (String status : new String[]{"RESOLVED", "CLOSED"}) {
            assertThrows(IllegalArgumentException.class, () -> input("Help", status, "NORMAL", null, " ").validated());
            assertEquals(status, input("Help", status, "NORMAL", null, "Đã khắc phục").validated().status());
        }
    }

    @Test void rejectsInvalidIdsPaginationAndNestedPaths() {
        for (String path : new String[]{"/0", "/-1", "/1/other", "/risks", "/1.5", "/9223372036854775808"})
            assertThrows(IllegalArgumentException.class, () -> SupportRequestServlet.id(path));
        assertEquals(12, SupportRequestServlet.id("/12"));
        assertThrows(IllegalArgumentException.class, () -> SupportRequestService.pagination(0, 20));
        assertThrows(IllegalArgumentException.class, () -> SupportRequestService.pagination(1, 101));
        assertThrows(IllegalArgumentException.class, () -> SupportRequestService.pagination(1, 0));
    }

    @Test void bodyRejectsCoercionFractionalIdsAndOwnershipInjection() {
        for (String json : new String[]{"{\"customerId\":1.5}", "{\"customerId\":9223372036854775808}",
                "{\"customerId\":\"1\"}", "{\"subject\":1}", "{\"priority\":[]}", "{\"ownerUserId\":1}"})
            assertThrows(RuntimeException.class, () -> SupportRequestServlet.parseBody(JsonParser.parseString(json).getAsJsonObject()));
        var valid = SupportRequestServlet.parseBody(JsonParser.parseString("{\"customerId\":1,\"subject\":\"Help\"}").getAsJsonObject()).validated();
        assertEquals(1L, valid.customerId());
    }
}
