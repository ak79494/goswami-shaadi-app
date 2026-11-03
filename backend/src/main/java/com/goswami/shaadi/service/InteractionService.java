package com.goswami.shaadi.service;

import com.goswami.shaadi.dto.PrivacySafetyDtos.BlockedMember;
import com.goswami.shaadi.model.*;
import com.goswami.shaadi.repository.*;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Service
public class InteractionService {

    private static final long COOLDOWN_DAYS = 15;

    /**
     * After a member declines an interest, the sender stays out of their matches and can't send a
     * new interest for this many days. Then the profile comes back into their matches.
     */
    public static final long DECLINE_PAUSE_DAYS = 7;

    private final UserRepository users;
    private final InterestRequestRepository requests;
    private final ShortlistRepository shortlists;
    private final BlockRepository blocks;
    private final NotificationRepository notifications;
    private final HiddenProfileRepository hiddenProfiles;
    private final ProfileReportRepository reports;
    private final ProfileRepository profiles;
    private final ProfilePhotoRepository photos;

    public InteractionService(
            UserRepository u,
            InterestRequestRepository r,
            ShortlistRepository s,
            BlockRepository b,
            NotificationRepository n,
            HiddenProfileRepository h,
            ProfileReportRepository rp,
            ProfileRepository p,
            ProfilePhotoRepository ph
    ) {
        users = u;
        requests = r;
        shortlists = s;
        blocks = b;
        notifications = n;
        hiddenProfiles = h;
        reports = rp;
        profiles = p;
        photos = ph;
    }

    // Notifications show the sender's first name (or Goswami ID), never their email address.
    private String senderLabel(User u) {
        return profiles.findByUserId(u.getId())
                .map(Profile::getFirstName)
                .orElse(u.getGoswamiId());
    }

    // =========================================================
    // SEND INTEREST
    // =========================================================

    @Transactional
    public InterestRequest sendInterest(Long from, Long to) {

        if (from.equals(to)) {
            throw new IllegalArgumentException(
                    "Cannot send interest to yourself"
            );
        }

        User sender = users.findById(from)
                .orElseThrow(() ->
                        new IllegalArgumentException("Sender not found"));

        User receiver = users.findById(to)
                .orElseThrow(() ->
                        new IllegalArgumentException("Receiver not found"));

        checkBlocked(from, to);

        LocalDateTime now = LocalDateTime.now();

        InterestRequest existing =
                requests.findBySenderIdAndReceiverId(from, to)
                        .orElse(null);


        // =====================================================
        // FIRST TIME
        // =====================================================

        if (existing == null) {

            InterestRequest request =
                    new InterestRequest();

            request.setSender(sender);
            request.setReceiver(receiver);
            request.setStatus(RequestStatus.PENDING);
            request.setCreatedAt(now);
            request.setRespondedAt(null);

            InterestRequest saved =
                    requests.save(request);

            notify(
                    receiver,
                    "INTEREST",
                    "New interest request from "
                            + senderLabel(sender)
            );

            return saved;
        }


        // =====================================================
        // ACCEPTED
        // =====================================================

        if (existing.getStatus()
                == RequestStatus.ACCEPTED) {

            throw new IllegalArgumentException(
                    "Interest already accepted"
            );
        }


        // =====================================================
        // PENDING
        // =====================================================

        if (existing.getStatus()
                == RequestStatus.PENDING) {

            LocalDateTime createdAt =
                    existing.getCreatedAt();

            if (createdAt != null) {

                long days =
                        Duration.between(
                                createdAt,
                                now
                        ).toDays();

                if (days < COOLDOWN_DAYS) {

                    long remaining =
                            COOLDOWN_DAYS - days;

                    throw new IllegalArgumentException(
                            "Interest already sent. You can send it again after "
                                    + remaining
                                    + " day(s)."
                    );
                }
            }


            // 15 DAYS COMPLETED
            existing.setStatus(RequestStatus.PENDING);
            existing.setCreatedAt(now);
            existing.setRespondedAt(null);

            InterestRequest saved =
                    requests.save(existing);

            notify(
                    receiver,
                    "INTEREST",
                    "New interest request from "
                            + senderLabel(sender)
            );

            return saved;
        }


        // =====================================================
        // REJECTED
        // Receiver declined -> resend allowed after DECLINE_PAUSE_DAYS
        // =====================================================

        if (existing.getStatus()
                == RequestStatus.REJECTED) {

            LocalDateTime declinedAt = existing.getRespondedAt();
            if (declinedAt != null) {
                long days = Duration.between(declinedAt, now).toDays();
                if (days < DECLINE_PAUSE_DAYS) {
                    throw new IllegalArgumentException(
                            senderLabel(receiver) + " declined your interest recently. You can send it again after "
                                    + (DECLINE_PAUSE_DAYS - days) + " day(s)."
                    );
                }
            }

            existing.setStatus(RequestStatus.PENDING);
            existing.setCreatedAt(now);
            existing.setRespondedAt(null);

            InterestRequest saved =
                    requests.save(existing);

            notify(
                    receiver,
                    "INTEREST",
                    "New interest request from "
                            + senderLabel(sender)
            );

            return saved;
        }


        // =====================================================
        // WITHDRAWN / OTHER
        // =====================================================

        existing.setStatus(RequestStatus.PENDING);
        existing.setCreatedAt(now);
        existing.setRespondedAt(null);

        InterestRequest saved =
                requests.save(existing);

        notify(
                receiver,
                "INTEREST",
                "New interest request from "
                        + senderLabel(sender)
        );

        return saved;
    }


    // =========================================================
    // RESPOND TO INTEREST
    // =========================================================

    @Transactional
    public InterestRequest respond(
            Long uid,
            Long id,
            RequestStatus status
    ) {

        InterestRequest request =
                requests.findById(id)
                        .orElseThrow(() ->
                                new IllegalArgumentException(
                                        "Interest request not found"
                                ));


        boolean isReceiver = request.getReceiver()
                .getId()
                .equals(uid);

        boolean isSender = request.getSender()
                .getId()
                .equals(uid);

        // Accept/Reject can only be performed by the receiver.
        // An already accepted connection can be cancelled by either
        // person from the Accepted section / three-dot menu.
        if (status == RequestStatus.WITHDRAWN) {
            if (!isReceiver && !isSender) {
                throw new IllegalArgumentException("Not allowed");
            }

            if (request.getStatus() != RequestStatus.ACCEPTED) {
                throw new IllegalArgumentException(
                        "Only an accepted connection can be cancelled"
                );
            }
        } else if (!isReceiver) {
            throw new IllegalArgumentException("Not allowed");
        }

        request.setStatus(status);
        request.setRespondedAt(LocalDateTime.now());

        InterestRequest saved = requests.save(request);

        // For cancellation, notify the other member. For accept/reject,
        // notify the original sender as before.
        User notifyUser = isSender
                ? request.getReceiver()
                : request.getSender();

        String message = status == RequestStatus.WITHDRAWN
                ? "Your accepted connection was cancelled"
                : "Your interest request was " + status.name().toLowerCase();

        notify(notifyUser, "INTEREST", message);

        return saved;
    }


    // =========================================================
    // INCOMING
    // =========================================================

    public List<InterestRequest> incoming(Long uid) {

        Set<Long> blocked = blockedWith(uid);

        return requests.findByReceiverIdOrderByCreatedAtDesc(uid).stream()
                .filter(r -> !blocked.contains(r.getSender().getId()))
                .toList();
    }


    // =========================================================
    // OUTGOING
    // =========================================================

    public List<InterestRequest> outgoing(Long uid) {

        Set<Long> blocked = blockedWith(uid);

        return requests.findBySenderIdOrderByCreatedAtDesc(uid).stream()
                .filter(r -> !blocked.contains(r.getReceiver().getId()))
                .toList();
    }


    // =========================================================
    // INTEREST STATUS FOR PROFILE CARD
    // =========================================================

    public String interestStatus(
            Long uid,
            Long targetUserId
    ) {

        // Check BOTH directions. A single interest from either person
        // opens messaging for both users immediately; acceptance is not
        // required for chat access.
        InterestRequest outgoing =
                requests.findBySenderIdAndReceiverId(uid, targetUserId)
                        .orElse(null);

        InterestRequest incoming =
                requests.findBySenderIdAndReceiverId(targetUserId, uid)
                        .orElse(null);

        InterestRequest accepted = null;
        if (outgoing != null && outgoing.getStatus() == RequestStatus.ACCEPTED) {
            accepted = outgoing;
        } else if (incoming != null && incoming.getStatus() == RequestStatus.ACCEPTED) {
            accepted = incoming;
        }

        // Once accepted, keep the button permanently in Accepted state.
        if (accepted != null) {
            return "INTEREST_ACCEPTED";
        }

        // A pending interest in either direction grants chat access.
        if (outgoing != null && outgoing.getStatus() == RequestStatus.PENDING) {
            LocalDateTime createdAt = outgoing.getCreatedAt();
            if (createdAt == null ||
                    Duration.between(createdAt, LocalDateTime.now()).toDays() < COOLDOWN_DAYS) {
                return "INTEREST_SENT";
            }
        }

        if (incoming != null && incoming.getStatus() == RequestStatus.PENDING) {
            LocalDateTime createdAt = incoming.getCreatedAt();
            if (createdAt == null ||
                    Duration.between(createdAt, LocalDateTime.now()).toDays() < COOLDOWN_DAYS) {
                return "INTEREST_RECEIVED";
            }
        }

        return "SEND_INTEREST";
    }

    // =========================================================
    // SHORTLIST
    // =========================================================

    @Transactional
    public void shortlist(
            Long uid,
            Long target
    ) {

        if (uid.equals(target)) {
            throw new IllegalArgumentException(
                    "Cannot shortlist yourself"
            );
        }

        User user =
                users.findById(uid)
                        .orElseThrow(() ->
                                new IllegalArgumentException(
                                        "User not found"
                                ));

        User targetUser =
                users.findById(target)
                        .orElseThrow(() ->
                                new IllegalArgumentException(
                                        "Target user not found"
                                ));

        checkBlocked(uid, target);

        LocalDateTime now =
                LocalDateTime.now();

        Shortlist existing =
                shortlists.findByUserIdAndTargetUserId(
                        uid,
                        target
                ).orElse(null);

        // -----------------------------------------------------
        // FIRST TIME
        // -----------------------------------------------------

        if (existing == null) {

            Shortlist shortlist = new Shortlist();

            shortlist.setUser(user);
            shortlist.setTargetUser(targetUser);
            shortlist.setCreatedAt(now);

            shortlists.save(shortlist);

            return;
        }

        // -----------------------------------------------------
        // EXISTING SHORTLIST
        // -----------------------------------------------------

        LocalDateTime createdAt =
                existing.getCreatedAt();

        if (createdAt != null) {

            long days =
                    Duration.between(
                            createdAt,
                            now
                    ).toDays();

            // Less than 15 days
            if (days < COOLDOWN_DAYS) {

                long remaining =
                        COOLDOWN_DAYS - days;

                throw new IllegalArgumentException(
                        "Profile already shortlisted. You can shortlist it again after "
                                + remaining + " day(s)."
                );
            }
        }

        // 15 days completed
        // Re-use existing row and reset date

        existing.setCreatedAt(now);

        shortlists.save(existing);
    }


    // =========================================================
    // SHORTLIST STATUS
    // =========================================================

    public String shortlistStatus(
            Long uid,
            Long target
    ) {

        Shortlist existing =
                shortlists.findByUserIdAndTargetUserId(
                        uid,
                        target
                ).orElse(null);

        if (existing == null) {
            return "SHORTLIST";
        }

        LocalDateTime createdAt =
                existing.getCreatedAt();

        if (createdAt == null) {
            return "SHORTLISTED";
        }

        long days =
                Duration.between(
                        createdAt,
                        LocalDateTime.now()
                ).toDays();

        if (days >= COOLDOWN_DAYS) {
            return "SHORTLIST";
        }

        return "SHORTLISTED";
    }


    // =========================================================
    // REMOVE SHORTLIST
    // =========================================================

    @Transactional
    public void removeShortlist(
            Long uid,
            Long target
    ) {

        shortlists
                .findByUserIdAndTargetUserId(
                        uid,
                        target
                )
                .ifPresent(shortlists::delete);
    }


    // =========================================================
    // GET SHORTLISTS
    // =========================================================

    public List<Shortlist> shortlists(Long uid) {

        Set<Long> blocked = blockedWith(uid);

        return shortlists
                .findByUserIdOrderByCreatedAtDesc(uid).stream()
                .filter(l -> !blocked.contains(l.getTargetUser().getId()))
                .toList();
    }


    // =========================================================
    // HIDE PROFILE
    // =========================================================

    @Transactional
    public void hideProfile(Long uid, Long target) {
        if (uid.equals(target)) throw new IllegalArgumentException("Cannot hide yourself");
        User user = users.findById(uid).orElseThrow(() -> new IllegalArgumentException("User not found"));
        User targetUser = users.findById(target).orElseThrow(() -> new IllegalArgumentException("Target user not found"));
        if (hiddenProfiles.findByUserIdAndHiddenUserId(uid, target).isEmpty()) {
            HiddenProfile h = new HiddenProfile();
            h.setUser(user);
            h.setHiddenUser(targetUser);
            hiddenProfiles.save(h);
        }
    }

    @Transactional
    public void unhideProfile(Long uid, Long target) {
        hiddenProfiles.findByUserIdAndHiddenUserId(uid, target).ifPresent(hiddenProfiles::delete);
    }

    public List<HiddenProfile> hiddenProfiles(Long uid) {
        return hiddenProfiles.findByUserIdOrderByCreatedAtDesc(uid);
    }

    // =========================================================
    // REPORT PROFILE
    // =========================================================

    @Transactional
    public void reportProfile(Long uid, Long target, String reason, String details, String evidencePath) {
        if (uid.equals(target)) throw new IllegalArgumentException("Cannot report yourself");
        User reporter = users.findById(uid).orElseThrow(() -> new IllegalArgumentException("Reporter not found"));
        User reported = users.findById(target).orElseThrow(() -> new IllegalArgumentException("Reported user not found"));
        if (reason == null || reason.isBlank()) throw new IllegalArgumentException("Report reason is required");
        ProfileReport r = new ProfileReport();
        r.setReporter(reporter);
        r.setReportedUser(reported);
        r.setReason(reason.trim());
        r.setDetails(details == null ? null : details.trim());
        r.setEvidencePath(evidencePath);
        reports.save(r);
        notify(reporter, "REPORT", "Your report has been submitted successfully");
    }

    public List<ProfileReport> myReports(Long uid) {
        return reports.findByReporterIdOrderByCreatedAtDesc(uid);
    }

    // =========================================================
    // BLOCK
    // =========================================================

    @Transactional
    public void block(
            Long uid,
            Long target
    ) {

        User user =
                users.findById(uid)
                        .orElseThrow();

        User targetUser =
                users.findById(target)
                        .orElseThrow();

        if (blocks
                .findByUserIdAndBlockedUserId(
                        uid,
                        target
                )
                .isEmpty()) {

            Block block = new Block();

            block.setUser(user);
            block.setBlockedUser(targetUser);

            blocks.save(block);
        }
    }


    // =========================================================
    // UNBLOCK
    // =========================================================

    @Transactional
    public void unblock(
            Long uid,
            Long target
    ) {

        blocks
                .findByUserIdAndBlockedUserId(
                        uid,
                        target
                )
                .ifPresent(blocks::delete);
    }


    // =========================================================
    // BLOCK LIST
    // =========================================================

    public List<BlockedMember> blockedMembers(Long uid) {

        return blocks.findByUserId(uid).stream()
                .sorted(Comparator.comparing(Block::getCreatedAt).reversed())
                .map(b -> {
                    User u = b.getBlockedUser();
                    String name = profiles.findByUserId(u.getId())
                            .map(p -> (p.getFirstName() + " " + (p.getLastName() == null ? "" : p.getLastName())).trim())
                            .orElse(u.getGoswamiId());
                    List<ProfilePhoto> list = photos.findByUserIdOrderBySortOrderAsc(u.getId());
                    String photo = list.stream()
                            .filter(ProfilePhoto::isPrimaryPhoto)
                            .findFirst()
                            .or(() -> list.stream().findFirst())
                            .map(ProfilePhoto::getUrl)
                            .orElse(null);
                    return new BlockedMember(u.getId(), b.getCreatedAt(), name, u.getGoswamiId(), photo);
                })
                .toList();
    }


    // Members who blocked this member or were blocked by them; each stays out of the other's lists.
    private Set<Long> blockedWith(Long uid) {

        Set<Long> ids = new HashSet<>();

        blocks.findByUserId(uid).forEach(b -> ids.add(b.getBlockedUser().getId()));
        blocks.findByBlockedUserId(uid).forEach(b -> ids.add(b.getUser().getId()));

        return ids;
    }


    // =========================================================
    // BLOCK CHECK
    // =========================================================

    private void checkBlocked(
            Long from,
            Long to
    ) {

        if (
                blocks
                        .findByUserIdAndBlockedUserId(
                                from,
                                to
                        )
                        .isPresent()
                        ||
                blocks
                        .findByUserIdAndBlockedUserId(
                                to,
                                from
                        )
                        .isPresent()
        ) {

            throw new IllegalArgumentException(
                    "Interaction unavailable"
            );
        }
    }


    // =========================================================
    // NOTIFICATION
    // =========================================================

    private void notify(
            User user,
            String type,
            String message
    ) {

        Notification n = new Notification();

        n.setUser(user);
        n.setType(type);
        n.setMessage(message);

        notifications.save(n);
    }
}