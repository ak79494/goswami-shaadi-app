package com.goswami.shaadi.controller;

import com.goswami.shaadi.service.CallService;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.Map;

@RestController
@RequestMapping("/api/calls")
public class CallController {

    private final CallService calls;

    public CallController(CallService calls) {
        this.calls = calls;
    }

    /** STUN/TURN servers the apps use to connect a call. */
    @GetMapping("/config")
    public Map<String, Object> config() {
        return calls.config();
    }

    @PostMapping("/signal")
    public CallService.SignalResult signal(Authentication a, @RequestBody CallService.Signal signal) {
        return calls.signal((Long) a.getPrincipal(), signal);
    }

    /** The call ringing for me right now, if any (204 when none). */
    @GetMapping("/ringing")
    public ResponseEntity<Map<String, Object>> ringing(Authentication a) {
        return calls.ringingFor((Long) a.getPrincipal())
            .map(ResponseEntity::ok)
            .orElseGet(() -> ResponseEntity.noContent().build());
    }

    /** Call signals I may have missed while my websocket was down (see CallService.signalsFor). */
    @GetMapping("/signals")
    public CallService.Inbox signals(Authentication a, @RequestParam(defaultValue = "0") long after) {
        return calls.signalsFor((Long) a.getPrincipal(), after);
    }

    public record AudioFrame(String callId, String d) {}

    /** Relay-mode voice, sent over the websocket to /app/call.audio (see CallService.relayAudio). */
    @MessageMapping("/call.audio")
    public void audio(Principal user, @Payload AudioFrame frame) {
        if (user == null || frame == null) return;
        calls.relayAudio(Long.valueOf(user.getName()), frame.callId(), frame.d());
    }
}
