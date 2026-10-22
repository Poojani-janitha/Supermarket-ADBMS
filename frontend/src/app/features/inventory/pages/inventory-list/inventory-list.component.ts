import { Component, inject, signal, computed, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { InventoryService } from '../../../../core/services/inventory.service';
import { ProductService } from '../../../../core/services/product.service';
import { AuthService } from '../../../../core/services/auth.service';
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
        </div>

        <div class="header-actions">
          <button class="btn-pill btn-secondary" (click)="openTransferModal()">
            <span class="material-symbols-outlined">swap_horiz</span> Inter-Branch Transfer
          </button>
          <a routerLink="/purchase-orders" class="btn-pill btn-primary">
            <span class="material-symbols-outlined">add_shopping_cart</span> Order from Supplier
          </a>

          <!-- Low Stock Notification Bell Dropdown -->
          <div class="notification-wrapper">
            <button
              class="bell-btn"
              [class.has-alerts]="dynamicLowStockAlerts().length > 0"
              [class.active]="showNotifications()"
              (click)="toggleNotifications($event)"
              title="Low Stock Alerts"
              aria-label="Low Stock Alerts"
            >
              <span class="material-symbols-outlined bell-icon">notifications</span>
              @if (dynamicLowStockAlerts().length > 0) {
                <span class="bell-badge">{{ dynamicLowStockAlerts().length }}</span>
              }
            </button>

            <!-- Dropdown Menu -->
            @if (showNotifications()) {
              <div class="notification-dropdown" (click)="$event.stopPropagation()">
                <div class="notif-header">
                  <div class="notif-header-title">
                    <span class="material-symbols-outlined notif-header-icon" [class.alert]="dynamicLowStockAlerts().length > 0">
                      {{ dynamicLowStockAlerts().length > 0 ? 'warning' : 'notifications' }}
                    </span>
                    <span class="notif-title-text">Low Stock Alerts</span>
                    @if (dynamicLowStockAlerts().length > 0) {
                      <span class="notif-count-pill">{{ dynamicLowStockAlerts().length }} items</span>
                    }
                  </div>
                  <p class="notif-subtext">Items at or below Minimum Order Quantity</p>
                </div>

                <div class="notif-body">
                  @if (dynamicLowStockAlerts().length === 0) {
                    <div class="notif-empty">
                      <span class="material-symbols-outlined check-icon">check_circle</span>
                      <p class="notif-empty-title">Stock Levels Optimal</p>
                      <span class="notif-empty-desc">No products are currently below minimum order quantity.</span>
                    </div>
                  } @else {
                    <div class="notif-list">
                      @for (alert of dynamicLowStockAlerts(); track alert.branchId + '-' + alert.productId) {
                        <div class="notif-item">
                          <div class="notif-item-left">
                            <div class="notif-item-top">
                              @if (selectedBranchFilter() === 0) {
                                <span class="notif-branch-tag">{{ alert.branchName }}</span>
                              }
                              <span class="notif-sku">[{{ alert.productSku }}]</span>
                            </div>
                            <div class="notif-prod-name" [title]="alert.productName">{{ alert.productName }}</div>
                            <div class="notif-stock-levels">
                              <span class="notif-qty-danger">Stock: {{ alert.quantity }} {{ alert.unitOfMeasure }}</span>
                              <span class="notif-min-qty">(Min: {{ alert.minOrderQty }} {{ alert.unitOfMeasure }})</span>
                            </div>
                          </div>

                          <div class="notif-item-action">
                            <a
                              routerLink="/purchase-orders"
                              class="notif-reorder-btn"
                              (click)="showNotifications.set(false)"
                              title="Order this product from supplier"
                            >
                              Reorder &rarr;
                            </a>
                          </div>
                        </div>
                      }
                    </div>
                  }
                </div>

                @if (dynamicLowStockAlerts().length > 0) {
                  <div class="notif-footer">
                    <a
                      routerLink="/purchase-orders"
                      class="notif-footer-link"
                      (click)="showNotifications.set(false)"
                    >
                      <span class="material-symbols-outlined">local_shipping</span>
                      Requisition in Purchase Orders
                    </a>
                  </div>
                }
              </div>
            }
          </div>
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
            [ngModel]="searchQuery()"
            (ngModelChange)="searchQuery.set($event)"
          />
          @if (searchQuery()) {
            <button class="clear-search-btn" type="button" (click)="searchQuery.set('')" title="Clear search">
              <span class="material-symbols-outlined">close</span>
            </button>
          }
        </div>
      </div>

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
    :host {
      display: block;
      height: 100%;
      overflow: hidden;
    }

    .page-container {
      padding: 20px 32px 20px;
      display: flex;
      flex-direction: column;
      gap: 14px;
      height: 100%;
      overflow: hidden;
      box-sizing: border-box;
    }

    .page-header {
      flex-shrink: 0;
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
      flex-shrink: 0;
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
      padding: 6px 12px;
      background: #f8fafc;
      border: 1.5px solid #cbd5e1;
      border-radius: 10px;
      transition: all 0.2s ease;

      &:focus-within {
        border-color: #065f46;
        background: #ffffff;
        box-shadow: 0 0 0 3px rgba(6, 95, 70, 0.1);
      }

      span { color: #94a3b8; font-size: 20px; }

      input {
        width: 100%;
        border: none;
        outline: none;
        font-size: 0.88rem;
        background: transparent;
        color: #0f172a;
      }

      .clear-search-btn {
        background: none;
        border: none;
        cursor: pointer;
        padding: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #94a3b8;
        span { font-size: 18px; }
        &:hover { color: #475569; }
      }
    }

    /* Notification Bell & Dropdown Styles */
    .notification-wrapper {
      position: relative;
      display: inline-flex;
    }

    .bell-btn {
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 42px;
      height: 42px;
      border-radius: 12px;
      border: 1.5px solid #e2e8f0;
      background: #ffffff;
      color: #64748b;
      cursor: pointer;
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);

      .bell-icon {
        font-size: 22px;
        transition: transform 0.2s ease;
      }

      &:hover {
        background: #f8fafc;
        border-color: #cbd5e1;
        color: #0f172a;
        transform: translateY(-1px);
      }

      &.active {
        border-color: #065f46;
        box-shadow: 0 0 0 3px rgba(6, 95, 70, 0.12);
      }

      &.has-alerts {
        background: #fef2f2;
        border-color: #fca5a5;
        color: #dc2626;

        .bell-icon {
          color: #dc2626;
        }

        &:hover {
          background: #fee2e2;
          border-color: #ef4444;
          box-shadow: 0 2px 8px rgba(220, 38, 38, 0.2);
        }

        &.active {
          border-color: #dc2626;
          box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.18);
        }
      }
    }

    .bell-badge {
      position: absolute;
      top: -4px;
      right: -4px;
      min-width: 18px;
      height: 18px;
      padding: 0 4px;
      background: #dc2626;
      color: #ffffff;
      border: 2px solid #ffffff;
      border-radius: 10px;
      font-size: 0.68rem;
      font-weight: 800;
      display: flex;
      align-items: center;
      justify-content: center;
      line-height: 1;
      box-shadow: 0 1px 3px rgba(220, 38, 38, 0.4);
      animation: bellPulse 2s infinite ease-in-out;
    }

    @keyframes bellPulse {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.1); }
    }

    .notification-dropdown {
      position: absolute;
      top: calc(100% + 10px);
      right: 0;
      width: 400px;
      max-width: 90vw;
      background: #ffffff;
      border-radius: 16px;
      border: 1px solid #e2e8f0;
      box-shadow: 0 20px 40px -12px rgba(15, 23, 42, 0.25), 0 0 0 1px rgba(15, 23, 42, 0.05);
      z-index: 1100;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      animation: dropdownFade 0.18s cubic-bezier(0.16, 1, 0.3, 1);
    }

    @keyframes dropdownFade {
      from { opacity: 0; transform: translateY(-8px) scale(0.98); }
      to { opacity: 1; transform: translateY(0) scale(1); }
    }

    .notif-header {
      padding: 14px 18px;
      background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%);
      border-bottom: 1px solid #fde68a;

      .notif-header-title {
        display: flex;
        align-items: center;
        gap: 8px;

        .notif-header-icon {
          font-size: 20px;
          color: #d97706;

          &.alert {
            color: #dc2626;
          }
        }

        .notif-title-text {
          font-size: 0.94rem;
          font-weight: 800;
          color: #92400e;
        }

        .notif-count-pill {
          margin-left: auto;
          background: #fee2e2;
          color: #b91c1c;
          border: 1px solid #fecaca;
          font-size: 0.7rem;
          font-weight: 800;
          padding: 2px 7px;
          border-radius: 12px;
        }
      }

      .notif-subtext {
        margin: 4px 0 0 0;
        font-size: 0.74rem;
        color: #b45309;
      }
    }

    .notif-body {
      padding: 12px;
      max-height: 380px;
      overflow-y: auto;
    }

    .notif-empty {
      padding: 28px 16px;
      text-align: center;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 6px;

      .check-icon {
        font-size: 36px;
        color: #10b981;
      }

      .notif-empty-title {
        font-size: 0.9rem;
        font-weight: 700;
        color: #0f172a;
        margin: 0;
      }

      .notif-empty-desc {
        font-size: 0.76rem;
        color: #64748b;
      }
    }

    .notif-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .notif-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      padding: 10px 12px;
      border-radius: 10px;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      transition: all 0.15s ease;

      &:hover {
        background: #ffffff;
        border-color: #cbd5e1;
        box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
      }
    }

    .notif-item-left {
      display: flex;
      flex-direction: column;
      gap: 3px;
      min-width: 0;
    }

    .notif-item-top {
      display: flex;
      align-items: center;
      gap: 6px;

      .notif-branch-tag {
        font-size: 0.68rem;
        font-weight: 700;
        color: #475569;
        background: #e2e8f0;
        padding: 1px 5px;
        border-radius: 4px;
        white-space: nowrap;
      }

      .notif-sku {
        font-family: monospace;
        font-size: 0.72rem;
        font-weight: 700;
        color: #0284c7;
      }
    }

    .notif-prod-name {
      font-size: 0.82rem;
      font-weight: 700;
      color: #0f172a;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: 240px;
    }

    .notif-stock-levels {
      display: flex;
      align-items: center;
      gap: 6px;
      margin-top: 2px;

      .notif-qty-danger {
        background: #fef2f2;
        color: #b91c1c;
        border: 1px solid #fee2e2;
        font-size: 0.72rem;
        font-weight: 800;
        padding: 1px 6px;
        border-radius: 4px;
      }

      .notif-min-qty {
        font-size: 0.72rem;
        color: #78350f;
        font-weight: 600;
      }
    }

    .notif-item-action {
      flex-shrink: 0;

      .notif-reorder-btn {
        display: inline-flex;
        align-items: center;
        background: #ecfdf5;
        border: 1px solid #a7f3d0;
        color: #065f46;
        padding: 4px 10px;
        border-radius: 6px;
        font-size: 0.75rem;
        font-weight: 800;
        text-decoration: none;
        transition: all 0.15s ease;

        &:hover {
          background: #065f46;
          color: #ffffff;
        }
      }
    }

    .notif-footer {
      padding: 10px 14px;
      background: #f8fafc;
      border-top: 1px solid #e2e8f0;
      text-align: center;

      .notif-footer-link {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 6px;
        width: 100%;
        color: #065f46;
        font-size: 0.8rem;
        font-weight: 700;
        text-decoration: none;
        padding: 6px;
        border-radius: 8px;
        transition: background 0.15s;

        span { font-size: 18px; }

        &:hover {
          background: #e2e8f0;
          color: #044e38;
        }
      }
    }

    .table-card {
      background: #ffffff;
      border-radius: 16px;
      border: 1px solid #e2e8f0;
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.03);
      flex: 1;
      min-height: 0;
      overflow-y: auto;
      overflow-x: auto;
      position: relative;
    }

    .data-table {
      width: 100%;
      border-collapse: separate;
      border-spacing: 0;
      text-align: left;

      th {
        position: sticky;
        top: 0;
        z-index: 20;
        background: #f8fafc;
        padding: 14px 16px;
        font-size: 0.72rem;
        font-weight: 800;
        color: #475569;
        letter-spacing: 0.5px;
        border-bottom: 2px solid #e2e8f0;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
        white-space: nowrap;
      }

      td {
        padding: 14px 16px;
        font-size: 0.88rem;
        color: #1e293b;
        border-bottom: 1px solid #f1f5f9;
        vertical-align: middle;
        background: #ffffff;
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
  readonly productService = inject(ProductService);
  readonly authService = inject(AuthService);

  selectedBranchFilter = signal<number>(this.authService.currentUser()?.branchId || 1);
  searchQuery = signal<string>('');

  // Notification dropdown state
  showNotifications = signal(false);

  toggleNotifications(event: MouseEvent): void {
    event.stopPropagation();
    this.showNotifications.update(v => !v);
  }

  @HostListener('document:click')
  onDocumentClick(): void {
    if (this.showNotifications()) {
      this.showNotifications.set(false);
    }
  }

  // Inter-branch transfer modal state
  showTransferModal = signal(false);
  transferProductId = 2;
  transferFromBranchId = 1;
  transferToBranchId = 2;
  transferQuantity = 5;
  transferError = signal<string | null>(null);

  // Dynamic low stock alerts based on Product Catalog's Minimum Order Quantity (minOrderQty)
  dynamicLowStockAlerts = computed(() => {
    const branchFilter = Number(this.selectedBranchFilter());
    const products = this.productService.products();

    return this.inventoryService.inventory()
      .filter(item => branchFilter === 0 || item.branchId === branchFilter)
      .map(item => {
        const prod = products.find(p => p.id === item.productId);
        const minQty = prod?.minOrderQty ?? item.reorderLevel ?? 10;
        return {
          ...item,
          minOrderQty: minQty,
          isLowStock: item.quantity <= minQty,
          productSku: prod?.sku ?? item.sku
        };
      })
      .filter(item => item.isLowStock);
  });

  filteredInventory = computed(() => {
    const branchFilter = Number(this.selectedBranchFilter());
    const query = this.searchQuery().toLowerCase().trim();
    const products = this.productService.products();

    return this.inventoryService.inventory()
      .filter(item => {
        const matchBranch = branchFilter === 0 || item.branchId === branchFilter;
        const matchQuery = !query ||
          item.productName.toLowerCase().includes(query) ||
          item.sku.toLowerCase().includes(query) ||
          item.branchName.toLowerCase().includes(query);
        return matchBranch && matchQuery;
      })
      .map(item => {
        const prod = products.find(p => p.id === item.productId);
        const minQty = prod?.minOrderQty ?? item.reorderLevel ?? 10;
        return {
          ...item,
          reorderLevel: minQty,
          isLowStock: item.quantity <= minQty
        };
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
