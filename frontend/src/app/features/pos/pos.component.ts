import { Component, inject, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ProductService } from '../../core/services/product.service';
import { CartService } from '../../core/services/cart.service';
import { CustomerService } from '../../core/services/customer.service';
import { AuthService } from '../../core/services/auth.service';
import { ReceiptModalComponent } from '../../shared/components/receipt-modal/receipt-modal.component';
import { Customer, Product, SalesOrder } from '../../core/models';

@Component({
  selector: 'app-pos',
  standalone: true,
  imports: [CommonModule, FormsModule, ReceiptModalComponent],
  template: `
    <div class="pos-layout">
      <!-- ================= CENTER MAIN AISLE AREA ================= -->
      <main class="pos-center-area">
        <!-- 1. PINNED TOP BAR (Never scrolls out of view) -->
        <header class="pos-topbar-pinned">
          <div class="search-input-pill">
            <input
              type="text"
              placeholder="Search grocery items by name, SKU..."
              [ngModel]="productService.searchQuery()"
              (ngModelChange)="productService.setSearchQuery($event)"
            />
            @if (productService.searchQuery()) {
              <button class="clear-search-btn" (click)="productService.setSearchQuery('')">&times;</button>
            }
          </div>
        </header>

        <!-- 2. PINNED CATEGORY AISLES CAROUSEL (Never scrolls out of view) -->
        <section class="category-carousel-pinned">
          @for (cat of productService.categories(); track cat.id) {
            <div
              class="category-card"
              [class.active]="productService.selectedCategoryId() === cat.id"
              (click)="productService.selectCategory(cat.id)"
            >
              <div class="category-icon-box">
                <span class="material-symbols-outlined cat-icon">{{ cat.icon }}</span>
              </div>
              <span class="category-name">{{ cat.name }}</span>
              <span class="category-count">{{ cat.itemCount }} Items</span>
            </div>
          }
        </section>

        <!-- 3. SMOOTH SCROLLABLE PRODUCTS GRID -->
        <section class="products-scroll-area">
          <div class="product-grid">
            @for (product of productService.filteredProducts(); track product.id) {
              <div
                class="product-card"
                [class.card-selected]="cartService.getItemQty(product.id) > 0"
                [class.out-of-stock]="product.stockQty <= 0"
              >
                <!-- Card Image & Floating Badges -->
                <div class="card-image-box">
                  <img [src]="product.imageUrl" [alt]="product.name" class="product-thumb" loading="lazy" />
                  @if (product.discountBadge) {
                    <span class="badge-floating badge-discount">{{ product.discountBadge }}</span>
                  }
                  @if (product.dietType) {
                    <span
                      class="badge-floating badge-diet"
                      [class.diet-veg]="product.dietType === 'VEG'"
                      [class.diet-nonveg]="product.dietType === 'NON_VEG'"
                    >
                      <span class="diet-dot"></span>
                      {{ product.dietType === 'VEG' ? 'Organic' : 'Protein' }}
                    </span>
                  }
                </div>

                <!-- Product Information -->
                <div class="card-info">
                  <span class="sku-meta">{{ product.sku }} &bull; {{ product.stockQty }} in stock</span>
                  <h3 class="product-name" [title]="product.name">{{ product.name }}</h3>

                  <div class="price-row">
                    <span class="price-val">Rs. {{ product.unitPrice.toFixed(2) }}</span>
                    @if (product.stockQty <= 0) {
                      <span class="stock-warn">Out of Stock</span>
                    }
                  </div>

                  <!-- Dynamic Action: Add or Counter -->
                  @if (product.stockQty <= 0) {
                    <button class="btn-card-action disabled" disabled>
                      <span>Locked (Zero Stock)</span>
                    </button>
                  } @else if (cartService.getItemQty(product.id) === 0) {
                    <button class="btn-card-action add-btn" (click)="cartService.addItem(product)">
                      <span class="material-symbols-outlined">add_shopping_cart</span>
                      <span>Add to Cart</span>
                    </button>
                  } @else {
                    <div class="counter-control-pill">
                      <button class="cnt-btn" (click)="cartService.updateQuantity(product.id, -1)" title="Decrease">
                        <span class="material-symbols-outlined">remove</span>
                      </button>
                      <span class="cnt-num">{{ cartService.getItemQty(product.id) }}</span>
                      <button
                        class="cnt-btn"
                        [disabled]="cartService.getItemQty(product.id) >= product.stockQty"
                        (click)="cartService.updateQuantity(product.id, 1)"
                        title="Increase"
                      >
                        <span class="material-symbols-outlined">add</span>
                      </button>
                    </div>
                  }
                </div>
              </div>
            }
          </div>
        </section>

        <!-- 4. PINNED BOTTOM HELD CARTS DOCK (Exactly like T1, T2 in Pinterest SS) -->
        <footer class="held-dock-pinned">
          <div class="dock-left-actions">
            <button
              class="btn-hold-cart"
              [disabled]="cartService.cartItems().length === 0"
              (click)="cartService.holdCurrentCart()"
              title="Park / Hold current cart when customer steps away"
            >
              <span class="material-symbols-outlined">pause_circle</span>
              <span>Hold Cart</span>
            </button>
          </div>

          <div class="held-carts-list">
            @for (held of cartService.heldCarts(); track held.id) {
              <div class="held-cart-pill" (click)="cartService.resumeHeldCart(held.id)" title="Click to resume this cart">
                <div class="held-badge">{{ held.tag }}</div>
                <div class="held-info">
                  <span class="held-title">{{ held.customerName }}</span>
                  <span class="held-meta">{{ held.itemCount }} items &bull; Rs. {{ held.subtotal.toFixed(2) }}</span>
                </div>
                <button
                  class="held-remove-btn"
                  (click)="$event.stopPropagation(); cartService.removeHeldCart(held.id)"
                  title="Discard held cart"
                >&times;</button>
              </div>
            }

            @if (cartService.heldCarts().length === 0) {
              <span class="no-held-text">No suspended carts on hold</span>
            }
          </div>
        </footer>
      </main>

      <!-- ================= RIGHT CHECKOUT / REGISTER PANEL ================= -->
      <aside class="pos-cart-panel">
        <!-- 1. Register Header -->
        <div class="cart-header">
          <div class="header-titles">
            <div class="register-tag-row">
              <span class="status-dot"></span>
              <h2 class="register-name">Current Order</h2>
            </div>
          </div>

          <div class="header-right-btns">
            @if (cartService.cartItems().length > 0) {
              <button class="icon-action-btn danger" (click)="cartService.clearCart()" title="Void / Clear Cart">
                <span class="material-symbols-outlined">delete_sweep</span>
              </button>
            }
          </div>
        </div>

        <!-- 2. Customer Loyalty Bar (Member 3 & 5: fn_customer_tier, fn_mask_phone) -->
        <div class="customer-loyalty-bar" (click)="openCustomerModal()">
          <div class="cust-avatar-box">
            <span class="material-symbols-outlined">person</span>
          </div>

          @if (cartService.selectedCustomer(); as cust) {
            <div class="cust-details">
              <div class="cust-name-row">
                <strong>{{ cust.fullName }}</strong>
                <span
                  class="tier-chip"
                  [class.tier-gold]="cust.tier === 'GOLD'"
                  [class.tier-silver]="cust.tier === 'SILVER'"
                  [class.tier-bronze]="cust.tier === 'BRONZE'"
                >
                  {{ cust.tier }}
                </span>
              </div>
              <span class="cust-phone-meta">
                {{ customerService.isDataMasked() ? customerService.maskPhone(cust.phone) : cust.phone }}
                &bull; {{ cust.loyaltyPoints }} pts
              </span>
            </div>
          } @else {
            <div class="cust-details">
              <strong>Walk-in Shopper</strong>
              <span class="cust-phone-meta">No loyalty card attached</span>
            </div>
          }

          <div class="cust-action-buttons">
            <button
              type="button"
              class="add-cust-btn"
              (click)="$event.stopPropagation(); openNewCustomerModal()"
              title="Add New Customer"
            >
              <span class="material-symbols-outlined">person_add</span>
            </button>
            <button type="button" class="switch-cust-btn" title="Change Customer">
              <span class="material-symbols-outlined">sync_alt</span>
            </button>
          </div>
        </div>

        <!-- 3. Scrollable Cart Items List -->
        <div class="cart-items-scroll">
          @if (cartService.cartItems().length === 0) {
            <div class="empty-cart-box">
              <span class="material-symbols-outlined empty-icon">shopping_bag</span>
              <p class="empty-title">Cart is currently empty</p>
              <p class="empty-sub">Scan grocery barcodes or tap catalog items to begin checkout</p>
            </div>
          } @else {
            @for (item of cartService.cartItems(); track item.product.id) {
              <div class="cart-item-row">
                <img [src]="item.product.imageUrl" [alt]="item.product.name" class="item-img" />

                <div class="item-info">
                  <h4 class="item-name">{{ item.product.name }}</h4>
                  <span class="item-unit-price">Rs. {{ item.product.unitPrice.toFixed(2) }} &times; {{ item.quantity }}</span>
                </div>

                <div class="item-action-col">
                  <span class="item-line-total">Rs. {{ item.lineTotal.toFixed(2) }}</span>
                  <div class="item-qty-pills">
                    <button class="q-btn" (click)="cartService.updateQuantity(item.product.id, -1)">-</button>
                    <span class="q-val">{{ item.quantity }}</span>
                    <button
                      class="q-btn"
                      [disabled]="item.quantity >= item.product.stockQty"
                      (click)="cartService.updateQuantity(item.product.id, 1)"
                    >+</button>
                    <button class="q-trash" (click)="cartService.removeItem(item.product.id)" title="Remove item">
                      <span class="material-symbols-outlined">delete</span>
                    </button>
                  </div>
                </div>
              </div>
            }
          }
        </div>

        <!-- 4. Coupon Input Box (fn_coupon_valid) -->
        <div class="coupon-row">
          <span class="material-symbols-outlined coupon-icon">confirmation_number</span>
          <input
            type="text"
            placeholder="Enter coupon code (e.g. NEWYEAR50)"
            [(ngModel)]="couponInput"
            (keyup.enter)="applyCouponCode()"
          />
          @if (cartService.appliedCoupon()) {
            <span class="active-coupon-badge">
              {{ cartService.appliedCoupon() }}
              <button class="remove-coupon-btn" (click)="removeCoupon()">&times;</button>
            </span>
          } @else {
            <button class="btn-apply-coupon" (click)="applyCouponCode()">Apply</button>
          }
        </div>

        <!-- 5. Bill Summary Breakdown (sp_apply_discounts capped at 50%) -->
        <div class="bill-summary-card">
          <div class="bill-line">
            <span class="label">Subtotal</span>
            <span class="val">Rs. {{ cartService.subtotal().toFixed(2) }}</span>
          </div>

          @if (cartService.discountTotal() > 0) {
            <div class="bill-line discount-line">
              <span class="label">
                Discounts Applied
                <span class="rule-hint">
                  @for (d of cartService.discounts(); track d.ruleId) {
                    &bull; {{ d.ruleName }}
                  }
                </span>
              </span>
              <span class="val green">-Rs. {{ cartService.discountTotal().toFixed(2) }}</span>
            </div>
          }


          <div class="bill-divider"></div>

          <div class="bill-line total-line">
            <span class="total-label">Net Payable Amount</span>
            <span class="total-amount">Rs. {{ cartService.totalAmount().toFixed(2) }}</span>
          </div>
        </div>

        <!-- 6. Cash Tender & Change Due (Option 2 Minimal Dual-Box) -->
        <div class="cash-tendered-box">
          <div class="tender-calc-row">
            <div class="tender-box-card tender-input-card">
              <label for="cash-tendered-input">Cash Tendered</label>
              <div class="tender-input-field">
                <span class="prefix">Rs.</span>
                <input
                  id="cash-tendered-input"
                  type="number"
                  min="0"
                  step="any"
                  placeholder="0.00"
                  [ngModel]="cartService.cashTendered()"
                  (ngModelChange)="cartService.setCashTendered($event)"
                />
              </div>
            </div>
            <div class="tender-box-card change-due-card">
              <span class="change-label">Change Due</span>
              <span class="change-val">Rs. {{ cartService.changeDue().toFixed(2) }}</span>
            </div>
          </div>
        </div>

        <!-- 8. Complete Sale Button -->
        <button
          class="btn-checkout-complete"
          [disabled]="cartService.cartItems().length === 0"
          (click)="cartService.placeOrder()"
        >
          <span class="material-symbols-outlined">task_alt</span>
          <span>Complete Sale & Print Receipt</span>
        </button>
      </aside>

      <!-- ================= RECEIPT MODAL ================= -->
      <app-receipt-modal></app-receipt-modal>

      <!-- ================= MODAL: CUSTOMER SELECTION ================= -->
      @if (isCustomerModalOpen()) {
        <div class="modal-backdrop" (click)="isCustomerModalOpen.set(false)">
          <div class="modal-card" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h3>Attach Customer Loyalty</h3>
              <button class="close-btn" (click)="isCustomerModalOpen.set(false)">&times;</button>
            </div>

            <div class="modal-body">
              <p class="modal-hint">
                Select registered loyalty customer to trigger <code>fn_customer_tier</code> discount rules:
              </p>

              <button class="cust-choice-pill walkin" (click)="selectWalkIn()">
                <div class="avatar-circle">W</div>
                <div>
                  <strong>Walk-in Shopper</strong>
                  <p>No loyalty discounts applied</p>
                </div>
              </button>

              <div class="cust-list-group">
                @for (c of customerService.customers(); track c.id) {
                  <button class="cust-choice-pill" (click)="selectCustomer(c)">
                    <div class="avatar-circle">{{ c.fullName.substring(0, 2).toUpperCase() }}</div>
                    <div style="flex: 1; text-align: left;">
                      <div style="display: flex; justify-content: space-between; align-items: center;">
                        <strong>{{ c.fullName }}</strong>
                        <span class="tier-chip" [class.tier-gold]="c.tier === 'GOLD'" [class.tier-silver]="c.tier === 'SILVER'" [class.tier-bronze]="c.tier === 'BRONZE'">
                          {{ c.tier }}
                        </span>
                      </div>
                      <p>{{ c.phone }} &bull; {{ c.loyaltyPoints }} Points</p>
                    </div>
                  </button>
                }
              </div>
            </div>
          </div>
        </div>
      }

      <!-- ================= MODAL: REGISTER NEW CUSTOMER ================= -->
      @if (isNewCustomerModalOpen()) {
        <div class="modal-backdrop" (click)="closeNewCustomerModal()">
          <div class="modal-card" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <div style="display: flex; align-items: center; gap: 8px;">
                <span class="material-symbols-outlined" style="color: var(--primary-green, #065f46);">person_add</span>
                <h3>Add New Customer</h3>
              </div>
              <button class="close-btn" (click)="closeNewCustomerModal()">&times;</button>
            </div>

            <div class="modal-body">
              <p class="modal-hint">
                Enter customer details below. Loyalty tier will be assigned automatically.
              </p>

              <div class="new-cust-form">
                <div class="form-group">
                  <label>Full Name <span class="required">*</span></label>
                  <input
                    type="text"
                    placeholder="e.g. John Doe"
                    [ngModel]="newCustName()"
                    (ngModelChange)="newCustName.set($event)"
                  />
                </div>

                <div class="form-group">
                  <label>Phone Number <span class="required">*</span> (Numbers Only)</label>
                  <input
                    type="tel"
                    maxlength="10"
                    placeholder="e.g. 0771234567"
                    [ngModel]="newCustPhone()"
                    (keypress)="allowNumbersOnly($event)"
                    (ngModelChange)="onPosPhoneChange($event)"
                  />
                </div>

                <div class="form-group">
                  <label>Email Address (Optional)</label>
                  <input
                    type="email"
                    placeholder="e.g. john@example.com"
                    [ngModel]="newCustEmail()"
                    (ngModelChange)="newCustEmail.set($event)"
                  />
                </div>

                @if (newCustError()) {
                  <div class="form-error-msg">
                    <span class="material-symbols-outlined" style="font-size: 16px;">error</span>
                    <span>{{ newCustError() }}</span>
                  </div>
                }

                <div class="modal-actions-row">
                  <button type="button" class="btn-cancel" (click)="closeNewCustomerModal()">Cancel</button>
                  <button
                    type="button"
                    class="btn-submit-cust"
                    [disabled]="isRegisteringCustomer() || !newCustName().trim() || !newCustPhone().trim()"
                    (click)="submitNewCustomer()"
                  >
                    @if (isRegisteringCustomer()) {
                      <span>Registering...</span>
                    } @else {
                      <span class="material-symbols-outlined" style="font-size: 18px;">how_to_reg</span>
                      <span>Register & Select</span>
                    }
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      }

      <!-- ================= MODAL: ORDER LOOKUP & CANCEL (sp_cancel_order) ================= -->
      @if (isLookupOpen()) {
        <div class="modal-backdrop" (click)="isLookupOpen.set(false)">
          <div class="modal-card lookup-dialog" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h3>Order Lookup & Cancellation</h3>
              <button class="close-btn" (click)="isLookupOpen.set(false)">&times;</button>
            </div>

            <div class="modal-body">
              <p class="procedure-note">
                Demonstrates <strong>sp_cancel_order</strong>: Marks the order <code>CANCELLED</code> in an atomic transaction and restores inventory quantities via triggers.
              </p>

              <div class="search-order-row">
                <input
                  type="number"
                  [(ngModel)]="lookupOrderId"
                  placeholder="Enter Order ID (e.g. 10482)..."
                  class="order-id-input"
                />
                <button class="btn-pill btn-primary" (click)="searchOrder()">Search</button>
              </div>

              @if (foundOrder(); as o) {
                <div class="order-found-box">
                  <div class="found-row">
                    <span>Order Number:</span>
                    <strong>#{{ o.id }}</strong>
                  </div>
                  <div class="found-row">
                    <span>Customer:</span>
                    <strong>{{ o.customer }}</strong>
                  </div>
                  <div class="found-row">
                    <span>Order Total:</span>
                    <strong>Rs. {{ o.amount.toFixed(2) }}</strong>
                  </div>
                  <div class="found-row">
                    <span>Database Status:</span>
                    <span class="status-badge" [class.completed]="o.status === 'COMPLETED'" [class.cancelled]="o.status === 'CANCELLED'">
                      {{ o.status }}
                    </span>
                  </div>

                  @if (o.status === 'COMPLETED') {
                    <button class="btn-pill btn-danger full-width" (click)="cancelFoundOrder()">
                      <span class="material-symbols-outlined">cancel</span>
                      Cancel Order & Restore Stock (sp_cancel_order)
                    </button>
                  } @else {
                    <div class="already-cancelled-alert">
                      Order is already cancelled. Stock was atomically returned to branch inventory.
                    </div>
                  }
                </div>
              }
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    /* Master POS Full-Height Layout */
    .pos-layout {
      display: flex;
      height: 100vh;
      width: 100%;
      overflow: hidden;
      background: #f8fafc;
      font-family: inherit;
    }

    /* CENTER AREA (Fixed header/carousel + scrollable grid + fixed dock) */
    .pos-center-area {
      flex: 1;
      display: flex;
      flex-direction: column;
      height: 100vh;
      overflow: hidden;
      background: #f8fafc;
      min-width: 0;
    }

    /* 1. PINNED TOPBAR */
    .pos-topbar-pinned {
      padding: 16px 24px 10px;
      display: flex;
      align-items: center;
      gap: 14px;
      background: #f8fafc;
      flex-shrink: 0;
    }

    .search-input-pill {
      flex: 1;
      height: 48px;
      background: #ffffff;
      border-radius: var(--radius-pill);
      border: 1.5px solid var(--border-subtle);
      display: flex;
      align-items: center;
      padding: 0 18px;
      gap: 12px;
      box-shadow: 0 2px 6px rgba(0,0,0,0.03);
      transition: all 0.2s ease;

      &:focus-within {
        border-color: var(--primary-green);
        box-shadow: 0 0 0 3px rgba(6, 95, 70, 0.12);
      }

      .search-icon {
        color: var(--primary-green);
        font-size: 22px;
      }

      input {
        flex: 1;
        border: none;
        outline: none;
        font-size: 0.9rem;
        color: #1e293b;
        font-family: inherit;
      }

      .clear-search-btn {
        background: none;
        border: none;
        font-size: 1.2rem;
        color: #94a3b8;
        cursor: pointer;
        &:hover { color: #334155; }
      }
    }

    .topbar-actions {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .lookup-btn {
      height: 48px;
      padding: 0 18px;
      border-radius: var(--radius-pill);
      background: #ffffff;
      border: 1.5px solid var(--border-subtle);
      font-size: 0.85rem;
      font-weight: 700;
      color: #334155;
      display: flex;
      align-items: center;
      gap: 8px;
      cursor: pointer;
      box-shadow: 0 2px 6px rgba(0,0,0,0.03);
      transition: all 0.2s;

      .material-symbols-outlined { font-size: 20px; color: var(--primary-green); }

      &:hover {
        border-color: var(--primary-green);
        background: #ecfdf5;
        color: var(--primary-green);
      }
    }

    /* 2. PINNED CATEGORY AISLES CAROUSEL */
    .category-carousel-pinned {
      padding: 6px 24px 12px;
      display: flex;
      gap: 12px;
      overflow-x: auto;
      flex-shrink: 0;
      scrollbar-width: none;
      &::-webkit-scrollbar { display: none; }
    }

    .category-card {
      min-width: 105px;
      background: #ffffff;
      border-radius: 18px;
      padding: 12px 14px;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;
      cursor: pointer;
      border: 1.5px solid transparent;
      box-shadow: 0 2px 6px rgba(0,0,0,0.03);
      transition: all 0.18s cubic-bezier(0.4, 0, 0.2, 1);
      user-select: none;

      .category-icon-box {
        width: 38px;
        height: 38px;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .cat-icon {
        font-size: 24px;
        color: var(--primary-green);
        transition: transform 0.2s;
      }

      .category-name {
        font-size: 0.82rem;
        font-weight: 700;
        color: #1e293b;
        white-space: nowrap;
      }

      .category-count {
        font-size: 0.7rem;
        color: #94a3b8;
        white-space: nowrap;
      }

      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 14px rgba(0,0,0,0.06);
      }

      &.active {
        background: #ecfdf5;
        border-color: #a7f3d0;

        .category-name {
          color: var(--primary-green-dark);
        }

        .cat-icon {
          transform: scale(1.1);
        }
      }
    }

    /* 3. SCROLLABLE PRODUCTS GRID */
    .products-scroll-area {
      flex: 1;
      overflow-y: auto;
      padding: 4px 24px 16px;
    }

    .product-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 16px;
    }

    @media (max-width: 1300px) {
      .product-grid { grid-template-columns: repeat(2, 1fr); }
    }

    .product-card {
      background: #ffffff;
      border-radius: 20px;
      overflow: hidden;
      border: 1.5px solid #edf0f3;
      box-shadow: 0 3px 10px rgba(0,0,0,0.03);
      display: flex;
      flex-direction: column;
      transition: all 0.2s ease;

      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 18px rgba(0,0,0,0.06);
      }

      &.card-selected {
        border-color: var(--primary-green);
        box-shadow: 0 4px 14px rgba(6, 95, 70, 0.12);
      }

      &.out-of-stock {
        opacity: 0.6;
      }
    }

    .card-image-box {
      height: 140px;
      width: 100%;
      position: relative;
      background: #f1f5f9;
      overflow: hidden;

      .product-thumb {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
    }

    .badge-floating {
      position: absolute;
      padding: 3px 10px;
      border-radius: 12px;
      font-size: 0.7rem;
      font-weight: 700;

      &.badge-discount {
        top: 10px;
        left: 10px;
        background: #fef3c7;
        color: #b45309;
      }

      &.badge-diet {
        top: 10px;
        right: 10px;
        display: flex;
        align-items: center;
        gap: 5px;
        background: rgba(255, 255, 255, 0.95);
        backdrop-filter: blur(4px);

        .diet-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
        }

        &.diet-veg {
          color: #166534;
          .diet-dot { background: #16a34a; }
        }

        &.diet-nonveg {
          color: #991b1b;
          .diet-dot { background: #dc2626; }
        }
      }
    }

    .card-info {
      padding: 14px 16px;
      display: flex;
      flex-direction: column;
      gap: 6px;
      flex: 1;
    }

    .sku-meta {
      font-family: monospace;
      font-size: 0.72rem;
      color: #94a3b8;
    }

    .product-name {
      font-size: 0.9rem;
      font-weight: 700;
      color: #0f172a;
      margin: 0;
      line-height: 1.35;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
      height: 2.7em;
    }

    .price-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-top: 4px;

      .price-val {
        font-size: 1.15rem;
        font-weight: 800;
        color: var(--primary-green);
      }

      .stock-warn {
        font-size: 0.72rem;
        font-weight: 700;
        color: #dc2626;
      }
    }

    .btn-card-action {
      margin-top: 8px;
      height: 38px;
      border-radius: var(--radius-pill);
      border: none;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      font-size: 0.82rem;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.15s ease;

      &.add-btn {
        background: #ecfdf5;
        color: var(--primary-green);
        border: 1px solid #a7f3d0;

        .material-symbols-outlined { font-size: 17px; }

        &:hover {
          background: var(--primary-green);
          color: #ffffff;
        }
      }

      &.disabled {
        background: #f1f5f9;
        color: #94a3b8;
        cursor: not-allowed;
      }
    }

    .counter-control-pill {
      margin-top: 8px;
      height: 38px;
      background: #f0fdf4;
      border: 1px solid #a7f3d0;
      border-radius: var(--radius-pill);
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 6px;

      .cnt-btn {
        width: 28px;
        height: 28px;
        border-radius: 50%;
        background: var(--primary-green);
        color: #ffffff;
        border: none;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: background 0.15s;

        .material-symbols-outlined { font-size: 16px; }

        &:hover:not(:disabled) { background: var(--primary-green-dark); }
        &:disabled { opacity: 0.5; cursor: not-allowed; }
      }

      .cnt-num {
        font-weight: 800;
        font-size: 0.95rem;
        color: #064e3b;
      }
    }

    /* 4. PINNED BOTTOM HELD CARTS DOCK */
    .held-dock-pinned {
      background: #ffffff;
      border-top: 1px solid var(--border-subtle);
      padding: 10px 24px;
      display: flex;
      align-items: center;
      gap: 16px;
      flex-shrink: 0;
      box-shadow: 0 -2px 10px rgba(0,0,0,0.02);
    }

    .btn-hold-cart {
      height: 40px;
      padding: 0 16px;
      background: #f1f5f9;
      border: 1px solid #cbd5e1;
      border-radius: var(--radius-pill);
      font-size: 0.8rem;
      font-weight: 700;
      color: #334155;
      display: flex;
      align-items: center;
      gap: 6px;
      cursor: pointer;
      transition: all 0.2s;

      .material-symbols-outlined { font-size: 18px; color: #0284c7; }

      &:hover:not(:disabled) {
        background: #e0f2fe;
        border-color: #38bdf8;
        color: #0369a1;
      }

      &:disabled { opacity: 0.5; cursor: not-allowed; }
    }

    .held-carts-list {
      display: flex;
      align-items: center;
      gap: 10px;
      overflow-x: auto;
      flex: 1;
    }

    .held-cart-pill {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 6px 12px;
      display: flex;
      align-items: center;
      gap: 10px;
      cursor: pointer;
      transition: all 0.15s;

      &:hover {
        background: #ecfdf5;
        border-color: #a7f3d0;
      }

      .held-badge {
        background: #fef3c7;
        color: #92400e;
        font-weight: 800;
        font-size: 0.72rem;
        padding: 3px 6px;
        border-radius: 6px;
      }

      .held-info {
        display: flex;
        flex-direction: column;

        .held-title {
          font-size: 0.78rem;
          font-weight: 700;
          color: #1e293b;
        }

        .held-meta {
          font-size: 0.68rem;
          color: #64748b;
        }
      }

      .held-remove-btn {
        background: none;
        border: none;
        font-size: 1.1rem;
        color: #94a3b8;
        cursor: pointer;
        padding: 0 2px;
        &:hover { color: #dc2626; }
      }
    }

    .no-held-text {
      font-size: 0.75rem;
      color: #94a3b8;
      font-style: italic;
    }

    /* RIGHT CHECKOUT PANEL */
    .pos-cart-panel {
      width: 390px;
      height: 100vh;
      background: #ffffff;
      border-left: 1px solid var(--border-subtle);
      display: flex;
      flex-direction: column;
      flex-shrink: 0;
    }

    /* 1. Register Header */
    .cart-header {
      padding: 18px 20px 14px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid #f1f5f9;

      .register-tag-row {
        display: flex;
        align-items: center;
        gap: 8px;

        .status-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #10b981;
          box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.2);
        }

        .register-name {
          font-size: 1.1rem;
          font-weight: 800;
          margin: 0;
          color: #0f172a;
        }
      }

      .cashier-subtitle {
        font-size: 0.72rem;
        color: #64748b;
      }

      .icon-action-btn {
        width: 34px;
        height: 34px;
        border-radius: 50%;
        background: #fee2e2;
        color: #dc2626;
        border: none;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: background 0.15s;

        .material-symbols-outlined { font-size: 18px; }
        &:hover { background: #fca5a5; }
      }
    }

    /* 2. Customer Loyalty Bar */
    .customer-loyalty-bar {
      margin: 12px 20px 8px;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 14px;
      padding: 10px 14px;
      display: flex;
      align-items: center;
      gap: 12px;
      cursor: pointer;
      transition: all 0.15s;

      &:hover {
        background: #f0fdf4;
        border-color: #a7f3d0;
      }

      .cust-avatar-box {
        width: 36px;
        height: 36px;
        border-radius: 10px;
        background: #ecfdf5;
        color: var(--primary-green);
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .cust-details {
        flex: 1;
        display: flex;
        flex-direction: column;

        .cust-name-row {
          display: flex;
          align-items: center;
          gap: 6px;

          strong {
            font-size: 0.84rem;
            color: #0f172a;
          }
        }

        .cust-phone-meta {
          font-size: 0.72rem;
          color: #64748b;
          font-family: monospace;
        }
      }

      .cust-action-buttons {
        display: flex;
        align-items: center;
        gap: 6px;

        .add-cust-btn {
          background: #ecfdf5;
          border: 1px solid #a7f3d0;
          color: var(--primary-green, #065f46);
          border-radius: 8px;
          width: 32px;
          height: 32px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.15s;

          .material-symbols-outlined { font-size: 18px; }
          &:hover {
            background: var(--primary-green, #065f46);
            color: #ffffff;
            border-color: var(--primary-green, #065f46);
          }
        }

        .switch-cust-btn {
          background: none;
          border: none;
          color: #94a3b8;
          width: 30px;
          height: 30px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 6px;
          transition: all 0.15s;

          .material-symbols-outlined { font-size: 18px; }
          &:hover {
            background: #e2e8f0;
            color: #334155;
          }
        }
      }
    }

    .tier-chip {
      font-size: 0.65rem;
      font-weight: 800;
      padding: 2px 6px;
      border-radius: 4px;
      text-transform: uppercase;

      &.tier-gold { background: #fef3c7; color: #b45309; }
      &.tier-silver { background: #f1f5f9; color: #475569; }
      &.tier-bronze { background: #ffedd5; color: #c2410c; }
    }

    /* 3. Scrollable Cart Items List */
    .cart-items-scroll {
      flex: 1;
      overflow-y: auto;
      padding: 6px 20px;
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .empty-cart-box {
      margin: auto 0;
      text-align: center;
      padding: 30px 10px;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;

      .empty-icon {
        font-size: 44px;
        color: #cbd5e1;
      }

      .empty-title {
        font-weight: 700;
        color: #475569;
        margin: 0;
        font-size: 0.9rem;
      }

      .empty-sub {
        font-size: 0.75rem;
        color: #94a3b8;
        margin: 0;
        max-width: 220px;
      }
    }

    .cart-item-row {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 8px 0;
      border-bottom: 1px solid #f8fafc;

      .item-img {
        width: 44px;
        height: 44px;
        border-radius: 10px;
        object-fit: cover;
        background: #f1f5f9;
        flex-shrink: 0;
      }

      .item-info {
        flex: 1;
        min-width: 0;

        .item-name {
          font-size: 0.82rem;
          font-weight: 700;
          color: #0f172a;
          margin: 0;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .item-unit-price {
          font-size: 0.72rem;
          color: #64748b;
        }
      }

      .item-action-col {
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        gap: 4px;

        .item-line-total {
          font-weight: 800;
          font-size: 0.85rem;
          color: #0f172a;
        }

        .item-qty-pills {
          display: flex;
          align-items: center;
          gap: 4px;
          background: #f1f5f9;
          border-radius: 12px;
          padding: 2px 4px;

          .q-btn {
            width: 20px;
            height: 20px;
            border-radius: 50%;
            background: #ffffff;
            border: 1px solid #cbd5e1;
            font-size: 0.75rem;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            &:disabled { opacity: 0.4; }
          }

          .q-val {
            font-size: 0.75rem;
            font-weight: 700;
            min-width: 14px;
            text-align: center;
          }

          .q-trash {
            background: none;
            border: none;
            color: #94a3b8;
            cursor: pointer;
            display: flex;
            align-items: center;
            padding: 0;
            margin-left: 2px;

            .material-symbols-outlined { font-size: 15px; }
            &:hover { color: #dc2626; }
          }
        }
      }
    }

    /* 4. Coupon Row */
    .coupon-row {
      margin: 6px 20px 0;
      height: 40px;
      border: 1px dashed #cbd5e1;
      border-radius: 12px;
      display: flex;
      align-items: center;
      padding: 0 12px;
      gap: 8px;
      background: #fbfcfe;

      .coupon-icon {
        font-size: 18px;
        color: #f59e0b;
      }

      input {
        flex: 1;
        border: none;
        background: transparent;
        outline: none;
        font-size: 0.8rem;
        color: #1e293b;
      }

      .btn-apply-coupon {
        background: #f1f5f9;
        border: none;
        padding: 4px 10px;
        border-radius: 8px;
        font-size: 0.75rem;
        font-weight: 700;
        cursor: pointer;
        &:hover { background: #e2e8f0; }
      }

      .active-coupon-badge {
        background: #ecfdf5;
        border: 1px solid #a7f3d0;
        color: #065f46;
        font-size: 0.72rem;
        font-weight: 700;
        padding: 2px 8px;
        border-radius: 8px;
        display: flex;
        align-items: center;
        gap: 6px;

        .remove-coupon-btn {
          background: none;
          border: none;
          cursor: pointer;
          color: #065f46;
          font-weight: 800;
        }
      }
    }

    /* 5. Bill Summary Breakdown */
    .bill-summary-card {
      margin: 8px 20px 0;
      padding: 10px 0;
      border-top: 1px solid #f1f5f9;
      display: flex;
      flex-direction: column;
      gap: 6px;

      .bill-line {
        display: flex;
        justify-content: space-between;
        font-size: 0.8rem;
        color: #64748b;

        .val { font-weight: 700; color: #1e293b; }
        .val.green { color: #15803d; }

        &.discount-line {
          .rule-hint {
            display: block;
            font-size: 0.68rem;
            color: #15803d;
          }
        }

        &.total-line {
          margin-top: 4px;
          align-items: center;

          .total-label {
            font-size: 0.95rem;
            font-weight: 800;
            color: #0f172a;
          }

          .total-amount {
            font-size: 1.35rem;
            font-weight: 800;
            color: var(--primary-green);
          }
        }
      }

      .bill-divider {
        height: 1px;
        background: #e2e8f0;
        margin: 4px 0;
      }
    }

    /* 6. Payment Method Cards */
    /* 6. Cash Tendered Calculator (Option 2 Minimal Dual-Box) */
    .cash-tendered-box {
      margin: 8px 20px 10px;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 8px 12px;

      .tender-calc-row {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 10px;
        width: 100%;

        .tender-box-card {
          border-radius: 10px;
          padding: 8px 12px;
          display: flex;
          flex-direction: column;
          justify-content: center;
          min-height: 52px;
          transition: all 0.15s;

          &.tender-input-card {
            background: #ffffff;
            border: 1.5px solid #cbd5e1;

            &:focus-within {
              border-color: var(--primary-green, #065f46);
              box-shadow: 0 0 0 2px rgba(6, 95, 70, 0.12);
            }

            label {
              font-size: 0.68rem;
              font-weight: 800;
              color: #64748b;
              text-transform: uppercase;
              letter-spacing: 0.03em;
              margin-bottom: 2px;
            }

            .tender-input-field {
              display: flex;
              align-items: center;
              gap: 4px;

              .prefix {
                font-size: 0.85rem;
                font-weight: 700;
                color: #94a3b8;
              }

              input {
                width: 100%;
                border: none;
                outline: none;
                background: transparent;
                font-size: 0.95rem;
                font-weight: 800;
                color: #0f172a;
              }
            }
          }

          &.change-due-card {
            background: #f0fdf4;
            border: 1.5px solid #bbf7d0;

            .change-label {
              font-size: 0.68rem;
              font-weight: 800;
              color: #15803d;
              text-transform: uppercase;
              letter-spacing: 0.03em;
              margin-bottom: 2px;
            }

            .change-val {
              font-size: 1.05rem;
              font-weight: 900;
              color: #15803d;
            }
          }
        }
      }
    }

    /* 8. Big Checkout Button */
    .btn-checkout-complete {
      margin: 4px 20px 16px;
      background: var(--primary-green);
      color: #ffffff;
      border: none;
      height: 48px;
      border-radius: 14px;
      font-size: 0.92rem;
      font-weight: 800;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      cursor: pointer;
      box-shadow: 0 6px 16px rgba(6, 95, 70, 0.25);
      transition: all 0.2s;

      .material-symbols-outlined { font-size: 22px; }

      &:hover:not(:disabled) {
        background: var(--primary-green-dark);
        transform: translateY(-1px);
      }

      &:disabled {
        opacity: 0.55;
        cursor: not-allowed;
        box-shadow: none;
      }
    }

    /* MODALS */
    .modal-backdrop {
      position: fixed;
      top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      backdrop-filter: blur(2px);
    }

    .modal-card {
      background: #ffffff;
      width: 440px;
      max-width: 90vw;
      border-radius: 20px;
      padding: 24px;
      box-shadow: 0 20px 40px rgba(0,0,0,0.2);
      display: flex;
      flex-direction: column;
      gap: 16px;

      &.lookup-dialog { width: 500px; }
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;

      h3 { margin: 0; font-size: 1.15rem; font-weight: 800; }
      .close-btn { background: none; border: none; font-size: 1.4rem; cursor: pointer; }
    }

    .modal-body {
      display: flex;
      flex-direction: column;
      gap: 12px;

      .modal-hint {
        font-size: 0.8rem;
        color: #64748b;
        margin: 0;
      }
    }

    .cust-choice-pill {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 10px 14px;
      display: flex;
      align-items: center;
      gap: 12px;
      cursor: pointer;
      width: 100%;
      transition: all 0.15s;

      &:hover {
        background: #f0fdf4;
        border-color: #a7f3d0;
      }

      &.walkin {
        background: #f8fafc;
        border-style: dashed;
      }

      .avatar-circle {
        width: 36px;
        height: 36px;
        border-radius: 50%;
        background: #ecfdf5;
        color: var(--primary-green);
        font-weight: 800;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      p { margin: 2px 0 0; font-size: 0.72rem; color: #64748b; }
    }

    .cust-list-group {
      display: flex;
      flex-direction: column;
      gap: 8px;
      max-height: 240px;
      overflow-y: auto;
    }

    .procedure-note {
      background: #f8fafc;
      border-left: 3px solid var(--primary-green);
      padding: 10px;
      font-size: 0.78rem;
      color: #334155;
      margin: 0;
      line-height: 1.4;
    }

    .search-order-row {
      display: flex;
      gap: 8px;

      .order-id-input {
        flex: 1;
        padding: 10px 14px;
        border: 1.5px solid #cbd5e1;
        border-radius: 10px;
        font-size: 0.9rem;
        outline: none;
      }
    }

    .order-found-box {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 14px;
      display: flex;
      flex-direction: column;
      gap: 8px;

      .found-row {
        display: flex;
        justify-content: space-between;
        font-size: 0.85rem;
      }
    }

    .status-badge {
      font-size: 0.72rem;
      font-weight: 800;
      padding: 2px 8px;
      border-radius: 6px;

      &.completed { background: #dcfce7; color: #166534; }
      &.cancelled { background: #fee2e2; color: #991b1b; }
    }

    .btn-pill {
      padding: 8px 16px;
      border-radius: var(--radius-pill);
      font-size: 0.82rem;
      font-weight: 700;
      cursor: pointer;
      border: none;
      display: inline-flex;
      align-items: center;
      gap: 6px;

      &.btn-primary { background: var(--primary-green); color: #ffffff; }
      &.btn-danger { background: #dc2626; color: #ffffff; }
      &.full-width { width: 100%; justify-content: center; margin-top: 8px; }
    }

    .already-cancelled-alert {
      background: #fef2f2;
      border: 1px solid #fecaca;
      color: #b91c1c;
      font-size: 0.78rem;
      padding: 8px 12px;
      border-radius: 8px;
      text-align: center;
      margin-top: 6px;
    }
    .new-cust-form {
      display: flex;
      flex-direction: column;
      gap: 12px;
      margin-top: 4px;

      .form-group {
        display: flex;
        flex-direction: column;
        gap: 4px;

        label {
          font-size: 0.78rem;
          font-weight: 700;
          color: #475569;

          .required { color: #ef4444; }
        }

        input {
          border: 1.5px solid #cbd5e1;
          border-radius: 8px;
          padding: 8px 12px;
          font-size: 0.88rem;
          outline: none;
          transition: border-color 0.15s;

          &:focus {
            border-color: var(--primary-green, #065f46);
          }
        }
      }

      .form-error-msg {
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 8px 12px;
        background: #fef2f2;
        border: 1px solid #fecaca;
        border-radius: 8px;
        color: #b91c1c;
        font-size: 0.78rem;
        font-weight: 600;
      }

      .modal-actions-row {
        display: flex;
        justify-content: flex-end;
        gap: 10px;
        margin-top: 8px;

        .btn-cancel {
          padding: 8px 16px;
          border: 1.5px solid #cbd5e1;
          background: #ffffff;
          border-radius: 8px;
          font-weight: 700;
          font-size: 0.85rem;
          color: #475569;
          cursor: pointer;
          &:hover { background: #f1f5f9; }
        }

        .btn-submit-cust {
          padding: 8px 18px;
          border: none;
          background: var(--primary-green, #065f46);
          color: #ffffff;
          border-radius: 8px;
          font-weight: 800;
          font-size: 0.85rem;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 6px;
          transition: opacity 0.15s;

          &:disabled {
            opacity: 0.5;
            cursor: not-allowed;
          }
          &:hover:not(:disabled) {
            opacity: 0.92;
          }
        }
      }
    }
  `]
})
export class PosComponent {
  private readonly http = inject(HttpClient);
  readonly productService = inject(ProductService);
  readonly cartService = inject(CartService);
  readonly customerService = inject(CustomerService);
  readonly authService = inject(AuthService);

  // Modal signals
  isLookupOpen = signal<boolean>(false);
  isCustomerModalOpen = signal<boolean>(false);
  isNewCustomerModalOpen = signal<boolean>(false);
  newCustName = signal<string>('');
  newCustPhone = signal<string>('');
  newCustEmail = signal<string>('');
  newCustError = signal<string | null>(null);
  isRegisteringCustomer = signal<boolean>(false);

  // Coupon input
  couponInput = '';

  // Order lookup state
  lookupOrderId: number | null = null;
  foundOrder = signal<{ id: number; customer: string; amount: number; status: 'COMPLETED' | 'CANCELLED' } | null>(null);

  constructor() {
    this.refreshStock();
    effect(() => {
      const prods = this.productService.products();
      if (prods.length > 0 && prods.some(p => p.stockQty === 0)) {
        this.refreshStock();
      }
    }, { allowSignalWrites: true });
  }

  refreshStock(): void {
    const branchId = this.authService.currentUser().branchId || 1;
    this.http.get<Record<string, number>>(`/api/orders/stock?branchId=${branchId}`).subscribe({
      next: (stockMap) => {
        if (!stockMap) return;
        this.productService.products.update(list =>
          list.map(p => ({
            ...p,
            stockQty: stockMap[p.id] !== undefined ? stockMap[p.id] : p.stockQty
          }))
        );
      }
    });
  }

  openLookupModal(): void {
    this.isLookupOpen.set(true);
    this.foundOrder.set(null);
    this.lookupOrderId = null;
  }

  searchOrder(): void {
    if (!this.lookupOrderId) return;
    this.http.get<SalesOrder>(`/api/orders/${this.lookupOrderId}`).subscribe({
      next: (order) => {
        this.foundOrder.set({
          id: order.orderId,
          customer: order.customerName || 'Walk-in Shopper',
          amount: order.totalAmount,
          status: order.status
        });
      },
      error: () => {
        alert(`Order #${this.lookupOrderId} not found.`);
        this.foundOrder.set(null);
      }
    });
  }

  cancelFoundOrder(): void {
    if (!this.foundOrder() || !this.lookupOrderId) return;
    this.http.post<SalesOrder>(`/api/orders/${this.lookupOrderId}/cancel`, {}).subscribe({
      next: (updatedOrder) => {
        this.foundOrder.update(o => o ? { ...o, status: 'CANCELLED' } : null);
        alert(`Order #${this.lookupOrderId} cancelled successfully. Stock restored.`);
        this.productService.loadProducts();
        this.refreshStock();
      },
      error: (err) => {
        const msg = err?.error?.message || err?.error?.error || 'Cancellation failed';
        alert(`Cancellation failed: ${msg}`);
      }
    });
  }

  openCustomerModal(): void {
    this.isCustomerModalOpen.set(true);
  }

  openNewCustomerModal(): void {
    this.newCustName.set('');
    this.newCustPhone.set('');
    this.newCustEmail.set('');
    this.newCustError.set(null);
    this.isRegisteringCustomer.set(false);
    this.isNewCustomerModalOpen.set(true);
  }

  closeNewCustomerModal(): void {
    this.isNewCustomerModalOpen.set(false);
    this.newCustError.set(null);
  }

  allowNumbersOnly(event: KeyboardEvent): void {
    const charCode = event.which ? event.which : event.keyCode;
    if (charCode < 48 || charCode > 57) {
      event.preventDefault();
    }
  }

  onPosPhoneChange(val: string): void {
    const digits = val.replace(/\D/g, '');
    this.newCustPhone.set(digits);
    if (digits.length > 0 && digits.length < 10) {
      this.newCustError.set(`Phone number must be 10 digits (${digits.length}/10 digits).`);
    } else {
      this.newCustError.set(null);
    }
  }

  submitNewCustomer(): void {
    const name = this.newCustName().trim();
    const phone = this.newCustPhone().trim();
    const email = this.newCustEmail().trim();

    if (!name || !phone) {
      this.newCustError.set('Name and phone number are required.');
      return;
    }

    if (phone.length < 10) {
      this.newCustError.set('Please enter a valid 10-digit phone number (e.g. 0771234567).');
      return;
    }

    this.isRegisteringCustomer.set(true);
    this.newCustError.set(null);

    this.http.post<{ customerId: number }>('/api/customers', {
      fullName: name,
      phone: phone,
      email: email || null
    }).subscribe({
      next: (res) => {
        this.isRegisteringCustomer.set(false);
        this.isNewCustomerModalOpen.set(false);
        this.customerService.loadCustomers();
        const newCust: Customer = {
          id: res.customerId,
          fullName: name,
          phone: phone,
          email: email || undefined,
          loyaltyPoints: 0,
          tier: 'BRONZE',
          registeredDate: new Date().toISOString(),
          isFirstPurchase: true
        };
        this.cartService.setCustomer(newCust);
      },
      error: (err) => {
        this.isRegisteringCustomer.set(false);
        const msg = err?.error?.message || err?.error?.error || 'Registration failed. Phone or email may already exist.';
        this.newCustError.set(msg);
      }
    });
  }

  selectCustomer(cust: Customer): void {
    this.cartService.setCustomer(cust);
    this.isCustomerModalOpen.set(false);
  }

  selectWalkIn(): void {
    this.cartService.setCustomer(null);
    this.isCustomerModalOpen.set(false);
  }

  applyCouponCode(): void {
    const raw = this.couponInput.trim();
    if (!raw) return;
    const validation = this.cartService.validateCoupon(raw);
    if (!validation.valid) {
      alert(validation.reason || 'Invalid coupon code');
      return;
    }
    this.cartService.setCoupon(raw);
    this.couponInput = '';
  }

  removeCoupon(): void {
    this.cartService.setCoupon('');
  }
}
