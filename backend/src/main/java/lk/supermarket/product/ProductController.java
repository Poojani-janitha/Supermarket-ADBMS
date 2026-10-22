package lk.supermarket.product;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "http://localhost:4200")
public class ProductController {
    private final ProductService productService;

    public ProductController(ProductService productService) {
        this.productService = productService;
    }

    @GetMapping("/products")
    public List<Map<String, Object>> products(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Integer categoryId,
            @RequestParam(required = false) Boolean active) {
        return productService.findProducts(search, categoryId, active);
    }

    @PostMapping("/products")
    @ResponseStatus(HttpStatus.CREATED)
    public Map<String, Object> createProduct(@RequestBody Map<String, Object> request) {
        return Map.of("productId", productService.saveProduct(productParameters(request)));
    }

    @PutMapping("/products/{productId}")
    public Map<String, Object> updateProduct(
            @PathVariable int productId,
            @RequestBody Map<String, Object> request) {
        Map<String, Object> parameters = productParameters(request);
        parameters.put("p_product_id", productId);
        return Map.of("productId", productService.saveProduct(parameters));
    }

    private Map<String, Object> productParameters(Map<String, Object> request) {
        Map<String, Object> parameters = new HashMap<>();
        parameters.put("p_product_id", request.get("productId"));
        parameters.put("p_category_id", request.get("categoryId"));
        parameters.put("p_supplier_id", request.get("supplierId"));
        parameters.put("p_sku", request.get("sku"));
        parameters.put("p_name", request.get("name"));
        parameters.put("p_unit_price", request.get("unitPrice"));
        parameters.put("p_cost_price", request.get("costPrice"));
        parameters.put("p_image_url", request.get("imageUrl"));
        parameters.put("p_diet_type", request.get("dietType"));
        parameters.put("p_unit_of_measure", request.get("unitOfMeasure"));
        parameters.put("p_min_order_qty", request.getOrDefault("minOrderQty", 1));
        parameters.put("p_is_active", request.getOrDefault("isActive", true));
        return parameters;
    }
}
