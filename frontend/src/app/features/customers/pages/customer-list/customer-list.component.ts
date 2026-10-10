import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CustomerService } from '../../../../core/services/customer.service';
import { Customer } from '../../../../core/models';

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
          <p class="page-subtitle">Managed by Member 3 | Procedure: sp_register_customer | Function: fn_customer_tier | View: v_customer_orders</p>
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
                <td style="text-align: right;">
                  <button class="btn-pill btn-secondary btn-sm" (click)="viewHistory(c)">
                    View Orders (v_customer_orders)
                  </button>
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
  searchQuery: string = '';
  newCustName: string = '';
  newCustPhone: string = '';
  newCustEmail: string = '';

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
    alert(`v_customer_orders for ${c.fullName}:\nCustomer ID: #${c.id}\nCumulative Spend: \$1,240.50\nCompleted Orders: 8\nLoyalty Tier: ${c.tier}`);
  }
}
