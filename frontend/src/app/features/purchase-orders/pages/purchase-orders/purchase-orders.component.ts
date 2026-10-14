import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InventoryService } from '../../../../core/services/inventory.service';
import { ProductService } from '../../../../core/services/product.service';
import { AuthService } from '../../../../core/services/auth.service';
import { Product, PurchaseOrder } from '../../../../core/models';

@Component({
  selector: 'app-purchase-orders',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-container">
      <!-- Page Header -->
      <div class="page-header">
        <div>
          <h1 class="page-title">Procurement & Purchase Orders</h1>
          <p class="page-subtitle">
            3-Way Reorder Matching | Procedures: <code>sp_create_purchase_order</code>, <code>sp_receive_purchase</code> (GRN)
          </p>
        </div>
        <div class="header-badges">
          <span class="branch-pill">
            <span class="material-symbols-outlined">store</span>
            {{ currentBranchName() }}
          </span>
        </div>
      </div>

      <!-- Tab Navigation -->
      <div class="nav-tabs-bar">
        <button
          class="tab-btn"
          [class.active]="activeTab() === 'REORDER'"
          (click)="activeTab.set('REORDER')"
        >
          <span class="material-symbols-outlined">add_shopping_cart</span>
          Order Products from Suppliers (sp_create_purchase_order)
        </button>
        <button
          class="tab-btn"
          [class.active]="activeTab() === 'RECEIVING'"
          (click)="activeTab.set('RECEIVING')"
        >
          <span class="material-symbols-outlined">verified</span>
          Receiving Confirmation & GRN (sp_receive_purchase)
          @if (pendingReceivingCount() > 0) {
            <span class="count-pill">{{ pendingReceivingCount() }}</span>
          }
        </button>
        <button
          class="tab-btn"
          [class.active]="activeTab() === 'HISTORY'"
          (click)="activeTab.set('HISTORY')"
        >
          <span class="material-symbols-outlined">history</span>
          All Purchase Orders History
        </button>
      </div>

      <!-- Status Notification Message -->
      @if (actionMessage()) {
        <div class="banner-success">
          <span class="material-symbols-outlined">check_circle</span>
          <span>{{ actionMessage() }}</span>
          <button class="close-banner" (click)="actionMessage.set(null)">&times;</button>
        </div>
      }

      <!-- TAB 1: ORDER PRODUCTS FROM SUPPLIERS -->
      @if (activeTab() === 'REORDER') {
        <div class="search-filter-card">
          <div class="search-input-box">
            <span class="material-symbols-outlined">search</span>
            <input
              type="text"
              placeholder="Search product by name, SKU, or category..."
              [(ngModel)]="searchFilter"
            />
          </div>
          <span class="result-count">{{ filteredCatalog().length }} Products available to order</span>
        </div>

        <div class="table-card">
          <table class="data-table">
            <thead>
              <tr>
                <th>PRODUCT</th>
                <th>SKU</th>
                <th>CATEGORY</th>
                <th>UNIT (UoM)</th>
                <th>CURRENT STOCK</th>
                <th>EST. COST</th>
                <th>PRIMARY SUPPLIER</th>
                <th style="text-align: right;">PROCUREMENT ACTION</th>
              </tr>
            </thead>
            <tbody>
              @for (prod of filteredCatalog(); track prod.id) {
                <tr>
                  <td>
                    <div class="product-cell">
                      <img [src]="prod.imageUrl" [alt]="prod.name" class="product-thumb" />
                      <div>
                        <strong>{{ prod.name }}</strong>
                        @if (prod.stockQty <= (prod.minOrderQty || 10)) {
                          <span class="badge-tag danger">LOW STOCK</span>
                        }
                      </div>
                    </div>
                  </td>
                  <td><span class="code-sku">{{ prod.sku }}</span></td>
                  <td><span class="category-pill">{{ prod.categoryName }}</span></td>
                  <td><span class="unit-pill">{{ prod.unitOfMeasure || 'PIECE' }}</span></td>
                  <td>
                    <strong [class.text-danger]="prod.stockQty <= 15">{{ prod.stockQty }} {{ prod.unitOfMeasure || 'PIECE' }}</strong>
                  </td>
                  <td>\${{ prod.costPrice.toFixed(2) }}</td>
                  <td>
                    <span class="supplier-tag">
                      <span class="material-symbols-outlined">local_shipping</span>
                      {{ prod.supplierName || 'Registered Vendor' }}
                    </span>
                  </td>
                  <td style="text-align: right;">
                    <button class="btn-pill btn-primary btn-sm" (click)="openOrderModal(prod)">
                      <span class="material-symbols-outlined">send</span>
                      Order Stock
                    </button>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }

      <!-- TAB 2: RECEIVING CONFIRMATION & GRN (sp_receive_purchase) -->
      @if (activeTab() === 'RECEIVING') {
        <div class="info-card-grn">
          <div class="grn-title-row">
            <span class="material-symbols-outlined grn-icon">local_shipping</span>
            <div>
              <h3>Goods Receipt Note (GRN) Inspection Bay</h3>
              <p>When physical delivery arrives at {{ currentBranchName() }}, verify the shipment count and accept into branch inventory.</p>
            </div>
          </div>
        </div>

        <div class="table-card">
          <table class="data-table">
            <thead>
              <tr>
                <th>PO #</th>
                <th>SUPPLIER</th>
                <th>PRODUCT</th>
                <th>REQUESTED</th>
                <th>CONFIRMED BY SUPPLIER</th>
                <th>SUPPLIER NOTE</th>
                <th>ORDER STATUS</th>
                <th style="text-align: right;">PHYSICAL GRN ACTION</th>
              </tr>
            </thead>
            <tbody>
              @for (po of activeOrders(); track po.poId) {
                <tr>
                  <td><span class="code-sku">#PO-{{ po.poId }}</span></td>
                  <td>
                    <strong>{{ po.supplierName }}</strong>
                    <div class="sub-text">{{ po.orderDate }}</div>
                  </td>
                  <td>
                    <strong>{{ po.productName }}</strong>
                    <div class="code-sku">{{ po.sku }}</div>
                  </td>
                  <td>{{ po.requestedQty }} {{ po.unitOfMeasure }}</td>
                  <td>
                    @if (po.confirmedQty !== undefined && po.confirmedQty !== null) {
                      <span class="confirmed-qty-pill">
                        {{ po.confirmedQty }} {{ po.unitOfMeasure }}
                      </span>
                    } @else {
                      <span class="text-muted">Awaiting supplier...</span>
                    }
                  </td>
                  <td>
                    <span class="note-snippet" [title]="po.supplierNotes || 'No notes'">
                      {{ po.supplierNotes || '—' }}
                    </span>
                  </td>
                  <td>
                    @if (po.status === 'CONFIRMED') {
                      <span class="badge-pill badge-confirmed">DISPATCHED / READY</span>
                    } @else if (po.status === 'REQUESTED') {
                      <span class="badge-pill badge-requested">PENDING SUPPLIER</span>
                    }
                  </td>
                  <td style="text-align: right;">
                    @if (po.status === 'CONFIRMED') {
                      <button class="btn-pill btn-receive btn-sm" (click)="openReceiveModal(po)">
                        <span class="material-symbols-outlined">inventory</span>
                        Inspect & Receive (sp_receive_purchase)
                      </button>
                    } @else {
                      <span class="badge-pill badge-disabled">Awaiting Vendor Dispatch</span>
                    }
                  </td>
                </tr>
              }
              @if (activeOrders().length === 0) {
                <tr>
                  <td colspan="8" style="text-align: center; padding: 36px; color: #64748b;">
                    No pending shipments waiting for delivery at this branch.
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }

      <!-- TAB 3: ALL PURCHASE ORDERS HISTORY -->
      @if (activeTab() === 'HISTORY') {
        <div class="table-card">
          <table class="data-table">
            <thead>
              <tr>
                <th>PO #</th>
                <th>BRANCH</th>
                <th>SUPPLIER</th>
                <th>PRODUCT</th>
                <th>REQ QTY</th>
                <th>CONFIRMED</th>
                <th>RECEIVED QTY</th>
                <th>TOTAL COST</th>
                <th>STATUS</th>
                <th>RECEIVING AUDIT</th>
              </tr>
            </thead>
            <tbody>
              @for (po of inventoryService.purchaseOrders(); track po.poId) {
                <tr>
                  <td><span class="code-sku">#PO-{{ po.poId }}</span></td>
                  <td>{{ po.branchName }}</td>
                  <td><strong>{{ po.supplierName }}</strong></td>
                  <td>{{ po.productName }}</td>
                  <td>{{ po.requestedQty }} {{ po.unitOfMeasure }}</td>
                  <td>{{ po.confirmedQty ? po.confirmedQty + ' ' + po.unitOfMeasure : '—' }}</td>
                  <td>
                    @if (po.receivedQty !== undefined && po.receivedQty !== null) {
                      <strong class="text-success">+{{ po.receivedQty }} {{ po.unitOfMeasure }}</strong>
                    } @else {
                      <span class="text-muted">—</span>
                    }
                  </td>
                  <td><strong>\${{ po.totalCost.toFixed(2) }}</strong></td>
                  <td>
                    @if (po.status === 'RECEIVED') {
                      <span class="badge-pill badge-received">RECEIVED & IN STOCK</span>
                    } @else if (po.status === 'CONFIRMED') {
                      <span class="badge-pill badge-confirmed">DISPATCHED</span>
                    } @else {
                      <span class="badge-pill badge-requested">REQUESTED</span>
                    }
                  </td>
                  <td>
                    <span class="sub-text">{{ po.receivingNotes || po.supplierNotes || 'Normal procurement cycle' }}</span>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }
    </div>

    <!-- POPUP MODAL: SEND PURCHASING REQUEST (sp_create_purchase_order) -->
    @if (showOrderModal() && selectedProduct()) {
      <div class="modal-backdrop" (click)="closeOrderModal()">
        <div class="modal-dialog" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <div>
              <h2 class="modal-title">Create Purchase Order</h2>
              <p class="modal-subtitle">Procedure: <code>sp_create_purchase_order</code></p>
            </div>
            <button class="btn-close" (click)="closeOrderModal()">&times;</button>
          </div>

          <div class="modal-body">
            <!-- Product Preview Card -->
            <div class="selected-product-card">
              <img [src]="selectedProduct()!.imageUrl" class="modal-prod-img" />
              <div class="modal-prod-info">
                <h4>{{ selectedProduct()!.name }}</h4>
                <div class="modal-prod-meta">
                  <span>SKU: <strong>{{ selectedProduct()!.sku }}</strong></span>
                  <span>Unit: <strong>{{ selectedProduct()!.unitOfMeasure || 'PIECE' }}</strong></span>
                  <span>Cost Price: <strong>\${{ selectedProduct()!.costPrice.toFixed(2) }}</strong></span>
                </div>
              </div>
            </div>

            <!-- Form Fields -->
            <div class="form-grid">
              <div class="form-group">
                <label>Destination Branch</label>
                <input type="text" [value]="currentBranchName()" disabled class="input-disabled" />
              </div>

              <div class="form-group">
                <label>Registered Supplier (Searchable Vendor)</label>
                <select [(ngModel)]="selectedSupplierId">
                  @for (sup of inventoryService.suppliers(); track sup.supplierId) {
                    <option [value]="sup.supplierId">{{ sup.name }} ({{ sup.city }})</option>
                  }
                </select>
              </div>

              <div class="form-group">
                <label>Order Quantity (in {{ selectedProduct()!.unitOfMeasure || 'Units' }})</label>
                <div class="qty-input-group">
                  <input
                    type="number"
                    [(ngModel)]="orderQuantity"
                    min="1"
                    step="1"
                    class="input-qty"
                  />
                  <span class="input-addon">{{ selectedProduct()!.unitOfMeasure || 'PIECE' }}</span>
                </div>
              </div>

              <div class="form-group">
                <label>Calculated Estimated Cost</label>
                <div class="cost-preview-box">
                  <span class="cost-val">\${{ (orderQuantity * selectedProduct()!.costPrice).toFixed(2) }}</span>
                  <span class="cost-note">Total payable upon physical goods receipt</span>
                </div>
              </div>
            </div>
          </div>

          <div class="modal-footer">
            <button class="btn-pill btn-secondary" (click)="closeOrderModal()">Cancel</button>
            <button class="btn-pill btn-primary" (click)="confirmCreateOrder()">
              <span class="material-symbols-outlined">send</span>
              Send Purchasing Request
            </button>
          </div>
        </div>
      </div>
    }

    <!-- POPUP MODAL: RECEIVING CONFIRMATION & GRN (sp_receive_purchase) -->
    @if (showReceiveModal() && selectedPO()) {
      <div class="modal-backdrop" (click)="closeReceiveModal()">
        <div class="modal-dialog" (click)="$event.stopPropagation()">
          <div class="modal-header grn-header">
            <div>
              <h2 class="modal-title">Goods Receipt Note (GRN) Verification</h2>
              <p class="modal-subtitle">Procedure: <code>sp_receive_purchase</code> &bull; Restocks Branch Inventory</p>
            </div>
            <button class="btn-close" (click)="closeReceiveModal()">&times;</button>
          </div>

          <div class="modal-body">
            <div class="po-inspect-summary">
              <div class="summary-col">
                <span class="label">PURCHASE ORDER:</span>
                <strong>#PO-{{ selectedPO()!.poId }}</strong>
              </div>
              <div class="summary-col">
                <span class="label">SUPPLIER:</span>
                <strong>{{ selectedPO()!.supplierName }}</strong>
              </div>
              <div class="summary-col">
                <span class="label">PRODUCT:</span>
                <strong>{{ selectedPO()!.productName }}</strong>
              </div>
            </div>

            <!-- Reconciliation Quantities Card -->
            <div class="reconcile-card">
              <div class="rec-item">
                <span class="rec-label">Branch Requested:</span>
                <span class="rec-val">{{ selectedPO()!.requestedQty }} {{ selectedPO()!.unitOfMeasure }}</span>
              </div>
              <div class="rec-arrow">&rarr;</div>
              <div class="rec-item">
                <span class="rec-label">Supplier Confirmed:</span>
                <span class="rec-val highlight">{{ selectedPO()!.confirmedQty || selectedPO()!.requestedQty }} {{ selectedPO()!.unitOfMeasure }}</span>
              </div>
            </div>

            @if (selectedPO()!.supplierNotes) {
              <div class="supplier-note-box">
                <span class="material-symbols-outlined">info</span>
                <span><strong>Supplier Note:</strong> "{{ selectedPO()!.supplierNotes }}"</span>
              </div>
            }

            <div class="form-group" style="margin-top: 16px;">
              <label><strong>Physically Counted & Received Quantity:</strong></label>
              <div class="qty-input-group">
                <input
                  type="number"
                  [(ngModel)]="physicallyReceivedQty"
                  min="0.1"
                  step="0.5"
                  class="input-qty"
                />
                <span class="input-addon">{{ selectedPO()!.unitOfMeasure }}</span>
              </div>
              <small class="text-muted">Enter actual usable units received. Any damaged units should be excluded.</small>
            </div>

            <div class="form-group" style="margin-top: 12px;">
              <label>Receiving Inspection Note</label>
              <input
                type="text"
                [(ngModel)]="receivingInspectionNote"
                placeholder="e.g., Delivered via cold-truck, seal intact, expiry date checked."
                class="input-text"
              />
            </div>
          </div>

          <div class="modal-footer">
            <button class="btn-pill btn-secondary" (click)="closeReceiveModal()">Cancel</button>
            <button class="btn-pill btn-receive" (click)="confirmReceiveOrder()">
              <span class="material-symbols-outlined">inventory</span>
              Confirm & Increment Branch Inventory
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
      gap: 20px;
    }

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }

    .page-title {
      font-size: 1.55rem;
      font-weight: 800;
      color: #0f172a;
      letter-spacing: -0.4px;
      margin: 0;
    }

    .page-subtitle {
      font-size: 0.85rem;
      color: #64748b;
      margin-top: 4px;

      code {
        background: #f1f5f9;
        color: #065f46;
        padding: 2px 6px;
        border-radius: 4px;
        font-weight: 700;
      }
    }

    .branch-pill {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 6px 14px;
      background: #ecfdf5;
      color: #065f46;
      border: 1px solid #a7f3d0;
      border-radius: 20px;
      font-weight: 700;
      font-size: 0.85rem;
    }

    .nav-tabs-bar {
      display: flex;
      gap: 8px;
      border-bottom: 2px solid #e2e8f0;
      padding-bottom: 4px;
    }

    .tab-btn {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 18px;
      border: none;
      background: transparent;
      font-size: 0.88rem;
      font-weight: 700;
      color: #64748b;
      cursor: pointer;
      border-radius: 10px 10px 0 0;
      transition: all 0.2s;

      &:hover {
        color: #065f46;
        background: #f8fafc;
      }

      &.active {
        color: #065f46;
        border-bottom: 3px solid #065f46;
        background: #f0fdf4;
      }
    }

    .count-pill {
      background: #ef4444;
      color: #ffffff;
      font-size: 0.72rem;
      padding: 2px 8px;
      border-radius: 12px;
      font-weight: 800;
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

    .search-filter-card {
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: #ffffff;
      padding: 14px 20px;
      border-radius: 14px;
      border: 1px solid #e2e8f0;
    }

    .search-input-box {
      display: flex;
      align-items: center;
      gap: 8px;
      width: 380px;

      span { color: #94a3b8; }

      input {
        width: 100%;
        border: none;
        outline: none;
        font-size: 0.9rem;
      }
    }

    .result-count {
      font-size: 0.82rem;
      font-weight: 600;
      color: #64748b;
    }

    .info-card-grn {
      background: linear-gradient(135deg, #064e3b 0%, #065f46 100%);
      color: #ffffff;
      padding: 18px 24px;
      border-radius: 16px;
      box-shadow: 0 4px 12px rgba(6, 95, 70, 0.18);

      .grn-title-row {
        display: flex;
        align-items: center;
        gap: 16px;

        .grn-icon {
          font-size: 36px;
          background: rgba(255, 255, 255, 0.15);
          padding: 10px;
          border-radius: 14px;
        }

        h3 { margin: 0; font-size: 1.15rem; font-weight: 800; }
        p { margin: 4px 0 0 0; font-size: 0.85rem; opacity: 0.9; }
      }
    }

    .table-card {
      background: #ffffff;
      border-radius: 16px;
      border: 1px solid #e2e8f0;
      overflow: hidden;
      box-shadow: 0 2px 6px rgba(0,0,0,0.03);
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

      tr:hover td {
        background: #f8fafc;
      }
    }

    .product-cell {
      display: flex;
      align-items: center;
      gap: 12px;

      .product-thumb {
        width: 44px;
        height: 44px;
        border-radius: 8px;
        object-fit: cover;
      }
    }

    .code-sku {
      font-family: monospace;
      font-size: 0.8rem;
      background: #f1f5f9;
      padding: 3px 8px;
      border-radius: 6px;
      font-weight: 700;
      color: #334155;
    }

    .unit-pill {
      background: #f1f5f9;
      border: 1px solid #cbd5e1;
      padding: 2px 8px;
      border-radius: 6px;
      font-size: 0.75rem;
      font-weight: 700;
      color: #475569;
    }

    .category-pill {
      background: #f8fafc;
      padding: 4px 10px;
      border-radius: 20px;
      font-size: 0.78rem;
      color: #64748b;
      font-weight: 600;
    }

    .supplier-tag {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font-weight: 600;
      font-size: 0.85rem;
      color: #065f46;

      span { font-size: 16px; }
    }

    .badge-tag.danger {
      display: inline-block;
      margin-left: 8px;
      background: #fef2f2;
      color: #dc2626;
      border: 1px solid #fecaca;
      font-size: 0.65rem;
      font-weight: 800;
      padding: 2px 6px;
      border-radius: 6px;
    }

    .confirmed-qty-pill {
      background: #dbeafe;
      color: #1e40af;
      padding: 4px 10px;
      border-radius: 8px;
      font-weight: 800;
      font-size: 0.85rem;
    }

    .badge-pill {
      display: inline-block;
      padding: 4px 10px;
      border-radius: 20px;
      font-size: 0.72rem;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.3px;

      &.badge-requested { background: #fef3c7; color: #b45309; }
      &.badge-confirmed { background: #dbeafe; color: #1d4ed8; }
      &.badge-received { background: #dcfce7; color: #15803d; }
      &.badge-disabled { background: #f1f5f9; color: #94a3b8; }
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
        background: #065f46;
        color: #ffffff;
        &:hover { background: #064e3b; }
      }

      &.btn-receive {
        background: #0284c7;
        color: #ffffff;
        &:hover { background: #0369a1; }
      }

      &.btn-secondary {
        background: #f1f5f9;
        color: #475569;
        &:hover { background: #e2e8f0; }
      }

      &.btn-sm {
        padding: 6px 12px;
        font-size: 0.78rem;
      }
    }

    .note-snippet {
      display: inline-block;
      max-width: 220px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      font-size: 0.8rem;
      color: #64748b;
      font-style: italic;
    }

    .sub-text {
      font-size: 0.75rem;
      color: #94a3b8;
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
      max-width: 580px;
      border-radius: 20px;
      overflow: hidden;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
      display: flex;
      flex-direction: column;
    }

    .modal-header {
      padding: 20px 24px;
      background: #f8fafc;
      border-bottom: 1px solid #e2e8f0;
      display: flex;
      justify-content: space-between;
      align-items: flex-start;

      &.grn-header {
        background: #f0fdf4;
        border-bottom-color: #bbf7d0;
      }

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

    .selected-product-card {
      display: flex;
      gap: 14px;
      align-items: center;
      background: #f8fafc;
      padding: 12px;
      border-radius: 12px;
      border: 1px solid #e2e8f0;

      .modal-prod-img { width: 56px; height: 56px; border-radius: 10px; object-fit: cover; }
      h4 { margin: 0 0 4px 0; font-size: 0.95rem; color: #0f172a; }
      .modal-prod-meta { display: flex; gap: 12px; font-size: 0.78rem; color: #64748b; }
    }

    .form-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 14px;
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 6px;

      label { font-size: 0.78rem; font-weight: 700; color: #334155; }
      select, .input-text, .input-disabled {
        padding: 10px 12px;
        border: 1.5px solid #cbd5e1;
        border-radius: 10px;
        font-size: 0.88rem;
        outline: none;
      }
      .input-disabled { background: #f1f5f9; color: #64748b; }
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

    .cost-preview-box {
      background: #f0fdf4;
      border: 1px solid #bbf7d0;
      padding: 10px 14px;
      border-radius: 10px;
      display: flex;
      flex-direction: column;

      .cost-val { font-size: 1.25rem; font-weight: 800; color: #065f46; }
      .cost-note { font-size: 0.7rem; color: #166534; }
    }

    .po-inspect-summary {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 10px;
      background: #f8fafc;
      padding: 12px;
      border-radius: 10px;
      border: 1px solid #e2e8f0;

      .summary-col {
        display: flex;
        flex-direction: column;
        font-size: 0.8rem;
        .label { font-size: 0.68rem; font-weight: 700; color: #94a3b8; }
        strong { color: #1e293b; }
      }
    }

    .reconcile-card {
      display: flex;
      align-items: center;
      justify-content: space-around;
      background: #f0f9ff;
      border: 1px solid #bae6fd;
      padding: 12px;
      border-radius: 12px;
      margin-top: 6px;

      .rec-item {
        display: flex;
        flex-direction: column;
        align-items: center;
        .rec-label { font-size: 0.75rem; color: #0369a1; font-weight: 600; }
        .rec-val { font-size: 1.1rem; font-weight: 800; color: #0284c7; }
        .rec-val.highlight { color: #0369a1; }
      }

      .rec-arrow { font-size: 24px; font-weight: 800; color: #38bdf8; }
    }

    .supplier-note-box {
      display: flex;
      align-items: center;
      gap: 8px;
      background: #fffbeb;
      border: 1px solid #fef3c7;
      color: #92400e;
      padding: 10px 14px;
      border-radius: 10px;
      font-size: 0.82rem;
      span.material-symbols-outlined { font-size: 18px; color: #d97706; }
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
export class PurchaseOrdersComponent {
  readonly inventoryService = inject(InventoryService);
  readonly productService = inject(ProductService);
  readonly authService = inject(AuthService);

  activeTab = signal<'REORDER' | 'RECEIVING' | 'HISTORY'>('REORDER');
  searchFilter = '';
  actionMessage = signal<string | null>(null);

  // Reorder Modal State
  showOrderModal = signal(false);
  selectedProduct = signal<Product | null>(null);
  selectedSupplierId = 1;
  orderQuantity = 10;

  // Receiving Modal State
  showReceiveModal = signal(false);
  selectedPO = signal<PurchaseOrder | null>(null);
  physicallyReceivedQty = 10;
  receivingInspectionNote = 'Inspection passed: Packaging sealed and count verified.';

  currentBranchName = computed(() => {
    const branch = this.inventoryService.branches.find(b => b.id === this.inventoryService.selectedBranchId());
    return branch ? branch.name : 'Colombo Central Flagship';
  });

  filteredCatalog = computed(() => {
    const q = this.searchFilter.toLowerCase().trim();
    return this.productService.products().filter(p =>
      !q || p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q) || p.categoryName.toLowerCase().includes(q)
    );
  });

  activeOrders = computed(() => {
    return this.inventoryService.purchaseOrders().filter(po =>
      po.status === 'CONFIRMED' || po.status === 'REQUESTED'
    );
  });

  pendingReceivingCount = computed(() => {
    return this.inventoryService.purchaseOrders().filter(po => po.status === 'CONFIRMED').length;
  });

  openOrderModal(prod: Product): void {
    this.selectedProduct.set(prod);
    this.selectedSupplierId = prod.supplierId || 1;
    this.orderQuantity = prod.minOrderQty || 10;
    this.showOrderModal.set(true);
  }

  closeOrderModal(): void {
    this.showOrderModal.set(false);
    this.selectedProduct.set(null);
  }

  confirmCreateOrder(): void {
    const prod = this.selectedProduct();
    if (!prod) return;

    const res = this.inventoryService.createPurchaseOrder({
      supplierId: Number(this.selectedSupplierId),
      branchId: this.inventoryService.selectedBranchId(),
      productId: prod.id,
      productName: prod.name,
      sku: prod.sku,
      unitOfMeasure: prod.unitOfMeasure || 'PIECE',
      requestedQty: Number(this.orderQuantity),
      unitCost: prod.costPrice,
      requestedBy: this.authService.currentUser().username
    });

    this.closeOrderModal();
    this.actionMessage.set(res.message);
    this.activeTab.set('RECEIVING');
  }

  openReceiveModal(po: PurchaseOrder): void {
    this.selectedPO.set(po);
    this.physicallyReceivedQty = po.confirmedQty || po.requestedQty;
    this.receivingInspectionNote = 'Inspected and verified: Seal intact, no damaged units.';
    this.showReceiveModal.set(true);
  }

  closeReceiveModal(): void {
    this.showReceiveModal.set(false);
    this.selectedPO.set(null);
  }

  confirmReceiveOrder(): void {
    const po = this.selectedPO();
    if (!po) return;

    const res = this.inventoryService.receivePurchaseOrder(
      po.poId,
      Number(this.physicallyReceivedQty),
      this.receivingInspectionNote,
      this.authService.currentUser().username
    );

    this.closeReceiveModal();
    this.actionMessage.set(res.message);
  }
}
