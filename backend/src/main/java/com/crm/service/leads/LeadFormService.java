package com.crm.service.leads;

import com.crm.dao.leads.LeadFormDAO;
import com.crm.dto.leads.LeadForm;
import com.crm.dto.leads.LeadSubmission;

import java.sql.SQLException;
import java.util.List;
import java.util.Map;
import java.util.NoSuchElementException;

public class LeadFormService {

    private final LeadFormDAO dao;
    private final SubmissionToken tokens;

    public LeadFormService() {
        this(new LeadFormDAO(), SubmissionToken.create());
    }

    public LeadFormService(
            LeadFormDAO dao,
            SubmissionToken tokens
    ) {
        this.dao = dao;
        this.tokens = tokens;
    }

    public LeadForm findActive(String id) throws SQLException {
        if (id == null || !id.matches(
                "[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-"
                        + "[0-9a-f]{4}-[0-9a-f]{12}"
        )) {
            throw new NoSuchElementException(
                    "Không tìm thấy biểu mẫu."
            );
        }

        LeadForm form = dao.findActive(id);

        if (form == null) {
            throw new NoSuchElementException(
                    "Biểu mẫu không tồn tại hoặc đã ngừng nhận lead."
            );
        }

        return form;
    }

    public SubmissionToken.Challenge challenge(String formId) {
        return tokens.issue(formId);
    }

    public void submit(
            String formId,
            LeadSubmission lead,
            String token,
            String answer,
            String honeypot
    ) throws SQLException {

        findActive(formId);

        String submissionHash = tokens.verify(
                token,
                formId,
                answer,
                honeypot
        );

        LeadSubmission validLead = LeadValidation.validate(lead);

        dao.insertLead(formId, validLead, submissionHash);
    }

    public LeadForm create(
            String name,
            String source,
            long ownerUserId
    ) throws SQLException {

        String validName = LeadValidation.text(
                name,
                "Tên biểu mẫu",
                150
        );

        String validSource = LeadValidation.text(
                source,
                "Nguồn lead",
                150
        );

        return dao.create(validName, validSource, ownerUserId);
    }

    public List<LeadForm> forms(long ownerUserId)
            throws SQLException {
        return dao.listForms(ownerUserId);
    }

    public List<Map<String, Object>> leads(long ownerUserId)
            throws SQLException {
        return dao.listLeads(ownerUserId);
    }

    public void deactivate(String id, long ownerUserId)
            throws SQLException {

        if (!dao.deactivate(id, ownerUserId)) {
            throw new NoSuchElementException(
                    "Không tìm thấy biểu mẫu của bạn."
            );
        }
    }
}