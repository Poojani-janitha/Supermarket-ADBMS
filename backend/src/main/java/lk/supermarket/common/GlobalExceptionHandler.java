package lk.supermarket.common;

import org.springframework.dao.DataAccessException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.HashMap;
import java.util.Map;

/**
 * Enterprise Global Exception & Error Translation Handler
 * Primary Owner: Member 5 (Security, Exception Mapping & Error Resilience)
 * 
 * Fulfills Section 8 of ADBMS Implementation Guide:
 * - SQLSTATE 45000 'Security Violation' -> HTTP 403 Forbidden
 * - SQLSTATE 45000 'Insufficient stock' -> HTTP 409 Conflict
 * - Validation failures -> HTTP 400 Bad Request
 * - Authentication/Access errors -> HTTP 401 / 403
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(DataAccessException.class)
    public ResponseEntity<Map<String, Object>> handleDatabaseException(DataAccessException ex) {
        String msg = ex.getMostSpecificCause() != null ? ex.getMostSpecificCause().getMessage() : ex.getMessage();
        Map<String, Object> body = new HashMap<>();

        // Member 5: Security Violations raised by database triggers or procedures
        if (msg != null && msg.contains("Security Violation")) {
            body.put("error", "Security Violation");
            body.put("message", msg);
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(body);
        }

        // Member 1: Stock insufficiency exceptions raised by trg_orderitem_check_stock
        if (msg != null && msg.contains("Insufficient stock")) {
            body.put("error", "Insufficient stock");
            body.put("message", "One or more cart items exceed available branch inventory.");
            return ResponseEntity.status(HttpStatus.CONFLICT).body(body);
        }

        // Order cancellation & not found handling
        if (msg != null && msg.contains("Order is already cancelled")) {
            body.put("error", "Order already cancelled");
            body.put("message", msg);
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(body);
        }

        if (msg != null && msg.contains("Order not found")) {
            body.put("error", "Order not found");
            body.put("message", msg);
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(body);
        }

        body.put("error", "Database operation failed");
        body.put("message", msg);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(body);
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> handleValidationException(MethodArgumentNotValidException ex) {
        Map<String, Object> body = new HashMap<>();
        String errorMsg = ex.getBindingResult().getAllErrors().isEmpty() 
                ? "Validation error" 
                : ex.getBindingResult().getAllErrors().get(0).getDefaultMessage();
        body.put("error", "Validation error");
        body.put("message", errorMsg);
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(body);
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<Map<String, Object>> handleAccessDenied(AccessDeniedException ex) {
        Map<String, Object> body = new HashMap<>();
        body.put("error", "Access Denied");
        body.put("message", "Insufficient role privileges to access this administrative resource.");
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(body);
    }

    @ExceptionHandler(AuthenticationException.class)
    public ResponseEntity<Map<String, Object>> handleAuthenticationException(AuthenticationException ex) {
        Map<String, Object> body = new HashMap<>();
        body.put("error", "Unauthorized");
        body.put("message", ex.getMessage());
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(body);
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, Object>> handleIllegalArgument(IllegalArgumentException ex) {
        Map<String, Object> body = new HashMap<>();
        body.put("error", "Invalid request");
        body.put("message", ex.getMessage());
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(body);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, Object>> handleGeneralException(Exception ex) {
        Map<String, Object> body = new HashMap<>();
        body.put("error", "Internal server error");
        body.put("message", ex.getMessage());
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(body);
    }
}
