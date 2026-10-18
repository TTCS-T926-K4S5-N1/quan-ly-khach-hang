package com.crm.dao.templates;

import com.crm.config.DatabaseConfig;

import java.sql.*;
import java.util.LinkedHashMap;
import java.util.Map;

public class DocumentTemplateDAO {

    public Map<String, Object> findByType(String templateType) throws SQLException {
        String sql = """
                SELECT id, template_type, template_name, company_name, company_tax_code,
                       company_address, company_phone, company_email, company_bank_info,
                       company_logo_url, header_content, footer_content, default_terms,
                       updated_by, updated_at
                FROM document_templates
                WHERE template_type = ?
                LIMIT 1
                """;
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setString(1, templateType);
            try (ResultSet rs = stmt.executeQuery()) {
                if (rs.next()) {
                    return mapTemplate(rs);
                }
            }
        }
        return null;
    }

    public void update(String templateType, Map<String, Object> data, Long userId) throws SQLException {
        String sql = """
                UPDATE document_templates SET
                    template_name = COALESCE(?, template_name),
                    company_name = COALESCE(?, company_name),
                    company_tax_code = ?,
                    company_address = ?,
                    company_phone = ?,
                    company_email = ?,
                    company_bank_info = ?,
                    company_logo_url = ?,
                    header_content = ?,
                    footer_content = ?,
                    default_terms = ?,
                    updated_by = ?
                WHERE template_type = ?
                """;
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setString(1, (String) data.get("templateName"));
            stmt.setString(2, (String) data.get("companyName"));
            stmt.setString(3, (String) data.get("companyTaxCode"));
            stmt.setString(4, (String) data.get("companyAddress"));
            stmt.setString(5, (String) data.get("companyPhone"));
            stmt.setString(6, (String) data.get("companyEmail"));
            stmt.setString(7, (String) data.get("companyBankInfo"));
            stmt.setString(8, (String) data.get("companyLogoUrl"));
            stmt.setString(9, (String) data.get("headerContent"));
            stmt.setString(10, (String) data.get("footerContent"));
            stmt.setString(11, (String) data.get("defaultTerms"));
            if (userId != null) {
                stmt.setLong(12, userId);
            } else {
                stmt.setNull(12, Types.BIGINT);
            }
            stmt.setString(13, templateType);
            stmt.executeUpdate();
        }
    }

    private Map<String, Object> mapTemplate(ResultSet rs) throws SQLException {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("id", rs.getLong("id"));
        map.put("templateType", rs.getString("template_type"));
        map.put("templateName", rs.getString("template_name"));
        map.put("companyName", rs.getString("company_name"));
        map.put("companyTaxCode", rs.getString("company_tax_code"));
        map.put("companyAddress", rs.getString("company_address"));
        map.put("companyPhone", rs.getString("company_phone"));
        map.put("companyEmail", rs.getString("company_email"));
        map.put("companyBankInfo", rs.getString("company_bank_info"));
        map.put("companyLogoUrl", rs.getString("company_logo_url"));
        map.put("headerContent", rs.getString("header_content"));
        map.put("footerContent", rs.getString("footer_content"));
        map.put("defaultTerms", rs.getString("default_terms"));
        map.put("updatedBy", rs.getObject("updated_by"));
        map.put("updatedAt", rs.getTimestamp("updated_at"));
        return map;
    }
}
