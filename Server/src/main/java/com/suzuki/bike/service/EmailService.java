package com.suzuki.bike.service;

import com.suzuki.bike.entity.Order;
import com.suzuki.bike.entity.OrderItem;
import com.suzuki.bike.entity.Part;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;

import java.util.HashMap;
import java.util.Map;

@Service
public class EmailService {

    private final JavaMailSender mailSender;
    private final TemplateEngine templateEngine;

    @Value("${app.mail-from:noreply@example.com}")
    private String mailFrom;

    @Value("${app.frontend-url:http://localhost:5173}")
    private String frontendUrl;

    @Value("${app.admin-email:admin@example.com}")
    private String adminEmail;

    @Value("${app.mail-enabled:false}")
    private boolean mailEnabled;

    public EmailService(JavaMailSender mailSender, TemplateEngine templateEngine) {
        this.mailSender = mailSender;
        this.templateEngine = templateEngine;
    }

    public void sendOrderConfirmationToCustomer(Order order) {
        if (!mailEnabled || order.getEmail() == null || order.getEmail().isBlank()) {
            return;
        }

        try {
            Context ctx = new Context();
            ctx.setVariable("order", order);
            ctx.setVariable("items", order.getItems());
            ctx.setVariable("totalAmount", order.getTotalAmount());

            String html = templateEngine.process("order-confirmation-customer", ctx);

            MimeMessage msg = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(msg, true, "UTF-8");
            helper.setFrom(mailFrom);
            helper.setTo(order.getEmail());
            helper.setSubject("Order Confirmation #" + order.getId());
            helper.setText(html, true);

            mailSender.send(msg);
        } catch (MessagingException e) {
            // Log but don't fail order finalization
            e.printStackTrace();
        }
    }

    public void sendNewOrderAlertToAdmin(Order order) {
        if (!mailEnabled || adminEmail == null || adminEmail.isBlank()) {
            return;
        }

        try {
            Context ctx = new Context();
            ctx.setVariable("order", order);
            ctx.setVariable("items", order.getItems());
            ctx.setVariable("totalAmount", order.getTotalAmount());

            String html = templateEngine.process("order-alert-admin", ctx);

            MimeMessage msg = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(msg, true, "UTF-8");
            helper.setFrom(mailFrom);
            helper.setTo(adminEmail);
            helper.setSubject("New Paid Order #" + order.getId());
            helper.setText(html, true);

            mailSender.send(msg);
        } catch (MessagingException e) {
            e.printStackTrace();
        }
    }

    public void sendLowStockAlert(Part part) {
        if (!mailEnabled || adminEmail == null || adminEmail.isBlank()) {
            return;
        }

        try {
            Context ctx = new Context();
            ctx.setVariable("part", part);
            ctx.setVariable("quantity", part.getQuantity());

            String html = templateEngine.process("low-stock-alert", ctx);

            MimeMessage msg = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(msg, true, "UTF-8");
            helper.setFrom(mailFrom);
            helper.setTo(adminEmail);
            helper.setSubject("Low Stock Alert: " + part.getPartName());
            helper.setText(html, true);

            mailSender.send(msg);
        } catch (MessagingException e) {
            e.printStackTrace();
        }
    }

    public void sendVerificationEmail(String email, String username, String token) {
        if (!mailEnabled || email == null || email.isBlank()) {
            return;
        }

        try {
            String verifyUrl = frontendUrl + "/verify-email?token=" + token;

            Context ctx = new Context();
            ctx.setVariable("username", username);
            ctx.setVariable("verifyUrl", verifyUrl);

            String html = templateEngine.process("VerifyEmailTemplate", ctx);

            MimeMessage msg = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(msg, true, "UTF-8");
            helper.setFrom(mailFrom);
            helper.setTo(email);
            helper.setSubject("Verify Your Email - Suzuki Bike System");
            helper.setText(html, true);

            mailSender.send(msg);
        } catch (MessagingException e) {
            e.printStackTrace();
        }
    }

    public void sendResetPasswordEmail(String email, String username, String token) {
        if (!mailEnabled || email == null || email.isBlank()) {
            return;
        }

        try {
            String resetUrl = frontendUrl + "/reset-password?token=" + token;

            Context ctx = new Context();
            ctx.setVariable("username", username);
            ctx.setVariable("resetUrl", resetUrl);

            String html = templateEngine.process("ResetPasswordTemplate", ctx);

            MimeMessage msg = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(msg, true, "UTF-8");
            helper.setFrom(mailFrom);
            helper.setTo(email);
            helper.setSubject("Reset Your Password - Suzuki Bike System");
            helper.setText(html, true);

            mailSender.send(msg);
        } catch (MessagingException e) {
            e.printStackTrace();
        }
    }
}
