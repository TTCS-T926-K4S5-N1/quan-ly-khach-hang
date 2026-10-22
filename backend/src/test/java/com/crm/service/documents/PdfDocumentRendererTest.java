package com.crm.service.documents;

import com.crm.model.documents.DocumentTemplate;
import com.lowagie.text.pdf.PdfReader;
import com.lowagie.text.pdf.parser.PdfTextExtractor;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDate;

import static org.junit.jupiter.api.Assertions.*;

class PdfDocumentRendererTest {

    private PdfDocumentRenderer renderer;
    private DocumentTemplate quoteTemplate;
    private DocumentTemplate contractTemplate;
    private QuoteDocumentData sampleQuote;

    @BeforeEach
    void setUp() {
        renderer = new PdfDocumentRenderer();

        quoteTemplate = new DocumentTemplate();
        quoteTemplate.setDocumentType("QUOTE");
        quoteTemplate.setName("Mẫu Báo giá Chuẩn");
        quoteTemplate.setTitle("BÁO GIÁ DỊCH VỤ");
        quoteTemplate.setCompanyName("CÔNG TY CỔ PHẦN CÔNG NGHỆ ALPHA VIỆT NAM");
        quoteTemplate.setCompanyAddress("Số 1 Đại Cồ Việt, Hai Bà Trưng, Hà Nội");
        quoteTemplate.setCompanyTaxCode("0101234567");
        quoteTemplate.setCompanyPhone("024 3869 1234");
        quoteTemplate.setCompanyEmail("contact@alphavietnam.vn");
        quoteTemplate.setCompanyBankAccount("STK 190012345678 - Techcombank");
        quoteTemplate.setRepresentativeName("Trần Văn Bảo");
        quoteTemplate.setRepresentativeTitle("Giám đốc Điều hành");
        quoteTemplate.setPrimaryColor("#1E3A8A");
        quoteTemplate.setIntroText("Kính gửi {customerName},\nChúng tôi xin gửi bảng báo giá {quoteNumber}:");
        quoteTemplate.setTermsText("1. Hiệu lực trong {validityDays} ngày.\n2. Giá đã bao gồm thuế GTGT.");
        quoteTemplate.setFooterText("CÔNG TY CỔ PHẦN CÔNG NGHỆ ALPHA VIỆT NAM - Hotline 024 3869 1234");
        quoteTemplate.setCurrencyUnit("đồng");
        quoteTemplate.setValidityDays(30);

        contractTemplate = new DocumentTemplate();
        contractTemplate.setDocumentType("CONTRACT");
        contractTemplate.setName("Mẫu Hợp đồng Mua bán");
        contractTemplate.setTitle("HỢP ĐỒNG CUNG CẤP DỊCH VỤ");
        contractTemplate.setCompanyName("CÔNG TY CỔ PHẦN CÔNG NGHỆ ALPHA VIỆT NAM");
        contractTemplate.setCompanyAddress("Số 1 Đại Cồ Việt, Hai Bà Trưng, Hà Nội");
        contractTemplate.setCompanyTaxCode("0101234567");
        contractTemplate.setCompanyPhone("024 3869 1234");
        contractTemplate.setRepresentativeName("Trần Văn Bảo");
        contractTemplate.setRepresentativeTitle("Giám đốc Điều hành");
        contractTemplate.setPrimaryColor("#0D9488");
        contractTemplate.setIntroText("Căn cứ vào báo giá {quoteNumber} ngày {signedDate}:");
        contractTemplate.setTermsText("Điều 4. Quyền và nghĩa vụ\n- Bên A đảm bảo dịch vụ.\n- Bên B thanh toán đúng hạn.\nĐiều 5. Điều khoản chung\n- Hợp đồng lập thành 2 bản.");
        contractTemplate.setFooterText("Hợp đồng số {contractNumber}");
        contractTemplate.setCurrencyUnit("đồng");

        sampleQuote = new QuoteDocumentData();
        sampleQuote.quoteNumber = "BG-2026-TEST";
        sampleQuote.title = "Báo giá phần mềm CRM Doanh nghiệp";
        sampleQuote.status = "APPROVED";
        sampleQuote.createdDate = LocalDate.of(2026, 10, 21);
        sampleQuote.customerName = "TẬP ĐOÀN DỆT MAY VIỆT NAM";
        sampleQuote.customerTaxCode = "0100109922";
        sampleQuote.customerAddress = "25 Bà Triệu, Hoàn Kiếm, Hà Nội";
        sampleQuote.customerPhone = "024 3825 7800";
        sampleQuote.customerEmail = "info@vinatex.com.vn";
        sampleQuote.ownerName = "Lê Thị Mai";
        sampleQuote.opportunityName = "Triển khai hệ thống CRM";
        sampleQuote.subtotal = new BigDecimal("50000000");
        sampleQuote.discountPercent = new BigDecimal("10.0");
        sampleQuote.totalAmount = new BigDecimal("45000000");

        sampleQuote.items.add(new QuoteDocumentData.LineItem(
                "CRM-CORE", "Phần mềm Quản lý Khách hàng Core CRM", "Bản quyền", 1,
                new BigDecimal("30000000"), BigDecimal.ZERO, new BigDecimal("30000000")
        ));
        sampleQuote.items.add(new QuoteDocumentData.LineItem(
                "SRV-IMPL", "Dịch vụ cài đặt, đào tạo và chuyển giao công nghệ", "Gói", 1,
                new BigDecimal("20000000"), BigDecimal.ZERO, new BigDecimal("20000000")
        ));
    }

    @Test
    @DisplayName("Xuất PDF báo giá: byte header %PDF, trích xuất text chứa tiếng Việt và số tiền bằng chữ")
    void testRenderQuotePdf() throws Exception {
        byte[] pdfBytes = renderer.renderQuote(quoteTemplate, sampleQuote);

        assertNotNull(pdfBytes);
        assertTrue(pdfBytes.length > 2000, "PDF phải có dung lượng hợp lệ");
        assertEquals('%', (char) pdfBytes[0]);
        assertEquals('P', (char) pdfBytes[1]);
        assertEquals('D', (char) pdfBytes[2]);
        assertEquals('F', (char) pdfBytes[3]);

        PdfReader reader = new PdfReader(pdfBytes);
        PdfTextExtractor extractor = new PdfTextExtractor(reader);
        StringBuilder fullText = new StringBuilder();
        for (int p = 1; p <= reader.getNumberOfPages(); p++) {
            fullText.append(extractor.getTextFromPage(p)).append("\n");
        }
        String text = fullText.toString();
        reader.close();

        assertTrue(text.contains("BG-2026-TEST"), "Chứa số báo giá");
        assertTrue(text.contains("0101234567"), "Chứa MST công ty");
        assertTrue(text.contains("0100109922"), "Chứa MST khách hàng");
        assertTrue(text.contains("190012345678"), "Chứa thông tin tài khoản");
        assertTrue(text.contains("45.000.000"), "Chứa tổng tiền số");
        assertTrue(text.contains("CRM-"), "Chứa mã sản phẩm");
    }

    @Test
    @DisplayName("Báo giá chưa duyệt (DRAFT) có đóng dấu mờ BẢN NHÁP")
    void testRenderDraftQuoteHasWatermark() throws Exception {
        sampleQuote.status = "DRAFT";
        byte[] pdfBytes = renderer.renderQuote(quoteTemplate, sampleQuote);

        assertNotNull(pdfBytes);
        PdfReader reader = new PdfReader(pdfBytes);
        PdfTextExtractor extractor = new PdfTextExtractor(reader);
        String text = extractor.getTextFromPage(1);
        reader.close();

        assertTrue(text.contains("BẢN NHÁP"), "Báo giá DRAFT phải chứa dấu chữ chìm BẢN NHÁP");
    }

    @Test
    @DisplayName("Thay đổi cấu hình mẫu được phản ánh ngay trên nội dung PDF (không hard-code)")
    void testTemplateCustomizationReflected() throws Exception {
        quoteTemplate.setCompanyName("TẬP ĐOÀN TÀI CHÍNH TOÀN CẦU GLOBAL FIN");
        quoteTemplate.setTitle("BẢNG GIÁ DỰ ÁN ĐẶC BIỆT");
        quoteTemplate.setTermsText("Điều khoản thanh toán đặc biệt: Trả chậm 90 ngày.");

        byte[] pdfBytes = renderer.renderQuote(quoteTemplate, sampleQuote);
        PdfReader reader = new PdfReader(pdfBytes);
        PdfTextExtractor extractor = new PdfTextExtractor(reader);
        String text = extractor.getTextFromPage(1);
        reader.close();

        assertTrue(text.contains("TẬP ĐOÀN TÀI CHÍNH TOÀN CẦU GLOBAL FIN"));
        assertTrue(text.contains("BẢNG GIÁ DỰ ÁN ĐẶC BIỆT"));
        assertTrue(text.contains("Trả chậm 90 ngày"));
    }

    @Test
    @DisplayName("Xuất PDF hợp đồng: chứa Bên A, Bên B, số HĐ, điều khoản và ô ký")
    void testRenderContractPdf() throws Exception {
        ContractInfo contract = new ContractInfo();
        contract.contractNumber = "HD-ALPHA-2026-001";
        contract.signedDate = LocalDate.of(2026, 10, 21);
        contract.effectiveDate = LocalDate.of(2026, 10, 22);
        contract.expiryDate = LocalDate.of(2027, 10, 21);
        contract.paymentTerms = "Thanh toán làm 2 đợt qua chuyển khoản ngân hàng.";

        byte[] pdfBytes = renderer.renderContract(contractTemplate, sampleQuote, contract);

        assertNotNull(pdfBytes);
        assertTrue(pdfBytes.length > 2000);

        PdfReader reader = new PdfReader(pdfBytes);
        PdfTextExtractor extractor = new PdfTextExtractor(reader);
        String text = extractor.getTextFromPage(1);
        reader.close();

        assertTrue(text.contains("HỢP ĐỒNG CUNG CẤP DỊCH VỤ"));
        assertTrue(text.contains("HD-ALPHA-2026-001"));
        assertTrue(text.contains("BÊN A"));
        assertTrue(text.contains("BÊN B"));
        assertTrue(text.contains("TẬP ĐOÀN DỆT MAY VIỆT NAM"));
        assertTrue(text.contains("Thanh toán làm 2 đợt qua chuyển khoản"));
    }

    @Test
    @DisplayName("Logo base64 không hợp lệ vẫn xuất PDF bình thường, không gây sập ứng dụng")
    void testCorruptedLogoDoesNotCrash() {
        quoteTemplate.setLogoData("data:image/png;base64,invalid_base64_content_!@#$%^");
        assertDoesNotThrow(() -> {
            byte[] bytes = renderer.renderQuote(quoteTemplate, sampleQuote);
            assertNotNull(bytes);
            assertTrue(bytes.length > 1000);
        });
    }
}
