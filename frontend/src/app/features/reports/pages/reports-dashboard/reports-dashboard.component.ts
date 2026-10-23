import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReportService } from '../../../../core/services/report.service';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-reports-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-container">
      <!-- Printable Official Management Header (Displayed ONLY when printing) -->
      <div class="print-official-header">
        <div class="print-header-content">
          <div class="print-brand-info">
            <h1 class="print-brand-title">EMERALD SUPERMARKET CHAIN</h1>
            <p class="print-brand-sub">Executive Management Analytics & Financial Reporting</p>
          </div>
          <div class="print-meta-box">
            <div class="print-meta-row">
              <span class="meta-label">Active Report:</span>
              <span class="meta-value">{{ currentPrintingTitle() || 'Analytics Report' }}</span>
            </div>
            <div class="print-meta-row">
              <span class="meta-label">Branch Scope:</span>
              <span class="meta-value">{{ getBranchName() }}</span>
            </div>
            <div class="print-meta-row">
              <span class="meta-label">Generated At:</span>
              <span class="meta-value">{{ currentPrintDate | date:'yyyy-MM-dd HH:mm:ss' }}</span>
            </div>
          </div>
        </div>
        <div class="print-divider-line"></div>
      </div>

      <!-- Header (Screen View) -->
      <div class="page-header no-print">
        <div class="header-left">
          <h1 class="page-title">Executive Reports & Analytics</h1>
        </div>

        <!-- Global Action Controls -->
        <div class="header-actions">
          <div class="filter-group">
            <span class="material-symbols-outlined filter-icon">store</span>
            <select
              class="custom-select"
              [ngModel]="reportService.selectedBranchId()"
              (ngModelChange)="onBranchSelect($event)"
            >
              <option [ngValue]="null">All Supermarket Branches</option>
              @for (b of reportService.branches; track b.id) {
                <option [ngValue]="b.id">{{ b.name }}</option>
              }
            </select>
          </div>

          <button
            type="button"
            class="btn-refresh"
            (click)="reportService.refreshAll()"
            [disabled]="reportService.isLoading()"
            title="Reload live report data"
          >
            <span class="material-symbols-outlined" [class.spinning]="reportService.isLoading()">sync</span>
            <span>{{ reportService.isLoading() ? 'Syncing...' : 'Refresh' }}</span>
          </button>
        </div>
      </div>

      <!-- Sync Status Notice -->
      @if (reportService.errorMessage()) {
        <div class="notice-bar warning no-print">
          <span class="material-symbols-outlined">info</span>
          <span>{{ reportService.errorMessage() }}</span>
        </div>
      }

      <!-- KPI Metrics Summary Cards (Top Level - 5 Cards) -->
      <div class="kpi-grid no-print">
        <!-- 1. Today Revenue -->
        <div class="kpi-card">
          <div class="kpi-icon-box green">
            <span class="material-symbols-outlined">payments</span>
          </div>
          <div class="kpi-info">
            <span class="kpi-label">Today's Sales Revenue</span>
            <span class="kpi-val">Rs. {{ (reportService.summaryMetrics().todayRevenue || 0).toFixed(2) }}</span>
            <span class="kpi-sub green">
              <span class="material-symbols-outlined inline-icon">trending_up</span>
              Today's Gross Earnings
            </span>
          </div>
        </div>

        <!-- 2. Orders Count -->
        <div class="kpi-card">
          <div class="kpi-icon-box blue">
            <span class="material-symbols-outlined">receipt_long</span>
          </div>
          <div class="kpi-info">
            <span class="kpi-label">Completed Orders</span>
            <span class="kpi-val">{{ reportService.summaryMetrics().ordersCount }}</span>
            <span class="kpi-sub">
              {{ reportService.selectedBranchId() ? 'Selected Branch' : 'All Branches Combined' }}
            </span>
          </div>
        </div>

        <!-- 3. Discounts Awarded -->
        <div class="kpi-card">
          <div class="kpi-icon-box orange">
            <span class="material-symbols-outlined">savings</span>
          </div>
          <div class="kpi-info">
            <span class="kpi-label">Discounts Awarded</span>
            <span class="kpi-val">-Rs. {{ (reportService.summaryMetrics().discountsGiven || 0).toFixed(2) }}</span>
            <span class="kpi-sub">Promotional Savings</span>
          </div>
        </div>

        <!-- 4. Low Stock Alerts -->
        <div class="kpi-card">
          <div class="kpi-icon-box rose">
            <span class="material-symbols-outlined">notification_important</span>
          </div>
          <div class="kpi-info">
            <span class="kpi-label">Low Stock Alerts</span>
            <span class="kpi-val danger">{{ reportService.summaryMetrics().lowStockAlerts }}</span>
            <span class="kpi-sub danger">Action Required</span>
          </div>
        </div>

        <!-- 5. 30-Day Moving Average -->
        <div class="kpi-card">
          <div class="kpi-icon-box purple">
            <span class="material-symbols-outlined">monitoring</span>
          </div>
          <div class="kpi-info">
            <span class="kpi-label">30-Day Moving Avg</span>
            <span class="kpi-val">Rs. {{ (reportService.summaryMetrics().movingAvg30Days || 0).toFixed(2) }}</span>
            <span class="kpi-sub">Daily Average Volume</span>
          </div>
        </div>
      </div>

      <!-- Report Switching Tabs -->
      <div class="nav-tabs-bar no-print">
        <button
          type="button"
          class="tab-btn"
          [class.active]="activeTab() === 'RANKINGS'"
          (click)="activeTab.set('RANKINGS')"
        >
          <span class="material-symbols-outlined">trophy</span>
          <span class="tab-label">Product Leaderboard</span>
        </button>

        <button
          type="button"
          class="tab-btn"
          [class.active]="activeTab() === 'DAILY_SALES'"
          (click)="activeTab.set('DAILY_SALES')"
        >
          <span class="material-symbols-outlined">calendar_month</span>
          <span class="tab-label">Daily Sales Summary</span>
        </button>

        <button
          type="button"
          class="tab-btn"
          [class.active]="activeTab() === 'ROLLUP'"
          (click)="activeTab.set('ROLLUP')"
        >
          <span class="material-symbols-outlined">table_chart</span>
          <span class="tab-label">Monthly Branch Rollup</span>
        </button>

        <button
          type="button"
          class="tab-btn"
          [class.active]="activeTab() === 'CTE'"
          (click)="activeTab.set('CTE')"
        >
          <span class="material-symbols-outlined">account_tree</span>
          <span class="tab-label">Category Breakdown</span>
        </button>

        <button
          type="button"
          class="tab-btn"
          [class.active]="activeTab() === 'PROMOTIONS'"
          (click)="activeTab.set('PROMOTIONS')"
        >
          <span class="material-symbols-outlined">price_change</span>
          <span class="tab-label">Promotional ROI</span>
        </button>

        <button
          type="button"
          class="tab-btn"
          [class.active]="activeTab() === 'SUPPLIERS'"
          (click)="activeTab.set('SUPPLIERS')"
        >
          <span class="material-symbols-outlined">local_shipping</span>
          <span class="tab-label">Supplier Performance</span>
        </button>

        <button
          type="button"
          class="tab-btn"
          [class.active]="activeTab() === 'RECONCILIATION'"
          (click)="activeTab.set('RECONCILIATION')"
        >
          <span class="material-symbols-outlined">balance</span>
          <span class="tab-label">Financial Reconciliation</span>
        </button>
      </div>

      <!-- ================= REPORT 1: PRODUCT RANKING LEADERBOARD ================= -->
      @if (activeTab() === 'RANKINGS') {
        <div class="section-card printable-card">
          <div class="card-inner-header">
            <div class="card-title-row">
              <span class="material-symbols-outlined title-icon green">trophy</span>
              <div>
                <h3>Product Performance Leaderboard</h3>
                <p class="card-meta">Top revenue-generating products and units sold across branches</p>
              </div>
            </div>

            <!-- Card Actions: Limit Selector & Print Button -->
            <div class="card-controls-group no-print">
              <div class="pill-selector">
                <button
                  type="button"
                  class="pill-option"
                  [class.active]="reportService.rankingLimit() === 5"
                  (click)="onLimitChange(5)"
                >Top 5</button>
                <button
                  type="button"
                  class="pill-option"
                  [class.active]="reportService.rankingLimit() === 10"
                  (click)="onLimitChange(10)"
                >Top 10</button>
                <button
                  type="button"
                  class="pill-option"
                  [class.active]="reportService.rankingLimit() === 25"
                  (click)="onLimitChange(25)"
                >Top 25</button>
              </div>

              <button
                type="button"
                class="btn-card-print"
                (click)="printReport('Product Performance Leaderboard')"
                title="Print this report"
              >
                <span class="material-symbols-outlined">print</span>
                <span>Print Report</span>
              </button>
            </div>
          </div>

          <div class="table-responsive">
            <table class="data-table">
              <thead>
                <tr>
                  <th style="width: 80px;">RANK</th>
                  <th>PRODUCT DETAILS</th>
                  <th>SKU / CODE</th>
                  <th style="text-align: center;">UNITS SOLD</th>
                  <th style="text-align: right;">TOTAL REVENUE</th>
                </tr>
              </thead>
              <tbody>
                @for (item of displayedRankings(); track item.productId) {
                  <tr>
                    <td>
                      <span
                        class="rank-badge"
                        [class.gold]="item.rank === 1"
                        [class.silver]="item.rank === 2"
                        [class.bronze]="item.rank === 3"
                      >
                        @if (item.rank === 1) { 🥇 #1 }
                        @else if (item.rank === 2) { 🥈 #2 }
                        @else if (item.rank === 3) { 🥉 #3 }
                        @else { #{{ item.rank }} }
                      </span>
                    </td>
                    <td>
                      <strong class="item-name">{{ item.productName }}</strong>
                    </td>
                    <td>
                      <span class="code-sku">{{ item.sku }}</span>
                    </td>
                    <td style="text-align: center;">
                      <span class="volume-badge">{{ item.unitsSold }} units</span>
                    </td>
                    <td style="text-align: right;">
                      <strong class="rev-val">Rs. {{ (item.revenue || 0).toFixed(2) }}</strong>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      }

      <!-- ================= REPORT 2: DAILY SALES SUMMARY ================= -->
      @if (activeTab() === 'DAILY_SALES') {
        <div class="section-card printable-card">
          <div class="card-inner-header">
            <div class="card-title-row">
              <span class="material-symbols-outlined title-icon blue">calendar_month</span>
              <div>
                <h3>Daily Sales Summary</h3>
                <p class="card-meta">Daily transaction volume and gross revenues by outlet location</p>
              </div>
            </div>

            <!-- Card Actions: Print Button -->
            <div class="card-controls-group no-print">
              <button
                type="button"
                class="btn-card-print"
                (click)="printReport('Daily Sales Summary')"
                title="Print this report"
              >
                <span class="material-symbols-outlined">print</span>
                <span>Print Report</span>
              </button>
            </div>
          </div>

          <div class="table-responsive">
            <table class="data-table">
              <thead>
                <tr>
                  <th>DATE</th>
                  <th>BRANCH OUTLET</th>
                  <th style="text-align: center;">ORDERS COMPLETED</th>
                  <th style="text-align: right;">GROSS REVENUE</th>
                </tr>
              </thead>
              <tbody>
                @for (day of paginatedDailySales(); track day.date + '-' + day.branchName) {
                  <tr>
                    <td><span class="date-badge">{{ day.date }}</span></td>
                    <td><strong>{{ day.branchName }}</strong></td>
                    <td style="text-align: center;">
                      <span class="orders-count-badge">{{ day.ordersCount }} orders</span>
                    </td>
                    <td style="text-align: right;">
                      <strong class="rev-val">Rs. {{ (day.totalSales || 0).toFixed(2) }}</strong>
                    </td>
                  </tr>
                }
                @if (reportService.dailySalesHistory().length === 0) {
                  <tr>
                    <td colspan="4" class="empty-state-cell">No sales records found for this selection.</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>

          <!-- Pagination Bar -->
          @if (dailySalesTotalPages() > 1 && !isPrinting()) {
            <div class="pagination-bar no-print">
              <div class="pagination-info">
                Showing <strong>{{ (dailySalesPage() - 1) * dailySalesPageSize() + 1 }}</strong> to
                <strong>{{ min(dailySalesPage() * dailySalesPageSize(), reportService.dailySalesHistory().length) }}</strong> of
                <strong>{{ reportService.dailySalesHistory().length }}</strong> entries
              </div>
              <div class="pagination-controls">
                <button
                  type="button"
                  class="page-btn nav-btn"
                  [disabled]="dailySalesPage() === 1"
                  (click)="setDailySalesPage(dailySalesPage() - 1)"
                >
                  <span class="material-symbols-outlined">chevron_left</span>
                  <span>Previous</span>
                </button>

                @for (p of getPageNumbers(dailySalesTotalPages(), dailySalesPage()); track p) {
                  <button
                    type="button"
                    class="page-btn number-btn"
                    [class.active]="p === dailySalesPage()"
                    (click)="setDailySalesPage(p)"
                  >
                    {{ p }}
                  </button>
                }

                <button
                  type="button"
                  class="page-btn nav-btn"
                  [disabled]="dailySalesPage() === dailySalesTotalPages()"
                  (click)="setDailySalesPage(dailySalesPage() + 1)"
                >
                  <span>Next</span>
                  <span class="material-symbols-outlined">chevron_right</span>
                </button>
              </div>
            </div>
          }
        </div>
      }

      <!-- ================= REPORT 3: MONTHLY BRANCH SALES ROLLUP ================= -->
      @if (activeTab() === 'ROLLUP') {
        <div class="section-card printable-card">
          <div class="card-inner-header">
            <div class="card-title-row">
              <span class="material-symbols-outlined title-icon green">table_chart</span>
              <div>
                <h3>Monthly Branch Sales Rollup</h3>
                <p class="card-meta">Branch performance subtotals and consolidated chain-wide grand total</p>
              </div>
            </div>

            <!-- Date Parameters Filter & Print Button -->
            <div class="card-controls-group no-print">
              <div class="date-filter-box">
                <label>Year: </label>
                <select
                  class="small-select"
                  [ngModel]="reportService.selectedYear()"
                  (ngModelChange)="onYearChange($event)"
                >
                  <option [ngValue]="2026">2026</option>
                  <option [ngValue]="2025">2025</option>
                  <option [ngValue]="2024">2024</option>
                </select>

                <label>Month: </label>
                <select
                  class="small-select"
                  [ngModel]="reportService.selectedMonth()"
                  (ngModelChange)="onMonthChange($event)"
                >
                  <option [ngValue]="1">January (01)</option>
                  <option [ngValue]="2">February (02)</option>
                  <option [ngValue]="3">March (03)</option>
                  <option [ngValue]="4">April (04)</option>
                  <option [ngValue]="5">May (05)</option>
                  <option [ngValue]="6">June (06)</option>
                  <option [ngValue]="7">July (07)</option>
                  <option [ngValue]="8">August (08)</option>
                  <option [ngValue]="9">September (09)</option>
                  <option [ngValue]="10">October (10)</option>
                  <option [ngValue]="11">November (11)</option>
                  <option [ngValue]="12">December (12)</option>
                </select>
              </div>

              <button
                type="button"
                class="btn-card-print"
                (click)="printReport('Monthly Branch Sales Rollup')"
                title="Print this report"
              >
                <span class="material-symbols-outlined">print</span>
                <span>Print Report</span>
              </button>
            </div>
          </div>

          <div class="table-responsive">
            <table class="data-table rollup-table">
              <thead>
                <tr>
                  <th>BRANCH OUTLET</th>
                  <th>RECORD DATE</th>
                  <th style="text-align: center;">TOTAL ORDERS</th>
                  <th style="text-align: right;">NET SALES REVENUE</th>
                  <th style="text-align: center;">RECORD TYPE</th>
                </tr>
              </thead>
              <tbody>
                @for (row of paginatedRollup(); track $index) {
                  <tr
                    [class.row-subtotal]="row.isBranchSubtotal"
                    [class.row-grandtotal]="row.isGrandTotal"
                  >
                    <td>
                      @if (row.isGrandTotal) {
                        <div class="grand-total-cell">
                          <span class="material-symbols-outlined">stars</span>
                          <strong>ALL SUPERMARKET BRANCHES (GRAND TOTAL)</strong>
                        </div>
                      } @else if (row.isBranchSubtotal) {
                        <div class="subtotal-cell">
                          <span class="material-symbols-outlined">functions</span>
                          <strong>{{ row.branchName }}</strong>
                        </div>
                      } @else {
                        <span>{{ row.branchName }}</span>
                      }
                    </td>

                    <td>
                      @if (row.isGrandTotal || row.isBranchSubtotal) {
                        <span class="rollup-badge">—</span>
                      } @else {
                        <span class="date-badge">{{ row.orderDate }}</span>
                      }
                    </td>

                    <td style="text-align: center;">
                      <strong>{{ row.ordersCount }} orders</strong>
                    </td>

                    <td style="text-align: right;">
                      <span [class.highlight-grand]="row.isGrandTotal" [class.rev-val]="!row.isGrandTotal">
                        Rs. {{ (row.totalRevenue || 0).toFixed(2) }}
                      </span>
                    </td>

                    <td style="text-align: center;">
                      @if (row.isGrandTotal) {
                        <span class="badge-pill badge-grand">Grand Total</span>
                      } @else if (row.isBranchSubtotal) {
                        <span class="badge-pill badge-subtotal">Branch Subtotal</span>
                      } @else {
                        <span class="badge-pill badge-regular">Daily</span>
                      }
                    </td>
                  </tr>
                }
                @if (reportService.monthlyRollupReport().length === 0) {
                  <tr>
                    <td colspan="5" class="empty-state-cell">No monthly rollup data found for the selected period.</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>

          <!-- Pagination Bar -->
          @if (rollupTotalPages() > 1 && !isPrinting()) {
            <div class="pagination-bar no-print">
              <div class="pagination-info">
                Showing <strong>{{ (rollupPage() - 1) * rollupPageSize() + 1 }}</strong> to
                <strong>{{ min(rollupPage() * rollupPageSize(), reportService.monthlyRollupReport().length) }}</strong> of
                <strong>{{ reportService.monthlyRollupReport().length }}</strong> records
              </div>
              <div class="pagination-controls">
                <button
                  type="button"
                  class="page-btn nav-btn"
                  [disabled]="rollupPage() === 1"
                  (click)="setRollupPage(rollupPage() - 1)"
                >
                  <span class="material-symbols-outlined">chevron_left</span>
                  <span>Previous</span>
                </button>

                @for (p of getPageNumbers(rollupTotalPages(), rollupPage()); track p) {
                  <button
                    type="button"
                    class="page-btn number-btn"
                    [class.active]="p === rollupPage()"
                    (click)="setRollupPage(p)"
                  >
                    {{ p }}
                  </button>
                }

                <button
                  type="button"
                  class="page-btn nav-btn"
                  [disabled]="rollupPage() === rollupTotalPages()"
                  (click)="setRollupPage(rollupPage() + 1)"
                >
                  <span>Next</span>
                  <span class="material-symbols-outlined">chevron_right</span>
                </button>
              </div>
            </div>
          }
        </div>
      }

      <!-- ================= REPORT 4: CATEGORY HIERARCHY TREE ================= -->
      @if (activeTab() === 'CTE') {
        <div class="section-card printable-card">
          <div class="card-inner-header">
            <div class="card-title-row">
              <span class="material-symbols-outlined title-icon emerald">account_tree</span>
              <div>
                <h3>Category Sales Breakdown</h3>
                <p class="card-meta">Multi-level category hierarchy and revenue share contribution</p>
              </div>
            </div>

            <!-- Card Actions: Print Button -->
            <div class="card-controls-group no-print">
              <button
                type="button"
                class="btn-card-print"
                (click)="printReport('Category Sales Breakdown')"
                title="Print this report"
              >
                <span class="material-symbols-outlined">print</span>
                <span>Print Report</span>
              </button>
            </div>
          </div>

          <div class="table-responsive">
            <table class="data-table">
              <thead>
                <tr>
                  <th style="width: 140px;">HIERARCHY LEVEL</th>
                  <th>CATEGORY TREE STRUCTURE</th>
                  <th>PARENT CATEGORY</th>
                  <th style="text-align: center;">TOTAL UNITS SOLD</th>
                  <th style="text-align: right;">CONTRIBUTED REVENUE</th>
                  <th style="width: 200px;">REVENUE SHARE</th>
                </tr>
              </thead>
              <tbody>
                @for (cte of paginatedCte(); track cte.categoryId) {
                  <tr>
                    <td>
                      <span class="level-indicator level-{{ cte.hierarchyLevel }}">
                        <span class="material-symbols-outlined">subdirectory_arrow_right</span>
                        Level {{ cte.hierarchyLevel }}
                      </span>
                    </td>
                    <td>
                      <strong
                        class="category-name-cell"
                        [style.padding-left.px]="(cte.hierarchyLevel - 1) * 22"
                      >
                        {{ cte.categoryName }}
                      </strong>
                    </td>
                    <td><span class="code-sku">{{ cte.parentCategory }}</span></td>
                    <td style="text-align: center;">
                      <span class="volume-badge">{{ cte.totalProductsSold }} items</span>
                    </td>
                    <td style="text-align: right;">
                      <strong class="rev-val">Rs. {{ (cte.revenue || 0).toFixed(2) }}</strong>
                    </td>
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

          <!-- Pagination Bar -->
          @if (cteTotalPages() > 1 && !isPrinting()) {
            <div class="pagination-bar no-print">
              <div class="pagination-info">
                Showing <strong>{{ (ctePage() - 1) * ctePageSize() + 1 }}</strong> to
                <strong>{{ min(ctePage() * ctePageSize(), reportService.categorySalesCte().length) }}</strong> of
                <strong>{{ reportService.categorySalesCte().length }}</strong> categories
              </div>
              <div class="pagination-controls">
                <button
                  type="button"
                  class="page-btn nav-btn"
                  [disabled]="ctePage() === 1"
                  (click)="setCtePage(ctePage() - 1)"
                >
                  <span class="material-symbols-outlined">chevron_left</span>
                  <span>Previous</span>
                </button>

                @for (p of getPageNumbers(cteTotalPages(), ctePage()); track p) {
                  <button
                    type="button"
                    class="page-btn number-btn"
                    [class.active]="p === ctePage()"
                    (click)="setCtePage(p)"
                  >
                    {{ p }}
                  </button>
                }

                <button
                  type="button"
                  class="page-btn nav-btn"
                  [disabled]="ctePage() === cteTotalPages()"
                  (click)="setCtePage(ctePage() + 1)"
                >
                  <span>Next</span>
                  <span class="material-symbols-outlined">chevron_right</span>
                </button>
              </div>
            </div>
          }
        </div>
      }

      <!-- ================= REPORT 5: PROMOTIONAL ROI ANALYSIS ================= -->
      @if (activeTab() === 'PROMOTIONS') {
        <div class="section-card printable-card">
          <div class="card-inner-header">
            <div class="card-title-row">
              <span class="material-symbols-outlined title-icon orange">price_change</span>
              <div>
                <h3>Promotional Impact & Discount ROI</h3>
                <p class="card-meta">Analysis of active promotional campaigns, redeemed discounts, and return on investment</p>
              </div>
            </div>

            <!-- Card Actions: Print Button -->
            <div class="card-controls-group no-print">
              <button
                type="button"
                class="btn-card-print"
                (click)="printReport('Promotional Impact & Discount ROI')"
                title="Print this report"
              >
                <span class="material-symbols-outlined">print</span>
                <span>Print Report</span>
              </button>
            </div>
          </div>

          <div class="table-responsive">
            <table class="data-table">
              <thead>
                <tr>
                  <th>PROMOTIONAL RULE NAME</th>
                  <th>DISCOUNT TYPE</th>
                  <th style="text-align: center;">REDEMPTION COUNT</th>
                  <th>SURRENDERED DISCOUNT</th>
                  <th style="text-align: right;">ATTRIBUTED SALES REVENUE</th>
                  <th style="text-align: center;">RETURN ON INVESTMENT (ROI)</th>
                </tr>
              </thead>
              <tbody>
                @for (d of paginatedPromotions(); track d.ruleId) {
                  <tr>
                    <td><strong>{{ d.ruleName }}</strong></td>
                    <td><span class="badge-pill badge-tier">{{ d.ruleType }}</span></td>
                    <td style="text-align: center;">
                      <span class="volume-badge">{{ d.timesApplied }}x applied</span>
                    </td>
                    <td class="discount-cost">-Rs. {{ (d.totalDiscountAmount || 0).toFixed(2) }}</td>
                    <td style="text-align: right;">
                      <strong class="rev-val">Rs. {{ (d.attributedSales || 0).toFixed(2) }}</strong>
                    </td>
                    <td style="text-align: center;">
                      <span class="roi-pill">{{ d.roiRatio }}x ROI</span>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>

          <!-- Pagination Bar -->
          @if (promotionsTotalPages() > 1 && !isPrinting()) {
            <div class="pagination-bar no-print">
              <div class="pagination-info">
                Showing <strong>{{ (promotionsPage() - 1) * promotionsPageSize() + 1 }}</strong> to
                <strong>{{ min(promotionsPage() * promotionsPageSize(), reportService.discountImpact().length) }}</strong> of
                <strong>{{ reportService.discountImpact().length }}</strong> promotions
              </div>
              <div class="pagination-controls">
                <button
                  type="button"
                  class="page-btn nav-btn"
                  [disabled]="promotionsPage() === 1"
                  (click)="setPromotionsPage(promotionsPage() - 1)"
                >
                  <span class="material-symbols-outlined">chevron_left</span>
                  <span>Previous</span>
                </button>

                @for (p of getPageNumbers(promotionsTotalPages(), promotionsPage()); track p) {
                  <button
                    type="button"
                    class="page-btn number-btn"
                    [class.active]="p === promotionsPage()"
                    (click)="setPromotionsPage(p)"
                  >
                    {{ p }}
                  </button>
                }

                <button
                  type="button"
                  class="page-btn nav-btn"
                  [disabled]="promotionsPage() === promotionsTotalPages()"
                  (click)="setPromotionsPage(promotionsPage() + 1)"
                >
                  <span>Next</span>
                  <span class="material-symbols-outlined">chevron_right</span>
                </button>
              </div>
            </div>
          }
        </div>
      }

      <!-- ================= REPORT 6: SUPPLIER PERFORMANCE & FULFILLMENT ================= -->
      @if (activeTab() === 'SUPPLIERS') {
        <div class="section-card printable-card">
          <div class="card-inner-header">
            <div class="card-title-row">
              <span class="material-symbols-outlined title-icon green">local_shipping</span>
              <div>
                <h3>Supplier Order Fulfillment & Performance</h3>
                <p class="card-meta">
                  Vendor delivery reliability, fulfillment accuracy rates, and procurement expenditure
                </p>
              </div>
            </div>

            <!-- Card Actions: Print Button -->
            <div class="card-controls-group no-print">
              <button
                type="button"
                class="btn-card-print"
                (click)="printReport('Supplier Order Fulfillment & Performance')"
                title="Print this report"
              >
                <span class="material-symbols-outlined">print</span>
                <span>Print Report</span>
              </button>
            </div>
          </div>

          <div class="table-responsive">
            <table class="data-table">
              <thead>
                <tr>
                  <th>SUPPLIER NAME</th>
                  <th>CONTACT & LOCATION</th>
                  <th style="text-align: center;">PURCHASE ORDERS</th>
                  <th style="text-align: right;">REQUESTED QTY</th>
                  <th style="text-align: right;">CONFIRMED QTY</th>
                  <th style="width: 220px;">FULFILLMENT RATE</th>
                  <th style="text-align: right;">TOTAL SPEND</th>
                  <th style="text-align: center;">PERFORMANCE TIER</th>
                </tr>
              </thead>
              <tbody>
                @for (sup of paginatedSuppliers(); track sup.supplierId) {
                  <tr>
                    <td>
                      <div class="supplier-name-cell">
                        <strong class="item-name">{{ sup.supplierName }}</strong>
                        <span class="supplier-code">#SUP-{{ sup.supplierId }}</span>
                      </div>
                    </td>
                    <td>
                      <div class="contact-info">
                        <span class="contact-name">{{ sup.contactPerson }}</span>
                        <span class="contact-email">{{ sup.phone }} &bull; {{ sup.city }}</span>
                      </div>
                    </td>
                    <td style="text-align: center;">
                      <span class="volume-badge">{{ sup.totalOrders }} POs</span>
                    </td>
                    <td style="text-align: right;">
                      <span class="qty-val">{{ (sup.totalRequestedQty || 0).toLocaleString() }}</span>
                    </td>
                    <td style="text-align: right;">
                      <strong class="qty-val confirmed">{{ (sup.totalConfirmedQty || 0).toLocaleString() }}</strong>
                    </td>
                    <td>
                      <div class="fulfillment-meter">
                        <div class="fulfillment-track">
                          <div
                            class="fulfillment-fill"
                            [class.fill-high]="(sup.fulfillmentRate || 0) >= 95"
                            [class.fill-mid]="(sup.fulfillmentRate || 0) >= 80 && (sup.fulfillmentRate || 0) < 95"
                            [class.fill-low]="(sup.fulfillmentRate || 0) < 80"
                            [style.width.%]="sup.fulfillmentRate || 0"
                          ></div>
                        </div>
                        <span
                          class="fulfillment-pct"
                          [class.pct-high]="(sup.fulfillmentRate || 0) >= 95"
                          [class.pct-mid]="(sup.fulfillmentRate || 0) >= 80 && (sup.fulfillmentRate || 0) < 95"
                          [class.pct-low]="(sup.fulfillmentRate || 0) < 80"
                        >
                          {{ (sup.fulfillmentRate || 0).toFixed(1) }}%
                        </span>
                      </div>
                    </td>
                    <td style="text-align: right;">
                      <strong class="rev-val">Rs. {{ (sup.totalSpend || 0).toFixed(2) }}</strong>
                    </td>
                    <td style="text-align: center;">
                      <span
                        class="tier-badge"
                        [class.tier-preferred]="sup.ratingTier === 'PREFERRED'"
                        [class.tier-reliable]="sup.ratingTier === 'RELIABLE'"
                        [class.tier-review]="sup.ratingTier === 'UNDER_REVIEW' || sup.ratingTier === 'NEEDS_IMPROVEMENT'"
                      >
                        {{ sup.ratingTier }}
                      </span>
                    </td>
                  </tr>
                }
                @if (displayedSuppliers().length === 0) {
                  <tr>
                    <td colspan="8" class="empty-state-cell">
                      No supplier records found or PO data unavailable.
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>

          <!-- Pagination Bar -->
          @if (suppliersTotalPages() > 1 && !isPrinting()) {
            <div class="pagination-bar no-print">
              <div class="pagination-info">
                Showing <strong>{{ (suppliersPage() - 1) * suppliersPageSize() + 1 }}</strong> to
                <strong>{{ min(suppliersPage() * suppliersPageSize(), displayedSuppliers().length) }}</strong> of
                <strong>{{ displayedSuppliers().length }}</strong> suppliers
              </div>
              <div class="pagination-controls">
                <button
                  type="button"
                  class="page-btn nav-btn"
                  [disabled]="suppliersPage() === 1"
                  (click)="setSuppliersPage(suppliersPage() - 1)"
                >
                  <span class="material-symbols-outlined">chevron_left</span>
                  <span>Previous</span>
                </button>

                @for (p of getPageNumbers(suppliersTotalPages(), suppliersPage()); track p) {
                  <button
                    type="button"
                    class="page-btn number-btn"
                    [class.active]="p === suppliersPage()"
                    (click)="setSuppliersPage(p)"
                  >
                    {{ p }}
                  </button>
                }

                <button
                  type="button"
                  class="page-btn nav-btn"
                  [disabled]="suppliersPage() === suppliersTotalPages()"
                  (click)="setSuppliersPage(suppliersPage() + 1)"
                >
                  <span>Next</span>
                  <span class="material-symbols-outlined">chevron_right</span>
                </button>
              </div>
            </div>
          }
        </div>
      }

      <!-- ================= REPORT 7: FINANCIAL RECONCILIATION & AUDIT ================= -->
      @if (activeTab() === 'RECONCILIATION') {
        <div class="section-card printable-card">
          <div class="card-inner-header">
            <div class="card-title-row">
              <span class="material-symbols-outlined title-icon purple">balance</span>
              <div>
                <h3>Financial Audit & Tender Reconciliation</h3>
              </div>
            </div>

            <!-- Date Range Filter & Print -->
            <div class="card-controls-group no-print">
              <div class="date-filter-box">
                <label>From: </label>
                <input
                  type="date"
                  class="date-input"
                  [ngModel]="reportService.reconStartDate()"
                  (ngModelChange)="onReconStartDateChange($event)"
                />
                <label>To: </label>
                <input
                  type="date"
                  class="date-input"
                  [ngModel]="reportService.reconEndDate()"
                  (ngModelChange)="onReconEndDateChange($event)"
                />
              </div>

              <button
                type="button"
                class="btn-card-print"
                (click)="printReport('Financial Audit & Tender Reconciliation')"
                title="Print this report"
              >
                <span class="material-symbols-outlined">print</span>
                <span>Print Report</span>
              </button>
            </div>
          </div>

          <!-- Financial Reconciliation KPI Metric Cards (Preserved for later use)
          <div class="recon-kpi-grid">
            <div class="recon-kpi-card">
              <span class="recon-label">COMPLETED ORDERS</span>
              <strong class="recon-val">{{ reportService.financialReconciliation()?.totalCompletedOrders || 0 }}</strong>
              <span class="recon-sub">Audited Transactions</span>
            </div>
            <div class="recon-kpi-card">
              <span class="recon-label">GROSS SALES (SUBTOTAL)</span>
              <strong class="recon-val">Rs. {{ (reportService.financialReconciliation()?.grossSales || 0).toFixed(2) }}</strong>
              <span class="recon-sub">Pre-Discount Subtotal</span>
            </div>
            <div class="recon-kpi-card">
              <span class="recon-label">DISCOUNTS SURRENDERED</span>
              <strong class="recon-val orange">-Rs. {{ (reportService.financialReconciliation()?.totalDiscounts || 0).toFixed(2) }}</strong>
              <span class="recon-sub">Promotional Deductions</span>
            </div>
            <div class="recon-kpi-card highlight-net">
              <span class="recon-label">AUDITED NET REVENUE</span>
              <strong class="recon-val green">Rs. {{ (reportService.financialReconciliation()?.netRevenue || 0).toFixed(2) }}</strong>
              <span class="recon-sub green">Target Collections</span>
            </div>
            <div class="recon-kpi-card highlight-collected">
              <span class="recon-label">PAYMENTS COLLECTED</span>
              <strong class="recon-val blue">Rs. {{ (reportService.financialReconciliation()?.totalCollected || 0).toFixed(2) }}</strong>
              <span class="recon-sub blue">Tender Receipts</span>
            </div>
          </div>
          -->

          <!-- Tender Breakdown Table -->
          <div class="table-responsive">
            <table class="data-table">
              <thead>
                <tr>
                  <th>PAYMENT METHOD</th>
                  <th style="text-align: center;">TRANSACTION COUNT</th>
                  <th style="text-align: right;">TOTAL COLLECTED</th>
                  <th style="width: 240px;">SHARE OF REVENUE</th>
                  <th style="text-align: center;">RECONCILIATION STATUS</th>
                </tr>
              </thead>
              <tbody>
                @for (t of reportService.financialReconciliation()?.tenders || []; track t.paymentMethod) {
                  <tr>
                    <td>
                      <div class="tender-cell">
                        <span class="material-symbols-outlined tender-icon">
                          {{ t.paymentMethod === 'CASH' ? 'payments' : (t.paymentMethod === 'CARD' ? 'credit_card' : 'qr_code_2') }}
                        </span>
                        <strong>{{ t.paymentMethod }} PAYMENT</strong>
                      </div>
                    </td>
                    <td style="text-align: center;">
                      <span class="orders-count-badge">{{ t.transactionCount }} transactions</span>
                    </td>
                    <td style="text-align: right;">
                      <strong class="rev-val">Rs. {{ (t.totalCollected || 0).toFixed(2) }}</strong>
                    </td>
                    <td>
                      <div class="progress-bar-container">
                        <div class="progress-bar-fill" [style.width.%]="t.sharePercentage"></div>
                        <span class="progress-label">{{ t.sharePercentage }}%</span>
                      </div>
                    </td>
                    <td style="text-align: center;">
                      <span class="badge-pill badge-received">MATCHED</span>
                    </td>
                  </tr>
                }
                @if ((reportService.financialReconciliation()?.tenders || []).length === 0) {
                  <tr>
                    <td colspan="5" class="empty-state-cell">No transaction records found for the selected period.</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .page-container {
      padding: 24px 32px;
      display: flex;
      flex-direction: column;
      gap: 20px;
      min-height: 100vh;
      height: 100vh;
      overflow-y: auto;
      background: var(--bg-app, #f4f6f8);
      box-sizing: border-box;
      width: 100%;
    }

    /* Print Header Banner */
    .print-official-header {
      display: none;
    }

    /* Header */
    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 16px;
      flex-shrink: 0;
      width: 100%;
    }

    .header-left {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .page-title {
      font-size: 1.65rem;
      font-weight: 800;
      color: #0f172a;
      margin: 0;
      letter-spacing: -0.025em;
    }

    .header-actions {
      display: flex;
      align-items: center;
      gap: 12px;
      flex-wrap: wrap;
    }

    .filter-group {
      display: flex;
      align-items: center;
      background: #ffffff;
      border: 1.5px solid #e2e8f0;
      border-radius: var(--radius-md, 14px);
      padding: 2px 14px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
      transition: border-color 0.2s ease;

      &:hover, &:focus-within {
        border-color: #065f46;
      }

      .filter-icon {
        font-size: 20px;
        color: #065f46;
        margin-right: 8px;
      }
    }

    .custom-select {
      border: none;
      background: transparent;
      padding: 9px 4px;
      font-size: 0.88rem;
      font-weight: 600;
      color: #0f172a;
      outline: none;
      cursor: pointer;
    }

    .btn-refresh {
      display: inline-flex;
      align-items: center;
      gap: 7px;
      padding: 10px 18px;
      border-radius: var(--radius-md, 14px);
      font-size: 0.86rem;
      font-weight: 700;
      cursor: pointer;
      background: #065f46;
      color: #ffffff;
      border: 1.5px solid #065f46;
      box-shadow: 0 2px 8px rgba(6, 95, 70, 0.2);
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
      .material-symbols-outlined { font-size: 19px; }

      &:hover:not(:disabled) {
        background: #044e39;
        border-color: #044e39;
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(6, 95, 70, 0.28);
      }
      &:active:not(:disabled) {
        transform: translateY(0);
      }
      &:disabled {
        opacity: 0.7;
        cursor: not-allowed;
      }
    }

    .spinning {
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      100% { transform: rotate(360deg); }
    }

    .notice-bar {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 12px 18px;
      border-radius: 12px;
      font-size: 0.85rem;
      font-weight: 600;
      flex-shrink: 0;
      &.warning {
        background: #fffbeb;
        color: #b45309;
        border: 1px solid #fde68a;
      }
    }

    /* KPI Summary Cards Grid */
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(5, minmax(0, 1fr));
      gap: 14px;
      width: 100%;
      box-sizing: border-box;
      flex-shrink: 0;
    }

    @media (max-width: 1300px) {
      .kpi-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); }
    }
    @media (max-width: 860px) {
      .kpi-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    }
    @media (max-width: 540px) {
      .kpi-grid { grid-template-columns: 1fr; }
    }

    .kpi-card {
      background: #ffffff;
      border-radius: var(--radius-md, 14px);
      padding: 18px 16px;
      border: 1px solid #eef0f3;
      box-shadow: 0 4px 14px rgba(0, 0, 0, 0.03);
      display: flex;
      align-items: center;
      gap: 14px;
      min-width: 0;
      overflow: hidden;
      transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;

      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 20px rgba(0, 0, 0, 0.06);
        border-color: #cbd5e1;
      }
    }

    .kpi-icon-box {
      width: 48px;
      height: 48px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      .material-symbols-outlined { font-size: 24px; }

      &.green { background: #ecfdf5; color: #065f46; }
      &.blue { background: #eff6ff; color: #1e40af; }
      &.orange { background: #fef3c7; color: #92400e; }
      &.rose { background: #fee2e2; color: #991b1b; }
      &.purple { background: #f3e8ff; color: #6b21a8; }
    }

    .kpi-info {
      display: flex;
      flex-direction: column;
      overflow: hidden;
      min-width: 0;
    }

    .kpi-label {
      font-size: 0.72rem;
      color: #64748b;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .kpi-val {
      font-size: 1.35rem;
      font-weight: 800;
      color: #0f172a;
      line-height: 1.25;
      margin: 3px 0;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      &.danger { color: #dc2626; }
    }

    .kpi-sub {
      font-size: 0.74rem;
      color: #64748b;
      font-weight: 600;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      display: inline-flex;
      align-items: center;
      gap: 3px;

      &.green { color: #059669; }
      &.danger { color: #dc2626; }

      .inline-icon {
        font-size: 14px;
        vertical-align: middle;
      }
    }

    /* Navigation Tabs Bar */
    .nav-tabs-bar {
      display: flex;
      gap: 8px;
      background: #ffffff;
      padding: 8px 10px;
      border-radius: var(--radius-md, 14px);
      border: 1px solid #e2e8f0;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.03);
      flex-shrink: 0;
      align-items: center;
      flex-wrap: wrap;
      width: 100%;
      box-sizing: border-box;
    }

    .tab-btn {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      background: transparent;
      border: 1px solid transparent;
      padding: 9px 18px;
      border-radius: 10px;
      font-size: 0.86rem;
      font-weight: 700;
      color: #475569;
      cursor: pointer;
      white-space: nowrap;
      flex-shrink: 0;
      min-height: 40px;
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);

      .material-symbols-outlined {
        font-size: 20px;
        color: #64748b;
        transition: color 0.2s ease;
      }

      .tab-label {
        font-weight: 700;
      }

      &:hover:not(.active) {
        background: #f8fafc;
        color: #0f172a;
        .material-symbols-outlined { color: #065f46; }
      }

      &.active {
        background: #065f46;
        color: #ffffff;
        border-color: #065f46;
        box-shadow: 0 4px 12px rgba(6, 95, 70, 0.25);

        .material-symbols-outlined {
          color: #ffffff;
        }
      }
    }

    /* Section Cards (Report Containers) */
    .section-card {
      background: #ffffff;
      border-radius: var(--radius-lg, 16px);
      border: 1px solid #eef0f3;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.03);
      padding: 24px;
      display: flex;
      flex-direction: column;
      gap: 20px;
      width: 100%;
      box-sizing: border-box;
    }

    .card-inner-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      flex-wrap: wrap;
      gap: 16px;
      padding-bottom: 4px;
      border-bottom: 1px solid #f1f5f9;
    }

    .card-title-row {
      display: flex;
      align-items: center;
      gap: 14px;
      flex-wrap: wrap;

      .title-icon {
        font-size: 30px;
        &.green { color: #065f46; }
        &.blue { color: #1e40af; }
        &.emerald { color: #059669; }
        &.orange { color: #d97706; }
        &.purple { color: #7c3aed; }
      }

      h3 {
        margin: 0;
        font-size: 1.18rem;
        font-weight: 800;
        color: #0f172a;
        letter-spacing: -0.015em;
      }

      .card-meta {
        margin: 3px 0 0 0;
        font-size: 0.82rem;
        color: #64748b;
        font-weight: 500;
      }
    }

    .card-controls-group {
      display: flex;
      align-items: center;
      gap: 12px;
      flex-wrap: wrap;
      margin-left: auto;
      justify-content: flex-end;
    }

    /* Print Button inside Each Report Container */
    .btn-card-print {
      display: inline-flex;
      align-items: center;
      gap: 7px;
      background: #f8fafc;
      color: #334155;
      border: 1.5px solid #cbd5e1;
      padding: 8px 16px;
      border-radius: 10px;
      font-size: 0.84rem;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.2s ease;
      .material-symbols-outlined { font-size: 18px; color: #475569; }

      &:hover {
        background: #065f46;
        color: #ffffff;
        border-color: #065f46;
        box-shadow: 0 3px 10px rgba(6, 95, 70, 0.2);
        .material-symbols-outlined { color: #ffffff; }
      }
    }

    /* Limit Pill Selector */
    .pill-selector {
      display: inline-flex;
      background: #f1f5f9;
      padding: 3px;
      border-radius: 9px;
      gap: 2px;
    }

    .pill-option {
      border: none;
      background: transparent;
      padding: 6px 14px;
      border-radius: 7px;
      font-size: 0.8rem;
      font-weight: 700;
      color: #64748b;
      cursor: pointer;
      transition: all 0.15s ease;

      &.active {
        background: #ffffff;
        color: #065f46;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      }
    }

    /* Date Filter Box in Rollup & Reconciliation */
    .date-filter-box {
      display: flex;
      align-items: center;
      gap: 8px;
      background: #ffffff;
      border: 1.5px solid #cbd5e1;
      padding: 5px 12px;
      border-radius: 10px;
      font-size: 0.82rem;
      font-weight: 600;
      color: #334155;
      white-space: nowrap;
      flex-shrink: 0;
    }

    .small-select {
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      padding: 4px 8px;
      font-size: 0.82rem;
      font-weight: 700;
      color: #0f172a;
      background: #f8fafc;
      outline: none;
      cursor: pointer;
    }

    /* Tables & Typography */
    .table-responsive {
      overflow-x: auto;
      width: 100%;
    }

    .data-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.88rem;

      th {
        background: #f8fafc;
        color: #475569;
        font-weight: 700;
        font-size: 0.76rem;
        text-transform: uppercase;
        letter-spacing: 0.04em;
        padding: 13px 16px;
        border-bottom: 2px solid #e2e8f0;
        text-align: left;
        white-space: nowrap;
      }

      td {
        padding: 15px 16px;
        border-bottom: 1px solid #f1f5f9;
        color: #334155;
        vertical-align: middle;
      }

      tr:hover td {
        background: #f8fafc;
      }
    }

    .empty-state-cell {
      text-align: center;
      padding: 32px 16px !important;
      color: #94a3b8;
      font-weight: 500;
    }

    .item-name {
      color: #0f172a;
      font-weight: 700;
      font-size: 0.9rem;
    }

    .code-sku {
      font-family: monospace;
      color: #475569;
      font-size: 0.78rem;
      background: #f1f5f9;
      padding: 3px 7px;
      border-radius: 6px;
      font-weight: 600;
    }

    .rev-val {
      font-weight: 800;
      color: #065f46;
      font-size: 0.94rem;
    }

    .rank-badge {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 4px 10px;
      border-radius: 8px;
      font-size: 0.8rem;
      font-weight: 800;
      background: #f1f5f9;
      color: #475569;

      &.gold { background: #fef3c7; color: #92400e; border: 1px solid #fde68a; }
      &.silver { background: #f1f5f9; color: #334155; border: 1px solid #cbd5e1; }
      &.bronze { background: #ffedd5; color: #9a3412; border: 1px solid #fed7aa; }
    }

    .volume-badge {
      background: #f1f5f9;
      padding: 4px 12px;
      border-radius: 999px;
      font-size: 0.78rem;
      font-weight: 700;
      color: #475569;
    }

    .date-badge {
      font-family: monospace;
      background: #f1f5f9;
      padding: 4px 9px;
      border-radius: 6px;
      font-size: 0.8rem;
      color: #334155;
      font-weight: 600;
    }

    .orders-count-badge {
      font-weight: 700;
      color: #1e40af;
      background: #eff6ff;
      padding: 4px 11px;
      border-radius: 999px;
      font-size: 0.78rem;
    }

    /* Rollup Table Highlights */
    .rollup-table {
      .row-subtotal {
        background: #f0fdf4 !important;
        border-top: 2px solid #bbf7d0;
        border-bottom: 2px solid #bbf7d0;
        td { font-weight: 800; color: #166534; font-size: 0.9rem; }
      }

      .row-grandtotal {
        background: #ecfdf5 !important;
        border-top: 2.5px solid #065f46;
        border-bottom: 2.5px solid #065f46;
        td { font-weight: 900; color: #064e3b; font-size: 0.98rem; }
      }
    }

    .grand-total-cell {
      display: flex;
      align-items: center;
      gap: 7px;
      color: #065f46;
      .material-symbols-outlined { font-size: 20px; color: #065f46; }
    }

    .subtotal-cell {
      display: flex;
      align-items: center;
      gap: 7px;
      color: #1e40af;
      .material-symbols-outlined { font-size: 19px; color: #1e40af; }
    }

    .highlight-grand {
      font-size: 1.15rem;
      color: #065f46;
      font-weight: 900;
    }

    .rollup-badge {
      color: #94a3b8;
      font-weight: 700;
    }

    .badge-pill {
      display: inline-flex;
      align-items: center;
      padding: 4px 11px;
      border-radius: 999px;
      font-size: 0.74rem;
      font-weight: 700;
      letter-spacing: 0.02em;

      &.badge-grand { background: #065f46; color: #ffffff; }
      &.badge-subtotal { background: #dbeafe; color: #1e40af; }
      &.badge-regular { background: #f1f5f9; color: #475569; }
      &.badge-tier { background: #fef3c7; color: #92400e; border: 1px solid #fde68a; }
    }

    /* Hierarchy Progress Bar (CTE) */
    .level-indicator {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      font-size: 0.74rem;
      font-weight: 700;
      padding: 3px 9px;
      border-radius: 6px;
      .material-symbols-outlined { font-size: 15px; }

      &.level-1 { background: #ecfdf5; color: #065f46; }
      &.level-2 { background: #f1f5f9; color: #475569; }
      &.level-3 { background: #fef3c7; color: #92400e; }
    }

    .category-name-cell {
      color: #0f172a;
      font-size: 0.9rem;
    }

    .progress-bar-container {
      display: flex;
      align-items: center;
      gap: 10px;
      width: 100%;
    }

    .progress-bar-fill {
      height: 8px;
      background: linear-gradient(90deg, #065f46, #10b981);
      border-radius: 999px;
      transition: width 0.4s ease;
      min-width: 6px;
    }

    .progress-label {
      font-size: 0.76rem;
      font-weight: 800;
      color: #334155;
      font-family: monospace;
      width: 44px;
      text-align: right;
    }

    /* Promotional ROI */
    .discount-cost {
      color: #dc2626;
      font-weight: 700;
    }

    .roi-pill {
      background: #ecfdf5;
      color: #065f46;
      border: 1px solid #a7f3d0;
      padding: 4px 11px;
      border-radius: 7px;
      font-weight: 800;
      font-size: 0.8rem;
    }

    .supplier-name-cell {
      display: flex;
      flex-direction: column;
      gap: 2px;
      .supplier-code {
        font-family: monospace;
        font-size: 0.74rem;
        color: #64748b;
      }
    }

    .contact-info {
      display: flex;
      flex-direction: column;
      gap: 2px;
      .contact-name {
        font-size: 0.84rem;
        font-weight: 600;
        color: #0f172a;
      }
      .contact-email {
        font-size: 0.76rem;
        color: #64748b;
      }
    }

    .qty-val {
      font-family: monospace;
      font-size: 0.86rem;
      font-weight: 600;
      color: #334155;
      &.confirmed {
        color: #065f46;
        font-weight: 800;
      }
    }

    .fulfillment-meter {
      display: flex;
      align-items: center;
      gap: 10px;
      width: 100%;
    }

    .fulfillment-track {
      flex: 1;
      height: 8px;
      background: #e2e8f0;
      border-radius: 999px;
      overflow: hidden;
    }

    .fulfillment-fill {
      height: 100%;
      border-radius: 999px;
      transition: width 0.4s ease;
      &.fill-high { background: #065f46; }
      &.fill-mid { background: #d97706; }
      &.fill-low { background: #dc2626; }
    }

    .fulfillment-pct {
      font-family: monospace;
      font-size: 0.8rem;
      font-weight: 800;
      width: 50px;
      text-align: right;
      &.pct-high { color: #065f46; }
      &.pct-mid { color: #d97706; }
      &.pct-low { color: #dc2626; }
    }

    .tier-badge {
      display: inline-flex;
      align-items: center;
      padding: 4px 11px;
      border-radius: 999px;
      font-size: 0.72rem;
      font-weight: 800;
      letter-spacing: 0.04em;
      text-transform: uppercase;

      &.tier-preferred {
        background: #ecfdf5;
        color: #065f46;
        border: 1px solid #a7f3d0;
      }
      &.tier-reliable {
        background: #eff6ff;
        color: #1e40af;
        border: 1px solid #bfdbfe;
      }
      &.tier-review {
        background: #fef2f2;
        color: #991b1b;
        border: 1px solid #fecaca;
      }
    }

    /* Modern Pagination Bar Component */
    .pagination-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 12px;
      padding-top: 16px;
      border-top: 1px solid #f1f5f9;
      font-size: 0.86rem;
    }

    .pagination-info {
      color: #64748b;
      font-size: 0.84rem;
      font-weight: 500;

      strong {
        color: #0f172a;
        font-weight: 700;
      }
    }

    .pagination-controls {
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .page-btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      border: 1px solid #e2e8f0;
      background: #ffffff;
      color: #334155;
      font-size: 0.82rem;
      font-weight: 700;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.15s ease;

      &:hover:not(:disabled) {
        background: #f8fafc;
        border-color: #065f46;
        color: #065f46;
      }

      &:disabled {
        opacity: 0.45;
        cursor: not-allowed;
        background: #f8fafc;
      }

      &.nav-btn {
        padding: 6px 12px;
        gap: 4px;
        .material-symbols-outlined { font-size: 18px; }
      }

      &.number-btn {
        width: 34px;
        height: 34px;

        &.active {
          background: #065f46;
          color: #ffffff;
          border-color: #065f46;
          box-shadow: 0 2px 6px rgba(6, 95, 70, 0.25);
        }
      }
    }

    /* Audit & Financial Reconciliation Report Styles */
    .audit-status-banner {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-left: 5px solid #64748b;
      border-radius: 12px;
      padding: 16px 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 16px;
      flex-wrap: wrap;

      &.balanced {
        background: #ecfdf5;
        border-color: #a7f3d0;
        border-left: 5px solid #059669;
      }

      .banner-left {
        display: flex;
        align-items: center;
        gap: 14px;

        .banner-icon {
          font-size: 32px;
          color: #059669;
        }

        .banner-title {
          font-size: 0.95rem;
          font-weight: 800;
          color: #064e3b;
          display: block;
          margin-bottom: 2px;
          letter-spacing: 0.02em;
        }

        .banner-desc {
          margin: 0;
          font-size: 0.8rem;
          color: #334155;
          code {
            background: rgba(0, 0, 0, 0.06);
            padding: 2px 6px;
            border-radius: 4px;
            font-weight: 700;
            color: #047857;
          }
        }
      }

      .variance-pill {
        background: #f1f5f9;
        color: #475569;
        font-size: 0.82rem;
        font-weight: 800;
        padding: 6px 14px;
        border-radius: 20px;
        border: 1px solid #cbd5e1;
        white-space: nowrap;

        &.zero {
          background: #d1fae5;
          color: #065f46;
          border-color: #6ee7b7;
        }
      }
    }

    .recon-kpi-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 14px;
      margin-top: 4px;
      margin-bottom: 4px;
    }

    .recon-kpi-card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 4px;

      &.highlight-net {
        background: #ecfdf5;
        border-color: #a7f3d0;
      }

      &.highlight-collected {
        background: #eff6ff;
        border-color: #bfdbfe;
      }

      .recon-label {
        font-size: 0.72rem;
        font-weight: 700;
        color: #64748b;
        letter-spacing: 0.04em;
        text-transform: uppercase;
      }

      .recon-val {
        font-size: 1.35rem;
        font-weight: 900;
        color: #0f172a;
        letter-spacing: -0.02em;

        &.orange { color: #d97706; }
        &.green { color: #059669; }
        &.blue { color: #2563eb; }
      }

      .recon-sub {
        font-size: 0.75rem;
        color: #64748b;
        font-weight: 500;

        &.green { color: #047857; font-weight: 700; }
        &.blue { color: #1d4ed8; font-weight: 700; }
      }
    }

    .tender-cell {
      display: flex;
      align-items: center;
      gap: 10px;

      .tender-icon {
        font-size: 22px;
        color: #64748b;
        background: #f1f5f9;
        padding: 6px;
        border-radius: 8px;
      }

      strong {
        font-size: 0.88rem;
        color: #0f172a;
        font-weight: 700;
      }
    }

    .orders-count-badge {
      display: inline-block;
      font-size: 0.78rem;
      font-weight: 700;
      color: #475569;
      background: #f1f5f9;
      padding: 3px 10px;
      border-radius: 12px;
    }

    .date-input {
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      padding: 4px 8px;
      font-size: 0.82rem;
      font-weight: 600;
      color: #0f172a;
      background: #f8fafc;
      outline: none;
      font-family: inherit;
      cursor: pointer;

      &:focus {
        border-color: #065f46;
        background: #ffffff;
      }
    }

    /* Print Media Styles */
    @media print {
      .no-print,
      app-sidebar,
      .page-header,
      .kpi-grid,
      .nav-tabs-bar,
      .btn-card-print,
      .pill-selector,
      .notice-bar,
      .date-filter-box,
      .pagination-bar {
        display: none !important;
      }

      body,
      .pos-app-wrapper,
      .pos-main-container,
      .page-container {
        height: auto !important;
        min-height: auto !important;
        overflow: visible !important;
        background: #ffffff !important;
        padding: 0 !important;
        margin: 0 !important;
        width: 100% !important;
      }

      .print-official-header {
        display: block !important;
        margin-bottom: 20px;
        padding-bottom: 12px;
      }

      .print-header-content {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
      }

      .print-brand-title {
        font-size: 1.4rem;
        font-weight: 900;
        color: #064e3b;
        margin: 0;
        letter-spacing: 0.05em;
      }

      .print-brand-sub {
        font-size: 0.8rem;
        color: #475569;
        margin: 4px 0 0 0;
      }

      .print-meta-box {
        text-align: right;
        font-size: 0.78rem;
        color: #334155;
      }

      .print-meta-row {
        margin-bottom: 3px;
        .meta-label { font-weight: 600; color: #64748b; margin-right: 6px; }
        .meta-value { font-weight: 800; color: #0f172a; }
      }

      .print-divider-line {
        height: 3px;
        background: #065f46;
        margin-top: 12px;
      }

      .section-card {
        box-shadow: none !important;
        border: 1px solid #cbd5e1 !important;
        padding: 16px !important;
        width: 100% !important;
        page-break-inside: avoid;
        margin-bottom: 20px;
      }

      .data-table {
        width: 100% !important;
        border-collapse: collapse !important;
        th {
          background: #f1f5f9 !important;
          color: #0f172a !important;
          border: 1px solid #cbd5e1 !important;
          padding: 8px 10px !important;
          font-size: 0.75rem !important;
        }
        td {
          border: 1px solid #e2e8f0 !important;
          padding: 7px 10px !important;
          color: #0f172a !important;
          font-size: 0.8rem !important;
        }
      }

      .progress-bar-fill,
      .fulfillment-fill {
        background: #065f46 !important;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }

      .rank-badge, .badge-pill, .level-indicator, .roi-pill, .tier-badge {
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }

      @page {
        size: auto;
        margin: 12mm 15mm;
      }
    }
  `]
})
export class ReportsDashboardComponent {
  readonly reportService = inject(ReportService);
  readonly authService = inject(AuthService);

  constructor() {
    const userBranch = this.authService.currentUser()?.branchId;
    if (userBranch && this.reportService.selectedBranchId() !== userBranch) {
      this.reportService.selectedBranchId.set(userBranch);
      this.reportService.refreshAll();
    }
  }

  readonly activeTab = signal<'RANKINGS' | 'DAILY_SALES' | 'ROLLUP' | 'CTE' | 'PROMOTIONS' | 'SUPPLIERS' | 'RECONCILIATION'>('RANKINGS');
  readonly currentPrintingTitle = signal<string>('');
  readonly isPrinting = signal<boolean>(false);
  currentPrintDate = new Date();

  // Pagination Signals for relevant reports
  readonly dailySalesPage = signal<number>(1);
  readonly dailySalesPageSize = signal<number>(10);

  readonly rollupPage = signal<number>(1);
  readonly rollupPageSize = signal<number>(10);

  readonly ctePage = signal<number>(1);
  readonly ctePageSize = signal<number>(10);

  readonly promotionsPage = signal<number>(1);
  readonly promotionsPageSize = signal<number>(10);

  readonly suppliersPage = signal<number>(1);
  readonly suppliersPageSize = signal<number>(10);

  // Computes rankings based on the active Top 5 / Top 10 / Top 25 limit selector
  readonly displayedRankings = computed(() => {
    const list = this.reportService.productRankings();
    const limit = this.reportService.rankingLimit();
    return list.slice(0, limit);
  });

  readonly displayedSuppliers = computed(() => {
    return this.reportService.supplierPerformance();
  });

  // Paginated Data Computeds (return full dataset during print, sliced on screen)
  readonly paginatedDailySales = computed(() => {
    const all = this.reportService.dailySalesHistory();
    if (this.isPrinting()) return all;
    const start = (this.dailySalesPage() - 1) * this.dailySalesPageSize();
    return all.slice(start, start + this.dailySalesPageSize());
  });

  readonly dailySalesTotalPages = computed(() => {
    const total = this.reportService.dailySalesHistory().length;
    return Math.max(1, Math.ceil(total / this.dailySalesPageSize()));
  });

  readonly paginatedRollup = computed(() => {
    const all = this.reportService.monthlyRollupReport();
    if (this.isPrinting()) return all;
    const start = (this.rollupPage() - 1) * this.rollupPageSize();
    return all.slice(start, start + this.rollupPageSize());
  });

  readonly rollupTotalPages = computed(() => {
    const total = this.reportService.monthlyRollupReport().length;
    return Math.max(1, Math.ceil(total / this.rollupPageSize()));
  });

  readonly paginatedCte = computed(() => {
    const all = this.reportService.categorySalesCte();
    if (this.isPrinting()) return all;
    const start = (this.ctePage() - 1) * this.ctePageSize();
    return all.slice(start, start + this.ctePageSize());
  });

  readonly cteTotalPages = computed(() => {
    const total = this.reportService.categorySalesCte().length;
    return Math.max(1, Math.ceil(total / this.ctePageSize()));
  });

  readonly paginatedPromotions = computed(() => {
    const all = this.reportService.discountImpact();
    if (this.isPrinting()) return all;
    const start = (this.promotionsPage() - 1) * this.promotionsPageSize();
    return all.slice(start, start + this.promotionsPageSize());
  });

  readonly promotionsTotalPages = computed(() => {
    const total = this.reportService.discountImpact().length;
    return Math.max(1, Math.ceil(total / this.promotionsPageSize()));
  });

  readonly paginatedSuppliers = computed(() => {
    const all = this.displayedSuppliers();
    if (this.isPrinting()) return all;
    const start = (this.suppliersPage() - 1) * this.suppliersPageSize();
    return all.slice(start, start + this.suppliersPageSize());
  });

  readonly suppliersTotalPages = computed(() => {
    const total = this.displayedSuppliers().length;
    return Math.max(1, Math.ceil(total / this.suppliersPageSize()));
  });

  // Math helper for template bounds
  min(a: number, b: number): number {
    return Math.min(a, b);
  }

  // Generates page number buttons array
  getPageNumbers(totalPages: number, currentPage: number): number[] {
    const pages: number[] = [];
    const maxButtons = 5;
    let start = Math.max(1, currentPage - 2);
    let end = Math.min(totalPages, start + maxButtons - 1);
    if (end - start + 1 < maxButtons) {
      start = Math.max(1, end - maxButtons + 1);
    }
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  }

  // Pagination navigation setters
  setDailySalesPage(p: number): void {
    if (p >= 1 && p <= this.dailySalesTotalPages()) {
      this.dailySalesPage.set(p);
    }
  }

  setRollupPage(p: number): void {
    if (p >= 1 && p <= this.rollupTotalPages()) {
      this.rollupPage.set(p);
    }
  }

  setCtePage(p: number): void {
    if (p >= 1 && p <= this.cteTotalPages()) {
      this.ctePage.set(p);
    }
  }

  setPromotionsPage(p: number): void {
    if (p >= 1 && p <= this.promotionsTotalPages()) {
      this.promotionsPage.set(p);
    }
  }

  setSuppliersPage(p: number): void {
    if (p >= 1 && p <= this.suppliersTotalPages()) {
      this.suppliersPage.set(p);
    }
  }

  getAverageFulfillmentRate(): string {
    const list = this.displayedSuppliers();
    if (!list.length) return '0.0';
    const sum = list.reduce((acc, s) => acc + (s.fulfillmentRate || 0), 0);
    return (sum / list.length).toFixed(1);
  }

  getPreferredSupplierCount(): number {
    return this.displayedSuppliers().filter(s => s.ratingTier === 'PREFERRED').length;
  }

  getTotalProcurementSpend(): number {
    return this.displayedSuppliers().reduce((acc, s) => acc + (s.totalSpend || 0), 0);
  }

  onLimitChange(limit: number): void {
    this.reportService.onRankingsLimitChange(limit);
  }

  onBranchSelect(branchId: number | null): void {
    this.reportService.onBranchChange(branchId);
    this.dailySalesPage.set(1);
    this.rollupPage.set(1);
  }

  onYearChange(year: number): void {
    this.reportService.onDateFilterChange(year, this.reportService.selectedMonth());
    this.rollupPage.set(1);
  }

  onMonthChange(month: number): void {
    this.reportService.onDateFilterChange(this.reportService.selectedYear(), month);
    this.rollupPage.set(1);
  }

  onReconStartDateChange(date: string): void {
    this.reportService.onReconDateChange(date, this.reportService.reconEndDate());
  }

  onReconEndDateChange(date: string): void {
    this.reportService.onReconDateChange(this.reportService.reconStartDate(), date);
  }

  getBranchName(): string {
    const id = this.reportService.selectedBranchId();
    if (!id) return 'All Supermarket Branches (Chain-Wide)';
    const found = this.reportService.branches.find(b => b.id === id);
    return found ? found.name : 'All Supermarket Branches';
  }

  printReport(reportTitle: string): void {
    this.currentPrintingTitle.set(reportTitle);
    this.currentPrintDate = new Date();
    this.isPrinting.set(true);
    setTimeout(() => {
      window.print();
      this.isPrinting.set(false);
    }, 100);
  }
}
