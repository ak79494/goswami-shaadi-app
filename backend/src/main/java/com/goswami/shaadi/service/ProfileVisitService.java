package com.goswami.shaadi.service;

import com.goswami.shaadi.model.Notification;
import com.goswami.shaadi.model.Profile;
import com.goswami.shaadi.model.ProfileVisit;
import com.goswami.shaadi.model.User;
import com.goswami.shaadi.repository.NotificationRepository;
import com.goswami.shaadi.repository.ProfileRepository;
import com.goswami.shaadi.repository.ProfileVisitRepository;
import com.goswami.shaadi.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
public class ProfileVisitService {

    private final ProfileVisitRepository visits;
    private final UserRepository users;
    private final ProfileRepository profiles;
    private final NotificationRepository notifications;

    public ProfileVisitService(
            ProfileVisitRepository visits,
            UserRepository users,
            ProfileRepository profiles,
            NotificationRepository notifications
    ) {
        this.visits = visits;
        this.users = users;
        this.profiles = profiles;
        this.notifications = notifications;
    }

    /**
     * Records that visitorUserId opened profileUserId's profile and
     * creates a persistent notification for the profile owner.
     */
    @Transactional
    public ProfileVisit recordVisit(Long visitorUserId, Long profileUserId) {

        if (visitorUserId == null || profileUserId == null) {
            throw new IllegalArgumentException("Visitor and profile user IDs are required");
        }

        // Never create a notification when someone opens their own profile.
        if (visitorUserId.equals(profileUserId)) {
            return null;
        }

        User visitor = users.findById(visitorUserId)
                .orElseThrow(() -> new IllegalArgumentException("Visitor user not found"));

        User profileUser = users.findById(profileUserId)
                .orElseThrow(() -> new IllegalArgumentException("Profile owner not found"));

        Profile profile = profiles.findByUserId(visitorUserId).orElse(null);
        String visitorName = buildVisitorName(profile, visitor);

        ProfileVisit visit = new ProfileVisit();
        visit.setVisitor(visitor);
        visit.setProfileUser(profileUser);
        visit.setVisitedAt(LocalDateTime.now());

        ProfileVisit saved = visits.save(visit);

        Notification notification = new Notification();
        notification.setUser(profileUser);
        notification.setType("PROFILE_VISIT");
        notification.setMessage(visitorName + " visited your profile.");
        notification.setRead(false);
        notification.setCreatedAt(LocalDateTime.now());
        notifications.save(notification);

        return saved;
    }

    private String buildVisitorName(Profile profile, User visitor) {
        if (profile != null) {
            String first = profile.getFirstName() == null ? "" : profile.getFirstName().trim();
            String last = profile.getLastName() == null ? "" : profile.getLastName().trim();
            String full = (first + " " + last).trim();
            if (!full.isBlank()) {
                return full;
            }
        }

        if (visitor.getGoswamiId() != null && !visitor.getGoswamiId().isBlank()) {
            return visitor.getGoswamiId();
        }

        return "Someone";
    }
}
