package com.crm.service.export;

import jakarta.servlet.http.HttpServletResponse;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFCellStyle;
import org.apache.poi.xssf.usermodel.XSSFColor;
import org.apache.poi.xssf.usermodel.XSSFFont;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;

import java.io.IOException;
import java.io.OutputStream;
import java.math.BigDecimal;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;

public class ExcelExportService {

    private static final byte[] COLOR_PRIMARY = new byte[]{(byte) 30, (byte) 58, (byte) 138}; // #1E3A8A
    private static final byte[] COLOR_ZEBRA = new byte[]{(byte) 248, (byte) 250, (byte) 252}; // #F8FAFC
    private static final byte[] COLOR_BORDER = new byte[]{(byte) 226, (byte) 232, (byte) 240}; // #E2E8F0

    /**
     * Xuất danh sách khách hàng ra file Excel .xlsx bao gồm các trường tùy chỉnh.
     */
    public void exportCustomers(
            HttpServletResponse response,
            List<Map<String, Object>> customers,
            List<Map<String, Object>> customFields,
            Map<Long, Map<String, Object>> customValues
    ) throws IOException {
        String timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss"));
        String filename = "Danh_sach_khach_hang_" + timestamp + ".xlsx";

        response.setContentType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
        String encodedFilename = URLEncoder.encode(filename, StandardCharsets.UTF_8).replaceAll("\\+", "%20");
        response.setHeader("Content-Disposition", "attachment; filename=\"" + filename + "\"; filename*=UTF-8''" + encodedFilename);

        try (XSSFWorkbook workbook = new XSSFWorkbook()) {
            Sheet sheet = workbook.createSheet("Khách hàng");
            sheet.setDisplayGridlines(true);

            CellStyle headerStyle = createHeaderStyle(workbook);
            CellStyle dataStyle = createDataStyle(workbook, false);
            CellStyle zebraStyle = createDataStyle(workbook, true);
            CellStyle numberStyle = createNumberStyle(workbook, false);
            CellStyle numberZebraStyle = createNumberStyle(workbook, true);

            // 1. Dòng tiêu đề lớn
            Row titleRow = sheet.createRow(0);
            Cell titleCell = titleRow.createCell(0);
            titleCell.setCellValue("DANH SÁCH KHÁCH HÀNG & ĐỐI TÁC");
            CellStyle titleStyle = workbook.createCellStyle();
            XSSFFont titleFont = workbook.createFont();
            titleFont.setFontName("Segoe UI");
            titleFont.setFontHeightInPoints((short) 16);
            titleFont.setBold(true);
            titleFont.setColor(new XSSFColor(COLOR_PRIMARY, null));
            titleStyle.setFont(titleFont);
            titleCell.setCellStyle(titleStyle);

            Row infoRow = sheet.createRow(1);
            Cell infoCell = infoRow.createCell(0);
            infoCell.setCellValue("Thời gian xuất: " + LocalDateTime.now().format(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm:ss"))
                    + " | Tổng số bản ghi: " + customers.size());

            // 2. Định nghĩa các cột chuẩn
            List<String> headers = new ArrayList<>();
            headers.add("STT");
            headers.add("Mã KH");
            headers.add("Tên công ty / Khách hàng");
            headers.add("Mã số thuế");
            headers.add("Trạng thái");
            headers.add("Email");
            headers.add("Số điện thoại");
            headers.add("Website");
            headers.add("Ngành nghề");
            headers.add("Quy mô");
            headers.add("Khu vực");
            headers.add("Địa chỉ");
            headers.add("Người phụ trách");
            headers.add("Người liên hệ chính");
            headers.add("SĐT liên hệ");

            // Thêm các cột trường tùy chỉnh
            List<String> customKeys = new ArrayList<>();
            for (Map<String, Object> cf : customFields) {
                String label = (String) cf.get("label");
                String key = (String) cf.get("key");
                headers.add(label != null ? label : key);
                customKeys.add(key);
            }

            // Ghi dòng Header (Row 3)
            Row headerRow = sheet.createRow(3);
            headerRow.setHeightInPoints(28);
            for (int i = 0; i < headers.size(); i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(headers.get(i));
                cell.setCellStyle(headerStyle);
            }

            // 3. Ghi dữ liệu từng dòng
            int rowIdx = 4;
            int stt = 1;
            for (Map<String, Object> cust : customers) {
                Row row = sheet.createRow(rowIdx++);
                row.setHeightInPoints(22);
                boolean isZebra = (stt % 2 == 0);
                CellStyle currentStyle = isZebra ? zebraStyle : dataStyle;

                int col = 0;
                // STT
                createCell(row, col++, String.valueOf(stt), currentStyle);

                // Mã KH
                Object idObj = cust.get("id");
                long custId = idObj instanceof Number ? ((Number) idObj).longValue() : 0;
                createCell(row, col++, String.valueOf(custId), currentStyle);

                // Tên công ty
                createCell(row, col++, valStr(cust.get("name") != null ? cust.get("name") : cust.get("companyName")), currentStyle);

                // Mã số thuế
                createCell(row, col++, valStr(cust.get("taxCode")), currentStyle);

                // Trạng thái
                createCell(row, col++, valStr(cust.get("status")), currentStyle);

                // Email
                createCell(row, col++, valStr(cust.get("email")), currentStyle);

                // SĐT
                createCell(row, col++, valStr(cust.get("phone")), currentStyle);

                // Website
                createCell(row, col++, valStr(cust.get("website")), currentStyle);

                // Ngành nghề
                createCell(row, col++, valStr(cust.get("industryName") != null ? cust.get("industryName") : cust.get("industry")), currentStyle);

                // Quy mô
                createCell(row, col++, valStr(cust.get("companySizeName") != null ? cust.get("companySizeName") : cust.get("companySize")), currentStyle);

                // Khu vực
                createCell(row, col++, valStr(cust.get("regionName")), currentStyle);

                // Địa chỉ
                createCell(row, col++, valStr(cust.get("address")), currentStyle);

                // Người phụ trách
                createCell(row, col++, valStr(cust.get("ownerName") != null ? cust.get("ownerName") : cust.get("owner")), currentStyle);

                // Người liên hệ chính
                createCell(row, col++, valStr(cust.get("primaryContactName")), currentStyle);

                // SĐT liên hệ
                createCell(row, col++, valStr(cust.get("primaryContactPhone")), currentStyle);

                // Ghi giá trị các trường tùy chỉnh
                Map<String, Object> custCustomVals = customValues != null ? customValues.get(custId) : null;
                for (String key : customKeys) {
                    Object val = custCustomVals != null ? custCustomVals.get(key) : null;
                    createCell(row, col++, val != null ? String.valueOf(val) : "", currentStyle);
                }

                stt++;
            }

            // Tự động căn chỉnh độ rộng cột
            for (int i = 0; i < headers.size(); i++) {
                sheet.autoSizeColumn(i);
                int currentWidth = sheet.getColumnWidth(i);
                sheet.setColumnWidth(i, Math.max(currentWidth + 1000, 3200));
            }

            try (OutputStream out = response.getOutputStream()) {
                workbook.write(out);
                out.flush();
            }
        }
    }

    /**
     * Xuất danh sách cơ hội bán hàng ra file Excel .xlsx bao gồm các trường tùy chỉnh.
     */
    public void exportOpportunities(
            HttpServletResponse response,
            List<Map<String, Object>> opportunities,
            List<Map<String, Object>> customFields,
            Map<Long, Map<String, Object>> customValues
    ) throws IOException {
        exportOpportunities(response, opportunities, customFields, customValues, true);
    }

    /**
     * Xuất danh sách cơ hội bán hàng ra file Excel .xlsx bao gồm các trường tùy chỉnh và phân quyền Giá vốn/Biên lợi nhuận.
     */
    public void exportOpportunities(
            HttpServletResponse response,
            List<Map<String, Object>> opportunities,
            List<Map<String, Object>> customFields,
            Map<Long, Map<String, Object>> customValues,
            boolean canViewCost
    ) throws IOException {
        String timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss"));
        String filename = "Danh_sach_co_hoi_" + timestamp + ".xlsx";

        response.setContentType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
        String encodedFilename = URLEncoder.encode(filename, StandardCharsets.UTF_8).replaceAll("\\+", "%20");
        response.setHeader("Content-Disposition", "attachment; filename=\"" + filename + "\"; filename*=UTF-8''" + encodedFilename);

        try (XSSFWorkbook workbook = new XSSFWorkbook()) {
            Sheet sheet = workbook.createSheet("Cơ hội");
            sheet.setDisplayGridlines(true);

            CellStyle headerStyle = createHeaderStyle(workbook);
            CellStyle dataStyle = createDataStyle(workbook, false);
            CellStyle zebraStyle = createDataStyle(workbook, true);
            CellStyle numberStyle = createNumberStyle(workbook, false);
            CellStyle numberZebraStyle = createNumberStyle(workbook, true);

            // Tiêu đề
            Row titleRow = sheet.createRow(0);
            Cell titleCell = titleRow.createCell(0);
            titleCell.setCellValue("DANH SÁCH CƠ HỘI BÁN HÀNG (OPPORTUNITIES)");
            CellStyle titleStyle = workbook.createCellStyle();
            XSSFFont titleFont = workbook.createFont();
            titleFont.setFontName("Segoe UI");
            titleFont.setFontHeightInPoints((short) 16);
            titleFont.setBold(true);
            titleFont.setColor(new XSSFColor(COLOR_PRIMARY, null));
            titleStyle.setFont(titleFont);
            titleCell.setCellStyle(titleStyle);

            Row infoRow = sheet.createRow(1);
            Cell infoCell = infoRow.createCell(0);
            infoCell.setCellValue("Thời gian xuất: " + LocalDateTime.now().format(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm:ss"))
                    + " | Tổng số bản ghi: " + opportunities.size()
                    + (canViewCost ? " | Quyền: Đầy đủ (Bao gồm Giá vốn & Biên lợi nhuận)" : " | Quyền: Giới hạn (Không hiển thị Giá vốn & Biên lợi nhuận)"));

            // Header columns
            List<String> headers = new ArrayList<>();
            headers.add("STT");
            headers.add("Mã cơ hội");
            headers.add("Tên cơ hội");
            headers.add("Khách hàng");
            headers.add("Giai đoạn");
            headers.add("Xác suất (%)");
            headers.add("Giá trị (VNĐ)");
            if (canViewCost) {
                headers.add("Giá vốn (VNĐ)");
                headers.add("Biên lợi nhuận (%)");
            }
            headers.add("Ngày dự kiến chốt");
            headers.add("Trạng thái");
            headers.add("Người phụ trách");

            List<String> customKeys = new ArrayList<>();
            for (Map<String, Object> cf : customFields) {
                String label = (String) cf.get("label");
                String key = (String) cf.get("key");
                headers.add(label != null ? label : key);
                customKeys.add(key);
            }

            Row headerRow = sheet.createRow(3);
            headerRow.setHeightInPoints(28);
            for (int i = 0; i < headers.size(); i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(headers.get(i));
                cell.setCellStyle(headerStyle);
            }

            int rowIdx = 4;
            int stt = 1;
            for (Map<String, Object> opp : opportunities) {
                Row row = sheet.createRow(rowIdx++);
                row.setHeightInPoints(22);
                boolean isZebra = (stt % 2 == 0);
                CellStyle currentStyle = isZebra ? zebraStyle : dataStyle;
                CellStyle currNumStyle = isZebra ? numberZebraStyle : numberStyle;

                int col = 0;
                createCell(row, col++, String.valueOf(stt), currentStyle);

                Object idObj = opp.get("id");
                long oppId = idObj instanceof Number ? ((Number) idObj).longValue() : 0;
                createCell(row, col++, String.valueOf(oppId), currentStyle);

                createCell(row, col++, valStr(opp.get("name")), currentStyle);
                createCell(row, col++, valStr(opp.get("customerName")), currentStyle);
                createCell(row, col++, valStr(opp.get("stageName")), currentStyle);

                // Xác suất
                Object probObj = opp.get("probability");
                createCell(row, col++, probObj != null ? String.valueOf(probObj) : "0", currentStyle);

                // Giá trị (VNĐ)
                Object amountObj = opp.get("amount");
                double amt = 0;
                if (amountObj instanceof Number) {
                    amt = ((Number) amountObj).doubleValue();
                } else if (amountObj != null) {
                    try { amt = Double.parseDouble(String.valueOf(amountObj)); } catch (Exception ignored) {}
                }
                Cell numCell = row.createCell(col++);
                numCell.setCellValue(amt);
                numCell.setCellStyle(currNumStyle);

                if (canViewCost) {
                    // Giá vốn (VNĐ)
                    Object costObj = opp.get("totalCost");
                    double cost = 0;
                    if (costObj instanceof Number) {
                        cost = ((Number) costObj).doubleValue();
                    } else if (costObj != null) {
                        try { cost = Double.parseDouble(String.valueOf(costObj)); } catch (Exception ignored) {}
                    }
                    Cell costCell = row.createCell(col++);
                    costCell.setCellValue(cost);
                    costCell.setCellStyle(currNumStyle);

                    // Biên lợi nhuận (%)
                    Object marginObj = opp.get("profitMargin");
                    double margin = 0;
                    if (marginObj instanceof Number) {
                        margin = ((Number) marginObj).doubleValue();
                    } else if (marginObj != null) {
                        try { margin = Double.parseDouble(String.valueOf(marginObj)); } catch (Exception ignored) {}
                    }
                    Cell marginCell = row.createCell(col++);
                    marginCell.setCellValue(margin);
                    marginCell.setCellStyle(currNumStyle);
                }

                // Ngày dự kiến chốt
                createCell(row, col++, valStr(opp.get("expectedCloseDate")), currentStyle);

                // Trạng thái
                createCell(row, col++, valStr(opp.get("status")), currentStyle);

                // Người phụ trách
                createCell(row, col++, valStr(opp.get("ownerName")), currentStyle);

                // Custom fields
                Map<String, Object> oppCustomVals = customValues != null ? customValues.get(oppId) : null;
                for (String key : customKeys) {
                    Object val = oppCustomVals != null ? oppCustomVals.get(key) : null;
                    createCell(row, col++, val != null ? String.valueOf(val) : "", currentStyle);
                }

                stt++;
            }

            for (int i = 0; i < headers.size(); i++) {
                sheet.autoSizeColumn(i);
                int currentWidth = sheet.getColumnWidth(i);
                sheet.setColumnWidth(i, Math.max(currentWidth + 1000, 3200));
            }

            try (OutputStream out = response.getOutputStream()) {
                workbook.write(out);
                out.flush();
            }
        }
    }

    /**
     * Xuất Báo cáo Hiệu quả Nguồn Lead & Chiến dịch Marketing ra file Excel .xlsx (Story 6).
     */
    public void exportLeadSourcePerformance(
            HttpServletResponse response,
            List<com.crm.dto.reports.LeadSourceReportDTO> sources,
            List<com.crm.dto.reports.CampaignPerformanceReportDTO> campaigns,
            Map<String, Object> kpis,
            String dateRangeLabel
    ) throws IOException {
        String timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss"));
        String filename = "Bao_Cao_Hieu_Qua_Nguon_Lead_" + timestamp + ".xlsx";

        response.setContentType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
        String encodedFilename = URLEncoder.encode(filename, StandardCharsets.UTF_8).replaceAll("\\+", "%20");
        response.setHeader("Content-Disposition", "attachment; filename=\"" + filename + "\"; filename*=UTF-8''" + encodedFilename);

        try (XSSFWorkbook workbook = new XSSFWorkbook()) {
            CellStyle headerStyle = createHeaderStyle(workbook);
            CellStyle dataStyle = createDataStyle(workbook, false);
            CellStyle zebraStyle = createDataStyle(workbook, true);
            CellStyle numberStyle = createNumberStyle(workbook, false);
            CellStyle numberZebraStyle = createNumberStyle(workbook, true);

            // ================= SHEET 1: HIỆU QUẢ NGUỒN LEAD =================
            Sheet sheetSources = workbook.createSheet("Hiệu quả Nguồn Lead");
            sheetSources.setDisplayGridlines(true);

            Row titleRow = sheetSources.createRow(0);
            Cell titleCell = titleRow.createCell(0);
            titleCell.setCellValue("BÁO CÁO HIỆU QUẢ TỪNG NGUỒN LEAD (LEAD SOURCE PERFORMANCE)");
            CellStyle titleStyle = workbook.createCellStyle();
            XSSFFont titleFont = workbook.createFont();
            titleFont.setFontName("Segoe UI");
            titleFont.setFontHeightInPoints((short) 16);
            titleFont.setBold(true);
            titleFont.setColor(new XSSFColor(COLOR_PRIMARY, null));
            titleStyle.setFont(titleFont);
            titleCell.setCellStyle(titleStyle);

            Row infoRow = sheetSources.createRow(1);
            Cell infoCell = infoRow.createCell(0);
            infoCell.setCellValue("Khoảng thời gian: " + dateRangeLabel + " | Xuất lúc: " + LocalDateTime.now().format(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm:ss")));

            List<String> headersSources = List.of(
                    "STT", "Nguồn Lead", "Số lượng Lead", "Lead được nhận", "Tỷ lệ nhận (%)",
                    "Cơ hội bán hàng", "Tỷ lệ chuyển đổi (%)", "Tổng giá trị Pipeline (VNĐ)",
                    "Số đơn chốt (Won)", "Doanh thu chốt (VNĐ)", "Tỷ lệ chốt Win (%)", "Đánh giá chất lượng"
            );

            Row hRow = sheetSources.createRow(3);
            hRow.setHeightInPoints(26);
            for (int i = 0; i < headersSources.size(); i++) {
                Cell c = hRow.createCell(i);
                c.setCellValue(headersSources.get(i));
                c.setCellStyle(headerStyle);
            }

            int rowIdx = 4;
            int stt = 1;
            long sumLeads = 0, sumAccepted = 0, sumOpps = 0, sumWonOpps = 0;
            BigDecimal sumPipeline = BigDecimal.ZERO;
            BigDecimal sumWonRevenue = BigDecimal.ZERO;

            for (com.crm.dto.reports.LeadSourceReportDTO s : sources) {
                Row row = sheetSources.createRow(rowIdx++);
                boolean isZebra = (stt % 2 == 0);
                CellStyle currentStyle = isZebra ? zebraStyle : dataStyle;
                CellStyle currNumStyle = isZebra ? numberZebraStyle : numberStyle;

                createCell(row, 0, String.valueOf(stt), currentStyle);
                createCell(row, 1, s.getSourceName(), currentStyle);
                createCell(row, 2, String.valueOf(s.getTotalLeads()), currNumStyle);
                createCell(row, 3, String.valueOf(s.getAcceptedLeads()), currNumStyle);
                createCell(row, 4, s.getAcceptanceRate() + "%", currentStyle);
                createCell(row, 5, String.valueOf(s.getTotalOpportunities()), currNumStyle);
                createCell(row, 6, s.getConversionRate() + "%", currentStyle);

                Cell cPipe = row.createCell(7);
                cPipe.setCellValue(s.getTotalOpportunityValue().doubleValue());
                cPipe.setCellStyle(currNumStyle);

                createCell(row, 8, String.valueOf(s.getWonOpportunities()), currNumStyle);

                Cell cWon = row.createCell(9);
                cWon.setCellValue(s.getWonRevenue().doubleValue());
                cWon.setCellStyle(currNumStyle);

                createCell(row, 10, s.getWinRate() + "%", currentStyle);

                String gradeText = switch (s.getQualityGrade() != null ? s.getQualityGrade() : "") {
                    case "TOP_TIER" -> "🌟 Xuất sắc / Doanh thu cao";
                    case "GOOD" -> "✓ Khá tốt / Ổn định";
                    default -> "⚠️ Cần tối ưu chi phí";
                };
                createCell(row, 11, gradeText, currentStyle);

                sumLeads += s.getTotalLeads();
                sumAccepted += s.getAcceptedLeads();
                sumOpps += s.getTotalOpportunities();
                sumWonOpps += s.getWonOpportunities();
                sumPipeline = sumPipeline.add(s.getTotalOpportunityValue());
                sumWonRevenue = sumWonRevenue.add(s.getWonRevenue());
                stt++;
            }

            // Dòng tổng kết nguồn lead
            Row totalRow = sheetSources.createRow(rowIdx);
            CellStyle boldStyle = createDataStyle(workbook, true);
            XSSFFont bFont = workbook.createFont();
            bFont.setFontName("Segoe UI");
            bFont.setBold(true);
            boldStyle.setFont(bFont);

            CellStyle boldNumStyle = createNumberStyle(workbook, true);
            boldNumStyle.setFont(bFont);

            createCell(totalRow, 0, "TỔNG", boldStyle);
            createCell(totalRow, 1, "Toàn bộ nguồn (" + sources.size() + " nguồn)", boldStyle);
            createCell(totalRow, 2, String.valueOf(sumLeads), boldNumStyle);
            createCell(totalRow, 3, String.valueOf(sumAccepted), boldNumStyle);
            double totalAccRate = sumLeads > 0 ? (sumAccepted * 100.0 / sumLeads) : 0;
            createCell(totalRow, 4, Math.round(totalAccRate * 10.0) / 10.0 + "%", boldStyle);
            createCell(totalRow, 5, String.valueOf(sumOpps), boldNumStyle);
            double totalConvRate = sumLeads > 0 ? (sumOpps * 100.0 / sumLeads) : 0;
            createCell(totalRow, 6, Math.round(totalConvRate * 10.0) / 10.0 + "%", boldStyle);

            Cell cTotPipe = totalRow.createCell(7);
            cTotPipe.setCellValue(sumPipeline.doubleValue());
            cTotPipe.setCellStyle(boldNumStyle);

            createCell(totalRow, 8, String.valueOf(sumWonOpps), boldNumStyle);

            Cell cTotWon = totalRow.createCell(9);
            cTotWon.setCellValue(sumWonRevenue.doubleValue());
            cTotWon.setCellStyle(boldNumStyle);

            double totalWinRate = sumOpps > 0 ? (sumWonOpps * 100.0 / sumOpps) : 0;
            createCell(totalRow, 10, Math.round(totalWinRate * 10.0) / 10.0 + "%", boldStyle);
            createCell(totalRow, 11, "—", boldStyle);

            for (int i = 0; i < headersSources.size(); i++) {
                sheetSources.autoSizeColumn(i);
                sheetSources.setColumnWidth(i, Math.max(sheetSources.getColumnWidth(i) + 800, 3200));
            }

            // ================= SHEET 2: HIỆU QUẢ CHIẾN DỊCH MARKETING =================
            Sheet sheetCamp = workbook.createSheet("Chiến dịch Marketing & ROI");
            sheetCamp.setDisplayGridlines(true);

            Row cTitleRow = sheetCamp.createRow(0);
            Cell cTitleCell = cTitleRow.createCell(0);
            cTitleCell.setCellValue("BÁO CÁO CHI TIẾT CHIẾN DỊCH MARKETING & TỶ SUẤT ROI");
            cTitleCell.setCellStyle(titleStyle);

            Row cInfoRow = sheetCamp.createRow(1);
            Cell cInfoCell = cInfoRow.createCell(0);
            cInfoCell.setCellValue("Khoảng thời gian: " + dateRangeLabel + " | Tổng số chiến dịch: " + campaigns.size());

            List<String> headersCamp = List.of(
                    "STT", "Mã chiến dịch", "Tên chiến dịch", "Kênh tiếp thị", "Trạng thái",
                    "Ngân sách (VNĐ)", "Số Lead", "Lead nhận", "Tỷ lệ nhận (%)",
                    "Cơ hội", "Doanh thu chốt (VNĐ)", "Hiệu quả ROI (%)", "Đánh giá chi phí"
            );

            Row cHRow = sheetCamp.createRow(3);
            cHRow.setHeightInPoints(26);
            for (int i = 0; i < headersCamp.size(); i++) {
                Cell c = cHRow.createCell(i);
                c.setCellValue(headersCamp.get(i));
                c.setCellStyle(headerStyle);
            }

            int cRowIdx = 4;
            int cStt = 1;

            for (com.crm.dto.reports.CampaignPerformanceReportDTO c : campaigns) {
                Row row = sheetCamp.createRow(cRowIdx++);
                boolean isZebra = (cStt % 2 == 0);
                CellStyle currentStyle = isZebra ? zebraStyle : dataStyle;
                CellStyle currNumStyle = isZebra ? numberZebraStyle : numberStyle;

                createCell(row, 0, String.valueOf(cStt), currentStyle);
                createCell(row, 1, c.getCampaignCode(), currentStyle);
                createCell(row, 2, c.getCampaignName(), currentStyle);
                createCell(row, 3, c.getChannel(), currentStyle);
                createCell(row, 4, c.getStatus(), currentStyle);

                Cell cBud = row.createCell(5);
                cBud.setCellValue(c.getBudget().doubleValue());
                cBud.setCellStyle(currNumStyle);

                createCell(row, 6, String.valueOf(c.getTotalLeads()), currNumStyle);
                createCell(row, 7, String.valueOf(c.getAcceptedLeads()), currNumStyle);
                createCell(row, 8, c.getAcceptanceRate() + "%", currentStyle);
                createCell(row, 9, String.valueOf(c.getTotalOpportunities()), currNumStyle);

                Cell cWonRev = row.createCell(10);
                cWonRev.setCellValue(c.getWonRevenue().doubleValue());
                cWonRev.setCellStyle(currNumStyle);

                createCell(row, 11, (c.getRoi().compareTo(BigDecimal.ZERO) > 0 ? "+" : "") + c.getRoi() + "%", currentStyle);

                String statusLabel = switch (c.getBudgetStatus() != null ? c.getBudgetStatus() : "") {
                    case "PROFITABLE" -> "🟢 Sinh lời tốt (ROI dương)";
                    case "BREAK_EVEN" -> "🟡 Hòa vốn";
                    case "LOSS" -> "🔴 Cần tối ưu chi phí";
                    default -> "⏳ Đang chạy";
                };
                createCell(row, 12, statusLabel, currentStyle);
                cStt++;
            }

            for (int i = 0; i < headersCamp.size(); i++) {
                sheetCamp.autoSizeColumn(i);
                sheetCamp.setColumnWidth(i, Math.max(sheetCamp.getColumnWidth(i) + 800, 3200));
            }

            try (OutputStream out = response.getOutputStream()) {
                workbook.write(out);
                out.flush();
            }
        }
    }

    /**
     * Xuất báo cáo dự báo doanh số, tiến độ chỉ tiêu và phân tích lý do thua
     */
    public void exportSalesForecast(
            HttpServletResponse response,
            Map<String, Object> forecastData
    ) throws IOException {
        String timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss"));
        String filename = "Bao_cao_du_bao_doanh_so_" + timestamp + ".xlsx";

        response.setContentType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
        String encodedFilename = URLEncoder.encode(filename, StandardCharsets.UTF_8).replaceAll("\\+", "%20");
        response.setHeader("Content-Disposition", "attachment; filename=\"" + filename + "\"; filename*=UTF-8''" + encodedFilename);

        try (XSSFWorkbook workbook = new XSSFWorkbook()) {
            CellStyle headerStyle = createHeaderStyle(workbook);
            CellStyle dataStyle = createDataStyle(workbook, false);
            CellStyle zebraStyle = createDataStyle(workbook, true);
            CellStyle numberStyle = createNumberStyle(workbook, false);
            CellStyle numberZebraStyle = createNumberStyle(workbook, true);

            CellStyle boldStyle = workbook.createCellStyle();
            boldStyle.cloneStyleFrom(dataStyle);
            XSSFFont boldFont = workbook.createFont();
            boldFont.setFontName("Segoe UI");
            boldFont.setBold(true);
            boldStyle.setFont(boldFont);

            CellStyle boldNumStyle = workbook.createCellStyle();
            boldNumStyle.cloneStyleFrom(numberStyle);
            boldNumStyle.setFont(boldFont);

            CellStyle titleStyle = workbook.createCellStyle();
            XSSFFont titleFont = workbook.createFont();
            titleFont.setFontName("Segoe UI");
            titleFont.setFontHeightInPoints((short) 15);
            titleFont.setBold(true);
            titleFont.setColor(new XSSFColor(COLOR_PRIMARY, null));
            titleStyle.setFont(titleFont);

            String periodLabel = (String) forecastData.getOrDefault("periodLabel", "Kỳ hiện tại");
            String scope = (String) forecastData.getOrDefault("scope", "USER");
            String scopeLabel = "TEAM".equalsIgnoreCase(scope) ? "Theo Nhóm" : ("ALL".equalsIgnoreCase(scope) ? "Toàn khối" : "Theo Nhân viên");

            // ================= SHEET 1: DỰ BÁO DOANH SỐ & TIẾN ĐỘ CHỈ TIÊU =================
            Sheet sheet1 = workbook.createSheet("Dự báo & Chỉ tiêu");
            sheet1.setDisplayGridlines(true);

            Row r0 = sheet1.createRow(0);
            Cell c0 = r0.createCell(0);
            c0.setCellValue("BÁO CÁO DỰ BÁO DOANH SỐ VÀ TIẾN ĐỘ CHỈ TIÊU");
            c0.setCellStyle(titleStyle);

            Row r1 = sheet1.createRow(1);
            Cell c1 = r1.createCell(0);
            c1.setCellValue("Kỳ báo cáo: " + periodLabel + " | Chế độ xem: " + scopeLabel + " | Thời gian xuất: "
                    + LocalDateTime.now().format(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm:ss")));

            // KPI Summary table
            @SuppressWarnings("unchecked")
            Map<String, Object> summary = (Map<String, Object>) forecastData.getOrDefault("summary", Collections.emptyMap());

            Row rKpiH = sheet1.createRow(3);
            rKpiH.setHeightInPoints(24);
            List<String> kpiHeaders = List.of(
                    "Chỉ tiêu (Target)", "Đã chốt (Won)", "Số deal chốt", "Pipeline mở",
                    "Dự báo trọng số", "Số deal mở", "Tổng dự kiến", "Tiến độ đạt (%)", "Đánh giá trạng thái"
            );
            for (int i = 0; i < kpiHeaders.size(); i++) {
                Cell ch = rKpiH.createCell(i);
                ch.setCellValue(kpiHeaders.get(i));
                ch.setCellStyle(headerStyle);
            }

            Row rKpiV = sheet1.createRow(4);
            rKpiV.setHeightInPoints(22);
            BigDecimal sTarget = (BigDecimal) summary.getOrDefault("targetAmount", BigDecimal.ZERO);
            BigDecimal sWon = (BigDecimal) summary.getOrDefault("wonAmount", BigDecimal.ZERO);
            int sWonDeals = ((Number) summary.getOrDefault("wonDealsCount", 0)).intValue();
            BigDecimal sPipe = (BigDecimal) summary.getOrDefault("pipelineAmount", BigDecimal.ZERO);
            BigDecimal sWeighted = (BigDecimal) summary.getOrDefault("weightedForecastAmount", BigDecimal.ZERO);
            int sOpenDeals = ((Number) summary.getOrDefault("openDealsCount", 0)).intValue();
            BigDecimal sProjected = (BigDecimal) summary.getOrDefault("totalProjectedAmount", BigDecimal.ZERO);
            double sAchievement = ((Number) summary.getOrDefault("achievementPercent", 0.0)).doubleValue();
            String sStatus = (String) summary.getOrDefault("overallStatus", "Đang theo dõi");

            Cell cK0 = rKpiV.createCell(0); cK0.setCellValue(sTarget.doubleValue()); cK0.setCellStyle(numberStyle);
            Cell cK1 = rKpiV.createCell(1); cK1.setCellValue(sWon.doubleValue()); cK1.setCellStyle(numberStyle);
            createCell(rKpiV, 2, String.valueOf(sWonDeals), numberStyle);
            Cell cK3 = rKpiV.createCell(3); cK3.setCellValue(sPipe.doubleValue()); cK3.setCellStyle(numberStyle);
            Cell cK4 = rKpiV.createCell(4); cK4.setCellValue(sWeighted.doubleValue()); cK4.setCellStyle(numberStyle);
            createCell(rKpiV, 5, String.valueOf(sOpenDeals), numberStyle);
            Cell cK6 = rKpiV.createCell(6); cK6.setCellValue(sProjected.doubleValue()); cK6.setCellStyle(boldNumStyle);
            createCell(rKpiV, 7, sAchievement + "%", boldStyle);
            createCell(rKpiV, 8, sStatus, boldStyle);

            // Detailed Breakdown table
            Row rDetailTitle = sheet1.createRow(6);
            Cell cDt = rDetailTitle.createCell(0);
            cDt.setCellValue("CHI TIẾT PHÂN RÃ THEO " + scopeLabel.toUpperCase());
            cDt.setCellStyle(titleStyle);

            List<String> detailHeaders = List.of(
                    "STT", "Đối tượng (Nhân viên / Nhóm)", "Phòng / Nhóm", "Chỉ tiêu (VNĐ)",
                    "Đã chốt (VNĐ)", "Số deal chốt", "Pipeline mở (VNĐ)", "Dự báo trọng số (VNĐ)",
                    "Tổng dự kiến (VNĐ)", "Tiến độ đạt (%)", "Đánh giá trạng thái"
            );

            Row rDetH = sheet1.createRow(7);
            rDetH.setHeightInPoints(26);
            for (int i = 0; i < detailHeaders.size(); i++) {
                Cell ch = rDetH.createCell(i);
                ch.setCellValue(detailHeaders.get(i));
                ch.setCellStyle(headerStyle);
            }

            @SuppressWarnings("unchecked")
            List<Map<String, Object>> breakdown = (List<Map<String, Object>>) forecastData.getOrDefault("breakdown", Collections.emptyList());
            int rowIdx = 8;
            int stt = 1;
            for (Map<String, Object> item : breakdown) {
                Row r = sheet1.createRow(rowIdx++);
                boolean isZebra = (stt % 2 == 0);
                CellStyle curStyle = isZebra ? zebraStyle : dataStyle;
                CellStyle curNumStyle = isZebra ? numberZebraStyle : numberStyle;

                createCell(r, 0, String.valueOf(stt), curStyle);
                createCell(r, 1, valStr(item.get("name")), curStyle);
                createCell(r, 2, valStr(item.get("teamName")), curStyle);

                BigDecimal targetAmt = (BigDecimal) item.getOrDefault("targetAmount", BigDecimal.ZERO);
                Cell cT = r.createCell(3); cT.setCellValue(targetAmt.doubleValue()); cT.setCellStyle(curNumStyle);

                BigDecimal wonAmt = (BigDecimal) item.getOrDefault("wonAmount", BigDecimal.ZERO);
                Cell cW = r.createCell(4); cW.setCellValue(wonAmt.doubleValue()); cW.setCellStyle(curNumStyle);

                createCell(r, 5, String.valueOf(item.getOrDefault("wonDealsCount", 0)), curNumStyle);

                BigDecimal pipeAmt = (BigDecimal) item.getOrDefault("pipelineAmount", BigDecimal.ZERO);
                Cell cP = r.createCell(6); cP.setCellValue(pipeAmt.doubleValue()); cP.setCellStyle(curNumStyle);

                BigDecimal weightedAmt = (BigDecimal) item.getOrDefault("weightedForecastAmount", BigDecimal.ZERO);
                Cell cWe = r.createCell(7); cWe.setCellValue(weightedAmt.doubleValue()); cWe.setCellStyle(curNumStyle);

                BigDecimal projAmt = (BigDecimal) item.getOrDefault("totalProjectedAmount", BigDecimal.ZERO);
                Cell cPr = r.createCell(8); cPr.setCellValue(projAmt.doubleValue()); cPr.setCellStyle(curNumStyle);

                createCell(r, 9, item.getOrDefault("achievementPercent", 0.0) + "%", curStyle);
                createCell(r, 10, valStr(item.get("statusEvaluation")), curStyle);

                stt++;
            }

            for (int i = 0; i < detailHeaders.size(); i++) {
                sheet1.autoSizeColumn(i);
                sheet1.setColumnWidth(i, Math.max(sheet1.getColumnWidth(i) + 800, 3200));
            }

            // ================= SHEET 2: PHÂN TÍCH LÝ DO THUA & ĐỐI THỦ =================
            Sheet sheet2 = workbook.createSheet("Phân tích Thua & Đối thủ");
            sheet2.setDisplayGridlines(true);

            Row rS2Title = sheet2.createRow(0);
            Cell cS2T = rS2Title.createCell(0);
            cS2T.setCellValue("PHÂN TÍCH LÝ DO THUA THEO DANH MỤC VÀ THEO ĐỐI THỦ");
            cS2T.setCellStyle(titleStyle);

            Row rS2Info = sheet2.createRow(1);
            Cell cS2I = rS2Info.createCell(0);
            cS2I.setCellValue("Kỳ báo cáo: " + periodLabel + " | Xuất lúc: "
                    + LocalDateTime.now().format(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm:ss")));

            @SuppressWarnings("unchecked")
            Map<String, Object> lossAnalysis = (Map<String, Object>) forecastData.getOrDefault("lossAnalysis", Collections.emptyMap());
            @SuppressWarnings("unchecked")
            List<Map<String, Object>> byCategory = (List<Map<String, Object>>) lossAnalysis.getOrDefault("byCategory", Collections.emptyList());
            @SuppressWarnings("unchecked")
            List<Map<String, Object>> byCompetitor = (List<Map<String, Object>>) lossAnalysis.getOrDefault("byCompetitor", Collections.emptyList());

            // 1. Phân tích lý do thua theo danh mục
            Row rCatHead = sheet2.createRow(3);
            Cell cCatH = rCatHead.createCell(0);
            cCatH.setCellValue("1. PHÂN TÍCH THEO DANH MỤC LÝ DO THUA");
            cCatH.setCellStyle(boldStyle);

            List<String> catHeaders = List.of(
                    "STT", "Danh mục lý do thua", "Số cơ hội thua", "Tổng giá trị mất (VNĐ)",
                    "Tỷ trọng giá trị (%)", "Tỷ trọng số lượng (%)"
            );
            Row rCH = sheet2.createRow(4);
            rCH.setHeightInPoints(24);
            for (int i = 0; i < catHeaders.size(); i++) {
                Cell ch = rCH.createCell(i);
                ch.setCellValue(catHeaders.get(i));
                ch.setCellStyle(headerStyle);
            }

            int catRowIdx = 5;
            int catStt = 1;
            for (Map<String, Object> cat : byCategory) {
                Row r = sheet2.createRow(catRowIdx++);
                boolean isZebra = (catStt % 2 == 0);
                CellStyle curStyle = isZebra ? zebraStyle : dataStyle;
                CellStyle curNumStyle = isZebra ? numberZebraStyle : numberStyle;

                createCell(r, 0, String.valueOf(catStt), curStyle);
                createCell(r, 1, valStr(cat.get("reasonName")), curStyle);
                createCell(r, 2, String.valueOf(cat.getOrDefault("dealCount", 0)), curNumStyle);

                BigDecimal amt = (BigDecimal) cat.getOrDefault("totalLostAmount", BigDecimal.ZERO);
                Cell cA = r.createCell(3); cA.setCellValue(amt.doubleValue()); cA.setCellStyle(curNumStyle);

                createCell(r, 4, cat.getOrDefault("percentAmount", 0.0) + "%", curStyle);
                createCell(r, 5, cat.getOrDefault("percentDeals", 0.0) + "%", curStyle);

                catStt++;
            }

            // 2. Phân tích theo đối thủ cạnh tranh
            int compStartRow = catRowIdx + 2;
            Row rCompHead = sheet2.createRow(compStartRow);
            Cell cCompH = rCompHead.createCell(0);
            cCompH.setCellValue("2. PHÂN TÍCH THEO ĐỐI THỦ CẠNH TRANH");
            cCompH.setCellStyle(boldStyle);

            List<String> compHeaders = List.of(
                    "STT", "Tên đối thủ cạnh tranh", "Số cơ hội thua", "Tổng giá trị mất vào đối thủ (VNĐ)",
                    "Tỷ trọng giá trị (%)", "Tỷ trọng số lượng (%)"
            );
            Row rCompH = sheet2.createRow(compStartRow + 1);
            rCompH.setHeightInPoints(24);
            for (int i = 0; i < compHeaders.size(); i++) {
                Cell ch = rCompH.createCell(i);
                ch.setCellValue(compHeaders.get(i));
                ch.setCellStyle(headerStyle);
            }

            int compRowIdx = compStartRow + 2;
            int compStt = 1;
            for (Map<String, Object> comp : byCompetitor) {
                Row r = sheet2.createRow(compRowIdx++);
                boolean isZebra = (compStt % 2 == 0);
                CellStyle curStyle = isZebra ? zebraStyle : dataStyle;
                CellStyle curNumStyle = isZebra ? numberZebraStyle : numberStyle;

                createCell(r, 0, String.valueOf(compStt), curStyle);
                createCell(r, 1, valStr(comp.get("competitorName")), curStyle);
                createCell(r, 2, String.valueOf(comp.getOrDefault("dealCount", 0)), curNumStyle);

                BigDecimal amt = (BigDecimal) comp.getOrDefault("totalLostAmount", BigDecimal.ZERO);
                Cell cA = r.createCell(3); cA.setCellValue(amt.doubleValue()); cA.setCellStyle(curNumStyle);

                createCell(r, 4, comp.getOrDefault("percentAmount", 0.0) + "%", curStyle);
                createCell(r, 5, comp.getOrDefault("percentDeals", 0.0) + "%", curStyle);

                compStt++;
            }

            for (int i = 0; i < compHeaders.size(); i++) {
                sheet2.autoSizeColumn(i);
                sheet2.setColumnWidth(i, Math.max(sheet2.getColumnWidth(i) + 800, 3200));
            }

            try (OutputStream out = response.getOutputStream()) {
                workbook.write(out);
                out.flush();
            }
        }
    }

    /**
     * Xuất báo cáo hoạt động và năng suất nhóm kinh doanh (Cuộc gọi, Cuộc gặp, Báo giá theo tuần & Tỷ lệ SLA)
     */
    public void exportTeamProductivity(
            HttpServletResponse response,
            Map<String, Object> productivityData
    ) throws IOException {
        String timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss"));
        String filename = "Bao_cao_nang_suat_nhom_" + timestamp + ".xlsx";

        response.setContentType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
        String encodedFilename = URLEncoder.encode(filename, StandardCharsets.UTF_8).replaceAll("\\+", "%20");
        response.setHeader("Content-Disposition", "attachment; filename=\"" + filename + "\"; filename*=UTF-8''" + encodedFilename);

        try (XSSFWorkbook workbook = new XSSFWorkbook()) {
            CellStyle headerStyle = createHeaderStyle(workbook);
            CellStyle dataStyle = createDataStyle(workbook, false);
            CellStyle zebraStyle = createDataStyle(workbook, true);
            CellStyle numberStyle = createNumberStyle(workbook, false);
            CellStyle numberZebraStyle = createNumberStyle(workbook, true);

            CellStyle boldStyle = workbook.createCellStyle();
            boldStyle.cloneStyleFrom(dataStyle);
            XSSFFont boldFont = workbook.createFont();
            boldFont.setFontName("Segoe UI");
            boldFont.setBold(true);
            boldStyle.setFont(boldFont);

            CellStyle boldNumStyle = workbook.createCellStyle();
            boldNumStyle.cloneStyleFrom(numberStyle);
            boldNumStyle.setFont(boldFont);

            CellStyle titleStyle = workbook.createCellStyle();
            XSSFFont titleFont = workbook.createFont();
            titleFont.setFontName("Segoe UI");
            titleFont.setFontHeightInPoints((short) 15);
            titleFont.setBold(true);
            titleFont.setColor(new XSSFColor(COLOR_PRIMARY, null));
            titleStyle.setFont(titleFont);

            String teamName = (String) productivityData.getOrDefault("teamName", "Toàn bộ nhóm");
            String periodLabel = (String) productivityData.getOrDefault("periodLabel", "Tháng hiện tại");

            Sheet sheet = workbook.createSheet("Năng suất & Hoạt động nhóm");
            sheet.setDisplayGridlines(true);

            Row r0 = sheet.createRow(0);
            Cell c0 = r0.createCell(0);
            c0.setCellValue("BÁO CÁO HOẠT ĐỘNG & NĂNG SUẤT NHÓM KINH DOANH");
            c0.setCellStyle(titleStyle);

            Row r1 = sheet.createRow(1);
            Cell c1 = r1.createCell(0);
            c1.setCellValue("Nhóm: " + teamName + " | Kỳ báo cáo: " + periodLabel + " | Thời gian xuất: "
                    + LocalDateTime.now().format(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm:ss")));

            // KPI Summary table
            @SuppressWarnings("unchecked")
            Map<String, Object> summary = (Map<String, Object>) productivityData.getOrDefault("summary", Collections.emptyMap());

            Row rKpiH = sheet.createRow(3);
            rKpiH.setHeightInPoints(24);
            List<String> kpiHeaders = List.of(
                    "Tổng Cuộc Gọi", "Tổng Cuộc Gặp", "Tổng Báo Giá", "Tổng Hoạt Động",
                    "Tổng Lead Giao", "Tỷ lệ SLA Trung Bình (%)", "Thành viên cần kèm thêm"
            );
            for (int i = 0; i < kpiHeaders.size(); i++) {
                Cell ch = rKpiH.createCell(i);
                ch.setCellValue(kpiHeaders.get(i));
                ch.setCellStyle(headerStyle);
            }

            Row rKpiV = sheet.createRow(4);
            rKpiV.setHeightInPoints(22);
            createCell(rKpiV, 0, String.valueOf(summary.getOrDefault("totalCalls", 0)), numberStyle);
            createCell(rKpiV, 1, String.valueOf(summary.getOrDefault("totalMeetings", 0)), numberStyle);
            createCell(rKpiV, 2, String.valueOf(summary.getOrDefault("totalQuotes", 0)), numberStyle);
            createCell(rKpiV, 3, String.valueOf(summary.getOrDefault("totalActivities", 0)), boldNumStyle);
            createCell(rKpiV, 4, String.valueOf(summary.getOrDefault("totalLeads", 0)), numberStyle);
            createCell(rKpiV, 5, summary.getOrDefault("averageSlaRate", 0.0) + "%", boldStyle);
            createCell(rKpiV, 6, summary.getOrDefault("needsCoachingCount", 0) + " nhân viên", boldStyle);

            // Table Breakdown
            @SuppressWarnings("unchecked")
            List<Map<String, Object>> weeks = (List<Map<String, Object>>) productivityData.getOrDefault("weeks", Collections.emptyList());
            @SuppressWarnings("unchecked")
            List<Map<String, Object>> members = (List<Map<String, Object>>) productivityData.getOrDefault("members", Collections.emptyList());

            List<String> headers = new ArrayList<>();
            headers.add("STT");
            headers.add("Thành viên");
            headers.add("Phòng / Nhóm");

            for (Map<String, Object> w : weeks) {
                String wCode = (String) w.get("weekCode");
                headers.add("Gọi (" + wCode + ")");
                headers.add("Gặp (" + wCode + ")");
                headers.add("Báo giá (" + wCode + ")");
            }

            headers.add("Tổng Gọi");
            headers.add("Tổng Gặp");
            headers.add("Tổng Báo Giá");
            headers.add("Tổng Hoạt Động");
            headers.add("Lead Được Giao");
            headers.add("Lead Đạt SLA");
            headers.add("Lead Vi Phạm SLA");
            headers.add("Tỷ lệ SLA (%)");
            headers.add("Đánh giá / Đề xuất kèm thêm");

            Row rTableH = sheet.createRow(6);
            rTableH.setHeightInPoints(28);
            for (int i = 0; i < headers.size(); i++) {
                Cell ch = rTableH.createCell(i);
                ch.setCellValue(headers.get(i));
                ch.setCellStyle(headerStyle);
            }

            int rowIdx = 7;
            int stt = 1;
            for (Map<String, Object> m : members) {
                Row r = sheet.createRow(rowIdx++);
                boolean isZebra = (stt % 2 == 0);
                CellStyle curStyle = isZebra ? zebraStyle : dataStyle;
                CellStyle curNumStyle = isZebra ? numberZebraStyle : numberStyle;

                int col = 0;
                createCell(r, col++, String.valueOf(stt), curStyle);
                createCell(r, col++, valStr(m.get("fullName")), curStyle);
                createCell(r, col++, valStr(m.get("teamName")), curStyle);

                @SuppressWarnings("unchecked")
                Map<String, Map<String, Integer>> weeklyStats = (Map<String, Map<String, Integer>>) m.get("weeklyStats");

                for (Map<String, Object> w : weeks) {
                    String wCode = (String) w.get("weekCode");
                    Map<String, Integer> ws = (weeklyStats != null) ? weeklyStats.get(wCode) : null;
                    int calls = (ws != null) ? ws.getOrDefault("calls", 0) : 0;
                    int meetings = (ws != null) ? ws.getOrDefault("meetings", 0) : 0;
                    int quotes = (ws != null) ? ws.getOrDefault("quotes", 0) : 0;

                    createCell(r, col++, String.valueOf(calls), curNumStyle);
                    createCell(r, col++, String.valueOf(meetings), curNumStyle);
                    createCell(r, col++, String.valueOf(quotes), curNumStyle);
                }

                createCell(r, col++, String.valueOf(m.getOrDefault("totalCalls", 0)), curNumStyle);
                createCell(r, col++, String.valueOf(m.getOrDefault("totalMeetings", 0)), curNumStyle);
                createCell(r, col++, String.valueOf(m.getOrDefault("totalQuotes", 0)), curNumStyle);
                createCell(r, col++, String.valueOf(m.getOrDefault("totalActivities", 0)), boldNumStyle);

                createCell(r, col++, String.valueOf(m.getOrDefault("totalLeads", 0)), curNumStyle);
                createCell(r, col++, String.valueOf(m.getOrDefault("leadsInSla", 0)), curNumStyle);
                createCell(r, col++, String.valueOf(m.getOrDefault("leadsBreached", 0)), curNumStyle);
                createCell(r, col++, m.getOrDefault("slaRate", 0.0) + "%", curStyle);

                boolean needsCoaching = Boolean.TRUE.equals(m.get("needsCoaching"));
                String coachingText = valStr(m.get("coachingReason"));
                String rating = needsCoaching ? ("⚠️ CẦN KÈM THÊM: " + coachingText) : (" " + valStr(m.get("productivityRating")));
                createCell(r, col++, rating, needsCoaching ? boldStyle : curStyle);

                stt++;
            }

            for (int i = 0; i < headers.size(); i++) {
                sheet.autoSizeColumn(i);
                sheet.setColumnWidth(i, Math.max(sheet.getColumnWidth(i) + 800, 3000));
            }

            try (OutputStream out = response.getOutputStream()) {
                workbook.write(out);
                out.flush();
            }
        }
    }

    private CellStyle createHeaderStyle(XSSFWorkbook workbook) {
        XSSFCellStyle style = workbook.createCellStyle();
        XSSFFont font = workbook.createFont();
        font.setFontName("Segoe UI");
        font.setFontHeightInPoints((short) 11);
        font.setBold(true);
        font.setColor(IndexedColors.WHITE.getIndex());
        style.setFont(font);

        style.setFillForegroundColor(new XSSFColor(COLOR_PRIMARY, null));
        style.setFillPattern(FillPatternType.SOLID_FOREGROUND);
        style.setAlignment(HorizontalAlignment.CENTER);
        style.setVerticalAlignment(VerticalAlignment.CENTER);
        setBorders(style);
        return style;
    }

    private CellStyle createDataStyle(XSSFWorkbook workbook, boolean zebra) {
        XSSFCellStyle style = workbook.createCellStyle();
        XSSFFont font = workbook.createFont();
        font.setFontName("Segoe UI");
        font.setFontHeightInPoints((short) 10);
        style.setFont(font);

        if (zebra) {
            style.setFillForegroundColor(new XSSFColor(COLOR_ZEBRA, null));
            style.setFillPattern(FillPatternType.SOLID_FOREGROUND);
        }
        style.setVerticalAlignment(VerticalAlignment.CENTER);
        setBorders(style);
        return style;
    }

    private CellStyle createNumberStyle(XSSFWorkbook workbook, boolean zebra) {
        CellStyle style = createDataStyle(workbook, zebra);
        DataFormat format = workbook.createDataFormat();
        style.setDataFormat(format.getFormat("#,##0"));
        style.setAlignment(HorizontalAlignment.RIGHT);
        return style;
    }

    private void setBorders(CellStyle style) {
        style.setBorderTop(BorderStyle.THIN);
        style.setBorderBottom(BorderStyle.THIN);
        style.setBorderLeft(BorderStyle.THIN);
        style.setBorderRight(BorderStyle.THIN);
    }

    private void createCell(Row row, int col, String val, CellStyle style) {
        Cell cell = row.createCell(col);
        cell.setCellValue(val != null ? val : "");
        cell.setCellStyle(style);
    }

    private String valStr(Object obj) {
        return obj != null ? String.valueOf(obj) : "";
    }
}
