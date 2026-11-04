package com.goswami.shaadi.controller;

import com.goswami.shaadi.service.HelpService;
import com.goswami.shaadi.service.ModerationService;
import com.goswami.shaadi.service.PremiumService;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/** Back office for the GoswamiJodi team: verify premium payments, follow up on help requests and act on reports. */
@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    private final PremiumService premium;
    private final HelpService help;
    private final ModerationService moderation;

    public AdminController(PremiumService premium, HelpService help, ModerationService moderation) {
        this.premium = premium;
        this.help = help;
        this.moderation = moderation;
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

    @GetMapping("/reports")
    public List<ModerationService.ReportView> reports() {
        return moderation.recent();
    }

    @PostMapping("/reports/{id}/dismiss")
    public ModerationService.ReportView dismiss(@PathVariable Long id) {
        return moderation.dismiss(id);
    }

    @PostMapping("/reports/{id}/suspend")
    public ModerationService.ReportView suspend(@PathVariable Long id) {
        return moderation.suspend(id);
    }

    @PostMapping("/reports/{id}/restore")
    public ModerationService.ReportView restore(@PathVariable Long id) {
        return moderation.restore(id);
    }
}
