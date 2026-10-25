package com.crm.service.leads;

import com.crm.dao.leads.LeadConversionDAO;
import com.crm.dto.leads.LeadConvertRequest;
import com.crm.dto.leads.LeadConvertResultDTO;
import com.crm.dto.routing.LeadSlaAlertDTO;

import java.sql.SQLException;
import java.util.List;
import java.util.Map;

public class LeadConversionService {

    private final LeadConversionDAO conversionDAO = new LeadConversionDAO();

    public boolean acceptLead(long leadId, long userId) throws SQLException {
        if (leadId <= 0) throw new IllegalArgumentException("ID Lead không hợp lệ");
        return conversionDAO.acceptLead(leadId, userId);
    }

    public boolean rejectLead(long leadId, long userId, String reason) throws SQLException {
        if (leadId <= 0) throw new IllegalArgumentException("ID Lead không hợp lệ");
        if (reason == null || reason.trim().isBlank()) {
            throw new IllegalArgumentException("Lý do từ chối lead là bắt buộc.");
        }
        return conversionDAO.rejectLead(leadId, userId, reason);
    }

    public Map<String, Object> getConversionPreview(long leadId) throws SQLException {
        if (leadId <= 0) throw new IllegalArgumentException("ID Lead không hợp lệ");
        return conversionDAO.getConversionPreview(leadId);
    }

    public LeadConvertResultDTO convertLead(long leadId, long userId, LeadConvertRequest req) throws SQLException {
        if (leadId <= 0) throw new IllegalArgumentException("ID Lead không hợp lệ");
        if (req == null) throw new IllegalArgumentException("Dữ liệu chuyển đổi lead không được để trống");

        if (req.isCreateNewCustomer()) {
            if (req.getCustomerName() == null || req.getCustomerName().trim().isBlank()) {
                throw new IllegalArgumentException("Tên khách hàng doanh nghiệp không được để trống khi tạo mới.");
            }
        } else {
            if (req.getExistingCustomerId() == null || req.getExistingCustomerId() <= 0) {
                throw new IllegalArgumentException("Vui lòng chọn khách hàng doanh nghiệp hiện có để gộp.");
            }
        }

        if (req.getContactName() == null || req.getContactName().trim().isBlank()) {
            throw new IllegalArgumentException("Họ và tên người liên hệ không được để trống.");
        }

        if (req.isCreateOpportunity()) {
            if (req.getOpportunityName() == null || req.getOpportunityName().trim().isBlank()) {
                throw new IllegalArgumentException("Tên cơ hội bán hàng không được để trống.");
            }
        }

        return conversionDAO.convertLead(leadId, userId, req);
    }

    public int scanAndFlagSlaBreaches() throws SQLException {
        return conversionDAO.scanAndFlagSlaBreaches();
    }

    public List<LeadSlaAlertDTO> getSlaAlerts(Long managerUserId, String statusFilter) throws SQLException {
        return conversionDAO.getSlaAlerts(managerUserId, statusFilter);
    }

    public boolean reassignSlaBreachedLead(long leadId, long newOwnerId, long managerId, String notes) throws SQLException {
        if (leadId <= 0) throw new IllegalArgumentException("ID Lead không hợp lệ");
        if (newOwnerId <= 0) throw new IllegalArgumentException("Chưa chọn nhân viên nhận phân bổ lại");
        return conversionDAO.reassignSlaBreachedLead(leadId, newOwnerId, managerId, notes);
    }
}
