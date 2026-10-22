package lk.supermarket.report;

import lk.supermarket.report.dto.*;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/reports")
@CrossOrigin(origins = {"http://localhost:4200", "http://127.0.0.1:4200"})
public class ReportController {

    private final ReportService reportService;

    public ReportController(ReportService reportService) {
        this.reportService = reportService;
    }

    @GetMapping("/summary")
    public ResponseEntity<SummaryMetricsDto> getSummaryMetrics(@RequestParam(required = false) Integer branchId) {
        return ResponseEntity.ok(reportService.getSummaryMetrics(branchId));
    }

    @GetMapping("/product-rankings")
    public ResponseEntity<List<ProductRankDto>> getProductRankings(
            @RequestParam(defaultValue = "10") Integer limit) {
        return ResponseEntity.ok(reportService.getProductRankings(limit));
    }

    @GetMapping("/daily-sales")
    public ResponseEntity<List<DailySalesDto>> getDailySales(
            @RequestParam(required = false) Integer branchId,
            @RequestParam(defaultValue = "30") Integer limit) {
        return ResponseEntity.ok(reportService.getDailySales(branchId, limit));
    }

    @GetMapping("/monthly-rollup")
    public ResponseEntity<List<MonthlyRollupDto>> getMonthlyRollup(
            @RequestParam(required = false) Integer year,
            @RequestParam(required = false) Integer month,
            @RequestParam(required = false) Integer branchId) {
        java.time.LocalDate now = java.time.LocalDate.now();
        int targetYear = (year != null) ? year : now.getYear();
        int targetMonth = (month != null) ? month : now.getMonthValue();
        return ResponseEntity.ok(reportService.getMonthlyRollup(targetYear, targetMonth, branchId));
    }

    @GetMapping("/category-sales")
    public ResponseEntity<List<CategorySalesCteDto>> getCategorySalesCte() {
        return ResponseEntity.ok(reportService.getCategorySalesCte());
    }

    @GetMapping("/discount-impact")
    public ResponseEntity<List<DiscountImpactDto>> getDiscountImpact() {
        return ResponseEntity.ok(reportService.getDiscountImpact());
    }

    @GetMapping("/supplier-performance")
    public ResponseEntity<List<SupplierPerformanceDto>> getSupplierPerformance() {
        return ResponseEntity.ok(reportService.getSupplierPerformance());
    }

    @GetMapping("/explain-benchmark")
    public ResponseEntity<ExplainBenchmarkDto> getExplainBenchmark() {
        return ResponseEntity.ok(reportService.getExplainBenchmark());
    }
}
