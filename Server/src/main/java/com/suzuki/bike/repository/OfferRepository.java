package com.suzuki.bike.repository;

import com.suzuki.bike.entity.Offer;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface OfferRepository extends JpaRepository<Offer, Long> {

    List<Offer> findAllByOrderByIdDesc();
}
