package com.crm.service.pipeline;

import java.util.Collections;
import java.util.List;

/**
 * SCRUM-75: Ngoại lệ ném ra khi chuyển giai đoạn cơ hội mà chưa thỏa mãn điều kiện bắt buộc rời giai đoạn.
 */
public class StageConditionViolationException extends RuntimeException {

    private final boolean canOverride;
    private final List<String> missingConditions;
    private final String currentStageName;
    private final String targetStageName;
    private final String exitCondition;

    public StageConditionViolationException(
            String message,
            boolean canOverride,
            List<String> missingConditions,
            String currentStageName,
            String targetStageName,
            String exitCondition
    ) {
        super(message);
        this.canOverride = canOverride;
        this.missingConditions = missingConditions != null ? List.copyOf(missingConditions) : Collections.emptyList();
        this.currentStageName = currentStageName;
        this.targetStageName = targetStageName;
        this.exitCondition = exitCondition;
    }

    public boolean isCanOverride() {
        return canOverride;
    }

    public List<String> getMissingConditions() {
        return missingConditions;
    }

    public String getCurrentStageName() {
        return currentStageName;
    }

    public String getTargetStageName() {
        return targetStageName;
    }

    public String getExitCondition() {
        return exitCondition;
    }
}
