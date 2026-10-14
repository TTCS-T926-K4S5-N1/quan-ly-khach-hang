package com.crm.dto.leads;

public record LeadForm(
        String id,
        String name,
        String source,
        long ownerUserId,
        boolean active
) {
}