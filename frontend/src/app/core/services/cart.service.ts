import { Injectable, signal, computed, inject } from '@angular/core';
import { CartItem, Product, AppliedDiscount, SalesOrder, Customer } from '../models';
import { AuthService } from './auth.service';
import { ProductService } from './product.service';

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
  private readonly authService = inject(AuthService);
  private readonly productService = inject(ProductService);

  // Cart line items
  readonly cartItems = signal<CartItem[]>([]);

  // Register information
  readonly registerTitle = signal<string>('Checkout Counter #02');

  // Customer Loyalty selection (Walk-in by default, or linked customer)
  readonly selectedCustomer = signal<Customer | null>({
    id: 1,
    fullName: 'Jacob Jones',
    phone: '0771234567',
    loyaltyPoints: 420,
    tier: 'GOLD',
    registeredDate: '2023-01-15'
  });

  // Coupon code
  readonly appliedCoupon = signal<string>('NEWYEAR50');

  // Payment method
  readonly paymentMethod = signal<'CASH' | 'CARD' | 'QR'>('CARD');

  // Cash tendered for cash transactions
  readonly cashTendered = signal<number>(30.00);

  // Dynamic Held Suspended Carts
  readonly heldCarts = signal<HeldCart[]>([
    {
      id: 1041,
      tag: 'H1',
      customerName: 'Bessie Coleman',
      items: [],
      itemCount: 3,
      subtotal: 18.50,
      timestamp: '14:22'
    },
    {
      id: 1042,
      tag: 'H2',
      customerName: 'Ralph Edwards',
      items: [],
      itemCount: 2,
      subtotal: 9.30,
      timestamp: '14:38'
    }
  ]);

  // Modal controls
  readonly isReceiptOpen = signal<boolean>(false);
  readonly lastCompletedOrder = signal<SalesOrder | null>(null);

  constructor() {
    // Initial supermarket cart items
    const all = this.productService.products();
    if (all.length >= 4) {
      this.cartItems.set([
        { product: all[1], quantity: 1, lineTotal: all[1].unitPrice }, // Keeri Samba Rice ($14.50)
        { product: all[2], quantity: 2, lineTotal: Number((all[2].unitPrice * 2).toFixed(2)) }, // Milk ($5.60)
        { product: all[0], quantity: 1, lineTotal: all[0].unitPrice }, // Avocados ($5.99)
        { product: all[4], quantity: 1, lineTotal: all[4].unitPrice }  // Ceylon Tea ($4.80)
      ]);
    }
  }

  // Reactive Subtotal
  readonly subtotal = computed(() => {
    return Number(this.cartItems().reduce((sum, item) => sum + item.lineTotal, 0).toFixed(2));
  });

  // Reactive discount calculation mirroring MySQL sp_apply_discounts
  readonly discounts = computed<AppliedDiscount[]>(() => {
    const sub = this.subtotal();
    if (sub <= 0) return [];

    const list: AppliedDiscount[] = [];
    let runningDiscount = 0;
    const cust = this.selectedCustomer();

    // Rule 1: Loyalty Tier Discount (fn_customer_tier)
    if (cust) {
      if (cust.tier === 'GOLD') {
        const amt = Number((sub * 0.07).toFixed(2));
        list.push({ ruleId: 3, ruleName: 'Gold Loyalty (7%)', amount: amt });
        runningDiscount += amt;
      } else if (cust.tier === 'SILVER') {
        const amt = Number((sub * 0.05).toFixed(2));
        list.push({ ruleId: 4, ruleName: 'Silver Loyalty (5%)', amount: amt });
        runningDiscount += amt;
      } else if (cust.tier === 'BRONZE') {
        const amt = Number((sub * 0.10).toFixed(2));
        list.push({ ruleId: 1, ruleName: 'Welcome Bronze (10%)', amount: amt });
        runningDiscount += amt;
      }
    }

    // Rule 2: Holiday Special (5% off from fn_is_holiday)
    const holidayAmt = Number((sub * 0.05).toFixed(2));
    list.push({ ruleId: 2, ruleName: 'Holiday Special (5%)', amount: holidayAmt });
    runningDiscount += holidayAmt;

    // Rule 3: Valid Coupon Code (fn_coupon_valid)
    const couponCode = this.appliedCoupon().trim().toUpperCase();
    if (couponCode === 'NEWYEAR50') {
      const couponAmt = 3.00;
      list.push({ ruleId: 5, ruleName: 'Coupon NEWYEAR50', amount: couponAmt });
      runningDiscount += couponAmt;
    } else if (couponCode === 'SAVE20') {
      const couponAmt = Number((sub * 0.10).toFixed(2));
      list.push({ ruleId: 6, ruleName: 'Coupon SAVE20', amount: couponAmt });
      runningDiscount += couponAmt;
    }

    // Enforce 50% Hard Cap: LEAST(total, subtotal * 0.5)
    const maxAllowed = sub * 0.5;
    if (runningDiscount > maxAllowed) {
      return [{ ruleId: 99, ruleName: 'Discounts Capped at 50%', amount: Number(maxAllowed.toFixed(2)) }];
    }

    return list;
  });

  readonly discountTotal = computed(() => {
    return Number(this.discounts().reduce((sum, d) => sum + d.amount, 0).toFixed(2));
  });

  // Tax 5% VAT
  readonly taxAmount = computed(() => {
    const taxable = Math.max(0, this.subtotal() - this.discountTotal());
    return Number((taxable * 0.05).toFixed(2));
  });

  // Total Amount
  readonly totalAmount = computed(() => {
    const total = this.subtotal() - this.discountTotal() + this.taxAmount();
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
        // Check stock availability
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

      // Check stock availability
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
  }

  setCustomer(cust: Customer | null): void {
    this.selectedCustomer.set(cust);
  }

  setPaymentMethod(method: 'CASH' | 'CARD' | 'QR'): void {
    this.paymentMethod.set(method);
    if (method === 'CASH') {
      this.cashTendered.set(Math.ceil(this.totalAmount() / 5) * 5 || this.totalAmount());
    }
  }

  setCashTendered(val: number): void {
    this.cashTendered.set(Number(val.toFixed(2)));
  }

  setCoupon(code: string): void {
    this.appliedCoupon.set(code);
  }

  // Hold active cart
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

  // Resume suspended held cart
  resumeHeldCart(heldId: number): void {
    const held = this.heldCarts().find(h => h.id === heldId);
    if (!held) return;

    // Put current cart on hold if it has items
    if (this.cartItems().length > 0) {
      this.holdCurrentCart();
    }

    if (held.items.length > 0) {
      this.cartItems.set(held.items);
    } else {
      // Mock items for pre-seeded held cart
      const all = this.productService.products();
      this.cartItems.set([
        { product: all[0], quantity: 2, lineTotal: Number((all[0].unitPrice * 2).toFixed(2)) },
        { product: all[3], quantity: 1, lineTotal: all[3].unitPrice }
      ]);
    }

    // Remove from held carts
    this.heldCarts.update(prev => prev.filter(h => h.id !== heldId));
  }

  removeHeldCart(heldId: number): void {
    this.heldCarts.update(prev => prev.filter(h => h.id !== heldId));
  }

  // Complete checkout
  placeOrder(): SalesOrder | null {
    if (this.cartItems().length === 0) return null;

    const cust = this.selectedCustomer();
    const orderNumber = Math.floor(10000 + Math.random() * 90000);
    const order: SalesOrder = {
      orderId: orderNumber,
      branchId: 1,
      branchName: 'Colombo Central Flagship',
      customerId: cust ? cust.id : undefined,
      customerName: cust ? cust.fullName : 'Walk-in Shopper',
      customerPhone: cust ? cust.phone : undefined,
      customerTier: cust ? cust.tier : undefined,
      employeeId: this.authService.currentUser().employeeId,
      employeeName: this.authService.currentUser().fullName,
      orderDate: new Date().toLocaleString(),
      status: 'COMPLETED',
      subtotal: this.subtotal(),
      discountTotal: this.discountTotal(),
      taxAmount: this.taxAmount(),
      totalAmount: this.totalAmount(),
      paymentMethod: this.paymentMethod(),
      items: [...this.cartItems()],
      discounts: [...this.discounts()]
    };

    // Deduct stock in catalog
    order.items.forEach(item => {
      this.productService.decrementStock(item.product.id, item.quantity);
    });

    this.lastCompletedOrder.set(order);
    this.isReceiptOpen.set(true);
    this.cartItems.set([]);
    return order;
  }

  closeReceipt(): void {
    this.isReceiptOpen.set(false);
  }
}
