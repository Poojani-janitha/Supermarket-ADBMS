import { Injectable, signal } from '@angular/core';
import { InventoryItem, LowStockAlert } from '../models';

@Injectable({
  providedIn: 'root'
})
export class InventoryService {
  readonly branches = [
    { id: 1, name: 'Colombo Central Flagship' },
    { id: 2, name: 'Kandy City Center' },
    { id: 3, name: 'Galle Fort Outlet' },
    { id: 4, name: 'Negombo Coastal Mart' }
  ];

  readonly selectedBranchId = signal<number>(1);

  readonly inventory = signal<InventoryItem[]>([
    {
      branchId: 1,
      branchName: 'Colombo Central Flagship',
      productId: 1,
      productName: 'Tasty Vegetable Salad Healthy Diet',
      sku: 'PROD-SAL-001',
      quantity: 42,
      reorderLevel: 10,
      version: 0,
      isLowStock: false
    },
    {
      branchId: 1,
      branchName: 'Colombo Central Flagship',
      productId: 2,
      productName: 'Original Chess Meat Burger With Chips',
      sku: 'PROD-BGR-002',
      quantity: 30,
      reorderLevel: 10,
      version: 0,
      isLowStock: false
    },
    {
      branchId: 1,
      branchName: 'Colombo Central Flagship',
      productId: 6,
      productName: 'Original Chess Burger With French Fries',
      sku: 'PROD-BGR-006',
      quantity: 8,
      reorderLevel: 15,
      version: 1,
      isLowStock: true
    },
    {
      branchId: 1,
      branchName: 'Colombo Central Flagship',
      productId: 9,
      productName: 'Sri Lankan Keeri Samba Premium Rice 5kg',
      sku: 'PROD-GRO-009',
      quantity: 120,
      reorderLevel: 25,
      version: 0,
      isLowStock: false
    },
    {
      branchId: 2,
      branchName: 'Kandy City Center',
      productId: 2,
      productName: 'Original Chess Meat Burger With Chips',
      sku: 'PROD-BGR-002',
      quantity: 5,
      reorderLevel: 12,
      version: 0,
      isLowStock: true
    }
  ]);

  readonly lowStockAlerts = signal<LowStockAlert[]>([
    {
      alertId: 1,
      branchId: 1,
      branchName: 'Colombo Central Flagship',
      productId: 6,
      productName: 'Original Chess Burger With French Fries',
      quantity: 8,
      createdAt: '2026-10-10 09:30 AM',
      resolved: false
    },
    {
      alertId: 2,
      branchId: 2,
      branchName: 'Kandy City Center',
      productId: 2,
      productName: 'Original Chess Meat Burger With Chips',
      quantity: 5,
      createdAt: '2026-10-10 11:15 AM',
      resolved: false
    }
  ]);

  // Simulates sp_add_stock
  addStock(branchId: number, productId: number, qtyToAdd: number): void {
    this.inventory.update(items =>
      items.map(i => {
        if (i.branchId === branchId && i.productId === productId) {
          const newQty = i.quantity + qtyToAdd;
          return {
            ...i,
            quantity: newQty,
            version: i.version + 1,
            isLowStock: newQty <= i.reorderLevel
          };
        }
        return i;
      })
    );
  }

  // Simulates sp_transfer_stock (atomic inter-branch movement)
  transferStock(fromBranchId: number, toBranchId: number, productId: number, qty: number): boolean {
    const sourceItem = this.inventory().find(i => i.branchId === fromBranchId && i.productId === productId);
    if (!sourceItem || sourceItem.quantity < qty) return false;

    this.inventory.update(items =>
      items.map(i => {
        if (i.productId === productId) {
          if (i.branchId === fromBranchId) {
            const rem = i.quantity - qty;
            return { ...i, quantity: rem, isLowStock: rem <= i.reorderLevel };
          }
          if (i.branchId === toBranchId) {
            const added = i.quantity + qty;
            return { ...i, quantity: added, isLowStock: added <= i.reorderLevel };
          }
        }
        return i;
      })
    );
    return true;
  }
}
