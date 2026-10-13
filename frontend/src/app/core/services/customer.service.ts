import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Customer } from '../models';

@Injectable({
  providedIn: 'root'
})
export class CustomerService {
  private readonly http = inject(HttpClient);

  // Privacy data masking toggle (Member 5 ADBMS feature demonstration)
  readonly isDataMasked = signal<boolean>(true);
  readonly customers = signal<Customer[]>([]);

  constructor() {
    this.loadCustomers();
  }

  loadCustomers(): void {
    this.http.get<Customer[]>('/api/customers').subscribe({
      next: (list) => {
        this.customers.set(list);
      },
      error: (err) => {
        console.warn('Could not load customers from database:', err);
      }
    });
  }

  // Computes customer view with fn_mask_phone logic when masking is enabled
  readonly displayedCustomers = computed(() => {
    const masked = this.isDataMasked();
    return this.customers().map(c => ({
      ...c,
      phone: masked ? this.maskPhone(c.phone) : c.phone
    }));
  });

  toggleMasking(): void {
    this.isDataMasked.update(v => !v);
  }

  maskPhone(phone: string): string {
    if (!phone || phone.length < 7) return phone;
    const prefix = phone.substring(0, 3);
    const suffix = phone.substring(phone.length - 3);
    return `${prefix}****${suffix}`;
  }

  registerCustomer(c: { fullName: string; phone: string; email?: string }): void {
    const newCust: Customer = {
      fullName: c.fullName,
      phone: c.phone,
      email: c.email,
      loyaltyPoints: 0,
      tier: 'BRONZE',
      id: Math.floor(100 + Math.random() * 900),
      registeredDate: new Date().toISOString().split('T')[0]
    };
    this.customers.update(list => [newCust, ...list]);
  }
}
