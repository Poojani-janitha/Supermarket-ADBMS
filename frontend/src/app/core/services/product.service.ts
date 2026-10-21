import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Product, Category } from '../models';

interface ProductRow {
  product_id: number;
  sku: string;
  product_name: string;
  category_id: number;
  category_name: string;
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

  private readonly defaultProducts: Product[] = [
    {
      id: 1,
      name: 'Organic Hass Avocados (Pack of 4)',
      sku: 'PRD-AVO-001',
      unitPrice: 5.40,
      costPrice: 3.20,
      categoryId: 1,
      categoryName: 'Fresh Produce',
      supplierId: 1,
      supplierName: 'Lanka Fresh Organics Ltd',
      isActive: true,
      imageUrl: 'https://images.unsplash.com/photo-1523049673857-eb18f1d7b578?w=300',
      dietType: 'VEG',
      unitOfMeasure: 'PACKET',
      minOrderQty: 10,
      stockQty: 48
    },
    {
      id: 2,
      name: 'Sri Lankan Keeri Samba Rice Premium 5kg',
      sku: 'PAN-RIC-002',
      unitPrice: 14.50,
      costPrice: 9.80,
      categoryId: 2,
      categoryName: 'Pantry & Staples',
      supplierId: 2,
      supplierName: 'Ceylon Agro Grain Mills',
      isActive: true,
      imageUrl: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=300',
      dietType: 'VEG',
      unitOfMeasure: 'KG',
      minOrderQty: 20,
      stockQty: 120
    },
    {
      id: 3,
      name: 'Farm Fresh Full Cream Pasteurised Milk 1L',
      sku: 'DAI-MLK-003',
      unitPrice: 2.80,
      costPrice: 1.75,
      categoryId: 3,
      categoryName: 'Dairy & Eggs',
      supplierId: 3,
      supplierName: 'Highland Dairy Farms',
      isActive: true,
      imageUrl: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=300',
      dietType: 'VEG',
      unitOfMeasure: 'L',
      minOrderQty: 15,
      stockQty: 12
    },
    {
      id: 4,
      name: 'Fresh Atlantic Salmon Fillet',
      sku: 'SEA-SAL-004',
      unitPrice: 18.90,
      costPrice: 12.50,
      categoryId: 4,
      categoryName: 'Meat & Seafood',
      supplierId: 4,
      supplierName: 'Ocean Harvest Seafoods',
      isActive: true,
      imageUrl: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=300',
      dietType: 'NON_VEG',
      unitOfMeasure: 'KG',
      minOrderQty: 5,
      stockQty: 4.5
    },
    {
      id: 5,
      name: 'Ceylon Pure Single Origin Green Tea 200g',
      sku: 'BEV-TEA-005',
      unitPrice: 6.20,
      costPrice: 3.90,
      categoryId: 5,
      categoryName: 'Beverages',
      supplierId: 5,
      supplierName: 'Dilmah Ceylon Tea Estates',
      isActive: true,
      imageUrl: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=300',
      dietType: 'VEG',
      unitOfMeasure: 'PACKET',
      minOrderQty: 10,
      stockQty: 80
    },
    {
      id: 6,
      name: 'Artisan Sourdough Loaf Freshly Baked',
      sku: 'BAK-BRD-006',
      unitPrice: 4.50,
      costPrice: 2.40,
      categoryId: 6,
      categoryName: 'Bakery',
      supplierId: 6,
      supplierName: 'Colombo Artisan Bakehouse',
      isActive: true,
      imageUrl: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=300',
      dietType: 'VEG',
      unitOfMeasure: 'PIECE',
      minOrderQty: 10,
      stockQty: 6
    },
    {
      id: 7,
      name: 'Extra Virgin Cold Pressed Olive Oil 750ml',
      sku: 'PAN-OIL-007',
      unitPrice: 12.00,
      costPrice: 7.80,
      categoryId: 2,
      categoryName: 'Pantry & Staples',
      supplierId: 7,
      supplierName: 'Mediterranean Olive Orchards',
      isActive: true,
      imageUrl: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=300',
      dietType: 'VEG',
      unitOfMeasure: 'BOTTLE',
      minOrderQty: 12,
      stockQty: 45
    },
    {
      id: 8,
      name: 'Organic Whole Black Peppercorns 100g',
      sku: 'SPC-PEP-008',
      unitPrice: 3.50,
      costPrice: 1.90,
      categoryId: 2,
      categoryName: 'Pantry & Staples',
      supplierId: 8,
      supplierName: 'Ceylon Nut & Spice Exporters',
      isActive: true,
      imageUrl: 'https://images.unsplash.com/photo-1599940824399-b87987ceb72a?w=300',
      dietType: 'VEG',
      unitOfMeasure: 'PACKET',
      minOrderQty: 15,
      stockQty: 65
    }
  ];

  readonly categories = signal<Category[]>([
    { id: 0, name: 'All Aisles', icon: 'grid_view', itemCount: 8 },
    { id: 1, name: 'Fresh Produce', icon: 'nutrition', itemCount: 1 },
    { id: 2, name: 'Pantry & Staples', icon: 'kitchen', itemCount: 3 },
    { id: 3, name: 'Dairy & Eggs', icon: 'egg', itemCount: 1 },
    { id: 4, name: 'Meat & Seafood', icon: 'set_meal', itemCount: 1 },
    { id: 5, name: 'Beverages', icon: 'local_cafe', itemCount: 1 },
    { id: 6, name: 'Bakery', icon: 'bakery_dining', itemCount: 1 }
  ]);
  readonly selectedCategoryId = signal<number>(0);
  readonly searchQuery = signal<string>('');
  readonly products = signal<Product[]>(this.defaultProducts);
  readonly loadError = signal<string | null>(null);
  readonly units = signal<UnitOption[]>([
    { code: 'KG', displayName: 'Kilograms' },
    { code: 'L', displayName: 'Litres' },
    { code: 'PACKET', displayName: 'Packets' },
    { code: 'PIECE', displayName: 'Pieces' },
    { code: 'BOTTLE', displayName: 'Bottles' }
  ]);
  readonly suppliers = signal<SupplierRow[]>([
    { supplier_id: 1, name: 'Lanka Fresh Organics Ltd' },
    { supplier_id: 2, name: 'Ceylon Agro Grain Mills' },
    { supplier_id: 3, name: 'Highland Dairy Farms' },
    { supplier_id: 4, name: 'Ocean Harvest Seafoods' },
    { supplier_id: 5, name: 'Dilmah Ceylon Tea Estates' },
    { supplier_id: 6, name: 'Colombo Artisan Bakehouse' },
    { supplier_id: 7, name: 'Mediterranean Olive Orchards' },
    { supplier_id: 8, name: 'Ceylon Nut & Spice Exporters' }
  ]);

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
        { id: 0, name: 'All Aisles', icon: 'grid_view', itemCount: rows.reduce((sum, row) => sum + row.active_product_count, 0) },
        ...rows.map(row => ({
          id: row.category_id,
          name: row.name,
          icon: row.icon ?? 'category',
          itemCount: row.active_product_count
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
      next: rows => {
        if (rows && rows.length > 0) {
          this.products.set(rows.map(row => this.toProduct(row)));
        }
      },
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
