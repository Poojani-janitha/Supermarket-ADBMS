package lk.supermarket.audit.dto;

public class SecurityEventDto {
    private Long logId;
    private String eventType;
    private String details;
    private String performedBy;
    private String loggedAt;

    public SecurityEventDto() {
    }

    public SecurityEventDto(Long logId, String eventType, String details, String performedBy, String loggedAt) {
        this.logId = logId;
        this.eventType = eventType;
        this.details = details;
        this.performedBy = performedBy;
        this.loggedAt = loggedAt;
    }

    public Long getLogId() {
        return logId;
    }

    public void setLogId(Long logId) {
        this.logId = logId;
    }

    public String getEventType() {
        return eventType;
    }

    public void setEventType(String eventType) {
        this.eventType = eventType;
    }

    public String getDetails() {
        return details;
    }

    public void setDetails(String details) {
        this.details = details;
    }

    public String getPerformedBy() {
        return performedBy;
    }

    public void setPerformedBy(String performedBy) {
        this.performedBy = performedBy;
    }

    public String getLoggedAt() {
        return loggedAt;
    }

    public void setLoggedAt(String loggedAt) {
        this.loggedAt = loggedAt;
    }

    public String getDescription() {
        return details != null ? details : "";
    }

    public String getUsername() {
        return performedBy != null ? performedBy : "SYSTEM";
    }

    public String getIpAddress() {
        return "127.0.0.1";
    }

    public String getCreatedAt() {
        return loggedAt != null ? loggedAt : "";
    }
}
