package com.suzuki.bike.dto;

import com.suzuki.bike.entity.enums.VehicleType;
import jakarta.validation.constraints.*;

public class VehicleDto {

    private Long id;

    @NotNull(message = "Type is required")
    private VehicleType type;

    @NotBlank(message = "Model name is required")
    @Size(max = 100)
    private String modelName;

    @Size(max = 50)
    private String brand = "Suzuki";

    @NotNull(message = "Year is required")
    @Min(1900)
    @Max(2100)
    private Integer year;

    @NotNull(message = "Price is required")
    @DecimalMin(value = "0.0", inclusive = false)
    private Double price;

    @NotNull(message = "Quantity is required")
    @Min(0)
    private Integer quantity;

    @Size(max = 500)
    private String imageUrl;

    @Size(max = 1000)
    private String description;

    public VehicleDto() {
    }

    public VehicleDto(Long id, VehicleType type, String modelName, String brand, Integer year, Double price, Integer quantity) {
        this.id = id;
        this.type = type;
        this.modelName = modelName;
        this.brand = brand;
        this.year = year;
        this.price = price;
        this.quantity = quantity;
    }

    public static VehicleDtoBuilder builder() {
        return new VehicleDtoBuilder();
    }

    public static class VehicleDtoBuilder {
        private Long id;
        private VehicleType type;
        private String modelName;
        private String brand = "Suzuki";
        private Integer year;
        private Double price;
        private Integer quantity;
        private String imageUrl;
        private String description;

        public VehicleDtoBuilder id(Long id) {
            this.id = id;
            return this;
        }

        public VehicleDtoBuilder type(VehicleType type) {
            this.type = type;
            return this;
        }

        public VehicleDtoBuilder modelName(String modelName) {
            this.modelName = modelName;
            return this;
        }

        public VehicleDtoBuilder brand(String brand) {
            this.brand = brand;
            return this;
        }

        public VehicleDtoBuilder year(Integer year) {
            this.year = year;
            return this;
        }

        public VehicleDtoBuilder price(Double price) {
            this.price = price;
            return this;
        }

        public VehicleDtoBuilder quantity(Integer quantity) {
            this.quantity = quantity;
            return this;
        }

        public VehicleDtoBuilder imageUrl(String imageUrl) {
            this.imageUrl = imageUrl;
            return this;
        }

        public VehicleDtoBuilder description(String description) {
            this.description = description;
            return this;
        }

        public VehicleDto build() {
            VehicleDto dto = new VehicleDto(id, type, modelName, brand, year, price, quantity);
            dto.setImageUrl(imageUrl);
            dto.setDescription(description);
            return dto;
        }
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public VehicleType getType() { return type; }
    public void setType(VehicleType type) { this.type = type; }
    public String getModelName() { return modelName; }
    public void setModelName(String modelName) { this.modelName = modelName; }
    public String getBrand() { return brand; }
    public void setBrand(String brand) { this.brand = brand; }
    public Integer getYear() { return year; }
    public void setYear(Integer year) { this.year = year; }
    public Double getPrice() { return price; }
    public void setPrice(Double price) { this.price = price; }
    public Integer getQuantity() { return quantity; }
    public void setQuantity(Integer quantity) { this.quantity = quantity; }
    public String getImageUrl() { return imageUrl; }
    public void setImageUrl(String imageUrl) { this.imageUrl = imageUrl; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
}
