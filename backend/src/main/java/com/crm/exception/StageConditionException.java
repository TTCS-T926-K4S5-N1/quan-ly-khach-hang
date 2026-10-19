package com.crm.exception;

public class StageConditionException extends RuntimeException {
    private final String stageName;
    private final String conditionType;
    private final String exitCondition;
    private final String missingReason;
    private final boolean canOverride;

    public StageConditionException(
            String stageName,
            String conditionType,
            String exitCondition,
            String missingReason,
            boolean canOverride
    ) {
        super("Không thể chuyển giai đoạn '" + stageName + "'. Chưa thỏa điều kiện: " + missingReason);
        this.stageName = stageName;
        this.conditionType = conditionType;
        this.exitCondition = exitCondition;
        this.missingReason = missingReason;
        this.canOverride = canOverride;
    }

    public String getStageName() { return stageName; }
    public String getConditionType() { return conditionType; }
    public String getExitCondition() { return exitCondition; }
    public String getMissingReason() { return missingReason; }
    public boolean isCanOverride() { return canOverride; }
}
