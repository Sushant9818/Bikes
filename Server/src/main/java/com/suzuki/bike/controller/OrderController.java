package com.suzuki.bike.controller;

import com.suzuki.bike.dto.OrderCreateDto;
import com.suzuki.bike.dto.OrderDto;
import com.suzuki.bike.entity.OrderStatus;
import com.suzuki.bike.entity.User;
import com.suzuki.bike.exception.ResourceNotFoundException;
import com.suzuki.bike.service.OrderService;
import com.suzuki.bike.service.UserService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/orders")
public class OrderController {

    private final OrderService orderService;
    private final UserService userService;

    public OrderController(OrderService orderService, UserService userService) {
        this.orderService = orderService;
        this.userService = userService;
    }

    @GetMapping("/stats")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Long>> getStats() {
        return ResponseEntity.ok(Map.of("ordersToday", orderService.countOrdersToday()));
    }

    @GetMapping("/my")
    public ResponseEntity<List<OrderDto>> getMyOrders() {
        User user = userService.getCurrentUser();
        if (user == null) {
            throw new ResourceNotFoundException("User", 0L);
        }
        return ResponseEntity.ok(orderService.getMyOrders(user));
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<OrderDto>> findAll() {
        return ResponseEntity.ok(orderService.findAll());
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<OrderDto> getById(@PathVariable Long id) {
        return ResponseEntity.ok(orderService.getById(id));
    }

    @PostMapping
    public ResponseEntity<OrderDto> create(@Valid @RequestBody OrderCreateDto dto) {
        User user = userService.getCurrentUser();
        if (user == null) {
            throw new ResourceNotFoundException("User", 0L);
        }
        return ResponseEntity.status(HttpStatus.CREATED).body(orderService.create(user, dto));
    }

    @PutMapping("/{id}/status")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<OrderDto> updateStatus(@PathVariable Long id, @RequestBody Map<String, String> body) {
        String statusStr = body.get("status");
        if (statusStr == null) {
            return ResponseEntity.badRequest().build();
        }
        OrderStatus status = OrderStatus.valueOf(statusStr.toUpperCase());
        return ResponseEntity.ok(orderService.updateStatus(id, status));
    }
}
