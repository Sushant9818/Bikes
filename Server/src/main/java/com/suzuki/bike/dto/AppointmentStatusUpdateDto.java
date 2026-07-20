package com.suzuki.bike.dto;

import com.suzuki.bike.entity.enums.AppointmentStatus;
import jakarta.validation.constraints.NotNull;

public class AppointmentStatusUpdateDto {

    @NotNull(message = "Status is required")
    private AppointmentStatus status;

    private String repairNotes;
    private String serviceNotes;
    private String mechanicName;
    private Double estimatedCost;
    private Double finalCost;

    public AppointmentStatus getStatus() { return status; }
    public void setStatus(AppointmentStatus status) { this.status = status; }
    public String getRepairNotes() { return repairNotes; }
    public void setRepairNotes(String repairNotes) { this.repairNotes = repairNotes; }
    public String getServiceNotes() { return serviceNotes; }
    public void setServiceNotes(String serviceNotes) { this.serviceNotes = serviceNotes; }
    public String getMechanicName() { return mechanicName; }
    public void setMechanicName(String mechanicName) { this.mechanicName = mechanicName; }
    public Double getEstimatedCost() { return estimatedCost; }
    public void setEstimatedCost(Double estimatedCost) { this.estimatedCost = estimatedCost; }
    public Double getFinalCost() { return finalCost; }
    public void setFinalCost(Double finalCost) { this.finalCost = finalCost; }
}
