package com.suzuki.bike.service;

import com.suzuki.bike.dto.VehicleDto;
import com.suzuki.bike.entity.Vehicle;
import com.suzuki.bike.entity.enums.VehicleType;
import com.suzuki.bike.exception.ResourceNotFoundException;
import com.suzuki.bike.repository.VehicleRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class VehicleService {

    private final VehicleRepository vehicleRepository;

    public VehicleService(VehicleRepository vehicleRepository) {
        this.vehicleRepository = vehicleRepository;
    }

    private static final String BRAND = "Suzuki";

    public List<VehicleDto> search(String q, VehicleType type) {
        return vehicleRepository.searchByBrand(
                BRAND,
                q != null && q.isBlank() ? null : q,
                type
        ).stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    public VehicleDto getById(Long id) {
        Vehicle vehicle = vehicleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Vehicle", id));
        return toDto(vehicle);
    }

    @Transactional
    public VehicleDto create(VehicleDto dto) {
        Vehicle vehicle = toEntity(dto);
        vehicle.setId(null);
        vehicle = vehicleRepository.save(vehicle);
        return toDto(vehicle);
    }

    @Transactional
    public VehicleDto update(Long id, VehicleDto dto) {
        Vehicle existing = vehicleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Vehicle", id));
        Vehicle updated = toEntity(dto);
        updated.setId(existing.getId());
        updated = vehicleRepository.save(updated);
        return toDto(updated);
    }

    @Transactional
    public void delete(Long id) {
        if (!vehicleRepository.existsById(id)) {
            throw new ResourceNotFoundException("Vehicle", id);
        }
        vehicleRepository.deleteById(id);
    }

    private VehicleDto toDto(Vehicle entity) {
        return VehicleDto.builder()
                .id(entity.getId())
                .type(entity.getType())
                .modelName(entity.getModelName())
                .brand(entity.getBrand() != null ? entity.getBrand() : BRAND)
                .year(entity.getYear())
                .price(entity.getPrice())
                .quantity(entity.getQuantity())
                .imageUrl(entity.getImageUrl())
                .description(entity.getDescription())
                .build();
    }

    private Vehicle toEntity(VehicleDto dto) {
        Vehicle v = Vehicle.builder()
                .id(dto.getId())
                .type(dto.getType())
                .modelName(dto.getModelName())
                .brand(BRAND)
                .year(dto.getYear())
                .price(dto.getPrice())
                .quantity(dto.getQuantity())
                .build();
        if (dto.getImageUrl() != null) {
            v.setImageUrl(dto.getImageUrl());
        }
        if (dto.getDescription() != null) {
            v.setDescription(dto.getDescription().isBlank() ? null : dto.getDescription().trim());
        }
        return v;
    }
}
