import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReportService } from '../../../../core/services/report.service';

@Component({
  selector: 'app-reports-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="page-container">
      <!-- Header -->
      <div class="page-header">
        <div>
          <h1 class="page-title">Executive Sales Analytics & Performance</h1>
          <p class="page-subtitle">
            Managed by Member 4 | Window Functions (RANK) | Procedures: sp_monthly_report (WITH ROLLUP), sp_category_sales_cte | 50k+ Rows Indexing
          </p>
        </div>
      </div>

      <!-- Tab Switcher -->
      <div class="nav-tabs-bar">
        <button
          class="tab-btn"
          [class.active]="activeTab() === 'RANKINGS'"
          (click)="activeTab.set('RANKINGS')"
        >
          <span class="material-symbols-outlined">leaderboard</span>
          Leaderboard & Daily Sales (v_product_ranking)
        </button>
        <button
          class="tab-btn"
          [class.active]="activeTab() === 'ROLLUP'"
          (click)="activeTab.set('ROLLUP')"
        >
          <span class="material-symbols-outlined">table_chart</span>
          Monthly Branch Rollup (sp_monthly_report WITH ROLLUP)
        </button>
        <button
          class="tab-btn"
          [class.active]="activeTab() === 'CTE'"
          (click)="activeTab.set('CTE')"
        >
          <span class="material-symbols-outlined">account_tree</span>
          Category Hierarchical Sales (sp_category_sales_cte)
        </button>
        <button
          class="tab-btn"
          [class.active]="activeTab() === 'OPTIMIZATION'"
          (click)="activeTab.set('OPTIMIZATION')"
        >
          <span class="material-symbols-outlined">speed</span>
          Discount Impact & EXPLAIN Benchmarks (50k Rows)
        </button>
      </div>

      <!-- KPI Metrics Cards (Always visible across all tabs) -->
      <div class="kpi-grid">
        <div class="kpi-card">
          <div class="kpi-icon-box green">
            <span class="material-symbols-outlined">payments</span>
          </div>
          <div class="kpi-info">
            <span class="kpi-label">Today's Total Sales</span>
            <span class="kpi-val">Rs. {{ reportService.summaryMetrics().todayRevenue.toFixed(2) }}</span>
            <span class="kpi-sub green">+12.4% vs last week</span>
          </div>
        </div>

        <div class="kpi-card">
          <div class="kpi-icon-box blue">
            <span class="material-symbols-outlined">receipt_long</span>
          </div>
          <div class="kpi-info">
            <span class="kpi-label">Completed Orders</span>
            <span class="kpi-val">{{ reportService.summaryMetrics().ordersCount }}</span>
            <span class="kpi-sub">Across 4 Branches</span>
          </div>
        </div>

        <div class="kpi-card">
          <div class="kpi-icon-box orange">
            <span class="material-symbols-outlined">savings</span>
          </div>
          <div class="kpi-info">
            <span class="kpi-label">Discounts Awarded</span>
            <span class="kpi-val">Rs. {{ reportService.summaryMetrics().discountsGiven.toFixed(2) }}</span>
            <span class="kpi-sub">v_discount_impact</span>
          </div>
        </div>

        <div class="kpi-card">
          <div class="kpi-icon-box emerald">
            <span class="material-symbols-outlined">monitoring</span>
          </div>
          <div class="kpi-info">
            <span class="kpi-label">7-Day Moving Average</span>
            <span class="kpi-val">Rs. {{ reportService.summaryMetrics().movingAvg7Days.toFixed(2) }}</span>
            <span class="kpi-sub green">fn_avg_daily_sales(branch, 7)</span>
          </div>
        </div>
      </div>

      <!-- ================= TAB 1: RANKINGS & DAILY SALES ================= -->
      @if (activeTab() === 'RANKINGS') {
        <div class="grid-2-col">
          <!-- Product Rankings via SQL Window Function -->
          <div class="section-card">
            <div class="card-title-row">
              <span class="material-symbols-outlined" style="color: var(--primary-green);">trophy</span>
              <div>
                <h3>Product Ranking Leaderboard (v_product_ranking)</h3>
                <p class="card-meta">Calculated via SQL Window Function: RANK() OVER (ORDER BY revenue DESC)</p>
              </div>
            </div>

            <table class="data-table">
              <thead>
                <tr>
                  <th>RANK</th>
                  <th>PRODUCT</th>
                  <th>UNITS SOLD</th>
                  <th style="text-align: right;">TOTAL REVENUE</th>
                </tr>
              </thead>
              <tbody>
                @for (item of reportService.productRankings(); track item.productId) {
                  <tr>
                    <td>
                      <span class="rank-badge" [class.top3]="item.rank <= 3">#{{ item.rank }}</span>
                    </td>
                    <td>
                      <strong>{{ item.productName }}</strong><br>
                      <span class="code-sku">{{ item.sku }}</span>
                    </td>
                    <td>{{ item.unitsSold }} units</td>
                    <td style="text-align: right;">
                      <span class="rev-val">Rs. {{ item.revenue.toFixed(2) }}</span>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>

          <!-- Daily Sales Summary Table -->
          <div class="section-card">
            <div class="card-title-row">
              <span class="material-symbols-outlined" style="color: #3b82f6;">calendar_month</span>
              <div>
                <h3>Daily Sales Summary (v_daily_sales)</h3>
                <p class="card-meta">Precomputed nightly by MySQL scheduled event: ev_daily_sales_summary</p>
              </div>
            </div>

            <table class="data-table">
              <thead>
                <tr>
                  <th>DATE</th>
                  <th>BRANCH</th>
                  <th>ORDERS</th>
                  <th style="text-align: right;">REVENUE</th>
                </tr>
              </thead>
              <tbody>
                @for (day of reportService.dailySalesHistory(); track day.date + '-' + day.branchName) {
                  <tr>
                    <td><span class="date-badge">{{ day.date }}</span></td>
                    <td>{{ day.branchName }}</td>
                    <td>{{ day.ordersCount }}</td>
                    <td style="text-align: right;">
                      <strong>Rs. {{ day.totalSales.toFixed(2) }}</strong>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      }

      <!-- ================= TAB 2: MONTHLY ROLLUP REPORT ================= -->
      @if (activeTab() === 'ROLLUP') {
        <div class="section-card">
          <div class="card-title-row">
            <span class="material-symbols-outlined" style="color: var(--primary-green);">pivot_table_chart</span>
            <div>
              <h3>Monthly Sales with Subtotals & Grand Totals (sp_monthly_report)</h3>
              <p class="card-meta">Aggregated inside MySQL using: GROUP BY branch_id, order_date WITH ROLLUP</p>
            </div>
          </div>

          <table class="data-table rollup-table">
            <thead>
              <tr>
                <th>BRANCH NAME</th>
                <th>ORDER DATE</th>
                <th>TOTAL ORDERS</th>
                <th style="text-align: right;">NET SALES REVENUE</th>
                <th style="text-align: center;">AGGREGATION LEVEL</th>
              </tr>
            </thead>
            <tbody>
              @for (row of reportService.monthlyRollupReport(); track $index) {
                <tr
                  [class.branch-subtotal-row]="row.isBranchSubtotal"
                  [class.grand-total-row]="row.isGrandTotal"
                >
                  <td>
                    @if (row.isGrandTotal) {
                      <strong>{{ row.branchName }}</strong>
                    } @else if (row.isBranchSubtotal) {
                      <strong>&Sigma; {{ row.branchName }}</strong>
                    } @else {
                      {{ row.branchName }}
                    }
                  </td>
                  <td>
                    @if (row.orderDate) {
                      <span class="date-badge">{{ row.orderDate }}</span>
                    } @else {
                      <span class="rollup-badge">NULL (ROLLUP)</span>
                    }
                  </td>
                  <td><strong>{{ row.ordersCount }} orders</strong></td>
                  <td style="text-align: right;">
                    <span class="rev-val" [class.highlight-grand]="row.isGrandTotal">
                      Rs. {{ row.totalRevenue.toFixed(2) }}
                    </span>
                  </td>
                  <td style="text-align: center;">
                    @if (row.isGrandTotal) {
                      <span class="badge-pill badge-grand">CHAIN GRAND TOTAL</span>
                    } @else if (row.isBranchSubtotal) {
                      <span class="badge-pill badge-subtotal">BRANCH SUB-TOTAL</span>
                    } @else {
                      <span class="badge-pill badge-detail">DAILY RECORD</span>
                    }
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }

      <!-- ================= TAB 3: CATEGORY CTE ================= -->
      @if (activeTab() === 'CTE') {
        <div class="section-card">
          <div class="card-title-row">
            <span class="material-symbols-outlined" style="color: #0284c7;">account_tree</span>
            <div>
              <h3>Hierarchical Category Sales Breakdown (sp_category_sales_cte)</h3>
              <p class="card-meta">Executed via Common Table Expressions (WITH RECURSIVE CategorySales AS (...))</p>
            </div>
          </div>

          <table class="data-table">
            <thead>
              <tr>
                <th>HIERARCHY LEVEL</th>
                <th>CATEGORY NAME</th>
                <th>PARENT CATEGORY</th>
                <th>UNITS SOLD</th>
                <th>SALES REVENUE</th>
                <th>CHAIN REVENUE SHARE</th>
              </tr>
            </thead>
            <tbody>
              @for (cte of reportService.categorySalesCte(); track cte.categoryId) {
                <tr>
                  <td>
                    <span class="level-indicator level-{{ cte.hierarchyLevel }}">
                      Level {{ cte.hierarchyLevel }}
                    </span>
                  </td>
                  <td>
                    <strong [style.margin-left.px]="(cte.hierarchyLevel - 1) * 20">
                      {{ cte.categoryName }}
                    </strong>
                  </td>
                  <td><span class="code-sku">{{ cte.parentCategory }}</span></td>
                  <td>{{ cte.totalProductsSold }} items</td>
                  <td><strong>Rs. {{ cte.revenue.toFixed(2) }}</strong></td>
                  <td>
                    <div class="progress-bar-container">
                      <div class="progress-bar-fill" [style.width.%]="cte.revenueSharePercent"></div>
                      <span class="progress-label">{{ cte.revenueSharePercent }}%</span>
                    </div>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }

      <!-- ================= TAB 4: DISCOUNT IMPACT & 50K BENCHMARKS ================= -->
      @if (activeTab() === 'OPTIMIZATION') {
        <div class="grid-2-col">
          <!-- Discount Impact Analysis -->
          <div class="section-card">
            <div class="card-title-row">
              <span class="material-symbols-outlined" style="color: #f59e0b;">price_change</span>
              <div>
                <h3>Promotional Impact Analysis (v_discount_impact)</h3>
                <p class="card-meta">Quantifying surrendered revenue vs attributed shopper gross sales</p>
              </div>
            </div>

            <table class="data-table">
              <thead>
                <tr>
                  <th>PROMOTION RULE</th>
                  <th>TYPE</th>
                  <th>APPLIED</th>
                  <th>DISCOUNT SURRENDERED</th>
                  <th style="text-align: right;">ATTRIBUTED SALES</th>
                  <th>ROI</th>
                </tr>
              </thead>
              <tbody>
                @for (d of reportService.discountImpact(); track d.ruleId) {
                  <tr>
                    <td><strong>{{ d.ruleName }}</strong></td>
                    <td><span class="badge-pill badge-tier">{{ d.ruleType }}</span></td>
                    <td>{{ d.timesApplied }}x</td>
                    <td class="discount-cost">-Rs. {{ d.totalDiscountAmount.toFixed(2) }}</td>
                    <td style="text-align: right;"><strong>Rs. {{ d.attributedSales.toFixed(2) }}</strong></td>
                    <td><span class="roi-pill">{{ d.roiRatio }}x ROI</span></td>
                  </tr>
                }
              </tbody>
            </table>
          </div>

          <!-- 50k Rows EXPLAIN ANALYZE Proof -->
          <div class="section-card benchmark-card">
            <div class="card-title-row">
              <span class="material-symbols-outlined" style="color: #10b981;">speed</span>
              <div>
                <h3>Query Optimization Benchmark (52,430 Rows)</h3>
                <p class="card-meta">EXPLAIN ANALYZE comparison on sales_order partition/index</p>
              </div>
            </div>

            <div class="benchmark-query-box">
              <code>{{ reportService.explainBenchmark().queryDescription }}</code>
              <span class="dataset-tag">{{ reportService.explainBenchmark().datasetSize }}</span>
            </div>

            <div class="benchmark-comparison-grid">
              <div class="benchmark-side before">
                <div class="side-badge">BEFORE INDEX</div>
                <div class="metric-line">
                  <span class="label">Access Type:</span>
                  <span class="val danger">{{ reportService.explainBenchmark().beforeOptimization.scanType }}</span>
                </div>
                <div class="metric-line">
                  <span class="label">Query Cost:</span>
                  <span class="val">{{ reportService.explainBenchmark().beforeOptimization.cost }}</span>
                </div>
                <div class="metric-line">
                  <span class="label">Execution Time:</span>
                  <span class="val danger">{{ reportService.explainBenchmark().beforeOptimization.executionTimeMs }} ms</span>
                </div>
                <div class="metric-line">
                  <span class="label">Rows Examined:</span>
                  <span class="val">{{ reportService.explainBenchmark().beforeOptimization.rowsExamined }}</span>
                </div>
              </div>

              <div class="benchmark-side after">
                <div class="side-badge success">AFTER COMPOSITE INDEX</div>
                <div class="metric-line">
                  <span class="label">Index Used:</span>
                  <span class="val success">{{ reportService.explainBenchmark().afterOptimization.indexUsed }}</span>
                </div>
                <div class="metric-line">
                  <span class="label">Access Type:</span>
                  <span class="val">{{ reportService.explainBenchmark().afterOptimization.scanType }}</span>
                </div>
                <div class="metric-line">
                  <span class="label">Execution Time:</span>
                  <span class="val success">{{ reportService.explainBenchmark().afterOptimization.executionTimeMs }} ms</span>
                </div>
                <div class="metric-line">
                  <span class="label">Speedup:</span>
                  <span class="val highlight-win">{{ reportService.explainBenchmark().afterOptimization.improvementFactor }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .page-container {
      padding: 24px 30px;
      display: flex;
      flex-direction: column;
      gap: 20px;
      height: 100vh;
      overflow-y: auto;
    }

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .page-title {
      font-size: 1.5rem;
      font-weight: 800;
      color: var(--text-main);
      margin: 0;
    }

    .page-subtitle {
      font-size: 0.82rem;
      color: var(--text-muted);
      margin: 2px 0 0 0;
    }

    .nav-tabs-bar {
      display: flex;
      gap: 8px;
      border-bottom: 2px solid var(--border-subtle);
      padding-bottom: 6px;
    }

    .tab-btn {
      display: flex;
      align-items: center;
      gap: 8px;
      background: none;
      border: none;
      padding: 10px 18px;
      border-radius: 12px;
      font-size: 0.84rem;
      font-weight: 700;
      color: var(--text-muted);
      cursor: pointer;
      transition: all 0.2s;

      .material-symbols-outlined { font-size: 19px; }

      &:hover {
        background: #f1f5f9;
        color: var(--text-main);
      }

      &.active {
        background: var(--primary-green-light);
        color: var(--primary-green);
      }
    }

    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 16px;
    }

    .kpi-card {
      background: #ffffff;
      border-radius: var(--radius-lg);
      padding: 18px;
      border: 1px solid var(--border-subtle);
      box-shadow: var(--shadow-card);
      display: flex;
      align-items: center;
      gap: 14px;
    }

    .kpi-icon-box {
      width: 48px;
      height: 48px;
      border-radius: 14px;
      display: flex;
      align-items: center;
      justify-content: center;

      &.green { background: #dcfce7; color: #15803d; }
      &.blue { background: #dbeafe; color: #1d4ed8; }
      &.orange { background: #ffedd5; color: #c2410c; }
      &.emerald { background: #ecfdf5; color: #065f46; }
    }

    .kpi-info {
      display: flex;
      flex-direction: column;
    }

    .kpi-label {
      font-size: 0.72rem;
      color: var(--text-muted);
      font-weight: 700;
      text-transform: uppercase;
    }

    .kpi-val {
      font-size: 1.3rem;
      font-weight: 800;
      color: var(--text-main);
    }

    .kpi-sub {
      font-size: 0.7rem;
      color: var(--text-muted);
      &.green { color: #15803d; font-weight: 600; }
    }

    .grid-2-col {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
    }

    .section-card {
      background: #ffffff;
      border-radius: var(--radius-lg);
      border: 1px solid var(--border-subtle);
      box-shadow: var(--shadow-card);
      padding: 20px;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .card-title-row {
      display: flex;
      align-items: center;
      gap: 12px;

      h3 { margin: 0; font-size: 1.05rem; font-weight: 800; color: var(--text-main); }
      .card-meta { margin: 2px 0 0 0; font-size: 0.75rem; color: var(--text-muted); }
    }

    .data-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.85rem;

      th {
        text-align: left;
        padding: 10px 12px;
        color: var(--text-muted);
        font-size: 0.72rem;
        font-weight: 700;
        text-transform: uppercase;
        border-bottom: 1px solid var(--border-subtle);
      }

      td {
        padding: 12px;
        border-bottom: 1px solid #f8fafc;
        vertical-align: middle;
      }
    }

    .rank-badge {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 28px;
      height: 28px;
      border-radius: 8px;
      background: #f1f5f9;
      font-weight: 800;
      font-size: 0.8rem;
      color: #64748b;

      &.top3 {
        background: #fef3c7;
        color: #b45309;
      }
    }

    .code-sku {
      font-family: monospace;
      font-size: 0.75rem;
      color: #94a3b8;
    }

    .rev-val {
      font-weight: 800;
      color: var(--primary-green);
    }

    .date-badge {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      padding: 3px 8px;
      border-radius: 6px;
      font-family: monospace;
      font-size: 0.78rem;
    }

    .rollup-table {
      tr.branch-subtotal-row {
        background: #f8fafc;
        border-top: 1.5px dashed #cbd5e1;
        border-bottom: 1.5px dashed #cbd5e1;
        td { font-weight: 700; color: #1e293b; }
      }

      tr.grand-total-row {
        background: #ecfdf5;
        border-top: 2px solid var(--primary-green);
        border-bottom: 2px solid var(--primary-green);
        td { font-weight: 800; color: #064e3b; font-size: 0.92rem; }
      }
    }

    .rollup-badge {
      font-family: monospace;
      font-size: 0.72rem;
      color: #94a3b8;
      font-style: italic;
    }

    .badge-pill {
      padding: 3px 8px;
      border-radius: 10px;
      font-size: 0.7rem;
      font-weight: 700;

      &.badge-grand { background: #065f46; color: #ffffff; }
      &.badge-subtotal { background: #dbeafe; color: #1e40af; }
      &.badge-detail { background: #f1f5f9; color: #64748b; }
      &.badge-tier { background: #fef3c7; color: #92400e; }
    }

    .highlight-grand {
      font-size: 1.05rem;
      color: #064e3b;
    }

    .level-indicator {
      font-size: 0.72rem;
      font-weight: 700;
      padding: 2px 8px;
      border-radius: 6px;

      &.level-1 { background: #dcfce7; color: #166534; }
      &.level-2 { background: #f1f5f9; color: #475569; }
    }

    .progress-bar-container {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .progress-bar-fill {
      height: 8px;
      background: var(--primary-green);
      border-radius: 4px;
      max-width: 120px;
    }

    .progress-label {
      font-size: 0.75rem;
      font-weight: 700;
      color: #475569;
    }

    .discount-cost {
      color: #dc2626;
      font-weight: 700;
      font-family: monospace;
    }

    .roi-pill {
      background: #ecfdf5;
      color: #065f46;
      border: 1px solid #a7f3d0;
      padding: 2px 8px;
      border-radius: 12px;
      font-size: 0.72rem;
      font-weight: 700;
    }

    /* Benchmark card styling */
    .benchmark-query-box {
      background: #0f172a;
      color: #38bdf8;
      border-radius: 10px;
      padding: 12px 14px;
      font-size: 0.78rem;
      display: flex;
      justify-content: space-between;
      align-items: center;

      code { font-family: monospace; }
      .dataset-tag { background: #1e293b; color: #f8fafc; padding: 2px 8px; border-radius: 6px; font-size: 0.7rem; }
    }

    .benchmark-comparison-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 14px;
      margin-top: 8px;
    }

    .benchmark-side {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 14px;
      display: flex;
      flex-direction: column;
      gap: 8px;

      .side-badge {
        font-size: 0.7rem;
        font-weight: 800;
        color: #dc2626;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        &.success { color: #16a34a; }
      }

      .metric-line {
        display: flex;
        justify-content: space-between;
        font-size: 0.8rem;
        .label { color: #64748b; }
        .val { font-weight: 700; }
        .val.danger { color: #dc2626; }
        .val.success { color: #16a34a; }
        .val.highlight-win { color: #065f46; font-size: 0.85rem; font-weight: 800; }
      }
    }
  `]
})
export class ReportsDashboardComponent {
  readonly reportService = inject(ReportService);
  activeTab = signal<'RANKINGS' | 'ROLLUP' | 'CTE' | 'OPTIMIZATION'>('RANKINGS');
}
