package com.suzuki.bike.repository;

import com.suzuki.bike.entity.Vehicle;
import com.suzuki.bike.entity.enums.VehicleType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface VehicleRepository extends JpaRepository<Vehicle, Long> {

    String SUZUKI = "Suzuki";

    @Query("SELECT v FROM Vehicle v WHERE v.brand = :brand " +
            "AND (:q IS NULL OR :q = '' OR LOWER(v.modelName) LIKE LOWER(CONCAT('%', :q, '%'))) " +
            "AND (:type IS NULL OR v.type = :type) " +
            "ORDER BY v.id ASC")
    List<Vehicle> searchByBrand(@Param("brand") String brand, @Param("q") String q, @Param("type") VehicleType type);

    boolean existsByBrandAndModelName(String brand, String modelName);
}
