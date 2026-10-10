import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProductService } from '../../../../core/services/product.service';
import { Product } from '../../../../core/models';

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-container">
      <!-- Header -->
      <div class="page-header">
        <div>
          <h1 class="page-title">Product Catalog & Pricing</h1>
          <p class="page-subtitle">Managed by Member 3 | Triggers: trg_product_price_audit | Index: FULLTEXT idx_product_ft</p>
        </div>
        <button class="btn-pill btn-primary" (click)="openAddModal()">
          <span class="material-symbols-outlined">add</span> Add New Product
        </button>
      </div>

      <!-- Search & Filters -->
      <div class="filters-bar">
        <div class="search-box">
          <span class="material-symbols-outlined search-icon">search</span>
          <input
            type="text"
            placeholder="Search catalog by name or SKU (FULLTEXT index)..."
            [ngModel]="productService.searchQuery()"
            (ngModelChange)="productService.setSearchQuery($event)"
          />
        </div>

        <div class="cat-pill-group">
          @for (cat of productService.categories(); track cat.id) {
            <button
              class="cat-chip"
              [class.active]="productService.selectedCategoryId() === cat.id"
              (click)="productService.selectCategory(cat.id)"
            >
              {{ cat.name }}
            </button>
          }
        </div>
      </div>

      <!-- Products Table -->
      <div class="table-card">
        <table class="data-table">
          <thead>
            <tr>
              <th>IMAGE</th>
              <th>SKU</th>
              <th>PRODUCT NAME</th>
              <th>CATEGORY</th>
              <th>UNIT PRICE</th>
              <th>STOCK</th>
              <th>DIET</th>
              <th style="text-align: right;">ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            @for (p of productService.filteredProducts(); track p.id) {
              <tr>
                <td>
                  <img [src]="p.imageUrl" [alt]="p.name" class="thumb-img" />
                </td>
                <td><span class="code-sku">{{ p.sku }}</span></td>
                <td>
                  <strong>{{ p.name }}</strong>
                  @if (p.discountBadge) {
                    <span class="badge-pill badge-discount" style="margin-left: 6px;">{{ p.discountBadge }}</span>
                  }
                </td>
                <td>{{ p.categoryName }}</td>
                <td>
                  <span class="price-text">\${{ p.unitPrice.toFixed(2) }}</span>
                </td>
                <td>
                  <span class="stock-badge" [class.low-stock]="p.stockQty < 20">
                    {{ p.stockQty }} in stock
                  </span>
                </td>
                <td>
                  @if (p.dietType) {
                    <span class="badge-pill" [class.badge-veg]="p.dietType === 'VEG'" [class.badge-nonveg]="p.dietType === 'NON_VEG'">
                      {{ p.dietType }}
                    </span>
                  }
                </td>
                <td style="text-align: right;">
                  <button class="btn-pill btn-secondary edit-price-btn" (click)="openPriceModal(p)">
                    <span class="material-symbols-outlined" style="font-size: 16px;">edit</span> Update Price
                  </button>
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>

      <!-- Price Update Modal (Simulates trg_product_price_audit) -->
      @if (selectedProduct(); as prod) {
        <div class="modal-backdrop" (click)="closeModal()">
          <div class="modal-dialog" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h3 class="modal-title">Update Unit Price</h3>
              <button class="close-btn" (click)="closeModal()">&times;</button>
            </div>

            <p class="audit-notice">
              <span class="material-symbols-outlined" style="color: #059669; font-size: 18px;">verified_user</span>
              Price modifications automatically invoke <strong>trg_product_price_audit</strong>, capturing old vs new price and user timestamp in <strong>price_audit_log</strong>.
            </p>

            <div class="form-group">
              <label>Product Name</label>
              <input type="text" [value]="prod.name" disabled class="form-control" />
            </div>

            <div class="form-row">
              <div class="form-group">
                <label>Current Price</label>
                <input type="text" [value]="'\$' + prod.unitPrice.toFixed(2)" disabled class="form-control" />
              </div>
              <div class="form-group">
                <label>New Unit Price (\$)</label>
                <input type="number" step="0.5" [(ngModel)]="newPrice" class="form-control active-input" />
              </div>
            </div>

            <div class="modal-actions">
              <button class="btn-pill btn-outline" (click)="closeModal()">Cancel</button>
              <button class="btn-pill btn-primary" (click)="savePrice()">Save & Fire Trigger</button>
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

    .filters-bar {
      display: flex;
      gap: 16px;
      align-items: center;
      flex-wrap: wrap;
    }

    .search-box {
      flex: 1;
      min-width: 280px;
      background: #ffffff;
      border: 1px solid var(--border-light);
      border-radius: var(--radius-pill);
      padding: 0 16px;
      display: flex;
      align-items: center;
      gap: 10px;
      height: 44px;
      box-shadow: var(--shadow-sm);
    }

    .search-box input {
      border: none;
      outline: none;
      width: 100%;
      font-family: inherit;
      font-size: 0.9rem;
    }

    .search-icon {
      color: #9ca3af;
    }

    .cat-pill-group {
      display: flex;
      gap: 6px;
      flex-wrap: wrap;
    }

    .cat-chip {
      padding: 7px 14px;
      border-radius: var(--radius-pill);
      border: 1px solid var(--border-light);
      background: #ffffff;
      font-size: 0.8rem;
      font-weight: 600;
      color: var(--text-secondary);
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .cat-chip.active {
      background: var(--primary-green);
      color: #ffffff;
      border-color: var(--primary-green);
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

    .thumb-img {
      width: 44px;
      height: 44px;
      border-radius: 10px;
      object-fit: cover;
    }

    .code-sku {
      font-family: monospace;
      font-size: 0.8rem;
      background: #f1f5f9;
      padding: 3px 6px;
      border-radius: 4px;
    }

    .price-text {
      font-weight: 700;
      color: var(--primary-green);
    }

    .stock-badge {
      font-weight: 600;
      font-size: 0.8rem;
      color: #059669;
    }

    .stock-badge.low-stock {
      color: #dc2626;
      font-weight: 700;
    }

    .edit-price-btn {
      padding: 6px 14px;
      font-size: 0.8rem;
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

    .audit-notice {
      background: #f0fdf4;
      border: 1px solid #bbf7d0;
      border-radius: 8px;
      padding: 10px;
      font-size: 0.78rem;
      color: #166534;
      display: flex;
      gap: 6px;
      align-items: flex-start;
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

    .active-input {
      border-color: var(--primary-green);
      outline: none;
      box-shadow: 0 0 0 2px rgba(0, 168, 84, 0.15);
    }

    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
    }

    .modal-actions {
      display: flex;
      justify-content: flex-end;
      gap: 10px;
      margin-top: 8px;
    }
  `]
})
export class ProductListComponent {
  readonly productService = inject(ProductService);

  readonly selectedProduct = signal<Product | null>(null);
  newPrice: number = 0;

  openPriceModal(p: Product): void {
    this.selectedProduct.set(p);
    this.newPrice = p.unitPrice;
  }

  openAddModal(): void {
    alert('Catalog addition modal opens. Dispatches sp_save_product inside MySQL.');
  }

  closeModal(): void {
    this.selectedProduct.set(null);
  }

  savePrice(): void {
    const prod = this.selectedProduct();
    if (prod && this.newPrice > 0) {
      this.productService.updatePrice(prod.id, this.newPrice);
      this.closeModal();
    }
  }
}
