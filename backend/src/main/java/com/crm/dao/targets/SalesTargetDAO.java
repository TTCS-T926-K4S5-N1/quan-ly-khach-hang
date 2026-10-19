package com.crm.dao.targets;

import com.crm.config.DatabaseConfig;
import com.crm.service.permissions.DataScopeContext;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.sql.*;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.*;

public class SalesTargetDAO {

    public static class DateRange {
        public final LocalDate startDate;
        public final LocalDate endDate;

        public DateRange(LocalDate startDate, LocalDate endDate) {
            this.startDate = startDate;
            this.endDate = endDate;
        }
    }

    public static DateRange calculateDateRange(int year, Integer month, Integer quarter) {
        if (month != null && month >= 1 && month <= 12) {
            YearMonth ym = YearMonth.of(year, month);
            return new DateRange(ym.atDay(1), ym.atEndOfMonth());
        } else if (quarter != null && quarter >= 1 && quarter <= 4) {
            int startMonth = (quarter - 1) * 3 + 1;
            int endMonth = startMonth + 2;
            LocalDate start = LocalDate.of(year, startMonth, 1);
            LocalDate end = YearMonth.of(year, endMonth).atEndOfMonth();
            return new DateRange(start, end);
        } else {
            // Whole year
            return new DateRange(LocalDate.of(year, 1, 1), LocalDate.of(year, 12, 31));
        }
    }

    public static boolean isPeriodPassed(int periodYear, Integer periodMonth, Integer periodQuarter) {
        LocalDate now = LocalDate.now();
        int curYear = now.getYear();
        int curMonth = now.getMonthValue();
        int curQuarter = (curMonth - 1) / 3 + 1;

        if (periodYear < curYear) return true;
        if (periodYear > curYear) return false;

        if (periodMonth != null) {
            return periodMonth < curMonth;
        } else if (periodQuarter != null) {
            return periodQuarter < curQuarter;
        }
        return false;
    }

    public BigDecimal getTeamMembersSum(Connection conn, Long teamId, int year, Integer month, Integer quarter) throws SQLException {
        if (teamId == null) return BigDecimal.ZERO;
        StringBuilder sql = new StringBuilder("""
                SELECT COALESCE(SUM(st.target_amount), 0) AS total_members
                FROM sales_targets st
                JOIN users u ON u.id = st.user_id
                WHERE u.team_id = ? AND st.period_year = ?
                """);
        List<Object> params = new ArrayList<>();
        params.add(teamId);
        params.add(year);

        if (month != null) {
            sql.append(" AND st.period_month = ?");
            params.add(month);
        } else if (quarter != null) {
            sql.append(" AND st.period_quarter = ? AND st.period_month IS NULL");
            params.add(quarter);
        } else {
            sql.append(" AND st.period_month IS NULL AND st.period_quarter IS NULL");
        }

        try (PreparedStatement stmt = conn.prepareStatement(sql.toString())) {
            for (int i = 0; i < params.size(); i++) {
                stmt.setObject(i + 1, params.get(i));
            }
            try (ResultSet rs = stmt.executeQuery()) {
                if (rs.next()) {
                    return rs.getBigDecimal("total_members");
                }
            }
        }
        return BigDecimal.ZERO;
    }

    public List<Map<String, Object>> search(
            DataScopeContext scope,
            Integer year,
            Integer month,
            Integer quarter,
            String targetType // "ALL", "USER", "TEAM"
    ) throws SQLException {
        int qYear = (year != null && year > 2000) ? year : LocalDate.now().getYear();

        StringBuilder sql = new StringBuilder("""
                SELECT
                    st.id,
                    st.user_id,
                    st.team_id,
                    st.period_year,
                    st.period_month,
                    st.period_quarter,
                    st.target_amount,
                    st.target_deals,
                    st.notes,
                    st.change_reason,
                    st.created_by,
                    st.created_at,
                    st.updated_at,
                    u.full_name AS user_name,
                    u.email AS user_email,
                    t.name AS team_name,
                    uc.full_name AS created_by_name
                FROM sales_targets st
                LEFT JOIN users u ON u.id = st.user_id
                LEFT JOIN teams t ON t.id = COALESCE(st.team_id, u.team_id)
                LEFT JOIN users uc ON uc.id = st.created_by
                WHERE st.period_year = ?
                """);

        List<Object> params = new ArrayList<>();
        params.add(qYear);

        if (month != null && month >= 1 && month <= 12) {
            sql.append(" AND st.period_month = ?");
            params.add(month);
        } else if (quarter != null && quarter >= 1 && quarter <= 4) {
            sql.append(" AND st.period_quarter = ? AND st.period_month IS NULL");
            params.add(quarter);
        }

        if ("USER".equalsIgnoreCase(targetType)) {
            sql.append(" AND st.user_id IS NOT NULL");
        } else if ("TEAM".equalsIgnoreCase(targetType)) {
            sql.append(" AND st.user_id IS NULL AND st.team_id IS NOT NULL");
        }

        // Apply Data Scope
        if (scope != null) {
            if (scope.scopeType() == com.crm.service.permissions.ScopeType.SELF) {
                sql.append(" AND st.user_id = ?");
                params.add(scope.currentUserId());
            } else if (scope.scopeType() == com.crm.service.permissions.ScopeType.TEAM && scope.teamId() != null) {
                sql.append(" AND (st.team_id = ? OR u.team_id = ?)");
                params.add(scope.teamId());
                params.add(scope.teamId());
            }
        }

        sql.append(" ORDER BY (st.user_id IS NULL) DESC, st.target_amount DESC, st.id DESC");

        List<Map<String, Object>> results = new ArrayList<>();
        DateRange range = calculateDateRange(qYear, month, quarter);

        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql.toString())) {
            for (int i = 0; i < params.size(); i++) {
                stmt.setObject(i + 1, params.get(i));
            }
            try (ResultSet rs = stmt.executeQuery()) {
                while (rs.next()) {
                    Map<String, Object> item = mapTargetRow(rs);

                    // Compute actual WON results for this target
                    Long targetUserId = (Long) rs.getObject("user_id");
                    Long targetTeamId = (Long) rs.getObject("team_id");
                    ActualMetric actual = loadActualMetric(conn, targetUserId, targetTeamId, range);

                    BigDecimal targetAmount = rs.getBigDecimal("target_amount");
                    if (targetAmount == null) targetAmount = BigDecimal.ZERO;
                    int targetDeals = rs.getInt("target_deals");

                    BigDecimal achievementRate = BigDecimal.ZERO;
                    if (targetAmount.compareTo(BigDecimal.ZERO) > 0) {
                        achievementRate = actual.amount
                                .multiply(BigDecimal.valueOf(100))
                                .divide(targetAmount, 1, RoundingMode.HALF_UP);
                    }

                    BigDecimal variance = actual.amount.subtract(targetAmount);

                    item.put("actualAmount", actual.amount);
                    item.put("actualDeals", actual.dealsCount);
                    item.put("achievementRate", achievementRate);
                    item.put("variance", variance);
                    item.put("startDate", range.startDate.toString());
                    item.put("endDate", range.endDate.toString());

                    // Check if period has passed (Locked)
                    boolean isLocked = isPeriodPassed(qYear, (Integer) rs.getObject("period_month"), (Integer) rs.getObject("period_quarter"));
                    item.put("isLocked", isLocked);

                    // Team validation: check if team target equals sum of member targets
                    if (targetUserId == null && targetTeamId != null) {
                        BigDecimal teamMembersSum = getTeamMembersSum(conn, targetTeamId, qYear, (Integer) rs.getObject("period_month"), (Integer) rs.getObject("period_quarter"));
                        item.put("teamMembersSum", teamMembersSum);
                        BigDecimal mismatchDiff = targetAmount.subtract(teamMembersSum);
                        item.put("mismatchDiff", mismatchDiff);
                        item.put("isMismatched", mismatchDiff.compareTo(BigDecimal.ZERO) != 0);
                    } else {
                        item.put("teamMembersSum", BigDecimal.ZERO);
                        item.put("mismatchDiff", BigDecimal.ZERO);
                        item.put("isMismatched", false);
                    }

                    // Status classification
                    String status;
                    if (achievementRate.compareTo(BigDecimal.valueOf(100)) >= 0) {
                        status = "COMPLETED"; // Đạt/Vượt chỉ tiêu
                    } else if (achievementRate.compareTo(BigDecimal.valueOf(70)) >= 0) {
                        status = "ON_TRACK"; // Đang tiến độ
                    } else {
                        status = "BEHIND"; // Nguy cơ không đạt
                    }
                    item.put("status", status);

                    results.add(item);
                }
            }
        }
        return results;
    }

    public Map<String, Object> getSummary(
            DataScopeContext scope,
            Integer year,
            Integer month,
            Integer quarter
    ) throws SQLException {
        List<Map<String, Object>> targets = search(scope, year, month, quarter, "ALL");

        BigDecimal totalTargetAmount = BigDecimal.ZERO;
        BigDecimal totalActualAmount = BigDecimal.ZERO;
        int totalTargetDeals = 0;
        int totalActualDeals = 0;
        int completedCount = 0;
        int onTrackCount = 0;
        int behindCount = 0;

        for (Map<String, Object> t : targets) {
            // Chỉ cộng tổng các target của Nhân viên (tránh duplicate với tổng nhóm)
            // Nếu chỉ có team target thì cộng team target
            boolean isUser = t.get("userId") != null;
            if (isUser) {
                totalTargetAmount = totalTargetAmount.add((BigDecimal) t.get("targetAmount"));
                totalActualAmount = totalActualAmount.add((BigDecimal) t.get("actualAmount"));
                totalTargetDeals += ((Number) t.get("targetDeals")).intValue();
                totalActualDeals += ((Number) t.get("actualDeals")).intValue();
            }

            String st = (String) t.get("status");
            if ("COMPLETED".equalsIgnoreCase(st)) completedCount++;
            else if ("ON_TRACK".equalsIgnoreCase(st)) onTrackCount++;
            else behindCount++;
        }

        // Nếu không có user target nào (chỉ có team target), tính tổng từ team target
        if (totalTargetAmount.compareTo(BigDecimal.ZERO) == 0 && !targets.isEmpty()) {
            for (Map<String, Object> t : targets) {
                totalTargetAmount = totalTargetAmount.add((BigDecimal) t.get("targetAmount"));
                totalActualAmount = totalActualAmount.add((BigDecimal) t.get("actualAmount"));
                totalTargetDeals += ((Number) t.get("targetDeals")).intValue();
                totalActualDeals += ((Number) t.get("actualDeals")).intValue();
            }
        }

        BigDecimal overallRate = BigDecimal.ZERO;
        if (totalTargetAmount.compareTo(BigDecimal.ZERO) > 0) {
            overallRate = totalActualAmount
                    .multiply(BigDecimal.valueOf(100))
                    .divide(totalTargetAmount, 1, RoundingMode.HALF_UP);
        }

        Map<String, Object> summary = new LinkedHashMap<>();
        summary.put("totalTargetAmount", totalTargetAmount);
        summary.put("totalActualAmount", totalActualAmount);
        summary.put("totalVariance", totalActualAmount.subtract(totalTargetAmount));
        summary.put("overallAchievementRate", overallRate);
        summary.put("totalTargetDeals", totalTargetDeals);
        summary.put("totalActualDeals", totalActualDeals);
        summary.put("totalTargetsCount", targets.size());
        summary.put("completedCount", completedCount);
        summary.put("onTrackCount", onTrackCount);
        summary.put("behindCount", behindCount);
        return summary;
    }

    public Map<String, Object> findById(long id) throws SQLException {
        String sql = """
                SELECT
                    st.*,
                    u.full_name AS user_name,
                    u.email AS user_email,
                    t.name AS team_name,
                    uc.full_name AS created_by_name
                FROM sales_targets st
                LEFT JOIN users u ON u.id = st.user_id
                LEFT JOIN teams t ON t.id = COALESCE(st.team_id, u.team_id)
                LEFT JOIN users uc ON uc.id = st.created_by
                WHERE st.id = ?
                """;
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setLong(1, id);
            try (ResultSet rs = stmt.executeQuery()) {
                if (rs.next()) {
                    Map<String, Object> item = mapTargetRow(rs);
                    Long targetUserId = (Long) rs.getObject("user_id");
                    Long targetTeamId = (Long) rs.getObject("team_id");
                    int year = rs.getInt("period_year");
                    Integer month = (Integer) rs.getObject("period_month");
                    Integer quarter = (Integer) rs.getObject("period_quarter");
                    DateRange range = calculateDateRange(year, month, quarter);

                    ActualMetric actual = loadActualMetric(conn, targetUserId, targetTeamId, range);
                    BigDecimal targetAmount = rs.getBigDecimal("target_amount");
                    if (targetAmount == null) targetAmount = BigDecimal.ZERO;

                    BigDecimal achievementRate = BigDecimal.ZERO;
                    if (targetAmount.compareTo(BigDecimal.ZERO) > 0) {
                        achievementRate = actual.amount
                                .multiply(BigDecimal.valueOf(100))
                                .divide(targetAmount, 1, RoundingMode.HALF_UP);
                    }

                    item.put("actualAmount", actual.amount);
                    item.put("actualDeals", actual.dealsCount);
                    item.put("achievementRate", achievementRate);
                    item.put("variance", actual.amount.subtract(targetAmount));

                    boolean isLocked = isPeriodPassed(year, month, quarter);
                    item.put("isLocked", isLocked);

                    if (targetUserId == null && targetTeamId != null) {
                        BigDecimal teamMembersSum = getTeamMembersSum(conn, targetTeamId, year, month, quarter);
                        item.put("teamMembersSum", teamMembersSum);
                        BigDecimal mismatchDiff = targetAmount.subtract(teamMembersSum);
                        item.put("mismatchDiff", mismatchDiff);
                        item.put("isMismatched", mismatchDiff.compareTo(BigDecimal.ZERO) != 0);
                    } else {
                        item.put("teamMembersSum", BigDecimal.ZERO);
                        item.put("mismatchDiff", BigDecimal.ZERO);
                        item.put("isMismatched", false);
                    }
                    return item;
                }
            }
        }
        return null;
    }

    public long upsertTarget(
            Long id,
            Long userId,
            Long teamId,
            int periodYear,
            Integer periodMonth,
            Integer periodQuarter,
            BigDecimal targetAmount,
            int targetDeals,
            String notes,
            String changeReason,
            long createdBy
    ) throws SQLException {
        if (userId == null && teamId == null) {
            throw new IllegalArgumentException("Phải chỉ định Nhân viên hoặc Nhóm kinh doanh để gán chỉ tiêu.");
        }

        // Tự động suy ra teamId từ user nếu chưa có
        if (userId != null && teamId == null) {
            teamId = getUserTeamId(userId);
        }

        // Tự động tính quarter từ month nếu có
        if (periodMonth != null && periodMonth >= 1 && periodMonth <= 12 && periodQuarter == null) {
            periodQuarter = (periodMonth - 1) / 3 + 1;
        }

        // Kiểm tra nếu sửa chỉ tiêu thuộc kỳ đã qua -> bắt buộc có lý do
        boolean isLocked = isPeriodPassed(periodYear, periodMonth, periodQuarter);
        if (id != null && id > 0 && isLocked) {
            if (changeReason == null || changeReason.trim().isBlank()) {
                throw new IllegalArgumentException("Chỉ tiêu này thuộc kỳ đã qua (đã khóa). Việc sửa đổi bắt buộc phải có lý do giải trình.");
            }
        }

        if (id != null && id > 0) {
            // Update existing
            String updateSql = """
                    UPDATE sales_targets
                    SET user_id = ?,
                        team_id = ?,
                        period_year = ?,
                        period_month = ?,
                        period_quarter = ?,
                        target_amount = ?,
                        target_deals = ?,
                        notes = ?,
                        change_reason = ?,
                        updated_at = NOW()
                    WHERE id = ?
                    """;
            try (Connection conn = DatabaseConfig.getConnection();
                 PreparedStatement stmt = conn.prepareStatement(updateSql)) {
                stmt.setObject(1, userId, Types.BIGINT);
                stmt.setObject(2, teamId, Types.BIGINT);
                stmt.setInt(3, periodYear);
                stmt.setObject(4, periodMonth, Types.INTEGER);
                stmt.setObject(5, periodQuarter, Types.INTEGER);
                stmt.setBigDecimal(6, targetAmount != null ? targetAmount : BigDecimal.ZERO);
                stmt.setInt(7, targetDeals);
                stmt.setString(8, notes);
                stmt.setString(9, changeReason);
                stmt.setLong(10, id);
                stmt.executeUpdate();
                return id;
            }
        } else {
            // Check if existing target for same user/team and period
            Long existingId = findExistingTargetId(userId, teamId, periodYear, periodMonth, periodQuarter);
            if (existingId != null) {
                return upsertTarget(existingId, userId, teamId, periodYear, periodMonth, periodQuarter, targetAmount, targetDeals, notes, changeReason, createdBy);
            }

            // Insert new
            String insertSql = """
                    INSERT INTO sales_targets (
                        user_id, team_id, period_year, period_month, period_quarter,
                        target_amount, target_deals, notes, change_reason, created_by, created_at, updated_at
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
                    """;
            try (Connection conn = DatabaseConfig.getConnection();
                 PreparedStatement stmt = conn.prepareStatement(insertSql, Statement.RETURN_GENERATED_KEYS)) {
                stmt.setObject(1, userId, Types.BIGINT);
                stmt.setObject(2, teamId, Types.BIGINT);
                stmt.setInt(3, periodYear);
                stmt.setObject(4, periodMonth, Types.INTEGER);
                stmt.setObject(5, periodQuarter, Types.INTEGER);
                stmt.setBigDecimal(6, targetAmount != null ? targetAmount : BigDecimal.ZERO);
                stmt.setInt(7, targetDeals);
                stmt.setString(8, notes);
                stmt.setString(9, changeReason);
                stmt.setLong(10, createdBy);
                stmt.executeUpdate();
                try (ResultSet rs = stmt.getGeneratedKeys()) {
                    if (rs.next()) {
                        return rs.getLong(1);
                    }
                }
            }
        }
        return 0;
    }

    public long upsertTarget(
            Long id,
            Long userId,
            Long teamId,
            int periodYear,
            Integer periodMonth,
            Integer periodQuarter,
            BigDecimal targetAmount,
            int targetDeals,
            String notes,
            long createdBy
    ) throws SQLException {
        return upsertTarget(id, userId, teamId, periodYear, periodMonth, periodQuarter, targetAmount, targetDeals, notes, null, createdBy);
    }

    public Map<String, Object> getTeamValidation(Long teamId, int year, Integer month, Integer quarter) throws SQLException {
        Map<String, Object> res = new LinkedHashMap<>();
        if (teamId == null) {
            res.put("teamMembersSum", BigDecimal.ZERO);
            res.put("memberCount", 0);
            res.put("members", List.of());
            return res;
        }

        try (Connection conn = DatabaseConfig.getConnection()) {
            BigDecimal sum = getTeamMembersSum(conn, teamId, year, month, quarter);
            res.put("teamMembersSum", sum);

            StringBuilder sql = new StringBuilder("""
                    SELECT u.id, u.full_name, COALESCE(st.target_amount, 0) AS target_amount
                    FROM users u
                    LEFT JOIN sales_targets st ON st.user_id = u.id AND st.period_year = ?
                    """);
            List<Object> params = new ArrayList<>();
            params.add(year);

            if (month != null) {
                sql.append(" AND st.period_month = ?");
                params.add(month);
            } else if (quarter != null) {
                sql.append(" AND st.period_quarter = ? AND st.period_month IS NULL");
                params.add(quarter);
            } else {
                sql.append(" AND st.period_month IS NULL AND st.period_quarter IS NULL");
            }
            sql.append(" WHERE u.team_id = ? AND u.status = 'ACTIVE' ORDER BY u.full_name ASC");
            params.add(teamId);

            List<Map<String, Object>> members = new ArrayList<>();
            try (PreparedStatement stmt = conn.prepareStatement(sql.toString())) {
                for (int i = 0; i < params.size(); i++) {
                    stmt.setObject(i + 1, params.get(i));
                }
                try (ResultSet rs = stmt.executeQuery()) {
                    while (rs.next()) {
                        Map<String, Object> m = new LinkedHashMap<>();
                        m.put("userId", rs.getLong("id"));
                        m.put("userName", rs.getString("full_name"));
                        m.put("targetAmount", rs.getBigDecimal("target_amount"));
                        members.add(m);
                    }
                }
            }
            res.put("memberCount", members.size());
            res.put("members", members);
        }
        return res;
    }

    public boolean deleteTarget(long id) throws SQLException {
        String sql = "DELETE FROM sales_targets WHERE id = ?";
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setLong(1, id);
            return stmt.executeUpdate() > 0;
        }
    }

    public List<Map<String, Object>> getAvailableUsers() throws SQLException {
        String sql = """
                SELECT u.id, u.full_name, u.email, u.team_id, t.name AS team_name
                FROM users u
                LEFT JOIN teams t ON t.id = u.team_id
                WHERE u.status = 'ACTIVE'
                ORDER BY u.full_name ASC
                """;
        List<Map<String, Object>> list = new ArrayList<>();
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql);
             ResultSet rs = stmt.executeQuery()) {
            while (rs.next()) {
                Map<String, Object> u = new LinkedHashMap<>();
                u.put("id", rs.getLong("id"));
                u.put("fullName", rs.getString("full_name"));
                u.put("email", rs.getString("email"));
                u.put("teamId", rs.getObject("team_id"));
                u.put("teamName", rs.getString("team_name"));
                list.add(u);
            }
        }
        return list;
    }

    public List<Map<String, Object>> getAvailableTeams() throws SQLException {
        String sql = """
                SELECT t.id, t.name, t.code, COUNT(u.id) AS member_count
                FROM teams t
                LEFT JOIN users u ON u.team_id = t.id AND u.status = 'ACTIVE'
                GROUP BY t.id, t.name, t.code
                ORDER BY t.name ASC
                """;
        List<Map<String, Object>> list = new ArrayList<>();
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql);
             ResultSet rs = stmt.executeQuery()) {
            while (rs.next()) {
                Map<String, Object> t = new LinkedHashMap<>();
                t.put("id", rs.getLong("id"));
                t.put("name", rs.getString("name"));
                t.put("code", rs.getString("code"));
                t.put("memberCount", rs.getInt("member_count"));
                list.add(t);
            }
        }
        return list;
    }

    private Long findExistingTargetId(Long userId, Long teamId, int year, Integer month, Integer quarter) throws SQLException {
        StringBuilder sql = new StringBuilder("SELECT id FROM sales_targets WHERE period_year = ?");
        List<Object> params = new ArrayList<>();
        params.add(year);

        if (userId != null) {
            sql.append(" AND user_id = ?");
            params.add(userId);
        } else {
            sql.append(" AND user_id IS NULL AND team_id = ?");
            params.add(teamId);
        }

        if (month != null) {
            sql.append(" AND period_month = ?");
            params.add(month);
        } else {
            sql.append(" AND period_month IS NULL");
        }

        if (quarter != null) {
            sql.append(" AND period_quarter = ?");
            params.add(quarter);
        } else {
            sql.append(" AND period_quarter IS NULL");
        }

        sql.append(" LIMIT 1");

        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql.toString())) {
            for (int i = 0; i < params.size(); i++) {
                stmt.setObject(i + 1, params.get(i));
            }
            try (ResultSet rs = stmt.executeQuery()) {
                if (rs.next()) return rs.getLong("id");
            }
        }
        return null;
    }

    private Long getUserTeamId(long userId) throws SQLException {
        String sql = "SELECT team_id FROM users WHERE id = ?";
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setLong(1, userId);
            try (ResultSet rs = stmt.executeQuery()) {
                if (rs.next()) {
                    return (Long) rs.getObject("team_id");
                }
            }
        }
        return null;
    }

    private static class ActualMetric {
        BigDecimal amount = BigDecimal.ZERO;
        int dealsCount = 0;
    }

    private ActualMetric loadActualMetric(Connection conn, Long userId, Long teamId, DateRange range) throws SQLException {
        ActualMetric metric = new ActualMetric();
        StringBuilder sql = new StringBuilder("""
                SELECT
                    COUNT(*) AS won_deals,
                    COALESCE(SUM(o.amount), 0) AS won_amount
                FROM opportunities o
                """);

        List<Object> params = new ArrayList<>();

        if (userId != null) {
            sql.append(" WHERE o.owner_user_id = ?");
            params.add(userId);
        } else if (teamId != null) {
            sql.append(" JOIN users u ON u.id = o.owner_user_id WHERE u.team_id = ?");
            params.add(teamId);
        } else {
            sql.append(" WHERE 1=1");
        }

        sql.append("""
                  AND o.status = 'WON'
                  AND o.is_deleted = 0
                  AND (
                      (o.actual_close_date IS NOT NULL AND o.actual_close_date BETWEEN ? AND ?)
                      OR (o.actual_close_date IS NULL AND DATE(o.updated_at) BETWEEN ? AND ?)
                  )
                """);
        params.add(java.sql.Date.valueOf(range.startDate));
        params.add(java.sql.Date.valueOf(range.endDate));
        params.add(java.sql.Date.valueOf(range.startDate));
        params.add(java.sql.Date.valueOf(range.endDate));

        try (PreparedStatement stmt = conn.prepareStatement(sql.toString())) {
            for (int i = 0; i < params.size(); i++) {
                stmt.setObject(i + 1, params.get(i));
            }
            try (ResultSet rs = stmt.executeQuery()) {
                if (rs.next()) {
                    metric.dealsCount = rs.getInt("won_deals");
                    metric.amount = rs.getBigDecimal("won_amount") != null ? rs.getBigDecimal("won_amount") : BigDecimal.ZERO;
                }
            }
        }
        return metric;
    }

    private Map<String, Object> mapTargetRow(ResultSet rs) throws SQLException {
        Map<String, Object> item = new LinkedHashMap<>();
        item.put("id", rs.getLong("id"));
        item.put("userId", rs.getObject("user_id"));
        item.put("userName", rs.getString("user_name"));
        item.put("userEmail", rs.getString("user_email"));
        item.put("teamId", rs.getObject("team_id"));
        item.put("teamName", rs.getString("team_name"));
        item.put("targetType", rs.getObject("user_id") != null ? "USER" : "TEAM");
        item.put("periodYear", rs.getInt("period_year"));
        item.put("periodMonth", rs.getObject("period_month"));
        item.put("periodQuarter", rs.getObject("period_quarter"));

        String periodLabel = "Năm " + rs.getInt("period_year");
        if (rs.getObject("period_month") != null) {
            periodLabel = "Tháng " + rs.getInt("period_month") + "/" + rs.getInt("period_year");
        } else if (rs.getObject("period_quarter") != null) {
            periodLabel = "Quý " + rs.getInt("period_quarter") + "/" + rs.getInt("period_year");
        }
        item.put("periodLabel", periodLabel);

        item.put("targetAmount", rs.getBigDecimal("target_amount"));
        item.put("targetDeals", rs.getInt("target_deals"));
        item.put("notes", rs.getString("notes"));
        item.put("changeReason", rs.getString("change_reason"));
        item.put("createdBy", rs.getObject("created_by"));
        item.put("createdByName", rs.getString("created_by_name"));
        item.put("createdAt", rs.getTimestamp("created_at"));
        item.put("updatedAt", rs.getTimestamp("updated_at"));
        return item;
    }
}
