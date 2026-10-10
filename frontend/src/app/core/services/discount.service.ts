import { Injectable, signal } from '@angular/core';
import { DiscountRule, Coupon, Holiday } from '../models';

@Injectable({
  providedIn: 'root'
})
export class DiscountService {
  readonly rules = signal<DiscountRule[]>([
    {
      ruleId: 1,
      name: 'Welcome First Purchase',
      ruleType: 'FIRST_PURCHASE',
      kind: 'PERCENT',
      value: 10,
      minOrderAmount: 500,
      maxDiscount: 1000,
      startDate: '2026-01-01',
      endDate: '2027-12-31',
      priority: 10,
      stackable: false,
      isActive: true
    },
    {
      ruleId: 2,
      name: 'National Holiday Promotion',
      ruleType: 'HOLIDAY',
      kind: 'PERCENT',
      value: 5,
      minOrderAmount: 0,
      startDate: '2026-01-01',
      endDate: '2027-12-31',
      priority: 20,
      stackable: true,
      isActive: true
    },
    {
      ruleId: 3,
      name: 'Gold Member Privilege',
      ruleType: 'LOYALTY',
      kind: 'PERCENT',
      value: 7,
      minOrderAmount: 0,
      tier: 'GOLD',
      startDate: '2026-01-01',
      endDate: '2027-12-31',
      priority: 30,
      stackable: true,
      isActive: true
    },
    {
      ruleId: 4,
      name: 'Silver Member Privilege',
      ruleType: 'LOYALTY',
      kind: 'PERCENT',
      value: 5,
      minOrderAmount: 0,
      tier: 'SILVER',
      startDate: '2026-01-01',
      endDate: '2027-12-31',
      priority: 40,
      stackable: true,
      isActive: true
    }
  ]);

  readonly coupons = signal<Coupon[]>([
    {
      code: 'NEWYEAR50',
      ruleId: 2,
      ruleName: 'Holiday Special $5 Off',
      maxUses: 100,
      usedCount: 24,
      expiresOn: '2026-12-31'
    },
    {
      code: 'WELCOME10',
      ruleId: 1,
      ruleName: 'First Order 10% Off',
      maxUses: 500,
      usedCount: 142,
      expiresOn: '2026-12-31'
    }
  ]);

  readonly holidays = signal<Holiday[]>([
    { holidayDate: '2026-01-01', name: 'New Year\'s Day' },
    { holidayDate: '2026-01-14', name: 'Tamil Thai Pongal Day' },
    { holidayDate: '2026-02-04', name: 'National Independence Day' },
    { holidayDate: '2026-04-13', name: 'Sinhala & Tamil New Year' },
    { holidayDate: '2026-05-23', name: 'Vesak Full Moon Poya Day' },
    { holidayDate: '2026-12-25', name: 'Christmas Day' }
  ]);

  addRule(rule: Omit<DiscountRule, 'ruleId'>): void {
    const newId = Math.max(0, ...this.rules().map(r => r.ruleId)) + 1;
    this.rules.update(list => [...list, { ...rule, ruleId: newId }]);
  }

  addCoupon(coupon: Coupon): void {
    this.coupons.update(list => [...list, coupon]);
  }

  addHoliday(holiday: Holiday): void {
    this.holidays.update(list => [...list, holiday]);
  }
}
