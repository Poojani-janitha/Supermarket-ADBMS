import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../../core/services/auth.service';
import { CustomerService } from '../../../../core/services/customer.service';
import { Employee } from '../../../../core/models';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-container">
      <!-- Header -->
      <div class="page-header">
        <div>
          <h1 class="page-title">Enterprise Security & Administration</h1>
          <p class="page-subtitle">
            Managed by Member 5 | MySQL 8 Roles (CREATE ROLE) | Procedures: sp_deactivate_employee, sp_change_user_role | Triggers: trg_employee_audit
          </p>
        </div>
        <div class="role-badge-box">
          <span class="role-label">Active Session:</span>
          <span class="badge-pill badge-primary">{{ authService.currentUser().fullName }} ({{ authService.currentUser().role }}_ROLE)</span>
        </div>
      </div>

      <!-- Notification Toast -->
      @if (actionFeedback()) {
        <div class="action-alert" [class.success]="actionFeedback()!.success" [class.error]="!actionFeedback()!.success">
          <span class="material-symbols-outlined">
            {{ actionFeedback()!.success ? 'check_circle' : 'error' }}
          </span>
          <span>{{ actionFeedback()!.message }}</span>
          <button class="close-toast-btn" (click)="actionFeedback.set(null)">&times;</button>
        </div>
      }

      <!-- Top Tab Switcher -->
      <div class="nav-tabs-bar">
        <button
          class="tab-btn"
          [class.active]="activeTab() === 'EMPLOYEES'"
          (click)="activeTab.set('EMPLOYEES')"
        >
          <span class="material-symbols-outlined">badge</span>
          Employee Management & RBAC (sp_change_user_role)
        </button>
        <button
          class="tab-btn"
          [class.active]="activeTab() === 'MASKING'"
          (click)="activeTab.set('MASKING')"
        >
          <span class="material-symbols-outlined">visibility_off</span>
          Data Masking Demo (fn_mask_phone)
        </button>
        <button
          class="tab-btn"
          [class.active]="activeTab() === 'AUDIT'"
          (click)="activeTab.set('AUDIT')"
        >
          <span class="material-symbols-outlined">history</span>
          Trigger Audit Logs (trg_employee_audit)
        </button>
        <button
          class="tab-btn"
          [class.active]="activeTab() === 'MATRIX'"
          (click)="activeTab.set('MATRIX')"
        >
          <span class="material-symbols-outlined">table_view</span>
          MySQL 8 Role Privilege Matrix
        </button>
      </div>

      <!-- ================= TAB 1: EMPLOYEES & RBAC ================= -->
      @if (activeTab() === 'EMPLOYEES') {
        <div class="table-card">
          <div class="card-inner-header">
            <div>
              <h3>Employee Directory (employee table)</h3>
              <p class="card-meta">Manage roles and deactivations enforced via stored procedures and triggers</p>
            </div>
            <div style="display: flex; gap: 8px;">
              <button class="btn-pill btn-secondary" (click)="testSelfLockout()">
                <span class="material-symbols-outlined">lock_clock</span> Test Self-Lockout Rule
              </button>
              <button class="btn-pill btn-primary" (click)="openRegisterModal()">
                <span class="material-symbols-outlined">person_add</span> Register New Employee
              </button>
            </div>
          </div>

          <table class="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>EMPLOYEE NAME</th>
                <th>USERNAME</th>
                <th>ASSIGNED BRANCH</th>
                <th>HIRE DATE</th>
                <th>DATABASE ROLE</th>
                <th>STATUS</th>
                <th style="text-align: right;">ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              @for (emp of authService.employees(); track emp.employeeId) {
                <tr [class.inactive-row]="!emp.isActive">
                  <td><span class="code-sku">#{{ emp.employeeId }}</span></td>
                  <td><strong>{{ emp.fullName }}</strong></td>
                  <td><span class="username-pill">{{ emp.username }}</span></td>
                  <td>{{ emp.branchName }}</td>
                  <td>{{ emp.hireDate }}</td>
                  <td>
                    <span
                      class="badge-pill"
                      [class.badge-admin]="emp.role === 'ADMIN'"
                      [class.badge-mgr]="emp.role === 'MANAGER'"
                      [class.badge-cashier]="emp.role === 'CASHIER'"
                    >
                      {{ emp.role }}
                    </span>
                  </td>
                  <td>
                    @if (emp.isActive) {
                      <span class="badge-pill badge-active">ACTIVE</span>
                    } @else {
                      <span class="badge-pill badge-danger">DEACTIVATED</span>
                    }
                  </td>
                  <td style="text-align: right;">
                    <div class="action-buttons-group">
                      <button class="btn-pill btn-sm btn-outline" (click)="openRoleModal(emp)">
                        <span class="material-symbols-outlined">edit</span> Change Role
                      </button>
                      @if (emp.isActive) {
                        <button
                          class="btn-pill btn-sm btn-danger-outline"
                          (click)="handleDeactivate(emp.employeeId)"
                          title="Safe deactivation via sp_deactivate_employee"
                        >
                          <span class="material-symbols-outlined">block</span> Deactivate
                        </button>
                      } @else {
                        <button class="btn-pill btn-sm btn-secondary" (click)="authService.reactivateEmployee(emp.employeeId)">
                          <span class="material-symbols-outlined">restore</span> Reactivate
                        </button>
                      }
                    </div>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }

      <!-- ================= TAB 2: DATA MASKING ================= -->
      @if (activeTab() === 'MASKING') {
        <div class="masking-container">
          <div class="masking-banner">
            <div class="masking-info">
              <span class="material-symbols-outlined shield-icon">shield_lock</span>
              <div>
                <strong>Dynamic Data Masking (fn_mask_phone & v_masked_customer_directory):</strong>
                <p>
                  Protects customer Personally Identifiable Information (PII) against unauthorized exposure. In accordance with least-privilege standards, cashiers accessing the POS only query masked numbers (<code>077****567</code>), while privileged managers see full contact details.
                </p>
              </div>
            </div>
            <button
              class="btn-pill"
              [class.btn-primary]="customerService.isDataMasked()"
              [class.btn-outline]="!customerService.isDataMasked()"
              (click)="customerService.toggleMasking()"
            >
              <span class="material-symbols-outlined">
                {{ customerService.isDataMasked() ? 'visibility_off' : 'visibility' }}
              </span>
              {{ customerService.isDataMasked() ? 'Masking ACTIVE (Cashier View)' : 'Masking OFF (Admin View)' }}
            </button>
          </div>

          <div class="table-card">
            <table class="data-table">
              <thead>
                <tr>
                  <th>CUSTOMER ID</th>
                  <th>FULL NAME</th>
                  <th>PHONE NUMBER (fn_mask_phone)</th>
                  <th>LOYALTY POINTS</th>
                  <th>TIER (fn_customer_tier)</th>
                  <th>REGISTERED DATE</th>
                </tr>
              </thead>
              <tbody>
                @for (c of customerService.displayedCustomers(); track c.id) {
                  <tr>
                    <td><span class="code-sku">#{{ c.id }}</span></td>
                    <td><strong>{{ c.fullName }}</strong></td>
                    <td>
                      <span class="masked-phone" [class.highlight]="customerService.isDataMasked()">
                        {{ c.phone }}
                      </span>
                    </td>
                    <td><strong>{{ c.loyaltyPoints }} pts</strong></td>
                    <td>
                      <span
                        class="badge-pill"
                        [class.badge-gold]="c.tier === 'GOLD'"
                        [class.badge-silver]="c.tier === 'SILVER'"
                        [class.badge-bronze]="c.tier === 'BRONZE'"
                      >
                        {{ c.tier }}
                      </span>
                    </td>
                    <td>{{ c.registeredDate }}</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      }

      <!-- ================= TAB 3: AUDIT & TRIGGER LOGS ================= -->
      @if (activeTab() === 'AUDIT') {
        <div class="grid-2-col">
          <!-- Employee Audit Log (Triggered by trg_employee_audit) -->
          <div class="section-card">
            <div class="card-title-row">
              <span class="material-symbols-outlined" style="color: #065f46;">security_update_good</span>
              <div>
                <h3>Employee Trigger Audit Log (employee_audit_log)</h3>
                <p class="card-meta">Automatically recorded by MySQL Trigger: trg_employee_audit (AFTER UPDATE ON employee)</p>
              </div>
            </div>

            <table class="data-table">
              <thead>
                <tr>
                  <th>ACTION</th>
                  <th>EMPLOYEE</th>
                  <th>OLD &rarr; NEW VALUE</th>
                  <th>MODIFIED BY</th>
                  <th>TIME</th>
                </tr>
              </thead>
              <tbody>
                @for (log of authService.employeeAuditLogs(); track log.logId) {
                  <tr>
                    <td>
                      <span
                        class="badge-pill"
                        [class.badge-admin]="log.action === 'ROLE_CHANGE'"
                        [class.badge-danger]="log.action === 'DEACTIVATE'"
                        [class.badge-mgr]="log.action === 'BRANCH_TRANSFER'"
                        [class.badge-active]="log.action === 'REACTIVATE'"
                      >
                        {{ log.action }}
                      </span>
                    </td>
                    <td><strong>{{ log.employeeName }}</strong></td>
                    <td>
                      <span class="audit-change-val">{{ log.oldValue }}</span>
                      &rarr;
                      <span class="audit-change-val highlight">{{ log.newValue }}</span>
                    </td>
                    <td><span class="username-pill">{{ log.modifiedBy }}</span></td>
                    <td class="time-meta">{{ log.modifiedAt }}</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>

          <!-- Security Event Log -->
          <div class="section-card">
            <div class="card-title-row">
              <span class="material-symbols-outlined" style="color: #dc2626;">crisis_alert</span>
              <div>
                <h3>Security Event Log (security_event_log)</h3>
                <p class="card-meta">High-priority authentication and authorization events</p>
              </div>
            </div>

            <table class="data-table">
              <thead>
                <tr>
                  <th>EVENT</th>
                  <th>DETAILS</th>
                  <th>USER & IP</th>
                  <th>TIME</th>
                </tr>
              </thead>
              <tbody>
                @for (sec of authService.securityLogs(); track sec.logId) {
                  <tr>
                    <td>
                      <span
                        class="badge-pill"
                        [class.badge-active]="sec.eventType === 'LOGIN_SUCCESS'"
                        [class.badge-admin]="sec.eventType === 'ROLE_ASSIGN'"
                        [class.badge-danger]="sec.eventType === 'EMPLOYEE_DEACTIVATED' || sec.eventType === 'UNAUTHORIZED_ACCESS'"
                      >
                        {{ sec.eventType }}
                      </span>
                    </td>
                    <td>{{ sec.description }}</td>
                    <td>
                      <span class="username-pill">{{ sec.username }}</span><br>
                      <span class="time-meta">{{ sec.ipAddress }}</span>
                    </td>
                    <td class="time-meta">{{ sec.createdAt }}</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      }

      <!-- ================= TAB 4: MYSQL 8 RBAC MATRIX ================= -->
      @if (activeTab() === 'MATRIX') {
        <div class="section-card">
          <div class="card-title-row">
            <span class="material-symbols-outlined" style="color: #065f46;">shield_with_house</span>
            <div>
              <h3>MySQL 8 Role-Based Access Control (RBAC) Matrix</h3>
              <p class="card-meta">Configured via CREATE ROLE cashier_role, manager_role, admin_role</p>
            </div>
          </div>

          <table class="data-table rbac-table">
            <thead>
              <tr>
                <th>DATABASE OBJECT / TOPIC</th>
                <th>CASHIER ROLE (cashier_role)</th>
                <th>MANAGER ROLE (manager_role)</th>
                <th>ADMIN ROLE (admin_role)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>sales_order & order_item</strong></td>
                <td><span class="grant-badge yes">SELECT, INSERT</span></td>
                <td><span class="grant-badge yes">ALL PRIVILEGES</span></td>
                <td><span class="grant-badge yes">ALL PRIVILEGES</span></td>
              </tr>
              <tr>
                <td><strong>v_masked_customer_directory</strong></td>
                <td><span class="grant-badge yes">SELECT (Masked Phone)</span></td>
                <td><span class="grant-badge yes">SELECT (Raw Customer)</span></td>
                <td><span class="grant-badge yes">ALL PRIVILEGES</span></td>
              </tr>
              <tr>
                <td><strong>sp_place_order & sp_cancel_order</strong></td>
                <td><span class="grant-badge yes">EXECUTE</span></td>
                <td><span class="grant-badge yes">EXECUTE</span></td>
                <td><span class="grant-badge yes">EXECUTE</span></td>
              </tr>
              <tr>
                <td><strong>inventory (sp_add_stock, sp_transfer_stock)</strong></td>
                <td><span class="grant-badge no">DENIED</span></td>
                <td><span class="grant-badge yes">EXECUTE</span></td>
                <td><span class="grant-badge yes">EXECUTE</span></td>
              </tr>
              <tr>
                <td><strong>product & discount_rule CRUD</strong></td>
                <td><span class="grant-badge no">DENIED</span></td>
                <td><span class="grant-badge yes">SELECT, INSERT, UPDATE</span></td>
                <td><span class="grant-badge yes">ALL PRIVILEGES</span></td>
              </tr>
              <tr>
                <td><strong>employee_audit_log & security_event_log</strong></td>
                <td><span class="grant-badge no">DENIED</span></td>
                <td><span class="grant-badge yes">SELECT</span></td>
                <td><span class="grant-badge yes">ALL PRIVILEGES</span></td>
              </tr>
              <tr>
                <td><strong>sp_deactivate_employee & sp_change_user_role</strong></td>
                <td><span class="grant-badge no">DENIED</span></td>
                <td><span class="grant-badge no">DENIED</span></td>
                <td><span class="grant-badge yes">EXECUTE</span></td>
              </tr>
            </tbody>
          </table>

          <div class="db-user-box">
            <h4>Dedicated Least-Privilege Database Accounts:</h4>
            <div class="db-users-grid">
              <div class="db-user-card">
                <strong>app_user</strong>
                <span>Backend Spring Boot connection pool (HikariCP)</span>
              </div>
              <div class="db-user-card">
                <strong>report_user</strong>
                <span>Read-only analytics and BI reporting queries</span>
              </div>
              <div class="db-user-card">
                <strong>etl_user</strong>
                <span>50,000+ orders bulk seeder & scheduled nightly events</span>
              </div>
              <div class="db-user-card">
                <strong>admin_user</strong>
                <span>Full DBA privileges, Point-in-time recovery, user creation</span>
              </div>
            </div>
          </div>
        </div>
      }

      <!-- MODAL: CHANGE ROLE (sp_change_user_role) -->
      @if (selectedEmployeeForRole()) {
        <div class="modal-backdrop">
          <div class="modal-card">
            <div class="modal-header">
              <h3>Change Employee Role (sp_change_user_role)</h3>
              <button class="close-btn" (click)="selectedEmployeeForRole.set(null)">&times;</button>
            </div>
            <div class="modal-body">
              <p>Updating role for <strong>{{ selectedEmployeeForRole()!.fullName }}</strong> ({{ selectedEmployeeForRole()!.username }}).</p>
              <div class="form-group">
                <label>Select New Role:</label>
                <select [(ngModel)]="newRoleSelection" class="select-input">
                  <option value="CASHIER">CASHIER (cashier_role)</option>
                  <option value="MANAGER">MANAGER (manager_role)</option>
                  <option value="ADMIN">ADMIN (admin_role)</option>
                </select>
              </div>
              <div class="info-note">
                <span class="material-symbols-outlined">info</span>
                <span>This procedure will automatically fire <code>trg_employee_audit</code> and log old vs new role in <code>employee_audit_log</code>.</span>
              </div>
            </div>
            <div class="modal-footer">
              <button class="btn-pill btn-secondary" (click)="selectedEmployeeForRole.set(null)">Cancel</button>
              <button class="btn-pill btn-primary" (click)="confirmRoleChange()">Confirm & Execute</button>
            </div>
          </div>
        </div>
      }

      <!-- MODAL: REGISTER NEW EMPLOYEE -->
      @if (isRegisterModalOpen()) {
        <div class="modal-backdrop">
          <div class="modal-card">
            <div class="modal-header">
              <h3>Register New Employee & Provision User</h3>
              <button class="close-btn" (click)="isRegisterModalOpen.set(false)">&times;</button>
            </div>
            <div class="modal-body">
              <div class="form-group">
                <label>Full Name:</label>
                <input type="text" [(ngModel)]="newEmpName" placeholder="e.g. Sunil Perera" class="select-input" />
              </div>
              <div class="form-group">
                <label>Assigned Branch:</label>
                <select [(ngModel)]="newEmpBranchId" class="select-input">
                  <option [value]="1">Colombo Central Flagship</option>
                  <option [value]="2">Kandy City Centre Branch</option>
                  <option [value]="3">Galle Fort Supermarket</option>
                </select>
              </div>
              <div class="form-group">
                <label>Database Role:</label>
                <select [(ngModel)]="newEmpRole" class="select-input">
                  <option value="CASHIER">CASHIER (cashier_role)</option>
                  <option value="MANAGER">MANAGER (manager_role)</option>
                  <option value="ADMIN">ADMIN (admin_role)</option>
                </select>
              </div>
              <div class="form-group">
                <label>System Username (Unique):</label>
                <input type="text" [(ngModel)]="newEmpUsername" placeholder="e.g. cashier_sunil" class="select-input" />
              </div>
              <div class="form-group">
                <label>Password (fn_check_password_strength):</label>
                <input type="password" [(ngModel)]="newEmpPassword" placeholder="Min 8 chars, mixed case, numbers" class="select-input" />
              </div>
              <div class="info-note">
                <span class="material-symbols-outlined">shield</span>
                <span>Enforces unique username constraint and checks password strength before inserting into <code>employee</code> table and firing <code>trg_employee_audit</code>.</span>
              </div>
            </div>
            <div class="modal-footer">
              <button class="btn-pill btn-secondary" (click)="isRegisterModalOpen.set(false)">Cancel</button>
              <button class="btn-pill btn-primary" (click)="confirmRegisterEmployee()">Provision & Save</button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .page-container {
      padding: 24px 30px;
      display: flex;
      flex-direction: column;
      gap: 20px;
      height: 100vh;
      overflow-y: auto;
    }

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .page-title {
      font-size: 1.5rem;
      font-weight: 800;
      color: var(--text-main);
      margin: 0;
    }

    .page-subtitle {
      font-size: 0.82rem;
      color: var(--text-muted);
      margin: 2px 0 0 0;
    }

    .role-badge-box {
      display: flex;
      align-items: center;
      gap: 8px;
      background: #ffffff;
      padding: 6px 14px;
      border-radius: var(--radius-pill);
      border: 1px solid var(--border-subtle);
    }

    .role-label {
      font-size: 0.75rem;
      color: var(--text-muted);
      font-weight: 600;
    }

    .action-alert {
      padding: 12px 18px;
      border-radius: var(--radius-md);
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 0.85rem;
      font-weight: 600;
      position: relative;

      &.success {
        background: #ecfdf5;
        border: 1px solid #a7f3d0;
        color: #065f46;
      }

      &.error {
        background: #fef2f2;
        border: 1px solid #fecaca;
        color: #b91c1c;
      }

      .close-toast-btn {
        margin-left: auto;
        background: none;
        border: none;
        font-size: 1.2rem;
        cursor: pointer;
        color: inherit;
      }
    }

    .nav-tabs-bar {
      display: flex;
      gap: 8px;
      border-bottom: 2px solid var(--border-subtle);
      padding-bottom: 6px;
    }

    .tab-btn {
      display: flex;
      align-items: center;
      gap: 8px;
      background: none;
      border: none;
      padding: 10px 18px;
      border-radius: 12px;
      font-size: 0.84rem;
      font-weight: 700;
      color: var(--text-muted);
      cursor: pointer;
      transition: all 0.2s;

      .material-symbols-outlined {
        font-size: 19px;
      }

      &:hover {
        background: #f1f5f9;
        color: var(--text-main);
      }

      &.active {
        background: var(--primary-green-light);
        color: var(--primary-green);
      }
    }

    .table-card, .section-card {
      background: #ffffff;
      border-radius: var(--radius-lg);
      border: 1px solid var(--border-subtle);
      box-shadow: var(--shadow-card);
      padding: 20px;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .card-inner-header, .card-title-row {
      display: flex;
      justify-content: space-between;
      align-items: center;

      h3 {
        font-size: 1.05rem;
        font-weight: 800;
        margin: 0;
        color: var(--text-main);
      }

      .card-meta {
        font-size: 0.78rem;
        color: var(--text-muted);
        margin: 2px 0 0 0;
      }
    }

    .data-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.85rem;

      th {
        text-align: left;
        padding: 10px 12px;
        color: var(--text-muted);
        font-size: 0.72rem;
        font-weight: 700;
        text-transform: uppercase;
        border-bottom: 1px solid var(--border-subtle);
      }

      td {
        padding: 12px;
        border-bottom: 1px solid #f8fafc;
        vertical-align: middle;
      }

      tr.inactive-row td {
        opacity: 0.55;
        background: #f8fafc;
      }
    }

    .code-sku {
      font-family: monospace;
      font-weight: 700;
      color: #64748b;
      background: #f1f5f9;
      padding: 2px 6px;
      border-radius: 4px;
    }

    .username-pill {
      font-family: monospace;
      color: #0369a1;
      font-weight: 600;
    }

    .badge-pill {
      padding: 4px 10px;
      border-radius: 12px;
      font-size: 0.72rem;
      font-weight: 700;
      text-transform: uppercase;
      display: inline-block;

      &.badge-primary { background: #ecfdf5; color: #065f46; }
      &.badge-admin { background: #fee2e2; color: #991b1b; }
      &.badge-mgr { background: #e0e7ff; color: #3730a3; }
      &.badge-cashier { background: #fef3c7; color: #92400e; }
      &.badge-active { background: #dcfce7; color: #166534; }
      &.badge-danger { background: #fee2e2; color: #b91c1c; }
      &.badge-gold { background: #fef3c7; color: #b45309; }
      &.badge-silver { background: #f1f5f9; color: #475569; }
      &.badge-bronze { background: #ffedd5; color: #c2410c; }
    }

    .action-buttons-group {
      display: flex;
      justify-content: flex-end;
      gap: 8px;
    }

    .btn-pill {
      padding: 7px 14px;
      border-radius: var(--radius-pill);
      font-size: 0.8rem;
      font-weight: 700;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      border: 1px solid transparent;

      &.btn-sm {
        padding: 5px 10px;
        font-size: 0.74rem;
        .material-symbols-outlined { font-size: 15px; }
      }

      &.btn-primary { background: var(--primary-green); color: #ffffff; }
      &.btn-secondary { background: #f1f5f9; color: #334155; }
      &.btn-outline { background: #ffffff; border-color: var(--border-subtle); color: #334155; }
      &.btn-danger-outline { background: #ffffff; border-color: #fca5a5; color: #dc2626; }
    }

    .masking-container {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .masking-banner {
      background: #f0fdf4;
      border: 1.5px dashed var(--primary-green);
      border-radius: var(--radius-md);
      padding: 16px 20px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 20px;
    }

    .masking-info {
      display: flex;
      align-items: center;
      gap: 14px;

      p {
        margin: 4px 0 0 0;
        font-size: 0.8rem;
        color: #475569;
        line-height: 1.4;
      }
    }

    .shield-icon {
      font-size: 36px;
      color: var(--primary-green);
    }

    .masked-phone {
      font-family: monospace;
      font-weight: 700;

      &.highlight {
        color: #059669;
        background: #ecfdf5;
        padding: 2px 6px;
        border-radius: 4px;
      }
    }

    .grid-2-col {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
    }

    .audit-change-val {
      font-family: monospace;
      font-size: 0.78rem;

      &.highlight {
        color: var(--primary-green);
        font-weight: 700;
      }
    }

    .time-meta {
      font-size: 0.72rem;
      color: #94a3b8;
    }

    .rbac-table {
      margin-top: 10px;

      th, td {
        padding: 12px;
      }
    }

    .grant-badge {
      display: inline-block;
      padding: 4px 10px;
      border-radius: 8px;
      font-size: 0.74rem;
      font-weight: 700;

      &.yes { background: #dcfce7; color: #166534; }
      &.no { background: #fee2e2; color: #991b1b; }
    }

    .db-user-box {
      margin-top: 14px;
      background: #f8fafc;
      border-radius: 12px;
      padding: 16px;

      h4 {
        margin: 0 0 10px 0;
        font-size: 0.88rem;
        color: #334155;
      }
    }

    .db-users-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 12px;
    }

    .db-user-card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      padding: 10px;
      display: flex;
      flex-direction: column;
      gap: 4px;

      strong {
        font-family: monospace;
        color: var(--primary-green);
        font-size: 0.85rem;
      }

      span {
        font-size: 0.72rem;
        color: #64748b;
      }
    }

    /* Modal styles */
    .modal-backdrop {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.45);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
    }

    .modal-card {
      background: #ffffff;
      width: 440px;
      border-radius: 16px;
      box-shadow: var(--shadow-modal);
      padding: 24px;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;

      h3 { margin: 0; font-size: 1.1rem; }
      .close-btn { background: none; border: none; font-size: 1.4rem; cursor: pointer; }
    }

    .modal-body {
      display: flex;
      flex-direction: column;
      gap: 14px;
      font-size: 0.85rem;
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 6px;

      label { font-weight: 700; font-size: 0.8rem; }
    }

    .select-input {
      padding: 10px;
      border: 1.5px solid var(--border-subtle);
      border-radius: 8px;
      font-size: 0.85rem;
      outline: none;
    }

    .info-note {
      background: #f8fafc;
      border-radius: 8px;
      padding: 10px;
      display: flex;
      gap: 8px;
      font-size: 0.75rem;
      color: #64748b;
      line-height: 1.4;

      .material-symbols-outlined { font-size: 18px; color: #0284c7; }
    }

    .modal-footer {
      display: flex;
      justify-content: flex-end;
      gap: 10px;
    }
  `]
})
export class AdminDashboardComponent {
  readonly authService = inject(AuthService);
  readonly customerService = inject(CustomerService);

  activeTab = signal<'EMPLOYEES' | 'MASKING' | 'AUDIT' | 'MATRIX'>('EMPLOYEES');
  actionFeedback = signal<{ success: boolean; message: string } | null>(null);

  selectedEmployeeForRole = signal<Employee | null>(null);
  newRoleSelection: 'ADMIN' | 'MANAGER' | 'CASHIER' = 'CASHIER';

  openRoleModal(emp: Employee): void {
    this.selectedEmployeeForRole.set(emp);
    this.newRoleSelection = emp.role === 'SUPPLIER' ? 'CASHIER' : emp.role;
  }

  confirmRoleChange(): void {
    const emp = this.selectedEmployeeForRole();
    if (!emp) return;

    const res = this.authService.changeUserRole(emp.employeeId, this.newRoleSelection);
    this.actionFeedback.set(res);
    this.selectedEmployeeForRole.set(null);
  }

  handleDeactivate(empId: number): void {
    const res = this.authService.deactivateEmployee(empId);
    this.actionFeedback.set(res);
  }

  testSelfLockout(): void {
    const myId = this.authService.currentUser().employeeId;
    const res = this.authService.deactivateEmployee(myId);
    this.actionFeedback.set(res);
  }

  // Register Employee state
  isRegisterModalOpen = signal<boolean>(false);
  newEmpName = '';
  newEmpBranchId = 1;
  newEmpRole: 'ADMIN' | 'MANAGER' | 'CASHIER' = 'CASHIER';
  newEmpUsername = '';
  newEmpPassword = '';

  openRegisterModal(): void {
    this.newEmpName = '';
    this.newEmpBranchId = 1;
    this.newEmpRole = 'CASHIER';
    this.newEmpUsername = '';
    this.newEmpPassword = '';
    this.isRegisterModalOpen.set(true);
  }

  confirmRegisterEmployee(): void {
    const branchNames: { [key: number]: string } = {
      1: 'Colombo Central Flagship',
      2: 'Kandy City Centre Branch',
      3: 'Galle Fort Supermarket'
    };

    const res = this.authService.registerEmployee({
      fullName: this.newEmpName,
      branchId: this.newEmpBranchId,
      branchName: branchNames[this.newEmpBranchId] || 'Colombo Central Flagship',
      role: this.newEmpRole,
      username: this.newEmpUsername,
      password: this.newEmpPassword
    });

    this.actionFeedback.set(res);
    if (res.success) {
      this.isRegisterModalOpen.set(false);
    }
  }
}
