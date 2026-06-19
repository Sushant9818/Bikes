package com.suzuki.bike.service;

import com.suzuki.bike.dto.TestDriveDto;
import com.suzuki.bike.entity.TestDriveRequest;
import com.suzuki.bike.repository.TestDriveRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class TestDriveService {

    private final TestDriveRepository testDriveRepository;

    public TestDriveService(TestDriveRepository testDriveRepository) {
        this.testDriveRepository = testDriveRepository;
    }

    @Transactional
    public TestDriveRequest submit(TestDriveDto dto) {
        TestDriveRequest req = new TestDriveRequest();
        req.setName(dto.getName());
        req.setPhone(dto.getPhone());
        req.setEmail(dto.getEmail());
        req.setVehicleId(dto.getVehicleId());
        req.setPreferredDate(dto.getPreferredDate());
        req.setMessage(dto.getMessage());
        return testDriveRepository.save(req);
    }
}
