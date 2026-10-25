import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map } from 'rxjs';
import { Customer, SalesOrder, SalesOrderDetails } from '../models';

interface CustomerRow {
  customer_id: number;
  full_name: string;
  phone: string;
  masked_phone?: string;
  email: string | null;
  loyalty_points: number;
  tier: Customer['tier'];
  registered_date: string;
  is_first_purchase?: boolean | number;
}

@Injectable({ providedIn: 'root' })
export class CustomerService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = '/api';

  readonly isDataMasked = signal<boolean>(true);
  readonly customers = signal<Customer[]>([]);
  readonly loadError = signal<string | null>(null);
  readonly displayedCustomers = computed(() => {
    const masked = this.isDataMasked();
    return this.customers().map(customer => ({
      ...customer,
      phone: masked ? (customer.maskedPhone || this.maskPhone(customer.phone)) : customer.phone
    }));
  });

  constructor() {
    this.loadCustomers();
  }

  loadCustomers(): void {
    this.http.get<CustomerRow[]>(`${this.apiUrl}/customers`).subscribe({
      next: rows => this.customers.set(rows.map(row => ({
        id: row.customer_id,
        fullName: row.full_name,
        phone: row.phone,
        maskedPhone: row.masked_phone || this.maskPhone(row.phone),
        email: row.email ?? undefined,
        loyaltyPoints: row.loyalty_points,
        tier: row.tier,
        registeredDate: row.registered_date,
        isFirstPurchase: row.is_first_purchase === true || row.is_first_purchase === 1
      }))),
      error: () => this.loadError.set('Unable to load customers from the database.')
    });
  }

  maskPhone(phone: string): string {
    if (!phone || phone.length < 7) return phone;
    return `${phone.substring(0, 3)}****${phone.substring(phone.length - 3)}`;
  }

  toggleMasking(): void {
    this.isDataMasked.update(value => !value);
  }

  registerCustomer(customer: Omit<Customer, 'id' | 'loyaltyPoints' | 'tier' | 'registeredDate'>) {
    return this.http.post<any>(`${this.apiUrl}/customers`, customer);
  }

  updateCustomer(customerId: number, customer: { fullName: string; phone: string; email: string; loyaltyPoints?: number }) {
    return this.http.put<Customer>(`${this.apiUrl}/customers/${customerId}`, customer);
  }

  getOrderHistory(customerId: number) {
    return this.http.get<Record<string, any>[]>(
      `${this.apiUrl}/customers/${customerId}/orders`
    ).pipe(map(mapRows));
  }

  getOrderDetails(customerId: number, orderId: number) {
    return this.http.get<Record<string, any>>(
      `${this.apiUrl}/customers/${customerId}/orders/${orderId}`
    ).pipe(map(mapDetails));
  }

  updateOrderStatus(customerId: number, orderId: number, status: SalesOrder['status']) {
    return this.http.put<Record<string, any>>(
      `${this.apiUrl}/customers/${customerId}/orders/${orderId}`,
      { status }
    ).pipe(map(mapOrder));
  }
}

const mapOrder = (row: Record<string, any>): SalesOrder => ({
  orderId: row['order_id'],
  branchId: row['branch_id'] ?? 0,
  branchName: row['branch_name'],
  customerId: row['customer_id'],
  customerName: row['customer_name'],
  customerPhone: row['customer_phone'],
  employeeId: row['employee_id'] ?? 0,
  employeeName: row['employee_name'],
  orderDate: row['order_date'],
  status: row['status'],
  subtotal: Number(row['subtotal']),
  discountTotal: Number(row['discount_total']),
  taxAmount: 0,
  totalAmount: Number(row['total_amount']),
  paymentMethod: 'CASH',
  itemCount: Number(row['item_count'] ?? 0),
  items: [],
  discounts: []
});

const mapRows = (rows: Record<string, any>[]) => rows.map(mapOrder);

const mapDetails = (row: Record<string, any>): SalesOrderDetails => ({
  ...mapOrder(row),
  itemCount: Number(row['item_count'] ?? 0),
  items: (row['items'] ?? []).map((item: Record<string, any>) => ({
    productId: item['product_id'],
    productName: item['product_name'],
    sku: item['sku'],
    quantity: item['quantity'],
    unitPrice: Number(item['unit_price']),
    lineTotal: Number(item['line_total'])
  })),
  discounts: (row['discounts'] ?? []).map((discount: Record<string, any>) => ({
    ruleId: discount['rule_id'],
    ruleName: discount['rule_name'],
    amount: Number(discount['amount'])
  })),
  payments: (row['payments'] ?? []).map((payment: Record<string, any>) => ({
    paymentId: payment['payment_id'],
    method: payment['method'],
    amount: Number(payment['amount']),
    paidAt: payment['paid_at']
  }))
});
