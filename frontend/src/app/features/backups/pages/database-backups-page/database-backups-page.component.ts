import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap, catchError, of } from 'rxjs';
import { AuthService } from '../../../../core/services/auth.service';
import { BackupInfo } from '../../../../core/models';
import { RecoveryMetricCardComponent } from '../../components/recovery-metric-card/recovery-metric-card.component';
import { BackupSnapshotsTableComponent } from '../../components/backup-snapshots-table/backup-snapshots-table.component';

@Component({
  selector: 'app-database-backups-page',
  standalone: true,
  imports: [
    CommonModule,
    RecoveryMetricCardComponent,
    BackupSnapshotsTableComponent
  ],
  template: `
    <div class="page-container">
      <!-- Page Header -->
      <div class="page-header">
        <div class="header-titles">
          <div class="title-with-badge">
            <h1 class="page-title">Database Backups & DR</h1>
            <span class="badge-dr">DISASTER RECOVERY ENGINE</span>
          </div>
          <p class="page-subtitle">
            Enterprise database backup orchestration, InnoDB MVCC transactional snapshots, binary log coordinates, and point-in-time recovery (PITR).
          </p>
        </div>

        <div class="header-session-actions">
          <div class="session-box">
            <span class="session-label">DBA Session:</span>
            <span class="session-pill">
              <span class="status-dot-pulse"></span>
              {{ authService.currentUser().fullName }} ({{ authService.currentUser().role }}_ROLE)
            </span>
          </div>
          <button type="button" class="btn-header-signout" (click)="signOut()" title="Sign Out & Return to Login">
            <span class="material-symbols-outlined">logout</span>
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      <!-- Action Feedback Toast -->
      @if (actionFeedback()) {
        <div
          class="alert-toast"
          [class.toast-success]="actionFeedback()!.success"
          [class.toast-error]="!actionFeedback()!.success"
          role="alert"
        >
          <span class="material-symbols-outlined toast-icon">
            {{ actionFeedback()!.success ? 'check_circle' : 'error' }}
          </span>
          <span class="toast-message">{{ actionFeedback()!.message }}</span>
          <button type="button" class="btn-close-toast" (click)="actionFeedback.set(null)" aria-label="Close message">&times;</button>
        </div>
      }

      <div class="page-body">
        <!-- Reusable Metric Cards Row (Requirement 1) -->
        <div class="metrics-grid">
          <app-recovery-metric-card
            label="Recovery Point Objective"
            value="~0 Seconds"
            subtext="Continuous Binary Logging (sync_binlog=1)"
            icon="timer"
            iconBg="#ecfdf5"
            iconColor="#059669"
          ></app-recovery-metric-card>

          <app-recovery-metric-card
            label="Recovery Time Objective"
            value="< 5 Minutes"
            subtext="Automated Snapshot & Table Integrity Checks"
            icon="speed"
            iconBg="#eff6ff"
            iconColor="#2563eb"
          ></app-recovery-metric-card>

          <app-recovery-metric-card
            label="Backup Mode"
            value="Non-Blocking"
            subtext="--single-transaction (Zero POS Lock Contention)"
            icon="lock_open_right"
            iconBg="#fef3c7"
            iconColor="#d97706"
          ></app-recovery-metric-card>

          <app-recovery-metric-card
            label="Recovery Type"
            value="Coordinate Bound"
            subtext="--source-data=2 Replication Header"
            icon="history_toggle_off"
            iconBg="#f3e8ff"
            iconColor="#9333ea"
          ></app-recovery-metric-card>
        </div>

        <!-- Snapshots Card Section with Header & Action Buttons -->
        <div class="snapshots-section-card">
          <div class="section-card-header">
            <div class="header-left">
              <div class="card-icon-avatar">
                <span class="material-symbols-outlined">settings_backup_restore</span>
              </div>
              <div>
                <h3 class="section-title">Database Backup Snapshots</h3>
                <p class="section-subtitle">
                  Point-in-time recovery image catalog stored with binary log coordinate headers
                </p>
              </div>
            </div>

            <div class="card-actions">
              <button
                type="button"
                class="btn-secondary"
                [disabled]="isLoading()"
                (click)="refreshSnapshots()"
                title="Reload backup snapshot list from storage"
              >
                <span class="material-symbols-outlined" [class.rotating]="isLoading()">refresh</span>
                <span>Refresh Catalog</span>
              </button>

              <button
                type="button"
                class="btn-primary"
                [disabled]="isBackingUp()"
                (click)="takeSnapshot()"
                title="Execute non-blocking InnoDB snapshot"
              >
                @if (isBackingUp()) {
                  <span class="material-symbols-outlined rotating">progress_activity</span>
                  <span>Generating Snapshot...</span>
                } @else {
                  <span class="material-symbols-outlined">database</span>
                  <span>Take Consistent Snapshot</span>
                }
              </button>
            </div>
          </div>

          <!-- Snapshots Data Table Component -->
          <app-backup-snapshots-table
            [backups]="snapshots()"
            [isLoading]="isLoading()"
            (onRestore)="openRestoreModal($event)"
            (onDownload)="downloadSnapshot($event)"
          ></app-backup-snapshots-table>
        </div>
      </div>

      <!-- Point-In-Time Disaster Recovery Confirmation Modal -->
      @if (selectedBackupForRestore()) {
        <div class="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="restoreModalTitle">
          <div class="modal-dialog">
            <div class="modal-header">
              <div class="modal-title-group">
                <span class="material-symbols-outlined warning-glyph">warning</span>
                <h3 id="restoreModalTitle">Confirm Disaster Recovery Restore</h3>
              </div>
              <button type="button" class="btn-close-modal" (click)="selectedBackupForRestore.set(null)" aria-label="Close">&times;</button>
            </div>

            <div class="modal-body">
              <p class="modal-notice">
                You are about to rebuild the live <strong>supermarket_db</strong> catalog from the selected snapshot:
              </p>

              <div class="snapshot-details-card">
                <div class="detail-row">
                  <span class="label">Filename:</span>
                  <code class="val-code">{{ selectedBackupForRestore()!.fileName }}</code>
                </div>
                <div class="detail-row">
                  <span class="label">Archive Size:</span>
                  <span class="val-bold">{{ selectedBackupForRestore()!.fileSizeKb }} KB</span>
                </div>
                <div class="detail-row">
                  <span class="label">Snapshot Timestamp:</span>
                  <span class="val-bold">{{ selectedBackupForRestore()!.createdAt }}</span>
                </div>
                <div class="detail-row">
                  <span class="label">PITR Binlog Coordinate:</span>
                  <code class="val-code">{{ selectedBackupForRestore()!.binlogCoordinate }}</code>
                </div>
              </div>

              <div class="danger-callout">
                <span class="material-symbols-outlined callout-icon">gpp_bad</span>
                <div class="callout-text">
                  <strong>CRITICAL DATABASE REBUILD WARNING:</strong>
                  Existing relational tables and schema state will be wiped and reconstructed to this exact snapshot coordinate. An automated post-recovery row-count verification audit will run immediately.
                </div>
              </div>
            </div>

            <div class="modal-footer">
              <button
                type="button"
                class="btn-secondary"
                [disabled]="isRestoring()"
                (click)="selectedBackupForRestore.set(null)"
              >
                Cancel
              </button>
              <button
                type="button"
                class="btn-danger"
                [disabled]="isRestoring()"
                (click)="executeRestore()"
              >
                @if (isRestoring()) {
                  <span class="material-symbols-outlined rotating">progress_activity</span>
                  <span>Restoring Database...</span>
                } @else {
                  <span class="material-symbols-outlined">restart_alt</span>
                  <span>Confirm & Rebuild Database</span>
                }
              </button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    :host {
      display: block;
      min-height: 100vh;
      background: #f9fafb; /* bg-gray-50 */
    }

    .page-container {
      padding: 2rem;
      max-width: 1400px;
      margin: 0 auto;
      font-family: inherit;
    }

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 2rem;
      flex-wrap: wrap;
      gap: 1.25rem;
    }

    .header-titles {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .title-with-badge {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      flex-wrap: wrap;
    }

    .page-title {
      font-size: 1.75rem;
      font-weight: 800;
      color: #111827; /* gray-900 */
      letter-spacing: -0.025em;
      margin: 0;
    }

    .badge-dr {
      font-size: 0.72rem;
      font-weight: 700;
      letter-spacing: 0.05em;
      background: #ecfdf5; /* emerald-50 */
      color: #047857; /* emerald-700 */
      border: 1px solid #a7f3d0;
      padding: 3px 10px;
      border-radius: 9999px;
    }

    .page-subtitle {
      font-size: 0.92rem;
      color: #6b7280; /* gray-500 */
      margin: 0;
      max-width: 800px;
      line-height: 1.5;
    }

    .header-session-actions {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .btn-header-signout {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 7px 14px;
      background: #ffffff;
      border: 1px solid #fecaca;
      border-radius: 9999px;
      color: #dc2626;
      font-size: 0.82rem;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
      box-shadow: 0 1px 3px rgba(220, 38, 38, 0.08);

      &:hover {
        background: #fef2f2;
        border-color: #f87171;
        color: #b91c1c;
        transform: translateY(-1px);
        box-shadow: 0 4px 10px rgba(220, 38, 38, 0.15);
      }

      &:active {
        transform: translateY(0);
      }

      .material-symbols-outlined {
        font-size: 18px;
        color: #ef4444;
      }
    }

    .session-box {
      display: flex;
      align-items: center;
      gap: 8px;
      background: #ffffff;
      padding: 8px 16px;
      border-radius: 9999px;
      border: 1px solid #e5e7eb; /* border-gray-200 */
      box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05); /* shadow-sm */
    }

    .session-label {
      font-size: 0.78rem;
      font-weight: 600;
      color: #6b7280; /* gray-500 */
    }

    .session-pill {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font-size: 0.75rem;
      font-weight: 700;
      color: #047857; /* emerald-700 */
    }

    .status-dot-pulse {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #10b981; /* emerald-500 */
      box-shadow: 0 0 0 2px #d1fae5;
    }

    /* Action Alert Toast */
    .alert-toast {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 18px;
      border-radius: 0.75rem; /* rounded-xl */
      margin-bottom: 1.5rem;
      font-size: 0.9rem;
      font-weight: 500;
      animation: fadeIn 0.2s ease-in-out;

      &.toast-success {
        background: #ecfdf5; /* emerald-50 */
        color: #065f46;
        border: 1px solid #a7f3d0;
      }

      &.toast-error {
        background: #fef2f2;
        color: #991b1b;
        border: 1px solid #fecaca;
      }
    }

    .toast-icon {
      font-size: 20px;
      flex-shrink: 0;
    }

    .toast-message {
      flex: 1;
    }

    .btn-close-toast {
      background: transparent;
      border: none;
      font-size: 1.25rem;
      color: inherit;
      cursor: pointer;
      line-height: 1;
    }

    .page-body {
      display: flex;
      flex-direction: column;
      gap: 1.75rem;
    }

    /* Metric Cards Grid */
    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(1, minmax(0, 1fr));
      gap: 1.25rem;

      @media (min-width: 640px) {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }

      @media (min-width: 1024px) {
        grid-template-columns: repeat(4, minmax(0, 1fr));
      }
    }

    /* Snapshots Section Card */
    .snapshots-section-card {
      background: #ffffff;
      border: 1px solid #e5e7eb; /* border-gray-200 */
      border-radius: 0.75rem; /* rounded-xl */
      box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05); /* shadow-sm */
      padding: 1.5rem;
    }

    .section-card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.5rem;
      padding-bottom: 1.25rem;
      border-bottom: 1px solid #f3f4f6;
      flex-wrap: wrap;
      gap: 1rem;
    }

    .header-left {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .card-icon-avatar {
      width: 44px;
      height: 44px;
      border-radius: 0.625rem;
      background: #ecfdf5; /* emerald-50 */
      color: #059669; /* emerald-600 */
      display: flex;
      align-items: center;
      justify-content: center;

      .material-symbols-outlined {
        font-size: 24px;
      }
    }

    .section-title {
      font-size: 1.15rem;
      font-weight: 700;
      color: #111827; /* gray-900 */
      margin: 0;
    }

    .section-subtitle {
      font-size: 0.82rem;
      color: #6b7280; /* gray-500 */
      margin: 3px 0 0 0;
    }

    .card-actions {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .btn-primary {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: #059669; /* emerald-600 */
      color: #ffffff;
      font-size: 0.82rem;
      font-weight: 600;
      padding: 8px 18px;
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

    .btn-secondary {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: #ffffff;
      border: 1px solid #e5e7eb; /* border-gray-200 */
      color: #374151;
      font-size: 0.82rem;
      font-weight: 600;
      padding: 8px 16px;
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

    .btn-danger {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: #dc2626;
      color: #ffffff;
      font-size: 0.82rem;
      font-weight: 600;
      padding: 8px 18px;
      border-radius: 0.5rem;
      border: none;
      cursor: pointer;
      transition: background-color 0.15s ease;

      &:hover:not(:disabled) {
        background: #b91c1c;
      }

      &:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }
    }

    /* Modal Backdrop & Dialog */
    .modal-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(17, 24, 39, 0.6);
      backdrop-filter: blur(4px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 999;
      padding: 1rem;
    }

    .modal-dialog {
      background: #ffffff;
      border-radius: 1rem;
      width: 540px;
      max-width: 100%;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
      display: flex;
      flex-direction: column;
      overflow: hidden;
      animation: scaleUp 0.15s ease-out;
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1.25rem 1.5rem;
      border-bottom: 1px solid #f3f4f6;
    }

    .modal-title-group {
      display: flex;
      align-items: center;
      gap: 0.625rem;

      h3 {
        margin: 0;
        font-size: 1.1rem;
        font-weight: 700;
        color: #991b1b;
      }

      .warning-glyph {
        font-size: 24px;
        color: #dc2626;
      }
    }

    .btn-close-modal {
      background: transparent;
      border: none;
      font-size: 1.5rem;
      color: #9ca3af;
      cursor: pointer;
      line-height: 1;

      &:hover {
        color: #111827;
      }
    }

    .modal-body {
      padding: 1.5rem;
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }

    .modal-notice {
      margin: 0;
      font-size: 0.9rem;
      color: #374151;
    }

    .snapshot-details-card {
      background: #f9fafb; /* bg-gray-50 */
      border: 1px solid #e5e7eb; /* border-gray-200 */
      border-radius: 0.625rem;
      padding: 1rem;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      font-size: 0.82rem;
    }

    .detail-row {
      display: flex;
      justify-content: space-between;
      align-items: center;

      .label {
        color: #6b7280;
        font-weight: 500;
      }

      .val-bold {
        font-weight: 700;
        color: #111827;
      }

      .val-code {
        font-family: 'JetBrains Mono', 'Fira Code', monospace;
        font-size: 0.78rem;
        color: #047857; /* emerald-700 */
      }
    }

    .danger-callout {
      display: flex;
      align-items: flex-start;
      gap: 0.75rem;
      background: #fef2f2;
      border: 1px solid #fecaca;
      border-left: 4px solid #dc2626;
      border-radius: 0.5rem;
      padding: 0.875rem;
      font-size: 0.8rem;
      color: #991b1b;
      line-height: 1.4;

      .callout-icon {
        font-size: 20px;
        color: #dc2626;
        flex-shrink: 0;
      }
    }

    .modal-footer {
      display: flex;
      justify-content: flex-end;
      align-items: center;
      gap: 0.75rem;
      padding: 1rem 1.5rem;
      background: #f9fafb; /* bg-gray-50 */
      border-top: 1px solid #f3f4f6;
    }

    .rotating {
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      100% { transform: rotate(360deg); }
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    @keyframes scaleUp {
      from { transform: scale(0.96); opacity: 0; }
      to { transform: scale(1); opacity: 1; }
    }
  `]
})
export class DatabaseBackupsPage implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  readonly authService = inject(AuthService);

  signOut(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  readonly snapshots = signal<BackupInfo[]>([]);
  readonly isLoading = signal<boolean>(false);
  readonly isBackingUp = signal<boolean>(false);
  readonly isRestoring = signal<boolean>(false);
  readonly selectedBackupForRestore = signal<BackupInfo | null>(null);
  readonly actionFeedback = signal<{ success: boolean; message: string } | null>(null);

  ngOnInit(): void {
    this.refreshSnapshots();
  }

  refreshSnapshots(): void {
    this.isLoading.set(true);
    this.http.get<BackupInfo[]>('/api/admin/backups').pipe(
      catchError(() => of(this.authService.backups()))
    ).subscribe({
      next: (data) => {
        this.isLoading.set(false);
        if (data && data.length > 0) {
          this.snapshots.set(data);
          this.authService.backups.set(data);
        } else {
          this.snapshots.set(this.authService.backups());
        }
      },
      error: () => this.isLoading.set(false)
    });
  }

  takeSnapshot(): void {
    this.isBackingUp.set(true);
    this.http.post<BackupInfo>('/api/admin/backup', {}).subscribe({
      next: (res) => {
        this.isBackingUp.set(false);
        this.actionFeedback.set({
          success: true,
          message: `Database backup snapshot '${res.fileName}' (${res.fileSizeKb} KB) generated successfully via non-blocking mysqldump!`
        });
        this.refreshSnapshots();
      },
      error: (err) => {
        this.isBackingUp.set(false);
        this.actionFeedback.set({
          success: false,
          message: 'Database backup failed: ' + (err?.error?.message || err?.message || 'Server error')
        });
      }
    });
  }

  openRestoreModal(backup: BackupInfo): void {
    this.selectedBackupForRestore.set(backup);
  }

  downloadSnapshot(fileName: string): void {
    this.http.get(`/api/admin/backup/download/${fileName}`, { responseType: 'blob' }).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        this.actionFeedback.set({
          success: true,
          message: `Snapshot '${fileName}' downloaded successfully.`
        });
      },
      error: (err) => {
        this.actionFeedback.set({
          success: false,
          message: 'Download failed: ' + (err?.error?.message || err?.message || 'Server error')
        });
      }
    });
  }

  executeRestore(): void {
    const backup = this.selectedBackupForRestore();
    if (!backup) return;

    this.isRestoring.set(true);
    this.http.post<any>(`/api/admin/backup/restore/${backup.fileName}`, {}).subscribe({
      next: (res) => {
        this.isRestoring.set(false);
        this.selectedBackupForRestore.set(null);
        let detailMsg = '';
        if (res?.tableCounts) {
          const counts = res.tableCounts;
          detailMsg = ` [Verified: ${counts.employee || 0} employees, ${counts.branch || 0} branches, ${counts.customer || 0} customers, ${counts.product || 0} products, ${counts.sales_order || 0} orders]`;
        }
        this.actionFeedback.set({
          success: true,
          message: `Disaster Recovery Successful! Database restored from '${backup.fileName}'. Verified row counts across tables.${detailMsg}`
        });
        this.refreshSnapshots();
      },
      error: (err) => {
        this.isRestoring.set(false);
        this.actionFeedback.set({
          success: false,
          message: 'Disaster Recovery restore failed: ' + (err?.error?.message || err?.message || 'Server error')
        });
      }
    });
  }
}
