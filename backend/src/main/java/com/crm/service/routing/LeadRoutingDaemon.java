package com.crm.service.routing;

import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;
import java.util.logging.Level;
import java.util.logging.Logger;

/**
 * Background Daemon Worker định kỳ chạy phân bổ Lead tự động (SLA < 5 phút)
 * Quét các lead chưa phân bổ trong hàng chờ để phân về cho chuyên viên phụ trách.
 */
public class LeadRoutingDaemon {

    private static final Logger LOGGER = Logger.getLogger(LeadRoutingDaemon.class.getName());
    private static final LeadRoutingDaemon INSTANCE = new LeadRoutingDaemon();

    private final LeadAssignmentService assignmentService = new LeadAssignmentService();
    private ScheduledExecutorService scheduler;
    private volatile boolean running = false;

    private LeadRoutingDaemon() {}

    public static LeadRoutingDaemon getInstance() {
        return INSTANCE;
    }

    public synchronized void start() {
        if (running) return;

        scheduler = Executors.newSingleThreadScheduledExecutor(r -> {
            Thread t = new Thread(r, "LeadRoutingDaemon-Worker");
            t.setDaemon(true);
            return t;
        });

        // Chạy định kỳ mỗi 60 giây (1 phút)
        scheduler.scheduleWithFixedDelay(() -> {
            try {
                int assigned = assignmentService.runBatchAutoAssignment();
                if (assigned > 0) {
                    LOGGER.info("[LeadRoutingDaemon] Đã tự động phân bổ " + assigned + " lead trong chu kỳ chạy nền");
                }
            } catch (Exception e) {
                LOGGER.log(Level.WARNING, "[LeadRoutingDaemon] Lỗi khi chạy phân bổ nền: " + e.getMessage(), e);
            }
        }, 15, 60, TimeUnit.SECONDS);

        running = true;
        LOGGER.info("[LeadRoutingDaemon] Đã khởi động dịch vụ phân bổ lead nền (chu kỳ 60s, SLA < 5 phút)");
    }

    public synchronized void stop() {
        if (!running || scheduler == null) return;
        try {
            scheduler.shutdown();
            if (!scheduler.awaitTermination(3, TimeUnit.SECONDS)) {
                scheduler.shutdownNow();
            }
        } catch (InterruptedException e) {
            scheduler.shutdownNow();
            Thread.currentThread().interrupt();
        } finally {
            running = false;
            LOGGER.info("[LeadRoutingDaemon] Đã dừng dịch vụ phân bổ lead nền");
        }
    }

    public boolean isRunning() {
        return running;
    }
}
