import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

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
          <!-- Supplier Dedicated Links -->
          <a routerLink="/supplier-portal" routerLinkActive="active" class="nav-item">
            <span class="material-symbols-outlined nav-icon">local_shipping</span>
            <span class="nav-label">Vendor Portal</span>
          </a>
          <a routerLink="/products" routerLinkActive="active" class="nav-item">
            <span class="material-symbols-outlined nav-icon">inventory_2</span>
            <span class="nav-label">Product Catalog</span>
          </a>
        } @else {
          <!-- Internal Supermarket Staff Links -->
          <a routerLink="/pos" routerLinkActive="active" class="nav-item">
            <span class="material-symbols-outlined nav-icon">point_of_sale</span>
            <span class="nav-label">POS / Checkout</span>
          </a>

          <a routerLink="/products" routerLinkActive="active" class="nav-item">
            <span class="material-symbols-outlined nav-icon">inventory_2</span>
            <span class="nav-label">Product Catalog</span>
          </a>

          <a routerLink="/inventory" routerLinkActive="active" class="nav-item">
            <span class="material-symbols-outlined nav-icon">warehouse</span>
            <span class="nav-label">Branch Inventory</span>
          </a>

          <a routerLink="/purchase-orders" routerLinkActive="active" class="nav-item">
            <span class="material-symbols-outlined nav-icon">local_shipping</span>
            <span class="nav-label">Purchase Orders</span>
          </a>

          <a routerLink="/customers" routerLinkActive="active" class="nav-item">
            <span class="material-symbols-outlined nav-icon">groups</span>
            <span class="nav-label">Customer Loyalty</span>
          </a>

          <a routerLink="/discounts" routerLinkActive="active" class="nav-item">
            <span class="material-symbols-outlined nav-icon">percent</span>
            <span class="nav-label">Discount Engine</span>
          </a>

          <a routerLink="/reports" routerLinkActive="active" class="nav-item">
            <span class="material-symbols-outlined nav-icon">analytics</span>
            <span class="nav-label">Reports & Analytics</span>
          </a>

          @if (authService.isAdmin()) {
            <a routerLink="/admin" routerLinkActive="active" class="nav-item">
              <span class="material-symbols-outlined nav-icon">admin_panel_settings</span>
              <span class="nav-label">Security & RBAC</span>
            </a>
          }
        }
      </nav>

      <!-- Bottom Staff & Role Switcher -->
      <div class="sidebar-footer">
        <div class="staff-card active-staff" (click)="toggleRole()" title="Click to cycle role">
          <div class="avatar-circle">
            {{ authService.currentUser().fullName.substring(0, 2).toUpperCase() }}
          </div>
          <div class="staff-info">
            <span class="staff-name">{{ authService.currentUser().fullName }}</span>
            <span class="staff-role">{{ authService.currentUser().role }}_ROLE</span>
          </div>
        </div>

        <div class="footer-links-row">
          <button class="logout-btn" (click)="toggleRole()" title="Cycle Cashier -> Manager -> Admin">
            <span class="material-symbols-outlined logout-icon">published_with_changes</span>
            <span>Switch Role</span>
          </button>
          <a routerLink="/login" class="login-link-btn" title="Go to sp_get_login screen">
            <span class="material-symbols-outlined logout-icon">login</span>
          </a>
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
      padding: 22px 16px;
      position: sticky;
      top: 0;
      flex-shrink: 0;
    }

    .brand-header {
      display: flex;
      align-items: center;
      gap: 12px;
      padding-bottom: 22px;
      border-bottom: 1px solid #f1f3f5;
      margin-bottom: 18px;
    }

    .brand-logo-circle {
      width: 44px;
      height: 44px;
      border-radius: 12px;
      background: var(--primary-green);
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 12px rgba(6, 95, 70, 0.25);
    }

    .logo-icon {
      color: #ffffff;
      font-size: 24px;
    }

    .brand-text {
      display: flex;
      flex-direction: column;
    }

    .brand-name {
      font-size: 1.1rem;
      font-weight: 800;
      letter-spacing: -0.3px;
      color: var(--primary-green-dark);
    }

    .brand-tag {
      font-size: 0.62rem;
      font-weight: 700;
      color: var(--primary-green);
      letter-spacing: 0.5px;
    }

    .nav-menu {
      display: flex;
      flex-direction: column;
      gap: 6px;
      flex: 1;
    }

    .nav-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 11px 16px;
      border-radius: var(--radius-pill);
      color: var(--text-secondary);
      text-decoration: none;
      font-weight: 600;
      font-size: 0.92rem;
      transition: all 0.2s ease;
    }

    .nav-icon {
      font-size: 22px;
      color: #64748b;
      transition: color 0.2s ease;
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
      box-shadow: 0 6px 16px rgba(6, 95, 70, 0.32);
    }

    .nav-item.active .nav-icon {
      color: #ffffff;
    }

    .sidebar-footer {
      display: flex;
      flex-direction: column;
      gap: 8px;
      padding-top: 16px;
      border-top: 1px solid #f1f3f5;
    }

    .staff-card {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 8px 12px;
      border-radius: var(--radius-pill);
      background: #f8fafc;
      border: 1px solid #edf0f3;
      cursor: pointer;
      transition: all 0.2s ease;
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
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: var(--primary-green);
      color: #ffffff;
      font-size: 0.78rem;
      font-weight: 700;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .avatar-circle.secondary {
      background: #e2e8f0;
      color: #334155;
    }

    .staff-info {
      display: flex;
      flex-direction: column;
      line-height: 1.2;
    }

    .staff-name {
      font-size: 0.82rem;
      font-weight: 700;
      color: var(--text-main);
    }

    .staff-role {
      font-size: 0.7rem;
      color: var(--text-muted);
    }

    .logout-btn {
      display: flex;
      align-items: center;
      gap: 8px;
      background: transparent;
      border: none;
      padding: 9px 12px;
      color: #64748b;
      font-weight: 600;
      font-size: 0.84rem;
      cursor: pointer;
      border-radius: var(--radius-pill);
      transition: all 0.2s ease;
    }

    .logout-btn:hover {
      color: var(--primary-green);
      background: #f1f5f9;
    }

    .logout-icon {
      font-size: 19px;
    }

    .footer-links-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 6px;
    }

    .login-link-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 9px;
      color: #64748b;
      border-radius: var(--radius-pill);
      text-decoration: none;
      transition: all 0.2s ease;

      &:hover {
        color: var(--primary-green);
        background: #f1f5f9;
      }
    }
  `]
})
export class SidebarComponent {
  readonly authService = inject(AuthService);

  switchUser(role: 'CASHIER' | 'MANAGER' | 'ADMIN' | 'SUPPLIER'): void {
    this.authService.switchUser(role);
  }

  toggleRole(): void {
    const current = this.authService.currentUser().role;
    if (current === 'CASHIER') this.switchUser('MANAGER');
    else if (current === 'MANAGER') this.switchUser('ADMIN');
    else if (current === 'ADMIN') this.switchUser('SUPPLIER');
    else this.switchUser('CASHIER');
  }
}
