package com.goswami.shaadi.controller;

import com.goswami.shaadi.service.HelpService;
import com.goswami.shaadi.service.HelpService.HelpRequestBody;
import com.goswami.shaadi.service.HelpService.HelpRequestView;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.ArrayDeque;
import java.util.Deque;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@RestController
@RequestMapping("/api")
public class HelpController {

    private static final int MAX_PUBLIC_PER_HOUR = 5;

    private final HelpService help;
    /** Recent public submissions per client address, to keep the open form from being flooded. */
    private final Map<String, Deque<Long>> recentByIp = new ConcurrentHashMap<>();

    public HelpController(HelpService help) {
        this.help = help;
    }

    @PostMapping("/help-requests")
    public HelpRequestView create(Authentication a, @RequestBody HelpRequestBody body) {
        return help.create((Long) a.getPrincipal(), body);
    }

    /** Same form for visitors who haven't signed up yet. */
    @PostMapping("/public/help-requests")
    public HelpRequestView createPublic(HttpServletRequest req, @RequestBody HelpRequestBody body) {
        String forwarded = req.getHeader("X-Forwarded-For");
        String ip = forwarded != null && !forwarded.isBlank() ? forwarded.split(",")[0].trim() : req.getRemoteAddr();
        long now = System.currentTimeMillis();
        Deque<Long> times = recentByIp.computeIfAbsent(ip, k -> new ArrayDeque<>());
        synchronized (times) {
            while (!times.isEmpty() && now - times.peekFirst() > 3_600_000) times.pollFirst();
            if (times.size() >= MAX_PUBLIC_PER_HOUR) {
                throw new ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS,
                    "We already have your request. Our team will call you soon.");
            }
            times.addLast(now);
        }
        return help.create(null, body);
    }
}
