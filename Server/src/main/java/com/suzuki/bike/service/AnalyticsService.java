package com.suzuki.bike.service;

import com.suzuki.bike.dto.AnalyticsSummaryDto;
import com.suzuki.bike.entity.Order;
import com.suzuki.bike.entity.OrderStatus;
import com.suzuki.bike.entity.Part;
import com.suzuki.bike.repository.OrderRepository;
import com.suzuki.bike.repository.PartRepository;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class AnalyticsService {

    private final OrderRepository orderRepository;
    private final PartRepository partRepository;

    public AnalyticsService(OrderRepository orderRepository, PartRepository partRepository) {
        this.orderRepository = orderRepository;
        this.partRepository = partRepository;
    }

    public AnalyticsSummaryDto getSummary(LocalDate from, LocalDate to) {
        Instant fromInstant = from.atStartOfDay(ZoneId.systemDefault()).toInstant();
        Instant toInstant = to.plusDays(1).atStartOfDay(ZoneId.systemDefault()).toInstant();

        List<Order> paidOrders = orderRepository.findByStatusAndCreatedAtBetween(OrderStatus.PAID, fromInstant, toInstant);

        double totalRevenue = paidOrders.stream().mapToDouble(Order::getTotalAmount).sum();
        long totalOrders = paidOrders.size();
        double avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

        List<Object[]> topPartsRaw = orderRepository.findTopPartsByDateRange(fromInstant, toInstant);
        List<AnalyticsSummaryDto.TopPartDto> topParts = topPartsRaw.stream()
                .map(row -> new AnalyticsSummaryDto.TopPartDto(
                        (String) row[0],
                        ((Number) row[1]).longValue(),
                        ((Number) row[2]).doubleValue()
                ))
                .limit(10)
                .collect(Collectors.toList());

        Map<String, Long> ordersCountByDay = new LinkedHashMap<>();
        Map<String, Double> revenueByDay = new LinkedHashMap<>();

        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd");
        for (LocalDate d = from; !d.isAfter(to); d = d.plusDays(1)) {
            String dateStr = d.format(formatter);
            ordersCountByDay.put(dateStr, 0L);
            revenueByDay.put(dateStr, 0.0);
        }

        for (Order o : paidOrders) {
            String dateStr = o.getCreatedAt().atZone(ZoneId.systemDefault()).toLocalDate().format(formatter);
            if (ordersCountByDay.containsKey(dateStr)) {
                ordersCountByDay.put(dateStr, ordersCountByDay.get(dateStr) + 1);
                revenueByDay.put(dateStr, revenueByDay.get(dateStr) + o.getTotalAmount());
            }
        }

        List<AnalyticsSummaryDto.OrdersByDayDto> ordersByDay = ordersCountByDay.entrySet().stream()
                .map(e -> new AnalyticsSummaryDto.OrdersByDayDto(
                        e.getKey(),
                        e.getValue(),
                        revenueByDay.getOrDefault(e.getKey(), 0.0)
                ))
                .collect(Collectors.toList());

        List<Part> lowStockList = partRepository.findByBrandAndQuantityLessThanEqual("Suzuki", 5);
        List<AnalyticsSummaryDto.LowStockPartDto> lowStockParts = lowStockList.stream()
                .map(p -> new AnalyticsSummaryDto.LowStockPartDto(p.getPartName(), p.getQuantity()))
                .collect(Collectors.toList());

        AnalyticsSummaryDto dto = new AnalyticsSummaryDto();
        dto.setTotalRevenue(totalRevenue);
        dto.setTotalOrders(totalOrders);
        dto.setAvgOrderValue(avgOrderValue);
        dto.setTopParts(topParts);
        dto.setOrdersByDay(ordersByDay);
        dto.setLowStockParts(lowStockParts);
        return dto;
    }
}
