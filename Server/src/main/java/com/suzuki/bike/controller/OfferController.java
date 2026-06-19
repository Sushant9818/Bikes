package com.suzuki.bike.controller;

import com.suzuki.bike.dto.OfferDto;
import com.suzuki.bike.service.OfferService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/offers")
public class OfferController {

    private final OfferService offerService;

    public OfferController(OfferService offerService) {
        this.offerService = offerService;
    }

    @GetMapping
    public ResponseEntity<List<OfferDto>> findAll() {
        return ResponseEntity.ok(offerService.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<OfferDto> getById(@PathVariable Long id) {
        return ResponseEntity.ok(offerService.getById(id));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<OfferDto> create(@Valid @RequestBody OfferDto dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(offerService.create(dto));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<OfferDto> update(@PathVariable Long id, @Valid @RequestBody OfferDto dto) {
        return ResponseEntity.ok(offerService.update(id, dto));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        offerService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
