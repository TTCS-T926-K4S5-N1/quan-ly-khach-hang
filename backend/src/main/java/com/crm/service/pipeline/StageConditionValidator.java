package com.crm.service.pipeline;

import com.crm.dao.pipeline.OpportunityDAO;

import java.math.BigDecimal;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;

/**
 * SCRUM-75: Bộ thẩm định điều kiện bắt buộc rời một giai đoạn bán hàng (Stage Exit Criteria Validator).
 * Giúp Pipeline phản ánh thực tế tiến trình bán hàng thay vì bị nhân viên kéo giai đoạn cho đẹp báo cáo.
 */
public class StageConditionValidator {

    public record ValidationResult(
            boolean isValid,
            List<String> missingConditions,
            String stageName,
            String exitCondition
    ) {
        public static ValidationResult valid(String stageName, String exitCondition) {
            return new ValidationResult(true, Collections.emptyList(), stageName, exitCondition);
        }

        public static ValidationResult invalid(List<String> missing, String stageName, String exitCondition) {
            return new ValidationResult(false, List.copyOf(missing), stageName, exitCondition);
        }
    }

    private final OpportunityDAO opportunityDAO;

    public StageConditionValidator() {
        this(new OpportunityDAO());
    }

    public StageConditionValidator(OpportunityDAO opportunityDAO) {
        this.opportunityDAO = opportunityDAO;
    }

    /**
     * Thẩm định xem cơ hội có thỏa mãn điều kiện bắt buộc khi rời giai đoạn hiện tại hay không.
     *
     * @param currentStage Thông tin giai đoạn hiện tại của cơ hội
     * @param opp          Thông tin chi tiết của cơ hội
     * @return ValidationResult chứa kết quả thẩm định và danh sách các điều kiện còn thiếu
     */
    public ValidationResult validateExitConditions(Map<String, Object> currentStage, Map<String, Object> opp) throws SQLException {
        if (currentStage == null) {
            return ValidationResult.valid("Giai đoạn hiện tại", null);
        }

        String stageName = (String) currentStage.getOrDefault("name", "Giai đoạn hiện tại");
        Object condReqObj = currentStage.get("conditionRequired");
        boolean isRequired = Boolean.TRUE.equals(condReqObj) ||
                (condReqObj instanceof Number && ((Number) condReqObj).intValue() == 1);

        String exitCondition = (String) currentStage.get("exitCondition");
        if (exitCondition == null || exitCondition.isBlank()) {
            exitCondition = (String) currentStage.get("requirements");
        }

        // Nếu không cấu hình bắt buộc hoặc không có nội dung điều kiện -> Hợp lệ
        if (!isRequired || exitCondition == null || exitCondition.isBlank()) {
            return ValidationResult.valid(stageName, exitCondition);
        }

        List<String> missingConditions = new ArrayList<>();
        String normalized = exitCondition.trim().toLowerCase();

        long oppId = opp.get("id") != null ? ((Number) opp.get("id")).longValue() : 0L;
        Long customerId = opp.get("customerId") != null ? ((Number) opp.get("customerId")).longValue() : null;

        boolean ruleMatched = false;

        // 1. Kiểm tra quy tắc Cuộc gặp (Meeting / Cuộc hẹn)
        if (normalized.contains("gặp") || normalized.contains("meeting") || normalized.contains("cuộc hẹn") || normalized.contains("tiếp xúc")) {
            ruleMatched = true;
            int meetingCount = opportunityDAO.countActivities(oppId, customerId, "MEETING");
            if (meetingCount <= 0) {
                // Kiểm tra thêm nếu có hoạt động type = CALL hoặc nội dung ghi nhận gặp gỡ
                int callCount = opportunityDAO.countActivities(oppId, customerId, "CALL");
                if (meetingCount <= 0 && (!normalized.contains("hoặc gọi") && !normalized.contains("call") || callCount <= 0)) {
                    missingConditions.add("Chưa có cuộc gặp nào được ghi nhận cho cơ hội này");
                }
            }
        }

        // 2. Kiểm tra quy tắc Người liên hệ (Contact)
        if (normalized.contains("liên hệ") || normalized.contains("contact") || normalized.contains("người liên hệ")) {
            ruleMatched = true;
            Object contact = opp.get("contactName");
            if (contact == null || String.valueOf(contact).trim().isBlank()) {
                missingConditions.add("Chưa có thông tin người liên hệ cho cơ hội");
            }
        }

        // 3. Kiểm tra quy tắc Báo giá (Quote)
        if (normalized.contains("báo giá") || normalized.contains("quote") || normalized.contains("đề xuất")) {
            ruleMatched = true;
            int quoteCount = opportunityDAO.countQuotes(oppId);
            if (quoteCount <= 0) {
                missingConditions.add("Chưa có báo giá nào được tạo cho cơ hội này");
            }
        }

        // 4. Kiểm tra quy tắc Giá trị cơ hội (Amount / Số tiền)
        if (normalized.contains("giá trị") || normalized.contains("số tiền") || normalized.contains("amount") || normalized.contains("doanh thu")) {
            ruleMatched = true;
            Object amountObj = opp.get("amount");
            if (amountObj == null) {
                missingConditions.add("Chưa nhập giá trị dự kiến cho cơ hội này");
            } else if (amountObj instanceof BigDecimal bd && bd.compareTo(BigDecimal.ZERO) <= 0) {
                missingConditions.add("Giá trị dự kiến của cơ hội phải lớn hơn 0");
            } else if (amountObj instanceof Number num && num.doubleValue() <= 0) {
                missingConditions.add("Giá trị dự kiến của cơ hội phải lớn hơn 0");
            }
        }

        // 5. Nếu không khớp bất kỳ pattern từ khóa nào nhưng có cấu hình bắt buộc
        if (!ruleMatched) {
            missingConditions.add("Cần thỏa mãn điều kiện bắt buộc: " + exitCondition.trim());
        }

        if (missingConditions.isEmpty()) {
            return ValidationResult.valid(stageName, exitCondition);
        }

        return ValidationResult.invalid(missingConditions, stageName, exitCondition);
    }
}
