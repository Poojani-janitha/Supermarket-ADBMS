import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from './shared/components/sidebar/sidebar.component';
import { ReceiptModalComponent } from './shared/components/receipt-modal/receipt-modal.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, SidebarComponent, ReceiptModalComponent],
  template: `
    <div class="pos-app-wrapper">
      <app-sidebar></app-sidebar>
      <main class="pos-main-container">
        <router-outlet></router-outlet>
      </main>
      <app-receipt-modal></app-receipt-modal>
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

    .pos-main-container {
      flex: 1;
      height: 100vh;
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }
  `]
})
export class AppComponent {}
