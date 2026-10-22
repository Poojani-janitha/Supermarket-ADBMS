import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Product, Category } from '../models';

interface ProductRow {
  product_id: number;
  sku: string;
  product_name: string;
  category_id: number;
  category_name: string;
  category_parent_id: number | null;
  category_parent_name: string | null;
  supplier_id: number;
  supplier_name: string;
  unit_price: number;
  cost_price: number;
  image_url: string | null;
  diet_type: Product['dietType'];
  unit_of_measure: Product['unitOfMeasure'];
  min_order_qty: number;
  is_active: boolean;
}

interface CategoryRow {
  category_id: number;
  name: string;
  icon: string | null;
  parent_id: number | null;
  active_product_count: number;
}

interface UnitRow {
  code: string;
  display_name: string;
}

export interface UnitOption {
  code: string;
  displayName: string;
}

interface SupplierRow {
  supplier_id: number;
  name: string;
}

export interface CreateUnitRequest {
  code: string;
  displayName: string;
}

export interface CreateProductRequest {
  categoryId: number;
  supplierId: number;
  sku: string;
  name: string;
  unitPrice: number;
  costPrice: number;
  imageUrl: string;
  dietType: Product['dietType'] | null;
  unitOfMeasure: Product['unitOfMeasure'];
  minOrderQty: number;
  isActive: boolean;
}

export interface CreateCategoryRequest {
  name: string;
  description: string;
  icon: string;
  parentId: number | null;
}

@Injectable({ providedIn: 'root' })
export class ProductService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = '/api';

  readonly categories = signal<Category[]>([]);
  readonly selectedCategoryId = signal<number>(0);
  readonly searchQuery = signal<string>('');
  readonly products = signal<Product[]>([]);
  readonly loadError = signal<string | null>(null);
  readonly units = signal<UnitOption[]>([]);
  readonly suppliers = signal<SupplierRow[]>([]);

  readonly filteredProducts = computed(() => {
    const categoryId = this.selectedCategoryId();
    return this.products().filter(product =>
      categoryId === 0 || product.categoryId === categoryId
    );
  });

  constructor() {
    this.loadCategories();
    this.loadUnits();
    this.loadSuppliers();
    this.loadProducts();
  }

  loadCategories(): void {
    this.http.get<CategoryRow[]>(`${this.apiUrl}/categories`).subscribe({
      next: rows => this.categories.set([
        { id: 0, name: 'All Aisles', icon: 'grid_view', itemCount: rows.reduce((sum, row) => sum + row.active_product_count, 0), parentId: null },
        ...rows.map(row => ({
          id: row.category_id,
          name: row.name,
          icon: row.icon ?? 'category',
          itemCount: row.active_product_count,
          parentId: row.parent_id
        }))
      ]),
      error: () => this.loadError.set('Unable to load product categories.')
    });
  }

  loadProducts(): void {
    let params = new HttpParams().set('active', 'true');
    if (this.searchQuery().trim()) params = params.set('search', this.searchQuery().trim());
    if (this.selectedCategoryId() > 0) params = params.set('categoryId', this.selectedCategoryId());

    this.http.get<ProductRow[]>(`${this.apiUrl}/products`, { params }).subscribe({
      next: rows => this.products.set(rows.map(row => this.toProduct(row))),
      error: () => this.loadError.set('Unable to load products from the database.')
    });
  }

  selectCategory(id: number): void {
    this.selectedCategoryId.set(id);
    this.loadProducts();
  }

  setSearchQuery(query: string): void {
    this.searchQuery.set(query);
    this.loadProducts();
  }

  updatePrice(productId: number, newPrice: number): void {
    const product = this.products().find(item => item.id === productId);
    if (!product) return;
    this.http.put(`${this.apiUrl}/products/${productId}`, {
      productId,
      categoryId: product.categoryId,
      supplierId: product.supplierId,
      sku: product.sku,
      name: product.name,
      unitPrice: newPrice,
      costPrice: product.costPrice,
      imageUrl: product.imageUrl,
      dietType: product.dietType,
      unitOfMeasure: product.unitOfMeasure,
      minOrderQty: product.minOrderQty,
      isActive: product.isActive
    }).subscribe({
      next: () => this.loadProducts(),
      error: () => this.loadError.set('Unable to update product price.')
    });
  }

  createProduct(request: CreateProductRequest) {
    return this.http.post<{ productId: number }>(`${this.apiUrl}/products`, request);
  }

  updateProduct(productId: number, request: CreateProductRequest) {
    return this.http.put<{ productId: number }>(`${this.apiUrl}/products/${productId}`, {
      productId,
      ...request
    });
  }

  createCategory(request: CreateCategoryRequest) {
    return this.http.post<{ categoryId: number }>(`${this.apiUrl}/categories`, request);
  }

  loadUnits(): void {
    this.http.get<UnitRow[]>(`${this.apiUrl}/units`).subscribe({
      next: rows => this.units.set(rows.map(row => ({
        code: row.code,
        displayName: row.display_name
      }))),
      error: () => this.loadError.set('Unable to load units of measure. Run the units database migration first.')
    });
  }

  createUnit(request: CreateUnitRequest) {
    return this.http.post<{ code: string; displayName: string }>(`${this.apiUrl}/units`, request);
  }

  loadSuppliers(): void {
    this.http.get<SupplierRow[]>(`${this.apiUrl}/suppliers`).subscribe({
      next: rows => this.suppliers.set(rows),
      error: () => this.loadError.set('Unable to load suppliers.')
    });
  }

  uploadProductImage(file: File) {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<{ imageUrl: string }>(`${this.apiUrl}/product-images`, formData);
  }

  decrementStock(productId: number, quantity: number): void {
    this.products.update(list => list.map(product =>
      product.id === productId
        ? { ...product, stockQty: Math.max(0, product.stockQty - quantity) }
        : product
    ));
  }

  private toProduct(row: ProductRow): Product {
    return {
      id: row.product_id,
      name: row.product_name,
      sku: row.sku,
      unitPrice: Number(row.unit_price),
      costPrice: Number(row.cost_price),
      categoryId: row.category_id,
      categoryName: row.category_name,
      categoryParentId: row.category_parent_id,
      categoryParentName: row.category_parent_name,
      supplierId: row.supplier_id,
      supplierName: row.supplier_name,
      isActive: row.is_active,
      imageUrl: row.image_url ?? '',
      dietType: row.diet_type ?? undefined,
      unitOfMeasure: row.unit_of_measure ?? undefined,
      minOrderQty: Number(row.min_order_qty),
      stockQty: 0
    };
  }
}
