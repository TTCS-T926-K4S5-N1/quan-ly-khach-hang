package com.crm.dao.leads;

import com.crm.config.DatabaseConfig;
import com.crm.dto.leads.LeadConvertRequest;
import com.crm.dto.leads.LeadConvertResultDTO;
import com.crm.dto.routing.LeadSlaAlertDTO;

import java.math.BigDecimal;
import java.sql.*;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.*;

public class LeadConversionDAO {

    /**
     * Nhân viên kinh doanh nhận lead được phân
     */
    public boolean acceptLead(long leadId, long userId) throws SQLException {
        String updateCust = """
            UPDATE customers
            SET status = 'DANG_CHAM_SOC',
                assignment_status = 'ACCEPTED',
                accepted_at = NOW(),
                sla_breached = 0,
                updated_at = NOW()
            WHERE id = ? AND is_deleted = 0
        """;

        String insertAct = """
            INSERT INTO activities (
                customer_id, owner_user_id, type, subject, description, status, created_at, updated_at
            ) VALUES (?, ?, 'SYSTEM', 'Tiếp nhận Lead chăm sóc', 'Nhân viên kinh doanh đã tiếp nhận lead để bắt đầu liên hệ chăm sóc khách hàng.', 'COMPLETED', NOW(), NOW())
        """;

        String insertLog = """
            INSERT INTO lead_assignment_logs (
                lead_id, rule_id, assigned_to_user_id, assigned_by_user_id, method, rule_name, notes, created_at
            ) VALUES (?, NULL, ?, ?, 'ACCEPT_LEAD', 'Nhân viên nhận lead', 'Lead chuyển sang trạng thái Đang chăm sóc', NOW())
        """;

        try (Connection conn = DatabaseConfig.getConnection()) {
            conn.setAutoCommit(false);
            try {
                int affected;
                try (PreparedStatement ps = conn.prepareStatement(updateCust)) {
                    ps.setLong(1, leadId);
                    affected = ps.executeUpdate();
                }
                if (affected == 0) {
                    conn.rollback();
                    return false;
                }

                try (PreparedStatement ps = conn.prepareStatement(insertAct)) {
                    ps.setLong(1, leadId);
                    ps.setLong(2, userId);
                    ps.executeUpdate();
                }

                try (PreparedStatement ps = conn.prepareStatement(insertLog)) {
                    ps.setLong(1, leadId);
                    ps.setLong(2, userId);
                    ps.setLong(3, userId);
                    ps.executeUpdate();
                }

                conn.commit();
                return true;
            } catch (Exception e) {
                conn.rollback();
                throw e;
            } finally {
                conn.setAutoCommit(true);
            }
        }
    }

    /**
     * Nhân viên từ chối lead (bắt buộc nhập lý do, lead quay lại hàng chờ phân bổ)
     */
    public boolean rejectLead(long leadId, long userId, String reason) throws SQLException {
        if (reason == null || reason.trim().isBlank()) {
            throw new IllegalArgumentException("Lý do từ chối lead là bắt buộc.");
        }

        String updateCust = """
            UPDATE customers
            SET owner_user_id = NULL,
                assignment_status = 'UNASSIGNED',
                rejected_at = NOW(),
                rejected_by_user_id = ?,
                rejection_reason = ?,
                updated_at = NOW()
            WHERE id = ? AND is_deleted = 0
        """;

        String insertAct = """
            INSERT INTO activities (
                customer_id, owner_user_id, type, subject, description, status, created_at, updated_at
            ) VALUES (?, ?, 'SYSTEM', 'Từ chối nhận lead', ?, 'COMPLETED', NOW(), NOW())
        """;

        String insertLog = """
            INSERT INTO lead_assignment_logs (
                lead_id, rule_id, assigned_to_user_id, assigned_by_user_id, method, rule_name, notes, created_at
            ) VALUES (?, NULL, ?, ?, 'REJECT_LEAD', 'Từ chối lead', ?, NOW())
        """;

        try (Connection conn = DatabaseConfig.getConnection()) {
            conn.setAutoCommit(false);
            try {
                int affected;
                try (PreparedStatement ps = conn.prepareStatement(updateCust)) {
                    ps.setLong(1, userId);
                    ps.setString(2, reason.trim());
                    ps.setLong(3, leadId);
                    affected = ps.executeUpdate();
                }
                if (affected == 0) {
                    conn.rollback();
                    return false;
                }

                try (PreparedStatement ps = conn.prepareStatement(insertAct)) {
                    ps.setLong(1, leadId);
                    ps.setLong(2, userId);
                    ps.setString(3, "Nhân viên từ chối lead. Lý do: " + reason.trim());
                    ps.executeUpdate();
                }

                try (PreparedStatement ps = conn.prepareStatement(insertLog)) {
                    ps.setLong(1, leadId);
                    ps.setLong(2, userId);
                    ps.setLong(3, userId);
                    ps.setString(4, "Từ chối nhận lead. Lý do: " + reason.trim());
                    ps.executeUpdate();
                }

                conn.commit();
                return true;
            } catch (Exception e) {
                conn.rollback();
                throw e;
            } finally {
                conn.setAutoCommit(true);
            }
        }
    }

    /**
     * Lấy dữ liệu xem trước khi chuyển đổi Lead
     */
    public Map<String, Object> getConversionPreview(long leadId) throws SQLException {
        String sql = """
            SELECT 
                c.id, c.name, c.status, c.email, c.phone, c.website, c.address, c.tax_code,
                c.industry_id, c.company_size_id, c.region_id, c.lead_source, c.campaign_id,
                c.owner_user_id, c.lead_score, c.score_grade,
                u.full_name AS owner_name,
                camp.name AS campaign_name,
                ct.name AS contact_name, ct.title AS contact_title, ct.buying_role AS contact_buying_role
            FROM customers c
            LEFT JOIN users u ON u.id = c.owner_user_id
            LEFT JOIN campaigns camp ON camp.id = c.campaign_id
            LEFT JOIN contacts ct ON ct.customer_id = c.id AND ct.is_primary = 1 AND ct.is_deleted = 0
            WHERE c.id = ? AND c.is_deleted = 0
        """;

        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setLong(1, leadId);
            try (ResultSet rs = ps.executeQuery()) {
                if (!rs.next()) return null;

                Map<String, Object> map = new LinkedHashMap<>();
                map.put("leadId", rs.getLong("id"));
                map.put("leadName", rs.getString("name"));
                map.put("status", rs.getString("status"));
                map.put("isConverted", "CONVERTED".equalsIgnoreCase(rs.getString("status")));
                map.put("email", rs.getString("email"));
                map.put("phone", rs.getString("phone"));
                map.put("website", rs.getString("website"));
                map.put("address", rs.getString("address"));
                map.put("taxCode", rs.getString("tax_code"));
                map.put("industryId", rs.getObject("industry_id"));
                map.put("companySizeId", rs.getObject("company_size_id"));
                map.put("regionId", rs.getObject("region_id"));
                map.put("leadSource", rs.getString("lead_source"));
                map.put("campaignId", rs.getObject("campaign_id"));
                map.put("campaignName", rs.getString("campaign_name"));
                map.put("ownerUserId", rs.getObject("owner_user_id"));
                map.put("ownerName", rs.getString("owner_name"));
                map.put("leadScore", rs.getInt("lead_score"));
                map.put("scoreGrade", rs.getString("score_grade"));

                // Gợi ý contact & company
                String cName = rs.getString("contact_name") != null ? rs.getString("contact_name") : rs.getString("name");
                String cTitle = rs.getString("contact_title") != null ? rs.getString("contact_title") : "Người đại diện";
                map.put("suggestedCompanyName", rs.getString("name"));
                map.put("suggestedContactName", cName);
                map.put("leadContactName", cName);
                map.put("leadContactTitle", cTitle);
                map.put("leadPhone", rs.getString("phone"));
                map.put("leadEmail", rs.getString("email"));
                map.put("leadTaxCode", rs.getString("tax_code"));
                map.put("leadWebsite", rs.getString("website"));
                map.put("suggestedContactTitle", cTitle);
                map.put("suggestedBuyingRole", rs.getString("contact_buying_role") != null ? rs.getString("contact_buying_role") : "DECISION_MAKER");

                // Gợi ý tên cơ hội
                String oppName = (rs.getString("name") != null ? rs.getString("name") : "Khách hàng") 
                        + " - Cơ hội hợp tác " + LocalDate.now().format(DateTimeFormatter.ofPattern("MM/yyyy"));
                map.put("suggestedOpportunityName", oppName);
                map.put("suggestedCloseDate", LocalDate.now().plusDays(30).toString());

                // Đếm số hoạt động hiện có
                String countActSql = "SELECT COUNT(*) FROM activities WHERE customer_id = ? AND is_deleted = 0";
                try (PreparedStatement countPs = conn.prepareStatement(countActSql)) {
                    countPs.setLong(1, leadId);
                    try (ResultSet countRs = countPs.executeQuery()) {
                        map.put("activitiesCount", countRs.next() ? countRs.getInt(1) : 0);
                    }
                }

                return map;
            }
        }
    }

    /**
     * Chuyển đổi một lead đủ điều kiện thành Khách hàng, Người liên hệ và Cơ hội bán hàng
     * Trong một giao dịch cơ sở dữ liệu nguyên tử (Transaction)
     */
    public LeadConvertResultDTO convertLead(long leadId, long userId, LeadConvertRequest req) throws SQLException {
        Objects.requireNonNull(req, "Yêu cầu chuyển đổi không được null");

        try (Connection conn = DatabaseConfig.getConnection()) {
            conn.setAutoCommit(false);
            try {
                // 1. Kiểm tra Lead gốc
                String queryLead = """
                    SELECT c.id, c.name, c.status, c.email, c.phone, c.website, c.address, c.tax_code,
                           c.industry_id, c.company_size_id, c.region_id, c.lead_source, c.lead_source_id,
                           c.campaign_id, c.owner_user_id, c.lead_score, c.score_grade
                    FROM customers c
                    WHERE c.id = ? AND c.is_deleted = 0
                """;

                Map<String, Object> leadData = new LinkedHashMap<>();
                try (PreparedStatement ps = conn.prepareStatement(queryLead)) {
                    ps.setLong(1, leadId);
                    try (ResultSet rs = ps.executeQuery()) {
                        if (!rs.next()) {
                            throw new NoSuchElementException("Không tìm thấy Lead với ID: " + leadId);
                        }
                        String curStatus = rs.getString("status");
                        if ("CONVERTED".equalsIgnoreCase(curStatus)) {
                            throw new IllegalStateException("Lead này đã được chuyển đổi thành công trước đó. Không thể chuyển đổi lại.");
                        }

                        leadData.put("name", rs.getString("name"));
                        leadData.put("status", curStatus);
                        leadData.put("email", rs.getString("email"));
                        leadData.put("phone", rs.getString("phone"));
                        leadData.put("website", rs.getString("website"));
                        leadData.put("address", rs.getString("address"));
                        leadData.put("taxCode", rs.getString("tax_code"));
                        leadData.put("industryId", rs.getObject("industry_id"));
                        leadData.put("companySizeId", rs.getObject("company_size_id"));
                        leadData.put("regionId", rs.getObject("region_id"));
                        leadData.put("leadSource", rs.getString("lead_source"));
                        leadData.put("leadSourceId", rs.getObject("lead_source_id"));
                        leadData.put("campaignId", rs.getObject("campaign_id"));
                        leadData.put("ownerUserId", rs.getObject("owner_user_id"));
                        leadData.put("leadScore", rs.getInt("lead_score"));
                        leadData.put("scoreGrade", rs.getString("score_grade"));
                    }
                }

                // 2. Tạo hoặc Sử dụng Khách hàng Doanh nghiệp
                long customerId;
                String customerName;

                if (req.isCreateNewCustomer()) {
                    customerName = req.getCustomerName() != null && !req.getCustomerName().isBlank()
                            ? req.getCustomerName().trim()
                            : String.valueOf(leadData.get("name"));

                    String insertCustSql = """
                        INSERT INTO customers (
                            name, tax_code, status, email, phone, website, address,
                            industry_id, company_size_id, region_id, owner_user_id,
                            lead_source, lead_source_id, campaign_id, lead_score, score_grade,
                            is_deleted, created_at, updated_at
                        ) VALUES (?, ?, 'KHACH_HANG', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, NOW(), NOW())
                    """;

                    try (PreparedStatement ps = conn.prepareStatement(insertCustSql, Statement.RETURN_GENERATED_KEYS)) {
                        ps.setString(1, customerName);
                        ps.setString(2, req.getCustomerTaxCode() != null ? req.getCustomerTaxCode().trim() : (String) leadData.get("taxCode"));
                        ps.setString(3, req.getCustomerEmail() != null ? req.getCustomerEmail().trim() : (String) leadData.get("email"));
                        ps.setString(4, req.getCustomerPhone() != null ? req.getCustomerPhone().trim() : (String) leadData.get("phone"));
                        ps.setString(5, req.getCustomerWebsite() != null ? req.getCustomerWebsite().trim() : (String) leadData.get("website"));
                        ps.setString(6, req.getCustomerAddress() != null ? req.getCustomerAddress().trim() : (String) leadData.get("address"));
                        ps.setObject(7, req.getIndustryId() != null ? req.getIndustryId() : leadData.get("industryId"));
                        ps.setObject(8, req.getCompanySizeId() != null ? req.getCompanySizeId() : leadData.get("companySizeId"));
                        ps.setObject(9, req.getRegionId() != null ? req.getRegionId() : leadData.get("regionId"));
                        ps.setObject(10, leadData.get("ownerUserId") != null ? leadData.get("ownerUserId") : userId);
                        ps.setString(11, (String) leadData.get("leadSource"));
                        ps.setObject(12, leadData.get("leadSourceId"));
                        ps.setObject(13, leadData.get("campaignId"));
                        ps.setInt(14, (Integer) leadData.get("leadScore"));
                        ps.setString(15, (String) leadData.get("scoreGrade"));
                        ps.executeUpdate();

                        try (ResultSet rs = ps.getGeneratedKeys()) {
                            if (!rs.next()) throw new SQLException("Không thể tạo Khách hàng từ Lead.");
                            customerId = rs.getLong(1);
                        }
                    }
                } else {
                    if (req.getExistingCustomerId() == null || req.getExistingCustomerId() <= 0) {
                        throw new IllegalArgumentException("Vui lòng chọn khách hàng doanh nghiệp hiện có.");
                    }
                    customerId = req.getExistingCustomerId();

                    // Lấy tên khách hàng hiện có & cập nhật status thành KHACH_HANG nếu đang là tiềm năng
                    String queryExisting = "SELECT name FROM customers WHERE id = ? AND is_deleted = 0";
                    try (PreparedStatement ps = conn.prepareStatement(queryExisting)) {
                        ps.setLong(1, customerId);
                        try (ResultSet rs = ps.executeQuery()) {
                            if (!rs.next()) throw new NoSuchElementException("Khách hàng được chọn không tồn tại.");
                            customerName = rs.getString("name");
                        }
                    }
                    String updateCust = "UPDATE customers SET status = 'KHACH_HANG', updated_at = NOW() WHERE id = ?";
                    try (PreparedStatement ps = conn.prepareStatement(updateCust)) {
                        ps.setLong(1, customerId);
                        ps.executeUpdate();
                    }
                }

                // 3. Tạo Người liên hệ (Contact) gắn với Khách hàng
                long contactId;
                String contactName = req.getContactName() != null && !req.getContactName().isBlank()
                        ? req.getContactName().trim()
                        : String.valueOf(leadData.get("name"));

                String insertContactSql = """
                    INSERT INTO contacts (
                        customer_id, name, title, email, phone, buying_role, is_primary, owner_user_id, is_deleted, created_at, updated_at
                    ) VALUES (?, ?, ?, ?, ?, ?, 1, ?, 0, NOW(), NOW())
                """;

                try (PreparedStatement ps = conn.prepareStatement(insertContactSql, Statement.RETURN_GENERATED_KEYS)) {
                    ps.setLong(1, customerId);
                    ps.setString(2, contactName);
                    ps.setString(3, req.getContactTitle() != null ? req.getContactTitle().trim() : "Người đại diện");
                    ps.setString(4, req.getContactEmail() != null ? req.getContactEmail().trim() : (String) leadData.get("email"));
                    ps.setString(5, req.getContactPhone() != null ? req.getContactPhone().trim() : (String) leadData.get("phone"));
                    ps.setString(6, req.getContactBuyingRole() != null ? req.getContactBuyingRole() : "DECISION_MAKER");
                    ps.setObject(7, leadData.get("ownerUserId") != null ? leadData.get("ownerUserId") : userId);
                    ps.executeUpdate();

                    try (ResultSet rs = ps.getGeneratedKeys()) {
                        if (!rs.next()) throw new SQLException("Không thể tạo Người liên hệ từ Lead.");
                        contactId = rs.getLong(1);
                    }
                }

                // 4. Tạo Cơ hội bán hàng (Opportunity)
                Long opportunityId = null;
                String oppName = null;

                if (req.isCreateOpportunity()) {
                    oppName = req.getOpportunityName() != null && !req.getOpportunityName().isBlank()
                            ? req.getOpportunityName().trim()
                            : (customerName + " - Hợp đồng mới " + LocalDate.now().getYear());

                    BigDecimal amount = req.getOpportunityAmount() != null ? req.getOpportunityAmount() : BigDecimal.ZERO;
                    long stageId = req.getPipelineStageId() != null && req.getPipelineStageId() > 0 ? req.getPipelineStageId() : 1L;

                    String closeDateStr = req.getExpectedCloseDate();
                    LocalDate closeDate = (closeDateStr != null && !closeDateStr.isBlank())
                            ? LocalDate.parse(closeDateStr)
                            : LocalDate.now().plusDays(30);

                    String insertOppSql = """
                        INSERT INTO opportunities (
                            name, customer_id, contact_name, amount, stage_id, probability,
                            expected_close_date, status, owner_user_id, campaign_id, is_deleted, created_at, updated_at
                        ) VALUES (?, ?, ?, ?, ?, 10, ?, 'OPEN', ?, ?, 0, NOW(), NOW())
                    """;

                    try (PreparedStatement ps = conn.prepareStatement(insertOppSql, Statement.RETURN_GENERATED_KEYS)) {
                        ps.setString(1, oppName);
                        ps.setLong(2, customerId);
                        ps.setString(3, contactName);
                        ps.setBigDecimal(4, amount);
                        ps.setLong(5, stageId);
                        ps.setDate(6, java.sql.Date.valueOf(closeDate));
                        ps.setObject(7, leadData.get("ownerUserId") != null ? leadData.get("ownerUserId") : userId);
                        ps.setObject(8, leadData.get("campaignId"));
                        ps.executeUpdate();

                        try (ResultSet rs = ps.getGeneratedKeys()) {
                            if (!rs.next()) throw new SQLException("Không thể tạo Cơ hội từ Lead.");
                            opportunityId = rs.getLong(1);
                        }
                    }
                }

                // 5. Bảo tồn và chuyển giao toàn bộ hoạt động (Activities) sang khách hàng và cơ hội mới
                int preservedCount = 0;
                String updateActs = """
                    UPDATE activities
                    SET customer_id = ?,
                        opportunity_id = COALESCE(?, opportunity_id),
                        updated_at = NOW()
                    WHERE customer_id = ?
                """;

                try (PreparedStatement ps = conn.prepareStatement(updateActs)) {
                    ps.setLong(1, customerId);
                    ps.setObject(2, opportunityId);
                    ps.setLong(3, leadId);
                    preservedCount = ps.executeUpdate();
                }

                // Thêm hoạt động hệ thống ghi nhận chuyển đổi thành công
                String logDesc = "Lead #" + leadId + " (" + leadData.get("name") + ") đã được chuyển đổi thành Khách hàng #" 
                        + customerId + " (" + customerName + "), Người liên hệ #" + contactId + " (" + contactName + ")"
                        + (opportunityId != null ? (", Cơ hội #" + opportunityId + " (" + oppName + ")") : "") + ".";

                String insertConvertAct = """
                    INSERT INTO activities (
                        customer_id, opportunity_id, owner_user_id, type, subject, description, status, created_at, updated_at
                    ) VALUES (?, ?, ?, 'SYSTEM', 'Chuyển đổi thành công từ Lead', ?, 'COMPLETED', NOW(), NOW())
                """;
                try (PreparedStatement ps = conn.prepareStatement(insertConvertAct)) {
                    ps.setLong(1, customerId);
                    ps.setObject(2, opportunityId);
                    ps.setLong(3, userId);
                    ps.setString(4, logDesc);
                    ps.executeUpdate();
                }

                // 6. Cập nhật Lead gốc sang trạng thái ĐÃ CHUYỂN ĐỔI (CONVERTED) & Không thể sửa đổi nữa
                String updateLeadSql = """
                    UPDATE customers
                    SET status = 'CONVERTED',
                        converted_at = NOW(),
                        converted_by_user_id = ?,
                        converted_customer_id = ?,
                        converted_contact_id = ?,
                        converted_opportunity_id = ?,
                        updated_at = NOW()
                    WHERE id = ?
                """;

                try (PreparedStatement ps = conn.prepareStatement(updateLeadSql)) {
                    ps.setLong(1, userId);
                    ps.setLong(2, customerId);
                    ps.setLong(3, contactId);
                    ps.setObject(4, opportunityId);
                    ps.setLong(5, leadId);
                    ps.executeUpdate();
                }

                // 7. Ghi audit log
                String insertAssignLog = """
                    INSERT INTO lead_assignment_logs (
                        lead_id, rule_id, assigned_to_user_id, assigned_by_user_id, method, rule_name, notes, created_at
                    ) VALUES (?, NULL, ?, ?, 'CONVERT_LEAD', 'Chuyển đổi Lead', ?, NOW())
                """;
                try (PreparedStatement ps = conn.prepareStatement(insertAssignLog)) {
                    ps.setLong(1, leadId);
                    ps.setObject(2, leadData.get("ownerUserId"));
                    ps.setLong(3, userId);
                    ps.setString(4, logDesc);
                    ps.executeUpdate();
                }

                conn.commit();

                // Lấy tên nhân viên thực hiện
                String convertedBy = "Nhân viên kinh doanh";
                String queryUser = "SELECT full_name FROM users WHERE id = ?";
                try (PreparedStatement ps = conn.prepareStatement(queryUser)) {
                    ps.setLong(1, userId);
                    try (ResultSet rs = ps.executeQuery()) {
                        if (rs.next()) convertedBy = rs.getString("full_name");
                    }
                }

                LeadConvertResultDTO result = new LeadConvertResultDTO();
                result.setLeadId(leadId);
                result.setCustomerId(customerId);
                result.setCustomerName(customerName);
                result.setContactId(contactId);
                result.setContactName(contactName);
                result.setOpportunityId(opportunityId);
                result.setOpportunityName(oppName);
                result.setConvertedAt(LocalDate.now().toString());
                result.setConvertedByUserName(convertedBy);
                result.setActivitiesPreservedCount(preservedCount);

                return result;

            } catch (Exception e) {
                conn.rollback();
                throw e;
            } finally {
                conn.setAutoCommit(true);
            }
        }
    }

    /**
     * Quét và phát hiện các Lead vi phạm SLA phản hồi
     * Được gọi định kỳ bởi LeadRoutingDaemon
     */
    public int scanAndFlagSlaBreaches() throws SQLException {
        // Lấy cấu hình SLA phản hồi (mặc định 4 giờ)
        int slaHours = 4;
        String querySetting = "SELECT setting_value FROM lead_routing_settings WHERE setting_key = 'sla_response_hours'";
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(querySetting);
             ResultSet rs = ps.executeQuery()) {
            if (rs.next()) {
                try {
                    slaHours = Integer.parseInt(rs.getString("setting_value"));
                } catch (Exception ignored) {}
            }
        }

        // Tìm các lead vi phạm SLA:
        // Đã phân bổ (assigned_at IS NOT NULL), chưa nhận (accepted_at IS NULL), chưa có tương tác đầu tiên,
        // quá SLA (NOW() > sla_deadline HOẶC NOW() > DATE_ADD(assigned_at, INTERVAL ? HOUR))
        String queryBreaches = """
            SELECT c.id, c.name, c.phone, c.lead_score, c.owner_user_id, c.assigned_at,
                   COALESCE(c.sla_deadline, DATE_ADD(c.assigned_at, INTERVAL ? HOUR)) AS deadline,
                   u.full_name AS owner_name, u.team_id,
                   t.manager_id AS leader_id
            FROM customers c
            JOIN users u ON u.id = c.owner_user_id
            LEFT JOIN teams t ON t.id = u.team_id
            WHERE c.is_deleted = 0
              AND c.status = 'TIEM_NANG'
              AND c.assignment_status IN ('ASSIGNED', 'UNASSIGNED')
              AND c.accepted_at IS NULL
              AND c.first_contacted_at IS NULL
              AND c.sla_breached = 0
              AND c.assigned_at IS NOT NULL
              AND NOW() > COALESCE(c.sla_deadline, DATE_ADD(c.assigned_at, INTERVAL ? HOUR))
        """;

        String updateCust = """
            UPDATE customers
            SET sla_breached = 1,
                sla_breached_at = NOW(),
                updated_at = NOW()
            WHERE id = ?
        """;

        String insertAlert = """
            INSERT INTO lead_sla_alerts (
                lead_id, assigned_user_id, manager_user_id, alert_type, message, status, created_at
            ) VALUES (?, ?, ?, 'SLA_BREACH', ?, 'UNREAD', NOW())
        """;

        String insertAct = """
            INSERT INTO activities (
                customer_id, owner_user_id, type, subject, description, status, created_at, updated_at
            ) VALUES (?, ?, 'SYSTEM', '⚠️ Cảnh báo: Vi phạm SLA phản hồi Lead', ?, 'PENDING', NOW(), NOW())
        """;

        int count = 0;
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(queryBreaches)) {
            ps.setInt(1, slaHours);
            ps.setInt(2, slaHours);

            List<Map<String, Object>> breaches = new ArrayList<>();
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    Map<String, Object> b = new HashMap<>();
                    b.put("id", rs.getLong("id"));
                    b.put("name", rs.getString("name"));
                    b.put("ownerUserId", rs.getLong("owner_user_id"));
                    b.put("ownerName", rs.getString("owner_name"));
                    b.put("leaderId", rs.getObject("leader_id"));
                    breaches.add(b);
                }
            }

            for (Map<String, Object> b : breaches) {
                long leadId = (Long) b.get("id");
                long ownerId = (Long) b.get("ownerUserId");
                String ownerName = (String) b.get("ownerName");
                Long leaderId = (Long) b.get("leaderId");

                // Đánh dấu vi phạm
                try (PreparedStatement updatePs = conn.prepareStatement(updateCust)) {
                    updatePs.setLong(1, leadId);
                    updatePs.executeUpdate();
                }

                // Gửi cảnh báo Trưởng nhóm
                String alertMsg = "Lead \"" + b.get("name") + "\" (#" + leadId + ") do " + ownerName + " phụ trách đã quá hạn SLA " + slaHours + " giờ mà chưa được phản hồi hoặc chăm sóc!";
                try (PreparedStatement alertPs = conn.prepareStatement(insertAlert)) {
                    alertPs.setLong(1, leadId);
                    alertPs.setLong(2, ownerId);
                    alertPs.setObject(3, leaderId);
                    alertPs.setString(4, alertMsg);
                    alertPs.executeUpdate();
                }

                // Ghi nhận hoạt động cảnh báo
                try (PreparedStatement actPs = conn.prepareStatement(insertAct)) {
                    actPs.setLong(1, leadId);
                    actPs.setLong(2, ownerId);
                    actPs.setString(3, alertMsg);
                    actPs.executeUpdate();
                }

                count++;
            }
        }
        return count;
    }

    /**
     * Lấy danh sách cảnh báo SLA quá hạn cho Dashboard Trưởng nhóm / Giám đốc
     */
    public List<LeadSlaAlertDTO> getSlaAlerts(Long managerUserId, String statusFilter) throws SQLException {
        StringBuilder sql = new StringBuilder("""
            SELECT a.id, a.lead_id, a.assigned_user_id, a.manager_user_id, a.alert_type, a.message, a.status, a.created_at,
                   c.name AS lead_name, c.phone AS lead_phone, c.lead_score, c.sla_deadline,
                   u.full_name AS assigned_user_name,
                   TIMESTAMPDIFF(HOUR, c.sla_deadline, NOW()) AS hours_overdue
            FROM lead_sla_alerts a
            JOIN customers c ON c.id = a.lead_id
            JOIN users u ON u.id = a.assigned_user_id
            WHERE c.is_deleted = 0
        """);

        List<Object> params = new ArrayList<>();
        if (managerUserId != null && managerUserId > 0) {
            sql.append(" AND (a.manager_user_id = ? OR a.manager_user_id IS NULL)");
            params.add(managerUserId);
        }
        if (statusFilter != null && !statusFilter.isBlank()) {
            sql.append(" AND a.status = ?");
            params.add(statusFilter);
        }

        sql.append(" ORDER BY a.id DESC LIMIT 100");

        List<LeadSlaAlertDTO> list = new ArrayList<>();
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql.toString())) {
            for (int i = 0; i < params.size(); i++) {
                ps.setObject(i + 1, params.get(i));
            }
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    LeadSlaAlertDTO dto = new LeadSlaAlertDTO();
                    dto.setId(rs.getLong("id"));
                    dto.setLeadId(rs.getLong("lead_id"));
                    dto.setLeadName(rs.getString("lead_name"));
                    dto.setLeadPhone(rs.getString("lead_phone"));
                    dto.setLeadScore(rs.getInt("lead_score"));
                    dto.setAssignedUserId(rs.getLong("assigned_user_id"));
                    dto.setAssignedUserName(rs.getString("assigned_user_name"));
                    dto.setManagerUserId((Long) rs.getObject("manager_user_id"));
                    dto.setAlertType(rs.getString("alert_type"));
                    dto.setMessage(rs.getString("message"));
                    dto.setStatus(rs.getString("status"));
                    dto.setCreatedAt(rs.getString("created_at"));
                    dto.setSlaDeadline(rs.getString("sla_deadline"));
                    dto.setHoursOverdue(Math.max(1, rs.getDouble("hours_overdue")));
                    list.add(dto);
                }
            }
        }
        return list;
    }

    /**
     * Trưởng nhóm thu hồi lead quá hạn SLA và phân bổ cho nhân viên khác
     */
    public boolean reassignSlaBreachedLead(long leadId, long newOwnerId, long managerId, String notes) throws SQLException {
        String updateCust = """
            UPDATE customers
            SET owner_user_id = ?,
                assignment_status = 'ASSIGNED',
                assigned_at = NOW(),
                sla_deadline = DATE_ADD(NOW(), INTERVAL 4 HOUR),
                sla_breached = 0,
                sla_breached_at = NULL,
                accepted_at = NULL,
                updated_at = NOW()
            WHERE id = ? AND is_deleted = 0
        """;

        String resolveAlert = """
            UPDATE lead_sla_alerts
            SET status = 'RESOLVED',
                resolved_at = NOW()
            WHERE lead_id = ? AND status = 'UNREAD'
        """;

        String insertLog = """
            INSERT INTO lead_assignment_logs (
                lead_id, rule_id, assigned_to_user_id, assigned_by_user_id, method, rule_name, notes, created_at
            ) VALUES (?, NULL, ?, ?, 'REASSIGN_SLA', 'Thu hồi vi phạm SLA', ?, NOW())
        """;

        try (Connection conn = DatabaseConfig.getConnection()) {
            conn.setAutoCommit(false);
            try {
                try (PreparedStatement ps = conn.prepareStatement(updateCust)) {
                    ps.setLong(1, newOwnerId);
                    ps.setLong(2, leadId);
                    ps.executeUpdate();
                }

                try (PreparedStatement ps = conn.prepareStatement(resolveAlert)) {
                    ps.setLong(1, leadId);
                    ps.executeUpdate();
                }

                try (PreparedStatement ps = conn.prepareStatement(insertLog)) {
                    ps.setLong(1, leadId);
                    ps.setLong(2, newOwnerId);
                    ps.setLong(3, managerId);
                    ps.setString(4, notes != null ? notes : "Trưởng nhóm thu hồi lead vi phạm SLA và phân bổ lại");
                    ps.executeUpdate();
                }

                conn.commit();
                return true;
            } catch (Exception e) {
                conn.rollback();
                throw e;
            } finally {
                conn.setAutoCommit(true);
            }
        }
    }
}
