package com.crm.service.leads;

import com.crm.config.DatabaseConfig;
import com.crm.dao.activities.ActivityDAO;
import com.crm.dao.contacts.ContactDAO;
import com.crm.dao.leads.WebLeadFormDAO;
import com.crm.dto.contacts.ContactWriteRequest;
import com.crm.dto.leads.LeadFormWriteRequest;
import com.crm.dto.leads.PublicLeadSubmissionRequest;

import java.sql.*;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.regex.Pattern;

public class WebLeadFormService {

    private static final Pattern EMAIL_PATTERN = Pattern.compile("^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$");
    private static final Pattern PHONE_PATTERN = Pattern.compile("^[0-9+()\\s.\\-]{8,20}$");

    private static final int RATE_LIMIT_MAX_REQUESTS = 5;
    private static final long RATE_LIMIT_WINDOW_MS = 5 * 60 * 1000L; // 5 minutes

    // In-memory sliding window rate limiter
    private static final ConcurrentHashMap<String, Deque<Long>> IP_REQUEST_CACHE = new ConcurrentHashMap<>();

    private final WebLeadFormDAO webLeadFormDAO = new WebLeadFormDAO();
    private final ContactDAO contactDAO = new ContactDAO();
    private final ActivityDAO activityDAO = new ActivityDAO();

    public List<Map<String, Object>> getAllForms(Boolean activeOnly) throws SQLException {
        return webLeadFormDAO.listAll(activeOnly);
    }

    public Map<String, Object> getFormById(long id) throws SQLException {
        return webLeadFormDAO.findById(id);
    }

    public Map<String, Object> getFormByKey(String formKey) throws SQLException {
        return webLeadFormDAO.findByKey(formKey);
    }

    public long createForm(LeadFormWriteRequest req, Long createdBy) throws SQLException {
        if (req.getName() == null || req.getName().trim().isEmpty()) {
            throw new IllegalArgumentException("Tên biểu mẫu không được để trống.");
        }
        return webLeadFormDAO.create(req, createdBy);
    }

    public boolean updateForm(long id, LeadFormWriteRequest req) throws SQLException {
        if (req.getName() == null || req.getName().trim().isEmpty()) {
            throw new IllegalArgumentException("Tên biểu mẫu không được để trống.");
        }
        return webLeadFormDAO.update(id, req);
    }

    public boolean deleteForm(long id) throws SQLException {
        return webLeadFormDAO.delete(id);
    }

    public List<Map<String, Object>> getSubmissions(Long formId, int limit) throws SQLException {
        return webLeadFormDAO.listSubmissions(formId, limit);
    }

    /**
     * Xử lý gửi biểu mẫu từ website bên ngoài (Public API)
     * Kèm theo kiểm tra chống spam và giới hạn tần suất theo IP.
     */
    public Map<String, Object> processPublicSubmission(
            PublicLeadSubmissionRequest req,
            String clientIp,
            String userAgent
    ) throws SQLException {
        if (req.getFormKey() == null || req.getFormKey().trim().isEmpty()) {
            throw new IllegalArgumentException("Mã biểu mẫu (formKey) không hợp lệ.");
        }

        Map<String, Object> form = webLeadFormDAO.findByKey(req.getFormKey().trim());
        if (form == null || !Boolean.TRUE.equals(form.get("isActive"))) {
            throw new IllegalArgumentException("Biểu mẫu không tồn tại hoặc đã ngừng hoạt động.");
        }

        long formId = (Long) form.get("id");
        String formName = (String) form.get("name");
        String leadSourceName = (String) form.get("leadSourceName");
        Long leadSourceId = (Long) form.get("leadSourceId");
        Long defaultOwnerId = (Long) form.get("defaultOwnerId");
        if (defaultOwnerId == null || defaultOwnerId <= 0) {
            defaultOwnerId = 1L; // Gán cho Admin mặc định
        }

        // 1. Kiểm tra giới hạn tần suất (Rate Limiting) theo IP
        checkRateLimit(clientIp);

        // 2. Kiểm tra chống Spam (Honeypot trap)
        if (req.get_hp_website() != null && !req.get_hp_website().trim().isEmpty()) {
            webLeadFormDAO.recordSubmission(
                    formId, null, null, req.getFullName(), req.getEmail(),
                    req.getPhone(), req.getCompany(), req.getInterest(),
                    clientIp, userAgent, true, "Bẫy honeypot kích hoạt (Bot tự điền trường ẩn)", "REJECTED_SPAM"
            );
            throw new IllegalArgumentException("Yêu cầu bị từ chối do nghi vấn gửi tin tự động (Spam detected).");
        }

        // 3. Kiểm tra thời gian điền form (Bot điền form siêu tốc dưới 1.2 giây)
        if (req.getLoadTimestamp() != null && req.getLoadTimestamp() > 0) {
            long duration = System.currentTimeMillis() - req.getLoadTimestamp();
            if (duration < 1200) {
                webLeadFormDAO.recordSubmission(
                        formId, null, null, req.getFullName(), req.getEmail(),
                        req.getPhone(), req.getCompany(), req.getInterest(),
                        clientIp, userAgent, true, "Tốc độ gửi form bất thường (< 1.2s)", "REJECTED_SPAM"
                );
                throw new IllegalArgumentException("Gửi dữ liệu quá nhanh. Vui lòng thử lại.");
            }
        }

        // 4. Validate thông tin đầu vào
        String fullName = req.getFullName() != null ? req.getFullName().trim() : "";
        String email = req.getEmail() != null ? req.getEmail().trim() : "";
        String phone = req.getPhone() != null ? req.getPhone().trim() : "";
        String company = req.getCompany() != null ? req.getCompany().trim() : "";
        String interest = req.getInterest() != null ? req.getInterest().trim() : "";

        if (fullName.isEmpty()) {
            throw new IllegalArgumentException("Họ và tên là bắt buộc.");
        }
        if (email.isEmpty() || !EMAIL_PATTERN.matcher(email).matches()) {
            throw new IllegalArgumentException("Email không đúng định dạng.");
        }
        if (phone.isEmpty() || !PHONE_PATTERN.matcher(phone).matches()) {
            throw new IllegalArgumentException("Số điện thoại không hợp lệ (cần ít nhất 8 chữ số).");
        }

        // 5. Tạo Lead ở trạng thái 'MOI' và gắn đúng nguồn của biểu mẫu
        long customerId = createLeadCustomer(
                fullName, company, email, phone, leadSourceName, leadSourceId, defaultOwnerId
        );

        // 6. Tạo người liên hệ chính (Contact)
        Long contactId = null;
        try {
            ContactWriteRequest contactReq = new ContactWriteRequest();
            contactReq.setCustomerId(customerId);
            contactReq.setName(fullName);
            contactReq.setEmail(email);
            contactReq.setPhone(phone);
            contactReq.setTitle("Người liên hệ từ biểu mẫu Web");
            contactReq.setBuyingRole("NGUOI_DUNG");
            contactReq.setIsPrimary(true);
            contactReq.setNotes("Nhu cầu từ biểu mẫu web: " + interest);
            contactId = contactDAO.create(contactReq, defaultOwnerId);
        } catch (Exception e) {
            // Không làm gián đoạn luồng chính nếu lỗi tạo contact phụ
        }

        // 7. Tạo nhật ký hoạt động (Activity)
        try {
            String actDesc = String.format("""
                    [Lead thu thập từ Biểu mẫu Web]
                    - Biểu mẫu: %s (Mã: %s)
                    - Họ và tên: %s
                    - Email: %s
                    - Số điện thoại: %s
                    - Công ty: %s
                    - Nhu cầu quan tâm: %s
                    - IP: %s
                    - Nguồn: %s
                    """,
                    formName, req.getFormKey(), fullName, email, phone,
                    company.isEmpty() ? "(Cá nhân)" : company,
                    interest.isEmpty() ? "(Chưa có ghi chú)" : interest,
                    clientIp, leadSourceName);

            activityDAO.create(
                    "Lead mới từ Website: " + fullName,
                    "NOTE",
                    actDesc,
                    "COMPLETED",
                    new Timestamp(System.currentTimeMillis()),
                    customerId,
                    null,
                    defaultOwnerId
            );
        } catch (Exception e) {
            // Không làm gián đoạn
        }

        // 8. Ghi lại lịch sử gửi (Submission Log) và tăng đếm
        webLeadFormDAO.recordSubmission(
                formId, customerId, contactId, fullName, email,
                phone, company, interest, clientIp, userAgent,
                false, null, "SUCCESS"
        );
        webLeadFormDAO.incrementSubmissionsCount(formId);

        // 9. Phản hồi thành công
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("success", true);
        result.put("message", form.get("successMessage"));
        result.put("redirectUrl", form.get("redirectUrl"));
        result.put("leadId", customerId);
        return result;
    }

    private long createLeadCustomer(
            String fullName,
            String company,
            String email,
            String phone,
            String leadSourceName,
            Long leadSourceId,
            long defaultOwnerId
    ) throws SQLException {
        String leadName = !company.isEmpty() ? company : fullName;

        String sql = """
                INSERT INTO customers (
                    name, status, email, phone, lead_source, lead_source_id,
                    owner_user_id, is_deleted
                ) VALUES (?, 'MOI', ?, ?, ?, ?, ?, 0)
                """;

        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS)) {
            stmt.setString(1, leadName);
            stmt.setString(2, email);
            stmt.setString(3, phone);
            stmt.setString(4, leadSourceName);
            stmt.setObject(5, leadSourceId, Types.BIGINT);
            stmt.setLong(6, defaultOwnerId);

            stmt.executeUpdate();
            try (ResultSet rs = stmt.getGeneratedKeys()) {
                if (rs.next()) {
                    return rs.getLong(1);
                }
            }
        }
        throw new SQLException("Không thể tạo bản ghi Lead khách hàng.");
    }

    private void checkRateLimit(String clientIp) throws SQLException {
        if (clientIp == null || clientIp.isBlank() || "unknown".equalsIgnoreCase(clientIp)) {
            return;
        }

        long now = System.currentTimeMillis();

        // Layer 1: In-memory sliding window
        Deque<Long> timestamps = IP_REQUEST_CACHE.computeIfAbsent(clientIp, k -> new ArrayDeque<>());
        synchronized (timestamps) {
            while (!timestamps.isEmpty() && (now - timestamps.peekFirst() > RATE_LIMIT_WINDOW_MS)) {
                timestamps.pollFirst();
            }
            if (timestamps.size() >= RATE_LIMIT_MAX_REQUESTS) {
                throw new IllegalStateException("Bạn đã gửi quá nhiều yêu cầu từ địa chỉ IP này. Vui lòng thử lại sau 5 phút.");
            }
            timestamps.addLast(now);
        }

        // Layer 2: Kiểm tra lịch sử DB gần đây
        int recentCount = webLeadFormDAO.countRecentSubmissionsByIp(clientIp, 5);
        if (recentCount >= RATE_LIMIT_MAX_REQUESTS) {
            throw new IllegalStateException("Giới hạn tần suất: Địa chỉ IP này đã gửi " + recentCount + " lần trong 5 phút qua. Vui lòng chờ.");
        }
    }
}
