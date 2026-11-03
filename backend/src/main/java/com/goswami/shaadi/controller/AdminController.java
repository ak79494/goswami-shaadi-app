package com.goswami.shaadi.controller;

import com.goswami.shaadi.service.HelpService;
import com.goswami.shaadi.service.PremiumService;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/** Back office for the GoswamiShaadi team: verify premium payments and follow up on help requests. */
@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    private final PremiumService premium;
    private final HelpService help;

    public AdminController(PremiumService premium, HelpService help) {
        this.premium = premium;
        this.help = help;
    }

    /** status=PENDING (default) lists payments waiting for review; anything else lists recent reviewed ones. */
    @GetMapping("/premium/orders")
    public List<PremiumService.AdminOrder> orders(@RequestParam(defaultValue = "PENDING") String status) {
        return premium.adminOrders("PENDING".equalsIgnoreCase(status));
    }

    @PostMapping("/premium/orders/{id}/approve")
    public PremiumService.AdminOrder approve(@PathVariable Long id) {
        return premium.approve(id);
    }

    @PostMapping("/premium/orders/{id}/reject")
    public PremiumService.AdminOrder reject(@PathVariable Long id, @RequestBody(required = false) Map<String, String> body) {
        return premium.reject(id, body == null ? null : body.get("reason"));
    }

    @GetMapping("/help-requests")
    public List<HelpService.HelpRequestView> helpRequests() {
        return help.recent();
    }

    @PatchMapping("/help-requests/{id}")
    public HelpService.HelpRequestView helpStatus(@PathVariable Long id, @RequestParam String status) {
        return help.setStatus(id, status);
    }
}
