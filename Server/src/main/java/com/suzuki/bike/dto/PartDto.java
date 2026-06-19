package com.suzuki.bike.dto;

import com.suzuki.bike.entity.enums.PartType;
import jakarta.validation.constraints.*;

public class PartDto {

    private Long id;

    @NotNull(message = "Type is required")
    private PartType type;

    @NotBlank(message = "Part name is required")
    @Size(max = 100)
    private String partName;

    @Size(max = 100)
    private String compatibleModel;

    @NotNull(message = "Price is required")
    @DecimalMin(value = "0.0", inclusive = false)
    private Double price;

    @NotNull(message = "Quantity is required")
    @Min(0)
    private Integer quantity;

    @Size(max = 50)
    private String brand = "Suzuki";

    @Size(max = 500)
    private String imageUrl;

    public PartDto() {
    }

    public PartDto(Long id, PartType type, String partName, String compatibleModel, Double price, Integer quantity) {
        this.id = id;
        this.type = type;
        this.partName = partName;
        this.compatibleModel = compatibleModel;
        this.price = price;
        this.quantity = quantity;
    }

    public static PartDtoBuilder builder() {
        return new PartDtoBuilder();
    }

    public static class PartDtoBuilder {
        private Long id;
        private PartType type;
        private String partName;
        private String compatibleModel;
        private Double price;
        private Integer quantity;

        public PartDtoBuilder id(Long id) {
            this.id = id;
            return this;
        }

        public PartDtoBuilder type(PartType type) {
            this.type = type;
            return this;
        }

        public PartDtoBuilder partName(String partName) {
            this.partName = partName;
            return this;
        }

        public PartDtoBuilder compatibleModel(String compatibleModel) {
            this.compatibleModel = compatibleModel;
            return this;
        }

        public PartDtoBuilder price(Double price) {
            this.price = price;
            return this;
        }

        public PartDtoBuilder quantity(Integer quantity) {
            this.quantity = quantity;
            return this;
        }

        public PartDto build() {
            return new PartDto(id, type, partName, compatibleModel, price, quantity);
        }
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public PartType getType() { return type; }
    public void setType(PartType type) { this.type = type; }
    public String getPartName() { return partName; }
    public void setPartName(String partName) { this.partName = partName; }
    public String getCompatibleModel() { return compatibleModel; }
    public void setCompatibleModel(String compatibleModel) { this.compatibleModel = compatibleModel; }
    public Double getPrice() { return price; }
    public void setPrice(Double price) { this.price = price; }
    public Integer getQuantity() { return quantity; }
    public void setQuantity(Integer quantity) { this.quantity = quantity; }
    public String getBrand() { return brand; }
    public void setBrand(String brand) { this.brand = brand; }
    public String getImageUrl() { return imageUrl; }
    public void setImageUrl(String imageUrl) { this.imageUrl = imageUrl; }
}
