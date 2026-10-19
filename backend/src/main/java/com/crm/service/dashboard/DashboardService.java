package com.crm.service.dashboard;

import com.crm.config.DatabaseConfig;
import com.crm.dao.dashboard.DashboardDAO;
import com.crm.dao.permissions.PermissionDAO;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.LocalDate;
import java.util.*;

public class DashboardService {

    private final DashboardDAO dashboardDAO = new DashboardDAO();
    private final PermissionDAO permissionDAO = new PermissionDAO();

    public Map<String, Object> getDashboard(long currentUserId, String requestedRoleView, Long requestedTeamId, Integer year, Integer month, Integer quarter) throws SQLException {
        long startTime = System.currentTimeMillis();

        LocalDate now = LocalDate.now();
        int resolvedYear = (year != null && year > 2000) ? year : now.getYear();
        int resolvedMonth = (month != null && month >= 1 && month <= 12) ? month : now.getMonthValue();
        int resolvedQuarter = (quarter != null && quarter >= 1 && quarter <= 4) ? quarter : ((resolvedMonth - 1) / 3 + 1);

        // Lấy danh sách roles của người dùng
        List<Map<String, Object>> roles = permissionDAO.findRolesByUserId(currentUserId);
        Set<String> roleCodes = new HashSet<>();
        for (Map<String, Object> r : roles) {
            Object code = r.get("code");
            if (code != null) roleCodes.add(code.toString());
        }

        boolean isAdminOrDirector = roleCodes.contains("ADMIN") || roleCodes.contains("DIRECTOR");
        boolean isTeamLead = roleCodes.contains("TEAM_LEAD");

        String primaryRole = isAdminOrDirector ? "DIRECTOR" : (isTeamLead ? "TEAM_LEAD" : "STAFF");

        List<String> availableRoleViews = new ArrayList<>();
        if (isAdminOrDirector) {
            availableRoleViews.add("DIRECTOR");
            availableRoleViews.add("TEAM_LEAD");
            availableRoleViews.add("STAFF");
        } else if (isTeamLead) {
            availableRoleViews.add("TEAM_LEAD");
            availableRoleViews.add("STAFF");
        } else {
            availableRoleViews.add("STAFF");
        }

        String activeRoleView = primaryRole;
        if (requestedRoleView != null && !requestedRoleView.trim().isEmpty()) {
            String reqUpper = requestedRoleView.trim().toUpperCase();
            if ("SALES_REP".equals(reqUpper) || "EMPLOYEE".equals(reqUpper)) {
                reqUpper = "STAFF";
            }
            if (availableRoleViews.contains(reqUpper)) {
                activeRoleView = reqUpper;
            } else {
                throw new SecurityException("Bạn không có quyền xem dashboard với vai trò: " + requestedRoleView);
            }
        }

        // Lấy thông tin user & team
        String userName = "";
        String userEmail = "";
        String teamName = "";
        Long userTeamId = null;

        String userSql = """
                SELECT u.full_name, u.email, u.team_id, t.name AS team_name
                FROM users u
                LEFT JOIN teams t ON t.id = u.team_id
                WHERE u.id = ?
                """;
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(userSql)) {
            ps.setLong(1, currentUserId);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    userName = rs.getString("full_name");
                    userEmail = rs.getString("email");
                    userTeamId = (Long) rs.getObject("team_id");
                    teamName = rs.getString("team_name");
                }
            }
        }

        Long effectiveTeamId = userTeamId;
        if (isAdminOrDirector && requestedTeamId != null) {
            effectiveTeamId = requestedTeamId;
        }

        // Nếu admin/director chọn team khác, lấy lại tên team
        if (effectiveTeamId != null && !Objects.equals(effectiveTeamId, userTeamId)) {
            String teamSql = "SELECT name FROM teams WHERE id = ?";
            try (Connection conn = DatabaseConfig.getConnection();
                 PreparedStatement ps = conn.prepareStatement(teamSql)) {
                ps.setLong(1, effectiveTeamId);
                try (ResultSet rs = ps.executeQuery()) {
                    if (rs.next()) {
                        teamName = rs.getString("name");
                    }
                }
            }
        }

        // Danh sách các nhóm để chuyển đổi nhanh khi là Admin/Director
        List<Map<String, Object>> teamOptions = new ArrayList<>();
        if (isAdminOrDirector) {
            String allTeamsSql = "SELECT id, name FROM teams WHERE active = 1 ORDER BY name";
            try (Connection conn = DatabaseConfig.getConnection();
                 PreparedStatement ps = conn.prepareStatement(allTeamsSql);
                 ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    Map<String, Object> t = new HashMap<>();
                    t.put("id", rs.getLong("id"));
                    t.put("name", rs.getString("name"));
                    teamOptions.add(t);
                }
            }
        }

        // Lấy dữ liệu theo vai trò
        Map<String, Object> roleData;
        if ("DIRECTOR".equals(activeRoleView)) {
            roleData = dashboardDAO.getDirectorDashboard(resolvedYear, resolvedMonth, resolvedQuarter);
        } else if ("TEAM_LEAD".equals(activeRoleView)) {
            roleData = dashboardDAO.getTeamLeadDashboard(currentUserId, effectiveTeamId, resolvedYear, resolvedMonth);
        } else {
            roleData = dashboardDAO.getStaffDashboard(currentUserId, resolvedYear, resolvedMonth);
        }

        long executionTimeMs = System.currentTimeMillis() - startTime;

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("activeRoleView", activeRoleView);
        response.put("primaryRole", primaryRole);
        response.put("availableRoleViews", availableRoleViews);
        response.put("year", resolvedYear);
        response.put("month", resolvedMonth);
        response.put("quarter", resolvedQuarter);
        response.put("userName", userName);
        response.put("userEmail", userEmail);
        response.put("teamName", teamName);
        response.put("teamId", effectiveTeamId);
        response.put("teamOptions", teamOptions);
        response.put("executionTimeMs", executionTimeMs);
        response.put("isUnder2Seconds", executionTimeMs < 2000);
        response.put("data", roleData);

        return response;
    }
}
