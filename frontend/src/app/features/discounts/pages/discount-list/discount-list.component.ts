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
        </div>
        <div class="header-actions">
        <button class="btn-pill btn-outline" (click)="openRuleModal()">
          <span class="material-symbols-outlined">tune</span> Add Promotion Rule
        </button>
        <button class="btn-pill btn-outline" (click)="openHolidayModal()">
          <span class="material-symbols-outlined">event</span> Add Holiday
        </button>
        <button class="btn-pill btn-primary" (click)="openCouponModal()">
          <span class="material-symbols-outlined">add</span> Create Coupon
        </button>
        </div>
      </div>

      @if (isRuleModalOpen) {
        <div class="modal-backdrop" (click)="closeRuleModal()">
          <div class="modal-dialog rule-dialog" (click)="$event.stopPropagation()">
            <div class="modal-header"><div><h3 class="modal-title">Add Promotion Rule</h3><p class="modal-subtitle">Define when and how a discount is applied.</p></div><button class="close-btn" (click)="closeRuleModal()">&times;</button></div>
            <p class="procedure-note">Saves through <strong>sp_save_discount_rule</strong>. A HOLIDAY rule becomes eligible only when the order date is in the holiday calendar.</p>
            @if (ruleError) { <div class="form-error">{{ ruleError }}</div> }
            <div class="form-group"><label>Rule Name *</label><input class="form-control" [(ngModel)]="ruleName" placeholder="e.g. Christmas 10% Promotion"></div>
            <div class="form-row">
              <div class="form-group"><label>Rule Type *</label><select class="form-control" [(ngModel)]="ruleType"><option value="HOLIDAY">Holiday</option><option value="COUPON">Coupon</option><option value="LOYALTY">Loyalty</option><option value="FIRST_PURCHASE">First Purchase</option></select></div>
              <div class="form-group"><label>Discount Kind *</label><select class="form-control" [(ngModel)]="ruleKind"><option value="PERCENT">Percentage</option><option value="FIXED">Fixed Amount</option></select></div>
            </div>
            <div class="form-row">
              <div class="form-group"><label>{{ ruleKind === 'PERCENT' ? 'Discount Percentage' : 'Discount Amount' }} *</label><input class="form-control" type="number" min="0.01" [max]="ruleKind === 'PERCENT' ? 100 : null" step="0.01" [(ngModel)]="ruleValue"></div>
              <div class="form-group"><label>Minimum Order Amount *</label><input class="form-control" type="number" min="0" step="0.01" [(ngModel)]="ruleMinOrder"></div>
            </div>
            <div class="form-row">
              <div class="form-group"><label>Maximum Discount</label><input class="form-control" type="number" min="0" step="0.01" [(ngModel)]="ruleMaxDiscount" placeholder="Optional"></div>
              <div class="form-group"><label>Priority *</label><input class="form-control" type="number" min="0" step="1" [(ngModel)]="rulePriority"><small>Lower number runs first.</small></div>
            </div>
            <div class="form-row">
              <div class="form-group"><label>Start Date *</label><input class="form-control" type="date" [(ngModel)]="ruleStartDate"></div>
              <div class="form-group"><label>End Date *</label><input class="form-control" type="date" [(ngModel)]="ruleEndDate"></div>
            </div>
            @if (ruleType === 'LOYALTY') { <div class="form-group"><label>Loyalty Tier *</label><select class="form-control" [(ngModel)]="ruleTier"><option value="">Select tier</option><option value="BRONZE">Bronze</option><option value="SILVER">Silver</option><option value="GOLD">Gold</option></select></div> }
            <label class="checkbox-row"><input type="checkbox" [(ngModel)]="ruleStackable"> Allow this discount to combine with other discounts</label>
            <div class="modal-actions"><button class="btn-pill btn-outline" (click)="closeRuleModal()">Cancel</button><button class="btn-pill btn-primary" [disabled]="isSavingRule" (click)="saveRule()">{{ isSavingRule ? 'Saving...' : 'Create Rule' }}</button></div>
          </div>
        </div>
      }

      @if (isHolidayModalOpen) {
        <div class="modal-backdrop" (click)="closeHolidayModal()">
          <div class="modal-dialog" (click)="$event.stopPropagation()">
            <div class="modal-header"><div><h3 class="modal-title">Add Holiday to Calendar</h3><p class="modal-subtitle">Register a date for holiday-based promotions.</p></div><button class="close-btn" (click)="closeHolidayModal()">&times;</button></div>
            <p class="procedure-note">Saves the holiday and its matching <strong>HOLIDAY</strong> promotion atomically. Enter the percentage you want to apply on that date.</p>
            @if (holidayError) { <div class="form-error">{{ holidayError }}</div> }
            <div class="form-group"><label>Holiday Date *</label><input class="form-control" type="date" [(ngModel)]="holidayDate"></div>
            <div class="form-group"><label>Holiday Name *</label><input class="form-control" [(ngModel)]="holidayName" placeholder="e.g. Christmas Day"></div>
            <div class="form-group"><label>Discount Percentage *</label><input class="form-control" type="number" min="0.01" max="100" step="0.01" [(ngModel)]="holidayDiscountPercent"><small>Enter a value from 0.01% to 100%.</small></div>
            <div class="modal-actions"><button class="btn-pill btn-outline" (click)="closeHolidayModal()">Cancel</button><button class="btn-pill btn-primary" [disabled]="isSavingHoliday" (click)="saveHoliday()">{{ isSavingHoliday ? 'Saving...' : 'Add Holiday' }}</button></div>
          </div>
        </div>
      }

      @if (isCouponModalOpen) {
        <div class="modal-backdrop" (click)="closeCouponModal()">
          <div class="modal-dialog coupon-dialog" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <div>
                <h3 class="modal-title">Create Promotional Coupon</h3>
                <p class="modal-subtitle">Link a coupon to an existing promotional rule.</p>
              </div>
              <button class="close-btn" (click)="closeCouponModal()">&times;</button>
            </div>

            <p class="procedure-note">
              Saves through <strong>sp_save_coupon</strong>. The coupon code is stored in uppercase and can only use letters, numbers, hyphens, or underscores.
            </p>

            @if (couponError) {
              <div class="form-error">{{ couponError }}</div>
            }

            <div class="form-group">
              <label for="coupon-code">Coupon Code *</label>
              <input
                id="coupon-code"
                class="form-control code-input"
                [value]="couponCode"
                (input)="setCouponCode($any($event.target).value)"
                maxlength="20"
                placeholder="e.g. FLASH20"
                autocomplete="off"
              />
              <small>Use 3–20 characters, such as FLASH20 or NEW_CUSTOMER.</small>
            </div>

            <div class="form-group">
              <label for="coupon-rule">Linked Promotion Rule *</label>
              <select id="coupon-rule" class="form-control" [(ngModel)]="couponRuleId">
                <option [ngValue]="null">Select a discount rule</option>
                @for (rule of discountService.rules(); track rule.ruleId) {
                  <option [ngValue]="rule.ruleId">
                    {{ rule.name }} — {{ rule.value }}{{ rule.kind === 'PERCENT' ? '%' : '' }} {{ rule.kind === 'FIXED' ? 'fixed' : 'off' }}
                  </option>
                }
              </select>
              @if (discountService.rules().length === 0) {
                <small class="field-warning">No active promotion rules are available. Create a rule before creating a coupon.</small>
              }
            </div>

            <div class="form-row">
              <div class="form-group">
                <label for="coupon-max-uses">Maximum Uses *</label>
                <input id="coupon-max-uses" class="form-control" type="number" min="1" step="1" [(ngModel)]="couponMaxUses" />
                <small>Number of times customers may redeem it.</small>
              </div>
              <div class="form-group">
                <label for="coupon-expires">Expiry Date *</label>
                <input id="coupon-expires" class="form-control" type="date" [(ngModel)]="couponExpiresOn" />
                <small>Coupon cannot be used after this date.</small>
              </div>
            </div>

            <div class="modal-actions">
              <button class="btn-pill btn-outline" (click)="closeCouponModal()">Cancel</button>
              <button class="btn-pill btn-primary" [disabled]="isSavingCoupon" (click)="saveCoupon()">
                {{ isSavingCoupon ? 'Saving...' : 'Create Coupon' }}
              </button>
            </div>
          </div>
        </div>
      }

      

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
                  <td>
                    @if (h.discountPercent !== undefined) {
                      <span class="badge-pill badge-veg">{{ h.discountPercent }}% OFF</span>
                    } @else {
                      <span class="badge-pill badge-muted">No discount configured</span>
                    }
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
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
                <td>Rs. {{ rule.minOrderAmount.toFixed(2) }}</td>
                <td>{{ rule.startDate }} to {{ rule.endDate }}</td>
                <td>{{ rule.stackable ? 'Yes' : 'No' }}</td>
                <td><span class="badge-pill badge-veg">ACTIVE</span></td>
              </tr>
            }
          </tbody>
        </table>
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

    .header-actions { display: flex; gap: 10px; flex-wrap: wrap; justify-content: flex-end; }

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

    .badge-muted {
      background: #f1f5f9;
      color: #64748b;
    }

    .modal-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(15, 23, 42, 0.4);
      backdrop-filter: blur(3px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
    }

    .modal-dialog {
      background: #ffffff;
      border-radius: var(--radius-lg);
      padding: 24px;
      width: min(560px, 92vw);
      box-shadow: 0 20px 50px rgba(0, 0, 0, 0.2);
      display: flex;
      flex-direction: column;
      gap: 14px;
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }

    .modal-title {
      margin: 0;
      font-size: 1.15rem;
      font-weight: 800;
    }

    .modal-subtitle {
      margin: 4px 0 0;
      color: var(--text-muted);
      font-size: 0.78rem;
    }

    .close-btn {
      background: transparent;
      border: none;
      font-size: 1.5rem;
      cursor: pointer;
      color: #9ca3af;
    }

    .procedure-note {
      background: #ecfdf5;
      border: 1px solid #a7f3d0;
      border-radius: 8px;
      padding: 10px;
      font-size: 0.78rem;
      color: var(--primary-green-dark);
      line-height: 1.4;
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 5px;
    }

    .form-group label {
      font-size: 0.78rem;
      font-weight: 700;
      color: #475569;
    }

    .form-control {
      padding: 9px 12px;
      border-radius: 8px;
      border: 1px solid #cbd5e1;
      font-family: inherit;
      font-size: 0.9rem;
      background: #ffffff;
    }

    .code-input {
      text-transform: uppercase;
      font-family: monospace;
      font-weight: 700;
      letter-spacing: 0.04em;
    }

    .form-group small {
      color: var(--text-muted);
      font-size: 0.7rem;
    }

    .field-warning, .form-error {
      color: #b45309;
    }

    .form-error {
      padding: 10px;
      border-radius: 8px;
      background: #fef2f2;
      border: 1px solid #fecaca;
      color: #b91c1c;
      font-size: 0.8rem;
    }

    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 14px;
    }

    .modal-actions {
      display: flex;
      justify-content: flex-end;
      gap: 10px;
      margin-top: 8px;
    }

    .modal-actions button:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .checkbox-row { display: flex; align-items: center; gap: 8px; color: #475569; font-size: 0.8rem; }
  `]
})
export class DiscountListComponent {
  readonly discountService = inject(DiscountService);

  isCouponModalOpen = false;
  isSavingCoupon = false;
  couponError = '';
  couponCode = '';
  couponRuleId: number | null = null;
  couponMaxUses = 50;
  couponExpiresOn = '';
  isRuleModalOpen = false;
  isSavingRule = false;
  ruleError = '';
  ruleName = '';
  ruleType: 'FIRST_PURCHASE' | 'HOLIDAY' | 'LOYALTY' | 'COUPON' = 'HOLIDAY';
  ruleKind: 'PERCENT' | 'FIXED' = 'PERCENT';
  ruleValue = 10;
  ruleMinOrder = 0;
  ruleMaxDiscount: number | undefined;
  ruleTier = '';
  ruleStartDate = '';
  ruleEndDate = '';
  rulePriority = 10;
  ruleStackable = true;
  isHolidayModalOpen = false;
  isSavingHoliday = false;
  holidayError = '';
  holidayDate = '';
  holidayName = '';
  holidayDiscountPercent: number | null = null;

  openCouponModal(): void {
    this.couponError = '';
    this.couponCode = '';
    this.couponRuleId = this.discountService.rules()[0]?.ruleId ?? null;
    this.couponMaxUses = 50;
    this.couponExpiresOn = this.defaultExpiryDate();
    this.isCouponModalOpen = true;
  }

  closeCouponModal(): void {
    if (!this.isSavingCoupon) {
      this.isCouponModalOpen = false;
    }
  }

  setCouponCode(value: string): void {
    this.couponCode = value.toUpperCase().replace(/[^A-Z0-9_-]/g, '').slice(0, 20);
  }

  saveCoupon(): void {
    const code = this.couponCode.trim();
    if (!/^[A-Z0-9_-]{3,20}$/.test(code)) {
      this.couponError = 'Coupon code must contain 3–20 uppercase letters, numbers, hyphens, or underscores.';
      return;
    }
    if (this.couponRuleId === null) {
      this.couponError = 'Select the promotion rule linked to this coupon.';
      return;
    }
    if (!Number.isInteger(Number(this.couponMaxUses)) || Number(this.couponMaxUses) <= 0) {
      this.couponError = 'Maximum uses must be a positive whole number.';
      return;
    }
    if (!this.couponExpiresOn) {
      this.couponError = 'Select an expiry date.';
      return;
    }

    this.isSavingCoupon = true;
    this.couponError = '';
    this.discountService.addCoupon({
      code,
      ruleId: this.couponRuleId,
      maxUses: Number(this.couponMaxUses),
      usedCount: 0,
      expiresOn: this.couponExpiresOn
    }).subscribe({
      next: () => {
        this.discountService.loadCoupons();
        this.isSavingCoupon = false;
        this.isCouponModalOpen = false;
      },
      error: error => {
        this.isSavingCoupon = false;
        this.couponError = error?.error?.message || 'Unable to save coupon. Check the rule, code, and expiry date.';
      }
    });
  }

  private defaultExpiryDate(): string {
    const date = new Date();
    date.setDate(date.getDate() + 30);
    return date.toISOString().slice(0, 10);
  }

  openRuleModal(): void {
    this.ruleError = '';
    this.ruleName = '';
    this.ruleType = 'HOLIDAY';
    this.ruleKind = 'PERCENT';
    this.ruleValue = 10;
    this.ruleMinOrder = 0;
    this.ruleMaxDiscount = undefined;
    this.ruleTier = '';
    this.ruleStartDate = this.today();
    this.ruleEndDate = this.defaultExpiryDate();
    this.rulePriority = 10;
    this.ruleStackable = true;
    this.isRuleModalOpen = true;
  }

  closeRuleModal(): void { if (!this.isSavingRule) this.isRuleModalOpen = false; }

  saveRule(): void {
    if (!this.ruleName.trim() || !this.ruleStartDate || !this.ruleEndDate || this.ruleValue <= 0 || this.ruleMinOrder < 0 || this.rulePriority < 0) {
      this.ruleError = 'Complete the required fields with valid positive values.';
      return;
    }
    if (this.ruleEndDate < this.ruleStartDate) {
      this.ruleError = 'End date cannot be before start date.';
      return;
    }
    if (this.ruleKind === 'PERCENT' && this.ruleValue > 100) {
      this.ruleError = 'Percentage discount cannot exceed 100.';
      return;
    }
    if (this.ruleType === 'LOYALTY' && !this.ruleTier) {
      this.ruleError = 'Select a loyalty tier.';
      return;
    }
    this.isSavingRule = true;
    this.ruleError = '';
    this.discountService.addRule({
      name: this.ruleName.trim(), ruleType: this.ruleType, kind: this.ruleKind,
      value: Number(this.ruleValue), minOrderAmount: Number(this.ruleMinOrder),
      maxDiscount: this.ruleMaxDiscount === undefined ? undefined : Number(this.ruleMaxDiscount),
      tier: this.ruleTier || undefined, startDate: this.ruleStartDate, endDate: this.ruleEndDate,
      priority: Number(this.rulePriority), stackable: this.ruleStackable, isActive: true
    }).subscribe({
      next: () => { this.discountService.loadRules(); this.isSavingRule = false; this.isRuleModalOpen = false; },
      error: error => { this.isSavingRule = false; this.ruleError = error?.error?.message || 'Unable to save promotion rule.'; }
    });
  }

  openHolidayModal(): void {
    this.holidayError = '';
    this.holidayDate = this.today();
    this.holidayName = '';
    this.holidayDiscountPercent = null;
    this.isHolidayModalOpen = true;
  }

  closeHolidayModal(): void { if (!this.isSavingHoliday) this.isHolidayModalOpen = false; }

  saveHoliday(): void {
    if (!this.holidayDate || !this.holidayName.trim()
      || this.holidayDiscountPercent === null
      || this.holidayDiscountPercent <= 0
      || this.holidayDiscountPercent > 100) {
      this.holidayError = 'Holiday date, name and a discount percentage between 0.01 and 100 are required.';
      return;
    }
    this.isSavingHoliday = true;
    this.holidayError = '';
    this.discountService.addHoliday({
      holidayDate: this.holidayDate,
      name: this.holidayName.trim(),
      discountPercent: Number(this.holidayDiscountPercent)
    }).subscribe({
      next: () => { this.discountService.loadHolidays(); this.isSavingHoliday = false; this.isHolidayModalOpen = false; },
      error: error => { this.isSavingHoliday = false; this.holidayError = error?.error?.message || 'Unable to save holiday.'; }
    });
  }

  private today(): string { return new Date().toISOString().slice(0, 10); }
}
