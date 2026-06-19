package com.suzuki.bike.repository;

import com.suzuki.bike.entity.Order;
import com.suzuki.bike.entity.OrderStatus;
import com.suzuki.bike.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

public interface OrderRepository extends JpaRepository<Order, Long> {

    List<Order> findAllByOrderByCreatedAtDesc();

    List<Order> findByUserOrderByCreatedAtDesc(User user);

    long countByCreatedAtAfter(Instant after);

    Optional<Order> findByStripePaymentIntentId(String stripePaymentIntentId);

    List<Order> findByStatusAndCreatedAtBetween(OrderStatus status, Instant from, Instant to);

    @Query("SELECT oi.partName, SUM(oi.quantity), SUM(oi.price * oi.quantity) " +
            "FROM OrderItem oi JOIN oi.order o " +
            "WHERE o.status = 'PAID' AND o.createdAt >= :from AND o.createdAt < :to " +
            "GROUP BY oi.partName ORDER BY SUM(oi.quantity) DESC")
    List<Object[]> findTopPartsByDateRange(@Param("from") Instant from, @Param("to") Instant to);
}
