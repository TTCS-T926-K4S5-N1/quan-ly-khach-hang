package com.crm.service.support;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.Map;

public final class SupportRisk {
    private SupportRisk() { }

    public static Map<String, Object> from(ResultSet rs) throws SQLException {
        long open = rs.getLong("open_count");
        long urgent = rs.getLong("urgent_count");
        long overdue = rs.getLong("overdue_count");
        var reasons = new ArrayList<String>();
        if (urgent > 0) reasons.add("URGENT_OPEN_REQUEST");
        if (overdue > 0) reasons.add("OVERDUE_REQUEST");
        if (open >= 3) reasons.add("MULTIPLE_OPEN_REQUESTS");
        var risk = new LinkedHashMap<String, Object>();
        risk.put("atRisk", rs.getBoolean("at_risk"));
        risk.put("reasons", reasons);
        risk.put("openCount", open);
        risk.put("urgentCount", urgent);
        risk.put("overdueCount", overdue);
        return risk;
    }
}
