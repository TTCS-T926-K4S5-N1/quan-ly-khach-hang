package com.crm.dao.documents;

import com.crm.config.DatabaseConfig;
import com.crm.model.documents.DocumentTemplate;

import java.sql.*;
import java.util.ArrayList;
import java.util.List;

public class DocumentTemplateDAO {

    public DocumentTemplate findByType(String type) throws SQLException {
        if (type == null || type.isBlank()) return null;
        String sql = """
                SELECT id, document_type, name, title, company_name, company_address,
                       company_tax_code, company_phone, company_email, company_website,
                       company_bank_account, representative_name, representative_title,
                       logo_data, primary_color, intro_text, terms_text, footer_text,
                       currency_unit, validity_days, updated_by, updated_at
                FROM document_templates
                WHERE document_type = ?
                """;

        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setString(1, type.trim().toUpperCase());
            try (ResultSet rs = stmt.executeQuery()) {
                if (rs.next()) {
                    return mapRow(rs);
                }
            }
        }
        return null;
    }

    public List<DocumentTemplate> findAll() throws SQLException {
        String sql = """
                SELECT id, document_type, name, title, company_name, company_address,
                       company_tax_code, company_phone, company_email, company_website,
                       company_bank_account, representative_name, representative_title,
                       logo_data, primary_color, intro_text, terms_text, footer_text,
                       currency_unit, validity_days, updated_by, updated_at
                FROM document_templates
                ORDER BY document_type ASC
                """;

        List<DocumentTemplate> list = new ArrayList<>();
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql);
             ResultSet rs = stmt.executeQuery()) {
            while (rs.next()) {
                list.add(mapRow(rs));
            }
        }
        return list;
    }

    public void upsert(DocumentTemplate t) throws SQLException {
        String sql = """
                INSERT INTO document_templates (
                    document_type, name, title, company_name, company_address,
                    company_tax_code, company_phone, company_email, company_website,
                    company_bank_account, representative_name, representative_title,
                    logo_data, primary_color, intro_text, terms_text, footer_text,
                    currency_unit, validity_days, updated_by
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE
                    name = VALUES(name),
                    title = VALUES(title),
                    company_name = VALUES(company_name),
                    company_address = VALUES(company_address),
                    company_tax_code = VALUES(company_tax_code),
                    company_phone = VALUES(company_phone),
                    company_email = VALUES(company_email),
                    company_website = VALUES(company_website),
                    company_bank_account = VALUES(company_bank_account),
                    representative_name = VALUES(representative_name),
                    representative_title = VALUES(representative_title),
                    logo_data = VALUES(logo_data),
                    primary_color = VALUES(primary_color),
                    intro_text = VALUES(intro_text),
                    terms_text = VALUES(terms_text),
                    footer_text = VALUES(footer_text),
                    currency_unit = VALUES(currency_unit),
                    validity_days = VALUES(validity_days),
                    updated_by = VALUES(updated_by)
                """;

        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setString(1, t.getDocumentType().trim().toUpperCase());
            stmt.setString(2, t.getName());
            stmt.setString(3, t.getTitle());
            stmt.setString(4, t.getCompanyName());
            stmt.setString(5, t.getCompanyAddress());
            stmt.setString(6, t.getCompanyTaxCode());
            stmt.setString(7, t.getCompanyPhone());
            stmt.setString(8, t.getCompanyEmail());
            stmt.setString(9, t.getCompanyWebsite());
            stmt.setString(10, t.getCompanyBankAccount());
            stmt.setString(11, t.getRepresentativeName());
            stmt.setString(12, t.getRepresentativeTitle());
            stmt.setString(13, t.getLogoData());
            stmt.setString(14, t.getPrimaryColor());
            stmt.setString(15, t.getIntroText());
            stmt.setString(16, t.getTermsText());
            stmt.setString(17, t.getFooterText());
            stmt.setString(18, t.getCurrencyUnit() != null ? t.getCurrencyUnit() : "đồng");
            stmt.setInt(19, t.getValidityDays() > 0 ? t.getValidityDays() : 30);
            stmt.setObject(20, t.getUpdatedBy(), Types.BIGINT);

            stmt.executeUpdate();
        }
    }

    private DocumentTemplate mapRow(ResultSet rs) throws SQLException {
        DocumentTemplate t = new DocumentTemplate();
        t.setId(rs.getLong("id"));
        t.setDocumentType(rs.getString("document_type"));
        t.setName(rs.getString("name"));
        t.setTitle(rs.getString("title"));
        t.setCompanyName(rs.getString("company_name"));
        t.setCompanyAddress(rs.getString("company_address"));
        t.setCompanyTaxCode(rs.getString("company_tax_code"));
        t.setCompanyPhone(rs.getString("company_phone"));
        t.setCompanyEmail(rs.getString("company_email"));
        t.setCompanyWebsite(rs.getString("company_website"));
        t.setCompanyBankAccount(rs.getString("company_bank_account"));
        t.setRepresentativeName(rs.getString("representative_name"));
        t.setRepresentativeTitle(rs.getString("representative_title"));
        t.setLogoData(rs.getString("logo_data"));
        t.setPrimaryColor(rs.getString("primary_color"));
        t.setIntroText(rs.getString("intro_text"));
        t.setTermsText(rs.getString("terms_text"));
        t.setFooterText(rs.getString("footer_text"));
        t.setCurrencyUnit(rs.getString("currency_unit"));
        t.setValidityDays(rs.getInt("validity_days"));
        t.setUpdatedBy(rs.getObject("updated_by", Long.class));
        Timestamp updatedAt = rs.getTimestamp("updated_at");
        if (updatedAt != null) {
            t.setUpdatedAt(updatedAt.toInstant().toString());
        }
        return t;
    }
}
