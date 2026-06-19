package com.suzuki.bike.controller;

import com.suzuki.bike.dto.ContactDto;
import com.suzuki.bike.entity.ContactRequest;
import com.suzuki.bike.service.ContactService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/contact")
public class ContactController {

    private final ContactService contactService;

    public ContactController(ContactService contactService) {
        this.contactService = contactService;
    }

    @PostMapping
    public ResponseEntity<Map<String, Object>> submit(@Valid @RequestBody ContactDto dto) {
        ContactRequest req = contactService.submit(dto);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(Map.of("id", req.getId(), "message", "Contact form submitted successfully"));
    }
}
