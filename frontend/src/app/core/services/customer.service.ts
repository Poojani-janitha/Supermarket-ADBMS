import { Injectable, signal, computed } from '@angular/core';
import { Customer } from '../models';

@Injectable({
  providedIn: 'root'
})
export class CustomerService {
  // Privacy data masking toggle (Member 5 ADBMS feature demonstration)
  readonly isDataMasked = signal<boolean>(true);

  private readonly initialCustomers: Customer[] = [
    {
      id: 1,
      fullName: 'Jacob Jones',
      phone: '0771234567',
      email: 'jacob.jones@example.com',
      loyaltyPoints: 1250,
      tier: 'GOLD',
      registeredDate: '2024-05-12'
    },
    {
      id: 2,
      fullName: 'Bessie Coleman',
      phone: '0719876543',
      email: 'bessie.c@example.com',
      loyaltyPoints: 620,
      tier: 'SILVER',
      registeredDate: '2024-08-20'
    },
    {
      id: 3,
      fullName: 'Ralph Edwards',
      phone: '0754433221',
      email: 'ralph.e@example.com',
      loyaltyPoints: 180,
      tier: 'BRONZE',
      registeredDate: '2025-01-15'
    },
    {
      id: 4,
      fullName: 'Devon Lane',
      phone: '0785566778',
      email: 'devon.lane@example.com',
      loyaltyPoints: 2100,
      tier: 'GOLD',
      registeredDate: '2023-11-04'
    }
  ];

  readonly customers = signal<Customer[]>(this.initialCustomers);

  // Computes customer view with fn_mask_phone logic when masking is enabled
  readonly displayedCustomers = computed(() => {
    const masked = this.isDataMasked();
    return this.customers().map(c => ({
      ...c,
      phone: masked ? this.maskPhone(c.phone) : c.phone
    }));
  });

  maskPhone(phone: string): string {
    if (!phone || phone.length < 7) return phone;
    return `${phone.substring(0, 3)}****${phone.substring(phone.length - 3)}`;
  }

  toggleMasking(): void {
    this.isDataMasked.update(v => !v);
  }

  registerCustomer(customer: Omit<Customer, 'id' | 'loyaltyPoints' | 'tier' | 'registeredDate'>): void {
    const newId = Math.max(0, ...this.customers().map(c => c.id)) + 1;
    const newCustomer: Customer = {
      ...customer,
      id: newId,
      loyaltyPoints: 0,
      tier: 'BRONZE',
      registeredDate: new Date().toISOString().split('T')[0]
    };
    this.customers.update(list => [...list, newCustomer]);
  }
}
