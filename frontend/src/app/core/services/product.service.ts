import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Product, Category } from '../models';

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private readonly http = inject(HttpClient);

  readonly categories = signal<Category[]>([
    { id: 0, name: 'All Aisles', icon: 'grid_view', itemCount: 0 }
  ]);

  readonly selectedCategoryId = signal<number>(0);
  readonly searchQuery = signal<string>('');
  readonly products = signal<Product[]>([]);
  readonly isLoading = signal<boolean>(false);

  constructor() {
    this.loadCategories();
    this.loadProducts();
  }

  loadCategories(): void {
    this.http.get<Category[]>('/api/categories').subscribe({
      next: (cats) => {
        const totalItems = cats.reduce((sum, c) => sum + (c.itemCount || 0), 0);
        this.categories.set([
          { id: 0, name: 'All Aisles', icon: 'grid_view', itemCount: totalItems },
          ...cats
        ]);
      },
      error: (err) => {
        console.warn('Could not fetch categories from database, using empty list:', err);
      }
    });
  }

  loadProducts(): void {
    this.isLoading.set(true);
    this.http.get<Product[]>('/api/products').subscribe({
      next: (prods) => {
        this.products.set(prods);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.warn('Could not fetch products from database:', err);
        this.isLoading.set(false);
      }
    });
  }

  readonly filteredProducts = computed(() => {
    const catId = this.selectedCategoryId();
    const query = this.searchQuery().toLowerCase().trim();

    return this.products().filter(p => {
      const matchesCategory = catId === 0 || p.categoryId === catId;
      const matchesQuery = !query ||
        p.name.toLowerCase().includes(query) ||
        p.sku.toLowerCase().includes(query) ||
        (p.categoryName && p.categoryName.toLowerCase().includes(query));
      return matchesCategory && matchesQuery;
    });
  });

  selectCategory(id: number): void {
    this.selectedCategoryId.set(id);
  }

  setSearchQuery(q: string): void {
    this.searchQuery.set(q);
  }

  updatePrice(productId: number, newPrice: number): void {
    this.products.update(list =>
      list.map(p => (p.id === productId ? { ...p, unitPrice: newPrice } : p))
    );
  }

  decrementStock(productId: number, qty: number): void {
    this.products.update(list =>
      list.map(p => (p.id === productId ? { ...p, stockQty: Math.max(0, p.stockQty - qty) } : p))
    );
  }
}
