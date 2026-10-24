import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DatabaseAccount } from '../../../../core/models';
import { DatabaseAccountCardComponent } from '../database-account-card/database-account-card.component';

@Component({
  selector: 'app-database-account-grid',
  standalone: true,
  imports: [CommonModule, DatabaseAccountCardComponent],
  template: `
    <div class="account-grid-section">
      <!-- Section Header -->
      <div class="grid-header">
        <div class="title-group">
          <div class="header-icon-box">
            <span class="material-symbols-outlined">vpn_key</span>
          </div>
          <div>
            <h3 class="section-title">Dedicated Least-Privilege Database Accounts</h3>
            <p class="section-subtitle">
              Live MySQL 8.0 engine-level accounts, connection scopes, and active role assignments
            </p>
          </div>
        </div>

        <div class="header-actions">
          <span class="badge-count">
            <span class="material-symbols-outlined count-dot">dns</span>
            {{ accounts.length }} Accounts Provisioned
          </span>
          <button
            type="button"
            class="btn-provision"
            (click)="openProvisionModal.emit()"
            title="Provision a new database user account"
          >
            <span class="material-symbols-outlined">person_add</span>
            <span>+ Provision Account</span>
          </button>
          <button
            type="button"
            class="btn-refresh"
            [disabled]="isLoading"
            (click)="onRefresh.emit()"
            title="Refresh database account privileges"
          >
            <span class="material-symbols-outlined" [class.rotating]="isLoading">refresh</span>
            <span>Refresh</span>
          </button>
        </div>
      </div>

      <!-- Error State -->
      @if (error) {
        <div class="state-box error-box">
          <span class="material-symbols-outlined state-icon error-icon">error</span>
          <div class="state-content">
            <span class="state-title">Unable to Load Database Accounts</span>
            <span class="state-desc">{{ error }}</span>
          </div>
          <button type="button" class="btn-retry" (click)="onRefresh.emit()">
            <span class="material-symbols-outlined">replay</span>
            <span>Retry Connection</span>
          </button>
        </div>
      }

      <!-- Loading Skeleton State -->
      @if (isLoading && accounts.length === 0) {
        <div class="accounts-grid">
          @for (skeleton of [1, 2, 3]; track skeleton) {
            <div class="skeleton-card">
              <div class="skeleton-header">
                <div class="skeleton-avatar skeleton-pulse"></div>
                <div class="skeleton-lines">
                  <div class="skeleton-line line-short skeleton-pulse"></div>
                  <div class="skeleton-line line-micro skeleton-pulse"></div>
                </div>
              </div>
              <div class="skeleton-line line-badge skeleton-pulse"></div>
              <div class="skeleton-line line-full skeleton-pulse"></div>
              <div class="skeleton-line line-btn skeleton-pulse"></div>
            </div>
          }
        </div>
      } @else if (accounts.length === 0 && !error) {
        <!-- Empty State -->
        <div class="state-box empty-box">
          <span class="material-symbols-outlined state-icon">manage_accounts</span>
          <span class="state-title">No database accounts yet</span>
          <p class="state-desc">No active database service accounts detected in MySQL security tables.</p>
        </div>
      } @else {
        <!-- Responsive 1 / 2 / 3 Column Grid -->
        <div class="accounts-grid">
          @for (account of accounts; track account.id) {
            <app-database-account-card
              [account]="account"
              (onConfigure)="onConfigure.emit($event)"
            ></app-database-account-card>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    :host {
      display: block;
      margin-top: 1.5rem;
    }

    .account-grid-section {
      background: #ffffff;
      border: 1px solid #e5e7eb; /* border-gray-200 */
      border-radius: 0.75rem; /* rounded-xl */
      box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05); /* shadow-sm */
      padding: 1.5rem;
    }

    .grid-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.25rem;
      padding-bottom: 1rem;
      border-bottom: 1px solid #f3f4f6;
      flex-wrap: wrap;
      gap: 1rem;
    }

    .title-group {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .header-icon-box {
      width: 42px;
      height: 42px;
      border-radius: 0.625rem;
      background: #ecfdf5; /* emerald-50 */
      color: #059669; /* emerald-600 */
      display: flex;
      align-items: center;
      justify-content: center;

      .material-symbols-outlined {
        font-size: 22px;
      }
    }

    .section-title {
      font-size: 1.05rem;
      font-weight: 700;
      color: #111827; /* gray-900 */
      margin: 0;
    }

    .section-subtitle {
      font-size: 0.8rem;
      color: #6b7280; /* gray-500 */
      margin: 2px 0 0 0;
    }

    .header-actions {
      display: flex;
      align-items: center;
      gap: 0.625rem;
    }

    .badge-count {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      background: #f9fafb; /* bg-gray-50 */
      border: 1px solid #e5e7eb; /* border-gray-200 */
      color: #4b5563;
      font-size: 0.75rem;
      font-weight: 600;
      padding: 5px 12px;
      border-radius: 20px;

      .count-dot {
        font-size: 16px;
        color: #059669; /* emerald-600 */
      }
    }

    .btn-provision {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 6px 14px;
      font-size: 0.78rem;
      font-weight: 600;
      color: #ffffff;
      background: #059669; /* emerald-600 */
      border: 1px solid #059669;
      border-radius: 0.5rem;
      cursor: pointer;
      transition: all 0.15s ease;

      .material-symbols-outlined {
        font-size: 16px;
      }

      &:hover {
        background: #047857; /* emerald-700 */
        border-color: #047857;
      }
    }

    .btn-refresh {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      background: #ffffff;
      border: 1px solid #e5e7eb; /* border-gray-200 */
      color: #374151;
      font-size: 0.78rem;
      font-weight: 600;
      padding: 6px 14px;
      border-radius: 0.5rem;
      cursor: pointer;
      transition: all 0.15s ease;

      .material-symbols-outlined {
        font-size: 18px;
      }

      &:hover:not(:disabled) {
        background: #f9fafb;
        border-color: #cbd5e1;
        color: #111827;
      }

      &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
    }

    /* Responsive 1 / 2 / 3 Columns Grid */
    .accounts-grid {
      display: grid;
      grid-template-columns: repeat(1, minmax(0, 1fr));
      gap: 1.25rem;

      @media (min-width: 640px) {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }

      @media (min-width: 1024px) {
        grid-template-columns: repeat(3, minmax(0, 1fr));
      }
    }

    /* State Boxes: Error & Empty */
    .state-box {
      display: flex;
      align-items: center;
      padding: 1.25rem;
      border-radius: 0.75rem;
      gap: 1rem;
      margin-bottom: 1rem;

      &.error-box {
        background: #fef2f2;
        border: 1px solid #fecaca;
        color: #991b1b;
      }

      &.empty-box {
        flex-direction: column;
        justify-content: center;
        text-align: center;
        padding: 3rem 1.5rem;
        background: #f9fafb;
        border: 1px dashed #d1d5db;
        color: #6b7280;
      }
    }

    .state-icon {
      font-size: 32px;

      &.error-icon {
        color: #dc2626;
      }
    }

    .state-content {
      display: flex;
      flex-direction: column;
      gap: 2px;
      flex: 1;
    }

    .state-title {
      font-size: 0.92rem;
      font-weight: 700;
    }

    .state-desc {
      font-size: 0.8rem;
      margin: 0;
    }

    .btn-retry {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      background: #dc2626;
      color: #ffffff;
      border: none;
      padding: 6px 14px;
      border-radius: 0.5rem;
      font-size: 0.78rem;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.15s ease;

      &:hover {
        background: #b91c1c;
      }
    }

    /* Skeleton Loading Cards */
    .skeleton-card {
      background: #ffffff;
      border: 1px solid #e5e7eb;
      border-radius: 0.75rem;
      padding: 1.25rem;
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .skeleton-header {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .skeleton-avatar {
      width: 40px;
      height: 40px;
      border-radius: 0.625rem;
      background: #e5e7eb;
    }

    .skeleton-lines {
      display: flex;
      flex-direction: column;
      gap: 6px;
      flex: 1;
    }

    .skeleton-line {
      height: 12px;
      background: #e5e7eb;
      border-radius: 4px;

      &.line-short { width: 60%; }
      &.line-micro { width: 35%; height: 10px; }
      &.line-badge { width: 50%; height: 22px; border-radius: 6px; }
      &.line-full { width: 100%; height: 32px; border-radius: 6px; }
      &.line-btn { width: 100%; height: 32px; border-radius: 8px; margin-top: auto; }
    }

    .skeleton-pulse {
      animation: pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite;
    }

    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.4; }
    }

    .rotating {
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      100% { transform: rotate(360deg); }
    }
  `]
})
export class DatabaseAccountGridComponent {
  @Input() accounts: DatabaseAccount[] = [];
  @Input() isLoading: boolean = false;
  @Input() error: string | null = null;
  @Output() onRefresh = new EventEmitter<void>();
  @Output() onConfigure = new EventEmitter<DatabaseAccount>();
  @Output() openProvisionModal = new EventEmitter<void>();
}
