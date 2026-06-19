package com.suzuki.bike.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public class OrderItemDto {

    @NotNull
    private Long partId;

    @NotNull
    private String partName;

    @NotNull
    @Min(0)
    private Double price;

    @NotNull
    @Min(1)
    private Integer quantity;

    public OrderItemDto() {
    }

    public Long getPartId() { return partId; }
    public void setPartId(Long partId) { this.partId = partId; }
    public String getPartName() { return partName; }
    public void setPartName(String partName) { this.partName = partName; }
    public Double getPrice() { return price; }
    public void setPrice(Double price) { this.price = price; }
    public Integer getQuantity() { return quantity; }
    public void setQuantity(Integer quantity) { this.quantity = quantity; }
}
