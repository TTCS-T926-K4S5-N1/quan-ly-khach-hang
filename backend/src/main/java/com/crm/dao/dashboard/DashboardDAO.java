package com.crm.dao.dashboard;

import com.crm.config.DatabaseConfig;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.sql.*;
import java.time.LocalDate;
import java.util.*;

public class DashboardDAO {

    /**
     * Dashboard cho Nhân viên kinh doanh (Sales Rep)
     * - Chỉ tiêu và tiến độ của mình
     * - Cơ hội đang mở
     * - Việc hôm nay
     * - Lead chưa liên hệ
     */
    public Map<String, Object> getStaffDashboard(long userId, int year, int month) throws SQLException {
        Map<String, Object> data = new LinkedHashMap<>();

        try (Connection conn = DatabaseConfig.getConnection()) {
            // 1. Chỉ tiêu & Tiến độ cá nhân
            Map<String, Object> targetProgress = new LinkedHashMap<>();
            BigDecimal targetAmount = BigDecimal.ZERO;
            int targetDeals = 0;

            String targetSql = """
                    SELECT target_amount, target_deals
                    FROM sales_targets
                    WHERE user_id = ? AND period_year = ? AND period_month = ?
                    LIMIT 1
                    """;
            try (PreparedStatement stmt = conn.prepareStatement(targetSql)) {
                stmt.setLong(1, userId);
                stmt.setInt(2, year);
                stmt.setInt(3, month);
                try (ResultSet rs = stmt.executeQuery()) {
                    if (rs.next()) {
                        targetAmount = rs.getBigDecimal("target_amount");
                        targetDeals = rs.getInt("target_deals");
                    }
                }
            }
            if (targetAmount == null) targetAmount = BigDecimal.ZERO;

            BigDecimal wonAmount = BigDecimal.ZERO;
            int wonDeals = 0;
            String wonSql = """
                    SELECT COUNT(*) AS won_deals, COALESCE(SUM(amount), 0) AS won_amount
                    FROM opportunities
                    WHERE owner_user_id = ? AND status = 'WON' AND is_deleted = 0
                      AND MONTH(COALESCE(actual_close_date, updated_at)) = ?
                      AND YEAR(COALESCE(actual_close_date, updated_at)) = ?
                    """;
            try (PreparedStatement stmt = conn.prepareStatement(wonSql)) {
                stmt.setLong(1, userId);
                stmt.setInt(2, month);
                stmt.setInt(3, year);
                try (ResultSet rs = stmt.executeQuery()) {
                    if (rs.next()) {
                        wonDeals = rs.getInt("won_deals");
                        wonAmount = rs.getBigDecimal("won_amount");
                    }
                }
            }
            if (wonAmount == null) wonAmount = BigDecimal.ZERO;

            BigDecimal achievementRate = BigDecimal.ZERO;
            if (targetAmount.compareTo(BigDecimal.ZERO) > 0) {
                achievementRate = wonAmount.multiply(BigDecimal.valueOf(100)).divide(targetAmount, 1, RoundingMode.HALF_UP);
            }

            BigDecimal remaining = targetAmount.subtract(wonAmount);
            if (remaining.compareTo(BigDecimal.ZERO) < 0) remaining = BigDecimal.ZERO;

            targetProgress.put("periodYear", year);
            targetProgress.put("periodMonth", month);
            targetProgress.put("targetAmount", targetAmount);
            targetProgress.put("targetDeals", targetDeals);
            targetProgress.put("actualWonAmount", wonAmount);
            targetProgress.put("actualWonDeals", wonDeals);
            targetProgress.put("achievementRate", achievementRate);
            targetProgress.put("remainingAmount", remaining);
            data.put("targetProgress", targetProgress);

            // 2. Cơ hội đang mở (Open opportunities)
            Map<String, Object> openOppsMap = new LinkedHashMap<>();
            int openCount = 0;
            BigDecimal openTotalValue = BigDecimal.ZERO;

            String countOpenSql = """
                    SELECT COUNT(*) AS c, COALESCE(SUM(amount), 0) AS val
                    FROM opportunities
                    WHERE owner_user_id = ? AND status = 'OPEN' AND is_deleted = 0
                    """;
            try (PreparedStatement stmt = conn.prepareStatement(countOpenSql)) {
                stmt.setLong(1, userId);
                try (ResultSet rs = stmt.executeQuery()) {
                    if (rs.next()) {
                        openCount = rs.getInt("c");
                        openTotalValue = rs.getBigDecimal("val");
                    }
                }
            }
            openOppsMap.put("totalCount", openCount);
            openOppsMap.put("totalValue", openTotalValue);

            List<Map<String, Object>> openList = new ArrayList<>();
            String listOpenSql = """
                    SELECT o.id, o.name, COALESCE(c.name, '') AS customer_name,
                           o.amount, ps.name AS stage_name, o.probability, o.expected_close_date
                    FROM opportunities o
                    LEFT JOIN customers c ON c.id = o.customer_id
                    LEFT JOIN pipeline_stages ps ON ps.id = o.stage_id
                    WHERE o.owner_user_id = ? AND o.status = 'OPEN' AND o.is_deleted = 0
                    ORDER BY o.amount DESC
                    LIMIT 6
                    """;
            try (PreparedStatement stmt = conn.prepareStatement(listOpenSql)) {
                stmt.setLong(1, userId);
                try (ResultSet rs = stmt.executeQuery()) {
                    while (rs.next()) {
                        Map<String, Object> item = new LinkedHashMap<>();
                        item.put("id", rs.getLong("id"));
                        item.put("name", rs.getString("name"));
                        item.put("customerName", rs.getString("customer_name"));
                        item.put("amount", rs.getBigDecimal("amount"));
                        item.put("stageName", rs.getString("stage_name"));
                        item.put("probability", rs.getInt("probability"));
                        item.put("expectedCloseDate", rs.getString("expected_close_date"));
                        openList.add(item);
                    }
                }
            }
            openOppsMap.put("items", openList);
            data.put("openOpportunities", openOppsMap);

            // 3. Việc hôm nay (Today's Tasks & Urgent)
            Map<String, Object> tasksMap = new LinkedHashMap<>();
            List<Map<String, Object>> todayTaskList = new ArrayList<>();
            int todayTotal = 0;
            int todayPending = 0;

            String taskSql = """
                    SELECT a.id, a.subject, a.type, a.priority, a.status, a.due_date,
                           COALESCE(c.name, '') AS customer_name,
                           o.name AS opportunity_name
                    FROM activities a
                    LEFT JOIN customers c ON c.id = a.customer_id
                    LEFT JOIN opportunities o ON o.id = a.opportunity_id
                    WHERE a.owner_user_id = ?
                      AND (a.due_date = CURDATE() OR (a.due_date < CURDATE() AND a.status != 'COMPLETED'))
                    ORDER BY (a.status = 'COMPLETED') ASC, a.due_date ASC, a.id DESC
                    LIMIT 10
                    """;
            try (PreparedStatement stmt = conn.prepareStatement(taskSql)) {
                stmt.setLong(1, userId);
                try (ResultSet rs = stmt.executeQuery()) {
                    while (rs.next()) {
                        todayTotal++;
                        String st = rs.getString("status");
                        if (!"COMPLETED".equalsIgnoreCase(st)) todayPending++;

                        Map<String, Object> t = new LinkedHashMap<>();
                        t.put("id", rs.getLong("id"));
                        t.put("subject", rs.getString("subject"));
                        t.put("type", rs.getString("type"));
                        t.put("priority", rs.getString("priority"));
                        t.put("status", st);
                        t.put("dueDate", rs.getString("due_date"));
                        t.put("customerName", rs.getString("customer_name"));
                        t.put("opportunityName", rs.getString("opportunity_name"));
                        todayTaskList.add(t);
                    }
                }
            }
            tasksMap.put("totalCount", todayTotal);
            tasksMap.put("pendingCount", todayPending);
            tasksMap.put("items", todayTaskList);
            data.put("todayTasks", tasksMap);

            // 4. Lead chưa liên hệ (Untouched Leads)
            Map<String, Object> leadsMap = new LinkedHashMap<>();
            List<Map<String, Object>> untouchedList = new ArrayList<>();

            String leadSql = """
                    SELECT c.id, c.name AS lead_name,
                           c.phone, c.email, c.status, c.created_at,
                           (SELECT COUNT(*) FROM activities a WHERE a.customer_id = c.id) AS act_count
                    FROM customers c
                    WHERE (c.owner_user_id = ? OR (c.owner_user_id IS NULL AND c.status = 'MOI'))
                      AND c.is_deleted = 0
                      AND c.status IN ('MOI', 'TIEM_NANG', 'DANG_CHAM_SOC')
                    HAVING act_count = 0
                    ORDER BY c.created_at DESC
                    LIMIT 8
                    """;
            try (PreparedStatement stmt = conn.prepareStatement(leadSql)) {
                stmt.setLong(1, userId);
                try (ResultSet rs = stmt.executeQuery()) {
                    while (rs.next()) {
                        Map<String, Object> l = new LinkedHashMap<>();
                        l.put("id", rs.getLong("id"));
                        l.put("name", rs.getString("lead_name"));
                        l.put("phone", rs.getString("phone"));
                        l.put("email", rs.getString("email"));
                        l.put("status", rs.getString("status"));
                        l.put("createdAt", rs.getString("created_at"));
                        untouchedList.add(l);
                    }
                }
            }
            leadsMap.put("totalCount", untouchedList.size());
            leadsMap.put("items", untouchedList);
            data.put("untouchedLeads", leadsMap);

            // 5. Bảng xếp hạng doanh số nhóm (Team Leaderboard cho nhân viên)
            Map<String, Object> teamLeaderboard = getTeamLeaderboardForStaff(conn, userId, year, month);
            data.put("teamLeaderboard", teamLeaderboard);
        }

        return data;
    }

    /**
     * Bảng xếp hạng doanh số trong nhóm cho nhân viên kinh doanh
     * - Chỉ xem các thành viên trong cùng nhóm
     * - Xếp theo doanh số đã chốt trong kỳ, hiển thị tiến độ so với chỉ tiêu
     * - Bật tắt được theo cấu hình hệ thống
     */
    public Map<String, Object> getTeamLeaderboardForStaff(Connection conn, long userId, int year, int month) throws SQLException {
        Map<String, Object> result = new LinkedHashMap<>();

        // 1. Kiểm tra cấu hình hệ thống: bật hay tắt
        boolean isEnabled = true;
        String cfgSql = "SELECT setting_value FROM system_settings WHERE setting_key = 'team_leaderboard_staff_enabled'";
        try (PreparedStatement ps = conn.prepareStatement(cfgSql);
             ResultSet rs = ps.executeQuery()) {
            if (rs.next()) {
                String val = rs.getString("setting_value");
                if ("false".equalsIgnoreCase(val) || "0".equals(val)) {
                    isEnabled = false;
                }
            }
        } catch (SQLException ignored) {
            // Mặc định là bật nếu chưa cấu hình
        }

        result.put("enabled", isEnabled);
        if (!isEnabled) {
            result.put("message", "Tính năng bảng xếp hạng doanh số nhóm hiện đang tắt theo cấu hình hệ thống.");
            result.put("ranking", Collections.emptyList());
            return result;
        }

        // 2. Xác định nhóm của nhân viên
        Long teamId = null;
        String teamName = "";
        String userTeamSql = "SELECT u.team_id, t.name AS team_name FROM users u LEFT JOIN teams t ON t.id = u.team_id WHERE u.id = ?";
        try (PreparedStatement ps = conn.prepareStatement(userTeamSql)) {
            ps.setLong(1, userId);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    teamId = (Long) rs.getObject("team_id");
                    teamName = rs.getString("team_name");
                }
            }
        }

        if (teamId == null) {
            result.put("inTeam", false);
            result.put("message", "Bạn chưa được phân bổ vào nhóm kinh doanh nào.");
            result.put("ranking", Collections.emptyList());
            return result;
        }

        result.put("inTeam", true);
        result.put("teamId", teamId);
        result.put("teamName", teamName);

        // 3. Xếp hạng tất cả thành viên trong nhóm theo doanh số đã chốt trong kỳ
        List<Map<String, Object>> ranking = new ArrayList<>();
        String rankSql = """
                SELECT u.id, u.full_name, u.email,
                       COALESCE(st.target_amount, 0) AS target_amount,
                       COALESCE(st.target_deals, 0) AS target_deals,
                       (SELECT COALESCE(SUM(o.amount), 0)
                        FROM opportunities o
                        WHERE o.owner_user_id = u.id AND o.status = 'WON' AND o.is_deleted = 0
                          AND MONTH(COALESCE(o.actual_close_date, o.updated_at)) = ?
                          AND YEAR(COALESCE(o.actual_close_date, o.updated_at)) = ?) AS won_amount,
                       (SELECT COUNT(*)
                        FROM opportunities o
                        WHERE o.owner_user_id = u.id AND o.status = 'WON' AND o.is_deleted = 0
                          AND MONTH(COALESCE(o.actual_close_date, o.updated_at)) = ?
                          AND YEAR(COALESCE(o.actual_close_date, o.updated_at)) = ?) AS won_deals
                FROM users u
                LEFT JOIN sales_targets st ON st.user_id = u.id AND st.period_year = ? AND st.period_month = ?
                WHERE u.team_id = ? AND u.status = 'ACTIVE'
                ORDER BY won_amount DESC, won_deals DESC, u.full_name ASC
                """;

        int myRank = -1;
        BigDecimal myWon = BigDecimal.ZERO;
        BigDecimal myTarget = BigDecimal.ZERO;
        BigDecimal topWon = BigDecimal.ZERO;
        BigDecimal gapToNext = BigDecimal.ZERO;

        try (PreparedStatement stmt = conn.prepareStatement(rankSql)) {
            stmt.setInt(1, month);
            stmt.setInt(2, year);
            stmt.setInt(3, month);
            stmt.setInt(4, year);
            stmt.setInt(5, year);
            stmt.setInt(6, month);
            stmt.setLong(7, teamId);
            try (ResultSet rs = stmt.executeQuery()) {
                int rank = 1;
                BigDecimal lastSeenWon = BigDecimal.ZERO;
                while (rs.next()) {
                    long mid = rs.getLong("id");
                    String fullName = rs.getString("full_name");
                    String email = rs.getString("email");
                    BigDecimal tgt = rs.getBigDecimal("target_amount");
                    BigDecimal won = rs.getBigDecimal("won_amount");
                    int deals = rs.getInt("won_deals");

                    if (rank == 1) {
                        topWon = won;
                    }

                    BigDecimal attainment = BigDecimal.ZERO;
                    if (tgt != null && tgt.compareTo(BigDecimal.ZERO) > 0) {
                        attainment = won.multiply(BigDecimal.valueOf(100)).divide(tgt, 1, RoundingMode.HALF_UP);
                    }

                    boolean isCurrent = (mid == userId);
                    if (isCurrent) {
                        myRank = rank;
                        myWon = won;
                        myTarget = tgt != null ? tgt : BigDecimal.ZERO;
                        if (rank > 1) {
                            gapToNext = lastSeenWon.subtract(won);
                            if (gapToNext.compareTo(BigDecimal.ZERO) < 0) gapToNext = BigDecimal.ZERO;
                        }
                    }

                    lastSeenWon = won;

                    Map<String, Object> m = new LinkedHashMap<>();
                    m.put("rank", rank++);
                    m.put("userId", mid);
                    m.put("fullName", fullName);
                    m.put("email", email);
                    m.put("targetAmount", tgt);
                    m.put("wonAmount", won);
                    m.put("wonDeals", deals);
                    m.put("attainmentRate", attainment);
                    m.put("isCurrentUser", isCurrent);
                    ranking.add(m);
                }
            }
        }

        result.put("ranking", ranking);
        result.put("totalMembers", ranking.size());
        result.put("myRank", myRank);
        result.put("myWonAmount", myWon);
        result.put("myTargetAmount", myTarget);
        result.put("topWonAmount", topWon);
        result.put("gapToNext", gapToNext);

        return result;
    }

    /**
     * Dashboard cho Trưởng nhóm kinh doanh (Team Lead)
     * Thấy thêm:
     * - Xếp hạng thành viên (Leaderboard / Ranking)
     * - Cơ hội đình trệ của nhóm (Stagnant Opportunities)
     * - Việc quá hạn của nhóm (Team Overdue Tasks)
     */
    public Map<String, Object> getTeamLeadDashboard(long userId, Long teamId, int year, int month) throws SQLException {
        // Lấy dữ liệu cá nhân của Trưởng nhóm
        Map<String, Object> data = getStaffDashboard(userId, year, month);

        if (teamId == null) {
            teamId = getUserTeamId(userId);
        }
        if (teamId == null) {
            teamId = getFirstActiveTeamId();
        }
        data.put("teamId", teamId);

        if (teamId == null) {
            return data;
        }

        try (Connection conn = DatabaseConfig.getConnection()) {
            // 1. Xếp hạng thành viên nhóm (Member Leaderboard)
            List<Map<String, Object>> rankingList = new ArrayList<>();
            String rankSql = """
                    SELECT u.id, u.full_name, u.email,
                           COALESCE(st.target_amount, 0) AS target_amount,
                           COALESCE(st.target_deals, 0) AS target_deals,
                           (SELECT COALESCE(SUM(o.amount), 0)
                            FROM opportunities o
                            WHERE o.owner_user_id = u.id AND o.status = 'WON' AND o.is_deleted = 0
                              AND MONTH(COALESCE(o.actual_close_date, o.updated_at)) = ?
                              AND YEAR(COALESCE(o.actual_close_date, o.updated_at)) = ?) AS won_amount,
                           (SELECT COUNT(*)
                            FROM opportunities o
                            WHERE o.owner_user_id = u.id AND o.status = 'WON' AND o.is_deleted = 0
                              AND MONTH(COALESCE(o.actual_close_date, o.updated_at)) = ?
                              AND YEAR(COALESCE(o.actual_close_date, o.updated_at)) = ?) AS won_deals
                    FROM users u
                    LEFT JOIN sales_targets st ON st.user_id = u.id AND st.period_year = ? AND st.period_month = ?
                    WHERE u.team_id = ? AND u.status = 'ACTIVE'
                    ORDER BY won_amount DESC, u.full_name ASC
                    """;
            try (PreparedStatement stmt = conn.prepareStatement(rankSql)) {
                stmt.setInt(1, month);
                stmt.setInt(2, year);
                stmt.setInt(3, month);
                stmt.setInt(4, year);
                stmt.setInt(5, year);
                stmt.setInt(6, month);
                stmt.setLong(7, teamId);
                try (ResultSet rs = stmt.executeQuery()) {
                    int rank = 1;
                    while (rs.next()) {
                        Map<String, Object> m = new LinkedHashMap<>();
                        m.put("rank", rank++);
                        m.put("userId", rs.getLong("id"));
                        m.put("fullName", rs.getString("full_name"));
                        m.put("email", rs.getString("email"));
                        BigDecimal tgt = rs.getBigDecimal("target_amount");
                        BigDecimal won = rs.getBigDecimal("won_amount");
                        m.put("targetAmount", tgt);
                        m.put("wonAmount", won);
                        m.put("targetDeals", rs.getInt("target_deals"));
                        m.put("wonDeals", rs.getInt("won_deals"));

                        BigDecimal rate = BigDecimal.ZERO;
                        if (tgt != null && tgt.compareTo(BigDecimal.ZERO) > 0) {
                            rate = won.multiply(BigDecimal.valueOf(100)).divide(tgt, 1, RoundingMode.HALF_UP);
                        }
                        m.put("achievementRate", rate);
                        rankingList.add(m);
                    }
                }
            }
            data.put("memberRanking", rankingList);

            // 2. Cơ hội đình trệ của nhóm (Team Stagnant Opportunities)
            Map<String, Object> stagnantMap = new LinkedHashMap<>();
            List<Map<String, Object>> stagnantList = new ArrayList<>();
            BigDecimal totalStagnantAmount = BigDecimal.ZERO;

            String stagSql = """
                    SELECT o.id, o.name, COALESCE(c.name, '') AS customer_name,
                           o.amount, ps.name AS stage_name, ps.stagnant_days,
                           u.full_name AS owner_name,
                           DATEDIFF(NOW(), COALESCE(o.stage_updated_at, o.updated_at)) AS days_in_stage,
                           o.expected_close_date
                    FROM opportunities o
                    JOIN users u ON u.id = o.owner_user_id
                    JOIN pipeline_stages ps ON ps.id = o.stage_id
                    LEFT JOIN customers c ON c.id = o.customer_id
                    WHERE u.team_id = ? AND o.status = 'OPEN' AND o.is_deleted = 0
                      AND (o.is_stagnant = 1 OR DATEDIFF(NOW(), COALESCE(o.stage_updated_at, o.updated_at)) >= ps.stagnant_days)
                    ORDER BY days_in_stage DESC
                    LIMIT 8
                    """;
            try (PreparedStatement stmt = conn.prepareStatement(stagSql)) {
                stmt.setLong(1, teamId);
                try (ResultSet rs = stmt.executeQuery()) {
                    while (rs.next()) {
                        Map<String, Object> s = new LinkedHashMap<>();
                        s.put("id", rs.getLong("id"));
                        s.put("name", rs.getString("name"));
                        s.put("customerName", rs.getString("customer_name"));
                        BigDecimal amt = rs.getBigDecimal("amount");
                        s.put("amount", amt);
                        if (amt != null) totalStagnantAmount = totalStagnantAmount.add(amt);
                        s.put("stageName", rs.getString("stage_name"));
                        s.put("stagnantDays", rs.getInt("stagnant_days"));
                        s.put("ownerName", rs.getString("owner_name"));
                        s.put("daysInStage", rs.getInt("days_in_stage"));
                        s.put("expectedCloseDate", rs.getString("expected_close_date"));
                        stagnantList.add(s);
                    }
                }
            }
            stagnantMap.put("totalCount", stagnantList.size());
            stagnantMap.put("totalAmountAtRisk", totalStagnantAmount);
            stagnantMap.put("items", stagnantList);
            data.put("teamStagnantOpportunities", stagnantMap);

            // 3. Việc quá hạn của nhóm (Team Overdue Tasks)
            Map<String, Object> overdueMap = new LinkedHashMap<>();
            List<Map<String, Object>> memberSummary = new ArrayList<>();
            int totalOverdue = 0;

            String memberOverdueSql = """
                    SELECT u.id AS user_id, u.full_name, COUNT(a.id) AS overdue_count
                    FROM users u
                    LEFT JOIN activities a ON a.owner_user_id = u.id AND a.due_date < CURDATE() AND a.status != 'COMPLETED'
                    WHERE u.team_id = ? AND u.status = 'ACTIVE'
                    GROUP BY u.id, u.full_name
                    HAVING overdue_count > 0
                    ORDER BY overdue_count DESC
                    """;
            try (PreparedStatement stmt = conn.prepareStatement(memberOverdueSql)) {
                stmt.setLong(1, teamId);
                try (ResultSet rs = stmt.executeQuery()) {
                    while (rs.next()) {
                        int c = rs.getInt("overdue_count");
                        totalOverdue += c;
                        Map<String, Object> mo = new LinkedHashMap<>();
                        mo.put("userId", rs.getLong("user_id"));
                        mo.put("fullName", rs.getString("full_name"));
                        mo.put("overdueCount", c);
                        memberSummary.add(mo);
                    }
                }
            }

            List<Map<String, Object>> overdueItems = new ArrayList<>();
            String detailOverdueSql = """
                    SELECT a.id, a.subject, a.due_date, u.full_name AS owner_name,
                           COALESCE(c.name, '') AS customer_name,
                           o.name AS opportunity_name
                    FROM activities a
                    JOIN users u ON u.id = a.owner_user_id
                    LEFT JOIN customers c ON c.id = a.customer_id
                    LEFT JOIN opportunities o ON o.id = a.opportunity_id
                    WHERE u.team_id = ? AND a.due_date < CURDATE() AND a.status != 'COMPLETED'
                    ORDER BY a.due_date ASC
                    LIMIT 10
                    """;
            try (PreparedStatement stmt = conn.prepareStatement(detailOverdueSql)) {
                stmt.setLong(1, teamId);
                try (ResultSet rs = stmt.executeQuery()) {
                    while (rs.next()) {
                        Map<String, Object> oi = new LinkedHashMap<>();
                        oi.put("id", rs.getLong("id"));
                        oi.put("subject", rs.getString("subject"));
                        oi.put("dueDate", rs.getString("due_date"));
                        oi.put("ownerName", rs.getString("owner_name"));
                        oi.put("customerName", rs.getString("customer_name"));
                        oi.put("opportunityName", rs.getString("opportunity_name"));
                        overdueItems.add(oi);
                    }
                }
            }
            overdueMap.put("totalCount", totalOverdue);
            overdueMap.put("memberSummary", memberSummary);
            overdueMap.put("items", overdueItems);
            data.put("teamOverdueTasks", overdueMap);
        }

        return data;
    }

    /**
     * Dashboard cho Giám đốc kinh doanh (Sales Director / Admin)
     * Thấy toàn khối:
     * - Dự báo so với chỉ tiêu (Forecast vs Quota)
     * - Giá trị pipeline theo giai đoạn (Pipeline Value by Stage)
     * - Doanh số đã chốt theo tháng (Closed-Won Sales Revenue by Month)
     */
    public Map<String, Object> getDirectorDashboard(int year, int month, int quarter) throws SQLException {
        Map<String, Object> data = new LinkedHashMap<>();

        try (Connection conn = DatabaseConfig.getConnection()) {
            // 1. Dự báo so với chỉ tiêu toàn khối (Forecast vs Quota)
            Map<String, Object> forecastMap = new LinkedHashMap<>();
            BigDecimal totalQuota = BigDecimal.ZERO;

            String quotaSql = """
                    SELECT COALESCE(SUM(target_amount), 0) AS total_quota
                    FROM sales_targets
                    WHERE user_id IS NOT NULL AND period_year = ? AND period_month = ?
                    """;
            try (PreparedStatement stmt = conn.prepareStatement(quotaSql)) {
                stmt.setInt(1, year);
                stmt.setInt(2, month);
                try (ResultSet rs = stmt.executeQuery()) {
                    if (rs.next()) totalQuota = rs.getBigDecimal("total_quota");
                }
            }

            BigDecimal closedWon = BigDecimal.ZERO;
            int wonCount = 0;
            String wonSql = """
                    SELECT COALESCE(SUM(amount), 0) AS won_val, COUNT(*) AS won_cnt
                    FROM opportunities
                    WHERE status = 'WON' AND is_deleted = 0
                      AND MONTH(COALESCE(actual_close_date, updated_at)) = ?
                      AND YEAR(COALESCE(actual_close_date, updated_at)) = ?
                    """;
            try (PreparedStatement stmt = conn.prepareStatement(wonSql)) {
                stmt.setInt(1, month);
                stmt.setInt(2, year);
                try (ResultSet rs = stmt.executeQuery()) {
                    if (rs.next()) {
                        closedWon = rs.getBigDecimal("won_val");
                        wonCount = rs.getInt("won_cnt");
                    }
                }
            }

            BigDecimal openPipelineValue = BigDecimal.ZERO;
            BigDecimal weightedForecast = BigDecimal.ZERO;
            int openDealsCount = 0;
            String pipelineSql = """
                    SELECT COUNT(*) AS open_cnt,
                           COALESCE(SUM(amount), 0) AS open_val,
                           COALESCE(SUM(amount * probability / 100.0), 0) AS weighted_val
                    FROM opportunities
                    WHERE status = 'OPEN' AND is_deleted = 0
                    """;
            try (PreparedStatement stmt = conn.prepareStatement(pipelineSql);
                 ResultSet rs = stmt.executeQuery()) {
                if (rs.next()) {
                    openDealsCount = rs.getInt("open_cnt");
                    openPipelineValue = rs.getBigDecimal("open_val");
                    weightedForecast = rs.getBigDecimal("weighted_val");
                }
            }

            BigDecimal totalProjected = closedWon.add(weightedForecast);
            BigDecimal projectedAchievementRate = BigDecimal.ZERO;
            if (totalQuota != null && totalQuota.compareTo(BigDecimal.ZERO) > 0) {
                projectedAchievementRate = totalProjected.multiply(BigDecimal.valueOf(100)).divide(totalQuota, 1, RoundingMode.HALF_UP);
            }

            BigDecimal gap = totalQuota != null ? totalQuota.subtract(totalProjected) : BigDecimal.ZERO;

            forecastMap.put("periodYear", year);
            forecastMap.put("periodMonth", month);
            forecastMap.put("totalQuota", totalQuota);
            forecastMap.put("closedWonAmount", closedWon);
            forecastMap.put("closedWonDeals", wonCount);
            forecastMap.put("openPipelineValue", openPipelineValue);
            forecastMap.put("weightedForecastAmount", weightedForecast);
            forecastMap.put("openDealsCount", openDealsCount);
            forecastMap.put("totalProjectedRevenue", totalProjected);
            forecastMap.put("projectedAchievementRate", projectedAchievementRate);
            forecastMap.put("gapToTarget", gap);
            data.put("forecastVsTarget", forecastMap);

            // 2. Giá trị Pipeline theo từng giai đoạn (Pipeline Value by Stage)
            List<Map<String, Object>> stageList = new ArrayList<>();
            BigDecimal allStagesTotal = BigDecimal.ZERO;
            String stageSql = """
                    SELECT ps.id, ps.name, ps.order_no, ps.probability,
                           COUNT(o.id) AS opp_count,
                           COALESCE(SUM(o.amount), 0) AS total_amount
                    FROM pipeline_stages ps
                    LEFT JOIN opportunities o ON o.stage_id = ps.id AND o.status = 'OPEN' AND o.is_deleted = 0
                    GROUP BY ps.id, ps.name, ps.order_no, ps.probability
                    ORDER BY ps.order_no ASC
                    """;
            try (PreparedStatement stmt = conn.prepareStatement(stageSql);
                 ResultSet rs = stmt.executeQuery()) {
                while (rs.next()) {
                    Map<String, Object> st = new LinkedHashMap<>();
                    st.put("id", rs.getLong("id"));
                    st.put("name", rs.getString("name"));
                    st.put("orderIndex", rs.getInt("order_no"));
                    st.put("probability", rs.getInt("probability"));
                    st.put("oppCount", rs.getInt("opp_count"));
                    BigDecimal amt = rs.getBigDecimal("total_amount");
                    st.put("totalAmount", amt);
                    allStagesTotal = allStagesTotal.add(amt);
                    stageList.add(st);
                }
            }
            // Compute percentage for each stage
            for (Map<String, Object> st : stageList) {
                BigDecimal amt = (BigDecimal) st.get("totalAmount");
                BigDecimal pct = BigDecimal.ZERO;
                if (allStagesTotal.compareTo(BigDecimal.ZERO) > 0) {
                    pct = amt.multiply(BigDecimal.valueOf(100)).divide(allStagesTotal, 1, RoundingMode.HALF_UP);
                }
                st.put("percentage", pct);
            }
            Map<String, Object> pipelineByStageMap = new LinkedHashMap<>();
            pipelineByStageMap.put("stages", stageList);
            pipelineByStageMap.put("totalPipelineValue", allStagesTotal);
            data.put("pipelineByStage", pipelineByStageMap);

            // 3. Doanh số đã chốt theo 12 tháng (Closed-Won Sales Revenue by Month)
            Map<Integer, BigDecimal> monthlyWonMap = new LinkedHashMap<>();
            Map<Integer, Integer> monthlyWonDealsMap = new LinkedHashMap<>();
            for (int m = 1; m <= 12; m++) {
                monthlyWonMap.put(m, BigDecimal.ZERO);
                monthlyWonDealsMap.put(m, 0);
            }

            String monthWonSql = """
                    SELECT MONTH(COALESCE(actual_close_date, updated_at)) AS m,
                           COALESCE(SUM(amount), 0) AS won_val,
                           COUNT(*) AS deal_cnt
                    FROM opportunities
                    WHERE status = 'WON' AND is_deleted = 0
                      AND YEAR(COALESCE(actual_close_date, updated_at)) = ?
                    GROUP BY m
                    ORDER BY m ASC
                    """;
            try (PreparedStatement stmt = conn.prepareStatement(monthWonSql)) {
                stmt.setInt(1, year);
                try (ResultSet rs = stmt.executeQuery()) {
                    while (rs.next()) {
                        int m = rs.getInt("m");
                        monthlyWonMap.put(m, rs.getBigDecimal("won_val"));
                        monthlyWonDealsMap.put(m, rs.getInt("deal_cnt"));
                    }
                }
            }

            Map<Integer, BigDecimal> monthlyTargetMap = new LinkedHashMap<>();
            for (int m = 1; m <= 12; m++) monthlyTargetMap.put(m, BigDecimal.ZERO);

            String monthTargetSql = """
                    SELECT period_month AS m, COALESCE(SUM(target_amount), 0) AS tgt_val
                    FROM sales_targets
                    WHERE user_id IS NOT NULL AND period_year = ? AND period_month IS NOT NULL
                    GROUP BY period_month
                    """;
            try (PreparedStatement stmt = conn.prepareStatement(monthTargetSql)) {
                stmt.setInt(1, year);
                try (ResultSet rs = stmt.executeQuery()) {
                    while (rs.next()) {
                        monthlyTargetMap.put(rs.getInt("m"), rs.getBigDecimal("tgt_val"));
                    }
                }
            }

            List<Map<String, Object>> monthlyList = new ArrayList<>();
            BigDecimal ytdWon = BigDecimal.ZERO;
            BigDecimal ytdTarget = BigDecimal.ZERO;

            for (int m = 1; m <= 12; m++) {
                Map<String, Object> item = new LinkedHashMap<>();
                item.put("month", m);
                item.put("label", "Tháng " + m);
                BigDecimal w = monthlyWonMap.get(m);
                BigDecimal t = monthlyTargetMap.get(m);
                item.put("wonAmount", w);
                item.put("targetAmount", t);
                item.put("dealsCount", monthlyWonDealsMap.get(m));

                BigDecimal rate = BigDecimal.ZERO;
                if (t != null && t.compareTo(BigDecimal.ZERO) > 0) {
                    rate = w.multiply(BigDecimal.valueOf(100)).divide(t, 1, RoundingMode.HALF_UP);
                }
                item.put("achievementRate", rate);

                if (m <= month) {
                    ytdWon = ytdWon.add(w);
                    ytdTarget = ytdTarget.add(t);
                }
                monthlyList.add(item);
            }

            Map<String, Object> monthlyRevenueMap = new LinkedHashMap<>();
            monthlyRevenueMap.put("year", year);
            monthlyRevenueMap.put("currentMonth", month);
            monthlyRevenueMap.put("ytdWonAmount", ytdWon);
            monthlyRevenueMap.put("ytdTargetAmount", ytdTarget);
            monthlyRevenueMap.put("months", monthlyList);
            data.put("monthlyClosedSales", monthlyRevenueMap);
        }

        return data;
    }

    private Long getUserTeamId(long userId) throws SQLException {
        String sql = "SELECT team_id FROM users WHERE id = ?";
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setLong(1, userId);
            try (ResultSet rs = stmt.executeQuery()) {
                if (rs.next()) return (Long) rs.getObject("team_id");
            }
        }
        return null;
    }

    private Long getFirstActiveTeamId() throws SQLException {
        String sql = "SELECT id FROM teams WHERE active = 1 ORDER BY id LIMIT 1";
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql);
             ResultSet rs = stmt.executeQuery()) {
            if (rs.next()) return rs.getLong("id");
        }
        return null;
    }
}
