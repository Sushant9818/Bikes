package com.suzuki.bike.service;

import com.suzuki.bike.dto.OrderCreateDto;
import com.suzuki.bike.dto.OrderDto;
import com.suzuki.bike.dto.OrderItemDto;
import com.suzuki.bike.entity.Order;
import com.suzuki.bike.entity.OrderItem;
import com.suzuki.bike.entity.OrderStatus;
import com.suzuki.bike.entity.Part;
import com.suzuki.bike.entity.User;
import com.suzuki.bike.exception.ResourceNotFoundException;
import com.suzuki.bike.repository.OrderRepository;
import com.suzuki.bike.repository.PartRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class OrderService {

    private final OrderRepository orderRepository;
    private final PartRepository partRepository;
    private final EmailService emailService;

    public OrderService(OrderRepository orderRepository, PartRepository partRepository, EmailService emailService) {
        this.orderRepository = orderRepository;
        this.partRepository = partRepository;
        this.emailService = emailService;
    }

    public List<OrderDto> findAll() {
        return orderRepository.findAllByOrderByCreatedAtDesc().stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    public OrderDto getById(Long id) {
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Order", id));
        return toDto(order);
    }

    public Order getOrderEntity(Long id) {
        return orderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Order", id));
    }

    /**
     * Create order draft (PENDING) without reducing stock.
     * Server-side validates items and calculates total - do NOT trust frontend price.
     */
    @Transactional
    public Order createDraft(User user, String customerName, String phone, String email, String address, List<OrderItemDto> items) {
        Order order = new Order();
        order.setUser(user);
        order.setCustomerName(customerName);
        order.setPhone(phone);
        order.setEmail(email);
        order.setAddress(address);
        order.setStatus(OrderStatus.PENDING);

        double totalAmount = 0;

        for (OrderItemDto itemDto : items) {
            Part part = partRepository.findById(itemDto.getPartId())
                    .orElseThrow(() -> new ResourceNotFoundException("Part", itemDto.getPartId()));
            if (part.getQuantity() < itemDto.getQuantity()) {
                throw new IllegalArgumentException("Insufficient stock for part: " + part.getPartName());
            }

            double price = part.getPrice();
            int qty = itemDto.getQuantity();
            totalAmount += price * qty;

            OrderItem item = new OrderItem();
            item.setPartId(part.getId());
            item.setPartName(part.getPartName());
            item.setPrice(price);
            item.setQuantity(qty);
            item.setOrder(order);
            order.getItems().add(item);
        }

        order.setTotalAmount(totalAmount);
        return orderRepository.save(order);
    }

    /**
     * Finalize order on payment success: reduce stock, set PAID, send emails.
     */
    @Transactional
    public void finalizeOrder(Long orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order", orderId));

        if (order.getStatus() == OrderStatus.PAID) {
            return;
        }

        for (OrderItem item : order.getItems()) {
            Part part = partRepository.findById(item.getPartId())
                    .orElseThrow(() -> new ResourceNotFoundException("Part", item.getPartId()));
            int newQty = part.getQuantity() - item.getQuantity();
            if (newQty < 0) {
                order.setStatus(OrderStatus.PAYMENT_REVIEW);
                orderRepository.save(order);
                throw new IllegalStateException("Insufficient stock for part: " + part.getPartName() + " after payment");
            }
            part.setQuantity(newQty);
            partRepository.save(part);

            if (part.getQuantity() <= 5) {
                emailService.sendLowStockAlert(part);
            }
        }

        order.setStatus(OrderStatus.PAID);
        orderRepository.save(order);

        emailService.sendOrderConfirmationToCustomer(order);
        emailService.sendNewOrderAlertToAdmin(order);
    }

    public void setStripePaymentIntentId(Long orderId, String paymentIntentId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order", orderId));
        order.setStripePaymentIntentId(paymentIntentId);
        orderRepository.save(order);
    }

    public Order findById(Long id) {
        return orderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Order", id));
    }

    public Order findByStripePaymentIntentId(String paymentIntentId) {
        return orderRepository.findByStripePaymentIntentId(paymentIntentId)
                .orElse(null);
    }

    @Transactional
    public OrderDto create(User user, OrderCreateDto dto) {
        Order order = createDraft(
                user,
                dto.getCustomerName(),
                dto.getPhone(),
                dto.getEmail(),
                dto.getAddress(),
                dto.getItems()
        );
        return toDto(order);
    }

    public List<OrderDto> getMyOrders(User user) {
        return orderRepository.findByUserOrderByCreatedAtDesc(user).stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public OrderDto updateStatus(Long id, OrderStatus status) {
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Order", id));
        order.setStatus(status);
        order = orderRepository.save(order);
        return toDto(order);
    }

    public long countOrdersToday() {
        Instant startOfDay = Instant.now().atZone(java.time.ZoneId.systemDefault())
                .toLocalDate().atStartOfDay(java.time.ZoneId.systemDefault()).toInstant();
        return orderRepository.countByCreatedAtAfter(startOfDay);
    }

    private OrderDto toDto(Order entity) {
        OrderDto dto = new OrderDto();
        dto.setId(entity.getId());
        dto.setCustomerName(entity.getCustomerName());
        dto.setPhone(entity.getPhone());
        dto.setEmail(entity.getEmail());
        dto.setAddress(entity.getAddress());
        dto.setTotalAmount(entity.getTotalAmount());
        dto.setStatus(entity.getStatus());
        dto.setCreatedAt(entity.getCreatedAt());
        List<OrderItemDto> items = new ArrayList<>();
        for (OrderItem item : entity.getItems()) {
            OrderItemDto idto = new OrderItemDto();
            idto.setPartId(item.getPartId());
            idto.setPartName(item.getPartName());
            idto.setPrice(item.getPrice());
            idto.setQuantity(item.getQuantity());
            items.add(idto);
        }
        dto.setItems(items);
        return dto;
    }
}
