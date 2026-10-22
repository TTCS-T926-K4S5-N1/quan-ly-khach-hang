package com.crm.service.leads;

import java.time.Clock;
import java.util.HashMap;
import java.util.Map;

public final class IpRateLimiter {

    private record Window(long start, int count) {
    }

    private final Map<String, Window> windows = new HashMap<>();

    private final int limit;
    private final long periodMillis;
    private final int capacity;
    private final Clock clock;

    public IpRateLimiter(
            int limit,
            long periodMillis,
            int capacity,
            Clock clock
    ) {
        if (limit <= 0 || periodMillis <= 0 || capacity <= 0) {
            throw new IllegalArgumentException(
                    "Cấu hình giới hạn IP không hợp lệ."
            );
        }

        this.limit = limit;
        this.periodMillis = periodMillis;
        this.capacity = capacity;
        this.clock = clock;
    }

    // Trả về 0 nếu được gửi; ngược lại là số giây cần chờ.
    public synchronized long acquire(String ip) {
        long now = clock.millis();

        windows.entrySet().removeIf(
                entry -> now - entry.getValue().start() >= periodMillis
        );

        Window window = windows.get(ip);

        if (window == null) {
            if (windows.size() >= capacity) {
                return Math.max(1, (periodMillis + 999) / 1000);
            }

            windows.put(ip, new Window(now, 1));
            return 0;
        }

        if (window.count() >= limit) {
            long remaining = periodMillis - (now - window.start());

            return Math.max(1, (remaining + 999) / 1000);
        }

        windows.put(
                ip,
                new Window(window.start(), window.count() + 1)
        );

        return 0;
    }
}