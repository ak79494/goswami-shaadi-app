package com.goswami.shaadi.controller;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import java.time.Instant;
import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @ExceptionHandler(IllegalArgumentException.class)
    ResponseEntity<?> bad(IllegalArgumentException e) {
        log.warn("Bad request: {}", e.getMessage());
        return ResponseEntity.badRequest().body(
            Map.of(
                "timestamp", Instant.now(),
                "message", e.getMessage()
            )
        );
    }

    @ExceptionHandler(RuntimeException.class)
    ResponseEntity<?> runtime(RuntimeException e) {
        log.error("Runtime error: {}", e.getMessage(), e);
        return ResponseEntity.status(500).body(
            Map.of(
                "timestamp", Instant.now(),
                "message", e.getMessage() != null ? e.getMessage() : "Internal server error"
            )
        );
    }

    @ExceptionHandler(Exception.class)
    ResponseEntity<?> error(Exception e) {
        log.error("Unexpected error: ", e);
        return ResponseEntity.status(500).body(
            Map.of(
                "timestamp", Instant.now(),
                "message", "Internal server error"
            )
        );
    }
}