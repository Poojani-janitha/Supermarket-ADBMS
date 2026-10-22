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
          Order Products from Suppliers
        </button>
        <button
          class="tab-btn"
          [class.active]="activeTab() === 'RECEIVING'"
          (click)="activeTab.set('RECEIVING')"
        >
          <span class="material-symbols-outlined">verified</span>
          Receiving Confirmation & GRN
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
        <!-- DIRECT PURCHASE ORDER REQUISITION FORM CARD -->
        <div class="po-form-card">
          <div class="po-form-header">
            <div class="header-left">
              <div class="header-icon-box">
                <span class="material-symbols-outlined">add_shopping_cart</span>
              </div>
              <div>
                <h2 class="po-form-title">Purchase Order</h2>
              </div>
            </div>
          </div>

          @if (formError()) {
            <div class="banner-danger">
              <span class="material-symbols-outlined">error</span>
              <span>{{ formError() }}</span>
            </div>
          }

          <div class="po-form-body">
            <div class="po-form-grid">
              <!-- Available Items Dropdown (Full Width) -->
              <div class="form-field full-width">
                <label class="field-label" for="productSelect">
                  <span class="material-symbols-outlined label-icon">inventory_2</span>
                  Select Product / Item to Order <span class="required">*</span>
                </label>
                <div class="select-wrapper">
                  <select
                    id="productSelect"
                    [ngModel]="formProductId()"
                    (ngModelChange)="onFormProductSelect($event)"
                    class="form-select"
                  >
                    <option value="" disabled selected>-- Choose an item from product catalog --</option>
                    @for (item of productService.products(); track item.id) {
                      <option [value]="item.id">
                        [{{ item.sku }}] {{ item.name }} &bull; {{ item.categoryName }} ({{ item.unitOfMeasure || 'PIECE' }}) — Rs. {{ item.costPrice.toFixed(2) }}
                      </option>
                    }
                  </select>
                </div>
              </div>

              <!-- Available Suppliers Dropdown -->
              <div class="form-field">
                <label class="field-label" for="supplierSelect">
                  <span class="material-symbols-outlined label-icon">local_shipping</span>
                  Select Registered Supplier <span class="required">*</span>
                </label>
                <div class="select-wrapper">
                  <select
                    id="supplierSelect"
                    [ngModel]="formSupplierId()"
                    (ngModelChange)="formSupplierId.set($event)"
                    class="form-select"
                  >
                    <option value="" disabled selected>-- Choose a registered vendor --</option>
                    @for (sup of inventoryService.suppliers(); track sup.supplierId) {
                      <option [value]="sup.supplierId">
                        {{ sup.name }} &bull; {{ sup.city }} (Tax: {{ sup.taxNumber }})
                      </option>
                    }
                  </select>
                </div>
              </div>

              <!-- Unit of Measure (UoM) Dropdown -->
              <div class="form-field">
                <label class="field-label" for="unitSelect">
                  <span class="material-symbols-outlined label-icon">straighten</span>
                  Unit of Measure <span class="required">*</span>
                </label>
                <div class="select-wrapper">
                  <select
                    id="unitSelect"
                    [ngModel]="formUnitOfMeasure()"
                    (ngModelChange)="formUnitOfMeasure.set($event)"
                    class="form-select"
                  >
                    @for (unit of productService.units(); track unit.code) {
                      <option [value]="unit.code">{{ unit.displayName }} ({{ unit.code }})</option>
                    }
                  </select>
                </div>
              </div>

              <!-- Quantity Input with UoM -->
              <div class="form-field">
                <label class="field-label" for="quantityInput">
                  <span class="material-symbols-outlined label-icon">format_list_numbered</span>
                  Order Quantity <span class="required">*</span>
                </label>
                <div class="qty-field-group">
                  <input
                    id="quantityInput"
                    type="number"
                    [ngModel]="formQuantity()"
                    (ngModelChange)="formQuantity.set($event)"
                    min="1"
                    step="1"
                    placeholder="e.g. 50"
                    class="form-input qty-input"
                  />
                  <span class="qty-uom-addon">{{ formUnitOfMeasure() }}</span>
                </div>
              </div>

              <!-- Receiving Branch & Stock Info Box -->
              <div class="form-field">
                <label class="field-label">
                  <span class="material-symbols-outlined label-icon">domain</span>
                  Receiving Branch & Current Stock
                </label>
                <div class="branch-stock-info-box">
                  <div class="info-row">
                    <span class="info-label">Branch:</span>
                    <strong class="info-val">{{ currentBranchName() }}</strong>
                  </div>
                  @if (selectedFormProduct()) {
                    <div class="info-row">
                      <span class="info-label">Current Stock:</span>
                      <span class="stock-badge" [class.low]="getBranchStock(selectedFormProduct()!.id) <= (selectedFormProduct()!.minOrderQty || 10)">
                        {{ getBranchStock(selectedFormProduct()!.id) }} {{ formUnitOfMeasure() }}
                      </span>
                    </div>
                  }
                </div>
              </div>
            </div>

            <!-- Dynamic Product & Cost Calculation Summary Strip -->
            @if (selectedFormProduct()) {
              <div class="po-summary-strip">
                <div class="summary-col">
                  <span class="summary-label">Selected SKU</span>
                  <span class="summary-val code-val">{{ selectedFormProduct()!.sku }}</span>
                </div>
                <div class="summary-col">
                  <span class="summary-label">Category</span>
                  <span class="summary-val">{{ selectedFormProduct()!.categoryName }}</span>
                </div>
                <div class="summary-col">
                  <span class="summary-label">Branch Stock</span>
                  <span class="summary-val stock-val">
                    {{ getBranchStock(selectedFormProduct()!.id) }} {{ formUnitOfMeasure() }}
                  </span>
                </div>
                <div class="summary-col">
                  <span class="summary-label">Unit Cost Price</span>
                  <span class="summary-val">Rs. {{ selectedFormProduct()!.costPrice.toFixed(2) }}</span>
                </div>
                <div class="summary-col highlight-col">
                  <span class="summary-label">Estimated Total Cost</span>
                  <span class="summary-val total-cost-val">
                    Rs. {{ (formQuantity() * selectedFormProduct()!.costPrice).toFixed(2) }}
                  </span>
                </div>
              </div>
            }

            <!-- Form Action Footer -->
            <div class="po-form-actions">
              <button type="button" class="btn-pill btn-secondary" (click)="resetDirectForm()">
                <span class="material-symbols-outlined">restart_alt</span>
                Reset Form
              </button>
              <button
                type="button"
                class="btn-pill btn-primary btn-submit-po"
                (click)="submitDirectPurchaseOrder()"
                [disabled]="!formProductId() || !formSupplierId() || formQuantity() <= 0"
              >
                <span class="material-symbols-outlined">send</span>
                Submit Purchase Order
              </button>
            </div>
          </div>
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
                        Receive
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
                  <td><strong>Rs. {{ po.totalCost.toFixed(2) }}</strong></td>
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
      padding: 24px 32px 64px;
      display: flex;
      flex-direction: column;
      gap: 20px;
      height: 100vh;
      overflow-y: auto;
      box-sizing: border-box;
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

    /* Direct Purchase Order Requisition Form Card */
    .po-form-card {
      background: #ffffff;
      border-radius: 16px;
      border: 1px solid #e2e8f0;
      box-shadow: 0 4px 20px -2px rgba(15, 23, 42, 0.05);
      overflow: hidden;
      margin-bottom: 24px;
      transition: border-color 0.2s, box-shadow 0.2s;
    }

    .po-form-header {
      padding: 18px 24px;
      background: linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%);
      border-bottom: 1px solid #d1fae5;
      display: flex;
      align-items: center;
      gap: 16px;

      .header-left {
        display: flex;
        align-items: center;
        gap: 14px;
      }
    }

    .header-icon-box {
      width: 44px;
      height: 44px;
      border-radius: 12px;
      background: #065f46;
      color: #ffffff;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 10px rgba(6, 95, 70, 0.25);
    }

    .po-form-title {
      font-size: 1.2rem;
      font-weight: 800;
      color: #064e3b;
      margin: 0;
      letter-spacing: -0.2px;
    }

    .po-form-body {
      padding: 24px;
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .po-form-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 20px;

      .full-width {
        grid-column: 1 / -1;
      }
    }

    @media (max-width: 900px) {
      .po-form-grid {
        grid-template-columns: 1fr;
      }
    }

    .branch-stock-info-box {
      display: flex;
      flex-direction: column;
      justify-content: center;
      gap: 6px;
      background: #f8fafc;
      border: 1.5px solid #cbd5e1;
      border-radius: 10px;
      padding: 10px 16px;
      min-height: 44px;
      box-sizing: border-box;

      .info-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        font-size: 0.84rem;

        .info-label {
          color: #64748b;
          font-weight: 600;
        }

        .info-val {
          color: #0f172a;
          font-weight: 700;
        }

        .stock-badge {
          display: inline-flex;
          align-items: center;
          padding: 2px 8px;
          border-radius: 6px;
          font-weight: 700;
          font-size: 0.78rem;
          background: #ecfdf5;
          color: #065f46;

          &.low {
            background: #fef2f2;
            color: #b91c1c;
          }
        }
      }
    }

    .form-field {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .field-label {
      font-size: 0.84rem;
      font-weight: 700;
      color: #1e293b;
      display: flex;
      align-items: center;
      gap: 6px;

      .label-icon {
        font-size: 18px;
        color: #065f46;
      }

      .required {
        color: #ef4444;
      }
    }

    .field-hint {
      font-size: 0.72rem;
      color: #64748b;
    }

    .branch-locked-input {
      display: flex;
      align-items: center;
      background: #f8fafc;
      border: 1px solid #cbd5e1;
      border-radius: 10px;
      padding: 8px 14px;
      gap: 10px;

      .store-ic {
        font-size: 20px;
        color: #065f46;
      }

      input {
        flex: 1;
        border: none;
        background: transparent;
        font-size: 0.88rem;
        font-weight: 700;
        color: #0f172a;
        cursor: not-allowed;
      }

      .lock-badge {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        font-size: 0.7rem;
        font-weight: 700;
        color: #64748b;
        background: #e2e8f0;
        padding: 3px 8px;
        border-radius: 6px;

        span { font-size: 13px; }
      }
    }

    .select-wrapper {
      position: relative;

      .form-select {
        width: 100%;
        padding: 10px 14px;
        background: #ffffff;
        border: 1.5px solid #cbd5e1;
        border-radius: 10px;
        font-size: 0.88rem;
        font-weight: 600;
        color: #0f172a;
        outline: none;
        cursor: pointer;
        transition: border-color 0.2s, box-shadow 0.2s;

        &:focus {
          border-color: #059669;
          box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.15);
        }
      }
    }

    .qty-field-group {
      display: flex;
      align-items: center;
      border: 1.5px solid #cbd5e1;
      border-radius: 10px;
      background: #ffffff;
      overflow: hidden;
      transition: border-color 0.2s, box-shadow 0.2s;

      &:focus-within {
        border-color: #059669;
        box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.15);
      }

      .qty-input {
        flex: 1;
        border: none;
        padding: 10px 14px;
        font-size: 0.95rem;
        font-weight: 700;
        color: #0f172a;
        outline: none;
      }

      .qty-uom-addon {
        padding: 10px 16px;
        background: #f1f5f9;
        border-left: 1px solid #e2e8f0;
        font-size: 0.78rem;
        font-weight: 800;
        color: #475569;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }
    }

    .cost-rate-badge {
      display: flex;
      align-items: baseline;
      gap: 8px;
      background: #f8fafc;
      border: 1.5px solid #cbd5e1;
      border-radius: 10px;
      padding: 9px 14px;

      .rate-val {
        font-size: 1.15rem;
        font-weight: 800;
        color: #065f46;
      }

      .rate-uom {
        font-size: 0.8rem;
        font-weight: 700;
        color: #64748b;
        text-transform: uppercase;
      }
    }

    .po-summary-strip {
      display: grid;
      grid-template-columns: repeat(5, 1fr);
      gap: 12px;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 14px 18px;

      .summary-col {
        display: flex;
        flex-direction: column;
        gap: 3px;

        .summary-label {
          font-size: 0.72rem;
          font-weight: 700;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.4px;
        }

        .summary-val {
          font-size: 0.92rem;
          font-weight: 700;
          color: #0f172a;

          &.code-val {
            font-family: monospace;
            color: #0284c7;
          }

          &.stock-val {
            color: #059669;
          }
        }

        &.highlight-col {
          border-left: 2px solid #bbf7d0;
          padding-left: 12px;

          .total-cost-val {
            font-size: 1.25rem;
            font-weight: 900;
            color: #065f46;
          }
        }
      }
    }

    @media (max-width: 900px) {
      .po-summary-strip {
        grid-template-columns: repeat(2, 1fr);
      }
    }

    .po-form-actions {
      display: flex;
      justify-content: flex-end;
      align-items: center;
      gap: 12px;
      padding-top: 10px;
      border-top: 1px solid #f1f5f9;

      .btn-submit-po {
        padding: 11px 24px;
        font-size: 0.92rem;
        box-shadow: 0 4px 14px rgba(6, 95, 70, 0.25);
      }
    }

    .section-divider {
      display: flex;
      align-items: center;
      text-align: center;
      margin: 8px 0 16px;

      &::before, &::after {
        content: '';
        flex: 1;
        border-bottom: 1px dashed #cbd5e1;
      }

      span {
        padding: 0 16px;
        font-size: 0.78rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.6px;
        color: #94a3b8;
      }
    }

    .banner-danger {
      display: flex;
      align-items: center;
      gap: 10px;
      background: #fef2f2;
      border: 1px solid #fecaca;
      color: #991b1b;
      padding: 12px 18px;
      border-radius: 10px;
      font-size: 0.86rem;
      font-weight: 600;

      span.material-symbols-outlined {
        color: #ef4444;
        font-size: 20px;
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

  // Direct Requisition Form State
  formProductId = signal<number | ''>('');
  formSupplierId = signal<number | ''>('');
  formUnitOfMeasure = signal<string>('PIECE');
  formQuantity = signal<number>(10);
  formError = signal<string | null>(null);

  // Reorder Modal State (from quick catalog)
  showOrderModal = signal(false);
  selectedProduct = signal<Product | null>(null);
  selectedSupplierId = 1;
  modalUnitOfMeasure = 'PIECE';
  orderQuantity = 10;

  // Receiving Modal State
  showReceiveModal = signal(false);
  selectedPO = signal<PurchaseOrder | null>(null);
  physicallyReceivedQty = 10;
  receivingInspectionNote = 'Inspection passed: Packaging sealed and count verified.';

  activeBranchId = computed(() => {
    return this.authService.currentUser().branchId || this.inventoryService.selectedBranchId() || 1;
  });

  currentBranchName = computed(() => {
    const userBranchId = this.authService.currentUser().branchId;
    const branch = this.inventoryService.branches.find(b => b.id === (userBranchId || this.inventoryService.selectedBranchId()));
    return branch ? branch.name : 'Colombo Central Flagship';
  });

  selectedFormProduct = computed(() => {
    const id = this.formProductId();
    if (!id) return null;
    return this.productService.products().find(p => p.id === Number(id)) || null;
  });

  filteredCatalog = computed(() => {
    const q = this.searchFilter.toLowerCase().trim();
    return this.productService.products().filter(p =>
      !q || p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q) || p.categoryName.toLowerCase().includes(q)
    );
  });

  activeOrders = computed(() => {
    const branchId = this.activeBranchId();
    return this.inventoryService.purchaseOrders().filter(po =>
      (po.status === 'CONFIRMED' || po.status === 'REQUESTED') && po.branchId === branchId
    );
  });

  pendingReceivingCount = computed(() => {
    const branchId = this.activeBranchId();
    return this.inventoryService.purchaseOrders().filter(po => po.status === 'CONFIRMED' && po.branchId === branchId).length;
  });

  onFormProductSelect(productId: any): void {
    const numId = Number(productId);
    this.formProductId.set(numId);
    this.formError.set(null);

    const prod = this.productService.products().find(p => p.id === numId);
    if (prod) {
      if (prod.supplierId) {
        this.formSupplierId.set(prod.supplierId);
      }
      if (prod.unitOfMeasure) {
        this.formUnitOfMeasure.set(prod.unitOfMeasure);
      }
      this.formQuantity.set(prod.minOrderQty || 10);
    }
  }

  getBranchStock(productId?: number): number {
    if (!productId) return 0;
    const branchId = this.activeBranchId();
    const inv = this.inventoryService.inventory().find(i => i.branchId === branchId && i.productId === productId);
    return inv ? inv.quantity : 0;
  }

  submitDirectPurchaseOrder(): void {
    const prod = this.selectedFormProduct();
    const supId = this.formSupplierId();
    const qty = Number(this.formQuantity());

    if (!prod) {
      this.formError.set('Please select an available item from the dropdown.');
      return;
    }
    if (!supId) {
      this.formError.set('Please select a supplier from the dropdown.');
      return;
    }
    if (!qty || qty <= 0) {
      this.formError.set('Please enter a valid quantity greater than zero.');
      return;
    }

    const branchId = this.activeBranchId();
    const supplier = this.inventoryService.suppliers().find(s => s.supplierId === Number(supId));
    const branch = this.inventoryService.branches.find(b => b.id === branchId);
    const chosenUom = this.formUnitOfMeasure() || prod.unitOfMeasure || 'PIECE';

    const res = this.inventoryService.createPurchaseOrder({
      supplierId: Number(supId),
      branchId: branchId,
      productId: prod.id,
      productName: prod.name,
      sku: prod.sku,
      unitOfMeasure: chosenUom,
      requestedQty: qty,
      unitCost: prod.costPrice,
      requestedBy: this.authService.currentUser().fullName || this.authService.currentUser().username
    });

    this.formError.set(null);
    this.actionMessage.set(`Purchase Order created successfully for ${qty} ${chosenUom} of "${prod.name}" at ${branch ? branch.name : 'Branch'}! (Triggered sp_create_purchase_order)`);

    // Reset direct form
    this.formProductId.set('');
    this.formSupplierId.set('');
    this.formUnitOfMeasure.set('PIECE');
    this.formQuantity.set(10);
  }

  resetDirectForm(): void {
    this.formProductId.set('');
    this.formSupplierId.set('');
    this.formUnitOfMeasure.set('PIECE');
    this.formQuantity.set(10);
    this.formError.set(null);
  }

  openOrderModal(prod: Product): void {
    this.selectedProduct.set(prod);
    this.selectedSupplierId = prod.supplierId || 1;
    this.modalUnitOfMeasure = prod.unitOfMeasure || 'PIECE';
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
      branchId: this.activeBranchId(),
      productId: prod.id,
      productName: prod.name,
      sku: prod.sku,
      unitOfMeasure: this.modalUnitOfMeasure || prod.unitOfMeasure || 'PIECE',
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
