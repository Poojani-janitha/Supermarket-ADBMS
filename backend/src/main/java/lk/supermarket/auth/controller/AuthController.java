package lk.supermarket.auth.controller;

import jakarta.validation.Valid;
import lk.supermarket.auth.dto.LoginRequest;
import lk.supermarket.auth.dto.LoginResponse;
import lk.supermarket.auth.service.AuthService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

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
}
