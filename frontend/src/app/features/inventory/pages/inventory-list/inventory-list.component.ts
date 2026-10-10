import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InventoryService } from '../../../../core/services/inventory.service';
import { InventoryItem } from '../../../../core/models';

interface PurchaseOrderView {
  poId: number;
  supplierName: string;
  branchName: string;
  orderDate: string;
  status: 'PENDING' | 'RECEIVED' | 'CANCELLED';
  itemsSummary: string;
  totalCost: number;
}

@Component({
  selector: 'app-inventory-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-container">
      <div class="page-header">
        <div>
          <h1 class="page-title">Branch Inventory & Supply Chain</h1>
          <p class="page-subtitle">Managed by Member 2 | Procedures: sp_add_stock, sp_transfer_stock, sp_receive_purchase | Triggers: trg_inventory_low_stock</p>
        </div>

        <div class="header-actions">
          <button class="btn-pill btn-secondary" (click)="openTransferModal()">
            <span class="material-symbols-outlined">swap_horiz</span> Inter-Branch Transfer
          </button>
          <button class="btn-pill btn-primary" (click)="openRestockModal()">
            <span class="material-symbols-outlined">add_box</span> Direct Restock (sp_add_stock)
          </button>
        </div>
      </div>

      <!-- Tab Switcher -->
      <div class="nav-tabs-bar">
        <button
          class="tab-btn"
          [class.active]="activeTab() === 'STOCK'"
          (click)="activeTab.set('STOCK')"
        >
          <span class="material-symbols-outlined">inventory_2</span>
          Branch Stock Levels (inventory)
        </button>
        <button
          class="tab-btn"
          [class.active]="activeTab() === 'PURCHASE'"
          (click)="activeTab.set('PURCHASE')"
        >
          <span class="material-symbols-outlined">local_shipping</span>
          Purchase Orders & Receiving (sp_receive_purchase)
        </button>
      </div>

      <!-- Low Stock Alerts Box (Only when on STOCK tab) -->
      @if (activeTab() === 'STOCK' && inventoryService.lowStockAlerts().length > 0) {
        <div class="alert-box">
          <div class="alert-title-row">
            <span class="material-symbols-outlined alert-icon">warning</span>
            <strong>Active Low-Stock Alerts (v_low_stock / trg_inventory_low_stock)</strong>
          </div>
          <div class="alert-items-list">
            @for (alert of inventoryService.lowStockAlerts(); track alert.alertId) {
              <div class="alert-pill">
                <span>{{ alert.branchName }}: <strong>{{ alert.productName }}</strong> ({{ alert.quantity }} left)</span>
              </div>
            }
          </div>
        </div>
      }

      <!-- TAB 1: STOCK LEVELS -->
      @if (activeTab() === 'STOCK') {
        <div class="table-card">
          <table class="data-table">
            <thead>
              <tr>
                <th>BRANCH</th>
                <th>SKU</th>
                <th>PRODUCT NAME</th>
                <th>QUANTITY ON HAND</th>
                <th>REORDER LEVEL</th>
                <th>LOCK VERSION</th>
                <th>STATUS</th>
                <th style="text-align: right;">QUICK ACTION</th>
              </tr>
            </thead>
            <tbody>
              @for (item of inventoryService.inventory(); track item.productId + '-' + item.branchId) {
                <tr>
                  <td><strong>{{ item.branchName }}</strong></td>
                  <td><span class="code-sku">{{ item.sku }}</span></td>
                  <td>{{ item.productName }}</td>
                  <td>
                    <span class="qty-badge" [class.danger]="item.isLowStock">
                      {{ item.quantity }} Units
                    </span>
                  </td>
                  <td>{{ item.reorderLevel }} Units</td>
                  <td><span class="version-badge">v{{ item.version }}</span></td>
                  <td>
                    @if (item.isLowStock) {
                      <span class="badge-pill badge-nonveg">REORDER NEEDED</span>
                    } @else {
                      <span class="badge-pill badge-veg">OPTIMAL</span>
                    }
                  </td>
                  <td style="text-align: right;">
                    <button class="btn-pill btn-outline btn-sm" (click)="quickRestock(item)">
                      + Restock 10 (sp_add_stock)
                    </button>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }

      <!-- TAB 2: PURCHASE ORDERS & RECEIVING (sp_receive_purchase) -->
      @if (activeTab() === 'PURCHASE') {
        <div class="table-card">
          <table class="data-table">
            <thead>
              <tr>
                <th>PO #</th>
                <th>SUPPLIER</th>
                <th>DESTINATION BRANCH</th>
                <th>ORDER DATE</th>
                <th>ITEMS ORDERED</th>
                <th>TOTAL COST</th>
                <th>STATUS</th>
                <th style="text-align: right;">ACTION</th>
              </tr>
            </thead>
            <tbody>
              @for (po of purchaseOrders(); track po.poId) {
                <tr>
                  <td><span class="code-sku">#PO-{{ po.poId }}</span></td>
                  <td><strong>{{ po.supplierName }}</strong></td>
                  <td>{{ po.branchName }}</td>
                  <td>{{ po.orderDate }}</td>
                  <td>{{ po.itemsSummary }}</td>
                  <td><strong>\${{ po.totalCost.toFixed(2) }}</strong></td>
                  <td>
                    @if (po.status === 'RECEIVED') {
                      <span class="badge-pill badge-veg">RECEIVED & IN STOCK</span>
                    } @else {
                      <span class="badge-pill badge-discount">PENDING ARRIVAL</span>
                    }
                  </td>
                  <td style="text-align: right;">
                    @if (po.status === 'PENDING') {
                      <button class="btn-pill btn-primary btn-sm" (click)="receivePurchaseOrder(po)">
                        <span class="material-symbols-outlined" style="font-size: 16px;">download_done</span>
                        Receive (sp_receive_purchase)
                      </button>
                    } @else {
                      <span style="color: var(--primary-green); font-size: 0.78rem; font-weight: 700;">Stock Incremented</span>
                    }
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }

      <!-- Inter-Branch Transfer Modal (sp_transfer_stock) -->
      @if (isTransferOpen()) {
        <div class="modal-backdrop" (click)="isTransferOpen.set(false)">
          <div class="modal-dialog" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h3 class="modal-title">Inter-Branch Stock Transfer (ACID Procedure)</h3>
              <button class="close-btn" (click)="isTransferOpen.set(false)">&times;</button>
            </div>

            <p class="procedure-note">
              Calls <strong>sp_transfer_stock</strong> inside a single transaction with row-level locks on both inventory rows. Rolls back atomically if source branch has insufficient stock.
            </p>

            <div class="form-group">
              <label>Source Branch (Stock Deducted)</label>
              <select [(ngModel)]="transferFromBranch" class="form-control">
                @for (b of inventoryService.branches; track b.id) {
                  <option [value]="b.id">{{ b.name }}</option>
                }
              </select>
            </div>

            <div class="form-group">
              <label>Destination Branch (Stock Added)</label>
              <select [(ngModel)]="transferToBranch" class="form-control">
                @for (b of inventoryService.branches; track b.id) {
                  <option [value]="b.id">{{ b.name }}</option>
                }
              </select>
            </div>

            <div class="form-group">
              <label>Transfer Quantity</label>
              <input type="number" [(ngModel)]="transferQty" min="1" class="form-control" />
            </div>

            <div class="modal-actions">
              <button class="btn-pill btn-outline" (click)="isTransferOpen.set(false)">Cancel</button>
              <button class="btn-pill btn-primary" (click)="executeTransfer()">Execute Transfer (sp_transfer_stock)</button>
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
      gap: 18px;
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

    .header-actions {
      display: flex;
      gap: 10px;
    }

    .nav-tabs-bar {
      display: flex;
      gap: 10px;
      border-bottom: 2px solid var(--border-light);
      padding-bottom: 2px;
    }

    .nav-tabs-bar .tab-btn {
      display: flex;
      align-items: center;
      gap: 8px;
      background: transparent;
      border: none;
      padding: 10px 18px;
      border-radius: var(--radius-sm) var(--radius-sm) 0 0;
      color: var(--text-secondary);
      font-weight: 600;
      font-size: 0.9rem;
      cursor: pointer;
      border-bottom: 2px solid transparent;
      margin-bottom: -4px;
      transition: all 0.2s ease;
    }

    .nav-tabs-bar .tab-btn.active {
      color: var(--primary-green-dark);
      border-bottom: 3px solid var(--primary-green);
      font-weight: 700;
      background: #ffffff;
    }

    .alert-box {
      background: #fef2f2;
      border: 1.5px solid #fecaca;
      border-radius: var(--radius-md);
      padding: 14px 18px;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .alert-title-row {
      display: flex;
      align-items: center;
      gap: 8px;
      color: #991b1b;
      font-size: 0.88rem;
    }

    .alert-icon {
      color: #dc2626;
      font-size: 20px;
    }

    .alert-items-list {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }

    .alert-pill {
      background: #ffffff;
      border: 1px solid #fca5a5;
      padding: 4px 10px;
      border-radius: var(--radius-pill);
      font-size: 0.8rem;
      color: #7f1d1d;
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
      padding: 3px 6px;
      border-radius: 4px;
    }

    .qty-badge {
      font-weight: 700;
      color: var(--text-main);
    }

    .qty-badge.danger {
      color: #dc2626;
    }

    .version-badge {
      font-family: monospace;
      font-size: 0.75rem;
      color: #64748b;
      background: #f1f5f9;
      padding: 2px 6px;
      border-radius: 4px;
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
      width: 480px;
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
export class InventoryListComponent {
  readonly inventoryService = inject(InventoryService);

  readonly activeTab = signal<'STOCK' | 'PURCHASE'>('STOCK');
  readonly isTransferOpen = signal<boolean>(false);
  transferFromBranch = 1;
  transferToBranch = 2;
  transferQty = 5;

  readonly purchaseOrders = signal<PurchaseOrderView[]>([
    {
      poId: 501,
      supplierName: 'Ceylon Agro Farms Ltd',
      branchName: 'Colombo Central Flagship',
      orderDate: '2026-10-09',
      status: 'PENDING',
      itemsSummary: 'Sri Lankan Keeri Samba Rice 5kg (100 bags)',
      totalCost: 980.00
    },
    {
      poId: 502,
      supplierName: 'Highland Dairy Products',
      branchName: 'Colombo Central Flagship',
      orderDate: '2026-10-07',
      status: 'RECEIVED',
      itemsSummary: 'Farm Fresh Full Cream Milk 1L (150 bottles)',
      totalCost: 285.00
    }
  ]);

  quickRestock(item: InventoryItem): void {
    this.inventoryService.addStock(item.branchId, item.productId, 10);
  }

  openRestockModal(): void {
    const item = this.inventoryService.inventory()[0];
    this.quickRestock(item);
    alert(`Restocked 10 units for ${item.productName} via sp_add_stock.`);
  }

  openTransferModal(): void {
    this.isTransferOpen.set(true);
  }

  executeTransfer(): void {
    const ok = this.inventoryService.transferStock(this.transferFromBranch, this.transferToBranch, 2, this.transferQty);
    if (ok) {
      this.isTransferOpen.set(false);
      alert('Transfer successful! Both branch inventory records and stock_audit_log updated via sp_transfer_stock.');
    } else {
      alert('Transfer failed: Insufficient stock at source branch.');
    }
  }

  receivePurchaseOrder(po: PurchaseOrderView): void {
    this.purchaseOrders.update(list =>
      list.map(p => p.poId === po.poId ? { ...p, status: 'RECEIVED' } : p)
    );
    this.inventoryService.addStock(1, 2, 100);
    alert(`sp_receive_purchase executed for #PO-${po.poId}! Stock of 100 units added to branch inventory, and PO status marked RECEIVED.`);
  }
}
