package lk.supermarket.sales.dao;

import lk.supermarket.sales.dto.CategoryDto;
import lk.supermarket.sales.dto.ProductDto;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public class ProductDao {

    private final JdbcTemplate jdbcTemplate;

    public ProductDao(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public List<ProductDto> findAllProducts(Integer branchId) {
        int bId = branchId != null ? branchId : 1;
        String sql = """
            SELECT p.product_id, p.name, p.sku, p.unit_price, p.cost_price,
                   p.category_id, c.name AS category_name, p.image_url, p.diet_type, p.is_active,
                   COALESCE(i.quantity, 0) AS stock_qty
            FROM product p
            JOIN category c ON c.category_id = p.category_id
            LEFT JOIN inventory i ON i.product_id = p.product_id AND i.branch_id = ?
            WHERE p.is_active = TRUE
            ORDER BY p.product_id ASC
        """;

        return jdbcTemplate.query(sql, (rs, rowNum) -> {
            ProductDto p = new ProductDto();
            p.setId(rs.getInt("product_id"));
            p.setName(rs.getString("name"));
            p.setSku(rs.getString("sku"));
            p.setUnitPrice(rs.getBigDecimal("unit_price"));
            p.setCostPrice(rs.getBigDecimal("cost_price"));
            p.setCategoryId(rs.getInt("category_id"));
            p.setCategoryName(rs.getString("category_name"));
            p.setImageUrl(rs.getString("image_url"));
            p.setDietType(rs.getString("diet_type"));
            p.setIsActive(rs.getBoolean("is_active"));
            p.setStockQty(rs.getInt("stock_qty"));
            return p;
        }, bId);
    }

    public List<CategoryDto> findAllCategories() {
        String sql = """
            SELECT c.category_id, c.name, c.icon, COUNT(p.product_id) AS item_count
            FROM category c
            LEFT JOIN product p ON p.category_id = c.category_id AND p.is_active = TRUE
            GROUP BY c.category_id, c.name, c.icon
            ORDER BY c.category_id ASC
        """;

        return jdbcTemplate.query(sql, (rs, rowNum) ->
            new CategoryDto(
                rs.getInt("category_id"),
                rs.getString("name"),
                rs.getString("icon") != null ? rs.getString("icon") : "category",
                rs.getInt("item_count")
            )
        );
    }
}
