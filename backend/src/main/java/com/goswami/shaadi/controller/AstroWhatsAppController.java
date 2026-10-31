package com.goswami.shaadi.controller;

import com.goswami.shaadi.service.AstroWhatsAppService;
import jakarta.validation.constraints.NotBlank;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/astro/whatsapp")
public class AstroWhatsAppController {

    private final AstroWhatsAppService service;

    public AstroWhatsAppController(
            AstroWhatsAppService service
    ) {
        this.service = service;
    }

    public record SendRequest(
            @NotBlank String astrologerId,
            @NotBlank String message
    ) {}

    @PostMapping("/message")
    public ResponseEntity<?> sendMessage(
            Authentication authentication,
            @RequestBody SendRequest request
    ) {

        service.sendText(
                request.astrologerId(),
                request.message()
        );

        return ResponseEntity.ok(
                Map.of(
                        "success", true,
                        "message",
                        "Message sent to astrologer WhatsApp"
                )
        );
    }
}