package com.goswami.shaadi.controller;

import com.goswami.shaadi.model.*;
import com.goswami.shaadi.dto.PrivacySafetyDtos.*;
import com.goswami.shaadi.service.InteractionService;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.core.Authentication;

import java.util.List;
import org.springframework.web.multipart.MultipartFile;
import java.nio.file.*;
import java.util.UUID;

@RestController
@RequestMapping("/api")
public class InteractionController {

    private final InteractionService s;
    private final String uploadDir;

    public InteractionController(
            InteractionService s,
            @Value("${app.upload-dir}") String uploadDir
    ) {
        this.s = s;
        this.uploadDir = uploadDir;
    }

    private Long uid(Authentication a) {
        return (Long) a.getPrincipal();
    }


    // =========================================================
    // INTEREST
    // =========================================================

    @PostMapping("/requests/{userId}")
    public InterestRequest send(
            Authentication a,
            @PathVariable Long userId
    ) {

        return s.sendInterest(
                uid(a),
                userId
        );
    }


    @GetMapping("/requests/status/{userId}")
    public String interestStatus(
            Authentication a,
            @PathVariable Long userId
    ) {

        return s.interestStatus(
                uid(a),
                userId
        );
    }


    @GetMapping("/requests/incoming")
    public List<InterestRequest> incoming(
            Authentication a
    ) {

        return s.incoming(uid(a));
    }


    @GetMapping("/requests/outgoing")
    public List<InterestRequest> outgoing(
            Authentication a
    ) {

        return s.outgoing(uid(a));
    }


    @PatchMapping("/requests/{id}")
    public InterestRequest respond(
            Authentication a,
            @PathVariable Long id,
            @RequestParam RequestStatus status
    ) {

        return s.respond(
                uid(a),
                id,
                status
        );
    }


    // =========================================================
    // SHORTLIST
    // =========================================================

    @PostMapping("/shortlists/{userId}")
    public void shortlist(
            Authentication a,
            @PathVariable Long userId
    ) {

        s.shortlist(
                uid(a),
                userId
        );
    }


    @GetMapping("/shortlists/status/{userId}")
    public String shortlistStatus(
            Authentication a,
            @PathVariable Long userId
    ) {

        return s.shortlistStatus(
                uid(a),
                userId
        );
    }


    @DeleteMapping("/shortlists/{userId}")
    public void remove(
            Authentication a,
            @PathVariable Long userId
    ) {

        s.removeShortlist(
                uid(a),
                userId
        );
    }


    @GetMapping("/shortlists")
    public List<Shortlist> shortlists(
            Authentication a
    ) {

        return s.shortlists(uid(a));
    }


    // =========================================================
    // HIDE PROFILE
    // =========================================================

    @PostMapping("/hidden-profiles/{userId}")
    public void hide(Authentication a, @PathVariable Long userId) {
        s.hideProfile(uid(a), userId);
    }

    @DeleteMapping("/hidden-profiles/{userId}")
    public void unhide(Authentication a, @PathVariable Long userId) {
        s.unhideProfile(uid(a), userId);
    }

    @GetMapping("/hidden-profiles")
    public List<ProfileActionItem> hiddenProfiles(Authentication a) {
        return s.hiddenProfiles(uid(a)).stream()
                .map(h -> new ProfileActionItem(h.getHiddenUser().getId(), h.getCreatedAt()))
                .toList();
    }

    // =========================================================
    // REPORT PROFILE
    // =========================================================

    @PostMapping(value="/reports/profile", consumes="multipart/form-data")
    public void report(
            Authentication a,
            @RequestParam Long targetUserId,
            @RequestParam String reason,
            @RequestParam(required=false) String details,
            @RequestPart(value="file", required=false) MultipartFile file
    ) throws Exception {
        String evidencePath = null;
        if (file != null && !file.isEmpty()) {
            String original = file.getOriginalFilename() == null ? "evidence" : file.getOriginalFilename();
            String ext = "";
            int dot = original.lastIndexOf('.');
            if (dot >= 0) ext = original.substring(dot).replaceAll("[^A-Za-z0-9.]", "");
            Path dir = Paths.get(uploadDir, "reports").toAbsolutePath().normalize();
            Files.createDirectories(dir);
            String safe = UUID.randomUUID().toString().replace("-", "") + ext;
            Files.copy(file.getInputStream(), dir.resolve(safe), StandardCopyOption.REPLACE_EXISTING);
            evidencePath = "/uploads/reports/" + safe;
        }
        s.reportProfile(uid(a), targetUserId, reason, details, evidencePath);
    }

    // =========================================================
    // BLOCK
    // =========================================================

    @GetMapping("/reports/mine")
    public List<ReportItem> myReports(Authentication a) {
        return s.myReports(uid(a)).stream()
                .map(r -> new ReportItem(r.getId(), r.getReportedUser().getId(), r.getReason(), r.getDetails(), r.getEvidencePath(), r.getCreatedAt()))
                .toList();
    }

    @PostMapping("/blocks/{userId}")
    public void block(
            Authentication a,
            @PathVariable Long userId
    ) {

        s.block(
                uid(a),
                userId
        );
    }


    @DeleteMapping("/blocks/{userId}")
    public void unblock(
            Authentication a,
            @PathVariable Long userId
    ) {

        s.unblock(
                uid(a),
                userId
        );
    }


    @GetMapping("/blocks")
    public List<BlockedMember> blocks(
            Authentication a
    ) {

        return s.blockedMembers(uid(a));
    }
}