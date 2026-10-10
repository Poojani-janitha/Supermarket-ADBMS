import { Injectable, signal, computed } from '@angular/core';
import { Product, Category } from '../models';

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  // Supermarket Chain Category Aisles
  readonly categories = signal<Category[]>([
    { id: 0, name: 'All Aisles', icon: 'grid_view', itemCount: 284 },
    { id: 1, name: 'Fresh Produce', icon: 'nutrition', itemCount: 48 },
    { id: 2, name: 'Dairy & Chilled', icon: 'egg_alt', itemCount: 32 },
    { id: 3, name: 'Bakery', icon: 'bakery_dining', itemCount: 18 },
    { id: 4, name: 'Beverages', icon: 'local_cafe', itemCount: 26 },
    { id: 5, name: 'Pantry & Grains', icon: 'rice_bowl', itemCount: 44 },
    { id: 6, name: 'Meat & Seafood', icon: 'set_meal', itemCount: 22 },
    { id: 7, name: 'Snacks & Sweets', icon: 'cookie', itemCount: 30 },
    { id: 8, name: 'Household', icon: 'cleaning_services', itemCount: 15 }
  ]);

  readonly selectedCategoryId = signal<number>(0);
  readonly searchQuery = signal<string>('');

  // Supermarket Chain Product Catalog matching our ADBMS database schema
  private readonly initialProducts: Product[] = [
    {
      id: 1,
      name: 'Organic Hass Avocados (Pack of 4)',
      sku: 'PRD-AVO-001',
      unitPrice: 5.99,
      costPrice: 3.50,
      categoryId: 1,
      categoryName: 'Fresh Produce',
      isActive: true,
      imageUrl: 'https://images.unsplash.com/photo-1523049673857-eb18f1d7b578?w=500&auto=format&fit=crop&q=80',
      dietType: 'VEG',
      discountBadge: '15% Off',
      stockQty: 48
    },
    {
      id: 2,
      name: 'Sri Lankan Keeri Samba Rice 5kg Premium Bag',
      sku: 'PAN-RIC-002',
      unitPrice: 14.50,
      costPrice: 9.80,
      categoryId: 5,
      categoryName: 'Pantry & Grains',
      isActive: true,
      imageUrl: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=500&auto=format&fit=crop&q=80',
      dietType: 'VEG',
      stockQty: 120
    },
    {
      id: 3,
      name: 'Farm Fresh Full Cream Pasteurised Milk 1L',
      sku: 'DAI-MLK-003',
      unitPrice: 2.80,
      costPrice: 1.90,
      categoryId: 2,
      categoryName: 'Dairy & Chilled',
      isActive: true,
      imageUrl: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=500&auto=format&fit=crop&q=80',
      dietType: 'VEG',
      stockQty: 65
    },
    {
      id: 4,
      name: 'Fresh Atlantic Salmon Fillet 500g',
      sku: 'SEA-SAL-004',
      unitPrice: 18.99,
      costPrice: 13.00,
      categoryId: 6,
      categoryName: 'Meat & Seafood',
      isActive: true,
      imageUrl: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=500&auto=format&fit=crop&q=80',
      dietType: 'NON_VEG',
      discountBadge: '10% Off',
      stockQty: 22
    },
    {
      id: 5,
      name: 'Ceylon Pure Single Origin Green Tea 200g',
      sku: 'BEV-TEA-005',
      unitPrice: 4.80,
      costPrice: 2.70,
      categoryId: 4,
      categoryName: 'Beverages',
      isActive: true,
      imageUrl: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=500&auto=format&fit=crop&q=80',
      dietType: 'VEG',
      stockQty: 80
    },
    {
      id: 6,
      name: 'Artisan Sourdough Loaf Freshly Baked',
      sku: 'BAK-BRD-006',
      unitPrice: 3.50,
      costPrice: 1.80,
      categoryId: 3,
      categoryName: 'Bakery',
      isActive: true,
      imageUrl: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=500&auto=format&fit=crop&q=80',
      dietType: 'VEG',
      discountBadge: '20% Off',
      stockQty: 30
    },
    {
      id: 7,
      name: 'Extra Virgin Cold Pressed Olive Oil 750ml',
      sku: 'PAN-OIL-007',
      unitPrice: 16.50,
      costPrice: 11.20,
      categoryId: 5,
      categoryName: 'Pantry & Grains',
      isActive: true,
      imageUrl: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=500&auto=format&fit=crop&q=80',
      dietType: 'VEG',
      stockQty: 35
    },
    {
      id: 8,
      name: 'Free-Range Organic Grade-A Brown Eggs (12-pack)',
      sku: 'DAI-EGG-008',
      unitPrice: 4.20,
      costPrice: 2.90,
      categoryId: 2,
      categoryName: 'Dairy & Chilled',
      isActive: true,
      imageUrl: 'https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=500&auto=format&fit=crop&q=80',
      dietType: 'VEG',
      stockQty: 55
    },
    {
      id: 9,
      name: 'Roasted Salted Jumbo Cashew Nuts 250g',
      sku: 'SNK-CSH-009',
      unitPrice: 8.90,
      costPrice: 5.80,
      categoryId: 7,
      categoryName: 'Snacks & Sweets',
      isActive: true,
      imageUrl: 'https://images.unsplash.com/photo-1509358271058-acd22cc93898?w=500&auto=format&fit=crop&q=80',
      dietType: 'VEG',
      discountBadge: '5% Off',
      stockQty: 40
    }
  ];

  readonly products = signal<Product[]>(this.initialProducts);

  readonly filteredProducts = computed(() => {
    const catId = this.selectedCategoryId();
    const query = this.searchQuery().toLowerCase().trim();

    return this.products().filter(p => {
      const matchesCategory = catId === 0 || p.categoryId === catId;
      const matchesQuery = !query ||
        p.name.toLowerCase().includes(query) ||
        p.sku.toLowerCase().includes(query) ||
        p.categoryName.toLowerCase().includes(query);
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
