import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CustomerService } from '../../../../core/services/customer.service';
import { Customer, SalesOrder, SalesOrderDetails } from '../../../../core/models';

@Component({
  selector: 'app-customer-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-container">
      <!-- Header -->
      <div class="page-header">
        <div>
          <h1 class="page-title">Customer Loyalty & Registration</h1>
        </div>
        <button class="btn-pill btn-primary" (click)="isRegisterOpen.set(true)">
          <span class="material-symbols-outlined">person_add</span> Register Customer
        </button>
      </div>

      <!-- Quick Search & Tier Summary Cards -->
      <div class="tier-summary-grid">
        <div class="tier-card gold">
          <div class="tier-icon-box">
            <span class="material-symbols-outlined">stars</span>
          </div>
          <div>
            <span class="tier-name">GOLD TIER</span>
            <span class="tier-desc">Spend &ge; \$1,000 &bull; 7% Rule Discount</span>
          </div>
        </div>

        <div class="tier-card silver">
          <div class="tier-icon-box">
            <span class="material-symbols-outlined">military_tech</span>
          </div>
          <div>
            <span class="tier-name">SILVER TIER</span>
            <span class="tier-desc">Spend &ge; \$500 &bull; 5% Rule Discount</span>
          </div>
        </div>

        <div class="tier-card bronze">
          <div class="tier-icon-box">
            <span class="material-symbols-outlined">shield</span>
          </div>
          <div>
            <span class="tier-name">BRONZE TIER</span>
            <span class="tier-desc">New Shoppers &bull; Welcome 10% Discount</span>
          </div>
        </div>
      </div>

      <!-- Search Bar -->
      <div class="search-bar">
        <span class="material-symbols-outlined search-icon">search</span>
        <input
          type="text"
          placeholder="Lookup customer by phone number (indexed: idx_customer_phone) or full name..."
          [(ngModel)]="searchQuery"
        />
      </div>

      <!-- Customer Directory Table -->
      <div class="table-card">
        <table class="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>CUSTOMER NAME</th>
              <th>PHONE NUMBER</th>
              <th>EMAIL</th>
              <th>LOYALTY POINTS</th>
              <th>TIER (fn_customer_tier)</th>
              <th>JOINED</th>
              <th>ACTION</th>
              <th style="text-align: right;">ORDER HISTORY</th>
            </tr>
          </thead>
          <tbody>
            @for (c of filteredCustomers(); track c.id) {
              <tr>
                <td><span class="code-sku">#{{ c.id }}</span></td>
                <td><strong>{{ c.fullName }}</strong></td>
                <td><span class="phone-text">{{ c.phone }}</span></td>
                <td>{{ c.email || 'N/A' }}</td>
                <td><strong>{{ c.loyaltyPoints }} pts</strong></td>
                <td>
                  <span
                    class="badge-pill"
                    [class.badge-gold]="c.tier === 'GOLD'"
                    [class.badge-silver]="c.tier === 'SILVER'"
                    [class.badge-bronze]="c.tier === 'BRONZE'"
                  >
                    {{ c.tier }}
                  </span>
                </td>
                <td>{{ c.registeredDate }}</td>
                <td>
                  <div class="action-cell customer-actions">
                    <button class="btn-pill btn-secondary btn-sm" (click)="viewCustomer(c)">View</button>
                    <button class="btn-pill btn-outline btn-sm" (click)="editCustomer(c)">Edit</button>
                  </div>
                </td>
                <td style="text-align: right;">
                  <button class="btn-pill btn-secondary btn-sm" (click)="viewHistory(c)">View Orders</button>
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>

      <!-- Register Customer Modal (sp_register_customer) -->
      @if (isRegisterOpen()) {
        <div class="modal-backdrop" (click)="isRegisterOpen.set(false)">
          <div class="modal-dialog" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h3 class="modal-title">Register New Customer</h3>
              <button class="close-btn" (click)="isRegisterOpen.set(false)">&times;</button>
            </div>

            <p class="procedure-note">
              Executes <strong>sp_register_customer</strong> with phone deduplication. Enforces eligibility for the <strong>Welcome 10% First Purchase discount</strong>.
            </p>

            <div class="form-group">
              <label>Full Name *</label>
              <input type="text" [(ngModel)]="newCustName" placeholder="e.g. Kasun Chamara" class="form-control" />
            </div>

            <div class="form-group">
              <label>Phone Number * (Unique Secondary Index)</label>
              <input type="text" [(ngModel)]="newCustPhone" placeholder="e.g. 0779988776" class="form-control" />
            </div>

            <div class="form-group">
              <label>Email Address</label>
              <input type="email" [(ngModel)]="newCustEmail" placeholder="e.g. kasun@example.com" class="form-control" />
            </div>

            <div class="modal-actions">
              <button class="btn-pill btn-outline" (click)="isRegisterOpen.set(false)">Cancel</button>
              <button class="btn-pill btn-primary" (click)="submitRegistration()">Register (sp_register_customer)</button>
            </div>
          </div>
        </div>
      }

      @if (isCustomerViewOpen() && selectedCustomer) {
        <div class="modal-backdrop" (click)="isCustomerViewOpen.set(false)">
          <div class="modal-dialog" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h3 class="modal-title">Customer Details</h3>
              <button class="close-btn" (click)="isCustomerViewOpen.set(false)">&times;</button>
            </div>
            <div class="customer-detail-grid">
              <div><span>Customer ID</span><strong>#{{ selectedCustomer.id }}</strong></div>
              <div><span>Full Name</span><strong>{{ selectedCustomer.fullName }}</strong></div>
              <div><span>Phone</span><strong>{{ selectedCustomer.phone }}</strong></div>
              <div><span>Email</span><strong>{{ selectedCustomer.email || 'N/A' }}</strong></div>
              <div><span>Loyalty Points</span><strong>{{ selectedCustomer.loyaltyPoints }}</strong></div>
              <div><span>Tier</span><strong>{{ selectedCustomer.tier }}</strong></div>
              <div><span>Registered</span><strong>{{ selectedCustomer.registeredDate }}</strong></div>
            </div>
          </div>
        </div>
      }

      @if (isCustomerEditOpen() && selectedCustomer) {
        <div class="modal-backdrop" (click)="isCustomerEditOpen.set(false)">
          <div class="modal-dialog" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h3 class="modal-title">Edit Customer</h3>
              <button class="close-btn" (click)="isCustomerEditOpen.set(false)">&times;</button>
            </div>
            <p class="procedure-note">Update the customer registration details. Loyalty points, tier, ID and registration date are system-managed.</p>
            <div class="form-group">
              <label>Full Name *</label>
              <input class="form-control" [(ngModel)]="editCustName" />
            </div>
            <div class="form-group">
              <label>Phone Number *</label>
              <input class="form-control" [(ngModel)]="editCustPhone" />
            </div>
            <div class="form-group">
              <label>Email Address</label>
              <input class="form-control" type="email" [(ngModel)]="editCustEmail" />
            </div>
            <div class="modal-actions">
              <button class="btn-pill btn-outline" (click)="isCustomerEditOpen.set(false)">Cancel</button>
              <button class="btn-pill btn-primary" (click)="saveCustomer()">Save Changes</button>
            </div>
          </div>
        </div>
      }

      @if (isOrdersOpen()) {
        <div class="modal-backdrop" (click)="closeOrders()">
          <div class="modal-dialog orders-dialog" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <div>
                <h3 class="modal-title">Order History</h3>
                <p class="modal-subtitle">{{ selectedCustomer?.fullName }} · {{ orders().length }} order(s)</p>
              </div>
              <button class="close-btn" (click)="closeOrders()">&times;</button>
            </div>

            @if (ordersError()) {
              <div class="error-message">{{ ordersError() }}</div>
            } @else if (orders().length === 0) {
              <div class="empty-state">
                <span class="material-symbols-outlined empty-state-icon">receipt_long</span>
                <strong>This customer has no orders yet.</strong>
                <span>View and Edit buttons appear beside each order when order history is available.</span>
              </div>
            } @else {
              <div class="orders-table-wrap">
                <table class="data-table orders-table">
                  <thead>
                    <tr>
                      <th>ORDER</th>
                      <th>DATE</th>
                      <th>ITEMS</th>
                      <th>STATUS</th>
                      <th>TOTAL</th>
                      <th>ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (order of orders(); track order.orderId) {
                      <tr>
                        <td><span class="code-sku">#{{ order.orderId }}</span></td>
                        <td>{{ order.orderDate | date:'medium' }}</td>
                        <td>{{ order.itemCount }}</td>
                        <td><span class="status-badge" [class.cancelled]="order.status === 'CANCELLED'">{{ order.status }}</span></td>
                        <td><strong>{{ order.totalAmount | number:'1.2-2' }}</strong></td>
                        <td class="action-cell">
                          <button class="btn-pill btn-secondary btn-sm" (click)="viewOrder(order)">View</button>
                          <button class="btn-pill btn-outline btn-sm" (click)="editOrder(order)">Edit</button>
                        </td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            }
          </div>
        </div>
      }

      @if (isOrderViewOpen() && selectedOrder()) {
        <div class="modal-backdrop modal-layer" (click)="isOrderViewOpen.set(false)">
          <div class="modal-dialog order-detail-dialog" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <div>
                <h3 class="modal-title">Order #{{ selectedOrder()?.orderId }}</h3>
                <p class="modal-subtitle">{{ selectedOrder()?.orderDate | date:'medium' }}</p>
              </div>
              <button class="close-btn" (click)="isOrderViewOpen.set(false)">&times;</button>
            </div>

            <div class="order-summary-grid">
              <div><span>Customer</span><strong>{{ selectedOrder()?.customerName }}</strong></div>
              <div><span>Phone</span><strong>{{ selectedOrder()?.customerPhone }}</strong></div>
              <div><span>Branch</span><strong>{{ selectedOrder()?.branchName }}</strong></div>
              <div><span>Cashier</span><strong>{{ selectedOrder()?.employeeName }}</strong></div>
              <div><span>Status</span><strong>{{ selectedOrder()?.status }}</strong></div>
            </div>

            <h4 class="section-title">Purchased Items</h4>
            <table class="data-table detail-table">
              <thead><tr><th>PRODUCT</th><th>SKU</th><th>QTY</th><th>UNIT PRICE</th><th>LINE TOTAL</th></tr></thead>
              <tbody>
                @for (item of selectedOrder()?.items; track item.productId) {
                  <tr>
                    <td>{{ item.productName }}</td><td>{{ item.sku }}</td><td>{{ item.quantity }}</td>
                    <td>{{ item.unitPrice | number:'1.2-2' }}</td><td>{{ item.lineTotal | number:'1.2-2' }}</td>
                  </tr>
                }
              </tbody>
            </table>

            <div class="order-total-box">
              <div><span>Subtotal</span><strong>{{ selectedOrder()?.subtotal | number:'1.2-2' }}</strong></div>
              <div><span>Discounts</span><strong>-{{ selectedOrder()?.discountTotal | number:'1.2-2' }}</strong></div>
              <div class="grand-total"><span>Total</span><strong>{{ selectedOrder()?.totalAmount | number:'1.2-2' }}</strong></div>
            </div>

            @if ((selectedOrder()?.discounts?.length ?? 0) > 0) {
              <h4 class="section-title">Applied Discounts</h4>
              <div class="compact-list">
                @for (discount of selectedOrder()?.discounts; track discount.ruleId) {
                  <div><span>{{ discount.ruleName }}</span><strong>-{{ discount.amount | number:'1.2-2' }}</strong></div>
                }
              </div>
            }
            @if ((selectedOrder()?.payments?.length ?? 0) > 0) {
              <h4 class="section-title">Payments</h4>
              <div class="compact-list">
                @for (payment of selectedOrder()?.payments; track payment.paymentId) {
                  <div><span>{{ payment.method }} · {{ payment.paidAt | date:'short' }}</span><strong>{{ payment.amount | number:'1.2-2' }}</strong></div>
                }
              </div>
            }
          </div>
        </div>
      }

      @if (isOrderEditOpen() && selectedOrder()) {
        <div class="modal-backdrop modal-layer" (click)="isOrderEditOpen.set(false)">
          <div class="modal-dialog" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h3 class="modal-title">Edit Order #{{ selectedOrder()?.orderId }}</h3>
              <button class="close-btn" (click)="isOrderEditOpen.set(false)">&times;</button>
            </div>
            <p class="procedure-note">Only the order status can be changed. Items, prices, payments, and totals are retained as the original transaction record.</p>
            <div class="form-group">
              <label>Order Status *</label>
              <select class="form-control" [(ngModel)]="editOrderStatus">
                <option value="COMPLETED">Completed</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>
            <div class="modal-actions">
              <button class="btn-pill btn-outline" (click)="isOrderEditOpen.set(false)">Cancel</button>
              <button class="btn-pill btn-primary" (click)="saveOrderStatus()">Save Changes</button>
            </div>
          </div>
        </div>
      }
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

    .tier-summary-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 16px;
    }

    .tier-card {
      background: #ffffff;
      border-radius: var(--radius-md);
      padding: 14px 18px;
      border: 1px solid var(--border-subtle);
      box-shadow: var(--shadow-sm);
      display: flex;
      align-items: center;
      gap: 14px;
    }

    .tier-card.gold { border-left: 4px solid #d97706; }
    .tier-card.silver { border-left: 4px solid #64748b; }
    .tier-card.bronze { border-left: 4px solid #b45309; }

    .tier-icon-box {
      width: 40px;
      height: 40px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #f8fafc;
    }

    .tier-card.gold .tier-icon-box { background: #fef3c7; color: #b45309; }
    .tier-card.silver .tier-icon-box { background: #f1f5f9; color: #475569; }
    .tier-card.bronze .tier-icon-box { background: #ffedd5; color: #9a3412; }

    .tier-name {
      font-size: 0.88rem;
      font-weight: 800;
      display: block;
      color: var(--text-main);
    }

    .tier-desc {
      font-size: 0.74rem;
      color: var(--text-muted);
    }

    .search-bar {
      height: 46px;
      background: #ffffff;
      border: 1px solid var(--border-light);
      border-radius: var(--radius-pill);
      padding: 0 18px;
      display: flex;
      align-items: center;
      gap: 10px;
      box-shadow: var(--shadow-sm);
    }

    .search-bar input {
      border: none;
      outline: none;
      width: 100%;
      font-family: inherit;
      font-size: 0.9rem;
    }

    .search-icon {
      color: var(--primary-green);
    }

    .table-card {
      background: #ffffff;
      border-radius: var(--radius-lg);
      border: 1px solid var(--border-subtle);
      box-shadow: var(--shadow-card);
      overflow: hidden;
    }

    .data-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.88rem;
    }

    .data-table th {
      background: #f8fafc;
      padding: 12px 16px;
      text-align: left;
      font-size: 0.75rem;
      font-weight: 700;
      color: #64748b;
      border-bottom: 1px solid var(--border-light);
    }

    .data-table td {
      padding: 12px 16px;
      border-bottom: 1px solid #f1f5f9;
      vertical-align: middle;
    }

    .code-sku {
      font-family: monospace;
      font-size: 0.8rem;
      background: #f1f5f9;
      padding: 2px 6px;
      border-radius: 4px;
    }

    .phone-text {
      font-family: monospace;
      font-weight: 700;
      color: var(--primary-green-dark);
    }

    .badge-gold { background: #fef3c7; color: #b45309; }
    .badge-silver { background: #f1f5f9; color: #475569; }
    .badge-bronze { background: #ffedd5; color: #9a3412; }

    .btn-sm {
      padding: 5px 12px;
      font-size: 0.78rem;
    }

    /* Modal */
    .modal-backdrop {
      position: fixed;
      top: 0; left: 0; width: 100vw; height: 100vh;
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
      width: 460px;
      box-shadow: 0 20px 50px rgba(0,0,0,0.2);
      display: flex;
      flex-direction: column;
      gap: 14px;
    }

    .orders-dialog { width: min(900px, 92vw); }
    .order-detail-dialog { width: min(850px, 92vw); max-height: 90vh; overflow-y: auto; }
    .modal-layer { z-index: 1100; }
    .modal-subtitle { margin: 3px 0 0; color: var(--text-muted); font-size: 0.78rem; }
    .orders-table-wrap { overflow-x: auto; }
    .action-cell { display: flex; gap: 6px; justify-content: flex-end; }
    .customer-actions { justify-content: flex-start; }
    .customer-detail-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; background: #f8fafc; padding: 16px; border-radius: 10px; }
    .customer-detail-grid span { display: block; color: var(--text-muted); font-size: 0.72rem; }
    .customer-detail-grid strong { display: block; margin-top: 3px; color: var(--text-main); font-size: 0.88rem; }
    .status-badge { color: #166534; background: #dcfce7; border-radius: 999px; padding: 4px 9px; font-size: 0.7rem; font-weight: 800; }
    .status-badge.cancelled { color: #991b1b; background: #fee2e2; }
    .order-summary-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; background: #f8fafc; padding: 14px; border-radius: 10px; }
    .order-summary-grid span { display: block; color: var(--text-muted); font-size: 0.7rem; }
    .order-summary-grid strong { display: block; margin-top: 3px; font-size: 0.82rem; }
    .section-title { margin: 8px 0 0; font-size: 0.85rem; }
    .detail-table { font-size: 0.78rem; }
    .detail-table th, .detail-table td { padding: 9px 10px; }
    .order-total-box { margin-left: auto; max-width: 280px; padding: 12px 0; }
    .order-total-box div, .compact-list div { display: flex; justify-content: space-between; gap: 20px; padding: 5px 0; font-size: 0.82rem; }
    .order-total-box .grand-total { border-top: 1px solid var(--border-light); margin-top: 5px; padding-top: 9px; font-size: 1rem; }
    .compact-list { background: #f8fafc; padding: 8px 12px; border-radius: 8px; }
    .empty-state { padding: 30px; text-align: center; display: flex; flex-direction: column; gap: 8px; color: var(--text-muted); }
    .empty-state strong { color: var(--text-main); }
    .empty-state-icon { color: var(--primary-green); font-size: 2rem; }
    .error-message { color: #b91c1c; background: #fef2f2; border-radius: 8px; }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .modal-title {
      font-size: 1.15rem;
      font-weight: 800;
      margin: 0;
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
      gap: 4px;
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
    }

    .modal-actions {
      display: flex;
      justify-content: flex-end;
      gap: 10px;
      margin-top: 8px;
    }
  `]
})
export class CustomerListComponent {
  readonly customerService = inject(CustomerService);

  readonly isRegisterOpen = signal<boolean>(false);
  readonly isCustomerViewOpen = signal<boolean>(false);
  readonly isCustomerEditOpen = signal<boolean>(false);
  readonly isOrdersOpen = signal<boolean>(false);
  readonly isOrderViewOpen = signal<boolean>(false);
  readonly isOrderEditOpen = signal<boolean>(false);
  readonly orders = signal<SalesOrder[]>([]);
  readonly selectedOrder = signal<SalesOrderDetails | null>(null);
  readonly ordersError = signal<string | null>(null);
  selectedCustomer: Customer | null = null;
  editOrderStatus: SalesOrder['status'] = 'COMPLETED';
  searchQuery: string = '';
  newCustName: string = '';
  newCustPhone: string = '';
  newCustEmail: string = '';
  editCustName: string = '';
  editCustPhone: string = '';
  editCustEmail: string = '';

  filteredCustomers(): Customer[] {
    const q = this.searchQuery.toLowerCase().trim();
    if (!q) return this.customerService.customers();
    return this.customerService.customers().filter(c =>
      c.fullName.toLowerCase().includes(q) ||
      c.phone.includes(q)
    );
  }

  submitRegistration(): void {
    if (!this.newCustName || !this.newCustPhone) {
      alert('Please provide name and phone number.');
      return;
    }

    this.customerService.registerCustomer({
      fullName: this.newCustName,
      phone: this.newCustPhone,
      email: this.newCustEmail
    });

    this.isRegisterOpen.set(false);
    this.newCustName = '';
    this.newCustPhone = '';
    this.newCustEmail = '';
    alert('Customer registered successfully via sp_register_customer!');
  }

  viewHistory(c: Customer): void {
    this.selectedCustomer = c;
    this.ordersError.set(null);
    this.orders.set([]);
    this.isOrdersOpen.set(true);
    this.customerService.getOrderHistory(c.id).subscribe({
      next: orders => this.orders.set(orders),
      error: () => this.ordersError.set('Unable to load this customer’s order history.')
    });
  }

  viewCustomer(customer: Customer): void {
    this.selectedCustomer = customer;
    this.isCustomerViewOpen.set(true);
  }

  editCustomer(customer: Customer): void {
    this.selectedCustomer = customer;
    this.editCustName = customer.fullName;
    this.editCustPhone = customer.phone;
    this.editCustEmail = customer.email ?? '';
    this.isCustomerEditOpen.set(true);
  }

  saveCustomer(): void {
    if (!this.selectedCustomer || !this.editCustName.trim() || !this.editCustPhone.trim()) {
      alert('Please provide the customer name and phone number.');
      return;
    }
    this.customerService.updateCustomer(this.selectedCustomer.id, {
      fullName: this.editCustName.trim(),
      phone: this.editCustPhone.trim(),
      email: this.editCustEmail.trim()
    }).subscribe({
      next: updated => {
        this.customerService.customers.update(customers =>
          customers.map(customer => customer.id === updated.id ? updated : customer)
        );
        this.selectedCustomer = updated;
        this.isCustomerEditOpen.set(false);
      },
      error: () => alert('Unable to update customer. Please check whether the phone number is already used.')
    });
  }

  closeOrders(): void {
    this.isOrdersOpen.set(false);
    this.isOrderViewOpen.set(false);
    this.isOrderEditOpen.set(false);
    this.selectedOrder.set(null);
  }

  viewOrder(order: SalesOrder): void {
    if (!this.selectedCustomer) return;
    this.customerService.getOrderDetails(this.selectedCustomer.id, order.orderId).subscribe({
      next: details => {
        this.selectedOrder.set(details);
        this.isOrderViewOpen.set(true);
      },
      error: () => this.ordersError.set('Unable to load the complete order details.')
    });
  }

  editOrder(order: SalesOrder): void {
    this.selectedOrder.set({
      ...order,
      itemCount: order.itemCount ?? 0,
      items: [],
      payments: [],
      discounts: []
    });
    this.editOrderStatus = order.status;
    this.isOrderEditOpen.set(true);
  }

  saveOrderStatus(): void {
    if (!this.selectedCustomer || !this.selectedOrder()) return;
    this.customerService.updateOrderStatus(
      this.selectedCustomer.id,
      this.selectedOrder()!.orderId,
      this.editOrderStatus
    ).subscribe({
      next: updated => {
        this.orders.update(orders => orders.map(order =>
          order.orderId === updated.orderId ? {
            ...order,
            status: updated.status,
            subtotal: updated.subtotal,
            discountTotal: updated.discountTotal,
            totalAmount: updated.totalAmount,
            itemCount: updated.itemCount
          } : order
        ));
        this.isOrderEditOpen.set(false);
        this.customerService.getOrderDetails(
          this.selectedCustomer!.id,
          this.selectedOrder()!.orderId
        ).subscribe({
          next: details => {
            this.selectedOrder.set(details);
            this.isOrderViewOpen.set(true);
          },
          error: () => this.ordersError.set('Order was updated, but its details could not be reloaded.')
        });
      },
      error: () => this.ordersError.set('Unable to update the order status.')
    });
  }
}
