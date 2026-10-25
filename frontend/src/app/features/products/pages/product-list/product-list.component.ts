import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CreateCategoryRequest, CreateProductRequest, CreateUnitRequest, ProductService } from '../../../../core/services/product.service';
import { AuthService } from '../../../../core/services/auth.service';
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
        </div>
        <div class="page-header-actions">
          <button class="btn-pill btn-outline" type="button" (click)="openCategoryModal()">
            <span class="material-symbols-outlined">account_tree</span> Add Category
          </button>
          <button class="btn-pill btn-primary" type="button" (click)="openAddModal()">
            <span class="material-symbols-outlined">add</span> Add New Product
          </button>
        </div>
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

          @if (unitModalOpen()) {
            <div class="modal-backdrop category-backdrop" (click)="closeUnitModal()">
              <div class="modal-dialog category-dialog" (click)="$event.stopPropagation()">
                <div class="modal-header">
                  <h3 class="modal-title">Add Unit of Measure</h3>
                  <button class="close-btn" type="button" (click)="closeUnitModal()">&times;</button>
                </div>
                <p class="modal-description">Use a short code such as BOX and a readable display name.</p>
                @if (unitError()) {
                  <div class="form-error">{{ unitError() }}</div>
                }
                <div class="form-group">
                  <label for="unit-code">Unit Code *</label>
                  <input
                    id="unit-code"
                    type="text"
                    [ngModel]="newUnit.code"
                    (ngModelChange)="setUnitCode($event)"
                    class="form-control"
                    maxlength="30"
                    placeholder="BOX"
                  />
                </div>
                <div class="form-group">
                  <label for="unit-name">Display Name *</label>
                  <input id="unit-name" type="text" [(ngModel)]="newUnit.displayName" class="form-control" maxlength="80" />
                </div>
                <div class="modal-actions">
                  <button class="btn-pill btn-outline" type="button" (click)="closeUnitModal()">Cancel</button>
                  <button class="btn-pill btn-primary" type="button" [disabled]="isSavingUnit()" (click)="saveUnit()">
                    {{ isSavingUnit() ? 'Saving...' : 'Save Unit' }}
                  </button>
                </div>
              </div>
            </div>
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
              <th>COST PRICE</th>
              <th>STOCK</th>
              <th>DIET</th>
              <th style="text-align: right;">ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            @for (p of paginatedProducts(); track p.id) {
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
                  <span class="price-text">Rs. {{ p.unitPrice.toFixed(2) }}</span>
                </td>
                <td>
                  <span class="price-text">Rs. {{ p.costPrice.toFixed(2) }}</span>
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
                  <button class="btn-pill btn-secondary view-product-btn" (click)="openViewModal(p)">
                    <span class="material-symbols-outlined" style="font-size: 16px;">visibility</span> View
                  </button>
                  <button class="btn-pill btn-secondary edit-price-btn" (click)="openEditModal(p)">
                    <span class="material-symbols-outlined" style="font-size: 16px;">edit</span> Edit Product
                  </button>
                </td>
              </tr>
            }
          </tbody>
        </table>

        @if (productService.filteredProducts().length > catalogPageSize) {
          <div class="pagination-footer">
            <div class="pagination-info">
              Showing Page <strong>{{ catalogPage() }}</strong> of <strong>{{ catalogTotalPages() }}</strong> ({{ productService.filteredProducts().length }} products)
            </div>
            <div class="pagination-controls">
              <button
                class="page-btn"
                [disabled]="catalogPage() === 1"
                (click)="catalogPage.update(p => p - 1)"
              >
                <span class="material-symbols-outlined">chevron_left</span>
                <span>Previous</span>
              </button>
              <div class="page-pills">
                @for (p of catalogPageNumbers(); track p) {
                  <button
                    class="page-num-pill"
                    [class.active]="p === catalogPage()"
                    (click)="catalogPage.set(p)"
                  >
                    {{ p }}
                  </button>
                }
              </div>
              <button
                class="page-btn"
                [disabled]="catalogPage() === catalogTotalPages()"
                (click)="catalogPage.update(p => p + 1)"
              >
                <span>Next</span>
                <span class="material-symbols-outlined">chevron_right</span>
              </button>
            </div>
          </div>
        }
      </div>

      @if (viewedProduct(); as prod) {
        <div class="modal-backdrop" (click)="closeViewModal()">
          <div class="modal-dialog view-product-dialog" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h3 class="modal-title">Product Details</h3>
              <button class="close-btn" type="button" (click)="closeViewModal()">&times;</button>
            </div>

            <div class="product-view-header">
              @if (prod.imageUrl) {
                <img [src]="prod.imageUrl" [alt]="prod.name" class="product-view-image" />
              } @else {
                <div class="product-image-placeholder">No image</div>
              }
              <div>
                <h4 class="product-view-name">{{ prod.name }}</h4>
                <span class="code-sku">{{ prod.sku }}</span>
              </div>
            </div>

            <div class="details-grid">
              <div><span class="detail-label">Product ID</span><strong>{{ prod.id }}</strong></div>
              <div><span class="detail-label">SKU</span><strong>{{ prod.sku }}</strong></div>
              <div><span class="detail-label">Category</span><strong>{{ prod.categoryName }}</strong></div>
              <div><span class="detail-label">Parent category</span><strong>{{ prod.categoryParentName || 'Top-level category' }}</strong></div>
              <div><span class="detail-label">Category ID</span><strong>{{ prod.categoryId }}</strong></div>
              <div><span class="detail-label">Supplier</span><strong>{{ prod.supplierName || 'Not specified' }}</strong></div>
              <div><span class="detail-label">Supplier ID</span><strong>{{ prod.supplierId || 'Not specified' }}</strong></div>
              <div><span class="detail-label">Unit price</span><strong>Rs. {{ prod.unitPrice.toFixed(2) }}</strong></div>
              <div><span class="detail-label">Cost price</span><strong>Rs. {{ prod.costPrice.toFixed(2) }}</strong></div>
              <div><span class="detail-label">Unit of measure</span><strong>{{ unitDisplayName(prod.unitOfMeasure) }}</strong></div>
              <div><span class="detail-label">Minimum order quantity</span><strong>{{ prod.minOrderQty }}</strong></div>
              <div><span class="detail-label">Diet type</span><strong>{{ prod.dietType || 'Not specified' }}</strong></div>
              <div><span class="detail-label">Status</span><strong>{{ prod.isActive ? 'Active' : 'Inactive' }}</strong></div>
              <div><span class="detail-label">Stock</span><strong>{{ prod.stockQty }}</strong></div>
              <div class="detail-wide"><span class="detail-label">Image URL</span><strong>{{ prod.imageUrl || 'No image uploaded' }}</strong></div>
            </div>

            <div class="modal-actions">
              <button class="btn-pill btn-primary" type="button" (click)="closeViewModal()">Close</button>
            </div>
          </div>
        </div>
      }

      <!-- Product Edit Modal -->
      @if (selectedProduct(); as prod) {
        <div class="modal-backdrop" (click)="closeModal()">
          <div class="modal-dialog add-product-dialog" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h3 class="modal-title">Edit Product</h3>
              <button class="close-btn" (click)="closeModal()">&times;</button>
            </div>
            <p class="modal-description">Update the catalog details for this product.</p>
            @if (editProductError()) {
              <div class="form-error">{{ editProductError() }}</div>
            }
            <div class="form-row">
              <div class="form-group">
                <label for="edit-product-sku">SKU *</label>
                <input id="edit-product-sku" type="text" [(ngModel)]="editProduct.sku" class="form-control" maxlength="30" />
              </div>
              <div class="form-group">
                <label for="edit-product-name">Product Name *</label>
                <input id="edit-product-name" type="text" [(ngModel)]="editProduct.name" class="form-control" maxlength="150" />
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label for="edit-product-category">Category *</label>
                <select id="edit-product-category" [(ngModel)]="editProduct.categoryId" class="form-control">
                  @for (category of productService.categories().slice(1); track category.id) {
                    <option [ngValue]="category.id">{{ category.name }}</option>
                  }
                </select>
              </div>
              <div class="form-group">
                <label for="edit-product-supplier">Supplier</label>
                <select id="edit-product-supplier" [(ngModel)]="editProduct.supplierId" class="form-control">
                  <option [ngValue]="0">Select supplier (optional)</option>
                  @for (supplier of productService.suppliers(); track supplier.supplier_id) {
                    <option [ngValue]="supplier.supplier_id">{{ supplier.name }}</option>
                  }
                </select>
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label for="edit-product-price">Unit Price *</label>
                <input id="edit-product-price" type="number" min="0" step="0.01" [(ngModel)]="editProduct.unitPrice" class="form-control" />
              </div>
              <div class="form-group">
                <label for="edit-product-cost">Cost Price *</label>
                <input id="edit-product-cost" type="number" min="0" step="0.01" [(ngModel)]="editProduct.costPrice" class="form-control" />
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label for="edit-product-unit">Unit of Measure *</label>
                <select id="edit-product-unit" [(ngModel)]="editProduct.unitOfMeasure" class="form-control">
                  <option value="">Select unit of measure</option>
                  @for (unit of productService.units(); track unit.code) {
                    <option [ngValue]="unit.code">{{ unit.displayName }}</option>
                  }
                </select>
              </div>
              <div class="form-group">
                <label for="edit-product-quantity">Minimum Order Quantity *</label>
                <input id="edit-product-quantity" type="number" min="0.01" step="0.01" [(ngModel)]="editProduct.minOrderQty" class="form-control" />
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label for="edit-product-diet">Diet Type</label>
                <select id="edit-product-diet" [(ngModel)]="editProduct.dietType" class="form-control">
                  <option [ngValue]="null">Not specified</option>
                  <option value="VEG">VEG</option>
                  <option value="NON_VEG">NON_VEG</option>
                </select>
              </div>
              <div class="form-group">
                <label for="edit-product-image">Replace Image</label>
                <input id="edit-product-image" type="file" accept="image/*" class="form-control" (change)="selectEditImage($event)" />
              </div>
            </div>
            <label class="active-checkbox">
              <input type="checkbox" [(ngModel)]="editProduct.isActive" />
              Active product
            </label>

            <div class="modal-actions">
              <button class="btn-pill btn-outline" (click)="closeModal()">Cancel</button>
              <button class="btn-pill btn-primary" [disabled]="isSavingEditProduct()" (click)="saveEditProduct()">
                {{ isSavingEditProduct() ? 'Saving...' : 'Save Changes' }}
              </button>
            </div>
          </div>
        </div>
      }

      @if (categoryModalOpen()) {
        <div class="modal-backdrop category-backdrop" (click)="closeCategoryModal()">
          <div class="modal-dialog category-dialog" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h3 class="modal-title">{{ categoryMode === 'parent' ? 'Add Parent Category' : 'Add Subcategory' }}</h3>
              <button class="close-btn" type="button" (click)="closeCategoryModal()">&times;</button>
            </div>
            <p class="modal-description">
              {{ categoryMode === 'parent'
                ? 'Create a main parent category first.'
                : 'Create a subcategory under the selected parent category.' }}
            </p>
            @if (categoryError()) {
              <div class="form-error">{{ categoryError() }}</div>
            }
            <div class="form-row">
              <div class="form-group">
                <label for="category-parent">Parent category</label>
                <select id="category-parent" [(ngModel)]="newCategory.parentId" class="form-control"
                        [disabled]="categoryMode === 'parent'">
                  <option [ngValue]="null">Select parent category</option>
                  @for (category of parentCategories(); track category.id) {
                    <option [ngValue]="category.id">{{ category.name }}</option>
                  }
                </select>
              </div>
              <div class="form-group">
                <label for="category-subcategory">Existing subcategories</label>
                <select id="category-subcategory" class="form-control"
                        [disabled]="!newCategory.parentId">
                  <option>{{ newCategory.parentId ? 'Select a subcategory' : 'Select a parent first' }}</option>
                  @for (category of subcategoriesFor(newCategory.parentId); track category.id) {
                    <option [ngValue]="category.id">{{ category.name }}</option>
                  }
                </select>
              </div>
            </div>
            <div class="category-actions">
              <button class="link-button" type="button" (click)="openParentCategoryModal()">+ Add parent</button>
              <button class="link-button" type="button" [disabled]="!newCategory.parentId"
                      (click)="openSubcategoryModal()">+ Add subcategory</button>
            </div>
            <div class="form-group">
              <label for="category-name">{{ categoryMode === 'parent' ? 'Parent category name' : 'Subcategory name' }} *</label>
              <input id="category-name" type="text" [(ngModel)]="newCategory.name" class="form-control" maxlength="80" />
            </div>
            <div class="form-group">
              <label for="category-description">Description</label>
              <input id="category-description" type="text" [(ngModel)]="newCategory.description" class="form-control" maxlength="255" />
            </div>
            <div class="form-group">
              <label for="category-icon">Icon name</label>
              <input id="category-icon" type="text" [(ngModel)]="newCategory.icon" class="form-control" maxlength="50" />
            </div>
            <div class="modal-actions">
              <button class="btn-pill btn-outline" type="button" (click)="closeCategoryModal()">Cancel</button>
              <button class="btn-pill btn-primary" type="button" [disabled]="isSavingCategory()" (click)="saveCategory()">
                {{ isSavingCategory() ? 'Saving...' : 'Save Category' }}
              </button>
            </div>
          </div>
        </div>
      }

      @if (addModalOpen()) {
        <div class="modal-backdrop" (click)="closeAddModal()">
          <div class="modal-dialog add-product-dialog" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h3 class="modal-title">Add New Product</h3>
              <button class="close-btn" type="button" (click)="closeAddModal()">&times;</button>
            </div>

            <p class="modal-description">
              Add a product to the catalog. The form will save it through <strong>sp_save_product</strong>.
            </p>

            @if (addProductError()) {
              <div class="form-error">{{ addProductError() }}</div>
            }

            <div class="form-row">
              <div class="form-group">
                <label for="product-sku">SKU *</label>
                <input id="product-sku" type="text" [(ngModel)]="newProduct.sku" class="form-control" maxlength="30" />
              </div>
              <div class="form-group">
                <label for="product-name">Product Name *</label>
                <input id="product-name" type="text" [(ngModel)]="newProduct.name" class="form-control" maxlength="150" />
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <div class="label-with-action">
                  <label for="product-parent-category">Parent category *</label>
                  <button type="button" class="link-button" (click)="openParentCategoryModal()">+ Add parent</button>
                </div>
                <select id="product-parent-category" [(ngModel)]="productParentId"
                        (ngModelChange)="onProductParentChange($event)" class="form-control">
                  <option [ngValue]="null">Select parent category</option>
                  @for (category of parentCategories(); track category.id) {
                    <option [ngValue]="category.id">{{ category.name }}</option>
                  }
                </select>
              </div>
              <div class="form-group">
                <div class="label-with-action">
                  <label for="product-category">Subcategory</label>
                  <button type="button" class="link-button" [disabled]="!productParentId"
                          (click)="openSubcategoryModal()">+ Add subcategory</button>
                </div>
                <select id="product-category" [(ngModel)]="newProduct.categoryId" class="form-control"
                        [disabled]="!productParentId">
                  <option [ngValue]="0">Select subcategory (optional)</option>
                  @for (category of subcategoriesFor(productParentId); track category.id) {
                    <option [ngValue]="category.id">{{ category.name }}</option>
                  }
                </select>
              </div>
              <div class="form-group">
                <label for="product-supplier">Supplier ID</label>
                <select id="product-supplier" [(ngModel)]="newProduct.supplierId" class="form-control">
                  <option [ngValue]="0">Select supplier (optional)</option>
                  @for (supplier of productService.suppliers(); track supplier.supplier_id) {
                    <option [ngValue]="supplier.supplier_id">{{ supplier.name }}</option>
                  }
                </select>
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label for="product-price">Unit Price *</label>
                <input id="product-price" type="number" min="0" step="0.01" [(ngModel)]="newProduct.unitPrice" class="form-control" placeholder="0.00" />
              </div>
              <div class="form-group">
                <label for="product-cost">Cost Price *</label>
                <input id="product-cost" type="number" min="0" step="0.01" [(ngModel)]="newProduct.costPrice" class="form-control" placeholder="0.00" />
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label for="product-unit">Unit of Measure *</label>
                <select id="product-unit" [(ngModel)]="newProduct.unitOfMeasure" class="form-control">
                  <option value="">Select unit of measure</option>
                  @for (unit of productService.units(); track unit.code) {
                    <option [ngValue]="unit.code">{{ unit.displayName }}</option>
                  }
                </select>
                <button type="button" class="link-button" (click)="openUnitModal()">+ Add unit</button>
              </div>
              <div class="form-group">
                <label for="product-quantity">Minimum Order Quantity *</label>
                <input id="product-quantity" type="number" min="0.01" step="0.01" [(ngModel)]="newProduct.minOrderQty" class="form-control" />
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label for="product-diet">Diet Type</label>
                <select id="product-diet" [(ngModel)]="newProduct.dietType" class="form-control">
                  <option [ngValue]="null">Not specified</option>
                  <option value="VEG">VEG</option>
                  <option value="NON_VEG">NON_VEG</option>
                </select>
              </div>
              <div class="form-group">
                <label for="product-image">Product image</label>
                <input id="product-image" type="file" accept="image/*" class="form-control" (change)="selectImage($event)" />
                @if (newProduct.imageUrl) {
                  <small class="image-status">Image selected and ready to upload</small>
                }
              </div>
            </div>

            <label class="active-checkbox">
              <input type="checkbox" [(ngModel)]="newProduct.isActive" />
              Active product
            </label>

            <div class="modal-actions">
              <button class="btn-pill btn-outline" type="button" (click)="closeAddModal()">Cancel</button>
              <button class="btn-pill btn-primary" type="button" [disabled]="isSavingProduct()" (click)="saveProduct()">
                {{ isSavingProduct() ? 'Saving...' : 'Save Product' }}
              </button>
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

    .page-header-actions {
      display: flex;
      align-items: center;
      gap: 10px;
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

    .image-status {
      color: #059669;
      font-size: 0.75rem;
    }

    .edit-price-btn {
      padding: 6px 14px;
      font-size: 0.8rem;
    }

    .view-product-btn {
      padding: 6px 14px;
      font-size: 0.8rem;
      margin-right: 6px;
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

    .add-product-dialog {
      width: min(680px, calc(100vw - 32px));
      max-height: calc(100vh - 32px);
      overflow-y: auto;
    }

    .category-backdrop {
      z-index: 1100;
    }

    .category-dialog {
      width: min(460px, calc(100vw - 32px));
    }

    .view-product-dialog {
      width: min(620px, calc(100vw - 32px));
    }

    .product-view-header {
      display: flex;
      align-items: center;
      gap: 16px;
      padding-bottom: 8px;
      border-bottom: 1px solid #e2e8f0;
    }

    .product-view-image,
    .product-image-placeholder {
      width: 88px;
      height: 88px;
      border-radius: 12px;
      object-fit: cover;
    }

    .product-image-placeholder {
      display: flex;
      align-items: center;
      justify-content: center;
      background: #f1f5f9;
      color: #64748b;
      font-size: 0.75rem;
    }

    .product-view-name {
      margin: 0 0 8px;
      font-size: 1.1rem;
    }

    .details-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 14px;
    }

    .details-grid > div {
      display: flex;
      flex-direction: column;
      gap: 3px;
      padding-bottom: 8px;
      border-bottom: 1px solid #f1f5f9;
    }

    .details-grid .detail-wide {
      grid-column: 1 / -1;
    }

    .detail-label {
      color: #64748b;
      font-size: 0.75rem;
      font-weight: 700;
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

    .modal-description {
      margin: 0;
      color: #64748b;
      font-size: 0.82rem;
      line-height: 1.4;
    }

    .form-error {
      padding: 10px 12px;
      border: 1px solid #fecaca;
      border-radius: 8px;
      background: #fef2f2;
      color: #b91c1c;
      font-size: 0.82rem;
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

    .label-with-action {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .category-actions {
      display: flex;
      justify-content: flex-end;
      gap: 14px;
      margin: -4px 0 8px;
    }

    .link-button {
      border: 0;
      padding: 0;
      background: transparent;
      color: var(--primary-green);
      cursor: pointer;
      font-size: 0.75rem;
      font-weight: 700;
    }

    .form-control {
      padding: 9px 12px;
      border-radius: 8px;
      border: 1px solid #cbd5e1;
      font-family: inherit;
      font-size: 0.9rem;
    }

    .form-help {
      color: var(--text-muted);
      font-size: 0.75rem;
      line-height: 1.35;
    }

    .active-input {
      border-color: var(--primary-green);
      outline: none;
      box-shadow: 0 0 0 2px rgba(0, 168, 84, 0.15);
    }

    .active-checkbox {
      display: flex;
      align-items: center;
      gap: 8px;
      color: #475569;
      font-size: 0.85rem;
      font-weight: 600;
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

    /* Table Pagination */
    .pagination-footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 14px 20px;
      border-top: 1px solid #f1f5f9;
      background: #fafafa;
      flex-wrap: wrap;
      gap: 12px;
      border-bottom-left-radius: 12px;
      border-bottom-right-radius: 12px;
    }

    .pagination-info {
      font-size: 0.84rem;
      color: #64748b;
      font-weight: 500;
      strong { color: #1e293b; }
    }

    .pagination-controls {
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .page-btn {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      background: #ffffff;
      border: 1px solid #cbd5e1;
      padding: 5px 12px;
      border-radius: 8px;
      font-size: 0.8rem;
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

      span.material-symbols-outlined { font-size: 16px; }
    }

    .page-pills {
      display: flex;
      gap: 4px;
    }

    .page-num-pill {
      background: #ffffff;
      border: 1px solid #cbd5e1;
      padding: 5px 10px;
      border-radius: 6px;
      font-size: 0.8rem;
      font-weight: 700;
      color: #475569;
      cursor: pointer;
      transition: all 0.15s;

      &.active {
        background: #065f46;
        border-color: #065f46;
        color: #ffffff;
      }

      &:hover:not(.active) {
        border-color: #065f46;
        color: #065f46;
        background: #f0fdf4;
      }
    }
  `]
})
export class ProductListComponent {
  readonly productService = inject(ProductService);
  readonly authService = inject(AuthService);

  // Pagination for Product Catalog
  catalogPage = signal<number>(1);
  catalogPageSize = 8;
  catalogTotalPages = computed(() => Math.max(1, Math.ceil(this.productService.filteredProducts().length / this.catalogPageSize)));
  paginatedProducts = computed(() => {
    const page = this.catalogPage();
    const start = (page - 1) * this.catalogPageSize;
    return this.productService.filteredProducts().slice(start, start + this.catalogPageSize);
  });
  catalogPageNumbers = computed(() => {
    return Array.from({ length: this.catalogTotalPages() }, (_, i) => i + 1);
  });

  readonly selectedProduct = signal<Product | null>(null);
  readonly viewedProduct = signal<Product | null>(null);
  readonly addModalOpen = signal(false);
  readonly addProductError = signal<string | null>(null);
  readonly isSavingProduct = signal(false);
  readonly categoryModalOpen = signal(false);
  readonly categoryError = signal<string | null>(null);
  readonly isSavingCategory = signal(false);
  categoryMode: 'parent' | 'subcategory' = 'parent';
  productParentId: number | null = null;
  readonly unitModalOpen = signal(false);
  readonly unitError = signal<string | null>(null);
  readonly isSavingUnit = signal(false);
  readonly editProductError = signal<string | null>(null);
  readonly isSavingEditProduct = signal(false);
  newProduct: CreateProductRequest = this.emptyProduct();
  newCategory: CreateCategoryRequest = this.emptyCategory();
  newUnit: CreateUnitRequest = this.emptyUnit();
  selectedImage: File | null = null;
  editProduct: CreateProductRequest = this.emptyProduct();
  selectedEditImage: File | null = null;

  openEditModal(p: Product): void {
    if (!this.authService.isManager()) {
      this.authService.triggerSecurityAlert(
        'product',
        'UPDATE',
        'Restricted Action: Cashiers are not authorized to modify product catalog details or pricing. Store Manager or Admin role required.'
      );
      return;
    }
    this.selectedProduct.set(p);
    this.editProduct = {
      categoryId: p.categoryId,
      supplierId: p.supplierId ?? 0,
      sku: p.sku,
      name: p.name,
      unitPrice: p.unitPrice,
      costPrice: p.costPrice,
      imageUrl: p.imageUrl,
      dietType: p.dietType ?? null,
      unitOfMeasure: p.unitOfMeasure ?? 'PIECE',
      minOrderQty: p.minOrderQty ?? 1,
      isActive: p.isActive
    };
    this.selectedEditImage = null;
    this.editProductError.set(null);
  }

  openViewModal(p: Product): void {
    this.viewedProduct.set(p);
  }

  closeViewModal(): void {
    this.viewedProduct.set(null);
  }

  unitDisplayName(code: string | undefined): string {
    if (!code) return 'Not specified';
    return this.productService.units().find(unit => unit.code === code)?.displayName ?? code;
  }

  openAddModal(): void {
    if (!this.authService.isManager()) {
      this.authService.triggerSecurityAlert(
        'product',
        'INSERT',
        'Restricted Action: Cashiers are not authorized to create new products. Store Manager or Admin role required.'
      );
      return;
    }
    this.newProduct = this.emptyProduct();
    this.productParentId = null;
    this.selectedImage = null;
    this.addProductError.set(null);
    this.addModalOpen.set(true);
  }

  closeAddModal(): void {
    if (!this.isSavingProduct()) {
      this.addModalOpen.set(false);
    }
  }

  openCategoryModal(): void {
    if (!this.authService.isManager()) {
      this.authService.triggerSecurityAlert(
        'category',
        'INSERT',
        'Restricted Action: Cashiers are not authorized to create product categories. Store Manager or Admin role required.'
      );
      return;
    }
    this.newCategory = this.emptyCategory();
    this.categoryMode = this.parentCategories().length === 0 ? 'parent' : 'subcategory';
    this.categoryError.set(null);
    this.categoryModalOpen.set(true);
  }

  openParentCategoryModal(): void {
    if (!this.authService.isManager()) {
      this.authService.triggerSecurityAlert(
        'category',
        'INSERT',
        'Restricted Action: Cashiers are not authorized to create product categories. Store Manager or Admin role required.'
      );
      return;
    }
    this.newCategory = this.emptyCategory();
    this.categoryMode = 'parent';
    this.categoryError.set(null);
    this.categoryModalOpen.set(true);
  }

  openSubcategoryModal(): void {
    if (!this.authService.isManager()) {
      this.authService.triggerSecurityAlert(
        'category',
        'INSERT',
        'Restricted Action: Cashiers are not authorized to create subcategories. Store Manager or Admin role required.'
      );
      return;
    }
    const parentId = this.newCategory.parentId ?? this.productParentId;
    if (parentId == null) {
      this.categoryError.set('Select a parent category before adding a subcategory.');
      if (!this.categoryModalOpen()) {
        this.categoryMode = 'subcategory';
        this.categoryModalOpen.set(true);
      }
      return;
    }
    this.newCategory = { ...this.emptyCategory(), parentId };
    this.categoryMode = 'subcategory';
    this.categoryError.set(null);
    this.categoryModalOpen.set(true);
  }

  closeCategoryModal(): void {
    if (!this.isSavingCategory()) {
      this.categoryModalOpen.set(false);
    }
  }

  openUnitModal(): void {
    if (!this.authService.isManager()) {
      this.authService.triggerSecurityAlert(
        'unit_of_measure',
        'INSERT',
        'Restricted Action: Cashiers are not authorized to register units of measure. Store Manager or Admin role required.'
      );
      return;
    }
    this.newUnit = this.emptyUnit();
    this.unitError.set(null);
    this.unitModalOpen.set(true);
  }

  closeUnitModal(): void {
    if (!this.isSavingUnit()) {
      this.unitModalOpen.set(false);
    }
  }

  saveUnit(): void {
    if (!this.newUnit.code.trim() || !this.newUnit.displayName.trim()) {
      this.unitError.set('Unit code and display name are required.');
      return;
    }
    this.isSavingUnit.set(true);
    this.productService.createUnit({
      code: this.newUnit.code.trim().toUpperCase(),
      displayName: this.newUnit.displayName.trim()
    }).subscribe({
      next: response => {
        this.isSavingUnit.set(false);
        this.unitModalOpen.set(false);
        this.productService.loadUnits();
        this.newProduct.unitOfMeasure = response.code;
      },
      error: error => {
        this.isSavingUnit.set(false);
        this.unitError.set(error?.error?.message ?? 'Unable to save the unit.');
      }
    });
  }

  setUnitCode(value: string): void {
    this.newUnit.code = value
      .toUpperCase()
      .replace(/[^A-Z0-9_ -]/g, '')
      .replace(/\s+/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_+|_+$/g, '')
      .slice(0, 30);
  }

  parentCategories() {
    return this.productService.categories().filter(category => category.id > 0 && category.parentId === null);
  }

  subcategoriesFor(parentId: number | null) {
    if (parentId == null) return [];
    return this.productService.categories().filter(category => category.parentId === parentId);
  }

  onProductParentChange(parentId: number | null): void {
    this.productParentId = parentId;
    this.newProduct.categoryId = 0;
  }

  selectImage(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.selectedImage = input.files?.[0] ?? null;
    this.newProduct.imageUrl = this.selectedImage ? 'pending-upload' : '';
  }

  saveCategory(): void {
    if (!this.newCategory.name.trim()) {
      this.categoryError.set('Category name is required.');
      return;
    }

    this.categoryError.set(null);
    this.isSavingCategory.set(true);
    this.productService.createCategory({
      ...this.newCategory,
      name: this.newCategory.name.trim(),
      description: this.newCategory.description.trim(),
      icon: this.newCategory.icon.trim() || 'category'
    }).subscribe({
      next: response => {
        this.isSavingCategory.set(false);
        if (this.categoryMode === 'parent') {
          this.productParentId = response.categoryId;
          this.newProduct.categoryId = 0;
          this.categoryMode = 'subcategory';
          this.newCategory = {
            ...this.emptyCategory(),
            parentId: response.categoryId
          };
        } else {
          this.productParentId = this.newCategory.parentId;
          this.newProduct.categoryId = response.categoryId;
          this.newCategory = {
            ...this.emptyCategory(),
            parentId: this.productParentId
          };
        }
        this.categoryError.set(null);
        this.productService.loadCategories();
      },
      error: error => {
        this.isSavingCategory.set(false);
        this.categoryError.set(error?.error?.message ?? 'Unable to save the category.');
      }
    });
  }

  saveProduct(): void {
    const product = this.newProduct;
    if (!product.sku.trim() || !product.name.trim()) {
      this.addProductError.set('SKU and product name are required.');
      return;
    }
    const effectiveCategoryId = (product.categoryId && product.categoryId > 0)
      ? product.categoryId
      : (this.productParentId && this.productParentId > 0 ? this.productParentId : 0);

    if (effectiveCategoryId <= 0) {
      this.addProductError.set('Please select a parent category.');
      return;
    }
    if (product.unitPrice == null || (product.unitPrice as any) === '' || isNaN(Number(product.unitPrice)) || Number(product.unitPrice) < 0) {
      this.addProductError.set('Unit Price is required and must be zero or higher.');
      return;
    }
    if (product.costPrice == null || (product.costPrice as any) === '' || isNaN(Number(product.costPrice)) || Number(product.costPrice) < 0) {
      this.addProductError.set('Cost Price is required and must be zero or higher.');
      return;
    }
    if (!product.unitOfMeasure || !product.unitOfMeasure.trim()) {
      this.addProductError.set('Unit of Measure is required.');
      return;
    }
    if (product.minOrderQty == null || (product.minOrderQty as any) === '' || isNaN(Number(product.minOrderQty)) || Number(product.minOrderQty) <= 0) {
      this.addProductError.set('Minimum order quantity is required and must be greater than zero.');
      return;
    }

    if (!this.selectedImage && this.newProduct.imageUrl === 'pending-upload') {
      this.addProductError.set('Please select a valid image file.');
      return;
    }
    this.addProductError.set(null);
    this.isSavingProduct.set(true);
    const save = (imageUrl: string) => this.productService.createProduct({
      ...product,
      categoryId: effectiveCategoryId,
      supplierId: product.supplierId && product.supplierId > 0 ? product.supplierId : 0,
      unitPrice: Number(product.unitPrice),
      costPrice: Number(product.costPrice),
      unitOfMeasure: (product.unitOfMeasure || '').trim(),
      minOrderQty: Number(product.minOrderQty),
      sku: product.sku.trim(),
      name: product.name.trim(),
      imageUrl
    }).subscribe({
      next: () => {
        this.isSavingProduct.set(false);
        this.addModalOpen.set(false);
        this.productService.loadCategories();
        this.productService.loadProducts();
      },
      error: error => {
        this.isSavingProduct.set(false);
        this.addProductError.set(error?.error?.message ?? 'Unable to save the product. Check the category, supplier, and SKU.');
      }
    });
    if (this.selectedImage) {
      this.productService.uploadProductImage(this.selectedImage).subscribe({
        next: response => save(response.imageUrl),
        error: error => {
          this.isSavingProduct.set(false);
          this.addProductError.set(error?.error?.message ?? 'Unable to upload the product image.');
        }
      });
    } else {
      save(product.imageUrl === 'pending-upload' ? '' : product.imageUrl.trim());
    }
  }

  closeModal(): void {
    if (!this.isSavingEditProduct()) {
      this.selectedProduct.set(null);
    }
  }

  selectEditImage(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.selectedEditImage = input.files?.[0] ?? null;
  }

  saveEditProduct(): void {
    const prod = this.selectedProduct();
    const product = this.editProduct;
    if (!prod) return;
    if (!product.sku.trim() || !product.name.trim()) {
      this.editProductError.set('SKU and product name are required.');
      return;
    }
    if (!product.categoryId || product.categoryId <= 0) {
      this.editProductError.set('Please select a category.');
      return;
    }
    if (product.unitPrice == null || (product.unitPrice as any) === '' || isNaN(Number(product.unitPrice)) || Number(product.unitPrice) < 0) {
      this.editProductError.set('Unit Price is required and must be zero or higher.');
      return;
    }
    if (product.costPrice == null || (product.costPrice as any) === '' || isNaN(Number(product.costPrice)) || Number(product.costPrice) < 0) {
      this.editProductError.set('Cost Price is required and must be zero or higher.');
      return;
    }
    if (!product.unitOfMeasure || !product.unitOfMeasure.trim()) {
      this.editProductError.set('Unit of Measure is required.');
      return;
    }
    if (product.minOrderQty == null || (product.minOrderQty as any) === '' || isNaN(Number(product.minOrderQty)) || Number(product.minOrderQty) <= 0) {
      this.editProductError.set('Minimum order quantity is required and must be greater than zero.');
      return;
    }

    this.editProductError.set(null);
    this.isSavingEditProduct.set(true);
    const save = (imageUrl: string) => this.productService.updateProduct(prod.id, {
      ...product,
      supplierId: product.supplierId && product.supplierId > 0 ? product.supplierId : 0,
      unitPrice: Number(product.unitPrice),
      costPrice: Number(product.costPrice),
      unitOfMeasure: (product.unitOfMeasure || '').trim(),
      minOrderQty: Number(product.minOrderQty),
      sku: product.sku.trim(),
      name: product.name.trim(),
      imageUrl
    }).subscribe({
      next: () => {
        this.isSavingEditProduct.set(false);
        this.selectedProduct.set(null);
        this.productService.loadCategories();
        this.productService.loadProducts();
      },
      error: error => {
        this.isSavingEditProduct.set(false);
        this.editProductError.set(error?.error?.message ?? 'Unable to update the product.');
      }
    });

    if (this.selectedEditImage) {
      this.productService.uploadProductImage(this.selectedEditImage).subscribe({
        next: response => save(response.imageUrl),
        error: error => {
          this.isSavingEditProduct.set(false);
          this.editProductError.set(error?.error?.message ?? 'Unable to upload the product image.');
        }
      });
    } else {
      save(product.imageUrl.trim());
    }
  }

  private emptyProduct(): CreateProductRequest {
    return {
      categoryId: 0,
      supplierId: 0,
      sku: '',
      name: '',
      unitPrice: '' as unknown as number,
      costPrice: '' as unknown as number,
      imageUrl: '',
      dietType: null,
      unitOfMeasure: '',
      minOrderQty: 1,
      isActive: true
    };
  }

  private emptyCategory(): CreateCategoryRequest {
    return {
      name: '',
      description: '',
      icon: 'category',
      parentId: null
    };
  }

  private emptyUnit(): CreateUnitRequest {
    return { code: '', displayName: '' };
  }
}
