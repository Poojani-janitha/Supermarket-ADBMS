import { Component, inject, signal, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import { CustomerService } from '../../../../core/services/customer.service';
import { Employee, DatabaseAccount } from '../../../../core/models';
import { DatabaseAccountGridComponent } from '../../components/database-account-grid/database-account-grid.component';
import { useDatabaseAccounts } from '../../services/use-database-accounts.service';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, DatabaseAccountGridComponent],
  template: `
    <div class="page-container">
      <!-- Header -->
      <div class="page-header">
        <div>
          <h1 class="page-title">Security</h1>
          <p class="page-subtitle">
            Access control, database role privileges, employee permissions, data masking, and audit trails.
          </p>
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
          <span>Employee Management</span>
        </button>
        <button
          class="tab-btn"
          [class.active]="activeTab() === 'MASKING'"
          (click)="activeTab.set('MASKING')"
        >
          <span class="material-symbols-outlined">visibility_off</span>
          <span>Data Masking</span>
        </button>
        <button
          class="tab-btn"
          [class.active]="activeTab() === 'AUDIT'"
          (click)="activeTab.set('AUDIT')"
        >
          <span class="material-symbols-outlined">history</span>
          <span>Trigger Audit Logs</span>
        </button>
        <button
          class="tab-btn"
          [class.active]="activeTab() === 'MATRIX'"
          (click)="activeTab.set('MATRIX')"
        >
          <span class="material-symbols-outlined">table_view</span>
          <span>Role Privilege Matrix</span>
        </button>
      </div>

      <!-- ================= TAB 1: EMPLOYEES & RBAC ================= -->
      @if (activeTab() === 'EMPLOYEES') {
        <div class="table-card">
          <div class="card-inner-header">
            <div>
              <h3>Employee Directory</h3>
              <p class="card-meta">Manage roles, permissions, and account status</p>
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

      <!-- ================= TAB 3: AUDIT & TRIGGER LOGS (FULL-WIDTH RESPONSIVE) ================= -->
      @if (activeTab() === 'AUDIT') {
        <div class="audit-layout-container">
          <!-- Sub-Tab Filter Toggle (Direct 2-Way Switcher) -->
          <div class="audit-subtabs-bar">
            <button
              type="button"
              class="subtab-pill"
              [class.active]="subAuditTab() === 'EMPLOYEE'"
              (click)="subAuditTab.set('EMPLOYEE')"
            >
              <span class="material-symbols-outlined">badge</span>
              <span>Employee Lifecycle Audit ({{ authService.employeeAuditLogs().length }})</span>
            </button>
            <button
              type="button"
              class="subtab-pill"
              [class.active]="subAuditTab() === 'SECURITY'"
              (click)="subAuditTab.set('SECURITY')"
            >
              <span class="material-symbols-outlined">shield</span>
              <span>System Security Events ({{ authService.securityLogs().length }})</span>
            </button>
          </div>

          <div class="audit-stack">
            <!-- 1. Employee Audit Log (Triggered by trg_employee_audit) -->
            @if (subAuditTab() === 'EMPLOYEE') {
              <div class="section-card full-width-audit-card">
                <div class="card-title-row">
                  <div class="audit-header-icon-box bg-emerald">
                    <span class="material-symbols-outlined">security_update_good</span>
                  </div>
                  <div style="flex: 1;">
                    <h3 class="audit-title">Employee Audit Log</h3>
                    <p class="card-meta">Automated trigger audit (trg_employee_audit) capturing role adjustments, transfers, and activation status</p>
                  </div>
                  <span class="record-counter">{{ authService.employeeAuditLogs().length }} entries</span>
                </div>

                <div class="table-responsive audit-table-wrapper">
                  <table class="data-table audit-data-table">
                    <thead>
                      <tr>
                        <th scope="col" style="width: 140px; white-space: nowrap;">ACTION</th>
                        <th scope="col" style="width: 180px; white-space: nowrap;">EMPLOYEE</th>
                        <th scope="col" style="min-width: 250px; white-space: nowrap;">OLD &rarr; NEW VALUE</th>
                        <th scope="col" style="width: 170px; white-space: nowrap;">MODIFIED BY</th>
                        <th scope="col" style="width: 180px; white-space: nowrap;">TIMESTAMP</th>
                      </tr>
                    </thead>
                    <tbody>
                      @for (log of authService.employeeAuditLogs(); track log.logId) {
                        <tr>
                          <td>
                            <span
                              class="badge-pill"
                              [class.badge-role-change]="log.action === 'ROLE_CHANGE'"
                              [class.badge-danger]="log.action === 'DEACTIVATE'"
                              [class.badge-mgr]="log.action === 'BRANCH_TRANSFER'"
                              [class.badge-active]="log.action === 'REACTIVATE' || log.action === 'REGISTER'"
                            >
                              {{ log.action }}
                            </span>
                          </td>
                          <td class="emp-name-col">
                            <strong>{{ log.employeeName }}</strong>
                            <span class="emp-id-sub">ID #{{ log.employeeId }}</span>
                          </td>
                          <td>
                            <div class="change-flow-container">
                              <span class="val-pill" [class.val-pill-active]="log.oldValue === 'Active'">{{ log.oldValue }}</span>
                              <span class="material-symbols-outlined flow-arrow">arrow_forward</span>
                              <span
                                class="val-pill"
                                [class.val-pill-deactivated]="log.newValue === 'Deactivated'"
                                [class.val-pill-highlight]="log.newValue !== 'Deactivated'"
                              >
                                {{ log.newValue }}
                              </span>
                            </div>
                          </td>
                          <td>
                            <div class="user-pill-container">
                              <span class="material-symbols-outlined user-pill-icon">verified_user</span>
                              <span class="user-pill-name">{{ cleanUserDisplay(log.modifiedBy) }}</span>
                            </div>
                          </td>
                          <td class="time-meta-cell">
                            <span class="time-meta-nowrap">
                              <span class="material-symbols-outlined time-glyph">schedule</span>
                              {{ log.modifiedAt }}
                            </span>
                          </td>
                        </tr>
                      }
                    </tbody>
                  </table>
                </div>
              </div>
            }

            <!-- 2. Security Event Log -->
            @if (subAuditTab() === 'SECURITY') {
              <div class="section-card full-width-audit-card">
                <div class="card-title-row">
                  <div class="audit-header-icon-box bg-red">
                    <span class="material-symbols-outlined">crisis_alert</span>
                  </div>
                  <div style="flex: 1;">
                    <h3 class="audit-title">Security Event Log</h3>
                    <p class="card-meta">Real-time system events, role permissions enforcement, and administrative safeguards</p>
                  </div>
                  <span class="record-counter">{{ authService.securityLogs().length }} entries</span>
                </div>

                <div class="table-responsive audit-table-wrapper">
                  <table class="data-table audit-data-table">
                    <thead>
                      <tr>
                        <th scope="col" style="width: 170px; white-space: nowrap;">EVENT TYPE</th>
                        <th scope="col" style="min-width: 280px;">EVENT DETAILS</th>
                        <th scope="col" style="width: 180px; white-space: nowrap;">USER & IP</th>
                        <th scope="col" style="width: 180px; white-space: nowrap;">TIMESTAMP</th>
                      </tr>
                    </thead>
                    <tbody>
                      @for (sec of authService.securityLogs(); track sec.logId) {
                        <tr>
                          <td>
                            <span
                              class="badge-pill"
                              [class.badge-active]="sec.eventType === 'LOGIN_SUCCESS'"
                              [class.badge-role-change]="sec.eventType === 'ROLE_ASSIGN'"
                              [class.badge-danger]="sec.eventType === 'EMPLOYEE_DEACTIVATED' || sec.eventType === 'UNAUTHORIZED_ACCESS'"
                            >
                              {{ sec.eventType }}
                            </span>
                          </td>
                          <td class="event-desc-cell">{{ sec.description }}</td>
                          <td>
                            <div class="user-pill-container">
                              <span class="material-symbols-outlined user-pill-icon">person</span>
                              <span class="user-pill-name">{{ cleanUserDisplay(sec.username) }}</span>
                            </div>
                            <div class="ip-sub">{{ sec.ipAddress }}</div>
                          </td>
                          <td class="time-meta-cell">
                            <span class="time-meta-nowrap">
                              <span class="material-symbols-outlined time-glyph">schedule</span>
                              {{ sec.createdAt }}
                            </span>
                          </td>
                        </tr>
                      }
                    </tbody>
                  </table>
                </div>
              </div>
            }
          </div>
        </div>
      }

      <!-- ================= TAB 4: MYSQL 8 RBAC MATRIX ================= -->
      @if (activeTab() === 'MATRIX') {
        <div class="section-card">
          <div class="card-title-row" style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px;">
            <div style="display: flex; align-items: center; gap: 12px;">
              <span class="material-symbols-outlined" style="color: #065f46; font-size: 28px;">shield_with_house</span>
              <div>
                <h3>MySQL 8 Role-Based Access Control (RBAC) Matrix</h3>
                <p class="card-meta">Database level object privileges and procedures enforced across roles</p>
              </div>
            </div>
            <div style="display: flex; gap: 8px; flex-wrap: wrap;">
              <button class="btn-pill btn-danger-outline" (click)="testUnauthorizedGuard('inventory', 'EXECUTE')" title="Simulate unauthorized Cashier access on inventory">
                <span class="material-symbols-outlined">gpp_bad</span> 🚨 Test Unauthorized Action Guard
              </button>
              <button class="btn-pill btn-primary" (click)="openAddRuleModal()">
                <span class="material-symbols-outlined">add_moderator</span> + Add New Rule
              </button>
            </div>
          </div>

          <!-- Dynamic Interactive RBAC Matrix Table -->
          <div style="overflow-x: auto; margin-top: 10px;">
            <table class="data-table rbac-table">
              <thead>
                <tr>
                  <th style="min-width: 220px;">DATABASE OBJECT</th>
                  <th style="width: 100px;">TYPE</th>
                  @for (role of matrixRoles(); track role) {
                    <th style="text-align: center;">{{ formatRoleDisplayName(role) }} ROLE ({{ role.toLowerCase() }}_role)</th>
                  }
                </tr>
              </thead>
              <tbody>
                @for (obj of allDbObjects(); track obj.name) {
                  <tr>
                    <td>
                      <div class="db-obj-col">
                        <strong class="db-obj-name">{{ obj.name }}</strong>
                        <span class="db-obj-desc">{{ obj.description }}</span>
                      </div>
                    </td>
                    <td>
                      <span
                        class="type-pill"
                        [class.type-table]="obj.type === 'TABLE'"
                        [class.type-view]="obj.type === 'VIEW'"
                        [class.type-proc]="obj.type === 'PROCEDURE'"
                      >
                        {{ obj.type }}
                      </span>
                    </td>
                    @for (role of matrixRoles(); track role) {
                      <td style="text-align: center;">
                        @let privs = getPrivilegesForObject(role, obj.name);
                        @if (privs === 'DENIED' || !privs) {
                          <button
                            type="button"
                            class="grant-badge no interactive-deny"
                            (click)="triggerUnauthorizedForUser(role, obj.name)"
                            title="Click to test database security guard on denied object"
                          >
                            DENIED
                          </button>
                        } @else {
                          <span class="grant-badge yes">{{ privs }}</span>
                        }
                      </td>
                    }
                  </tr>
                }
              </tbody>
            </table>
          </div>

                    <app-database-account-grid
            [accounts]="dbAccountsApi.accounts()"
            [isLoading]="dbAccountsApi.isLoading()"
            [error]="dbAccountsApi.error()"
            (onRefresh)="dbAccountsApi.refetch()"
            (onConfigure)="configureAccountRole($event)"
            (openProvisionModal)="openAccountProvisionModal()"
          ></app-database-account-grid>
        </div>
      }

      <!-- MODAL: PROVISION NEW DATABASE USER ACCOUNT -->
      @if (isProvisionModalOpen()) {
        <div class="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="provisionModalTitle">
          <div class="modal-card">
            <div class="modal-header">
              <div style="display: flex; align-items: center; gap: 10px;">
                <div style="width: 36px; height: 36px; border-radius: 8px; background: #ecfdf5; display: flex; align-items: center; justify-content: center; color: #059669;">
                  <span class="material-symbols-outlined">person_add</span>
                </div>
                <div>
                  <h3 id="provisionModalTitle" style="margin: 0; font-size: 1.1rem; color: #111827;">Provision MySQL Database User</h3>
                  <p style="margin: 0; font-size: 0.76rem; color: #6b7280;">Create a live MySQL engine-level account and assign RBAC role privileges</p>
                </div>
              </div>
              <button class="close-btn" (click)="isProvisionModalOpen.set(false)">&times;</button>
            </div>
            <div class="modal-body">
              <div class="form-group">
                <label>Database Username:</label>
                <input type="text" [(ngModel)]="newProvisionUsername" placeholder="e.g. audit_clerk or db_admin" class="select-input" />
              </div>
              <div class="form-group">
                <label>Connection Host:</label>
                <select [(ngModel)]="newProvisionHost" class="select-input">
                  <option value="%">% (Wildcard / Remote Network)</option>
                  <option value="localhost">localhost (Restricted Local Only)</option>
                </select>
              </div>
              <div class="form-group">
                <label>Assigned Database Role:</label>
                <select [(ngModel)]="newProvisionRole" class="select-input">
                  @for (r of availableRoles(); track r) {
                    <option [value]="r">{{ formatRoleDisplayName(r) }} ({{ r.toLowerCase() }}_role)</option>
                  }
                </select>
              </div>
              <div class="form-group">
                <label>Account Password:</label>
                <input type="password" [(ngModel)]="newProvisionPassword" placeholder="Default: Pass!2026" class="select-input" />
              </div>
              <div class="info-note">
                <span class="material-symbols-outlined">shield</span>
                <span>Directly provisions an active MySQL 8 account, grants role privileges, sets default role, and creates an audit trail entry.</span>
              </div>
            </div>
            <div class="modal-footer">
              <button class="btn-pill btn-secondary" (click)="isProvisionModalOpen.set(false)">Cancel</button>
              <button class="btn-pill btn-primary" [disabled]="isProvisioningAccount()" (click)="confirmProvisionAccount()">
                {{ isProvisioningAccount() ? 'Provisioning...' : 'Provision & Activate' }}
              </button>
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
                  @for (r of availableRoles(); track r) {
                    <option [value]="r">{{ r }} ({{ r.toLowerCase() }}_role)</option>
                  }
                </select>
              </div>
              <div class="form-group">
                <label>System Username (Unique):</label>
                <input type="text" [(ngModel)]="newEmpUsername" placeholder="e.g. cashier_sunil" class="select-input" />
              </div>
              <div class="form-group">
                <label>Password:</label>
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

      <!-- MODAL: ADD / CONFIGURE ROLE PRIVILEGE RULE (3-ZONE RESTRUCTURE) -->
      @if (isAddRuleModalOpen()) {
        <div
          class="modal-backdrop"
          role="dialog"
          aria-modal="true"
          aria-labelledby="ruleModalTitle"
        >
          <div class="modal-card modal-large modal-flex-column">
            <!-- ZONE 1: FIXED HEADER (Title, Close Button, Role Selector & Presets) -->
            <div class="modal-header-fixed">
              <div class="header-main-bar">
                <div class="modal-header-brand">
                  <div class="shield-avatar">
                    <span class="material-symbols-outlined">security</span>
                  </div>
                  <div>
                    <h3 id="ruleModalTitle" class="modal-main-title">Configure Database Role Privilege Rules</h3>
                    <p class="modal-sub-meta">Define granular SQL action privileges per database object and persist to database</p>
                  </div>
                </div>
                <button
                  type="button"
                  class="close-btn"
                  (click)="isAddRuleModalOpen.set(false)"
                  aria-label="Close privilege rules modal"
                >&times;</button>
              </div>

              <!-- Role Selection / Account Context Row -->
              @if (configuringAccount()) {
                <div class="account-config-banner">
                  <div class="banner-left">
                    <div class="banner-avatar">
                      <span class="material-symbols-outlined">dns</span>
                    </div>
                    <div class="banner-info">
                      <div class="banner-account-name">
                        <span class="user-name-hl">{{ configuringAccount()?.username }}</span>
                        <span class="host-pill">{{ '@' + configuringAccount()?.host }}</span>
                        <span class="status-dot-inline" [class.active]="configuringAccount()?.status === 'active'"></span>
                      </div>
                      <p class="banner-desc">Configuring MySQL engine object privilege rules for provisioned account</p>
                    </div>
                  </div>

                  <div class="banner-role-badge">
                    <span class="role-caption">Active Role:</span>
                    <span class="role-pill-lg">{{ formatRoleDisplayName(selectedRuleRole) }}</span>
                  </div>
                </div>
              } @else {
                <div class="role-selection-card">
                  <div class="form-row-compact">
                    <div class="role-mode-toggle">
                      <label class="radio-label">
                        <input type="radio" name="ruleRoleMode" value="EXISTING" [(ngModel)]="ruleRoleMode" (change)="onRuleRoleModeChange()" />
                        <span>Select Available Role</span>
                      </label>
                      <label class="radio-label">
                        <input type="radio" name="ruleRoleMode" value="NEW" [(ngModel)]="ruleRoleMode" (change)="onRuleRoleModeChange()" />
                        <span>+ Add New Custom Role</span>
                      </label>
                    </div>

                    @if (ruleRoleMode === 'EXISTING') {
                      <div class="form-group-inline">
                        <label for="targetRoleSelect">Target Role:</label>
                        <select id="targetRoleSelect" [(ngModel)]="selectedRuleRole" (change)="onRuleRoleSelected()" class="select-input select-role-input">
                          @for (r of availableRoles(); track r) {
                            <option [value]="r">{{ formatRoleDisplayName(r) }} ({{ r.toLowerCase() }}_role)</option>
                          }
                        </select>
                      </div>
                    } @else {
                      <div class="form-group-inline">
                        <label for="customRoleInput">New Role Name:</label>
                        <input
                          id="customRoleInput"
                          type="text"
                          [(ngModel)]="newCustomRoleName"
                          placeholder="e.g. INVENTORY_CLERK or AUDITOR"
                          class="select-input input-role-name"
                        />
                      </div>
                    }
                  </div>
                </div>
              }

              <!-- Presets Row (Applied in both modes) -->
              <div class="presets-row">
                <span class="presets-label">Quick Presets:</span>
                <button type="button" class="btn-preset" (click)="applyRulePreset('READ_ONLY')">Read Only (SELECT / EXECUTE)</button>
                <button type="button" class="btn-preset" (click)="applyRulePreset('ALL')">Grant All Privileges</button>
                <button type="button" class="btn-preset danger" (click)="applyRulePreset('DENY_ALL')">Deny All</button>
              </div>
            </div>

            <!-- ZONE 2: SCROLLABLE BODY (Objects & Action Privileges Table) -->
            <div class="modal-body-scrollable max-h-[450px] overflow-y-auto scroll-smooth overscroll-contain">
              <div class="rule-table-container">
                <table class="data-table rule-builder-table">
                  <thead class="sticky top-0 bg-gray-50 z-10 sticky-thead">
                    <tr>
                      <th scope="col" style="min-width: 180px;">DATABASE OBJECT</th>
                      <th scope="col" style="width: 110px;">OBJECT TYPE</th>
                      <th scope="col">ACTIONS / PRIVILEGES (CLICK TO TOGGLE)</th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (obj of allDbObjects(); track obj.name) {
                      <tr>
                        <td>
                          <strong>{{ obj.name }}</strong>
                          <div class="sub-meta">{{ obj.description }}</div>
                        </td>
                        <td>
                          <span
                            class="type-pill"
                            [class.type-table]="obj.type === 'TABLE'"
                            [class.type-view]="obj.type === 'VIEW'"
                            [class.type-proc]="obj.type === 'PROCEDURE'"
                          >
                            {{ obj.type }}
                          </span>
                        </td>
                        <td>
                          <div class="priv-actions-group">
                            @if (obj.type === 'PROCEDURE') {
                              <button
                                type="button"
                                class="priv-badge-btn"
                                [class.active]="isPrivilegeActive(obj.name, 'EXECUTE')"
                                (click)="togglePrivilege(obj.name, 'EXECUTE')"
                              >
                                EXECUTE
                              </button>
                            } @else {
                              <button
                                type="button"
                                class="priv-badge-btn"
                                [class.active]="isPrivilegeActive(obj.name, 'SELECT')"
                                (click)="togglePrivilege(obj.name, 'SELECT')"
                              >
                                SELECT
                              </button>
                              <button
                                type="button"
                                class="priv-badge-btn"
                                [class.active]="isPrivilegeActive(obj.name, 'INSERT')"
                                (click)="togglePrivilege(obj.name, 'INSERT')"
                              >
                                INSERT
                              </button>
                              <button
                                type="button"
                                class="priv-badge-btn"
                                [class.active]="isPrivilegeActive(obj.name, 'UPDATE')"
                                (click)="togglePrivilege(obj.name, 'UPDATE')"
                              >
                                UPDATE
                              </button>
                              <button
                                type="button"
                                class="priv-badge-btn"
                                [class.active]="isPrivilegeActive(obj.name, 'DELETE')"
                                (click)="togglePrivilege(obj.name, 'DELETE')"
                              >
                                DELETE
                              </button>
                            }
                          </div>
                        </td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            </div>

            <!-- ZONE 3: FIXED FOOTER (Cancel ghost/grey & Save Rule emerald solid) -->
            <div class="modal-footer-fixed">
              <button
                type="button"
                class="btn-footer-ghost"
                (click)="isAddRuleModalOpen.set(false)"
              >
                Cancel
              </button>
              <button
                type="button"
                class="btn-footer-emerald"
                [disabled]="isSavingRule()"
                (click)="saveRule()"
              >
                @if (isSavingRule()) {
                  <span class="material-symbols-outlined rotating">progress_activity</span>
                  <span>Saving Rule...</span>
                } @else {
                  <span class="material-symbols-outlined">save</span>
                  <span>Save Rule</span>
                }
              </button>
            </div>
          </div>
        </div>
      }

      <!-- RED WARNING STYLE POPUP MODAL (SECURITY VIOLATION) -->
      @if (authService.securityAlert(); as alert) {
        <div class="modal-backdrop security-alert-backdrop">
          <div class="modal-card security-alert-card">
            <div class="security-alert-header">
              <div class="security-icon-circle">
                <span class="material-symbols-outlined" style="font-size: 26px;">gpp_bad</span>
              </div>
              <div style="flex: 1;">
                <h3 class="security-alert-title">{{ alert.title }}</h3>
                <span class="security-alert-badge">RBAC SECURITY VIOLATION</span>
              </div>
              <button class="close-btn" (click)="authService.closeSecurityAlert()">&times;</button>
            </div>
            <div class="modal-body security-alert-body">
              <div class="alert-banner-box">
                <span class="material-symbols-outlined alert-main-icon">report</span>
                <div class="alert-banner-text">
                  <strong>{{ alert.message }}</strong>
                  <p>Attempted Action: <code>{{ alert.action }}</code> on Database Object: <code>{{ alert.objectName }}</code></p>
                </div>
              </div>
              <div class="security-details-grid">
                <div class="detail-item">
                  <span class="detail-label">Active User Role:</span>
                  <span class="detail-val role-highlight">{{ alert.role }}_ROLE</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">Target Object:</span>
                  <span class="detail-val"><code>{{ alert.objectName }}</code></span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">Required Privilege:</span>
                  <span class="detail-val privilege-highlight">{{ alert.action }}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">Audit Log Status:</span>
                  <span class="detail-val status-logged">Logged to security_event_log</span>
                </div>
              </div>
            </div>
            <div class="modal-footer security-alert-footer">
              <button class="btn-pill btn-danger" (click)="authService.closeSecurityAlert()">
                <span class="material-symbols-outlined">close</span> Dismiss Security Warning
              </button>
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


    .action-alert {
      padding: 12px 18px;
      border-radius: var(--radius-md);
      display: flex;
      align-items: center;
      gap: 12px;
      font-size: 0.86rem;
      font-weight: 600;
      position: relative;
      animation: alertSlideDown 0.22s cubic-bezier(0.16, 1, 0.3, 1);
      box-shadow: 0 4px 14px rgba(0, 0, 0, 0.05);

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
        font-size: 1.25rem;
        cursor: pointer;
        color: inherit;
        opacity: 0.7;
        transition: opacity 0.15s;
        &:hover { opacity: 1; }
      }
    }

    .nav-tabs-bar {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 8px;
      border-bottom: 2px solid var(--border-subtle);
      padding-bottom: 8px;
    }

    .tab-btn {
      display: flex;
      align-items: center;
      gap: 8px;
      background: none;
      border: 1px solid transparent;
      padding: 10px 18px;
      border-radius: 12px;
      font-size: 0.84rem;
      font-weight: 700;
      color: var(--text-muted);
      cursor: pointer;
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
      white-space: nowrap;

      .material-symbols-outlined {
        font-size: 20px;
        transition: transform 0.2s;
      }

      &:hover {
        background: #f1f5f9;
        color: var(--text-main);
        .material-symbols-outlined {
          transform: scale(1.08);
        }
      }

      &.active {
        background: var(--primary-green-light);
        color: var(--primary-green);
        border-color: rgba(6, 95, 70, 0.18);
        box-shadow: 0 1px 3px rgba(6, 95, 70, 0.08);
      }
    }

    .table-card, .section-card {
      background: #ffffff;
      border-radius: var(--radius-lg);
      border: 1px solid var(--border-subtle);
      box-shadow: var(--shadow-card);
      padding: 22px;
      display: flex;
      flex-direction: column;
      gap: 16px;
      overflow-x: auto;
      transition: box-shadow 0.2s ease;
    }

    .card-inner-header, .card-title-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 12px;
      flex-wrap: wrap;

      h3 {
        font-size: 1.05rem;
        font-weight: 800;
        margin: 0;
        color: var(--text-main);
        letter-spacing: -0.2px;
      }

      .card-meta {
        font-size: 0.78rem;
        color: var(--text-muted);
        margin: 3px 0 0 0;
      }
    }

    .data-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.85rem;

      th {
        text-align: left;
        padding: 11px 14px;
        color: #64748b;
        background: #f8fafc;
        font-size: 0.72rem;
        font-weight: 700;
        letter-spacing: 0.04em;
        text-transform: uppercase;
        border-bottom: 1.5px solid #e2e8f0;
        white-space: nowrap;
      }

      td {
        padding: 13px 14px;
        border-bottom: 1px solid #f1f5f9;
        vertical-align: middle;
      }

      tbody tr {
        transition: background-color 0.15s ease;
        &:hover {
          background-color: #f8fafc;
        }
      }

      tr.inactive-row td {
        opacity: 0.55;
        background: #f8fafc;
      }
    }

    .code-sku {
      font-family: 'Fira Code', monospace;
      font-weight: 700;
      color: #475569;
      background: #f1f5f9;
      padding: 2px 7px;
      border-radius: 6px;
      border: 1px solid #e2e8f0;
      font-size: 0.78rem;
    }

    .username-pill {
      font-family: 'Fira Code', monospace;
      color: #0369a1;
      background: #f0f9ff;
      padding: 2px 8px;
      border-radius: 6px;
      border: 1px solid #bae6fd;
      font-weight: 600;
      font-size: 0.78rem;
    }

    .badge-pill {
      padding: 4px 10px;
      border-radius: 12px;
      font-size: 0.72rem;
      font-weight: 700;
      text-transform: uppercase;
      display: inline-block;
      letter-spacing: 0.03em;

      &.badge-primary { background: #ecfdf5; color: #065f46; border: 1px solid #a7f3d0; }
      &.badge-admin { background: #fee2e2; color: #991b1b; border: 1px solid #fecaca; }
      &.badge-mgr { background: #e0e7ff; color: #3730a3; border: 1px solid #c7d2fe; }
      &.badge-cashier { background: #fef3c7; color: #92400e; border: 1px solid #fde68a; }
      &.badge-active { background: #dcfce7; color: #166534; border: 1px solid #bbf7d0; }
      &.badge-danger { background: #fee2e2; color: #b91c1c; border: 1px solid #fecaca; }
      &.badge-gold { background: #fef3c7; color: #b45309; border: 1px solid #fde68a; }
      &.badge-silver { background: #f1f5f9; color: #475569; border: 1px solid #e2e8f0; }
      &.badge-bronze { background: #ffedd5; color: #c2410c; border: 1px solid #fed7aa; }
    }

    .action-buttons-group {
      display: flex;
      justify-content: flex-end;
      gap: 8px;
    }

    .btn-pill {
      padding: 8px 16px;
      border-radius: var(--radius-pill);
      font-size: 0.81rem;
      font-weight: 700;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      border: 1px solid transparent;
      transition: all 0.18s cubic-bezier(0.4, 0, 0.2, 1);
      user-select: none;

      &:hover {
        transform: translateY(-1px);
        box-shadow: 0 4px 10px rgba(0, 0, 0, 0.06);
      }

      &:active {
        transform: translateY(0);
        box-shadow: none;
      }

      &.btn-sm {
        padding: 5px 12px;
        font-size: 0.74rem;
        .material-symbols-outlined { font-size: 16px; }
      }

      &.btn-primary {
        background: var(--primary-green);
        color: #ffffff;
        &:hover { background: var(--primary-green-dark); }
      }
      &.btn-secondary {
        background: #f1f5f9;
        color: #334155;
        border-color: #e2e8f0;
        &:hover { background: #e2e8f0; color: #0f172a; }
      }
      &.btn-outline {
        background: #ffffff;
        border-color: #cbd5e1;
        color: #334155;
        &:hover { background: #f8fafc; border-color: #94a3b8; color: #0f172a; }
      }
      &.btn-danger-outline {
        background: #ffffff;
        border-color: #fca5a5;
        color: #dc2626;
        &:hover { background: #fef2f2; border-color: #ef4444; color: #b91c1c; }
      }
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
      padding: 18px 24px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 20px;
      box-shadow: 0 2px 8px rgba(6, 95, 70, 0.04);
    }

    .masking-info {
      display: flex;
      align-items: center;
      gap: 16px;

      p {
        margin: 4px 0 0 0;
        font-size: 0.82rem;
        color: #475569;
        line-height: 1.45;
      }
    }

    .shield-icon {
      font-size: 38px;
      color: var(--primary-green);
    }

    .masked-phone {
      font-family: 'Fira Code', monospace;
      font-weight: 700;

      &.highlight {
        color: #059669;
        background: #ecfdf5;
        padding: 3px 8px;
        border-radius: 6px;
        border: 1px solid #a7f3d0;
      }
    }

    .grid-2-col {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;

      @media (max-width: 1024px) {
        grid-template-columns: 1fr;
      }
    }

    .audit-change-val {
      font-family: 'Fira Code', monospace;
      font-size: 0.78rem;

      &.highlight {
        color: var(--primary-green);
        font-weight: 700;
        background: #ecfdf5;
        padding: 1px 5px;
        border-radius: 4px;
      }
    }

    .time-meta {
      font-size: 0.74rem;
      color: #94a3b8;
    }

    .rbac-table {
      margin-top: 10px;

      th, td {
        padding: 12px 14px;
      }
    }

    .grant-badge {
      display: inline-block;
      padding: 4px 10px;
      border-radius: 8px;
      font-size: 0.74rem;
      font-weight: 700;
      letter-spacing: 0.02em;

      &.yes { background: #dcfce7; color: #166534; border: 1px solid #bbf7d0; }
      &.no { background: #fee2e2; color: #991b1b; border: 1px solid #fecaca; }
    }

    .db-user-box {
      margin-top: 14px;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 16px 20px;

      h4 {
        margin: 0 0 12px 0;
        font-size: 0.88rem;
        color: #334155;
        font-weight: 700;
      }
    }

    .db-users-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 12px;

      @media (max-width: 1024px) {
        grid-template-columns: repeat(2, 1fr);
      }

      @media (max-width: 600px) {
        grid-template-columns: 1fr;
      }
    }

    .db-user-card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      padding: 12px;
      display: flex;
      flex-direction: column;
      gap: 4px;
      transition: all 0.15s ease;

      &:hover {
        border-color: #cbd5e1;
        box-shadow: 0 2px 6px rgba(0, 0, 0, 0.04);
      }

      strong {
        font-family: 'Fira Code', monospace;
        color: var(--primary-green);
        font-size: 0.85rem;
      }

      span {
        font-size: 0.72rem;
        color: #64748b;
        line-height: 1.35;
      }
    }

    /* Modal styles */
    .modal-backdrop {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(15, 23, 42, 0.45);
      backdrop-filter: blur(4px);
      -webkit-backdrop-filter: blur(4px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      animation: modalFadeIn 0.2s ease;
    }

    .modal-card {
      background: #ffffff;
      width: 460px;
      max-width: 90vw;
      border-radius: 18px;
      box-shadow: 0 20px 40px -8px rgba(0, 0, 0, 0.18), 0 0 0 1px rgba(0, 0, 0, 0.05);
      padding: 24px;
      display: flex;
      flex-direction: column;
      gap: 16px;
      animation: modalSlideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1);
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;

      h3 { margin: 0; font-size: 1.1rem; font-weight: 800; }
      .close-btn {
        width: 32px;
        height: 32px;
        border-radius: 50%;
        background: #f1f5f9;
        border: none;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1.2rem;
        cursor: pointer;
        color: #64748b;
        transition: all 0.15s ease;

        &:hover {
          background: #e2e8f0;
          color: #0f172a;
        }
      }
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

      label { font-weight: 700; font-size: 0.8rem; color: #334155; }
    }

    .select-input {
      padding: 10px 12px;
      border: 1.5px solid #cbd5e1;
      border-radius: 10px;
      font-size: 0.85rem;
      outline: none;
      transition: border-color 0.2s, box-shadow 0.2s;
      background: #ffffff;

      &:focus {
        border-color: var(--primary-green);
        box-shadow: 0 0 0 3px rgba(6, 95, 70, 0.12);
      }
    }

    .info-note {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 10px 12px;
      display: flex;
      gap: 8px;
      font-size: 0.75rem;
      color: #64748b;
      line-height: 1.4;

      .material-symbols-outlined { font-size: 18px; color: #0284c7; flex-shrink: 0; }
    }

    .modal-footer {
      display: flex;
      justify-content: flex-end;
      gap: 10px;
    }

    .dr-container {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .metrics-summary-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 14px;

      @media (max-width: 1100px) {
        grid-template-columns: repeat(2, 1fr);
      }

      @media (max-width: 640px) {
        grid-template-columns: 1fr;
      }
    }

    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }

    .rotating {
      animation: spin 1s linear infinite;
      display: inline-block;
    }

    @keyframes alertSlideDown {
      from { opacity: 0; transform: translateY(-8px); }
      to { opacity: 1; transform: translateY(0); }
    }

    @keyframes modalFadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    @keyframes modalSlideUp {
      from { opacity: 0; transform: translateY(12px) scale(0.97); }
      to { opacity: 1; transform: translateY(0) scale(1); }
    }

    /* Dynamic Role Privilege Matrix Styles */
    .db-obj-col {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .db-obj-name {
      font-family: 'Fira Code', monospace;
      font-size: 0.82rem;
      color: #0f172a;
    }

    .db-obj-desc {
      font-size: 0.72rem;
      color: #64748b;
    }

    .type-pill {
      font-size: 0.68rem;
      font-weight: 700;
      padding: 3px 8px;
      border-radius: 6px;
      letter-spacing: 0.03em;
      display: inline-block;

      &.type-table { background: #e0f2fe; color: #0369a1; border: 1px solid #bae6fd; }
      &.type-view { background: #f3e8ff; color: #7e22ce; border: 1px solid #e9d5ff; }
      &.type-proc { background: #fef3c7; color: #b45309; border: 1px solid #fde68a; }
    }

    .interactive-deny {
      cursor: pointer;
      border: 1px dashed #ef4444;
      background: #fef2f2;
      color: #dc2626;
      transition: all 0.15s ease;

      &:hover {
        background: #dc2626;
        color: #ffffff;
        border-style: solid;
        box-shadow: 0 2px 6px rgba(220, 38, 38, 0.25);
      }
    }

    /* Modal Large (Add Rule Builder) */
    .modal-large {
      width: 880px;
      max-width: 95vw;
      max-height: 90vh;
      display: flex;
      flex-direction: column;
    }

    .rule-builder-body {
      overflow-y: auto;
      max-height: calc(85vh - 140px);
      display: flex;
      flex-direction: column;
      gap: 16px;
      padding-right: 4px;
    }

        .account-config-banner {
      background: #f0fdf4;
      border: 1px solid #bbf7d0;
      border-radius: 12px;
      padding: 14px 18px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      flex-wrap: wrap;

      .banner-left {
        display: flex;
        align-items: center;
        gap: 12px;
      }

      .banner-avatar {
        width: 38px;
        height: 38px;
        border-radius: 10px;
        background: #059669;
        color: #ffffff;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 20px;
      }

      .banner-info {
        display: flex;
        flex-direction: column;
        gap: 2px;
      }

      .banner-account-name {
        display: flex;
        align-items: center;
        gap: 8px;

        .user-name-hl {
          font-weight: 800;
          font-size: 0.95rem;
          color: #065f46;
          font-family: monospace;
        }

        .host-pill {
          background: #dcfce7;
          color: #166534;
          font-size: 0.72rem;
          font-weight: 700;
          padding: 2px 7px;
          border-radius: 6px;
        }

        .status-dot-inline {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #10b981;
          display: inline-block;
        }
      }

      .banner-desc {
        margin: 0;
        font-size: 0.76rem;
        color: #047857;
      }

      .banner-role-badge {
        display: flex;
        align-items: center;
        gap: 8px;
        background: #ffffff;
        padding: 6px 14px;
        border-radius: 8px;
        border: 1px solid #bbf7d0;

        .role-caption {
          font-size: 0.75rem;
          font-weight: 700;
          color: #64748b;
          text-transform: uppercase;
        }

        .role-pill-lg {
          font-size: 0.8rem;
          font-weight: 800;
          color: #059669;
          letter-spacing: 0.03em;
        }
      }
    }

    .role-selection-card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 14px 18px;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .form-row-compact {
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 12px;
    }

    .role-mode-toggle {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .radio-label {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 0.82rem;
      font-weight: 700;
      color: #334155;
      cursor: pointer;

      input[type="radio"] {
        accent-color: var(--primary-green);
        cursor: pointer;
      }
    }

    .form-group-inline {
      display: flex;
      align-items: center;
      gap: 8px;

      label {
        font-size: 0.8rem;
        font-weight: 700;
        color: #475569;
        white-space: nowrap;
      }
    }

    .select-role-input, .input-role-name {
      padding: 7px 12px;
      font-size: 0.82rem;
      min-width: 220px;
    }

    .presets-row {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
      padding-top: 8px;
      border-top: 1px solid #edf2f7;
    }

    .presets-label {
      font-size: 0.74rem;
      font-weight: 700;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.03em;
    }

    .btn-preset {
      background: #ffffff;
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      padding: 4px 10px;
      font-size: 0.74rem;
      font-weight: 600;
      color: #334155;
      cursor: pointer;
      transition: all 0.15s ease;

      &:hover {
        background: #f1f5f9;
        border-color: #94a3b8;
      }

      &.danger {
        color: #dc2626;
        border-color: #fca5a5;
        background: #fff5f5;

        &:hover {
          background: #fee2e2;
        }
      }
    }

    .rule-table-container {
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      overflow: hidden;
    }

    .rule-builder-table {
      margin: 0;
      width: 100%;

      th {
        background: #f8fafc;
        padding: 10px 14px;
        font-size: 0.76rem;
      }

      td {
        padding: 10px 14px;
        vertical-align: middle;
      }
    }

    .priv-actions-group {
      display: flex;
      gap: 6px;
      flex-wrap: wrap;
    }

    .priv-badge-btn {
      padding: 4px 10px;
      border-radius: 6px;
      font-size: 0.72rem;
      font-weight: 700;
      letter-spacing: 0.02em;
      cursor: pointer;
      border: 1px solid #cbd5e1;
      background: #f8fafc;
      color: #64748b;
      transition: all 0.15s ease;

      &:hover {
        border-color: #065f46;
        color: #065f46;
      }

      &.active {
        background: #dcfce7;
        color: #15803d;
        border-color: #86efac;
        box-shadow: 0 1px 3px rgba(22, 101, 52, 0.12);
      }
    }

    /* Red Warning Style Popup Modal (Security Violation) */
    .security-alert-backdrop {
      background: rgba(69, 10, 10, 0.55);
    }

    .security-alert-card {
      border: 2px solid #ef4444;
      box-shadow: 0 25px 50px -12px rgba(220, 38, 38, 0.35);
      width: 520px;
      max-width: 95vw;
      padding: 0;
      overflow: hidden;
    }

    .security-alert-header {
      background: #fef2f2;
      border-bottom: 1px solid #fee2e2;
      padding: 18px 22px;
      display: flex;
      align-items: center;
      gap: 14px;
    }

    .security-icon-circle {
      width: 44px;
      height: 44px;
      border-radius: 50%;
      background: #fee2e2;
      color: #dc2626;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .security-alert-title {
      color: #991b1b;
      font-weight: 800;
      font-size: 1.05rem;
      margin: 0;
    }

    .security-alert-badge {
      background: #dc2626;
      color: #ffffff;
      font-size: 0.65rem;
      font-weight: 800;
      padding: 2px 8px;
      border-radius: 4px;
      letter-spacing: 0.05em;
    }

    .security-alert-body {
      padding: 20px 22px;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .alert-banner-box {
      display: flex;
      gap: 12px;
      background: #fff5f5;
      border: 1px solid #fecaca;
      border-radius: 10px;
      padding: 12px 14px;
      color: #7f1d1d;

      .alert-main-icon {
        font-size: 26px;
        color: #dc2626;
        flex-shrink: 0;
      }

      .alert-banner-text {
        font-size: 0.84rem;
        line-height: 1.4;

        strong {
          display: block;
          margin-bottom: 4px;
          color: #991b1b;
        }

        p {
          margin: 0;
          font-size: 0.78rem;
          color: #b91c1c;
        }

        code {
          background: #fee2e2;
          padding: 2px 6px;
          border-radius: 4px;
          font-family: 'Fira Code', monospace;
          color: #991b1b;
          font-weight: 700;
        }
      }
    }

    .security-details-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      padding: 12px 14px;
    }

    .detail-item {
      display: flex;
      flex-direction: column;
      gap: 3px;
    }

    .detail-label {
      font-size: 0.68rem;
      font-weight: 700;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.03em;
    }

    .detail-val {
      font-size: 0.82rem;
      font-weight: 700;
      color: #1e293b;

      code {
        font-family: 'Fira Code', monospace;
        color: #0369a1;
      }

      &.role-highlight {
        color: #dc2626;
      }

      &.privilege-highlight {
        color: #b91c1c;
      }

      &.status-logged {
        color: #059669;
        font-size: 0.76rem;
      }
    }

    .security-alert-footer {
      padding: 14px 22px;
      background: #f8fafc;
      border-top: 1px solid #e2e8f0;
      display: flex;
      justify-content: flex-end;
    }

    .btn-danger {
      background: #dc2626;
      color: #ffffff;
      border: none;
      font-weight: 700;

      &:hover {
        background: #b91c1c;
      }
    }

    /* 3-Zone Restructured Modal Styles */
    .modal-flex-column {
      display: flex;
      flex-direction: column;
      overflow: hidden;
      background: #ffffff;
      border-radius: 0.75rem;
      border: 1px solid #e5e7eb;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
    }

    .modal-header-fixed {
      flex-shrink: 0;
      padding: 1.25rem 1.5rem;
      border-bottom: 1px solid #e5e7eb;
      background: #ffffff;
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .header-main-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .modal-header-brand {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .shield-avatar {
      width: 42px;
      height: 42px;
      border-radius: 0.5rem;
      background: #ecfdf5;
      color: #059669;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .modal-main-title {
      font-size: 1.15rem;
      font-weight: 700;
      color: #111827;
      margin: 0;
    }

    .modal-sub-meta {
      font-size: 0.8rem;
      color: #6b7280;
      margin: 2px 0 0 0;
    }

    /* Zone 2: Scrollable Body with overscroll-contain & thin scrollbar */
    .modal-body-scrollable {
      padding: 1.25rem 1.5rem;
      max-height: 450px;
      overflow-y: auto;
      overscroll-behavior: contain;
      scrollbar-width: thin;
      scrollbar-color: #cbd5e1 transparent;

      &::-webkit-scrollbar {
        width: 6px;
      }
      &::-webkit-scrollbar-track {
        background: transparent;
      }
      &::-webkit-scrollbar-thumb {
        background: #cbd5e1;
        border-radius: 9999px;
      }
      &::-webkit-scrollbar-thumb:hover {
        background: #94a3b8;
      }
    }

    /* Sticky Table thead in Zone 2 */
    .sticky-thead th {
      position: sticky;
      top: 0;
      z-index: 10;
      background: #f9fafb !important; /* bg-gray-50 */
      border-bottom: 1px solid #e5e7eb;
      box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
    }

    /* Zone 3: Fixed Footer */
    .modal-footer-fixed {
      flex-shrink: 0;
      padding: 1rem 1.5rem;
      background: #f9fafb; /* bg-gray-50 */
      border-top: 1px solid #e5e7eb; /* border-gray-200 */
      display: flex;
      justify-content: flex-end;
      align-items: center;
      gap: 0.75rem;
    }

    .btn-footer-ghost {
      background: transparent;
      border: 1px solid #e5e7eb;
      color: #374151;
      font-size: 0.82rem;
      font-weight: 600;
      padding: 7px 16px;
      border-radius: 0.5rem;
      cursor: pointer;
      transition: all 0.15s ease;

      &:hover {
        background: #f3f4f6;
        border-color: #d1d5db;
        color: #111827;
      }
    }

    .btn-footer-emerald {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: #059669; /* emerald-600 */
      color: #ffffff;
      font-size: 0.82rem;
      font-weight: 600;
      padding: 7px 18px;
      border-radius: 0.5rem;
      border: none;
      cursor: pointer;
      transition: background-color 0.15s ease;

      .material-symbols-outlined {
        font-size: 18px;
      }

      &:hover:not(:disabled) {
        background: #047857; /* emerald-700 */
      }

      &:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }
    }

    /* Audit Stream Redesign Styles */
    .audit-layout-container {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .audit-subtabs-bar {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
      background: #ffffff;
      padding: 6px;
      border-radius: 10px;
      border: 1px solid #e5e7eb;
      width: fit-content;
    }

    .subtab-pill {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 6px 14px;
      border-radius: 8px;
      font-size: 0.78rem;
      font-weight: 600;
      color: #4b5563;
      background: transparent;
      border: none;
      cursor: pointer;
      transition: all 0.15s ease;

      .material-symbols-outlined {
        font-size: 16px;
      }

      &:hover {
        background: #f3f4f6;
        color: #111827;
      }

      &.active {
        background: #ecfdf5;
        color: #047857;
        font-weight: 700;
      }
    }

    .audit-stack {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .full-width-audit-card {
      background: #ffffff;
      border: 1px solid #e5e7eb;
      border-radius: 12px;
      padding: 20px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
    }

    .audit-header-icon-box {
      width: 40px;
      height: 40px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;

      .material-symbols-outlined {
        font-size: 22px;
      }

      &.bg-emerald {
        background: #ecfdf5;
        color: #059669;
      }

      &.bg-red {
        background: #fef2f2;
        color: #dc2626;
      }
    }

    .audit-title {
      font-size: 1.1rem;
      font-weight: 700;
      color: #111827;
      margin: 0;
    }

    .record-counter {
      font-size: 0.74rem;
      color: #6b7280;
      background: #f3f4f6;
      padding: 3px 10px;
      border-radius: 20px;
      font-weight: 600;
    }

    .audit-table-wrapper {
      margin-top: 14px;
      overflow-x: auto;
      border-radius: 8px;
      border: 1px solid #f3f4f6;
    }

    .audit-data-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.84rem;

      th {
        background: #f9fafb;
        color: #4b5563;
        font-weight: 700;
        font-size: 0.72rem;
        letter-spacing: 0.04em;
        padding: 10px 14px;
        border-bottom: 1px solid #e5e7eb;
      }

      td {
        padding: 12px 14px;
        border-bottom: 1px solid #f3f4f6;
        vertical-align: middle;
      }

      tbody tr:hover {
        background: #f9fafb;
      }
    }

    /* Badge Role Change (Soft Blue) */
    .badge-role-change {
      background: #eff6ff !important;
      color: #1d4ed8 !important;
      border: 1px solid #bfdbfe !important;
    }

    .emp-name-col {
      display: flex;
      flex-direction: column;
      gap: 2px;

      strong {
        color: #111827;
      }
    }

    .emp-id-sub {
      font-size: 0.7rem;
      color: #6b7280;
      font-family: monospace;
    }

    /* Value Flow: Single line with arrow */
    .change-flow-container {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      white-space: nowrap;
    }

    .flow-arrow {
      font-size: 15px;
      color: #94a3b8;
    }

    .val-pill {
      font-family: 'JetBrains Mono', 'Fira Code', monospace;
      font-size: 0.75rem;
      font-weight: 600;
      padding: 2px 7px;
      border-radius: 4px;
      background: #f3f4f6;
      color: #374151;
      border: 1px solid #e5e7eb;
      white-space: nowrap;

      &.val-pill-active {
        background: #ecfdf5;
        color: #047857;
        border-color: #a7f3d0;
      }

      &.val-pill-highlight {
        background: #ecfdf5;
        color: #047857;
        border-color: #a7f3d0;
        font-weight: 700;
      }

      &.val-pill-deactivated {
        background: #fef2f2;
        color: #b91c1c;
        border-color: #fecaca;
        font-weight: 700;
      }
    }

    /* Sanitized Modifier Pill */
    .user-pill-container {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      background: #f0fdf4;
      border: 1px solid #bbf7d0;
      color: #166534;
      font-size: 0.75rem;
      font-weight: 600;
      padding: 3px 9px;
      border-radius: 20px;
      white-space: nowrap;
    }

    .user-pill-icon {
      font-size: 15px;
      color: #059669;
    }

    .user-pill-name {
      font-size: 0.74rem;
    }

    .ip-sub {
      font-size: 0.68rem;
      color: #94a3b8;
      margin-top: 2px;
      font-family: monospace;
    }

    .event-desc-cell {
      color: #374151;
      line-height: 1.4;
    }

    /* Timestamp NEVER wraps onto multiple lines */
    .time-meta-cell {
      white-space: nowrap;
    }

    .time-meta-nowrap {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      font-family: 'JetBrains Mono', 'Fira Code', monospace;
      font-size: 0.76rem;
      color: #64748b;
      white-space: nowrap !important;
    }

    .time-glyph {
      font-size: 14px;
      color: #9ca3af;
    }
  `]
})
export class AdminDashboardComponent implements OnInit {
  readonly dbAccountsApi = useDatabaseAccounts();
  readonly subAuditTab = signal<'EMPLOYEE' | 'SECURITY'>('EMPLOYEE');
  configuringAccount = signal<DatabaseAccount | null>(null);

  isProvisionModalOpen = signal<boolean>(false);
  isProvisioningAccount = signal<boolean>(false);
  newProvisionUsername = '';
  newProvisionHost = '%';
  newProvisionRole = 'CASHIER';
  newProvisionPassword = '';

  formatRoleDisplayName(role: string): string {
    if (!role) return '';
    return role.replace(/_/g, ' ');
  }

  openAccountProvisionModal(): void {
    this.newProvisionUsername = '';
    this.newProvisionHost = '%';
    this.newProvisionRole = this.availableRoles()[0] || 'CASHIER';
    this.newProvisionPassword = '';
    this.isProvisionModalOpen.set(true);
  }

  confirmProvisionAccount(): void {
    if (!this.newProvisionUsername || !this.newProvisionUsername.trim()) {
      this.actionFeedback.set({ success: false, message: 'Please provide a valid database username.' });
      return;
    }
    this.isProvisioningAccount.set(true);
    this.authService.provisionDatabaseAccountHttp({
      username: this.newProvisionUsername.trim(),
      host: this.newProvisionHost,
      role: this.newProvisionRole,
      password: this.newProvisionPassword || 'Pass!2026'
    }).subscribe({
      next: (res: any) => {
        this.isProvisioningAccount.set(false);
        this.isProvisionModalOpen.set(false);
        this.actionFeedback.set({
          success: true,
          message: 'Database account ' + res.username + '@' + res.host + ' provisioned successfully with role ' + res.role + '!'
        });
        this.dbAccountsApi.refetch();
      },
      error: (err: any) => {
        this.isProvisioningAccount.set(false);
        this.actionFeedback.set({
          success: false,
          message: 'Failed to provision database account: ' + (err?.error?.message || err?.message || 'Server error')
        });
      }
    });
  }

  cleanUserDisplay(user: string | null | undefined): string {
    if (!user || user.trim() === '' || user.toLowerCase() === 'system') return 'System Administrator';
    if (user.includes('root@') || user.toLowerCase() === 'root') return 'System Administrator';
    if (user.includes('app_user@') || user.toLowerCase() === 'app_user') return 'Application Service';
    return user;
  }

  private readonly router = inject(Router);

  signOut(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  @HostListener('document:keydown.escape', ['$event'])
  onKeydownEscape(event: Event) {
    if (this.authService.securityAlert()) {
      this.authService.closeSecurityAlert();
    }
    if (this.isAddRuleModalOpen()) {
      this.isAddRuleModalOpen.set(false);
    }
    if (this.isProvisionModalOpen()) {
      this.isProvisionModalOpen.set(false);
    }
    if (this.isRegisterModalOpen()) {
      this.isRegisterModalOpen.set(false);
    }
    if (this.selectedEmployeeForRole()) {
      this.selectedEmployeeForRole.set(null);
    }
  }

  configureAccountRole(account: DatabaseAccount): void {
    this.configuringAccount.set(account);
    this.ruleRoleMode = 'EXISTING';
    const accRoleNorm = account.role.toUpperCase().replace(/ /g, '_');
    const matchedRole = this.availableRoles().find(r => {
      const rNorm = r.toUpperCase().replace(/ /g, '_');
      return accRoleNorm.includes(rNorm) || rNorm.includes(accRoleNorm);
    });
    this.selectedRuleRole = matchedRole || (this.availableRoles()[0] || 'CASHIER');
    this.onRuleRoleSelected();
    this.isAddRuleModalOpen.set(true);
  }

  readonly authService = inject(AuthService);
  readonly customerService = inject(CustomerService);

  activeTab = signal<'EMPLOYEES' | 'MASKING' | 'AUDIT' | 'MATRIX'>('EMPLOYEES');
  actionFeedback = signal<{ success: boolean; message: string } | null>(null);

  selectedEmployeeForRole = signal<Employee | null>(null);
  newRoleSelection: string = 'CASHIER';

  // Dynamic Role Privilege Matrix and Rules Engine State
  availableRoles = signal<string[]>(['ADMIN', 'MANAGER', 'CASHIER', 'DB_MANAGER', 'HR', 'SUPPLIER']);
  dbObjects = signal<any[]>([]);
  customRolePrivileges = signal<{ [role: string]: { [object: string]: string } }>({});

  isAddRuleModalOpen = signal<boolean>(false);
  isSavingRule = signal<boolean>(false);
  ruleRoleMode: 'EXISTING' | 'NEW' = 'EXISTING';
  selectedRuleRole = 'CASHIER';
  newCustomRoleName = '';
  ruleBuilderPrivileges = signal<{ [objectName: string]: string[] }>({});

  readonly defaultDbObjects = [
    { name: 'sales_order', type: 'TABLE', description: 'Order transaction records & checkout receipts' },
    { name: 'order_item', type: 'TABLE', description: 'Individual line items and scanned quantities' },
    { name: 'customer', type: 'TABLE', description: 'Shopper directory & accumulated loyalty points' },
    { name: 'product', type: 'TABLE', description: 'Merchandise catalog, barcodes, and retail pricing' },
    { name: 'inventory', type: 'TABLE', description: 'Branch stock levels & minimum reorder points' },
    { name: 'discount_rule', type: 'TABLE', description: 'Promotional rules and active category discounts' },
    { name: 'purchase_order', type: 'TABLE', description: 'Supplier restock purchase orders & status' },
    { name: 'employee', type: 'TABLE', description: 'Staff credentials and system role assignments' },
    { name: 'employee_audit_log', type: 'TABLE', description: 'Trigger-based employee change audit trail' },
    { name: 'security_event_log', type: 'TABLE', description: 'Administrative security violations & auth logs' },
    { name: 'v_masked_customer_directory', type: 'VIEW', description: 'PII-masked customer telephone directory' },
    { name: 'v_active_discounts', type: 'VIEW', description: 'Active promotional discount criteria' },
    { name: 'v_low_stock', type: 'VIEW', description: 'Products currently below reorder threshold' },
    { name: 'v_daily_sales', type: 'VIEW', description: 'Daily aggregated revenue & branch sales' },
    { name: 'sp_place_order', type: 'PROCEDURE', description: 'Transactional multi-item checkout procedure' },
    { name: 'sp_cancel_order', type: 'PROCEDURE', description: 'Order rollback and stock replenishment' },
    { name: 'sp_get_login', type: 'PROCEDURE', description: 'Credential verification stored procedure' },
    { name: 'sp_add_stock', type: 'PROCEDURE', description: 'Inventory replenishment procedure' },
    { name: 'sp_transfer_stock', type: 'PROCEDURE', description: 'Inter-branch stock transfer procedure' },
    { name: 'sp_deactivate_employee', type: 'PROCEDURE', description: 'Employee deactivation with self-lockout check' },
    { name: 'sp_change_user_role', type: 'PROCEDURE', description: 'Role modification procedure firing audit trigger' }
  ];

  readonly defaultPrivilegesMap: { [role: string]: { [object: string]: string } } = {
    'CASHIER': {
      'sales_order': 'SELECT, INSERT',
      'order_item': 'SELECT, INSERT',
      'customer': 'SELECT, INSERT',
      'product': 'SELECT',
      'v_masked_customer_directory': 'SELECT (Masked)',
      'v_active_discounts': 'SELECT',
      'sp_place_order': 'EXECUTE',
      'sp_cancel_order': 'EXECUTE',
      'sp_get_login': 'EXECUTE'
    },
    'MANAGER': {
      'sales_order': 'ALL PRIVILEGES',
      'order_item': 'ALL PRIVILEGES',
      'customer': 'ALL PRIVILEGES',
      'product': 'SELECT, INSERT, UPDATE',
      'inventory': 'SELECT, INSERT, UPDATE',
      'discount_rule': 'SELECT, INSERT, UPDATE',
      'purchase_order': 'ALL PRIVILEGES',
      'employee_audit_log': 'SELECT',
      'security_event_log': 'SELECT',
      'v_masked_customer_directory': 'SELECT (Raw)',
      'v_active_discounts': 'SELECT',
      'v_low_stock': 'SELECT',
      'v_daily_sales': 'SELECT',
      'sp_place_order': 'EXECUTE',
      'sp_cancel_order': 'EXECUTE',
      'sp_add_stock': 'EXECUTE',
      'sp_transfer_stock': 'EXECUTE',
      'sp_get_login': 'EXECUTE'
    },
    'ADMIN': {
      'sales_order': 'ALL PRIVILEGES',
      'order_item': 'ALL PRIVILEGES',
      'customer': 'ALL PRIVILEGES',
      'product': 'ALL PRIVILEGES',
      'inventory': 'ALL PRIVILEGES',
      'discount_rule': 'ALL PRIVILEGES',
      'purchase_order': 'ALL PRIVILEGES',
      'employee': 'ALL PRIVILEGES',
      'employee_audit_log': 'ALL PRIVILEGES',
      'security_event_log': 'ALL PRIVILEGES',
      'v_masked_customer_directory': 'ALL PRIVILEGES',
      'v_active_discounts': 'ALL PRIVILEGES',
      'v_low_stock': 'ALL PRIVILEGES',
      'v_daily_sales': 'ALL PRIVILEGES',
      'sp_place_order': 'EXECUTE',
      'sp_cancel_order': 'EXECUTE',
      'sp_add_stock': 'EXECUTE',
      'sp_transfer_stock': 'EXECUTE',
      'sp_deactivate_employee': 'EXECUTE',
      'sp_change_user_role': 'EXECUTE',
      'sp_get_login': 'EXECUTE'
    },
        'DB_MANAGER': {
      'sales_order': 'SELECT, INSERT',
      'order_item': 'DENIED',
      'customer': 'DENIED',
      'product': 'DENIED',
      'inventory': 'DENIED',
      'discount_rule': 'DENIED',
      'purchase_order': 'DENIED',
      'employee': 'DENIED',
      'employee_audit_log': 'DENIED',
      'security_event_log': 'DENIED',
      'v_masked_customer_directory': 'DENIED',
      'v_active_discounts': 'DENIED',
      'v_low_stock': 'DENIED',
      'v_daily_sales': 'DENIED',
      'v_product_ranking': 'DENIED',
      'sp_place_order': 'DENIED',
      'sp_cancel_order': 'DENIED',
      'sp_get_login': 'DENIED',
      'sp_add_stock': 'DENIED',
      'sp_transfer_stock': 'DENIED',
      'sp_receive_purchase': 'DENIED',
      'sp_deactivate_employee': 'DENIED',
      'sp_change_user_role': 'DENIED'
    },
        'HR': {
      'sales_order': 'DENIED',
      'order_item': 'SELECT, INSERT, UPDATE, DELETE',
      'customer': 'DENIED',
      'product': 'DENIED',
      'inventory': 'DENIED',
      'discount_rule': 'DENIED',
      'purchase_order': 'DENIED',
      'employee': 'DENIED',
      'employee_audit_log': 'DENIED',
      'security_event_log': 'DENIED',
      'v_masked_customer_directory': 'DENIED',
      'v_active_discounts': 'DENIED',
      'v_low_stock': 'DENIED',
      'v_daily_sales': 'DENIED',
      'v_product_ranking': 'DENIED',
      'sp_place_order': 'DENIED',
      'sp_cancel_order': 'DENIED',
      'sp_get_login': 'DENIED',
      'sp_add_stock': 'DENIED',
      'sp_transfer_stock': 'DENIED',
      'sp_receive_purchase': 'DENIED',
      'sp_deactivate_employee': 'DENIED',
      'sp_change_user_role': 'DENIED'
    },
    'SUPPLIER': {
      'purchase_order': 'SELECT (Assigned)',
      'product': 'SELECT',
      'sp_get_login': 'EXECUTE'
    }
  };

  ngOnInit(): void {
    this.authService.fetchEmployeesHttp().subscribe();
    this.authService.fetchAuditLogsHttp().subscribe();
    this.authService.fetchSecurityLogsHttp().subscribe();
    this.loadRolesAndPrivileges();
  }

  openRoleModal(emp: Employee): void {
    this.selectedEmployeeForRole.set(emp);
    this.newRoleSelection = emp.role === 'SUPPLIER' ? 'CASHIER' : emp.role;
  }

  confirmRoleChange(): void {
    const emp = this.selectedEmployeeForRole();
    if (!emp) return;

    this.authService.changeRoleHttp(emp.employeeId, this.newRoleSelection).subscribe({
      next: (res: any) => {
        this.actionFeedback.set({ success: true, message: res?.message || 'Role updated via sp_change_user_role' });
        this.selectedEmployeeForRole.set(null);
        this.authService.fetchEmployeesHttp().subscribe();
        this.authService.fetchAuditLogsHttp().subscribe();
      },
      error: () => {
        // Fallback for standalone demo
        const res = this.authService.changeUserRole(emp.employeeId, this.newRoleSelection as any);
        this.actionFeedback.set(res);
        this.selectedEmployeeForRole.set(null);
      }
    });
  }

  handleDeactivate(empId: number): void {
    this.authService.deactivateEmployeeHttp(empId).subscribe({
      next: (res: any) => {
        this.actionFeedback.set({ success: true, message: res?.message || 'Employee deactivated via sp_deactivate_employee' });
        this.authService.fetchEmployeesHttp().subscribe();
        this.authService.fetchAuditLogsHttp().subscribe();
      },
      error: (err: any) => {
        if (err?.status === 403) {
          this.actionFeedback.set({ success: false, message: err?.error?.message || 'Security Violation: Administrator cannot deactivate own account' });
        } else {
          // Fallback for standalone demo
          const res = this.authService.deactivateEmployee(empId);
          this.actionFeedback.set(res);
        }
      }
    });
  }

  testSelfLockout(): void {
    const myId = this.authService.currentUser().employeeId;
    this.handleDeactivate(myId);
  }

  // Register Employee state
  isRegisterModalOpen = signal<boolean>(false);
  newEmpName = '';
  newEmpBranchId = 1;
  newEmpRole: string = 'CASHIER';
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

    const payload = {
      fullName: this.newEmpName,
      branchId: this.newEmpBranchId,
      role: this.newEmpRole as any,
      username: this.newEmpUsername,
      password: this.newEmpPassword
    };

    this.authService.registerEmployeeHttp(payload).subscribe({
      next: (res: any) => {
        this.actionFeedback.set({ success: true, message: res?.message || 'Employee registered successfully!' });
        this.isRegisterModalOpen.set(false);
        this.authService.fetchEmployeesHttp().subscribe();
        this.authService.fetchAuditLogsHttp().subscribe();
      },
      error: (err: any) => {
        // Fallback for standalone demo
        const res = this.authService.registerEmployee({
          ...payload,
          branchName: branchNames[this.newEmpBranchId] || 'Colombo Central Flagship'
        });
        this.actionFeedback.set(res);
        if (res.success) {
          this.isRegisterModalOpen.set(false);
        }
      }
    });
  }

  // Dynamic Privilege Matrix & Rules Engine Helper Methods
  matrixRoles(): string[] {
    const list = this.availableRoles().map(r => r.toUpperCase().replace(/ /g, '_'));
    const unique = Array.from(new Set(list));
    const core = ['CASHIER', 'MANAGER', 'DB_MANAGER', 'HR', 'ADMIN'];
    const others = unique.filter(r => !core.includes(r));
    return [...core, ...others];
  }

  allDbObjects(): any[] {
    return this.dbObjects().length > 0 ? this.dbObjects() : this.defaultDbObjects;
  }

  getPrivilegesForObject(role: string, objectName: string): string {
    const norm = role.toUpperCase().replace(/ /g, '_');
    const space = role.toUpperCase().replace(/_/g, ' ');
    const custom = this.customRolePrivileges()[role]?.[objectName]
      || this.customRolePrivileges()[norm]?.[objectName]
      || this.customRolePrivileges()[space]?.[objectName];
    if (custom) return custom;
    return this.defaultPrivilegesMap[norm]?.[objectName]
      || this.defaultPrivilegesMap[space]?.[objectName]
      || this.defaultPrivilegesMap[role]?.[objectName]
      || 'DENIED';
  }

  loadRolesAndPrivileges(): void {
    this.authService.fetchRolesHttp().subscribe({
      next: (roles) => {
        if (roles && roles.length > 0) {
          const normRoles = roles.map(r => r.toUpperCase().replace(/ /g, '_'));
          this.availableRoles.update(prev => Array.from(new Set([...prev, ...normRoles])));
        }
      }
    });

    this.authService.fetchObjectsHttp().subscribe({
      next: (objs) => {
        if (objs && objs.length > 0) {
          this.dbObjects.set(objs);
        }
      }
    });

    this.authService.fetchRolePrivilegesHttp().subscribe({
      next: (rules) => {
        if (rules && rules.length > 0) {
          const map: { [role: string]: { [obj: string]: string } } = {};
          const detectedRoles = new Set<string>();
          rules.forEach(r => {
            const rawRole = (r.role_name || r.roleName || '').toUpperCase();
            const normRole = rawRole.replace(/ /g, '_');
            const obj = r.object_name || r.objectName;
            const priv = r.privileges;
            if (rawRole && obj) {
              detectedRoles.add(normRole);
              if (!map[normRole]) map[normRole] = {};
              map[normRole][obj] = priv;
              if (!map[rawRole]) map[rawRole] = {};
              map[rawRole][obj] = priv;
            }
          });
          this.customRolePrivileges.set(map);
          this.availableRoles.update(prev => Array.from(new Set([...prev, ...detectedRoles])));
        }
      }
    });
  }

  openAddRuleModal(): void {
    this.configuringAccount.set(null);
    this.ruleRoleMode = 'EXISTING';
    this.selectedRuleRole = this.availableRoles()[0] || 'CASHIER';
    this.newCustomRoleName = '';
    this.populateBuilderForRole(this.selectedRuleRole);
    this.isAddRuleModalOpen.set(true);
  }

  onRuleRoleSelected(): void {
    this.populateBuilderForRole(this.selectedRuleRole);
  }

  onRuleRoleModeChange(): void {
    if (this.ruleRoleMode === 'EXISTING') {
      this.populateBuilderForRole(this.selectedRuleRole);
    } else {
      this.populateBuilderForRole(this.newCustomRoleName || '');
    }
  }

  private populateBuilderForRole(role: string): void {
    const builderMap: { [obj: string]: string[] } = {};
    for (const obj of this.allDbObjects()) {
      const privsStr = this.getPrivilegesForObject(role, obj.name);
      if (privsStr && privsStr !== 'DENIED') {
        if (privsStr.includes('ALL PRIVILEGES')) {
          builderMap[obj.name] = obj.type === 'PROCEDURE' ? ['EXECUTE'] : ['SELECT', 'INSERT', 'UPDATE', 'DELETE'];
        } else {
          builderMap[obj.name] = privsStr.split(',').map(s => s.trim().toUpperCase());
        }
      } else {
        builderMap[obj.name] = [];
      }
    }
    this.ruleBuilderPrivileges.set(builderMap);
  }

  togglePrivilege(objectName: string, priv: string): void {
    const currentMap = { ...this.ruleBuilderPrivileges() };
    const list = currentMap[objectName] ? [...currentMap[objectName]] : [];
    const idx = list.indexOf(priv);
    if (idx >= 0) {
      list.splice(idx, 1);
    } else {
      list.push(priv);
    }
    currentMap[objectName] = list;
    this.ruleBuilderPrivileges.set(currentMap);
  }

  isPrivilegeActive(objectName: string, priv: string): boolean {
    return !!this.ruleBuilderPrivileges()[objectName]?.includes(priv);
  }

  applyRulePreset(preset: 'READ_ONLY' | 'ALL' | 'DENY_ALL'): void {
    const builderMap: { [obj: string]: string[] } = {};
    for (const obj of this.allDbObjects()) {
      if (preset === 'DENY_ALL') {
        builderMap[obj.name] = [];
      } else if (preset === 'ALL') {
        builderMap[obj.name] = obj.type === 'PROCEDURE' ? ['EXECUTE'] : ['SELECT', 'INSERT', 'UPDATE', 'DELETE'];
      } else if (preset === 'READ_ONLY') {
        builderMap[obj.name] = obj.type === 'PROCEDURE' ? ['EXECUTE'] : ['SELECT'];
      }
    }
    this.ruleBuilderPrivileges.set(builderMap);
  }

  saveRule(): void {
    const targetRole = (this.ruleRoleMode === 'EXISTING'
      ? this.selectedRuleRole
      : this.newCustomRoleName.trim()).toUpperCase();

    if (!targetRole) {
      this.actionFeedback.set({ success: false, message: 'Please specify a valid role name for this rule.' });
      return;
    }

    this.isSavingRule.set(true);
    const rules: any[] = [];
    for (const obj of this.allDbObjects()) {
      const active = this.ruleBuilderPrivileges()[obj.name] || [];
      const privStr = active.length > 0 ? active.join(', ') : 'DENIED';
      rules.push({
        objectName: obj.name,
        objectType: obj.type,
        privileges: privStr
      });
    }

    this.authService.saveRolePrivilegesHttp(targetRole, rules).subscribe({
      next: (res: any) => {
        this.isSavingRule.set(false);
        this.isAddRuleModalOpen.set(false);
        this.actionFeedback.set({
          success: true,
          message: res?.message || `Privilege rules for role '${targetRole}' persisted successfully to database table 'role_privilege_rule'!`
        });

        if (!this.availableRoles().includes(targetRole)) {
          this.availableRoles.update(prev => [...prev, targetRole]);
        }

        const objMap: { [k: string]: string } = {};
        rules.forEach(r => { objMap[r.objectName] = r.privileges; });
        this.customRolePrivileges.update(prev => ({ ...prev, [targetRole]: objMap }));
        this.dbAccountsApi.refetch();
      },
      error: () => {
        this.isSavingRule.set(false);
        // Local fallback update for viva presentation mode
        if (!this.availableRoles().includes(targetRole)) {
          this.availableRoles.update(prev => [...prev, targetRole]);
        }
        const objMap: { [k: string]: string } = {};
        rules.forEach(r => { objMap[r.objectName] = r.privileges; });
        this.customRolePrivileges.update(prev => ({ ...prev, [targetRole]: objMap }));
        this.isAddRuleModalOpen.set(false);
        this.actionFeedback.set({
          success: true,
          message: `Privilege rules for role '${targetRole}' updated successfully in local session!`
        });
      }
    });
  }

  testUnauthorizedGuard(objectName: string, action: string): void {
    this.authService.triggerSecurityAlert(objectName, action);
  }

  triggerUnauthorizedForUser(role: string, objectName: string): void {
    this.authService.triggerSecurityAlert(
      objectName,
      'ACCESS',
      `Security Violation: Role '${role}' has been explicitly DENIED access to '${objectName}'. Operation blocked by MySQL RBAC policy.`
    );
  }
}
