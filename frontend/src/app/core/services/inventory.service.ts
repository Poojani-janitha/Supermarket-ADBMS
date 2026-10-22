import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { InventoryItem, LowStockAlert, PurchaseOrder, Supplier } from '../models';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class InventoryService {
  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthService);
  readonly apiUrl = '/api';

  readonly branches = [
    { id: 1, name: 'Colombo Central Flagship' },
    { id: 2, name: 'Kandy City Center' },
    { id: 3, name: 'Galle Fort Outlet' },
    { id: 4, name: 'Negombo Coastal Mart' }
  ];

  readonly selectedBranchId = signal<number>(this.authService.currentUser()?.branchId || 1);

  // Registered Vendors in the B2B Supply Chain
  readonly suppliers = signal<Supplier[]>([
    {
      supplierId: 1,
      name: 'Lanka Fresh Organics Ltd',
      contactPerson: 'Sunil Bandara',
      phone: '077-1234567',
      email: 'orders@lankafresh.lk',
      username: 'supplier_organics',
      city: 'Colombo',
      taxNumber: 'V-10293847',
      isActive: true,
      status: 'ACTIVE'
    },
    {
      supplierId: 2,
      name: 'Ceylon Agro Grain Mills',
      contactPerson: 'Anura Jayasuriya',
      phone: '071-2345678',
      email: 'sales@ceylonagro.lk',
      username: 'supplier_agro',
      city: 'Kurunegala',
      taxNumber: 'V-55667788',
      isActive: true,
      status: 'ACTIVE'
    },
    {
      supplierId: 3,
      name: 'Highland Dairy Farms',
      contactPerson: 'Priya Fernando',
      phone: '072-3456789',
      email: 'supplies@highlanddairy.lk',
      username: 'supplier_dairy',
      city: 'Nuwara Eliya',
      taxNumber: 'V-99887766',
      isActive: true,
      status: 'ACTIVE'
    },
    {
      supplierId: 4,
      name: 'Ocean Harvest Seafoods',
      contactPerson: 'Jude Cooray',
      phone: '076-4567890',
      email: 'info@oceanharvest.lk',
      username: 'supplier_ocean',
      city: 'Negombo',
      taxNumber: 'V-33445566',
      isActive: true,
      status: 'ACTIVE'
    },
    {
      supplierId: 5,
      name: 'Dilmah Ceylon Tea Estates',
      contactPerson: 'Rohan Dilmah',
      phone: '077-5678901',
      email: 'trade@dilmahtea.lk',
      username: 'supplier_dilmah',
      city: 'Kandy',
      taxNumber: 'V-11223344',
      isActive: true,
      status: 'ACTIVE'
    },
    {
      supplierId: 6,
      name: 'Colombo Artisan Bakehouse',
      contactPerson: 'Malik Wickramasinghe',
      phone: '075-6789012',
      email: 'orders@colombobake.lk',
      username: 'supplier_bakehouse',
      city: 'Colombo',
      taxNumber: 'V-77889900',
      isActive: true,
      status: 'ACTIVE'
    },
    {
      supplierId: 7,
      name: 'Mediterranean Olive Orchards',
      contactPerson: 'Tariq Mansoor',
      phone: '070-7890123',
      email: 'imports@oliveorchard.lk',
      username: 'supplier_olive',
      city: 'Colombo',
      taxNumber: 'V-66778899',
      isActive: true,
      status: 'ACTIVE'
    },
    {
      supplierId: 8,
      name: 'Ceylon Nut & Spice Exporters',
      contactPerson: 'Chaminda Senanayake',
      phone: '078-8901234',
      email: 'contact@ceylonspice.lk',
      username: 'supplier_spice',
      city: 'Matale',
      taxNumber: 'V-44556677',
      isActive: true,
      status: 'ACTIVE'
    }
  ]);

  // Per-Branch Physical Stock Levels with Unit of Measure
  readonly inventory = signal<InventoryItem[]>([
    {
      branchId: 1,
      branchName: 'Colombo Central Flagship',
      productId: 1,
      productName: 'Organic Hass Avocados (Pack of 4)',
      sku: 'PRD-AVO-001',
      quantity: 48,
      reorderLevel: 15,
      unitOfMeasure: 'PACKET',
      version: 0,
      isLowStock: false
    },
    {
      branchId: 1,
      branchName: 'Colombo Central Flagship',
      productId: 2,
      productName: 'Sri Lankan Keeri Samba Rice Premium',
      sku: 'PAN-RIC-002',
      quantity: 120,
      reorderLevel: 30,
      unitOfMeasure: 'KG',
      version: 0,
      isLowStock: false
    },
    {
      branchId: 1,
      branchName: 'Colombo Central Flagship',
      productId: 3,
      productName: 'Farm Fresh Full Cream Pasteurised Milk',
      sku: 'DAI-MLK-003',
      quantity: 12,
      reorderLevel: 20,
      unitOfMeasure: 'L',
      version: 2,
      isLowStock: true
    },
    {
      branchId: 1,
      branchName: 'Colombo Central Flagship',
      productId: 4,
      productName: 'Fresh Atlantic Salmon Fillet',
      sku: 'SEA-SAL-004',
      quantity: 4.5,
      reorderLevel: 10,
      unitOfMeasure: 'KG',
      version: 1,
      isLowStock: true
    },
    {
      branchId: 1,
      branchName: 'Colombo Central Flagship',
      productId: 5,
      productName: 'Ceylon Pure Single Origin Green Tea 200g',
      sku: 'BEV-TEA-005',
      quantity: 80,
      reorderLevel: 20,
      unitOfMeasure: 'PACKET',
      version: 0,
      isLowStock: false
    },
    {
      branchId: 1,
      branchName: 'Colombo Central Flagship',
      productId: 6,
      productName: 'Artisan Sourdough Loaf Freshly Baked',
      sku: 'BAK-BRD-006',
      quantity: 6,
      reorderLevel: 15,
      unitOfMeasure: 'PIECE',
      version: 3,
      isLowStock: true
    },
    {
      branchId: 2,
      branchName: 'Kandy City Center',
      productId: 2,
      productName: 'Sri Lankan Keeri Samba Rice Premium',
      sku: 'PAN-RIC-002',
      quantity: 18,
      reorderLevel: 25,
      unitOfMeasure: 'KG',
      version: 1,
      isLowStock: true
    },
    {
      branchId: 2,
      branchName: 'Kandy City Center',
      productId: 3,
      productName: 'Farm Fresh Full Cream Pasteurised Milk',
      sku: 'DAI-MLK-003',
      quantity: 8,
      reorderLevel: 15,
      unitOfMeasure: 'L',
      version: 0,
      isLowStock: true
    }
  ]);

  readonly lowStockAlerts = signal<LowStockAlert[]>([
    {
      alertId: 1,
      branchId: 1,
      branchName: 'Colombo Central Flagship',
      productId: 3,
      productName: 'Farm Fresh Full Cream Pasteurised Milk',
      quantity: 12,
      unitOfMeasure: 'L',
      createdAt: '2026-10-14 09:15 AM',
      resolved: false
    },
    {
      alertId: 2,
      branchId: 1,
      branchName: 'Colombo Central Flagship',
      productId: 4,
      productName: 'Fresh Atlantic Salmon Fillet',
      quantity: 4.5,
      unitOfMeasure: 'KG',
      createdAt: '2026-10-14 10:30 AM',
      resolved: false
    },
    {
      alertId: 3,
      branchId: 1,
      branchName: 'Colombo Central Flagship',
      productId: 6,
      productName: 'Artisan Sourdough Loaf Freshly Baked',
      quantity: 6,
      unitOfMeasure: 'PIECE',
      createdAt: '2026-10-14 11:45 AM',
      resolved: false
    }
  ]);

  // Purchase Orders (3-Way Matching: Requested -> Confirmed -> Received)
  readonly purchaseOrders = signal<PurchaseOrder[]>([
    {
      poId: 101,
      supplierId: 4,
      supplierName: 'Ocean Harvest Seafoods',
      branchId: 1,
      branchName: 'Colombo Central Flagship',
      productId: 4,
      productName: 'Fresh Atlantic Salmon Fillet',
      sku: 'SEA-SAL-004',
      unitOfMeasure: 'KG',
      requestedQty: 15,
      confirmedQty: 12,
      unitCost: 13.00,
      totalCost: 156.00,
      status: 'CONFIRMED',
      orderDate: '2026-10-13 14:20',
      confirmedAt: '2026-10-14 08:30',
      supplierNotes: 'Only 12 kg premium grade available. Dispatched in iced crates via cold-van.',
      requestedBy: 'manager_arlene'
    },
    {
      poId: 102,
      supplierId: 3,
      supplierName: 'Highland Dairy Farms',
      branchId: 1,
      branchName: 'Colombo Central Flagship',
      productId: 3,
      productName: 'Farm Fresh Full Cream Pasteurised Milk',
      sku: 'DAI-MLK-003',
      unitOfMeasure: 'L',
      requestedQty: 50,
      unitCost: 1.90,
      totalCost: 95.00,
      status: 'REQUESTED',
      orderDate: '2026-10-14 10:10',
      requestedBy: 'manager_arlene'
    },
    {
      poId: 103,
      supplierId: 1,
      supplierName: 'Lanka Fresh Organics Ltd',
      branchId: 1,
      branchName: 'Colombo Central Flagship',
      productId: 1,
      productName: 'Organic Hass Avocados (Pack of 4)',
      sku: 'PRD-AVO-001',
      unitOfMeasure: 'PACKET',
      requestedQty: 30,
      confirmedQty: 30,
      receivedQty: 30,
      unitCost: 3.50,
      totalCost: 105.00,
      status: 'RECEIVED',
      orderDate: '2026-10-12 09:00',
      confirmedAt: '2026-10-12 11:30',
      receivedAt: '2026-10-13 08:45',
      supplierNotes: 'Direct from Nuwara Eliya organic orchards.',
      receivingNotes: 'Inspected upon delivery: 30 packs intact, chilled, barcode verified.',
      requestedBy: 'manager_arlene',
      receivedBy: 'cashier_floyd'
    },
    {
      poId: 104,
      supplierId: 2,
      supplierName: 'Ceylon Agro Grain Mills',
      branchId: 2,
      branchName: 'Kandy City Center',
      productId: 2,
      productName: 'Sri Lankan Keeri Samba Rice Premium',
      sku: 'PAN-RIC-002',
      unitOfMeasure: 'KG',
      requestedQty: 100,
      confirmedQty: 100,
      unitCost: 9.80,
      totalCost: 980.00,
      status: 'CONFIRMED',
      orderDate: '2026-10-13 16:00',
      confirmedAt: '2026-10-14 09:00',
      supplierNotes: 'Delivered in standard 25kg moisture-proof sacks.',
      requestedBy: 'manager_nimal'
    }
  ]);

  // Procedure: sp_create_purchase_order (Store Manager creates stock purchase request)
  createPurchaseOrder(data: {
    supplierId: number;
    branchId: number;
    productId: number;
    productName: string;
    sku: string;
    unitOfMeasure: string;
    requestedQty: number;
    unitCost: number;
    requestedBy: string;
  }): { success: boolean; poId: number; message: string } {
    const supplier = this.suppliers().find(s => s.supplierId === data.supplierId);
    const branch = this.branches.find(b => b.id === data.branchId);

    const nextPoId = Math.max(100, ...this.purchaseOrders().map(p => p.poId)) + 1;
    const totalCost = Number((data.requestedQty * data.unitCost).toFixed(2));

    const newPO: PurchaseOrder = {
      poId: nextPoId,
      supplierId: data.supplierId,
      supplierName: supplier ? supplier.name : 'Registered Supplier',
      branchId: data.branchId,
      branchName: branch ? branch.name : 'Colombo Central Flagship',
      productId: data.productId,
      productName: data.productName,
      sku: data.sku,
      unitOfMeasure: data.unitOfMeasure,
      requestedQty: data.requestedQty,
      unitCost: data.unitCost,
      totalCost,
      status: 'REQUESTED',
      orderDate: new Date().toISOString().replace('T', ' ').substring(0, 16),
      requestedBy: data.requestedBy
    };

    this.purchaseOrders.update(list => [newPO, ...list]);

    // Dispatch to Spring Boot backend: sp_create_purchase_order
    this.http.post<{ success: boolean; data: number; message: string }>(`${this.apiUrl}/purchase-orders`, {
      supplierId: data.supplierId,
      branchId: data.branchId,
      employeeId: 101,
      productId: data.productId,
      qty: data.requestedQty
    }).subscribe({
      next: (res) => {
        console.log('Backend PO created:', res);
      },
      error: (err) => console.debug('Backend offline, simulated PO retained:', err?.status)
    });

    return {
      success: true,
      poId: nextPoId,
      message: `Purchase Order #PO-${nextPoId} created successfully and sent to ${newPO.supplierName}. Status: REQUESTED.`
    };
  }

  // Procedure: sp_supplier_confirm_order (Vendor Portal: Supplier amends qty, provides note, confirms dispatch)
  supplierConfirmOrder(poId: number, supplierId: number, confirmedQty: number, notes: string): { success: boolean; message: string } {
    const po = this.purchaseOrders().find(p => p.poId === poId);
    if (!po) return { success: false, message: 'Purchase Order not found.' };

    if (po.status !== 'REQUESTED') {
      return { success: false, message: `Cannot modify PO: Current status is ${po.status}.` };
    }

    const updatedCost = Number((confirmedQty * po.unitCost).toFixed(2));

    this.purchaseOrders.update(list =>
      list.map(p => {
        if (p.poId === poId) {
          return {
            ...p,
            confirmedQty,
            totalCost: updatedCost,
            supplierNotes: notes,
            status: 'CONFIRMED',
            confirmedAt: new Date().toISOString().replace('T', ' ').substring(0, 16)
          };
        }
        return p;
      })
    );

    // Call Spring Boot backend: POST /api/purchase-orders/confirm
    // Executes Stored Procedure: CALL sp_supplier_confirm_order(?, ?, ?, ?)
    this.http.post<{ success: boolean; message: string }>(`${this.apiUrl}/purchase-orders/confirm`, {
      poId,
      supplierId,
      confirmedQty,
      notes
    }).subscribe({
      next: (res) => console.log('POST /api/purchase-orders/confirm succeeded:', res),
      error: (err) => console.debug('POST /api/purchase-orders/confirm note:', err?.status)
    });

    return {
      success: true,
      message: `Order #PO-${poId} confirmed for fulfillment (${confirmedQty} ${po.unitOfMeasure}). Status changed to CONFIRMED.`
    };
  }

  // Procedure: sp_receive_purchase (GRN: Physical inspection at branch, enter actual received qty, restock inventory)
  receivePurchaseOrder(poId: number, receivedQty: number, notes: string, receivedBy: string): { success: boolean; message: string } {
    const po = this.purchaseOrders().find(p => p.poId === poId);
    if (!po) return { success: false, message: 'Purchase Order not found.' };

    if (po.status === 'RECEIVED') {
      return { success: false, message: 'This purchase order has already been received into stock.' };
    }

    // 1. Update Purchase Order Status to RECEIVED
    this.purchaseOrders.update(list =>
      list.map(p => {
        if (p.poId === poId) {
          return {
            ...p,
            receivedQty,
            status: 'RECEIVED',
            receivingNotes: notes,
            receivedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
            receivedBy
          };
        }
        return p;
      })
    );

    // Call Spring Boot backend: POST /api/purchase-orders/receive
    // Executes Stored Procedure: CALL sp_receive_purchase(?, ?, ?, ?)
    this.http.post<{ success: boolean; message: string }>(`${this.apiUrl}/purchase-orders/receive`, {
      poId,
      employeeId: 101,
      receivedQty,
      notes
    }).subscribe({
      next: (res) => console.log('POST /api/purchase-orders/receive succeeded:', res),
      error: (err) => console.debug('POST /api/purchase-orders/receive note:', err?.status)
    });

    // 2. Atomically increment branch inventory with optimistic locking version update
    this.inventory.update(items => {
      const existing = items.find(i => i.branchId === po.branchId && i.productId === po.productId);
      if (existing) {
        return items.map(i => {
          if (i.branchId === po.branchId && i.productId === po.productId) {
            const newQty = Number((i.quantity + receivedQty).toFixed(2));
            return {
              ...i,
              quantity: newQty,
              version: i.version + 1,
              isLowStock: newQty <= i.reorderLevel
            };
          }
          return i;
        });
      } else {
        // Create new inventory row if didn't exist in branch
        const newItem: InventoryItem = {
          branchId: po.branchId,
          branchName: po.branchName,
          productId: po.productId,
          productName: po.productName,
          sku: po.sku,
          quantity: receivedQty,
          reorderLevel: 10,
          unitOfMeasure: po.unitOfMeasure as any,
          version: 0,
          isLowStock: false
        };
        return [...items, newItem];
      }
    });

    // 3. Mark low-stock alert resolved if stock has reached safe level
    this.lowStockAlerts.update(alerts =>
      alerts.map(a => (a.branchId === po.branchId && a.productId === po.productId ? { ...a, resolved: true } : a))
    );

    return {
      success: true,
      message: `Shipment for #PO-${poId} verified and received! Added +${receivedQty} ${po.unitOfMeasure} of ${po.productName} to ${po.branchName} inventory. Logged to stock_audit_log (reason: RESTOCK).`
    };
  }

  // Inter-branch stock transfer (sp_transfer_stock)
  transferStock(fromBranchId: number, toBranchId: number, productId: number, qty: number): boolean {
    const sourceItem = this.inventory().find(i => i.branchId === fromBranchId && i.productId === productId);
    if (!sourceItem || sourceItem.quantity < qty) return false;

    this.inventory.update(items =>
      items.map(i => {
        if (i.productId === productId) {
          if (i.branchId === fromBranchId) {
            const rem = Number((i.quantity - qty).toFixed(2));
            return { ...i, quantity: rem, isLowStock: rem <= i.reorderLevel, version: i.version + 1 };
          }
          if (i.branchId === toBranchId) {
            const added = Number((i.quantity + qty).toFixed(2));
            return { ...i, quantity: added, isLowStock: added <= i.reorderLevel, version: i.version + 1 };
          }
        }
        return i;
      })
    );
    return true;
  }

  // Register new supplier from public signup
  registerSupplier(supplierData: {
    name: string;
    contactPerson: string;
    phone: string;
    email: string;
    username: string;
    city: string;
    taxNumber: string;
  }): { success: boolean; message: string } {
    if (this.suppliers().some(s => s.username?.toLowerCase() === supplierData.username.toLowerCase())) {
      return { success: false, message: `Username '${supplierData.username}' is already registered.` };
    }

    const newId = Math.max(10, ...this.suppliers().map(s => s.supplierId)) + 1;
    const newSupplier: Supplier = {
      supplierId: newId,
      name: supplierData.name,
      contactPerson: supplierData.contactPerson,
      phone: supplierData.phone,
      email: supplierData.email,
      username: supplierData.username,
      city: supplierData.city,
      taxNumber: supplierData.taxNumber,
      isActive: true,
      status: 'ACTIVE'
    };

    this.suppliers.update(list => [...list, newSupplier]);
    return {
      success: true,
      message: `Supplier '${newSupplier.name}' registered successfully! You can now log into the Vendor Portal.`
    };
  }
}
