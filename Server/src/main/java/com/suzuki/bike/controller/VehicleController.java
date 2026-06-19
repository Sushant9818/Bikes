package com.suzuki.bike.controller;

import com.suzuki.bike.dto.VehicleDto;
import com.suzuki.bike.entity.enums.VehicleType;
import com.suzuki.bike.service.VehicleService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/vehicles")
public class VehicleController {

    private final VehicleService vehicleService;

    public VehicleController(VehicleService vehicleService) {
        this.vehicleService = vehicleService;
    }

    @GetMapping
    public ResponseEntity<List<VehicleDto>> search(
            @RequestParam(required = false) String q,
            @RequestParam(required = false) VehicleType type
    ) {
        return ResponseEntity.ok(vehicleService.search(q, type));
    }

    @GetMapping("/{id}")
    public ResponseEntity<VehicleDto> getById(@PathVariable Long id) {
        return ResponseEntity.ok(vehicleService.getById(id));
    }

    @PostMapping
    public ResponseEntity<VehicleDto> create(@Valid @RequestBody VehicleDto dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(vehicleService.create(dto));
    }

    @PutMapping("/{id}")
    public ResponseEntity<VehicleDto> update(@PathVariable Long id, @Valid @RequestBody VehicleDto dto) {
        return ResponseEntity.ok(vehicleService.update(id, dto));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        vehicleService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
