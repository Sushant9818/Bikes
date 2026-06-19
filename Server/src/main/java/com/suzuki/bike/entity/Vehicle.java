package com.suzuki.bike.entity;

import com.suzuki.bike.entity.enums.VehicleType;
import jakarta.persistence.*;

@Entity
@Table(name = "vehicles")
public class Vehicle {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private VehicleType type;

    @Column(nullable = false)
    private String modelName;

    @Column(nullable = false)
    private String brand = "Suzuki";

    @Column(name = "model_year", nullable = false)
    private Integer year;

    @Column(nullable = false)
    private Double price;

    @Column(nullable = false)
    private Integer quantity;

    @Column(length = 500)
    private String imageUrl;

    @Column(length = 1000)
    private String description;

    public Vehicle() {
    }

    public Vehicle(Long id, VehicleType type, String modelName, String brand, Integer year, Double price, Integer quantity) {
        this.id = id;
        this.type = type;
        this.modelName = modelName;
        this.brand = brand;
        this.year = year;
        this.price = price;
        this.quantity = quantity;
    }

    public static VehicleBuilder builder() {
        return new VehicleBuilder();
    }

    public static class VehicleBuilder {
        private Long id;
        private VehicleType type;
        private String modelName;
        private String brand = "Suzuki";
        private Integer year;
        private Double price;
        private Integer quantity;

        public VehicleBuilder id(Long id) {
            this.id = id;
            return this;
        }

        public VehicleBuilder type(VehicleType type) {
            this.type = type;
            return this;
        }

        public VehicleBuilder modelName(String modelName) {
            this.modelName = modelName;
            return this;
        }

        public VehicleBuilder brand(String brand) {
            this.brand = brand;
            return this;
        }

        public VehicleBuilder year(Integer year) {
            this.year = year;
            return this;
        }

        public VehicleBuilder price(Double price) {
            this.price = price;
            return this;
        }

        public VehicleBuilder quantity(Integer quantity) {
            this.quantity = quantity;
            return this;
        }

        public Vehicle build() {
            return new Vehicle(id, type, modelName, brand, year, price, quantity);
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
