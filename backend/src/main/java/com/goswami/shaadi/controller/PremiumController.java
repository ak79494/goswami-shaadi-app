package com.goswami.shaadi.controller;

import com.goswami.shaadi.service.PremiumService;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/premium")
public class PremiumController {

    private final PremiumService premium;

    public PremiumController(PremiumService premium) {
        this.premium = premium;
    }

    private Long uid(Authentication authentication) {
        return (Long) authentication.getPrincipal();
    }

    @GetMapping("/plans")
    public PremiumService.PlansResponse plans() {
        return premium.plans();
    }

    @GetMapping("/status")
    public PremiumService.StatusResponse status(Authentication authentication) {
        return premium.status(uid(authentication));
    }

    @PostMapping("/orders")
    public PremiumService.OrderResponse createOrder(
        Authentication authentication,
        @RequestBody Map<String, String> body
    ) {
        return premium.createOrder(uid(authentication), body.get("plan"));
    }

    @PostMapping("/orders/{orderId}/submit-payment")
    public PremiumService.PaymentResponse submitPayment(
        Authentication authentication,
        @PathVariable Long orderId,
        @RequestBody Map<String, String> body
    ) {
        return premium.submitPayment(
            uid(authentication),
            orderId,
            body.get("paymentMethod"),
            body.get("transactionId")
        );
    }
}
