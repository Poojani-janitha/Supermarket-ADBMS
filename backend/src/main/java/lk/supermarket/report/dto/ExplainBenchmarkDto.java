package lk.supermarket.report.dto;
import java.util.Map;
public record ExplainBenchmarkDto(
    String queryDescription,
    String datasetSize,
    Map<String, Object> beforeOptimization,
    Map<String, Object> afterOptimization
){}