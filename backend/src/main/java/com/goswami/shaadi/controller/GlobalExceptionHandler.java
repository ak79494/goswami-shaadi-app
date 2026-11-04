package com.goswami.shaadi.controller;

import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.multipart.MaxUploadSizeExceededException;
import org.springframework.web.multipart.support.MissingServletRequestPartException;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.servlet.resource.NoResourceFoundException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataAccessException;
import org.springframework.http.*;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.*;
import java.time.Instant;
import java.util.Map;
import java.util.NoSuchElementException;

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

    // @Valid failures (e.g. a blank email on login) are client mistakes, not server errors.
    @ExceptionHandler(MethodArgumentNotValidException.class)
    ResponseEntity<?> invalid(MethodArgumentNotValidException e) {
        String message = e.getBindingResult().getFieldErrors().stream()
            .map(f -> f.getField() + " " + f.getDefaultMessage())
            .findFirst()
            .orElse("Invalid request");
        log.warn("Validation failed: {}", message);
        return ResponseEntity.badRequest().body(
            Map.of(
                "timestamp", Instant.now(),
                "message", message
            )
        );
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    ResponseEntity<?> unreadable(HttpMessageNotReadableException e) {
        log.warn("Unreadable request body: {}", e.getMessage());
        return ResponseEntity.badRequest().body(
            Map.of(
                "timestamp", Instant.now(),
                "message", "Malformed request body"
            )
        );
    }

    // Thrown by bare Optional.orElseThrow() lookups, e.g. a photo or notification id that doesn't exist.
    @ExceptionHandler(NoSuchElementException.class)
    ResponseEntity<?> notFound(NoSuchElementException e) {
        return ResponseEntity.status(404).body(
            Map.of(
                "timestamp", Instant.now(),
                "message", "Not found"
            )
        );
    }

    // A photo or other file that was deleted (apps may still ask for a cached address): a plain 404, not an error.
    @ExceptionHandler(NoResourceFoundException.class)
    ResponseEntity<?> noFile(NoResourceFoundException e) {
        return ResponseEntity.status(404).body(
            Map.of(
                "timestamp", Instant.now(),
                "message", "Not found"
            )
        );
    }

    // Database errors carry raw SQL in their message; log it, but don't send it to clients.
    @ExceptionHandler(DataAccessException.class)
    ResponseEntity<?> database(DataAccessException e) {
        log.error("Database error: {}", e.getMessage(), e);
        return ResponseEntity.status(500).body(
            Map.of(
                "timestamp", Instant.now(),
                "message", "Something went wrong. Please try again."
            )
        );
    }

    @ExceptionHandler(AccessDeniedException.class)
    ResponseEntity<?> forbidden(AccessDeniedException e) {
        return ResponseEntity.status(403).body(
            Map.of("timestamp", Instant.now(), "message", "You don't have access to this")
        );
    }

    @ExceptionHandler(ResponseStatusException.class)
    ResponseEntity<?> status(ResponseStatusException e) {
        return ResponseEntity.status(e.getStatusCode()).body(
            Map.of("timestamp", Instant.now(), "message", e.getReason() != null ? e.getReason() : "Request failed")
        );
    }

    @ExceptionHandler(MaxUploadSizeExceededException.class)
    ResponseEntity<?> tooLarge(MaxUploadSizeExceededException e) {
        return ResponseEntity.status(413).body(
            Map.of("timestamp", Instant.now(), "message", "That file is too large. Photos can be up to 10 MB.")
        );
    }

    @ExceptionHandler({MissingServletRequestPartException.class, MissingServletRequestParameterException.class})
    ResponseEntity<?> missingPart(Exception e) {
        log.warn("Bad request: {}", e.getMessage());
        return ResponseEntity.badRequest().body(
            Map.of("timestamp", Instant.now(), "message", "Something was missing from the request. Please try again.")
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