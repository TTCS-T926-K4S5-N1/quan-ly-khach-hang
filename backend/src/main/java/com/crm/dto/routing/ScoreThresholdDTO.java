package com.crm.dto.routing;

public class ScoreThresholdDTO {
    private Long id;
    private String grade;       // HOT, WARM, COLD
    private int minScore;       // Ngưỡng điểm tối thiểu
    private String label;       // Tên nhãn hiển thị
    private String color;       // Mã màu HEX
    private String icon;        // Icon / Emoji
    private String description; // Mô tả ý nghĩa

    public ScoreThresholdDTO() {}

    public ScoreThresholdDTO(Long id, String grade, int minScore, String label, String color, String icon, String description) {
        this.id = id;
        this.grade = grade;
        this.minScore = minScore;
        this.label = label;
        this.color = color;
        this.icon = icon;
        this.description = description;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getGrade() { return grade; }
    public void setGrade(String grade) { this.grade = grade; }

    public int getMinScore() { return minScore; }
    public void setMinScore(int minScore) { this.minScore = minScore; }

    public String getLabel() { return label; }
    public void setLabel(String label) { this.label = label; }

    public String getColor() { return color; }
    public void setColor(String color) { this.color = color; }

    public String getIcon() { return icon; }
    public void setIcon(String icon) { this.icon = icon; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
}
