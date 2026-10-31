package com.goswami.shaadi.service;

import com.goswami.shaadi.model.*;
import com.goswami.shaadi.repository.PremiumOrderRepository;
import com.goswami.shaadi.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Map;

@Service
public class PremiumService {

    private final UserRepository users;
    private final PremiumOrderRepository orders;

    public PremiumService(UserRepository users, PremiumOrderRepository orders) {
        this.users = users;
        this.orders = orders;
    }

    public record PlanInfo(String plan, String planName, int months, int amount) {}
    public record OrderResponse(Long orderId, String plan, String planName, int amount, String status) {}
    public record StatusResponse(boolean active, String plan, String planName, LocalDateTime validUntil) {}
    public record PaymentResponse(Long orderId, String plan, String planName, int amount,
                                  String status, String paymentMethod, String transactionId,
                                  LocalDateTime validUntil) {}

    public PlanInfo plan(String plan) {
        PremiumPlan p = parsePlan(plan);
        return new PlanInfo(p.name(), displayName(p), months(p), amount(p));
    }

    @Transactional
    public OrderResponse createOrder(Long userId, String plan) {
        PremiumPlan p = parsePlan(plan);
        User user = getUser(userId);

        PremiumOrder order = new PremiumOrder();
        order.setUser(user);
        order.setPlan(p);
        order.setAmount(amount(p));
        order.setStatus(PaymentStatus.CREATED);
        orders.save(order);

        return new OrderResponse(
            order.getId(),
            p.name(),
            displayName(p),
            order.getAmount(),
            order.getStatus().name()
        );
    }

    @Transactional
    public PaymentResponse submitPayment(Long userId, Long orderId,
                                         String paymentMethod, String transactionId) {
        User user = getUser(userId);

        String cleanTransactionId = transactionId == null ? "" : transactionId.trim();
        if (cleanTransactionId.length() < 6 || cleanTransactionId.length() > 120) {
            throw new IllegalArgumentException("Invalid UTR / transaction ID");
        }

        if (orders.existsByTransactionId(cleanTransactionId)) {
            throw new IllegalArgumentException("This transaction ID has already been used");
        }

        PremiumOrder order = orders.findByIdAndUserId(orderId, userId)
            .orElseThrow(() -> new IllegalArgumentException("Premium order not found"));

        if (order.getStatus() == PaymentStatus.PAID) {
            throw new IllegalArgumentException("This premium order is already completed");
        }

        PaymentMethod method;
        try {
            method = PaymentMethod.valueOf(paymentMethod);
        } catch (Exception e) {
            throw new IllegalArgumentException("Select Google Pay or PhonePe");
        }

        if (order.getAmount() <= 0) {
            throw new IllegalArgumentException("Invalid premium amount");
        }

        order.setPaymentMethod(method);
        order.setTransactionId(cleanTransactionId);
        order.setStatus(PaymentStatus.PAID);
        order.setPaidAt(LocalDateTime.now());
        orders.save(order);

        // Manual UPI confirmation for the local project.
        // In production, replace this with PSP/bank webhook verification
        // before setting the order to PAID and activating premium.
        LocalDateTime base =
            user.getPremiumValidUntil() != null &&
            user.getPremiumValidUntil().isAfter(LocalDateTime.now())
                ? user.getPremiumValidUntil()
                : LocalDateTime.now();

        LocalDateTime validUntil = base.plusMonths(months(order.getPlan()));

        user.setPremiumMember(true);
        user.setPremiumPlan(order.getPlan());
        user.setPremiumValidUntil(validUntil);
        users.save(user);

        return new PaymentResponse(
            order.getId(),
            order.getPlan().name(),
            displayName(order.getPlan()),
            order.getAmount(),
            order.getStatus().name(),
            order.getPaymentMethod().name(),
            order.getTransactionId(),
            validUntil
        );
    }

    public StatusResponse status(Long userId) {
        User user = getUser(userId);
        boolean active =
            user.isPremiumMember() &&
            user.getPremiumValidUntil() != null &&
            user.getPremiumValidUntil().isAfter(LocalDateTime.now());

        if (!active && user.isPremiumMember()) {
            user.setPremiumMember(false);
            users.save(user);
        }

        return new StatusResponse(
            active,
            user.getPremiumPlan() == null ? null : user.getPremiumPlan().name(),
            user.getPremiumPlan() == null ? null : displayName(user.getPremiumPlan()),
            user.getPremiumValidUntil()
        );
    }

    private User getUser(Long userId) {
        return users.findById(userId)
            .orElseThrow(() -> new IllegalArgumentException("User not found"));
    }

    private PremiumPlan parsePlan(String value) {
        try {
            return PremiumPlan.valueOf(value == null ? "" : value.trim().toUpperCase());
        } catch (Exception e) {
            throw new IllegalArgumentException("Invalid premium plan");
        }
    }

    private int amount(PremiumPlan p) {
        return switch (p) {
            case GOLD -> 700;
            case DIAMOND -> 1300;
            case PLATINUM_PLUS -> 2500;
        };
    }

    private int months(PremiumPlan p) {
        return switch (p) {
            case GOLD -> 3;
            case DIAMOND -> 6;
            case PLATINUM_PLUS -> 12;
        };
    }

    private String displayName(PremiumPlan p) {
        return switch (p) {
            case GOLD -> "Gold";
            case DIAMOND -> "Diamond";
            case PLATINUM_PLUS -> "Platinum Plus";
        };
    }
}
