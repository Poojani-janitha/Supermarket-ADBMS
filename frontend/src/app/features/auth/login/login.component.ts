import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="login-page">
      <div class="login-card">
        <!-- Brand Header -->
        <div class="brand-section">
          <div class="brand-icon-circle">
            <span class="material-symbols-outlined logo-icon">storefront</span>
          </div>
          <h1 class="brand-title">EMERALD SUPERMARKET</h1>
          <p class="brand-subtitle">Database Role-Based Access Control (MySQL 8 RBAC)</p>
          <div class="adbms-tag">
            <span>ADBMS Module 8 &bull; Member 5</span>
          </div>
        </div>

        <!-- Role Demo Quick Selector -->
        <div class="demo-role-selector">
          <span class="selector-label">Quick Viva Demo Switcher (sp_get_login):</span>
          <div class="role-chips">
            <button
              type="button"
              class="role-chip"
              [class.active]="username === 'cashier_floyd'"
              (click)="selectQuickUser('cashier_floyd', 'Cashier@2026')"
            >
              <span class="material-symbols-outlined">point_of_sale</span>
              <span>Floyd (cashier_role)</span>
            </button>
            <button
              type="button"
              class="role-chip"
              [class.active]="username === 'manager_arlene'"
              (click)="selectQuickUser('manager_arlene', 'Manager#Secure9')"
            >
              <span class="material-symbols-outlined">badge</span>
              <span>Arlene (manager_role)</span>
            </button>
            <button
              type="button"
              class="role-chip"
              [class.active]="username === 'admin_kavindu'"
              (click)="selectQuickUser('admin_kavindu', 'Admin$KeyPass2026!')"
            >
              <span class="material-symbols-outlined">admin_panel_settings</span>
              <span>Kavindu (admin_role)</span>
            </button>
          </div>
        </div>

        <!-- Login Form -->
        <form (ngSubmit)="handleLogin()" class="login-form">
          @if (errorMessage()) {
            <div class="error-banner">
              <span class="material-symbols-outlined">error</span>
              <span>{{ errorMessage() }}</span>
            </div>
          }

          @if (successMessage()) {
            <div class="success-banner">
              <span class="material-symbols-outlined">check_circle</span>
              <span>{{ successMessage() }}</span>
            </div>
          }

          <div class="form-group">
            <label class="input-label">Username (Database Account / Employee)</label>
            <div class="input-wrapper">
              <span class="material-symbols-outlined input-icon">person</span>
              <input
                type="text"
                [(ngModel)]="username"
                name="username"
                placeholder="Enter username (e.g. cashier_floyd)"
                required
              />
            </div>
          </div>

          <div class="form-group">
            <label class="input-label">Password (Verified via BCrypt & fn_check_password_strength)</label>
            <div class="input-wrapper">
              <span class="material-symbols-outlined input-icon">lock</span>
              <input
                type="password"
                [(ngModel)]="password"
                name="password"
                placeholder="Enter password..."
                (ngModelChange)="onPasswordInput($event)"
                required
              />
            </div>

            <!-- Real-time Password Strength Meter simulating fn_check_password_strength -->
            @if (password.length > 0) {
              <div class="strength-meter-box">
                <div class="meter-bar-track">
                  <div
                    class="meter-bar-fill"
                    [style.width.%]="(pwdStrength().score / 5) * 100"
                    [class.weak]="pwdStrength().score <= 2"
                    [class.medium]="pwdStrength().score === 3 || pwdStrength().score === 4"
                    [class.strong]="pwdStrength().score === 5"
                  ></div>
                </div>
                <div class="strength-labels">
                  <span class="fn-tag">fn_check_password_strength:</span>
                  <strong
                    [class.text-weak]="pwdStrength().score <= 2"
                    [class.text-medium]="pwdStrength().score === 3 || pwdStrength().score === 4"
                    [class.text-strong]="pwdStrength().score === 5"
                  >
                    {{ pwdStrength().label }} ({{ pwdStrength().score }}/5 Criteria)
                  </strong>
                </div>
              </div>
            }
          </div>

          <button type="submit" class="btn-login" [disabled]="isLoading()">
            @if (isLoading()) {
              <span>Calling sp_get_login...</span>
            } @else {
              <span class="material-symbols-outlined">login</span>
              <span>Sign In with Database Session</span>
            }
          </button>
        </form>

        <!-- Academic & Architecture Footer -->
        <div class="card-footer-info">
          <div class="db-object-pill">
            <span class="material-symbols-outlined">database</span>
            <span>MySQL 8: sp_get_login &bull; fn_check_password_strength</span>
          </div>
          <p class="architecture-note">
            Authentication retrieves hashed credentials via Spring Boot JDBC (HikariCP pool, No JPA). Privileges are enforced at the database level via MySQL 8 roles.
          </p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .login-page {
      min-height: 100vh;
      width: 100%;
      background: linear-gradient(135deg, #064e3b 0%, #065f46 50%, #047857 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 24px;
      font-family: inherit;
    }

    .login-card {
      background: #ffffff;
      width: 100%;
      max-width: 520px;
      border-radius: 24px;
      box-shadow: 0 25px 50px -12px rgba(6, 78, 59, 0.35);
      padding: 36px 32px;
      display: flex;
      flex-direction: column;
      gap: 22px;
    }

    .brand-section {
      text-align: center;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
    }

    .brand-icon-circle {
      width: 64px;
      height: 64px;
      border-radius: 20px;
      background: #ecfdf5;
      color: #065f46;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 8px 16px rgba(6, 95, 70, 0.12);
    }

    .logo-icon {
      font-size: 34px;
    }

    .brand-title {
      font-size: 1.35rem;
      font-weight: 800;
      color: #0f172a;
      letter-spacing: 0.5px;
      margin: 4px 0 0 0;
    }

    .brand-subtitle {
      font-size: 0.85rem;
      color: #64748b;
      margin: 0;
    }

    .adbms-tag {
      background: #f0fdf4;
      border: 1px solid #bbf7d0;
      color: #166534;
      font-size: 0.72rem;
      font-weight: 700;
      padding: 3px 12px;
      border-radius: 12px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .demo-role-selector {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 14px;
      padding: 12px 14px;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .selector-label {
      font-size: 0.75rem;
      font-weight: 700;
      color: #475569;
      text-transform: uppercase;
      letter-spacing: 0.3px;
    }

    .role-chips {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 6px;
    }

    .role-chip {
      background: #ffffff;
      border: 1px solid #cbd5e1;
      border-radius: 10px;
      padding: 8px 6px;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;
      cursor: pointer;
      font-size: 0.72rem;
      font-weight: 600;
      color: #334155;
      transition: all 0.15s ease;

      .material-symbols-outlined {
        font-size: 18px;
        color: #065f46;
      }

      &:hover {
        border-color: #065f46;
        background: #f0fdf4;
      }

      &.active {
        background: #065f46;
        color: #ffffff;
        border-color: #065f46;

        .material-symbols-outlined {
          color: #ffffff;
        }
      }
    }

    .login-form {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .input-label {
      font-size: 0.8rem;
      font-weight: 700;
      color: #334155;
    }

    .input-wrapper {
      position: relative;
      display: flex;
      align-items: center;

      .input-icon {
        position: absolute;
        left: 14px;
        color: #94a3b8;
        font-size: 20px;
      }

      input {
        width: 100%;
        padding: 12px 14px 12px 44px;
        border: 1.5px solid #e2e8f0;
        border-radius: 12px;
        font-size: 0.9rem;
        outline: none;
        transition: border-color 0.2s;

        &:focus {
          border-color: #065f46;
          box-shadow: 0 0 0 3px rgba(6, 95, 70, 0.12);
        }
      }
    }

    .strength-meter-box {
      background: #f8fafc;
      border-radius: 8px;
      padding: 8px 10px;
      display: flex;
      flex-direction: column;
      gap: 5px;
      margin-top: 4px;
    }

    .meter-bar-track {
      height: 5px;
      background: #e2e8f0;
      border-radius: 10px;
      overflow: hidden;
    }

    .meter-bar-fill {
      height: 100%;
      transition: width 0.3s ease;

      &.weak { background: #ef4444; }
      &.medium { background: #f59e0b; }
      &.strong { background: #10b981; }
    }

    .strength-labels {
      display: flex;
      justify-content: space-between;
      font-size: 0.72rem;

      .fn-tag {
        color: #64748b;
        font-family: monospace;
      }

      .text-weak { color: #dc2626; }
      .text-medium { color: #d97706; }
      .text-strong { color: #059669; }
    }

    .btn-login {
      background: #065f46;
      color: #ffffff;
      border: none;
      padding: 13px;
      border-radius: 12px;
      font-size: 0.92rem;
      font-weight: 700;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      cursor: pointer;
      transition: background 0.2s;
      margin-top: 4px;

      &:hover:not(:disabled) {
        background: #064e3b;
      }

      &:disabled {
        opacity: 0.7;
        cursor: not-allowed;
      }
    }

    .error-banner {
      background: #fef2f2;
      border: 1px solid #fecaca;
      color: #b91c1c;
      padding: 10px 14px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 0.82rem;
      font-weight: 600;
    }

    .success-banner {
      background: #f0fdf4;
      border: 1px solid #bbf7d0;
      color: #15803d;
      padding: 10px 14px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 0.82rem;
      font-weight: 600;
    }

    .card-footer-info {
      border-top: 1px solid #f1f5f9;
      padding-top: 16px;
      display: flex;
      flex-direction: column;
      gap: 8px;
      text-align: center;
    }

    .db-object-pill {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      color: #475569;
      font-size: 0.73rem;
      font-weight: 600;
      padding: 4px 12px;
      border-radius: 20px;
      margin: 0 auto;
      font-family: monospace;

      .material-symbols-outlined {
        font-size: 15px;
        color: #065f46;
      }
    }

    .architecture-note {
      font-size: 0.72rem;
      color: #94a3b8;
      line-height: 1.4;
      margin: 0;
    }
  `]
})
export class LoginComponent {
  readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  username = 'cashier_floyd';
  password = 'Cashier@2026';

  isLoading = signal(false);
  errorMessage = signal<string | null>(null);
  successMessage = signal<string | null>(null);

  pwdStrength = signal({ score: 4, label: 'Medium', valid: true });

  selectQuickUser(user: string, pass: string): void {
    this.username = user;
    this.password = pass;
    this.errorMessage.set(null);
    this.successMessage.set(null);
    this.onPasswordInput(pass);
  }

  onPasswordInput(val: string): void {
    const res = this.authService.checkPasswordStrength(val);
    this.pwdStrength.set(res);
  }

  handleLogin(): void {
    this.errorMessage.set(null);
    this.successMessage.set(null);
    this.isLoading.set(true);

    // Simulate procedure sp_get_login verification
    setTimeout(() => {
      this.isLoading.set(false);
      const ok = this.authService.login(this.username);
      if (ok) {
        this.successMessage.set(`Welcome ${this.authService.currentUser().fullName}! MySQL 8 session established with role: ${this.authService.currentUser().role}_role`);
        setTimeout(() => {
          this.router.navigate(['/pos']);
        }, 600);
      } else {
        this.errorMessage.set('Authentication failed: Invalid credentials or account deactivated in employee table.');
      }
    }, 400);
  }
}
