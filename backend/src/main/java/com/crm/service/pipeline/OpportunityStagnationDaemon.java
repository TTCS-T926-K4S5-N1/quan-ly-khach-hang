package com.crm.service.pipeline;

import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;
import java.util.logging.Level;
import java.util.logging.Logger;

/**
 * Background Daemon Worker định kỳ chạy đánh giá cơ hội bán hàng mỗi ngày 1 lần.
 * Gắn cờ cảnh báo cơ hội đình trệ (không hoạt động trong N ngày cấu hình theo giai đoạn)
 * và cảnh báo cơ hội quá ngày dự kiến chốt mà chưa đóng.
 */
public class OpportunityStagnationDaemon {

    private static final Logger LOGGER = Logger.getLogger(OpportunityStagnationDaemon.class.getName());
    private static final OpportunityStagnationDaemon INSTANCE = new OpportunityStagnationDaemon();

    private final OpportunityService opportunityService = new OpportunityService();
    private ScheduledExecutorService scheduler;
    private volatile boolean running = false;

    private OpportunityStagnationDaemon() {}

    public static OpportunityStagnationDaemon getInstance() {
        return INSTANCE;
    }

    public synchronized void start() {
        if (running) return;

        scheduler = Executors.newSingleThreadScheduledExecutor(r -> {
            Thread t = new Thread(r, "OpportunityStagnationDaemon-Worker");
            t.setDaemon(true);
            return t;
        });

        // Chạy lần đầu sau 20 giây khi khởi động server, sau đó chạy định kỳ mỗi 24 giờ (1 ngày/lần)
        scheduler.scheduleWithFixedDelay(() -> {
            try {
                LOGGER.info("[OpportunityStagnationDaemon] Bắt đầu tác vụ đánh giá cơ hội đình trệ định kỳ...");
                int flagged = opportunityService.scanAndFlagStagnantOpportunities();
                LOGGER.info("[OpportunityStagnationDaemon] Hoàn thành tác vụ: phát hiện " + flagged + " cơ hội có cờ cảnh báo (đình trệ / quá hạn).");
            } catch (Exception e) {
                LOGGER.log(Level.WARNING, "[OpportunityStagnationDaemon] Lỗi khi chạy tác vụ đánh giá đình trệ: " + e.getMessage(), e);
            }
        }, 20, 86400, TimeUnit.SECONDS);

        running = true;
        LOGGER.info("[OpportunityStagnationDaemon] Đã khởi động tác vụ đánh giá cơ hội đình trệ nền (chu kỳ 24h/lần)");
    }

    public synchronized void stop() {
        if (!running || scheduler == null) return;
        try {
            scheduler.shutdownNow();
        } catch (Exception ignored) {}
        running = false;
        LOGGER.info("[OpportunityStagnationDaemon] Đã dừng tác vụ đánh giá cơ hội đình trệ");
    }
}
