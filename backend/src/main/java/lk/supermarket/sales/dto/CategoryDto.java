package lk.supermarket.sales.dto;

public class CategoryDto {
    private Integer id;
    private String name;
    private String icon;
    private Integer itemCount;

    public CategoryDto() {}

    public CategoryDto(Integer id, String name, String icon, Integer itemCount) {
        this.id = id;
        this.name = name;
        this.icon = icon;
        this.itemCount = itemCount;
    }

    public Integer getId() { return id; }
    public void setId(Integer id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getIcon() { return icon; }
    public void setIcon(String icon) { this.icon = icon; }

    public Integer getItemCount() { return itemCount; }
    public void setItemCount(Integer itemCount) { this.itemCount = itemCount; }
}
