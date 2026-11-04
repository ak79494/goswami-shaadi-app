package com.goswami.shaadi.service;

import com.goswami.shaadi.model.*;
import com.goswami.shaadi.repository.NotificationRepository;
import com.goswami.shaadi.repository.PremiumOrderRepository;
import com.goswami.shaadi.repository.ProfileRepository;
import com.goswami.shaadi.repository.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

/**
 * Premium membership paid by UPI. The member pays to the configured UPI ID / bank account,
 * submits the UPI reference (UTR), and an admin approves it after checking the money arrived.
 */
@Service
public class PremiumService {

    private final UserRepository users;
    private final PremiumOrderRepository orders;
    private final NotificationRepository notifications;
    private final ProfileRepository profiles;
    private final PaymentInfo paymentInfo;
    private final PushService push;

    public PremiumService(
        UserRepository users,
        PremiumOrderRepository orders,
        NotificationRepository notifications,
        ProfileRepository profiles,
        PushService push,
        @Value("${app.payment.upi-id:}") String upiId,
        @Value("${app.payment.payee-name:GoswamiJodi}") String payeeName,
        @Value("${app.payment.bank-name:}") String bankName,
        @Value("${app.payment.account-name:}") String accountName,
        @Value("${app.payment.account-number:}") String accountNumber,
        @Value("${app.payment.ifsc:}") String ifsc
    ) {
        this.users = users;
        this.orders = orders;
        this.notifications = notifications;
        this.profiles = profiles;
        this.push = push;
        this.paymentInfo = new PaymentInfo(upiId, payeeName, bankName, accountName, accountNumber, ifsc);
    }

    public record PlanInfo(String plan, String planName, int months, int amount, List<String> features) {}
    public record PaymentInfo(String upiId, String payeeName, String bankName, String accountName,
                              String accountNumber, String ifsc) {}
    public record PlansResponse(List<PlanInfo> plans, PaymentInfo payment) {}
    public record OrderResponse(Long orderId, String plan, String planName, int amount, String status) {}
    public record OrderSummary(Long orderId, String plan, String planName, int amount, String status,
                               String paymentMethod, String transactionId, String adminNote,
                               LocalDateTime createdAt) {}
    public record StatusResponse(boolean active, String plan, String planName, LocalDateTime validUntil,
                                 OrderSummary latestOrder) {}
    public record PaymentResponse(Long orderId, String plan, String planName, int amount,
                                  String status, String paymentMethod, String transactionId,
                                  LocalDateTime validUntil) {}
    public record AdminOrder(Long orderId, Long userId, String goswamiId, String name, String email,
                             String phone, String plan, String planName, int amount, String status,
                             String paymentMethod, String transactionId, String adminNote,
                             LocalDateTime createdAt, LocalDateTime paidAt) {}

    private static final List<String> FEATURES = List.of(
        "See mobile numbers of members",
        "Message members directly on WhatsApp",
        "Premium badge on your profile"
    );

    public PlansResponse plans() {
        List<PlanInfo> list = java.util.Arrays.stream(PremiumPlan.values())
            .map(p -> new PlanInfo(p.name(), displayName(p), months(p), amount(p), FEATURES))
            .toList();
        return new PlansResponse(list, paymentInfo);
    }

    public PlanInfo plan(String plan) {
        PremiumPlan p = parsePlan(plan);
        return new PlanInfo(p.name(), displayName(p), months(p), amount(p), FEATURES);
    }

    /** True while the member's premium membership is paid up. */
    public boolean isActive(User user) {
        return user.isPremiumMember()
            && user.getPremiumValidUntil() != null
            && user.getPremiumValidUntil().isAfter(LocalDateTime.now());
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

        String cleanTransactionId = transactionId == null ? "" : transactionId.trim().replaceAll("\\s+", "");
        if (!cleanTransactionId.matches("[A-Za-z0-9]{6,40}")) {
            throw new IllegalArgumentException("Enter the 12-digit UPI reference (UTR) from your payment app");
        }

        if (orders.existsByTransactionId(cleanTransactionId)) {
            throw new IllegalArgumentException("This transaction ID has already been used");
        }

        PremiumOrder order = orders.findByIdAndUserId(orderId, userId)
            .orElseThrow(() -> new IllegalArgumentException("Premium order not found"));

        if (order.getStatus() == PaymentStatus.PAID) {
            throw new IllegalArgumentException("This premium order is already completed");
        }
        if (order.getStatus() == PaymentStatus.PENDING) {
            throw new IllegalArgumentException("This payment is already being verified");
        }

        PaymentMethod method;
        try {
            method = PaymentMethod.valueOf(paymentMethod == null ? "UPI" : paymentMethod.trim().toUpperCase());
        } catch (Exception e) {
            throw new IllegalArgumentException("Choose how you paid");
        }

        if (order.getAmount() <= 0) {
            throw new IllegalArgumentException("Invalid premium amount");
        }

        // Nothing is activated yet: an admin confirms the money reached the account first.
        order.setPaymentMethod(method);
        order.setTransactionId(cleanTransactionId);
        order.setStatus(PaymentStatus.PENDING);
        order.setPaidAt(LocalDateTime.now());
        order.setAdminNote(null);
        orders.save(order);

        for (User admin : users.findByRole(Role.ADMIN)) {
            notify(admin, "PREMIUM", "Premium payment to verify: " + label(user) + " paid ₹"
                + order.getAmount() + " (UTR " + cleanTransactionId + ")");
        }

        return new PaymentResponse(
            order.getId(),
            order.getPlan().name(),
            displayName(order.getPlan()),
            order.getAmount(),
            order.getStatus().name(),
            order.getPaymentMethod().name(),
            order.getTransactionId(),
            user.getPremiumValidUntil()
        );
    }

    @Transactional
    public StatusResponse status(Long userId) {
        User user = getUser(userId);
        boolean active = isActive(user);

        if (!active && user.isPremiumMember()) {
            user.setPremiumMember(false);
            users.save(user);
        }

        OrderSummary latest = orders
            .findTopByUserIdAndStatusInOrderByCreatedAtDesc(userId, List.of(PaymentStatus.PENDING, PaymentStatus.REJECTED, PaymentStatus.PAID))
            .map(this::summary)
            .orElse(null);

        return new StatusResponse(
            active,
            user.getPremiumPlan() == null ? null : user.getPremiumPlan().name(),
            user.getPremiumPlan() == null ? null : displayName(user.getPremiumPlan()),
            user.getPremiumValidUntil(),
            latest
        );
    }

    // =========================================
    // ADMIN REVIEW
    // =========================================

    @Transactional(readOnly = true)
    public List<AdminOrder> adminOrders(boolean pendingOnly) {
        List<PremiumOrder> list = pendingOnly
            ? orders.findByStatusOrderByCreatedAtAsc(PaymentStatus.PENDING)
            : orders.findTop50ByStatusInOrderByCreatedAtDesc(List.of(PaymentStatus.PAID, PaymentStatus.REJECTED));
        return list.stream().map(this::adminView).toList();
    }

    @Transactional
    public AdminOrder approve(Long orderId) {
        PremiumOrder order = pendingOrder(orderId);
        User user = order.getUser();
        if (user == null) {
            throw new IllegalArgumentException("This member has deleted their account");
        }

        LocalDateTime base = isActive(user) ? user.getPremiumValidUntil() : LocalDateTime.now();
        LocalDateTime validUntil = base.plusMonths(months(order.getPlan()));

        order.setStatus(PaymentStatus.PAID);
        order.setReviewedAt(LocalDateTime.now());
        orders.save(order);

        user.setPremiumMember(true);
        user.setPremiumPlan(order.getPlan());
        user.setPremiumValidUntil(validUntil);
        users.save(user);

        notify(user, "PREMIUM", "Your " + displayName(order.getPlan())
            + " membership is active. You can now see contact numbers and message members on WhatsApp.");
        return adminView(order);
    }

    @Transactional
    public AdminOrder reject(Long orderId, String reason) {
        PremiumOrder order = pendingOrder(orderId);
        String note = reason == null || reason.isBlank()
            ? "We could not find this payment. Please check the UPI reference and try again."
            : reason.trim();
        order.setStatus(PaymentStatus.REJECTED);
        order.setReviewedAt(LocalDateTime.now());
        order.setAdminNote(note.length() > 300 ? note.substring(0, 300) : note);
        orders.save(order);

        if (order.getUser() != null) {
            notify(order.getUser(), "PREMIUM", "Your premium payment could not be verified: " + order.getAdminNote());
        }
        return adminView(order);
    }

    private PremiumOrder pendingOrder(Long orderId) {
        PremiumOrder order = orders.findById(orderId)
            .orElseThrow(() -> new IllegalArgumentException("Premium order not found"));
        if (order.getStatus() != PaymentStatus.PENDING) {
            throw new IllegalArgumentException("This payment has already been reviewed");
        }
        return order;
    }

    private OrderSummary summary(PremiumOrder o) {
        return new OrderSummary(o.getId(), o.getPlan().name(), displayName(o.getPlan()), o.getAmount(),
            o.getStatus().name(), o.getPaymentMethod() == null ? null : o.getPaymentMethod().name(),
            o.getTransactionId(), o.getAdminNote(), o.getCreatedAt());
    }

    private AdminOrder adminView(PremiumOrder o) {
        User u = o.getUser();
        return new AdminOrder(o.getId(), u == null ? null : u.getId(), u == null ? null : u.getGoswamiId(),
            u == null ? "Deleted member" : label(u), u == null ? null : u.getEmail(), u == null ? null : u.getPhone(),
            o.getPlan().name(), displayName(o.getPlan()), o.getAmount(), o.getStatus().name(),
            o.getPaymentMethod() == null ? null : o.getPaymentMethod().name(), o.getTransactionId(),
            o.getAdminNote(), o.getCreatedAt(), o.getPaidAt());
    }

    private String label(User u) {
        return profiles.findByUserId(u.getId())
            .map(p -> p.getLastName() == null ? p.getFirstName() : p.getFirstName() + " " + p.getLastName())
            .orElse(u.getGoswamiId());
    }

    private void notify(User user, String type, String message) {
        Notification n = new Notification();
        n.setUser(user);
        n.setType(type);
        n.setMessage(message.length() > 500 ? message.substring(0, 500) : message);
        n.setRead(false);
        notifications.save(n);
        push.send(user.getId(), new PushService.Push(PushService.MESSAGES, null, "GoswamiJodi", n.getMessage(), Map.of("type", "notification")));
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
