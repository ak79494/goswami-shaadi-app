package com.goswami.shaadi.controller;

import com.goswami.shaadi.model.ProfileVisit;
import com.goswami.shaadi.service.ProfileVisitService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/profile-visits")
public class ProfileVisitController {

    private final ProfileVisitService service;

    public ProfileVisitController(ProfileVisitService service) {
        this.service = service;
    }

    private Long uid(Authentication authentication) {
        return (Long) authentication.getPrincipal();
    }

    /**
     * Called by the frontend when the logged-in user opens another user's profile.
     */
    @PostMapping("/{profileUserId}")
    public ResponseEntity<?> recordVisit(
            Authentication authentication,
            @PathVariable Long profileUserId
    ) {
        ProfileVisit visit = service.recordVisit(uid(authentication), profileUserId);

        // Self-profile visits are intentionally ignored.
        if (visit == null) {
            return ResponseEntity.ok().build();
        }

        return ResponseEntity.ok().build();
    }
}
