import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BackupInfo } from '../../../../core/models';

@Component({
  selector: 'app-backup-snapshots-table',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="table-container">
      <!-- Loading Skeleton State -->
      @if (isLoading && backups.length === 0) {
        <div class="skeleton-table">
          <div class="skeleton-row header-skeleton"></div>
          @for (s of [1, 2, 3]; track s) {
            <div class="skeleton-row data-skeleton"></div>
          }
        </div>
      } @else if (backups.length === 0) {
        <!-- Empty State -->
        <div class="empty-state">
          <div class="empty-icon-circle">
            <span class="material-symbols-outlined">folder_zip</span>
          </div>
          <h4 class="empty-title">No Backup Snapshots Available</h4>
          <p class="empty-desc">
            No database snapshots found on disk. Click <strong>Take Consistent Snapshot</strong> above to execute a non-blocking InnoDB MVCC backup.
          </p>
        </div>
      } @else {
        <!-- Responsive Data Table -->
        <div class="table-responsive">
          <table class="data-table">
            <thead>
              <tr class="header-row">
                <th scope="col">SNAPSHOT ID</th>
                <th scope="col">CREATED AT</th>
                <th scope="col">TYPE</th>
                <th scope="col">SIZE</th>
                <th scope="col">STATUS</th>
                <th scope="col" style="text-align: right;">ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              @for (b of backups; track b.fileName) {
                <tr class="data-row">
                  <!-- Snapshot ID / Filename -->
                  <td>
                    <div class="snapshot-col">
                      <span class="material-symbols-outlined file-glyph">description</span>
                      <div class="snapshot-name-group">
                        <strong class="snapshot-name">{{ b.fileName }}</strong>
                        <span class="binlog-coord" [title]="'PITR Coordinate: ' + b.binlogCoordinate">
                          PITR: {{ b.binlogCoordinate }}
                        </span>
                      </div>
                    </div>
                  </td>

                  <!-- Created At -->
                  <td>
                    <span class="timestamp-text">{{ b.createdAt }}</span>
                  </td>

                  <!-- Type -->
                  <td>
                    <span class="type-pill">Full Snapshot</span>
                  </td>

                  <!-- Size -->
                  <td>
                    <span class="size-text">{{ b.fileSizeKb }} KB</span>
                  </td>

                  <!-- Status (emerald / amber / red badge) -->
                  <td>
                    <span
                      class="status-badge"
                      [class.badge-emerald]="b.status === 'SUCCESS' || b.status === 'CONSISTENT'"
                      [class.badge-amber]="b.status === 'PENDING' || b.status === 'IN_PROGRESS'"
                      [class.badge-red]="b.status === 'FAILED' || b.status === 'CORRUPTED'"
                    >
                      <span class="status-dot-sm"></span>
                      {{ b.status === 'SUCCESS' ? 'CONSISTENT' : b.status }}
                    </span>
                  </td>

                  <!-- Actions: Restore, Download -->
                  <td style="text-align: right;">
                    <div class="actions-group">
                      <button
                        type="button"
                        class="btn-action btn-download"
                        (click)="onDownload.emit(b.fileName)"
                        [attr.aria-label]="'Download snapshot file ' + b.fileName"
                        title="Download snapshot .sql file"
                      >
                        <span class="material-symbols-outlined">download</span>
                        <span>Download</span>
                      </button>
                      <button
                        type="button"
                        class="btn-action btn-restore"
                        (click)="onRestore.emit(b)"
                        [attr.aria-label]="'Restore database from ' + b.fileName"
                        title="Execute Point-In-Time Disaster Recovery"
                      >
                        <span class="material-symbols-outlined">restart_alt</span>
                        <span>Restore</span>
                      </button>
                    </div>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }

    .table-container {
      width: 100%;
    }

    .table-responsive {
      overflow-x: auto;
      border-radius: 0.5rem;
    }

    .data-table {
      width: 100%;
      border-collapse: collapse;
      text-align: left;
      font-size: 0.84rem;
    }

    /* Light-grey header row */
    .header-row th {
      background: #f9fafb; /* bg-gray-50 */
      color: #4b5563; /* gray-600 */
      font-weight: 700;
      font-size: 0.72rem;
      letter-spacing: 0.04em;
      text-transform: uppercase;
      padding: 12px 16px;
      border-bottom: 1px solid #e5e7eb; /* border-gray-200 */
      white-space: nowrap;
    }

    /* Row hover state */
    .data-row {
      transition: background-color 0.15s ease;

      td {
        padding: 14px 16px;
        border-bottom: 1px solid #f3f4f6;
        vertical-align: middle;
      }

      &:hover {
        background-color: #f9fafb; /* hover state */
      }
    }

    .snapshot-col {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .file-glyph {
      font-size: 20px;
      color: #059669; /* emerald-600 */
      flex-shrink: 0;
    }

    .snapshot-name-group {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .snapshot-name {
      font-family: 'JetBrains Mono', 'Fira Code', monospace;
      font-size: 0.84rem;
      color: #111827; /* gray-900 */
    }

    .binlog-coord {
      font-family: 'JetBrains Mono', 'Fira Code', monospace;
      font-size: 0.7rem;
      color: #6b7280; /* gray-500 */
      background: #f3f4f6;
      padding: 1px 6px;
      border-radius: 4px;
      width: fit-content;
      max-width: 280px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .timestamp-text {
      color: #374151;
      font-weight: 500;
      white-space: nowrap;
    }

    .type-pill {
      font-size: 0.72rem;
      font-weight: 600;
      background: #eff6ff;
      color: #1d4ed8;
      border: 1px solid #bfdbfe;
      padding: 3px 8px;
      border-radius: 6px;
      white-space: nowrap;
    }

    .size-text {
      font-family: 'JetBrains Mono', 'Fira Code', monospace;
      font-weight: 700;
      color: #111827;
      white-space: nowrap;
    }

    /* Status Badges: emerald, amber, red */
    .status-badge {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      font-size: 0.72rem;
      font-weight: 700;
      padding: 3px 9px;
      border-radius: 20px;
      letter-spacing: 0.03em;
      white-space: nowrap;

      .status-dot-sm {
        width: 6px;
        height: 6px;
        border-radius: 50%;
      }

      &.badge-emerald {
        background: #ecfdf5; /* emerald-50 */
        color: #047857; /* emerald-700 */
        border: 1px solid #a7f3d0;

        .status-dot-sm {
          background: #10b981; /* emerald-500 */
        }
      }

      &.badge-amber {
        background: #fef3c7;
        color: #b45309;
        border: 1px solid #fde68a;

        .status-dot-sm {
          background: #f59e0b;
        }
      }

      &.badge-red {
        background: #fef2f2;
        color: #dc2626;
        border: 1px solid #fecaca;

        .status-dot-sm {
          background: #ef4444;
        }
      }
    }

    .actions-group {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 8px;
    }

    .btn-action {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 5px 11px;
      border-radius: 0.375rem;
      font-size: 0.76rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.15s ease;

      .material-symbols-outlined {
        font-size: 16px;
      }

      &.btn-download {
        background: #ffffff;
        border: 1px solid #e5e7eb; /* border-gray-200 */
        color: #374151;

        &:hover {
          background: #f9fafb;
          border-color: #cbd5e1;
          color: #111827;
        }
      }

      &.btn-restore {
        background: #ffffff;
        border: 1px solid #fecaca;
        color: #dc2626;

        &:hover {
          background: #fef2f2;
          border-color: #f87171;
        }
      }
    }

    /* Empty state */
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
      padding: 3.5rem 1.5rem;
      color: #6b7280;
    }

    .empty-icon-circle {
      width: 56px;
      height: 56px;
      border-radius: 50%;
      background: #f3f4f6;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 1rem;

      .material-symbols-outlined {
        font-size: 28px;
        color: #9ca3af;
      }
    }

    .empty-title {
      font-size: 1rem;
      font-weight: 700;
      color: #111827;
      margin: 0 0 0.5rem 0;
    }

    .empty-desc {
      font-size: 0.85rem;
      max-width: 440px;
      margin: 0;
      line-height: 1.5;
    }

    /* Loading Skeleton */
    .skeleton-table {
      display: flex;
      flex-direction: column;
      gap: 10px;
      padding: 10px 0;
    }

    .skeleton-row {
      height: 48px;
      background: #f3f4f6;
      border-radius: 6px;
      animation: pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite;

      &.header-skeleton {
        height: 38px;
        background: #e5e7eb;
      }
    }

    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.4; }
    }
  `]
})
export class BackupSnapshotsTableComponent {
  @Input() backups: BackupInfo[] = [];
  @Input() isLoading: boolean = false;
  @Output() onRestore = new EventEmitter<BackupInfo>();
  @Output() onDownload = new EventEmitter<string>();
}
