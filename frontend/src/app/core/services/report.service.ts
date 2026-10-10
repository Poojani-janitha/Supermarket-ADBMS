import { Injectable, signal } from '@angular/core';
import {
  ProductRankItem,
  DailySalesItem,
  MonthlyRollupRow,
  CategorySalesCteItem,
  DiscountImpactItem
} from '../models';

export type { ProductRankItem, DailySalesItem };

@Injectable({
  providedIn: 'root'
})
export class ReportService {
  // Top-level KPI summary cards
  readonly summaryMetrics = signal({
    todayRevenue: 4892.40,
    ordersCount: 148,
    discountsGiven: 430.50,
    lowStockAlerts: 2,
    movingAvg7Days: 4760.30,
    movingAvg30Days: 4520.15
  });

  // Member 4: SQL Window Function: RANK() OVER (ORDER BY revenue DESC)
  readonly productRankings = signal<ProductRankItem[]>([
    { rank: 1, productId: 2, productName: 'Original Chess Meat Burger With Chips', sku: 'PROD-BGR-002', unitsSold: 185, revenue: 4438.15 },
    { rank: 2, productId: 9, productName: 'Sri Lankan Keeri Samba Premium Rice 5kg', sku: 'PROD-GRO-009', unitsSold: 280, revenue: 3920.00 },
    { rank: 3, productId: 1, productName: 'Tasty Vegetable Salad Healthy Diet', sku: 'PROD-SAL-001', unitsSold: 160, revenue: 2878.40 },
    { rank: 4, productId: 8, productName: 'Italian Truffle Pasta Carbonara Parmigiano', sku: 'PROD-PAS-008', unitsSold: 125, revenue: 2437.50 },
    { rank: 5, productId: 5, productName: 'Fresh Orange Juice With Basil Seed No Sugar', sku: 'PROD-BEV-005', unitsSold: 152, revenue: 1974.48 },
    { rank: 6, productId: 10, productName: 'Farm Fresh Full Cream Milk 1L', sku: 'PROD-DRY-010', unitsSold: 310, revenue: 1178.00 },
    { rank: 7, productId: 11, productName: 'Organic Hass Avocados Pack (4pcs)', sku: 'PROD-PRD-011', unitsSold: 110, revenue: 979.00 }
  ]);

  // Member 4: Nightly precomputed view: v_daily_sales (from ev_daily_sales_summary)
  readonly dailySalesHistory = signal<DailySalesItem[]>([
    { date: '2026-10-10', branchName: 'Colombo Central Flagship', ordersCount: 148, totalSales: 4892.40 },
    { date: '2026-10-10', branchName: 'Kandy City Centre Branch', ordersCount: 98, totalSales: 3120.50 },
    { date: '2026-10-09', branchName: 'Colombo Central Flagship', ordersCount: 172, totalSales: 5410.80 },
    { date: '2026-10-09', branchName: 'Kandy City Centre Branch', ordersCount: 115, totalSales: 3650.00 },
    { date: '2026-10-08', branchName: 'Colombo Central Flagship', ordersCount: 165, totalSales: 5120.00 },
    { date: '2026-10-08', branchName: 'Kandy City Centre Branch', ordersCount: 104, totalSales: 3340.20 },
    { date: '2026-10-07', branchName: 'Colombo Central Flagship', ordersCount: 140, totalSales: 4325.50 },
    { date: '2026-10-06', branchName: 'Colombo Central Flagship', ordersCount: 188, totalSales: 6020.10 }
  ]);

  // Member 4: sp_monthly_report using GROUP BY branch_id, order_date WITH ROLLUP
  readonly monthlyRollupReport = signal<MonthlyRollupRow[]>([
    { branchId: 1, branchName: 'Colombo Central Flagship', orderDate: '2026-10-01', ordersCount: 135, totalRevenue: 4210.00, isBranchSubtotal: false, isGrandTotal: false },
    { branchId: 1, branchName: 'Colombo Central Flagship', orderDate: '2026-10-02', ordersCount: 142, totalRevenue: 4680.50, isBranchSubtotal: false, isGrandTotal: false },
    { branchId: 1, branchName: 'Colombo Central Flagship', orderDate: '2026-10-03', ordersCount: 156, totalRevenue: 5120.00, isBranchSubtotal: false, isGrandTotal: false },
    { branchId: 1, branchName: 'Colombo Central Flagship', orderDate: '2026-10-04', ordersCount: 160, totalRevenue: 5490.80, isBranchSubtotal: false, isGrandTotal: false },
    { branchId: 1, branchName: 'Colombo Central Flagship (Subtotal)', orderDate: null, ordersCount: 593, totalRevenue: 19501.30, isBranchSubtotal: true, isGrandTotal: false },

    { branchId: 2, branchName: 'Kandy City Centre Branch', orderDate: '2026-10-01', ordersCount: 92, totalRevenue: 2840.00, isBranchSubtotal: false, isGrandTotal: false },
    { branchId: 2, branchName: 'Kandy City Centre Branch', orderDate: '2026-10-02', ordersCount: 105, totalRevenue: 3190.20, isBranchSubtotal: false, isGrandTotal: false },
    { branchId: 2, branchName: 'Kandy City Centre Branch', orderDate: '2026-10-03', ordersCount: 110, totalRevenue: 3410.00, isBranchSubtotal: false, isGrandTotal: false },
    { branchId: 2, branchName: 'Kandy City Centre Branch (Subtotal)', orderDate: null, ordersCount: 307, totalRevenue: 9440.20, isBranchSubtotal: true, isGrandTotal: false },

    { branchId: 3, branchName: 'Galle Fort Supermarket', orderDate: '2026-10-01', ordersCount: 80, totalRevenue: 2350.00, isBranchSubtotal: false, isGrandTotal: false },
    { branchId: 3, branchName: 'Galle Fort Supermarket (Subtotal)', orderDate: null, ordersCount: 80, totalRevenue: 2350.00, isBranchSubtotal: true, isGrandTotal: false },

    { branchId: null, branchName: 'ALL BRANCHES CHAIN-WIDE (GRAND TOTAL)', orderDate: null, ordersCount: 980, totalRevenue: 31291.50, isBranchSubtotal: false, isGrandTotal: true }
  ]);

  // Member 4: sp_category_sales_cte (Common Table Expression Hierarchical Sales Analysis)
  readonly categorySalesCte = signal<CategorySalesCteItem[]>([
    { categoryId: 1, categoryName: 'Food & Groceries', parentCategory: 'Root', hierarchyLevel: 1, totalProductsSold: 1240, revenue: 14890.50, revenueSharePercent: 47.6 },
    { categoryId: 2, categoryName: 'Beverages & Juices', parentCategory: 'Food & Groceries', hierarchyLevel: 2, totalProductsSold: 610, revenue: 6420.00, revenueSharePercent: 20.5 },
    { categoryId: 3, categoryName: 'Dairy & Chilled', parentCategory: 'Food & Groceries', hierarchyLevel: 2, totalProductsSold: 580, revenue: 4980.20, revenueSharePercent: 15.9 },
    { categoryId: 4, categoryName: 'Bakery & Deli', parentCategory: 'Food & Groceries', hierarchyLevel: 2, totalProductsSold: 320, revenue: 3120.80, revenueSharePercent: 10.0 },
    { categoryId: 5, categoryName: 'Household & Cleaning', parentCategory: 'Root', hierarchyLevel: 1, totalProductsSold: 190, revenue: 1880.00, revenueSharePercent: 6.0 }
  ]);

  // Member 4: v_discount_impact (Financial Breakdown of Surrendered Revenue per Rule)
  readonly discountImpact = signal<DiscountImpactItem[]>([
    { ruleId: 1, ruleName: 'New Customer Welcome', ruleType: 'FIRST_PURCHASE', timesApplied: 64, totalDiscountAmount: 320.00, attributedSales: 3200.00, roiRatio: 10.0 },
    { ruleId: 2, ruleName: 'Holiday Weekend Rush', ruleType: 'HOLIDAY', timesApplied: 142, totalDiscountAmount: 568.00, attributedSales: 11360.00, roiRatio: 20.0 },
    { ruleId: 3, ruleName: 'Gold VIP Loyalty Reward', ruleType: 'LOYALTY', timesApplied: 89, totalDiscountAmount: 445.00, attributedSales: 6357.00, roiRatio: 14.3 },
    { ruleId: 4, ruleName: 'Super Saver Coupon (SAVE20)', ruleType: 'COUPON', timesApplied: 35, totalDiscountAmount: 175.00, attributedSales: 1750.00, roiRatio: 10.0 }
  ]);

  // Member 4: EXPLAIN ANALYZE Proof on 50,000+ orders dataset
  readonly explainBenchmark = signal({
    queryDescription: 'SELECT * FROM sales_order WHERE order_date BETWEEN ? AND ? AND branch_id = ?',
    datasetSize: '52,430 rows in sales_order',
    beforeOptimization: {
      scanType: 'ALL (Full Table Scan)',
      cost: '10,845.20',
      executionTimeMs: 142.6,
      rowsExamined: 52430
    },
    afterOptimization: {
      indexUsed: 'idx_order_branch_date (branch_id, order_date)',
      scanType: 'ref / range (Clustered Composite Index)',
      cost: '21.40',
      executionTimeMs: 1.8,
      rowsExamined: 148,
      improvementFactor: '79x faster (98.7% latency reduction)'
    }
  });
}
