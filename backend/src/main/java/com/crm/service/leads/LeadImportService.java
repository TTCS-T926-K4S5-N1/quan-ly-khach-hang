package com.crm.service.leads;

import com.crm.config.DatabaseConfig;
import com.crm.dao.customers.CustomerMergeDAO;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;

import java.io.InputStream;
import java.io.OutputStream;
import java.sql.*;
import java.time.Duration;
import java.time.Instant;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.regex.Pattern;

public class LeadImportService {

    public static final List<String> COLUMNS = List.of(
            "Họ và tên (*)",
            "Công ty / Đơn vị",
            "Chức vụ",
            "Số điện thoại (*)",
            "Email (*)",
            "Nguồn Lead (*)",
            "Mã chiến dịch",
            "Nhu cầu / Ghi chú"
    );

    private static final Duration BATCH_TTL = Duration.ofMinutes(30);
    private static final Map<String, LeadBatch> CACHED_BATCHES = new ConcurrentHashMap<>();

    private static final Pattern EMAIL_PATTERN = Pattern.compile("^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$");
    private static final Pattern PHONE_PATTERN = Pattern.compile("^(0|\\+84)[0-9]{8,11}$");

    public record ParsedLeadRow(
            int rowNumber,
            boolean valid,
            String fullName,
            String company,
            String title,
            String phone,
            String email,
            String leadSource,
            String campaignCode,
            String notes,
            List<String> errors,
            boolean isDuplicate,
            String duplicateReason
    ) {}

    public record LeadBatch(
            String batchToken,
            String fileName,
            int totalRows,
            int validCount,
            int errorCount,
            List<ParsedLeadRow> validRows,
            List<ParsedLeadRow> errorRows,
            Instant createdAt
    ) {
        public boolean isExpired() {
            return Instant.now().isAfter(createdAt.plus(BATCH_TTL));
        }
    }

    public void writeTemplate(OutputStream output, String type) throws Exception {
        try (Workbook workbook = new XSSFWorkbook()) {
            Sheet sheet = workbook.createSheet("Danh_Sach_Lead");

            // Header Style
            CellStyle headerStyle = workbook.createCellStyle();
            Font headerFont = workbook.createFont();
            headerFont.setBold(true);
            headerFont.setColor(IndexedColors.WHITE.getIndex());
            headerStyle.setFont(headerFont);
            headerStyle.setFillForegroundColor(IndexedColors.TEAL.getIndex());
            headerStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
            headerStyle.setAlignment(HorizontalAlignment.CENTER);
            headerStyle.setVerticalAlignment(VerticalAlignment.CENTER);

            Row header = sheet.createRow(0);
            header.setHeightInPoints(24);
            for (int i = 0; i < COLUMNS.size(); i++) {
                Cell cell = header.createCell(i);
                cell.setCellValue(COLUMNS.get(i));
                cell.setCellStyle(headerStyle);
            }

            if ("invalid".equalsIgnoreCase(type) || "error".equalsIgnoreCase(type)) {
                // File mẫu có lỗi cố ý để kiểm thử tính năng preview báo lỗi từng dòng
                Object[][] testRows = {
                    {"Nguyễn Hoàng Nam", "Tập đoàn Xây dựng Nam Long", "Trưởng phòng Mua hàng", "0912345678", "hoangnam.build@namlong.vn", "Hội thảo / Sự kiện", "CAMP-VIETBUILD-2026", "Hẹn tư vấn giải pháp CRM quản lý dự án"},
                    {"", "Công ty TNHH Cơ điện Bình Minh", "Giám đốc", "0987654321", "binhminh.director@bm.vn", "Hội thảo / Sự kiện", "CAMP-VIETBUILD-2026", "Lỗi: Dòng 3 thiếu Họ và tên bắt buộc"},
                    {"Trần Văn Kiên", "Công ty Thiết bị An ninh Kiên Phát", "Chuyên viên", "12345", "kien.tran@kienphat.com", "Hội thảo / Sự kiện", "CAMP-VIETBUILD-2026", "Lỗi: Dòng 4 Số điện thoại không hợp lệ"},
                    {"Phạm Thị Thanh", "Công ty Dược phẩm Thanh Hương", "Phụ trách Marketing", "0909112233", "email_sai_dinh_dang", "Mạng xã hội", "CAMP-FB-B2B-Q4", "Lỗi: Dòng 5 Email không đúng định dạng"},
                    {"Lê Quốc Trí", "Công ty Cổ phần Vận tải Á Châu", "Phó Giám đốc", "0933445566", "tri.le@achau-trans.vn", "", "CAMP-VIETBUILD-2026", "Lỗi: Dòng 6 Thiếu nguồn lead (Mọi lead bắt buộc có nguồn)"},
                    {"Đặng Hồng Quang", "Công ty Cổ phần Điện tử Đại Phát", "Trưởng phòng", "0911223344", "kinhdoanh@daiphat-elec.vn", "Hội thảo / Sự kiện", "CAMP-VIETBUILD-2026", "Lỗi: Dòng 7 Trùng số điện thoại & email với khách hàng #13 trong hệ thống"}
                };

                for (int r = 0; r < testRows.length; r++) {
                    Row row = sheet.createRow(r + 1);
                    for (int c = 0; c < testRows[r].length; c++) {
                        row.createCell(c).setCellValue((String) testRows[r][c]);
                    }
                }
            } else {
                // File mẫu chuẩn hợp lệ
                Object[][] sampleRows = {
                    {"Nguyễn Hoàng Nam", "Tập đoàn Xây dựng Nam Long", "Trưởng phòng Mua hàng", "0912345678", "hoangnam.build@namlong.vn", "Hội thảo / Sự kiện", "CAMP-VIETBUILD-2026", "Gặp tại gian hàng VietBuild, quan tâm gói 30 nhân sự"},
                    {"Trần Minh Tuấn", "Công ty Cổ phần Công nghệ SmartTech", "Giám đốc Vận hành", "0988776655", "tuan.tm@smarttech.vn", "Hội thảo / Sự kiện", "CAMP-VIETBUILD-2026", "Cần demo tính năng phân quyền dữ liệu và mobile app"},
                    {"Phạm Hoàng Yến", "Công ty TNHH Quảng cáo Sáng tạo Sunrise", "Trưởng nhóm Marketing", "0903123456", "yen.pham@sunrise-ad.com", "Mạng xã hội", "CAMP-FB-B2B-Q4", "Đăng ký tư vấn qua Facebook Lead Ads"}
                };

                for (int r = 0; r < sampleRows.length; r++) {
                    Row row = sheet.createRow(r + 1);
                    for (int c = 0; c < sampleRows[r].length; c++) {
                        row.createCell(c).setCellValue((String) sampleRows[r][c]);
                    }
                }
            }

            for (int i = 0; i < COLUMNS.size(); i++) {
                sheet.autoSizeColumn(i);
                sheet.setColumnWidth(i, Math.max(sheet.getColumnWidth(i) + 1200, 4000));
            }

            workbook.write(output);
        }
    }

    public LeadBatch parseAndValidate(InputStream inputStream, String fileName, Long userId) throws Exception {
        cleanExpiredBatches();

        List<ParsedLeadRow> validRows = new ArrayList<>();
        List<ParsedLeadRow> errorRows = new ArrayList<>();

        // Nạp trước danh sách số điện thoại và email đã tồn tại trong DB để phát hiện trùng lặp
        Set<String> existingPhones = new HashSet<>();
        Set<String> existingEmails = new HashSet<>();
        Map<String, String> phoneToCustomer = new HashMap<>();
        Map<String, String> emailToCustomer = new HashMap<>();
        loadExistingPhonesAndEmails(existingPhones, existingEmails, phoneToCustomer, emailToCustomer);

        // Nạp trước danh sách chiến dịch để ánh xạ mã chiến dịch
        Map<String, Long> campaignMap = loadCampaignCodes();

        Set<String> seenFilePhones = new HashSet<>();
        Set<String> seenFileEmails = new HashSet<>();

        try (Workbook workbook = WorkbookFactory.create(inputStream)) {
            Sheet sheet = workbook.getSheetAt(0);
            int rowCount = sheet.getPhysicalNumberOfRows();

            for (int r = 1; r < rowCount; r++) {
                Row row = sheet.getRow(r);
                if (row == null || isRowEmpty(row)) continue;

                int rowNum = r + 1; // 1-indexed trong Excel
                String fullName = getCellString(row.getCell(0));
                String company = getCellString(row.getCell(1));
                String title = getCellString(row.getCell(2));
                String phone = getCellString(row.getCell(3));
                String email = getCellString(row.getCell(4));
                String leadSource = getCellString(row.getCell(5));
                String campaignCode = getCellString(row.getCell(6));
                String notes = getCellString(row.getCell(7));

                List<String> errors = new ArrayList<>();
                boolean isDuplicate = false;
                StringBuilder dupReason = new StringBuilder();

                // 1. Validate Họ và tên (Bắt buộc)
                if (fullName.isBlank()) {
                    errors.add("Dòng " + rowNum + ": Họ và tên không được để trống");
                }

                // 2. Validate Nguồn Lead (BẮT BUỘC theo User Story SCRUM-64)
                if (leadSource.isBlank()) {
                    errors.add("Dòng " + rowNum + ": Thiếu nguồn lead (Mọi lead nhập vào đều bắt buộc có nguồn)");
                }

                // 3. Validate Số điện thoại (Bắt buộc)
                String normPhone = CustomerMergeDAO.normalizePhone(phone);
                if (phone.isBlank()) {
                    errors.add("Dòng " + rowNum + ": Số điện thoại không được để trống");
                } else if (normPhone.length() < 8 || normPhone.length() > 12) {
                    errors.add("Dòng " + rowNum + ": Số điện thoại không hợp lệ (cần từ 8 đến 11 chữ số)");
                } else if (!seenFilePhones.add(normPhone)) {
                    errors.add("Dòng " + rowNum + ": Số điện thoại bị trùng lặp trong tệp Excel");
                } else if (existingPhones.contains(normPhone)) {
                    isDuplicate = true;
                    dupReason.append("Trùng số điện thoại với ").append(phoneToCustomer.get(normPhone));
                }

                // 4. Validate Email (Bắt buộc)
                String normEmail = CustomerMergeDAO.normalizeEmail(email);
                if (email.isBlank()) {
                    errors.add("Dòng " + rowNum + ": Email không được để trống");
                } else if (!EMAIL_PATTERN.matcher(normEmail).matches()) {
                    errors.add("Dòng " + rowNum + ": Email không đúng định dạng");
                } else if (!seenFileEmails.add(normEmail)) {
                    errors.add("Dòng " + rowNum + ": Email bị trùng lặp trong tệp Excel");
                } else if (existingEmails.contains(normEmail)) {
                    isDuplicate = true;
                    if (dupReason.length() > 0) dupReason.append(" | ");
                    dupReason.append("Trùng email với ").append(emailToCustomer.get(normEmail));
                }

                boolean valid = errors.isEmpty();
                ParsedLeadRow parsedRow = new ParsedLeadRow(
                        rowNum,
                        valid,
                        fullName,
                        company,
                        title,
                        phone,
                        email,
                        leadSource,
                        campaignCode,
                        notes,
                        errors,
                        isDuplicate,
                        dupReason.toString()
                );

                if (valid) {
                    validRows.add(parsedRow);
                } else {
                    errorRows.add(parsedRow);
                }
            }
        }

        String batchToken = UUID.randomUUID().toString().replace("-", "");
        int totalRows = validRows.size() + errorRows.size();

        LeadBatch batch = new LeadBatch(
                batchToken,
                fileName,
                totalRows,
                validRows.size(),
                errorRows.size(),
                validRows,
                errorRows,
                Instant.now()
        );

        CACHED_BATCHES.put(batchToken, batch);

        // Lưu bản ghi lịch sử vào lead_import_batches
        saveBatchRecord(batch, userId);

        return batch;
    }

    public Map<String, Object> commitImport(String batchToken, boolean skipErrors, Long campaignIdOverride, Long userId) throws Exception {
        LeadBatch batch = CACHED_BATCHES.get(batchToken);
        if (batch == null || batch.isExpired()) {
            throw new NoSuchElementException("Phiên nhập dữ liệu đã hết hạn hoặc không tồn tại. Vui lòng tải lại file.");
        }

        if (!skipErrors && !batch.errorRows().isEmpty()) {
            throw new IllegalArgumentException("Tệp còn " + batch.errorRows().size() + " dòng có lỗi dữ liệu. Vui lòng chọn 'Bỏ qua dòng lỗi' hoặc chỉnh sửa lại tệp.");
        }

        List<ParsedLeadRow> toImport = batch.validRows();
        if (toImport.isEmpty()) {
            throw new IllegalArgumentException("Không có dòng hợp lệ nào để nhập vào hệ thống.");
        }

        Map<String, Long> campaignCodes = loadCampaignCodes();

        int importedCount = 0;
        int batchSize = 500; // Batch processing chống nghẽn bộ nhớ

        try (Connection conn = DatabaseConfig.getConnection()) {
            conn.setAutoCommit(false);
            try {
                String insertCustSql = """
                    INSERT INTO customers (
                        name, status, email, phone, address, owner_user_id,
                        lead_source, campaign_id, is_deleted, created_at, updated_at
                    ) VALUES (?, 'TIEM_NANG', ?, ?, ?, ?, ?, ?, 0, NOW(), NOW())
                """;

                String insertContactSql = """
                    INSERT INTO contacts (
                        customer_id, name, title, phone, email, is_primary, notes, is_deleted
                    ) VALUES (?, ?, ?, ?, ?, 1, ?, 0)
                """;

                String insertActivitySql = """
                    INSERT INTO activities (
                        customer_id, owner_user_id, type, subject, description, status, created_at
                    ) VALUES (?, ?, 'NOTE', 'Thu thập lead từ Excel', ?, 'COMPLETED', NOW())
                """;

                for (ParsedLeadRow row : toImport) {
                    Long targetCampaignId = campaignIdOverride;
                    if (targetCampaignId == null && row.campaignCode() != null && !row.campaignCode().isBlank()) {
                        targetCampaignId = campaignCodes.get(row.campaignCode().trim().toUpperCase());
                    }

                    String customerName = !row.company().isBlank() ? row.company() : row.fullName();

                    long customerId;
                    try (PreparedStatement psCust = conn.prepareStatement(insertCustSql, Statement.RETURN_GENERATED_KEYS)) {
                        psCust.setString(1, customerName);
                        psCust.setString(2, row.email());
                        psCust.setString(3, row.phone());
                        psCust.setString(4, row.company());
                        psCust.setObject(5, userId);
                        psCust.setString(6, row.leadSource());
                        psCust.setObject(7, targetCampaignId);
                        psCust.executeUpdate();

                        try (ResultSet rs = psCust.getGeneratedKeys()) {
                            if (!rs.next()) throw new SQLException("Không tạo được khách hàng cho lead: " + row.fullName());
                            customerId = rs.getLong(1);
                        }
                    }

                    // Tạo liên hệ chính
                    try (PreparedStatement psContact = conn.prepareStatement(insertContactSql)) {
                        psContact.setLong(1, customerId);
                        psContact.setString(2, row.fullName());
                        psContact.setString(3, row.title());
                        psContact.setString(4, row.phone());
                        psContact.setString(5, row.email());
                        psContact.setString(6, row.notes());
                        psContact.executeUpdate();
                    }

                    // Ghi nhận ghi chú hoạt động ban đầu
                    if (row.notes() != null && !row.notes().isBlank()) {
                        try (PreparedStatement psAct = conn.prepareStatement(insertActivitySql)) {
                            psAct.setLong(1, customerId);
                            psAct.setLong(2, userId);
                            psAct.setString(3, "Nhu cầu ban đầu: " + row.notes() + " (Nguồn: " + row.leadSource() + ")");
                            psAct.executeUpdate();
                        }
                    }

                    importedCount++;
                }

                // Cập nhật trạng thái lô trong database
                String updateBatchSql = "UPDATE lead_import_batches SET status = 'COMPLETED', imported_rows = ?, imported_at = NOW() WHERE batch_token = ?";
                try (PreparedStatement psb = conn.prepareStatement(updateBatchSql)) {
                    psb.setInt(1, importedCount);
                    psb.setString(2, batchToken);
                    psb.executeUpdate();
                }

                conn.commit();
            } catch (Exception e) {
                conn.rollback();
                throw e;
            } finally {
                conn.setAutoCommit(true);
            }
        }

        CACHED_BATCHES.remove(batchToken);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("batchToken", batchToken);
        result.put("totalRows", batch.totalRows());
        result.put("importedRows", importedCount);
        result.put("skippedErrorRows", batch.errorRows().size());
        return result;
    }

    private void loadExistingPhonesAndEmails(Set<String> phones, Set<String> emails, Map<String, String> pMap, Map<String, String> eMap) {
        String sql = """
            SELECT id, name, phone, email FROM customers WHERE is_deleted = 0
            UNION ALL
            SELECT customer_id AS id, name, phone, email FROM contacts WHERE is_deleted = 0
        """;
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql);
             ResultSet rs = ps.executeQuery()) {
            while (rs.next()) {
                long id = rs.getLong("id");
                String name = rs.getString("name");
                String ph = CustomerMergeDAO.normalizePhone(rs.getString("phone"));
                String em = CustomerMergeDAO.normalizeEmail(rs.getString("email"));
                if (!ph.isBlank()) {
                    phones.add(ph);
                    pMap.put(ph, "Khách hàng #" + id + " (" + name + ")");
                }
                if (!em.isBlank()) {
                    emails.add(em);
                    eMap.put(em, "Khách hàng #" + id + " (" + name + ")");
                }
            }
        } catch (SQLException e) {
            // Log warning
        }
    }

    private Map<String, Long> loadCampaignCodes() {
        Map<String, Long> map = new HashMap<>();
        String sql = "SELECT id, code FROM campaigns";
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql);
             ResultSet rs = ps.executeQuery()) {
            while (rs.next()) {
                String code = rs.getString("code");
                if (code != null) map.put(code.trim().toUpperCase(), rs.getLong("id"));
            }
        } catch (SQLException e) {
            // Log warning
        }
        return map;
    }

    private void saveBatchRecord(LeadBatch batch, Long userId) {
        String sql = """
            INSERT INTO lead_import_batches (
                batch_token, file_name, total_rows, valid_rows, error_rows, status, created_by
            ) VALUES (?, ?, ?, ?, ?, 'PENDING', ?)
        """;
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, batch.batchToken());
            ps.setString(2, batch.fileName());
            ps.setInt(3, batch.totalRows());
            ps.setInt(4, batch.validCount());
            ps.setInt(5, batch.errorCount());
            ps.setObject(6, userId);
            ps.executeUpdate();
        } catch (SQLException e) {
            // Ignore if error saving metadata
        }
    }

    private void cleanExpiredBatches() {
        CACHED_BATCHES.entrySet().removeIf(entry -> entry.getValue().isExpired());
    }

    private boolean isRowEmpty(Row row) {
        for (int c = row.getFirstCellNum(); c < row.getLastCellNum(); c++) {
            Cell cell = row.getCell(c);
            if (cell != null && cell.getCellType() != CellType.BLANK && !getCellString(cell).isBlank()) {
                return false;
            }
        }
        return true;
    }

    private String getCellString(Cell cell) {
        if (cell == null) return "";
        DataFormatter formatter = new DataFormatter();
        return formatter.formatCellValue(cell).trim();
    }
}
