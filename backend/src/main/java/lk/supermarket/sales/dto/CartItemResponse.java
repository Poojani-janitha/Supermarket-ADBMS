package lk.supermarket.sales.dto;

import java.math.BigDecimal;

public class CartItemResponse {
    private ProductSummary product;
    private Integer quantity;
    private BigDecimal lineTotal;

    public CartItemResponse() {}

    public CartItemResponse(ProductSummary product, Integer quantity, BigDecimal lineTotal) {
        this.product = product;
        this.quantity = quantity;
        this.lineTotal = lineTotal;
    }

    public ProductSummary getProduct() {
        return product;
    }

    public void setProduct(ProductSummary product) {
        this.product = product;
    }

    public Integer getQuantity() {
        return quantity;
    }

    public void setQuantity(Integer quantity) {
        this.quantity = quantity;
    }

    public BigDecimal getLineTotal() {
        return lineTotal;
    }

    public void setLineTotal(BigDecimal lineTotal) {
        this.lineTotal = lineTotal;
    }

    public static class ProductSummary {
        private Integer id;
        private String name;
        private String sku;
        private BigDecimal unitPrice;

        public ProductSummary() {}

        public ProductSummary(Integer id, String name, String sku, BigDecimal unitPrice) {
            this.id = id;
            this.name = name;
            this.sku = sku;
            this.unitPrice = unitPrice;
        }

        public Integer getId() {
            return id;
        }

        public void setId(Integer id) {
            this.id = id;
        }

        public String getName() {
            return name;
        }

        public void setName(String name) {
            this.name = name;
        }

        public String getSku() {
            return sku;
        }

        public void setSku(String sku) {
            this.sku = sku;
        }

        public BigDecimal getUnitPrice() {
            return unitPrice;
        }

        public void setUnitPrice(BigDecimal unitPrice) {
            this.unitPrice = unitPrice;
        }
    }
}
