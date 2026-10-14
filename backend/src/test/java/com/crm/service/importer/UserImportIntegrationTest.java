package com.crm.service.importer;

import com.crm.config.DatabaseConfig;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.junit.jupiter.api.Test;
import java.io.*;
import java.sql.*;
import java.util.*;
import static org.junit.jupiter.api.Assertions.*;

class UserImportIntegrationTest {
    @Test void realWorkbookImportPersistsUnicodeUserAndRejectsDuplicate() throws Exception {
        String url = System.getenv("CRM_DB_URL");
        assertNotNull(url);
        assertEquals("/crm_sprint1_test", java.net.URI.create(url.substring(5)).getPath());
        String email = UUID.randomUUID() + "@example.invalid";
        byte[] file;
        try (var book = new XSSFWorkbook(); var output = new ByteArrayOutputStream()) {
            var sheet = book.createSheet();
            var header = sheet.createRow(0);
            var row = sheet.createRow(1);
            String[] names = {"fullName", "email", "password", "status"};
            String[] values = {"Nguyễn Văn Kiểm Thử", email, UUID.randomUUID() + "aA!9", "ACTIVE"};
            for (int i=0;i<4;i++) { header.createCell(i).setCellValue(names[i]); row.createCell(i).setCellValue(values[i]); }
            book.write(output); file=output.toByteArray();
        }
        try {
            var service = new UserImportService();
            Map<String,Object> preview;
            try (var input = new ByteArrayInputStream(file)) { preview=service.preview(input,1); }
            assertEquals(1, ((List<?>)preview.get("validRows")).size());
            var result=service.confirm((String)preview.get("batchToken"),1);
            assertEquals(1,result.get("created"));
            try (Connection c=DatabaseConfig.getConnection();PreparedStatement s=c.prepareStatement("SELECT full_name FROM users WHERE email=?")) {
                s.setString(1,email);
                try(ResultSet rs=s.executeQuery()) { assertTrue(rs.next()); assertEquals("Nguyễn Văn Kiểm Thử",rs.getString(1)); }
            }
            try (var input = new ByteArrayInputStream(file)) {
                assertEquals(1,((List<?>)service.preview(input,1).get("errorRows")).size());
            }
        } finally {
            try(Connection c=DatabaseConfig.getConnection();PreparedStatement s=c.prepareStatement("DELETE FROM users WHERE email=?")) {
                s.setString(1,email); s.executeUpdate();
            }
        }
    }
}
