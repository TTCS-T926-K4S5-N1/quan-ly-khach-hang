package com.crm.service.documents;

import com.crm.model.documents.DocumentTemplate;
import com.crm.util.VietnameseNumberToWords;
import com.lowagie.text.Chunk;
import com.lowagie.text.Document;
import com.lowagie.text.DocumentException;
import com.lowagie.text.Element;
import com.lowagie.text.Font;
import com.lowagie.text.Image;
import com.lowagie.text.PageSize;
import com.lowagie.text.Paragraph;
import com.lowagie.text.Phrase;
import com.lowagie.text.Rectangle;
import com.lowagie.text.pdf.BaseFont;
import com.lowagie.text.pdf.ColumnText;
import com.lowagie.text.pdf.PdfContentByte;
import com.lowagie.text.pdf.PdfGState;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfPageEventHelper;
import com.lowagie.text.pdf.PdfWriter;

import java.awt.Color;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.nio.file.Files;
import java.nio.file.Path;
import java.text.DecimalFormat;
import java.text.DecimalFormatSymbols;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.Base64;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * SCRUM-94: dựng PDF báo giá / hợp đồng từ {@link DocumentTemplate} + dữ liệu nghiệp vụ.
 *
 * <p>Lớp này chỉ chứa BỐ CỤC. Mọi nội dung nhận diện thương hiệu (tên công ty, logo, màu,
 * điều khoản, chân trang…) đều lấy từ mẫu cấu hình. Không truy cập DB để có thể unit-test.</p>
 */
public class PdfDocumentRenderer {

    private static final DateTimeFormatter DATE = DateTimeFormatter.ofPattern("dd/MM/yyyy");
    private static final Color TEXT = new Color(0x1F, 0x29, 0x37);
    private static final Color MUTED = new Color(0x6B, 0x72, 0x80);
    private static final Color BORDER = new Color(0xD1, 0xD5, 0xDB);
    private static final Color ZEBRA = new Color(0xF8, 0xFA, 0xFC);
    private static final Color DEFAULT_PRIMARY = new Color(0x1E, 0x3A, 0x8A);

    private static volatile BaseFont regularFont;
    private static volatile BaseFont boldFont;
    private static volatile BaseFont italicFont;

    /* =====================================================================
       PUBLIC API
       ===================================================================== */

    public byte[] renderQuote(DocumentTemplate template, QuoteDocumentData quote) {
        requireTemplate(template);
        Map<String, String> vars = variables(template, quote, null);
        Styles s = new Styles(parseColor(template.getPrimaryColor()));

        return build(template, vars, !quote.isFinalStatus(), s, document -> {
            addCompanyHeader(document, template, s);
            addTitle(document, valueOr(template.getTitle(), "BÁO GIÁ"),
                    "Số: " + safe(quote.quoteNumber) + "   |   Ngày lập: " + formatDate(quote.createdDate), s);

            // Khách hàng | Thông tin báo giá
            PdfPTable info = new PdfPTable(new float[]{55, 45});
            info.setWidthPercentage(100);
            info.setSpacingAfter(10);
            info.addCell(infoBox("KÍNH GỬI", new String[][]{
                    {"Khách hàng", quote.customerName},
                    {"Mã số thuế", quote.customerTaxCode},
                    {"Địa chỉ", quote.customerAddress},
                    {"Điện thoại", quote.customerPhone},
                    {"Email", quote.customerEmail}
            }, s));
            LocalDate validUntil = quote.createdDate == null ? null
                    : quote.createdDate.plusDays(Math.max(0, template.getValidityDays()));
            info.addCell(infoBox("THÔNG TIN BÁO GIÁ", new String[][]{
                    {"Số báo giá", quote.quoteNumber},
                    {"Tiêu đề", quote.title},
                    {"Hiệu lực đến", formatDate(validUntil)},
                    {"Cơ hội", quote.opportunityName},
                    {"Người phụ trách", quote.ownerName}
            }, s));
            document.add(info);

            addMultiline(document, apply(template.getIntroText(), vars), s.body, 8);
            addItemsTable(document, quote, s);
            addTotals(document, quote, template, s);

            if (notBlank(template.getTermsText())) {
                document.add(sectionHeading("ĐIỀU KHOẢN & GHI CHÚ", s));
                addMultiline(document, apply(template.getTermsText(), vars), s.body, 6);
            }
            if (notBlank(template.getCompanyBankAccount())) {
                Paragraph bank = new Paragraph();
                bank.add(new Chunk("Thông tin thanh toán: ", s.bodyBold));
                bank.add(new Chunk(template.getCompanyBankAccount(), s.body));
                bank.setSpacingAfter(6);
                document.add(bank);
            }

            addSignatures(document,
                    "ĐẠI DIỆN KHÁCH HÀNG", safe(quote.customerName), "",
                    "ĐẠI DIỆN " + valueOr(template.getCompanyName(), "").toUpperCase(),
                    safe(template.getRepresentativeName()), safe(template.getRepresentativeTitle()), s);
        });
    }

    public byte[] renderContract(DocumentTemplate template, QuoteDocumentData quote, ContractInfo contract) {
        requireTemplate(template);
        if (contract == null) {
            throw new IllegalArgumentException("Thiếu thông tin hợp đồng.");
        }
        contract.validate();
        Map<String, String> vars = variables(template, quote, contract);
        Styles s = new Styles(parseColor(template.getPrimaryColor()));

        return build(template, vars, false, s, document -> {
            addCompanyHeader(document, template, s);

            Paragraph nation = new Paragraph("CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM", s.bodyBold);
            nation.setAlignment(Element.ALIGN_CENTER);
            document.add(nation);
            Paragraph motto = new Paragraph("Độc lập - Tự do - Hạnh phúc", s.bodyBold);
            motto.setAlignment(Element.ALIGN_CENTER);
            motto.setSpacingAfter(4);
            document.add(motto);

            addTitle(document, valueOr(template.getTitle(), "HỢP ĐỒNG"),
                    "Số: " + contract.contractNumber, s);

            addMultiline(document, apply(template.getIntroText(), vars), s.body, 8);

            document.add(partyBlock("BÊN A (BÊN BÁN)", new String[][]{
                    {"Tên đơn vị", template.getCompanyName()},
                    {"Địa chỉ", template.getCompanyAddress()},
                    {"Mã số thuế", template.getCompanyTaxCode()},
                    {"Điện thoại", template.getCompanyPhone()},
                    {"Tài khoản", template.getCompanyBankAccount()},
                    {"Đại diện", joinNonBlank(template.getRepresentativeName(), template.getRepresentativeTitle(), " - Chức vụ: ")}
            }, s));
            document.add(partyBlock("BÊN B (BÊN MUA)", new String[][]{
                    {"Tên đơn vị", quote.customerName},
                    {"Địa chỉ", quote.customerAddress},
                    {"Mã số thuế", quote.customerTaxCode},
                    {"Điện thoại", quote.customerPhone},
                    {"Email", quote.customerEmail}
            }, s));

            Paragraph agree = new Paragraph("Hai bên thống nhất ký kết hợp đồng với các điều khoản sau:", s.body);
            agree.setSpacingBefore(4);
            agree.setSpacingAfter(4);
            document.add(agree);

            document.add(sectionHeading("Điều 1. Hàng hóa / dịch vụ và giá trị hợp đồng", s));
            addItemsTable(document, quote, s);
            addTotals(document, quote, template, s);

            document.add(sectionHeading("Điều 2. Thời hạn hợp đồng", s));
            String term = "Hợp đồng có hiệu lực từ ngày " + formatDate(contract.effectiveDate)
                    + (contract.expiryDate != null ? " đến hết ngày " + formatDate(contract.expiryDate) : "")
                    + ".";
            addMultiline(document, term, s.body, 4);

            document.add(sectionHeading("Điều 3. Điều khoản thanh toán", s));
            addMultiline(document, valueOr(contract.paymentTerms,
                    "Theo thỏa thuận giữa hai bên, thanh toán bằng chuyển khoản vào tài khoản của Bên A."), s.body, 4);

            if (notBlank(template.getTermsText())) {
                addTermsWithHeadings(document, apply(template.getTermsText(), vars), s);
            }

            addSignatures(document,
                    "ĐẠI DIỆN BÊN A", safe(template.getRepresentativeName()), safe(template.getRepresentativeTitle()),
                    "ĐẠI DIỆN BÊN B", safe(quote.customerName), "", s);
        });
    }

    /* =====================================================================
       DOCUMENT SCAFFOLD
       ===================================================================== */

    @FunctionalInterface
    private interface Body {
        void write(Document document) throws DocumentException, IOException;
    }

    private byte[] build(DocumentTemplate template, Map<String, String> vars, boolean draft, Styles s, Body body) {
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        Document document = new Document(PageSize.A4, 40, 40, 36, 54);
        try {
            PdfWriter writer = PdfWriter.getInstance(document, out);
            writer.setPageEvent(new PageDecorator(apply(template.getFooterText(), vars), draft, s));
            document.addTitle(valueOr(template.getTitle(), "Tài liệu"));
            document.addAuthor(valueOr(template.getCompanyName(), "CRM"));
            document.addCreator("Corporate CRM - SCRUM-94");
            document.open();
            body.write(document);
            document.close();
        } catch (DocumentException | IOException e) {
            throw new IllegalStateException("Không thể tạo file PDF: " + e.getMessage(), e);
        }
        return out.toByteArray();
    }

    /** Chân trang (nội dung từ cấu hình + số trang) và dấu chữ chìm BẢN NHÁP. */
    private static final class PageDecorator extends PdfPageEventHelper {
        private final String footer;
        private final boolean draft;
        private final Styles s;

        PageDecorator(String footer, boolean draft, Styles s) {
            this.footer = footer;
            this.draft = draft;
            this.s = s;
        }

        @Override
        public void onEndPage(PdfWriter writer, Document document) {
            PdfContentByte cb = writer.getDirectContent();
            Rectangle page = document.getPageSize();

            cb.saveState();
            cb.setColorStroke(s.primary);
            cb.setLineWidth(0.8f);
            cb.moveTo(document.left(), 42);
            cb.lineTo(document.right(), 42);
            cb.stroke();
            cb.restoreState();

            if (notBlank(footer)) {
                ColumnText.showTextAligned(cb, Element.ALIGN_LEFT,
                        new Phrase(footer.replace('\n', ' '), s.small), document.left(), 30, 0);
            }
            ColumnText.showTextAligned(cb, Element.ALIGN_RIGHT,
                    new Phrase("Trang " + writer.getPageNumber(), s.small), document.right(), 30, 0);

            if (draft) {
                PdfContentByte under = writer.getDirectContentUnder();
                under.saveState();
                PdfGState gs = new PdfGState();
                gs.setFillOpacity(0.10f);
                under.setGState(gs);
                ColumnText.showTextAligned(under, Element.ALIGN_CENTER,
                        new Phrase("BẢN NHÁP", s.watermark),
                        page.getWidth() / 2, page.getHeight() / 2, 45);
                under.restoreState();
            }
        }
    }

    /* =====================================================================
       BLOCKS
       ===================================================================== */

    private void addCompanyHeader(Document document, DocumentTemplate t, Styles s) throws DocumentException {
        Image logo = decodeLogo(t.getLogoData());
        PdfPTable header = logo != null ? new PdfPTable(new float[]{22, 78}) : new PdfPTable(1);
        header.setWidthPercentage(100);

        if (logo != null) {
            logo.scaleToFit(110, 60);
            PdfPCell logoCell = new PdfPCell(logo, false);
            logoCell.setBorder(Rectangle.NO_BORDER);
            logoCell.setVerticalAlignment(Element.ALIGN_MIDDLE);
            logoCell.setPaddingBottom(6);
            header.addCell(logoCell);
        }

        PdfPCell info = new PdfPCell();
        info.setBorder(Rectangle.NO_BORDER);
        info.setPaddingBottom(6);
        Paragraph name = new Paragraph(valueOr(t.getCompanyName(), ""), s.company);
        info.addElement(name);
        if (notBlank(t.getCompanyAddress())) {
            info.addElement(new Paragraph("Địa chỉ: " + t.getCompanyAddress(), s.small));
        }
        String contacts = joinParts(
                notBlank(t.getCompanyTaxCode()) ? "MST: " + t.getCompanyTaxCode() : null,
                notBlank(t.getCompanyPhone()) ? "ĐT: " + t.getCompanyPhone() : null,
                notBlank(t.getCompanyEmail()) ? "Email: " + t.getCompanyEmail() : null,
                notBlank(t.getCompanyWebsite()) ? t.getCompanyWebsite() : null);
        if (!contacts.isEmpty()) {
            info.addElement(new Paragraph(contacts, s.small));
        }
        header.addCell(info);

        PdfPCell rule = new PdfPCell();
        rule.setColspan(logo != null ? 2 : 1);
        rule.setBorder(Rectangle.BOTTOM);
        rule.setBorderColorBottom(s.primary);
        rule.setBorderWidthBottom(1.6f);
        rule.setFixedHeight(4);
        header.addCell(rule);

        header.setSpacingAfter(12);
        document.add(header);
    }

    private void addTitle(Document document, String title, String subtitle, Styles s) throws DocumentException {
        Paragraph p = new Paragraph(title.toUpperCase(), s.title);
        p.setAlignment(Element.ALIGN_CENTER);
        p.setSpacingBefore(4);
        document.add(p);
        Paragraph sub = new Paragraph(subtitle, s.muted);
        sub.setAlignment(Element.ALIGN_CENTER);
        sub.setSpacingAfter(12);
        document.add(sub);
    }

    private PdfPCell infoBox(String heading, String[][] rows, Styles s) {
        PdfPCell cell = new PdfPCell();
        cell.setBorderColor(BORDER);
        cell.setPadding(8);
        Paragraph h = new Paragraph(heading, s.label);
        h.setSpacingAfter(4);
        cell.addElement(h);
        for (String[] row : rows) {
            if (!notBlank(row[1])) {
                continue;
            }
            Paragraph line = new Paragraph();
            line.add(new Chunk(row[0] + ": ", s.bodyMuted));
            line.add(new Chunk(row[1], s.bodyBold));
            line.setLeading(13);
            cell.addElement(line);
        }
        return cell;
    }

    private PdfPTable partyBlock(String heading, String[][] rows, Styles s) {
        PdfPTable table = new PdfPTable(new float[]{24, 76});
        table.setWidthPercentage(100);
        table.setSpacingBefore(4);
        table.setSpacingAfter(4);
        PdfPCell head = new PdfPCell(new Phrase(heading, s.label));
        head.setColspan(2);
        head.setBorder(Rectangle.BOTTOM);
        head.setBorderColor(s.primary);
        head.setPaddingBottom(4);
        table.addCell(head);
        for (String[] row : rows) {
            if (!notBlank(row[1])) {
                continue;
            }
            table.addCell(plainCell(row[0] + ":", s.bodyMuted, Element.ALIGN_LEFT));
            table.addCell(plainCell(row[1], s.bodyBold, Element.ALIGN_LEFT));
        }
        return table;
    }

    private void addItemsTable(Document document, QuoteDocumentData quote, Styles s) throws DocumentException {
        PdfPTable table = new PdfPTable(new float[]{5, 11, 29, 8, 7, 14, 7, 19});
        table.setWidthPercentage(100);
        table.setHeaderRows(1);
        table.setSpacingBefore(4);

        String[] headers = {"STT", "Mã SP", "Tên sản phẩm / dịch vụ", "ĐVT", "SL", "Đơn giá", "CK", "Thành tiền"};
        for (String h : headers) {
            PdfPCell c = new PdfPCell(new Phrase(h, s.tableHead));
            c.setBackgroundColor(s.primary);
            c.setBorderColor(s.primary);
            c.setHorizontalAlignment(Element.ALIGN_CENTER);
            c.setVerticalAlignment(Element.ALIGN_MIDDLE);
            c.setPadding(5);
            table.addCell(c);
        }

        if (quote.items.isEmpty()) {
            PdfPCell empty = new PdfPCell(new Phrase("Chưa có dòng sản phẩm.", s.bodyMuted));
            empty.setColspan(headers.length);
            empty.setHorizontalAlignment(Element.ALIGN_CENTER);
            empty.setPadding(8);
            empty.setBorderColor(BORDER);
            table.addCell(empty);
        }

        int index = 1;
        for (QuoteDocumentData.LineItem item : quote.items) {
            Color bg = index % 2 == 0 ? ZEBRA : Color.WHITE;
            table.addCell(row(String.valueOf(index), s.body, Element.ALIGN_CENTER, bg));
            table.addCell(row(safe(item.productCode), s.body, Element.ALIGN_LEFT, bg));
            table.addCell(row(safe(item.productName), s.body, Element.ALIGN_LEFT, bg));
            table.addCell(row(safe(item.unit), s.body, Element.ALIGN_CENTER, bg));
            table.addCell(row(String.valueOf(item.quantity), s.body, Element.ALIGN_RIGHT, bg));
            table.addCell(row(formatMoney(item.unitPrice), s.body, Element.ALIGN_RIGHT, bg));
            table.addCell(row(formatPercent(item.discountPercent), s.body, Element.ALIGN_RIGHT, bg));
            table.addCell(row(formatMoney(item.amount), s.bodyBold, Element.ALIGN_RIGHT, bg));
            index++;
        }
        document.add(table);
    }

    private void addTotals(Document document, QuoteDocumentData quote, DocumentTemplate t, Styles s)
            throws DocumentException {
        PdfPTable totals = new PdfPTable(new float[]{60, 22, 18});
        totals.setWidthPercentage(100);
        totals.setSpacingBefore(2);

        addTotalRow(totals, "Tạm tính", formatMoney(quote.subtotal), s.body, s.body);
        BigDecimal discountPercent = quote.discountPercent == null ? BigDecimal.ZERO : quote.discountPercent;
        if (discountPercent.signum() > 0 || quote.discountAmount().signum() > 0) {
            addTotalRow(totals, "Chiết khấu (" + formatPercent(discountPercent) + ")",
                    "- " + formatMoney(quote.discountAmount()), s.body, s.body);
        }
        addTotalRow(totals, "TỔNG CỘNG (" + valueOr(t.getCurrencyUnit(), "đồng") + ")",
                formatMoney(quote.totalAmount), s.totalLabel, s.totalValue);
        document.add(totals);

        Paragraph words = new Paragraph();
        words.add(new Chunk("Bằng chữ: ", s.bodyBold));
        words.add(new Chunk(VietnameseNumberToWords.toCurrencyWords(quote.totalAmount, t.getCurrencyUnit()), s.italic));
        words.setSpacingBefore(6);
        words.setSpacingAfter(10);
        document.add(words);
    }

    private void addTotalRow(PdfPTable table, String label, String value, Font labelFont, Font valueFont) {
        PdfPCell spacer = new PdfPCell(new Phrase(""));
        spacer.setBorder(Rectangle.NO_BORDER);
        table.addCell(spacer);
        PdfPCell l = new PdfPCell(new Phrase(label, labelFont));
        l.setBorder(Rectangle.BOTTOM);
        l.setBorderColor(BORDER);
        l.setPadding(4);
        table.addCell(l);
        PdfPCell v = new PdfPCell(new Phrase(value, valueFont));
        v.setBorder(Rectangle.BOTTOM);
        v.setBorderColor(BORDER);
        v.setHorizontalAlignment(Element.ALIGN_RIGHT);
        v.setPadding(4);
        table.addCell(v);
    }

    /** Điều khoản hợp đồng: dòng bắt đầu bằng "Điều" được in đậm như tiêu đề. */
    private void addTermsWithHeadings(Document document, String text, Styles s) throws DocumentException {
        for (String line : text.split("\\r?\\n")) {
            if (line.isBlank()) {
                continue;
            }
            if (line.trim().toLowerCase().startsWith("điều ")) {
                document.add(sectionHeading(line.trim(), s));
            } else {
                Paragraph p = new Paragraph(line.trim(), s.body);
                p.setLeading(14);
                p.setSpacingAfter(2);
                document.add(p);
            }
        }
    }

    private void addSignatures(Document document,
                               String leftTitle, String leftName, String leftRole,
                               String rightTitle, String rightName, String rightRole,
                               Styles s) throws DocumentException {
        PdfPTable sign = new PdfPTable(2);
        sign.setWidthPercentage(100);
        sign.setSpacingBefore(18);
        sign.setKeepTogether(true);
        sign.addCell(signatureCell(leftTitle, leftName, leftRole, s));
        sign.addCell(signatureCell(rightTitle, rightName, rightRole, s));
        document.add(sign);
    }

    private PdfPCell signatureCell(String title, String name, String role, Styles s) {
        PdfPCell cell = new PdfPCell();
        cell.setBorder(Rectangle.NO_BORDER);
        Paragraph t = new Paragraph(title, s.label);
        t.setAlignment(Element.ALIGN_CENTER);
        cell.addElement(t);
        Paragraph hint = new Paragraph("(Ký, ghi rõ họ tên, đóng dấu)", s.small);
        hint.setAlignment(Element.ALIGN_CENTER);
        hint.setSpacingAfter(48);
        cell.addElement(hint);
        if (notBlank(name)) {
            Paragraph n = new Paragraph(name, s.bodyBold);
            n.setAlignment(Element.ALIGN_CENTER);
            cell.addElement(n);
        }
        if (notBlank(role)) {
            Paragraph r = new Paragraph(role, s.bodyMuted);
            r.setAlignment(Element.ALIGN_CENTER);
            cell.addElement(r);
        }
        return cell;
    }

    private Paragraph sectionHeading(String text, Styles s) {
        Paragraph p = new Paragraph(text, s.heading);
        p.setSpacingBefore(8);
        p.setSpacingAfter(4);
        return p;
    }

    private void addMultiline(Document document, String text, Font font, float spacingAfter) throws DocumentException {
        if (!notBlank(text)) {
            return;
        }
        String[] lines = text.split("\\r?\\n");
        for (int i = 0; i < lines.length; i++) {
            Paragraph p = new Paragraph(lines[i], font);
            p.setLeading(14);
            if (i == lines.length - 1) {
                p.setSpacingAfter(spacingAfter);
            }
            document.add(p);
        }
    }

    private PdfPCell row(String text, Font font, int align, Color bg) {
        PdfPCell c = new PdfPCell(new Phrase(text, font));
        c.setHorizontalAlignment(align);
        c.setVerticalAlignment(Element.ALIGN_MIDDLE);
        c.setBorderColor(BORDER);
        c.setBackgroundColor(bg);
        c.setPadding(4);
        return c;
    }

    private PdfPCell plainCell(String text, Font font, int align) {
        PdfPCell c = new PdfPCell(new Phrase(text, font));
        c.setBorder(Rectangle.NO_BORDER);
        c.setHorizontalAlignment(align);
        c.setPaddingTop(2);
        c.setPaddingBottom(2);
        return c;
    }

    /* =====================================================================
       HELPERS (package-private / static for unit tests)
       ===================================================================== */

    /** Biến thay thế trong intro/terms/footer (BR-11). */
    static Map<String, String> variables(DocumentTemplate t, QuoteDocumentData q, ContractInfo c) {
        Map<String, String> vars = new LinkedHashMap<>();
        vars.put("companyName", safe(t.getCompanyName()));
        vars.put("customerName", q == null ? "" : safe(q.customerName));
        vars.put("quoteNumber", q == null ? "" : safe(q.quoteNumber));
        vars.put("validityDays", String.valueOf(t.getValidityDays()));
        BigDecimal total = q == null ? BigDecimal.ZERO : q.totalAmount;
        vars.put("totalAmount", formatMoney(total) + " " + valueOr(t.getCurrencyUnit(), "đồng"));
        vars.put("totalInWords", VietnameseNumberToWords.toCurrencyWords(total, t.getCurrencyUnit()));
        vars.put("contractNumber", c == null ? "" : safe(c.contractNumber));
        vars.put("signedDate", c == null ? formatDate(LocalDate.now()) : formatDate(c.signedDate));
        vars.put("effectiveDate", c == null ? "" : formatDate(c.effectiveDate));
        vars.put("expiryDate", c == null ? "" : formatDate(c.expiryDate));
        vars.put("paymentTerms", c == null ? "" : safe(c.paymentTerms));
        return vars;
    }

    static String apply(String text, Map<String, String> vars) {
        if (text == null) {
            return null;
        }
        String out = text;
        for (Map.Entry<String, String> e : vars.entrySet()) {
            out = out.replace("{" + e.getKey() + "}", e.getValue());
        }
        return out;
    }

    static String formatMoney(BigDecimal value) {
        DecimalFormatSymbols symbols = new DecimalFormatSymbols();
        symbols.setGroupingSeparator('.');
        symbols.setDecimalSeparator(',');
        DecimalFormat format = new DecimalFormat("#,##0", symbols);
        return format.format((value == null ? BigDecimal.ZERO : value).setScale(0, RoundingMode.HALF_UP));
    }

    static String formatPercent(BigDecimal value) {
        BigDecimal v = value == null ? BigDecimal.ZERO : value.stripTrailingZeros();
        if (v.scale() < 0) {
            v = v.setScale(0);
        }
        return v.toPlainString().replace('.', ',') + "%";
    }

    static String formatDate(LocalDate date) {
        return date == null ? "" : DATE.format(date);
    }

    /** Giải mã logo data URL; lỗi → null để PDF vẫn xuất được (BR-9). */
    static Image decodeLogo(String dataUrl) {
        if (!notBlank(dataUrl)) {
            return null;
        }
        try {
            String base64 = dataUrl.contains(",") ? dataUrl.substring(dataUrl.indexOf(',') + 1) : dataUrl;
            byte[] bytes = Base64.getDecoder().decode(base64.trim());
            return Image.getInstance(bytes);
        } catch (Exception e) {
            return null;
        }
    }

    static Color parseColor(String hex) {
        try {
            if (hex != null && hex.matches("^#[0-9A-Fa-f]{6}$")) {
                return Color.decode(hex);
            }
        } catch (NumberFormatException ignored) {
            // fall through
        }
        return DEFAULT_PRIMARY;
    }

    private static void requireTemplate(DocumentTemplate template) {
        if (template == null) {
            throw new IllegalArgumentException("Chưa cấu hình mẫu tài liệu.");
        }
    }

    private static boolean notBlank(String value) {
        return value != null && !value.isBlank();
    }

    private static String safe(String value) {
        return value == null ? "" : value;
    }

    private static String valueOr(String value, String fallback) {
        return notBlank(value) ? value : fallback;
    }

    private static String joinParts(String... parts) {
        StringBuilder sb = new StringBuilder();
        for (String p : parts) {
            if (!notBlank(p)) {
                continue;
            }
            if (!sb.isEmpty()) {
                sb.append("  |  ");
            }
            sb.append(p);
        }
        return sb.toString();
    }

    private static String joinNonBlank(String a, String b, String separator) {
        if (!notBlank(a)) {
            return safe(b);
        }
        return notBlank(b) ? a + separator + b : a;
    }

    /* =====================================================================
       FONTS & STYLES
       ===================================================================== */

    private static final class Styles {
        final Color primary;
        final Font body;
        final Font bodyBold;
        final Font bodyMuted;
        final Font italic;
        final Font small;
        final Font muted;
        final Font label;
        final Font heading;
        final Font title;
        final Font company;
        final Font tableHead;
        final Font totalLabel;
        final Font totalValue;
        final Font watermark;

        Styles(Color primary) {
            this.primary = primary;
            BaseFont regular = regular();
            BaseFont bold = bold();
            body = new Font(regular, 9.5f, Font.NORMAL, TEXT);
            bodyBold = new Font(bold, 9.5f, Font.NORMAL, TEXT);
            bodyMuted = new Font(regular, 9.5f, Font.NORMAL, MUTED);
            italic = new Font(italic(), 9.5f, Font.NORMAL, TEXT);
            small = new Font(regular, 8f, Font.NORMAL, MUTED);
            muted = new Font(regular, 9.5f, Font.NORMAL, MUTED);
            label = new Font(bold, 9f, Font.NORMAL, primary);
            heading = new Font(bold, 10.5f, Font.NORMAL, primary);
            title = new Font(bold, 18f, Font.NORMAL, primary);
            company = new Font(bold, 13f, Font.NORMAL, primary);
            tableHead = new Font(bold, 8.5f, Font.NORMAL, Color.WHITE);
            totalLabel = new Font(bold, 10.5f, Font.NORMAL, primary);
            totalValue = new Font(bold, 11.5f, Font.NORMAL, primary);
            watermark = new Font(bold, 90f, Font.NORMAL, new Color(0xDC, 0x26, 0x26));
        }
    }

    private static BaseFont regular() {
        if (regularFont == null) {
            regularFont = loadFont("LiberationSans-Regular.ttf", "arial.ttf");
        }
        return regularFont;
    }

    private static BaseFont bold() {
        if (boldFont == null) {
            boldFont = loadFont("LiberationSans-Bold.ttf", "arialbd.ttf");
        }
        return boldFont;
    }

    private static BaseFont italic() {
        if (italicFont == null) {
            italicFont = loadFont("LiberationSans-Italic.ttf", "ariali.ttf");
        }
        return italicFont;
    }

    /**
     * Font Unicode nhúng sẵn (openpdf-fonts-extra) để hiển thị tiếng Việt có dấu trên mọi máy chủ.
     * Dự phòng: font Arial của Windows.
     */
    private static BaseFont loadFont(String bundled, String windowsFallback) {
        try (InputStream in = PdfDocumentRenderer.class.getClassLoader()
                .getResourceAsStream("liberation/" + bundled)) {
            if (in != null) {
                return BaseFont.createFont(bundled, BaseFont.IDENTITY_H, BaseFont.EMBEDDED, true,
                        in.readAllBytes(), null);
            }
            Path fallback = Path.of(System.getenv().getOrDefault("WINDIR", "C:\\Windows"), "Fonts", windowsFallback);
            if (Files.exists(fallback)) {
                return BaseFont.createFont(fallback.toString(), BaseFont.IDENTITY_H, BaseFont.EMBEDDED);
            }
            throw new IllegalStateException("Không tìm thấy font Unicode cho PDF: " + bundled);
        } catch (DocumentException | IOException e) {
            throw new IllegalStateException("Không tải được font PDF: " + bundled, e);
        }
    }
}
