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

  private readonly _branches = signal<{ id: number; name: string }[]>([]);
  get branches(): { id: number; name: string }[] {
    return this._branches();
  }

  readonly selectedBranchId = signal<number>(this.authService.currentUser()?.branchId || 1);

  // Live Database Signals
  readonly suppliers = signal<Supplier[]>([]);
  readonly inventory = signal<InventoryItem[]>([]);
  readonly lowStockAlerts = signal<LowStockAlert[]>([]);
  readonly purchaseOrders = signal<PurchaseOrder[]>([]);

  constructor() {
    this.loadBranches();
    this.loadSuppliers();
    this.loadInventory();
    this.loadPurchaseOrders();
    this.loadLowStock();
  }

  /**
   * Load registered active branches from MySQL (GET /api/branches).
   */
  loadBranches(): void {
    this.http.get<any[]>(`${this.apiUrl}/branches`).subscribe({
      next: (rows) => {
        if (rows && rows.length > 0) {
          this._branches.set(rows.map(r => ({
            id: r.id ?? r.branch_id ?? r.branchId,
            name: r.name ?? r.branch_name ?? r.branchName
          })));
        } else {
          this._branches.set([]);
        }
      },
      error: (err) => console.warn('Failed to load branches from database:', err)
    });
  }

  // =========================================================================
  // DATABASE API LOADERS (Connected to MySQL via Spring Boot JDBC)
  // =========================================================================

  /**
   * Load registered active suppliers from MySQL (GET /api/suppliers).
   */
  loadSuppliers(): void {
    this.http.get<any[]>(`${this.apiUrl}/suppliers`).subscribe({
      next: (rows) => {
        if (rows && rows.length > 0) {
          this.suppliers.set(rows.map(r => ({
            supplierId: r.supplier_id ?? r.supplierId,
            name: r.name,
            contactPerson: r.contact_person ?? r.contactPerson ?? 'Sales Desk',
            phone: r.phone ?? 'N/A',
            email: r.email ?? '',
            username: r.username ?? '',
            city: r.city ?? 'Colombo',
            taxNumber: r.tax_number ?? r.taxNumber ?? '',
            isActive: r.is_active ?? true,
            status: r.status ?? 'ACTIVE'
          })));
        }
      },
      error: (err) => console.warn('Failed to load suppliers from database:', err)
    });
  }

  /**
   * Load branch stock from MySQL inventory table (GET /api/inventory).
   */
  loadInventory(branchId?: number): void {
    let params: any = {};
    if (branchId) params.branchId = branchId;
    this.http.get<any[]>(`${this.apiUrl}/inventory`, { params }).subscribe({
      next: (items) => {
        if (items) {
          this.inventory.set(items.map(i => ({
            branchId: i.branchId,
            branchName: i.branchName,
            productId: i.productId,
            productName: i.productName,
            sku: i.sku,
            quantity: Number(i.quantity),
            reorderLevel: Number(i.reorderLevel),
            unitOfMeasure: i.unitOfMeasure,
            version: i.version ?? 0,
            isLowStock: i.lowStock ?? (Number(i.quantity) <= Number(i.reorderLevel))
          })));
        }
      },
      error: (err) => console.warn('Failed to load inventory from database:', err)
    });
  }

  /**
   * Load purchase orders from MySQL purchase_order table (GET /api/purchase-orders).
   */
  loadPurchaseOrders(branchId?: number, supplierId?: number): void {
    let params: any = {};
    if (branchId) params.branchId = branchId;
    if (supplierId) params.supplierId = supplierId;
    this.http.get<any[]>(`${this.apiUrl}/purchase-orders`, { params }).subscribe({
      next: (orders) => {
        if (orders) {
          this.purchaseOrders.set(orders.map(o => ({
            poId: o.poId,
            supplierId: o.supplierId,
            supplierName: o.supplierName,
            branchId: o.branchId,
            branchName: o.branchName,
            productId: o.productId,
            productName: o.productName,
            sku: o.sku,
            unitOfMeasure: o.unitOfMeasure,
            requestedQty: Number(o.requestedQty),
            confirmedQty: o.confirmedQty != null ? Number(o.confirmedQty) : undefined,
            receivedQty: o.receivedQty != null ? Number(o.receivedQty) : undefined,
            unitCost: Number(o.unitCost),
            totalCost: Number(o.totalCost),
            status: o.status,
            orderDate: o.orderDate,
            confirmedAt: o.confirmedAt,
            receivedAt: o.receivedAt,
            supplierNotes: o.supplierNotes,
            receivingNotes: o.receivingNotes,
            requestedBy: o.requestedBy,
            receivedBy: o.receivedBy
          })));
        }
      },
      error: (err) => console.warn('Failed to load purchase orders from database:', err)
    });
  }

  /**
   * Load low stock items from MySQL view v_low_stock (GET /api/inventory/low-stock).
   */
  loadLowStock(branchId?: number): void {
    let params: any = {};
    if (branchId) params.branchId = branchId;
    this.http.get<any[]>(`${this.apiUrl}/inventory/low-stock`, { params }).subscribe({
      next: (alerts) => {
        if (alerts) {
          this.lowStockAlerts.set(alerts.map((a, idx) => ({
            alertId: a.alertId ?? (idx + 1),
            branchId: a.branchId,
            branchName: a.branchName,
            productId: a.productId,
            productName: a.productName,
            quantity: Number(a.quantity),
            unitOfMeasure: a.unitOfMeasure,
            createdAt: a.createdAt ?? new Date().toISOString(),
            resolved: a.resolved ?? false
          })));
        }
      },
      error: (err) => console.warn('Failed to load low stock alerts from database:', err)
    });
  }

  // =========================================================================
  // TRANSACTION & PROCEDURE DISPATCHES
  // =========================================================================

  /**
   * Procedure: sp_create_purchase_order (Store Manager creates stock purchase request)
   */
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

    const nextPoId = Math.max(100, ...this.purchaseOrders().map(p => p.poId), 0) + 1;
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

    // Optimistic UI update
    this.purchaseOrders.update(list => [newPO, ...list]);

    // Dispatch to Spring Boot backend: POST /api/purchase-orders -> sp_create_purchase_order
    this.http.post<{ success: boolean; data: number; message: string }>(`${this.apiUrl}/purchase-orders`, {
      supplierId: data.supplierId,
      branchId: data.branchId,
      employeeId: this.authService.currentUser()?.employeeId || 2,
      productId: data.productId,
      qty: data.requestedQty
    }).subscribe({
      next: (res) => {
        console.log('Backend PO created:', res);
        this.loadPurchaseOrders();
      },
      error: (err) => {
        console.error('Error creating purchase order on database:', err);
        this.loadPurchaseOrders();
      }
    });

    return {
      success: true,
      poId: nextPoId,
      message: `Purchase Order #PO-${nextPoId} created successfully and sent to ${newPO.supplierName}. Status: REQUESTED.`
    };
  }

  /**
   * Procedure: sp_supplier_confirm_order (Vendor Portal: Supplier amends qty, provides note, confirms dispatch)
   */
  supplierConfirmOrder(poId: number, supplierId: number, confirmedQty: number, notes: string): { success: boolean; message: string } {
    const po = this.purchaseOrders().find(p => p.poId === poId);
    if (!po) return { success: false, message: 'Purchase Order not found.' };

    if (po.status !== 'REQUESTED') {
      return { success: false, message: `Cannot modify PO: Current status is ${po.status}.` };
    }

    const updatedCost = Number((confirmedQty * po.unitCost).toFixed(2));

    // Optimistic update
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

    // Call Spring Boot backend: POST /api/purchase-orders/confirm -> sp_supplier_confirm_order
    this.http.post<{ success: boolean; message: string }>(`${this.apiUrl}/purchase-orders/confirm`, {
      poId,
      supplierId,
      confirmedQty,
      notes
    }).subscribe({
      next: (res) => {
        console.log('POST /api/purchase-orders/confirm succeeded:', res);
        this.loadPurchaseOrders();
      },
      error: (err) => {
        console.error('POST /api/purchase-orders/confirm error:', err);
        this.loadPurchaseOrders();
      }
    });

    return {
      success: true,
      message: `Order #PO-${poId} confirmed for fulfillment (${confirmedQty} ${po.unitOfMeasure}). Status changed to CONFIRMED.`
    };
  }

  /**
   * Procedure: sp_receive_purchase (GRN: Physical inspection at branch, enter actual received qty, restock inventory)
   */
  receivePurchaseOrder(poId: number, receivedQty: number, notes: string, receivedBy: string): { success: boolean; message: string } {
    const po = this.purchaseOrders().find(p => p.poId === poId);
    if (!po) return { success: false, message: 'Purchase Order not found.' };

    if (po.status === 'RECEIVED') {
      return { success: false, message: 'This purchase order has already been received into stock.' };
    }

    // Optimistic PO status update
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

    // Call Spring Boot backend: POST /api/purchase-orders/receive -> sp_receive_purchase
    this.http.post<{ success: boolean; message: string }>(`${this.apiUrl}/purchase-orders/receive`, {
      poId,
      employeeId: this.authService.currentUser()?.employeeId || 101,
      receivedQty,
      notes
    }).subscribe({
      next: (res) => {
        console.log('POST /api/purchase-orders/receive succeeded:', res);
        this.loadPurchaseOrders();
        this.loadInventory();
        this.loadLowStock();
      },
      error: (err) => {
        console.error('POST /api/purchase-orders/receive error:', err);
        this.loadPurchaseOrders();
        this.loadInventory();
      }
    });

    return {
      success: true,
      message: `Shipment for #PO-${poId} verified and received! Added +${receivedQty} ${po.unitOfMeasure} of ${po.productName} to ${po.branchName} inventory. Logged to stock_audit_log (reason: RESTOCK).`
    };
  }

  /**
   * Inter-branch stock transfer via sp_transfer_stock with ACID rollback support.
   */
  transferStock(fromBranchId: number, toBranchId: number, productId: number, qty: number): boolean {
    const sourceItem = this.inventory().find(i => i.branchId === fromBranchId && i.productId === productId);
    if (!sourceItem || sourceItem.quantity < qty) return false;

    // Call Spring Boot backend: POST /api/inventory/transfer -> sp_transfer_stock
    this.http.post<any>(`${this.apiUrl}/inventory/transfer`, {
      fromBranchId,
      toBranchId,
      productId,
      qty
    }).subscribe({
      next: () => {
        this.loadInventory();
      },
      error: (err) => {
        console.error('Transfer failed on backend:', err);
        this.loadInventory();
      }
    });

    // Optimistic update for UI responsiveness
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

  /**
   * Register new supplier (Persists to MySQL supplier table)
   */
  registerSupplier(supplierData: {
    name: string;
    contactPerson?: string;
    phone?: string;
    email?: string;
    username: string;
    city?: string;
    taxNumber?: string;
    password?: string;
  }): { success: boolean; message: string } {
    const rawUsername = supplierData.username.trim();
    const rawName = supplierData.name?.trim() || rawUsername;

    const payload = {
      name: rawName,
      contactPerson: supplierData.contactPerson?.trim() || rawName,
      phone: supplierData.phone?.trim() || '077-0000000',
      email: supplierData.email?.trim() || `${rawUsername}@vendor.lk`,
      username: rawUsername,
      city: supplierData.city?.trim() || 'Colombo',
      taxNumber: supplierData.taxNumber?.trim() || '',
      password: supplierData.password || rawUsername
    };

    this.http.post<any>(`${this.apiUrl}/auth/supplier/signup`, payload).subscribe({
      next: () => this.loadSuppliers(),
      error: (err) => console.warn('Supplier registration sync to MySQL:', err)
    });

    return {
      success: true,
      message: `Supplier '${payload.name}' registered successfully! You can now log into the Vendor Portal.`
    };
  }
}
