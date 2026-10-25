import { Component, inject, signal, OnInit, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CustomerService } from '../../../../core/services/customer.service';
import { AuthService } from '../../../../core/services/auth.service';
import { Customer, SalesOrder, SalesOrderDetails } from '../../../../core/models';

@Component({
  selector: 'app-customer-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-container">
      <!-- Floating Beautiful Action Toast -->
      @if (actionToast(); as toast) {
        <div class="toast-notification-wrapper" [class]="toast.type">
          <div class="toast-card" [class]="toast.type">
            <div class="toast-icon-wrap" [class]="toast.type">
              <span class="material-symbols-outlined">
                {{ toast.type === 'success' ? (toast.isRegistration ? 'celebration' : 'check_circle') : 'error' }}
              </span>
            </div>

            <div class="toast-body">
              <div class="toast-header-line">
                <div class="toast-main-title">{{ toast.title }}</div>
                @if (toast.procedureTag) {
                  <span class="toast-procedure-badge">
                    <span class="material-symbols-outlined inline-icon">terminal</span>
                    {{ toast.procedureTag }}
                  </span>
                }
              </div>

              <div class="toast-message-text">{{ toast.message }}</div>

              @if (toast.promoHighlight) {
                <div class="toast-promo-card">
                  <div class="promo-gift-icon">
                    <span class="material-symbols-outlined">redeem</span>
                  </div>
                  <div class="promo-text-wrap">
                    <div class="promo-title">Welcome 10% First Purchase Discount</div>
                    <div class="promo-note">Enforced in POS checkout &bull; Starter BRONZE Tier loyalty awarded</div>
                  </div>
                </div>
              }
            </div>

            <button type="button" class="toast-close-btn" (click)="dismissToast()" title="Dismiss">&times;</button>

            <!-- Auto-dismiss Progress Bar -->
            <div class="toast-progress-track">
              <div class="toast-progress-bar"></div>
            </div>
          </div>
        </div>
      }

      <!-- Header -->
      <div class="page-header">
        <div>
          <h1 class="page-title">Customer Loyalty & Registration</h1>
        </div>
        <button class="btn-pill btn-primary" (click)="openRegistrationModal()">
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
            <span class="tier-desc">1,000+ Points (Spend &ge; Rs. 100,000) &bull; 7% Rule Discount</span>
          </div>
        </div>

        <div class="tier-card silver">
          <div class="tier-icon-box">
            <span class="material-symbols-outlined">military_tech</span>
          </div>
          <div>
            <span class="tier-name">SILVER TIER</span>
            <span class="tier-desc">500+ Points (Spend &ge; Rs. 50,000) &bull; 5% Rule Discount</span>
          </div>
        </div>

        <div class="tier-card bronze">
          <div class="tier-icon-box">
            <span class="material-symbols-outlined">shield</span>
          </div>
          <div>
            <span class="tier-name">BRONZE TIER</span>
            <span class="tier-desc">0 &ndash; 499 Points &bull; Welcome 10% Discount</span>
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
                <td><span class="phone-text">{{ getDisplayPhone(c.phone, c.maskedPhone) }}</span></td>
                <td>{{ c.email || 'N/A' }}</td>
                <td>
                  <div class="loyalty-pts-cell">
                    <span class="pts-number">{{ c.loyaltyPoints }} pts</span>
                    @if (c.isFirstPurchase) {
                      <span class="badge-welcome-bonus" title="Eligible for Welcome 10% First Purchase discount">
                        <span class="material-symbols-outlined pts-icon">redeem</span> WEL 10
                      </span>
                    }
                  </div>
                </td>
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

            @if (registrationError()) {
              <div class="form-error-banner" style="background: rgba(239, 68, 68, 0.12); border: 1px solid #ef4444; color: #f87171; padding: 10px 14px; border-radius: 8px; margin-bottom: 14px; font-size: 0.85rem; display: flex; align-items: flex-start; gap: 8px;">
                <span class="material-symbols-outlined" style="font-size: 1.2rem; color: #ef4444;">error</span>
                <span>{{ registrationError() }}</span>
              </div>
            }

            <div class="form-group">
              <label>Full Name *</label>
              <input type="text" [(ngModel)]="newCustName" placeholder="e.g. Kasun Chamara" class="form-control" />
            </div>

            <div class="form-group">
              <label>Phone Number * (Numbers Only)</label>
              <input
                type="tel"
                maxlength="10"
                [(ngModel)]="newCustPhone"
                (keypress)="allowNumbersOnly($event)"
                (input)="onPhoneInput()"
                placeholder="e.g. 0779988776"
                class="form-control"
                [style.border-color]="phoneError() ? '#ef4444' : null"
              />
              @if (phoneError()) {
                <small style="color: #f87171; font-size: 0.8rem; margin-top: 4px; display: block; font-weight: 500;">
                  ⚠️ {{ phoneError() }}
                </small>
              } @else {
                <small style="color: #94a3b8; font-size: 0.75rem; margin-top: 4px; display: block;">
                  Only digits (0-9) allowed. Enforces unique phone index & Welcome 10% bonus.
                </small>
              }
            </div>

            <div class="form-group">
              <label>Email Address</label>
              <input type="email" [(ngModel)]="newCustEmail" placeholder="e.g. kasun@example.com" class="form-control" />
            </div>

            <div class="modal-actions">
              <button class="btn-pill btn-outline" (click)="isRegisterOpen.set(false)" [disabled]="isSubmittingCustomer()">Cancel</button>
              <button
                class="btn-pill btn-primary"
                (click)="submitRegistration()"
                [disabled]="isSubmittingCustomer() || phoneError() !== null"
              >
                {{ isSubmittingCustomer() ? 'Registering...' : 'Register ' }}
              </button>
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
              <div><span>Phone</span><strong>{{ getDisplayPhone(selectedCustomer.phone, selectedCustomer.maskedPhone) }}</strong></div>
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
              <label>Phone Number * (Numbers Only)</label>
              <input
                class="form-control"
                type="tel"
                maxlength="10"
                (keypress)="allowNumbersOnly($event)"
                (input)="editCustPhone = editCustPhone.replace(/\D/g, '')"
                [(ngModel)]="editCustPhone"
              />
            </div>
            <div class="form-group">
              <label>Email Address</label>
              <input class="form-control" type="email" [(ngModel)]="editCustEmail" />
            </div>
            <div class="form-group">
              <label>Loyalty Points</label>
              <input class="form-control" type="number" min="0" [(ngModel)]="editCustPoints" />
              <small style="color: var(--text-muted); font-size: 0.75rem; margin-top: 4px; display: block;">
                Rate: Rs. 100 spent = 1 pt. Tiers: Bronze (0–499), Silver (500–999), Gold (1,000+)
              </small>
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
                        <td><strong>Rs. {{ order.totalAmount | number:'1.2-2' }}</strong></td>
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
              <div><span>Subtotal</span><strong>Rs. {{ selectedOrder()?.subtotal | number:'1.2-2' }}</strong></div>
              <div><span>Discounts</span><strong>-Rs. {{ selectedOrder()?.discountTotal | number:'1.2-2' }}</strong></div>
              <div class="grand-total"><span>Total</span><strong>Rs. {{ selectedOrder()?.totalAmount | number:'1.2-2' }}</strong></div>
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

    .loyalty-pts-cell {
      display: inline-flex;
      align-items: center;
      gap: 7px;
      flex-wrap: wrap;
    }

    .pts-number {
      font-weight: 700;
      color: #0f172a;
    }

    .badge-welcome-bonus {
      display: inline-flex;
      align-items: center;
      gap: 3px;
      padding: 2px 7px;
      border-radius: 6px;
      font-size: 0.69rem;
      font-weight: 700;
      background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%);
      color: #065f46;
      border: 1px solid #a7f3d0;
      box-shadow: 0 1px 3px rgba(5, 150, 105, 0.1);
      letter-spacing: 0.02em;
    }

    .pts-icon {
      font-size: 13px;
      color: #059669;
    }

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

    /* ================= Floating Toast Notification ================= */
    .toast-notification-wrapper {
      position: fixed;
      top: 24px;
      right: 28px;
      z-index: 9999;
      max-width: 490px;
      width: calc(100vw - 48px);
      pointer-events: auto;
      animation: toastSlideIn 0.35s cubic-bezier(0.16, 1, 0.3, 1);
    }

    @keyframes toastSlideIn {
      from {
        opacity: 0;
        transform: translateY(-20px) scale(0.96);
      }
      to {
        opacity: 1;
        transform: translateY(0) scale(1);
      }
    }

    .toast-card {
      background: rgba(255, 255, 255, 0.98);
      border-radius: 16px;
      padding: 16px 18px 20px 18px;
      display: flex;
      align-items: flex-start;
      gap: 14px;
      box-shadow: 0 20px 40px -10px rgba(6, 78, 59, 0.22), 0 4px 14px rgba(0, 0, 0, 0.06);
      border: 1px solid rgba(6, 95, 70, 0.18);
      position: relative;
      overflow: hidden;
      backdrop-filter: blur(12px);

      &.success {
        border-color: #a7f3d0;
        border-left: 5px solid #059669;
      }

      &.error {
        border-color: #fecaca;
        border-left: 5px solid #dc2626;
      }
    }

    .toast-icon-wrap {
      width: 42px;
      height: 42px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;

      &.success {
        background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%);
        color: #059669;
        box-shadow: 0 4px 10px rgba(5, 150, 105, 0.18);
        span {
          font-size: 24px;
        }
      }

      &.error {
        background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%);
        color: #dc2626;
        box-shadow: 0 4px 10px rgba(220, 38, 38, 0.18);
        span {
          font-size: 24px;
        }
      }
    }

    .toast-body {
      flex: 1;
      min-width: 0;
    }

    .toast-header-line {
      display: flex;
      align-items: center;
      gap: 10px;
      flex-wrap: wrap;
      margin-bottom: 4px;
    }

    .toast-main-title {
      font-size: 0.95rem;
      font-weight: 700;
      color: #0f172a;
    }

    .toast-procedure-badge {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      background: #f1f5f9;
      color: #334155;
      border: 1px solid #cbd5e1;
      padding: 2px 8px;
      border-radius: 6px;
      font-family: monospace;
      font-size: 0.72rem;
      font-weight: 600;

      .inline-icon {
        font-size: 13px;
        color: #059669;
      }
    }

    .toast-message-text {
      font-size: 0.84rem;
      color: #475569;
      line-height: 1.4;
    }

    .toast-promo-card {
      margin-top: 10px;
      background: linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%);
      border: 1px solid #bbf7d0;
      border-radius: 10px;
      padding: 9px 12px;
      display: flex;
      align-items: center;
      gap: 10px;
      box-shadow: 0 2px 6px rgba(5, 150, 105, 0.08);
    }

    .promo-gift-icon {
      width: 32px;
      height: 32px;
      border-radius: 8px;
      background: #059669;
      color: #ffffff;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      box-shadow: 0 2px 6px rgba(5, 150, 105, 0.25);

      span {
        font-size: 18px;
      }
    }

    .promo-text-wrap {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .promo-title {
      font-size: 0.82rem;
      font-weight: 700;
      color: #065f46;
    }

    .promo-note {
      font-size: 0.72rem;
      color: #047857;
      font-weight: 500;
    }

    .toast-close-btn {
      background: none;
      border: none;
      font-size: 1.35rem;
      line-height: 1;
      color: #94a3b8;
      cursor: pointer;
      padding: 2px 4px;
      border-radius: 6px;
      transition: color 0.15s, background 0.15s;

      &:hover {
        color: #334155;
        background: #f1f5f9;
      }
    }

    .toast-progress-track {
      position: absolute;
      bottom: 0;
      left: 0;
      width: 100%;
      height: 3px;
      background: rgba(0, 0, 0, 0.05);
    }

    .toast-progress-bar {
      height: 100%;
      background: #059669;
      width: 100%;
      animation: toastProgress 6s linear forwards;
    }

    .toast-card.error .toast-progress-bar {
      background: #dc2626;
    }

    @keyframes toastProgress {
      from { width: 100%; }
      to { width: 0%; }
    }
  `]
})
export class CustomerListComponent implements OnInit, OnDestroy {
  readonly customerService = inject(CustomerService);
  readonly authService = inject(AuthService);

  getDisplayPhone(phone?: string, maskedPhone?: string): string {
    if (!phone) return 'N/A';
    if (this.authService.isCashier()) {
      return maskedPhone || this.customerService.maskPhone(phone);
    }
    return phone;
  }

  private autoRefreshTimer: any = null;
  private toastTimeout: any = null;

  readonly actionToast = signal<{
    type: 'success' | 'error';
    title: string;
    message: string;
    procedureTag?: string;
    promoHighlight?: boolean;
    isRegistration?: boolean;
  } | null>(null);

  ngOnInit(): void {
    // Initial live customer directory load
    this.customerService.loadCustomers();

    // Auto-update loyalty points and customer rows every 3 seconds so live POS purchases reflect automatically
    this.autoRefreshTimer = setInterval(() => {
      // Avoid interrupting the user if they are currently typing in modal
      if (!this.isRegisterOpen() && !this.isCustomerEditOpen()) {
        this.customerService.loadCustomers();
      }
    }, 3000);
  }

  @HostListener('window:focus')
  onWindowFocus(): void {
    this.customerService.loadCustomers();
  }

  showToast(config: {
    type: 'success' | 'error';
    title: string;
    message: string;
    procedureTag?: string;
    promoHighlight?: boolean;
    isRegistration?: boolean;
    durationMs?: number;
  }): void {
    if (this.toastTimeout) {
      clearTimeout(this.toastTimeout);
    }
    this.actionToast.set(config);
    this.toastTimeout = setTimeout(() => {
      this.actionToast.set(null);
    }, config.durationMs || 6000);
  }

  dismissToast(): void {
    if (this.toastTimeout) {
      clearTimeout(this.toastTimeout);
    }
    this.actionToast.set(null);
  }

  ngOnDestroy(): void {
    if (this.autoRefreshTimer) {
      clearInterval(this.autoRefreshTimer);
    }
    if (this.toastTimeout) {
      clearTimeout(this.toastTimeout);
    }
  }

  readonly isRegisterOpen = signal<boolean>(false);
  readonly isCustomerViewOpen = signal<boolean>(false);
  readonly isCustomerEditOpen = signal<boolean>(false);
  readonly isOrdersOpen = signal<boolean>(false);
  readonly isOrderViewOpen = signal<boolean>(false);
  readonly isOrderEditOpen = signal<boolean>(false);
  readonly orders = signal<SalesOrder[]>([]);
  readonly selectedOrder = signal<SalesOrderDetails | null>(null);
  readonly ordersError = signal<string | null>(null);
  readonly phoneError = signal<string | null>(null);
  readonly registrationError = signal<string | null>(null);
  readonly isSubmittingCustomer = signal<boolean>(false);
  selectedCustomer: Customer | null = null;
  editOrderStatus: SalesOrder['status'] = 'COMPLETED';
  searchQuery: string = '';
  newCustName: string = '';
  newCustPhone: string = '';
  newCustEmail: string = '';
  editCustName: string = '';
  editCustPhone: string = '';
  editCustEmail: string = '';
  editCustPoints: number = 0;

  filteredCustomers(): Customer[] {
    const q = this.searchQuery.toLowerCase().trim();
    if (!q) return this.customerService.customers();
    return this.customerService.customers().filter(c =>
      c.fullName.toLowerCase().includes(q) ||
      c.phone.includes(q)
    );
  }

  openRegistrationModal(): void {
    this.newCustName = '';
    this.newCustPhone = '';
    this.newCustEmail = '';
    this.phoneError.set(null);
    this.registrationError.set(null);
    this.isRegisterOpen.set(true);
  }

  allowNumbersOnly(event: KeyboardEvent): void {
    const charCode = event.which ? event.which : event.keyCode;
    // Allow only numeric digits 0-9 (ASCII 48 to 57)
    if (charCode < 48 || charCode > 57) {
      event.preventDefault();
    }
  }

  onPhoneInput(): void {
    this.registrationError.set(null);
    // Automatically strip any non-digit character (e.g. if pasted)
    this.newCustPhone = this.newCustPhone.replace(/\D/g, '');
    const val = this.newCustPhone;

    if (!val) {
      this.phoneError.set(null);
      return;
    }
    if (val.length < 10) {
      this.phoneError.set(`Phone number must be 10 digits (currently ${val.length}/10 digits). e.g. 0771234567.`);
      return;
    }
    const duplicate = this.customerService.customers().find(c => {
      const p1 = c.phone.replace(/\D/g, '');
      return p1 === val;
    });
    if (duplicate) {
      this.phoneError.set(`Phone number is already registered to ${duplicate.fullName}. Welcome bonus is only eligible for new customers.`);
      return;
    }
    this.phoneError.set(null);
  }

  submitRegistration(): void {
    this.registrationError.set(null);
    const name = this.newCustName.trim();
    const phone = this.newCustPhone.trim();
    const email = this.newCustEmail.trim();

    if (!name) {
      this.registrationError.set('Please provide customer full name.');
      return;
    }
    if (!phone) {
      this.phoneError.set('Phone number is required.');
      return;
    }

    const digits = phone.replace(/\D/g, '');
    if (digits.length < 9 || digits.length > 12) {
      this.phoneError.set('Please enter a valid phone number (e.g. 0771234567).');
      return;
    }

    const duplicate = this.customerService.customers().find(c => {
      const p1 = c.phone.replace(/\D/g, '');
      return (p1 && p1 === digits) || c.phone.trim() === phone;
    });
    if (duplicate) {
      this.phoneError.set(`Customer already exists with this phone (${duplicate.fullName}). New customer welcome bonus is only valid once per phone number.`);
      return;
    }

    this.isSubmittingCustomer.set(true);

    this.customerService.registerCustomer({
      fullName: name,
      phone: phone,
      email: email || undefined
    }).subscribe({
      next: () => {
        this.isSubmittingCustomer.set(false);
        this.customerService.loadCustomers();
        this.isRegisterOpen.set(false);
        this.newCustName = '';
        this.newCustPhone = '';
        this.newCustEmail = '';
        this.phoneError.set(null);
        this.showToast({
          type: 'success',
          title: 'Customer Registered Successfully!',
          message: 'Saved to database and enrolled in customer loyalty system.',
          procedureTag: 'sp_register_customer',
          promoHighlight: true,
          isRegistration: true
        });
      },
      error: (err) => {
        this.isSubmittingCustomer.set(false);
        const errMsg = err?.error?.message || err?.error?.error || 'Registration failed. The phone number may already be registered in the database.';
        this.registrationError.set(errMsg);
        if (errMsg.toLowerCase().includes('phone') || errMsg.toLowerCase().includes('already exists') || errMsg.toLowerCase().includes('duplicate')) {
          this.phoneError.set('Database duplicate protection: This phone number is already registered. Welcome bonus is only eligible for new customers.');
        }
      }
    });
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
    this.editCustPoints = customer.loyaltyPoints ?? 0;
    this.isCustomerEditOpen.set(true);
  }

  saveCustomer(): void {
    if (!this.selectedCustomer || !this.editCustName.trim() || !this.editCustPhone.trim()) {
      this.showToast({
        type: 'error',
        title: 'Validation Error',
        message: 'Please provide both the customer name and phone number.'
      });
      return;
    }
    this.customerService.updateCustomer(this.selectedCustomer.id, {
      fullName: this.editCustName.trim(),
      phone: this.editCustPhone.trim(),
      email: this.editCustEmail.trim(),
      loyaltyPoints: Math.max(0, Math.floor(Number(this.editCustPoints) || 0))
    }).subscribe({
      next: updated => {
        this.customerService.customers.update(customers =>
          customers.map(customer => customer.id === updated.id ? updated : customer)
        );
        this.selectedCustomer = updated;
        this.isCustomerEditOpen.set(false);
        this.showToast({
          type: 'success',
          title: 'Customer Updated Successfully',
          message: `${updated.fullName}'s profile and loyalty points (${updated.loyaltyPoints} pts • ${updated.tier} Tier) saved.`
        });
      },
      error: () => this.showToast({
        type: 'error',
        title: 'Update Failed',
        message: 'Unable to update customer. Please check whether the phone number is already used.'
      })
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
