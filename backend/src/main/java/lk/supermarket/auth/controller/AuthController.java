package lk.supermarket.auth.controller;

import jakarta.validation.Valid;
import lk.supermarket.auth.dto.LoginRequest;
import lk.supermarket.auth.dto.LoginResponse;
import lk.supermarket.auth.dto.SupplierSignupRequest;
import lk.supermarket.auth.service.AuthService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * Authentication REST Controller
 * Primary Owner: Member 5 (Security & Auth Controller)
 */
@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@Valid @RequestBody LoginRequest request) {
        LoginResponse response = authService.authenticate(request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/supplier/signup")
    public ResponseEntity<Map<String, Object>> supplierSignup(@Valid @RequestBody SupplierSignupRequest request) {
        Map<String, Object> result = authService.supplierSignup(request);
        return ResponseEntity.ok(result);
    }
}
