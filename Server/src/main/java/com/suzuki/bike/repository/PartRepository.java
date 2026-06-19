package com.suzuki.bike.repository;

import com.suzuki.bike.entity.Part;
import com.suzuki.bike.entity.enums.PartType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface PartRepository extends JpaRepository<Part, Long> {

    String SUZUKI = "Suzuki";

    @Query("SELECT p FROM Part p WHERE p.brand = :brand " +
            "AND (:q IS NULL OR :q = '' OR LOWER(p.partName) LIKE LOWER(CONCAT('%', :q, '%')) " +
            "OR LOWER(p.compatibleModel) LIKE LOWER(CONCAT('%', :q, '%'))) " +
            "AND (:type IS NULL OR p.type = :type) " +
            "ORDER BY p.id ASC")
    List<Part> searchByBrand(@Param("brand") String brand, @Param("q") String q, @Param("type") PartType type);

    List<Part> findByBrandAndQuantityLessThanEqual(String brand, int quantity);
}
