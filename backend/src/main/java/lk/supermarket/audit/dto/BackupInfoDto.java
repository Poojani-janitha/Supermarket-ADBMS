package lk.supermarket.audit.dto;

/**
 * Data Transfer Object representing a Database Backup Snapshot metadata record.
 * Fulfills Member 5 ADBMS Point-in-Time Recovery (PITR) reporting requirements.
 */
public class BackupInfoDto {

    private String fileName;
    private String filePath;
    private Double fileSizeKb;
    private String createdAt;
    private String binlogCoordinate;
    private String status;
    private String message;

    public BackupInfoDto() {
    }

    public BackupInfoDto(String fileName, String filePath, Double fileSizeKb, String createdAt,
                         String binlogCoordinate, String status, String message) {
        this.fileName = fileName;
        this.filePath = filePath;
        this.fileSizeKb = fileSizeKb;
        this.createdAt = createdAt;
        this.binlogCoordinate = binlogCoordinate;
        this.status = status;
        this.message = message;
    }

    public String getFileName() {
        return fileName;
    }

    public void setFileName(String fileName) {
        this.fileName = fileName;
    }

    public String getFilePath() {
        return filePath;
    }

    public void setFilePath(String filePath) {
        this.filePath = filePath;
    }

    public Double getFileSizeKb() {
        return fileSizeKb;
    }

    public void setFileSizeKb(Double fileSizeKb) {
        this.fileSizeKb = fileSizeKb;
    }

    public String getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(String createdAt) {
        this.createdAt = createdAt;
    }

    public String getBinlogCoordinate() {
        return binlogCoordinate;
    }

    public void setBinlogCoordinate(String binlogCoordinate) {
        this.binlogCoordinate = binlogCoordinate;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }
}
