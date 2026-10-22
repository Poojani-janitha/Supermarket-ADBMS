import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'pos',
    pathMatch: 'full'
  },
  {
    path: 'pos',
    loadComponent: () => import('./features/pos/pos.component').then(m => m.PosComponent)
  },
  {
    path: 'sales-management',
    loadComponent: () => import('./features/sales-management/sales-management.component').then(m => m.SalesManagementComponent)
  },
  {
    path: 'products',
    loadComponent: () => import('./features/products/pages/product-list/product-list.component').then(m => m.ProductListComponent)
  },
  {
    path: 'inventory',
    loadComponent: () => import('./features/inventory/pages/inventory-list/inventory-list.component').then(m => m.InventoryListComponent)
  },
  {
    path: 'purchase-orders',
    loadComponent: () => import('./features/purchase-orders/pages/purchase-orders/purchase-orders.component').then(m => m.PurchaseOrdersComponent)
  },
  {
    path: 'orders',
    loadComponent: () => import('./features/supplier-portal/pages/supplier-portal/supplier-portal.component').then(m => m.SupplierPortalComponent)
  },
  {
    path: 'supplier-portal',
    redirectTo: 'orders',
    pathMatch: 'full'
  },
  {
    path: 'customers',
    loadComponent: () => import('./features/customers/pages/customer-list/customer-list.component').then(m => m.CustomerListComponent)
  },
  {
    path: 'discounts',
    loadComponent: () => import('./features/discounts/pages/discount-list/discount-list.component').then(m => m.DiscountListComponent)
  },
  {
    path: 'reports',
    loadComponent: () => import('./features/reports/pages/reports-dashboard/reports-dashboard.component').then(m => m.ReportsDashboardComponent)
  },
  {
    path: 'admin',
    loadComponent: () => import('./features/admin/pages/admin-dashboard/admin-dashboard.component').then(m => m.AdminDashboardComponent)
  },
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: '**',
    redirectTo: 'pos'
  }
];
