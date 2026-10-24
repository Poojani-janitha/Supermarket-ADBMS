import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CartItem, Product, AppliedDiscount, SalesOrder, Customer } from '../models';
import { AuthService } from './auth.service';
import { ProductService } from './product.service';
import { DiscountService } from './discount.service';
import { CustomerService } from './customer.service';

export interface HeldCart {
  id: number;
  tag: string;
  customerName: string;
  items: CartItem[];
  itemCount: number;
  subtotal: number;
  timestamp: string;
}

@Injectable({
  providedIn: 'root'
})
export class CartService {
  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthService);
  private readonly productService = inject(ProductService);
  private readonly discountService = inject(DiscountService);
  private readonly customerService = inject(CustomerService);

  // Cart line items (initialized empty)
  readonly cartItems = signal<CartItem[]>([]);

  // Register information
  readonly registerTitle = signal<string>('Checkout Counter #02');

  // Customer Loyalty selection (Walk-in by default, loaded dynamically from DB when selected)
  readonly selectedCustomer = signal<Customer | null>(null);

  // Coupon code
  readonly appliedCoupon = signal<string>('');

  // Payment method (Cash only mode)
  readonly paymentMethod = signal<'CASH'>('CASH');

  // Cash tendered for cash transactions
  readonly cashTendered = signal<number>(0.00);

  // Dynamic Held Suspended Carts
  readonly heldCarts = signal<HeldCart[]>([]);

  // Modal controls
  readonly isReceiptOpen = signal<boolean>(false);
  readonly lastCompletedOrder = signal<SalesOrder | null>(null);
  readonly isSubmitting = signal<boolean>(false);
  readonly checkoutError = signal<string | null>(null);

  constructor() {
    // Zero hardcoded items: cart starts completely clean
  }

  // Reactive Subtotal
  readonly subtotal = computed(() => {
    return Number(this.cartItems().reduce((sum, item) => sum + item.lineTotal, 0).toFixed(2));
  });

  // Reactive preview discounts
  readonly discounts = computed<AppliedDiscount[]>(() => {
    const sub = this.subtotal();
    if (sub <= 0) return [];

    const list: AppliedDiscount[] = [];
    let runningDiscount = 0;
    const cust = this.selectedCustomer();

    if (cust) {
      if (cust.tier === 'GOLD' && sub >= 1000) {
        const amt = Number((sub * 0.07).toFixed(2));
        list.push({ ruleId: 21, ruleName: 'Gold Tier (7% Rule Discount)', amount: amt });
        runningDiscount += amt;
      } else if (cust.tier === 'SILVER' && sub >= 500) {
        const amt = Number((sub * 0.05).toFixed(2));
        list.push({ ruleId: 20, ruleName: 'Silver Tier (5% Rule Discount)', amount: amt });
        runningDiscount += amt;
      } else if (cust.isFirstPurchase) {
        // Welcome 10% First Purchase discount - strictly only for newly registered customers
        const welcomeRule = this.discountService.rules().find(r => r.ruleType === 'FIRST_PURCHASE');
        const ruleId = welcomeRule ? welcomeRule.ruleId : 1;
        const ruleName = welcomeRule ? welcomeRule.name : 'Welcome 10% Discount';
        const pct = welcomeRule && welcomeRule.value ? welcomeRule.value : 10;
        let amt = Number((sub * (pct / 100)).toFixed(2));
        if (welcomeRule?.maxDiscount && welcomeRule.maxDiscount > 0) {
          amt = Math.min(amt, welcomeRule.maxDiscount);
        }
        list.push({ ruleId, ruleName, amount: amt });
        runningDiscount += amt;
      }
    }

    const couponCode = this.appliedCoupon().trim().toUpperCase();
    if (couponCode) {
      const c = this.discountService.coupons().find(cp => cp.code.toUpperCase() === couponCode);
      if (c && c.isActive !== false) {
        const today = new Date().toISOString().slice(0, 10);
        const isExpired = c.expiresOn && c.expiresOn < today;
        const maxUsesReached = c.maxUses > 0 && c.usedCount >= c.maxUses;
        const minOrder = c.minOrderAmount ?? 0;

        if (!isExpired && !maxUsesReached && sub >= minOrder) {
          let couponAmt = 0;
          if (c.kind === 'FIXED') {
            couponAmt = c.value ?? 0;
          } else {
            const pct = c.value ?? 10;
            couponAmt = Number((sub * (pct / 100)).toFixed(2));
          }
          if (c.maxDiscount && c.maxDiscount > 0) {
            couponAmt = Math.min(couponAmt, c.maxDiscount);
          }
          if (couponAmt > 0) {
            list.push({
              ruleId: c.ruleId,
              ruleName: c.ruleName || `Coupon ${c.code}`,
              amount: Number(couponAmt.toFixed(2))
            });
            runningDiscount += couponAmt;
          }
        }
      } else if (couponCode === 'NEWYEAR50' && sub >= 30.00) {
        const couponAmt = 10.00;
        list.push({ ruleId: 4, ruleName: 'Coupon NEWYEAR50', amount: couponAmt });
        runningDiscount += couponAmt;
      } else if (couponCode === 'WELCOME10' && sub >= 20.00) {
        const couponAmt = Math.min(Number((sub * 0.10).toFixed(2)), 15.00);
        list.push({ ruleId: 1, ruleName: 'Coupon WELCOME10 (10%)', amount: couponAmt });
        runningDiscount += couponAmt;
      }
    }

    const maxAllowed = sub * 0.50;
    if (runningDiscount > maxAllowed) {
      return [{ ruleId: 99, ruleName: 'Discounts Capped at 50%', amount: Number(maxAllowed.toFixed(2)) }];
    }

    return list;
  });

  readonly discountTotal = computed(() => {
    return Number(this.discounts().reduce((sum, d) => sum + d.amount, 0).toFixed(2));
  });

  // Tax (VAT removed per requirement)
  readonly taxAmount = computed(() => 0.00);

  // Total Amount (Subtotal minus Discounts)
  readonly totalAmount = computed(() => {
    const total = this.subtotal() - this.discountTotal();
    return Number(Math.max(0, total).toFixed(2));
  });

  // Change due when paying cash
  readonly changeDue = computed(() => {
    const tendered = this.cashTendered();
    const total = this.totalAmount();
    return Number(Math.max(0, tendered - total).toFixed(2));
  });

  getItemQty(productId: number): number {
    const item = this.cartItems().find(i => i.product.id === productId);
    return item ? item.quantity : 0;
  }

  addItem(product: Product): void {
    if (product.stockQty <= 0) return;

    this.cartItems.update(items => {
      const existing = items.find(i => i.product.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stockQty) return items;
        return items.map(i =>
          i.product.id === product.id
            ? { ...i, quantity: i.quantity + 1, lineTotal: Number(((i.quantity + 1) * i.product.unitPrice).toFixed(2)) }
            : i
        );
      } else {
        return [...items, { product, quantity: 1, lineTotal: product.unitPrice }];
      }
    });
  }

  updateQuantity(productId: number, delta: number): void {
    this.cartItems.update(items => {
      const existing = items.find(i => i.product.id === productId);
      if (!existing) return items;

      const newQty = existing.quantity + delta;
      if (newQty <= 0) {
        return items.filter(i => i.product.id !== productId);
      }

      if (delta > 0 && newQty > existing.product.stockQty) {
        return items;
      }

      return items.map(i =>
        i.product.id === productId
          ? { ...i, quantity: newQty, lineTotal: Number((newQty * i.product.unitPrice).toFixed(2)) }
          : i
      );
    });
  }

  removeItem(productId: number): void {
    this.cartItems.update(items => items.filter(i => i.product.id !== productId));
  }

  clearCart(): void {
    this.cartItems.set([]);
    this.checkoutError.set(null);
  }

  setCustomer(cust: Customer | null): void {
    this.selectedCustomer.set(cust);
  }

  setPaymentMethod(method: 'CASH'): void {
    this.paymentMethod.set(method);
    this.cashTendered.set(Math.ceil(this.totalAmount() / 5) * 5 || this.totalAmount());
  }

  setCashTendered(val: number): void {
    this.cashTendered.set(Number(val.toFixed(2)));
  }

  setCoupon(code: string): void {
    this.appliedCoupon.set(code);
  }

  validateCoupon(rawCode: string): { valid: boolean; reason?: string } {
    const code = rawCode.trim().toUpperCase();
    if (!code) return { valid: false, reason: 'Please enter a coupon code.' };

    const c = this.discountService.coupons().find(cp => cp.code.toUpperCase() === code);
    if (!c) {
      if (code === 'NEWYEAR50' || code === 'WELCOME10') {
        return { valid: true };
      }
      return { valid: false, reason: `Coupon "${code}" is invalid or does not exist.` };
    }

    if (c.isActive === false) {
      return { valid: false, reason: `Coupon "${code}" is no longer active.` };
    }

    const today = new Date().toISOString().slice(0, 10);
    if (c.expiresOn && c.expiresOn < today) {
      return { valid: false, reason: `Coupon "${code}" expired on ${c.expiresOn}.` };
    }

    if (c.maxUses > 0 && c.usedCount >= c.maxUses) {
      return { valid: false, reason: `Coupon "${code}" has reached its maximum usage limit (${c.maxUses} uses).` };
    }

    const minOrder = c.minOrderAmount ?? 0;
    if (this.subtotal() < minOrder) {
      return {
        valid: false,
        reason: `Coupon "${code}" requires a minimum order amount of Rs. ${minOrder.toFixed(2)}. Current subtotal is Rs. ${this.subtotal().toFixed(2)}.`
      };
    }

    return { valid: true };
  }

  holdCurrentCart(): void {
    if (this.cartItems().length === 0) return;

    const newTag = `H${this.heldCarts().length + 1}`;
    const custName = this.selectedCustomer()?.fullName || 'Walk-in Customer';
    const held: HeldCart = {
      id: Math.floor(1000 + Math.random() * 9000),
      tag: newTag,
      customerName: custName,
      items: [...this.cartItems()],
      itemCount: this.cartItems().reduce((s, i) => s + i.quantity, 0),
      subtotal: this.subtotal(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    this.heldCarts.update(prev => [...prev, held]);
    this.cartItems.set([]);
  }

  resumeHeldCart(heldId: number): void {
    const held = this.heldCarts().find(h => h.id === heldId);
    if (!held) return;

    if (this.cartItems().length > 0) {
      this.holdCurrentCart();
    }

    this.cartItems.set(held.items);
    this.heldCarts.update(prev => prev.filter(h => h.id !== heldId));
  }

  removeHeldCart(heldId: number): void {
    this.heldCarts.update(prev => prev.filter(h => h.id !== heldId));
  }

  // REAL DATABASE CHECKOUT VIA POST /api/orders
  placeOrder(): void {
    if (this.cartItems().length === 0 || this.isSubmitting()) return;

    this.isSubmitting.set(true);
    this.checkoutError.set(null);

    const cust = this.selectedCustomer();
    const currentEmp = this.authService.currentUser();

    const payload = {
      branchId: currentEmp?.branchId || 1,
      customerId: cust ? cust.id : null,
      employeeId: currentEmp?.employeeId || 3,
      paymentMethod: this.paymentMethod(),
      couponCode: this.appliedCoupon().trim() || null,
      items: this.cartItems().map(i => ({
        productId: i.product.id,
        quantity: i.quantity,
        unitPrice: i.product.unitPrice
      }))
    };

    this.http.post<SalesOrder>('/api/orders', payload).subscribe({
      next: (savedOrder) => {
        this.isSubmitting.set(false);
        this.lastCompletedOrder.set(savedOrder);
        this.isReceiptOpen.set(true);
        this.cartItems.set([]);
        // Reload live inventory from MySQL
        this.productService.loadProducts();
        // Reload live customers so loyalty points and directory update immediately
        this.customerService.loadCustomers();

        if (cust) {
          const earnedPts = Math.floor(savedOrder.totalAmount / 100);
          const newPts = (cust.loyaltyPoints || 0) + earnedPts;
          const newTier = newPts >= 1000 ? 'GOLD' : newPts >= 500 ? 'SILVER' : 'BRONZE';
          this.selectedCustomer.set({
            ...cust,
            loyaltyPoints: newPts,
            tier: newTier,
            isFirstPurchase: false
          });
        }

        this.http.get<Record<string, number>>('/api/orders/stock?branchId=1').subscribe({
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
      },
      error: (err) => {
        this.isSubmitting.set(false);
        const errMsg = err?.error?.message || err?.error?.error || 'Checkout failed. Please check stock and try again.';
        this.checkoutError.set(errMsg);
        alert(`Checkout Failed: ${errMsg}`);
      }
    });
  }

  closeReceipt(): void {
    this.isReceiptOpen.set(false);
  }
}
