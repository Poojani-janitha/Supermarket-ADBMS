import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { InventoryService } from '../../../../core/services/inventory.service';
import { InventoryItem } from '../../../../core/models';

@Component({
  selector: 'app-inventory-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="page-container">
      <!-- Header -->
      <div class="page-header">
        <div>
          <h1 class="page-title">Branch Stock & Inventory Control</h1>
          <p class="page-subtitle">
            ADBMS Module 2 &bull; Optimistic Locking (<code>version</code>) &bull; Inter-Branch Transfers (<code>sp_transfer_stock</code>)
          </p>
        </div>

        <div class="header-actions">
          <button class="btn-pill btn-secondary" (click)="openTransferModal()">
            <span class="material-symbols-outlined">swap_horiz</span> Inter-Branch Transfer
          </button>
          <a routerLink="/purchase-orders" class="btn-pill btn-primary">
            <span class="material-symbols-outlined">add_shopping_cart</span> Order from Supplier
          </a>
        </div>
      </div>

      <!-- Branch Filter & Search Bar -->
      <div class="filter-bar-card">
        <div class="branch-select-group">
          <span class="material-symbols-outlined">warehouse</span>
          <label>Filter by Branch Outlet:</label>
          <select [ngModel]="selectedBranchFilter()" (ngModelChange)="selectedBranchFilter.set($event)">
            <option [value]="0">All Supermarket Branches</option>
            @for (branch of inventoryService.branches; track branch.id) {
              <option [value]="branch.id">{{ branch.name }}</option>
            }
          </select>
        </div>

        <div class="search-input-box">
          <span class="material-symbols-outlined">search</span>
          <input
            type="text"
            placeholder="Search SKU or product name..."
            [(ngModel)]="searchQuery"
          />
        </div>
      </div>

      <!-- Low Stock Alerts Box (Member 2: trg_inventory_low_stock / v_low_stock) -->
      @if (inventoryService.lowStockAlerts().length > 0) {
        <div class="alert-box">
          <div class="alert-title-row">
            <span class="material-symbols-outlined alert-icon">warning</span>
            <div>
              <strong>Active Low-Stock Alerts (v_low_stock &bull; trg_inventory_low_stock)</strong>
              <p class="alert-sub">Stock below configured safety threshold. Use Purchase Orders to restock from authorized suppliers.</p>
            </div>
          </div>
          <div class="alert-items-list">
            @for (alert of inventoryService.lowStockAlerts(); track alert.alertId) {
              <div class="alert-pill">
                <span>{{ alert.branchName }}: <strong>{{ alert.productName }}</strong></span>
                <span class="alert-qty">{{ alert.quantity }} {{ alert.unitOfMeasure || 'Units' }} remaining</span>
                <a routerLink="/purchase-orders" class="alert-reorder-link">
                  Reorder &rarr;
                </a>
              </div>
            }
          </div>
        </div>
      }

      <!-- Inventory Table -->
      <div class="table-card">
        <table class="data-table">
          <thead>
            <tr>
              <th>BRANCH</th>
              <th>SKU</th>
              <th>PRODUCT NAME</th>
              <th>QUANTITY ON HAND</th>
              <th>REORDER LEVEL</th>
              <th>UNIT (UoM)</th>
              <th>VERSION (LOCK)</th>
              <th>STOCK STATUS</th>
              <th style="text-align: right;">PROCUREMENT / ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            @for (item of filteredInventory(); track item.productId + '-' + item.branchId) {
              <tr>
                <td><strong>{{ item.branchName }}</strong></td>
                <td><span class="code-sku">{{ item.sku }}</span></td>
                <td>{{ item.productName }}</td>
                <td>
                  <span class="qty-badge" [class.danger]="item.isLowStock">
                    {{ item.quantity.toFixed(item.unitOfMeasure === 'KG' || item.unitOfMeasure === 'L' ? 2 : 0) }} {{ item.unitOfMeasure }}
                  </span>
                </td>
                <td>{{ item.reorderLevel }} {{ item.unitOfMeasure }}</td>
                <td><span class="unit-pill">{{ item.unitOfMeasure }}</span></td>
                <td>
                  <span class="version-badge" title="Optimistic Locking Version">v{{ item.version }}</span>
                </td>
                <td>
                  @if (item.isLowStock) {
                    <span class="badge-pill badge-danger">REORDER NEEDED</span>
                  } @else {
                    <span class="badge-pill badge-optimal">OPTIMAL</span>
                  }
                </td>
                <td style="text-align: right;">
                  <a routerLink="/purchase-orders" class="btn-pill btn-outline btn-sm">
                    <span class="material-symbols-outlined">local_shipping</span>
                    Order Stock (PO)
                  </a>
                </td>
              </tr>
            }
            @if (filteredInventory().length === 0) {
              <tr>
                <td colspan="9" style="text-align: center; padding: 36px; color: #64748b;">
                  No inventory records match the selected branch and search query.
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>

      <!-- Architecture Explainer Card -->
      <div class="db-explainer-card">
        <div class="explainer-icon">
          <span class="material-symbols-outlined">storage</span>
        </div>
        <div class="explainer-content">
          <h4>ADBMS Architecture: Verified Stock Auditing</h4>
          <p>
            Stock is never arbitrarily increased. To prevent inventory manipulation and comply with course audit rules, all stock increases are routed through 
            <code>sp_receive_purchase</code> (Goods Receipt Notes) or <code>sp_transfer_stock</code> (Inter-Branch Transfers). Every inventory movement writes directly to the partitioned <code>stock_audit_log</code> table.
          </p>
        </div>
      </div>
    </div>

    <!-- MODAL: INTER-BRANCH STOCK TRANSFER (sp_transfer_stock) -->
    @if (showTransferModal()) {
      <div class="modal-backdrop" (click)="closeTransferModal()">
        <div class="modal-dialog" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <div>
              <h2 class="modal-title">Inter-Branch Stock Transfer</h2>
              <p class="modal-subtitle">Procedure: <code>sp_transfer_stock</code> &bull; ACID Atomic Movement</p>
            </div>
            <button class="btn-close" (click)="closeTransferModal()">&times;</button>
          </div>

          <div class="modal-body">
            @if (transferError()) {
              <div class="error-banner">
                <span class="material-symbols-outlined">error</span>
                <span>{{ transferError() }}</span>
              </div>
            }

            <div class="form-group">
              <label>Select Product to Transfer</label>
              <select [(ngModel)]="transferProductId">
                @for (prod of availableTransferProducts(); track prod.productId) {
                  <option [value]="prod.productId">
                    {{ prod.productName }} ({{ prod.sku }}) - {{ prod.quantity }} {{ prod.unitOfMeasure }} in stock
                  </option>
                }
              </select>
            </div>

            <div class="form-grid">
              <div class="form-group">
                <label>From Source Branch</label>
                <select [(ngModel)]="transferFromBranchId">
                  @for (branch of inventoryService.branches; track branch.id) {
                    <option [value]="branch.id">{{ branch.name }}</option>
                  }
                </select>
              </div>

              <div class="form-group">
                <label>To Destination Branch</label>
                <select [(ngModel)]="transferToBranchId">
                  @for (branch of inventoryService.branches; track branch.id) {
                    @if (branch.id !== transferFromBranchId) {
                      <option [value]="branch.id">{{ branch.name }}</option>
                    }
                  }
                </select>
              </div>
            </div>

            <div class="form-group">
              <label>Transfer Quantity</label>
              <input
                type="number"
                [(ngModel)]="transferQuantity"
                min="1"
                step="1"
                class="input-text"
              />
            </div>
          </div>

          <div class="modal-footer">
            <button class="btn-pill btn-secondary" (click)="closeTransferModal()">Cancel</button>
            <button class="btn-pill btn-primary" (click)="submitTransfer()">
              <span class="material-symbols-outlined">swap_horiz</span>
              Execute Transfer
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

    .header-actions {
      display: flex;
      gap: 10px;
    }

    .filter-bar-card {
      background: #ffffff;
      padding: 14px 20px;
      border-radius: 14px;
      border: 1px solid #e2e8f0;
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 16px;
    }

    .branch-select-group {
      display: flex;
      align-items: center;
      gap: 10px;
      color: #334155;
      font-weight: 700;
      font-size: 0.85rem;

      select {
        padding: 8px 12px;
        border: 1.5px solid #cbd5e1;
        border-radius: 8px;
        outline: none;
        font-size: 0.85rem;
        color: #0f172a;
      }
    }

    .search-input-box {
      display: flex;
      align-items: center;
      gap: 8px;
      width: 320px;

      span { color: #94a3b8; }

      input {
        width: 100%;
        border: none;
        outline: none;
        font-size: 0.88rem;
      }
    }

    .alert-box {
      background: #fffbeb;
      border: 1px solid #fde68a;
      border-radius: 14px;
      padding: 16px 20px;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .alert-title-row {
      display: flex;
      align-items: center;
      gap: 12px;

      .alert-icon { font-size: 26px; color: #d97706; }
      strong { font-size: 0.95rem; color: #92400e; }
      .alert-sub { font-size: 0.78rem; color: #b45309; margin: 2px 0 0 0; }
    }

    .alert-items-list {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
    }

    .alert-pill {
      background: #ffffff;
      border: 1px solid #fcd34d;
      padding: 6px 12px;
      border-radius: 10px;
      font-size: 0.8rem;
      color: #78350f;
      display: flex;
      align-items: center;
      gap: 8px;

      .alert-qty {
        background: #fef2f2;
        color: #b91c1c;
        font-weight: 700;
        padding: 2px 6px;
        border-radius: 4px;
      }

      .alert-reorder-link {
        color: #065f46;
        font-weight: 800;
        text-decoration: none;
        &:hover { text-decoration: underline; }
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

      tr:hover td { background: #f8fafc; }
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

    .qty-badge {
      display: inline-block;
      padding: 4px 10px;
      background: #f1f5f9;
      border-radius: 6px;
      font-weight: 700;
      font-size: 0.85rem;

      &.danger {
        background: #fef2f2;
        color: #dc2626;
        border: 1px solid #fecaca;
      }
    }

    .unit-pill {
      background: #f8fafc;
      border: 1px solid #cbd5e1;
      padding: 2px 8px;
      border-radius: 6px;
      font-size: 0.75rem;
      font-weight: 700;
      color: #475569;
    }

    .version-badge {
      font-family: monospace;
      font-size: 0.75rem;
      background: #eff6ff;
      color: #2563eb;
      padding: 2px 6px;
      border-radius: 4px;
      font-weight: 700;
    }

    .badge-pill {
      display: inline-block;
      padding: 4px 10px;
      border-radius: 20px;
      font-size: 0.72rem;
      font-weight: 800;

      &.badge-danger { background: #fef2f2; color: #dc2626; }
      &.badge-optimal { background: #f0fdf4; color: #16a34a; }
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
      text-decoration: none;
      transition: all 0.2s;

      &.btn-primary {
        background: #065f46;
        color: #ffffff;
        &:hover { background: #064e3b; }
      }

      &.btn-secondary {
        background: #f1f5f9;
        color: #475569;
        &:hover { background: #e2e8f0; }
      }

      &.btn-outline {
        background: transparent;
        border: 1px solid #cbd5e1;
        color: #065f46;
        &:hover { background: #f0fdf4; border-color: #065f46; }
      }

      &.btn-sm { padding: 6px 12px; font-size: 0.78rem; }
    }

    .db-explainer-card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 14px;
      padding: 18px 22px;
      display: flex;
      align-items: center;
      gap: 16px;

      .explainer-icon {
        background: #e2e8f0;
        width: 44px;
        height: 44px;
        border-radius: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #475569;

        span { font-size: 24px; }
      }

      .explainer-content {
        h4 { margin: 0 0 4px 0; font-size: 0.92rem; color: #0f172a; }
        p { margin: 0; font-size: 0.8rem; color: #64748b; line-height: 1.4; }
      }
    }

    /* Modal Styles */
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
      max-width: 520px;
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
      select, .input-text {
        padding: 10px 12px;
        border: 1.5px solid #cbd5e1;
        border-radius: 10px;
        font-size: 0.88rem;
        outline: none;
      }
    }

    .error-banner {
      background: #fef2f2;
      border: 1px solid #fecaca;
      color: #b91c1c;
      padding: 10px 14px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 0.82rem;
      font-weight: 600;
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
export class InventoryListComponent {
  readonly inventoryService = inject(InventoryService);

  selectedBranchFilter = signal<number>(0);
  searchQuery = '';

  // Inter-branch transfer modal state
  showTransferModal = signal(false);
  transferProductId = 2;
  transferFromBranchId = 1;
  transferToBranchId = 2;
  transferQuantity = 5;
  transferError = signal<string | null>(null);

  filteredInventory = computed(() => {
    const branchFilter = Number(this.selectedBranchFilter());
    const query = this.searchQuery.toLowerCase().trim();

    return this.inventoryService.inventory().filter(item => {
      const matchBranch = branchFilter === 0 || item.branchId === branchFilter;
      const matchQuery = !query ||
        item.productName.toLowerCase().includes(query) ||
        item.sku.toLowerCase().includes(query) ||
        item.branchName.toLowerCase().includes(query);
      return matchBranch && matchQuery;
    });
  });

  availableTransferProducts = computed(() => {
    return this.inventoryService.inventory().filter(i => i.branchId === this.transferFromBranchId);
  });

  openTransferModal(): void {
    this.transferError.set(null);
    this.showTransferModal.set(true);
  }

  closeTransferModal(): void {
    this.showTransferModal.set(false);
  }

  submitTransfer(): void {
    this.transferError.set(null);
    const ok = this.inventoryService.transferStock(
      this.transferFromBranchId,
      this.transferToBranchId,
      Number(this.transferProductId),
      Number(this.transferQuantity)
    );

    if (ok) {
      this.closeTransferModal();
    } else {
      this.transferError.set('Transfer failed: Source branch does not have enough stock.');
    }
  }
}
