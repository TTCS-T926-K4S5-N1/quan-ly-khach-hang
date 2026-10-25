package com.crm.service.documents;

import com.crm.model.documents.DocumentTemplate;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class DocumentTemplateServiceTest {

    final DocumentTemplateService service = new DocumentTemplateService();

    @Test
    @DisplayName("Mẫu tài liệu hợp lệ vượt qua thẩm định")
    void testValidTemplatePasses() {
        DocumentTemplate t = new DocumentTemplate();
        t.setDocumentType("QUOTE");
        t.setName("Mẫu Báo giá mặc định");
        t.setTitle("BÁO GIÁ");
        t.setCompanyName("CÔNG TY CRM");
        t.setPrimaryColor("#1E3A8A");
        t.setValidityDays(30);

        assertDoesNotThrow(() -> service.validate(t));
    }

    @Test
    @DisplayName("Từ chối khi thiếu các trường bắt buộc")
    void testRequiredFieldsValidation() {
        DocumentTemplate t = new DocumentTemplate();
        assertThrows(IllegalArgumentException.class, () -> service.validate(t));

        t.setDocumentType("QUOTE");
        assertThrows(IllegalArgumentException.class, () -> service.validate(t));

        t.setName("Mẫu");
        assertThrows(IllegalArgumentException.class, () -> service.validate(t));

        t.setTitle("BÁO GIÁ");
        assertThrows(IllegalArgumentException.class, () -> service.validate(t));
    }

    @Test
    @DisplayName("Từ chối mã màu HEX không đúng định dạng")
    void testColorValidation() {
        DocumentTemplate t = new DocumentTemplate();
        t.setDocumentType("QUOTE");
        t.setName("Mẫu");
        t.setTitle("BÁO GIÁ");
        t.setCompanyName("CÔNG TY CRM");

        t.setPrimaryColor("blue");
        assertThrows(IllegalArgumentException.class, () -> service.validate(t));

        t.setPrimaryColor("#12345");
        assertThrows(IllegalArgumentException.class, () -> service.validate(t));

        t.setPrimaryColor("#1E3A8A");
        assertDoesNotThrow(() -> service.validate(t));
    }

    @Test
    @DisplayName("Từ chối logo sai định dạng hoặc vượt quá 500 KB")
    void testLogoValidation() {
        DocumentTemplate t = new DocumentTemplate();
        t.setDocumentType("QUOTE");
        t.setName("Mẫu");
        t.setTitle("BÁO GIÁ");
        t.setCompanyName("CÔNG TY CRM");

        // Sai định dạng MIME (không phải png hoặc jpeg)
        t.setLogoData("data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7");
        assertThrows(IllegalArgumentException.class, () -> service.validate(t));

        // Vượt quá 500 KB (chuỗi base64 dài > 700,000 ký tự)
        String hugeBase64 = "data:image/png;base64," + "A".repeat(700000);
        t.setLogoData(hugeBase64);
        assertThrows(IllegalArgumentException.class, () -> service.validate(t));

        // Hợp lệ
        t.setLogoData("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==");
        assertDoesNotThrow(() -> service.validate(t));
    }

    @Test
    @DisplayName("Thẩm định ràng buộc thông tin hợp đồng ContractInfo")
    void testContractInfoValidation() {
        ContractInfo info = new ContractInfo();
        assertThrows(IllegalArgumentException.class, info::validate);

        info.contractNumber = "HD-001";
        assertThrows(IllegalArgumentException.class, info::validate);

        info.signedDate = java.time.LocalDate.of(2026, 10, 21);
        assertThrows(IllegalArgumentException.class, info::validate);

        // Ngày hiệu lực trước ngày ký
        info.effectiveDate = java.time.LocalDate.of(2026, 10, 20);
        assertThrows(IllegalArgumentException.class, info::validate);

        // Ngày hiệu lực hợp lệ
        info.effectiveDate = java.time.LocalDate.of(2026, 10, 22);
        assertDoesNotThrow(info::validate);

        // Ngày hết hạn trước ngày hiệu lực
        info.expiryDate = java.time.LocalDate.of(2026, 10, 21);
        assertThrows(IllegalArgumentException.class, info::validate);

        info.expiryDate = java.time.LocalDate.of(2027, 10, 21);
        assertDoesNotThrow(info::validate);
    }
}
