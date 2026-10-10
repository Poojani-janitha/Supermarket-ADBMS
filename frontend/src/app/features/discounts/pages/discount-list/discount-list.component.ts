import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DiscountService } from '../../../../core/services/discount.service';

@Component({
  selector: 'app-discount-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-container">
      <div class="page-header">
        <div>
          <h1 class="page-title">Discount Engine & Promotions</h1>
          <p class="page-subtitle">Evaluated by sp_apply_discounts (SQL Cursor) | Triggers: trg_rule_audit, trg_rule_check | Capped at 50%</p>
        </div>
        <button class="btn-pill btn-primary" (click)="openCouponModal()">
          <span class="material-symbols-outlined">add</span> Create Coupon
        </button>
      </div>

      <!-- Section 1: Active Promotion Rules -->
      <div class="section-card">
        <div class="card-title-row">
          <span class="material-symbols-outlined" style="color: var(--primary-green);">tune</span>
          <h3>Active Promotional Rules (Walked by Cursor in Priority Order)</h3>
        </div>

        <table class="data-table">
          <thead>
            <tr>
              <th>PRIORITY</th>
              <th>RULE NAME</th>
              <th>TYPE</th>
              <th>DISCOUNT</th>
              <th>MIN SPEND</th>
              <th>VALIDITY PERIOD</th>
              <th>STACKABLE</th>
              <th>STATUS</th>
            </tr>
          </thead>
          <tbody>
            @for (rule of discountService.rules(); track rule.ruleId) {
              <tr>
                <td><span class="priority-pill">#{{ rule.priority }}</span></td>
                <td><strong>{{ rule.name }}</strong></td>
                <td><span class="badge-pill badge-tier">{{ rule.ruleType }}</span></td>
                <td><span class="disc-highlight">{{ rule.value }}% OFF</span></td>
                <td>\${{ rule.minOrderAmount.toFixed(2) }}</td>
                <td>{{ rule.startDate }} to {{ rule.endDate }}</td>
                <td>{{ rule.stackable ? 'Yes' : 'No' }}</td>
                <td><span class="badge-pill badge-veg">ACTIVE</span></td>
              </tr>
            }
          </tbody>
        </table>
      </div>

      <!-- Section 2: Grid of Coupons and Holidays -->
      <div class="grid-2-col">
        <!-- Coupons Table -->
        <div class="section-card">
          <div class="card-title-row">
            <span class="material-symbols-outlined" style="color: #f59e0b;">confirmation_number</span>
            <h3>Promotional Coupons (coupon Table)</h3>
          </div>

          <table class="data-table">
            <thead>
              <tr>
                <th>CODE</th>
                <th>LINKED RULE</th>
                <th>USAGE</th>
                <th>EXPIRES</th>
              </tr>
            </thead>
            <tbody>
              @for (c of discountService.coupons(); track c.code) {
                <tr>
                  <td><span class="code-badge">{{ c.code }}</span></td>
                  <td>{{ c.ruleName }}</td>
                  <td>{{ c.usedCount }} / {{ c.maxUses }}</td>
                  <td>{{ c.expiresOn }}</td>
                </tr>
              }
            </tbody>
          </table>
        </div>

        <!-- Holidays Table -->
        <div class="section-card">
          <div class="card-title-row">
            <span class="material-symbols-outlined" style="color: #ec4899;">event</span>
            <h3>Holiday Calendar (holiday Table / fn_is_holiday)</h3>
          </div>

          <table class="data-table">
            <thead>
              <tr>
                <th>DATE</th>
                <th>HOLIDAY OCCASION</th>
                <th>STATUS</th>
              </tr>
            </thead>
            <tbody>
              @for (h of discountService.holidays(); track h.holidayDate) {
                <tr>
                  <td><span class="date-badge">{{ h.holidayDate }}</span></td>
                  <td><strong>{{ h.name }}</strong></td>
                  <td><span class="badge-pill badge-veg">ACTIVE 5%</span></td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>
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

    .section-card {
      background: #ffffff;
      border-radius: var(--radius-lg);
      border: 1px solid var(--border-subtle);
      box-shadow: var(--shadow-card);
      padding: 20px;
      display: flex;
      flex-direction: column;
      gap: 14px;
    }

    .card-title-row {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .card-title-row h3 {
      font-size: 1.05rem;
      font-weight: 700;
      color: var(--text-main);
      margin: 0;
    }

    .grid-2-col {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
    }

    .data-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.85rem;
    }

    .data-table th {
      background: #f8fafc;
      padding: 10px 14px;
      text-align: left;
      font-size: 0.74rem;
      font-weight: 700;
      color: #64748b;
      border-bottom: 1px solid var(--border-light);
    }

    .data-table td {
      padding: 10px 14px;
      border-bottom: 1px solid #f1f5f9;
      vertical-align: middle;
    }

    .priority-pill {
      font-family: monospace;
      font-weight: 700;
      background: #f1f5f9;
      padding: 2px 6px;
      border-radius: 4px;
    }

    .disc-highlight {
      font-weight: 800;
      color: var(--primary-green);
    }

    .code-badge {
      font-family: monospace;
      font-weight: 700;
      background: #fef3c7;
      color: #92400e;
      padding: 3px 8px;
      border-radius: 4px;
      border: 1px solid #fde68a;
    }

    .date-badge {
      font-family: monospace;
      font-weight: 600;
      color: #475569;
    }
  `]
})
export class DiscountListComponent {
  readonly discountService = inject(DiscountService);

  openCouponModal(): void {
    const code = prompt('Enter new coupon code (e.g. FLASH20):');
    if (code) {
      this.discountService.addCoupon({
        code: code.toUpperCase(),
        ruleId: 1,
        ruleName: 'Manual Coupon Promo',
        maxUses: 50,
        usedCount: 0,
        expiresOn: '2026-12-31'
      });
      alert(`Coupon ${code.toUpperCase()} registered.`);
    }
  }
}
