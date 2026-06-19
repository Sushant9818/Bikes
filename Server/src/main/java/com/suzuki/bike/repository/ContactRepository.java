package com.suzuki.bike.repository;

import com.suzuki.bike.entity.ContactRequest;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ContactRepository extends JpaRepository<ContactRequest, Long> {

    List<ContactRequest> findAllByOrderByCreatedAtDesc();
}
