package lk.supermarket.product;

import java.util.List;
import java.util.Map;
import org.springframework.stereotype.Service;

@Service
public class ProductService {
    private final ProductDao productDao;

    public ProductService(ProductDao productDao) {
        this.productDao = productDao;
    }

    public List<Map<String, Object>> findProducts(String search, Integer categoryId, Boolean active) {
        return productDao.findProducts(search, categoryId, active);
    }

    public List<Map<String, Object>> findCategories() {
        return productDao.findCategories();
    }

    public int createCategory(Map<String, ?> parameters) {
        Object nameValue = parameters.get("name");
        if (nameValue == null || nameValue.toString().isBlank()) {
            throw new IllegalArgumentException("Category name is required");
        }
        return productDao.createCategory(parameters);
    }

    public int saveProduct(Map<String, ?> parameters) {
        Object supplierId = parameters.get("p_supplier_id");
        if (supplierId instanceof Number && ((Number) supplierId).intValue() > 0) {
            if (productDao.countActiveSupplier(((Number) supplierId).intValue()) == 0) {
                throw new IllegalArgumentException("Selected supplier does not exist or is inactive");
            }
        }
        return productDao.saveProduct(parameters);
    }
}
