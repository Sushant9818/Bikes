package com.suzuki.bike.entity;

import com.suzuki.bike.entity.enums.PartType;
import jakarta.persistence.*;

@Entity
@Table(name = "parts")
public class Part {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PartType type;

    @Column(nullable = false)
    private String brand = "Suzuki";

    @Column(nullable = false)
    private String partName;

    private String compatibleModel;

    @Column(nullable = false)
    private Double price;

    @Column(nullable = false)
    private Integer quantity;

    @Column(length = 500)
    private String imageUrl;

    public Part() {
    }

    public Part(Long id, PartType type, String partName, String compatibleModel, Double price, Integer quantity) {
        this.id = id;
        this.type = type;
        this.partName = partName;
        this.compatibleModel = compatibleModel;
        this.price = price;
        this.quantity = quantity;
    }

    public static PartBuilder builder() {
        return new PartBuilder();
    }

    public static class PartBuilder {
        private Long id;
        private PartType type;
        private String partName;
        private String compatibleModel;
        private Double price;
        private Integer quantity;

        public PartBuilder id(Long id) {
            this.id = id;
            return this;
        }

        public PartBuilder type(PartType type) {
            this.type = type;
            return this;
        }

        public PartBuilder partName(String partName) {
            this.partName = partName;
            return this;
        }

        public PartBuilder compatibleModel(String compatibleModel) {
            this.compatibleModel = compatibleModel;
            return this;
        }

        public PartBuilder price(Double price) {
            this.price = price;
            return this;
        }

        public PartBuilder quantity(Integer quantity) {
            this.quantity = quantity;
            return this;
        }

        public Part build() {
            return new Part(id, type, partName, compatibleModel, price, quantity);
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
