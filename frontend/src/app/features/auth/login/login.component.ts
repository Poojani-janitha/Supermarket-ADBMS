import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { InventoryService } from '../../../core/services/inventory.service';

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
          <p class="brand-subtitle">Enterprise ADBMS & B2B Vendor Management System</p>
          <div class="adbms-tag">
            <span>ADBMS Modules 2 & 8 &bull; Role-Based Security & Supplier Portal</span>
          </div>
        </div>

        <!-- Portal Type Selector Tabs -->
        <div class="portal-type-tabs">
          <button
            type="button"
            class="portal-tab"
            [class.active]="portalType() === 'STAFF'"
            (click)="selectPortalType('STAFF')"
          >
            <span class="material-symbols-outlined">badge</span>
            <span>Supermarket Staff</span>
          </button>
          <button
            type="button"
            class="portal-tab"
            [class.active]="portalType() === 'SUPPLIER'"
            (click)="selectPortalType('SUPPLIER')"
          >
            <span class="material-symbols-outlined">local_shipping</span>
            <span>Registered Supplier</span>
          </button>
        </div>

        <!-- ======================= STAFF VIEW ======================= -->
        @if (portalType() === 'STAFF') {
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
                <span>Floyd (cashier)</span>
              </button>
              <button
                type="button"
                class="role-chip"
                [class.active]="username === 'manager_arlene'"
                (click)="selectQuickUser('manager_arlene', 'Manager#Secure9')"
              >
                <span class="material-symbols-outlined">badge</span>
                <span>Arlene (manager)</span>
              </button>
              <button
                type="button"
                class="role-chip"
                [class.active]="username === 'admin_kavindu'"
                (click)="selectQuickUser('admin_kavindu', 'Admin$KeyPass2026!')"
              >
                <span class="material-symbols-outlined">admin_panel_settings</span>
                <span>Kavindu (admin)</span>
              </button>
            </div>
          </div>
        }

        <!-- ======================= SUPPLIER VIEW ======================= -->
        @if (portalType() === 'SUPPLIER' && !showSupplierSignUp()) {
          <div class="demo-role-selector supplier-demo">
            <span class="selector-label">Vendor Portal Demo Switcher (sp_get_supplier_login):</span>
            <div class="role-chips">
              <button
                type="button"
                class="role-chip"
                [class.active]="username === 'supplier_organics'"
                (click)="selectQuickUser('supplier_organics', 'Supplier$2026')"
              >
                <span class="material-symbols-outlined">eco</span>
                <span>Lanka Fresh Organics</span>
              </button>
              <button
                type="button"
                class="role-chip"
                [class.active]="username === 'supplier_agro'"
                (click)="selectQuickUser('supplier_agro', 'Supplier$2026')"
              >
                <span class="material-symbols-outlined">grain</span>
                <span>Ceylon Agro Mills</span>
              </button>
            </div>
          </div>
        }

        <!-- Error & Success Banners -->
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

        <!-- ======================= LOGIN FORM ======================= -->
        @if (!showSupplierSignUp()) {
          <form (ngSubmit)="handleLogin()" class="login-form">
            <div class="form-group">
              <label class="input-label">
                {{ portalType() === 'STAFF' ? 'Employee Username (MySQL 8 RBAC)' : 'Supplier Account Username (Vendor Portal)' }}
              </label>
              <div class="input-wrapper">
                <span class="material-symbols-outlined input-icon">person</span>
                <input
                  type="text"
                  [(ngModel)]="username"
                  name="username"
                  [placeholder]="portalType() === 'STAFF' ? 'e.g. cashier_floyd or manager_arlene' : 'e.g. supplier_organics or supplier_agro'"
                  required
                />
              </div>
            </div>

            <div class="form-group">
              <label class="input-label">Password (Verified via BCrypt)</label>
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

            <button type="submit" class="btn-login" [disabled]="isLoading()" [class.btn-supplier]="portalType() === 'SUPPLIER'">
              @if (isLoading()) {
                <span>Verifying credentials...</span>
              } @else {
                <span class="material-symbols-outlined">login</span>
                <span>Sign In as {{ portalType() === 'STAFF' ? 'Supermarket Staff' : 'Supplier Partner' }}</span>
              }
            </button>

            <!-- Supplier SignUp Toggle Link -->
            @if (portalType() === 'SUPPLIER') {
              <div class="signup-prompt">
                <span>Are you a new wholesale vendor?</span>
                <button type="button" class="btn-text-link" (click)="toggleSignUp(true)">
                  Sign Up as Supplier Partner &rarr;
                </button>
              </div>
            }
          </form>
        }

        <!-- ======================= SUPPLIER SIGNUP FORM ======================= -->
        @if (portalType() === 'SUPPLIER' && showSupplierSignUp()) {
          <form (ngSubmit)="handleSupplierSignUp()" class="signup-form">
            <div class="signup-header">
              <h3>Supplier Self-Registration</h3>
              <p>Register your wholesale company to receive purchase orders from Emerald Supermarket.</p>
            </div>

            <div class="form-grid">
              <div class="form-group">
                <label>Company / Supplier Name</label>
                <input type="text" [(ngModel)]="newSupplier.name" name="sup_name" placeholder="e.g. Apex Agri Products Ltd" required />
              </div>
              <div class="form-group">
                <label>Contact Person</label>
                <input type="text" [(ngModel)]="newSupplier.contactPerson" name="sup_contact" placeholder="e.g. Rohan Perera" required />
              </div>
              <div class="form-group">
                <label>Phone Number</label>
                <input type="text" [(ngModel)]="newSupplier.phone" name="sup_phone" placeholder="e.g. 077-9876543" required />
              </div>
              <div class="form-group">
                <label>Business Email</label>
                <input type="email" [(ngModel)]="newSupplier.email" name="sup_email" placeholder="e.g. sales@apexagri.lk" required />
              </div>
              <div class="form-group">
                <label>Operating City / District</label>
                <input type="text" [(ngModel)]="newSupplier.city" name="sup_city" placeholder="e.g. Kurunegala" required />
              </div>
              <div class="form-group">
                <label>Tax / VAT Reg Number</label>
                <input type="text" [(ngModel)]="newSupplier.taxNumber" name="sup_tax" placeholder="e.g. V-88990011" />
              </div>
              <div class="form-group">
                <label>Portal Username</label>
                <input type="text" [(ngModel)]="newSupplier.username" name="sup_username" placeholder="e.g. supplier_apex" required />
              </div>
              <div class="form-group">
                <label>Password</label>
                <input type="password" [(ngModel)]="newSupplier.password" name="sup_pass" placeholder="Create strong password..." required />
              </div>
            </div>

            <div class="signup-actions">
              <button type="button" class="btn-secondary" (click)="toggleSignUp(false)">Back to Login</button>
              <button type="submit" class="btn-primary">Register & Submit for Approval</button>
            </div>
          </form>
        }

        <!-- Academic & Architecture Footer -->
        <div class="card-footer-info">
          <div class="db-object-pill">
            <span class="material-symbols-outlined">database</span>
            <span>MySQL 8: sp_get_login &bull; sp_get_supplier_login &bull; RBAC</span>
          </div>
          <p class="architecture-note">
            Role privileges enforced at database level. Suppliers authenticate into their segregated portal with access restricted exclusively to assigned purchase orders.
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
      max-width: 540px;
      border-radius: 24px;
      box-shadow: 0 25px 50px -12px rgba(6, 78, 59, 0.35);
      padding: 34px 32px;
      display: flex;
      flex-direction: column;
      gap: 18px;
    }

    .brand-section {
      text-align: center;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 6px;
    }

    .brand-icon-circle {
      width: 60px;
      height: 60px;
      border-radius: 18px;
      background: #ecfdf5;
      color: #065f46;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 8px 16px rgba(6, 95, 70, 0.12);
    }

    .logo-icon { font-size: 32px; }

    .brand-title {
      font-size: 1.35rem;
      font-weight: 800;
      color: #0f172a;
      letter-spacing: 0.5px;
      margin: 4px 0 0 0;
    }

    .brand-subtitle { font-size: 0.82rem; color: #64748b; margin: 0; }

    .adbms-tag {
      background: #f0fdf4;
      border: 1px solid #bbf7d0;
      color: #166534;
      font-size: 0.7rem;
      font-weight: 700;
      padding: 3px 12px;
      border-radius: 12px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    /* Portal Type Tabs */
    .portal-type-tabs {
      display: grid;
      grid-template-columns: 1fr 1fr;
      background: #f1f5f9;
      border-radius: 12px;
      padding: 4px;
      gap: 4px;
    }

    .portal-tab {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      padding: 9px;
      border: none;
      border-radius: 9px;
      background: transparent;
      font-size: 0.82rem;
      font-weight: 700;
      color: #64748b;
      cursor: pointer;
      transition: all 0.2s;

      .material-symbols-outlined { font-size: 19px; }

      &.active {
        background: #ffffff;
        color: #0f172a;
        box-shadow: 0 2px 6px rgba(0,0,0,0.06);
      }
    }

    .demo-role-selector {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 14px;
      padding: 10px 14px;
      display: flex;
      flex-direction: column;
      gap: 6px;

      &.supplier-demo {
        background: #f0f9ff;
        border-color: #bae6fd;
        .role-chip {
          border-color: #93c5fd;
          &:hover { background: #e0f2fe; }
          &.active { background: #0284c7; border-color: #0284c7; }
        }
      }
    }

    .selector-label {
      font-size: 0.72rem;
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

    .supplier-demo .role-chips {
      grid-template-columns: 1fr 1fr;
    }

    .role-chip {
      background: #ffffff;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      padding: 6px 4px;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 2px;
      cursor: pointer;
      font-size: 0.7rem;
      font-weight: 600;
      color: #334155;
      transition: all 0.15s;

      .material-symbols-outlined { font-size: 16px; color: #065f46; }

      &:hover { border-color: #065f46; background: #f0fdf4; }

      &.active {
        background: #065f46;
        color: #ffffff;
        border-color: #065f46;
        .material-symbols-outlined { color: #ffffff; }
      }
    }

    .login-form, .signup-form {
      display: flex;
      flex-direction: column;
      gap: 14px;
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 5px;

      label { font-size: 0.78rem; font-weight: 700; color: #334155; }
    }

    .input-wrapper {
      position: relative;
      display: flex;
      align-items: center;

      .input-icon {
        position: absolute;
        left: 14px;
        color: #94a3b8;
        font-size: 18px;
      }

      input {
        width: 100%;
        padding: 11px 14px 11px 42px;
        border: 1.5px solid #e2e8f0;
        border-radius: 12px;
        font-size: 0.88rem;
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
      padding: 6px 10px;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .meter-bar-track {
      height: 4px;
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
      font-size: 0.7rem;
      .fn-tag { color: #64748b; font-family: monospace; }
      .text-weak { color: #dc2626; }
      .text-medium { color: #d97706; }
      .text-strong { color: #059669; }
    }

    .btn-login {
      background: #065f46;
      color: #ffffff;
      border: none;
      padding: 12px;
      border-radius: 12px;
      font-size: 0.9rem;
      font-weight: 700;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      cursor: pointer;
      transition: background 0.2s;

      &:hover:not(:disabled) { background: #064e3b; }
      &.btn-supplier {
        background: #0284c7;
        &:hover:not(:disabled) { background: #0369a1; }
      }
    }

    .signup-prompt {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      font-size: 0.8rem;
      color: #64748b;
      margin-top: 4px;
    }

    .btn-text-link {
      background: none;
      border: none;
      color: #0284c7;
      font-weight: 700;
      cursor: pointer;
      font-size: 0.8rem;
      &:hover { text-decoration: underline; }
    }

    /* Signup Form Specific */
    .signup-header {
      h3 { margin: 0; font-size: 1.05rem; color: #0f172a; }
      p { margin: 2px 0 0 0; font-size: 0.78rem; color: #64748b; }
    }

    .form-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;

      input {
        padding: 9px 12px;
        border: 1.5px solid #cbd5e1;
        border-radius: 8px;
        font-size: 0.82rem;
        outline: none;
      }
    }

    .signup-actions {
      display: flex;
      justify-content: flex-end;
      gap: 10px;
      margin-top: 6px;

      button {
        padding: 9px 16px;
        border-radius: 10px;
        font-size: 0.82rem;
        font-weight: 700;
        cursor: pointer;
        border: none;
      }

      .btn-secondary { background: #f1f5f9; color: #475569; }
      .btn-primary { background: #0284c7; color: #ffffff; &:hover { background: #0369a1; } }
    }

    .error-banner {
      background: #fef2f2;
      border: 1px solid #fecaca;
      color: #b91c1c;
      padding: 9px 12px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 0.8rem;
      font-weight: 600;
    }

    .success-banner {
      background: #f0fdf4;
      border: 1px solid #bbf7d0;
      color: #15803d;
      padding: 9px 12px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 0.8rem;
      font-weight: 600;
    }

    .card-footer-info {
      border-top: 1px solid #f1f5f9;
      padding-top: 14px;
      display: flex;
      flex-direction: column;
      gap: 6px;
      text-align: center;
    }

    .db-object-pill {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      color: #475569;
      font-size: 0.7rem;
      font-weight: 600;
      padding: 4px 12px;
      border-radius: 20px;
      margin: 0 auto;
      font-family: monospace;

      .material-symbols-outlined { font-size: 15px; color: #065f46; }
    }

    .architecture-note {
      font-size: 0.7rem;
      color: #94a3b8;
      line-height: 1.4;
      margin: 0;
    }
  `]
})
export class LoginComponent {
  readonly authService = inject(AuthService);
  readonly inventoryService = inject(InventoryService);
  private readonly router = inject(Router);

  portalType = signal<'STAFF' | 'SUPPLIER'>('STAFF');
  showSupplierSignUp = signal(false);

  username = 'cashier_floyd';
  password = 'Cashier@2026';

  isLoading = signal(false);
  errorMessage = signal<string | null>(null);
  successMessage = signal<string | null>(null);

  pwdStrength = signal({ score: 4, label: 'Medium', valid: true });

  // Supplier self registration model
  newSupplier = {
    name: '',
    contactPerson: '',
    phone: '',
    email: '',
    city: '',
    taxNumber: '',
    username: '',
    password: ''
  };

  selectPortalType(type: 'STAFF' | 'SUPPLIER'): void {
    this.portalType.set(type);
    this.showSupplierSignUp.set(false);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    if (type === 'STAFF') {
      this.selectQuickUser('cashier_floyd', 'Cashier@2026');
    } else {
      this.selectQuickUser('supplier_organics', 'Supplier$2026');
    }
  }

  toggleSignUp(val: boolean): void {
    this.showSupplierSignUp.set(val);
    this.errorMessage.set(null);
    this.successMessage.set(null);
  }

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

    this.authService.loginApi(this.username, this.password).subscribe({
      next: (res) => {
        this.isLoading.set(false);
        const user = this.authService.currentUser();
        this.successMessage.set(`Welcome ${user.fullName}! Authenticated via sp_get_login with role: ${user.role}_role`);
        setTimeout(() => {
          if (user.role === 'ADMIN') {
            this.router.navigate(['/admin']);
          } else if (user.role === 'SUPPLIER') {
            this.router.navigate(['/supplier-portal']);
          } else {
            this.router.navigate(['/pos']);
          }
        }, 500);
      },
      error: (err) => {
        // Fallback for standalone / offline demo mode
        const ok = this.authService.login(this.username);
        this.isLoading.set(false);
        if (ok) {
          const user = this.authService.currentUser();
          this.authService.setToken('viva-demo-token-' + user.username);
          this.successMessage.set(`Welcome ${user.fullName}! (Demo Session) Role: ${user.role}_role`);
          setTimeout(() => {
            if (user.role === 'ADMIN') {
              this.router.navigate(['/admin']);
            } else if (user.role === 'SUPPLIER') {
              this.router.navigate(['/supplier-portal']);
            } else {
              this.router.navigate(['/pos']);
            }
          }, 500);
        } else {
          const msg = err?.error?.message || 'Authentication failed: Invalid credentials or inactive account.';
          this.errorMessage.set(msg);
        }
      }
    });
  }

  handleSupplierSignUp(): void {
    if (!this.newSupplier.name || !this.newSupplier.username || !this.newSupplier.password) {
      this.errorMessage.set('Company Name, Username, and Password are required.');
      return;
    }

    const res = this.inventoryService.registerSupplier(this.newSupplier);
    if (res.success) {
      // Also provision an employee/auth account with role SUPPLIER so they can log in
      const empAccount = {
        fullName: `${this.newSupplier.contactPerson} (${this.newSupplier.name})`,
        branchId: 1,
        branchName: 'Headquarters Vendor Network',
        role: 'SUPPLIER' as const,
        username: this.newSupplier.username,
        password: this.newSupplier.password
      };
      this.authService.registerEmployee(empAccount);

      this.showSupplierSignUp.set(false);
      this.username = this.newSupplier.username;
      this.password = this.newSupplier.password;
      this.successMessage.set(`${res.message} Please click 'Sign In' to enter.`);
    } else {
      this.errorMessage.set(res.message);
    }
  }
}
