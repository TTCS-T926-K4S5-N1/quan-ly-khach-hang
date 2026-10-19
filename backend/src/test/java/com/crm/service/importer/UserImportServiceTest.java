package com.crm.service.importer;

import com.crm.dao.users.UserManagementDAO;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.junit.jupiter.api.Test;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.sql.SQLException;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import static org.junit.jupiter.api.Assertions.*;

class UserImportServiceTest {
    @Test void validWorkbookPreviewAndConfirm() throws Exception {
        var service = new UserImportService(new UserManagementDAO() {
            @Override public boolean emailExists(String email, Long exclude) { return false; }
            @Override public long create(String name, String email, String password, String status) { return 1; }
        });
        var preview = service.preview(new ByteArrayInputStream(workbook(false)), 1);
        assertEquals(1, ((List<?>) preview.get("validRows")).size());
        assertEquals(List.of(), preview.get("errorRows"));
        String token = (String) preview.get("batchToken");
        assertEquals(1, service.confirm(token, 1).get("created"));
        assertThrows(IllegalArgumentException.class, () -> service.confirm(token, 1));
    }

    @Test void invalidRowsAndDatabaseFailureStaySafe() throws Exception {
        var service = new UserImportService(new UserManagementDAO() {
            @Override public boolean emailExists(String email, Long exclude) { return false; }
            @Override public long create(String name, String email, String password, String status) throws SQLException {
                throw new SQLException("private database diagnostic");
            }
        });
        var invalid = service.preview(new ByteArrayInputStream(workbook(true)), 1);
        assertEquals(1, ((List<?>) invalid.get("errorRows")).size());
        var valid = service.preview(new ByteArrayInputStream(workbook(false)), 1);
        Map<String, Object> result = service.confirm((String) valid.get("batchToken"), 1);
        assertEquals(0, result.get("created"));
        assertFalse(result.toString().contains("private database"));
    }

    @Test void rejectsCorruptWorkbookAndMissingHeader() throws Exception {
        var service = new UserImportService();
        assertThrows(IllegalArgumentException.class,
                () -> service.preview(new ByteArrayInputStream(new byte[]{1, 2, 3}), 1));
        try (var book = new XSSFWorkbook(); var bytes = new ByteArrayOutputStream()) {
            book.createSheet();
            book.write(bytes);
            assertThrows(IllegalArgumentException.class,
                    () -> service.preview(new ByteArrayInputStream(bytes.toByteArray()), 1));
        }
    }

    private byte[] workbook(boolean invalid) throws Exception {
        try (var book = new XSSFWorkbook(); var bytes = new ByteArrayOutputStream()) {
            var sheet = book.createSheet();
            var header = sheet.createRow(0);
            String[] names = {"fullName", "email", "password", "status"};
            var row = sheet.createRow(1);
            String[] values = {invalid ? "" : "Nguyễn Văn An", "fixture@example.invalid",
                    UUID.randomUUID() + "aA!9", "ACTIVE"};
            for (int i = 0; i < names.length; i++) {
                header.createCell(i).setCellValue(names[i]);
                row.createCell(i).setCellValue(values[i]);
            }
            book.write(bytes);
            return bytes.toByteArray();
        }
    }
}
