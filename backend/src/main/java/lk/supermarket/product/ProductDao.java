package lk.supermarket.product;

import java.util.List;
import java.util.Map;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.SqlOutParameter;
import org.springframework.jdbc.core.SqlParameter;
import org.springframework.jdbc.core.simple.SimpleJdbcCall;
import org.springframework.stereotype.Repository;

@Repository
public class ProductDao {
    private final JdbcTemplate jdbcTemplate;

    public ProductDao(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public List<Map<String, Object>> findProducts(String search, Integer categoryId, Boolean active) {
        String sql;
        Object[] args;
        if (search != null && !search.isBlank()) {
            sql = """
                    SELECT p.product_id, p.sku, p.name AS product_name, p.category_id,
                           c.name AS category_name, p.supplier_id, s.name AS supplier_name,
                           p.unit_price, p.cost_price, p.image_url, p.diet_type,
                           p.unit_of_measure, p.min_order_qty, p.is_active
                    FROM product p
                    JOIN category c ON c.category_id = p.category_id
                    JOIN supplier s ON s.supplier_id = p.supplier_id
                    WHERE (? IS NULL OR p.category_id = ?)
                      AND (? IS NULL OR p.is_active = ?)
                      AND (MATCH(p.name) AGAINST (? IN BOOLEAN MODE) OR p.sku LIKE ?)
                    ORDER BY product_name
                    """;
            args = new Object[] {categoryId, categoryId, active, active,
                    search.trim() + "*", "%" + search.trim() + "%"};
        } else {
            sql = """
                    SELECT product_id, sku, product_name, category_id, category_name,
                           supplier_id, supplier_name, unit_price, cost_price, image_url,
                           diet_type, unit_of_measure, min_order_qty, is_active
                    FROM v_product_catalog
                    WHERE (? IS NULL OR category_id = ?)
                      AND (? IS NULL OR is_active = ?)
                    ORDER BY product_name
                    """;
            args = new Object[] {categoryId, categoryId, active, active};
        }
        return jdbcTemplate.queryForList(sql, args);
    }

    public List<Map<String, Object>> findCategories() {
        return jdbcTemplate.queryForList("""
                SELECT category_id, name, description, icon, parent_id, active_product_count
                FROM v_category_summary
                ORDER BY name
                """);
    }

    public int createCategory(Map<String, ?> parameters) {
        String name = parameters.get("name").toString().trim();
        String description = valueOrNull(parameters.get("description"));
        String icon = valueOrNull(parameters.get("icon"));
        Integer parentId = parameters.get("parentId") == null
                ? null
                : ((Number) parameters.get("parentId")).intValue();

        jdbcTemplate.update("""
                INSERT INTO category (name, description, icon, parent_id)
                VALUES (?, ?, COALESCE(?, 'category'), ?)
                """, name, description, icon, parentId);
        return jdbcTemplate.queryForObject("SELECT LAST_INSERT_ID()", Integer.class);
    }

    private String valueOrNull(Object value) {
        if (value == null || value.toString().isBlank()) {
            return null;
        }
        return value.toString().trim();
    }

    public int countActiveSupplier(int supplierId) {
        Integer count = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM supplier WHERE supplier_id = ? AND is_active = TRUE AND status = 'ACTIVE'",
                Integer.class, supplierId);
        return count == null ? 0 : count;
    }

    public int saveProduct(Map<String, ?> parameters) {
        SimpleJdbcCall call = new SimpleJdbcCall(jdbcTemplate)
                .withProcedureName("sp_save_product")
                .declareParameters(
                        new SqlParameter("p_product_id", java.sql.Types.INTEGER),
                        new SqlParameter("p_category_id", java.sql.Types.INTEGER),
                        new SqlParameter("p_supplier_id", java.sql.Types.INTEGER),
                        new SqlParameter("p_sku", java.sql.Types.VARCHAR),
                        new SqlParameter("p_name", java.sql.Types.VARCHAR),
                        new SqlParameter("p_unit_price", java.sql.Types.DECIMAL),
                        new SqlParameter("p_cost_price", java.sql.Types.DECIMAL),
                        new SqlParameter("p_image_url", java.sql.Types.VARCHAR),
                        new SqlParameter("p_diet_type", java.sql.Types.VARCHAR),
                        new SqlParameter("p_unit_of_measure", java.sql.Types.VARCHAR),
                        new SqlParameter("p_min_order_qty", java.sql.Types.DECIMAL),
                        new SqlParameter("p_is_active", java.sql.Types.BOOLEAN),
                        new SqlOutParameter("p_saved_product_id", java.sql.Types.INTEGER));
        Number id = (Number) call.execute(parameters).get("p_saved_product_id");
        return id.intValue();
    }
}
