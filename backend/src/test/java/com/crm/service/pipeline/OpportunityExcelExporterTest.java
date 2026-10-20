package com.crm.service.pipeline;

import com.crm.dto.pipeline.OpportunityExportFilter;
import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.CellType;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.junit.jupiter.api.Test;

import java.io.ByteArrayInputStream;
import java.math.BigDecimal;
import java.sql.Date;
import java.sql.Timestamp;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

/** SCRUM-108: Kiểm thử dựng file Excel danh sách cơ hội. */
class OpportunityExcelExporterTest {

    private final OpportunityExcelExporter exporter = new OpportunityExcelExporter();

    private static Map<String, Object> opp(long id, String name, String amount, String cost) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", id);
        m.put("name", name);
        m.put("customerName", "Công ty ABC");
        m.put("contactName", "Nguyễn Văn A");
        m.put("amount", new BigDecimal(amount));
        m.put("stageName", "Thương lượng");
        m.put("probability", 75);
        m.put("expectedCloseDate", Date.valueOf("2026-12-31"));
        m.put("status", "OPEN");
        m.put("ownerName", "Trưởng nhóm");
        m.put("competitorName", null);
        m.put("createdAt", Timestamp.valueOf("2026-10-01 09:30:00"));
        if (cost != null) m.put("costAmount", new BigDecimal(cost));
        return m;
    }

    private static Map<String, String> customFields() {
        Map<String, String> cf = new LinkedHashMap<>();
        cf.put("nguon", "Nguồn cơ hội");
        cf.put("khu_vuc", "Khu vực");
        return cf;
    }

    private Workbook build(boolean includeCost) throws Exception {
        List<Map<String, Object>> rows = List.of(
                opp(10, "Triển khai CRM", "100000000", includeCost ? "60000000" : null),
                opp(11, "Gia hạn license", "50000000", null)
        );
        Map<Long, Map<String, String>> cfValues = Map.of(
                10L, Map.of("nguon", "Website", "khu_vuc", "Miền Bắc"),
                11L, Map.of("khu_vuc", "Miền Nam")
        );
        OpportunityExportFilter filter = new OpportunityExportFilter("crm", true, null, "open", Map.of("nguon", "Web"));
        byte[] bytes = exporter.export(new OpportunityExcelExporter.ExportData(
                rows, customFields(), cfValues, includeCost, filter.describe(),
                "Trưởng nhóm (lead@crm.local)", LocalDateTime.of(2026, 10, 20, 22, 0), false));
        assertTrue(bytes.length > 0);
        return new XSSFWorkbook(new ByteArrayInputStream(bytes));
    }

    private static List<String> headerRow(Sheet sheet) {
        List<String> headers = new ArrayList<>();
        for (Cell c : sheet.getRow(0)) headers.add(c.getStringCellValue());
        return headers;
    }

    private static int col(List<String> headers, String name) {
        int idx = headers.indexOf(name);
        assertTrue(idx >= 0, "Thiếu cột: " + name + " trong " + headers);
        return idx;
    }

    @Test
    void includesCostAndMarginWhenPermitted() throws Exception {
        try (Workbook wb = build(true)) {
            Sheet sheet = wb.getSheet(OpportunityExcelExporter.SHEET_DATA);
            assertNotNull(sheet);
            List<String> headers = headerRow(sheet);

            int cost = col(headers, OpportunityExcelExporter.HEADER_COST);
            int margin = col(headers, OpportunityExcelExporter.HEADER_MARGIN);
            int pct = col(headers, OpportunityExcelExporter.HEADER_MARGIN_PCT);

            Row first = sheet.getRow(1);
            assertEquals(60_000_000d, first.getCell(cost).getNumericCellValue(), 0.01);
            assertEquals(40_000_000d, first.getCell(margin).getNumericCellValue(), 0.01);
            assertEquals(0.4d, first.getCell(pct).getNumericCellValue(), 0.0001);

            // Cơ hội không có báo giá → giá vốn/biên LN để trống
            Row second = sheet.getRow(2);
            assertEquals(CellType.BLANK, second.getCell(cost).getCellType());
            assertEquals(CellType.BLANK, second.getCell(margin).getCellType());
        }
    }

    @Test
    void omitsCostAndMarginEverywhereWhenNotPermitted() throws Exception {
        try (Workbook wb = build(false)) {
            Sheet sheet = wb.getSheet(OpportunityExcelExporter.SHEET_DATA);
            List<String> headers = headerRow(sheet);
            assertFalse(headers.contains(OpportunityExcelExporter.HEADER_COST));
            assertFalse(headers.contains(OpportunityExcelExporter.HEADER_MARGIN));
            assertFalse(headers.contains(OpportunityExcelExporter.HEADER_MARGIN_PCT));

            // Không có giá trị 60.000.000 (giá vốn) nằm ở bất kỳ ô nào
            for (Row row : sheet) {
                for (Cell cell : row) {
                    if (cell.getCellType() == CellType.NUMERIC) {
                        assertNotEquals(60_000_000d, cell.getNumericCellValue(), 0.01);
                    }
                }
            }

            Sheet info = wb.getSheet(OpportunityExcelExporter.SHEET_INFO);
            assertTrue(sheetText(info).contains("không được xuất do bạn không có quyền xem giá vốn"));
        }
    }

    @Test
    void exportsCustomFieldColumnsWithLabelsAndValues() throws Exception {
        try (Workbook wb = build(false)) {
            Sheet sheet = wb.getSheet(OpportunityExcelExporter.SHEET_DATA);
            List<String> headers = headerRow(sheet);
            int source = col(headers, "Nguồn cơ hội");
            int region = col(headers, "Khu vực");

            assertEquals("Website", sheet.getRow(1).getCell(source).getStringCellValue());
            assertEquals("Miền Bắc", sheet.getRow(1).getCell(region).getStringCellValue());
            assertEquals(CellType.BLANK, sheet.getRow(2).getCell(source).getCellType());
            assertEquals("Miền Nam", sheet.getRow(2).getCell(region).getStringCellValue());
        }
    }

    @Test
    void writesBaseColumnsStatusLabelAndTotalRow() throws Exception {
        try (Workbook wb = build(true)) {
            Sheet sheet = wb.getSheet(OpportunityExcelExporter.SHEET_DATA);
            List<String> headers = headerRow(sheet);
            Row first = sheet.getRow(1);
            assertEquals("Triển khai CRM", first.getCell(col(headers, "Tên cơ hội")).getStringCellValue());
            assertEquals("Đang mở", first.getCell(col(headers, "Trạng thái")).getStringCellValue());
            assertEquals(100_000_000d, first.getCell(col(headers, "Giá trị (VND)")).getNumericCellValue(), 0.01);

            Row total = sheet.getRow(3);
            assertEquals("SUM(H2:H3)", total.getCell(col(headers, "Giá trị (VND)")).getCellFormula());
            assertEquals(1, sheet.getPaneInformation().getHorizontalSplitPosition());
        }
    }

    @Test
    void infoSheetDescribesAppliedFilters() throws Exception {
        try (Workbook wb = build(true)) {
            String text = sheetText(wb.getSheet(OpportunityExcelExporter.SHEET_INFO));
            assertTrue(text.contains("Trưởng nhóm (lead@crm.local)"));
            assertTrue(text.contains("20/10/2026 22:00:00"));
            assertTrue(text.contains("crm"));
            assertTrue(text.contains("Chỉ của tôi"));
            assertTrue(text.contains("OPEN"));
            assertTrue(text.contains("Trường tuỳ chỉnh: nguon"));
            assertFalse(text.contains("không có quyền xem giá vốn"));
        }
    }

    @Test
    void headersHelperMatchesPermission() {
        assertFalse(exporter.headers(customFields(), false).contains(OpportunityExcelExporter.HEADER_COST));
        assertTrue(exporter.headers(customFields(), true).contains(OpportunityExcelExporter.HEADER_COST));
        assertEquals("Khu vực", exporter.headers(customFields(), false).get(exporter.headers(customFields(), false).size() - 1));
    }

    private static String sheetText(Sheet sheet) {
        StringBuilder sb = new StringBuilder();
        for (Row row : sheet) {
            for (Cell cell : row) {
                if (cell.getCellType() == CellType.STRING) sb.append(cell.getStringCellValue()).append('\n');
            }
        }
        return sb.toString();
    }
}
