package com.suzuki.bike.controller;

import com.suzuki.bike.dto.PartDto;
import com.suzuki.bike.entity.enums.PartType;
import com.suzuki.bike.service.PartService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/parts")
public class PartController {

    private final PartService partService;

    public PartController(PartService partService) {
        this.partService = partService;
    }

    @GetMapping
    public ResponseEntity<List<PartDto>> search(
            @RequestParam(required = false) String q,
            @RequestParam(required = false) PartType type
    ) {
        return ResponseEntity.ok(partService.search(q, type));
    }

    @GetMapping("/{id}")
    public ResponseEntity<PartDto> getById(@PathVariable Long id) {
        return ResponseEntity.ok(partService.getById(id));
    }

    @PostMapping
    public ResponseEntity<PartDto> create(@Valid @RequestBody PartDto dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(partService.create(dto));
    }

    @PutMapping("/{id}")
    public ResponseEntity<PartDto> update(@PathVariable Long id, @Valid @RequestBody PartDto dto) {
        return ResponseEntity.ok(partService.update(id, dto));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        partService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
