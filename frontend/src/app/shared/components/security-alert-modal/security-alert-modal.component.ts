import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-security-alert-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (authService.securityAlert(); as alert) {
      <div class="modal-backdrop security-alert-backdrop" (click)="closeAlert()">
        <div class="modal-card security-alert-card" (click)="$event.stopPropagation()">
          <div class="security-alert-header">
            <div class="security-icon-circle">
              <span class="material-symbols-outlined" style="font-size: 26px;">gpp_bad</span>
            </div>
            <div style="flex: 1;">
              <h3 class="security-alert-title">{{ alert.title }}</h3>
              <span class="security-alert-badge">RBAC SECURITY VIOLATION</span>
            </div>
            <button class="close-btn" (click)="closeAlert()" title="Close Warning">&times;</button>
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
            <button class="btn-pill btn-danger" (click)="closeAlert()">
              <span class="material-symbols-outlined">close</span> Dismiss Security Warning
            </button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .modal-backdrop {
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 99999;
      animation: fadeIn 0.2s ease-out;
    }

    .security-alert-backdrop {
      background: rgba(69, 10, 10, 0.65);
      backdrop-filter: blur(4px);
    }

    .security-alert-card {
      background: #ffffff;
      border: 2px solid #ef4444;
      border-radius: 18px;
      box-shadow: 0 25px 50px -12px rgba(220, 38, 38, 0.45);
      width: 520px;
      max-width: 95vw;
      padding: 0;
      overflow: hidden;
      animation: modalSlideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1);
      display: flex;
      flex-direction: column;
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
      display: inline-block;
      margin-top: 4px;
      background: #dc2626;
      color: #ffffff;
      font-size: 0.65rem;
      font-weight: 800;
      padding: 2px 8px;
      border-radius: 4px;
      letter-spacing: 0.05em;
    }

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
        background: #fee2e2;
        color: #dc2626;
      }
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

    .btn-pill {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 8px 18px;
      border-radius: 9999px;
      font-size: 0.84rem;
      cursor: pointer;
      transition: all 0.2s ease;

      .material-symbols-outlined {
        font-size: 18px;
      }
    }

    .btn-danger {
      background: #dc2626;
      color: #ffffff;
      border: none;
      font-weight: 700;

      &:hover {
        background: #b91c1c;
        box-shadow: 0 4px 12px rgba(220, 38, 38, 0.3);
      }
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    @keyframes modalSlideUp {
      from { transform: translateY(20px) scale(0.97); opacity: 0; }
      to { transform: translateY(0) scale(1); opacity: 1; }
    }
  `]
})
export class SecurityAlertModalComponent {
  readonly authService = inject(AuthService);

  closeAlert(): void {
    this.authService.closeSecurityAlert();
  }
}
