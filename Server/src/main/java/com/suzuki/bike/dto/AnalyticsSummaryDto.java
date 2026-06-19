package com.suzuki.bike.dto;

import java.util.List;

public class AnalyticsSummaryDto {

    private double totalRevenue;
    private long totalOrders;
    private double avgOrderValue;
    private List<TopPartDto> topParts;
    private List<OrdersByDayDto> ordersByDay;
    private List<LowStockPartDto> lowStockParts;

    public AnalyticsSummaryDto() {
    }

    public double getTotalRevenue() { return totalRevenue; }
    public void setTotalRevenue(double totalRevenue) { this.totalRevenue = totalRevenue; }
    public long getTotalOrders() { return totalOrders; }
    public void setTotalOrders(long totalOrders) { this.totalOrders = totalOrders; }
    public double getAvgOrderValue() { return avgOrderValue; }
    public void setAvgOrderValue(double avgOrderValue) { this.avgOrderValue = avgOrderValue; }
    public List<TopPartDto> getTopParts() { return topParts; }
    public void setTopParts(List<TopPartDto> topParts) { this.topParts = topParts; }
    public List<OrdersByDayDto> getOrdersByDay() { return ordersByDay; }
    public void setOrdersByDay(List<OrdersByDayDto> ordersByDay) { this.ordersByDay = ordersByDay; }
    public List<LowStockPartDto> getLowStockParts() { return lowStockParts; }
    public void setLowStockParts(List<LowStockPartDto> lowStockParts) { this.lowStockParts = lowStockParts; }

    public static class TopPartDto {
        private String partName;
        private long qtySold;
        private double revenue;

        public TopPartDto() {}
        public TopPartDto(String partName, long qtySold, double revenue) {
            this.partName = partName;
            this.qtySold = qtySold;
            this.revenue = revenue;
        }
        public String getPartName() { return partName; }
        public void setPartName(String partName) { this.partName = partName; }
        public long getQtySold() { return qtySold; }
        public void setQtySold(long qtySold) { this.qtySold = qtySold; }
        public double getRevenue() { return revenue; }
        public void setRevenue(double revenue) { this.revenue = revenue; }
    }

    public static class OrdersByDayDto {
        private String date;
        private long count;
        private double revenue;

        public OrdersByDayDto() {}
        public OrdersByDayDto(String date, long count, double revenue) {
            this.date = date;
            this.count = count;
            this.revenue = revenue;
        }
        public String getDate() { return date; }
        public void setDate(String date) { this.date = date; }
        public long getCount() { return count; }
        public void setCount(long count) { this.count = count; }
        public double getRevenue() { return revenue; }
        public void setRevenue(double revenue) { this.revenue = revenue; }
    }

    public static class LowStockPartDto {
        private String partName;
        private int quantity;

        public LowStockPartDto() {}
        public LowStockPartDto(String partName, int quantity) {
            this.partName = partName;
            this.quantity = quantity;
        }
        public String getPartName() { return partName; }
        public void setPartName(String partName) { this.partName = partName; }
        public int getQuantity() { return quantity; }
        public void setQuantity(int quantity) { this.quantity = quantity; }
    }
}
