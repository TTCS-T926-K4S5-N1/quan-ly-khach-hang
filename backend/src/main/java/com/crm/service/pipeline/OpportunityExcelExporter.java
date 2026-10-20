package com.crm.service.pipeline;

import org.apache.poi.ss.usermodel.BorderStyle;
import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.CellStyle;
import org.apache.poi.ss.usermodel.CreationHelper;
import org.apache.poi.ss.usermodel.FillPatternType;
import org.apache.poi.ss.usermodel.Font;
import org.apache.poi.ss.usermodel.IndexedColors;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.VerticalAlignment;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.ss.util.CellRangeAddress;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;

/**
 * SCRUM-108: Dựng file Excel danh sách cơ hội.
 * Lớp thuần POI, không truy cập DB → kiểm thử đơn vị được.
 * Cột giá vốn / biên lợi nhuận chỉ được tạo khi {@code includeCost = true}.
 */
public class OpportunityExcelExporter {

    public static final String SHEET_DATA = "Cơ hội";
    public static final String SHEET_INFO = "Thông tin xuất";
    public static final String HEADER_COST = "Giá vốn (VND)";
    public static final String HEADER_MARGIN = "Biên lợi nhuận (VND)";
    public static final String HEADER_MARGIN_PCT = "% Biên LN";

    private static final DateTimeFormatter INFO_TIME = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm:ss");

    /** Dữ liệu đầu vào cho exporter. */
    public record ExportData(
            List<Map<String, Object>> rows,
            Map<String, String> customFields,
            Map<Long, Map<String, String>> customFieldValues,
            boolean includeCost,
            Map<String, String> filterDescription,
            String exportedBy,
            LocalDateTime exportedAt,
            boolean truncated
    ) {
        public ExportData {
            rows = rows == null ? List.of() : rows;
            customFields = customFields == null ? Map.of() : customFields;
            customFieldValues = customFieldValues == null ? Map.of() : customFieldValues;
            filterDescription = filterDescription == null ? Map.of() : filterDescription;
            exportedAt = exportedAt == null ? LocalDateTime.now() : exportedAt;
        }
    }

    private enum Kind { TEXT, INTEGER, MONEY, PERCENT, DATE, DATETIME }

    private record Column(String header, Kind kind, int width) { }

    public byte[] export(ExportData data) throws IOException {
        try (Workbook wb = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Styles styles = new Styles(wb);
            writeDataSheet(wb, styles, data);
            writeInfoSheet(wb, styles, data);
            wb.write(out);
            return out.toByteArray();
        }
    }

    /** Danh sách header theo đúng thứ tự (dùng cho test & FE). */
    public List<String> headers(Map<String, String> customFields, boolean includeCost) {
        List<String> headers = new ArrayList<>();
        for (Column c : columns(customFields, includeCost)) headers.add(c.header());
        return Collections.unmodifiableList(headers);
    }

    private List<Column> columns(Map<String, String> customFields, boolean includeCost) {
        List<Column> cols = new ArrayList<>(List.of(
                new Column("STT", Kind.INTEGER, 6),
                new Column("Mã", Kind.INTEGER, 8),
                new Column("Tên cơ hội", Kind.TEXT, 36),
                new Column("Khách hàng", Kind.TEXT, 30),
                new Column("Người liên hệ", Kind.TEXT, 22),
                new Column("Giai đoạn", Kind.TEXT, 24),
                new Column("Trạng thái", Kind.TEXT, 12),
                new Column("Giá trị (VND)", Kind.MONEY, 18),
                new Column("Xác suất (%)", Kind.INTEGER, 12),
                new Column("Ngày dự kiến chốt", Kind.DATE, 16),
                new Column("Người phụ trách", Kind.TEXT, 22),
                new Column("Đối thủ", Kind.TEXT, 20),
                new Column("Ngày tạo", Kind.DATETIME, 18)
        ));
        if (includeCost) {
            cols.add(new Column(HEADER_COST, Kind.MONEY, 18));
            cols.add(new Column(HEADER_MARGIN, Kind.MONEY, 20));
            cols.add(new Column(HEADER_MARGIN_PCT, Kind.PERCENT, 11));
        }
        customFields.forEach((key, label) ->
                cols.add(new Column(label == null || label.isBlank() ? key : label, Kind.TEXT, 20)));
        return cols;
    }

    private void writeDataSheet(Workbook wb, Styles styles, ExportData data) {
        Sheet sheet = wb.createSheet(SHEET_DATA);
        List<Column> cols = columns(data.customFields(), data.includeCost());

        Row header = sheet.createRow(0);
        header.setHeightInPoints(22);
        for (int i = 0; i < cols.size(); i++) {
            Cell cell = header.createCell(i);
            cell.setCellValue(cols.get(i).header());
            cell.setCellStyle(styles.header);
            sheet.setColumnWidth(i, cols.get(i).width() * 256);
        }

        int rowIndex = 1;
        for (Map<String, Object> rec : data.rows()) {
            Row row = sheet.createRow(rowIndex);
            List<Object> values = rowValues(rowIndex, rec, data);
            for (int i = 0; i < cols.size(); i++) {
                writeCell(row.createCell(i), cols.get(i).kind(), values.get(i), styles);
            }
            rowIndex++;
        }

        if (!data.rows().isEmpty()) {
            Row total = sheet.createRow(rowIndex);
            Cell label = total.createCell(2);
            label.setCellValue("Tổng cộng (" + data.rows().size() + " cơ hội)");
            label.setCellStyle(styles.totalLabel);
            writeSumFormula(total, 7, rowIndex, styles);
            if (data.includeCost()) {
                writeSumFormula(total, 13, rowIndex, styles);
                writeSumFormula(total, 14, rowIndex, styles);
            }
        }

        sheet.createFreezePane(0, 1);
        sheet.setAutoFilter(new CellRangeAddress(0, Math.max(0, rowIndex - 1), 0, cols.size() - 1));
    }

    private void writeSumFormula(Row total, int col, int lastDataRowExclusive, Styles styles) {
        Cell cell = total.createCell(col);
        String letter = org.apache.poi.ss.util.CellReference.convertNumToColString(col);
        cell.setCellFormula("SUM(" + letter + "2:" + letter + lastDataRowExclusive + ")");
        cell.setCellStyle(styles.totalMoney);
    }

    private List<Object> rowValues(int stt, Map<String, Object> rec, ExportData data) {
        List<Object> v = new ArrayList<>();
        v.add(stt);
        v.add(rec.get("id"));
        v.add(rec.get("name"));
        v.add(rec.get("customerName"));
        v.add(rec.get("contactName"));
        v.add(rec.get("stageName"));
        v.add(statusLabel(rec.get("status")));
        BigDecimal amount = toDecimal(rec.get("amount"));
        v.add(amount);
        v.add(rec.get("probability"));
        v.add(rec.get("expectedCloseDate"));
        v.add(rec.get("ownerName"));
        v.add(rec.get("competitorName"));
        v.add(rec.get("createdAt"));
        if (data.includeCost()) {
            BigDecimal cost = toDecimal(rec.get("costAmount"));
            BigDecimal margin = cost == null || amount == null ? null : amount.subtract(cost);
            BigDecimal pct = margin == null || amount.signum() == 0
                    ? null
                    : margin.divide(amount, 6, RoundingMode.HALF_UP);
            v.add(cost);
            v.add(margin);
            v.add(pct);
        }
        Object idObj = rec.get("id");
        Map<String, String> cfValues = idObj instanceof Number n
                ? data.customFieldValues().getOrDefault(n.longValue(), Map.of())
                : Map.of();
        for (String key : data.customFields().keySet()) {
            v.add(cfValues.get(key));
        }
        return v;
    }

    private void writeCell(Cell cell, Kind kind, Object value, Styles styles) {
        if (value == null) {
            cell.setBlank();
            cell.setCellStyle(styles.text);
            return;
        }
        switch (kind) {
            case MONEY -> {
                BigDecimal d = toDecimal(value);
                if (d == null) { cell.setBlank(); } else { cell.setCellValue(d.doubleValue()); }
                cell.setCellStyle(styles.money);
            }
            case PERCENT -> {
                BigDecimal d = toDecimal(value);
                if (d == null) { cell.setBlank(); } else { cell.setCellValue(d.doubleValue()); }
                cell.setCellStyle(styles.percent);
            }
            case INTEGER -> {
                if (value instanceof Number n) cell.setCellValue(n.longValue());
                else cell.setCellValue(String.valueOf(value));
                cell.setCellStyle(styles.integer);
            }
            case DATE, DATETIME -> {
                if (value instanceof java.util.Date d) {
                    cell.setCellValue(d);
                } else if (value instanceof java.time.LocalDate ld) {
                    cell.setCellValue(ld);
                } else if (value instanceof LocalDateTime ldt) {
                    cell.setCellValue(ldt);
                } else {
                    cell.setCellValue(String.valueOf(value));
                }
                cell.setCellStyle(kind == Kind.DATE ? styles.date : styles.dateTime);
            }
            default -> {
                cell.setCellValue(String.valueOf(value));
                cell.setCellStyle(styles.text);
            }
        }
    }

    private void writeInfoSheet(Workbook wb, Styles styles, ExportData data) {
        Sheet sheet = wb.createSheet(SHEET_INFO);
        sheet.setColumnWidth(0, 32 * 256);
        sheet.setColumnWidth(1, 70 * 256);

        int r = 0;
        Row title = sheet.createRow(r++);
        Cell t = title.createCell(0);
        t.setCellValue("BÁO CÁO DANH SÁCH CƠ HỘI BÁN HÀNG");
        t.setCellStyle(styles.title);

        r++;
        r = infoRow(sheet, r, "Người xuất", data.exportedBy() == null ? "" : data.exportedBy(), styles);
        r = infoRow(sheet, r, "Thời điểm xuất", INFO_TIME.format(data.exportedAt()), styles);
        r = infoRow(sheet, r, "Tổng số cơ hội", String.valueOf(data.rows().size()), styles);
        if (data.truncated()) {
            r = infoRow(sheet, r, "Lưu ý", "Kết quả đã bị giới hạn số dòng tối đa. Hãy thu hẹp bộ lọc để xuất đầy đủ.", styles);
        }
        if (!data.includeCost()) {
            r = infoRow(sheet, r, "Cột bị ẩn", "Giá vốn và biên lợi nhuận không được xuất do bạn không có quyền xem giá vốn.", styles);
        }

        r++;
        Row fh = sheet.createRow(r++);
        Cell fhc = fh.createCell(0);
        fhc.setCellValue("Bộ lọc đã áp dụng");
        fhc.setCellStyle(styles.header);
        Cell fhv = fh.createCell(1);
        fhv.setCellValue("Giá trị");
        fhv.setCellStyle(styles.header);
        for (Map.Entry<String, String> e : data.filterDescription().entrySet()) {
            r = infoRow(sheet, r, e.getKey(), e.getValue(), styles);
        }
    }

    private int infoRow(Sheet sheet, int r, String label, String value, Styles styles) {
        Row row = sheet.createRow(r);
        Cell l = row.createCell(0);
        l.setCellValue(label);
        l.setCellStyle(styles.infoLabel);
        Cell v = row.createCell(1);
        v.setCellValue(value);
        v.setCellStyle(styles.text);
        return r + 1;
    }

    static String statusLabel(Object status) {
        if (status == null) return null;
        return switch (String.valueOf(status).toUpperCase()) {
            case "OPEN" -> "Đang mở";
            case "WON" -> "Thắng";
            case "LOST" -> "Thua";
            default -> String.valueOf(status);
        };
    }

    private static BigDecimal toDecimal(Object value) {
        if (value == null) return null;
        if (value instanceof BigDecimal b) return b;
        if (value instanceof Number n) return new BigDecimal(n.toString());
        try {
            return new BigDecimal(String.valueOf(value).trim());
        } catch (NumberFormatException e) {
            return null;
        }
    }

    /** Bộ style dùng chung cho workbook. */
    private static final class Styles {
        final CellStyle header;
        final CellStyle text;
        final CellStyle integer;
        final CellStyle money;
        final CellStyle percent;
        final CellStyle date;
        final CellStyle dateTime;
        final CellStyle totalLabel;
        final CellStyle totalMoney;
        final CellStyle title;
        final CellStyle infoLabel;

        Styles(Workbook wb) {
            CreationHelper helper = wb.getCreationHelper();

            Font headerFont = wb.createFont();
            headerFont.setBold(true);
            headerFont.setColor(IndexedColors.WHITE.getIndex());

            header = wb.createCellStyle();
            header.setFont(headerFont);
            header.setFillForegroundColor(IndexedColors.DARK_TEAL.getIndex());
            header.setFillPattern(FillPatternType.SOLID_FOREGROUND);
            header.setVerticalAlignment(VerticalAlignment.CENTER);
            header.setWrapText(true);
            bordered(header);

            text = bordered(wb.createCellStyle());
            integer = bordered(wb.createCellStyle());
            integer.setDataFormat(helper.createDataFormat().getFormat("0"));
            money = bordered(wb.createCellStyle());
            money.setDataFormat(helper.createDataFormat().getFormat("#,##0"));
            percent = bordered(wb.createCellStyle());
            percent.setDataFormat(helper.createDataFormat().getFormat("0.0%"));
            date = bordered(wb.createCellStyle());
            date.setDataFormat(helper.createDataFormat().getFormat("dd/MM/yyyy"));
            dateTime = bordered(wb.createCellStyle());
            dateTime.setDataFormat(helper.createDataFormat().getFormat("dd/MM/yyyy HH:mm"));

            Font bold = wb.createFont();
            bold.setBold(true);
            totalLabel = wb.createCellStyle();
            totalLabel.setFont(bold);
            totalMoney = wb.createCellStyle();
            totalMoney.setFont(bold);
            totalMoney.setDataFormat(helper.createDataFormat().getFormat("#,##0"));

            Font titleFont = wb.createFont();
            titleFont.setBold(true);
            titleFont.setFontHeightInPoints((short) 14);
            title = wb.createCellStyle();
            title.setFont(titleFont);

            infoLabel = bordered(wb.createCellStyle());
            infoLabel.setFont(bold);
        }

        private static CellStyle bordered(CellStyle style) {
            style.setBorderBottom(BorderStyle.THIN);
            style.setBorderTop(BorderStyle.THIN);
            style.setBorderLeft(BorderStyle.THIN);
            style.setBorderRight(BorderStyle.THIN);
            return style;
        }
    }
}
