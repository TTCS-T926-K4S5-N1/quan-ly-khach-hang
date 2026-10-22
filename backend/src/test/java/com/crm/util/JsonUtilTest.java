package com.crm.util;

import org.junit.jupiter.api.Test;
import java.util.List;
import java.util.Map;
import static org.junit.jupiter.api.Assertions.*;

class JsonUtilTest {
    @Test void preservesQuoteItemsAndNumbers() {
        Map<String, Object> body = JsonUtil.getGson().fromJson(
                "{\"items\":[{\"productId\":12,\"quantity\":2,\"unitPrice\":150.5,\"note\":\"Tiếng Việt\"}]}",
                JsonUtil.OBJECT_MAP_TYPE);
        var rows = JsonUtil.objectList(body.get("items"));
        assertEquals(12.0, rows.getFirst().get("productId"));
        assertEquals(150.5, rows.getFirst().get("unitPrice"));
        assertEquals("Tiếng Việt", rows.getFirst().get("note"));
        assertEquals(body.get("items"), rows);
    }

    @Test void preservesMissingAndEmptyItems() {
        assertNull(JsonUtil.objectList(null));
        assertEquals(List.of(), JsonUtil.objectList(List.of()));
    }

    @Test void rejectsInvalidContainersElementsAndKeys() {
        for (Object invalid : List.of("bad", Map.of(), List.of(1), List.of(Map.of(1, "bad")))) {
            assertThrows(IllegalArgumentException.class, () -> JsonUtil.objectList(invalid));
        }
        assertThrows(IllegalArgumentException.class,
                () -> JsonUtil.objectList(java.util.Arrays.asList((Object) null)));
    }
}
