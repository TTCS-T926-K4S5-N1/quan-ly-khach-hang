package com.crm.dao.notifications;

import com.crm.config.DatabaseConfig;
import com.crm.dto.notifications.UserNotificationSettingDTO;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.*;

public class UserNotificationSettingDAO {

    // Danh mục các loại thông báo chuẩn của CRM
    public static class NotifTypeMeta {
        public final String code;
        public final String label;
        public final String description;
        public final boolean mandatory;

        public NotifTypeMeta(String code, String label, String description, boolean mandatory) {
            this.code = code;
            this.label = label;
            this.description = description;
            this.mandatory = mandatory;
        }
    }

    public static final List<NotifTypeMeta> SYSTEM_NOTIFICATION_TYPES = List.of(
            new NotifTypeMeta("QUOTE_APPROVAL_REQUEST", "Báo giá chờ phê duyệt", "Thông báo khi có báo giá vượt thẩm quyền cần duyệt (Bắt buộc)", true),
            new NotifTypeMeta("LEAD_ASSIGNED", "Được phân lead mới", "Thông báo khi bạn được chỉ định chăm sóc khách hàng tiềm năng mới", false),
            new NotifTypeMeta("QUOTE_RESPONSE", "Khách phản hồi báo giá", "Thông báo khi khách hàng đồng ý, từ chối hoặc góp ý về báo giá", false),
            new NotifTypeMeta("TASK_ASSIGNED", "Được giao việc mới", "Thông báo khi bạn được giao công việc hoặc lịch hẹn cần xử lý", false),
            new NotifTypeMeta("OPPORTUNITY_STAGNANT", "Cơ hội bị gắn cờ đình trệ", "Cảnh báo khi cơ hội vượt quá thời gian quy định không có tương tác", false),
            new NotifTypeMeta("AUTOMATION_EVENT", "Quy tắc tự động hoá", "Thông báo từ các quy tắc bán hàng Khi–Thì tự động thực thi", false),
            new NotifTypeMeta("CUSTOMER_EMAIL", "Email khách hàng & Tương tác", "Thông báo phản hồi thư hoặc gửi email hàng đợi", false)
    );

    /**
     * Lấy danh sách cấu hình thông báo cho người dùng, tự động điền mặc định nếu chưa lưu
     */
    public List<UserNotificationSettingDTO> getSettingsForUser(long userId) throws SQLException {
        Map<String, UserNotificationSettingDTO> saved = new HashMap<>();

        String sql = "SELECT id, notification_type, in_app_enabled, email_enabled FROM user_notification_settings WHERE user_id = ?";
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setLong(1, userId);
            try (ResultSet rs = stmt.executeQuery()) {
                while (rs.next()) {
                    UserNotificationSettingDTO dto = new UserNotificationSettingDTO();
                    dto.setId(rs.getLong("id"));
                    dto.setUserId(userId);
                    dto.setNotificationType(rs.getString("notification_type"));
                    dto.setInAppEnabled(rs.getBoolean("in_app_enabled"));
                    dto.setEmailEnabled(rs.getBoolean("email_enabled"));
                    saved.put(dto.getNotificationType(), dto);
                }
            }
        }

        List<UserNotificationSettingDTO> result = new ArrayList<>();
        for (NotifTypeMeta meta : SYSTEM_NOTIFICATION_TYPES) {
            UserNotificationSettingDTO s = saved.get(meta.code);
            if (s == null) {
                s = new UserNotificationSettingDTO(userId, meta.code, meta.label, meta.description, true, true, meta.mandatory);
            } else {
                s.setTypeLabel(meta.label);
                s.setDescription(meta.description);
                s.setMandatory(meta.mandatory);
                // Thông báo bắt buộc như báo giá chờ duyệt thì không tắt được ở kênh trong ứng dụng
                if (meta.mandatory) {
                    s.setInAppEnabled(true);
                }
            }
            result.add(s);
        }

        return result;
    }

    /**
     * Lưu cấu hình thông báo cá nhân của người dùng
     */
    public void saveSettings(long userId, List<UserNotificationSettingDTO> settings) throws SQLException {
        String sql = """
            INSERT INTO user_notification_settings (user_id, notification_type, in_app_enabled, email_enabled)
            VALUES (?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
                in_app_enabled = VALUES(in_app_enabled),
                email_enabled = VALUES(email_enabled),
                updated_at = NOW()
        """;

        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            conn.setAutoCommit(false);
            for (UserNotificationSettingDTO dto : settings) {
                // Kiểm tra ràng buộc bắt buộc: QUOTE_APPROVAL_REQUEST luôn in_app_enabled = true
                boolean inApp = dto.isInAppEnabled();
                if ("QUOTE_APPROVAL_REQUEST".equalsIgnoreCase(dto.getNotificationType())) {
                    inApp = true;
                }

                stmt.setLong(1, userId);
                stmt.setString(2, dto.getNotificationType());
                stmt.setBoolean(3, inApp);
                stmt.setBoolean(4, dto.isEmailEnabled());
                stmt.addBatch();
            }
            stmt.executeBatch();
            conn.commit();
        }
    }

    /**
     * Kiểm tra xem người dùng có bật kênh thông báo cho sự kiện cụ thể hay không
     */
    public boolean isChannelEnabled(long userId, String notificationType, String channel) {
        // Thông báo bắt buộc như Báo giá chờ duyệt: kênh trong ứng dụng luôn bật 100%
        if ("QUOTE_APPROVAL_REQUEST".equalsIgnoreCase(notificationType) && "in_app".equalsIgnoreCase(channel)) {
            return true;
        }

        String col = "email".equalsIgnoreCase(channel) ? "email_enabled" : "in_app_enabled";
        String sql = "SELECT " + col + " FROM user_notification_settings WHERE user_id = ? AND notification_type = ?";

        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setLong(1, userId);
            stmt.setString(2, notificationType);
            try (ResultSet rs = stmt.executeQuery()) {
                if (rs.next()) {
                    return rs.getBoolean(col);
                }
            }
        } catch (SQLException e) {
            System.err.println("[UserNotificationSettingDAO] Lỗi kiểm tra cài đặt thông báo: " + e.getMessage());
        }

        // Mặc định bật nếu chưa cấu hình
        return true;
    }
}
