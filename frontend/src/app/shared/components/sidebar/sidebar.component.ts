import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { InventoryService } from '../../../core/services/inventory.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <aside class="sidebar-container">
      <!-- Top Brand Logo -->
      <div class="brand-header">
        <div class="brand-logo-circle">
          <span class="material-symbols-outlined logo-icon">storefront</span>
        </div>
        <div class="brand-text">
          <span class="brand-name">EMERALD POS</span>
          <span class="brand-tag">ADBMS SUPERMARKET CHAIN</span>
        </div>
      </div>

      <!-- Navigation Menu -->
      <nav class="nav-menu">
        @if (authService.isSupplier()) {
          <!-- Supplier Dedicated Links: My Orders ONLY -->
          <a routerLink="/orders" routerLinkActive="active" class="nav-item">
            <span class="material-symbols-outlined nav-icon">local_shipping</span>
            <span class="nav-label">My Orders</span>
          </a>
        } @else {
          <!-- Internal Supermarket Staff Links -->
          <a routerLink="/pos" routerLinkActive="active" class="nav-item">
            <span class="material-symbols-outlined nav-icon">point_of_sale</span>
            <span class="nav-label">POS / Checkout</span>
          </a>

          <a routerLink="/sales-management" routerLinkActive="active" class="nav-item">
            <span class="material-symbols-outlined nav-icon">receipt_long</span>
            <span class="nav-label">Sales Management</span>
          </a>

          <a routerLink="/products" routerLinkActive="active" class="nav-item">
            <span class="material-symbols-outlined nav-icon">inventory_2</span>
            <span class="nav-label">Product Catalog</span>
          </a>

          <a routerLink="/inventory" (click)="onNavClick($event, 'inventory', 'INVENTORY_ACCESS', '/inventory', 'Branch Inventory')" routerLinkActive="active" class="nav-item">
            <span class="material-symbols-outlined nav-icon">warehouse</span>
            <span class="nav-label">Branch Inventory</span>
            @if (authService.isCashier()) {
              <span class="lock-indicator" title="Restricted to Managers & Admins">
                <span class="material-symbols-outlined lock-icon">lock</span>
              </span>
            }
          </a>

          <a routerLink="/purchase-orders" (click)="onNavClick($event, 'purchase_order', 'PURCHASE_ORDERS_ACCESS', '/purchase-orders', 'Purchase Orders')" routerLinkActive="active" class="nav-item">
            <span class="material-symbols-outlined nav-icon">receipt_long</span>
            <span class="nav-label">Purchase Orders</span>
            @if (authService.isCashier()) {
              <span class="lock-indicator" title="Restricted to Managers & Admins">
                <span class="material-symbols-outlined lock-icon">lock</span>
              </span>
            }
          </a>

          <a routerLink="/customers" routerLinkActive="active" class="nav-item">
            <span class="material-symbols-outlined nav-icon">groups</span>
            <span class="nav-label">Customer Loyalty</span>
          </a>

          <a routerLink="/discounts" routerLinkActive="active" class="nav-item">
            <span class="material-symbols-outlined nav-icon">percent</span>
            <span class="nav-label">Discount Engine</span>
          </a>

          <a routerLink="/reports" (click)="onNavClick($event, 'v_daily_sales', 'REPORTS_ANALYTICS_ACCESS', '/reports', 'Reports & Analytics')" routerLinkActive="active" class="nav-item">
            <span class="material-symbols-outlined nav-icon">analytics</span>
            <span class="nav-label">Reports & Analytics</span>
            @if (authService.isCashier()) {
              <span class="lock-indicator" title="Restricted to Managers & Admins">
                <span class="material-symbols-outlined lock-icon">lock</span>
              </span>
            }
          </a>

          @if (authService.isAdmin()) {
            <a routerLink="/admin" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: true }" class="nav-item">
              <span class="material-symbols-outlined nav-icon">admin_panel_settings</span>
              <span class="nav-label">Security</span>
            </a>
            <a routerLink="/admin/backups" routerLinkActive="active" class="nav-item nav-item-backups">
              <span class="material-symbols-outlined nav-icon">settings_backup_restore</span>
              <span class="nav-label">Database Backups & DR</span>
            </a>
          }
        }
      </nav>

      <!-- Bottom Staff & Role Switcher -->
      <div class="sidebar-footer">
        @if (!authService.isSupplier()) {
          <div class="branch-pill" [title]="currentBranchName()">
            <span class="material-symbols-outlined branch-icon">store</span>
            <span class="branch-text">{{ currentBranchName() }}</span>
          </div>
        }

        <div class="staff-card active-staff" title="Active Session">
          <div class="avatar-circle">
            {{ authService.currentUser().fullName.substring(0, 2).toUpperCase() }}
          </div>
          <div class="staff-info">
            <span class="staff-name">{{ authService.currentUser().fullName }}</span>
            <span class="staff-role">{{ authService.currentUser().role }}_ROLE</span>
          </div>
        </div>

        <div class="footer-links-row">
          <button type="button" class="logout-btn" (click)="signOut()" title="Sign Out & Return to Login">
            <span class="material-symbols-outlined logout-icon">logout</span>
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </aside>
  `,
  styles: [`
    .sidebar-container {
      width: 245px;
      height: 100vh;
      background: #ffffff;
      border-right: 1px solid var(--border-subtle);
      display: flex;
      flex-direction: column;
      padding: 14px 12px;
      position: sticky;
      top: 0;
      flex-shrink: 0;
      box-sizing: border-box;
      overflow: hidden;
    }

    .brand-header {
      display: flex;
      align-items: center;
      gap: 10px;
      padding-bottom: 12px;
      border-bottom: 1px solid #f1f3f5;
      margin-bottom: 10px;
      flex-shrink: 0;
    }

    .brand-logo-circle {
      width: 40px;
      height: 40px;
      border-radius: 10px;
      background: var(--primary-green);
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 12px rgba(6, 95, 70, 0.25);
      flex-shrink: 0;
    }

    .logo-icon {
      color: #ffffff;
      font-size: 22px;
    }

    .brand-text {
      display: flex;
      flex-direction: column;
    }

    .brand-name {
      font-size: 1.05rem;
      font-weight: 800;
      letter-spacing: -0.3px;
      color: var(--primary-green-dark);
      line-height: 1.2;
    }

    .brand-tag {
      font-size: 0.60rem;
      font-weight: 700;
      color: var(--primary-green);
      letter-spacing: 0.5px;
    }

    .nav-menu {
      display: flex;
      flex-direction: column;
      gap: 3px;
      flex: 1;
      min-height: 0;
      overflow-y: auto;
      overflow-x: hidden;
      padding-right: 2px;
      scrollbar-width: thin;
      scrollbar-color: #cbd5e1 transparent;

      &::-webkit-scrollbar {
        width: 4px;
      }
      &::-webkit-scrollbar-track {
        background: transparent;
      }
      &::-webkit-scrollbar-thumb {
        background: #cbd5e1;
        border-radius: 4px;
      }
      &::-webkit-scrollbar-thumb:hover {
        background: #94a3b8;
      }
    }

    .nav-item {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 7px 12px;
      border-radius: var(--radius-pill);
      color: var(--text-secondary);
      text-decoration: none;
      font-weight: 600;
      font-size: 0.86rem;
      transition: all 0.2s ease;
      flex-shrink: 0;
    }

    .nav-icon {
      font-size: 20px;
      color: #64748b;
      transition: color 0.2s ease;
      flex-shrink: 0;
    }

    .nav-item:hover {
      background: var(--primary-green-subtle);
      color: var(--primary-green);
    }

    .nav-item:hover .nav-icon {
      color: var(--primary-green);
    }

    .nav-item.active {
      background: var(--primary-green);
      color: #ffffff;
      box-shadow: 0 4px 12px rgba(6, 95, 70, 0.28);
    }

    .nav-item.active .nav-icon {
      color: #ffffff;
    }

    /* Requirement 1: Database Backups & DR active-state styling */
    .nav-item-backups.active {
      background: #ecfdf5 !important; /* emerald-50 */
      color: #047857 !important; /* emerald-700 */
      border-left: 4px solid #059669; /* emerald-600 */
      border-radius: 0 var(--radius-pill) var(--radius-pill) 0;
      box-shadow: 0 1px 3px rgba(5, 150, 105, 0.12);
    }

    .nav-item-backups.active .nav-icon {
      color: #047857 !important; /* emerald-700 */
    }

    .sidebar-footer {
      display: flex;
      flex-direction: column;
      gap: 6px;
      padding-top: 10px;
      margin-top: auto;
      border-top: 1px solid #f1f3f5;
      flex-shrink: 0;
    }

    .branch-pill {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 5px 10px;
      background: #ecfdf5;
      color: #065f46;
      border: 1px solid #a7f3d0;
      border-radius: 20px;
      font-weight: 700;
      font-size: 0.78rem;
      box-sizing: border-box;

      .branch-icon {
        font-size: 16px;
        color: #065f46;
        flex-shrink: 0;
      }

      .branch-text {
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
    }

    .staff-card {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 6px 10px;
      border-radius: var(--radius-pill);
      background: #f8fafc;
      border: 1px solid #edf0f3;
      cursor: pointer;
      transition: all 0.2s ease;
      position: relative;
    }

    .staff-card:hover {
      border-color: var(--primary-green);
      background: var(--primary-green-subtle);
    }

    .staff-card.active-staff {
      background: var(--primary-green-light);
      border-color: var(--primary-green-border);
    }

    .avatar-circle {
      width: 30px;
      height: 30px;
      border-radius: 50%;
      background: var(--primary-green);
      color: #ffffff;
      font-size: 0.74rem;
      font-weight: 700;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .avatar-circle.secondary {
      background: #e2e8f0;
      color: #334155;
    }

    .staff-info {
      display: flex;
      flex-direction: column;
      line-height: 1.2;
      flex: 1;
      min-width: 0;
    }

    .staff-name {
      font-size: 0.80rem;
      font-weight: 700;
      color: var(--text-main);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .staff-role {
      font-size: 0.68rem;
      color: var(--text-muted);
      font-weight: 600;
    }

    .mini-logout-btn {
      background: transparent;
      border: none;
      padding: 4px;
      border-radius: 6px;
      color: #94a3b8;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s ease;
      flex-shrink: 0;

      .material-symbols-outlined {
        font-size: 18px;
      }

      &:hover {
        color: #ef4444;
        background: #fee2e2;
      }
    }

    .logout-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      padding: 7px 12px;
      color: #64748b;
      font-weight: 700;
      font-size: 0.82rem;
      cursor: pointer;
      border-radius: var(--radius-pill);
      transition: all 0.2s ease;
      width: 100%;

      &:hover {
        color: #dc2626;
        border-color: #fca5a5;
        background: #fef2f2;
      }
    }

    .lock-indicator {
      margin-left: auto;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      color: #94a3b8;
      background: #f1f5f9;
      padding: 2px;
      border-radius: 4px;
      transition: all 0.2s ease;
    }

    .lock-icon {
      font-size: 14px;
    }

    .nav-item:hover .lock-indicator {
      color: #dc2626;
      background: #fee2e2;
    }

    .logout-icon {
      font-size: 18px;
    }

    .footer-links-row {
      display: flex;
      align-items: center;
      width: 100%;
    }
  `]
})
export class SidebarComponent {
  readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  readonly inventoryService = inject(InventoryService);

  readonly currentBranchName = computed(() => {
    const user = this.authService.currentUser();
    const branch = this.inventoryService.branches.find(b => b.id === (user.branchId || this.inventoryService.selectedBranchId()));
    return branch ? branch.name : (user.branchName || 'Colombo Central Flagship');
  });

  onNavClick(event: MouseEvent, targetObject: string, action: string, path: string, label: string): void {
    if ((path === '/inventory' || path === '/purchase-orders' || path === '/reports') && !this.authService.isManager()) {
      event.preventDefault();
      event.stopPropagation();
      this.authService.triggerSecurityAlert(
        targetObject,
        'MANAGEMENT_ACCESS',
        `Restricted Action: Your role '${this.authService.currentUser().role}' is restricted from accessing '${label}'. Store Manager or Administrator role required.`
      );
    }
  }

  signOut(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}

