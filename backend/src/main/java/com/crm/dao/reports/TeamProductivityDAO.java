package com.crm.dao.reports;

import com.crm.config.DatabaseConfig;

import java.math.RoundingMode;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.temporal.TemporalAdjusters;
import java.util.*;

public class TeamProductivityDAO {

    public static class WeekInfo {
        public int weekIndex;
        public String weekCode;
        public String label;
        public LocalDate startDate;
        public LocalDate endDate;

        public WeekInfo(int weekIndex, String weekCode, String label, LocalDate startDate, LocalDate endDate) {
            this.weekIndex = weekIndex;
            this.weekCode = weekCode;
            this.label = label;
            this.startDate = startDate;
            this.endDate = endDate;
        }

        public Map<String, Object> toMap() {
            Map<String, Object> map = new LinkedHashMap<>();
            map.put("weekIndex", weekIndex);
            map.put("weekCode", weekCode);
            map.put("label", label);
            map.put("startDate", startDate.format(DateTimeFormatter.ISO_LOCAL_DATE));
            map.put("endDate", endDate.format(DateTimeFormatter.ISO_LOCAL_DATE));
            return map;
        }
    }

    public static class PeriodDef {
        public String periodCode;
        public String periodLabel;
        public LocalDate startDate;
        public LocalDate endDate;
        public List<WeekInfo> weeks = new ArrayList<>();
    }

    public PeriodDef resolvePeriod(String periodCode, Integer customYear, Integer customMonth) {
        LocalDate today = LocalDate.now();
        PeriodDef p = new PeriodDef();
        String code = (periodCode != null ? periodCode.trim().toUpperCase() : "THIS_MONTH");
        p.periodCode = code;

        int curYear = (customYear != null && customYear > 0) ? customYear : today.getYear();

        LocalDate firstDay;
        LocalDate lastDay;

        if ("LAST_MONTH".equals(code)) {
            LocalDate lastM = today.minusMonths(1);
            firstDay = LocalDate.of(lastM.getYear(), lastM.getMonthValue(), 1);
            lastDay = firstDay.with(TemporalAdjusters.lastDayOfMonth());
            p.periodLabel = "Tháng " + firstDay.getMonthValue() + "/" + firstDay.getYear() + " (Tháng trước)";
        } else if ("THIS_QUARTER".equals(code)) {
            int q = (today.getMonthValue() - 1) / 3 + 1;
            int startM = (q - 1) * 3 + 1;
            firstDay = LocalDate.of(curYear, startM, 1);
            lastDay = firstDay.plusMonths(3).minusDays(1);
            p.periodLabel = "Quý " + q + "/" + curYear + " (Quý này)";
        } else if ("CUSTOM_MONTH".equals(code) || (customMonth != null && customMonth >= 1 && customMonth <= 12)) {
            int m = (customMonth != null ? customMonth : today.getMonthValue());
            firstDay = LocalDate.of(curYear, m, 1);
            lastDay = firstDay.with(TemporalAdjusters.lastDayOfMonth());
            p.periodLabel = "Tháng " + m + "/" + curYear;
        } else {
            // Default: THIS_MONTH
            firstDay = LocalDate.of(today.getYear(), today.getMonthValue(), 1);
            lastDay = firstDay.with(TemporalAdjusters.lastDayOfMonth());
            p.periodLabel = "Tháng " + today.getMonthValue() + "/" + today.getYear() + " (Tháng này)";
        }

        p.startDate = firstDay;
        p.endDate = lastDay;

        // Phân rã kỳ thành các tuần liên tiếp không chồng lấn
        DateTimeFormatter dFmt = DateTimeFormatter.ofPattern("dd/MM");
        LocalDate curStart = firstDay;
        int wIdx = 1;
        while (!curStart.isAfter(lastDay)) {
            // Ngày kết thúc tuần: Chủ nhật tiếp theo hoặc ngày cuối cùng của kỳ
            LocalDate curEnd = curStart.with(TemporalAdjusters.nextOrSame(DayOfWeek.SUNDAY));
            if (curEnd.isAfter(lastDay)) {
                curEnd = lastDay;
            }
            String wCode = "W" + wIdx;
            String label = "Tuần " + wIdx + " (" + curStart.format(dFmt) + " - " + curEnd.format(dFmt) + ")";
            p.weeks.add(new WeekInfo(wIdx, wCode, label, curStart, curEnd));
            wIdx++;
            curStart = curEnd.plusDays(1);
        }

        return p;
    }

    /**
     * Lấy danh sách phòng ban / nhóm kinh doanh có thể chọn
     */
    public List<Map<String, Object>> getAvailableTeams(long currentUserId) throws SQLException {
        String scopeSql = "SELECT team_id, data_scope FROM users WHERE id = ?";
        Long userTeamId = null;
        String dataScope = "SELF";

        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(scopeSql)) {
            ps.setLong(1, currentUserId);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    userTeamId = (Long) rs.getObject("team_id");
                    dataScope = rs.getString("data_scope");
                }
            }
        }

        List<Map<String, Object>> teams = new ArrayList<>();
        String teamSql = """
                SELECT t.id, t.name, COUNT(u.id) AS member_count
                FROM teams t
                LEFT JOIN users u ON u.team_id = t.id AND u.status = 'ACTIVE'
                """;

        if ("TEAM".equalsIgnoreCase(dataScope) && userTeamId != null) {
            teamSql += " WHERE (t.id = " + userTeamId + " OR t.parent_id = " + userTeamId + ")";
        }
        teamSql += " GROUP BY t.id, t.name ORDER BY t.name ASC";

        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(teamSql);
             ResultSet rs = ps.executeQuery()) {
            while (rs.next()) {
                Map<String, Object> map = new LinkedHashMap<>();
                map.put("id", rs.getLong("id"));
                map.put("name", rs.getString("name"));
                map.put("memberCount", rs.getInt("member_count"));
                teams.add(map);
            }
        }
        return teams;
    }

    /**
     * Lấy báo cáo hoạt động và năng suất nhóm (Cuộc gọi, Cuộc gặp, Báo giá theo tuần & Tỷ lệ SLA Lead)
     */
    public Map<String, Object> getTeamProductivityReport(
            long currentUserId,
            Long targetTeamId,
            String periodCode,
            Integer customYear,
            Integer customMonth
    ) throws SQLException {
        PeriodDef period = resolvePeriod(periodCode, customYear, customMonth);

        // 1. Kiểm tra data scope của user
        String scopeSql = "SELECT team_id, data_scope FROM users WHERE id = ?";
        Long userTeamId = null;
        String dataScope = "SELF";

        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(scopeSql)) {
            ps.setLong(1, currentUserId);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    userTeamId = (Long) rs.getObject("team_id");
                    dataScope = rs.getString("data_scope");
                }
            }
        }

        Long effectiveTeamId = targetTeamId;
        if ("TEAM".equalsIgnoreCase(dataScope)) {
            effectiveTeamId = (targetTeamId != null && targetTeamId > 0) ? targetTeamId : userTeamId;
        }

        // 2. Lấy danh sách thành viên cần báo cáo
        List<Map<String, Object>> members = loadMembers(effectiveTeamId);

        // 3. Tải số liệu cuộc gọi & cuộc gặp từ activities trong kỳ
        // Map: userId -> (weekCode -> (calls: X, meetings: Y))
        Map<Long, Map<String, int[]>> actMatrix = loadActivityMatrix(period);

        // 4. Tải số liệu báo giá gửi đi từ quotes trong kỳ
        // Map: userId -> (weekCode -> quotesSent: Z)
        Map<Long, Map<String, Integer>> quoteMatrix = loadQuoteMatrix(period);

        // 5. Tải dữ liệu phản hồi SLA Lead từ customers
        Map<Long, int[]> leadSlaStats = loadLeadSlaStats();

        // 6. Tổng hợp chi tiết cho từng thành viên
        int teamTotalCalls = 0;
        int teamTotalMeetings = 0;
        int teamTotalQuotes = 0;
        int teamTotalLeads = 0;
        int teamTotalInSla = 0;
        int needsCoachingCount = 0;

        List<Map<String, Object>> memberRows = new ArrayList<>();

        for (Map<String, Object> m : members) {
            long userId = ((Number) m.get("id")).longValue();
            String fullName = (String) m.get("fullName");
            String teamName = (String) m.get("teamName");

            Map<String, int[]> userAct = actMatrix.getOrDefault(userId, Collections.emptyMap());
            Map<String, Integer> userQuotes = quoteMatrix.getOrDefault(userId, Collections.emptyMap());

            Map<String, Map<String, Integer>> weeklyStats = new LinkedHashMap<>();
            int uTotCalls = 0;
            int uTotMeetings = 0;
            int uTotQuotes = 0;

            for (WeekInfo w : period.weeks) {
                int[] cm = userAct.getOrDefault(w.weekCode, new int[]{0, 0});
                int calls = cm[0];
                int meetings = cm[1];
                int quotes = userQuotes.getOrDefault(w.weekCode, 0);

                uTotCalls += calls;
                uTotMeetings += meetings;
                uTotQuotes += quotes;

                Map<String, Integer> ws = new LinkedHashMap<>();
                ws.put("calls", calls);
                ws.put("meetings", meetings);
                ws.put("quotes", quotes);
                ws.put("total", calls + meetings + quotes);
                weeklyStats.put(w.weekCode, ws);
            }

            int uTotActivities = uTotCalls + uTotMeetings + uTotQuotes;

            // SLA Stats
            int[] slaArr = leadSlaStats.getOrDefault(userId, new int[]{0, 0, 0});
            int totalLeads = slaArr[0];
            int inSlaLeads = slaArr[1];
            int breachedLeads = slaArr[2];

            double slaRate = 100.0;
            if (totalLeads > 0) {
                slaRate = Math.round((inSlaLeads * 100.0 / totalLeads) * 10.0) / 10.0;
            }

            // Đánh giá kèm cặp: SLA < 80% hoặc hoạt động quá thấp
            boolean needsCoaching = false;
            String coachingReason = "Hoạt động & SLA ổn định";
            String rating = "ĐẠT YÊU CẦU";

            if (totalLeads > 0 && slaRate < 80.0) {
                needsCoaching = true;
                coachingReason = "Tỷ lệ phản hồi SLA thấp (" + slaRate + "%)";
                rating = "CẦN KÈM CẶP";
            } else if (uTotCalls + uTotMeetings < 8) {
                needsCoaching = true;
                coachingReason = "Tương tác gọi & gặp khách quá thấp (" + uTotCalls + " gọi, " + uTotMeetings + " gặp)";
                rating = "CẦN KÈM CẶP";
            } else if (uTotQuotes == 0 && (uTotCalls + uTotMeetings >= 8)) {
                needsCoaching = true;
                coachingReason = "Chưa gửi được báo giá nào cho khách trong kỳ";
                rating = "CẦN KÈM CẶP";
            } else if (slaRate >= 90.0 && (uTotCalls + uTotMeetings >= 14)) {
                rating = "XUẤT SẮC";
                coachingReason = "Năng suất vượt bậc, phản hồi khách hàng nhanh";
            }

            if (needsCoaching) {
                needsCoachingCount++;
            }

            teamTotalCalls += uTotCalls;
            teamTotalMeetings += uTotMeetings;
            teamTotalQuotes += uTotQuotes;
            teamTotalLeads += totalLeads;
            teamTotalInSla += inSlaLeads;

            Map<String, Object> row = new LinkedHashMap<>();
            row.put("id", userId);
            row.put("fullName", fullName);
            row.put("teamName", teamName != null ? teamName : "Chưa phân nhóm");
            row.put("weeklyStats", weeklyStats);
            row.put("totalCalls", uTotCalls);
            row.put("totalMeetings", uTotMeetings);
            row.put("totalQuotes", uTotQuotes);
            row.put("totalActivities", uTotActivities);
            row.put("totalLeads", totalLeads);
            row.put("leadsInSla", inSlaLeads);
            row.put("leadsBreached", breachedLeads);
            row.put("slaRate", slaRate);
            row.put("needsCoaching", needsCoaching);
            row.put("coachingReason", coachingReason);
            row.put("productivityRating", rating);

            memberRows.add(row);
        }

        // Sắp xếp: Đưa người cần kèm cặp lên đầu để Trưởng nhóm dễ nhận diện, sau đó theo tổng hoạt động giảm dần
        memberRows.sort((a, b) -> {
            boolean aCoach = Boolean.TRUE.equals(a.get("needsCoaching"));
            boolean bCoach = Boolean.TRUE.equals(b.get("needsCoaching"));
            if (aCoach != bCoach) {
                return aCoach ? -1 : 1;
            }
            return Integer.compare((int) b.get("totalActivities"), (int) a.get("totalActivities"));
        });

        // 7. Tổng hợp tóm tắt KPI toàn nhóm
        double teamAvgSlaRate = teamTotalLeads > 0
                ? Math.round((teamTotalInSla * 100.0 / teamTotalLeads) * 10.0) / 10.0
                : 100.0;

        Map<String, Object> summary = new LinkedHashMap<>();
        summary.put("totalCalls", teamTotalCalls);
        summary.put("totalMeetings", teamTotalMeetings);
        summary.put("totalQuotes", teamTotalQuotes);
        summary.put("totalActivities", teamTotalCalls + teamTotalMeetings + teamTotalQuotes);
        summary.put("totalLeads", teamTotalLeads);
        summary.put("averageSlaRate", teamAvgSlaRate);
        summary.put("needsCoachingCount", needsCoachingCount);
        summary.put("totalMembers", members.size());

        List<Map<String, Object>> weekList = new ArrayList<>();
        for (WeekInfo w : period.weeks) {
            weekList.add(w.toMap());
        }

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("periodCode", period.periodCode);
        result.put("periodLabel", period.periodLabel);
        result.put("startDate", period.startDate.format(DateTimeFormatter.ISO_LOCAL_DATE));
        result.put("endDate", period.endDate.format(DateTimeFormatter.ISO_LOCAL_DATE));
        result.put("teamId", effectiveTeamId);
        result.put("teamName", getTeamName(effectiveTeamId));
        result.put("weeks", weekList);
        result.put("summary", summary);
        result.put("members", memberRows);

        return result;
    }

    private List<Map<String, Object>> loadMembers(Long teamId) throws SQLException {
        StringBuilder sql = new StringBuilder("""
                SELECT u.id, u.full_name, u.email, u.team_id, t.name AS team_name
                FROM users u
                LEFT JOIN teams t ON t.id = u.team_id
                WHERE u.status = 'ACTIVE' AND u.id != 1
                """);
        if (teamId != null && teamId > 0) {
            sql.append(" AND (u.team_id = ").append(teamId).append(" OR u.team_id IN (SELECT sub.id FROM teams sub WHERE sub.parent_id = ").append(teamId).append("))");
        }
        sql.append(" ORDER BY t.name ASC, u.full_name ASC");

        List<Map<String, Object>> list = new ArrayList<>();
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql.toString());
             ResultSet rs = ps.executeQuery()) {
            while (rs.next()) {
                Map<String, Object> map = new LinkedHashMap<>();
                map.put("id", rs.getLong("id"));
                map.put("fullName", rs.getString("full_name"));
                map.put("email", rs.getString("email"));
                map.put("teamId", rs.getObject("team_id"));
                map.put("teamName", rs.getString("team_name"));
                list.add(map);
            }
        }
        return list;
    }

    private Map<Long, Map<String, int[]>> loadActivityMatrix(PeriodDef period) throws SQLException {
        Map<Long, Map<String, int[]>> map = new HashMap<>();

        String sql = """
                SELECT a.owner_user_id, a.type, DATE(a.created_at) AS act_date, COUNT(*) AS cnt
                FROM activities a
                WHERE a.is_deleted = 0
                  AND a.type IN ('CALL', 'MEETING')
                  AND a.created_at >= ? AND a.created_at < ?
                GROUP BY a.owner_user_id, a.type, act_date
                """;

        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setDate(1, java.sql.Date.valueOf(period.startDate));
            ps.setDate(2, java.sql.Date.valueOf(period.endDate.plusDays(1)));

            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    long userId = rs.getLong("owner_user_id");
                    String type = rs.getString("type");
                    LocalDate actDate = rs.getDate("act_date").toLocalDate();
                    int count = rs.getInt("cnt");

                    // Xác định tuần chứa ngày này
                    for (WeekInfo w : period.weeks) {
                        if (!actDate.isBefore(w.startDate) && !actDate.isAfter(w.endDate)) {
                            Map<String, int[]> userWeeks = map.computeIfAbsent(userId, k -> new HashMap<>());
                            int[] cm = userWeeks.computeIfAbsent(w.weekCode, k -> new int[]{0, 0});
                            if ("CALL".equalsIgnoreCase(type)) {
                                cm[0] += count;
                            } else if ("MEETING".equalsIgnoreCase(type)) {
                                cm[1] += count;
                            }
                            break;
                        }
                    }
                }
            }
        }
        return map;
    }

    private Map<Long, Map<String, Integer>> loadQuoteMatrix(PeriodDef period) throws SQLException {
        Map<Long, Map<String, Integer>> map = new HashMap<>();

        String sql = """
                SELECT q.owner_user_id, DATE(COALESCE(q.sent_to_customer_at, q.created_at)) AS quote_date, COUNT(*) AS cnt
                FROM quotes q
                WHERE q.is_deleted = 0
                  AND (q.sent_to_customer_at IS NOT NULL OR q.status IN ('SENT', 'APPROVED', 'ACCEPTED'))
                  AND COALESCE(q.sent_to_customer_at, q.created_at) >= ?
                  AND COALESCE(q.sent_to_customer_at, q.created_at) < ?
                GROUP BY q.owner_user_id, quote_date
                """;

        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setDate(1, java.sql.Date.valueOf(period.startDate));
            ps.setDate(2, java.sql.Date.valueOf(period.endDate.plusDays(1)));

            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    long userId = rs.getLong("owner_user_id");
                    LocalDate qDate = rs.getDate("quote_date").toLocalDate();
                    int count = rs.getInt("cnt");

                    for (WeekInfo w : period.weeks) {
                        if (!qDate.isBefore(w.startDate) && !qDate.isAfter(w.endDate)) {
                            Map<String, Integer> userWeeks = map.computeIfAbsent(userId, k -> new HashMap<>());
                            userWeeks.put(w.weekCode, userWeeks.getOrDefault(w.weekCode, 0) + count);
                            break;
                        }
                    }
                }
            }
        }
        return map;
    }

    private Map<Long, int[]> loadLeadSlaStats() throws SQLException {
        Map<Long, int[]> map = new HashMap<>();

        String sql = """
                SELECT 
                    c.owner_user_id,
                    COUNT(*) AS total_leads,
                    SUM(CASE WHEN c.sla_breached = 0 THEN 1 ELSE 0 END) AS in_sla,
                    SUM(CASE WHEN c.sla_breached = 1 THEN 1 ELSE 0 END) AS breached
                FROM customers c
                WHERE c.is_deleted = 0
                  AND c.owner_user_id IS NOT NULL
                GROUP BY c.owner_user_id
                """;

        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql);
             ResultSet rs = ps.executeQuery()) {
            while (rs.next()) {
                long userId = rs.getLong("owner_user_id");
                int tot = rs.getInt("total_leads");
                int inSla = rs.getInt("in_sla");
                int br = rs.getInt("breached");
                map.put(userId, new int[]{tot, inSla, br});
            }
        }
        return map;
    }

    private String getTeamName(Long teamId) throws SQLException {
        if (teamId == null || teamId <= 0) {
            return "Toàn bộ nhóm kinh doanh";
        }
        String sql = "SELECT name FROM teams WHERE id = ?";
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setLong(1, teamId);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    return rs.getString("name");
                }
            }
        }
        return "Nhóm #" + teamId;
    }
}
