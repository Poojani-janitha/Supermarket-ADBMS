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
          <p class="brand-subtitle">Point of Sale & Retail Management System</p>
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
                {{ portalType() === 'STAFF' ? 'Employee Username' : 'Supplier Account Username' }}
              </label>
              <div class="input-wrapper">
                <span class="material-symbols-outlined input-icon">person</span>
                <input
                  type="text"
                  [(ngModel)]="username"
                  name="username"
                  placeholder="Enter your username..."
                  required
                />
              </div>
            </div>

            <div class="form-group">
              <label class="input-label">Password</label>
              <div class="input-wrapper">
                <span class="material-symbols-outlined input-icon">lock</span>
                <input
                  type="password"
                  [(ngModel)]="password"
                  name="password"
                  placeholder="Enter your password..."
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
                    <span class="fn-tag">Password Strength:</span>
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
          <form (ngSubmit)="handleSupplierSignUp()" novalidate class="signup-form">
            <div class="signup-header">
              <h3>Supplier Self-Registration</h3>
              <p>Register your wholesale company to receive purchase orders from Emerald Supermarket.</p>
            </div>

            <div class="form-grid">
              <div class="form-group">
                <label>Company / Supplier Name *</label>
                <input type="text" [(ngModel)]="newSupplier.name" name="sup_name" placeholder="e.g. Apex Agri Products Ltd" required />
              </div>
              <div class="form-group">
                <label>Contact Person</label>
                <input type="text" [(ngModel)]="newSupplier.contactPerson" name="sup_contact" placeholder="e.g. Rohan Perera" />
              </div>
              <div class="form-group">
                <label>Phone Number</label>
                <input type="text" [(ngModel)]="newSupplier.phone" name="sup_phone" placeholder="e.g. 077-9876543" />
              </div>
              <div class="form-group">
                <label>Business Email</label>
                <input type="email" [(ngModel)]="newSupplier.email" name="sup_email" placeholder="e.g. sales@apexagri.lk" />
              </div>
              <div class="form-group">
                <label>Operating City / District</label>
                <input type="text" [(ngModel)]="newSupplier.city" name="sup_city" placeholder="e.g. Kurunegala" />
              </div>
              <div class="form-group">
                <label>Tax / VAT Reg Number</label>
                <input type="text" [(ngModel)]="newSupplier.taxNumber" name="sup_tax" placeholder="e.g. V-88990011" />
              </div>
              <div class="form-group">
                <label>Portal Username *</label>
                <input type="text" [(ngModel)]="newSupplier.username" name="sup_username" placeholder="e.g. supplier_apex" required />
              </div>
              <div class="form-group">
                <label>Password *</label>
                <input type="password" [(ngModel)]="newSupplier.password" name="sup_pass" placeholder="Create strong password..." required />
              </div>
            </div>

            <div class="signup-actions">
              <button type="button" class="btn-secondary" (click)="toggleSignUp(false)">Back to Login</button>
              <button type="button" class="btn-primary" (click)="handleSupplierSignUp()" [disabled]="isLoading()">
                @if (isLoading()) {
                  <span>Saving supplier...</span>
                } @else {
                  <span>Register & Submit for Approval</span>
                }
              </button>
            </div>
          </form>
        }
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

    .supplier-submode-tabs {
      display: flex;
      gap: 6px;
      margin-bottom: 12px;
      background: #e2e8f0;
      padding: 4px;
      border-radius: 10px;
    }

    .submode-tab {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      padding: 8px;
      border: none;
      border-radius: 8px;
      background: transparent;
      font-size: 0.78rem;
      font-weight: 700;
      color: #64748b;
      cursor: pointer;
      transition: all 0.2s;

      .material-symbols-outlined { font-size: 17px; }

      &.active {
        background: #0284c7;
        color: #ffffff;
        box-shadow: 0 2px 5px rgba(2, 132, 199, 0.25);
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
      font-size: 0.72rem;
      .fn-tag { color: #64748b; font-family: inherit; font-weight: 600; }
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
  `]
})
export class LoginComponent {
  readonly authService = inject(AuthService);
  readonly inventoryService = inject(InventoryService);
  private readonly router = inject(Router);

  portalType = signal<'STAFF' | 'SUPPLIER'>('STAFF');
  showSupplierSignUp = signal(false);

  username = '';
  password = '';

  isLoading = signal(false);
  errorMessage = signal<string | null>(null);
  successMessage = signal<string | null>(null);

  pwdStrength = signal({ score: 0, label: '', valid: false });

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
    this.username = '';
    this.password = '';
    this.pwdStrength.set({ score: 0, label: '', valid: false });
  }

  toggleSignUp(val: boolean): void {
    this.showSupplierSignUp.set(val);
    this.errorMessage.set(null);
    this.successMessage.set(null);
    if (val) {
      if (this.username && !this.newSupplier.username) {
        this.newSupplier.username = this.username.trim();
      }
      if (this.password && !this.newSupplier.password) {
        this.newSupplier.password = this.password;
      }
      if (this.username && !this.newSupplier.name) {
        this.newSupplier.name = this.username.trim();
      }
    }
  }

  onPasswordInput(val: string): void {
    if (!val) {
      this.pwdStrength.set({ score: 0, label: '', valid: false });
      return;
    }
    const res = this.authService.checkPasswordStrength(val);
    this.pwdStrength.set(res);
  }

  handleLogin(): void {
    if (!this.username.trim() || !this.password) {
      this.errorMessage.set('Please enter both username and password.');
      return;
    }

    this.errorMessage.set(null);
    this.successMessage.set(null);
    this.isLoading.set(true);

    this.authService.loginApi(this.username.trim(), this.password).subscribe({
      next: (res) => {
        this.isLoading.set(false);
        const user = this.authService.currentUser();
        this.successMessage.set(`Welcome ${user.fullName}! Logged in as ${user.role}`);
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
        this.isLoading.set(false);
        if (this.portalType() === 'SUPPLIER') {
          this.errorMessage.set(`Supplier account '${this.username}' was not found. Please click 'New Supplier Self-Registration' above to register.`);
        } else {
          const msg = err?.error?.message || err?.message || 'Authentication failed: Invalid credentials or inactive account.';
          this.errorMessage.set(msg);
        }
      }
    });
  }

  handleSupplierSignUp(): void {
    const rawUsername = (this.newSupplier.username || this.username || '').trim();
    const rawPassword = this.newSupplier.password || this.password;
    const rawName = (this.newSupplier.name || rawUsername || '').trim();

    if (!rawUsername || !rawPassword) {
      this.errorMessage.set('Username and Password are required to create a supplier account.');
      return;
    }

    this.errorMessage.set(null);
    this.successMessage.set(null);
    this.isLoading.set(true);

    const payload = {
      name: rawName,
      contactPerson: this.newSupplier.contactPerson?.trim() || rawName,
      phone: this.newSupplier.phone?.trim() || '077-0000000',
      email: this.newSupplier.email?.trim() || `${rawUsername}@vendor.lk`,
      city: this.newSupplier.city?.trim() || 'Colombo',
      taxNumber: this.newSupplier.taxNumber?.trim() || '',
      username: rawUsername,
      password: rawPassword
    };

    this.authService.registerSupplierHttp(payload).subscribe({
      next: (res: any) => {
        this.isLoading.set(false);
        this.successMessage.set(`Supplier '${payload.name}' saved to database successfully! Entering vendor portal...`);
        this.inventoryService.loadSuppliers();

        // Automatic instant login into vendor portal
        setTimeout(() => {
          this.authService.loginApi(payload.username, payload.password).subscribe({
            next: () => {
              this.router.navigate(['/supplier-portal']);
            },
            error: () => {
              this.showSupplierSignUp.set(false);
              this.username = payload.username;
              this.password = payload.password;
            }
          });
        }, 500);
      },
      error: (err: any) => {
        this.isLoading.set(false);
        const msg = err?.error?.message || err?.message || 'Supplier registration failed. Please verify credentials.';
        this.errorMessage.set(msg);
      }
    });
  }
}
