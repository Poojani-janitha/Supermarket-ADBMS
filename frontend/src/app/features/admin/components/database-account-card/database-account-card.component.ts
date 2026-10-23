import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DatabaseAccount } from '../../../../core/models';

@Component({
  selector: 'app-database-account-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="account-card" [class.admin-card]="isAdminRole()">
      <!-- Card Top: Icon, Username, Host, and Status Dot -->
      <div class="card-header">
        <div class="user-meta">
          <div class="icon-avatar" [class.admin-avatar]="isAdminRole()">
            <span class="material-symbols-outlined">{{ getAccountIcon() }}</span>
          </div>
          <div class="user-title">
            <h4 class="username">{{ account.username }}</h4>
            <span class="host-pill">{{ '@' + account.host }}</span>
          </div>
        </div>

        <div class="status-box" [title]="'Status: ' + account.status">
          <span class="status-dot" [class.active]="account.status === 'active'"></span>
          <span class="status-text">{{ account.status }}</span>
        </div>
      </div>

      <!-- Role Badge & Privilege Counter -->
      <div class="role-privilege-row">
        <span
          class="role-badge"
          [class.role-admin]="account.role.includes('admin')"
          [class.role-mgr]="account.role.includes('manager') && !account.role.includes('db_manager')"
          [class.role-db-mgr]="account.role.includes('db_manager') || account.role.includes('db manager')"
          [class.role-hr]="account.role.includes('hr')"
          [class.role-cashier]="account.role.includes('cashier')"
          [class.role-direct]="account.role.includes('DIRECT') || account.role.includes('pool')"
        >
          <span class="material-symbols-outlined role-icon">shield_person</span>
          {{ account.role }}
        </span>

        <div class="privilege-count-badge" title="Number of granted database privileges">
          <span class="material-symbols-outlined count-icon">verified_user</span>
          <span>{{ account.privilegeCount }} Privileges</span>
        </div>
      </div>

      <!-- Activity & Created Info -->
      <div class="timestamps-row">
        <div class="meta-item">
          <span class="meta-label">Created:</span>
          <span class="meta-val">{{ account.createdAt }}</span>
        </div>
        <div class="meta-item">
          <span class="meta-label">Last Used:</span>
          <span class="meta-val">{{ account.lastUsedAt }}</span>
        </div>
      </div>

      <!-- Card Action Footer: Configure Button -->
      <div class="card-footer">
        <button
          type="button"
          class="btn-configure"
          (click)="onConfigure.emit(account)"
          [attr.aria-label]="'Configure privilege rules for ' + account.username"
        >
          <span class="material-symbols-outlined btn-icon">tune</span>
          <span>Configure Privileges</span>
        </button>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      height: 100%;
    }

    .account-card {
      background: #ffffff;
      border: 1px solid #e5e7eb; /* border-gray-200 */
      border-radius: 0.75rem; /* rounded-xl */
      box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05); /* shadow-sm */
      padding: 1.25rem;
      display: flex;
      flex-direction: column;
      gap: 1rem;
      height: 100%;
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
      position: relative;

      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.08), 0 2px 4px -1px rgba(0, 0, 0, 0.04);
        border-color: #cbd5e1;
      }

      &.admin-card {
        border-left: 3.5px solid #059669; /* emerald-600 */
      }
    }

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 0.75rem;
    }

    .user-meta {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .icon-avatar {
      width: 40px;
      height: 40px;
      border-radius: 0.625rem;
      background: #ecfdf5; /* emerald-50 */
      color: #059669; /* emerald-600 */
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;

      .material-symbols-outlined {
        font-size: 20px;
      }

      &.admin-avatar {
        background: #059669;
        color: #ffffff;
      }
    }

    .user-title {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .username {
      font-size: 0.95rem;
      font-weight: 700;
      color: #111827; /* gray-900 */
      margin: 0;
      font-family: 'JetBrains Mono', 'Fira Code', monospace;
    }

    .host-pill {
      font-size: 0.72rem;
      color: #6b7280; /* gray-500 */
      font-family: 'JetBrains Mono', 'Fira Code', monospace;
      background: #f3f4f6;
      padding: 1px 6px;
      border-radius: 4px;
      width: fit-content;
    }

    .status-box {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      background: #f9fafb;
      padding: 3px 8px;
      border-radius: 20px;
      border: 1px solid #e5e7eb;
    }

    .status-dot {
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background: #9ca3af;

      &.active {
        background: #10b981; /* emerald-500 */
        box-shadow: 0 0 0 2px #d1fae5;
      }
    }

    .status-text {
      font-size: 0.7rem;
      font-weight: 600;
      text-transform: capitalize;
      color: #4b5563;
    }

    .role-privilege-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.5rem;
      flex-wrap: wrap;
    }

    .role-badge {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      font-size: 0.72rem;
      font-weight: 700;
      padding: 3px 8px;
      border-radius: 6px;

      .role-icon {
        font-size: 14px;
      }

      &.role-admin {
        background: #ecfdf5; /* emerald-50 */
        color: #065f46; /* emerald-800 */
        border: 1px solid #a7f3d0;
      }

      &.role-mgr {
        background: #eff6ff;
        color: #1d4ed8;
        border: 1px solid #bfdbfe;
      }

      &.role-db-mgr {
        background: #f0fdf4;
        color: #047857;
        border: 1px solid #86efac;
      }

      &.role-hr {
        background: #fdf2f8;
        color: #9d174d;
        border: 1px solid #fbcfe8;
      }

      &.role-cashier {
        background: #fef3c7;
        color: #b45309;
        border: 1px solid #fde68a;
      }

      &.role-direct {
        background: #f3f4f6;
        color: #4b5563;
        border: 1px solid #e5e7eb;
      }
    }

    .privilege-count-badge {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      font-size: 0.72rem;
      font-weight: 600;
      color: #059669; /* emerald-600 */
      background: #ecfdf5; /* emerald-50 */
      padding: 3px 8px;
      border-radius: 6px;

      .count-icon {
        font-size: 14px;
      }
    }

    .timestamps-row {
      display: flex;
      flex-direction: column;
      gap: 3px;
      padding: 8px 10px;
      background: #f9fafb; /* bg-gray-50 */
      border: 1px solid #f3f4f6;
      border-radius: 6px;
      font-size: 0.72rem;
    }

    .meta-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .meta-label {
      color: #6b7280; /* gray-500 */
      font-weight: 500;
    }

    .meta-val {
      color: #374151;
      font-weight: 600;
      font-family: inherit;
    }

    .card-footer {
      margin-top: auto;
      padding-top: 0.5rem;
    }

    .btn-configure {
      width: 100%;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      background: #ffffff;
      border: 1px solid #e5e7eb; /* border-gray-200 */
      color: #111827; /* gray-900 */
      font-size: 0.78rem;
      font-weight: 600;
      padding: 7px 12px;
      border-radius: 0.5rem;
      cursor: pointer;
      transition: all 0.15s ease;

      .btn-icon {
        font-size: 16px;
        color: #059669; /* emerald-600 */
      }

      &:hover {
        background: #ecfdf5; /* emerald-50 */
        border-color: #a7f3d0; /* emerald-200 */
        color: #047857; /* emerald-700 */
      }
    }
  `]
})
export class DatabaseAccountCardComponent {
  @Input({ required: true }) account!: DatabaseAccount;
  @Output() onConfigure = new EventEmitter<DatabaseAccount>();

  isAdminRole(): boolean {
    return this.account.username.includes('admin') || this.account.role.includes('admin');
  }

  getAccountIcon(): string {
    if (this.account.username.includes('admin')) return 'admin_panel_settings';
    if (this.account.username.includes('manager')) return 'manage_accounts';
    if (this.account.username.includes('cashier')) return 'point_of_sale';
    if (this.account.username.includes('etl')) return 'sync_alt';
    if (this.account.username.includes('report')) return 'analytics';
    return 'database';
  }
}
