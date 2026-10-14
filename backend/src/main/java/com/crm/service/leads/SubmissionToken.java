package com.crm.service.leads;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;

import java.nio.charset.StandardCharsets;
import java.security.GeneralSecurityException;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Clock;
import java.util.Base64;
import java.util.HexFormat;
import java.util.UUID;

public final class SubmissionToken {

    public record Challenge(String token, String question) {
    }

    private final byte[] secret;
    private final Clock clock;
    private final SecureRandom random = new SecureRandom();

    public SubmissionToken(byte[] secret, Clock clock) {
        this.secret = secret.clone();
        this.clock = clock;
    }

    public static SubmissionToken create() {
        byte[] secret = new byte[32];
        new SecureRandom().nextBytes(secret);

        return new SubmissionToken(secret, Clock.systemUTC());
    }

    public Challenge issue(String formId) {
        int first = random.nextInt(8) + 2;
        int second = random.nextInt(8) + 2;

        String payload = formId
                + ":" + clock.millis()
                + ":" + UUID.randomUUID()
                + ":" + first
                + ":" + second;

        String encoded = Base64.getUrlEncoder()
                .withoutPadding()
                .encodeToString(
                        payload.getBytes(StandardCharsets.UTF_8)
                );

        String token = encoded + "." + sign(encoded);
        String question = first + " + " + second + " = ?";

        return new Challenge(token, question);
    }

    public String verify(
            String token,
            String formId,
            String answer,
            String honeypot
    ) {
        try {
            // Ô bẫy bot phải để trống.
            if (honeypot != null && !honeypot.isBlank()) {
                throw new IllegalArgumentException();
            }

            if (token == null || token.length() > 512) {
                throw new IllegalArgumentException();
            }

            String[] parts = token.split("\\.", -1);

            if (parts.length != 2) {
                throw new IllegalArgumentException();
            }

            byte[] expectedSignature = sign(parts[0])
                    .getBytes(StandardCharsets.US_ASCII);

            byte[] suppliedSignature = parts[1]
                    .getBytes(StandardCharsets.US_ASCII);

            if (!MessageDigest.isEqual(
                    expectedSignature,
                    suppliedSignature
            )) {
                throw new IllegalArgumentException();
            }

            String payload = new String(
                    Base64.getUrlDecoder().decode(parts[0]),
                    StandardCharsets.UTF_8
            );

            String[] data = payload.split(":", -1);

            if (data.length != 5 || !data[0].equals(formId)) {
                throw new IllegalArgumentException();
            }

            long issuedAt = Long.parseLong(data[1]);
            long age = clock.millis() - issuedAt;

            if (age < 2_000 || age > 1_800_000) {
                throw new IllegalArgumentException();
            }

            if (answer == null || answer.length() > 3) {
                throw new IllegalArgumentException();
            }

            int expectedAnswer = Integer.parseInt(data[3])
                    + Integer.parseInt(data[4]);

            if (Integer.parseInt(answer.strip()) != expectedAnswer) {
                throw new IllegalArgumentException();
            }

            // DAO dùng hash này để ngăn cùng token tạo nhiều lead.
            byte[] hash = MessageDigest.getInstance("SHA-256")
                    .digest(token.getBytes(StandardCharsets.UTF_8));

            return HexFormat.of().formatHex(hash);

        } catch (IllegalArgumentException exception) {
            throw new IllegalArgumentException(
                    "Xác minh chống spam không hợp lệ. "
                            + "Hãy tải lại biểu mẫu và thử lại."
            );

        } catch (NoSuchAlgorithmException exception) {
            throw new IllegalStateException(exception);
        }
    }

    private String sign(String input) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");

            mac.init(new SecretKeySpec(secret, "HmacSHA256"));

            byte[] signature = mac.doFinal(
                    input.getBytes(StandardCharsets.UTF_8)
            );

            return Base64.getUrlEncoder()
                    .withoutPadding()
                    .encodeToString(signature);

        } catch (GeneralSecurityException exception) {
            throw new IllegalStateException(exception);
        }
    }
}