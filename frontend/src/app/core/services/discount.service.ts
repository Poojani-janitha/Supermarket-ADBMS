import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Coupon, DiscountRule, Holiday } from '../models';

interface DiscountRuleRow {
  rule_id: number;
  name: string;
  rule_type: DiscountRule['ruleType'];
  kind: DiscountRule['kind'];
  value: number;
  min_order_amount: number;
  max_discount: number | null;
  tier: string | null;
  start_date: string;
  end_date: string;
  priority: number;
  stackable: boolean;
  is_active: boolean;
}

interface CouponRow {
  code: string;
  rule_id: number;
  rule_name: string;
  max_uses: number;
  used_count: number;
  expires_on: string;
}

interface HolidayRow {
  holiday_date: string;
  name: string;
  discount_percent: number | null;
}

@Injectable({ providedIn: 'root' })
export class DiscountService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = '/api';

  readonly rules = signal<DiscountRule[]>([]);
  readonly coupons = signal<Coupon[]>([]);
  readonly holidays = signal<Holiday[]>([]);
  readonly loadError = signal<string | null>(null);

  constructor() {
    this.loadRules();
    this.loadCoupons();
    this.loadHolidays();
  }

  loadRules(): void {
    this.http.get<DiscountRuleRow[]>(`${this.apiUrl}/discounts/active`).subscribe({
      next: rows => this.rules.set(rows.map(row => ({
        ruleId: row.rule_id,
        name: row.name,
        ruleType: row.rule_type,
        kind: row.kind,
        value: Number(row.value),
        minOrderAmount: Number(row.min_order_amount),
        maxDiscount: row.max_discount === null ? undefined : Number(row.max_discount),
        tier: row.tier ?? undefined,
        startDate: row.start_date,
        endDate: row.end_date,
        priority: row.priority,
        stackable: row.stackable,
        isActive: row.is_active
      }))),
      error: () => this.loadError.set('Unable to load promotional rules.')
    });
  }

  loadCoupons(): void {
    this.http.get<CouponRow[]>(`${this.apiUrl}/discounts/coupons`).subscribe({
      next: rows => this.coupons.set(rows.map(row => ({
        code: row.code,
        ruleId: row.rule_id,
        ruleName: row.rule_name,
        maxUses: row.max_uses,
        usedCount: row.used_count,
        expiresOn: row.expires_on
      }))),
      error: () => this.loadError.set('Unable to load coupons.')
    });
  }

  loadHolidays(): void {
    this.http.get<HolidayRow[]>(`${this.apiUrl}/discounts/holidays`).subscribe({
      next: rows => this.holidays.set(rows.map(row => ({
        holidayDate: row.holiday_date,
        name: row.name,
        discountPercent: this.toOptionalNumber(row.discount_percent)
      }))),
      error: () => this.loadError.set('Unable to load holidays.')
    });
  }

  private toOptionalNumber(value: number | string | null | undefined): number | undefined {
    if (value === null || value === undefined || value === '') {
      return undefined;
    }
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }

  addRule(rule: Omit<DiscountRule, 'ruleId'>) {
    return this.http.post(`${this.apiUrl}/discounts/rules`, rule);
  }

  addCoupon(coupon: Coupon) {
    return this.http.post(`${this.apiUrl}/discounts/coupons`, coupon);
  }

  addHoliday(holiday: Holiday) {
    return this.http.post(`${this.apiUrl}/discounts/holidays`, holiday);
  }
}
