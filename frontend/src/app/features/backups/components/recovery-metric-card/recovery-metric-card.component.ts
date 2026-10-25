import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-recovery-metric-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="metric-card">
      <div class="icon-box" [ngStyle]="{ background: iconBg, color: iconColor }">
        <span class="material-symbols-outlined">{{ icon }}</span>
      </div>
      <div class="metric-content">
        <span class="metric-label">{{ label }}</span>
        <span class="metric-value">{{ value }}</span>
        <span class="metric-sub">{{ subtext }}</span>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }

    .metric-card {
      background: #ffffff;
      border: 1px solid #e5e7eb; /* border-gray-200 */
      border-radius: 0.75rem; /* rounded-xl */
      box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05); /* shadow-sm */
      padding: 1.25rem;
      display: flex;
      align-items: center;
      gap: 1rem;
      transition: transform 0.2s ease, box-shadow 0.2s ease;

      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.08);
      }
    }

    .icon-box {
      width: 48px;
      height: 48px;
      border-radius: 0.625rem;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;

      .material-symbols-outlined {
        font-size: 24px;
      }
    }

    .metric-content {
      display: flex;
      flex-direction: column;
      gap: 2px;
      min-width: 0;
    }

    .metric-label {
      font-size: 0.75rem;
      font-weight: 600;
      color: #6b7280; /* gray-500 */
      text-transform: uppercase;
      letter-spacing: 0.03em;
    }

    .metric-value {
      font-size: 1.25rem;
      font-weight: 800;
      color: #111827; /* gray-900 */
      letter-spacing: -0.02em;
    }

    .metric-sub {
      font-size: 0.72rem;
      color: #9ca3af;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
  `]
})
export class RecoveryMetricCardComponent {
  @Input({ required: true }) label!: string;
  @Input({ required: true }) value!: string;
  @Input({ required: true }) subtext!: string;
  @Input({ required: true }) icon!: string;
  @Input() iconBg: string = '#ecfdf5';
  @Input() iconColor: string = '#059669';
}
