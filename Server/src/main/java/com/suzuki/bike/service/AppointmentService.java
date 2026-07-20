package com.suzuki.bike.service;

import com.suzuki.bike.dto.AppointmentDto;
import com.suzuki.bike.dto.AppointmentStatusUpdateDto;
import com.suzuki.bike.entity.Appointment;
import com.suzuki.bike.entity.enums.AppointmentStatus;
import com.suzuki.bike.exception.ResourceNotFoundException;
import com.suzuki.bike.repository.AppointmentRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class AppointmentService {

    private final AppointmentRepository appointmentRepository;

    public AppointmentService(AppointmentRepository appointmentRepository) {
        this.appointmentRepository = appointmentRepository;
    }

    @Transactional
    public AppointmentDto create(AppointmentDto dto, String username) {
        Appointment appointment = new Appointment();
        appointment.setClientUsername(username);
        mapDtoToEntity(dto, appointment);
        appointment.setStatus(AppointmentStatus.PENDING);
        return toDto(appointmentRepository.save(appointment));
    }

    public List<AppointmentDto> getMyAppointments(String username) {
        return appointmentRepository.findByClientUsernameOrderByCreatedAtDesc(username)
                .stream().map(this::toDto).collect(Collectors.toList());
    }

    public List<AppointmentDto> getAllAppointments(AppointmentStatus status, LocalDate date,
                                                    String client, String bikeModel) {
        return appointmentRepository.findAllWithFilters(status, date, client, bikeModel)
                .stream().map(this::toDto).collect(Collectors.toList());
    }

    public AppointmentDto getById(Long id, String username, boolean isAdmin) {
        Appointment appointment = appointmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Appointment", id));
        if (!isAdmin && !appointment.getClientUsername().equals(username)) {
            throw new IllegalArgumentException("Access denied");
        }
        return toDto(appointment);
    }

    @Transactional
    public AppointmentDto updateStatus(Long id, AppointmentStatusUpdateDto dto) {
        Appointment appointment = appointmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Appointment", id));
        appointment.setStatus(dto.getStatus());
        if (dto.getRepairNotes() != null) appointment.setRepairNotes(dto.getRepairNotes());
        if (dto.getServiceNotes() != null) appointment.setServiceNotes(dto.getServiceNotes());
        if (dto.getMechanicName() != null) appointment.setMechanicName(dto.getMechanicName());
        if (dto.getEstimatedCost() != null) appointment.setEstimatedCost(dto.getEstimatedCost());
        if (dto.getFinalCost() != null) appointment.setFinalCost(dto.getFinalCost());
        return toDto(appointmentRepository.save(appointment));
    }

    @Transactional
    public AppointmentDto reschedule(Long id, AppointmentDto dto, String username) {
        Appointment appointment = appointmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Appointment", id));
        if (!appointment.getClientUsername().equals(username)) {
            throw new IllegalArgumentException("Access denied");
        }
        if (appointment.getStatus() != AppointmentStatus.PENDING) {
            throw new IllegalArgumentException("Only pending appointments can be rescheduled");
        }
        appointment.setPreferredDate(dto.getPreferredDate());
        appointment.setPreferredTime(dto.getPreferredTime());
        if (dto.getBikeModel() != null) appointment.setBikeModel(dto.getBikeModel());
        if (dto.getServices() != null) appointment.setServices(dto.getServices());
        if (dto.getDescription() != null) appointment.setDescription(dto.getDescription());
        return toDto(appointmentRepository.save(appointment));
    }

    @Transactional
    public AppointmentDto cancel(Long id, String username) {
        Appointment appointment = appointmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Appointment", id));
        if (!appointment.getClientUsername().equals(username)) {
            throw new IllegalArgumentException("Access denied");
        }
        if (appointment.getStatus() != AppointmentStatus.PENDING) {
            throw new IllegalArgumentException("Only pending appointments can be cancelled");
        }
        appointment.setStatus(AppointmentStatus.CANCELLED);
        return toDto(appointmentRepository.save(appointment));
    }

    @Transactional
    public void delete(Long id) {
        if (!appointmentRepository.existsById(id)) {
            throw new ResourceNotFoundException("Appointment", id);
        }
        appointmentRepository.deleteById(id);
    }

    public java.util.Map<String, Object> getDashboardStats() {
        LocalDate today = LocalDate.now();
        java.util.Map<String, Object> stats = new java.util.LinkedHashMap<>();
        stats.put("todayCount", appointmentRepository.countByPreferredDate(today));
        stats.put("pendingCount", appointmentRepository.countByStatus(AppointmentStatus.PENDING));
        stats.put("completedCount", appointmentRepository.countByStatus(AppointmentStatus.COMPLETED));
        stats.put("inProgressCount", appointmentRepository.countByStatus(AppointmentStatus.IN_PROGRESS));
        Double revenue = appointmentRepository.sumMonthlyRevenue(today.getYear(), today.getMonthValue());
        stats.put("monthlyRevenue", revenue != null ? revenue : 0.0);
        return stats;
    }

    private void mapDtoToEntity(AppointmentDto dto, Appointment a) {
        a.setBikeModel(dto.getBikeModel());
        a.setBikeYear(dto.getBikeYear());
        a.setRegistrationNumber(dto.getRegistrationNumber());
        a.setVin(dto.getVin());
        a.setMileage(dto.getMileage());
        a.setServices(dto.getServices());
        a.setCustomService(dto.getCustomService());
        a.setDescription(dto.getDescription());
        a.setPreferredDate(dto.getPreferredDate());
        a.setPreferredTime(dto.getPreferredTime());
    }

    private AppointmentDto toDto(Appointment a) {
        AppointmentDto dto = new AppointmentDto();
        dto.setId(a.getId());
        dto.setClientUsername(a.getClientUsername());
        dto.setBikeModel(a.getBikeModel());
        dto.setBikeYear(a.getBikeYear());
        dto.setRegistrationNumber(a.getRegistrationNumber());
        dto.setVin(a.getVin());
        dto.setMileage(a.getMileage());
        dto.setServices(a.getServices());
        dto.setCustomService(a.getCustomService());
        dto.setDescription(a.getDescription());
        dto.setPreferredDate(a.getPreferredDate());
        dto.setPreferredTime(a.getPreferredTime());
        dto.setStatus(a.getStatus());
        dto.setEstimatedCost(a.getEstimatedCost());
        dto.setFinalCost(a.getFinalCost());
        dto.setRepairNotes(a.getRepairNotes());
        dto.setServiceNotes(a.getServiceNotes());
        dto.setMechanicName(a.getMechanicName());
        dto.setCreatedAt(a.getCreatedAt());
        dto.setUpdatedAt(a.getUpdatedAt());
        return dto;
    }
}
