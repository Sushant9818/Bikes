package com.suzuki.bike.controller;

import com.stripe.exception.SignatureVerificationException;
import com.stripe.model.Event;
import com.stripe.model.EventDataObjectDeserializer;
import com.stripe.model.PaymentIntent;
import com.stripe.net.Webhook;
import com.suzuki.bike.entity.Order;
import com.suzuki.bike.service.OrderService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/payments")
public class PaymentWebhookController {

    @Value("${stripe.webhook-secret:}")
    private String webhookSecret;

    private final OrderService orderService;

    public PaymentWebhookController(OrderService orderService) {
        this.orderService = orderService;
    }

    @PostMapping("/webhook")
    public ResponseEntity<String> webhook(@RequestBody String payload, @RequestHeader("Stripe-Signature") String sigHeader) {
        if (webhookSecret == null || webhookSecret.isBlank()) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Webhook not configured");
        }

        Event event;
        try {
            event = Webhook.constructEvent(payload, sigHeader, webhookSecret);
        } catch (SignatureVerificationException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Invalid signature");
        }

        if ("payment_intent.succeeded".equals(event.getType())) {
            EventDataObjectDeserializer dataObjectDeserializer = event.getDataObjectDeserializer();
            if (dataObjectDeserializer.getObject().isPresent()) {
                PaymentIntent paymentIntent = (PaymentIntent) dataObjectDeserializer.getObject().get();
                String paymentIntentId = paymentIntent.getId();

                Order order = orderService.findByStripePaymentIntentId(paymentIntentId);
                if (order != null) {
                    try {
                        orderService.finalizeOrder(order.getId());
                    } catch (IllegalStateException e) {
                        return ResponseEntity.status(HttpStatus.OK).body("Order finalization failed: " + e.getMessage());
                    }
                }
            }
        }

        return ResponseEntity.ok("ok");
    }
}
