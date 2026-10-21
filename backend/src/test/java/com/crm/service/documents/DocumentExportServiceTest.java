package com.crm.service.documents;

import com.crm.model.documents.DocumentTemplate;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.NoSuchElementException;

import static org.junit.jupiter.api.Assertions.*;

class DocumentExportServiceTest {

    private final DocumentExportService service = new DocumentExportService();

    @Test
    @DisplayName("Xem trước PDF mẫu Báo giá và Hợp đồng từ dữ liệu demo")
    void testPreviewTemplatePdf() throws Exception {
        // Admin user ID = 1 có đầy đủ quyền
        var quotePreview = service.previewTemplatePdf(1L, DocumentTemplate.TYPE_QUOTE);
        assertNotNull(quotePreview);
        assertEquals("Preview_BaoGia.pdf", quotePreview.fileName());
        assertTrue(quotePreview.bytes().length > 2000);
        assertEquals('%', (char) quotePreview.bytes()[0]);

        var contractPreview = service.previewTemplatePdf(1L, DocumentTemplate.TYPE_CONTRACT);
        assertNotNull(contractPreview);
        assertEquals("Preview_HopDong.pdf", contractPreview.fileName());
        assertTrue(contractPreview.bytes().length > 2000);
        assertEquals('%', (char) contractPreview.bytes()[0]);
    }

    @Test
    @DisplayName("Xuất PDF báo giá đã có trong database")
    void testExportRealQuotePdf() throws Exception {
        // Báo giá ID = 1 (BG-2026-001) đã được seed trong DB
        var result = service.exportQuotePdf(1L, 1L);
        assertNotNull(result);
        assertTrue(result.fileName().startsWith("BaoGia_"));
        assertTrue(result.fileName().endsWith(".pdf"));
        assertTrue(result.bytes().length > 2000);
    }

    @Test
    @DisplayName("Từ chối xuất báo giá không tồn tại")
    void testExportNonExistentQuoteThrows() {
        assertThrows(NoSuchElementException.class, () -> service.exportQuotePdf(1L, 999999L));
    }

    @Test
    @DisplayName("Xuất PDF hợp đồng từ báo giá APPROVED thành công")
    void testExportContractPdfApproved() throws Exception {
        ContractInfo info = new ContractInfo();
        info.contractNumber = "HD-TEST-001";
        info.signedDate = LocalDate.now();
        info.effectiveDate = LocalDate.now();
        info.expiryDate = LocalDate.now().plusMonths(6);
        info.paymentTerms = "Thanh toán 100% sau khi ký.";

        // Báo giá 1 ở trạng thái APPROVED
        var result = service.exportContractPdf(1L, 1L, info);
        assertNotNull(result);
        assertEquals("HopDong_HD-TEST-001.pdf", result.fileName());
        assertTrue(result.bytes().length > 2000);
    }

    @Test
    @DisplayName("Từ chối xuất hợp đồng khi báo giá chưa được duyệt (DRAFT)")
    void testExportContractPdfDraftThrows() {
        ContractInfo info = new ContractInfo();
        info.contractNumber = "HD-FAIL-001";
        info.signedDate = LocalDate.now();
        info.effectiveDate = LocalDate.now();

        // Báo giá 4 ở trạng thái DRAFT
        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> service.exportContractPdf(1L, 4L, info));
        assertTrue(ex.getMessage().contains("phê duyệt"));
    }
}
