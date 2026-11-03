package com.goswami.shaadi.controller;

import com.goswami.shaadi.service.PushService;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/devices/token")
public class DeviceController {

    private final PushService push;

    public DeviceController(PushService push) {
        this.push = push;
    }

    @PostMapping
    public void save(Authentication a, @RequestBody Map<String, String> body) {
        push.saveToken((Long) a.getPrincipal(), body.get("token"));
    }

    @PostMapping("/remove")
    public void remove(Authentication a, @RequestBody Map<String, String> body) {
        push.removeToken((Long) a.getPrincipal(), body.get("token"));
    }
}
