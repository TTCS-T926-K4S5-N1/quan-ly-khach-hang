package com.crm.dto.pipeline;

import org.junit.jupiter.api.Test;

import java.util.LinkedHashMap;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

/** SCRUM-108: Kiểm thử parse bộ lọc xuất Excel. */
class OpportunityExportFilterTest {

    @Test
    void parsesScreenFiltersAndCustomFields() {
        Map<String, String[]> params = new LinkedHashMap<>();
        params.put("keyword", new String[]{"  CRM  "});
        params.put("owner", new String[]{"me"});
        params.put("stageId", new String[]{"3"});
        params.put("status", new String[]{"won"});
        params.put("cf_nguon", new String[]{"Website"});
        params.put("cf_khu_vuc", new String[]{"  "});

        OpportunityExportFilter f = OpportunityExportFilter.fromParameters(params);
        assertEquals("CRM", f.getKeyword());
        assertTrue(f.isOnlyMine());
        assertEquals(3L, f.getStageId());
        assertEquals("WON", f.getStatus());
        assertEquals(Map.of("nguon", "Website"), f.getCustomFieldFilters());
    }

    @Test
    void emptyParamsMeanNoFilter() {
        OpportunityExportFilter f = OpportunityExportFilter.fromParameters(Map.of());
        assertNull(f.getKeyword());
        assertFalse(f.isOnlyMine());
        assertNull(f.getStageId());
        assertNull(f.getStatus());
        assertTrue(f.getCustomFieldFilters().isEmpty());
        assertEquals("Tất cả", f.describe().get("Trạng thái"));
    }

    @Test
    void ownerTeamIsNotOnlyMine() {
        OpportunityExportFilter f = OpportunityExportFilter.fromParameters(Map.of("owner", new String[]{"Nhóm"}));
        assertFalse(f.isOnlyMine());
    }

    @Test
    void rejectsInvalidInput() {
        assertThrows(IllegalArgumentException.class,
                () -> OpportunityExportFilter.fromParameters(Map.of("stageId", new String[]{"abc"})));
        assertThrows(IllegalArgumentException.class,
                () -> OpportunityExportFilter.fromParameters(Map.of("status", new String[]{"DROP TABLE"})));
        assertThrows(IllegalArgumentException.class,
                () -> OpportunityExportFilter.fromParameters(Map.of("cf_bad key'", new String[]{"x"})));
    }
}
