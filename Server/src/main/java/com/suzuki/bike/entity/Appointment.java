package com.suzuki.bike.entity;

import com.suzuki.bike.entity.enums.AppointmentStatus;
import com.suzuki.bike.entity.enums.ServiceType;
import jakarta.persistence.*;

import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "appointments")
public class Appointment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String clientUsername;

    @Column(nullable = false)
    private String bikeModel;

    private Integer bikeYear;

    private String registrationNumber;

    private String vin;

    private Integer mileage;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "appointment_services", joinColumns = @JoinColumn(name = "appointment_id"))
    @Enumerated(EnumType.STRING)
    private List<ServiceType> services = new ArrayList<>();

    private String customService;

    @Column(length = 2000)
    private String description;

    @Column(nullable = false)
    private LocalDate preferredDate;

    @Column(nullable = false)
    private String preferredTime;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private AppointmentStatus status = AppointmentStatus.PENDING;

    private Double estimatedCost;

    private Double finalCost;

    @Column(length = 2000)
    private String repairNotes;

    @Column(length = 2000)
    private String serviceNotes;

    private String mechanicName;

    @Column(updatable = false)
    private Instant createdAt;

    private Instant updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = Instant.now();
        updatedAt = Instant.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = Instant.now();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getClientUsername() { return clientUsername; }
    public void setClientUsername(String clientUsername) { this.clientUsername = clientUsername; }
    public String getBikeModel() { return bikeModel; }
    public void setBikeModel(String bikeModel) { this.bikeModel = bikeModel; }
    public Integer getBikeYear() { return bikeYear; }
    public void setBikeYear(Integer bikeYear) { this.bikeYear = bikeYear; }
    public String getRegistrationNumber() { return registrationNumber; }
    public void setRegistrationNumber(String registrationNumber) { this.registrationNumber = registrationNumber; }
    public String getVin() { return vin; }
    public void setVin(String vin) { this.vin = vin; }
    public Integer getMileage() { return mileage; }
    public void setMileage(Integer mileage) { this.mileage = mileage; }
    public List<ServiceType> getServices() { return services; }
    public void setServices(List<ServiceType> services) { this.services = services; }
    public String getCustomService() { return customService; }
    public void setCustomService(String customService) { this.customService = customService; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public LocalDate getPreferredDate() { return preferredDate; }
    public void setPreferredDate(LocalDate preferredDate) { this.preferredDate = preferredDate; }
    public String getPreferredTime() { return preferredTime; }
    public void setPreferredTime(String preferredTime) { this.preferredTime = preferredTime; }
    public AppointmentStatus getStatus() { return status; }
    public void setStatus(AppointmentStatus status) { this.status = status; }
    public Double getEstimatedCost() { return estimatedCost; }
    public void setEstimatedCost(Double estimatedCost) { this.estimatedCost = estimatedCost; }
    public Double getFinalCost() { return finalCost; }
    public void setFinalCost(Double finalCost) { this.finalCost = finalCost; }
    public String getRepairNotes() { return repairNotes; }
    public void setRepairNotes(String repairNotes) { this.repairNotes = repairNotes; }
    public String getServiceNotes() { return serviceNotes; }
    public void setServiceNotes(String serviceNotes) { this.serviceNotes = serviceNotes; }
    public String getMechanicName() { return mechanicName; }
    public void setMechanicName(String mechanicName) { this.mechanicName = mechanicName; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
}
