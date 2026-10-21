package com.crm.util;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.math.BigInteger;

import static org.junit.jupiter.api.Assertions.*;

class VietnameseNumberToWordsTest {

    @Test
    @DisplayName("Đọc các số cơ bản từ 0 đến 25")
    void testBasicNumbers() {
        assertEquals("không", VietnameseNumberToWords.toWords(0));
        assertEquals("một", VietnameseNumberToWords.toWords(1));
        assertEquals("năm", VietnameseNumberToWords.toWords(5));
        assertEquals("mười", VietnameseNumberToWords.toWords(10));
        assertEquals("mười một", VietnameseNumberToWords.toWords(11));
        assertEquals("mười bốn", VietnameseNumberToWords.toWords(14));
        assertEquals("mười lăm", VietnameseNumberToWords.toWords(15));
        assertEquals("hai mươi", VietnameseNumberToWords.toWords(20));
        assertEquals("hai mươi mốt", VietnameseNumberToWords.toWords(21));
        assertEquals("hai mươi tư", VietnameseNumberToWords.toWords(24));
        assertEquals("hai mươi lăm", VietnameseNumberToWords.toWords(25));
    }

    @Test
    @DisplayName("Đọc các số hàng trăm, hàng nghìn có chữ linh và không trăm")
    void testHundredsAndThousands() {
        assertEquals("một trăm", VietnameseNumberToWords.toWords(100));
        assertEquals("một trăm linh một", VietnameseNumberToWords.toWords(101));
        assertEquals("một trăm linh năm", VietnameseNumberToWords.toWords(105));
        assertEquals("một trăm mười", VietnameseNumberToWords.toWords(110));
        assertEquals("một trăm mười lăm", VietnameseNumberToWords.toWords(115));
        assertEquals("một nghìn", VietnameseNumberToWords.toWords(1000));
        assertEquals("một nghìn không trăm linh một", VietnameseNumberToWords.toWords(1001));
        assertEquals("một nghìn không trăm linh năm", VietnameseNumberToWords.toWords(1005));
        assertEquals("mười nghìn năm trăm", VietnameseNumberToWords.toWords(10500));
    }

    @Test
    @DisplayName("Đọc số tiền lớn hàng triệu và hàng tỷ")
    void testMillionsAndBillions() {
        assertEquals("một triệu", VietnameseNumberToWords.toWords(1000000));
        assertEquals("một triệu không trăm linh năm", VietnameseNumberToWords.toWords(1000005));
        assertEquals("một trăm bảy mươi lăm triệu bảy trăm năm mươi nghìn", VietnameseNumberToWords.toWords(175750000));
        assertEquals("một tỷ", VietnameseNumberToWords.toWords(1000000000L));
        assertEquals("hai tỷ không trăm linh năm", VietnameseNumberToWords.toWords(2000000005L));
    }

    @Test
    @DisplayName("Đọc thành tiền có đơn vị tiền tệ và hậu tố chẵn")
    void testCurrencyWords() {
        String result = VietnameseNumberToWords.toCurrencyWords(new BigDecimal("175750000"), "đồng");
        assertEquals("Một trăm bảy mươi lăm triệu bảy trăm năm mươi nghìn đồng chẵn.", result);

        String zeroResult = VietnameseNumberToWords.toCurrencyWords(BigDecimal.ZERO, "đồng");
        assertEquals("Không đồng chẵn.", zeroResult);

        String customUnit = VietnameseNumberToWords.toCurrencyWords(new BigDecimal("5000000"), "VNĐ");
        assertEquals("Năm triệu VNĐ chẵn.", customUnit);
    }

    @Test
    @DisplayName("Ngoại lệ khi số âm hoặc null hoặc vượt ngưỡng")
    void testInvalidInputs() {
        assertThrows(IllegalArgumentException.class, () -> VietnameseNumberToWords.toWords(-1));
        assertThrows(IllegalArgumentException.class, () -> VietnameseNumberToWords.toWords((BigInteger) null));
        assertThrows(IllegalArgumentException.class, () -> VietnameseNumberToWords.toCurrencyWords(new BigDecimal("-100"), "đồng"));
        assertThrows(IllegalArgumentException.class, () -> VietnameseNumberToWords.toWords(BigInteger.TEN.pow(22)));
    }
}
