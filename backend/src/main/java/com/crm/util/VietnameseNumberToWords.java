package com.crm.util;

import java.math.BigDecimal;
import java.math.BigInteger;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.List;

/**
 * SCRUM-94: đọc số tiền thành chữ tiếng Việt cho báo giá / hợp đồng.
 *
 * <p>Quy tắc: "linh" cho hàng chục bằng 0, "mười" cho hàng chục bằng 1, "mốt" / "tư" / "lăm"
 * cho hàng đơn vị sau "mươi", nhóm 0 bị bỏ qua, nhóm không phải nhóm đầu luôn đọc đủ
 * "không trăm". Thang đơn vị: nghìn, triệu, tỷ, nghìn tỷ, triệu tỷ, tỷ tỷ…</p>
 */
public final class VietnameseNumberToWords {

    private static final String[] DIGITS = {
            "không", "một", "hai", "ba", "bốn", "năm", "sáu", "bảy", "tám", "chín"
    };
    private static final String[] SCALES = {"", "nghìn", "triệu"};
    private static final BigInteger THOUSAND = BigInteger.valueOf(1000);
    /** Giới hạn an toàn: dưới 10^21 (một nghìn tỷ tỷ). */
    private static final BigInteger MAX_EXCLUSIVE = BigInteger.TEN.pow(21);

    private VietnameseNumberToWords() {
    }

    /** Đọc số nguyên không âm thành chữ thường, ví dụ 1005 → "một nghìn không trăm linh năm". */
    public static String toWords(BigInteger number) {
        if (number == null) {
            throw new IllegalArgumentException("Số tiền không được để trống");
        }
        if (number.signum() < 0) {
            throw new IllegalArgumentException("Số tiền không được âm");
        }
        if (number.compareTo(MAX_EXCLUSIVE) >= 0) {
            throw new IllegalArgumentException("Số tiền quá lớn để đọc thành chữ");
        }
        if (number.signum() == 0) {
            return DIGITS[0];
        }

        List<Integer> groups = new ArrayList<>();
        BigInteger rest = number;
        while (rest.signum() > 0) {
            BigInteger[] qr = rest.divideAndRemainder(THOUSAND);
            groups.add(qr[1].intValue());
            rest = qr[0];
        }

        List<String> parts = new ArrayList<>();
        for (int i = groups.size() - 1; i >= 0; i--) {
            int group = groups.get(i);
            if (group == 0) {
                continue;
            }
            boolean leading = i == groups.size() - 1;
            parts.add(readGroup(group, !leading));
            String scale = scaleName(i);
            if (!scale.isEmpty()) {
                parts.add(scale);
            }
        }
        return String.join(" ", parts).replaceAll("\\s+", " ").trim();
    }

    public static String toWords(long number) {
        return toWords(BigInteger.valueOf(number));
    }

    /**
     * Đọc số tiền kèm đơn vị tiền tệ, viết hoa chữ cái đầu, có dấu chấm cuối câu.
     * Ví dụ 175750000, "đồng" → "Một trăm bảy mươi lăm triệu bảy trăm năm mươi nghìn đồng chẵn."
     */
    public static String toCurrencyWords(BigDecimal amount, String currencyUnit) {
        if (amount == null) {
            amount = BigDecimal.ZERO;
        }
        if (amount.signum() < 0) {
            throw new IllegalArgumentException("Số tiền không được âm");
        }
        BigDecimal rounded = amount.setScale(0, RoundingMode.HALF_UP);
        boolean even = amount.compareTo(rounded) == 0;
        String unit = currencyUnit == null || currencyUnit.isBlank() ? "đồng" : currencyUnit.trim();

        String words = toWords(rounded.toBigIntegerExact()) + " " + unit + (even ? " chẵn" : "");
        return capitalize(words) + ".";
    }

    private static String readGroup(int group, boolean full) {
        int hundreds = group / 100;
        int tens = (group / 10) % 10;
        int units = group % 10;
        List<String> words = new ArrayList<>();

        if (hundreds > 0 || full) {
            words.add(DIGITS[hundreds]);
            words.add("trăm");
        }

        if (tens == 0) {
            if (units > 0 && (hundreds > 0 || full)) {
                words.add("linh");
            }
        } else if (tens == 1) {
            words.add("mười");
        } else {
            words.add(DIGITS[tens]);
            words.add("mươi");
        }

        if (units > 0) {
            if (units == 1 && tens > 1) {
                words.add("mốt");
            } else if (units == 4 && tens > 1) {
                words.add("tư");
            } else if (units == 5 && tens > 0) {
                words.add("lăm");
            } else {
                words.add(DIGITS[units]);
            }
        }
        return String.join(" ", words);
    }

    private static String scaleName(int index) {
        StringBuilder name = new StringBuilder(SCALES[index % 3]);
        for (int i = 0; i < index / 3; i++) {
            name.append(" tỷ");
        }
        return name.toString().trim();
    }

    private static String capitalize(String value) {
        if (value.isEmpty()) {
            return value;
        }
        return value.substring(0, 1).toUpperCase(java.util.Locale.forLanguageTag("vi")) + value.substring(1);
    }
}
