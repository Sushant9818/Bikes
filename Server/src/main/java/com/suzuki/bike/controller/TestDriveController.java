package com.suzuki.bike.controller;

import com.suzuki.bike.dto.TestDriveDto;
import com.suzuki.bike.entity.TestDriveRequest;
import com.suzuki.bike.service.TestDriveService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping(value = {"/test-drive", "/test-drives"})
public class TestDriveController {

    private final TestDriveService testDriveService;

    public TestDriveController(TestDriveService testDriveService) {
        this.testDriveService = testDriveService;
    }

    @PostMapping
    public ResponseEntity<Map<String, Object>> submit(@Valid @RequestBody TestDriveDto dto) {
        TestDriveRequest req = testDriveService.submit(dto);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(Map.of("id", req.getId(), "message", "Test drive request submitted successfully"));
    }
}
