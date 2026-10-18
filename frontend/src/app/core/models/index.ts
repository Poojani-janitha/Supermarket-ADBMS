export interface Category {
  id: number;
  name: string;
  icon: string;
  itemCount: number;
}

export interface Product {
  id: number;
  name: string;
  sku: string;
  unitPrice: number;
  costPrice: number;
  categoryId: number;
  categoryName: string;
  supplierId?: number;
  supplierName?: string;
  isActive: boolean;
  imageUrl: string;
  dietType?: 'VEG' | 'NON_VEG';
  unitOfMeasure?: 'KG' | 'G' | 'L' | 'ML' | 'PACKET' | 'PIECE' | 'CAN' | 'BOTTLE';
  minOrderQty?: number;
  discountBadge?: string;
  stockQty: number;
}

export interface CartItem {
  product: Product;
  quantity: number;
  lineTotal: number;
}

export interface AppliedDiscount {
  ruleId: number;
  ruleName: string;
  amount: number;
}

export interface Customer {
  id: number;
  fullName: string;
  phone: string;
  email?: string;
  loyaltyPoints: number;
  tier: 'BRONZE' | 'SILVER' | 'GOLD';
  registeredDate: string;
}

export interface DiscountRule {
  ruleId: number;
  name: string;
  ruleType: 'FIRST_PURCHASE' | 'HOLIDAY' | 'LOYALTY' | 'COUPON';
  kind: 'PERCENT' | 'FIXED';
  value: number;
  minOrderAmount: number;
  maxDiscount?: number;
  tier?: string;
  startDate: string;
  endDate: string;
  priority: number;
  stackable: boolean;
  isActive: boolean;
}

export interface Coupon {
  code: string;
  ruleId: number;
  ruleName?: string;
  maxUses: number;
  usedCount: number;
  expiresOn: string;
}

export interface Holiday {
  holidayDate: string;
  name: string;
}

export interface InventoryItem {
  branchId: number;
  branchName: string;
  productId: number;
  productName: string;
  sku: string;
  quantity: number;
  reorderLevel: number;
  unitOfMeasure: 'KG' | 'G' | 'L' | 'ML' | 'PACKET' | 'PIECE' | 'CAN' | 'BOTTLE';
  version: number;
  isLowStock: boolean;
}

export interface LowStockAlert {
  alertId: number;
  branchId: number;
  branchName: string;
  productId: number;
  productName: string;
  quantity: number;
  unitOfMeasure?: string;
  createdAt: string;
  resolved: boolean;
}

export interface Supplier {
  supplierId: number;
  name: string;
  contactPerson?: string;
  phone: string;
  email?: string;
  username?: string;
  city: string;
  taxNumber?: string;
  isActive: boolean;
  status: 'PENDING_APPROVAL' | 'ACTIVE' | 'SUSPENDED';
}

export interface PurchaseOrder {
  poId: number;
  supplierId: number;
  supplierName: string;
  branchId: number;
  branchName: string;
  productId: number;
  productName: string;
  sku: string;
  unitOfMeasure: string;
  requestedQty: number;
  confirmedQty?: number;
  receivedQty?: number;
  unitCost: number;
  totalCost: number;
  status: 'REQUESTED' | 'CONFIRMED' | 'RECEIVED' | 'CANCELLED';
  orderDate: string;
  confirmedAt?: string;
  receivedAt?: string;
  supplierNotes?: string;
  receivingNotes?: string;
  requestedBy?: string;
  receivedBy?: string;
}


export interface Employee {
  employeeId: number;
  branchId: number;
  branchName: string;
  fullName: string;
  role: 'ADMIN' | 'MANAGER' | 'CASHIER' | 'SUPPLIER';
  username: string;
  hireDate: string;
  isActive: boolean;
  supplierId?: number;
}

export interface EmployeeAuditLog {
  logId: number;
  employeeId: number;
  employeeName: string;
  action: 'ROLE_CHANGE' | 'BRANCH_TRANSFER' | 'DEACTIVATE' | 'REACTIVATE' | 'REGISTER';
  oldValue: string;
  newValue: string;
  modifiedBy: string;
  modifiedAt: string;
}

export interface SecurityEventLog {
  logId: number;
  eventType: 'LOGIN_SUCCESS' | 'LOGIN_FAILURE' | 'ROLE_ASSIGN' | 'UNAUTHORIZED_ACCESS' | 'EMPLOYEE_DEACTIVATED' | 'EMPLOYEE_REGISTERED' | 'DATABASE_BACKUP_CREATED';
  description: string;
  username: string;
  ipAddress: string;
  createdAt: string;
}

export interface BackupInfo {
  fileName: string;
  filePath: string;
  fileSizeKb: number;
  createdAt: string;
  binlogCoordinate: string;
  status: string;
  message: string;
}

export interface MonthlyRollupRow {
  branchId: number | null;
  branchName: string;
  orderDate: string | null;
  ordersCount: number;
  totalRevenue: number;
  isBranchSubtotal: boolean;
  isGrandTotal: boolean;
}

export interface CategorySalesCteItem {
  categoryId: number;
  categoryName: string;
  parentCategory: string;
  hierarchyLevel: number;
  totalProductsSold: number;
  revenue: number;
  revenueSharePercent: number;
}

export interface DiscountImpactItem {
  ruleId: number;
  ruleName: string;
  ruleType: string;
  timesApplied: number;
  totalDiscountAmount: number;
  attributedSales: number;
  roiRatio: number;
}

export interface ProductRankItem {
  rank: number;
  productId: number;
  productName: string;
  sku: string;
  unitsSold: number;
  revenue: number;
}

export interface DailySalesItem {
  date: string;
  branchName: string;
  ordersCount: number;
  totalSales: number;
}

export interface SalesOrder {
  orderId: number;
  branchId: number;
  branchName?: string;
  customerId?: number;
  customerName?: string;
  customerPhone?: string;
  customerTier?: string;
  employeeId: number;
  employeeName?: string;
  orderDate: string;
  status: 'COMPLETED' | 'CANCELLED';
  subtotal: number;
  discountTotal: number;
  taxAmount: number;
  totalAmount: number;
  paymentMethod: 'CASH' | 'CARD' | 'QR';
  items: CartItem[];
  discounts: AppliedDiscount[];
}
