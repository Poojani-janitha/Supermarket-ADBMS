package lk.supermarket.sales.controller;

import lk.supermarket.sales.dao.ProductDao;
import lk.supermarket.sales.dto.CategoryDto;
import lk.supermarket.sales.dto.ProductDto;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
public class ProductController {

    private final ProductDao productDao;

    public ProductController(ProductDao productDao) {
        this.productDao = productDao;
    }

    @GetMapping("/products")
    public ResponseEntity<List<ProductDto>> getProducts(@RequestParam(value = "branchId", required = false, defaultValue = "1") Integer branchId) {
        return ResponseEntity.ok(productDao.findAllProducts(branchId));
    }

    @GetMapping("/categories")
    public ResponseEntity<List<CategoryDto>> getCategories() {
        return ResponseEntity.ok(productDao.findAllCategories());
    }
}
