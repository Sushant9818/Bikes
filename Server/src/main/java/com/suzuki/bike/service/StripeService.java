package com.suzuki.bike.service;

import com.stripe.exception.StripeException;
import com.stripe.model.PaymentIntent;
import com.stripe.param.PaymentIntentCreateParams;
import com.suzuki.bike.entity.Order;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class StripeService {

    @Value("${stripe.secret-key}")
    private String secretKey;

    @Value("${stripe.currency:usd}")
    private String currency;

    public PaymentIntentResult createPaymentIntent(Order order, long amountCents) throws StripeException {
        com.stripe.Stripe.apiKey = secretKey;

        PaymentIntentCreateParams params = PaymentIntentCreateParams.builder()
                .setAmount(amountCents)
                .setCurrency(currency.toLowerCase())
                .putMetadata("orderId", String.valueOf(order.getId()))
                .setAutomaticPaymentMethods(
                        PaymentIntentCreateParams.AutomaticPaymentMethods.builder()
                                .setEnabled(true)
                                .build()
                )
                .build();

        PaymentIntent intent = PaymentIntent.create(params);
        return new PaymentIntentResult(intent.getClientSecret(), intent.getId());
    }

    public record PaymentIntentResult(String clientSecret, String paymentIntentId) {}
}
