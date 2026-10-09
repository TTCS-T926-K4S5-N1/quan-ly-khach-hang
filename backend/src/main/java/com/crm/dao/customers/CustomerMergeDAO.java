package com.crm.dao.customers;

import com.crm.config.DatabaseConfig;

import java.sql.*;
import java.text.Normalizer;
import java.util.*;
import java.util.regex.Pattern;

public class CustomerMergeDAO {

    /**
     * Chuẩn hóa mã số thuế (bỏ khoảng trắng, dấu gạch ngang, dấu chấm)
     */
    public static String normalizeTaxCode(String taxCode) {
        if (taxCode == null) return "";
        return taxCode.replaceAll("[^a-zA-Z0-9]", "").trim().toLowerCase();
    }

    /**
     * Chuẩn hóa website (bỏ http://, https://, www., dấu gạch chéo cuối)
     */
    public static String normalizeWebsite(String website) {
        if (website == null) return "";
        String clean = website.trim().toLowerCase();
        clean = clean.replaceFirst("^https?://", "");
        clean = clean.replaceFirst("^www\\.", "");
        int slashIdx = clean.indexOf('/');
        if (slashIdx >= 0) {
            clean = clean.substring(0, slashIdx);
        }
        return clean.trim();
    }

    /**
     * Chuẩn hóa tên công ty (loại bỏ tiền tố, hậu tố loại hình doanh nghiệp phổ biến)
     */
    public static String normalizeCompanyName(String name) {
        if (name == null) return "";
        String s = name.trim().toLowerCase();

        // Bỏ dấu tiếng Việt để so sánh tốt hơn
        s = removeVietnameseAccents(s);

        // Danh sách từ khóa loại hình công ty
        String[] corporateKeywords = {
                "cong ty co phan tap doan", "cong ty co phan", "cong ty tnhh mtv", "cong ty tnhh",
                "tap doan", "co phan", "tnhh mtv", "tnhh", "chi nhanh", "doanh nghiep tu nhan",
                "dntn", "corporation", "corp", "company", "jsc", "ltd", "co., ltd", "co.,ltd",
                "co ltd", "group", "vietnam", "viet nam"
        };

        for (String kw : corporateKeywords) {
            s = s.replaceAll("\\b" + Pattern.quote(kw) + "\\b", " ");
        }

        // Bỏ ký tự đặc biệt, dấu câu
        s = s.replaceAll("[^a-z0-9\\s]", " ");
        s = s.replaceAll("\\s+", " ").trim();
        return s;
    }

    public static String removeVietnameseAccents(String text) {
        if (text == null) return "";
        String nfd = Normalizer.normalize(text, Normalizer.Form.NFD);
        Pattern pattern = Pattern.compile("\\p{InCombiningDiacriticalMarks}+");
        String result = pattern.matcher(nfd).replaceAll("");
        return result.replace("đ", "d").replace("Đ", "D");
    }

    /**
     * Đo độ tương đồng chuỗi Levenshtein (từ 0.0 đến 1.0)
     */
    public static double computeSimilarity(String s1, String s2) {
        if (s1.equals(s2)) return 1.0;
        if (s1.isEmpty() || s2.isEmpty()) return 0.0;

        int maxLen = Math.max(s1.length(), s2.length());
        int dist = levenshteinDistance(s1, s2);
        return 1.0 - ((double) dist / maxLen);
    }

    private static int levenshteinDistance(String s1, String s2) {
        int[] costs = new int[s2.length() + 1];
        for (int j = 0; j < costs.length; j++) costs[j] = j;
        for (int i = 1; i <= s1.length(); i++) {
            costs[0] = i;
            int nw = i - 1;
            for (int j = 1; j <= s2.length(); j++) {
                int cj = Math.min(1 + Math.min(costs[j], costs[j - 1]),
                        s1.charAt(i - 1) == s2.charAt(j - 1) ? nw : nw + 1);
                nw = costs[j];
                costs[j] = cj;
            }
        }
        return costs[s2.length()];
    }

    /**
     * Kiểm tra xem user có vai trò từ Trưởng nhóm trở lên không
     * (ADMIN, DIRECTOR, TEAM_LEAD, MANAGER)
     */
    public boolean isTeamLeadOrAbove(long userId) throws SQLException {
        String sql = """
                SELECT 1
                FROM user_roles ur
                JOIN roles r ON r.id = ur.role_id
                WHERE ur.user_id = ?
                  AND r.code IN ('ADMIN', 'DIRECTOR', 'TEAM_LEAD', 'MANAGER')
                LIMIT 1
                """;
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setLong(1, userId);
            try (ResultSet rs = ps.executeQuery()) {
                return rs.next();
            }
        }
    }

    /**
     * Kiểm tra trùng lặp cho 1 bản ghi khách hàng (khi nhập form hoặc xem trang 360)
     */
    public List<Map<String, Object>> checkDuplicates(String name, String taxCode, String website, Long excludeId) throws SQLException {
        List<Map<String, Object>> candidates = getAllActiveCustomers(excludeId);
        List<Map<String, Object>> matched = new ArrayList<>();

        String normTax = normalizeTaxCode(taxCode);
        String normWeb = normalizeWebsite(website);
        String normName = normalizeCompanyName(name);

        for (Map<String, Object> candidate : candidates) {
            String cTax = normalizeTaxCode((String) candidate.get("taxCode"));
            String cWeb = normalizeWebsite((String) candidate.get("website"));
            String cName = normalizeCompanyName((String) candidate.get("name"));

            List<String> matchReasons = new ArrayList<>();
            double confidence = 0.0;

            // 1. Trùng mã số thuế
            if (!normTax.isBlank() && !cTax.isBlank() && normTax.equals(cTax)) {
                matchReasons.add("Trùng mã số thuế (" + candidate.get("taxCode") + ")");
                confidence = Math.max(confidence, 1.0);
            }

            // 2. Trùng website
            if (!normWeb.isBlank() && !cWeb.isBlank() && normWeb.equals(cWeb)) {
                matchReasons.add("Trùng website (" + candidate.get("website") + ")");
                confidence = Math.max(confidence, 0.95);
            }

            // 3. Tên công ty gần giống
            if (!normName.isBlank() && !cName.isBlank()) {
                if (normName.equals(cName)) {
                    matchReasons.add("Tên công ty trùng khớp sau chuẩn hóa (100%)");
                    confidence = Math.max(confidence, 0.9);
                } else if ((normName.length() >= 4 && cName.contains(normName)) ||
                        (cName.length() >= 4 && normName.contains(cName))) {
                    matchReasons.add("Tên công ty chứa nhau (" + candidate.get("name") + ")");
                    confidence = Math.max(confidence, 0.85);
                } else {
                    double sim = computeSimilarity(normName, cName);
                    if (sim >= 0.75) {
                        int pct = (int) Math.round(sim * 100);
                        matchReasons.add("Tên công ty tương đồng cao (" + pct + "%)");
                        confidence = Math.max(confidence, sim);
                    }
                }
            }

            if (!matchReasons.isEmpty()) {
                Map<String, Object> matchItem = new LinkedHashMap<>(candidate);
                matchItem.put("matchReasons", matchReasons);
                matchItem.put("confidence", Math.round(confidence * 100));
                matched.add(matchItem);
            }
        }

        matched.sort((a, b) -> Double.compare(
                ((Number) b.get("confidence")).doubleValue(),
                ((Number) a.get("confidence")).doubleValue()
        ));

        return matched;
    }

    /**
     * Tìm tất cả các cặp khách hàng trùng lặp trên toàn hệ thống
     */
    public List<Map<String, Object>> findAllDuplicatePairs() throws SQLException {
        List<Map<String, Object>> all = getAllActiveCustomers(null);
        List<Map<String, Object>> pairs = new ArrayList<>();
        Set<String> seenPairs = new HashSet<>();

        for (int i = 0; i < all.size(); i++) {
            Map<String, Object> c1 = all.get(i);
            long id1 = (Long) c1.get("id");
            String tax1 = normalizeTaxCode((String) c1.get("taxCode"));
            String web1 = normalizeWebsite((String) c1.get("website"));
            String name1 = normalizeCompanyName((String) c1.get("name"));

            for (int j = i + 1; j < all.size(); j++) {
                Map<String, Object> c2 = all.get(j);
                long id2 = (Long) c2.get("id");

                String pairKey = Math.min(id1, id2) + "_" + Math.max(id1, id2);
                if (seenPairs.contains(pairKey)) continue;

                String tax2 = normalizeTaxCode((String) c2.get("taxCode"));
                String web2 = normalizeWebsite((String) c2.get("website"));
                String name2 = normalizeCompanyName((String) c2.get("name"));

                List<String> reasons = new ArrayList<>();
                double score = 0.0;

                // Trùng MST
                if (!tax1.isBlank() && !tax2.isBlank() && tax1.equals(tax2)) {
                    reasons.add("Trùng mã số thuế (" + c1.get("taxCode") + ")");
                    score = Math.max(score, 1.0);
                }

                // Trùng Website
                if (!web1.isBlank() && !web2.isBlank() && web1.equals(web2)) {
                    reasons.add("Trùng website (" + c1.get("website") + ")");
                    score = Math.max(score, 0.95);
                }

                // Tên gần giống
                if (!name1.isBlank() && !name2.isBlank()) {
                    if (name1.equals(name2)) {
                        reasons.add("Tên công ty trùng khớp sau chuẩn hóa");
                        score = Math.max(score, 0.9);
                    } else if ((name1.length() >= 4 && name2.contains(name1)) ||
                            (name2.length() >= 4 && name1.contains(name2))) {
                        reasons.add("Tên công ty bao hàm nhau");
                        score = Math.max(score, 0.85);
                    } else {
                        double sim = computeSimilarity(name1, name2);
                        if (sim >= 0.75) {
                            int pct = (int) Math.round(sim * 100);
                            reasons.add("Tên công ty tương đồng cao (" + pct + "%)");
                            score = Math.max(score, sim);
                        }
                    }
                }

                if (!reasons.isEmpty()) {
                    seenPairs.add(pairKey);
                    Map<String, Object> pair = new LinkedHashMap<>();
                    pair.put("masterCandidate", c1);
                    pair.put("duplicateCandidate", c2);
                    pair.put("reasons", reasons);
                    pair.put("confidence", Math.round(score * 100));
                    pairs.add(pair);
                }
            }
        }

        pairs.sort((a, b) -> Double.compare(
                ((Number) b.get("confidence")).doubleValue(),
                ((Number) a.get("confidence")).doubleValue()
        ));

        return pairs;
    }

    /**
     * Lấy dữ liệu chi tiết của 2 khách hàng để so sánh cạnh nhau
     */
    public Map<String, Object> getSideBySideComparison(long id1, long id2) throws SQLException {
        Map<String, Object> c1 = getCustomerDetailWithMetrics(id1);
        Map<String, Object> c2 = getCustomerDetailWithMetrics(id2);

        if (c1 == null || c2 == null) {
            throw new IllegalArgumentException("Không tìm thấy một trong hai khách hàng cần so sánh.");
        }

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("customer1", c1);
        result.put("customer2", c2);

        // Đánh giá các điểm trùng khớp
        List<String> matchPoints = new ArrayList<>();
        String t1 = normalizeTaxCode((String) c1.get("taxCode"));
        String t2 = normalizeTaxCode((String) c2.get("taxCode"));
        if (!t1.isBlank() && t1.equals(t2)) {
            matchPoints.add("Mã số thuế giống nhau: " + c1.get("taxCode"));
        }

        String w1 = normalizeWebsite((String) c1.get("website"));
        String w2 = normalizeWebsite((String) c2.get("website"));
        if (!w1.isBlank() && w1.equals(w2)) {
            matchPoints.add("Website giống nhau: " + c1.get("website"));
        }

        String n1 = normalizeCompanyName((String) c1.get("name"));
        String n2 = normalizeCompanyName((String) c2.get("name"));
        if (n1.equals(n2) || n1.contains(n2) || n2.contains(n1)) {
            matchPoints.add("Tên công ty gần giống nhau");
        }

        result.put("matchPoints", matchPoints);
        return result;
    }

    /**
     * Thực hiện gộp khách hàng:
     * - Giữ lại masterId
     * - Chuyển toàn bộ contacts, opportunities, activities, attachments, quotes từ duplicateId sang masterId
     * - Đánh dấu duplicateId là MERGED và is_deleted = 1
     * - Ghi log activity vào masterId
     */
    public Map<String, Object> mergeCustomers(
            long masterId,
            long duplicateId,
            Map<String, Object> fieldOverrides,
            long operatorUserId,
            String operatorName
    ) throws SQLException {

        if (masterId == duplicateId) {
            throw new IllegalArgumentException("Không thể gộp một khách hàng vào chính nó.");
        }

        try (Connection conn = DatabaseConfig.getConnection()) {
            conn.setAutoCommit(false);
            try {
                // 1. Kiểm tra tồn tại
                String checkSql = "SELECT id, name, tax_code FROM customers WHERE id = ? AND is_deleted = 0";
                String masterName, dupName;
                try (PreparedStatement ps = conn.prepareStatement(checkSql)) {
                    ps.setLong(1, masterId);
                    try (ResultSet rs = ps.executeQuery()) {
                        if (!rs.next()) throw new NoSuchElementException("Khách hàng chính (ID: " + masterId + ") không tồn tại.");
                        masterName = rs.getString("name");
                    }

                    ps.setLong(1, duplicateId);
                    try (ResultSet rs = ps.executeQuery()) {
                        if (!rs.next()) throw new NoSuchElementException("Khách hàng trùng (ID: " + duplicateId + ") không tồn tại hoặc đã bị gộp.");
                        dupName = rs.getString("name");
                    }
                }

                // 2. Chuyển người liên hệ (contacts)
                int contactsMerged = 0;
                String updateContactsSql = "UPDATE contacts SET customer_id = ? WHERE customer_id = ?";
                try (PreparedStatement ps = conn.prepareStatement(updateContactsSql)) {
                    ps.setLong(1, masterId);
                    ps.setLong(2, duplicateId);
                    contactsMerged = ps.executeUpdate();
                }

                // 3. Chuyển cơ hội bán hàng (opportunities)
                int oppsMerged = 0;
                String updateOppsSql = "UPDATE opportunities SET customer_id = ? WHERE customer_id = ?";
                try (PreparedStatement ps = conn.prepareStatement(updateOppsSql)) {
                    ps.setLong(1, masterId);
                    ps.setLong(2, duplicateId);
                    oppsMerged = ps.executeUpdate();
                }

                // 4. Chuyển lịch sử hoạt động (activities)
                int activitiesMerged = 0;
                String updateActsSql = "UPDATE activities SET customer_id = ? WHERE customer_id = ?";
                try (PreparedStatement ps = conn.prepareStatement(updateActsSql)) {
                    ps.setLong(1, masterId);
                    ps.setLong(2, duplicateId);
                    activitiesMerged = ps.executeUpdate();
                }

                // 5. Chuyển tệp đính kèm (attachments)
                int attachmentsMerged = 0;
                String updateAttsSql = "UPDATE attachments SET customer_id = ? WHERE customer_id = ?";
                try (PreparedStatement ps = conn.prepareStatement(updateAttsSql)) {
                    ps.setLong(1, masterId);
                    ps.setLong(2, duplicateId);
                    attachmentsMerged = ps.executeUpdate();
                }

                // 6. Chuyển báo giá (quotes)
                int quotesMerged = 0;
                String updateQuotesSql = "UPDATE quotes SET customer_id = ? WHERE customer_id = ?";
                try (PreparedStatement ps = conn.prepareStatement(updateQuotesSql)) {
                    ps.setLong(1, masterId);
                    ps.setLong(2, duplicateId);
                    quotesMerged = ps.executeUpdate();
                }

                // 7. Chuyển contact_company_history
                try (PreparedStatement ps = conn.prepareStatement("UPDATE contact_company_history SET customer_id = ? WHERE customer_id = ?")) {
                    ps.setLong(1, masterId);
                    ps.setLong(2, duplicateId);
                    ps.executeUpdate();
                }

                // 8. Cập nhật các trường thông tin ghi đè lên Master Customer nếu có chỉ định
                if (fieldOverrides != null && !fieldOverrides.isEmpty()) {
                    StringBuilder upd = new StringBuilder("UPDATE customers SET updated_at = NOW()");
                    List<Object> params = new ArrayList<>();

                    if (fieldOverrides.containsKey("name") && fieldOverrides.get("name") != null) {
                        upd.append(", name = ?");
                        params.add(fieldOverrides.get("name"));
                    }
                    if (fieldOverrides.containsKey("taxCode")) {
                        upd.append(", tax_code = ?");
                        params.add(fieldOverrides.get("taxCode"));
                    }
                    if (fieldOverrides.containsKey("phone")) {
                        upd.append(", phone = ?");
                        params.add(fieldOverrides.get("phone"));
                    }
                    if (fieldOverrides.containsKey("email")) {
                        upd.append(", email = ?");
                        params.add(fieldOverrides.get("email"));
                    }
                    if (fieldOverrides.containsKey("website")) {
                        upd.append(", website = ?");
                        params.add(fieldOverrides.get("website"));
                    }
                    if (fieldOverrides.containsKey("address")) {
                        upd.append(", address = ?");
                        params.add(fieldOverrides.get("address"));
                    }
                    if (fieldOverrides.containsKey("ownerUserId") && fieldOverrides.get("ownerUserId") != null) {
                        upd.append(", owner_user_id = ?");
                        params.add(fieldOverrides.get("ownerUserId"));
                    }

                    upd.append(" WHERE id = ?");
                    params.add(masterId);

                    try (PreparedStatement ps = conn.prepareStatement(upd.toString())) {
                        for (int k = 0; k < params.size(); k++) {
                            ps.setObject(k + 1, params.get(k));
                        }
                        ps.executeUpdate();
                    }
                }

                // 9. Thêm hoạt động hệ thống ghi nhận việc gộp khách hàng
                String noteSql = """
                        INSERT INTO activities (
                            customer_id, owner_user_id, type, subject, description, status, created_at
                        ) VALUES (?, ?, 'NOTE', 'Gộp khách hàng trùng lặp', ?, 'COMPLETED', NOW())
                        """;
                String noteDesc = String.format(
                        "Đã gộp dữ liệu từ khách hàng '%s' (Mã: #%d) vào khách hàng này. Giữ lại toàn bộ %d người liên hệ, %d cơ hội, %d hoạt động, %d tệp đính kèm. Thực hiện bởi: %s.",
                        dupName, duplicateId, contactsMerged, oppsMerged, activitiesMerged, attachmentsMerged, operatorName
                );
                try (PreparedStatement ps = conn.prepareStatement(noteSql)) {
                    ps.setLong(1, masterId);
                    ps.setLong(2, operatorUserId);
                    ps.setString(3, noteDesc);
                    ps.executeUpdate();
                }

                // 10. Đánh dấu bản ghi duplicate là MERGED và soft-delete
                String softDeleteSql = "UPDATE customers SET is_deleted = 1, status = 'MERGED', updated_at = NOW() WHERE id = ?";
                try (PreparedStatement ps = conn.prepareStatement(softDeleteSql)) {
                    ps.setLong(1, duplicateId);
                    ps.executeUpdate();
                }

                conn.commit();

                Map<String, Object> summary = new LinkedHashMap<>();
                summary.put("masterId", masterId);
                summary.put("mergedDuplicateId", duplicateId);
                summary.put("duplicateName", dupName);
                summary.put("contactsMerged", contactsMerged);
                summary.put("opportunitiesMerged", oppsMerged);
                summary.put("activitiesMerged", activitiesMerged);
                summary.put("attachmentsMerged", attachmentsMerged);
                summary.put("quotesMerged", quotesMerged);
                return summary;

            } catch (Exception e) {
                conn.rollback();
                throw e;
            } finally {
                conn.setAutoCommit(true);
            }
        }
    }

    private List<Map<String, Object>> getAllActiveCustomers(Long excludeId) throws SQLException {
        StringBuilder sql = new StringBuilder("""
                SELECT
                    c.id, c.name, c.tax_code, c.status, c.email, c.phone, c.website,
                    c.address, c.owner_user_id, c.created_at,
                    u.full_name AS owner_name,
                    (SELECT COUNT(*) FROM contacts WHERE customer_id = c.id AND is_deleted = 0) AS contacts_count,
                    (SELECT COUNT(*) FROM opportunities WHERE customer_id = c.id AND is_deleted = 0) AS opps_count,
                    (SELECT COUNT(*) FROM activities WHERE customer_id = c.id) AS acts_count
                FROM customers c
                LEFT JOIN users u ON u.id = c.owner_user_id
                WHERE c.is_deleted = 0
                """);
        if (excludeId != null) {
            sql.append(" AND c.id <> ").append(excludeId);
        }
        sql.append(" ORDER BY c.id ASC");

        List<Map<String, Object>> list = new ArrayList<>();
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql.toString());
             ResultSet rs = ps.executeQuery()) {
            while (rs.next()) {
                Map<String, Object> m = new LinkedHashMap<>();
                m.put("id", rs.getLong("id"));
                m.put("name", rs.getString("name"));
                m.put("taxCode", rs.getString("tax_code"));
                m.put("status", rs.getString("status"));
                m.put("email", rs.getString("email"));
                m.put("phone", rs.getString("phone"));
                m.put("website", rs.getString("website"));
                m.put("address", rs.getString("address"));
                m.put("ownerUserId", rs.getObject("owner_user_id"));
                m.put("ownerName", rs.getString("owner_name"));
                m.put("createdAt", rs.getTimestamp("created_at"));
                m.put("contactsCount", rs.getInt("contacts_count"));
                m.put("opportunitiesCount", rs.getInt("opps_count"));
                m.put("activitiesCount", rs.getInt("acts_count"));
                list.add(m);
            }
        }
        return list;
    }

    private Map<String, Object> getCustomerDetailWithMetrics(long customerId) throws SQLException {
        String sql = """
                SELECT
                    c.id, c.name, c.tax_code, c.status, c.email, c.phone, c.website,
                    c.address, c.owner_user_id, c.created_at,
                    u.full_name AS owner_name,
                    (SELECT COUNT(*) FROM contacts WHERE customer_id = c.id AND is_deleted = 0) AS contacts_count,
                    (SELECT COUNT(*) FROM opportunities WHERE customer_id = c.id AND is_deleted = 0) AS opps_count,
                    (SELECT COALESCE(SUM(amount), 0) FROM opportunities WHERE customer_id = c.id AND is_deleted = 0) AS opps_amount,
                    (SELECT COUNT(*) FROM activities WHERE customer_id = c.id) AS acts_count,
                    (SELECT COUNT(*) FROM attachments WHERE customer_id = c.id) AS atts_count
                FROM customers c
                LEFT JOIN users u ON u.id = c.owner_user_id
                WHERE c.id = ? AND c.is_deleted = 0
                """;
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setLong(1, customerId);
            try (ResultSet rs = ps.executeQuery()) {
                if (!rs.next()) return null;
                Map<String, Object> m = new LinkedHashMap<>();
                m.put("id", rs.getLong("id"));
                m.put("name", rs.getString("name"));
                m.put("taxCode", rs.getString("tax_code"));
                m.put("status", rs.getString("status"));
                m.put("email", rs.getString("email"));
                m.put("phone", rs.getString("phone"));
                m.put("website", rs.getString("website"));
                m.put("address", rs.getString("address"));
                m.put("ownerUserId", rs.getObject("owner_user_id"));
                m.put("ownerName", rs.getString("owner_name"));
                m.put("createdAt", rs.getTimestamp("created_at"));
                m.put("contactsCount", rs.getInt("contacts_count"));
                m.put("opportunitiesCount", rs.getInt("opps_count"));
                m.put("opportunitiesAmount", rs.getDouble("opps_amount"));
                m.put("activitiesCount", rs.getInt("acts_count"));
                m.put("attachmentsCount", rs.getInt("atts_count"));

                // Lấy danh sách contacts mẫu
                List<Map<String, Object>> contacts = new ArrayList<>();
                try (PreparedStatement cps = conn.prepareStatement(
                        "SELECT id, name, title, phone, email, buying_role FROM contacts WHERE customer_id = ? AND is_deleted = 0 ORDER BY is_primary DESC, id ASC")) {
                    cps.setLong(1, customerId);
                    try (ResultSet crs = cps.executeQuery()) {
                        while (crs.next()) {
                            Map<String, Object> cm = new LinkedHashMap<>();
                            cm.put("id", crs.getLong("id"));
                            cm.put("name", crs.getString("name"));
                            cm.put("title", crs.getString("title"));
                            cm.put("phone", crs.getString("phone"));
                            cm.put("email", crs.getString("email"));
                            cm.put("buyingRole", crs.getString("buying_role"));
                            contacts.add(cm);
                        }
                    }
                }
                m.put("contacts", contacts);

                // Lấy danh sách opportunities mẫu
                List<Map<String, Object>> opps = new ArrayList<>();
                try (PreparedStatement ops = conn.prepareStatement("""
                        SELECT o.id, o.name, o.amount, COALESCE(ps.name, o.status) AS stage_name, o.probability
                        FROM opportunities o
                        LEFT JOIN pipeline_stages ps ON ps.id = o.stage_id
                        WHERE o.customer_id = ? AND o.is_deleted = 0 ORDER BY o.id DESC
                        """)) {
                    ops.setLong(1, customerId);
                    try (ResultSet ors = ops.executeQuery()) {
                        while (ors.next()) {
                            Map<String, Object> om = new LinkedHashMap<>();
                            om.put("id", ors.getLong("id"));
                            om.put("name", ors.getString("name"));
                            om.put("amount", ors.getDouble("amount"));
                            om.put("stageName", ors.getString("stage_name"));
                            om.put("probability", ors.getInt("probability"));
                            opps.add(om);
                        }
                    }
                }
                m.put("opportunities", opps);

                return m;
            }
        }
    }
}
