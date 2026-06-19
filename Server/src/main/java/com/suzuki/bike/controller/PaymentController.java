package com.suzuki.bike.controller;

import com.stripe.exception.StripeException;
import com.suzuki.bike.dto.PaymentCreateIntentRequest;
import com.suzuki.bike.dto.PaymentCreateIntentResponse;
import com.suzuki.bike.entity.Order;
import com.suzuki.bike.entity.User;
import com.suzuki.bike.exception.ResourceNotFoundException;
import com.suzuki.bike.service.OrderService;
import com.suzuki.bike.service.StripeService;
import com.suzuki.bike.service.UserService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/payments")
public class PaymentController {

    private final StripeService stripeService;
    private final OrderService orderService;
    private final UserService userService;

    @Value("${stripe.currency:usd}")
    private String currency;

    public PaymentController(StripeService stripeService, OrderService orderService, UserService userService) {
        this.stripeService = stripeService;
        this.orderService = orderService;
        this.userService = userService;
    }

    /**
     * Create Stripe PaymentIntent for checkout.
     * Validates cart items server-side, calculates total, creates order draft, returns clientSecret.
     */
    @PostMapping("/create-intent")
    public ResponseEntity<?> createIntent(@Valid @RequestBody PaymentCreateIntentRequest request) {
        try {
            User user = userService.getCurrentUser();
            if (user == null) {
                throw new ResourceNotFoundException("User", 0L);
            }
            Order order = orderService.createDraft(
                    user,
                    request.getCustomerName(),
                    request.getPhone(),
                    request.getEmail(),
                    request.getAddress(),
                    request.getItems()
            );

            double totalAmount = order.getTotalAmount();
            long amountCents = Math.round(totalAmount * 100);

            if (amountCents < 50) {
                return ResponseEntity.badRequest().body("Minimum amount is 0.50");
            }

            var result = stripeService.createPaymentIntent(order, amountCents);
            orderService.setStripePaymentIntentId(order.getId(), result.paymentIntentId());

            return ResponseEntity.ok(new PaymentCreateIntentResponse(result.clientSecret(), order.getId()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (StripeException e) {
            return ResponseEntity.status(500).body("Payment setup failed: " + e.getMessage());
        }
    }
}
