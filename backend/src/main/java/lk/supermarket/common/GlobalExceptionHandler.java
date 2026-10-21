package lk.supermarket.common;

import java.sql.SQLException;
import java.time.Instant;
import java.util.Locale;
import org.springframework.dao.DataAccessException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(IllegalArgumentException.class)
    ResponseEntity<ApiError> handleBadRequest(IllegalArgumentException exception) {
        return response(HttpStatus.BAD_REQUEST, "INVALID_REQUEST", exception.getMessage());
    }

    @ExceptionHandler(DataAccessException.class)
    ResponseEntity<ApiError> handleDatabaseError(DataAccessException exception) {
        String message = rootMessage(exception);
        String normalized = message.toLowerCase(Locale.ROOT);
        HttpStatus status = normalized.contains("already exists")
                || normalized.contains("duplicate")
                || normalized.contains("coupon")
                ? HttpStatus.CONFLICT
                : HttpStatus.UNPROCESSABLE_ENTITY;
        return response(status, "DATABASE_VALIDATION_ERROR", message);
    }

    private ResponseEntity<ApiError> response(HttpStatus status, String code, String message) {
        return ResponseEntity.status(status)
                .body(new ApiError(Instant.now(), status.value(), code, message));
    }

    private String rootMessage(Throwable throwable) {
        Throwable current = throwable;
        while (current.getCause() != null
                && !(current instanceof SQLException)
                && current.getMessage() == null) {
            current = current.getCause();
        }
        return current.getMessage() == null ? "Database operation failed" : current.getMessage();
    }
}
