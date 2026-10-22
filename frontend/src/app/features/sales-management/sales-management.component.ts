import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../core/services/auth.service';

export interface OrderSummaryItem {
  orderId: number;
  branchId: number;
  branchName: string;
  customerId: number | null;
  customerName: string;
  customerPhone: string | null;
  employeeId: number;
  cashierName: string;
  orderDate: string;
  status: string;
  totalItemsCount: number;
  subtotal: number;
  discountTotal: number;
  totalAmount: number;
  paymentId: number | null;
  paymentMethod: string;
  paidAt: string | null;
}

export interface SalesPageResponse {
  items: OrderSummaryItem[];
  totalItems: number;
  page: number;
  size: number;
  totalPages: number;
}

export interface OrderDetail {
  orderId: number;
  branchName: string;
  customerName: string;
  customerPhone: string;
  customerTier: string;
  employeeName: string;
  orderDate: string;
  status: string;
  subtotal: number;
  discountTotal: number;
  taxAmount: number;
  totalAmount: number;
  paymentMethod: string;
  items: Array<{
    product: {
      id: number;
      name: string;
      sku: string;
      unitPrice: number;
    };
    quantity: number;
    lineTotal: number;
  }>;
  discounts: Array<{
    ruleId: number;
    ruleName: string;
    amount: number;
  }>;
}

@Component({
  selector: 'app-sales-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="sales-page-container">
      <!-- Top Pinned / Action Header -->
      <header class="sales-header">
        <div class="header-left">
          <div class="header-icon-box">
            <span class="material-symbols-outlined header-icon">receipt_long</span>
          </div>
          <div>
            <h1 class="page-title">Sales Management & Orders</h1>
          </div>
        </div>

        <div class="header-actions">
          <!-- Relocated Order Lookup from POS -->
          <div class="lookup-search-box">
            <span class="material-symbols-outlined search-icon">search</span>
            <input
              type="number"
              placeholder="Lookup Order ID (e.g. 28)..."
              [(ngModel)]="lookupInputId"
              (keyup.enter)="lookupOrder()"
            />
            <button class="btn-lookup-action" (click)="lookupOrder()" [disabled]="!lookupInputId">
              Lookup
            </button>
          </div>

          <button class="btn-refresh" (click)="loadOrders(currentPage())" [disabled]="loading()">
            <span class="material-symbols-outlined" [class.spinning]="loading()">refresh</span>
            <span>Refresh</span>
          </button>
        </div>
      </header>

      <!-- Feedback / Alert Banner -->
      @if (alertMessage()) {
        <div class="alert-banner" [class.success]="alertType() === 'success'" [class.error]="alertType() === 'error'">
          <span class="material-symbols-outlined alert-icon">
            {{ alertType() === 'success' ? 'check_circle' : 'error' }}
          </span>
          <span class="alert-text">{{ alertMessage() }}</span>
          <button class="close-alert-btn" (click)="alertMessage.set(null)">&times;</button>
        </div>
      }

      <!-- Main Content Card -->
      <div class="table-card">
        <!-- Table Toolbar -->
        <div class="table-toolbar">
          <div class="filter-pills">
            <button
              class="pill-btn"
              [class.active]="selectedStatusFilter() === 'ALL'"
              (click)="setStatusFilter('ALL')"
            >
              All Sales
            </button>
            <button
              class="pill-btn"
              [class.active]="selectedStatusFilter() === 'COMPLETED'"
              (click)="setStatusFilter('COMPLETED')"
            >
              Completed
            </button>
            <button
              class="pill-btn"
              [class.active]="selectedStatusFilter() === 'CANCELLED'"
              (click)="setStatusFilter('CANCELLED')"
            >
              Revoked
            </button>
          </div>
        </div>

        <!-- Orders Table -->
        <div class="table-responsive">
          <table class="sales-table">
            <thead>
              <tr>
                <th>Order #</th>
                <th>Date & Time</th>
                <th>Customer</th>
                <th>Cashier & Branch</th>
                <th>Items</th>
                <th>Payment</th>
                <th>Total Amount</th>
                <th>Status</th>
                <th style="text-align: right;">Actions</th>
              </tr>
            </thead>
            <tbody>
              @if (loading()) {
                <tr>
                  <td colspan="9" class="empty-state">
                    <span class="material-symbols-outlined spinner">sync</span>
                    <p>Querying recent sales from MySQL...</p>
                  </td>
                </tr>
              } @else if (filteredOrders().length === 0) {
                <tr>
                  <td colspan="9" class="empty-state">
                    <span class="material-symbols-outlined">receipt</span>
                    <p>No orders found matching the filter.</p>
                  </td>
                </tr>
              } @else {
                @for (o of filteredOrders(); track o.orderId) {
                  <tr [class.cancelled-row]="o.status === 'CANCELLED'">
                    <!-- Order ID -->
                    <td class="order-id-cell">
                      <span class="id-tag">#{{ o.orderId }}</span>
                    </td>

                    <!-- Date & Time -->
                    <td class="date-cell">
                      <span class="date-main">{{ o.orderDate | date:'mediumDate' }}</span>
                      <span class="date-sub">{{ o.orderDate | date:'shortTime' }}</span>
                    </td>

                    <!-- Customer -->
                    <td class="customer-cell">
                      <div class="cust-info">
                        <span class="cust-name">{{ o.customerName || 'Walk-in Shopper' }}</span>
                        @if (o.customerPhone) {
                          <span class="cust-phone">{{ o.customerPhone }}</span>
                        }
                      </div>
                    </td>

                    <!-- Cashier & Branch -->
                    <td class="cashier-cell">
                      <span class="cashier-name">{{ o.cashierName }}</span>
                      <span class="branch-name">{{ o.branchName }}</span>
                    </td>

                    <!-- Items Count -->
                    <td class="items-cell">
                      <span class="items-count-badge">
                        <span class="material-symbols-outlined badge-icon">shopping_bag</span>
                        {{ o.totalItemsCount }} {{ o.totalItemsCount === 1 ? 'Item' : 'Items' }}
                      </span>
                    </td>

                    <!-- Payment Method -->
                    <td class="payment-cell">
                      <span class="pay-badge" [class.card]="o.paymentMethod === 'CARD'" [class.cash]="o.paymentMethod === 'CASH'">
                        <span class="material-symbols-outlined pay-icon">
                          {{ o.paymentMethod === 'CARD' ? 'credit_card' : 'payments' }}
                        </span>
                        {{ o.paymentMethod }}
                      </span>
                    </td>

                    <!-- Total Amount -->
                    <td class="amount-cell">
                      <span class="amount-val">Rs. {{ o.totalAmount?.toFixed(2) }}</span>
                      @if (o.discountTotal > 0) {
                        <span class="discount-sub">-Rs. {{ o.discountTotal.toFixed(2) }} disc.</span>
                      }
                    </td>

                    <!-- Status -->
                    <td class="status-cell">
                      <span
                        class="status-pill"
                        [class.status-completed]="o.status === 'COMPLETED'"
                        [class.status-cancelled]="o.status === 'CANCELLED'"
                      >
                        <span class="status-dot"></span>
                        {{ o.status }}
                      </span>
                    </td>

                    <!-- Actions -->
                    <td class="actions-cell">
                      <div class="actions-group">
                        <button class="btn-action view" (click)="viewOrderReceipt(o.orderId)" title="View Receipt">
                          <span class="material-symbols-outlined">visibility</span>
                          <span>Receipt</span>
                        </button>

                        @if (o.status === 'COMPLETED') {
                          <button
                            class="btn-action revoke"
                            (click)="promptRevokeOrder(o)"
                            title="Revoke Sale & Restore Inventory"
                          >
                            <span class="material-symbols-outlined">undo</span>
                            <span>Revoke</span>
                          </button>
                        } @else {
                          <span class="revoked-tag" title="Stock already returned via sp_cancel_order">
                            <span class="material-symbols-outlined">restart_alt</span>
                            <span>Restored</span>
                          </span>
                        }
                      </div>
                    </td>
                  </tr>
                }
              }
            </tbody>
          </table>
        </div>

        <!-- 10 by 10 Pagination Controls -->
        <div class="pagination-footer">
          <div class="pagination-info">
            Showing
            <strong>{{ currentRangeStart() }}</strong>
            to
            <strong>{{ currentRangeEnd() }}</strong>
            of
            <strong>{{ totalOrders() }}</strong>
            orders (10 per page)
          </div>

          <div class="pagination-controls">
            <button
              class="page-btn"
              [disabled]="currentPage() === 0 || loading()"
              (click)="loadOrders(currentPage() - 1)"
            >
              <span class="material-symbols-outlined">chevron_left</span>
              <span>Previous</span>
            </button>

            <div class="page-pills">
              @for (p of pageNumbers(); track p) {
                <button
                  class="page-num-pill"
                  [class.active]="p === currentPage()"
                  (click)="loadOrders(p)"
                >
                  {{ p + 1 }}
                </button>
              }
            </div>

            <button
              class="page-btn"
              [disabled]="currentPage() >= totalPages() - 1 || loading()"
              (click)="loadOrders(currentPage() + 1)"
            >
              <span>Next</span>
              <span class="material-symbols-outlined">chevron_right</span>
            </button>
          </div>
        </div>
      </div>

      <!-- ================= MODAL: REVOKE CONFIRMATION ================= -->
      @if (orderToRevoke(); as order) {
        <div class="modal-backdrop" (click)="orderToRevoke.set(null)">
          <div class="modal-card revoke-dialog" (click)="$event.stopPropagation()">
            <div class="modal-header danger-header">
              <div class="header-danger-icon">
                <span class="material-symbols-outlined">warning</span>
              </div>
              <div>
                <h3>Confirm Order Revocation</h3>
                <p class="modal-subtitle">Invokes MySQL Stored Procedure <code>sp_cancel_order</code></p>
              </div>
              <button class="close-btn" (click)="orderToRevoke.set(null)">&times;</button>
            </div>

            <div class="modal-body">
              <div class="revoke-summary-box">
                <div class="summary-row">
                  <span>Order Reference:</span>
                  <strong>#{{ order.orderId }}</strong>
                </div>
                <div class="summary-row">
                  <span>Customer:</span>
                  <strong>{{ order.customerName }}</strong>
                </div>
                <div class="summary-row">
                  <span>Total Amount to Revoke:</span>
                  <strong class="text-danger">Rs. {{ order.totalAmount?.toFixed(2) }}</strong>
                </div>
                <div class="summary-row">
                  <span>Cashier / Operator:</span>
                  <strong>{{ order.cashierName }}</strong>
                </div>
              </div>

              <div class="procedure-callout">
                <div class="callout-header">
                  <span class="material-symbols-outlined callout-icon">schema</span>
                  <strong>Transactional Database Operation:</strong>
                </div>
                <ul class="callout-list">
                  <li>Changes <code>sales_order.status</code> from <code>COMPLETED</code> to <code>CANCELLED</code>.</li>
                  <li>Atomically returns all purchased line-item quantities back to branch inventory.</li>
                  <li>Writes immutable records to security & audit log tables within an ACID transaction.</li>
                </ul>
              </div>
            </div>

            <div class="modal-footer">
              <button class="btn-modal-cancel" (click)="orderToRevoke.set(null)" [disabled]="actionInProgress()">
                Cancel
              </button>
              <button class="btn-modal-confirm-danger" (click)="confirmRevokeOrder()" [disabled]="actionInProgress()">
                @if (actionInProgress()) {
                  <span class="material-symbols-outlined spinning">sync</span>
                  <span>Executing Procedure...</span>
                } @else {
                  <span class="material-symbols-outlined">undo</span>
                  <span>Confirm Revocation (sp_cancel_order)</span>
                }
              </button>
            </div>
          </div>
        </div>
      }

      <!-- ================= MODAL: DETAILED RECEIPT INSPECTION ================= -->
      @if (inspectedOrder(); as detail) {
        <div class="modal-backdrop" (click)="inspectedOrder.set(null)">
          <div class="modal-card receipt-dialog" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <div class="header-receipt-icon">
                <span class="material-symbols-outlined">receipt</span>
              </div>
              <div>
                <h3>Sales Receipt #{{ detail.orderId }}</h3>
                <p class="modal-subtitle">{{ detail.branchName }} &bull; {{ detail.orderDate | date:'medium' }}</p>
              </div>
              <button class="close-btn" (click)="inspectedOrder.set(null)">&times;</button>
            </div>

            <div class="modal-body">
              <div class="receipt-meta-grid">
                <div>
                  <span class="meta-label">Customer</span>
                  <strong class="meta-val">{{ detail.customerName }}</strong>
                </div>
                <div>
                  <span class="meta-label">Phone</span>
                  <strong class="meta-val">{{ detail.customerPhone || 'N/A' }}</strong>
                </div>
                <div>
                  <span class="meta-label">Cashier</span>
                  <strong class="meta-val">{{ detail.employeeName }}</strong>
                </div>
                <div>
                  <span class="meta-label">Status</span>
                  <span
                    class="status-pill-small"
                    [class.status-completed]="detail.status === 'COMPLETED'"
                    [class.status-cancelled]="detail.status === 'CANCELLED'"
                  >
                    {{ detail.status }}
                  </span>
                </div>
              </div>

              <div class="receipt-divider"></div>

              <!-- Line Items -->
              <table class="receipt-items-table">
                <thead>
                  <tr>
                    <th>Item & SKU</th>
                    <th style="text-align: center;">Qty</th>
                    <th style="text-align: right;">Unit</th>
                    <th style="text-align: right;">Line Total</th>
                  </tr>
                </thead>
                <tbody>
                  @for (item of detail.items; track item.product.id) {
                    <tr>
                      <td>
                        <div class="item-title">{{ item.product.name }}</div>
                        <div class="item-sku">{{ item.product.sku }}</div>
                      </td>
                      <td style="text-align: center;">{{ item.quantity }}</td>
                      <td style="text-align: right;">Rs. {{ item.product.unitPrice?.toFixed(2) }}</td>
                      <td style="text-align: right;" class="font-bold">Rs. {{ item.lineTotal?.toFixed(2) }}</td>
                    </tr>
                  }
                </tbody>
              </table>

              <div class="receipt-divider"></div>

              <!-- Breakdown totals -->
              <div class="receipt-totals-box">
                <div class="total-row">
                  <span>Subtotal:</span>
                  <span>Rs. {{ detail.subtotal?.toFixed(2) }}</span>
                </div>
                @if (detail.discountTotal > 0) {
                  <div class="total-row text-success">
                    <span>Discount Deductions:</span>
                    <span>-Rs. {{ detail.discountTotal?.toFixed(2) }}</span>
                  </div>
                }
                @if (detail.taxAmount > 0) {
                  <div class="total-row">
                    <span>Estimated Tax (5%):</span>
                    <span>Rs. {{ detail.taxAmount?.toFixed(2) }}</span>
                  </div>
                }
                <div class="total-row grand-total">
                  <span>Net Paid Amount:</span>
                  <span>Rs. {{ detail.totalAmount?.toFixed(2) }}</span>
                </div>
              </div>

              @if (detail.discounts && detail.discounts.length > 0) {
                <div class="discounts-applied-box">
                  <span class="discount-box-title">Applied Discount Rules:</span>
                  @for (d of detail.discounts; track d.ruleId) {
                    <div class="rule-chip">
                      <span>{{ d.ruleName }}</span>
                      <strong>-Rs. {{ d.amount?.toFixed(2) }}</strong>
                    </div>
                  }
                </div>
              }
            </div>

            <div class="modal-footer">
              @if (detail.status === 'COMPLETED') {
                <button
                  class="btn-modal-confirm-danger"
                  (click)="promptRevokeFromDetail(detail)"
                >
                  <span class="material-symbols-outlined">undo</span>
                  <span>Revoke Sale</span>
                </button>
              }
              <button class="btn-modal-cancel" (click)="inspectedOrder.set(null)">
                Close Receipt
              </button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    :host {
      display: block;
      height: 100%;
      width: 100%;
      overflow-y: auto;
      background: #f8fafc;
    }

    .sales-page-container {
      padding: 24px 32px 60px;
      max-width: 1400px;
      margin: 0 auto;
      display: flex;
      flex-direction: column;
      gap: 20px;
      box-sizing: border-box;
    }

    /* Header */
    .sales-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 20px;
      flex-wrap: wrap;
    }

    .header-left {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .header-icon-box {
      width: 48px;
      height: 48px;
      border-radius: 12px;
      background: #ecfdf5;
      display: flex;
      align-items: center;
      justify-content: center;
      border: 1px solid #a7f3d0;
      flex-shrink: 0;
    }

    .header-icon {
      font-size: 28px;
      color: #065f46;
    }

    .page-title {
      font-size: 1.55rem;
      font-weight: 800;
      color: #0f172a;
      margin: 0;
      letter-spacing: -0.4px;
    }

    .page-subtitle {
      font-size: 0.88rem;
      color: #64748b;
      margin: 3px 0 0;

      code {
        background: #e2e8f0;
        padding: 2px 6px;
        border-radius: 4px;
        color: #065f46;
        font-weight: 700;
      }
    }

    .header-actions {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    /* Lookup input */
    .lookup-search-box {
      display: flex;
      align-items: center;
      background: #ffffff;
      border: 1px solid #cbd5e1;
      border-radius: 9999px;
      padding: 4px 6px 4px 14px;
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.03);
      transition: all 0.2s ease;

      &:focus-within {
        border-color: #065f46;
        box-shadow: 0 0 0 3px rgba(6, 95, 70, 0.12);
      }

      .search-icon {
        font-size: 20px;
        color: #94a3b8;
        margin-right: 6px;
      }

      input {
        border: none;
        outline: none;
        font-size: 0.88rem;
        width: 190px;
        color: #0f172a;
        font-weight: 500;
        background: transparent;
      }

      .btn-lookup-action {
        background: #065f46;
        color: #ffffff;
        border: none;
        padding: 6px 14px;
        border-radius: 9999px;
        font-size: 0.82rem;
        font-weight: 700;
        cursor: pointer;
        transition: background 0.2s;

        &:hover:not(:disabled) {
          background: #044e39;
        }

        &:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      }
    }

    .btn-refresh {
      display: flex;
      align-items: center;
      gap: 6px;
      background: #ffffff;
      border: 1px solid #cbd5e1;
      border-radius: 9999px;
      padding: 8px 16px;
      font-size: 0.85rem;
      font-weight: 600;
      color: #475569;
      cursor: pointer;
      transition: all 0.2s ease;

      &:hover:not(:disabled) {
        border-color: #065f46;
        color: #065f46;
        background: #ecfdf5;
      }
    }

    /* KPI Cards */
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: 16px;
    }

    .stat-card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 14px;
      padding: 16px 18px;
      display: flex;
      align-items: center;
      gap: 14px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.02);
    }

    .stat-icon-wrapper {
      width: 44px;
      height: 44px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;

      span {
        font-size: 24px;
      }

      &.green {
        background: #ecfdf5;
        color: #065f46;
      }

      &.teal {
        background: #f0fdfa;
        color: #0f766e;
      }

      &.purple {
        background: #faf5ff;
        color: #7e22ce;
      }

      &.orange {
        background: #fff7ed;
        color: #c2410c;
      }
    }

    .stat-data {
      display: flex;
      flex-direction: column;
    }

    .stat-label {
      font-size: 0.76rem;
      font-weight: 700;
      text-transform: uppercase;
      color: #64748b;
      letter-spacing: 0.4px;
    }

    .stat-value {
      font-size: 1.35rem;
      font-weight: 800;
      color: #0f172a;

      &.small-code {
        font-size: 0.95rem;
        font-family: monospace;
        color: #065f46;
      }
    }

    /* Alert Banner */
    .alert-banner {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 12px 18px;
      border-radius: 10px;
      font-size: 0.9rem;
      font-weight: 600;

      &.success {
        background: #ecfdf5;
        color: #065f46;
        border: 1px solid #a7f3d0;
      }

      &.error {
        background: #fef2f2;
        color: #991b1b;
        border: 1px solid #fecaca;
      }

      .alert-text {
        flex: 1;
      }

      .close-alert-btn {
        background: transparent;
        border: none;
        font-size: 20px;
        cursor: pointer;
        color: inherit;
        line-height: 1;
      }
    }

    /* Table Card */
    .table-card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 16px;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.03);
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }

    .table-toolbar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 18px 24px;
      border-bottom: 1px solid #f1f5f9;
      flex-wrap: wrap;
      gap: 12px;
    }

    .toolbar-left {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .table-title {
      font-size: 1.1rem;
      font-weight: 800;
      color: #0f172a;
    }

    .page-badge {
      background: #f1f5f9;
      color: #475569;
      padding: 4px 10px;
      border-radius: 9999px;
      font-size: 0.78rem;
      font-weight: 700;
    }

    .filter-pills {
      display: flex;
      gap: 6px;
      background: #f8fafc;
      padding: 4px;
      border-radius: 9999px;
      border: 1px solid #e2e8f0;
    }

    .pill-btn {
      background: transparent;
      border: none;
      padding: 6px 14px;
      border-radius: 9999px;
      font-size: 0.8rem;
      font-weight: 700;
      color: #64748b;
      cursor: pointer;
      transition: all 0.15s ease;

      &.active {
        background: #065f46;
        color: #ffffff;
        box-shadow: 0 2px 6px rgba(6, 95, 70, 0.25);
      }
    }

    .table-responsive {
      overflow-x: auto;
    }

    .sales-table {
      width: 100%;
      border-collapse: collapse;
      text-align: left;
      font-size: 0.88rem;

      thead th {
        background: #f8fafc;
        padding: 12px 18px;
        color: #475569;
        font-weight: 700;
        font-size: 0.78rem;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        border-bottom: 1px solid #e2e8f0;
      }

      tbody tr {
        border-bottom: 1px solid #f1f5f9;
        transition: background 0.15s ease;

        &:hover {
          background: #f8fafc;
        }

        &.cancelled-row {
          background: #fffafa;
          opacity: 0.88;
        }
      }

      td {
        padding: 14px 18px;
        vertical-align: middle;
      }
    }

    .id-tag {
      font-family: monospace;
      font-weight: 800;
      font-size: 0.92rem;
      color: #065f46;
      background: #ecfdf5;
      padding: 3px 8px;
      border-radius: 6px;
      border: 1px solid #a7f3d0;
    }

    .date-cell {
      display: flex;
      flex-direction: column;
    }

    .date-main {
      font-weight: 600;
      color: #0f172a;
    }

    .date-sub {
      font-size: 0.78rem;
      color: #94a3b8;
    }

    .cust-info {
      display: flex;
      flex-direction: column;
    }

    .cust-name {
      font-weight: 700;
      color: #0f172a;
    }

    .cust-phone {
      font-size: 0.78rem;
      color: #64748b;
    }

    .cashier-name {
      display: block;
      font-weight: 600;
      color: #334155;
    }

    .branch-name {
      display: block;
      font-size: 0.75rem;
      color: #94a3b8;
    }

    .items-count-badge {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      background: #f1f5f9;
      color: #334155;
      padding: 4px 8px;
      border-radius: 6px;
      font-weight: 600;
      font-size: 0.8rem;

      .badge-icon {
        font-size: 16px;
        color: #64748b;
      }
    }

    .pay-badge {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 4px 9px;
      border-radius: 6px;
      font-size: 0.78rem;
      font-weight: 700;

      .pay-icon {
        font-size: 16px;
      }

      &.cash {
        background: #ecfdf5;
        color: #065f46;
        border: 1px solid #a7f3d0;
      }

      &.card {
        background: #eff6ff;
        color: #1d4ed8;
        border: 1px solid #bfdbfe;
      }
    }

    .amount-val {
      font-size: 1rem;
      font-weight: 800;
      color: #0f172a;
      display: block;
    }

    .discount-sub {
      font-size: 0.75rem;
      color: #16a34a;
      font-weight: 600;
      display: block;
    }

    .status-pill {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 4px 10px;
      border-radius: 9999px;
      font-size: 0.78rem;
      font-weight: 700;

      .status-dot {
        width: 7px;
        height: 7px;
        border-radius: 50%;
      }

      &.status-completed {
        background: #dcfce7;
        color: #15803d;
        border: 1px solid #bbf7d0;

        .status-dot {
          background: #16a34a;
        }
      }

      &.status-cancelled {
        background: #fee2e2;
        color: #b91c1c;
        border: 1px solid #fca5a5;

        .status-dot {
          background: #dc2626;
        }
      }
    }

    .actions-group {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 8px;
    }

    .btn-action {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      border: 1px solid transparent;
      padding: 6px 12px;
      border-radius: 8px;
      font-size: 0.8rem;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.15s ease;

      span {
        font-size: 17px;
      }

      &.view {
        background: #f1f5f9;
        color: #334155;
        border-color: #cbd5e1;

        &:hover {
          background: #e2e8f0;
          color: #0f172a;
        }
      }

      &.revoke {
        background: #fee2e2;
        color: #991b1b;
        border-color: #fca5a5;

        &:hover {
          background: #fecaca;
          color: #7f1d1d;
          box-shadow: 0 2px 6px rgba(220, 38, 38, 0.2);
        }
      }
    }

    .revoked-tag {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      font-size: 0.76rem;
      font-weight: 600;
      color: #94a3b8;
      background: #f8fafc;
      padding: 4px 8px;
      border-radius: 6px;
      border: 1px solid #e2e8f0;

      span {
        font-size: 15px;
      }
    }

    /* Pagination */
    .pagination-footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 16px 24px;
      border-top: 1px solid #f1f5f9;
      flex-wrap: wrap;
      gap: 12px;
    }

    .pagination-info {
      font-size: 0.85rem;
      color: #64748b;
    }

    .pagination-controls {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .page-btn {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      background: #ffffff;
      border: 1px solid #cbd5e1;
      padding: 6px 14px;
      border-radius: 8px;
      font-size: 0.82rem;
      font-weight: 700;
      color: #334155;
      cursor: pointer;
      transition: all 0.15s ease;

      &:hover:not(:disabled) {
        border-color: #065f46;
        color: #065f46;
        background: #ecfdf5;
      }

      &:disabled {
        opacity: 0.4;
        cursor: not-allowed;
      }

      span {
        font-size: 18px;
      }
    }

    .page-pills {
      display: flex;
      gap: 4px;
    }

    .page-num-pill {
      background: transparent;
      border: 1px solid transparent;
      width: 32px;
      height: 32px;
      border-radius: 8px;
      font-size: 0.84rem;
      font-weight: 700;
      color: #475569;
      cursor: pointer;
      transition: all 0.15s;

      &:hover {
        background: #f1f5f9;
      }

      &.active {
        background: #065f46;
        color: #ffffff;
      }
    }

    .empty-state {
      text-align: center;
      padding: 48px 20px;
      color: #94a3b8;

      span {
        font-size: 40px;
        margin-bottom: 8px;
        display: block;
      }

      p {
        margin: 0;
        font-size: 0.95rem;
        font-weight: 600;
      }
    }

    /* Modal Backdrop & Dialog */
    .modal-backdrop {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(15, 23, 42, 0.55);
      backdrop-filter: blur(4px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      padding: 16px;
    }

    .modal-card {
      background: #ffffff;
      border-radius: 18px;
      box-shadow: 0 20px 45px rgba(0, 0, 0, 0.22);
      width: 100%;
      max-height: 90vh;
      overflow-y: auto;
      display: flex;
      flex-direction: column;

      &.revoke-dialog {
        max-width: 520px;
      }

      &.receipt-dialog {
        max-width: 600px;
      }
    }

    .modal-header {
      display: flex;
      align-items: center;
      gap: 14px;
      padding: 20px 24px;
      border-bottom: 1px solid #f1f5f9;

      h3 {
        margin: 0;
        font-size: 1.25rem;
        font-weight: 800;
        color: #0f172a;
      }

      .modal-subtitle {
        margin: 2px 0 0;
        font-size: 0.82rem;
        color: #64748b;

        code {
          background: #f1f5f9;
          padding: 2px 4px;
          border-radius: 4px;
          color: #065f46;
          font-weight: 700;
        }
      }

      .close-btn {
        margin-left: auto;
        background: transparent;
        border: none;
        font-size: 26px;
        line-height: 1;
        cursor: pointer;
        color: #94a3b8;

        &:hover {
          color: #0f172a;
        }
      }

      &.danger-header {
        background: #fef2f2;
        border-bottom-color: #fee2e2;

        h3 {
          color: #991b1b;
        }
      }
    }

    .header-danger-icon {
      width: 44px;
      height: 44px;
      border-radius: 12px;
      background: #fee2e2;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #dc2626;
      flex-shrink: 0;

      span {
        font-size: 26px;
      }
    }

    .header-receipt-icon {
      width: 44px;
      height: 44px;
      border-radius: 12px;
      background: #ecfdf5;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #065f46;
      flex-shrink: 0;

      span {
        font-size: 24px;
      }
    }

    .modal-body {
      padding: 20px 24px;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .revoke-summary-box {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 14px 18px;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .summary-row {
      display: flex;
      justify-content: space-between;
      font-size: 0.88rem;
      color: #64748b;

      strong {
        color: #0f172a;
      }

      .text-danger {
        color: #dc2626;
        font-size: 1.05rem;
      }
    }

    .procedure-callout {
      background: #f0fdf4;
      border: 1px solid #bbf7d0;
      border-radius: 12px;
      padding: 14px 18px;
      font-size: 0.84rem;
      color: #14532d;
    }

    .callout-header {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 6px;

      .callout-icon {
        font-size: 20px;
        color: #16a34a;
      }
    }

    .callout-list {
      margin: 0;
      padding-left: 20px;
      line-height: 1.5;
    }

    .modal-footer {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 10px;
      padding: 16px 24px;
      border-top: 1px solid #f1f5f9;
      background: #fafafa;
    }

    .btn-modal-cancel {
      background: #ffffff;
      border: 1px solid #cbd5e1;
      padding: 8px 18px;
      border-radius: 8px;
      font-size: 0.88rem;
      font-weight: 700;
      color: #475569;
      cursor: pointer;

      &:hover {
        background: #f1f5f9;
      }
    }

    .btn-modal-confirm-danger {
      background: #dc2626;
      border: none;
      color: #ffffff;
      padding: 8px 20px;
      border-radius: 8px;
      font-size: 0.88rem;
      font-weight: 700;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      box-shadow: 0 4px 12px rgba(220, 38, 38, 0.28);
      transition: background 0.15s ease;

      &:hover:not(:disabled) {
        background: #b91c1c;
      }

      &:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }
    }

    /* Receipt modal styles */
    .receipt-meta-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 12px;
      background: #f8fafc;
      padding: 12px 16px;
      border-radius: 10px;
    }

    .meta-label {
      font-size: 0.72rem;
      text-transform: uppercase;
      font-weight: 700;
      color: #94a3b8;
      display: block;
    }

    .meta-val {
      font-size: 0.88rem;
      color: #0f172a;
    }

    .status-pill-small {
      display: inline-block;
      padding: 2px 8px;
      border-radius: 9999px;
      font-size: 0.75rem;
      font-weight: 700;

      &.status-completed {
        background: #dcfce7;
        color: #15803d;
      }

      &.status-cancelled {
        background: #fee2e2;
        color: #b91c1c;
      }
    }

    .receipt-divider {
      height: 1px;
      background: #e2e8f0;
      margin: 4px 0;
    }

    .receipt-items-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.84rem;

      th {
        padding: 8px;
        color: #64748b;
        font-weight: 700;
        font-size: 0.74rem;
        text-transform: uppercase;
        border-bottom: 1px solid #e2e8f0;
      }

      td {
        padding: 10px 8px;
        border-bottom: 1px solid #f1f5f9;
      }

      .item-title {
        font-weight: 700;
        color: #0f172a;
      }

      .item-sku {
        font-size: 0.74rem;
        color: #94a3b8;
        font-family: monospace;
      }

      .font-bold {
        font-weight: 700;
      }
    }

    .receipt-totals-box {
      display: flex;
      flex-direction: column;
      gap: 6px;
      background: #f8fafc;
      padding: 12px 16px;
      border-radius: 10px;
    }

    .total-row {
      display: flex;
      justify-content: space-between;
      font-size: 0.86rem;
      color: #475569;

      &.text-success {
        color: #16a34a;
        font-weight: 600;
      }

      &.grand-total {
        font-size: 1.05rem;
        font-weight: 800;
        color: #0f172a;
        padding-top: 6px;
        border-top: 1px solid #e2e8f0;
      }
    }

    .discounts-applied-box {
      margin-top: 4px;
    }

    .discount-box-title {
      font-size: 0.75rem;
      font-weight: 700;
      color: #64748b;
      text-transform: uppercase;
      display: block;
      margin-bottom: 6px;
    }

    .rule-chip {
      display: flex;
      justify-content: space-between;
      background: #ecfdf5;
      color: #065f46;
      padding: 6px 12px;
      border-radius: 8px;
      font-size: 0.82rem;
      margin-bottom: 4px;
      border: 1px solid #a7f3d0;
    }

    .spinning {
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      100% {
        transform: rotate(360deg);
      }
    }
  `]
})
export class SalesManagementComponent implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthService);

  readonly orders = signal<OrderSummaryItem[]>([]);
  readonly totalOrders = signal<number>(0);
  readonly currentPage = signal<number>(0);
  readonly totalPages = signal<number>(0);
  readonly loading = signal<boolean>(false);

  readonly selectedStatusFilter = signal<'ALL' | 'COMPLETED' | 'CANCELLED'>('ALL');
  lookupInputId: number | null = null;

  readonly alertMessage = signal<string | null>(null);
  readonly alertType = signal<'success' | 'error'>('success');

  readonly orderToRevoke = signal<OrderSummaryItem | null>(null);
  readonly actionInProgress = signal<boolean>(false);

  readonly inspectedOrder = signal<OrderDetail | null>(null);

  ngOnInit(): void {
    this.loadOrders(0);
  }

  loadOrders(page: number): void {
    this.loading.set(true);
    this.http.get<SalesPageResponse>(`/api/orders?page=${page}&size=10`).subscribe({
      next: (resp) => {
        this.orders.set(resp.items || []);
        this.totalOrders.set(resp.totalItems || 0);
        this.currentPage.set(resp.page);
        this.totalPages.set(resp.totalPages || 1);
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        this.showAlert(`Failed to fetch orders: ${err.message || 'Server error'}`, 'error');
      }
    });
  }

  filteredOrders(): OrderSummaryItem[] {
    const list = this.orders();
    const filter = this.selectedStatusFilter();
    if (filter === 'ALL') return list;
    return list.filter(o => o.status === filter);
  }

  setStatusFilter(filter: 'ALL' | 'COMPLETED' | 'CANCELLED'): void {
    this.selectedStatusFilter.set(filter);
  }

  currentRangeStart(): number {
    if (this.totalOrders() === 0) return 0;
    return this.currentPage() * 10 + 1;
  }

  currentRangeEnd(): number {
    const end = (this.currentPage() + 1) * 10;
    return Math.min(end, this.totalOrders());
  }

  pageNumbers(): number[] {
    const total = this.totalPages();
    const current = this.currentPage();
    const range: number[] = [];
    const maxPills = 5;
    let start = Math.max(0, current - 2);
    let end = Math.min(total - 1, start + maxPills - 1);
    if (end - start + 1 < maxPills) {
      start = Math.max(0, end - maxPills + 1);
    }
    for (let i = start; i <= end; i++) {
      range.push(i);
    }
    return range;
  }

  lookupOrder(): void {
    if (!this.lookupInputId) return;
    const targetId = this.lookupInputId;
    this.loading.set(true);
    this.http.get<OrderDetail>(`/api/orders/${targetId}`).subscribe({
      next: (order) => {
        this.loading.set(false);
        this.inspectedOrder.set(order);
        this.showAlert(`Order #${targetId} loaded successfully.`, 'success');
      },
      error: () => {
        this.loading.set(false);
        this.showAlert(`Order #${targetId} not found in the database.`, 'error');
      }
    });
  }

  viewOrderReceipt(orderId: number): void {
    this.http.get<OrderDetail>(`/api/orders/${orderId}`).subscribe({
      next: (order) => {
        this.inspectedOrder.set(order);
      },
      error: (err) => {
        this.showAlert(`Unable to load receipt for Order #${orderId}`, 'error');
      }
    });
  }

  promptRevokeOrder(order: OrderSummaryItem): void {
    this.orderToRevoke.set(order);
  }

  promptRevokeFromDetail(detail: OrderDetail): void {
    this.inspectedOrder.set(null);
    const summary: OrderSummaryItem = {
      orderId: detail.orderId,
      branchId: 1,
      branchName: detail.branchName,
      customerId: null,
      customerName: detail.customerName,
      customerPhone: detail.customerPhone,
      employeeId: 101,
      cashierName: detail.employeeName,
      orderDate: detail.orderDate,
      status: detail.status,
      totalItemsCount: detail.items?.reduce((acc, i) => acc + i.quantity, 0) || 0,
      subtotal: detail.subtotal,
      discountTotal: detail.discountTotal,
      totalAmount: detail.totalAmount,
      paymentId: null,
      paymentMethod: detail.paymentMethod,
      paidAt: detail.orderDate
    };
    this.orderToRevoke.set(summary);
  }

  confirmRevokeOrder(): void {
    const order = this.orderToRevoke();
    if (!order) return;

    this.actionInProgress.set(true);
    const employeeId = this.authService.currentUser().employeeId || 101;

    this.http.post<OrderDetail>(`/api/orders/${order.orderId}/cancel`, { employeeId }).subscribe({
      next: () => {
        this.actionInProgress.set(false);
        this.orderToRevoke.set(null);
        this.showAlert(
          `Order #${order.orderId} was successfully revoked via sp_cancel_order! Inventory has been returned.`,
          'success'
        );
        this.loadOrders(this.currentPage());
      },
      error: (err) => {
        this.actionInProgress.set(false);
        const errorMsg = err?.error?.message || err?.message || 'Procedure execution failed';
        this.showAlert(`Failed to revoke Order #${order.orderId}: ${errorMsg}`, 'error');
      }
    });
  }

  private showAlert(msg: string, type: 'success' | 'error'): void {
    this.alertMessage.set(msg);
    this.alertType.set(type);
    setTimeout(() => {
      if (this.alertMessage() === msg) {
        this.alertMessage.set(null);
      }
    }, 6000);
  }
}
