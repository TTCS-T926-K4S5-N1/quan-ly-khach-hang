package com.crm.service.notifications;

import com.crm.config.DatabaseConfig;
import com.crm.dao.emails.EmailQueueDAO;
import com.crm.dao.notifications.NotificationDAO;
import com.crm.dao.notifications.UserNotificationSettingDAO;
import com.crm.dto.emails.EmailQueueDTO;
import com.crm.dto.notifications.NotificationDTO;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.List;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

public class NotificationService {

    private static final NotificationService INSTANCE = new NotificationService();

    private final NotificationDAO notificationDAO = new NotificationDAO();
    private final UserNotificationSettingDAO settingDAO = new UserNotificationSettingDAO();
    private final EmailQueueDAO emailQueueDAO = new EmailQueueDAO();

    private final ExecutorService executor = Executors.newFixedThreadPool(3, r -> {
        Thread t = new Thread(r, "crm-notification-worker");
        t.setDaemon(true);
        return t;
    });

    private NotificationService() {}

    public static NotificationService getInstance() {
        return INSTANCE;
    }

    /**
     * Sinh thông báo bất đồng bộ - kiểm tra cấu hình riêng của người dùng (In-App và Email).
     * Thông báo bắt buộc (QUOTE_APPROVAL_REQUEST) luôn được gửi qua In-App, không tắt được.
     */
    public void sendAsync(long userId, String type, String title, String content, String link, String entityType, Long entityId) {
        if (userId <= 0) return;
        executor.submit(() -> {
            try {
                // 1. Kiểm tra cấu hình kênh trong ứng dụng
                boolean inAppEnabled = settingDAO.isChannelEnabled(userId, type, "in_app");
                if (inAppEnabled) {
                    NotificationDTO n = new NotificationDTO(userId, type, title, content, link, entityType, entityId);
                    notificationDAO.insert(n);
                } else {
                    System.out.println("[NotificationService] Người dùng #" + userId + " đã tắt thông báo trong ứng dụng cho loại " + type);
                }

                // 2. Kiểm tra cấu hình kênh email
                boolean emailEnabled = settingDAO.isChannelEnabled(userId, type, "email");
                if (emailEnabled) {
                    sendEmailNotificationToUser(userId, type, title, content, link);
                }
            } catch (Exception e) {
                System.err.println("[NotificationService] Lỗi khi sinh thông báo bất đồng bộ: " + e.getMessage());
            }
        });
    }

    private void sendEmailNotificationToUser(long userId, String type, String title, String content, String link) {
        String sql = "SELECT full_name, email FROM users WHERE id = ?";
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setLong(1, userId);
            try (ResultSet rs = stmt.executeQuery()) {
                if (rs.next()) {
                    String userEmail = rs.getString("email");
                    String userName = rs.getString("full_name");
                    if (userEmail != null && userEmail.contains("@")) {
                        EmailQueueDTO mail = new EmailQueueDTO();
                        mail.setRecipientEmail(userEmail);
                        mail.setRecipientName(userName);
                        mail.setSubject("[CRM Thông báo] " + title);
                        mail.setBodyHtml("<p>Kính gửi <strong>" + userName + "</strong>,</p>" +
                                         "<p>" + content + "</p>" +
                                         "<p><a href=\"http://localhost:8080/crm/" + link + "\" style=\"display:inline-block;padding:8px 16px;background:#2563eb;color:#ffffff;text-decoration:none;border-radius:4px;\">Xem chi tiết trên hệ thống CRM</a></p>" +
                                         "<p><em>Thư được gửi tự động từ hệ thống Quản lý Khách hàng CRM.</em></p>");
                        mail.setStatus("SENT");
                        mail.setAttempts(1);
                        mail.setSentByUserId(1);
                        emailQueueDAO.enqueue(mail);
                    }
                }
            }
        } catch (Exception ex) {
            System.err.println("[NotificationService] Lỗi khi tạo email thông báo cho user #" + userId + ": " + ex.getMessage());
        }
    }

    // Các tiện ích gửi thông báo nhanh cho 5 sự kiện trọng yếu
    public void notifyLeadAssigned(long targetUserId, long leadId, String leadName) {
        String title = "Bạn được phân công Khách hàng tiềm năng mới";
        String content = "Lead: " + (leadName != null ? leadName : ("#" + leadId)) + " vừa được phân công cho bạn. Hãy liên hệ sớm để đảm bảo SLA.";
        String link = "customers?lead=1&id=" + leadId;
        sendAsync(targetUserId, "LEAD_ASSIGNED", title, content, link, "LEAD", leadId);
    }

    public void notifyQuotePendingApproval(long approverUserId, long quoteId, String quoteNumber, String totalAmountStr, String level) {
        String title = "Báo giá " + (quoteNumber != null ? quoteNumber : ("#" + quoteId)) + " đang chờ bạn duyệt";
        String content = "Báo giá có chiết khấu hoặc điều khoản cần cấp " + (level != null ? level : "Quản lý") + " phê duyệt (Tổng tiền: " + totalAmountStr + ").";
        String link = "quotations?id=" + quoteId;
        sendAsync(approverUserId, "QUOTE_APPROVAL_REQUEST", title, content, link, "QUOTE", quoteId);
    }

    public void notifyQuoteResponse(long ownerUserId, long quoteId, String quoteNumber, String decision, String comment) {
        boolean accepted = "ACCEPTED".equalsIgnoreCase(decision) || "ACCEPT".equalsIgnoreCase(decision);
        String title = accepted ? ("Khách hàng đã chấp thuận báo giá " + quoteNumber) : ("Khách hàng phản hồi từ chối báo giá " + quoteNumber);
        String content = (comment != null && !comment.isBlank()) ? ("Phản hồi từ khách: \"" + comment + "\"") : "Vui lòng xem chi tiết phản hồi trên hệ thống.";
        String link = "quotations?id=" + quoteId;
        sendAsync(ownerUserId, "QUOTE_RESPONSE", title, content, link, "QUOTE", quoteId);
    }

    public void notifyTaskAssigned(long targetUserId, long taskId, String subject, String dueDateStr) {
        String title = "Bạn được giao công việc mới: " + subject;
        String content = "Hạn hoàn thành: " + (dueDateStr != null ? dueDateStr : "Trong ngày") + ". Vui lòng kiểm tra và xử lý.";
        String link = "activities";
        sendAsync(targetUserId, "TASK_ASSIGNED", title, content, link, "TASK", taskId);
    }

    public void notifyOpportunityStagnant(long ownerUserId, long oppId, String oppName, String reason) {
        String title = "Cơ hội bị gắn cờ đình trệ: " + (oppName != null ? oppName : ("#" + oppId));
        String content = "Lý do: " + (reason != null ? reason : "Quá hạn không có hoạt động tương tác mới") + ". Hãy lên kế hoạch gọi điện hoặc gặp mặt lại khách hàng.";
        String link = "pipeline";
        sendAsync(ownerUserId, "OPPORTUNITY_STAGNANT", title, content, link, "OPPORTUNITY", oppId);
    }

    // Các hàm đồng bộ cho Controller / Servlet
    public List<NotificationDTO> getNotifications(long userId, int limit, Boolean unreadOnly) throws SQLException {
        return notificationDAO.findByUserId(userId, limit, unreadOnly);
    }

    public int getUnreadCount(long userId) throws SQLException {
        return notificationDAO.countUnread(userId);
    }

    public boolean markAsRead(long id, long userId) throws SQLException {
        return notificationDAO.markAsRead(id, userId);
    }

    public int markAllAsRead(long userId) throws SQLException {
        return notificationDAO.markAllAsRead(userId);
    }

    public boolean delete(long id, long userId) throws SQLException {
        return notificationDAO.delete(id, userId);
    }
}
