package com.crm.dao.forecast;

import com.crm.config.DatabaseConfig;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.*;

public class ForecastDAO {

    public static class PeriodRange {
        public String periodCode;
        public String periodLabel;
        public LocalDate startDate;
        public LocalDate endDate;
        public int year;
        public Integer month;     // null if quarter
        public int quarter;

        public String getStartDateStr() {
            return startDate.format(DateTimeFormatter.ISO_LOCAL_DATE);
        }

        public String getEndDateStr() {
            return endDate.format(DateTimeFormatter.ISO_LOCAL_DATE);
        }
    }

    public PeriodRange resolvePeriod(String periodCode) {
        LocalDate today = LocalDate.now();
        PeriodRange pr = new PeriodRange();
        pr.periodCode = (periodCode != null ? periodCode.trim().toUpperCase() : "THIS_MONTH");

        if ("NEXT_MONTH".equals(pr.periodCode)) {
            LocalDate nextM = today.plusMonths(1);
            pr.year = nextM.getYear();
            pr.month = nextM.getMonthValue();
            pr.quarter = (pr.month - 1) / 3 + 1;
            pr.startDate = LocalDate.of(pr.year, pr.month, 1);
            pr.endDate = pr.startDate.plusMonths(1).minusDays(1);
            pr.periodLabel = "Tháng " + pr.month + "/" + pr.year + " (Tháng sau)";
        } else if ("THIS_QUARTER".equals(pr.periodCode)) {
            pr.year = today.getYear();
            pr.month = null;
            pr.quarter = (today.getMonthValue() - 1) / 3 + 1;
            int startM = (pr.quarter - 1) * 3 + 1;
            pr.startDate = LocalDate.of(pr.year, startM, 1);
            pr.endDate = pr.startDate.plusMonths(3).minusDays(1);
            pr.periodLabel = "Quý " + pr.quarter + "/" + pr.year + " (Quý này)";
        } else {
            // Default: THIS_MONTH
            pr.periodCode = "THIS_MONTH";
            pr.year = today.getYear();
            pr.month = today.getMonthValue();
            pr.quarter = (pr.month - 1) / 3 + 1;
            pr.startDate = LocalDate.of(pr.year, pr.month, 1);
            pr.endDate = pr.startDate.plusMonths(1).minusDays(1);
            pr.periodLabel = "Tháng " + pr.month + "/" + pr.year + " (Tháng này)";
        }
        return pr;
    }

    /**
     * Lấy dữ liệu dự báo tổng hợp kèm danh sách phân rã theo Nhân viên hoặc Nhóm
     */
    public Map<String, Object> getForecastReport(PeriodRange period, String groupBy) throws SQLException {
        boolean isGroupByTeam = "TEAM".equalsIgnoreCase(groupBy);

        // 1. Lấy chỉ tiêu (sales_targets) cho kỳ
        Map<Long, BigDecimal> userTargets = new HashMap<>();
        Map<Long, BigDecimal> teamTargets = new HashMap<>();
        loadTargets(period, userTargets, teamTargets);

        // 2. Lấy doanh số đã chốt thực tế (Won Deals) trong kỳ (theo actual_close_date)
        Map<Long, DealMetric> userWon = new HashMap<>();
        Map<Long, DealMetric> teamWon = new HashMap<>();
        loadWonDeals(period, userWon, teamWon);

        // 3. Lấy cơ hội đang mở (Open Deals) tính dự báo theo trọng số xác suất
        Map<Long, DealMetric> userForecast = new HashMap<>();
        Map<Long, DealMetric> teamForecast = new HashMap<>();
        loadOpenForecastDeals(period, userForecast, teamForecast);

        // 4. Tổ chức danh sách phân rã
        List<Map<String, Object>> breakdownList = new ArrayList<>();
        BigDecimal totalTarget = BigDecimal.ZERO;
        BigDecimal totalWon = BigDecimal.ZERO;
        BigDecimal totalWeighted = BigDecimal.ZERO;
        BigDecimal totalPipeline = BigDecimal.ZERO;
        int totalWonDeals = 0;
        int totalOpenDeals = 0;

        if (isGroupByTeam) {
            List<Map<String, Object>> allTeams = getAllTeams();
            for (Map<String, Object> t : allTeams) {
                long teamId = ((Number) t.get("id")).longValue();
                String teamName = (String) t.get("name");
                int memberCount = ((Number) t.get("memberCount")).intValue();

                BigDecimal target = teamTargets.getOrDefault(teamId, BigDecimal.ZERO);
                // Nếu chưa có target riêng cho team, cộng dồn target của các thành viên trong team
                if (target.compareTo(BigDecimal.ZERO) <= 0) {
                    target = getTeamSummedUserTarget(teamId, userTargets);
                }

                DealMetric won = teamWon.getOrDefault(teamId, new DealMetric());
                DealMetric forecast = teamForecast.getOrDefault(teamId, new DealMetric());

                BigDecimal wonAmt = won.amount;
                BigDecimal weightedAmt = forecast.weightedAmount;
                BigDecimal pipelineAmt = forecast.amount;
                BigDecimal projected = wonAmt.add(weightedAmt);

                double achievementPct = 0.0;
                if (target.compareTo(BigDecimal.ZERO) > 0) {
                    achievementPct = projected.multiply(BigDecimal.valueOf(100))
                            .divide(target, 1, RoundingMode.HALF_UP).doubleValue();
                }

                String statusEvaluation = evaluateStatus(achievementPct);

                Map<String, Object> row = new LinkedHashMap<>();
                row.put("id", teamId);
                row.put("name", teamName);
                row.put("memberCount", memberCount);
                row.put("targetAmount", target);
                row.put("wonAmount", wonAmt);
                row.put("wonDealsCount", won.count);
                row.put("pipelineAmount", pipelineAmt);
                row.put("weightedForecastAmount", weightedAmt);
                row.put("openDealsCount", forecast.count);
                row.put("totalProjectedAmount", projected);
                row.put("achievementPercent", achievementPct);
                row.put("statusEvaluation", statusEvaluation);

                breakdownList.add(row);

                totalTarget = totalTarget.add(target);
                totalWon = totalWon.add(wonAmt);
                totalWeighted = totalWeighted.add(weightedAmt);
                totalPipeline = totalPipeline.add(pipelineAmt);
                totalWonDeals += won.count;
                totalOpenDeals += forecast.count;
            }
        } else {
            // Theo Nhân viên (by_rep)
            List<Map<String, Object>> allUsers = getAllSalesUsers();
            for (Map<String, Object> u : allUsers) {
                long userId = ((Number) u.get("id")).longValue();
                String fullName = (String) u.get("fullName");
                Long teamId = (Long) u.get("teamId");
                String teamName = (String) u.get("teamName");

                BigDecimal target = userTargets.getOrDefault(userId, BigDecimal.ZERO);
                DealMetric won = userWon.getOrDefault(userId, new DealMetric());
                DealMetric forecast = userForecast.getOrDefault(userId, new DealMetric());

                BigDecimal wonAmt = won.amount;
                BigDecimal weightedAmt = forecast.weightedAmount;
                BigDecimal pipelineAmt = forecast.amount;
                BigDecimal projected = wonAmt.add(weightedAmt);

                double achievementPct = 0.0;
                if (target.compareTo(BigDecimal.ZERO) > 0) {
                    achievementPct = projected.multiply(BigDecimal.valueOf(100))
                            .divide(target, 1, RoundingMode.HALF_UP).doubleValue();
                }

                String statusEvaluation = evaluateStatus(achievementPct);

                Map<String, Object> row = new LinkedHashMap<>();
                row.put("id", userId);
                row.put("name", fullName);
                row.put("teamId", teamId);
                row.put("teamName", teamName != null ? teamName : "Chưa phân nhóm");
                row.put("targetAmount", target);
                row.put("wonAmount", wonAmt);
                row.put("wonDealsCount", won.count);
                row.put("pipelineAmount", pipelineAmt);
                row.put("weightedForecastAmount", weightedAmt);
                row.put("openDealsCount", forecast.count);
                row.put("totalProjectedAmount", projected);
                row.put("achievementPercent", achievementPct);
                row.put("statusEvaluation", statusEvaluation);

                breakdownList.add(row);

                totalTarget = totalTarget.add(target);
                totalWon = totalWon.add(wonAmt);
                totalWeighted = totalWeighted.add(weightedAmt);
                totalPipeline = totalPipeline.add(pipelineAmt);
                totalWonDeals += won.count;
                totalOpenDeals += forecast.count;
            }
        }

        // Sắp xếp giảm dần theo totalProjectedAmount
        breakdownList.sort((a, b) -> ((BigDecimal) b.get("totalProjectedAmount")).compareTo((BigDecimal) a.get("totalProjectedAmount")));

        BigDecimal totalProjected = totalWon.add(totalWeighted);
        double totalAchievementPct = 0.0;
        if (totalTarget.compareTo(BigDecimal.ZERO) > 0) {
            totalAchievementPct = totalProjected.multiply(BigDecimal.valueOf(100))
                    .divide(totalTarget, 1, RoundingMode.HALF_UP).doubleValue();
        }

        Map<String, Object> summary = new LinkedHashMap<>();
        summary.put("targetAmount", totalTarget);
        summary.put("wonAmount", totalWon);
        summary.put("wonDealsCount", totalWonDeals);
        summary.put("pipelineAmount", totalPipeline);
        summary.put("weightedForecastAmount", totalWeighted);
        summary.put("openDealsCount", totalOpenDeals);
        summary.put("totalProjectedAmount", totalProjected);
        summary.put("achievementPercent", totalAchievementPct);
        summary.put("overallStatus", evaluateStatus(totalAchievementPct));

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("periodCode", period.periodCode);
        result.put("periodLabel", period.periodLabel);
        result.put("startDate", period.getStartDateStr());
        result.put("endDate", period.getEndDateStr());
        result.put("groupBy", isGroupByTeam ? "TEAM" : "USER");
        result.put("summary", summary);
        result.put("breakdown", breakdownList);

        return result;
    }

    private String evaluateStatus(double pct) {
        if (pct >= 100.0) return "VƯỢT CHỈ TIÊU";
        if (pct >= 80.0) return "KHẢ THI ĐẠT";
        if (pct >= 50.0) return "CẦN TĂNG TỐC";
        return "NGUY CƠ KHÔNG ĐẠT";
    }

    private static class DealMetric {
        int count = 0;
        BigDecimal amount = BigDecimal.ZERO;
        BigDecimal weightedAmount = BigDecimal.ZERO;
    }

    private void loadTargets(PeriodRange period, Map<Long, BigDecimal> userTargets, Map<Long, BigDecimal> teamTargets) throws SQLException {
        StringBuilder sql = new StringBuilder("SELECT user_id, team_id, target_amount FROM sales_targets WHERE period_year = ?");
        List<Object> params = new ArrayList<>();
        params.add(period.year);

        if (period.month != null) {
            sql.append(" AND period_month = ?");
            params.add(period.month);
        } else {
            sql.append(" AND period_quarter = ? AND period_month IS NULL");
            params.add(period.quarter);
        }

        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql.toString())) {
            for (int i = 0; i < params.size(); i++) {
                stmt.setObject(i + 1, params.get(i));
            }
            try (ResultSet rs = stmt.executeQuery()) {
                while (rs.next()) {
                    Long userId = (Long) rs.getObject("user_id");
                    Long teamId = (Long) rs.getObject("team_id");
                    BigDecimal amt = rs.getBigDecimal("target_amount");
                    if (amt == null) amt = BigDecimal.ZERO;

                    if (userId != null) {
                        userTargets.put(userId, amt);
                    } else if (teamId != null) {
                        teamTargets.put(teamId, amt);
                    }
                }
            }
        }
    }

    private void loadWonDeals(PeriodRange period, Map<Long, DealMetric> userWon, Map<Long, DealMetric> teamWon) throws SQLException {
        String sql = """
                SELECT 
                    o.owner_user_id,
                    u.team_id,
                    COUNT(*) AS won_count,
                    SUM(o.amount) AS won_amount
                FROM opportunities o
                LEFT JOIN users u ON u.id = o.owner_user_id
                WHERE o.status = 'WON' 
                  AND o.is_deleted = 0
                  AND o.actual_close_date BETWEEN ? AND ?
                GROUP BY o.owner_user_id, u.team_id
                """;

        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setDate(1, java.sql.Date.valueOf(period.startDate));
            stmt.setDate(2, java.sql.Date.valueOf(period.endDate));
            try (ResultSet rs = stmt.executeQuery()) {
                while (rs.next()) {
                    long ownerId = rs.getLong("owner_user_id");
                    Long teamId = (Long) rs.getObject("team_id");
                    int count = rs.getInt("won_count");
                    BigDecimal amt = rs.getBigDecimal("won_amount");
                    if (amt == null) amt = BigDecimal.ZERO;

                    DealMetric uMetric = userWon.computeIfAbsent(ownerId, k -> new DealMetric());
                    uMetric.count += count;
                    uMetric.amount = uMetric.amount.add(amt);

                    if (teamId != null) {
                        DealMetric tMetric = teamWon.computeIfAbsent(teamId, k -> new DealMetric());
                        tMetric.count += count;
                        tMetric.amount = tMetric.amount.add(amt);
                    }
                }
            }
        }
    }

    private void loadOpenForecastDeals(PeriodRange period, Map<Long, DealMetric> userForecast, Map<Long, DealMetric> teamForecast) throws SQLException {
        String sql = """
                SELECT 
                    o.owner_user_id,
                    u.team_id,
                    COUNT(*) AS open_count,
                    SUM(o.amount) AS open_amount,
                    SUM(o.amount * COALESCE(o.probability, ps.win_probability, ps.probability, 0) / 100.0) AS weighted_amount
                FROM opportunities o
                LEFT JOIN pipeline_stages ps ON ps.id = o.stage_id
                LEFT JOIN users u ON u.id = o.owner_user_id
                WHERE o.status = 'OPEN' 
                  AND o.is_deleted = 0
                  AND o.expected_close_date BETWEEN ? AND ?
                GROUP BY o.owner_user_id, u.team_id
                """;

        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setDate(1, java.sql.Date.valueOf(period.startDate));
            stmt.setDate(2, java.sql.Date.valueOf(period.endDate));
            try (ResultSet rs = stmt.executeQuery()) {
                while (rs.next()) {
                    long ownerId = rs.getLong("owner_user_id");
                    Long teamId = (Long) rs.getObject("team_id");
                    int count = rs.getInt("open_count");
                    BigDecimal amt = rs.getBigDecimal("open_amount");
                    BigDecimal weighted = rs.getBigDecimal("weighted_amount");
                    if (amt == null) amt = BigDecimal.ZERO;
                    if (weighted == null) weighted = BigDecimal.ZERO;

                    DealMetric uMetric = userForecast.computeIfAbsent(ownerId, k -> new DealMetric());
                    uMetric.count += count;
                    uMetric.amount = uMetric.amount.add(amt);
                    uMetric.weightedAmount = uMetric.weightedAmount.add(weighted);

                    if (teamId != null) {
                        DealMetric tMetric = teamForecast.computeIfAbsent(teamId, k -> new DealMetric());
                        tMetric.count += count;
                        tMetric.amount = tMetric.amount.add(amt);
                        tMetric.weightedAmount = tMetric.weightedAmount.add(weighted);
                    }
                }
            }
        }
    }

    private List<Map<String, Object>> getAllSalesUsers() throws SQLException {
        String sql = """
                SELECT u.id, u.full_name, u.team_id, t.name AS team_name
                FROM users u
                LEFT JOIN teams t ON t.id = u.team_id
                WHERE u.status = 'ACTIVE'
                ORDER BY t.name ASC, u.full_name ASC
                """;
        List<Map<String, Object>> list = new ArrayList<>();
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql);
             ResultSet rs = stmt.executeQuery()) {
            while (rs.next()) {
                Map<String, Object> map = new LinkedHashMap<>();
                map.put("id", rs.getLong("id"));
                map.put("fullName", rs.getString("full_name"));
                map.put("teamId", rs.getObject("team_id"));
                map.put("teamName", rs.getString("team_name"));
                list.add(map);
            }
        }
        return list;
    }

    private List<Map<String, Object>> getAllTeams() throws SQLException {
        String sql = """
                SELECT t.id, t.name, COUNT(u.id) AS member_count
                FROM teams t
                LEFT JOIN users u ON u.team_id = t.id AND u.status = 'ACTIVE'
                GROUP BY t.id, t.name
                ORDER BY t.name ASC
                """;
        List<Map<String, Object>> list = new ArrayList<>();
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql);
             ResultSet rs = stmt.executeQuery()) {
            while (rs.next()) {
                Map<String, Object> map = new LinkedHashMap<>();
                map.put("id", rs.getLong("id"));
                map.put("name", rs.getString("name"));
                map.put("memberCount", rs.getInt("member_count"));
                list.add(map);
            }
        }
        return list;
    }

    private BigDecimal getTeamSummedUserTarget(long teamId, Map<Long, BigDecimal> userTargets) throws SQLException {
        String sql = "SELECT id FROM users WHERE team_id = ? AND status = 'ACTIVE'";
        BigDecimal sum = BigDecimal.ZERO;
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setLong(1, teamId);
            try (ResultSet rs = stmt.executeQuery()) {
                while (rs.next()) {
                    long uId = rs.getLong("id");
                    sum = sum.add(userTargets.getOrDefault(uId, BigDecimal.ZERO));
                }
            }
        }
        return sum;
    }
}
