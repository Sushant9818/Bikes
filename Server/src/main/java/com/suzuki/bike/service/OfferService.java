package com.suzuki.bike.service;

import com.suzuki.bike.dto.OfferDto;
import com.suzuki.bike.entity.Offer;
import com.suzuki.bike.exception.ResourceNotFoundException;
import com.suzuki.bike.repository.OfferRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class OfferService {

    private final OfferRepository offerRepository;

    public OfferService(OfferRepository offerRepository) {
        this.offerRepository = offerRepository;
    }

    public List<OfferDto> findAll() {
        return offerRepository.findAllByOrderByIdDesc().stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    public OfferDto getById(Long id) {
        Offer offer = offerRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Offer", id));
        return toDto(offer);
    }

    @Transactional
    public OfferDto create(OfferDto dto) {
        Offer offer = toEntity(dto);
        offer.setId(null);
        offer = offerRepository.save(offer);
        return toDto(offer);
    }

    @Transactional
    public OfferDto update(Long id, OfferDto dto) {
        Offer existing = offerRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Offer", id));
        Offer updated = toEntity(dto);
        updated.setId(existing.getId());
        updated = offerRepository.save(updated);
        return toDto(updated);
    }

    @Transactional
    public void delete(Long id) {
        if (!offerRepository.existsById(id)) {
            throw new ResourceNotFoundException("Offer", id);
        }
        offerRepository.deleteById(id);
    }

    private OfferDto toDto(Offer entity) {
        OfferDto dto = new OfferDto();
        dto.setId(entity.getId());
        dto.setTitle(entity.getTitle());
        dto.setDescription(entity.getDescription());
        dto.setDiscountPercent(entity.getDiscountPercent());
        dto.setStartDate(entity.getStartDate());
        dto.setEndDate(entity.getEndDate());
        dto.setImageUrl(entity.getImageUrl());
        return dto;
    }

    private Offer toEntity(OfferDto dto) {
        Offer offer = new Offer();
        offer.setId(dto.getId());
        offer.setTitle(dto.getTitle());
        offer.setDescription(dto.getDescription());
        offer.setDiscountPercent(dto.getDiscountPercent());
        offer.setStartDate(dto.getStartDate());
        offer.setEndDate(dto.getEndDate());
        offer.setImageUrl(dto.getImageUrl());
        return offer;
    }
}
