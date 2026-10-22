import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CartService } from '../../../core/services/cart.service';

@Component({
  selector: 'app-receipt-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (cartService.isReceiptOpen() && cartService.lastCompletedOrder(); as order) {
      <div class="modal-backdrop" (click)="close()">
        <div class="receipt-paper" (click)="$event.stopPropagation()">
          <!-- Header -->
          <div class="receipt-header">
            <div class="store-badge">
              <span class="material-symbols-outlined store-icon">storefront</span>
            </div>
            <h2 class="store-title">EMERALD SUPERMARKET</h2>
            <p class="store-sub">{{ order.branchName || 'Colombo Central Flagship' }}</p>
            <p class="store-meta">Register #02 &bull; Tax Reg: VAT-981244-ADBMS</p>
          </div>

          <div class="receipt-divider"></div>

          <!-- Transaction Info -->
          <div class="order-details-grid">
            <div>
              <span class="meta-label">RECEIPT #:</span>
              <span class="meta-value">#{{ order.orderId }}</span>
            </div>
            <div>
              <span class="meta-label">DATE:</span>
              <span class="meta-value">{{ order.orderDate }}</span>
            </div>
            <div>
              <span class="meta-label">CASHIER:</span>
              <span class="meta-value">{{ order.employeeName }}</span>
            </div>
            <div>
              <span class="meta-label">CUSTOMER:</span>
              <span class="meta-value">{{ order.customerName }}{{ order.customerTier ? ' (' + order.customerTier + ' Tier)' : '' }}</span>
            </div>
          </div>

          <div class="receipt-divider"></div>

          <!-- Items Table -->
          <table class="items-table">
            <thead>
              <tr>
                <th style="text-align: left;">ITEM / SKU</th>
                <th style="text-align: center;">QTY</th>
                <th style="text-align: right;">UNIT</th>
                <th style="text-align: right;">TOTAL</th>
              </tr>
            </thead>
            <tbody>
              @for (item of order.items; track item.product.id) {
                <tr>
                  <td class="item-name">
                    {{ item.product.name }}<br>
                    <small style="color: #64748b;">{{ item.product.sku }}</small>
                  </td>
                  <td style="text-align: center;">{{ item.quantity }}</td>
                  <td style="text-align: right;">\${{ item.product.unitPrice.toFixed(2) }}</td>
                  <td style="text-align: right; font-weight: 700;">\${{ item.lineTotal.toFixed(2) }}</td>
                </tr>
              }
            </tbody>
          </table>

          <div class="receipt-divider"></div>

          <!-- Totals Calculation -->
          <div class="totals-summary">
            <div class="calc-row">
              <span>Gross Subtotal:</span>
              <span>\${{ order.subtotal.toFixed(2) }}</span>
            </div>

            @for (disc of order.discounts; track disc.ruleId) {
              <div class="calc-row discount-row">
                <span>{{ disc.ruleName }}:</span>
                <span>&minus;\${{ disc.amount.toFixed(2) }}</span>
              </div>
            }

            <div class="calc-row">
              <span>VAT (5%):</span>
              <span>\${{ order.taxAmount.toFixed(2) }}</span>
            </div>

            <div class="calc-row total-row">
              <span>NET PAYABLE:</span>
              <span>\${{ order.totalAmount.toFixed(2) }}</span>
            </div>

            <div class="calc-row payment-row">
              <span>Payment Tendered:</span>
              <span><strong>{{ order.paymentMethod }}</strong> (Authorized)</span>
            </div>
          </div>

          <div class="barcode-box">
            <div class="barcode-stripes"></div>
            <span class="barcode-number">*{{ order.orderId }}*</span>
          </div>

          <p class="receipt-footer-text">
            Thank you for shopping at Emerald Supermarket!<br>
            Database transaction committed via <code>sp_place_order</code> with ACID durability.
          </p>

          <!-- Actions -->
          <div class="receipt-actions">
            <button class="btn-pill btn-outline print-btn" (click)="print()">
              <span class="material-symbols-outlined">print</span> Print
            </button>
            <button class="btn-pill btn-primary done-btn" (click)="close()">
              <span class="material-symbols-outlined">add_shopping_cart</span> New Sale
            </button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .modal-backdrop {
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(15, 23, 42, 0.5);
      backdrop-filter: blur(4px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      padding: 16px;
    }

    .receipt-paper {
      background: #ffffff;
      width: 440px;
      max-height: 90vh;
      overflow-y: auto;
      border-radius: var(--radius-lg);
      padding: 28px 24px;
      box-shadow: 0 25px 60px rgba(0, 0, 0, 0.25);
      font-family: 'Plus Jakarta Sans', sans-serif;
      position: relative;
    }

    .receipt-header {
      text-align: center;
      margin-bottom: 12px;
    }

    .store-badge {
      width: 44px;
      height: 44px;
      margin: 0 auto 8px auto;
      border-radius: 12px;
      background: var(--primary-green);
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .store-icon {
      color: #ffffff;
      font-size: 24px;
    }

    .store-title {
      font-size: 1.2rem;
      font-weight: 800;
      letter-spacing: 0.5px;
      color: var(--primary-green-dark);
      margin-bottom: 2px;
    }

    .store-sub {
      font-size: 0.82rem;
      font-weight: 700;
      color: var(--primary-green);
    }

    .store-meta {
      font-size: 0.72rem;
      color: var(--text-muted);
    }

    .receipt-divider {
      border-top: 1px dashed #cbd5e1;
      margin: 12px 0;
    }

    .order-details-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 6px;
      font-size: 0.8rem;
    }

    .meta-label {
      color: var(--text-muted);
      font-weight: 600;
      margin-right: 4px;
    }

    .meta-value {
      color: var(--text-main);
      font-weight: 700;
    }

    .items-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.8rem;
      margin: 8px 0;
    }

    .items-table th {
      color: var(--text-muted);
      font-weight: 700;
      padding-bottom: 6px;
      border-bottom: 1px solid #f1f5f9;
    }

    .items-table td {
      padding: 6px 0;
      border-bottom: 1px solid #f8fafc;
      vertical-align: top;
    }

    .item-name {
      max-width: 180px;
    }

    .totals-summary {
      display: flex;
      flex-direction: column;
      gap: 5px;
      font-size: 0.85rem;
    }

    .calc-row {
      display: flex;
      justify-content: space-between;
      color: var(--text-secondary);
    }

    .discount-row {
      color: var(--primary-green);
      font-weight: 700;
    }

    .total-row {
      font-size: 1.15rem;
      font-weight: 800;
      color: var(--primary-green-dark);
      margin-top: 6px;
      padding-top: 6px;
      border-top: 1.5px solid #e2e8f0;
    }

    .payment-row {
      font-size: 0.8rem;
      margin-top: 4px;
    }

    .barcode-box {
      margin: 16px auto 8px auto;
      text-align: center;
    }

    .barcode-stripes {
      height: 36px;
      background: repeating-linear-gradient(
        90deg,
        #1e293b 0px,
        #1e293b 2px,
        transparent 2px,
        transparent 5px,
        #1e293b 5px,
        #1e293b 8px,
        transparent 8px,
        transparent 10px
      );
      width: 220px;
      margin: 0 auto;
    }

    .barcode-number {
      font-family: monospace;
      font-size: 0.78rem;
      color: var(--text-muted);
    }

    .receipt-footer-text {
      text-align: center;
      font-size: 0.72rem;
      color: var(--text-muted);
      margin-bottom: 16px;
      line-height: 1.3;
    }

    .receipt-actions {
      display: flex;
      gap: 10px;
    }

    .print-btn {
      flex: 1;
    }

    .done-btn {
      flex: 1.5;
      background: var(--primary-green);
    }
  `]
})
export class ReceiptModalComponent {
  readonly cartService = inject(CartService);

  close(): void {
    this.cartService.closeReceipt();
  }

  print(): void {
    window.print();
  }
}
