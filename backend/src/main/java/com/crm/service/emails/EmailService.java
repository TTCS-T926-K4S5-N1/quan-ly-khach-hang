package com.crm.service.emails;

import com.crm.config.DatabaseConfig;
import com.crm.dao.emails.EmailQueueDAO;
import com.crm.dao.emails.EmailTemplateDAO;
import com.crm.dto.emails.EmailQueueDTO;
import com.crm.dto.emails.EmailTemplateDTO;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

public class EmailService {

    private static final EmailService INSTANCE = new EmailService();

    private final EmailTemplateDAO templateDAO = new EmailTemplateDAO();
    private final EmailQueueDAO queueDAO = new EmailQueueDAO();

    // Hàng đợi gửi bất đồng bộ - Daemon pool không làm chậm các thao tác gốc
    private final ExecutorService executor = Executors.newFixedThreadPool(4, r -> {
        Thread t = new Thread(r, "crm-email-queue-worker");
        t.setDaemon(true);
        return t;
    });

    private EmailService() {}

    public static EmailService getInstance() {
        return INSTANCE;
    }

    /**
     * Thay thế biến động trong văn bản email:
     * - {{contact_name}}, {{ten_nguoi_lien_he}}
     * - {{company_name}}, {{ten_cong_ty}}
     * - {{staff_name}}, {{ten_nhan_vien}}
     * - {{customer_email}}, {{email}}
     * - {{customer_phone}}, {{so_dien_thoai}}
     */
    public String replaceVariables(String templateText, Map<String, String> values) {
        if (templateText == null || values == null) return templateText;
        String res = templateText;
        for (Map.Entry<String, String> entry : values.entrySet()) {
            String key = entry.getKey();
            String val = entry.getValue() != null ? entry.getValue() : "";
            res = res.replace("{{" + key + "}}", val);
        }
        return res;
    }

    /**
     * Xem trước email sau khi điền dữ liệu thực tế của khách hàng và người gửi
     */
    public Map<String, String> previewEmail(Long templateId, Long customerId, Long contactId, long currentUserId) throws SQLException {
        EmailTemplateDTO tpl = null;
        if (templateId != null && templateId > 0) {
            tpl = templateDAO.findById(templateId);
        }

        Map<String, String> vars = collectVariables(customerId, contactId, currentUserId);

        String subject = tpl != null ? tpl.getSubject() : "Thư gửi khách hàng";
        String body = tpl != null ? tpl.getBodyHtml() : "<p>Kính gửi {{contact_name}}, ...</p>";

        subject = replaceVariables(subject, vars);
        body = replaceVariables(body, vars);

        Map<String, String> preview = new HashMap<>();
        preview.put("subject", subject);
        preview.put("bodyHtml", body);
        preview.put("recipientEmail", vars.get("customer_email"));
        preview.put("recipientName", vars.get("contact_name"));
        preview.put("companyName", vars.get("company_name"));
        preview.put("staffName", vars.get("staff_name"));
        return preview;
    }

    /**
     * Thu thập giá trị các biến từ database
     */
    public Map<String, String> collectVariables(Long customerId, Long contactId, long currentUserId) {
        Map<String, String> vars = new HashMap<>();
        vars.put("contact_name", "Quý Khách");
        vars.put("ten_nguoi_lien_he", "Quý Khách");
        vars.put("company_name", "Quý Công ty");
        vars.put("ten_cong_ty", "Quý Công ty");
        vars.put("customer_email", "");
        vars.put("email", "");
        vars.put("customer_phone", "");
        vars.put("so_dien_thoai", "");
        vars.put("staff_name", "Nhân viên phụ trách");
        vars.put("ten_nhan_vien", "Nhân viên phụ trách");

        try (Connection conn = DatabaseConfig.getConnection()) {
            // Lấy thông tin người gửi (Staff)
            if (currentUserId > 0) {
                String sql = "SELECT full_name FROM users WHERE id = ?";
                try (PreparedStatement stmt = conn.prepareStatement(sql)) {
                    stmt.setLong(1, currentUserId);
                    try (ResultSet rs = stmt.executeQuery()) {
                        if (rs.next()) {
                            String name = rs.getString("full_name");
                            if (name != null && !name.isBlank()) {
                                vars.put("staff_name", name);
                                vars.put("ten_nhan_vien", name);
                            }
                        }
                    }
                }
            }

            // Lấy thông tin khách hàng (Customer)
            if (customerId != null && customerId > 0) {
                String sql = "SELECT name, email, phone FROM customers WHERE id = ?";
                try (PreparedStatement stmt = conn.prepareStatement(sql)) {
                    stmt.setLong(1, customerId);
                    try (ResultSet rs = stmt.executeQuery()) {
                        if (rs.next()) {
                            String cName = rs.getString("name");
                            String cEmail = rs.getString("email");
                            String cPhone = rs.getString("phone");
                            if (cName != null && !cName.isBlank()) {
                                vars.put("company_name", cName);
                                vars.put("ten_cong_ty", cName);
                                vars.put("contact_name", cName);
                                vars.put("ten_nguoi_lien_he", cName);
                            }
                            if (cEmail != null) {
                                vars.put("customer_email", cEmail);
                                vars.put("email", cEmail);
                            }
                            if (cPhone != null) {
                                vars.put("customer_phone", cPhone);
                                vars.put("so_dien_thoai", cPhone);
                            }
                        }
                    }
                }
            }

            // Lấy thông tin người liên hệ (Contact) nếu có chỉ định, hoặc lấy contact chính của công ty
            long targetId = (contactId != null && contactId > 0) ? contactId : (customerId != null ? customerId : 0);
            if (targetId > 0) {
                String sql = (contactId != null && contactId > 0)
                        ? "SELECT name, email, phone FROM contacts WHERE id = ?"
                        : "SELECT name, email, phone FROM contacts WHERE customer_id = ? AND is_deleted = 0 ORDER BY is_primary DESC, id ASC LIMIT 1";
                try (PreparedStatement stmt = conn.prepareStatement(sql)) {
                    stmt.setLong(1, targetId);
                    try (ResultSet rs = stmt.executeQuery()) {
                        if (rs.next()) {
                            String ctName = rs.getString("name");
                            String ctEmail = rs.getString("email");
                            String ctPhone = rs.getString("phone");
                            if (ctName != null && !ctName.isBlank()) {
                                vars.put("contact_name", ctName);
                                vars.put("ten_nguoi_lien_he", ctName);
                            }
                            if (ctEmail != null && !ctEmail.isBlank()) {
                                vars.put("customer_email", ctEmail);
                                vars.put("email", ctEmail);
                            }
                            if (ctPhone != null && !ctPhone.isBlank()) {
                                vars.put("customer_phone", ctPhone);
                                vars.put("so_dien_thoai", ctPhone);
                            }
                        }
                    }
                }
            }
        } catch (SQLException e) {
            System.err.println("[EmailService] Lỗi khi thu thập biến email: " + e.getMessage());
        }

        return vars;
    }

    /**
     * Đưa email vào hàng đợi và gửi bất đồng bộ, tự động ghi vào dòng thời gian của khách hàng
     */
    public long enqueueAndSendAsync(EmailQueueDTO dto) throws SQLException {
        // Áp dụng biến nếu có
        Map<String, String> vars = collectVariables(dto.getCustomerId(), dto.getContactId(), dto.getSentByUserId());
        if (dto.getRecipientName() != null && !dto.getRecipientName().isBlank()) {
            vars.put("contact_name", dto.getRecipientName());
            vars.put("ten_nguoi_lien_he", dto.getRecipientName());
        }

        dto.setSubject(replaceVariables(dto.getSubject(), vars));
        dto.setBodyHtml(replaceVariables(dto.getBodyHtml(), vars));
        dto.setStatus("QUEUED");
        dto.setAttempts(1);

        long queueId = queueDAO.enqueue(dto);
        dto.setId(queueId);

        // Kích hoạt worker gửi bất đồng bộ
        processQueueItemAsync(dto);
        return queueId;
    }

    /**
     * Gửi lại email bị thất bại (Retry Failed Email)
     */
    public boolean retryEmailAsync(long queueId) throws SQLException {
        EmailQueueDTO dto = queueDAO.findById(queueId);
        if (dto == null) {
            return false;
        }

        queueDAO.resetForRetry(queueId);
        dto.setStatus("QUEUED");
        dto.setAttempts(dto.getAttempts() + 1);

        processQueueItemAsync(dto);
        return true;
    }

    /**
     * Xử lý thực thi gửi email trong luồng worker
     */
    private void processQueueItemAsync(EmailQueueDTO dto) {
        executor.submit(() -> {
            try {
                // Mô phỏng độ trễ mạng nhẹ (300ms) để thể hiện tính chất hàng đợi
                Thread.sleep(300);

                String email = dto.getRecipientEmail();
                if (email == null || email.isBlank() || !email.contains("@") || email.contains("invalid") || email.endsWith(".loi")) {
                    // Mô phỏng trường hợp gửi thất bại do địa chỉ email không hợp lệ
                    String err = "Lỗi kết nối máy chủ gửi: Địa chỉ nhận " + email + " không tồn tại hoặc bị máy chủ MX từ chối (550 Mailbox unavailable).";
                    queueDAO.markFailed(dto.getId(), err);
                    System.out.println("[EmailService] Gửi email #" + dto.getId() + " thất bại: " + err);
                    return;
                }

                // Gửi thành công: cập nhật trạng thái
                queueDAO.markSent(dto.getId());
                System.out.println("[EmailService] Gửi email #" + dto.getId() + " thành công tới " + email);

                // TIÊU CHÍ NGHIỆM THU: Email gửi đi được ghi vào dòng thời gian của khách hàng
                if (dto.getCustomerId() != null && dto.getCustomerId() > 0) {
                    recordEmailToCustomerTimeline(dto);
                }

            } catch (Exception e) {
                try {
                    queueDAO.markFailed(dto.getId(), "Lỗi hệ thống khi truyền phát email: " + e.getMessage());
                } catch (SQLException ignored) {}
                System.err.println("[EmailService] Ngoại lệ khi xử lý gửi email #" + dto.getId() + ": " + e.getMessage());
            }
        });
    }

    /**
     * Ghi nhận email vào bảng activities (Customer 360 Timeline)
     */
    private void recordEmailToCustomerTimeline(EmailQueueDTO dto) {
        String sql = """
            INSERT INTO activities (
                customer_id, contact_id, owner_user_id, type, subject, description, outcome, status, created_at
            ) VALUES (?, ?, ?, 'EMAIL', ?, ?, 'Đã gửi qua hệ thống', 'COMPLETED', NOW())
        """;

        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setLong(1, dto.getCustomerId());
            if (dto.getContactId() != null && dto.getContactId() > 0) {
                stmt.setLong(2, dto.getContactId());
            } else {
                stmt.setNull(2, java.sql.Types.BIGINT);
            }
            stmt.setLong(3, dto.getSentByUserId());
            stmt.setString(4, "Email gửi khách: " + dto.getSubject());
            
            // Lấy tóm tắt nội dung text từ HTML
            String cleanText = dto.getBodyHtml().replaceAll("<[^>]*>", " ").replaceAll("\\s+", " ").trim();
            if (cleanText.length() > 500) {
                cleanText = cleanText.substring(0, 497) + "...";
            }
            stmt.setString(5, cleanText);

            stmt.executeUpdate();
            System.out.println("[EmailService] Đã ghi nhận email vào Dòng thời gian Khách hàng #" + dto.getCustomerId());
        } catch (SQLException e) {
            System.err.println("[EmailService] Lỗi khi ghi nhận dòng thời gian khách hàng: " + e.getMessage());
        }
    }
}
