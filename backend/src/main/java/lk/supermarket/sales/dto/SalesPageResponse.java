package lk.supermarket.sales.dto;

import java.util.List;

public class SalesPageResponse {
    private List<OrderSummaryDto> items;
    private long totalItems;
    private int page;
    private int size;
    private int totalPages;

    public SalesPageResponse() {}

    public SalesPageResponse(List<OrderSummaryDto> items, long totalItems, int page, int size) {
        this.items = items;
        this.totalItems = totalItems;
        this.page = page;
        this.size = size;
        this.totalPages = (int) Math.ceil((double) totalItems / size);
    }

    public List<OrderSummaryDto> getItems() {
        return items;
    }

    public void setItems(List<OrderSummaryDto> items) {
        this.items = items;
    }

    public long getTotalItems() {
        return totalItems;
    }

    public void setTotalItems(long totalItems) {
        this.totalItems = totalItems;
    }

    public int getPage() {
        return page;
    }

    public void setPage(int page) {
        this.page = page;
    }

    public int getSize() {
        return size;
    }

    public void setSize(int size) {
        this.size = size;
    }

    public int getTotalPages() {
        return totalPages;
    }

    public void setTotalPages(int totalPages) {
        this.totalPages = totalPages;
    }
}
