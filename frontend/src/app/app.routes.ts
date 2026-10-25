import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { adminRoleGuard, managerRoleGuard } from './core/guards/role.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full'
  },
  {
    path: 'pos',
    loadComponent: () => import('./features/pos/pos.component').then(m => m.PosComponent),
    canActivate: [authGuard]
  },
  {
    path: 'sales-management',
    loadComponent: () => import('./features/sales-management/sales-management.component').then(m => m.SalesManagementComponent),
    canActivate: [authGuard]
  },
  {
    path: 'products',
    loadComponent: () => import('./features/products/pages/product-list/product-list.component').then(m => m.ProductListComponent),
    canActivate: [authGuard]
  },
  {
    path: 'inventory',
    loadComponent: () => import('./features/inventory/pages/inventory-list/inventory-list.component').then(m => m.InventoryListComponent),
    canActivate: [authGuard, managerRoleGuard]
  },
  {
    path: 'purchase-orders',
    loadComponent: () => import('./features/purchase-orders/pages/purchase-orders/purchase-orders.component').then(m => m.PurchaseOrdersComponent),
    canActivate: [authGuard, managerRoleGuard]
  },
  {
    path: 'orders',
    loadComponent: () => import('./features/supplier-portal/pages/supplier-portal/supplier-portal.component').then(m => m.SupplierPortalComponent),
    canActivate: [authGuard]
  },
  {
    path: 'supplier-portal',
    redirectTo: 'orders',
    pathMatch: 'full'
  },
  {
    path: 'customers',
    loadComponent: () => import('./features/customers/pages/customer-list/customer-list.component').then(m => m.CustomerListComponent),
    canActivate: [authGuard]
  },
  {
    path: 'discounts',
    loadComponent: () => import('./features/discounts/pages/discount-list/discount-list.component').then(m => m.DiscountListComponent),
    canActivate: [authGuard]
  },
  {
    path: 'reports',
    loadComponent: () => import('./features/reports/pages/reports-dashboard/reports-dashboard.component').then(m => m.ReportsDashboardComponent),
    canActivate: [authGuard, managerRoleGuard]
  },
  {
    path: 'admin',
    loadComponent: () => import('./features/admin/pages/admin-dashboard/admin-dashboard.component').then(m => m.AdminDashboardComponent),
    canActivate: [authGuard, adminRoleGuard]
  },
  {
    path: 'admin/backups',
    loadComponent: () => import('./features/backups/pages/database-backups-page/database-backups-page.component').then(m => m.DatabaseBackupsPage),
    canActivate: [authGuard, adminRoleGuard]
  },
  {
    path: 'backup-recovery',
    redirectTo: 'admin/backups',
    pathMatch: 'full'
  },
  {
    path: 'backup',
    redirectTo: 'admin/backups',
    pathMatch: 'full'
  },
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: '**',
    redirectTo: 'login'
  }
];
