import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InventoryService } from '../../../../core/services/inventory.service';
import { AuthService } from '../../../../core/services/auth.service';
import { PurchaseOrder } from '../../../../core/models';

@Component({
  selector: 'app-supplier-portal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-container">
      <!-- Portal Header -->
      <div class="portal-header">
        <div class="supplier-brand">
          <div class="supplier-avatar">
            <span class="material-symbols-outlined">local_shipping</span>
          </div>
          <div>
            <div class="portal-badge">SUPPLIER & VENDOR B2B NETWORK</div>
            <h1 class="portal-title">{{ currentSupplierName() }}</h1>
            <p class="portal-subtitle">
              Vendor Portal Session: <strong>{{ authService.currentUser().username }}</strong> &bull; Location: Colombo / Regional Hub
            </p>
          </div>
        </div>

        <div class="supplier-actions">
          <span class="vendor-status-pill">
            <span class="status-dot"></span>
            ACTIVE VENDOR ACCOUNT
          </span>
        </div>
      </div>

      <!-- KPI Summary Cards -->
      <div class="metrics-grid">
        <div class="metric-card">
          <div class="metric-icon pending-icon">
            <span class="material-symbols-outlined">pending_actions</span>
          </div>
          <div class="metric-data">
            <span class="metric-val">{{ pendingOrdersCount() }}</span>
            <span class="metric-label">Orders Awaiting Confirmation</span>
          </div>
        </div>

        <div class="metric-card">
          <div class="metric-icon confirmed-icon">
            <span class="material-symbols-outlined">outgoing_mail</span>
          </div>
          <div class="metric-data">
            <span class="metric-val">{{ confirmedOrdersCount() }}</span>
            <span class="metric-label">Dispatched Shipments</span>
          </div>
        </div>

        <div class="metric-card">
          <div class="metric-icon completed-icon">
            <span class="material-symbols-outlined">task_alt</span>
          </div>
          <div class="metric-data">
            <span class="metric-val">{{ receivedOrdersCount() }}</span>
            <span class="metric-label">Delivered & In Supermarket Stock</span>
          </div>
        </div>
      </div>

      <!-- Notification Banner -->
      @if (actionMessage()) {
        <div class="banner-success">
          <span class="material-symbols-outlined">check_circle</span>
          <span>{{ actionMessage() }}</span>
          <button class="close-banner" (click)="actionMessage.set(null)">&times;</button>
        </div>
      }

      <!-- Orders Section -->
      <div class="orders-section-card">
        <div class="section-toolbar">
          <div class="toolbar-title">
            <h2>Incoming Branch Purchase Orders</h2>
            <p>Review orders submitted by supermarket branch managers, adjust fulfillable quantities, and confirm dispatch.</p>
          </div>

          <div class="filter-chips">
            <button
              class="filter-chip"
              [class.active]="statusFilter() === 'ALL'"
              (click)="statusFilter.set('ALL')"
            >
              All ({{ myOrders().length }})
            </button>
            <button
              class="filter-chip"
              [class.active]="statusFilter() === 'REQUESTED'"
              (click)="statusFilter.set('REQUESTED')"
            >
              Action Required ({{ pendingOrdersCount() }})
            </button>
            <button
              class="filter-chip"
              [class.active]="statusFilter() === 'CONFIRMED'"
              (click)="statusFilter.set('CONFIRMED')"
            >
              Dispatched ({{ confirmedOrdersCount() }})
            </button>
            <button
              class="filter-chip"
              [class.active]="statusFilter() === 'RECEIVED'"
              (click)="statusFilter.set('RECEIVED')"
            >
              Completed ({{ receivedOrdersCount() }})
            </button>
          </div>
        </div>

        <!-- Orders Table -->
        <table class="data-table">
          <thead>
            <tr>
              <th>PO #</th>
              <th>ORDER DATE</th>
              <th>DESTINATION BRANCH</th>
              <th>REQUESTED ITEM</th>
              <th>REQUESTED QTY</th>
              <th>CONFIRMED QTY</th>
              <th>EST. VALUE</th>
              <th>STATUS</th>
              <th style="text-align: right;">VENDOR ACTION</th>
            </tr>
          </thead>
          <tbody>
            @for (po of filteredOrders(); track po.poId) {
              <tr>
                <td><span class="code-sku">#PO-{{ po.poId }}</span></td>
                <td>{{ po.orderDate }}</td>
                <td><strong>{{ po.branchName }}</strong></td>
                <td>
                  <strong>{{ po.productName }}</strong>
                  <div class="code-sku">{{ po.sku }}</div>
                </td>
                <td>
                  <span class="qty-badge">{{ po.requestedQty }} {{ po.unitOfMeasure }}</span>
                </td>
                <td>
                  @if (po.confirmedQty !== undefined && po.confirmedQty !== null) {
                    <strong class="text-primary">{{ po.confirmedQty }} {{ po.unitOfMeasure }}</strong>
                  } @else {
                    <span class="text-muted">Not confirmed yet</span>
                  }
                </td>
                <td><strong>\${{ po.totalCost.toFixed(2) }}</strong></td>
                <td>
                  @if (po.status === 'REQUESTED') {
                    <span class="badge-pill badge-requested">ACTION REQUIRED</span>
                  } @else if (po.status === 'CONFIRMED') {
                    <span class="badge-pill badge-confirmed">DISPATCHED</span>
                  } @else if (po.status === 'RECEIVED') {
                    <span class="badge-pill badge-received">COMPLETED</span>
                  }
                </td>
                <td style="text-align: right;">
                  @if (po.status === 'REQUESTED') {
                    <button class="btn-pill btn-primary btn-sm" (click)="openConfirmModal(po)">
                      <span class="material-symbols-outlined">edit_note</span>
                      Review & Confirm
                    </button>
                  } @else {
                    <span class="completed-tag">
                      <span class="material-symbols-outlined">done_all</span>
                      {{ po.status === 'CONFIRMED' ? 'Dispatched' : 'Accepted by Branch' }}
                    </span>
                  }
                </td>
              </tr>
            }
            @if (filteredOrders().length === 0) {
              <tr>
                <td colspan="9" style="text-align: center; padding: 36px; color: #64748b;">
                  No purchase orders found matching this filter.
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    </div>

    <!-- MODAL: SUPPLIER ORDER CONFIRMATION & QUANTITY AMENDMENT (sp_supplier_confirm_order) -->
    @if (showConfirmModal() && selectedPO()) {
      <div class="modal-backdrop" (click)="closeConfirmModal()">
        <div class="modal-dialog" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <div>
              <h2 class="modal-title">Confirm Purchase Order Fulfillment</h2>
              <p class="modal-subtitle">Procedure: <code>sp_supplier_confirm_order</code> &bull; Vendor Portal</p>
            </div>
            <button class="btn-close" (click)="closeConfirmModal()">&times;</button>
          </div>

          <div class="modal-body">
            <!-- Order Details Overview -->
            <div class="po-details-card">
              <div class="detail-row">
                <span class="detail-label">Order Number:</span>
                <strong>#PO-{{ selectedPO()!.poId }}</strong>
              </div>
              <div class="detail-row">
                <span class="detail-label">Destination:</span>
                <strong>{{ selectedPO()!.branchName }}</strong>
              </div>
              <div class="detail-row">
                <span class="detail-label">Product Ordered:</span>
                <strong>{{ selectedPO()!.productName }} ({{ selectedPO()!.sku }})</strong>
              </div>
              <div class="detail-row">
                <span class="detail-label">Unit Price / Cost:</span>
                <strong>\${{ selectedPO()!.unitCost.toFixed(2) }} per {{ selectedPO()!.unitOfMeasure }}</strong>
              </div>
            </div>

            <!-- Quantity Adjustment Field -->
            <div class="form-group" style="margin-top: 10px;">
              <label>
                <strong>Fulfillable Quantity (Adjust if stock is limited):</strong>
              </label>
              <div class="qty-input-group">
                <input
                  type="number"
                  [(ngModel)]="amendedQuantity"
                  min="0.1"
                  step="0.5"
                  class="input-qty"
                />
                <span class="input-addon">{{ selectedPO()!.unitOfMeasure }}</span>
              </div>
              <small class="text-muted">
                Original Branch Request: <strong>{{ selectedPO()!.requestedQty }} {{ selectedPO()!.unitOfMeasure }}</strong>
              </small>
            </div>

            <!-- Supplier Note -->
            <div class="form-group">
              <label><strong>Supplier Dispatch & Delivery Note:</strong></label>
              <textarea
                [(ngModel)]="supplierNote"
                rows="3"
                placeholder="e.g., Packed in insulated containers, batch #ORG-442, driver contacting branch bay upon arrival."
                class="textarea-note"
              ></textarea>
            </div>

            <!-- Revised Total -->
            <div class="revised-cost-box">
              <span>Updated Order Invoice Amount:</span>
              <strong class="revised-val">
                \${{ (amendedQuantity * selectedPO()!.unitCost).toFixed(2) }}
              </strong>
            </div>
          </div>

          <div class="modal-footer">
            <button class="btn-pill btn-secondary" (click)="closeConfirmModal()">Cancel</button>
            <button class="btn-pill btn-primary" (click)="submitConfirmation()">
              <span class="material-symbols-outlined">local_shipping</span>
              Confirm & Dispatch Order
            </button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .page-container {
      padding: 24px 32px;
      display: flex;
      flex-direction: column;
      gap: 22px;
    }

    .portal-header {
      background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
      color: #ffffff;
      padding: 24px 30px;
      border-radius: 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      box-shadow: 0 10px 25px -5px rgba(15, 23, 42, 0.35);
    }

    .supplier-brand {
      display: flex;
      align-items: center;
      gap: 18px;
    }

    .supplier-avatar {
      width: 60px;
      height: 60px;
      background: #0ea5e9;
      border-radius: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 14px rgba(14, 165, 233, 0.4);

      span { font-size: 32px; color: #ffffff; }
    }

    .portal-badge {
      font-size: 0.68rem;
      font-weight: 800;
      color: #38bdf8;
      letter-spacing: 0.8px;
      text-transform: uppercase;
      margin-bottom: 2px;
    }

    .portal-title {
      font-size: 1.45rem;
      font-weight: 800;
      letter-spacing: -0.3px;
      margin: 0;
    }

    .portal-subtitle {
      font-size: 0.82rem;
      color: #94a3b8;
      margin: 4px 0 0 0;

      strong { color: #f1f5f9; }
    }

    .vendor-status-pill {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 6px 14px;
      background: rgba(16, 185, 129, 0.15);
      border: 1px solid #10b981;
      color: #34d399;
      font-size: 0.75rem;
      font-weight: 800;
      border-radius: 20px;
      letter-spacing: 0.4px;
    }

    .status-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #10b981;
      box-shadow: 0 0 8px #10b981;
    }

    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 16px;
    }

    .metric-card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      padding: 18px 22px;
      border-radius: 16px;
      display: flex;
      align-items: center;
      gap: 16px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.02);
    }

    .metric-icon {
      width: 48px;
      height: 48px;
      border-radius: 14px;
      display: flex;
      align-items: center;
      justify-content: center;

      span { font-size: 26px; }

      &.pending-icon { background: #fef3c7; color: #b45309; }
      &.confirmed-icon { background: #e0f2fe; color: #0284c7; }
      &.completed-icon { background: #dcfce7; color: #16a34a; }
    }

    .metric-data {
      display: flex;
      flex-direction: column;

      .metric-val { font-size: 1.45rem; font-weight: 800; color: #0f172a; line-height: 1.2; }
      .metric-label { font-size: 0.78rem; font-weight: 600; color: #64748b; }
    }

    .banner-success {
      background: #ecfdf5;
      border: 1px solid #10b981;
      color: #065f46;
      padding: 12px 18px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      gap: 10px;
      font-weight: 600;
      font-size: 0.88rem;

      .close-banner {
        margin-left: auto;
        background: none;
        border: none;
        font-size: 20px;
        cursor: pointer;
        color: #065f46;
      }
    }

    .orders-section-card {
      background: #ffffff;
      border-radius: 18px;
      border: 1px solid #e2e8f0;
      overflow: hidden;
      box-shadow: 0 2px 6px rgba(0,0,0,0.03);
    }

    .section-toolbar {
      padding: 20px 24px;
      border-bottom: 1px solid #e2e8f0;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .toolbar-title {
      h2 { margin: 0; font-size: 1.15rem; font-weight: 800; color: #0f172a; }
      p { margin: 4px 0 0 0; font-size: 0.82rem; color: #64748b; }
    }

    .filter-chips {
      display: flex;
      gap: 8px;
    }

    .filter-chip {
      background: #f8fafc;
      border: 1px solid #cbd5e1;
      color: #475569;
      padding: 6px 14px;
      border-radius: 20px;
      font-size: 0.78rem;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.2s;

      &:hover { background: #f1f5f9; }
      &.active {
        background: #0f172a;
        color: #ffffff;
        border-color: #0f172a;
      }
    }

    .data-table {
      width: 100%;
      border-collapse: collapse;
      text-align: left;

      th {
        background: #f8fafc;
        padding: 12px 16px;
        font-size: 0.72rem;
        font-weight: 800;
        color: #475569;
        letter-spacing: 0.5px;
        border-bottom: 1px solid #e2e8f0;
      }

      td {
        padding: 14px 16px;
        font-size: 0.88rem;
        color: #1e293b;
        border-bottom: 1px solid #f1f5f9;
        vertical-align: middle;
      }

      tr:hover td { background: #f8fafc; }
    }

    .code-sku {
      font-family: monospace;
      font-size: 0.78rem;
      background: #f1f5f9;
      padding: 2px 6px;
      border-radius: 4px;
      font-weight: 700;
      color: #334155;
    }

    .qty-badge {
      background: #f1f5f9;
      padding: 3px 8px;
      border-radius: 6px;
      font-weight: 700;
      font-size: 0.82rem;
    }

    .badge-pill {
      display: inline-block;
      padding: 4px 10px;
      border-radius: 20px;
      font-size: 0.72rem;
      font-weight: 800;
      letter-spacing: 0.3px;

      &.badge-requested { background: #fef3c7; color: #b45309; }
      &.badge-confirmed { background: #dbeafe; color: #1d4ed8; }
      &.badge-received { background: #dcfce7; color: #15803d; }
    }

    .completed-tag {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      color: #15803d;
      font-size: 0.8rem;
      font-weight: 700;

      span { font-size: 16px; }
    }

    .btn-pill {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 8px 16px;
      border-radius: 20px;
      font-weight: 700;
      font-size: 0.82rem;
      border: none;
      cursor: pointer;
      transition: all 0.2s;

      &.btn-primary {
        background: #0ea5e9;
        color: #ffffff;
        &:hover { background: #0284c7; }
      }

      &.btn-secondary {
        background: #f1f5f9;
        color: #475569;
        &:hover { background: #e2e8f0; }
      }

      &.btn-sm { padding: 6px 12px; font-size: 0.78rem; }
    }

    /* Modal Backdrop & Dialog */
    .modal-backdrop {
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(15, 23, 42, 0.6);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      backdrop-filter: blur(4px);
    }

    .modal-dialog {
      background: #ffffff;
      width: 100%;
      max-width: 560px;
      border-radius: 20px;
      overflow: hidden;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
    }

    .modal-header {
      padding: 20px 24px;
      background: #f8fafc;
      border-bottom: 1px solid #e2e8f0;
      display: flex;
      justify-content: space-between;
      align-items: flex-start;

      .modal-title { font-size: 1.25rem; font-weight: 800; color: #0f172a; margin: 0; }
      .modal-subtitle { font-size: 0.8rem; color: #64748b; margin: 4px 0 0 0; }
      .btn-close { background: none; border: none; font-size: 26px; cursor: pointer; color: #64748b; }
    }

    .modal-body {
      padding: 22px 24px;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .po-details-card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 14px;
      display: flex;
      flex-direction: column;
      gap: 8px;

      .detail-row {
        display: flex;
        justify-content: space-between;
        font-size: 0.85rem;
        .detail-label { color: #64748b; font-weight: 600; }
        strong { color: #0f172a; }
      }
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 6px;

      label { font-size: 0.78rem; font-weight: 700; color: #334155; }
    }

    .qty-input-group {
      display: flex;

      .input-qty {
        flex: 1;
        padding: 10px 12px;
        border: 1.5px solid #cbd5e1;
        border-right: none;
        border-radius: 10px 0 0 10px;
        font-size: 1rem;
        font-weight: 700;
        outline: none;
      }

      .input-addon {
        background: #f1f5f9;
        border: 1.5px solid #cbd5e1;
        border-left: none;
        border-radius: 0 10px 10px 0;
        padding: 10px 14px;
        font-size: 0.82rem;
        font-weight: 700;
        color: #475569;
        display: flex;
        align-items: center;
      }
    }

    .textarea-note {
      padding: 10px 12px;
      border: 1.5px solid #cbd5e1;
      border-radius: 10px;
      font-size: 0.85rem;
      outline: none;
      font-family: inherit;
      resize: vertical;
    }

    .revised-cost-box {
      background: #f0fdf4;
      border: 1px solid #bbf7d0;
      padding: 12px 16px;
      border-radius: 10px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 0.85rem;

      .revised-val { font-size: 1.25rem; font-weight: 800; color: #065f46; }
    }

    .modal-footer {
      padding: 16px 24px;
      background: #f8fafc;
      border-top: 1px solid #e2e8f0;
      display: flex;
      justify-content: flex-end;
      gap: 10px;
    }
  `]
})
export class SupplierPortalComponent {
  readonly inventoryService = inject(InventoryService);
  readonly authService = inject(AuthService);

  statusFilter = signal<'ALL' | 'REQUESTED' | 'CONFIRMED' | 'RECEIVED'>('ALL');
  actionMessage = signal<string | null>(null);

  // Modal State
  showConfirmModal = signal(false);
  selectedPO = signal<PurchaseOrder | null>(null);
  amendedQuantity = 10;
  supplierNote = 'Standard batch fulfillment, dispatched via courier.';

  // Identify logged in supplier (defaults to Lanka Fresh Organics if not set)
  currentSupplierId = computed(() => {
    const user = this.authService.currentUser();
    return user.supplierId || 1;
  });

  currentSupplierName = computed(() => {
    const sup = this.inventoryService.suppliers().find(s => s.supplierId === this.currentSupplierId());
    return sup ? sup.name : 'Registered Supplier Partner';
  });

  myOrders = computed(() => {
    return this.inventoryService.purchaseOrders().filter(po =>
      po.supplierId === this.currentSupplierId()
    );
  });

  filteredOrders = computed(() => {
    const f = this.statusFilter();
    if (f === 'ALL') return this.myOrders();
    return this.myOrders().filter(p => p.status === f);
  });

  pendingOrdersCount = computed(() => {
    return this.myOrders().filter(p => p.status === 'REQUESTED').length;
  });

  confirmedOrdersCount = computed(() => {
    return this.myOrders().filter(p => p.status === 'CONFIRMED').length;
  });

  receivedOrdersCount = computed(() => {
    return this.myOrders().filter(p => p.status === 'RECEIVED').length;
  });

  openConfirmModal(po: PurchaseOrder): void {
    this.selectedPO.set(po);
    this.amendedQuantity = po.requestedQty;
    this.supplierNote = 'Fulfillable in full. Dispatched via temperature-controlled transport.';
    this.showConfirmModal.set(true);
  }

  closeConfirmModal(): void {
    this.showConfirmModal.set(false);
    this.selectedPO.set(null);
  }

  submitConfirmation(): void {
    const po = this.selectedPO();
    if (!po) return;

    const res = this.inventoryService.supplierConfirmOrder(
      po.poId,
      this.currentSupplierId(),
      Number(this.amendedQuantity),
      this.supplierNote
    );

    this.closeConfirmModal();
    this.actionMessage.set(res.message);
  }
}
