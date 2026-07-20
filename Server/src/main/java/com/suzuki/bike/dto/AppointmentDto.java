package com.suzuki.bike.dto;

import com.suzuki.bike.entity.enums.AppointmentStatus;
import com.suzuki.bike.entity.enums.ServiceType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

public class AppointmentDto {

    private Long id;
    private String clientUsername;

    @NotBlank(message = "Bike model is required")
    @Size(max = 100)
    private String bikeModel;

    private Integer bikeYear;
    private String registrationNumber;
    private String vin;
    private Integer mileage;

    @NotNull(message = "At least one service must be selected")
    @Size(min = 1, message = "At least one service must be selected")
    private List<ServiceType> services;

    private String customService;

    @Size(max = 2000)
    private String description;

    @NotNull(message = "Preferred date is required")
    private LocalDate preferredDate;

    @NotBlank(message = "Preferred time is required")
    private String preferredTime;

    private AppointmentStatus status;
    private Double estimatedCost;
    private Double finalCost;
    private String repairNotes;
    private String serviceNotes;
    private String mechanicName;
    private Instant createdAt;
    private Instant updatedAt;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getClientUsername() { return clientUsername; }
    public void setClientUsername(String clientUsername) { this.clientUsername = clientUsername; }
    public String getBikeModel() { return bikeModel; }
    public void setBikeModel(String bikeModel) { this.bikeModel = bikeModel; }
    public Integer getBikeYear() { return bikeYear; }
    public void setBikeYear(Integer bikeYear) { this.bikeYear = bikeYear; }
    public String getRegistrationNumber() { return registrationNumber; }
    public void setRegistrationNumber(String reg) { this.registrationNumber = reg; }
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
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
}
