package com.crm.dto.leads;

public record LeadSubmission(
        String fullName,
        String email,
        String phone,
        String company,
        String interest
) {
}