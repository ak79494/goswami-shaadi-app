package com.goswami.shaadi.security;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;

import java.time.Duration;
import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/** Slows down password guessing: too many wrong passwords for one email and it has to wait a while. */
@Component
public class LoginGuard {

    private static final int MAX_FAILURES = 8;
    private static final Duration LOCK_TIME = Duration.ofMinutes(15);
    private static final int CLEAN_UP_ABOVE = 10_000;

    private record Failures(int count, Instant last) {}

    private final Map<String, Failures> failures = new ConcurrentHashMap<>();

    public void check(String email) {
        Failures f = failures.get(key(email));
        if (f == null) return;
        if (expired(f)) {
            failures.remove(key(email));
        } else if (f.count() >= MAX_FAILURES) {
            throw new ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS,
                "Too many wrong passwords. Please try again in 15 minutes.");
        }
    }

    public void failed(String email) {
        if (failures.size() > CLEAN_UP_ABOVE) failures.values().removeIf(this::expired);
        failures.merge(key(email), new Failures(1, Instant.now()),
            (old, next) -> new Failures(expired(old) ? 1 : old.count() + 1, next.last()));
    }

    public void succeeded(String email) {
        failures.remove(key(email));
    }

    private boolean expired(Failures f) {
        return f.last().plus(LOCK_TIME).isBefore(Instant.now());
    }

    private String key(String email) {
        return email == null ? "" : email.trim().toLowerCase();
    }
}
