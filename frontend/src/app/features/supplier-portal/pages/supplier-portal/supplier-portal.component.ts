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
      <!-- Page Header (Emerald POS Design System) -->
      <div class="page-header">
        <div>
          <h1 class="page-title">My Orders</h1>
          <p class="page-subtitle">Review incoming branch purchase orders and confirm dispatch</p>
        </div>

        <div class="header-actions">
          <div class="supplier-select-wrapper">
            <label for="supplierSelect" class="supplier-select-label">
              <span class="material-symbols-outlined label-icon">storefront</span>
              <span>Supplier Account:</span>
            </label>
            <div class="select-box">
              <select
                id="supplierSelect"
                class="form-select-supplier"
                [ngModel]="selectedSupplierId()"
                (ngModelChange)="selectedSupplierId.set(+$event)"
              >
                @for (sup of inventoryService.suppliers(); track sup.supplierId) {
                  <option [value]="sup.supplierId">
                    {{ sup.name }} (ID: {{ sup.supplierId }})
                  </option>
                }
                <option [value]="0">All Suppliers (Overview)</option>
              </select>
            </div>
          </div>
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
            <span class="material-symbols-outlined">local_shipping</span>
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
        <div class="table-responsive">
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
                    <strong class="item-name">{{ po.productName }}</strong>
                    <div class="code-sku">{{ po.sku }}</div>
                  </td>
                  <td>
                    <span class="qty-badge">{{ po.requestedQty }} {{ po.unitOfMeasure }}</span>
                  </td>
                  <td>
                    @if (po.confirmedQty !== undefined && po.confirmedQty !== null) {
                      <strong class="text-confirmed">{{ po.confirmedQty }} {{ po.unitOfMeasure }}</strong>
                    } @else {
                      <span class="text-muted">Not confirmed yet</span>
                    }
                  </td>
                  <td><strong class="cost-val">\${{ po.totalCost.toFixed(2) }}</strong></td>
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
                  <td colspan="9" class="empty-state">
                    No purchase orders found matching this filter.
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- MODAL: SUPPLIER ORDER CONFIRMATION & QUANTITY AMENDMENT -->
    @if (showConfirmModal() && selectedPO()) {
      <div class="modal-backdrop" (click)="closeConfirmModal()">
        <div class="modal-dialog" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <div>
              <h2 class="modal-title">Confirm Purchase Order Fulfillment</h2>
              <p class="modal-subtitle">Verify order quantities and submit delivery dispatch notes</p>
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
                <span class="detail-label">Supplier Partner:</span>
                <strong>{{ selectedPO()!.supplierName }} (ID: {{ selectedPO()!.supplierId }})</strong>
              </div>
              <div class="detail-row">
                <span class="detail-label">Destination Branch:</span>
                <strong>{{ selectedPO()!.branchName }}</strong>
              </div>
              <div class="detail-row">
                <span class="detail-label">Product Ordered:</span>
                <strong>{{ selectedPO()!.productName }} ({{ selectedPO()!.sku }})</strong>
              </div>
              <div class="detail-row">
                <span class="detail-label">Unit Price / Cost:</span>
                <strong>Rs. {{ selectedPO()!.unitCost.toFixed(2) }} per {{ selectedPO()!.unitOfMeasure }}</strong>
              </div>
            </div>

            <!-- Quantity Adjustment Field -->
            <div class="form-group" style="margin-top: 6px;">
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
                placeholder="e.g., Dispatched in refrigerated containers"
                class="textarea-note"
              ></textarea>
            </div>

            <!-- Revised Total -->
            <div class="revised-cost-box">
              <span>Updated Order Invoice Amount:</span>
              <strong class="revised-val">
                Rs. {{ (amendedQuantity * selectedPO()!.unitCost).toFixed(2) }}
              </strong>
            </div>
          </div>

          <div class="modal-footer">
            <button class="btn-pill btn-secondary" (click)="closeConfirmModal()">Cancel</button>
            <button class="btn-pill btn-primary" (click)="submitConfirmation()">
              <span class="material-symbols-outlined">check_circle</span>
              Confirm Order
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
      background: var(--bg-app, #f4f6f8);
      min-height: 100vh;
      box-sizing: border-box;
      width: 100%;
    }

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      flex-wrap: wrap;
      gap: 16px;
      padding-bottom: 4px;
    }

    .page-title {
      font-size: 1.65rem;
      font-weight: 800;
      color: #0f172a;
      letter-spacing: -0.025em;
      margin: 0;
    }

    .page-subtitle {
      font-size: 0.86rem;
      color: #64748b;
      margin: 6px 0 0 0;
      font-weight: 500;
    }

    .header-actions {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .supplier-select-wrapper {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .supplier-select-label {
      display: flex;
      align-items: center;
      gap: 5px;
      font-size: 0.74rem;
      font-weight: 700;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.03em;

      .label-icon {
        font-size: 16px;
        color: #065f46;
      }
    }

    .select-box {
      position: relative;
    }

    .form-select-supplier {
      background: #ffffff;
      color: #0f172a;
      border: 1.5px solid #cbd5e1;
      padding: 9px 36px 9px 14px;
      border-radius: var(--radius-md, 14px);
      font-size: 0.86rem;
      font-weight: 700;
      outline: none;
      cursor: pointer;
      box-shadow: 0 1px 3px rgba(0,0,0,0.03);
      appearance: none;
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='%23065f46' viewBox='0 0 24 24'%3E%3Cpath d='M7 10l5 5 5-5z'/%3E%3C/svg%3E");
      background-repeat: no-repeat;
      background-position: right 12px center;
      background-size: 20px;
      transition: all 0.2s ease;

      &:hover {
        border-color: #065f46;
      }

      &:focus {
        border-color: #065f46;
        box-shadow: 0 0 0 3px rgba(6, 95, 70, 0.12);
      }
    }

    /* KPI Metric Cards Grid */
    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 16px;

      @media (max-width: 900px) {
        grid-template-columns: 1fr;
      }
    }

    .metric-card {
      background: #ffffff;
      border: 1px solid #eef0f3;
      padding: 20px 22px;
      border-radius: var(--radius-md, 14px);
      display: flex;
      align-items: center;
      gap: 16px;
      box-shadow: 0 4px 14px rgba(0, 0, 0, 0.03);
      transition: transform 0.2s ease, box-shadow 0.2s ease;

      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 20px rgba(0, 0, 0, 0.06);
      }
    }

    .metric-icon {
      width: 50px;
      height: 50px;
      border-radius: 13px;
      display: flex;
      align-items: center;
      justify-content: center;

      span { font-size: 26px; }

      &.pending-icon { background: #fef3c7; color: #92400e; }
      &.confirmed-icon { background: #eff6ff; color: #1e40af; }
      &.completed-icon { background: #ecfdf5; color: #065f46; }
    }

    .metric-data {
      display: flex;
      flex-direction: column;
      gap: 2px;

      .metric-val {
        font-size: 1.55rem;
        font-weight: 800;
        color: #0f172a;
        line-height: 1.2;
      }
      .metric-label {
        font-size: 0.78rem;
        font-weight: 600;
        color: #64748b;
      }
    }

    .banner-success {
      background: #ecfdf5;
      border: 1px solid #a7f3d0;
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

    /* Orders Section Card */
    .orders-section-card {
      background: #ffffff;
      border-radius: var(--radius-lg, 16px);
      border: 1px solid #eef0f3;
      overflow: hidden;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.03);
    }

    .section-toolbar {
      padding: 20px 24px;
      border-bottom: 1px solid #f1f5f9;
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 16px;
    }

    .toolbar-title {
      h2 { margin: 0; font-size: 1.15rem; font-weight: 800; color: #0f172a; }
      p { margin: 4px 0 0 0; font-size: 0.82rem; color: #64748b; }
    }

    .filter-chips {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }

    .filter-chip {
      background: #f8fafc;
      border: 1px solid #cbd5e1;
      color: #475569;
      padding: 7px 16px;
      border-radius: 20px;
      font-size: 0.8rem;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);

      &:hover:not(.active) {
        background: #f1f5f9;
        color: #0f172a;
      }
      &.active {
        background: #065f46;
        color: #ffffff;
        border-color: #065f46;
        box-shadow: 0 2px 8px rgba(6, 95, 70, 0.25);
      }
    }

    .table-responsive {
      overflow-x: auto;
      width: 100%;
    }

    .data-table {
      width: 100%;
      border-collapse: collapse;
      text-align: left;
      font-size: 0.88rem;

      th {
        background: #f8fafc;
        padding: 13px 18px;
        font-size: 0.74rem;
        font-weight: 800;
        color: #475569;
        letter-spacing: 0.04em;
        text-transform: uppercase;
        border-bottom: 2px solid #e2e8f0;
        white-space: nowrap;
      }

      td {
        padding: 15px 18px;
        font-size: 0.88rem;
        color: #1e293b;
        border-bottom: 1px solid #f1f5f9;
        vertical-align: middle;
      }

      tr:hover td { background: #f8fafc; }
    }

    .item-name {
      color: #0f172a;
      font-size: 0.9rem;
    }

    .code-sku {
      font-family: monospace;
      font-size: 0.76rem;
      background: #f1f5f9;
      padding: 3px 7px;
      border-radius: 5px;
      font-weight: 700;
      color: #475569;
      display: inline-block;
      margin-top: 2px;
    }

    .qty-badge {
      background: #f1f5f9;
      padding: 4px 10px;
      border-radius: 6px;
      font-weight: 700;
      font-size: 0.82rem;
      color: #334155;
    }

    .text-confirmed {
      color: #065f46;
      font-weight: 800;
    }

    .cost-val {
      color: #0f172a;
      font-size: 0.92rem;
      font-weight: 800;
    }

    .text-muted {
      color: #94a3b8;
      font-size: 0.82rem;
    }

    .badge-pill {
      display: inline-block;
      padding: 4px 11px;
      border-radius: 20px;
      font-size: 0.72rem;
      font-weight: 800;
      letter-spacing: 0.04em;

      &.badge-requested { background: #fef3c7; color: #92400e; border: 1px solid #fde68a; }
      &.badge-confirmed { background: #eff6ff; color: #1e40af; border: 1px solid #bfdbfe; }
      &.badge-received { background: #ecfdf5; color: #065f46; border: 1px solid #a7f3d0; }
    }

    .completed-tag {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      color: #065f46;
      font-size: 0.82rem;
      font-weight: 700;

      span { font-size: 18px; }
    }

    .empty-state {
      text-align: center;
      padding: 40px !important;
      color: #94a3b8;
      font-weight: 500;
    }

    /* Buttons */
    .btn-pill {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 8px 18px;
      border-radius: var(--radius-pill, 9999px);
      font-weight: 700;
      font-size: 0.84rem;
      border: none;
      cursor: pointer;
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);

      &.btn-primary {
        background: #065f46;
        color: #ffffff;
        box-shadow: 0 2px 8px rgba(6, 95, 70, 0.25);
        &:hover {
          background: #044e39;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(6, 95, 70, 0.35);
        }
      }

      &.btn-secondary {
        background: #f1f5f9;
        color: #475569;
        border: 1px solid #e2e8f0;
        &:hover { background: #e2e8f0; color: #0f172a; }
      }

      &.btn-sm {
        padding: 6px 14px;
        font-size: 0.8rem;
        .material-symbols-outlined { font-size: 17px; }
      }
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
      max-width: 540px;
      border-radius: var(--radius-lg, 18px);
      overflow: hidden;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
      border: 1px solid #eef0f3;
    }

    .modal-header {
      padding: 20px 24px;
      background: #f8fafc;
      border-bottom: 1px solid #e2e8f0;
      display: flex;
      justify-content: space-between;
      align-items: flex-start;

      .modal-title { font-size: 1.25rem; font-weight: 800; color: #0f172a; margin: 0; letter-spacing: -0.015em; }
      .modal-subtitle { font-size: 0.82rem; color: #64748b; margin: 4px 0 0 0; font-weight: 500; }
      .btn-close { background: none; border: none; font-size: 26px; cursor: pointer; color: #64748b; &:hover { color: #0f172a; } }
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
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 9px;

      .detail-row {
        display: flex;
        justify-content: space-between;
        font-size: 0.86rem;
        .detail-label { color: #64748b; font-weight: 600; }
        strong { color: #0f172a; }
      }
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 6px;

      label { font-size: 0.8rem; font-weight: 700; color: #334155; }
    }

    .qty-input-group {
      display: flex;

      .input-qty {
        flex: 1;
        padding: 10px 14px;
        border: 1.5px solid #cbd5e1;
        border-right: none;
        border-radius: 10px 0 0 10px;
        font-size: 1rem;
        font-weight: 700;
        outline: none;
        transition: border-color 0.2s ease;

        &:focus {
          border-color: #065f46;
        }
      }

      .input-addon {
        background: #f1f5f9;
        border: 1.5px solid #cbd5e1;
        border-left: none;
        border-radius: 0 10px 10px 0;
        padding: 10px 14px;
        font-size: 0.84rem;
        font-weight: 700;
        color: #475569;
        display: flex;
        align-items: center;
      }
    }

    .textarea-note {
      padding: 10px 14px;
      border: 1.5px solid #cbd5e1;
      border-radius: 10px;
      font-size: 0.86rem;
      outline: none;
      font-family: inherit;
      resize: vertical;
      transition: border-color 0.2s ease;

      &:focus {
        border-color: #065f46;
      }
    }

    .revised-cost-box {
      background: #f0fdf4;
      border: 1px solid #bbf7d0;
      padding: 14px 18px;
      border-radius: 12px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 0.88rem;
      font-weight: 600;
      color: #166534;

      .revised-val { font-size: 1.3rem; font-weight: 800; color: #065f46; }
    }

    .modal-footer {
      padding: 16px 24px;
      background: #f8fafc;
      border-top: 1px solid #e2e8f0;
      display: flex;
      justify-content: flex-end;
      gap: 12px;
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
  supplierNote = '45 L dispatched in refrigerated containers';

  // Direct supplier view without login barrier: Defaults to Highland Dairy Farms (#3)
  selectedSupplierId = signal<number>(this.authService.currentUser().supplierId || 3);

  currentSupplierName = computed(() => {
    const id = this.selectedSupplierId();
    if (id === 0) return 'All Suppliers (Consolidated Orders)';
    const sup = this.inventoryService.suppliers().find(s => s.supplierId === id);
    return sup ? sup.name : 'Highland Dairy Farms';
  });

  myOrders = computed(() => {
    const id = this.selectedSupplierId();
    if (id === 0) return this.inventoryService.purchaseOrders();
    return this.inventoryService.purchaseOrders().filter(po =>
      po.supplierId === id
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
    this.amendedQuantity = po.poId === 102 ? 45 : po.requestedQty;
    this.supplierNote = po.poId === 102
      ? '45 L dispatched in refrigerated containers'
      : `${po.requestedQty} ${po.unitOfMeasure} dispatched in standard approved transport.`;
    this.showConfirmModal.set(true);
  }

  closeConfirmModal(): void {
    this.showConfirmModal.set(false);
    this.selectedPO.set(null);
  }

  submitConfirmation(): void {
    const po = this.selectedPO();
    if (!po) return;

    this.inventoryService.supplierConfirmOrder(
      po.poId,
      po.supplierId,
      Number(this.amendedQuantity),
      this.supplierNote
    );

    this.closeConfirmModal();
    this.actionMessage.set(`Order #PO-${po.poId} confirmed successfully: ${this.amendedQuantity} ${po.unitOfMeasure} dispatched to ${po.branchName}.`);
  }
}
