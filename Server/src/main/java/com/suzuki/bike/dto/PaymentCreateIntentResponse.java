package com.suzuki.bike.dto;

public class PaymentCreateIntentResponse {

    private String clientSecret;
    private Long orderDraftId;

    public PaymentCreateIntentResponse() {
    }

    public PaymentCreateIntentResponse(String clientSecret, Long orderDraftId) {
        this.clientSecret = clientSecret;
        this.orderDraftId = orderDraftId;
    }

    public String getClientSecret() { return clientSecret; }
    public void setClientSecret(String clientSecret) { this.clientSecret = clientSecret; }
    public Long getOrderDraftId() { return orderDraftId; }
    public void setOrderDraftId(Long orderDraftId) { this.orderDraftId = orderDraftId; }
}
