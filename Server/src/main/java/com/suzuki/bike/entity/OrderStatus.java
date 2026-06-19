package com.suzuki.bike.entity;

public enum OrderStatus {
    PENDING,      // Order draft created, awaiting payment
    PAID,         // Payment succeeded, stock reduced
    CONFIRMED,    // Admin confirmed
    SHIPPED,      // Order shipped
    CANCELLED,
    PAYMENT_REVIEW,  // Payment issue / stock insufficient
    FAILED        // Payment failed or order finalization failed
}
