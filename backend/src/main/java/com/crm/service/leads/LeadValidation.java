package com.crm.service.leads;

import com.crm.dto.leads.LeadSubmission;

import java.util.Locale;

public final class LeadValidation {

    private LeadValidation() {
    }

    public static String text(
            String value,
            String label,
            int maxLength
    ) {
        String result = value == null ? "" : value.strip();

        boolean invalidControl = result.codePoints().anyMatch(
                character -> Character.isISOControl(character)
                        && character != '\n'
                        && character != '\r'
        );

        if (result.isEmpty()
                || result.length() > maxLength
                || invalidControl) {

            throw new IllegalArgumentException(
                    label + " không hợp lệ. Tối đa "
                            + maxLength + " ký tự."
            );
        }

        return result;
    }

    public static LeadSubmission validate(LeadSubmission input) {
        if (input == null) {
            throw new IllegalArgumentException("Thiếu dữ liệu lead.");
        }

        String fullName = text(input.fullName(), "Họ tên", 150);

        String email = text(input.email(), "Email", 254)
                .toLowerCase(Locale.ROOT);

        if (!email.matches("^[^\\s@<>]+@[^\\s@<>]+\\.[^\\s@<>]+$")) {
            throw new IllegalArgumentException("Email không hợp lệ.");
        }

        String phone = text(input.phone(), "Số điện thoại", 32)
                .replaceAll("[ ()-]", "");

        if (!phone.matches("\\+?[0-9]{9,15}")) {
            throw new IllegalArgumentException(
                    "Số điện thoại cần có 9–15 chữ số."
            );
        }

        String company = text(input.company(), "Công ty", 150);
        String interest = text(input.interest(), "Nhu cầu quan tâm", 2000);

        return new LeadSubmission(
                fullName,
                email,
                phone,
                company,
                interest
        );
    }
}