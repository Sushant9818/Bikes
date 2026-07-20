package com.suzuki.bike.repository;

import com.suzuki.bike.entity.Appointment;
import com.suzuki.bike.entity.enums.AppointmentStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;

public interface AppointmentRepository extends JpaRepository<Appointment, Long> {

    List<Appointment> findByClientUsernameOrderByCreatedAtDesc(String clientUsername);

    @Query("SELECT a FROM Appointment a WHERE " +
           "(:status IS NULL OR a.status = :status) AND " +
           "(:date IS NULL OR a.preferredDate = :date) AND " +
           "(:client IS NULL OR LOWER(a.clientUsername) LIKE LOWER(CONCAT('%', :client, '%'))) AND " +
           "(:bikeModel IS NULL OR LOWER(a.bikeModel) LIKE LOWER(CONCAT('%', :bikeModel, '%'))) " +
           "ORDER BY a.createdAt DESC")
    List<Appointment> findAllWithFilters(
            @Param("status") AppointmentStatus status,
            @Param("date") LocalDate date,
            @Param("client") String client,
            @Param("bikeModel") String bikeModel
    );

    long countByStatus(AppointmentStatus status);

    long countByPreferredDate(LocalDate date);

    @Query("SELECT SUM(a.finalCost) FROM Appointment a WHERE a.status = 'COMPLETED' AND " +
           "YEAR(CAST(a.preferredDate AS date)) = :year AND MONTH(CAST(a.preferredDate AS date)) = :month")
    Double sumMonthlyRevenue(@Param("year") int year, @Param("month") int month);
}
