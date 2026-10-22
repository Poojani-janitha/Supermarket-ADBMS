package lk.supermarket.common;

import org.springframework.dao.DataAccessException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.sql.SQLException;
import java.time.Instant;
import java.util.HashMap;
import java.util.Locale;
import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(DataAccessException.class)
    public ResponseEntity<Map<String, Object>> handleDatabaseException(DataAccessException ex) {
        String msg = rootMessage(ex);
        String normalized = msg != null ? msg.toLowerCase(Locale.ROOT) : "";

        HttpStatus status;
        String code;
        String userMsg = msg;

        if (normalized.contains("insufficient stock")) {
            status = HttpStatus.CONFLICT;
            code = "INSUFFICIENT_STOCK";
            userMsg = "One or more cart items exceed available branch inventory.";
        } else if (normalized.contains("order is already cancelled")) {
            status = HttpStatus.BAD_REQUEST;
            code = "ORDER_ALREADY_CANCELLED";
        } else if (normalized.contains("order not found")) {
            status = HttpStatus.NOT_FOUND;
            code = "ORDER_NOT_FOUND";
        } else if (normalized.contains("already exists") || normalized.contains("duplicate") || normalized.contains("coupon")) {
            status = HttpStatus.CONFLICT;
            code = "DUPLICATE_ENTRY";
        } else {
            status = HttpStatus.UNPROCESSABLE_ENTITY;
            code = "DATABASE_VALIDATION_ERROR";
        }

        return createResponse(status, code, userMsg);
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> handleValidationException(MethodArgumentNotValidException ex) {
        String msg = (ex.getBindingResult().getAllErrors() != null && !ex.getBindingResult().getAllErrors().isEmpty())
                ? ex.getBindingResult().getAllErrors().get(0).getDefaultMessage()
                : "Validation error";
        return createResponse(HttpStatus.BAD_REQUEST, "VALIDATION_ERROR", msg);
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, Object>> handleIllegalArgument(IllegalArgumentException ex) {
        return createResponse(HttpStatus.BAD_REQUEST, "INVALID_REQUEST", ex.getMessage());
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, Object>> handleGeneralException(Exception ex) {
        return createResponse(HttpStatus.INTERNAL_SERVER_ERROR, "INTERNAL_SERVER_ERROR", ex.getMessage());
    }

    private ResponseEntity<Map<String, Object>> createResponse(HttpStatus status, String code, String message) {
        Map<String, Object> body = new HashMap<>();
        body.put("timestamp", Instant.now().toString());
        body.put("status", status.value());
        body.put("code", code);
        body.put("error", code);
        body.put("message", message);
        return ResponseEntity.status(status).body(body);
    }

    private String rootMessage(Throwable throwable) {
        Throwable current = throwable;
        while (current.getCause() != null && !(current instanceof SQLException) && current.getMessage() == null) {
            current = current.getCause();
        }
        if (current instanceof DataAccessException dae && dae.getMostSpecificCause() != null) {
            return dae.getMostSpecificCause().getMessage();
        }
        return current.getMessage() == null ? "Database operation failed" : current.getMessage();
    }
}