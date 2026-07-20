package com.suzuki.bike.controller;

import com.suzuki.bike.dto.AppointmentDto;
import com.suzuki.bike.dto.AppointmentStatusUpdateDto;
import com.suzuki.bike.entity.enums.AppointmentStatus;
import com.suzuki.bike.service.AppointmentService;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/appointments")
public class AppointmentController {

    private final AppointmentService appointmentService;

    public AppointmentController(AppointmentService appointmentService) {
        this.appointmentService = appointmentService;
    }

    @PostMapping
    public ResponseEntity<AppointmentDto> create(
            @Valid @RequestBody AppointmentDto dto,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(appointmentService.create(dto, userDetails.getUsername()));
    }

    @GetMapping("/my")
    public ResponseEntity<List<AppointmentDto>> getMyAppointments(
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(appointmentService.getMyAppointments(userDetails.getUsername()));
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<AppointmentDto>> getAll(
            @RequestParam(required = false) AppointmentStatus status,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestParam(required = false) String client,
            @RequestParam(required = false) String bikeModel) {
        return ResponseEntity.ok(appointmentService.getAllAppointments(status, date, client, bikeModel));
    }

    @GetMapping("/stats")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> getStats() {
        return ResponseEntity.ok(appointmentService.getDashboardStats());
    }

    @GetMapping("/{id}")
    public ResponseEntity<AppointmentDto> getById(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        boolean isAdmin = userDetails.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
        return ResponseEntity.ok(appointmentService.getById(id, userDetails.getUsername(), isAdmin));
    }

    @PutMapping("/{id}/status")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<AppointmentDto> updateStatus(
            @PathVariable Long id,
            @Valid @RequestBody AppointmentStatusUpdateDto dto) {
        return ResponseEntity.ok(appointmentService.updateStatus(id, dto));
    }

    @PutMapping("/{id}/reschedule")
    public ResponseEntity<AppointmentDto> reschedule(
            @PathVariable Long id,
            @RequestBody AppointmentDto dto,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(appointmentService.reschedule(id, dto, userDetails.getUsername()));
    }

    @PutMapping("/{id}/cancel")
    public ResponseEntity<AppointmentDto> cancel(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(appointmentService.cancel(id, userDetails.getUsername()));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        appointmentService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
