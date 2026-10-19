package com.crm.util;

import java.math.BigDecimal;
import java.math.BigInteger;

public class VietnameseNumberToWords {

    private static final String[] DIGITS = {
            "không", "một", "hai", "ba", "bốn", "năm", "sáu", "bảy", "tám", "chín"
    };

    private static final String[] UNITS = {
            "", "nghìn", "triệu", "tỷ", "nghìn tỷ", "triệu tỷ"
    };

    public static String convert(BigDecimal amount) {
        if (amount == null) return "Không đồng";
        return convert(amount.toBigInteger());
    }

    public static String convert(BigInteger amount) {
        if (amount == null || amount.equals(BigInteger.ZERO)) {
            return "Không đồng";
        }

        boolean negative = amount.compareTo(BigInteger.ZERO) < 0;
        if (negative) {
            amount = amount.abs();
        }

        String str = amount.toString();
        // Pad with leading zeros to make length divisible by 3
        int rem = str.length() % 3;
        if (rem > 0) {
            str = "0".repeat(3 - rem) + str;
        }

        int groupCount = str.length() / 3;
        StringBuilder result = new StringBuilder();

        for (int i = 0; i < groupCount; i++) {
            int gIdx = groupCount - 1 - i;
            String group = str.substring(i * 3, i * 3 + 3);
            int a = group.charAt(0) - '0';
            int b = group.charAt(1) - '0';
            int c = group.charAt(2) - '0';

            if (a == 0 && b == 0 && c == 0) {
                continue;
            }

            StringBuilder groupStr = new StringBuilder();

            // Hundreds
            if (i > 0 || a > 0) {
                groupStr.append(DIGITS[a]).append(" trăm ");
            }

            // Tens & Units
            if (b == 0 && c == 0) {
                // Exact hundreds, no suffix needed
            } else if (b == 0) {
                if (i > 0 || a > 0) {
                    groupStr.append("lẻ ");
                }
                groupStr.append(DIGITS[c]).append(" ");
            } else if (b == 1) {
                groupStr.append("mười ");
                if (c == 5) {
                    groupStr.append("lăm ");
                } else if (c > 0) {
                    groupStr.append(DIGITS[c]).append(" ");
                }
            } else {
                groupStr.append(DIGITS[b]).append(" mươi ");
                if (c == 1) {
                    groupStr.append("mốt ");
                } else if (c == 4) {
                    groupStr.append("tư ");
                } else if (c == 5) {
                    groupStr.append("lăm ");
                } else if (c > 0) {
                    groupStr.append(DIGITS[c]).append(" ");
                }
            }

            if (gIdx < UNITS.length && !UNITS[gIdx].isEmpty()) {
                groupStr.append(UNITS[gIdx]).append(" ");
            }

            result.append(groupStr);
        }

        String raw = result.toString().trim().replaceAll("\\s+", " ");
        if (raw.isEmpty()) return "Không đồng";

        // Capitalize first letter
        String capitalized = Character.toUpperCase(raw.charAt(0)) + raw.substring(1) + " đồng chẵn.";
        return negative ? "Âm " + capitalized.toLowerCase() : capitalized;
    }
}
