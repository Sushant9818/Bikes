package com.suzuki.bike.service;

import com.suzuki.bike.dto.PartDto;
import com.suzuki.bike.entity.Part;
import com.suzuki.bike.entity.enums.PartType;
import com.suzuki.bike.exception.ResourceNotFoundException;
import com.suzuki.bike.repository.PartRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class PartService {

    private static final String BRAND = "Suzuki";

    private final PartRepository partRepository;

    public PartService(PartRepository partRepository) {
        this.partRepository = partRepository;
    }

    public List<PartDto> search(String q, PartType type) {
        return partRepository.searchByBrand(
                BRAND,
                q != null && q.isBlank() ? null : q,
                type
        ).stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    public PartDto getById(Long id) {
        Part part = partRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Part", id));
        return toDto(part);
    }

    @Transactional
    public PartDto create(PartDto dto) {
        Part part = toEntity(dto);
        part.setId(null);
        part = partRepository.save(part);
        return toDto(part);
    }

    @Transactional
    public PartDto update(Long id, PartDto dto) {
        Part existing = partRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Part", id));
        Part updated = toEntity(dto);
        updated.setId(existing.getId());
        updated = partRepository.save(updated);
        return toDto(updated);
    }

    @Transactional
    public void delete(Long id) {
        if (!partRepository.existsById(id)) {
            throw new ResourceNotFoundException("Part", id);
        }
        partRepository.deleteById(id);
    }

    private PartDto toDto(Part entity) {
        PartDto dto = PartDto.builder()
                .id(entity.getId())
                .type(entity.getType())
                .partName(entity.getPartName())
                .compatibleModel(entity.getCompatibleModel())
                .price(entity.getPrice())
                .quantity(entity.getQuantity())
                .build();
        dto.setBrand(entity.getBrand() != null ? entity.getBrand() : BRAND);
        dto.setImageUrl(entity.getImageUrl());
        return dto;
    }

    private Part toEntity(PartDto dto) {
        Part p = Part.builder()
                .id(dto.getId())
                .type(dto.getType())
                .partName(dto.getPartName())
                .compatibleModel(dto.getCompatibleModel())
                .price(dto.getPrice())
                .quantity(dto.getQuantity())
                .build();
        p.setBrand(BRAND);
        if (dto.getImageUrl() != null) {
            p.setImageUrl(dto.getImageUrl());
        }
        return p;
    }
}
