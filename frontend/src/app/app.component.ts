import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterOutlet } from '@angular/router';
import { SidebarComponent } from './shared/components/sidebar/sidebar.component';
import { ReceiptModalComponent } from './shared/components/receipt-modal/receipt-modal.component';
import { SecurityAlertModalComponent } from './shared/components/security-alert-modal/security-alert-modal.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, SidebarComponent, ReceiptModalComponent, SecurityAlertModalComponent],
  template: `
    <div class="pos-app-wrapper" [class.auth-layout]="isAuthPage">
      @if (!isAuthPage) {
        <app-sidebar></app-sidebar>
      }
      <main class="pos-main-container" [class.full-page]="isAuthPage">
        <router-outlet></router-outlet>
      </main>
      <app-receipt-modal></app-receipt-modal>
      <app-security-alert-modal></app-security-alert-modal>
    </div>
  `,
  styles: [`
    .pos-app-wrapper {
      display: flex;
      height: 100vh;
      width: 100vw;
      overflow: hidden;
      background: var(--bg-app);
    }

    .pos-app-wrapper.auth-layout {
      background: linear-gradient(135deg, #064e3b 0%, #065f46 50%, #047857 100%);
    }

    .pos-main-container {
      flex: 1;
      height: 100vh;
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }

    .pos-main-container.full-page {
      width: 100vw;
      height: 100vh;
      overflow-y: auto;
    }
  `]
})
export class AppComponent {
  private readonly router = inject(Router);

  get isAuthPage(): boolean {
    return this.router.url.includes('/login') || this.router.url === '/';
  }
}
